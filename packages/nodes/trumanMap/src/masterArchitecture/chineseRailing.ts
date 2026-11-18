import type { ModelPart } from "../assetModelParts";
import { Builder, lantern, palette } from "./chineseArchKit";
import { worldBox } from "./chineseWallDressing";
import { Vector3 } from "three";

// 栏杆细化：把实心石栏板换成带望柱、寻杖和净瓶栏柱的石栏杆；给只有立柱和横栏的桥栏补栏柱、柱头和灯。
type Rect = { axis: "x" | "z"; fixed: number; from: number; to: number; y0: number; y1: number; thick: number };

function rectOf(value: ModelPart): Rect | undefined {
  if (value.shape !== "box") return undefined;
  const box = worldBox(value);
  if (!box) return undefined;
  const size = box.getSize(new Vector3()), axis: "x" | "z" = size.x >= size.z ? "x" : "z";
  return { axis, fixed: axis === "x" ? (box.min.z + box.max.z) / 2 : (box.min.x + box.max.x) / 2, from: axis === "x" ? box.min.x : box.min.z, to: axis === "x" ? box.max.x : box.max.z, y0: box.min.y, y1: box.max.y, thick: Math.min(size.x, size.z) };
}

function lighter(hex: string, factor: number) {
  const n = parseInt(hex.slice(1), 16), c = (shift: number) => Math.max(0, Math.min(255, Math.round(((n >> shift) & 255) * factor)));
  return `#${[16, 8, 0].map(s => c(s).toString(16).padStart(2, "0")).join("")}`;
}

/** 石栏板 → 石栏杆。返回新增部件，并从 parts 里移除被替换的栏板；room 不够时保持原样。 */
export function balustradePanels(parts: ModelPart[], room: number): ModelPart[] {
  const panels = parts.map(value => ({ value, rect: /栏板/.test(value.name) ? rectOf(value) : undefined })).filter((item): item is { value: ModelPart; rect: Rect } => item.rect !== undefined && item.rect.thick <= .4 && item.rect.to - item.rect.from >= .9 && item.rect.y1 - item.rect.y0 >= .45 && item.rect.y1 - item.rect.y0 <= 1.8);
  if (!panels.length || room < 3) return [];
  const b = new Builder(), seen = new Set<string>();
  for (const { value } of panels) { const key = value.color; if (!seen.has(key)) { seen.add(key); b.group(`s${key}`, "石栏杆", key, { roughness: .9 }).group(`p${key}`, "石栏柱", lighter(key, 1.06), { roughness: .9 }); } }
  const replaced: ModelPart[] = [];
  for (const { value, rect } of panels) {
    if (b.partCount() >= room - 1) break;
    const { axis, fixed, from, to, y0, y1, thick } = rect, key = `s${value.color}`, pk = `p${value.color}`, length = to - from, h = y1 - y0, t = Math.max(.12, thick);
    const put = (k: string, c: number, y: number, along: number, tall: number, depth: number) => { if (axis === "x") b.box(k, c, y, fixed, along, tall, depth); else b.box(k, fixed, y, c, depth, tall, along); };
    const mid = (from + to) / 2;
    put(key, mid, y0 + .07, length, .14, t + .08);              // 地栿
    put(key, mid, y1 - .05, length, .1, t * .8);                 // 寻杖
    put(key, mid, y1 - .2, length, .1, t + .05);                 // 盆唇
    put(key, mid, y0 + .2, length, .08, t);                      // 下横栏
    const count = Math.max(2, Math.round((length - .4) / .24));
    for (let i = 0; i < count; i++) {
      const c = from + .2 + (length - .4) * (i + .5) / count;
      if (axis === "x") b.post(pk, c, y0 + .14, y1 - .25, fixed, .1); else b.post(pk, fixed, y0 + .14, y1 - .25, c, .1);
    }
    for (const end of [from + .09, to - .09]) {
      put(pk, end, (y0 + y1) / 2 + .04, .18, h + .1, .2);
      put(pk, end, y1 + .1, .26, .1, .26);
    }
    replaced.push(value);
  }
  for (const value of replaced) parts.splice(parts.indexOf(value), 1);
  return b.parts();
}

/** 桥栏、廊栏的立柱之间补栏柱，柱顶加帽，端头望柱上挂灯；立柱成线（同一高度、间距 0.8–4.5m）才处理。 */
export function postInfill(parts: ModelPart[], room: number): ModelPart[] {
  // 立柱：细而方的竖直 box，取世界包围盒中心作为柱位
  const posts: { value: ModelPart; rect: Rect; cx: number; cz: number }[] = [];
  for (const value of parts) {
    if (value.shape !== "box" || !/栏柱|望柱/.test(value.name)) continue;
    const box = worldBox(value), rect = rectOf(value);
    if (!box || !rect) continue;
    const size = box.getSize(new Vector3());
    if (Math.max(size.x, size.z) > .25 || Math.abs(size.x - size.z) > .08 || size.y < .6 || size.y > 1.8) continue;
    posts.push({ value, rect, cx: (box.min.x + box.max.x) / 2, cz: (box.min.z + box.max.z) / 2 });
  }
  if (posts.length < 3 || room < 2) return [];
  const b = new Builder().group("baluster", "桥栏栏柱", posts[0]!.value.color).group("rail", "桥栏柱帽", posts[0]!.value.color).group("door", "灯座", palette.door).group("lantern", "宫灯", palette.lantern, { emissive: "#f0c878", emissiveIntensity: .55, roughness: .6 });
  const lines = new Map<string, { c: number; f: number; y0: number; y1: number }[]>();
  for (const { rect, cx, cz } of posts) {
    for (const axis of ["x", "z"] as const) {
      // 沿 axis 成线：另一方向坐标相同
      const other = axis === "x" ? cz : cx, along = axis === "x" ? cx : cz;
      const key = `${axis}|${Math.round(other * 10)}|${Math.round((rect.y1 - rect.y0) * 10)}`;
      if (!lines.has(key)) lines.set(key, []);
      lines.get(key)!.push({ c: along, f: other, y0: rect.y0, y1: rect.y1 });
    }
  }
  const done = new Set<string>();
  for (const [key, list] of lines) {
    if (list.length < 3 || b.partCount() >= room - 1) continue;
    const axis = key[0] as "x" | "z", sorted = [...list].sort((p, q) => p.c - q.c), tag = `${axis}|${Math.round(sorted[0]!.f * 10)}`;
    if (done.has(tag)) continue;
    // 间距过于离散说明这不是栏杆线（例如房屋的柱网）
    const gaps = sorted.slice(1).map((p, i) => p.c - sorted[i]!.c);
    if (gaps.some(gap => gap < .8 || gap > 4.5)) continue;
    done.add(tag);
    sorted.forEach((p, i) => {
      const x = axis === "x" ? p.c : p.f, z = axis === "x" ? p.f : p.c;
      if (i === 0 || i === sorted.length - 1) lantern(b, x, p.y1 + .3, z, .16, 0); else b.box("rail", x, p.y1 + .05, z, .16, .1, .16);
      const next = sorted[i + 1];
      if (!next) return;
      const count = Math.max(2, Math.round((next.c - p.c) / .26));
      for (let n = 1; n < count; n++) {
        const t = n / count, c = p.c + (next.c - p.c) * t, base = p.y0 + (next.y0 - p.y0) * t + .16, top = p.y1 + (next.y1 - p.y1) * t - .2;
        if (top - base < .3) continue;
        if (axis === "x") b.post("baluster", c, base, top, p.f, .06); else b.post("baluster", p.f, base, top, c, .06);
      }
    });
  }
  return b.parts().slice(0, room);
}
