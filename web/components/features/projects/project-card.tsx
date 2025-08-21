"use client"

import type React from "react"

import Link from "next/link"
import type { ProjectWithRelations } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAnalyticsMock } from "@/lib/analytics"

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

        <Button variant={"outline"} size="sm" disabled className="flex flex-col items-center min-w-[60px] h-auto py-2 shrink-0">
          <svg className="w-4 h-4 mb-1" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-xs">{project.upvoteCount}</span>
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
