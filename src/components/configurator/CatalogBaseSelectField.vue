<template>
  <ConfigSelectField
    v-if="bases.length"
    label="Base (optional)"
    :model-value="modelValue"
    :disabled="disabled"
    @change="$emit('update:modelValue', $event)"
  >
    <option value="">All bases in this item type</option>
    <option v-for="base in bases" :key="base.name" :value="base.name">
      {{ formatBaseLabel(base) }}
    </option>
  </ConfigSelectField>
</template>

<script setup>
import ConfigSelectField from "./ConfigSelectField.vue"

defineProps({
  modelValue: { type: String, required: true },
  bases: { type: Array, default: () => [] },
  disabled: { type: Boolean, default: false },
})

defineEmits(["update:modelValue"])

function formatBaseLabel(base) {
  const name = typeof base?.name === "string" ? base.name : ""
  const requiredLevel =
    typeof base?.requiredLevel === "number" && Number.isFinite(base.requiredLevel) ? base.requiredLevel : null

  if (!name) return "Unnamed base"
  if (requiredLevel !== null) return `${name} (lvl ${requiredLevel})`
  return name
}
</script>
