"use client"

import { useEffect, useMemo, useState } from "react"
import type { Comment } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { deleteCommentAction, type DeleteCommentState } from "@/app/projects/actions"
import { useActionState } from "react"
import { showToast } from "@/components/ui/toast"
import { useAuth } from "@/lib/api/auth"
import { useRouter } from "next/navigation"

interface CommentListProps {
  comments: Comment[]
}

export function CommentList({ comments }: CommentListProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [state, formAction] = useActionState<DeleteCommentState, FormData>(deleteCommentAction, null)
  const [items, setItems] = useState<Comment[]>(comments || [])

  useEffect(() => {
    setItems(comments || [])
  }, [comments])

  if (!items || items.length === 0) {
    return <p className="text-gray-500">No comments yet. Be the first to share your thoughts.</p>
  }

  return (
    <ul className="space-y-4">
      {items.map((c) => (
        <li key={c.id} className="border border-gray-200 rounded-md p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">
              <span className="font-medium text-gray-900">{c.author.displayName}</span>
              <span className="mx-2">•</span>
              <Timestamp value={c.createdAt as unknown as Date | string} />
            </div>
            {user?.userId === c.authorId && (
              <form
                action={async (fd: FormData) => {
                  const res = await formAction(fd)
                  if (res?.ok) {
                    showToast("Comment deleted", "success")
                    const id = String(fd.get("commentId") || "")
                    setItems((prev) => prev.filter((x) => x.id !== id))
                    router.refresh()
                  } else if (res?.formError) {
                    showToast(res.formError, "error")
                  }
                }}
              >
                <input type="hidden" name="commentId" value={c.id} />
                <Button type="submit" variant="outline" size="sm">
                  Delete
                </Button>
              </form>
            )}
          </div>
          <div className="text-gray-800 whitespace-pre-wrap">{c.body}</div>
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


