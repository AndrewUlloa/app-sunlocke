'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { QuizResponse, MarketingChannel, Parameter, ParameterScore } from '@/lib/types';
import { toast } from '@/lib/toast';

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface ResponsesData {
  responses: QuizResponse[];
  pagination: PaginationInfo;
}

// Add helper functions
const normalizeChannelName = (channel: string): MarketingChannel => {
  const mapping: Record<string, MarketingChannel> = {
    'email': 'Email List',
    'social': 'Social Media',
    'content': 'Website',
    'seo': 'Website'
  };
  return mapping[channel.toLowerCase()] || channel as MarketingChannel;
};

const organizeScores = (scores: Record<Parameter, ParameterScore>) => {
  const categories = {
    engagement: ['awareness', 'engagement'],
    communication: ['communication', 'credibility'],
    strategy: ['strategy', 'retention']
  };
  
  return Object.entries(categories).map(([category, params]) => ({
    category,
    scores: params.map(param => ({
      parameter: param,
      score: scores[param as Parameter] || 0
    }))
  }));
};

const generateInsights = (scores: Record<Parameter, ParameterScore>, channels: MarketingChannel[]): string => {
  const highestScore = Math.max(...Object.values(scores));
  const strongestAreas = Object.entries(scores)
    .filter(([_, score]) => score >= highestScore - 10)
    .map(([param]) => param);
  
  const channelSpecificInsights = channels.map(channel => {
    switch(channel) {
      case 'Email List':
        return 'Email marketing shows potential for direct customer engagement';
      case 'Events/Webinars':
        return 'Events and webinars can strengthen brand presence';
      case 'Paid Ads':
        return 'Paid advertising can accelerate growth';
      case 'Partnership/Referral':
        return 'Partnerships can expand market reach';
      case 'Social Media':
        return 'Social media presence can boost engagement';
      case 'Website':
        return 'Website optimization can improve conversion';
      default:
        return '';
    }
  }).filter(Boolean);

  return `Strong performance in ${strongestAreas.join(', ')}. Selected ${channels.length} marketing channels: ${channelSpecificInsights.join('. ')}`;
};

const generateRecommendations = (scores: Record<Parameter, ParameterScore>, channels: MarketingChannel[]): string[] => {
  const recommendations: string[] = [];
  
  // Channel-specific recommendations
  channels.forEach(channel => {
    switch(channel) {
      case 'Email List':
        recommendations.push('Implement automated email nurture campaigns');
        recommendations.push('Segment email lists for targeted messaging');
        break;
      case 'Events/Webinars':
        recommendations.push('Create engaging virtual event series');
        recommendations.push('Develop follow-up strategy for event attendees');
        break;
      case 'Paid Ads':
        recommendations.push('Optimize ad targeting and creative');
        recommendations.push('Implement A/B testing for ad campaigns');
        break;
      case 'Partnership/Referral':
        recommendations.push('Establish partner onboarding program');
        recommendations.push('Create co-marketing opportunities');
        break;
      case 'Social Media':
        recommendations.push('Develop consistent content calendar');
        recommendations.push('Engage with audience through interactive content');
        break;
      case 'Website':
        recommendations.push('Optimize website for conversions');
        recommendations.push('Create valuable content resources');
        break;
    }
  });

  // Score-based recommendations
  Object.entries(scores).forEach(([param, score]) => {
    if (score < 70) {
      switch(param as Parameter) {
        case 'awareness':
          recommendations.push('Increase brand visibility through targeted campaigns');
          break;
        case 'credibility':
          recommendations.push('Build trust through customer testimonials and case studies');
          break;
        case 'communication':
          recommendations.push('Improve messaging clarity and consistency');
          break;
        case 'retention':
          recommendations.push('Develop customer loyalty program');
          break;
        case 'engagement':
          recommendations.push('Create more interactive content and experiences');
          break;
        case 'strategy':
          recommendations.push('Develop comprehensive marketing strategy document');
          break;
      }
    }
  });

  return recommendations;
};

export default function AdminPage() {
  const [data, setData] = useState<ResponsesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Add refs to track request state
  const fetchingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const initialLoadRef = useRef(false);

  const fetchResponses = useCallback(async () => {
    // Prevent duplicate requests
    if (fetchingRef.current) {
      return;
    }

    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    try {
      fetchingRef.current = true;
      setLoading(true);
      
      const headers = new Headers();
      const storedAuth = localStorage.getItem('adminAuth');
      if (storedAuth) {
        headers.set('Authorization', `Basic ${storedAuth}`);
      }
      
      const response = await fetch(`/api/responses?page=${currentPage}&limit=10`, {
        headers,
        credentials: 'include',
        signal: abortControllerRef.current.signal
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch responses');
      }
      
      const data: ResponsesData = await response.json();
      // Transform and normalize the data
      const transformedData = {
        ...data,
        responses: data.responses.map(response => ({
          ...response,
          selectedChannels: response.selectedChannels.map(normalizeChannelName),
          report: response.report || {
            insights: generateInsights(response.scores, response.selectedChannels),
            recommendations: generateRecommendations(response.scores, response.selectedChannels)
          }
        }))
      };
      setData(transformedData);
      setError(null);
    } catch (err) {
      // Only set error if not aborted
      if (err instanceof Error && err.name !== 'AbortError') {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred';
        console.error('Error fetching responses:', err);
        setError(errorMessage);
        toast.error({ message: 'Failed to fetch responses', description: errorMessage });
      }
    } finally {
      fetchingRef.current = false;
      setLoading(false);
    }
  }, [currentPage]);

  // Initialize auth credentials and fetch data on first load
  useEffect(() => {
    if (!initialLoadRef.current) {
      initialLoadRef.current = true;
      
      if (!localStorage.getItem('adminAuth')) {
        const authHeader = 'admin:marketing2024'
        const base64Auth = btoa(authHeader)
        localStorage.setItem('adminAuth', base64Auth)
      }

      // Initial data fetch
      fetchResponses();
    }
  }, [fetchResponses]);

  // Set up visibility change handler with debouncing
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Debounce the refresh to prevent multiple rapid requests
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          fetchResponses();
        }, 300);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearTimeout(timeoutId);
      // Cleanup any in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchResponses]);

  // Handle page changes
  useEffect(() => {
    fetchResponses();
  }, [currentPage, fetchResponses]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Quiz Responses</h1>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Quiz Responses</h1>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-red-600">
              <h2 className="text-lg font-semibold mb-2">Error Loading Responses</h2>
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data?.responses?.length) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Quiz Responses</h1>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-500 text-center py-4">No responses found.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Quiz Responses</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-gray-700">
              Page {currentPage} of {data.pagination.totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(data.pagination.totalPages, prev + 1))}
              disabled={currentPage === data.pagination.totalPages}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="divide-y divide-gray-200">
            {data.responses.map((response) => (
              <div key={response.id} className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {response.visitorInfo.firstName} {response.visitorInfo.lastName}
                    </h3>
                    <p className="text-sm text-gray-500">{response.visitorInfo.email}</p>
                    <p className="text-sm text-gray-500">Industry: {response.visitorInfo.industry}</p>
                  </div>
                  <p className="text-sm text-gray-500">
                    {new Date(response.timestamp).toLocaleString()}
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-900">Selected Channels</h4>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {response.selectedChannels.map((channel) => (
                      <span
                        key={channel}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {channel}
                      </span>
                    ))}
                  </div>
                </div>

                {response.responses && response.responses.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Question Responses</h4>
                    <div className="mt-2 space-y-4">
                      {response.responses.map((qResponse, index) => (
                        <div key={qResponse.questionId} className="bg-gray-50 rounded-lg p-4">
                          <p className="text-sm font-medium text-gray-900">
                            Question {index + 1}: {qResponse.questionText}
                          </p>
                          <p className="mt-2 text-sm text-gray-600">
                            Selected: {qResponse.selectedOptionText}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="text-sm font-medium text-gray-900">Scores</h4>
                  <div className="mt-2 space-y-4">
                    {organizeScores(response.scores).map(({ category, scores }) => (
                      <div key={category} className="space-y-2">
                        <h5 className="text-sm font-medium text-gray-700 capitalize">{category}</h5>
                        <div className="grid grid-cols-2 gap-4">
                          {scores.map(({ parameter, score }) => (
                            <div key={parameter} className="flex items-center justify-between">
                              <span className="text-sm text-gray-500 capitalize">{parameter}</span>
                              <div className="flex items-center">
                                <div className="w-32 h-2 bg-gray-200 rounded mr-2">
                                  <div 
                                    className="h-2 bg-blue-600 rounded" 
                                    style={{ width: `${score}%` }}
                                  />
                                </div>
                                <span className="text-sm font-medium text-gray-900">{score}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {response.report && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Report</h4>
                    <p className="mt-2 text-sm text-gray-500">{response.report.insights}</p>
                    {response.report.recommendations.length > 0 && (
                      <div className="mt-4">
                        <h5 className="text-sm font-medium text-gray-900">Recommendations</h5>
                        <ul className="mt-2 list-disc list-inside space-y-1">
                          {response.report.recommendations.map((rec, index) => (
                            <li key={index} className="text-sm text-gray-500">{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 