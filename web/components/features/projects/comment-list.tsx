"use client"

import { useEffect, useMemo, useOptimistic, useState } from "react"
import type { Comment } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { deleteCommentAction, type DeleteCommentState } from "@/app/projects/actions"
import { useActionState } from "react"
import { showToast } from "@/components/ui/toast"
import { useAuth } from "@/lib/api/auth"
import { useRouter } from "next/navigation"
import { UpvoteButton } from "@/components/features/projects/upvote-button"
import { CommentForm } from "@/components/features/projects/comment-form"

interface CommentListProps {
  comments: Comment[]
  projectId?: string
}

export function CommentList({ comments, projectId }: CommentListProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [state, formAction] = useActionState<DeleteCommentState, FormData>(deleteCommentAction, null)
  const [items, setItems] = useState<Comment[]>(comments || [])
  const [optimisticItems, setOptimisticItems] = useOptimistic<Comment[], { type: "delete"; id: string }>(
    items,
    (current, action) => {
      if (action.type === "delete") return current.filter((x) => x.id !== action.id)
      return current
    }
  )
  const [lastDeletedId, setLastDeletedId] = useState<string | null>(null)

  useEffect(() => {
    setItems(comments || [])
  }, [comments])

  if (!optimisticItems || optimisticItems.length === 0) {
    return <p className="text-gray-500">No comments yet. Be the first to share your thoughts.</p>
  }

  return (
    <ul className="space-y-4">
      {optimisticItems.map((c) => (
        <li key={c.id} className="border border-gray-200 rounded-md p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">
              <span className="font-medium text-gray-900">{c.author.displayName}</span>
              <span className="mx-2">•</span>
              <Timestamp value={c.createdAt as unknown as Date | string} />
            </div>
            <div className="flex items-center gap-2">
              <UpvoteButton target="comment" targetId={c.id} initialCount={c.upvoteCount || 0} hasUserUpvoted={c.hasUserUpvoted} />
              {user?.userId === c.authorId && (
                <form
                  action={(fd: FormData) => {
                    const id = String(fd.get("commentId") || "")
                    setLastDeletedId(id)
                    // Optimistic update first
                    setOptimisticItems({ type: "delete", id })
                    setItems((prev) => prev.filter((x) => x.id !== id))
                    // Trigger server action (state will update via hook)
                    formAction(fd)
                  }}
                >
                  <input type="hidden" name="commentId" value={c.id} />
                  <Button type="submit" variant="outline" size="sm">
                    Delete
                  </Button>
                </form>
              )}
            </div>
          </div>
          <div className="text-gray-800 whitespace-pre-wrap">{c.body}</div>
          {/* Replies */}
          {c.children && c.children.length > 0 && (
            <ul className="mt-3 space-y-3 pl-4 border-l border-gray-200">
              {c.children.map((r) => (
                <li key={r.id} className="rounded-md p-3 bg-gray-50">
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-xs text-gray-600">
                      <span className="font-medium text-gray-900">{r.author.displayName}</span>
                      <span className="mx-2">•</span>
                      <Timestamp value={r.createdAt as unknown as Date | string} />
                    </div>
                    <UpvoteButton target="comment" targetId={r.id} initialCount={r.upvoteCount || 0} hasUserUpvoted={r.hasUserUpvoted} />
                  </div>
                  <div className="text-gray-800 whitespace-pre-wrap text-sm">{r.body}</div>
                </li>
              ))}
            </ul>
          )}

          {/* Reply form */}
          {!!projectId && (
            <div className="mt-3 pl-4">
              <CommentForm
                projectId={projectId}
                parentCommentId={c.id}
                onSuccess={(newBody) => {
                  // Optimistically add reply to local state without waiting for server refresh
                  setItems((prev) => {
                    const next = prev.map((pc) => {
                      if (pc.id !== c.id) return pc
                      const clone = { ...pc }
                      const reply: Comment = {
                        id: `temp-${Date.now()}`,
                        projectId,
                        authorId: user?.userId || "",
                        author: user || { userId: "", displayName: "You" },
                        body: newBody || "",
                        createdAt: new Date(),
                        parentCommentId: c.id,
                      } as any
                      clone.children = [...(clone.children || []), reply]
                      return clone
                    })
                    return next
                  })
                }}
              />
            </div>
          )}
        </li>
      ))}
    </ul>
  )
}

function Timestamp({ value }: { value: Date | string }) {
  // Avoid hydration mismatch by using a stable, locale-agnostic representation
  const date: Date = typeof value === "string" ? new Date(value) : value
  const iso = useMemo(() => date.toISOString(), [date])
  const label = useMemo(() => iso.slice(0, 16).replace("T", " ") + " UTC", [iso])
  return <time dateTime={iso}>{label}</time>
}


