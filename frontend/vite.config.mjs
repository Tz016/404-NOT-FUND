import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],

  base: './',
  server: {
    proxy: {
      '/api': {
        target: 'https://981c4eefa734.ngrok-free.app',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        headers: { 'ngrok-skip-browser-warning': 'true' }
      }
    }
  }

})

