"use client"

import { DashboardHeader } from "@/components/ui/dashboard-header"
import { BottomNav } from "@/components/ui/bottom-nav"
import { Sidebar, SidebarProvider } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import "@/app/globals.css"
import { Inclusive_Sans } from "next/font/google"
import type React from "react"
import { AnimatedBackground } from "@/components/ui/animated-background"

const inclusiveSans = Inclusive_Sans({
  subsets: ["latin"],
  weight: ["400"] as const,
  variable: "--font-inclusive-sans",
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <div className={cn("relative min-h-screen font-sans", inclusiveSans.className)}>
        <AnimatedBackground>
          <div className="relative flex min-h-screen flex-col">
            <DashboardHeader />
            <div className="relative flex flex-1 overflow-hidden">
              <Sidebar className="hidden lg:block" />
              <main className="flex-1 lg:ml-64">
                <div className="container mx-auto p-4 pb-20 lg:pb-4">{children}</div>
              </main>
            </div>
            <BottomNav />
          </div>
        </AnimatedBackground>
      </div>
    </SidebarProvider>
  )
}
