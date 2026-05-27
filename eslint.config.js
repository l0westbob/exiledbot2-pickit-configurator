import js from "@eslint/js"
import eslintConfigPrettier from "eslint-config-prettier"
import vue from "eslint-plugin-vue"
import globals from "globals"

export default [
  {
    ignores: ["dist/**", "node_modules/**", "public/data/**", "eb2-data/**", "coverage/**"],
  },
  js.configs.recommended,
  ...vue.configs["flat/recommended"],
  {
    files: ["**/*.{js,mjs,vue}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.es2024,
      },
    },
    rules: {
      "no-console": "off",
      "vue/multi-word-component-names": "off",
      "vue/no-v-html": "error",
    },
  },
  {
    files: ["*.config.js", "scripts/**/*.mjs", "vite.config.js"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  {
    files: ["tests/**/*.{js,mjs}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.vitest,
      },
    },
  },
  eslintConfigPrettier,
]
