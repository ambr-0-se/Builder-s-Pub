"use client"

import { useMemo, useRef, useState } from "react"
import { sortWithOthersLast } from "@/lib/utils/tag-picker"
import type { Tag } from "@/lib/types"

type Props = {
  label: string
  options: Tag[]
  value: number[]
  onChange: (next: number[]) => void
  max: number
  placeholder?: string
  pinned?: Tag[]
  excludePinnedFromDropdown?: boolean
  variant?: "tech" | "category" | "neutral"
}

export function TagMultiSelect({ label, options, value, onChange, max, placeholder, pinned = [], excludePinnedFromDropdown = true, variant = "neutral" }: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const inputRef = useRef<HTMLInputElement | null>(null)

  const byId = useMemo(() => new Set(value), [value])
  const canAddMore = value.length < max
  const pinnedIds = useMemo(() => new Set((pinned || []).map((p) => p.id)), [pinned])

  const selectedChipClass = useMemo(() => {
    switch (variant) {
      case "tech":
        return "bg-blue-100 text-blue-800 border border-blue-200"
      case "category":
        return "bg-green-100 text-green-800 border border-green-200"
      default:
        return "bg-gray-100 text-gray-700 border border-gray-200"
    }
  }, [variant])

  const filtered = useMemo(() => {
    const q = (query || "").toLowerCase()
    let pool = options.filter((t) => !byId.has(t.id))
    if (excludePinnedFromDropdown && pinnedIds.size > 0) {
      pool = pool.filter((t) => !pinnedIds.has(t.id))
    }
    const sorted = sortWithOthersLast(pool)
    if (!q) return sorted
    return sorted.filter((t) => t.name.toLowerCase().includes(q))
  }, [options, byId, query])

  const add = (id: number, opts?: { openAfter?: boolean }) => {
    if (!canAddMore) return
    onChange([...value, id])
    setQuery("")
    const shouldOpen = opts?.openAfter ?? true
    if (shouldOpen) {
      setOpen(true)
      inputRef.current?.focus()
    }
  }

  const remove = (id: number) => {
    onChange(value.filter((v) => v !== id))
  }

  return (
    <div>
      <div className="mb-2 text-sm font-medium text-gray-700">
        {label} <span className="ml-2 text-xs text-gray-500">{value.length}/{max} selected</span>
      </div>

      <div className="flex flex-wrap gap-2 mb-2">
        {/* Pinned quick-picks: shown always; toggle select; no × */}
        {pinned.map((t) => {
          const selected = byId.has(t.id)
          const disabled = !selected && !canAddMore
          return (
            <button
              key={`p-${t.id}`}
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                if (selected) {
                  remove(t.id)
                } else {
                  // Selecting from quick-picks should NOT open the dropdown
                  add(t.id, { openAfter: false })
                }
              }}
              disabled={disabled}
              className={`inline-flex items-center rounded-full px-3 py-1 text-sm ${
                selected
                  ? selectedChipClass
                  : disabled
                    ? "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
                    : "bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100"
              }`}
            >
              {t.name}
            </button>
          )
        })}

        {/* Dynamic selected (non-pinned) with removable × */}
        {value
          .filter((id) => !pinnedIds.has(id))
          .map((id) => options.find((o) => o.id === id))
          .filter(Boolean)
          .map((t) => (
            <button
              key={`s-${t!.id}`}
              type="button"
              onClick={() => remove(t!.id)}
              className={`inline-flex items-center rounded-full px-3 py-1 text-sm ${selectedChipClass} hover:opacity-90`}
            >
              {t!.name}
              <span className="ml-2 text-gray-500">×</span>
            </button>
          ))}
      </div>

      <div
        className="relative"
        onClick={() => {
          setOpen(true)
          inputRef.current?.focus()
        }}
      >
        <input
          ref={inputRef}
          type="text"
          className="w-full rounded border border-gray-200 px-3 py-2 text-sm"
          placeholder={placeholder || "Add tag"}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            // Defer to allow option click (which uses preventDefault on mousedown)
            setTimeout(() => setOpen(false), 100)
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") setOpen(true)
          }}
        />
        <button
          type="button"
          aria-label="Show options"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
          onMouseDown={(e) => { e.preventDefault(); e.stopPropagation() }}
          onClick={(e) => {
            e.stopPropagation()
            setOpen((o) => !o)
            inputRef.current?.focus()
          }}
        >
          ▾
        </button>

        {open && (
          <div className="absolute z-10 mt-1 max-h-64 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow">
            {filtered.length === 0 && (
              <div className="px-3 py-2 text-sm text-gray-500">No matches</div>
            )}
            {filtered.map((t) => {
              const disabled = !canAddMore
              return (
                <button
                  key={t.id}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => add(t.id)}
                  disabled={disabled}
                  className={`block w-full text-left px-3 py-2 text-sm ${disabled ? "text-gray-400 cursor-not-allowed" : "hover:bg-gray-50"}`}
                >
                  {t.name}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}


