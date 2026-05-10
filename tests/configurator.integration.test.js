import {ref} from "vue"
import {mount} from "@vue/test-utils"
import {describe, expect, it, vi} from "vitest"

const ensureCatalogLoaded = vi.fn()
const getAffixesForSlug = vi.fn().mockResolvedValue([
  {
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
])

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
  getAffixesForSlug,
}))

import Configurator from "../src/components/configurator/Configurator.vue"

async function flushPromises() {
  await Promise.resolve()
  await Promise.resolve()
}

describe("Configurator integration", () => {
  it("builds the default item workflow from row selection to final output", async () => {
    const wrapper = mount(Configurator)

    await flushPromises()
    await flushPromises()

    const selects = wrapper.findAll("select")
    expect(selects).toHaveLength(4)

    const affixSelect = selects[2]
    const tierSelect = selects[3]

    await affixSelect.setValue("MaximumLife|prefix|+# to [Life|Life]")
    await tierSelect.setValue("10")

    const buttons = wrapper.findAll("button")
    await buttons.find((button) => button.text() === "Generate row").trigger("click")
    await buttons.find((button) => button.text() === "Generate final").trigger("click")

    expect(wrapper.text()).toContain("// Picks up Ring of rarity Magic and StashItem")
    expect(wrapper.text()).toContain('[Category] == "Ring" && [Rarity] == "Magic"')
    expect(ensureCatalogLoaded).toHaveBeenCalledTimes(1)
    expect(getAffixesForSlug).toHaveBeenCalledWith("Rings")
  })
})
