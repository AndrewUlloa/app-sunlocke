"use client"

import * as React from "react"
import { ArrowUpRight, BookOpen, Github, HelpCircle, MessagesSquare, Wrench } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useMediaQuery } from "@/hooks/use-media-query"

export function HelpModal() {
  const [open, setOpen] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)
  const isDesktop = useMediaQuery("(min-width: 1024px)")

  // Only show content after hydration
  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Return null during SSR and initial render
  if (!mounted) return null

  const content = (
    <div className="space-y-6">
      <p className="text-sm text-gray-500">For issues with your project or inquiries about our services:</p>

      {/* Support options */}
      <div className="grid grid-cols-3 gap-2">
        <Button variant="outline" className="flex h-auto flex-col items-center justify-start gap-2 p-4">
          <Wrench className="h-4 w-4" />
          <span className="text-xs">Troubleshooting</span>
        </Button>
        <Button variant="outline" className="flex h-auto flex-col items-center justify-start gap-2 p-4">
          <BookOpen className="h-4 w-4" />
          <span className="text-xs">Docs</span>
        </Button>
        <Button variant="outline" className="flex h-auto flex-col items-center justify-start gap-2 p-4">
          <span className="text-xs font-medium text-green-600">●</span>
          <span className="text-xs">Status</span>
        </Button>
      </div>

      <div className="space-y-2">
        <p className="text-xs text-gray-500">
          Expected response time is based on your billing plan. Projects on paid plans are prioritized.
        </p>
        <Button className="w-full" variant="outline">
          Contact Support
        </Button>
      </div>

      <Separator />

      {/* Community section */}
      <div className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Reach out to the community</h3>
          <p className="text-xs text-gray-500">
            For other support, including questions on our client libraries, advice, or best practices.
          </p>
        </div>

        <div className="space-y-2">
          <Button variant="outline" className="w-full justify-between">
            Join Discord server
            <ArrowUpRight className="h-4 w-4" />
          </Button>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-xs font-medium">
                <Github className="h-3 w-3" />
                GitHub Discussions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-start gap-2">
                <MessagesSquare className="h-3 w-3 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-xs">Question on Tutorials</p>
                  <p className="text-[10px] text-gray-500">Last active 3 days ago</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MessagesSquare className="h-3 w-3 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-xs">How to grant access to database tables?</p>
                  <p className="text-[10px] text-gray-500">Last active 5 days ago</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )

  if (isDesktop) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <HelpCircle className="h-5 w-5" />
            <span className="sr-only">Help</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <h2 className="text-lg font-semibold mb-4">Need help with your project?</h2>
          {content}
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="w-full justify-start">
          <HelpCircle className="mr-2 h-4 w-4" />
          Help
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Need help with your project?</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  )
}

