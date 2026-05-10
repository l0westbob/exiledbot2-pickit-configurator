/**
 * @typedef {{
 *   slug?: string,
 *   category?: string,
 *   label?: string,
 *   pickitCategory?: string | null,
 *   status?: string,
 * }} CatalogItem
 */

export function isImplementedCatalogItem(item) {
  return Boolean(
    item &&
    typeof item === "object" &&
    item.status === "implemented" &&
    typeof item.slug === "string" &&
    item.slug &&
    typeof item.pickitCategory === "string" &&
    item.pickitCategory.trim()
  )
}

export function getImplementedCatalogItems(items) {
  const rawItems = Array.isArray(items) ? items : []
  return rawItems.filter((item) => isImplementedCatalogItem(item))
}

export function resolvePickitCategoryFromItem(selectedItem) {
  const pickitCategory =
    typeof selectedItem?.pickitCategory === "string" ? selectedItem.pickitCategory.trim() : ""
  return pickitCategory || null
}
