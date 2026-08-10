import { defineManifest } from "@crxjs/vite-plugin";
import pkg from "./package.json" with { type: "json" };

export default defineManifest({
  manifest_version: 3,
  name: process.env.NODE_ENV === "development" ? `${pkg.name}-dev` : pkg.name,
  version: pkg.version,
  icons: {
    16: "public/icon-16.png",
    32: "public/icon-32.png",
    48: "public/icon-48.png",
    128: "public/icon-128.png",
  },
  chrome_url_overrides: {
    newtab: "apps/extension/index.html",
  },
  permissions: ["storage"],
});
