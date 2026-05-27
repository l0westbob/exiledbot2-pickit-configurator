import { describe, expect, it } from "vitest"

import { getAffixFamilyKey } from "../src/domain/pickit/affixes.js"
import {
  generateRulePreviewLines,
  rarityFromSelectedAffixCount,
  tierIndexFromBottom,
} from "../src/domain/pickit/rules.js"

function createFinders(affixes) {
  return {
    findAffixByKey(key) {
      return affixes.find((affix) => getAffixFamilyKey(affix) === key) || null
    },
    availableTiersForSlot(slotIndex, slots) {
      const selectedKey = slots[slotIndex]?.selectedAffixKey
      return affixes.find((affix) => getAffixFamilyKey(affix) === selectedKey)?.tiers || []
    },
  }
}

describe("pickit rule generation", () => {
  it("builds the current magic rule shape for a single affix", () => {
    const affixes = [
      {
        modifierSection: "normal",
        family_key: "MaximumLife",
        kind: "prefix",
        template: "+# to [Life|Life]",
        tiers: [
          {
            level: 10,
            name: "Healthy",
            stats: [{ id: "base_maximum_life", min: 20, max: 29 }],
          },
        ],
      },
    ]
    const slots = [{ selectedAffixKey: getAffixFamilyKey(affixes[0]), selectedTierLevel: 10 }]
    const { findAffixByKey, availableTiersForSlot } = createFinders(affixes)

    const lines = generateRulePreviewLines({
      actionFlag: "StashItem",
      selectedItemSlug: "Rings",
      selectedItem: { pickitCategory: "Ring" },
      affixSlots: slots,
      findAffixByKey,
      availableTiersForSlot: (slotIndex) => availableTiersForSlot(slotIndex, slots),
    })

    expect(lines).toEqual([
      '[Category] == "Ring" && [Rarity] == "Magic" # base_maximum_life >= "20" && base_maximum_life <= "29" && [StashItem] == "true"',
    ])
  })

  it("includes the human explanation only when requested", () => {
    const affixes = [
      {
        modifierSection: "normal",
        family_key: "MaximumLife",
        kind: "prefix",
        template: "+# to [Life|Life]",
        tiers: [
          {
            level: 10,
            name: "Healthy",
            stats: [{ id: "base_maximum_life", min: 20, max: 29 }],
          },
        ],
      },
    ]
    const slots = [{ selectedAffixKey: getAffixFamilyKey(affixes[0]), selectedTierLevel: 10 }]
    const { findAffixByKey, availableTiersForSlot } = createFinders(affixes)

    const lines = generateRulePreviewLines({
      actionFlag: "StashItem",
      includeExplanation: true,
      selectedItemSlug: "Rings",
      selectedItem: { pickitCategory: "Ring" },
      affixSlots: slots,
      findAffixByKey,
      availableTiersForSlot: (slotIndex) => availableTiersForSlot(slotIndex, slots),
    })

    expect(lines[0]).toBe(
      "// Picks up Ring of rarity Magic and StashItem if they have at least +# to [Life|Life] of tier T1"
    )
    expect(lines[1]).toContain('[Category] == "Ring"')
  })

  it("aggregates duplicate stat ids across selected affixes", () => {
    const affixes = [
      {
        modifierSection: "normal",
        family_key: "StrengthA",
        kind: "prefix",
        template: "+# to [Strength|Strength]",
        tiers: [{ level: 8, name: "Strong", stats: [{ id: "additional_strength", min: 10, max: 12 }] }],
      },
      {
        modifierSection: "normal",
        family_key: "StrengthB",
        kind: "suffix",
        template: "+# to [Strength|Strength]",
        tiers: [{ level: 12, name: "of the Titan", stats: [{ id: "additional_strength", min: 13, max: 15 }] }],
      },
    ]
    const slots = [
      { selectedAffixKey: getAffixFamilyKey(affixes[0]), selectedTierLevel: 8 },
      { selectedAffixKey: getAffixFamilyKey(affixes[1]), selectedTierLevel: 12 },
    ]
    const { findAffixByKey, availableTiersForSlot } = createFinders(affixes)

    const lines = generateRulePreviewLines({
      actionFlag: "StashItem",
      selectedItemSlug: "Amulets",
      selectedItem: { pickitCategory: "Amulet" },
      affixSlots: slots,
      findAffixByKey,
      availableTiersForSlot: (slotIndex) => availableTiersForSlot(slotIndex, slots),
    })

    expect(lines[0]).toContain('additional_strength >= "23"')
    expect(lines[0]).toContain('additional_strength <= "27"')
    expect(lines[0].match(/additional_strength/g)).toHaveLength(2)
  })

  it("marks three selected affixes as rare", () => {
    expect(rarityFromSelectedAffixCount(3)).toBe("Rare")
  })

  it("keeps the unknown fallback for items without a pickit category", () => {
    const lines = generateRulePreviewLines({
      selectedItemSlug: "Talismans",
      selectedItem: { pickitCategory: null },
      affixSlots: [],
    })

    expect(lines).toEqual(['[Category] == "UNKNOWN" # [StashItem] == "true"'])
  })

  it("computes tier labels from the highest required level down", () => {
    expect(tierIndexFromBottom([{ level: 1 }, { level: 10 }, { level: 20 }], 20)).toBe(1)
    expect(tierIndexFromBottom([{ level: 1 }, { level: 10 }, { level: 20 }], 1)).toBe(3)
  })

  it("keeps modifier keys unique across modifier sections", () => {
    const normalKey = getAffixFamilyKey({
      modifierSection: "normal",
      family_key: "Life",
      kind: "prefix",
      template: "+# to Life",
    })
    const essenceKey = getAffixFamilyKey({
      modifierSection: "essence",
      family_key: "Life",
      kind: "prefix",
      template: "+# to Life",
    })

    expect(normalKey).not.toBe(essenceKey)
  })

  it("includes the selected base in the generated rule when one is chosen", () => {
    const affixes = [
      {
        modifierSection: "essence",
        family_key: "MaximumLife",
        kind: "prefix",
        template: "+# to [Life|Life]",
        tiers: [
          {
            level: 10,
            name: "Healthy",
            stats: [{ id: "base_maximum_life", min: 20, max: 29 }],
          },
        ],
      },
    ]
    const slots = [{ selectedAffixKey: getAffixFamilyKey(affixes[0]), selectedTierLevel: 10 }]
    const { findAffixByKey, availableTiersForSlot } = createFinders(affixes)

    const lines = generateRulePreviewLines({
      actionFlag: "StashItem",
      includeExplanation: true,
      selectedItemSlug: "Rings",
      selectedItem: { pickitCategory: "Ring" },
      selectedBaseName: "Golden Hoop",
      affixSlots: slots,
      findAffixByKey,
      availableTiersForSlot: (slotIndex) => availableTiersForSlot(slotIndex, slots),
    })

    expect(lines[0]).toContain("base Golden Hoop")
    expect(lines[0]).toContain("Essence - +# to [Life|Life]")
    expect(lines[1]).toContain('[Type] == "Golden Hoop"')
  })
})
