import { part, type ModelPart } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { box, design, rail, colors } from "./structures";
import { doorway } from "./publicSpaceBatchOne";
import { stairFlight } from "./publicSpaceBatchTwo";
import { paint } from "./publicSpaceBatchFive";
import { boxesMesh, type SolidBox } from "./publicSpaceBatchEight";

const stone = "#b5b6a8", dark = "#51676a", wood = "#ac946c";

export const publicSpaceBatchFourteenDesigns = [
  design("错层半台停车楼", "左右停车盘相差半层，两端真正交替的坡道连接所有六个层面，中央独立薄底折返梯逐层接入相应停车盘，车位区与对外平层入口各自留空", splitLevelGarage, "建筑", "现代"),
  design("折脊双臂图书馆", "两条斜向长翼从独立前厅展开，翼内侧通高书区与外侧阅读夹廊分开，实际楼梯井连接上层阅读面，折脊屋盖和高窗围住完整双臂阅读空间", branchingLibrary, "建筑", "现代"),
];

// 折返梯使用随坡上升的薄底板，保持上下叠放梯段的真实头部净空。
export function waistStair(name: string, x: number, y: number, z: number, width: number, count: number, rise: number, run: number, reverse = false): ModelPart {
  const outline: [number, number][] = [[0, -.22], [count * run, count * rise - .22], [count * run, count * rise]];
  for (let step = count; step >= 1; step--) { outline.push([(step - 1) * run, step * rise]); if (step > 1) outline.push([(step - 1) * run, (step - 1) * rise]); }
  const solid = polygon(name, stone, outline, width), vertices = solid.vertices!, direction = reverse ? -1 : 1;
  solid.vertices = solid.indices!.map(index => { const v = vertices[index]!; return { x: x + direction * (v.y - width / 2), y: y + v.z, z: z + direction * v.x }; });
  delete solid.indices;
  return solid;
}

function splitLevelGarage(): ModelPart[] {
  const p: ModelPart[] = [box("错层停车盘与外部平层入口共同落地场坪", 0, .15, 0, 58, .3, 58, stone)];
  const left: [number, number][] = [[-23, -27.5], [-9, -27.5], [-9, -20], [-1, -20], [-1, 20], [-9, 20], [-9, 27.5], [-23, 27.5]];
  for (const side of [-1, 1]) for (let level = 0; level < 3; level++) {
    const y = .3 + level * 3.2 + (side > 0 ? 1.6 : 0), outline = side < 0 ? left : left.map(([x, z]): [number, number] => [-x, z]);
    p.push(polygon("前后转弯台与中央停车盘组成完整错层C形楼面", stone, outline, side < 0 && !level ? .305 : .3, [0, y - .3, 0]));
    const gap = side > 0 ? [1.8, 2.4] : [-2.4, -1.8];
    for (const [a, b] of [[-20, gap[0]!], [gap[1]!, 20]]) p.push(box("中央独立梯井边缘为对应层位入口留空的护墙", side, y + .5, (a! + b!) / 2, .1, 1, b! - a!, dark));
    if (side < 0 && !level) {
      for (const [a, b] of [[-27.5, -2], [2, 27.5]]) p.push(box("首层外沿护墙为真实车行入口留出缺口", -23, y + .5, (a! + b!) / 2, .1, 1, b! - a!, dark));
    } else p.push(box("各停车盘外缘连续实体防护矮墙", side * 23, y + .5, 0, .1, 1, 55, dark));
    for (const z of [-27.5, 27.5]) p.push(box("前后转弯平台外侧齐平防护矮墙", side * 16, y + .5, z, 14, 1, .1, dark));
    const lines: { x: number; z: number; width: number; depth: number }[] = [];
    for (const x of [side * 20, side * 6]) for (let row = 0; row < 15; row++) {
      const z = -17.5 + row * 2.5;
      if (side < 0 && !level && x === -20 && Math.abs(z) < 3.8) continue;
      lines.push({ x, z, width: 5, depth: .045 });
    }
    p.push(paint("错层停车盘上留出主车道的实际车位界线", "#d9dccf", lines, y + .012));
  }
  for (let link = 0; link < 5; link++) {
    const north = link % 2 === 0, y = .3 + link * 1.6, z = north ? 24 : -24;
    const profile = north ? [{ x: -9, y: 0 }, { x: 9, y: 1.6 }, { x: 9, y: 1.9 }, { x: -9, y: .3 }] : [{ x: -9, y: 1.6 }, { x: 9, y: 0 }, { x: 9, y: .3 }, { x: -9, y: 1.9 }];
    const guard = north ? [{ x: -9, y: 0 }, { x: 9, y: 1.6 }, { x: 9, y: 2.6 }, { x: -9, y: 1 }] : [{ x: -9, y: 1.6 }, { x: 9, y: 0 }, { x: 9, y: 1 }, { x: -9, y: 2.6 }];
    p.push(part("在两端交替接合相差半层停车盘的真实斜车道", "extrude", stone, [0, y - .3, z], [1, 1, 1], [0, 0, 0], { depth: 7, profile }), part("随半层车道斜面连续升起的外侧实体防护墙", "extrude", dark, [0, y, north ? 27.5 : -27.5], [1, 1, 1], [0, 0, 0], { depth: .1, profile: guard }));
    const top = y + 1.6, end = north ? 1.8 : -1.8;
    p.push(waistStair("贯通六层位且薄底不挤占下层头部净空的折返步梯", north ? -.55 : .55, y, north ? -1.8 : 1.8, .9, 12, 1.6 / 12, .3, !north), box("折返步梯高端实际接入对应半层停车盘的平台", 0, top - .1, end + (north ? .3 : -.3), 2.4, .2, .6, stone), box("折返梯平台朝向相邻低层一侧的实际防坠护栏", north ? -1.2 : 1.2, top + .55, end + (north ? .3 : -.3), .06, 1.1, .6, dark));
  }
  for (const side of [-1, 1]) for (const x of [side * 2, side * 22]) for (const z of [-18, 18]) {
    const top = side < 0 ? 6.7 : 8.3; p.push(box("避开行车与中央楼梯的实际全高承重柱", x, top / 2, z, .35, top - .6, .35, dark));
  }
  return p;
}

export function placeWing(parts: ModelPart[], x: number, z: number, yaw: number): ModelPart[] {
  const a = yaw * Math.PI / 180;
  return parts.map(value => ({ ...value, position: { x: x + value.position.x * Math.cos(a) + value.position.z * Math.sin(a), y: value.position.y, z: z - value.position.x * Math.sin(a) + value.position.z * Math.cos(a) }, rotation: { ...value.rotation, y: value.rotation.y + yaw } }));
}

function branchingLibrary(): ModelPart[] {
  const a = 25 * Math.PI / 180, outerX = 7 + 7 * Math.cos(a), outerZ = -3 - 7 * Math.sin(a), innerX = 7 - 7 * Math.cos(a), innerZ = -3 + 7 * Math.sin(a);
  const foyer: [number, number][] = [[-14, -12], [14, -12], [outerX, outerZ], [innerX, innerZ], [-innerX, innerZ], [-outerX, outerZ]];
  const p: ModelPart[] = [box("双臂长翼与前厅共同落地阅览馆场坪", 0, .15, 10, 58, .3, 48, stone), polygon("严格接到两条斜向阅读翼入口线的独立前厅", wood, foyer, .205, [0, .1, 0]), polygon("前厅上方不跨入斜向翼内的完整屋盖", dark, foyer, .2, [0, 4.3, 0]), doorway("双臂图书馆公共前厅实际主入口", [0, .3, -12], 28, 4, 4, 0, 2.8), doorway("前厅中央实际通向两翼之间外庭的小门", [0, .3, innerZ], innerX * 2, 4, 1.1, 0, 2.6)];
  for (const side of [-1, 1]) {
    const dx = side * outerX - side * 14, dz = outerZ + 12;
    p.push(part("独立前厅两侧真正封合的斜向玻璃侧墙", "box", colors.glass, [side * (outerX + 14) / 2, 2.3, (outerZ - 12) / 2], [Math.hypot(dx, dz), 4, .06], [0, -Math.atan2(dz, dx) * 180 / Math.PI, 0], { opacity: .24 }));
    const gallery: [number, number][] = side < 0 ? [[-7, 3], [-2, 3], [-2, 31], [-7, 31]] : [[2, 3], [7, 3], [7, 31], [2, 31]], hole: [number, number][] = [[side * 4.5 - 1, 3.2], [side * 4.5 + 1, 3.2], [side * 4.5 + 1, 10.8], [side * 4.5 - 1, 10.8]];
    const wing: ModelPart[] = [box("各阅读长翼完整底层楼面", 0, .2025, 17, 14, .205, 34, wood), polygon("外侧阅读夹廊真正保留独立楼梯洞", wood, gallery, .25, [0, 3.7, 0], [hole]), part("斜向长翼从两檐折到中央高脊的完整屋壳", "extrude", dark, [0, 0, 17], [1, 1, 1], [0, 0, 0], { depth: 34.4, profile: [{ x: -7.2, y: 7.8 }, { x: 0, y: 9 }, { x: 7.2, y: 7.8 }, { x: 7.2, y: 7.6 }, { x: 0, y: 8.8 }, { x: -7.2, y: 7.6 }] }), doorway("独立公共前厅进入每条阅读长翼的实际门洞", [0, .3, 0], 14, 7.5, 3, 0, 3), part("阅读长翼后端真正封合的透明端窗", "box", colors.glass, [0, 4.05, 34], [14, 7.5, .05], [0, 0, 0], { opacity: .24 })];
    for (const x of [-7, 7]) wing.push(box("长翼两侧连续高窗下实际墙带", x, .8, 17, .24, 1, 34, stone), box("长翼两侧连续高窗上实际承檐梁", x, 7.45, 17, .24, .7, 34, stone), part("上下实体墙带之间的实际透明高窗", "box", colors.glass, [x, 4.2, 17], [.05, 5.8, 34], [0, 0, 0], { opacity: .24 }));
    for (const z of [0, 34]) wing.push(part("折脊屋盖前后端真实三角收头墙", "extrude", stone, [0, 7.8, z], [1, 1, 1], [0, 0, 0], { depth: .24, profile: [{ x: -7, y: 0 }, { x: 0, y: 1.17 }, { x: 7, y: 0 }] }));
    for (const z of [6, 17, 28]) wing.push(box("避开夹廊楼梯洞的实际承重柱", side * 6.3, 2, z, .24, 3.4, .24, dark));
    for (let flight = 0; flight < 3; flight++) wing.push(stairFlight("长翼底层实际穿过夹廊洞口的连续阅读阶梯", side * 4.5, .3 + flight * 3.65 / 3, 3.4 + flight * 2.4, 1.8, 8, 3.65 / 24, .3));
    wing.push(box("阅读阶梯高端真正跨出楼板洞口的平台", side * 4.5, 3.825, 10.85, 2, .25, .5, wood), rail([side * 2, 5.05, 3], [side * 2, 5.05, 31], .06, dark));
    for (const z of [3, 12, 22, 31]) wing.push(rail([side * 2, 3.95, z], [side * 2, 5.05, z], .06, dark));
    const frames: SolidBox[] = [], books: SolidBox[] = [], desks: SolidBox[] = [];
    for (const x of [-3, 1.5]) for (const z of [14, 22, 30]) {
      for (const side of [-1, 1]) frames.push({ center: [x + side * 1.075, 1.4, z], size: [.05, 2.2, .45] });
      for (const y of [.34, .79, 1.24, 1.69, 2.46]) frames.push({ center: [x, y, z], size: [2.15, .08, .45] });
      for (let row = 0; row < 4; row++) for (let book = 0; book < 5; book++) books.push({ center: [x - .85 + book * .42, .565 + row * .45, z - .035], size: [.28, .35, .32] });
    }
    for (const z of [16, 22, 28]) {
      desks.push({ center: [side * 4.5, 4.75, z], size: [3, .12, 1] });
      for (const foot of [-1, 1]) desks.push({ center: [side * 4.5 + foot * 1.1, 4.32, z], size: [.12, .74, .8] });
    }
    for (let start = 0; start < frames.length; start += 18) wing.push(boxesMesh("各长翼底层真实开格书架的分层木板", wood, frames.slice(start, start + 18)));
    for (let start = 0; start < books.length; start += 18) wing.push(boxesMesh("真实书架开格中各自留缝的实体书脊", "#8c9e8e", books.slice(start, start + 18)));
    wing.push(boxesMesh("上层夹廊中实际落地的独立阅读长桌", wood, desks));
    p.push(...placeWing(wing, side * 7, -3, side * 25));
  }
  return p;
}
