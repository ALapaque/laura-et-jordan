import next from 'eslint-config-next';

/**
 * Next 16 fournit une config ESLint « flat » directement
 * (inclut core-web-vitals + TypeScript).
 */
const eslintConfig = [
  { ignores: ['.next/**', 'node_modules/**', 'drizzle/**', 'next-env.d.ts'] },
  ...next,
  {
    // L'échappement HTML des apostrophes est superflu (React s'en charge)
    // et le texte français en contient partout.
    rules: { 'react/no-unescaped-entities': 'off' },
  },
  {
    // Initialisation d'état client depuis des APIs navigateur (localStorage,
    // matchMedia) au montage : cas légitime de setState dans un effet.
    files: ['src/components/invitation/invitation-provider.tsx'],
    rules: { 'react-hooks/set-state-in-effect': 'off' },
  },
];

export default eslintConfig;
