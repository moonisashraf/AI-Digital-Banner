import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// ... existing code ...
export default defineConfig({
  plugins: [react()],
  server: {
    port: process.env.PORT || 3000,
    host: true,
  },
  build: {
    outDir: 'dist', // Ensure the output directory is set
  },
  preview: {
    allowedHosts: ['ai-digital-banner.onrender.com'], // Allow the specified host
  },
})
// ... existing code ...
