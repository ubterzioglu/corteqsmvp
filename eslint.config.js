import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  // .worktrees/** ve .kilo/**: git worktree'leri depo KÖKÜNÜN İÇİNE açıldığında ESLint
  // onların tüm ağacını da tarar ve o worktree'deki arşiv/referans kodu lint tabanını
  // kirletir (09.09.2026'da tam olarak bu oldu: src temizken "1 error" raporlandı).
  // Worktree kendi checkout'unda zaten kendi lint'ini koşar.
  //
  // ⚠️ AYNI SINIF 17.09.2026'da TEKRARLADI, bu kez `.kilo/worktrees/psychedelic-hen`
  // ile: src tertemizken lint 286 problem raporladı. Kök neden — **`.gitignore`
  // ESLint'i bağlamaz**: `.kilo/` gitignore'da (satır 59) olmasına rağmen flat config
  // onu kendiliğinden atlamaz, buraya ayrıca yazılması gerekir. Depo köküne worktree
  // açan yeni bir araç eklenirse dizinini bu listeye de ekle.
  {
    ignores: [
      "dist/**",
      ".worktrees/**",
      // Ajan worktree'leri: .worktrees/ ve .kilo/ zaten elenmişti ama Claude Code
      // worktree'lerini .claude/worktrees/ altına açıyor ve bu yol listede yoktu.
      // 2026-09-20'de oraya açılan bir worktree `npm run lint`'i 286 hatayla
      // kırdı — hiçbiri depo kodundan değildi.
      ".claude/worktrees/**",
      ".kilo/**",
      "referans/**",
      // İçerik referansı için klonlanan corteqssocial-web/corteqs deposu.
      // .gitignore'da yok sayılıyor ama `eslint .` onu bilmez — eklenmezse
      // yabancı deponun 300+ sorunu bizim lint çıktımızı boğar.
      "referanslovable/**",
      "docs/archive/**",
      "docs/reference/**",
      "docs/reference-clones/**",
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
  // C11.2: veri erişimi API katmanına taşınmış yüzeylerde `any` geri gelemez.
  {
    files: [
      "src/pages/relocation/**/*.{ts,tsx}",
      "src/components/relocation/**/*.{ts,tsx}",
      "src/hooks/useCurrentUserProfile.ts",
      "src/hooks/useCurrentUserDashboard.ts",
      "src/hooks/useFeatureFlags.ts",
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
);
