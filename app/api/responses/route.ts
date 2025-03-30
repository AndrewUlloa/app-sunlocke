import { NextResponse } from 'next/server';
import { QuizResponse, MarketingChannel, Parameter } from '@/lib/types';
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

interface D1QuizResponse {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  industry: string;
  selected_channels: string;
  question_responses: string;
  scores: string;
  timestamp: string;
  insights: string | null;
  recommendations: string | null;
}

interface ApiResponse {
  responses: QuizResponse[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface D1Report extends Report {
  id: string;
  quiz_response_id: string;
  timestamp: string;
}

async function ensureTablesExist(accountId: string, dbId: string, token: string) {
  try {
    // Create tables if they don't exist
    const createTablesQuery = `
      CREATE TABLE IF NOT EXISTS quiz_responses (
        id TEXT PRIMARY KEY,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT NOT NULL,
        industry TEXT NOT NULL,
        selected_channels TEXT NOT NULL,
        question_responses TEXT NOT NULL,
        scores TEXT NOT NULL,
        timestamp TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS reports (
        quiz_response_id TEXT PRIMARY KEY,
        insights TEXT,
        recommendations TEXT,
        FOREIGN KEY (quiz_response_id) REFERENCES quiz_responses (id)
      );
    `;

    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${dbId}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sql: createTablesQuery
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to ensure tables exist:', error);
      throw new Error('Failed to ensure tables exist');
    }

    const result = await response.json();
    console.log('Tables created or verified:', result);
  } catch (error) {
    console.error('Error in ensureTablesExist:', error);
    // Don't throw here, let's try to proceed with the query
  }
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

    // Try to ensure tables exist, but don't let it block the main query
    await ensureTablesExist(CLOUDFLARE_ACCOUNT_ID, D1_DATABASE_ID, CLOUDFLARE_API_TOKEN)
      .catch(error => console.error('Failed to ensure tables exist, proceeding anyway:', error));

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

    // Make both requests in parallel
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
      throw new Error('Failed to fetch data from D1');
    }

    const [responsesData, countData] = await Promise.all([
      responsesResult.json(),
      countResult.json()
    ]);

    console.log('Raw API Responses:', {
      responsesText: JSON.stringify(responsesData),
      countText: JSON.stringify(countData)
    });

    const total = countData.result[0].results[0].total;
    const responses = responsesData.result[0].results as D1QuizResponse[];

    // Transform the responses into the expected format
    const transformedResponses: QuizResponse[] = responses.map(row => ({
      id: row.id,
      visitorInfo: {
        firstName: row.first_name,
        lastName: row.last_name,
        email: row.email,
        industry: row.industry
      },
      selectedChannels: JSON.parse(row.selected_channels || '[]') as MarketingChannel[],
      scores: JSON.parse(row.scores || '{}') as Record<Parameter, number>,
      responses: JSON.parse(row.question_responses || '[]'),
      timestamp: row.timestamp,
      report: row.insights ? {
        insights: row.insights,
        recommendations: JSON.parse(row.recommendations || '[]')
      } : null
    }));

    console.log('Successfully processed responses:', { count: responses.length, total });

    const apiResponse: ApiResponse = {
      responses: transformedResponses,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };

    return Response.json(apiResponse);
  } catch (error) {
    console.error('Error in GET /api/responses:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'An unknown error occurred' },
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
        question_responses,
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
          quizResponse.timestamp
        ]
      })
    });

    if (!responseResult.ok) {
      const error = await responseResult.text();
      console.error('Failed to store quiz response:', error);
      throw new Error('Failed to store quiz response');
    }

    // If there's a report, store it
    if (report) {
      const reportQuery = `
        INSERT INTO reports (
          quiz_response_id,
          insights,
          recommendations
        ) VALUES (?, ?, ?)
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
            quizResponse.id,
            report.insights,
            JSON.stringify(report.recommendations)
          ]
        })
      });

      if (!reportResult.ok) {
        const error = await reportResult.text();
        console.error('Failed to store report:', error);
        throw new Error('Failed to store report');
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error in POST /api/responses:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 