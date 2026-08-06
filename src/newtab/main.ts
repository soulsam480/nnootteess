import { createApp } from "vue";
import App from "./App.vue";
import "@milkdown/crepe/theme/common/style.css";
import "@milkdown/crepe/theme/nord-dark.css";
import "mdst-ui/dist/modest-ui.css";
import "mdst-ui/base/reset.css";
import "@/theme.css";
import "@/storage/db";
import { tryRecoverAndLogin } from "@/storage/user";

function mountApp() {
  const container = document.querySelector("#app");

  if (!container) {
    return;
  }

  const app = createApp(App);
  app.mount(container);
}

tryRecoverAndLogin().then(mountApp);
