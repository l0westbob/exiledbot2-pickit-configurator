// src/helpers/tiers.js

/**
 * @typedef {{ level:number }} Tier
 */

/**
 * Compute the "Tier label index" from the bottom of a tier list.
 *
 * In your affix JSON data, tiers come with numeric `level` values.
 * Bigger level usually means "stronger / rarer / higher tier".
 *
 * This helper maps:
 * - highest `level`  -> T1
 * - next highest     -> T2
 * - ...
 *
 * Example:
 *   levels: [1, 10, 20]
 *   - level 1  => T3
 *   - level 10 => T2
 *   - level 20 => T1
 *
 * Notes:
 * - We only rely on numeric ordering of `tier.level`.
 * - The function is defensive against missing/invalid values.
 *
 * @param {Tier[]} tiers
 *   List of tier objects containing at least `{ level:number }`.
 * @param {number} tierLevel
 *   The `level` you want to translate into a tier index label.
 * @returns {number|string}
 *   Returns `1..N` (where 1 means "best tier") or "?" if not resolvable.
 */
export function tierIndexFromBottom(tiers, tierLevel) {
    if (!Array.isArray(tiers) || tiers.length === 0) return "?"
    if (!Number.isFinite(tierLevel)) return "?"

    const sortedTierLevelsAscending = [...tiers]
        .map((tier) => tier?.level)
        .filter((level) => Number.isFinite(level))
        .sort((a, b) => a - b)

    const indexInAscendingList = sortedTierLevelsAscending.indexOf(tierLevel)
    if (indexInAscendingList === -1) return "?"

    // Example: [1,10,20] -> level 20 index=2 -> return 3-2 = 1 => T1
    return sortedTierLevelsAscending.length - indexInAscendingList
}