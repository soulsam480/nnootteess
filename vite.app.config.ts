import path, { resolve } from "node:path";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";
import icons from "unplugin-icons/vite";
import vueDevTools from "vite-plugin-vue-devtools";

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
  ],
  server: {
    allowedHosts: ["nnootteess.test"],
  },
});
