import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[100px]",
    "text-base font-eudoxusSansMedium select-none",
    "ring-offset-white transition-colors w-fit",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2", 
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_*]:select-none [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
    "dark:ring-offset-neutral-950 dark:focus-visible:ring-neutral-300"
  ].join(" "),
  {
    variants: {
      variant: {
        default: [
          "bg-white text-black stroke-white stroke-[0.5px] ring-1 ring-inset ring-[#F9F9F8]",
          "shadow-button-outer_default",
          "transition-all duration-200 ease-out",
          "hover:shadow-button-outer-hover_default hover:duration-[375ms]",
          "active:shadow-button-outer-press_default active:scale-[0.99] active:duration-100 lg:shadow-button-outer_default-lg lg:hover:shadow-button-outer-hover_default-lg lg:active:shadow-button-outer-press_default-lg",
        ].join(" "),
        close: [
          "bg-transparent [&_svg]:stroke-none",
          "hover:bg-neutral-100/10",
          "[&_svg]:stroke-neutral-950/50 [&_svg]:stroke-[1.5px]",
          "hover:[&_svg]:stroke-neutral-950",
          "dark:[&_svg]:stroke-neutral-50/50",
          "dark:hover:[&_svg]:stroke-neutral-50",
          "rounded-md",
          "p-1",
        ].join(" "),
        destructive:
          "bg-red-500 text-neutral-50 hover:bg-red-500/90 dark:bg-red-900 dark:text-neutral-50 dark:hover:bg-red-900/90",
        outline:
          "border border-neutral-200 bg-white hover:bg-neutral-100 hover:text-neutral-900 dark:border-neutral-800 dark:bg-white dark:hover:bg-neutral-800 dark:hover:text-neutral-50",
        secondary:
          "bg-neutral-100 text-neutral-900 hover:bg-neutral-100/80 dark:bg-neutral-800 dark:text-neutral-50 dark:hover:bg-neutral-800/80",
        ghost: "hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-50",
        link: "text-neutral-900 underline-offset-4 hover:underline dark:text-neutral-50",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const buttonInnerVariants = cva(
  "inline-flex items-center justify-center rounded-[100px] w-fit",
  {
    variants: {
      variant: {
        default: "shadow-button-inner stroke-[#F9F9F8] stroke-[0.5px]",
        close: "",
        destructive: "drop-shadow-none",
        outline: "drop-shadow-none",
        secondary: "drop-shadow-none",
        ghost: "",
        link: "",
      },
      size: {
        default: "gap-[6px] px-[16px] py-[6px] text-[14px] sm:gap-2 sm:px-[24px] sm:py-[8px] sm:text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants>,
    VariantProps<typeof buttonInnerVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, className }))}
        ref={ref}
        {...props}
      >
        <div className={cn(buttonInnerVariants({ variant, size }))}>
          {children}
        </div>
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
