import { D1Database } from '@cloudflare/workers-types'
import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'

interface TestResult {
  success: boolean;
  message: string;
  data?: unknown;
  error?: string;
}

interface Transcription {
  id: string;
  created_at: string;
  user_id: string;
  storage_path: string;
  status: string;
}

export const runtime = 'edge'
export const preferredRegion = 'auto'

export interface RequestWithEnv extends Request {
  env?: {
    DB: D1Database;
  };
}

export async function GET(request: Request) {
  const env = (request as RequestWithEnv).env;
  try {
    const testResults: Record<string, TestResult> = {};
    let db = env?.DB as D1Database | undefined;

    // If DB connection is not provided, use a mock for local development
    if (!db) {
      if (process.env.NODE_ENV === "development") {
        // In-memory store for inserted transcriptions
        const mockTranscriptions: Record<string, Transcription> = {};
        
        const mockDb = {
          prepare: (query: string) => ({
            bind: (...args: unknown[]) => ({
              all: async () => {
                if (query === "SELECT 1") {
                  return { results: [{ "1": 1 }] };
                } else if (query === "SELECT * FROM profiles") {
                  return { results: [] };
                }
                return { results: [] };
              },
              run: async () => {
                if (query.startsWith("INSERT INTO transcriptions")) {
                  const [id, created_at, user_id, storage_path, status] = args;
                  mockTranscriptions[id as string] = {
                    id: id as string,
                    created_at: created_at as string,
                    user_id: user_id as string,
                    storage_path: storage_path as string,
                    status: status as string
                  };
                }
                return { success: true };
              },
              first: async () => {
                if (query.startsWith("SELECT * FROM transcriptions")) {
                  return mockTranscriptions[args[0] as string] || null;
                }
                return null;
              }
            })
          })
        } as unknown as D1Database;
        
        db = mockDb;
      } else {
        return NextResponse.json({
          success: false,
          message: 'Database connection not available',
          results: {}
        }, { status: 500 });
      }
    }

    // Test 1: Basic DB connectivity test using a simple SELECT 1 query
    try {
      const { results } = await db.prepare('SELECT 1').bind().all();
      const value = results[0] ? Object.values(results[0])[0] : null;
      
      testResults['connectivity'] = {
        success: value === 1,
        message: value === 1 ? 'DB connectivity established' : 'Unexpected result from SELECT 1',
        data: { results }
      };
    } catch (error) {
      testResults['connectivity'] = {
        success: false,
        message: 'DB connectivity failed',
        error: error instanceof Error ? error.message : String(error)
      };
    }

    // Test 2: Read all profiles from profiles table
    try {
      const { results } = await db.prepare('SELECT * FROM profiles').bind().all();
      testResults['read_profiles'] = {
        success: true,
        message: 'Read profiles successfully',
        data: { results }
      };
    } catch (error) {
      testResults['read_profiles'] = {
        success: false,
        message: 'Failed to read profiles',
        error: error instanceof Error ? error.message : String(error)
      };
    }

    // Test 3: Write test: Insert a dummy profile and transcription
    const userId = uuidv4();
    const transcriptionId = uuidv4();
    try {
      // First create a profile
      const { success: profileSuccess } = await db
        .prepare('INSERT INTO profiles (id, user_id, email) VALUES (?, ?, ?)')
        .bind(userId, userId, 'test@example.com')
        .run();

      if (!profileSuccess) {
        throw new Error('Failed to insert test profile');
      }

      // Then create a transcription linked to the profile
      const { success: transcriptionSuccess } = await db
        .prepare('INSERT INTO transcriptions (id, user_id, storage_path, status) VALUES (?, ?, ?, ?)')
        .bind(transcriptionId, userId, 'test.mp3', 'pending')
        .run();

      if (!transcriptionSuccess) {
        throw new Error('Failed to insert test transcription');
      }

      const result = await db
        .prepare('SELECT t.*, p.email FROM transcriptions t JOIN profiles p ON t.user_id = p.user_id WHERE t.id = ?')
        .bind(transcriptionId)
        .first();

      testResults['insert_transcription'] = {
        success: !!result,
        message: result ? 'Successfully inserted and retrieved test transcription with profile' : 'Inserted transcription not found',
        data: result
      };
    } catch (error) {
      testResults['insert_transcription'] = {
        success: false,
        message: 'Failed to insert test data',
        error: error instanceof Error ? error.message : String(error)
      };
    }

    const overallSuccess = Object.values(testResults).every(test => test.success);

    return NextResponse.json({
      success: overallSuccess,
      message: overallSuccess ? 'D1 database tests passed' : 'D1 database tests failed',
      results: testResults
    });
  } catch (error) {
    console.error('Unhandled error in /api/test-d2:', error);
    return NextResponse.json({
      success: false,
      message: 'Unhandled error: ' + (error instanceof Error ? error.message : String(error)),
      results: {}
    }, { status: 500 });
  }
} 