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

export interface Question {
  id: number;
  text: string;
  type: 'Baseline' | 'Combination-Specific' | 'Singular';
  channels: MarketingChannel[];
  options: Option[];
}

export interface Option {
  id: number;
  text: string;
  weights: Record<Parameter, number>;
}

export interface QuestionResponse {
  questionId: number;
  selectedOptionId: number;
  questionText: string;
  selectedOptionText: string;
}

export interface VisitorInfo {
  firstName: string;
  lastName: string;
  email: string;
  industry: string;
}

export interface Report {
  insights: string;
  recommendations: string[];
}

export interface QuizResponse {
  id: number;
  timestamp: string;
  visitorInfo: VisitorInfo;
  selectedChannels: MarketingChannel[];
  responses: QuestionResponse[];
  scores: Record<Parameter, ParameterScore>;
  report?: Report;
} 