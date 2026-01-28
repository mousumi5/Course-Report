
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load environment variables if present
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    define: {
      // Define process.env.API_KEY globally for the client.
      // Uses the provided key as the value.
      'process.env.API_KEY': JSON.stringify('AIzaSyCioVaHgNbzbhSDXydU7sT7v0ADTum7Ekk')
    },
    server: {
      port: 3000,
      host: true
    },
    build: {
      outDir: 'dist',
      sourcemap: true
    }
  };
});
