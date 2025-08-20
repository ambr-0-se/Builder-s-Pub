"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useTags } from "@/hooks/useTags"

interface FilterBarProps {
  selectedTechTags: number[]
  selectedCategoryTags: number[]
  onTechTagsChange: (tags: number[]) => void
  onCategoryTagsChange: (tags: number[]) => void
  onClear: () => void
}

export function FilterBar({
  selectedTechTags,
  selectedCategoryTags,
  onTechTagsChange,
  onCategoryTagsChange,
  onClear,
}: FilterBarProps) {
  const { technology, category, loading } = useTags()
  const [showAllTech, setShowAllTech] = useState(false)
  const [showAllCategory, setShowAllCategory] = useState(false)

  const toggleTechTag = (tagId: number) => {
    if (selectedTechTags.includes(tagId)) {
      onTechTagsChange(selectedTechTags.filter((id) => id !== tagId))
    } else {
      onTechTagsChange([...selectedTechTags, tagId])
    }
  }

  const toggleCategoryTag = (tagId: number) => {
    if (selectedCategoryTags.includes(tagId)) {
      onCategoryTagsChange(selectedCategoryTags.filter((id) => id !== tagId))
    } else {
      onCategoryTagsChange([...selectedCategoryTags, tagId])
    }
  }

  const hasFilters = selectedTechTags.length > 0 || selectedCategoryTags.length > 0

  const visibleTechTags = showAllTech ? technology : technology.slice(0, 6)
  const visibleCategoryTags = showAllCategory ? category : category.slice(0, 6)

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        {hasFilters && (
          <Button variant="outline" size="sm" onClick={onClear}>
            Clear All
          </Button>
        )}
      </div>

      <div className="space-y-6">
        {loading && <div className="text-sm text-gray-500">Loading tags...</div>}
        {/* Technology Tags */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Technology</h4>
          <div className="flex flex-wrap gap-2">
            {visibleTechTags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => toggleTechTag(tag.id)}
                className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                  selectedTechTags.includes(tag.id)
                    ? "bg-blue-100 text-blue-800 border border-blue-200"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
                }`}
              >
                {tag.name}
              </button>
            ))}
            {technology.length > 6 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAllTech(!showAllTech)}
                className="text-blue-600 hover:text-blue-800"
              >
                {showAllTech ? "Show Less" : `+${technology.length - 6} More`}
              </Button>
            )}
          </div>
        </div>

        {/* Category Tags */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Category</h4>
          <div className="flex flex-wrap gap-2">
            {visibleCategoryTags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => toggleCategoryTag(tag.id)}
                className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                  selectedCategoryTags.includes(tag.id)
                    ? "bg-green-100 text-green-800 border border-green-200"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
                }`}
              >
                {tag.name}
              </button>
            ))}
            {category.length > 6 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAllCategory(!showAllCategory)}
                className="text-blue-600 hover:text-blue-800"
              >
                {showAllCategory ? "Show Less" : `+${category.length - 6} More`}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
