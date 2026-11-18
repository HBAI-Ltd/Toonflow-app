import { SLAB, door, win } from "./whitebox";
import { Furn, roomSet, type RoomSpec } from "./whiteboxStudio";
import type { ArchitecturePrototype } from "./structures";

// 建筑白模·更多布景房间：酒吧、咖啡厅、便利店、超市、书房、儿童房、酒店套房、实验室、手术室、审讯室加观察室、拘留所牢房、银行营业厅、车库、健身房、停尸房、剧院化妆间。
// 沿用「布景房间」的做法：比真实房间放大、家具体量按真实尺寸，每种各三个版本——四壁封顶、三壁封顶前侧敞开、三壁敞顶前侧敞开，封顶的带「天花板」和「灯位格栅」独立材质组。
const stool = (f: Furn, x: number, z: number, h = .7) => f.b.cyl("seat", x, z, f.y, f.y + h, .2, 8);

const rooms: RoomSpec[] = [
  { label: "酒吧", W: 12, D: 9, H: 3.6, back: [win(-3.5, 1.8, 1.5, 1.2)], left: [door(1.5)], right: [], front: [door(0, 1.8)],
    furn: f => { f.blk(0, -3.5, 0, 8, 1.1, .7); f.blk(0, -4.3, .9, 8, 1.6, .3); for (let i = 0; i < 8; i++) stool(f, -3.5 + i, -2.8); for (const [x, z] of [[-3.8, 1.2], [-1.2, 2.6], [2.2, 1.0], [4.4, 2.8]] as [number, number][]) { f.rtable(x, z, .45, 1.05); for (let k = 0; k < 3; k++) stool(f, x + Math.cos(k * 2.09) * .85, z + Math.sin(k * 2.09) * .85); } f.blk(-5.4, -.5, 0, 1.0, .45, 4); f.blk(-5.8, -.5, .45, .2, .6, 4); }, tags: ["酒吧", "夜店"] },
  { label: "咖啡厅", W: 10.8, D: 8.4, H: 3.6, back: [win(-2.7, 2.4, 1.8, .9), win(2.7, 2.4, 1.8, .9)], left: [], right: [door(1.5)], front: [door(0, 1.8)],
    furn: f => { f.blk(-2.5, -3.4, 0, 4.2, 1.1, .7); f.blk(-2.5, -3.95, .9, 4.2, 1.3, .25); for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) { const x = -1.2 + i * 2.4 + (j ? 1.2 : 0), z = -.6 + j * 2.6; f.table(x, z, .8, .8); f.chair(x - .6, z, 90); f.chair(x + .6, z, 270); } f.sofa(-4.7, 1.8, 90, 2.4); f.table(-3.7, 1.8, .6, 1.2, .5); }, tags: ["咖啡厅", "餐饮"] },
  { label: "便利店", W: 12, D: 8.4, H: 3.3, back: [], left: [], right: [], front: [win(-3, 4.8, 2.1, .6), door(3.5, 1.8)],
    furn: f => { for (const x of [-2.4, 0, 2.4]) f.blk(x, -.4, 0, .5, 1.8, 4.2); for (let i = 0; i < 4; i++) f.blk(-4.5 + i * 3, -3.8, 0, 2.6, 2, .7); f.blk(4.2, 2.8, 0, 1.8, 1, .7); f.blk(5.2, 2.2, 0, .7, 1, 1.8); }, tags: ["商店", "便利店", "零售"] },
  { label: "超市", W: 24, D: 18, H: 4.2, back: [], left: [], right: [door(-3, 1.8)], front: [door(-6, 3), door(6, 3)],
    furn: f => { for (let i = 0; i < 8; i++) f.blk(-9 + i * 2.6, -1, 0, .6, 2, 11); for (let i = 0; i < 3; i++) f.blk(-6 + i * 6, 6.2, 0, 1, .95, 3.2); for (let i = 0; i < 6; i++) f.blk(-10 + i * 4, -8.3, 0, 3.4, 2.2, .8); f.blk(11.5, -1, 0, .8, 1.2, 12); }, tags: ["商店", "超市", "零售"] },
  { label: "书房", W: 6.6, D: 5.4, H: 3.3, back: [win(1.5, 1.8, 1.5, .9)], left: [door(1.2)], right: [], front: [door(-1.8)],
    furn: f => { f.blk(-3.1, -.2, 0, .4, 2.4, 4); f.blk(-1, -2.55, 0, 3.6, 2.4, .35); f.desk(1.6, -1.2, 1.8, .8); f.chair(1.6, -.4, 180); f.sofa(-1.2, 1.5, 180, 1); f.table(-1.2, .6, .5, .5, .5); }, tags: ["住宅", "书房"] },
  { label: "儿童房", W: 5.4, D: 4.8, H: 3, back: [win(0, 1.8, 1.2, .9)], left: [door(.8)], right: [], front: [door(-1.2)],
    furn: f => { f.bed(-1.8, -1.2, 0, 1.2, 2); f.blk(1.8, -2, 0, 1, 1.8, .6); f.desk(1.9, .6, 1.2, .6); f.chair(1.9, 1.3, 180); f.blk(-1.6, 1.4, 0, 1.2, .5, .5); }, tags: ["住宅", "儿童房"] },
  { label: "酒店套房", W: 10.2, D: 7.2, H: 3.3, back: [win(-2.5, 3, 2.1, .3), win(2.5, 3, 2.1, .3)], left: [], right: [], front: [door(-3.6)],
    furn: (f, b) => { b.wall("x", -.4, -5.1, 5.1, SLAB, 3.3, .1, [door(-3.2), door(3, 1.8)]); f.bed(0, -2.3, 0, 2, 2.2); for (const s of [-1, 1]) f.blk(s * 1.75, -3.2, 0, .5, .5, .4); f.blk(4.2, -3, 0, 1.6, 2.2, .6); f.sofa(-2.4, 2.4, 180, 2.6); for (const s of [-1, 1]) f.sofa(s * 1.8 + .8, 2.8, 0, 1); f.table(-2.4, 1.2, 1.2, .6, .45); f.table(3.2, 2.2, 1.6, .9); for (const [x, z, yaw] of [[2.7, 1.5, 0], [3.7, 1.5, 0], [2.7, 2.9, 180], [3.7, 2.9, 180]] as [number, number, number][]) f.chair(x, z, yaw); }, tags: ["酒店", "套房"] },
  { label: "实验室", W: 12, D: 8.4, H: 3.6, back: [win(-3, 2.4, 1.5, 1.1), win(3, 2.4, 1.5, 1.1)], left: [door(1.5)], right: [], front: [door(-2.5, 1.2)],
    furn: f => { for (let i = 0; i < 3; i++) { f.blk(-3 + i * 3, -.2, 0, 2.4, .9, .9); f.blk(-3 + i * 3, -.2, .9, 2.4, .5, .3); stool(f, -3.6 + i * 3, 1); stool(f, -2.4 + i * 3, 1); } f.blk(-3, -3.7, 0, 2.4, 2.3, .9); f.blk(.5, -3.7, 0, 2.4, 2.3, .9); f.blk(4, -3.7, 0, .8, 1.9, .8); f.blk(5.4, -3.7, 0, .8, 1.9, .8); f.blk(5.5, 1.5, 0, .6, 1, 3); }, tags: ["实验室", "科研"] },
  { label: "手术室", W: 7.2, D: 7.2, H: 3.3, back: [], left: [door(1.5, 1.4)], right: [win(0, 1.5, .9, 1.2)], front: [door(-1.5, 1.4)],
    furn: f => { f.blk(0, 0, .55, 2, .15, .6); f.blk(0, 0, 0, .5, .55, .5); f.blk(1.8, -.8, 0, .9, .9, .5); f.blk(-1.8, .4, 0, .9, .9, .5); f.blk(0, -3, 0, 3.2, .9, .5); f.blk(0, -3.2, 1.8, 3.2, .8, .3); f.blk(2.9, -2.9, 0, .7, 1.5, .7); f.blk(-3, -2.6, 0, 1.4, .9, .6); }, tags: ["医院", "手术室", "医疗"] },
  { label: "审讯室加观察室", W: 7.2, D: 3.9, H: 3, back: [], left: [door(1.2)], right: [door(-1)], front: [],
    furn: (f, b) => { b.wall("z", 1.8, -1.95, 1.95, SLAB, 3, .15, [win(0, 2.4, 1.1, 1)]); f.table(-1.5, 0, 1.6, .8); f.chair(-2.5, 0, 90); f.chair(-.5, 0, 270); f.desk(3, 0, .8, 2); f.chair(2.4, .5, 270); f.chair(2.4, -.5, 270); }, tags: ["警局", "审讯", "单面镜"] },
  { label: "拘留所牢房", W: 12, D: 6, H: 3.2, back: [], left: [door(1.5)], right: [], front: [],
    furn: (f, b) => { const xs = [-4.5, -1.5, 1.5, 4.5]; b.bars("x", .5, -6, 6, SLAB, 2.4, xs.map(x => [x - .45, x + .45] as [number, number])); for (const x of [-3, 0, 3]) b.wall("z", x, -3, .5, SLAB, 3.2, .2); for (const x of xs) { f.blk(x - .7, -1.8, .4, .9, .2, 2); f.blk(x - .7, -1.8, 1.3, .9, .2, 2); f.blk(x + 1, -2.6, 0, .45, .4, .6); } }, tags: ["警局", "牢房", "拘留"] },
  { label: "银行营业厅", W: 18, D: 12, H: 4.5, back: [], left: [], right: [], front: [door(-2, 1.8), door(2, 1.8)],
    furn: f => { f.blk(0, -1.2, 0, 10, 1.1, .8); f.blk(0, -1.2, 1.1, 10, .9, .05, "glass"); for (let i = 0; i < 5; i++) f.desk(-4 + i * 2, -2.3, 1.4, .7); f.blk(5.5, -5.2, 0, 4, 3, 1.2); for (let i = 0; i < 3; i++) f.sofa(-6 + i * 3, 3, 0, 2.2); for (let i = 0; i < 3; i++) f.blk(8.6, 1 + i * 1.6, 0, .7, 1.9, .8); }, tags: ["银行", "金融", "劫案"] },
  { label: "车库内部", W: 7.2, D: 6.6, H: 2.9, back: [], left: [door(1.5)], right: [], front: [door(0, 4.8, 2.1)],
    furn: f => { f.blk(-2.5, -3, 0, 2.4, .9, .7); f.blk(2.5, -3.1, 0, 2.4, 2, .5); f.blk(3.3, -.5, 0, .6, 1.6, .9); f.blk(0, .6, .3, 1.8, 1.2, 4.6); }, tags: ["车库", "住宅", "修车"] },
  { label: "健身房", W: 15, D: 10.8, H: 4.2, back: [win(-4.5, 3, 1.8, 1), win(4.5, 3, 1.8, 1)], left: [], right: [], front: [door(-4, 1.8), door(4, 1.8)],
    furn: f => { for (let i = 0; i < 6; i++) f.blk(-5.5 + i * 2.2, -3.8, 0, .8, 1.4, 1.8); f.blk(0, -5.3, .3, 14, 2.2, .05, "glass"); for (let i = 0; i < 3; i++) f.blk(-4.5 + i * 4.5, 1.5, 0, 2, 1.8, .6); f.blk(5.5, 1, 0, 1.8, .45, 1.2); }, tags: ["健身房", "运动"] },
  { label: "停尸房", W: 8.4, D: 6.6, H: 3.3, back: [], left: [door(1.2, 1.4)], right: [], front: [door(-2, 1.4)],
    furn: f => { for (let c = 0; c < 3; c++) for (let r = 0; r < 2; r++) f.blk(-2.2 + c * 2.2, -2.85, .3 + r * 1.05, 2, 1, .9); f.blk(-1.5, .6, 0, 2, .9, .7); f.blk(1.5, .6, 0, 2, .9, .7); f.blk(3.4, -2.6, 0, 1.4, .9, .6); }, tags: ["停尸房", "医院", "惊悚"] },
  { label: "剧院化妆间", W: 12, D: 6, H: 3.6, back: [], left: [door(1.2)], right: [], front: [door(-2, 1.2)],
    furn: f => { f.blk(0, -2.6, 0, 10, .9, .6); f.blk(0, -2.88, .9, 10, 1.4, .04, "glass"); for (let i = 0; i < 6; i++) f.chair(-4.2 + i * 1.7, -1.7, 0); for (let i = 0; i < 3; i++) f.blk(-3 + i * 3, 1.5, 0, 2.4, 1.8, .5); }, tags: ["剧院", "后台", "化妆间"] },
];

export const whiteRoomDesigns: ArchitecturePrototype[] = rooms.flatMap(roomSet);
