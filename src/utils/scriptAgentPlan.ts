import db from "@/utils/db";
import { recordGenerationArtifact } from "@/utils/contentAudit";

export type ScriptPlanItem = {
  id?: number;
  name?: string;
  content: string;
};

export type ScriptAgentPlanData = {
  storySkeleton?: string;
  adaptationStrategy?: string;
  script?: ScriptPlanItem[];
};

function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function mergeScripts(existing: ScriptPlanItem[] = [], incoming: ScriptPlanItem[] = []) {
  const next = [...existing];
  for (const script of incoming) {
    const index = next.findIndex((item) => (script.id && item.id === script.id) || (script.name && item.name === script.name));
    if (index >= 0) next[index] = { ...next[index], ...script };
    else next.push(script);
  }
  return sortScripts(next);
}

function scriptEpisodeOrder(script: ScriptPlanItem) {
  const text = `${script.name || ""} ${script.content || ""}`;
  const match = text.match(/\bEP\s*0*(\d+)\b/i) || text.match(/第\s*0*(\d+)\s*集/);
  if (!match) return Number.MAX_SAFE_INTEGER;
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : Number.MAX_SAFE_INTEGER;
}

function sortScripts(scripts: ScriptPlanItem[] = []) {
  return [...scripts].sort((a, b) => (
    scriptEpisodeOrder(a) - scriptEpisodeOrder(b)
    || Number(a.id || 0) - Number(b.id || 0)
    || String(a.name || "").localeCompare(String(b.name || ""))
  ));
}

export async function getScriptAgentPlanData(projectId: number) {
  let row = await db<any>("o_agentWorkData").where({ projectId, key: "scriptAgent" }).first();
  if (!row) {
    const now = Date.now();
    const [id] = await db<any>("o_agentWorkData").insert({
      projectId,
      key: "scriptAgent",
      data: JSON.stringify({ storySkeleton: "", adaptationStrategy: "", script: [] }),
      createTime: now,
      updateTime: now,
    });
    row = { id, data: "{}" };
  }

  const data = parseJson<ScriptAgentPlanData>(row.data, {});
  data.storySkeleton = data.storySkeleton ?? "";
  data.adaptationStrategy = data.adaptationStrategy ?? "";
  data.script = sortScripts(await db<any>("o_script").where({ projectId }).select("id", "name", "content"));
  return { id: row.id, data };
}

export async function setScriptAgentPlanData(projectId: number, data: ScriptAgentPlanData) {
  const existing = await db<any>("o_agentWorkData").where({ projectId, key: "scriptAgent" }).first();
  const existingData = existing ? parseJson<ScriptAgentPlanData>(existing.data, {}) : {};
  const nextData: ScriptAgentPlanData = {
    storySkeleton: "",
    adaptationStrategy: "",
    ...existingData,
    ...data,
    script: mergeScripts(Array.isArray(existingData.script) ? existingData.script : [], Array.isArray(data.script) ? data.script : []),
  };
  const now = Date.now();

  let id = existing?.id;
  if (existing) {
    await db<any>("o_agentWorkData").where({ id }).update({ data: JSON.stringify(nextData), updateTime: now });
  } else {
    const [newId] = await db<any>("o_agentWorkData").insert({
      projectId,
      key: "scriptAgent",
      data: JSON.stringify(nextData),
      createTime: now,
      updateTime: now,
    });
    id = newId;
  }

  for (const script of nextData.script || []) {
    const row = script.id
      ? await db<any>("o_script").where({ projectId, id: script.id }).first()
      : await db<any>("o_script").where({ projectId, name: script.name }).first();
    const title = script.name || row?.name || "未命名剧本";
    if (row) {
      const patch: Record<string, string> = {};
      if (script.content !== row.content) patch.content = script.content;
      if (script.name && script.name !== row.name) patch.name = script.name;
      if (Object.keys(patch).length) await db<any>("o_script").where({ id: row.id }).update(patch);
      if (patch.content) {
        await recordGenerationArtifact({
          projectId,
          artifactType: "script",
          targetType: "o_script",
          targetId: row.id,
          targetField: "content",
          title,
          content: script.content,
          meta: { source: "agent:setPlanData", mode: "update" },
        });
      }
    } else {
      const [scriptId] = await db<any>("o_script").insert({ projectId, name: title, content: script.content });
      await recordGenerationArtifact({
        projectId,
        artifactType: "script",
        targetType: "o_script",
        targetId: scriptId,
        targetField: "content",
        title,
        content: script.content,
        meta: { source: "agent:setPlanData", mode: "insert" },
      });
    }
  }

  return { id, data: nextData };
}

export function parseScriptAgentArtifacts(text: string) {
  const result: { storySkeleton?: string; adaptationStrategy?: string; scripts: ScriptPlanItem[] } = { scripts: [] };
  const skeleton = text.match(/<storySkeleton>([\s\S]*?)<\/storySkeleton>/);
  if (skeleton) result.storySkeleton = skeleton[1].trim();
  const adaptation = text.match(/<adaptationStrategy>([\s\S]*?)<\/adaptationStrategy>/);
  if (adaptation) result.adaptationStrategy = adaptation[1].trim();
  const scriptRe = /<scriptItem\b([^>]*)>([\s\S]*?)<\/scriptItem>/g;
  let match;
  while ((match = scriptRe.exec(text))) {
    const attrs = match[1] || "";
    const name = (attrs.match(/\bname=["']([^"']+)["']/) || [])[1] || `剧本 ${result.scripts.length + 1}`;
    result.scripts.push({ name: name.trim(), content: match[2].trim() });
  }
  return result;
}

export function scriptArtifactIssue(text: string) {
  const opens = [...String(text || "").matchAll(/<scriptItem\b([^>]*)>/g)];
  const closes = String(text || "").match(/<\/scriptItem>/g) || [];
  if (opens.length <= closes.length) return "";
  const attrs = opens[opens.length - 1]?.[1] || "";
  const name = (attrs.match(/\bname=["']([^"']+)["']/) || [])[1] || "当前剧本";
  return `${name} 生成未完成，缺少 </scriptItem>，未写入剧本卡片。请重新生成该集。`;
}

export async function persistScriptAgentArtifacts(projectId: number | null | undefined, text: string) {
  if (!projectId) return { changed: false, issue: "" };
  const issue = scriptArtifactIssue(text);
  const parsed = parseScriptAgentArtifacts(text);
  if (!parsed.storySkeleton && !parsed.adaptationStrategy && !parsed.scripts.length) return { changed: false, issue };
  await setScriptAgentPlanData(projectId, {
    storySkeleton: parsed.storySkeleton,
    adaptationStrategy: parsed.adaptationStrategy,
    script: parsed.scripts,
  });
  return { changed: true, issue };
}
