"use client"

import { useEffect, useCallback, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import { createClient } from "@/lib/client"
import { toast } from "@/lib/toast"
import { Session } from '@supabase/supabase-js'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = useRef(createClient())
  const hasShownWelcomeToast = useRef(false)

  const showWelcomeToast = useCallback(async () => {
    if (hasShownWelcomeToast.current) return

    try {
      const { data: { user } } = await supabase.current.auth.getUser()
      if (user) {
        // Get user's name from metadata or email
        const name = user.user_metadata?.full_name || 
                    user.user_metadata?.name || // Fallback for Google OAuth
                    user.email?.split('@')[0] || 
                    'there'
                    
        toast.success({
          message: "Welcome back!",
          description: `Great to see you again, ${name}!`
        })
        hasShownWelcomeToast.current = true
      }
    } catch (error) {
      console.error("Error showing welcome toast:", error)
    }
  }, [])

  const handleAuthChange = useCallback(async (event: string, session: Session | null) => {
    console.log("Auth state changed:", event, "Session:", session ? "exists" : "none")

    if (event === "SIGNED_IN") {
      console.log("Handling SIGNED_IN event...")
      if (pathname === "/") {
        router.push("/transcribe")
      }
      showWelcomeToast()
    } else if (event === "SIGNED_OUT") {
      console.log("Handling SIGNED_OUT event...")
      toast.success({
        message: "Successfully signed out",
        description: "Come back soon!"
      })
      window.location.replace("/")
    }
  }, [pathname, router, showWelcomeToast])

  useEffect(() => {
    console.log("Initializing auth provider...")

    // Set up auth state change listener
    const { data: { subscription } } = supabase.current.auth.onAuthStateChange(handleAuthChange)

    // Check initial session
    const checkSession = async () => {
      console.log("Checking initial session...")
      const { data: { session } } = await supabase.current.auth.getSession()
      console.log("Initial session:", session ? "exists" : "none")

      if (session && !hasShownWelcomeToast.current) {
        showWelcomeToast()
      }

      if (!session && pathname !== "/" && !pathname.startsWith('/auth/')) {
        console.log("No session found, redirecting to root...")
        toast.custom({
          message: "Session expired",
          description: "Please sign in to continue",
          variant: "error"
        })
        window.location.replace("/")
      }
    }
    
    checkSession()

    return () => {
      console.log("Cleaning up auth state change listener...")
      subscription?.unsubscribe()
    }
  }, [handleAuthChange, pathname, showWelcomeToast])

  return children
} 