'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { QuizResponse } from '@/lib/types';
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

export default function AdminPage() {
  const [data, setData] = useState<ResponsesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Add refs to track request state
  const fetchingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

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
      
      const newData = await response.json();
      setData(newData);
      setError(null);
    } catch (err) {
      // Only set error if not aborted
      if (err instanceof Error && err.name !== 'AbortError') {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred';
        setError(errorMessage);
        toast.error({ message: 'Failed to fetch responses', description: errorMessage });
      }
    } finally {
      fetchingRef.current = false;
      setLoading(false);
    }
  }, [currentPage]);

  // Initialize auth credentials on first load
  useEffect(() => {
    if (!localStorage.getItem('adminAuth')) {
      const authHeader = 'admin:marketing2024'
      const base64Auth = btoa(authHeader)
      localStorage.setItem('adminAuth', base64Auth)
    }
  }, []);

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

  // Initial fetch and page change handler
  useEffect(() => {
    fetchResponses();
  }, [fetchResponses]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Loading...</h1>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-4">Error</h1>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Quiz Responses</h1>
        
        {data?.responses.map((response) => (
          <div key={response.id} className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <h2 className="text-xl font-semibold mb-2">Visitor Information</h2>
                <p><span className="font-medium">Name:</span> {response.visitorInfo.firstName} {response.visitorInfo.lastName}</p>
                <p><span className="font-medium">Email:</span> {response.visitorInfo.email}</p>
                <p><span className="font-medium">Industry:</span> {response.visitorInfo.industry}</p>
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-2">Selected Channels</h2>
                <ul className="list-disc list-inside">
                  {response.selectedChannels.map((channel) => (
                    <li key={channel}>{channel}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mb-4">
              <h2 className="text-xl font-semibold mb-2">Scores</h2>
              <div className="grid grid-cols-3 gap-4">
                {Object.entries(response.scores).map(([metric, score]) => (
                  <div key={metric} className="bg-gray-50 p-4 rounded">
                    <p className="font-medium capitalize">{metric}</p>
                    <p className="text-2xl font-bold">{score.toString()}</p>
                  </div>
                ))}
              </div>
            </div>

            {response.report && (
              <div>
                <h2 className="text-xl font-semibold mb-2">Report</h2>
                <div className="bg-gray-50 p-4 rounded">
                  <h3 className="font-medium mb-2">Insights</h3>
                  <p className="mb-4">{response.report.insights}</p>
                  <h3 className="font-medium mb-2">Recommendations</h3>
                  <ul className="list-disc list-inside">
                    {response.report.recommendations.map((rec: string, index: number) => (
                      <li key={index}>{rec}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <p className="text-sm text-gray-500 mt-4">
              Submitted on: {new Date(response.timestamp).toLocaleString()}
            </p>
          </div>
        ))}

        {data && data.pagination.totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-4 py-2">
              Page {currentPage} of {data.pagination.totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(data.pagination.totalPages, prev + 1))}
              disabled={currentPage === data.pagination.totalPages}
              className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 