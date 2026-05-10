const baseUrl = import.meta.env?.BASE_URL || "/"

let catalogCache = null
let catalogPromise = null
const itemDataCacheBySlug = new Map()

async function fetchJson(relativePath) {
  const response = await fetch(baseUrl + relativePath)
  if (!response.ok) {
    throw new Error(`Failed to load ${relativePath}: ${response.status}`)
  }
  return response.json()
}

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
  const orderedSectionKeys = [
    "normal",
    "essence",
    "perfect_essence",
    "desecrated",
    "corrupted",
    "bonded",
    "socketable",
  ]

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
  if (catalogCache) return catalogCache
  if (catalogPromise) return catalogPromise

  catalogPromise = fetchJson("data/catalog.json")
    .then((payload) => {
      validateCatalogPayload(payload)
      catalogCache = payload.items
      return catalogCache
    })
    .finally(() => {
      catalogPromise = null
    })

  return catalogPromise
}

export async function getItemDataForSlug(itemSlug) {
  if (!itemSlug) return null
  if (itemDataCacheBySlug.has(itemSlug)) return itemDataCacheBySlug.get(itemSlug) || null

  const payload = await fetchJson(`data/affixes/${itemSlug}.json`)
  validateAffixPayload(payload, itemSlug)
  const normalizedPayload = normalizeAffixPayload(payload)
  itemDataCacheBySlug.set(itemSlug, normalizedPayload)
  return normalizedPayload
}

export async function getAffixesForSlug(itemSlug) {
  if (!itemSlug) return []

  const itemData = await getItemDataForSlug(itemSlug)
  return Array.isArray(itemData?.affixes) ? itemData.affixes : []
}

export function resetCatalogServiceCache() {
  catalogCache = null
  catalogPromise = null
  itemDataCacheBySlug.clear()
}
