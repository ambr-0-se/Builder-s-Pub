import { NextResponse } from "next/server"
import { listProjects } from "@/lib/server/projects"
import { listCollabs } from "@/lib/server/collabs"

export async function GET() {
  const base = "https://builders.pub"
  const urls: Array<{ loc: string; lastmod?: string; priority?: number }> = [
    { loc: `${base}/` },
    { loc: `${base}/projects` },
    { loc: `${base}/collaborations` },
    { loc: `${base}/search` },
  ]

  try {
    const [{ items: projects }, { items: collabs }] = await Promise.all([
      listProjects({ limit: 50, sort: "recent" }).catch(() => ({ items: [] as any[] })),
      listCollabs({ limit: 50 }).catch(() => ({ items: [] as any[] })),
    ])
    for (const p of projects) {
      urls.push({ loc: `${base}/projects/${p.project.id}`, lastmod: p.project.createdAt.toISOString(), priority: 0.8 })
    }
    for (const c of collabs) {
      const createdAt = (c.collaboration.createdAt as any)?.toISOString?.() || new Date(c.collaboration.createdAt as any).toISOString()
      urls.push({ loc: `${base}/collaborations/${c.collaboration.id}`, lastmod: createdAt, priority: 0.7 })
    }
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


