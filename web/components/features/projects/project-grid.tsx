import type { ProjectWithRelations } from "@/lib/types"
import { ProjectCard } from "./project-card"
import { Skeleton } from "@/components/ui/skeleton"

interface ProjectGridProps {
  projects: ProjectWithRelations[]
  loading?: boolean
  onProjectUpdate?: () => void
}

export function ProjectGrid({ projects, loading, onProjectUpdate }: ProjectGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-full mb-3" />
            <Skeleton className="h-4 w-1/2 mb-4" />
            <div className="flex gap-2 mb-4">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-20" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <ProjectCard key={project.project.id} project={project} onUpvoteChange={onProjectUpdate} />
      ))}
    </div>
  )
}
