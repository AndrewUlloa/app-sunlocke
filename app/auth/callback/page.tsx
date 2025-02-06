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
        const fullUrl = window.location.href
        console.log("Starting auth callback handler...")
        console.log("Full callback URL:", fullUrl)
        
        // Get all URL parameters for debugging
        const params = Object.fromEntries(new URLSearchParams(window.location.search))
        console.log("All URL parameters:", params)
        
        // Get the auth code from the URL
        const code = params.code
        const error = params.error
        const errorDescription = params.error_description
        
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

        // Refresh the router to ensure the session is recognized
        router.refresh()

        // Use a small delay to ensure the session is properly established
        setTimeout(() => {
          // Try multiple redirect methods to ensure it works
          try {
            router.push("/transcribe")
            // Also update the URL to avoid staying on the callback page
            window.history.replaceState({}, '', "/transcribe")
          } catch (routerError) {
            console.log("Router push failed:", routerError)
            console.log("Falling back to window.location.replace...")
            window.location.replace("/transcribe")
          }
        }, 500)
      } catch (err) {
        console.error("Auth callback error:", err)
        toast.error({
          message: "Authentication failed",
          description: err instanceof Error ? err.message : "Please try again"
        })
        
        // Log the error for debugging
        console.error("Full error details:", err)
        
        // Delay the redirect slightly to ensure the error toast is shown
        setTimeout(() => {
          window.location.replace("/")
        }, 2000)
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