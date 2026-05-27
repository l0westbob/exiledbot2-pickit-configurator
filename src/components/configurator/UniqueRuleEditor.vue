<template>
  <section class="unique-editor">
    <EditorStateMessage
      :is-loading="isLoading"
      loading-message="Loading unique data..."
      :error-message="errorMessage"
    />

    <template v-if="!isLoading && !errorMessage">
      <ConfigSelectField label="Unique selection" :model-value="selection" @change="$emit('update:selection', $event)">
        <option :value="singleGroupValue.ALL">All</option>
        <option :value="singleGroupValue.SINGLE">Single</option>
        <option disabled>----------</option>
        <option v-for="uniqueClass in classes" :key="uniqueClass.slug" :value="uniqueClass.slug">
          {{ uniqueClass.name }} ({{ uniqueClass.uniques.length }})
        </option>
      </ConfigSelectField>

      <template v-if="selection === singleGroupValue.SINGLE">
        <ConfigInputField
          label="Search unique"
          :model-value="searchText"
          type="search"
          placeholder="Type to filter..."
          @input="$emit('update:searchText', $event)"
        />

        <ConfigSelectField
          label="Unique item"
          :model-value="selectedItemDisplayName"
          :disabled="!filteredItems.length"
          @change="$emit('update:selectedItemDisplayName', $event)"
        >
          <option v-for="unique in filteredItems" :key="unique.displayName" :value="unique.displayName">
            {{ unique.displayName }}
          </option>
        </ConfigSelectField>
      </template>

      <ConfigSelectField
        v-else-if="isClassSelection"
        label="Class item"
        :model-value="selectedGroupItemDisplayName"
        @change="$emit('update:selectedGroupItemDisplayName', $event)"
      >
        <option :value="groupAllValue">All</option>
        <option v-for="unique in groupItems" :key="unique.displayName" :value="unique.displayName">
          {{ unique.displayName }}
        </option>
      </ConfigSelectField>

      <div class="stat-filter-section">
        <p v-if="!selectedUniqueForStats" class="field-hint">Select a single unique to configure stat minimums.</p>

        <p v-else-if="!statOptions.length" class="field-hint">
          No mapped stats are available for {{ selectedUniqueForStats.displayName }}.
        </p>

        <template v-else>
          <p class="field-hint">
            Stat minimums for {{ selectedUniqueForStats.displayName }}. Duplicate output stat ids are added together and
            emitted once.
          </p>

          <SlotCard
            v-for="(slot, idx) in statSlots"
            :key="slot.id"
            :title="`Stat filter ${idx + 1}`"
            :removable="statSlots.length > 1"
            @remove="$emit('remove-stat-slot', idx)"
          >
            <ConfigSelectField
              label="Stat"
              :model-value="slot.selectedStatKey"
              @change="$emit('update-stat-slot', { slotIndex: idx, selectedStatKey: $event })"
            >
              <option value="" disabled>Select stat...</option>
              <option v-for="statOption in statOptionsForSlot(idx)" :key="statOption.key" :value="statOption.key">
                {{ formatUniqueStatOptionLabel(statOption) }}
              </option>
            </ConfigSelectField>

            <ConfigInputField
              label="Minimum value"
              :model-value="slot.minimumValue"
              type="number"
              step="any"
              placeholder="e.g. 100"
              :disabled="!slot.selectedStatKey"
              @input="$emit('update-stat-slot', { slotIndex: idx, minimumValue: $event })"
            />
          </SlotCard>

          <button
            type="button"
            class="btn-add-stat"
            :disabled="!canAddStatSlot"
            :title="!canAddStatSlot ? addStatDisabledReason : ''"
            @click="$emit('add-stat-slot')"
          >
            Add stat filter ({{ statSlots.length }}/{{ statOptions.length }})
          </button>
        </template>
      </div>
    </template>
  </section>
</template>

<script setup>
import { computed } from "vue"
import {
  formatUniqueStatOptionLabel,
  UNIQUE_GROUP_ALL_VALUE,
  UNIQUE_SINGLE_GROUP_SELECTION,
} from "../../domain/pickit/uniques.js"
import ConfigInputField from "./ConfigInputField.vue"
import ConfigSelectField from "./ConfigSelectField.vue"
import EditorStateMessage from "./EditorStateMessage.vue"
import SlotCard from "./SlotCard.vue"

const props = defineProps({
  selection: { type: String, required: true },
  searchText: { type: String, required: true },
  selectedItemDisplayName: { type: String, required: true },
  selectedGroupItemDisplayName: { type: String, required: true },
  classes: { type: Array, default: () => [] },
  filteredItems: { type: Array, default: () => [] },
  groupItems: { type: Array, default: () => [] },
  selectedUniqueForStats: { type: Object, default: null },
  statSlots: { type: Array, default: () => [] },
  statOptions: { type: Array, default: () => [] },
  statOptionsForSlot: { type: Function, required: true },
  canAddStatSlot: { type: Boolean, default: false },
  addStatDisabledReason: { type: String, default: "" },
  isLoading: { type: Boolean, default: false },
  errorMessage: { type: String, default: "" },
})

defineEmits([
  "update:selection",
  "update:searchText",
  "update:selectedItemDisplayName",
  "update:selectedGroupItemDisplayName",
  "add-stat-slot",
  "remove-stat-slot",
  "update-stat-slot",
])

const singleGroupValue = UNIQUE_SINGLE_GROUP_SELECTION
const groupAllValue = UNIQUE_GROUP_ALL_VALUE

const isClassSelection = computed(() => {
  return ![singleGroupValue.ALL, singleGroupValue.SINGLE].includes(props.selection)
})
</script>

<style scoped>
.unique-editor {
  margin-bottom: 0.75rem;
}

.field-hint {
  font-size: 0.8rem;
  color: #9ca3af;
  margin: 0 0 0.75rem;
}

.stat-filter-section {
  margin-top: 0.75rem;
}

.btn-add-stat {
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

.btn-add-stat:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
