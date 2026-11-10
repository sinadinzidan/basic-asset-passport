import path from 'node:path';

import {
  fusionOpenPlugin,
  manifestCspPlugin,
  mkcertPlugin,
} from '@cognite/app-sdk/vite';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  // manifestCspPlugin() must stay first — its middleware sets the
  // Content-Security-Policy header before any HTML response is sent.
  plugins: [manifestCspPlugin(), react(), mkcertPlugin(), fusionOpenPlugin(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3001,
  },
  // Pre-bundling pdfjs-dist breaks its worker.
  optimizeDeps: {
    exclude: ['pdfjs-dist'],
  },
  worker: {
    format: 'es',
  },
  build: {
    rollupOptions: {
      output: {
        // Large vendor libraries get their own files: each stays under the size warning and keeps its cache entry
        // across releases that only change the app.
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return undefined;
          if (/node_modules\/(react|react-dom|scheduler)\//.test(id)) return 'react';
          if (/node_modules\/@cognite\/(sdk|sdk-core)\//.test(id)) return 'cognite-sdk';
          if (/node_modules\/(@tanstack\/(react-query|query-core))\//.test(id)) return 'data';
          return undefined;
        },
      },
    },
  },
});
