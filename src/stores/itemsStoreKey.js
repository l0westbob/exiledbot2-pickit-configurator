// src/stores/itemsStoreKey.js

/**
 * Injection key for the items store (created via `createItemsStore()`).
 *
 * Why this exists:
 * - Using a shared Symbol avoids string-key collisions in provide/inject.
 * - IDEs can help you refactor imports safely.
 */
export const ItemsStoreKey = Symbol("itemsStore")