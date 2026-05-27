import {resolvePickitActionFlag} from "./actions.js"

export const UNIQUE_SINGLE_GROUP_SELECTION = {
  ALL: "all",
  SINGLE: "single",
}

export const UNIQUE_GROUP_ALL_VALUE = "all"

function sortUniquesByDisplayName(uniques) {
  return [...(Array.isArray(uniques) ? uniques : [])].sort((left, right) => {
    return left.displayName.localeCompare(right.displayName)
  })
}

function dedupeUniquesByDisplayName(uniques) {
  const seenDisplayNames = new Set()
  const dedupedUniques = []

  for (const unique of Array.isArray(uniques) ? uniques : []) {
    const displayName = typeof unique?.displayName === "string" ? unique.displayName.trim() : ""
    if (!displayName || seenDisplayNames.has(displayName)) continue
    seenDisplayNames.add(displayName)
    dedupedUniques.push(unique)
  }

  return dedupedUniques
}

function findUniqueByDisplayName(uniques, displayName) {
  const normalizedDisplayName = typeof displayName === "string" ? displayName.trim() : ""
  if (!normalizedDisplayName) return null
  return (Array.isArray(uniques) ? uniques : []).find((unique) => unique.displayName === normalizedDisplayName) || null
}

function findUniqueClassBySlug(classes, classSlug) {
  const normalizedClassSlug = typeof classSlug === "string" ? classSlug.trim() : ""
  if (!normalizedClassSlug) return null
  return (Array.isArray(classes) ? classes : []).find((uniqueClass) => uniqueClass.slug === normalizedClassSlug) || null
}

function describeUniqueSelection(draft, items, uniqueClass) {
  const singleGroupSelection = draft?.singleGroupSelection || getDefaultUniqueSelection({classes: uniqueClass ? [uniqueClass] : []})

  if (singleGroupSelection === UNIQUE_SINGLE_GROUP_SELECTION.ALL) {
    return "all uniques"
  }

  if (singleGroupSelection === UNIQUE_SINGLE_GROUP_SELECTION.SINGLE) {
    return items[0]?.displayName || "selected unique"
  }

  if (uniqueClass && draft?.selectedGroupItemDisplayName === UNIQUE_GROUP_ALL_VALUE) {
    return `${uniqueClass.name} uniques`
  }

  if (uniqueClass && items[0]?.displayName) {
    return `${items[0].displayName} from ${uniqueClass.name}`
  }

  return "selected uniques"
}

function escapePickitString(value) {
  return String(value).replaceAll("\\", "\\\\").replaceAll('"', '\\"')
}

function normalizeUniqueStatIds(stat) {
  const rawIds = Array.isArray(stat?.affix_ids) && stat.affix_ids.length
    ? stat.affix_ids
    : stat?.stat_ids

  return (Array.isArray(rawIds) ? rawIds : [])
    .map((statId) => (typeof statId === "string" ? statId.trim() : ""))
    .filter(Boolean)
}

function normalizeUniqueStatRolls(stat) {
  return (Array.isArray(stat?.rolls) ? stat.rolls : [])
    .map((roll) => ({
      min: Number(roll?.min),
      max: Number(roll?.max),
    }))
    .filter((roll) => Number.isFinite(roll.min) && Number.isFinite(roll.max))
}

function normalizeMinimumValue(value) {
  if (typeof value === "string" && !value.trim()) return null
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : null
}

function formatPickitNumber(value) {
  if (!Number.isFinite(value)) return ""
  return Number.isInteger(value) ? String(value) : String(value)
}

export function getDefaultUniqueSelection(catalog) {
  const classes = Array.isArray(catalog?.classes) ? catalog.classes : []
  return classes[0]?.slug || UNIQUE_SINGLE_GROUP_SELECTION.ALL
}

export function getUniqueStatKey(stat, statIndex) {
  const statIds = normalizeUniqueStatIds(stat)
  const text = typeof stat?.text === "string" ? stat.text.trim() : ""
  return `${statIndex}|${statIds.join("|")}|${text}`
}

export function getUniqueStatOptions(unique) {
  const stats = Array.isArray(unique?.stats) ? unique.stats : []

  return stats
    .map((stat, statIndex) => {
      const statIds = normalizeUniqueStatIds(stat)
      if (!statIds.length) return null

      const rolls = normalizeUniqueStatRolls(stat)
      if (!rolls.length) return null

      const text = typeof stat?.text === "string" ? stat.text.trim() : ""
      const template = typeof stat?.template === "string" ? stat.template.trim() : ""

      return {
        key: getUniqueStatKey(stat, statIndex),
        text,
        template,
        statIds,
        rolls,
      }
    })
    .filter(Boolean)
}

export function formatUniqueStatOptionLabel(statOption) {
  return statOption?.text || statOption?.template || statOption?.statIds?.join(", ") || "Unnamed stat"
}

export function filterUniquesBySearch(uniques, searchText) {
  const normalizedSearchText = typeof searchText === "string" ? searchText.trim().toLowerCase() : ""
  const rawUniques = Array.isArray(uniques) ? uniques : []
  if (!normalizedSearchText) return rawUniques

  return rawUniques.filter((unique) => {
    const searchableValues = [unique?.name, unique?.displayName, unique?.baseName]
      .map((value) => (typeof value === "string" ? value.toLowerCase() : ""))

    return searchableValues.some((value) => value.includes(normalizedSearchText))
  })
}

export function resolveUniqueSelectionItems(draft, catalog) {
  const classes = Array.isArray(catalog?.classes) ? catalog.classes : []
  const allUniques = Array.isArray(catalog?.uniques) ? catalog.uniques : []
  const singleGroupSelection = draft?.singleGroupSelection || getDefaultUniqueSelection(catalog)

  if (singleGroupSelection === UNIQUE_SINGLE_GROUP_SELECTION.ALL) {
    const items = sortUniquesByDisplayName(dedupeUniquesByDisplayName(allUniques))
    return {
      items,
      description: describeUniqueSelection({...draft, singleGroupSelection}, items, null),
    }
  }

  if (singleGroupSelection === UNIQUE_SINGLE_GROUP_SELECTION.SINGLE) {
    const filteredUniques = sortUniquesByDisplayName(filterUniquesBySearch(allUniques, draft?.searchText))
    const selectedUnique = findUniqueByDisplayName(filteredUniques, draft?.selectedItemDisplayName) || filteredUniques[0] || null
    const items = dedupeUniquesByDisplayName(selectedUnique ? [selectedUnique] : [])
    return {
      items,
      description: describeUniqueSelection({...draft, singleGroupSelection}, items, null),
    }
  }

  const selectedClass = findUniqueClassBySlug(classes, singleGroupSelection)
  const selectedGroupItemDisplayName = draft?.selectedGroupItemDisplayName || UNIQUE_GROUP_ALL_VALUE
  if (!selectedClass) return {items: [], description: "selected uniques"}

  if (selectedGroupItemDisplayName === UNIQUE_GROUP_ALL_VALUE) {
    const items = sortUniquesByDisplayName(dedupeUniquesByDisplayName(selectedClass.uniques))
    return {
      items,
      description: describeUniqueSelection({...draft, singleGroupSelection, selectedGroupItemDisplayName}, items, selectedClass),
    }
  }

  const selectedUnique = findUniqueByDisplayName(selectedClass.uniques, selectedGroupItemDisplayName)
  const items = sortUniquesByDisplayName(dedupeUniquesByDisplayName(selectedUnique ? [selectedUnique] : []))
  return {
    items,
    description: describeUniqueSelection({...draft, singleGroupSelection, selectedGroupItemDisplayName}, items, selectedClass),
  }
}

export function groupUniquesByClass(items, catalog) {
  const classOrder = new Map(
    (Array.isArray(catalog?.classes) ? catalog.classes : []).map((uniqueClass, index) => [uniqueClass.slug, index])
  )
  const groupBySlug = new Map()

  for (const unique of Array.isArray(items) ? items : []) {
    const classSlug = unique?.classSlug || ""
    const className = unique?.className || classSlug || "Uniques"

    if (!groupBySlug.has(classSlug)) {
      groupBySlug.set(classSlug, {
        classSlug,
        className,
        items: [],
      })
    }

    groupBySlug.get(classSlug).items.push(unique)
  }

  return [...groupBySlug.values()]
    .sort((left, right) => {
      const leftIndex = classOrder.has(left.classSlug) ? classOrder.get(left.classSlug) : Number.MAX_SAFE_INTEGER
      const rightIndex = classOrder.has(right.classSlug) ? classOrder.get(right.classSlug) : Number.MAX_SAFE_INTEGER
      if (leftIndex !== rightIndex) return leftIndex - rightIndex
      return left.className.localeCompare(right.className)
    })
    .map((group) => ({
      ...group,
      items: sortUniquesByDisplayName(group.items),
    }))
}

function createUniqueRuleLineWithConditions(unique, actionFlag, statConditions) {
  const afterIdentifyConditions = [
    `[UniqueName] == "${escapePickitString(unique.name)}"`,
    ...(Array.isArray(statConditions) ? statConditions : []),
    `[${actionFlag}] == "true"`,
  ]

  return `[Type] == "${escapePickitString(unique.baseName)}" && [Rarity] == "Unique" # ${afterIdentifyConditions.join(" && ")}`
}

export function buildUniqueStatConditions(unique, statSlots) {
  const statOptionsByKey = new Map(getUniqueStatOptions(unique).map((statOption) => [statOption.key, statOption]))
  const orderedStatIds = []
  const totalsByStatId = new Map()

  for (const slot of Array.isArray(statSlots) ? statSlots : []) {
    const statOption = statOptionsByKey.get(slot?.selectedStatKey)
    const minimumValue = normalizeMinimumValue(slot?.minimumValue)
    if (!statOption || minimumValue === null) continue

    for (const statId of statOption.statIds) {
      if (!totalsByStatId.has(statId)) {
        orderedStatIds.push(statId)
        totalsByStatId.set(statId, 0)
      }
      totalsByStatId.set(statId, totalsByStatId.get(statId) + minimumValue)
    }
  }

  return orderedStatIds
    .filter((statId) => totalsByStatId.has(statId))
    .map((statId) => `[${statId}] >= "${formatPickitNumber(totalsByStatId.get(statId))}"`)
}

export function generateUniqueRuleLines(params) {
  const actionFlag = resolvePickitActionFlag(params?.actionFlag)
  const {items, description} = resolveUniqueSelectionItems(params?.draft, params?.catalog)
  const groups = groupUniquesByClass(items, params?.catalog)
  const selectedUniqueForStats = items.length === 1 ? items[0] : null
  const statConditions = selectedUniqueForStats
    ? buildUniqueStatConditions(selectedUniqueForStats, params?.draft?.statSlots)
    : []
  const ruleLines = groups.flatMap((group) => {
    return group.items.map((unique) => createUniqueRuleLineWithConditions(unique, actionFlag, statConditions))
  })

  if (!params?.includeExplanation || !ruleLines.length) return ruleLines

  const explainedLines = [`// Picks up ${description} (${items.length} ${items.length === 1 ? "item" : "items"})`]
  for (const group of groups) {
    if (items.length > 1) explainedLines.push(`// ${group.className}`)
    explainedLines.push(
      ...group.items.map((unique) => createUniqueRuleLineWithConditions(unique, actionFlag, statConditions))
    )
  }

  return explainedLines
}
