"use client"

import type React from "react"

import Link from "next/link"
import type { ProjectWithRelations } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { upvoteProject } from "@/lib/api/mockProjects"
import { useAuthMock } from "@/lib/api/mockAuth"
import { useAnalyticsMock } from "@/lib/analytics"
import { useState } from "react"
import { showToast } from "@/components/ui/toast"

interface ProjectCardProps {
  project: ProjectWithRelations
  onUpvoteChange?: () => void
}

export function ProjectCard({ project, onUpvoteChange }: ProjectCardProps) {
  const { isAuthenticated } = useAuthMock()
  const { track } = useAnalyticsMock()
  const [isUpvoting, setIsUpvoting] = useState(false)
  const [localUpvoteCount, setLocalUpvoteCount] = useState(project.upvoteCount)
  const [hasUpvoted, setHasUpvoted] = useState(project.hasUserUpvoted || false)

  const handleUpvote = async (e: React.MouseEvent) => {
    e.preventDefault()

    if (!isAuthenticated) {
      showToast("Please sign in to upvote projects", "error")
      return
    }

    if (isUpvoting) return

    setIsUpvoting(true)

    // Optimistic update
    const newCount = hasUpvoted ? localUpvoteCount - 1 : localUpvoteCount + 1
    setLocalUpvoteCount(newCount)
    setHasUpvoted(!hasUpvoted)

    try {
      const result = await upvoteProject(project.project.id)

      if ("error" in result) {
        // Rollback optimistic update
        setLocalUpvoteCount(localUpvoteCount)
        setHasUpvoted(hasUpvoted)

        if (result.error === "unauthorized") {
          showToast("Please sign in to upvote", "error")
        } else if (result.error === "conflict") {
          showToast("You have already upvoted this project", "error")
        }
      } else {
        track("project_upvoted", { projectId: project.project.id })
        onUpvoteChange?.()
      }
    } catch (error) {
      // Rollback optimistic update
      setLocalUpvoteCount(localUpvoteCount)
      setHasUpvoted(hasUpvoted)
      showToast("Failed to upvote project", "error")
    } finally {
      setIsUpvoting(false)
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <Link href={`/projects/${project.project.id}`} className="group">
            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 mb-2">
              {project.project.title}
            </h3>
          </Link>
          <p className="text-gray-600 text-sm mb-3">{project.project.tagline}</p>

          <div className="flex items-center text-sm text-gray-500 mb-3">
            <span>by {project.owner.displayName}</span>
            <span className="mx-2">•</span>
            <span>{project.project.createdAt.toLocaleDateString()}</span>
          </div>
        </div>

        <Button
          variant={hasUpvoted ? "default" : "outline"}
          size="sm"
          onClick={handleUpvote}
          disabled={isUpvoting}
          className="flex flex-col items-center min-w-[60px] h-auto py-2"
        >
          <svg className="w-4 h-4 mb-1" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-xs">{localUpvoteCount}</span>
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {project.tags.technology.map((tag) => (
          <Badge key={tag.id} variant="default">
            {tag.name}
          </Badge>
        ))}
        {project.tags.category.map((tag) => (
          <Badge key={tag.id} variant="secondary">
            {tag.name}
          </Badge>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex space-x-3">
          <a
            href={project.project.demoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            View Demo
          </a>
          {project.project.sourceUrl && (
            <a
              href={project.project.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-gray-800 text-sm font-medium"
            >
              Source Code
            </a>
          )}
        </div>

        <span className="text-sm text-gray-500">{project.comments.length} comments</span>
      </div>
    </div>
  )
}
