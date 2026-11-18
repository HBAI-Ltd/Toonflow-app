import { beam, type ModelPart } from "../assetModelParts";
import { base, box, design, type ArchitecturePrototype } from "./structures";
import { polygon } from "../masterNature/shared";
import { combineMeshes } from "../natureParts";
import { stairFlight } from "./historicSpaceBatchSeven";
import { verticalPanel, windowHole } from "./historicSpaceBatchNine";
import { barrelRoof } from "./spatialShells";
import { openingWall, holesAt, postSet } from "./periodPublicSpaceBatchOne";
import { boxesMesh, type SolidBox } from "./publicSpaceBatchEight";

const stone = "#bbb8a8", plaster = "#c6beaa", wood = "#8b7258", iron = "#65706f";

export const periodPublicSpaceBatchThirteenDesigns: ArchitecturePrototype[] = [
  design("下库上厅双筒阅览馆", "下层长书库的两条主通道接前后双门，前厅双长阶穿过真实楼板孔进入上层阅览厅，中央铸铁柱列托住谷梁与两座并行长筒券，完整双弧端壁和高侧窗围合大阅览空间", twinVaultLibrary, "建筑", "欧式"),
];

function twinVaultLibrary(): ModelPart[] {
  const p: ModelPart[] = [base(32, 50), box("下层书库、前后入口与阅览馆共同的完整石铺地面", 0, .3, 0, 30, .24, 48, stone), polygon("下库上厅之间真正让出前侧双阶井的完整重楼板", stone, [[-12.4, -21], [12.4, -21], [12.4, 21], [-12.4, 21]], .25, [0, 3.77, 0], [[[-9.85, -19], [-8.15, -19], [-8.15, -13], [-9.85, -13]], [[8.15, -19], [9.85, -19], [9.85, -13], [8.15, -13]]]), { ...postSet("阅览馆中轴真正从下层地面穿楼板接到谷梁底的完整铁柱", [-17, -7, 3, 13, 19].map(z => [0, z]), 6.9), color: iron }, { ...postSet("下层书库两侧真正接承楼板横梁的短铁柱列", [-17, -7, 3, 13, 19].flatMap(z => [[-7, z], [7, z]] as [number, number][]), 3.05), color: iron }, box("上层两筒券之间由中轴铁柱真正接承的连续谷梁", 0, 7.47, 0, .5, .3, 42, iron)];
  const end: [number, number][] = [[-12.4, 0], [12.4, 0], [12.4, 7.2]];
  for (const center of [6.2, -6.2]) for (let i = 1; i <= 12; i++) { const a = i * Math.PI / 12; end.push([center + Math.cos(a) * 6.2, 7.2 + Math.sin(a) * 6.2]); }
  for (const z of [-21, 21]) p.push(verticalPanel("依两座并行筒券真正闭合且保留上下实门窗的完整双弧端壁", end, [...holesAt([-5, 5], 2.2, 2.8), windowHole(-6.2, 5.2, 4.8, 5.4), windowHole(6.2, 5.2, 4.8, 5.4)], .35, [0, .42, z], 0, plaster));
  for (const s of [-1, 1]) {
    p.push(openingWall("阅览馆两侧真正围合双层楼面并透光的完整长窗壁", 42, 7.2, [...holesAt([-16, -8, 0, 8, 16], 2.6, 1.6, 1.1), ...holesAt([-16, -8, 0, 8, 16], 2.6, 1.5, 4.9)], [s * 12.4, .42, 0], 90), barrelRoof("上层完整阅览厅真正由中轴谷梁和外侧厚壁接承的长筒券", 6, .2, 42, [s * 6.2, 7.62, 0], plaster), box("外侧厚壁内挑出并真正接承金属拱肋脚的连续窄木石梁", s * 12.15, 7.47, 0, .3, .3, 42, iron), stairFlight("前厅两侧真正穿过楼板长孔升到上阅览厅的宽木阶", 20, 1.6, 3.6, .3, 0, [s * 9, .42, -19], -90, true), box("上层双阶井低端真正防护楼板临空边的短木栏", s * 9, 4.52, -19, 1.7, 1, .08, wood));
    for (const x of [s * 9 - .85, s * 9 + .85]) p.push(box("上阅览厅真实长阶孔两侧真正接到楼面的连续木栏", x, 4.52, -16, .08, 1, 6, wood));
    for (const x of [s * 9 - .8, s * 9 + .8]) p.push(beam("前厅双阶两侧由立杆接承且真正随踏面抬高的木扶手", wood, [x, 1.42, -19], [x, 5.02, -13], .07));
    for (const z of [-17, -7, 3, 13, 19]) p.push(barrelRoof("上阅览厅由谷梁和外壁内挑梁接承的完整金属拱肋", 5.92, .08, .12, [s * 6.2, 7.62, z], iron));
  }
  for (const z of [-17, -7, 3, 13, 19]) for (const [a, b] of z === -17 ? [[-12.4, -9.85], [-8.15, 8.15], [9.85, 12.4]] : [[-12.4, 12.4]]) p.push(box("下层书库楼板底真正让开双阶头部净空的分段横承梁", (a! + b!) / 2, 3.62, z, b! - a!, .3, .25, iron));
  const shelves: SolidBox[] = [], tables: SolidBox[] = [], benches: SolidBox[] = [], posts: SolidBox[] = [];
  const bookColors = ["#73878b", "#a28f73", "#8c978e"], books: ModelPart[][] = bookColors.map(() => []);
  for (const x of [-9, -3, 3, 9]) for (const z of [-5, 8]) {
    for (const y of [.72, 1.22, 1.72, 2.22, 2.72, 3.22]) shelves.push({ center: [x, y, z], size: [1.1, .08, 10] });
    for (const offset of [-5, 0, 5]) shelves.push({ center: [x, 1.82, z + offset], size: [1.1, 2.8, .08] });
    for (let level = 0; level < 5; level++) for (const side of [-1, 1]) for (let i = 0; i < 10; i++) {
      const color = (i + level) % bookColors.length;
      books[color]!.push(polygon("下层书架上两面分层摆放且保留间隙的多册书匣", bookColors[color]!, [[-.225, -.275], [.225, -.275], [.225, .275], [-.225, .275]], .32 + (i + level) % 3 * .02, [x + side * .27, .76 + level * .5, z - 4.1 + i * .9]));
    }
  }
  for (const x of [-6.2, 6.2]) for (const z of [-8, 4, 16]) {
    tables.push({ center: [x, 4.77, z], size: [2.4, .1, 5] });
    for (const dx of [-1, 1]) for (const dz of [-2.3, 2.3]) tables.push({ center: [x + dx, 4.37, z + dz], size: [.1, .7, .1] });
    for (const side of [-1, 1]) {
      benches.push({ center: [x + side * 2, 4.47, z], size: [.6, .1, 5] });
      for (const offset of [-2.2, 2.2]) benches.push({ center: [x + side * 2, 4.22, z + offset], size: [.12, .4, .12] });
    }
  }
  for (const s of [-1, 1]) for (const x of [s * 9 - .8, s * 9 + .8]) for (const t of [0, .5, 1]) posts.push({ center: [x, .92 + 3.6 * t, -19 + 6 * t], size: [.08, 1, .08] });
  for (const [name, boxes] of [["下层书库真实逐格相接且保留主通道的长木书架", shelves], ["上层大阅览厅真实有桌面和四足的宽长阅读桌", tables], ["两座筒券下沿长阅读桌两侧实际落地的长木坐台", benches], ["前厅双阶斜扶手下真正落到踏面的连续木立杆", posts]] as const) for (let start = 0; start < boxes.length; start += 20) p.push(boxesMesh(name, wood, boxes.slice(start, start + 20)));
  for (let color = 0; color < books.length; color++) for (let start = 0; start < books[color]!.length; start += 64) p.push(combineMeshes("下层整排书架上实际贴接层板的多册书匣", bookColors[color]!, books[color]!.slice(start, start + 64)));
  return p;
}
