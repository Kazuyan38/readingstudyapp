import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: '/readingstudyapp/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons.svg'],
      manifest: {
        id: '/readingstudyapp/',
        name: '読書学習帳',
        short_name: '読書学習帳',
        description:
          '読んだ本の要点をカードに凝縮し、忘却曲線に沿って復習・定着させる読書アプリ',
        start_url: '/readingstudyapp/',
        scope: '/readingstudyapp/',
        display: 'standalone',
        background_color: '#070b16',
        theme_color: '#070b16',
        icons: [
          {
            src: 'icons.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        // woff2 のみプリキャッシュ対象にする（フォールバック用の .woff は含めない）
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
        navigateFallback: '/readingstudyapp/index.html',
      },
    }),
  ],
})
