import { resolve } from "node:path";
import { createApp } from "./app";
import config from "../../../electrobun.config";

const startTime = Date.now();
const realPort = Number(process.env.TOONFLOW_SERVER_PORT || 3000);
if (!Number.isInteger(realPort) || realPort < 1 || realPort > 65535) throw new Error("TOONFLOW_SERVER_PORT 必须是 1–65535 之间的整数");
// 源码位于 apps/server/src，生产构建位于 build/server，均从文件位置定位根目录。
const fromSource = import.meta.path.endsWith(".ts");
const appDirectory = resolve(import.meta.dirname, fromSource ? "../../.." : "../..");
const dataDirectory = process.env.TOONFLOW_DATA_DIR ?? resolve(appDirectory, "data");
const app = await createApp({
  webRoot: resolve(appDirectory, "build/web"),
  appVersion: config.app.version,
  dataDirectory,
  toolsRoot: resolve(appDirectory, "build/tools"),
  nodesRoot: resolve(appDirectory, "build/nodes"),
  extRoot: resolve(appDirectory, "build/ext"),
  // ACT: 暂不安装内置团队，随团队打包一同恢复。
  // agentsRoot: resolve(appDirectory, "build/agents"),
  skillsRoot: resolve(appDirectory, fromSource ? "packages/skills" : "build/skills"),
  // ACT: 构建产物按应用版本同步内置插件，补齐旧数据目录缺少的新内置工具；同版本重复构建不会再次同步，需要时改用构建哈希。
  pluginRevision: fromSource ? undefined : config.app.version,
});
const { initializeMcpRuntime } = await import("./utils/mcp/runtime");
const { startAutomations, stopAutomations } = await import("./agent/runtime/automations");
const { startMobileLinkRuntime } = await import("./utils/mobileLink");
const { startMultiTenantRuntime } = await import("./utils/multiTenant");
await startMultiTenantRuntime(app);
const server = app.listen(realPort, async (error?: Error) => {
  if (error) throw error;
  await initializeMcpRuntime(app, `http://127.0.0.1:${realPort}`, resolve(appDirectory, fromSource ? "packages/mcp/src/stdio.ts" : "build/mcp/stdio.js"));
  await startMobileLinkRuntime(app).catch(error => console.error("设备互联启动失败：", error));
  startAutomations();
  console.log(`[服务启动成功]: http://localhost:${realPort}`);
  console.log(`[启动耗时]: ${(Date.now() - startTime).toFixed(2)}ms`);
});

async function shutdown() {
  server.close();
  await stopAutomations();
  process.exit(0);
}
process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
