import { createResourceCache, fetchJson } from "./dataRuntime.js"

function validateUniqueIndexPayload(payload) {
  if (!payload || typeof payload !== "object" || !Array.isArray(payload.classes)) {
    throw new Error("Invalid schema for uniques/index.json: expected { classes: [...] }")
  }
}

function validateUniqueClassPayload(payload, fileName) {
  if (!payload || typeof payload !== "object" || !Array.isArray(payload.uniques)) {
    throw new Error(`Invalid schema for uniques/${fileName}: expected { uniques: [...] }`)
  }
}

function normalizeIndexEntries(indexPayload) {
  validateUniqueIndexPayload(indexPayload)

  return indexPayload.classes.map((entry) => {
    const slug = typeof entry?.slug === "string" ? entry.slug.trim() : ""
    const className = typeof entry?.class === "string" ? entry.class.trim() : ""
    const file = typeof entry?.file === "string" ? entry.file.trim() : ""

    if (!slug || !className || !file) {
      throw new Error("Invalid schema for uniques/index.json: class entry is missing slug, class, or file.")
    }

    return { slug, className, file }
  })
}

function normalizeUnique(rawUnique, className, classSlug) {
  const name = typeof rawUnique?.name === "string" ? rawUnique.name.trim() : ""
  const displayName = typeof rawUnique?.display_name === "string" ? rawUnique.display_name.trim() : name
  const baseName = typeof rawUnique?.base_name === "string" ? rawUnique.base_name.trim() : ""

  if (!name || !displayName || !baseName) {
    throw new Error(
      `Invalid schema for unique ${displayName || name || "(unknown)"}: missing name, display_name, or base_name.`
    )
  }

  return {
    name,
    displayName,
    baseName,
    className,
    classSlug,
    href: typeof rawUnique?.href === "string" ? rawUnique.href : "",
    requirements: rawUnique?.requirements && typeof rawUnique.requirements === "object" ? rawUnique.requirements : {},
    stats: Array.isArray(rawUnique?.stats) ? rawUnique.stats : [],
    itemTypeSlug: typeof rawUnique?.itemtype_slug === "string" ? rawUnique.itemtype_slug : "",
    baseHref: typeof rawUnique?.base_href === "string" ? rawUnique.base_href : "",
  }
}

function sortUniquesByDisplayName(uniques) {
  return [...(Array.isArray(uniques) ? uniques : [])].sort((left, right) => {
    return left.displayName.localeCompare(right.displayName)
  })
}

function normalizeUniqueClass(indexEntry, classPayload) {
  validateUniqueClassPayload(classPayload, indexEntry.file)

  const className =
    typeof classPayload.class === "string" && classPayload.class.trim()
      ? classPayload.class.trim()
      : indexEntry.className
  const classSlug =
    typeof classPayload.slug === "string" && classPayload.slug.trim() ? classPayload.slug.trim() : indexEntry.slug

  return {
    name: className,
    slug: classSlug,
    file: indexEntry.file,
    uniques: sortUniquesByDisplayName(
      classPayload.uniques.map((unique) => normalizeUnique(unique, className, classSlug))
    ),
  }
}

function normalizeUniqueCatalog(indexPayload, classPayloads) {
  const indexEntries = normalizeIndexEntries(indexPayload)
  const classes = indexEntries
    .map((entry, index) => normalizeUniqueClass(entry, classPayloads[index]))
    .sort((left, right) => left.name.localeCompare(right.name))

  return {
    version: Number.isFinite(Number(indexPayload.version)) ? Number(indexPayload.version) : 1,
    classes,
    uniques: classes.flatMap((uniqueClass) => uniqueClass.uniques),
  }
}

export async function loadUniqueCatalog() {
  return uniqueCatalogResource.load()
}

export function resetUniqueServiceCache() {
  uniqueCatalogResource.reset()
}

const uniqueCatalogResource = createResourceCache(async () => {
  const indexPayload = await fetchJson("data/uniques/index.json")
  const indexEntries = normalizeIndexEntries(indexPayload)
  const classPayloads = await Promise.all(indexEntries.map((entry) => fetchJson(`data/uniques/${entry.file}`)))

  return normalizeUniqueCatalog(indexPayload, classPayloads)
})
