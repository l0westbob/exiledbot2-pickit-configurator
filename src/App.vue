<template>
  <main class="app-root">
    <Configurator :items="items"/>
  </main>
</template>

<script setup>
import {onMounted, ref} from "vue"
import Configurator from "./components/configurator/Configurator.vue"

const items = ref([])
const baseUrl = import.meta.env.BASE_URL

onMounted(async () => {
  // expects: public/data/items.json
  const res = await fetch(baseUrl + "data/items.json")
  if (!res.ok) {
    console.error("Failed to load items.json:", res.status)
    items.value = []
    return
  }

  const data = await res.json()
  items.value = Array.isArray(data?.items) ? data.items : []
})
</script>

<style scoped>
.app-root {
  padding: 1rem;
  background: #0b1020;
  min-height: 100vh;
}
</style>