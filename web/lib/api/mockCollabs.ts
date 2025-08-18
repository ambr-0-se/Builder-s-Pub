import type { Collaboration, ListCollabsParams } from "@/lib/types"

// Mock collaboration data
const MOCK_COLLABS: Collaboration[] = [
  {
    id: "collab-1",
    ownerId: "user-1",
    owner: {
      userId: "user-1",
      displayName: "Alex Chen",
      bio: "Full-stack developer",
    },
    kind: "ongoing",
    title: "AI-Powered Learning Platform",
    description:
      "Looking for frontend developers to help build an adaptive learning platform that personalizes content based on student progress.",
    skills: ["React", "TypeScript", "UI/UX Design"],
    region: "Remote",
    commitment: "Part-time (10-15 hours/week)",
    createdAt: new Date("2024-01-12"),
  },
  {
    id: "collab-2",
    ownerId: "user-2",
    owner: {
      userId: "user-2",
      displayName: "Sarah Kim",
      bio: "Student developer",
    },
    kind: "planned",
    title: "Open Source ML Library",
    description:
      "Planning to create a beginner-friendly machine learning library. Seeking contributors with Python and documentation skills.",
    skills: ["Python", "Machine Learning", "Documentation"],
    commitment: "Flexible",
    createdAt: new Date("2024-01-08"),
  },
]

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function createCollab(
  input: Omit<Collaboration, "id" | "createdAt" | "ownerId" | "owner">,
): Promise<{ id: string }> {
  await delay(1000)
  // TODO: Replace with Supabase API call
  const id = `collab-${Date.now()}`
  console.log("Creating collaboration:", { id, ...input })
  return { id }
}

export async function listCollabs(params: ListCollabsParams = {}): Promise<{
  items: Collaboration[]
  nextCursor?: string
}> {
  await delay(500)
  // TODO: Replace with Supabase API call

  let filtered = [...MOCK_COLLABS]

  if (params.kind) {
    filtered = filtered.filter((c) => c.kind === params.kind)
  }

  if (params.skills) {
    const skillsLower = params.skills.toLowerCase()
    filtered = filtered.filter((c) => c.skills.some((skill) => skill.toLowerCase().includes(skillsLower)))
  }

  const limit = params.limit || 20
  const items = filtered.slice(0, limit)

  return { items }
}

export async function getCollab(id: string): Promise<Collaboration | null> {
  await delay(300)
  // TODO: Replace with Supabase API call
  return MOCK_COLLABS.find((c) => c.id === id) || null
}

export async function updateCollab(id: string, fields: Partial<Collaboration>): Promise<{ ok: true }> {
  await delay(800)
  // TODO: Replace with Supabase API call
  console.log("Updating collaboration:", { id, fields })
  return { ok: true }
}

export async function deleteCollab(id: string): Promise<{ ok: true }> {
  await delay(500)
  // TODO: Replace with Supabase API call
  console.log("Deleting collaboration:", id)
  return { ok: true }
}
