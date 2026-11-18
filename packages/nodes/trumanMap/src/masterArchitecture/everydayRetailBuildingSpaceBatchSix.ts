import type { ModelPart } from "../assetModelParts";
import { combineMeshes } from "../natureParts";
import { glazedWall } from "./modernResidenceSpaceBatchOne";
import { boxesMesh, standingPanel, type SolidBox } from "./publicSpaceBatchEight";
import { box, cylinder, design, rail, type ArchitecturePrototype } from "./structures";
import { hardFloor } from "./vernacularWorldBatchSix";

const paving = "#bcbcaf", metal = "#617876", pale = "#c9c5b2", paper = "#dedac6", timber = "#a58b68";

export const everydayRetailBuildingSpaceBatchSixDesigns: ArchitecturePrototype[] = [
  design("圆背双展翼报刊屋", "可进入的D形闭合店壳沿后弧壁开真正员工门，前墙售卖空窗上方的掀板由铰轴和两根斜撑固定为遮檐；前两角展开的报刊翼各有实际铰点、承板与挡边，后店工作通道绕开窗下柜，完整同廓屋盖由弧壁柱墩承住", foldingWingNewsShop, "建筑", "现代"),
];

function foldingWingNewsShop(): ModelPart[] {
  const arc: [number, number][] = [], roofArc: [number, number][] = [];
  for (let i = 0; i <= 12; i++) {
    if (i === 6) continue;
    const angle = i * Math.PI / 12;
    arc.push([2.4 * Math.cos(angle), 2.4 * Math.sin(angle)]);
    roofArc.push([2.75 * Math.cos(angle), 2.75 * Math.sin(angle)]);
  }
  const p: ModelPart[] = [
    hardFloor("后弧员工店室与平直售货窗实际围合的完整D形地坪", paving, [[-2.4, -.6], [2.4, -.6], ...arc], .2, [0, 0, 0]),
    box("售货窗前与柜下实际接合的独立落地平台", 0, .1, -1.35, 5.2, .2, 1.5, paving),
    hardFloor("全部弧壁和前沿承墙共同支起的同廓厚屋盖", metal, [[-2.75, -1.02], [2.75, -1.02], ...roofArc], .2, [0, 2.9, 0]),
    standingPanel("前承墙真正保留无玻璃阻隔的售报服务空窗", pale, [[-2.4, .2], [2.4, .2], [2.4, 2.9], [-2.4, 2.9]], [[[-1.6, 1.15], [1.6, 1.15], [1.6, 2.5], [-1.6, 2.5]]], -.6, .18),
    box("上掀售卖窗板实际绕上沿横轴打开为水平遮檐", 0, 2.5, -1.395, 3.2, .06, 1.35, metal),
    cylinder("上掀窗板接入两端窗肩的真实连续横铰轴", 0, 2.5, -.72, .06, 3.4, metal, [0, 0, 90]),
    rail([-1.75, 2.1, -.66], [-1.5, 2.49, -2], .035, metal),
    rail([1.75, 2.1, -.66], [1.5, 2.49, -2], .035, metal),
  ];
  const walls: ModelPart[] = [], posts: SolidBox[] = [], interior: SolidBox[] = [];
  for (const side of [-1, 1]) p.push(...glazedWall("售货平墙与后弧围壁实际接合的短侧壁", [side * 2.4, -.6], [side * 2.4, 0], .2, 2.9, []));
  for (let i = 0; i < arc.length - 1; i++) {
    const start = arc[i]!, end = arc[i + 1]!, length = Math.hypot(end[0] - start[0], end[1] - start[1]), rearDoor = start[0] > 0 && end[0] < 0;
    const values = glazedWall("圆背店室实际开员工门与独立高窗的完整承墙", start, end, .2, 2.9, !rearDoor && i % 2 === 0 ? [[0, 2.05, length - .3, .45]] : [], rearDoor ? [[0, .2, 1, 2.4]] : []);
    walls.push(values[0]!); p.push(...values.slice(1));
  }
  for (let i = 0; i < walls.length; i += 4) p.push(combineMeshes("圆背承墙门窗和墙墩完整保留的连续硬面壳段", walls[0]!.color, walls.slice(i, i + 4)));
  for (const [x, z] of arc) posts.push({ center: [x, 1.55, z], size: [.07, 2.7, .07] });
  interior.push({ center: [0, .65, -.45], size: [3.3, .9, .8] }, { center: [0, 1.13, -.45], size: [3.45, .06, .9] });
  for (const x of [-1.7, 1.7]) {
    for (const end of [-1, 1]) interior.push({ center: [x, 1.05, .95 + end * .55], size: [.52, 1.7, .06] });
    for (const y of [.25, .75, 1.25, 1.85]) interior.push({ center: [x, y, .95], size: [.52, .07, 1.16] });
  }
  p.push(boxesMesh("弧背真实落在地坪并接屋盖的全高小柱", metal, posts), boxesMesh("窗下完整接地柜和店内两侧实际开放承板书架", timber, interior));
  for (const [x, yaw] of [[-2.4, 135], [2.4, 45]]) {
    p.push(cylinder("外展报刊翼真实接入亭角承墙的竖向铰轴", x!, 1.2, -.6, .055, 1.9, metal));
    const wing: SolidBox[] = [{ center: [.75, 1.2, 0], size: [1.5, 1.8, .06] }], books: SolidBox[] = [];
    for (const px of [0, 1.5]) wing.push({ center: [px, 1.2, -.12], size: [.055, 1.8, .27] });
    for (const y of [.4, .9, 1.4, 1.95]) {
      wing.push({ center: [.75, y, -.12], size: [1.5, .06, .3] }, { center: [.75, y + .075, -.27], size: [1.5, .12, .035] });
      if (y === 1.95) continue;
      for (const px of [.25, .75, 1.25]) books.push({ center: [px, y + .205, -.1], size: [.43, .35, .1] });
    }
    p.push(boxesMesh("围绕真实亭角铰点展开的多层报刊翼承板挡边", metal, wing, [x!, 0, -.6], yaw!), boxesMesh("实际坐在展翼层板后保留分离厚度的报刊束", paper, books, [x!, 0, -.6], yaw!));
  }
  return p;
}
