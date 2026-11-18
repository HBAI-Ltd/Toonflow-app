import { part, beam, type ModelPart } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { base, box, cylinder, design, type ArchitecturePrototype } from "./structures";
import { stairFlight } from "./historicSpaceBatchSeven";
import { openingWall, holesAt } from "./periodPublicSpaceBatchOne";
import { boxesMesh, type SolidBox } from "./publicSpaceBatchEight";

const stone = "#b5ad98", brick = "#ae9178", plaster = "#c6bca6", wood = "#927654", iron = "#62695f", roofColor = "#7e7d6a";

// 原创县法院整楼：下层押室与上层单庭垂直分置，前公众阶和后受控阶各有真实楼板井。
// 历史上的下押上庭类型参考：https://mostateparks.com/sites/mostateparks/files/Ralls%20Co.%20Courthouse%20and%20Jail-Sheriff%27s%20House.pdf
export const periodTownSpaceBatchFiveDesigns: ArchitecturePrototype[] = [
  design("下押上庭前民阶后押阶县法院", "下层三间押室与前值房由独立受控廊连接，上层单庭设公众前室和后侧受控前室，前公众内阶及后押解内阶分别通过两个楼板真井；上层旁听门、审判席后门与庭侧门均真实接通，各层完整围壁与内隔壁共同接承楼面和屋盖", twoLevelCountyCourthouse, "建筑", "欧式"),
];

function twoLevelCountyCourthouse(): ModelPart[] {
  const stairHoles: [number, number][][] = [[[-6.35, -10.2], [-4.65, -10.2], [-4.65, -4.1], [-6.35, -4.1]], [[5.65, 3.5], [7.35, 3.5], [7.35, 9.6], [5.65, 9.6]]];
  const p: ModelPart[] = [base(24, 30), box("两层县法院全部公共与受控空间共用的完整抬高石地坪", 0, .3, 0, 22, .24, 28, stone), polygon("上层单审判庭与四周工作前室共同的完整木楼板并留两条独立真阶井", wood, [[-8, -11], [8, -11], [8, 11], [-8, 11]], .25, [0, 3.62, 0], stairHoles), openingWall("首层前公众登阶门与值房独立入口真正分开的完整前砖壁", 16, 3.2, [...holesAt([-5.5], 1.5, 2.7), ...holesAt([3.5], 1.3, 2.6), ...holesAt([0], 1.8, 1.4, 1.1)], [0, .42, -11], 0, brick), openingWall("首层受控后门与押室高位窄窗真正开通的完整后砖壁", 16, 3.2, [...holesAt([6.5], 1.2, 2.6), ...holesAt([-5, -1], .8, .7, 2)], [0, .42, 11], 0, brick), openingWall("下层公众阶前室与三间押室分别透光的连续左砖壁", 22, 3.2, [...holesAt([8], 1.2, 1.4, 1.1), ...holesAt([2 / 3, -4, -26 / 3], .8, .65, 1.9)], [-8, .42, 0], 90, brick), openingWall("下层前值房与后受控阶分别透光的完整右砖壁", 22, 3.2, [...holesAt([7], 1.6, 1.4, 1.1), ...holesAt([-4.5, -8.5], .9, .6, 2)], [8, .42, 0], 90, brick), openingWall("上层公众前室沿街面真正分列的完整高采光窗墙", 16, 4.2, holesAt([-5.5, 0, 5.5], 1.8, 2.4, 1.2), [0, 3.87, -11], 0, brick), openingWall("上层后工作前室完整封合且实际透光的高窗后壁", 16, 4.2, holesAt([-4.5, 1], 2.1, 2.4, 1.2), [0, 3.87, 11], 0, brick), openingWall("上层公众侧廊外侧有真实采光孔的完整左外壁", 22, 4.2, holesAt([-7, 0, 7], 1.8, 2.2, 1.2), [-8, 3.87, 0], 90, brick), openingWall("上层受控侧廊外侧有真实采光孔的完整右外壁", 22, 4.2, holesAt([-7, 0, 7], 1.8, 2.2, 1.2), [8, 3.87, 0], 90, brick), part("上层单庭及四周完整前室由外内承壁共同接承的完整双坡阁顶", "extrude", roofColor, [0, 8.27, 0], [1, 1, 1], [0, 0, 0], { depth: 22.6, profile: [{ x: -8.3, y: 0 }, { x: 0, y: 1.8 }, { x: 8.3, y: 0 }, { x: 8.3, y: -.2 }, { x: -8.3, y: -.2 }] }), openingWall("前公众登阶前室与值房之间保留真门的完整分流隔壁", 8, 3.2, holesAt([1.5], 1.2, 2.5), [-2.5, .42, -7], 90, plaster), openingWall("前值房通往后受控廊的真实独立职员门", 10.5, 3.2, holesAt([2.75], 1.2, 2.5), [2.75, .42, -3], 0, plaster), box("前公众阶前室背后与押室之间真正闭合的完整厚壁", -5.25, 2.02, -3, 5.5, 3.2, .25, plaster), openingWall("三间押室面向受控廊的真实独立窄格栅门洞", 14, 3.2, holesAt([-14 / 3, 0, 14 / 3], 1.2, 2.5), [1, .42, 4], 90, brick), stairFlight("前公众内阶独立由公众前门连续登到上层侧前室", 20, 1.4, 3.45, .3, 0, [-5.5, .42, -10.1], -90), stairFlight("后受控内阶由独立后门反向登到庭后侧工作前室", 20, 1.4, 3.45, .3, 0, [6.5, .42, 9.5], 90), openingWall("上层单庭前面接通公众前室的真实旁听入口", 7.8, 4.2, holesAt([0], 1.5, 2.8), [.1, 3.87, -6.5], 0, plaster), openingWall("上层单庭后面让开审判台后通路的真实工作门", 7.8, 4.2, holesAt([2.5], 1.2, 2.8), [.1, 3.87, 5.5], 0, plaster), openingWall("上层公众侧前室真正接入单庭而不穿受控后阶的侧门", 12, 4.2, holesAt([2.8], 1.4, 2.8), [-3.8, 3.87, -.5], 90, plaster), openingWall("上层后阶工作前室实际接到庭内侧候审位置的独立门", 12, 4.2, holesAt([-2], 1.2, 2.7), [4, 3.87, -.5], 90, plaster), box("单审判庭后部真正落在楼板上且保留台后通路的高审判石台", .2, 4.17, 3.55, 6, .6, 1.9, stone), stairFlight("单庭内实际登上高审判台并让出台后工作门的独立短宽阶", 3, 1.5, .6, .3, 0, [-1.6, 3.87, 1.7], -90), box("高审判石台上真正落地的连续长木审判案", .4, 4.92, 3.7, 4.8, .9, .8, wood), box("前值房中真正独立落地且避开门道的木案柜", 3.7, .92, -7.5, 3, 1, 1.1, wood), box("值房案柜上实际搭接的薄木写字台面", 3.7, 1.47, -7.5, 3.2, .1, 1.3, wood)];
  for (const z of [5 / 3, 19 / 3]) p.push(box("首层相邻押室之间从地坪完整接到上层楼板底的厚隔壁", -3.5, 2.02, z, 9, 3.2, .25, brick));
  const gateBars: SolidBox[] = [], beds: SolidBox[] = [], seats: SolidBox[] = [], stairPosts: SolidBox[] = [];
  for (const z of [-2 / 3, 4, 26 / 3]) {
    gateBars.push({ center: [1, .49, z], size: [.075, .07, 1.2] }, { center: [1, 2.92, z], size: [.075, .07, 1.2] }, { center: [1, 1.705, z], size: [.075, .075, 1.2] });
    for (const offset of [-.565, .565]) gateBars.push({ center: [1, 1.705, z + offset], size: [.075, 2.5, .07] });
    for (const offset of [-.4, -.2, 0, .2, .4]) gateBars.push({ center: [1, 1.705, z + offset], size: [.035, 2.36, .035] });
    for (const y of [.8, 2.6]) p.push(cylinder("每间独立格栅门和真实石门框共用的短竖铰轴", 1, y, z - .6, .1, .18, iron));
    beds.push({ center: [-5.8, .8, z], size: [1.9, .08, .8] }, { center: [-5.8, .875, z], size: [1.8, .07, .74] });
    for (const x of [-6.6, -5]) for (const dz of [-.3, .3]) beds.push({ center: [x, .59, z + dz], size: [.08, .34, .08] });
  }
  for (let start = 0; start < gateBars.length; start += 20) p.push(boxesMesh("首层三间押室有真实内外空隙和完整门框的静态闭合铁格栅门", iron, gateBars.slice(start, start + 20)));
  p.push(boxesMesh("三间押室内单独落地而不悬空的窄木铺承架和薄铺垫", wood, beds));
  for (const z of [-4.4, -3.2, -2, -.8]) {
    seats.push({ center: [.1, 4.38, z], size: [5.6, .1, .6] }, { center: [.1, 4.705, z - .25], size: [5.6, .65, .08] });
    for (const x of [-2, 2.2]) seats.push({ center: [x, 4.1, z], size: [.14, .46, .55] });
  }
  p.push(boxesMesh("上层旁听区四排真实座面靠背及各自落在楼板上的木承脚", wood, seats));
  for (const x of [-1.75, 1.95]) p.push(box("上层旁听区前缘让出中央通行缺口的两段完整木隔栏", x, 4.32, .25, 2.3, .9, .1, wood));
  for (const [x, a, b] of [[-5.5, -10.1, -4.1], [6.5, 9.5, 3.5]]) {
    for (const side of [-1, 1]) {
      const railX = x! + side * .7;
      p.push(beam("前后独立内阶两侧从低端连续接到各自上层落地口的木扶手", wood, [railX, 1.42, a!], [railX, 4.87, b!], .065));
      for (const t of [0, .5, 1]) stairPosts.push({ center: [railX, .92 + 3.45 * t, a! + (b! - a!) * t], size: [.075, 1, .075] });
    }
    for (const side of [-1, 1]) p.push(box("上层各自真实阶井侧边从楼面起立且保持高端出口开放的完整木护栏", x! + side * .85, 4.37, (a! + b!) / 2, .08, 1, 6.1, wood));
    p.push(box("上层各独立阶井低端真正接在楼板上且不阻断高端出口的短木护栏", x!, 4.37, a! + (a! < b! ? -.1 : .1), 1.7, 1, .08, wood));
  }
  p.push(boxesMesh("前公众阶和后受控阶斜扶手下真实嵌入踏面的全部竖木杆", wood, stairPosts));
  return p;
}
