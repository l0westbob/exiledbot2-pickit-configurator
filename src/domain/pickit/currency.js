import { resolvePickitActionFlag } from "./actions.js"
import { formatPickitComment, formatPickitCondition, formatPickitFlagCondition, formatPickitRule } from "./formatter.js"

export const CURRENCY_SELECTION_MODE = {
  TIER: "tier",
  SINGLE_GROUP: "singleGroup",
}

export const CURRENCY_SELECTION_MODE_OPTIONS = [
  { value: CURRENCY_SELECTION_MODE.TIER, label: "By tier" },
  { value: CURRENCY_SELECTION_MODE.SINGLE_GROUP, label: "Single/group" },
]

export const CURRENCY_SINGLE_GROUP_SELECTION = {
  ALL: "all",
  SINGLE: "single",
}

export const CURRENCY_GROUP_ALL_VALUE = "all"
export const CURRENCY_ALL_TIERS_VALUE = "all"
export const DEFAULT_CURRENCY_TIER = CURRENCY_ALL_TIERS_VALUE

function dedupeItemsByName(items) {
  const seenNames = new Set()
  const dedupedItems = []

  for (const item of Array.isArray(items) ? items : []) {
    const name = typeof item?.name === "string" ? item.name.trim() : ""
    if (!name || seenNames.has(name)) continue
    seenNames.add(name)
    dedupedItems.push(item)
  }

  return dedupedItems
}

function sortItemsByName(items) {
  return [...(Array.isArray(items) ? items : [])].sort((left, right) => left.name.localeCompare(right.name))
}

function findItemByName(items, itemName) {
  const normalizedName = typeof itemName === "string" ? itemName.trim() : ""
  if (!normalizedName) return null
  return (Array.isArray(items) ? items : []).find((item) => item.name === normalizedName) || null
}

function findCategoryBySlug(categories, categorySlug) {
  const normalizedSlug = typeof categorySlug === "string" ? categorySlug.trim() : ""
  if (!normalizedSlug) return null
  return (Array.isArray(categories) ? categories : []).find((category) => category.slug === normalizedSlug) || null
}

function describeCurrencySelection(draft, items, category) {
  if (draft.mode === CURRENCY_SELECTION_MODE.TIER) {
    const selectedTier = draft.selectedTier || DEFAULT_CURRENCY_TIER
    return selectedTier === CURRENCY_ALL_TIERS_VALUE ? "all currency tiers" : `currency tier ${selectedTier}`
  }

  if (draft.singleGroupSelection === CURRENCY_SINGLE_GROUP_SELECTION.ALL) {
    return "all currency/economy items"
  }

  if (draft.singleGroupSelection === CURRENCY_SINGLE_GROUP_SELECTION.SINGLE) {
    return items[0]?.name || "selected currency item"
  }

  if (category && draft.selectedGroupItemName === CURRENCY_GROUP_ALL_VALUE) {
    return `${category.name} items`
  }

  if (category && items[0]?.name) {
    return `${items[0].name} from ${category.name}`
  }

  return "selected currency items"
}

export function filterCurrencyItemsBySearch(items, searchText) {
  const normalizedSearchText = typeof searchText === "string" ? searchText.trim().toLowerCase() : ""
  const rawItems = Array.isArray(items) ? items : []
  if (!normalizedSearchText) return rawItems

  return rawItems.filter((item) => {
    const itemName = typeof item?.name === "string" ? item.name.toLowerCase() : ""
    return itemName.includes(normalizedSearchText)
  })
}

export function resolveCurrencySelectionItems(draft, catalog) {
  const categories = Array.isArray(catalog?.categories) ? catalog.categories : []
  const allItems = Array.isArray(catalog?.items) ? catalog.items : []
  const tiers = Array.isArray(catalog?.tiers) ? catalog.tiers : []

  if (draft?.mode === CURRENCY_SELECTION_MODE.TIER) {
    const selectedTierName = draft?.selectedTier || DEFAULT_CURRENCY_TIER
    if (selectedTierName === CURRENCY_ALL_TIERS_VALUE) {
      const items = sortItemsByName(dedupeItemsByName(allItems))
      return {
        items,
        description: describeCurrencySelection({ ...draft, selectedTier: selectedTierName }, items, null),
      }
    }

    const selectedTier = tiers.find((tier) => tier.name === selectedTierName) || null
    const items = sortItemsByName(dedupeItemsByName(selectedTier?.items || []))
    return {
      items,
      description: describeCurrencySelection({ ...draft, selectedTier: selectedTierName }, items, null),
    }
  }

  const singleGroupSelection = draft?.singleGroupSelection || CURRENCY_SINGLE_GROUP_SELECTION.ALL
  if (singleGroupSelection === CURRENCY_SINGLE_GROUP_SELECTION.ALL) {
    const items = sortItemsByName(dedupeItemsByName(allItems))
    return {
      items,
      description: describeCurrencySelection({ ...draft, singleGroupSelection }, items, null),
    }
  }

  if (singleGroupSelection === CURRENCY_SINGLE_GROUP_SELECTION.SINGLE) {
    const filteredItems = sortItemsByName(filterCurrencyItemsBySearch(allItems, draft?.searchText))
    const selectedItem = findItemByName(filteredItems, draft?.selectedItemName) || filteredItems[0] || null
    const items = dedupeItemsByName(selectedItem ? [selectedItem] : [])
    return {
      items,
      description: describeCurrencySelection({ ...draft, singleGroupSelection }, items, null),
    }
  }

  const selectedCategory = findCategoryBySlug(categories, singleGroupSelection)
  const selectedGroupItemName = draft?.selectedGroupItemName || CURRENCY_GROUP_ALL_VALUE
  if (!selectedCategory) return { items: [], description: "selected currency items" }

  if (selectedGroupItemName === CURRENCY_GROUP_ALL_VALUE) {
    const items = sortItemsByName(dedupeItemsByName(selectedCategory.items))
    return {
      items,
      description: describeCurrencySelection({ ...draft, selectedGroupItemName }, items, selectedCategory),
    }
  }

  const selectedItem = findItemByName(selectedCategory.items, selectedGroupItemName)
  const items = sortItemsByName(dedupeItemsByName(selectedItem ? [selectedItem] : []))
  return {
    items,
    description: describeCurrencySelection({ ...draft, selectedGroupItemName }, items, selectedCategory),
  }
}

function groupItemsByCategory(items, catalog) {
  const categoryOrder = new Map(
    (Array.isArray(catalog?.categories) ? catalog.categories : []).map((category, index) => [category.slug, index])
  )
  const groupBySlug = new Map()

  for (const item of Array.isArray(items) ? items : []) {
    const categorySlug = item?.categorySlug || ""
    const categoryName = item?.categoryName || categorySlug || "Currency"

    if (!groupBySlug.has(categorySlug)) {
      groupBySlug.set(categorySlug, {
        categorySlug,
        categoryName,
        items: [],
      })
    }

    groupBySlug.get(categorySlug).items.push(item)
  }

  return [...groupBySlug.values()]
    .sort((left, right) => {
      const leftIndex = categoryOrder.has(left.categorySlug)
        ? categoryOrder.get(left.categorySlug)
        : Number.MAX_SAFE_INTEGER
      const rightIndex = categoryOrder.has(right.categorySlug)
        ? categoryOrder.get(right.categorySlug)
        : Number.MAX_SAFE_INTEGER
      if (leftIndex !== rightIndex) return leftIndex - rightIndex
      return left.categoryName.localeCompare(right.categoryName)
    })
    .map((group) => ({
      ...group,
      items: sortItemsByName(group.items),
    }))
}

export function generateCurrencyRuleLines(params) {
  const actionFlag = resolvePickitActionFlag(params?.actionFlag)
  const { items, description } = resolveCurrencySelectionItems(params?.draft, params?.catalog)
  const groups = groupItemsByCategory(items, params?.catalog)
  const ruleLines = groups.flatMap((group) => {
    return group.items.map((item) => createCurrencyRuleLine(item, actionFlag))
  })

  if (!params?.includeExplanation || !ruleLines.length) return ruleLines

  const explainedLines = [
    formatPickitComment(`Picks up ${description} (${items.length} ${items.length === 1 ? "item" : "items"})`),
  ]
  for (const group of groups) {
    if (items.length > 1) explainedLines.push(formatPickitComment(group.categoryName))
    explainedLines.push(...group.items.map((item) => createCurrencyRuleLine(item, actionFlag)))
  }

  return explainedLines
}

function createCurrencyRuleLine(item, actionFlag) {
  return formatPickitRule([formatPickitCondition("Type", "==", item.name)], [formatPickitFlagCondition(actionFlag)])
}
