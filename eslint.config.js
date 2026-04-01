import js from "@eslint/js";
import skipFormatting from "@vue/eslint-config-prettier/skip-formatting";
import globals from "globals";
import pluginVue from "eslint-plugin-vue";

export default [
  {
    name: "app/ignores",
    ignores: ["dist/**", "coverage/**", "node_modules/**"],
  },
  js.configs.recommended,
  ...pluginVue.configs["flat/recommended"],
  {
    name: "app/files",
    files: ["**/*.{js,mjs,cjs,jsx,vue}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      "no-debugger": "warn",
    },
  },
  {
    name: "app/vue-overrides",
    files: ["**/*.vue"],
    rules: {
      "vue/block-order": [
        "warn",
        {
          order: ["script", "template", "style"],
        },
      ],
      "vue/multi-word-component-names": "off",
    },
  },
  skipFormatting,
];
