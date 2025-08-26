import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { listProjects } from "@/lib/server/projects"
import { UpvoteButton } from "@/components/features/projects/upvote-button"
import { listCollabs } from "@/lib/server/collabs"
import { getAllTagsServer } from "@/lib/server/tags"
import type { Tag } from "@/lib/types"

export const metadata: Metadata = {
  title: "Builder's Pub - Showcase Your AI Projects",
  description: "A global hub to showcase AI/vibe-coded student projects. Discover, collaborate, and get inspired.",
}

export default async function HomePage() {
  // Fetch featured content (robust: safe fallbacks)
  let recentProjects: any[] = []
  let popularProjects: any[] = []
  try {
    const { items } = await listProjects({ limit: 3, sort: "recent" })
    recentProjects = items
  } catch (_) {
    recentProjects = []
  }
  try {
    const { items } = await listProjects({ limit: 3, sort: "popular" })
    popularProjects = items
  } catch (_) {
    popularProjects = []
  }
  let collaborations: Array<{ id: string; title: string; kind: string; rolesCount: number }> = []
  try {
    const { items } = await listCollabs({ limit: 3 })
    collaborations = items.map((it) => ({
      id: it.collaboration.id,
      title: it.collaboration.title,
      kind: it.collaboration.kind,
      rolesCount: (it.collaboration.lookingFor || []).length,
    }))
  } catch (_) {
    collaborations = []
  }
  // Load tags from DB with fallback for errors
  let popularTags: Array<{ id: number; name: string; type: string }> = []
  try {
    const allTags = await getAllTagsServer()
    popularTags = [...allTags.technology.slice(0, 4), ...allTags.category.slice(0, 4)]
  } catch (error) {
    console.error("Failed to load tags for landing page:", error)
    // Fallback to empty array - page will still work without tags
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
          Showcase Your
          <span className="text-blue-600"> AI Projects</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          A global hub for AI/vibe-coded student projects. Discover innovative solutions, find collaborators, and get
          inspired by the next generation of builders.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/projects/new">Post Your Project</Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/collaborations/new">Find Collaborators</Link>
          </Button>
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
        {/* Featured Projects */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Featured Projects</h2>
            <Button variant="outline" size="sm" asChild>
              <Link href="/projects">View All</Link>
            </Button>
          </div>
          <div className="space-y-4">
            {recentProjects.map((project) => (
              <div key={project.project.id} className="border-b border-gray-100 last:border-b-0 pb-4 last:pb-0">
                <Link href={`/projects/${project.project.id}`} className="group">
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 mb-1">
                    {project.project.title}
                  </h3>
                </Link>
                <p className="text-gray-600 text-sm mb-2">{project.project.tagline}</p>
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    {project.tags.technology.slice(0, 2).map((tag: Tag) => (
                      <Badge key={tag.id} variant="default" className="text-xs">
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                  <UpvoteButton
                    target="project"
                    targetId={project.project.id}
                    initialCount={project.upvoteCount}
                    hasUserUpvoted={project.hasUserUpvoted}
                    interactive={false}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trending & Collaborations */}
        <div className="space-y-8">
          {/* Trending Projects */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Trending</h2>
              <Button variant="outline" size="sm" asChild>
                <Link href="/projects?sort=popular">View All</Link>
              </Button>
            </div>
            <div className="space-y-3">
              {popularProjects.map((project) => (
                <div key={project.project.id}>
                  <Link href={`/projects/${project.project.id}`} className="group">
                    <h3 className="font-medium text-gray-900 group-hover:text-blue-600 text-sm mb-1">
                      {project.project.title}
                    </h3>
                  </Link>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">by {project.owner.displayName}</span>
                    <UpvoteButton
                      target="project"
                      targetId={project.project.id}
                      initialCount={project.upvoteCount}
                      hasUserUpvoted={project.hasUserUpvoted}
                      interactive={false}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Collaboration Highlights */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Collaborations</h2>
              <Button variant="outline" size="sm" asChild>
                <Link href="/collaborations">View All</Link>
              </Button>
            </div>
            <div className="space-y-3">
              {collaborations.map((collab) => (
                <div key={collab.id}>
                  <Link href={`/collaborations/${collab.id}`} className="group">
                    <h3 className="font-medium text-gray-900 group-hover:text-blue-600 text-sm mb-1">{collab.title}</h3>
                  </Link>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      {collab.kind}
                    </Badge>
                    <span className="text-xs text-gray-500">{collab.rolesCount} roles</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Get Inspired Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Get Inspired</h2>
        <p className="text-gray-600 mb-6">Explore popular technologies and categories</p>
        <div className="flex flex-wrap gap-3 justify-center">
          {popularTags.map((tag) => (
            <Link
              key={tag.id}
              href={`/search?${tag.type === "technology" ? "tech" : "category"}=${tag.name}`}
              className="inline-flex items-center rounded-full px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            >
              {tag.name}
            </Link>
          ))}
        </div>
        <div className="mt-6">
          <Button variant="outline" size="sm" asChild>
            <Link href="/search">More Categories</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
