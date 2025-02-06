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
        console.log("Starting auth callback handler...")
        
        // Get the auth code from the URL
        const code = new URLSearchParams(window.location.search).get('code')
        console.log("Auth code from URL:", code ? "Found" : "Not found")
        
        if (!code) {
          throw new Error('No code found in URL')
        }

        // Exchange the code for a session
        console.log("Exchanging auth code for session...")
        const { data: exchangeData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
        console.log("Exchange result:", exchangeError ? "Error" : "Success", exchangeData ? "Data present" : "No data")
        
        if (exchangeError) {
          console.error("Exchange error:", exchangeError)
          throw exchangeError
        }

        // Get the session to verify it worked
        console.log("Verifying session...")
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        console.log("Session check result:", sessionError ? "Error" : "Success", session ? "Session exists" : "No session")
        
        if (sessionError) {
          console.error("Session error:", sessionError)
          throw sessionError
        }

        if (!session) {
          throw new Error('No session established')
        }

        // Success! Redirect to app
        console.log("Authentication successful, redirecting to /transcribe...")
        
        // Try both methods of redirection
        try {
          router.push("/transcribe")
        } catch (routerError) {
          console.log("Router push failed, using window.location...")
          window.location.href = "/transcribe"
        }
      } catch (err) {
        console.error("Auth callback error:", err)
        toast.error({
          message: "Authentication failed",
          description: err instanceof Error ? err.message : "Please try again"
        })

        // Try both methods of redirection
        try {
          router.push("/")
        } catch (routerError) {
          console.log("Router push failed, using window.location...")
          window.location.href = "/"
        }
      }
    }

    // Call the handler immediately
    handleCallback()
  }, [router, supabase])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-t-blue-600 border-b-blue-600 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Completing authentication...</p>
        <p className="text-sm text-gray-500 mt-2">Please check the console for progress</p>
      </div>
    </div>
  )
} 