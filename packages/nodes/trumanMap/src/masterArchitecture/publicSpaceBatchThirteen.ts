import { part, type ModelPart } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { box, cylinder, design, rail, colors } from "./structures";
import { doorway } from "./publicSpaceBatchOne";
import { stairFlight } from "./publicSpaceBatchTwo";
import { paint } from "./publicSpaceBatchFive";
import { boxesMesh, type SolidBox } from "./publicSpaceBatchEight";

const stone = "#b9b7a7", dark = "#526a6e", wood = "#a99068", ceramic = "#d4d9ce";

export function restroomBowl(name: string, x: number, y: number, z: number): ModelPart {
  return part(name, "lathe", ceramic, [x, y, z], [1, 1, 1], [0, 0, 0], { profile: [{ x: .18, y: 0 }, { x: .23, y: .22 }, { x: .38, y: .34 }, { x: .38, y: .42 }, { x: .29, y: .42 }, { x: .23, y: .26 }, { x: .15, y: .25 }, { x: .15, y: 0 }] });
}

export function restroomBasin(name: string, x: number, y: number, z: number): ModelPart {
  return part(name, "lathe", ceramic, [x, y, z], [1, 1, 1], [0, 0, 0], { profile: [{ x: .08, y: -.25 }, { x: .25, y: -.04 }, { x: .25, y: 0 }, { x: .21, y: 0 }, { x: .06, y: -.22 }, { x: .04, y: -.25 }] });
}

export const publicSpaceBatchThirteenDesigns = [
  design("分池架桥跳水中心", "长道泳池与横向深跳池具有不同实际池底标高，连续分段阶梯通向错位高跳台，后部架空观摩桥从独立侧梯进入，蝶谷高屋盖围住完整双池场馆", divingCenter, "建筑", "现代"),
  design("双院分区洗浴中心", "前部更衣翼分别接入后方淋浴廊，中央露天干庭与后部露天浴庭分开，大小泡池真正下沉于连续地台，中央公共入口与两翼过渡门洞各自独立", bathingCenter, "建筑", "现代"),
  design("折廊分院公园卫生间", "两片错向布置的卫生翼从相反方向进入，独立门洞接到真实厕格和有开孔盆体的洗手台，中央窄庭提供采光，前后公共雨棚联通室外步行区域", parkRestroom, "建筑", "现代"),
];

function poolEnd(z: number, entrance: boolean): ModelPart {
  const profile = entrance ? [{ x: -34, y: 0 }, { x: -1.5, y: 0 }, { x: -1.5, y: 4 }, { x: 1.5, y: 4 }, { x: 1.5, y: 0 }, { x: 34, y: 0 }, { x: 34, y: 20 }, { x: 0, y: 18 }, { x: -34, y: 20 }] : [{ x: -34, y: 0 }, { x: 34, y: 0 }, { x: 34, y: 20 }, { x: 0, y: 18 }, { x: -34, y: 20 }];
  return part("双池场馆沿蝶谷屋盖剖面实际封合的端墙", "extrude", stone, [0, 6.3, z], [1, 1, 1], [0, 0, 0], { depth: .25, profile });
}

function divingCenter(): ModelPart[] {
  const outside: [number, number][] = [[-34, -45], [34, -45], [34, 45], [-34, 45]], lap: [number, number][] = [[-24.5, -37], [.5, -37], [.5, 13], [-24.5, 13]], dive: [number, number][] = [[2.5, 14.5], [27.5, 14.5], [27.5, 35.5], [2.5, 35.5]];
  const p: ModelPart[] = [polygon("双池场馆和前方实际入场阶梯共同落地场坪", stone, [[-36, -55], [36, -55], [36, 46], [-36, 46]], .3), polygon("深浅双池真正挖空的整体高地坪", stone, outside, 6, [0, .3, 0], [lap, dive]), box("长道泳池较高的真实池底实体基础", -12, 2.05, -12, 25, 3.5, 50, ceramic), poolEnd(-45, true), poolEnd(45, false)];
  for (const [x, z, width, depth, bottom] of [[-12, -12, 25, 50, 3.8], [15, 25, 25, 21, .3]]) {
    for (const side of [-1, 1]) p.push(box("两池各自高度不同且真正封水的纵向池壁", x! + side * (width! / 2 - .04), (bottom! + 6.3) / 2, z!, .08, 6.3 - bottom!, depth!, ceramic), box("两池各自高度不同且真正封水的横向池壁", x!, (bottom! + 6.3) / 2, z! + side * (depth! / 2 - .04), width!, 6.3 - bottom!, .08, ceramic));
    p.push(part("独立池壁内实际低于岸边的静态水面", "box", colors.water, [x!, 5.985, z!], [width! - .2, .03, depth! - .2], [0, 0, 0], { opacity: .62, roughness: .13 }));
  }
  const angle = Math.atan2(2, 34) * 180 / Math.PI;
  for (const side of [-1, 1]) {
    p.push(part("外高内低并连续接合的双池蝶谷大屋面", "box", dark, [side * 17, 25.3, 0], [Math.hypot(34, 2), .25, 90], [0, 0, side * angle]), box("双池场馆两侧高窗下实体围墙", side * 34, 7.05, 0, .3, 1.5, 90, stone), box("双池场馆两侧高窗上完整承顶梁", side * 34, 25.8, 0, .35, 1, 90, stone), part("长道与高跳台共用的整面透明侧窗", "box", colors.glass, [side * 34, 16.55, 0], [.06, 17.5, 90], [0, 0, 0], { opacity: .22 }));
  }
  for (let flight = 0; flight < 3; flight++) p.push(stairFlight("从场地地面实际升到六米高双池岸边的入场阶梯", 0, .3 + flight * 2, -54.3 + flight * 3, 3, 10, .2, .3));
  p.push(box("入场阶梯与高池岸齐平的真实落脚平台", 0, 6.175, -45, 3, .25, .6, stone));
  const tower: SolidBox[] = [];
  for (const x of [28.4, 31.6]) for (const z of [20, 28]) tower.push({ center: [x, 11.3, z], size: [.3, 10, .3] });
  for (let flight = 0; flight < 4; flight++) {
    const reverse = flight % 2 === 1, endZ = reverse ? 22 : 25, top = 8.8 + flight * 2.5;
    p.push(stairFlight("独立跳塔内部连续四十八级折返阶梯", reverse ? 30.7 : 29.3, 6.3 + flight * 2.5, reverse ? 25 : 22, 1.1, 12, 2.5 / 12, .25, reverse));
    tower.push({ center: [30, top - .1, endZ + (reverse ? -.3 : .3)], size: [3.5, .2, .6] });
    if (!flight) continue;
    const z = endZ + (reverse ? -1.5 : 1.5);
    p.push(box("五米七点五米及十米层位的实际悬挑跳台", 27, top - .1, z, 8, .2, 3, stone));
    for (const side of [-1, 1]) p.push(rail([25, top + 1.1, z + side * 1.5], [31, top + 1.1, z + side * 1.5], .06, dark));
    for (const x of [25, 31]) for (const side of [-1, 1]) tower.push({ center: [x, top + .55, z + side * 1.5], size: [.06, 1.1, .06] });
  }
  for (let start = 0; start < tower.length; start += 18) p.push(boxesMesh("跳塔连续承柱与实际连接各折返阶梯的平台护栏", dark, tower.slice(start, start + 18)));
  p.push(box("与池面保持独立净空的完整后部观摩桥", 0, 10.175, 40, 62, .25, 2, wood));
  for (const x of [-30, -10, 10, 30]) p.push(box("观摩桥下避开深池的实际支柱", x, 8.175, 40, .3, 3.75, .3, dark));
  for (const x of [-20, 0, 20]) p.push(box("观摩桥下接到各支柱的实际分跨承梁", x, 9.8, 40, 20, .5, .22, dark));
  for (let flight = 0; flight < 2; flight++) p.push(stairFlight("从池岸进入观摩桥前缘的实际侧阶梯", -30, 6.3 + flight * 2, 31.8 + flight * 3.6, 2, 12, 4 / 24, .3));
  p.push(rail([-29, 11.4, 39], [31, 11.4, 39], .06, dark), rail([-31, 11.4, 41], [31, 11.4, 41], .06, dark));
  const bridgePosts: SolidBox[] = [];
  for (const x of [-31, -29, 0, 31]) for (const z of [39, 41]) bridgePosts.push({ center: [x, 10.85, z], size: [.06, 1.1, .06] });
  p.push(boxesMesh("观摩桥栏杆在侧阶梯高端保留实际入口", dark, bridgePosts), paint("长道池底的独立米制泳道导向条", "#617f85", Array.from({ length: 8 }, (_, index) => ({ x: -22.5 + index * 3, z: -12, width: .12, depth: 45 })), 3.805));
  return p;
}

function bathingCenter(): ModelPart[] {
  const outer: [number, number][] = [[-19, -20], [19, -20], [19, 20], [-19, 20]], court: [number, number][] = [[-5, -6], [5, -6], [5, 6], [-5, 6]], large: [number, number][] = [[-14, 9], [3, 9], [3, 17], [-14, 17]], small: [number, number][] = [[8, 11], [15, 11], [15, 17], [8, 17]];
  const p: ModelPart[] = [box("两院洗浴楼与入场阶梯共同落地基础", 0, .15, -.75, 40, .3, 43.5, stone), polygon("大小泡池真实挖空的连续洗浴地台", stone, outer, 1, [0, .3, 0], [large, small]), polygon("露天干庭与后浴庭同时挖空的完整屋盖", dark, outer, .2, [0, 5.3, 0], [court, large]), doorway("公共前厅与两翼共用的实际主入口", [0, 1.3, -20], 38, 4, 3.2, 0, 2.8), box("洗浴楼完整后侧外墙", 0, 3.3, 20, 38, 4, .24, stone), stairFlight("地面升到连续洗浴地台的实际入场阶梯", 0, .3, -22, 3, 5, .2, .3), box("洗浴主门与阶梯高端实际接合的平台", 0, 1.175, -20.15, 3, .25, .7, stone)];
  const fittings: SolidBox[] = [], metal: SolidBox[] = [];
  for (const side of [-1, 1]) {
    p.push(doorway("前厅进入独立干更衣翼的真实门", [side * 12, 1.3, -10], 14, 4, 2), doorway("干更衣与湿淋浴之间的实际内门", [side * 12, 1.3, -2], 14, 4, 1.5), doorway("湿淋浴廊进入后浴庭的真实出口", [side * 12, 1.3, 6], 14, 4, 2), doorway("淋浴廊面向中央干庭的独立实际门洞", [side * 5, 1.3, 2], 8, 4, 1.4, 90), box("干更衣翼与中央走道之间的完整隔墙", side * 5, 3.3, -6, .24, 4, 8, stone), box("两院外侧高窗下实际实体墙", side * 19, 2.05, 0, .24, 1.5, 40, stone), box("两院外侧高窗上实际墙楣", side * 19, 4.95, 0, .24, .7, 40, stone), part("外侧真实高窗孔中的透明玻璃带", "box", colors.glass, [side * 19, 3.7, 0], [.05, 1.8, 40], [0, 0, 0], { opacity: .25 }));
    for (const z of [-2, .6, 3.2, 6]) fittings.push({ center: [side * 16, 2.8, z], size: [6, 3, .12] });
    for (const z of [-.6, 2, 4.6]) {
      p.push(cylinder("各独立湿隔间内朝下的实际淋浴喷头", side * 16, 3.8, z, .3, .08, dark));
      metal.push({ center: [side * 18.4, 2.55, z], size: [.05, 2.5, .05] }, { center: [side * 17.2, 3.8, z], size: [2.4, .05, .05] });
    }
    fittings.push({ center: [side * 12, 2.2, -8.9], size: [10, 1.8, .8] }, { center: [side * 12, 1.525, -5], size: [7, .45, .7] });
  }
  p.push(doorway("公共前厅通往中央露天干庭的实际门洞", [0, 1.3, -10], 10, 4, 4), doorway("干庭通向后部湿浴区的实际过渡门", [0, 1.3, 6], 10, 4, 3));
  for (const [x, z, w, d] of [[-5.5, 13, 17, 8], [11.5, 14, 7, 6]]) p.push(part("独立下沉泡池中低于岸边的真实水面", "box", colors.water, [x!, 1.085, z!], [w! - .16, .03, d! - .16], [0, 0, 0], { opacity: .65, roughness: .15 }));
  p.push(boxesMesh("淋浴隔间真实分隔墙和独立更衣长柜座台", stone, fittings), boxesMesh("各淋浴喷头背后实际相接的供水立管与横臂", dark, metal));
  return p;
}

function parkRestroom(): ModelPart[] {
  const left: ModelPart[] = [doorway("独立卫生翼从公共洗手区进入的实际入口", [-6.5, .2, -6], 11, 3.4, 2, 0, 2.4), box("四个厕格后方完整实体外墙", -6.5, 1.9, 8, 11, 3.4, .24, stone), box("独立卫生翼完整平屋盖", -6.5, 3.7, 1, 11.5, .2, 14.5, dark)];
  const partitions: SolidBox[] = [], taps: SolidBox[] = [];
  for (const x of [-12, -1]) left.push(box("卫生翼长边高窗下连续隐私墙", x, 1.6, 1, .24, 2.8, 14, stone), part("隐私墙上方连续通风采光高窗", "box", colors.glass, [x, 3.3, 1], [.05, .6, 14], [0, 0, 0], { opacity: .25 }));
  for (const x of [-9.25, -6.5, -3.75]) partitions.push({ center: [x, 1.3, 6], size: [.12, 2.2, 4] });
  for (let index = 0; index < 4; index++) {
    const x = -10.625 + index * 2.75;
    left.push(doorway(index ? "公共独立厕格的真实门洞" : "家庭厕格的加宽实际门口", [x, .2, 4], 2.75, 2.2, index ? .8 : 1.2, 0, 2.05), restroomBowl("每个厕格中具有真实敞口与内壁的坐便盆", x, .2, 6.5));
    partitions.push({ center: [x, .9, 7.7], size: [.55, 1.2, .5] });
  }
  const holes = [-3, -1, 1, 3].map(x => Array.from({ length: 8 }, (_, index): [number, number] => { const a = index * Math.PI / 4; return [x + Math.cos(a) * .22, Math.sin(a) * .22]; }));
  left.push(polygon("洗手台面上四个真正贯通的盆体安装孔", ceramic, [[-4, -.45], [4, -.45], [4, .45], [-4, .45]], .12, [-6.5, .95, -3.5], holes));
  for (const offset of [-3, -1, 1, 3]) {
    const x = -6.5 + offset;
    left.push(restroomBasin("贯通台孔下实际有内腔的独立洗手盆", x, 1.07, -3.5));
    taps.push({ center: [x, 1.18, -3.12], size: [.04, .22, .04] }, { center: [x, 1.29, -3.3], size: [.04, .04, .36] });
  }
  for (const x of [-10, -3]) partitions.push({ center: [x, .575, -3.5], size: [.12, .75, .7] });
  partitions.push({ center: [-10.625, .95, 4.8], size: [1.3, .12, .6] });
  for (const x of [-11.1, -10.15]) partitions.push({ center: [x, .545, 4.8], size: [.12, .69, .5] });
  left.push(boxesMesh("厕格真实隔墙背箱与洗手台实际落地支脚", stone, partitions), boxesMesh("各洗手盆后方相接的实际龙头立管与出水臂", dark, taps));
  const p: ModelPart[] = [box("两片错向卫生翼与公共洗手庭共同落地基础", 0, .1, 0, 25, .2, 19, stone), ...left, ...left.map(value => ({ ...value, position: { x: -value.position.x, y: value.position.y, z: -value.position.z }, rotation: { ...value.rotation, y: value.rotation.y + 180 } }))];
  for (const z of [-7.5, 7.5]) p.push(box("前后公共步行区域上方的独立洗手雨棚", 0, 3.2, z, 24, .2, 3, dark));
  return p;
}
