<template>
  <CatalogItemSelectField
    :model-value="selectedItemSlug"
    :items="availableItems"
    :disabled="isLoadingCatalog || isLoadingAffixes || !availableItems.length"
    @update:model-value="$emit('update:selectedItemSlug', $event)"
  />

  <ItemRaritySelectField
    :model-value="selectedRarity"
    :rarity-options="rarityOptions"
    @update:model-value="$emit('update:selectedRarity', $event)"
  />

  <CatalogBaseSelectField
    :model-value="selectedBaseName"
    :bases="availableBases"
    :disabled="isLoadingAffixes"
    @update:model-value="$emit('update:selectedBaseName', $event)"
  />

  <AffixSlotsEditor
    :slots="affixSlots"
    :visible-affix-families="visibleAffixFamilies"
    :prefix-count="prefixCount"
    :suffix-count="suffixCount"
    :max-slots="maxAffixSlots"
    :max-prefixes="maxPrefixes"
    :max-suffixes="maxSuffixes"
    :can-add-affix-slot="canAddAffixSlot"
    :add-affix-disabled-reason="addAffixDisabledReason"
    :affix-key="affixKey"
    :affix-groups-for-slot="affixGroupsForSlot"
    :available-tiers-for-slot="availableTiersForSlot"
    @add-slot="$emit('add-affix-slot')"
    @remove-slot="$emit('remove-affix-slot', $event)"
    @update-slot="$emit('update-affix-slot', $event)"
  />
</template>

<script setup>
import AffixSlotsEditor from "./AffixSlotsEditor.vue"
import CatalogBaseSelectField from "./CatalogBaseSelectField.vue"
import CatalogItemSelectField from "./CatalogItemSelectField.vue"
import ItemRaritySelectField from "./ItemRaritySelectField.vue"

defineProps({
  selectedItemSlug: { type: String, required: true },
  selectedRarity: { type: String, required: true },
  selectedBaseName: { type: String, required: true },
  availableItems: { type: Array, default: () => [] },
  rarityOptions: { type: Array, default: () => [] },
  availableBases: { type: Array, default: () => [] },
  affixSlots: { type: Array, default: () => [] },
  visibleAffixFamilies: { type: Array, default: () => [] },
  prefixCount: { type: Number, required: true },
  suffixCount: { type: Number, required: true },
  maxAffixSlots: { type: Number, required: true },
  maxPrefixes: { type: Number, required: true },
  maxSuffixes: { type: Number, required: true },
  canAddAffixSlot: { type: Boolean, required: true },
  addAffixDisabledReason: { type: String, required: true },
  affixKey: { type: Function, required: true },
  affixGroupsForSlot: { type: Function, required: true },
  availableTiersForSlot: { type: Function, required: true },
  isLoadingCatalog: { type: Boolean, default: false },
  isLoadingAffixes: { type: Boolean, default: false },
})

defineEmits([
  "update:selectedItemSlug",
  "update:selectedRarity",
  "update:selectedBaseName",
  "add-affix-slot",
  "remove-affix-slot",
  "update-affix-slot",
])
</script>
