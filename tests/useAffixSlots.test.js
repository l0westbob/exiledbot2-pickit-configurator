import {nextTick, ref} from "vue"
import {describe, expect, it} from "vitest"

import {useAffixSlots} from "../src/composables/useAffixSlots.js"

const prefixOne = {
  modifierSection: "normal",
  family_key: "Life",
  kind: "prefix",
  template: "+# to Life",
  tiers: [],
}
const prefixTwo = {
  modifierSection: "normal",
  family_key: "Mana",
  kind: "prefix",
  template: "+# to Mana",
  tiers: [],
}
const suffixOne = {
  modifierSection: "normal",
  family_key: "Strength",
  kind: "suffix",
  template: "+# to Strength",
  tiers: [],
}

describe("useAffixSlots", () => {
  it("hides earlier selections from later slots", () => {
    const affixesRef = ref([prefixOne, prefixTwo, suffixOne])
    const api = useAffixSlots({affixesRef, maxSlots: 3, maxPrefixes: 2, maxSuffixes: 1})

    api.slots.value[0].selectedAffixKey = api.affixKey(prefixOne)
    api.addSlot()

    const availableKeysInSecondSlot = api.groupsForSlot(1)
      .flatMap((group) => group.items)
      .map((affix) => api.affixKey(affix))

    expect(availableKeysInSecondSlot).not.toContain(api.affixKey(prefixOne))
    expect(availableKeysInSecondSlot).toContain(api.affixKey(prefixTwo))
  })

  it("clears the selected tier when the chosen affix changes", async () => {
    const affixesRef = ref([prefixOne, prefixTwo])
    const api = useAffixSlots({affixesRef, maxSlots: 2, maxPrefixes: 2, maxSuffixes: 0})

    api.slots.value[0].selectedAffixKey = api.affixKey(prefixOne)
    api.slots.value[0].selectedTierLevel = 42

    api.slots.value[0].selectedAffixKey = api.affixKey(prefixTwo)
    await nextTick()

    expect(api.slots.value[0].selectedTierLevel).toBeNull()
  })

  it("stops offering new slots when all unique affixes are already used", () => {
    const affixesRef = ref([prefixOne])
    const api = useAffixSlots({affixesRef, maxSlots: 3, maxPrefixes: 3, maxSuffixes: 0})

    api.slots.value[0].selectedAffixKey = api.affixKey(prefixOne)

    expect(api.canAddSlot.value).toBe(false)
    expect(api.addDisabledReason.value).toBe("No valid affixes left to add.")
  })

  it("groups normal affixes with prefixes before suffixes", () => {
    const affixesRef = ref([suffixOne, prefixTwo, prefixOne])
    const api = useAffixSlots({affixesRef, maxSlots: 6, maxPrefixes: 3, maxSuffixes: 3})

    const groups = api.groupsForSlot(0)

    expect(groups.map((group) => group.label)).toEqual(["-- Normal Prefixes --", "-- Normal Suffixes --"])
    expect(groups[0].items.map((affix) => affix.template)).toEqual(["+# to Life", "+# to Mana"])
    expect(groups[1].items.map((affix) => affix.template)).toEqual(["+# to Strength"])
  })
})
