import { part, type ModelPart } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { box, design, colors } from "./structures";
import { doorway } from "./publicSpaceBatchOne";
import { stairFlight } from "./publicSpaceBatchTwo";
import { boxesMesh, standingPanel, type SolidBox } from "./publicSpaceBatchEight";
import { placeWing } from "./publicSpaceBatchFourteen";

const stone = "#b8b7a9", dark = "#52686d", wood = "#ab936d";

export const publicSpaceBatchEighteenDesigns = [
  design("街角穿廊社区服务中心", "地面公共办事厅与侧等候廊共同围出通高采光中庭，上层工作房和独立洽谈房由回廊连接，长梯井与中庭合成连续开口，楼板本体伸出的侧接平台真正接住阶梯高端，主街门与内院侧门分别通行", communityServiceCenter, "建筑", "现代"),
];

function serviceFacade(width: number, opening: number): ModelPart[] {
  const edge = width / 2 - 1, jamb = opening / 2 + .8;
  const outline: [number, number][] = [[-width / 2, .3], [-opening / 2, .3], [-opening / 2, 3.1], [opening / 2, 3.1], [opening / 2, .3], [width / 2, .3], [width / 2, 8.1], [-width / 2, 8.1]], holes: [number, number][][] = [[[-edge, 1.4], [-jamb, 1.4], [-jamb, 7.4], [-edge, 7.4]], [[jamb, 1.4], [edge, 1.4], [edge, 7.4], [jamb, 7.4]]];
  const wall = standingPanel("公共主门与上下层真实采光窗共同开孔的完整立面", stone, outline, holes, 0, .24), glass = boxesMesh("主门两侧实际完整窗孔中的透明玻璃面", colors.glass, [-1, 1].map(side => ({ center: [side * (edge + jamb) / 2, 4.4, 0], size: [edge - jamb, 6, .05] })));
  glass.opacity = .24;
  return [wall, glass];
}

function communityServiceCenter(): ModelPart[] {
  const outside: [number, number][] = [[-24, -20], [24, -20], [24, 0], [0, 0], [0, 20], [-24, 20]];
  const shaft: [number, number][] = [[-17, -10], [-7, -10], [-7, -16.2], [-5, -16.2], [-5, -10], [-4, -10], [-4, -8.8], [-7, -8.8], [-7, -8], [-4, -8], [-4, 10], [-17, 10]], light: [number, number][] = [[-17, -10], [-4, -10], [-4, 10], [-17, 10]];
  const p: ModelPart[] = [box("街角服务厅与外部公共角庭共同落地场坪", 0, .15, 0, 52, .3, 44, stone), polygon("公共办事厅真实L形实体地面饰层", wood, outside, .005, [0, .3, 0]), polygon("工作回廊楼板将长梯井与通高中庭合成连续开口", wood, outside, .2, [0, 4.3, 0], [shaft]), polygon("完整服务楼屋盖保留独立中庭采光孔", dark, outside, .2, [0, 8.1, 0], [light]), part("通高中庭上方完整透明采光顶", "box", colors.glass, [-10.5, 8.325, 0], [13.2, .05, 20.2], [0, 0, 0], { opacity: .25 }), part("从室外地面实际进入公共场坪的低缓坡道", "extrude", stone, [0, 0, -23.5], [1, 1, 1], [0, -90, 0], { depth: 4, profile: [{ x: -1.5, y: 0 }, { x: 1.5, y: 0 }, { x: 1.5, y: .3 }, { x: -1.5, y: .02 }] })];
  for (let edge = 0; edge < outside.length; edge++) {
    const a = outside[edge]!, b = outside[(edge + 1) % outside.length]!, dx = b[0] - a[0], dz = b[1] - a[1], width = Math.hypot(dx, dz), yaw = -Math.atan2(dz, dx) * 180 / Math.PI, x = (a[0] + b[0]) / 2, z = (a[1] + b[1]) / 2;
    if (edge === 0 || edge === 3) p.push(...placeWing(serviceFacade(width, edge ? 2.4 : 3.2), x, z, yaw));
    else p.push(boxesMesh("上下公共空间外侧真实窗下墙与屋面承梁", stone, [{ center: [0, .75, 0], size: [width, .9, .24] }, { center: [0, 7.75, 0], size: [width, .7, .24] }], [x, 0, z], yaw), ...placeWing([part("服务厅真实连续外窗孔中的透明高窗", "box", colors.glass, [0, 4.3, 0], [width, 6.2, .05], [0, 0, 0], { opacity: .24 })], x, z, yaw));
  }
  const partitions: SolidBox[] = [], furniture: SolidBox[] = [], guards: SolidBox[] = [];
  for (const [x, width] of [[-17, 14], [6, 12], [18, 12]]) {
    p.push(doorway("上层独立办事工作房面向公共回廊的真实门洞", [x!, 4.5, -12], width!, 3.6, 1.2, 0, 2.4));
    furniture.push({ center: [x!, 4.95, -17], size: [3.4, .9, 1.1] });
  }
  for (const x of [-10, 0, 12]) partitions.push({ center: [x, 6.3, -16], size: [.2, 3.6, 8] });
  for (const [z, depth] of [[-4, 8], [4, 8], [14, 12]]) {
    p.push(doorway("独立社区洽谈房真实接入上层回廊的房门", [-20, 4.5, z!], depth!, 3.6, 1.1, 90, 2.4));
    furniture.push({ center: [-22.2, 4.95, z!], size: [1.5, .9, 2.5] });
  }
  for (const z of [-8, 0, 8]) partitions.push({ center: [-22, 6.3, z], size: [4, 3.6, .18] });
  for (let flight = 0; flight < 3; flight++) p.push(stairFlight("从公共服务厅真正穿过合并梯井的连续上行阶梯", -6, .3 + flight * 1.4, -16 + flight * 2.4, 1.8, 8, .175, .3));
  const postKeys = new Set<string>();
  for (let edge = 0; edge < shaft.length; edge++) {
    if (edge === 6) continue;
    const a = shaft[edge]!, b = shaft[(edge + 1) % shaft.length]!, dx = b[0] - a[0], dz = b[1] - a[1], length = Math.hypot(dx, dz), count = Math.ceil(length / 4);
    guards.push({ center: [(a[0] + b[0]) / 2, 5.6, (a[1] + b[1]) / 2], size: [Math.abs(dx) || .06, .06, Math.abs(dz) || .06] });
    for (let i = 0; i <= count; i++) {
      const x = a[0] + dx * i / count, z = a[1] + dz * i / count, key = `${x.toFixed(5)},${z.toFixed(5)}`;
      if (postKeys.has(key)) continue;
      postKeys.add(key); guards.push({ center: [x, 5.05, z], size: [.06, 1.1, .06] });
    }
  }
  for (const z of [-4, 4, 12]) furniture.push({ center: [-19.5, .85, z], size: [1.1, 1.1, 6] });
  for (const z of [0, 7, 14]) furniture.push({ center: [-10, .525, z], size: [6, .45, .7] });
  const posts: SolidBox[] = outside.map(([x, z]) => ({ center: [x, 4.2, z], size: [.25, 7.8, .25] }));
  p.push(boxesMesh("公共回廊旁各独立工作和洽谈房的真实隔墙", stone, partitions), boxesMesh("工作房桌台与地面公共服务柜台等候座台", wood, furniture), boxesMesh("街角服务楼各转角真正贯通落地的承重柱", dark, posts));
  for (let start = 0; start < guards.length; start += 18) p.push(boxesMesh("围住中庭与长梯井并保留阶梯高端出口的实际护栏", dark, guards.slice(start, start + 18)));
  return p;
}
