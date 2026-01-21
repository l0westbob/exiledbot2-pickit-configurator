<template>
  <div class="row-root">
    <div class="row-config">
      <div class="row-config-head">
        <h3 class="row-title">Row {{ rowIndex + 1 }}</h3>
        <button type="button" class="btn-remove" @click="$emit('remove', rowId)">
          Remove
        </button>
      </div>

      <!-- Item type dropdown -->
      <label class="field">
        <span class="field-label">Item type</span>
        <select
            v-model="selectedItemSlug"
            class="field-select"
            :disabled="!itemsSafe.length || loadingItem"
        >
          <option value="" disabled>Select item…</option>
          <option v-for="item in itemsSafe" :key="item.slug" :value="item.slug">
            {{ item.category }} – {{ item.label }}
          </option>
        </select>
      </label>

      <!-- Affix dropdown -->
      <label v-if="affixes.length" class="field">
        <span class="field-label">Affix</span>
        <select v-model="selectedAffixKey" class="field-select">
          <option :value="null" disabled>Select affix…</option>

          <optgroup v-for="group in affixGroups" :key="group.label" :label="group.label">
            <option
                v-for="affix in group.items"
                :key="affixKey(affix)"
                :value="affixKey(affix)"
            >
              {{ affix.template }}
            </option>
          </optgroup>
        </select>
      </label>

      <!-- Tier dropdown -->
      <label v-if="availableTiers.length" class="field">
        <span class="field-label">Tier</span>
        <select v-model.number="selectedTierLevel" class="field-select">
          <option :value="null" disabled>Select tier…</option>
          <option v-for="tier in availableTiers" :key="tier.level" :value="tier.level">
            T{{ tierIndexFromBottom(tier.level) }} (lvl {{ tier.level }}) – {{ tier.name || "unnamed" }}
          </option>
        </select>
      </label>

      <p v-if="itemError" class="field-error">
        {{ itemError }}
      </p>

      <button type="button" class="btn-generate" @click="onGenerate">
        Generate row
      </button>
    </div>

    <div class="row-preview">
      <h3 class="row-title">Preview</h3>
      <div class="preview-box">
        <span v-if="previewText">{{ previewText }}</span>
        <span v-else class="preview-placeholder">No config generated yet.</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import {computed, ref, watch} from "vue"

/**
 * @typedef {{ level:number, name?:string, text?:string }} Tier
 * @typedef {{
 *   kind: string,
 *   domain: string,
 *   family_key: string,
 *   template: string,
 *   identifier: string,
 *   tiers: Tier[]
 * }} AffixFamily
 */

const props = defineProps({
  rowId: {type: String, required: true},
  rowIndex: {type: Number, required: true},
  items: {type: Array, required: true},
})

const emit = defineEmits(["update-lines", "remove"])

const itemsSafe = computed(() => (Array.isArray(props.items) ? props.items : []))

const selectedItemSlug = ref("")
/** @type {import("vue").Ref<AffixFamily[] | null>} */
const itemData = ref(null)

const loadingItem = ref(false)
const itemError = ref("")

const selectedAffixKey = ref(null)
const selectedTierLevel = ref(null)

const previewText = ref("")

const baseUrl = import.meta.env.BASE_URL

const selectedItem = computed(() => {
  return itemsSafe.value.find((i) => i.slug === selectedItemSlug.value) || null
})

const affixGroups = computed(() => {
  const list = affixes.value || []

  const byTemplate = (a, b) => {
    const ta = typeof a.template === "string" ? a.template : ""
    const tb = typeof b.template === "string" ? b.template : ""
    return ta.localeCompare(tb)
  }

  const prefixes = list.filter((a) => a.kind === "prefix").sort(byTemplate)
  const suffixes = list.filter((a) => a.kind === "suffix").sort(byTemplate)
  const other = list.filter((a) => a.kind !== "prefix" && a.kind !== "suffix").sort(byTemplate)

  const groups = []
  if (prefixes.length) groups.push({label: "-- Prefixes --", items: prefixes})
  if (suffixes.length) groups.push({label: "-- Suffixes --", items: suffixes})
  if (other.length) groups.push({label: "-- Other --", items: other})

  return groups
})

async function loadItemData(slug) {
  if (!slug) {
    itemData.value = null
    selectedAffixKey.value = null
    selectedTierLevel.value = null
    return
  }

  loadingItem.value = true
  itemError.value = ""

  try {
    const url = baseUrl + `data/affixes/${slug}.json`
    const res = await fetch(url)
    if (!res.ok) {
      throw new Error(`Failed to load item data for ${slug}: ${res.status}`)
    }

    const raw = await res.json()

    // IMPORTANT: your schema is { affixes: [...] }, not a JSON array
    if (!raw || typeof raw !== "object" || !Array.isArray(raw.affixes)) {
      throw new Error(`Invalid schema for ${slug}.json: expected { affixes: [...] }`)
    }

    itemData.value = raw.affixes
    selectedAffixKey.value = null
    selectedTierLevel.value = null
  } catch (e) {
    console.error(e)
    itemError.value = String(e)
    itemData.value = null
  } finally {
    loadingItem.value = false
  }
}

watch(
    () => itemsSafe.value,
    (items) => {
      if (items && items.length && !selectedItemSlug.value) {
        selectedItemSlug.value = items[0].slug
      }
    },
    {immediate: true}
)

watch(selectedItemSlug, (slug) => {
  loadItemData(slug)
})

function shouldHideAffix(affix) {
  if (!affix || typeof affix !== "object") return true

  const modDomain = typeof affix.domain === "string" ? affix.domain : ""
  const kind = typeof affix.kind === "string" ? affix.kind : ""

  if (modDomain === "item" && (kind === "unique" || kind === "corrupted")) return true
  if (modDomain === "desecrated") return true

  return false
}

const affixes = computed(() => {
  const all = itemData.value || []
  return all.filter((a) => !shouldHideAffix(a))
})

function affixKey(affix) {
  if (!affix || typeof affix !== "object") return "||||"

  const kind = typeof affix.kind === "string" ? affix.kind : ""
  const modDomain = typeof affix.domain === "string" ? affix.domain : ""
  const family = typeof affix.family_key === "string" ? affix.family_key : ""
  const identifier = typeof affix.identifier === "string" ? affix.identifier : ""
  const template = typeof affix.template === "string" ? affix.template : ""

  return `${kind}|${modDomain}|${family}|${identifier}|${template}`
}

const selectedAffix = computed(() => {
  if (!selectedAffixKey.value) return null
  return affixes.value.find((a) => affixKey(a) === selectedAffixKey.value) || null
})

const availableTiers = computed(() => {
  if (!selectedAffix.value || !Array.isArray(selectedAffix.value.tiers)) return []
  return selectedAffix.value.tiers
})

function tierIndexFromBottom(level) {
  if (!availableTiers.value.length) return "?"
  const sorted = [...availableTiers.value].map((t) => t.level).sort((a, b) => a - b)
  const idx = sorted.indexOf(level)
  if (idx === -1) return "?"
  return sorted.length - idx
}

function onGenerate() {
  if (!selectedItemSlug.value) {
    previewText.value = "Select an item type first."
    emit("update-lines", {rowId: props.rowId, lines: []})
    return
  }
  if (!selectedAffix.value) {
    previewText.value = "Select an affix."
    emit("update-lines", {rowId: props.rowId, lines: []})
    return
  }
  if (!selectedTierLevel.value) {
    previewText.value = "Select a tier."
    emit("update-lines", {rowId: props.rowId, lines: []})
    return
  }

  const itemLabel = (selectedItem.value && selectedItem.value.label) || selectedItemSlug.value
  const aff = selectedAffix.value
  const tier = availableTiers.value.find((t) => t.level === selectedTierLevel.value)

  if (!tier) {
    previewText.value = "Selected tier not found."
    emit("update-lines", {rowId: props.rowId, lines: []})
    return
  }

  const tIndex = tierIndexFromBottom(tier.level)
  const tierName = tier.name || `T${tIndex}`
  const tierText = tier.text || ""

  const modDomain = typeof aff.domain === "string" ? aff.domain : ""
  const domainPart = modDomain ? ` | ${modDomain}` : ""

  const line = `[${itemLabel}] ${aff.kind}${domainPart} | ${aff.template} | T${tIndex} (lvl ${tier.level}) ${tierName} -> ${tierText}`

  previewText.value = line

  // For now: exactly one line per row. Later this can become multiple lines.
  emit("update-lines", {rowId: props.rowId, lines: [line]})
}
</script>

<style scoped>
.row-root {
  display: grid;
  grid-template-columns: minmax(0, 1.7fr) minmax(0, 2fr);
  gap: 1rem;
  padding: 0.75rem;
  margin-bottom: 0.75rem;
  border-radius: 0.75rem;
  background: #020617;
  border: 1px solid #1f2937;
}

.row-config,
.row-preview {
  display: flex;
  flex-direction: column;
}

.row-config-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.row-title {
  margin: 0 0 0.5rem;
  font-size: 0.95rem;
  color: #e5e7eb;
}

.btn-remove {
  padding: 0.25rem 0.6rem;
  border-radius: 0.5rem;
  border: 1px solid #4b5563;
  background: #111827;
  color: #e5e7eb;
  font-size: 0.8rem;
  cursor: pointer;
}

.btn-remove:hover {
  border-color: #9ca3af;
  background: #1f2937;
}

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

.field-select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.field-error {
  font-size: 0.8rem;
  color: #f97373;
  margin: 0 0 0.5rem;
}

.btn-generate {
  align-self: flex-start;
  margin-top: 0.25rem;
  padding: 0.35rem 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid #4b5563;
  background: #111827;
  color: #e5e7eb;
  font-size: 0.85rem;
  cursor: pointer;
}

.btn-generate:hover {
  border-color: #9ca3af;
  background: #1f2937;
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