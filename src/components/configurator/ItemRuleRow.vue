<template>
  <div class="row-root">
    <div class="row-config">
      <div class="row-config-head">
        <h3 class="row-title">Row {{ rowIndex + 1 }}</h3>
        <div class="row-head-actions">
          <label class="explanation-toggle">
            <input v-model="shouldIncludeExplanation" type="checkbox" class="explanation-checkbox" />
            <span>Add config explanation</span>
          </label>

          <button type="button" class="btn-remove" @click="$emit('remove', rowId)">Remove row</button>
        </div>
      </div>

      <p class="field-hint">
        Item, currency, and unique rules are implemented. Unique rules support exact pickup and optional stat minimum
        filters; weighted roll scoring can come later.
      </p>

      <RuleActionSelectField v-model="selectedActionFlag" :action-options="ACTION_OPTIONS" />

      <RuleFamilySegmentedControl v-model="selectedRuleFamily" :options="ruleFamilyOptions" />

      <component
        :is="activeRuleFamilyEditor"
        v-bind="activeRuleFamilyEditorProps"
        v-on="activeRuleFamilyEditorEvents"
      />

      <p v-if="catalogErrorMessage" class="field-error">
        {{ catalogErrorMessage }}
      </p>

      <p v-if="affixLoadErrorMessage" class="field-error">
        {{ affixLoadErrorMessage }}
      </p>

      <button type="button" class="btn-generate" @click="onGenerate">Generate row</button>
    </div>

    <RowPreviewPanel :preview-text="previewText" placeholder="No config generated yet." />
  </div>
</template>

<script setup>
import { computed, toRef, watch, watchEffect, ref } from "vue"
import { ACTION_OPTIONS } from "../../domain/pickit/actions.js"
import { ITEM_RARITY_OPTIONS } from "../../domain/pickit/rules.js"
import { RULE_FAMILY, getRuleFamilyOptions } from "../../domain/pickit/ruleFamilies.js"
import { useActiveRuleFamilyRuntime } from "../../composables/useActiveRuleFamilyRuntime.js"
import { useCurrencyRuleRow } from "../../composables/useCurrencyRuleRow.js"
import { useItemRuleRow } from "../../composables/useItemRuleRow.js"
import { useUniqueRuleRow } from "../../composables/useUniqueRuleRow.js"
import CurrencyRuleEditor from "./CurrencyRuleEditor.vue"
import RowPreviewPanel from "./RowPreviewPanel.vue"
import ItemRuleEditor from "./ItemRuleEditor.vue"
import RuleActionSelectField from "./RuleActionSelectField.vue"
import RuleFamilySegmentedControl from "./RuleFamilySegmentedControl.vue"
import UniqueRuleEditor from "./UniqueRuleEditor.vue"

const props = defineProps({
  rowId: { type: String, required: true },
  rowIndex: { type: Number, required: true },
  availableItems: { type: Array, default: () => [] },
  isLoadingCatalog: { type: Boolean, default: false },
  catalogErrorMessage: { type: String, default: "" },
})

const emit = defineEmits(["update-lines", "remove"])

const previewText = ref("")
const selectedRuleFamily = ref(RULE_FAMILY.ITEM)
const ruleFamilyOptions = getRuleFamilyOptions()

const {
  MAX_SLOTS: MAX_AFFIX_SLOTS,
  MAX_PREFIXES,
  MAX_SUFFIXES,
  slots: affixSlots,
  prefixCount,
  suffixCount,
  canAddSlot: canAddAffixSlot,
  addDisabledReason: addAffixDisabledReason,
  addSlot: addAffixSlot,
  removeSlot: removeAffixSlot,
  updateSlot: updateAffixSlot,
  affixKey,
  groupsForSlot: affixGroupsForSlot,
  availableTiersForSlot,
  selectedActionFlag,
  shouldIncludeExplanation,
  selectedItemSlug,
  selectedRarity,
  selectedBaseName,
  availableBases,
  visibleAffixFamilies,
  isLoadingAffixes,
  affixLoadErrorMessage,
  currentLines: itemCurrentLines,
} = useItemRuleRow({
  availableItemsRef: toRef(props, "availableItems"),
})

const {
  selectedCurrencyMode,
  selectedCurrencyTier,
  selectedSingleGroupSelection,
  currencySearchText,
  selectedCurrencyItemName,
  selectedGroupItemName,
  currencyCategories,
  currencyTiers,
  filteredCurrencyItems,
  selectedCurrencyGroupItems,
  isLoadingCurrency,
  currencyLoadErrorMessage,
  currentCurrencyLines,
  ensureCurrencyCatalogLoaded,
} = useCurrencyRuleRow({
  actionFlagRef: selectedActionFlag,
  includeExplanationRef: shouldIncludeExplanation,
})

const {
  selectedUniqueSelection,
  uniqueSearchText,
  selectedUniqueDisplayName,
  selectedUniqueGroupItemDisplayName,
  uniqueClasses,
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
  updateUniqueStatSlot,
  uniqueStatSlotSignature,
  isLoadingUniques,
  uniqueLoadErrorMessage,
  currentUniqueLines,
  ensureUniqueCatalogLoaded,
} = useUniqueRuleRow({
  actionFlagRef: selectedActionFlag,
  includeExplanationRef: shouldIncludeExplanation,
})

const familyRuntimeById = {
  [RULE_FAMILY.ITEM]: {
    generatedLines: itemCurrentLines,
    isLoading: isLoadingAffixes,
    errorMessage: affixLoadErrorMessage,
    loadingMessage: "Loading affix data.",
    missingSelectionMessage: computed(() => (selectedItemSlug.value ? "" : "Select an item type first.")),
  },
  [RULE_FAMILY.CURRENCY]: {
    generatedLines: currentCurrencyLines,
    isLoading: isLoadingCurrency,
    errorMessage: currencyLoadErrorMessage,
    loadingMessage: "Loading currency data.",
    missingSelectionMessage: computed(() => ""),
    ensureLoaded: ensureCurrencyCatalogLoaded,
  },
  [RULE_FAMILY.UNIQUE]: {
    generatedLines: currentUniqueLines,
    isLoading: isLoadingUniques,
    errorMessage: uniqueLoadErrorMessage,
    loadingMessage: "Loading unique data.",
    missingSelectionMessage: computed(() => ""),
    ensureLoaded: ensureUniqueCatalogLoaded,
  },
}

const { activeRuleFamily, activeFamilyRuntime, activeGeneratedLines } = useActiveRuleFamilyRuntime(
  selectedRuleFamily,
  familyRuntimeById
)
const isCurrencyRuleFamily = computed(() => activeRuleFamily.value.id === RULE_FAMILY.CURRENCY)
const isUniqueRuleFamily = computed(() => activeRuleFamily.value.id === RULE_FAMILY.UNIQUE)

const ruleFamilyEditorById = {
  [RULE_FAMILY.ITEM]: ItemRuleEditor,
  [RULE_FAMILY.CURRENCY]: CurrencyRuleEditor,
  [RULE_FAMILY.UNIQUE]: UniqueRuleEditor,
}

const activeRuleFamilyEditor = computed(() => ruleFamilyEditorById[activeRuleFamily.value.id] || ItemRuleEditor)

const activeRuleFamilyEditorProps = computed(() => {
  if (isCurrencyRuleFamily.value) {
    return {
      mode: selectedCurrencyMode.value,
      selectedTier: selectedCurrencyTier.value,
      singleGroupSelection: selectedSingleGroupSelection.value,
      searchText: currencySearchText.value,
      selectedItemName: selectedCurrencyItemName.value,
      selectedGroupItemName: selectedGroupItemName.value,
      categories: currencyCategories.value,
      tiers: currencyTiers.value,
      filteredItems: filteredCurrencyItems.value,
      groupItems: selectedCurrencyGroupItems.value,
      isLoading: isLoadingCurrency.value,
      errorMessage: currencyLoadErrorMessage.value,
    }
  }

  if (isUniqueRuleFamily.value) {
    return {
      selection: selectedUniqueSelection.value,
      searchText: uniqueSearchText.value,
      selectedItemDisplayName: selectedUniqueDisplayName.value,
      selectedGroupItemDisplayName: selectedUniqueGroupItemDisplayName.value,
      classes: uniqueClasses.value,
      filteredItems: filteredUniqueItems.value,
      groupItems: selectedUniqueClassItems.value,
      selectedUniqueForStats: selectedUniqueForStats.value,
      statSlots: uniqueStatSlots.value,
      statOptions: uniqueStatOptions.value,
      statOptionsForSlot: uniqueStatOptionsForSlot,
      canAddStatSlot: canAddUniqueStatSlot.value,
      addStatDisabledReason: addUniqueStatDisabledReason.value,
      isLoading: isLoadingUniques.value,
      errorMessage: uniqueLoadErrorMessage.value,
    }
  }

  return {
    selectedItemSlug: selectedItemSlug.value,
    selectedRarity: selectedRarity.value,
    selectedBaseName: selectedBaseName.value,
    availableItems: props.availableItems,
    rarityOptions: ITEM_RARITY_OPTIONS,
    availableBases: availableBases.value,
    affixSlots: affixSlots.value,
    visibleAffixFamilies: visibleAffixFamilies.value,
    prefixCount: prefixCount.value,
    suffixCount: suffixCount.value,
    maxAffixSlots: MAX_AFFIX_SLOTS,
    maxPrefixes: MAX_PREFIXES,
    maxSuffixes: MAX_SUFFIXES,
    canAddAffixSlot: canAddAffixSlot.value,
    addAffixDisabledReason: addAffixDisabledReason.value,
    affixKey,
    affixGroupsForSlot,
    availableTiersForSlot,
    isLoadingCatalog: props.isLoadingCatalog,
    isLoadingAffixes: isLoadingAffixes.value,
  }
})

const activeRuleFamilyEditorEvents = computed(() => {
  if (isCurrencyRuleFamily.value) {
    return {
      "update:mode": (value) => {
        selectedCurrencyMode.value = value
      },
      "update:selectedTier": (value) => {
        selectedCurrencyTier.value = value
      },
      "update:singleGroupSelection": (value) => {
        selectedSingleGroupSelection.value = value
      },
      "update:searchText": (value) => {
        currencySearchText.value = value
      },
      "update:selectedItemName": (value) => {
        selectedCurrencyItemName.value = value
      },
      "update:selectedGroupItemName": (value) => {
        selectedGroupItemName.value = value
      },
    }
  }

  if (isUniqueRuleFamily.value) {
    return {
      "update:selection": (value) => {
        selectedUniqueSelection.value = value
      },
      "update:searchText": (value) => {
        uniqueSearchText.value = value
      },
      "update:selectedItemDisplayName": (value) => {
        selectedUniqueDisplayName.value = value
      },
      "update:selectedGroupItemDisplayName": (value) => {
        selectedUniqueGroupItemDisplayName.value = value
      },
      "add-stat-slot": addUniqueStatSlot,
      "remove-stat-slot": removeUniqueStatSlot,
      "update-stat-slot": updateUniqueStatSlot,
    }
  }

  return {
    "update:selectedItemSlug": (value) => {
      selectedItemSlug.value = value
    },
    "update:selectedRarity": (value) => {
      selectedRarity.value = value
    },
    "update:selectedBaseName": (value) => {
      selectedBaseName.value = value
    },
    "add-affix-slot": addAffixSlot,
    "remove-affix-slot": removeAffixSlot,
    "update-affix-slot": updateAffixSlot,
  }
})

watch(
  () => props.availableItems,
  (items) => {
    if (!items.length) {
      previewText.value = ""
      emit("update-lines", { rowId: props.rowId, lines: [] })
    }
  },
  { immediate: true }
)

watchEffect(() => {
  if (activeFamilyRuntime.value.isLoading.value) return

  emit("update-lines", {
    rowId: props.rowId,
    lines: activeGeneratedLines.value,
  })
})

watch(
  [
    selectedItemSlug,
    selectedRuleFamily,
    selectedCurrencyMode,
    selectedCurrencyTier,
    selectedSingleGroupSelection,
    currencySearchText,
    selectedCurrencyItemName,
    selectedGroupItemName,
    selectedUniqueSelection,
    uniqueSearchText,
    selectedUniqueDisplayName,
    selectedUniqueGroupItemDisplayName,
    uniqueStatSlotSignature,
  ],
  () => {
    previewText.value = ""
  }
)

function setPreviewFromActiveLines() {
  previewText.value = activeGeneratedLines.value.length ? activeGeneratedLines.value.join("\n") : "Nothing selected."
}

function onGenerate() {
  activeFamilyRuntime.value.ensureLoaded?.()

  if (activeFamilyRuntime.value.isLoading.value) {
    previewText.value = activeFamilyRuntime.value.loadingMessage
    return
  }

  if (activeFamilyRuntime.value.errorMessage.value) {
    previewText.value = activeFamilyRuntime.value.errorMessage.value
    return
  }

  const missingSelectionMessage = activeFamilyRuntime.value.missingSelectionMessage.value
  if (missingSelectionMessage) {
    previewText.value = missingSelectionMessage
    return
  }

  setPreviewFromActiveLines()
}

watch([affixLoadErrorMessage, currencyLoadErrorMessage, uniqueLoadErrorMessage], () => {
  previewText.value = ""
})
</script>

<style scoped>
.row-root {
  display: grid;
  grid-template-columns: minmax(0, 1.7fr) minmax(0, 2fr);
  gap: 1rem;
  padding: 0.75rem;
  margin-bottom: 0.75rem;
  border-radius: 0.75rem;
  background: #020617;
  border: 1px solid #1f2937;
}

.row-config {
  display: flex;
  flex-direction: column;
}

.row-config-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.row-head-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.row-title {
  margin: 0 0 0.5rem;
  font-size: 0.95rem;
  color: #e5e7eb;
}

.explanation-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: #cbd5e1;
  font-size: 0.8rem;
  cursor: pointer;
  user-select: none;
}

.explanation-checkbox {
  width: 0.9rem;
  height: 0.9rem;
  accent-color: #64748b;
}

.btn-remove {
  padding: 0.25rem 0.6rem;
  border-radius: 0.5rem;
  border: 1px solid #4b5563;
  background: #111827;
  color: #e5e7eb;
  font-size: 0.8rem;
  cursor: pointer;
}

.btn-generate {
  align-self: flex-start;
  margin-top: 0.25rem;
  padding: 0.35rem 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid #4b5563;
  background: #111827;
  color: #e5e7eb;
  font-size: 0.85rem;
  cursor: pointer;
}

.field-error {
  font-size: 0.8rem;
  color: #f97373;
  margin: 0.5rem 0 0.5rem;
}

.field-hint {
  font-size: 0.8rem;
  color: #9ca3af;
  margin: 0 0 0.75rem;
}
</style>
