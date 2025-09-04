import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Collaborations - Builder's Pub",
  description: "Find collaborators and join exciting AI/vibe-coded projects.",
  openGraph: {
    title: "Collaborations - Builder's Pub",
    description: "Find collaborators and join exciting AI/vibe-coded projects.",
    type: "website",
  },
}

export default function CollaborationsLayout({ children }: { children: React.ReactNode }) {
  return children
}


