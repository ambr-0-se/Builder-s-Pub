"use client"

import type React from "react"

import Link from "next/link"
import type { ProjectWithRelations } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAnalyticsMock } from "@/lib/analytics"
import { UpvoteButton } from "@/components/features/projects/upvote-button"

interface ProjectCardProps {
  project: ProjectWithRelations
  onUpvoteChange?: () => void
}

export function ProjectCard({ project }: ProjectCardProps) {
  const { track } = useAnalyticsMock()

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1 min-w-0">
          <Link href={`/projects/${project.project.id}`} className="group">
            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 mb-2">
              {project.project.title}
            </h3>
          </Link>
          <p className="text-gray-600 text-sm mb-3">{project.project.tagline}</p>

          <div className="flex items-center text-sm text-gray-500 mb-3">
            <span className="truncate max-w-[60%] inline-block align-bottom">by {project.owner.displayName}</span>
            <span className="mx-2">•</span>
            <span>{project.project.createdAt.toLocaleDateString()}</span>
          </div>
        </div>

        <UpvoteButton
          target="project"
          targetId={project.project.id}
          initialCount={project.upvoteCount}
          hasUserUpvoted={project.hasUserUpvoted}
          interactive={false}
        />
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
