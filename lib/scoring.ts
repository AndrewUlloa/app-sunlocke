import { Question, Parameter, ParameterScore } from './types';

export class ScoreCalculator {
  private static readonly CATEGORY_THRESHOLDS = {
    'On the Edge': 0.75,
    'Slight Problem': 0.5,
    'Problem': 0.25,
    'Severe': 0
  };

  static calculateScores(
    questions: Question[],
    responses: { questionId: string; selectedOption: number }[]
  ): ParameterScore[] {
    // Initialize scores for each parameter
    const rawScores: Record<Parameter, number> = {
      awareness: 0,
      credibility: 0,
      communication: 0,
      retention: 0,
      engagement: 0,
      strategy: 0
    };

    // Calculate raw scores
    responses.forEach(response => {
      const question = questions.find(q => q.id === response.questionId);
      if (!question) return;

      const selectedOption = question.options[response.selectedOption];
      if (!selectedOption) return;

      Object.entries(selectedOption.weights).forEach(([parameter, weight]) => {
        rawScores[parameter as Parameter] += weight;
      });
    });

    // Normalize scores and assign categories
    return Object.entries(rawScores).map(([parameter, score]) => {
      const normalizedScore = this.normalizeScore(score, responses.length);
      return {
        parameter: parameter as Parameter,
        score: normalizedScore,
        category: this.getScoreCategory(normalizedScore)
      };
    });
  }

  private static normalizeScore(score: number, totalQuestions: number): number {
    // Normalize to 0-1 range based on total possible score
    const maxPossibleScore = totalQuestions * 1; // Assuming max weight per question is 1
    return Math.max(0, Math.min(1, score / maxPossibleScore));
  }

  private static getScoreCategory(normalizedScore: number): ParameterScore['category'] {
    if (normalizedScore >= this.CATEGORY_THRESHOLDS['On the Edge']) return 'On the Edge';
    if (normalizedScore >= this.CATEGORY_THRESHOLDS['Slight Problem']) return 'Slight Problem';
    if (normalizedScore >= this.CATEGORY_THRESHOLDS['Problem']) return 'Problem';
    return 'Severe';
  }
} 