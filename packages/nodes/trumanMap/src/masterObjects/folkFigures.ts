import { part, type ModelPart, type Triple } from "../assetModelParts";

// 民俗神像雕塑套件：把泥塑、木雕、石雕的神像拆成「底座 + 衣袍 + 头 + 五官 + 手臂 + 冠帽法器」几类小部件，
// 比例取真实庙宇塑像的大小（坐像高 0.9–2.4m、立像高 1.9–3.4m），面朝 +z，最低点落在 y=0。只做轮廓、体量和一眼能认的特征，不做纹理。
export type V = Triple;
export const latheP = (name: string, color: string, pos: V, pts: [number, number][], scale: V = [1, 1, 1]) => part(name, "lathe", color, pos, scale, [0, 0, 0], { profile: pts.map(([x, y]) => ({ x, y })) });
export const ball = (name: string, color: string, pos: V, s: number | V) => part(name, "sphere", color, pos, typeof s === "number" ? [s, s, s] : s);
export const cylP = (name: string, color: string, pos: V, d: number, h: number, rot: V = [0, 0, 0], dz = d) => part(name, "cylinder", color, pos, [d, h, dz], rot);
export const coneP = (name: string, color: string, pos: V, d: number, h: number, rot: V = [0, 0, 0]) => part(name, "cone", color, pos, [d, h, d], rot);
export const boxP = (name: string, color: string, pos: V, s: V, rot: V = [0, 0, 0]) => part(name, "box", color, pos, s, rot);
export const tubeP = (name: string, color: string, path: V[], r: number) => part(name, "tube", color, [0, 0, 0], [1, 1, 1], [0, 0, 0], { path: path.map(([x, y, z]) => ({ x, y, z })), radius: r });
export const torusP = (name: string, color: string, pos: V, s: V, rot: V = [0, 0, 0]) => part(name, "torus", color, pos, s, rot);
export const plateP = (name: string, color: string, pos: V, pts: [number, number][], depth: number, rot: V = [0, 0, 0]) => part(name, "extrude", color, pos, [1, 1, 1], rot, { profile: pts.map(([x, y]) => ({ x, y })), depth });
export const shift = (parts: ModelPart[], dx: number, dy: number, dz: number) => { for (const p of parts) p.position = { x: p.position.x + dx, y: p.position.y + dy, z: p.position.z + dz }; return parts; };

export const gold = "#d9a93a", cloth = "#f2efe8", stone = "#9a978f", black = "#1a1713", red = "#a8322a", wood = "#6b4a2b";

/** 须弥座：宽 w、深 d、高 h 的三段式石座，顶面标高 h+0.04。 */
export const xumi = (w: number, d: number, h = .3, c = "#a29c90"): ModelPart[] => [boxP("须弥座", c, [0, h / 2, 0], [w, h, d]), boxP("须弥座束腰", "#8b867b", [0, h * .5, 0], [w - .06, h * .35, d - .06]), boxP("须弥座上枋", "#b8b2a4", [0, h + .02, 0], [w + .04, .04, d + .04])];
/** 莲台：y 是底面标高，半径 R，12 片莲瓣；顶面标高 y+0.2R。 */
export const lotus = (y: number, R: number, c = "#e8c4cc"): ModelPart[] => [latheP("莲台", c, [0, y, 0], [[0, 0], [R, 0], [R * 1.05, .06 * R], [R * .9, .16 * R], [R * .6, .2 * R], [0, .2 * R]]),
  ...Array.from({ length: 12 }, (_, i): ModelPart => { const a = i * 30 * Math.PI / 180; return coneP("莲瓣", c, [R * 1.02 * Math.sin(a), y + .22 * R, R * 1.02 * Math.cos(a)], .28 * R, .45 * R); })];
/** 头光：正对前方的扁环。 */
export const halo = (c: string, pos: V, d: number): ModelPart => torusP("头光", c, pos, [d, d, d * .1]);

export type Look = { skin: string; robe: string; trim?: string; hair?: string; beard?: string; mood?: "calm" | "fierce" | "smile" | "stern" | "blank"; sleeve?: number; hands?: [V, V] | "palms" | "hold" | "knee" | "wide" | "up" | "down" };
export type Fig = { parts: ModelPart[]; hy: number; top: number; k: number; hands: [V, V]; y0: number; hh: number };

/** 人形：pose "sit" 是盘腿坐姿（k 是坐高，含头顶），"stand" 是立姿（k 是头顶高）；y0 是脚下底座的顶面标高。 */
export function figure(pose: "sit" | "stand", k: number, o: Look, y0 = 0): Fig {
  const sit = pose === "sit", parts: ModelPart[] = [], Y = (v: number) => y0 + v * k;
  const hw = (sit ? .17 : .115) * k, hh = (sit ? .21 : .14) * k, hd = (sit ? .19 : .13) * k, hy = Y(sit ? .8 : .865), sh = sit ? .19 : .16, sy = sit ? .62 : .74;
  const prof: [number, number][] = sit ? [[0, 0], [.35, 0], [.37, .04], [.31, .17], [.22, .29], [.17, .34], [.2, .45], [.21, .58], [.14, .67], [.07, .7], [0, .7]] : [[0, 0], [.17, 0], [.18, .03], [.14, .3], [.13, .5], [.17, .66], [.17, .73], [.1, .78], [.05, .79], [0, .79]];
  parts.push(latheP("衣袍", o.robe, [0, y0, 0], prof.map(([x, y]) => [x * k, y * k]), [1, 1, sit ? .7 : .6]));
  parts.push(cylP("腰带", o.trim ?? o.robe, [0, Y(sit ? .4 : .5), 0], (sit ? .43 : .27) * k, .03 * k, [0, 0, 0], (sit ? .31 : .165) * k));
  parts.push(cylP("颈", o.skin, [0, Y(sit ? .7 : .8), 0], .08 * k, .06 * k)); parts.push(ball("头", o.skin, [0, hy, 0], [hw, hh, hd]));
  if (o.hair) parts.push(ball("发", o.hair, [0, hy + hh * .12, -hd * .12], [hw * 1.04, hh * .85, hd]));
  if (o.beard) parts.push(coneP("长须", o.beard, [0, hy - hh * .5 - .09 * k, hd * .3], .13 * k, .2 * k, [180, 0, 0]));
  if (o.mood !== "blank") {
    const z = hd / 2 * .92, fierce = o.mood === "fierce";
    for (const s of [-1, 1]) { parts.push(ball("眼", "#1a1511", [s * .036 * k, hy + .02 * k, z], .022 * k)); parts.push(boxP("眉", o.hair ?? "#2a211b", [s * .036 * k, hy + (fierce ? .048 : .044) * k, z + .004 * k], [.05 * k, .01 * k, .012 * k], [0, 0, s * (fierce ? -24 : 8)])); }
    parts.push(ball("鼻", o.skin, [0, hy - .004 * k, z + .008 * k], .026 * k)); parts.push(boxP("嘴", "#8a2d2d", [0, hy - .05 * k, z], [(fierce ? .07 : .045) * k, .01 * k, .012 * k]));
    if (fierce) for (const s of [-1, 1]) parts.push(coneP("獠牙", "#f2eee0", [s * .022 * k, hy - .066 * k, z], .014 * k, .03 * k, [180, 0, 0]));
  }
  const pre = (a: number, b: number, c: number): V => [a * k, Y(b), c * k], key = typeof o.hands === "string" || !o.hands ? o.hands ?? "hold" : "";
  const sitP: Record<string, [V, V]> = { palms: [pre(-.03, .5, .2), pre(.03, .5, .2)], hold: [pre(-.17, .46, .2), pre(.17, .5, .22)], knee: [pre(-.27, .34, .14), pre(.27, .34, .14)], wide: [pre(-.34, .52, .1), pre(.34, .52, .1)], up: [pre(-.3, .74, .1), pre(.3, .74, .1)], down: [pre(-.27, .34, .14), pre(.27, .34, .14)] };
  const standP: Record<string, [V, V]> = { palms: [pre(-.03, .55, .12), pre(.03, .55, .12)], hold: [pre(-.12, .5, .14), pre(.12, .52, .15)], knee: [pre(-.19, .42, .05), pre(.19, .42, .05)], wide: [pre(-.34, .62, .06), pre(.34, .62, .06)], up: [pre(-.3, .88, .05), pre(.3, .88, .05)], down: [pre(-.19, .42, .05), pre(.19, .42, .05)] };
  const hands: [V, V] = typeof o.hands === "object" ? o.hands : (sit ? sitP : standP)[key]!;
  hands.forEach((h, i) => {
    const s = i === 0 ? -1 : 1, S: V = [s * sh * k, Y(sy), 0], E: V = [(S[0] + h[0]) / 2 + s * .04 * k, (S[1] + h[1]) / 2 - .02 * k, (S[2] + h[2]) / 2 - .05 * k];
    parts.push(tubeP("袖", o.robe, [S, E, h], (o.sleeve ?? .05) * k)); parts.push(ball("手", o.skin, h, .05 * k));
  });
  return { parts, hy, top: hy + hh / 2, k, hands, y0, hh };
}
/** 乌纱帽（官帽）：圆帽加两只横翅。 */
export const officialHat = (f: Fig, c = "#1b1a1c"): ModelPart[] => [cylP("乌纱帽", c, [0, f.top + .05 * f.k, 0], .17 * f.k, .12 * f.k), ...[-1, 1].map(s => boxP("帽翅", c, [s * .14 * f.k, f.top + .06 * f.k, -.01 * f.k], [.16 * f.k, .018 * f.k, .05 * f.k]))];
/** 带珠旒的冕冠（帝王、阎罗、妈祖）：冕板加前后两排垂珠。 */
export const crownBoard = (f: Fig, c = "#1b1a1c"): ModelPart[] => [boxP("冕板", c, [0, f.top + .02 * f.k, 0], [.24 * f.k, .02 * f.k, .34 * f.k]), cylP("冠筒", c, [0, f.top - .01 * f.k, 0], .17 * f.k, .06 * f.k),
  ...Array.from({ length: 9 }, (_, i): ModelPart => ball("珠旒", "#e8d9a0", [(i - 4) * .026 * f.k, f.top - .05 * f.k, .17 * f.k], .018 * f.k))];
