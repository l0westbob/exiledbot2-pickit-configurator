import {ref} from "vue"
import {mount} from "@vue/test-utils"
import {describe, expect, it, vi} from "vitest"

const ensureCatalogLoaded = vi.fn()
const getItemDataForSlug = vi.fn().mockResolvedValue({
  bases: [{name: "Golden Hoop", href: "https://poe2db.tw/Golden_Hoop", requiredLevel: 12}],
  affixes: [
    {
      modifierSection: "essence",
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
    expect(selects).toHaveLength(5)

    const baseSelect = selects[2]
    const affixSelect = selects[3]
    const tierSelect = selects[4]

    await baseSelect.setValue("Golden Hoop")
    await affixSelect.setValue("essence|MaximumLife|prefix|+# to [Life|Life]")
    await tierSelect.setValue("10")

    const buttons = wrapper.findAll("button")
    await buttons.find((button) => button.text() === "Generate row").trigger("click")
    await buttons.find((button) => button.text() === "Generate final").trigger("click")

    expect(wrapper.text()).toContain("// Picks up Ring base Golden Hoop of rarity Magic and StashItem")
    expect(wrapper.text()).toContain("Essence - +# to [Life|Life]")
    expect(wrapper.text()).toContain('[Category] == "Ring" && [Type] == "Golden Hoop" && [Rarity] == "Magic"')
    expect(ensureCatalogLoaded).toHaveBeenCalledTimes(1)
    expect(getItemDataForSlug).toHaveBeenCalledWith("Rings")
  })
})
