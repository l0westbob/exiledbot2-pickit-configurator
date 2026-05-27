import fs from "node:fs/promises"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { loadCurrencyCatalog, resetCurrencyServiceCache } from "../src/services/currencyService.js"

async function readJson(path) {
  return JSON.parse(await fs.readFile(path, "utf-8"))
}

describe("currency service", () => {
  beforeEach(() => {
    resetCurrencyServiceCache()
    vi.restoreAllMocks()
  })

  it("loads currency categories, items, and matching tier data", async () => {
    const currencyPayload = await readJson("public/data/economy/currency.json")
    const tierPayload = await readJson("public/data/tiers/tiers-early.json")

    global.fetch = vi.fn(async (url) => {
      const urlText = String(url)
      if (urlText.endsWith("data/economy/currency.json")) {
        return { ok: true, json: async () => currencyPayload }
      }
      if (urlText.endsWith("data/tiers/tiers-early.json")) {
        return { ok: true, json: async () => tierPayload }
      }
      return { ok: false, status: 404, json: async () => ({}) }
    })

    const catalog = await loadCurrencyCatalog()

    expect(catalog.categories).toHaveLength(15)
    expect(catalog.items).toHaveLength(437)
    expect(catalog.tiers.map((tier) => tier.name)).toEqual(["S", "A", "B", "C", "D", "E", "F"])
    expect(catalog.tiers.reduce((count, tier) => count + tier.items.length, 0)).toBe(437)
    expect(global.fetch).toHaveBeenCalledTimes(2)
  })

  it("caches the normalized currency catalog", async () => {
    const currencyPayload = {
      categories: [
        {
          name: "Currency",
          slug: "Currency",
          items: [{ name: "Divine Orb", api_id: "divine", item_id: 1, currency_item_id: 2, icon_url: "" }],
        },
      ],
    }
    const tierPayload = { tiers: { S: { Currency: ["Divine Orb"] } } }

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => currencyPayload })
      .mockResolvedValueOnce({ ok: true, json: async () => tierPayload })

    const first = await loadCurrencyCatalog()
    const second = await loadCurrencyCatalog()

    expect(first).toEqual(second)
    expect(global.fetch).toHaveBeenCalledTimes(2)
  })
})
