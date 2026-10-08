import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import components from "unplugin-vue-components/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";
import desktopConfig from "../../electrobun.config.ts";
import postcssConfig from "../../postcss.config.ts";
import { i18nPlugin } from "@toonflow/i18n/vite";

export default defineConfig({
  css: { postcss: postcssConfig },
  // ACT: 设置面板按需加载 Element Plus 组件；提前预构建这些入口，避免首次打开面板触发 Vite 整页刷新。
  optimizeDeps: {
    include: [
      "element-plus",
      "element-plus/es/components/alert/style/css",
      "element-plus/es/components/badge/style/css",
      "element-plus/es/components/card/style/css",
      "element-plus/es/components/collapse/style/css",
      "element-plus/es/components/collapse-item/style/css",
      "element-plus/es/components/color-picker/style/css",
      "element-plus/es/components/config-provider/style/css",
      "element-plus/es/components/container/style/css",
      "element-plus/es/components/dialog/style/css",
      "element-plus/es/components/dropdown/style/css",
      "element-plus/es/components/dropdown-item/style/css",
      "element-plus/es/components/dropdown-menu/style/css",
      "element-plus/es/components/empty/style/css",
      "element-plus/es/components/header/style/css",
      "element-plus/es/components/image/style/css",
      "element-plus/es/components/link/style/css",
      "element-plus/es/components/loading/style/css",
      "element-plus/es/components/main/style/css",
      "element-plus/es/components/option-group/style/css",
      "element-plus/es/components/pagination/style/css",
      "element-plus/es/components/popconfirm/style/css",
      "element-plus/es/components/popover/style/css",
      "element-plus/es/components/progress/style/css",
      "element-plus/es/components/radio-button/style/css",
      "element-plus/es/components/segmented/style/css",
      "element-plus/es/components/skeleton/style/css",
      "element-plus/es/components/skeleton-item/style/css",
      "element-plus/es/components/slider/style/css",
      "element-plus/es/components/space/style/css",
      "element-plus/es/components/table/style/css",
      "element-plus/es/components/table-column/style/css",
      "element-plus/es/components/tag/style/css",
      "element-plus/es/components/text/style/css",
      "element-plus/es/components/tree/style/css",
    ],
  },
  define: {
    "import.meta.env.appVersion": JSON.stringify(desktopConfig.app.version),
  },
  server: {
    proxy: {
      "/mcp": { target: "http://127.0.0.1:3000", changeOrigin: false },
      "/a2a": { target: "http://127.0.0.1:3000", changeOrigin: false },
      "/api": {
        target: "http://127.0.0.1:3000",
        changeOrigin: false,
        configure(proxy) {
          proxy.on("proxyReq", (request, incoming) => {
            request.setHeader("x-toonflow-local-client", ["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(incoming.socket.remoteAddress ?? "") ? "1" : "0");
          });
        },
      },
    },
  },
  resolve: {
    alias: [
      { find: "@", replacement: fileURLToPath(new URL("./src", import.meta.url)) },
      { find: /^shiki$/, replacement: fileURLToPath(new URL("./src/lib/shiki.ts", import.meta.url)) },
    ],
  },
  build: {
    outDir: "../../build/web",
    emptyOutDir: true,
  },
  plugins: [
    i18nPlugin(),
    vue(),
    components({
      globsExclude: ["src/components/settings/panels/**/*Dialog.vue"],
      dts: "src/types/components.d.ts",
      resolvers: [
        ElementPlusResolver(),
        (name) => {
          if (name.startsWith("Icon")) return { name, from: "@tabler/icons-vue" };
        },
      ],
    }),
  ],
});
