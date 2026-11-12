import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: {
    // Local dev: proxy /api to Flask running on 5050
    proxy: {
      '/api': 'http://localhost:5050',
    },
  },
  define: {
    // Expose the API base URL to the app at build time.
    // In production (Render), set VITE_API_URL to the Flask service URL.
    // In local dev it's unused — the proxy above handles /api.
    __API_BASE__: JSON.stringify(
      mode === 'production' && process.env.VITE_API_URL
        ? `https://${process.env.VITE_API_URL}`
        : ''
    ),
  },
}));
