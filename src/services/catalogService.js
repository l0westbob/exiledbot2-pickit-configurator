import { createKeyedResourceCache, createResourceCache, fetchJson } from "./dataRuntime.js"

function validateCatalogPayload(payload) {
  if (!payload || typeof payload !== "object" || !Array.isArray(payload.items)) {
    throw new Error("Invalid schema for catalog.json: expected { items: [...] }")
  }
}

function validateAffixPayload(payload, itemSlug) {
  if (!payload || typeof payload !== "object") {
    throw new Error(`Invalid schema for ${itemSlug}.json: expected object payload.`)
  }
  if (typeof payload.slug !== "string" || !payload.slug.trim()) {
    throw new Error(`Invalid schema for ${itemSlug}.json: missing slug.`)
  }
  if (typeof payload.category !== "string" || !payload.category.trim()) {
    throw new Error(`Invalid schema for ${itemSlug}.json: missing category.`)
  }
  if (typeof payload.label !== "string" || !payload.label.trim()) {
    throw new Error(`Invalid schema for ${itemSlug}.json: missing label.`)
  }
  if (
    !payload.modifier_sections ||
    typeof payload.modifier_sections !== "object" ||
    !Array.isArray(payload.modifier_sections.normal)
  ) {
    throw new Error(`Invalid schema for ${itemSlug}.json: expected modifier_sections.normal array.`)
  }
  if (payload.bases !== undefined && !Array.isArray(payload.bases)) {
    throw new Error(`Invalid schema for ${itemSlug}.json: expected bases to be an array when present.`)
  }
}

function normalizeBases(rawBases) {
  const bases = Array.isArray(rawBases) ? rawBases : []

  return bases
    .filter((base) => base && typeof base === "object" && typeof base.name === "string" && base.name.trim())
    .map((base) => {
      const rawRequiredLevel = base.required_level
      const requiredLevelRaw =
        rawRequiredLevel === null || rawRequiredLevel === undefined || rawRequiredLevel === ""
          ? NaN
          : Number(rawRequiredLevel)
      return {
        name: base.name.trim(),
        href: typeof base.href === "string" ? base.href : "",
        requiredLevel: Number.isFinite(requiredLevelRaw) ? requiredLevelRaw : null,
      }
    })
}

function normalizeModifierSections(rawSections) {
  const modifierSections = {}

  for (const [sectionKey, rawModifiers] of Object.entries(rawSections || {})) {
    const modifiers = Array.isArray(rawModifiers) ? rawModifiers : []
    modifierSections[sectionKey] = modifiers.map((modifier) => ({
      ...modifier,
      modifierSection: sectionKey,
    }))
  }

  return modifierSections
}

function flattenModifierSections(modifierSections) {
  const orderedSectionKeys = ["normal", "essence", "perfect_essence", "desecrated", "corrupted", "bonded", "socketable"]

  const seenSectionKeys = new Set()
  const affixes = []

  for (const sectionKey of orderedSectionKeys) {
    if (!Array.isArray(modifierSections[sectionKey])) continue
    affixes.push(...modifierSections[sectionKey])
    seenSectionKeys.add(sectionKey)
  }

  for (const [sectionKey, modifiers] of Object.entries(modifierSections)) {
    if (seenSectionKeys.has(sectionKey) || !Array.isArray(modifiers)) continue
    affixes.push(...modifiers)
  }

  return affixes
}

function normalizeAffixPayload(payload) {
  const modifierSections = normalizeModifierSections(payload.modifier_sections)

  return {
    slug: payload.slug,
    category: payload.category,
    label: payload.label,
    bases: normalizeBases(payload.bases),
    modifierSections,
    affixes: flattenModifierSections(modifierSections),
  }
}

export async function loadCatalog() {
  return catalogResource.load()
}

export async function getItemDataForSlug(itemSlug) {
  if (!itemSlug) return null
  return itemDataResource.load(itemSlug)
}

export async function getAffixesForSlug(itemSlug) {
  if (!itemSlug) return []

  const itemData = await getItemDataForSlug(itemSlug)
  return Array.isArray(itemData?.affixes) ? itemData.affixes : []
}

export function resetCatalogServiceCache() {
  catalogResource.reset()
  itemDataResource.reset()
}

const catalogResource = createResourceCache(async () => {
  const payload = await fetchJson("data/catalog.json")
  validateCatalogPayload(payload)
  return payload.items
})

const itemDataResource = createKeyedResourceCache(async (itemSlug) => {
  const payload = await fetchJson(`data/affixes/${itemSlug}.json`)
  validateAffixPayload(payload, itemSlug)
  return normalizeAffixPayload(payload)
})
