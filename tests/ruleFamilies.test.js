import { computed, ref } from "vue"
import { describe, expect, it } from "vitest"

import { useActiveRuleFamilyRuntime } from "../src/composables/useActiveRuleFamilyRuntime.js"
import {
  ALL_RULE_FAMILY_DEFINITIONS,
  getRuleFamilyDefinition,
  getRuleFamilyOptions,
  PLANNED_RULE_FAMILY_DEFINITIONS,
  RULE_FAMILY,
  RULE_FAMILY_DEFINITIONS,
  RULE_FAMILY_STATUS,
} from "../src/domain/pickit/ruleFamilies.js"

describe("rule family registry", () => {
  it("exposes implemented family options from registry definitions", () => {
    expect(getRuleFamilyOptions()).toEqual([
      { value: RULE_FAMILY.ITEM, label: "Item" },
      { value: RULE_FAMILY.CURRENCY, label: "Currency" },
      { value: RULE_FAMILY.UNIQUE, label: "Unique" },
    ])

    expect(RULE_FAMILY_DEFINITIONS.every((definition) => definition.status === RULE_FAMILY_STATUS.IMPLEMENTED)).toBe(
      true
    )
  })

  it("documents each implemented family editor, loader, generator, draft, and capabilities", () => {
    for (const definition of RULE_FAMILY_DEFINITIONS) {
      expect(definition.editorComponent).toEqual(expect.any(String))
      expect(definition.loader).toEqual(expect.any(String))
      expect(definition.lineGenerator).toEqual(expect.any(String))
      expect(definition.defaultDraft).toEqual(expect.any(Object))
      expect(definition.capabilities).toEqual(expect.any(Object))
    }

    expect(getRuleFamilyDefinition("unknown").id).toBe(RULE_FAMILY.ITEM)
    expect(getRuleFamilyDefinition(RULE_FAMILY.UNIQUE).capabilities.statMinimums).toBe(true)
  })

  it("keeps planned families documented but hidden from active options", () => {
    expect(PLANNED_RULE_FAMILY_DEFINITIONS.map((definition) => definition.id)).toEqual([
      RULE_FAMILY.WAYSTONE,
      RULE_FAMILY.GEM,
      RULE_FAMILY.ITEM_TIER,
      RULE_FAMILY.WEIGHTED_SUM,
    ])
    expect(
      PLANNED_RULE_FAMILY_DEFINITIONS.every((definition) => definition.status === RULE_FAMILY_STATUS.PLANNED)
    ).toBe(true)
    expect(getRuleFamilyOptions().map((option) => option.value)).not.toContain(RULE_FAMILY.WAYSTONE)
    expect(ALL_RULE_FAMILY_DEFINITIONS).toHaveLength(7)
  })

  it("can resolve planned family metadata without exposing the family in the UI", () => {
    const waystoneDefinition = getRuleFamilyDefinition(RULE_FAMILY.WAYSTONE)

    expect(waystoneDefinition.status).toBe(RULE_FAMILY_STATUS.PLANNED)
    expect(waystoneDefinition.capabilities.waystoneTierRules).toBe(true)
  })

  it("selects active runtime behavior through the shared runtime composable", async () => {
    const activeFamily = ref(RULE_FAMILY.ITEM)
    const loadedFamilies = []
    const runtime = useActiveRuleFamilyRuntime(activeFamily, {
      [RULE_FAMILY.ITEM]: {
        generatedLines: computed(() => ["item-line"]),
        isLoading: ref(false),
        errorMessage: ref(""),
      },
      [RULE_FAMILY.CURRENCY]: {
        generatedLines: computed(() => ["currency-line"]),
        isLoading: ref(false),
        errorMessage: ref(""),
        ensureLoaded: () => loadedFamilies.push(RULE_FAMILY.CURRENCY),
      },
    })

    expect(runtime.activeGeneratedLines.value).toEqual(["item-line"])

    activeFamily.value = RULE_FAMILY.CURRENCY
    await Promise.resolve()

    expect(runtime.activeRuleFamily.value.id).toBe(RULE_FAMILY.CURRENCY)
    expect(runtime.activeGeneratedLines.value).toEqual(["currency-line"])
    expect(loadedFamilies).toEqual([RULE_FAMILY.CURRENCY])
  })
})
