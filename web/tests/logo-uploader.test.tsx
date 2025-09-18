// @vitest-environment jsdom
import React from "react"
import { describe, it, expect, vi } from "vitest"
import { render, fireEvent } from "@testing-library/react"
import { LogoUploader } from "@/components/ui/logo-uploader"

function fileOf(type: string, size = 10) {
  const blob = new Blob([new Uint8Array(size)], { type })
  return new File([blob], `f.${type.split("/").pop()}`)
}

describe("LogoUploader", () => {
  it("shows error for unsupported type", async () => {
    const { getByText } = render(
      <LogoUploader
        entity="project"
        entityId="p1"
        requestAction={vi.fn() as any}
        setAction={vi.fn() as any}
      />
    )
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await fireEvent.change(input, { target: { files: [fileOf("image/gif")] } })
    expect(getByText(/Unsupported file type/)).toBeTruthy()
  })
})
