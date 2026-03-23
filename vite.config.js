import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueJsx from "@vitejs/plugin-vue-jsx";
import vueDevTools from "vite-plugin-vue-devtools";

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueJsx(), vueDevTools()],
  define: {
    global: "window",
  },
  server: {
    port: 5173,
    strictPort: true,
    host: true,
    proxy: {
      "/api": {
        // target: "http://112.124.23.138:8080",
         target: "http://192.168.0.121:8080",
        changeOrigin: true,
        secure: false,
        ws: true,
        rewrite: (path) => {
          if (path.startsWith("/api/v1")) return path;
          return path.replace(/^\/api/, "/api/v1");
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
