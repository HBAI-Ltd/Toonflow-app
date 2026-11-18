import { part, type ModelPart } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { box, design, colors } from "./structures";
import { doorway } from "./publicSpaceBatchOne";
import { boxesMesh, standingPanel, type SolidBox } from "./publicSpaceBatchEight";

const stone = "#b8b8aa", dark = "#52696c", wood = "#a8926c";

export const publicSpaceBatchFifteenDesigns = [
  design("折街透院门诊中心", "两条临街诊疗翼由带连续天光的斜向候诊街连接，八个独立检查室分别接到公共候诊条带，两端接待门厅各自通向室外，真正Z形外廓在外侧留下两片开放院落", diagonalClinic, "建筑", "现代"),
];

function diagonalClinic(): ModelPart[] {
  const half = Math.sqrt(3.25) * 4, left = -12 - half, right = -12 + half;
  const outline: [number, number][] = [[-22, -20], [22, -20], [22, -8], [right, -8], [-left, 8], [22, 8], [22, 20], [-22, 20], [-22, 8], [-right, 8], [left, -8], [-22, -8]];
  const light: [number, number][] = [[-11.7, -6], [-6.3, -6], [11.7, 6], [6.3, 6]];
  const p: ModelPart[] = [box("折街门诊中心与两片外院共同落地场坪", 0, .15, 0, 48, .3, 44, stone), polygon("诊疗翼与斜向候诊街同一真实Z形地面轮廓", wood, outline, .205, [0, .1, 0]), polygon("连续折街屋面保留独立斜向天光开口", dark, outline, .2, [0, 4.5, 0], [light])];
  const sky = polygon("斜向候诊街上方真正封合天光孔的透明顶", colors.glass, light, .05, [0, 4.7, 0]); sky.opacity = .25; p.push(sky);
  const facade: [number, number][] = [[-22, .3], [-1.5, .3], [-1.5, 3], [1.5, 3], [1.5, .3], [22, .3], [22, 4.5], [-22, 4.5]], windows: [number, number][][] = [[[-21, 1.4], [-4.5, 1.4], [-4.5, 3.8], [-21, 3.8]], [[4.5, 1.4], [21, 1.4], [21, 3.8], [4.5, 3.8]]];
  for (const z of [-20, 20]) {
    p.push(standingPanel("两端公共主门及检查室后窗同时真实开孔的完整立面", stone, facade, windows, z, .24));
    for (const x of [-12.75, 12.75]) p.push(part("检查室真实后窗孔内的独立透明长窗", "box", colors.glass, [x, 2.6, z], [16.5, 2.4, .05], [0, 0, 0], { opacity: .25 }));
  }
  for (let index = 0; index < outline.length; index++) {
    if (index === 0 || index === 6) continue;
    const a = outline[index]!, b = outline[(index + 1) % outline.length]!, dx = b[0] - a[0], dz = b[1] - a[1], width = Math.hypot(dx, dz), yaw = -Math.atan2(dz, dx) * 180 / Math.PI;
    const x = (a[0] + b[0]) / 2, z = (a[1] + b[1]) / 2;
    p.push(boxesMesh("折街每段外墙真实连续窗下带与承顶墙楣", stone, [{ center: [0, .8, 0], size: [width, 1, .24] }, { center: [0, 4.15, 0], size: [width, .7, .24] }], [x, 0, z], yaw), part("转向外院的实际透光候诊街侧窗", "box", colors.glass, [x, 2.55, z], [width, 2.5, .05], [0, yaw, 0], { opacity: .25 }));
  }
  const posts: SolidBox[] = outline.map(([x, z]) => ({ center: [x, 2.4, z], size: [.18, 4.2, .18] })), walls: SolidBox[] = [], furniture: SolidBox[] = [];
  for (const side of [-1, 1]) {
    for (const x of [-17.5, -8.5, 8.5, 17.5]) {
      p.push(doorway("八间检查室各自面向公共候诊条带的真实门洞", [x, .3, side * 11], 9, 4.2, 1.4, 0, 2.4));
      furniture.push({ center: [x, .675, side * 15.5], size: [.9, .75, 2.1] }, { center: [x, .75, side * 19.5], size: [3, .9, .65] });
    }
    for (const x of [-13, -4, 4, 13]) walls.push({ center: [x, 2.4, side * 15.5], size: [.2, 4.2, 9] });
    furniture.push({ center: [0, .8, side * 16], size: [3, 1, .7] });
  }
  p.push(boxesMesh("Z形各转角实际落地承重竖柱", dark, posts), boxesMesh("真实分隔检查室与两端公共接待门厅的完整隔墙", stone, walls), boxesMesh("各检查室真实落地检查台工作柜与两端接待台", "#98a599", furniture));
  return p;
}
