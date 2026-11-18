import type { SceneDocument } from "./sceneDocument";

// ACT: Agent 生成期间用户照常编辑、放素材、操控。交付时做三方合并：以发出请求那一刻的场景为底，
// Agent 改了、用户没动的地方用 Agent 的；用户动过的地方保留用户的（手上正在做的事优先）；
// 用户删掉的物体不会被 Agent 的结果带回来，Agent 删掉的物体只要用户没碰过就照删。
// 带 id 的列表（物体、分组、机位、轨道、时间轴分组）按 id 逐项合并，单项内按字段合并。

type Json = Record<string, unknown>;

function isPlain(value: unknown): value is Json {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
function isIdList(value: unknown): value is (Json & { id: string })[] {
  return Array.isArray(value) && value.every(item => isPlain(item) && typeof item.id === "string");
}

/** 按 JSON 语义比较（忽略键顺序，undefined 视为没有这个键）。 */
export function sameValue(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (!a || !b || typeof a !== "object" || typeof b !== "object") return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a)) {
    const list = b as unknown[];
    if (a.length !== list.length) return false;
    for (let index = 0; index < a.length; index++) if (!sameValue(a[index], list[index])) return false;
    return true;
  }
  const left = a as Json, right = b as Json;
  let count = 0;
  for (const key in left) {
    if (left[key] === undefined) continue;
    count++;
    if (!sameValue(left[key], right[key])) return false;
  }
  for (const key in right) if (right[key] !== undefined) count--;
  return count === 0;
}

function pick(base: unknown, ours: unknown, theirs: unknown) {
  if (sameValue(theirs, base)) return ours;
  if (sameValue(ours, base)) return theirs;
  return ours;
}

function mergeKeys(base: Json, ours: Json, theirs: Json, merge: (base: unknown, ours: unknown, theirs: unknown) => unknown) {
  const result: Json = {};
  for (const key of new Set([...Object.keys(ours), ...Object.keys(theirs), ...Object.keys(base)])) {
    const value = merge(base[key], ours[key], theirs[key]);
    if (value !== undefined) result[key] = value;
  }
  return result;
}

/** 单项（一件物体、一台机位、一条轨道）：逐个字段取舍，字段内部不再拆开（位置的 x、z 不会一半用户一半 Agent）。 */
function mergeItem(base: unknown, ours: unknown, theirs: unknown) {
  if (sameValue(theirs, base)) return ours;
  if (sameValue(ours, base)) return theirs;
  return isPlain(base) && isPlain(ours) && isPlain(theirs) ? mergeKeys(base, ours, theirs, pick) : ours;
}

function mergeById(base: (Json & { id: string })[], ours: (Json & { id: string })[], theirs: (Json & { id: string })[]) {
  const before = new Map(base.map(item => [item.id, item]));
  const mine = new Set(ours.map(item => item.id));
  const agent = new Map(theirs.map(item => [item.id, item]));
  const result: unknown[] = [];
  for (const item of ours) {
    const original = before.get(item.id);
    if (!original) { result.push(item); continue; }
    const proposed = agent.get(item.id);
    if (!proposed) {
      // Agent 删了：用户没碰过就删，用户改过就留下。
      if (!sameValue(item, original)) result.push(item);
      continue;
    }
    result.push(mergeItem(original, item, proposed));
  }
  // Agent 新加的接在后面；用户已经删掉的（在底稿里有、用户这边没有）不带回来。
  for (const item of theirs) if (!before.has(item.id) && !mine.has(item.id)) result.push(item);
  return result;
}

function mergeNested(base: unknown, ours: unknown, theirs: unknown): unknown {
  if (sameValue(theirs, base)) return ours;
  if (sameValue(ours, base) || sameValue(ours, theirs)) return theirs;
  if (isIdList(base) && isIdList(ours) && isIdList(theirs)) return mergeById(base, ours, theirs);
  if (isPlain(base) && isPlain(ours) && isPlain(theirs)) return mergeKeys(base, ours, theirs, mergeNested);
  return ours;
}

/** 底稿里有、合并后没了的物体：把还指着它们的分组成员、演绎轨道和事件目标清掉，否则整份文档校验不过。 */
function dropDanglingReferences(document: SceneDocument, base: SceneDocument): SceneDocument {
  const ids = new Set(document.objects.map(object => object.id));
  const removed = new Set(base.objects.map(object => object.id).filter(id => !ids.has(id)));
  const grouped = new Set<string>();
  const objectGroups = document.objectGroups?.map(group => {
    // 同一件物体只能在一个组里：两边各自打组撞了，先到的组留着它。
    const objectIds = group.objectIds.filter(id => ids.has(id) && !grouped.has(id));
    for (const id of objectIds) grouped.add(id);
    return objectIds.length === group.objectIds.length ? group : { ...group, objectIds };
  });
  const life = document.life;
  if (!removed.size || !life?.tracks?.length) return { ...document, objectGroups };
  const kept = life.tracks.filter(track => !removed.has(track.objectId));
  const trackIds = new Set(kept.map(track => track.id));
  const tracks = kept.map(track => {
    const events = track.events?.map(event => event.target && removed.has(event.target) ? { ...event, target: undefined } : event);
    const clips = track.clips
      ?.filter(clip => !(clip.kind === "attach" && removed.has(clip.targetId)))
      .map(clip => {
        let next = clip;
        if (next.kind === "pose" && next.target && removed.has(next.target)) next = { ...next, target: undefined };
        if (next.trigger && !trackIds.has(next.trigger.trackId)) next = { ...next, trigger: undefined };
        return next;
      });
    return { ...track, ...(events ? { events } : {}), ...(clips ? { clips } : {}) };
  });
  return { ...document, objectGroups, life: { ...life, tracks } };
}

/**
 * base：Agent 开始时拿到的场景；ours：用户现在的场景；theirs：Agent 交付（或预览）的场景。
 * 用户没改过时直接返回 theirs。
 */
export function mergeSceneEdits(base: SceneDocument, ours: SceneDocument, theirs: SceneDocument): SceneDocument {
  if (sameValue(ours, base)) return theirs;
  const merged = mergeNested(base, ours, theirs) as SceneDocument;
  const cameras = merged.cameras && merged.cameras.length > 24 ? merged.cameras.slice(0, 24) : merged.cameras;
  return dropDanglingReferences(cameras === merged.cameras ? merged : { ...merged, cameras }, base);
}

/** Agent 草稿相对底稿动过（改、删）的物体：这些物体在预览期间以 Agent 为准，视口回写的落地位置不记到用户名下。 */
export function agentTouchedObjectIds(base: SceneDocument, theirs: SceneDocument) {
  const proposed = new Map(theirs.objects.map(object => [object.id, object]));
  return new Set(base.objects.filter(object => !sameValue(object, proposed.get(object.id))).map(object => object.id));
}
