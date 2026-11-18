import { part, beam, type ModelPart } from "../assetModelParts";
import { base, box, cylinder, design, type ArchitecturePrototype } from "./structures";
import { stairFlight } from "./historicSpaceBatchSeven";
import { openingWall, holesAt, postSet } from "./periodPublicSpaceBatchOne";
import { slopePanel } from "./vernacularWorldBatchOne";
import { verticalPanel } from "./historicSpaceBatchNine";
import { boxesMesh, type SolidBox } from "./publicSpaceBatchEight";

const stone = "#b1aa94", wood = "#947853", wall = "#b5a98b", iron = "#646a60", roofColor = "#7d7d68";

// 原创前低后偏高的年代酒馆整楼；后客楼只由侧外阶进入，不复用分叉大阶U廊舞厅。
// 酒馆历史业态参考：https://www.nps.gov/klgo/learn/historyculture/mascot.htm
export const periodTownSpaceBatchFourDesigns: ArchitecturePrototype[] = [
  design("前低长吧侧外阶后客楼酒馆", "低前街柱廊接到单层长吧厅，右后窄高客楼的底层牌室与上层三客室分层，侧外直阶经端平台真门进入上层纵走廊；左后低厨房与露天后勤角院通过真实传餐孔、服务门和后门相接，三个屋跨各自完整承托闭合", roadsideSaloonLodging, "建筑", "欧式"),
];

function roadsideSaloonLodging(): ModelPart[] {
  const p: ModelPart[] = [base(28, 34), box("前柱廊、酒馆、后客楼及侧外阶共同的完整抬高石铺地坪", 0, .3, 0, 26, .24, 30, stone), openingWall("酒馆真正开通中央出入口及两侧营业窗的前板壁", 14, 4, [...holesAt([0], 2.4, 2.8), ...holesAt([-4.5, 4.5], 2.2, 2, 1.0)], [0, .42, -12], 0, wall), openingWall("长吧厅后方分别连到厨房和牌室并留真实传餐窗的分界壁", 14, 4, [...holesAt([-4, 4], 1.3, 2.6), ...holesAt([-.5], 1.8, 1.1, 1.1)], [0, .42, 2], 0, wall), openingWall("长吧后方整片侧壁上真实高于后柜的采光窗", 14, 4, holesAt([-4, 1.5, 5], 1.5, 1.1, 2.4), [-7, .42, -5], 90, wall), openingWall("长吧厅另一侧真正透光并接通街巷的侧门窗墙", 14, 4, [...holesAt([-3], 1.3, 2.6), ...holesAt([1.5, 5], 1.8, 2, 1)], [7, .42, -5], 90, wall), part("独立单层长吧厅由四面完整木壁接承的低双坡阁顶", "extrude", roofColor, [0, 4.62, -5], [1, 1, 1], [0, 0, 0], { depth: 14.2, profile: [{ x: -7.3, y: 0 }, { x: 0, y: 1.7 }, { x: 7.3, y: 0 }, { x: 7.3, y: -.2 }, { x: -7.3, y: -.2 }] }), verticalPanel("左后低厨房依斜屋面完整闭合而让出真出门和采光窗的后端壁", [[-4, 0], [4, 0], [4, 3.651], [-4, 3]], [...holesAt([-1.5], 1.1, 2.5), ...holesAt([1.2], 1.8, 1.3, 1.2)], .3, [-3, .42, 8], 0, wall), openingWall("厨房左侧真正透光且接承低斜盖的完整外壁", 6, 3, holesAt([0], 2, 1.3, 1.2), [-7, .42, 5], 90, wall), part("低厨房由左外壁与高客楼侧壁接承的完整单坡阁盖", "extrude", roofColor, [-3, 3.595, 5], [1, 1, 1], [0, 0, 0], { depth: 6.3, profile: [{ x: -4.3, y: 0 }, { x: 4.3, y: .7 }, { x: 4.3, y: .5 }, { x: -4.3, y: -.2 }] }), openingWall("后牌室左侧实际接通厨房并面向后勤角院的门窗壁", 10, 2.98, [...holesAt([2], 1.1, 2.5), ...holesAt([-3.3], 1.3, 1.3, 1.1)], [1, .42, 7], 90, wall), openingWall("后牌室右侧实际封合上楼面并透光的完整侧壁", 10, 2.98, holesAt([-3, 2], 1.6, 1.5, 1), [7, .42, 7], 90, wall), openingWall("后牌室真正接通后巷而与上层结构分开的后出口", 6, 2.98, holesAt([0], 1.3, 2.6), [4, .42, 12], 0, wall), box("后窄客楼由首层完整围壁接承而不伸进前吧厅的独立楼板", 4, 3.51, 7, 6, .22, 10, wood), box("后客楼上层面对前吧厅屋面而保持完整封合的无洞前壁", 4, 5.22, 2, 6, 3.2, .3, wall), openingWall("上层三客室沿低厨房及后勤角院一侧真实分列的采光窗墙", 10, 3.2, holesAt([-10 / 3, 0, 10 / 3], 1.4, 1.4, 1.2), [1, 3.62, 7], 90, wall), openingWall("上层侧走廊由外阶平台真正进入的侧门和独立采光窗", 10, 3.2, [...holesAt([-3.3], 1.1, 2.5), ...holesAt([0, 2.5], 1.3, 1.6, 1.1)], [7, 3.62, 7], 90, wall), openingWall("后客楼上层最末客室完整封合的真实后采光窗", 6, 3.2, holesAt([0], 1.6, 1.5, 1.1), [4, 3.62, 12], 0, wall), openingWall("上层纵向侧走廊分别通到三间完整客室的独立真房门", 10, 3.2, holesAt([-10 / 3, 0, 10 / 3], 1, 2.4), [5.2, 3.62, 7], 90, wall), part("窄后客楼由上层四周墙及客室隔壁接承的完整高双坡阁顶", "extrude", roofColor, [4, 7.02, 7], [1, 1, 1], [0, 0, 0], { depth: 10.4, profile: [{ x: -3.3, y: 0 }, { x: 0, y: 1.3 }, { x: 3.3, y: 0 }, { x: 3.3, y: -.2 }, { x: -3.3, y: -.2 }] }), slopePanel("前街柱廊从吧厅前壁连续落到外侧木柱横梁的完整低雨盖", [[-7.5, 3.3, -14.7], [7.5, 3.3, -14.7], [7.5, 3.85, -12], [-7.5, 3.85, -12]], .14, roofColor), { ...postSet("前街雨廊真正从石铺地坪接到檐梁及雨盖的四根独立木柱", [-6.8, -2.3, 2.3, 6.8].map(x => [x, -14.4]), 2.88, .42), color: wood }, box("四根前廊柱顶实际连续搭接的完整木承檐横梁", 0, 3.25, -14.4, 14.6, .16, .2, wood), stairFlight("街面实际登到酒馆整体前廊台面的两级宽石阶", 2, 4, .24, .3, 0, [0, .18, -15.6], -90), box("前吧厅长柜从完整地坪起立的独立承柜实体", -5, .96, -5, .75, 1.08, 9, wood), box("独立长吧柜上真实连续搭接的宽薄柜面", -5, 1.55, -5, 1.1, .1, 9.2, wood), box("长吧后柜真正落地接到陈列层板的薄木背板", -6.75, 1.8, -5, .12, 2.76, 8.8, wood), box("厨房传餐窗下由厨房地面实际承接的低工作柜", -.5, .94, 2.12, 2, 1.04, .75, wood), box("传餐窗下工作柜与窗槛真正搭接的宽贯墙柜面", -.5, 1.51, 2.05, 2.1, .1, 1, wood), box("厨房低外壁前独立落地且让开门道的连续备餐柜", -3.5, .92, 6.6, 4.8, 1, 1.0, wood), { ...stairFlight("客楼外侧沿街巷独立直上端平台的完整木外阶", 20, 1.4, 3.2, .4, 0, [8.4, .42, 1], -90, true), color: wood }, box("侧外阶高端实际接到上层真门及楼板的完整木平台", 8.1, 3.51, 10.3, 2.2, .22, 2.6, wood), { ...postSet("上楼端平台最外侧真正由院地接到平台底面的两根完整木柱", [[9, 9.2], [9, 11.4]], 2.98, .42), color: wood }, box("上楼端平台内侧实际嵌入客楼外壁的完整承平台边梁", 7, 3.29, 10.3, .2, .22, 2.6, wood), box("上楼端平台临空外缘由木平台实际承接的完整护栏", 9.2, 4.12, 10.3, .1, 1, 2.6, wood), box("上楼端平台后缘实际让开上层真门的完整木护栏", 8.1, 4.12, 11.6, 2.2, 1, .1, wood), box("上楼端平台前缘让开外阶入口的内侧短木护栏", 7.35, 4.12, 9, .7, 1, .1, wood), box("上楼端平台前缘实际连接末端外阶扶手与外缘木栏的短角栏", 9.15, 4.12, 9, .1, 1, .1, wood)];
  for (const z of [2 + 10 / 3, 2 + 20 / 3]) p.push(box("三个上层客室之间真正由楼板接到高阁顶的完整隔壁", 3.1, 5.22, z, 4.2, 3.2, .22, wall));
  for (const y of [1, 1.8, 2.6]) p.push(box("长吧后柜各层板真实嵌入木背且留出陈列空腔的窄托板", -6.55, y, -5, .5, .08, 8.8, wood));
  const stairPosts: SolidBox[] = [];
  for (const x of [7.7, 9.1]) {
    p.push(beam("侧外木阶两侧真正随踏面连续升高并接到高平台的斜扶手", wood, [x, 1.42, 1], [x, 4.62, 9], .065));
    for (const t of [0, .5, 1]) stairPosts.push({ center: [x, .92 + 3.2 * t, 1 + 8 * t], size: [.075, 1, .075] });
  }
  p.push(boxesMesh("侧外木阶斜扶手下真实内嵌踏面和平台边的六根竖木杆", wood, stairPosts));
  for (const side of [-1, 1]) {
    const leaf = box("前廊入口两侧向外开启并保留上下空气通道的独立半高木摆门", side * .850268, 1.45, -12.492342, 1.08, 1.2, .07, wood); leaf.rotation.y = side * -55; p.push(leaf);
    for (const y of [1, 1.9]) p.push(cylinder("半高木摆门和前入口真门框共同接承的独立短竖铰轴", side * 1.16, y, -12.05, .12, .16, iron));
  }
  return p;
}
