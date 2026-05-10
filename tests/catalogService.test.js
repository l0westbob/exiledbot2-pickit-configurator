import {beforeEach, describe, expect, it, vi} from "vitest"

import {
  getAffixesForSlug,
  getItemDataForSlug,
  loadCatalog,
  resetCatalogServiceCache,
} from "../src/services/catalogService.js"

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

  it("caches item payload fetches per slug and normalizes bases plus modifier sections", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        slug: "Rings",
        category: "Jewellery",
        label: "Rings",
        bases: [{name: "Golden Hoop", href: "https://poe2db.tw/Golden_Hoop", required_level: 12}],
        modifier_sections: {
          normal: [{family_key: "Life", kind: "prefix", template: "+# to Life", tiers: []}],
          corrupted: [{family_key: "CorruptLife", kind: "gen5", template: "+# to Life", tiers: []}],
        },
      }),
    })

    const first = await getItemDataForSlug("Rings")
    const second = await getItemDataForSlug("Rings")

    expect(first).toEqual(second)
    expect(first.bases).toEqual([
      {name: "Golden Hoop", href: "https://poe2db.tw/Golden_Hoop", requiredLevel: 12},
    ])
    expect(first.affixes).toHaveLength(2)
    expect(first.affixes[0].modifierSection).toBe("normal")
    expect(first.affixes[1].modifierSection).toBe("corrupted")
    expect(global.fetch).toHaveBeenCalledTimes(1)
  })

  it("returns flattened modifiers through the affix loader helper", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        slug: "Rings",
        category: "Jewellery",
        label: "Rings",
        modifier_sections: {
          normal: [{family_key: "Life", kind: "prefix", template: "+# to Life", tiers: []}],
          essence: [{family_key: "EssenceLife", kind: "prefix", template: "+# to Life", tiers: []}],
        },
      }),
    })

    const affixes = await getAffixesForSlug("Rings")

    expect(affixes.map((affix) => affix.modifierSection)).toEqual(["normal", "essence"])
  })
})
