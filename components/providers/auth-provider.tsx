"use client"

import { useEffect, useCallback, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import { createClient } from "@/lib/client"
import { toast } from "@/lib/toast"
import { Session } from '@supabase/supabase-js'
import { AuthChangeEvent } from "@supabase/supabase-js"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = useRef(createClient())
  const hasShownWelcomeToast = useRef(false)
  const initialSessionChecked = useRef(false)

  const showWelcomeToast = useCallback(async () => {
    if (hasShownWelcomeToast.current) return

    try {
      const { data: { user } } = await supabase.current.auth.getUser()
      if (user) {
        const name = user.user_metadata?.full_name || 
                    user.user_metadata?.name || 
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
      hasShownWelcomeToast.current = false
    }
  }, [])

  const handleAuthChange = useCallback(async (event: AuthChangeEvent, session: Session | null) => {
    console.log("Auth state changed:", event, "Session:", session ? "exists" : "none")

    if (event === 'SIGNED_IN') {
      console.log("Handling SIGNED_IN event...")
      showWelcomeToast()
    } else if (event === 'SIGNED_OUT') {
      console.log("Handling SIGNED_OUT event...")
      hasShownWelcomeToast.current = false
      toast.success({
        message: "Successfully signed out",
        description: "Come back soon!"
      })
      window.location.replace("/")
    }
  }, [showWelcomeToast])

  useEffect(() => {
    const { data: { subscription } } = supabase.current.auth.onAuthStateChange(handleAuthChange)

    // Check initial session only once and only for non-admin routes
    const checkSession = async () => {
      if (initialSessionChecked.current || pathname.startsWith('/admin')) {
        return
      }

      initialSessionChecked.current = true
      const { data: { session } } = await supabase.current.auth.getSession()
      console.log("Initial session check:", session ? "exists" : "none")

      if (!session && pathname !== "/" && !pathname.startsWith('/auth/')) {
        toast.custom({
          message: "Session expired",
          description: "Please sign in to continue",
          variant: "error"
        })
        window.location.replace("/")
      } else if (session && pathname === "/") {
        // Redirect to transcribe if on root
        router.push("/transcribe")
      } else if (session && !hasShownWelcomeToast.current && pathname === "/transcribe") {
        // Only show welcome toast on transcribe page for session restores
        showWelcomeToast()
      }
    }
    
    checkSession()

    return () => {
      subscription?.unsubscribe()
    }
  }, [handleAuthChange, pathname, router, showWelcomeToast])

  return children
} 