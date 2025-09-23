import Link from "next/link"

export default function NotFound() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold text-gray-900">Page not found</h1>
      <p className="mt-2 text-gray-600">
        The page you’re looking for doesn’t exist or may have been moved.
      </p>
      <div className="mt-6 flex items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Home
        </Link>
        <Link
          href="/report-problem"
          className="inline-flex items-center rounded-md bg-gray-100 px-4 py-2 text-gray-800 hover:bg-gray-200"
        >
          Report a problem
        </Link>
      </div>
    </div>
  )
}


