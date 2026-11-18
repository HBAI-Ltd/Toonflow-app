import { part, beam, type ModelPart } from "../assetModelParts";
import { base, box, design, type ArchitecturePrototype } from "./structures";
import { polygon } from "../masterNature/shared";
import { stairFlight } from "./historicSpaceBatchSeven";
import { halfRoundWall } from "./spatialShells";
import { openingWall, holesAt, postSet } from "./periodPublicSpaceBatchOne";
import { boxesMesh, type SolidBox } from "./publicSpaceBatchEight";

const stone = "#bbb8a8", plaster = "#c6beaa", wood = "#8b7258", iron = "#65706f";

export const periodPublicSpaceBatchElevenDesigns: ArchitecturePrototype[] = [
  design("街角圆井天光百货楼", "三层扇面营业楼沿街角展开，十二片真实开门窗的弧面立壁围住偏置圆形通高天光井，后角独立U形楼梯穿过各层真实梯井，浅玻璃穹和两侧服务门组成完整百货空间", cornerDepartmentStore, "建筑", "欧式"),
];

function cornerDepartmentStore(): ModelPart[] {
  const outline: [number, number][] = [[-16, -16]], roof: [number, number][] = [[-16.3, -16.3]], arc: [number, number][] = [];
  for (let i = 0; i <= 12; i++) {
    const a = i * Math.PI / 24;
    arc.push([-16 + Math.cos(a) * 32, -16 + Math.sin(a) * 32]);
    roof.push([-16.3 + Math.cos(a) * 32.8, -16.3 + Math.sin(a) * 32.8]);
  }
  outline.push(...arc);
  const atrium: [number, number][] = Array.from({ length: 24 }, (_, i) => [-3 + Math.cos(i * Math.PI / 12) * 7.2, -3 + Math.sin(i * Math.PI / 12) * 7.2]);
  const stairHole: [number, number][] = [[-15.25, -11], [-11.85, -11], [-11.85, -4.5], [-15.25, -4.5]];
  const p: ModelPart[] = [base(42, 42), box("百货楼与街角入口外侧完整共用的石铺地坪", 0, .3, 0, 40, .24, 40, stone), polygon("街角百货楼真实留出偏置圆井的完整平屋盖", plaster, roof, .25, [0, 11.22, 0], [atrium]), halfRoundWall("弧形街角屋面上真正围护整条弧边的低石女儿墙", 32.2, .25, .6, [-16, 11.47, -16], 0, plaster, Math.PI / 2), postSet("两跑U形楼梯转向平台下贯穿梯井且真正落地的完整木撑", [[-14.95, -5.7], [-12.15, -5.7], [-14.95, -4.8], [-12.15, -4.8]], 5.2)];
  for (let i = 0; i < 12; i++) {
    const a = arc[i]!, b = arc[i + 1]!, length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    p.push(openingWall("沿街角曲线逐片闭合且上下真实透空的三层门窗立壁", length, 10.8, [...holesAt([0], i === 5 || i === 6 ? 2.6 : 2, i === 5 || i === 6 ? 3 : 1.8, i === 5 || i === 6 ? .035 : 1.1), ...holesAt([0], 2, 1.8, 4.6), ...holesAt([0], 2, 1.8, 8.2)], [(a[0] + b[0]) / 2, .42, (a[1] + b[1]) / 2], -Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI));
  }
  for (const yaw of [0, 90]) p.push(openingWall("街角百货楼两条径向外墙真实开通服务门与分层采光窗", 32, 10.8, [...holesAt([yaw === 0 ? 6 : -6], 1.5, 2.7), ...[1.1, 4.6, 8.2].flatMap(y => holesAt([-10, 0, 10], 2, 1.8, y))], yaw === 0 ? [0, .42, -16] : [-16, .42, 0], yaw));
  const columns: [number, number][] = [...arc];
  for (const x of [-12, -4, 4, 12]) for (const z of [-12, -4, 4, 12]) if (Math.hypot(x + 16, z + 16) < 31 && Math.hypot(x + 3, z + 3) > 7.8 && !(x > -15.25 && x < -11.85 && z > -11 && z < -4.5)) columns.push([x, z]);
  p.push(postSet("弧面转角与营业厅内真正穿层接承屋盖的完整柱列", columns, 10.8));
  const posts: SolidBox[] = [];
  for (let level = 0; level < 2; level++) {
    const floor = .42 + level * 3.6, top = floor + 3.6, landing = floor + 1.8;
    p.push(polygon("三层营业楼上层真正留出圆天光井与后角梯井的完整木楼板", wood, outline, .25, [0, top - .25, 0], [atrium, stairHole]), stairFlight("后角U形楼梯实际接上半高转向平台的第一跑木阶", 10, 1.4, 1.8, .5, 0, [-14.4, floor, -11], -90, true), box("后角U形楼梯两跑真正等高接入的完整转向木平台", -13.55, landing - .1, -5.25, 3.1, .2, 1.5, wood), stairFlight("后角U形楼梯从转向平台实际接到上层营业楼面的第二跑", 10, 1.4, 1.8, .5, 0, [-12.7, landing, -6], 90, true), box("转向平台背侧真正防护临空边的完整木护栏", -13.55, landing + .5, -4.5, 3.1, 1, .08, wood), halfRoundWall("营业回廊圆形挑空边界前半圈真正接到楼面的木护壁", 7.4, .2, 1, [-3, top, -3], 0, wood), halfRoundWall("营业回廊圆形挑空边界后半圈真正接到楼面的木护壁", 7.4, .2, 1, [-3, top, -3], 180, wood), box("上层营业楼后角真实梯井背端的完整木护栏", -13.55, top + .5, -4.5, 3.4, 1, .08, wood), box("U阶两跑之间在楼层入口处真正防护窄缝的短木栏", -13.55, top + .5, -11, .3, 1, .08, wood));
    for (const x of [-15.25, -11.85]) p.push(box("上层营业楼真实梯井两侧连续落地的完整木护栏", x, top + .5, -7.75, .08, 1, 6.5, wood));
    if (level === 1) p.push(box("顶层梯井低端让开回程阶出口的真实左半幅木护栏", -14.4, top + .5, -11, 1.7, 1, .08, wood));
    for (const [x, start, end, from] of [[-14.4, -11, -6, floor], [-12.7, -6, -11, landing]]) for (const side of [-1, 1]) {
      const px = x! + side * .7;
      p.push(beam("后角U阶两跑两侧真正随踏面上行的连续木扶手", wood, [px, from! + 1, start!], [px, from! + 2.8, end!], .07));
      for (const t of [0, .5, 1]) posts.push({ center: [px, from! + .5 + 1.8 * t, start! + (end! - start!) * t], size: [.08, 1, .08] });
    }
  }
  p.push(part("圆天光井上方真正落在屋面孔边的浅玻璃采光穹", "lathe", "#a6bcb7", [-3, 11.47, -3], [1, 1, 1], [0, 0, 0], { profile: [{ x: 7.4, y: -.08 }, { x: 7.4, y: 0 }, { x: 5.5, y: .9 }, { x: 2.9, y: 1.7 }, { x: 0, y: 2 }, { x: 0, y: 1.92 }, { x: 2.87, y: 1.62 }, { x: 5.45, y: .82 }], opacity: .3 }));
  const rib: [number, number][] = [[-7.4, 0], [-5.5, .9], [-2.9, 1.7], [0, 2], [2.9, 1.7], [5.5, .9], [7.4, 0]];
  for (const axis of [0, 1]) for (let i = 0; i < rib.length - 1; i++) {
    const a = rib[i]!, b = rib[i + 1]!;
    p.push(beam("浅玻璃天光穹由屋面孔边连续支起的交叉金属拱肋", iron, axis ? [-3, 11.47 + a[1], -3 + a[0]] : [-3 + a[0], 11.47 + a[1], -3], axis ? [-3, 11.47 + b[1], -3 + b[0]] : [-3 + b[0], 11.47 + b[1], -3], .06));
  }
  const cases: SolidBox[] = [];
  for (const [x, z] of [[-10, 6], [-4, 10], [6, -10], [10, -4], [-10, -12], [-4, -13]]) {
    cases.push({ center: [x!, .97, z!], size: [3, 1.1, 1.4] }, { center: [x!, 1.57, z!], size: [3.2, .1, 1.6] });
    for (const offset of [-.9, 0, .9]) cases.push({ center: [x! + offset, 1.77, z!], size: [.45, .3, .5] });
  }
  for (let start = 0; start < cases.length; start += 20) p.push(boxesMesh("百货营业厅真实落地且摆放商品的分散低柜", wood, cases.slice(start, start + 20)));
  for (let start = 0; start < posts.length; start += 20) p.push(boxesMesh("后角连续U阶各跑扶手下真正落到踏面的完整立杆", wood, posts.slice(start, start + 20)));
  return p;
}
