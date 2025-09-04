import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Search - Builder's Pub",
  description: "Search projects and collaborations by keyword, tags, stages, and types.",
  openGraph: {
    title: "Search - Builder's Pub",
    description: "Search projects and collaborations by keyword, tags, stages, and types.",
    type: "website",
  },
}

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children
}


