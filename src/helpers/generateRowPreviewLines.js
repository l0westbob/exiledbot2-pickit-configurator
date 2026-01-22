/**
 * Builds preview lines for one row (human-readable).
 *
 * New data format:
 * - affix: { family_key, kind, template, tiers: [{ level, name, text, stats: [{ id, min, max }] }] }
 *
 * @param {object} params
 * @param {string} params.selectedItemSlug
 * @param {object|null} params.selectedItem
 * @param {Array<{selectedAffixKey: string|null, selectedTierLevel: number|null}>} params.affixSlots
 * @param {(key: string|null) => any|null} params.findAffixByKey
 * @param {(slotIdx: number) => any[]|undefined|null} params.availableTiersForSlot
 * @returns {string[]}
 */
export function generateRowPreviewLines(params) {
    const selectedItemSlug = params?.selectedItemSlug || ""
    if (!selectedItemSlug) return []

    const selectedItem = params?.selectedItem || null
    const itemLabel = (selectedItem && selectedItem.label) || selectedItemSlug

    const affixSlots = Array.isArray(params?.affixSlots) ? params.affixSlots : []
    const findAffixByKey =
        typeof params?.findAffixByKey === "function" ? params.findAffixByKey : () => null
    const availableTiersForSlot =
        typeof params?.availableTiersForSlot === "function" ? params.availableTiersForSlot : () => []

    const previewLines = []

    for (let slotIndex = 0; slotIndex < affixSlots.length; slotIndex++) {
        const slotState = affixSlots[slotIndex]
        const selectedAffix = findAffixByKey(slotState?.selectedAffixKey || null)
        if (!selectedAffix) continue

        const tierCandidatesRaw = availableTiersForSlot(slotIndex)
        const tierCandidates = Array.isArray(tierCandidatesRaw) ? tierCandidatesRaw : []

        const selectedTierLevel = slotState?.selectedTierLevel ?? null
        const selectedTier =
            tierCandidates.find((tier) => tier?.level === selectedTierLevel) || null

        // If a tier is chosen, the tier.text is already the final human string.
        // Otherwise, fall back to the generic template (with # placeholders).
        const affixText =
            selectedTier && typeof selectedTier.text === "string" && selectedTier.text.trim()
                ? selectedTier.text.trim()
                : (typeof selectedAffix.template === "string" ? selectedAffix.template : "").trim()

        if (!affixText) continue

        previewLines.push(`[${itemLabel}] ${affixText}`)
    }

    return previewLines
}