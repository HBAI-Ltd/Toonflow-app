import logger from "morgan";
import express from "express";
import cors from "cors";
import { dirname, resolve } from "node:path";
import { lstat, readdir, unlink } from "@toonflow/file";
import type { Request, Response, NextFunction } from "express";
import buildRoute from "@/core";
import { errorFromCause } from "@/lib/responseFormat";
import desktopRequest from "@/lib/desktop";
import { getRuntimePlatform } from "@/lib/platform";
import initializePlugins from "@/utils/plugins/initialize";
import directoryRevision from "@/utils/plugins/directoryRevision";
import { initializeAccess, accessRequest } from "@/utils/access";
import { languageRequest, resolveRequestLocale, runWithLocale, setLocaleFallback, translateError, translateMessage } from "@/lib/i18n";
import { detectLocale, normalizeLocale } from "@toonflow/i18n";

const autoInstallProviders = ["apiMart.ts", "metaso.ts", "compshare.ts", "volcengine.ts", "grsai.ts"];

export async function createApp({
  webRoot,
  appVersion = "",
  dataDirectory,
  toolsRoot,
  nodesRoot,
  extRoot,
  providersRoot,
  skillsRoot,
  agentsRoot,
  pluginRevision,
}: {
  webRoot: string;
  appVersion?: string;
  dataDirectory?: string;
  toolsRoot?: string;
  nodesRoot?: string;
  extRoot?: string;
  providersRoot?: string;
  skillsRoot?: string;
  agentsRoot?: string;
  pluginRevision?: string;
}) {
  // conf 由下方的路由动态加载，必须先确定整个进程共用的数据目录。
  if (dataDirectory) process.env.TOONFLOW_DATA_DIR = resolve(dataDirectory);
  const { default: conf } = await import("@/utils/conf");
  const accessEnabled = await initializeAccess(dirname(conf.path));
  const providerDirectory = resolve(dirname(conf.path), "providers");
  const providerDirectoryInfo = await lstat(providerDirectory).catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") return null;
    throw error;
  });
  if (providerDirectoryInfo) {
    if (providerDirectoryInfo.isSymbolicLink() || !providerDirectoryInfo.isDirectory()) throw new Error("供应商目录不能是符号链接或文件");
    // ACT: 仅迁移清理已移除的内置适配文件；不递归删除目录，不改其他用户供应商。
    for (const file of await readdir(providerDirectory, { withFileTypes: true })) {
      if (file.name.toLowerCase() !== "tfrouter.ts" || (!file.isFile() && !file.isSymbolicLink())) continue;
      await unlink(resolve(providerDirectory, file.name)).catch((error: NodeJS.ErrnoException) => {
        if (error.code !== "ENOENT") throw error;
      });
    }
  }
  const { initializeNetwork } = await import("@/utils/network");
  await initializeNetwork();
  setLocaleFallback(() => normalizeLocale((conf.get("settings", {}).ui as { language?: unknown } | undefined)?.language)
    ?? detectLocale([Intl.DateTimeFormat().resolvedOptions().locale]));
  if (dataDirectory && toolsRoot) {
    const toolPattern = /^[a-z][a-zA-Z0-9]*\.tool\.js$/;
    // 独立 server 按内置工具内容更新数据卷，避免 Docker 重建后新增或更新的工具不生效。
    const toolRevision = pluginRevision ?? await directoryRevision(toolsRoot, toolPattern);
    await initializePlugins(resolve(dataDirectory, "tools"), toolsRoot, toolPattern, toolRevision);
  }
  if (dataDirectory && nodesRoot) {
    const nodePattern = /^[a-z][a-zA-Z0-9]*\.umd\.js$/;
    // 独立 server 按内置节点内容更新数据卷，避免 Docker 重建后仍加载旧节点。
    const nodeRevision = pluginRevision ?? await directoryRevision(nodesRoot, nodePattern);
    await initializePlugins(resolve(dataDirectory, "nodes"), nodesRoot, nodePattern, nodeRevision);
  }
  if (dataDirectory && extRoot) {
    const { default: initializeExt } = await import("@/utils/plugins/initializeExt");
    await initializeExt(resolve(dataDirectory, "ext"), extRoot, pluginRevision);
  }
  // ACT: 内置媒体供应商随构建同步，其他供应商文件和独立保存的配置保留。
  if (dataDirectory && providersRoot) {
    const sourceDirectory = resolve(providersRoot, "media");
    const providerRevision = pluginRevision ?? await directoryRevision(sourceDirectory, autoInstallProviders);
    await initializePlugins(resolve(dataDirectory, "providers"), sourceDirectory, autoInstallProviders, providerRevision);
  }
  // ACT: 技能和团队只补首次安装，保留用户修改。
  if (dataDirectory && skillsRoot) await initializePlugins(resolve(dataDirectory, "skills"), skillsRoot);
  if (dataDirectory && agentsRoot) await initializePlugins(resolve(dataDirectory, "agents"), agentsRoot);
  const app = express();
  app.locals.appVersion = appVersion;
  // ACT: 内置身份取自当前发行包的目录，不依赖作者或安装记录；更新后的同名插件仍属于内置插件。
  app.locals.builtinPlugins = Object.fromEntries(await Promise.all(
    Object.entries({ tool: toolsRoot, node: nodesRoot, ext: extRoot, skill: skillsRoot, agent: agentsRoot }).map(async ([type, root]) => {
      const entries = root ? await readdir(root, { withFileTypes: true }).catch((error: NodeJS.ErrnoException) => {
        if (error.code === "ENOENT") return [];
        throw error;
      }) : [];
      const pattern = type === "tool" ? /^[a-z][a-zA-Z0-9]*\.tool\.js$/ : type === "ext" ? /^ext-[a-z][a-zA-Z0-9]*\.umd\.js$/ : /^[a-z][a-zA-Z0-9]*\.umd\.js$/;
      const names = entries.filter(entry => type === "skill" || type === "agent" ? entry.isDirectory() : entry.isFile() && pattern.test(entry.name))
        .map(entry => entry.isDirectory() ? entry.name : entry.name.replace(/\.(?:tool|umd)\.js$/, ""));
      return [type, new Set(names)];
    }),
  ));

  if (getRuntimePlatform().development) {
    await buildRoute();
    app.use(logger("dev"));
  }
  app.use(languageRequest);
  if (accessEnabled) {
    if (process.env.TOONFLOW_TRUST_PROXY) app.set("trust proxy", process.env.TOONFLOW_TRUST_PROXY.split(",").map(value => value.trim()));
    const [{ isMobileLinkRequest, isMobilePairingRequest }, { authorizeMcp, getAppOrigin }, { authenticateA2a }] = await Promise.all([
      import("@/utils/mobileLink"), import("@/utils/mcp/control"), import("@/agent/a2a/settings"),
    ]);
    app.use((req, res, next) => {
      if (isMobileLinkRequest(req) || isMobilePairingRequest(req)) return next();
      if (/^\/mcp(\/|$)/i.test(req.path) && authorizeMcp(req)) return next();
      if (/^\/a2a(\/|$)/i.test(req.path) && authenticateA2a(req)) return next();
      accessRequest(req, res, () => {
        if (!["GET", "HEAD", "OPTIONS"].includes(req.method) || req.get("origin")) getAppOrigin(req);
        next();
      });
    });
  }
  app.use(cors());
  // 登录表单先使用较小的限制，避免落入业务接口的 100 MB 解析器。
  app.use("/api/access/login", express.urlencoded({ extended: false, limit: "16kb" }), express.json({ limit: "16kb" }));
  app.use("/a2a", express.json({ limit: "2mb" }));
  app.use(["/api/workspaces/files/write", "/api/assets/save"], express.raw({ type: "application/octet-stream", limit: "100mb" }));
  app.use(express.json({ limit: "100mb" }));
  app.use(express.urlencoded({ extended: true, limit: "100mb" }));
  app.use("/api/desktop", desktopRequest);

  const router = await import("@/router");
  router.default(app);
  const [{ createMcpRouter }, { getMcpTools }, { authorizeMcp }, { skillResources }] = await Promise.all([
    import("@toonflow/mcp"),
    import("@/utils/mcp/tools"),
    import("@/utils/mcp/control"),
    import("@/utils/mcp/resources"),
  ]);
  app.use("/mcp", createMcpRouter({ getTools: getMcpTools, authorize: authorizeMcp, resources: skillResources,
    runInRequest: (request, operation) => runWithLocale(resolveRequestLocale(request.get("accept-language")), operation),
    translate: translateMessage,
    translateError,
  }));
  const { createA2aRouter } = await import("@/agent/a2a");
  app.use("/a2a", createA2aRouter());
  app.use(express.static(webRoot));

  // 错误处理
  app.use((err: Error & { status?: number }, request: Request, response: Response, next: NextFunction) => {
    if (response.headersSent) return next(err);
    console.error(err);
    const body = errorFromCause(err);
    response.status(body.code).json(body);
  });

  const { initializeMobileLinkRuntime } = await import("@/utils/mobileLink");
  initializeMobileLinkRuntime(app);
  return app;
}
