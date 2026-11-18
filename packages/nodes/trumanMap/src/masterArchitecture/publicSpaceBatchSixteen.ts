import { part, type ModelPart } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { box, design, rail, colors } from "./structures";
import { doorway } from "./publicSpaceBatchOne";
import { boxesMesh, standingPanel, type SolidBox } from "./publicSpaceBatchEight";
import { placeWing, waistStair } from "./publicSpaceBatchFourteen";

const stone = "#b8b7a8", dark = "#52696b", wood = "#ab936c";

export const publicSpaceBatchSixteenDesigns = [
  design("双庭连廊康养院", "两片露天庭院分列中央共享照护厅两侧，南北横廊和侧廊共同连接十四个实分间居住单元，角部房门先接公共横廊，主入口以真实低坡接入连续平地面", careResidence, "建筑", "现代"),
  design("放射分庭监舍中心", "六边中央厅的三条交替侧面分别连入双层放射监舍翼，中央真实楼梯井连接上下公共通道，窄窗与实体栏条实际开孔，完整外院墙围住翼间三片露天分庭", radialCustodyCenter, "建筑", "现代"),
];

function careResidence(): ModelPart[] {
  const outside: [number, number][] = [[-30, -20], [30, -20], [30, 20], [-30, 20]], courts: [number, number][][] = [[[-18, -7], [-6, -7], [-6, 7], [-18, 7]], [[6, -7], [18, -7], [18, 7], [6, 7]]];
  const p: ModelPart[] = [box("照护院与前方无阶入口共同落地基础", 0, .1, 0, 64, .2, 48, stone), polygon("中央共享厅与环庭横廊同高的完整照护楼面", wood, outside, .1, [0, .2, 0], courts), polygon("两片露天庭院真正贯通的连续照护屋面", dark, outside, .2, [0, 3.9, 0], courts), box("公共主门前与室内同高的完整进场步道", 0, .25, -22, 4, .1, 4, wood), part("从室外地面连续进入照护院步道的低缓实坡", "extrude", stone, [0, 0, -25.5], [1, 1, 1], [0, -90, 0], { depth: 4, profile: [{ x: -1.5, y: 0 }, { x: 1.5, y: 0 }, { x: 1.5, y: .3 }, { x: -1.5, y: .02 }] })];
  const partitions: SolidBox[] = [], beds: SolidBox[] = [], desks: SolidBox[] = [], panes: SolidBox[] = [], posts: SolidBox[] = [];
  for (const side of [-1, 1]) {
    const xs = side < 0 ? [-25, -15, 15, 25] : [-25, -15, -5, 5, 15, 25];
    for (const x of xs) {
      p.push(doorway("独立照护居室从公共横廊进入的真实门", [x, .3, side * 10], 10, 3.6, 1.2, 0, 2.4));
      for (const offset of [-1.5, 1.5]) beds.push({ center: [x + offset, .55, side * 15], size: [1, .5, 2.1] });
      desks.push({ center: [x, .65, side * 18.7], size: [2.4, .7, .8] });
    }
    const dividers = side < 0 ? [-20, -10, 10, 20] : [-20, -10, 0, 10, 20];
    for (const x of dividers) partitions.push({ center: [x, 2.1, side * 15], size: [.2, 3.6, 10] });
    for (const z of [-3.5, 3.5]) {
      p.push(doorway("侧翼照护居室面向公共侧廊的真实门", [side * 21, .3, z], 7, 3.6, 1.2, 90, 2.4));
      for (const offset of [-1.4, 1.4]) beds.push({ center: [side * 25.5, .55, z + offset], size: [2.1, .5, 1] });
      desks.push({ center: [side * 28.5, .65, z], size: [.8, .7, 2.4] });
    }
    for (const z of [-7, 0, 7]) partitions.push({ center: [side * 25.5, 2.1, z], size: [9, 3.6, .2] });
    p.push(box("照护院外侧长窗下真实实体墙", side * 30, .8, 0, .24, 1, 40, stone), box("照护院外侧长窗上连续屋面承梁", side * 30, 3.55, 0, .24, .7, 40, stone), part("居室和横廊外侧完整实际长窗", "box", colors.glass, [side * 30, 2.25, 0], [.05, 1.9, 40], [0, 0, 0], { opacity: .24 }));
  }
  p.push(doorway("公共接待前厅通往中央共享照护厅的真实宽门", [0, .3, -10], 20, 3.6, 6, 0, 2.6));
  for (const z of [-20, 20]) {
    const xs = z < 0 ? [-25, -15, 15, 25] : [-25, -15, -5, 5, 15, 25], outline: [number, number][] = z < 0 ? [[-30, .3], [-1.8, .3], [-1.8, 3], [1.8, 3], [1.8, .3], [30, .3], [30, 3.9], [-30, 3.9]] : [[-30, .3], [30, .3], [30, 3.9], [-30, 3.9]];
    const holes = xs.map((x): [number, number][] => [[x - 4, 1.4], [x + 4, 1.4], [x + 4, 3.2], [x - 4, 3.2]]);
    p.push(standingPanel("各居室真实外窗及接待主门独立开孔的前后立面", stone, outline, holes, z, .24));
    for (const x of xs) panes.push({ center: [x, 2.3, z], size: [8, 1.8, .05] });
  }
  for (const x of [-18, -6, 6, 18]) {
    const outline: [number, number][] = [[-7, .3], [-1, .3], [-1, 2.8], [1, 2.8], [1, .3], [7, .3], [7, 3.9], [-7, 3.9]], holes: [number, number][][] = [[[-6.5, 1.3], [-1.2, 1.3], [-1.2, 3.2], [-6.5, 3.2]], [[1.2, 1.3], [6.5, 1.3], [6.5, 3.2], [1.2, 3.2]]];
    const wall = standingPanel("共享照护厅及侧廊面向庭院的真门窗墙", stone, outline, holes, 0, .24); wall.position.x = x; wall.rotation.y = 90; p.push(wall);
    for (const z of [-3.85, 3.85]) panes.push({ center: [x, 2.25, z], size: [.05, 1.9, 5.3] });
  }
  for (const x of [-12, 12]) {
    p.push(box("真实低于公共步廊的独立庭院绿地", x, .24, 0, 12, .08, 14, "#8b9e7b"), box("两侧庭门之间与公共地面齐平的庭院步道", x, .285, 0, 12, .03, 2, wood));
    for (const z of [-7, 7]) {
      partitions.push({ center: [x, .55, z], size: [12, .5, .2] }, { center: [x, 3.7, z], size: [12, .4, .2] });
      panes.push({ center: [x, 2.15, z], size: [12, 2.7, .05] });
      for (const edge of [-1, 1]) posts.push({ center: [x + edge * 6, 2.1, z], size: [.15, 3.6, .15] });
    }
  }
  desks.push({ center: [0, .8, -15], size: [6, 1, .8] }, { center: [0, .75, 0], size: [3, .9, 2] });
  for (let start = 0; start < partitions.length; start += 18) p.push(boxesMesh("各照护居室完整隔墙与庭窗上下墙带", stone, partitions.slice(start, start + 18)));
  for (let start = 0; start < beds.length; start += 18) p.push(boxesMesh("各实分间居室内独立落地的照护床座", "#a3ac96", beds.slice(start, start + 18)));
  for (let start = 0; start < panes.length; start += 18) { const glass = boxesMesh("完整独立窗孔中的透明居室和庭院窗板", colors.glass, panes.slice(start, start + 18)); glass.opacity = .24; p.push(glass); }
  p.push(boxesMesh("中央共享照护与各居室实际落地的桌台", wood, desks), boxesMesh("庭院转角真正承住屋面的竖柱", dark, posts));
  return p;
}

function cellDoorWall(x: number, floor: number, height: number): ModelPart {
  const profile = [{ x: 8, y: 0 }];
  for (const center of [11.25, 17.75, 24.25, 30.75]) profile.push({ x: center - .45, y: 0 }, { x: center - .45, y: 2.2 }, { x: center + .45, y: 2.2 }, { x: center + .45, y: 0 });
  profile.push({ x: 34, y: 0 }, { x: 34, y: height }, { x: 8, y: height });
  return part("每层四个独立监舍门口真正穿透的连续内墙", "extrude", stone, [x, floor, 0], [1, 1, 1], [0, -90, 0], { depth: .18, profile });
}

function radialCustodyCenter(): ModelPart[] {
  const half = 8 / Math.sqrt(3), hex: [number, number][] = [[-half, 8], [half, 8], [half * 2, 0], [half, -8], [-half, -8], [-half * 2, 0]];
  const p: ModelPart[] = [box("放射长翼和三片分庭共同落地院坪", 0, .15, 0, 82, .3, 82, stone), polygon("六边中央厅完整地层地面", "#a8ac99", hex, .205, [0, .1, 0]), polygon("中央上下公共通道保留实际楼梯井", wood, hex, .2, [0, 3.3, 0], [[[-1.2, -3.8], [1.2, -3.8], [1.2, 3.8], [-1.2, 3.8]]]), polygon("三条监舍翼共同汇入的中央六边屋盖", dark, hex, .25, [0, 6.7, 0]), doorway("完整外院墙正面实际宽主门", [0, .3, -39], 78, 4.5, 4, 0, 4.2), box("外院后侧完整高围壁", 0, 2.55, 39, 78, 4.5, .3, stone), ...[-1, 1].map(side => box("外院两侧完整高围壁", side * 39, 2.55, 0, .3, 4.5, 78, stone))];
  for (const index of [1, 3, 5]) {
    const a = hex[index]!, b = hex[(index + 1) % 6]!, width = Math.hypot(b[0] - a[0], b[1] - a[1]), yaw = -Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI, center: [number, number, number] = [(a[0] + b[0]) / 2, 0, (a[1] + b[1]) / 2];
    if (index === 3) {
      const outline: [number, number][] = [[-width / 2, .3], [-1.5, .3], [-1.5, 3.1], [1.5, 3.1], [1.5, .3], [width / 2, .3], [width / 2, 6.7], [-width / 2, 6.7]], holes: [number, number][][] = [[[-3, 4.2], [3, 4.2], [3, 6.2], [-3, 6.2]]], wall = standingPanel("中央厅面向公共进场院的真实门窗立面", stone, outline, holes, 0, .24); wall.position.x = center[0]; wall.position.z = center[2]; wall.rotation.y = yaw; p.push(wall, ...placeWing([part("中央厅上层真正开孔的独立透明窗", "box", colors.glass, [0, 5.2, 0], [6, 2, .05], [0, 0, 0], { opacity: .24 })], center[0], center[2], yaw));
    } else {
      p.push(boxesMesh("中央厅面向分庭的实际窗下墙与承顶墙带", stone, [{ center: [0, .8, 0], size: [width, 1, .24] }, { center: [0, 6.35, 0], size: [width, .7, .24] }], center, yaw), ...placeWing([part("中央上下公共厅面向分庭的连续透明高窗", "box", colors.glass, [0, 3.65, 0], [width, 4.7, .05], [0, 0, 0], { opacity: .24 })], center[0], center[2], yaw));
    }
  }
  for (const yaw of [0, 120, 240]) {
    const wing: ModelPart[] = [box("放射监舍翼上层完整承重楼面", 0, 3.4, 21, 12, .2, 26, wood), box("放射监舍翼地层与中央厅齐平的实际地面", 0, .2025, 21, 12, .205, 26, "#a8ac99"), box("放射监舍翼完整连续屋盖", 0, 6.825, 21, 12, .25, 26, dark), doorway("长翼末端实际通向独立外庭的地层门", [0, .3, 34], 12, 6.4, 2, 0, 2.4)];
    const walls: SolidBox[] = [], bars: SolidBox[] = [], furnishings: SolidBox[] = [];
    for (const floor of [.3, 3.5]) for (const side of [-1, 1]) {
      const height = floor === .3 ? 3 : 3.2;
      wing.push(cellDoorWall(side * 2, floor, height));
      const outline: [number, number][] = [[8, floor], [34, floor], [34, floor + height], [8, floor + height]], holes = [11.25, 17.75, 24.25, 30.75].map((z): [number, number][] => [[z - .45, floor + 1.6], [z + .45, floor + 1.6], [z + .45, floor + 2.3], [z - .45, floor + 2.3]]);
      const wall = standingPanel("每个监舍独立窄窗真正开孔的完整外壁", stone, outline, holes, 0, .24); wall.position.x = side * 6; wall.rotation.y = -90; wing.push(wall);
      for (const z of [8, 14.5, 21, 27.5]) walls.push({ center: [side * 4, floor + height / 2, z], size: [4, height, .18] });
      for (const z of [11.25, 17.75, 24.25, 30.75]) {
        for (const offset of [-.25, 0, .25]) bars.push({ center: [side * 5.95, floor + 1.95, z + offset], size: [.05, .7, .04] });
        for (const offset of [-1.4, 1.4]) furnishings.push({ center: [side * 4.5, floor + .25, z + offset], size: [2, .5, .8] });
        furnishings.push({ center: [side * 5.3, floor + .375, z], size: [.8, .75, 1] });
      }
    }
    wing.push(boxesMesh("各层监舍之间以及中央连接面真正闭合的完整隔墙", stone, walls));
    for (let start = 0; start < bars.length; start += 18) wing.push(boxesMesh("每扇实际窄窗孔内独立可见的实体竖栏", dark, bars.slice(start, start + 18)));
    for (let start = 0; start < furnishings.length; start += 18) wing.push(boxesMesh("各个独立监舍内真实落地的床座和桌台", "#929f92", furnishings.slice(start, start + 18)));
    p.push(...placeWing(wing, 0, 0, yaw));
  }
  for (let flight = 0; flight < 2; flight++) p.push(waistStair("六边中央厅内真正穿过上层洞口的连续公共阶梯", 0, .3 + flight * 1.6, -3.6 + flight * 3.6, 1.8, 12, 1.6 / 12, .3));
  p.push(box("中央阶梯高端实际跨出上层井口的平台", 0, 3.4, 3.9, 1.8, .2, .6, wood), rail([-1.2, 4.6, -3.8], [-1.2, 4.6, 3.8], .06, dark), rail([1.2, 4.6, -3.8], [1.2, 4.6, 3.8], .06, dark), rail([-1.2, 4.6, -3.8], [1.2, 4.6, -3.8], .06, dark));
  const posts: SolidBox[] = [];
  for (const x of [-1.2, 1.2]) for (const z of [-3.8, 3.8]) posts.push({ center: [x, 4.05, z], size: [.06, 1.1, .06] });
  p.push(boxesMesh("中央上层楼梯井周缘实际立柱并保留高端出口", dark, posts));
  return p;
}
