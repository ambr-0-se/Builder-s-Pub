import { describe, it, expect, vi, beforeEach } from "vitest"
import { handleCreatedFlag } from "@/lib/created-flag"

// Mock sessionStorage
const sessionStorageMock = {
	getItem: vi.fn(),
	setItem: vi.fn(),
	removeItem: vi.fn(),
}

// Mock window object for test environment
Object.defineProperty(globalThis, "window", {
	value: {
		sessionStorage: sessionStorageMock,
	},
	writable: true,
})

describe("handleCreatedFlag", () => {
	beforeEach(() => {
		vi.clearAllMocks()
		sessionStorageMock.getItem.mockReturnValue(null) // Default: no previous toast
	})

	it("toasts and cleans URL when created=1", () => {
		const params = new URLSearchParams("created=1")
		const replace = vi.fn()
		const toast = vi.fn()
		const track = vi.fn()
		handleCreatedFlag(params, "/projects/abc", replace, toast, track)
		expect(toast).toHaveBeenCalledWith("Project created successfully!", "success")
		expect(track).toHaveBeenCalledWith("project_created", { source: "redirect_success" })
		expect(sessionStorageMock.setItem).toHaveBeenCalledWith("project-created-toast-abc", "1")
		expect(replace).toHaveBeenCalledWith("/projects/abc")
	})

	it("does nothing when created flag absent", () => {
		const params = new URLSearchParams("")
		const replace = vi.fn()
		const toast = vi.fn()
		const track = vi.fn()
		handleCreatedFlag(params, "/projects/abc", replace, toast, track)
		expect(toast).not.toHaveBeenCalled()
		expect(track).not.toHaveBeenCalled()
		expect(replace).not.toHaveBeenCalled()
		expect(sessionStorageMock.setItem).not.toHaveBeenCalled()
	})

	it("does nothing when created has different value", () => {
		const params = new URLSearchParams("created=0")
		const replace = vi.fn()
		const toast = vi.fn()
		const track = vi.fn()
		handleCreatedFlag(params, "/projects/abc", replace, toast, track)
		expect(toast).not.toHaveBeenCalled()
		expect(track).not.toHaveBeenCalled()
		expect(replace).not.toHaveBeenCalled()
		expect(sessionStorageMock.setItem).not.toHaveBeenCalled()
	})

	it("works without track function (optional parameter)", () => {
		const params = new URLSearchParams("created=1")
		const replace = vi.fn()
		const toast = vi.fn()
		handleCreatedFlag(params, "/projects/abc", replace, toast)
		expect(toast).toHaveBeenCalledWith("Project created successfully!", "success")
		expect(sessionStorageMock.setItem).toHaveBeenCalledWith("project-created-toast-abc", "1")
		expect(replace).toHaveBeenCalledWith("/projects/abc")
	})

	it("skips toast if already shown (sessionStorage check)", () => {
		sessionStorageMock.getItem.mockReturnValue("1") // Toast already shown
		const params = new URLSearchParams("created=1")
		const replace = vi.fn()
		const toast = vi.fn()
		const track = vi.fn()
		handleCreatedFlag(params, "/projects/abc", replace, toast, track)
		expect(toast).not.toHaveBeenCalled()
		expect(track).not.toHaveBeenCalled()
		expect(sessionStorageMock.setItem).not.toHaveBeenCalled() // Don't set again
		expect(replace).toHaveBeenCalledWith("/projects/abc") // Still clean URL
	})
})
