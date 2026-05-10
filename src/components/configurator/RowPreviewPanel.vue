<template>
  <div class="row-preview">
    <h3 class="row-title">Preview</h3>
    <div class="preview-box">
      <span v-if="previewText">{{ previewText }}</span>
      <span v-else class="preview-placeholder">{{ placeholder }}</span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  previewText: {type: String, default: ""},
  placeholder: {type: String, default: "No config generated yet."},
})
</script>

<style scoped>
.row-preview {
  display: flex;
  flex-direction: column;
}

.row-title {
  margin: 0 0 0.5rem;
  font-size: 0.95rem;
  color: #e5e7eb;
}

.preview-box {
  flex: 1;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  background: #020617;
  border: 1px dashed #374151;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono",
  "Courier New", monospace;
  font-size: 0.85rem;
  white-space: pre-wrap;
  word-break: break-word;
}

.preview-placeholder {
  color: #6b7280;
}
</style>
