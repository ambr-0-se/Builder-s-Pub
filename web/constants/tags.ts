import type { Tag } from "@/lib/types"

export const TECHNOLOGY_TAGS: Tag[] = [
  { id: 1, name: "LLMs", type: "technology" },
  { id: 2, name: "NLP", type: "technology" },
  { id: 3, name: "Computer Vision", type: "technology" },
  { id: 4, name: "Agents", type: "technology" },
  { id: 5, name: "Audio", type: "technology" },
  { id: 6, name: "Robotics", type: "technology" },
  { id: 7, name: "React", type: "technology" },
  { id: 8, name: "Next.js", type: "technology" },
  { id: 9, name: "Python", type: "technology" },
  { id: 10, name: "TypeScript", type: "technology" },
]

export const CATEGORY_TAGS: Tag[] = [
  { id: 11, name: "Productivity", type: "category" },
  { id: 12, name: "Education", type: "category" },
  { id: 13, name: "Finance", type: "category" },
  { id: 14, name: "Healthcare", type: "category" },
  { id: 15, name: "Creative", type: "category" },
  { id: 16, name: "DevTools", type: "category" },
  { id: 17, name: "Gaming", type: "category" },
  { id: 18, name: "Social", type: "category" },
]

export const ALL_TAGS = [...TECHNOLOGY_TAGS, ...CATEGORY_TAGS]
