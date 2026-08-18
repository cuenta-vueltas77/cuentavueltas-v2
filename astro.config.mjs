import { defineConfig } from 'astro/config';
import db from '@astrojs/db';
import vercel from '@astrojs/vercel/serverless';

export default defineConfig({
  output: 'server',
  adapter: vercel(),
  integrations: [db()]
});