import { Parameter, MarketingChannel, Report } from './types';

export class ReportGenerator {
  private apiKey: string;
  private endpoint: string;

  constructor(apiKey: string, endpoint: string) {
    this.apiKey = apiKey;
    this.endpoint = endpoint;
  }

  async generateReport(
    scores: Record<Parameter, number>,
    selectedChannels: MarketingChannel[],
    quizResponseId: number
  ): Promise<Report> {
    const prompt = this.constructPrompt(scores, selectedChannels);
    
    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: `You are a marketing expert analyzing diagnostic quiz results. 
              Provide specific, actionable insights and recommendations based on the scores and channels used.
              Focus on practical, implementable solutions that consider the specific channels being used.
              Keep insights concise and focused on key findings.
              Provide 3-5 specific, actionable recommendations.`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      const data = await response.json();
      const llmResponse = data.choices[0].message.content;
      
      return this.parseResponse(llmResponse);
    } catch (error) {
      console.error('Error generating report:', error);
      throw error;
    }
  }

  private constructPrompt(scores: Record<Parameter, number>, channels: MarketingChannel[]): string {
    return `
      Analyze the following marketing diagnostic results:

      Channels in use: ${channels.join(', ')}

      Parameter Scores:
      ${Object.entries(scores)
        .map(([parameter, score]) => `${parameter}: ${score}%`)
        .join('\n')}

      Based on these results:
      1. Provide a concise summary of the current marketing performance and key areas of concern
      2. List 3-5 specific, actionable recommendations for improvement
      
      Format your response as follows:
      [Summary of insights]

      Recommendations:
      - [First recommendation]
      - [Second recommendation]
      - [Third recommendation]
      etc.
    `;
  }

  private parseResponse(response: string): Report {
    const sections = response.split('\n\n');
    const insights = sections[0]?.trim() || 'Analysis not available';
    
    const recommendations = sections
      .slice(1)
      .flatMap(s => s.split('\n'))
      .filter(s => s.trim().startsWith('-') || s.trim().startsWith('•'))
      .map(s => s.replace(/^[-•]\s*/, '').trim())
      .filter(Boolean);

    return {
      insights,
      recommendations: recommendations.length > 0 ? recommendations : ['No specific recommendations available']
    };
  }
} 