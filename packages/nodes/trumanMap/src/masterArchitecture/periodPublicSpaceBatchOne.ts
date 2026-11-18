import { part, type ModelPart, type Triple } from "../assetModelParts";
import { base, box, design, type ArchitecturePrototype } from "./structures";
import { polygon } from "../masterNature/shared";
import { combineMeshes } from "../natureParts";
import { turn, stairFlight } from "./historicSpaceBatchSeven";
import { verticalPanel } from "./historicSpaceBatchNine";
import { roofSpecs, wallSpecs } from "./roofRegistry";

const stone = "#aaa997", plaster = "#bfb59d", wood = "#896d50", tiles = "#66766b";

export const periodPublicSpaceBatchOneDesigns: ArchitecturePrototype[] = [
  design("前铺偏门L廊车马客栈", "临街前铺内的偏门可直通车马院，后侧与右侧两层客房形成相接L形外廊，左侧独立马厩面对院子，真实外阶接到上层回廊", courtyardCoachingInn, "建筑", "中式"),
  design("公门前堂后署三进衙署", "公门、抬高公堂和后署沿中轴递进，两边班房外廊可绕过公堂通到后院，公堂后门让开审案台，侧房各自有真实门窗", threeCourtYamen, "建筑", "中式"),
  design("前庭讲堂双斋书院", "侧向双门与正面影壁形成曲折入院，前庭两侧斋房各有独立门道和雨廊，后方高讲堂面对共同院子，宽登台阶实际接到授课厅面", twinWingAcademy, "建筑", "中式"),
];

export function tiledRoof(name: string, width: number, depth: number, ceiling: number, position: [number, number], color = tiles): ModelPart {
  // ACT: 常见影视整屋采用封闭顶棚，隐藏的椽架按整体阁顶体积表达；需要可进入阁楼时再拆分梁架与屋面。
  if (width > depth) return turn([tiledRoof(name, depth, width, ceiling, [0, 0], color)], 90, [position[0], 0, position[1]])[0]!;
  // 凹曲屋面：檐口翘起、屋脊起压脊瓦条；顶点高度仍为 width*.2，调用方自加的屋脊条可继续对位。
  const rise = width * .2, w = width / 2 + .6, lift = .34, ridge = .3;
  const eaveY = .12, curve = (x: number) => { const t = Math.min(1, Math.abs(x) / w); return eaveY + (rise - eaveY) * Math.pow(1 - t, 1.7) + lift * Math.pow(t, 7); };
  const steps = Array.from({ length: 10 }, (_, i) => w - (w - ridge - .25) * i / 9);
  const left = steps.map(x => ({ x: -x, y: curve(x) }));
  const right = [...steps].reverse().map(x => ({ x, y: curve(x) }));
  const tip = curve(w), under = [{ x: w, y: tip - .3 }, { x: w - .3, y: tip - .3 }, { x: w - .9, y: -.22 }];
  const profile = [...left, { x: -ridge, y: rise + .02 }, { x: -ridge + .06, y: rise + .26 }, { x: ridge - .06, y: rise + .26 }, { x: ridge, y: rise + .02 }, ...right, ...under, ...under.map(p => ({ x: -p.x, y: p.y })).reverse()];
  const roof = part(name, "extrude", color, [position[0], ceiling + .22, position[1]], [1, 1, 1], [0, 0, 0], { depth: depth + 1, profile });
  roofSpecs.set(roof, { width, depth });
  return roof;
}
export function holesAt(centers: number[], width: number, height: number, bottom = .035): [number, number][][] { return centers.map(x => [[x - width / 2, bottom], [x + width / 2, bottom], [x + width / 2, bottom + height], [x - width / 2, bottom + height]]); }
export function openingWall(name: string, width: number, height: number, holes: [number, number][][], position: Triple, yaw = 0, color = plaster): ModelPart {
  const wall = verticalPanel(name, [[-width / 2, 0], [width / 2, 0], [width / 2, height], [-width / 2, height]], holes, .3, position, yaw, color);
  wallSpecs.set(wall, { width, height, depth: .3, holes });
  return wall;
}
export function postSet(name: string, positions: [number, number][], height: number, floor = .42): ModelPart { return combineMeshes(name, wood, positions.map(([x, z]) => polygon(name, wood, [[-.12, -.12], [.12, -.12], [.12, .12], [-.12, .12]], height, [x, floor, z]))); }

export function roomWing(length: number, rooms: number, floors: number, stairsX?: number, openStart = false, openEnd = false): ModelPart[] {
  const floor = .42, storey = 3.4, ceiling = floor + floors * storey, p: ModelPart[] = [], centers = Array.from({ length: rooms }, (_, i) => -length / 2 + (i + .5) * length / rooms);
  for (let level = 0; level < floors; level++) {
    const y = floor + level * storey;
    const wallHeight = storey - (level < floors - 1 ? .25 : 0);
    p.push(openingWall("成列分室各自面对廊道的真实木石房门", length, wallHeight, holesAt(centers, 1.1, 2.5), [0, y, -3]), openingWall("每个独立分室背后实际透空的采光窗墙", length, wallHeight, holesAt(centers, 1.5, 1.4, 1.05), [0, y, 3]));
    if (level) p.push(box("分室上层真正由下墙接承的完整木楼板", 0, y - .125, 0, length, .25, 6, wood), box("上层外廊从各房门连续通过的木楼板", 0, y - .125, -4, length, .25, 2, wood));
  }
  for (let i = 1; i < rooms; i++) p.push(box("成列分室之间真正由低到高贯通的隔墙", -length / 2 + i * length / rooms, (floor + ceiling) / 2, 0, .22, ceiling - floor, 6, plaster));
  for (const s of [-1, 1]) p.push(box("分室长屋两端完整封合的侧墙", s * length / 2, (floor + ceiling) / 2, 0, .3, ceiling - floor, 6, plaster));
  p.push(...turn([tiledRoof("分室长屋独立封顶的灰瓦整盖", 6, length, ceiling, [0, 0])], 90, [0, 0, 0]));
  const porch = box("房门外廊从内墙向外下降的连续单坡雨檐", 0, ceiling - .52, -4, length + .4, .18, Math.hypot(2, .6), tiles); porch.rotation.x = -Math.atan2(.6, 2) * 180 / Math.PI; p.push(porch);
  p.push(postSet("独立接承外廊楼面与雨檐的完整木柱列", Array.from({ length: rooms + 1 }, (_, i) => [-length / 2 + i * length / rooms, -5]), ceiling - .906 - floor));
  if (floors > 1) {
    const y = floor + storey + 1;
    const first = -length / 2 + (openStart ? 2 : 0), last = length / 2 - (openEnd ? 2 : 0);
    for (const [a, b] of stairsX === undefined ? [[first, last]] : [[first, stairsX - .85], [stairsX + .85, last]]) p.push(box("上层外廊让开登阶和转角接廊口的真实木扶手", (a! + b!) / 2, y, -5, b! - a!, .08, .08, wood));
    if (stairsX !== undefined) p.push(stairFlight("院内连续登上高外廊且让开扶手口的实木阶", 20, 1.4, storey, .3, 0, [stairsX, floor, -11], -90, true));
  }
  return p;
}

function courtyardCoachingInn(): ModelPart[] {
  const p: ModelPart[] = [base(42, 48), box("前铺、马厩、客房和车马院共用的完整石铺地面", 0, .3, 0, 40, .24, 46, stone), openingWall("临街前铺真正让出餐堂与偏置车马门的店面", 28, 3.4, [...holesAt([-8], 6, 2.8), ...holesAt([4], 4.5, 3)], [0, .42, -20]), openingWall("前铺偏置车马门与后院真正对通的后壁", 28, 3.4, [...holesAt([-4], 2, 2.6), ...holesAt([4], 3, 3)], [0, .42, -12]), tiledRoof("临街前铺完整灰瓦长屋盖", 28, 8, 3.82, [0, -16]), ...turn(roomWing(22, 4, 2, -1, false, true), 0, [-3, 0, 13]), ...turn(roomWing(22, 4, 2, undefined, true), 90, [11, 0, -1])];
  for (const s of [-1, 1]) p.push(box("前铺两端实际封合的厚山墙", s * 14, 2.12, -16, .3, 3.4, 8, plaster));
  p.push(openingWall("前铺内部让出通门的厨房与餐堂分隔", 8, 3.4, holesAt([0], 1.5, 2.6), [-6.5, .42, -16], 90), box("临街餐堂真正独立的低木柜台", -3.5, .97, -17, 4, 1.1, .7, wood));
  const stable: ModelPart[] = [openingWall("马厩面向车马院的四路真实宽栏口", 18, 3, holesAt([-6.75, -2.25, 2.25, 6.75], 3, 2.7), [0, .42, -3]), box("马厩外侧完整厚土石后壁", 0, 1.92, 3, 18, 3, .3, plaster), ...turn([tiledRoof("独立马厩完整低灰瓦屋盖", 6, 18, 3.42, [0, 0])], 90, [0, 0, 0])];
  for (const x of [-9, -4.5, 0, 4.5, 9]) stable.push(box("马厩相邻栏位之间实际落地的低分隔", x, 1.12, 0, .22, 1.4, 6, wood));
  p.push(...turn(stable, -90, [-11, 0, -3]), box("马厩前车马院内共用的拴马长横木", -7.4, 1.32, -1, .12, .12, 12, wood), postSet("拴马横木两端实际接地立柱", [[-7.4, -7], [-7.4, 5]], .9));
  return p;
}

function yamenHall(): ModelPart[] {
  const p: ModelPart[] = [box("公堂完整抬高的独立石台", 0, .71, -4, 26, .58, 10, stone), openingWall("公堂正面三路真正敞通的宽门廊", 26, 5, holesAt([-8, 0, 8], 5, 3.6), [0, 1, -9]), openingWall("公堂后壁让开审案台的两路旁门", 26, 5, holesAt([-8, 8], 1.6, 3), [0, 1, 1]), tiledRoof("公堂由完整厚壁接承的高灰瓦屋盖", 26, 10, 6, [0, -4]), stairFlight("前公共庭院登上公堂面的宽石阶", 3, 8, .58, .4, 0, [0, .42, -10.2], -90), box("公堂内真实独立的审案高台", 0, 1.2, -1.2, 10, .4, 2, wood), box("审案高台上的长木案", 0, 1.9, -1.4, 7, 1, .8, wood)];
  for (const s of [-1, 1]) p.push(openingWall("公堂长侧面真实采光窗墙", 10, 5, holesAt([-2.5, 2.5], 2, 2, 1.5), [s * 13, 1, -4], 90));
  p.push(postSet("公堂内部真正接到封闭顶棚的两列承重木柱", [[-6, -4], [6, -4]], 5, 1));
  return p;
}
function threeCourtYamen(): ModelPart[] {
  const p: ModelPart[] = [base(50, 74), box("前庭、公堂、后署和两边班房共用的完整石铺地坪", 0, .3, 0, 48, .24, 72, stone), ...yamenHall(), ...turn(roomWing(36, 5, 1), -90, [-20, 0, 4]), ...turn(roomWing(36, 5, 1), 90, [20, 0, 4]), openingWall("仪门正面主门与两边真实侧门", 24, 4.2, [...holesAt([0], 3.2, 3.3), ...holesAt([-8, 8], 1.5, 2.8)], [0, .42, -30]), openingWall("仪门后方接通前庭的真正主门", 24, 4.2, holesAt([0], 3.2, 3.3), [0, .42, -24]), tiledRoof("公门门厅完整低灰瓦顶", 24, 6, 4.62, [0, -27]), openingWall("后署朝向内庭的真实正门和两边窗", 18, 3.7, [...holesAt([0], 2.4, 2.8), ...holesAt([-5.5, 5.5], 2.4, 1.5, 1.1)], [0, .8, 15]), openingWall("后署后方真实侧门与采光窗", 18, 3.7, [...holesAt([6], 1.5, 2.8), ...holesAt([-5, 0], 2.4, 1.5, 1.1)], [0, .8, 23]), tiledRoof("后署独立完整灰瓦顶", 18, 8, 4.5, [0, 19]), box("后署实际抬高的完整石地台", 0, .61, 19, 18, .38, 8, stone), stairFlight("后庭登到后署门槛的真实短阶", 2, 4, .38, .4, 0, [0, .42, 14.2], -90), openingWall("后院围壁实际保留的服务小门", 46, 3, holesAt([0], 1.8, 2.6), [0, .42, 30])];
  for (const s of [-1, 1]) {
    p.push(box("仪门门厅两端完整厚侧壁", s * 12, 2.52, -27, .3, 4.2, 6, plaster), box("后署两端完整厚侧壁", s * 9, 2.65, 19, .3, 3.7, 8, plaster), box("前庭仪门两侧连接外院界的完整厚壁", s * 17.5, 1.92, -30, 11, 3, .3, plaster), box("前庭外院两侧接班房的长围壁", s * 23, 1.92, -22, .3, 3, 16, plaster), box("班房后侧连接后庭界的短围壁", s * 23, 1.92, 26, .3, 3, 8, plaster));
  }
  return p;
}

function twinWingAcademy(): ModelPart[] {
  const p: ModelPart[] = [base(46, 60), box("前庭、斋房与讲堂共用的完整石铺地坪", 0, .3, 0, 44, .24, 58, stone), ...turn(roomWing(30, 5, 1), -90, [-16, 0, -4]), ...turn(roomWing(30, 5, 1), 90, [16, 0, -4]), box("讲堂完整独立高石地台", 0, .66, 12, 20, .48, 12, stone), openingWall("讲堂朝庭院三路真实宽门廊", 20, 4.5, holesAt([-6, 0, 6], 4, 3.4), [0, .9, 6]), openingWall("讲堂后面真实采光窗墙", 20, 4.5, holesAt([-6, 0, 6], 2.4, 1.8, 1.2), [0, .9, 18]), tiledRoof("高讲堂与封闭顶棚相接的完整灰瓦顶", 20, 12, 5.4, [0, 12]), stairFlight("前庭接到讲堂面的实际宽登台阶", 3, 8, .48, .4, 0, [0, .42, 4.8], -90), box("讲堂后部真正抬起的低讲授木台", 0, 1.1, 15.7, 10, .4, 2.6, wood), box("低讲台上独立的授课木案", 0, 1.65, 15.4, 2, .7, .8, wood), openingWall("书院前围壁真正分开的左右入院门", 40, 3.2, holesAt([-10, 10], 3, 2.8), [0, .42, -24]), box("正面影壁让开左右入院动线的完整厚石屏", 0, 1.82, -21, 10, 2.8, .5, plaster), part("影壁上沿长轴放置的低灰瓦压顶", "extrude", tiles, [0, 3.34, -21], [1, 1, 1], [0, 90, 0], { depth: 10.6, profile: [{ x: -.6, y: 0 }, { x: 0, y: .18 }, { x: .6, y: 0 }, { x: .6, y: -.12 }, { x: -.6, y: -.12 }] }), postSet("宽讲堂内真正由地面接到顶棚的木柱组", [[-6, 9], [6, 9], [-6, 15], [6, 15]], 4.5, .9), box("书院后端完整低院界", 0, 1.92, 26, 40, 3, .3, plaster)];
  for (const s of [-1, 1]) p.push(box("讲堂两侧完整厚山墙", s * 10, 3.15, 12, .3, 4.5, 12, plaster), box("斋房前后外缘相接的书院侧院界", s * 20, 1.92, 1, .3, 3, 50, plaster));
  return p;
}
