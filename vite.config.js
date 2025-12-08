import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Custom plugin for development cache busting
const devCacheBuster = () => {
  return {
    name: 'dev-cache-buster',
    configureServer(server) {
      // Add timestamp to all development asset URLs (except GeoJSON files)
      server.middlewares.use((req, res, next) => {
        if (req.url && !req.url.includes('?t=') && !req.url.includes('/@') && !req.url.endsWith('.geojson')) {
          const timestamp = Date.now();
          const separator = req.url.includes('?') ? '&' : '?';
          req.url = `${req.url}${separator}t=${timestamp}`;
        }
        next();
      });
    },
    transformIndexHtml(html) {
      // Add timestamp to script and link tags in development
      const timestamp = Date.now();
      return html
        .replace(/(<script[^>]+src=")([^"]*?)(")/g, `$1$2?t=${timestamp}$3`)
        .replace(/(<link[^>]+href=")([^"]*?)(")/g, `$1$2?t=${timestamp}$3`);
    }
  };
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), devCacheBuster()],
  root: "./",
  publicDir: "public",
  assetsInclude: ["**/*.wasm", "**/*.gltf", "**/*.glb", "**/*.czml", "**/*.geojson"],
  build: {
    outDir: "dist",
    sourcemap: true,
    rollupOptions: {
      external: ['cesium'],
      output: {
        globals: {
          cesium: 'Cesium'
        },
        // Force unique filenames for better cache busting
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    copyPublicDir: true,
  },
  server: {
    port: 5175,
    host: '0.0.0.0', // More explicit binding for Windows
    open: false, // Don't auto-open to avoid conflicts
    strictPort: true, // Fail if port is not available
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Last-Modified': new Date().toUTCString()
    },
    // Force reload on every request with timestamp-based cache busting
    middlewareMode: false,
    // Proxy API requests to backend server
    proxy: {
      "/api": {
        target: process.env.VITE_API_BASE_URL || "http://localhost:3002",
        changeOrigin: true,
        secure: false,
      },
      "/ws": {
        target: process.env.VITE_WS_BASE_URL || "ws://localhost:3002",
        ws: true,
      },
    },
    fs: {
      // Allow serving files from one level up to the project root
      allow: [".."],
    },
  },
  css: {
    postcss: "./postcss.config.js",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src/frontend"),
      "@components": path.resolve(__dirname, "./src/frontend/components"),
      "@services": path.resolve(__dirname, "./src/frontend/services"),
      "@hooks": path.resolve(__dirname, "./src/frontend/hooks"),
      "@utils": path.resolve(__dirname, "./src/frontend/utils"),
      "@shared": path.resolve(__dirname, "./src/shared"),
    },
  },
  define: {
    // Fallback for any remaining process.env references
    "process.env": {},
  },
});
