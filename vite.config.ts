import { fileURLToPath, URL } from 'node:url'
import fs from 'node:fs'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue2'
import git from 'git-rev-sync'
import buildResource from "./vite/buildResource";

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    chunkSizeWarningLimit: 0,
    emptyOutDir: false
  },
  plugins: [
    vue(),
    buildResource(),
    {
      name: 'update_manifest_version',
      buildEnd() {
        const manifest = JSON.parse(fs.readFileSync('./dist/manifest.json', 'utf-8'));
        const build_number = git.count() % 65535;
        manifest.version = `${manifest.version}.${build_number}`;
        
        fs.writeFileSync('./dist/manifest.json',  JSON.stringify(manifest, null, 2));
      },
    }
  ],
  resolve: {
    extensions: ['.ts', '.js', '.tsx', '.vue'],
    alias: {
      '@': fileURLToPath(new URL('src', import.meta.url))
    },
  },
})
