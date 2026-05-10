const baseUrl = import.meta.env?.BASE_URL || "/"

let catalogCache = null
let catalogPromise = null
const affixCacheBySlug = new Map()

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
  if (!payload || typeof payload !== "object" || !Array.isArray(payload.affixes)) {
    throw new Error(`Invalid schema for ${itemSlug}.json: expected { affixes: [...] }`)
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

export async function getAffixesForSlug(itemSlug) {
  if (!itemSlug) return []
  if (affixCacheBySlug.has(itemSlug)) return affixCacheBySlug.get(itemSlug) || []

  const payload = await fetchJson(`data/affixes/${itemSlug}.json`)
  validateAffixPayload(payload, itemSlug)
  affixCacheBySlug.set(itemSlug, payload.affixes)
  return payload.affixes
}

export function resetCatalogServiceCache() {
  catalogCache = null
  catalogPromise = null
  affixCacheBySlug.clear()
}
