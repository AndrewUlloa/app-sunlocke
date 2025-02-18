import { NextResponse, type NextRequest } from 'next/server'
import { getUser, formatD1Error, secureDbOperation, type Env } from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'

interface TestResult {
  success: boolean
  message: string
  data?: unknown
  error?: string
}

export async function GET(request: NextRequest, { env }: { env: Env }) {
  const testResults: Record<string, TestResult> = {}
  const db = env.DB

  try {
    // Test 1: Get current user first
    const user = await getUser(request, env)
    testResults['get_user'] = {
      success: !!user,
      message: user ? 'Successfully got user' : 'Auth session missing!',
      data: user
    }

    // Test 2: Read profiles with security check
    try {
      const { results } = await secureDbOperation(db, user?.id ?? null, 'read', 'profiles', async () => {
        return db.prepare('SELECT * FROM profiles').all()
      })
      
      testResults['read_profiles'] = {
        success: true,
        message: 'Successfully read profiles',
        data: results
      }
    } catch (error) {
      console.error('Profile read error:', error)
      testResults['read_profiles'] = {
        success: false,
        message: 'Failed to read profiles',
        error: formatD1Error(error)
      }
    }

    // Test 3: Read transcriptions with security check
    try {
      const { results } = await secureDbOperation(db, user?.id ?? null, 'read', 'transcriptions', async () => {
        return db.prepare('SELECT * FROM transcriptions').all()
      })
      
      testResults['read_transcriptions'] = {
        success: true,
        message: 'Successfully read transcriptions',
        data: results
      }
    } catch (error) {
      console.error('Transcription read error:', error)
      testResults['read_transcriptions'] = {
        success: false,
        message: 'Failed to read transcriptions',
        error: formatD1Error(error)
      }
    }

    // Only run write tests if we have a user
    if (user) {
      // Test 4: Try to create a transcription with a different user_id
      const fakeUserId = '00000000-0000-0000-0000-000000000000'
      try {
        await secureDbOperation(db, fakeUserId, 'write', 'transcriptions', async () => {
          return db
            .prepare('INSERT INTO transcriptions (id, created_at, user_id, storage_path, status) VALUES (?, ?, ?, ?, ?)')
            .bind(uuidv4(), new Date().toISOString(), fakeUserId, 'test.mp3', 'pending')
            .run()
        })
        
        testResults['create_bad_transcription'] = {
          success: false,
          message: 'WARNING: Was able to create transcription with invalid user_id'
        }
      } catch (error) {
        console.error('Bad transcription create error (expected):', error)
        testResults['create_bad_transcription'] = {
          success: true,
          message: 'Security check correctly blocked invalid user_id'
        }
      }

      // Test 5: Create a valid transcription with security check
      try {
        const transcriptionId = uuidv4()
        await secureDbOperation(db, user.id, 'write', 'transcriptions', async () => {
          // First ensure user has a profile
          await db
            .prepare('INSERT OR REPLACE INTO profiles (id, email, created_at) VALUES (?, ?, ?)')
            .bind(user.id, user.email, new Date().toISOString())
            .run()

          // Then create transcription
          return db
            .prepare('INSERT INTO transcriptions (id, created_at, user_id, storage_path, status) VALUES (?, ?, ?, ?, ?)')
            .bind(transcriptionId, new Date().toISOString(), user.id, 'valid-test.mp3', 'pending')
            .run()
        })
        
        testResults['create_good_transcription'] = {
          success: true,
          message: 'Successfully created transcription',
          data: { id: transcriptionId }
        }
      } catch (error) {
        console.error('Good transcription create error:', error)
        testResults['create_good_transcription'] = {
          success: false,
          message: 'Failed to create transcription',
          error: formatD1Error(error)
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'RLS tests completed',
      results: testResults
    })

  } catch (error) {
    console.error('RLS test global error:', error)
    return NextResponse.json({
      success: false,
      message: 'RLS tests failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      results: testResults
    }, { status: 500 })
  }
} 