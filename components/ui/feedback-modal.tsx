"use client"

import * as React from "react"
import { MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"
import { useMediaQuery } from "@/hooks/use-media-query"

export function FeedbackModal() {
  const [feedback, setFeedback] = React.useState("")
  const [open, setOpen] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)
  const isDesktop = useMediaQuery("(min-width: 1024px)")

  // Only show content after hydration
  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Return null during SSR and initial render
  if (!mounted) return null

  const handleSubmit = async () => {
    // Here you would typically send the feedback to your backend
    console.log("Feedback submitted:", feedback)
    setFeedback("")
    setOpen(false)
  }

  const content = (
    <div className="space-y-4 p-4">
      <h2 className="text-lg font-semibold">Send Feedback</h2>
      <p className="text-sm text-gray-500">Share your thoughts with us to help improve the platform.</p>
      <Textarea
        placeholder="Type your feedback here..."
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        className="min-h-[100px] resize-none"
      />
      <Button className="w-full" onClick={handleSubmit} disabled={!feedback.trim()}>
        Send feedback
      </Button>
    </div>
  )

  if (isDesktop) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MessageSquare className="h-5 w-5" />
            <span className="sr-only">Feedback</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          {content}
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="w-full justify-start">
          <MessageSquare className="mr-2 h-4 w-4" />
          Feedback
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send Feedback</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  )
}

