import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "node_modules/**",
  ]),

  {
    rules: {
      // Disallow unused variables — catches dead code and import drift
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],

      // Ban `any` — forces explicit typing, improves maintainability
      "@typescript-eslint/no-explicit-any": "error",

      // Require consistent type assertions
      "@typescript-eslint/consistent-type-assertions": [
        "error",
        { assertionStyle: "as", objectLiteralTypeAssertions: "never" },
      ],

      // Prefer `const` over `let` when reassignment never occurs
      "prefer-const": "error",

      // Disallow `console.*` in production code (use logger utility instead)
      "no-console": ["warn", { allow: ["warn", "error", "info", "debug"] }],

      // Enforce === over == for reliable equality checks
      eqeqeq: ["error", "always"],

      // Prevent accidental fall-through in switch statements
      "no-fallthrough": "error",

      // Disallow unreachable code after return/throw
      "no-unreachable": "error",

      // Consistent import ordering via no-duplicate-imports
      "no-duplicate-imports": "error",
    },
  },
]);

export default eslintConfig;
