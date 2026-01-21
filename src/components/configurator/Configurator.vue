<template>
  <section class="cfg-root">
    <header class="cfg-header">
      <h2 class="cfg-title">Exiledbot2 Pickit Configurator - Still work in progress!</h2>

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
import {ref} from "vue"
import Row from "./Row.vue"

/**
 * Configurator-level state management.
 *
 * Responsibilities:
 * - Manage an ordered list of Row instances (add/remove)
 * - Collect generated config lines from each Row (via @update-lines event)
 * - On "Generate final", concatenate all row lines in the same order as the rows are rendered
 *
 * Important UX detail:
 * - Row components emit their current computed lines continuously (watchEffect in Row),
 *   so clicking "Generate final" does not depend on the user pressing "Generate row"
 *   inside each row.
 */

/**
 * Generates a unique identifier for row objects.
 * Used for:
 * - Vue v-for key stability
 * - Mapping rowId -> generated lines
 *
 * Uses crypto.randomUUID() with a safe fallback for older environments.
 *
 * @returns {string}
 */
function createRowId() {
  if (crypto?.randomUUID) return crypto.randomUUID()
  return `${Date.now()}-${Math.random()}`
}

/**
 * Ordered list of rows.
 * Each row is a lightweight object with a stable id.
 *
 * @type {import("vue").Ref<Array<{id: string}>>}
 */
const rows = ref([{id: createRowId()}])

/**
 * Map of rowId -> array of generated config lines.
 *
 * We use a Map because:
 * - row ids are arbitrary strings
 * - lookups/updates are O(1)
 * - it avoids accidental key collisions with plain objects
 *
 * @type {import("vue").Ref<Map<string, string[]>>}
 */
const rowLinesById = ref(new Map())

function addRow() {
  rows.value.push({id: createRowId()})
}

/**
 * Removes a row and drops its stored lines.
 *
 * @param {string} rowId
 */
function removeRow(rowId) {
  const rowIndex = rows.value.findIndex((row) => row.id === rowId)
  if (rowIndex !== -1) rows.value.splice(rowIndex, 1)
  rowLinesById.value.delete(rowId)
}

/**
 * Receives line updates from a Row component.
 *
 * Contract:
 * - payload.rowId: string
 * - payload.lines: string[] (can be empty)
 *
 * Row emits this whenever its internal selection changes, so the configurator
 * always has the latest lines.
 *
 * @param {{rowId: string, lines: unknown}} payload
 */
function onRowUpdateLines(payload) {
  const {rowId, lines} = payload || {}
  const normalizedLines = Array.isArray(lines) ? lines : []
  rowLinesById.value.set(rowId, normalizedLines)
}

/**
 * "Final config lines" output rendered in the Configurator.
 *
 * @type {import("vue").Ref<string>}
 */
const finalText = ref("")

/**
 * Builds the final output by concatenating all row lines in render order.
 * Filters out empty/whitespace-only lines for robustness.
 */
function generateFinal() {
  /** @type {string[]} */
  const combinedLines = []

  // Keep the row order as rendered in the UI
  for (const row of rows.value) {
    const linesForRow = rowLinesById.value.get(row.id) || []
    for (const configLine of linesForRow) {
      if (typeof configLine === "string" && configLine.trim()) {
        combinedLines.push(configLine)
      }
    }
  }

  finalText.value = combinedLines.join("\n")
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