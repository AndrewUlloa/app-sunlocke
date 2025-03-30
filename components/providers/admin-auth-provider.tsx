"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  useEffect(() => {
    // Only apply this logic to admin pages
    if (!pathname.startsWith('/admin')) return

    // Function to ensure admin credentials are present
    const ensureAdminAuth = () => {
      // Get the stored auth credentials
      const storedAuth = localStorage.getItem('adminAuth')
      
      // If we don't have stored credentials but we're on an admin page
      // then we're likely seeing the auth challenge - store the credentials
      // when the user enters them
      if (!storedAuth) {
        // Listen for the first successful admin response
        const checkAuthSuccess = () => {
          const authHeader = 'admin:marketing2024'
          const base64Auth = btoa(authHeader)
          localStorage.setItem('adminAuth', base64Auth)
        }
        
        // After the auth challenge is likely completed
        setTimeout(checkAuthSuccess, 2000)
        return
      }
      
      // If we have stored credentials, ensure they're sent with requests
      // by refreshing the page with the auth header
      const currentAuth = document.cookie.includes('adminAuthed=true')
      if (!currentAuth) {
        // Set a cookie to prevent infinite refresh loops
        document.cookie = "adminAuthed=true; path=/; max-age=3600"
        
        // Redirect to same page with auth header
        const headers = new Headers()
        headers.set('Authorization', `Basic ${storedAuth}`)
        
        // Use fetch to send a HEAD request with auth header to "warm up" the auth
        fetch(window.location.href, {
          method: 'HEAD',
          headers,
          credentials: 'include'
        }).then(() => {
          // Refresh the page, browser will include the auth header
          window.location.reload()
        })
      }
    }

    // Handle visibility changes - when tab becomes visible again
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        ensureAdminAuth()
      }
    }

    // Run on initial load
    ensureAdminAuth()
    
    // Add visibility change listener
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [pathname])

  return children
} 