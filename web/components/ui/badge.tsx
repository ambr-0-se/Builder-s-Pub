import type React from "react"
import { cn } from "@/lib/utils"

interface BadgeProps {
  children: React.ReactNode
  variant?: "default" | "secondary" | "outline"
  className?: string
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        {
          "bg-blue-100 text-blue-800": variant === "default",
          "bg-gray-100 text-gray-800": variant === "secondary",
          "border border-gray-200 text-gray-700": variant === "outline",
        },
        className,
      )}
    >
      {children}
    </span>
  )
}
