import { describe, it, expect, vi } from "vitest"
import * as React from "react"
import { renderToString } from "react-dom/server"

describe("GlobalError render (500 path)", () => {
  it("renders helpful guidance and a retry button", async () => {
    const mod = await import("@/app/error")
    const GlobalError = mod.default as (props: { error: Error & { digest?: string }; reset: () => void }) => React.ReactElement
    const html = renderToString(
      React.createElement(GlobalError, { error: new Error("boom"), reset: vi.fn() })
    )
    expect(html).toContain("Something went wrong")
    expect(html).toContain("Try again")
  })
})


