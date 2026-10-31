import { fileURLToPath } from "node:url";
import { basename } from "node:path";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import components from "unplugin-vue-components/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";
import desktopConfig from "../../electrobun.config.ts";
import postcssConfig from "../../postcss.config.ts";
import { i18nPlugin } from "@toonflow/i18n/vite";

const serverOrigin = `http://127.0.0.1:${process.env.TOONFLOW_SERVER_PORT || 3000}`;

export default defineConfig(({ command }) => ({
  css: { postcss: postcssConfig },
  define: {
    "import.meta.env.appVersion": JSON.stringify(desktopConfig.app.version),
  },
  server: {
    proxy: {
      "/mcp": { target: serverOrigin, changeOrigin: false },
      "/a2a": { target: serverOrigin, changeOrigin: false },
      "/api": {
        target: serverOrigin,
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
    {
      name: "externalDependencySourcemaps",
      apply: "serve",
      enforce: "post",
      transform(code, id) {
        if (this.environment.mode !== "dev" || this.environment.config.consumer !== "client"
          || !this.environment.depsOptimizer?.isOptimizedDepFile(id)) return;
        // ACT: Vite 8 的大型内联映射会卡死 Edge DevTools；复用现有 .map 路由，上游修复后移除。
        return { code: `${code}\n//# sourceMappingURL=${basename(id.split("?")[0])}.map`, map: { mappings: "" } };
      },
    },
    i18nPlugin(),
    vue(),
    components({
      globsExclude: ["src/components/settings/panels/**/*Dialog.vue"],
      // ACT: 声明由开发服务生成，避免 dev 与 build 并行抢写同一源码文件。
      dts: command === "serve" ? "src/types/components.d.ts" : false,
      resolvers: [
        ElementPlusResolver(),
        (name) => {
          if (name.startsWith("Icon")) return { name, from: "@tabler/icons-vue" };
        },
      ],
    }),
  ],
}));
