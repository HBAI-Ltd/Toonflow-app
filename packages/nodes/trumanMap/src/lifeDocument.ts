import { z } from "@toonflow/nodes-scaffold/runtime";
import type { Vector3Value } from "./sceneDocument";
import { storedPerformanceTracksSchema } from "./performanceDocument";

const coordinate = z.number().finite().min(-10000).max(10000);
const vector = z.strictObject({ x: coordinate, y: coordinate, z: coordinate });

export const navigationSchema = z.strictObject({
  kind: z.enum(["road", "walk"]),
  points: z.array(vector).min(2).max(256),
  width: z.number().finite().min(0.4).max(20),
});

const tagList = z.array(z.string().trim().min(1).max(40)).max(16);
export const lifeAnchorSchema = z.discriminatedUnion("kind", [
  z.strictObject({ kind: z.literal("object"), objectId: z.string().min(1).max(160), offset: vector.optional() }),
  z.strictObject({ kind: z.literal("point"), position: vector }),
]);
export const lifeActivitySchema = z.strictObject({
  id: z.string().min(1).max(160),
  clipId: z.string().min(1).max(160).optional(),
  clipKind: z.enum(["move", "pose"]).optional(),
  clipOrigin: vector.optional(),
  label: z.string().trim().min(1).max(160),
  anchor: lifeAnchorSchema,
  spread: z.number().finite().min(0.3).max(8),
  duration: z.number().finite().min(0).max(300),
  action: z.enum(["wait", "interact", "work", "rest", "graze", "observe"]),
  face: lifeAnchorSchema.optional(),
  via: z.array(lifeAnchorSchema).max(24).optional(),
  on: z.array(z.strictObject({
    event: z.enum(["arrived", "completed", "blocked", "targetNear", "targetFar"]),
    next: z.string().min(1).max(160),
  })).max(5).refine(events => new Set(events.map(event => event.event)).size === events.length, "同一活动不能重复定义相同事件").optional(),
});
export const lifePlanSchema = z.strictObject({
  summary: z.string().trim().min(1).max(1000),
  loop: z.boolean(),
  steps: z.array(lifeActivitySchema).min(1).max(16).refine(steps => new Set(steps.map(step => step.id)).size === steps.length, "活动步骤 ID 不能重复"),
}).superRefine((plan, context) => {
  const ids = new Set(plan.steps.map(step => step.id));
  for (const [index, step] of plan.steps.entries()) for (const [eventIndex, event] of (step.on ?? []).entries()) {
    if (!ids.has(event.next)) context.addIssue({ code: "custom", path: ["steps", index, "on", eventIndex, "next"], message: "事件必须指向本计划中已有的活动" });
  }
});
export const lifeGroupSchema = z.strictObject({
  id: z.string().min(1).max(160),
  scenarioId: z.string().min(1).max(160).optional(),
  name: z.string().trim().min(1).max(160),
  enabled: z.boolean(),
  count: z.number().int().min(0).max(120),
  visual: z.discriminatedUnion("kind", [
    z.strictObject({ kind: z.literal("builtin"), model: z.enum(["person", "ancientPerson", "car", "cart", "deer", "rabbit", "wolf"]) }),
    z.strictObject({ kind: z.literal("object"), objectId: z.string().min(1).max(160) }),
  ]),
  locomotion: z.enum(["ground", "road", "air", "water"]),
  // 演绎“沿线”轨道：按air直线移动但贴着地形走、不被其他物体挡住。
  groundFollow: z.boolean().optional(),
  // 演绎“飞檐走壁”：能站在屋顶、屋脊、墙头上，走不通或绕远的段直接飞身跨过去。
  parkour: z.boolean().optional(),
  behavior: z.enum(["wander", "herd", "forage", "patrol", "pursue", "idle"]),
  speed: z.number().finite().min(0.1).max(30),
  center: vector,
  radius: z.number().finite().min(1).max(60),
  verticalOffset: z.number().finite().min(-100).max(500),
  perceptionRadius: z.number().finite().min(1).max(60),
  tags: tagList,
  avoidTags: tagList,
  targetTags: tagList,
  targetObjectId: z.string().min(1).max(160).optional(),
  routeObjectId: z.string().min(1).max(160).optional(),
  role: z.string().trim().max(120).optional(),
  intent: z.string().trim().max(2000).optional(),
  plan: lifePlanSchema.optional(),
});

const lifeGroupsSchema = z.array(lifeGroupSchema).max(12).superRefine((groups, context) => {
  if (new Set(groups.map(group => group.id)).size !== groups.length) context.addIssue({ code: "custom", message: "演绎群组 ID 不能重复" });
});

export const lifeScenarioSchema = z.strictObject({
  id: z.string().min(1).max(160),
  name: z.string().trim().min(1).max(160),
  instruction: z.string().trim().max(2000),
  enabled: z.boolean(),
});
const lifeScenariosSchema = z.array(lifeScenarioSchema).max(12).superRefine((scenarios, context) => {
  if (new Set(scenarios.map(scenario => scenario.id)).size !== scenarios.length) context.addIssue({ code: "custom", message: "活动方案 ID 不能重复" });
});

export const sceneLifeSettingsSchema = z.strictObject({
  enabled: z.boolean(),
  running: z.boolean(),
  speed: z.number().finite().min(0.25).max(4),
  seed: z.number().int().min(0).max(2147483647),
  time: z.number().finite().min(0).max(86400),
  center: vector,
  radius: z.number().finite().min(4).max(60),
  scenarios: lifeScenariosSchema.optional(),
  groups: lifeGroupsSchema.optional(),
  tracks: storedPerformanceTracksSchema.optional(),
});

function normalizeLifeComposition(value?: Partial<SceneLife>): { groups: LifeGroup[]; scenarios: LifeScenario[] } {
  return { groups: getLifeGroups(value), scenarios: (value?.scenarios ?? []).map(scenario => ({ ...scenario })) };
}

function validateLifeComposition(value: Partial<z.infer<typeof sceneLifeSettingsSchema>>, context: z.RefinementCtx) {
  const composition = normalizeLifeComposition(value);
  const scenarios = new Map(composition.scenarios.map(scenario => [scenario.id, scenario]));
  let count = 0;
  for (const [index, track] of (value.tracks ?? []).entries()) {
    if (track.objectId && track.enabled !== false) count++;
  }
  for (const [index, group] of (value.tracks ? [] : composition.groups).entries()) {
    if (group.scenarioId && !scenarios.has(group.scenarioId)) context.addIssue({ code: "custom", path: ["groups", index, "scenarioId"], message: "群组所属活动方案不存在" });
    if (group.enabled && (!group.scenarioId || scenarios.get(group.scenarioId)?.enabled)) count += group.count;
  }
  if (count > 240) context.addIssue({ code: "custom", path: ["groups"], message: "启用的演绎实例总数不能超过 240" });
  if (composition.scenarios.length > 12) context.addIssue({ code: "custom", path: ["scenarios"], message: "活动方案总数不能超过 12" });
}

export const sceneLifeSchema = sceneLifeSettingsSchema.superRefine(validateLifeComposition);
export const lifePatchSchema = sceneLifeSettingsSchema.partial().superRefine((value, context) => {
  // ACT: 部分更新缺少另一半配置时由合并后的完整 SceneLife 校验引用和人数。
  if ((value.groups || value.tracks) && value.scenarios) validateLifeComposition(value, context);
}).refine(value => Object.keys(value).length > 0, "至少提供一个演绎设置");
export type SceneNavigation = z.infer<typeof navigationSchema>;
export type SceneLife = z.infer<typeof sceneLifeSchema>;
export type LifeGroup = z.infer<typeof lifeGroupSchema>;
export type LifeScenario = z.infer<typeof lifeScenarioSchema>;
export type LifeAnchor = z.infer<typeof lifeAnchorSchema>;
export type LifeActivity = z.infer<typeof lifeActivitySchema>;
export type LifePlan = z.infer<typeof lifePlanSchema>;
export type ResolvedSceneLife = SceneLife & { groups: LifeGroup[]; scenarios: LifeScenario[] };
export type LifeStatus = { pedestrians: number; vehicles: number; roads: number; animals?: number; groups?: { id: string; name: string; count: number; requested: number; startTime?: number; completed?: boolean; activity?: string; blocked?: string }[]; playbackRange?: { start: number; end: number }; message: string };
export type LifePlanningContext = {
  objects: { objectId: string; name: string; tags: string[]; bounds: { min: Vector3Value; max: Vector3Value }; effectParts?: { id: string; name: string }[]; approaches: { anchor: LifeAnchor; position: Vector3Value; surface: "ground" | "water"; reachability: "notChecked" }[] }[];
  shores: { anchor: LifeAnchor; position: Vector3Value; surface: "ground"; reachability: "notChecked" }[];
  unavailableObjectIds: string[];
  execution: LifeStatus;
  note: string;
};

export function getLifeGroups(value?: Partial<SceneLife>): LifeGroup[] {
  if (value?.groups) return value.groups.map(group => ({ ...group, visual: { ...group.visual }, center: { ...group.center }, tags: [...group.tags], avoidTags: [...group.avoidTags], targetTags: [...group.targetTags], ...(group.plan ? { plan: JSON.parse(JSON.stringify(group.plan)) as LifePlan } : {}) }));
  return [];
}

export function getSceneLife(value?: SceneLife): ResolvedSceneLife {
  const { groups, scenarios } = normalizeLifeComposition(value);
  return {
    enabled: false, running: true, speed: 1, seed: 1, time: 0, radius: 20,
    ...value,
    groups, scenarios,
    center: { ...(value?.center ?? { x: 0, y: 0, z: 0 } as Vector3Value) },
  };
}
