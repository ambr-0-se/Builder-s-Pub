"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { createCollab } from "@/lib/api/mockCollabs"
import { useAuthMock } from "@/lib/api/mockAuth"
import { useAnalyticsMock } from "@/lib/analytics"
import { showToast } from "@/components/ui/toast"

export default function NewCollaborationPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuthMock()
  const { track } = useAnalyticsMock()

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    kind: "ongoing" as "ongoing" | "planned" | "individual" | "organization",
    skills: "",
    region: "",
    commitment: "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Sign In Required</h1>
        <p className="text-gray-600 mb-6">You need to sign in to post a collaboration.</p>
        <Button onClick={() => router.push("/")}>Go Home</Button>
      </div>
    )
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = "Title is required"
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required"
    }

    if (!formData.skills.trim()) {
      newErrors.skills = "At least one skill is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const skillsArray = formData.skills
        .split(",")
        .map((skill) => skill.trim())
        .filter((skill) => skill.length > 0)

      const { id } = await createCollab({
        title: formData.title.trim(),
        description: formData.description.trim(),
        kind: formData.kind,
        skills: skillsArray,
        region: formData.region.trim() || undefined,
        commitment: formData.commitment.trim() || undefined,
      })

      track("collaboration_created", {
        collaborationId: id,
        kind: formData.kind,
        skillsCount: skillsArray.length,
      })

      showToast("Collaboration posted successfully!", "success")
      router.push(`/collaborations/${id}`)
    } catch (error) {
      showToast("Failed to post collaboration. Please try again.", "error")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Post Collaboration</h1>
        <p className="text-gray-600 mt-2">Find collaborators for your next project</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Title *
          </label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="Enter collaboration title"
            error={errors.title}
          />
        </div>

        <div>
          <label htmlFor="kind" className="block text-sm font-medium text-gray-700 mb-2">
            Type *
          </label>
          <Select
            id="kind"
            value={formData.kind}
            onChange={(e) => setFormData((prev) => ({ ...prev, kind: e.target.value as any }))}
          >
            <option value="ongoing">Ongoing</option>
            <option value="planned">Planned</option>
            <option value="individual">Individual</option>
            <option value="organization">Organization</option>
          </Select>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description *
          </label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Describe your collaboration opportunity, what you're building, and what kind of help you need"
            rows={6}
            error={errors.description}
          />
        </div>

        <div>
          <label htmlFor="skills" className="block text-sm font-medium text-gray-700 mb-2">
            Skills Needed *
          </label>
          <Input
            id="skills"
            value={formData.skills}
            onChange={(e) => setFormData((prev) => ({ ...prev, skills: e.target.value }))}
            placeholder="React, TypeScript, UI/UX Design (comma-separated)"
            error={errors.skills}
          />
          <p className="text-xs text-gray-500 mt-1">Separate multiple skills with commas</p>
        </div>

        <div>
          <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-2">
            Location (Optional)
          </label>
          <Input
            id="region"
            value={formData.region}
            onChange={(e) => setFormData((prev) => ({ ...prev, region: e.target.value }))}
            placeholder="Remote, San Francisco, New York, etc."
          />
        </div>

        <div>
          <label htmlFor="commitment" className="block text-sm font-medium text-gray-700 mb-2">
            Time Commitment (Optional)
          </label>
          <Input
            id="commitment"
            value={formData.commitment}
            onChange={(e) => setFormData((prev) => ({ ...prev, commitment: e.target.value }))}
            placeholder="Part-time (10-15 hours/week), Full-time, Flexible, etc."
          />
        </div>

        <div className="flex gap-4 pt-6">
          <Button type="submit" disabled={isSubmitting} className="flex-1">
            {isSubmitting ? "Posting..." : "Post Collaboration"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
