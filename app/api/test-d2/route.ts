interface TestResult {
  success: boolean;
  message: string;
  data?: unknown;
  error?: string;
}

interface PreparedStatement {
  bind(...args: unknown[]): PreparedStatement;
  all(): Promise<{ results: unknown[] }>;
  run(): Promise<unknown>;
  first(): Promise<unknown>;
}

interface D2Database {
  prepare(query: string): PreparedStatement;
}

// Add Transcription interface
interface Transcription {
  id: string;
  created_at: string;
  user_id: string;
  storage_path: string;
  status: string;
}
export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'

export async function GET(request: Request, context: { env?: { DB?: D2Database } }) {
  try {
    const testResults: Record<string, TestResult> = {};
    let db = context.env?.DB;

    // If DB connection is not provided, use a mock for local development
    if (!db) {
      if (process.env.NODE_ENV === "development") {
        // In-memory store for inserted transcriptions
        const mockTranscriptions: Record<string, Transcription> = {};
        
        const mockDb: D2Database = {
          prepare: (query: string) => {
            // Extend the PreparedStatement with a boundArgs property
            const ps = {} as PreparedStatement & { boundArgs: unknown[] };
            ps.boundArgs = [];
            ps.bind = function (...args: unknown[]) {
              ps.boundArgs = args;
              return ps;
            };
            ps.all = async () => {
              if (query === "SELECT 1") {
                return { results: [ { "1": 1 } ] };
              } else if (query === "SELECT * FROM profiles") {
                return { results: [] };
              }
              return { results: [] };
            };
            ps.run = async () => {
              if (query.startsWith("INSERT INTO transcriptions")) {
                const transcriptionId = ps.boundArgs[0] as string;
                mockTranscriptions[transcriptionId] = {
                  id: transcriptionId,
                  created_at: ps.boundArgs[1] as string,
                  user_id: ps.boundArgs[2] as string,
                  storage_path: ps.boundArgs[3] as string,
                  status: ps.boundArgs[4] as string
                };
              }
              return {};
            };
            ps.first = async () => {
              if (query.startsWith("SELECT * FROM transcriptions")) {
                const transcriptionId = (ps.boundArgs && ps.boundArgs[0]) as string;
                return mockTranscriptions[transcriptionId] || null;
              }
              return null;
            };
            return ps;
          }
        };
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
      const connectivityResult = await db.prepare('SELECT 1').all();
      // Check if the first column's value is 1
      const row = connectivityResult.results[0];
      const value = row ? Object.values(row)[0] : null;
      if (value === 1) {
        testResults['connectivity'] = {
          success: true,
          message: 'DB connectivity established',
          data: connectivityResult
        };
      } else {
        testResults['connectivity'] = {
          success: false,
          message: 'Unexpected result from SELECT 1',
          data: connectivityResult
        };
      }
    } catch (error) {
      testResults['connectivity'] = {
        success: false,
        message: 'DB connectivity failed',
        error: error instanceof Error ? error.message : String(error)
      };
    }

    // Test 2: Read all profiles from profiles table
    try {
      const profiles = await db.prepare('SELECT * FROM profiles').all();
      testResults['read_profiles'] = {
        success: true,
        message: 'Read profiles successfully',
        data: profiles
      };
    } catch (error) {
      testResults['read_profiles'] = {
        success: false,
        message: 'Failed to read profiles',
        error: error instanceof Error ? error.message : String(error)
      };
    }

    // Test 3: Write test: Insert a dummy transcription record, then read it back
    const transcriptionId = uuidv4();
    try {
      await db.prepare('INSERT INTO transcriptions (id, created_at, user_id, storage_path, status) VALUES (?, ?, ?, ?, ?)')
        .bind(transcriptionId, new Date().toISOString(), 'test_user', 'test.mp3', 'pending')
        .run();

      const inserted = await db.prepare('SELECT * FROM transcriptions WHERE id = ?')
        .bind(transcriptionId)
        .first();

      if (inserted) {
        testResults['insert_transcription'] = {
          success: true,
          message: 'Successfully inserted and retrieved test transcription',
          data: inserted
        };
      } else {
        testResults['insert_transcription'] = {
          success: false,
          message: 'Inserted transcription not found.'
        };
      }
    } catch (error) {
      testResults['insert_transcription'] = {
        success: false,
        message: 'Failed to insert test transcription',
        error: error instanceof Error ? error.message : String(error)
      };
    }

    const overallSuccess = Object.values(testResults).every(test => test.success);

    return NextResponse.json({
      success: overallSuccess,
      message: overallSuccess ? 'Cloudflare D2 tests passed' : 'Cloudflare D2 tests failed',
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