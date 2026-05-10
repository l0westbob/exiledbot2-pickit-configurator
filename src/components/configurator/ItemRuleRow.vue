<template>
  <div class="row-root">
    <div class="row-config">
      <div class="row-config-head">
        <h3 class="row-title">Row {{ rowIndex + 1 }}</h3>
        <button type="button" class="btn-remove" @click="$emit('remove', rowId)">
          Remove row
        </button>
      </div>

      <p class="field-hint">
        Item rules are currently the only implemented configurator flow. Planned rule families stay hidden
        until they have real generators.
      </p>

      <RuleActionSelectField
          v-model="selectedActionFlag"
          :action-options="ACTION_OPTIONS"
      />

      <CatalogItemSelectField
          v-model="selectedItemSlug"
          :items="availableItems"
          :disabled="isLoadingCatalog || isLoadingAffixes || !availableItems.length"
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
import {toRef, watch, watchEffect, ref} from "vue"
import {ACTION_OPTIONS} from "../../domain/pickit/actions.js"
import {useItemRuleRow} from "../../composables/useItemRuleRow.js"
import AffixSlotsEditor from "./AffixSlotsEditor.vue"
import CatalogBaseSelectField from "./CatalogBaseSelectField.vue"
import CatalogItemSelectField from "./CatalogItemSelectField.vue"
import RowPreviewPanel from "./RowPreviewPanel.vue"
import RuleActionSelectField from "./RuleActionSelectField.vue"

const props = defineProps({
  rowId: {type: String, required: true},
  rowIndex: {type: Number, required: true},
  availableItems: {type: Array, default: () => []},
  isLoadingCatalog: {type: Boolean, default: false},
  catalogErrorMessage: {type: String, default: ""},
})

const emit = defineEmits(["update-lines", "remove"])

const previewText = ref("")

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
  selectedItemSlug,
  selectedBaseName,
  availableBases,
  visibleAffixFamilies,
  isLoadingAffixes,
  affixLoadErrorMessage,
  currentLines,
} = useItemRuleRow({
  availableItemsRef: toRef(props, "availableItems"),
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
  if (isLoadingAffixes.value) return

  emit("update-lines", {
    rowId: props.rowId,
    lines: currentLines.value,
  })
})

watch(selectedItemSlug, () => {
  previewText.value = ""
})

function onGenerate() {
  if (!selectedItemSlug.value) {
    previewText.value = "Select an item type first."
    return
  }

  previewText.value = currentLines.value.length ? currentLines.value.join("\n") : "Nothing selected."
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

.row-title {
  margin: 0 0 0.5rem;
  font-size: 0.95rem;
  color: #e5e7eb;
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
