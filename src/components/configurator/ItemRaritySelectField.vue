<template>
  <ConfigSelectField label="Rarity (optional)" :model-value="modelValue" @change="$emit('update:modelValue', $event)">
    <option v-for="rarity in rarityOptions" :key="rarity" :value="rarity">
      {{ rarity }}
    </option>
  </ConfigSelectField>
</template>

<script setup>
import ConfigSelectField from "./ConfigSelectField.vue"

defineProps({
  modelValue: { type: String, required: true },
  rarityOptions: { type: Array, default: () => [] },
})

defineEmits(["update:modelValue"])
</script>
