<template>
  <label v-if="bases.length" class="field">
    <span class="field-label">Base (optional)</span>
    <select
        :value="modelValue"
        class="field-select"
        :disabled="disabled"
        @change="$emit('update:modelValue', $event.target.value)"
    >
      <option value="">All bases in this item type</option>
      <option
          v-for="base in bases"
          :key="base.name"
          :value="base.name"
      >
        {{ formatBaseLabel(base) }}
      </option>
    </select>
  </label>
</template>

<script setup>
defineProps({
  modelValue: {type: String, required: true},
  bases: {type: Array, default: () => []},
  disabled: {type: Boolean, default: false},
})

defineEmits(["update:modelValue"])

function formatBaseLabel(base) {
  const name = typeof base?.name === "string" ? base.name : ""
  const requiredLevel =
    typeof base?.requiredLevel === "number" && Number.isFinite(base.requiredLevel)
      ? base.requiredLevel
      : null

  if (!name) return "Unnamed base"
  if (requiredLevel !== null) return `${name} (lvl ${requiredLevel})`
  return name
}
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

.field-select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
