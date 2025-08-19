"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { UpdateProfileState } from "../actions"

interface EditFormProps {
  initial: { displayName: string; bio: string; githubUrl: string; linkedinUrl: string; websiteUrl: string }
  action: (formData: FormData) => Promise<UpdateProfileState>
}

export default function EditForm({ initial, action }: EditFormProps) {
  const wrapped = async (_prev: UpdateProfileState, formData: FormData) => action(formData)
  const [state, formAction] = useActionState(wrapped, null)
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Edit Profile</h1>
        <p className="text-gray-600 mt-2">Update your profile information</p>
      </div>

      <form action={formAction} className="space-y-6">
        <div>
          <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
            Display Name *
          </label>
          <Input
            id="displayName"
            name="displayName"
            defaultValue={initial.displayName}
            placeholder="Your display name"
            error={state?.fieldErrors?.displayName}
            maxLength={80}
          />
          <p className="text-xs text-gray-500 mt-1">Max 80 characters</p>
        </div>

        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
            Bio
          </label>
          <Textarea
            id="bio"
            name="bio"
            defaultValue={initial.bio}
            placeholder="Tell us about yourself..."
            rows={4}
            error={state?.fieldErrors?.bio}
          />
        </div>

        <div>
          <label htmlFor="githubUrl" className="block text-sm font-medium text-gray-700 mb-2">
            GitHub URL
          </label>
          <Input
            id="githubUrl"
            name="githubUrl"
            type="url"
            defaultValue={initial.githubUrl}
            placeholder="https://github.com/username"
            error={state?.fieldErrors?.githubUrl}
          />
        </div>

        <div>
          <label htmlFor="linkedinUrl" className="block text-sm font-medium text-gray-700 mb-2">
            LinkedIn URL
          </label>
          <Input
            id="linkedinUrl"
            name="linkedinUrl"
            type="url"
            defaultValue={initial.linkedinUrl}
            placeholder="https://linkedin.com/in/username"
            error={state?.fieldErrors?.linkedinUrl}
          />
        </div>

        <div>
          <label htmlFor="websiteUrl" className="block text-sm font-medium text-gray-700 mb-2">
            Website URL
          </label>
          <Input
            id="websiteUrl"
            name="websiteUrl"
            type="url"
            defaultValue={initial.websiteUrl}
            placeholder="https://yourwebsite.com"
            error={state?.fieldErrors?.websiteUrl}
          />
        </div>

        {state?.formError && (
          <p className="text-sm text-red-600" role="alert">
            {state.formError}
          </p>
        )}

        <div className="flex gap-4 pt-6">
          <SubmitButton />
          <Button type="button" variant="outline" onClick={() => (window.location.href = "/profile")}>Cancel</Button>
        </div>
      </form>
    </div>
  )
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className="flex-1">
      {pending ? "Saving..." : "Save Changes"}
    </Button>
  )
}


