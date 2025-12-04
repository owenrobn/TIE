import { defineConfig } from "vite";
import dyadComponentTagger from "@dyad-sh/react-vite-component-tagger";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
    proxy: { // Add proxy configuration here
      '/api': {
        target: 'http://localhost:3000', // Your Express server runs on port 3000
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api'), // Keep the /api prefix for the backend
      },
    },
  },
  plugins: [dyadComponentTagger(), react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));