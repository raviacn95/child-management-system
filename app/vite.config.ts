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
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: https:",
  "connect-src 'self'",
  "frame-src https://www.youtube-nocookie.com https://www.youtube.com",
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
      includeAssets: ['favicon.svg', 'offline.html', 'apple-touch-icon.png', 'privacy.html'],
      manifest: {
        id: '/child-management-system/',
        name: 'Willow Childcare',
        short_name: 'Willow',
        description: 'Childcare operations, parent learning hub, and Willow Mart',
        theme_color: '#1c6b57',
        background_color: '#f3eee6',
        display: 'standalone',
        start_url: './',
        scope: './',
        lang: 'en',
        categories: ['education', 'productivity'],
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff2,json}'],
        navigateFallback: 'index.html',
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
