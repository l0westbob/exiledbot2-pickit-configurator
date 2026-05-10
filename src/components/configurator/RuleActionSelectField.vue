<template>
  <label class="field">
    <span class="field-label">Action flag</span>
    <select
        :value="modelValue"
        class="field-select"
        :disabled="!actionOptions.length"
        @change="$emit('update:modelValue', $event.target.value)"
    >
      <option
          v-for="action in actionOptions"
          :key="action.flag"
          :value="action.flag"
      >
        {{ action.label }}
      </option>
    </select>
  </label>
</template>

<script setup>
defineProps({
  modelValue: {type: String, required: true},
  actionOptions: {type: Array, default: () => []},
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
</style>
