
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load environment variables from the current working directory.
  // The third parameter '' allows loading variables without the 'VITE_' prefix,
  // ensuring compatibility with the required 'process.env.API_KEY' naming convention.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    define: {
      // This defines the global 'process.env.API_KEY' constant in the client-side bundle.
      // It prioritizes the environment variable from Vercel/System (process.env) 
      // or a local .env file (env.API_KEY).
      'process.env.API_KEY': JSON.stringify(env.API_KEY || process.env.API_KEY)
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
