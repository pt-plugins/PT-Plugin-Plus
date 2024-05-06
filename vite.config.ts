import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue2'
import buildResource from "./vite/buildResource";

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    chunkSizeWarningLimit: 0,
    emptyOutDir: false
  },
  plugins: [
    vue(),
    buildResource()
  ],
  resolve: {
    extensions: ['.ts', '.js', '.tsx', '.vue'],
    alias: {
      '@': fileURLToPath(new URL('src', import.meta.url))
    },
  },
})
