
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Use a simple declaration for process if not using full @types/node globally
// though we added it to package.json for build stability.
export default defineConfig({
  plugins: [react()],
  define: {
    // Injects process.env.API_KEY from Vercel/System environment into the browser bundle
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  },
  build: {
    target: 'esnext',
    outDir: 'dist'
  },
  server: {
    port: 3000
  }
});
