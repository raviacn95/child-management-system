import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { visualizer } from 'rollup-plugin-visualizer'
import type { IndexHtmlTransformContext } from 'vite'
import { imagetools } from 'vite-imagetools'
import { compression } from 'vite-plugin-compression2'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vitest/config'

const root = fileURLToPath(new URL('.', import.meta.url))

const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "img-src 'self' data: https:",
  "connect-src 'self'",
  "frame-src 'self' https:",
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
].join('; ')

export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    imagetools(),
    compression({ algorithms: ['gzip', 'brotliCompress'], threshold: 1024 }),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.svg', 'offline.html', 'apple-touch-icon.png', 'privacy.html', 'icon-192.png', 'icon-512.png'],
      manifest: {
        id: '/child-management-system/',
        name: 'Willow Childcare',
        short_name: 'Willow',
        description: 'Childcare operations, parent learning hub, movies, and Fire TV living-room app',
        theme_color: '#1c6b57',
        background_color: '#f3eee6',
        display: 'standalone',
        display_override: ['standalone', 'minimal-ui'],
        start_url: './',
        scope: './',
        lang: 'en',
        categories: ['education', 'productivity', 'entertainment'],
        prefer_related_applications: false,
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          { name: 'TV tonight', short_name: 'TV', url: './#/tv' },
          { name: 'Get the app', short_name: 'Install', url: './#/get-app' },
        ],
      },
      workbox: {
        cacheId: 'willow-privacy-v1',
        globPatterns: ['**/*.{js,css,html,svg,woff2,json,png}'],
        globIgnores: ['**/releases/**', '**/*.apk'],
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/\.apk$/i, /\/downloads\//, /\/releases\//, /\/schemas\//],
      },
    }),
    {
      name: 'html-preload-and-csp',
      transformIndexHtml(html: string, ctx: IndexHtmlTransformContext) {
        if (ctx.server) return html
        return html.replace(
          '<head>',
          `<head>\n    <meta http-equiv="Content-Security-Policy" content="${CSP}">`,
        )
      },
    },
    mode === 'analyze'
      ? visualizer({ filename: 'dist/stats.html', gzipSize: true, brotliSize: true, open: false })
      : null,
  ].filter(Boolean),
  resolve: {
    alias: {
      '@': path.join(root, 'src'),
      '@components': path.join(root, 'src/components'),
      '@pages': path.join(root, 'src/pages'),
      '@lib': path.join(root, 'src/lib'),
      '@features': path.join(root, 'src/features'),
      '@data': path.join(root, 'src/data'),
      '@api': path.join(root, 'src/api'),
    },
  },
  server: {
    port: 5173,
    host: true,
    proxy: { '/qc-api': { target: 'http://127.0.0.1:8790', rewrite: (p: string) => p.replace(/^\/qc-api/, '') } },
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    },
  },
  build: {
    target: 'es2022',
    cssMinify: true,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return
          if (id.includes('react-router')) return 'router'
          if (id.includes('@tanstack')) return 'query'
          if (id.includes('i18next')) return 'i18n'
          if (id.includes('lucide')) return 'icons'
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
}))
