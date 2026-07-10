// ESLint flat config (Next 16: `next lint` was removed; the `lint` script runs
// the ESLint CLI directly, and eslint-config-next v16 ships flat config natively).
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = [
  ...nextCoreWebVitals,
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "docs"
    ],
  },
];

export default eslintConfig;
