"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/client"

interface TestResult {
  success: boolean
  message: string
  data?: unknown
}

interface TestResponse {
  success: boolean
  message: string
  results: Record<string, TestResult>
  error?: string
}

export function RLSTest() {
  const [results, setResults] = useState<TestResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const formatData = (data: unknown): string => {
    if (typeof data === 'string') return data
    return JSON.stringify(data, null, 2)
  }

  const runTests = async () => {
    try {
      setIsLoading(true)
      
      // Get the current session
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        throw new Error('No active session')
      }

      // Make the request with the authorization header
      const response = await fetch('/api/test-rls', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      
      const data = await response.json() as TestResponse
      setResults(data)
    } catch (error) {
      console.error('Test error:', error)
      setResults({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to run tests',
        results: {}
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>RLS Policy Tests</CardTitle>
        <CardDescription>
          Test Row Level Security policies for profiles and transcriptions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Button 
            onClick={runTests} 
            disabled={isLoading}
          >
            {isLoading ? 'Running Tests...' : 'Run RLS Tests'}
          </Button>

          {results && (
            <div className="mt-4 space-y-4">
              <div className="font-medium">
                Overall Status: {results.success ? 
                  <span className="text-green-500">Passed</span> : 
                  <span className="text-red-500">Failed</span>
                }
              </div>
              
              {results.error && (
                <div className="text-red-500">
                  Error: {results.error}
                </div>
              )}

              <div className="space-y-2">
                {Object.entries(results.results).map(([testName, result]) => (
                  <div 
                    key={testName} 
                    className={`p-4 rounded-lg ${
                      result.success ? 'bg-green-50' : 'bg-red-50'
                    }`}
                  >
                    <div className="font-medium">
                      Test: {testName.replace(/_/g, ' ')}
                    </div>
                    <div className={result.success ? 'text-green-600' : 'text-red-600'}>
                      {result.message}
                    </div>
                    {result.data && (
                      <pre className="mt-2 text-sm bg-gray-100 p-2 rounded overflow-auto">
                        <code>
                          {formatData(result.data)}
                        </code>
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 