import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  define: {
    __API_URL__: JSON.stringify(process.env.VITE_API_URL || 'https://quizzzio.onrender.com/api'),
  },
  envPrefix: 'VITE_',
  envDir: '.',
});
