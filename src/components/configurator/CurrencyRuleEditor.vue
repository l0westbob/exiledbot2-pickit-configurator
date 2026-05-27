<template>
  <section class="currency-editor">
    <p v-if="isLoading" class="field-hint">Loading currency data...</p>
    <p v-else-if="errorMessage" class="field-error">{{ errorMessage }}</p>

    <template v-else>
      <label class="field">
        <span class="field-label">Currency configuration</span>
        <select
            :value="mode"
            class="field-select"
            @change="$emit('update:mode', $event.target.value)"
        >
          <option
              v-for="option in modeOptions"
              :key="option.value"
              :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>
      </label>

      <label v-if="mode === selectionMode.TIER" class="field">
        <span class="field-label">Tier</span>
        <select
            :value="selectedTier"
            class="field-select"
            @change="$emit('update:selectedTier', $event.target.value)"
        >
          <option
              v-for="tier in tiers"
              :key="tier.name"
              :value="tier.name"
          >
            {{ formatTierLabel(tier) }}
          </option>
        </select>
      </label>

      <template v-else>
        <label class="field">
          <span class="field-label">Selection</span>
          <select
              :value="singleGroupSelection"
              class="field-select"
              @change="$emit('update:singleGroupSelection', $event.target.value)"
          >
            <option :value="singleGroupValue.ALL">All</option>
            <option :value="singleGroupValue.SINGLE">Single</option>
            <option disabled>──────────</option>
            <option
                v-for="category in categories"
                :key="category.slug"
                :value="category.slug"
            >
              {{ category.name }}
            </option>
          </select>
        </label>

        <template v-if="singleGroupSelection === singleGroupValue.SINGLE">
          <label class="field">
            <span class="field-label">Search currency</span>
            <input
                :value="searchText"
                class="field-input"
                type="search"
                placeholder="Type to filter..."
                @input="$emit('update:searchText', $event.target.value)"
            >
          </label>

          <label class="field">
            <span class="field-label">Currency item</span>
            <select
                :value="selectedItemName"
                class="field-select"
                :disabled="!filteredItems.length"
                @change="$emit('update:selectedItemName', $event.target.value)"
            >
              <option
                  v-for="item in filteredItems"
                  :key="item.name"
                  :value="item.name"
              >
                {{ item.name }}
              </option>
            </select>
          </label>
        </template>

        <label
            v-else-if="isCategorySelection"
            class="field"
        >
          <span class="field-label">Group item</span>
          <select
              :value="selectedGroupItemName"
              class="field-select"
              @change="$emit('update:selectedGroupItemName', $event.target.value)"
          >
            <option :value="groupAllValue">All</option>
            <option
                v-for="item in groupItems"
                :key="item.name"
                :value="item.name"
            >
              {{ item.name }}
            </option>
          </select>
        </label>
      </template>
    </template>
  </section>
</template>

<script setup>
import {computed} from "vue"
import {
  CURRENCY_GROUP_ALL_VALUE,
  CURRENCY_ALL_TIERS_VALUE,
  CURRENCY_SELECTION_MODE,
  CURRENCY_SELECTION_MODE_OPTIONS,
  CURRENCY_SINGLE_GROUP_SELECTION,
} from "../../domain/pickit/currency.js"

const props = defineProps({
  mode: {type: String, required: true},
  selectedTier: {type: String, required: true},
  singleGroupSelection: {type: String, required: true},
  searchText: {type: String, required: true},
  selectedItemName: {type: String, required: true},
  selectedGroupItemName: {type: String, required: true},
  categories: {type: Array, default: () => []},
  tiers: {type: Array, default: () => []},
  filteredItems: {type: Array, default: () => []},
  groupItems: {type: Array, default: () => []},
  isLoading: {type: Boolean, default: false},
  errorMessage: {type: String, default: ""},
})

defineEmits([
  "update:mode",
  "update:selectedTier",
  "update:singleGroupSelection",
  "update:searchText",
  "update:selectedItemName",
  "update:selectedGroupItemName",
])

const selectionMode = CURRENCY_SELECTION_MODE
const modeOptions = CURRENCY_SELECTION_MODE_OPTIONS
const singleGroupValue = CURRENCY_SINGLE_GROUP_SELECTION
const groupAllValue = CURRENCY_GROUP_ALL_VALUE
const allTiersValue = CURRENCY_ALL_TIERS_VALUE

const isCategorySelection = computed(() => {
  return ![singleGroupValue.ALL, singleGroupValue.SINGLE].includes(props.singleGroupSelection)
})

function formatTierLabel(tier) {
  if (tier?.name === allTiersValue) return `All (${tier.items.length} items)`
  return `${tier.name} (${tier.items.length} items)`
}
</script>

<style scoped>
.currency-editor {
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
</style>
