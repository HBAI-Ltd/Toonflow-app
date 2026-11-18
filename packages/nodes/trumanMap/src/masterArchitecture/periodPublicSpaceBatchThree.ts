import type { ModelPart } from "../assetModelParts";
import { base, box, design, type ArchitecturePrototype } from "./structures";
import { polygon } from "../masterNature/shared";
import { stairFlight, turn } from "./historicSpaceBatchSeven";
import { windowHole } from "./historicSpaceBatchNine";
import { tiledRoof, openingWall, holesAt, postSet } from "./periodPublicSpaceBatchOne";
import { boxesMesh, type SolidBox } from "./publicSpaceBatchEight";

const stone = "#aaa997", plaster = "#bfb59d", wood = "#896d50", brick = "#b18b76", iron = "#64716c";

export const periodPublicSpaceBatchThreeDesigns: ArchitecturePrototype[] = [
  design("高柜转门前堂后库当铺", "前堂高柜的真实交付窗与侧向职员门分开，独立侧门通向开敞院子，后方三层高窗押库由有洞口的连续木阶连通，低侧房与高库形成完整前后营业空间", pawnshopCompound, "建筑", "中式"),
  design("前拱廊偏层电报邮局", "前砖拱廊接到客户营业厅，后方高分拣厅内设置偏置电报层，独立外阶直接到上层侧门，后门与有柱雨棚连接邮件装卸场", postalTelegraphOffice, "建筑", "中式"),
  design("前厅雨廊后排牢警署", "横向接待办公厅通过中轴敞开雨廊通向后方牢房，双排分室面向中央走道，每间保留有框格栅和真实门口，外围高窗与后出口围合独立拘留长屋", periodPoliceStation, "建筑", "中式"),
];

function pawnshopCompound(): ModelPart[] {
  const p: ModelPart[] = [base(36, 44), box("当铺前堂、院落和押库共同的石铺地坪", 0, .3, 0, 34, .24, 42, stone), openingWall("当铺前堂真实敞开的客户窄入口", 18, 4.4, [...holesAt([-5], 2.2, 3.1), ...holesAt([2.5, 6], 1.5, 1.4, 1.8)], [0, .42, -18]), openingWall("当铺高柜实际开通的交付窗和职员侧门", 18, 4.4, [...holesAt([-1], 8, 1.7, 1.6), ...holesAt([6], 1.1, 2.7)], [0, .42, -13], 0, wood), openingWall("柜后作业间向院子真正开通的职员后门", 18, 4.4, holesAt([6], 1.4, 2.7), [0, .42, -10]), tiledRoof("前堂高柜营业屋完整灰瓦屋盖", 18, 8, 4.82, [0, -14]), box("高柜交付窗口下方实际挑出的木柜板", -1, 1.99, -13, 8.2, .12, .9, wood), openingWall("当铺旁独立通院侧门实际开通的门洞", 6, 3.4, holesAt([0], 2.7, 2.9), [-12, .42, -18]), tiledRoof("独立侧门通院过道的完整低瓦盖", 6, 8, 3.82, [-12, -14]), box("客户前堂与独立侧门之间完整分隔的厚壁", -9, 2.62, -14, .3, 4.4, 8, plaster), box("客户前堂与右侧低作坊之间完整分隔的厚壁", 9, 2.62, -14, .3, 4.4, 8, plaster), openingWall("右侧作坊临街实际透光的窗墙", 6, 3.4, holesAt([0], 2, 1.4, 1.2), [12, .42, -18]), openingWall("右侧作坊面对院子的真实工作门", 6, 3.4, holesAt([0], 1.3, 2.6), [12, .42, -10]), tiledRoof("前堂旁低作坊完整独立瓦顶", 6, 8, 3.82, [12, -14])];
  for (const s of [-1, 1]) p.push(box("当铺前后完整连接的外围长墙", s * 15, 2.12, 0, .3, 3.4, 36, plaster), box("押库后壁两端与外围墙真正闭合的短墙", s * 13, 1.92, 18, 4, 3, .3, plaster));
  const frontHoles = [...holesAt([6], 2.2, 2.8)];
  const rearHoles: [number, number][][] = [];
  for (const y of [1.9, 5.1, 8.3]) {
    frontHoles.push(...holesAt(y === 1.9 ? [-6, 0] : [-6, 0, 6], 1, .8, y));
    rearHoles.push(...holesAt([-6, 0, 6], 1, .8, y));
  }
  p.push(openingWall("三层押库正面真实独立的门洞与高位小窗", 22, 9.6, frontHoles, [0, .42, 8]), openingWall("三层押库背后实际穿透的窄高采光窗", 22, 9.6, rearHoles, [0, .42, 18]), tiledRoof("三层押库完整高灰瓦屋盖", 22, 10, 10.02, [0, 13]), postSet("押库内部由地面贯通到高屋盖的承重木柱", [-3, 3].flatMap(x => [[x, 9.5], [x, 16]] as [number, number][]), 9.6));
  for (const s of [-1, 1]) p.push(openingWall("押库两侧完整高墙内真实分层的高窗", 10, 9.6, [1.9, 5.1, 8.3].flatMap(y => holesAt([-2.5, 2.5], 1, .8, y)), [s * 11, .42, 13], 90));
  for (let level = 1; level <= 2; level++) {
    const floor = .42 + level * 3.2;
    p.push(polygon("押库上层真正留出登阶洞口的完整木楼面", wood, [[-11, 8], [11, 8], [11, 18], [-11, 18]], .25, [0, floor - .25, 0], [[[-8.85, 9], [-7.15, 9], [-7.15, 15], [-8.85, 15]]]), stairFlight("押库各层连续登高且下方通空的真实木阶", 20, 1.4, 3.2, .3, 0, [-8, floor - 3.2, 9], -90, true));
    for (const x of [-8.85, -7.15]) p.push(box("押库真实阶孔两侧的落地木护栏", x, floor + .5, 12, .08, 1, 6, wood));
    if (level === 2) p.push(box("押库顶层楼板低端真实阶孔边缘的木栏", -8, floor + .5, 9, 1.7, 1, .08, wood));
  }
  const shelves: SolidBox[] = [];
  const legs: [number, number][] = [];
  for (const x of [0, 6]) for (const z of [11, 15.5]) {
    for (const y of [1, 2, 3]) shelves.push({ center: [x, y, z], size: [3, .1, 1.2] });
    for (const dx of [-1.4, 1.4]) for (const dz of [-.5, .5]) legs.push([x + dx, z + dz]);
  }
  p.push(boxesMesh("押库首层四组货架的真实承货层板", wood, shelves), postSet("押库货架层板下实际落地的细木立杆", legs, 2.63));
  return p;
}

function postalTelegraphOffice(): ModelPart[] {
  const p: ModelPart[] = [base(50, 44), box("邮局营业厅、装卸场与独立外阶共用的石地面", 0, .3, 0, 48, .24, 42, stone), openingWall("营业厅正门与两侧真实透光的大窗", 24, 4.6, [...holesAt([0], 3, 3.2), ...[-8, 8].map(x => windowHole(x, 1.1, 3, 2.4))], [0, .42, -15], 0, brick), openingWall("前廊连续四个真正贯通的砖拱", 24, 3.8, [-9, -3, 3, 9].map(x => windowHole(x, .035, 3.6, 3.4)), [0, .42, -18.5], 0, brick), tiledRoof("客户厅完整低灰瓦屋盖", 24, 14, 5.02, [0, -8]), ...turn([tiledRoof("营业厅前砖拱廊的完整窄跨低瓦盖", 3.5, 24, 4.22, [0, 0])], 90, [0, 0, -16.75]), openingWall("营业厅后方通入高分拣厅的职员门和高窗", 24, 6.8, [...holesAt([8], 1.6, 2.8), ...holesAt([-8, 0, 8], 2, 1.6, 4.9)], [0, .42, -1], 0, brick), openingWall("后分拣厅实际接到装卸场的宽门和高窗", 24, 6.8, [...holesAt([5.5], 4, 3.5), ...holesAt([-8, 0, 8], 2, 1.6, 4.6)], [0, .42, 13], 0, brick), tiledRoof("高分拣厅与偏置电报层完整共有的高瓦盖", 24, 14, 7.22, [0, 6]), box("偏置电报工作层实际由柱列接承的完整木楼板", -8, 3.695, 6, 8, .25, 14, wood), box("高位电报层面对分拣厅挑空的完整木护栏", -4, 4.32, 6, .1, 1, 14, wood), postSet("后厅真正承托高瓦盖与偏层楼板的双列木柱", [0, 6, 12].flatMap(z => [[-4, z], [4, z]] as [number, number][]), 6.8), stairFlight("院侧独立外阶真正接到电报层的侧门楼面", 20, 1.6, 3.4, .4, 0, [-20, .42, 9], 0, true)];
  for (const s of [-1, 1]) p.push(openingWall("客户营业厅两侧实际穿透的砖拱采光窗", 14, 4.6, [-4, 3].map(x => windowHole(x, 1.1, 2.6, 2.4)), [s * 12, .42, -8], 90, brick), box("营业厅砖拱前廊两端完整封合的侧壁", s * 12, 2.32, -16.75, .3, 3.8, 3.5, brick));
  p.push(openingWall("高分拣厅左侧接外阶的真实上层门和分层采光窗", 14, 6.8, [...holesAt([-4.5, 3.5], 2, 1.6, 1.1), ...holesAt([-3], 1.8, 2.5, 3.435), ...holesAt([4], 2, 1.6, 4.6)], [-12, .42, 6], 90, brick), openingWall("高分拣厅右侧上下两排真实透空的砖窗", 14, 6.8, [1.1, 4.6].flatMap(y => holesAt([-4.5, 0, 4.5], 2, 1.6, y)), [12, .42, 6], 90, brick));
  const canopy = box("后场装卸门外向院内下降的单坡雨棚", 5.5, 3.7, 15, 10, .18, Math.hypot(4, .6), iron); canopy.rotation.x = Math.atan2(.6, 4) * 180 / Math.PI;
  p.push(canopy, postSet("后场装卸雨棚真正落地承接前檐的独立柱", [[.5, 17], [10.5, 17]], 2.89), box("客户寄信长柜实际让出右侧职员入口", -1, 1.07, -3.5, 14, 1.3, .9, wood), box("营业厅靠左侧墙的包裹交付侧柜", -9.5, 1.07, -7, .9, 1.3, 7, wood), box("分拣厅内独立落地的长邮件分类台", 4.5, 1.02, 6, 9, 1.2, 1.4, wood));
  return p;
}

function periodPoliceStation(): ModelPart[] {
  const p: ModelPart[] = [base(34, 56), box("接待办公厅、中央雨廊与后排牢房共用的石地面", 0, .3, 3, 32, .24, 48, stone), openingWall("警署接待厅对公众真正开通的大门与采光窗", 26, 4.2, [...holesAt([0], 3, 3), ...holesAt([-9, 9], 2, 1.7, 1.2)], [0, .42, -15], 0, brick), openingWall("接待办公厅背后真正通向中央雨廊的门", 26, 4.2, [...holesAt([0], 2.4, 2.9), ...holesAt([-9, 9], 2, 1.7, 1.2)], [0, .42, -5], 0, brick), tiledRoof("前接待办公横厅完整低灰瓦屋盖", 26, 10, 4.62, [0, -10]), tiledRoof("接待厅与牢屋之间真正开敞的中央窄雨廊", 3, 11, 3.42, [0, .5]), postSet("中央敞开雨廊由地面实际接承屋盖的双列木柱", [-4, 0, 5].flatMap(z => [[-1.5, z], [1.5, z]] as [number, number][]), 3), openingWall("后排牢屋正对雨廊的真实中央通门", 14, 3.4, holesAt([0], 2, 2.8), [0, .42, 6], 0, brick), openingWall("后排牢屋中央走道真正通向后场的出口", 14, 3.4, holesAt([0], 1.4, 2.6), [0, .42, 22], 0, brick), tiledRoof("双排牢房与中央走道完整封合的低瓦屋盖", 14, 16, 3.82, [0, 14]), box("接待厅内避开中轴通道的独立服务木柜", -2.5, 1.02, -8, 2.2, 1.2, .8, wood)];
  for (const s of [-1, 1]) p.push(openingWall("前厅两端真实透光的侧窗墙", 10, 4.2, holesAt([-2.5, 2.5], 1.6, 1.6, 1.3), [s * 13, .42, -10], 90, brick), openingWall("中央接待区两侧通往独立办公室的真门隔壁", 10, 4.2, holesAt([0], 1.2, 2.6), [s * 4, .42, -10], 90, plaster), openingWall("后排每间牢房实际透空的高位窄窗", 16, 3.4, holesAt([-6, -2, 2, 6], .8, .65, 2.4), [s * 7, .42, 14], 90, brick));
  for (const z of [10, 14, 18]) for (const s of [-1, 1]) p.push(box("相邻牢房之间真正由地面接到屋盖的实心隔壁", s * 4.25, 2.12, z, 5.5, 3.4, .3, brick));
  const bars: SolidBox[] = [];
  for (const s of [-1, 1]) for (const z of [8, 12, 16, 20]) {
    const x = s * 1.5;
    bars.push({ center: [x, 3.72, z], size: [.12, .2, 4] }, { center: [x, 2.12, z - 2], size: [.12, 3.4, .12] }, { center: [x, 2.12, z + 2], size: [.12, 3.4, .12] }, { center: [x, 2.02, z - .75], size: [.12, 3.2, .12] }, { center: [x, 2.995, z - 1.25], size: [.12, .15, 1] });
    for (const offset of [-.4, .1, .6, 1.1, 1.6]) bars.push({ center: [x, 2.02, z + offset], size: [.08, 3.2, .08] });
  }
  for (let start = 0; start < bars.length; start += 20) p.push(boxesMesh("双排牢房面向中央走道并实际让出门口的完整钢格栅", iron, bars.slice(start, start + 20)));
  return p;
}
