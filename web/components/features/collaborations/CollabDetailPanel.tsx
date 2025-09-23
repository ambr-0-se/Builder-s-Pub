"use client"

import React from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { LogoImage } from "@/components/ui/logo-image"
import type { CollaborationWithRelations } from "@/lib/server/collabs"
import { formatProjectType } from "@/lib/collabs/options"
import Contact from "@/components/features/collaborations/Contact"

export interface CollabDetailPanelProps {
  item: CollaborationWithRelations
}

export function CollabDetailPanel({ item }: CollabDetailPanelProps) {
  const logoSrc = (item.collaboration as any).logoUrl || ""
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 overflow-auto max-h-[calc(100vh-280px)]">
      <div className="flex items-start gap-3 mb-3">
        <LogoImage src={logoSrc} alt={item.collaboration.title} size={48} />
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{item.collaboration.title}</h2>
          <div className="text-sm text-gray-500">by {item.owner.displayName}</div>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        {Array.isArray((item.collaboration as any).projectTypes) && (item.collaboration as any).projectTypes.map((pt: string, i: number) => (
          <Badge key={`pt-${i}`} variant="outline" className="capitalize">{formatProjectType(pt as any)}</Badge>
        ))}
        <Badge variant={item.collaboration.isHiring === false ? "outline" : undefined} className={item.collaboration.isHiring === false ? "bg-white text-gray-800 border border-gray-300" : "bg-black text-white border border-black"}>
          {item.collaboration.isHiring === false ? "No longer hiring" : "Hiring"}
        </Badge>
      </div>

      <p className="text-gray-700 mb-3 whitespace-pre-wrap mt-4 leading-relaxed">{item.collaboration.description}</p>

      {item.collaboration.affiliatedOrg && (
        <div className="mt-3 text-sm">
          <span className="font-medium text-gray-700">Affiliated Organisation: </span>
          <span className="text-gray-600">{item.collaboration.affiliatedOrg}</span>
        </div>
      )}

      {item.collaboration.stage && (
        <div className="mt-1 text-sm">
          <span className="font-medium text-gray-700">Stage: </span>
          <span className="text-gray-600">{String(item.collaboration.stage)}</span>
        </div>
      )}

      {item.collaboration.lookingFor?.length > 0 && (
        <div className="mt-4">
          <h3 className="text-base font-semibold text-gray-900 mb-2">Roles</h3>
          <div className="flex flex-wrap gap-2">
            {item.collaboration.lookingFor.map((r: any, idx: number) => (
              <Badge key={idx} variant="secondary">{r.role}</Badge>
            ))}
          </div>
        </div>
      )}

      {(item.tags.technology.length > 0 || item.tags.category.length > 0) && (
        <div className="mt-4">
          <h3 className="text-base font-semibold text-gray-900 mb-2">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {item.tags.technology.map((t) => (
              <Badge key={`t-${t.id}`} variant="default" className="text-xs">{t.name}</Badge>
            ))}
            {item.tags.category.map((t) => (
              <Badge key={`c-${t.id}`} variant="outline" className="text-xs">{t.name}</Badge>
            ))}
          </div>
        </div>
      )}

      {item.collaboration.remarks && (
        <div className="mt-4">
          <h3 className="text-base font-semibold text-gray-900 mb-2">Remarks</h3>
          <div className="text-gray-700 whitespace-pre-wrap">{item.collaboration.remarks}</div>
        </div>
      )}

      <div className="mt-4">
        <h3 className="text-base font-semibold text-gray-900 mb-2">Contact</h3>
        <Contact value={item.collaboration.contact} />
      </div>

      <div className="mt-6">
        <Link href={`/collaborations/${item.collaboration.id}`} className="text-blue-600 hover:underline">Open full page →</Link>
      </div>
    </div>
  )
}

export default CollabDetailPanel
