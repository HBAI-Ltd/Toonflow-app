import { createHash } from "node:crypto";
import { z } from "zod";
import type { ToolContext, ToolDefinition, ToolPlugin } from "@toonflow/tools-scaffold/runtime";
import { evaluateKiln, getKilnRuntime, prepareKiln, type KilnHost, type KilnRenderResult } from "./kilnRuntime";
import { validateSourcePolicy } from "./sourcePolicy";

const operationNames = ["kiln_discover", "kiln_validate", "kiln_source", "kiln_edit", "kiln_render", "kiln_inspect", "kiln_screenshot_animation", "kiln_view_interior"] as const;
const sourcePrefix = "assets/trumanMap/kiln/source";
const modelsPrefix = "assets/trumanMap/kiln/models";
const deliveriesPrefix = "assets/trumanMap/kiln/deliveries";
const sourcePattern = /^assets\/trumanMap\/kiln\/source\/program([a-f0-9]{64})\.mjs$/;
const referencePattern = /^sha256:([a-f0-9]{64})$/;
const toolInput = z.strictObject({ name: z.enum(["schemas", ...operationNames]), args: z.record(z.string(), z.json()).default({}) });
const exportInput = z.strictObject({ programRef: z.string().regex(referencePattern), name: z.string().trim().min(1).max(160).optional(), programId: z.uuid().optional() });

function textResult(value: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(value) }], details: value };
}

function sourceHash(code: string) { return createHash("sha256").update(code, "utf8").digest("hex"); }

function sourcePath(reference: string) {
  const match = referencePattern.exec(reference);
  if (!match) throw new Error("请使用 Kiln 返回的完整 sha256 programRef");
  return `${sourcePrefix}/program${match[1]}.mjs`;
}

function createProgramStore(context: ToolContext) {
  return {
    retention: "immutable source revisions saved in this Toonflow workspace; never automatically deleted",
    async put(code: string) {
      const runtime = await getKilnRuntime();
      validateSourcePolicy(code, runtime.helperNames);
      const reference = `sha256:${sourceHash(code)}`;
      const path = sourcePath(reference);
      await context.files.mkdir(sourcePrefix, true);
      try { await context.files.writeFile(path, code, true); }
      catch (error) {
        const reason = error as { code?: string; status?: number };
        if (reason.code !== "EEXIST" && reason.status !== 409) throw error;
        const existing = await context.files.readFile(path, true, { maxBytes: 64 * 1024 });
        if (existing.toString("utf8") !== code) throw new Error("同名源码修订内容不一致，未覆盖已有文件");
      }
      return reference;
    },
    async get(reference: string) {
      const code = (await context.files.readFile(sourcePath(reference), true, { maxBytes: 64 * 1024 })).toString("utf8");
      if (`sha256:${sourceHash(code)}` !== reference) throw new Error("源码修订与 programRef 不一致，请重新读取真实修订");
      return code;
    },
  };
}

const plugin: ToolPlugin = {
  validateConfig(config) {
    if (Object.keys(config).length) throw new Error("TrumanMap Kiln 工具没有额外配置项，模型与密钥使用 Toonflow Agent 配置");
    return {};
  },
  createTools(context) {
    const store = createProgramStore(context);
    const artifacts = new Map<string, { rendered: KilnRenderResult; reviewed: boolean; cacheKey?: string }>();
    let artifactBytes = 0;
    let host: Promise<KilnHost> | undefined;
    function rememberArtifact(reference: string, rendered: KilnRenderResult, cacheKey?: string) {
      const previous = artifacts.get(reference);
      if (previous) artifactBytes -= previous.rendered.glb.byteLength;
      artifacts.delete(reference);
      artifacts.set(reference, { rendered, reviewed: false, cacheKey });
      artifactBytes += rendered.glb.byteLength;
      // ACT: 同一会话只保留4份/32MiB精确构建；编译复用和导出共用这份预算，不另存一套GLB。
      while (artifacts.size > 4 || artifactBytes > 32 * 1024 * 1024) {
        const oldest = artifacts.keys().next().value!;
        artifactBytes -= artifacts.get(oldest)!.rendered.glb.byteLength;
        artifacts.delete(oldest);
      }
    }
    function getHost() {
      host ??= getKilnRuntime().then(runtime => runtime.mcp.createKilnToolHost({
        programStore: store,
        readSourceFile: async (path: string) => {
          const match = sourcePattern.exec(path);
          if (!match) throw new Error("只读取当前工作区内 Kiln 保存的不可变源码路径");
          return store.get(`sha256:${match[1]}`);
        },
        evaluatorProfile: "evaluator-required",
        evaluatorPort: { render: async (...args: Parameters<typeof evaluateKiln>) => {
          args[2]?.signal?.throwIfAborted();
          validateSourcePolicy(args[0], runtime.helperNames);
          const reference = `sha256:${sourceHash(args[0])}`;
          const previous = artifacts.get(reference);
          // 官方wrapper会拒绝Math.random等环境输入、核对构建选项/限制并检查取消；命中仅复用同一GLB。
          const evaluator = runtime.cache.createCachedEvaluatorPort({ render: evaluateKiln }, {
            identity: () => "toonflowKiln1.6.0:strict:instanceOff",
            cache: {
              async get(key) {
                const artifact = artifacts.get(reference);
                if (artifact?.cacheKey !== key) return;
                artifacts.delete(reference);
                artifacts.set(reference, artifact);
                return artifact.rendered;
              },
              async put(key, rendered) { rememberArtifact(reference, rendered, key); },
            },
          });
          try {
            const rendered = await evaluator.render(...args);
            args[2]?.signal?.throwIfAborted();
            // 被官方判为不可复用的构建仍可按原规则审阅和导出，不能把旧修订的reviewed带过来。
            if (!rendered.buildCache || artifacts.get(reference)?.cacheKey !== rendered.buildCache.key) rememberArtifact(reference, rendered);
            return rendered;
          } catch (error) {
            const current = artifacts.get(reference);
            if (args[2]?.signal?.aborted && current && current !== previous) {
              artifactBytes -= current.rendered.glb.byteLength;
              artifacts.delete(reference);
            }
            throw error;
          }
        } },
        evaluatorCacheManaged: true,
        cacheCaptures: true,
        captureCache: new runtime.views.MemoryCaptureCache(16 * 1024 * 1024),
        captureLimits: { maxTotalPixels: 3 * 1024 * 1024, maxOutputBytes: 6 * 1024 * 1024 },
      })).catch(error => { host = undefined; throw error; });
      return host;
    }
    const tools: ToolDefinition[] = [{
      name: "kilnPrepare",
      label: "准备 Holodeck / Kiln 运行环境",
      description: "显式准备固定 @instruktlabs/kiln 1.6.0 服务端运行环境。首次下载依赖到插件私有 pluginResources；不写作品、不删除文件。需要 Node.js 22.2+。通常每次安装或升级插件只需调用一次；未就绪时先调用此工具再调用 kilnTool。",
      parameters: z.toJSONSchema(z.strictObject({})),
      executionMode: "sequential",
      async execute(_id, _args, signal) {
        await prepareKiln(signal);
        signal?.throwIfAborted();
        const activeHost = await getHost();
        signal?.throwIfAborted();
        const tools = activeHost.defs.filter(def => def.name === "kiln_discover" || def.name === "kiln_render").map(def => ({ name: def.name, parameters: z.toJSONSchema(def.inputSchema as z.ZodType) }));
        return textResult({ ready: true, engine: "@instruktlabs/kiln", version: "1.6.0", tools, evaluator: "AST allowlist + cancellable Node subprocess", renderer: "cpu-raster", limits: { sourceBytes: 65536, triangles: 50000, glbBytes: 16777216, deadlineMs: 45000, nodeHeapMiB: 512 }, systemSandbox: false });
      },
    }, {
      name: "kilnTool",
      label: "Holodeck / Kiln 官方建模工具",
      description: "调用官方 Kiln 1.6.0 的真实工具定义与实现。name=schemas,args={} 返回各官方工具完整输入结构；kiln_discover 查询真实 API/示例/限制。先发送 code 到 kiln_validate 或 kiln_render，保留返回 programRef，用 kiln_source 阅读真实源码、kiln_edit 精确改动、kiln_render/inspect 获取真实多视图图片与诊断。图片会直接返回给模型；CPU 图只用于几何审查。programRef 的源码在工作区不可变保存，跨对话仍可用。纯 Kiln kit 与安全 THREE 能力可用，禁止主机 I/O、动态代码及反射。",
      parameters: z.toJSONSchema(toolInput),
      executionMode: "sequential",
      async execute(_id, raw, signal) {
        signal?.throwIfAborted();
        if (Buffer.byteLength(JSON.stringify(raw), "utf8") > 256 * 1024) throw new Error("Kiln 工具参数超过 256 KiB，请按 programRef 操作");
        const input = toolInput.parse(raw);
        const activeHost = await getHost();
        signal?.throwIfAborted();
        if (input.name === "schemas") return textResult({ tools: activeHost.defs.filter(def => operationNames.includes(def.name as typeof operationNames[number])).map(def => ({ name: def.name, description: def.description, parameters: z.toJSONSchema(def.inputSchema as z.ZodType) })) });
        const result = await activeHost.callTool(input.name, input.args, { signal: signal ?? new AbortController().signal });
        signal?.throwIfAborted();
        if (result.isError) throw new Error(result.content.filter(part => part.type === "text").map(part => (part as { text: string }).text).join("\n") || "Kiln 工具未完成，请根据错误修订源码");
        const content = result.content.filter((part): part is { type: "text"; text: string } | { type: "image"; data: string; mimeType: string } => part.type === "text" || part.type === "image");
        if (content.some(part => part.type === "image")) {
          for (const part of content) {
            if (part.type !== "text") continue;
            let receipt: { programRef?: string; ok?: boolean; artifactGlbSha256?: string; viewFidelity?: { inputGlbSha256?: string }; render?: { viewFidelity?: { inputGlbSha256?: string } } };
            try { receipt = JSON.parse(part.text); } catch { continue; }
            const artifact = receipt.programRef && artifacts.get(receipt.programRef);
            const hash = receipt.viewFidelity?.inputGlbSha256 ?? receipt.render?.viewFidelity?.inputGlbSha256 ?? receipt.artifactGlbSha256;
            if (artifact && receipt.ok !== false && hash === artifact.rendered.artifactGlbSha256) artifact.reviewed = true;
          }
        }
        return { content, details: { engine: "@instruktlabs/kiln", version: "1.6.0", tool: input.name } };
      },
    }, {
      name: "kilnExport",
      label: "导出 Kiln 模型到 Toonflow 工作区",
      description: "导出本会话刚经 kiln_render 或其他出图工具实际审阅的 programRef 的精确 GLB 字节，绝不重新执行源码来冒充同一资产。新增保存到当前工作区 assets/trumanMap/kiln/models/，不覆盖、不删除已有素材。返回 path、bytes、tris 和持久化 kiln:{programId,revisionId,sourcePath,glbSha256}。修改已有模型时传原 programId 保持谱系；之后用世界资产导入工具放入场景。缓存已淘汰或跨会话时须先重新出图，不能把声明路径当已生成文件。",
      parameters: z.toJSONSchema(exportInput),
      executionMode: "sequential",
      async execute(_id, raw, signal) {
        const input = exportInput.parse(raw);
        signal?.throwIfAborted();
        await store.get(input.programRef);
        const artifact = artifacts.get(input.programRef);
        if (!artifact?.reviewed) throw new Error("请先对这个精确 programRef 调用 kiln_render 获取当前真实视图，再导出；旧会话或已淘汰的构建不能当作当前已审阅资产");
        const rendered = artifact.rendered;
        const glbHash = /^sha256:([a-f0-9]{64})$/.exec(rendered.artifactGlbSha256);
        if (!glbHash || `sha256:${createHash("sha256").update(rendered.glb).digest("hex")}` !== rendered.artifactGlbSha256) throw new Error("已审阅 GLB 字节发生变化或哈希格式无效，未导出，请重新渲染");
        signal?.throwIfAborted();
        const path = `${modelsPrefix}/model${crypto.randomUUID().replaceAll("-", "")}.glb`;
        const deliveryPath = `${deliveriesPrefix}/delivery${crypto.randomUUID().replaceAll("-", "")}.json`;
        const kiln = { programId: input.programId ?? crypto.randomUUID(), revisionId: input.programRef.slice(7), sourcePath: sourcePath(input.programRef), glbSha256: glbHash[1], deliveryPath };
        const delivery = { path, bytes: rendered.glb.byteLength, kiln };
        await context.files.mkdir(modelsPrefix, true);
        await context.files.mkdir(deliveriesPrefix, true);
        await context.files.writeFile(path, rendered.glb, true);
        signal?.throwIfAborted();
        await context.files.writeFile(deliveryPath, JSON.stringify(delivery, null, 2), true);
        signal?.throwIfAborted();
        return textResult({ ...delivery, mimeType: "model/gltf-binary", tris: rendered.tris, name: input.name ?? String(rendered.meta.name ?? "Kiln 模型").slice(0, 160), programRef: input.programRef, artifactGlbSha256: rendered.artifactGlbSha256, warnings: rendered.warnings });
      },
    }];
    return tools;
  },
};

export default plugin;
