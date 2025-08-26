"use client"

import { useEffect, useMemo, useOptimistic, useState } from "react"
import type { Comment } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { deleteCollabCommentAction, type DeleteCollabCommentState } from "@/app/collaborations/actions"
import { useActionState } from "react"
import { showToast } from "@/components/ui/toast"
import { useAuth } from "@/lib/api/auth"
import { useRouter } from "next/navigation"
import { CollabCommentForm } from "./collab-comment-form"

interface CollabCommentListProps {
  comments: Comment[]
  collaborationId: string
}

export function CollabCommentList({ comments, collaborationId }: CollabCommentListProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [state, formAction] = useActionState<DeleteCollabCommentState, FormData>(deleteCollabCommentAction, null)
  const [items, setItems] = useState<Comment[]>(comments || [])
  const [optimisticItems, setOptimisticItems] = useOptimistic<Comment[], { type: "delete"; id: string }>(
    items,
    (current, action) => {
      if (action.type === "delete") return current.filter((x) => x.id !== action.id)
      return current
    }
  )

  useEffect(() => {
    setItems(comments || [])
  }, [comments])

  useEffect(() => {
    if (state?.formError) {
      showToast(state.formError, "error")
    } else if (state?.ok) {
      showToast("Comment deleted", "success")
      router.refresh()
    }
  }, [state, router])

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
            {user?.userId === c.authorId && (
              <form
                action={(fd: FormData) => {
                  const id = String(fd.get("commentId") || "")
                  setOptimisticItems({ type: "delete", id })
                  setItems((prev) => prev.filter((x) => x.id !== id))
                  formAction(fd)
                }}
              >
                <input type="hidden" name="commentId" value={c.id} />
                <Button type="submit" variant="outline" size="sm">Delete</Button>
              </form>
            )}
          </div>
          <div className="text-gray-800 whitespace-pre-wrap">{c.body}</div>

          {/* Replies */}
          {c.children && c.children.length > 0 && (
            <ul className="mt-3 space-y-3 pl-4 border-l border-gray-200">
              {c.children.map((r) => (
                <li key={r.id} className="rounded-md p-3 bg-gray-50">
                  <div className="text-xs text-gray-600 mb-1">
                    <span className="font-medium text-gray-900">{r.author.displayName}</span>
                    <span className="mx-2">•</span>
                    <Timestamp value={r.createdAt as unknown as Date | string} />
                  </div>
                  <div className="text-gray-800 whitespace-pre-wrap text-sm">{r.body}</div>
                </li>
              ))}
            </ul>
          )}

          {/* Inline reply form */}
          <div className="mt-3 pl-4">
            <CollabCommentForm
              collaborationId={collaborationId}
              parentCommentId={c.id}
              onSuccess={(newBody) => {
                setItems((prev) => prev.map((pc) => {
                  if (pc.id !== c.id) return pc
                  const clone = { ...pc }
                  const reply: Comment = {
                    id: `temp-${Date.now()}`,
                    projectId: "",
                    authorId: user?.userId || "",
                    author: user || { userId: "", displayName: "You" },
                    body: newBody,
                    createdAt: new Date(),
                    parentCommentId: c.id,
                  }
                  clone.children = [...(clone.children || []), reply]
                  return clone
                }))
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}

function Timestamp({ value }: { value: Date | string }) {
  const date: Date = typeof value === "string" ? new Date(value) : value
  const iso = useMemo(() => date.toISOString(), [date])
  const label = useMemo(() => iso.slice(0, 16).replace("T", " ") + " UTC", [iso])
  return <time dateTime={iso}>{label}</time>
}


