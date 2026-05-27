import fs from "node:fs/promises"
import path from "node:path"
import process from "node:process"
import { fileURLToPath, pathToFileURL } from "node:url"

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const DEFAULT_AUGMENTATION_PATH = path.join(ROOT_DIR, "config", "catalog-augmentation.json")
const DEFAULT_CATALOG_OUT_PATH = path.join(ROOT_DIR, "public", "data", "catalog.json")
const DEFAULT_DEST_AFFIX_DIR = path.join(ROOT_DIR, "public", "data", "affixes")
const DEFAULT_CURRENCY_PATH = path.join(ROOT_DIR, "public", "data", "economy", "currency.json")
const DEFAULT_TIERS_PATH = path.join(ROOT_DIR, "public", "data", "tiers", "tiers-early.json")
const DEFAULT_UNIQUES_INDEX_PATH = path.join(ROOT_DIR, "public", "data", "uniques", "index.json")
const DEFAULT_UNIQUES_DIR = path.join(ROOT_DIR, "public", "data", "uniques")

const ARMOUR_VARIANT_LABELS = {
  str: "Armour",
  dex: "Evasion",
  int: "Energy Shield",
}

const VARIANT_BASE_LABELS = {
  Body_Armours: "Body Armours",
  Boots: "Boots",
  Gloves: "Gloves",
  Helmets: "Helmets",
  Shields: "Shields",
}

const DIRECT_PICKIT_CATEGORY_BY_SLUG = {
  Charms: "Flask",
  Life_Flasks: "Flask",
  Mana_Flasks: "Flask",
  Amulets: "Amulet",
  Belts: "Belt",
  Rings: "Ring",
  Bucklers: "Shield",
  Foci: "Focus",
  Quivers: "Quiver",
  Claws: "Claw",
  Daggers: "Dagger",
  Flails: "Flail",
  One_Hand_Axes: "OneHandAxe",
  One_Hand_Maces: "OneHandMace",
  One_Hand_Swords: "OneHandSword",
  Sceptres: "Sceptre",
  Spears: "Spear",
  Wands: "Wand",
  Bows: "Bow",
  Crossbows: "Crossbow",
  Quarterstaves: "Quarterstaff",
  Staves: "Staff",
  Talismans: null,
  Traps: "Trap",
  Two_Hand_Axes: "TwoHandAxe",
  Two_Hand_Maces: "TwoHandMace",
  Two_Hand_Swords: "TwoHandSword",
  Waystones_low_tier: "Waystone",
  Waystones_mid_tier: "Waystone",
  Waystones_top_tier: "Waystone",
  Emerald: "Jewel",
  Ruby: "Jewel",
  Sapphire: "Jewel",
  "Time-Lost_Emerald": "Jewel",
  "Time-Lost_Ruby": "Jewel",
  "Time-Lost_Sapphire": "Jewel",
}

function serializeJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`
}

function parseArgs(argv) {
  const options = {
    check: false,
    sourceDir: "",
    augmentationPath: DEFAULT_AUGMENTATION_PATH,
    catalogOutPath: DEFAULT_CATALOG_OUT_PATH,
    destAffixDir: DEFAULT_DEST_AFFIX_DIR,
    currencyPath: DEFAULT_CURRENCY_PATH,
    tiersPath: DEFAULT_TIERS_PATH,
    uniquesIndexPath: DEFAULT_UNIQUES_INDEX_PATH,
    uniquesDir: DEFAULT_UNIQUES_DIR,
  }

  for (let index = 0; index < argv.length; index++) {
    const part = argv[index]
    if (part === "--check") {
      options.check = true
      continue
    }
    if (part === "--source") {
      options.sourceDir = argv[index + 1] || ""
      index += 1
      continue
    }
    if (part === "--augmentation") {
      options.augmentationPath = argv[index + 1] || options.augmentationPath
      index += 1
      continue
    }
    if (part === "--catalog-out") {
      options.catalogOutPath = argv[index + 1] || options.catalogOutPath
      index += 1
      continue
    }
    if (part === "--dest-affixes") {
      options.destAffixDir = argv[index + 1] || options.destAffixDir
      index += 1
      continue
    }
    if (part === "--currency") {
      options.currencyPath = argv[index + 1] || options.currencyPath
      index += 1
      continue
    }
    if (part === "--tiers") {
      options.tiersPath = argv[index + 1] || options.tiersPath
      index += 1
      continue
    }
    if (part === "--unique-index") {
      options.uniquesIndexPath = argv[index + 1] || options.uniquesIndexPath
      index += 1
      continue
    }
    if (part === "--uniques-dir") {
      options.uniquesDir = argv[index + 1] || options.uniquesDir
      index += 1
      continue
    }
    throw new Error(`Unknown argument: ${part}`)
  }

  if (!options.sourceDir) {
    throw new Error("Missing required --source <affix-directory> argument.")
  }

  return {
    ...options,
    sourceDir: path.resolve(options.sourceDir),
    augmentationPath: path.resolve(options.augmentationPath),
    catalogOutPath: path.resolve(options.catalogOutPath),
    destAffixDir: path.resolve(options.destAffixDir),
    currencyPath: path.resolve(options.currencyPath),
    tiersPath: path.resolve(options.tiersPath),
    uniquesIndexPath: path.resolve(options.uniquesIndexPath),
    uniquesDir: path.resolve(options.uniquesDir),
  }
}

function inferVariantDescriptorParts(slug) {
  const match = slug.match(/_(str|dex|int)(?:_(str|dex|int))?(?:_(str|dex|int))?$/)
  if (!match) return []
  return match
    .slice(1)
    .filter(Boolean)
    .map((part) => ARMOUR_VARIANT_LABELS[part] || part)
}

function inferVariantBaseLabel(slug) {
  for (const [prefix, baseLabel] of Object.entries(VARIANT_BASE_LABELS)) {
    if (slug.startsWith(prefix)) return baseLabel
  }
  return ""
}

export function inferCatalogLabel(item) {
  const variantParts = inferVariantDescriptorParts(item.slug)
  const variantBaseLabel = inferVariantBaseLabel(item.slug)
  if (variantBaseLabel && variantParts.length) {
    return `${variantBaseLabel} ( ${variantParts.join(" / ")} )`
  }

  return typeof item.label === "string" && item.label.trim() ? item.label.trim() : item.slug
}

export function inferPickitCategory(item) {
  if (Object.prototype.hasOwnProperty.call(DIRECT_PICKIT_CATEGORY_BY_SLUG, item.slug)) {
    return DIRECT_PICKIT_CATEGORY_BY_SLUG[item.slug]
  }

  if (item.slug.startsWith("Body_Armours")) return "BodyArmour"
  if (item.slug.startsWith("Boots")) return "Boots"
  if (item.slug.startsWith("Gloves")) return "Gloves"
  if (item.slug.startsWith("Helmets")) return "Helmet"
  if (item.slug.startsWith("Shields")) return "Shield"

  if (item.category === "Tablet") return "Tablet"
  if (item.category === "Relics") return null
  if (item.category === "Jewels") return "Jewel"

  return null
}

function inferItemStatus(pickitCategory) {
  return pickitCategory ? "implemented" : "hidden"
}

function getCategorySortWeight(category, categoryOrder) {
  const index = categoryOrder.indexOf(category)
  return index === -1 ? Number.MAX_SAFE_INTEGER : index
}

function validateAffixPayload(payload, filename) {
  if (!payload || typeof payload !== "object") {
    throw new Error(`Invalid affix payload for ${filename}: expected object.`)
  }
  if (typeof payload.slug !== "string" || !payload.slug) {
    throw new Error(`Invalid affix payload for ${filename}: missing slug.`)
  }
  if (typeof payload.category !== "string" || !payload.category) {
    throw new Error(`Invalid affix payload for ${filename}: missing category.`)
  }
  if (typeof payload.label !== "string" || !payload.label) {
    throw new Error(`Invalid affix payload for ${filename}: missing label.`)
  }
  if (
    !payload.modifier_sections ||
    typeof payload.modifier_sections !== "object" ||
    !Array.isArray(payload.modifier_sections.normal)
  ) {
    throw new Error(`Invalid affix payload for ${filename}: missing modifier_sections.normal array.`)
  }
  if (payload.bases !== undefined && !Array.isArray(payload.bases)) {
    throw new Error(`Invalid affix payload for ${filename}: expected bases to be an array.`)
  }
}

export async function loadAugmentation(augmentationPath) {
  const raw = JSON.parse(await fs.readFile(augmentationPath, "utf-8"))
  return {
    categoryOrder: Array.isArray(raw?.categoryOrder) ? raw.categoryOrder : [],
    itemOverrides: raw?.itemOverrides && typeof raw.itemOverrides === "object" ? raw.itemOverrides : {},
  }
}

export async function readAffixDirectory(sourceDir) {
  const entries = await fs.readdir(sourceDir, { withFileTypes: true })
  const files = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right))

  const items = []
  for (const filename of files) {
    const payload = JSON.parse(await fs.readFile(path.join(sourceDir, filename), "utf-8"))
    validateAffixPayload(payload, filename)
    items.push(payload)
  }

  return items
}

export function buildCatalogDocument(sourceItems, augmentation) {
  const items = sourceItems
    .map((sourceItem) => {
      const override = augmentation.itemOverrides[sourceItem.slug] || {}
      const pickitCategory = override.pickitCategory ?? inferPickitCategory(sourceItem)
      const status = override.status ?? inferItemStatus(pickitCategory)
      const category = override.category ?? sourceItem.category
      const label = override.label ?? inferCatalogLabel(sourceItem)

      return {
        slug: sourceItem.slug,
        category,
        label,
        pickitCategory,
        status,
      }
    })
    .sort((left, right) => {
      const leftWeight = getCategorySortWeight(left.category, augmentation.categoryOrder)
      const rightWeight = getCategorySortWeight(right.category, augmentation.categoryOrder)
      if (leftWeight !== rightWeight) return leftWeight - rightWeight
      if (left.category !== right.category) return left.category.localeCompare(right.category)
      return left.label.localeCompare(right.label)
    })

  return {
    version: 1,
    items,
  }
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true })
}

async function syncAffixFiles(sourceDir, destAffixDir) {
  await ensureDir(destAffixDir)

  const sourceFiles = (await fs.readdir(sourceDir, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right))

  const destFiles = (await fs.readdir(destAffixDir, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => entry.name)

  const sourcePath = path.resolve(sourceDir)
  const destPath = path.resolve(destAffixDir)

  if (sourcePath !== destPath) {
    for (const filename of sourceFiles) {
      await fs.copyFile(path.join(sourceDir, filename), path.join(destAffixDir, filename))
    }
  }

  const sourceFileSet = new Set(sourceFiles)
  for (const filename of destFiles) {
    if (!sourceFileSet.has(filename)) {
      await fs.unlink(path.join(destAffixDir, filename))
    }
  }
}

async function readJsonFile(filePath, label) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf-8"))
  } catch (error) {
    throw new Error(`Failed to read ${label || path.relative(ROOT_DIR, filePath)}: ${error.message}`, { cause: error })
  }
}

async function listJsonFiles(dirPath) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true })
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right))
}

async function validateCatalogAffixParity(catalogDocument, affixDir) {
  const sourceItems = await readAffixDirectory(affixDir)
  const affixSlugs = new Set(sourceItems.map((item) => item.slug))
  const catalogSlugs = new Set((catalogDocument.items || []).map((item) => item.slug))

  for (const item of catalogDocument.items || []) {
    if (!affixSlugs.has(item.slug)) {
      throw new Error(`Catalog data contract failed: missing affix file for catalog slug "${item.slug}".`)
    }
  }

  for (const sourceItem of sourceItems) {
    if (!catalogSlugs.has(sourceItem.slug)) {
      throw new Error(
        `Catalog data contract failed: affix file "${sourceItem.slug}.json" is not listed in catalog.json.`
      )
    }
  }
}

async function validateCurrencyAndTierData(currencyPath, tiersPath) {
  const currencyPayload = await readJsonFile(currencyPath, "currency data")
  const tierPayload = await readJsonFile(tiersPath, "tier data")

  if (!currencyPayload || typeof currencyPayload !== "object" || !Array.isArray(currencyPayload.categories)) {
    throw new Error("Currency data contract failed: expected currency.json to contain { categories: [...] }.")
  }

  const itemNames = new Set()
  for (const category of currencyPayload.categories) {
    const categoryName = typeof category?.name === "string" ? category.name.trim() : ""
    const categorySlug = typeof category?.slug === "string" ? category.slug.trim() : ""
    const items = Array.isArray(category?.items) ? category.items : []

    if (!categoryName || !categorySlug) {
      throw new Error("Currency data contract failed: each category needs name and slug.")
    }

    for (const item of items) {
      const itemName = typeof item?.name === "string" ? item.name.trim() : ""
      if (!itemName) {
        throw new Error(`Currency data contract failed: item in ${categoryName} is missing name.`)
      }
      itemNames.add(itemName)
    }
  }

  if (!tierPayload || typeof tierPayload !== "object" || !tierPayload.tiers || typeof tierPayload.tiers !== "object") {
    throw new Error("Currency data contract failed: expected tiers-early.json to contain { tiers: {...} }.")
  }

  const tierItemNames = new Set()
  for (const [tierName, rawCategories] of Object.entries(tierPayload.tiers)) {
    if (!rawCategories || typeof rawCategories !== "object") {
      throw new Error(`Currency data contract failed: tier "${tierName}" must contain grouped item arrays.`)
    }

    for (const itemNamesInCategory of Object.values(rawCategories)) {
      if (!Array.isArray(itemNamesInCategory)) continue

      for (const itemName of itemNamesInCategory) {
        if (typeof itemName !== "string" || !itemName.trim()) continue
        if (!itemNames.has(itemName)) {
          throw new Error(`Currency data contract failed: tier "${tierName}" references unknown item "${itemName}".`)
        }
        tierItemNames.add(itemName)
      }
    }
  }

  for (const itemName of itemNames) {
    if (!tierItemNames.has(itemName)) {
      throw new Error(`Currency data contract failed: item "${itemName}" is not assigned to a tier.`)
    }
  }

  return {
    categoryCount: currencyPayload.categories.length,
    itemCount: itemNames.size,
    tierCount: Object.keys(tierPayload.tiers).length,
  }
}

async function validateUniqueData(uniquesIndexPath, uniquesDir) {
  const indexPayload = await readJsonFile(uniquesIndexPath, "unique index data")
  if (!indexPayload || typeof indexPayload !== "object" || !Array.isArray(indexPayload.classes)) {
    throw new Error("Unique data contract failed: expected uniques/index.json to contain { classes: [...] }.")
  }

  const listedFiles = new Set()
  let uniqueCount = 0

  for (const entry of indexPayload.classes) {
    const slug = typeof entry?.slug === "string" ? entry.slug.trim() : ""
    const className = typeof entry?.class === "string" ? entry.class.trim() : ""
    const file = typeof entry?.file === "string" ? entry.file.trim() : ""

    if (!slug || !className || !file) {
      throw new Error("Unique data contract failed: each index entry needs slug, class, and file.")
    }

    listedFiles.add(file)
    const classPayload = await readJsonFile(path.join(uniquesDir, file), `uniques/${file}`)
    if (!classPayload || typeof classPayload !== "object" || !Array.isArray(classPayload.uniques)) {
      throw new Error(`Unique data contract failed: uniques/${file} must contain { uniques: [...] }.`)
    }

    for (const unique of classPayload.uniques) {
      const name = typeof unique?.name === "string" ? unique.name.trim() : ""
      const displayName = typeof unique?.display_name === "string" ? unique.display_name.trim() : ""
      const baseName = typeof unique?.base_name === "string" ? unique.base_name.trim() : ""

      if (!name || !displayName || !baseName) {
        throw new Error(`Unique data contract failed: unique in ${file} is missing name, display_name, or base_name.`)
      }
      uniqueCount += 1
    }
  }

  const actualFiles = (await listJsonFiles(uniquesDir)).filter((file) => file !== "index.json")
  for (const file of actualFiles) {
    if (!listedFiles.has(file)) {
      throw new Error(`Unique data contract failed: uniques/${file} is not referenced by index.json.`)
    }
  }

  return {
    classCount: indexPayload.classes.length,
    uniqueCount,
  }
}

export async function validateRuntimeDataContracts(options = {}) {
  const affixDir = path.resolve(options.affixDir || options.sourceDir || DEFAULT_DEST_AFFIX_DIR)
  const catalogDocument =
    options.catalogDocument ||
    JSON.parse(await fs.readFile(options.catalogOutPath || DEFAULT_CATALOG_OUT_PATH, "utf-8"))

  await validateCatalogAffixParity(catalogDocument, affixDir)
  const currencySummary = await validateCurrencyAndTierData(
    path.resolve(options.currencyPath || DEFAULT_CURRENCY_PATH),
    path.resolve(options.tiersPath || DEFAULT_TIERS_PATH)
  )
  const uniqueSummary = await validateUniqueData(
    path.resolve(options.uniquesIndexPath || DEFAULT_UNIQUES_INDEX_PATH),
    path.resolve(options.uniquesDir || DEFAULT_UNIQUES_DIR)
  )

  return {
    catalogItems: catalogDocument.items.length,
    ...currencySummary,
    ...uniqueSummary,
  }
}

export async function importCatalog(options) {
  const augmentation = await loadAugmentation(options.augmentationPath)
  const sourceItems = await readAffixDirectory(options.sourceDir)
  const catalogDocument = buildCatalogDocument(sourceItems, augmentation)
  const nextCatalogJson = serializeJson(catalogDocument)

  if (options.check) {
    const currentCatalogJson = await fs.readFile(options.catalogOutPath, "utf-8")
    if (currentCatalogJson !== nextCatalogJson) {
      throw new Error(
        `Catalog drift detected for ${path.relative(ROOT_DIR, options.catalogOutPath)}. ` +
          "Run npm run import-catalog -- --source <exported-affix-folder> to refresh it."
      )
    }
    await validateRuntimeDataContracts({
      ...options,
      affixDir: options.sourceDir,
      catalogDocument,
    })
    return catalogDocument
  }

  await syncAffixFiles(options.sourceDir, options.destAffixDir)
  await ensureDir(path.dirname(options.catalogOutPath))
  await fs.writeFile(options.catalogOutPath, nextCatalogJson, "utf-8")
  await validateRuntimeDataContracts({
    ...options,
    affixDir: options.destAffixDir,
    catalogDocument,
  })
  return catalogDocument
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  await importCatalog(options)
  const mode = options.check ? "Checked" : "Imported"
  console.log(`${mode} catalog from ${options.sourceDir}`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  })
}
