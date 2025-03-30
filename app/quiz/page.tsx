'use client';

import { useState, useEffect } from 'react';
import Quiz from '@/components/Quiz';
import Report from '@/components/Report';
import VisitorForm from '@/components/VisitorForm';
import QuestionBank from '@/lib/questionBank';
import { ReportGenerator } from '@/lib/reportGenerator';
import { QuizResponse, Report as ReportType, VisitorInfo } from '@/lib/types';

const D1_DATABASE_ID = process.env.NEXT_PUBLIC_D1_DATABASE_ID || '5d861285-afcf-488f-beaa-be3dc0ed15ea';

const reportGenerator = new ReportGenerator(
  process.env.NEXT_PUBLIC_OPENAI_API_KEY || '',
  'https://api.openai.com/v1/chat/completions'
);

export default function QuizPage() {
  const [report, setReport] = useState<ReportType | null>(null);
  const [questionBank, setQuestionBank] = useState<QuestionBank | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [visitorInfo, setVisitorInfo] = useState<VisitorInfo | null>(null);

  useEffect(() => {
    const initializeQuestionBank = async () => {
      try {
        const qb = new QuestionBank(D1_DATABASE_ID);
        await qb.initialize();
        setQuestionBank(qb);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to initialize question bank:', error);
        setError('Failed to load questions. Please try again later.');
        setIsLoading(false);
      }
    };

    initializeQuestionBank();
  }, []);

  const handleQuizComplete = async (response: Omit<QuizResponse, 'visitorInfo'>) => {
    if (!visitorInfo) return;

    try {
      const fullResponse: QuizResponse = {
        ...response,
        visitorInfo
      };

      const generatedReport = await reportGenerator.generateReport(
        response.scores,
        response.selectedChannels,
        response.id
      );

      // Store response and report in D1
      const storeResult = await fetch('/api/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          response: fullResponse,
          report: generatedReport
        })
      });

      if (!storeResult.ok) {
        throw new Error('Failed to store quiz response');
      }

      setReport(generatedReport);
    } catch (error) {
      console.error('Error completing quiz:', error);
      setError('Failed to generate report. Please try again.');
    }
  };

  const handleVisitorSubmit = (info: VisitorInfo) => {
    setVisitorInfo(info);
  };

  const handleRestart = () => {
    setReport(null);
    setError(null);
    setVisitorInfo(null);
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto p-6 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-lg">Loading questions...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto p-6 text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-700">{error}</p>
          </div>
          <button
            onClick={handleRestart}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-12">
      {report ? (
        <Report report={report} onRestart={handleRestart} />
      ) : !visitorInfo ? (
        <VisitorForm onSubmit={handleVisitorSubmit} />
      ) : questionBank ? (
        <Quiz questionBank={questionBank} onComplete={handleQuizComplete} />
      ) : null}
    </main>
  );
} 