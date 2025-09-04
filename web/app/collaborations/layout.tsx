import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Team Matching: Find AI Project Collaborators | Builder’s Pub",
  description: "Join student teams or form your own to ship AI apps. Browse opportunities by category, role, and stage.",
  openGraph: {
    title: "Team Matching: Find AI Project Collaborators | Builder’s Pub",
    description: "Join student teams or form your own to ship AI apps. Browse opportunities by category, role, and stage.",
    type: "website",
  },
}

export default function CollaborationsLayout({ children }: { children: React.ReactNode }) {
  return children
}


