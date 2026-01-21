// src/helpers/generateRowPreviewLines.js
import {tierIndexFromBottom} from "./tiers"

/**
 * Builds proof-of-concept preview lines for one row.
 *
 * @param {object} p
 * @param {string} p.selectedItemSlug
 * @param {object|null} p.selectedItem
 * @param {Array<{selectedAffixKey: string|null, selectedTierLevel: number|null}>} p.affixSlots
 * @param {(key: string|null) => any|null} p.findAffixByKey
 * @param {(slotIdx: number) => any[]|undefined|null} p.availableTiersForSlot
 * @returns {string[]}
 */
export function generateRowPreviewLines(p) {
    const selectedItemSlug = p?.selectedItemSlug || ""
    if (!selectedItemSlug) return []

    const selectedItem = p?.selectedItem || null
    const itemLabel = (selectedItem && selectedItem.label) || selectedItemSlug

    const affixSlots = Array.isArray(p?.affixSlots) ? p.affixSlots : []
    const findAffixByKey = typeof p?.findAffixByKey === "function" ? p.findAffixByKey : () => null
    const availableTiersForSlot =
        typeof p?.availableTiersForSlot === "function" ? p.availableTiersForSlot : () => []

    const lines = []

    for (let i = 0; i < affixSlots.length; i++) {
        const slot = affixSlots[i]
        const aff = findAffixByKey(slot?.selectedAffixKey || null)
        if (!aff) continue

        const tiersRaw = availableTiersForSlot(i)
        const tiers = Array.isArray(tiersRaw) ? tiersRaw : []

        const tierLevel = slot?.selectedTierLevel ?? null
        const tier = tiers.find((t) => t?.level === tierLevel) || null

        const modDomain = typeof aff.domain === "string" ? aff.domain : ""
        const domainPart = modDomain ? ` | ${modDomain}` : ""

        if (!tier) {
            lines.push(`[${itemLabel}] ${aff.kind}${domainPart} | ${aff.template}`)
            continue
        }

        const tIndex = tierIndexFromBottom(tiers, tier.level)
        const tierName = tier.name || `T${tIndex}`
        const tierText = tier.text || ""

        lines.push(
            `[${itemLabel}] ${aff.kind}${domainPart} | ${aff.template} | T${tIndex} (lvl ${tier.level}) ${tierName} -> ${tierText}`
        )
    }

    return lines
}