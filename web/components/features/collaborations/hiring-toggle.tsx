"use client"

import { useActionState, useEffect, useRef, useState, startTransition } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { updateCollabAction, type UpdateCollabState } from "@/app/collaborations/actions"
import { showToast } from "@/components/ui/toast"

type Props = { collaborationId: string; isHiring: boolean; isOwner: boolean }

export function HiringToggle({ collaborationId, isHiring, isOwner }: Props) {
  const [state, formAction] = useActionState<UpdateCollabState, FormData>(updateCollabAction, null)
  const [localHiring, setLocalHiring] = useState<boolean>(isHiring)
  const pendingRef = useRef(false)
  const prevHiringRef = useRef<boolean>(isHiring)

  useEffect(() => {
    // Keep local state in sync if parent prop changes (e.g., server refresh)
    setLocalHiring(isHiring)
    prevHiringRef.current = isHiring
  }, [isHiring])

  useEffect(() => {
    if (!pendingRef.current || !state) return
    if (state.ok) {
      // success, lock in the optimistic state
      pendingRef.current = false
      prevHiringRef.current = localHiring
      return
    }
    if (state.formError) {
      // revert optimistic state on error
      setLocalHiring(prevHiringRef.current)
      pendingRef.current = false
      showToast(`Failed to update hiring status: ${state.formError}`, "error")
    }
  }, [state, localHiring])

  const submit = () => {
    if (pendingRef.current) return
    pendingRef.current = true
    const next = !localHiring
    setLocalHiring(next) // optimistic
    const fd = new FormData()
    fd.set("id", collaborationId)
    fd.set("isHiring", String(next))
    startTransition(() => {
      formAction(fd)
    })
  }

  const hiringStyles = "bg-black text-white border border-black"
  const notHiringStyles = "bg-white text-gray-800 border border-gray-300"

  if (!isOwner) {
    // Read-only indicator for non-owners
    return (
      <Badge className={`${localHiring ? hiringStyles : notHiringStyles}`} variant={localHiring ? undefined : "outline"}>
        {localHiring ? "Hiring" : "No longer hiring"}
      </Badge>
    )
  }

  return (
    <Button
      type="button"
      size="sm"
      aria-pressed={localHiring}
      onClick={submit}
      disabled={pendingRef.current}
      className={`${localHiring ? hiringStyles : notHiringStyles}`}
    >
      {localHiring ? "Hiring" : "No longer hiring"}
    </Button>
  )
}


