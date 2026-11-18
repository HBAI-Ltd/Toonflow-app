import { part, type ModelPart } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { box, design, colors } from "./structures";
import { standingPanel } from "./publicSpaceBatchOne";
import { boxesMesh, type SolidBox } from "./publicSpaceBatchEight";
import { waistStair } from "./publicSpaceBatchFourteen";

const stone = "#b9b9ad", dark = "#546c70", wood = "#aa946f";
type SlopedRail = { x: number; startY: number; startZ: number; endY: number; endZ: number };

export const publicSpaceBatchTwentyTwoDesigns = [
  design("穿院门诊裙厅病房楼", "两层门诊裙厅围出带十字步道的露天采光院，后部两层病房楼沿独立护理走廊逐间进入病房，两座真实折返梯井贯穿门诊和病房各层；门诊有独立诊室与穿行前厅，病房楼侧门接入裙厅屋顶公共露台", courtyardHospital, "建筑", "现代"),
];

function doorRow(name: string, width: number, floor: number, z: number, height: number, doors: [number, number][]): ModelPart {
  const profile = [{ x: -width / 2, y: 0 }];
  for (const [x, opening] of doors) profile.push({ x: x - opening / 2, y: 0 }, { x: x - opening / 2, y: 2.6 }, { x: x + opening / 2, y: 2.6 }, { x: x + opening / 2, y: 0 });
  profile.push({ x: width / 2, y: 0 }, { x: width / 2, y: height }, { x: -width / 2, y: height });
  return part(name, "extrude", stone, [0, floor, z], [1, 1, 1], [0, 0, 0], { depth: .2, profile });
}

function slopedRailMesh(values: SlopedRail[]): ModelPart {
  const vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
  for (const value of values) {
    const bar = boxesMesh("随阶梯倾斜的扶手实体", dark, [{ center: [value.x, 0, (value.startZ + value.endZ) / 2], size: [.06, .06, Math.abs(value.endZ - value.startZ)] }]), offset = vertices.length;
    for (const point of bar.vertices!) vertices.push({ ...point, y: point.y + value.startY + (point.z - value.startZ) / (value.endZ - value.startZ) * (value.endY - value.startY) });
    indices.push(...bar.indices!.map(index => index + offset));
  }
  return part("双梯井各跑实际随坡升高的连续实体扶手", "mesh", dark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

function courtyardHospital(): ModelPart[] {
  const outside: [number, number][] = [[-28, -24], [28, -24], [28, 24], [-28, 24]], court: [number, number][] = [[-12, -8], [12, -8], [12, 8], [-12, 8]], tower: [number, number][] = [[-24, 8], [24, 8], [24, 24], [-24, 24]], shafts: [number, number][][] = [-20, 20].map(x => [[x - 2.5, 11], [x + 2.5, 11], [x + 2.5, 15.76], [x - 2.5, 15.76]]);
  const p: ModelPart[] = [box("医院门诊病房和露天公共院共同落地的完整场坪", 0, .15, 0, 64, .3, 58, stone), polygon("围住露天采光院的完整门诊地面饰层", wood, outside, .005, [0, .3, 0], [court]), polygon("门诊上层完整楼板为采光院和双梯井真实开孔", wood, outside, .25, [0, 4.05, 0], [court, ...shafts]), polygon("门诊屋顶露台与病房首层共用而不叠板的完整楼面", wood, outside, .25, [0, 8.05, 0], [court, ...shafts]), polygon("病房上层楼板真正开出两座连续贯层的梯井", wood, tower, .25, [0, 11.85, 0], shafts), polygon("完整病房楼连续封闭屋盖", dark, tower, .25, [0, 15.9, 0]), part("室外地面实际接入医院前场的宽缓坡", "extrude", stone, [0, 0, -31], [1, 1, 1], [0, -90, 0], { depth: 5, profile: [{ x: -2, y: 0 }, { x: 2, y: 0 }, { x: 2, y: .3 }, { x: -2, y: .02 }] })];
  const walls: SolidBox[] = [], panes: SolidBox[] = [], examination: SolidBox[] = [], mattresses: SolidBox[] = [], bedBases: SolidBox[] = [], bedHeads: SolidBox[] = [], guards: SolidBox[] = [], posts: SolidBox[] = [], landings: SolidBox[] = [], counters: SolidBox[] = [], greens: SolidBox[] = [], slopes: SlopedRail[] = [];
  const postKeys = new Set<string>();
  const addPost = (x: number, floor: number, z: number) => {
    const key = `${x.toFixed(5)},${floor.toFixed(5)},${z.toFixed(5)}`;
    if (postKeys.has(key)) return;
    postKeys.add(key); posts.push({ center: [x, floor + .55, z], size: [.06, 1.1, .06] });
  };
  const addGuard = (x0: number, z0: number, x1: number, z1: number, floor: number) => {
    const count = Math.ceil(Math.hypot(x1 - x0, z1 - z0) / 3);
    guards.push({ center: [(x0 + x1) / 2, floor + 1.1, (z0 + z1) / 2], size: [Math.abs(x1 - x0) || .06, .06, Math.abs(z1 - z0) || .06] });
    for (let i = 0; i <= count; i++) addPost(x0 + (x1 - x0) * i / count, floor, z0 + (z1 - z0) * i / count);
  };
  for (const floor of [.3, 4.3]) {
    const height = 3.75;
    p.push(doorRow("四间前诊室和贯通接待前厅分别进入院边公共廊的真实门墙", 56, floor, -11, height, [[-23, 1.3], [-13, 1.3], [0, 8], [13, 1.3], [23, 1.3]]));
    for (const side of [-1, 1]) {
      const door = doorRow("侧翼两间诊室分别接到三米净宽院边公共廊的门墙", 16, floor, 0, height, [[-4, 1.3], [4, 1.3]]); door.position.x = side * 15; door.rotation.y = 90; p.push(door);
      for (const z of [-8, 0, 8]) walls.push({ center: [side * 21.5, floor + height / 2, z], size: [13, height, .2] });
      for (const z of [-4, 4]) { examination.push({ center: [side * 21.5, floor + .225, z], size: [1, .45, 2.1] }); mattresses.push({ center: [side * 21.5, floor + .53, z], size: [1, .16, 2.1] }); }
    }
    for (const x of [-28, -18, -8, 8, 18, 28]) walls.push({ center: [x, floor + height / 2, -17.5], size: [.2, height, 13] });
    for (const x of [-23, -13, 13, 23]) { examination.push({ center: [x, floor + .225, -18], size: [1, .45, 2.1] }); mattresses.push({ center: [x, floor + .53, -18], size: [1, .16, 2.1] }); }
    for (const z of [-24, 24]) {
      const door = floor < 1 ? (z < 0 ? 4 : 2.4) : 0, doorX = z < 0 ? 0 : 25, face: [number, number][] = door ? [[-28, floor], [doorX - door / 2, floor], [doorX - door / 2, floor + 2.8], [doorX + door / 2, floor + 2.8], [doorX + door / 2, floor], [28, floor], [28, floor + height], [-28, floor + height]] : [[-28, floor], [28, floor], [28, floor + height], [-28, floor + height]], holes: [number, number][][] = [];
      const windows = z < 0 ? [[-23, 6], [-13, 6], [13, 6], [23, 6], ...(floor > 1 ? [[0, 8]] : [])] : [-20, -12, -4, 4, 12, 20].map(x => [x, 5]);
      for (const [x, width] of windows) { holes.push([[x! - width! / 2, floor + 1.05], [x! + width! / 2, floor + 1.05], [x! + width! / 2, floor + 3.05], [x! - width! / 2, floor + 3.05]]); panes.push({ center: [x!, floor + 2.05, z], size: [width!, 2, .05] }); }
      p.push(standingPanel("门诊前后完整开窗并保留地层公共通门的真实外墙", stone, face, holes, z, .24));
    }
    for (const side of [-1, 1]) {
      const holes: [number, number][][] = [];
      for (const [z, width] of [[-18, 8], [-4, 4], [4, 4], [18, 8]]) { holes.push([[z! - width! / 2, floor + 1.05], [z! + width! / 2, floor + 1.05], [z! + width! / 2, floor + 3.05], [z! - width! / 2, floor + 3.05]]); panes.push({ center: [side * 28, floor + 2.05, -z!], size: [.05, 2, width!] }); }
      const face = standingPanel("门诊裙厅两端完整窗洞与诊室实际外墙", stone, [[-24, floor], [24, floor], [24, floor + height], [-24, floor + height]], holes, 0, .24); face.position.x = side * 28; face.rotation.y = 90; p.push(face);
    }
    for (const [width, plane, yaw] of [[24, -8, 0], [24, 8, 0], [16, -12, 90], [16, 12, 90]]) {
      const door = floor < 1 ? 3 : 0, half = width! / 2, face: [number, number][] = door ? [[-half, floor], [-1.5, floor], [-1.5, floor + 2.8], [1.5, floor + 2.8], [1.5, floor], [half, floor], [half, floor + height], [-half, floor + height]] : [[-half, floor], [half, floor], [half, floor + height], [-half, floor + height]], windows = width === 24 ? [[-7.5, 5], [7.5, 5]] : [[-5.5, 3], [5.5, 3]], holes: [number, number][][] = [];
      for (const [x, length] of windows) { holes.push([[x! - length! / 2, floor + 1.05], [x! + length! / 2, floor + 1.05], [x! + length! / 2, floor + 3.05], [x! - length! / 2, floor + 3.05]]); panes.push({ center: yaw ? [plane!, floor + 2.05, -x!] : [x!, floor + 2.05, plane!], size: yaw ? [.05, 2, length!] : [length!, 2, .05] }); }
      const panel = standingPanel("院边公共回廊面向真实采光院的窗洞与地层出院门", stone, face, holes, yaw ? 0 : plane!, .2); if (yaw) { panel.position.x = plane!; panel.rotation.y = yaw; } p.push(panel);
    }
  }
  for (const floor of [.3, 4.3, 8.3, 12.1]) {
    const height = floor < 8 ? 3.75 : floor < 12 ? 3.55 : 3.8;
    p.push(doorRow(floor < 8 ? "后部四间治疗房各自真实进入公共后廊的门墙" : "四间住院病房各自独立接到护理走廊的门墙", 32, floor, 11, height, [-12, -4, 4, 12].map(x => [x, floor < 8 ? 1.5 : 1.3])));
    for (const x of [-16, -8, 0, 8, 16]) walls.push({ center: [x, floor + height / 2, 17.5], size: [.2, height, 13] });
    for (const x of [-12, -4, 4, 12]) {
      if (floor < 8) { examination.push({ center: [x, floor + .225, 18.5], size: [1, .45, 2.1] }); mattresses.push({ center: [x, floor + .53, 18.5], size: [1, .16, 2.1] }); }
      else for (const offset of [-2, 2]) for (const z of [14, 18, 22]) {
        bedBases.push({ center: [x + offset, floor + .19, z], size: [1.1, .38, 2.1] }); mattresses.push({ center: [x + offset, floor + .46, z], size: [1.1, .16, 2.1] }); bedHeads.push({ center: [x + offset, floor + .475, z + 1.05], size: [1.1, .95, .08] });
      }
    }
    if (floor < 8) continue;
    for (const z of [8, 24]) {
      const hasTerraceDoor = floor < 12 && z === 8, face: [number, number][] = hasTerraceDoor ? [[-24, floor], [19, floor], [19, floor + 2.6], [21, floor + 2.6], [21, floor], [24, floor], [24, floor + height], [-24, floor + height]] : [[-24, floor], [24, floor], [24, floor + height], [-24, floor + height]], holes: [number, number][][] = [];
      for (const x of [-20, -12, -4, 4, 12, 20]) { if (hasTerraceDoor && x === 20) continue; holes.push([[x - 2.5, floor + .9], [x + 2.5, floor + .9], [x + 2.5, floor + 2.9], [x - 2.5, floor + 2.9]]); panes.push({ center: [x, floor + 1.9, z], size: [5, 2, .05] }); }
      p.push(standingPanel("病房塔真实开窗并在首层侧廊开通露台门的完整长立面", stone, face, holes, z, .24));
    }
    for (const side of [-1, 1]) {
      const holes: [number, number][][] = [];
      for (const z of [-5.5, 5.5]) { holes.push([[z - 1.5, floor + .9], [z + 1.5, floor + .9], [z + 1.5, floor + 2.9], [z - 1.5, floor + 2.9]]); panes.push({ center: [side * 24, floor + 1.9, 16 - z], size: [.05, 2, 3] }); }
      const face = standingPanel("病房塔两端包住贯层交通核的真实侧窗外墙", stone, [[-8, floor], [8, floor], [8, floor + height], [-8, floor + height]], holes, 0, .24); face.position.x = side * 24; face.position.z = 16; face.rotation.y = 90; p.push(face);
    }
    counters.push({ center: [0, floor + .5, 10.65], size: [4, 1, .5] });
  }
  for (const [bottom, top] of [[.3, 4.3], [4.3, 8.3], [8.3, 12.1]]) for (const core of [-20, 20]) {
    const rise = top! - bottom!;
    p.push(waistStair("双交通核内从本层真正升到中间转台的薄底第一跑阶梯", core - 1.2, bottom!, 11, 2.2, 12, rise / 24, .28), waistStair("双交通核内从中间转台折返到上一层楼板边的薄底第二跑阶梯", core + 1.2, bottom! + rise / 2, 14.36, 2.2, 12, rise / 24, .28, true));
    landings.push({ center: [core, bottom! + rise / 2 - .1, 15.06], size: [4.8, .2, 1.4] });
    for (const [x, y, z0, z1] of [[core - 1.2, bottom!, 11, 14.36], [core + 1.2, bottom! + rise / 2, 14.36, 11]]) for (const offset of [-1.05, 1.05]) {
      slopes.push({ x: x! + offset, startY: y! + 1.1, startZ: z0!, endY: y! + rise / 2 + 1.1, endZ: z1! });
      for (let i = 0; i <= 3; i++) addPost(x! + offset, y! + rise / 2 * i / 3, z0! + (z1! - z0!) * i / 3);
    }
    addGuard(core - 2.4, 15.76, core + 2.4, 15.76, bottom! + rise / 2); addGuard(core - 2.4, 14.36, core - 2.4, 15.76, bottom! + rise / 2); addGuard(core + 2.4, 14.36, core + 2.4, 15.76, bottom! + rise / 2);
  }
  for (const floor of [4.3, 8.3, 12.1]) for (const core of [-20, 20]) {
    addGuard(core - 2.5, 11, core - 2.5, 15.76, floor); addGuard(core + 2.5, 11, core + 2.5, 15.76, floor); addGuard(core - 2.5, 15.76, core + 2.5, 15.76, floor);
    if (floor > 12) addGuard(core - 2.5, 11, core + .05, 11, floor);
  }
  for (const [x0, z0, x1, z1] of [[-28, -24, 28, -24], [-28, -24, -28, 24], [28, -24, 28, 24], [-28, 24, -24, 24], [24, 24, 28, 24], [-12, -8, 12, -8], [-12, -8, -12, 8], [12, -8, 12, 8]]) addGuard(x0!, z0!, x1!, z1!, 8.3);
  for (const x of [-6, 6]) for (const z of [-3, 3]) greens.push({ center: [x, .34, z], size: [8, .08, 3] });
  for (const [name, color, values] of [["门诊与病房真正分室并接到外墙的完整隔墙", stone, walls], ["门诊各独立诊室内实际落地的检查台座", dark, examination], ["各病房内实际落地的独立病床底座", dark, bedBases], ["各检查台与病床由底座实际承托的连续软垫", "#b7c4b6", mattresses], ["病床头部与床座实际接合的独立端板", wood, bedHeads], ["梯井和屋顶公共露台的连续实体扶手", dark, guards], ["实际连接各跑阶梯与平台的扶栏立柱", dark, posts], ["梯井内两跑准确齐平接合的实际中间平台", wood, landings], ["不堵病房门并实际靠接中间门墙的护理值班台", wood, counters], ["中央采光院让出十字公共步道的独立绿坪", "#8f9f7c", greens]] as [string, string, SolidBox[]][]) for (let start = 0; start < values.length; start += 18) p.push(boxesMesh(name, color, values.slice(start, start + 18)));
  for (let start = 0; start < slopes.length; start += 18) p.push(slopedRailMesh(slopes.slice(start, start + 18)));
  for (let start = 0; start < panes.length; start += 18) { const glass = boxesMesh("门诊裙厅与病房楼真实窗洞内的独立透明窗板", colors.glass, panes.slice(start, start + 18)); glass.opacity = .24; p.push(glass); }
  return p;
}
