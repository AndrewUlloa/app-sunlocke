import { NextResponse } from 'next/server';
import { executeD1Query } from '@/app/lib/db';

interface ResponseBody {
  session_id: number;
  responses: Array<{
    question_id: number;
    selected_option_id: number;
  }>;
}

export async function POST(request: Request) {
  try {
    const body: ResponseBody = await request.json();
    const { session_id, responses } = body;

    // Begin transaction
    await executeD1Query('BEGIN TRANSACTION');

    try {
      // Insert responses
      for (const response of responses) {
        await executeD1Query(
          `INSERT INTO QuizResponses (session_id, question_id, selected_option_id)
           VALUES (?, ?, ?)`,
          [session_id, response.question_id, response.selected_option_id]
        );
      }

      // Calculate scores
      const weights = await executeD1Query(
        `SELECT 
           SUM(o.weight_awareness) as total_awareness,
           SUM(o.weight_credibility) as total_credibility,
           SUM(o.weight_communication) as total_communication,
           SUM(o.weight_retention) as total_retention,
           SUM(o.weight_engagement) as total_engagement,
           SUM(o.weight_strategy) as total_strategy
         FROM QuizResponses qr
         JOIN Options o ON qr.selected_option_id = o.option_id
         WHERE qr.session_id = ?`,
        [session_id]
      );

      // Helper function to determine label based on score
      const getLabel = (score: number): string => {
        if (score < 30) return 'Critical Issue';
        if (score < 50) return 'Significant Problem';
        if (score < 70) return 'Moderate Concern';
        if (score < 85) return 'Minor Improvement Needed';
        return 'Excellent';
      };

      // Insert calculation results
      const { results: [totals] } = weights;
      await executeD1Query(
        `INSERT INTO calculation_results (
           session_id,
           awareness_score, awareness_label,
           credibility_score, credibility_label,
           communication_score, communication_label,
           retention_score, retention_label,
           engagement_score, engagement_label,
           strategy_score, strategy_label
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          session_id,
          totals.total_awareness, getLabel(totals.total_awareness),
          totals.total_credibility, getLabel(totals.total_credibility),
          totals.total_communication, getLabel(totals.total_communication),
          totals.total_retention, getLabel(totals.total_retention),
          totals.total_engagement, getLabel(totals.total_engagement),
          totals.total_strategy, getLabel(totals.total_strategy)
        ]
      );

      // Commit transaction
      await executeD1Query('COMMIT');

      // Return the calculation results
      const results = await executeD1Query(
        'SELECT * FROM calculation_results WHERE session_id = ? ORDER BY created_at DESC LIMIT 1',
        [session_id]
      );

      return NextResponse.json(results);
    } catch (error) {
      // Rollback transaction on error
      await executeD1Query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error processing responses:', error);
    return NextResponse.json({ error: 'Failed to process responses' }, { status: 500 });
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
      `SELECT qr.*, q.question_text, o.option_text
       FROM QuizResponses qr
       JOIN Questions q ON qr.question_id = q.question_id
       JOIN Options o ON qr.selected_option_id = o.option_id
       WHERE qr.session_id = ?
       ORDER BY qr.answered_at`,
      [sessionId]
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching responses:', error);
    return NextResponse.json({ error: 'Failed to fetch responses' }, { status: 500 });
  }
} 