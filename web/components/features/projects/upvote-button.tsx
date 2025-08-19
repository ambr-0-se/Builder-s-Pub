"use client"

import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/api/auth"
import { upvoteProject } from "@/lib/api/mockProjects"

interface UpvoteButtonProps {
  projectId: string
  initialCount: number
  hasUserUpvoted?: boolean
  interactive?: boolean
}

export function UpvoteButton({ projectId, initialCount, hasUserUpvoted, interactive = true }: UpvoteButtonProps) {
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const pathname = usePathname() || "/"

  const [isUpvoting, setIsUpvoting] = useState(false)
  const [count, setCount] = useState(initialCount)
  const [didUpvote, setDidUpvote] = useState(!!hasUserUpvoted)
  const [hoverLabel, setHoverLabel] = useState<string | null>(null)

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!interactive) return

    if (!isAuthenticated) {
      router.push(`/auth/sign-in?redirectTo=${encodeURIComponent(pathname)}`)
      return
    }

    if (isUpvoting) return
    setIsUpvoting(true)

    const next = didUpvote ? count - 1 : count + 1
    setCount(next)
    setDidUpvote(!didUpvote)

    try {
      const result = await upvoteProject(projectId)
      if ("error" in result) {
        // rollback on error
        setCount(count)
        setDidUpvote(didUpvote)
      }
    } finally {
      setIsUpvoting(false)
    }
  }

  const onMouseEnter = () => {
    if (!interactive) return
    if (!isAuthenticated) setHoverLabel("Sign in to upvote")
  }

  const onMouseLeave = () => {
    if (!interactive) return
    setHoverLabel(null)
  }

  const onFocus = () => {
    if (!interactive) return
    if (!isAuthenticated) setHoverLabel("Sign in to upvote")
  }

  const onBlur = () => {
    if (!interactive) return
    setHoverLabel(null)
  }

  const label = hoverLabel || (didUpvote ? "Upvoted" : "Upvote")

  if (!interactive) {
    return (
      <Button
        variant={didUpvote ? "default" : "outline"}
        size="sm"
        className="flex flex-col items-center min-w-[60px] h-auto py-2"
        disabled
        aria-label={`Upvotes: ${count}`}
      >
        <svg className="w-4 h-4 mb-1" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z"
            clipRule="evenodd"
          />
        </svg>
        <span className="text-xs">{count}</span>
      </Button>
    )
  }

  return (
    <Button
      variant={didUpvote ? "default" : "outline"}
      size="sm"
      onClick={handleClick}
      disabled={isUpvoting}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onFocus={onFocus}
      onBlur={onBlur}
      className="flex flex-col items-center min-w-[60px] h-auto py-2"
      aria-label={!isAuthenticated ? "Sign in to upvote" : label}
      title={!isAuthenticated ? "Sign in to upvote" : undefined}
    >
      <svg className="w-4 h-4 mb-1" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z"
          clipRule="evenodd"
        />
      </svg>
      <span className="text-xs">{hoverLabel ? "Sign in to upvote" : count}</span>
    </Button>
  )
}


