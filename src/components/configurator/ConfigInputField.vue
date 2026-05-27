<template>
  <label class="config-field">
    <span class="config-field__label">{{ label }}</span>
    <input
      v-model="inputValue"
      class="config-field__control"
      :type="type"
      :step="step"
      :placeholder="placeholder"
      :disabled="disabled"
    />
  </label>
</template>

<script setup>
import { computed } from "vue"

const props = defineProps({
  modelValue: { type: [String, Number], default: "" },
  label: { type: String, required: true },
  type: { type: String, default: "text" },
  step: { type: String, default: "" },
  placeholder: { type: String, default: "" },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(["update:modelValue", "input"])

const inputValue = computed({
  get: () => props.modelValue,
  set: (value) => {
    emit("update:modelValue", value)
    emit("input", value)
  },
})
</script>

<style scoped>
.config-field {
  display: flex;
  flex-direction: column;
  margin-bottom: 0.5rem;
}

.config-field__label {
  font-size: 0.8rem;
  color: #9ca3af;
  margin-bottom: 0.15rem;
}

.config-field__control {
  padding: 0.25rem 0.5rem;
  border-radius: 0.5rem;
  border: 1px solid #4b5563;
  background: #020617;
  color: #e5e7eb;
  font-size: 0.85rem;
}

.config-field__control:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
