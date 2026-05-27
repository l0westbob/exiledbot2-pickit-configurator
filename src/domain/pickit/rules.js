import {resolvePickitActionFlag} from "./actions.js"
import {formatAffixDisplayLabel} from "./affixes.js"
import {resolvePickitCategoryFromItem} from "./catalog.js"

export const ITEM_RARITY_OPTIONS = ["Normal", "Magic", "Rare", "Unique"]

export function countSelectedAffixes(affixSlots) {
  if (!Array.isArray(affixSlots)) return 0

  let selectedAffixCount = 0
  for (const slot of affixSlots) {
    if (slot?.selectedAffixKey) selectedAffixCount++
  }
  return selectedAffixCount
}

export function rarityFromSelectedAffixCount(selectedAffixCount) {
  if (selectedAffixCount === 0) return "Normal"
  if (selectedAffixCount <= 2) return "Magic"
  return "Rare"
}

export function normalizeItemRarity(rarity) {
  return ITEM_RARITY_OPTIONS.includes(rarity) ? rarity : "Normal"
}

/**
 * @typedef {{ level:number }} Tier
 */

export function tierIndexFromBottom(tiers, tierLevel) {
  if (!Array.isArray(tiers) || tiers.length === 0) return "?"
  if (!Number.isFinite(tierLevel)) return "?"

  const sortedTierLevelsAscending = [...tiers]
    .map((tier) => tier?.level)
    .filter((level) => Number.isFinite(level))
    .sort((left, right) => left - right)

  const indexInAscendingList = sortedTierLevelsAscending.indexOf(tierLevel)
  if (indexInAscendingList === -1) return "?"

  return sortedTierLevelsAscending.length - indexInAscendingList
}

function collectOrderedStatsAndTotals(affixSlots, findAffixByKey, availableTiersForSlot) {
  const totalsById = new Map()
  const orderedSlots = []

  if (!Array.isArray(affixSlots)) return {orderedSlots, totalsById}

  for (let slotIndex = 0; slotIndex < affixSlots.length; slotIndex++) {
    const slot = affixSlots[slotIndex]
    const selectedAffixKey = slot?.selectedAffixKey || null
    const selectedTierLevel = slot?.selectedTierLevel ?? null

    const statIdsInThisSlot = []
    orderedSlots.push(statIdsInThisSlot)

    if (!selectedAffixKey || !Number.isFinite(selectedTierLevel)) continue

    const selectedAffixFamily = findAffixByKey(selectedAffixKey)
    if (!selectedAffixFamily) continue

    const tiersRaw = availableTiersForSlot(slotIndex)
    const tiers = Array.isArray(tiersRaw) ? tiersRaw : []

    const selectedTier =
      tiers.find((tier) => Number.isFinite(tier?.level) && tier.level === selectedTierLevel) || null
    if (!selectedTier) continue

    const tierStats = Array.isArray(selectedTier?.stats) ? selectedTier.stats : []
    for (const stat of tierStats) {
      const statId = typeof stat?.id === "string" ? stat.id.trim() : ""
      if (!statId) continue

      const minValue = Number(stat?.min)
      const maxValue = Number(stat?.max)
      if (!Number.isFinite(minValue) || !Number.isFinite(maxValue)) continue

      statIdsInThisSlot.push(statId)

      const existing = totalsById.get(statId)
      if (!existing) {
        totalsById.set(statId, {id: statId, min: minValue, max: maxValue})
      } else {
        existing.min += minValue
        existing.max += maxValue
      }
    }
  }

  return {orderedSlots, totalsById}
}

function buildHumanCommentLine(params) {
  const selectedItem = params?.selectedItem || null
  const pickitCategory = selectedItem?.pickitCategory || "UNKNOWN"
  const selectedBaseName =
    typeof params?.selectedBaseName === "string" ? params.selectedBaseName.trim() : ""

  const affixSlots = Array.isArray(params?.affixSlots) ? params.affixSlots : []
  const findAffixByKey = typeof params?.findAffixByKey === "function" ? params.findAffixByKey : () => null
  const availableTiersForSlot =
    typeof params?.availableTiersForSlot === "function" ? params.availableTiersForSlot : () => []

  const inferredRarity = params?.inferredRarity || "Unknown"
  const actionFlag = params?.actionFlag || "StashItem"

  const selectedAffixDescriptions = []

  for (let slotIndex = 0; slotIndex < affixSlots.length; slotIndex++) {
    const slot = affixSlots[slotIndex]
    if (!slot?.selectedAffixKey) continue

    const affix = findAffixByKey(slot.selectedAffixKey)
    if (!affix) continue

    const tiersRaw = availableTiersForSlot(slotIndex)
    const tiers = Array.isArray(tiersRaw) ? tiersRaw : []

    const selectedTierLevel = slot?.selectedTierLevel ?? null
    const selectedTier = tiers.find((tier) => tier?.level === selectedTierLevel) || null
    const tierText = selectedTier ? `T${tierIndexFromBottom(tiers, selectedTier?.level)}` : "any tier"

    selectedAffixDescriptions.push(`${formatAffixDisplayLabel(affix)} of tier ${tierText}`)
  }

  const affixPart = selectedAffixDescriptions.length
    ? ` if they have at least ${selectedAffixDescriptions.join(", ")}`
    : ""

  const basePart = selectedBaseName ? ` base ${selectedBaseName}` : ""

  return `// Picks up ${pickitCategory}${basePart} of rarity ${inferredRarity} and ${actionFlag}${affixPart}`
}

function buildAfterIdentifyStatConditionsInSlotOrder(orderedSlots, totalsById) {
  const emitted = new Set()
  const conditions = []

  for (const statIdsInSlot of orderedSlots) {
    for (const statId of statIdsInSlot) {
      if (!statId || emitted.has(statId)) continue

      const total = totalsById.get(statId)
      if (!total) continue

      conditions.push(`${statId} >= "${total.min}"`)
      conditions.push(`${statId} <= "${total.max}"`)

      emitted.add(statId)
    }
  }

  return conditions
}

export function generateRulePreviewLines(params) {
  const selectedItemSlug = typeof params?.selectedItemSlug === "string" ? params.selectedItemSlug : ""
  if (!selectedItemSlug) return []

  const selectedItem = params?.selectedItem || null
  const pickitCategory = resolvePickitCategoryFromItem(selectedItem)

  if (!pickitCategory) {
    return ['[Category] == "UNKNOWN" # [StashItem] == "true"']
  }

  const affixSlots = Array.isArray(params?.affixSlots) ? params.affixSlots : []
  const selectedBaseName =
    typeof params?.selectedBaseName === "string" ? params.selectedBaseName.trim() : ""
  const selectedAffixCount = countSelectedAffixes(affixSlots)
  const inferredRarity = normalizeItemRarity(
    params?.selectedRarity || rarityFromSelectedAffixCount(selectedAffixCount)
  )
  const actionFlag = resolvePickitActionFlag(params?.actionFlag)

  const findAffixByKey = typeof params?.findAffixByKey === "function" ? params.findAffixByKey : () => null
  const availableTiersForSlot =
    typeof params?.availableTiersForSlot === "function" ? params.availableTiersForSlot : () => []

  const {orderedSlots, totalsById} = collectOrderedStatsAndTotals(
    affixSlots,
    findAffixByKey,
    availableTiersForSlot
  )

  const statConditions = buildAfterIdentifyStatConditionsInSlotOrder(orderedSlots, totalsById)
  const afterConditions = [...statConditions, `[${actionFlag}] == "true"`]

  const beforeIdentifyConditions = [`[Category] == "${pickitCategory}"`]
  if (selectedBaseName) {
    beforeIdentifyConditions.push(`[Type] == "${selectedBaseName}"`)
  }
  beforeIdentifyConditions.push(`[Rarity] == "${inferredRarity}"`)

  const beforeIdentify = beforeIdentifyConditions.join(" && ")
  const afterIdentify = afterConditions.join(" && ")

  const ruleLine = `${beforeIdentify} # ${afterIdentify}`
  if (!params?.includeExplanation) return [ruleLine]

  const commentLine = buildHumanCommentLine({
    ...params,
    selectedItem,
    inferredRarity,
    actionFlag,
  })

  return [commentLine, ruleLine]
}
