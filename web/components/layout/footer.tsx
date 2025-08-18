import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">BP</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Builder's Pub</span>
            </div>
            <p className="text-gray-600 max-w-md">
              A global hub to showcase AI/vibe-coded student projects. Discover, collaborate, and get inspired.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Platform</h3>
            <div className="space-y-2">
              <Link href="/projects" className="block text-gray-600 hover:text-gray-900">
                Projects
              </Link>
              <Link href="/collaborations" className="block text-gray-600 hover:text-gray-900">
                Collaborations
              </Link>
              <Link href="/search" className="block text-gray-600 hover:text-gray-900">
                Explore Tags
              </Link>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Community</h3>
            <div className="space-y-2">
              <Link href="/projects/new" className="block text-gray-600 hover:text-gray-900">
                Post Project
              </Link>
              <Link href="/collaborations/new" className="block text-gray-600 hover:text-gray-900">
                Find Collaborators
              </Link>
              <Link href="/profile" className="block text-gray-600 hover:text-gray-900">
                Profile
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 mt-8 pt-8 text-center text-gray-600">
          <p>&copy; 2024 Builder's Pub. Built with ❤️ for the developer community.</p>
        </div>
      </div>
    </footer>
  )
}
