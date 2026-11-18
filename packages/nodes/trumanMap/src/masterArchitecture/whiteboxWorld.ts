import type { AssetTheme } from "../sceneDocument";
import { CLEAR, DEG, FH, SLAB, WT, door, win, type Op, type Rect } from "./whitebox";
import { parapet } from "./whiteboxBuildings";
import { facade } from "./whiteboxCity";
import { whiteAnc, type AB } from "./whiteboxAncientKit";
import { cone } from "./whiteboxRegional";
import type { ArchitecturePrototype } from "./structures";

// 建筑白模·欧式、日式与西部：乔治亚联排、哥特教堂、城堡、庄园主宅、日式町屋、天守阁、神社、武家长屋门、西部小镇主街。
// 欧式和西部归「欧式」主题，日式归「日式」主题；层高、洞口和台阶尺寸沿用白模统一约定。
const tan = (d: number) => Math.tan(d * DEG);
const lo = Math.min, hi = Math.max;
const mk = (cat: string, theme: AssetTheme) => (name: string, what: string, build: (b: AB) => void, tags: string[]) => whiteAnc(`白模·${cat}·${name}`, `白模预演${cat}建筑：${what}；原点在平面中心，+z 为正面，地面标高 0`, theme, build, [cat, ...tags]);
const eu = mk("欧式", "欧式"), jp = mk("日式", "日式"), wn = mk("西部", "欧式");

/** 四面收分的实心台（石垣）：外框 o 在 yO、内框 i 在 yI，含顶面和底面。 */
export function prismoid(b: AB, key: string, o: Rect, yO: number, i: Rect, yI: number) {
  const [ox0, oz0, ox1, oz1] = o, [ix0, iz0, ix1, iz1] = i;
  b.quad4(key, [ix0, yI, iz0], [ix1, yI, iz0], [ix1, yI, iz1], [ix0, yI, iz1], [0, 1, 0]); b.quad4(key, [ox0, yO, oz0], [ox1, yO, oz0], [ox1, yO, oz1], [ox0, yO, oz1], [0, -1, 0]);
  b.quad4(key, [ox0, yO, oz1], [ox1, yO, oz1], [ix1, yI, iz1], [ix0, yI, iz1], [0, .5, 1]); b.quad4(key, [ox0, yO, oz0], [ox1, yO, oz0], [ix1, yI, iz0], [ix0, yI, iz0], [0, .5, -1]);
  b.quad4(key, [ox0, yO, oz0], [ox0, yO, oz1], [ix0, yI, iz1], [ix0, yI, iz0], [-1, .5, 0]); b.quad4(key, [ox1, yO, oz0], [ox1, yO, oz1], [ix1, yI, iz1], [ix1, yI, iz0], [1, .5, 0]);
}

export const whiteWorldDesigns: ArchitecturePrototype[] = [
  eu("乔治亚联排·五户·四层·台阶入口", "英式乔治亚联排住宅：五户并立、每户 5.4m×10m、1.2m 高的台基（每户门前一组 1.3m 宽 7 级台阶）上四层（层高 3.0），正面每户一扇 1.1m 门加一扇窗、上三层每户两扇 1.2m×2.0m 窗，户间承重墙 0.2、每户两跑直梯贴户墙（上下层左右交替），平屋面 1.0m 女儿墙加檐口线脚和六排烟囱，伦敦、爱丁堡和十九世纪城市戏", b => {
    const hx = 5.4, n = 5, X = hx * n / 2, Z = 5, y0 = 1.2, hs = [0, 1, 2, 3, 4], cx = (i: number) => -X + hx * (i + .5), yk = (k: number) => y0 + k * FH, off = (j: number) => j % 2 === 0 ? 2 : -2;
    b.base(-X, -Z, X, Z, y0);
    for (const i of hs) b.flight(cx(i) - 1.35, Z + 7 * .3, "-z", 0, 7, 1.3, y0 / 7, .3, "base");
    for (let k = 0; k <= 4; k++) {
      const y = yk(k);
      if (k) b.slab(-X, -Z, X, Z, y, SLAB, k < 4 ? hs.map(i => [cx(i) + off(k - 1) - .55, -4.6, cx(i) + off(k - 1) + .55, .7] as Rect) : undefined, k === 4 ? "roof" : "floor");
      if (k === 4) { parapet(b, -X, -Z, X, Z, y); for (let m = 0; m <= n; m++) for (const z of [-3, 3]) b.box("wall", -X + hx * m, y + 1.5, z, .6, 3, 1.2); b.box("base", 0, y + .15, Z + .15, 2 * X + .4, .3, .5); break; }
      facade(b, "x", Z, -X, X, y, CLEAR, WT, hs.flatMap(i => k === 0 ? [door(cx(i) - 1.35, 1.1, 2.4), win(cx(i) + 1.35, 1.2, 1.8, .6)] : [win(cx(i) - 1.35, 1.2, 2, .5), win(cx(i) + 1.35, 1.2, 2, .5)]));
      facade(b, "x", -Z, -X, X, y, CLEAR, WT, hs.flatMap(i => [win(cx(i) - 1.35, 1.2, 1.5, .8), win(cx(i) + 1.35, 1.2, 1.5, .8)]));
      for (let m = 0; m <= n; m++) b.wall("z", -X + hx * m, -Z + .1, Z - .1, y, CLEAR, WT);
      if (k < 3) for (const i of hs) b.flight(cx(i) + off(k), -4.5, "+z", y, 18, 1.1, FH / 18, .28);
    }
  }, ["联排", "乔治亚", "伦敦", "城市"]),

  eu("哥特教堂·三廊式·双塔·长36m×宽19m·塔高34m", "哥特教堂：三廊式、总长 36m、中廊净宽 10m 墙高 12.3（上段每侧三扇 1.0m×3.0m 高窗）、两侧廊宽 4m 外墙高 6.5（每侧五扇 1.0m×3.6m 窄窗）、中廊与侧廊之间 12 根径 0.8 的圆柱加 1.0m 高的拱廊梁，前面两座 6m×6m 的方塔（墙厚 0.8、高 26、四坡尖顶 62° 到 32m、塔刹顶到 34m，塔内空腔、门开向中廊），两塔之间的山门 3.0m×4.5m 大门加山花，52° 中廊屋面（脊高 18.7）、侧廊披檐，每侧七组扶壁加飞扶壁，屋架每 4m 一榀，中世纪、婚礼、追捕和庇护所戏", b => {
    const y0 = .3, tp = tan(52), yN = y0 + 12;
    b.slab(-9.4, -18.4, 9.4, 12.4, y0, .3);
    for (const s of [-1, 1]) {
      b.wall("z", s * 9, -18, 6, y0, 6.5, .6, [-15, -11, -7, -3, 1].map(c => win(c, 1, 3.6, 1.5)));
      b.wall("z", s * 5, -18, 6, y0 + 6.2, 5.8, .8, [-14, -8, -2].map(c => win(c, 1, 3, 1.2))); b.beamH("z", s * 5, -18, 6, y0 + 6.2, .8, 1);
      for (let z = -16; z <= 4; z += 4) { b.cyl("struct", s * 5, z, y0, y0 + 6.2, .4, 12); b.box("wall", s * 9.8, y0 + 3.25, z, .8, 6.5, 1); b.strut("wall", [s * 9.9, y0 + 6.2, z], [s * 5.5, y0 + 10.2, z], .5, .7); }
      b.strut("roof", [s * 9.4, y0 + 6, -6.2], [s * 4.9, y0 + 8.4, -6.2], 24.4, .15);
      const x0 = s < 0 ? -9 : 3, x1 = x0 + 6, xc = (x0 + x1) / 2;
      b.wall("x", 12, x0, x1, y0, 26, .8, [win(xc, .8, 2.4, 14), win(xc, 1.2, 3, 20)]); b.wall("x", 6, x0, x1, y0, 26, .8, [door(xc, 1.5, 2.8)]); for (const x of [x0, x1]) b.wall("z", x, 6, 12, y0, 26, .8);
      b.slab(x0, 6, x1, 12, y0 + 26, .3); b.hip(x0, 6, x1, 12, y0 + 26, 62, .3, .15); b.col(xc, 9, y0 + 26 + 3 * tan(62), y0 + 28.5 + 3 * tan(62), .3);
    }
    b.wall("x", -18, -9, 9, y0, 6.5, .6); b.wall("x", -18, -5, 5, y0 + 6.2, 5.8, .8, [win(0, 2, 4.5, 1)]); b.wall("x", 12, -3, 3, y0, 12, .8, [door(0, 3, 4.5), win(0, 2, 2.5, 8)]);
    for (let z = -16; z <= 4; z += 4) b.frame("x", z, -5, 5, yN, yN + 5 * tp);
    b.roofGable(-5, -18, 5, 6, yN, 52, .4, .3, "z"); b.roofGable(-3, 6, 3, 12, yN, 52, .3, .3, "z");
  }, ["教堂", "哥特", "双塔", "中世纪"]),

  eu("城堡·方形·四角圆塔·城门楼·主堡", "中世纪城堡：48m×48m 方形幕墙（厚 3.0 高 10，外侧垛口 1.0 加垛到 2.2、内侧 1.0m 女墙），四角各一座径 10m 高 16m 的实心圆塔（24 面，锥形尖顶到 23m），正面中间 12m×8m 高 14m 的城门楼（贯通 4.0m 宽、拱顶 5.25m 的拱门洞，顶有垛口），院中后部 14m×14m 七层主堡（层高 3.0、每层四面各两条箭窗、一座贴墙双跑楼梯、首层南面 1.8m 门，屋面垛口加四个角塔），攻城、守城、宫廷和奇幻王国的核心场景（圆塔塔身实心）", b => {
    const Wc = 22.5, H = 10, crn = (a: Rect) => a;
    b.box("wall", 0, H / 2, -Wc, 48, H, 3); for (const s of [-1, 1]) { b.box("wall", s * Wc, H / 2, 0, 3, H, 48); b.box("wall", s * 15, H / 2, Wc, 18, H, 3); }
    b.crenel("x", -23.6, -24, 24, H, .8, 1, 2.2, 2, 1.1); b.wall("x", -21.4, -21, 21, H, 1, .5);
    for (const s of [-1, 1]) { b.crenel("z", s * 23.6, -24, 24, H, .8, 1, 2.2, 2, 1.1); b.wall("z", s * 21.4, -21, 21, H, 1, .5); b.crenel("x", 23.6, s > 0 ? 6 : -24, s > 0 ? 24 : -6, H, .8, 1, 2.2, 2, 1.1); b.wall("x", 21.4, s > 0 ? 6 : -21, s > 0 ? 21 : -6, H, 1, .5); }
    b.archBlock(-6, 6, 0, 14, 19.5, 27.5, 0, 2, 3, 5.25, 12); b.crenel("x", 27.1, -6, 6, 14, .8, 1, 2.2, 2, 1.1); b.crenel("x", 19.9, -6, 6, 14, .8, 1, 2.2, 2, 1.1); for (const x of [-5.6, 5.6]) b.crenel("z", x, 19.5, 27.5, 14, .8, 1, 2.2, 2, 1.1);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const x = sx * Wc, z = sz * Wc; b.cyl("wall", x, z, 0, 16, 5, 24); cone(b, "roof", 5.8, 16, 0, 23, 24, .15, [x, z]); b.col(x, z, 23, 25.5, .2); }
    const kx = [-7, 7] as const;
    for (let k = 0; k <= 7; k++) {
      const y = k * FH + SLAB;
      b.slab(kx[0], -18, kx[1], -4, y, SLAB, k ? [b.coreRect(-4, -13, {}, -2.9, .92, 1.4)] : undefined, k === 7 ? "roof" : "floor");
      if (k === 7) { for (const z of [-18.2, -3.8]) b.crenel("x", z, -7.2, 7.2, y, .5, 1, 2.2, 1.8, 1); for (const x of [-6.8, 6.8]) b.crenel("z", x, -17.5, -4.5, y, .5, 1, 2.2, 1.8, 1); for (const x of [-6.6, 6.6]) for (const z of [-17.6, -4.4]) { b.cyl("wall", x, z, y, y + 4.5, 1.3, 12); cone(b, "roof", 1.8, y + 4.5, 0, y + 6.5, 12, .1, [x, z]); } break; }
      facade(b, "x", -4, kx[0], kx[1], y, CLEAR, .8, k ? [win(-3.5, .4, 1.2, 1), win(3.5, .4, 1.2, 1)] : [door(0, 1.8, 2.4), win(-4.5, .4, 1.2, 1), win(4.5, .4, 1.2, 1)]); facade(b, "x", -18, kx[0], kx[1], y, CLEAR, .8, [win(-3.5, .4, 1.2, 1), win(3.5, .4, 1.2, 1)]);
      for (const x of kx) facade(b, "z", x, -18, -4, y, CLEAR, .8, [win(-14.5, .4, 1.2, 1), win(-8, .4, 1.2, 1)]);
      b.doglegCore(-4, -13, y, { window: false });
    }
    void crn;
  }, ["城堡", "中世纪", "攻城", "宫廷", "奇幻"]),

  eu("庄园主宅·三层·两翼·柱廊门厅", "欧式庄园主宅：主楼 24m×12m 三层（层高 3.0、每层七扇 1.5m×2.1m 的窗、首层中间 2.4m 大门、中央 3m×6m 双跑楼梯间）、22° 四坡屋面带四根烟囱，正面 12m 宽的门厅台基 0.9m（五级台阶）上四根径 0.8 高 6.5 的圆柱加 18° 山花，两侧各一个 12m×10m 两层的侧翼（首层 1.5m 门与主楼相通、各有四扇窗、22° 四坡屋面），贵族、庄园、悬疑和十九世纪戏", b => {
    const yk = (k: number) => k * FH + SLAB;
    for (let k = 0; k <= 3; k++) {
      const y = yk(k);
      b.slab(-12, -6, 12, 6, y, SLAB, k ? [b.coreRect(0, -3, {}, -2.9, .92, 1.4)] : undefined, k === 3 ? "roof" : "floor");
      if (k === 3) break;
      facade(b, "x", 6, -12, 12, y, CLEAR, WT, k ? [-9, -6, -3, 0, 3, 6, 9].map(c => win(c, 1.5, 2.1, .5)) : [door(0, 2.4, 2.7), ...[-10.5, -7.5, -4.5, 4.5, 7.5, 10.5].map(c => win(c, 1.5, 2.1, .5))]);
      facade(b, "x", -6, -12, 12, y, CLEAR, WT, [-9, -6, -3, 3, 6, 9].map(c => win(c, 1.5, 2.1, .5)));
      for (const s of [-1, 1]) facade(b, "z", s * 12, -6, 6, y, CLEAR, WT, k ? [-3, 3].map(c => win(c, 1.2, 2, .6)) : [door(0, 1.5, 2.4)]);
      b.doglegCore(0, -3, y, { back: false });
    }
    for (const s of [-1, 1]) for (let k = 0; k <= 2; k++) {
      const y = yk(k), x0 = s < 0 ? -24 : 12, x1 = x0 + 12;
      b.slab(x0, -5, x1, 5, y, SLAB, undefined, k === 2 ? "roof" : "floor"); if (k === 2) { b.hip(x0, -5, x1, 5, y, 22, .6, .14); continue; }
      facade(b, "x", 5, x0, x1, y, CLEAR, WT, [-3, 3].map(c => win(s * 18 + c, 1.5, 2.1, .5))); facade(b, "x", -5, x0, x1, y, CLEAR, WT, [-3, 3].map(c => win(s * 18 + c, 1.5, 2.1, .5)));
      facade(b, "z", s * 24, -5, 5, y, CLEAR, WT, [win(-2.5, 1.2, 2, .6), win(2.5, 1.2, 2, .6)]); b.wall("z", s * 12, -5, 5, y, CLEAR, WT, [door(0, 1.5, 2.4)]);
    }
    b.hip(-12, -6, 12, 6, yk(3), 22, .8, .14); for (const x of [-8, 8]) for (const z of [-2.5, 2.5]) b.box("wall", x, yk(3) + 2, z, 1.2, 2.6, 1.2);
    b.base(-6, 6, 6, 10, .25); b.steps(0, 10, "+z", 5, .25); for (const x of [-4.5, -1.5, 1.5, 4.5]) b.cyl("struct", x, 8.5, .25, 7.4, .4, 12);
    b.beamH("x", 8.5, -6, 6, 8.2, .8, .8); b.gable(-6, 6.2, 6, 10, 8.2, 18, .3, .15, "roof", "z");
  }, ["庄园", "主宅", "贵族", "十九世纪"]),

  jp("町屋·三栋联排·两层·格子窗·切妻屋面", "日本京都町屋：三栋并立、每栋 5.4m×14m 的细长平面，首层净高 2.8（正面每户一扇 1.8m 门加一扇 2.0m 的格子窗）、二层净高 2.2（正面一扇 2.0m×0.7m 的虫笼窗），一层上方出 1.5m 深的下屋庇檐，每户一部 0.8m 宽的陡直楼梯（踏步 0.2×0.22），25° 切妻屋面（脊线沿 x、出檐 0.9），古都小巷、时代剧和日式街景", b => {
    const hw = 5.4, n = 3, X = hw * n / 2, Z = 7, hs = [0, 1, 2], cx = (i: number) => -X + hw * (i + .5), y2 = FH + SLAB;
    b.slab(-X, -Z, X, Z, SLAB, SLAB); b.slab(-X, -Z, X, Z, y2, SLAB, hs.map(i => [cx(i) + 1.6, -6.6, cx(i) + 2.4, -3.1] as Rect));
    facade(b, "x", Z, -X, X, SLAB, 2.8, .2, hs.flatMap(i => [door(cx(i) - 1.2, 1.8, 2.2), win(cx(i) + 1.3, 2, 1.6, .6)])); facade(b, "x", Z, -X, X, y2, 2.2, .2, hs.map(i => win(cx(i), 2, .7, .6)));
    facade(b, "x", -Z, -X, X, SLAB, 2.8, .2, hs.map(i => win(cx(i), 1.5, 1.2, .9))); facade(b, "x", -Z, -X, X, y2, 2.2, .2, hs.map(i => win(cx(i), 1.2, .7, .6)));
    for (let m = 0; m <= n; m++) { b.wall("z", -X + hw * m, -Z + .1, Z - .1, SLAB, 2.8, .2); b.wall("z", -X + hw * m, -Z + .1, Z - .1, y2, 2.2, .2); }
    for (const i of hs) b.flight(cx(i) + 2, -6.5, "+z", SLAB, 15, .8, FH / 15, .22);
    b.strut("roof", [0, 3.05, Z], [0, 2.6, Z + 1.5], 2 * X + .6, .1); b.roofGable(-X, -Z, X, Z, y2 + 2.2, 25, .9, .5, "x");
  }, ["町屋", "京都", "古都", "时代剧"]),

  jp("天守阁·石垣八米·五重五层·白壁", "日本城郭天守：24m 见方收分到 18m 的 8m 高石垣（四面收分的实心台），上面五层白壁塔身（边长 16、13、10.5、8.5、7m，层高 4.5、3.6、3.4、3.0、2.8），每层出 1.8m 的黑瓦腰檐（20°），首层 16m 见方墙厚 1.0 可进（南面 2.0m 门、四面小窗，楼板在 4.5m），顶层 25° 入母屋（歇山）屋面出檐 1.8，总高约 31m，战国、时代剧、攻城与决战", b => {
    prismoid(b, "base", [-12, -12, 12, 12], 0, [-9, -9, 9, 9], 8);
    const ws = [16, 13, 10.5, 8.5, 7], hs = [4.5, 3.6, 3.4, 3, 2.8], tp = tan(20);
    let y = 8; const w0 = 16;
    b.wall("x", 7.5, -8, 8, y, 4.5, 1, [door(0, 2, 2.7), win(-4.5, 1.2, 1.4, 1.5), win(4.5, 1.2, 1.4, 1.5)]); b.wall("x", -7.5, -8, 8, y, 4.5, 1, [win(0, 1.2, 1.4, 1.5)]); for (const x of [-7.5, 7.5]) b.wall("z", x, -7, 7, y, 4.5, 1, [win(0, 1.2, 1.4, 1.5)]);
    b.slab(-8, -8, 8, 8, y + 4.5, .3); void w0;
    ws.forEach((w, i) => {
      if (i) b.box("wall", 0, y + hs[i]! / 2, 0, w, hs[i]!, w);
      y += hs[i]!; const nx = ws[i + 1];
      if (nx) b.pent([-w / 2 - 1.8, -w / 2 - 1.8, w / 2 + 1.8, w / 2 + 1.8], y - .3, [-nx / 2, -nx / 2, nx / 2, nx / 2], y - .3 + (w / 2 + 1.8 - nx / 2) * tp); else b.roofXieshan(-w / 2, -w / 2, w / 2, w / 2, y, 25, 1.8, 1, "x");
    });
  }, ["天守阁", "城郭", "战国", "攻城"]),

  jp("神社·鸟居与拜殿·参道长12m", "日本神社：神明鸟居（两根径 0.56 高 5.0 的圆柱相距 4.5m、笠木 8.4m 长、贯梁 5.6m、中间一根额束）立在 z=+12，向北 12m 外是拜殿——1.0m 高的台基 10.8m×8.4m（三级 3m 宽正面台阶、三面 1.05m 栏杆）上面 9m×6m 的三间堂（8 根径 0.4 高 3.4 的圆柱、后墙和两山墙带窗、正面敞开），28° 入母屋大屋面出檐 1.8，节日、祭典、神隐和时代剧场景", b => {
    const zt = 12;
    for (const x of [-2.25, 2.25]) { b.cyl("struct", x, zt, 0, 5, .28, 12); b.box("base", x, .15, zt, .9, .3, .9); }
    b.box("struct", 0, 5.4, zt, 8.4, .35, .55); b.beamH("x", zt, -2.8, 2.8, 4.1, .28, .3); b.col(0, zt, 4.1, 5.2, .25);
    b.base(-5.4, -4.2, 5.4, 4.2, 1); b.steps(0, 4.2, "+z", 3, 1);
    b.colRow("x", 3, -4.5, 4.5, 3, 1, 4.4, .2); b.colRow("x", -3, -4.5, 4.5, 3, 1, 4.4, .2);
    b.wall("x", -3, -4.5, 4.5, 1, 3.4, .2, [win(0, 1.5, 1.2, 1.4)]); for (const x of [-4.5, 4.5]) b.wall("z", x, -3, 3, 1, 3.4, .2, [win(0, 1.2, 1.2, 1.4)]);
    for (const z of [-3, 3]) b.beamH("x", z, -4.5, 4.5, 4.4, .3, .4); for (const x of [-4.5, 4.5]) b.beamH("z", x, -3, 3, 4.4, .3, .4);
    b.rail(-5.4, 4.2, -1.8, 4.2, 1); b.rail(1.8, 4.2, 5.4, 4.2, 1); for (const x of [-5.4, 5.4]) b.rail(x, -4.2, x, 4.2, 1); b.rail(-5.4, -4.2, 5.4, -4.2, 1);
    b.roofXieshan(-4.5, -3, 4.5, 3, 4.4, 28, 1.8, 1.2, "x");
  }, ["神社", "鸟居", "拜殿", "祭典"]),

  jp("长屋门·武家屋敷门·面阔15m·含两侧土塀", "日本武家屋敷长屋门：15m×4.8m 的一层长屋、台基 0.3、墙厚 0.3 高 3.6，中间 3.0m 宽 3.2m 高的贯通门洞（前后墙各留洞口、通道两侧是 0.3 厚的隔墙），左右两间各三扇 1.5m 的格子窗，22° 切妻屋面出檐 0.9、山墙挑出 0.6，两侧各接 6m 长 2.4m 高 0.5 厚带瓦顶的土塀，武士宅邸、时代剧和对峙戏", b => {
    b.base(-7.5, -2.7, 7.5, 2.7, .3);
    b.wall("x", 2.4, -7.5, 7.5, .3, 3.6, .3, [door(0, 3, 3.2), win(-5.5, 1.5, 1.5, 1.2), win(-3.2, 1.5, 1.5, 1.2), win(3.2, 1.5, 1.5, 1.2), win(5.5, 1.5, 1.5, 1.2)]); b.wall("x", -2.4, -7.5, 7.5, .3, 3.6, .3, [door(0, 3, 3.2), win(-5.5, 1.2, 1.2, 1.3), win(5.5, 1.2, 1.2, 1.3)]);
    for (const x of [-7.5, 7.5]) b.wall("z", x, -2.4, 2.4, .3, 3.6, .3); for (const x of [-1.5, 1.5]) b.wall("z", x, -2.4, 2.4, .3, 3.6, .3, [door(0, 1, 2.1)]);
    b.roofGable(-7.5, -2.4, 7.5, 2.4, 3.9, 22, .9, .6, "x");
    for (const [a, c] of [[7.5, 13.5], [-13.5, -7.5]] as [number, number][]) { b.wall("x", 0, a, c, 0, 2.4, .5); b.roofGable(a, -.4, c, .4, 2.4, 25, .3, 0, "x", .1, false); }
  }, ["长屋门", "武家", "时代剧", "土塀"]),

  wn("西部小镇主街·两排各三间·街宽14m·长24m", "西部小镇主街：长 24m、街宽 14m（两排各三间 8m×12m 的二层木屋，首层净高 3.0、二层净高 3.0），前面 2.5m 深的 0.3m 高木栈道带 4m 一根的柱子和 4° 披檐，正面 8m 宽的假立面（高到 8.4m、前面一扇 1.8m 门两扇 1.4m 窗、二楼三扇 1.0m 窗，立面顶带线脚），20° 双坡屋面（脊线沿 z、藏在假立面后），每间贴侧墙一部 1.0m 宽陡梯上二楼，枪战、决斗、劫案和西部片的主街", b => {
    for (const s of [-1, 1] as const) {
      const zf = s * 9.5, zb = s * 21.5, zlo = lo(zf, zb), zhi = hi(zf, zb);
      b.base(-12, lo(s * 7, zf), 12, hi(s * 7, zf), .3);
      for (let x = -12; x <= 12.01; x += 4) b.col(x, s * 7.2, .3, 3.6, .25);
      b.strut("roof", [0, 4, zf], [0, 3.65, s * 6.9], 24.6, .12);
      for (let k = 0; k <= 3; k++) b.wall("z", -12 + 8 * k, zlo, zhi, .3, 6.2, .3);
      for (let i = 0; i < 3; i++) {
        const x0 = -12 + i * 8, x1 = x0 + 8, cx = x0 + 4;
        b.slab(x0, zlo, x1, zhi, .3, .3); b.slab(x0, zlo, x1, zhi, 3.5, .2, [[x0 + .7, lo(s * 16.3, s * 21.4), x0 + 1.7, hi(s * 16.3, s * 21.4)]]);
        facade(b, "x", zf, x0, x1, .3, 3, .3, [door(cx, 1.8, 2.1), win(cx - 2.6, 1.4, 1.6, .9), win(cx + 2.6, 1.4, 1.6, .9)]); facade(b, "x", zf, x0, x1, 3.5, 3, .3, [-2, 0, 2].map(c => win(cx + c, 1, 1.4, .7)));
        b.box("wall", cx, 7.45, zf, 8, 1.9, .3); b.box("base", cx, 8.5, zf + s * .1, 8.4, .2, .5);
        b.wall("x", zb, x0, x1, .3, 3, .3, [door(cx + 2, 1, 2.1)]); b.wall("x", zb, x0, x1, 3.5, 3, .3, [win(cx, 1, 1.2, .8)]);
        b.flight(x0 + 1.2, zb - s * .6, s > 0 ? "-z" : "+z", .3, 18, 1, 3.2 / 18, .28);
        b.roofGable(x0, zlo, x1, zhi, 6.5, 20, .3, .15, "z", .12);
      }
    }
  }, ["小镇", "主街", "枪战", "决斗", "假立面"]),
];
