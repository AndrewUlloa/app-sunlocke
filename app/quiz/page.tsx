'use client';

import { useState, useEffect } from 'react';
import Quiz from '@/components/Quiz';
import Report from '@/components/Report';
import VisitorForm from '@/components/VisitorForm';
import { QuizResponse, Report as ReportType, VisitorInfo, Parameter } from '@/lib/types';
import QuestionBank from '@/lib/questionBank';
import { ReportGenerator } from '@/lib/reportGenerator';
import { Card, CardContent } from "@/components/ui/card";
import { Header } from "@/components/ui/header";
import { cn } from "@/lib/utils";
import { Loader2 } from 'lucide-react';

const D1_DATABASE_ID = process.env.NEXT_PUBLIC_D1_DATABASE_ID || '5d861285-afcf-488f-beaa-be3dc0ed15ea';

const reportGenerator = new ReportGenerator(
  process.env.NEXT_PUBLIC_OPENAI_API_KEY || '',
  'https://api.openai.com/v1/chat/completions'
);

export default function QuizPage() {
  const [report, setReport] = useState<ReportType | null>(null);
  const [scores, setScores] = useState<Record<Parameter, number> | null>(null);
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

      // Generate report first
      const generatedReport = await reportGenerator.generateReport(
        response.scores,
        response.selectedChannels,
        response.id
      );

      // Create complete response with report
      const completeResponse: QuizResponse = {
        ...fullResponse,
        report: generatedReport
      };

      // Store response in D1
      const storeResult = await fetch('/api/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          response: completeResponse
        })
      });

      if (!storeResult.ok) {
        throw new Error('Failed to store quiz response');
      }

      setReport(generatedReport);
      setScores(response.scores);
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

  if (error) {
    return (
      <main className="min-h-screen py-12">
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
    <>
      <Header />
      <main className="min-h-screen py-12">
        <Card className="bg-transparent shadow-red-card-default transition ease-in-out duration-[400ms] hover:shadow-red-card-hover max-w-2xl mx-auto">
          <CardContent className={cn(
            "flex flex-col items-center",
            "border border-white bg-white/50",
            "px-6 py-6",
            "md:px-8 md:py-8",
            "rounded-xl"
          )}>
            {isLoading ? (
              <div className="w-full text-center py-12">
                <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
                <p className="text-lg">Loading questions...</p>
              </div>
            ) : report && scores ? (
              <Report report={report} scores={scores} onRestart={handleRestart} />
            ) : !visitorInfo ? (
              <VisitorForm onSubmit={handleVisitorSubmit} />
            ) : questionBank ? (
              <Quiz questionBank={questionBank} onComplete={handleQuizComplete} />
            ) : null}
          </CardContent>
        </Card>
      </main>
    </>
  );
} 