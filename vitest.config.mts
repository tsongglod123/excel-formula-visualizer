import { defineConfig } from 'vitest/config';
import { getViteConfig } from 'astro/config';

export default defineConfig({
  vite: {
    ssr: {
      noExternal: ['src/lib/**'],
    },
  },
});