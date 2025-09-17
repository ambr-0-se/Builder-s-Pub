"use client"

import { useActionState } from "react"
import { useState, useMemo } from "react"
import { createTag, type CreateTagState } from "./actions"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { normalizeTagName } from "@/lib/validation/tags"

const initialState: CreateTagState = null

export function AdminCreateTagForm() {
  const [state, formAction] = useActionState(createTag, initialState)
  const [name, setName] = useState("")
  const normalized = useMemo(() => normalizeTagName(name), [name])
  return (
    <form action={formAction} className="space-y-4 max-w-md">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
        <Input name="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., LLMs" error={state?.fieldErrors?.name} />
        {name && normalized !== name && (
          <p className="text-xs text-gray-500 mt-1">Normalized: "{normalized}"</p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
        <Select name="type" error={state?.fieldErrors?.type} defaultValue="">
          <option value="" disabled>
            Select type
          </option>
          <option value="technology">Technology</option>
          <option value="category">Category</option>
        </Select>
      </div>
      {state?.formError && <p className="text-sm text-red-600">{state.formError}</p>}
      {state?.success && <p className="text-sm text-green-600">Tag created.</p>}
      <Button type="submit">Create Tag</Button>
    </form>
  )
}
