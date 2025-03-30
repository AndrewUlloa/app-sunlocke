'use client';

import { useState } from 'react';
import { MarketingChannel, Question, QuizResponse } from '@/lib/types';
import QuestionBank from '@/lib/questionBank';
import { ScoreCalculator } from '@/lib/scoring';

interface QuizProps {
  questionBank: QuestionBank;
  onComplete: (response: QuizResponse) => void;
}

export default function Quiz({ questionBank, onComplete }: QuizProps) {
  const [step, setStep] = useState<'channels' | 'questions' | 'processing'>('channels');
  const [selectedChannels, setSelectedChannels] = useState<MarketingChannel[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [responses, setResponses] = useState<{ questionId: string; selectedOption: number }[]>([]);

  const channels: MarketingChannel[] = [
    'website',
    'social_media',
    'email',
    'content_marketing',
    'paid_advertising',
    'seo',
    'events',
    'pr',
    'direct_mail',
    'referral'
  ];

  const handleChannelSelect = (channel: MarketingChannel) => {
    setSelectedChannels(prev => 
      prev.includes(channel)
        ? prev.filter(c => c !== channel)
        : [...prev, channel]
    );
  };

  const handleChannelSubmit = () => {
    if (selectedChannels.length === 0) {
      alert('Please select at least one marketing channel');
      return;
    }
    
    const quizQuestions = questionBank.getQuizQuestions(selectedChannels);
    setQuestions(quizQuestions);
    setStep('questions');
  };

  const handleOptionSelect = (optionIndex: number) => {
    const currentQuestion = questions[currentQuestionIndex];
    
    setResponses(prev => [
      ...prev,
      { questionId: currentQuestion.id, selectedOption: optionIndex }
    ]);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setStep('processing');
      const scores = ScoreCalculator.calculateScores(questions, responses);
      
      const quizResponse: QuizResponse = {
        id: crypto.randomUUID(),
        userId: 'anonymous', // Replace with actual user ID if authentication is implemented
        selectedChannels,
        responses,
        scores,
        timestamp: new Date()
      };

      onComplete(quizResponse);
    }
  };

  if (step === 'channels') {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-6">Select Your Marketing Channels</h2>
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
              {channel.replace('_', ' ').toUpperCase()}
            </button>
          ))}
        </div>
        <button
          onClick={handleChannelSubmit}
          className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Continue to Quiz
        </button>
      </div>
    );
  }

  if (step === 'questions') {
    const currentQuestion = questions[currentQuestionIndex];
    
    return (
      <div className="max-w-2xl mx-auto p-6">
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

        <h3 className="text-xl font-semibold mb-6">{currentQuestion.text}</h3>
        
        <div className="space-y-4">
          {currentQuestion.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleOptionSelect(index)}
              className="w-full p-4 text-left border rounded-lg hover:bg-gray-50"
            >
              {option.text}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
        <p className="text-lg">Processing your responses...</p>
      </div>
    </div>
  );
} 