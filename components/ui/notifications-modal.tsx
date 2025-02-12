"use client"

import * as React from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useMediaQuery } from "@/hooks/use-media-query"

interface Notification {
  id: string
  title: string
  description: string
  time: string
  read: boolean
}

const demoNotifications: Notification[] = [
  {
    id: "1",
    title: "New team member added",
    description: "Sarah Johnson has joined the project",
    time: "5 min ago",
    read: false,
  },
  {
    id: "2",
    title: "Database backup completed",
    description: "Your database has been successfully backed up",
    time: "1 hour ago",
    read: false,
  },
  {
    id: "3",
    title: "Storage limit reaching",
    description: "You have used 80% of your storage quota",
    time: "2 hours ago",
    read: true,
  },
]

export function NotificationsModal() {
  const [notifications, setNotifications] = React.useState(demoNotifications)
  const [open, setOpen] = React.useState(false)
  const isDesktop = useMediaQuery("(min-width: 1024px)")
  const unreadCount = notifications.filter((n) => !n.read).length

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  const content = (
    <ScrollArea className="h-[300px] pr-4">
      <div className="space-y-4">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`rounded-lg border p-3 transition-colors ${
              notification.read ? "border-gray-100 bg-gray-50" : "border-gray-200 bg-white"
            }`}
            onClick={() => markAsRead(notification.id)}
          >
            <div className="mb-1 flex items-center justify-between">
              <h4 className="text-sm font-medium">{notification.title}</h4>
              <span className="text-[10px] text-gray-500">{notification.time}</span>
            </div>
            <p className="text-xs text-gray-600">{notification.description}</p>
          </div>
        ))}
      </div>
    </ScrollArea>
  )

  if (isDesktop) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
                {unreadCount}
              </span>
            )}
            <span className="sr-only">Notifications</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <h2 className="text-lg font-semibold mb-4">Notifications</h2>
          {content}
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full justify-start relative">
          <Bell className="mr-2 h-4 w-4" />
          Notifications
          {unreadCount > 0 && (
            <span className="absolute right-2 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
              {unreadCount}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Notifications</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  )
}

