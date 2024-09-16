import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/auto-icons"],
  srcDir: "src",
  manifest: {
    default_locale: "en",
    name: "__MSG_name__",
    description: "__MSG_desc__",
  },
});
