"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ProjectGrid } from "@/components/features/projects/project-grid"
import { FilterBar } from "@/components/features/projects/filter-bar"
import { EmptyState } from "@/components/ui/empty-state"
import { listProjects } from "@/lib/api/mockProjects"
import type { ProjectWithRelations } from "@/lib/types"
import { useAnalyticsMock } from "@/lib/analytics"
import { useTags } from "@/hooks/useTags"

export default function SearchPage() {
  const searchParams = useSearchParams()
  const { track } = useAnalyticsMock()
  const { technology, category } = useTags()

  const [query, setQuery] = useState(searchParams.get("q") || "")
  const [projects, setProjects] = useState<ProjectWithRelations[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedTechTags, setSelectedTechTags] = useState<number[]>([])
  const [selectedCategoryTags, setSelectedCategoryTags] = useState<number[]>([])
  const [hasSearched, setHasSearched] = useState(false)

  // Initialize filters from URL params
  useEffect(() => {
    // Wait until tags load to translate names -> IDs
    const techReady = technology.length > 0
    const categoryReady = category.length > 0
    if (!techReady && !categoryReady) return

    const techParam = searchParams.get("tech")
    const categoryParam = searchParams.get("category")

    if (techParam) {
      const techNames = Array.isArray(techParam) ? techParam : [techParam]
      const techIds = technology.filter((tag) => techNames.includes(tag.name)).map((tag) => tag.id)
      setSelectedTechTags(techIds)
    }

    if (categoryParam) {
      const categoryNames = Array.isArray(categoryParam) ? categoryParam : [categoryParam]
      const categoryIds = category.filter((tag) => categoryNames.includes(tag.name)).map((tag) => tag.id)
      setSelectedCategoryTags(categoryIds)
    }

    // Auto-search if there are URL params
    if (searchParams.get("q") || techParam || categoryParam) {
      performSearch()
    }
  }, [searchParams, technology, category])

  const performSearch = async () => {
    setLoading(true)
    setHasSearched(true)

    try {
      // TODO: Implement actual search functionality
      // For now, we'll filter by tags and simulate text search
      const { items } = await listProjects({
        techTagIds: selectedTechTags.length > 0 ? selectedTechTags : undefined,
        categoryTagIds: selectedCategoryTags.length > 0 ? selectedCategoryTags : undefined,
      })

      // Simple text search simulation
      let filtered = items
      if (query.trim()) {
        const searchTerm = query.toLowerCase()
        filtered = items.filter(
          (project) =>
            project.project.title.toLowerCase().includes(searchTerm) ||
            project.project.tagline.toLowerCase().includes(searchTerm) ||
            project.project.description.toLowerCase().includes(searchTerm),
        )
      }

      setProjects(filtered)

      track("search_performed", {
        query: query.trim(),
        techTags: selectedTechTags,
        categoryTags: selectedCategoryTags,
        resultCount: filtered.length,
      })
    } catch (error) {
      console.error("Search failed:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    performSearch()
  }

  const handleClearFilters = () => {
    setSelectedTechTags([])
    setSelectedCategoryTags([])
  }

  // Re-search when filters change
  useEffect(() => {
    if (hasSearched) {
      performSearch()
    }
  }, [selectedTechTags, selectedCategoryTags])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Search Projects</h1>

        <form onSubmit={handleSearch} className="flex gap-4 max-w-2xl">
          <Input
            type="search"
            placeholder="Search projects by title, description, or tags..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" disabled={loading}>
            {loading ? "Searching..." : "Search"}
          </Button>
        </form>
      </div>

      <FilterBar
        selectedTechTags={selectedTechTags}
        selectedCategoryTags={selectedCategoryTags}
        onTechTagsChange={setSelectedTechTags}
        onCategoryTagsChange={setSelectedCategoryTags}
        onClear={handleClearFilters}
      />

      {hasSearched && (
        <div className="mb-6">
          <p className="text-sm text-gray-600">
            {loading ? "Searching..." : `${projects.length} projects found`}
            {query.trim() && ` for "${query}"`}
          </p>
        </div>
      )}

      {!hasSearched ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Search for Projects</h3>
          <p className="text-gray-600">Enter a search term or use the filters to discover amazing projects</p>
        </div>
      ) : loading ? (
        <ProjectGrid projects={[]} loading={true} />
      ) : projects.length === 0 ? (
        <EmptyState
          title="No projects found"
          description="Try adjusting your search terms or filters to find what you're looking for."
          icon={
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          }
        />
      ) : (
        <ProjectGrid projects={projects} />
      )}
    </div>
  )
}
