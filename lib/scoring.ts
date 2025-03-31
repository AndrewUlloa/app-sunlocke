import { Question, Parameter, ParameterScore, MarketingChannel } from './types';

export class ScoreCalculator {
  private static readonly PARAMETER_WEIGHTS: Record<Parameter, number> = {
    awareness: 1,
    credibility: 1,
    communication: 1,
    retention: 1,
    engagement: 1,
    strategy: 1
  };

  private static readonly CHANNEL_PARAMETER_WEIGHTS: Partial<Record<MarketingChannel, Partial<Record<Parameter, number>>>> = {
    'Email List': {
      communication: 1.2,
      retention: 1.1,
      engagement: 1.1
    },
    'Events/Webinars': {
      awareness: 1.2,
      credibility: 1.1,
      engagement: 1.2
    },
    'Paid Ads': {
      awareness: 1.3,
      engagement: 1.1
    },
    'Partnership/Referral': {
      credibility: 1.3,
      awareness: 1.1,
      retention: 1.1
    },
    'Social Media': {
      awareness: 1.2,
      engagement: 1.3,
      communication: 1.1
    },
    'Website': {
      credibility: 1.2,
      communication: 1.1,
      strategy: 1.2
    }
  };

  static calculateScores(
    questions: Question[],
    responses: { questionId: number; selectedOptionId: number }[],
    selectedChannels: MarketingChannel[]
  ): Record<Parameter, number> {
    // Initialize scores for each parameter
    const rawScores: Record<Parameter, number> = {
      awareness: 0,
      credibility: 0,
      communication: 0,
      retention: 0,
      engagement: 0,
      strategy: 0
    };

    // Calculate raw scores from responses
    responses.forEach(response => {
      const question = questions.find(q => q.id === response.questionId);
      if (!question) return;

      const selectedOption = question.options.find(opt => opt.id === response.selectedOptionId);
      if (!selectedOption) return;

      // Apply base weights from the option
      Object.entries(selectedOption.weights).forEach(([parameter, weight]) => {
        rawScores[parameter as Parameter] += weight;
      });

      // Apply channel-specific weights if the question is channel-specific
      if (question.type === 'Combination-Specific' || question.type === 'Singular') {
        const relevantChannels = question.channels;
        const selectedRelevantChannels = selectedChannels.filter(ch => 
          relevantChannels.includes(ch)
        );

        selectedRelevantChannels.forEach(channel => {
          const channelWeights = this.CHANNEL_PARAMETER_WEIGHTS[channel];
          if (channelWeights) {
            Object.entries(channelWeights).forEach(([parameter, multiplier]) => {
              rawScores[parameter as Parameter] *= multiplier;
            });
          }
        });
      }
    });

    // Normalize scores to percentages (0-100)
    const maxPossibleScore = questions.length * Math.max(
      ...Object.values(this.PARAMETER_WEIGHTS)
    );

    const normalizedScores: Record<Parameter, number> = {} as Record<Parameter, number>;
    Object.entries(rawScores).forEach(([parameter, score]) => {
      normalizedScores[parameter as Parameter] = Math.round(
        (score / maxPossibleScore) * 100
      );
    });

    return normalizedScores;
  }
} 