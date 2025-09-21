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
  it("renders dropzone text and no Upload button (auto-upload)", async () => {
    const { getByText, queryByText } = render(
      <LogoUploader entity="project" requestAction={vi.fn() as any} onUploadedPath={vi.fn()} preventReload variant="dropzone" />
    )
    expect(getByText(/Drop your logo here, or browse/)).toBeTruthy()
    expect(queryByText("Upload")).toBeNull()
  })
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
