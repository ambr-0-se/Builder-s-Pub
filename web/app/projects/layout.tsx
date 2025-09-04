import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Latest AI Applications & Student Projects | Builder’s Pub",
  description: "Explore trending AI projects built by students—LLMs, AI agents, NLP, and Computer Vision—with live demos and reviews.",
  openGraph: {
    title: "Latest AI Applications & Student Projects | Builder’s Pub",
    description: "Explore trending AI projects built by students—LLMs, AI agents, NLP, and Computer Vision—with live demos and reviews.",
    type: "website",
  },
}

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  return children
}


