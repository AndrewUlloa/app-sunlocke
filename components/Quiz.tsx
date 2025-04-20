'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import QuestionBank from '@/lib/questionBank';
import { Parameter, Question, MarketingChannel, QuestionResponse } from '@/lib/types';

interface QuizProps {
  questionBank: QuestionBank;
  onComplete: (response: {
    id: string;
    scores: Record<Parameter, number>;
    selectedChannels: MarketingChannel[];
    responses: QuestionResponse[];
  }) => void;
}

export default function Quiz({ questionBank, onComplete }: QuizProps) {
  const [step, setStep] = useState<'channels' | 'questions'>('channels');
  const [selectedChannels, setSelectedChannels] = useState<MarketingChannel[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<QuestionResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const channels: MarketingChannel[] = [
    'Website',
    'Social Media',
    'Email List',
    'Events/Webinars',
    'Paid Ads',
    'Partnership/Referral'
  ];

  const handleChannelSelect = (channel: MarketingChannel) => {
    setSelectedChannels(prev => 
      prev.includes(channel)
        ? prev.filter(c => c !== channel)
        : [...prev, channel]
    );
  };

  const handleStartQuiz = () => {
    if (selectedChannels.length === 0) {
      alert('Please select at least one marketing channel');
      return;
    }
    
    setIsLoading(true);
    const quizQuestions = questionBank.getQuizQuestions(selectedChannels);
    setQuestions(quizQuestions);
    setStep('questions');
    setIsLoading(false);
  };

  const handleOptionSelect = (optionIndex: number) => {
    const currentQuestion = questions[currentQuestionIndex];
    const selectedOption = currentQuestion.options[optionIndex];
    
    const newResponse: QuestionResponse = {
      questionId: currentQuestion.id,
      selectedOptionId: selectedOption.id,
      questionText: currentQuestion.text,
      selectedOptionText: selectedOption.text
    };
    
    setResponses(prev => [...prev, newResponse]);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // Calculate scores - this is simplified and would need to be properly implemented
      const scores: Record<Parameter, number> = {
        awareness: 70,
        credibility: 60,
        communication: 80,
        retention: 75,
        engagement: 65,
        strategy: 85
      };
      
      onComplete({
        id: Math.random().toString(36).substring(2, 15),
        scores,
        selectedChannels,
        responses: [...responses, newResponse]
      });
    }
  };

  if (step === 'channels') {
    return (
      <div className="w-full space-y-6">
        <h2 className="text-2xl font-bold text-center mb-6">Select Your Marketing Channels</h2>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          {channels.map(channel => (
            <button
              key={channel}
              onClick={() => handleChannelSelect(channel)}
              className={`p-4 rounded-lg border ${
                selectedChannels.includes(channel)
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-800'
              }`}
            >
              {channel}
            </button>
          ))}
        </div>
        
        <div className="flex justify-center">
          <Button 
            onClick={handleStartQuiz}
            disabled={selectedChannels.length === 0}
          >
            Start Quiz
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full text-center py-12">
        <div className="w-12 h-12 border-4 border-t-blue-600 border-b-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-lg">Loading questions...</p>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  
  return (
    <div className="w-full space-y-6">
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
          <span>{Math.round((currentQuestionIndex / questions.length) * 100)}% Complete</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full"
            style={{ width: `${(currentQuestionIndex / questions.length) * 100}%` }}
          />
        </div>
      </div>
      
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-6">{currentQuestion.text}</h3>
        
        <div className="space-y-4 mb-6">
          {currentQuestion.options.map((option, index) => (
            <Button
              key={option.id}
              onClick={() => handleOptionSelect(index)}
              variant="outline"
              className="w-full p-4 h-auto text-left justify-start font-normal"
            >
              {option.text}
            </Button>
          ))}
        </div>
      </Card>
    </div>
  );
} 