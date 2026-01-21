import {defineConfig} from "vite"
import vue from "@vitejs/plugin-vue"

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [vue()],
    // IMPORTANT for GitHub Pages: repo name as base
    base: "/exiledbot2-pickit-configurator/"
})