<template>
  <p v-if="isLoading" class="state-message state-message--muted">{{ loadingMessage }}</p>
  <p v-else-if="errorMessage" class="state-message state-message--error">{{ errorMessage }}</p>
</template>

<script setup>
defineProps({
  isLoading: { type: Boolean, default: false },
  loadingMessage: { type: String, default: "Loading..." },
  errorMessage: { type: String, default: "" },
})
</script>

<style scoped>
.state-message {
  font-size: 0.8rem;
  margin: 0 0 0.75rem;
}

.state-message--muted {
  color: #9ca3af;
}

.state-message--error {
  color: #f97373;
}
</style>
