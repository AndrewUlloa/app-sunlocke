import { ParameterScore, MarketingChannel, Report } from './types';

export class ReportGenerator {
  private apiKey: string;
  private endpoint: string;

  constructor(apiKey: string, endpoint: string) {
    this.apiKey = apiKey;
    this.endpoint = endpoint;
  }

  async generateReport(
    scores: ParameterScore[],
    selectedChannels: MarketingChannel[],
    quizResponseId: string
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
              content: 'You are a marketing expert analyzing diagnostic quiz results. Provide specific, actionable insights and recommendations based on the scores and channels used.'
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
      
      // Parse LLM response into structured format
      const { insights, recommendations } = this.parseResponse(llmResponse);

      return {
        id: crypto.randomUUID(),
        quizResponseId,
        scores,
        insights,
        recommendations,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error generating report:', error);
      throw error;
    }
  }

  private constructPrompt(scores: ParameterScore[], channels: MarketingChannel[]): string {
    return `
      Analyze the following marketing diagnostic results:

      Channels in use: ${channels.join(', ')}

      Parameter Scores:
      ${scores.map(s => `${s.parameter}: ${s.score} (${s.category})`).join('\n')}

      Please provide:
      1. A detailed analysis of the current marketing performance
      2. Specific areas of concern and their impact
      3. 3-5 actionable recommendations for improvement
      
      Focus on practical, implementable solutions that consider the specific channels being used.
    `;
  }

  private parseResponse(response: string): { insights: string; recommendations: string[] } {
    // Simple parsing logic - can be enhanced based on actual LLM response format
    const sections = response.split('\n\n');
    
    return {
      insights: sections[0] || '',
      recommendations: sections
        .slice(1)
        .flatMap(s => s.split('\n'))
        .filter(s => s.trim().startsWith('-') || s.trim().startsWith('•'))
        .map(s => s.replace(/^[-•]\s*/, ''))
    };
  }
} 