import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist/**", "referans/**", "docs/archive/**", "docs/reference/**", "docs/reference-clones/**"] },
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
      "react-refresh/only-export-components": ["warn", {
        allowConstantExport: true,
        allowExportNames: [
          "ALL_TEMPLATES",
          "INTEREST_CATEGORIES",
          "badgeVariants",
          "buttonVariants",
          "catalogItemEditorKeys",
          "diasporaOptions",
          "diasporaTranslations",
          "emptyConsent",
          "getTemplate",
          "isConsentValid",
          "navigationMenuTriggerStyle",
          "sharePublicProfile",
          "toast",
          "toggleVariants",
          "useAuth",
          "useDiaspora",
          "useFormField",
          "useProfileGate",
          "useSidebar",
        ],
      }],
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
);
