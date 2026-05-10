import {beforeEach, describe, expect, it, vi} from "vitest"

import {getAffixesForSlug, loadCatalog, resetCatalogServiceCache} from "../src/services/catalogService.js"

describe("catalog service", () => {
  beforeEach(() => {
    resetCatalogServiceCache()
    vi.restoreAllMocks()
  })

  it("caches catalog fetches", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({items: [{slug: "Rings", pickitCategory: "Ring", status: "implemented"}]}),
    })

    const first = await loadCatalog()
    const second = await loadCatalog()

    expect(first).toEqual(second)
    expect(global.fetch).toHaveBeenCalledTimes(1)
  })

  it("caches affix fetches per slug", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({affixes: [{family_key: "Life", kind: "prefix", template: "+# to Life", tiers: []}]}),
    })

    const first = await getAffixesForSlug("Rings")
    const second = await getAffixesForSlug("Rings")

    expect(first).toEqual(second)
    expect(global.fetch).toHaveBeenCalledTimes(1)
  })
})
