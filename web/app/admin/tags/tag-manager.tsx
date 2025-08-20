"use client"

import { useMemo, useState, useTransition } from "react"
import type { Tag } from "@/lib/types"
import { createTag } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

function normalize(s: string) {
  return (s || "").trim().toLowerCase()
}

function useSuggestions(existing: Tag[], type: "technology" | "category", query: string) {
  const q = normalize(query)
  return useMemo(() => {
    if (!q) return [] as Tag[]
    return existing.filter((t) => normalize(t.type) === type && normalize(t.name).includes(q))
  }, [existing, type, q])
}

function hasExact(existing: Tag[], type: "technology" | "category", query: string) {
  const q = normalize(query)
  if (!q) return false
  return existing.some((t) => normalize(t.type) === type && normalize(t.name) === q)
}

export function AdminTagManager({
  initialTechnology,
  initialCategory,
}: {
  initialTechnology: Tag[]
  initialCategory: Tag[]
}) {
  const [technology, setTechnology] = useState<Tag[]>(initialTechnology)
  const [category, setCategory] = useState<Tag[]>(initialCategory)
  const [techInput, setTechInput] = useState("")
  const [catInput, setCatInput] = useState("")
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const techSuggestions = useSuggestions(technology, "technology", techInput)
  const catSuggestions = useSuggestions(category, "category", catInput)

  const techExact = hasExact(technology, "technology", techInput)
  const catExact = hasExact(category, "category", catInput)

  const onAdd = (type: "technology" | "category") => {
    setError(null)
    startTransition(async () => {
      const form = new FormData()
      form.set("name", type === "technology" ? techInput.trim() : catInput.trim())
      form.set("type", type)
      const res = await createTag(null, form)
      if (res?.formError || res?.fieldErrors) {
        setError(res.formError || Object.values(res.fieldErrors || {})[0] || "Failed to create tag")
        return
      }
      const newTag = res?.tag as Tag
      if (type === "technology") {
        setTechnology((prev) => [...prev, newTag].sort((a, b) => a.name.localeCompare(b.name)))
        setTechInput("")
      } else {
        setCategory((prev) => [...prev, newTag].sort((a, b) => a.name.localeCompare(b.name)))
        setCatInput("")
      }
    })
  }

  return (
    <div className="space-y-8">
      {error && <p className="text-sm text-red-600">{error}</p>}

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Technology</h2>
        <div className="flex flex-wrap gap-2 mb-3">
          {technology.map((t) => (
            <span key={`${t.type}-${t.id}`} className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm bg-gray-100 border border-gray-200">
              {t.name}
            </span>
          ))}
        </div>
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="Add technology tag"
              value={techInput}
              onChange={(e) => setTechInput(e.target.value)}
              disabled={pending}
            />
            <Button onClick={() => onAdd("technology")} disabled={pending || !normalize(techInput) || techExact}>
              Add
            </Button>
          </div>
          {techInput && techSuggestions.length > 0 && (
            <div className="text-xs text-gray-600">
              Similar existing: {techSuggestions.map((t) => t.name).join(", ")}
            </div>
          )}
          {techExact && <div className="text-xs text-red-600">An identical technology tag already exists.</div>}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Category</h2>
        <div className="flex flex-wrap gap-2 mb-3">
          {category.map((t) => (
            <span key={`${t.type}-${t.id}`} className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm bg-gray-100 border border-gray-200">
              {t.name}
            </span>
          ))}
        </div>
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="Add category tag"
              value={catInput}
              onChange={(e) => setCatInput(e.target.value)}
              disabled={pending}
            />
            <Button onClick={() => onAdd("category")} disabled={pending || !normalize(catInput) || catExact}>
              Add
            </Button>
          </div>
          {catInput && catSuggestions.length > 0 && (
            <div className="text-xs text-gray-600">
              Similar existing: {catSuggestions.map((t) => t.name).join(", ")}
            </div>
          )}
          {catExact && <div className="text-xs text-red-600">An identical category tag already exists.</div>}
        </div>
      </section>
    </div>
  )
}


