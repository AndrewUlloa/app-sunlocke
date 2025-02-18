import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'

// Ensure environment variables exist
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your environment configuration.')
}

// Browser client for frontend use
export const createClient = () => {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

// Server client for backend use
export function createServerClient(url: string, serviceRoleKey: string) {
  if (!url || !serviceRoleKey) {
    throw new Error('Missing Supabase credentials for server client')
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: {
      persistSession: false, // We don't want to persist the session in Workers
      autoRefreshToken: false // Disable auto-refresh since we're using the service role key
    }
  })
} 