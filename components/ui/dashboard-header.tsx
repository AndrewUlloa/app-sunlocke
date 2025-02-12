"use client"

import * as React from "react"
import { ChevronDown, LogOut, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { MobileNav } from "@/components/ui/mobile-nav"
import { FeedbackModal } from "@/components/ui/feedback-modal"
import { NotificationsModal } from "@/components/ui/notifications-modal"
import { HelpModal } from "@/components/ui/help-modal"
import { Logo } from "@/components/ui/logo"

const clients = [
  { name: "Wyld Chyld Tattoos", id: "wyld-chyld-tattoos" },
  { name: "Moon Industries", id: "moon-industries" },
  { name: "Star Systems", id: "star-systems" },
]

const currentUser = {
  name: "Andrew Ulloa",
  email: "andrewulloa@sunlocke.com",
  avatarUrl:
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%202025-02-11%20at%2012.28.02%E2%80%AFAM-Hrk5EykbxHyVCApWB0bIKKitQEc7Dz.png",
}

export function DashboardHeader() {
  const [selectedClient, setSelectedClient] = React.useState(clients[0])
  const [viewMode, setViewMode] = React.useState<"internal" | "external">("internal")

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-12 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="flex h-full items-center justify-between gap-2 px-4 lg:px-6">
        {/* Logo */}
        <Logo />

        {/* Client Dropdown and View Mode - Visible on all screen sizes */}
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 gap-2 px-2 text-sm font-normal text-gray-700">
                <span className="inline-block">{selectedClient.name}</span>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {clients.map((client) => (
                <DropdownMenuItem key={client.id} onClick={() => setSelectedClient(client)}>
                  {client.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <span className="text-gray-300">/</span>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 gap-2 px-2 text-sm font-normal text-gray-700">
                {viewMode === "internal" ? "Internal" : "External"}
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => setViewMode("internal")}>Internal</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setViewMode("external")}>External</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Action Buttons - Visible only on lg screens and above */}
        <div className="hidden lg:flex items-center gap-2">
          <FeedbackModal />
          <NotificationsModal />
          <HelpModal />
        </div>

        {/* User Avatar */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              className="h-8 w-8 rounded-full p-0 hover:bg-transparent focus-visible:ring-offset-0"
            >
              <Avatar className="h-8 w-8 border-2 border-white ring-2 ring-transparent transition-all hover:ring-gray-200 data-[state=open]:ring-gray-200">
                <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} />
                <AvatarFallback>AU</AvatarFallback>
              </Avatar>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-6" align="end" sideOffset={8}>
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} />
                <AvatarFallback>AU</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-base font-semibold">{currentUser.name}</span>
                <span className="text-sm text-gray-500">{currentUser.email}</span>
              </div>
            </div>
            <div className="mt-6 flex flex-col gap-2">
              <Button variant="ghost" className="w-full justify-start gap-2 px-2 font-normal hover:bg-gray-100">
                <Settings className="h-4 w-4" />
                Manage account
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 px-2 font-normal text-red-600 hover:bg-red-50 hover:text-red-600"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Menu Button - Now on the right side for mobile and tablet */}
        <div className="lg:hidden">
          <MobileNav />
        </div>
      </div>
    </header>
  )
}

