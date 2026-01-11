import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/api': {
            target: 'http://localhost:8080',
            changeOrigin: true,
          }
        }
      },
      plugins: [react()],
      define: {
        // Removed process.env.API_KEY to ensure it stays strictly on the backend
      },
      resolve: {
        alias: {
          '@': path.resolve('.'),
        }
      }
    };
});