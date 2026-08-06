import path from "node:path";
import { crx } from "@crxjs/vite-plugin";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";
import zip from "vite-plugin-zip-pack";
import manifest from "./manifest.config.ts";
import { name, version } from "./package.json" with { type: "json" };
import icons from "unplugin-icons/vite";
import vueDevTools from "vite-plugin-vue-devtools";

export default defineConfig({
  resolve: {
    alias: {
      "@": `${path.resolve(import.meta.dirname, "src")}`,
    },
  },
  plugins: [
    vue(),
    crx({ manifest }),
    zip({
      outDir: "release",
      outFileName: `crx-${name}-${version}.zip`,
    }),
    icons({
      compiler: "vue3",
      autoInstall: true,
    }),
    vueDevTools(),
  ],
  server: {
    cors: {
      origin: [/chrome-extension:\/\//],
    },
  },
});
