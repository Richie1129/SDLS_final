import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
// https://vitejs.dev/config/
export default defineConfig({
  server:{
    host:"0.0.0.0",
    port:5173,
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
