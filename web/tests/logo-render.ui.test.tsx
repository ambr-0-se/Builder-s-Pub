/**
 * @vitest-environment jsdom
 */
import React from "react"
import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { LogoImage } from "@/components/ui/logo-image"

describe("LogoImage fallback", () => {
  it("renders initials when src is missing", () => {
    render(<LogoImage alt="Alpha Beta" size={48} /> as any)
    // Expect initials AB somewhere
    expect(screen.getByText(/AB/)).toBeTruthy()
  })
})



