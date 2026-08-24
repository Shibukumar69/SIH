import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// SamadhanSetu client — proxies /api to the Express backend in dev.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    // Keep the bundle lean for weak-network / rural users.
    chunkSizeWarningLimit: 900,
  },
})
