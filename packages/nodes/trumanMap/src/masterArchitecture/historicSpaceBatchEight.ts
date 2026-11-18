import { part, ring, type ModelPart, type Triple } from "../assetModelParts";
import { base, box, cylinder, arch, design, type ArchitecturePrototype } from "./structures";
import { barrelRoof, halfRoundWall } from "./spatialShells";
import { polygon } from "../masterNature/shared";
import { crossingVault } from "./historicSpaceBatchSix";
import { door, turn, stairFlight, dome, arcadeWall } from "./historicSpaceBatchSeven";

const stone = "#b4ae97", brick = "#ae8e70", wood = "#937653", tile = "#818576", water = "#789fa4";

// 原创完整空间，尺寸服务于场景布置，不作特定考古遗址的测绘复原。
// https://soprintendenzaspecialeroma.it/luoghi/terme-di-caracalla/
// https://www.inp2020.tn/ouvrages/Carthage_maitresse_de_la_Mediterranee.pdf
// https://www.cambridge.org/core/journals/antiquaries-journal/article/abs/excavations-at-carthage-1975-second-interim-report/C818394F06BFC5016721425ADEA05CA8
// https://lugares.inah.gob.mx/es/pagina-de-elemento/2802
// https://archeologie.culture.gouv.fr/saint-symeon/fr/la-mission-francaise
export const historicSpaceBatchEightDesigns: ArchitecturePrototype[] = [
  design("双体育院圆热室巨型浴场", "露天大泳池沿中轴接三跨交叉券冷厅、独立温室和圆顶热室，两侧露天体育院与低屋廊对称展开，圆热室的高窗真正穿过围壁", imperialThermae, "建筑", "欧式"),
  design("中心岛放射舰棚环形军港", "狭长入港渠连到圆形水盆，外岸与中心岛的放射舰棚各有向水下倾斜的实心船台，岛心管理楼与各泊位保持独立空间", punicCothon, "建筑", "异域"),
  design("错层四厅叠涩高台院宫", "四座互不封死角部的长石厅围住宽庭，各厅高低台面经独立阶相连，厚叠涩石顶覆盖分室，前厅中央贯通门接通院内外", puucQuadrangle, "建筑", "异域"),
  design("四臂长堂环八角朝圣院", "四个长堂从中央开放八角庭向外展开，高中厅与低侧廊在各臂内保持连续通行，四角厚壁与四向大券连接八角庭，中央立柱独立可见", cruciformPilgrimageSanctuary, "建筑", "异域"),
];

function placedRing(name: string, radius: number, thickness: number, height: number, position: Triple, color = stone): ModelPart { const value = ring(name, color, radius, thickness, position[1], height); value.position.x = position[0]; value.position.z = position[2]; return value; }
function pitched(name: string, width: number, rise: number, depth: number, position: Triple, color = tile): ModelPart { return part(name, "extrude", color, position, [1, 1, 1], [0, 0, 0], { depth, profile: [{ x: -width / 2, y: 0 }, { x: 0, y: rise }, { x: width / 2, y: 0 }, { x: width / 2, y: -.2 }, { x: 0, y: rise - .2 }, { x: -width / 2, y: -.2 }] }); }
function vaultEndCap(position: Triple, yaw: number): ModelPart {
  const outline: [number, number][] = Array.from({ length: 15 }, (_, i) => [Math.cos(Math.PI - i * Math.PI / 14) * 9, Math.sin(i * Math.PI / 14) * 10]), holes: [number, number][][] = [-4.5, 0, 4.5].map(x => [[x - .8, 1], [x + .8, 1], [x + .8, x === 0 ? 6.5 : 5], [x - .8, x === 0 ? 6.5 : 5]]);
  const value = polygon("与交叉高券同轮廓且开出真实高窗的厚端壁", brick, outline, .7, [0, 0, 0], holes); value.rotation.x = -90; value.position.z = .35;
  return turn([value], yaw, position)[0]!;
}

function imperialThermae(): ModelPart[] {
  const p: ModelPart[] = [base(98, 98), box("各浴厅与露天体育院共用的完整石铺地面", 0, .3, 0, 94, .24, 90)];
  for (const x of [-18, 0, 18]) p.push(crossingVault([x, 15, 0], 9, 10));
  for (const x of [-27, -9, 9, 27]) for (const z of [-9, 9]) p.push(box("巨型冷厅交叉券真正落地的角石墩", x, 7.71, z, 1.5, 14.58, 1.5, brick));
  for (const x of [-18, 0, 18]) for (const z of [-9, 9]) p.push(...door("冷厅前后真正宽通门", 18, 14.58, .7, 4, [x, .42, z], 5.5, brick));
  for (const s of [-1, 1]) p.push(...turn(door("冷厅接两侧体育院的真正侧门", 18, 14.58, .7, 3, [0, .42, 0], 5.5, brick), 90, [s * 27, 0, 0]));
  for (const x of [-18, 0, 18]) for (const s of [-1, 1]) p.push(vaultEndCap([x, 15, s * 9], 0));
  for (const s of [-1, 1]) p.push(vaultEndCap([s * 27, 15, 0], 90));
  p.push(...[-1, 1].map(s => box("温室直接承筒券的两侧完整石壁", s * 7, 4.71, 15, .6, 8.58, 12, brick)), ...door("冷厅进入温室的真正中轴门", 14, 8.58, .6, 3, [0, .42, 9], 4, brick), ...door("温室进入圆热室的真正中轴门", 14, 8.58, .6, 3, [0, .42, 21], 4, brick), barrelRoof("温室真正完整的长筒券石顶", 7, .35, 12, [0, 9, 15], brick));
  for (const z of [9, 21]) { const profile = Array.from({ length: 15 }, (_, i) => ({ x: Math.cos(Math.PI - i * Math.PI / 14) * 7.35, y: Math.sin(i * Math.PI / 14) * 7.35 })); p.push(part("温室筒券两端同高壁相接的半圆填壁", "extrude", brick, [0, 9, z], [1, 1, 1], [0, 0, 0], { depth: .6, profile })); }
  p.push(halfRoundWall("热室入口两旁连续低位圆形厚石壁", 12, .8, 4.58, [0, .42, 32], 82, brick, 344 * Math.PI / 180), placedRing("圆热室高窗上方连续承穹厚石环", 12, .8, 3, [0, 11.5, 32], brick), ...dome("圆热室完整大穹顶", 12, [0, 13, 32], brick), placedRing("热室中央独立暖水圆池实心边壁", 4.8, .4, .65, [0, .745, 32]), part("暖水圆池内独立静态水面", "cylinder", water, [0, .93, 32], [8.75, .03, 8.75], [0, 0, 0], { opacity: .7, roughness: .2 }));
  for (let i = 0; i < 8; i++) p.push(halfRoundWall("圆热室八个真实高窗之间的承重弧墩", 12, .8, 5, [0, 5, 32], -i * 45, brick, 16 * Math.PI / 180));
  for (const s of [-1, 1]) {
    p.push(box("体育院最外侧连续完整石壁", s * 45, 3.21, 5, .6, 5.58, 30, brick), box("体育院与冷厅外侧相接的后短壁", s * 27, 3.21, 14.5, .6, 5.58, 11, brick), box("体育院与冷厅外侧相接的前短壁", s * 27, 3.21, -9.5, .6, 5.58, 1, brick), box("体育院外边连续遮雨平屋盖", s * 43.5, 6.2, 5, 3.5, .4, 30, stone));
    for (const z of [-10, 20]) p.push(box("体育院前后完整石围壁", s * 36, 3.21, z, 18, 5.58, .6, brick), box("体育院端头低柱廊完整平屋盖", s * 34.5, 6.2, z + (z < 0 ? 1.5 : -1.5), 15, .4, 3.5, stone));
    for (const x of [30, 36, 42]) for (const z of [-7, 17]) p.push(cylinder("体育院低柱廊真正落地的石柱", s * x, 3.21, z, .5, 5.58, stone));
  }
  for (const s of [-1, 1]) p.push(box("露天大泳池完整纵向池边", s * 21, .92, -25, .5, 1, 20, stone), box("露天大泳池完整横向池边", 0, .92, -25 + s * 10, 42, 1, .5, stone));
  p.push(part("露天大泳池内独立静态水面", "box", water, [0, 1.29, -25], [41.4, .035, 19.4], [0, 0, 0], { opacity: .72, roughness: .2 }), stairFlight("泳池外侧登上池边的连续石阶", 5, 3, 1, .5, 0, [0, .42, -12.5], 90), stairFlight("泳池内部从池底接到池边的连续石阶", 5, 3, 1, .5, 0, [0, .42, -17.5], -90));
  return p;
}

function slipway(name: string, width: number, length: number, startHeight: number, endHeight: number): ModelPart {
  const value = polygon(name, stone, [[-length / 2, 0], [length / 2, 0], [length / 2, endHeight], [-length / 2, startHeight]], width); value.rotation.x = -90; value.position.z = width / 2;
  return turn([value], -90, [0, .18, 0])[0]!;
}
function shipShed(width: number, length: number, inwardHigh: boolean): ModelPart[] {
  return [slipway("从泊位水面连续升到岸侧的实体斜船台", width, length, inwardHigh ? 1.2 : .15, inwardHigh ? .15 : 1.2), ...[-1, 1].map(s => box("船棚两侧从水底升起的真实厚石壁", s * (width / 2 + .2), 2.93, 0, .4, 5.5, length, stone)), pitched("舰棚与两侧厚壁实际接承的完整木屋盖", width + 1.2, 1.6, length + .6, [0, 5.58, 0], wood)];
}
function punicCothon(): ModelPart[] {
  const radius = 29, entry = Math.cos(80 * Math.PI / 180) * radius, front = 8 - Math.sin(80 * Math.PI / 180) * radius, outline: [number, number][] = [[-44, -50], [-entry, -50], [-entry, front]];
  for (let i = 1; i <= 36; i++) { const angle = (260 - i * 340 / 36) * Math.PI / 180; outline.push([Math.cos(angle) * radius, 8 + Math.sin(angle) * radius]); }
  outline.push([entry, -50], [44, -50], [44, 50], [-44, 50]);
  const p: ModelPart[] = [base(88, 100), polygon("切开直入港渠并围住完整圆港的连续岸地", brick, outline, 1.2, [0, .18, 0]), halfRoundWall("保留入港真缺口的圆形石砌码头岸壁", 30, 1.2, 1.2, [0, .18, 8], 80, stone, 340 * Math.PI / 180), part("环形军港内独立静态水面", "cylinder", water, [0, .33, 8], [58, .03, 58], [0, 0, 0], { opacity: .74, roughness: .23 }), part("直入港渠内与圆港连续的水面", "box", water, [0, .33, -35], [entry * 2, .03, 30], [0, 0, 0], { opacity: .74, roughness: .23 }), cylinder("放射船台之间真实露出的中央管理岛", 0, .78, 8, 12, 1.2, brick)];
  for (const s of [-1, 1]) p.push(box("狭长入港渠两侧实际岸石", s * (entry + .35), .78, -35.25, .7, 1.2, 29.5));
  for (let i = 0; i < 12; i++) { const angle = (-65 + i * 310 / 11) * Math.PI / 180; p.push(...turn(shipShed(6, 14, false), 90 - angle * 180 / Math.PI, [Math.cos(angle) * 33.5, 0, 8 + Math.sin(angle) * 33.5])); }
  for (let i = 0; i < 8; i++) { const angle = i * Math.PI / 4; p.push(...turn(shipShed(4, 10, true), 90 - i * 45, [Math.cos(angle) * 11, 0, 8 + Math.sin(angle) * 11])); }
  for (const s of [-1, 1]) p.push(...door("岛心管理楼前后实际入口", 7, 7.2, .5, 2.2, [0, 1.38, 8 + s * 3.5], 3, brick), ...turn(door("岛心管理楼左右实际入口", 7, 7.2, .5, 2.2, [0, 1.38, 0], 3, brick), 90, [s * 3.5, 0, 8]));
  p.push(box("岛心管理楼四壁共托的完整高石平顶", 0, 8.78, 8, 7.6, .4, 7.6, stone));
  return p;
}

const corbelOuter: [number, number][] = [[-4.7, 0], [-4.1, 1.6], [-2, 3.1], [-.5, 3.6], [.5, 3.6], [2, 3.1], [4.1, 1.6], [4.7, 0]];
function puucWing(length: number, floor: number, rooms: number, passage = false): ModelPart[] {
  const p: ModelPart[] = [box("每座长厅不同标高的完整承重石台", 0, (floor + 2.24) / 2, 0, length, floor - 2.24, 9, stone)];
  for (let i = 0; i < rooms; i++) p.push(...door("长厅各分室朝庭院的真实石门", length / rooms, 4.8, .55, passage && i === Math.floor(rooms / 2) ? 3 : 1.8, [-length / 2 + (i + .5) * length / rooms, floor, -4.5], 3, stone));
  if (passage) p.push(...door("前厅贯通院外的实际中央后门", length, 4.8, .55, 3, [0, floor, 4.5], 3, stone)); else p.push(box("长厅背后完整厚石壁", 0, floor + 2.4, 4.5, length, 4.8, .55));
  for (let i = 1; i < rooms; i++) p.push(box("长厅内部独立分开的厚石间壁", -length / 2 + i * length / rooms, floor + 2.4, 0, .5, 4.8, 9));
  for (const s of [-1, 1]) {
    p.push(box("长厅两端实际封合的厚石壁", s * length / 2, floor + 2.4, 0, .55, 4.8, 9), box("厅顶前后连接厚石身的宽檐壁带", 0, floor + 5.5, s * 4.5, length, 1.4, .4));
    const value = part("叠涩厅顶两端沿实轮廓封合的石端壁", "extrude", stone, [0, floor + 4.8, 0], [1, 1, 1], [0, 0, 0], { depth: .55, profile: corbelOuter.map(([x, y]) => ({ x, y })) }); p.push(...turn([value], 90, [s * length / 2, 0, 0]));
  }
  const inner: [number, number][] = [[3.9, 0], [3.5, 1.3], [1.6, 2.6], [.35, 2.9], [-.35, 2.9], [-1.6, 2.6], [-3.5, 1.3], [-3.9, 0]], roof = part("分室上连续叠涩收分且内部通空的完整厚石屋盖", "extrude", stone, [0, floor + 4.8, 0], [1, 1, 1], [0, 0, 0], { depth: length, profile: [...corbelOuter, ...inner].map(([x, y]) => ({ x, y })) }); p.push(...turn([roof], 90, [0, 0, 0]));
  return p;
}
function puucQuadrangle(): ModelPart[] {
  const p: ModelPart[] = [base(78, 86), box("宽庭与四座错层长厅共用的高承台", 0, 1.33, 0, 70, 2.3, 74), ...turn(puucWing(48, 5.48, 5), 0, [0, 0, 25]), ...turn(puucWing(44, 2.48, 3, true), 180, [0, 0, -25]), ...turn(puucWing(34, 3.48, 3), 90, [25, 0, 0]), ...turn(puucWing(34, 4.48, 3), -90, [-25, 0, 0]), stairFlight("院宫正前方进入高石台的完整宽阶", 10, 10, 2.3, .4, 0, [0, .18, -41], -90), stairFlight("宽庭到最高后长厅的完整中轴石阶", 10, 6, 3, .36, 0, [0, 2.48, 16.9], -90), stairFlight("宽庭到东长厅低石台的真实短阶", 5, 4, 1, .36, 0, [18.7, 2.48, 0], 0), stairFlight("宽庭到西长厅中石台的真实短阶", 8, 4, 2, .3, 0, [-18.1, 2.48, 0], 180)];
  return p;
}

function naveEnd(length: number): ModelPart {
  const profile = [{ x: -6.1, y: 0 }, { x: -6.1, y: 4.2 }, { x: -3.1, y: 6.5 }, { x: -3.1, y: 8.5 }, { x: 0, y: 10 }, { x: 3.1, y: 8.5 }, { x: 3.1, y: 6.5 }, { x: 6.1, y: 4.2 }, { x: 6.1, y: 0 }, { x: 1.5, y: 0 }, { x: 1.5, y: 3 }, { x: -1.5, y: 3 }, { x: -1.5, y: 0 }];
  return part("长堂外端沿高低屋盖轮廓封合且保留真门的完整立面", "extrude", stone, [0, .42, 8 + length], [1, 1, 1], [0, 0, 0], { depth: .5, profile });
}
function pilgrimageArm(length: number): ModelPart[] {
  const center = 8 + length / 2, count = Math.max(1, Math.floor(length / 4.5)), p: ModelPart[] = [box("八角庭向外延伸的三廊共同石铺地面", 0, .3, center, 12.2, .24, length), pitched("高中央长廊完整双坡石屋盖", 6.6, 1.5, length + .8, [0, 9, center]), naveEnd(length)];
  for (const s of [-1, 1]) {
    p.push(box("长堂低侧廊最外边完整石壁", s * 6.1, 2.52, center, .4, 4.2, length), arcadeWall("高中厅两侧真正透空的连续高窗拱壁", length, 2, [s * 3.1, 6.92, center], 90));
    const value = box("高中厅向外侧廊下降的整片单坡石屋盖", s * 4.6, 5.77, center, Math.hypot(3, 2.3), .2, length + .6); value.rotation.z = -s * Math.atan2(2.3, 3) * 180 / Math.PI; p.push(value);
    for (let i = 0; i <= count; i++) p.push(cylinder("中央高窗实墩下真正连续落地的高石柱", s * 3.1, 3.67, 8 + i * length / count, .48, 6.5, stone));
  }
  return p;
}
function cruciformPilgrimageSanctuary(): ModelPart[] {
  const radius = 10, outline: [number, number][] = Array.from({ length: 8 }, (_, i) => [Math.cos(Math.PI / 8 + i * Math.PI / 4) * radius, Math.sin(Math.PI / 8 + i * Math.PI / 4) * radius]), p: ModelPart[] = [base(68, 78), polygon("四臂共同环绕的中央八角石铺庭面", stone, outline, .24, [0, .18, 0]), cylinder("八角庭中央独立可见的纪念高石柱", 0, 5.42, 0, 1.1, 10, stone), cylinder("纪念高石柱上方独立小圆台", 0, 10.57, 0, 2.2, .3, stone)];
  for (let i = 0; i < 4; i++) {
    p.push(...turn(pilgrimageArm(i % 2 === 0 ? 24 : 18), i * 90, [0, 0, 0]));
    const value = arch(0, Math.cos(Math.PI / 8) * radius, 3.1, 6.5, .6, .5); value.position.y = .42; p.push(...turn([value], i * 90, [0, 0, 0]));
    const a = outline[(i * 2) % 8]!, b = outline[(i * 2 + 1) % 8]!, length = Math.hypot(b[0] - a[0], b[1] - a[1]), yaw = -Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI;
    p.push(...turn(door("八角庭四个斜角壁上的真实通孔", length, 7.2, .6, 2.5, [0, .42, 0], 3.6), yaw, [(a[0] + b[0]) / 2, 0, (a[1] + b[1]) / 2]));
  }
  return p;
}
