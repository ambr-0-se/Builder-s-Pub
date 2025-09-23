import CollaborationsClient from "./CollaborationsClient"

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default function CollaborationsPage() {
  return <CollaborationsClient />
}
