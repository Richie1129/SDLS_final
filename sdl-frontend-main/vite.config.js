import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
// https://vitejs.dev/config/
export default defineConfig({
  server:{
    host:"0.0.0.0",
    port:5173,
    hmr: {
      overlay: false, // ← 關閉錯誤覆蓋畫面，避免干擾開發
    },
  },
  watch: {
    usePolling: true
  },
  plugins: [
    react(),
    nodePolyfills({
      // Whether to polyfill `node:` protocol imports.
      protocolImports: true,
    })
  ],
  
})
