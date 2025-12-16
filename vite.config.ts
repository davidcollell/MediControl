import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
        manifest: {
          name: 'MediControl IA',
          short_name: 'MediControl',
          description: 'Gestiona la teva medicació i consulta dubtes amb l\'assistent IA.',
          theme_color: '#0ea5e9',
          background_color: '#ffffff',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIj48cmVjdCB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgcng9IjEyOCIgZmlsbD0iIzBlYTVlOSIvPjxwYXRoIGQ9Ik0zNTMuOSAxNTguMWMtMzEuMi0zMS4yLTgxLjktMzEuMi0xMTMuMSAwTDE1OC4xIDI0MC44Yy0zMS4yIDMxLjItMzEuMiA4MS45IDAgMTEzLjFzODEuOSAzMS4yIDExMy4xIDBsODIuNy04Mi43YzMxLjItMzEuMiAzMS4yLTgxLjkgMC0xMTMuMXoiIGZpbGw9IiNmZmYiLz48cGF0aCBkPSJNMjMyIDI4MGw0OC00OCIgc3Ryb2tlPSIjMGVhNWU5IiBzdHJva2Utd2lkdGg9IjI0IiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48cGF0aCBkPSJNNDIwIDgwbDEyIDMyIDMyIDEyLTMyIDEyLTEyIDMyLTEyLTMyLTMyLTEyIDMyLTEyeiIgZmlsbD0iI2ZkZTA0NyIvPjwvc3ZnPg==",
              sizes: "192x192",
              type: "image/svg+xml",
              purpose: "any maskable"
            },
            {
              src: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIj48cmVjdCB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgcng9IjEyOCIgZmlsbD0iIzBlYTVlOSIvPjxwYXRoIGQ9Ik0zNTMuOSAxNTguMWMtMzEuMi0zMS4yLTgxLjktMzEuMi0xMTMuMSAwTDE1OC4xIDI0MC44Yy0zMS4yIDMxLjItMzEuMiA4MS45IDAgMTEzLjFzODEuOSAzMS4yIDExMy4xIDBsODIuNy04Mi43YzMxLjItMzEuMiAzMS4yLTgxLjkgMC0xMTMuMXoiIGZpbGw9IiNmZmYiLz48cGF0aCBkPSJNMjMyIDI4MGw0OC00OCIgc3Ryb2tlPSIjMGVhNWU5IiBzdHJva2Utd2lkdGg9IjI0IiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48cGF0aCBkPSJNNDIwIDgwbDEyIDMyIDMyIDEyLTMyIDEyLTEyIDMyLTEyLTMyLTMyLTEyIDMyLTEyeiIgZmlsbD0iI2ZkZTA0NyIvPjwvc3ZnPg==",
              sizes: "512x512",
              type: "image/svg+xml",
              purpose: "any maskable"
            }
          ],
          categories: ["medical", "health", "productivity"]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 dies
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            }
          ]
        }
      })
    ],
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    }
  };
});