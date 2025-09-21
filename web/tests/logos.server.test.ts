import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

// Mocks
vi.mock("@/lib/supabaseServer", () => ({
  getServerSupabase: vi.fn(async () => ({
    auth: { getUser: async () => ({ data: { user: { id: "u1" } } }) },
    from: vi.fn().mockImplementation((table: string) => ({
      update: vi.fn().mockReturnValue({
        eq: vi.fn(async () => ({ error: null })),
      }),
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn(async () => ({ data: { owner_id: "u1" }, error: null })),
          single: vi.fn(async () => ({ data: { id: table === "projects" ? "p1" : "c1" }, error: null })),
        }),
      }),
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({ single: vi.fn(async () => ({ data: { id: table === "projects" ? "p1" : "c1" }, error: null })) })
      }),
      delete: vi.fn().mockReturnValue({ eq: vi.fn(async () => ({ error: null })) }),
    })),
  })),
}))

vi.mock("@/lib/supabaseService", () => ({
  getServiceSupabase: vi.fn(() => ({
    storage: {
      from: vi.fn().mockImplementation((bucket: string) => ({
        move: vi.fn(async () => ({ data: null, error: null })),
        copy: vi.fn(async () => ({ data: null, error: null })),
        remove: vi.fn(async () => ({ data: null, error: null })),
        createSignedUploadUrl: vi.fn(async () => ({ data: { signedUrl: "http://signed" } })),
      })),
    },
  })),
}))

// Mock logo-public-url delete helper used by clear actions and storage cleanup
vi.mock("@/lib/server/logo-public-url", () => ({
  deleteStorageObject: vi.fn(async () => ({ ok: true })),
  toPublicUrl: (path?: string) => (path ? `public/${path}` : undefined),
}))

describe("logos finalize + set", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("setProjectLogo moves temp path to canonical and updates DB", async () => {
    const { setProjectLogo } = await import("@/lib/server/projects")
    const res = await setProjectLogo("p1", "project-logos/new/u1/tmp.png")
    expect(res).toEqual({ ok: true })
  })

  it("setCollabLogo moves temp path to canonical and updates DB", async () => {
    const { setCollabLogo } = await import("@/lib/server/collabs")
    const res = await setCollabLogo("c1", "collab-logos/new/u1/tmp.png")
    expect(res).toEqual({ ok: true })
  })

  it("rejects setProjectLogo for non-owner", async () => {
    const { getServerSupabase } = await import("@/lib/supabaseServer") as any
    // Next call: owner_id != u1
    ;(getServerSupabase as any).mockResolvedValueOnce({
      auth: { getUser: async () => ({ data: { user: { id: "u2" } } }) },
      from: vi.fn().mockImplementation(() => ({
        select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle: vi.fn(async () => ({ data: { owner_id: "u1" }, error: null })) }) }),
      })),
    })
    const { setProjectLogo } = await import("@/lib/server/projects")
    const res = await setProjectLogo("p1", "project-logos/p1/file.png")
    expect((res as any).error).toBe("forbidden")
  })

  it("rejects invalid project path prefix", async () => {
    const { setProjectLogo } = await import("@/lib/server/projects")
    const res = await setProjectLogo("p1", "collab-logos/p1/file.png")
    expect((res as any).error).toBe("invalid_path")
  })

  it("rejects invalid collab path prefix", async () => {
    const { setCollabLogo } = await import("@/lib/server/collabs")
    const res = await setCollabLogo("c1", "project-logos/c1/file.png")
    expect((res as any).error).toBe("invalid_path")
  })
})

describe("logo upload requests (owner/path/mime)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("requestProjectLogoUpload returns mime whitelist and size, owner-ok", async () => {
    const { requestProjectLogoUpload } = await import("@/lib/server/projects")
    const res = await requestProjectLogoUpload("p1", { ext: "png" })
    expect((res as any).uploadUrl).toBeTruthy()
    expect((res as any).path).toMatch(/^project-logos\/p1\//)
    expect((res as any).maxBytes).toBe(1_000_000)
    expect((res as any).mime).toEqual(["image/png","image/jpeg","image/svg+xml"])
  })

  it("rejects requestProjectLogoUpload with invalid ext", async () => {
    const { requestProjectLogoUpload } = await import("@/lib/server/projects")
    const res = await requestProjectLogoUpload("p1", { ext: "exe" as any })
    expect((res as any).error).toBe("invalid_ext")
  })

  it("rejects requestProjectLogoUpload when non-owner", async () => {
    const { getServerSupabase } = await import("@/lib/supabaseServer") as any
    ;(getServerSupabase as any).mockResolvedValueOnce({
      auth: { getUser: async () => ({ data: { user: { id: "u2" } } }) },
      from: vi.fn().mockImplementation(() => ({
        select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle: vi.fn(async () => ({ data: { owner_id: "u1" }, error: null })) }) }),
      })),
    })
    const { requestProjectLogoUpload } = await import("@/lib/server/projects")
    const res = await requestProjectLogoUpload("p1", { ext: "png" })
    expect((res as any).error).toBe("forbidden")
  })

  it("requestNewProjectLogoUpload returns whitelist and size for auth user", async () => {
    const { requestNewProjectLogoUpload } = await import("@/lib/server/projects")
    const res = await requestNewProjectLogoUpload({ ext: "jpeg" })
    expect((res as any).uploadUrl).toBeTruthy()
    expect((res as any).path).toMatch(/^project-logos\/new\/u1\//)
    expect((res as any).maxBytes).toBe(1_000_000)
    expect((res as any).mime).toEqual(["image/png","image/jpeg","image/svg+xml"])
  })

  it("rejects requestNewProjectLogoUpload with invalid ext", async () => {
    const { requestNewProjectLogoUpload } = await import("@/lib/server/projects")
    const res = await requestNewProjectLogoUpload({ ext: "bmp" as any })
    expect((res as any).error).toBe("invalid_ext")
  })

  it("requestCollabLogoUpload returns whitelist and size, owner-ok", async () => {
    const { requestCollabLogoUpload } = await import("@/lib/server/collabs")
    const res = await requestCollabLogoUpload("c1", { ext: "svg" })
    expect((res as any).uploadUrl).toBeTruthy()
    expect((res as any).path).toMatch(/^collab-logos\/c1\//)
    expect((res as any).maxBytes).toBe(1_000_000)
    expect((res as any).mime).toEqual(["image/png","image/jpeg","image/svg+xml"])
  })

  it("rejects requestCollabLogoUpload with invalid ext", async () => {
    const { requestCollabLogoUpload } = await import("@/lib/server/collabs")
    const res = await requestCollabLogoUpload("c1", { ext: "gif" as any })
    expect((res as any).error).toBe("invalid_ext")
  })

  it("requestProfileAvatarUpload returns whitelist and size for self", async () => {
    const { requestProfileAvatarUpload } = await import("@/app/profile/actions")
    const res = await requestProfileAvatarUpload({ ext: "png" })
    expect((res as any).uploadUrl).toBeTruthy()
    expect((res as any).path).toMatch(/^profile-avatars\/u1\//)
    expect((res as any).maxBytes).toBe(1_000_000)
    expect((res as any).mime).toEqual(["image/png","image/jpeg","image/svg+xml"])
  })

  it("rejects requestProfileAvatarUpload invalid ext", async () => {
    const { requestProfileAvatarUpload } = await import("@/app/profile/actions")
    const res = await requestProfileAvatarUpload({ ext: "bmp" as any })
    expect((res as any).error).toBe("invalid_ext")
  })

  it("setProfileAvatar rejects invalid path prefix", async () => {
    const { setProfileAvatar } = await import("@/app/profile/actions")
    const res = await setProfileAvatar("project-logos/u1/file.png")
    expect((res as any).error).toBe("invalid_path")
  })

  it("clearProfileAvatar sets path to null", async () => {
    const { clearProfileAvatar } = await import("@/app/profile/actions")
    const res = await clearProfileAvatar()
    expect(res).toEqual({ ok: true })
  })
})

describe("clear logo actions delete storage object (best-effort)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("clearProjectLogo clears DB and deletes object", async () => {
    const { getServerSupabase } = await import("@/lib/supabaseServer") as any
    // Owner u1 with existing logo
    ;(getServerSupabase as any).mockResolvedValueOnce({
      auth: { getUser: async () => ({ data: { user: { id: "u1" } } }) },
      from: vi.fn().mockImplementation((table: string) => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({ single: vi.fn(async () => ({ data: { owner_id: "u1", logo_path: "project-logos/p1/file.png" }, error: null })) }),
        }),
        update: vi.fn().mockReturnValue({ eq: vi.fn(async () => ({ error: null })) }),
      })),
    })
    const { deleteStorageObject } = await import("@/lib/server/logo-public-url") as any
    const { clearProjectLogo } = await import("@/lib/server/projects")
    const res = await clearProjectLogo("p1")
    expect(res).toEqual({ ok: true })
    expect(deleteStorageObject).toHaveBeenCalledWith("project-logos", "project-logos/p1/file.png")
  })

  it("clearCollabLogo clears DB and deletes object", async () => {
    const { getServerSupabase } = await import("@/lib/supabaseServer") as any
    ;(getServerSupabase as any).mockResolvedValueOnce({
      auth: { getUser: async () => ({ data: { user: { id: "u1" } } }) },
      from: vi.fn().mockImplementation((table: string) => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({ single: vi.fn(async () => ({ data: { owner_id: "u1", logo_path: "collab-logos/c1/file.png" }, error: null })) }),
        }),
        update: vi.fn().mockReturnValue({ eq: vi.fn(async () => ({ error: null })) }),
      })),
    })
    const { deleteStorageObject } = await import("@/lib/server/logo-public-url") as any
    const { clearCollabLogo } = await import("@/lib/server/collabs")
    const res = await clearCollabLogo("c1")
    expect(res).toEqual({ ok: true })
    expect(deleteStorageObject).toHaveBeenCalledWith("collab-logos", "collab-logos/c1/file.png")
  })
})

describe("deleteTempLogo helper", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("allows deleting own temp object under new/<userId>", async () => {
    const { getServerSupabase } = await import("@/lib/supabaseServer") as any
    ;(getServerSupabase as any).mockResolvedValueOnce({
      auth: { getUser: async () => ({ data: { user: { id: "u1" } } }) },
    })
    const { deleteTempLogo } = await import("@/lib/server/storage-cleanup")
    const res = await deleteTempLogo("project-logos/new/u1/tmp.png")
    expect(res).toEqual({ ok: true })
  })

  it("rejects deleting another user's temp object", async () => {
    const { getServerSupabase } = await import("@/lib/supabaseServer") as any
    ;(getServerSupabase as any).mockResolvedValueOnce({
      auth: { getUser: async () => ({ data: { user: { id: "u1" } } }) },
    })
    const { deleteTempLogo } = await import("@/lib/server/storage-cleanup")
    const res = await deleteTempLogo("project-logos/new/u2/tmp.png")
    expect((res as any).error).toBeTruthy()
  })
})



