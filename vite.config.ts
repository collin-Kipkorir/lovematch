import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
   server: {
    host: "::",
    port: 8080,
    proxy: {
      '/api/payhero': {
        target: 'https://backend.payhero.co.ke/api/v2',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/payhero/, ''),
        secure: true,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      }
    }
  },
  base: '/',
  resolve: {
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json'],
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: undefined,
        inlineDynamicImports: false,
      },
    },
    sourcemap: true,
  },
  plugins: [
    react(),
    // Temporarily disabled due to dependency issues
    // mode === 'development' && componentTagger(),
  ].filter(Boolean),
}));
