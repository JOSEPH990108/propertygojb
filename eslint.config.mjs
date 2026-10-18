import js from "@eslint/js";
import eslintReact from "@eslint-react/eslint-plugin";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

const reactConfig = eslintReact.configs["recommended-typescript"];

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ...reactConfig,
    files: ["**/*.{jsx,tsx}"],
    rules: {
      ...reactConfig.rules,
      "@eslint-react/error-boundaries": "off",
      "@eslint-react/exhaustive-deps": "off",
      "@eslint-react/purity": "off",
      "@eslint-react/rules-of-hooks": "off",
      "@eslint-react/set-state-in-effect": "off",
      "@eslint-react/set-state-in-render": "off",
      "@eslint-react/static-components": "off",
      "@eslint-react/unsupported-syntax": "off",
      "@eslint-react/use-memo": "off",
    },
  },
  {
    ...reactHooks.configs.flat.recommended,
    files: ["**/*.{js,jsx,ts,tsx}"],
  },
  { ignores: [".next/**", "out/**", "build/**", "next-env.d.ts"] },
);
