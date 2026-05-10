import {computed, ref} from "vue"
import {getImplementedCatalogItems} from "../domain/pickit/catalog.js"
import {loadCatalog} from "../services/catalogService.js"

const catalogItems = ref([])
const isLoadingCatalog = ref(false)
const catalogErrorMessage = ref("")
let hasStartedCatalogLoad = false

async function ensureCatalogLoaded() {
  if (hasStartedCatalogLoad && (catalogItems.value.length || isLoadingCatalog.value)) return

  hasStartedCatalogLoad = true
  isLoadingCatalog.value = true
  catalogErrorMessage.value = ""

  try {
    catalogItems.value = await loadCatalog()
  } catch (error) {
    console.error(error)
    catalogErrorMessage.value = String(error)
    catalogItems.value = []
    hasStartedCatalogLoad = false
  } finally {
    isLoadingCatalog.value = false
  }
}

export function useCatalogData() {
  const availableItems = computed(() => getImplementedCatalogItems(catalogItems.value))

  return {
    catalogItems,
    availableItems,
    isLoadingCatalog,
    catalogErrorMessage,
    ensureCatalogLoaded,
  }
}
