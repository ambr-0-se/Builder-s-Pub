import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Navbar } from "@/components/layout/navbar"
import { isAdmin } from "@/lib/server/admin"
import { Footer } from "@/components/layout/footer"
import { ToastContainer } from "@/components/ui/toast"
import { AnalyticsProvider } from "@/components/analytics/AnalyticsProvider"
import { ClientErrorReporter } from "@/components/analytics/ClientErrorReporter"
import { ExternalLinkDisclaimer } from "@/components/ExternalLinkDisclaimer"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Builder's Pub - Showcase Your AI Projects",
  description: "A global hub to showcase AI/vibe-coded student projects. Discover, collaborate, and get inspired.",
  keywords: "AI projects, student projects, collaboration, coding, development",
  openGraph: {
    title: "Builder's Pub - Showcase Your AI Projects",
    description: "A global hub to showcase AI/vibe-coded student projects. Discover, collaborate, and get inspired.",
    type: "website",
  },
    generator: 'v0.app'
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const admin = await isAdmin()
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <Navbar isAdmin={admin} />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
        <AnalyticsProvider />
        <ClientErrorReporter />
        <ExternalLinkDisclaimer />
        <ToastContainer />
      </body>
    </html>
  )
}
