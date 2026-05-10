/**
 * @typedef {{
 *   kind?: string,
 *   modifierSection?: string,
 *   family_key?: string,
 *   template?: string,
 *   tiers?: unknown[],
 * }} AffixFamily
 */

const MODIFIER_SECTION_LABELS = {
  normal: "Normal",
  corrupted: "Corrupted",
  desecrated: "Desecrated",
  essence: "Essence",
  perfect_essence: "Perfect Essence",
  bonded: "Bonded",
  socketable: "Socketable",
}

export function getModifierSectionKey(affixFamily) {
  const modifierSection =
    typeof affixFamily?.modifierSection === "string" ? affixFamily.modifierSection.trim() : ""
  return modifierSection || "normal"
}

export function getModifierSectionLabel(modifierSectionKey) {
  return MODIFIER_SECTION_LABELS[modifierSectionKey] || modifierSectionKey || "Normal"
}

export function getAffixFamilyKey(affixFamily) {
  if (!affixFamily || typeof affixFamily !== "object") return "||||"

  const modifierSection = getModifierSectionKey(affixFamily)
  const familyKey = typeof affixFamily.family_key === "string" ? affixFamily.family_key : ""
  const kind = typeof affixFamily.kind === "string" ? affixFamily.kind : ""
  const template = typeof affixFamily.template === "string" ? affixFamily.template : ""

  return `${modifierSection}|${familyKey}|${kind}|${template}`
}

export function formatAffixDisplayLabel(affixFamily) {
  const template = typeof affixFamily?.template === "string" ? affixFamily.template.trim() : ""
  if (!template) return ""

  const modifierSectionKey = getModifierSectionKey(affixFamily)
  if (modifierSectionKey === "normal") return template

  return `${getModifierSectionLabel(modifierSectionKey)} - ${template}`
}

function isVisibleAffix(affixFamily) {
  if (!affixFamily || typeof affixFamily !== "object") return false

  return Array.isArray(affixFamily.tiers)
}

export function filterVisibleAffixes(affixFamilies) {
  const rawAffixes = Array.isArray(affixFamilies) ? affixFamilies : []
  return rawAffixes.filter((affixFamily) => isVisibleAffix(affixFamily))
}
