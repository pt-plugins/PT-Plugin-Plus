import {fileURLToPath, URL} from 'node:url'
import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue2'

export const sharedConfig = {
  publicDir: 'public',
  resolve: {
    extensions: ['.ts', '.js', '.tsx', '.vue'],
    alias: {
      '@': fileURLToPath(new URL('src', import.meta.url))
    },
  },
}

// https://vitejs.dev/config/
export default defineConfig({
  ...sharedConfig,
  publicDir: 'public',
  build: {
    chunkSizeWarningLimit: Number.MAX_SAFE_INTEGER,
    minify: false,
    emptyOutDir: false,
    rollupOptions: {
      treeshake: false,
    }
  },
  plugins: [
    vue(),
  ],
})
