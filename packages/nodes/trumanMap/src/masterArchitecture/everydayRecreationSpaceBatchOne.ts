import { part, ring, type ModelPart } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { box, design, rail, colors, glow, type ArchitecturePrototype } from "./structures";
import { doorway } from "./publicSpaceBatchOne";
import { openingWall, holesAt } from "./periodPublicSpaceBatchOne";
import { stairFlight } from "./historicSpaceBatchSeven";
import { boxesMesh, type SolidBox } from "./publicSpaceBatchEight";

const wall = "#bbb8a9", floor = "#9c9889", wood = "#917255", iron = "#4b5b5e";

export const everydayRecreationSpaceBatchOneDesigns: ArchitecturePrototype[] = [
  design("下沉球厅高窗环廊台球俱乐部", "完整街区会馆的低位球厅由高出九十厘米的观球和服务环廊围绕，入口宽阶先上环廊，两侧短阶再下球厅；后门接独立外阶，偏脊高窗和跨厅桁梁由连续外围墙柱承托", billiardClub, "建筑", "现代"),
];

function billiardClub(): ModelPart[] {
  const p: ModelPart[] = [
    box("完整球厅、前廊与后门外阶共用的落地基础", 0, .1, .8, 16.6, .2, 23.6, floor),
    ...[-1, 1].map(side => box("真正承地而围住下沉球厅的抬高侧廊", side * 6.25, .65, 0, 3.5, .9, 14.4, wood)),
    ...[-1, 1].map(side => box("把左右高侧廊真正连成闭环的横向观球地坪", 0, .65, side * 6.5, 9, .9, 1.4, wood)),
    box("高环廊后方直接接到后门的服务横廊", 0, .65, 8.6, 16, .9, 2.8, wood),
    doorway("临街正门真正穿过前厅外墙的宽入口", [0, .2, -10], 16, 4.45, 2.4),
    doorway("高服务廊后方真正接到独立下行外阶的后门", [0, .2, 10], 16, 4.45, 1.6, 0, 3.3),
    ...[-1, 1].map(side => openingWall("两侧完整围护中实际透空的三段采光窗墙", 20, side < 0 ? 4.45 : 4.75, holesAt([-5.5, 0, 5.5], 3.7, 1.8, 1.4), [side * 8, .2, 0], 90, wall)),
    part("跨过低位球厅的偏脊高侧薄屋面", "extrude", iron, [0, 0, 0], [1, 1, 1], [0, 0, 0], { depth: 20.4, profile: [{ x: -8.2, y: 4.626 }, { x: .8, y: 5.7 }, { x: .8, y: 5.88 }, { x: -8.2, y: 4.806 }] }),
    part("沿服务侧下降并与高窗底框相接的低屋面", "extrude", iron, [0, 0, 0], [1, 1, 1], [0, 0, 0], { depth: 20.4, profile: [{ x: .8, y: 4.65 }, { x: 8.2, y: 4.958 }, { x: 8.2, y: 5.138 }, { x: .8, y: 4.83 }] }),
    part("偏脊两高低屋面之间真正透光的连续立窗", "box", colors.glass, [.8, 5.255, 0], [.035, .85, 19.6], [0, 0, 0], { opacity: .28, roughness: .12 }),
    stairFlight("前厅从正门低地坪连续升到高环廊的宽实阶", 5, 2.4, .9, .32, 0, [0, .2, -8.8], -90),
    stairFlight("后门从高服务横廊连续降到基础地坪的独立外阶", 5, 1.6, .9, .32, 0, [0, .2, 11.6], 90),
    ...[-1, 1].map(side => stairFlight("左右观球环廊真正下接低位球厅的独立短阶", 5, 1.4, .9, .32, 0, [side * 2.9, .2, 0], side < 0 ? 180 : 0)),
    box("服务环廊内留出后方工作人员通路的固定长吧台", 6.7, 1.58, 3.5, .8, .96, 4, wood),
    box("固定吧台实际承住的连续工作台面", 6.7, 2.09, 3.5, .94, .06, 4.15, iron),
  ];
  const posts: SolidBox[] = [], frames: SolidBox[] = [];
  for (const z of [-10, 10]) {
    p.push(part("正背立面实际封到偏脊高屋面下缘的三角墙", "extrude", wall, [0, 0, z], [1, 1, 1], [0, 0, 0], { depth: .24, profile: [{ x: -8, y: 4.65 }, { x: .8, y: 4.65 }, { x: .8, y: 5.7 }] }), part("正背立面实际封到低屋面下缘的三角墙", "extrude", wall, [0, 0, z], [1, 1, 1], [0, 0, 0], { depth: .24, profile: [{ x: .8, y: 4.65 }, { x: 8, y: 4.65 }, { x: 8, y: 4.95 }] }));
  }
  for (const side of [-1, 1]) {
    for (const z of [-5.5, 0, 5.5]) p.push(part("嵌在真实侧墙窗孔内的薄采光玻璃", "box", colors.glass, [side * 8, 2.5, z], [.035, 1.8, 3.7], [0, 0, 0], { opacity: .25, roughness: .14 }));
    for (const [a, b] of [[-5.8, -.85], [.85, 5.8]]) p.push(box("内缘护栏真正让开左右下球厅阶梯的连续扶手", side * 4.5, 2.15, (a! + b!) / 2, .07, .07, b! - a!, iron));
    p.push(box("前后观球横廊临空边缘的完整扶手", 0, 2.15, side * 5.8, 9.07, .07, .07, iron));
    for (const z of [-5.8, -3, -.85, .85, 3, 5.8]) posts.push({ center: [side * 4.5, 1.625, z], size: [.06, 1.05, .06] });
    for (const x of [-2.5, 0, 2.5]) posts.push({ center: [x, 1.625, side * 5.8], size: [.06, 1.05, .06] });
  }
  for (const z of [-6, 0, 6]) {
    p.push(...[-1, 1].map(side => box("从高低地坪边缘真正接到桁梁的外围承重柱", side * 7.82, 2.25, z, .2, 4.1, .2, iron)), box("不在球台中央落柱的完整跨厅下弦梁", 0, 4.3, z, 15.84, .24, .18, iron), rail([-7.82, 4.67, z], [.8, 5.7, z], .17, iron), rail([.8, 4.65, z], [7.82, 4.95, z], .17, iron), rail([.8, 4.3, z], [.8, 5.7, z], .11, iron), rail([-7.82, 4.3, z], [.8, 5.7, z], .1, iron));
  }
  for (const y of [4.82, 5.7]) frames.push({ center: [.8, y, 0], size: [.08, .08, 20] });
  for (const z of [-9.85, -5, 0, 5, 9.85]) frames.push({ center: [.8, 5.26, z], size: [.08, .96, .08] });
  p.push(boxesMesh("让高窗玻璃真正落在两条屋面之间的连续窗框", iron, frames));
  const stairRails = [
    ...[-1, 1].map(side => ({ start: [side * 1.2, .2, -8.8], end: [side * 1.2, 1.1, -7.2] })),
    ...[-1, 1].map(side => ({ start: [side * .8, .2, 11.6], end: [side * .8, 1.1, 10] })),
    ...[-1, 1].flatMap(side => [-1, 1].map(edge => ({ start: [side * 2.9, .2, edge * .7], end: [side * 4.5, 1.1, edge * .7] }))),
  ];
  for (const { start, end } of stairRails) {
    p.push(rail([start[0]!, start[1]! + 1.05, start[2]!], [end[0]!, end[1]! + 1.05, end[2]!], .055, iron));
    for (const at of [start, end]) posts.push({ center: [at[0]!, at[1]! + .525, at[2]!], size: [.055, 1.05, .055] });
  }
  for (let start = 0; start < posts.length; start += 20) p.push(boxesMesh("真正接住各段扶手并落在相应地坪上的独立栏杆", iron, posts.slice(start, start + 20)));
  for (const z of [-2.8, 2.8]) {
    const holes = [-1, 1].flatMap(side => [-1.35, 0, 1.35].map(end => Array.from({ length: 8 }, (_, index): [number, number] => { const a = index * Math.PI / 4; return [side * .73 + Math.cos(a) * .055, end + Math.sin(a) * .055]; })));
    p.push(polygon("有六个真正贯穿落球孔而非黑面片的完整球台呢面", "#668f79", [[-.8, -1.45], [.8, -1.45], [.8, 1.45], [-.8, 1.45]], .03, [0, .96, z], holes));
    const table: SolidBox[] = [...[-1, 1].flatMap(x => [-1, 1].map(end => ({ center: [x * .58, .58, z + end * 1.05] as [number, number, number], size: [.18, .76, .18] as [number, number, number] }))), ...[-1, 1].flatMap(side => [{ center: [side * .87, .91, z] as [number, number, number], size: [.14, .2, 3.04] as [number, number, number] }, { center: [0, .91, z + side * 1.52] as [number, number, number], size: [1.88, .2, .14] as [number, number, number] }])];
    p.push(boxesMesh("完整球台的四根承脚与真正接住呢面的周边木梁", wood, table));
    for (const side of [-1, 1]) for (const end of [-1.35, 0, 1.35]) p.push(ring("与真实呢面孔相接并向下敞开的独立落球袋口", iron, .06, .008, .89, .2, { position: { x: side * .73, y: .89, z: z + end } }));
    p.push(rail([0, 5.62, z], [0, 2.95, z], .025, iron), box("实际悬在球台中轴上方的长条遮光灯罩", 0, 2.88, z, 1.3, .14, .38, iron), glow("灯罩下缘真正接合的暖白照明条", 0, 2.8025, z, 1.2, .015, .28, "#d2c9ab"));
  }
  return p;
}
