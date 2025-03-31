import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

// D1 Database ID from environment variable
const D1_DATABASE_ID = process.env.D1_DATABASE_ID!

// Helper function to execute D1 queries
export async function executeD1Query(query: string, params: any[] = []) {
  try {
    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/d1/database/${D1_DATABASE_ID}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sql: query,
        params: params
      })
    });

    if (!response.ok) {
      throw new Error(`D1 query failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.result[0];
  } catch (error) {
    console.error('D1 query error:', error);
    throw error;
  }
}

// Types for our database entities
export interface QuizSession {
  session_id: number;
  user_id?: number;
  created_at: string;
  q0_channels: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  industry?: string;
}

export interface Question {
  question_id: number;
  question_number: string;
  question_text: string;
  question_type: 'Baseline' | 'Combination-Specific' | 'Singular';
  created_at: string;
}

export interface QuestionOption {
  option_id: number;
  question_id: number;
  option_text: string;
  weight_awareness: number;
  weight_credibility: number;
  weight_communication: number;
  weight_retention: number;
  weight_engagement: number;
  weight_strategy: number;
}

export interface QuizResponse {
  response_id: number;
  session_id: number;
  question_id: number;
  selected_option_id: number;
  answered_at: string;
}

export interface CalculationResult {
  result_id: number;
  session_id: number;
  awareness_score: number;
  credibility_score: number;
  communication_score: number;
  retention_score: number;
  engagement_score: number;
  strategy_score: number;
  awareness_label: string;
  credibility_label: string;
  communication_label: string;
  retention_label: string;
  engagement_label: string;
  strategy_label: string;
  created_at: string;
}

export interface Report {
  report_id: number;
  session_id: number;
  insights: string;
  recommendations: string;
  generated_timestamp: string;
} 