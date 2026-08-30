import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  platform: 'node',
  target: 'node20',
  sourcemap: true,
  clean: true,
  // Bundle the workspace TypeScript package (Node cannot run TS sources);
  // everything else stays external and is installed on the host.
  noExternal: ['@synthcouncil/schemas'],
});
