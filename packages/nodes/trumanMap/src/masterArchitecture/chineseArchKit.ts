import { part, type ModelPart } from "../assetModelParts";
import { roofKitParts, Soup, type RoofKitInput } from "./chineseRoofKit";

// 古建筑装配件：同色小构件合并进少量 mesh，墙体、柱枋、门窗、栏杆和屋面套件拼成整栋。
export const palette = { wall: "#d9d1bb", wood: "#8a6a4b", trim: "#b59d78", tile: "#66756f", stone: "#b4ae9a", door: "#5d4a3a", glass: "#6c747d", lantern: "#f2e3b7" };

type Group = { name: string; color: string; soups: Soup[]; extra: Partial<ModelPart> };

export class Builder {
  private groups = new Map<string, Group>();
  readonly extras: ModelPart[] = [];
  group(key: string, name: string, color: string, extra: Partial<ModelPart> = {}) { this.groups.set(key, { name, color, soups: [], extra }); return this; }
  protected soup(key: string, vertices: number) {
    const group = this.groups.get(key);
    if (!group) throw new Error(`未登记构件组 ${key}`);
    let soup = group.soups[group.soups.length - 1];
    if (!soup || soup.vertices.length + vertices > 500) group.soups.push(soup = new Soup());
    return soup;
  }
  box(key: string, cx: number, cy: number, cz: number, sx: number, sy: number, sz: number) { this.soup(key, 24).box(cx, cy, cz, sx, sy, sz); }
  boxYaw(key: string, cx: number, cy: number, cz: number, sx: number, sy: number, sz: number, yawDeg: number) { this.soup(key, 24).boxYaw(cx, cy, cz, sx, sy, sz, yawDeg); }
  // 上下不封口的四面小柱（栏柱），16 顶点；上下端都被横栏盖住。
  post(key: string, cx: number, y0: number, y1: number, cz: number, size: number) {
    const soup = this.soup(key, 16), h = size / 2;
    for (const s of [-1, 1]) {
      soup.quad(soup.vertex([cx + s * h, y0, cz - h]), soup.vertex([cx + s * h, y1, cz - h]), soup.vertex([cx + s * h, y1, cz + h]), soup.vertex([cx + s * h, y0, cz + h]), [s, 0, 0]);
      soup.quad(soup.vertex([cx - h, y0, cz + s * h]), soup.vertex([cx + h, y0, cz + s * h]), soup.vertex([cx + h, y1, cz + s * h]), soup.vertex([cx - h, y1, cz + s * h]), [0, 0, s]);
    }
  }
  sphere(key: string, center: [number, number, number], radius: number) { this.soup(key, 32).sphere(center, radius, 7, 4); }
  sweep(key: string, path: [number, number, number][], radii: number[]) { this.soup(key, path.length * 5).sweep(path, radii, 5); }
  add(...parts: ModelPart[]) { this.extras.push(...parts); }
  partCount() { let count = this.extras.length; for (const group of this.groups.values()) count += group.soups.filter(soup => soup.indices.length >= 3).length; return count; }
  parts(): ModelPart[] {
    const result: ModelPart[] = [];
    for (const group of this.groups.values()) for (const soup of group.soups) { const value = soup.toPart(group.name, group.color, { roughness: .85, ...group.extra }); if (value) result.push(value); }
    return [...result, ...this.extras];
  }
}

export type Hole = { c: number; w: number; bottom: number; h: number };

// 沿 x 或 z 方向的一段墙；洞口之间是实墙，洞口上下补窗台和过梁。
export function wallRun(b: Builder, key: string, axis: "x" | "z", fixed: number, from: number, to: number, y0: number, y1: number, thick: number, holes: Hole[] = []) {
  const put = (t0: number, t1: number, ya: number, yb: number) => {
    if (t1 - t0 < .02 || yb - ya < .02) return;
    const t = (t0 + t1) / 2, y = (ya + yb) / 2;
    if (axis === "x") b.box(key, t, y, fixed, t1 - t0, yb - ya, thick); else b.box(key, fixed, y, t, thick, yb - ya, t1 - t0);
  };
  let cursor = from;
  for (const hole of [...holes].sort((p, q) => p.c - q.c)) {
    const left = hole.c - hole.w / 2, right = hole.c + hole.w / 2;
    put(cursor, left, y0, y1); put(left, right, y0, y0 + hole.bottom); put(left, right, y0 + hole.bottom + hole.h, y1); cursor = right;
  }
  put(cursor, to, y0, y1);
}

// 门窗：外框、暗色门扇/窗格和中挺。outward 为墙外侧方向（沿固定轴的 ±1）。
export function fillOpening(b: Builder, axis: "x" | "z", fixed: number, outward: 1 | -1, hole: Hole, y0: number, kind: "door" | "window", thick: number) {
  const put = (key: string, t: number, y: number, w: number, h: number, depth: number, off: number) => {
    if (axis === "x") b.box(key, t, y, fixed + outward * off, w, h, depth); else b.box(key, fixed + outward * off, y, t, depth, h, w);
  };
  const bottom = y0 + hole.bottom, top = bottom + hole.h, mid = (bottom + top) / 2, face = thick / 2;
  put("door", hole.c, mid, hole.w - .02, hole.h - .02, .07, face - .12);
  const frame = .13;
  put("trim", hole.c - hole.w / 2 - frame / 2 + .01, mid, frame, hole.h + frame * 2, .1, face + .02);
  put("trim", hole.c + hole.w / 2 + frame / 2 - .01, mid, frame, hole.h + frame * 2, .1, face + .02);
  put("trim", hole.c, top + frame / 2 - .01, hole.w + frame * 2, frame, .1, face + .02);
  if (kind === "window") {
    put("trim", hole.c, bottom - frame / 2 + .01, hole.w + frame * 2 + .1, frame, .16, face + .05);
    put("trim", hole.c, mid, .05, hole.h, .05, face - .05);
    put("trim", hole.c, mid, hole.w, .05, .05, face - .05);
  } else {
    put("trim", hole.c, mid, .05, hole.h, .05, face - .06);
    put("trim", hole.c, mid + hole.h * .18, hole.w, .05, .05, face - .06);
  }
}

// 轴向栏杆一段：上横栏、下横栏、等距栏柱，端头由 postAt 补望柱。
export function railRun(b: Builder, axis: "x" | "z", fixed: number, from: number, to: number, y: number, spacing = .26, height = .95) {
  const len = to - from, c = (from + to) / 2;
  const at = (t: number, yy: number, w: number, h: number, d: number) => axis === "x" ? b.box("rail", t, yy, fixed, w, h, d) : b.box("rail", fixed, yy, t, d, h, w);
  at(c, y + height - .06, len, .1, .14);
  at(c, y + height - .2, len, .05, .08);
  at(c, y + .2, len, .08, .1);
  const count = Math.max(1, Math.round(len / spacing));
  for (let i = 1; i < count; i++) {
    const t = from + len * i / count;
    if (axis === "x") b.post("baluster", t, y + .22, y + height - .22, fixed, .07); else b.post("baluster", fixed, y + .22, y + height - .22, t, .07);
  }
}

export function postAt(b: Builder, x: number, z: number, y: number, height = 1.1) {
  b.box("rail", x, y + height / 2, z, .17, height, .17);
  b.box("rail", x, y + height + .05, z, .24, .09, .24);
}

// 矩形一圈栏杆（可关闭某一侧）。
export function railRect(b: Builder, x0: number, x1: number, z0: number, z1: number, y: number, skip: ("front" | "back" | "left" | "right")[] = []) {
  if (!skip.includes("front")) railRun(b, "x", z0, x0, x1, y);
  if (!skip.includes("back")) railRun(b, "x", z1, x0, x1, y);
  if (!skip.includes("left")) railRun(b, "z", x0, z0, z1, y);
  if (!skip.includes("right")) railRun(b, "z", x1, z0, z1, y);
  for (const x of [x0, x1]) for (const z of [z0, z1]) postAt(b, x, z, y);
}

// 方柱落地：石础、柱身、栌斗式柱头，立面上形成浅色木构节奏。
export function pillar(b: Builder, x: number, z: number, y0: number, y1: number, size = .34) {
  b.box("stone", x, y0 + .09, z, size + .16, .18, size + .16);
  b.box("trim", x, (y0 + y1) / 2 + .02, z, size, y1 - y0 - .14, size);
  b.box("trim", x, y1 - .1, z, size + .16, .14, size + .16);
}

// 檐角与门前宫灯：灯罩加细吊绳。
export function lantern(b: Builder, x: number, y: number, z: number, radius = .2, cord = .35) {
  if (cord > 0) b.box("door", x, y + radius + cord / 2, z, .03, cord, .03);
  b.sphere("lantern", [x, y, z], radius);
  b.box("door", x, y + radius * .95, z, radius * .8, .05, radius * .8);
  b.box("door", x, y - radius * .95, z, radius * .5, .05, radius * .5);
}

export function standardGroups(b: Builder) {
  return b
    .group("wall", "墙体", palette.wall, { roughness: .92 })
    .group("trim", "木构与门窗框", palette.trim)
    .group("door", "门扇窗格", palette.door)
    .group("rail", "栏杆", palette.trim)
    .group("baluster", "栏柱", palette.trim)
    .group("stone", "石础台基", palette.stone, { roughness: .95 })
    .group("lantern", "宫灯", palette.lantern, { emissive: "#f0c878", emissiveIntensity: .55, roughness: .6 });
}

// 屋面套件按局部坐标生成：脊线沿 z。ridgeAlongX 时整体绕 y 转 90°，原点平移到屋面基线。
export function roofAt(input: RoofKitInput, origin: [number, number, number], ridgeAlongX = false): ModelPart[] {
  const parts = roofKitParts(input);
  for (const value of parts) {
    value.position = { x: origin[0], y: origin[1], z: origin[2] };
    if (ridgeAlongX) value.rotation = { x: 0, y: 90, z: 0 };
  }
  return parts;
}

export { part };
