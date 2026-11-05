import { Router } from "express";
import { lstat, mkdir, mkdtemp, realpath, rm } from "@toonflow/file";
import { dirname, join } from "node:path";
import { z } from "zod";
import u from "@/utils";
import { validateFields } from "@/lib/middleware";
import { success } from "@/lib/responseFormat";
import { isMultiUser } from "@/utils/accounts/context";
import { storageUsage } from "@/utils/hosting/storage";
import { runTask } from "@/utils/hosting/tasks";

const inputSchema = z.strictObject({
  directory: z.string().min(1).max(4096),
  url: z.string().min(1).max(16384),
  name: z.string().trim().min(1).max(200),
});

export default Router().post("/", validateFields(inputSchema.shape), async (req, res) => {
  u.mcpControl.assertAppRequest(req);
  const input = inputSchema.parse(req.body);
  const parent = await u.workspace.resolveWorkspace(req, input.directory);
  const controller = new AbortController();
  const close = () => { if (!res.writableFinished) controller.abort(new Error("项目克隆已取消")); };
  res.once("close", close);
  req.once("aborted", close);
  req.socket.once("close", close);
  let signal = AbortSignal.any([controller.signal, AbortSignal.timeout(300000)]);
  let directory: string | undefined;
  let created: Awaited<ReturnType<typeof lstat>> | undefined;
  let release: (() => void) | undefined;
  await runTask({ kind: "import", directory: parent, signal }, async taskSignal => {
  signal = taskSignal;
  try {
    // ACT: 托管导入与生成共用并发槽，输入和展开内容均不超过100MiB；更大项目需改为流式解压。
    const usage = isMultiUser() ? await storageUsage() : undefined;
    const maxBytes = usage ? Math.min(100 * 1024 ** 2, usage.limitBytes - usage.usedBytes) : 512 * 1024 ** 2;
    if (maxBytes <= 0) throw Object.assign(new Error("账户存储配额不足"), { status: 507 });
    const bytes = await u.workspaceDownload.downloadPublicFile(input.url, { signal, maxBytes, label: "项目包", httpsOnly: true });
    signal.throwIfAborted();
    let files: Map<string, Uint8Array>;
    try { files = u.pluginInstall.skillZip(bytes, { maxBytes, maxEntries: 20000 }); }
    catch (error) {
      if (error instanceof Error) error.message = error.message.replaceAll("技能", "项目").replaceAll("插件", "项目");
      throw error;
    }
    const paths = [...files.keys()];
    const hasCanvas = paths.some(path => {
      const content = files.get(path)!;
      // ACT: 只解析非素材目录内不超过 20 MB 的画布候选；包内所有文件仍原样保存，避免为识别项目解析超大 JSON。
      if (path.split("/").some(part => part.toLowerCase() === "assets") || !/\.json$/i.test(path) || content.byteLength > 20 * 1024 * 1024) return false;
      try {
        const canvas = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(content));
        if (canvas?.toonflowCanvas !== true || !Array.isArray(canvas.nodes) || !Array.isArray(canvas.edges) || !canvas.viewport
          || ![canvas.viewport.x, canvas.viewport.y, canvas.viewport.zoom].every(Number.isFinite) || canvas.viewport.zoom <= 0) return false;
        const nodeIds = new Set<string>();
        for (const node of canvas.nodes) {
          if (!node || typeof node.id !== "string" || !node.id || nodeIds.has(node.id)) return false;
          nodeIds.add(node.id);
        }
        return canvas.edges.every((edge: { source?: unknown; target?: unknown }) => edge
          && typeof edge.source === "string" && typeof edge.target === "string" && nodeIds.has(edge.source) && nodeIds.has(edge.target));
      } catch { return false; }
    });
    if (!hasCanvas) throw Object.assign(new Error("项目包必须包含有效的 Toonflow 画布 JSON 文件"), { status: 400 });
    signal.throwIfAborted();
    let name = input.name.replace(/[<>:"/\\|?*\x00-\x1f]/g, "_").replace(/[. ]+$/, "").slice(0, 80);
    if (!name || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(name)) name = "Toonflow";
    directory = await mkdtemp(join(parent, `${name}-`));
    created = await lstat(directory);
    if (!u.workspaceFile.isWithin(parent, await realpath(directory))) throw new Error("项目下载目录超出所选位置");
    release = u.workspaceFile.lockWorkspaceFiles([directory]);
    for (const [path, content] of files) {
      signal.throwIfAborted();
      const candidate = await u.workspaceFile.resolveWorkspacePath(directory, path, true);
      await mkdir(dirname(candidate.path), { recursive: true });
      const target = await u.workspaceFile.resolveWorkspacePath(directory, path);
      await u.workspaceFile.writeWorkspaceFile(target.path, content, true);
    }
    signal.throwIfAborted();
    res.json(success({ directory }));
  } catch (error) {
    if (directory && created) {
      try {
        const current = await lstat(directory);
        const actual = await realpath(directory);
        if (current.isSymbolicLink() || current.ino !== created.ino || current.dev !== created.dev
          || actual !== directory || !u.workspaceFile.isWithin(parent, actual) || directory === parent) throw new Error("项目目录已变更，未自动删除");
        await rm(directory, { recursive: true });
      } catch (cleanupError) {
        throw new Error(`项目克隆失败，未能清理下载目录 ${directory}：${cleanupError instanceof Error ? cleanupError.message : "请检查目录权限"}`, { cause: error });
      }
    }
    if (signal.aborted && !controller.signal.aborted) throw Object.assign(new Error("项目克隆超时（5 分钟），请检查网络后重试", { cause: error }), { status: 504 });
    throw error;
  } finally {
    release?.();
    res.off("close", close);
    req.off("aborted", close);
    req.socket.off("close", close);
  }
  });
});
