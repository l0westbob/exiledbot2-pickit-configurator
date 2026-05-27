import {computed, reactive, ref, watch} from "vue"
import {
  filterUniquesBySearch,
  generateUniqueRuleLines,
  getDefaultUniqueSelection,
  getUniqueStatOptions,
  resolveUniqueSelectionItems,
  UNIQUE_GROUP_ALL_VALUE,
  UNIQUE_SINGLE_GROUP_SELECTION,
} from "../domain/pickit/uniques.js"
import {loadUniqueCatalog} from "../services/uniqueService.js"

export function useUniqueRuleRow(options) {
  const actionFlagRef = options.actionFlagRef
  const includeExplanationRef = options.includeExplanationRef

  const selectedUniqueSelection = ref("")
  const uniqueSearchText = ref("")
  const selectedUniqueDisplayName = ref("")
  const selectedUniqueGroupItemDisplayName = ref(UNIQUE_GROUP_ALL_VALUE)
  const uniqueCatalog = ref(null)
  const isLoadingUniques = ref(false)
  const uniqueLoadErrorMessage = ref("")
  const uniqueStatSlots = ref([createEmptyStatSlot()])
  let hasStartedUniqueLoad = false

  const uniqueClasses = computed(() => uniqueCatalog.value?.classes || [])
  const uniqueItems = computed(() => uniqueCatalog.value?.uniques || [])
  const filteredUniqueItems = computed(() => {
    return sortUniquesByDisplayName(filterUniquesBySearch(uniqueItems.value, uniqueSearchText.value))
  })
  const selectedUniqueClass = computed(() => {
    return uniqueClasses.value.find((uniqueClass) => uniqueClass.slug === selectedUniqueSelection.value) || null
  })
  const selectedUniqueClassItems = computed(() => sortUniquesByDisplayName(selectedUniqueClass.value?.uniques || []))
  const selectedUniqueForStats = computed(() => {
    if (!uniqueCatalog.value) return null

    const result = resolveUniqueSelectionItems(
      {
        singleGroupSelection: selectedUniqueSelection.value,
        searchText: uniqueSearchText.value,
        selectedItemDisplayName: selectedUniqueDisplayName.value,
        selectedGroupItemDisplayName: selectedUniqueGroupItemDisplayName.value,
      },
      uniqueCatalog.value
    )
    return result.items.length === 1 ? result.items[0] : null
  })
  const uniqueStatOptions = computed(() => getUniqueStatOptions(selectedUniqueForStats.value))
  const uniqueStatSlotSignature = computed(() => {
    return uniqueStatSlots.value
      .map((slot) => `${slot.selectedStatKey || ""}:${slot.minimumValue || ""}`)
      .join("|")
  })
  const canAddUniqueStatSlot = computed(() => {
    if (!selectedUniqueForStats.value) return false
    if (uniqueStatSlots.value.length >= uniqueStatOptions.value.length) return false
    return uniqueStatOptionsForSlot(uniqueStatSlots.value.length).length > 0
  })
  const addUniqueStatDisabledReason = computed(() => {
    if (!selectedUniqueForStats.value) return "Select a single unique first."
    if (!uniqueStatOptions.value.length) return "No mapped stats available for this unique."
    if (uniqueStatSlots.value.length >= uniqueStatOptions.value.length) return "All mapped stats are already available."
    return "No valid stats left to add."
  })

  function createSlotId() {
    if (crypto?.randomUUID) return crypto.randomUUID()
    return `${Date.now()}-${Math.random()}`
  }

  function createEmptyStatSlot() {
    return reactive({
      id: createSlotId(),
      selectedStatKey: null,
      minimumValue: "",
    })
  }

  function resetUniqueStatSlots() {
    uniqueStatSlots.value = [createEmptyStatSlot()]
  }

  function addUniqueStatSlot() {
    if (!canAddUniqueStatSlot.value) return
    uniqueStatSlots.value.push(createEmptyStatSlot())
  }

  function removeUniqueStatSlot(slotIndex) {
    if (uniqueStatSlots.value.length <= 1) return
    uniqueStatSlots.value.splice(slotIndex, 1)
  }

  function uniqueStatOptionsForSlot(slotIndex) {
    const excludedKeys = new Set()
    const currentSelectedKey = uniqueStatSlots.value[slotIndex]?.selectedStatKey || null
    const earlierSlotsEnd = Math.min(slotIndex, uniqueStatSlots.value.length)

    for (let i = 0; i < earlierSlotsEnd; i++) {
      const selectedKey = uniqueStatSlots.value[i]?.selectedStatKey
      if (selectedKey) excludedKeys.add(selectedKey)
    }

    return uniqueStatOptions.value.filter((statOption) => {
      if (currentSelectedKey && statOption.key === currentSelectedKey) return true
      return !excludedKeys.has(statOption.key)
    })
  }

  async function ensureUniqueCatalogLoaded() {
    if (hasStartedUniqueLoad && (uniqueCatalog.value || isLoadingUniques.value)) return

    hasStartedUniqueLoad = true
    isLoadingUniques.value = true
    uniqueLoadErrorMessage.value = ""

    try {
      uniqueCatalog.value = await loadUniqueCatalog()
      if (!selectedUniqueSelection.value) {
        selectedUniqueSelection.value = getDefaultUniqueSelection(uniqueCatalog.value)
      }
    } catch (error) {
      console.error(error)
      uniqueLoadErrorMessage.value = String(error)
      uniqueCatalog.value = null
      hasStartedUniqueLoad = false
    } finally {
      isLoadingUniques.value = false
    }
  }

  watch(uniqueClasses, (classes) => {
    const currentSelection = selectedUniqueSelection.value
    if (!classes.length) return
    if (!currentSelection) {
      selectedUniqueSelection.value = getDefaultUniqueSelection({classes})
      return
    }

    if (
      ![UNIQUE_SINGLE_GROUP_SELECTION.ALL, UNIQUE_SINGLE_GROUP_SELECTION.SINGLE].includes(currentSelection) &&
      !classes.some((uniqueClass) => uniqueClass.slug === currentSelection)
    ) {
      selectedUniqueSelection.value = getDefaultUniqueSelection({classes})
    }
  })

  watch(filteredUniqueItems, (items) => {
    if (selectedUniqueSelection.value !== UNIQUE_SINGLE_GROUP_SELECTION.SINGLE) return
    if (items.some((unique) => unique.displayName === selectedUniqueDisplayName.value)) return
    selectedUniqueDisplayName.value = items[0]?.displayName || ""
  })

  watch(selectedUniqueSelection, (selection) => {
    selectedUniqueGroupItemDisplayName.value = UNIQUE_GROUP_ALL_VALUE
    if (selection !== UNIQUE_SINGLE_GROUP_SELECTION.SINGLE) return
    selectedUniqueDisplayName.value = filteredUniqueItems.value[0]?.displayName || ""
  })

  watch(
    () => selectedUniqueForStats.value?.displayName || "",
    () => {
      resetUniqueStatSlots()
    }
  )

  watch(
    () => uniqueStatSlots.value.map((slot) => slot.selectedStatKey),
    (nextKeys, previousKeys) => {
      for (let i = 0; i < nextKeys.length; i++) {
        if (nextKeys[i] !== (previousKeys?.[i] ?? null) && uniqueStatSlots.value[i]) {
          uniqueStatSlots.value[i].minimumValue = ""
        }
      }
    }
  )

  const currentUniqueLines = computed(() => {
    if (!uniqueCatalog.value) return []

    return generateUniqueRuleLines({
      actionFlag: actionFlagRef.value,
      includeExplanation: includeExplanationRef.value,
      catalog: uniqueCatalog.value,
      draft: {
        singleGroupSelection: selectedUniqueSelection.value,
        searchText: uniqueSearchText.value,
        selectedItemDisplayName: selectedUniqueDisplayName.value,
        selectedGroupItemDisplayName: selectedUniqueGroupItemDisplayName.value,
        statSlots: uniqueStatSlots.value,
      },
    })
  })

  return {
    selectedUniqueSelection,
    uniqueSearchText,
    selectedUniqueDisplayName,
    selectedUniqueGroupItemDisplayName,
    uniqueClasses,
    uniqueItems,
    filteredUniqueItems,
    selectedUniqueClassItems,
    selectedUniqueForStats,
    uniqueStatSlots,
    uniqueStatOptions,
    uniqueStatOptionsForSlot,
    canAddUniqueStatSlot,
    addUniqueStatDisabledReason,
    addUniqueStatSlot,
    removeUniqueStatSlot,
    uniqueStatSlotSignature,
    isLoadingUniques,
    uniqueLoadErrorMessage,
    currentUniqueLines,
    ensureUniqueCatalogLoaded,
  }
}

function sortUniquesByDisplayName(uniques) {
  return [...(Array.isArray(uniques) ? uniques : [])].sort((left, right) => {
    return left.displayName.localeCompare(right.displayName)
  })
}
