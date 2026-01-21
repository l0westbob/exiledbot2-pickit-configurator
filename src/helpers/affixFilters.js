// src/helpers/affixFilters.js

/**
 * Affix filtering rules for the UI.
 *
 * Your affix JSONs contain affix families that may include entries you:
 * - don't want to show in the configurator
 * - don't want to handle in the generator logic (at least for now)
 *
 * This helper centralizes the "hide rules" so you don't duplicate them
 * inside Row.vue or other components.
 *
 * IMPORTANT:
 * - Returning `true` means: "hide this affix from dropdowns"
 * - Returning `false` means: "show this affix"
 *
 * @param {object} affix
 * @param {string} affix.kind
 *   Typically "prefix" or "suffix", but can include other values
 *   (depending on your data sources).
 * @param {string} affix.domain
 *   Domain of the modifier, e.g. "item", "desecrated", ...
 * @returns {boolean}
 *   `true` if affix should be hidden from UI selection.
 */
export function shouldHideAffix(affix) {
    // Defensive: invalid input => hide it
    if (!affix || typeof affix !== "object") return true

    const modifierDomain = typeof affix.domain === "string" ? affix.domain : ""
    const affixKind = typeof affix.kind === "string" ? affix.kind : ""

    /**
     * Hide rules:
     *
     * 1) domain=item with kind unique/corrupted
     *    These are special-case stats and are not part of the normal pool
     *    we want the user to configure.
     */
    if (modifierDomain === "item" && (affixKind === "unique" || affixKind === "corrupted")) {
        return true
    }

    /**
     * 2) hide all desecrated-domain affixes
     *    These are not part of your desired config scope right now.
     */
    if (modifierDomain === "desecrated") {
        return true
    }

    // Otherwise keep it
    return false
}