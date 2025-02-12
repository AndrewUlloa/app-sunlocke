"use client"

import * as React from "react"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer"
import { ScrollArea } from "@/components/ui/scroll-area"
import { navItems, NavItem } from "@/components/ui/bottom-nav"
import { FeedbackModal } from "@/components/ui/feedback-modal"
import { HelpModal } from "@/components/ui/help-modal"
import { NotificationsModal } from "@/components/ui/notifications-modal"

export function MobileNav() {
  const [open, setOpen] = React.useState(false)

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle navigation menu</span>
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Navigation</DrawerTitle>
        </DrawerHeader>
        <ScrollArea className="h-[calc(100vh-8rem)] px-2">
          <div className="flex flex-col gap-2 pb-4">
            {navItems.map((item: NavItem) => {
              const Icon = item.icon
              return (
                <Button key={item.label} variant="ghost" className="justify-start" asChild>
                  <a href={item.href}>
                    <Icon className="mr-2 h-5 w-5" />
                    {item.label}
                  </a>
                </Button>
              )
            })}
            <div className="lg:hidden">
              <FeedbackModal />
              <NotificationsModal />
              <HelpModal />
            </div>
          </div>
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  )
}

