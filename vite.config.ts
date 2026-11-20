/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// base: './' radi i na GitHub Pages (pod-putanja /ime-repozitorija/) i na Netlify (korijen).
// Verzija appa (datum i vrijeme builda) – vidi se u Postavkama, da se provjeri da li je objavljena nova verzija.
const sad = new Date();
const p2 = (n: number) => String(n).padStart(2, '0');
const VERZIJA = `${p2(sad.getDate())}.${p2(sad.getMonth() + 1)}.${sad.getFullYear()} ${p2(sad.getHours())}:${p2(sad.getMinutes())}`;

export default defineConfig({
  base: './',
  define: { __VERZIJA__: JSON.stringify(VERZIJA) },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      manifest: {
        id: './',
        name: 'Evidencija psihologa',
        short_name: 'Evidencija',
        description: 'Evidencija rada školskog psihologa – radi offline, podaci ostaju na uređaju.',
        lang: 'bs',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'any',
        background_color: '#f6f3ee',
        theme_color: '#17556b',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
