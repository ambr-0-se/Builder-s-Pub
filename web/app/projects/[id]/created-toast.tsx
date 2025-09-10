"use client"

import { useEffect, useRef } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { showToast } from "@/components/ui/toast"
import { handleCreatedFlag } from "@/lib/created-flag"
import { useAnalytics } from "@/lib/analytics"

export function CreatedToastOnce() {
	const router = useRouter()
	const pathname = usePathname()
	const params = useSearchParams()
	const { track } = useAnalytics()
	const hasRunRef = useRef(false)

	useEffect(() => {
		// Prevent multiple executions in React strict mode or re-renders
		if (hasRunRef.current) return
		
		if (params.get("created") === "1") {
			hasRunRef.current = true
			handleCreatedFlag(params, pathname, router.replace, showToast, track)
		}
	}, [params, pathname, router, track])

	return null
}
