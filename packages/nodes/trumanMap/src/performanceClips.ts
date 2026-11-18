import { z } from "@toonflow/nodes-scaffold/runtime";
import { skeletalMotionSchema } from "./skeletalMotion";
import { getPerformanceDefaultSpeed, type PerformanceEvent, type PerformanceTrack } from "./performanceDocument";
import type { SceneObject } from "./sceneDocument";
import { getCharacterAnimation } from "./characterAnimations";

const coordinate = z.number().finite().min(-10000).max(10000);
const vector = z.tuple([coordinate, coordinate, coordinate]);
const seconds = z.number().finite().min(0).max(86400);
const identifier = z.string().trim().min(1).max(160);
const clipFields = {
  id: identifier,
  name: z.string().trim().min(1).max(160),
  start: seconds,
  sourceDuration: z.number().finite().min(0.001).max(86400),
  sourceIn: seconds,
  sourceOut: seconds,
  rate: z.number().finite().min(0.1).max(8),
  enabled: z.boolean().optional(),
  trigger: z.strictObject({ trackId: identifier, clipId: identifier }).optional(),
};
const transformFrame = z.strictObject({
  time: seconds,
  position: vector.optional(),
  rotation: vector.optional(),
  scale: z.tuple([z.number().finite().positive().max(1000), z.number().finite().positive().max(1000), z.number().finite().positive().max(1000)]).optional(),
});
export const performanceEffectClipSchema = z.strictObject({
  ...clipFields,
  kind: z.literal("effect"),
  effect: z.enum(["fire", "smoke", "explosion"]),
  intensity: z.number().finite().min(0.1).max(3).optional(),
  offset: vector.optional(),
  parts: z.array(identifier).min(1).max(32).refine(parts => new Set(parts).size === parts.length, "飞散部件不能重复").optional(),
  strength: z.number().finite().min(0.1).max(30).optional(),
});
export const performanceClipSchema = z.discriminatedUnion("kind", [
  z.strictObject({ ...clipFields, kind: z.literal("move"), points: z.array(vector).min(2).max(64), mode: z.enum(["ground", "road", "air", "water", "path"]).optional(), traversal: z.enum(["auto", "walk", "crouch", "jump", "climb", "vault"]).optional() }),
  z.strictObject({ ...clipFields, kind: z.literal("pose"), motion: skeletalMotionSchema.optional(), animation: identifier.optional(), action: z.enum(["wait", "interact", "work", "rest", "graze", "observe"]).optional(), target: identifier.optional() }),
  z.strictObject({ ...clipFields, kind: z.literal("transform"), pivot: vector.optional(), keyframes: z.array(transformFrame).min(2).max(64) }),
  z.strictObject({ ...clipFields, kind: z.literal("attach"), targetId: identifier, bone: identifier.optional(), position: vector.optional(), rotation: vector.optional() }),
  performanceEffectClipSchema,
]).superRefine((clip, context) => {
  if (clip.sourceIn >= clip.sourceOut || clip.sourceOut > clip.sourceDuration) context.addIssue({ code: "custom", path: ["sourceOut"], message: "源区间须满足0≤入点<出点≤源时长" });
  if (clip.kind === "transform") {
    if (clip.keyframes[0]!.time !== 0) context.addIssue({ code: "custom", path: ["keyframes"], message: "物件动画首帧时间必须为0" });
    for (let index = 0; index < clip.keyframes.length; index++) {
      const frame = clip.keyframes[index]!;
      if (frame.time > clip.sourceDuration || index && frame.time <= clip.keyframes[index - 1]!.time) context.addIssue({ code: "custom", path: ["keyframes", index, "time"], message: "关键帧时间须严格递增且不超过源时长" });
      if (!frame.position && !frame.rotation && !frame.scale) context.addIssue({ code: "custom", path: ["keyframes", index], message: "关键帧须包含位置、旋转或缩放" });
    }
  }
  if (clip.kind === "effect" && clip.effect !== "explosion" && (clip.parts || clip.strength !== undefined)) context.addIssue({ code: "custom", path: ["parts"], message: "部件飞散与初速度只用于爆炸片段" });
});
export type PerformanceClip = z.infer<typeof performanceClipSchema>;
export type PerformanceEffectClip = Extract<PerformanceClip, { kind: "effect" }>;

export function getPerformanceClipDuration(clip: PerformanceClip) { return (clip.sourceOut - clip.sourceIn) / clip.rate; }
export function getPerformanceClipSourceTime(clip: PerformanceClip, elapsed: number) {
  return Math.max(clip.sourceIn, Math.min(clip.sourceOut, clip.sourceIn + Math.max(0, elapsed) * clip.rate));
}
export function splitPerformanceClip(clip: PerformanceClip, time: number): [PerformanceClip, PerformanceClip] {
  const duration = getPerformanceClipDuration(clip);
  if (!Number.isFinite(time) || time <= clip.start + 0.001 || time >= clip.start + duration - 0.001) throw new Error("切分点必须在片段内部");
  const sourceTime = getPerformanceClipSourceTime(clip, time - clip.start);
  return [{ ...clip, sourceOut: sourceTime }, { ...clip, id: crypto.randomUUID(), start: time, sourceIn: sourceTime }];
}

export function disableDependentPerformanceClips(tracks: readonly PerformanceTrack[], removedTrackId: string, removedClipId?: string): PerformanceTrack[] {
  const disabled = new Set<string>();
  const key = (trackId: string, clipId: string) => JSON.stringify([trackId, clipId]);
  const pending = removedClipId ? [key(removedTrackId, removedClipId)] : [];
  const dependents = new Map<string, { trackId: string; clipId: string }[]>();
  for (const track of tracks) for (const clip of track.clips ?? []) {
    if (!clip.trigger) continue;
    const source = key(clip.trigger.trackId, clip.trigger.clipId);
    const values = dependents.get(source) ?? [];
    values.push({ trackId: track.id, clipId: clip.id });
    dependents.set(source, values);
    if (!removedClipId && clip.trigger.trackId === removedTrackId) pending.push(source);
  }
  while (pending.length) {
    const source = pending.pop()!;
    for (const clip of dependents.get(source) ?? []) {
      const target = key(clip.trackId, clip.clipId);
      if (disabled.has(target)) continue;
      disabled.add(target); pending.push(target);
    }
  }
  return tracks.map(track => disabled.size && track.clips?.some(clip => disabled.has(key(track.id, clip.id))) ? { ...track, clips: track.clips.map(clip => disabled.has(key(track.id, clip.id)) ? { ...clip, enabled: false } : clip) } : track);
}

function distance(left: readonly number[], right: readonly number[]) { return Math.hypot(left[0]! - right[0]!, left[1]! - right[1]!, left[2]! - right[2]!); }
function objectPoint(object: SceneObject): [number, number, number] { return [object.position.x, object.position.y, object.position.z]; }

// ACT: 旧存档只在首次编辑时写入clips；读取不迁移、不开门、不修改模型初态。
export function getPerformanceClips(track: PerformanceTrack, object: SceneObject): PerformanceClip[] {
  if (track.clips) return track.clips;
  if (track.controller === "object") return [];
  const clips: PerformanceClip[] = [];
  let cursor = 0;
  let previous = objectPoint(object);
  for (let index = 0; index < track.points.length; index++) {
    const point = track.points[index]!;
    const length = distance(previous, point);
    const duration = index > 0 && track.segmentSeconds?.[index - 1] ? track.segmentSeconds[index - 1]! : length / getPerformanceDefaultSpeed(track);
    // ACT: 演绎起点由首点决定，运行时直接瞬移过去；瞬移分段同样不生成移动段。
    if (index > 0 && !track.teleports?.includes(index - 1) && length > 0.001 && duration > 0.001) {
      clips.push({ id: "move" + index, name: "移动 " + index, start: cursor, sourceDuration: duration, sourceIn: 0, sourceOut: duration, rate: 1, kind: "move", points: [previous, point], ...(track.mode ? { mode: track.mode } : {}) });
      cursor += duration;
    }
    const event = track.events?.find(event => event.at === index);
    if (event && event.seconds !== 0) {
      const library = event.animation ? getCharacterAnimation(event.animation) : undefined;
      const sourceIn = event.sourceIn ?? 0;
      const sourceOut = event.sourceOut ?? library?.duration ?? (event.seconds !== undefined ? sourceIn + event.seconds * (event.rate ?? 1) : event.motion?.keyframes.at(-1)?.time ?? 3);
      const sourceDuration = library?.duration ?? Math.max(sourceOut, event.motion?.keyframes.at(-1)?.time ?? 0);
      const rate = event.rate ?? (library && event.seconds ? (sourceOut - sourceIn) / event.seconds : 1);
      if (sourceOut > sourceIn) {
        const clip: PerformanceClip = { id: event.clipId ?? "event" + index, name: event.text, start: cursor, sourceDuration, sourceIn, sourceOut, rate, kind: "pose", ...(event.motion ? { motion: event.motion } : {}), ...(event.animation ? { animation: event.animation } : {}), ...(event.action ? { action: event.action } : {}), ...(event.target ? { target: event.target } : {}) };
        clips.push(clip);
        cursor += getPerformanceClipDuration(clip);
      }
    }
    previous = point;
  }
  return clips;
}

// 时间轴用：由已生成的move片段反推每个路径点的到达偏移，锚点与移动条边界严格对齐。
export function getPerformancePointOffsets(clips: PerformanceClip[], pointCount: number) {
  const offsets: number[] = [0];
  for (const clip of clips) {
    if (clip.kind !== "move") continue;
    const match = /^move(\d+)$/.exec(clip.id);
    if (!match) continue;
    const index = Number(match[1]);
    while (offsets.length <= index) offsets.push(offsets.at(-1)!);
    // 锚点取该段移动结束时刻（到达该点），而不是离开上一点的片段起点。
    offsets[index] = clip.start + getPerformanceClipDuration(clip);
  }
  while (offsets.length < pointCount) offsets.push(offsets.at(-1) ?? 0);
  return offsets.slice(0, pointCount);
}

function slicedPath(clip: Extract<PerformanceClip, { kind: "move" }>, sourceOut: number): [number, number, number][] {
  const lengths = [0];
  for (let index = 1; index < clip.points.length; index++) lengths.push(lengths.at(-1)! + distance(clip.points[index - 1]!, clip.points[index]!));
  const total = lengths.at(-1)!;
  const start = total * clip.sourceIn / clip.sourceDuration;
  const end = total * sourceOut / clip.sourceDuration;
  function pointAt(value: number): [number, number, number] {
    let index = 1;
    while (index < lengths.length - 1 && lengths[index]! < value) index++;
    const from = clip.points[index - 1]!, to = clip.points[index]!;
    const alpha = lengths[index]! > lengths[index - 1]! ? (value - lengths[index - 1]!) / (lengths[index]! - lengths[index - 1]!) : 0;
    return [0, 1, 2].map(axis => from[axis]! + (to[axis]! - from[axis]!) * alpha) as [number, number, number];
  }
  return [pointAt(start), ...clip.points.filter((_point, index) => lengths[index]! > start && lengths[index]! < end), pointAt(end)];
}

// ACT: 导航仍由既有Navcat/Yuka执行；片段时间是排期，碰撞或重新定位可延长实际执行。
export function materializePerformanceTrack(track: PerformanceTrack, object: SceneObject): PerformanceTrack {
  if (!track.clips || track.controller === "object") return track;
  const clips = track.clips.filter(clip => clip.enabled !== false && (clip.kind === "move" || clip.kind === "pose")).slice().sort((left, right) => left.start - right.start);
  const points: PerformanceTrack["points"] = [objectPoint(object)];
  const events: PerformanceEvent[] = [];
  const segmentSeconds: number[] = [];
  let cursor = 0;
  for (let index = 0; index < clips.length; index++) {
    const clip = clips[index]!;
    const duration = Math.min(getPerformanceClipDuration(clip), (clips[index + 1]?.start ?? Infinity) - clip.start);
    if (duration <= 0) continue;
    if (clip.start > cursor + 0.001) {
      points.push([...points.at(-1)!]);
      segmentSeconds.push(0);
      events.push({ at: points.length - 1, text: "等待片段开始", seconds: clip.start - cursor, action: "wait" });
    }
    const sourceOut = clip.sourceIn + duration * clip.rate;
    if (clip.kind === "move") {
      const path = slicedPath(clip, sourceOut);
      const destination = path.slice(1);
      let previous = path[0]!;
      const lengths = destination.map(point => { const length = distance(previous, point); previous = point; return length; });
      const length = lengths.reduce((sum, value) => sum + value, 0);
      for (let pathIndex = 0; pathIndex < destination.length; pathIndex++) {
        points.push(destination[pathIndex]!);
        segmentSeconds.push(length > 0.001 ? duration * lengths[pathIndex]! / length : 0);
      }
      if (!destination.length) { points.push([...points.at(-1)!]); segmentSeconds.push(0); }
      events.push({ at: points.length - 1, text: clip.name, seconds: 0, action: "wait", clipId: clip.id, clipKind: "move", clipOrigin: path[0]! });
    } else if (clip.kind === "pose") {
      points.push([...points.at(-1)!]);
      segmentSeconds.push(0);
      events.push({ at: points.length - 1, text: clip.name, seconds: duration, action: clip.action ?? "wait", clipId: clip.id, clipKind: "pose", sourceIn: clip.sourceIn, sourceOut, rate: clip.rate, ...(clip.motion ? { motion: clip.motion } : {}), ...(clip.animation ? { animation: clip.animation } : {}), ...(clip.target ? { target: clip.target } : {}) });
    }
    cursor = clip.start + duration;
  }
  return { ...track, clips: undefined, points, events, segmentSeconds, ...(clips.length ? {} : { enabled: false }) };
}

// ACT: 片段式动线（Agent或剪辑生成，路线存在各移动片段里）在场景里按时间首尾接成一条路线显示和拖动。
// 相邻两段移动首尾重合的点合成一个，拖它两段一起改；动作片段标在它之前最后一个路径点上。
export type ClipRouteRef = { clipId: string; index: number };
export type ClipRoute = { points: [number, number, number][]; refs: ClipRouteRef[][]; events: { at: number; text: string }[] };
type MoveClip = Extract<PerformanceClip, { kind: "move" }>;
export function getClipRoute(clips: readonly PerformanceClip[]): ClipRoute {
  const points: [number, number, number][] = [];
  const refs: ClipRouteRef[][] = [];
  const events: { at: number; text: string }[] = [];
  const pending: string[] = [];
  for (const clip of clips.filter(item => item.enabled !== false && (item.kind === "move" || item.kind === "pose")).sort((left, right) => left.start - right.start)) {
    if (clip.kind === "pose") {
      if (!points.length) { pending.push(clip.name); continue; }
      const at = points.length - 1;
      const event = events.find(item => item.at === at);
      if (event) event.text += " · " + clip.name; else events.push({ at, text: clip.name });
      continue;
    }
    if (clip.kind !== "move") continue;
    clip.points.forEach((point, index) => {
      const last = points.at(-1);
      if (index === 0 && last && distance(last, point) < 0.05) { refs.at(-1)!.push({ clipId: clip.id, index }); return; }
      points.push([point[0], point[1], point[2]]);
      refs.push([{ clipId: clip.id, index }]);
    });
  }
  if (pending.length && points.length) events.unshift({ at: 0, text: pending.join(" · ") + (events[0]?.at === 0 ? " · " + events.shift()!.text : "") });
  return { points, refs, events };
}
/** 把路线上第index个点挪到point：这个点涉及的每段移动片段一起改。 */
export function moveClipRoutePoint(clips: readonly PerformanceClip[], index: number, point: [number, number, number]): PerformanceClip[] {
  const refs = getClipRoute(clips).refs[index] ?? [];
  if (!refs.length) return [...clips];
  return clips.map(clip => {
    const hits = refs.filter(ref => ref.clipId === clip.id);
    if (!hits.length || clip.kind !== "move") return clip;
    return { ...clip, points: clip.points.map((value, cursor) => hits.some(ref => ref.index === cursor) ? [point[0], point[1], point[2]] : value) };
  });
}
/** 删掉路线上第index个点；某段移动只剩起点和终点时不能再删（那就删整段片段）。 */
export function removeClipRoutePoint(clips: readonly PerformanceClip[], index: number): PerformanceClip[] {
  const refs = getClipRoute(clips).refs[index] ?? [];
  if (!refs.length) throw new Error("这个点不在任何移动片段上");
  return clips.map(clip => {
    const hits = refs.filter(ref => ref.clipId === clip.id);
    if (!hits.length || clip.kind !== "move") return clip;
    const points = clip.points.filter((_, cursor) => !hits.some(ref => ref.index === cursor));
    if (points.length < 2) throw new Error(`“${clip.name}”只剩起点和终点，不能再删点；不要这段移动就在时间轴上删掉整个片段`);
    return { ...clip, points };
  });
}
/** 在移动片段的源时间sourceTime处（按路程匀速）插入一个路径点，返回新片段列表和插入点；那里已有点就直接返回它。 */
export function insertClipRoutePoint(clips: readonly PerformanceClip[], clipId: string, sourceTime: number): { clips: PerformanceClip[]; ref: ClipRouteRef } {
  const clip = clips.find(item => item.id === clipId);
  if (!clip || clip.kind !== "move") throw new Error("把播放头放到一段移动片段里再加点");
  if (clip.points.length >= 64) throw new Error("一段移动最多64个路径点");
  const lengths = [0];
  for (let index = 1; index < clip.points.length; index++) lengths.push(lengths.at(-1)! + distance(clip.points[index - 1]!, clip.points[index]!));
  const goal = lengths.at(-1)! * Math.max(0, Math.min(1, sourceTime / clip.sourceDuration));
  const near = lengths.findIndex(value => Math.abs(value - goal) < 0.05);
  if (near >= 0) return { clips: [...clips], ref: { clipId, index: near } };
  let index = 1;
  while (index < lengths.length - 1 && lengths[index]! < goal) index++;
  const from = clip.points[index - 1]!, to = clip.points[index]!;
  const alpha = lengths[index]! > lengths[index - 1]! ? (goal - lengths[index - 1]!) / (lengths[index]! - lengths[index - 1]!) : 0.5;
  const point = [0, 1, 2].map(axis => Math.round((from[axis]! + (to[axis]! - from[axis]!) * alpha) * 1000) / 1000) as [number, number, number];
  const next: MoveClip = { ...clip, points: [...clip.points.slice(0, index), point, ...clip.points.slice(index)] };
  return { clips: clips.map(item => item.id === clipId ? next : item), ref: { clipId, index } };
}
/** 路线上哪一个点对应ref（某段移动的第几个点）。 */
export function findClipRoutePoint(route: ClipRoute, ref: ClipRouteRef) {
  return route.refs.findIndex(refs => refs.some(item => item.clipId === ref.clipId && item.index === ref.index));
}
/** 在路线第segment段（第segment点到下一点）中间插入point：这一段属于哪段移动片段就插进哪段。 */
export function insertClipRouteSegmentPoint(clips: readonly PerformanceClip[], segment: number, point: [number, number, number]): { clips: PerformanceClip[]; ref: ClipRouteRef } {
  const route = getClipRoute(clips);
  const from = route.refs[segment] ?? [], to = route.refs[segment + 1] ?? [];
  const ref = from.find(left => to.some(right => right.clipId === left.clipId && right.index === left.index + 1));
  const clip = ref && clips.find(item => item.id === ref.clipId);
  if (!ref || !clip || clip.kind !== "move") throw new Error("这里是两段移动之间的空档，不能加点");
  if (clip.points.length >= 64) throw new Error("一段移动最多64个路径点");
  const next: MoveClip = { ...clip, points: [...clip.points.slice(0, ref.index + 1), [point[0], point[1], point[2]], ...clip.points.slice(ref.index + 1)] };
  return { clips: clips.map(item => item.id === clip.id ? next : item), ref: { clipId: clip.id, index: ref.index + 1 } };
}

// ACT: 片段式动线逐点的到达、停靠、速度，和手画的逐点动线同一套编辑语义：
// 改某点的到达/速度只改走到这一点的那段移动，后面的片段整体顺延；停靠是到达后、出发前的时间（动作片段+“停留”）。
// 一段移动中间的点要单独定时或停靠时，先在这一点把移动切成两段。
type PoseClip = Extract<PerformanceClip, { kind: "pose" }>;
const stayName = "停留";
function isStayClip(clip: PerformanceClip): clip is PoseClip { return clip.kind === "pose" && clip.name === stayName && (clip.action ?? "wait") === "wait" && !clip.animation && !clip.motion && !clip.target; }
function clipEnd(clip: PerformanceClip) { return clip.start + getPerformanceClipDuration(clip); }
function pathLength(points: readonly (readonly number[])[]) { let total = 0; for (let index = 1; index < points.length; index++) total += distance(points[index - 1]!, points[index]!); return total; }
function arcFractions(points: readonly (readonly number[])[]) {
  const lengths = [0];
  for (let index = 1; index < points.length; index++) lengths.push(lengths.at(-1)! + distance(points[index - 1]!, points[index]!));
  const total = lengths.at(-1)!;
  return lengths.map((value, index) => total > 0.000001 ? value / total : index / Math.max(1, points.length - 1));
}
function moveTimeAt(clip: MoveClip, index: number) {
  const source = arcFractions(clip.points)[index]! * clip.sourceDuration;
  return clip.start + (Math.min(Math.max(source, clip.sourceIn), clip.sourceOut) - clip.sourceIn) / clip.rate;
}
function round3(value: number) { return Math.round(value * 1000) / 1000; }
function shiftClipsFrom(clips: readonly PerformanceClip[], from: number, delta: number, keep: ReadonlySet<string>) {
  if (Math.abs(delta) < 0.0005) return [...clips];
  return clips.map(clip => !keep.has(clip.id) && clip.start >= from - 0.0005 ? { ...clip, start: Math.max(0, round3(clip.start + delta)) } : clip);
}
export type ClipRouteTiming = { route: ClipRoute; arrivals: number[]; departures: number[]; incoming: (string | undefined)[]; poses: string[][] };
/** 每个路线点的到达时刻、出发时刻（相对本轨），走到它的移动片段，以及停在它上面的动作片段。 */
export function getClipRouteTiming(clips: readonly PerformanceClip[]): ClipRouteTiming {
  const route = getClipRoute(clips);
  const byId = new Map(clips.map(clip => [clip.id, clip]));
  const move = (ref: ClipRouteRef | undefined) => { const clip = ref && byId.get(ref.clipId); return clip?.kind === "move" ? clip : undefined; };
  const arrivals: number[] = [], departures: number[] = [], incoming: (string | undefined)[] = [];
  const poses = route.points.map(() => [] as string[]);
  const hasOut: boolean[] = [];
  for (const refs of route.refs) {
    const into = refs.find(ref => ref.index > 0);
    const out = refs.find(ref => { const clip = move(ref); return !!clip && ref.index < clip.points.length - 1; });
    const intoClip = move(into), outClip = move(out);
    const arrival = intoClip ? moveTimeAt(intoClip, into!.index) : outClip ? moveTimeAt(outClip, out!.index) : 0;
    arrivals.push(arrival);
    departures.push(outClip ? moveTimeAt(outClip, out!.index) : arrival);
    incoming.push(intoClip?.id);
    hasOut.push(!!outClip);
  }
  if (poses.length) for (const clip of clips.filter(item => item.kind === "pose" && item.enabled !== false).sort((left, right) => left.start - right.start)) {
    let at = 0;
    arrivals.forEach((arrival, index) => { if (arrival <= clip.start + 0.001) at = index; });
    poses[at]!.push(clip.id);
    if (!hasOut[at]) departures[at] = Math.max(departures[at]!, clipEnd(clip));
  }
  return { route, arrivals, departures, incoming, poses };
}
/** 在第index个点把它所在的移动切成两段（前一段保留原id，触发它的片段不受影响）；不在中间就原样返回。 */
function splitMoveAtRoutePoint(clips: readonly PerformanceClip[], index: number): PerformanceClip[] {
  for (const ref of getClipRoute(clips).refs[index] ?? []) {
    const clip = clips.find(item => item.id === ref.clipId);
    if (clip?.kind !== "move" || ref.index <= 0 || ref.index >= clip.points.length - 1) continue;
    const at = moveTimeAt(clip, ref.index);
    const head = round3(at - clip.start), tail = round3(clipEnd(clip) - at);
    if (head < 0.01 || tail < 0.01) return [...clips];
    const first: MoveClip = { ...clip, points: clip.points.slice(0, ref.index + 1), sourceIn: 0, sourceDuration: head, sourceOut: head, rate: 1 };
    const second: MoveClip = { ...clip, id: crypto.randomUUID(), name: clip.name + " ·2", start: round3(at), points: clip.points.slice(ref.index), sourceIn: 0, sourceDuration: tail, sourceOut: tail, rate: 1 };
    return clips.flatMap(item => item.id === clip.id ? [first, second] : [item]);
  }
  return [...clips];
}
/** 把一段移动改成走seconds秒（改播放倍率，路线不变），它之后开始的片段整体顺延。 */
function retimeMove(clips: readonly PerformanceClip[], clipId: string, seconds: number): PerformanceClip[] {
  const clip = clips.find(item => item.id === clipId);
  if (clip?.kind !== "move") return [...clips];
  const rate = Math.max(0.1, Math.min(8, (clip.sourceOut - clip.sourceIn) / Math.max(0.1, seconds)));
  const updated: MoveClip = { ...clip, rate: Math.round(rate * 10000) / 10000 };
  return shiftClipsFrom(clips.map(item => item.id === clipId ? updated : item), clipEnd(clip), clipEnd(updated) - clipEnd(clip), new Set([clipId]));
}
/** 第index个点的到达时刻改成arrival（相对本轨）。 */
export function setClipRouteArrival(clips: readonly PerformanceClip[], index: number, arrival: number): PerformanceClip[] {
  if (index <= 0) return [...clips];
  // 只改上一点到这一点这一段（和手画动线一样），前面的点到达时刻不变。
  const next = splitMoveAtRoutePoint(splitMoveAtRoutePoint(clips, index), index - 1);
  const timing = getClipRouteTiming(next);
  const clipId = timing.incoming[index];
  if (!clipId) {
    // 一段移动的起点（前面是空档）：整段及之后的片段平移。
    const departure = timing.departures[index]!;
    return shiftClipsFrom(next, departure, Math.max(timing.departures[index - 1] ?? 0, arrival) - departure, new Set());
  }
  const clip = next.find(item => item.id === clipId)!;
  return retimeMove(next, clipId, arrival - clip.start);
}
/** 走进第index个点的速度（米/秒）：只改走到这一点的那一段。 */
export function setClipRouteSpeed(clips: readonly PerformanceClip[], index: number, speed: number): PerformanceClip[] {
  if (index <= 0 || speed <= 0) return [...clips];
  const next = splitMoveAtRoutePoint(splitMoveAtRoutePoint(clips, index), index - 1);
  const clipId = getClipRouteTiming(next).incoming[index];
  const clip = clipId ? next.find(item => item.id === clipId) : undefined;
  if (clip?.kind !== "move") return next;
  return retimeMove(next, clip.id, pathLength(clip.points) * (clip.sourceOut - clip.sourceIn) / clip.sourceDuration / speed);
}
/** 走进第index个点的速度（米/秒），按走到它的那段移动算。 */
export function getClipRouteSpeed(clips: readonly PerformanceClip[], index: number) {
  const clip = clips.find(item => item.id === getClipRouteTiming(clips).incoming[index]);
  if (clip?.kind !== "move") return undefined;
  const seconds = getPerformanceClipDuration(clip);
  return seconds > 0.001 ? pathLength(clip.points) * (clip.sourceOut - clip.sourceIn) / clip.sourceDuration / seconds : undefined;
}
/** 第index个点停靠seconds秒：不能短于停在这里的动作；多出来的用“停留”片段补上，之后的片段顺延。 */
export function setClipRouteDwell(clips: readonly PerformanceClip[], index: number, seconds: number): PerformanceClip[] {
  let next = splitMoveAtRoutePoint(clips, index);
  const timing = getClipRouteTiming(next);
  const arrival = timing.arrivals[index];
  if (arrival === undefined) return next;
  const here = timing.poses[index]!.map(id => next.find(clip => clip.id === id)!);
  const stays = new Set(here.filter(isStayClip).map(clip => clip.id));
  const actionEnd = Math.max(arrival, ...here.filter(clip => !stays.has(clip.id)).map(clipEnd));
  const target = arrival + Math.max(seconds, actionEnd - arrival);
  const departure = timing.departures[index]!;
  next = next.filter(clip => !stays.has(clip.id));
  if (index < timing.route.points.length - 1) next = shiftClipsFrom(next, departure, target - departure, new Set(here.map(clip => clip.id)));
  const extra = round3(target - actionEnd);
  if (extra >= 0.05) next.push({ id: crypto.randomUUID(), name: stayName, kind: "pose", action: "wait", start: round3(actionEnd), sourceDuration: extra, sourceIn: 0, sourceOut: extra, rate: 1 });
  return next.sort((left, right) => left.start - right.start);
}
/** 停在第index个点的事件名：取动作片段名（没有动作只有停留时为空）。 */
export function getClipRouteEventText(clips: readonly PerformanceClip[], index: number) {
  const here = (getClipRouteTiming(clips).poses[index] ?? []).map(id => clips.find(clip => clip.id === id)!);
  return here.filter(clip => !isStayClip(clip)).map(clip => clip.name).join(" · ");
}
/** 第index个点“到达后”的事件名：改停在这里的动作片段名字；没有就加一个3秒的动作（和手画动线的关键事件一样）。 */
export function setClipRouteEventText(source: readonly PerformanceClip[], index: number, text: string): PerformanceClip[] {
  // 动作要在人停下的点上做：一段移动中间的点先切开。
  const clips = splitMoveAtRoutePoint(source, index);
  const timing = getClipRouteTiming(clips);
  const here = (timing.poses[index] ?? []).map(id => clips.find(clip => clip.id === id)!);
  const named = here.find(clip => !isStayClip(clip));
  const value = text.trim().slice(0, 160);
  if (named) return value ? source.map(clip => clip.id === named.id ? { ...clip, name: value } : clip) : [...source];
  if (!value || timing.arrivals[index] === undefined) return [...source];
  const at = timing.departures[index]!;
  const pose: PoseClip = { id: crypto.randomUUID(), name: value, kind: "pose", action: "wait", start: round3(at), sourceDuration: 3, sourceIn: 0, sourceOut: 3, rate: 1 };
  return [...shiftClipsFrom(clips, at, 3, new Set()), pose].sort((left, right) => left.start - right.start);
}
/** 整条片段式动线是否严格沿画的线走。 */
export function setClipRouteFollowLine(clips: readonly PerformanceClip[], value: boolean): PerformanceClip[] {
  return clips.map(clip => {
    if (clip.kind !== "move") return clip;
    const { mode: _mode, ...rest } = clip;
    return value ? { ...rest, mode: "path" as const } : rest;
  });
}
