<template>
  <div class="app">
    <header class="app-header">
      <h1>ExiledBot 2 – Pickit Configurator</h1>
      <p class="app-subtitle">
        This is work in progress
      </p>
    </header>

    <main class="app-main">
      <Configurator/>
    </main>
  </div>
</template>

<script setup>
import Configurator from "./components/configurator/Configurator.vue"
</script>

<style scoped>
.app {
  min-height: 100vh;
  padding: 1.5rem;
  background: #0b0c10;
  color: #e5e5e5;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.app-header {
  margin-bottom: 1.5rem;
}

.app-header h1 {
  margin: 0 0 0.25rem;
  font-size: 1.75rem;
}

.app-subtitle {
  margin: 0;
  font-size: 0.95rem;
  color: #9ca3af;
}

.app-main {
  /* single column for now; we can change to grid later */
}
</style>