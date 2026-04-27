import js from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

export const baseConfig = [
  {
    ignores: ["**/dist/**", "**/coverage/**", "playwright-report/**", "test-results/**"]
  },
  js.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: false,
        sourceType: "module",
        ecmaVersion: "latest"
      },
      globals: {
        window: "readonly",
        document: "readonly",
        console: "readonly",
        KeyboardEvent: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        localStorage: "readonly"
      }
    },
    plugins: {
      "@typescript-eslint": tseslint,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh
    },
    rules: {
      ...tseslint.configs["recommended"].rules,
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { "allowConstantExport": true }],
      "@typescript-eslint/no-unused-vars": ["error", { "ignoreRestSiblings": true }]
    }
  }
];
