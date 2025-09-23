"use client"
import React, { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { listCollabs as listCollabsClient } from "@/lib/api/collabs"
import { LogoImage } from "@/components/ui/logo-image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import CollabDetailPanel from "@/components/features/collaborations/CollabDetailPanel"
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
  const dropdownRef = useRef<HTMLDivElement | null>(null)
  const filteredRoles = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return roleOptions
    return roleOptions.filter((r) => r.toLowerCase().includes(needle))
  }, [q, roleOptions])

  useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      if (!showSuggestions) return
      const el = dropdownRef.current
      if (el && e.target instanceof Node && !el.contains(e.target)) {
        setShowSuggestions(false)
        setActiveIndex(-1)
      }
    }
    document.addEventListener("mousedown", onDocMouseDown)
    return () => document.removeEventListener("mousedown", onDocMouseDown)
  }, [showSuggestions])

  // Split view selection (Step 14)
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    return (mode === "role" ? (searchParams.get("selected") as string | null) : null) || null
  })
  const [detail, setDetail] = useState<any | null>(null)
  useEffect(() => {
    if (mode !== "role") return
    const param = searchParams.get("selected")
    if (param && param !== selectedId) setSelectedId(param)
    if (!param && selectedId) setSelectedId(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, mode])
  useEffect(() => {
    let active = true
    if (mode !== "role" || !selectedId) {
      setDetail(null)
      return
    }
    ;(async () => {
      try {
        const res = await fetch(`/api/collaborations/get?id=${encodeURIComponent(selectedId)}`)
        if (!active) return
        if (res.ok) {
          const json = await res.json()
          setDetail(json.item)
        } else {
          setDetail(null)
        }
      } catch {
        if (active) setDetail(null)
      }
    })()
    return () => {
      active = false
    }
  }, [mode, selectedId])

  function highlight(text: string, needle: string) {
    const ql = (needle || "").trim().toLowerCase()
    if (!ql) return text
    const idx = text.toLowerCase().indexOf(ql)
    if (idx === -1) return text
    const before = text.slice(0, idx)
    const mid = text.slice(idx, idx + ql.length)
    const after = text.slice(idx + ql.length)
    return (
      <>
        {before}
        <mark className="bg-yellow-100">{mid}</mark>
        {after}
      </>
    )
  }

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
        <div className="flex justify-end">
          <Button asChild>
            <Link href="/collaborations/new">Post Collaboration</Link>
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            performSearch()
          }}
          className="flex gap-3 items-center"
        >
          {/* Compact mode segmented control */}
          <div data-testid="mode-toggle" className="flex items-center gap-1 rounded-full bg-gray-50 border border-gray-200 p-0.5">
            <Button
              type="button"
              size="sm"
              variant={mode === "project" ? "default" : "ghost"}
              aria-pressed={mode === "project"}
              onClick={() => {
                const sp = new URLSearchParams(searchParams as any)
                sp.set("mode", "project")
                sp.delete("selected")
                setSelectedId(null)
                try {
                  track("search_mode_change", {
                    from: mode,
                    to: "project",
                    type: "collabs",
                    techTagIds: selectedTechTags,
                    categoryTagIds: selectedCategoryTags,
                    stages: selectedStages,
                    projectTypes: selectedProjectTypes,
                  })
                } catch {}
                router.replace(`/collaborations?${sp.toString()}`)
              }}
              className="rounded-full px-3 py-1 text-xs font-medium"
            >
              By project
            </Button>
            <Button
              type="button"
              size="sm"
              variant={mode === "role" ? "default" : "ghost"}
              aria-pressed={mode === "role"}
              onClick={() => {
                const sp = new URLSearchParams(searchParams as any)
                sp.set("mode", "role")
                sp.delete("selected")
                setSelectedId(null)
                try {
                  track("search_mode_change", {
                    from: mode,
                    to: "role",
                    type: "collabs",
                    techTagIds: selectedTechTags,
                    categoryTagIds: selectedCategoryTags,
                    stages: selectedStages,
                    projectTypes: selectedProjectTypes,
                  })
                } catch {}
                router.replace(`/collaborations?${sp.toString()}`)
              }}
              className="rounded-full px-3 py-1 text-xs font-medium"
            >
              By role
            </Button>
          </div>
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
          <div ref={dropdownRef} className="mt-2 border border-gray-200 rounded-md bg-white shadow-sm max-w-2xl" role="dialog" aria-label="Role suggestions">
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
              <span className="text-xs text-gray-500">Suggestions</span>
              <Button size="sm" variant="ghost" onClick={() => setShowSuggestions(false)}>Hide</Button>
            </div>
            <ul className="max-h-60 overflow-auto" role="listbox" aria-label="Suggested roles">
              {filteredRoles.slice(0, 10).map((name, idx) => (
                <li
                  key={name}
                  className={`px-3 py-2 cursor-pointer ${idx === activeIndex ? "bg-gray-100" : ""}`}
                  role="option"
                  aria-selected={idx === activeIndex}
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
      ) : mode === "role" ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-3 md:col-span-1">
            {items.map((item) => (
              <button
                key={item.collaboration.id}
                className={`w-full text-left bg-white rounded-lg border p-4 hover:shadow ${selectedId === item.collaboration.id ? "border-blue-500" : "border-gray-200"}`}
                onClick={() => {
                  setSelectedId(item.collaboration.id)
                  const sp = new URLSearchParams(searchParams as any)
                  sp.set("mode", "role")
                  sp.set("selected", item.collaboration.id)
                  router.replace(`/collaborations?${sp.toString()}`, { scroll: false })
                }}
              >
                <div className="flex items-center gap-3">
                  <LogoImage src={(item.collaboration as any).logoUrl || ""} alt={item.collaboration.title} size={32} />
                  <div className="min-w-0">
                    <div className="text-sm text-gray-500 truncate">{item.collaboration.title}</div>
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {(() => {
                        const roles: string[] = Array.isArray(item.collaboration.lookingFor)
                          ? item.collaboration.lookingFor.map((r: any) => String(r.role || "")).filter(Boolean)
                          : []
                        const needle = q.trim().toLowerCase()
                        let matched = roles.find((r) => r.toLowerCase().includes(needle))
                        const display = matched || roles[0] || "Role"
                        return highlight(display, q)
                      })()}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
          <div className="md:col-span-2">
            {!selectedId ? (
              <div className="text-gray-500 py-8">Select a role item on the left to view details.</div>
            ) : !detail ? (
              <div className="text-gray-500 py-8">Loading details...</div>
            ) : (
              <CollabDetailPanel item={detail} />
            )}
          </div>
        </div>
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


