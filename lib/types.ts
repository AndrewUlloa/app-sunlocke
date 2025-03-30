export type MarketingChannel = 
  | 'Email List'
  | 'Events/Webinars'
  | 'Paid Ads'
  | 'Partnership/Referral'
  | 'Social Media'
  | 'Website';

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
  insights: string;
  recommendations: string[];
}

export interface QuestionResponse {
  questionId: string;
  questionText: string;
  selectedOptionId: string;
  selectedOptionText: string;
}

export interface QuizResponse {
  id: string;
  visitorInfo: VisitorInfo;
  selectedChannels: MarketingChannel[];
  scores: Record<Parameter, ParameterScore>;
  timestamp: string;
  report: Report | null;
  responses: QuestionResponse[];
} 