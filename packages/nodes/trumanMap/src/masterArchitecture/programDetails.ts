import type { ModelPart } from "../assetModelParts";
import { worldBox } from "./chineseWallDressing";
import { DEG, yawOf } from "./partMath";
import { ShapeBuilder, WORLD, Xf, type P } from "./shapeKit";

// 程序化建筑族里不是体量块的用途：交通族（站台、连桥、桥面）和幻想族（巨柱、种植台、菌冠、太空港舱体）的细化。
type Gap = [number, number];

/** 沿一条水平边铺栏杆（扶手、下横栏、等距栏柱），gaps 是不铺的区间（连桥接口、台阶口）。 */
function railLine(b: ShapeBuilder, key: string, x0: number, z0: number, x1: number, z1: number, y: number, gaps: Gap[] = []) {
  const length = Math.hypot(x1 - x0, z1 - z0);
  if (length < .6) return;
  const ux = (x1 - x0) / length, uz = (z1 - z0) / length, yaw = Math.atan2(-uz, ux) / DEG;
  const segments: Gap[] = [];
  let cursor = 0;
  for (const [a, c] of [...gaps].sort((p, q) => p[0] - q[0])) { if (a - cursor > .4) segments.push([cursor, Math.min(a, length)]); cursor = Math.max(cursor, c); }
  if (length - cursor > .4) segments.push([cursor, length]);
  for (const [a, c] of segments) {
    const len = c - a, mx = x0 + ux * (a + c) / 2, mz = z0 + uz * (a + c) / 2;
    b.boxYaw(key, mx, y + 1.0, mz, len, .06, .07, yaw); b.boxYaw(key, mx, y + .5, mz, len, .04, .05, yaw);
    const n = Math.max(1, Math.round(len / 1.2));
    for (let i = 0; i <= n; i++) b.box(key, x0 + ux * (a + len * i / n), y + .5, z0 + uz * (a + len * i / n), .06, 1.0, .06);
  }
}

/** 交通族：站台和连桥加栏杆、安全黄线，顶棚补四角立柱和镶边，站台两端加台阶，岗亭开窗，加长椅，轨道加枕木，公路桥画车道线。 */
export function transitDetails(parts: ModelPart[], program: number): ModelPart[] {
  const decks = parts.filter(value => value.shape === "box" && value.name === "节点站台桥面" && yawOf(value) === 0);
  const links = parts.filter(value => value.shape === "box" && /水平连桥桥面/.test(value.name));
  if (!decks.length && !links.length) return [];
  const b = new ShapeBuilder();
  b.group("rail", "站台栏杆", "#6d7f82", { roughness: .6, metalness: .3 }).group("safety", "站台安全黄线", "#e0b020", { roughness: .8 }).group("post", "顶棚立柱", "#7a8a8c", { roughness: .6, metalness: .3 })
    .group("fascia", "顶棚镶边", "#5f7476", { roughness: .7 }).group("light", "棚底灯带", "#fff2c0", { emissive: "#ffd98a", emissiveIntensity: 1, roughness: .4 }).group("stair", "站台台阶", "#9aa497", { roughness: .95 })
    .group("bench", "候车长椅", "#7b5a3c", { roughness: .85 }).group("pane", "岗亭窗", "#3d5a68", { roughness: .25, metalness: .15 }).group("frame", "岗亭窗框", "#e6e0cc", { roughness: .6 })
    .group("sleeper", "枕木", "#5a4a3c", { roughness: .95 }).group("lane", "车道线", "#e8e4d4", { roughness: .9 });
  let any = false;
  const linkBoxes = links.map(value => worldBox(value)).filter((box): box is NonNullable<typeof box> => !!box);
  decks.forEach((deck, index) => {
    const { x, y, z } = deck.position, hx = deck.scale.x / 2, hz = deck.scale.z / 2, top = y + deck.scale.y / 2;
    // 连桥落在哪些边上：边的两侧 .3m 内与连桥外框相交就留出缺口
    const gapsOn = (axis: "x" | "z", fixed: number): Gap[] => {
      const result: Gap[] = [];
      for (const box of linkBoxes) {
        if (box.max.y < top - .6 || box.min.y > top + .4) continue;
        const near = axis === "x" ? box.min.z <= fixed + .35 && box.max.z >= fixed - .35 : box.min.x <= fixed + .35 && box.max.x >= fixed - .35;
        const a = axis === "x" ? box.min.x : box.min.z, c = axis === "x" ? box.max.x : box.max.z, center = axis === "x" ? x : z, half = axis === "x" ? hx : hz;
        if (near) result.push([Math.max(0, a - (center - half)) - .1, Math.min(2 * half, c - (center - half)) + .1]);
      }
      return result;
    };
    railLine(b, "rail", x - hx + .1, z - hz + .1, x + hx - .1, z - hz + .1, top, gapsOn("x", z - hz));
    railLine(b, "rail", x - hx + .1, z + hz - .1, x + hx - .1, z + hz - .1, top, gapsOn("x", z + hz));
    railLine(b, "rail", x - hx + .1, z - hz + .1, x - hx + .1, z + hz - .1, top, gapsOn("z", x - hx));
    railLine(b, "rail", x + hx - .1, z - hz + .1, x + hx - .1, z + hz - .1, top, gapsOn("z", x + hx));
    for (const side of [-1, 1]) {
      const t0 = WORLD, zz = z + side * (hz - .45);
      b.xquad("safety", t0, [x - hx + .2, top + .012, zz - .1], [x + hx - .2, top + .012, zz - .1], [x + hx - .2, top + .012, zz + .1], [x - hx + .2, top + .012, zz + .1], [0, 1, 0]);
    }
    any = true;
    // 顶棚：四角立柱、镶边、棚底灯带
    const canopy = parts.filter(value => value.shape === "box" && value.name === "站台独立顶棚" && Math.abs(value.position.x - x) < .3 && Math.abs(value.position.z - z) < 1.2)[0];
    if (canopy) {
      const cx = canopy.position.x, cz = canopy.position.z, cy = canopy.position.y, sx = canopy.scale.x, sz = canopy.scale.z, under = cy - canopy.scale.y / 2;
      for (const sx1 of [-1, 1]) for (const sz1 of [-1, 1]) {
        b.box("post", cx + sx1 * (sx / 2 - .4), (top + under) / 2, cz + sz1 * (sz / 2 - .4), .14, under - top, .14);
      }
      for (const s of [-1, 1]) { b.box("fascia", cx, cy + canopy.scale.y / 2 + .02, cz + s * (sz / 2 + .02), sx + .06, .16, .06); b.box("fascia", cx + s * (sx / 2 + .02), cy + canopy.scale.y / 2 + .02, cz, .06, .16, sz + .06); }
      b.box("light", cx, under - .02, cz, sx * .7, .03, .26);
    }
    // 岗亭：两个相对面开窗，一侧开门洞暗面
    const booth = parts.filter(value => value.shape === "box" && /节点候车岗亭/.test(value.name) && Math.abs(value.position.x - x) < .3)[0];
    if (booth) {
      const bz = booth.position.z + booth.scale.z / 2 + .012, by = booth.position.y + booth.scale.y * .1;
      b.rect("pane", booth.position.x, by, bz, booth.scale.x * .6, booth.scale.y * .36, 0); b.rect("frame", booth.position.x, by + booth.scale.y * .18 + .03, bz + .006, booth.scale.x * .6 + .1, .06, 0); b.rect("frame", booth.position.x, by - booth.scale.y * .18 - .03, bz + .006, booth.scale.x * .6 + .1, .06, 0);
      for (const s of [-1, 1]) { b.rect("pane", booth.position.x + s * (booth.scale.x / 2 + .012), by, booth.position.z, booth.scale.z * .6, booth.scale.y * .36, 90 * s); }
    }
    // 长椅：站台前缘内侧两张
    for (const side of [-1, 1]) {
      const bx = x + side * (hx - 1.2), bz = z - hz + .9;
      b.box("bench", bx, top + .45, bz, 1.3, .07, .38); b.box("bench", bx, top + .75, bz - .17, 1.3, .4, .05);
      for (const l of [-.55, .55]) b.box("bench", bx + l, top + .22, bz, .06, .44, .32);
    }
    // 台阶：首尾两个站台的外端落到地面
    if (top >= .7 && (index === 0 || index === decks.length - 1)) {
      const outward = index === 0 ? -1 : 1, steps = Math.min(16, Math.ceil(top / .18)), rise = top / steps;
      for (let k = 0; k < steps; k++) {
        const h = top - (k + 1) * rise + rise;
        b.box("stair", x + outward * (hx + .15 + k * .3), h / 2, z, .3, h, 1.7);
      }
      for (const side of [-1, 1]) b.sweep("rail", [[x + outward * (hx + .05), top + .95, z + side * .85], [x + outward * (hx + .15 + steps * .3), .95, z + side * .85]], [.03, .03]);
    }
  });
  // 连桥栏杆：两侧各一道，沿连桥自身朝向
  for (const link of links.slice(0, 8)) {
    const yaw = yawOf(link);
    if (yaw === undefined) continue;
    const length = link.scale.z, width = link.scale.x, c = Math.cos(yaw * DEG), s = Math.sin(yaw * DEG), top = link.position.y + link.scale.y / 2;
    if (top < .4) continue;
    for (const side of [-1, 1]) {
      const ox = side * (width / 2 - .05), lx = link.position.x + ox * c, lz = link.position.z - ox * s;
      railLine(b, "rail", lx - s * length / 2, lz - c * length / 2, lx + s * length / 2, lz + c * length / 2, top);
    }
    any = true;
  }
  // 站前列车导轨：枕木
  if (program === 0) for (const rail of parts.filter(value => value.shape === "box" && /站前列车导轨/.test(value.name)).slice(0, 2)) {
    const n = Math.floor(rail.scale.z / .7);
    for (let k = 0; k < n; k++) b.box("sleeper", rail.position.x, rail.position.y - .1, rail.position.z - rail.scale.z / 2 + .35 + k * .7, .9, .1, .22);
    any = true;
  }
  // 公路桥：车道中线虚线
  if (program === 2) for (const link of links.slice(0, 6)) {
    if (yawOf(link) === undefined || link.scale.x < 2.4) continue;
    const n = Math.floor(link.scale.z / 1.4);
    const xf = new Xf({ position: link.position, rotation: link.rotation, scale: { x: 1, y: 1, z: 1 } } as ModelPart);
    for (let k = 0; k < n; k++) { const t = -link.scale.z / 2 + .7 + k * 1.4; b.xquad("lane", xf, [-.06, link.scale.y / 2 + .012, t - .3], [.06, link.scale.y / 2 + .012, t - .3], [.06, link.scale.y / 2 + .012, t + .3], [-.06, link.scale.y / 2 + .012, t + .3], [0, 1, 0]); }
    any = true;
  }
  return any ? b.parts() : [];
}

/** 幻想族：巨柱加凹槽和柱础柱头环、种植台上栽灌木和小树、菌冠下加菌褶和白斑、太空港舱体加环缝。 */
export function speculativeDetails(parts: ModelPart[], program: number): ModelPart[] {
  const b = new ShapeBuilder();
  b.group("flute", "巨柱凹槽", "#7d7a68", { roughness: 1 }).group("ring", "柱础柱头环", "#c8c3a8", { roughness: .9 }).group("leaf", "种植台灌木", "#6f9a5d", { roughness: .9 })
    .group("trunk", "种植台小树干", "#6a4c33", { roughness: .9 }).group("crown", "种植台小树冠", "#5d8a4d", { roughness: .9 }).group("gill", "菌冠菌褶", "#eadcc6", { roughness: .9 })
    .group("spot", "菌冠白斑", "#efe6d2", { roughness: .9 }).group("seam", "舱体环缝", "#5a6670", { roughness: .7, metalness: .4 }).group("strip", "舱体灯带", "#8fe4ff", { emissive: "#4fd0ff", emissiveIntensity: 1, roughness: .4 });
  let any = false;
  if (program === 2) for (const column of parts.filter(value => value.shape === "cylinder" && /巨柱/.test(value.name)).slice(0, 8)) {
    const xf = new Xf(column), r = .5;
    for (let k = 0; k < 14; k++) {
      const a = Math.PI * 2 * k / 14;
      b.xline("flute", xf, [Math.cos(a) * (r + .006), -.4, Math.sin(a) * (r + .006)], [Math.cos(a) * (r + .006), .4, Math.sin(a) * (r + .006)], .02);
    }
    b.xring("ring", xf, [0, -.485, 0], r + .02, .06, "y", 18); b.xring("ring", xf, [0, .47, 0], r + .02, .07, "y", 18);
    any = true;
  }
  if (program === 9) for (const bed of parts.filter(value => value.shape === "box" && /种植台/.test(value.name)).slice(0, 6)) {
    const top = bed.position.y + bed.scale.y / 2, hx = bed.scale.x / 2 - .4, hz = bed.scale.z / 2 - .4;
    for (let k = 0; k < 6; k++) { const px = bed.position.x + (((k * 37) % 100) / 100 - .5) * 2 * hx, pz = bed.position.z + (((k * 61) % 100) / 100 - .5) * 2 * hz; b.ball("leaf", [px, top + .25, pz], .28 + (k % 3) * .06); }
    for (const s of [-1, 1]) { const tx = bed.position.x + s * hx * .6, tz = bed.position.z; b.box("trunk", tx, top + .45, tz, .12, .9, .12); b.ball("crown", [tx, top + 1.1, tz], .55); }
    any = true;
  }
  if (program === 6) for (const cap of parts.filter(value => value.shape === "lathe" && /屋壳/.test(value.name) && value.profile?.length).slice(0, 8)) {
    const profile = cap.profile!, rMax = Math.max(...profile.map(p => p.x)), yTop = Math.max(...profile.map(p => p.y)), yUnder = cap.position.y + Math.min(...profile.map(p => p.y));
    for (let k = 0; k < 20; k++) { const a = Math.PI * 2 * k / 20; b.sweep("gill", [[cap.position.x + Math.cos(a) * .35, yUnder + .02, cap.position.z + Math.sin(a) * .35], [cap.position.x + Math.cos(a) * rMax * .85, yUnder + .08, cap.position.z + Math.sin(a) * rMax * .85]], [.014, .014]); }
    for (let k = 0; k < 5; k++) { const a = Math.PI * 2 * k / 5 + .3, rr = rMax * .45; b.ball("spot", [cap.position.x + Math.cos(a) * rr, cap.position.y + yTop * (1 - .55 * (rr / rMax) ** 2) + .02, cap.position.z + Math.sin(a) * rr], .17); }
    any = true;
  }
  if (program === 4) for (const pod of parts.filter(value => value.shape === "capsule" && /舱体/.test(value.name)).slice(0, 6)) {
    const xf = new Xf(pod);
    for (const f of [-.2, -.1, .1, .2]) b.xring("seam", xf, [0, f, 0], .254, .012, "y", 24);
    b.xring("strip", xf, [0, 0, 0], .258, .016, "y", 24);
    any = true;
  }
  return any ? b.parts() : [];
}

/** 园林族 6 号用途（露天剧场）：舞台后墙、台口帘幕、顶棚和灯排，观众席每层加长椅。 */
export function amphitheaterDetails(parts: ModelPart[]): ModelPart[] {
  const stage = parts.find(value => value.shape === "box" && /露天演出舞台/.test(value.name));
  const tiers = parts.filter(value => value.shape === "box" && /剧场层叠看台/.test(value.name));
  if (!stage && !tiers.length) return [];
  const b = new ShapeBuilder();
  b.group("wall", "舞台后墙", "#8f9283", { roughness: .9 }).group("roof", "舞台顶棚", "#7d8a86", { roughness: .8 }).group("post", "舞台立柱", "#6c6f66", { roughness: .85 })
    .group("curtain", "台口帘幕", "#8c3a3a", { roughness: .95 }).group("lamp", "舞台灯", "#fff2c0", { emissive: "#ffd98a", emissiveIntensity: 1.2, roughness: .4 })
    .group("bench", "观众长椅", "#7b5a3c", { roughness: .85 }).group("step", "观众席台阶", "#a2a48d", { roughness: .95 });
  let any = false;
  if (stage) {
    const { x, z } = stage.position, top = stage.position.y + stage.scale.y / 2, sx = stage.scale.x, sz = stage.scale.z;
    b.box("wall", x, top + 1.5, z - sz / 2 + .12, sx, 3.0, .24);
    b.box("curtain", x, top + 1.4, z - sz / 2 + .3, sx - .5, 2.6, .06);
    b.box("roof", x, top + 3.3, z, sx + .5, .22, sz + .4);
    for (const s of [-1, 1]) b.box("post", x + s * (sx / 2 - .1), top + 1.6, z + sz / 2 - .15, .22, 3.2, .22);
    b.box("post", x, top + 3.05, z + sz / 2 - .55, sx - .2, .14, .14);
    for (let k = 0; k < 6; k++) b.ball("lamp", [x - sx / 2 + .6 + k * (sx - 1.2) / 5, top + 2.88, z + sz / 2 - .55], .11);
    any = true;
  }
  for (const tier of tiers.slice(0, 24)) {
    const top = tier.position.y + tier.scale.y / 2;
    b.box("bench", tier.position.x, top + .22, tier.position.z + tier.scale.z * .22, tier.scale.x - .3, .07, .3);
    for (const s of [-1, 1]) b.box("bench", tier.position.x + s * (tier.scale.x / 2 - .4), top + .1, tier.position.z + tier.scale.z * .22, .07, .2, .26);
    b.box("step", tier.position.x, tier.position.y, tier.position.z - tier.scale.z / 2 - .02, tier.scale.x + .08, tier.scale.y + .02, .08);
    any = true;
  }
  return any ? b.parts() : [];
}

/** 幻想族 3 号用途（水晶议会厅）：厅体四周长出一圈发光晶簇，基坛加灯环，入口桥加台阶和扶手。 */
export function crystalHallDetails(parts: ModelPart[]): ModelPart[] {
  const halls = parts.filter(value => value.shape === "mesh" && /晶体议厅/.test(value.name));
  const bases = parts.filter(value => value.shape === "cylinder" && /议厅基坛/.test(value.name));
  if (!halls.length && !bases.length) return [];
  const b = new ShapeBuilder();
  b.group("shard", "晶簇", "#9fd0e6", { emissive: "#5ab4dc", emissiveIntensity: .5, roughness: .25, opacity: .86 }).group("shardB", "晶簇浅色", "#cfeaf5", { emissive: "#8ccbe4", emissiveIntensity: .4, roughness: .25, opacity: .9 })
    .group("glow", "基坛灯环", "#8fe4ff", { emissive: "#4fd0ff", emissiveIntensity: 1, roughness: .4 }).group("step", "入口台阶", "#8d9a9c", { roughness: .95 }).group("rail", "入口扶手", "#6c8389", { roughness: .6, metalness: .3 });
  let any = false;
  for (const base of bases) {
    const r = base.scale.x / 2, top = base.position.y + base.scale.y / 2;
    b.xring("glow", WORLD, [base.position.x, top + .02, base.position.z], r - .05, .045, "y", 30);
    for (let k = 0; k < 9; k++) {
      const a = Math.PI * 2 * k / 9 + .3, out: P = [Math.cos(a) * .5, .85, Math.sin(a) * .5], h = 1.2 + (k % 3) * .5;
      b.shard(k % 2 ? "shard" : "shardB", [base.position.x + Math.cos(a) * (r + .15), top - .05, base.position.z + Math.sin(a) * (r + .15)], out, .2 + (k % 2) * .06, h);
    }
    any = true;
  }
  for (const bridge of parts.filter(value => value.shape === "box" && /晶体议厅入口桥/.test(value.name))) {
    const front = bridge.position.z + bridge.scale.z / 2, top = bridge.position.y + bridge.scale.y / 2, w = bridge.scale.x;
    const steps = Math.max(2, Math.min(6, Math.ceil(top / .16)));
    for (let k = 0; k < steps; k++) { const h = top * (steps - k) / steps; b.box("step", bridge.position.x, h / 2, front + .15 + k * .26, w, h, .26); }
    for (const s of [-1, 1]) b.box("rail", bridge.position.x + s * (w / 2 - .04), top + .5, bridge.position.z, .06, 1.0, bridge.scale.z);
    any = true;
  }
  return any ? b.parts() : [];
}
