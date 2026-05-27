import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { afterEach, describe, expect, it } from "vitest"

import {
  buildCatalogDocument,
  importCatalog,
  loadAugmentation,
  readAffixDirectory,
  validateRuntimeDataContracts,
} from "../scripts/import-catalog.mjs"

const fixtureSourceDir = path.resolve("tests/fixtures/import-source/affixes")
const augmentationPath = path.resolve("config/catalog-augmentation.json")

const tmpDirs = []

async function makeTmpDir() {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "pickit-catalog-test-"))
  tmpDirs.push(dir)
  return dir
}

afterEach(async () => {
  await Promise.all(tmpDirs.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true })))
})

describe("catalog import", () => {
  it("builds the app-facing catalog with inferred labels and statuses", async () => {
    const augmentation = await loadAugmentation(augmentationPath)
    const sourceItems = await readAffixDirectory(fixtureSourceDir)

    const catalog = buildCatalogDocument(sourceItems, augmentation)

    expect(catalog.items).toEqual([
      {
        slug: "Body_Armours_str_dex_int",
        category: "Body Armours",
        label: "Body Armours ( Armour / Evasion / Energy Shield )",
        pickitCategory: "BodyArmour",
        status: "implemented",
      },
      {
        slug: "Rings",
        category: "Jewellery",
        label: "Rings",
        pickitCategory: "Ring",
        status: "implemented",
      },
      {
        slug: "Talismans",
        category: "Two Handed Weapons",
        label: "Talismans",
        pickitCategory: null,
        status: "hidden",
      },
    ])
  })

  it("imports affix files and validates catalog parity in check mode", async () => {
    const tmpDir = await makeTmpDir()
    const affixOutDir = path.join(tmpDir, "affixes")
    const catalogOutPath = path.join(tmpDir, "catalog.json")

    await importCatalog({
      sourceDir: fixtureSourceDir,
      augmentationPath,
      destAffixDir: affixOutDir,
      catalogOutPath,
      check: false,
    })

    const catalogJson = JSON.parse(await fs.readFile(catalogOutPath, "utf-8"))
    expect(catalogJson.items).toHaveLength(3)

    await expect(
      importCatalog({
        sourceDir: fixtureSourceDir,
        augmentationPath,
        destAffixDir: affixOutDir,
        catalogOutPath,
        check: true,
      })
    ).resolves.toBeTruthy()

    await fs.writeFile(catalogOutPath, '{"version":1,"items":[]}\n', "utf-8")

    await expect(
      importCatalog({
        sourceDir: fixtureSourceDir,
        augmentationPath,
        destAffixDir: affixOutDir,
        catalogOutPath,
        check: true,
      })
    ).rejects.toThrow("Catalog drift detected")
  })

  it("validates checked-in runtime data contracts", async () => {
    await expect(validateRuntimeDataContracts()).resolves.toMatchObject({
      catalogItems: 78,
      categoryCount: 15,
      itemCount: 437,
      tierCount: 7,
      classCount: 27,
      uniqueCount: 403,
    })
  })
})
