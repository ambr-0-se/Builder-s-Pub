export type ReportInput = {
  message: string
  context?: unknown
  url?: string
  userMessage?: string
}

export type SendReport = (input: ReportInput) => Promise<void> | void

export function signatureOf(input: ReportInput): string {
  const msg = (input.message || "").slice(0, 200)
  const url = input.url || ""
  return `${msg}@@${url}`
}

export function createThrottledSender(send: SendReport, windowMs = 30000) {
  const lastSentAt = new Map<string, number>()
  return async (input: ReportInput) => {
    const key = signatureOf(input)
    const now = Date.now()
    const last = lastSentAt.get(key)
    if (last && now - last < windowMs) return false
    lastSentAt.set(key, now)
    try {
      await send(input)
      return true
    } catch {
      return false
    }
  }
}

export function buildReportFromErrorEvent(ev: ErrorEvent): ReportInput {
  const message = ev?.error instanceof Error ? ev.error.stack || ev.error.message : ev?.message || "Unknown error"
  return {
    message,
    url: typeof window !== "undefined" ? window.location?.href : undefined,
    context: {
      kind: "error",
      filename: (ev as any).filename,
      lineno: (ev as any).lineno,
      colno: (ev as any).colno,
    },
  }
}

export function buildReportFromRejectionEvent(ev: PromiseRejectionEvent): ReportInput {
  const reason: any = (ev as any).reason
  const message = reason instanceof Error ? reason.stack || reason.message : String(reason ?? "Unknown rejection")
  return {
    message,
    url: typeof window !== "undefined" ? window.location?.href : undefined,
    context: {
      kind: "unhandledrejection",
    },
  }
}

import { createRing, type Crumb } from "@/lib/utils/ring"

export function installGlobalClientErrorReporter(options?: { endpoint?: string; track?: (name: string, props?: any) => void }) {
  const endpoint = options?.endpoint || "/api/errors/report"
  const track = options?.track
  const crumbs = createRing<Crumb>(30)

  const send: SendReport = async (input) => {
    try {
      const enriched = { ...input, context: { ...(input.context as any), breadcrumbs: crumbs.serialize(8_000) } }
      await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(enriched),
        keepalive: true,
      })
      track?.("client_error_reported", { url: input.url })
    } catch {
      // ignore
    }
  }

  const maybeSend = createThrottledSender(send, 30000)

  // Route changes
  const origPush = history.pushState
  const origReplace = history.replaceState
  history.pushState = function (s, t, u) {
    try {
      const href = u ? new URL(String(u), location.href).href : location.href
      crumbs.add({ ts: Date.now(), type: "route", href })
    } catch {}
    return origPush.apply(this, arguments as any)
  } as any
  history.replaceState = function (s, t, u) {
    try {
      const href = u ? new URL(String(u), location.href).href : location.href
      crumbs.add({ ts: Date.now(), type: "route", href })
    } catch {}
    return origReplace.apply(this, arguments as any)
  } as any
  window.addEventListener("popstate", () => {
    try {
      crumbs.add({ ts: Date.now(), type: "route", href: location.href })
    } catch {}
  })

  // Clicks on links (capture phase)
  let lastClickHref = ""
  let lastClickAt = 0
  document.addEventListener(
    "click",
    (e) => {
      const el = (e.target as Element | null)?.closest?.("a[href]")
      if (!el) return
      const a = el as HTMLAnchorElement
      const href = a.href
      const now = Date.now()
      if (href === lastClickHref && now - lastClickAt < 1000) return
      lastClickHref = href
      lastClickAt = now
      crumbs.add({ ts: now, type: "click", href, text: (a.textContent || "").trim().slice(0, 80) })
    },
    { capture: true }
  )

  function onError(ev: ErrorEvent) {
    void maybeSend(buildReportFromErrorEvent(ev))
  }

  function onRejection(ev: PromiseRejectionEvent) {
    void maybeSend(buildReportFromRejectionEvent(ev))
  }

  window.addEventListener("error", onError)
  window.addEventListener("unhandledrejection", onRejection)

  return () => {
    window.removeEventListener("error", onError)
    window.removeEventListener("unhandledrejection", onRejection)
  }
}


