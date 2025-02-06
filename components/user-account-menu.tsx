"use client"

import { createClient } from "@/lib/client"
import { SidebarMenuButton } from "@/components/ui/sidebar"
import { UserCircle, LogOut } from "lucide-react"
import { toast } from "@/lib/toast"

export function UserAccountMenu() {
  const supabase = createClient()

  const handleSignOut = async () => {
    try {
      console.log("Starting sign out process...")
      
      // Show loading toast
      toast.loading({
        message: "Signing out...",
        description: "Please wait"
      })

      // Sign out from Supabase
      console.log("Calling supabase.auth.signOut()...")
      await supabase.auth.signOut()

      // Clear any cookies
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
      })

      // Force a hard redirect to root to clear all state
      console.log("Sign out successful, redirecting...")
      window.location.href = "/"
      window.location.reload()
    } catch (err) {
      console.error("Sign out error:", err)
      toast.error({
        message: "Error signing out",
        description: err instanceof Error ? err.message : "Please try again"
      })
    }
  }

  return (
    <>
      <SidebarMenuButton
        variant="outline"
        size="lg"
        className="justify-start gap-2"
        tooltip="Account"
      >
        <UserCircle className="h-5 w-5" />
        <span>Account</span>
      </SidebarMenuButton>
      <SidebarMenuButton
        onClick={handleSignOut}
        variant="outline"
        size="default"
        className="justify-start gap-2 text-red-500 hover:text-red-500"
        tooltip="Sign Out"
      >
        <LogOut className="h-4 w-4" />
        <span>Sign Out</span>
      </SidebarMenuButton>
    </>
  )
} 