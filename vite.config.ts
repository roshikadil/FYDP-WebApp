import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // No historyApiFallback here — Vite handles SPA automatically in dev
  },
  build: {
    outDir: 'dist',
  },
});
