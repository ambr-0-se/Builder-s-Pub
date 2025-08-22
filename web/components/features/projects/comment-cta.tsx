"use client"

import { useMemo } from "react"
import { useAuth } from "@/lib/api/auth"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { CommentForm } from "@/components/features/projects/comment-form"

interface CommentCtaProps {
  projectId: string
}

export function CommentCta({ projectId }: CommentCtaProps) {
  const { isAuthenticated } = useAuth()
  const router = useRouter()

  const redirectTo = useMemo(() => `/projects/${projectId}`, [projectId])

  if (!isAuthenticated) {
    return (
      <div className="text-center py-6 border border-dashed border-gray-200 rounded-lg">
        <p className="text-gray-600 mb-4">Please sign in to add a comment.</p>
        <Button onClick={() => router.push(`/auth/sign-in?redirectTo=${encodeURIComponent(redirectTo)}`)}>
          Sign in to comment
        </Button>
      </div>
    )
  }

  return (
    <div className="py-6 border border-dashed border-gray-200 rounded-lg">
      <CommentForm projectId={projectId} />
    </div>
  )
}


