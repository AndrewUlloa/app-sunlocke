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
    
    if (!params.has("code")) {
      console.log("No code found, redirecting to home...")
      window.location.href = "/"
      return
    }

    const handleCallback = async () => {
      try {
        console.log("Starting auth callback handler...")
        const code = params.get("code")
        
        // Exchange the code for a session
        console.log("Exchanging auth code for session...")
        const { data: exchangeData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code!)
        
        if (exchangeError) {
          throw exchangeError
        }

        // Get the session to verify it worked
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError || !session) {
          throw sessionError || new Error('No session established')
        }

        console.log("Authentication successful, redirecting...")
        
        // Show success message
        toast.success({
          message: "Successfully signed in",
          description: "Welcome back!"
        })

        // Use a more direct navigation approach
        try {
          // First try Next.js navigation
          router.push("/transcribe")
          router.refresh()
        } catch (navError) {
          console.log("Router navigation failed, using window.location...")
          // Fallback to window.location
          window.location.href = "/transcribe"
        }

      } catch (err) {
        console.error("Auth callback error:", err)
        toast.error({
          message: "Authentication failed",
          description: err instanceof Error ? err.message : "Please try again"
        })
        
        // Redirect to home on error
        window.location.href = "/"
      }
    }

    // Execute the callback handler
    handleCallback()
  }, [router, supabase])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-t-blue-600 border-b-blue-600 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Completing authentication...</p>
        <p className="text-sm text-gray-500 mt-2">Please wait while we redirect you</p>
      </div>
    </div>
  )
} 