import type { ModelPart } from "../assetModelParts";
import { addInterior, type Slab } from "./buildingInterior";
import { shade } from "./chineseRoofKit";
import type { Opening, FacadeStyle } from "./facadeKit";
import type { Cover } from "./interiorGrid";
import { triangles } from "./partMath";
import { ShapeBuilder } from "./shapeKit";
import { buildShell, shellGroups } from "./shellKit";
import type { Body } from "./legacyBuildings";

// 把实心体量改成空壳并布置室内：按计划造墙板、楼板和天花，拆掉被门洞取代的门扇，让已有玻璃变半透明，
// 再用室内模块摆家具和灯。旧库建筑和程序化建筑族共用。
export type HollowPlan = { body: Body; storeys: number; openings: Opening[]; removeParts: ModelPart[]; glassParts: ModelPart[]; style: FacadeStyle };
export type ShellInfo = { slabs: Slab[]; covers: Cover[] };

const lum = (hex: string) => { const v = parseInt(hex.slice(1), 16); return (((v >> 16) & 255) * 299 + ((v >> 8) & 255) * 587 + (v & 255) * 114) / 1000; };

/** 室内地面色：冷色主题和工业形制铺灰色砖石（室内模块铺方砖缝），其余铺木地板（铺板缝）。 */
function floorColorOf(theme: string | undefined) {
  return theme === "现代" || theme === "科幻" || theme === "赛博朋克" || theme === "废土" || theme === "蒸汽朋克" ? "#a9a69b" : "#9c7650";
}

/** 按计划把体量改成空壳；预算不够时什么都不改并返回 undefined。 */
export function applyHollows(parts: ModelPart[], plans: HollowPlan[], theme: string | undefined, maxParts: number, thick = .22): ShellInfo | undefined {
  if (!plans.length) return undefined;
  const b = new ShapeBuilder(), slabs: Slab[] = [], covers: Cover[] = [];
  const floorColor = floorColorOf(theme), keySets = new Map<string, ReturnType<typeof shellGroups>>();
  for (const plan of plans) {
    const wall = plan.body.part.color, dark = lum(wall) < 120;
    // 墙色相同的体量共用同一套分组，免得每个体量各占一批部件
    const style = { outer: wall, inner: dark ? "#b9b5aa" : shade(wall, 1.1), floor: floorColor, ceiling: dark ? "#cfd3d6" : "#e6e0d0", floorColor };
    const signature = `${style.outer}|${style.inner}|${style.ceiling}`;
    let keys = keySets.get(signature);
    if (!keys) { keys = shellGroups(b, `h${keySets.size}`, style); keySets.set(signature, keys); }
    const shell = buildShell(b, plan.body.vol, plan.openings, plan.storeys, thick, keys, floorColor);
    slabs.push(...shell.slabs); covers.push(...shell.covers);
  }
  const made = b.parts();
  const removed = new Set<ModelPart>();
  for (const plan of plans) { removed.add(plan.body.part); for (const value of plan.removeParts) removed.add(value); }
  const next = parts.length - removed.size + made.length;
  const triangleBudget = 48000 - parts.reduce((sum, value) => sum + triangles(value), 0) + [...removed].reduce((sum, value) => sum + triangles(value), 0);
  if (next > maxParts - 2 || made.reduce((sum, value) => sum + triangles(value), 0) > triangleBudget - 3000) return undefined;
  for (let i = parts.length - 1; i >= 0; i--) if (removed.has(parts[i]!)) parts.splice(i, 1);
  // 洞口里的已有玻璃改成半透明，从外面能看见室内
  for (const plan of plans) for (const glass of plan.glassParts) { glass.opacity = .42; glass.roughness = .2; }
  parts.push(...made);
  return { slabs, covers };
}

/** 在空壳里摆家具、挂灯、铺地面纹理；部件数或三角形预算不够就不摆。 */
export function furnishHollows(parts: ModelPart[], theme: string | undefined, name: string, maxParts: number, shell: ShellInfo) {
  if (parts.some(value => value.name === "室内家具")) return;
  const room = maxParts - parts.length - 1, budget = 48000 - parts.reduce((sum, value) => sum + triangles(value), 0);
  if (room < 5 || budget < 9000) return;
  const added = addInterior(parts, { theme, name, frames: [], room, slabs: shell.slabs, covers: shell.covers });
  let used = 0;
  for (const value of added) { used += triangles(value); if (used > budget - 1500 || parts.length >= maxParts) break; parts.push(value); }
}
