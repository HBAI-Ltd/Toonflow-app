import { getAssetItemType } from "./assetMetadata";
import { capsuleGesture, capsuleHold, capsuleTransition, type CapsuleState } from "./capsulePoses";
import { getCharacterAnimation } from "./characterAnimations";
import { getSceneLife } from "./lifeDocument";
import { findMotionPreset, motionPresets } from "./motionPresets";
import { getPerformanceClipDuration, getPerformanceClips, type PerformanceClip } from "./performanceClips";
import { getPerformanceTracks, type PerformanceTrack } from "./performanceDocument";
import { createSceneObject, type SceneAsset, type SceneDocument, type SceneObject } from "./sceneDocument";
import { faceRotation, rectFor, rectsOverlap, type Rect } from "./setDressing";
import { estimateLineSeconds } from "./shotCoverage";
import type { SkeletalMotion } from "./skeletalMotion";
import { findRaySeats, footprintOf, probeBlocked, surfaceProbeFor, type StageGeometry, type SurfaceProbe } from "./stageSeats";
import { getTerrainHeight } from "./terrainModel";

/*
 * ACT: 导演工具（给弱模型用的“技能”）：模型只说“谁、做什么、去哪/对谁”，坐标、时长、动作库id、片段字段、
 * 寻路和坐姿全部由这里算好，编译成和手工编排同一套的轨道片段。
 *  - 只走路、说话、做手势的人用导航轨道（运行时自动寻路避让）；
 *  - 要坐到椅子/条凳上、本来就坐着或跪着的群演用直接控制轨道（姿势会一直保持），走位按占地网格自己绕开家具。
 *  - 胶囊人（头、身子、腿三段关节）自己能坐、蹲、跪、倒地、点头、鞠躬、说话；要用手的动作才就地换成同名同位置的骨骼人物。
 */

type P = { x: number; z: number };
type P3 = [number, number, number];
const round = (value: number) => Math.round(value * 1000) / 1000;
const r2 = (value: number) => Math.round(value * 100) / 100;
const dist = (a: P, b: P) => Math.hypot(a.x - b.x, a.z - b.z);
const norm = (x: number, z: number): P => { const length = Math.hypot(x, z) || 1; return { x: x / length, z: z / length }; };
const yawOf = (dir: P) => Math.atan2(dir.x, dir.z) * 180 / Math.PI;
const dirOf = (yaw: number): P => ({ x: Math.sin(yaw * Math.PI / 180), z: Math.cos(yaw * Math.PI / 180) });
const wrap = (degrees: number) => { let value = degrees % 360; if (value > 180) value -= 360; if (value <= -180) value += 360; return value; };

export const isPersonShape = (object: SceneObject) => /^(person|riggedPerson|seatedPerson|kneelingPerson)$/.test(object.asset.shape ?? "");
export const isStageActor = (object: SceneObject) => isPersonShape(object) || getAssetItemType(object.asset) === "人物" || getAssetItemType(object.asset) === "动物";
const environmentPattern = /内景|布景·|轿厢|影棚|置景|整块/;
const seatPattern = /椅|凳|座|沙发|榻|床|墩|马扎|蒲团|长凳|条凳|板凳|吧凳|卡座/;
const tablePattern = /桌|台|案|柜|几/;
const shapeNames: Record<string, string> = { riggedPerson: "骨骼人物", person: "胶囊人", seatedPerson: "坐着的胶囊人", kneelingPerson: "跪坐的胶囊人" };
const compass = (dir: P) => ["南", "东南", "东", "东北", "北", "西北", "西", "西南"][((Math.round(Math.atan2(dir.x, dir.z) / (Math.PI / 4)) % 8) + 8) % 8]!;

// ---------- 名字指代 ----------

/** 场景里每件可见物体的短名：名字不重复就用名字，重名的按出现顺序加“#序号”。 */
export function stageLabels(document: SceneDocument) {
  const counts = new Map<string, number>();
  for (const object of document.objects) if (object.visible) counts.set(object.name, (counts.get(object.name) ?? 0) + 1);
  const seen = new Map<string, number>();
  const labels = new Map<string, string>();
  for (const object of document.objects) {
    if (!object.visible) continue;
    const index = (seen.get(object.name) ?? 0) + 1;
    seen.set(object.name, index);
    labels.set(object.id, (counts.get(object.name) ?? 0) > 1 ? `${object.name}#${index}` : object.name);
  }
  return labels;
}

/**
 * 按id、短名、名字或名字片段找物体。同名的多件按离 near 最近的选（“走到八仙桌”就去最近的那张）；
 * kind 限定只找人、只找座位或桌子。
 */
export function resolveStageRef(document: SceneDocument, text: string, options: { near?: P; kind?: "actor" | "thing" | "seat" | "table"; labels?: Map<string, string>; exclude?: string } = {}): SceneObject | undefined {
  const query = text.trim().replace(/^[“"'「]|[”"'」]$/g, "");
  if (!query) return undefined;
  const labels = options.labels ?? stageLabels(document);
  const pool = document.objects.filter(object => object.visible && object.id !== options.exclude && (!options.kind || (options.kind === "actor" ? isStageActor(object) : options.kind === "thing" ? !isStageActor(object) : options.kind === "seat" ? seatPattern.test(object.name + object.asset.name) && !isStageActor(object) : tablePattern.test(object.name + object.asset.name) && !isStageActor(object))));
  const byId = pool.find(object => object.id === query);
  if (byId) return byId;
  const byLabel = pool.find(object => labels.get(object.id) === query);
  if (byLabel) return byLabel;
  const nearest = (list: SceneObject[]) => options.near ? [...list].sort((a, b) => dist(a.position, options.near!) - dist(b.position, options.near!))[0] : list[0];
  const exact = pool.filter(object => object.name === query);
  if (exact.length) return nearest(exact);
  // 名字片段：场景名包含说法（“八仙桌”→“大堂八仙桌”），或说法包含场景名（“店小二阿福”→“店小二”）；人优先、名字越接近越好。
  const partial = pool.filter(object => object.name.includes(query) || query.includes(object.name) && object.name.length >= 2 || object.asset.name.includes(query));
  if (!partial.length) return undefined;
  const score = (object: SceneObject) => Math.abs(object.name.length - query.length) * 0.3 + (isStageActor(object) ? 0 : 0.5);
  const best = Math.min(...partial.map(score));
  return nearest(partial.filter(object => score(object) <= best + 0.31));
}

// ---------- 占地与寻路（数据层，近似） ----------

type Obstacle = { id: string; rect: Rect; height: number };
// 导入的GLB没有素材定义：用视口里真实模型的包围盒当占地（轴对齐）。
let currentGeometry: StageGeometry | undefined;
function objectRect(object: SceneObject): { rect: Rect; height: number } | undefined {
  const print = footprintOf(object.asset);
  if (print) return { rect: rectFor(print, object.position.x, object.position.z, object.rotation.y, object.scale.x, object.scale.z), height: print.height * object.scale.y };
  const box = currentGeometry?.bounds(object.id);
  return box ? { rect: { x: (box.min.x + box.max.x) / 2, z: (box.min.z + box.max.z) / 2, hw: (box.max.x - box.min.x) / 2, hd: (box.max.z - box.min.z) / 2, angle: 0 }, height: box.max.y - box.min.y } : undefined;
}
function isEnvironment(object: SceneObject) {
  if (environmentPattern.test(object.asset.name) || environmentPattern.test(object.name)) return true;
  const value = objectRect(object);
  return !!value && value.rect.hw * value.rect.hd * 4 > 80;
}
function collectObstacles(document: SceneDocument): Obstacle[] {
  const result: Obstacle[] = [];
  for (const object of document.objects) {
    if (!object.visible || isStageActor(object) || object.asset.id.startsWith("brushPaving") || isEnvironment(object)) continue;
    const value = objectRect(object);
    if (!value || value.height < 0.35) continue;
    result.push({ id: object.id, rect: value.rect, height: value.height });
  }
  return result;
}
const bodyRect = (p: P, radius = 0.22): Rect => ({ x: p.x, z: p.z, hw: radius, hd: radius, angle: 0 });
function blockedAt(obstacles: readonly Obstacle[], p: P, radius = 0.22, ignore?: ReadonlySet<string>) {
  const body = bodyRect(p, radius);
  return obstacles.some(item => !ignore?.has(item.id) && rectsOverlap(body, item.rect));
}

/** 占地网格A*（0.25米一格），起终点附近0.6米内放行（座位在条凳占地里）；找不到就直线。返回拉直后的拐点。 */
function gridPath(from: P, to: P, obstacles: readonly Obstacle[], half: number, extraBlocked?: (p: P) => boolean): P[] {
  const cell = 0.25;
  const blockedPoint = (p: P) => blockedAt(obstacles, p, 0.2) || !!extraBlocked?.(p);
  if (!segmentBlocked(from, to, obstacles, extraBlocked)) return [from, to];
  const minX = Math.max(-half, Math.min(from.x, to.x) - 6), maxX = Math.min(half, Math.max(from.x, to.x) + 6);
  const minZ = Math.max(-half, Math.min(from.z, to.z) - 6), maxZ = Math.min(half, Math.max(from.z, to.z) + 6);
  const cols = Math.max(2, Math.ceil((maxX - minX) / cell) + 1), rows = Math.max(2, Math.ceil((maxZ - minZ) / cell) + 1);
  if (cols * rows > 60000) return [from, to];
  const center = (index: number): P => ({ x: minX + (index % cols) * cell, z: minZ + Math.floor(index / cols) * cell });
  const indexOf = (p: P) => Math.max(0, Math.min(rows - 1, Math.round((p.z - minZ) / cell))) * cols + Math.max(0, Math.min(cols - 1, Math.round((p.x - minX) / cell)));
  const blocked = new Uint8Array(cols * rows);
  for (let index = 0; index < blocked.length; index++) {
    const p = center(index);
    blocked[index] = dist(p, from) > 0.6 && dist(p, to) > 0.6 && blockedPoint(p) ? 1 : 0;
  }
  const start = indexOf(from), goal = indexOf(to);
  const cost = new Float64Array(cols * rows).fill(Infinity);
  const parent = new Int32Array(cols * rows).fill(-1);
  const open: number[] = [start];
  cost[start] = 0;
  const heuristic = (index: number) => dist(center(index), center(goal));
  let found = false;
  for (let guard = 0; open.length && guard < 40000; guard++) {
    let best = 0;
    for (let index = 1; index < open.length; index++) if (cost[open[index]!]! + heuristic(open[index]!) < cost[open[best]!]! + heuristic(open[best]!)) best = index;
    const current = open.splice(best, 1)[0]!;
    if (current === goal) { found = true; break; }
    const cx = current % cols, cz = Math.floor(current / cols);
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dz) continue;
      const nx = cx + dx, nz = cz + dz;
      if (nx < 0 || nz < 0 || nx >= cols || nz >= rows) continue;
      const next = nz * cols + nx;
      if (blocked[next] || dx && dz && (blocked[cz * cols + nx] || blocked[nz * cols + cx])) continue;
      const value = cost[current]! + (dx && dz ? Math.SQRT2 : 1) * cell;
      if (value < cost[next]!) { cost[next] = value; parent[next] = current; if (!open.includes(next)) open.push(next); }
    }
  }
  if (!found) return [from, to];
  const cells: P[] = [];
  for (let index = goal; index !== -1; index = parent[index]!) cells.unshift(center(index));
  const raw = [from, ...cells.slice(1, -1), to];
  // 拉直：从当前点直接看得到的最远点。
  const result: P[] = [from];
  let cursor = 0;
  while (cursor < raw.length - 1) {
    let next = raw.length - 1;
    while (next > cursor + 1 && segmentBlocked(raw[cursor]!, raw[next]!, obstacles, extraBlocked)) next--;
    result.push(raw[next]!);
    cursor = next;
  }
  return result;
}
function segmentBlocked(a: P, b: P, obstacles: readonly Obstacle[], extraBlocked?: (p: P) => boolean) {
  const length = dist(a, b);
  for (let step = 0.15; step < length - 0.4; step += 0.12) {
    if (step < 0.4) continue;
    const t = step / length;
    const p = { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t };
    if (blockedAt(obstacles, p, 0.2) || extraBlocked?.(p)) return true;
  }
  return false;
}

// ---------- 动作词 ----------

type Verb =
  | { kind: "walk"; name: string; speed: number; crouch?: boolean; parkour?: boolean; vehicle?: boolean }
  | { kind: "exit"; name: string; speed: number }
  | { kind: "talk"; name: string }
  | { kind: "wait"; name: string }
  | { kind: "face"; name: string }
  | { kind: "sit"; name: string }
  | { kind: "stand"; name: string }
  | { kind: "anim"; name: string; animation: string; loop?: boolean; hold?: "crouch" | "fold" }
  | { kind: "preset"; name: string; preset: string }
  | { kind: "effect"; name: string; effect: "fire" | "smoke" | "explosion" }
  | { kind: "clear"; name: string }
  | { kind: "circle"; name: string; speed: number };
const verbTable: { words: string[]; verb: Verb }[] = [
  // 绕着东西或人转圈（抢凳子、绕着篝火、围着人转）：几个人同时绕同一件东西会自动分开站、同方向转。
  { words: ["绕圈跑", "跑着绕", "绕着跑", "转圈跑", "跑圈"], verb: { kind: "circle", name: "绕圈跑", speed: 3 } },
  { words: ["绕圈", "绕着", "转圈", "绕行", "围着转", "兜圈", "绕"], verb: { kind: "circle", name: "绕圈", speed: 1.6 } },
  { words: ["蹲行到", "蹲行", "潜行到", "潜行", "悄悄走到", "摸到"], verb: { kind: "walk", name: "蹲行到", speed: 0.9, crouch: true } },
  { words: ["飞身到", "飞身", "轻功", "飞檐走壁", "跃上", "跳上", "翻墙", "上房", "跃到", "飞到"], verb: { kind: "walk", name: "飞身到", speed: 5, parkour: true } },
  { words: ["开到", "驶向", "驶到", "开车到", "开往", "开过", "驶过", "开向"], verb: { kind: "walk", name: "开到", speed: 6, vehicle: true } },
  { words: ["冲到", "冲向", "冲过去", "扑向", "扑到", "追", "追赶", "冲"], verb: { kind: "walk", name: "冲到", speed: 5.5 } },
  { words: ["跑到", "跑向", "跑过去", "奔向", "跑去", "跑"], verb: { kind: "walk", name: "跑到", speed: 3.5 } },
  { words: ["走到", "走向", "走去", "走过去", "走近", "来到", "过去", "上前", "迎上", "迎上去", "进门", "进来", "入场", "走进", "回到", "退到", "站到", "挪到", "走"], verb: { kind: "walk", name: "走到", speed: 1.35 } },
  { words: ["跑开", "逃走", "逃跑", "逃离", "夺门而出"], verb: { kind: "exit", name: "跑开", speed: 3.5 } },
  { words: ["离开", "离去", "退场", "走开", "出门", "出去", "转身离开", "退下", "走了"], verb: { kind: "exit", name: "离开", speed: 1.35 } },
  { words: ["交谈", "说话", "说", "对话", "讲话", "聊天", "喊", "问", "回答", "吵架", "争吵", "劝", "念", "台词"], verb: { kind: "talk", name: "交谈" } },
  { words: ["看向", "转向", "望向", "面向", "回头", "转身", "看着", "注视", "盯着", "看"], verb: { kind: "face", name: "看向" } },
  { words: ["坐下", "坐到", "坐着", "入座", "落座", "坐在地上", "席地而坐", "席地坐", "盘腿坐", "打坐", "坐"], verb: { kind: "sit", name: "坐下" } },
  { words: ["起身", "站起来", "站起", "起立"], verb: { kind: "stand", name: "起身" } },
  { words: ["停下", "停止", "不动", "别动", "原地不动", "取消动作", "清除动作", "清空动作", "删掉动作", "删除动作", "stop", "clear"], verb: { kind: "clear", name: "停下" } },
  { words: ["站着", "等待", "等着", "停留", "站好", "发呆", "待着", "站", "等"], verb: { kind: "wait", name: "站着" } },
  { words: ["蹲下", "蹲着", "蹲"], verb: { kind: "anim", name: "蹲下", animation: "cc0CrouchIdle", loop: true, hold: "crouch" } },
  { words: ["抱臂", "双手抱胸", "抱着胳膊", "抱胸"], verb: { kind: "anim", name: "抱臂", animation: "cc0FoldArms", loop: true, hold: "fold" } },
  { words: ["拾取", "捡起", "拿起", "捡", "拿"], verb: { kind: "anim", name: "拾取", animation: "cc0PickUp" } },
  { words: ["伸手", "递给", "递", "接过", "敲门", "按", "交互", "摸"], verb: { kind: "anim", name: "伸手", animation: "cc0Interact" } },
  { words: ["推开", "推门", "推"], verb: { kind: "anim", name: "推", animation: "cc0Push" } },
  { words: ["翻滚", "打滚", "滚"], verb: { kind: "anim", name: "翻滚", animation: "cc0Roll" } },
  { words: ["攀爬", "爬上", "爬"], verb: { kind: "anim", name: "攀爬", animation: "cc0ClimbUp" } },
  { words: ["吃喝", "喝酒", "喝茶", "吃饭", "吃", "喝"], verb: { kind: "anim", name: "吃喝", animation: "cc0Consume", loop: true } },
  { words: ["开箱", "打开箱子", "开柜子"], verb: { kind: "anim", name: "开箱", animation: "cc0ChestOpen" } },
  { words: ["干活", "修理", "擦地", "种地"], verb: { kind: "anim", name: "干活", animation: "cc0FixKneeling", loop: true } },
  { words: ["起跳", "跳起", "跳"], verb: { kind: "anim", name: "起跳", animation: "cc0JumpStart" } },
  { words: ["开枪", "射击", "开火", "枪击", "打枪", "举枪"], verb: { kind: "preset", name: "开枪", preset: "point" } },
  ...motionPresets.map(preset => ({ words: [...preset.aliases], verb: { kind: "preset" as const, name: preset.name, preset: preset.id } })),
  { words: ["起火", "着火", "燃烧", "失火", "火"], verb: { kind: "effect", name: "起火", effect: "fire" } },
  { words: ["冒烟", "浓烟", "烟"], verb: { kind: "effect", name: "冒烟", effect: "smoke" } },
  { words: ["爆炸", "炸开", "炸"], verb: { kind: "effect", name: "爆炸", effect: "explosion" } },
];
const englishVerbs: Record<string, string> = { walk: "走到", run: "跑到", sprint: "冲到", sneak: "蹲行到", leap: "飞身到", drive: "开到", exit: "离开", leave: "离开", talk: "交谈", say: "交谈", speak: "交谈", look: "看向", face: "看向", sit: "坐下", stand: "起身", wait: "站着", idle: "站着", crouch: "蹲下", pickup: "拾取", interact: "伸手", push: "推", roll: "翻滚", climb: "攀爬", eat: "吃喝", drink: "吃喝", jump: "起跳", fire: "起火", smoke: "冒烟", explode: "爆炸", explosion: "爆炸" };
export const stageVerbNames = [...new Set(verbTable.map(item => item.verb.name))];

/** 动作词→动作；“走到柜台”这类把去处写进动作词里的，剩下的文字当去处。 */
export function matchStageVerb(text: string): { verb: Verb; rest: string } | undefined {
  const raw = text.trim();
  const english = englishVerbs[raw.toLowerCase().replace(/[\s_-]/g, "")];
  const value = english ?? raw;
  for (const { words, verb } of verbTable) if (words.includes(value)) return { verb, rest: "" };
  let best: { verb: Verb; rest: string; at: number; length: number } | undefined;
  for (const { words, verb } of verbTable) for (const word of words) {
    if (!value.includes(word)) continue;
    const at = value.indexOf(word);
    // 单字动词只认开头且后面跟着去处（“走到”“跑去”“坐到”）：“跳舞”不是起跳、“打开门”不是打人。
    if (word.length === 1 && (at !== 0 || word !== "绕" && !/^[到向去回进出上下在]/.test(value.slice(1)))) continue;
    if (!best || at < best.at || at === best.at && word.length > best.length) best = { verb, rest: value.slice(at + word.length).replace(/^[到向去在了着]/, "").trim(), at, length: word.length };
  }
  return best && { verb: best.verb, rest: best.rest };
}

// ---------- 舞台简报 ----------

type ProgramRow = { number: number; start: number; end: number; cameraId: string; shotId?: string; note?: string; lineTooLong?: boolean; crossesAxis?: boolean };
function clipsEnd(clips: readonly PerformanceClip[]) { return clips.reduce((end, clip) => clip.enabled === false ? end : Math.max(end, clip.start + getPerformanceClipDuration(clip)), 0); }
function describeClips(clips: readonly PerformanceClip[]) {
  const active = clips.filter(clip => clip.enabled !== false).sort((a, b) => a.start - b.start);
  if (!active.length) return "";
  // 走位transform、待机、循环动作切出来的同名段合并成一步，只说做了什么。
  const names: string[] = [];
  for (const clip of active) {
    if (clip.kind === "transform" && clip.name === "走位" || clip.name === "待机") continue;
    const name = clip.name.replace(/^(移动|动作) ?\d+$/, clip.kind === "move" ? "走" : "动作");
    if (names.at(-1) !== name) names.push(name);
  }
  return `${names.slice(0, 8).join("→")}${names.length > 8 ? `…共${names.length}步` : ""}（${r2(active[0]!.start)}–${r2(clipsEnd(active))}秒）`;
}

export function describeStage(document: SceneDocument, program: readonly ProgramRow[] = [], geometry?: StageGeometry) {
  currentGeometry = geometry;
  const labels = stageLabels(document);
  const tracks = getPerformanceTracks(document.life, document.objects, document.objectGroups);
  const trackOf = new Map(tracks.map(track => [track.objectId, track]));
  const actors = document.objects.filter(object => object.visible && isStageActor(object));
  const center = actors.length ? { x: actors.reduce((sum, object) => sum + object.position.x, 0) / actors.length, z: actors.reduce((sum, object) => sum + object.position.z, 0) / actors.length } : { x: document.view.target.x, z: document.view.target.z };
  const facing = (object: SceneObject) => { const front = footprintOf(object.asset)?.front ?? { x: 0, z: 1 }; const turn = object.rotation.y * Math.PI / 180; return { x: front.x * Math.cos(turn) + front.z * Math.sin(turn), z: -front.x * Math.sin(turn) + front.z * Math.cos(turn) }; };
  const actorRow = (object: SceneObject) => {
    const track = trackOf.get(object.id);
    const doing = track && track.enabled !== false ? describeClips(getPerformanceClips(track, object)) : "";
    return { name: labels.get(object.id)!, kind: shapeNames[object.asset.shape ?? ""] ?? getAssetItemType(object.asset), at: [r2(object.position.x), r2(object.position.z)], facing: compass(facing(object)), doing: doing || "无" };
  };
  // 人多时：骨骼人物、有动作的人、站着的人先列，坐席群演按名字前缀合并成一行。
  const ranked = [...actors].sort((a, b) => Number(b.asset.shape === "riggedPerson") - Number(a.asset.shape === "riggedPerson") || Number(!!trackOf.get(b.id)) - Number(!!trackOf.get(a.id)) || Number(b.asset.shape === "person") - Number(a.asset.shape === "person") || dist(a.position, center) - dist(b.position, center));
  const listed = ranked.slice(0, 24);
  const rest = ranked.slice(24);
  const groups = new Map<string, SceneObject[]>();
  for (const object of rest) { const key = object.name.replace(/\d+$/, "") || object.name; groups.set(key, [...(groups.get(key) ?? []), object]); }
  const crowd = [...groups].map(([prefix, list]) => `${prefix}（${list.length}人，${shapeNames[list[0]!.asset.shape ?? ""] ?? "人物"}，如“${labels.get(list[0]!.id)}”）`);
  // 地点：非人的可见物体，按离人群中心远近列40件；地面铺装、墙、整块布景不列。
  const things = document.objects.filter(object => object.visible && !isStageActor(object) && !object.asset.id.startsWith("brushPaving") && !/墙|地面|地板|栈道|地砖|铺装/.test(object.name) && !isEnvironment(object));
  const places = things.sort((a, b) => dist(a.position, center) - dist(b.position, center)).slice(0, 40).map(object => ({ name: labels.get(object.id)!, at: [r2(object.position.x), r2(object.position.z)] }));
  const sets = document.objects.filter(object => object.visible && !isStageActor(object) && isEnvironment(object)).map(object => labels.get(object.id)!);
  const cameras = new Map((document.cameras ?? []).map(camera => [camera.id, camera]));
  const shots = program.slice(0, 40).map(row => {
    const camera = cameras.get(row.cameraId);
    const subject = camera?.shots?.find(shot => shot.id === row.shotId)?.track?.objectId ?? camera?.track?.objectId;
    return `第${row.number}镜 ${r2(row.start)}–${r2(row.end)}秒 ${camera?.name ?? "机位"}${subject && labels.get(subject) ? ` 拍${labels.get(subject)}` : ""}${row.note ? ` 「${row.note.slice(0, 40)}」` : ""}${row.lineTooLong ? " ⚠台词说不完" : ""}${row.crossesAxis ? " ⚠越轴" : ""}`;
  });
  const performanceEnd = Math.max(0, ...tracks.map(track => { const object = document.objects.find(item => item.id === track.objectId); return object && track.enabled !== false ? clipsEnd(getPerformanceClips(track, object)) : 0; }));
  return {
    people: listed.map(actorRow), ...(crowd.length ? { morePeople: crowd } : {}),
    places, ...(sets.length ? { sets } : {}),
    shots: shots.length ? shots : ["还没有镜头"],
    performanceSeconds: r2(performanceEnd), filmSeconds: r2(program.at(-1)?.end ?? 0),
    axes: "坐标单位米：x向东为正，z向南为正（屏幕默认视角里z越大越靠近镜头）。",
    howTo: "用people/places里的name指人和地点；安排表演用stageAct，摆镜头用stageShots。",
  };
}

// ---------- 安排表演 ----------

export type StageActInput = {
  cast?: { name: string; role?: string; near?: string; at?: number[] }[];
  actions: { who: string; do: string; to?: string | number[]; face?: string; at?: number; with?: boolean; seconds?: number; line?: string; speed?: number }[];
  keep?: boolean;
  /** 用户要求用胶囊人：全程不换骨骼人物（已经被换成骨骼的换回胶囊人），坐下、倒地、手势用胶囊人能做的方式表现。 */
  capsule?: boolean;
};
type Step =
  | { kind: "walk"; start: number; duration: number; path: P[]; y: number; endY?: number; lift?: number; speed: number; verb: Extract<Verb, { kind: "walk" | "exit" }>; label: string }
  | { kind: "pose"; start: number; duration: number; label: string; animation?: string; loop?: boolean; motion?: SkeletalMotion; base?: string; target?: string; state?: "sit" | "kneel" | "lie" | "crouch" | "fold" | "raise" | "cover" }
  | { kind: "turn"; start: number; duration: number; yaw: number; target?: string; label: string }
  | { kind: "effect"; start: number; duration: number; label: string; effect: "fire" | "smoke" | "explosion" };
type Actor = {
  object: SceneObject; label: string; rig: boolean; animal: boolean; vehicle: boolean;
  track?: PerformanceTrack; kept: PerformanceClip[]; steps: Step[];
  cursor: number; at: P; y: number; yaw: number; state?: "sit" | "kneel" | "lie" | "crouch" | "fold";
  needsObject: boolean; startState?: "sit" | "kneel"; partner?: string; cleared?: boolean;
};
export type StageActResult = { document: SceneDocument; changedTrackIds: string[]; removed: string[]; done: string[]; created: string[]; upgraded: string[]; notes: string[]; skipped: string[]; seconds: number };

const palette = ["#b8433b", "#3f6fb5", "#d29a2e", "#4f8a4a", "#7d54a6", "#2f9aa0", "#c0603a", "#5a6f8f"];

export function planStageActs(source: SceneDocument, input: StageActInput, options: { rigged?: SceneAsset; capsule?: SceneAsset; createId: () => string; maxCast?: number; forceObject?: ReadonlySet<string>; geometry?: StageGeometry }): StageActResult {
  let document: SceneDocument = { ...source, objects: [...source.objects] };
  currentGeometry = options.geometry;
  const capsuleMode = !!input.capsule && !!options.capsule;
  const notes: string[] = [], skipped: string[] = [], created: string[] = [], upgraded: string[] = [], done: string[] = [];
  const half = (document.terrain?.size ?? 80) / 2 - 0.5;
  const obstacles = collectObstacles(document);
  // 整块布景（三壁内景）里的家具不在占地矩形里：直接控制的人走位时用射线高度表绕开（只在用到时才装配几何，按0.1米一格缓存）。
  const environments = document.objects.filter(object => object.visible && !isStageActor(object) && isEnvironment(object));
  let environmentProbe: SurfaceProbe | undefined;
  const environmentCache = new Map<string, boolean>();
  const environmentBlocked = environments.length ? (p: P) => {
    const key = `${Math.round(p.x * 10)},${Math.round(p.z * 10)}`;
    let value = environmentCache.get(key);
    if (value === undefined) {
      environmentProbe ??= surfaceProbeFor(document, { x: 0, z: 0 }, half + 1, options.geometry, options.geometry ? undefined : object => environments.includes(object));
      value = probeBlocked(environmentProbe, p.x, p.z);
      environmentCache.set(key, value);
    }
    return value;
  } : undefined;
  // 直接控制的人走在哪一层地面上：台基、门屋、殿内地板（布景射线量到的可站的顶面），没有布景的地方用地形高度。
  const floorAt = (p: P): number => {
    if (environments.length) {
      environmentProbe ??= surfaceProbeFor(document, { x: 0, z: 0 }, half + 1, options.geometry, options.geometry ? undefined : object => environments.includes(object));
      const sample = environmentProbe.sample(p.x, p.z);
      // 顶面能站就是它；顶上是椅子、桌子时取它底下那层地板。
      if (sample && sample.top < 3) return sample.up && sample.top - sample.floor <= 0.3 ? sample.top : sample.floor;
    }
    return document.terrain ? getTerrainHeight(document.terrain, p.x, p.z) : 0;
  };
  const center = (() => { const people = document.objects.filter(object => object.visible && isStageActor(object)); return people.length ? { x: people.reduce((s, o) => s + o.position.x, 0) / people.length, z: people.reduce((s, o) => s + o.position.z, 0) / people.length } : { x: document.view.target.x, z: document.view.target.z }; })();
  const actors = new Map<string, Actor>();
  const occupiedBy = new Map<string, P>();
  for (const object of document.objects) if (object.visible && isStageActor(object)) occupiedBy.set(object.id, { x: object.position.x, z: object.position.z });
  const spotFree = (p: P, self?: string, radius = 0.22) => Math.abs(p.x) < half && Math.abs(p.z) < half && !blockedAt(obstacles, p, radius) && ![...occupiedBy].some(([id, other]) => id !== self && dist(other, p) < 0.55);
  const roomyAt = (p: P, self: string, partner?: string) => Math.abs(p.x) < half - 0.5 && Math.abs(p.z) < half - 0.5 && !blockedAt(obstacles, p, 0.4) && ![...occupiedBy].some(([id, other]) => id !== self && dist(other, p) < (id === partner ? 0.9 : 0.8));
  function freeNear(want: P, self?: string, prefer?: P): P | undefined {
    if (spotFree(want, self)) return want;
    let best: { p: P; score: number } | undefined;
    for (const radius of [0.3, 0.6, 0.9, 1.2, 1.6, 2.1, 2.7]) {
      for (let step = 0; step < 16; step++) {
        const angle = step * Math.PI / 8;
        const p = { x: r2(want.x + Math.cos(angle) * radius), z: r2(want.z + Math.sin(angle) * radius) };
        if (!spotFree(p, self)) continue;
        const score = radius + (prefer ? dist(p, prefer) * 0.15 : 0);
        if (!best || score < best.score) best = { p, score };
      }
      if (best) return best.p;
    }
    return undefined;
  }

  // 选角：剧本里有、场景里没有的人就新建（主角骨骼人物，群演胶囊人）。
  for (const member of input.cast ?? []) {
    const name = member.name?.trim();
    if (!name) continue;
    if (resolveStageRef(document, name, { kind: "actor" })?.name === name) { notes.push(`${name}已在场，没有重复新建`); continue; }
    const extra = capsuleMode || /群演|路人|龙套|npc|背景|胶囊/i.test(member.role ?? "");
    const asset = extra ? options.capsule ?? options.rigged : options.rigged;
    if (!asset) { skipped.push(`${name}：没有可用的人物素材`); continue; }
    const anchor = member.at && member.at.length >= 2 ? { x: member.at[0]!, z: member.at[member.at.length === 3 ? 2 : 1]! } : member.near ? (() => { const ref = resolveStageRef(document, member.near!, { near: center }); return ref ? { x: ref.position.x, z: ref.position.z } : undefined; })() : undefined;
    if (member.near && !anchor) notes.push(`${name}：没找到“${member.near}”，站在场景中间`);
    const spot = freeNear(anchor ? { x: anchor.x + 0.9, z: anchor.z + 0.9 } : center, undefined, anchor) ?? freeNear(center);
    if (!spot) { skipped.push(`${name}：附近没有空地可以站`); continue; }
    const object = createSceneObject(structuredClone(asset), { x: spot.x, y: 0, z: spot.z });
    object.name = name;
    object.height = 0;
    const look = anchor && dist(anchor, spot) > 0.3 ? norm(anchor.x - spot.x, anchor.z - spot.z) : norm(center.x - spot.x, center.z - spot.z);
    const print = footprintOf(asset);
    object.rotation = { x: 0, y: print ? faceRotation(print, look) : r2(yawOf(look)), z: 0 };
    const used = new Set(document.objects.map(item => item.color.toLowerCase()));
    object.color = palette.find(color => !used.has(color)) ?? palette[document.objects.length % palette.length]!;
    document.objects.push(object);
    occupiedBy.set(object.id, spot);
    created.push(`${name}（${extra ? "胶囊人群演" : "骨骼人物"}）`);
  }
  if (created.length > (options.maxCast ?? 40)) throw new Error(`一次最多新建${options.maxCast ?? 40}个角色`);
  const labels = stageLabels(document);
  const tracks = getPerformanceTracks(document.life, document.objects, document.objectGroups);
  const forcedFresh = new Set<string>();
  // 同时绕同一件东西的人：记下各自起跑的角度，后来的错开站到对面。
  const circling = new Map<string, { start: number; angle: number; leadIn: number; step: Extract<Step, { kind: "walk" }>; actor: Actor; line: number }[]>();

  function actorFor(object: SceneObject): Actor {
    let actor = actors.get(object.id);
    if (actor) return actor;
    // 用户要胶囊人：之前被换成骨骼人物的换回同名同位置的胶囊人（原来的骨骼动作作废，按这次重新排）。
    if (capsuleMode && object.asset.shape === "riggedPerson") {
      const index = document.objects.findIndex(item => item.id === object.id);
      object = { ...object, asset: structuredClone(options.capsule!) };
      document.objects[index] = object;
      upgraded.push(`${labels.get(object.id) ?? object.name}换回了胶囊人`);
      forcedFresh.add(object.id);
    }
    const track = tracks.find(item => item.objectId === object.id);
    const kept = input.keep && track && track.enabled !== false && !forcedFresh.has(object.id) ? getPerformanceClips(track, object) : [];
    const keptObject = track?.controller === "object";
    const print = footprintOf(object.asset);
    const front = print?.front ?? { x: 0, z: 1 };
    const yaw = object.rotation.y + yawOf(front);
    let at = { x: object.position.x, z: object.position.z };
    // 接着原来的动作往后加：从原来最后一段走完的位置接着走。
    if (kept.length && !keptObject) for (const clip of [...kept].sort((a, b) => a.start - b.start)) if (clip.kind === "move" && clip.enabled !== false) { const end = clip.points.at(-1)!; at = { x: end[0], z: end[2] }; }
    actor = {
      object, label: labels.get(object.id) ?? object.name, rig: object.asset.shape === "riggedPerson", animal: getAssetItemType(object.asset) === "动物" && !isPersonShape(object),
      vehicle: !isStageActor(object), track, kept, steps: [], cursor: kept.length ? clipsEnd(kept) : 0, at, y: object.position.y, yaw,
      // 预演里导航走不通的人（forceObject）改成直接控制：按占地网格算好的路线走，不依赖导航面。
      needsObject: keptObject || object.asset.shape === "seatedPerson" || object.asset.shape === "kneelingPerson" || !!(options.forceObject?.has(object.id) || options.forceObject?.has(object.name)) && isPersonShape(object),
      ...(object.asset.shape === "seatedPerson" ? { state: "sit" as const, startState: "sit" as const } : object.asset.shape === "kneelingPerson" ? { state: "kneel" as const, startState: "kneel" as const } : {}),
    };
    if (keptObject && kept.length) { notes.push(`${actor.label}原来是直接控制的动作，接着加不方便，已重新编排`); actor.kept = []; actor.cursor = 0; }
    actors.set(object.id, actor);
    return actor;
  }
  function upgrade(actor: Actor, why: string) {
    if (actor.rig || actor.animal || actor.vehicle) return actor.rig;
    if (capsuleMode) return false;
    if (!options.rigged) return false;
    const index = document.objects.findIndex(object => object.id === actor.object.id);
    const object = { ...actor.object, asset: structuredClone(options.rigged) };
    document.objects[index] = object;
    actor.object = object; actor.rig = true;
    upgraded.push(`${actor.label}换成了同位置的骨骼人物（${why}）`);
    return true;
  }
  // 坐着、跪着、躺着先站起来：骨骼人物播起身动作，胶囊人用三段关节站起来。返回用掉的秒数。
  function standUp(actor: Actor, begin: number) {
    if (!actor.rig && actor.object.asset.shape === "person") {
      actor.steps.push({ kind: "pose", start: begin, duration: 0.6, label: "起身", motion: capsuleTransition(capsuleStateOf(actor), undefined, 0.6) });
      actor.state = undefined;
      return 0.6;
    }
    upgrade(actor, "要先站起来");
    const animation = getCharacterAnimation(actor.state === "sit" ? "cc0StandUp" : "cc0LayToIdle")!;
    actor.steps.push({ kind: "pose", start: begin, duration: animation.duration, label: "起身", animation: animation.id });
    actor.state = undefined;
    return animation.duration;
  }
  /** 胶囊人自己能做的动作（不用手的）。 */
  const capsuleCan = (verb: Verb) => verb.kind === "sit" || verb.kind === "stand" || verb.kind === "face" || verb.kind === "talk" || verb.kind === "wait"
    || verb.kind === "preset" && ["fall", "kneel", "nod", "shake", "bow"].includes(verb.preset) && verb.name !== "开枪"
    || verb.kind === "anim" && (verb.hold === "crouch" || verb.animation === "cc0JumpStart");
  const capsuleStateOf = (actor: Actor): CapsuleState => actor.state === "fold" ? undefined : actor.state;
  /**
   * 胶囊人模式下的姿势和手势：不换骨骼人物，用胶囊人自己的头、身子、腿三段关节做（capsulePoses.ts）——
   * 坐下=走到座位、身子落到座面腿往前伸；跪下、蹲下、倒地、点头、摇头、鞠躬照做；说话=转向对方轻轻点头；
   * 举手、指向、出拳等手上的动作胶囊人没有手，转向对方身子一倾；开枪往后一震。返回用掉的秒数，-1=没做。
   */
  function capsuleAction(actor: Actor, verb: Verb, action: StageActInput["actions"][number], begin: number, target: SceneObject | undefined, toText: string | undefined, tag: string): number {
    const partner = actor.partner ? document.objects.find(other => other.id === actor.partner) : undefined;
    const faceTarget = target ?? (partner && dist(positionOf(partner), actor.at) < 6 ? partner : undefined);
    let duration = 0;
    const faceTo = () => {
      if (!faceTarget || actor.state === "lie") return;
      const there = positionOf(faceTarget);
      if (dist(there, actor.at) < 0.2) return;
      const yaw = yawOf(norm(there.x - actor.at.x, there.z - actor.at.z));
      actor.steps.push({ kind: "turn", start: round(begin + duration), duration: 0.4, yaw, ...(isStageActor(faceTarget) ? { target: faceTarget.id } : {}), label: "转向" });
      actor.yaw = yaw;
      duration += 0.4;
    };
    const pose = (label: string, seconds: number, motion: SkeletalMotion) => {
      actor.steps.push({ kind: "pose", start: round(begin + duration), duration: round(seconds), label, motion, ...(faceTarget && isStageActor(faceTarget) ? { target: faceTarget.id } : {}) });
      duration += seconds;
    };
    const to = faceTarget ? `（对${labels.get(faceTarget.id) ?? faceTarget.name}）` : "";
    const state = capsuleStateOf(actor);
    if (verb.kind === "sit") {
      if (actor.state === "sit") { notes.push(`${actor.label}已经坐着`); return -1; }
      if (state) duration += standUp(actor, begin);
      const floor = /地上|地面|地板|席地|盘腿|打坐/.test(`${action.do ?? ""}${toText ?? ""}`);
      const seat = floor ? undefined : findSeat(actor, toText);
      const seconds = Math.max(0.8, action.seconds ?? 1);
      if (seat) {
        const route = gridPath(actor.at, seat.root, obstacles, half, environmentBlocked);
        const length = route.reduce((sum, p, i) => i ? sum + dist(route[i - 1]!, p) : 0, 0);
        if (length > 0.1) { const walk = length / 1.6; actor.steps.push({ kind: "walk", start: round(begin + duration), duration: round(walk), path: route, y: actor.y, speed: 1.6, verb: { kind: "walk", name: "走到", speed: 1.6 }, label: `走到${seat.label}`, ...(seat.lift > 0.03 ? { lift: seat.lift } : {}) }); duration += walk; }
        actor.steps.push({ kind: "turn", start: round(begin + duration), duration: 0.3, yaw: yawOf(seat.face), label: "转身" });
        duration += 0.3;
        // 坐到座位上要按算好的路线走到座位、抬到座面：直接控制。
        actor.needsObject = true;
        actor.at = seat.root; actor.yaw = yawOf(seat.face); occupiedBy.set(actor.object.id, seat.root);
        pose("坐下", seconds, capsuleTransition(undefined, "sit", seconds));
        actor.state = "sit";
        describe(actor, begin, duration, `坐下（坐在${seat.label}）`);
      } else {
        // 没有空座位：席地跪坐（坐在空中不像样）。
        if (toText && !floor) notes.push(`${toText}附近的座位都有人或没有座位，${actor.label}就地坐在地上`);
        pose("坐在地上", seconds, capsuleTransition(undefined, "kneel", seconds));
        actor.state = "kneel";
        describe(actor, begin, duration, "坐在地上");
      }
      return duration;
    }
    if (verb.kind === "stand") {
      if (!actor.state) { notes.push(`${actor.label}本来就站着`); return -1; }
      duration += standUp(actor, begin);
      describe(actor, begin, duration, "起身");
      return duration;
    }
    if (verb.kind === "face") {
      if (!faceTarget) { skipped.push(`${tag}：看向要给to（看谁/看哪件东西）`); return -1; }
      faceTo();
      const hold = Math.max(0, (action.seconds ?? 1) - duration);
      if (hold > 0.1) pose("看着", hold, capsuleHold(state, hold));
      describe(actor, begin, duration, `看向${labels.get(faceTarget.id) ?? faceTarget.name}`);
      return duration;
    }
    if (verb.kind === "talk") {
      faceTo();
      const seconds = action.seconds && action.seconds > 0.3 ? action.seconds : action.line ? estimateLineSeconds(action.line) : 3;
      pose(action.line ? `说：${action.line}`.slice(0, 160) : "交谈", seconds, capsuleGesture(state, "talk", seconds));
      describe(actor, begin, duration, `${action.line ? `说“${action.line.slice(0, 30)}”` : "交谈"}${to}`);
      return duration;
    }
    if (verb.kind === "wait") {
      faceTo();
      const seconds = action.seconds ?? 2;
      pose(state === "sit" ? "坐着" : state === "kneel" ? "跪着" : state === "lie" ? "躺着" : "站着", seconds, capsuleHold(state, seconds));
      describe(actor, begin, duration, state === "sit" ? "坐着" : "站着");
      return duration;
    }
    const preset = verb.kind === "preset" ? verb.preset : undefined;
    const into = preset === "fall" ? "lie" as const : preset === "kneel" ? "kneel" as const : verb.kind === "anim" && verb.hold === "crouch" ? "crouch" as const : undefined;
    if (into) {
      if (actor.state === into) { notes.push(`${actor.label}已经${verb.name}`); return -1; }
      const seconds = Math.max(0.8, action.seconds ?? (into === "lie" ? 1.2 : 1));
      pose(verb.name, seconds, capsuleTransition(state, into, seconds, into === "lie" ? 0.7 : 0.5));
      actor.state = into;
      describe(actor, begin, duration, verb.name);
      return duration;
    }
    if (actor.state === "lie") { skipped.push(`${tag}：${actor.label}倒在地上，先“起身”再${verb.name}`); return -1; }
    const gesture = verb.kind === "anim" && verb.animation === "cc0JumpStart" ? "jump" as const : preset === "nod" ? "nod" as const : preset === "shake" ? "shake" as const : preset === "bow" ? "bow" as const : verb.name === "开枪" ? "shoot" as const : "lean" as const;
    if (gesture === "jump" && state) duration += standUp(actor, begin);
    faceTo();
    const seconds = Math.max(gesture === "shoot" ? 0.6 : 0.8, action.seconds ?? (gesture === "bow" ? 2 : gesture === "shoot" ? 0.7 : 1.2));
    pose(verb.name, seconds, capsuleGesture(capsuleStateOf(actor), gesture, seconds));
    describe(actor, begin, duration, `${verb.name}${to}`);
    return duration;
  }
  const positionOf = (object: SceneObject): P => actors.get(object.id)?.at ?? { x: object.position.x, z: object.position.z };
  function parsePoint(value: string | number[] | undefined): P | undefined {
    if (Array.isArray(value) && value.length >= 2 && value.every(Number.isFinite)) return { x: value[0]!, z: value[value.length === 3 ? 2 : 1]! };
    if (typeof value === "string") { const match = /^\s*\[?\s*(-?\d+(?:\.\d+)?)\s*[,，\s]\s*(-?\d+(?:\.\d+)?)(?:\s*[,，\s]\s*(-?\d+(?:\.\d+)?))?\s*\]?\s*$/.exec(value); if (match) return { x: Number(match[1]), z: Number(match[3] ?? match[2]) }; }
    return undefined;
  }
  function approach(actor: Actor, target: SceneObject, gap: number): P | undefined {
    const from = actor.at;
    if (isStageActor(target)) {
      const there = positionOf(target);
      const base = Math.atan2(from.x - there.x, from.z - there.z);
      // 先找宽敞的地方（离家具0.4米、离别人0.8米：导航挤得进去，不会卡在两排座位中间），找不到再放宽。
      for (const roomy of [true, false]) for (const offset of [0, 0.5, -0.5, 1, -1, 1.6, -1.6, 2.4, -2.4, Math.PI]) {
        const angle = base + offset;
        const p = { x: r2(there.x + Math.sin(angle) * gap), z: r2(there.z + Math.cos(angle) * gap) };
        if (roomy ? roomyAt(p, actor.object.id, target.id) : spotFree(p, actor.object.id)) return p;
      }
      return freeNear({ x: there.x + Math.sin(base) * gap, z: there.z + Math.cos(base) * gap }, actor.object.id, from);
    }
    const print = footprintOf(target.asset);
    const rect = print ? rectFor(print, target.position.x, target.position.z, target.rotation.y, target.scale.x, target.scale.z) : { x: target.position.x, z: target.position.z, hw: 0.4, hd: 0.4, angle: 0 };
    const ax = { x: Math.cos(rect.angle), z: -Math.sin(rect.angle) }, az = { x: Math.sin(rect.angle), z: Math.cos(rect.angle) };
    for (const roomy of [true, false]) {
      let best: { p: P; score: number } | undefined;
      for (let step = 0; step < 16; step++) {
        const angle = step * Math.PI / 8;
        const dir = { x: Math.sin(angle), z: Math.cos(angle) };
        const extent = rect.hw * Math.abs(dir.x * ax.x + dir.z * ax.z) + rect.hd * Math.abs(dir.x * az.x + dir.z * az.z);
        const p = { x: r2(rect.x + dir.x * (extent + gap)), z: r2(rect.z + dir.z * (extent + gap)) };
        if (roomy ? !roomyAt(p, actor.object.id, target.id) : !spotFree(p, actor.object.id)) continue;
        const score = dist(p, from);
        if (!best || score < best.score) best = { p, score };
      }
      if (best) return best.p;
    }
    return freeNear({ x: rect.x, z: rect.z }, actor.object.id, from);
  }
  /** 座位：椅子、凳子、沙发、条凳（长的按0.55米一个位子），朝向附近的桌子（没有桌子按素材正面）；有人坐着的位子跳过。 */
  function seatSpots(seat: SceneObject, self: string) {
    const print = footprintOf(seat.asset);
    if (!print) return [];
    const width = print.width * seat.scale.x, depth = print.depth * seat.scale.z;
    const turn = seat.rotation.y * Math.PI / 180;
    const ax = { x: Math.cos(turn), z: -Math.sin(turn) }, az = { x: Math.sin(turn), z: Math.cos(turn) };
    const long = width >= depth ? ax : az, length = Math.max(width, depth);
    const places = length >= 0.9 ? Math.max(1, Math.floor((length - 0.4) / 0.55) + 1) : 1;
    const offsets = Array.from({ length: places }, (_, index) => (index - (places - 1) / 2) * 0.55);
    const table = document.objects.filter(object => object.visible && !isStageActor(object) && tablePattern.test(object.name + object.asset.name) && dist(object.position, seat.position) < 1.8).sort((a, b) => dist(a.position, seat.position) - dist(b.position, seat.position))[0];
    const assetFront = { x: print.front.x * Math.cos(turn) + print.front.z * Math.sin(turn), z: -print.front.x * Math.sin(turn) + print.front.z * Math.cos(turn) };
    const across = width >= depth ? az : ax;
    const face = table ? (() => { const toward = { x: table.position.x - seat.position.x, z: table.position.z - seat.position.z }; const sign = Math.sign(toward.x * across.x + toward.z * across.z) || 1; return { x: across.x * sign, z: across.z * sign }; })() : assetFront;
    return offsets.map(offset => ({ root: { x: r2(seat.position.x + long.x * offset + face.x * 0.04), z: r2(seat.position.z + long.z * offset + face.z * 0.04) }, face, table }))
      .filter(spot => ![...occupiedBy].some(([id, other]) => id !== self && dist(other, spot.root) < 0.42));
  }
  function findSeat(actor: Actor, ref?: string): { root: P; face: P; label: string; lift: number } | undefined {
    const near = actor.at;
    // 整块布景（名字里带“床”“沙发”的三壁内景）不当成座位物体：在它里面射线找座面。
    const resolved = ref ? resolveStageRef(document, ref, { near, labels, exclude: actor.object.id }) : undefined;
    const named = resolved && !isEnvironment(resolved) ? resolved : undefined;
    const around = named ? positionOf(named) : near;
    const occupied = [...occupiedBy].filter(([id]) => id !== actor.object.id).map(([, p]) => p);
    const partner = actor.partner ? document.objects.find(object => object.id === actor.partner) : undefined;
    // 先在近处找；近处没空位再放宽（指定了地方时4.5米、没指定7米），走过去坐。
    const passes = named ? [2.4, 4.5] : ref ? [6, 8] : [3.2, 7];
    for (const radius of passes) {
      // 单独的座位物体（椅子、凳子、条凳、沙发）：按位子切、朝向桌子。
      const seats = named && seatPattern.test(named.name + named.asset.name) ? [named] : document.objects.filter(object => object.visible && !isStageActor(object) && !isEnvironment(object) && seatPattern.test(object.name + object.asset.name) && dist(object.position, around) < radius);
      let best: { root: P; face: P; seat: SceneObject; score: number } | undefined;
      for (const seat of seats) for (const spot of seatSpots(seat, actor.object.id)) {
        const score = dist(spot.root, near) + (named && !seatPattern.test(named.name) ? dist(spot.root, named.position) * 0.5 : 0);
        if (!best || score < best.score) best = { root: spot.root, face: spot.face, seat, score };
      }
      if (best) return { root: best.root, face: best.face, label: labels.get(best.seat.id) ?? best.seat.name, lift: 0 };
      // 椅子、沙发、床是整块布景的一部分（找不到单独的座位物体）：射线量座面。
      const probe = surfaceProbeFor(document, around, radius + 0.4, options.geometry);
      const spots = findRaySeats(probe, around, radius, occupied, near, named ? positionOf(named) : partner ? positionOf(partner) : undefined);
      probe.dispose();
      // 说了座位类型就只坐那一类（坐满了就不坐，别退到茶几上）；床要整张床，沙发要带靠背的长座。
      const spot = ref && /床|榻/.test(ref) ? spots.find(item => item.bed) ?? spots.find(item => item.span >= 1.2 && item.depth >= 0.45) : ref && /沙发|卡座/.test(ref) ? spots.find(item => item.span >= 1 && item.back) : ref && /长凳|长椅|条凳|板凳/.test(ref) ? spots.find(item => item.span >= 1) ?? spots.find(item => !item.back) ?? spots[0] : ref && /椅/.test(ref) ? spots.find(item => item.back) : spots[0];
      // 座面比一般椅子高（长凳0.58、床0.6）时把人抬上去：坐姿髋部在根上0.51米。
      if (spot) return { root: spot.root, face: spot.face, label: named ? `${labels.get(named.id) ?? named.name}旁的座位` : ref ? ref : "身边的座位", lift: Math.max(0, Math.round((spot.seatY - spot.floorY - 0.46) * 100) / 100) };
    }
    return undefined;
  }

  // 时间：默认按列表顺序一条接一条；with=和上一条同时开始；at=绝对秒。同一个人永远一条接一条。
  // keep:true 是接着排（剧本分几次调用时的后半段）：整条时间轴从现有演绎的结尾往下排，不从0秒排——否则前半段早早演完的人，
  // 后半段的戏会插回前半段中间，和别人的台词叠在一起、顺序全乱。要插到某个时刻用at。
  const existingEnd = input.keep ? Math.max(0, ...tracks.filter(track => track.enabled !== false).map(track => { const object = document.objects.find(item => item.id === track.objectId); return object ? clipsEnd(getPerformanceClips(track, object)) : 0; })) : 0;
  let previousStart = existingEnd, previousEnd = existingEnd;
  const describe = (actor: Actor, start: number, duration: number, text: string) => done.push(`${actor.label}：${r2(start)}–${r2(start + duration)}秒 ${text}`);
  for (const [index, action] of input.actions.entries()) {
    const tag = `第${index + 1}条`;
    const matched = matchStageVerb(action.do ?? "");
    if (!matched) { skipped.push(`${tag}：不认识动作“${action.do}”，可用：${stageVerbNames.join("、")}`); continue; }
    const { verb } = matched;
    const toText = typeof action.to === "string" && action.to.trim() ? action.to : Array.isArray(action.to) ? undefined : matched.rest || undefined;
    const whoText = action.who?.trim() ?? "";
    const many = /们$|全部|所有|大家|都/.test(whoText);
    const whoKey = whoText.replace(/们$|^(全部|所有|大家)的?/, "").trim() || whoText;
    const subjects = many ? document.objects.filter(object => object.visible && (verb.kind === "effect" ? !isStageActor(object) : isStageActor(object)) && (object.name.includes(whoKey) || labels.get(object.id)?.includes(whoKey))) : [];
    const single = !many ? (verb.kind === "effect" ? resolveStageRef(document, whoText, { kind: "thing", labels, near: center }) : resolveStageRef(document, whoText, { kind: "actor", labels, near: center })) ?? resolveStageRef(document, whoText, { labels, near: center }) : undefined;
    const list = many ? subjects.slice(0, 40) : single ? [single] : [];
    if (!list.length) { skipped.push(`${tag}：场景里没有“${whoText}”${verb.kind === "effect" ? "" : "，可以先在cast里新建这个角色"}`); continue; }
    const start = Number.isFinite(action.at) ? Math.max(0, action.at!) : action.with ? previousStart : previousEnd;
    let end = start, actualStart = Infinity;
    for (const object of list) {
      const actor = actorFor(object);
      const from = actor.at;
      const begin = Math.max(start, actor.cursor);
      let duration = 0;
      const targetRef = toText ?? action.face;
      const target = targetRef ? resolveStageRef(document, targetRef, { near: from, labels, exclude: object.id }) : undefined;
      if (verb.kind === "clear" && !/取消|清除|清空|删掉|删除|clear/i.test(action.do ?? "") && actor.steps.length) {
        // 这次前面已经给他排了动作（跑着、绕着）：“停下”是停住站着，不是把刚排的全清掉（2026-11-16 抢凳子：乙绕了几圈后“停下”，整段绕圈被清掉、乙站在旁边不动）。
        duration = Math.max(0.5, action.seconds ?? 0.8);
        actor.steps.push({ kind: "pose", start: begin, duration, label: "停住", ...(target && isStageActor(target) ? { target: target.id } : {}) });
        describe(actor, begin, duration, "停住");
      } else if (verb.kind === "clear") {
        // 清掉这个人原来的全部动作（之后这次还给他安排的会重新编排）。
        actor.steps = []; actor.kept = []; actor.cursor = 0; actor.cleared = true;
        actor.at = { x: object.position.x, z: object.position.z };
        describe(actor, begin, 0, "停下（清掉原来的动作）");
        continue;
      } else if (verb.kind === "circle") {
        if (actor.state && actor.state !== "fold" && actor.state !== "crouch" && !actor.vehicle && !actor.animal) duration += standUp(actor, begin);
        const point = parsePoint(action.to);
        const hub = point ?? (target ? positionOf(target) : undefined);
        if (!hub) { skipped.push(`${tag}：${verb.name}要给to（绕着谁或哪件东西，或[x,z]）`); continue; }
        const rect = target && !isStageActor(target) ? objectRect(target)?.rect : undefined;
        const radius = r2(Math.max(0.9, rect ? Math.max(rect.hw, rect.hd) + 0.75 : target ? 1.2 : 1.1));
        const text = `${action.do ?? ""}${toText ?? ""}`;
        const numerals: Record<string, number> = { 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10 };
        const lapsText = /(\d+(?:\.\d+)?|[一二两三四五六七八九十])\s*圈/.exec(text)?.[1];
        const speed = action.speed && action.speed > 0 ? Math.min(8, action.speed) : verb.speed;
        const lap = 2 * Math.PI * radius;
        const laps = lapsText ? Number(lapsText) || numerals[lapsText] || 2 : action.seconds && action.seconds > 0.5 ? action.seconds * speed / lap : 2;
        const turn = /顺时针/.test(text) ? -1 : 1;
        const key = `${r2(hub.x)},${r2(hub.z)}`;
        const group = circling.get(key) ?? [];
        let angle = Math.atan2(from.z - hub.z, from.x - hub.x);
        const together = group.filter(item => Math.abs(item.start - begin) < 0.6);
        if (together.length) angle = together[0]!.angle + 2 * Math.PI * together.length / (together.length + 1);
        const ring = (a: number): P => ({ x: r2(hub.x + Math.cos(a) * radius), z: r2(hub.z + Math.sin(a) * radius) });
        const path: P[] = [from];
        if (dist(from, ring(angle)) > 0.3) path.push(ring(angle));
        const count = Math.max(6, Math.ceil(laps * 12));
        for (let i = 1; i <= count; i++) path.push(ring(angle + turn * 2 * Math.PI * laps * i / count));
        const length = path.reduce((sum, p, i) => i ? sum + dist(path[i - 1]!, p) : 0, 0);
        const seconds = action.seconds && action.seconds > 0.5 && !action.speed && !lapsText ? action.seconds + dist(from, ring(angle)) / speed : length / speed;
        // 一起绕的人同时踏上圆周：先到起点的原地等后到的，绕的时候一直隔开（不然后到的一直落后半圈追着跑，看着像挤在一起）。
        const leadIn = dist(from, ring(angle)) / speed;
        const latest = Math.max(leadIn, ...together.map(item => item.leadIn));
        const delay = round(latest - leadIn);
        const step: Extract<Step, { kind: "walk" }> = { kind: "walk", start: round(begin + duration + delay), duration: round(seconds), path, y: actor.y, speed: length / seconds, verb: { kind: "walk", name: verb.name, speed }, label: `${verb.name}${targetRef ?? ""}` };
        for (const other of together) if (other.leadIn < latest - 0.02) {
          const shift = round(latest - other.leadIn);
          other.step.start = round(other.step.start + shift); other.actor.cursor = round(other.actor.cursor + shift); other.leadIn = latest;
          done[other.line] = done[other.line]!.replace(/：([\d.]+)–([\d.]+)秒/, (_, a: string, b: string) => `：${r2(Number(a) + shift)}–${r2(Number(b) + shift)}秒`);
        }
        actor.steps.push(step);
        group.push({ start: begin, angle, leadIn: latest, step, actor, line: done.length });
        circling.set(key, group);
        duration += delay + seconds;
        actor.at = path.at(-1)!;
        actor.yaw = yawOf(norm(actor.at.x - path.at(-2)!.x, actor.at.z - path.at(-2)!.z));
        occupiedBy.set(object.id, actor.at);
        describe(actor, begin, duration, `${verb.name}${targetRef ?? ""}（${Math.round(laps * 10) / 10}圈）`);
      } else if (verb.kind === "effect") {
        if (isStageActor(object)) { skipped.push(`${tag}：${actor.label}是人物，${verb.name}要加在物体上（比如马车、房子）`); continue; }
        duration = action.seconds ?? (verb.effect === "explosion" ? 3 : 8);
        actor.steps.push({ kind: "effect", start: begin, duration, label: verb.name, effect: verb.effect });
        describe(actor, begin, duration, verb.name);
      } else if (verb.kind === "walk" || verb.kind === "exit") {
        if (actor.state && actor.state !== "fold" && actor.state !== "crouch" && !actor.vehicle && !actor.animal) duration += standUp(actor, begin);
        let goal: P | undefined;
        let endY: number | undefined;
        const point = parsePoint(action.to);
        if (point && Array.isArray(action.to) && action.to.length === 3) endY = action.to[1];
        if (verb.kind === "exit" && !point && !target) {
          const others = [...occupiedBy].filter(([id, p]) => id !== object.id && dist(p, from) < 6).map(([, p]) => p);
          const away = others.length ? norm(from.x - others.reduce((s, p) => s + p.x, 0) / others.length, from.z - others.reduce((s, p) => s + p.z, 0) / others.length) : dirOf(actor.yaw);
          goal = freeNear({ x: r2(from.x + away.x * 5), z: r2(from.z + away.z * 5) }, object.id, from);
        } else if (point) goal = verb.kind === "walk" && verb.parkour ? point : freeNear(point, object.id, from) ?? point;
        else if (target && verb.kind === "walk" && verb.parkour && !isStageActor(target)) {
          // 飞身上房、上墙头：落点在这件东西的顶上（y取顶面高度），运行时按飞檐走壁找屋脊、瓦面站稳。
          const print = footprintOf(target.asset);
          goal = { x: r2(target.position.x), z: r2(target.position.z) };
          endY = r2(target.position.y + (print ? print.height * target.scale.y : 3));
        } else if (target && verb.kind === "walk" && verb.parkour) { goal = approach(actor, target, 0.9) ?? { x: positionOf(target).x + 0.8, z: positionOf(target).z }; endY = actors.get(target.id)?.y ?? target.position.y; }
        else if (target) goal = actor.vehicle ? { x: target.position.x, z: target.position.z } : approach(actor, target, isStageActor(target) ? (verb.speed > 4 ? 0.9 : 1.2) : 0.45);
        else if (targetRef) { skipped.push(`${tag}：没找到“${targetRef}”，${actor.label}没有动`); continue; }
        else { skipped.push(`${tag}：${verb.name}要给去处to（人名、物体名或[x,z]坐标）`); continue; }
        if (!goal) { skipped.push(`${tag}：${targetRef ?? "目标"}附近没有空地，${actor.label}没有动`); continue; }
        const speed = action.speed && action.speed > 0 ? Math.min(12, action.speed) : verb.speed;
        const path = actor.needsObject && !actor.vehicle ? gridPath(from, goal, obstacles, half) : [from, goal];
        const length = path.reduce((sum, p, i) => i ? sum + dist(path[i - 1]!, p) : 0, 0);
        if (length < 0.15) { notes.push(`${actor.label}已经在${targetRef ?? "那里"}，不用走`); }
        else {
          const seconds = action.seconds && action.seconds > 0.3 && !action.speed ? action.seconds : length / speed;
          actor.steps.push({ kind: "walk", start: round(begin + duration), duration: round(seconds), path, y: actor.y, ...(endY !== undefined ? { endY } : {}), speed: length / seconds, verb, label: `${verb.name}${targetRef ?? (verb.kind === "exit" ? "（离场）" : "")}` });
          if (endY !== undefined) actor.y = endY;
          duration += seconds;
          actor.yaw = yawOf(norm(goal.x - path.at(-2)!.x, goal.z - path.at(-2)!.z));
          actor.at = goal;
          occupiedBy.set(object.id, goal);
        }
        if (target && isStageActor(target)) { actor.partner = target.id; const other = actors.get(target.id); if (other && !other.partner) other.partner = object.id; }
        describe(actor, begin, duration, `${verb.name}${point ? `[${r2(goal.x)},${r2(goal.z)}]` : targetRef ?? ""}`);
      } else {
        if (actor.vehicle || actor.animal) { skipped.push(`${tag}：${actor.label}不是人，不能“${verb.name}”`); continue; }
        // 胶囊人有头、身子、腿三段关节：坐、蹲、跪、倒地、点头、摇头、鞠躬、说话、看向、起跳自己做，不换成骨骼人物；
        // 只有挥手、拾取、指向这类要用手的动作才换（用户要胶囊人时连这些也不换，改成朝对方身子一倾）。
        if (!actor.rig && actor.object.asset.shape === "person" && (capsuleMode || capsuleCan(verb))) {
          duration = capsuleAction(actor, verb, action, begin, target, toText, tag);
          if (duration < 0) continue;
        } else {
        if (!upgrade(actor, `胶囊人没有手臂，不能${verb.name}`)) { skipped.push(`${tag}：没有骨骼人物素材，${actor.label}不能${verb.name}`); continue; }
        // 面对的人：给了to/face用它；说话没给就对着最近的人。
        let faceTarget = target;
        if (!faceTarget && (verb.kind === "talk" || verb.kind === "preset" && /wave|beckon|bow|salute|nod|shake|point|punch/.test(verb.preset))) {
          // 先对着刚才打交道的人，再对着这次一起演的人，最后才是身边最近的人。
          const partner = actor.partner ? document.objects.find(other => other.id === actor.partner) : undefined;
          const near = (list: SceneObject[]) => list.map(other => ({ other, d: dist(positionOf(other), actor.at) })).filter(item => item.d < 5).sort((a, b) => a.d - b.d)[0]?.other;
          faceTarget = partner && dist(positionOf(partner), actor.at) < 6 ? partner : near([...actors.values()].filter(other => other !== actor && !other.vehicle).map(other => other.object)) ?? near(document.objects.filter(other => other.visible && other.id !== object.id && isStageActor(other)));
        }
        if (faceTarget && isStageActor(faceTarget)) actor.partner = faceTarget.id;
        const seated = actor.state === "sit";
        if (verb.kind === "sit") {
          if (seated) { notes.push(`${actor.label}已经坐着`); continue; }
          // 坐在地上、席地、盘腿：没有座位也行，跪坐在原地。
          if (/地上|地面|地板|席地|盘腿|打坐/.test(`${action.do ?? ""}${toText ?? ""}`)) {
            const preset = motionPresets.find(item => item.id === "kneel")!;
            duration = Math.max(1, action.seconds ?? 3);
            actor.steps.push({ kind: "pose", start: begin, duration, label: "坐在地上", motion: preset.build(duration), state: "kneel" });
            actor.state = "kneel";
            describe(actor, begin, duration, "坐在地上（跪坐）");
            actor.cursor = round(begin + duration); end = Math.max(end, begin + duration); actualStart = Math.min(actualStart, begin);
            continue;
          }
          const seat = findSeat(actor, toText);
          if (!seat) {
            // 没有空座位就不坐（原地坐会像坐在空中）：站着等，告诉模型换个有空座位的地方。
            duration = Math.max(1, action.seconds ?? 2);
            actor.steps.push({ kind: "pose", start: begin, duration, label: "站着", ...(faceTarget ? { target: faceTarget.id } : {}) });
            notes.push(toText ? `${toText}附近的座位都有人或没有座位，${actor.label}没坐、先站着；要坐就给to写别的有空椅子、凳子、沙发的地方，或说“坐在地上”` : `${actor.label}身边3米内没有空座位，没坐、先站着；要坐就给to写有空椅子、沙发或桌子的地方，或说“坐在地上”`);
            describe(actor, begin, duration, "站着（附近没有空座位）");
            actor.cursor = round(begin + duration); end = Math.max(end, begin + duration); actualStart = Math.min(actualStart, begin);
            continue;
          } else {
            actor.needsObject = true;
            const path = gridPath(actor.at, seat.root, obstacles, half, environmentBlocked);
            const length = path.reduce((sum, p, i) => i ? sum + dist(path[i - 1]!, p) : 0, 0);
            if (length > 0.1) {
              const seconds = length / 1.2;
              actor.steps.push({ kind: "walk", start: round(begin), duration: round(seconds), path, y: actor.y, speed: 1.2, verb: { kind: "walk", name: "走到", speed: 1.2 }, label: `走到${seat.label}`, ...(seat.lift > 0.03 ? { lift: seat.lift } : {}) });
              duration += seconds;
            }
            const faceYaw = yawOf(seat.face);
            actor.steps.push({ kind: "turn", start: round(begin + duration), duration: 0.4, yaw: faceYaw, label: "转身" });
            duration += 0.4;
            actor.at = seat.root; actor.yaw = faceYaw; occupiedBy.set(object.id, seat.root);
          }
          const sitDown = getCharacterAnimation("cc0SitDown")!;
          actor.steps.push({ kind: "pose", start: round(begin + duration), duration: sitDown.duration, label: "坐下", animation: sitDown.id, state: "sit" });
          duration += sitDown.duration;
          const hold = Math.max(0, (action.seconds ?? 2) - sitDown.duration);
          if (hold > 0.2) { actor.steps.push({ kind: "pose", start: round(begin + duration), duration: hold, label: "坐着", animation: "cc0SitIdle", loop: true, state: "sit" }); duration += hold; }
          actor.state = "sit";
          describe(actor, begin, duration, `坐下${seat ? `（坐在${seat.label}）` : ""}`);
        } else if (verb.kind === "stand") {
          if (!actor.state) { notes.push(`${actor.label}本来就站着`); continue; }
          const standUp = getCharacterAnimation(actor.state === "sit" ? "cc0StandUp" : "cc0LayToIdle")!;
          duration = standUp.duration;
          actor.steps.push({ kind: "pose", start: begin, duration, label: "起身", animation: standUp.id });
          actor.state = undefined;
          describe(actor, begin, duration, "起身");
        } else if (verb.kind === "face") {
          duration = action.seconds ?? 1;
          if (faceTarget || target) {
            const there = positionOf((faceTarget ?? target)!);
            actor.steps.push({ kind: "turn", start: begin, duration: Math.min(0.6, duration), yaw: yawOf(norm(there.x - actor.at.x, there.z - actor.at.z)), target: (faceTarget ?? target)!.id, label: "看向" });
            if (duration > 0.6) actor.steps.push({ kind: "pose", start: round(begin + 0.6), duration: round(duration - 0.6), label: "看着", target: (faceTarget ?? target)!.id, ...(seated ? { animation: "cc0SitIdle", loop: true, state: "sit" as const } : {}) });
            actor.yaw = yawOf(norm(there.x - actor.at.x, there.z - actor.at.z));
          } else if (parsePoint(action.to)) {
            const there = parsePoint(action.to)!;
            actor.yaw = yawOf(norm(there.x - actor.at.x, there.z - actor.at.z));
            actor.steps.push({ kind: "turn", start: begin, duration: Math.min(0.6, duration), yaw: actor.yaw, label: "转向" });
            actor.needsObject ||= true;
          } else { skipped.push(`${tag}：看向要给to（看谁/看哪件东西）`); continue; }
          describe(actor, begin, duration, `看向${targetRef ?? ""}`);
        } else if (verb.kind === "talk") {
          duration = action.seconds && action.seconds > 0.3 ? action.seconds : action.line ? estimateLineSeconds(action.line) : 3;
          const name = action.line ? `说：${action.line}`.slice(0, 160) : "交谈";
          // 坐着说话：坐姿做底、手和头比划；动作库底子和骨骼覆盖共用源时间，一段最长8秒，长台词切成几段。
          if (seated) for (let offset = 0; offset < duration - 0.05; offset += 8) { const piece = Math.min(8, duration - offset); actor.steps.push({ kind: "pose", start: round(begin + offset), duration: piece, label: name, base: "cc0SitIdle", motion: seatedTalk(piece), target: faceTarget?.id, state: "sit" }); }
          else actor.steps.push({ kind: "pose", start: begin, duration, label: name, animation: "cc0Talk", loop: true, target: faceTarget?.id });
          describe(actor, begin, duration, `${action.line ? `说“${action.line.slice(0, 30)}”` : "交谈"}${faceTarget ? `（对${labels.get(faceTarget.id)}）` : ""}`);
        } else if (verb.kind === "wait") {
          duration = action.seconds ?? 2;
          actor.steps.push({ kind: "pose", start: begin, duration, label: "站着", target: faceTarget?.id, ...(seated ? { animation: "cc0SitIdle", loop: true, state: "sit" as const, label: "坐着" } : actor.state === "kneel" || actor.state === "lie" ? { motion: motionPresets.find(p => p.id === (actor.state === "kneel" ? "kneel" : "fall"))!.build(duration), state: actor.state, label: actor.state === "kneel" ? "跪着" : "躺着" } : {}) });
          describe(actor, begin, duration, seated ? "坐着" : "站着");
        } else if (verb.kind === "anim") {
          const animation = getCharacterAnimation(verb.animation)!;
          if (seated && verb.animation !== "cc0Consume") { notes.push(`${actor.label}坐着，先起身再${verb.name}`); const standUp = getCharacterAnimation("cc0StandUp")!; actor.steps.push({ kind: "pose", start: begin, duration: standUp.duration, label: "起身", animation: standUp.id }); duration += standUp.duration; actor.state = undefined; }
          const length = verb.loop ? Math.max(animation.duration, action.seconds ?? Math.max(2, animation.duration)) : animation.duration;
          // 坐着吃喝：坐姿做底、右手在桌面和嘴边来回（动作库的吃喝是站着的），一段最长8秒。
          if (seated && verb.animation === "cc0Consume") for (let offset = 0; offset < length - 0.05; offset += 8) { const piece = Math.min(8, length - offset); actor.steps.push({ kind: "pose", start: round(begin + duration + offset), duration: piece, label: verb.name, base: "cc0SitIdle", motion: seatedEat(piece), target: faceTarget?.id, state: "sit" }); }
          else actor.steps.push({ kind: "pose", start: round(begin + duration), duration: length, label: verb.name, animation: animation.id, loop: verb.loop, target: faceTarget?.id, ...(verb.hold ? { state: verb.hold } : {}) });
          if (verb.animation === "cc0JumpStart") { const land = getCharacterAnimation("cc0JumpLand")!; actor.steps.push({ kind: "pose", start: round(begin + duration + length), duration: land.duration, label: "落地", animation: land.id }); duration += land.duration; }
          duration += length;
          if (verb.hold) actor.state = verb.hold; else if (actor.state === "crouch" || actor.state === "fold") actor.state = undefined;
          describe(actor, begin, duration, verb.name);
        } else if (verb.kind === "preset") {
          const preset = findMotionPreset(verb.preset)!;
          if (seated && (preset.id === "kneel" || preset.id === "fall")) { const standUp = getCharacterAnimation("cc0StandUp")!; actor.steps.push({ kind: "pose", start: begin, duration: standUp.duration, label: "起身", animation: standUp.id }); duration += standUp.duration; actor.state = undefined; }
          const length = Math.max(preset.seconds * 0.6, action.seconds ?? preset.seconds);
          const state = preset.id === "kneel" ? "kneel" as const : preset.id === "fall" ? "lie" as const : undefined;
          actor.steps.push({ kind: "pose", start: round(begin + duration), duration: length, label: preset.name, motion: preset.build(length), target: faceTarget?.id, ...(state ? { state } : actor.state === "sit" ? { base: "cc0SitIdle", state: "sit" as const } : {}) });
          duration += length;
          if (state) actor.state = state;
          describe(actor, begin, duration, `${preset.name}${faceTarget && verb.preset !== "kneel" ? `（对${labels.get(faceTarget.id)}）` : ""}`);
        }
        }
      }
      actor.cursor = round(begin + duration);
      end = Math.max(end, begin + duration);
      actualStart = Math.min(actualStart, begin);
    }
    previousStart = Number.isFinite(actualStart) ? actualStart : start;
    previousEnd = Math.max(end, previousStart);
  }

  // 编译成轨道片段。
  const life = getSceneLife(document.life);
  const allTracks = [...(life.tracks ?? [])];
  const changedTrackIds: string[] = [], removed: string[] = [];
  const otherEnds = getPerformanceTracks(document.life, document.objects, document.objectGroups).filter(track => !actors.has(track.objectId)).map(track => { const object = document.objects.find(item => item.id === track.objectId); return object && track.enabled !== false ? clipsEnd(getPerformanceClips(track, object)) : 0; });
  const filmEnd = (document.cameras ?? []).reduce((end, camera) => Math.max(end, ...(camera.shots ?? []).map(shot => shot.end)), 0);
  const stageEnd = Math.max(8, filmEnd, ...otherEnds, ...[...actors.values()].map(actor => actor.cursor)) + 1;
  for (const actor of actors.values()) {
    if (!actor.steps.length) {
      if (actor.cleared && actor.track) { const index = allTracks.findIndex(item => item.id === actor.track!.id); if (index >= 0) { allTracks.splice(index, 1); removed.push(actor.label); } }
      continue;
    }
    const object = actor.object;
    // 最后停在坐、跪、躺、蹲、抱臂的人用直接控制：姿势一直保持到片尾（导航轨道的动作做完会站回来，片尾又随镜头变长）。
    if (actor.state && (actor.rig || actor.object.asset.shape === "person") && !actor.vehicle && !actor.animal) actor.needsObject = true;
    const objectActor = actor.needsObject && !actor.vehicle && !actor.animal;
    if (!objectActor && actor.steps.some(step => step.kind === "effect") && actor.steps.some(step => step.kind !== "effect")) {
      actor.steps = actor.steps.filter(step => step.kind !== "effect");
      notes.push(`${actor.label}在移动，同一个物体不能同时又走又起火冒烟，效果没加；可以给它旁边的东西加`);
    }
    const clips = objectActor ? compileObjectActor(actor, { route: (a, b) => gridPath(a, b, obstacles, half, environmentBlocked), floorAt, positionOf: id => { const other = document.objects.find(item => item.id === id); return other ? positionOf(other) : undefined; } }, options.createId) : compileNavActor(actor, stageEnd, options.createId);
    const parkour = actor.steps.some(step => step.kind === "walk" && step.verb.kind === "walk" && step.verb.parkour);
    const previous = actor.track;
    const objectTrack = actor.needsObject || actor.vehicle && actor.steps.every(step => step.kind === "effect");
    const track: PerformanceTrack = {
      id: previous?.id ?? options.createId(), objectId: object.id, name: (previous?.name && !previous.name.startsWith("台词·") ? previous.name : object.name).slice(0, 160),
      points: [[object.position.x, object.position.y, object.position.z]],
      clips: [...actor.kept, ...clips].sort((a, b) => a.start - b.start),
      ...(objectTrack ? { controller: "object" as const } : {}),
      ...(!objectTrack && actor.vehicle ? { mode: "path" as const } : {}),
      ...(!objectTrack && parkour ? { parkour: true } : {}),
    };
    if (track.clips!.length > 128) throw new Error(`${actor.label}的动作太多（超过128段），请分几次安排`);
    const index = allTracks.findIndex(item => item.id === track.id || item.objectId === object.id);
    if (index >= 0) allTracks[index] = track; else allTracks.push(track);
    changedTrackIds.push(track.id);
  }
  document = { ...document, life: { ...life, enabled: true, running: true, tracks: allTracks } };
  const seconds = Math.max(0, ...[...actors.values()].map(actor => actor.cursor));
  return { document, changedTrackIds, removed, done, created, upgraded, notes, skipped, seconds: r2(seconds) };
}

/** 坐着说话：坐姿待机做底，右手小幅比划、头轻点。 */
/** 坐着吃喝：右手从桌面送到嘴边再放下（按坐姿骨点调过：指尖到嘴前约0.1米）。 */
function seatedEat(seconds: number): SkeletalMotion {
  const table = { rightUpperArm: [-40, 0, 15] as [number, number, number], rightForeArm: [-80, 0, 0] as [number, number, number], head: [8, 0, 0] as [number, number, number] };
  const mouth = { rightUpperArm: [-80, 35, 40] as [number, number, number], rightForeArm: [-120, 35, 0] as [number, number, number], head: [0, 0, 0] as [number, number, number] };
  const keyframes: SkeletalMotion["keyframes"] = [{ time: 0, rotations: { rightUpperArm: [0, 0, 0], rightForeArm: [0, 0, 0], head: [0, 0, 0] } }, { time: 0.4, rotations: table }];
  let time = 0.4;
  for (let index = 0; time + 0.7 < seconds - 0.4 && keyframes.length < 29; index++) { time += 0.7; keyframes.push({ time: round(time), rotations: index % 2 ? table : mouth }); }
  keyframes.push({ time: round(Math.max(time + 0.3, seconds)), rotations: { rightUpperArm: [0, 0, 0], rightForeArm: [0, 0, 0], head: [0, 0, 0] } });
  return { keyframes };
}
function seatedTalk(seconds: number): SkeletalMotion {
  const keyframes: SkeletalMotion["keyframes"] = [{ time: 0, rotations: { rightUpperArm: [0, 0, 0], rightForeArm: [0, 0, 0], head: [0, 0, 0] } }];
  let time = 0;
  for (let index = 0; time + 0.6 < seconds - 0.4 && keyframes.length < 30; index++) {
    time += 0.6;
    keyframes.push({ time: round(time), rotations: { rightUpperArm: [-30, 0, 8], rightForeArm: [index % 2 ? -70 : -95, 0, 0], head: [index % 3 === 0 ? 8 : 0, index % 2 ? 6 : -6, 0] } });
  }
  keyframes.push({ time: round(Math.max(time + 0.3, seconds)), rotations: { rightUpperArm: [0, 0, 0], rightForeArm: [0, 0, 0], head: [0, 0, 0] } });
  return { keyframes };
}

function poseClips(step: Extract<Step, { kind: "pose" }>, createId: () => string, extendTo?: number): PerformanceClip[] {
  const clips: PerformanceClip[] = [];
  const total = extendTo !== undefined ? Math.max(step.duration, extendTo - step.start) : step.duration;
  const common = { ...(step.target ? { target: step.target } : {}) };
  if (step.motion) {
    const length = step.motion.keyframes.at(-1)!.time;
    let motion = extendTo !== undefined && total > length + 0.05 ? { keyframes: [...step.motion.keyframes, { ...step.motion.keyframes.at(-1)!, time: round(Math.min(300, total)) }] } : step.motion;
    const playback = motion.keyframes.at(-1)!.time;
    // 动作库底子（如坐姿）和骨骼覆盖共用源时间、源时长必须是动作库的真实时长：把覆盖的关键帧压进这段源时长，用rate放慢回实际时长。
    const base = step.base ? getCharacterAnimation(step.base) : undefined;
    if (base && playback * 0.1 <= base.duration + 0.0001) {
      const scale = base.duration / playback;
      motion = { ...motion, keyframes: motion.keyframes.map((frame, index) => ({ ...frame, time: index === motion.keyframes.length - 1 ? base.duration : round(frame.time * scale) })) };
      clips.push({ id: createId(), name: step.label, kind: "pose", start: round(step.start), sourceDuration: base.duration, sourceIn: 0, sourceOut: base.duration, rate: round(Math.max(0.1, Math.min(8, scale))), animation: base.id, motion, ...common });
      return clips;
    }
    clips.push({ id: createId(), name: step.label, kind: "pose", start: round(step.start), sourceDuration: round(playback), sourceIn: 0, sourceOut: round(playback), rate: 1, motion, ...common });
    return clips;
  }
  if (!step.animation) {
    clips.push({ id: createId(), name: step.label, kind: "pose", start: round(step.start), sourceDuration: round(Math.max(0.1, total)), sourceIn: 0, sourceOut: round(Math.max(0.1, total)), rate: 1, action: "wait", ...common });
    return clips;
  }
  const animation = getCharacterAnimation(step.animation)!;
  if (!step.loop) {
    clips.push({ id: createId(), name: step.label, kind: "pose", start: round(step.start), sourceDuration: animation.duration, sourceIn: 0, sourceOut: animation.duration, rate: 1, animation: animation.id, ...common });
    return clips;
  }
  // 循环动作（交谈、坐着、蹲着、抱臂）：按真实时长一段段接满；坐姿、抱臂这种待机放慢到0.5倍，段数少一半。
  const rate = /SitIdle|CrouchIdle|FoldArms/.test(animation.id) ? 0.5 : 1;
  const piece = animation.duration / rate;
  for (let time = 0; time < total - 0.05 && clips.length < 60; time += piece) {
    const length = Math.min(piece, total - time);
    clips.push({ id: createId(), name: step.label, kind: "pose", start: round(step.start + time), sourceDuration: animation.duration, sourceIn: 0, sourceOut: Math.min(animation.duration, round(length * rate)), rate, animation: animation.id, ...common });
  }
  return clips;
}

function compileNavActor(actor: Actor, stageEnd: number, createId: () => string): PerformanceClip[] {
  const clips: PerformanceClip[] = [];
  const steps = [...actor.steps].sort((a, b) => a.start - b.start);
  const last = steps.filter(step => step.kind === "pose").at(-1);
  for (const step of steps) {
    if (step.kind === "walk") {
      const points = step.path.map((p, index) => [r2(p.x), r2(index === step.path.length - 1 && step.endY !== undefined ? step.endY : step.y), r2(p.z)] as P3);
      clips.push({ id: createId(), name: step.label.slice(0, 60), kind: "move", start: round(step.start), sourceDuration: round(step.duration), sourceIn: 0, sourceOut: round(step.duration), rate: 1, points, ...(step.verb.kind === "walk" && step.verb.crouch ? { traversal: "crouch" as const } : {}) });
    } else if (step.kind === "pose") {
      // 导航轨道的动作结束就回到站姿：最后一个坐、蹲、跪、躺、抱臂一直保持到全片结束。
      const holdToEnd = step === last && !!step.state && step.start + step.duration < stageEnd;
      // 坐、蹲、抱臂接一段对应的待机循环保持到片尾（坐着说话的手势做完不能把坐姿也一起延长没了）；跪、躺是整身骨骼姿势，直接延长末帧。
      const loop = step.state === "sit" ? "cc0SitIdle" : step.state === "crouch" ? "cc0CrouchIdle" : step.state === "fold" ? "cc0FoldArms" : undefined;
      if (holdToEnd && loop && (step.motion || step.animation !== loop)) {
        clips.push(...poseClips(step, createId));
        clips.push(...poseClips({ kind: "pose", start: round(step.start + step.duration), duration: round(stageEnd - step.start - step.duration), label: step.state === "sit" ? "坐着" : step.label, animation: loop, loop: true, state: step.state, ...(step.target ? { target: step.target } : {}) }, createId));
      } else clips.push(...poseClips(step, createId, holdToEnd ? stageEnd : undefined));
    } else if (step.kind === "turn") {
      if (step.target) clips.push({ id: createId(), name: step.label, kind: "pose", start: round(step.start), sourceDuration: round(Math.max(0.3, step.duration)), sourceIn: 0, sourceOut: round(Math.max(0.3, step.duration)), rate: 1, action: "wait", target: step.target });
    } else if (step.kind === "effect") {
      clips.push({ id: createId(), name: step.label, kind: "effect", effect: step.effect, start: round(step.start), sourceDuration: round(step.duration), sourceIn: 0, sourceOut: round(step.duration), rate: 1 });
    }
  }
  return clips;
}

/** 直接控制：一段transform管位置和朝向（相对接受态、物体本地坐标），姿态片段管骨骼；姿态片段播完会保持，所以站着的空档补一段待机。 */
function compileObjectActor(actor: Actor, helpers: { route: (from: P, to: P) => P[]; floorAt?: (p: P) => number; positionOf: (id: string) => P | undefined }, createId: () => string): PerformanceClip[] {
  const object = actor.object;
  const baseYaw = object.rotation.y;
  const base = { x: object.position.x, z: object.position.z };
  // transform关键帧在物体本地坐标里（含物体的转角和缩放）。y是在原高度上抬起多少（坐到高凳、理发椅上）。
  const local = (p: P, y = 0): P3 => { const dx = p.x - base.x, dz = p.z - base.z, turn = -baseYaw * Math.PI / 180; return [round((dx * Math.cos(turn) + dz * Math.sin(turn)) / (object.scale.x || 1)), round(y / (object.scale.y || 1)), round((-dx * Math.sin(turn) + dz * Math.cos(turn)) / (object.scale.z || 1))]; };
  const print = footprintOf(object.asset);
  const frontYaw = yawOf(print?.front ?? { x: 0, z: 1 });
  let lastYaw = 0;
  const relYaw = (yaw: number) => { const next = lastYaw + wrap(yaw - frontYaw - baseYaw - lastYaw); lastYaw = next; return round(next); };
  const keyframes: { time: number; position: P3; rotation: P3 }[] = [{ time: 0, position: [0, 0, 0], rotation: [0, 0, 0] }];
  let here: P = base, lift = 0;
  const push = (time: number, p: P, yaw?: number, height = lift) => {
    const rotation: P3 = [0, yaw === undefined ? lastYaw : relYaw(yaw), 0];
    const previous = keyframes.at(-1)!;
    const at = round(Math.max(time, previous.time + 0.02));
    keyframes.push({ time: at, position: local(p, height), rotation });
    here = p; lift = height;
  };
  const clips: PerformanceClip[] = [];
  const steps = [...actor.steps].sort((a, b) => a.start - b.start);
  // 一开始的姿势：坐着的群演坐着，跪坐的跪着。
  if (actor.startState === "sit") clips.push({ id: createId(), name: "坐着", kind: "pose", start: 0, sourceDuration: getCharacterAnimation("cc0SitIdle")!.duration, sourceIn: 0, sourceOut: getCharacterAnimation("cc0SitIdle")!.duration, rate: 0.5, animation: "cc0SitIdle" });
  if (actor.startState === "kneel") { const motion = motionPresets.find(p => p.id === "kneel")!.build(1); const kneeled = { keyframes: [{ ...motion.keyframes.at(-1)!, time: 0 }, { ...motion.keyframes.at(-1)!, time: 0.5 }] }; clips.push({ id: createId(), name: "跪着", kind: "pose", start: 0, sourceDuration: 0.5, sourceIn: 0, sourceOut: 0.5, rate: 1, motion: kneeled }); }
  const walkAnimation = (speed: number, crouch?: boolean) => crouch ? "cc0CrouchWalk" : speed > 4.5 ? "cc0Sprint" : speed > 2.2 ? "cc0Run" : "cc0Walk";
  const nominal: Record<string, number> = { cc0Walk: 1.35, cc0Run: 3.5, cc0Sprint: 5.5, cc0CrouchWalk: 0.9 };
  let busyUntil = 0;
  const idleAfter = (time: number, next?: Step) => {
    // 站着的空档：下一个姿态不是马上接上，就补一段待机，免得停在走路或说话的最后一帧。
    if (next && (next.kind === "pose" || next.kind === "walk") && next.start <= time + 0.05) return;
    clips.push({ id: createId(), name: "待机", kind: "pose", start: round(time), sourceDuration: 0.2, sourceIn: 0, sourceOut: 0.2, rate: 1, action: "wait" });
  };
  for (const [index, step] of steps.entries()) {
    const next = steps[index + 1];
    if (step.kind === "walk") {
      // 导航用的直线两点：直接控制没有寻路，按占地网格绕开家具。
      const path = step.path.length === 2 ? helpers.route(step.path[0]!, step.path[1]!) : step.path;
      const total = path.reduce((sum, p, i) => i ? sum + dist(path[i - 1]!, p) : 0, 0) || 1;
      push(step.start, here);
      let travelled = 0;
      // 从高座位上下来走：第一步回到地面；走到高座位：最后一步抬到座面上。
      // 踩着地面走：起点、拐点和沿途每0.5米量一次脚下地面（台阶、门屋、台基、殿内地板），高度变了就加关键帧，人不陷进抬高的地板里。
      const startFloor = helpers.floorAt?.(base) ?? object.position.y;
      const heightAt = (p: P) => helpers.floorAt ? round(helpers.floorAt(p) - startFloor) : 0;
      for (let i = 1; i < path.length && keyframes.length < 600; i++) {
        const a = path[i - 1]!, b = path[i]!;
        const legYaw = yawOf(norm(b.x - a.x, b.z - a.z));
        const legStart = step.start + step.duration * travelled / total;
        const length = dist(a, b);
        const at = (t: number): P => ({ x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t });
        let height = heightAt(a);
        // 拐角先原地转过去（长的一段才需要；绕圈这种很短的一段段直接连着走）。
        if (length > 1) push(legStart + Math.min(0.25, step.duration * 0.2), at(0.05), legYaw, height);
        for (let d = 0.5; d < length - 0.25 && keyframes.length < 590; d += 0.5) {
          const next = heightAt(at(d / length));
          if (Math.abs(next - height) > 0.05) { push(step.start + step.duration * (travelled + d) / total, at(d / length), legYaw, next); height = next; }
        }
        travelled += length;
        push(step.start + step.duration * travelled / total, b, legYaw, heightAt(b) + (i === path.length - 1 ? step.lift ?? 0 : 0));
      }
      const animation = getCharacterAnimation(walkAnimation(step.speed, step.verb.kind === "walk" && step.verb.crouch))!;
      const rate = Math.max(0.5, Math.min(2, step.speed / (nominal[animation.id] ?? 1.35)));
      const piece = animation.duration / rate;
      // 胶囊人没有骨骼：不配走路、跑步动画，整个人平移过去。
      if (actor.rig) for (let time = 0; time < step.duration - 0.05 && clips.length < 110; time += piece) clips.push({ id: createId(), name: step.label.slice(0, 60), kind: "pose", start: round(step.start + time), sourceDuration: animation.duration, sourceIn: 0, sourceOut: Math.min(animation.duration, round((step.duration - time) * rate)), rate: round(rate), animation: animation.id });
      busyUntil = step.start + step.duration;
      idleAfter(busyUntil, next);
    } else if (step.kind === "turn") {
      push(step.start, here);
      push(step.start + step.duration, here, step.yaw);
      busyUntil = Math.max(busyUntil, step.start + step.duration);
    } else if (step.kind === "pose") {
      // 站着说话、做手势时转过去面对对象（直接控制的朝向由走位transform管）；坐着的不转身。
      const there = step.target && step.state !== "sit" && step.base !== "cc0SitIdle" ? helpers.positionOf(step.target) : undefined;
      if (there && dist(there, here) > 0.3) { push(step.start, here); push(step.start + 0.4, here, yawOf(norm(there.x - here.x, there.z - here.z))); }
      clips.push(...poseClips(step, createId));
      busyUntil = step.start + step.duration;
      // 坐、跪、躺、蹲、抱臂、举手、捂脸保持最后的姿势（直接控制的姿态播完会停在末帧）；其余做完回到待机。
      if (!step.state) idleAfter(busyUntil, next);
    } else if (step.kind === "effect") {
      clips.push({ id: createId(), name: step.label, kind: "effect", effect: step.effect, start: round(step.start), sourceDuration: round(step.duration), sourceIn: 0, sourceOut: round(step.duration), rate: 1 });
    }
  }
  // 一个变换片段最多64个关键帧：绕好几圈、走长路线时拆成首尾相接的几段（后一段从前一段最后那一帧接着走），后面的坐下、倒地不会被截掉。
  for (let index = 0; index < keyframes.length - 1; index += 63) {
    const chunk = keyframes.slice(index, index + 64);
    const start = chunk[0]!.time;
    const frames = chunk.map(frame => ({ ...frame, time: round(frame.time - start) }));
    const length = Math.max(0.05, frames.at(-1)!.time);
    clips.push({ id: createId(), name: index ? `走位${index / 63 + 1}` : "走位", kind: "transform", start: round(start), sourceDuration: length, sourceIn: 0, sourceOut: length, rate: 1, keyframes: frames });
  }
  return clips;
}

/**
 * ACT: 导航走不到时说清楚卡在哪：沿起点到去处的直线每0.1米量脚下地面，找人跨不过去的门槛、墙基（一道窄窄的凸起，比一边地面高出0.45米以上）
 * 或一步上下超过0.45米的台阶，报出是哪件物体、两边多高。2026-11-16 实例：祠堂门屋后壁开的门洞底下留了0.43米高的墙基，
 * 门屋地面0.31米、天井0米，导航连不过去，原来只说“去处太挤或被家具挡住”，模型就把祠堂戏挪到了门洞外面演。
 */
export function diagnoseWalk(document: SceneDocument, from: { x: number; z: number }, to: { x: number; z: number }, geometry?: StageGeometry): string | undefined {
  const length = Math.hypot(to.x - from.x, to.z - from.z);
  if (length < 0.5) return undefined;
  const center = { x: (from.x + to.x) / 2, z: (from.z + to.z) / 2 };
  const probe = surfaceProbeFor(document, center, length / 2 + 1, geometry);
  try {
    const ground = (x: number, z: number) => document.terrain ? getTerrainHeight(document.terrain, x, z) : 0;
    const steps = Math.ceil(length / 0.1);
    const owner = (x: number, z: number) => {
      const point = { x, z, hw: 0.3, hd: 0.3, angle: 0 };
      return document.objects.filter(object => object.visible && !/person/i.test(object.asset.shape ?? "")).map(object => ({ object, rect: objectRect(object)?.rect })).filter(entry => entry.rect && rectsOverlap(entry.rect, point)).sort((a, b) => a.rect!.hw * a.rect!.hd - b.rect!.hw * b.rect!.hd)[0]?.object;
    };
    const r = (value: number) => Math.round(value * 100) / 100;
    // 每0.1米：能站的高度（h，站不了是undefined）和最高的顶面（top）。
    const profile = Array.from({ length: steps + 1 }, (_, index) => {
      const t = index / steps, x = from.x + (to.x - from.x) * t, z = from.z + (to.z - from.z) * t;
      const sample = probe.sample(x, z);
      const h = !sample ? ground(x, z) : sample.up && sample.top - sample.floor <= 0.3 ? sample.top : undefined;
      return { x, z, h, top: sample && sample.top < 3 ? sample.top : h };
    });
    let level: number | undefined;
    const levels: (number | undefined)[] = [];
    for (let index = 0; index < profile.length; index++) {
      const here = profile[index]!;
      if (here.h !== undefined && (level === undefined || Math.abs(here.h - level) <= 0.45)) { level = here.h; levels[index] = level; continue; }
      if (level === undefined) continue;
      // 刚迈上去不到1米又落下去：是一道门槛、墙基，按两边地面说。
      // 刚迈上去不到半米又落下去：是一道门槛、墙基（薄），按两边地面说；桌子、长凳、控制台更厚，不算。
      let riseAt = -1;
      for (let j = index - 1; j >= Math.max(0, index - 10); j--) if (levels[j] !== undefined && level - levels[j]! > 0.2) { riseAt = j; break; }
      const before = riseAt >= 0 && (index - riseAt - 1) * 0.1 <= 0.6 ? levels[riseAt] : undefined;
      // 从这里起往前看1米：一道窄凸起（门槛、墙基）两边各是什么高度，中间最高多少。
      let peak = Math.max(level, here.top ?? level), after: number | undefined, stop = index;
      for (let k = index; k < Math.min(profile.length, index + 10); k++) {
        const item = profile[k]!;
        peak = Math.max(peak, item.top ?? item.h ?? peak);
        stop = k;
        if (item.h !== undefined && k > index && (Math.abs(item.h - level) <= 0.45 || k >= index + 6)) { after = item.h; break; }
      }
      after ??= profile[stop]!.h ?? level;
      const object = owner(here.x, here.z);
      const where = object ? `「${object.name}」` : "半路";
      if (before !== undefined && level - after > 0.45 && level - before > 0.2 && level - Math.max(before, after) <= 0.6) return `${where}那里有一道矮的拦挡（门槛、墙基或矮栏杆之类，顶面${r(level)}米，一边地面${r(before)}米、另一边${r(after)}米），人跨不过去；要让导航走过去：门槛、墙基就削到地面高度或在低的一边垫一级台阶，栏杆就留出缺口`;
      // 只有又矮（高出地面不到0.6米）又薄（顺着走的方向不到0.45米）的凸起才是门槛、墙基；更高、更厚的是家具、墙，导航本来就会绕开，不是走不到的原因。
      const floorLevel = Math.max(level, after);
      const thickness = profile.slice(index, stop + 1).filter(item => item.h === undefined || item.h > floorLevel + 0.1).length * 0.1;
      if (peak - Math.max(level, after) > 0.1 && peak - Math.min(level, after) > 0.45 && peak - Math.max(level, after) <= 0.6 && thickness <= 0.45) return `${where}那里有一道矮的拦挡（门槛、墙基或矮栏杆之类，顶面${r(peak)}米，一边地面${r(level)}米、另一边${r(after)}米），人跨不过去；要让导航走过去：门槛、墙基就削到地面高度或在低的一边垫一级台阶，栏杆就留出缺口`;
      if (Math.abs(after - level) > 0.45) return `${where}那里有一步${r(Math.abs(after - level))}米高的台阶（${r(level)}米到${r(after)}米），超过人能迈的0.45米；加一级台阶或坡道，导航就能走过去`;
      level = after;
      index = stop;
    }
    return undefined;
  } finally { probe.dispose(); }
}
