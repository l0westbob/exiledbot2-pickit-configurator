import { beforeEach, describe, expect, it, vi } from "vitest"

import { createKeyedResourceCache, createResourceCache, DataLoadError, fetchJson } from "../src/services/dataRuntime.js"

describe("data runtime", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("loads JSON through the shared fetch boundary", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    })

    await expect(fetchJson("data/test.json")).resolves.toEqual({ ok: true })
    expect(global.fetch.mock.calls[0][0]).toMatch(/data\/test\.json$/)
  })

  it("throws a typed error for missing files", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({}),
    })

    await expect(fetchJson("data/missing.json")).rejects.toBeInstanceOf(DataLoadError)
    await expect(fetchJson("data/missing.json")).rejects.toThrow("Failed to load data/missing.json: 404")
  })

  it("lets malformed JSON fail fast at the fetch boundary", async () => {
    const syntaxError = new SyntaxError("Unexpected token")
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => {
        throw syntaxError
      },
    })

    await expect(fetchJson("data/bad.json")).rejects.toBe(syntaxError)
  })

  it("shares pending loads and caches resolved resources", async () => {
    const loader = vi.fn().mockResolvedValue({ value: 1 })
    const cache = createResourceCache(loader)

    const [first, second] = await Promise.all([cache.load(), cache.load()])
    const third = await cache.load()

    expect(first).toEqual({ value: 1 })
    expect(second).toBe(first)
    expect(third).toBe(first)
    expect(loader).toHaveBeenCalledTimes(1)
  })

  it("caches keyed resources independently", async () => {
    const loader = vi.fn(async (key) => ({ key }))
    const cache = createKeyedResourceCache(loader)

    await expect(cache.load("Rings")).resolves.toEqual({ key: "Rings" })
    await expect(cache.load("Rings")).resolves.toEqual({ key: "Rings" })
    await expect(cache.load("Amulets")).resolves.toEqual({ key: "Amulets" })

    expect(loader).toHaveBeenCalledTimes(2)
  })
})
