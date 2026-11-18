import { part, ring, type ModelPart } from "../assetModelParts";
import { glazedWall } from "./modernResidenceSpaceBatchOne";
import { boxesMesh, type SolidBox } from "./publicSpaceBatchEight";
import { box, cylinder, design, pipe, rail, type ArchitecturePrototype } from "./structures";
import { hardFloor } from "./vernacularWorldBatchSix";

const stone = "#b8bbae", roof = "#6e8582", steel = "#6d7d7e", copper = "#aa8a67", wood = "#a39172";

function rectangle(x0: number, x1: number, z0: number, z1: number): [number, number][] { return [[x0, z0], [x1, z0], [x1, z1], [x0, z1]]; }
function circle(x: number, z: number, r: number, count = 16): [number, number][] { return Array.from({ length: count }, (_, i) => { const a = i / count * Math.PI * 2; return [x + Math.cos(a) * r, z + Math.sin(a) * r]; }); }

// 原创三阶工坊建筑，不复制某个酒厂外观；高干料层、中酿造台和低发酵/出货层决定剖面。
// 各釜由底层独立支足承托，绝不靠楼板填住真实通层釜孔；公共观廊和员工阶梯分开。
// 工艺分层依据，原料靠重力送下而非声称整个生产过程完全无泵：
// https://historicengland.org.uk/images-books/publications/brewing-industry/bhs-brewing-ind-shier/
// https://www.hooky.co.uk/our-beers/brewing-process/
function tieredBreweryViewingWorks(): ModelPart[] {
  const boilOpening = circle(-.2, 4.3, 1.10).flatMap((point, i): [number, number][] => i === 9 ? [point, [-1.18, 3.58], [-1.18, 2.65], [-.68, 2.65], [-.68, 3.34]] : i === 10 ? [] : [point]);
  const p: ModelPart[] = [
    hardFloor("前塔酿造间西公共廊及东员工翼共同落地的完整工坊楼面", stone, [[-10, -8], [2, -8], [2, -4], [6, -4], [6, 8], [-10, 8]], .3, [0, 0, 0]),
    hardFloor("中层酿造楼板真实留出两釜通层孔与连通液管短槽而保留环向路", stone, rectangle(-6, 2, -8, 8), .25, [0, 3.25, 0], [circle(-3.7, 1, 1.10), boilOpening]),
    hardFloor("公共观廊二层楼面真实绕开独立直上梯井", wood, rectangle(-10, -6, -8, 8), .25, [0, 3.25, 0], [rectangle(-8.9, -7.1, -6.45, -.32)]),
    hardFloor("东员工翼二层工作廊真实留出独立上梯井", stone, rectangle(2, 6, -4, 8), .25, [0, 3.25, 0], [rectangle(3, 5, -1.85, 4.28)]),
    hardFloor("前塔干料层真实留出员工梯口和贯通料颈小孔", wood, rectangle(-6, 2, -8, -2), .25, [0, 6.15, 0], [rectangle(-.9, .9, -7.25, -3.2), circle(-2, -4.6, .37, 12)]),
    box("前塔干料层由连续高墙和柱梁真正封合的高屋盖", -2, 9.51, -5, 8.5, .22, 6.5, roof),
    hardFloor("低酿造后堂完整屋盖真正开出煮沸釜贯通烟孔", roof, rectangle(-6.25, 2.25, -2.2, 8.25), .22, [0, 6.60, 0], [circle(-.2, 4.3, .33, 12)]),
    box("西公共观廊在高塔侧真正独立封顶的低屋盖", -8, 6.71, 0, 4.5, .22, 16.5, roof),
    box("东员工楼梯翼独立封顶的低屋盖", 4, 6.71, 2, 4.5, .22, 12.5, roof),
    ...glazedWall("前塔原料接收宽门及上下独立真实采光窗", [-6, -8], [2, -8], .3, 9.4, [[-2.5, 4.5, 1.8, 1.3], [2.5, 4.5, 1.8, 1.3], [-2.5, 7.3, 1.8, 1.3], [2.5, 7.3, 1.8, 1.3]], [[0, .3, 2.8, 2.7]]),
    ...glazedWall("低发酵出货层后宽门及中酿造层完整高窗", [-6, 8], [2, 8], .3, 6.6, [[-2.6, 4.5, 1.7, 1.2], [2.6, 4.5, 1.7, 1.2]], [[0, .3, 2.8, 2.7]]),
    ...glazedWall("前塔超过低酿造屋盖的完整后高窗墙", [-6, -2], [2, -2], 6.4, 9.4, [[0, 7.25, 5, 1.4]]),
    ...glazedWall("高塔西侧超过公共廊屋顶的干料层外墙", [-6, -8], [-6, -2], 6.6, 9.4, [[0, 7.3, 3.5, 1.3]]),
    ...glazedWall("高塔东侧超过员工翼的干料层外墙", [2, -8], [2, -2], .3, 9.4, [[-1.6, 1.2, 1.6, 1.2], [-1.6, 4.5, 1.6, 1.2], [0, 7.3, 3.5, 1.3]]),
    ...glazedWall("公共廊与酿造生产之间上下独立玻璃观察隔界不设工作门", [-6, -8], [-6, 8], .3, 6.6, [[-4.7, 1.0, 4.2, 1.7], [2.8, 1.0, 5.4, 1.7], [-4.7, 4.1, 4.2, 1.9], [2.8, 4.1, 5.4, 1.9]]),
    ...glazedWall("西公共廊向室外实际采光的两层独立长窗", [-10, -8], [-10, 8], .3, 6.6, [[-4.5, 1, 4, 1.7], [3, 1, 4.5, 1.7], [-4.5, 4.1, 4, 1.9], [3, 4.1, 4.5, 1.9]]),
    ...glazedWall("公共参观者独立前街入口", [-10, -8], [-6, -8], .3, 6.6, [[0, 4.1, 2.5, 1.8]], [[0, .3, 1.6, 2.6]]),
    ...glazedWall("公共观廊后端完整闭壁及两层采光孔", [-10, 8], [-6, 8], .3, 6.6, [[0, 1, 2.5, 1.7], [0, 4.1, 2.5, 1.9]]),
    ...glazedWall("东侧员工翼外墙完整上下采光孔", [6, -4], [6, 8], .3, 6.6, [[-3, 1, 2.6, 1.7], [3, 1, 2.6, 1.7], [-3, 4.1, 2.6, 1.9], [3, 4.1, 2.6, 1.9]]),
    ...glazedWall("员工翼独立后门不穿过公共参观动线", [2, 8], [6, 8], .3, 6.6, [[0, 4.1, 2.3, 1.9]], [[0, .3, 1.6, 2.6]]),
    ...glazedWall("员工翼前端实际高窗和完整封墙", [2, -4], [6, -4], .3, 6.6, [[0, 1.2, 2.3, 1.4], [0, 4.1, 2.3, 1.9]]),
    ...glazedWall("员工翼分别入底层和中层生产区的真实内门", [2, -4], [2, 8], .3, 6.6, [], [[-2, .3, 1.3, 2.6], [3, 3.5, 1.3, 2.6]]),
  ];
  const structure: SolidBox[] = [], publicSteps: SolidBox[] = [], staffSteps: SolidBox[] = [], maltSteps: SolidBox[] = [], guard: SolidBox[] = [];
  for (const x of [-6, 2]) for (const z of [-7.7, -2.3, 2.4, 7.7]) structure.push({ center: [x, 3.45, z], size: [.22, 6.3, .22] });
  for (const x of [-6, 2]) for (const z of [-7.7, -2.3]) structure.push({ center: [x, 7.875, z], size: [.22, 3.05, .22] });
  for (const z of [-7.7, -2.3, 2.4, 7.7]) structure.push({ center: [-2, 3.10, z], size: [8.2, .3, .22] });
  for (const z of [2.4, 7.7]) structure.push({ center: [-2, 6.45, z], size: [8.2, .3, .22] });
  for (const z of [-7.7, -2.3]) structure.push({ center: [-2, 6.0, z], size: [8.2, .3, .22] }, { center: [-2, 9.25, z], size: [8.2, .3, .22] });
  for (const x of [-10, 6]) for (const z of x < 0 ? [-7.7, -.1, 7.7] : [-3.7, 4.5, 7.7]) structure.push({ center: [x, 3.45, z], size: [.20, 6.3, .20] });
  for (let i = 0; i < 16; i++) {
    const h = (i + 1) * .2;
    publicSteps.push({ center: [-8, .3 + h / 2, -6.4 + (i + .5) * .38], size: [1.6, h, .38] });
    staffSteps.push({ center: [4, .3 + h / 2, -1.8 + (i + .5) * .38], size: [1.8, h, .38] });
    const mh = (i + 1) * 2.9 / 16; maltSteps.push({ center: [0, 3.5 + mh / 2, -7.2 + (i + .5) * .25], size: [1.5, mh, .25] });
  }
  for (const [x, z0, z1, y] of [[-8.95, -6.4, -.32, 3.5], [-7.05, -6.4, -.32, 3.5], [2.95, -1.8, 4.28, 3.5], [5.05, -1.8, 4.28, 3.5], [-.95, -7.2, -3.2, 6.4], [.95, -7.2, -3.2, 6.4]]) {
    guard.push({ center: [x!, y! + 1.05, (z0! + z1!) / 2], size: [.055, .065, z1! - z0!] });
    for (const z of [z0!, (z0! + z1!) / 2, z1!]) guard.push({ center: [x!, y! + .52, z], size: [.055, 1.04, .055] });
  }
  for (const [centerX, startZ, run, bottom, rise, railBottom, offset] of [[-8, -6.4, .38, .3, .2, 1.28, .70], [4, -1.8, .38, .3, .2, 1.28, .78], [0, -7.2, .25, 3.5, 2.9 / 16, 4.48, .64]]) for (const i of [0, 5, 10, 15]) for (const side of [-1, 1]) {
    const foot = bottom! + (i + 1) * rise!, top = railBottom! + (i + .5) * rise!;
    guard.push({ center: [centerX! + side * offset!, (foot + top) / 2, startZ! + (i + .5) * run!], size: [.055, top - foot, .055] });
  }
  for (const side of [-1, 1]) p.push(rail([-8 + side * .70, 1.28, -6.4], [-8 + side * .70, 4.48, -.32], .055, steel));
  for (const side of [-1, 1]) p.push(rail([4 + side * .78, 1.28, -1.8], [4 + side * .78, 4.48, 4.28], .055, steel), rail([side * .64, 4.48, -7.2], [side * .64, 7.38, -3.2], .055, steel));
  for (const [name, color, pieces] of [["前塔生产楼层公共翼和员工翼全部真实承柱横梁", steel, structure], ["公共参观独立上梯的全部实体踏级", stone, publicSteps], ["员工独立上梯的全部实体踏级", steel, staffSteps], ["中层登上前塔干料层的全部实体踏级", wood, maltSteps], ["实际梯井边完整落到楼面的全部扶栏", steel, guard]] as [string, string, SolidBox[]][]) for (let start = 0; start < pieces.length; start += 20) p.push(boxesMesh(name, color, pieces.slice(start, start + 20)));
  for (const [x, z, bottom, top] of [[-3.7, 1, 2.2, 4.7], [-.2, 4.3, 1.65, 4.15]]) {
    p.push(hardFloor("通层大釜由独立支足承住且真留底部出液孔的厚底", copper, circle(x!, z!, 1.05), .10, [0, bottom! - .1, 0], [circle(x!, z!, .09, 8)]));
    const vat = ring("贯穿中楼板真孔的厚壁空腔酿造釜", copper, 1.05, .08, (bottom! + top!) / 2, top! - bottom!); vat.position.x = x!; vat.position.z = z!; p.push(vat);
    const outlet = ring("与真实釜底孔和穿底液管都有厚度交接的出液法兰", copper, .13, .08, bottom! - .05, .14); outlet.position.x = x!; outlet.position.z = z!; p.push(outlet);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) p.push(box("酿造釜从底层地面独立承到釜底的真实支足", x! + sx * .64, (.3 + bottom! - .10) / 2, z! + sz * .64, .12, bottom! - .4, .12, steel));
  }
  p.push(part("煮沸铜釜上方独立悬承且留真内腔的集汽罩", "lathe", copper, [-.2, 0, 4.3], [1, 1, 1], [0, 0, 0], { profile: [{ x: 1.15, y: 4.6 }, { x: 1.15, y: 4.68 }, { x: .30, y: 5.25 }, { x: .30, y: 5.4 }, { x: .22, y: 5.4 }, { x: .22, y: 5.23 }, { x: 1.07, y: 4.65 }, { x: 1.07, y: 4.6 }, { x: 1.15, y: 4.6 }] }));
  for (const side of [-1, 1]) p.push(box("低屋盖真正接到集汽罩肩骨壁的独立细吊杆", -.2 + side * 1.11, 5.65, 4.3, .035, 1.90, .035, steel));
  const flue = ring("集汽罩顶连续穿过真屋孔的中空蒸汽排管", copper, .30, .08, 6.3, 1.8); flue.position.x = -.2; flue.position.z = 4.3; p.push(flue);
  const flashing = ring("排管与屋面实接且保留内孔的防雨压边", steel, .36, .10, 6.68, .12); flashing.position.x = -.2; flashing.position.z = 4.3; p.push(flashing);
  p.push(part("上干料层有真底部出料颈的完整料斗", "lathe", wood, [-2, 0, -4.6], [1, 1, 1], [0, 0, 0], { profile: [{ x: .12, y: 6.05 }, { x: .15, y: 6.15 }, { x: .60, y: 6.8 }, { x: .60, y: 7.25 }, { x: .53, y: 7.25 }, { x: .53, y: 6.83 }, { x: .08, y: 6.17 }, { x: .08, y: 6.05 }, { x: .12, y: 6.05 }] }), part("由贯板料颈向低位敞口糖化釜连续下降的真实料槽管", "tube", wood, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: .075, path: [{ x: -2, y: 6.1, z: -4.6 }, { x: -3.1, y: 5.5, z: -1.9 }, { x: -3.7, y: 4.75, z: 1 }] }));
  p.push(rail([-2.5, 6.16, -4.6], [-2, 6.1, -4.6], .025, steel), rail([-3.1, 6.61, -1.9], [-3.1, 5.5, -1.9], .025, steel));
  for (const x of [-2.56, -1.44]) p.push(box("干料斗从前塔楼面真正承到斗肩壁的短支柱", x, 6.625, -4.6, .08, .45, .12, steel));
  p.push(part("从糖化釜真底孔沿釜外上转并越过低煮沸釜敞口的独立液路", "tube", copper, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: .055, path: [{ x: -3.7, y: 2.25, z: 1 }, { x: -3.7, y: 2.0, z: 1 }, { x: -2.1, y: 1.9, z: 2.5 }, { x: -.2, y: 4.40, z: 3.1 }, { x: -.2, y: 4.40, z: 4.0 }, { x: -.2, y: 4.25, z: 4.3 }] }));
  for (const [x, z] of [[-3.7, 5.8], [-.2, 6.8]]) p.push(cylinder("低发酵层圆容器独立接地的完整小基座", x!, .35, z!, 1.45, .10, stone), cylinder("酿造楼板下低位发酵容器完整封闭体", x!, 1.20, z!, 1.4, 1.6, steel));
  const cooler: SolidBox[] = [{ center: [-1.7, .95, 5.7], size: [.9, 1.3, .18] }, { center: [-1.7, .95, 6.5], size: [.9, 1.3, .18] }];
  for (const side of [-1, 1]) cooler.push({ center: [-1.7 + side * .4, 1.02, 6.1], size: [.07, .07, .9] });
  for (let i = 0; i < 7; i++) cooler.push({ center: [-1.7, 1.02, 5.87 + i * .08], size: [.80, 1.15, .035] });
  p.push(boxesMesh("从地面支起并保留板隙的麦汁冷却段", steel, cooler), part("从煮沸釜真底孔垂降后接低层冷却段的液路", "tube", copper, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: .04, path: [{ x: -.2, y: 1.7, z: 4.3 }, { x: -.2, y: 1.4, z: 4.3 }, { x: -1.7, y: 1.58, z: 5.7 }] }), pipe("冷却段接到左后低发酵容器的真实液路", [-1.7, 1.50, 6.1], [-3.7, 1.5, 5.8], .08), pipe("冷却段接到右后低发酵容器的真实液路", [-1.7, 1.5, 6.1], [-.2, 1.5, 6.8], .08));
  for (const [x, z0, z1, w] of [[-8, -10, -8, 2], [-2, -10, -8, 3.1]]) p.push(part("独立前门从室外连续接入低层的实楔坡", "extrude", stone, [x!, 0, 0], [1, 1, 1], [0, -90, 0], { profile: [{ x: z0!, y: 0 }, { x: z1!, y: 0 }, { x: z1!, y: .3 }], depth: w! }));
  for (const [x, w] of [[-2, 3.1], [4, 2]]) p.push(part("后出货与员工门各自连续接回室外的实楔坡", "extrude", stone, [x!, 0, 0], [1, 1, 1], [0, -90, 0], { profile: [{ x: 8, y: 0 }, { x: 10, y: 0 }, { x: 8, y: .3 }], depth: w! }));
  return p;
}

export const everydayFoodProductionSpaceBatchOneDesigns: ArchitecturePrototype[] = [
  design("三阶重力酿造观廊工坊", "前高塔干料层经真料颈与下降料槽接中层敞口糖化釜，中层双釜穿过真实楼板孔并由底层独立支足承重，低冷却和发酵区面向后货门；西公共观廊独立上梯、连续玻璃隔界，东员工梯再经前塔内梯登干层。三套真梯井与高低屋体、真烟孔构成完整分层酿造建筑", tieredBreweryViewingWorks, "建筑", "现代"),
];
