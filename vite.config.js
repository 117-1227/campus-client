import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const PROXY_TARGET = 'http://192.168.10.100:3000'

export default defineConfig({
  plugins: [react()],
  define: {
    __PROXY_TARGET__: JSON.stringify(PROXY_TARGET),
  },
  server: {
    port: 5173,
    proxy: { '/api': { target: PROXY_TARGET, changeOrigin: true } },
  },
})
