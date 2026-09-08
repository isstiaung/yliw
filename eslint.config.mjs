import coreWebVitals from 'eslint-config-next/core-web-vitals';
import typescript from 'eslint-config-next/typescript';

// eslint-config-next 16 ships native flat configs, so the FlatCompat shim
// (and its @eslint/eslintrc dependency) is gone.
const eslintConfig = [
  // `next lint` used to skip these implicitly; we call the ESLint CLI
  // directly, so build output has to be excluded here instead.
  {
    ignores: ['.next/**', 'out/**', 'build/**', 'node_modules/**', 'next-env.d.ts'],
  },
  ...coreWebVitals,
  ...typescript,
];

export default eslintConfig;
