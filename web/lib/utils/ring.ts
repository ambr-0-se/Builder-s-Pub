export interface Crumb {
  ts: number
  type: "route" | "click"
  href?: string
  text?: string
}

export function createRing<T>(capacity = 30) {
  const buf = new Array<T>(capacity)
  let head = 0
  let size = 0
  return {
    add(v: T) {
      buf[head] = v
      head = (head + 1) % capacity
      size = Math.min(size + 1, capacity)
    },
    get(): T[] {
      const out: T[] = []
      for (let i = 0; i < size; i++) {
        const idx = (head - size + i + capacity) % capacity
        out.push(buf[idx]!)
      }
      return out
    },
    serialize(maxBytes = 8_000, maxAgeMs = 5 * 60_000): T[] {
      const now = Date.now()
      let items = this.get().filter((c: any) => now - (c.ts || now) <= maxAgeMs)
      let s = new TextEncoder().encode(JSON.stringify(items)).length
      while (items.length > 0 && s > maxBytes) {
        items.shift()
        s = new TextEncoder().encode(JSON.stringify(items)).length
      }
      return items
    },
    clear() {
      head = 0
      size = 0
    },
  }
}


