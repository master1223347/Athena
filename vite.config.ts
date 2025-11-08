
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    port: 8080,
    proxy: {
      '/canvas-api': {
        target: 'https://ucsc.instructure.com', 
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/canvas-api/, ''),
      },
    }
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
