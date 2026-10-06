import { defineConfig, globalIgnores } from "eslint/config";
import { mobileBoundaryRules } from "@noalhub/config/eslint.boundaries.mjs";

const eslintConfig = defineConfig([
  {
    rules: mobileBoundaryRules,
  },
  globalIgnores([
    ".expo/**",
    "android/**",
    "ios/**",
    "dist/**",
    "node_modules/**",
  ]),
]);

export default eslintConfig;
