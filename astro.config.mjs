import { defineConfig } from 'astro/config';
import db from '@astrojs/db'; // <-- 1. Tiene que estar este import

export default defineConfig({
  integrations: [
    db() // <-- 2. Tiene que estar agregado acá adentro
  ],
});