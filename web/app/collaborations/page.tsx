import CollaborationsClient from "./CollaborationsClient"
import { Suspense } from "react"

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default function CollaborationsPage() {
  return (
    <Suspense>
      <CollaborationsClient />
    </Suspense>
  )
}
