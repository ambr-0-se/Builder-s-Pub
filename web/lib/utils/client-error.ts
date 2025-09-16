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

export function installGlobalClientErrorReporter(options?: { endpoint?: string; track?: (name: string, props?: any) => void }) {
  const endpoint = options?.endpoint || "/api/errors/report"
  const track = options?.track

  const send: SendReport = async (input) => {
    try {
      await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
        keepalive: true,
      })
      track?.("client_error_reported", { url: input.url })
    } catch {
      // ignore
    }
  }

  const maybeSend = createThrottledSender(send, 30000)

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


