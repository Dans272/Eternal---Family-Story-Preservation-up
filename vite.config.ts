import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GEMINI_API_KEY is intentionally NOT forwarded to the client bundle.
// It is read only by /api/gemini.ts at runtime on the server.
export default defineConfig({
  root: '.',
  server: {
    port: 5173,
    host: '0.0.0.0',
    strictPort: true,
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: 'dist',
  },
});
