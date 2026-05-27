import fs from "node:fs/promises"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { loadUniqueCatalog, resetUniqueServiceCache } from "../src/services/uniqueService.js"

async function readJson(path) {
  return JSON.parse(await fs.readFile(path, "utf-8"))
}

describe("unique service", () => {
  beforeEach(() => {
    resetUniqueServiceCache()
    vi.restoreAllMocks()
  })

  it("loads unique classes and normalizes all unique items", async () => {
    const indexPayload = await readJson("public/data/uniques/index.json")
    const classPayloads = new Map()

    for (const uniqueClass of indexPayload.classes) {
      classPayloads.set(`data/uniques/${uniqueClass.file}`, await readJson(`public/data/uniques/${uniqueClass.file}`))
    }

    global.fetch = vi.fn(async (url) => {
      const urlText = String(url)
      if (urlText.endsWith("data/uniques/index.json")) {
        return { ok: true, json: async () => indexPayload }
      }

      for (const [relativePath, payload] of classPayloads) {
        if (urlText.endsWith(relativePath)) {
          return { ok: true, json: async () => payload }
        }
      }

      return { ok: false, status: 404, json: async () => ({}) }
    })

    const catalog = await loadUniqueCatalog()

    expect(catalog.classes).toHaveLength(27)
    expect(catalog.classes[0].name).toBe("Amulets")
    expect(catalog.uniques).toHaveLength(403)
    expect(catalog.uniques.filter((unique) => !unique.itemTypeSlug)).toHaveLength(32)
    expect(catalog.uniques.every((unique) => unique.name && unique.displayName && unique.baseName)).toBe(true)
    expect(global.fetch).toHaveBeenCalledTimes(28)
  })

  it("caches the normalized unique catalog", async () => {
    const indexPayload = {
      version: 1,
      classes: [{ slug: "Belts", class: "Belts", file: "Belts.json" }],
    }
    const classPayload = {
      class: "Belts",
      slug: "Belts",
      uniques: [
        {
          name: "Headhunter",
          display_name: "Headhunter Heavy Belt",
          base_name: "Heavy Belt",
        },
      ],
    }

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => indexPayload })
      .mockResolvedValueOnce({ ok: true, json: async () => classPayload })

    const first = await loadUniqueCatalog()
    const second = await loadUniqueCatalog()

    expect(first).toEqual(second)
    expect(global.fetch).toHaveBeenCalledTimes(2)
  })
})
