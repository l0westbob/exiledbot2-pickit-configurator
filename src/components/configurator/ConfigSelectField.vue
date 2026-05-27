<template>
  <label class="config-field">
    <span class="config-field__label">{{ label }}</span>
    <select
      class="config-field__control"
      :value="modelValue ?? ''"
      :disabled="disabled"
      @change="emitSelectedValue"
      @input="emitSelectedValue"
    >
      <slot />
    </select>
    <span v-if="hint" class="config-field__hint">{{ hint }}</span>
  </label>
</template>

<script setup>
defineProps({
  modelValue: { type: null, default: "" },
  label: { type: String, required: true },
  disabled: { type: Boolean, default: false },
  hint: { type: String, default: "" },
})

const emit = defineEmits(["update:modelValue", "change"])

function emitSelectedValue(event) {
  const selectedValue = event.target.value
  emit("update:modelValue", selectedValue)
  emit("change", selectedValue)
}
</script>

<style scoped>
.config-field {
  display: flex;
  flex-direction: column;
  margin-bottom: 0.5rem;
}

.config-field__label,
.config-field__hint {
  font-size: 0.8rem;
  color: #9ca3af;
}

.config-field__label {
  margin-bottom: 0.15rem;
}

.config-field__hint {
  margin-top: 0.2rem;
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
