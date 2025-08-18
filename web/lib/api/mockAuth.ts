import type { Profile } from "@/lib/types"

// Mock user data
const MOCK_USER: Profile = {
  userId: "user-1",
  displayName: "Alex Chen",
  bio: "Full-stack developer passionate about AI and web technologies",
  githubUrl: "https://github.com/alexchen",
  linkedinUrl: "https://linkedin.com/in/alexchen",
  websiteUrl: "https://alexchen.dev",
}

export function useAuthMock() {
  // TODO: Replace with Supabase auth
  const isAuthenticated = true // Mock as authenticated for demo
  const user = isAuthenticated ? MOCK_USER : null

  const signIn = async () => {
    // TODO: Implement Supabase sign in
    console.log("Sign in clicked - TODO: Implement Supabase auth")
  }

  const signOut = async () => {
    // TODO: Implement Supabase sign out
    console.log("Sign out clicked - TODO: Implement Supabase auth")
  }

  return {
    isAuthenticated,
    user,
    signIn,
    signOut,
  }
}
