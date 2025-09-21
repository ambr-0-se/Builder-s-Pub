"use client"

import type React from "react"

 import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ProjectGrid } from "@/components/features/projects/project-grid"
import { FilterBar } from "@/components/features/projects/filter-bar"
import { EmptyState } from "@/components/ui/empty-state"
import { listProjects as listRealProjects } from "@/lib/api/projects"
import { listCollabs as listRealCollabs } from "@/lib/api/collabs"
import type { ProjectWithRelations } from "@/lib/types"
import { useAnalytics } from "@/lib/analytics"
import { useTags } from "@/hooks/useTags"
import { STAGE_OPTIONS, PROJECT_TYPE_OPTIONS } from "@/lib/collabs/options"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { LogoImage } from "@/components/ui/logo-image"
import { formatProjectType } from "@/lib/collabs/options"

export default function SearchPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { track } = useAnalytics()
  const { technology, category } = useTags()

  const [query, setQuery] = useState(searchParams.get("q") || "")
  const [tab, setTab] = useState<"projects" | "collabs">((searchParams.get("type") as any) || "projects")
  const [projects, setProjects] = useState<ProjectWithRelations[]>([])
  const [collabs, setCollabs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedTechTags, setSelectedTechTags] = useState<number[]>([])
  const [selectedCategoryTags, setSelectedCategoryTags] = useState<number[]>([])
  const [selectedStages, setSelectedStages] = useState<string[]>([])
  const [selectedProjectTypes, setSelectedProjectTypes] = useState<string[]>([])
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined)
  const [hasSearched, setHasSearched] = useState(false)
  const lastFiltersSig = useRef<string | null>(null)

  // Initialize filters from URL params
  useEffect(() => {
    // Wait until tags load to translate/validate IDs
    const techReady = technology.length > 0
    const categoryReady = category.length > 0
    if (!techReady && !categoryReady) return

    const techParam = searchParams.get("tech")
    const categoryParam = searchParams.get("category")
    const stagesParam = searchParams.get("stages")
    const projectTypesParam = searchParams.get("projectTypes")

    if (techParam) {
      const ids = techParam.split(",").map((v) => Number(v)).filter((v) => Number.isFinite(v))
      // keep only valid IDs present in DB tags
      const valid = technology.map((t) => t.id)
      setSelectedTechTags(ids.filter((id) => valid.includes(id)))
    }

    if (categoryParam) {
      const ids = categoryParam.split(",").map((v) => Number(v)).filter((v) => Number.isFinite(v))
      const valid = category.map((t) => t.id)
      setSelectedCategoryTags(ids.filter((id) => valid.includes(id)))
    }

    if (stagesParam) {
      const values = stagesParam.split(",").map((v) => v.trim()).filter(Boolean)
      setSelectedStages(values)
    }

    if (projectTypesParam) {
      const values = projectTypesParam.split(",").map((v) => v.trim()).filter(Boolean)
      setSelectedProjectTypes(values)
    }

    // Auto-search if any param is present
    if (searchParams.get("q") || techParam || categoryParam || stagesParam || projectTypesParam) {
      performSearch()
    }
  }, [searchParams, technology, category])

  const performSearch = async () => {
    setLoading(true)
    setHasSearched(true)

    try {
      if (tab === "projects") {
        const { items, nextCursor } = await listRealProjects({
          q: query.trim() || undefined,
          techTagIds: selectedTechTags.length > 0 ? selectedTechTags : undefined,
          categoryTagIds: selectedCategoryTags.length > 0 ? selectedCategoryTags : undefined,
          limit: 20,
        })
        setProjects(items)
        setNextCursor(nextCursor)
        track("search_performed", {
          type: "projects",
          query: query.trim(),
          techTagIds: selectedTechTags,
          categoryTagIds: selectedCategoryTags,
          resultCount: items.length,
        })
      } else {
        const { items, nextCursor } = await listRealCollabs({
          q: query.trim() || undefined,
          techTagIds: selectedTechTags.length > 0 ? selectedTechTags : undefined,
          categoryTagIds: selectedCategoryTags.length > 0 ? selectedCategoryTags : undefined,
          stages: selectedStages.length > 0 ? selectedStages : undefined,
          projectTypes: selectedProjectTypes.length > 0 ? selectedProjectTypes : undefined,
          limit: 20,
        })
        setCollabs(items)
        setNextCursor(nextCursor)
        track("search_performed", {
          type: "collabs",
          query: query.trim(),
          techTagIds: selectedTechTags,
          categoryTagIds: selectedCategoryTags,
          stages: selectedStages,
          projectTypes: selectedProjectTypes,
          resultCount: items.length,
        })
      }
    } catch (error) {
      console.error("Search failed:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Sync to URL
    const sp = new URLSearchParams()
    sp.set("type", tab)
    if (query.trim()) sp.set("q", query.trim())
    if (selectedTechTags.length) sp.append("tech", selectedTechTags.join(","))
    if (selectedCategoryTags.length) sp.append("category", selectedCategoryTags.join(","))
    if (tab === "collabs") {
      if (selectedStages.length) sp.append("stages", selectedStages.join(","))
      if (selectedProjectTypes.length) sp.append("projectTypes", selectedProjectTypes.join(","))
    }
    router.replace(`/search?${sp.toString()}`)
    performSearch()
  }

  const handleClearFilters = () => {
    setSelectedTechTags([])
    setSelectedCategoryTags([])
    setSelectedStages([])
    setSelectedProjectTypes([])
  }

  // Re-search when filters change
  useEffect(() => {
    if (hasSearched) {
      // Unified filter_apply emission with signature guard
      const sig = JSON.stringify({ tab, selectedTechTags, selectedCategoryTags, selectedStages, selectedProjectTypes })
      if (lastFiltersSig.current !== sig) {
        track("filter_apply", {
          type: tab,
          techTagIds: selectedTechTags,
          categoryTagIds: selectedCategoryTags,
          stages: tab === "collabs" ? selectedStages : undefined,
          projectTypes: tab === "collabs" ? selectedProjectTypes : undefined,
          triggeredBy: "filters",
        })
        lastFiltersSig.current = sig
      }
      performSearch()
    }
  }, [selectedTechTags, selectedCategoryTags, selectedStages, selectedProjectTypes, tab])

  const loadMore = async () => {
    if (!nextCursor) return
    setLoading(true)
    try {
      if (tab === "projects") {
        const { items, nextCursor: nc } = await listRealProjects({
          q: query.trim() || undefined,
          techTagIds: selectedTechTags.length > 0 ? selectedTechTags : undefined,
          categoryTagIds: selectedCategoryTags.length > 0 ? selectedCategoryTags : undefined,
          cursor: nextCursor,
          limit: 20,
        })
        setProjects((prev) => [...prev, ...items])
        setNextCursor(nc)
      } else {
        const { items, nextCursor: nc } = await listRealCollabs({
          q: query.trim() || undefined,
          techTagIds: selectedTechTags.length > 0 ? selectedTechTags : undefined,
          categoryTagIds: selectedCategoryTags.length > 0 ? selectedCategoryTags : undefined,
          stages: selectedStages.length > 0 ? selectedStages : undefined,
          projectTypes: selectedProjectTypes.length > 0 ? selectedProjectTypes : undefined,
          cursor: nextCursor,
          limit: 20,
        })
        setCollabs((prev) => [...prev, ...items])
        setNextCursor(nc)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Search</h1>

        <form onSubmit={handleSearch} className="flex gap-4 max-w-2xl">
          <Input
            type="search"
            placeholder={tab === "projects" ? "Search projects..." : "Search collaborations..."}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" disabled={loading}>
            {loading ? "Searching..." : "Search"}
          </Button>
        </form>
        <div className="mt-4 flex gap-2">
          <Button variant={tab === "projects" ? "default" : "outline"} onClick={() => { setTab("projects"); setHasSearched(false); setNextCursor(undefined); }}>Projects</Button>
          <Button variant={tab === "collabs" ? "default" : "outline"} onClick={() => { setTab("collabs"); setHasSearched(false); setNextCursor(undefined); }}>Collaborations</Button>
        </div>
      </div>

      <FilterBar
        selectedTechTags={selectedTechTags}
        selectedCategoryTags={selectedCategoryTags}
        onTechTagsChange={setSelectedTechTags}
        onCategoryTagsChange={setSelectedCategoryTags}
        selectedStages={tab === "collabs" ? selectedStages : []}
        onStagesChange={tab === "collabs" ? setSelectedStages : undefined}
        selectedProjectTypes={tab === "collabs" ? selectedProjectTypes : []}
        onProjectTypesChange={tab === "collabs" ? setSelectedProjectTypes : undefined}
        onClear={handleClearFilters}
      />

      {/* Stages/ProjectTypes now part of FilterBar as chips */}

      {hasSearched && (
        <div className="mb-6">
          <p className="text-sm text-gray-600">{loading ? "Searching..." : `${tab === "projects" ? projects.length : collabs.length} ${tab === "projects" ? "projects" : "collaborations"} found`}{query.trim() && ` for "${query}"`}</p>
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
        tab === "projects" ? <ProjectGrid projects={[]} loading={true} /> : <div className="py-12 text-center text-gray-500">Loading...</div>
      ) : (tab === "projects" ? projects.length === 0 : collabs.length === 0) ? (
        <EmptyState
          title={tab === "projects" ? "No projects found" : "No collaborations found"}
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
        <>
          {tab === "projects" ? (
            <ProjectGrid projects={projects} />
          ) : (
            <div className="space-y-6">
              {collabs.map((item) => (
                <div key={item.collaboration.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 flex items-start gap-3">
                      <LogoImage src={(item.collaboration as any).logoUrl || ""} alt={item.collaboration.title} size={40} />
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-sm text-gray-500">by {item.owner.displayName}</span>
                        </div>
                        <Link href={`/collaborations/${item.collaboration.id}`} className="group">
                          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 mb-2">{item.collaboration.title}</h3>
                        </Link>
                        <p className="text-gray-600 mb-3 line-clamp-2">{item.collaboration.description}</p>
                        <div className="flex items-center text-sm text-gray-500 space-x-4">
                          <span>📅 {item.collaboration.createdAt.toLocaleDateString?.() || new Date(item.collaboration.createdAt as any).toLocaleDateString()}</span>
                          {typeof item.commentCount === "number" && <span>💬 {item.commentCount}</span>}
                          <span>⬆️ {item.upvoteCount}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 items-center">
                    {Array.isArray((item.collaboration as any).projectTypes) && (
                      <>
                        {(item.collaboration as any).projectTypes.map((pt: string, i: number) => (
                          <Badge key={`pt-${i}`} variant="outline" className="capitalize">{formatProjectType(pt as any)}</Badge>
                        ))}
                      </>
                    )}
                    <Badge variant={(item.collaboration as any).isHiring === false ? "outline" : undefined} className={(item.collaboration as any).isHiring === false ? "bg-white text-gray-800 border border-gray-300" : "bg-black text-white border border-black"}>
                      {(item.collaboration as any).isHiring === false ? "No longer hiring" : "Hiring"}
                    </Badge>
                  </div>
                  {item.collaboration.lookingFor?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {item.collaboration.lookingFor.slice(0, 3).map((r: any, idx: number) => (
                        <Badge key={idx} variant="secondary">{r.role}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {nextCursor && (
            <div className="mt-6 flex justify-center">
              <Button variant="outline" onClick={loadMore} disabled={loading}>{loading ? "Loading..." : "Load more"}</Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
