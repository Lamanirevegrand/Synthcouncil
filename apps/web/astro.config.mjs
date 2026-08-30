import react from '@astrojs/react';
import { defineConfig } from 'astro/config';

// Static site on Netlify. The engine lives on Render (see apps/api) and is
// reached through PUBLIC_API_URL — no API key ever ships in this bundle.
export default defineConfig({
  integrations: [react()],
  output: 'static',
  site: 'https://synthcouncil.netlify.app',
});
