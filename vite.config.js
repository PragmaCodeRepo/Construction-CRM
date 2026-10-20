import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const modulePath = id.replaceAll('\\', '/')
          if (/\/node_modules\/(recharts|d3-[^/]+|victory-vendor|react-smooth)\//.test(modulePath)) return 'charts'
          if (/\/node_modules\/(react|react-dom|react-router|react-router-dom|scheduler|@remix-run)\//.test(modulePath)) return 'framework'
          if (modulePath.includes('/node_modules/lucide-react/')) return 'icons'
        },
      },
    },
  },
})
