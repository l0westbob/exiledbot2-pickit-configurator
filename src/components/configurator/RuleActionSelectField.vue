<template>
  <ConfigSelectField
    label="Action flag"
    :model-value="modelValue"
    :disabled="!actionOptions.length"
    @change="$emit('update:modelValue', $event)"
  >
    <option v-for="action in actionOptions" :key="action.flag" :value="action.flag">
      {{ action.label }}
    </option>
  </ConfigSelectField>
</template>

<script setup>
import ConfigSelectField from "./ConfigSelectField.vue"

defineProps({
  modelValue: { type: String, required: true },
  actionOptions: { type: Array, default: () => [] },
})

defineEmits(["update:modelValue"])
</script>
