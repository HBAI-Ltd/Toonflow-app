import { part, beam, type ModelPart, type Triple } from "../assetModelParts";
import { combineMeshes } from "../natureParts";
import { polygon } from "../masterNature/shared";
import { helicalFlight } from "../masterTransport/parts";
import { box, cylinder, cone, design } from "./structures";
import { doorWall, gableCover, slopePanel } from "./vernacularWorldBatchOne";
import { courseWall, endGable, ladder } from "./vernacularWorldBatchTwo";
import { hardWall } from "./vernacularWorldBatchThree";
import { meshBeam } from "./vernacularWorldBatchFive";

const wood = "#937756", stone = "#a5a99e", iron = "#5b7478", pale = "#c8c7ad", roof = "#778b84";

// https://www.nps.gov/subjects/heritagedocumentation/ncbrp-haer-documentation.htm
// https://npgallery.nps.gov/NRHP/GetAsset/NHLS/75000864_text
// https://www.parks.canada.ca/lhn-nhs/ns/edward/culture/architecture
export const vernacularWorldBatchSixDesigns = [
  design("交叉板格桁承重完整廊桥", "两侧贯通木板斜格在上下弦木之间交叉承重，横系梁承住长桥面，端部石台接入有屋盖的完整通车桥廊", townLatticeBridge, "建筑", "欧式"),
  design("双木拱叠竖桁承重完整廊桥", "两侧大木拱从低石台连续升起，并通过横向夹接连到多竖柱桁架，桥面和双坡屋盖在同一跨内贯通", burrArchBridge, "建筑", "欧式"),
  design("螺桩承六角值守居室灯塔", "七根斜直铁桩通过环撑承住环廊和六角居室，桩底保留螺叶，室内长梯穿过屋盖平台进入上部玻璃灯室", screwPileLighthouse, "建筑", "欧式"),
  design("外挑上层下射孔木碉屋", "厚木下室承住四面外挑的上层守卫室，真墙孔与悬挑地板下射槽相配，内梯连接两层并收在完整四坡屋盖内", overhangingBlockhouse, "建筑", "欧式"),
];

export function hardFloor(name: string, color: string, outline: [number, number][], height: number, position: Triple, holes: [number, number][][] = []): ModelPart {
  const value = polygon(name, color, outline, height, position, holes);
  value.vertices = value.indices!.map(index => ({ ...value.vertices![index]! })); value.indices = value.vertices.map((_, index) => index); return value;
}

function townLatticeBridge(): ModelPart[] {
  const p: ModelPart[] = [box("贯通格桁廊桥的完整木桥面", 0, 3.34, 0, 5.2, .18, 32, wood), ...gableCover("从两侧格桁弦木升起的长双坡木盖", 6.7, 34, 7.05, 1.9, roof)];
  for (const end of [-1, 1]) p.push(box("格桁桥端部落地实心石承台", 0, 1.5, end * 15, 8, 3, 3, stone), endGable(0, end * 16.5, 5.3, 7.3, 1.5, pale));
  const lattice: ModelPart[] = [];
  for (const side of [-1, 1]) {
    p.push(box("连续接入桥面边缘的下弦长木", side * 2.6, 3.53, 0, .27, .24, 32, wood), box("贯通格桁顶缘并支屋盖的上弦长木", side * 2.6, 7.2, 0, .27, .22, 32, wood));
    for (const direction of [-1, 1]) for (let i = 0; i < 29; i++) {
      const centerZ = -18.2 + i * 1.3, fromZ = centerZ - direction * 1.8, toZ = centerZ + direction * 1.8;
      const clipA = (-16 - fromZ) / (toZ - fromZ), clipB = (16 - fromZ) / (toZ - fromZ), from = Math.max(0, Math.min(clipA, clipB)), to = Math.min(1, Math.max(clipA, clipB));
      if (to - from < .025) continue;
      const at = (t: number): Triple => [side * 2.6 + direction * .055, 3.62 + 3.6 * t, fromZ + (toZ - fromZ) * t];
      const board = meshBeam("在端部按真实边界截断的交叉长斜板", at(from), at(to), .13, wood); board.scale.x = .11; board.scale.z = .19; lattice.push(board);
    }
    for (const z of [-16, 16]) p.push(box("桥洞两侧接上下弦的端立木", side * 2.6, 5.42, z, .26, 3.95, .26, wood));
  }
  for (let i = 0; i < lattice.length; i += 16) p.push(combineMeshes("保留全部空格与交接的承重板格桁", wood, lattice.slice(i, i + 16)));
  for (const z of [-15, -10, -5, 0, 5, 10, 15]) p.push(box("桥面下联通左右桁架的横系梁", 0, 3.125, z, 5.75, .25, .25, wood), box("屋盖下联通左右上弦的横系梁", 0, 7.2, z, 5.45, .22, .22, wood));
  return p;
}

function burrArchBridge(): ModelPart[] {
  const p: ModelPart[] = [box("双拱桁桥完整长木桥面", 0, 3.75, 0, 5.6, .18, 30, wood), ...gableCover("覆盖双木拱及竖桁的通长双坡屋盖", 7.2, 32, 7.5, 1.8, roof)];
  for (const end of [-1, 1]) p.push(box("承接木拱低脚与桥面的实心石台", 0, 1.75, end * 14.5, 8, 3.5, 4, stone), endGable(0, end * 15.5, 6.5, 7.515, 1.625, pale));
  const profile = Array.from({ length: 15 }, (_, i) => ({ x: 15 * Math.cos(i * Math.PI / 14), y: 1.4 + 5.8 * Math.sin(i * Math.PI / 14) }));
  profile.push(...Array.from({ length: 15 }, (_, i) => ({ x: 15 * Math.cos((14 - i) * Math.PI / 14), y: 1.13 + 5.8 * Math.sin((14 - i) * Math.PI / 14) })));
  const braces: ModelPart[] = [];
  for (const side of [-1, 1]) {
    p.push(box("通长多柱木桁的桥面下弦", side * 2.65, 3.94, 0, .26, .24, 29.2, wood), box("多柱木桁连续的高位上弦", side * 2.65, 7.55, 0, .26, .25, 29.2, wood));
    for (const offset of [2.95, 3.2]) p.push(part("石承台之间连续起拱的完整弧形木拱", "extrude", wood, [side * offset, 0, 0], [1, 1, 1], [0, 90, 0], { profile, depth: .18 }));
    for (let i = 0; i < 7; i++) {
      const z = -14 + i * 14 / 3; p.push(box("上下弦之间的独立竖桁木", side * 2.65, 5.75, z, .22, 3.6, .22, wood));
      if (i < 6) braces.push(meshBeam("多柱桁架两立木之间的真实长斜腹杆", [side * 2.65, i < 3 ? 3.94 : 7.55, z], [side * 2.65, i < 3 ? 7.55 : 3.94, z + 14 / 3], .17, wood));
      if (i > 0 && i < 6) { const y = 1.4 + 5.8 * Math.sqrt(1 - (z / 15) ** 2); p.push(box("把双木拱夹接至竖桁的横向穿木", side * 2.95, y - .12, z, .85, .22, .24, wood)); }
    }
  }
  p.push(combineMeshes("真实保留全部多柱桁架斜腹杆", wood, braces));
  for (const z of [-14, -7, 0, 7, 14]) p.push(box("承住桥面并接入左右下弦的横梁", 0, 3.55, z, 5.7, .24, .25, wood), box("两侧上弦之间的屋盖横系木", 0, 7.55, z, 5.7, .24, .22, wood));
  return p;
}

function screwPileLighthouse(): ModelPart[] {
  const hex = (radius: number): [number, number][] => Array.from({ length: 6 }, (_, i) => [Math.cos(i * Math.PI / 3) * radius, Math.sin(i * Math.PI / 3) * radius]);
  const p: ModelPart[] = [cylinder("六外斜桩之间的通高中央铁桩", 0, 2.65, 0, .29, 5.3, iron), hardFloor("七桩共同承托的完整六角环廊地板", wood, hex(5.3), .2, [0, 4.9, 0])];
  const braces: ModelPart[] = [], railings: ModelPart[] = [];
  for (let i = 0; i < 6; i++) {
    const a = i * Math.PI / 3, b = (i + 1) * Math.PI / 3, at = (angle: number, radius: number, y: number): Triple => [Math.cos(angle) * radius, y, Math.sin(angle) * radius];
    p.push({ ...beam("向外展脚的完整斜置承重铁桩", iron, at(a, 5.5, .15), at(a, 4.5, 5), .28), shape: "cylinder" });
    const flight = helicalFlight(at(a, 5.5, .08), .14, .42, .45, 1.5, 1, .025); flight.name = "承重桩脚嵌地的连续螺旋叶"; flight.color = iron; p.push(flight);
    braces.push(meshBeam("相邻外桩之间的中段环向连接", at(a, 5, 2.575), at(b, 5, 2.575), .12, iron), meshBeam("相邻外桩交叉斜撑之一", at(a, 5.38, .73), at(b, 4.62, 4.42), .11, iron), meshBeam("相邻外桩交叉斜撑之二", at(b, 5.38, .73), at(a, 4.62, 4.42), .11, iron), meshBeam("由中央铁桩承台伸向六角地板的径向主梁", [0, 4.84, 0], at(a, 4.65, 4.84), .25, iron));
    const corners = hex(4.2), first = corners[i]!, next = corners[(i + 1) % 6]!, dx = next[0] - first[0], dz = next[1] - first[1], yaw = Math.atan2(dz, dx), cx = (first[0] + next[0]) / 2, cz = (first[1] + next[1]) / 2;
    if (i === 4) p.push(...doorWall("从环廊进入值守居室的真实门洞", 0, cz, 4.2, 3.2, .16, 1.1, 2.15, pale, 5.1));
    else p.push(hardWall("值守居室侧墙上真正贯通的采光窗", 4.2, 3.2, .16, [cx - Math.sin(yaw) * .08, 5.1, cz + Math.cos(yaw) * .08], [[[-.65, .9], [.65, .9], [.65, 2.1], [-.65, 2.1]]], pale, yaw * 180 / Math.PI));
    const firstRoof: Triple = [Math.cos(a) * 4.8, 8.06, Math.sin(a) * 4.8], nextRoof: Triple = [Math.cos(b) * 4.8, 8.06, Math.sin(b) * 4.8], firstTop: Triple = [Math.cos(a) * 1.2, 10.6, Math.sin(a) * 1.2], nextTop: Triple = [Math.cos(b) * 1.2, 10.6, Math.sin(b) * 1.2];
    p.push(slopePanel("从六角住室斜收至上部灯室平台的金属屋坡", [firstRoof, nextRoof, nextTop, firstTop], .16, roof));
    railings.push(meshBeam("环廊外缘从地板起立的护栏角柱", at(a, 5.12, 5.1), at(a, 5.12, 6.18), .075, pale));
    if (i === 4) for (const side of [-1, 1]) railings.push(meshBeam("环廊前侧避开登塔梯口的扶手", [side * .66, 6.18, -5.12 * Math.sin(Math.PI / 3)], [side * 2.56, 6.18, -5.12 * Math.sin(Math.PI / 3)], .075, pale), meshBeam("登塔梯口两侧独立护栏立柱", [side * .66, 5.1, -5.12 * Math.sin(Math.PI / 3)], [side * .66, 6.18, -5.12 * Math.sin(Math.PI / 3)], .075, pale));
    else railings.push(meshBeam("六角环廊各边连续护栏扶手", at(a, 5.12, 6.18), at(b, 5.12, 6.18), .075, pale));
  }
  for (let i = 0; i < braces.length; i += 16) p.push(combineMeshes("七桩承台下全部保留的环撑与交叉撑", iron, braces.slice(i, i + 16)));
  p.push(combineMeshes("环廊避开梯口的全部连续护栏", pale, railings), hardFloor("室内长梯穿入灯室的有洞六角平台", wood, hex(1.5), .18, [0, 10.6, 0], [[[-.46, -.46], [.46, -.46], [.46, .46], [-.46, .46]]]), ...ladder("值守居室穿过真平台洞口的内长梯", 0, 5.1, -.2, 11.4, .25, 21), ...ladder("由外侧登上六角环廊的独立斜木梯", 0, .2, -8, 5.9, -4.4, 16));
  const glass = cylinder("上部可透视的完整玻璃灯室", 0, 11.455, 0, 2.5, 1.35, "#b0d0cd"); glass.opacity = .3; glass.roughness = .13;
  p.push(glass, cone("玻璃灯室之上的完整尖金属帽", 0, 12.55, 0, 3, .9, roof), cylinder("玻璃灯室内支起灯器的中央金属座", 0, 11.03, 0, .3, .5, iron), part("上部玻璃灯室中可见的发光透镜体", "cylinder", "#e2d5a1", [0, 11.55, 0], [.6, .6, .6], [0, 0, 0], { emissive: "#e2d5a1", emissiveIntensity: .65 }));
  for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; p.push(cylinder("从平台接到金属帽的灯室细框柱", Math.cos(a) * 1.24, 11.45, Math.sin(a) * 1.24, .065, 1.45, iron)); }
  return p;
}

function overhangingBlockhouse(): ModelPart[] {
  const p: ModelPart[] = [box("木碉屋落地防潮基础", 0, .1, 0, 6.5, .2, 6.5, stone), courseWall("下层门端完整叠木墙", 0, -3, 6.2, .3, .2, 8, .375, wood, 0, 1.05, 6), courseWall("下层背面完整叠木墙", 0, 3, 6.2, .3, .2, 8, .375, wood)];
  for (const side of [-1, 1]) p.push(courseWall("下层两侧完整叠木承重墙", side * 3, 0, 6.2, .3, .2, 8, .375, wood, 90), box("从下层墙头向两边悬挑的上层主梁", side * 2.6, 3.17, 0, .3, .25, 8, wood), box("从下层墙头向前后悬挑的上层主梁", 0, 3.17, side * 2.6, 8, .25, .3, wood));
  const slots: [number, number][][] = [[[.85, .3], [1.75, .3], [1.75, 1.35], [.85, 1.35]]];
  for (const side of [-1, 1]) slots.push([[side * 3.5 - .125, -.6], [side * 3.5 + .125, -.6], [side * 3.5 + .125, .6], [side * 3.5 - .125, .6]], [[-.6, side * 3.5 - .125], [.6, side * 3.5 - .125], [.6, side * 3.5 + .125], [-.6, side * 3.5 + .125]]);
  p.push(hardFloor("真实外挑地板保留四个下射槽与内梯洞", wood, [[-4, -4], [4, -4], [4, 4], [-4, 4]], .2, [0, 3.2, 0], slots), ...ladder("上下守卫室通过真实地板洞相连的内梯", 1.3, .2, 1.7, 4, .55, 10));
  const loops: [number, number][][] = [-2.3, 0, 2.3].map(x => [[x - .2, 1.45], [x + .2, 1.45], [x + .2, 1.85], [x - .2, 1.85]]);
  for (const side of [-1, 1]) p.push(hardWall("上守卫室前后木墙真正贯通的三枪眼", 7.8, 3, .3, [0, 3.4, side * 3.9 + .15], loops, wood), hardWall("上守卫室左右木墙真正贯通的三枪眼", 7.8, 3, .3, [side * 3.9 - .15, 3.4, 0], loops, wood, 90));
  const corners: Triple[] = [[-4.6, 6.2, -4.6], [4.6, 6.2, -4.6], [4.6, 6.2, 4.6], [-4.6, 6.2, 4.6]];
  for (let i = 0; i < 4; i++) p.push(slopePanel("完整四面外伸并收至尖顶的木碉屋屋坡", [corners[i]!, corners[(i + 1) % 4]!, [0, 8.2, 0]], .16, roof));
  return p;
}
