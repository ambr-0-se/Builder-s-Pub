import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Projects - Builder's Pub",
  description: "Discover and filter AI/vibe-coded projects by technology and category.",
  openGraph: {
    title: "Projects - Builder's Pub",
    description: "Discover and filter AI/vibe-coded projects by technology and category.",
    type: "website",
  },
}

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  return children
}


