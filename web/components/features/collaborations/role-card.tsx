"use client"

import { useMemo, useState } from "react"

type RoleItem = {
  role: string
  amount?: number
  prerequisite?: string
  goodToHave?: string
  description?: string
}

export function RoleCard({ item }: { item: RoleItem }) {
  const [expanded, setExpanded] = useState(false)
  const showToggle = useMemo(() => {
    const totalLen = `${item.prerequisite || ""}${item.goodToHave || ""}${item.description || ""}`.length
    return totalLen > 220
  }, [item])

  const clampClass = expanded ? "" : "line-clamp-2"

  return (
    <div className="border border-gray-200 rounded-md p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-base md:text-lg font-medium text-gray-900 truncate" title={item.role}>
          {item.role}
        </h4>
        <span
          className="inline-flex items-center rounded-full bg-gray-100 text-gray-800 px-2.5 py-1 text-xs md:text-sm border border-gray-200"
          aria-label={`${item.amount ?? 1} ${((item.amount ?? 1) > 1) ? "openings" : "opening"}`}
        >
          {(item.amount ?? 1)} {((item.amount ?? 1) > 1) ? "openings" : "opening"}
        </span>
      </div>

      {/* Details */}
      <div className="md:pl-4 md:ml-2 md:border-l md:border-gray-200 grid grid-cols-1 gap-2 text-sm">
        {item.prerequisite && item.prerequisite.trim().length > 0 && (
          <div className="flex gap-2">
            <span className="font-medium text-gray-700">Prerequisite:</span>
            <span className={`text-gray-700 whitespace-pre-wrap break-words ${clampClass}`}>{item.prerequisite}</span>
          </div>
        )}
        {item.goodToHave && item.goodToHave.trim().length > 0 && (
          <div className="flex gap-2">
            <span className="font-medium text-gray-700">Good to have:</span>
            <span className={`text-gray-700 whitespace-pre-wrap break-words ${clampClass}`}>{item.goodToHave}</span>
          </div>
        )}
        {item.description && item.description.trim().length > 0 && (
          <div className="flex gap-2">
            <span className="font-medium text-gray-700">Description:</span>
            <span className={`text-gray-700 whitespace-pre-wrap break-words ${clampClass}`}>{item.description}</span>
          </div>
        )}
      </div>

      {showToggle && (
        <div className="mt-2">
          <button type="button" className="text-xs text-blue-600 hover:underline" onClick={() => setExpanded((v) => !v)}>
            {expanded ? "Show less" : "Show more"}
          </button>
        </div>
      )}
    </div>
  )
}


