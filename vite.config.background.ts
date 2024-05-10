import path from 'node:path'
import {defineConfig} from 'vite'
import {sharedConfig} from "./vite.config";
import fs from "node:fs";
import git from 'git-rev-sync'
import buildResource from "./vite/buildResource";

// https://vitejs.dev/config/
export default defineConfig({
  ...sharedConfig,
  build: {
    outDir: path.resolve(__dirname, 'dist/background'),
    lib: {
      entry: path.resolve(__dirname, 'src/background/index.ts'),
      name: 'background',
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
  ]
})
