"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { useAuth, ensureServerSession } from "@/lib/api/auth"
import { useTags } from "@/hooks/useTags"
import { createCollabAction, type CreateCollabState } from "@/app/collaborations/actions"
import { COLLAB_KIND_OPTIONS, PROJECT_TYPE_OPTIONS, STAGE_OPTIONS } from "@/lib/collabs/options"
import { TagMultiSelect } from "@/components/ui/tag-multiselect"
import { showToast } from "@/components/ui/toast"
import { LogoUploader } from "@/components/ui/logo-uploader"
import { requestNewCollabLogoUploadAction } from "@/app/collaborations/actions"

export default function NewCollaborationPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const { technology, category } = useTags()

  const [state, formAction] = useActionState<CreateCollabState, FormData>(createCollabAction, null)

  const [formData, setFormData] = useState({
    title: "",
    affiliatedOrg: "",
    kind: COLLAB_KIND_OPTIONS[0].value as (typeof COLLAB_KIND_OPTIONS)[number]["value"],
    projectTypes: [PROJECT_TYPE_OPTIONS[0].value] as (typeof PROJECT_TYPE_OPTIONS)[number]["value"][],
    description: "",
    stage: "mvp_development" as (typeof STAGE_OPTIONS)[number]["value"],
    contact: "",
    remarks: "",
  })

  const [logoPath, setLogoPath] = useState<string>("")
  const [pendingUpload, setPendingUpload] = useState<boolean>(false)

  const [lookingFor, setLookingFor] = useState<Array<{ role: string; amount?: number; prerequisite: string; goodToHave: string; description: string }>>([
    { role: "", amount: 1, prerequisite: "", goodToHave: "", description: "" },
  ])
  const [selectedTechTags, setSelectedTechTags] = useState<number[]>([])
  const [selectedCategoryTags, setSelectedCategoryTags] = useState<number[]>([])
  // filters handled within TagMultiSelect

  const errors = state?.fieldErrors || {}

  useEffect(() => {
    if (isAuthenticated) {
      ensureServerSession()
    }
  }, [isAuthenticated])

  // Show error toast when server action returns with formError (e.g., daily rate limit reached)
  useEffect(() => {
    if (state?.formError) {
      showToast(state.formError, "error")
    }
  }, [state])

  const canSubmit = useMemo(() => {
    const title = formData.title.trim()
    const description = formData.description.trim()
    const contact = formData.contact.trim()
    const roles = lookingFor.filter((r) => r.role.trim().length > 0)
    const tagsTotal = selectedTechTags.length + selectedCategoryTags.length
    return (
      title.length > 0 &&
      title.length <= 160 &&
      description.length > 0 &&
      description.length <= 4000 &&
      contact.length > 0 &&
      selectedTechTags.length > 0 &&
      selectedCategoryTags.length > 0 &&
      tagsTotal <= 10 &&
      roles.length >= 1 &&
      roles.length <= 5
    )
  }, [formData, selectedTechTags, selectedCategoryTags, lookingFor])

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Sign In Required</h1>
        <p className="text-gray-600 mb-6">You need to sign in to post a collaboration.</p>
        <Button onClick={() => router.push("/")}>Go Home</Button>
      </div>
    )
  }

  const SubmitButton = () => {
    const { pending } = useFormStatus()
    return (
      <Button type="submit" disabled={pending || pendingUpload || !canSubmit} className="flex-1">
        {pending ? "Posting..." : "Post Collaboration"}
      </Button>
    )
  }

  const addRole = () => {
    if (lookingFor.length >= 5) return
    setLookingFor((prev) => [...prev, { role: "", amount: 1, prerequisite: "", goodToHave: "", description: "" }])
  }
  const removeRole = (idx: number) => {
    setLookingFor((prev) => prev.filter((_, i) => i !== idx))
  }
  const updateRole = (idx: number, field: keyof (typeof lookingFor)[number], value: string | number) => {
    setLookingFor((prev) => prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)))
  }
  const toggleTechTag = (id: number) =>
    setSelectedTechTags((prev) => {
      const total = (prev.includes(id) ? prev.filter((x) => x !== id).length : prev.length + 1) + selectedCategoryTags.length
      if (!prev.includes(id) && total > 10) return prev
      return prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    })
  const toggleCategoryTag = (id: number) =>
    setSelectedCategoryTags((prev) => {
      const total = selectedTechTags.length + (prev.includes(id) ? prev.filter((x) => x !== id).length : prev.length + 1)
      if (!prev.includes(id) && total > 10) return prev
      return prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    })

  // handled internally by TagMultiSelect

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Post Collaboration</h1>
        <p className="text-gray-600 mt-2">Find collaborators for your next project</p>
      </div>

      <form action={formAction} className="space-y-6">
        {/* ... rest of fields ... */}

        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Title *
          </label>
          <Input
            id="title"
            name="title"
            value={formData.title}
            onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
            placeholder="Enter collaboration title"
            error={errors.title}
            maxLength={160}
          />
          <p className="text-xs text-gray-500 mt-1">{formData.title.length}/160 characters</p>
        </div>

        {/* Affiliated Org moved below Stage in the new order; Board Type removed */}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Project Types *
          </label>
          <div className="flex flex-wrap gap-2">
            {PROJECT_TYPE_OPTIONS.map((o) => {
              const selected = formData.projectTypes.includes(o.value)
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setFormData((p) => ({ ...p, projectTypes: selected ? p.projectTypes.filter((v) => v !== o.value) : [...p.projectTypes, o.value] }))}
                  className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium transition-colors ${selected ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"}`}
                  aria-pressed={selected}
                >
                  {o.label}
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <label htmlFor="stage" className="block text-sm font-medium text-gray-700 mb-2">
            Stage *
          </label>
          <Select id="stage" name="stage" value={formData.stage} onChange={(e) => setFormData((p) => ({ ...p, stage: e.target.value as any }))}>
            {STAGE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Select>
        </div>

        <div>
          <label htmlFor="affiliatedOrg" className="block text-sm font-medium text-gray-700 mb-2">
            Affiliated Organisation (Optional)
          </label>
          <Input
            id="affiliatedOrg"
            name="affiliatedOrg"
            value={formData.affiliatedOrg}
            onChange={(e) => setFormData((p) => ({ ...p, affiliatedOrg: e.target.value }))}
            placeholder="e.g. Student Club, Company, University"
            error={errors.affiliatedOrg}
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Project Description *
          </label>
          <Textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
            placeholder="Describe your collaboration opportunity, what you're building, and what help you need"
            rows={6}
            error={errors.description}
            maxLength={4000}
          />
          <p className="text-xs text-gray-500 mt-1">{formData.description.length}/4000 characters</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Roles Hiring *
          </label>
          <div className="space-y-4">
            {lookingFor.map((row, idx) => (
              <div key={idx} className="border rounded-md p-4">
                {/* Header row: Role + Amount */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                  <div className="md:col-span-3">
                    <Input
                      id={`lf_role_${idx}`}
                      name="lf_role"
                      placeholder="Role (e.g., Frontend Engineer)"
                      value={row.role}
                      onChange={(e) => updateRole(idx, "role", e.target.value)}
                      error={errors.lookingFor}
                    />
                  </div>
                  <Input
                    id={`lf_amount_${idx}`}
                    name="lf_amount"
                    type="number"
                    min={1}
                    max={99}
                    placeholder="Amount"
                    value={row.amount ?? 1}
                    onChange={(e) => updateRole(idx, "amount", Number(e.target.value || 1))}
                  />
                </div>

                {/* Right-indented details block */}
                <div className="md:pl-4 md:ml-2 md:border-l md:border-gray-200 grid grid-cols-1 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-medium text-gray-700">Prerequisite</label>
                      <span className="text-[10px] text-gray-500">{(row.prerequisite?.length || 0)}/400</span>
                    </div>
                    <Textarea
                      id={`lf_prereq_${idx}`}
                      name="lf_prerequisite"
                      value={row.prerequisite}
                      onChange={(e) => updateRole(idx, "prerequisite", e.target.value)}
                      placeholder="Skills, experience, location, time zone, etc."
                      rows={3}
                      maxLength={400}
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-medium text-gray-700">Good to have</label>
                      <span className="text-[10px] text-gray-500">{(row.goodToHave?.length || 0)}/400</span>
                    </div>
                    <Textarea
                      id={`lf_good_${idx}`}
                      name="lf_goodToHave"
                      value={row.goodToHave}
                      onChange={(e) => updateRole(idx, "goodToHave", e.target.value)}
                      placeholder="Nice-to-have skills or experience"
                      rows={3}
                      maxLength={400}
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-medium text-gray-700">Description</label>
                      <span className="text-[10px] text-gray-500">{(row.description?.length || 0)}/1200</span>
                    </div>
                    <Textarea
                      id={`lf_desc_${idx}`}
                      name="lf_description"
                      value={row.description}
                      onChange={(e) => updateRole(idx, "description", e.target.value)}
                      placeholder="What this role will do; responsibilities and scope"
                      rows={6}
                      maxLength={1200}
                    />
                  </div>
                </div>

                <div className="flex justify-end mt-3">
                  {lookingFor.length > 1 && (
                    <Button type="button" variant="outline" onClick={() => removeRole(idx)}>Remove</Button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="pt-2">
            <Button type="button" variant="secondary" onClick={addRole} disabled={lookingFor.length >= 5}>Add role</Button>
          </div>
        </div>

        <div>
          <label htmlFor="contact" className="block text-sm font-medium text-gray-700 mb-2">
            Contact *
          </label>
          <Input id="contact" name="contact" value={formData.contact} onChange={(e) => setFormData((p) => ({ ...p, contact: e.target.value }))} placeholder="Email, Discord, Telegram, etc." error={errors.contact} />
        </div>

        <div>
          <label htmlFor="remarks" className="block text-sm font-medium text-gray-700 mb-2">
            Remarks (Optional)
          </label>
          <Input id="remarks" name="remarks" value={formData.remarks} onChange={(e) => setFormData((p) => ({ ...p, remarks: e.target.value }))} placeholder="URL, Time Commitment, Additional Info" />
        </div>

        <TagMultiSelect
          label={`Technology * ${errors.techTagIds ? `(${errors.techTagIds})` : ""}`}
          options={technology}
          pinned={technology.filter((t) => ["Agents","LLM","Speech","Vibe Coding","Fine-tuning"].includes(t.name))}
          value={selectedTechTags}
          onChange={(next) => {
            const allowed = next.slice(0, 5)
            setSelectedTechTags(allowed)
          }}
          max={5}
          placeholder="Add technology tag"
          variant="tech"
        />

        <TagMultiSelect
          label={`Category * ${errors.categoryTagIds ? `(${errors.categoryTagIds})` : ""}`}
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

        {formData.projectTypes.map((v) => (
          <input key={`ptype-${v}`} type="hidden" name="projectTypes" value={v} />
        ))}
        {selectedTechTags.map((id) => (
          <input key={`tech-${id}`} type="hidden" name="techTagIds" value={id} />
        ))}
        {selectedCategoryTags.map((id) => (
          <input key={`cat-${id}`} type="hidden" name="categoryTagIds" value={id} />
        ))}

        {/* Logo uploader (Optional) — placed at bottom per spec */}
        <div className="pt-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Logo (Optional)</label>
          <LogoUploader entity="collab" requestAction={requestNewCollabLogoUploadAction as any} onUploadedPath={(p) => setLogoPath(p)} preventReload variant="dropzone" onPendingChange={setPendingUpload} />
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

      {state?.formError && (
        <p className="text-red-600 text-sm mt-4">{state.formError}</p>
      )}
    </div>
  )
}
