"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useActionState } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { useFormStatus } from "react-dom"
import { addCommentAction, type AddCommentState } from "@/app/projects/actions"
import { showToast } from "@/components/ui/toast"

interface CommentFormProps {
  projectId: string
}

export function CommentForm({ projectId }: CommentFormProps) {
  const router = useRouter()
  const [body, setBody] = useState("")
  const [state, formAction] = useActionState<AddCommentState, FormData>(addCommentAction, null)

  const remaining = useMemo(() => 1000 - body.trim().length, [body])

  useEffect(() => {
    if (state?.ok) {
      showToast("Comment added", "success")
      setBody("")
      router.refresh()
    } else if (state?.formError) {
      showToast(state.formError, "error")
    }
  }, [state, router])

  const Submit = () => {
    const { pending } = useFormStatus()
    return (
      <Button type="submit" disabled={pending || body.trim().length === 0 || body.trim().length > 1000}>
        {pending ? "Posting..." : "Post Comment"}
      </Button>
    )
  }

  return (
    <form action={formAction} className="space-y-3 text-left">
      <input type="hidden" name="projectId" value={projectId} />
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
