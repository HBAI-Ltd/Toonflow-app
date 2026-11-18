import { part, beam, ring, type ModelPart, type Triple } from "../assetModelParts";
import { combineMeshes } from "../natureParts";
import { polygon } from "../masterNature/shared";
import { box, cylinder, design } from "./structures";
import { halfRoundWall, rectangularFlue } from "./spatialShells";
import { doorWall, gableCover, slopePanel } from "./vernacularWorldBatchOne";

const wood = "#8a6c4f", stone = "#aaa495", earth = "#b09a77", bark = "#b2a18b", hide = "#c9b798", sod = "#808267", dark = "#665d4a";

// 构造依据：NPS真实建筑/考古说明、州立博物馆和保存机构；没有下载其模型或图片。
// https://home.nps.gov/places/tipton-place.htm
// https://www.nps.gov/places/pithouse-early-pueblos.htm
// https://nmhistoricsites.org/jemez/vr/4
// https://www.museum.state.il.us/muslink/nat_amer/pre/htmls/w_shelter.html
// https://history.nebraska.gov/publications_section/sod-house-construction/
export const vernacularWorldBatchTwoDesigns = [
  design("两木室贯风中廊住宅", "两个独立木居室分处左右，共同屋盖下中部保留前后贯通的无遮壁风廊，内门直接通向风廊", dogtrotHouse, "建筑", "欧式"),
  design("单宽连门轴线窄长住宅", "一间宽的三室沿长轴串接，前门、两道内门和后门在同一通风线上，入口窄廊与侧窗真实开洞，内部没有旁置走廊", shotgunHouse, "建筑", "欧式"),
  design("梯入平顶阶台房群", "厚泥土壁围出独立空房，室外梯逐层到达真实屋顶入口，后部上下叠室共用竖向梯洞，前平屋顶可通行而非实心阶梯块", puebloRoomBlock, "建筑", "异域"),
  design("屋顶梯入通风圆形基瓦室", "半地下圆室的地坪火塘、侧向低风道、外竖井和挡风石形成连续路径，平顶格梁在入口洞周围承重，长梯穿洞进入实际空室", kivaRoom, "建筑", "异域"),
  design("八壁叠木旋井覆土霍根屋", "八面水平叠木壁围出入口与内室，屋顶多层转角方框逐层内收托住覆土壳，顶心留通烟口", hoganHouse, "建筑", "异域"),
  design("沉厅竖板通烟长屋", "直长方板壁长屋由成对粗柱和长脊梁承担木板双坡盖，室内低于周边坐卧台，中央屋顶留连续烟口，端门通往真实下沉大厅", plankHouse, "建筑", "异域"),
  design("弯肋覆树皮穹形住所", "弯折幼树肋与水平箍圈相绑，薄树皮片连续包覆成椭圆穹室，低前门和小顶烟口均贯通，内部设环侧坐卧台", wigwamHouse, "建筑", "异域"),
  design("交杆开烟瓣斜锥皮帐", "长杆在偏心高处相交而形成倾斜锥形帐身，低门、顶烟口和两片由外杆撑开的烟瓣完整保留", tipiLodge, "建筑", "异域"),
  design("双木囤悬臂上仓谷棚", "两座落地横木囤承托外挑上仓，大屋盖与上仓超出下囤形成遮畜空间，中间保留贯穿车道", cantileverCribBarn, "建筑", "欧式"),
  design("草皮砖厚墙低坡住屋", "切块草皮分层堆成厚墙，真实门窗中设木框，中央叉柱和原木椽托住枝层与厚覆土草屋盖，围出可使用的完整低室", sodHouse, "建筑", "欧式"),
];

function sideDoor(x: number, z: number, length: number, height: number, floor: number, width: number, color: string): ModelPart[] {
  return doorWall("向中廊开口的侧门墙", 0, 0, length, height, .18, width, 2.05, color, floor).map(value => { value.position = { x, y: value.position.y, z: z - value.position.x }; value.rotation.y = 90; return value; });
}

export function endGable(x: number, z: number, width: number, bottom: number, rise: number, color: string): ModelPart {
  return part("双坡屋盖以下的三角山墙", "extrude", color, [x, 0, z], [1, 1, 1], [0, 0, 0], { depth: .12, profile: [{ x: -width / 2, y: bottom }, { x: width / 2, y: bottom }, { x: 0, y: bottom + rise }] });
}

export function sideWindow(x: number, centerZ: number, length: number, floor: number, height: number, color: string, thickness = .16): ModelPart[] {
  return [box("侧窗下完整墙板", x, floor + .55, centerZ, thickness, 1.1, length, color), box("侧窗上完整墙板", x, floor + (height + 2.02) / 2, centerZ, thickness, height - 2.02, length, color), ...[-1, 1].map(side => box("侧窗两端墙板", x, floor + 1.56, centerZ + side * (length + .82) / 4, thickness, .92, (length - .82) / 2, color))];
}

export function ladder(name: string, x: number, startY: number, startZ: number, endY: number, endZ: number, steps: number): ModelPart[] {
  const p: ModelPart[] = [-1, 1].map(side => beam(`${name}贯通边杆`, wood, [x + side * .35, startY, startZ], [x + side * .35, endY, endZ], .085));
  const rungs: ModelPart[] = [];
  for (let i = 1; i <= steps; i++) { const t = i / (steps + 1), y = startY + (endY - startY) * t, z = startZ + (endZ - startZ) * t; rungs.push(slopePanel(`${name}独立踏档`, [[x - .39, y + .0375, z - .0425], [x + .39, y + .0375, z - .0425], [x + .39, y + .0375, z + .0425], [x - .39, y + .0375, z + .0425]], .075, wood)); }
  p.push(combineMeshes(`${name}全部保留间隔的独立踏档`, wood, rungs));
  return p;
}

function dogtrotHouse(): ModelPart[] {
  const roof = gableCover("两个木室与中央风道共同屋盖", 6.8, 12, 3.28, 1.7, "#797b67"); roof.forEach(value => { value.rotation.y = 90; });
  const p: ModelPart[] = [box("两室和风廊共用抬高木地板", 0, .55, 0, 11.4, .22, 6.2, wood), ...roof];
  for (const x of [-4.8, 0, 4.8]) for (const z of [-2.5, 2.5]) p.push(box("住宅木地板下独立石脚", x, .22, z, .65, .44, .65, stone));
  for (const side of [-1, 1]) {
    const centerX = side * 3.45;
    p.push(box("外侧木室通长横木壁", side * 5.55, 2.02, 0, .2, 2.72, 5.8, wood), ...doorWall("木室向前门廊的入口", centerX, -2.9, 4.2, 2.72, .18, .92, 2.1, wood, .66), box("木居室后封墙", centerX, 2.02, 2.9, 4.2, 2.72, .18, wood), ...sideDoor(side * 1.35, 0, 5.8, 2.72, .66, .95, wood));
  }
  for (const end of [-1, 1]) { const gable = endGable(end * 5.55, 0, 5.8, 3.38, 1.45, wood); gable.rotation.y = 90; p.push(gable); }
  p.push(box("联系中央风廊两侧木室的短横枋", 0, 3.25, 0, 2.8, .22, .22, wood));
  for (const side of [-1, 1]) p.push(box("两端居室外独立石烟囱底墩", side * 5.9, 1.8, .9, .7, 3.2, .85, stone), rectangularFlue("高出檐口且顶端真实贯通的烟道", .45, .5, 1.7, .08, [side * 5.9, 3.21, .9], stone));
  return p;
}

function shotgunHouse(): ModelPart[] {
  const p: ModelPart[] = [box("长轴三室一体木地板", 0, .52, 0, 4.25, .18, 13, wood), ...gableCover("单间宽窄长木宅屋盖", 4.7, 15, 3.65, 1.1, "#78837a", 0, -.8)];
  for (const x of [-1.75, 1.75]) for (const z of [-5.9, 0, 5.9]) p.push(box("窄宅地板下抬离湿土的石墩", x, .22, z, .45, .44, .45, stone));
  for (const side of [-1, 1]) for (const z of [-4.3, 0, 4.3]) p.push(...sideWindow(side * 2.05, z, 4.3, .61, 3.04, "#b4aa8e"));
  for (const z of [-6.5, -2.15, 2.15, 6.5]) p.push(...doorWall("同一直线可通风的前后门与室间门", 0, z, 4.1, 3.04, .13, .92, 2.25, "#b4aa8e", .61));
  for (const end of [-1, 1]) p.push(endGable(0, end * 6.5, 4.1, 3.65, 1, "#b4aa8e"));
  p.push(box("窄宅前沿抬高门廊板", 0, .52, -7.25, 4.3, .18, 1.5, wood), ...[-1, 1].map(side => box("前门廊两角承檐柱", side * 1.9, 2.1, -7.8, .13, 3, .13, wood)), box("入口低石阶", 0, .2, -8.3, 1.3, .4, .6, stone));
  return p;
}

function puebloChamber(x: number, z: number, floor: number, usesLowerRoof: boolean): ModelPart[] {
  const outer: [number, number][] = [[-2.3, -2.25], [2.3, -2.25], [2.3, 2.25], [-2.3, 2.25]], opening: [number, number][] = [[-.63, -.63], [.63, -.63], [.63, .63], [-.63, .63]];
  const p: ModelPart[] = [...(usesLowerRoof ? [] : [polygon("房室木梁泥土地板", earth, outer, .2, [x, floor, z])]), polygon("可以上人且中央梯洞贯穿的平屋顶", earth, outer, .2, [x, floor + 3.1, z], [opening])];
  for (const side of [-1, 1]) p.push(box("厚泥房室左右外壁", x + side * 2.15, floor + 1.65, z, .3, 2.9, 4.2, earth), box("厚泥房室前后外壁", x, floor + 1.65, z + side * 2.1, 4.6, 2.9, .3, earth));
  for (const side of [-1, 1]) p.push(box("绕开顶入口的长向承顶木梁", x + side * .84, floor + 3.04, z, .16, .18, 4.4, wood), box("梯口两端收边横梁", x, floor + 3.04, z + side * .8, 4.4, .18, .15, wood));
  return p;
}

function puebloRoomBlock(): ModelPart[] {
  const p: ModelPart[] = [...puebloChamber(-2.3, -2.2, 0, false), ...puebloChamber(2.3, -2.2, 0, false), ...puebloChamber(0, 2.3, 0, false), ...puebloChamber(0, 2.3, 3.1, true)];
  for (const x of [-2.3, 2.3]) p.push(...ladder("通向前平屋顶的外木梯", x, .2, -6, 3.9, -4.3, 9));
  for (const x of [-2.3, 2.3]) p.push(...ladder("由平屋顶洞实际落入前室的内木梯", x, .2, -2.55, 3.9, -1.9, 9));
  p.push(...ladder("后部上下两房共用的穿洞长梯", 0, .2, 2.14, 7, 2.7, 16));
  return p;
}

function kivaRoom(): ModelPart[] {
  const circle = (r: number, cx = 0, cz = 0): [number, number][] => Array.from({ length: 24 }, (_, i) => [cx + Math.cos(i * Math.PI / 12) * r, cz + Math.sin(i * Math.PI / 12) * r]);
  const p: ModelPart[] = [polygon("地坪中央真正下凹的火塘口", earth, circle(3.8), .2, [0, .12, 0], [circle(.45)]), cylinder("火塘下方封闭石底", 0, .06, 0, .9, .12, stone), halfRoundWall("覆土基座下方避让低风道的弧形土体", 5.3, 1.5, .62, [0, 0, 0], 75, earth, Math.PI * 330 / 180), part("围住下沉圆室且自然向外坡落的厚覆土", "lathe", earth, [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 5.3, y: .62 }, { x: 4.8, y: 2.7 }, { x: 4.4, y: 3.54 }, { x: 3.8, y: 3.54 }, { x: 3.8, y: .62 }, { x: 5.3, y: .62 }] }), halfRoundWall("圆室低位实际开风道口的内石壁", 3.8, .24, .48, [0, .2, 0], 85, stone, Math.PI * 350 / 180), ring("低风口以上完整石内衬", stone, 3.8, .24, 2.04, 2.72), halfRoundWall("周边坐台在风道开口实际断开", 3.5, .55, .44, [0, .32, 0], 80, stone, Math.PI * 340 / 180)];
  const hatch: [number, number][] = [[-.8, -.8], [.8, -.8], [.8, .8], [-.8, .8]];
  p.push(polygon("顶心留真实出入兼排烟洞的承土屋面", earth, circle(4.4), .18, [0, 3.5, 0], [hatch]), box("低风道接入圆室前的挡风石", 0, .58, -1.9, 1.1, .52, .12, stone));
  for (const side of [-1, 1]) p.push(box("地下水平进风道连续侧石壁", side * .3, .45, -4.72, .12, .5, 3.12, stone), box("风道外竖井左右厚壁", side * .32, 1.95, -6.05, .12, 3.5, .7, stone), box("屋顶洞两边承顶长梁", side * 1.04, 3.42, 0, .22, .18, 7.1, wood), box("顶入口前后避洞横向格梁", 0, 3.42, side * 1.05, 7.1, .18, .22, wood));
  p.push(box("水平风道顶石", 0, .75, -4.72, .72, .1, 3.12, stone), box("外竖井后壁", 0, 1.95, -6.35, .7, 3.5, .12, stone), box("竖井前壁在低风道口之上起砌", 0, 2.2, -5.75, .7, 3, .12, stone), ...ladder("穿过顶心开口的进室梯", 0, .32, .5, 4.25, .72, 10));
  for (const side of [-1, 1]) for (const end of [-1, 1]) p.push(box("坐台上承接屋顶长梁的石扶壁柱", side * 2.45, 2.13, end * 2.2, .5, 2.74, .5, stone));
  return p;
}

export function courseWall(name: string, x: number, z: number, length: number, thickness: number, floor: number, rows: number, step: number, color: string, yaw = 0, opening = 0, openRows = 0): ModelPart {
  const pieces: ModelPart[] = [];
  for (let row = 0; row < rows; row++) {
    const top = floor + (row + 1) * step;
    const spans = row < openRows ? [[-length / 2, -opening / 2], [opening / 2, length / 2]] : [[-length / 2, length / 2]];
    for (const [a, b] of spans) pieces.push(slopePanel(name, [[a!, top, -thickness / 2], [b!, top, -thickness / 2], [b!, top, thickness / 2], [a!, top, thickness / 2]], step + .008, color));
  }
  const wall = combineMeshes(name, color, pieces); wall.position = { x, y: 0, z }; wall.rotation.y = yaw; return wall;
}

function hoganHouse(): ModelPart[] {
  const p: ModelPart[] = [cylinder("八边叠木屋内的压实地坪", 0, .1, 0, 7.5, .2, earth)];
  for (let i = 0; i < 8; i++) { const a = (i * 45 - 90) * Math.PI / 180; p.push(courseWall("咬合叠置且在前壁留下门洞的横木墙", Math.cos(a) * 3.35, Math.sin(a) * 3.35, 2.9, .3, .2, 8, .3, wood, 90 - a * 180 / Math.PI, i === 0 ? 1.05 : 0, i === 0 ? 6 : 0)); }
  for (let layer = 0; layer < 7; layer++) {
    const angle = layer * Math.PI / 8, radius = 2.55 - layer * .32, y = 2.73 + layer * .23;
    const corners: Triple[] = [[-radius, y, -radius], [radius, y, -radius], [radius, y, radius], [-radius, y, radius]].map(([x, h, z]) => [x! * Math.cos(angle) - z! * Math.sin(angle), h!, x! * Math.sin(angle) + z! * Math.cos(angle)]);
    p.push(combineMeshes("逐层转角搭接内收的方井屋顶横木", wood, corners.map((a, i) => { const b = corners[(i + 1) % 4]!, dx = b[0] - a[0], dz = b[2] - a[2], n = Math.hypot(dx, dz), nx = -dz / n * .14, nz = dx / n * .14; return slopePanel("四角交错搭接原木顶框", [[a[0] + nx, y + .13, a[2] + nz], [b[0] + nx, y + .13, b[2] + nz], [b[0] - nx, y + .13, b[2] - nz], [a[0] - nx, y + .13, a[2] - nz]], .27, wood); })));
  }
  p.push(part("实际顶心留通烟孔的覆土保温壳", "lathe", earth, [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 3.68, y: 2.7 }, { x: 3, y: 3.4 }, { x: .48, y: 4.48 }, { x: .48, y: 4.25 }, { x: 2.82, y: 3.17 }, { x: 3.4, y: 2.7 }, { x: 3.68, y: 2.7 }] }), box("叠木屋入口前的低石门槛", 0, .24, -3.5, 1.15, .08, .8, stone), ...[-1, 1].map(side => box("横木洞口两侧竖直木门梃", side * .54, 1.11, -3.38, .12, 1.82, .4, wood)), box("门梃上承住高层横木的木楣", 0, 2.03, -3.38, 1.2, .15, .4, wood));
  return p;
}

function plankHouse(): ModelPart[] {
  const p: ModelPart[] = [box("长屋下沉中央厅的完整泥土底坪", 0, .1, 0, 8.3, .2, 17.4, earth)];
  for (const side of [-1, 1]) { p.push(box("比中央厅抬高的连续侧卧坐台", side * 3.1, .52, 0, 1.7, .64, 16.5, wood), box("主承柱沿纵向连接的长脊侧梁", side * 2.5, 3.95, 0, .24, .28, 17.4, wood)); for (const z of [-6.8, 6.8]) p.push(cylinder("独立粗木内承柱", side * 2.5, 2.07, z, .32, 3.74, wood)); for (let i = 0; i < 12; i++) p.push(box("竖向相接并落在周边沟基的劈杉围板", side * 4.1, 1.65, -7.98 + i * 1.45, .13, 2.9, 1.45, wood));
    for (const [a, b] of [[-8.8, -1.2], [1.2, 8.8]]) p.push(slopePanel("长屋烟孔前后的连续木板坡面", [[side * 4.5, 3.1, a!], [0, 5.2, a!], [0, 5.2, b!], [side * 4.5, 3.1, b!]], .12, wood));
    p.push(slopePanel("中央烟孔外侧仍连续排雨的木板坡面", [[side * 4.5, 3.1, -1.2], [side * .42, 5.004, -1.2], [side * .42, 5.004, 1.2], [side * 4.5, 3.1, 1.2]], .12, wood));
  }
  for (const end of [-1, 1]) p.push(...doorWall("端面竖板围壁的低出入口", 0, end * 8.7, 8.2, 2.9, .13, 1, 2.05, wood, .2), endGable(0, end * 8.7, 8.2, 3.1, 1.92, wood));
  for (const z of [-6.8, 6.8]) p.push(box("内粗柱间的全宽横梁", 0, 3.95, z, 5.35, .26, .26, wood), ...[-1, 1].map(side => beam("由高内柱继续收至烟脊的粗椽", wood, [side * 2.5, 3.95, z], [0, 5.08, z], .2)));
  p.push(box("低大厅中央的长形石围火床", 0, .25, 0, 1.1, .1, 2.1, stone), box("端门下降到中央厅的木踏台", 0, .34, -7.9, 1.2, .28, .8, wood));
  return p;
}

function wigwamHouse(): ModelPart[] {
  const p: ModelPart[] = [cylinder("椭圆穹形住屋完整土底坪", 0, .06, 0, 6.3, .12, earth)]; p[0]!.scale.z = 5.5;
  for (let sector = 0; sector < 16; sector++) {
    const pieces: ModelPart[] = [];
    for (let row = 0; row < 8; row++) {
      if ((sector === 11 || sector === 12) && row < 3) continue;
      const point = (r: number, s: number): Triple => { const phi = r * (Math.PI / 2 - .07) / 8, theta = s * Math.PI / 8; return [Math.cos(theta) * Math.cos(phi) * 3, .12 + Math.sin(phi) * 2.6, Math.sin(theta) * Math.cos(phi) * 2.55]; };
      pieces.push(slopePanel("彼此搭接的厚树皮覆片", [point(row, sector), point(row, sector + 1), point(row + 1, sector + 1), point(row + 1, sector)], .045, bark));
    }
    p.push(combineMeshes("保留低门洞与顶烟口的连续树皮围壳", bark, pieces));
  }
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 4;
    p.push(part("从地脚完整弯越屋顶的幼木拱肋", "tube", wood, [0, .12, 0], [1, 1, 1], [0, 0, 0], { radius: .04, path: Array.from({ length: 9 }, (_, j) => { const angle = j * Math.PI / 8; return { x: Math.cos(a) * Math.cos(angle) * 2.93, y: Math.sin(angle) * 2.53, z: Math.sin(a) * Math.cos(angle) * 2.48 }; }) }));
  }
  const hoop = ring("绑在弯肋中上部的水平约束木箍", wood, 2.24, .04, 1.74, .07); hoop.scale.z = .85;
  p.push(hoop, box("靠后树皮墙的木坐卧台", 0, .33, 1.65, 3, .42, .85, wood), cylinder("中央火塘不燃石床", 0, .17, -.2, .85, .1, stone));
  return p;
}

function tipiLodge(): ModelPart[] {
  const p: ModelPart[] = [cylinder("皮帐内部平整起居地垫", 0, .035, 0, 6.3, .07, earth)];
  const skin = (sector: number, t: number): Triple => { const a = sector * Math.PI / 8, r = 3.3 * (1 - t) + .45 * t; return [Math.cos(a) * r, .12 + 4.68 * t, .55 * t + Math.sin(a) * r]; };
  for (let i = 0; i < 16; i++) {
    const front = i === 11 || i === 12, start = front ? .32 : 0, end = front ? .84 : 1;
    p.push(slopePanel("在前方留下低门及高烟口的斜锥皮片", [skin(i, start), skin(i + 1, start), skin(i + 1, end), skin(i, end)], .025, hide));
  }
  for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; p.push(beam("在高处交叉并伸出帐顶的长支杆", wood, [Math.cos(a) * 3.22, .08, Math.sin(a) * 3.22], [-Math.cos(a) * .22, 5.8, .62 - Math.sin(a) * .22], .07)); }
  for (const side of [-1, 1]) p.push(slopePanel("由独立外杆撑开并保留风缝的三角烟瓣", [[side * .3, 3.95, .03], [side * 1.25, 4.7, -.45], [side * .38, 5.15, .2]], .028, hide), beam("从帐外地脚撑住烟瓣外尖的独立调向杆", wood, [side * 1.7, 0, -3.9], [side * 1.25, 4.7, -.45], .06));
  const tie = ring("交杆束点紧贴杆束的绕绳", dark, .19, .035, 5, .12); tie.position.z = .56; p.push(tie, cylinder("中央火塘石底", 0, .13, .1, 1.1, .12, stone));
  return p;
}

function cantileverCribBarn(): ModelPart[] {
  const p: ModelPart[] = [box("贯穿车道与两木囤下方的完整石坪", 0, .12, 0, 11, .24, 11, stone)];
  for (const side of [-1, 1]) {
    p.push(courseWall("下木囤前壁的实际出入口", side * 3.1, -2.35, 3, .25, .24, 8, .3, wood, 0, .85, 6), courseWall("下木囤封闭后横木壁", side * 3.1, 2.35, 3, .25, .24, 8, .3, wood));
    for (const edge of [-1, 1]) p.push(courseWall("下囤独立纵向横木承墙", side * 3.1 + edge * 1.4, 0, 4.9, .25, .24, 8, .3, wood, 90));
  }
  for (const z of [-2.1, 0, 2.1]) p.push(box("跨越车道并向两侧悬出的粗横梁", 0, 2.82, z, 10.6, .36, .35, wood));
  p.push(box("双囤共同支起且四周外挑的上仓木楼板", 0, 3.07, 0, 10.7, .18, 9.4, wood), ...gableCover("覆盖大上仓与下部车道的完整屋盖", 11.4, 10, 5.7, 2.1, "#7f7c67"));
  for (const side of [-1, 1]) p.push(box("上仓左右高位围板", side * 5.2, 4.38, 0, .15, 2.45, 9.4, wood));
  for (const end of [-1, 1]) p.push(...doorWall("上仓端面装草口", 0, end * 4.7, 10.55, 2.45, .12, 1.1, 1.85, wood, 3.16), endGable(0, end * 4.7, 10.55, 5.7, 1.94, wood));
  return p;
}

function sodHouse(): ModelPart[] {
  const p: ModelPart[] = [box("完整草皮砖住屋的夯土地坪", 0, .1, 0, 6.5, .2, 8.4, earth), courseWall("南面厚草皮砖墙真实门洞", 0, -3.9, 6.2, .62, .2, 8, .29, sod, 0, 1, 6), courseWall("背部水平堆砌草皮砖厚墙", 0, 3.9, 6.2, .62, .2, 8, .29, sod)];
  for (const side of [-1, 1]) {
    const pieces: ModelPart[] = [];
    for (let row = 0; row < 8; row++) {
      const top = .2 + (row + 1) * .29, spans = row >= 3 && row <= 5 ? [[-3.9, -.48], [.48, 3.9]] : [[-3.9, 3.9]];
      for (const [a, b] of spans) pieces.push(slopePanel("侧窗上下真实层叠草皮砖", [[side * 3.1 - .31, top, a!], [side * 3.1 + .31, top, a!], [side * 3.1 + .31, top, b!], [side * 3.1 - .31, top, b!]], .298, sod));
    }
    p.push(combineMeshes("厚侧草皮墙中真实窗洞与窗下槛", sod, pieces), box("侧窗洞底的木窗台", side * 3.1, 1.06, 0, .72, .1, 1.08, wood), box("侧窗上方承压木楣", side * 3.1, 1.96, 0, .72, .1, 1.08, wood));
    for (const end of [-1, 1]) p.push(box("侧窗两端木窗框", side * 3.1, 1.52, end * .48, .72, .88, .08, wood));
  }
  p.push(...gableCover("原木椽上连续厚覆土草的低坡屋盖", 7.1, 8.9, 2.53, .86, sod), cylinder("内室中央直接落地的叉承木柱", 0, 1.46, .6, .2, 2.52, wood), beam("叉柱顶分开支住脊木的短叉", wood, [0, 2.65, .6], [-.23, 3.22, .6], .12), beam("叉柱顶另一短叉", wood, [0, 2.65, .6], [.23, 3.22, .6], .12), cylinder("横贯草皮屋中央的长原木脊梁", 0, 3.18, 0, .23, 8.5, wood, [90, 0, 0]));
  for (const z of [-3.8, -1.9, 0, 1.9, 3.8]) for (const side of [-1, 1]) p.push(beam("从厚草皮墙顶接到脊梁的原木屋椽", wood, [side * 3.15, 2.43, z], [0, 3.2, z], .14));
  for (const end of [-1, 1]) p.push(endGable(0, end * 3.9, 6.3, 2.52, .75, sod));
  return p;
}
