<template>
  <div class="row-root">
    <div class="row-config">
      <div class="row-config-head">
        <h3 class="row-title">Row {{ rowIndex + 1 }}</h3>
        <div class="row-head-actions">
          <label class="explanation-toggle">
            <input
                v-model="shouldIncludeExplanation"
                type="checkbox"
                class="explanation-checkbox"
            >
            <span>Add config explanation</span>
          </label>

          <button type="button" class="btn-remove" @click="$emit('remove', rowId)">
            Remove row
          </button>
        </div>
      </div>

      <p class="field-hint">
        Item, currency, and unique rules are implemented. Unique rules support exact pickup and optional
        stat minimum filters; weighted roll scoring can come later.
      </p>

      <RuleActionSelectField
          v-model="selectedActionFlag"
          :action-options="ACTION_OPTIONS"
      />

      <RuleFamilySegmentedControl
          v-model="selectedRuleFamily"
          :options="RULE_FAMILY_OPTIONS"
      />

      <template v-if="isItemRuleFamily">
        <CatalogItemSelectField
            v-model="selectedItemSlug"
            :items="availableItems"
            :disabled="isLoadingCatalog || isLoadingAffixes || !availableItems.length"
        />

        <ItemRaritySelectField
            v-model="selectedRarity"
            :rarity-options="ITEM_RARITY_OPTIONS"
        />

        <CatalogBaseSelectField
            v-model="selectedBaseName"
            :bases="availableBases"
            :disabled="isLoadingAffixes"
        />

        <AffixSlotsEditor
            :slots="affixSlots"
            :visible-affix-families="visibleAffixFamilies"
            :prefix-count="prefixCount"
            :suffix-count="suffixCount"
            :max-slots="MAX_AFFIX_SLOTS"
            :max-prefixes="MAX_PREFIXES"
            :max-suffixes="MAX_SUFFIXES"
            :can-add-affix-slot="canAddAffixSlot"
            :add-affix-disabled-reason="addAffixDisabledReason"
            :affix-key="affixKey"
            :affix-groups-for-slot="affixGroupsForSlot"
            :available-tiers-for-slot="availableTiersForSlot"
            @add-slot="addAffixSlot"
            @remove-slot="removeAffixSlot"
        />
      </template>

      <CurrencyRuleEditor
          v-else-if="isCurrencyRuleFamily"
          v-model:mode="selectedCurrencyMode"
          v-model:selected-tier="selectedCurrencyTier"
          v-model:single-group-selection="selectedSingleGroupSelection"
          v-model:search-text="currencySearchText"
          v-model:selected-item-name="selectedCurrencyItemName"
          v-model:selected-group-item-name="selectedGroupItemName"
          :categories="currencyCategories"
          :tiers="currencyTiers"
          :filtered-items="filteredCurrencyItems"
          :group-items="selectedCurrencyGroupItems"
          :is-loading="isLoadingCurrency"
          :error-message="currencyLoadErrorMessage"
      />

      <UniqueRuleEditor
          v-else-if="isUniqueRuleFamily"
          v-model:selection="selectedUniqueSelection"
          v-model:search-text="uniqueSearchText"
          v-model:selected-item-display-name="selectedUniqueDisplayName"
          v-model:selected-group-item-display-name="selectedUniqueGroupItemDisplayName"
          :classes="uniqueClasses"
          :filtered-items="filteredUniqueItems"
          :group-items="selectedUniqueClassItems"
          :selected-unique-for-stats="selectedUniqueForStats"
          :stat-slots="uniqueStatSlots"
          :stat-options="uniqueStatOptions"
          :stat-options-for-slot="uniqueStatOptionsForSlot"
          :can-add-stat-slot="canAddUniqueStatSlot"
          :add-stat-disabled-reason="addUniqueStatDisabledReason"
          :is-loading="isLoadingUniques"
          :error-message="uniqueLoadErrorMessage"
          @add-stat-slot="addUniqueStatSlot"
          @remove-stat-slot="removeUniqueStatSlot"
      />

      <p v-if="catalogErrorMessage" class="field-error">
        {{ catalogErrorMessage }}
      </p>

      <p v-if="affixLoadErrorMessage" class="field-error">
        {{ affixLoadErrorMessage }}
      </p>

      <button type="button" class="btn-generate" @click="onGenerate">
        Generate row
      </button>
    </div>

    <RowPreviewPanel
        :preview-text="previewText"
        placeholder="No config generated yet."
    />
  </div>
</template>

<script setup>
import {computed, toRef, watch, watchEffect, ref} from "vue"
import {ACTION_OPTIONS} from "../../domain/pickit/actions.js"
import {ITEM_RARITY_OPTIONS} from "../../domain/pickit/rules.js"
import {RULE_FAMILY, RULE_FAMILY_OPTIONS} from "../../domain/pickit/ruleFamilies.js"
import {useCurrencyRuleRow} from "../../composables/useCurrencyRuleRow.js"
import {useItemRuleRow} from "../../composables/useItemRuleRow.js"
import {useUniqueRuleRow} from "../../composables/useUniqueRuleRow.js"
import AffixSlotsEditor from "./AffixSlotsEditor.vue"
import CatalogBaseSelectField from "./CatalogBaseSelectField.vue"
import CatalogItemSelectField from "./CatalogItemSelectField.vue"
import CurrencyRuleEditor from "./CurrencyRuleEditor.vue"
import RowPreviewPanel from "./RowPreviewPanel.vue"
import ItemRaritySelectField from "./ItemRaritySelectField.vue"
import RuleActionSelectField from "./RuleActionSelectField.vue"
import RuleFamilySegmentedControl from "./RuleFamilySegmentedControl.vue"
import UniqueRuleEditor from "./UniqueRuleEditor.vue"

const props = defineProps({
  rowId: {type: String, required: true},
  rowIndex: {type: Number, required: true},
  availableItems: {type: Array, default: () => []},
  isLoadingCatalog: {type: Boolean, default: false},
  catalogErrorMessage: {type: String, default: ""},
})

const emit = defineEmits(["update-lines", "remove"])

const previewText = ref("")
const selectedRuleFamily = ref(RULE_FAMILY.ITEM)
const isItemRuleFamily = computed(() => selectedRuleFamily.value === RULE_FAMILY.ITEM)
const isCurrencyRuleFamily = computed(() => selectedRuleFamily.value === RULE_FAMILY.CURRENCY)
const isUniqueRuleFamily = computed(() => selectedRuleFamily.value === RULE_FAMILY.UNIQUE)

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
  uniqueStatSlotSignature,
  isLoadingUniques,
  uniqueLoadErrorMessage,
  currentUniqueLines,
  ensureUniqueCatalogLoaded,
} = useUniqueRuleRow({
  actionFlagRef: selectedActionFlag,
  includeExplanationRef: shouldIncludeExplanation,
})

const activeGeneratedLines = computed(() => {
  if (isItemRuleFamily.value) return itemCurrentLines.value
  if (isCurrencyRuleFamily.value) return currentCurrencyLines.value
  if (isUniqueRuleFamily.value) return currentUniqueLines.value
  return []
})

watch(isCurrencyRuleFamily, (isCurrency) => {
  if (isCurrency) ensureCurrencyCatalogLoaded()
})

watch(isUniqueRuleFamily, (isUnique) => {
  if (isUnique) ensureUniqueCatalogLoaded()
})

watch(
  () => props.availableItems,
  (items) => {
    if (!items.length) {
      previewText.value = ""
      emit("update-lines", {rowId: props.rowId, lines: []})
    }
  },
  {immediate: true}
)

watchEffect(() => {
  if (isItemRuleFamily.value && isLoadingAffixes.value) return
  if (isCurrencyRuleFamily.value && isLoadingCurrency.value) return
  if (isUniqueRuleFamily.value && isLoadingUniques.value) return

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
  previewText.value = activeGeneratedLines.value.length
    ? activeGeneratedLines.value.join("\n")
    : "Nothing selected."
}

function onGenerateCurrency() {
  if (isLoadingCurrency.value) {
    previewText.value = "Loading currency data."
    return
  }

  if (currencyLoadErrorMessage.value) {
    previewText.value = currencyLoadErrorMessage.value
    return
  }

  setPreviewFromActiveLines()
}

watch(currencyLoadErrorMessage, () => {
  previewText.value = ""
})

function onGenerateUnique() {
  if (isLoadingUniques.value) {
    previewText.value = "Loading unique data."
    return
  }

  if (uniqueLoadErrorMessage.value) {
    previewText.value = uniqueLoadErrorMessage.value
    return
  }

  setPreviewFromActiveLines()
}

watch(uniqueLoadErrorMessage, () => {
  previewText.value = ""
})

function onGenerate() {
  if (isCurrencyRuleFamily.value) {
    onGenerateCurrency()
    return
  }

  if (isUniqueRuleFamily.value) {
    onGenerateUnique()
    return
  }

  if (!selectedItemSlug.value) {
    previewText.value = "Select an item type first."
    return
  }

  setPreviewFromActiveLines()
}

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
