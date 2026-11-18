import { Box3, Group, Raycaster, Vector3 } from "three";
import type { Object3D } from "three";
import { insideSolid } from "./solidProbe";
import { resolveAssetModel } from "./assetModelResolver";
import { createModelGroup } from "./modelGeometry";
import { measureCollisionBounds } from "./sceneCollision";
import { disposeObject } from "./sceneResources";
import { applySceneObjectPlacement, createAssetModelContent, createPrimitive } from "./sceneViewport";
import type { SceneDocument, SceneObject } from "./sceneDocument";
import { measureAssetFootprint, rectFor, rectsOverlap } from "./setDressing";

/*
 * ACT: 射线找座面（导演工具 stageAct 的“坐下”用）：整块三壁内景里的椅子、沙发、床、长凳是布景模型的一部分，按物体名找不到；
 * 这里按和预演同一套装配（resolveAssetModel → createAssetModelContent → applySceneObjectPlacement）在内存里搭出真实几何，
 * 从上往下打射线量出每一格的顶面高度：座面高（离地0.38–0.62米、朝上的平面）连成片的是座位，长凳、沙发、床按0.55米一个位子切；
 * 座位哪一边紧挨着更高的面（靠背、墙）就背对那一边坐。同一张高度表也给直接控制的走位绕开布景里的家具。只读数据，不改场景。
 */

type P = { x: number; z: number };
export type RaySeat = { root: P; face: P; seatY: number; floorY: number; span: number; depth: number; back: boolean; bed: boolean };
/** 视口里真实载入的几何（含导入的GLB）：有它就优先用（界面里），没有就按素材定义在内存里搭（无界面测试）。 */
export type StageGeometry = {
  surface: (x: number, z: number, fromY: number) => { top: number; floor: number; up: boolean } | undefined;
  /** 这一点（腰高）是不是在墙、柱子这类实心体里面：高过2.25米的墙，向下的射线从墙里面打出去看不见它。 */
  inside?: (x: number, y: number, z: number) => boolean;
  sight: (aim: { x: number; y: number; z: number }, camera: { x: number; y: number; z: number }) => boolean;
  bounds: (id: string) => { min: { x: number; y: number; z: number }; max: { x: number; y: number; z: number } } | undefined;
};
/** 占地：保存过的场景里程序化模型会渲染成GLB并带上文件路径，但定义还在，照样按定义量（和渲染出来的GLB一致）。 */
export function footprintOf(asset: SceneObject["asset"]) {
  return measureAssetFootprint(asset.path && (asset.model || asset.recipe || asset.blueprint) ? { ...asset, path: undefined } : asset);
}
const definitionOf = (asset: SceneObject["asset"]) => asset.model || asset.recipe || asset.blueprint ? resolveAssetModel(asset.path ? { ...asset, path: undefined } : asset) : undefined;
export type SurfaceProbe = { sample: (x: number, z: number) => { top: number; floor: number; up: boolean } | undefined; inside?: (x: number, y: number, z: number) => boolean; dispose: () => void };


const built = new Map<string, Group>();
function keyOf(object: SceneObject) { return JSON.stringify([object.id, object.asset.id, object.position, object.rotation, object.scale, object.height, object.gravityEnabled]); }
function buildGroup(document: SceneDocument, object: SceneObject): Group | undefined {
  const key = keyOf(object);
  const cached = built.get(key);
  if (cached) { built.delete(key); built.set(key, cached); return cached; }
  let content: Group | undefined;
  if (object.asset.kind === "primitive") content = /person/i.test(object.asset.shape ?? "") ? undefined : createPrimitive(object.asset, object.color);
  else {
    const definition = definitionOf(object.asset);
    if (definition) { const model = createModelGroup(definition, undefined, true); content = createAssetModelContent(object.asset, model, measureCollisionBounds(model, new Box3())); }
  }
  if (!content) return undefined;
  const group = new Group();
  group.add(content);
  applySceneObjectPlacement(group, object, document.terrain);
  group.updateMatrixWorld(true);
  built.set(key, group);
  // 只留最近用过的几十件，免得长时间对话里占着几何。
  while (built.size > 48) { const oldest = built.keys().next().value!; disposeObject(built.get(oldest)!); built.delete(oldest); }
  return group;
}

/**
 * 给一块区域（中心±half米）建高度探针：只考虑占地落在区域里的非人物体，而且按需装配——某根射线脚下有这件东西的占地才装它的几何
 * （街道这种几十栋楼的场景，只装视线、座位附近那几件）。GLB文件素材没有内存几何，跳过（仍按占地矩形避让）。
 */
export function createSurfaceProbe(document: SceneDocument, center: P, half: number, only?: (object: SceneObject) => boolean): SurfaceProbe {
  const area = { x: center.x, z: center.z, hw: half, hd: half, angle: 0 };
  const candidates: { object: SceneObject; rect: ReturnType<typeof rectFor>; group?: Group | null }[] = [];
  for (const object of document.objects) {
    if (!object.visible || /person/i.test(object.asset.shape ?? "") || object.asset.path && !definitionOf(object.asset) || only && !only(object)) continue;
    const print = footprintOf(object.asset);
    if (!print) continue;
    const rect = rectFor(print, object.position.x, object.position.z, object.rotation.y, object.scale.x, object.scale.z);
    if (rectsOverlap(area, rect)) candidates.push({ object, rect: { ...rect, hw: rect.hw + 0.05, hd: rect.hd + 0.05 } });
  }
  const ray = new Raycaster();
  const origin = new Vector3(), down = new Vector3(0, -1, 0), normal = new Vector3();
  const base = Math.min(...document.objects.filter(object => object.visible).map(object => object.position.y), 0);
  const groups: Object3D[] = [];
  const collect = (x: number, z: number) => {
    const point = { x, z, hw: 0.01, hd: 0.01, angle: 0 };
    groups.length = 0;
    for (const candidate of candidates) {
      if (!rectsOverlap(candidate.rect, point)) continue;
      if (candidate.group === undefined) candidate.group = buildGroup(document, candidate.object) ?? null;
      if (candidate.group) groups.push(candidate.group);
    }
    return groups;
  };
  return {
    inside(x, y, z) { return insideSolid(collect(x, z), x, y, z); },
    sample(x, z) {
      collect(x, z);
      if (!groups.length) return undefined;
      // 从2.25米往下打：电梯轿厢、走廊这类带天花板的布景，天花板不当成顶面（衣柜、书架都低于这个高度）。
      origin.set(x, base + 2.25, z);
      ray.set(origin, down); ray.far = 3.2;
      const hits = ray.intersectObjects(groups, true).filter(hit => hit.object.visible);
      if (!hits.length) return undefined;
      const top = hits[0]!, floor = hits[hits.length - 1]!;
      const up = !top.face || normal.copy(top.face.normal).transformDirection(top.object.matrixWorld).y > 0.8;
      return { top: top.point.y, floor: floor.point.y, up };
    },
    dispose() { groups.length = 0; candidates.length = 0; },
  };
}

/**
 * 座面：离地0.38–0.68米（床面常到0.65）。在 center 周围 radius 米内找座位：返回按离 near 远近排好的空位（离已有的人至少0.42米）。
 * prefer：没有靠背时面朝的方向参考点（一般是要对着说话的人或桌子）。
 */
export function findRaySeats(probe: SurfaceProbe, center: P, radius: number, occupied: readonly P[], near: P, prefer?: P): RaySeat[] {
  const step = 0.15, count = Math.ceil(radius / step);
  const cells = new Map<string, { i: number; j: number; x: number; z: number; top: number; floor: number }>();
  const heights = new Map<string, number>();
  for (let i = -count; i <= count; i++) for (let j = -count; j <= count; j++) {
    const x = center.x + i * step, z = center.z + j * step;
    if (Math.hypot(x - center.x, z - center.z) > radius) continue;
    const sample = probe.sample(x, z);
    if (!sample) continue;
    const height = sample.top - sample.floor;
    heights.set(`${i},${j}`, height);
    if (sample.up && height >= 0.38 && height <= 0.68) cells.set(`${i},${j}`, { i, j, x, z, top: sample.top, floor: sample.floor });
  }
  // 连成片：一把椅子、一条长凳、一张沙发或床是一片。
  const seen = new Set<string>();
  const spots: RaySeat[] = [];
  for (const [key, cell] of cells) {
    if (seen.has(key)) continue;
    const cluster = [cell];
    seen.add(key);
    for (let index = 0; index < cluster.length; index++) for (let di = -1; di <= 1; di++) for (let dj = -1; dj <= 1; dj++) {
      const next = `${cluster[index]!.i + di},${cluster[index]!.j + dj}`;
      const other = cells.get(next);
      if (other && !seen.has(next) && Math.abs(other.top - cluster[index]!.top) < 0.08) { seen.add(next); cluster.push(other); }
    }
    if (cluster.length < 4) continue;
    // 主轴：沿x还是z更长。
    const xs = cluster.map(item => item.x), zs = cluster.map(item => item.z);
    const spanX = Math.max(...xs) - Math.min(...xs), spanZ = Math.max(...zs) - Math.min(...zs);
    if (Math.max(spanX, spanZ) < 0.25 || Math.min(spanX, spanZ) < 0.15) continue;
    const alongX = spanX >= spanZ;
    const length = alongX ? spanX : spanZ;
    const places = Math.max(1, Math.floor((length + 0.1) / 0.55));
    const top = cluster.reduce((sum, item) => sum + item.top, 0) / cluster.length;
    const floor = Math.min(...cluster.map(item => item.floor));
    const middle = { x: xs.reduce((a, b) => a + b, 0) / xs.length, z: zs.reduce((a, b) => a + b, 0) / zs.length };
    for (let index = 0; index < places; index++) {
      const offset = (index - (places - 1) / 2) * (length / places);
      const spot = alongX ? { x: middle.x + offset, z: middle.z } : { x: middle.x, z: middle.z + offset };
      // 靠背：座位某一侧0.3–0.6米内的格子比座面高出0.25米以上（椅背、沙发背、墙）。
      const height = top - floor;
      let back: P | undefined;
      for (const dir of alongX ? [{ x: 0, z: 1 }, { x: 0, z: -1 }] : [{ x: 1, z: 0 }, { x: -1, z: 0 }]) {
        for (const distance of [0.3, 0.45, 0.6]) {
          const i = Math.round((spot.x + dir.x * distance - center.x) / step), j = Math.round((spot.z + dir.z * distance - center.z) / step);
          const value = heights.get(`${i},${j}`);
          if (value !== undefined && value > height + 0.25) { back = dir; break; }
        }
        if (back) break;
      }
      const across = alongX ? { x: 0, z: 1 } : { x: 1, z: 0 };
      const toward = prefer ? Math.sign((prefer.x - spot.x) * across.x + (prefer.z - spot.z) * across.z) || 1 : 1;
      const face = back ? { x: -back.x, z: -back.z } : { x: across.x * toward, z: across.z * toward };
      // 没靠背、面又宽的是茶几、矮柜面（不是凳子、长凳），不坐；床是又长又宽的一大片。
      const depth = alongX ? spanZ : spanX, bed = length >= 1.6 && depth >= 0.9;
      if (!back && depth >= 0.55 && !bed) continue;
      const root = { x: Math.round((spot.x + face.x * 0.03) * 100) / 100, z: Math.round((spot.z + face.z * 0.03) * 100) / 100 };
      if (occupied.some(other => Math.hypot(other.x - root.x, other.z - root.z) < 0.42)) continue;
      spots.push({ root, face, seatY: Math.round(top * 1000) / 1000, floorY: Math.round(floor * 1000) / 1000, span: Math.round(length * 100) / 100, depth: Math.round(depth * 100) / 100, back: !!back, bed });
    }
  }
  // 有靠背的（椅子、沙发）优先：茶几、矮柜面也在座面高度，没靠背的只在近处没别的可选时才坐。
  const score = (seat: RaySeat) => Math.hypot(seat.root.x - near.x, seat.root.z - near.z) + (seat.back ? 0 : 2);
  return spots.sort((a, b) => score(a) - score(b));
}

/** 高度表里“挡路”的格：顶面比地面高0.3米以上（家具、墙）。给直接控制的走位绕开整块布景里的东西。 */
export function probeBlocked(probe: SurfaceProbe, x: number, z: number) {
  const sample = probe.sample(x, z);
  // 站在墙、柱子里面（墙高过射线起点，向下打看不见它）也算挡住。
  return !!sample && (sample.top - sample.floor > 0.3 || sample.up && !!probe.inside?.(x, sample.top + 1, z));
}

/**
 * 视线检查（和界面 sightBlocked 一样打三维射线）：从注视点到机位之间有没有布景、墙、家具挡着；
 * 只装配占地压在这条线附近的物体，人不算（过肩镜头的前景肩膀本来就要入画）。
 */
export function createSightProbe(document: SceneDocument) {
  const candidates = document.objects.flatMap(object => {
    if (!object.visible || /person/i.test(object.asset.shape ?? "") || object.asset.path && !definitionOf(object.asset)) return [];
    const print = footprintOf(object.asset);
    return print ? [{ object, rect: rectFor(print, object.position.x, object.position.z, object.rotation.y, object.scale.x, object.scale.z), group: undefined as Group | null | undefined }] : [];
  });
  const ray = new Raycaster();
  const from = new Vector3(), direction = new Vector3();
  return (aim: { x: number; y: number; z: number }, camera: { x: number; y: number; z: number }) => {
    direction.set(camera.x - aim.x, camera.y - aim.y, camera.z - aim.z);
    const length = direction.length();
    if (length < 0.05) return false;
    direction.normalize();
    const middle = { x: (aim.x + camera.x) / 2, z: (aim.z + camera.z) / 2, hw: Math.abs(camera.x - aim.x) / 2 + 0.1, hd: Math.abs(camera.z - aim.z) / 2 + 0.1, angle: 0 };
    const groups: Object3D[] = [];
    for (const candidate of candidates) {
      if (!rectsOverlap(candidate.rect, middle)) continue;
      if (candidate.group === undefined) candidate.group = buildGroup(document, candidate.object) ?? null;
      if (candidate.group) groups.push(candidate.group);
    }
    if (!groups.length) return false;
    // 注视点在人头上，起点让开0.35米（人的身体不在探针里，但贴着的桌面、椅背不算挡脸）。
    ray.set(from.set(aim.x, aim.y, aim.z), direction); ray.near = 0.35; ray.far = length;
    return ray.intersectObjects(groups, true).some(hit => hit.object.visible);
  };
}

/** 有视口几何时用它（包含导入的GLB），否则在内存里按定义搭。 */
export function surfaceProbeFor(document: SceneDocument, center: P, half: number, geometry?: StageGeometry, only?: (object: SceneObject) => boolean): SurfaceProbe {
  if (!geometry || only) return createSurfaceProbe(document, center, half, only);
  const base = Math.min(...document.objects.filter(object => object.visible).map(object => object.position.y), 0);
  return { sample: (x, z) => geometry.surface(x, z, base + 2.25), ...(geometry.inside ? { inside: geometry.inside } : {}), dispose() {} };
}
export function sightProbeFor(document: SceneDocument, geometry?: StageGeometry) { return geometry ? geometry.sight : createSightProbe(document); }
