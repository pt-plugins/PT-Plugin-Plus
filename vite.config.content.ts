import path from 'node:path'
import { defineConfig } from 'vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import {sharedConfig} from "./vite.config";

// https://vitejs.dev/config/
export default defineConfig({
  ...sharedConfig,
  build: {
    outDir: path.resolve(__dirname, 'dist/contentScripts'),
    lib: {
      entry: path.resolve(__dirname, 'src/content/index.ts'),
      name: 'content',
      formats: ['iife']
    },
    rollupOptions: {
      output: {
        entryFileNames: 'index.js',
        extend: true,
      },
    },
    chunkSizeWarningLimit: Number.MAX_SAFE_INTEGER,
    emptyOutDir: false,
    copyPublicDir: false
  },
  plugins: [
    nodePolyfills({
      include: ['path'],
    }),
  ]
})
