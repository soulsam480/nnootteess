import { createApp } from "vue";
import App from "@/App.vue";
import "@milkdown/crepe/theme/common/style.css";
import "@/milkdown-one-dark.css";
import "mdst-ui/dist/modest-ui.css";
import "mdst-ui/base/reset.css";
import "@/theme.css";
import "@/storage/db";
import { tryRecoverAndLogin } from "@/storage/user";
import { LocalStorage } from "@/storage/local";

export function boot(storage: LocalStorage) {
  function mountApp() {
    const container = document.querySelector("#app");

    if (!container) {
      return;
    }

    const app = createApp(App, { storage });
    app.mount(container);
  }

  tryRecoverAndLogin(storage).then(mountApp);
}
