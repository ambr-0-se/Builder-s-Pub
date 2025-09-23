"use client"

import React from "react"

export function Contact({ value }: { value: string }) {
  const v = (value || "").trim()
  if (!v) return <span className="text-gray-500">Not provided</span>
  const isUrl = /^https?:\/\//i.test(v)
  const isEmail = /@/.test(v) && !v.includes(" ")
  if (isUrl) {
    return (
      <a href={v} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
        {v}
      </a>
    )
  }
  if (isEmail) {
    return (
      <a href={`mailto:${v}`} className="text-blue-600 hover:underline break-all">
        {v}
      </a>
    )
  }
  return <span className="text-gray-700 break-all">{v}</span>
}

export default Contact


