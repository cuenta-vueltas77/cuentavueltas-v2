import { defineConfig } from 'astro/config';
import db from '@astrojs/db';

export default defineConfig({
  output: 'static',
  integrations: [db()]
});