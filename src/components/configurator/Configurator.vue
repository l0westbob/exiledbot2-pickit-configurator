<template>
  <section class="cfg-root">
    <header class="cfg-header">
      <h2 class="cfg-title">Exiledbot2 Pickit Configurator</h2>

      <div class="cfg-actions">
        <button type="button" class="btn" @click="addRow">Add row</button>
        <button type="button" class="btn btn-primary" @click="generateFinal">
          Generate final
        </button>
      </div>
    </header>

    <div class="cfg-rows">
      <Row
          v-for="(row, idx) in rows"
          :key="row.id"
          :row-id="row.id"
          :row-index="idx"
          :items="items"
          @update-lines="onRowUpdateLines"
          @remove="removeRow"
      />
    </div>

    <div class="cfg-final">
      <h3 class="cfg-subtitle">Final Config-lines</h3>

      <div class="final-box">
        <pre v-if="finalText" class="final-pre">{{ finalText }}</pre>
        <span v-else class="final-placeholder">Nothing generated yet.</span>
      </div>
    </div>
  </section>
</template>

<script setup>
import {computed, ref} from "vue"
import Row from "./Row.vue"

const props = defineProps({
  items: {
    type: Array,
    required: true,
  },
})

function uid() {
  // good enough for UI keys
  return crypto.randomUUID()
}

const rows = ref([
  {id: uid()}
])

// rowId -> string[] (config lines)
const rowLines = ref(new Map())

function addRow() {
  rows.value.push({id: uid()})
}

function removeRow(rowId) {
  const idx = rows.value.findIndex((r) => r.id === rowId)
  if (idx !== -1) rows.value.splice(idx, 1)
  rowLines.value.delete(rowId)
}

function onRowUpdateLines({rowId, lines}) {
  rowLines.value.set(rowId, Array.isArray(lines) ? lines : [])
}

const finalText = ref("")

function generateFinal() {
  const out = []

  // keep the row order as rendered
  for (const row of rows.value) {
    const lines = rowLines.value.get(row.id) || []
    for (const line of lines) {
      if (typeof line === "string" && line.trim()) out.push(line)
    }
  }

  finalText.value = out.join("\n")
}
</script>

<style scoped>
.cfg-root {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.cfg-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  border: 1px solid #1f2937;
  background: #020617;
}

.cfg-title {
  margin: 0;
  color: #e5e7eb;
  font-size: 1rem;
}

.cfg-actions {
  display: flex;
  gap: 0.5rem;
}

.btn {
  padding: 0.4rem 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid #4b5563;
  background: #111827;
  color: #e5e7eb;
  font-size: 0.85rem;
  cursor: pointer;
}

.btn:hover {
  border-color: #9ca3af;
  background: #1f2937;
}

.btn-primary {
  border-color: #6b7280;
}

.cfg-rows {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.cfg-final {
  padding: 0.75rem;
  border-radius: 0.75rem;
  border: 1px solid #1f2937;
  background: #020617;
}

.cfg-subtitle {
  margin: 0 0 0.5rem;
  color: #e5e7eb;
  font-size: 0.95rem;
}

.final-box {
  padding: 0.75rem;
  border-radius: 0.5rem;
  background: #020617;
  border: 1px dashed #374151;
  min-height: 4.5rem;
}

.final-pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  color: #e5e7eb;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono",
  "Courier New", monospace;
  font-size: 0.85rem;
}

.final-placeholder {
  color: #6b7280;
}
</style>