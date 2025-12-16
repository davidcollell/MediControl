import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    define: {
      // Vercel injecta API_KEY com a variable d'entorn de procés, 
      // però el navegador no té 'process'. Això ho substitueix en temps de build.
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    }
  };
});