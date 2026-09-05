/// <reference types="vitest/config" />

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';

export default defineConfig({
  root: resolve(import.meta.dirname, 'src'),
  resolve: {
    conditions: ['browser'],
  },
  plugins: [
    svelte({ configFile: resolve(import.meta.dirname, 'svelte.config.js') }),
    {
      name: 'phase-4b-pwa-assets',
      generateBundle() {
        const pwaRoot = resolve(import.meta.dirname, 'src/pwa');
        const stamp = process.env.PWA_VERSION ?? versionStamp();
        this.emitFile({ type: 'asset', fileName: 'manifest.webmanifest', source: readFileSync(resolve(pwaRoot, 'manifest.webmanifest')) });
        this.emitFile({ type: 'asset', fileName: 'sw.js', source: readFileSync(resolve(pwaRoot, 'sw.js'), 'utf8').replaceAll('__VERSION__', stamp) });
        for (const icon of ['icon.svg', 'icon-192.png', 'icon-512.png']) this.emitFile({ type: 'asset', fileName: `icons/${icon}`, source: readFileSync(resolve(pwaRoot, 'icons', icon)) });
      },
    },
  ],
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

function versionStamp(date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}
