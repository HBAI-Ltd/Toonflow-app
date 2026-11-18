import type { AssetTheme } from "../sceneDocument";
import { CLEAR, FH, SLAB, WT, door, win, type Op, type Rect } from "./whitebox";
import { facade } from "./whiteboxCity";
import { prismoid } from "./whiteboxWorld";
import { whiteAnc, type AB } from "./whiteboxAncientKit";
import { cone, ringSlab, ringWall } from "./whiteboxRegional";
import type { ArchitecturePrototype } from "./structures";

// 建筑白模·古典世界与欧洲中世纪街屋：希腊神庙、罗马竞技场、凯旋门、希腊剧场、埃及神庙与金字塔、玛雅阶梯金字塔、通天塔，以及都铎联排和荷兰运河联排。
// 古典石构建筑按真实柱径、柱高、檐部比例做成实心体量；椭圆和半圆的看台、外墙用圆形函数（可压成椭圆、可只画一段弧）一整面一整面地画。
const mk = (cat: string, theme: AssetTheme) => (name: string, what: string, build: (b: AB) => void, tags: string[]) => whiteAnc(`白模·${cat}·${name}`, `白模预演${cat}建筑：${what}；原点在平面中心，+z 为正面，地面标高 0`, theme, build, [cat, ...tags]);
const gr = mk("古典", "欧式"), eg = mk("古典", "异域"), eu = mk("欧式", "欧式");

export const whiteClassicalDesigns: ArchitecturePrototype[] = [
  gr("希腊神庙·多立克式·周柱廊·六柱×十三柱", "希腊多立克式神庙：三级各 0.3m 的台阶（顶面 21.0m×45.6m、高 0.9m）上一圈 34 根径 1.4 高 8.0 的圆柱（正反面各 6 根、两侧各 11 根、柱距 3.6m、柱顶带 1.7m 见方的柱头块），上承 1.6m 高的檐部（楣梁加檐壁），14° 双坡屋面（脊线沿 z、两端三角山花），中间内殿 10.8m×30m、墙厚 0.8（正面 3.6m 宽 6.8m 高的大门、门廊里两根径 1.2 的柱），古希腊、神话、古装史诗和祭祀戏", b => {
    for (const [w, d, y] of [[22.2, 46.8, .15], [21.6, 46.2, .45], [21, 45.6, .75]] as [number, number, number][]) b.box("base", 0, y, 0, w, .3, d);
    const y0 = .9, yt = y0 + 8, ye = yt + .4;
    const col = (x: number, z: number) => { b.cyl("struct", x, z, y0, yt, .7, 16); b.box("struct", x, yt + .2, z, 1.7, .4, 1.7); };
    for (const x of [-9, -5.4, -1.8, 1.8, 5.4, 9]) for (const z of [-21.6, 21.6]) col(x, z);
    for (let i = 1; i < 12; i++) for (const x of [-9, 9]) col(x, -21.6 + i * 3.6);
    for (const z of [-21.6, 21.6]) b.box("struct", 0, ye + .8, z, 19.8, 1.6, 1.4); for (const x of [-9, 9]) b.box("struct", x, ye + .8, 0, 1.4, 1.6, 44.2);
    for (const x of [-5.4, 5.4]) b.wall("z", x, -16, 14, y0, 10, .8); b.wall("x", -16, -5.4, 5.4, y0, 10, .8); b.wall("x", 14, -5.4, 5.4, y0, 10, .8, [door(0, 3.6, 6.8)]);
    for (const x of [-3, 3]) b.cyl("struct", x, 12.4, y0, yt, .6, 12);
    b.roofGable(-9.7, -22.3, 9.7, 22.3, ye + 1.6, 14, .5, .4, "z", .3);
  }, ["希腊", "神庙", "柱廊", "史诗"]),

  gr("罗马竞技场·椭圆·96m×76m·三层券拱", "罗马竞技场：椭圆外廓 96m×76m、外墙厚 3.0 分三层各 8m 高加 4m 高的顶层实墙（总高 28m），每层 48 个 3.0m 宽的拱洞（洞高 6.4、按矩形洞口表达）加层间线脚，内圈一道 4.5m 高的竞技台墙（两端各一个 2.9m 宽的出入口），三段斜坡看台（共抬升 18m、座席材质组），椭圆沙地场（径约 44m×35m），不含地下设施，古罗马、角斗士和历史史诗戏", b => {
    const N = 96, ex = { sc: [1, .79] as [number, number] };
    for (let k = 0; k < 3; k++) ringWall(b, "wall", 46.5, 3, k * 8, (k + 1) * 8, N, i => i % 2 ? k * 8 + 6.4 : undefined, [0, 0], ex);
    ringWall(b, "wall", 46.5, 3, 24, 28, N, undefined, [0, 0], ex); for (const y of [8, 16, 24]) ringSlab(b, "base", 44.9, 48.3, y + .15, .3, N, [0, 0], ex);
    ringWall(b, "wall", 22.5, .8, 0, 4.5, 48, i => i === 12 || i === 36 ? null : undefined, [0, 0], ex);
    for (const [r0, y0, r1, y1] of [[23.4, 4.5, 31, 10.5], [31, 10.5, 38.5, 16.5], [38.5, 16.5, 44.8, 22.5]] as [number, number, number, number][]) cone(b, "seat", r0, y0, r1, y1, N, .6, [0, 0], ex);
    ringSlab(b, "floor", 0, 22, .3, .3, 48, [0, 0], ex);
  }, ["罗马", "竞技场", "角斗士", "史诗"]),

  gr("罗马凯旋门·三洞·宽30m·高18m", "罗马凯旋门：30m 宽 9m 深 18.6m 高，中间一个 7.2m 宽的大拱洞（拱顶 10.6）、两侧各一个 3.6m 宽的小拱洞（拱顶 6.0），四根径 1.6 的半嵌柱（正反面各四根）、12–13.2m 的檐部、13.2–18m 的阁楼（正面凸出一块 18m×3.2m 的铭文板）和 0.6 厚的顶线脚，凯旋、游行和古罗马戏", b => {
    b.archBlock(-15, -5.7, 0, 12, -4.5, 4.5, -9.6, 1.8, 4.2, 6, 10); b.archBlock(-5.7, 5.7, 0, 12, -4.5, 4.5, 0, 3.6, 7, 10.6, 14); b.archBlock(5.7, 15, 0, 12, -4.5, 4.5, 9.6, 1.8, 4.2, 6, 10);
    b.box("struct", 0, 12.6, 0, 30.6, 1.2, 9.6); b.box("wall", 0, 15.6, 0, 28.8, 4.8, 8.4); b.box("base", 0, 15.8, 4.25, 18, 3.2, .3); b.box("struct", 0, 18.3, 0, 30.6, .6, 9.6);
    for (const x of [-11.7, -5.7, 5.7, 11.7]) for (const z of [-4.7, 4.7]) { b.cyl("struct", x, z, 0, 11.4, .8, 12); b.box("struct", x, 11.7, z, 1.9, .6, 1.9); }
  }, ["罗马", "凯旋门", "游行", "史诗"]),

  gr("希腊剧场·半圆观众席·径96m·两段看台", "希腊露天剧场：中央径 20m 的圆形乐池，朝 +z 一侧 190° 的半圆形斜坡看台（下段 r11–28m 升到 10m、中间 2m 宽的环形走道、上段 r30–47m 升到 23m、座席材质组）和 24m 高的看台后挡墙，-z 一侧 40m×14m 的舞台建筑（4.2m 高的舞台平台下一排 11 根径 0.8 的柱、后墙 9m 高带三扇 2.4m 门和两扇窗、平屋面），古希腊、悲剧演出和史诗戏", b => {
    const ex = { arc: [-95, 95] as [number, number] };
    ringSlab(b, "floor", 0, 10, .3, .3, 48);
    for (const [r0, y0, r1, y1] of [[11, .3, 28, 10], [30, 12, 47, 23]] as [number, number, number, number][]) cone(b, "seat", r0, y0, r1, y1, 72, Math.min(.5, y0), [0, 0], ex);
    cone(b, "floor", 28, 10, 30, 12, 72, .5, [0, 0], ex); ringWall(b, "wall", 47.5, 1, 0, 24, 72, undefined, [0, 0], ex);
    b.slab(-20, -26, 20, -12, 4.2, .4); for (let x = -18; x <= 18.1; x += 3.6) b.cyl("struct", x, -12.5, .3, 4, .4, 10);
    b.wall("x", -26, -20, 20, .3, 9, .8, [-12, 0, 12].map(c => door(c, 2.4, 3.6)).concat([-6, 6].map(c => win(c, 1.2, 1.6, 4.6)))); for (const x of [-20, 20]) b.wall("z", x, -26, -12, .3, 9, .8);
    b.slab(-20, -26, 20, -12, 9.4, .4, undefined, "roof");
  }, ["希腊", "剧场", "悲剧", "史诗"]),

  eg("埃及神庙·塔门·列柱厅·方尖碑·长42m", "埃及神庙：+z 端 30m 宽的塔门（两座 12m×6m 的收分塔体、高 22m、中间 6m 宽 15m 高的门道、门楣块到顶），门前一对 2.4m 见方收到 1.4m 的方尖碑（高 24m 含金字塔尖），门道后 24m×25m 的列柱厅（5×5 共 25 根径 2.2 高 12 的柱子、柱头块、厚 1.5 的外墙、0.8 厚的平屋面板，正面 3.6m 宽 7m 高的门），法老、神庙和古埃及史诗戏", b => {
    for (const s of [-1, 1]) prismoid(b, "wall", [s < 0 ? -15 : 3, -3, s < 0 ? -3 : 15, 3], 0, [s < 0 ? -13.8 : 4.2, -2.4, s < 0 ? -4.2 : 13.8, 2.4], 22);
    b.box("wall", 0, 18.5, 0, 6, 7, 5.4);
    for (const s of [-1, 1]) { prismoid(b, "struct", [s * 8 - 1.2, 7.8, s * 8 + 1.2, 10.2], 0, [s * 8 - .7, 8.3, s * 8 + .7, 9.7], 22); prismoid(b, "struct", [s * 8 - .7, 8.3, s * 8 + .7, 9.7], 22, [s * 8 - .05, 8.95, s * 8 + .05, 9.05], 24); }
    b.slab(-12.75, -31, 12.75, -6.5, .3, .3);
    for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) { const x = -9.6 + i * 4.8, z = -9.5 - j * 4.8; b.cyl("struct", x, z, .3, 12.3, 1.1, 12); b.box("struct", x, 12.8, z, 2.8, 1, 2.8); }
    b.slab(-12.75, -31, 12.75, -6.5, 14.1, .8, undefined, "roof");
    for (const x of [-12, 12]) b.wall("z", x, -31, -6.5, .3, 13.8, 1.5); b.wall("x", -30.5, -12.75, 12.75, .3, 13.8, 1.5); b.wall("x", -6.5, -12.75, 12.75, .3, 13.8, 1.5, [door(0, 3.6, 7)]);
  }, ["埃及", "神庙", "方尖碑", "法老"]),

  eg("埃及大金字塔·底边140m·高92m·三座陪葬小塔", "埃及大金字塔：140m 见方、高 92m 的实心方锥（塔尖 0.6m 见方），东侧（+x）一排三座 24m 见方高 16m 的陪葬小金字塔（间距 28m），大塔与小塔相距 2m；整组约 166m×64m（单个模型坐标不能超过正负 100m，所以按 1:1 只放得下一座大塔和小塔），沙漠、法老陵墓和古埃及远景戏，体量实心不含内部通道", b => {
    prismoid(b, "wall", [-83, -70, 57, 70], 0, [-13.3, -.3, -12.7, .3], 92);
    for (const z of [-28, 0, 28]) prismoid(b, "wall", [59, z - 12, 83, z + 12], 0, [70.7, z - .3, 71.3, z + .3], 16);
  }, ["金字塔", "埃及", "沙漠", "陵墓"]),

  eg("麦罗埃金字塔群·八座努比亚陡坡塔", "努比亚（麦罗埃）金字塔群：八座陡坡小金字塔（约 70° 的陡面，底边 8–14m、高 12–20m，两排各四座，东面各贴一座 3m×2m×2.5m 的祭祀小殿），整组约 64m×34m，沙漠、探险、古墓和奇幻废土戏", b => {
    const sz = [10, 12, 8, 14, 9, 11, 13, 10];
    sz.forEach((w, i) => { const x = -24 + (i % 4) * 16, z = i < 4 ? -9 : 9, h = w * 1.45; prismoid(b, "wall", [x - w / 2, z - w / 2, x + w / 2, z + w / 2], 0, [x - .2, z - .2, x + .2, z + .2], h); b.box("base", x + w / 2 + 1.4, 1.25, z, 3, 2.5, 2); });
  }, ["金字塔", "努比亚", "沙漠", "古墓"]),

  eg("玛雅阶梯金字塔·九层·神庙·高36m", "玛雅阶梯金字塔：九层实心台阶（底边 54m、每层高 3.0 缩进 3.0、顶层 6m 见方），正面一道 8m 宽的通天阶梯（90 级、踏步高 0.3 宽 0.267、顶到 27m 的平台），平台上 4.8m×4.4m 的神庙（墙厚 0.6 高 4.5、正面 1.6m 宽 3.0m 高的门洞、0.6 厚的平屋面板）和 3.6m 宽 3.0m 高的屋顶冠饰，丛林、祭祀和玛雅史诗戏", b => {
    for (let k = 0; k < 9; k++) { const w = 54 - 6 * k, y = k * 3 + 1.5; if (w <= 8) b.box("base", 0, y, 0, w, 3, w); else { for (const s of [-1, 1]) b.box("base", s * (w / 4 + 2), y, 0, (w - 8) / 2, 3, w); b.box("base", 0, y, (3 - w / 2) / 2, 8, 3, 3 + w / 2); } }
    b.flight(0, 27, "-z", 0, 90, 8, .3, 24 / 90, "stair");
    b.wall("x", 2.2, -2.4, 2.4, 27, 4.5, .6, [door(0, 1.6, 3)]); b.wall("x", -2.2, -2.4, 2.4, 27, 4.5, .6); for (const x of [-2.4, 2.4]) b.wall("z", x, -2.2, 2.2, 27, 4.5, .6);
    b.slab(-2.9, -2.7, 2.9, 2.7, 32.1, .6, undefined, "roof"); b.box("wall", 0, 33.6, 0, 3.6, 3, .5);
  }, ["玛雅", "金字塔", "丛林", "祭祀"]),

  eg("通天塔·三层·泥砖·底座60m×45m·高25m", "两河流域泥砖通天塔（金字形神塔）：三层实心台（60m×45m 高 9、36m×27m 高 7.5、18m×13.5m 高 4.5）加顶上 6m×5m 的神殿（墙厚 0.5 高 3.5、一扇 1.4m 门、平屋面），正面三道中轴阶梯（4m 宽 45 级、4m 宽 30 级、3m 宽 18 级），古巴比伦、神话和圣经史诗戏", b => {
    b.box("wall", 0, 4.5, 0, 60, 9, 45); b.box("wall", 0, 12.75, 0, 36, 7.5, 27); b.box("wall", 0, 18.75, 0, 18, 4.5, 13.5);
    b.flight(0, 36, "-z", 0, 45, 4, .2, .3, "stair"); b.flight(0, 21, "-z", 9, 30, 4, .25, .25, "stair"); b.flight(0, 11.25, "-z", 16.5, 18, 3, .25, .25, "stair");
    b.wall("x", 2.2, -3, 3, 21, 3.5, .5, [door(0, 1.4, 2.4)]); b.wall("x", -2.2, -3, 3, 21, 3.5, .5); for (const x of [-3, 3]) b.wall("z", x, -2.2, 2.2, 21, 3.5, .5); b.slab(-3.4, -2.6, 3.4, 2.6, 24.7, .4, undefined, "roof");
  }, ["巴比伦", "通天塔", "两河", "圣经"]),

  eu("都铎联排·悬挑二层·三栋·木构白墙", "英国都铎式联排：三栋并立、每栋 6m×8m，三层（净高 2.8、2.8、2.6）、二三层依次向前悬挑 0.6m（前墙在 z=4.0 / 4.6 / 5.2），正面每层白墙带深色木构架（三根立柱加楼面横梁）、首层一门一窗、上两层每户两扇窗，户间承重墙 0.2、每户两跑直梯贴户墙左右交替，50° 陡山花屋面（脊线沿 z、出檐 0.25）加一根烟囱，中世纪城镇、莎翁和奇幻城镇戏", b => {
    const hw = 6, n = 3, X = hw * n / 2, hs = [0, 1, 2], cx = (i: number) => -X + hw * (i + .5), zf = [4, 4.6, 5.2], ys = [SLAB, FH + SLAB, 2 * FH + SLAB], hh = [2.8, 2.8, 2.6];
    b.slab(-X, -4, X, 4, SLAB, SLAB);
    for (let f = 0; f < 3; f++) {
      const holes: Rect[] = f === 1 ? hs.map(i => [cx(i) + 1.8, -3.6, cx(i) + 2.8, 1.7] as Rect) : f === 2 ? hs.map(i => [cx(i) - 2.8, -3.6, cx(i) - 1.8, 1.7] as Rect) : [];
      if (f) b.slab(-X, -4, X, zf[f]!, ys[f]!, SLAB, holes.length ? holes : undefined);
      facade(b, "x", zf[f]!, -X, X, ys[f]!, hh[f]!, .3, hs.flatMap(i => f === 0 ? [door(cx(i) - 1.5, 1.1, 2.2), win(cx(i) + 1.2, 1.4, 1.2, .9)] : [win(cx(i) - 1.3, 1.2, 1.1, .8), win(cx(i) + 1.3, 1.2, 1.1, .8)]));
      facade(b, "x", -4, -X, X, ys[f]!, hh[f]!, .3, hs.map(i => win(cx(i), 1.2, 1.1, .8)));
      for (let m = 0; m <= n; m++) b.wall("z", -X + hw * m, -4, zf[f]!, ys[f]!, hh[f]!, .2);
      for (const i of hs) { for (const dx of [-2.9, -.1, 2.9]) b.box("struct", cx(i) + dx, ys[f]! + hh[f]! / 2, zf[f]! + .18, .16, hh[f]!, .12); if (f < 2) b.flight(cx(i) + (f === 0 ? 2.3 : -2.3), -3.5, "+z", ys[f]!, 18, .9, FH / 18, .28); }
      b.box("struct", 0, ys[f]! + hh[f]! + .1, zf[f]! + .18, 2 * X, .2, .12);
    }
    for (const i of hs) b.roofGable(cx(i) - hw / 2, -4, cx(i) + hw / 2, 5.2, ys[2]! + hh[2]!, 50, .25, .45, "z", .15);
    b.box("wall", cx(1) + 1.5, 10.8, -2.5, 1, 4.4, 1.2);
  }, ["都铎", "中世纪", "联排", "莎翁"]),

  eu("运河联排·阶梯山墙·四栋·四层", "荷兰运河联排：四栋并立、每栋 4.5m×9m 的窄楼四层（层高 3.0，正面每层两扇 1.1m×2.0m 的高窗、首层一门），户间承重墙 0.2、每户两跑直梯贴户墙左右交替，四栋各用不同颜色的砖墙（红砖、赭石、灰蓝、橙褐）和不同的山墙收头——阶梯形、三角形带球饰、钟形、平檐带吊货梁——屋面 38° 脊线沿 z 藏在山墙后，阿姆斯特丹、运河边的欧洲旧城和追逐戏", b => {
    b.group("c1", "红砖", "#a24c3a").group("c2", "赭石", "#c79b62").group("c3", "灰蓝", "#7d8a8e").group("c4", "橙褐", "#b3693f");
    const hw = 4.5, n = 4, X = hw * n / 2, Z = 4.5, hs = [0, 1, 2, 3], cx = (i: number) => -X + hw * (i + .5), top = 4 * FH + SLAB;
    for (let k = 0; k <= 4; k++) {
      const y = k * FH + SLAB;
      b.slab(-X, -Z, X, Z, y, SLAB, k && k < 4 ? hs.map(i => [cx(i) + (k % 2 ? 1.3 : -1.7), -4.4, cx(i) + (k % 2 ? 2.3 : -.7), .9] as Rect) : undefined, k === 4 ? "roof" : "floor");
      if (k === 4) break;
      for (const i of hs) {
        const key = `c${i + 1}`, x0 = cx(i) - hw / 2, x1 = cx(i) + hw / 2;
        facade(b, "x", Z, x0, x1, y, CLEAR, .3, k ? [win(cx(i) - 1.1, 1.1, 2, .4), win(cx(i) + 1.1, 1.1, 2, .4)] : [door(cx(i) - 1.1, 1.1, 2.3), win(cx(i) + 1.1, 1.1, 2, .4)], key);
        facade(b, "x", -Z, x0, x1, y, CLEAR, .3, [win(cx(i), 1.2, 1.6, .7)], key);
        b.flight(cx(i) + (k % 2 ? 1.8 : -1.2), -4.3, "+z", y, 18, 1, FH / 18, .28);
      }
      for (let m = 0; m <= n; m++) b.wall("z", -X + hw * m, -Z, Z, y, CLEAR, .2, [], `c${Math.min(m + 1, n)}`);
    }
    for (const i of hs) b.roofGable(cx(i) - hw / 2, -Z, cx(i) + hw / 2, Z, top, 38, .05, 0, "z", .15, false);
    const c = (i: number) => cx(i), k1 = "c1", k2 = "c2", k3 = "c3", k4 = "c4";
    [4.5, 3.6, 2.7, 1.8, .9].forEach((w, j) => b.box(k1, c(0), top + .4 + j * .8, Z, w, .8, .3));
    for (const d of [-1, 1]) b.tri3(k2, [c(1) - 2.25, top, Z + d * .1], [c(1) + 2.25, top, Z + d * .1], [c(1), top + 2.8, Z + d * .1], [0, 0, d]); b.sphere(k2, [c(1), top + 3.2, Z], .35);
    [4.5, 4.5, 4.1, 3.4, 2.4, 1.2, .6].forEach((w, j) => b.box(k3, c(2), top + .3 + j * .6, Z, w, .6, .3));
    b.box(k4, c(3), top + .3, Z, 4.8, .6, .6); b.box("struct", c(3), top + 1.6, Z + .5, .3, .3, 1.4); b.box(k4, c(3), top + 1.2, Z, 3.4, .6, .3);
  }, ["运河", "荷兰", "阿姆斯特丹", "旧城"]),
];

void CLEAR; void WT; void (null as unknown as Op);
