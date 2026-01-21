// src/composables/useAffixSlots.js

import {computed, reactive, ref, watch} from "vue"

/**
 * Affix slot selection logic (UI/business rules, but kept component-agnostic).
 *
 * Why this exists:
 * - Row.vue was getting too large.
 * - The rules for affix selection (uniqueness, prefix/suffix caps, slot add/remove)
 *   should be testable and reusable.
 *
 * What this composable does:
 * - Manages up to N "affix slots" (default 6)
 * - Enforces uniqueness: later slots cannot pick what earlier slots already picked
 * - Enforces caps: max 3 prefixes and max 3 suffixes overall (default 3/3)
 * - Provides a per-slot grouped option list to feed directly into <optgroup>
 * - Provides UI signals for "Add affix" enable/disable and the reason string
 * - Clears a slot's tier selection automatically when the affix selection changes
 *
 * Note on "uniqueness" rule:
 * - Only earlier slots block later slots (slot 1 blocks slot 2..N, slot 2 blocks 3..N, ...)
 * - This is deliberate UX: changing a previous selection updates downstream options.
 *
 * @typedef {{ level:number, name?:string, text?:string }} Tier
 * @typedef {{
 *   kind: string,
 *   domain: string,
 *   family_key: string,
 *   template: string,
 *   identifier: string,
 *   tiers: Tier[]
 * }} AffixFamily
 *
 * @typedef {{
 *   id: string,
 *   selectedAffixKey: string | null,
 *   selectedTierLevel: number | null
 * }} AffixSlot
 *
 * @typedef {object} UseAffixSlotsOptions
 * @property {import("vue").Ref<AffixFamily[]>} affixesRef
 *   Reactive list of *available* affixes (already filtered by the caller if needed).
 * @property {number} [maxSlots=6]
 * @property {number} [maxPrefixes=3]
 * @property {number} [maxSuffixes=3]
 *
 * @param {UseAffixSlotsOptions} options
 */
export function useAffixSlots(options) {
    const affixesRef = options.affixesRef

    const maxAffixSlots = Number.isFinite(options.maxSlots) ? options.maxSlots : 6
    const maxPrefixesAllowed = Number.isFinite(options.maxPrefixes) ? options.maxPrefixes : 3
    const maxSuffixesAllowed = Number.isFinite(options.maxSuffixes) ? options.maxSuffixes : 3

    /**
     * Stable-ish ID for slots. Works in modern browsers and in environments
     * where crypto.randomUUID might be unavailable.
     */
    function createSlotId() {
        if (crypto?.randomUUID) return crypto.randomUUID()
        return `${Date.now()}-${Math.random()}`
    }

    /** @returns {AffixSlot} */
    function createEmptySlot() {
        return reactive({
            id: createSlotId(),
            selectedAffixKey: null,
            selectedTierLevel: null,
        })
    }

    /** @type {import("vue").Ref<AffixSlot[]>} */
    const slots = ref([createEmptySlot()])

    function resetSlots() {
        slots.value = [createEmptySlot()]
    }

    function addSlot() {
        if (slots.value.length >= maxAffixSlots) return
        if (!canAddSlot.value) return
        slots.value.push(createEmptySlot())
    }

    function removeSlot(slotIndex) {
        if (slots.value.length <= 1) return
        slots.value.splice(slotIndex, 1)
    }

    /**
     * Creates a "unique key" to identify an affix family.
     * This is used for:
     * - dropdown v-model values
     * - uniqueness comparisons across slots
     *
     * WARNING:
     * - If any of these fields are not stable in your data,
     *   uniqueness can behave unexpectedly.
     *
     * @param {AffixFamily} affixFamily
     * @returns {string}
     */
    function affixKey(affixFamily) {
        if (!affixFamily || typeof affixFamily !== "object") return "||||"

        const kind = typeof affixFamily.kind === "string" ? affixFamily.kind : ""
        const modifierDomain = typeof affixFamily.domain === "string" ? affixFamily.domain : ""
        const familyKey = typeof affixFamily.family_key === "string" ? affixFamily.family_key : ""
        const identifier = typeof affixFamily.identifier === "string" ? affixFamily.identifier : ""
        const template = typeof affixFamily.template === "string" ? affixFamily.template : ""

        return `${kind}|${modifierDomain}|${familyKey}|${identifier}|${template}`
    }

    /**
     * @param {string|null} key
     * @returns {AffixFamily|null}
     */
    function findAffixByKey(key) {
        if (!key) return null
        return (affixesRef.value || []).find((affixFamily) => affixKey(affixFamily) === key) || null
    }

    /**
     * @param {string|null} key
     * @returns {string} usually "prefix" | "suffix" | ""
     */
    function kindOfSelectedKey(key) {
        const selectedAffixFamily = findAffixByKey(key)
        return selectedAffixFamily && typeof selectedAffixFamily.kind === "string"
            ? selectedAffixFamily.kind
            : ""
    }

    /**
     * Builds a set of keys that must be excluded in a given slot.
     * Only earlier slots exclude later ones.
     *
     * @param {number} slotIndex
     * @returns {Set<string>}
     */
    function excludedKeysForSlot(slotIndex) {
        const excludedKeys = new Set()

        const earlierSlotsEnd = Math.min(slotIndex, slots.value.length)
        for (let i = 0; i < earlierSlotsEnd; i++) {
            const selectedKey = slots.value[i]?.selectedAffixKey
            if (selectedKey) excludedKeys.add(selectedKey)
        }

        return excludedKeys
    }

    /**
     * Counts selected kinds across all slots.
     * The `exceptSlotIndex` is used to allow the current slot to keep its selection,
     * even if we're already at the cap (so selection doesn't "disappear").
     *
     * @param {number|null} exceptSlotIndex
     * @returns {{prefixes:number, suffixes:number}}
     */
    function countSelectedKinds(exceptSlotIndex) {
        let selectedPrefixes = 0
        let selectedSuffixes = 0

        for (let i = 0; i < slots.value.length; i++) {
            if (exceptSlotIndex !== null && i === exceptSlotIndex) continue

            const selectedKey = slots.value[i]?.selectedAffixKey
            if (!selectedKey) continue

            const selectedKind = kindOfSelectedKey(selectedKey)
            if (selectedKind === "prefix") selectedPrefixes++
            if (selectedKind === "suffix") selectedSuffixes++
        }

        return {prefixes: selectedPrefixes, suffixes: selectedSuffixes}
    }

    const prefixCount = computed(() => countSelectedKinds(null).prefixes)
    const suffixCount = computed(() => countSelectedKinds(null).suffixes)

    /**
     * Builds optgroup-friendly dropdown options for a given slot:
     * [
     *   { label: "-- Prefixes --", items: [...] },
     *   { label: "-- Suffixes --", items: [...] },
     *   { label: "-- Other --", items: [...] },
     * ]
     *
     * @param {number} slotIndex
     * @returns {{label:string, items:AffixFamily[]}[]}
     */
    function groupsForSlot(slotIndex) {
        const availableAffixFamilies = affixesRef.value || []
        const excludedKeys = excludedKeysForSlot(slotIndex)

        // counts excluding current slot (better UX while editing)
        const countsExcludingCurrent = countSelectedKinds(slotIndex)
        const currentSelectedKey = slots.value[slotIndex]?.selectedAffixKey || null
        const currentSelectedKind = currentSelectedKey ? kindOfSelectedKey(currentSelectedKey) : ""

        const canSelectPrefix =
            countsExcludingCurrent.prefixes < maxPrefixesAllowed || currentSelectedKind === "prefix"
        const canSelectSuffix =
            countsExcludingCurrent.suffixes < maxSuffixesAllowed || currentSelectedKind === "suffix"

        const filteredAffixFamilies = availableAffixFamilies.filter((affixFamily) => {
            const key = affixKey(affixFamily)
            const kind = typeof affixFamily.kind === "string" ? affixFamily.kind : ""

            // keep current selection visible even if it would otherwise be filtered out
            if (currentSelectedKey && key === currentSelectedKey) return true

            // uniqueness across slots (only earlier slots)
            if (excludedKeys.has(key)) return false

            // enforce 3/3 caps
            if (kind === "prefix" && !canSelectPrefix) return false
            if (kind === "suffix" && !canSelectSuffix) return false

            return true
        })

        function byTemplate(a, b) {
            const templateA = typeof a.template === "string" ? a.template : ""
            const templateB = typeof b.template === "string" ? b.template : ""
            return templateA.localeCompare(templateB)
        }

        const prefixAffixes = filteredAffixFamilies
            .filter((affixFamily) => affixFamily.kind === "prefix")
            .sort(byTemplate)

        const suffixAffixes = filteredAffixFamilies
            .filter((affixFamily) => affixFamily.kind === "suffix")
            .sort(byTemplate)

        const otherAffixes = filteredAffixFamilies
            .filter((affixFamily) => affixFamily.kind !== "prefix" && affixFamily.kind !== "suffix")
            .sort(byTemplate)

        const optGroups = []
        if (prefixAffixes.length) optGroups.push({label: "-- Prefixes --", items: prefixAffixes})
        if (suffixAffixes.length) optGroups.push({label: "-- Suffixes --", items: suffixAffixes})
        if (otherAffixes.length) optGroups.push({label: "-- Other --", items: otherAffixes})

        return optGroups
    }

    /**
     * Can we add another slot *right now*?
     * This checks:
     * - slot count cap (maxAffixSlots)
     * - whether there are any affixes available at all
     * - whether the next slot would have any valid options
     */
    const canAddSlot = computed(() => {
        if (slots.value.length >= maxAffixSlots) return false
        if (!(affixesRef.value || []).length) return false

        const nextSlotIndex = slots.value.length
        const optGroups = groupsForSlot(nextSlotIndex)
        const totalOptions = optGroups.reduce((sum, group) => sum + (group.items?.length || 0), 0)
        return totalOptions > 0
    })

    /**
     * Explanation string for disabled "Add affix" button.
     */
    const addDisabledReason = computed(() => {
        if (slots.value.length >= maxAffixSlots) return `Max ${maxAffixSlots} affixes.`
        if (!(affixesRef.value || []).length) return "No affixes available."
        if (prefixCount.value >= maxPrefixesAllowed && suffixCount.value >= maxSuffixesAllowed) {
            return `Prefix/Suffix caps reached (${maxPrefixesAllowed}/${maxSuffixesAllowed}).`
        }
        return "No valid affixes left to add."
    })

    /**
     * Returns the tier list for the slot's currently selected affix.
     *
     * @param {number} slotIndex
     * @returns {Tier[]}
     */
    function availableTiersForSlot(slotIndex) {
        const selectedKey = slots.value[slotIndex]?.selectedAffixKey
        if (!selectedKey) return []

        const selectedAffixFamily = findAffixByKey(selectedKey)
        if (!selectedAffixFamily || !Array.isArray(selectedAffixFamily.tiers)) return []

        return selectedAffixFamily.tiers
    }

    /**
     * Automatically clear tier selection when the selected affix changes.
     * This prevents "tier remains selected for a different affix" bugs.
     */
    watch(
        () => slots.value.map((slot) => slot.selectedAffixKey),
        (nextKeys, previousKeys) => {
            for (let i = 0; i < nextKeys.length; i++) {
                if (nextKeys[i] !== (previousKeys?.[i] ?? null)) {
                    if (slots.value[i]) slots.value[i].selectedTierLevel = null
                }
            }
        }
    )

    return {
        // exposed "constants" (for Row template labels and counters)
        MAX_SLOTS: maxAffixSlots,
        MAX_PREFIXES: maxPrefixesAllowed,
        MAX_SUFFIXES: maxSuffixesAllowed,

        // state
        slots,

        // derived state
        prefixCount,
        suffixCount,
        canAddSlot,
        addDisabledReason,

        // helpers used by Row.vue
        affixKey,
        findAffixByKey,
        groupsForSlot,
        availableTiersForSlot,

        // actions
        addSlot,
        removeSlot,
        resetSlots,
    }
}