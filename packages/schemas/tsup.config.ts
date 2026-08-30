import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/index.ts'],
    format: ['esm'],
    dts: true, // Emit type definitions
    clean: true, // Nettoie le dossier dist à chaque build
});