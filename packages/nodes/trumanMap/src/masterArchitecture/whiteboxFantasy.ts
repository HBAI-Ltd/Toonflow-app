import { DEG, SLAB, WT, door, white, win } from "./whitebox";
import { pipe } from "./whiteboxUnderground";
import { whiteAnc, type AB } from "./whiteboxAncientKit";
import { cone, ringSlab, ringWall } from "./whiteboxRegional";
import type { ArchitecturePrototype } from "./structures";

// 建筑白模·科幻与奇幻补充：圆管舱廊、反应堆舱、魔法塔、矮人大厅、罗马庄园。
const sf = (name: string, what: string, build: (b: AB) => void, tags: string[]) => whiteAnc(`白模·科幻·${name}`, `白模预演科幻舱室模块：${what}；原点在平面中心，+z 为正面，地面标高 0`, "科幻", build, ["科幻", "舱室", ...tags]);
const fa = (name: string, what: string, build: (b: AB) => void, tags: string[]) => whiteAnc(`白模·奇幻·${name}`, `白模预演奇幻与古典建筑：${what}；原点在平面中心，+z 为正面，地面标高 0`, "奇幻", build, ["奇幻", ...tags]);

const cl = (name: string, what: string, build: (b: AB) => void, tags: string[]) => whiteAnc(`白模·古典·${name}`, `白模预演古典建筑：${what}；原点在平面中心，+z 为正面，地面标高 0`, "欧式", build, ["古典", ...tags]);

export const whiteFantasyDesigns: ArchitecturePrototype[] = [
  sf("圆管舱廊·内径3.4m·长6m", "圆管舱廊：内径 3.4m、壁厚 0.25、长 6m 的圆管（16 面，沿 z 首尾可接）、管内 2.2m 宽的格栅地板、顶部中央一条灯带、两端各一道加厚环框，飞船、空间站和地下基地戏", b => {
    pipe(b, "wall", 1.7, .25, 1.95, -3, 3, 16); b.box("floor", 0, .35, 0, 2.2, .15, 6); b.box("rig", 0, 3.5, 0, .3, .05, 6); for (const z of [-2.9, 2.9]) pipe(b, "struct", 1.65, .35, 1.95, z - .1, z + .1, 16);
  }, ["舱廊", "圆管", "空间站"]),

  sf("反应堆舱·径16m·高12m·穹顶·环形步道", "反应堆舱：内径 16m 高 12m 的圆形舱（舱壁厚 0.6、24 段、一道 3m 高的舱门洞）、穹顶收到 14m、中央径 6m 高 9m 的反应堆压力容器加锥顶，5m 高处一圈 4.2m 宽的环形检修步道（内外各一道 1.1m 栏板）、贴墙一架 0.5m 宽的竖直爬梯，科幻、核设施、末日和灾难戏", b => {
    ringWall(b, "wall", 8, .6, 0, 12, 24, i => i === 0 ? 3 : undefined); ringSlab(b, "floor", 0, 8, .3, .3, 24); b.cyl("equip", 0, 0, .3, 9, 3, 16); cone(b, "equip", 3.4, 9, 1.2, 11, 16, .3);
    ringSlab(b, "floor", 3.6, 7.8, 5, .3, 24); ringWall(b, "rail", 7.7, .1, 5, 6.1, 24); ringWall(b, "rail", 3.8, .1, 5, 6.1, 24); cone(b, "ceil", 8.3, 12, 0, 14, 24, .3);
    for (let y = .6; y < 4.9; y += .3) b.box("rail", 0, y, 7.45, .5, .04, .05);
  }, ["反应堆", "核设施", "舱室", "末日"]),

  fa("魔法塔·径8m·高55m·螺旋梯·阳台", "魔法塔：八节从径 8 收到 6.6 的圆形塔身（共高 40m、壁厚 0.9、16 面、底部正面一个 1.4m 宽的门洞），塔内螺旋梯（160 级、中柱径 0.3）直通顶部，30m 处一圈 3m 宽的环形阳台（带 1.1m 栏板），顶上 12m 高的尖顶锥盖和 3m 塔尖，法师、奇幻王国和魔法学院戏", b => {
    for (let i = 0; i < 8; i++) ringWall(b, "wall", 4 - i * .1, .9, i * 5, (i + 1) * 5, 16, k => i === 0 && k === 0 ? null : undefined);
    for (let k = 0; k < 160; k++) { const th = k * 22.5; b.boxYaw("stair", 2 * Math.sin(th * DEG), .3 + (k + 1) * .25 - .05, 2 * Math.cos(th * DEG), 1.2, .08, .7, th + 90); } b.cyl("struct", 0, 0, 0, 40, .15, 8);
    ringSlab(b, "floor", 3.4, 6.2, 30, .3, 16); ringWall(b, "rail", 6.1, .1, 30, 31.1, 16); cone(b, "roof", 4.6, 40, 0, 52, 16, .2); b.col(0, 0, 52, 55, .12);
  }, ["魔法塔", "法师", "奇幻", "魔法学院"]),

  fa("矮人大厅·石柱厅·宽30m长50m·王座台", "矮人石厅：石墙厚 2.0 的 30m×50m 大厅，两排各六根径 3.2 高 14 的石柱（柱距 8m），15m 高处 1.0 厚的平顶板，+z 端一道 4m 宽 8m 高的石门洞，-z 端六层各 0.3m 高的王座台（12m×4m 起逐层收窄）和两座 3m×2m×2m 的熔炉台，奇幻地下王国、矿山和史诗戏", b => {
    b.slab(-15, -25, 15, 25, .3, .3); b.wall("x", 25, -15, 15, .3, 15, 2, [door(0, 4, 8)]); b.wall("x", -25, -15, 15, .3, 15, 2); for (const x of [-15, 15]) b.wall("z", x, -25, 25, .3, 15, 2);
    for (const x of [-7.5, 7.5]) for (let j = 0; j < 6; j++) b.cyl("struct", x, -20 + j * 8, .3, 14.3, 1.6, 12); b.slab(-15, -25, 15, 25, 15.3, 1, undefined, "roof");
    for (let k = 0; k < 6; k++) b.box("base", 0, .3 + k * .3 + .15, -24 + (4 - k * .5) / 2, 12 - k * 1.6, .3, 4 - k * .5); for (const x of [-9, 9]) b.box("equip", x, 1.3, -22, 3, 2, 2);
  }, ["矮人", "石厅", "奇幻", "地下王国"]),

  cl("罗马庄园·中庭柱廊·双院·30m×26m", "古罗马庄园：外墙厚 0.5 高 4.5 的 30m×26m 院宅（+z 正面一扇 2.0m 宽 3.0m 高的大门），前半一座 10m×10m 的中庭（四周 12 根径 0.5 高 4.6 的柱、向内倾斜的披檐屋面、中央 3m×3m 的蓄水池），后半 20m×10m 的列柱园（四周每边 5 根柱的回廊、中间敞开），两侧各三间 4m×4m 的房间（门向中庭或列柱园），罗马、角斗士和古典史诗戏", b => {
    b.group("water", "水面", "#6fa8c8", { roughness: .1, opacity: .85 });
    b.wall("x", 13, -15, 15, .3, 4.5, .5, [door(0, 2, 3)]); b.wall("x", -13, -15, 15, .3, 4.5, .5); for (const x of [-15, 15]) b.wall("z", x, -13, 13, .3, 4.5, .5);
    for (const [x0, x1] of [[-15, -5], [5, 15]] as [number, number][]) for (let j = 0; j < 3; j++) { const z0 = -12.5 + j * 4.2, z1 = z0 + 4; for (const z of [z0, z1]) b.wall("x", z, x0, x1, .3, 3.6, .2, z === z0 && j === 0 ? [] : []); b.wall("z", x0 < 0 ? -5 : 5, z0, z1, .3, 3.6, .2, [door((z0 + z1) / 2, 1, 2.4)]); }
    for (let i = 0; i < 4; i++) for (const sx of [-1, 1]) b.cyl("struct", sx * 4, 1.5 + i * 2.6, .3, 4.9, .25, 10); for (const sz of [1.5, 10]) for (const x of [-2, 0, 2]) b.cyl("struct", x, sz, .3, 4.9, .25, 10);
    b.pent([-5, 0, 5, 11], 4.9, [-2.5, 3, 2.5, 8], 4.2); b.box("water", 0, .35, 5.5, 3, .1, 3);
    for (let i = 0; i < 5; i++) for (const sz of [-3.5, -11]) b.cyl("struct", -8 + i * 4, sz, .3, 4.1, .25, 10); for (const sx of [-9, 9]) for (let i = 1; i < 3; i++) b.cyl("struct", sx, -3.5 - i * 2.5, .3, 4.1, .25, 10);
    b.beamH("x", -3.5, -8.4, 8.4, 4.4, .3, .3); b.beamH("x", -11, -8.4, 8.4, 4.4, .3, .3);
  }, ["罗马", "庄园", "中庭", "古典"]),
];

void SLAB; void WT; void win; void white;
