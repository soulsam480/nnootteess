import path, { resolve } from "node:path";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";
import icons from "unplugin-icons/vite";
import vueDevTools from "vite-plugin-vue-devtools";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  root: resolve(import.meta.dirname, "apps/web"),
  resolve: {
    alias: {
      "@": `${path.resolve(import.meta.dirname, "src")}`,
    },
  },
  publicDir: "../../public",
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, "apps/web/index.html"),
      },
    },
  },
  plugins: [
    vue(),
    icons({
      compiler: "vue3",
      autoInstall: true,
    }),
    vueDevTools(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "mask-icon.svg"],
      workbox: {
        globPatterns: ["**/*.{js,css,html,json,svg,png,ico,wasm,sqlite}"],
        // 20 MB
        maximumFileSizeToCacheInBytes: 20 * 1000 * 1000,
      },
      manifest: {
        name: "NNOOTTEESS",
        short_name: "NNOOTTEESS",
        description: "P2P synced and E2E encrypted note taking app",
        theme_color: "#6307E4",
        background_color: "#6307E4",
        icons: [
          ...[48, 128, 192, 512].map((size) => {
            return {
              src: `icon-${size}.png`,
              sizes: `${size}x${size}`,
              type: "image/png",
            };
          }),
        ],
      },
    }),
  ],
  server: {
    allowedHosts: ["nnootteess.test"],
  },
});
