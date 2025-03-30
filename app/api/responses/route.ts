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

    console.log('Fetching responses with params:', { page, limit, offset });

    const [responsesResult, countResult] = await Promise.all([
      fetch(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/d1/database/${D1_DATABASE_ID}/query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json',
          'X-Auth-Email': 'andrew@sunlocke.com',
          'X-Auth-Key': CLOUDFLARE_API_TOKEN
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
          'Content-Type': 'application/json',
          'X-Auth-Email': 'andrew@sunlocke.com',
          'X-Auth-Key': CLOUDFLARE_API_TOKEN
        },
        body: JSON.stringify({
          sql: countQuery
        })
      })
    ]);

    if (!responsesResult.ok || !countResult.ok) {
      const responseError = await responsesResult.text();
      const countError = await countResult.text();
      console.error('D1 API Error:', {
        responsesStatus: responsesResult.status,
        responsesError: responseError,
        countStatus: countResult.status,
        countError: countError
      });
      throw new Error('Failed to fetch from D1 database');
    }

    const responses = await responsesResult.json();
    const count = await countResult.json();

    if (!responses.success || !count.success) {
      console.error('D1 Query Error:', {
        responsesError: responses.error,
        countError: count.error
      });
      throw new Error('D1 query failed');
    }

    console.log('Successfully fetched responses:', {
      count: responses.result.length,
      total: count.result[0].total
    });

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
        'Content-Type': 'application/json',
        'X-Auth-Email': 'andrew@sunlocke.com',
        'X-Auth-Key': CLOUDFLARE_API_TOKEN
      },
      body: JSON.stringify({
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
        ],
        sql: responseQuery
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
          'Content-Type': 'application/json',
          'X-Auth-Email': 'andrew@sunlocke.com',
          'X-Auth-Key': CLOUDFLARE_API_TOKEN
        },
        body: JSON.stringify({
          params: [
            report.id,
            report.quizResponseId,
            report.insights,
            JSON.stringify(report.recommendations),
            new Date().toISOString()
          ],
          sql: reportQuery
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