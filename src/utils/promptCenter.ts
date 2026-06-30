import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import fg from "fast-glob";
import isPathInside from "is-path-inside";
import { transform } from "sucrase";
import runCode from "@/utils/vm";
import db from "@/utils/db";
import getPath from "@/utils/getPath";

export type PromptScope = "agent" | "function" | "videoModel" | "skill" | "modelPrompt";
export type PromptSourceType = "skillFile" | "dbPrompt" | "modelPromptFile";
export type PromptVersionStatus = "draft" | "active" | "archived";

export interface PromptTraceItem {
  sourceType: string;
  sourcePath?: string | null;
  promptType?: string | null;
  found: boolean;
  message: string;
}

export interface EffectivePrompt {
  scope: PromptScope;
  key: string;
  sourceType: PromptSourceType;
  sourcePath?: string | null;
  promptType?: string | null;
  hash: string;
  content: string;
  fallbackTrace: PromptTraceItem[];
  versionId?: number | null;
  activeVersionId?: number | null;
}

interface VersionRecord {
  id?: number;
  scope: PromptScope;
  key: string;
  sourceType: PromptSourceType;
  sourcePath?: string | null;
  promptType?: string | null;
  content: string;
  hash: string;
  status: PromptVersionStatus;
  note?: string | null;
  createdBy?: string | null;
  createTime: number;
  publishTime?: number | null;
}

interface PromptCenterItem {
  scope: PromptScope;
  key: string;
  sourceType?: PromptSourceType;
  sourcePath?: string | null;
  promptType?: string | null;
  vendorId?: string;
  vendorName?: string;
  name?: string;
  model?: string;
  mode?: string;
  fileName?: string;
}

export const AGENT_PROMPT_FILES: Record<string, string> = {
  scriptAgent: "script_agent_decision.md",
  "scriptAgent:decisionAgent": "script_agent_decision.md",
  "scriptAgent:supervisionAgent": "script_agent_supervision.md",
  "scriptAgent:storySkeletonAgent": "script_execution_skeleton.md",
  "scriptAgent:adaptationStrategyAgent": "script_execution_adaptation.md",
  "scriptAgent:scriptAgent": "script_execution_script.md",
  productionAgent: "production_agent_decision.md",
  "productionAgent:decisionAgent": "production_agent_decision.md",
  "productionAgent:supervisionAgent": "production_agent_supervision.md",
  "productionAgent:deriveAssetsAgent": "production_execution_derive_assets.md",
  "productionAgent:generateAssetsAgent": "production_execution_generate_assets.md",
  "productionAgent:directorPlanAgent": "production_execution_director_plan.md",
  "productionAgent:storyboardGenAgent": "production_execution_storyboard_gen.md",
  "productionAgent:storyboardPanelAgent": "production_execution_storyboard_panel.md",
  "productionAgent:storyboardTableAgent": "production_execution_storyboard_table.md",
};

export function hashPrompt(content: string): string {
  return crypto.createHash("sha256").update(content).digest("hex");
}

function toUnixPath(filePath: string): string {
  return filePath.replace(/\\/g, "/");
}

function safePath(root: string, requestedPath: string): { fullPath: string; relativePath: string } {
  const rootPath = path.resolve(root);
  const normalized = toUnixPath(requestedPath).replace(/^\/+/, "");
  if (!normalized) throw new Error("路径不能为空");
  const fullPath = path.resolve(rootPath, normalized);
  if (!(fullPath === rootPath || isPathInside(fullPath, rootPath))) {
    throw new Error("路径越界");
  }
  return { fullPath, relativePath: toUnixPath(path.relative(rootPath, fullPath)) };
}

async function readSafeFile(root: string, requestedPath: string): Promise<{ content: string; relativePath: string }> {
  const resolved = safePath(root, requestedPath);
  const content = await fs.readFile(resolved.fullPath, "utf-8");
  return { content, relativePath: resolved.relativePath };
}

async function writeSafeFile(root: string, requestedPath: string, content: string): Promise<string> {
  const resolved = safePath(root, requestedPath);
  await fs.mkdir(path.dirname(resolved.fullPath), { recursive: true });
  await fs.writeFile(resolved.fullPath, content, "utf-8");
  return resolved.relativePath;
}

async function readVendorMeta(vendorId: string): Promise<{ name?: string; models: any[] }> {
  const vendorRoot = getPath("vendor");
  const { fullPath } = safePath(vendorRoot, `${vendorId}.ts`);
  const code = await fs.readFile(fullPath, "utf-8");
  const jsCode = transform(code, { transforms: ["typescript"] }).code;
  // 复用统一沙盒 runCode（node:vm），消除独立 vm2 实例；仅读取 vendor 元信息
  const exports = runCode(jsCode);
  const vendor = exports.vendor ?? {};
  return {
    name: vendor.name,
    models: Array.isArray(vendor.models) ? vendor.models : [],
  };
}

function mergeModels(baseModels: any[], customModelsRaw?: string | null): any[] {
  let customModels: any[] = [];
  try {
    customModels = JSON.parse(customModelsRaw || "[]");
  } catch {
    customModels = [];
  }
  const modelMap = new Map<string, any>();
  for (const model of [...baseModels, ...customModels]) {
    if (model?.modelName) modelMap.set(model.modelName, model);
  }
  return [...modelMap.values()];
}

async function attachVersionInfo(effective: Omit<EffectivePrompt, "versionId" | "activeVersionId">): Promise<EffectivePrompt> {
  let active = (await db("o_promptVersion")
    .where({ scope: effective.scope, key: effective.key, status: "active" })
    .orderBy("publishTime", "desc")
    .first()) as VersionRecord | undefined;
  if ((!active || active.hash !== effective.hash) && effective.sourcePath) {
    active = (await db("o_promptVersion")
      .where({ sourceType: effective.sourceType, sourcePath: effective.sourcePath, status: "active" })
      .orderBy("publishTime", "desc")
      .first()) as VersionRecord | undefined;
  }
  if ((!active || active.hash !== effective.hash) && effective.promptType) {
    active = (await db("o_promptVersion")
      .where({ sourceType: "dbPrompt", promptType: effective.promptType, status: "active" })
      .orderBy("publishTime", "desc")
      .first()) as VersionRecord | undefined;
  }
  return {
    ...effective,
    activeVersionId: active?.id ?? null,
    versionId: active?.hash === effective.hash ? (active.id ?? null) : null,
  };
}

export async function resolveSkillPrompt(sourcePath: string, scope: PromptScope = "skill", key = sourcePath): Promise<EffectivePrompt> {
  const fallbackTrace: PromptTraceItem[] = [];
  const skillsRoot = getPath("skills");
  const { content, relativePath } = await readSafeFile(skillsRoot, sourcePath);
  fallbackTrace.push({ sourceType: "skillFile", sourcePath: relativePath, found: true, message: "读取 skills 文件" });
  return attachVersionInfo({
    scope,
    key,
    sourceType: "skillFile",
    sourcePath: relativePath,
    hash: hashPrompt(content),
    content,
    fallbackTrace,
  });
}

export async function resolveAgentPrompt(key: string): Promise<EffectivePrompt> {
  const sourcePath = AGENT_PROMPT_FILES[key] ?? (key.endsWith(".md") ? key : `${key}.md`);
  return resolveSkillPrompt(sourcePath, "agent", key);
}

export async function resolveFunctionPrompt(promptType: string): Promise<EffectivePrompt> {
  const fallbackTrace: PromptTraceItem[] = [];
  const promptData = (await db("o_prompt").where("type", promptType).first()) as any;
  if (!promptData) {
    fallbackTrace.push({ sourceType: "dbPrompt", promptType, found: false, message: "未找到 o_prompt 记录" });
    throw new Error(`未找到提示词配置: ${promptType}`);
  }
  const content = (promptData.useData || promptData.data || "") as string;
  fallbackTrace.push({
    sourceType: "dbPrompt",
    promptType,
    found: true,
    message: promptData.useData ? "使用 o_prompt.useData 覆盖内容" : "使用 o_prompt.data 默认内容",
  });
  return attachVersionInfo({
    scope: "function",
    key: promptType,
    sourceType: "dbPrompt",
    promptType,
    hash: hashPrompt(content),
    content,
    fallbackTrace,
  });
}

function selectVideoPromptFile(model: string, mode?: string): string | null {
  const modelLower = (model ?? "").toLowerCase();
  if (modelLower.includes("wan") && modelLower.includes("2.6")) return "wan2.6Single-imageFirstFrameMode.md";
  if (/seedance.*2[.\-]0/i.test(modelLower)) return "seedance2Multi-parameterMode.md";
  if (mode === "startEndRequired" || mode === "endFrameOptional" || mode === "startFrameOptional") {
    return "universalFirstAndLastFrameMode.md";
  }
  if (typeof mode === "string" && mode.startsWith('["') && mode.endsWith('"]')) return "universalMulti-parameterMode.md";
  return null;
}

function videoModelKey(input: { vendorId: string; model: string; mode?: string }): string {
  return [input.vendorId, input.model, input.mode || "text"].join(":");
}

export async function resolveModelPromptFile(sourcePath: string): Promise<EffectivePrompt> {
  const modelPromptRoot = getPath("modelPrompt");
  const fallbackTrace: PromptTraceItem[] = [];
  const { content, relativePath } = await readSafeFile(modelPromptRoot, sourcePath);
  fallbackTrace.push({ sourceType: "modelPromptFile", sourcePath: relativePath, found: true, message: "读取模型提示词文件" });
  return attachVersionInfo({
    scope: "modelPrompt",
    key: relativePath,
    sourceType: "modelPromptFile",
    sourcePath: relativePath,
    hash: hashPrompt(content),
    content,
    fallbackTrace,
  });
}

export async function resolveVideoModelPrompt(input: { vendorId: string; model: string; mode?: string }): Promise<EffectivePrompt> {
  const fallbackTrace: PromptTraceItem[] = [];
  const key = videoModelKey(input);
  const modelPromptRoot = getPath("modelPrompt");
  const modelPromptData = (await db("o_modelPrompt").where("vendorId", input.vendorId).where("model", input.model).first()) as any;

  if (modelPromptData?.path) {
    try {
      const { content, relativePath } = await readSafeFile(modelPromptRoot, modelPromptData.path);
      fallbackTrace.push({ sourceType: "modelPromptBinding", sourcePath: relativePath, found: true, message: "使用 o_modelPrompt 绑定文件" });
      return attachVersionInfo({
        scope: "videoModel",
        key,
        sourceType: "modelPromptFile",
        sourcePath: relativePath,
        hash: hashPrompt(content),
        content,
        fallbackTrace,
      });
    } catch (err: any) {
      fallbackTrace.push({
        sourceType: "modelPromptBinding",
        sourcePath: modelPromptData.path,
        found: false,
        message: `绑定文件不可用: ${err?.message ?? String(err)}`,
      });
    }
  } else {
    fallbackTrace.push({ sourceType: "modelPromptBinding", found: false, message: "未配置 o_modelPrompt 绑定" });
  }

  const autoFile = selectVideoPromptFile(input.model, input.mode);
  if (autoFile) {
    const sourcePath = `video/${autoFile}`;
    try {
      const { content, relativePath } = await readSafeFile(modelPromptRoot, sourcePath);
      fallbackTrace.push({ sourceType: "autoModelPromptFile", sourcePath: relativePath, found: true, message: "按模型名称/mode 自动匹配默认文件" });
      return attachVersionInfo({
        scope: "videoModel",
        key,
        sourceType: "modelPromptFile",
        sourcePath: relativePath,
        hash: hashPrompt(content),
        content,
        fallbackTrace,
      });
    } catch (err: any) {
      fallbackTrace.push({
        sourceType: "autoModelPromptFile",
        sourcePath,
        found: false,
        message: `自动匹配文件不可用: ${err?.message ?? String(err)}`,
      });
    }
  } else {
    fallbackTrace.push({ sourceType: "autoModelPromptFile", found: false, message: "模型名称/mode 未匹配默认文件" });
  }

  const fallback = await resolveFunctionPrompt("videoPromptGeneration");
  return attachVersionInfo({
    ...fallback,
    scope: "videoModel",
    key,
    fallbackTrace: [
      ...fallbackTrace,
      ...fallback.fallbackTrace.map((item) => ({ ...item, message: `fallback: ${item.message}` })),
    ],
  });
}

export async function createPromptDraft(input: {
  scope: PromptScope;
  key: string;
  sourceType: PromptSourceType;
  sourcePath?: string | null;
  promptType?: string | null;
  content: string;
  note?: string | null;
  createdBy?: string | null;
}): Promise<VersionRecord> {
  if (!input.key.trim()) throw new Error("key 不能为空");
  if (input.sourceType === "skillFile" && input.sourcePath) safePath(getPath("skills"), input.sourcePath);
  if (input.sourceType === "modelPromptFile" && input.sourcePath) safePath(getPath("modelPrompt"), input.sourcePath);

  const now = Date.now();
  const record: VersionRecord = {
    scope: input.scope,
    key: input.key,
    sourceType: input.sourceType,
    sourcePath: input.sourcePath ?? null,
    promptType: input.promptType ?? null,
    content: input.content,
    hash: hashPrompt(input.content),
    status: "draft",
    note: input.note ?? null,
    createdBy: input.createdBy ?? "admin",
    createTime: now,
    publishTime: null,
  };
  const [id] = await db("o_promptVersion").insert(record as any);
  return { ...record, id: Number(id) };
}

export async function publishPromptVersion(versionId: number): Promise<VersionRecord> {
  const version = (await db("o_promptVersion").where("id", versionId).first()) as VersionRecord | undefined;
  if (!version) throw new Error(`未找到提示词版本: ${versionId}`);

  if (version.sourceType === "dbPrompt") {
    const promptType = version.promptType || version.key;
    const updated = await db("o_prompt").where("type", promptType).update({ useData: version.content });
    if (!updated) throw new Error(`未找到可发布的 o_prompt: ${promptType}`);
  } else if (version.sourceType === "skillFile") {
    if (!version.sourcePath) throw new Error("技能提示词缺少 sourcePath");
    await writeSafeFile(getPath("skills"), version.sourcePath, version.content);
  } else if (version.sourceType === "modelPromptFile") {
    if (!version.sourcePath) throw new Error("模型提示词缺少 sourcePath");
    await writeSafeFile(getPath("modelPrompt"), version.sourcePath, version.content);
  } else {
    throw new Error(`不支持的 sourceType: ${version.sourceType}`);
  }

  const now = Date.now();
  await db("o_promptVersion").where({ scope: version.scope, key: version.key, status: "active" }).update({ status: "archived" });
  await db("o_promptVersion").where("id", versionId).update({ status: "active", publishTime: now });
  return { ...version, status: "active", publishTime: now };
}

export async function listPromptVersions(scope: PromptScope, key: string): Promise<VersionRecord[]> {
  return (await db("o_promptVersion").where({ scope, key }).orderBy("createTime", "desc")) as VersionRecord[];
}

export async function seedPromptBaselineVersions(input: {
  note?: string;
  createdBy?: string;
  items?: PromptCenterItem[];
} = {}): Promise<{ created: number; skipped: number; failed: Array<{ scope?: string; key?: string; message: string }> }> {
  const groups = input.items ? null : await listPromptCenterItems();
  const items = input.items ?? Object.values(groups!).flat();
  const seen = new Set<string>();
  const result = { created: 0, skipped: 0, failed: [] as Array<{ scope?: string; key?: string; message: string }> };

  for (const item of items) {
    const identity = `${item.scope}:${item.key}`;
    if (seen.has(identity)) {
      result.skipped += 1;
      continue;
    }
    seen.add(identity);

    try {
      const effective = await resolvePromptDescriptor(item);
      const active = (await db("o_promptVersion")
        .where({ scope: effective.scope, key: effective.key, status: "active" })
        .first()) as VersionRecord | undefined;
      if (active) {
        result.skipped += 1;
        continue;
      }

      const now = Date.now();
      await db("o_promptVersion").insert({
        scope: effective.scope,
        key: effective.key,
        sourceType: effective.sourceType,
        sourcePath: effective.sourcePath ?? null,
        promptType: effective.promptType ?? null,
        content: effective.content,
        hash: effective.hash,
        status: "active",
        note: input.note ?? "baseline",
        createdBy: input.createdBy ?? "admin",
        createTime: now,
        publishTime: now,
      } as any);
      result.created += 1;
    } catch (err: any) {
      result.failed.push({ scope: item.scope, key: item.key, message: err?.message ?? String(err) });
    }
  }

  return result;
}

export async function recordPromptUsage(input: {
  effectivePrompt: EffectivePrompt;
  modelName?: string | null;
  taskId?: number | null;
  relatedType?: string | null;
  relatedId?: string | number | null;
  meta?: any;
}) {
  const promptSource = input.effectivePrompt.sourcePath || input.effectivePrompt.promptType || input.effectivePrompt.sourceType;
  const [id] = await db("o_promptUsage").insert({
    scope: input.effectivePrompt.scope,
    key: input.effectivePrompt.key,
    promptHash: input.effectivePrompt.hash,
    promptVersionId: input.effectivePrompt.versionId ?? null,
    promptSource,
    modelName: input.modelName ?? null,
    taskId: input.taskId ?? null,
    relatedType: input.relatedType ?? null,
    relatedId: input.relatedId == null ? null : String(input.relatedId),
    meta: input.meta == null ? null : JSON.stringify(input.meta),
    createTime: Date.now(),
  } as any);
  return Number(id);
}

export async function applyPromptSnapshotToTask(
  taskId: number,
  effectivePrompt: EffectivePrompt,
  modelName?: string | null,
): Promise<void> {
  const promptSource = effectivePrompt.sourcePath || effectivePrompt.promptType || effectivePrompt.sourceType;
  await db("o_tasks")
    .where("id", taskId)
    .update({
      promptHash: effectivePrompt.hash,
      promptVersionId: effectivePrompt.versionId ?? null,
      promptSource,
      ...(modelName ? { model: modelName } : {}),
    } as any);
}

export async function listPromptCenterItems() {
  const promptRows = (await db("o_prompt").select("id", "name", "type")) as any[];
  const enabledVendors = (await db("o_vendorConfig").select("id", "models").where("enable", 1)) as Array<{ id: string; models?: string | null }>;
  const modelPromptRoot = getPath("modelPrompt");
  const skillRoot = getPath("skills");
  const modelPromptFiles = await fg("**/*.md", { cwd: modelPromptRoot.replace(/\\/g, "/"), onlyFiles: true });
  const skillFiles = await fg("**/*.md", { cwd: skillRoot.replace(/\\/g, "/"), onlyFiles: true });
  const videoModelGroups = await Promise.all(
    enabledVendors.map(async (vendorRow) => {
      let vendor: { name?: string; models: any[] };
      try {
        vendor = await readVendorMeta(vendorRow.id);
      } catch (err) {
        console.warn(`[promptCenter] 跳过不可解析的供应商: ${vendorRow.id}`, err);
        return [];
      }
      const promptList = (await db("o_modelPrompt").where("vendorId", vendorRow.id).select("*")) as any[];
      const promptMap = new Map(promptList.map((item) => [item.model, { fileName: item.fileName, sourcePath: item.path }]));
      const models = mergeModels(vendor.models, vendorRow.models);
      return models
        .filter((model: any) => model.type === "video")
        .flatMap((model: any) => {
          const modeOptions = Array.isArray(model.mode) ? model.mode : [model.mode ?? ""];
          return modeOptions.map((mode: any) => {
            const modeValue = Array.isArray(mode) ? JSON.stringify(mode) : String(mode ?? "");
            return {
              scope: "videoModel",
              key: videoModelKey({ vendorId: vendorRow.id, model: model.modelName, mode: modeValue }),
              vendorId: vendorRow.id,
              vendorName: vendor?.name ?? vendorRow.id,
              name: model.name,
              model: model.modelName,
              mode: modeValue,
              sourceType: "modelPromptFile",
              ...(promptMap.get(model.modelName) ?? {}),
            };
          });
        });
    }),
  );
  const seenAgentFiles = new Set<string>();
  return {
    agent: Object.entries(AGENT_PROMPT_FILES)
      .filter(([, sourcePath]) => {
        if (seenAgentFiles.has(sourcePath)) return false;
        seenAgentFiles.add(sourcePath);
        return true;
      })
      .map(([key, sourcePath]) => ({ scope: "agent", key, sourceType: "skillFile", sourcePath })),
    function: promptRows.map((row) => ({ scope: "function", key: row.type, name: row.name, sourceType: "dbPrompt", promptType: row.type })),
    videoModel: videoModelGroups.flat(),
    modelPrompt: modelPromptFiles.map((sourcePath) => ({ scope: "modelPrompt", key: sourcePath, sourceType: "modelPromptFile", sourcePath })),
    skill: skillFiles.map((sourcePath) => ({ scope: "skill", key: sourcePath, sourceType: "skillFile", sourcePath })),
  };
}

export async function resolvePromptDescriptor(input: {
  scope: PromptScope;
  key?: string;
  sourcePath?: string;
  promptType?: string;
  vendorId?: string;
  model?: string;
  mode?: string;
}): Promise<EffectivePrompt> {
  if (input.scope === "agent") return resolveAgentPrompt(input.key || input.sourcePath || "");
  if (input.scope === "function") return resolveFunctionPrompt(input.promptType || input.key || "");
  if (input.scope === "modelPrompt") return resolveModelPromptFile(input.sourcePath || input.key || "");
  if (input.scope === "skill") return resolveSkillPrompt(input.sourcePath || input.key || "", "skill", input.key || input.sourcePath || "");
  if (input.scope === "videoModel") {
    if (!input.vendorId || !input.model) throw new Error("videoModel 需要 vendorId 和 model");
    return resolveVideoModelPrompt({ vendorId: input.vendorId, model: input.model, mode: input.mode });
  }
  throw new Error(`不支持的 scope: ${input.scope}`);
}

export async function runPromptRegression(input: {
  scope: PromptScope;
  key?: string;
  sourcePath?: string;
  promptType?: string;
  vendorId?: string;
  model?: string;
  mode?: string;
  content?: string;
}) {
  const effective = input.content
    ? {
        ...(await resolvePromptDescriptor(input)),
        content: input.content,
        hash: hashPrompt(input.content),
      }
    : await resolvePromptDescriptor(input);
  const checks: { name: string; passed: boolean; message: string }[] = [];
  const content = effective.content;
  const key = effective.key || input.key || input.sourcePath || input.promptType || "";

  if (effective.scope === "function" && key === "eventExtraction") {
    checks.push({ name: "event_pipe_format", passed: content.includes("| 第X章") && content.includes("恰好 7 个字段"), message: "事件提取需保留单行管道格式约束" });
  }
  if (effective.scope === "function" && key === "scriptAssetExtraction") {
    checks.push({ name: "asset_tool_call", passed: content.includes("resultTool"), message: "剧本资产提取需强制工具返回" });
  }
  if ((effective.scope === "function" && key === "videoPromptGeneration") || effective.scope === "videoModel" || effective.scope === "modelPrompt") {
    checks.push({ name: "video_prompt_only", passed: content.includes("仅输出视频提示词") || content.includes("禁止输出任何分析过程"), message: "视频提示词需禁止额外解释文本" });
  }
  const xmlExpectations: Record<string, string> = {
    "script_execution_skeleton.md": "<storySkeleton>",
    "script_execution_adaptation.md": "<adaptationStrategy>",
    "script_execution_script.md": "<scriptItem",
    "production_execution_director_plan.md": "<scriptPlan>",
    "production_execution_storyboard_panel.md": "<storyboardItem",
    "production_execution_storyboard_table.md": "<storyboardTable>",
  };
  const sourcePath = effective.sourcePath || key;
  const expected = Object.entries(xmlExpectations).find(([file]) => sourcePath.endsWith(file));
  if (expected) {
    checks.push({ name: "agent_xml_contract", passed: content.includes(expected[1]), message: `Agent skill 需保留 ${expected[1]} 写入约束` });
  }
  if (!checks.length) checks.push({ name: "non_empty", passed: content.trim().length > 0, message: "提示词内容不能为空" });

  return {
    passed: checks.every((check) => check.passed),
    hash: effective.hash,
    source: effective.sourcePath || effective.promptType || effective.sourceType,
    checks,
  };
}
