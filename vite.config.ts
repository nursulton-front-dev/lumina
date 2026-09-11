import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // Новая версия не подхватывается молча: приложение показывает плашку «обновить».
      // Ожидающий service worker активируется по кнопке или при следующем холодном запуске.
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        id: '/',
        name: 'Тетрадь фокуса',
        short_name: 'Тетрадь',
        description: 'Личный трекер дня: расписание, протоколы, фокус.',
        lang: 'ru',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#fafbfd',
        theme_color: '#fafbfd',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        clientsClaim: true,
        skipWaiting: false,
        cleanupOutdatedCaches: true,
        // index.html не прекешируется: за навигации отвечает NetworkFirst ниже.
        // Иначе старый воркер отдавал бы страницу со ссылками на ассеты прошлой сборки.
        globPatterns: ['**/*.{js,css,svg,png,woff2}'],
        globIgnores: ['**/index.html'],
        navigateFallback: null,
        runtimeCaching: [
          {
            // Страница: сначала сеть (свежая сборка), при её отсутствии — кеш.
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'pages',
              networkTimeoutSeconds: 3,
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Хешированные ассеты неизменяемы: кеш, а если в кеше нет — сеть.
            urlPattern: ({ url }) => url.pathname.startsWith('/assets/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'assets',
              cacheableResponse: { statuses: [0, 200] },
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 60 },
            },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
