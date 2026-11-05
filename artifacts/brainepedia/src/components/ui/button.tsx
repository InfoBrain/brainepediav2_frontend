import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[10px] text-sm font-bold tracking-tight transition-[color,background,border,transform,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground border border-transparent shadow-[0_6px_17px_rgba(125,76,204,0.2)] hover:bg-[#6538ad]",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm border border-transparent",
        outline:
          "border border-border bg-white text-[#3f485d] shadow-none hover:border-[#c9b5e5] hover:bg-[#fcfaff] hover:text-primary dark:bg-transparent dark:text-foreground",
        secondary:
          "border border-border bg-white text-[#3f485d] shadow-none hover:border-[#c9b5e5] hover:bg-[#fcfaff] hover:text-primary dark:bg-card dark:text-foreground",
        ghost: "border border-transparent text-primary hover:bg-[#f5f0fc] dark:hover:bg-white/5",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "min-h-[42px] px-4 py-2",
        sm: "min-h-8 rounded-lg px-3 text-xs",
        lg: "min-h-11 rounded-[10px] px-6",
        icon: "h-[38px] w-[38px] rounded-[10px]",
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
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
