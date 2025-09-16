export const DISCLAIMER_ACK_KEY = "ext_disclaimer_ack"

export function isExternalUrl(href: string, base: string = typeof window !== "undefined" ? window.location.href : ""): boolean {
  try {
    const u = new URL(href, base || undefined)
    if (!base && typeof window === "undefined") return true
    const origin = (base ? new URL(base) : new URL(window.location.href)).origin
    return u.origin !== origin
  } catch {
    return false
  }
}

export function hasDisclaimerAck(storage: Storage = typeof window !== "undefined" ? window.localStorage : (undefined as any)): boolean {
  try {
    if (!storage) return false
    return storage.getItem(DISCLAIMER_ACK_KEY) === "1"
  } catch {
    return false
  }
}

export function setDisclaimerAck(storage: Storage = typeof window !== "undefined" ? window.localStorage : (undefined as any)) {
  try {
    if (!storage) return
    storage.setItem(DISCLAIMER_ACK_KEY, "1")
  } catch {
    // ignore
  }
}


