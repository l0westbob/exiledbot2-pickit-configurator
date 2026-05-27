import { describe, expect, it } from "vitest"

import {
  buildUniqueStatConditions,
  filterUniquesBySearch,
  formatUniqueStatOptionLabel,
  generateUniqueRuleLines,
  getDefaultUniqueSelection,
  getUniqueStatOptions,
  resolveUniqueSelectionItems,
  UNIQUE_GROUP_ALL_VALUE,
  UNIQUE_SINGLE_GROUP_SELECTION,
} from "../src/domain/pickit/uniques.js"

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
      stat_ids: ["additional all attributes"],
      affix_ids: ["additional_all_attributes"],
    },
    {
      text: "+(50-100) to all Attributes",
      template: "+# to all Attributes",
      rolls: [{ min: 50, max: 100 }],
      stat_ids: ["additional all attributes"],
      affix_ids: ["additional_all_attributes"],
    },
    {
      text: "-4 Physical Damage taken from Attack Hits",
      template: "-4 Physical Damage taken from Attack Hits",
      rolls: [],
      stat_ids: ["physical attack damage taken +"],
      affix_ids: ["physical_attack_damage_taken_+"],
    },
  ],
}
const beacon = {
  name: "Beacon of Azis",
  displayName: "Beacon of Azis Solar Amulet",
  baseName: "Solar Amulet",
  className: "Amulets",
  classSlug: "Amulets",
}
const headhunter = {
  name: "Headhunter",
  displayName: "Headhunter Heavy Belt",
  baseName: "Heavy Belt",
  className: "Belts",
  classSlug: "Belts",
}
const andvarius = {
  name: "Andvarius",
  displayName: "Andvarius Gold Ring",
  baseName: "Gold Ring",
  className: "Rings",
  classSlug: "Rings",
}

const catalog = {
  classes: [
    { name: "Amulets", slug: "Amulets", uniques: [beacon, astramentis] },
    { name: "Belts", slug: "Belts", uniques: [headhunter] },
    { name: "Rings", slug: "Rings", uniques: [andvarius] },
  ],
  uniques: [headhunter, beacon, andvarius, astramentis],
}

describe("pickit unique rules", () => {
  it("uses the first unique class as the default selection", () => {
    const result = resolveUniqueSelectionItems({}, catalog)

    expect(getDefaultUniqueSelection(catalog)).toBe("Amulets")
    expect(result.items.map((unique) => unique.displayName)).toEqual([
      "Astramentis Stellar Amulet",
      "Beacon of Azis Solar Amulet",
    ])
  })

  it("resolves all unique items", () => {
    const result = resolveUniqueSelectionItems({ singleGroupSelection: UNIQUE_SINGLE_GROUP_SELECTION.ALL }, catalog)

    expect(result.items.map((unique) => unique.displayName)).toEqual([
      "Andvarius Gold Ring",
      "Astramentis Stellar Amulet",
      "Beacon of Azis Solar Amulet",
      "Headhunter Heavy Belt",
    ])
  })

  it("resolves single unique selections through the search-filtered list", () => {
    const result = resolveUniqueSelectionItems(
      {
        singleGroupSelection: UNIQUE_SINGLE_GROUP_SELECTION.SINGLE,
        searchText: "heavy",
        selectedItemDisplayName: "Headhunter Heavy Belt",
      },
      catalog
    )

    expect(filterUniquesBySearch(catalog.uniques, "HEAD").map((unique) => unique.displayName)).toEqual([
      "Headhunter Heavy Belt",
    ])
    expect(filterUniquesBySearch(catalog.uniques, "gold ring").map((unique) => unique.displayName)).toEqual([
      "Andvarius Gold Ring",
    ])
    expect(result.items.map((unique) => unique.displayName)).toEqual(["Headhunter Heavy Belt"])
  })

  it("resolves all uniques in a selected class", () => {
    const result = resolveUniqueSelectionItems(
      {
        singleGroupSelection: "Amulets",
        selectedGroupItemDisplayName: UNIQUE_GROUP_ALL_VALUE,
      },
      catalog
    )

    expect(result.items.map((unique) => unique.displayName)).toEqual([
      "Astramentis Stellar Amulet",
      "Beacon of Azis Solar Amulet",
    ])
  })

  it("resolves one selected unique in a class", () => {
    const result = resolveUniqueSelectionItems(
      {
        singleGroupSelection: "Belts",
        selectedGroupItemDisplayName: "Headhunter Heavy Belt",
      },
      catalog
    )

    expect(result.items.map((unique) => unique.displayName)).toEqual(["Headhunter Heavy Belt"])
  })

  it("generates exact unique pickup rules", () => {
    const lines = generateUniqueRuleLines({
      actionFlag: "StashItem",
      catalog,
      draft: {
        singleGroupSelection: "Belts",
        selectedGroupItemDisplayName: "Headhunter Heavy Belt",
      },
    })

    expect(lines).toEqual([
      '[Type] == "Heavy Belt" && [Rarity] == "Unique" # [UniqueName] == "Headhunter" && [StashItem] == "true"',
    ])
  })

  it("formats only ranged unique stats without redundant range suffixes", () => {
    const statOptions = getUniqueStatOptions(astramentis)

    expect(statOptions.map((statOption) => formatUniqueStatOptionLabel(statOption))).toEqual([
      "+(5-7) to all Attributes",
      "+(50-100) to all Attributes",
    ])
  })

  it("aggregates duplicate selected unique stat ids into one minimum condition", () => {
    const statOptions = getUniqueStatOptions(astramentis)

    const conditions = buildUniqueStatConditions(astramentis, [
      { selectedStatKey: statOptions[0].key, minimumValue: "7" },
      { selectedStatKey: statOptions[1].key, minimumValue: "100" },
    ])

    expect(conditions).toEqual(['[additional_all_attributes] >= "107"'])
  })

  it("adds selected unique stat minimums to the generated pickup rule", () => {
    const statOptions = getUniqueStatOptions(astramentis)
    const lines = generateUniqueRuleLines({
      actionFlag: "StashItem",
      catalog,
      draft: {
        singleGroupSelection: "Amulets",
        selectedGroupItemDisplayName: "Astramentis Stellar Amulet",
        statSlots: [
          { selectedStatKey: statOptions[0].key, minimumValue: "7" },
          { selectedStatKey: statOptions[1].key, minimumValue: "100" },
        ],
      },
    })

    expect(lines).toEqual([
      '[Type] == "Stellar Amulet" && [Rarity] == "Unique" # [UniqueName] == "Astramentis" && [additional_all_attributes] >= "107" && [StashItem] == "true"',
    ])
  })

  it("adds a summary comment without a class header for one selected unique", () => {
    const lines = generateUniqueRuleLines({
      actionFlag: "StashItem",
      includeExplanation: true,
      catalog,
      draft: {
        singleGroupSelection: UNIQUE_SINGLE_GROUP_SELECTION.SINGLE,
        searchText: "head",
        selectedItemDisplayName: "Headhunter Heavy Belt",
      },
    })

    expect(lines).toEqual([
      "// Picks up Headhunter Heavy Belt (1 item)",
      '[Type] == "Heavy Belt" && [Rarity] == "Unique" # [UniqueName] == "Headhunter" && [StashItem] == "true"',
    ])
  })

  it("adds class headers and alphabetizes items when explanations are enabled", () => {
    const lines = generateUniqueRuleLines({
      actionFlag: "StashItem",
      includeExplanation: true,
      catalog,
      draft: {
        singleGroupSelection: UNIQUE_SINGLE_GROUP_SELECTION.ALL,
      },
    })

    expect(lines).toEqual([
      "// Picks up all uniques (4 items)",
      "// Amulets",
      '[Type] == "Stellar Amulet" && [Rarity] == "Unique" # [UniqueName] == "Astramentis" && [StashItem] == "true"',
      '[Type] == "Solar Amulet" && [Rarity] == "Unique" # [UniqueName] == "Beacon of Azis" && [StashItem] == "true"',
      "// Belts",
      '[Type] == "Heavy Belt" && [Rarity] == "Unique" # [UniqueName] == "Headhunter" && [StashItem] == "true"',
      "// Rings",
      '[Type] == "Gold Ring" && [Rarity] == "Unique" # [UniqueName] == "Andvarius" && [StashItem] == "true"',
    ])
  })
})
