import type { ModelPart } from "../assetModelParts";
import type { AssetTheme } from "../sceneDocument";
import type { P } from "./ruinKit";
import { DEG, SLAB, WB, WT, buildBudget, getDetail, type Op } from "./whitebox";
import { design, type ArchitecturePrototype } from "./structures";

// 建筑白模·古风内景套件（在白模套件 WB 上扩展）：棂花窗、纱幔、罗汉床、拔步床、架子床、妆台和铜镜、香几和香炉、博古架、屏风、宫灯、案几桌椅、书画、花瓶……
// 做的是拍古风剧（宫廷、深宅、江湖、市井）用的室内：房间比真实房间放大（净高 3.9–6.6m，留出机位和打光空间），门窗和家具按真实尺寸，每种房间出三个版本（四壁封顶、三壁封顶前侧敞开、三壁敞顶前侧敞开）。
// 家具按「局部坐标」摆：Q() 的 (u,v) 是以 (x,z) 为原点、绕竖轴偏航 yaw 之后的局部偏移，正面朝 +v（yaw 0 朝 +z，90 朝 +x，180 朝 -z，270 朝 -x）。
export class GB extends WB {
  readonly fl = SLAB;
  /** 陈设整体抬高 up（摆在台座、戏台上时设置，用完记得改回 0）。 */
  up = 0;
  constructor() {
    super();
    this.group("wood", "木器", "#6a3a22", { roughness: .5 }).group("lac", "漆器", "#8e2a1f", { roughness: .35 }).group("silk", "锦缎", "#d9bd74", { roughness: .7 }).group("cush", "软垫", "#a8362c", { roughness: .85 })
      .group("sheer", "纱幔", "#f4ead0", { roughness: .95, opacity: .62 }).group("drape", "帷帐", "#d8a85c", { roughness: .9, opacity: .8 })
      .group("brass", "铜器", "#b08a3e", { roughness: .4, metalness: .35 }).group("mirror", "铜镜", "#d8e0e2", { roughness: .1, metalness: .25, emissive: "#9ab0ba", emissiveIntensity: .3 }).group("gold", "金饰", "#d2a63a", { roughness: .4, metalness: .5 })
      .group("jade", "玉器", "#e4eee0", { roughness: .25 }).group("porc", "瓷器", "#ece9df", { roughness: .3 }).group("blue", "青花", "#2f5a9e", { roughness: .3 })
      .group("paper", "窗纸", "#f6ecc8", { roughness: .9, opacity: .45, emissive: "#ffe3a0", emissiveIntensity: .35 })
      .group("art", "书画", "#d9c79a", { roughness: .9 }).group("ink", "墨彩", "#3b4a3a", { roughness: .9 })
      .group("lamp", "宫灯", "#e0902f", { roughness: .5, opacity: .9, emissive: "#ff9a3c", emissiveIntensity: 1.1 })
      .group("smoke", "烟气", "#f1f1ee", { roughness: 1, opacity: .35 }).group("leaf", "枝叶", "#587a3c", { roughness: .9 }).group("bloom", "花朵", "#e6c23c", { roughness: .8 })
      .group("rug", "地毯", "#8e2f2a", { roughness: 1 }).group("tile", "地砖缝", "#4a3d30", { roughness: .9 })
      .group("water", "水面", "#bfe0e6", { roughness: .1, opacity: .75 }).group("pi", "皮毛", "#c98a2f", { roughness: .95 }).group("clay", "陶器", "#8a5a3a", { roughness: .85 }).group("buddha", "佛身", "#d6a736", { roughness: .4, metalness: .45 })
      .group("c1", "绸红", "#b8332f", { roughness: .8 }).group("c2", "绸蓝", "#2f5a9e", { roughness: .8 }).group("c3", "绸绿", "#3f7a52", { roughness: .8 }).group("c4", "绸黄", "#d8aa38", { roughness: .8 }).group("c5", "绸紫", "#7a4a8a", { roughness: .8 });
  }
  /** 世界对齐体量：中心 (x,z)、底标高 y0（相对地面）、尺寸 sx×sy×sz。 */
  K(key: string, x: number, z: number, y0: number, sx: number, sy: number, sz: number) { this.box(key, x, this.fl + this.up + y0 + sy / 2, z, sx, sy, sz); }
  /** 局部体量：以 (x,z) 为原点绕竖轴偏航 yaw，(u,v) 是局部偏移，正面朝 +v。 */
  Q(key: string, x: number, z: number, yaw: number, u: number, v: number, y0: number, sx: number, sy: number, sz: number) { const c = Math.cos(yaw * DEG), s = Math.sin(yaw * DEG); this.boxYaw(key, x + u * c + v * s, this.fl + this.up + y0 + sy / 2, z - u * s + v * c, sx, sy, sz, yaw); }
  /** 竖直圆柱：底标高 y0（相对地面）、高 h、半径 r。 */
  Cy(key: string, x: number, z: number, y0: number, h: number, r: number, n = 10) { this.cyl(key, x, z, this.fl + this.up + y0, this.fl + this.up + y0 + h, r, n); }
  Ball(key: string, x: number, y: number, z: number, r: number) { this.sphere(key, [x, this.fl + this.up + y, z], r); }
  /** 局部 (u,v) 换成世界 (x,z)。 */
  W2(x: number, z: number, yaw: number, u: number, v: number): [number, number] { const c = Math.cos(yaw * DEG), s = Math.sin(yaw * DEG); return [x + u * c + v * s, z - u * s + v * c]; }
  /** 竖直圆盘（铜镜、镜框）：中心 (x,y,z)，半径 r，朝向 yaw，向后仰 tilt°。 */
  disc(key: string, x: number, y: number, z: number, r: number, yaw: number, tilt: number, n = 16) {
    const cy = Math.cos(yaw * DEG), sy = Math.sin(yaw * DEG), ct = Math.cos(tilt * DEG), st = Math.sin(tilt * DEG), cen: P = [x, this.fl + this.up + y, z], hint: P = [ct * sy, st, ct * cy];
    const pt = (a: number): P => { const lx = r * Math.cos(a), ly = r * Math.sin(a), tz = -ly * st; return [x + lx * cy + tz * sy, this.fl + this.up + y + ly * ct, z - lx * sy + tz * cy]; };
    for (let i = 0; i < n; i++) { const a0 = i / n * Math.PI * 2, a1 = (i + 1) / n * Math.PI * 2; this.tri3(key, cen, pt(a0), pt(a1), hint); }
  }

  // ---------- 墙面：棂花窗、裙板 ----------
  /** 棂花窗（装进墙洞）：沿 x 的墙在 z=fixed、沿 z 的墙在 x=fixed；a0..a1 是洞口范围，yb..yt 是洞口绝对标高，leaves 扇；外框和扇间立梃是木器，每扇内排方格棂条，后面一片窗纸。 */
  lattice(axis: "x" | "z", fixed: number, a0: number, a1: number, yb: number, yt: number, leaves: number, gap = .24) {
    const W = a1 - a0, H = yt - yb, fw = .07, d = .06, lod = getDetail(), m = (a0 + a1) / 2, ym = (yb + yt) / 2;
    const B = (key: string, a: number, y: number, sa: number, sy: number, sd: number) => axis === "x" ? this.box(key, a, y, fixed, sa, sy, sd) : this.box(key, fixed, y, a, sd, sy, sa);
    B("wood", m, yb + fw / 2, W, fw, d); B("wood", m, yt - fw / 2, W, fw, d); B("wood", m, yt - .5, W, .05, d);
    for (let i = 0; i <= leaves; i++) B("wood", a0 + W * i / leaves, ym, i === 0 || i === leaves ? fw : fw * 1.3, H, d);
    B("paper", m, ym, W - .02, H - .02, .012);
    if (lod >= 3) {
      const rows = Math.max(2, Math.round((H - .5) / gap)), cols = Math.max(1, Math.round(W / leaves / gap));
      for (let j = 1; j < rows; j++) B("wood", m, yb + (H - .5) * j / rows, W, .022, .04);
      for (let i = 0; i < leaves; i++) for (let j = 1; j < cols; j++) B("wood", a0 + W * (i + j / cols) / leaves, yb + (H - .5) / 2, .022, H - .5, .04);
      const tc = Math.max(2, Math.round(W / .35)); for (let j = 1; j < tc; j++) B("wood", a0 + W * j / tc, yt - .25, .022, .4, .04);
    }
  }
  /** 裙板：墙内侧一圈木裙，h 高、顶压一道金边；ops 的洞口断开，窗台以下仍有裙板。 */
  wains(axis: "x" | "z", fixed: number, from: number, to: number, side: 1 | -1, ops: Op[], h = .85) {
    const f = fixed + side * (WT / 2 + .02);
    const put = (a: number, e: number, hh: number) => { if (e - a < .05 || hh < .1) return; const m = (a + e) / 2; if (axis === "x") { this.box("wood", m, this.fl + hh / 2, f, e - a, hh, .04); this.box("gold", m, this.fl + hh + .02, f, e - a, .04, .06); } else { this.box("wood", f, this.fl + hh / 2, m, .04, hh, e - a); this.box("gold", f, this.fl + hh + .02, m, .06, .04, e - a); } };
    let cur = from;
    for (const o of [...ops].sort((p, q) => p.c - q.c)) { const a = Math.max(from, o.c - o.w / 2), e = Math.min(to, o.c + o.w / 2); if (e <= a) continue; put(cur, a, h); if (o.sill > .1) put(a, e, Math.min(h, o.sill - .04)); cur = Math.max(cur, e); }
    put(cur, to, h);
  }
  /** 古风天花：板、沿 z 的大梁（带金边）、沿 x 的次梁和井口格线；yb 是天花底面绝对标高。 */
  caisson(W: number, D: number, yb: number) {
    const ox = W / 2 + WT, oz = D / 2 + WT, nb = Math.max(2, Math.round(D / 3)), nc = Math.max(2, Math.round(W / 4));
    this.ceiling(-ox, -oz, ox, oz, yb, .1);
    for (let i = 1; i < nb; i++) { const z = -D / 2 + D * i / nb; this.beamH("x", z, -W / 2, W / 2, yb, .32, .44); this.box("gold", 0, yb - .46, z, W, .04, .36); }
    for (let i = 1; i < nc; i++) this.beamH("z", -W / 2 + W * i / nc, -D / 2, D / 2, yb - .14, .2, .3);
    if (getDetail() >= 3) { for (let x = -W / 2 + 1.5; x < W / 2 - .6; x += 1.5) this.box("trim", x, yb - .04, 0, .05, .05, D); for (let z = -D / 2 + 1.5; z < D / 2 - .6; z += 1.5) this.box("trim", 0, yb - .04, z, W, .05, .05); }
  }
  /** 地砖缝：每 gap 一道。 */
  tiles(W: number, D: number, gap = 1.2) { if (getDetail() < 2) return; for (let x = -W / 2 + gap; x < W / 2 - .1; x += gap) this.K("tile", x, 0, 0, .03, .012, D); for (let z = -D / 2 + gap; z < D / 2 - .1; z += gap) this.K("tile", 0, z, 0, W, .012, .03); }
  /** 红柱：圆柱、石础、柱头小枋。 */
  pillar(x: number, z: number, h: number, r = .22) { this.Cy("lac", x, z, 0, h, r, 12); this.Cy("trim", x, z, 0, .2, r * 1.35, 12); this.K("gold", x, z, h - .35, r * 2.7, .1, r * 2.7); this.K("wood", x, z, h - .25, r * 3.2, .25, r * 3.2); }

  // ---------- 软装：纱幔、地毯、字画 ----------
  /** 纱幔一幅：锚点 (x0,z)，朝 side（±1）展开宽 pw，从 top 垂到地，在 tie 高度束起（腰部收窄、下摆外扩）。 */
  drape(x0: number, z: number, side: 1 | -1, pw: number, top: number, key: "sheer" | "drape" = "sheer", tie = 1.25) {
    const n = Math.max(4, Math.round(pw / .24)), sw = pw / n * 1.5;
    for (let i = 0; i < n; i++) {
      const t = (i + .5) / n, ph = i * 1.7;
      this.K(key, x0 + side * t * pw, z + Math.sin(ph) * .05, tie + .2, sw, top - tie - .2, .02);
      this.K(key, x0 + side * (t * pw * .3 + pw * .05), z + .09 + Math.sin(ph + 1) * .03, tie - .12, sw * .7, .32, .03);
      this.K(key, x0 + side * (t * pw * 1.12), z + .03 + Math.sin(ph + 2) * .09, 0, sw * 1.1, tie - .12, .02);
    }
    this.K("gold", x0 + side * pw * .2, z + .12, tie - .03, pw * .45, .05, .05); this.K("gold", x0 + side * pw * .5, z, top - .02, pw + .1, .06, .06);
  }
  /** 短幔：从天花垂下的一排纱幔（宽 w、垂落 drop），中心 (x,z)，沿 x 排开。 */
  valance(x: number, z: number, w: number, top: number, drop = .9, key: "sheer" | "drape" = "drape") {
    const n = Math.max(3, Math.round(w / .3));
    for (let i = 0; i < n; i++) this.K(key, x - w / 2 + (i + .5) * w / n, z + Math.sin(i * 1.7) * .06, top - drop, w / n * 1.4, drop, .025);
    this.K("gold", x, z, top - .03, w + .1, .06, .06);
  }
  /** 地毯：红底金边。 */
  carpet(x: number, z: number, w: number, d: number, yaw = 0) {
    this.Q("rug", x, z, yaw, 0, 0, 0, w, .025, d);
    for (const s of [-1, 1]) { this.Q("gold", x, z, yaw, s * (w / 2 - .12), 0, .02, .07, .012, d - .2); this.Q("gold", x, z, yaw, 0, s * (d / 2 - .12), .02, w - .2, .012, .07); }
  }
  /** 挂轴：贴墙悬挂，(x,z) 是墙面位置，yaw 是朝向（正面朝 +v），y0 是下沿标高。 */
  scroll(x: number, z: number, yaw: number, y0: number, w = .7, h = 1.5) {
    const q = (key: string, u: number, v: number, yy: number, sx: number, sy: number, sz: number) => this.Q(key, x, z, yaw, u, v, yy, sx, sy, sz);
    q("silk", 0, .012, y0, w + .14, h + .16, .014); q("art", 0, .024, y0 + .08, w, h, .012); q("wood", 0, .035, y0 - .01, w + .2, .04, .04); q("wood", 0, .035, y0 + h + .15, w + .2, .04, .04);
    if (getDetail() >= 3) { q("ink", -w * .15, .032, y0 + h * .3, w * .1, h * .5, .008); q("leaf", w * .12, .032, y0 + h * .45, w * .32, h * .3, .008); q("bloom", w * .18, .034, y0 + h * .7, w * .08, h * .08, .008); }
  }
  /** 匾额：黑底金字的横匾。 */
  plaque(x: number, z: number, yaw: number, y0: number, w = 1.6, h = .5) { this.Q("lac", x, z, yaw, 0, .02, y0, w, h, .05); this.Q("gold", x, z, yaw, 0, .05, y0 + .05, w - .16, h - .1, .012); this.Q("ink", x, z, yaw, 0, .058, y0 + .12, w * .6, h * .3, .008); }

  // ---------- 灯具 ----------
  /** 吊宫灯：底标高 y，吊绳到 ceil（相对地面的天花高度）。 */
  gongdeng(x: number, z: number, y: number, ceil: number) {
    this.Cy("lamp", x, z, y, .42, .2, 6); this.Cy("gold", x, z, y - .03, .03, .13, 6); this.Cy("gold", x, z, y + .42, .05, .24, 6); this.Ball("gold", x, y + .52, z, .04);
    this.K("wood", x, z, y + .5, .02, Math.max(.1, ceil - y - .5), .02); this.K("lac", x, z, y - .36, .03, .33, .03); this.Ball("lac", x, y - .38, z, .045);
  }
  /** 落地宫灯：灯杆加宫灯。 */
  luodideng(x: number, z: number, h = 1.35) { this.Cy("wood", x, z, 0, .06, .17, 8); this.Cy("wood", x, z, .06, h, .025, 6); this.Cy("lamp", x, z, h, .44, .21, 6); this.Cy("gold", x, z, h + .44, .05, .25, 6); this.Cy("gold", x, z, h - .03, .03, .14, 6); this.K("lac", x, z, h - .33, .03, .3, .03); }
  /** 烛台：高 .35 的铜烛台加一支红烛，火苗是发光球。 */
  zhutai(x: number, y0: number, z: number) { this.Cy("brass", x, z, y0, .04, .07, 8); this.Cy("brass", x, z, y0 + .04, .22, .015, 6); this.Cy("brass", x, z, y0 + .26, .03, .045, 8); this.Cy("lac", x, z, y0 + .29, .14, .022, 6); this.Ball("lamp", x, y0 + .46, z, .03); }

  // ---------- 家具 ----------
  /** 罗汉床（榻）：三面围子，锦缎坐垫，两个靠枕，中间一张炕几和茶具。 */
  luohan(x: number, z: number, yaw: number, w = 2, d = 1) {
    const q = (key: string, u: number, v: number, y0: number, sx: number, sy: number, sz: number) => this.Q(key, x, z, yaw, u, v, y0, sx, sy, sz);
    for (const a of [-1, 1]) for (const b of [-1, 1]) q("wood", a * (w / 2 - .07), b * (d / 2 - .07), 0, .1, .32, .1);
    q("wood", 0, 0, .28, w - .1, .13, d - .1); q("wood", 0, 0, .41, w + .04, .06, d + .04); q("silk", 0, .02, .47, w - .26, .07, d - .2);
    q("wood", 0, -d / 2 + .04, .47, w, .5, .07); q("gold", 0, -d / 2 + .08, .86, w - .3, .06, .015);
    for (const s of [-1, 1]) { q("wood", s * (w / 2 - .035), 0, .47, .07, .34, d); q("cush", s * (w / 2 - .4), -d / 2 + .32, .54, .36, .3, .3); }
    q("wood", 0, .02, .54, .76, .22, .44); q("lac", 0, .02, .76, .8, .03, .48);
    const [px, pz] = this.W2(x, z, yaw, 0, .02); this.Cy("porc", px, pz, .79, .1, .06, 8); this.Cy("blue", px + .16, pz, .79, .05, .035, 8); this.Cy("blue", px - .16, pz, .79, .05, .035, 8);
  }
  /** 拔步床：踏步、围板、四柱、顶板和挂落，两侧帷帐束起，床内锦褥和枕；w 宽（局部 x）、d 总深（含前廊）。 */
  babuchuang(x: number, z: number, yaw: number, w = 2.4, d = 3.2) {
    const q = (key: string, u: number, v: number, y0: number, sx: number, sy: number, sz: number) => this.Q(key, x, z, yaw, u, v, y0, sx, sy, sz), bd = d - 1.1, vb = -d / 2 + bd, lod = getDetail();
    q("wood", 0, 0, 0, w, .24, d); q("wood", 0, d / 2 + .14, 0, 1.4, .12, .28);
    for (const a of [-1, 1]) for (const v of [-d / 2 + .05, vb, d / 2 - .05]) q("wood", a * (w / 2 - .05), v, .24, .09, 2.2, .09);
    q("wood", 0, 0, 2.44, w, .1, d); q("wood", 0, d / 2 - .02, 2.18, w, .26, .05); q("wood", 0, vb, 2.18, w, .26, .05); q("gold", 0, d / 2 - .02, 2.14, w - .1, .03, .05);
    q("wood", 0, -d / 2 + .04, .24, w - .1, 1.5, .05); for (const a of [-1, 1]) q("wood", a * (w / 2 - .04), -d / 2 + bd / 2, .24, .05, 1.3, bd);
    if (lod >= 3) for (let i = 0; i < 12; i++) { const u = -w / 2 + .2 + i * (w - .4) / 11; q("wood", u, d / 2 - .02, 1.88, .03, .3, .03); q("wood", u, vb, 1.88, .03, .3, .03); }
    q("silk", 0, -d / 2 + bd / 2, .24, w - .3, .13, bd - .2); q("cush", 0, -d / 2 + .5, .37, w - .5, .06, .5); q("cush", 0, -d / 2 + .3, .4, w * .6, .16, .28); q("silk", 0, -d / 2 + bd * .68, .37, w - .35, .07, bd * .5);
    for (const a of [-1, 1] as (1 | -1)[]) { const [cx, cz] = this.W2(x, z, yaw, a * (w / 2 - .12), vb); this.dropCurtain(cx, cz, yaw, a, 1.1, 2.18, "drape"); }
    q("wood", w * .22, d / 2 - .45, .24, .5, .3, .38); q("wood", -w * .2, d / 2 - .45, .24, .4, .2, .3);
  }
  /** 床帐一幅：沿局部 x 方向束在 side 一侧，宽 pw，从 top 垂到地面（腰部在 1.1m 收起）。 */
  dropCurtain(x: number, z: number, yaw: number, side: 1 | -1, pw: number, top: number, key: "sheer" | "drape" = "drape") {
    const n = 4, sw = pw / n * 1.4;
    for (let i = 0; i < n; i++) { const t = (i + .5) / n; this.Q(key, x, z, yaw, -side * (t * pw * .8 + .02), Math.sin(i * 1.4) * .035 + .02, 1.2, sw, top - 1.2, .02); this.Q(key, x, z, yaw, -side * (t * pw * .35 + .03), .04, .9, sw * .7, .32, .03); this.Q(key, x, z, yaw, -side * (t * pw * .95), Math.sin(i * 1.4 + 2) * .06 + .03, 0, sw * 1.1, .95, .02); }
    this.Q("gold", x, z, yaw, -side * pw * .18, .06, 1.0, pw * .4, .05, .05);
  }
  /** 架子床：四柱、顶架、三面矮围栏、两侧帐幔束起。 */
  jiazichuang(x: number, z: number, yaw: number, w = 2, d = 2.3) {
    const q = (key: string, u: number, v: number, y0: number, sx: number, sy: number, sz: number) => this.Q(key, x, z, yaw, u, v, y0, sx, sy, sz), lod = getDetail();
    q("wood", 0, 0, 0, w, .38, d); q("silk", 0, .03, .38, w - .1, .13, d - .12); q("cush", 0, -d / 2 + .3, .5, w * .6, .17, .3); q("cush", 0, .1, .5, w - .3, .07, d * .5);
    for (const a of [-1, 1]) for (const b of [-1, 1]) q("wood", a * (w / 2 - .04), b * (d / 2 - .04), .38, .08, 1.95, .08);
    q("wood", 0, 0, 2.3, w, .1, d); q("gold", 0, d / 2 - .02, 2.24, w - .1, .04, .05); q("wood", 0, d / 2 - .02, 2.0, w, .24, .04);
    q("wood", 0, -d / 2 + .03, .51, w - .1, .8, .04); for (const a of [-1, 1]) q("wood", a * (w / 2 - .03), 0, .51, .04, .6, d - .1);
    if (lod >= 3) for (let i = 0; i < 9; i++) q("wood", -w / 2 + .15 + i * (w - .3) / 8, d / 2 - .02, 1.76, .03, .26, .03);
    for (const a of [-1, 1] as (1 | -1)[]) { const [cx, cz] = this.W2(x, z, yaw, a * (w / 2 - .08), d / 2 - .06); this.dropCurtain(cx, cz, yaw, a, .9, 2.0, "drape"); }
  }
  /** 梳妆台：台面、抽屉、镜架和铜镜（半径 .3 的圆镜），台面摆首饰盒、玉碗和簪钗。 */
  shuzhuang(x: number, z: number, yaw: number, w = 1.2, d = .55) {
    const q = (key: string, u: number, v: number, y0: number, sx: number, sy: number, sz: number) => this.Q(key, x, z, yaw, u, v, y0, sx, sy, sz), [mx, mz] = this.W2(x, z, yaw, 0, -d * .2);
    q("wood", 0, 0, .74, w, .05, d); for (const a of [-1, 1]) { q("wood", a * (w / 2 - .22), 0, .1, .4, .64, d - .06); q("gold", a * (w / 2 - .22), d / 2 - .02, .5, .22, .025, .012); q("gold", a * (w / 2 - .22), d / 2 - .02, .28, .22, .025, .012); q("wood", a * (w / 2 - .04), 0, 0, .06, .76, d - .06); }
    q("wood", 0, -d / 2 + .04, .1, w - .5, .6, .03);
    q("wood", 0, -d * .2, .79, .46, .05, .26); for (const a of [-1, 1]) q("wood", a * .27, -d * .2, .8, .045, .72, .045);
    this.disc("wood", mx, 1.55, mz, .38, yaw, 8); this.disc("mirror", mx + Math.sin(yaw * DEG) * .02, 1.55, mz + Math.cos(yaw * DEG) * .02, .33, yaw, 8);
    q("lac", w * .28, d * .1, .79, .3, .1, .2); q("gold", w * .28, d * .1, .89, .3, .025, .2); this.Cy("jade", ...this.W2(x, z, yaw, -w * .3, d * .12), .79, .06, .13, 10); q("gold", 0, d * .22, .79, .3, .01, .02); q("brass", -.05, d * .1, .79, .12, .06, .09);
  }
  /** 立式大圆镜：双立柱、底座和铜镜，半径 r。 */
  yuanjing(x: number, z: number, yaw: number, r = .5) {
    const q = (key: string, u: number, v: number, y0: number, sx: number, sy: number, sz: number) => this.Q(key, x, z, yaw, u, v, y0, sx, sy, sz);
    for (const a of [-1, 1]) { q("wood", a * (r + .08), 0, 0, .07, 1.2 + r, .07); q("wood", a * (r + .08), 0, 0, .1, .08, .55); }
    q("wood", 0, 0, .12, r * 2 + .3, .05, .06);
    const [mx, mz] = this.W2(x, z, yaw, 0, -.04); this.disc("wood", mx, 1.2 + r * .55, mz, r + .06, yaw, 6, 20); this.disc("mirror", mx + Math.sin(yaw * DEG) * .02, 1.2 + r * .55, mz + Math.cos(yaw * DEG) * .02, r, yaw, 6, 20);
  }
  /** 香几和铜香炉，炉口升起一缕烟（几个半透明球）。 */
  xiangji(x: number, z: number, h = .85) {
    this.Cy("wood", x, z, h - .05, .05, .24, 12); this.Cy("wood", x, z, 0, .05, .2, 12); for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + Math.PI / 4; this.Cy("wood", x + Math.cos(a) * .15, z + Math.sin(a) * .15, .05, h - .1, .025, 6); }
    this.Cy("brass", x, z, h, .13, .11, 10); this.Cy("brass", x, z, h + .13, .06, .15, 10); this.Cy("brass", x, z, h + .19, .06, .1, 10); this.Ball("brass", x, h + .28, z, .035);
    for (const s of [-1, 1]) this.K("brass", x + s * .16, z, h + .12, .035, .06, .035);
    if (getDetail() >= 3) for (let i = 0; i < 6; i++) this.Ball("smoke", x + Math.sin(i * 1.3) * .05, h + .42 + i * .17, z + Math.cos(i * 1.1) * .04, .022 + i * .012);
  }
  /** 博古架：外框、竖隔板、错落的横板，格子里摆瓶、玉碗、铜鼎和书册。 */
  bogu(x: number, z: number, yaw: number, w: number, h: number, d = .42) {
    const q = (key: string, u: number, v: number, y0: number, sx: number, sy: number, sz: number) => this.Q(key, x, z, yaw, u, v, y0, sx, sy, sz), cols = Math.max(2, Math.round(w / .62)), rows = Math.max(3, Math.round(h / .5)), cw = w / cols, lod = getDetail();
    q("wood", -w / 2 + .03, 0, 0, .06, h, d); q("wood", w / 2 - .03, 0, 0, .06, h, d); q("wood", 0, 0, h - .04, w, .08, d); q("wood", 0, 0, 0, w, .14, d); q("wood", 0, -d / 2 + .01, 0, w, h, .02);
    for (let i = 1; i < cols; i++) q("wood", -w / 2 + cw * i, 0, .14, .035, h - .18, d - .04);
    const sy = (i: number, j: number) => j === 0 ? .14 : j >= rows ? h - .04 : .14 + (h - .18) * (j + (((i + j) % 2) * .34 - .17)) / rows;
    for (let i = 0; i < cols; i++) for (let j = 1; j < rows; j++) q("wood", -w / 2 + cw * (i + .5), 0, sy(i, j), cw - .02, .03, d - .04);
    if (lod >= 3) for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
      const t = (i * 3 + j * 2) % 5, y0 = sy(i, j) + .03, hh = Math.min(.34, sy(i, j + 1) - y0 - .06); if (t === 4 || hh < .12) continue;
      const [px, pz] = this.W2(x, z, yaw, -w / 2 + cw * (i + .5), 0);
      if (t === 0) { this.Cy("blue", px, pz, y0, hh * .7, .055, 8); this.Cy("porc", px, pz, y0 + hh * .7, hh * .3, .03, 8); } else if (t === 1) { this.Cy("jade", px, pz, y0, .07, .11, 10); } else if (t === 2) { this.Cy("brass", px, pz, y0, hh * .6, .08, 8); this.K("brass", px + .09, pz, y0 + hh * .4, .03, .06, .03); } else { this.Q("art", px, pz, yaw, 0, 0, y0, .26, .05, .18); this.Q("ink", px, pz, yaw, 0, 0, y0 + .05, .22, .05, .15); }
    }
  }
  /** 屏风：n 扇折屏，每扇宽 pw、高 h，扇扇错开 ±13° 站稳，屏心是书画。 */
  pingfeng(x: number, z: number, yaw: number, n = 4, pw = .62, h = 1.9) {
    for (let i = 0; i < n; i++) {
      const u = (i - (n - 1) / 2) * pw * .93, v = i % 2 ? .07 : -.07, yw = yaw + (i % 2 ? 13 : -13), [px, pz] = this.W2(x, z, yaw, u, v), sy = Math.sin(yw * DEG), cy = Math.cos(yw * DEG);
      this.boxYaw("wood", px, this.fl + h / 2 + .06, pz, pw, h, .05, yw); this.boxYaw("art", px + sy * .03, this.fl + h / 2 + .06, pz + cy * .03, pw - .12, h - .2, .02, yw); this.boxYaw("wood", px, this.fl + .03, pz, pw * .5, .06, .22, yw);
      if (getDetail() >= 3) { this.boxYaw(i % 2 ? "leaf" : "ink", px + sy * .042, this.fl + h * .5, pz + cy * .042, pw * .4, h * .35, .008, yw); this.boxYaw("bloom", px + sy * .044, this.fl + h * .72, pz + cy * .044, pw * .1, h * .06, .008, yw); }
    }
  }
  /** 官帽椅 / 圈椅 / 太师椅：w 宽，靠背和扶手随椅型。 */
  yi(x: number, z: number, yaw: number, w = .6, kind: "guanmao" | "quan" | "taishi" = "guanmao") {
    const q = (key: string, u: number, v: number, y0: number, sx: number, sy: number, sz: number) => this.Q(key, x, z, yaw, u, v, y0, sx, sy, sz), d = w * .85;
    for (const a of [-1, 1]) for (const b of [-1, 1]) q("wood", a * (w / 2 - .04), b * (d / 2 - .04), 0, .05, .46, .05);
    q("wood", 0, 0, .46, w, .05, d); q("cush", 0, .01, .51, w - .1, .04, d - .1);
    q("wood", 0, -d / 2 + .03, .51, w - .06, kind === "taishi" ? .62 : .5, .05); if (kind === "taishi") q("lac", 0, -d / 2 + .06, .75, w * .5, .3, .012);
    for (const a of [-1, 1]) { q("wood", a * (w / 2 - .02), 0, .51, .04, .04, d - .04); q("wood", a * (w / 2 - .02), d / 2 - .06, .51, .04, .2, .04); q("wood", a * (w / 2 - .02), -d / 2 + .04, .51, .04, .22, .04); }
    q("wood", 0, -d / 2 + .03, 1.0 + (kind === "taishi" ? .13 : 0), w + .06, .05, .07);
  }
  /** 绣墩（鼓凳）。 */
  dun(x: number, z: number, r = .17) { this.Cy("wood", x, z, 0, .44, r, 8); this.Cy("cush", x, z, .44, .05, r - .01, 8); this.Cy("gold", x, z, .2, .02, r + .01, 8); }
  /** 方桌 / 条案：w×d，高 h，条案两端翘头。 */
  zhuo(x: number, z: number, yaw: number, w = .95, d = .95, h = .84, kind: "fang" | "an" = "fang") {
    const q = (key: string, u: number, v: number, y0: number, sx: number, sy: number, sz: number) => this.Q(key, x, z, yaw, u, v, y0, sx, sy, sz);
    q("wood", 0, 0, h - .05, w, .05, d);
    if (kind === "an") { for (const s of [-1, 1]) { q("wood", s * (w / 2 - .1), 0, 0, .06, h - .05, d - .1); q("wood", s * (w / 2 - .01), 0, h, .05, .1, d); } q("wood", 0, 0, h - .22, w - .2, .15, .03); }
    else { for (const a of [-1, 1]) for (const b of [-1, 1]) q("wood", a * (w / 2 - .06), b * (d / 2 - .06), 0, .07, h - .05, .07); q("wood", 0, d / 2 - .06, h - .16, w - .2, .11, .03); q("wood", 0, -d / 2 + .06, h - .16, w - .2, .11, .03); }
  }
  /** 圆桌加 k 个绣墩。 */
  yuanzhuo(x: number, z: number, r = .62, k = 5, cloth = false) {
    this.Cy("wood", x, z, .72, .05, r, 16); this.Cy("wood", x, z, 0, .72, .09, 8); this.Cy("wood", x, z, 0, .05, .3, 10);
    if (cloth) this.Cy("silk", x, z, .77, .01, r * .8, 16);
    for (let i = 0; i < k; i++) { const a = i / k * Math.PI * 2 + .3; this.dun(x + Math.cos(a) * (r + .3), z + Math.sin(a) * (r + .3)); }
  }
  /** 书案：案面、两侧抽屉柜，案上笔架、砚台、纸、书册。 */
  shuan(x: number, z: number, yaw: number, w = 1.8, d = .8) {
    const q = (key: string, u: number, v: number, y0: number, sx: number, sy: number, sz: number) => this.Q(key, x, z, yaw, u, v, y0, sx, sy, sz);
    q("wood", 0, 0, .74, w, .06, d); for (const s of [-1, 1]) { q("wood", s * (w / 2 - .25), 0, 0, .45, .74, d - .06); q("gold", s * (w / 2 - .25), d / 2 - .02, .5, .2, .025, .012); q("gold", s * (w / 2 - .25), d / 2 - .02, .25, .2, .025, .012); }
    q("wood", 0, -d / 2 + .04, .3, w - .9, .44, .03);
    q("art", 0, .05, .8, .62, .012, .42); q("ink", -.55, .22, .8, .2, .045, .13); q("ink", .1, -.22, .8, .04, .15, .04); for (const t of [0, 1, 2]) q("brass", .1 + (t - 1) * .012, -.22, .94, .006, .12, .006);
    for (let i = 0; i < 4; i++) q(i % 2 ? "ink" : "cush", .55, -.2, .8 + i * .05, .26, .05, .19);
  }
  /** 琴案和古琴。 */
  qinan(x: number, z: number, yaw: number) { this.zhuo(x, z, yaw, .95, .42, .72, "an"); this.Q("lac", x, z, yaw, 0, 0, .72, 1.15, .05, .2); this.Q("gold", x, z, yaw, -.45, 0, .77, .1, .008, .12); }
  /** 花瓶：瓶身、瓶颈和一束开花的枝条；base 是瓶底标高。 */
  huaping(x: number, z: number, base: number, h = .4, flower = "bloom") {
    this.Cy("porc", x, z, base, .04, .07, 10); this.Ball("porc", x, base + h * .35, z, h * .26); this.Cy("porc", x, z, base + h * .5, h * .5, .045, 8);
    if (getDetail() >= 3) for (let i = 0; i < 5; i++) { const a = i * 1.26, tx = x + Math.cos(a) * .22, tz = z + Math.sin(a) * .22, ty = base + h + .45 + (i % 2) * .15; this.segment("leaf", [x, this.fl + base + h, z], [tx, this.fl + ty, tz], .02, .02); this.Ball(flower, tx, ty, tz, .06); this.Ball("leaf", tx + .05, ty - .08, tz, .04); }
  }
  /** 花几（高脚方几）加花瓶。 */
  huaji(x: number, z: number, h = .85) { this.Cy("wood", x, z, h - .05, .05, .22, 8); this.Cy("wood", x, z, 0, h - .05, .045, 6); this.Cy("wood", x, z, 0, .05, .2, 8); this.huaping(x, z, h, .42); }
  /** 箱笼 / 衣柜：宽 w 深 d 高 h，对开门加铜活。 */
  gui(x: number, z: number, yaw: number, w = 1.2, d = .55, h = 1.8) {
    const q = (key: string, u: number, v: number, y0: number, sx: number, sy: number, sz: number) => this.Q(key, x, z, yaw, u, v, y0, sx, sy, sz);
    q("wood", 0, 0, 0, w, h, d); q("lac", 0, d / 2 + .005, .1, w - .1, h - .2, .015); q("wood", 0, d / 2 + .02, .1, .03, h - .2, .02); for (const s of [-1, 1]) q("brass", s * .09, d / 2 + .03, h * .5, .05, .13, .02);
    q("wood", 0, 0, h, w + .06, .05, d + .06);
  }
  /** 衣架（搭一件长袍）。 */
  yijia(x: number, z: number, yaw: number, w = 1.2) {
    for (const s of [-1, 1]) { this.Q("wood", x, z, yaw, s * w / 2, 0, 0, .06, 1.7, .06); this.Q("wood", x, z, yaw, s * w / 2, 0, 0, .06, .06, .4); }
    this.Q("wood", x, z, yaw, 0, 0, 1.6, w + .3, .05, .05); this.Q("wood", x, z, yaw, 0, 0, .8, w, .04, .04);
    if (getDetail() >= 3) this.Q("drape", x, z, yaw, 0, .02, .55, w * .75, 1.1, .05);
  }
  /** 一排书架：宽 w 高 h，每层摆一排书脊。 */
  shujia(x: number, z: number, yaw: number, w = 2.4, h = 2.2, d = .38, kind: "book" | "bowl" = "book") {
    const q = (key: string, u: number, v: number, y0: number, sx: number, sy: number, sz: number) => this.Q(key, x, z, yaw, u, v, y0, sx, sy, sz), rows = Math.round(h / .42);
    q("wood", -w / 2 + .03, 0, 0, .06, h, d); q("wood", w / 2 - .03, 0, 0, .06, h, d); q("wood", 0, -d / 2 + .01, 0, w, h, .02); q("wood", 0, 0, h - .03, w, .06, d);
    for (let j = 0; j <= rows; j++) { const y = .04 + j * (h - .1) / rows; q("wood", 0, 0, y, w - .1, .03, d - .02); if (j < rows && kind === "bowl" && getDetail() >= 3) for (let i = 0; i < 5; i++) { const [px, pz] = this.W2(x, z, yaw, -w / 2 + .3 + i * (w - .6) / 4, 0); for (let t = 0; t < 3; t++) this.Cy(i % 2 ? "blue" : "porc", px, pz, y + .03 + t * .045, .045, .09, 8); } else if (j < rows && getDetail() >= 3) for (let i = 0; i < 6; i++) q((i + j) % 3 === 0 ? "cush" : (i + j) % 3 === 1 ? "art" : "ink", -w / 2 + .3 + i * (w - .6) / 5.2, 0, y + .03, (w - .6) / 6, (h - .1) / rows - .12, d - .12); }
  }
  /** 蒲团：圆形跪垫。 */
  putuan(x: number, z: number, r = .24) { this.Cy("cush", x, z, 0, .07, r, 10); this.Cy("gold", x, z, .05, .015, r + .005, 10); }
  /** 宝座：宽大的雕龙椅，高靠背带金边，两侧扶手，前面一个脚踏。 */
  baozuo(x: number, z: number, yaw: number, w = 1.5) {
    const q = (key: string, u: number, v: number, y0: number, sx: number, sy: number, sz: number) => this.Q(key, x, z, yaw, u, v, y0, sx, sy, sz), d = .95;
    for (const a of [-1, 1]) for (const b of [-1, 1]) q("lac", a * (w / 2 - .08), b * (d / 2 - .08), 0, .14, .5, .14);
    q("lac", 0, 0, .5, w, .12, d); q("silk", 0, .02, .62, w - .2, .08, d - .2);
    q("lac", 0, -d / 2 + .06, .62, w, 1.2, .12); q("gold", 0, -d / 2 + .13, .9, w - .35, .7, .02); q("lac", 0, -d / 2 + .06, 1.82, w + .3, .1, .16);
    for (const a of [-1, 1]) { q("lac", a * (w / 2 - .05), 0, .62, .1, .42, d - .1); q("gold", a * (w / 2 - .05), d / 2 - .08, 1.04, .13, .13, .13); }
    q("lac", 0, d / 2 + .4, 0, 1.1, .2, .5);
  }
  /** 宫扇（障扇）：长杆顶上一面大羽扇，扇面朝 +v 方向（yaw），带金边。 */
  gongshan(x: number, z: number, yaw: number, h = 2.2) { this.Cy("wood", x, z, 0, h, .03, 6); this.Cy("wood", x, z, 0, .06, .16, 8); this.disc("gold", x, h + .1, z, .5, yaw, 0, 18); this.disc("cush", x + Math.sin(yaw * DEG) * .015, h + .1, z + Math.cos(yaw * DEG) * .015, .43, yaw, 0, 18); }
  /** 大铜香炉：三足圆鼎，炉口升烟。 */
  dalu(x: number, z: number, r = .38) {
    for (let k = 0; k < 3; k++) { const a = k * Math.PI * 2 / 3 + .5; this.Cy("brass", x + Math.cos(a) * r * .6, z + Math.sin(a) * r * .6, 0, .3, .06, 6); }
    this.Cy("brass", x, z, .3, .5, r, 12); this.Cy("brass", x, z, .8, .08, r * 1.12, 12); for (const s of [-1, 1]) this.K("brass", x + s * (r + .06), z, .72, .06, .16, .06);
    if (getDetail() >= 3) for (let i = 0; i < 6; i++) this.Ball("smoke", x + Math.sin(i * 1.3) * .07, 1.15 + i * .22, z + Math.cos(i * 1.1) * .06, .035 + i * .014);
  }
  /** 佛像：莲座、坐身、头、肉髻和背光，s 是放大系数。 */
  foshang(x: number, z: number, yaw: number, s = 1) {
    this.Cy("buddha", x, z, 0, .16 * s, .55 * s, 12); this.Cy("lac", x, z, .16 * s, .22 * s, .45 * s, 12); this.Q("buddha", x, z, yaw, 0, 0, .38 * s, .78 * s, .8 * s, .5 * s); this.Q("buddha", x, z, yaw, 0, .14 * s, .6 * s, .95 * s, .22 * s, .55 * s);
    for (const a of [-1, 1]) this.Q("buddha", x, z, yaw, a * .52 * s, .06 * s, .42 * s, .18 * s, .6 * s, .3 * s); this.Q("buddha", x, z, yaw, 0, .3 * s, .62 * s, .34 * s, .12 * s, .2 * s);
    this.Ball("buddha", x, 1.32 * s, z, .2 * s); this.Ball("buddha", x, 1.54 * s, z, .08 * s); this.disc("gold", x - Math.sin(yaw * DEG) * .2 * s, 1.34 * s, z - Math.cos(yaw * DEG) * .2 * s, .55 * s, yaw, 0, 20);
  }
  /** 兵器架：两根立柱、横杆，插长枪、大刀和剑。 */
  bingjia(x: number, z: number, yaw: number, w = 2) {
    const q = (key: string, u: number, v: number, y0: number, sx: number, sy: number, sz: number) => this.Q(key, x, z, yaw, u, v, y0, sx, sy, sz);
    for (const a of [-1, 1]) { q("wood", a * w / 2, 0, 0, .08, 1.7, .08); q("wood", a * w / 2, 0, 0, .08, .08, .45); }
    q("wood", 0, 0, .5, w, .06, .08); q("wood", 0, 0, 1.4, w, .06, .08);
    for (let i = 0; i < 6; i++) { const u = -w / 2 + .2 + i * (w - .4) / 5, tall = i % 2 ? 2.3 : 2.0; q("wood", u, .04, .1, .035, tall - .1, .035); q("brass", u, .04, tall, .06, .22, .02); if (i % 3 === 1) q("lac", u, .04, tall - .5, .12, .06, .06); }
  }
  /** 酒坛。 */
  jiutan(x: number, z: number, r = .22) { this.Cy("clay", x, z, 0, r * 1.4, r, 8); this.Ball("clay", x, r * .8, z, r * 1.05); this.Cy("clay", x, z, r * 1.7, r * .4, r * .55, 8); this.Cy("lac", x, z, r * 2.05, r * .3, r * .62, 8); }
  /** 柜台：台面悬出、柜身带抽屉，h 高、w 宽、d 深。 */
  guitai(x: number, z: number, yaw: number, w = 4, d = .75, h = 1.1) {
    const q = (key: string, u: number, v: number, y0: number, sx: number, sy: number, sz: number) => this.Q(key, x, z, yaw, u, v, y0, sx, sy, sz);
    q("wood", 0, 0, 0, w, h - .06, d - .1); q("wood", 0, .02, h - .06, w + .1, .06, d + .1);
    for (let i = 0; i < Math.round(w / .8); i++) { q("lac", -w / 2 + .4 + i * .8, d / 2 - .03, .12, .7, h - .3, .02); q("gold", -w / 2 + .4 + i * .8, d / 2 - .02, h * .55, .08, .03, .02); }
  }
  /** 布匹货架：每格横放一匹匹彩布（红蓝绿黄紫）。 */
  bupijia(x: number, z: number, yaw: number, w = 3, h = 2.3, d = .5) {
    const q = (key: string, u: number, v: number, y0: number, sx: number, sy: number, sz: number) => this.Q(key, x, z, yaw, u, v, y0, sx, sy, sz), rows = Math.round(h / .46);
    q("wood", -w / 2 + .03, 0, 0, .06, h, d); q("wood", w / 2 - .03, 0, 0, .06, h, d); q("wood", 0, -d / 2 + .01, 0, w, h, .02);
    for (let j = 0; j <= rows; j++) { const y = .04 + j * (h - .08) / rows; q("wood", 0, 0, y, w - .1, .03, d - .02); if (j < rows) for (let i = 0; i < Math.round(w / .32); i++) q("c" + (1 + (i * 2 + j * 3) % 5), -w / 2 + .22 + i * .32, 0, y + .03, .28, (h - .08) / rows - .08, d - .08); }
  }
  /** 灵位牌：三层台阶上一排排牌位（红底金字），n 个一行。 */
  paiwei(x: number, z: number, yaw: number, w = 4, tiers = 3, n = 9) {
    for (let t = 0; t < tiers; t++) {
      this.Q("wood", x, z, yaw, 0, -t * .32, 0, w - t * .4, .4 + t * .4, .5);
      for (let i = 0; i < n - t; i++) { const u = (i - (n - t - 1) / 2) * (w - t * .4 - .4) / Math.max(1, n - t - 1); this.Q("lac", x, z, yaw, u, -t * .32 + .05, .4 + t * .4, .2, .5, .05); this.Q("gold", x, z, yaw, u, -t * .32 + .08, .4 + t * .4 + .14, .1, .22, .012); }
    }
  }
  /** 火盆：三足铜盆，盆里炭火发光。 */
  huopen(x: number, z: number, r = .35) { for (let k = 0; k < 3; k++) { const a = k * Math.PI * 2 / 3; this.Cy("brass", x + Math.cos(a) * r * .6, z + Math.sin(a) * r * .6, 0, .3, .05, 6); } this.Cy("brass", x, z, .3, .2, r, 10); this.Cy("lamp", x, z, .46, .06, r * .85, 10); }
  /** 戏台：台座、台口两根柱、后面一面屏风和两道门帘（出将入相）。 */
  xitai(x: number, z: number, w: number, d: number, h = 1.1) {
    this.K("wood", x, z, 0, w, h, d); this.K("gold", x, z + d / 2 - .02, h - .08, w, .08, .05);
    const n = Math.round(h / .15); for (const s of [-1, 1]) this.flight(x + s * (w / 2 - 2), z + d / 2 + n * .3, "-z", this.fl + this.up, n, 1.6, h / n, .3, "stair"); for (const s of [-1, 1]) this.Cy("lac", x + s * (w / 2 - .4), z + d / 2 - .4, h, 3.2, .2, 12);
    this.K("art", x, z - d / 2 + .12, h, w - 1.2, 2.6, .06); this.K("gold", x, z - d / 2 + .12, h + 2.6, w - 1.1, .12, .08);
    for (const s of [-1, 1]) { this.K("c1", x + s * (w / 2 - 1.1), z - d / 2 + .5, h, 1.0, 2.3, .04); this.K("gold", x + s * (w / 2 - 1.1), z - d / 2 + .5, h + 2.3, 1.1, .08, .06); }
  }
  /** 浴桶：箍铜圈的木桶，水面漂着花瓣。 */
  yutong(x: number, z: number) {
    this.Cy("wood", x, z, 0, .85, .62, 14); for (const y of [.25, .6]) this.Cy("brass", x, z, y, .03, .635, 14); this.Cy("brass", x, z, .83, .04, .65, 14); this.Cy("water", x, z, .74, .04, .56, 14);
    if (getDetail() >= 3) for (let i = 0; i < 10; i++) { const a = i * 2.4; this.Ball(i % 3 ? "bloom" : "cush", x + Math.cos(a) * (.08 + (i % 4) * .11), .8, z + Math.sin(a) * (.08 + (i % 3) * .13), .035); }
  }
  /** 灶台：砖砌灶身、两口黑铁锅、后面一根烟囱。 */
  zaotai(x: number, z: number, yaw: number) {
    const q = (key: string, u: number, v: number, y0: number, sx: number, sy: number, sz: number) => this.Q(key, x, z, yaw, u, v, y0, sx, sy, sz);
    q("clay", 0, 0, 0, 2.2, .85, 1.0); q("wood", 0, .1, .85, 2.0, .04, .7); q("clay", .75, -.35, .85, .5, 2.6, .45);
    for (const s of [-1, 1]) { const [px, pz] = this.W2(x, z, yaw, s * .5, .05); this.Cy("ink", px, pz, .89, .22, .34, 10); this.Cy("wood", px, pz, 1.1, .04, .36, 10); }
    q("brass", -.9, .52, .3, .2, .3, .04); q("lamp", -.9, .525, .1, .24, .12, .02);
  }
  /** 水缸：陶缸加木盖，缸口一只水瓢。 */
  gang(x: number, z: number, r = .45) { this.Cy("clay", x, z, 0, .95, r, 12); this.Cy("clay", x, z, .95, .06, r * 1.08, 12); this.Cy("wood", x, z, 1.01, .04, r * .95, 12); this.K("wood", x + r * .5, z, 1.05, .3, .03, .05); }
  /** 柴堆：几层横放的劈柴。 */
  chai(x: number, z: number, yaw: number, w = 1.4) { for (let j = 0; j < 5; j++) for (let i = 0; i < 6; i++) this.Q("wood", x, z, yaw, -w / 2 + .12 + i * (w - .24) / 5 + (j % 2) * .05, 0, .02 + j * .11, .1, .1, .5); }
  /** 蒸笼：叠起来的几层竹笼。 */
  zhenglong(x: number, y0: number, z: number, n = 3) { for (let i = 0; i < n; i++) { this.Cy("wood", x, z, y0 + i * .13, .12, .3, 12); this.Cy("clay", x, z, y0 + i * .13 + .1, .02, .32, 12); } this.Cy("wood", x, z, y0 + n * .13, .06, .26, 12); this.Ball("wood", x, y0 + n * .13 + .1, z, .03); }
  /** 百子柜（药柜）：满墙的小抽屉，每个带铜拉手。 */
  yaogui(x: number, z: number, yaw: number, w = 6, h = 2.7, d = .5) {
    const q = (key: string, u: number, v: number, y0: number, sx: number, sy: number, sz: number) => this.Q(key, x, z, yaw, u, v, y0, sx, sy, sz), cols = Math.max(2, Math.round(w / .5)), rows = Math.max(3, Math.round(h / .34)), cw = w / cols, rh = (h - .1) / rows;
    q("wood", 0, 0, 0, w, h, d - .04);
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) { const u = -w / 2 + cw * (i + .5); q("lac", u, d / 2 - .01, .05 + rh * j + .02, cw - .04, rh - .05, .03); if (getDetail() >= 3) q("gold", u, d / 2 + .01, .05 + rh * j + rh * .5, .07, .03, .015); }
  }
  /** 药碾：木槽加一个竖立的铁碾轮。 */
  yaonian(x: number, z: number) { this.K("wood", x, z, .78, .7, .1, .2); this.K("wood", x, z, .72, .5, .08, .14); this.disc("brass", x, .98, z, .17, 90, 0, 14); this.K("wood", x, z, .94, .04, .04, .24); }
}

/** 古风房间一面墙：ops 是门洞，lat 是棂花窗 [中心, 宽, 高, 窗台, 扇数]。 */
export type GWall = { ops?: Op[]; lat?: [number, number, number, number, number][]; wains?: boolean };
export type GRoom = { label: string; W: number; D: number; H: number; back: GWall; left: GWall; right: GWall; front: GWall; furn: (g: GB, W: number, D: number, H: number) => void; tags?: string[]; pillars?: [number, number][]; blurb: string };
const variants = ["四壁封顶", "三壁封顶·前侧敞开", "三壁敞顶·前侧敞开"] as const;
const hole = (c: number, w: number, h: number, sill: number): Op => ({ c, w, h, sill, glass: false });
const spec = "原点在平面中心，+z 为正面，楼板顶面标高 0.2；比真实房间放大，留出机位和打光空间";
const whiteGB = (name: string, purpose: string, theme: AssetTheme, build: (g: GB) => void, tags: string[]): ArchitecturePrototype => ({
  ...design(name, purpose, (): ModelPart[] => buildBudget(name, () => new GB(), build), "建筑", theme), raw: true, state: "原始", tags: ["白模", "预演", "建筑白模", ...tags],
});
/** 一种古风房间出三个版本：四壁封顶、三壁封顶前侧敞开、三壁敞顶前侧敞开（封顶的带「天花板」和「灯位格栅」独立材质组）。 */
export function guFengSet(r: GRoom): ArchitecturePrototype[] {
  return variants.map(v => whiteGB(`白模·古风内景·${r.label}·${r.W}m×${r.D}m·净高${r.H}m·${v}`,
    `白模预演古风剧内景：${r.label}，${r.blurb}，净面积 ${r.W}×${r.D}m、净高 ${r.H}m，${v}${v === "三壁敞顶·前侧敞开" ? "（无天花板，便于俯拍和布灯）" : "，带「天花板」和「灯位格栅」两个独立材质组"}；${spec}；门窗按真实尺寸，家具按真实比例`, "中式", g => {
      const { W, D, H } = r, y = g.fl, ox = W / 2 + WT, oz = D / 2 + WT;
      g.slab(-ox, -oz, ox, oz, y); g.tiles(W, D);
      const side = (axis: "x" | "z", fixed: number, from: number, to: number, s: GWall, inward: 1 | -1) => {
        const ops: Op[] = [...(s.ops ?? []), ...(s.lat ?? []).map(([c, w, h, sill]) => hole(c, w, h, sill))];
        g.wall(axis, fixed, from, to, y, H, WT, ops);
        for (const [c, w, h, sill, n] of s.lat ?? []) g.lattice(axis, fixed, c - w / 2, c + w / 2, y + sill, y + sill + h, n);
        if (s.wains !== false) g.wains(axis, fixed, from, to, inward, ops);
      };
      side("x", -D / 2 - WT / 2, -ox, ox, r.back, 1); side("z", -W / 2 - WT / 2, -oz, oz, r.left, 1); side("z", W / 2 + WT / 2, -oz, oz, r.right, -1);
      if (v === "四壁封顶") side("x", D / 2 + WT / 2, -ox, ox, r.front, -1);
      for (const [px, pz] of r.pillars ?? []) g.pillar(px, pz, H);
      r.furn(g, W, D, H);
      if (v === "四壁封顶") {
        // 前墙上没有门窗的空段各挂一幅字画，反打镜头不会面对一堵光墙
        const cuts = [...(r.front.ops ?? []), ...(r.front.lat ?? []).map(([c, w]) => ({ c, w }))].map(o => [o.c - o.w / 2 - .25, o.c + o.w / 2 + .25]).sort((p, q) => p[0]! - q[0]!);
        let cur = -W / 2 + .35; const free: [number, number][] = [];
        for (const [a, e] of cuts) { if (a! > cur) free.push([cur, a!]); cur = Math.max(cur, e!); }
        if (cur < W / 2 - .35) free.push([cur, W / 2 - .35]);
        for (const [a, e] of free) if (e - a >= 1.4) g.scroll((a + e) / 2, D / 2, 180, 1.3, .7, 1.5);
      }
      if (v !== "三壁敞顶·前侧敞开") {
        g.caisson(W, D, y + H);
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.box("rig", sx * (W / 2 - .1), y + H + .4, sz * (D / 2 - .1), .1, .6, .1);
        g.lightGrid(-W / 2 + .1, -D / 2 + .1, W / 2 - .1, D / 2 - .1, y + H + .7, 1.2, 1.2);
      }
    }, ["布景", "影棚布景", "房间", "古风内景", "古风剧", "古装", "内景", r.label, v, ...(r.tags ?? [])]));
}
