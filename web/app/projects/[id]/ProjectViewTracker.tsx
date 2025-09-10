"use client"

import { useEffect } from "react"
import { useAnalytics } from "@/lib/analytics"

export function ProjectViewTracker(props: { projectId: string; techTags: string[]; categoryTags: string[] }) {
  const { projectId, techTags, categoryTags } = props
  const { track } = useAnalytics()

  useEffect(() => {
    const t = setTimeout(() => {
      track("project_view", { projectId, techTags, categoryTags })
    }, 1000)
    return () => clearTimeout(t)
  }, [projectId, techTags, categoryTags, track])

  return null
}


