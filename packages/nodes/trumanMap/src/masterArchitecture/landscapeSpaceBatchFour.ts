import { BoxGeometry } from "three";
import { part, ring, type ModelPart, type Triple } from "../assetModelParts";
import { box, colors, cylinder, design, pipe, rail } from "./structures";

// 拦雪支撑构造参照 SLF 起动区刚性雪桥，而非已滑动雪崩的分流坝。
// https://www.slf.ch/de/lawinen/lawinenschutz/baulicher-lawinenschutz/
// 只制作静态场景形体，不提供防灾工程规格/性能保证。
const steel = "#778b88", rock = "#969f8e", grass = "#91a172";

function tube(name: string, points: Triple[], radius: number, color = steel): ModelPart {
  return part(name, "tube", color, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius, path: points.map(([x, y, z]) => ({ x, y, z })) });
}

function lattice(name: string, w: number, h: number, columns: number, rows: number, thickness: number, position: Triple, rotation: Triple = [0, 0, 0]): ModelPart[] {
  const geometry = new BoxGeometry(1, 1, 1), points = geometry.getAttribute("position"), cube = Array.from({ length: points.count }, (_, i) => [points.getX(i), points.getY(i), points.getZ(i)] as Triple), faces = Array.from(geometry.index!.array);
  geometry.dispose();
  const bars = [...Array.from({ length: columns + 1 }, (_, i) => ({ x: -w / 2 + i * w / columns, y: h / 2, w: thickness, h })), ...Array.from({ length: rows + 1 }, (_, i) => ({ x: 0, y: i * h / rows, w, h: thickness }))];
  const result: ModelPart[] = [];
  // ACT: 每组最多20条立体细肋，保留真实网孔和硬面，单mesh最多480顶点。
  for (let offset = 0; offset < bars.length; offset += 20) {
    const vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
    for (const bar of bars.slice(offset, offset + 20)) {
      const start = vertices.length;
      vertices.push(...cube.map(([x, y, z]) => ({ x: bar.x + x * bar.w, y: bar.y + y * bar.h, z: z * thickness })));
      indices.push(...faces.map(index => start + index));
    }
    result.push(part(name, "mesh", steel, position, [1, 1, 1], rotation, { vertices, indices }));
  }
  return result;
}

function terrainSection(name: string, profile: [number, number][], width: number, color = rock): ModelPart {
  return part(name, "extrude", color, [0, 0, 0], [1, 1, 1], [0, 90, 0], { depth: width, profile: profile.map(([z, y]) => ({ x: -z, y })) });
}

function terraceBand(name: string, inner: number, outer: number, y: number, height: number, color: string, start = -70, end = 70): ModelPart {
  const contour = [...Array.from({ length: 14 }, (_, i) => { const a = (start + (end - start) * i / 13) * Math.PI / 180; return { x: Math.sin(a) * outer, y: 10 - Math.cos(a) * outer }; }), ...Array.from({ length: 14 }, (_, i) => { const a = (end - (end - start) * i / 13) * Math.PI / 180; return { x: Math.sin(a) * inner, y: 10 - Math.cos(a) * inner }; })];
  return part(name, "extrude", color, [0, y + height / 2, 0], [1, 1, 1], [-90, 0, 0], { depth: height, profile: contour });
}

function spiralDeck(): ModelPart[] {
  const result: ModelPart[] = [];
  // ACT: 大半径人行坡道使用96截面，避免套用小螺旋翼片的24截面后扶手悬在坡板外；两片各400顶点。
  for (const start of [0, 48]) {
    const vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
    for (let i = start; i <= start + 48; i++) {
      const t = i / 96, a = t * Math.PI * 5, y = .4 + t * 20;
      for (const [r, dy] of [[12.2, .125], [14, .125], [12.2, -.125], [14, -.125], [12.2, .125], [12.2, -.125], [14, .125], [14, -.125]]) vertices.push({ x: Math.cos(a) * r!, y: y + dy!, z: Math.sin(a) * r! });
      if (i === start) continue;
      const p = (i - start - 1) * 8, q = p + 8;
      indices.push(p, q, p + 1, p + 1, q, q + 1, p + 2, p + 3, q + 2, p + 3, q + 3, q + 2, p + 4, p + 5, q + 4, p + 5, q + 5, q + 4, p + 6, q + 6, p + 7, p + 7, q + 6, q + 7);
    }
    for (const [offset, corners] of [[0, [0, 1, 3, 2]], [48 * 8, [0, 2, 3, 1]]] as const) {
      const n = vertices.length;
      vertices.push(...corners.map(i => ({ ...vertices[offset + i]! })));
      indices.push(n, n + 1, n + 2, n, n + 2, n + 3);
    }
    result.push(part("硬边与坡面分顶点的连续螺旋坡板", "mesh", colors.wood, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices }));
  }
  return result;
}

export const landscapeSpaceBatchFourDesigns = [
  design("树冠盘旋坡道观景塔", "外圈承柱支撑连续上升坡板，内侧没有实心塔身或台阶，顶端宽环台与中央通天空腔形成完整可穿行观景空间", () => {
    const turns = 2.5, height = 20;
    const parts: ModelPart[] = [...spiralDeck(), ring("顶部环形全景观景板", colors.wood, 15.5, 4, 20.4, .25), box("地面入口与坡板相接的低平台", 13.1, .15, 0, 2.3, .3, 2.8, colors.wood)];
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; parts.push(cylinder("支承全部坡板层位的连续外圈钢柱", Math.cos(a) * 14, 10.9, Math.sin(a) * 14, .32, 21.8, steel), cylinder("外圈承柱实际落地分压础", Math.cos(a) * 14, .12, Math.sin(a) * 14, .8, .24)); }
    for (let i = 0; i <= 20; i++) {
      const t = i / 20, a = t * turns * Math.PI * 2, y = .4 + height * t;
      parts.push(rail([Math.cos(a) * 12.1, y - .15, Math.sin(a) * 12.1], [Math.cos(a) * 14, y - .15, Math.sin(a) * 14], .14, steel), pipe("内侧坡道护栏实际落地立柱", [Math.cos(a) * 12.25, y + .125, Math.sin(a) * 12.25], [Math.cos(a) * 12.25, y + 1.1, Math.sin(a) * 12.25], .055));
    }
    for (const r of [12.25, 13.94]) parts.push(tube("连续跟随上升坡度的扶手", Array.from({ length: 25 }, (_, i) => { const t = i / 24, a = t * turns * Math.PI * 2; return [Math.cos(a) * r, .4 + height * t + 1.1, Math.sin(a) * r] as Triple; }), .035));
    for (const r of [11.6, 15.4]) {
      parts.push(ring("顶部环台连续防坠扶手", steel, r, .045, 21.65, .07));
      for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; parts.push(pipe("环形顶台护栏立柱", [Math.cos(a) * r, 20.525, Math.sin(a) * r], [Math.cos(a) * r, 21.65, Math.sin(a) * r], .06)); }
    }
    return parts;
  }, "建筑", "现代"),
  design("岩壁锚固悬空栈道", "成排三角托架直接锚入完整岩壁，外侧步行木板和连续扶栏悬在岩脚上方，通道内侧贴壁而不靠落谷立柱", () => {
    const parts: ModelPart[] = [box("承接全部锚点的完整山崖断面", 0, 12, 4, 50, 24, 8, rock), ...Array.from({ length: 24 }, (_, i) => box("贴壁连续木栈道铺板", -23 + i * 2, 10, -1.15, 1.98, .2, 2.4, colors.wood)), ...[10.55, 11.2].map(y => pipe("临谷侧完整连续护栏", [-24, y, -2.3], [24, y, -2.3], .065))];
    for (let i = 0; i < 9; i++) {
      const x = -24 + i * 6;
      parts.push(rail([x, 9.85, .2], [x, 9.85, -2.3], .16, steel), rail([x, 7.7, .2], [x, 9.85, -2.3], .16, steel), box("将托架固定到山岩的实际锚板", x, 8.8, .03, .45, 2.8, .14, steel), pipe("栈道外侧防坠栏杆立柱", [x, 10.1, -2.3], [x, 11.2, -2.3], .07));
    }
    return parts;
  }, "建筑", "现代"),
  design("直接锚固贴坡钢索防护系统", "细网顺岩面铺贴，面内钢索与压板把风化表层约束在岩壁上，独立锚杆进入岩体，不同于山脚被动捕落石立网", () => {
    const parts: ModelPart[] = [terrainSection("承担入岩锚杆的连续倾斜山岩", [[-6, 0], [6, 20.8], [14, 20.8], [14, 0]], 42), ...lattice("铺贴岩面的开放细钢网", 40, 24, 80, 48, .018, [0, .2, -6.13], [30, 0, 0])];
    for (const x of [-18, -9, 0, 9, 18]) for (const y of [2, 8, 14, 20]) {
      const py = .2 + y * Math.cos(Math.PI / 6), z = -6.13 + y * .5;
      parts.push(part("压住面网交点的入岩锚压板", "box", steel, [x, py, z - .035], [.32, .25, .075], [30, 0, 0]), pipe("从压板进入岩体的承载锚杆", [x, py, z], [x, py - .3, z + .52], .055));
    }
    parts.push(pipe("贴坡网底部连续收边索", [-20, .2, -6.13], [20, .2, -6.13], .045), pipe("贴坡网顶部连续收边索", [-20, 20.985, 5.87], [20, 20.985, 5.87], .045));
    return parts;
  }, "建筑", "现代"),
  design("山坡刚架拦雪桥场", "刚性格面由斜撑和入坡支脚连续支承，沿起动区坡面横向布置来承托未滑动雪层，不是顺坡分流锥或下方落石拦网", () => {
    const parts: ModelPart[] = [terrainSection("安装雪桥支承结构的完整山坡", [[-6, 0], [24, 16.5], [24, 0]], 36, "#b4bcae")];
    const a = 29 * Math.PI / 180;
    for (const z of [0, 8, 16]) {
      const y = (z + 6) * .55 + .25;
      parts.push(...lattice("真实透空的刚性承雪钢格面", 32, 4.3, 32, 6, .055, [0, y, z], [-29, 0, 0]));
      for (const x of [-16, -8, 0, 8, 16]) {
        const top: Triple = [x, y + Math.cos(a) * 4.3, z - Math.sin(a) * 4.3], foot: Triple = [x, y - 2.2, z - 4];
        parts.push(rail([x, y, z], top, .14, steel), rail(foot, top, .14, steel), box("雪桥斜撑在坡面的分压锚座", x, foot[1] - .1, foot[2], .55, .2, .6));
      }
      parts.push(pipe("雪桥格面顶端连续横向承梁", [-16, y + Math.cos(a) * 4.3, z - Math.sin(a) * 4.3], [16, y + Math.cos(a) * 4.3, z - Math.sin(a) * 4.3], .15));
    }
    return parts;
  }, "建筑", "现代"),
  design("石坎灌排梯田整体", "弧形梯级土床依山逐级降落，外缘双侧石坎在中央留下实际跌水径口，一条沿坡阶降的明渠贯通各级稻田", () => {
    const parts: ModelPart[] = [];
    const crown = [{ x: 0, y: 10 }, ...Array.from({ length: 15 }, (_, i) => { const a = (-70 + i * 10) * Math.PI / 180; return { x: Math.sin(a) * 8.5, y: 10 - Math.cos(a) * 8.5 }; })];
    parts.push(part("顶端与梯田连成山坡的土冠", "extrude", colors.earth, [0, 5, 0], [1, 1, 1], [-90, 0, 0], { depth: 10, profile: crown }));
    for (let i = 0; i < 6; i++) {
      const r = 10 + i * 3, y = 10 - i * 1.5, z = r - 10;
      parts.push(terraceBand("从山体连续落地的整级梯田土床", r - 1.5, r + 1.5, 0, y, colors.earth), terraceBand("每一级梯田的独立静态浅水面", r - 1.24, r + 1.24, y + .015, .035, "#8dada0"), terraceBand("中央径口左侧真实石砌田坎", r + 1.26, r + 1.5, y, .28, rock, -70, -2), terraceBand("中央径口右侧真实石砌田坎", r + 1.26, r + 1.5, y, .28, rock, 2, 70));
      parts.push(box("沿各级坡降的中央灌排明渠底", 0, y + .02, z, .6, .04, 3), ...[-1, 1].map(s => box("中央明渠连续两侧小边坎", s * .32, y + .13, z, .07, .22, 3)));
    }
    return parts;
  }, "建筑", "中式"),
];
