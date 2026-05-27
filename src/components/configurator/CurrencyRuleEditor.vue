<template>
  <section class="currency-editor">
    <EditorStateMessage
      :is-loading="isLoading"
      loading-message="Loading currency data..."
      :error-message="errorMessage"
    />

    <template v-if="!isLoading && !errorMessage">
      <ConfigSelectField label="Currency configuration" :model-value="mode" @change="$emit('update:mode', $event)">
        <option v-for="option in modeOptions" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </ConfigSelectField>

      <ConfigSelectField
        v-if="mode === selectionMode.TIER"
        label="Tier"
        :model-value="selectedTier"
        @change="$emit('update:selectedTier', $event)"
      >
        <option v-for="tier in tiers" :key="tier.name" :value="tier.name">
          {{ formatTierLabel(tier) }}
        </option>
      </ConfigSelectField>

      <template v-else>
        <ConfigSelectField
          label="Selection"
          :model-value="singleGroupSelection"
          @change="$emit('update:singleGroupSelection', $event)"
        >
          <option :value="singleGroupValue.ALL">All</option>
          <option :value="singleGroupValue.SINGLE">Single</option>
          <option disabled>----------</option>
          <option v-for="category in categories" :key="category.slug" :value="category.slug">
            {{ category.name }}
          </option>
        </ConfigSelectField>

        <template v-if="singleGroupSelection === singleGroupValue.SINGLE">
          <ConfigInputField
            label="Search currency"
            :model-value="searchText"
            type="search"
            placeholder="Type to filter..."
            @input="$emit('update:searchText', $event)"
          />

          <ConfigSelectField
            label="Currency item"
            :model-value="selectedItemName"
            :disabled="!filteredItems.length"
            @change="$emit('update:selectedItemName', $event)"
          >
            <option v-for="item in filteredItems" :key="item.name" :value="item.name">
              {{ item.name }}
            </option>
          </ConfigSelectField>
        </template>

        <ConfigSelectField
          v-else-if="isCategorySelection"
          label="Group item"
          :model-value="selectedGroupItemName"
          @change="$emit('update:selectedGroupItemName', $event)"
        >
          <option :value="groupAllValue">All</option>
          <option v-for="item in groupItems" :key="item.name" :value="item.name">
            {{ item.name }}
          </option>
        </ConfigSelectField>
      </template>
    </template>
  </section>
</template>

<script setup>
import { computed } from "vue"
import {
  CURRENCY_GROUP_ALL_VALUE,
  CURRENCY_ALL_TIERS_VALUE,
  CURRENCY_SELECTION_MODE,
  CURRENCY_SELECTION_MODE_OPTIONS,
  CURRENCY_SINGLE_GROUP_SELECTION,
} from "../../domain/pickit/currency.js"
import ConfigInputField from "./ConfigInputField.vue"
import ConfigSelectField from "./ConfigSelectField.vue"
import EditorStateMessage from "./EditorStateMessage.vue"

const props = defineProps({
  mode: { type: String, required: true },
  selectedTier: { type: String, required: true },
  singleGroupSelection: { type: String, required: true },
  searchText: { type: String, required: true },
  selectedItemName: { type: String, required: true },
  selectedGroupItemName: { type: String, required: true },
  categories: { type: Array, default: () => [] },
  tiers: { type: Array, default: () => [] },
  filteredItems: { type: Array, default: () => [] },
  groupItems: { type: Array, default: () => [] },
  isLoading: { type: Boolean, default: false },
  errorMessage: { type: String, default: "" },
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
</style>
