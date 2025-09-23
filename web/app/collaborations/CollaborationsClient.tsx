"use client"
import React, { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { listCollabs as listCollabsClient } from "@/lib/api/collabs"
import { LogoImage } from "@/components/ui/logo-image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { formatProjectType } from "@/lib/collabs/options"
import { Input } from "@/components/ui/input"
import { FilterBar } from "@/components/features/projects/filter-bar"
import { useAnalytics } from "@/lib/analytics"

export default function CollaborationsClient() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const mode: "project" | "role" = (searchParams.get("mode") as any) === "role" ? "role" : "project"
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [q, setQ] = useState<string>("")
  const [hasSearched, setHasSearched] = useState<boolean>(false)
  const [selectedTechTags, setSelectedTechTags] = useState<number[]>([])
  const [selectedCategoryTags, setSelectedCategoryTags] = useState<number[]>([])
  const [selectedStages, setSelectedStages] = useState<string[]>([])
  const [selectedProjectTypes, setSelectedProjectTypes] = useState<string[]>([])
  const lastFiltersSig = useRef<string | null>(null)
  const { track } = useAnalytics()

  // Role suggestions state (Step 13)
  const [roleOptions, setRoleOptions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false)
  const [activeIndex, setActiveIndex] = useState<number>(-1)
  const filteredRoles = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return roleOptions
    return roleOptions.filter((r) => r.toLowerCase().includes(needle))
  }, [q, roleOptions])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const { items } = await listCollabsClient({ limit: 20 })
        if (mounted) setItems(items)
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  async function performSearch() {
    setLoading(true)
    setHasSearched(true)
    const isRoleMode = mode === "role"
    const { items } = await listCollabsClient({
      q: !isRoleMode ? (q.trim() || undefined) : undefined,
      role: isRoleMode ? (q.trim() || undefined) : undefined,
      techTagIds: selectedTechTags.length ? selectedTechTags : undefined,
      categoryTagIds: selectedCategoryTags.length ? selectedCategoryTags : undefined,
      stages: selectedStages.length ? selectedStages : undefined,
      projectTypes: selectedProjectTypes.length ? selectedProjectTypes : undefined,
      limit: 20,
      mode: isRoleMode ? "role" : "project",
    })
    setItems(items)
    setLoading(false)

    // Analytics: search_performed (project mode)
    try {
      track("search_performed", {
        type: "collabs",
        search_mode: mode,
        query: q.trim(),
        role: mode === "role" ? q.trim() : undefined,
        techTagIds: selectedTechTags,
        categoryTagIds: selectedCategoryTags,
        stages: selectedStages,
        projectTypes: selectedProjectTypes,
        resultCount: items.length,
      })
    } catch {}
  }

  // Analytics: filter_apply when filters change after an initial search
  useEffect(() => {
    if (!hasSearched) return
    const signature = JSON.stringify({
      techTagIds: selectedTechTags,
      categoryTagIds: selectedCategoryTags,
      stages: selectedStages,
      projectTypes: selectedProjectTypes,
    })
    if (lastFiltersSig.current === signature) return
    lastFiltersSig.current = signature
    try {
      track("filter_apply", {
        type: "collabs",
        search_mode: mode,
        techTagIds: selectedTechTags,
        categoryTagIds: selectedCategoryTags,
        stages: selectedStages,
        projectTypes: selectedProjectTypes,
        triggeredBy: "filters",
      })
    } catch {}
    // Optionally re-run search on filter change
    performSearch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTechTags, selectedCategoryTags, selectedStages, selectedProjectTypes, mode])

  async function maybeLoadRoles() {
    if (mode !== "role") return
    if (roleOptions.length > 0) return
    try {
      const res = await fetch("/api/roles/list")
      const json = await res.json()
      setRoleOptions(Array.isArray(json.roles) ? json.roles : [])
    } catch {
      setRoleOptions([])
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (mode !== "role" || filteredRoles.length === 0) return
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIndex((i) => (i + 1) % filteredRoles.length)
      setShowSuggestions(true)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIndex((i) => (i - 1 + filteredRoles.length) % filteredRoles.length)
      setShowSuggestions(true)
    } else if (e.key === "Enter") {
      if (activeIndex >= 0 && activeIndex < filteredRoles.length) {
        e.preventDefault()
        const chosen = filteredRoles[activeIndex]
        setQ(chosen)
        setShowSuggestions(false)
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Collaborations</h1>
          <p className="text-gray-600 mt-2">Find collaborators and join exciting projects</p>
        </div>
        <Button asChild>
          <Link href="/collaborations/new">Post Collaboration</Link>
        </Button>
      </div>

      <div className="mb-6">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            performSearch()
          }}
          className="flex gap-3 items-center"
        >
          <Input
            type="search"
            placeholder={mode === "role" ? "Search roles..." : "Search collaborations..."}
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              if (mode === "role") {
                setShowSuggestions(true)
                setActiveIndex(-1)
                void maybeLoadRoles()
              }
            }}
            onFocus={() => {
              if (mode === "role") {
                setShowSuggestions(true)
                void maybeLoadRoles()
              }
            }}
            onKeyDown={onKeyDown}
            className="flex-1"
          />
          <Button type="submit" disabled={loading}>{loading ? "Searching..." : "Search"}</Button>
        </form>
        {mode === "role" && showSuggestions && filteredRoles.length > 0 && (
          <div className="mt-2 border border-gray-200 rounded-md bg-white shadow-sm max-w-2xl">
            <ul className="max-h-60 overflow-auto">
              {filteredRoles.slice(0, 10).map((name, idx) => (
                <li
                  key={name}
                  className={`px-3 py-2 cursor-pointer ${idx === activeIndex ? "bg-gray-100" : ""}`}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    setQ(name)
                    setShowSuggestions(false)
                  }}
                >
                  {name}
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="mt-4">
          <FilterBar
            selectedTechTags={selectedTechTags}
            selectedCategoryTags={selectedCategoryTags}
            onTechTagsChange={setSelectedTechTags}
            onCategoryTagsChange={setSelectedCategoryTags}
            selectedStages={selectedStages}
            onStagesChange={setSelectedStages}
            selectedProjectTypes={selectedProjectTypes}
            onProjectTypesChange={setSelectedProjectTypes}
            onClear={() => {
              setSelectedTechTags([])
              setSelectedCategoryTags([])
              setSelectedStages([])
              setSelectedProjectTypes([])
            }}
          />
        </div>
        <p className="text-sm text-gray-600 mt-2">{loading ? "Loading..." : `${items.length} collaborations found`}</p>
      </div>

      {loading ? (
        <div className="py-12 text-center text-gray-500">Loading...</div>
      ) : items.length === 0 ? (
        <EmptyState
          title="No collaborations found"
          description="Be the first to post a collaboration opportunity!"
          action={<Button asChild><Link href="/collaborations/new">Post Collaboration</Link></Button>}
        />
      ) : (
        <div className="space-y-6">
          {items.map((item) => (
            <div key={item.collaboration.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 flex items-start gap-3">
                  <div className="shrink-0">
                    <LogoImage src={(item.collaboration as any).logoUrl || ""} alt={item.collaboration.title} size={40} />
                  </div>
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
    </div>
  )
}


