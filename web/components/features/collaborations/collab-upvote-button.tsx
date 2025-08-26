"use client"

import { useEffect, useMemo, useRef, useState, useTransition } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { showToast } from "@/components/ui/toast"
import { useAuth } from "@/lib/api/auth"
import { useActionState } from "react"
import { toggleCollabUpvoteAction, type ToggleUpvoteState } from "@/app/collaborations/actions"

interface CollabUpvoteButtonProps {
  collaborationId: string
  initialCount: number
  hasUserUpvoted?: boolean
  interactive?: boolean
}

export function CollabUpvoteButton({ collaborationId, initialCount, hasUserUpvoted, interactive = true }: CollabUpvoteButtonProps) {
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const pathname = usePathname() || "/"
  const [state, formAction] = useActionState<ToggleUpvoteState, FormData>(toggleCollabUpvoteAction, null)
  const [isPending, startTransition] = useTransition()
  const [count, setCount] = useState(initialCount)
  const [didUpvote, setDidUpvote] = useState(!!hasUserUpvoted)
  const [lastError, setLastError] = useState<string | null>(null)
  const clickLockRef = useRef(false)

  // Base count is the total without the current user's vote
  const baseCount = useMemo(() => {
    const base = initialCount - (hasUserUpvoted ? 1 : 0)
    return base < 0 ? 0 : base
  }, [initialCount, hasUserUpvoted])

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (!interactive) return
    if (!isAuthenticated) {
      router.push(`/auth/sign-in?redirectTo=${encodeURIComponent(pathname)}`)
      return
    }
    if (isPending || clickLockRef.current) return
    clickLockRef.current = true
    const nextUpvoted = !didUpvote
    // Optimistic count based on baseCount
    setCount(baseCount + (nextUpvoted ? 1 : 0))
    setDidUpvote(nextUpvoted)
    const fd = new FormData()
    fd.set("collaborationId", collaborationId)
    startTransition(() => formAction(fd))
  }

  useEffect(() => {
    if (state?.formError) {
      setDidUpvote(!!hasUserUpvoted)
      setCount(baseCount + (hasUserUpvoted ? 1 : 0))
      const suffix = state.retryAfterSec ? ` Try again in ~${state.retryAfterSec}s.` : ""
      setLastError(state.formError + suffix)
      showToast(state.formError + suffix, "error")
    } else if (state?.ok && typeof state.upvoted !== "undefined") {
      setDidUpvote(state.upvoted)
      setCount(baseCount + (state.upvoted ? 1 : 0))
      setLastError(null)
    }
    if (state) clickLockRef.current = false
  }, [state, hasUserUpvoted, baseCount])

  if (!interactive) {
    return (
      <Button variant={didUpvote ? "default" : "outline"} size="sm" className="flex flex-col items-center min-w-[60px] h-auto py-2" disabled aria-label={`Upvotes: ${count}`}>
        <svg className="w-4 h-4 mb-1" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
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
      className="flex flex-col items-center min-w-[60px] h-auto py-2"
      title={lastError || undefined}
      type="button"
    >
      <svg className="w-4 h-4 mb-1" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
      </svg>
      <span className="text-xs">{count}</span>
    </Button>
  )
}


