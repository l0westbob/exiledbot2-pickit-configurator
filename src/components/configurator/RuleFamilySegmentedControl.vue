<template>
  <fieldset class="family-field">
    <legend class="family-label">Rule type</legend>

    <div class="family-options" role="radiogroup" aria-label="Rule type">
      <button
        v-for="option in options"
        :key="option.value"
        type="button"
        class="family-option"
        :class="{ 'family-option-active': option.value === modelValue }"
        role="radio"
        :aria-checked="option.value === modelValue"
        @click="$emit('update:modelValue', option.value)"
      >
        {{ option.label }}
      </button>
    </div>
  </fieldset>
</template>

<script setup>
defineProps({
  modelValue: { type: String, required: true },
  options: { type: Array, default: () => [] },
})

defineEmits(["update:modelValue"])
</script>

<style scoped>
.family-field {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: 0;
  margin: 0 0 0.5rem;
  border: 0;
}

.family-label {
  padding: 0;
  font-size: 0.8rem;
  color: #9ca3af;
}

.family-options {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.25rem;
  padding: 0.2rem;
  border-radius: 0.65rem;
  border: 1px solid #1f2937;
  background: #020617;
}

.family-option {
  padding: 0.4rem 0.65rem;
  border-radius: 0.5rem;
  border: 1px solid transparent;
  background: transparent;
  color: #9ca3af;
  font-size: 0.85rem;
  cursor: pointer;
}

.family-option:hover {
  color: #e5e7eb;
  background: rgba(31, 41, 55, 0.65);
}

.family-option-active {
  border-color: #64748b;
  background: linear-gradient(180deg, #1f2937 0%, #111827 100%);
  color: #f8fafc;
  box-shadow: 0 8px 24px rgba(2, 6, 23, 0.35);
}
</style>
