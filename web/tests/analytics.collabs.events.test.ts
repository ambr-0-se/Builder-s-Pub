import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock analytics to capture server-side emissions
const trackServerMock = vi.fn()
vi.mock("@/lib/analytics", () => ({
  trackServer: trackServerMock,
  useAnalytics: () => ({ track: () => {} }),
}))

// Mock server collab functions used by actions
const addCollabCommentMock = vi.fn()
const deleteCollabCommentMock = vi.fn()
const toggleCollabUpvoteMock = vi.fn()
vi.mock("@/lib/server/collabs", () => ({
  addCollabComment: addCollabCommentMock,
  deleteCollabComment: deleteCollabCommentMock,
  toggleCollabUpvote: toggleCollabUpvoteMock,
}))

describe("analytics collab actions emissions", () => {
  beforeEach(() => {
    trackServerMock.mockReset()
    addCollabCommentMock.mockReset()
    deleteCollabCommentMock.mockReset()
    toggleCollabUpvoteMock.mockReset()
  })

  it("emits collab_comment_added on successful addCollabCommentAction", async () => {
    addCollabCommentMock.mockResolvedValueOnce({ id: "cc1" })
    const actions = await import("@/app/collaborations/actions")
    const fd = new FormData()
    fd.set("collaborationId", "co1")
    fd.set("body", "hello")
    const res = await actions.addCollabCommentAction(null, fd)
    expect(res).toEqual({ ok: true })
    const args = trackServerMock.mock.calls.at(-1)!
    expect(args[0]).toBe("collab_comment_added")
    expect(args[1]).toMatchObject({ ok: true, collaborationId: "co1" })
  })

  it("emits collab_comment_deleted on successful deleteCollabCommentAction", async () => {
    deleteCollabCommentMock.mockResolvedValueOnce({ ok: true })
    const actions = await import("@/app/collaborations/actions")
    const fd = new FormData()
    fd.set("commentId", "cc2")
    const res = await actions.deleteCollabCommentAction(null, fd)
    expect(res).toEqual({ ok: true })
    const args = trackServerMock.mock.calls.at(-1)!
    expect(args[0]).toBe("collab_comment_deleted")
    expect(args[1]).toMatchObject({ ok: true, commentId: "cc2" })
  })

  it("emits upvote_toggled for collab toggle", async () => {
    toggleCollabUpvoteMock.mockResolvedValueOnce({ ok: true, upvoted: true })
    const actions = await import("@/app/collaborations/actions")
    const fd = new FormData()
    fd.set("collaborationId", "co9")
    const res = await actions.toggleCollabUpvoteAction(null, fd)
    expect(res).toMatchObject({ ok: true, upvoted: true })
    const args = trackServerMock.mock.calls.at(-1)!
    expect(args[0]).toBe("upvote_toggled")
    expect(args[1]).toMatchObject({ target: "collaboration", targetId: "co9", upvoted: true })
  })
})


