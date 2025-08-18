"use client"

interface SortTabsProps {
  activeSort: "recent" | "popular"
  onSortChange: (sort: "recent" | "popular") => void
}

export function SortTabs({ activeSort, onSortChange }: SortTabsProps) {
  return (
    <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
      <button
        onClick={() => onSortChange("recent")}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
          activeSort === "recent" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
        }`}
      >
        Recent
      </button>
      <button
        onClick={() => onSortChange("popular")}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
          activeSort === "popular" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
        }`}
      >
        Popular
      </button>
    </div>
  )
}
