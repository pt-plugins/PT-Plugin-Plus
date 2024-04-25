import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue2'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    chunkSizeWarningLimit: 0
  },
  plugins: [
    vue(),
  ],
  resolve: {
    extensions: ['.ts', '.js', '.tsx', '.vue'],
    alias: {
      '@': fileURLToPath(new URL('src', import.meta.url))
    },
  },
})
