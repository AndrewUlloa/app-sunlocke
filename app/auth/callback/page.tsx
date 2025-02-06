"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/client"
import { toast } from "@/lib/toast"

export default function AuthCallbackPage() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the auth code from the URL
        const code = new URLSearchParams(window.location.search).get('code')
        
        if (!code) {
          throw new Error('No code found in URL')
        }

        // Exchange the code for a session
        console.log("Exchanging auth code for session...")
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        
        if (error) {
          throw error
        }

        // Get the session to verify it worked
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          throw sessionError
        }

        if (!session) {
          throw new Error('No session established')
        }

        console.log("Authentication successful, redirecting...")
        window.location.href = "/transcribe"
      } catch (err) {
        console.error("Auth callback error:", err)
        toast.error({
          message: "Authentication failed",
          description: err instanceof Error ? err.message : "Please try again"
        })
        window.location.href = "/"
      }
    }

    handleCallback()
  }, [router, supabase])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-t-blue-600 border-b-blue-600 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Completing authentication...</p>
      </div>
    </div>
  )
} 