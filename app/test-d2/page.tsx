'use client';

import { useEffect, useState } from 'react'
import { AppLayout } from '@/components/layouts/app-layout'

interface TestResult {
  success: boolean
  message: string
  data?: unknown
  error?: string
}

interface APIResponse {
  success: boolean
  message: string
  results: Record<string, TestResult>
}

export default function TestD2Page() {
  const [testData, setTestData] = useState<APIResponse | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/test-d2')
        const data = await res.json()
        setTestData(data)
      } catch (error) {
        console.error('Error fetching D2 tests:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  return (
    <AppLayout>
      <div className='container mx-auto py-8'>
        <h1 className='text-2xl font-bold mb-4'>Cloudflare D2 Test</h1>
        {loading ? (
          <p>Loading test results...</p>
        ) : testData ? (
          <div>
            <p className='mb-4'>{testData.message}</p>
            <pre className='bg-gray-100 p-4 rounded'>
              {JSON.stringify(testData.results, null, 2)}
            </pre>
          </div>
        ) : (
          <p>Error fetching test results.</p>
        )}
      </div>
    </AppLayout>
  )
} 