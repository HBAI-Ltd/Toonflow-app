import { Box3 } from "three";
import type { ModelPart } from "../assetModelParts";
import { worldBox } from "./chineseWallDressing";

// 建筑自带的“地皮”收边：很多建筑（主目录约 1000 个“落地基础”、程序化建筑的“地面基础台”）在脚下带一块或两块（基础加一层楼面板）
// 很薄的大平板，比建筑主体大出几米到二十几米，摆进街道会盖住路面和旁边的物件，包围盒也被撑大、影响排布。
// 这里把这类平板裁到“建筑主体范围外扩一圈”：模板生成的通用基础只留 0.6m 边，描述性的整院地坪、场坪留 2m 边；
// 坡道、道床、路体、水体这类本身就是地面功能的平板不动。只处理轴对齐的方盒平板；躺在被裁掉部分上的低矮小件随之降到地面。
const KEEP = /坡|步行|步道|道床|轨道板|路体|街面|街口|道口|水体|水界|池|槽底|浅底|泊湾|护脚|护基|堤|岸|桥/;
const GENERIC = /^(落地基础|地面基础台)$/;
/** 平板：薄（≤0.5m）、顶面低于 0.6m、面积 ≥ 10m²（可叠两层：基础加楼面板）。 */
const SLAB_HEIGHT = .5, SLAB_TOP = .6, SLAB_AREA = 10;

type Rect = { x0: number; x1: number; z0: number; z1: number };

const rectOf = (box: Box3): Rect => ({ x0: box.min.x, x1: box.max.x, z0: box.min.z, z1: box.max.z });
const grow = (rect: Rect, by: number): Rect => ({ x0: rect.x0 - by, x1: rect.x1 + by, z0: rect.z0 - by, z1: rect.z1 + by });
const touches = (a: Rect, b: Rect) => a.x0 <= b.x1 && a.x1 >= b.x0 && a.z0 <= b.z1 && a.z1 >= b.z0;
const holds = (rect: Rect, x: number, z: number) => x >= rect.x0 - 1e-6 && x <= rect.x1 + 1e-6 && z >= rect.z0 - 1e-6 && z <= rect.z1 + 1e-6;

/** 水平轴对齐（绕竖轴转 0/90/180/270 度）的方盒；返回长宽是否互换。 */
function alignment(part: ModelPart): { swap: boolean } | undefined {
  if (part.shape !== "box" || Math.abs(part.rotation.x % 180) > .5 || Math.abs(part.rotation.z % 180) > .5) return undefined;
  const yaw = ((part.rotation.y % 180) + 180) % 180;
  if (yaw < .5 || yaw > 179.5) return { swap: false };
  if (Math.abs(yaw - 90) < .5) return { swap: true };
  return undefined;
}

/** 把超出建筑主体的地皮平板裁掉；返回被裁或被删的平板数。直接修改 parts。 */
export function trimGroundSlabs(parts: ModelPart[]): number {
  const boxes = parts.map(part => worldBox(part));
  const slabs: number[] = [], body = new Box3();
  parts.forEach((part, index) => {
    const box = boxes[index];
    if (!box) return;
    const height = box.max.y - box.min.y, area = (box.max.x - box.min.x) * (box.max.z - box.min.z);
    if (height <= SLAB_HEIGHT && box.max.y <= SLAB_TOP && area >= SLAB_AREA && alignment(part) && !KEEP.test(part.name)) slabs.push(index);
    else if (box.max.y > SLAB_TOP) body.union(box);
  });
  if (!slabs.length || body.isEmpty()) return 0;
  // 主体范围：先取高过 0.6m 的部件，再把紧挨着它的低矮小件（台阶、踏道，面积不到 10m²）并进来，免得它们悬在被裁掉的平板外
  let core = rectOf(body);
  const slabSet = new Set(slabs), reach = grow(core, 2.5);
  parts.forEach((_, index) => {
    const box = boxes[index];
    if (!box || slabSet.has(index) || box.max.y > SLAB_TOP) return;
    const rect = rectOf(box);
    if ((rect.x1 - rect.x0) * (rect.z1 - rect.z0) >= SLAB_AREA || !touches(rect, reach)) return;
    core = { x0: Math.min(core.x0, rect.x0), x1: Math.max(core.x1, rect.x1), z0: Math.min(core.z0, rect.z0), z1: Math.max(core.z1, rect.z1) };
  });
  const bodyArea = (core.x1 - core.x0) * (core.z1 - core.z0);
  // 一个建筑只用一种边距，免得“基础加楼面板”两层错开：有通用基础就统一留 0.6m，否则（整院地坪一类）留 2m
  const generic = slabs.some(index => GENERIC.test(parts[index]!.name)), limit = grow(core, generic ? .6 : 2);
  // 裁剪：original 是裁前范围，final 是裁后范围（undefined 为整块删掉）
  const original = new Map<number, Rect>(), final = new Map<number, Rect | undefined>();
  let changed = 0;
  for (const index of slabs) {
    const part = parts[index]!, box = boxes[index]!, rect = rectOf(box);
    original.set(index, rect); final.set(index, rect);
    const slabArea = (rect.x1 - rect.x0) * (rect.z1 - rect.z0);
    // 描述性的整院地坪，主体只占一小块时（街面、广场之类）当作场地本身，不裁
    if (!generic && bodyArea / slabArea < .12) continue;
    const next: Rect = { x0: Math.max(rect.x0, limit.x0), x1: Math.min(rect.x1, limit.x1), z0: Math.max(rect.z0, limit.z0), z1: Math.min(rect.z1, limit.z1) };
    if (next.x0 <= rect.x0 + 1e-3 && next.x1 >= rect.x1 - 1e-3 && next.z0 <= rect.z0 + 1e-3 && next.z1 >= rect.z1 - 1e-3) continue;
    changed++;
    if (next.x1 - next.x0 < 1 || next.z1 - next.z0 < 1) { final.set(index, undefined); continue; }
    const swap = alignment(part)!.swap, sx = next.x1 - next.x0, sz = next.z1 - next.z0;
    part.position.x = Math.round((next.x0 + next.x1) / 2 * 1000) / 1000; part.position.z = Math.round((next.z0 + next.z1) / 2 * 1000) / 1000;
    part.scale.x = Math.round((swap ? sz : sx) * 1000) / 1000; part.scale.z = Math.round((swap ? sx : sz) * 1000) / 1000;
    final.set(index, next);
  }
  if (!changed) return 0;
  // 原来躺在平板上、现在平板被裁掉的低矮小件（离主体很远的步道石、花池）降到剩下的支撑面或地面，免得悬空
  const support = (x: number, z: number, rects: Map<number, Rect | undefined>, below: number) => {
    let top = 0;
    for (const index of slabs) { const rect = rects.get(index); const t = boxes[index]!.max.y; if (rect && holds(rect, x, z) && t <= below + .03) top = Math.max(top, t); }
    return top;
  };
  parts.forEach((part, index) => {
    const box = boxes[index];
    if (!box || slabSet.has(index)) return;
    const x = (box.min.x + box.max.x) / 2, z = (box.min.z + box.max.z) / 2, before = support(x, z, original, box.min.y), after = support(x, z, final, box.min.y);
    if (before > 0 && Math.abs(box.min.y - before) <= .03 && after < before - 1e-3) part.position.y -= before - after;
  });
  for (let index = parts.length - 1; index >= 0; index--) if (slabSet.has(index) && final.get(index) === undefined && parts.length > 1) parts.splice(index, 1);
  return changed;
}
