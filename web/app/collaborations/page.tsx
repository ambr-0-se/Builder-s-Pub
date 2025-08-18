"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/ui/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import { listCollabs } from "@/lib/api/mockCollabs"
import type { Collaboration } from "@/lib/types"

export default function CollaborationsPage() {
  const [collaborations, setCollaborations] = useState<Collaboration[]>([])
  const [loading, setLoading] = useState(true)
  const [kindFilter, setKindFilter] = useState("")
  const [skillsFilter, setSkillsFilter] = useState("")

  const loadCollaborations = async () => {
    setLoading(true)
    try {
      const { items } = await listCollabs({
        kind: kindFilter || undefined,
        skills: skillsFilter || undefined,
      })
      setCollaborations(items)
    } catch (error) {
      console.error("Failed to load collaborations:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCollaborations()
  }, [kindFilter, skillsFilter])

  const handleClearFilters = () => {
    setKindFilter("")
    setSkillsFilter("")
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

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
          {(kindFilter || skillsFilter) && (
            <Button variant="outline" size="sm" onClick={handleClearFilters}>
              Clear Filters
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="kind" className="block text-sm font-medium text-gray-700 mb-2">
              Type
            </label>
            <Select id="kind" value={kindFilter} onChange={(e) => setKindFilter(e.target.value)}>
              <option value="">All Types</option>
              <option value="ongoing">Ongoing</option>
              <option value="planned">Planned</option>
              <option value="individual">Individual</option>
              <option value="organization">Organization</option>
            </Select>
          </div>

          <div>
            <label htmlFor="skills" className="block text-sm font-medium text-gray-700 mb-2">
              Skills
            </label>
            <Input
              id="skills"
              type="text"
              placeholder="Search by skills (e.g., React, Python)"
              value={skillsFilter}
              onChange={(e) => setSkillsFilter(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="mb-6">
        <p className="text-sm text-gray-600">
          {loading ? "Loading..." : `${collaborations.length} collaborations found`}
        </p>
      </div>

      {loading ? (
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-18" />
              </div>
            </div>
          ))}
        </div>
      ) : collaborations.length === 0 ? (
        <EmptyState
          title="No collaborations found"
          description="Be the first to post a collaboration opportunity!"
          action={
            <Button asChild>
              <Link href="/collaborations/new">Post Collaboration</Link>
            </Button>
          }
          icon={
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          }
        />
      ) : (
        <div className="space-y-6">
          {collaborations.map((collab) => (
            <div
              key={collab.id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge variant="outline" className="capitalize">
                      {collab.kind}
                    </Badge>
                    <span className="text-sm text-gray-500">by {collab.owner.displayName}</span>
                  </div>

                  <Link href={`/collaborations/${collab.id}`} className="group">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 mb-2">
                      {collab.title}
                    </h3>
                  </Link>

                  <p className="text-gray-600 mb-3 line-clamp-2">{collab.description}</p>

                  <div className="flex items-center text-sm text-gray-500 space-x-4">
                    {collab.region && <span>📍 {collab.region}</span>}
                    {collab.commitment && <span>⏰ {collab.commitment}</span>}
                    <span>📅 {collab.createdAt.toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {collab.skills.map((skill, index) => (
                  <Badge key={index} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
