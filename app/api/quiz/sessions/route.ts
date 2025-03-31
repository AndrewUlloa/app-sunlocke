import { NextResponse } from 'next/server';
import { executeD1Query, type QuizSession } from '@/app/lib/db';

export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { first_name, last_name, email, industry, q0_channels } = body;

    // Insert new session
    const result = await executeD1Query(
      `INSERT INTO QuizSessions (first_name, last_name, email, industry, q0_channels)
       VALUES (?, ?, ?, ?, ?)
       RETURNING *`,
      [first_name, last_name, email, industry, q0_channels]
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    const result = await executeD1Query(
      'SELECT * FROM QuizSessions WHERE session_id = ?',
      [sessionId]
    );

    if (!result) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 });
  }
} 