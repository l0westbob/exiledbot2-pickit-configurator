import { describe, expect, it } from "vitest"

import {
  CURRENCY_GROUP_ALL_VALUE,
  CURRENCY_SELECTION_MODE,
  CURRENCY_SINGLE_GROUP_SELECTION,
  filterCurrencyItemsBySearch,
  generateCurrencyRuleLines,
  resolveCurrencySelectionItems,
} from "../src/domain/pickit/currency.js"

const divineOrb = { name: "Divine Orb", categoryName: "Currency", categorySlug: "Currency" }
const mirror = { name: "Mirror of Kalandra", categoryName: "Currency", categorySlug: "Currency" }
const wisdomRune = { name: "Hedgewitch Assandra's Rune of Wisdom", categoryName: "Runes", categorySlug: "Runes" }

const catalog = {
  categories: [
    { name: "Currency", slug: "Currency", items: [mirror, divineOrb] },
    { name: "Runes", slug: "Runes", items: [wisdomRune] },
  ],
  items: [mirror, divineOrb, wisdomRune],
  tiers: [
    { name: "S", items: [mirror] },
    { name: "A", items: [wisdomRune] },
  ],
}

describe("pickit currency rules", () => {
  it("resolves the exact selected tier", () => {
    const result = resolveCurrencySelectionItems({ mode: CURRENCY_SELECTION_MODE.TIER, selectedTier: "S" }, catalog)

    expect(result.items.map((item) => item.name)).toEqual(["Mirror of Kalandra"])
  })

  it("resolves all currency items", () => {
    const result = resolveCurrencySelectionItems(
      {
        mode: CURRENCY_SELECTION_MODE.SINGLE_GROUP,
        singleGroupSelection: CURRENCY_SINGLE_GROUP_SELECTION.ALL,
      },
      catalog
    )

    expect(result.items.map((item) => item.name)).toEqual([
      "Divine Orb",
      "Hedgewitch Assandra's Rune of Wisdom",
      "Mirror of Kalandra",
    ])
  })

  it("resolves all tiers when the tier selection is all", () => {
    const result = resolveCurrencySelectionItems({ mode: CURRENCY_SELECTION_MODE.TIER, selectedTier: "all" }, catalog)

    expect(result.items.map((item) => item.name)).toEqual([
      "Divine Orb",
      "Hedgewitch Assandra's Rune of Wisdom",
      "Mirror of Kalandra",
    ])
  })

  it("resolves single item selections through the search-filtered list", () => {
    const result = resolveCurrencySelectionItems(
      {
        mode: CURRENCY_SELECTION_MODE.SINGLE_GROUP,
        singleGroupSelection: CURRENCY_SINGLE_GROUP_SELECTION.SINGLE,
        searchText: "div",
        selectedItemName: "Divine Orb",
      },
      catalog
    )

    expect(filterCurrencyItemsBySearch(catalog.items, "DIV").map((item) => item.name)).toEqual(["Divine Orb"])
    expect(result.items.map((item) => item.name)).toEqual(["Divine Orb"])
  })

  it("resolves all items in a selected group", () => {
    const result = resolveCurrencySelectionItems(
      {
        mode: CURRENCY_SELECTION_MODE.SINGLE_GROUP,
        singleGroupSelection: "Currency",
        selectedGroupItemName: CURRENCY_GROUP_ALL_VALUE,
      },
      catalog
    )

    expect(result.items.map((item) => item.name)).toEqual(["Divine Orb", "Mirror of Kalandra"])
  })

  it("generates one Type rule per resolved item", () => {
    const lines = generateCurrencyRuleLines({
      actionFlag: "StashItem",
      catalog,
      draft: {
        mode: CURRENCY_SELECTION_MODE.SINGLE_GROUP,
        singleGroupSelection: "Runes",
        selectedGroupItemName: CURRENCY_GROUP_ALL_VALUE,
      },
    })

    expect(lines).toEqual(['[Type] == "Hedgewitch Assandra\'s Rune of Wisdom" # [StashItem] == "true"'])
  })

  it("adds a single summary comment when explanations are enabled", () => {
    const lines = generateCurrencyRuleLines({
      actionFlag: "StashItem",
      includeExplanation: true,
      catalog,
      draft: {
        mode: CURRENCY_SELECTION_MODE.TIER,
        selectedTier: "S",
      },
    })

    expect(lines).toEqual([
      "// Picks up currency tier S (1 item)",
      '[Type] == "Mirror of Kalandra" # [StashItem] == "true"',
    ])
  })

  it("does not add a type header for one selected group item", () => {
    const lines = generateCurrencyRuleLines({
      actionFlag: "StashItem",
      includeExplanation: true,
      catalog,
      draft: {
        mode: CURRENCY_SELECTION_MODE.SINGLE_GROUP,
        singleGroupSelection: "Currency",
        selectedGroupItemName: "Divine Orb",
      },
    })

    expect(lines).toEqual([
      "// Picks up Divine Orb from Currency (1 item)",
      '[Type] == "Divine Orb" # [StashItem] == "true"',
    ])
  })

  it("adds category headers and alphabetizes items when explanations are enabled", () => {
    const lines = generateCurrencyRuleLines({
      actionFlag: "StashItem",
      includeExplanation: true,
      catalog,
      draft: {
        mode: CURRENCY_SELECTION_MODE.SINGLE_GROUP,
        singleGroupSelection: CURRENCY_SINGLE_GROUP_SELECTION.ALL,
      },
    })

    expect(lines).toEqual([
      "// Picks up all currency/economy items (3 items)",
      "// Currency",
      '[Type] == "Divine Orb" # [StashItem] == "true"',
      '[Type] == "Mirror of Kalandra" # [StashItem] == "true"',
      "// Runes",
      '[Type] == "Hedgewitch Assandra\'s Rune of Wisdom" # [StashItem] == "true"',
    ])
  })
})
