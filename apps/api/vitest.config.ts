import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'node',
        include: ['src/**/*.spec.ts'], // Ne lit que les fichiers de test
        clearMocks: true, // Nettoie l'état entre chaque test
    },
});