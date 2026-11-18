import { z } from "@toonflow/nodes-scaffold/runtime";
import type { LifeAnchor, LifeGroup, SceneLife } from "./lifeDocument";
import type { SceneObject, SceneObjectGroup } from "./sceneDocument";
import { skeletalMotionSchema } from "./skeletalMotion";
import { getPerformanceClips, materializePerformanceTrack, performanceClipSchema } from "./performanceClips";
import { getCharacterAnimation } from "./characterAnimations";

const coordinate = z.number().finite().min(-10000).max(10000);
const identifier = z.string().trim().min(1).max(160);
export const performancePointSchema = z.tuple([coordinate, coordinate, coordinate]);
export const performanceEventSchema = z.strictObject({
  at: z.number().int().min(0).max(63),
  text: z.string().trim().min(1).max(160),
  seconds: z.number().finite().min(0).max(300).optional(),
  action: z.enum(["wait", "interact", "work", "rest", "graze", "observe"]).optional(),
  target: identifier.optional(),
  motion: skeletalMotionSchema.optional(),
  animation: identifier.optional(),
  sourceIn: z.number().finite().min(0).max(86400).optional(),
  sourceOut: z.number().finite().min(0).max(86400).optional(),
  rate: z.number().finite().min(0.1).max(8).optional(),
  clipId: identifier.optional(),
  clipKind: z.enum(["move", "pose"]).optional(),
  clipOrigin: performancePointSchema.optional(),
});
const performanceTrackFields = z.strictObject({
  id: identifier,
  objectId: identifier,
  name: z.string().trim().min(1).max(160).optional(),
  scenarioId: identifier.optional(),
  points: z.array(performancePointSchema).min(1).max(64),
  events: z.array(performanceEventSchema).max(64).optional(),
  startAt: z.number().int().min(0).max(86399).optional(),
  segmentSeconds: z.array(z.number().finite().min(0).max(86400)).max(64).optional(),
  teleports: z.array(z.number().int().min(0).max(63)).max(64).optional(),
  inertias: z.array(z.number().finite().min(0).max(1)).max(64).optional(),
  speed: z.number().finite().min(0.1).max(30).optional(),
  // path：严格沿画的线走（贴地、不寻路绕行），车辆、道具等大物体默认用它，不会因为导航网格卡住。
  mode: z.enum(["ground", "road", "air", "water", "path"]).optional(),
  // 飞檐走壁（轻功、跑酷）：路径点可以放在屋顶、屋脊、墙头、桌面上；走得通且不绕远就走，否则飞身跨过去（上房、跨巷、翻墙、跃下）。
  parkour: z.boolean().optional(),
  loop: z.boolean().optional(),
  enabled: z.boolean().optional(),
  controller: z.literal("object").optional(),
  clips: z.array(performanceClipSchema).max(128).optional(),
});
function validateTrack(track: z.infer<typeof performanceTrackFields>, context: z.RefinementCtx) {
  if (track.controller === "object" && track.loop) context.addIssue({ code: "custom", path: ["loop"], message: "独立物件片段当前仅支持单次播放" });
  if (track.clips && new Set(track.clips.map(clip => clip.id)).size !== track.clips.length) context.addIssue({ code: "custom", path: ["clips"], message: "同一主体的片段ID不能重复" });
  if (track.controller !== "object" && track.clips?.some(clip => clip.enabled !== false && clip.trigger)) context.addIssue({ code: "custom", path: ["clips"], message: "人物移动与动作按本轨start排期，trigger仅支持独立物件片段" });
  if (track.clips?.some(clip => track.controller === "object" ? clip.kind === "move" : clip.kind === "transform" || clip.kind === "attach" || clip.kind === "effect")) context.addIssue({ code: "custom", path: ["clips"], message: "导航轨道使用move/pose；直接控制轨道使用transform/attach/effect及人物pose" });
  const motionFrames = track.clips ? track.clips.reduce((count, clip) => count + (clip.kind === "pose" ? clip.motion?.keyframes.length ?? 0 : 0), 0) : (track.events ?? []).reduce((count, event) => count + (event.motion?.keyframes.length ?? 0), 0);
  if (motionFrames > 256) context.addIssue({ code: "custom", path: [track.clips ? "clips" : "events"], message: "单条演绎的骨骼关键帧总数不能超过256" });
  if ((track.segmentSeconds?.length ?? 0) > track.points.length) context.addIssue({ code: "custom", path: ["segmentSeconds"], message: "分段用时数量不能超过路径点数" });
  if ((track.teleports ?? []).some(index => index >= track.points.length - 1)) context.addIssue({ code: "custom", path: ["teleports"], message: "瞬移分段必须对应有效且非末段的路径段" });
  if (new Set(track.teleports ?? []).size !== (track.teleports ?? []).length) context.addIssue({ code: "custom", path: ["teleports"], message: "瞬移分段不能重复" });
  if ((track.inertias?.length ?? 0) > track.points.length) context.addIssue({ code: "custom", path: ["inertias"], message: "惯性数量不能超过路径点数" });
  const points = new Set<number>();
  for (const [index, event] of (track.events ?? []).entries()) {
    if (event.at >= track.points.length || points.has(event.at)) context.addIssue({ code: "custom", path: ["events", index, "at"], message: "关键事件必须对应有效且不重复的路径点" });
    points.add(event.at);
  }
}
export const performanceTrackSchema = performanceTrackFields.superRefine(validateTrack);
export const performanceToolTrackSchema = performanceTrackFields.omit({ scenarioId: true }).superRefine(validateTrack);
export const performanceAnimationTrackSchema = performanceTrackFields.omit({ scenarioId: true, points: true }).extend({
  points: z.array(performancePointSchema).min(1).max(64).optional(),
  clips: z.array(performanceClipSchema).min(1).max(128),
}).superRefine((track, context) => validateTrack({ ...track, points: track.points ?? [[0, 0, 0]] }, context));
function validateTrackIds(tracks: { id: string; objectId?: string; events?: PerformanceEvent[]; clips?: z.infer<typeof performanceClipSchema>[] }[], context: z.RefinementCtx) {
  if (new Set(tracks.map(track => track.id)).size !== tracks.length) context.addIssue({ code: "custom", message: "演绎个体 ID 不能重复" });
  const ids = tracks.flatMap(track => track.objectId ? [track.objectId] : []);
  if (ids.length > 240) context.addIssue({ code: "custom", message: "真实物体动线总数不能超过 240" });
  if (new Set(ids).size !== ids.length) context.addIssue({ code: "custom", message: "同一个场景物体不能同时绑定多条演绎动线" });
  if (tracks.reduce((count, track) => count + (track.clips?.filter(clip => clip.kind === "effect").length ?? 0), 0) > 128) context.addIssue({ code: "custom", message: "场景效果片段总数不能超过128，请删除不需要的效果片段" });
  if (tracks.reduce((count, track) => count + (track.clips ? track.clips.reduce((total, clip) => total + (clip.kind === "pose" ? clip.motion?.keyframes.length ?? 0 : 0), 0) : (track.events ?? []).reduce((total, event) => total + (event.motion?.keyframes.length ?? 0), 0)), 0) > 4096) context.addIssue({ code: "custom", message: "场景演绎的骨骼关键帧总数不能超过4096" });
}
export const performanceTracksSchema = z.array(performanceTrackSchema).max(240).superRefine(validateTrackIds);
export const storedPerformanceTracksSchema = performanceTracksSchema;
export type PerformancePoint = z.infer<typeof performancePointSchema>;
export type PerformanceEvent = z.infer<typeof performanceEventSchema>;
export type PerformanceTrack = z.infer<typeof performanceTrackSchema>;
export type StoredPerformanceTrack = PerformanceTrack;

export function getPerformanceEventDuration(event: PerformanceEvent) {
  if (event.seconds !== undefined) return event.seconds;
  // 与getPerformanceClips保持一致：动画库事件按库时长计算，避免时间轴锚点和编辑窗到达时间不一致。
  const library = event.animation ? getCharacterAnimation(event.animation) : undefined;
  const sourceIn = event.sourceIn ?? 0;
  const sourceOut = event.sourceOut ?? library?.duration ?? event.motion?.keyframes.at(-1)?.time ?? 3;
  return (sourceOut - sourceIn) / (event.rate ?? 1);
}

export function getPerformanceSegmentLength(track: PerformanceTrack, index: number) {
  const from = track.points[index];
  const to = track.points[index + 1];
  return from && to ? Math.hypot(to[0] - from[0], to[1] - from[1], to[2] - from[2]) : 0;
}

/** 单次真实预演最多请求的轨道数；群演多时由worldRehearse按这个数分批。 */
export const maxRehearsalTracks = 60;

/** 轨道默认速度：车道5.5；飞檐走壁的人默认“飞快”（飞身按直线距离计时，不会像慢动作）；其余步行1.35。 */
export function getPerformanceDefaultSpeed(track: Pick<PerformanceTrack, "speed" | "mode" | "parkour">) {
  return track.speed ?? (track.mode === "road" ? 5.5 : track.parkour ? 5 : 1.35);
}

// 锚点编辑窗按直线距离估算未显式指定用时的分段；实际导航路网可能更长，编辑到达时间仍写入真实分段用时。飞身段播放时也按这个直线用时飞。
export function getPerformanceSegmentDuration(track: PerformanceTrack, index: number) {
  if (track.teleports?.includes(index)) return 0;
  const seconds = track.segmentSeconds?.[index] ?? 0;
  if (seconds > 0) return seconds;
  return getPerformanceSegmentLength(track, index) / getPerformanceDefaultSpeed(track);
}

export function getPerformancePointArrival(track: PerformanceTrack, index: number) {
  let seconds = 0;
  for (let cursor = 0; cursor < index && cursor < track.points.length - 1; cursor++) {
    seconds += getPerformanceSegmentDuration(track, cursor);
    const event = track.events?.find(item => item.at === cursor);
    if (event) seconds += getPerformanceEventDuration(event);
  }
  return seconds;
}

export function validatePerformanceReferences(tracks: readonly StoredPerformanceTrack[], objects: SceneObject[], groups: readonly SceneObjectGroup[] = []) {
  const ids = new Set(objects.map(object => object.id));
  const riggedIds = new Set(objects.filter(object => object.asset.shape === "riggedPerson").map(object => object.id));
  // 胶囊人有头、身子、腿三段关节：能播自编骨骼动作（motion），不能播骨骼人物的动作库动画（animation）。
  const capsuleIds = new Set(objects.filter(object => object.asset.shape === "person").map(object => object.id));
  const posable = (id: string) => riggedIds.has(id) || capsuleIds.has(id);
  for (const track of tracks) {
    if (!track.objectId) continue;
    if (!ids.has(track.objectId)) throw new Error("演绎引用的场景物体不存在：" + track.objectId);
    if (track.enabled === false) continue;
    // 只是标记时间的姿态片段（说话、站着、看着：没有动作库也没有骨骼动作）胶囊人也能挂，导演工具靠它记台词时间、分镜按它切镜。
    if (track.controller === "object" && track.clips?.some(clip => clip.enabled !== false && clip.kind === "pose" && clip.animation) && !riggedIds.has(track.objectId)) throw new Error("直接控制的动作库动作须绑定场景中的骨骼人物：" + track.objectId);
    if (track.controller === "object" && track.clips?.some(clip => clip.enabled !== false && clip.kind === "pose" && clip.motion) && !posable(track.objectId)) throw new Error("直接控制的骨骼动作须绑定场景中的骨骼人物或胶囊人：" + track.objectId);
    for (const event of track.clips ? [] : track.events ?? []) {
      if (event.target && !ids.has(event.target)) throw new Error("关键事件引用的目标不存在：" + event.target);
      if (event.animation && !getCharacterAnimation(event.animation)) throw new Error("动作库片段不存在：" + event.animation);
    }
    if (track.events?.some(event => event.motion) && !getPerformanceObjectIds(track.objectId, groups).some(posable)) throw new Error("自定义骨骼动作须绑定场景中的骨骼人物、胶囊人或包含它们的分组：" + track.objectId);
    if (track.clips?.some(clip => clip.kind === "pose" && clip.animation) && !getPerformanceObjectIds(track.objectId, groups).some(id => riggedIds.has(id))) throw new Error("动作库片段须绑定场景中的骨骼人物：" + track.objectId);
    if (track.clips?.some(clip => clip.kind === "pose" && clip.motion) && !getPerformanceObjectIds(track.objectId, groups).some(posable)) throw new Error("骨骼动作片段须绑定场景中的骨骼人物或胶囊人：" + track.objectId);
    for (const clip of track.clips ?? []) {
      if (clip.enabled === false) continue;
      if (clip.kind === "attach" && (!ids.has(clip.targetId) || clip.targetId === track.objectId)) throw new Error("附着目标不存在或指向自身：" + clip.id);
      if (clip.kind === "pose" && clip.target && !ids.has(clip.target)) throw new Error("动作面向的物体不存在：" + clip.target);
      if (clip.kind === "pose" && clip.animation) {
        const animation = getCharacterAnimation(clip.animation);
        if (!animation || Math.abs(animation.duration - clip.sourceDuration) > 0.001) throw new Error("动作库片段或源时长不匹配：" + clip.animation);
      }
      if (!clip.trigger) continue;
      const source = tracks.find(source => source.id === clip.trigger!.trackId);
      const object = objects.find(object => object.id === source?.objectId);
      if (!source?.objectId || !object || source.id === track.id || !getPerformanceClips(source as PerformanceTrack, object).some(sourceClip => sourceClip.id === clip.trigger!.clipId)) throw new Error("片段触发源不存在或指向自身：" + clip.id);
    }
  }
  function validateAcyclic(edges: Map<string, Set<string>>, message: string) {
    const visiting = new Set<string>();
    const visited = new Set<string>();
    function visit(id: string) {
      if (visiting.has(id)) throw new Error(message);
      if (visited.has(id)) return;
      visiting.add(id);
      for (const target of edges.get(id) ?? []) visit(target);
      visiting.delete(id); visited.add(id);
    }
    for (const id of edges.keys()) visit(id);
  }
  const triggerEdges = new Map<string, Set<string>>();
  const attachmentEdges = new Map<string, Set<string>>();
  for (const track of tracks) for (const clip of track.clips ?? []) {
    if (track.enabled === false || clip.enabled === false) continue;
    if (clip.trigger) { const targets = triggerEdges.get(track.id) ?? new Set<string>(); targets.add(clip.trigger.trackId); triggerEdges.set(track.id, targets); }
    if (clip.kind === "attach" && track.objectId) { const targets = attachmentEdges.get(track.objectId) ?? new Set<string>(); targets.add(clip.targetId); attachmentEdges.set(track.objectId, targets); }
  }
  validateAcyclic(triggerEdges, "物件片段不能互相循环等待触发");
  validateAcyclic(attachmentEdges, "物件不能互相循环附着");
}

function existingTracks(tracks: readonly StoredPerformanceTrack[], objects: SceneObject[]): PerformanceTrack[] {
  const ids = new Set(objects.map(object => object.id));
  return tracks.filter(track => ids.has(track.objectId)).map(track => normalizeOpenRoute(performanceTrackSchema.parse(track)));
}
// ACT: 动线是开放路径；历史的 loop 标记与回到起点的重复末点都还原成普通开放路线。
function normalizeOpenRoute(track: PerformanceTrack): PerformanceTrack {
  if (track.clips?.length || track.points.length < 2) return track.loop ? { ...track, loop: false } : track;
  if (track.points.length < 3) return { ...track, loop: false };
  const first = track.points[0]!;
  const last = track.points[track.points.length - 1]!;
  if (Math.hypot(last[0] - first[0], last[1] - first[1], last[2] - first[2]) > 0.001) return { ...track, loop: false };
  const points = track.points.slice(0, -1);
  const segmentSeconds = track.segmentSeconds ? track.segmentSeconds.slice(0, Math.min(track.segmentSeconds.length, points.length - 1)) : undefined;
  const events = track.events?.filter(event => event.at < points.length);
  const inertias = track.inertias?.slice(0, points.length);
  const teleports = track.teleports?.filter(value => value < points.length - 1);
  return {
    ...track, loop: false, points,
    ...(segmentSeconds ? { segmentSeconds } : {}),
    ...(events ? { events } : {}),
    ...(inertias ? { inertias } : {}),
    ...(teleports ? { teleports } : {}),
  };
}
export function getPerformanceObjectIds(objectId: string, groups: readonly SceneObjectGroup[] = []): readonly string[] {
  return groups.find(group => group.objectIds.includes(objectId))?.objectIds ?? [objectId];
}
export function getPerformanceSubjectIds(track: PerformanceTrack, tracks: readonly PerformanceTrack[], groups: readonly SceneObjectGroup[] = []): readonly string[] {
  if (track.controller === "object") return [track.objectId];
  const independent = new Set(tracks.filter(value => value.controller === "object").map(value => value.objectId));
  return getPerformanceObjectIds(track.objectId, groups).filter(id => id === track.objectId || !independent.has(id));
}
export function getPerformanceTracks(life?: SceneLife, objects: SceneObject[] = [], groups: readonly SceneObjectGroup[] = []): PerformanceTrack[] {
  const tracks = existingTracks(life?.tracks ?? [], objects);
  if (!groups.length) return tracks;
  const memberships = new Map(groups.flatMap(group => group.objectIds.map(id => [id, group.id] as const)));
  const visible = new Set(objects.filter(object => object.visible).map(object => object.id));
  const selected = new Map<string, PerformanceTrack>();
  for (const track of tracks) {
    const groupId = memberships.get(track.objectId);
    const key = groupId && track.controller !== "object" ? "group:" + groupId : "object:" + track.objectId;
    const previous = selected.get(key);
    if (!previous || (previous.enabled === false || !visible.has(previous.objectId)) && track.enabled !== false && visible.has(track.objectId)) selected.set(key, track);
  }
  return [...selected.values()];
}
export function mergePerformanceTracks(life: SceneLife | undefined, tracks: PerformanceTrack[], objects: SceneObject[]): StoredPerformanceTrack[] {
  const activeIds = new Set(getPerformanceTracks(life, objects).map(track => track.id));
  const remaining = new Map(tracks.map(track => [track.id, track]));
  const result = (life?.tracks ?? []).flatMap<StoredPerformanceTrack>(track => {
    const updated = remaining.get(track.id);
    remaining.delete(track.id);
    return updated ? [updated] : activeIds.has(track.id) ? [] : [track];
  });
  return [...result, ...remaining.values()];
}

export function compilePerformanceTracks(tracks: readonly StoredPerformanceTrack[], objects: SceneObject[] = []): LifeGroup[] {
  const sources = new Map(objects.map(object => [object.id, object]));
  return existingTracks(tracks, objects).filter(track => track.controller !== "object").map(track => materializePerformanceTrack(track, sources.get(track.objectId)!)).map(track => {
    const source = sources.get(track.objectId)!;
    const mode = track.mode ?? "ground";
    const minX = Math.min(source.position.x, ...track.points.map(point => point[0]));
    const maxX = Math.max(source.position.x, ...track.points.map(point => point[0]));
    const minZ = Math.min(source.position.z, ...track.points.map(point => point[2]));
    const maxZ = Math.max(source.position.z, ...track.points.map(point => point[2]));
    const center = { x: (minX + maxX) / 2, y: 0, z: (minZ + maxZ) / 2 };
    const radius = Math.max(4, Math.hypot(source.position.x - center.x, source.position.z - center.z) + 3, ...track.points.map(point => Math.hypot(point[0] - center.x, point[2] - center.z) + 3));
    const events = new Map(track.events?.map(event => [event.at, event]));
    // ACT: 瞬移段的起止点都必须是独立步骤，否则中间锚点会被合并进同一段导航而无法瞬移。
    const teleportStops = new Set((track.teleports ?? []).flatMap(index => [index, index + 1]));
    const stops = track.points.map((_, index) => index).filter(index => index === 0 || index === track.points.length - 1 || events.has(index) || teleportStops.has(index));
    const anchorAt = (point: PerformancePoint): LifeAnchor => ({ kind: "point", position: { x: point[0], y: point[1], z: point[2] } });
    return {
      id: track.id, name: track.name ?? source.name, enabled: track.enabled !== false && source.visible, count: 1,
      visual: { kind: "object", objectId: track.objectId },
      locomotion: mode === "path" ? "air" : mode, ...(mode === "path" ? { groundFollow: true } : {}), ...(track.parkour && mode === "ground" ? { parkour: true } : {}), behavior: "idle", speed: getPerformanceDefaultSpeed(track), center, radius,
      verticalOffset: 0, perceptionRadius: 12, tags: [], avoidTags: [], targetTags: [],
      plan: { summary: track.name ?? source.name, loop: track.loop === true, steps: stops.map((index, stopIndex) => {
        const event = events.get(index);
        const via = track.points.slice((stops[stopIndex - 1] ?? -1) + 1, index).map(anchorAt);
        return { id: "point" + index, ...(event?.clipId ? { clipId: event.clipId, clipKind: event.clipKind } : {}), ...(event?.clipOrigin ? { clipOrigin: { x: event.clipOrigin[0], y: event.clipOrigin[1], z: event.clipOrigin[2] } } : {}), label: event?.text ?? "路径点 " + (index + 1), anchor: anchorAt(track.points[index]!), ...(via.length ? { via } : {}), spread: 0.3, duration: event ? getPerformanceEventDuration(event) : 0, action: event?.action ?? (event?.target ? "interact" : "wait"), ...(event?.target ? { face: { kind: "object" as const, objectId: event.target } } : {}) };
      }) },
    };
  });
}

/**
 * 在第index段（第index点到第index+1点）中间插入point，fraction是它在这段里走过的比例（0–1）。
 * 这段原用时按比例分给前后两半；之后的分段用时、事件、瞬移、惯性都顺移一位。
 */
export function insertPerformancePoint(track: PerformanceTrack, index: number, point: PerformancePoint, fraction: number): Pick<PerformanceTrack, "points" | "segmentSeconds" | "events" | "teleports" | "inertias"> {
  if (index < 0 || index >= track.points.length - 1) throw new Error("只能在两个路径点之间加点");
  if (track.teleports?.includes(index)) throw new Error("瞬移段不能插入路径点");
  if (track.points.length >= 64) throw new Error("一条动线最多64个路径点");
  const split = Math.max(0.01, Math.min(0.99, fraction));
  const duration = getPerformanceSegmentDuration(track, index);
  const explicit = (track.segmentSeconds?.[index] ?? 0) > 0;
  const segmentSeconds = Array.from({ length: track.points.length }, (_, cursor) => {
    if (cursor < index) return track.segmentSeconds?.[cursor] ?? 0;
    // 原来是自动速度的段保持自动；写过用时的段按比例拆开。
    if (cursor === index) return explicit ? Math.max(0.1, Math.round(duration * split * 10) / 10) : 0;
    if (cursor === index + 1) return explicit ? Math.max(0.1, Math.round(duration * (1 - split) * 10) / 10) : 0;
    return track.segmentSeconds?.[cursor - 1] ?? 0;
  });
  let inertias = track.inertias ? [...track.inertias] : undefined;
  if (inertias) {
    while (inertias.length < track.points.length) inertias.push(0);
    inertias.splice(index + 1, 0, 0);
  }
  return {
    points: [...track.points.slice(0, index + 1), point, ...track.points.slice(index + 1)],
    segmentSeconds: segmentSeconds.some(value => value > 0) ? segmentSeconds : undefined,
    events: track.events?.map(event => ({ ...event, at: event.at > index ? event.at + 1 : event.at })),
    teleports: track.teleports?.map(value => value > index ? value + 1 : value),
    inertias,
  };
}
