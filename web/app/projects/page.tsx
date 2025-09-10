"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { ProjectGrid } from "@/components/features/projects/project-grid"
import { FilterBar } from "@/components/features/projects/filter-bar"
import { SortTabs } from "@/components/features/projects/sort-tabs"
import { listProjects } from "@/lib/api/projects"
import type { ProjectWithRelations } from "@/lib/types"
import { useAnalytics } from "@/lib/analytics"

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState<"recent" | "popular">("recent")
  const [selectedTechTags, setSelectedTechTags] = useState<number[]>([])
  const [selectedCategoryTags, setSelectedCategoryTags] = useState<number[]>([])
  const { track } = useAnalytics()

  const loadProjects = async () => {
    setLoading(true)
    try {
      const { items } = await listProjects({
        sort,
        techTagIds: selectedTechTags.length > 0 ? selectedTechTags : undefined,
        categoryTagIds: selectedCategoryTags.length > 0 ? selectedCategoryTags : undefined,
      })
      setProjects(items)

      if (selectedTechTags.length > 0 || selectedCategoryTags.length > 0) {
        track("filters_applied", {
          techTags: selectedTechTags,
          categoryTags: selectedCategoryTags,
        })
      }
    } catch (error) {
      console.error("Failed to load projects:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProjects()
  }, [sort, selectedTechTags, selectedCategoryTags])

  const handleClearFilters = () => {
    setSelectedTechTags([])
    setSelectedCategoryTags([])
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600 mt-2">Discover amazing AI and student projects</p>
        </div>
        <Button asChild>
          <Link href="/projects/new">Post Project</Link>
        </Button>
      </div>

      <FilterBar
        selectedTechTags={selectedTechTags}
        selectedCategoryTags={selectedCategoryTags}
        onTechTagsChange={setSelectedTechTags}
        onCategoryTagsChange={setSelectedCategoryTags}
        onClear={handleClearFilters}
      />

      <div className="flex items-center justify-between mb-6">
        <SortTabs activeSort={sort} onSortChange={setSort} />
        <p className="text-sm text-gray-600">{loading ? "Loading..." : `${projects.length} projects found`}</p>
      </div>

      {!loading && projects.length === 0 ? (
        <EmptyState
          title="No projects found"
          description="Be the first to share your amazing project with the community!"
          action={
            <Button asChild>
              <Link href="/projects/new">Post Your First Project</Link>
            </Button>
          }
          icon={
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          }
        />
      ) : (
        <ProjectGrid projects={projects} loading={loading} onProjectUpdate={loadProjects} />
      )}
    </div>
  )
}
