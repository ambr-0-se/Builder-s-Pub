import { Button } from "@/components/ui/button"
import EditForm from "./EditForm"
import { getMyProfile } from "../actions"

export default async function EditProfilePage() {
  const { profile, isAuthenticated } = await getMyProfile()

  if (!isAuthenticated || !profile) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Sign In Required</h1>
        <p className="text-gray-600 mb-6">You need to sign in to edit your profile.</p>
        <Button asChild>
          <a href="/">Go Home</a>
        </Button>
      </div>
    )
  }

  return (
    <EditForm
      initial={{
        displayName: profile.displayName || "",
        bio: profile.bio || "",
        githubUrl: profile.githubUrl || "",
        linkedinUrl: profile.linkedinUrl || "",
        websiteUrl: profile.websiteUrl || "",
      }}
    />
  )
}

// Note: client form moved to separate file: ./EditForm ("use client")
