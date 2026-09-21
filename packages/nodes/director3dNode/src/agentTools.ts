import { z, type NodeAiTool } from "@toonflow/nodes-scaffold/runtime";
import { sceneSchema, type SceneDocument } from "./scene";
import { directorPlanSchema, type DirectorPlan, type DirectorPlanItem } from "./sceneAnimation";

const pathSchema = z.array(z.union([
  z.string().max(100).refine(value => !["__proto__", "constructor", "prototype"].includes(value), "路径不允许访问原型"),
  z.number().int().min(0).max(2000),
])).max(24);
const selection = {
  objectId: z.string().min(1).max(100).optional(),
  joint: directorPlanSchema.shape.tracks.element.shape.joint,
};
const readSchema = z.strictObject({
  section: z.enum(["scene", "plan", "history", "schema"]),
  ...selection,
  planId: z.string().min(1).max(100).optional(),
  path: pathSchema.optional(),
});
const operationSchema = z.strictObject({
  section: z.enum(["scene", "plan"]),
  ...selection,
  path: pathSchema,
  op: z.enum(["add", "replace", "remove"]),
  value: z.json().optional(),
});
const editSchema = z.strictObject({ operations: z.array(operationSchema).min(1).max(100) });
type Draft = { scene: SceneDocument; plan: Partial<DirectorPlan> };
type Path = z.infer<typeof pathSchema>;

function checkSize(value: unknown) {
  if (new TextEncoder().encode(JSON.stringify(value)).byteLength > 500000) throw new Error("草稿或工具参数超过 500 KB，请精简场景或关键帧");
}

function readPath(value: unknown, path: Path): unknown {
  for (const key of path) {
    if (!value || typeof value !== "object" || !Object.hasOwn(value, key)
      || (Array.isArray(value) && !/^(0|[1-9]\d*)$/.test(String(key)))) {
      throw new Error(`路径不存在：${path.join(".")}`);
    }
    value = (value as Record<string | number, unknown>)[key];
  }
  return value;
}

function selectionPath(value: unknown, section: "scene" | "plan", objectId?: string, joint?: string): Path {
  if (joint && (section !== "plan" || !objectId)) throw new Error("joint 只能与 plan 的 objectId 一同使用");
  if (!objectId) return [];
  const key = section === "scene" ? "objectList" : "tracks";
  const items = readPath(value, [key]) as (SceneDocument["objectList"][number] & DirectorPlan["tracks"][number])[];
  const index = items.findIndex(item => section === "scene" ? item.threeJsonId === objectId : item.objectId === objectId && item.joint === joint);
  if (index < 0) throw new Error(`找不到${section === "scene" ? "物体" : "轨道"}：${objectId}${joint ? ` / ${joint}` : ""}`);
  return [key, index];
}

function applyOperation(draft: Draft, operation: z.infer<typeof operationSchema>) {
  const { section, op, value } = operation;
  if (op !== "remove" && !Object.hasOwn(operation, "value")) throw new Error(`${op} 必须提供 value`);
  const path = [...selectionPath(draft[section], section, operation.objectId, operation.joint), ...operation.path];
  if (!path.length) {
    if (op !== "replace") throw new Error("整个 scene 或 plan 只允许 replace；请用相对路径添加或删除字段");
    Object.assign(draft, { [section]: structuredClone(value) });
    return;
  }
  const key = path.pop()!;
  const parent = readPath(draft[section], path);
  if (!parent || typeof parent !== "object") throw new Error(`路径不是对象或数组：${path.join(".")}`);
  if (Array.isArray(parent)) {
    const index = key === "-" && op === "add" ? parent.length : /^(0|[1-9]\d*)$/.test(String(key)) ? Number(key) : -1;
    if (index < 0 || index >= parent.length + Number(op === "add")) throw new Error(`数组位置不存在：${[...path, key].join(".")}`);
    if (op === "remove") parent.splice(index, 1);
    else if (op === "add") parent.splice(index, 0, structuredClone(value));
    else parent[index] = structuredClone(value);
    return;
  }
  const object = parent as Record<string | number, unknown>;
  const exists = Object.hasOwn(object, key);
  if (op === "add" ? exists : !exists) throw new Error(`字段${exists ? "已存在，请使用 replace" : "不存在"}：${[...path, key].join(".")}`);
  if (op === "remove") delete object[key];
  else object[key] = structuredClone(value);
}

function validateDraft(draft: Draft, complete = false) {
  checkSize(draft);
  const scene = sceneSchema.parse(draft.scene);
  const plan = directorPlanSchema.safeParse(draft.plan);
  const issues = plan.success ? [] : plan.error.issues;
  // ACT: 仅允许顶层必填项尚未补齐；字段结构、数值和已完整方案的约束仍拒绝整批修改。
  const incomplete = (issue: z.core.$ZodIssue) => issue.path.length === 1 && (
    (issue.code === "invalid_type" && !Object.hasOwn(draft.plan, issue.path[0]!))
    || (issue.code === "too_small" && issue.path[0] === "cameraFrames" && draft.plan.cameraFrames?.length === 0)
    || (issue.code === "custom" && issue.path[0] === "cameraFrames" && draft.plan.cameraFrames?.length === 0)
  );
  const invalid = complete ? issues : issues.filter(issue => !incomplete(issue));
  if (invalid.length) throw new Error(invalid.slice(0, 8).map(issue => `plan.${issue.path.join(".")}：${issue.message}`).join("\n"));
  const objects = new Map(scene.objectList.map(object => [object.threeJsonId, object]));
  for (const track of draft.plan.tracks ?? []) {
    const object = objects.get(track.objectId);
    if (!object) throw new Error(`tracks 引用了不存在的物体：${track.objectId}，删除物体时需同时删除其轨道`);
    if (track.joint && object.objType !== "mannequin") throw new Error(`只有人偶支持关节轨道：${track.objectId} / ${track.joint}`);
  }
  draft.scene = scene;
  if (plan.success) draft.plan = plan.data;
  return { valid: plan.success, issues: issues.map(issue => `plan.${issue.path.join(".")}：${issue.message}`) };
}

export function createDirectorDraft(scene: SceneDocument, plan?: DirectorPlan, plans: DirectorPlanItem[] = []) {
  let draft: Draft = structuredClone({ scene, plan: plan ?? { tracks: [], cameraFrames: [] } });
  const history = structuredClone(plans);
  validateDraft(draft);
  const originalScene = JSON.stringify(draft.scene);
  let edited = false;

  const tools: NodeAiTool[] = [{
    name: "readDocument",
    description: "读取本轮独立草稿的 scene / plan；objectId 选择场景物体或方案轨道，joint 选择人偶关节轨道，path 为相对字段路径。history 只读且必须提供 planId。schema 可用 path ['scene'] / ['plan'] 读取 JSON Schema。按需读取，避免反复读取完整文档。",
    parameters: z.toJSONSchema(readSchema),
    execute(args, signal) {
      signal?.throwIfAborted();
      const { section, objectId, joint, planId, path = [] } = readSchema.parse(args);
      if (section === "schema") {
        if (objectId || joint || planId) throw new Error("schema 不支持 objectId、joint 或 planId");
        return readPath({ scene: z.toJSONSchema(sceneSchema), plan: z.toJSONSchema(directorPlanSchema) }, path);
      }
      let value: unknown = section === "history" ? history.find(item => item.id === planId) : draft[section];
      if (section === "history" && (!planId || !value)) throw new Error("历史方案不存在，请从摘要中选择有效 planId");
      if (section !== "history" && planId) throw new Error("planId 仅用于只读 history");
      const selected = selectionPath(value, section === "scene" ? "scene" : "plan", objectId, joint);
      value = readPath(value, [...selected, ...path]);
      checkSize(value);
      return { value: structuredClone(value), ...validateDraft(draft) };
    },
  }, {
    name: "editDocument",
    description: "原子批量修改本轮 scene / plan 草稿，不修改历史和磁盘。objectId / joint 按稳定 ID 选择现有物体/轨道，path 为相对路径。add 添加新字段或插入数组，数组下标 '-' 表示追加；replace / remove 必须命中已有路径。添加物体用 scene 的 ['objectList','-']，添加轨道用 plan 的 ['tracks','-']。任何非法操作整批撤销。返回 valid=false 时只保存了未完成草稿，必须依据 issues 补齐，直到 valid=true。",
    parameters: z.toJSONSchema(editSchema),
    execute(args, signal) {
      signal?.throwIfAborted();
      checkSize(args);
      const { operations } = editSchema.parse(args);
      const next = structuredClone(draft);
      operations.forEach(operation => applyOperation(next, operation));
      const validation = validateDraft(next);
      signal?.throwIfAborted();
      draft = next;
      edited = true;
      return { applied: operations.length, ...validation };
    },
  }];

  return {
    tools,
    get edited() { return edited; },
    get sceneChanged() { return JSON.stringify(draft.scene) !== originalScene; },
    summary() {
      return {
        objects: draft.scene.objectList.map(({ threeJsonId, name, objType }) => ({ threeJsonId, name, objType })),
        plan: { name: draft.plan.name, duration: draft.plan.duration, tracks: draft.plan.tracks?.map(({ objectId, joint, frames }) => ({ objectId, joint, frames: frames.length })), cameraFrames: draft.plan.cameraFrames?.length },
        history: history.map(({ id, name, duration, tracks, cameraFrames }) => ({ id, name, duration, tracks: tracks.length, cameraFrames: cameraFrames.length })),
        ...validateDraft(draft),
      };
    },
    read(): { scene: SceneDocument; plan: DirectorPlan } {
      validateDraft(draft, true);
      return structuredClone(draft) as { scene: SceneDocument; plan: DirectorPlan };
    },
  };
}
