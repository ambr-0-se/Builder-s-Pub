export interface Profile {
  userId: string
  displayName: string
  bio?: string
  githubUrl?: string
  linkedinUrl?: string
  websiteUrl?: string
  xUrl?: string
  region?: string
  timezone?: string
  skills?: string[]
  buildingNow?: string
  lookingFor?: string
  contact?: string
  avatarPath?: string
}

export interface Tag {
  id: number
  name: string
  type: "technology" | "category"
}

export interface Project {
  id: string
  ownerId: string
  title: string
  tagline: string
  description: string
  demoUrl: string
  sourceUrl?: string
  createdAt: Date
  softDeleted?: boolean
  logoPath?: string
  logoUrl?: string
}

export interface ProjectWithRelations {
  project: Project
  tags: {
    technology: Tag[]
    category: Tag[]
  }
  upvoteCount: number
  comments: Comment[]
  owner: Profile
  hasUserUpvoted?: boolean
}

export interface Comment {
  id: string
  projectId: string
  authorId: string
  author: Profile
  body: string
  createdAt: Date
  softDeleted?: boolean
  parentCommentId?: string | null
  upvoteCount?: number
  hasUserUpvoted?: boolean
  children?: Comment[]
}

export interface Collaboration {
  id: string
  ownerId: string
  owner: Profile
  kind: "ongoing" | "planned" | "individual" | "organization"
  title: string
  description: string
  skills: string[]
  region?: string
  commitment?: string
  createdAt: Date
  softDeleted?: boolean
}

export interface ListProjectsParams {
  cursor?: string
  limit?: number
  sort?: "recent" | "popular"
  q?: string
  techTagIds?: number[]
  categoryTagIds?: number[]
}

export interface ListCollabsParams {
  // Search keyword (case-insensitive substring over title/description; skills handled server-side if implemented)
  q?: string
  // Tag filters: OR within a type, AND across types. Ignore when empty/undefined
  techTagIds?: number[]
  categoryTagIds?: number[]
  // Additional filters (ignore when empty/undefined)
  stages?: string[]
  projectTypes?: string[]
  cursor?: string
  limit?: number
}

export interface SearchParams {
  q?: string
  tech?: string[]
  category?: string[]
}
