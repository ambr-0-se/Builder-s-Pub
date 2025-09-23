// @vitest-environment jsdom
import React from "react"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, cleanup } from "@testing-library/react"

vi.mock("@/components/ui/input", () => ({
  Input: (p: any) => <input {...p} />,
}))
vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, ...p }: any) => <button onClick={onClick} {...p}>{children}</button>,
}))

import ComboboxCreatable from "@/components/ui/combobox-creatable"

describe("ComboboxCreatable", () => {
  beforeEach(() => vi.clearAllMocks())
  afterEach(() => cleanup())

  it("filters options and allows selection", async () => {
    const onChange = vi.fn()
    render(<ComboboxCreatable value="" onChange={onChange} options={["AI Engineer", "Backend Engineer"]} placeholder="Role" />)
    const input = screen.getByPlaceholderText("Role") as HTMLInputElement
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: "AI" } })
    // pick the filtered suggestion
    fireEvent.mouseDown(screen.getByText("AI Engineer"))
    expect(onChange).toHaveBeenCalledWith("AI Engineer")
  })

  it("creates a new option when not in list", async () => {
    const onChange = vi.fn()
    render(<ComboboxCreatable value="" onChange={onChange} options={["Backend Engineer"]} placeholder="Role" />)
    const input = screen.getByPlaceholderText("Role") as HTMLInputElement
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: "Agent Engineer" } })
    fireEvent.mouseDown(screen.getByText(/Create "Agent Engineer"/))
    expect(onChange).toHaveBeenCalledWith("Agent Engineer")
  })

  it("supports keyboard navigation and enter selection", async () => {
    const onChange = vi.fn()
    render(<ComboboxCreatable value="" onChange={onChange} options={["AI", "Backend"]} placeholder="Role" />)
    const input = screen.getByPlaceholderText("Role") as HTMLInputElement
    fireEvent.focus(input)
    fireEvent.keyDown(input, { key: "ArrowDown" })
    fireEvent.keyDown(input, { key: "Enter" })
    expect(onChange).toHaveBeenCalled()
  })
})


