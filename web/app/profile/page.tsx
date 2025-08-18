"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuthMock } from "@/lib/api/mockAuth"
import { useRouter } from "next/navigation"

export default function ProfilePage() {
  const { isAuthenticated, user } = useAuthMock()
  const router = useRouter()

  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Sign In Required</h1>
        <p className="text-gray-600 mb-6">You need to sign in to view your profile.</p>
        <Button onClick={() => router.push("/")}>Go Home</Button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Profile Header */}
        <div className="px-6 py-8 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-2xl font-bold">{user.displayName.charAt(0).toUpperCase()}</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{user.displayName}</h1>
                {user.bio && <p className="text-gray-600 mt-1">{user.bio}</p>}

                <div className="flex items-center space-x-4 mt-3">
                  {user.githubUrl && (
                    <a
                      href={user.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-gray-900"
                    >
                      GitHub
                    </a>
                  )}
                  {user.linkedinUrl && (
                    <a
                      href={user.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-gray-900"
                    >
                      LinkedIn
                    </a>
                  )}
                  {user.websiteUrl && (
                    <a
                      href={user.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-gray-900"
                    >
                      Website
                    </a>
                  )}
                </div>
              </div>
            </div>

            <Button asChild>
              <Link href="/profile/edit">Edit Profile</Link>
            </Button>
          </div>
        </div>

        {/* Profile Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Projects Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">My Projects</h2>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/projects/new">Add Project</Link>
                </Button>
              </div>

              <div className="space-y-4">
                {/* TODO: Replace with actual user projects */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">AI Code Review Assistant</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Automated code review using GPT-4 to catch bugs and suggest improvements
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <Badge variant="default">LLMs</Badge>
                      <Badge variant="secondary">DevTools</Badge>
                    </div>
                    <span className="text-sm text-gray-500">42 upvotes</span>
                  </div>
                </div>

                <div className="text-center py-8 text-gray-500">
                  <p>TODO: Load actual user projects from API</p>
                </div>
              </div>
            </div>

            {/* Collaborations Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">My Collaborations</h2>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/collaborations/new">Post Collaboration</Link>
                </Button>
              </div>

              <div className="space-y-4">
                {/* TODO: Replace with actual user collaborations */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">ongoing</Badge>
                    <h3 className="font-medium text-gray-900">AI-Powered Learning Platform</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Looking for frontend developers to help build an adaptive learning platform
                  </p>
                  <div className="flex gap-2">
                    <Badge variant="secondary">React</Badge>
                    <Badge variant="secondary">TypeScript</Badge>
                    <Badge variant="secondary">UI/UX Design</Badge>
                  </div>
                </div>

                <div className="text-center py-8 text-gray-500">
                  <p>TODO: Load actual user collaborations from API</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
