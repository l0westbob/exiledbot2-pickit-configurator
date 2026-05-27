import { computed, ref, watch } from "vue"
import {
  CURRENCY_GROUP_ALL_VALUE,
  CURRENCY_ALL_TIERS_VALUE,
  CURRENCY_SELECTION_MODE,
  CURRENCY_SINGLE_GROUP_SELECTION,
  DEFAULT_CURRENCY_TIER,
  filterCurrencyItemsBySearch,
  generateCurrencyRuleLines,
} from "../domain/pickit/currency.js"
import { loadCurrencyCatalog } from "../services/currencyService.js"

export function useCurrencyRuleRow(options) {
  const actionFlagRef = options.actionFlagRef
  const includeExplanationRef = options.includeExplanationRef

  const selectedCurrencyMode = ref(CURRENCY_SELECTION_MODE.TIER)
  const selectedCurrencyTier = ref(DEFAULT_CURRENCY_TIER)
  const selectedSingleGroupSelection = ref(CURRENCY_SINGLE_GROUP_SELECTION.ALL)
  const currencySearchText = ref("")
  const selectedCurrencyItemName = ref("")
  const selectedGroupItemName = ref(CURRENCY_GROUP_ALL_VALUE)
  const currencyCatalog = ref(null)
  const isLoadingCurrency = ref(false)
  const currencyLoadErrorMessage = ref("")
  let hasStartedCurrencyLoad = false

  const currencyCategories = computed(() => currencyCatalog.value?.categories || [])
  const currencyItems = computed(() => currencyCatalog.value?.items || [])
  const currencyTiers = computed(() => [
    { name: CURRENCY_ALL_TIERS_VALUE, items: currencyItems.value },
    ...(currencyCatalog.value?.tiers || []),
  ])
  const filteredCurrencyItems = computed(() => {
    return sortCurrencyItemsByName(filterCurrencyItemsBySearch(currencyItems.value, currencySearchText.value))
  })
  const selectedCurrencyGroup = computed(() => {
    return currencyCategories.value.find((category) => category.slug === selectedSingleGroupSelection.value) || null
  })
  const selectedCurrencyGroupItems = computed(() => sortCurrencyItemsByName(selectedCurrencyGroup.value?.items || []))

  async function ensureCurrencyCatalogLoaded() {
    if (hasStartedCurrencyLoad && (currencyCatalog.value || isLoadingCurrency.value)) return

    hasStartedCurrencyLoad = true
    isLoadingCurrency.value = true
    currencyLoadErrorMessage.value = ""

    try {
      currencyCatalog.value = await loadCurrencyCatalog()
    } catch (error) {
      console.error(error)
      currencyLoadErrorMessage.value = String(error)
      currencyCatalog.value = null
      hasStartedCurrencyLoad = false
    } finally {
      isLoadingCurrency.value = false
    }
  }

  watch(filteredCurrencyItems, (items) => {
    if (selectedSingleGroupSelection.value !== CURRENCY_SINGLE_GROUP_SELECTION.SINGLE) return
    if (items.some((item) => item.name === selectedCurrencyItemName.value)) return
    selectedCurrencyItemName.value = items[0]?.name || ""
  })

  watch(selectedSingleGroupSelection, (selection) => {
    selectedGroupItemName.value = CURRENCY_GROUP_ALL_VALUE
    if (selection !== CURRENCY_SINGLE_GROUP_SELECTION.SINGLE) return
    selectedCurrencyItemName.value = filteredCurrencyItems.value[0]?.name || ""
  })

  const currentCurrencyLines = computed(() => {
    if (!currencyCatalog.value) return []

    return generateCurrencyRuleLines({
      actionFlag: actionFlagRef.value,
      includeExplanation: includeExplanationRef.value,
      catalog: currencyCatalog.value,
      draft: {
        mode: selectedCurrencyMode.value,
        selectedTier: selectedCurrencyTier.value,
        singleGroupSelection: selectedSingleGroupSelection.value,
        searchText: currencySearchText.value,
        selectedItemName: selectedCurrencyItemName.value,
        selectedGroupItemName: selectedGroupItemName.value,
      },
    })
  })

  return {
    selectedCurrencyMode,
    selectedCurrencyTier,
    selectedSingleGroupSelection,
    currencySearchText,
    selectedCurrencyItemName,
    selectedGroupItemName,
    currencyCategories,
    currencyItems,
    currencyTiers,
    filteredCurrencyItems,
    selectedCurrencyGroupItems,
    isLoadingCurrency,
    currencyLoadErrorMessage,
    currentCurrencyLines,
    ensureCurrencyCatalogLoaded,
  }
}

function sortCurrencyItemsByName(items) {
  return [...(Array.isArray(items) ? items : [])].sort((left, right) => left.name.localeCompare(right.name))
}
