<template>
  <div class="slot-card">
    <div class="slot-card__head">
      <span class="slot-card__title">{{ title }}</span>
      <button v-if="removable" type="button" class="slot-card__remove" @click="$emit('remove')">Remove</button>
    </div>

    <slot />
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  removable: { type: Boolean, default: false },
})

defineEmits(["remove"])
</script>

<style scoped>
.slot-card {
  padding: 0.5rem;
  border-radius: 0.5rem;
  border: 1px solid #1f2937;
  background: rgba(17, 24, 39, 0.35);
  margin-bottom: 0.5rem;
}

.slot-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.35rem;
}

.slot-card__title {
  font-size: 0.85rem;
  color: #e5e7eb;
}

.slot-card__remove {
  padding: 0.2rem 0.5rem;
  border-radius: 0.5rem;
  border: 1px solid #4b5563;
  background: #111827;
  color: #e5e7eb;
  font-size: 0.8rem;
  cursor: pointer;
}
</style>
