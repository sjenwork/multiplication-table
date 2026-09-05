/// <reference types="vitest/config" />

import { resolve } from 'node:path';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';

export default defineConfig({
  root: resolve(import.meta.dirname, 'src'),
  resolve: {
    conditions: ['browser'],
  },
  plugins: [svelte({ configFile: resolve(import.meta.dirname, 'svelte.config.js') })],
  build: {
    outDir: resolve(import.meta.dirname, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: 'index.html',
        quiz: 'quiz.html',
      },
    },
  },
  test: {
    root: resolve(import.meta.dirname),
    environment: 'jsdom',
    server: {
      deps: {
        inline: ['svelte'],
      },
    },
    include: ['tests/**/*.test.ts'],
  },
});
