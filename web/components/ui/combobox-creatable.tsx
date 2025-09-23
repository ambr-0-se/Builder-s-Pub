"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export interface ComboboxCreatableProps {
  value: string
  onChange: (next: string) => void
  options: string[]
  placeholder?: string
  maxLength?: number
  disabled?: boolean
  // Optional: controlled open state if parent wants to manage
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function ComboboxCreatable({
  value,
  onChange,
  options,
  placeholder,
  maxLength = 80,
  disabled,
  open,
  onOpenChange,
}: ComboboxCreatableProps) {
  const [q, setQ] = useState<string>(value || "")
  const [show, setShow] = useState<boolean>(false)
  const isOpen = open ?? show
  const setIsOpen = (v: boolean) => {
    onOpenChange ? onOpenChange(v) : setShow(v)
  }
  const [activeIndex, setActiveIndex] = useState<number>(-1)
  const dropdownRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setQ(value || "")
  }, [value])

  const normalizedOptions = useMemo(() => options.map((o) => o.trim()).filter(Boolean), [options])
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return normalizedOptions
    return normalizedOptions.filter((o) => o.toLowerCase().includes(needle))
  }, [q, normalizedOptions])

  const canCreate = useMemo(() => {
    const t = q.trim()
    if (!t) return false
    const lower = t.toLowerCase()
    return !normalizedOptions.some((o) => o.toLowerCase() === lower)
  }, [q, normalizedOptions])

  useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      if (!isOpen) return
      const el = dropdownRef.current
      if (el && e.target instanceof Node && !el.contains(e.target)) {
        setIsOpen(false)
        setActiveIndex(-1)
      }
    }
    document.addEventListener("mousedown", onDocMouseDown)
    return () => document.removeEventListener("mousedown", onDocMouseDown)
  }, [isOpen])

  function commitSelection(text: string) {
    onChange(text)
    setQ(text)
    setIsOpen(false)
    setActiveIndex(-1)
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    const pool = [...filtered]
    if (canCreate) pool.unshift(`__create__:${q.trim()}`)
    if (!isOpen && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setIsOpen(true)
    }
    if (!isOpen || pool.length === 0) {
      if (e.key === "Enter" && q.trim()) {
        // Enter confirms free text even if list is closed
        e.preventDefault()
        commitSelection(q.trim())
      } else if (e.key === "Escape") {
        setIsOpen(false)
      }
      return
    }
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIndex((i) => (i + 1) % pool.length)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIndex((i) => (i - 1 + pool.length) % pool.length)
    } else if (e.key === "Enter") {
      e.preventDefault()
      const idx = activeIndex >= 0 ? activeIndex : 0
      const item = pool[idx]
      if (item?.startsWith("__create__:")) {
        commitSelection(q.trim())
      } else if (item) {
        commitSelection(item)
      }
    } else if (e.key === "Escape") {
      setIsOpen(false)
      setActiveIndex(-1)
    }
  }

  return (
    <div className="relative">
      <Input
        value={q}
        onChange={(e) => {
          const next = e.target.value
          if (next.length > maxLength) return
          setQ(next)
          setIsOpen(true)
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        aria-autocomplete="list"
        aria-expanded={isOpen}
        role="combobox"
        aria-controls="combobox-creatable-list"
      />

      {isOpen && (filtered.length > 0 || canCreate) && (
        <div ref={dropdownRef} className="absolute z-50 mt-2 w-full border border-gray-200 rounded-md bg-white shadow-sm">
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
            <span className="text-xs text-gray-500">Suggestions</span>
            <Button size="sm" variant="ghost" onClick={() => setIsOpen(false)}>Hide</Button>
          </div>
          <ul id="combobox-creatable-list" className="max-h-60 overflow-auto py-1" role="listbox" aria-label="Suggestions">
            {canCreate && (
              <li
                role="option"
                aria-selected={activeIndex === 0}
                className={`px-3 py-2 cursor-pointer ${activeIndex === 0 ? "bg-gray-100" : ""}`}
                onMouseEnter={() => setActiveIndex(0)}
                onMouseDown={(e) => {
                  e.preventDefault()
                  commitSelection(q.trim())
                }}
              >
                Create "{q.trim()}"
              </li>
            )}
            {filtered.map((name, idx0) => {
              const idx = canCreate ? idx0 + 1 : idx0
              return (
                <li
                  key={name}
                  role="option"
                  aria-selected={activeIndex === idx}
                  className={`px-3 py-2 cursor-pointer ${activeIndex === idx ? "bg-gray-100" : ""}`}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    commitSelection(name)
                  }}
                >
                  {name}
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}

export default ComboboxCreatable


