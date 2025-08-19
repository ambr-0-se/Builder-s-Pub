"use client"

import type React from "react"

import Link from "next/link"
import { useState } from "react"
import { useAuth } from "@/lib/api/auth"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function Navbar() {
  const { isAuthenticated, user, signIn, signOut } = useAuth()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">BP</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Builder's Pub</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <form onSubmit={handleSearch} className="flex items-center">
              <Input
                type="search"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64"
              />
            </form>

            <Link href="/projects" className="text-gray-700 hover:text-gray-900 font-medium">
              Projects
            </Link>
            <Link href="/collaborations" className="text-gray-700 hover:text-gray-900 font-medium">
              Collaborations
            </Link>
            <Link href="/search" className="text-gray-700 hover:text-gray-900 font-medium">
              Tags
            </Link>

            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <Link href="/profile" className="text-gray-700 hover:text-gray-900">
                  {user?.displayName}
                </Link>
                <Button variant="outline" size="sm" onClick={signOut}>
                  Sign Out
                </Button>
              </div>
            ) : (
              <Button onClick={() => router.push("/auth/sign-in")}>Sign In</Button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button variant="ghost" size="sm" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="space-y-4">
              <form onSubmit={handleSearch}>
                <Input
                  type="search"
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </form>

              <Link href="/projects" className="block text-gray-700 hover:text-gray-900 font-medium">
                Projects
              </Link>
              <Link href="/collaborations" className="block text-gray-700 hover:text-gray-900 font-medium">
                Collaborations
              </Link>
              <Link href="/search" className="block text-gray-700 hover:text-gray-900 font-medium">
                Tags
              </Link>

              {isAuthenticated ? (
                <div className="space-y-2">
                  <Link href="/profile" className="block text-gray-700 hover:text-gray-900">
                    {user?.displayName}
                  </Link>
                  <Button variant="outline" size="sm" onClick={signOut} className="w-full bg-transparent">
                    Sign Out
                  </Button>
                </div>
              ) : (
                <Button onClick={() => router.push("/auth/sign-in")} className="w-full">
                  Sign In
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
