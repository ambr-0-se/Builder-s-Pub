"use client"

import type React from "react"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useAuth, ensureServerSession } from "@/lib/api/auth"
import { useAnalytics } from "@/lib/analytics"
import { showToast } from "@/components/ui/toast"
import { useTags } from "@/hooks/useTags"
import { TagMultiSelect } from "@/components/ui/tag-multiselect"
import { createProjectAction, type CreateProjectState } from "@/app/projects/actions"
import { LogoUploader } from "@/components/ui/logo-uploader"
import { requestNewProjectLogoUploadAction } from "@/app/projects/actions"

export default function NewProjectPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const { track } = useAnalytics()
  const { technology, category, loading } = useTags()

  const [formData, setFormData] = useState({
    title: "",
    tagline: "",
    description: "",
    demoUrl: "",
    sourceUrl: "",
  })

  const [logoPath, setLogoPath] = useState<string>("")
  const [pendingUpload, setPendingUpload] = useState<boolean>(false)

  const [selectedTechTags, setSelectedTechTags] = useState<number[]>([])
  const [selectedCategoryTags, setSelectedCategoryTags] = useState<number[]>([])
  const [state, formAction] = useActionState<CreateProjectState, FormData>(createProjectAction, null)

  const errors = state?.fieldErrors || {}

  // Ensure server has session cookies when user is authenticated, so server actions see auth
  useEffect(() => {
    if (isAuthenticated) {
      ensureServerSession()
    }
  }, [isAuthenticated])

  // Client-side validation for UX (server validation is the source of truth)
  const canSubmit = useMemo(() => {
    const title = formData.title.trim()
    const tagline = formData.tagline.trim()
    const description = formData.description.trim()
    const demoUrl = formData.demoUrl.trim()

    const tagsTotal = selectedTechTags.length + selectedCategoryTags.length
    return (
      title.length > 0 && title.length <= 160 &&
      tagline.length > 0 && tagline.length <= 140 &&
      description.length > 0 && description.length <= 4000 &&
      demoUrl.length > 0 && /^https?:\/\//.test(demoUrl) &&
      selectedTechTags.length > 0 &&
      selectedCategoryTags.length > 0 &&
      tagsTotal <= 10
    )
  }, [formData, selectedTechTags, selectedCategoryTags])

  // Combobox variant handles filtering and alphabetical ordering internally

  // Show error toast when server action returns with formError
  useEffect(() => {
    if (state?.formError) {
      showToast(`Error: project fails to be created. ${state.formError}`, "error")
    }
    // Note: Success toast is handled by redirect to detail page with ?created=1
  }, [state])

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

  const SubmitButton = () => {
    const { pending } = useFormStatus()
    return (
      <Button type="submit" disabled={pending || pendingUpload || !canSubmit} className="flex-1">
        {pending ? "Creating Project..." : "Create Project"}
      </Button>
    )
  }

  const toggleTechTag = (tagId: number) => {
    setSelectedTechTags((prev: number[]) => {
      const total = (prev.includes(tagId) ? prev.filter((id: number) => id !== tagId).length : prev.length + 1) + selectedCategoryTags.length
      if (!prev.includes(tagId) && total > 10) return prev
      return prev.includes(tagId) ? prev.filter((id: number) => id !== tagId) : [...prev, tagId]
    })
  }

  const toggleCategoryTag = (tagId: number) => {
    setSelectedCategoryTags((prev: number[]) => {
      const total = selectedTechTags.length + (prev.includes(tagId) ? prev.filter((id: number) => id !== tagId).length : prev.length + 1)
      if (!prev.includes(tagId) && total > 10) return prev
      return prev.includes(tagId) ? prev.filter((id: number) => id !== tagId) : [...prev, tagId]
    })
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Post Your Project</h1>
        <p className="text-gray-600 mt-2">Share your amazing project with the community</p>
      </div>

      <form action={formAction} className="space-y-6">
        {/* ... form fields ... */}

        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Project Title *
          </label>
          <Input
            id="title"
            name="title"
            value={formData.title}
            onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="Enter your project title"
            error={errors.title}
            maxLength={160}
          />
          <p className="text-xs text-gray-500 mt-1">{formData.title.length}/160 characters</p>
        </div>

        <div>
          <label htmlFor="tagline" className="block text-sm font-medium text-gray-700 mb-2">
            Tagline *
          </label>
          <Input
            id="tagline"
            name="tagline"
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
            name="description"
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
            name="demoUrl"
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
            name="sourceUrl"
            value={formData.sourceUrl}
            onChange={(e) => setFormData((prev) => ({ ...prev, sourceUrl: e.target.value }))}
            placeholder="https://github.com/username/project"
            error={errors.sourceUrl}
          />
        </div>

        <TagMultiSelect
          label={`Technology * ${errors.techTags ? `(${errors.techTags})` : ""}`}
          options={technology}
          pinned={technology.filter((t) => ["Agents","LLM","Speech","Vibe Coding","Fine-tuning"].includes(t.name))}
          value={selectedTechTags}
          onChange={(next) => {
            // enforce per-facet cap in UI guardrail
            const allowed = next.slice(0, 5)
            setSelectedTechTags(allowed)
          }}
          max={5}
          placeholder="Add technology tag"
          variant="tech"
        />

        <TagMultiSelect
          label={`Category * ${errors.categoryTags ? `(${errors.categoryTags})` : ""}`}
          options={category}
          pinned={category.filter((t) => ["Productivity","Education/ Study tools","Content/Media","Research"].includes(t.name))}
          value={selectedCategoryTags}
          onChange={(next) => {
            const allowed = next.slice(0, 3)
            setSelectedCategoryTags(allowed)
          }}
          max={3}
          placeholder="Add category tag"
          variant="category"
        />

        {selectedTechTags.map((id) => (
          <input key={`tech-${id}`} type="hidden" name="techTagIds" value={id} />
        ))}
        {selectedCategoryTags.map((id) => (
          <input key={`cat-${id}`} type="hidden" name="categoryTagIds" value={id} />
        ))}

        {/* Logo uploader (Optional) — placed at bottom per spec */}
        <div className="pt-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Logo (Optional)</label>
          <LogoUploader
            entity="project"
            requestAction={requestNewProjectLogoUploadAction as any}
            onUploadedPath={(p) => setLogoPath(p)}
            preventReload
            variant="dropzone"
            onPendingChange={setPendingUpload}
          />
          {logoPath && <p className="text-xs text-gray-500 mt-1">Logo selected.</p>}
          {logoPath && <input type="hidden" name="logoPath" value={logoPath} />}
        </div>

        <div className="flex gap-4 pt-6">
          <SubmitButton />
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
