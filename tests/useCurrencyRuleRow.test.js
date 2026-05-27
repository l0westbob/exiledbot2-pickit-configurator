import { ref } from "vue"
import { beforeEach, describe, expect, it, vi } from "vitest"

const { loadCurrencyCatalog } = vi.hoisted(() => ({
  loadCurrencyCatalog: vi.fn(),
}))

vi.mock("../src/services/currencyService.js", () => ({
  loadCurrencyCatalog,
}))

import { useCurrencyRuleRow } from "../src/composables/useCurrencyRuleRow.js"
import { CURRENCY_SELECTION_MODE } from "../src/domain/pickit/currency.js"

const mirror = { name: "Mirror of Kalandra", categoryName: "Currency", categorySlug: "Currency" }
const divine = { name: "Divine Orb", categoryName: "Currency", categorySlug: "Currency" }

describe("useCurrencyRuleRow", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    loadCurrencyCatalog.mockResolvedValue({
      categories: [{ name: "Currency", slug: "Currency", items: [mirror, divine] }],
      items: [mirror, divine],
      tiers: [{ name: "S", items: [mirror] }],
    })
  })

  it("loads the currency catalog and generates tier rules from row-level action state", async () => {
    const row = useCurrencyRuleRow({
      actionFlagRef: ref("StashItem"),
      includeExplanationRef: ref(false),
    })

    await row.ensureCurrencyCatalogLoaded()
    row.selectedCurrencyMode.value = CURRENCY_SELECTION_MODE.TIER
    row.selectedCurrencyTier.value = "S"

    expect(row.currentCurrencyLines.value).toEqual(['[Type] == "Mirror of Kalandra" # [StashItem] == "true"'])
    expect(loadCurrencyCatalog).toHaveBeenCalledTimes(1)
  })

  it("keeps single selection synced to the filtered search result", async () => {
    const row = useCurrencyRuleRow({
      actionFlagRef: ref("StashItem"),
      includeExplanationRef: ref(false),
    })

    await row.ensureCurrencyCatalogLoaded()
    row.selectedCurrencyMode.value = CURRENCY_SELECTION_MODE.SINGLE_GROUP
    row.selectedSingleGroupSelection.value = "single"
    row.currencySearchText.value = "div"

    expect(row.filteredCurrencyItems.value.map((item) => item.name)).toEqual(["Divine Orb"])
    expect(row.currentCurrencyLines.value).toEqual(['[Type] == "Divine Orb" # [StashItem] == "true"'])
  })
})
