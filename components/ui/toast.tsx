import * as React from "react"
import { Toaster as Sonner } from "sonner"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const toastVariants = cva(
  [
    "group select-none font-eudoxusSansMedium",
    "rounded-lg backdrop-blur-[8px]",
    "bg-white/90 text-black",
    "shadow-[0px_4px_12px_rgba(0,0,0,0.1)]",
  ].join(" "),
  {
    variants: {
      variant: {
        default: [
          "[&[data-sonner-toast]]:border [&[data-sonner-toast]]:border-neutral-200",
          "[&[data-sonner-toast][data-type=success]]:bg-[rgba(236,253,245,0.9)]",
          "[&[data-sonner-toast][data-type=success]]:border-[rgba(6,95,70,0.1)]",
          "[&[data-sonner-toast][data-type=success]]:text-[#065F46]",
          "[&[data-sonner-toast][data-type=success]_[data-icon]]:text-[#065F46]",
          "[&[data-sonner-toast][data-type=error]]:bg-[rgba(254,242,242,0.9)]",
          "[&[data-sonner-toast][data-type=error]]:border-[rgba(153,27,27,0.1)]",
          "[&[data-sonner-toast][data-type=error]]:text-[#991B1B]",
          "[&[data-sonner-toast][data-type=error]_[data-icon]]:text-[#991B1B]",
          "[&[data-sonner-toast]_[data-description]]:font-eudoxusSansRegular",
          "[&[data-sonner-toast]_[data-description]]:text-sm",
          "[&[data-sonner-toast]_[data-description]]:opacity-90",
        ].join(" "),
      },
      size: {
        default: "text-sm",
        large: "text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ToastProps
  extends React.ComponentProps<typeof Sonner>,
    VariantProps<typeof toastVariants> {}

const Toast = React.forwardRef<
  React.ElementRef<typeof Sonner>,
  ToastProps
>(({ className, variant, size, ...props }, ref) => {
  return (
    <Sonner
      ref={ref}
      className={cn(toastVariants({ variant, size, className }))}
      position="bottom-right"
      theme="light"
      duration={5000}
      {...props}
    />
  )
})
Toast.displayName = "Toast"

export { Toast, toastVariants } 