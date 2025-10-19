import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

export const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
  {
    variants: {
      variant: {
        default: "border bg-background text-foreground",
        destructive:
          "destructive group border-destructive bg-destructive text-destructive-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export type ToastProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof toastVariants>

// Minimal toast shim for development. Replace with a real UI as needed.
export type ToastOptions = {
  title?: string
  description?: string
  variant?: "default" | "destructive"
}

export function toast(opts: ToastOptions) {
  const { title, description, variant } = opts || {}
  const msg = [title, description].filter(Boolean).join(" - ")
  if (typeof window !== "undefined") {
    if (variant === "destructive") {
      // eslint-disable-next-line no-console
      console.error(msg)
    } else {
      // eslint-disable-next-line no-console
      console.log(msg)
    }
  }
}
