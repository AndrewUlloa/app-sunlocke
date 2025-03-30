export type MarketingChannel = 
  | 'Email Marketing'
  | 'Social Media'
  | 'Content Marketing'
  | 'SEO'
  | 'PPC Advertising'
  | 'Influencer Marketing'
  | 'Video Marketing'
  | 'Affiliate Marketing';

export type Parameter = 
  | 'awareness'
  | 'credibility'
  | 'communication'
  | 'retention'
  | 'engagement'
  | 'strategy';

export type ParameterScore = number;

export interface QuestionOption {
  id: string;
  text: string;
  weights: {
    awareness: number;
    credibility: number;
    communication: number;
    retention: number;
    engagement: number;
    strategy: number;
  };
}

export interface Question {
  id: string;
  text: string;
  type: 'baseline' | 'combination' | 'channel-specific';
  options: QuestionOption[];
  relevantChannels?: MarketingChannel[];
}

export interface VisitorInfo {
  firstName: string;
  lastName: string;
  email: string;
  industry: string;
}

export interface Scores {
  awareness: ParameterScore;
  credibility: ParameterScore;
  communication: ParameterScore;
  retention: ParameterScore;
  engagement: ParameterScore;
  strategy: ParameterScore;
}

export interface Report {
  id: string;
  quizResponseId: string;
  insights: string;
  recommendations: string[];
  timestamp: string;
}

export interface QuizResponse {
  id: string;
  visitorInfo: VisitorInfo;
  selectedChannels: MarketingChannel[];
  responses: Record<string, string>;
  scores: Scores;
  timestamp: string;
  report?: Report;
} 