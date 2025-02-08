"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/client"
import { toast } from "@/lib/toast"

export default function AuthCallbackPage() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    console.log("Callback page mounted")
    const params = new URLSearchParams(window.location.search)
    console.log("URL params:", Object.fromEntries(params))
    // Only run if a code parameter exists
    if (!params.has("code")) {
      return
    }

    const handleCallback = async () => {
      try {
        console.log("Starting auth callback handler...")
        console.log("Full callback URL:", window.location.href)

        // Get all URL parameters for debugging
        const allParams = Object.fromEntries(params)
        console.log("All URL parameters:", allParams)

        // Get the auth code from the URL
        const code = params.get("code")
        const error = params.get("error")
        const errorDescription = params.get("error_description")

        console.log("Auth parameters:", { 
          code: code ? "Present" : "Missing",
          error: error || "None",
          errorDescription: errorDescription || "None"
        })

        if (error || errorDescription) {
          throw new Error(errorDescription || error || 'OAuth error occurred')
        }

        if (!code) {
          throw new Error('No code found in URL')
        }

        // Exchange the code for a session
        console.log("Exchanging auth code for session...")
        const { data: exchangeData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
        console.log("Exchange response:", {
          success: !exchangeError,
          hasData: !!exchangeData,
          error: exchangeError?.message || "None"
        })

        if (exchangeError) {
          console.error("Exchange error details:", exchangeError)
          throw exchangeError
        }

        // Get the session to verify it worked
        console.log("Verifying session...")
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        console.log("Session verification:", {
          success: !sessionError,
          hasSession: !!session,
          error: sessionError?.message || "None"
        })

        if (sessionError) {
          console.error("Session error details:", sessionError)
          throw sessionError
        }

        if (!session) {
          throw new Error('No session established')
        }

        // Success! Show toast and redirect
        console.log("Authentication successful, redirecting to /transcribe...")
        toast.success({
          message: "Successfully signed in",
          description: "Welcome back!"
        })

        // Clear query parameters immediately
        window.history.replaceState({}, '', "/transcribe")

        // Refresh the router to ensure the session is recognized
        router.refresh()

        // Use router push as well
        router.push("/transcribe")
      } catch (err) {
        console.error("Auth callback error:", err)
        toast.error({
          message: "Authentication failed",
          description: err instanceof Error ? err.message : "Please try again"
        })

        // Delay the redirect slightly so the error toast is visible
        setTimeout(() => {
          window.location.replace("/")
        }, 2000)
      }
    }

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