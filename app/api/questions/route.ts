import { NextResponse } from 'next/server';
import { Question, MarketingChannel } from '@/lib/types';

export const runtime = 'edge';

export async function GET() {
  try {
    const D1_DATABASE_ID = process.env.D1_DATABASE_ID || '5d861285-afcf-488f-beaa-be3dc0ed15ea';
    const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
    const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;

    if (!D1_DATABASE_ID || !CLOUDFLARE_API_TOKEN || !CLOUDFLARE_ACCOUNT_ID) {
      console.error('Missing required environment variables');
      throw new Error('Missing required environment variables');
    }

    // First get all questions
    const questionsQuery = `
      SELECT 
        question_id as id,
        question_text as text,
        question_type as type
      FROM Questions
    `;

    // Then get question channels
    const channelsQuery = `
      SELECT 
        qc.question_id,
        c.channel_name
      FROM QuestionChannels qc
      JOIN Channels c ON qc.channel_id = c.channel_id
    `;

    // And finally get options
    const optionsQuery = `
      SELECT 
        question_id,
        option_id as id,
        option_text as text,
        weight_awareness,
        weight_credibility,
        weight_communication,
        weight_retention,
        weight_engagement,
        weight_strategy
      FROM Options
    `;

    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/d1/database/${D1_DATABASE_ID}/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`
      },
      body: JSON.stringify({
        sql: questionsQuery + '; ' + channelsQuery + '; ' + optionsQuery,
        parameters: []
      })
    });

    if (!response.ok) {
      throw new Error('Failed to fetch questions from D1');
    }

    const data = await response.json();
    
    // Process the three separate result sets
    const questionsData = data.result[0].results as Array<{id: number; text: string; type: string}>;
    const channelsData = data.result[1].results as Array<{question_id: number; channel_name: string}>;
    const optionsData = data.result[2].results as Array<{
      question_id: number;
      id: number;
      text: string;
      weight_awareness: number;
      weight_credibility: number;
      weight_communication: number;
      weight_retention: number;
      weight_engagement: number;
      weight_strategy: number;
    }>;

    // Transform the data into the expected format
    const questions: Question[] = questionsData.map(question => {
      // Find all channels for this question
      const channels = channelsData
        .filter(c => c.question_id === question.id)
        .map(c => c.channel_name as MarketingChannel);
      
      // Find all options for this question
      const options = optionsData
        .filter(o => o.question_id === question.id)
        .map(o => ({
          id: o.id,
          text: o.text,
          weights: {
            awareness: o.weight_awareness,
            credibility: o.weight_credibility,
            communication: o.weight_communication,
            retention: o.weight_retention,
            engagement: o.weight_engagement,
            strategy: o.weight_strategy
          }
        }));

      return {
        id: question.id,
        text: question.text,
        type: question.type as 'Baseline' | 'Combination-Specific' | 'Singular',
        channels,
        options
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