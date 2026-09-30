import coreWebVitals from 'eslint-config-next/core-web-vitals';
import typescript from 'eslint-config-next/typescript';
import jsxA11y from 'eslint-plugin-jsx-a11y';

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
  // eslint-config-next enables only a handful of jsx-a11y rules. Turn on the
  // full recommended set: the first run found seven real problems nobody was
  // checking for. Rules only — the preset above already registers the plugin,
  // and registering it twice is an error.
  {
    files: ['src/**/*.{jsx,tsx}'],
    rules: jsxA11y.flatConfigs.recommended.rules,
  },
  // Playwright fixtures receive a callback named `use`, which the React hooks
  // rule mistakes for a hook. Nothing under e2e/ is React.
  {
    files: ['e2e/**'],
    rules: { 'react-hooks/rules-of-hooks': 'off' },
  },
];

export default eslintConfig;
