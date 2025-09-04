import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Search AI Projects & Opportunities | Builder’s Pub",
  description: "Find the latest AI projects and teams seeking collaborators. Filter by LLMs, AI agents, Computer Vision, startups, productivity, and research.",
  openGraph: {
    title: "Search AI Projects & Opportunities | Builder’s Pub",
    description: "Find the latest AI projects and teams seeking collaborators. Filter by LLMs, AI agents, Computer Vision, startups, productivity, and research.",
    type: "website",
  },
}

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children
}


