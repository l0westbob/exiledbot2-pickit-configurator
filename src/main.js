import {createApp} from "vue"
import App from "./App.vue"
import {createItemsStore} from "./stores/itemsStore"
import {ItemsStoreKey} from "./stores/itemsStoreKey"

import "./style.css"

const app = createApp(App)

const itemsStore = createItemsStore()
app.provide(ItemsStoreKey, itemsStore)

// load once at startup
itemsStore.loadItems()

app.mount("#app")