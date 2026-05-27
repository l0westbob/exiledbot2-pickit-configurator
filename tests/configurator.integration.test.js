import {ref} from "vue"
import {mount} from "@vue/test-utils"
import {beforeEach, describe, expect, it, vi} from "vitest"

const {ensureCatalogLoaded, getItemDataForSlug, loadCurrencyCatalog, loadUniqueCatalog} = vi.hoisted(() => {
  const mirror = {name: "Mirror of Kalandra", categoryName: "Currency", categorySlug: "Currency"}
  const divine = {name: "Divine Orb", categoryName: "Currency", categorySlug: "Currency"}
  const rune = {
    name: "Hedgewitch Assandra's Rune of Wisdom",
    categoryName: "Runes",
    categorySlug: "Runes",
  }
  const astramentis = {
    name: "Astramentis",
    displayName: "Astramentis Stellar Amulet",
    baseName: "Stellar Amulet",
    className: "Amulets",
    classSlug: "Amulets",
    stats: [
      {
        text: "+(5-7) to all Attributes",
        template: "+# to all Attributes",
        rolls: [{min: 5, max: 7}],
        stat_ids: ["additional all attributes"],
        affix_ids: ["additional_all_attributes"],
      },
      {
        text: "+(50-100) to all Attributes",
        template: "+# to all Attributes",
        rolls: [{min: 50, max: 100}],
        stat_ids: ["additional all attributes"],
        affix_ids: ["additional_all_attributes"],
      },
    ],
  }
  const beacon = {
    name: "Beacon of Azis",
    displayName: "Beacon of Azis Solar Amulet",
    baseName: "Solar Amulet",
    className: "Amulets",
    classSlug: "Amulets",
  }
  const headhunter = {
    name: "Headhunter",
    displayName: "Headhunter Heavy Belt",
    baseName: "Heavy Belt",
    className: "Belts",
    classSlug: "Belts",
  }

  return {
    ensureCatalogLoaded: vi.fn(),
    getItemDataForSlug: vi.fn().mockResolvedValue({
      bases: [{name: "Golden Hoop", href: "https://poe2db.tw/Golden_Hoop", requiredLevel: 12}],
      affixes: [
        {
          modifierSection: "normal",
          family_key: "MaximumLife",
          kind: "prefix",
          template: "+# to [Life|Life]",
          tiers: [
            {
              level: 10,
              name: "Healthy",
              stats: [{id: "base_maximum_life", min: 20, max: 29}],
            },
          ],
        },
      ],
    }),
    loadCurrencyCatalog: vi.fn().mockResolvedValue({
      categories: [
        {name: "Currency", slug: "Currency", items: [mirror, divine]},
        {name: "Runes", slug: "Runes", items: [rune]},
      ],
      items: [mirror, divine, rune],
      tiers: [
        {name: "S", items: [mirror]},
        {name: "A", items: [divine, rune]},
      ],
    }),
    loadUniqueCatalog: vi.fn().mockResolvedValue({
      classes: [
        {name: "Amulets", slug: "Amulets", uniques: [astramentis, beacon]},
        {name: "Belts", slug: "Belts", uniques: [headhunter]},
      ],
      uniques: [astramentis, beacon, headhunter],
    }),
  }
})

vi.mock("../src/composables/useCatalogData.js", () => ({
  useCatalogData: () => ({
    catalogItems: ref([]),
    availableItems: ref([
      {
        slug: "Rings",
        category: "Jewellery",
        label: "Rings",
        pickitCategory: "Ring",
        status: "implemented",
      },
    ]),
    isLoadingCatalog: ref(false),
    catalogErrorMessage: ref(""),
    ensureCatalogLoaded,
  }),
}))

vi.mock("../src/services/catalogService.js", () => ({
  getItemDataForSlug,
}))

vi.mock("../src/services/currencyService.js", () => ({
  loadCurrencyCatalog,
}))

vi.mock("../src/services/uniqueService.js", () => ({
  loadUniqueCatalog,
}))

import Configurator from "../src/components/configurator/Configurator.vue"

async function flushPromises() {
  await Promise.resolve()
  await Promise.resolve()
}

describe("Configurator integration", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("shows rule family buttons with Item selected by default", async () => {
    const wrapper = mount(Configurator)

    await flushPromises()
    await flushPromises()

    const ruleTypeButtons = wrapper
      .findAll('[role="radio"]')
      .map((button) => ({text: button.text(), checked: button.attributes("aria-checked")}))

    expect(ruleTypeButtons).toEqual([
      {text: "Item", checked: "true"},
      {text: "Currency", checked: "false"},
      {text: "Unique", checked: "false"},
    ])
    expect(wrapper.findAll("select")).not.toHaveLength(0)
  })

  it("mentions that some imported affixes are not mapped yet", async () => {
    const wrapper = mount(Configurator)

    await flushPromises()
    await flushPromises()

    expect(wrapper.text()).toContain("Some imported affixes are not mapped yet")
  })

  it("keeps config explanations disabled by default", async () => {
    const wrapper = mount(Configurator)

    await flushPromises()
    await flushPromises()

    const explanationToggle = wrapper.find('input[type="checkbox"]')

    expect(explanationToggle.exists()).toBe(true)
    expect(explanationToggle.element.checked).toBe(false)
  })

  it("shows Normal rarity by default and syncs rarity from selected affixes", async () => {
    const wrapper = mount(Configurator)

    await flushPromises()
    await flushPromises()

    let selects = wrapper.findAll("select")
    const raritySelect = selects[2]
    const affixSelect = selects[4]

    expect(raritySelect.element.value).toBe("Normal")

    await affixSelect.setValue("normal|MaximumLife|prefix|+# to [Life|Life]")
    await flushPromises()

    selects = wrapper.findAll("select")
    expect(selects[2].element.value).toBe("Magic")
  })

  it("hides item fields and excludes item lines when Currency is selected", async () => {
    const wrapper = mount(Configurator)

    await flushPromises()
    await flushPromises()

    let selects = wrapper.findAll("select")
    await selects[3].setValue("Golden Hoop")
    await selects[4].setValue("normal|MaximumLife|prefix|+# to [Life|Life]")
    await flushPromises()

    selects = wrapper.findAll("select")
    await selects[5].setValue("10")

    await wrapper.findAll("button").find((button) => button.text() === "Currency").trigger("click")
    await flushPromises()

    expect(wrapper.text()).toContain("Currency configuration")
    expect(wrapper.findAll("select")).toHaveLength(3)

    await wrapper.findAll("button").find((button) => button.text() === "Generate final").trigger("click")

    expect(wrapper.text()).toContain('[Type] == "Mirror of Kalandra" # [StashItem] == "true"')
    expect(wrapper.text()).not.toContain('[Category] == "Ring"')
  })

  it("defaults Currency to all tiers and updates output when the tier changes", async () => {
    const wrapper = mount(Configurator)

    await flushPromises()
    await flushPromises()

    await wrapper.findAll("button").find((button) => button.text() === "Currency").trigger("click")
    await flushPromises()

    let selects = wrapper.findAll("select")
    expect(selects[1].element.value).toBe("tier")
    expect(selects[2].element.value).toBe("all")

    await selects[2].setValue("A")
    await wrapper.findAll("button").find((button) => button.text() === "Generate final").trigger("click")

    expect(wrapper.text()).toContain('[Type] == "Divine Orb" # [StashItem] == "true"')
    expect(wrapper.text()).toContain('[Type] == "Hedgewitch Assandra\'s Rune of Wisdom" # [StashItem] == "true"')
    expect(wrapper.text()).not.toContain('[Type] == "Mirror of Kalandra" # [StashItem] == "true"')
  })

  it("filters single currency selections case-insensitively", async () => {
    const wrapper = mount(Configurator)

    await flushPromises()
    await flushPromises()

    await wrapper.findAll("button").find((button) => button.text() === "Currency").trigger("click")
    await flushPromises()

    let selects = wrapper.findAll("select")
    await selects[1].setValue("singleGroup")
    await flushPromises()

    selects = wrapper.findAll("select")
    await selects[2].setValue("single")
    await wrapper.find('input[type="search"]').setValue("DIV")
    await flushPromises()

    await wrapper.findAll("button").find((button) => button.text() === "Generate final").trigger("click")

    expect(wrapper.text()).toContain('[Type] == "Divine Orb" # [StashItem] == "true"')
    expect(wrapper.text()).not.toContain('[Type] == "Mirror of Kalandra" # [StashItem] == "true"')
  })

  it("uses all items in the selected currency group by default", async () => {
    const wrapper = mount(Configurator)

    await flushPromises()
    await flushPromises()

    await wrapper.findAll("button").find((button) => button.text() === "Currency").trigger("click")
    await flushPromises()

    let selects = wrapper.findAll("select")
    await selects[1].setValue("singleGroup")
    await flushPromises()

    selects = wrapper.findAll("select")
    await selects[2].setValue("Runes")
    await flushPromises()

    selects = wrapper.findAll("select")
    expect(selects[3].element.value).toBe("all")

    await wrapper.findAll("button").find((button) => button.text() === "Generate final").trigger("click")

    expect(wrapper.text()).toContain('[Type] == "Hedgewitch Assandra\'s Rune of Wisdom" # [StashItem] == "true"')
    expect(wrapper.text()).not.toContain('[Type] == "Divine Orb" # [StashItem] == "true"')
  })

  it("hides item and currency fields when Unique is selected and defaults to the first class", async () => {
    const wrapper = mount(Configurator)

    await flushPromises()
    await flushPromises()

    let selects = wrapper.findAll("select")
    await selects[3].setValue("Golden Hoop")
    await selects[4].setValue("normal|MaximumLife|prefix|+# to [Life|Life]")
    await flushPromises()

    selects = wrapper.findAll("select")
    await selects[5].setValue("10")

    await wrapper.findAll("button").find((button) => button.text() === "Currency").trigger("click")
    await flushPromises()

    await wrapper.findAll("button").find((button) => button.text() === "Unique").trigger("click")
    await flushPromises()
    await flushPromises()

    expect(wrapper.text()).toContain("Unique selection")
    expect(wrapper.text()).not.toContain("Currency configuration")
    expect(wrapper.text()).not.toContain("Item Type")

    selects = wrapper.findAll("select")
    expect(selects).toHaveLength(3)
    expect(selects[1].element.value).toBe("Amulets")
    expect(selects[2].element.value).toBe("all")

    await wrapper.findAll("button").find((button) => button.text() === "Generate final").trigger("click")

    expect(wrapper.text()).toContain(
      '[Type] == "Stellar Amulet" && [Rarity] == "Unique" # [UniqueName] == "Astramentis" && [StashItem] == "true"'
    )
    expect(wrapper.text()).not.toContain('[Category] == "Ring"')
    expect(wrapper.text()).not.toContain('[Type] == "Mirror of Kalandra" # [StashItem] == "true"')
  })

  it("filters single unique selections case-insensitively", async () => {
    const wrapper = mount(Configurator)

    await flushPromises()
    await flushPromises()

    await wrapper.findAll("button").find((button) => button.text() === "Unique").trigger("click")
    await flushPromises()
    await flushPromises()

    let selects = wrapper.findAll("select")
    await selects[1].setValue("single")
    await flushPromises()

    await wrapper.find('input[type="search"]').setValue("HEAD")
    await flushPromises()

    await wrapper.findAll("button").find((button) => button.text() === "Generate final").trigger("click")

    expect(wrapper.text()).toContain(
      '[Type] == "Heavy Belt" && [Rarity] == "Unique" # [UniqueName] == "Headhunter" && [StashItem] == "true"'
    )
    expect(wrapper.text()).not.toContain(
      '[Type] == "Stellar Amulet" && [Rarity] == "Unique" # [UniqueName] == "Astramentis" && [StashItem] == "true"'
    )
  })

  it("adds unique stat minimum filters and aggregates duplicate stat ids", async () => {
    const wrapper = mount(Configurator)

    await flushPromises()
    await flushPromises()

    await wrapper.findAll("button").find((button) => button.text() === "Unique").trigger("click")
    await flushPromises()
    await flushPromises()

    let selects = wrapper.findAll("select")
    await selects[2].setValue("Astramentis Stellar Amulet")
    await flushPromises()

    expect(wrapper.text()).toContain("Stat minimums for Astramentis Stellar Amulet")

    selects = wrapper.findAll("select")
    let statSelect = selects[3]
    let statOption = statSelect.findAll("option").find((option) => option.text().includes("5-7"))
    await statSelect.setValue(statOption.element.value)
    await wrapper.find('input[type="number"]').setValue("7")

    await wrapper.findAll("button").find((button) => button.text().startsWith("Add stat filter")).trigger("click")
    await flushPromises()

    selects = wrapper.findAll("select")
    statSelect = selects[4]
    statOption = statSelect.findAll("option").find((option) => option.text().includes("50-100"))
    await statSelect.setValue(statOption.element.value)

    const numberInputs = wrapper.findAll('input[type="number"]')
    await numberInputs[1].setValue("100")
    await flushPromises()

    await wrapper.findAll("button").find((button) => button.text() === "Generate final").trigger("click")

    const output = wrapper.text()
    expect(output).toContain(
      '[Type] == "Stellar Amulet" && [Rarity] == "Unique" # [UniqueName] == "Astramentis" && [additional_all_attributes] >= "107" && [StashItem] == "true"'
    )
    expect(output.match(/\[additional_all_attributes\]/g)).toHaveLength(1)
  })

  it("builds the default item workflow from row selection to final output", async () => {
    const wrapper = mount(Configurator)

    await flushPromises()
    await flushPromises()

    let selects = wrapper.findAll("select")
    expect(selects).toHaveLength(5)

    const baseSelect = selects[3]
    const affixSelect = selects[4]

    await baseSelect.setValue("Golden Hoop")
    await affixSelect.setValue("normal|MaximumLife|prefix|+# to [Life|Life]")
    await flushPromises()

    selects = wrapper.findAll("select")
    expect(selects).toHaveLength(6)
    const tierSelect = selects[5]

    await tierSelect.setValue("10")

    const buttons = wrapper.findAll("button")
    await buttons.find((button) => button.text() === "Generate row").trigger("click")
    await buttons.find((button) => button.text() === "Generate final").trigger("click")

    expect(wrapper.text()).not.toContain("// Picks up Ring base Golden Hoop of rarity Magic and StashItem")
    expect(wrapper.text()).toContain("+# to [Life|Life]")
    expect(wrapper.text()).toContain('[Category] == "Ring" && [Type] == "Golden Hoop" && [Rarity] == "Magic"')
    expect(ensureCatalogLoaded).toHaveBeenCalledTimes(1)
    expect(getItemDataForSlug).toHaveBeenCalledWith("Rings")
  })

  it("adds the config explanation when the row checkbox is enabled", async () => {
    const wrapper = mount(Configurator)

    await flushPromises()
    await flushPromises()

    await wrapper.find('input[type="checkbox"]').setValue(true)

    let selects = wrapper.findAll("select")
    await selects[3].setValue("Golden Hoop")
    await selects[4].setValue("normal|MaximumLife|prefix|+# to [Life|Life]")
    await flushPromises()

    selects = wrapper.findAll("select")
    await selects[5].setValue("10")

    const buttons = wrapper.findAll("button")
    await buttons.find((button) => button.text() === "Generate final").trigger("click")

    expect(wrapper.text()).toContain("// Picks up Ring base Golden Hoop of rarity Magic and StashItem")
    expect(wrapper.text()).toContain('[Category] == "Ring" && [Type] == "Golden Hoop" && [Rarity] == "Magic"')
  })
})
