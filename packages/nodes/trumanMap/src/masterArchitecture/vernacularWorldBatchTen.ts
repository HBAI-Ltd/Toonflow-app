import { part, beam, ring, type ModelPart, type Triple } from "../assetModelParts";
import { combineMeshes } from "../natureParts";
import { tapered } from "../masterNature/shared";
import { box, cylinder, design } from "./structures";
import { barrelRoof, halfRoundWall } from "./spatialShells";
import { doorWall, gableCover, slopePanel } from "./vernacularWorldBatchOne";
import { endGable, ladder } from "./vernacularWorldBatchTwo";
import { hardWall, solidBox } from "./vernacularWorldBatchThree";
import { meshBeam } from "./vernacularWorldBatchFive";
import { hardFloor } from "./vernacularWorldBatchSix";

const wood = "#8e7251", stone = "#b1af98", earth = "#b29473", thatch = "#aaa078", plaster = "#d0c8b3", dark = "#796149";

// https://whc.unesco.org/en/decisions/8600/
// https://www.djerbaexplore.com/en/the_houch/
// https://whc.unesco.org/en/list/516/
// https://collections.tepapa.govt.nz/object/58203
// https://www.metmuseum.org/art/collection/search/318423
// https://www.shimajournal.org/issues/v4n1/k.-Whincup-Shima-v4n1-113-130.pdf
export const vernacularWorldBatchTenDesigns = [
  design("双圆连腰折入门祖居", "两圆泥室在短腰处连通，低入口后有折入挡壁，厚平顶与外部实石级相连，上屋顶的入口在低护壁中真实留开", kassenaMotherHouse, "建筑", "异域"),
  design("双筒券拱房环院家宅", "闭合外墙内的长筒券房、带圆穹厨房和阶台上室围住露天内院，偏置外门经前室转入内院，住室的门都朝院内打开", djerbaHouchHouse, "建筑", "异域"),
  design("低敞木柱厚束茅议事屋", "八根独立木柱承住极厚的六层植物束屋盖，低净高的开敞厅围有坐台，柱顶横枋和纵枋共同托住每层长束", dogonTogunaHouse, "建筑", "异域"),
  design("深前廊祖柱长厅会屋", "同一双坡盖下前部是深开敞门廊，后部封闭长厅由三根中柱承担屋脊，祖柱木雕下段与上承木连成一体，侧榀木椽接入通长脊梁", maoriWharenuiHouse, "建筑", "异域"),
  design("前高后低拱屏长会所", "高耸前山屏保留低入口，连续长脊和曲侧壳向后逐段降低并收窄，纵向空室内的中柱和各榀木肋真实相接，前屏带几何浮雕", abelamCeremonialHouse, "建筑", "异域"),
  design("低珊瑚檐柱双排高撑议事屋", "低珊瑚石柱圈承住四面近地的巨大茅盖，内部双排高木柱与斜撑抬起长屋脊，绳扎圈套在承梁节点，宽大中央地坪保持开敞", kiribatiManeabaHouse, "建筑", "异域"),
];

function circularWall(name: string, x: number, z: number, radius: number, start: number, end: number, floor: number, height: number, thickness: number, color: string): ModelPart {
  return halfRoundWall(name, radius, thickness, height, [x, floor, z], -start * 180 / Math.PI, color, end - start);
}

function kassenaMotherHouse(): ModelPart[] {
  const radius = 2.8, center = 2.25, angle = Math.acos(center / radius), span = Math.PI * 2 - angle * 2, outline: [number, number][] = [];
  for (let i = 0; i <= 12; i++) { const a = angle + i * span / 12; outline.push([-center + Math.cos(a) * radius, Math.sin(a) * radius]); }
  for (let i = 1; i < 12; i++) { const a = Math.PI + angle + i * span / 12; outline.push([center + Math.cos(a) * radius, Math.sin(a) * radius]); }
  const p: ModelPart[] = [hardFloor("八字双圆祖居完整连续泥地坪", earth, outline, .2, [0, 0, 0]), hardFloor("双圆居室共同承住的完整厚平泥顶", earth, outline, .25, [0, 2.6, 0]), circularWall("左圆室低门之前的完整下壁", -center, 0, radius, angle, 260.5 * Math.PI / 180, .2, 1.15, .3, earth), circularWall("左圆室低门之后的完整下壁", -center, 0, radius, 279.5 * Math.PI / 180, Math.PI * 2 - angle, .2, 1.15, .3, earth), circularWall("左圆室低门上方连续闭合的承顶泥壁", -center, 0, radius, angle, Math.PI * 2 - angle, 1.35, 1.3, .3, earth), circularWall("右圆室除连腰口外完整围合的厚泥壁", center, 0, radius, Math.PI + angle, Math.PI * 3 - angle, .2, 2.45, .3, earth), circularWall("左圆屋顶沿轮廓连续升起的低护壁", -center, 0, radius, angle, Math.PI * 2 - angle, 2.85, .35, .18, earth), circularWall("右圆屋顶避开外石梯入口的低护壁之一", center, 0, radius, Math.PI + angle, 340 * Math.PI / 180, 2.85, .35, .18, earth), circularWall("右圆屋顶避开外石梯入口的低护壁之二", center, 0, radius, 380 * Math.PI / 180, Math.PI * 3 - angle, 2.85, .35, .18, earth)];
  for (const side of [-1, 1]) p.push(box("双圆内外壁在连腰处真实接续的短厚墙", 0, 1.425, side * 1.51, .62, 2.45, .32, earth), box("双圆屋顶连腰处接续两段圆护壁的短栏", 0, 3.025, side * 1.51, .62, .35, .32, earth));
  const ceiling: ModelPart[] = [], steps: ModelPart[] = [];
  for (const x of [-center, center]) for (const z of [-1.6, -.5, .5, 1.6]) { const half = Math.sqrt(2.75 ** 2 - z ** 2); ceiling.push(meshBeam("圆室两侧厚壁间实际承住泥顶的整根横木", [x - half, 2.59, z], [x + half, 2.59, z], .16, wood)); }
  p.push(combineMeshes("双圆室厚泥顶下面全部保留的承顶横木", wood, ceiling), box("低入口内侧迫使人转向的短挡壁", -center, .7, -1.45, 1.75, 1, .23, earth), box("右圆内室沿墙的完整泥睡台", 3.1, .43, .15, 1.8, .46, 2.3, earth));
  for (let i = 0; i < 10; i++) { const height = (i + 1) * .265; steps.push(solidBox("从地面上到双圆平泥顶的独立实心石级", 5.55, .2 + height / 2, -3.6 + i * .35, 1.05, height, .35, stone)); }
  p.push(combineMeshes("完整保留十级实际步高的祖居外石梯", stone, steps), box("外石梯顶与屋顶真护栏口接续的石平台", 5.2, 2.775, -.25, 1.5, .15, .9, stone));
  return p;
}

function vaultEnd(name: string, radius: number, wallHeight: number, x: number, z: number, floor: number, sideFacing: boolean): ModelPart {
  const outline: [number, number][] = [[-radius, 0], [radius, 0], [radius, wallHeight], ...Array.from({ length: 12 }, (_, i): [number, number] => { const a = (i + 1) * Math.PI / 12; return [Math.cos(a) * radius, wallHeight + Math.sin(a) * radius]; })], value = hardFloor(name, plaster, outline, .25, [x - (sideFacing ? .125 : 0), floor, z + (sideFacing ? 0 : .125)]);
  value.rotation = { x: -90, y: 0, z: sideFacing ? -90 : 0 }; return value;
}

function djerbaHouchHouse(): ModelPart[] {
  const p: ModelPart[] = [box("环院家宅四翼与中央露天内院共用石地坪", 0, .1, 0, 18.4, .2, 18.4, stone), box("前筒券房外门左侧完整封闭外墙", -7.275, 1.4, -9, 3.45, 2.4, .35, plaster), box("前筒券房外门右侧完整封闭外墙", 2.275, 1.4, -9, 13.45, 2.4, .35, plaster), box("偏置唯一外门上方的厚石楣", -5, 2.43, -9, 1.1, .34, .35, plaster), box("后筒券房面向外部的完整厚石墙", 0, 1.4, 9, 18, 2.4, .35, plaster)];
  for (const end of [-1, 1]) {
    const vault = barrelRoof("露天内院前后独立长房的完整空心石筒券", 2.5, .18, 18, [0, 2.6, end * 6.5], plaster); vault.rotation.y = 90; p.push(vault, ...doorWall("前后筒券住室真正通向内院的门", 0, end * 4, 18, 2.4, .28, 1.2, 2.1, plaster, .2));
    for (const side of [-1, 1]) p.push(vaultEnd("长筒券房两端与曲屋盖真实闭合的厚山面", 2.5, 2.4, side * 9, end * 6.5, .2, true));
  }
  for (const side of [-1, 1]) {
    p.push(box("环院侧翼不向外开窗的完整外墙", side * 9, 1.4, 0, .35, 2.4, 8, plaster), ...doorWall("东西两翼真正通向露天内院的门", 0, 0, 8, 2.4, .28, 1.1, 2.1, plaster, .2).map(value => { value.position = { x: side * 4, y: value.position.y, z: -value.position.x }; value.rotation.y = 90; return value; }));
  }
  p.push(hardFloor("西翼平泥屋面保留上室的真实内梯井", plaster, [[-9, -4], [-4, -4], [-4, 4], [-9, 4]], .2, [0, 2.7, 0], [[[-7, -.6], [-6, -.6], [-6, .8], [-7, .8]]]), ...ladder("从西翼水房经真井口进入上室的内梯", -6.5, .2, -2.8, 3.7, .5, 9), hardFloor("东翼厨房平屋面保留圆穹真实内开口", plaster, [[4, -4], [9, -4], [9, 4], [4, 4]], .18, [0, 2.6, 0], [Array.from({ length: 16 }, (_, i): [number, number] => [6.5 + Math.cos(i * Math.PI / 8) * 1.5, Math.sin(i * Math.PI / 8) * 1.5])]), ...doorWall("西翼上部夏室通向平屋台的真实门", -6.5, -.7, 4, 2.4, .22, 1, 2.05, plaster, 2.9), box("上部夏室后墙", -6.5, 4.1, 2.3, 4, 2.4, .22, plaster), ...[-1, 1].map(side => hardWall("上部夏室向外采光的真实窄窗", 3, 2.4, .22, [-6.5 + side * 2 - .11, 2.9, .8], [[[-.45, .85], [.45, .85], [.45, 1.8], [-.45, 1.8]]], plaster, 90)), barrelRoof("西翼夏室上方完整小筒券盖", 2, .18, 3.4, [-6.5, 5.3, .8], plaster));
  const domeProfile = Array.from({ length: 7 }, (_, i) => ({ x: Math.cos(i * Math.PI / 12) * 1.7, y: 2.7 + Math.sin(i * Math.PI / 12) * 1.7 })); domeProfile.push(...Array.from({ length: 7 }, (_, i) => ({ x: Math.cos((6 - i) * Math.PI / 12) * 1.5, y: 2.7 + Math.sin((6 - i) * Math.PI / 12) * 1.5 })));
  p.push(part("东翼厨房保留真实内部空腔的整圆泥穹", "lathe", plaster, [6.5, 0, 0], [1, 1, 1], [0, 0, 0], { profile: domeProfile }));
  for (const end of [-1, 1]) { const cap = hardFloor("上部夏室两端与筒券相合的半圆山面", plaster, [[-2, 0], [2, 0], ...Array.from({ length: 11 }, (_, i): [number, number] => { const a = (i + 1) * Math.PI / 12; return [Math.cos(a) * 2, Math.sin(a) * 2]; })], .22, [-6.5, 5.3, .8 + end * 1.5 + .11]); cap.rotation.x = -90; p.push(cap); }
  p.push(box("后筒券房内靠墙抬起的厚石睡台", -4.7, .48, 6.5, 4.8, .56, 2.1, stone), box("前室使偏置外门转向内院的独立挡视墙", -3.4, 1.35, -6.5, .24, 2.3, 2.1, plaster));
  return p;
}

function dogonTogunaHouse(): ModelPart[] {
  const p: ModelPart[] = [box("厚束茅议事屋完整抬高石地坪", 0, .15, 0, 10, .3, 7, stone)];
  for (const x of [-3.5, 3.5]) for (const z of [-2.4, -.8, .8, 2.4]) p.push(cylinder("低敞议事屋内真实承住厚盖的粗木柱", x, 1.075, z, .3, 1.55, wood));
  for (const z of [-2.4, -.8, .8, 2.4]) p.push(box("低木柱顶上跨接两排柱的完整横承木", 0, 1.9, z, 7.6, .2, .25, wood));
  for (const side of [-1, 1]) p.push(box("连接四根短柱并托住屋盖横木的纵向承枋", side * 3.5, 1.9, 0, .24, .25, 5.7, wood), box("议事厅左右实际落在石坪上的长土坐台", side * 2.9, .46, 0, .8, .32, 4.6, earth));
  p.push(box("议事厅后端保留前方入口的横土坐台", 0, .46, 2.3, 5, .32, .7, earth));
  for (let layer = 0; layer < 6; layer++) for (let bundle = 0; bundle < 9; bundle++) p.push(part("厚茅盖中逐层叠压且保留圆束端面的长植物束", "cylinder", layer % 2 ? "#a99b72" : thatch, [layer % 2 ? .1 : -.1, 2.2 + layer * .25, -2.8 + bundle * .7], [.4, 9.5, .75], [0, 0, 90]));
  return p;
}

function maoriWharenuiHouse(): ModelPart[] {
  const redWood = "#986a52", p: ModelPart[] = [box("深门廊与后长厅连续的完整木地台", 0, .15, 4, 9.4, .3, 20.5, wood), ...gableCover("将深前廊与祖柱长厅覆盖为一体的完整双坡盖", 10.6, 21, 3.15, 3.7, thatch, 0, 4), box("长厅后部完整木封墙", 0, 2, 12, 8.6, 3.4, .18, plaster), box("前部偏置低门左边的完整木壁", -3.75, 2, -2.5, 1.1, 3.4, .18, plaster), box("偏置前门上方真实木门楣", -2.6, 3.125, -2.5, 1.2, 1.15, .18, redWood), hardWall("长厅前门右侧真正贯通的宽采光窗", 6.3, 3.4, .18, [1.15, .3, -2.41], [[[-.45, 1], [.95, 1], [.95, 2.3], [-.45, 2.3]]], plaster), ...[-1, 1].map(side => box("长厅两侧从前门壁接到后壁的完整围板", side * 4.3, 2, 4.75, .18, 3.4, 14.5, plaster)), endGable(0, -6, 8.6, 3.7, 2.99, redWood), endGable(0, 12, 8.6, 3.7, 2.99, plaster), box("深前廊左右山框共同接入的完整长脊木", 0, 6.62, 3.25, .24, .24, 18.9, redWood)];
  for (const side of [-1, 1]) p.push(box("深前廊最前沿的独立承檐木柱", side * 4.3, 2, -6, .24, 3.4, .24, redWood), box("祖柱长厅内两侧分离低坐卧木台", side * 2.95, .49, 4.5, 1.6, .38, 11.7, wood));
  for (const z of [-2.5, 4.5, 11.8]) p.push(box("从地台通到完整长脊的中承木柱", 0, 3.47, z, .24, 6.34, .24, redWood));
  const figure = part("入口中祖柱下段与承柱相连的人形木雕轮廓", "extrude", redWood, [0, .3, -2.7], [1, 1, 1], [0, 0, 0], { depth: .3, profile: [{ x: -.36, y: 0 }, { x: -.36, y: .18 }, { x: -.24, y: .63 }, { x: -.42, y: 1.05 }, { x: -.24, y: 1.4 }, { x: -.3, y: 1.74 }, { x: 0, y: 1.97 }, { x: .3, y: 1.74 }, { x: .24, y: 1.4 }, { x: .42, y: 1.05 }, { x: .24, y: .63 }, { x: .36, y: .18 }, { x: .36, y: 0 }] }); p.push(figure);
  const ribs: ModelPart[] = [];
  for (const z of [-6, -2.5, 1, 4.5, 8, 11.8]) for (const side of [-1, 1]) ribs.push(meshBeam("从墙顶接入中间木椽的下段承屋斜木", [side * 4.3, 3.7, z], [side * 2.2, 5.16, z], .16, redWood), meshBeam("从中间木椽接到完整长脊的上段承屋斜木", [side * 2.2, 5.16, z], [0, 6.62, z], .16, redWood));
  for (let i = 0; i < ribs.length; i += 16) p.push(combineMeshes("从深前廊到后长厅全部连贯的成榀木椽", redWood, ribs.slice(i, i + 16)));
  p.push(box("前廊地台之外实际落地的长低踏级", 0, .075, -6.7, 5, .15, .9, stone));
  return p;
}

function abelamCeremonialHouse(): ModelPart[] {
  const bark = "#ae9874", redWood = "#9c7559", sections = [[-10, 5, 16.3], [-6, 5, 13], [-1, 4.8, 9.4], [5, 4.3, 7], [11, 3.7, 4.8]], curve = [[1, 0], [.95, .28], [.72, .65], [.35, .9], [0, 1]], p: ModelPart[] = [hardFloor("由高前厅向低后室收窄的完整长木地坪", wood, [[-5, -10], [5, -10], [5, -6], [4.8, -1], [4.3, 5], [3.7, 11], [-3.7, 11], [-4.3, 5], [-4.8, -1], [-5, -6]], .3, [0, 0, 0])], covers: ModelPart[] = [], ribs: ModelPart[] = [];
  const at = (section: number[], cross: number[], side: number): Triple => [side * section[1]! * cross[0]!, .3 + (section[2]! - .3) * cross[1]!, section[0]!];
  for (const side of [-1, 1]) for (let s = 0; s < sections.length - 1; s++) for (let c = 0; c < curve.length - 1; c++) {
    const a = at(sections[s]!, curve[c]!, side), b = at(sections[s]!, curve[c + 1]!, side), d = at(sections[s + 1]!, curve[c]!, side), e = at(sections[s + 1]!, curve[c + 1]!, side);
    covers.push(slopePanel("逐片向低后室弯收的连续曲侧屋壳", [a, b, e], .12, bark), slopePanel("逐片向低后室弯收的连续曲侧屋壳", [a, e, d], .12, bark));
  }
  for (let i = 0; i < covers.length; i += 16) p.push(combineMeshes("高前低后全长覆盖的真实连续薄曲壳", bark, covers.slice(i, i + 16)));
  for (const section of sections) for (const side of [-1, 1]) for (let c = 0; c < curve.length - 1; c++) { const a = at(section, curve[c]!, side), b = at(section, curve[c + 1]!, side); ribs.push(meshBeam("每榀曲面后方真正从地坪接到高脊的承木", [a[0], a[1] - .12, a[2]], [b[0], b[1] - .12, b[2]], .16, wood)); }
  for (let i = 0; i < ribs.length; i += 16) p.push(combineMeshes("全长各榀跟随曲壳收窄下降的真实木承架", wood, ribs.slice(i, i + 16)));
  const frontUpper: [number, number][] = [[-4.9, 2.1], [4.9, 2.1], [4.75, 4.78], [3.6, 10.7], [1.75, 14.7], [0, 16.3], [-1.75, 14.7], [-3.6, 10.7], [-4.75, 4.78]], front = hardFloor("极高前拱屏在低入口上方完整展开的山面", redWood, frontUpper, .16, [0, 0, -9.92]); front.rotation.x = -90; p.push(front);
  for (const side of [-1, 1]) { const lower = hardFloor("高前拱屏低入口两旁真正落地的厚木壁", redWood, side < 0 ? [[-5, .3], [-.8, .3], [-.8, 2.1], [-4.9, 2.1]] : [[.8, .3], [5, .3], [4.9, 2.1], [.8, 2.1]], .16, [0, 0, -9.92]); lower.rotation.x = -90; p.push(lower); }
  const backSection = sections.at(-1)!, backOutline: [number, number][] = [[-backSection[1]!, .3], [backSection[1]!, .3], ...curve.slice(1).map(([x, y]) => [backSection[1]! * x!, .3 + (backSection[2]! - .3) * y!] as [number, number]), ...curve.slice(1, -1).reverse().map(([x, y]) => [-backSection[1]! * x!, .3 + (backSection[2]! - .3) * y!] as [number, number])], back = hardFloor("低后室与长曲壳真正闭合的后山面", bark, backOutline, .14, [0, 0, 11.07], [[[-.45, 1.8], [.45, 1.8], [.45, 2.5], [-.45, 2.5]]]); back.rotation.x = -90; p.push(back);
  for (let i = 0; i < sections.length - 1; i++) p.push(beam("从极高前屏逐段接到低后室的真实长脊", wood, [0, sections[i]![2]! - .12, sections[i]![0]!], [0, sections[i + 1]![2]! - .12, sections[i + 1]![0]!], .22));
  for (const [z, height] of [[-7, 13.705], [0, 8.88], [9, 5.413333333333334]]) p.push(cylinder("纵向长脊在室内实际落地的通高中木柱", 0, (.3 + height!) / 2, z!, .25, height! - .3, wood));
  for (const [y, width] of [[4.2, 4.5], [7.5, 3.7], [10.8, 2.7], [13.5, 1.7]]) {
    p.push(part("高前山屏原创菱形几何浮雕", "extrude", plaster, [0, y!, -10.13], [1, 1, 1], [0, 0, 0], { depth: .04, profile: [{ x: -width! / 2, y: 0 }, { x: 0, y: .7 }, { x: width! / 2, y: 0 }, { x: 0, y: -.7 }] }));
    for (const side of [-1, 1]) { const eye = ring("前山屏菱形浮雕上的对称圆形木纹", dark, .18, .045, 0, .035); eye.position = { x: side * width! * .18, y: y!, z: -10.18 }; eye.rotation.x = 90; p.push(eye); }
  }
  p.push(box("高拱屏低门顶上真实横贯的完整木楣", 0, 2.1, -10.13, 9.8, .2, .25, wood));
  return p;
}

function kiribatiManeabaHouse(): ModelPart[] {
  const p: ModelPart[] = [box("低檐大议事屋内完整珊瑚砂踏坪", 0, .1, 0, 26, .2, 38, stone)], corners: Triple[] = [[-13, 1.4, -19], [13, 1.4, -19], [13, 1.4, 19], [-13, 1.4, 19]];
  p.push(slopePanel("从低西檐直收向高长脊的巨大茅坡", [corners[0]!, [0, 12.5, -7], [0, 12.5, 7], corners[3]!], .22, thatch), slopePanel("从低东檐直收向高长脊的巨大茅坡", [corners[1]!, [0, 12.5, -7], [0, 12.5, 7], corners[2]!], .22, thatch), slopePanel("低前檐向短脊端部升起的完整三角茅坡", [corners[0]!, corners[1]!, [0, 12.5, -7]], .22, thatch), slopePanel("低后檐向短脊端部升起的完整三角茅坡", [corners[2]!, corners[3]!, [0, 12.5, 7]], .22, thatch));
  const supports: ModelPart[] = [], framing: ModelPart[] = [];
  for (const z of [-17, -12, -6, 0, 6, 12, 17]) for (const side of [-1, 1]) supports.push(tapered("低檐下不腐朽的完整珊瑚石承柱", stone, [[side * 12.4, .2, z], [side * 12.4, 1.5, z]], [.3, .22]));
  for (const end of [-1, 1]) for (const x of [-9.3, -6.2, -3.1, 0, 3.1, 6.2, 9.3]) supports.push(tapered("议事屋前后低檐下的独立珊瑚石柱", stone, [[x, .2, end * 18.4], [x, 1.5, end * 18.4]], [.3, .22]));
  for (let i = 0; i < supports.length; i += 24) p.push(combineMeshes("完整保留所有低珊瑚石檐柱的外围承重圈", stone, supports.slice(i, i + 24)));
  for (const side of [-1, 1]) framing.push(meshBeam("低珊瑚柱上实际贯通全长的檐承枋", [side * 12.4, 1.6, -18.5], [side * 12.4, 1.6, 18.5], .2, wood), meshBeam("高木柱顶端贯通长屋脊两侧的高承檩", [side * 4.2, 8.7, -9.5], [side * 4.2, 8.7, 9.5], .27, wood));
  for (const end of [-1, 1]) framing.push(meshBeam("前后低檐珊瑚柱顶共同承托的完整横枋", [-12.4, 1.6, end * 18.4], [12.4, 1.6, end * 18.4], .2, wood));
  for (const z of [-9, -3, 3, 9]) {
    for (const side of [-1, 1]) {
      p.push(cylinder("两排实际落地并抬起主屋盖的通高木柱", side * 4.2, 4.45, z, .34, 8.5, wood));
      framing.push(meshBeam("高柱上端到中央高脊的长斜托木", [side * 4.2, 8.7, z], [0, 12.25, Math.max(-7, Math.min(7, z))], .24, wood), meshBeam("高柱下段接向跨梁的短抗摇撑", [side * 4.2, 7, z], [side * 2.6, 8.7, z], .18, wood));
      const lashing = ring("套住高承柱与承梁交接点的纤维绳扎圈", dark, .21, .035, 8.6, .24); lashing.position.x = side * 4.2; lashing.position.z = z; p.push(lashing);
    }
    framing.push(meshBeam("两排高木柱顶端之间完整横系梁", [-4.2, 8.7, z], [4.2, 8.7, z], .27, wood));
  }
  for (const z of [-7, -3, 3, 7]) for (const side of [-1, 1]) framing.push(meshBeam("从低珊瑚檐圈越过高木柱到主脊的完整长椽", [side * 12.4, 1.63, z], [0, 12.25, z], .23, wood));
  for (const end of [-1, 1]) for (const x of [-9.3, -6.2, -3.1, 0, 3.1, 6.2, 9.3]) framing.push(meshBeam("前后低檐柱向短脊端部放射的完整斜木", [x, 1.63, end * 18.4], [0, 12.25, end * 7], .2, wood));
  framing.push(meshBeam("双排高柱与各斜椽共同承住的完整长屋脊", [0, 12.25, -7], [0, 12.25, 7], .28, wood));
  for (let i = 0; i < framing.length; i += 16) p.push(combineMeshes("珊瑚柱圈与双排高柱之间全部真实承接木架", wood, framing.slice(i, i + 16)));
  for (const side of [-1, 1]) p.push(box("中央公共表演地坪旁的连续编席坐区", side * 8.1, .22, 0, 5.6, .04, 30, thatch));
  return p;
}
