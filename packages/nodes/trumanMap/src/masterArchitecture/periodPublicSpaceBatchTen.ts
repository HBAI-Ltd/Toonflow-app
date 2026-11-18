import { part, type ModelPart } from "../assetModelParts";
import { base, box, cylinder, design, type ArchitecturePrototype } from "./structures";
import { verticalPanel } from "./historicSpaceBatchNine";
import { openingWall, holesAt, postSet } from "./periodPublicSpaceBatchOne";
import { boxesMesh, type SolidBox } from "./publicSpaceBatchEight";

const stone = "#aaa997", brick = "#b18b76", wood = "#896d50", iron = "#65706f";

export const periodPublicSpaceBatchTenDesigns: ArchitecturePrototype[] = [
  design("北窗锯齿三跨织布厂", "三跨低斜屋面分别接到竖直高窗，锯齿形完整端墙保留三路搬运门，柱列按低高檐标高接承，九组开放框架织机和两侧长窗围合完整年代织布车间", northlightWeavingFactory, "建筑", "中式"),
];

function northlightWeavingFactory(): ModelPart[] {
  const p: ModelPart[] = [base(42, 62), box("织布大车间与四周搬运通路共同的完整石地坪", 0, .3, 0, 40, .24, 60, stone)];
  const end: [number, number][] = [[-18, 0], [18, 0], [18, 6.48], [6, 3.78], [6, 6.48], [-6, 3.78], [-6, 6.48], [-18, 3.78]];
  for (const z of [-27, 27]) p.push(verticalPanel("依三跨锯齿屋面真正封合且开通三路搬运门的完整端壁", end, holesAt([-12, 0, 12], 3, 3.2), .35, [0, .42, z], 0, brick));
  for (const s of [-1, 1]) p.push(openingWall("大车间长侧面由低檐向下完整围合的真实窗墙", 54, 3.78, holesAt([-20, -10, 0, 10, 20], 2.5, 1.6, 1.2), [s * 18, .42, 0], 90, brick));
  p.push(postSet("厂房首列真正接到短低檐的整高承重木柱", [-27, -18, -9, 0, 9, 18, 27].map(z => [-18, z]), 3.78));
  const slope = Math.atan2(2.7, 12), roofY = 5.55 + .09 * Math.cos(slope);
  for (const x of [-12, 0, 12]) {
    const roof = box("织布厂各跨由低檐升到竖高窗顶的完整长斜屋面", x, roofY, 0, Math.hypot(12, 2.7), .18, 54.8, iron); roof.rotation.z = slope * 180 / Math.PI;
    p.push(roof);
  }
  for (const x of [-6, 6, 18]) {
    p.push(part("三跨锯齿顶竖直向光且实际夹在上下梁间的连续透明高窗", "box", "#a6bcb7", [x, 5.5625, 0], [.06, 2.375, 54], [0, 0, 0], { opacity: .3 }), box("锯齿高窗底部真正接到相邻低斜屋面的长承梁", x, 4.2875, 0, .2, .175, 54, wood), box("竖直高窗顶部实际承接抬高斜屋面边缘的长木梁", x, 6.825, 0, .2, .15, 54, wood), postSet("各跨高窗旁真正从地面接到高檐的整高承重柱", [-27, -18, -9, 0, 9, 18, 27].map(z => [x, z]), 6.48));
  }
  const frames: SolidBox[] = [];
  for (const x of [-12, 0, 12]) for (const z of [-17, 0, 17]) {
    frames.push({ center: [x, .57, z], size: [5.6, .3, 6.6] }, { center: [x, .92, z - 2.8], size: [5.6, .2, .2] }, { center: [x, 3.32, z + 2.8], size: [5.6, .2, .2] });
    for (const side of [-1, 1]) frames.push({ center: [x + side * 2.6, 1.17, z - 2.8], size: [.18, .9, .18] }, { center: [x + side * 2.6, 1.97, z + 2.8], size: [.18, 2.5, .18] }, { center: [x + side * 2.6, 1.05, z], size: [.18, .2, 5.6] });
    p.push(cylinder("织机前侧真正承接经面与卷布的低位横滚筒", x, 1.3, z - 2.8, .35, 5.2, wood, [0, 0, 90]), cylinder("织机后侧由高木架实际承托的高位整经横滚筒", x, 3, z + 2.8, .35, 5.2, wood, [0, 0, 90]));
    const web = box("九组织机内部真正跨接前后滚筒的连续斜经布面", x, 2.325, z, 4.5, .025, Math.hypot(5.6, 1.7), "#a9b1a4"); web.rotation.x = -Math.atan2(1.7, 5.6) * 180 / Math.PI; p.push(web);
  }
  for (let start = 0; start < frames.length; start += 20) p.push(boxesMesh("厂内九组织机真正落地且分别承托前后滚筒的开放木框架", wood, frames.slice(start, start + 20)));
  return p;
}
