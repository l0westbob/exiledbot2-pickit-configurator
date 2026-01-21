<template>
  <div class="configurator-root">
    <div class="configurator-header">
      <h2 class="configurator-title">Pickit Configurator</h2>

      <div class="toolbar">
        <button
            type="button"
            class="btn-add-row"
            @click="addRow"
        >
          +
        </button>
      </div>
    </div>

    <p class="configurator-hint">
      Click "+" to add configuration rows. Each row lets you select an item type, an affix, and a tier, then generates a
      preview line.
    </p>

    <p
        v-if="loading"
        class="status"
    >
      Loading item index…
    </p>
    <p
        v-else-if="error"
        class="status status-error"
    >
      {{ error }}
    </p>

    <div class="rows-container">
      <Row
          v-for="row in rows"
          :key="row.id"
          :items="items"
      />
    </div>
  </div>
</template>

<script setup>
import {onMounted, ref} from "vue"
import Row from "./Row.vue"

const rows = ref([])
let nextId = 1

const items = ref([]) // from items.json
const loading = ref(false)
const error = ref("")

function addRow() {
  rows.value.push({id: nextId++})
}

async function loadItemsIndex() {
  loading.value = true
  error.value = ""
  try {
    const res = await fetch(import.meta.env.BASE_URL + "data/items.json")
    if (!res.ok) {
      throw new Error(`Failed to load items index: ${res.status}`)
    }
    const json = await res.json()
    items.value = json.items || []
  } catch (e) {
    console.error(e)
    error.value = String(e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadItemsIndex()
})
</script>

<style scoped>
.configurator-root {
  margin: 1rem;
  padding: 1rem;
  border-radius: 0.75rem;
  background: #030712;
  border: 1px solid #1f2937;
}

.configurator-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.configurator-title {
  margin: 0;
  font-size: 1.25rem;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-add-row {
  width: 2rem;
  height: 2rem;
  border-radius: 999px;
  border: 1px solid #4b5563;
  background: #111827;
  color: #e5e7eb;
  font-size: 1.25rem;
  line-height: 1;
  padding: 0;
  cursor: pointer;
}

.btn-add-row:hover {
  border-color: #9ca3af;
  background: #1f2937;
}

.configurator-hint {
  margin: 0 0 0.5rem;
  font-size: 0.85rem;
  color: #9ca3af;
}

.status {
  margin: 0 0 0.25rem;
  font-size: 0.8rem;
  color: #9ca3af;
}

.status-error {
  color: #f97373;
}

.rows-container {
  margin-top: 0.75rem;
  display: flex;
  flex-direction: column;
}
</style>