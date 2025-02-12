"use client"

import * as React from "react"
import { Home, RefreshCw, Calendar, Bookmark, LineChart, Layout, Shield, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { CommandPalette } from "@/components/ui/command-palette"
import { useMediaQuery } from "../../hooks/use-media-query"
import Link from "next/link"

export interface NavItem {
  icon: React.ElementType
  label: string
  href: string
}

export const navItems: NavItem[] = [
  { icon: Home, label: "Home", href: "/dashboard" },
  { icon: RefreshCw, label: "Sync", href: "#" },
  { icon: Calendar, label: "Calendar", href: "#" },
  { icon: Bookmark, label: "Saved", href: "#" },
  { icon: LineChart, label: "Analytics", href: "#" },
  { icon: Layout, label: "Presentations", href: "#" },
  { icon: Shield, label: "Security", href: "#" },
]

type Size = "base" | "sm" | "md" | "lg"

export function BottomNav() {
  const [activeIndex, setActiveIndex] = React.useState(0)
  const [isSearchActive, setIsSearchActive] = React.useState(false)
  const [isVisible, setIsVisible] = React.useState(false)
  const [triggerHeight, setTriggerHeight] = React.useState(0)
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null)
  const bottomNavRef = React.useRef<HTMLDivElement>(null)
  const triggerRef = React.useRef<HTMLDivElement>(null)

  // Use a single media query for the breakpoint
  const isLargeScreen = useMediaQuery("(min-width: 1024px)")

  // Derive other breakpoints from window.matchMedia when needed
  const getSize = React.useCallback((): Size => {
    if (typeof window === "undefined") return "base"
    if (window.matchMedia("(min-width: 1024px)").matches) return "lg"
    if (window.matchMedia("(min-width: 768px)").matches) return "md"
    if (window.matchMedia("(min-width: 640px)").matches) return "sm"
    return "base"
  }, [])

  const [size, setSize] = React.useState<Size>(getSize())

  // Update size on mount and resize
  React.useEffect(() => {
    const updateSize = () => setSize(getSize())
    updateSize() // Set initial size
    window.addEventListener("resize", updateSize)
    return () => window.removeEventListener("resize", updateSize)
  }, [getSize])

  const toggleSearchActive = React.useCallback(() => {
    setIsSearchActive((prev) => !prev)
  }, [])

  const handleMouseEnter = React.useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsVisible(true)
  }, [])

  const handleMouseLeave = React.useCallback(() => {
    if (isLargeScreen) {
      timeoutRef.current = setTimeout(() => {
        setIsVisible(false)
      }, 300)
    }
  }, [isLargeScreen])

  React.useEffect(() => {
    if (isLargeScreen) {
      const handleMouseMove = (e: MouseEvent) => {
        if (window.innerHeight - e.clientY < triggerHeight) {
          handleMouseEnter()
        } else {
          handleMouseLeave()
        }
      }

      window.addEventListener("mousemove", handleMouseMove)
      return () => window.removeEventListener("mousemove", handleMouseMove)
    } else {
      setIsVisible(true)
    }
  }, [isLargeScreen, handleMouseEnter, handleMouseLeave, triggerHeight])

  React.useEffect(() => {
    const updateTriggerHeight = () => {
      if (bottomNavRef.current) {
        const height = bottomNavRef.current.offsetHeight
        setTriggerHeight(height)
        if (triggerRef.current) {
          triggerRef.current.style.height = `${height}px`
        }
      }
    }

    updateTriggerHeight()
    window.addEventListener("resize", updateTriggerHeight)

    return () => {
      window.removeEventListener("resize", updateTriggerHeight)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const variants = {
    hidden: { y: 100, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  }

  const sizeClasses = {
    base: "h-10 w-10",
    sm: "h-11 w-11",
    md: "h-12 w-12",
    lg: "h-14 w-14",
  }

  const iconSizes = {
    base: "h-4 w-4",
    sm: "h-5 w-5",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  }

  const containerClasses = {
    base: "px-1 py-1",
    sm: "px-1.5 py-1.5",
    md: "px-2 py-1.5",
    lg: "px-2 py-1.5",
  }

  return (
    <>
      {isLargeScreen && <div ref={triggerRef} className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none" />}
      <AnimatePresence>
        {(isVisible || !isLargeScreen) && (
          <motion.div
            ref={bottomNavRef}
            initial={isLargeScreen ? "hidden" : "visible"}
            animate="visible"
            exit={isLargeScreen ? "hidden" : undefined}
            variants={variants}
            transition={{
              type: "spring",
              stiffness: 500,
              damping: 30,
              ease: "easeOut",
            }}
            className={cn(
              "fixed bottom-4 left-0 right-0 z-50 flex justify-center items-center",
              isLargeScreen ? "" : "bottom-0 pb-4 pt-2",
            )}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <div
              className={cn(
                "flex items-center rounded-full bg-gray-100 border border-gray-200/50 shadow-sm",
                containerClasses[size],
                isLargeScreen ? "" : "max-w-md justify-between",
              )}
            >
              <nav className="flex items-center gap-1">
                {navItems.map((item, index) => {
                  const Icon = item.icon
                  return (
                    <Link key={item.label} href={item.href} passHref>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "rounded-full",
                          "text-gray-600 hover:text-gray-900 hover:bg-gray-200",
                          activeIndex === index && "bg-gray-200 text-gray-900",
                          sizeClasses[size],
                        )}
                        onClick={() => setActiveIndex(index)}
                      >
                        <Icon className={iconSizes[size]} />
                        <span className="sr-only">{item.label}</span>
                      </Button>
                    </Link>
                  )
                })}
              </nav>

              {/* Search Button */}
              <Button
                variant="outline"
                size="icon"
                className={cn(
                  "rounded-full bg-gray-100 border-gray-200/50 shadow-sm",
                  isSearchActive && "bg-gray-200 text-gray-900",
                  sizeClasses[size],
                )}
                onClick={toggleSearchActive}
              >
                <Search className={iconSizes[size]} />
                <span className="sr-only">Search</span>
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Command palette */}
      <CommandPalette open={isSearchActive} onOpenChange={setIsSearchActive} />
    </>
  )
}

