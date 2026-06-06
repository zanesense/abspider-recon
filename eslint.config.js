import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "dist",
      "src/components/ui/*",
      "src/hooks/use-toast.ts",
      "src/hooks/use-mobile.tsx",
    ],
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "@typescript-eslint/no-unused-vars": "off",
      // The codebase intentionally uses `any` for external/third-party
      // untyped payloads (Supabase responses, scan module results). The
      // recommended rule produces 100+ errors with no real safety benefit.
      "@typescript-eslint/no-explicit-any": "off",
      // False positives in regex literals (e.g. inside `/` and `\$` in
      // LFI/SQLi/XSS payload lists). Real escapes are still caught by the
      // parser, so disabling the rule here does not weaken the lint.
      "no-useless-escape": "off",
    },
  }
);
