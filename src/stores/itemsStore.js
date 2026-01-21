// src/stores/itemsStore.js
import {ref} from "vue"

/**
 * App-level data store for:
 * - available item types (from public/data/items.json)
 * - affix catalogs per item slug (from public/data/affixes/<slug>.json)
 *
 * This is intentionally "simple store" style (no Pinia):
 * - state is Vue refs
 * - API is async functions
 * - includes an in-memory cache for affix files to avoid repeated fetches
 *
 * Important:
 * - Uses import.meta.env.BASE_URL so it works on GitHub Pages (repo subpath).
 */
export function createItemsStore() {
    /**
     * List of item types loaded from items.json.
     * Expected schema entry: { items: Array<{ slug: string, label: string, category: string, ... }> }
     */
    const items = ref([])

    /** Indicates whether items.json is currently being loaded. */
    const isLoadingItems = ref(false)

    /** Human-readable error message for items.json loading failures (empty string if none). */
    const itemsLoadError = ref("")

    /**
     * Cache for affix files:
     * itemSlug -> affixes[] (raw.affixes from the item file)
     *
     * Note:
     * - This caches only successful responses.
     * - If you want to cache failures too, we can add a negative cache later.
     */
    const affixesBySlugCache = new Map()

    /**
     * Vite BASE_URL (respects GitHub Pages base path).
     * Example on Pages: "/your-repo-name/"
     * Example locally: "/"
     */
    const baseUrl = import.meta.env.BASE_URL

    /**
     * Loads item types from public/data/items.json.
     * - Populates `items`
     * - Sets `isLoadingItems` and `itemsLoadError`
     */
    async function loadItems() {
        isLoadingItems.value = true
        itemsLoadError.value = ""

        try {
            const response = await fetch(baseUrl + "data/items.json")
            if (!response.ok) {
                throw new Error(`Failed to load items.json: ${response.status}`)
            }

            const payload = await response.json()
            items.value = Array.isArray(payload?.items) ? payload.items : []
        } catch (error) {
            console.error(error)
            itemsLoadError.value = String(error)
            items.value = []
        } finally {
            isLoadingItems.value = false
        }
    }

    /**
     * Loads affixes for the given item slug.
     *
     * Uses an in-memory cache:
     * - 1st call fetches and caches
     * - subsequent calls return cached result
     *
     * Expected file schema: { affixes: AffixFamily[] }
     *
     * @param {string} itemSlug
     * @returns {Promise<any[]>} affixes array (empty if slug is empty)
     * @throws {Error} if fetch fails or schema is invalid
     */
    async function getAffixesForSlug(itemSlug) {
        if (!itemSlug) return []

        if (affixesBySlugCache.has(itemSlug)) {
            return affixesBySlugCache.get(itemSlug) || []
        }

        const response = await fetch(baseUrl + `data/affixes/${itemSlug}.json`)
        if (!response.ok) {
            throw new Error(`Failed to load affixes for ${itemSlug}: ${response.status}`)
        }

        const payload = await response.json()

        // schema: { affixes: [...] }
        if (!payload || typeof payload !== "object" || !Array.isArray(payload.affixes)) {
            throw new Error(`Invalid schema for ${itemSlug}.json: expected { affixes: [...] }`)
        }

        affixesBySlugCache.set(itemSlug, payload.affixes)
        return payload.affixes
    }

    return {
        // state
        items,
        isLoadingItems,
        itemsLoadError,

        // actions
        loadItems,
        getAffixesForSlug,
    }
}