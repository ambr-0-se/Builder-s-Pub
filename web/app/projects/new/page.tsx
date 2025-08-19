"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { createProject } from "@/lib/api/mockProjects"
import { useAuth } from "@/lib/api/auth"
import { useAnalyticsMock } from "@/lib/analytics"
import { showToast } from "@/components/ui/toast"
import { TECHNOLOGY_TAGS, CATEGORY_TAGS } from "@/constants/tags"

export default function NewProjectPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const { track } = useAnalyticsMock()

  const [formData, setFormData] = useState({
    title: "",
    tagline: "",
    description: "",
    demoUrl: "",
    sourceUrl: "",
  })

  const [selectedTechTags, setSelectedTechTags] = useState<number[]>([])
  const [selectedCategoryTags, setSelectedCategoryTags] = useState<number[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Sign In Required</h1>
        <p className="text-gray-600 mb-6">You need to sign in to post a project.</p>
        <Button onClick={() => router.push("/")}>Go Home</Button>
      </div>
    )
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = "Title is required"
    } else if (formData.title.length > 80) {
      newErrors.title = "Title must be 80 characters or less"
    }

    if (!formData.tagline.trim()) {
      newErrors.tagline = "Tagline is required"
    } else if (formData.tagline.length > 140) {
      newErrors.tagline = "Tagline must be 140 characters or less"
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required"
    } else if (formData.description.length > 4000) {
      newErrors.description = "Description must be 4000 characters or less"
    }

    if (!formData.demoUrl.trim()) {
      newErrors.demoUrl = "Demo URL is required"
    } else if (!/^https?:\/\/.+/.test(formData.demoUrl)) {
      newErrors.demoUrl = "Demo URL must be a valid HTTP/HTTPS URL"
    }

    if (formData.sourceUrl && !/^https?:\/\/.+/.test(formData.sourceUrl)) {
      newErrors.sourceUrl = "Source URL must be a valid HTTP/HTTPS URL"
    }

    if (selectedTechTags.length === 0) {
      newErrors.techTags = "At least one technology tag is required"
    }

    if (selectedCategoryTags.length === 0) {
      newErrors.categoryTags = "At least one category tag is required"
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
      const { id } = await createProject({
        title: formData.title.trim(),
        tagline: formData.tagline.trim(),
        description: formData.description.trim(),
        demoUrl: formData.demoUrl.trim(),
        sourceUrl: formData.sourceUrl.trim() || undefined,
      })

      track("project_created", {
        projectId: id,
        techTags: selectedTechTags,
        categoryTags: selectedCategoryTags,
      })

      showToast("Project created successfully!", "success")
      router.push(`/projects/${id}`)
    } catch (error) {
      showToast("Failed to create project. Please try again.", "error")
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleTechTag = (tagId: number) => {
    setSelectedTechTags((prev) => (prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]))
    if (errors.techTags) {
      setErrors((prev) => ({ ...prev, techTags: "" }))
    }
  }

  const toggleCategoryTag = (tagId: number) => {
    setSelectedCategoryTags((prev) => (prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]))
    if (errors.categoryTags) {
      setErrors((prev) => ({ ...prev, categoryTags: "" }))
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Post Your Project</h1>
        <p className="text-gray-600 mt-2">Share your amazing project with the community</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Project Title *
          </label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="Enter your project title"
            error={errors.title}
            maxLength={80}
          />
          <p className="text-xs text-gray-500 mt-1">{formData.title.length}/80 characters</p>
        </div>

        <div>
          <label htmlFor="tagline" className="block text-sm font-medium text-gray-700 mb-2">
            Tagline *
          </label>
          <Input
            id="tagline"
            value={formData.tagline}
            onChange={(e) => setFormData((prev) => ({ ...prev, tagline: e.target.value }))}
            placeholder="A brief description of what your project does"
            error={errors.tagline}
            maxLength={140}
          />
          <p className="text-xs text-gray-500 mt-1">{formData.tagline.length}/140 characters</p>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description *
          </label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Provide a detailed description of your project, including features, technologies used, and any other relevant information"
            rows={6}
            error={errors.description}
            maxLength={4000}
          />
          <p className="text-xs text-gray-500 mt-1">{formData.description.length}/4000 characters</p>
        </div>

        <div>
          <label htmlFor="demoUrl" className="block text-sm font-medium text-gray-700 mb-2">
            Demo URL *
          </label>
          <Input
            id="demoUrl"
            type="url"
            value={formData.demoUrl}
            onChange={(e) => setFormData((prev) => ({ ...prev, demoUrl: e.target.value }))}
            placeholder="https://your-project-demo.com"
            error={errors.demoUrl}
          />
        </div>

        <div>
          <label htmlFor="sourceUrl" className="block text-sm font-medium text-gray-700 mb-2">
            Source Code URL (Optional)
          </label>
          <Input
            id="sourceUrl"
            type="url"
            value={formData.sourceUrl}
            onChange={(e) => setFormData((prev) => ({ ...prev, sourceUrl: e.target.value }))}
            placeholder="https://github.com/username/project"
            error={errors.sourceUrl}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Technology Tags * {errors.techTags && <span className="text-red-600">({errors.techTags})</span>}
          </label>
          <div className="flex flex-wrap gap-2">
            {TECHNOLOGY_TAGS.map((tag) => (
              <button
                key={tag.id}
                type="button"
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
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Category Tags * {errors.categoryTags && <span className="text-red-600">({errors.categoryTags})</span>}
          </label>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_TAGS.map((tag) => (
              <button
                key={tag.id}
                type="button"
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
          </div>
        </div>

        <div className="flex gap-4 pt-6">
          <Button type="submit" disabled={isSubmitting} className="flex-1">
            {isSubmitting ? "Creating Project..." : "Create Project"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
