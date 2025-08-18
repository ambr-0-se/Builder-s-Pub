import type { Project, ProjectWithRelations, ListProjectsParams } from "@/lib/types"
import { TECHNOLOGY_TAGS, CATEGORY_TAGS } from "@/constants/tags"

// Mock data
const MOCK_PROJECTS: ProjectWithRelations[] = [
  {
    project: {
      id: "project-1",
      ownerId: "user-1",
      title: "AI Code Review Assistant",
      tagline: "Automated code review using GPT-4 to catch bugs and suggest improvements",
      description:
        "A comprehensive AI-powered code review tool that integrates with GitHub to automatically analyze pull requests, identify potential issues, and suggest improvements. Built with Next.js and OpenAI API.",
      demoUrl: "https://demo.example.com",
      sourceUrl: "https://github.com/user/ai-code-review",
      createdAt: new Date("2024-01-15"),
    },
    tags: {
      technology: [TECHNOLOGY_TAGS[0], TECHNOLOGY_TAGS[7]], // LLMs, Next.js
      category: [CATEGORY_TAGS[5]], // DevTools
    },
    upvoteCount: 42,
    comments: [],
    owner: {
      userId: "user-1",
      displayName: "Alex Chen",
      bio: "Full-stack developer",
    },
    hasUserUpvoted: false,
  },
  {
    project: {
      id: "project-2",
      ownerId: "user-2",
      title: "Smart Study Planner",
      tagline: "AI-powered study schedule optimizer for students",
      description:
        "An intelligent study planning application that uses machine learning to optimize study schedules based on learning patterns, deadlines, and personal preferences.",
      demoUrl: "https://study-planner.vercel.app",
      sourceUrl: "https://github.com/user2/study-planner",
      createdAt: new Date("2024-01-10"),
    },
    tags: {
      technology: [TECHNOLOGY_TAGS[0], TECHNOLOGY_TAGS[6]], // LLMs, React
      category: [CATEGORY_TAGS[1]], // Education
    },
    upvoteCount: 28,
    comments: [],
    owner: {
      userId: "user-2",
      displayName: "Sarah Kim",
      bio: "Student developer",
    },
    hasUserUpvoted: true,
  },
  {
    project: {
      id: "project-3",
      ownerId: "user-3",
      title: "Voice-Controlled Task Manager",
      tagline: "Manage your tasks using natural voice commands",
      description:
        "A productivity app that allows users to create, update, and manage tasks using voice commands. Features speech recognition and natural language processing.",
      demoUrl: "https://voice-tasks.netlify.app",
      createdAt: new Date("2024-01-05"),
    },
    tags: {
      technology: [TECHNOLOGY_TAGS[1], TECHNOLOGY_TAGS[4]], // NLP, Audio
      category: [CATEGORY_TAGS[0]], // Productivity
    },
    upvoteCount: 35,
    comments: [],
    owner: {
      userId: "user-3",
      displayName: "Mike Johnson",
      bio: "AI enthusiast",
    },
    hasUserUpvoted: false,
  },
]

// Simulate API latency
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function createProject(input: Omit<Project, "id" | "createdAt" | "ownerId">): Promise<{ id: string }> {
  await delay(1000)
  // TODO: Replace with Supabase API call
  const id = `project-${Date.now()}`
  console.log("Creating project:", { id, ...input })
  return { id }
}

export async function listProjects(params: ListProjectsParams = {}): Promise<{
  items: ProjectWithRelations[]
  nextCursor?: string
}> {
  await delay(500)
  // TODO: Replace with Supabase API call

  let filtered = [...MOCK_PROJECTS]

  // Apply filters
  if (params.techTagIds?.length) {
    filtered = filtered.filter((p) => p.tags.technology.some((tag) => params.techTagIds!.includes(tag.id)))
  }

  if (params.categoryTagIds?.length) {
    filtered = filtered.filter((p) => p.tags.category.some((tag) => params.categoryTagIds!.includes(tag.id)))
  }

  // Apply sorting
  if (params.sort === "popular") {
    filtered.sort((a, b) => b.upvoteCount - a.upvoteCount)
  } else {
    filtered.sort((a, b) => b.project.createdAt.getTime() - a.project.createdAt.getTime())
  }

  const limit = params.limit || 20
  const items = filtered.slice(0, limit)

  return { items }
}

export async function getProject(id: string): Promise<ProjectWithRelations | null> {
  await delay(300)
  // TODO: Replace with Supabase API call
  return MOCK_PROJECTS.find((p) => p.project.id === id) || null
}

export async function upvoteProject(projectId: string): Promise<{ ok: true } | { error: "conflict" | "unauthorized" }> {
  await delay(200)
  // TODO: Replace with Supabase API call
  console.log("Upvoting project:", projectId)
  return { ok: true }
}

export async function addComment(projectId: string, body: string): Promise<{ id: string }> {
  await delay(500)
  // TODO: Replace with Supabase API call
  const id = `comment-${Date.now()}`
  console.log("Adding comment:", { id, projectId, body })
  return { id }
}

export async function deleteComment(commentId: string): Promise<{ ok: true }> {
  await delay(300)
  // TODO: Replace with Supabase API call
  console.log("Deleting comment:", commentId)
  return { ok: true }
}

export async function updateProject(id: string, fields: Partial<Project>): Promise<{ ok: true }> {
  await delay(800)
  // TODO: Replace with Supabase API call
  console.log("Updating project:", { id, fields })
  return { ok: true }
}

export async function deleteProject(id: string): Promise<{ ok: true }> {
  await delay(500)
  // TODO: Replace with Supabase API call
  console.log("Deleting project:", id)
  return { ok: true }
}
