/**
 * @typedef {"item" | "currency" | "unique"} RuleFamilyId
 *
 * @typedef {{
 *   familyId: RuleFamilyId,
 *   lines: string[],
 * }} GeneratedRule
 *
 * @typedef {{
 *   selectedItemSlug: string,
 *   selectedRarity: string,
 *   selectedBaseName: string,
 *   affixSlots: Array<object>,
 * }} ItemRuleDraft
 *
 * @typedef {{
 *   mode: "tier" | "singleGroup",
 *   selectedTier: string,
 *   singleGroupSelection: string,
 *   searchText: string,
 *   selectedItemName: string,
 *   selectedGroupItemName: string,
 * }} CurrencyRuleDraft
 *
 * @typedef {{
 *   singleGroupSelection: string,
 *   searchText: string,
 *   selectedItemDisplayName: string,
 *   selectedGroupItemDisplayName: string,
 *   statSlots: Array<object>,
 * }} UniqueRuleDraft
 */

export const RULE_FAMILY = {
  ITEM: "item",
  CURRENCY: "currency",
  UNIQUE: "unique",
  WAYSTONE: "waystone",
  GEM: "gem",
  ITEM_TIER: "itemTier",
  WEIGHTED_SUM: "weightedSum",
}

export const RULE_FAMILY_STATUS = {
  IMPLEMENTED: "implemented",
  PLANNED: "planned",
  HIDDEN: "hidden",
}

export const RULE_FAMILY_DEFINITIONS = [
  {
    id: RULE_FAMILY.ITEM,
    label: "Item",
    status: RULE_FAMILY_STATUS.IMPLEMENTED,
    editorComponent: "ItemRuleEditor",
    loader: "itemAffixCatalog",
    lineGenerator: "generateRulePreviewLines",
    requiresRuntimeCatalog: false,
    capabilities: {
      affixSlots: true,
      baseSelection: true,
      raritySelection: true,
      groupedSelection: false,
      statMinimums: false,
      exactTypeRules: false,
    },
    defaultDraft: {
      selectedItemSlug: "",
      selectedRarity: "Normal",
      selectedBaseName: "",
      affixSlots: [],
    },
  },
  {
    id: RULE_FAMILY.CURRENCY,
    label: "Currency",
    status: RULE_FAMILY_STATUS.IMPLEMENTED,
    editorComponent: "CurrencyRuleEditor",
    loader: "loadCurrencyCatalog",
    lineGenerator: "generateCurrencyRuleLines",
    requiresRuntimeCatalog: true,
    capabilities: {
      affixSlots: false,
      baseSelection: false,
      raritySelection: false,
      groupedSelection: true,
      statMinimums: false,
      exactTypeRules: true,
    },
    defaultDraft: {
      mode: "tier",
      selectedTier: "all",
      singleGroupSelection: "all",
      searchText: "",
      selectedItemName: "",
      selectedGroupItemName: "all",
    },
  },
  {
    id: RULE_FAMILY.UNIQUE,
    label: "Unique",
    status: RULE_FAMILY_STATUS.IMPLEMENTED,
    editorComponent: "UniqueRuleEditor",
    loader: "loadUniqueCatalog",
    lineGenerator: "generateUniqueRuleLines",
    requiresRuntimeCatalog: true,
    capabilities: {
      affixSlots: false,
      baseSelection: false,
      raritySelection: false,
      groupedSelection: true,
      statMinimums: true,
      exactTypeRules: true,
    },
    defaultDraft: {
      singleGroupSelection: "",
      searchText: "",
      selectedItemDisplayName: "",
      selectedGroupItemDisplayName: "all",
      statSlots: [],
    },
  },
]

export const PLANNED_RULE_FAMILY_DEFINITIONS = [
  {
    id: RULE_FAMILY.WAYSTONE,
    label: "Waystone",
    status: RULE_FAMILY_STATUS.PLANNED,
    editorComponent: "WaystoneRuleEditor",
    loader: "notImplemented",
    lineGenerator: "notImplemented",
    requiresRuntimeCatalog: true,
    capabilities: {
      waystoneTierRules: true,
    },
    defaultDraft: {},
  },
  {
    id: RULE_FAMILY.GEM,
    label: "Gem",
    status: RULE_FAMILY_STATUS.PLANNED,
    editorComponent: "GemRuleEditor",
    loader: "notImplemented",
    lineGenerator: "notImplemented",
    requiresRuntimeCatalog: true,
    capabilities: {
      gemLevelRules: true,
    },
    defaultDraft: {},
  },
  {
    id: RULE_FAMILY.ITEM_TIER,
    label: "Item tier",
    status: RULE_FAMILY_STATUS.PLANNED,
    editorComponent: "ItemTierRuleEditor",
    loader: "notImplemented",
    lineGenerator: "notImplemented",
    requiresRuntimeCatalog: true,
    capabilities: {
      itemTierRules: true,
    },
    defaultDraft: {},
  },
  {
    id: RULE_FAMILY.WEIGHTED_SUM,
    label: "Weighted sum",
    status: RULE_FAMILY_STATUS.PLANNED,
    editorComponent: "WeightedSumRuleEditor",
    loader: "notImplemented",
    lineGenerator: "notImplemented",
    requiresRuntimeCatalog: true,
    capabilities: {
      weightedScoring: true,
    },
    defaultDraft: {},
  },
]

export const ALL_RULE_FAMILY_DEFINITIONS = [...RULE_FAMILY_DEFINITIONS, ...PLANNED_RULE_FAMILY_DEFINITIONS]

export const RULE_FAMILY_OPTIONS = getRuleFamilyOptions()

export function getRuleFamilyOptions() {
  return RULE_FAMILY_DEFINITIONS.filter((definition) => definition.status === RULE_FAMILY_STATUS.IMPLEMENTED).map(
    (definition) => ({
      value: definition.id,
      label: definition.label,
    })
  )
}

export function getRuleFamilyDefinition(ruleFamilyId) {
  return ALL_RULE_FAMILY_DEFINITIONS.find((definition) => definition.id === ruleFamilyId) || RULE_FAMILY_DEFINITIONS[0]
}
