import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/index.ts'],
    format: ['esm'],
    dts: true, // Génère les définitions de types
    clean: true, // Nettoie le dossier dist à chaque build
});