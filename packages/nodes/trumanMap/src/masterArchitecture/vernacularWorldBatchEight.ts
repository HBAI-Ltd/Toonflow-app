import { part, beam, ring, type ModelPart, type Triple } from "../assetModelParts";
import { combineMeshes } from "../natureParts";
import { box, cylinder, design } from "./structures";
import { rectangularFlue } from "./spatialShells";
import { doorWall, gableCover, slopePanel } from "./vernacularWorldBatchOne";
import { endGable, ladder } from "./vernacularWorldBatchTwo";
import { hardWall, solidBox } from "./vernacularWorldBatchThree";
import { meshBeam } from "./vernacularWorldBatchFive";
import { hardFloor } from "./vernacularWorldBatchSix";

const wood = "#8f7152", plaster = "#c7bca6", stone = "#a2a696", roof = "#748579", earth = "#aa9779", brick = "#a88b72", thatch = "#aaa075";

// https://home.nps.gov/places/stanley-whitman-house.htm
// https://www.fs.usda.gov/Internet/FSE_DOCUMENTS/fseprd517816.pdf
// https://www.cultureelerfgoed.nl/onderwerpen/a/agrarisch-erfgoed/type-boerderijen
// https://historicengland.org.uk/education/schools-resources/educational-images/horse-gin-house-at-park-farm-illogan-cornwall-ioe01-13834-12
// https://www.museumnord.no/en/stories/history-of-lofoten/
// https://historicengland.org.uk/listing/the-list/list-entry/1291415
export const vernacularWorldBatchEightDesigns = [
  design("长后披中烟囱盐箱民宅", "前部两层居室和后部低厨房被同一条向后延伸的长屋坡包住，粗中烟囱穿过真实屋面口，内梯连接前部上层而后室保留单层空间", saltboxHouse, "建筑", "欧式"),
  design("落地三角框双层阁居屋", "反复三角主框从基脚直接汇入高屋脊，两整斜屋面同时组成侧围护，后半阁板穿有梯洞，前方保持通高三角起居空间", aFrameLoftHouse, "建筑", "欧式"),
  design("头宅细颈接大仓三段农庄", "低前宅由独立窄颈居室连到宽大高仓，三段屋盖各自承重且门道连续，大仓内的高柱贮草场与侧畜道分开", headNeckBodyFarm, "建筑", "欧式"),
  design("圆马道转轮亭侧接打谷长仓", "开敞圆马道亭内的长扫杠绕竖轴回转，低横传动轴从真墙孔进入旁侧长仓并接打谷鼓，圆锥亭盖和仓屋分别支承", ginGangBarn, "建筑", "欧式"),
  design("通风三角交架晒鱼长栈", "倒V木主框直接落到双列石脚，沿斜架高低布置的长挂杆保留侧向通风，纵向交叉撑维持整排稳定，鱼体成对悬在挂杆下", stockfishDryingRack, "建筑", "欧式"),
  design("两面挑层转角斜承木宅", "下层前壁和右侧壁退在上层以内，双向挑层梁在街角以长斜梁交接，柱上肘撑接住突出楼板，真实内梯洞连到有窗上室", jettiedCornerHouse, "建筑", "欧式"),
];

function saltboxHouse(): ModelPart[] {
  const p: ModelPart[] = [box("盐箱民宅前后共用的完整石地坪", 0, .1, 0, 11, .2, 11.8, stone), ...doorWall("前方双层主立面的下层入口", 0, -5.8, 10.7, 2.75, .2, 1.2, 2.2, plaster, .2), hardWall("前方上层居室真正贯通的双窗", 10.7, 2.9, .2, [0, 2.95, -5.7], [[[-3.35, .7], [-2.05, .7], [-2.05, 1.95], [-3.35, 1.95]], [[2.05, .7], [3.35, .7], [3.35, 1.95], [2.05, 1.95]]], plaster), ...doorWall("长后披下低厨房通向后院的门壁", 0, 5.8, 10.7, 2.62, .2, 1.05, 2.05, plaster, .2), hardFloor("前方上层真实避开中烟囱和内梯的木楼板", wood, [[-5.25, -5.7], [5.25, -5.7], [5.25, .6], [-5.25, .6]], .18, [0, 2.86, 0], [[[-.8, -3.3], [.8, -3.3], [.8, -1.7], [-.8, -1.7]], [[2.8, -4.1], [3.8, -4.1], [3.8, -2.5], [2.8, -2.5]]]), ...ladder("从前厅穿过真实楼板洞的内木梯", 3.3, .2, -.6, 3.8, -3.5, 9)];
  const outline: [number, number][] = [[-5.8, 0], [5.8, 0], [5.8, 2.62], [-2.5, 8.35], [-5.8, 5.65]], holes: [number, number][][] = [[[-4.7, 1], [-3.5, 1], [-3.5, 2.1], [-4.7, 2.1]], [[2, 1], [3.3, 1], [3.3, 2.1], [2, 2.1]], [[-4.7, 3.6], [-3.5, 3.6], [-3.5, 4.8], [-4.7, 4.8]]];
  for (const side of [-1, 1]) { const wall = hardFloor("从双层前厅连续降至后厨房的真实侧立面", plaster, outline, .2, [side * 5.35 - .1, .2, 0], holes); wall.rotation = { x: -90, y: 0, z: -90 }; p.push(wall); }
  const frontY = (z: number) => 5.9 + (z + 6) / 3.5 * 2.7, backY = (z: number) => 8.6 - (z + 2.5) / 8.7 * 5.9;
  for (const [left, right] of [[-5.95, -.72], [.72, 5.95]]) p.push(slopePanel("中烟囱两侧连续的短前屋坡", [[left!, 5.9, -6], [right!, 5.9, -6], [right!, 8.6, -2.5], [left!, 8.6, -2.5]], .16, roof), slopePanel("中烟囱两侧连续降到后檐的长屋坡", [[left!, 8.6, -2.5], [right!, 8.6, -2.5], [right!, 2.7, 6.2], [left!, 2.7, 6.2]], .16, roof));
  p.push(slopePanel("真实停在烟囱前缘的中间短屋片", [[-.72, 5.9, -6], [.72, 5.9, -6], [.72, frontY(-3.22), -3.22], [-.72, frontY(-3.22), -3.22]], .16, roof), slopePanel("真实从烟囱后缘续下的中间长屋片", [[-.72, backY(-1.78), -1.78], [.72, backY(-1.78), -1.78], [.72, 2.7, 6.2], [-.72, 2.7, 6.2]], .16, roof), rectangularFlue("从火室穿过真实屋面开口的空心中烟筒", 1.44, 1.44, 7.4, .25, [0, 1.8, -2.5], brick), box("中烟囱下方完整隔火石床", 0, .28, -2.5, 1.7, .16, 1.8, stone), box("低后厨房与前厅之间靠左短内壁", -3.1, 1.43, .9, 4.5, 2.46, .12, wood), box("低后厨房与前厅之间靠右短内壁", 3.1, 1.43, .9, 4.5, 2.46, .12, wood));
  for (const side of [-1, 1]) p.push(box("中烟囱火室前口两旁承重砖壁", side * .6, 1.05, -2.5, .24, 1.5, 1.44, brick));
  p.push(box("中烟囱火室背部封烟砖壁", 0, 1.05, -1.9, 1.44, 1.5, .24, brick));
  return p;
}

function aFrameLoftHouse(): ModelPart[] {
  const p: ModelPart[] = [box("落地三角框共同防潮石基础", 0, .08, 0, 10.1, .16, 12.8, stone), box("三角框内完整下层木地板", 0, .22, 0, 9.7, .12, 12.3, wood), ...gableCover("两整屋面直接组成侧围护的高三角盖", 10, 13.2, .25, 9.15, roof), hardFloor("后半阁板有真实内梯洞而前厅挑空", wood, [[-2.7, 0], [2.7, 0], [2.7, 5.8], [-2.7, 5.8]], .18, [0, 3.56, 0], [[[1.15, .2], [2.05, .2], [2.05, 1.4], [1.15, 1.4]]]), ...ladder("从前挑空厅穿入后阁板的斜内梯", 1.6, .28, -2, 4.5, 1.1, 11)];
  const frontParts: [number, number][][] = [[[-4.85, 0], [-.6, 0], [-.6, 2.2], [-3.657, 2.2]], [[.6, 0], [4.85, 0], [3.657, 2.2], [.6, 2.2]], [[-3.657, 2.2], [3.657, 2.2], [0, 8.95]]];
  for (let i = 0; i < frontParts.length; i++) { const wall = hardFloor("高三角前山面真正避开下方入口及上部采光窗", plaster, frontParts[i]!, .14, [0, .28, -5.93], i === 2 ? [[[-.65, 4.1], [.65, 4.1], [.65, 5.2], [-.65, 5.2]]] : []); wall.rotation.x = -90; p.push(wall); }
  const back = hardFloor("与两条落地屋面闭合的完整三角后山墙", plaster, [[-4.85, 0], [4.85, 0], [0, 8.95]], .14, [0, .28, 6.07], [[[-.75, 4.1], [.75, 4.1], [.75, 5.2], [-.75, 5.2]]]); back.rotation.x = -90; p.push(back);
  const frame: ModelPart[] = [];
  for (const z of [-5.5, -2.75, 0, 2.75, 5.5]) {
    for (const side of [-1, 1]) frame.push(meshBeam("由基脚直达高屋脊的完整三角框斜梁", [side * 4.95, .28, z], [0, 9.22, z], .22, wood));
    frame.push(meshBeam("锁住两条主斜梁基脚的完整横向拉梁", [-4.9, .29, z], [4.9, .29, z], .19, wood));
  }
  p.push(combineMeshes("真实保留五榀完整落地三角主框", wood, frame), box("五榀落地框共用的纵向屋脊枋", 0, 9.17, 0, .19, .19, 12.5, wood));
  for (const x of [-2.4, 1.15, 2.05, 2.4]) p.push(box("后阁前缘护栏避开内梯入口的独立柱", x, 4.2, .02, .075, .94, .075, wood));
  for (const [a, b] of [[-2.4, 1.15], [2.05, 2.4]]) p.push(box("挑空厅边缘真正避开梯口的阁板护栏", (a! + b!) / 2, 4.68, .02, b! - a!, .075, .075, wood));
  return p;
}

function headNeckBodyFarm(): ModelPart[] {
  const p: ModelPart[] = [box("前宅独立完整石地坪", -3, .1, -14, 8.4, .2, 8.2, stone), ...doorWall("前宅面向院落的完整主门立面", -3, -18, 8.2, 4.1, .3, 1.1, 2.2, plaster, .2), ...doorWall("前宅后部与窄颈相通的真内门", -3, -10, 8.2, 4.1, .3, 1.15, 2.2, plaster, .2), ...gableCover("前宅单独承重的高双坡盖", 9, 8.8, 4.13, 2.3, roof, -3, -14), ...[-1, 1].map(end => endGable(-3, -14 + end * 4, 8.2, 4.3, 1.97, plaster)), box("窄颈居室与两端房门相平的连续地坪", -3, .1, -6.5, 3, .2, 7, stone), ...gableCover("前宅与大仓间较低的独立窄颈屋盖", 3.8, 7.5, 2.6, 1, roof, -3, -6.5), box("大仓完整高场与侧道共同夯土地坪", 0, .1, 8, 18, .2, 22, earth)];
  for (const side of [-1, 1]) p.push(hardWall("前宅两侧真正开窗的连续外墙", 8, 4.1, .3, [-3 + side * 4 - .15, .2, -14], [[[-2.5, 1], [-1.2, 1], [-1.2, 2.4], [-2.5, 2.4]], [[1.2, 1], [2.5, 1], [2.5, 2.4], [1.2, 2.4]]], plaster, 90), box("连接前宅和大仓的窄颈实墙", -3 + side * 1.4, 1.45, -6.5, .2, 2.5, 7, plaster));
  p.push(box("大仓前立面位于窄颈门左侧的实壁", -6.4, 1.85, -3, 4.8, 3.3, .28, plaster), box("大仓前立面位于窄颈门右侧的实壁", 3.4, 1.85, -3, 10.8, 3.3, .28, plaster), box("窄颈入仓门之上的真实短过梁", -3, 3.1, -3, 2, .8, .28, plaster), box("宽大后仓的完整后端外墙", 0, 1.85, 19, 17.6, 3.3, .28, plaster), hardWall("大仓左侧低畜道采光的真实侧窗", 22, 3.3, .28, [-8.94, .2, 8], [[[-7.3, 1], [-6.1, 1], [-6.1, 2], [-7.3, 2]], [[-.6, 1], [.6, 1], [.6, 2], [-.6, 2]], [[6.1, 1], [7.3, 1], [7.3, 2], [6.1, 2]]], plaster, 90));
  p.push(...doorWall("大仓右侧进入打谷道的大车门", 0, 0, 22, 3.3, .28, 3.3, 3.1, wood, .2).map(value => { value.position = { x: 8.8, y: value.position.y, z: 8 - value.position.x }; value.rotation.y = 90; return value; }));
  const roofCorners: Triple[] = [[-9.6, 3.1, -3.6], [9.6, 3.1, -3.6], [9.6, 3.1, 19.6], [-9.6, 3.1, 19.6]];
  p.push(slopePanel("宽大贮草仓左侧完整长四坡屋片", [roofCorners[0]!, [0, 10, 1], [0, 10, 15], roofCorners[3]!], .18, thatch), slopePanel("宽大贮草仓右侧完整长四坡屋片", [roofCorners[1]!, [0, 10, 1], [0, 10, 15], roofCorners[2]!], .18, thatch), slopePanel("大仓前端从低门壁升至短屋脊的三角坡", [roofCorners[0]!, roofCorners[1]!, [0, 10, 1]], .18, thatch), slopePanel("大仓后端从低墙升至短屋脊的三角坡", [roofCorners[2]!, roofCorners[3]!, [0, 10, 15]], .18, thatch));
  for (const end of [-3, 19]) { const filler = hardFloor("大仓端墙准确接入四坡屋盖的上缘补壁", plaster, [[-8.8, 3.5], [8.8, 3.5], [8.33, 3.82], [-8.33, 3.82]], .25, [0, 0, end + .125]); filler.rotation.x = -90; p.push(filler); }
  for (const z of [0, 7, 14]) {
    for (const side of [-1, 1]) p.push(box("大仓高中央场两列独立承重长柱", side * 3, 3.9, z, .3, 7.4, .3, wood), beam("高柱向外低檐伸出的真实斜梁", wood, [side * 3, 7.6, z], [side * 8.8, 3.5, z], .22));
    p.push(box("两高柱之间实际连接的横向系梁", 0, 7.6, z, 6.3, .25, .25, wood), box("左侧畜道与高贮草场之间的低隔栏", -5.8, .85, z + 2.8, 5, 1.3, .12, wood));
  }
  for (const side of [-1, 1]) p.push(box("沿高柱顶贯通全仓的长承檩", side * 3, 7.6, 7, .25, .25, 15, wood));
  return p;
}

function ginGangBarn(): ModelPart[] {
  const p: ModelPart[] = [box("打谷长仓完整夯土地坪", 5, .1, 0, 8.3, .2, 16.3, earth), cylinder("侧接圆马道亭完整环行地坪", -4, .1, -1, 11.8, .2, earth), ...doorWall("打谷长仓两端之间可通行的前大门", 5, -8, 8, 3.8, .28, 2.4, 3, plaster, .2), box("打谷长仓后端完整厚砖壁", 5, 2.1, 8, 8, 3.8, .28, plaster), hardWall("圆马道横传动轴穿过长仓的真实墙孔", 16, 3.8, .28, [.86, .2, 0], [[[-1.22, .52], [-.78, .52], [-.78, .98], [-1.22, .98]]], plaster, 90), hardWall("打谷长仓另一侧的高通风孔", 16, 3.8, .28, [8.86, .2, 0], [[[-4.4, 1.4], [-3.2, 1.4], [-3.2, 2.4], [-4.4, 2.4]], [[3.2, 1.4], [4.4, 1.4], [4.4, 2.4], [3.2, 2.4]]], plaster, 90), ...gableCover("打谷长仓独立双坡木片屋盖", 9, 16.9, 3.8, 2.4, roof, 5, 0), ...[-1, 1].map(end => endGable(5, end * 8, 8, 4, 2.04, plaster))];
  for (let i = 0; i < 8; i++) {
    const a = (22.5 + i * 45) * Math.PI / 180, b = (67.5 + i * 45) * Math.PI / 180;
    p.push(box("围住马道但保留侧向敞口的独立亭柱", -4 + Math.cos(a) * 5.3, 1.85, -1 + Math.sin(a) * 5.3, .28, 3.3, .28, wood), slopePanel("圆马道亭柱上完整锥形屋盖的独立坡片", [[-4 + Math.cos(a) * 6, 3.45, -1 + Math.sin(a) * 6], [-4 + Math.cos(b) * 6, 3.45, -1 + Math.sin(b) * 6], [-4, 6.2, -1]], .16, roof), beam("环亭各柱顶部相连的连续承檐枋", wood, [-4 + Math.cos(a) * 5.3, 3.5, -1 + Math.sin(a) * 5.3], [-4 + Math.cos(b) * 5.3, 3.5, -1 + Math.sin(b) * 5.3], .22));
  }
  const crown = ring("圆马道中央水平大传动轮", wood, 1.6, .16, .92, .22); crown.position = { x: -4, y: .92, z: -1 };
  const pinion = ring("低横轴端部与大水平轮交接的小木轮", wood, .4, .1, 0, .2); pinion.position = { x: -2.5, y: .95, z: -1 }; pinion.rotation.z = 90;
  p.push(crown, pinion, cylinder("马道中央真实落地的回转粗竖轴", -4, .82, -1, .3, 1.24, wood), beam("供畜力沿整圈马道拖行的连续长扫杠", wood, [-4, 1.3, -1], [-8.6, 1.3, -1], .22), cylinder("从圆亭穿真墙孔进入仓内打谷鼓的横长轴", 2.5, .95, -1, .17, 10, wood, [0, 0, 90]), cylinder("长仓内横轴上完整打谷鼓芯", 5.2, .95, -1, 1.1, 2.8, wood, [0, 0, 90]), box("把麦束送向打谷鼓前缘的进料木案", 5.2, .98, -2.2, 3.2, .16, 1.2, wood));
  const bars: ModelPart[] = [];
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; bars.push(meshBeam("完整连接竖轴与水平传动轮的木辐", [-4, .92, -1], [-4 + Math.cos(a) * 1.5, .92, -1 + Math.sin(a) * 1.5], .11, wood), meshBeam("横打谷鼓表面真正连接的长拍击条", [3.75, .95 + Math.cos(a) * .58, -1 + Math.sin(a) * .58], [6.65, .95 + Math.cos(a) * .58, -1 + Math.sin(a) * .58], .075, wood)); }
  p.push(combineMeshes("马道转轮和仓内打谷鼓的全部工作木条", wood, bars));
  for (const x of [3.65, 6.75]) p.push(box("从地面接到打谷鼓轴的独立承轴木座", x, .55, -1, .3, .7, 1.1, wood), box("进料木案两端实际落地的短木足", x, .55, -2.2, .15, .7, .8, wood));
  return p;
}

function stockfishDryingRack(): ModelPart[] {
  const p: ModelPart[] = [], frames: ModelPart[] = [], feet: ModelPart[] = [], braces: ModelPart[] = [];
  for (let i = 0; i < 9; i++) {
    const z = -12 + i * 3;
    for (const side of [-1, 1]) { frames.push(meshBeam("从双列石脚交接到高脊的整根斜晒架木", [side * 3.1, .2, z], [0, 5.3, z], .19, wood)); feet.push(solidBox("整排三角晒架下真实落地的独立石脚", side * 3.1, .1, z, .65, .2, .65, stone)); }
    frames.push(meshBeam("晒架中部把两条斜木锁定的短横撑", [-1.52, 2.8, z], [1.52, 2.8, z], .13, wood));
  }
  for (let i = 0; i < frames.length; i += 16) p.push(combineMeshes("完整保留九榀倒V交接木主框", wood, frames.slice(i, i + 16)));
  p.push(combineMeshes("整排三角晒架全部十八个落地石脚", stone, feet), box("三角主架顶端贯通的长挂鱼脊木", 0, 5.28, 0, .17, .17, 25.5, wood));
  for (const side of [-1, 1]) {
    p.push(box("高位长挂杆沿整排斜架保持贯通", side * 1.1, 3.49, 0, .13, .13, 25.2, wood), box("低位长挂杆沿整排斜架保持贯通", side * 2.2, 1.68, 0, .13, .13, 25.2, wood));
    for (const z of [-12, 6]) braces.push(meshBeam("晒架侧面沿纵向真实交接的抗风斜撑", [side * 3.04, .3, z], [side * 1.52, 2.8, z + 6], .11, wood), meshBeam("晒架侧面逆向交接的抗风斜撑", [side * 1.52, 2.8, z], [side * 3.04, .3, z + 6], .11, wood));
  }
  p.push(combineMeshes("完整保留两端纵向交叉抗风木撑", wood, braces));
  for (const z of [-9, -6, -3, 0, 3, 6, 9, 11]) for (const side of [-1, 1]) {
    p.push(part("倒挂在长杆下并保留鱼腹厚度的完整鱼体", "lathe", "#b5aa8b", [side * 1.1, 2.94, z], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: -.42 }, { x: .1, y: -.3 }, { x: .14, y: -.08 }, { x: .11, y: .16 }, { x: .035, y: .39 }, { x: 0, y: .43 }, { x: 0, y: -.42 }] }), part("鱼体尾端真正挂接到长晒杆的双叉尾", "extrude", "#a09477", [side * 1.1, 3.3, z], [1, 1, 1], [0, 0, 0], { depth: .035, profile: [{ x: -.03, y: 0 }, { x: -.14, y: .18 }, { x: 0, y: .12 }, { x: .14, y: .18 }, { x: .03, y: 0 }] }));
  }
  return p;
}

function jettiedCornerHouse(): ModelPart[] {
  const p: ModelPart[] = [box("退进下室完整落地石基础", 0, .1, 0, 8, .2, 10, stone), ...doorWall("退在上挑楼面以内的下层前门壁", 0, -4.8, 7.6, 2.8, .2, 1.25, 2.15, plaster, .2), box("下层后侧完整围壁", 0, 1.6, 4.8, 7.6, 2.8, .2, plaster), ...[-1, 1].map(side => hardWall("下层侧围壁真正避开采光窗", 9.6, 2.8, .2, [side * 3.8 - .1, .2, 0], [[[-2.6, 1], [-1.3, 1], [-1.3, 2.1], [-2.6, 2.1]], [[1.3, 1], [2.6, 1], [2.6, 2.1], [1.3, 2.1]]], plaster, 90)), hardFloor("前方和右侧真实外挑且保留内梯洞的上层楼板", wood, [[-3.95, -5.75], [4.75, -5.75], [4.75, 4.95], [-3.95, 4.95]], .2, [0, 3, 0], [[[-2.5, 1.2], [-1.5, 1.2], [-1.5, 2.6], [-2.5, 2.6]]]), ...ladder("下层后室经真实梯洞接上挑层的内梯", -2, .2, 4.2, 4, 1.6, 10), ...gableCover("两面挑层上方完整长双坡屋盖", 9.4, 11.7, 5.95, 2.5, roof, .4, -.4)];
  const windows: [number, number][][] = [-2.4, 0, 2.4].map(x => [[x - .62, .75], [x + .62, .75], [x + .62, 1.95], [x - .62, 1.95]]);
  for (const end of [-1, 1]) p.push(hardWall("挑层前后围墙真正贯通的三采光窗", 8.4, 2.9, .18, [.4, 3.2, -.4 + end * 5.2 + .09], windows, plaster), endGable(.4, -.4 + end * 5.2, 8.4, 6.1, 2.19, plaster));
  for (const x of [-3.8, 4.6]) p.push(hardWall("挑层两侧围壁真正贯通的采光窗", 10.4, 2.9, .18, [x - .09, 3.2, -.4], [[[-3.8, .75], [-2.5, .75], [-2.5, 1.95], [-3.8, 1.95]], [[2.5, .75], [3.8, .75], [3.8, 1.95], [2.5, 1.95]]], plaster, 90));
  const framing: ModelPart[] = [];
  for (const x of [-3.8, -1.2, 1.2, 3.8]) {
    for (const z of [-4.8, 4.8]) framing.push(meshBeam("退进下室的通高承重木柱", [x, .2, z], [x, 3.05, z], .19, wood));
    framing.push(meshBeam("下层前柱真正托到上挑前缘的肘撑", [x, 2, -4.8], [x, 3, -5.6], .16, wood), meshBeam("从下层后壁连续挑出前楼面的长木梁", [x, 3, 4.8], [x, 3, -5.7], .22, wood));
  }
  for (const z of [-4.8, -2.4, 0, 2.4, 4.8]) framing.push(meshBeam("下层左右木壁上连续向右挑出的横楼梁", [-3.8, 3, z], [4.7, 3, z], .22, wood), meshBeam("右侧退进立柱向上挑边梁伸出的肘撑", [3.8, 2, z], [4.6, 3, z], .16, wood));
  framing.push(meshBeam("街角接合两个方向挑梁的连续转角斜梁", [1.8, 3, -2.8], [4.7, 3, -5.7], .26, wood), meshBeam("退进街角柱到突出楼角的斜肘撑", [3.8, 2.05, -4.8], [4.55, 3, -5.55], .18, wood));
  for (const x of [-3.8, -1.2, 1.2, 4.6]) for (const z of [-5.6, 4.8]) framing.push(meshBeam("挑层围墙内外可见的通高竖木", [x, 3.2, z], [x, 6.1, z], .15, wood));
  framing.push(meshBeam("挑层前立面完整外露腰枋", [-3.9, 3.24, -5.69], [4.7, 3.24, -5.69], .18, wood), meshBeam("挑层右立面完整外露腰枋", [4.69, 3.24, -5.6], [4.69, 3.24, 4.8], .18, wood));
  for (let i = 0; i < framing.length; i += 16) p.push(combineMeshes("完整木宅真正承住双向挑层的柱梁肘撑", wood, framing.slice(i, i + 16)));
  return p;
}
