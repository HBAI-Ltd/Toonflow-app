import type { AssetTheme } from "../sceneDocument";
import type { P } from "./ruinKit";
import { CLEAR, DEG, FH, PT, SLAB, door, win } from "./whitebox";
import { whiteAnc, type AB } from "./whiteboxAncientKit";
import type { ArchitecturePrototype } from "./structures";

// 建筑白模·乡村与地域民居：吊脚楼、圆形土楼、靠崖窑洞、毡房、徽派天井民居、北方农家小院、渔村栈桥高脚屋、原木小屋、谷仓、傣家竹楼。
// 圆形建筑（土楼、毡房）用「圆环楼板 / 圆弧墙 / 锥形屋面」三个函数一整面一整面地画，段数 36–72，不用方盒拼圆。
const tan = (d: number) => Math.tan(d * DEG);
const reg = (name: string, what: string, theme: AssetTheme, build: (b: AB) => void, tags: string[]) => whiteAnc(`白模·民居·${name}`, `白模预演地域民居：${what}；原点在平面中心，+z 为正面，地面标高 0`, theme, build, ["民居", ...tags]);

/** 极坐标点：a=0 指向 +z，角度向 +x 增大。 */
const polar = (r: number, a: number, y: number): P => [r * Math.sin(a * DEG), y, r * Math.cos(a * DEG)];
export const pol = polar;
const dir = (a: number): P => [Math.sin(a * DEG), 0, Math.cos(a * DEG)];
/** 圆形函数的扩展参数：sc 把圆压成椭圆（x、z 方向缩放），arc 只画 [起,止] 度的一段弧（默认整圈）。 */
export type RingExt = { sc?: [number, number]; arc?: [number, number] };
const mkPol = (o: [number, number], ex: RingExt) => (r: number, a: number, y: number): P => { const q = polar(r, a, y), sc = ex.sc ?? [1, 1]; return [q[0] * sc[0] + o[0], q[1], q[2] * sc[1] + o[1]]; };
/** 圆环楼板：内径 r1、外径 r2，顶面 yTop，厚 t，N 段（第 0 段居中在 a=0）。 */
export function ringSlab(b: AB, key: string, r1: number, r2: number, yTop: number, t: number, N: number, o: [number, number] = [0, 0], ex: RingExt = {}) {
  const pol = mkPol(o, ex), A0 = ex.arc ? ex.arc[0] : -180 / N, st = (ex.arc ? ex.arc[1] - ex.arc[0] : 360) / N;
  for (let i = 0; i < N; i++) {
    const a0 = A0 + i * st, a1 = a0 + st, d = dir((a0 + a1) / 2), nd: P = [-d[0], 0, -d[2]];
    b.quad4(key, pol(r1, a0, yTop), pol(r2, a0, yTop), pol(r2, a1, yTop), pol(r1, a1, yTop), [0, 1, 0]); b.quad4(key, pol(r1, a0, yTop - t), pol(r2, a0, yTop - t), pol(r2, a1, yTop - t), pol(r1, a1, yTop - t), [0, -1, 0]);
    b.quad4(key, pol(r2, a0, yTop - t), pol(r2, a1, yTop - t), pol(r2, a1, yTop), pol(r2, a0, yTop), d); b.quad4(key, pol(r1, a0, yTop - t), pol(r1, a1, yTop - t), pol(r1, a1, yTop), pol(r1, a0, yTop), nd);
  }
}
/** 圆弧墙：中心半径 r、厚 t、底 y0 顶 y1，N 段；gap(i) 返回 undefined 画整段，返回数字 yb 表示这一段只画 yb 以上（门洞），返回 null 表示整段留空。 */
export function ringWall(b: AB, key: string, r: number, t: number, y0: number, y1: number, N: number, gap?: (i: number) => number | null | undefined, o: [number, number] = [0, 0], ex: RingExt = {}) {
  const pol = mkPol(o, ex), A0 = ex.arc ? ex.arc[0] : -180 / N, st = (ex.arc ? ex.arc[1] - ex.arc[0] : 360) / N, ro = r + t / 2, ri = r - t / 2, g = (i: number) => gap?.(((i % N) + N) % N);
  for (let i = 0; i < N; i++) {
    const v = g(i); if (v === null) continue;
    const a0 = A0 + i * st, a1 = a0 + st, d = dir((a0 + a1) / 2), nd: P = [-d[0], 0, -d[2]], yb = typeof v === "number" ? v : y0;
    b.quad4(key, pol(ro, a0, yb), pol(ro, a1, yb), pol(ro, a1, y1), pol(ro, a0, y1), d); b.quad4(key, pol(ri, a0, yb), pol(ri, a1, yb), pol(ri, a1, y1), pol(ri, a0, y1), nd);
    b.quad4(key, pol(ri, a0, y1), pol(ro, a0, y1), pol(ro, a1, y1), pol(ri, a1, y1), [0, 1, 0]);
    if (typeof v === "number") b.quad4(key, pol(ri, a0, yb), pol(ro, a0, yb), pol(ro, a1, yb), pol(ri, a1, yb), [0, -1, 0]);
    for (const [a, nb, n] of [[a0, g(i - 1), -1], [a1, g(i + 1), 1]] as [number, number | null | undefined, number][]) if (nb !== undefined) { const tg: P = [n * Math.cos((a0 + a1) / 2 * DEG), 0, -n * Math.sin((a0 + a1) / 2 * DEG)]; b.quad4(key, pol(ri, a, yb), pol(ro, a, yb), pol(ro, a, y1), pol(ri, a, y1), tg); }
  }
}
/** 锥形（环形）屋面：从 (rBot,yBot) 到 (rTop,yTop)，N 段，厚 t。 */
export function cone(b: AB, key: string, rBot: number, yBot: number, rTop: number, yTop: number, N: number, t = .1, o: [number, number] = [0, 0], ex: RingExt = {}) {
  const pol = mkPol(o, ex), A0 = ex.arc ? ex.arc[0] : -180 / N, st = (ex.arc ? ex.arc[1] - ex.arc[0] : 360) / N;
  for (let i = 0; i < N; i++) {
    const a0 = A0 + i * st, a1 = a0 + st;
    b.quad4(key, pol(rBot, a0, yBot), pol(rBot, a1, yBot), pol(rTop, a1, yTop), pol(rTop, a0, yTop), [0, 1, 0]); b.quad4(key, pol(rBot, a0, yBot - t), pol(rBot, a1, yBot - t), pol(rTop, a1, yTop - t), pol(rTop, a0, yTop - t), [0, -1, 0]);
  }
}

export const whiteRegionalDesigns: ArchitecturePrototype[] = [
  reg("吊脚楼·三开间·两层·吊脚前廊·湘西", "湘西土家吊脚楼：三开间 13.5m×6m 的主屋架在 3.6m 高的细木柱（径 0.26、柱距 2.25m）上，前面 2.4m 深的吊脚前廊悬在更高的前排柱上、带栏杆，右端 1.0m 宽直跑木梯（20 级）上廊，主屋一层净高 2.8（前面一扇 1.5m 门、两扇窗）、二层阁楼净高 2.4，室内一条直跑楼梯上阁楼，32° 悬山屋面出檐 0.9、廊上另加一片 10° 披檐，山地村寨、土匪和江湖戏", "中式", b => {
    const y1 = 3.6, yf = y1 + .2, y2 = yf + 3, yE = y2 + 2.4;
    for (let x = -6.75; x <= 6.76; x += 2.25) { for (const z of [-3, 0, 3]) b.cyl("struct", x, z, 0, y1, .13, 8); b.cyl("struct", x, 5.4, 0, yf + 2.5, .13, 8); }
    b.slab(-7.2, -3.3, 7.2, 5.4, yf, .2, undefined, "floor"); b.slab(-6.75, -3, 6.75, 3, y2, .2, [-6.1, -2.9, -.9, -1.9]);
    b.wall("x", 3, -6.75, 6.75, yf, 2.8, .1, [door(0, 1.5, 2.1), win(-4.5, 1.5, 1.2, 1), win(4.5, 1.5, 1.2, 1)]); b.wall("x", -3, -6.75, 6.75, yf, 2.8, .1, [win(-4.5, 1.2, 1, 1.2), win(4.5, 1.2, 1, 1.2)]);
    for (const x of [-6.75, 6.75]) b.wall("z", x, -3, 3, yf, 2.8, .1, [win(0, 1.2, 1.2, 1)]);
    b.wall("x", 3, -6.75, 6.75, y2, 2.4, .1, [win(-3, 1.0, .9, 1.1), win(3, 1.0, .9, 1.1)]); b.wall("x", -3, -6.75, 6.75, y2, 2.4, .1, [win(0, 1.0, .9, 1.1)]); for (const x of [-6.75, 6.75]) b.wall("z", x, -3, 3, y2, 2.4, .1, [win(0, 1, .9, 1.1)]);
    b.rail(-7.2, 5.4, 7.2, 5.4, yf); b.rail(-7.2, 3, -7.2, 5.4, yf);
    b.flight(12.9, 4.2, "-x", 0, 20, 1, yf / 20, .28); b.stairRails(12.9, 4.2, "-x", 0, 20, 1, [-1, 1], yf / 20, .28);
    b.flight(-6, -2.4, "+x", yf, 18, 1, 3 / 18, .28);
    b.strut("roof", [0, yf + 3.05, 3], [0, yf + 2.45, 6.2], 14.8, .12);
    b.roofGable(-6.75, -3, 6.75, 3, yE, 32, .9, .9, "x");
  }, ["吊脚楼", "湘西", "山地", "土家", "悬山"]),

  reg("土楼·圆形·外径44m·四层·祖堂", "福建圆形土楼：外径 44m、外墙厚 1.4 高 14.6（只在正面开一个 2.8m 宽的大门洞，门上 3.6m 以上有墙），内圈四层房间（每层 36 间，每间进深 4.1m、一扇 1.45m 宽的门朝向内院走廊，层高 3.2），内院半径 14.5，上三层一圈 2m 宽走马廊带栏板和 36 根廊柱，向内院倾斜的环形屋面（坡度约 14°、出檐伸出走廊 1.5m），院中心一座 9m×7m 单层祖堂带四坡屋面，客家人聚居、围攻与防御、家族戏的经典场景", "中式", b => {
    const N = 48, M = 72, H = 3.2, rIn = 16.5, rg = 14.5, rOut = 20.6, y = (k: number) => k * H + .2, gate = (i: number) => i === 71 || i === 0 || i === 1;
    ringWall(b, "wall", 21.3, 1.4, 0, 14.6, N, i => i === 0 ? 3.6 : undefined);
    ringSlab(b, "floor", rIn, rOut, .2, .2, N);
    for (let k = 0; k < 4; k++) {
      if (k) ringSlab(b, "floor", rg, rOut, y(k), .2, N);
      ringWall(b, "wall", rIn, .3, y(k), y(k) + 2.8, M, i => k === 0 && gate(i) ? null : i % 2 ? y(k) + 2.4 : undefined);
      for (let m = 0; m < 36; m++) { if (k === 0 && m === 0) continue; const p = pol((rIn + rOut) / 2, m * 10, y(k) + 1.4); b.boxYaw("wall", p[0], p[1], p[2], rOut - rIn, 2.8, .2, m * 10 - 90); }
      if (k) ringWall(b, "rail", rg + .05, .1, y(k), y(k) + 1, 36);
    }
    for (let m = 0; m < 36; m++) { const p = pol(rg, m * 10, 0); b.cyl("struct", p[0], p[2], 0, y(3) + 2.8, .14, 8); }
    cone(b, "roof", 20.6, 14.2, 13, 12.2, N, .15);
    b.wall("x", 3.5, -4.5, 4.5, .3, 3.6, .3, [door(0, 1.8, 2.4)]); b.wall("x", -3.5, -4.5, 4.5, .3, 3.6, .3); for (const x of [-4.5, 4.5]) b.wall("z", x, -3.5, 3.5, .3, 3.6, .3);
    b.base(-5.2, -4.2, 5.2, 4.2, .3); b.hip(-4.5, -3.5, 4.5, 3.5, 3.9, 28, 1, .12);
  }, ["土楼", "客家", "圆楼", "围攻", "福建"]),

  reg("窑洞·靠崖窑·三孔·崖高8m", "陕北靠崖窑洞：13.5m 宽、8m 高、12m 进深的实心崖体，正面三孔窑洞（每孔 3.0m 宽、拱顶 3.9m 的半椭圆拱，深 9m 的盲洞，窑脸墙厚 0.2 上留 1.0m 门、0.9m 窗和拱形亮子），前面 4m 深 0.3m 高的窑前平台带 3m 宽踏步，窑洞内空间可进，黄土高原、抗战和农村戏", "中式", b => {
    for (const c of [-4.5, 0, 4.5]) {
      b.archBlock(c - 2.25, c + 2.25, 0, 8, -6, 6, c, 1.5, 2.4, 3.9, 10); b.box("wall", c, 1.95, -3, 3, 3.9, .3);
      b.wall("x", 5.9, c - 1.5, c + 1.5, 0, 2.4, .2, [door(c - .75, 1, 2.1), win(c + .75, .9, .9, 1.1)]);
    }
    b.base(-6.75, 6, 6.75, 10, .3); b.steps(0, 10, "+z", 3, .3);
  }, ["窑洞", "陕北", "黄土", "靠崖"]),

  reg("毡房·蒙古包·直径6m·高3.8m", "蒙古包（毡房）：圆形、墙径 6.0m、墙高 2.0m（正面一个 1.2m 宽 1.95m 高的门洞，人能直接走进去）、16 段圆弧墙，锥形毡顶从墙顶 2.0m 升到 3.6m、顶上直径 1.6m 的天窗圈（中间敞开），四根 0.15 径的中柱撑着天窗圈，出檐 0.5，草原、游牧和边疆戏", "中式", b => {
    const N = 16;
    b.cyl("floor", 0, 0, 0, .1, 3, N); ringWall(b, "wall", 3, .12, 0, 2, N, i => i === 0 ? 1.95 : undefined);
    cone(b, "roof", 3.5, 2, .75, 3.6, N, .08); ringWall(b, "roof", .75, .1, 3.4, 3.8, N);
    for (const x of [-1, 1]) for (const z of [-1, 1]) b.cyl("struct", x, z, .1, 3.4, .07, 8);
  }, ["毡房", "蒙古包", "草原", "游牧"]),

  reg("徽派民居·三合天井·马头墙·两层", "徽派天井民居：12m×11m、外墙厚 0.4 高 6.6（正面一扇 1.8m 门、两扇 0.6m×0.9m 高窗，后墙三扇高窗），两侧山墙顶做五级阶梯马头墙（最高 2.5m），中间 4m×3m 天井，两层（层高 3.0），前后各一个敞厅对着天井、左右各一间通长厢房（隔墙各开两个门洞），左厢房内一道直跑楼梯上二层，屋面向天井倾斜（四水归堂、坡度约 15°），江南、徽州古宅的院落戏", "中式", b => {
    const X = 6, Z = 5.5, hw = 6.6, door2 = (c: number) => door(c, 1.2, 2.1);
    b.slab(-X, -Z, X, Z, SLAB, SLAB);
    b.wall("x", Z, -X, X, SLAB, hw, .4, [door(0, 1.8, 2.7), win(-3.6, .6, .9, 4.2), win(3.6, .6, .9, 4.2)]); b.wall("x", -Z, -X, X, SLAB, hw, .4, [-3.6, 0, 3.6].map(c => win(c, .6, .9, 4.2)));
    for (const x of [-X, X]) { b.wall("z", x, -Z, Z, SLAB, hw, .4); for (const [za, zb, h] of [[-5.3, -3.2, .9], [-3.2, -1.3, 1.7], [-1.3, 1.3, 2.5], [1.3, 3.2, 1.7], [3.2, 5.3, .9]] as [number, number, number][]) b.box("wall", x, SLAB + hw + h / 2, (za + zb) / 2, .4, h, zb - za); }
    b.slab(-X, -Z, X, Z, FH + SLAB, SLAB, [[-2, -1.5, 2, 1.5], [-4.6, -5.2, -3.6, .2]]);
    for (const y of [SLAB, FH + SLAB]) for (const x of [-2, 2]) b.wall("z", x, -5.3, 5.3, y, CLEAR, PT, [door2(3.4), door2(-3.4)]);
    b.flight(-4.1, -5, "+z", SLAB, 18, 1, FH / 18, .28);
    b.pent([-X + .2, -Z + .2, X - .2, Z - .2], hw, [-2.2, -1.7, 2.2, 1.7], 5.4, .12);
  }, ["徽派", "天井", "马头墙", "江南", "古宅"]),

  reg("农家小院·三间正房·东西厢房·院墙柴门", "北方农家小院：15m×17m 院子，北面一明两暗三间正房（每间 3.6m、土坯墙厚 0.5 高 3.0、台基 0.3、一门两窗、两道 0.3 厚隔墙各开 1.0m 门、25° 硬山屋面），东西各一间 3m×6m 厢房（25° 悬山屋面、各一门一窗），南面 1.8m 高 0.4 厚的院墙带 1.8m 宽的柴门，抗战、年代和乡村戏", "中式", b => {
    b.base(-5.9, -6, 5.9, .6, .3); b.steps(0, .6, "+z", 1.5, .3);
    b.wall("x", -.1, -5.4, 5.4, .3, 3, .5, [door(0, 1.2, 2.1), win(-3.6, 1.2, 1.2, 1), win(3.6, 1.2, 1.2, 1)]); b.wall("x", -5.5, -5.4, 5.4, .3, 3, .5, [win(-3.6, .9, .9, 1.4), win(3.6, .9, .9, 1.4)]);
    for (const x of [-5.4, 5.4]) b.wall("z", x, -5.5, -.1, .3, 3, .5); for (const x of [-1.8, 1.8]) b.wall("z", x, -5.3, -.3, .3, 3, .3, [door(-2.8, 1, 2)]);
    b.roofGable(-5.4, -5.5, 5.4, -.1, 3.3, 25, .6, .15, "x");
    for (const s of [-1, 1]) {
      const xi = s * 4.5, xo = s * 7.5, a = lo(xi, xo), e = hi(xi, xo);
      b.base(a - .3, .7, e + .3, 7.3, .3); b.wall("z", xi, 1, 7, .3, 2.7, .4, [door(4, 1, 2), win(2.2, .9, .9, 1.1)]); b.wall("z", xo, 1, 7, .3, 2.7, .4); for (const z of [1, 7]) b.wall("x", z, a, e, .3, 2.7, .4);
      b.roofGable(a, 1, e, 7, 3, 25, .5, .4, "z");
    }
    b.wall("x", 11, -7.5, 7.5, 0, 1.8, .4, [door(0, 1.8, 1.8)]); for (const x of [-7.5, 7.5]) b.wall("z", x, 7.3, 11, 0, 1.8, .4);
  }, ["农家", "小院", "土坯", "乡村", "抗战"]),

  reg("渔村·栈桥与三间高脚屋·桥面宽2.4m", "渔村：24m 长、2.4m 宽的木栈桥（桥面标高 1.8、每 3m 一排双桩、一侧 0.9m 栏杆、岸端一组 2.4m 宽 12 级踏步），桥一侧并排三间 4.5m×5m 的高脚木屋（各四根桩、板墙厚 0.1 高 2.4、门开向栈桥、28° 悬山屋面），渔民、走私、海边追逐和海岸线戏", "中式", b => {
    const y1 = 1.8;
    b.slab(-12, -1.2, 12, 1.2, y1, .15, undefined, "floor"); for (let x = -12; x <= 12.01; x += 3) for (const z of [-1, 1]) b.cyl("struct", x, z, 0, y1, .15, 8);
    b.rail(-12, 1.2, 12, 1.2, y1, .9); b.flight(-12 - 12 * .3, 0, "+x", 0, 12, 2.4, y1 / 12, .3, "base");
    for (const xc of [-6, 0, 6]) {
      const x0 = xc - 2.25, x1 = xc + 2.25, z0 = -6.2;
      b.slab(x0, z0, x1, -1.2, y1, .15, undefined, "floor"); for (const x of [x0 + .3, x1 - .3]) for (const z of [z0 + .3, -1.5]) b.cyl("struct", x, z, 0, y1, .13, 8);
      b.wall("x", z0, x0, x1, y1, 2.4, .1, [win(xc, 1.2, 1, 1)]); b.wall("x", -1.2, x0, x1, y1, 2.4, .1, [door(xc, .9, 2)]); for (const x of [x0, x1]) b.wall("z", x, z0, -1.2, y1, 2.4, .1, [win(-3.7, 1, 1, 1)]);
      b.roofGable(x0, z0, x1, -1.2, y1 + 2.4, 28, .5, .4, "x");
    }
  }, ["渔村", "栈桥", "海边", "高脚屋"]),

  reg("木屋·原木小屋·8m×6m·带门廊", "原木小屋：8m×6m、石基 0.5 高、原木墙厚 0.25 高 2.6（正面一扇 0.9m 门、两扇窗，其余各一扇窗，四角每 0.33m 一层交错伸出的木头端部共 32 根）、前面 8m×2.2m 带两根 0.3 方柱的门廊（三级踏步）、30° 悬山屋面覆盖门廊、东山墙外一座 1.0m×1.2m 的石烟囱、后半间带 3m 深的阁楼和一架斜梯，林中小屋、恐怖片和西部片的经典场景", "欧式", b => {
    b.base(-4.4, -3.4, 4.4, 3.4, .5); b.slab(-4.4, 3.4, 4.4, 5.6, .5, .2, undefined, "floor"); b.steps(0, 5.6, "+z", 1.5, .5);
    b.wall("x", 3, -4, 4, .5, 2.6, .25, [door(0, .9, 2), win(-2.5, 1, 1.2, 1), win(2.5, 1, 1.2, 1)]); b.wall("x", -3, -4, 4, .5, 2.6, .25, [win(0, 1, 1.2, 1)]); for (const x of [-4, 4]) b.wall("z", x, -3, 3, .5, 2.6, .25, [win(0, 1, 1.2, 1)]);
    for (let j = 0; j < 8; j++) { const y = .5 + .165 + j * .33; for (const sx of [-1, 1]) for (const sz of [-1, 1]) if (j % 2) b.box("struct", sx * 4, y, sz * 3.2, .3, .3, .5); else b.box("struct", sx * 4.2, y, sz * 3, .5, .3, .3); }
    for (const x of [-3.6, 3.6]) b.col(x, 5.4, .7, 3.1, .3); b.beamH("x", 5.4, -3.8, 3.8, 3.1, .3, .3);
    b.box("base", 5, 3.1, 0, 1, 6.2, 1.2);
    b.slab(-4, -3, 4, 0, 3.1, .15, [-3.8, -2.9, -.7, -2.2]); b.flight(-3.6, -2.55, "+x", .5, 13, .8, 2.6 / 13, .22);
    b.roofGable(-4, -3, 4, 5.6, 3.1, 30, .6, .6, "x");
  }, ["木屋", "原木", "林中", "恐怖", "西部"]),

  reg("谷仓·人字折坡屋顶·12m×24m·含阁楼", "农场谷仓：12m×24m、墙高 3.2、折坡（人字双折）屋面（下坡 62°、上坡 20°、屋脊高 7.8、出檐 0.5），前山墙一扇 3.0m 宽 3.0m 高的大推拉门，两长墙各三个洞口（两扇 0.9m 窗、一扇 1.2m 侧门），后半 12m×9.5m 的阁楼层（楼板标高 3.35，楼梯洞口 1.2m×3.5m，一部 1.0m 宽陡梯上阁楼），美国乡村、西部和恐怖片的农场场景", "欧式", b => {
    const W = 6, L = 12, ey = 3.35, kx = 4.5, ky = 6.2, ry = 7.8;
    b.slab(-W, -L, W, L, .15, .15);
    for (const s of [-1, 1]) b.wall("z", s * W, -L, L, .15, 3.2, .25, [win(-8, .9, .9, 1.5), win(8, .9, .9, 1.5), door(0, 1.2, 2.1)]);
    b.wall("x", L, -W, W, .15, 3.2, .25, [door(0, 3, 3)]); b.wall("x", -L, -W, W, .15, 3.2, .25);
    for (const [zs, n] of [[L, 1], [-L, -1]] as [number, number][]) for (const [zz, nn] of [[zs, n], [zs - n * .25, -n]] as [number, number][]) { b.quad4("wall", [-W, ey, zz], [W, ey, zz], [kx, ky, zz], [-kx, ky, zz], [0, 0, nn]); b.tri3("wall", [-kx, ky, zz], [kx, ky, zz], [0, ry, zz], [0, 0, nn]); }
    for (const s of [-1, 1]) { b.strut("roof", [s * 6.5, 2.4, 0], [s * 4.5, 6.2, 0], 24.8, .15); b.strut("roof", [s * 4.5, 6.2, 0], [0, 7.8, 0], 24.8, .15); }
    b.box("roof", 0, 7.9, 0, .4, .2, 24.8);
    b.slab(-W, -L, W, -2.5, ey, .2, [4.4, -6.9, 5.6, -3.4]); b.flight(5, -3.5, "-z", .15, 16, 1, 3.2 / 16, .22);
  }, ["谷仓", "农场", "西部", "恐怖"]),

  reg("傣家竹楼·高脚·四坡陡屋顶·6m×7m", "傣家竹楼：6m×7m 的主屋架在 2.6m 高的 20 根细柱（径 0.24、间距 1.5×1.75）上，竹板墙厚 0.08 高 2.0（正面一扇 0.9m 门、两侧各一扇窗），前面 2.2m 深带栏杆的晒台，晒台一端一部 1.0m 宽 14 级竹梯，40° 四坡陡屋面出檐 1.6（屋脊高约 7.1m），热带山寨和异域风情戏", "异域", b => {
    const y1 = 2.6;
    for (let x = -3; x <= 3.01; x += 1.5) for (let z = -3.5; z <= 3.51; z += 1.75) b.cyl("struct", x, z, 0, y1, .12, 8);
    b.slab(-3.3, -3.8, 3.3, 3.8, y1, .15, undefined, "floor"); b.slab(-3.3, 3.8, 1, 5.7, y1, .15, undefined, "floor"); for (const x of [-3.2, .9]) b.cyl("struct", x, 5.6, 0, y1, .12, 8);
    b.wall("x", 3.5, -3, 3, y1, 2, .08, [door(0, .9, 1.8), win(-2, 1, .9, .9), win(2, 1, .9, .9)]); b.wall("x", -3.5, -3, 3, y1, 2, .08, [win(0, 1, .9, .9)]); for (const x of [-3, 3]) b.wall("z", x, -3.5, 3.5, y1, 2, .08, [win(0, 1, .9, .9)]);
    b.rail(-3.3, 5.7, 1, 5.7, y1); b.rail(-3.3, 3.8, -3.3, 5.7, y1); b.rail(1, 3.8, 1, 5.7, y1);
    b.flight(-1.2, 5.7 + 14 * .28, "-z", 0, 14, 1, y1 / 14, .28);
    b.hip(-3, -3.5, 3, 3.5, y1 + 2, 40, 1.6, .12);
  }, ["竹楼", "傣家", "热带", "高脚屋"]),
];

function lo(a: number, b: number) { return Math.min(a, b); }
function hi(a: number, b: number) { return Math.max(a, b); }
