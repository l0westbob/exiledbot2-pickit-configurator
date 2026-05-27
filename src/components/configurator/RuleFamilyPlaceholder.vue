<template>
  <section class="placeholder-panel">
    <h4 class="placeholder-title">{{ title }}</h4>
    <p class="placeholder-copy">
      {{ copy }}
    </p>
  </section>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  copy: { type: String, required: true },
})
</script>

<style scoped>
.placeholder-panel {
  padding: 0.75rem;
  margin-bottom: 0.75rem;
  border-radius: 0.65rem;
  border: 1px dashed #334155;
  background: rgba(15, 23, 42, 0.58);
}

.placeholder-title {
  margin: 0 0 0.25rem;
  color: #e5e7eb;
  font-size: 0.9rem;
}

.placeholder-copy {
  margin: 0;
  color: #94a3b8;
  font-size: 0.82rem;
  line-height: 1.45;
}
</style>
