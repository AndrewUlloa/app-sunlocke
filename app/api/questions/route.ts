import { NextResponse } from 'next/server';
import { Question, QuestionOption } from '@/lib/types';

export async function GET() {
  try {
    const D1_DATABASE_ID = process.env.D1_DATABASE_ID || '5d861285-afcf-488f-beaa-be3dc0ed15ea';

    // Fetch questions with their options and channels
    const questionsQuery = `
      SELECT 
        q.id,
        q.text,
        q.type,
        json_group_array(DISTINCT qc.channel) as channels,
        json_group_array(
          json_object(
            'id', qo.id,
            'text', qo.text,
            'weights', json_object(
              'awareness', qo.awareness_weight,
              'credibility', qo.credibility_weight,
              'communication', qo.communication_weight,
              'retention', qo.retention_weight,
              'engagement', qo.engagement_weight,
              'strategy', qo.strategy_weight
            )
          )
        ) as options
      FROM questions q
      LEFT JOIN question_channels qc ON q.id = qc.question_id
      LEFT JOIN question_options qo ON q.id = qo.question_id
      GROUP BY q.id
    `;

    const response = await fetch('https://api.cloudflare.com/client/v4/d1/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`
      },
      body: JSON.stringify({
        database_id: D1_DATABASE_ID,
        query: questionsQuery
      })
    });

    if (!response.ok) {
      throw new Error('Failed to fetch questions from D1');
    }

    const data = await response.json();
    
    // Transform the data into the expected format
    const questions: Question[] = data.result.map((row: any) => {
      const channels = JSON.parse(row.channels).filter(Boolean);
      const options = JSON.parse(row.options).filter(Boolean);
      
      return {
        id: row.id,
        text: row.text,
        type: row.type,
        relevantChannels: channels,
        options: options.map((opt: any) => ({
          text: opt.text,
          weights: opt.weights
        }))
      };
    });

    return NextResponse.json({ questions });
  } catch (error) {
    console.error('Error in questions API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questions' },
      { status: 500 }
    );
  }
} 