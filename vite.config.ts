import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['**/*'],
        manifest: {
          name: 'في ظلال القرآن',
          short_name: 'ظلال القرآن',
          description: 'تفسير في ظلال القرآن - سيد قطب',
          theme_color: '#F27D26',
          background_color: '#1a1a1a',
          display: 'standalone',
          orientation: 'portrait',
          dir: 'rtl',
          lang: 'ar',
          icons: [
            {src: '/icons/icon-192.svg', sizes: '192x192', type: 'image/svg+xml'},
            {src: '/icons/icon-512.svg', sizes: '512x512', type: 'image/svg+xml'},
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          maximumFileSizeToCacheInBytes: 25 * 1024 * 1024,
          runtimeCaching: [
            {
              urlPattern: /^\/api\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache',
                expiration: {maxEntries: 50, maxAgeSeconds: 60 * 60 * 24},
              },
            },
          ],
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (id.includes('/src/data/tafsir')) return 'tafsir';
          },
        },
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
