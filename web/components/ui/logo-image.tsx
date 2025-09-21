import React from "react"
import Image from "next/image"

type Rounded = "none" | "sm" | "md" | "lg" | "full"

interface LogoImageProps {
  src?: string | null
  alt: string
  size: number
  rounded?: Rounded
  fallback?: string
  priority?: boolean
  className?: string
}

export function LogoImage({
  src,
  alt,
  size,
  rounded = "md",
  fallback = "/placeholder-logo.svg",
  priority,
  className = "",
}: LogoImageProps) {
  const hasSrc = (src || "").trim().length > 0
  const effective = hasSrc ? (src as string) : fallback
  const roundedClass =
    rounded === "full"
      ? "rounded-full"
      : rounded === "lg"
      ? "rounded-lg"
      : rounded === "sm"
      ? "rounded-sm"
      : rounded === "none"
      ? ""
      : "rounded-md"

  // Monogram fallback (gradient background + initials) when no src
  const hash = Array.from(alt).reduce((a, c) => ((a << 5) - a + c.charCodeAt(0)) | 0, 0)
  const gradients = [
    ["from-indigo-500", "to-sky-400"],
    ["from-emerald-500", "to-lime-400"],
    ["from-rose-500", "to-orange-400"],
    ["from-violet-500", "to-fuchsia-400"],
    ["from-amber-500", "to-pink-500"],
  ]
  const gradient = gradients[Math.abs(hash) % gradients.length].join(" ")
  const initials = alt
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("") || "?"

  return (
    <div
      className={`shrink-0 overflow-hidden ${roundedClass} border border-gray-200 bg-white ${className}`}
      style={{ width: size, height: size }}
      aria-hidden={false}
    >
      {hasSrc ? (
        <Image
          src={effective}
          alt={alt}
          width={size}
          height={size}
          className="h-full w-full object-cover object-center"
          priority={priority}
        />
      ) : (
        <div className={`h-full w-full flex items-center justify-center text-white text-sm font-semibold bg-gradient-to-br ${gradient}`}>
          {initials}
        </div>
      )}
    </div>
  )
}


