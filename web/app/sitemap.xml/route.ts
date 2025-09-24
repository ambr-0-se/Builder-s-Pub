import { NextResponse } from "next/server"
import { listProjects } from "@/lib/server/projects"
// Stage 17: Collaborations are auth-only. Exclude collaboration pages from public sitemap.

export async function GET() {
  const base = "https://builders.pub"
  const urls: Array<{ loc: string; lastmod?: string; priority?: number }> = [
    { loc: `${base}/` },
    { loc: `${base}/projects` },
    { loc: `${base}/search` },
  ]

  try {
    const { items: projects } = await listProjects({ limit: 50, sort: "recent" }).catch(() => ({ items: [] as any[] }))
    for (const p of projects) {
      urls.push({ loc: `${base}/projects/${p.project.id}`, lastmod: p.project.createdAt.toISOString(), priority: 0.8 })
    }
    // Note: collaboration pages are intentionally excluded from sitemap
  } catch {}

  const body = `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">` +
    urls.map((u) => {
      return `\n  <url>\n    <loc>${u.loc}</loc>` +
        (u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : "") +
        (u.priority ? `\n    <priority>${u.priority.toFixed(1)}</priority>` : "") +
        `\n  </url>`
    }).join("") +
    `\n</urlset>`

  return new NextResponse(body, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  })
}


