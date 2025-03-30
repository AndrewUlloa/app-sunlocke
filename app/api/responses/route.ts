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

async function ensureTablesExist(accountId: string, dbId: string, token: string) {
  const createTablesQuery = `
    CREATE TABLE IF NOT EXISTS quiz_responses (
      id TEXT PRIMARY KEY,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT NOT NULL,
      industry TEXT NOT NULL,
      selected_channels TEXT NOT NULL,
      responses TEXT NOT NULL,
      scores TEXT NOT NULL,
      timestamp TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      quiz_response_id TEXT NOT NULL,
      insights TEXT NOT NULL,
      recommendations TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      FOREIGN KEY (quiz_response_id) REFERENCES quiz_responses(id)
    );

    CREATE INDEX IF NOT EXISTS idx_quiz_responses_timestamp ON quiz_responses(timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_reports_quiz_response_id ON reports(quiz_response_id);
  `;

  const result = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${dbId}/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      sql: createTablesQuery
    })
  });

  if (!result.ok) {
    const error = await result.text();
    console.error('Failed to create tables:', error);
    throw new Error('Failed to create database tables');
  }

  return result.json();
}

export async function GET(request: Request) {
  try {
    const D1_DATABASE_ID = process.env.D1_DATABASE_ID;
    const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
    const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;

    if (!D1_DATABASE_ID || !CLOUDFLARE_API_TOKEN || !CLOUDFLARE_ACCOUNT_ID) {
      console.error('Missing required environment variables:', {
        hasD1Id: !!D1_DATABASE_ID,
        hasApiToken: !!CLOUDFLARE_API_TOKEN,
        hasAccountId: !!CLOUDFLARE_ACCOUNT_ID
      });
      throw new Error('Missing required environment variables');
    }

    // Ensure tables exist before querying
    await ensureTablesExist(CLOUDFLARE_ACCOUNT_ID, D1_DATABASE_ID, CLOUDFLARE_API_TOKEN);

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

    console.log('Making D1 API requests:', {
      url: `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/d1/database/${D1_DATABASE_ID}/query`,
      queries: { query, countQuery },
      params: { limit, offset }
    });

    const [responsesResult, countResult] = await Promise.all([
      fetch(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/d1/database/${D1_DATABASE_ID}/query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sql: query,
          params: [limit, offset]
        })
      }),
      fetch(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/d1/database/${D1_DATABASE_ID}/query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sql: countQuery
        })
      })
    ]);

    console.log('D1 API Response Status:', {
      responsesStatus: responsesResult.status,
      countStatus: countResult.status
    });

    if (!responsesResult.ok || !countResult.ok) {
      const responseError = await responsesResult.text();
      const countError = await countResult.text();
      console.error('D1 API Error Details:', {
        responsesStatus: responsesResult.status,
        responsesError: responseError,
        responsesHeaders: Object.fromEntries(responsesResult.headers.entries()),
        countStatus: countResult.status,
        countError: countError,
        countHeaders: Object.fromEntries(countResult.headers.entries())
      });
      throw new Error(`Failed to fetch from D1 database: ${responseError}`);
    }

    let responsesText, countText;
    try {
      responsesText = await responsesResult.text();
      countText = await countResult.text();
      console.log('Raw API Responses:', { responsesText, countText });

      const responses = JSON.parse(responsesText);
      const count = JSON.parse(countText);

      if (!responses.success || !count.success) {
        console.error('D1 Query Error:', {
          responses,
          count
        });
        throw new Error('D1 query failed: ' + JSON.stringify(responses.errors || responses.error));
      }

      if (!responses.result?.[0]?.results || !count.result?.[0]?.results) {
        console.error('Unexpected D1 response format:', {
          responses,
          count
        });
        throw new Error('Unexpected D1 response format');
      }

      const quizResponses = responses.result[0].results;
      const total = count.result[0].results[0].total;

      console.log('Successfully processed responses:', {
        count: quizResponses.length,
        total
      });

      return NextResponse.json({
        responses: quizResponses.map((row: D1Row) => ({
          id: row.id,
          visitorInfo: {
            firstName: row.first_name,
            lastName: row.last_name,
            email: row.email,
            industry: row.industry
          },
          selectedChannels: JSON.parse(row.selected_channels || '[]'),
          responses: JSON.parse(row.responses || '{}'),
          scores: JSON.parse(row.scores || '{}'),
          timestamp: row.timestamp,
          report: row.insights ? {
            insights: row.insights,
            recommendations: JSON.parse(row.recommendations || '[]')
          } : null
        })),
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (parseError: unknown) {
      console.error('Error parsing D1 response:', {
        parseError,
        responsesText,
        countText
      });
      throw new Error(`Failed to parse D1 response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Error in GET /api/responses:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const D1_DATABASE_ID = process.env.D1_DATABASE_ID;
    const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
    const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;

    if (!D1_DATABASE_ID || !CLOUDFLARE_API_TOKEN || !CLOUDFLARE_ACCOUNT_ID) {
      throw new Error('Missing required environment variables');
    }

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

    const responseResult = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/d1/database/${D1_DATABASE_ID}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sql: responseQuery,
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

    if (!responseResult.ok) {
      const error = await responseResult.text();
      console.error('Failed to store quiz response:', error);
      throw new Error('Failed to store quiz response');
    }

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

      const reportResult = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/d1/database/${D1_DATABASE_ID}/query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sql: reportQuery,
          params: [
            report.id,
            report.quizResponseId,
            report.insights,
            JSON.stringify(report.recommendations),
            new Date().toISOString()
          ]
        })
      });

      if (!reportResult.ok) {
        const error = await reportResult.text();
        console.error('Failed to store report:', error);
        throw new Error('Failed to store report');
      }

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
    console.error('Error in POST /api/responses:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 