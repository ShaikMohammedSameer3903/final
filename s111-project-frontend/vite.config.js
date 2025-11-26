import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
const target = process.env.API_PROXY_TARGET || 'http://localhost:8087'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target,
        changeOrigin: true,
      },
    },
  },
})
