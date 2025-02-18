import { D1Database } from '@cloudflare/workers-types'
import { type NextRequest } from 'next/server'
import { createServerClient } from './client'

export interface Env {
  DB: D1Database;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

interface Profile {
  id: string;
  email: string;
  created_at: string;
  full_name?: string;
}

interface Transcription {
  id: string;
  created_at: string;
  user_id: string;
  storage_path: string;
  status: string;
  cloudflare_worker_id?: string;
  metadata?: string;
  error?: string;
  text?: string;
}

interface D1QueryResult<T> {
  results: T[];
  success: boolean;
  error?: string;
}

interface D1Row {
  id: string;
  created_at: string;
  [key: string]: unknown;
}

export async function getUser(request: NextRequest, env: Env): Promise<{ id: string; email: string } | null> {
  // Get the authorization header which contains the user's JWT
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    console.error('No Bearer token found in authorization header')
    return null
  }
  
  const token = authHeader.split(' ')[1]
  if (!token) {
    console.error('Empty token in authorization header')
    return null
  }

  try {
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing Supabase environment variables:', {
        hasUrl: !!env.SUPABASE_URL,
        hasKey: !!env.SUPABASE_SERVICE_ROLE_KEY
      })
      throw new Error('Missing Supabase configuration')
    }

    // Create Supabase client with service role key to verify the token
    const supabase = createServerClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

    // Verify the JWT and get user data
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error) {
      console.error('Error verifying user token:', error)
      return null
    }

    if (!user) {
      console.error('No user found for token')
      return null
    }

    if (!user.email) {
      console.error('User has no email:', user)
      return null
    }

    return {
      id: user.id,
      email: user.email
    }
  } catch (error) {
    console.error('Error getting user:', error)
    return null
  }
}

// Security middleware for database operations
export async function secureDbOperation<T>(
  db: D1Database,
  userId: string | null,
  operation: 'read' | 'write',
  table: 'profiles' | 'transcriptions',
  action: () => Promise<T>
): Promise<T> {
  if (!userId) {
    console.error('Security check failed: No user ID provided')
    throw new Error('Authentication required')
  }

  try {
    // For profiles table, users can only access their own profile
    if (table === 'profiles') {
      const { results } = await db
        .prepare('SELECT 1 FROM profiles WHERE id = ?')
        .bind(userId)
        .all()
      
      if (operation === 'write' && results.length > 0) {
        console.error('Security check failed: Cannot modify other users\' profiles')
        throw new Error('Cannot modify other users\' profiles')
      }
    }

    // For transcriptions, users can only access their own transcriptions
    if (table === 'transcriptions') {
      if (operation === 'write') {
        // Verify user exists before allowing transcription creation
        const { results } = await db
          .prepare('SELECT 1 FROM profiles WHERE id = ?')
          .bind(userId)
          .all()
        
        if (results.length === 0) {
          console.error('Security check failed: User profile not found')
          throw new Error('User profile not found')
        }
      }

      // For read operations, filter by user_id
      if (operation === 'read') {
        const originalAction = action
        action = async () => {
          const result = await originalAction()
          if (result && typeof result === 'object' && 'results' in result) {
            const queryResult = result as unknown as D1QueryResult<{ user_id: string }>
            queryResult.results = queryResult.results.filter(row => row.user_id === userId)
          }
          return result
        }
      }
    }

    console.log(`Executing ${operation} operation on ${table} table for user ${userId}`)
    return await action()
  } catch (error) {
    console.error(`Security check error for ${operation} on ${table}:`, error)
    throw error
  }
}

// Helper to format D1 error messages
export function formatD1Error(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'Unknown database error'
}

// Secure database operation helpers
export async function createTranscription(
  db: D1Database,
  userId: string,
  data: { storage_path: string; status: string }
): Promise<{ id: string }> {
  return secureDbOperation(db, userId, 'write', 'transcriptions', async () => {
    const id = crypto.randomUUID()
    const { success } = await db
      .prepare('INSERT INTO transcriptions (id, created_at, user_id, storage_path, status) VALUES (?, ?, ?, ?, ?)')
      .bind(id, new Date().toISOString(), userId, data.storage_path, data.status)
      .run()
    
    if (!success) throw new Error('Failed to create transcription')
    return { id }
  })
}

export async function getTranscriptions(
  db: D1Database,
  userId: string | null
): Promise<Transcription[]> {
  const result = await secureDbOperation(db, userId, 'read', 'transcriptions', async () => {
    const { results, success } = await db
      .prepare('SELECT * FROM transcriptions WHERE user_id = ?')
      .bind(userId)
      .all()
    
    if (!success) throw new Error('Failed to fetch transcriptions')
    return { results, success }
  })

  return (result.results as D1Row[]).map(row => ({
    id: String(row.id),
    created_at: String(row.created_at),
    user_id: String(row.user_id),
    storage_path: String(row.storage_path),
    status: String(row.status),
    cloudflare_worker_id: row.cloudflare_worker_id ? String(row.cloudflare_worker_id) : undefined,
    metadata: row.metadata ? String(row.metadata) : undefined,
    error: row.error ? String(row.error) : undefined,
    text: row.text ? String(row.text) : undefined
  }))
}

export async function getProfile(
  db: D1Database,
  userId: string | null
): Promise<Profile | null> {
  const result = await secureDbOperation(db, userId, 'read', 'profiles', async () => {
    const { results, success } = await db
      .prepare('SELECT * FROM profiles WHERE id = ?')
      .bind(userId)
      .all()
    
    if (!success) throw new Error('Failed to fetch profile')
    return { results, success }
  })
  
  if (!result.results.length) return null
  
  const row = result.results[0] as D1Row
  return {
    id: String(row.id),
    email: String(row.email),
    created_at: String(row.created_at),
    full_name: row.full_name ? String(row.full_name) : undefined
  }
}

export async function updateProfile(
  db: D1Database,
  userId: string,
  data: { email: string }
): Promise<void> {
  await secureDbOperation(db, userId, 'write', 'profiles', async () => {
    const { success } = await db
      .prepare('UPDATE profiles SET email = ? WHERE id = ?')
      .bind(data.email, userId)
      .run()
    
    if (!success) throw new Error('Failed to update profile')
    return { success }
  })
}

export async function verifyUserOwnership(db: D1Database, userId: string, resourceId: string, table: 'profiles' | 'transcriptions'): Promise<boolean> {
  if (table === 'profiles') {
    // For profiles, just check if the profile ID matches the user ID
    return userId === resourceId
  }
  
  // For transcriptions, check if the transcription belongs to the user
  const { results } = await db
    .prepare('SELECT 1 FROM transcriptions WHERE id = ? AND user_id = ?')
    .bind(resourceId, userId)
    .all()
    
  return results.length > 0
} 