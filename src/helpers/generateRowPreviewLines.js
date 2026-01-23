// src/helpers/generateRowPreviewLines.js

import {tierIndexFromBottom} from "./tiers";

function countSelectedAffixes(affixSlots) {
    if (!Array.isArray(affixSlots)) return 0

    let selectedAffixCount = 0
    for (const slot of affixSlots) {
        if (slot?.selectedAffixKey) selectedAffixCount++
    }
    return selectedAffixCount
}

function rarityFromSelectedAffixCount(selectedAffixCount) {
    if (selectedAffixCount === 0) return "Normal"
    if (selectedAffixCount <= 2) return "Magic"
    return "Rare"
}

function resolvePickitActionFlag(raw) {
    const actionFlag = typeof raw === "string" ? raw.trim() : ""
    if (!actionFlag) return "StashItem"

    const allowed = new Set(["StashItem", "StashUnid", "Salvage", "IgnoreRitual"])
    return allowed.has(actionFlag) ? actionFlag : "StashItem"
}

function resolvePickitCategoryFromItem(selectedItem) {
    const pickitCategory =
        typeof selectedItem?.pickitCategory === "string" ? selectedItem.pickitCategory.trim() : ""
    return pickitCategory || null
}

/**
 * Collects stats in slot order (keeping multi-stat affixes together),
 * while also aggregating totals by stat id.
 *
 * Output:
 * - orderedSlots: Array<Array<string>> where each inner array is stat ids in that slot, in order
 * - totalsById: Map<statId, {id, min, max}> summed across all selected tiers
 *
 * @param {Array<{selectedAffixKey: string|null, selectedTierLevel: number|null}>} affixSlots
 * @param {(key: string|null) => any|null} findAffixByKey
 * @param {(slotIdx: number) => any[]|undefined|null} availableTiersForSlot
 * @returns {{ orderedSlots: string[][], totalsById: Map<string, {id: string, min: number, max: number}> }}
 */
function collectOrderedStatsAndTotals(affixSlots, findAffixByKey, availableTiersForSlot) {
    /** @type {Map<string, {id: string, min: number, max: number}>} */
    const totalsById = new Map()

    /** @type {string[][]} */
    const orderedSlots = []

    if (!Array.isArray(affixSlots)) return {orderedSlots, totalsById}

    for (let slotIndex = 0; slotIndex < affixSlots.length; slotIndex++) {
        const slot = affixSlots[slotIndex]
        const selectedAffixKey = slot?.selectedAffixKey || null
        const selectedTierLevel = slot?.selectedTierLevel ?? null

        // Keep slot position stable even if empty
        const statIdsInThisSlot = []
        orderedSlots.push(statIdsInThisSlot)

        if (!selectedAffixKey || !Number.isFinite(selectedTierLevel)) continue

        const selectedAffixFamily = findAffixByKey(selectedAffixKey)
        if (!selectedAffixFamily) continue

        const tiersRaw = availableTiersForSlot(slotIndex)
        const tiers = Array.isArray(tiersRaw) ? tiersRaw : []

        const selectedTier =
            tiers.find((t) => Number.isFinite(t?.level) && t.level === selectedTierLevel) || null
        if (!selectedTier) continue

        const tierStats = Array.isArray(selectedTier?.stats) ? selectedTier.stats : []
        for (const stat of tierStats) {
            const statId = typeof stat?.id === "string" ? stat.id.trim() : ""
            if (!statId) continue

            const minValue = Number(stat?.min)
            const maxValue = Number(stat?.max)
            if (!Number.isFinite(minValue) || !Number.isFinite(maxValue)) continue

            // Preserve order/grouping: append in the order they appear in this tier.stats array
            statIdsInThisSlot.push(statId)

            // Aggregate totals globally
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
        const selectedTier = tiers.find((t) => t?.level === selectedTierLevel) || null

        // Determine T-index (T1 best, Tn worst) based on tier list order
        const tIndex = tierIndexFromBottom(tiers, selectedTier?.level)

        const tierText = selectedTier ? `T${tIndex}` : "any tier"

        selectedAffixDescriptions.push(`${affix.template} of tier ${tierText}`)
    }

    const affixPart = selectedAffixDescriptions.length
        ? ` if they have at least ${selectedAffixDescriptions.join(", ")}`
        : ""

    return `// Picks up ${pickitCategory} of rarity ${inferredRarity} and ${actionFlag}${affixPart}`
}

/**
 * Builds AFTER-# stat conditions:
 * - Stat ids are NOT wrapped in [] (per your rule)
 * - Ordered by first appearance across affix slots
 * - Duplicates are emitted once, using aggregated totals
 *
 * Rule (same as before):
 * - if min === max => id == "value"
 * - else          => id >= "min"
 *
 * @param {string[][]} orderedSlots
 * @param {Map<string, {id: string, min: number, max: number}>} totalsById
 * @returns {string[]}
 */
function buildAfterIdentifyStatConditionsInSlotOrder(orderedSlots, totalsById) {
    const emitted = new Set()
    const conditions = []

    for (const statIdsInSlot of orderedSlots) {
        for (const statId of statIdsInSlot) {
            if (!statId || emitted.has(statId)) continue

            const total = totalsById.get(statId)
            if (!total) continue

            const minValue = total.min
            const maxValue = total.max

            // Always emit both bounds (even if min === max)
            conditions.push(`${statId} >= "${minValue}"`)
            conditions.push(`${statId} <= "${maxValue}"`)

            emitted.add(statId)
        }
    }

    return conditions
}

export function generateRowPreviewLines(params) {
    const configType = typeof params?.configType === "string" ? params.configType : "items"
    if (configType !== "items") return []

    const selectedItemSlug = typeof params?.selectedItemSlug === "string" ? params.selectedItemSlug : ""
    if (!selectedItemSlug) return []

    const selectedItem = params?.selectedItem || null
    const pickitCategory = resolvePickitCategoryFromItem(selectedItem)

    if (!pickitCategory) {
        return ['[Category] == "UNKNOWN" # [StashItem] == "true"']
    }

    const affixSlots = Array.isArray(params?.affixSlots) ? params.affixSlots : []
    const selectedAffixCount = countSelectedAffixes(affixSlots)
    const inferredRarity = rarityFromSelectedAffixCount(selectedAffixCount)

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

    // Action flag MUST be last in AFTER block
    const afterConditions = [...statConditions, `[${actionFlag}] == "true"`]

    const beforeIdentify = `[Category] == "${pickitCategory}" && [Rarity] == "${inferredRarity}"`
    const afterIdentify = afterConditions.join(" && ")

    const commentLine = buildHumanCommentLine({
        ...params,
        selectedItem,
        inferredRarity,
        actionFlag,
    })

    const ruleLine = `${beforeIdentify} # ${afterIdentify}`

    return [commentLine, ruleLine]
}