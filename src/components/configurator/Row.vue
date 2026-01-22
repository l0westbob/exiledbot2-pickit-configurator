<template>
  <div class="row-root">
    <div class="row-config">
      <div class="row-config-head">
        <h3 class="row-title">Row {{ rowIndex + 1 }}</h3>
        <button type="button" class="btn-remove" @click="$emit('remove', rowId)">
          Remove row
        </button>
      </div>

      <!-- Config type dropdown -->
      <label class="field">
        <span class="field-label">Config type</span>
        <select v-model="selectedConfigType" class="field-select">
          <option
              v-for="configTypeOption in CONFIG_TYPE_OPTIONS"
              :key="configTypeOption.value"
              :value="configTypeOption.value"
          >
            {{ configTypeOption.label }}
          </option>
        </select>
      </label>

      <!-- Items config UI -->
      <template v-if="selectedConfigType === 'items'">
        <!-- Item type dropdown -->
        <label class="field">
          <span class="field-label">Item type</span>
          <select
              v-model="selectedItemSlug"
              class="field-select"
              :disabled="!availableItems.length || isLoadingAffixes"
          >
            <option value="" disabled>Select item…</option>
            <option v-for="item in availableItems" :key="item.slug" :value="item.slug">
              {{ item.category }} – {{ item.label }}
            </option>
          </select>
        </label>

        <p v-if="visibleAffixFamilies.length" class="field-hint">
          Prefixes: {{ prefixCount }}/{{ MAX_PREFIXES }}, Suffixes: {{ suffixCount }}/{{ MAX_SUFFIXES }}
        </p>

        <!-- Affix slots -->
        <div v-for="(slot, idx) in affixSlots" :key="slot.id" class="slot-root">
          <div class="slot-head">
            <span class="slot-title">Affix {{ idx + 1 }}</span>
            <button
                v-if="affixSlots.length > 1"
                type="button"
                class="btn-remove-slot"
                @click="removeAffixSlot(idx)"
            >
              Remove
            </button>
          </div>

          <!-- Affix dropdown -->
          <label v-if="visibleAffixFamilies.length" class="field">
            <span class="field-label">Affix</span>
            <select v-model="slot.selectedAffixKey" class="field-select">
              <option :value="null" disabled>Select affix…</option>

              <optgroup
                  v-for="group in affixGroupsForSlot(idx)"
                  :key="group.label"
                  :label="group.label"
              >
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
          <label v-if="availableTiersForSlot(idx).length" class="field">
            <span class="field-label">Tier</span>
            <select v-model.number="slot.selectedTierLevel" class="field-select">
              <option :value="null" disabled>Select tier…</option>
              <option
                  v-for="tier in availableTiersForSlot(idx)"
                  :key="tier.level"
                  :value="tier.level"
              >
                T{{ tierIndexFromBottom(availableTiersForSlot(idx), tier.level) }}
                (lvl {{ tier.level }}) – {{ tier.name || "unnamed" }}
              </option>
            </select>
          </label>
        </div>

        <button
            type="button"
            class="btn-add-affix"
            :disabled="affixSlots.length >= MAX_AFFIX_SLOTS || !canAddAffixSlot"
            @click="addAffixSlot"
            :title="!canAddAffixSlot ? addAffixDisabledReason : ''"
        >
          Add affix ({{ affixSlots.length }}/{{ MAX_AFFIX_SLOTS }})
        </button>

        <p v-if="affixLoadErrorMessage" class="field-error">
          {{ affixLoadErrorMessage }}
        </p>

        <button type="button" class="btn-generate" @click="onGenerate">
          Generate row
        </button>
      </template>

      <!-- Placeholder for other config types -->
      <template v-else>
        <p class="field-hint">This config type is not implemented yet.</p>

        <button type="button" class="btn-generate" @click="onGenerate">
          Generate row
        </button>
      </template>
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
import {computed, inject, ref, watch, watchEffect} from "vue"
import {useAffixSlots} from "../../composables/useAffixSlots"
import {shouldHideAffix} from "../../helpers/affixFilters"
import {ItemsStoreKey} from "../../stores/itemsStoreKey"
import {generateRowPreviewLines} from "../../helpers/generateRowPreviewLines"
import {tierIndexFromBottom} from "../../helpers/tiers"

/**
 * Row component state + orchestration.
 *
 * Responsibilities:
 * - Let the user pick a config type (items, etc.)
 * - For config type "items": let the user pick an item type (slug) and then load its affix catalog (JSON)
 * - Manage up to 6 affix slots with:
 *   - uniqueness across slots
 *   - max 3 prefixes and max 3 suffixes
 * - Continuously emit the computed config lines to the parent (Configurator)
 *   so "Generate final" works even if the user never clicks "Generate row".
 * - Maintain a local previewText shown in the Row UI (only updated when user clicks Generate row)
 */

const props = defineProps({
  /** Stable identifier used by parent to store/retrieve this row's generated lines */
  rowId: {type: String, required: true},
  /** Visual index for "Row X" title */
  rowIndex: {type: Number, required: true},
})

/**
 * Events:
 * - update-lines: payload { rowId: string, lines: string[] }
 * - remove: emitted via template button (not used directly in this script block)
 */
const emit = defineEmits(["update-lines", "remove"])

/**
 * Config types offered by the Row.
 * One of them must be "items" to show the item + affix UI.
 */
const CONFIG_TYPE_OPTIONS = [
  {value: "items", label: "Items"},
  {value: "currency", label: "Currency (todo)"},
  {value: "gems", label: "Gems (todo)"},
]

/** Current selection for the config type dropdown */
const selectedConfigType = ref("items")

/**
 * Inject shared store providing:
 * - items: Ref<Item[]>
 * - getAffixesForSlug(slug): Promise<AffixFamily[]>
 */
const itemsStore = inject(ItemsStoreKey)
if (!itemsStore) throw new Error("ItemsStore not provided")

/** Defensive: always expose an array to templates */
const availableItems = computed(() => itemsStore.items?.value || [])

/** Currently selected item slug (drives affix JSON loading) */
const selectedItemSlug = ref("")

/**
 * Raw affix families loaded for the current item (unfiltered).
 * @type {import("vue").Ref<any[]>} // keep loose unless you add TS/JSDoc typedefs project-wide
 */
const loadedAffixFamilies = ref([])

const isLoadingAffixes = ref(false)
const affixLoadErrorMessage = ref("")

/**
 * Preview text shown on the right side in the Row.
 * Updated only when the user clicks "Generate row".
 */
const previewText = ref("")

/** Convenience: currently selected item object from items.json */
const selectedItem = computed(() => {
  return availableItems.value.find((item) => item.slug === selectedItemSlug.value) || null
})

/**
 * Filter affixes based on UI/business rules:
 * - hide desecrated domain
 * - hide unique/corrupted kinds when domain=item
 */
const visibleAffixFamilies = computed(() => {
  const allFamilies = loadedAffixFamilies.value || []
  return allFamilies.filter((affixFamily) => !shouldHideAffix(affixFamily))
})

/**
 * Slot selection logic is delegated to a composable to keep Row readable.
 * This includes:
 * - max slots
 * - uniqueness
 * - prefix/suffix caps
 * - per-slot grouped dropdown options
 */
const {
  MAX_SLOTS: MAX_AFFIX_SLOTS,
  MAX_PREFIXES,
  MAX_SUFFIXES,
  slots: affixSlots,

  prefixCount,
  suffixCount,

  canAddSlot: canAddAffixSlot,
  addDisabledReason: addAffixDisabledReason,

  addSlot: addAffixSlot,
  removeSlot: removeAffixSlot,

  resetSlots,
  affixKey,
  findAffixByKey,
  groupsForSlot: affixGroupsForSlot,
  availableTiersForSlot,
} = useAffixSlots({
  affixesRef: visibleAffixFamilies,
  maxSlots: 6,
  maxPrefixes: 3,
  maxSuffixes: 3,
})

/**
 * Centralized line generation for this row.
 *
 * If config type is not "items", the row produces no lines (yet).
 *
 * @returns {string[]}
 */
function computeCurrentRowLines() {
  if (selectedConfigType.value !== "items") return []

  return generateRowPreviewLines({
    selectedItemSlug: selectedItemSlug.value,
    selectedItem: selectedItem.value,
    affixSlots: affixSlots.value,
    findAffixByKey,
    availableTiersForSlot,

    // Not strictly required if generateRowPreviewLines doesn't need it,
    // but useful if you want tier labels inside helper in the future.
    tierIndexFromBottom,
  })
}

/**
 * Loads affix catalog for the given item slug.
 * Resets slots + preview, and informs parent that current row lines are empty
 * until new selections are made.
 *
 * @param {string} slug
 */
async function loadAffixesForSelectedItem(slug) {
  if (!slug) {
    loadedAffixFamilies.value = []
    resetSlots()
    previewText.value = ""
    emit("update-lines", {rowId: props.rowId, lines: []})
    return
  }

  isLoadingAffixes.value = true
  affixLoadErrorMessage.value = ""

  try {
    loadedAffixFamilies.value = await itemsStore.getAffixesForSlug(slug)

    // When item changes, any prior affix choices are invalid.
    resetSlots()
    previewText.value = ""

    // Also clear parent lines until the user reselects.
    emit("update-lines", {rowId: props.rowId, lines: []})
  } catch (error) {
    console.error(error)
    affixLoadErrorMessage.value = String(error)

    loadedAffixFamilies.value = []
    resetSlots()
  } finally {
    isLoadingAffixes.value = false
  }
}

/**
 * When config type changes away from "items", wipe item-specific state and ensure
 * the parent doesn't keep stale lines for this row.
 */
watch(selectedConfigType, (newConfigType) => {
  if (newConfigType === "items") return

  selectedItemSlug.value = ""
  loadedAffixFamilies.value = []
  resetSlots()

  affixLoadErrorMessage.value = ""
  previewText.value = ""

  emit("update-lines", {rowId: props.rowId, lines: []})
})

/**
 * Initialize first item as soon as items.json is loaded.
 * Only auto-select if:
 * - config type is "items"
 * - user hasn't picked something already
 */
watch(
    () => availableItems.value,
    (items) => {
      if (selectedConfigType.value !== "items") return
      if (items && items.length && !selectedItemSlug.value) {
        selectedItemSlug.value = items[0].slug
      }
    },
    {immediate: true}
)

/** When item selection changes, load the affix JSON (items mode only) */
watch(selectedItemSlug, (slug) => {
  if (selectedConfigType.value !== "items") return
  loadAffixesForSelectedItem(slug)
})

/**
 * Continuously emit the current computed lines to the parent.
 * This is what makes "Generate final" work even if the user doesn't click
 * "Generate row" in every row.
 *
 * We avoid emitting while loading to prevent transient/partial state.
 */
watchEffect(() => {
  if (isLoadingAffixes.value) return

  emit("update-lines", {
    rowId: props.rowId,
    lines: computeCurrentRowLines(),
  })
})

/**
 * Updates only the local preview UI. Parent already has the lines via watchEffect.
 */
function onGenerate() {
  if (selectedConfigType.value !== "items") {
    previewText.value = "This config type is not implemented yet."
    return
  }

  if (!selectedItemSlug.value) {
    previewText.value = "Select an item type first."
    return
  }

  const lines = computeCurrentRowLines()
  previewText.value = lines.length ? lines.join("\n") : "Nothing selected."
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
  margin: 0.5rem 0 0.5rem;
}

.field-hint {
  font-size: 0.8rem;
  color: #9ca3af;
  margin: 0 0 0.5rem;
}

.slot-root {
  padding: 0.5rem;
  border-radius: 0.5rem;
  border: 1px solid #1f2937;
  background: rgba(17, 24, 39, 0.35);
  margin-bottom: 0.5rem;
}

.slot-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.35rem;
}

.slot-title {
  font-size: 0.85rem;
  color: #e5e7eb;
}

.btn-remove-slot {
  padding: 0.2rem 0.5rem;
  border-radius: 0.5rem;
  border: 1px solid #4b5563;
  background: #111827;
  color: #e5e7eb;
  font-size: 0.8rem;
  cursor: pointer;
}

.btn-remove-slot:hover {
  border-color: #9ca3af;
  background: #1f2937;
}

.btn-add-affix {
  align-self: flex-start;
  margin: 0.25rem 0 0.75rem;
  padding: 0.35rem 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid #4b5563;
  background: #111827;
  color: #e5e7eb;
  font-size: 0.85rem;
  cursor: pointer;
}

.btn-add-affix:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-add-affix:hover:enabled {
  border-color: #9ca3af;
  background: #1f2937;
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