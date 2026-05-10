/**
 * @typedef {{
 *   kind?: string,
 *   domain?: string,
 *   family_key?: string,
 *   template?: string,
 *   tiers?: unknown[],
 * }} AffixFamily
 */

export function getAffixFamilyKey(affixFamily) {
  if (!affixFamily || typeof affixFamily !== "object") return "|||"

  const familyKey = typeof affixFamily.family_key === "string" ? affixFamily.family_key : ""
  const kind = typeof affixFamily.kind === "string" ? affixFamily.kind : ""
  const template = typeof affixFamily.template === "string" ? affixFamily.template : ""

  return `${familyKey}|${kind}|${template}`
}

export function shouldHideAffix(affixFamily) {
  if (!affixFamily || typeof affixFamily !== "object") return true

  const modifierDomain = typeof affixFamily.domain === "string" ? affixFamily.domain : ""
  const affixKind = typeof affixFamily.kind === "string" ? affixFamily.kind : ""

  if (modifierDomain === "item" && (affixKind === "unique" || affixKind === "corrupted")) {
    return true
  }

  return modifierDomain === "desecrated"
}

export function filterVisibleAffixes(affixFamilies) {
  const rawAffixes = Array.isArray(affixFamilies) ? affixFamilies : []
  return rawAffixes.filter((affixFamily) => !shouldHideAffix(affixFamily))
}
