import { NextResponse } from 'next/server';
import { executeD1Query } from '@/app/lib/db';

export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    const { session_id } = await request.json();

    // Get calculation results
    const calcResults = await executeD1Query(
      'SELECT * FROM calculation_results WHERE session_id = ? ORDER BY created_at DESC LIMIT 1',
      [session_id]
    );

    if (!calcResults?.results?.[0]) {
      return NextResponse.json({ error: 'Calculation results not found' }, { status: 404 });
    }

    // Get session info
    const sessionInfo = await executeD1Query(
      'SELECT * FROM QuizSessions WHERE session_id = ?',
      [session_id]
    );

    if (!sessionInfo?.results?.[0]) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const scores = calcResults.results[0];
    const session = sessionInfo.results[0];

    // Generate insights based on scores
    const insights = generateInsights(scores);
    
    // Generate recommendations based on scores and insights
    const recommendations = generateRecommendations(scores, session.q0_channels);

    // Save report
    const result = await executeD1Query(
      `INSERT INTO new_reports (session_id, insights, recommendations)
       VALUES (?, ?, ?)
       RETURNING *`,
      [session_id, insights, recommendations]
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
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
      `SELECT r.*, c.*
       FROM new_reports r
       JOIN calculation_results c ON r.session_id = c.session_id
       WHERE r.session_id = ?
       ORDER BY r.generated_timestamp DESC
       LIMIT 1`,
      [sessionId]
    );

    if (!result?.results?.[0]) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching report:', error);
    return NextResponse.json({ error: 'Failed to fetch report' }, { status: 500 });
  }
}

function generateInsights(scores: any): string {
  const insights = [];
  const parameters = [
    { name: 'Awareness', score: scores.awareness_score, label: scores.awareness_label },
    { name: 'Credibility', score: scores.credibility_score, label: scores.credibility_label },
    { name: 'Communication', score: scores.communication_score, label: scores.communication_label },
    { name: 'Retention', score: scores.retention_score, label: scores.retention_label },
    { name: 'Engagement', score: scores.engagement_score, label: scores.engagement_label },
    { name: 'Strategy', score: scores.strategy_score, label: scores.strategy_label }
  ];

  // Generate insights for each parameter
  for (const param of parameters) {
    if (param.score < 50) {
      insights.push(`Your ${param.name.toLowerCase()} score indicates a ${param.label.toLowerCase()} that needs immediate attention.`);
    } else if (param.score < 70) {
      insights.push(`Your ${param.name.toLowerCase()} performance shows room for improvement with a ${param.label.toLowerCase()}.`);
    } else if (param.score < 85) {
      insights.push(`Your ${param.name.toLowerCase()} is doing well but has some ${param.label.toLowerCase()}.`);
    } else {
      insights.push(`Your ${param.name.toLowerCase()} performance is excellent, showing strong results across key metrics.`);
    }
  }

  return insights.join('\n\n');
}

function generateRecommendations(scores: any, selectedChannels: string): string {
  const recommendations = [];
  const channels = selectedChannels.split(',');

  // Add channel-specific recommendations
  if (channels.includes('1')) { // Social Media
    recommendations.push('For social media:');
    if (scores.engagement_score < 70) {
      recommendations.push('- Increase interactive content like polls and questions');
      recommendations.push('- Develop a consistent posting schedule');
    }
    if (scores.awareness_score < 70) {
      recommendations.push('- Utilize trending hashtags strategically');
      recommendations.push('- Collaborate with industry influencers');
    }
  }

  if (channels.includes('2')) { // Website
    recommendations.push('\nFor website:');
    if (scores.credibility_score < 70) {
      recommendations.push('- Add customer testimonials and case studies');
      recommendations.push('- Ensure all content is up-to-date and accurate');
    }
    if (scores.retention_score < 70) {
      recommendations.push('- Implement a blog with valuable industry insights');
      recommendations.push('- Create a newsletter subscription option');
    }
  }

  // Add general recommendations based on scores
  recommendations.push('\nGeneral recommendations:');
  if (scores.strategy_score < 70) {
    recommendations.push('- Develop a comprehensive content calendar');
    recommendations.push('- Set clear KPIs for each marketing channel');
  }
  if (scores.communication_score < 70) {
    recommendations.push('- Review and refine your brand voice guidelines');
    recommendations.push('- Ensure consistent messaging across all channels');
  }

  return recommendations.join('\n');
} 