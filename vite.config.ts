import path from 'path'
import { fileURLToPath } from 'url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) {
            return undefined
          }
          if (id.includes("node_modules/@radix-ui")) {
            return "radix-ui"
          }
          if (id.includes("node_modules/@dnd-kit")) {
            return "dnd-kit"
          }
          if (id.includes("node_modules/date-fns")) {
            return "date-fns"
          }
          if (id.includes("node_modules/html-to-image")) {
            return "html-to-image"
          }
          if (id.includes("node_modules/lucide-react")) {
            return "lucide"
          }
          if (id.includes("node_modules/zustand")) {
            return "zustand"
          }
          if (id.includes("node_modules/tailwind-merge")) {
            return "tailwind-merge"
          }
          return "vendor"
        },
      },
    },
  },
})
