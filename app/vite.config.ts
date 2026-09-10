import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  server: { port: 5173, host: true, proxy: { '/qc-api': { target: 'http://127.0.0.1:8790', rewrite: (p) => p.replace(/^\/qc-api/, '') } } },
})
