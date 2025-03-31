import { Question, Option, MarketingChannel } from './types';

export class QuestionService {
  private databaseId: string;

  constructor(databaseId: string) {
    this.databaseId = databaseId;
  }

  async getAllQuestions(): Promise<Question[]> {
    const questions: Question[] = [];
    
    try {
      // Fetch questions with their options and channels
      const result = await fetch('/api/questions', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!result.ok) {
        throw new Error('Failed to fetch questions');
      }

      const data = await result.json();
      return data.questions;
    } catch (error) {
      console.error('Error fetching questions:', error);
      throw error;
    }
  }
} 