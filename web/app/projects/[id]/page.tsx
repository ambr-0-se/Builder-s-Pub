import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getProject } from "@/lib/api/mockProjects"
import { CommentCta } from "@/components/features/projects/comment-cta"
import { UpvoteButton } from "@/components/features/projects/upvote-button"

interface ProjectDetailPageProps {
  params: { id: string }
}

export async function generateMetadata({ params }: ProjectDetailPageProps): Promise<Metadata> {
  const { id } = await params
  const project = await getProject(id)

  if (!project) {
    return {
      title: "Project Not Found - Builder's Pub",
    }
  }

  return {
    title: `${project.project.title} - Builder's Pub`,
    description: project.project.tagline,
    openGraph: {
      title: project.project.title,
      description: project.project.tagline,
      type: "article",
    },
  }
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { id } = await params
  const project = await getProject(id)

  if (!project) {
    notFound()
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-8 border-b border-gray-200">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{project.project.title}</h1>
              <p className="text-xl text-gray-600 mb-4">{project.project.tagline}</p>

              <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                <span>by {project.owner.displayName}</span>
                <span>•</span>
                <span>{project.project.createdAt.toLocaleDateString()}</span>
                <span>•</span>
                <span>{project.upvoteCount} upvotes</span>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
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
            </div>

            <div className="flex flex-col space-y-2">
              <Button asChild>
                <Link href={project.project.demoUrl} target="_blank" rel="noopener noreferrer">
                  View Demo
                </Link>
              </Button>
              {project.project.sourceUrl && (
                <Button variant="outline" asChild>
                  <Link href={project.project.sourceUrl} target="_blank" rel="noopener noreferrer">
                    Source Code
                  </Link>
                </Button>
              )}
              <UpvoteButton
                projectId={project.project.id}
                initialCount={project.upvoteCount}
                hasUserUpvoted={project.hasUserUpvoted}
                interactive
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-8">
          <div className="prose max-w-none">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">About this project</h2>
            <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">{project.project.description}</div>
          </div>

          {/* Comments Section */}
          <div className="mt-12 border-t border-gray-200 pt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Comments</h3>
            <CommentCta projectId={project.project.id} />
          </div>
        </div>
      </div>
    </div>
  )
}
