import { Vector3 } from "three";
import type { ModelPart } from "../assetModelParts";
import { Builder } from "./chineseArchKit";
import { shade, Soup } from "./chineseRoofKit";
import { worldBox } from "./chineseWallDressing";
import { DEG, yawOf } from "./partMath";

// 非中式建筑的通用细化：按主题取框色与点缀色，给玻璃窗加窗框与窗棂，给平屋顶加檐口线和女儿墙。
export type BuildingStyle = { frame: string; sill: string; wall: "plain" | "classical"; accent?: { color: string; emissive: string; intensity: number }; metal: number };

export function styleOf(theme: string | undefined, seed: number): BuildingStyle {
  switch (theme) {
    case "欧式": return { frame: "#ece6d6", sill: "#cfc7b3", wall: "classical", metal: 0 };
    case "日式": return { frame: "#4a3a2c", sill: "#6b5642", wall: "plain", metal: 0 };
    case "异域": return { frame: "#6a523a", sill: "#8a7253", wall: "plain", metal: 0 };
    case "科幻": return { frame: "#a9b6c2", sill: "#7f8c99", wall: "plain", metal: .5, accent: { color: "#9fe8ff", emissive: "#5ad4ff", intensity: .9 } };
    case "赛博朋克": return seed % 2 ? { frame: "#2d3540", sill: "#1f2630", wall: "plain", metal: .4, accent: { color: "#ff7ac8", emissive: "#ff3ea5", intensity: 1.1 } } : { frame: "#2d3540", sill: "#1f2630", wall: "plain", metal: .4, accent: { color: "#7af2ff", emissive: "#27d8ff", intensity: 1.1 } };
    case "蒸汽朋克": return { frame: "#6a4a2e", sill: "#b08a3a", wall: "plain", metal: .35 };
    case "奇幻": return { frame: "#5d4a3d", sill: "#a39078", wall: "plain", metal: 0 };
    case "废土": return { frame: "#4a4036", sill: "#6b5e4e", wall: "plain", metal: .1 };
    case "现代": return { frame: "#434b52", sill: "#8d949a", wall: "plain", metal: .3 };
    default: return { frame: "#4f575d", sill: "#9aa0a4", wall: "plain", metal: .2 };
  }
}

export const seedOf = (text: string) => { let h = 0; for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0; return Math.abs(h); };

/** 墙面主色：取最大一块墙体（box 或登记过洞口的合并墙）的颜色，供山墙板、线脚取色；找不到时给中性灰白。 */
export function dominantWallColor(parts: ModelPart[]) {
  let best = "#d4d0c4", area = 0;
  for (const value of parts) {
    if (!/墙|壁|立面/.test(value.name)) continue;
    const box = worldBox(value);
    if (!box) continue;
    const size = box.getSize(new Vector3()), along = Math.max(size.x, size.z), thin = Math.min(size.x, size.z), a = along * size.y;
    if (thin <= .8 && a > area) { area = a; best = value.color; }
  }
  return best;
}

type Pane = { cx: number; cy: number; cz: number; width: number; height: number; yaw: number };

function paneOf(value: ModelPart): Pane | undefined {
  if (value.shape !== "box" || !/玻璃|透光窗|采光窗|窗扇/.test(value.name)) return undefined;
  const yaw = yawOf(value);
  if (yaw === undefined) return undefined;
  const { x: sx, y: sy, z: sz } = value.scale, thin = Math.min(sx, sz), width = Math.max(sx, sz);
  if (thin > .15 || width < .35 || sy < .35 || width * sy > 80) return undefined;
  return { cx: value.position.x, cy: value.position.y, cz: value.position.z, width, height: sy, yaw: sx >= sz ? yaw : yaw + 90 };
}

/** 玻璃窗：沿玻璃四周加窗框，按尺寸补竖挺和横档；窗框前后各探出 7cm，内外两侧都看得见。 */
export function windowFrames(parts: ModelPart[], style: BuildingStyle, room: number): { parts: ModelPart[]; count: number } {
  const panes = parts.map(paneOf).filter((pane): pane is Pane => pane !== undefined).sort((p, q) => q.width * q.height - p.width * p.height);
  if (!panes.length || room < 2) return { parts: [], count: 0 };
  const b = new Builder().group("frame", "窗框与窗棂", style.frame, { roughness: .55, metalness: style.metal });
  if (style.accent) b.group("accent", "窗楣光带", style.accent.color, { emissive: style.accent.emissive, emissiveIntensity: style.accent.intensity, roughness: .4 });
  let count = 0;
  for (const pane of panes) {
    if (b.partCount() >= room - 1) break;
    const { width: w, height: h } = pane, c = Math.cos(pane.yaw * DEG), s = Math.sin(pane.yaw * DEG), t = Math.min(.09, Math.max(.05, Math.min(w, h) * .04)), d = .14;
    const put = (key: string, lx: number, ly: number, sx: number, sy: number, sz: number) => b.boxYaw(key, pane.cx + lx * c, pane.cy + ly, pane.cz - lx * s, sx, sy, sz, pane.yaw);
    put("frame", -(w / 2 + t / 2), 0, t, h + 2 * t, d); put("frame", w / 2 + t / 2, 0, t, h + 2 * t, d);
    put("frame", 0, -(h / 2 + t / 2), w, t, d); put(style.accent ? "accent" : "frame", 0, h / 2 + t / 2, w, t, d);
    const nx = Math.max(1, Math.min(6, Math.round(w / 1.5))), ny = Math.max(1, Math.min(5, Math.round(h / 1.6)));
    for (let i = 1; i < nx; i++) put("frame", -w / 2 + w * i / nx, 0, t * .6, h, d * .7);
    for (let j = 1; j < ny; j++) put("frame", 0, -h / 2 + h * j / ny, w, t * .6, d * .7);
    if (nx === 1 && w >= .9) put("frame", 0, 0, t * .6, h, d * .7);
    if (ny === 1 && h >= 1.1) put("frame", 0, h * .17, w, t * .6, d * .7);
    count++;
  }
  return { parts: b.parts().slice(0, room), count };
}

/** 平屋顶：板边加一圈檐口线，板面四周立一道矮女儿墙；赛博朋克、科幻主题的檐口线带光。 */
export function flatRoofEdges(parts: ModelPart[], style: BuildingStyle, room: number): ModelPart[] {
  const roofs = parts.filter(value => value.shape === "box" && /屋盖|屋顶|平屋/.test(value.name) && !/坡|脊|窗|孔|管|烟|晒台|平台|甲板|花园/.test(value.name) && value.scale.y <= .45 && value.scale.x * value.scale.z >= 12 && Math.min(value.scale.x, value.scale.z) >= 2.2 && yawOf(value) !== undefined);
  if (!roofs.length || room < 2) return [];
  const b = new Builder();
  roofs.slice(0, 6).forEach((roof, index) => {
    b.group(`fascia${index}`, "屋顶檐口线", style.accent ? style.accent.color : shade(roof.color, .84), style.accent ? { emissive: style.accent.emissive, emissiveIntensity: style.accent.intensity * .8, roughness: .45 } : { roughness: .85 })
      .group(`lip${index}`, "屋顶女儿墙", shade(roof.color, 1.12), { roughness: .9 });
    const yaw = yawOf(roof)!, sx = roof.scale.x, sy = roof.scale.y, sz = roof.scale.z, cx = roof.position.x, cy = roof.position.y, cz = roof.position.z;
    const c = Math.cos(yaw * DEG), s = Math.sin(yaw * DEG);
    const put = (key: string, lx: number, ly: number, lz: number, w: number, h: number, d: number) => b.boxYaw(key, cx + lx * c + lz * s, cy + ly, cz - lx * s + lz * c, w, h, d, yaw);
    const hx = sx / 2, hz = sz / 2, top = sy / 2;
    for (const side of [-1, 1]) {
      put(`fascia${index}`, 0, -.04, side * (hz + .03), sx + .12, sy + .1, .08);
      put(`fascia${index}`, side * (hx + .03), -.04, 0, .08, sy + .1, sz - .02);
      put(`lip${index}`, 0, top + .13, side * (hz - .08), sx - .02, .26, .14);
      put(`lip${index}`, side * (hx - .08), top + .13, 0, .14, .26, sz - .3);
    }
  });
  return b.parts().slice(0, room);
}

/** 立柱加柱础与柱头：竖直圆柱（名称带“柱”、高 ≥ 2.2m、径 .25–2.5m）下加方础，上加方头；古典式再加一层垫板和托盘。 */
export function columnDressing(parts: ModelPart[], theme: string | undefined, room: number): ModelPart[] {
  const columns = parts.filter(value => value.shape === "cylinder" && /柱/.test(value.name) && !/础|栏|栅|栏柱|旗|灯|烟|管/.test(value.name) && value.scale.y >= 2.2 && value.scale.x >= .25 && value.scale.x <= 2.5 && Math.abs(value.scale.x - value.scale.z) < value.scale.x * .05 && yawOf(value) !== undefined);
  if (!columns.length || room < 2) return [];
  const b = new Builder(), classical = theme === "欧式";
  const colors = new Map<string, string>();
  for (const column of columns) { const key = shade(column.color, 1.1); if (!colors.has(key)) colors.set(key, `c${colors.size}`); }
  for (const [color, key] of colors) b.group(key, "柱础与柱头", color, { roughness: .9 });
  for (const column of columns.slice(0, 80)) {
    if (b.partCount() >= room - 1) break;
    const key = colors.get(shade(column.color, 1.1))!, d = column.scale.x, bottom = column.position.y - column.scale.y / 2, top = column.position.y + column.scale.y / 2, x = column.position.x, z = column.position.z;
    b.box(key, x, bottom + .09, z, d * 1.4, .18, d * 1.4);
    b.box(key, x, top - .11, z, d * 1.5, .22, d * 1.5);
    if (classical) { b.box(key, x, bottom + .22, z, d * 1.2, .08, d * 1.2); b.box(key, x, top + .05, z, d * 1.7, .12, d * 1.7); }
  }
  return b.parts().slice(0, room);
}

/** 锥顶屋面：沿锥面补放射瓦楞、檐口一圈和顶尖宝珠；只处理直立、正圆、名称像屋顶的圆锥。 */
export function coneRoofs(parts: ModelPart[], room: number): ModelPart[] {
  const cones = parts.filter(value => value.shape === "cone" && /顶|锥|屋|帐|塔/.test(value.name) && !/柱|栏|烟/.test(value.name) && value.scale.x >= 2 && value.scale.y >= .6 && Math.abs(value.scale.x - value.scale.z) < value.scale.x * .05 && yawOf(value) !== undefined);
  const result: ModelPart[] = [];
  for (const cone of cones.slice(0, 4)) {
    if (result.length >= room - 1) break;
    const soup = new Soup(), R = cone.scale.x / 2, H = cone.scale.y, cx = cone.position.x, cy = cone.position.y, cz = cone.position.z, baseY = cy - H / 2;
    const count = Math.max(8, Math.min(16, Math.round(R * 3.5)));
    for (let k = 0; k < count; k++) {
      const a = Math.PI * 2 * k / count, path: [number, number, number][] = [0, .35, .7, .95].map(u => [cx + (R * (1 - u) + .04) * Math.cos(a), baseY + H * u, cz + (R * (1 - u) + .04) * Math.sin(a)]);
      soup.sweep(path, [.055, .05, .042, .03], 4);
    }
    const ring: [number, number, number][] = [];
    for (let k = 0; k <= 20; k++) { const a = Math.PI * 2 * k / 20; ring.push([cx + (R + .03) * Math.cos(a), baseY + .06, cz + (R + .03) * Math.sin(a)]); }
    soup.sweep(ring, ring.map(() => .08), 4);
    soup.sphere([cx, baseY + H + .08, cz], Math.min(.4, Math.max(.16, R * .1)), 7, 4);
    const value = soup.toPart("锥顶瓦楞与檐口", shade(cone.color, 1.14), { roughness: .85 });
    if (value) result.push(value);
  }
  return result;
}
