"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { createClient } from "@/lib/client"
import { Settings, LogOut } from "lucide-react"
import { toast } from "@/lib/toast"
import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

export function UserAvatarMenu() {
  const supabase = createClient()
  const [userEmail, setUserEmail] = useState<string>("")
  const [userName, setUserName] = useState<string>("")
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const getUserData = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error) throw error
        
        if (user) {
          setUserEmail(user.email || "")
          // Get first name and last name from user metadata or email
          const name = user.user_metadata?.full_name || 
                      user.user_metadata?.name || // Fallback for Google OAuth
                      user.email?.split('@')[0] || 
                      ""
          setUserName(name)
        }
      } catch (error) {
        console.error("Error fetching user data:", error)
        // Don't show error toast as this is a background operation
      }
    }
    getUserData()
  }, [supabase])

  // Get the first letter of the name for the avatar, handle empty string case
  const avatarLetter = (userName || "U").charAt(0).toUpperCase()

  const handleSignOut = async () => {
    if (isLoading) return // Prevent multiple clicks
    
    try {
      setIsLoading(true)
      console.log("Starting sign out process...")
      
      // Show loading toast
      toast.loading({
        message: "Signing out...",
        description: "Please wait"
      })

      // Sign out from Supabase
      console.log("Calling supabase.auth.signOut()...")
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      // Clear any cookies
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
      })

      // Show success toast and redirect
      console.log("Sign out successful, redirecting...")
      toast.success({
        message: "Signed out successfully",
        description: "Redirecting..."
      })

      // Small delay to show the success message
      await new Promise(resolve => setTimeout(resolve, 500))

      // Force a hard redirect to root to clear all state
      window.location.href = "/"
    } catch (err) {
      console.error("Sign out error:", err)
      toast.error({
        message: "Error signing out",
        description: err instanceof Error ? err.message : "Please try again"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DropdownMenu onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className={cn(
            "relative h-8 w-8 rounded-full",
            "transition-all duration-300 ease-in-out",
            "hover:shadow-[0px_0px_3px_rgba(255,255,255,0.5)]",
            "focus:shadow-[0px_0px_3px_rgba(255,255,255,0.7)]",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
            "active:scale-95",
            isOpen && "shadow-[0px_0px_4px_rgba(255,255,255,0.9)]",
            isLoading && "opacity-50 cursor-not-allowed"
          )}
          disabled={isLoading}
        >
          <Avatar className={cn(
            "h-8 w-8",
            "transition-all duration-300",
            "bg-gradient-to-b from-blue-400 to-blue-600",
            "dark:from-blue-500 dark:to-blue-700",
            "border border-white/20 dark:border-black/20",
            "overflow-hidden" // Prevent letter overflow
          )}>
            <AvatarFallback className={cn(
              "text-white font-eudoxusSansBold text-sm",
              "bg-gradient-to-b from-blue-400 to-blue-600",
              "dark:from-blue-500 dark:to-blue-700",
              "flex items-center justify-center" // Center the letter
            )}>
              {avatarLetter}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <AnimatePresence>
        {isOpen && (
          <DropdownMenuContent 
            className={cn(
              "w-[240px] p-2",
              "backdrop-blur-[8px]",
              "bg-white/90 dark:bg-gray-900/90",
              "border border-white/20 dark:border-white/10",
              "shadow-[0px_0px_3px_rgba(255,255,255,0.5)]",
              "dark:shadow-[0px_0px_3px_rgba(0,0,0,0.5)]",
              "z-50" // Ensure dropdown is above other elements
            )} 
            align="end"
            alignOffset={4} // Small offset to prevent overlap
            side="bottom"
            sideOffset={8}
            asChild
          >
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center gap-3 p-2">
                <Avatar className={cn(
                  "h-8 w-8",
                  "bg-gradient-to-b from-blue-400 to-blue-600",
                  "dark:from-blue-500 dark:to-blue-700",
                  "border border-white/20 dark:border-black/20",
                  "overflow-hidden"
                )}>
                  <AvatarFallback className={cn(
                    "text-white font-eudoxusSansBold text-sm",
                    "bg-gradient-to-b from-blue-400 to-blue-600",
                    "dark:from-blue-500 dark:to-blue-700",
                    "flex items-center justify-center"
                  )}>
                    {avatarLetter}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col min-w-0"> {/* Prevent text overflow */}
                  <p className="text-[13px] font-eudoxusSansBold text-gray-900 dark:text-white truncate">
                    {userName || "User"}
                  </p>
                  <p className="text-[13px] font-eudoxusSansMedium text-gray-500 dark:text-gray-400 truncate">
                    {userEmail || "Loading..."}
                  </p>
                </div>
              </div>
              <DropdownMenuSeparator className="my-1 opacity-50" />
              <motion.div
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: {
                      staggerChildren: 0.1
                    }
                  }
                }}
              >
                <DropdownMenuItem asChild>
                  <motion.div
                    variants={{
                      hidden: { opacity: 0, x: -10 },
                      visible: { opacity: 1, x: 0 }
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 p-2 cursor-pointer",
                      "text-[13px] font-eudoxusSansMedium",
                      "hover:bg-gray-100 dark:hover:bg-gray-800",
                      "transition-colors duration-200",
                      "rounded-md",
                      "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    )}
                  >
                    <Settings className="h-4 w-4" />
                    <span>Manage account</span>
                  </motion.div>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <motion.div
                    variants={{
                      hidden: { opacity: 0, x: -10 },
                      visible: { opacity: 1, x: 0 }
                    }}
                    onClick={handleSignOut}
                    className={cn(
                      "w-full flex items-center gap-3 p-2 cursor-pointer",
                      "text-[13px] font-eudoxusSansMedium",
                      "text-red-600 dark:text-red-400",
                      "hover:bg-red-50 dark:hover:bg-red-900/20",
                      "transition-colors duration-200",
                      "rounded-md",
                      "focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500",
                      isLoading && "opacity-50 cursor-not-allowed pointer-events-none"
                    )}
                  >
                    <LogOut className="h-4 w-4" />
                    <span>{isLoading ? "Signing out..." : "Sign out"}</span>
                  </motion.div>
                </DropdownMenuItem>
              </motion.div>
            </motion.div>
          </DropdownMenuContent>
        )}
      </AnimatePresence>
    </DropdownMenu>
  )
} 