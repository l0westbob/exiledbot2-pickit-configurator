import {computed, ref, watch} from "vue"
import {filterVisibleAffixes} from "../domain/pickit/affixes.js"
import {DEFAULT_ACTION_FLAG} from "../domain/pickit/actions.js"
import {generateRulePreviewLines} from "../domain/pickit/rules.js"
import {getItemDataForSlug} from "../services/catalogService.js"
import {useAffixSlots} from "./useAffixSlots.js"

export function useItemRuleRow(options) {
  const availableItemsRef = options.availableItemsRef

  const selectedActionFlag = ref(DEFAULT_ACTION_FLAG)
  const selectedItemSlug = ref("")
  const selectedBaseName = ref("")
  const loadedItemData = ref(null)
  const loadedAffixFamilies = ref([])
  const isLoadingAffixes = ref(false)
  const affixLoadErrorMessage = ref("")

  const selectedItem = computed(() => {
    return (availableItemsRef.value || []).find((item) => item.slug === selectedItemSlug.value) || null
  })

  const visibleAffixFamilies = computed(() => filterVisibleAffixes(loadedAffixFamilies.value))
  const availableBases = computed(() => {
    return Array.isArray(loadedItemData.value?.bases) ? loadedItemData.value.bases : []
  })

  const affixSlotsApi = useAffixSlots({
    affixesRef: visibleAffixFamilies,
    maxSlots: 6,
    maxPrefixes: 3,
    maxSuffixes: 3,
  })

  async function loadAffixesForSelectedItem(slug) {
    if (!slug) {
      loadedItemData.value = null
      loadedAffixFamilies.value = []
      selectedBaseName.value = ""
      affixSlotsApi.resetSlots()
      return
    }

    isLoadingAffixes.value = true
    affixLoadErrorMessage.value = ""

    try {
      const itemData = await getItemDataForSlug(slug)
      loadedItemData.value = itemData
      loadedAffixFamilies.value = Array.isArray(itemData?.affixes) ? itemData.affixes : []
      selectedBaseName.value = ""
      affixSlotsApi.resetSlots()
    } catch (error) {
      console.error(error)
      affixLoadErrorMessage.value = String(error)
      loadedItemData.value = null
      loadedAffixFamilies.value = []
      selectedBaseName.value = ""
      affixSlotsApi.resetSlots()
    } finally {
      isLoadingAffixes.value = false
    }
  }

  watch(
    () => availableItemsRef.value,
    (items) => {
      if (Array.isArray(items) && items.length && !selectedItemSlug.value) {
        selectedItemSlug.value = items[0].slug
      }
    },
    {immediate: true}
  )

  watch(selectedItemSlug, (slug) => {
    loadAffixesForSelectedItem(slug)
  })

  const currentLines = computed(() => {
    return generateRulePreviewLines({
      actionFlag: selectedActionFlag.value,
      selectedItemSlug: selectedItemSlug.value,
      selectedItem: selectedItem.value,
      selectedBaseName: selectedBaseName.value,
      affixSlots: affixSlotsApi.slots.value,
      findAffixByKey: affixSlotsApi.findAffixByKey,
      availableTiersForSlot: affixSlotsApi.availableTiersForSlot,
    })
  })

  return {
    selectedActionFlag,
    selectedItemSlug,
    selectedItem,
    selectedBaseName,
    availableBases,
    visibleAffixFamilies,
    isLoadingAffixes,
    affixLoadErrorMessage,
    currentLines,
    ...affixSlotsApi,
  }
}
