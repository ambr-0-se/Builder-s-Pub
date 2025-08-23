"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useActionState } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { useFormStatus } from "react-dom"
import { addCommentAction, type AddCommentState } from "@/app/projects/actions"
import { showToast } from "@/components/ui/toast"

interface CommentFormProps {
  projectId: string
  parentCommentId?: string
  onSuccess?: (body: string) => void
}

export function CommentForm({ projectId, parentCommentId, onSuccess }: CommentFormProps) {
  const router = useRouter()
  const [body, setBody] = useState("")
  const [state, formAction] = useActionState<AddCommentState, FormData>(addCommentAction, null)
  const lastSubmittedBodyRef = useRef("")

  const remaining = useMemo(() => 1000 - body.trim().length, [body])

  useEffect(() => {
    if (state?.ok) {
      showToast("Comment added", "success")
      setBody("")
      onSuccess?.(lastSubmittedBodyRef.current)
      // Use soft-refresh to avoid full tree flicker; server will revalidate list at next navigation
      router.refresh()
    } else if (state?.formError) {
      const suffix = state.retryAfterSec ? ` Try again in ~${state.retryAfterSec}s.` : ""
      showToast(state.formError + suffix, "error")
    }
  }, [state, router, onSuccess])

  const Submit = () => {
    const { pending } = useFormStatus()
    return (
      <Button type="submit" disabled={pending || body.trim().length === 0 || body.trim().length > 1000}>
        {pending ? "Posting..." : "Post Comment"}
      </Button>
    )
  }

  return (
    <form
      action={async (fd: FormData) => {
        fd.set("projectId", projectId)
        // Capture body for optimistic callbacks
        const content = String(fd.get("body") || body)
        lastSubmittedBodyRef.current = content
        if (parentCommentId) {
          const reply = (await import("@/app/projects/actions")).addReplyAction
          const res = await reply(null, fd as any)
          if (res && (res as any).ok) {
            onSuccess?.(content)
            setBody("")
            router.refresh()
          }
          return
        }
        await formAction(fd)
      }}
      className="space-y-3 text-left"
    >
      <input type="hidden" name="projectId" value={projectId} />
      {parentCommentId && <input type="hidden" name="parentCommentId" value={parentCommentId} />}
      <div>
        <Textarea
          name="body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Share your thoughts..."
          rows={4}
          maxLength={1000}
          error={state?.fieldErrors?.body}
        />
        <div className="flex items-center justify-between mt-1 text-xs text-gray-500">
          <span>{state?.fieldErrors?.body}</span>
          <span>{remaining} left</span>
        </div>
      </div>
      <div className="flex justify-end">
        <Submit />
      </div>
    </form>
  )
}

export const __PLACEHOLDER__ = null;
