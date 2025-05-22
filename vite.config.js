import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
/*   server: {
    proxy: {
      '/api': { // Any request starting with /api
        target: 'http://localhost:5000', // Will be forwarded to your backend
        changeOrigin: true, // Needed for virtual hosting sites
        secure: false, // For development with http
        ws: true, // Enable websocket proxying (if you use websockets)
      },
    },
  }, */
})
