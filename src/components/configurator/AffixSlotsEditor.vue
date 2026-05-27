<template>
  <div>
    <p v-if="visibleAffixFamilies.length" class="field-hint">
      Prefixes: {{ prefixCount }}/{{ maxPrefixes }}, Suffixes: {{ suffixCount }}/{{ maxSuffixes }}
    </p>

    <SlotCard
      v-for="(slot, idx) in slots"
      :key="slot.id"
      :title="`Affix ${idx + 1}`"
      :removable="slots.length > 1"
      @remove="$emit('remove-slot', idx)"
    >
      <ConfigSelectField
        v-if="visibleAffixFamilies.length"
        label="Affix"
        :model-value="slot.selectedAffixKey"
        @change="$emit('update-slot', { slotIndex: idx, selectedAffixKey: $event })"
      >
        <option value="" disabled>Select affix...</option>

        <optgroup v-for="group in affixGroupsForSlot(idx)" :key="group.label" :label="group.label">
          <option v-for="affix in group.items" :key="affixKey(affix)" :value="affixKey(affix)">
            {{ affix.template || "Unnamed affix" }}
          </option>
        </optgroup>
      </ConfigSelectField>

      <ConfigSelectField
        v-if="availableTiersForSlot(idx).length"
        label="Tier"
        :model-value="slot.selectedTierLevel"
        @change="$emit('update-slot', { slotIndex: idx, selectedTierLevel: $event })"
      >
        <option value="" disabled>Select tier...</option>
        <option v-for="tier in availableTiersForSlot(idx)" :key="tier.level" :value="tier.level">
          T{{ tierIndexFromBottom(availableTiersForSlot(idx), tier.level) }} (lvl {{ tier.level }}) -
          {{ tier.name || "unnamed" }}
        </option>
      </ConfigSelectField>
    </SlotCard>

    <button
      type="button"
      class="btn-add-affix"
      :disabled="slots.length >= maxSlots || !canAddAffixSlot"
      :title="!canAddAffixSlot ? addAffixDisabledReason : ''"
      @click="$emit('add-slot')"
    >
      Add affix ({{ slots.length }}/{{ maxSlots }})
    </button>
  </div>
</template>

<script setup>
import { tierIndexFromBottom } from "../../domain/pickit/rules.js"
import ConfigSelectField from "./ConfigSelectField.vue"
import SlotCard from "./SlotCard.vue"

defineProps({
  slots: { type: Array, default: () => [] },
  visibleAffixFamilies: { type: Array, default: () => [] },
  prefixCount: { type: Number, required: true },
  suffixCount: { type: Number, required: true },
  maxSlots: { type: Number, required: true },
  maxPrefixes: { type: Number, required: true },
  maxSuffixes: { type: Number, required: true },
  canAddAffixSlot: { type: Boolean, required: true },
  addAffixDisabledReason: { type: String, required: true },
  affixKey: { type: Function, required: true },
  affixGroupsForSlot: { type: Function, required: true },
  availableTiersForSlot: { type: Function, required: true },
})

defineEmits(["add-slot", "remove-slot", "update-slot"])
</script>

<style scoped>
.field-hint {
  font-size: 0.8rem;
  color: #9ca3af;
  margin: 0 0 0.5rem;
}

.btn-add-affix {
  align-self: flex-start;
  margin: 0.25rem 0 0.75rem;
  padding: 0.35rem 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid #4b5563;
  background: #111827;
  color: #e5e7eb;
  font-size: 0.85rem;
  cursor: pointer;
}

.btn-add-affix:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
