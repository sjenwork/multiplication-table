/// <reference types="vitest/config" />

import { renameSync } from 'node:fs';
import { resolve } from 'node:path';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';

export default defineConfig({
  resolve: {
    conditions: ['browser'],
  },
  plugins: [
    svelte(),
    {
      name: 'phase-0-index-entry',
      writeBundle(options, bundle) {
        const migrationEntry = Object.values(bundle).find(
          (asset) => asset.type === 'asset' && asset.fileName.endsWith('app.html'),
        );

        if (!migrationEntry || migrationEntry.type !== 'asset') {
          throw new Error('Phase 0 migration entry was not emitted');
        }

        if (!options.dir) {
          throw new Error('Vite build output directory is not configured');
        }

        renameSync(
          resolve(options.dir, migrationEntry.fileName),
          resolve(options.dir, 'index.html'),
        );
      },
    },
  ],
  build: {
    rollupOptions: {
      // Keep the migration shell separate from the legacy source while
      // emitting the deployable static entry at the conventional path.
      input: {
        index: 'src/app.html',
      },
    },
  },
  test: {
    environment: 'jsdom',
    server: {
      deps: {
        inline: ['svelte'],
      },
    },
    include: ['tests/**/*.test.ts'],
  },
});
