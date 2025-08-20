"use client"

import { useEffect, useState } from "react"
import type { Tag } from "@/lib/types"
import { fetchAllTags } from "@/lib/api/tags"

export function useTags() {
  const [technology, setTechnology] = useState<Tag[]>([])
  const [category, setCategory] = useState<Tag[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    setLoading(true)
    fetchAllTags()
      .then((res) => {
        if (!isMounted) return
        setTechnology(res.technology)
        setCategory(res.category)
        setError(null)
      })
      .catch((err: any) => {
        if (!isMounted) return
        setError(err?.message || "Failed to load tags")
      })
      .finally(() => {
        if (!isMounted) return
        setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  return { technology, category, loading, error }
}


