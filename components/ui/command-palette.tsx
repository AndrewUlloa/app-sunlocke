"use client"

import * as React from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Bookmark, Home, Layout, Shield } from "lucide-react"

const commands = [
  {
    icon: Bookmark,
    label: "View watchlist",
    shortcut: ["W"],
    href: "#watchlist",
  },
  {
    icon: Layout,
    label: "Go to Screener",
    shortcut: ["G", "S"],
    href: "#screener",
  },
  {
    icon: Home,
    label: "Go to Home",
    shortcut: ["G", "H"],
    href: "#home",
  },
  {
    icon: Shield,
    label: "Go to Insiders",
    shortcut: ["G", "I"],
    href: "#insiders",
  },
]

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 overflow-hidden shadow-lg" style={{ top: "20%", transform: "translate(-50%, 0)" }}>
        <Command className="rounded-lg border border-gray-200 shadow-md">
          <CommandInput placeholder="Type a command or search..." className="h-12" />
          <CommandList className="max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Navigation">
              {commands.map((command) => {
                const Icon = command.icon
                return (
                  <CommandItem
                    key={command.label}
                    onSelect={() => {
                      window.location.href = command.href
                      onOpenChange(false)
                    }}
                    className="flex items-center justify-between py-3 px-4 cursor-pointer hover:bg-gray-100"
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span>{command.label}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {command.shortcut.map((key, index) => (
                        <React.Fragment key={index}>
                          {index > 0 && <span className="text-xs text-gray-500">then</span>}
                          <kbd className="rounded bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-900">{key}</kbd>
                        </React.Fragment>
                      ))}
                    </div>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  )
}

