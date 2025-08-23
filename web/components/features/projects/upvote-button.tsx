"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { showToast } from "@/components/ui/toast"
import { useAuth } from "@/lib/api/auth"
import { useActionState } from "react"
// no react-dom form status here; using useTransition instead
import { toggleProjectUpvoteAction, toggleCommentUpvoteAction, type ToggleUpvoteState } from "@/app/projects/actions"

type UpvoteTarget = "project" | "comment"

interface UpvoteButtonProps {
  target: UpvoteTarget
  targetId: string
  initialCount: number
  hasUserUpvoted?: boolean
  interactive?: boolean
}

export function UpvoteButton({ target, targetId, initialCount, hasUserUpvoted, interactive = true }: UpvoteButtonProps) {
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const pathname = usePathname() || "/"

  const actionFn = target === "project" ? toggleProjectUpvoteAction : toggleCommentUpvoteAction
  const [state, formAction] = useActionState<ToggleUpvoteState, FormData>(actionFn, null)
  const [isPending, startTransition] = useTransition()
  const [count, setCount] = useState(initialCount)
  const [didUpvote, setDidUpvote] = useState(!!hasUserUpvoted)
  const [hoverLabel, setHoverLabel] = useState<string | null>(null)
  const [lastError, setLastError] = useState<string | null>(null)

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!interactive) return

    if (!isAuthenticated) {
      router.push(`/auth/sign-in?redirectTo=${encodeURIComponent(pathname)}`)
      return
    }

    if (isPending) return

    const next = didUpvote ? count - 1 : count + 1
    setCount(next)
    setDidUpvote(!didUpvote)

    const fd = new FormData()
    if (target === "project") fd.set("projectId", targetId)
    else fd.set("commentId", targetId)
    startTransition(() => {
      formAction(fd)
    })
  }

  useEffect(() => {
    if (state?.formError) {
      // rollback optimistic change
      setDidUpvote(hasUserUpvoted || false)
      setCount(initialCount)
      const suffix = state.retryAfterSec ? ` Try again in ~${state.retryAfterSec}s.` : ""
      setLastError(state.formError + suffix)
      showToast(state.formError + suffix, "error")
    } else if (state?.ok && typeof state.upvoted !== "undefined") {
      // success — sync local in case server flipped
      setDidUpvote(state.upvoted)
      setCount((c) => (state.upvoted ? Math.max(c, initialCount + 1) : Math.min(c, initialCount)))
      setLastError(null)
    }
  }, [state, hasUserUpvoted, initialCount])

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
      disabled={isPending}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onFocus={onFocus}
      onBlur={onBlur}
      className="flex flex-col items-center min-w-[60px] h-auto py-2"
      aria-label={!isAuthenticated ? "Sign in to upvote" : label}
      title={!isAuthenticated ? "Sign in to upvote" : undefined}
      title={lastError || (!isAuthenticated ? "Sign in to upvote" : undefined)}
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


