import { describe, expect, it } from "vitest"

import {
  escapePickitString,
  formatPickitCondition,
  formatPickitFlagCondition,
  formatPickitRule,
  formatPickitValue,
} from "../src/domain/pickit/formatter.js"

describe("pickit formatter", () => {
  it("escapes quoted pickit strings", () => {
    expect(escapePickitString('A "quoted" \\ value')).toBe('A \\"quoted\\" \\\\ value')
    expect(formatPickitValue('A "quoted" \\ value')).toBe('"A \\"quoted\\" \\\\ value"')
  })

  it("formats bracketed and raw-field conditions", () => {
    expect(formatPickitCondition("Type", "==", "Divine Orb")).toBe('[Type] == "Divine Orb"')
    expect(formatPickitCondition("base_maximum_life", ">=", 20, { bracketField: false })).toBe(
      'base_maximum_life >= "20"'
    )
  })

  it("joins before and after identify rule sections", () => {
    expect(
      formatPickitRule(
        [formatPickitCondition("Type", "==", "Heavy Belt"), formatPickitCondition("Rarity", "==", "Unique")],
        [formatPickitCondition("UniqueName", "==", "Headhunter"), formatPickitFlagCondition("StashItem")]
      )
    ).toBe('[Type] == "Heavy Belt" && [Rarity] == "Unique" # [UniqueName] == "Headhunter" && [StashItem] == "true"')
  })
})
