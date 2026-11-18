import { part, beam, ring, type ModelPart, type Triple } from "../assetModelParts";
import { combineMeshes } from "../natureParts";
import { polygon } from "../masterNature/shared";
import { box, cylinder, design, arch } from "./structures";
import { halfRoundWall, rectangularFlue } from "./spatialShells";
import { doorWall, gableCover, slopePanel } from "./vernacularWorldBatchOne";
import { endGable, ladder } from "./vernacularWorldBatchTwo";
import { hardWall, solidBox } from "./vernacularWorldBatchThree";

const wood = "#937452", stone = "#a7a696", metal = "#74888a", earth = "#aa9677", slate = "#727d75", water = "#779a99";

// https://npgallery.nps.gov/NRHP/GetAsset/NRHP/64000152_text
// https://home.nps.gov/slbe/planyourvisit/farmbuildings.htm
// https://home.nps.gov/hamp/learn/historyculture/farm-support-structures.htm
// https://heritagerecords.nationaltrust.org.uk/HBSMR/MonRecord.aspx?uid=MNA131194
export const vernacularWorldBatchFourDesigns = [
  design("中心筒仓环厩双坡圆谷仓", "圆形大谷仓围绕贯通中央青贮筒仓布置下层放射畜位和喂饲环道，上层环形草阁由径向梁承住，前土坡接入上层大门", roundDairyBarn, "建筑", "欧式"),
  design("双排横杆大檐晒草架", "两列通高柱间的密排水平杆可两面挂草，高处横系梁和侧斜撑托住连续大檐屋顶与内部贮草阁，底部整列通风通行", doubleHayrack, "建筑", "欧式"),
  design("长栈桥绞提方网捕鱼屋", "长坡栈桥接高桩渔屋，屋外侧支座承起带配重的斜吊臂，钢绳经高点连接四角拱杆和疏孔方网", fishingLiftCabin, "建筑", "欧式"),
  design("高排汽脊多盘枫糖棚", "狭长糖棚屋脊敞开为连续排汽监顶，内部长火道托起三个敞口蒸发盘，高汁罐经下降管接入盘，低地炉口与后烟道分开排汽排烟", mapleSugarHouse, "建筑", "欧式"),
  design("贯流冷泉围槽乳品石屋", "低石屋中央干作业台被U形低水槽环绕，泉水由后墙低孔进入再从侧墙流出，贮奶陶罐放在槽内", dairySpringhouse, "建筑", "欧式"),
  design("内院四翼连拱马厩", "四翼单层厩舍围成开敞大院，外大门通向连续内院拱廊，马位分隔靠外墙布置并由院廊服务，四角屋面按回字坡脊真正闭合", courtyardStables, "建筑", "欧式"),
];

function wedge(name: string, inner: number, outer: number, a: number, b: number, bottom: number, top: number, color: string): ModelPart {
  return slopePanel(name, [[Math.cos(a) * inner, top, Math.sin(a) * inner], [Math.cos(a) * outer, top, Math.sin(a) * outer], [Math.cos(b) * outer, top, Math.sin(b) * outer], [Math.cos(b) * inner, top, Math.sin(b) * inner]], top - bottom, color);
}

function roundDairyBarn(): ModelPart[] {
  const p: ModelPart[] = [cylinder("圆形大畜仓完整耐磨地坪", 0, .1, 0, 22.6, .2, stone), ring("圆仓中心真正贯通的青贮高筒", "#a29b85", 1.85, .22, 6.1, 11.8), ring("围绕中心筒仓的上层贮草木阁板", wood, 10.8, 8.8, 3.7, .2)];
  for (let batch = 0; batch < 4; batch++) {
    const pieces: ModelPart[] = [];
    for (let bay = batch * 4; bay < (batch + 1) * 4; bay++) {
      const start = (bay - .5) * Math.PI / 8, end = (bay + .5) * Math.PI / 8, a = start + Math.PI / 32, b = end - Math.PI / 32;
      pieces.push(wedge("圆仓下层窗口之间的厚壁柱", 10.6, 11, start, a, .2, 3.8, wood), wedge("圆仓下层窗口之间的厚壁柱", 10.6, 11, b, end, .2, 3.8, wood));
      if (bay !== 0) pieces.push(wedge("下层真实窗孔下的墙槛", 10.6, 11, a, b, .2, 1.2, wood));
      pieces.push(wedge("下层门窗上方承住草阁的墙楣", 10.6, 11, a, b, bay === 0 ? 3.05 : 2.4, 3.8, wood));
    }
    p.push(combineMeshes("圆仓下层整圈真实门窗厚木墙", wood, pieces));
  }
  p.push(halfRoundWall("上层贮草仓壁避开土坡大门", 11, .4, 2.8, [0, 3.8, 0], 84, wood, Math.PI * 348 / 180));
  for (const side of [-1, 1]) p.push(box("草阁大门两侧木门梃", side * 1.12, 5.05, -10.8, .16, 2.5, .45, wood));
  for (let band = 0; band < 2; band++) for (let batch = 0; batch < 2; batch++) {
    const pieces: ModelPart[] = [], r0 = band ? 7.9 : 11.5, r1 = band ? 1.25 : 7.9, y0 = band ? 10.7 : 6.1, y1 = band ? 12.65 : 10.7;
    for (let i = batch * 8; i < (batch + 1) * 8; i++) { const a = i * Math.PI / 8, b = (i + 1) * Math.PI / 8; pieces.push(slopePanel("圆谷仓清晰折坡的独立木片屋面", [[Math.cos(a) * r0, y0, Math.sin(a) * r0], [Math.cos(b) * r0, y0, Math.sin(b) * r0], [Math.cos(b) * r1, y1, Math.sin(b) * r1], [Math.cos(a) * r1, y1, Math.sin(a) * r1]], .14, slate)); }
    p.push(combineMeshes("环形大屋盖完整双折坡", slate, pieces));
  }
  for (let i = 0; i < 12; i++) {
    const a = i * Math.PI / 6;
    p.push(cylinder("草阁径向梁下的独立环列承柱", Math.cos(a) * 6, 1.86, Math.sin(a) * 6, .2, 3.32, wood), beam("由中央筒仓通向外壁的木阁径梁", wood, [Math.cos(a) * 1.8, 3.55, Math.sin(a) * 1.8], [Math.cos(a) * 10.7, 3.55, Math.sin(a) * 10.7], .18));
    if (i !== 0) p.push(part("下层围绕饲道布置的放射畜位隔栏", "box", wood, [Math.cos(a) * 8.3, .95, Math.sin(a) * 8.3], [3.6, 1.5, .08], [0, -i * 30, 0]));
  }
  p.push(halfRoundWall("环形饲草槽底在正门通路处真正断开", 6.3, .45, .16, [0, .2, 0], -10, wood, Math.PI * 340 / 180), halfRoundWall("饲草槽外沿竖板", 6.3, .08, .55, [0, .32, 0], -10, wood, Math.PI * 340 / 180), halfRoundWall("饲草槽内沿竖板", 5.93, .08, .55, [0, .32, 0], -10, wood, Math.PI * 340 / 180), part("填实到上层草阁门口的楔形土坡", "extrude", earth, [0, 0, -19], [1, 1, 1], [0, -90, 0], { depth: 3.1, profile: [{ x: 0, y: 0 }, { x: 7.9, y: 0 }, { x: 7.9, y: 3.8 }, { x: 0, y: .05 }] }), box("土坡顶端实际接入木阁门口的短平桥", 0, 3.73, -10.95, 3, .14, .7, wood), ring("筒仓顶缘实际托住高屋面的木承圈", wood, 1.93, .25, 12.18, .36), ...ladder("中央筒仓外通到装料口的长木梯", -2.2, 3.8, -.8, 12.1, .3, 20));
  for (const side of [-1, 1]) for (const end of [-1, 1]) p.push(box("顶心通风帽四根透空支柱", side * .72, 12.96, end * .72, .1, .65, .1, wood));
  p.push(part("顶心敞口通风帽的封闭锥形小屋顶", "cone", slate, [0, 13.6, 0], [2.6, .9, 2.6]));
  return p;
}

// https://www.culture.si/en/Rogatec_Open_Air_Museum
function doubleHayrack(): ModelPart[] {
  const p: ModelPart[] = [box("晒草大架全部柱脚下的石垫基", 0, .08, 0, 7, .16, 19, stone), ...gableCover("双排高晒架连续大檐屋盖", 7.8, 19, 6.21, 1.5, slate), box("两排高晒杆之间的实际贮草阁板", 0, 3.5, 0, 5.75, .18, 17, wood)];
  for (const side of [-1, 1]) {
    for (const z of [-8, -4, 0, 4, 8]) p.push(box("双排晒草架的通高厚木柱", side * 2.8, 3.32, z, .25, 6.32, .25, wood));
    for (let batch = 0; batch < 2; batch++) {
      const bars: ModelPart[] = [];
      for (let bay = batch * 2; bay < (batch + 1) * 2; bay++) for (let row = 0; row < 8; row++) bars.push(solidBox("柱间全部保留间隔的水平挂草木杆", side * 2.8, .8 + row * .55, -6 + bay * 4, .075, .075, 3.8, wood));
      p.push(combineMeshes("一侧两开间完整挂草杆列", wood, bars));
    }
    for (const z of [-8, -4, 0, 4]) p.push(beam("通高柱列侧边真实交接的斜向抗摇撑", wood, [side * 2.8, 4.7, z], [side * 2.8, 6.35, z + 2.2], .12));
  }
  for (const z of [-8, -4, 0, 4, 8]) p.push(box("高柱之间承屋的全宽横系梁", 0, 6.4, z, 5.9, .22, .22, wood), box("内部贮草阁板下的完整横托梁", 0, 3.33, z, 5.9, .18, .18, wood), ...[-1, 1].map(side => beam("横系梁到高脊的实际斜椽", wood, [side * 2.8, 6.45, z], [0, 7.55, z], .15)));
  p.push(...ladder("前端通到贮草阁板的木梯", 0, .16, -10.2, 4.2, -7.5, 10));
  return p;
}

// https://www.culture.gouv.fr/fr/Media/Thematiques/Patrimoine-culturel-immateriel/Files/Fiches-inventaire-du-PCI/la-peche-au-carrelet-sur-l-arc-atlantique.pdf
function fishingLiftCabin(): ModelPart[] {
  const p: ModelPart[] = [box("高桩渔屋的可通行木平台", 0, 3.45, 4.4, 5.5, .18, 5.3, wood), ...gableCover("高桩小屋独立木板屋盖", 6, 5, 5.78, 1.2, slate, 0, 4.2), ...doorWall("渔屋面向栈桥的真入口", 0, 2, 5, 2.3, .13, 1.05, 2, wood, 3.54), box("高桩渔屋后围墙", 0, 4.69, 6.4, 5, 2.3, .13, wood), ...[-1, 1].map(side => box("高桩渔屋左右围壁", side * 2.45, 4.69, 4.2, .13, 2.3, 4.4, wood)), ...[-1, 1].map(end => endGable(0, 4.2 + end * 2.2, 5, 5.84, 1, wood))];
  for (const side of [-1, 1]) for (const z of [2.2, 6.5]) p.push(cylinder("高桩平台直接插到地面的承重木桩", side * 2.3, 1.7, z, .24, 3.4, wood));
  const rise = 3.25, run = 14, angle = -Math.atan2(rise, run) * 180 / Math.PI;
  p.push(part("由岸边连续上升到渔屋的长木栈桥面", "box", wood, [0, 1.825, -5.2], [1.8, .14, Math.hypot(rise, run)], [angle, 0, 0]));
  for (const z of [-10, -5, 0]) {
    const y = .2 + (z + 12.2) / run * rise;
    for (const side of [-1, 1]) p.push(cylinder("坡栈桥下按实际桥高接到地面的独立木桩", side * .72, y / 2, z, .16, y, wood), box("坡栈桥扶栏与桥面相接的短木柱", side * .88, y + .5, z, .07, 1, .07, wood));
  }
  for (const side of [-1, 1]) p.push(beam("顺着坡度接到渔屋入口的连续栈桥扶手", wood, [side * .88, 1.2, -12.2], [side * .88, 4.45, 1.8], .065));
  p.push(beam("平台侧面托出绞网主桅的水平座梁", wood, [2.3, 3.45, 5.8], [3.1, 3.45, 5.8], .2), beam("侧座梁下接回平台桩的三角斜托", wood, [2.3, 2.6, 5.8], [3.1, 3.45, 5.8], .15), cylinder("渔屋外侧不穿屋盖的独立钢主桅", 3.1, 5.93, 5.8, .16, 4.96, metal), beam("越过水面的斜向方网起吊长臂", metal, [3.1, 8.4, 5.8], [0, 7.5, 11.5], .14), beam("同桅向后伸出的平衡短臂", metal, [3.1, 8.4, 5.8], [4.6, 8.8, 3.1], .14), box("与后短臂实际连着的悬挂平衡重", 4.6, 8.3, 3.1, .7, 1, .7, stone), cylinder("平台手摇卷缆绞盘", 2.75, 4.15, 5.8, .5, .55, metal, [90, 0, 0]), beam("将卷缆绞盘接到主桅下部的实支架", metal, [2.75, 3.5, 5.8], [2.75, 4.15, 5.8], .1));
  p.push(part("经主桅高点和吊臂端部连接方网中心的起吊缆", "tube", "#59696a", [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: .025, path: [{ x: 2.75, y: 4.15, z: 5.8 }, { x: 3.1, y: 8.4, z: 5.8 }, { x: 0, y: 7.5, z: 11.5 }, { x: 0, y: 4.45, z: 11.5 }] }));
  for (const axis of [0, 1]) p.push(part("交叉弯成方网四角的完整支网拱杆", "tube", wood, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: .04, path: [{ x: -2.6, y: 1.2, z: 11.5 + (axis ? 2.6 : -2.6) }, { x: -1.7, y: 3.3, z: 11.5 + (axis ? 1.7 : -1.7) }, { x: 0, y: 4.45, z: 11.5 }, { x: 1.7, y: 3.3, z: 11.5 + (axis ? -1.7 : 1.7) }, { x: 2.6, y: 1.2, z: 11.5 + (axis ? -2.6 : 2.6) }] }));
  for (let i = 0; i <= 7; i++) for (const axis of [0, 1]) {
    const t = -2.6 + i * 5.2 / 7;
    p.push(part("保留真实孔隙且中心微垂的方网绳", "tube", "#78857a", [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: .009, path: [-2.6, 0, 2.6].map(s => ({ x: axis ? t : s, y: 1.2 - .25 * (1 - Math.abs(s) / 2.6) * (1 - Math.abs(t) / 2.6), z: 11.5 + (axis ? s : t) })) }));
  }
  return p;
}

function mapleSugarHouse(): ModelPart[] {
  const p: ModelPart[] = [box("糖棚火炉与行走通道共用石地坪", 0, .1, 0, 7.4, .2, 14.6, stone), ...doorWall("枫糖棚前部装柴与人员入口", 0, -7, 7, 3.2, .16, 1.65, 2.7, wood, .2), box("糖棚后端完整木壁", 0, 1.8, 7, 7, 3.2, .16, wood)];
  for (const side of [-1, 1]) p.push(box("糖棚左右连续木围壁", side * 3.4, 1.8, 0, .16, 3.2, 14, wood), slopePanel("顶部排汽开缝以外的糖棚大坡面", [[side * 4, 3.22, -7.5], [side * .8, 4.92, -7.5], [side * .8, 4.92, 7.5], [side * 4, 3.22, 7.5]], .14, slate), box("监顶木立柱下方连续承托长枋", side * .75, 4.75, 0, .4, .14, 14.5, wood));
  p.push(...gableCover("升高且两侧敞开的连续排汽监顶盖", 2.4, 15.1, 5.05, .7, slate));
  for (const z of [-6.5, -2.2, 2.2, 6.5]) for (const side of [-1, 1]) p.push(box("托起排汽监顶并留下侧面风口的木支柱", side * .65, 4.96, z, .1, .52, .1, wood));
  for (const end of [-1, 1]) p.push(part("糖棚端面收至监顶下方的木山墙", "extrude", wood, [0, 0, end * 7], [1, 1, 1], [0, 0, 0], { depth: .1, profile: [{ x: -3.5, y: 3.4 }, { x: 3.5, y: 3.4 }, { x: .8, y: 4.92 }, { x: -.8, y: 4.92 }] }));
  for (const side of [-1, 1]) p.push(box("长火道两侧连续耐火砖墙", side * .94, .85, 0, .24, 1.3, 7.6, "#a78d75"), box("地炉口两侧承压砖墩", side * .66, .78, -3.8, .42, 1.16, .3, "#a78d75"));
  p.push(box("长火道后封砖墙", 0, .85, 3.8, 2.1, 1.3, .28, "#a78d75"), box("开放加柴炉口上方的砖楣", 0, 1.33, -3.8, 2.1, .25, .3, "#a78d75"));
  for (const z of [-2.4, 0, 2.4]) p.push(box("敞口蒸发盘的真实金属底", 0, 1.52, z, 1.75, .05, 2.25, metal), rectangularFlue("盘底上竖起且上口贯通的四片金属盘壁", 1.8, 2.3, .23, .035, [0, 1.52, z], metal), box("保留在敞口盘内的静态枫汁液面", 0, 1.64, z, 1.71, .018, 2.2, "#a9936b"));
  p.push(cylinder("高位待煮枫汁暂存罐", 2.2, 2.7, 4.8, 1.5, 1.6, metal), rectangularFlue("火道后侧独立的空心排烟高筒", .48, .48, 5.5, .08, [-2.4, .2, 5], "#8c8575"), part("汁罐向蒸发盘下降的进料管", "tube", metal, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: .045, path: [{ x: 1.5, y: 2.1, z: 4.8 }, { x: .8, y: 1.95, z: 4.8 }, { x: .65, y: 1.82, z: 3 }, { x: .2, y: 1.72, z: 3 }] }), part("长火道后方转接高烟筒的实际烟气管", "tube", "#8c8575", [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: .16, path: [{ x: 0, y: .9, z: 3.8 }, { x: 0, y: .9, z: 5 }, { x: -2.4, y: .9, z: 5 }] }));
  for (const x of [1.7, 2.7]) for (const z of [4.3, 5.3]) p.push(box("暂存汁罐下实际接到地坪的支脚", x, 1.05, z, .12, 1.7, .12, metal));
  return p;
}

function dairySpringhouse(): ModelPart[] {
  const p: ModelPart[] = [box("冷泉乳屋完整石地坪", 0, .12, 0, 7, .24, 9, stone), box("水槽环绕的抬高干作业石台", 0, .45, -.2, 4.3, .42, 6.6, stone), ...doorWall("冷泉石屋的低人员入口", 0, -4.15, 6.5, 2.7, .45, 1.15, 2.1, stone, .24), box("冷泉屋左侧完整厚墙", -3.2, 1.59, 0, .45, 2.7, 8.3, stone), hardWall("后墙为泉水留出真正贯通进水孔", 6.5, 2.7, .45, [0, .24, 4.375], [[[-2.83, .12], [-2.37, .12], [-2.37, .56], [-2.83, .56]]], stone), hardWall("右墙为低水槽留出真正贯通出水孔", 8.3, 2.7, .45, [2.975, .24, 0], [[[2.12, .12], [2.68, .12], [2.68, .56], [2.12, .56]]], stone, 90), ...gableCover("长檐遮蔽冷泉乳屋的低石片屋盖", 7.8, 9.7, 2.86, 1.3, slate), ...[-1, 1].map(end => endGable(0, end * 4.15, 6.5, 2.94, 1.06, stone))];
  for (const side of [-1, 1]) p.push(box("两侧冷泉水槽底", side * 2.55, .285, 0, .8, .09, 6.9, stone));
  p.push(box("左侧冷泉水槽完整外低壁", -2.98, .47, 0, .1, .38, 6.9, stone));
  for (const [a, b] of [[-3.45, 2.075], [2.725, 3.45]]) p.push(box("右侧水槽外壁在出水处真正断开", 2.98, .47, (a! + b!) / 2, .1, .38, b! - a!, stone));
  for (const [a, b] of [[-2.95, -2.83], [-2.37, 2.95]]) p.push(box("后槽低石边在进水处真正断开", (a! + b!) / 2, .47, 3.93, b! - a!, .38, .1, stone));
  p.push(box("后部连通左右水槽的横槽底", 0, .285, 3.5, 5.9, .09, .8, stone), box("后墙外引入泉水的窄石槽底", -2.6, .285, 4.85, .65, .09, 1.9, stone), box("穿过侧墙出水孔的石槽底", 3.7, .285, 2.4, 2.3, .09, .65, stone));
  for (const side of [-1, 1]) p.push(box("室外进水槽两侧连续挡水石", -2.6 + side * .325, .47, 4.85, .1, .38, 1.9, stone), box("室外出水槽两侧连续挡水石", 3.7, .47, 2.4 + side * .325, 2.3, .38, .1, stone));
  const surface = polygon("由外进水槽连贯绕过作业台再接到出水槽的单一水面", water, [[-2.9, -3.35], [-2.9, 3.85], [-2.8, 3.85], [-2.8, 5.8], [-2.4, 5.8], [-2.4, 3.85], [2.9, 3.85], [2.9, 2.6], [4.85, 2.6], [4.85, 2.2], [2.9, 2.2], [2.9, -3.35], [2.2, -3.35], [2.2, 3.15], [-2.2, 3.15], [-2.2, -3.35]], .025, [0, .4775, 0]);
  surface.vertices = surface.indices!.map(index => ({ ...surface.vertices![index]! })); surface.indices = surface.vertices.map((_, index) => index); p.push(surface);
  for (const z of [-1.5, 1.5]) p.push(part("底部落在冷水槽内的真实开口贮奶陶罐", "lathe", "#c0b5a0", [-2.55, .33, z], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: .2, y: 0 }, { x: .24, y: .3 }, { x: .18, y: .52 }, { x: .18, y: .57 }, { x: .15, y: .57 }, { x: .15, y: .51 }, { x: .21, y: .29 }, { x: .17, y: .035 }, { x: 0, y: .035 }] }));
  return p;
}

function courtyardStables(): ModelPart[] {
  const p: ModelPart[] = [box("四翼马厩与中央训练院共同石地坪", 0, .1, 0, 34.6, .2, 38.6, stone), box("四翼马厩后外围厚墙", 0, 2.2, 18.7, 33.4, 4, .55, stone), ...doorWall("正面通往内院的宽车马入口", 0, -18.7, 33.4, 4, .55, 4, 3.6, stone, .2), ...[-1, 1].map(side => box("四翼马厩左右外围厚墙", side * 16.7, 2.2, 0, .55, 4, 37.4, stone))];
  const outer: Triple[] = [[-17, 4.3, -19], [17, 4.3, -19], [17, 4.3, 19], [-17, 4.3, 19]], ridge: Triple[] = [[-13.5, 6.2, -15.5], [13.5, 6.2, -15.5], [13.5, 6.2, 15.5], [-13.5, 6.2, 15.5]], inner: Triple[] = [[-10, 4.3, -12], [10, 4.3, -12], [10, 4.3, 12], [-10, 4.3, 12]];
  for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; p.push(slopePanel("回字屋盖向外排雨的连续长坡", [outer[i]!, outer[j]!, ridge[j]!, ridge[i]!], .16, slate), slopePanel("回字屋盖向开敞内院排雨的连续长坡", [ridge[i]!, ridge[j]!, inner[j]!, inner[i]!], .16, slate)); }
  for (const end of [-1, 1]) {
    for (let i = 0; i < 7; i++) p.push(arch((i - 3) * 20 / 7, end * 12, 1.22, 2.4, .4, .21));
    p.push(box("内院前后拱廊上的连续承檐石梁", 0, 4.11, end * 12, 20, .24, .45, stone));
    for (const x of [-6.5, 6.5]) p.push(box("前后厩舍内不堵住中央门道的马位隔板", x, .95, end * 15.1, .12, 1.5, 5.4, wood));
    p.push(box("前后厩舍外墙内侧的完整饲草架底", 0, .88, end * 17.9, 29, .15, .7, wood));
  }
  for (const side of [-1, 1]) {
    for (let i = 0; i < 8; i++) { const value = arch(0, 0, 1.25, 2.4, .4, .25); value.position.x = side * 10; value.position.z = -10.5 + i * 3; value.rotation.y = 90; p.push(value); }
    p.push(box("内院两侧拱廊上的连续承檐石梁", side * 10, 4.11, 0, .45, .24, 24, stone));
    for (const z of [-8, 0, 8]) p.push(box("侧翼内靠外墙的独立马位隔板", side * 13.6, .95, z, 5.3, 1.5, .12, wood));
    p.push(box("侧翼外墙内侧连续喂马槽底", side * 15.9, .88, 0, .7, .15, 33, wood));
  }
  const supports: ModelPart[] = [];
  for (const side of [-1, 1]) for (const t of [-13, -6.5, 0, 6.5, 13]) supports.push(solidBox("前后饲草架底与外墙相连的木托", t, .78, side * 18.35, .12, .1, .7, wood), solidBox("两侧饲草架底与外墙相连的木托", side * 16.35, .78, t, .7, .1, .12, wood));
  p.push(combineMeshes("全部喂马槽架与外墙的实际连接托座", wood, supports));
  return p;
}
