import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GEMINI_API_KEY is intentionally NOT forwarded to the client bundle.
// It lives only in Vercel env vars and is read by /api/gemini.ts at runtime.
export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [react()],
  resolve: {
    alias: {
      // '@' now resolves to src/ so that '@/hooks/...' etc. work correctly.
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
