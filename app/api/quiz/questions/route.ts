import { NextResponse } from 'next/server';
import { executeD1Query } from '@/app/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const channels = searchParams.get('channels')?.split(',');

    if (!channels || channels.length === 0) {
      return NextResponse.json({ error: 'Channels are required' }, { status: 400 });
    }

    // Get baseline questions and channel-specific questions
    const result = await executeD1Query(
      `SELECT DISTINCT q.*, o.*
       FROM Questions q
       LEFT JOIN QuestionChannels qc ON q.question_id = qc.question_id
       LEFT JOIN Options o ON q.question_id = o.question_id
       WHERE q.question_type = 'Baseline'
       OR qc.channel_id IN (${channels.map(() => '?').join(',')})
       ORDER BY q.question_number`,
      channels
    );

    // Group options with their questions
    const questions = result.results.reduce((acc: any[], row: any) => {
      const existingQuestion = acc.find(q => q.question_id === row.question_id);
      
      if (existingQuestion) {
        existingQuestion.options.push({
          option_id: row.option_id,
          option_text: row.option_text,
          weights: {
            awareness: row.weight_awareness,
            credibility: row.weight_credibility,
            communication: row.weight_communication,
            retention: row.weight_retention,
            engagement: row.weight_engagement,
            strategy: row.weight_strategy
          }
        });
      } else {
        acc.push({
          question_id: row.question_id,
          question_number: row.question_number,
          question_text: row.question_text,
          question_type: row.question_type,
          options: [{
            option_id: row.option_id,
            option_text: row.option_text,
            weights: {
              awareness: row.weight_awareness,
              credibility: row.weight_credibility,
              communication: row.weight_communication,
              retention: row.weight_retention,
              engagement: row.weight_engagement,
              strategy: row.weight_strategy
            }
          }]
        });
      }
      return acc;
    }, []);

    return NextResponse.json(questions);
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
  }
} 