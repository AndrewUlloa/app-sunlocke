import { Question, MarketingChannel } from './types';
import { QuestionService } from './questionService';

class QuestionBank {
  private questions: Question[];
  private questionService: QuestionService;

  constructor(databaseId: string) {
    this.questions = [];
    this.questionService = new QuestionService(databaseId);
  }

  async initialize(): Promise<void> {
    try {
      this.questions = await this.questionService.getAllQuestions();
    } catch (error) {
      console.error('Failed to initialize question bank:', error);
      throw error;
    }
  }

  getBaselineQuestions(): Question[] {
    return this.questions.filter(q => q.type === 'baseline').slice(0, 5);
  }

  getCombinationQuestions(selectedChannels: MarketingChannel[]): Question[] {
    const combinationQuestions = this.questions.filter(q => {
      if (q.type !== 'combination') return false;
      return q.relevantChannels.every(channel => selectedChannels.includes(channel));
    });
    
    // Randomly select 5 combination questions
    return this.shuffleArray(combinationQuestions).slice(0, 5);
  }

  getChannelSpecificQuestions(selectedChannels: MarketingChannel[]): Question[] {
    const channelSpecificQuestions = this.questions.filter(q => {
      if (q.type !== 'channel_specific') return false;
      return q.relevantChannels.some(channel => selectedChannels.includes(channel));
    });
    
    // Randomly select 5 channel-specific questions
    return this.shuffleArray(channelSpecificQuestions).slice(0, 5);
  }

  getQuizQuestions(selectedChannels: MarketingChannel[]): Question[] {
    const baseline = this.getBaselineQuestions();
    const combination = this.getCombinationQuestions(selectedChannels);
    const channelSpecific = this.getChannelSpecificQuestions(selectedChannels);

    return [...baseline, ...combination, ...channelSpecific];
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

export default QuestionBank; 