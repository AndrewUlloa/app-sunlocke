import { NextResponse } from 'next/server';
import { QuizResponse, Report } from '@/lib/types';
import { sendQuizCompletionEmail } from '@/lib/emailService';

interface D1Row {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  industry: string;
  selected_channels: string;
  responses: string;
  scores: string;
  timestamp: string;
  insights?: string;
  recommendations?: string;
}

export async function GET(request: Request) {
  try {
    const D1_DATABASE_ID = process.env.D1_DATABASE_ID || '5d861285-afcf-488f-beaa-be3dc0ed15ea';
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    const query = `
      SELECT 
        qr.*,
        r.insights,
        r.recommendations
      FROM quiz_responses qr
      LEFT JOIN reports r ON qr.id = r.quiz_response_id
      ORDER BY qr.timestamp DESC
      LIMIT ? OFFSET ?
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM quiz_responses
    `;

    const [responsesResult, countResult] = await Promise.all([
      fetch('https://api.cloudflare.com/client/v4/d1/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`
        },
        body: JSON.stringify({
          database_id: D1_DATABASE_ID,
          query,
          params: [limit, offset]
        })
      }),
      fetch('https://api.cloudflare.com/client/v4/d1/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`
        },
        body: JSON.stringify({
          database_id: D1_DATABASE_ID,
          query: countQuery
        })
      })
    ]);

    if (!responsesResult.ok || !countResult.ok) {
      throw new Error('Failed to fetch responses');
    }

    const responses = await responsesResult.json();
    const count = await countResult.json();

    return NextResponse.json({
      responses: responses.result.map((row: D1Row) => ({
        id: row.id,
        visitorInfo: {
          firstName: row.first_name,
          lastName: row.last_name,
          email: row.email,
          industry: row.industry
        },
        selectedChannels: JSON.parse(row.selected_channels),
        responses: JSON.parse(row.responses),
        scores: JSON.parse(row.scores),
        timestamp: row.timestamp,
        report: row.insights ? {
          insights: row.insights,
          recommendations: JSON.parse(row.recommendations!)
        } : null
      })),
      pagination: {
        total: count.result[0].total,
        page,
        limit,
        totalPages: Math.ceil(count.result[0].total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching responses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch responses' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const D1_DATABASE_ID = process.env.D1_DATABASE_ID || '5d861285-afcf-488f-beaa-be3dc0ed15ea';
    const body = await request.json();
    const quizResponse: QuizResponse = body.response;
    const report: Report | undefined = body.report;

    // Store quiz response
    const responseQuery = `
      INSERT INTO quiz_responses (
        id,
        first_name,
        last_name,
        email,
        industry,
        selected_channels,
        responses,
        scores,
        timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await fetch('https://api.cloudflare.com/client/v4/d1/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`
      },
      body: JSON.stringify({
        database_id: D1_DATABASE_ID,
        query: responseQuery,
        params: [
          quizResponse.id,
          quizResponse.visitorInfo.firstName,
          quizResponse.visitorInfo.lastName,
          quizResponse.visitorInfo.email,
          quizResponse.visitorInfo.industry,
          JSON.stringify(quizResponse.selectedChannels),
          JSON.stringify(quizResponse.responses),
          JSON.stringify(quizResponse.scores),
          new Date().toISOString()
        ]
      })
    });

    // If there's a report, store it and send email
    if (report) {
      const reportQuery = `
        INSERT INTO reports (
          id,
          quiz_response_id,
          insights,
          recommendations,
          timestamp
        ) VALUES (?, ?, ?, ?, ?)
      `;

      await fetch('https://api.cloudflare.com/client/v4/d1/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`
        },
        body: JSON.stringify({
          database_id: D1_DATABASE_ID,
          query: reportQuery,
          params: [
            report.id,
            report.quizResponseId,
            report.insights,
            JSON.stringify(report.recommendations),
            new Date().toISOString()
          ]
        })
      });

      // Send email notification
      try {
        await sendQuizCompletionEmail(quizResponse, report);
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError);
        // Don't fail the request if email sending fails
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error storing quiz response:', error);
    return NextResponse.json(
      { error: 'Failed to store quiz response' },
      { status: 500 }
    );
  }
} 