"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useAuthMock } from "@/lib/api/mockAuth"
import { showToast } from "@/components/ui/toast"

export default function EditProfilePage() {
  const { isAuthenticated, user } = useAuthMock()
  const router = useRouter()

  const [formData, setFormData] = useState({
    displayName: user?.displayName || "",
    bio: user?.bio || "",
    githubUrl: user?.githubUrl || "",
    linkedinUrl: user?.linkedinUrl || "",
    websiteUrl: user?.websiteUrl || "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Sign In Required</h1>
        <p className="text-gray-600 mb-6">You need to sign in to edit your profile.</p>
        <Button onClick={() => router.push("/")}>Go Home</Button>
      </div>
    )
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.displayName.trim()) {
      newErrors.displayName = "Display name is required"
    } else if (formData.displayName.length > 80) {
      newErrors.displayName = "Display name must be 80 characters or less"
    }

    const urlPattern = /^https?:\/\/.+/

    if (formData.githubUrl && !urlPattern.test(formData.githubUrl)) {
      newErrors.githubUrl = "GitHub URL must be a valid HTTP/HTTPS URL"
    }

    if (formData.linkedinUrl && !urlPattern.test(formData.linkedinUrl)) {
      newErrors.linkedinUrl = "LinkedIn URL must be a valid HTTP/HTTPS URL"
    }

    if (formData.websiteUrl && !urlPattern.test(formData.websiteUrl)) {
      newErrors.websiteUrl = "Website URL must be a valid HTTP/HTTPS URL"
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
      // TODO: Replace with actual API call to update profile
      await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulate API call

      console.log("Updating profile:", formData)

      showToast("Profile updated successfully!", "success")
      router.push("/profile")
    } catch (error) {
      showToast("Failed to update profile. Please try again.", "error")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Edit Profile</h1>
        <p className="text-gray-600 mt-2">Update your profile information</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
            Display Name *
          </label>
          <Input
            id="displayName"
            value={formData.displayName}
            onChange={(e) => setFormData((prev) => ({ ...prev, displayName: e.target.value }))}
            placeholder="Your display name"
            error={errors.displayName}
            maxLength={80}
          />
          <p className="text-xs text-gray-500 mt-1">{formData.displayName.length}/80 characters</p>
        </div>

        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
            Bio
          </label>
          <Textarea
            id="bio"
            value={formData.bio}
            onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
            placeholder="Tell us about yourself..."
            rows={4}
            error={errors.bio}
          />
        </div>

        <div>
          <label htmlFor="githubUrl" className="block text-sm font-medium text-gray-700 mb-2">
            GitHub URL
          </label>
          <Input
            id="githubUrl"
            type="url"
            value={formData.githubUrl}
            onChange={(e) => setFormData((prev) => ({ ...prev, githubUrl: e.target.value }))}
            placeholder="https://github.com/username"
            error={errors.githubUrl}
          />
        </div>

        <div>
          <label htmlFor="linkedinUrl" className="block text-sm font-medium text-gray-700 mb-2">
            LinkedIn URL
          </label>
          <Input
            id="linkedinUrl"
            type="url"
            value={formData.linkedinUrl}
            onChange={(e) => setFormData((prev) => ({ ...prev, linkedinUrl: e.target.value }))}
            placeholder="https://linkedin.com/in/username"
            error={errors.linkedinUrl}
          />
        </div>

        <div>
          <label htmlFor="websiteUrl" className="block text-sm font-medium text-gray-700 mb-2">
            Website URL
          </label>
          <Input
            id="websiteUrl"
            type="url"
            value={formData.websiteUrl}
            onChange={(e) => setFormData((prev) => ({ ...prev, websiteUrl: e.target.value }))}
            placeholder="https://yourwebsite.com"
            error={errors.websiteUrl}
          />
        </div>

        <div className="flex gap-4 pt-6">
          <Button type="submit" disabled={isSubmitting} className="flex-1">
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
