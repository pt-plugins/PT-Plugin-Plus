import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue2'
// import vuetify from "vite-plugin-vuetify"

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    chunkSizeWarningLimit: 0
  },
  plugins: [
    // https://github.com/underfin/vite-plugin-vue2
    vue(),
    // vuetify({ styles: 'sass' }),
  ],
  resolve: {
    extensions: ['.ts', '.js', '.tsx', '.vue'],
    alias: {
      '@': fileURLToPath(new URL('src', import.meta.url))
    },
  },
})
