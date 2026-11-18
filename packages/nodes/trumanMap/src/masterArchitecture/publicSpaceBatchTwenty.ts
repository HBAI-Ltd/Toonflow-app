import { part, type ModelPart } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { box, design, rail, colors } from "./structures";
import { doorway } from "./publicSpaceBatchOne";
import { boxesMesh, standingPanel, type SolidBox } from "./publicSpaceBatchEight";

const stone = "#b8b7a8", dark = "#52696b", wood = "#ad966f";

export const publicSpaceBatchTwentyDesigns = [
  design("内坡贯通日间照护楼", "两段三十六米连续缓坡和中部转向平台连接上下两层公共空间，楼板整片让出长坡头部空间，上端直接接入主楼板，两侧各三米公共廊逐间接入活动及休息房，连续天光照向完整长坡中庭", rampDaycare, "建筑", "现代"),
];

function rampDaycare(): ModelPart[] {
  const outside: [number, number][] = [[-16, -22], [16, -22], [16, 22], [-16, 22]], opening: [number, number][] = [[-4, -18], [4, -18], [4, 20.2], [-4, 20.2]];
  const p: ModelPart[] = [box("日间照护楼与公共进场平台共同落地基础", 0, .15, 0, 36, .3, 48, stone), polygon("上下贯坡公共厅的五毫米实体地面饰层", wood, outside, .005, [0, .3, 0]), polygon("完整上层楼板给两条长坡和转向平台保留真实净空", wood, outside, .2, [0, 3.7, 0], [opening]), polygon("完整照护楼屋面中部真正敞开长形采光孔", dark, outside, .25, [0, 7.5, 0], [opening]), part("两段缓坡与转向台上方的完整透明天光顶", "box", colors.glass, [0, 7.775, 1.1], [8.2, .05, 38.4], [0, 0, 0], { opacity: .25 }), part("从室外地面连续进入公共场坪的实际低坡", "extrude", stone, [0, 0, -25.5], [1, 1, 1], [0, -90, 0], { depth: 4, profile: [{ x: -1.5, y: 0 }, { x: 1.5, y: 0 }, { x: 1.5, y: .3 }, { x: -1.5, y: .02 }] }), part("从地层连续抬升到中间平台的完整薄底缓坡", "extrude", wood, [-2, .1, 0], [1, 1, 1], [0, -90, 0], { depth: 3, profile: [{ x: -18, y: 0 }, { x: 18, y: 1.8 }, { x: 18, y: 2 }, { x: -18, y: .2 }] }), part("从中间平台折返并直接到上层楼板的完整缓坡", "extrude", wood, [2, 1.9, 0], [1, 1, 1], [0, 90, 0], { depth: 3, profile: [{ x: -18, y: 0 }, { x: 18, y: 1.8 }, { x: 18, y: 2 }, { x: -18, y: .2 }] }), box("两条长坡齐平接合的实际中间转向平台", 0, 2, 19, 8, .2, 2, wood)];
  const walls: SolidBox[] = [], panes: SolidBox[] = [], sofas: SolidBox[] = [], tables: SolidBox[] = [], guards: SolidBox[] = [], columns: SolidBox[] = [];
  for (const z of [-22, 22]) {
    const door = z < 0 ? 3.2 : 2.4, outline: [number, number][] = [[-16, .3], [-door / 2, .3], [-door / 2, 3.1], [door / 2, 3.1], [door / 2, .3], [16, .3], [16, 7.5], [-16, 7.5]], holes: [number, number][][] = [[[-15, 1.3], [-2.5, 1.3], [-2.5, 6.8], [-15, 6.8]], [[2.5, 1.3], [15, 1.3], [15, 6.8], [2.5, 6.8]]];
    p.push(standingPanel("公共前后门和上下层真实采光窗同时开孔的完整立面", stone, outline, holes, z, .24));
    for (const x of [-8.75, 8.75]) panes.push({ center: [x, 4.05, z], size: [12.5, 5.5, .05] });
  }
  for (const side of [-1, 1]) {
    walls.push({ center: [side * 16, .8, 0], size: [.24, 1, 44] }, { center: [side * 16, 7.15, 0], size: [.24, .7, 44] });
    panes.push({ center: [side * 16, 4.05, 0], size: [.05, 5.5, 44] });
  }
  for (const floor of [.3, 3.9]) for (const side of [-1, 1]) {
    const height = floor < 1 ? 3.4 : 3.6;
    for (const z of [-16.5, -5.5, 5.5, 16.5]) {
      p.push(doorway(floor < 1 ? "独立休息活动房面向公共侧廊的实际宽门" : "上层活动房逐间接入公共侧廊的实际宽门", [side * 7, floor, z], 11, height, 1.2, 90, 2.4));
      if (floor < 1) {
        for (const offset of [-2.3, 2.3]) sofas.push({ center: [side * 11.5, floor + .225, z + offset], size: [5, .45, .8] });
        tables.push({ center: [side * 11.5, floor + .375, z], size: [2, .75, 1.2] });
      } else for (const x of [side * 10, side * 13]) for (const offset of [-2.3, 2.3]) tables.push({ center: [x, floor + .375, z + offset], size: [2.2, .75, 1.2] });
    }
    for (const z of [-11, 0, 11]) walls.push({ center: [side * 11.5, floor + height / 2, z], size: [9, height, .18] });
  }
  const postKeys = new Set<string>();
  const addPost = (x: number, z: number, bottom: number) => {
    const key = `${x.toFixed(5)},${z.toFixed(5)},${bottom.toFixed(5)}`;
    if (postKeys.has(key)) return;
    postKeys.add(key); guards.push({ center: [x, bottom + .55, z], size: [.06, 1.1, .06] });
  };
  for (const lane of [0, 1]) {
    const from = lane ? 18 : -18, to = -from, floor = lane ? 2.1 : .3;
    for (const x of lane ? [.5, 3.5] : [-3.5, -.5]) {
      p.push(rail([x, floor + 1.1, from], [x, floor + 2.9, to], .06, dark));
      for (let step = 0; step <= 12; step++) addPost(x, from + (to - from) * step / 12, floor + 1.8 * step / 12);
    }
  }
  const edges: [number, number, number, number, number][] = [[-4, -18, -4, 20.2, 3.9], [4, -18, 4, 20.2, 3.9], [-4, 20.2, 4, 20.2, 3.9], [-4, -18, .4, -18, 3.9], [3.6, -18, 4, -18, 3.9], [-4, 18, -4, 20, 2.1], [4, 18, 4, 20, 2.1], [-4, 20, 4, 20, 2.1], [-.5, 18, .5, 18, 2.1]];
  for (const [x0, z0, x1, z1, floor] of edges) {
    const dx = x1 - x0, dz = z1 - z0, length = Math.hypot(dx, dz), count = Math.ceil(length / 3);
    guards.push({ center: [(x0 + x1) / 2, floor + 1.1, (z0 + z1) / 2], size: [Math.abs(dx) || .06, .06, Math.abs(dz) || .06] });
    for (let step = 0; step <= count; step++) addPost(x0 + dx * step / count, z0 + dz * step / count, floor);
  }
  for (const x of [-4, 4]) for (const z of [-18, -12, 0, 12, 20.2]) columns.push({ center: [x, 3.9, z], size: [.2, 7.2, .2] });
  for (const x of [-16, 16]) for (const z of [-22, 22]) columns.push({ center: [x, 3.9, z], size: [.25, 7.2, .25] });
  p.push(boxesMesh("各层活动房完整分室墙与外窗上下实体墙带", stone, walls), boxesMesh("各地层独立休息房中实际落地的两侧长座", "#9fa98f", sofas), boxesMesh("长坡中庭和两层公共楼面实际承重竖柱", dark, columns));
  for (let start = 0; start < tables.length; start += 18) p.push(boxesMesh("各活动休息房内实际落地的桌台", wood, tables.slice(start, start + 18)));
  for (let start = 0; start < guards.length; start += 18) p.push(boxesMesh("完整缓坡中庭及转向平台边缘的实际扶手立柱", dark, guards.slice(start, start + 18)));
  const glass = boxesMesh("完整照护楼实际开孔中的独立透明窗板", colors.glass, panes); glass.opacity = .24; p.push(glass);
  return p;
}
