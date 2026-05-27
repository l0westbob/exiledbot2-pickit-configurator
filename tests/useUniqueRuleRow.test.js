import { nextTick, ref } from "vue"
import { beforeEach, describe, expect, it, vi } from "vitest"

const { loadUniqueCatalog } = vi.hoisted(() => ({
  loadUniqueCatalog: vi.fn(),
}))

vi.mock("../src/services/uniqueService.js", () => ({
  loadUniqueCatalog,
}))

import { useUniqueRuleRow } from "../src/composables/useUniqueRuleRow.js"

const astramentis = {
  name: "Astramentis",
  displayName: "Astramentis Stellar Amulet",
  baseName: "Stellar Amulet",
  className: "Amulets",
  classSlug: "Amulets",
  stats: [
    {
      text: "+(5-7) to all Attributes",
      template: "+# to all Attributes",
      rolls: [{ min: 5, max: 7 }],
      affix_ids: ["additional_all_attributes"],
    },
  ],
}

const headhunter = {
  name: "Headhunter",
  displayName: "Headhunter Heavy Belt",
  baseName: "Heavy Belt",
  className: "Belts",
  classSlug: "Belts",
}

describe("useUniqueRuleRow", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    loadUniqueCatalog.mockResolvedValue({
      classes: [
        { name: "Amulets", slug: "Amulets", uniques: [astramentis] },
        { name: "Belts", slug: "Belts", uniques: [headhunter] },
      ],
      uniques: [astramentis, headhunter],
    })
  })

  it("loads uniques and defaults to the first class", async () => {
    const row = useUniqueRuleRow({
      actionFlagRef: ref("StashItem"),
      includeExplanationRef: ref(false),
    })

    await row.ensureUniqueCatalogLoaded()

    expect(row.selectedUniqueSelection.value).toBe("Amulets")
    expect(row.currentUniqueLines.value).toEqual([
      '[Type] == "Stellar Amulet" && [Rarity] == "Unique" # [UniqueName] == "Astramentis" && [StashItem] == "true"',
    ])
    expect(loadUniqueCatalog).toHaveBeenCalledTimes(1)
  })

  it("adds selected unique stat minimums to generated lines", async () => {
    const row = useUniqueRuleRow({
      actionFlagRef: ref("StashItem"),
      includeExplanationRef: ref(false),
    })

    await row.ensureUniqueCatalogLoaded()
    row.selectedUniqueGroupItemDisplayName.value = "Astramentis Stellar Amulet"
    row.updateUniqueStatSlot({
      slotIndex: 0,
      selectedStatKey: row.uniqueStatOptions.value[0].key,
    })
    await nextTick()

    row.updateUniqueStatSlot({
      slotIndex: 0,
      minimumValue: "7",
    })

    expect(row.currentUniqueLines.value).toEqual([
      '[Type] == "Stellar Amulet" && [Rarity] == "Unique" # [UniqueName] == "Astramentis" && [additional_all_attributes] >= "7" && [StashItem] == "true"',
    ])
  })
})
