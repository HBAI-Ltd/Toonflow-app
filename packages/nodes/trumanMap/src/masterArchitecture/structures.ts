import { part, beam, ring, pitchedRoof, type ModelPart, type Triple } from "../assetModelParts";
import type { AssetItemType, AssetState, AssetTheme } from "../sceneDocument";

export type ArchitecturePrototype = {
  name: string; purpose: string; itemType: AssetItemType; theme?: AssetTheme; build: () => ModelPart[];
  /** 已自带全部细节（破败建筑自己做了残墙、屋架、瓦砾），不再套用通用的屋面和墙面细化 */
  raw?: boolean;
  /** 素材状态标记：破败建筑标为老旧、破损或废弃，缺省为原始 */
  state?: AssetState;
  /** 额外检索标签（破败建筑加“废墟、破屋、影视外景”等，方便搜到） */
  tags?: string[];
};
export const colors = { stone: "#a4a89c", wood: "#9a7955", metal: "#62777b", roof: "#687d7b", water: "#72999e", earth: "#a69673", glass: "#9bb8ba" };
export function design(name: string, purpose: string, build: () => ModelPart[], itemType: AssetItemType = "建筑", theme?: AssetTheme): ArchitecturePrototype { return { name, purpose, itemType, ...(theme ? { theme } : {}), build }; }
export function box(name: string, x: number, y: number, z: number, w: number, h: number, d: number, color = colors.stone): ModelPart { return part(name, "box", color, [x, y, z], [w, h, d]); }
export function cylinder(name: string, x: number, y: number, z: number, diameter: number, height: number, color = colors.metal, rotation: Triple = [0, 0, 0]): ModelPart { return part(name, "cylinder", color, [x, y, z], [diameter, height, diameter], rotation); }
export function cone(name: string, x: number, y: number, z: number, diameter: number, h: number, color = colors.roof): ModelPart { return part(name, "cone", color, [x, y, z], [diameter, h, diameter]); }
export function base(w: number, d: number, h = 0.18): ModelPart { return box("落地基础", 0, h / 2, 0, w, h, d); }
export function roof(x: number, y: number, z: number, w: number, d: number): ModelPart { const value = pitchedRoof("双坡屋面", colors.roof, w, d, y); value.position.x = x; value.position.z = z; return value; }
export function frame(w: number, d: number, h: number): ModelPart[] {
  return [base(w + 0.5, d + 0.5), ...[-1, 1].flatMap(x => [-1, 1].map(z => box("承重立柱", x * w / 2, h / 2 + 0.18, z * d / 2, 0.22, h, 0.22, colors.wood))), box("承重脊梁", 0, h + 0.18, 0, 0.24, 0.22, d, colors.wood), roof(0, h + 0.35, 0, w + 0.8, d + 0.7)];
}
export function hall(w: number, d: number, h: number): ModelPart[] {
  return [...frame(w, d, h), box("后墙", 0, h / 2 + 0.18, d / 2, w, h, 0.18), ...[-1, 1].map(side => box("侧墙", side * w / 2, h / 2 + 0.18, 0, 0.18, h, d))];
}
export function pool(w: number, d: number, h: number, x = 0, z = 0): ModelPart[] {
  return [box("池底", x, 0.12, z, w, 0.24, d), ...[-1, 1].flatMap(s => [box("纵向池壁", x + s * w / 2, h / 2 + 0.24, z, 0.18, h, d), box("横向池壁", x, h / 2 + 0.24, z + s * d / 2, w, h, 0.18)]), box("池内液面", x, h * 0.55 + 0.24, z, w - 0.25, 0.035, d - 0.25, colors.water)];
}
export function openTank(x: number, z: number, diameter: number, height: number, y = 0.18): ModelPart[] {
  const wall = ring("敞口圆罐壁", colors.metal, diameter / 2, 0.11, y + height / 2, height);
  wall.position.x = x; wall.position.z = z;
  return [wall, cylinder("罐底", x, y + 0.05, z, diameter, 0.1), cylinder("罐内液面", x, y + height * 0.45, z, diameter - 0.25, 0.04, colors.water)];
}
export function rail(start: Triple, end: Triple, width = 0.12, color = colors.metal): ModelPart { return beam("结构连接杆", color, start, end, width); }
export function wheel(x: number, y: number, z: number, diameter: number, width = 0.25): ModelPart[] {
  return [part("轮圈", "torus", colors.wood, [x, y, z], [diameter, diameter, width]), cylinder("轮轴", x, y, z, 0.2, width + 0.5, colors.metal, [90, 0, 0]), ...Array.from({ length: 6 }, (_, i) => { const a = i * Math.PI / 3; return rail([x, y, z], [x + Math.cos(a) * diameter * 0.35, y + Math.sin(a) * diameter * 0.35, z], 0.08, colors.wood); })];
}
export function stairs(x: number, z: number, w: number, count: number, rise: number, run: number): ModelPart[] { return Array.from({ length: count }, (_, i) => box("踏步", x, 0.18 + (i + 1) * rise / 2, z + i * run, w, (i + 1) * rise, run)); }
export function arch(x: number, z: number, radius: number, spring: number, depth: number, thickness = 0.3): ModelPart {
  const profile = [{ x: -radius - thickness, y: 0 }, { x: -radius - thickness, y: spring }];
  for (let i = 1; i <= 12; i++) { const a = Math.PI * (1 - i / 12); profile.push({ x: Math.cos(a) * (radius + thickness), y: spring + Math.sin(a) * (radius + thickness) }); }
  profile.push({ x: radius + thickness, y: 0 }, { x: radius, y: 0 }, { x: radius, y: spring });
  for (let i = 1; i <= 12; i++) { const a = Math.PI * i / 12; profile.push({ x: Math.cos(a) * radius, y: spring + Math.sin(a) * radius }); }
  profile.push({ x: -radius, y: 0 });
  return part("承重拱券", "extrude", colors.stone, [x, 0.18, z], [1, 1, 1], [0, 0, 0], { depth, profile });
}
export function slats(name: string, count: number, start: Triple, delta: Triple, size: Triple, color = colors.wood): ModelPart[] { return Array.from({ length: count }, (_, i) => box(name, start[0] + delta[0] * i, start[1] + delta[1] * i, start[2] + delta[2] * i, size[0], size[1], size[2], color)); }

export function pipe(name: string, start: Triple, end: Triple, diameter = 0.2): ModelPart { const value = rail(start, end, diameter); return { ...value, name, shape: "cylinder" }; }
export function gantry(w: number, d: number, h: number): ModelPart[] { return [base(w + 0.8, d + 0.8), ...[-1, 1].flatMap(x => [-1, 1].map(z => box("机架支柱", x * w / 2, h / 2 + 0.2, z * d / 2, 0.18, h, 0.18))), box("顶部安装梁", 0, h + 0.2, 0, w, 0.2, d)]; }
export function coil(x: number, y: number, z: number, radius: number, height: number, turns = 3): ModelPart { return part("连续螺旋管", "tube", colors.metal, [x, y, z], [1, 1, 1], [0, 0, 0], { radius: 0.055, path: Array.from({ length: turns * 8 + 1 }, (_, i) => ({ x: Math.cos(i * Math.PI / 4) * radius, y: i / (turns * 8) * height, z: Math.sin(i * Math.PI / 4) * radius })) }); }
export function fan(x: number, y: number, z: number, diameter: number): ModelPart[] { return [cylinder("风机轴毂", x, y, z, diameter * 0.2, 0.5), ...Array.from({ length: 5 }, (_, i) => { const a = i * Math.PI * 2 / 5; return part("径向风叶", "box", colors.metal, [x + Math.cos(a) * diameter * 0.25, y, z + Math.sin(a) * diameter * 0.25], [diameter * 0.5, 0.08, diameter * 0.15], [0, -i * 72, 12]); })]; }

export function glow(name: string, x: number, y: number, z: number, w: number, h: number, d: number, color = "#a7d2d1"): ModelPart { return part(name, "box", color, [x,y,z], [w,h,d], [0,0,0], { emissive: color, emissiveIntensity: 0.65, roughness: 0.3 }); }
