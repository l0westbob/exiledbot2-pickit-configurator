<template>
  <section class="generated-output">
    <div class="generated-output__head">
      <h3 class="generated-output__title">{{ title }}</h3>
      <button type="button" class="generated-output__copy" :disabled="!text" @click="copyText">Copy final</button>
    </div>

    <div class="generated-output__box">
      <pre v-if="text" class="generated-output__pre">{{ text }}</pre>
      <span v-else class="generated-output__placeholder">{{ placeholder }}</span>
    </div>

    <p v-if="copyStatusMessage" class="generated-output__status" aria-live="polite">
      {{ copyStatusMessage }}
    </p>
  </section>
</template>

<script setup>
import { ref, watch } from "vue"

const props = defineProps({
  title: { type: String, default: "Generated output" },
  text: { type: String, default: "" },
  placeholder: { type: String, default: "Nothing generated yet." },
})

const copyStatusMessage = ref("")

watch(
  () => props.text,
  () => {
    copyStatusMessage.value = ""
  }
)

async function copyText() {
  if (!props.text) {
    copyStatusMessage.value = "Generate config first."
    return
  }

  if (!globalThis.navigator?.clipboard?.writeText) {
    copyStatusMessage.value = "Clipboard API is unavailable in this browser."
    return
  }

  try {
    await globalThis.navigator.clipboard.writeText(props.text)
    copyStatusMessage.value = "Copied final config."
  } catch (error) {
    console.error(error)
    copyStatusMessage.value = "Could not copy final config."
  }
}
</script>

<style scoped>
.generated-output {
  padding: 0.75rem;
  border-radius: 0.75rem;
  border: 1px solid #1f2937;
  background: #020617;
}

.generated-output__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.generated-output__title {
  margin: 0;
  color: #e5e7eb;
  font-size: 0.95rem;
}

.generated-output__copy {
  padding: 0.4rem 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid #4b5563;
  background: #111827;
  color: #e5e7eb;
  font-size: 0.85rem;
  cursor: pointer;
}

.generated-output__copy:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.generated-output__box {
  padding: 0.75rem;
  border-radius: 0.5rem;
  background: #020617;
  border: 1px dashed #374151;
  min-height: 4.5rem;
}

.generated-output__pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  color: #e5e7eb;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-size: 0.85rem;
}

.generated-output__placeholder {
  color: #6b7280;
}

.generated-output__status {
  margin: 0.5rem 0 0;
  color: #9ca3af;
  font-size: 0.8rem;
}
</style>
