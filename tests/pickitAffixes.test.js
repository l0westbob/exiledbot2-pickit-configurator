import { describe, expect, it } from "vitest"

import { filterVisibleAffixes } from "../src/domain/pickit/affixes.js"

describe("pickit affix visibility", () => {
  it("only exposes normal prefixes and suffixes to the active picker", () => {
    const visibleAffixes = filterVisibleAffixes([
      {
        modifierSection: "normal",
        family_key: "Life",
        kind: "prefix",
        template: "+# to Life",
        tiers: [],
      },
      {
        modifierSection: "normal",
        family_key: "Strength",
        kind: "suffix",
        template: "+# to Strength",
        tiers: [],
      },
      {
        modifierSection: "essence",
        family_key: "EssenceLife",
        kind: "prefix",
        template: "+# to Essence Life",
        tiers: [],
      },
      {
        modifierSection: "desecrated",
        family_key: "DesecratedStrength",
        kind: "suffix",
        template: "+# to Desecrated Strength",
        tiers: [],
      },
      {
        modifierSection: "normal",
        family_key: "GrantedSkill",
        kind: "granted_skill",
        template: "Grants #",
        tiers: [],
      },
      {
        modifierSection: "normal",
        family_key: "MissingTiers",
        kind: "prefix",
        template: "+# to Missing Tiers",
      },
    ])

    expect(visibleAffixes.map((affixFamily) => affixFamily.family_key)).toEqual(["Life", "Strength"])
  })
})
