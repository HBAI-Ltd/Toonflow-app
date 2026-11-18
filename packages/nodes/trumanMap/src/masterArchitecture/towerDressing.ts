import type { ModelPart } from "../assetModelParts";
import { shade } from "./chineseRoofKit";
import { worldBox } from "./chineseWallDressing";
import { FacadeBuilder } from "./facadeKit";
import { DEG, yawOf } from "./partMath";

// 圆塔、圆筒体的立面细化：砌层环线、檐口、层间窗洞（箭窗或小方窗，带窗框和窗台）、底部勒脚。
// 只处理直立、正圆、名称像塔身或筒体的圆柱，窗朝外围着塔身均布。
const TOWER_NAME = /塔|筒|仓|罐|楼|核心|舱|室|屋|身|堡|台/, NOT_TOWER = /柱|烟囱|管|杆|桅|灯|台座|平台|基|池|环|轮|盘|鼓|钟|锅/;

type Round = { cx: number; cz: number; r: number; y0: number; y1: number; color: string };

export function roundTowers(parts: ModelPart[]): Round[] {
  const result: Round[] = [];
  for (const value of parts) {
    if (value.shape !== "cylinder" || !TOWER_NAME.test(value.name) || NOT_TOWER.test(value.name) || yawOf(value) === undefined) continue;
    const d = value.scale.x;
    if (d < 1.4 || value.scale.y < 2.4 || Math.abs(d - value.scale.z) > d * .05 || value.scale.y < d * .9) continue;
    const box = worldBox(value);
    if (!box) continue;
    result.push({ cx: value.position.x, cz: value.position.z, r: d / 2, y0: box.min.y, y1: box.max.y, color: value.color });
  }
  return result;
}

export function dressRoundTowers(parts: ModelPart[], theme: string | undefined, room: number, glass: { pane: string; frame: string }): ModelPart[] {
  const towers = roundTowers(parts);
  if (!towers.length || room < 3) return [];
  const b = new FacadeBuilder();
  b.group("course", "塔身砌层环线", "#8d887a", { roughness: .95 })
    .group("cornice", "塔顶檐口", "#a29d8e", { roughness: .9 })
    .group("tFrame", "塔窗框", glass.frame, { roughness: .6 })
    .group("tPane", "塔窗暗面", glass.pane, { roughness: .25 });
  const slit = theme === "欧式" || theme === "奇幻" || theme === "中式" || theme === "异域" || theme === "废土";
  for (const tower of towers.slice(0, 3)) {
    const H = tower.y1 - tower.y0, { cx, cz, r } = tower;
    const storeys = Math.max(1, Math.round(H / (slit ? 2.6 : 3)));
    const ring = (y: number, radius: number, tube: number, key: string) => {
      const path: [number, number, number][] = [];
      for (let k = 0; k <= 16; k++) { const a = Math.PI * 2 * k / 16; path.push([cx + radius * Math.cos(a), y, cz + radius * Math.sin(a)]); }
      b.sweep(key, path, path.map(() => tube));
    };
    // 勒脚与砌层环线
    ring(tower.y0 + .12, r + .04, .09, "course");
    for (let k = 1; k <= Math.floor(H / 1.1); k++) ring(tower.y0 + k * 1.1, r + .015, .025, "course");
    // 檐口：顶沿上下两圈
    ring(tower.y1 - .1, r + .1, .1, "cornice"); ring(tower.y1 - .32, r + .04, .06, "cornice");
    // 窗：每层均布，层层错开半个间距
    const count = Math.max(3, Math.min(6, Math.round(r * 2.2)));
    for (let k = 0; k < storeys; k++) {
      const y = tower.y0 + (k + .55) * (H / storeys), w = slit ? .3 : .7, h = slit ? 1.0 : .9;
      if (y + h / 2 > tower.y1 - .5 || y - h / 2 < tower.y0 + .5) continue;
      for (let i = 0; i < count; i++) {
        const angle = (i + (k % 2) * .5) / count * Math.PI * 2, dirDeg = angle / DEG;
        const at = (n: number): [number, number] => [cx + (r + n) * Math.sin(angle), cz + (r + n) * Math.cos(angle)];
        const [px, pz] = at(.02), [fx, fz] = at(.045), ft = .06;
        b.rect("tPane", px, y, pz, w, h, dirDeg);
        // 窗框：左右、上下四条，沿切向偏移
        const tx = Math.cos(angle), tz = -Math.sin(angle);
        b.rect("tFrame", fx - tx * (w / 2 + ft / 2), y, fz - tz * (w / 2 + ft / 2), ft, h, dirDeg); b.rect("tFrame", fx + tx * (w / 2 + ft / 2), y, fz + tz * (w / 2 + ft / 2), ft, h, dirDeg);
        b.rect("tFrame", fx, y + h / 2 + ft / 2, fz, w + ft * 2, ft, dirDeg); b.rect("tFrame", fx, y - h / 2 - ft / 2, fz, w + ft * 2, ft, dirDeg);
        if (!slit) b.rect("tFrame", fx, y, fz, .05, h, dirDeg);
      }
    }
  }
  const made = b.parts();
  const tint = shade(towers[0]!.color, .8);
  for (const value of made) if (value.name === "塔身砌层环线") value.color = tint;
  return made.slice(0, room);
}
