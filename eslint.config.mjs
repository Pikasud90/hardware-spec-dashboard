import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "release/**",
      "build/**",
      "next-env.d.ts",
      // The Electron main/preload processes are CommonJS by necessity — they
      // are loaded by Electron's Node runtime, not bundled by Next.
      "electron/**",
      // Build-time Node utilities, not application code.
      "scripts/**",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];

export default eslintConfig;
