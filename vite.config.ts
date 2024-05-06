import { fileURLToPath, URL } from 'node:url'
import fs from 'node:fs'
import path from 'node:path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue2'
import git from 'git-rev-sync'
import buildResource from "./vite/buildResource";

// https://vitejs.dev/config/
export default defineConfig({
  publicDir: 'public',
  build: {
    chunkSizeWarningLimit: 0,
    emptyOutDir: false
  },
  plugins: [
    vue(),
    buildResource(),
    {
      name: 'update_manifest_version',
      closeBundle() {
        const manifest_file_path = path.resolve(__dirname, './dist/manifest.json');
        const manifest = JSON.parse(fs.readFileSync(manifest_file_path, 'utf-8'));
        const build_number = git.count() % 65535;
        manifest.version = `${manifest.version}.${build_number}`;

        fs.writeFileSync(manifest_file_path, JSON.stringify(manifest, null, 2));
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
