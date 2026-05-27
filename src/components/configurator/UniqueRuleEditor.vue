<template>
  <section class="unique-editor">
    <p v-if="isLoading" class="field-hint">Loading unique data...</p>
    <p v-else-if="errorMessage" class="field-error">{{ errorMessage }}</p>

    <template v-else>
      <label class="field">
        <span class="field-label">Unique selection</span>
        <select
            :value="selection"
            class="field-select"
            @change="$emit('update:selection', $event.target.value)"
        >
          <option :value="singleGroupValue.ALL">All</option>
          <option :value="singleGroupValue.SINGLE">Single</option>
          <option disabled>──────────</option>
          <option
              v-for="uniqueClass in classes"
              :key="uniqueClass.slug"
              :value="uniqueClass.slug"
          >
            {{ uniqueClass.name }} ({{ uniqueClass.uniques.length }})
          </option>
        </select>
      </label>

      <template v-if="selection === singleGroupValue.SINGLE">
        <label class="field">
          <span class="field-label">Search unique</span>
          <input
              :value="searchText"
              class="field-input"
              type="search"
              placeholder="Type to filter..."
              @input="$emit('update:searchText', $event.target.value)"
          >
        </label>

        <label class="field">
          <span class="field-label">Unique item</span>
          <select
              :value="selectedItemDisplayName"
              class="field-select"
              :disabled="!filteredItems.length"
              @change="$emit('update:selectedItemDisplayName', $event.target.value)"
          >
            <option
                v-for="unique in filteredItems"
                :key="unique.displayName"
                :value="unique.displayName"
            >
              {{ unique.displayName }}
            </option>
          </select>
        </label>
      </template>

      <label
          v-else-if="isClassSelection"
          class="field"
      >
        <span class="field-label">Class item</span>
        <select
            :value="selectedGroupItemDisplayName"
            class="field-select"
            @change="$emit('update:selectedGroupItemDisplayName', $event.target.value)"
        >
          <option :value="groupAllValue">All</option>
          <option
              v-for="unique in groupItems"
              :key="unique.displayName"
              :value="unique.displayName"
          >
            {{ unique.displayName }}
          </option>
        </select>
      </label>

      <div class="stat-filter-section">
        <p v-if="!selectedUniqueForStats" class="field-hint">
          Select a single unique to configure stat minimums.
        </p>

        <p v-else-if="!statOptions.length" class="field-hint">
          No mapped stats are available for {{ selectedUniqueForStats.displayName }}.
        </p>

        <template v-else>
          <p class="field-hint">
            Stat minimums for {{ selectedUniqueForStats.displayName }}. Duplicate output stat ids are
            added together and emitted once.
          </p>

          <div
              v-for="(slot, idx) in statSlots"
              :key="slot.id"
              class="slot-root"
          >
            <div class="slot-head">
              <span class="slot-title">Stat filter {{ idx + 1 }}</span>
              <button
                  v-if="statSlots.length > 1"
                  type="button"
                  class="btn-remove-slot"
                  @click="$emit('remove-stat-slot', idx)"
              >
                Remove
              </button>
            </div>

            <label class="field">
              <span class="field-label">Stat</span>
              <select v-model="slot.selectedStatKey" class="field-select">
                <option :value="null" disabled>Select stat...</option>
                <option
                    v-for="statOption in statOptionsForSlot(idx)"
                    :key="statOption.key"
                    :value="statOption.key"
                >
                  {{ formatUniqueStatOptionLabel(statOption) }}
                </option>
              </select>
            </label>

            <label class="field">
              <span class="field-label">Minimum value</span>
              <input
                  v-model="slot.minimumValue"
                  class="field-input"
                  type="number"
                  step="any"
                  placeholder="e.g. 100"
                  :disabled="!slot.selectedStatKey"
              >
            </label>
          </div>

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
import {computed} from "vue"
import {
  formatUniqueStatOptionLabel,
  UNIQUE_GROUP_ALL_VALUE,
  UNIQUE_SINGLE_GROUP_SELECTION,
} from "../../domain/pickit/uniques.js"

const props = defineProps({
  selection: {type: String, required: true},
  searchText: {type: String, required: true},
  selectedItemDisplayName: {type: String, required: true},
  selectedGroupItemDisplayName: {type: String, required: true},
  classes: {type: Array, default: () => []},
  filteredItems: {type: Array, default: () => []},
  groupItems: {type: Array, default: () => []},
  selectedUniqueForStats: {type: Object, default: null},
  statSlots: {type: Array, default: () => []},
  statOptions: {type: Array, default: () => []},
  statOptionsForSlot: {type: Function, required: true},
  canAddStatSlot: {type: Boolean, default: false},
  addStatDisabledReason: {type: String, default: ""},
  isLoading: {type: Boolean, default: false},
  errorMessage: {type: String, default: ""},
})

defineEmits([
  "update:selection",
  "update:searchText",
  "update:selectedItemDisplayName",
  "update:selectedGroupItemDisplayName",
  "add-stat-slot",
  "remove-stat-slot",
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

.field-select,
.field-input {
  padding: 0.25rem 0.5rem;
  border-radius: 0.5rem;
  border: 1px solid #4b5563;
  background: #020617;
  color: #e5e7eb;
  font-size: 0.85rem;
}

.field-select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.field-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.field-hint {
  font-size: 0.8rem;
  color: #9ca3af;
  margin: 0 0 0.75rem;
}

.field-error {
  font-size: 0.8rem;
  color: #f97373;
  margin: 0 0 0.75rem;
}

.stat-filter-section {
  margin-top: 0.75rem;
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

.btn-remove-slot,
.btn-add-stat {
  padding: 0.2rem 0.5rem;
  border-radius: 0.5rem;
  border: 1px solid #4b5563;
  background: #111827;
  color: #e5e7eb;
  font-size: 0.8rem;
  cursor: pointer;
}

.btn-add-stat {
  align-self: flex-start;
  margin: 0.25rem 0 0.75rem;
  padding: 0.35rem 0.75rem;
  font-size: 0.85rem;
}

.btn-add-stat:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
