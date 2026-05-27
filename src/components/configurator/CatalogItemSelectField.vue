<template>
  <ConfigSelectField
    label="Item type"
    :model-value="modelValue"
    :disabled="disabled"
    @change="$emit('update:modelValue', $event)"
  >
    <option value="" disabled>Select item...</option>
    <option v-for="item in items" :key="item.slug" :value="item.slug">{{ item.category }} - {{ item.label }}</option>
  </ConfigSelectField>
</template>

<script setup>
import ConfigSelectField from "./ConfigSelectField.vue"

defineProps({
  modelValue: { type: String, required: true },
  items: { type: Array, default: () => [] },
  disabled: { type: Boolean, default: false },
})

defineEmits(["update:modelValue"])
</script>
