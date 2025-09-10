import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock analytics to capture server-side emissions
const trackServerMock = vi.fn()
vi.mock("@/lib/analytics", () => ({
  trackServer: trackServerMock,
  useAnalytics: () => ({ track: () => {} }),
}))

// Mock server project functions used by actions
const addCommentMock = vi.fn()
const deleteCommentMock = vi.fn()
const addReplyMock = vi.fn()
const toggleCommentUpvoteMock = vi.fn()
const toggleProjectUpvoteMock = vi.fn()
vi.mock("@/lib/server/projects", () => ({
  addComment: addCommentMock,
  deleteComment: deleteCommentMock,
  addReply: addReplyMock,
  toggleCommentUpvote: toggleCommentUpvoteMock,
  toggleProjectUpvote: toggleProjectUpvoteMock,
}))

describe("analytics server action emissions", () => {
  beforeEach(() => {
    trackServerMock.mockReset()
    addCommentMock.mockReset()
    deleteCommentMock.mockReset()
    addReplyMock.mockReset()
    toggleCommentUpvoteMock.mockReset()
    toggleProjectUpvoteMock.mockReset()
  })

  it("emits comment_added on successful addCommentAction", async () => {
    addCommentMock.mockResolvedValueOnce({ id: "c1" })
    const actions = await import("@/app/projects/actions")
    const fd = new FormData()
    fd.set("projectId", "p1")
    fd.set("body", "hello")
    const res = await actions.addCommentAction(null, fd)
    expect(res).toEqual({ ok: true })
    expect(trackServerMock).toHaveBeenCalled()
    const args = trackServerMock.mock.calls.at(-1)!
    expect(args[0]).toBe("comment_added")
    expect(args[1]).toMatchObject({ ok: true, projectId: "p1" })
  })

  it("emits comment_deleted on successful deleteCommentAction", async () => {
    deleteCommentMock.mockResolvedValueOnce({ ok: true })
    const actions = await import("@/app/projects/actions")
    const fd = new FormData()
    fd.set("commentId", "c1")
    const res = await actions.deleteCommentAction(null, fd)
    expect(res).toEqual({ ok: true })
    const args = trackServerMock.mock.calls.at(-1)!
    expect(args[0]).toBe("comment_deleted")
    expect(args[1]).toMatchObject({ ok: true, commentId: "c1" })
  })

  it("emits upvote_toggled for comment toggle with upvoted result", async () => {
    toggleCommentUpvoteMock.mockResolvedValueOnce({ ok: true, upvoted: true })
    const actions = await import("@/app/projects/actions")
    const fd = new FormData()
    fd.set("commentId", "c2")
    const res = await actions.toggleCommentUpvoteAction(null, fd)
    expect(res).toMatchObject({ ok: true, upvoted: true })
    const args = trackServerMock.mock.calls.at(-1)!
    expect(args[0]).toBe("upvote_toggled")
    expect(args[1]).toMatchObject({ target: "comment", targetId: "c2", upvoted: true })
  })

  it("emits upvote_toggled limited on project toggle when rate_limited", async () => {
    toggleProjectUpvoteMock.mockResolvedValueOnce({ error: "rate_limited", retryAfterSec: 10 })
    const actions = await import("@/app/projects/actions")
    const fd = new FormData()
    fd.set("projectId", "p9")
    const res = await actions.toggleProjectUpvoteAction(null, fd)
    expect(res).toMatchObject({ formError: expect.any(String), retryAfterSec: 10 })
    const args = trackServerMock.mock.calls.at(-1)!
    expect(args[0]).toBe("upvote_toggled")
    expect(args[1]).toMatchObject({ target: "project", targetId: "p9", limited: true, retryAfterSec: 10 })
  })
})


