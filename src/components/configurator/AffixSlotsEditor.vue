<template>
  <div>
    <p v-if="visibleAffixFamilies.length" class="field-hint">
      Prefixes: {{ prefixCount }}/{{ maxPrefixes }}, Suffixes: {{ suffixCount }}/{{ maxSuffixes }}
    </p>

    <div v-for="(slot, idx) in slots" :key="slot.id" class="slot-root">
      <div class="slot-head">
        <span class="slot-title">Affix {{ idx + 1 }}</span>
        <button
            v-if="slots.length > 1"
            type="button"
            class="btn-remove-slot"
            @click="$emit('remove-slot', idx)"
        >
          Remove
        </button>
      </div>

      <label v-if="visibleAffixFamilies.length" class="field">
        <span class="field-label">Affix</span>
        <select v-model="slot.selectedAffixKey" class="field-select">
          <option :value="null" disabled>Select affix…</option>

          <optgroup
              v-for="group in affixGroupsForSlot(idx)"
              :key="group.label"
              :label="group.label"
          >
            <option
                v-for="affix in group.items"
                :key="affixKey(affix)"
                :value="affixKey(affix)"
            >
              {{ affix.template || "Unnamed affix" }}
            </option>
          </optgroup>
        </select>
      </label>

      <label v-if="availableTiersForSlot(idx).length" class="field">
        <span class="field-label">Tier</span>
        <select v-model.number="slot.selectedTierLevel" class="field-select">
          <option :value="null" disabled>Select tier…</option>
          <option
              v-for="tier in availableTiersForSlot(idx)"
              :key="tier.level"
              :value="tier.level"
          >
            T{{ tierIndexFromBottom(availableTiersForSlot(idx), tier.level) }}
            (lvl {{ tier.level }}) – {{ tier.name || "unnamed" }}
          </option>
        </select>
      </label>
    </div>

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
import {tierIndexFromBottom} from "../../domain/pickit/rules.js"

defineProps({
  slots: {type: Array, default: () => []},
  visibleAffixFamilies: {type: Array, default: () => []},
  prefixCount: {type: Number, required: true},
  suffixCount: {type: Number, required: true},
  maxSlots: {type: Number, required: true},
  maxPrefixes: {type: Number, required: true},
  maxSuffixes: {type: Number, required: true},
  canAddAffixSlot: {type: Boolean, required: true},
  addAffixDisabledReason: {type: String, required: true},
  affixKey: {type: Function, required: true},
  affixGroupsForSlot: {type: Function, required: true},
  availableTiersForSlot: {type: Function, required: true},
})

defineEmits(["add-slot", "remove-slot"])
</script>

<style scoped>
.field {
  display: flex;
  flex-direction: column;
  margin-bottom: 0.5rem;
}

.field-label {
  font-size: 0.8rem;
  color: #9ca3af;
  margin-bottom: 0.15rem;
}

.field-select {
  padding: 0.25rem 0.5rem;
  border-radius: 0.5rem;
  border: 1px solid #4b5563;
  background: #020617;
  color: #e5e7eb;
  font-size: 0.85rem;
}

.field-hint {
  font-size: 0.8rem;
  color: #9ca3af;
  margin: 0 0 0.5rem;
}

.slot-root {
  padding: 0.5rem;
  border-radius: 0.5rem;
  border: 1px solid #1f2937;
  background: rgba(17, 24, 39, 0.35);
  margin-bottom: 0.5rem;
}

.slot-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.35rem;
}

.slot-title {
  font-size: 0.85rem;
  color: #e5e7eb;
}

.btn-remove-slot {
  padding: 0.2rem 0.5rem;
  border-radius: 0.5rem;
  border: 1px solid #4b5563;
  background: #111827;
  color: #e5e7eb;
  font-size: 0.8rem;
  cursor: pointer;
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
