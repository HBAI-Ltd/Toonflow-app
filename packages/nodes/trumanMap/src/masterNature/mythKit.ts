import { combineMeshes, design, eyes, lobe, needle, part, tapered, tube, type ModelPart, type Triple } from "./shared";
import { membrane } from "./animals";

// 神兽与传说生物的造型套件：躯干四肢、头（狮、马、鹿、狼、牛、龙、猪、鳄）、翼（蝠翼、羽翼）、东方龙身、盘龙、双足人形、鸟身、火焰。
// 面朝 +z、y 向上，单位米；形体只表达轮廓和一眼能认的特征（角、须、鬃、鳞脊、爪、翼、尾）。
export { combineMeshes, design, eyes, lobe, needle, part, tapered, tube, membrane };
export type { ModelPart, Triple };
export type V = Triple;
export const v = (x: number, y: number, z: number): V => [x, y, z];

export type HeadKind = "lion" | "horse" | "deer" | "wolf" | "bull" | "dragon" | "boar" | "croc";
const HS: Record<HeadKind, [number, number, number, number, number]> = { lion: [.62, .46, .6, .5, -.14], horse: [.46, .46, 1.1, .7, -.12], deer: [.36, .34, .95, .65, -.12], wolf: [.46, .38, .85, .6, -.12], bull: [.7, .52, .55, .5, -.18], dragon: [.62, .4, .95, .65, -.1], boar: [.55, .45, .75, .55, -.14], croc: [.55, .3, 1.5, .9, -.1] };
/** 兽头：at 是头颅中心，s 是头的大小；返回头颅、口鼻、鼻头、双眼、双耳，可加獠牙和怒眉。 */
export function head(kind: HeadKind, at: V, s: number, c: string, o: { muzzle?: string; teeth?: boolean; ears?: boolean; angry?: boolean } = {}): ModelPart[] {
  const P = (x: number, y: number, z: number): V => [at[0] + x * s, at[1] + y * s, at[2] + z * s], [mx, my, mz, mzc, myc] = HS[kind];
  const out: ModelPart[] = [lobe("头颅", c, at, [s * .95, s * .85, s]), lobe("口鼻", o.muzzle ?? c, P(0, myc, mzc), [mx * s, my * s, mz * s]), lobe("鼻头", "#2a2622", P(0, myc + .04, mzc + mz * .46), [mx * s * .5, my * s * .45, .14 * s]), ...eyes(P(0, .14, .34), .28 * s, .09 * s)];
  if (o.ears !== false) for (const side of [-1, 1]) out.push(needle("耳", c, P(side * .3, .3, -.12), P(side * .4, .3 + (kind === "horse" || kind === "deer" ? .55 : .32), -.2), .13 * s));
  if (o.teeth) for (const side of [-1, 1]) out.push(needle("獠牙", "#f2eee0", P(side * .2, myc, mzc + mz * .15), P(side * .22, myc - .32, mzc + mz * .12), .07 * s));
  if (o.angry) for (const side of [-1, 1]) out.push(needle("怒眉", "#3a2f26", P(side * .08, .26, .4), P(side * .38, .36, .3), .06 * s));
  return out;
}
/** 四足躯干与四肢（legs=8 是八条腿）；L 躯干长、H 肩高、W 躯干宽。 */
export function trunk(o: { L: number; H: number; W: number; c: string; belly?: string; paw?: string; legs?: 4 | 8 }): ModelPart[] {
  const { L, H, W, c } = o, out: ModelPart[] = [lobe("躯干", c, v(0, H, 0), [W, H * .62, L]), lobe("胸", c, v(0, H * .98, L * .26), [W * .95, H * .66, L * .42]), lobe("臀", c, v(0, H * .98, -L * .28), [W * .98, H * .66, L * .4])];
  if (o.belly) out.push(lobe("腹", o.belly, v(0, H * .78, 0), [W * .7, H * .3, L * .7]));
  for (const s of [-1, 1]) for (const z of o.legs === 8 ? [L * .3, L * .18, -L * .2, -L * .32] : [L * .26, -L * .28]) out.push(tapered("肢", c, [v(s * W * .3, H * .72, z), v(s * W * .32, H * .4, z + (z < 0 ? -L * .05 : L * .02)), v(s * W * .31, .03, z + L * .03)], [W * .17, W * .1, W * .08]), lobe("足", o.paw ?? c, v(s * W * .31, .06, z + L * .05), [W * .22, H * .1, W * .34]));
  return out;
}
/** 蝠翼：翼臂、两根翼指和翼膜。 */
export function batWing(side: number, root: V, span: number, h: number, c: string, bone: string): ModelPart[] {
  const wrist = v(root[0] + side * span * .45, root[1] + h * .7, root[2] - span * .05), tip = v(root[0] + side * span, root[1] + h * .35, root[2] - span * .25), f1 = v(root[0] + side * span * .85, root[1] - h * .2, root[2] - span * .45), f2 = v(root[0] + side * span * .55, root[1] - h * .45, root[2] - span * .5), low = v(root[0] + side * span * .1, root[1] - h * .35, root[2] - span * .3);
  return [tapered("翼臂", bone, [root, wrist, tip], [span * .03, span * .022, span * .01]), tapered("翼指", bone, [wrist, f1], [span * .016, span * .008]), tapered("翼指", bone, [wrist, f2], [span * .014, span * .007]), membrane("翼膜", c, [root, wrist, tip, f1, f2, low])];
}
/** 羽翼：一排飞羽向外扇开。 */
export function wingFan(side: number, root: V, span: number, rise: number, c: string, n = 8): ModelPart[] {
  const feathers: ModelPart[] = [];
  for (let k = 0; k < n; k++) { const t = k / (n - 1), a = (t - .15) * 1.7; feathers.push(needle("飞羽", c, v(root[0] + side * span * .08, root[1], root[2] - span * .05 * t), v(root[0] + side * span * Math.cos(a * .9 + .1) * (1 - .15 * t), root[1] + rise * Math.sin(a * 1.4) - span * .18 * t, root[2] - span * (.1 + t * .55)), span * .06)); }
  return [lobe("翼根", c, v(root[0] + side * span * .12, root[1], root[2]), [span * .22, span * .08, span * .22]), combineMeshes("飞羽", c, feathers)];
}
/** 火焰：n 簇向上的火舌（合并成一个部件）。 */
export function flame(c: string, base: V, w: number, h: number, n = 7): ModelPart {
  return combineMeshes("火焰", c, Array.from({ length: n }, (_, i) => { const a = i / n * Math.PI * 2, r = w * .35 * (i ? 1 : 0); return needle("火舌", c, v(base[0] + Math.cos(a) * r, base[1], base[2] + Math.sin(a) * r), v(base[0] + Math.cos(a) * r * 1.3, base[1] + h * (.6 + .4 * ((i * 37) % 10) / 10), base[2] + Math.sin(a) * r * 1.3), w * .3); }));
}
/** 背脊刺：沿路径点向上的一排尖刺。 */
export function spines(c: string, path: V[], r: number[], h: number, every = 1): ModelPart {
  return combineMeshes("背刺", c, path.flatMap((p, i) => i % every || i === 0 ? [] : [needle("刺", c, v(p[0], p[1] + r[i]! * .8, p[2]), v(p[0], p[1] + r[i]! * .8 + h * (.6 + .4 * Math.sin(i)), p[2] - h * .3), r[i]! * .5)]));
}
/** 弯曲的角：从 base 弯向 tip，分三段。 */
export function horn(c: string, base: V, mid: V, tip: V, w: number): ModelPart { return tapered("角", c, [base, mid, tip], [w, w * .6, w * .15]); }

/** 东方龙：长身、蛇形起伏，鳞背刺、腹甲、四肢五爪、角须鬃、可选翼；沿 z 从尾（-L/2）到头（+L/2）。 */
export function dragonE(L: number, c: string, o: { belly?: string; mane?: string; legs?: boolean; wings?: boolean; horns?: boolean; wave?: number } = {}): ModelPart[] {
  const N = 16, wave = o.wave ?? .09, path: V[] = [], rad: number[] = [], mane = o.mane ?? "#b5432e", belly = o.belly ?? "#d8c98a";
  for (let i = 0; i < N; i++) { const t = i / (N - 1); path.push(v(Math.sin(t * Math.PI * 3) * L * wave, L * (.1 + t * .16 + Math.sin(t * Math.PI * 2 + 1) * .035), -L / 2 + t * L)); rad.push(L * .036 * (.14 + .86 * Math.pow(Math.sin(Math.PI * .5 * Math.min(1, t / .55)), .8)) * (t > .8 ? 1 - (t - .8) * .9 : 1)); }
  const hd = path[N - 1]!, hs = L * .075, out: ModelPart[] = [tapered("龙身", c, path, rad), tapered("龙腹甲", belly, path.map((p, i) => v(p[0], p[1] - rad[i]! * .6, p[2])), rad.map(r => r * .7)), spines(mane, path, rad, L * .03, 1)];
  const hp = v(hd[0], hd[1] + hs * .1, hd[2] + hs * .55);
  out.push(...head("dragon", hp, hs, c, { teeth: true, ears: false, angry: true }), lobe("下颌", c, v(hp[0], hp[1] - hs * .33, hp[2] + hs * .4), [hs * .5, hs * .18, hs * .85]), tube("龙须", mane, [v(hp[0] + hs * .2, hp[1] - hs * .1, hp[2] + hs * .75), v(hp[0] + hs * .8, hp[1] - hs * .35, hp[2] + hs * .9), v(hp[0] + hs * 1.5, hp[1] - hs * .9, hp[2] + hs * .5)], hs * .03), tube("龙须", mane, [v(hp[0] - hs * .2, hp[1] - hs * .1, hp[2] + hs * .75), v(hp[0] - hs * .8, hp[1] - hs * .35, hp[2] + hs * .9), v(hp[0] - hs * 1.5, hp[1] - hs * .9, hp[2] + hs * .5)], hs * .03), tapered("龙髯", mane, [v(hp[0], hp[1] - hs * .45, hp[2] + hs * .5), v(hp[0], hp[1] - hs * .9, hp[2] + hs * .3), v(hp[0], hp[1] - hs * 1.6, hp[2] - hs * .3)], [hs * .08, hs * .05, hs * .01]));
  if (o.horns !== false) for (const side of [-1, 1]) out.push(horn("#e8dcc0", v(hp[0] + side * hs * .22, hp[1] + hs * .4, hp[2] - hs * .15), v(hp[0] + side * hs * .35, hp[1] + hs * .95, hp[2] - hs * .5), v(hp[0] + side * hs * .3, hp[1] + hs * 1.15, hp[2] - hs * 1.1), hs * .07), needle("鹿角杈", "#e8dcc0", v(hp[0] + side * hs * .33, hp[1] + hs * .8, hp[2] - hs * .45), v(hp[0] + side * hs * .75, hp[1] + hs * 1.1, hp[2] - hs * .4), hs * .05));
  if (o.legs !== false) for (const [t, front] of [[.74, true], [.84, true], [.2, false], [.3, false]] as [number, boolean][]) { const p = path[Math.round(t * (N - 1))]!, s = path.indexOf(p) % 2 ? 1 : -1, foot = v(p[0] + s * L * .05, .02, p[2] + (front ? L * .03 : -L * .02)); out.push(tapered("龙肢", c, [v(p[0] + s * L * .015, p[1] - L * .02, p[2]), v(p[0] + s * L * .06, p[1] * .45, p[2] + L * .02), foot], [L * .012, L * .008, L * .006]), combineMeshes("龙爪", "#e8dcc0", [-1, 0, 1].map(k => needle("爪", "#e8dcc0", foot, v(foot[0] + k * L * .008, .0, foot[2] + L * .02), L * .004)))); }
  if (o.wings) for (const side of [-1, 1]) out.push(...batWing(side, v(path[11]![0], path[11]![1] + rad[11]!, path[11]![2]), L * .42, L * .16, "#d9b86a", "#a8863a"));
  out.push(lobe("尾鳍", mane, v(path[0]![0], path[0]![1], path[0]![2] - L * .03), [L * .02, L * .1, L * .08]));
  return out;
}
/** 盘龙：绕着一根柱子盘旋而上，头朝前（+z）探出；R 是盘绕半径、H 是柱高。 */
export function dragonCoil(H: number, R: number, c: string, o: { belly?: string; mane?: string; pillar?: string } = {}): ModelPart[] {
  const N = 28, path: V[] = [], rad: number[] = [], mane = o.mane ?? "#b5432e";
  for (let i = 0; i < N; i++) { const t = i / (N - 1), a = t * Math.PI * 7 + Math.PI * .5 - Math.PI * 7; path.push(v(Math.cos(a) * R, .3 + t * (H - .6), Math.sin(a) * R)); rad.push(R * .2 * (.2 + .8 * Math.min(1, t / .5)) * (t > .9 ? 1 - (t - .9) * 3 : 1)); }
  const hd = path[N - 1]!, hs = R * .55, hp = v(hd[0], hd[1] + hs * .15, hd[2] + hs * .5);
  const out: ModelPart[] = [part("盘龙柱", "cylinder", o.pillar ?? "#b5432e", [0, H / 2, 0], [R * 1.4, H, R * 1.4]), tapered("龙身", c, path, rad), spines(mane, path, rad, R * .25, 1), ...head("dragon", hp, hs, c, { teeth: true, ears: false, angry: true }), lobe("下颌", c, v(hp[0], hp[1] - hs * .33, hp[2] + hs * .4), [hs * .5, hs * .18, hs * .85])];
  for (const side of [-1, 1]) out.push(horn("#e8dcc0", v(hp[0] + side * hs * .22, hp[1] + hs * .4, hp[2] - hs * .15), v(hp[0] + side * hs * .35, hp[1] + hs * .95, hp[2] - hs * .5), v(hp[0] + side * hs * .3, hp[1] + hs * 1.1, hp[2] - hs * 1.1), hs * .07), tube("龙须", mane, [v(hp[0] + side * hs * .2, hp[1] - hs * .1, hp[2] + hs * .75), v(hp[0] + side * hs * .8, hp[1] - hs * .3, hp[2] + hs * .9), v(hp[0] + side * hs * 1.4, hp[1] - hs * .8, hp[2] + hs * .5)], hs * .03));
  return out;
}
/** 双足人形：H 是总高；leg 可选人腿、羊腿（膝盖反折）、鸟爪；返回部件、头位置、双手位置。 */
export function biped(o: { H: number; c: string; skin?: string; stoop?: number; leg?: "human" | "goat" | "bird"; belly?: number; arm?: number }): { parts: ModelPart[]; head: V; hs: number; hands: [V, V] } {
  const { H, c } = o, sk = o.skin ?? c, st = o.stoop ?? 0, b = 1 + (o.belly ?? 0), hs = H * .15, hd = v(0, H * .92, st * H * .16);
  const out: ModelPart[] = [lobe("骨盆", c, v(0, H * .5, 0), [H * .2, H * .14, H * .13]), lobe("躯干", c, v(0, H * .7, st * H * .06), [H * .27 * b, H * .3, H * .17 * b]), tapered("颈", sk, [v(0, H * .82, st * H * .1), v(0, H * .88, st * H * .14)], [H * .05, H * .045]), lobe("头", sk, hd, [hs * .9, hs, hs * .95]), ...eyes(v(0, H * .93, hd[2] + hs * .36), hs * .25, hs * .08)];
  const hands: V[] = [];
  for (const s of [-1, 1]) {
    const leg = o.leg ?? "human", foot = v(s * H * .09, H * .02, H * .03);
    out.push(tapered("腿", leg === "human" ? sk : c, leg === "goat" ? [v(s * H * .07, H * .46, 0), v(s * H * .1, H * .27, H * .06), v(s * H * .09, H * .13, -H * .05), foot] : leg === "bird" ? [v(s * H * .07, H * .46, 0), v(s * H * .09, H * .25, H * .05), v(s * H * .09, H * .1, -H * .03), foot] : [v(s * H * .07, H * .46, 0), v(s * H * .09, H * .25, H * .03), foot], leg === "human" ? [H * .06, H * .045, H * .04] : [H * .065, H * .05, H * .028, H * .03]), lobe("足", leg === "human" ? sk : "#3a2f26", v(s * H * .09, H * .02, H * .06), [H * .07, H * .04, H * .12]));
    const hand = v(s * H * .22, H * (.46 + (o.arm ?? 0) * .3), H * .06 + st * H * .06); hands.push(hand);
    out.push(tapered("臂", sk, [v(s * H * .15, H * .8, st * H * .08), v(s * H * .21, H * .62, st * H * .1 + H * .04), hand], [H * .045, H * .035, H * .03]), lobe("手", sk, hand, [H * .05, H * .06, H * .05]));
  }
  return { parts: out, head: hd, hs, hands: [hands[0]!, hands[1]!] };
}
/** 鸟身：躯干、颈、头、喙、冠羽、双腿；返回部件和头位置。 */
export function birdBody(o: { s: number; c: string; belly?: string; beak?: string; legs?: number; crest?: boolean; neck?: number }): { parts: ModelPart[]; head: V } {
  const { s, c } = o, nk = o.neck ?? 1, hd = v(0, s * (1.55 + nk * .45), s * (.5 + nk * .25)), out: ModelPart[] = [lobe("鸟身", c, v(0, s * 1.1, 0), [s * .75, s * .75, s * 1.4]), lobe("鸟胸", o.belly ?? c, v(0, s * 1.02, s * .3), [s * .6, s * .62, s * .7]), tapered("长颈", c, [v(0, s * 1.2, s * .4), v(0, s * 1.45, s * .55), v(0, hd[1] - s * .12, hd[2] - s * .05)], [s * .22, s * .14, s * .1]), lobe("鸟头", c, hd, [s * .3, s * .28, s * .38]), needle("喙", o.beak ?? "#e8a23a", v(0, hd[1] - s * .02, hd[2] + s * .15), v(0, hd[1] - s * .06, hd[2] + s * .55), s * .12), ...eyes(v(0, hd[1] + s * .04, hd[2] + s * .1), s * .13, s * .04)];
  for (const side of [-1, 1]) out.push(tapered("鸟腿", o.beak ?? "#e8a23a", [v(side * s * .18, s * .8, -s * .05), v(side * s * .2, s * .4, s * .02), v(side * s * .2, 0, s * .1)], [s * .07, s * .045, s * .035]), needle("爪", "#2a2622", v(side * s * .2, .02, s * .1), v(side * s * .2, .0, s * .3), s * .05));
  if (o.crest) out.push(combineMeshes("冠羽", c, [-1, 0, 1].map(k => needle("冠羽", c, v(k * s * .04, hd[1] + s * .12, hd[2] - s * .05), v(k * s * .12, hd[1] + s * .5, hd[2] - s * .25), s * .06))));
  return { parts: out, head: hd };
}
export const mythDesign = (key: string, name: string, build: () => ModelPart[], tags: string[], theme: "中式" | "日式" | "欧式" | "异域" | "奇幻") => design(key, name, "动物", build, ["神话生物", ...tags], theme);
