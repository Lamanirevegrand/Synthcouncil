import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'node',
        include: ['src/**/*.spec.ts'], // Only read test files
        clearMocks: true, // Nettoie l'état entre chaque test
    },
});