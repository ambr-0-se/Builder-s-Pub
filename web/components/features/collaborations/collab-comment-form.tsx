"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useActionState } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { useFormStatus } from "react-dom"
import { addCollabCommentAction, type AddCollabCommentState } from "@/app/collaborations/actions"
import { showToast } from "@/components/ui/toast"

interface CollabCommentFormProps {
  collaborationId: string
  parentCommentId?: string
  onSuccess?: (body: string) => void
}

export function CollabCommentForm({ collaborationId, parentCommentId, onSuccess }: CollabCommentFormProps) {
  const router = useRouter()
  const [body, setBody] = useState("")
  const [state, formAction] = useActionState<AddCollabCommentState, FormData>(addCollabCommentAction, null)
  const lastSubmittedBodyRef = useRef("")
  const processedRef = useRef<AddCollabCommentState>(null)

  const remaining = useMemo(() => 1000 - body.trim().length, [body])

  useEffect(() => {
    if (!state || processedRef.current === state) return
    if (state.ok) {
      showToast("Comment added", "success")
      setBody("")
      onSuccess?.(lastSubmittedBodyRef.current)
      router.refresh()
    } else if (state.formError) {
      const suffix = state.retryAfterSec ? ` Try again in ~${state.retryAfterSec}s.` : ""
      showToast(state.formError + suffix, "error")
    }
    processedRef.current = state
  }, [state])

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
        fd.set("collaborationId", collaborationId)
        if (parentCommentId) fd.set("parentCommentId", parentCommentId)
        const content = String(fd.get("body") || body)
        lastSubmittedBodyRef.current = content
        await formAction(fd)
      }}
      className="space-y-3 text-left"
    >
      <input type="hidden" name="collaborationId" value={collaborationId} />
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


