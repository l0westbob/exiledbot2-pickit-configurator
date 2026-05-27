import { createResourceCache, fetchJson } from "./dataRuntime.js"

function validateCurrencyPayload(payload) {
  if (!payload || typeof payload !== "object" || !Array.isArray(payload.categories)) {
    throw new Error("Invalid schema for currency.json: expected { categories: [...] }")
  }
}

function validateTierPayload(payload) {
  if (!payload || typeof payload !== "object" || !payload.tiers || typeof payload.tiers !== "object") {
    throw new Error("Invalid schema for tiers-early.json: expected { tiers: {...} }")
  }
}

function normalizeCurrencyCategories(payload) {
  validateCurrencyPayload(payload)

  return payload.categories.map((category) => {
    const categoryName = typeof category?.name === "string" ? category.name.trim() : ""
    const categorySlug = typeof category?.slug === "string" ? category.slug.trim() : ""
    const rawItems = Array.isArray(category?.items) ? category.items : []

    if (!categoryName || !categorySlug) {
      throw new Error("Invalid schema for currency.json: category is missing name or slug.")
    }

    const items = rawItems.map((item) => {
      const name = typeof item?.name === "string" ? item.name.trim() : ""
      if (!name) {
        throw new Error(`Invalid schema for currency.json: item in ${categoryName} is missing name.`)
      }

      return {
        name,
        categoryName,
        categorySlug,
        apiId: typeof item.api_id === "string" ? item.api_id : "",
        itemId: Number.isFinite(Number(item.item_id)) ? Number(item.item_id) : null,
        currencyItemId: Number.isFinite(Number(item.currency_item_id)) ? Number(item.currency_item_id) : null,
        iconUrl: typeof item.icon_url === "string" ? item.icon_url : "",
      }
    })

    return {
      name: categoryName,
      slug: categorySlug,
      apiId: typeof category.api_id === "string" ? category.api_id : "",
      iconUrl: typeof category.icon_url === "string" ? category.icon_url : "",
      items,
    }
  })
}

function flattenCurrencyItems(categories) {
  const seenNames = new Set()
  const items = []

  for (const category of categories) {
    for (const item of category.items) {
      if (seenNames.has(item.name)) continue
      seenNames.add(item.name)
      items.push(item)
    }
  }

  return items
}

function normalizeCurrencyTiers(payload, itemByName) {
  validateTierPayload(payload)

  return Object.entries(payload.tiers).map(([tierName, rawCategories]) => {
    const items = []
    const seenNames = new Set()

    for (const itemNames of Object.values(rawCategories || {})) {
      if (!Array.isArray(itemNames)) continue

      for (const itemName of itemNames) {
        if (typeof itemName !== "string" || !itemName.trim() || seenNames.has(itemName)) continue

        const item = itemByName.get(itemName)
        if (!item) {
          throw new Error(`Invalid schema for tiers-early.json: unknown currency item "${itemName}".`)
        }

        seenNames.add(itemName)
        items.push(item)
      }
    }

    return {
      name: tierName,
      items,
    }
  })
}

function normalizeCurrencyCatalog(currencyPayload, tierPayload) {
  const categories = normalizeCurrencyCategories(currencyPayload)
  const items = flattenCurrencyItems(categories)
  const itemByName = new Map(items.map((item) => [item.name, item]))
  const tiers = normalizeCurrencyTiers(tierPayload, itemByName)

  return {
    source: typeof currencyPayload.source === "string" ? currencyPayload.source : "",
    league: typeof currencyPayload.league === "string" ? currencyPayload.league : "",
    fetchedAt: typeof currencyPayload.fetched_at === "string" ? currencyPayload.fetched_at : "",
    categories,
    items,
    tiers,
  }
}

export async function loadCurrencyCatalog() {
  return currencyCatalogResource.load()
}

export function resetCurrencyServiceCache() {
  currencyCatalogResource.reset()
}

const currencyCatalogResource = createResourceCache(async () => {
  const [currencyPayload, tierPayload] = await Promise.all([
    fetchJson("data/economy/currency.json"),
    fetchJson("data/tiers/tiers-early.json"),
  ])

  return normalizeCurrencyCatalog(currencyPayload, tierPayload)
})
