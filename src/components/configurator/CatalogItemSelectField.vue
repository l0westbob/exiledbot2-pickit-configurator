<template>
  <label class="field">
    <span class="field-label">Item type</span>
    <select
        :value="modelValue"
        class="field-select"
        :disabled="disabled"
        @change="$emit('update:modelValue', $event.target.value)"
    >
      <option value="" disabled>Select item…</option>
      <option v-for="item in items" :key="item.slug" :value="item.slug">
        {{ item.category }} – {{ item.label }}
      </option>
    </select>
  </label>
</template>

<script setup>
defineProps({
  modelValue: {type: String, required: true},
  items: {type: Array, default: () => []},
  disabled: {type: Boolean, default: false},
})

defineEmits(["update:modelValue"])
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
