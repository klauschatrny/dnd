import { defineConfig } from 'vite';

// Base relativa para o build WebGL funcionar servido de qualquer subpasta.
export default defineConfig({
  base: './',
  server: {
    port: 5173,
    open: false,
  },
  build: {
    target: 'es2022',
    outDir: 'dist',
  },
});
