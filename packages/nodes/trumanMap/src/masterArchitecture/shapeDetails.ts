import type { ModelPart } from "../assetModelParts";
import { shade } from "./chineseRoofKit";
import { DEG, yawOf } from "./partMath";
import { ShapeBuilder, WORLD, Xf, type P } from "./shapeKit";

// 旧库里不是方盒体量的造型件（拱桥、门、塔、井、帐篷、科幻舱体……）的专用细化。
// 每个装饰函数只读部件、返回新增的合并 mesh；按部件名称识别，没有对应部件就什么都不做。
type Pt = { x: number; y: number };
const lum = (hex: string) => { const v = parseInt(hex.slice(1), 16); return (((v >> 16) & 255) * 299 + ((v >> 8) & 255) * 587 + (v & 255) * 114) / 1000; };

/** 局部轮廓在高度 y 处被多边形截出的横向区间（偶奇规则）。 */
function spansAt(profile: Pt[], y: number): [number, number][] {
  const xs: number[] = [];
  for (let i = 0; i < profile.length; i++) {
    const a = profile[i]!, c = profile[(i + 1) % profile.length]!;
    if ((a.y <= y && c.y > y) || (c.y <= y && a.y > y)) xs.push(a.x + (y - a.y) * (c.x - a.x) / (c.y - a.y));
  }
  xs.sort((p, q) => p - q);
  const result: [number, number][] = [];
  for (let i = 0; i + 1 < xs.length; i += 2) result.push([xs[i]!, xs[i + 1]!]);
  return result;
}

/** 拱桥、拱门轮廓里的拱洞曲线：从某个最低点出发、不碰顶边、回到另一个最低点的那一段。 */
function archCurve(profile: Pt[]): Pt[] | undefined {
  const ys = profile.map(p => p.y), ymin = Math.min(...ys), ymax = Math.max(...ys), n = profile.length;
  let best: Pt[] | undefined;
  for (let i = 0; i < n; i++) {
    if (Math.abs(profile[i]!.y - ymin) > .01) continue;
    const run: Pt[] = [profile[i]!];
    let ok = false;
    for (let step = 1, j = (i + 1) % n; step <= n; step++, j = (j + 1) % n) {
      const p = profile[j]!;
      run.push(p);
      if (Math.abs(p.y - ymin) <= .01) { ok = run.length >= 5; break; }
      if (p.y >= ymax - .01) break;
    }
    if (ok && (!best || run.length > best.length)) best = run;
  }
  return best;
}

/** 石质拉伸体（拱桥、尖拱门框、门塔、方尖碑）：两个立面铺横缝和错缝竖缝，拱洞加拱圈和楔石缝。 */
export function stoneSilhouettes(parts: ModelPart[]): ModelPart[] {
  const b = new ShapeBuilder(), keys = new Map<string, string>();
  const groupFor = (color: string) => {
    let key = keys.get(color);
    if (!key) { key = `s${keys.size}`; keys.set(color, key); b.group(`${key}j`, "石构砌缝", shade(color, .6), { roughness: 1 }).group(`${key}r`, "拱圈石带", shade(color, 1.14), { roughness: .9 }); }
    return key;
  };
  let quads = 0;
  for (const part of parts) {
    if (quads >= 320) break;
    if (part.shape !== "extrude" || !part.profile || part.profile.length < 4) continue;
    if (!/石|桥|拱|墙|碑|塔|门|身/.test(part.name) || /瓦|屋顶|棚|篷|帐|草|茅|檐|屋/.test(part.name)) continue;
    const profile = part.profile, depth = part.depth ?? .2, xf = new Xf(part), key = groupFor(part.color);
    const ys = profile.map(p => p.y), xs = profile.map(p => p.x), ymin = Math.min(...ys), ymax = Math.max(...ys);
    const H = ymax - ymin;
    if (H < .8 || Math.max(...xs) - Math.min(...xs) < .8) continue;
    const course = H > 3 ? .5 : H > 1.8 ? .38 : .3, block = course * 2.4, arch = archCurve(profile);
    for (const sign of [-1, 1]) {
      const z = sign * (depth / 2 + .012), n: P = [0, 0, sign];
      const quad = (x0: number, y0: number, x1: number, y1: number) => { if (quads >= 320) return; quads++; b.xquad(`${key}j`, xf, [x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z], n); };
      for (let k = 1, y = ymin + course; y < ymax - .08; y += course, k++) {
        for (const [a, c] of spansAt(profile, y)) if (c - a > .3) quad(a + .03, y - .011, c - .03, y + .011);
        // 竖缝：上一道横缝与本道之间，奇偶层错开半块
        const lowY = y - course + .03, highY = y - .03, offset = (k % 2) * block / 2;
        for (const [a, c] of spansAt(profile, y - course / 2)) for (let x = a + .1 + offset; x < c - .1; x += block) {
          if (spansAt(profile, lowY).some(([p, q]) => x > p + .04 && x < q - .04) && spansAt(profile, highY).some(([p, q]) => x > p + .04 && x < q - .04)) quad(x - .011, lowY, x + .011, highY);
        }
      }
      if (arch) {
        // 拱圈：沿拱洞内缘一道石带，再沿法向每个顶点和中点一条楔石缝
        const zr = sign * (depth / 2 + .03), centerX = (arch[0]!.x + arch[arch.length - 1]!.x) / 2, baseY = Math.min(arch[0]!.y, arch[arch.length - 1]!.y);
        b.xpath(`${key}r`, xf, arch.map(p => [p.x, p.y, zr] as P), .07);
        const marks: Pt[] = [];
        for (let i = 1; i < arch.length - 1; i++) { marks.push(arch[i]!); if (i + 1 < arch.length - 1) marks.push({ x: (arch[i]!.x + arch[i + 1]!.x) / 2, y: (arch[i]!.y + arch[i + 1]!.y) / 2 }); }
        for (const point of marks) {
          const dx = point.x - centerX, dy = point.y - baseY, length = Math.hypot(dx, dy) || 1;
          b.xline(`${key}j`, xf, [point.x, point.y, z + sign * .004], [point.x + dx / length * .3, point.y + dy / length * .3, z + sign * .004], .016);
        }
      }
    }
  }
  return quads ? b.parts() : [];
}

/** 桥：栏柱加压顶（日式再加宝珠）、桥面板下加托梁、两端落地的桥台。 */
export function bridgeDetails(parts: ModelPart[], theme: string | undefined): ModelPart[] {
  const b = new ShapeBuilder();
  b.group("cap", "栏柱压顶", "#a8a396", { roughness: .9 }).group("finial", "栏柱宝珠", "#d9b45a", { roughness: .45, metalness: .4 })
    .group("beam", "桥下托梁", "#5c4636", { roughness: .85 }).group("abut", "桥台", "#8d8a80", { roughness: .95 });
  let any = false, caps = 0;
  const posts = parts.filter(value => /栏柱|矮柱|木桩|望柱/.test(value.name) && (value.shape === "box" || value.shape === "cylinder") && yawOf(value) !== undefined && value.scale.y >= .35 && value.scale.y <= 2.4 && Math.max(value.scale.x, value.scale.z) <= .4);
  for (const post of posts) {
    if (caps >= 44) break;
    const top = post.position.y + post.scale.y / 2, x = post.position.x, z = post.position.z, wide = Math.max(post.scale.x, post.scale.z);
    if (post.shape === "box") b.boxYaw("cap", x, top + .025, z, post.scale.x + .07, .05, post.scale.z + .07, yawOf(post) ?? 0);
    if (theme === "日式" || post.shape === "cylinder") { b.ball("finial", [x, top + (post.shape === "box" ? .12 : .02), z], Math.max(.06, wide * (post.shape === "box" ? .75 : .62))); }
    caps++; any = true;
  }
  const planks = parts.filter(value => value.shape === "box" && /铺板|桥面石|吊桥木板/.test(value.name));
  if (planks.length >= 6) {
    const spanX = Math.max(...planks.map(p => p.position.x)) - Math.min(...planks.map(p => p.position.x)), spanZ = Math.max(...planks.map(p => p.position.z)) - Math.min(...planks.map(p => p.position.z));
    const axisX = spanX >= spanZ, sorted = [...planks].sort((p, q) => axisX ? p.position.x - q.position.x : p.position.z - q.position.z);
    for (const side of [-1, 1]) {
      const path: P[] = sorted.map(plank => {
        const len = axisX ? plank.scale.z : plank.scale.x, y = plank.position.y - plank.scale.y / 2 - .07;
        return axisX ? [plank.position.x, y, plank.position.z + side * (len / 2 - .12)] : [plank.position.x + side * (len / 2 - .12), y, plank.position.z];
      });
      b.sweep("beam", path, path.map(() => .065)); any = true;
    }
    // 两端离地的桥台
    for (const plank of [sorted[0]!, sorted[sorted.length - 1]!]) {
      const bottom = plank.position.y - plank.scale.y / 2;
      if (bottom < .12) continue;
      const len = axisX ? plank.scale.z : plank.scale.x, outward = plank === sorted[0] ? -1 : 1, shift = outward * (plank.scale[axisX ? "x" : "z"] / 2 + .28);
      const cx = axisX ? plank.position.x + shift : plank.position.x, cz = axisX ? plank.position.z : plank.position.z + shift;
      b.box("abut", cx, bottom / 2, cz, axisX ? .8 : len + .3, bottom, axisX ? len + .3 : .8); any = true;
    }
  }
  return any ? b.parts() : [];
}

/** 篷布：山形拉伸篷顶和大块薄板篷布铺条纹；拉绳下端打地钉；山形篷顶的脊端加宝珠。 */
export function awningDetails(parts: ModelPart[]): ModelPart[] {
  const b = new ShapeBuilder();
  b.group("light", "篷布浅条纹", "#eadfc6", { roughness: .9 }).group("dark", "篷布深条纹", "#4a3a2c", { roughness: .9 }).group("stake", "地钉", "#5a4a38", { roughness: .95 }).group("finial", "篷脊宝珠", "#c9a24f", { roughness: .45, metalness: .4 });
  let any = false;
  const stripeKey = (color: string) => lum(color) < 150 ? "light" : "dark";
  for (const part of parts) {
    if (!/篷|棚|帐|帆布|顶布/.test(part.name) || /帐篷立杆|撑杆|中柱|支腿/.test(part.name)) continue;
    const xf = new Xf(part, false);
    if (part.shape === "extrude" && part.profile && part.profile.length >= 6 && Math.abs(part.profile[0]!.x + part.profile[2]!.x) < .1) {
      // 山形篷顶：两坡各铺横向条纹（沿进深方向的窄带）
      const depth = part.depth ?? 1, p0 = part.profile[0]!, p1 = part.profile[1]!, p2 = part.profile[2]!, sw = .34, key = stripeKey(part.color);
      for (const [a, c] of [[p0, p1], [p1, p2]] as [Pt, Pt][]) {
        const tx = c.x - a.x, ty = c.y - a.y, length = Math.hypot(tx, ty), nx = -ty / length, ny = tx / length, off = .015;
        for (let k = 0; k * sw * 2 + sw <= depth; k++) {
          const z0 = -depth / 2 + k * sw * 2 + sw * .4, z1 = z0 + sw;
          b.xquad(key, xf, [a.x + nx * off, a.y + ny * off, z0], [c.x + nx * off, c.y + ny * off, z0], [c.x + nx * off, c.y + ny * off, z1], [a.x + nx * off, a.y + ny * off, z1], [nx, ny, 0]);
          any = true;
        }
      }
      b.ball("finial", xf.p(0, p1.y + .05, depth / 2 + .02), .07); b.ball("finial", xf.p(0, p1.y + .05, -depth / 2 - .02), .07);
    } else if (part.shape === "box" && /篷布|雨棚|顶布/.test(part.name) && Math.min(part.scale.x, part.scale.z) >= .8 && part.scale.y <= .15) {
      // 薄板篷布：顶面沿长边方向铺条纹
      const alongX = part.scale.x >= part.scale.z, len = alongX ? part.scale.x : part.scale.z, wide = alongX ? part.scale.z : part.scale.x, sw = .36, y = part.scale.y / 2 + .012, key = stripeKey(part.color);
      for (let k = 0; k * sw * 2 + sw <= len; k++) {
        const t0 = -len / 2 + k * sw * 2 + sw * .4, t1 = t0 + sw, h = wide / 2 - .02;
        if (alongX) b.xquad(key, xf, [t0, y, -h], [t1, y, -h], [t1, y, h], [t0, y, h], [0, 1, 0]);
        else b.xquad(key, xf, [-h, y, t0], [h, y, t0], [h, y, t1], [-h, y, t1], [0, 1, 0]);
        any = true;
      }
    }
  }
  // 拉绳下端打地钉
  for (const rope of parts.filter(value => value.shape === "box" && /拉绳|牵绳|外拉/.test(value.name))) {
    const xf = new Xf(rope), a = xf.p(0, -.5, 0), c = xf.p(0, .5, 0), low = a[1] < c[1] ? a : c;
    b.box("stake", low[0], Math.max(.1, low[1] + .05), low[2], .06, .24, .06); any = true;
  }
  return any ? b.parts() : [];
}

/** 园林月洞门：洞口内外两道石圈、两侧白墙各开一扇漏窗（窗框加十字格）、墙脚加石勒脚。 */
export function moonGate(parts: ModelPart[]): ModelPart[] {
  const ring = parts.find(value => value.shape === "lathe" && /月洞|环墙/.test(value.name) && value.profile?.length);
  if (!ring) return [];
  const b = new ShapeBuilder(), xf = new Xf(ring);
  b.group("stone", "洞口石圈", "#a9a595", { roughness: .9 }).group("lattice", "漏窗格棂", "#4a4a45", { roughness: .8 }).group("plinth", "墙脚石", "#8d897b", { roughness: .95 });
  const rs = ring.profile!.map(p => p.x), ys = ring.profile!.map(p => p.y), rIn = Math.min(...rs), rOut = Math.max(...rs), yMin = Math.min(...ys), yMax = Math.max(...ys);
  for (const y of [yMin - .02, yMax + .02]) { b.xring("stone", xf, [0, y, 0], rIn + .03, .07, "y", 28); b.xring("stone", xf, [0, y, 0], rOut - .03, .05, "y", 28); }
  for (const wall of parts.filter(value => value.shape === "box" && /侧翼|白墙/.test(value.name) && value.scale.y >= 1.5)) {
    const { x, y, z } = wall.position, { x: sx, y: sy, z: sz } = wall.scale, wy = y + sy * .1, ws = Math.min(.8, sx * .72);
    for (const sign of [-1, 1]) {
      const zf = z + sign * (sz / 2 + .012), key = "lattice", n = sign;
      const bar = (cx: number, cy: number, w: number, h: number) => b.rect(key, cx, cy, zf, w, h, sign > 0 ? 0 : 180);
      bar(x, wy + ws / 2, ws + .12, .06); bar(x, wy - ws / 2, ws + .12, .06); bar(x - ws / 2, wy, .06, ws); bar(x + ws / 2, wy, .06, ws);
      for (const f of [-1 / 3, 0, 1 / 3]) { bar(x + f * ws, wy, .035, ws); bar(x, wy + f * ws, ws, .035); }
      void n;
    }
    b.box("plinth", x, wy - sy * .1 - sy / 2 + .17, z, sx + .1, .34, sz + .1);
  }
  return b.parts();
}

/** 魔法传送门的符文和旋涡、法阵祭坛的立石和发光球。 */
export function magicDetails(parts: ModelPart[], name: string): ModelPart[] {
  const b = new ShapeBuilder();
  b.group("rune", "发光符文", "#9fe8ff", { emissive: "#5ad4ff", emissiveIntensity: 1.1, roughness: .4 }).group("swirl", "能量旋涡", "#a6f0ff", { emissive: "#5ad4ff", emissiveIntensity: .9, roughness: .4 })
    .group("pillar", "法阵立石", "#7b7f88", { roughness: .9 }).group("orb", "立石发光球", "#c3b4e8", { emissive: "#a58be0", emissiveIntensity: 1, roughness: .4 });
  let any = false;
  const ring = parts.find(value => value.shape === "tube" && /门环/.test(value.name) && value.path && value.path.length >= 12);
  const plane = parts.find(value => value.shape === "cylinder" && /能量面/.test(value.name));
  if (ring && plane) {
    const path = ring.path!, xf = new Xf(plane), a = plane.scale.x / 2, c = plane.scale.z / 2, cy = plane.position.y;
    for (let i = 0; i < path.length - 1; i += 3) {
      const p = path[i]!, angle = Math.atan2(p.y - cy, p.x) / DEG, rune = new Xf({ position: { x: p.x * 1.0, y: p.y, z: p.z + .09 }, rotation: { x: 0, y: 0, z: angle - 90 }, scale: { x: 1, y: 1, z: 1 } } as ModelPart);
      b.xbox("rune", rune, [0, 0, 0], [.1, .2, .05]); any = true;
    }
    // 三道旋涡弧：半径逐圈缩小，起点逐圈转开
    for (const [k, start] of [[.86, .2], [.62, 1.7], [.38, 3.3]] as [number, number][]) {
      const points: P[] = [];
      for (let t = 0; t <= 20; t++) { const ang = start + t / 20 * Math.PI * 1.35; points.push([Math.cos(ang) * a * k, cy + Math.sin(ang) * c * k, plane.position.z + .02]); }
      b.sweep("swirl", points, points.map(() => .022)); any = true;
    }
    void xf;
  }
  const stage = parts.find(value => value.shape === "cylinder" && /法阵石台/.test(value.name));
  if (stage && /法阵/.test(name)) {
    const r = stage.scale.x / 2 - .2, top = stage.position.y + stage.scale.y / 2;
    for (let k = 0; k < 8; k++) {
      const ang = Math.PI * 2 * k / 8 + Math.PI / 8, x = Math.cos(ang) * r, z = Math.sin(ang) * r;
      b.boxYaw("pillar", x, top + .42, z, .2, .84, .2, -ang / DEG + 90); b.boxYaw("pillar", x, top + .05, z, .3, .1, .3, -ang / DEG + 90);
      b.ball("orb", [x, top + .95, z], .09); any = true;
    }
    b.xring("pillar", new Xf(stage), [0, stage.scale.y / 2 + .02, 0], .5 * 1.02, .05, "y", 36); any = true;
  }
  return any ? b.parts() : [];
}

/** 四层中式宝塔：各层塔身开门窗、飞檐挂风铃、塔刹加相轮。 */
export function pagodaDetails(parts: ModelPart[]): ModelPart[] {
  const bodies = parts.filter(value => value.shape === "cylinder" && /塔身/.test(value.name)).sort((p, q) => p.position.y - q.position.y);
  if (!bodies.length) return [];
  const b = new ShapeBuilder();
  b.group("pane", "塔窗暗面", "#3a2a22", { roughness: .7 }).group("frame", "塔窗框", "#9c3e32", { roughness: .6 }).group("bell", "檐角风铃", "#d9b45a", { roughness: .4, metalness: .5 }).group("cord", "风铃吊绳", "#5a4630", { roughness: .9 })
    .group("ring", "塔刹相轮", "#c9a24f", { roughness: .45, metalness: .4 });
  bodies.forEach((body, level) => {
    const r = body.scale.x / 2, h = body.scale.y, cy = body.position.y, cx = body.position.x, cz = body.position.z, facet = Math.cos(11.25 * DEG) * r + .012;
    for (let k = 0; k < 4; k++) {
      const theta = (11.25 + 90 * k + (level % 2) * 22.5), a = theta * DEG, x = cx + Math.sin(a) * facet, z = cz + Math.cos(a) * facet, tx = Math.cos(a), tz = -Math.sin(a);
      const door = level === 0 && k === 0, w = Math.min(door ? .3 : .26, r * .38), wh = door ? h * .78 : h * .52, y = door ? cy - h / 2 + wh / 2 : cy + h * .05;
      b.rect("pane", x, y, z, w, wh, theta);
      const ft = .035, put = (dx: number, dy: number, ww: number, hh: number) => b.rect("frame", x + tx * dx + Math.sin(a) * .006, y + dy, z + tz * dx + Math.cos(a) * .006, ww, hh, theta);
      put(0, wh / 2 + ft / 2, w + ft * 2, ft); put(0, -wh / 2 - ft / 2, w + ft * 2, ft); put(-w / 2 - ft / 2, 0, ft, wh); put(w / 2 + ft / 2, 0, ft, wh);
      if (!door) { put(0, 0, .025, wh); put(0, 0, w, .025); }
    }
  });
  for (const eave of parts.filter(value => value.shape === "lathe" && /飞檐|檐/.test(value.name) && value.profile?.length)) {
    const rMax = Math.max(...eave.profile!.map(p => p.x)), yLow = Math.min(...eave.profile!.map(p => p.y));
    for (let k = 0; k < 8; k++) {
      const ang = Math.PI * 2 * k / 8 + Math.PI / 8, x = eave.position.x + Math.cos(ang) * rMax * .97, z = eave.position.z + Math.sin(ang) * rMax * .97, y = eave.position.y + yLow;
      b.box("cord", x, y - .05, z, .014, .1, .014); b.ball("bell", [x, y - .13, z], .04);
    }
  }
  const spire = parts.find(value => value.shape === "cone" && /塔刹/.test(value.name));
  if (spire) {
    const base = spire.position.y - spire.scale.y / 2;
    for (let k = 0; k < 5; k++) b.box("ring", spire.position.x, base + .1 + k * .12, spire.position.z, .34 - k * .05, .04, .34 - k * .05);
  }
  return b.parts();
}

/** 竹篱屏风：每根竹竿加竹节，横竹与竖竿交叉处加绑绳。 */
export function bambooDetails(parts: ModelPart[]): ModelPart[] {
  const poles = parts.filter(value => value.shape === "cylinder" && /竹竿/.test(value.name));
  if (poles.length < 4) return [];
  const b = new ShapeBuilder();
  b.group("node", "竹节", "#6f7c4e", { roughness: .85 }).group("lash", "绑绳", "#5b4a34", { roughness: .95 });
  for (const pole of poles.slice(0, 16)) for (const f of [.2, .5, .8]) b.box("node", pole.position.x, pole.position.y - pole.scale.y / 2 + pole.scale.y * f, pole.position.z, pole.scale.x + .035, .03, pole.scale.z + .035);
  for (const rail of parts.filter(value => value.shape === "cylinder" && /横竹/.test(value.name))) for (const pole of poles.slice(0, 14)) b.box("lash", pole.position.x, rail.position.y, rail.position.z, pole.scale.x + .05, .07, pole.scale.z + .12);
  return b.parts();
}

/** 井：石井壁和井沿按层铺环形砌缝；辘轳加摇把。 */
export function wellDetails(parts: ModelPart[]): ModelPart[] {
  const walls = parts.filter(value => value.shape === "lathe" && /井壁|矮壁|井沿|压顶/.test(value.name) && value.profile?.length);
  if (!walls.length) return [];
  const b = new ShapeBuilder();
  walls.forEach((wall, index) => {
    const key = `joint${index}`, profile = wall.profile!;
    b.group(key, "井壁砌缝", shade(wall.color, .6), { roughness: 1 });
    const ys = profile.map(p => p.y), y0 = Math.min(...ys), y1 = Math.max(...ys), xf = new Xf(wall);
    for (let y = y0 + .16; y < y1 - .05; y += .16) {
      const spans = spansAt(profile, y);
      if (!spans.length) continue;
      b.xring(key, xf, [0, y, 0], Math.max(...spans.map(s => s[1])) + .012, .014, "y", 22);
    }
  });
  for (const drum of parts.filter(value => value.shape === "cylinder" && /辘轳/.test(value.name))) {
    b.group("crank", "辘轳摇把", "#5b4839", { roughness: .85 });
    const xf = new Xf(drum), reach = .5 + .35;
    b.xline("crank", xf, [0, reach, 0], [0, reach, 0], .02);
    b.xbox("crank", xf, [0, .5 + .06, 0], [.07, .07, .07]);
    const a = xf.p(0, .5 + .06, 0);
    b.box("crank", a[0], a[1] - .14, a[2] + .22, .05, .05, .44); b.box("crank", a[0], a[1] - .14, a[2] + .44, .1, .1, .1);
  }
  return b.parts();
}

/** 古典石栏杆：两端加方柱、柱帽和球形柱头。 */
export function balustradeEnds(parts: ModelPart[]): ModelPart[] {
  const rail = parts.find(value => value.shape === "box" && /石栏扶手/.test(value.name));
  const base = parts.find(value => value.shape === "box" && /石栏底梁/.test(value.name));
  if (!rail || !base) return [];
  const b = new ShapeBuilder();
  b.group("post", "栏杆端柱", base.color, { roughness: .9 }).group("cap", "端柱帽", rail.color, { roughness: .9 });
  const top = rail.position.y + rail.scale.y / 2 + .08;
  for (const side of [-1, 1]) {
    const x = side * (rail.scale.x / 2 + .02);
    b.box("post", x, top / 2, rail.position.z, .32, top, .36);
    b.box("cap", x, top + .04, rail.position.z, .42, .08, .46);
    b.ball("cap", [x, top + .18, rail.position.z], .12);
  }
  return b.parts();
}

/** 加油站：雨棚四周镶边、棚底灯带、价格灯箱立柱、加油岛护柱、加油机枪架。 */
export function gasStationDetails(parts: ModelPart[]): ModelPart[] {
  const canopy = parts.find(value => value.shape === "box" && /加油站顶棚/.test(value.name));
  if (!canopy) return [];
  const band = parts.find(value => /顶棚色带/.test(value.name)), b = new ShapeBuilder();
  b.group("trim", "雨棚镶边", band?.color ?? "#608d83", { roughness: .7 }).group("light", "棚底灯带", "#fff2c0", { emissive: "#ffd98a", emissiveIntensity: 1, roughness: .4 })
    .group("pole", "灯箱立柱", "#3a4650", { roughness: .6, metalness: .3 }).group("sign", "价格灯箱", "#e6e0cc", { emissive: "#ffe9a8", emissiveIntensity: .5, roughness: .5 })
    .group("digit", "价格数字", "#b4351f", { emissive: "#ff5a38", emissiveIntensity: .8, roughness: .5 }).group("brand", "品牌色块", band?.color ?? "#608d83", { roughness: .6 })
    .group("bollard", "加油岛护柱", "#d9b92e", { roughness: .6 }).group("holster", "加油枪架", "#28343d", { roughness: .7 });
  const { x: sx, y: sy, z: sz } = canopy.scale, { x: cx, y: cy, z: cz } = canopy.position, top = cy + sy / 2;
  for (const side of [-1, 1]) { b.box("trim", cx, top + .06, cz + side * (sz / 2 + .01), sx + .04, .12, .06); b.box("trim", cx + side * (sx / 2 + .01), top + .06, cz, .06, .12, sz + .04); }
  for (const side of [-1, 1]) b.box("light", cx, cy - sy / 2 - .02, cz + side * sz * .24, sx * .78, .03, .26);
  const px = cx + sx / 2 + .7, pz = cz + sz / 2 - .2;
  b.box("pole", px, 2.1, pz, .26, 4.2, .26); b.box("sign", px, 4.1, pz, 1.1, 1.5, .22); b.box("brand", px, 4.72, pz + .12, 1.0, .26, .03);
  for (const f of [3.95, 4.25, 3.65]) { b.rect("digit", px, f - .05, pz + .121, .72, .2, 0); }
  const island = parts.find(value => value.shape === "box" && /加油岛/.test(value.name));
  if (island) for (const sxn of [-1, 1]) for (const szn of [-1, 1]) b.box("bollard", island.position.x + sxn * (island.scale.x / 2 - .12), island.position.y + island.scale.y / 2 + .4, island.position.z + szn * (island.scale.z / 2 - .1), .14, .8, .14);
  for (const pump of parts.filter(value => value.shape === "box" && /加油机/.test(value.name) && value.scale.y > 1.2)) for (const side of [-1, 1]) b.box("holster", pump.position.x + side * (pump.scale.x / 2 + .03), pump.position.y + .1, pump.position.z, .07, .3, .12);
  return b.parts();
}

/** 蘑菇小屋：伞盖下的菌褶、门框、圆窗框、门前石板和脚边的小蘑菇。 */
export function mushroomDetails(parts: ModelPart[]): ModelPart[] {
  const cap = parts.find(value => value.shape === "lathe" && /伞状/.test(value.name) && value.profile?.length);
  if (!cap) return [];
  const b = new ShapeBuilder();
  b.group("gill", "伞下菌褶", "#ead9c2", { roughness: .9 }).group("frame", "门窗框", "#6b4a30", { roughness: .8 }).group("stone", "门前石板", "#8d897b", { roughness: .95 })
    .group("stem", "小蘑菇柄", "#e8dcc4", { roughness: .9 }).group("top", "小蘑菇盖", "#b8503f", { roughness: .85 });
  const profile = cap.profile!, rMax = Math.max(...profile.map(p => p.x)), yUnder = cap.position.y + Math.min(...profile.map(p => p.y)) + .02, stem = parts.find(value => value.shape === "lathe" && /菌柄/.test(value.name));
  const rStem = stem?.profile ? Math.max(...stem.profile.map(p => p.x)) : .8;
  for (let k = 0; k < 28; k++) {
    const a = Math.PI * 2 * k / 28;
    b.sweep("gill", [[cap.position.x + Math.cos(a) * (rStem + .05), yUnder - .02, cap.position.z + Math.sin(a) * (rStem + .05)], [cap.position.x + Math.cos(a) * rMax * .9, yUnder + .03, cap.position.z + Math.sin(a) * rMax * .9]], [.018, .018]);
  }
  const door = parts.find(value => value.shape === "box" && /小门/.test(value.name));
  if (door) {
    const { x, y, z } = door.position, w = door.scale.x, h = door.scale.y, zf = z + door.scale.z / 2 + .01;
    b.rect("frame", x, y + h / 2 + .06, zf, w + .2, .1, 0); b.rect("frame", x - w / 2 - .06, y, zf, .1, h, 0); b.rect("frame", x + w / 2 + .06, y, zf, .1, h, 0);
    b.box("stone", x, .12, z + 1.0, 1.2, .08, .7);
  }
  for (const win of parts.filter(value => value.shape === "cylinder" && /圆窗/.test(value.name))) b.xring("frame", new Xf(win), [0, .52, 0], .6, .035, "y", 14);
  for (let k = 0; k < 5; k++) {
    const a = Math.PI * 2 * (k + .3) / 5 + .4, rr = 1.62, x = Math.cos(a) * rr, z = Math.sin(a) * rr, s = .7 + (k % 3) * .25;
    b.box("stem", x, .16 + .1 * s, z, .06 * s, .2 * s, .06 * s); b.ball("top", [x, .16 + .22 * s, z], .1 * s);
  }
  return b.parts();
}

/** 科幻造型件：舱壳和路桩的环形接缝与灯带、穹顶环箍、气闸门警示条和状态灯、停机坪地面标线与灯圈、维护架斜撑和爬梯等。 */
export function sciFiDetails(parts: ModelPart[], name: string): ModelPart[] {
  const b = new ShapeBuilder();
  b.group("seam", "舱壳环缝", "#5a6670", { roughness: .7, metalness: .4 }).group("strip", "环形灯带", "#8fe4ff", { emissive: "#4fd0ff", emissiveIntensity: 1, roughness: .4 })
    .group("hazA", "警示黄条", "#e0b020", { roughness: .6 }).group("hazB", "警示黑条", "#20242a", { roughness: .7 }).group("lamp", "状态灯", "#7dffa0", { emissive: "#3dff7a", emissiveIntensity: 1.2, roughness: .3 })
    .group("lampR", "状态红灯", "#ff6a5a", { emissive: "#ff3a2a", emissiveIntensity: 1.2, roughness: .3 }).group("mark", "地面标线", "#e8e0c8", { roughness: .9 }).group("steel", "钢构细件", "#5a6670", { roughness: .6, metalness: .4 })
    .group("grid", "格栅线", "#2a323a", { roughness: .8 });
  let any = false;
  // 居住舱壳、路桩：沿轴向每隔一段一道环缝，中间一道灯带
  for (const shell of parts.filter(value => (value.shape === "cylinder" || value.shape === "capsule") && /舱壳/.test(value.name) && value.scale.x >= 1.2)) {
    const xf = new Xf(shell), capsule = shell.shape === "capsule", r = capsule ? .254 : .504;
    // 胶囊的圆柱段只占中间 [-.25,.25]，两端是半球
    for (const f of capsule ? [-.2, -.1, .1, .2] : [-.36, -.12, .12, .36]) b.xring("seam", xf, [0, f, 0], r, capsule ? .012 : .028, "y", 26);
    b.xring("strip", xf, [0, 0, 0], r + .004, capsule ? .016 : .035, "y", 26); any = true;
  }
  for (const pillar of parts.filter(value => value.shape === "cylinder" && /路桩/.test(value.name) && !/帽/.test(value.name))) {
    const xf = new Xf(pillar);
    for (const f of [-.12, .06, .24]) b.xring(f < 0 ? "hazB" : "hazA", xf, [0, f, 0], .52, .02, "y", 12);
    any = true;
  }
  // 穹顶：沿轮廓每隔一段一道环箍
  for (const dome of parts.filter(value => value.shape === "lathe" && /穹顶/.test(value.name) && value.profile?.length)) {
    const xf = new Xf(dome), profile = dome.profile!, ys = profile.map(p => p.y), y0 = Math.min(...ys), y1 = Math.max(...ys);
    for (const f of [.28, .52, .74]) {
      const y = y0 + (y1 - y0) * f, spans = spansAt(profile, y);
      if (spans.length) b.xring("steel", xf, [0, y, 0], Math.max(...spans.map(s => s[1])) + .015, .03, "y", 32);
    }
    any = true;
  }
  // 气闸门、安检门：门楣警示条和状态灯
  const lintel = parts.find(value => value.shape === "box" && /气闸上框|扫描门上梁/.test(value.name));
  if (lintel) {
    const z = lintel.position.z + lintel.scale.z / 2 + .012, n = Math.floor(lintel.scale.x / .3);
    for (let k = 0; k < n; k++) b.rect(k % 2 ? "hazB" : "hazA", lintel.position.x - lintel.scale.x / 2 + .15 + k * .3, lintel.position.y, z, .15, lintel.scale.y * .6, 0);
    for (const [i, key] of ["lamp", "lampR", "lamp"].entries()) b.rect(key, lintel.position.x + (i - 1) * .32, lintel.position.y - lintel.scale.y / 2 - .09, z + .01, .12, .1, 0);
    any = true;
  }
  for (const plate of parts.filter(value => value.shape === "box" && /安检通道底板/.test(value.name))) {
    for (let k = 0; k < 8; k++) b.box("steel", plate.position.x, plate.position.y + plate.scale.y / 2 + .03, plate.position.z - plate.scale.z / 2 + .2 + k * (plate.scale.z - .4) / 7, plate.scale.x - .3, .05, .07);
    any = true;
  }
  // 停机坪：圆形标线、边缘灯圈
  const pad = parts.find(value => value.shape === "cylinder" && /防滑面层/.test(value.name));
  if (pad) {
    const y = pad.position.y + pad.scale.y / 2 + .012, r = pad.scale.x / 2;
    b.xring("mark", new Xf({ ...pad, scale: { x: 1, y: 1, z: 1 } } as ModelPart), [0, pad.scale.y / 2 + .012, 0], r * .62, .04, "y", 40);
    b.xring("mark", new Xf({ ...pad, scale: { x: 1, y: 1, z: 1 } } as ModelPart), [0, pad.scale.y / 2 + .012, 0], r * .92, .035, "y", 48);
    for (let k = 0; k < 16; k++) { const a = Math.PI * 2 * (k + .5) / 16; b.boxYaw("strip", Math.cos(a) * r * .8, y + .015, Math.sin(a) * r * .8, .09, .03, .3, -a / DEG + 90); }
    any = true;
  }
  // 观测平台：台面格栅线、望远镜
  const deck = parts.find(value => value.shape === "cylinder" && /观测平台/.test(value.name));
  if (deck) {
    const y = deck.position.y + deck.scale.y / 2 + .012, r = deck.scale.x / 2 - .15;
    // 台面格栅：沿 z 方向的细长条，按圆形台面裁短
    for (let k = -5; k <= 5; k++) { const t = k * r / 5.5, half = Math.sqrt(Math.max(0, r * r - t * t)), x = deck.position.x + t, z0 = deck.position.z - half, z1 = deck.position.z + half; b.xquad("grid", WORLD, [x - .015, y, z0], [x + .015, y, z0], [x + .015, y, z1], [x - .015, y, z1], [0, 1, 0]); }
    const tx = deck.position.x + 1.0, tz = deck.position.z - .85, ty = deck.position.y + deck.scale.y / 2;
    for (const leg of [0, 1, 2]) { const a = leg * Math.PI * 2 / 3 + .5; b.sweep("steel", [[tx, ty + .75, tz], [tx + Math.cos(a) * .34, ty, tz + Math.sin(a) * .34]], [.025, .025]); }
    b.sweep("steel", [[tx, ty + .85, tz], [tx - .45, ty + 1.25, tz + .45]], [.07, .1]);
    any = true;
  }
  // 发射维护架：两柱间的斜撑、爬梯
  const columns = parts.filter(value => value.shape === "box" && /发射架立柱/.test(value.name)).sort((p, q) => p.position.x - q.position.x);
  if (columns.length === 2) {
    const [left, right] = columns as [ModelPart, ModelPart], y0 = left.position.y - left.scale.y / 2 + .4, top = left.position.y + left.scale.y / 2 - .5, xs = left.position.x + left.scale.x / 2, xe = right.position.x - right.scale.x / 2;
    const levels = Math.max(2, Math.round((top - y0) / 1.7));
    for (let k = 0; k < levels; k++) {
      const ya = y0 + (top - y0) * k / levels, yb = y0 + (top - y0) * (k + 1) / levels, z = left.position.z;
      b.sweep("steel", [[xs, ya, z], [xe, yb, z]], [.04, .04]); b.sweep("steel", [[xs, yb, z], [xe, ya, z]], [.04, .04]);
    }
    for (let y = y0; y < top; y += .3) b.box("steel", left.position.x, y, left.position.z + left.scale.z / 2 + .06, left.scale.x * .8, .04, .05);
    any = true;
  }
  // 相控阵通信站：设备柜散热格栅、线缆
  const cabinet = parts.find(value => value.shape === "box" && /通信设备柜/.test(value.name));
  if (cabinet) {
    const z = cabinet.position.z + cabinet.scale.z / 2 + .012;
    for (let k = 0; k < 6; k++) b.rect("grid", cabinet.position.x - cabinet.scale.x * .3 + k * .05, cabinet.position.y + .1, z, .025, cabinet.scale.y * .6, 0);
    for (const dish of parts.filter(value => /平板阵列天线/.test(value.name))) b.sweep("steel", [[cabinet.position.x, cabinet.position.y + cabinet.scale.y / 2, cabinet.position.z], [(cabinet.position.x + dish.position.x) / 2, cabinet.position.y + cabinet.scale.y / 2 + .2, cabinet.position.z + .1], [dish.position.x, dish.position.y - dish.scale.y / 2, dish.position.z - .1]], [.025, .025, .025]);
    any = true;
  }
  void name;
  return any ? b.parts() : [];
}

/** 草庐：四角立木、檐口草须带、墙边柴堆、门边悬挂的玉米和葫芦。 */
export function hutDetails(parts: ModelPart[]): ModelPart[] {
  const roof = parts.find(value => value.shape === "extrude" && /茅草顶/.test(value.name));
  const base = parts.find(value => value.shape === "box" && /草庐土台/.test(value.name));
  if (!roof || !base) return [];
  const b = new ShapeBuilder();
  b.group("post", "墙角立木", "#6e5238", { roughness: .9 }).group("fringe", "檐口草须", shade(roof.color, .86), { roughness: 1 }).group("log", "柴堆", "#7b5a3c", { roughness: .9 })
    .group("corn", "悬挂玉米", "#d9b03a", { roughness: .8 }).group("gourd", "悬挂葫芦", "#c79a45", { roughness: .8 });
  const hx = base.scale.x / 2 - .45, hz = base.scale.z / 2 - .55, top = base.position.y + base.scale.y / 2;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.box("post", sx * hx, top + 1.0, sz * hz, .15, 2.0, .15);
  // 茅顶两侧檐口：一道厚草须带，高低错落两层
  const depth = roof.depth ?? 3.4, eaveX = Math.max(...roof.profile!.map(p => p.x)), eaveY = roof.position.y + roof.profile![0]!.y;
  for (const sx of [-1, 1]) { b.box("fringe", sx * (eaveX - .02), eaveY - .08, 0, .2, .2, depth + .1); b.box("fringe", sx * (eaveX + .06), eaveY - .22, 0, .12, .14, depth - .1); }
  for (const sz of [-1, 1]) b.box("fringe", 0, eaveY + .2, sz * (depth / 2 + .02), eaveX * 1.6, .16, .1);
  // 柴堆：墙根下三层
  for (let row = 0; row < 3; row++) for (let k = 0; k < 3 - row; k++) b.boxYaw("log", base.scale.x / 2 - .25 + .02, top + .1 + row * .17, -.5 + k * .2 + row * .1, .22, .15, 1.0, 90);
  // 门边檐下的玉米串和葫芦
  for (let k = 0; k < 4; k++) b.ball(k < 2 ? "corn" : "gourd", [.95 + k * .12, eaveY - .45 - (k % 2) * .1, base.scale.z / 2 - .25], .07 + (k % 2) * .02);
  return b.parts();
}

/** 造型件细化入口：按资产名称和部件名称分派，返回要追加的部件（不超过 room 个）。 */
export function dressShapes(parts: ModelPart[], theme: string | undefined, name: string, room: number): ModelPart[] {
  const out: ModelPart[] = [];
  const run = (fn: () => ModelPart[]) => { try { for (const value of fn()) if (out.length < room) out.push(value); } catch { /* 跳过这一项 */ } };
  run(() => stoneSilhouettes(parts));
  if (/桥/.test(name)) run(() => bridgeDetails(parts, theme));
  run(() => awningDetails(parts));
  if (/月洞门/.test(name)) run(() => moonGate(parts));
  if (/传送门|法阵/.test(name)) run(() => magicDetails(parts, name));
  if (/宝塔/.test(name)) run(() => pagodaDetails(parts));
  if (/草庐/.test(name)) run(() => hutDetails(parts));
  if (/竹篱/.test(name)) run(() => bambooDetails(parts));
  if (/井/.test(name)) run(() => wellDetails(parts));
  if (/栏杆/.test(name)) run(() => balustradeEnds(parts));
  if (/加油站/.test(name)) run(() => gasStationDetails(parts));
  if (/蘑菇/.test(name)) run(() => mushroomDetails(parts));
  if (theme === "科幻" || theme === "蒸汽朋克") run(() => sciFiDetails(parts, name));
  return out;
}
