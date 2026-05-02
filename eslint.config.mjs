import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Note: jsx-a11y plugin is already included transitively by eslint-config-next.
// We just enable additional a11y rules below.

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "node_modules/**",
    "supabase/repair/**",
  ]),
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "no-console": ["error", { allow: ["error"] }],
      "@next/next/no-img-element": "error",
      // a11y bazı kurallar projeye özgün — başlangıçta warn'a düşürülmüş, sonra error'a çıkarılabilir.
      "jsx-a11y/no-autofocus": "warn",
      "jsx-a11y/click-events-have-key-events": "warn",
      "jsx-a11y/no-static-element-interactions": "warn",
      "jsx-a11y/label-has-associated-control": "warn",
      "jsx-a11y/anchor-is-valid": "warn",
      "jsx-a11y/iframe-has-title": "warn",
    },
  },
  {
    // Test, config, ve script dosyalarında console serbest, a11y devre dışı
    files: ["__tests__/**/*", "e2e/**/*", "scripts/**/*", "*.config.{ts,mjs,js}", "vitest.config.ts", "playwright.config.ts"],
    rules: {
      "no-console": "off",
      "jsx-a11y/no-autofocus": "off",
      "jsx-a11y/click-events-have-key-events": "off",
      "jsx-a11y/no-static-element-interactions": "off",
      "jsx-a11y/label-has-associated-control": "off",
      "jsx-a11y/anchor-is-valid": "off",
      "jsx-a11y/iframe-has-title": "off",
    },
  },
]);

export default eslintConfig;
