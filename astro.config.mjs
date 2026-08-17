import { defineConfig } from 'astro/config';
import db from '@astrojs/db';

import vercel from '@astrojs/vercel';

export default defineConfig({
  integrations: [
    db()
  ],

  adapter: vercel()
});