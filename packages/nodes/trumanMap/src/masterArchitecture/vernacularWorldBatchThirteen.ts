import { part, ring, type ModelPart, type Triple } from "../assetModelParts";
import { combineMeshes } from "../natureParts";
import { tapered } from "../masterNature/shared";
import { box, cylinder, design } from "./structures";
import { barrelRoof, halfRoundFloor, halfRoundWall } from "./spatialShells";
import { doorWall, slopePanel } from "./vernacularWorldBatchOne";
import { solidBox } from "./vernacularWorldBatchThree";
import { meshBeam } from "./vernacularWorldBatchFive";
import { hardFloor } from "./vernacularWorldBatchSix";

const wood = "#8d7355", stone = "#a4a596", earth = "#a18e70", turf = "#849071", thatch = "#ab9f78", woven = "#ab9b75";

// 公开构造资料用于辨认完整类型；尺度、顶点和各空间装配均在本地原创。
// https://forestryandland.gov.scot/media/wfxpad45/to-build-a-broch-fls-2022.pdf
// https://darbazi.org/pages/keghoshvili-darbazi.html
// https://folklife.si.edu/talkstory/2015/traditional-homes-of-georgia-the-reason-to-be-proud
// https://www.patrimoniocultural.gob.cl/sites/www.patrimoniocultural.gob.cl/files/2024-08/Anexo%20I.%20Antecedentes%20Generales%20RN.pdf
export const vernacularWorldBatchThirteenDesigns = [
  design("放射石墩叠涩凹室轮形住屋", "低外石围内的八道楔形放射石墩逐层挑出，分别托住周边凹室的厚石顶和覆草环帽，中央木茅锥盖留通烟口，低前道接到围绕火床的公共厅", wheelhouseResidence, "建筑", "欧式"),
  design("母柱托木冠覆土方厅家宅", "方石厅内沿墙木柱和独立宽头母柱共同托起七级内收木冠，顶心天窗真正贯通覆土壳，前廊分接厨房与睡室，后侧畜室和三面覆土屋台连成完整家宅", darbaziCrownedHouse, "建筑", "异域"),
  design("插杆石圈低舟壳住居", "长窄舟形石地圈中的每段石材都有真实插杆孔，成对弯杆从石孔弓起支承近地植物屋壳，单一低侧门接短拱罩和半圆石铺前坪，屋内两侧留睡席与中央通路", harePaengaHouse, "建筑", "异域"),
];

export function packMeshes(name: string, color: string, pieces: ModelPart[]): ModelPart[] {
  const result: ModelPart[] = [];
  let batch: ModelPart[] = [], count = 0;
  for (const value of pieces) {
    const size = value.vertices!.length;
    if (batch.length && count + size > 480) { result.push(combineMeshes(name, color, batch)); batch = []; count = 0; }
    batch.push(value); count += size;
  }
  if (batch.length) result.push(combineMeshes(name, color, batch));
  return result;
}

function wheelhouseResidence(): ModelPart[] {
  const p: ModelPart[] = [cylinder("轮形公共厅及各凹室共同的完整低石坪", 0, .1, 0, 13.2, .2, earth), halfRoundWall("低外石围真正避开入口长道的厚壁", 6, .6, 2.6, [0, .2, 0], -277.5, stone, Math.PI * 23 / 12), halfRoundWall("低石围外三面包住住屋的厚覆土堤", 7.1, 1.15, 1.6, [0, 0, 0], -285, earth, Math.PI * 11 / 6), box("贯通外土堤和低石门的完整入口坪", 0, .1, -6.9, 1.5, .2, 2.8, stone), box("低门洞上方接到外石围顶的实石门楣", 0, 2.39, -5.96, 1.75, .82, .65, stone), box("入口石长道真正接到内厅的厚顶板", 0, 1.88, -6.9, 1.8, .2, 2.8, stone)], piers: ModelPart[] = [], caps: ModelPart[] = [], beds: ModelPart[] = [], roof: ModelPart[] = [], framing: ModelPart[] = [];
  for (const side of [-1, 1]) p.push(box("低入口两侧真实连续到石门内缘的厚壁", side * .72, 1, -6.9, .3, 1.6, 2.8, stone));
  const at = (r: number, y: number, a: number): Triple => [Math.cos(a) * r, y, Math.sin(a) * r];
  for (let i = 0; i < 8; i++) {
    const a = (22.5 + i * 45) * Math.PI / 180, outline = (innerHalf: number, outerHalf: number): [number, number][] => [[2.4, a - innerHalf], [5.76, a - outerHalf], [5.76, a + outerHalf], [2.4, a + innerHalf]].map(([r, t]) => [Math.cos(t!) * r!, Math.sin(t!) * r!]);
    piers.push(hardFloor("从低石坪向外围厚壁展开的完整楔形放射墩", stone, outline(4 * Math.PI / 180, 8 * Math.PI / 180), 1.55, [0, .2, 0]));
    for (let row = 0; row < 5; row++) piers.push(hardFloor("放射石墩上向相邻凹室逐级挑出的承顶石层", stone, outline((5.2 + row * 1.2) * Math.PI / 180, (9.2 + row * 1.2) * Math.PI / 180), .2, [0, 1.75 + row * .18, 0]));
    const left = a + 14 * Math.PI / 180, right = a + 31 * Math.PI / 180, middle = a + Math.PI / 8;
    caps.push(hardFloor("相邻放射墩上真实跨合凹室顶部的厚封口石", stone, [[2.4, a + 10 * Math.PI / 180], [6.0, left], [6.0, middle], [6.0, right], [2.4, a + 35 * Math.PI / 180], [2.4, middle]].map(([r, t]) => [Math.cos(t!) * r!, Math.sin(t!) * r!]), .2, [0, 2.66, 0]));
    if (i !== 5) beds.push(hardFloor("各石凹室内抬高并直接落地的完整坐卧台", stone, [[3.3, a + 11 * Math.PI / 180], [5.35, a + 12 * Math.PI / 180], [5.35, a + 33 * Math.PI / 180], [3.3, a + 34 * Math.PI / 180]].map(([r, t]) => [Math.cos(t!) * r!, Math.sin(t!) * r!]), .35, [0, .2, 0]));
    framing.push(meshBeam("中央锥盖从内石环起收至烟口的独立木椽", at(2.5, 2.98, a), at(.25, 4.98, a), .13, wood));
  }
  for (let i = 0; i < 24; i++) { const a = i * Math.PI / 12, b = (i + 1) * Math.PI / 12; roof.push(slopePanel("覆盖周边石凹室并连续接到中心茅盖的低覆草环帽", [at(6.3, 2.92, a), at(6.3, 2.92, b), at(2.4, 3.15, b), at(2.4, 3.15, a)], .18, turf)); }
  p.push(...packMeshes("全部放射石墩和上挑石层完整保留", stone, piers), ...packMeshes("全部凹室真实跨缝石顶板和抬高坐卧台", stone, [...caps, ...beds]), ...packMeshes("低外围连成整环的覆草厚屋帽", turf, roof), ...packMeshes("中央茅锥盖在内石环上的实际木承肋", wood, framing), ring("中央木茅锥真正坐在封口石内缘上的木环承枋", wood, 2.56, .14, 2.94, .16), part("真正保留顶心烟口的完整中央厚茅锥壳", "lathe", thatch, [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 2.7, y: 3.02 }, { x: .25, y: 5.15 }, { x: .25, y: 4.99 }, { x: 2.5, y: 3.02 }] }), box("中央公共厅完整不燃石火床", 0, .27, 0, 1.8, .14, 1.4, stone));
  return p;
}

function darbaziCrownedHouse(): ModelPart[] {
  const p: ModelPart[] = [box("前廊厨房睡室与木冠方厅共用完整低石坪", 0, .1, .2, 18, .2, 16.4, stone)], walls: ModelPart[] = [], timber: ModelPart[] = [], mud: ModelPart[] = [], cx = -3.8, cz = 3.7;
  for (const [left, right] of [[-8.8, -.6], [.6, 8.8]]) walls.push(solidBox("唯一前入口两侧与石墙连成完整正立面的厚壁", (left! + right!) / 2, 1.575, -7.8, right! - left!, 2.75, .45, stone));
  walls.push(solidBox("唯一外门上方完整承住屋台的厚石门楣", 0, 2.65, -7.8, 1.2, .6, .45, stone), solidBox("覆土家宅背后连续落地的完整厚石墙", 0, 1.575, 8.2, 17.6, 2.75, .5, stone));
  for (const side of [-1, 1]) walls.push(solidBox("三面覆土之内保留真实室内空腔的长侧石壁", side * 8.8, 1.575, .2, .5, 2.75, 16, stone));
  for (const side of [-1, 1]) for (const value of doorWall("前廊分入厨房和睡室的真实内门", 0, 0, 7, 2.75, .18, 1.05, 2.1, wood, .2)) {
    const { x, y } = value.position; timber.push(solidBox(value.name, side * 1.2, y, -4.3 - x, .18, value.scale.y, value.scale.x, wood));
  }
  for (const [left, right] of [[-8.8, -.55], [.55, 1.2]]) walls.push(solidBox("前廊真正进入后木冠方厅的石门旁隔壁", (left! + right!) / 2, 1.575, -.8, right! - left!, 2.75, .3, stone));
  walls.push(solidBox("由前廊进入方厅实际低门的完整门头", 0, 2.625, -.8, 1.1, .65, .3, stone));
  for (const [a, b] of [[-.8, .7], [1.9, 5.4], [6.6, 8.2]]) walls.push(solidBox("方厅右侧分开睡室和畜室的连续厚隔壁", 1.2, 1.575, (a! + b!) / 2, .28, 2.75, b! - a!, stone));
  for (const z of [1.3, 6]) walls.push(solidBox("方厅侧门上方保持真实通行口的厚门头", 1.2, 2.625, z, .28, .65, 1.2, stone));
  for (const [left, right] of [[1.2, 3.95], [5.05, 8.8]]) timber.push(solidBox("睡室与后畜室之间实际保留小门的木隔板", (left! + right!) / 2, 1.3, 3.7, right! - left!, 2.2, .12, wood));
  timber.push(solidBox("睡室通入后畜室的小门木楣", 4.5, 2.3, 3.7, 1.1, .2, .12, wood));
  const corners: [number, number][] = [[-8.65, -.65], [1.05, -.65], [1.05, 8.05], [-8.65, 8.05]];
  for (let i = 0; i < 16; i++) {
    if (i === 4) continue;
    const a = corners[Math.floor(i / 4)]!, b = corners[(Math.floor(i / 4) + 1) % 4]!, t = i % 4 / 4, x = a[0] + (b[0] - a[0]) * t, z = a[1] + (b[1] - a[1]) * t;
    timber.push(meshBeam("沿方厅石壁立起而直接承住大木框的独立木柱", [x, .2, z], [x, 2.95, z], .19, wood));
  }
  for (let i = 0; i < 4; i++) { const a = corners[i]!, b = corners[(i + 1) % 4]!; timber.push(meshBeam("十五沿墙柱顶相接并实际托起木冠的整根大承梁", [a[0], 2.94, a[1]], [b[0], 2.94, b[1]], .44, wood)); }
  for (let row = 0; row < 7; row++) {
    const r = 4.15 - row * .5, y = 3.1 + row * .24;
    for (const side of [-1, 1]) timber.push(solidBox("方木冠逐层搭角内收的完整横枋", cx, y, cz + side * r, r * 2 + .7, .25, .7, wood), solidBox("方木冠逐层搭角内收的完整纵枋", cx + side * r, y, cz, .7, .25, r * 2 + .7, wood));
  }
  p.push(part("直接托到上部木冠承枋的宽头独立母柱", "extrude", wood, [cx, .2, 1.55], [1, 1, 1], [0, 0, 0], { depth: .4, profile: [{ x: -.25, y: 0 }, { x: .25, y: 0 }, { x: .22, y: 2.6 }, { x: .6, y: 3.12 }, { x: .6, y: 3.465 }, { x: -.6, y: 3.465 }, { x: -.6, y: 3.12 }, { x: -.22, y: 2.6 }] }));
  timber.push(solidBox("母柱宽头上真实接到木冠的长枕梁", cx, 3.8, 1.55, 2.6, .27, .6, wood));
  mud.push(hardFloor("各低屋台连续相连且真正避开方木冠的完整平泥屋盖", earth, [[-9.1, -8.1], [9.1, -8.1], [9.1, 8.5], [-9.1, 8.5]], .25, [0, 2.97, 0], [[[-8.3, -.8], [.7, -.8], [.7, 8.2], [-8.3, 8.2]]]));
  const bottom: Triple[] = [[cx - 4.5, 3.18, cz - 4.5], [cx + 4.5, 3.18, cz - 4.5], [cx + 4.5, 3.18, cz + 4.5], [cx - 4.5, 3.18, cz + 4.5]], top: Triple[] = [[cx - .8, 4.95, cz - .8], [cx + .8, 4.95, cz - .8], [cx + .8, 4.95, cz + .8], [cx - .8, 4.95, cz + .8]];
  for (let i = 0; i < 4; i++) mud.push(slopePanel("方厅木冠之外真正留出顶心烟窗的覆土厚壳", [bottom[i]!, bottom[(i + 1) % 4]!, top[(i + 1) % 4]!, top[i]!], .18, earth));
  p.push(...packMeshes("方厅厨房睡室和后畜室的完整石墙与内门", stone, walls), ...packMeshes("沿墙柱大承梁与七级木冠的全部真实木构", wood, timber), ...packMeshes("平屋台与顶心留孔的完整覆土屋壳", earth, mud), box("木冠烟窗正下方完整不燃石火床", cx, .27, 3.7, 1.8, .14, 1.4, stone), box("睡室中实际落地的完整低木卧台", 5.4, .42, .5, 3.8, .44, 1.8, wood), box("厨房内与前廊分开的低石工作台", -5.2, .6, -5.6, 3.8, .8, .9, stone), box("屋宅后缘从地面包覆到屋台的完整土堤", 0, 1.61, 9.3, 21.2, 3.22, 1.6, earth), box("右侧实际托住并连到平屋台的厚土堤", 9.85, 1.61, .2, 1.5, 3.22, 16.6, earth), box("左侧后段实际接到屋台的厚覆土堤", -9.85, 1.61, 3.8, 1.5, 3.22, 9.4, earth), part("从前地坪完整升到左侧平屋台的实楔土坡道", "extrude", earth, [-9.85, 0, 0], [1, 1, 1], [0, 90, 0], { depth: 1.5, profile: [{ x: 8.7, y: 0 }, { x: .9, y: 0 }, { x: .9, y: 3.22 }] }));
  return p;
}

function harePaengaHouse(): ModelPart[] {
  const p: ModelPart[] = [hardFloor("低舟壳内真实完整的长窄压实地坪", earth, Array.from({ length: 32 }, (_, i) => [Math.cos(i * Math.PI / 16) * 1.7, Math.sin(i * Math.PI / 16) * 7.85] as [number, number]), .18, [0, 0, 0]), halfRoundFloor("低侧门前与长舟壳相接的完整半圆石铺前坪", 2.4, .15, [1.8, 0, 0], 90, stone)], foundation: ModelPart[] = [], framing: ModelPart[] = [], cover: ModelPart[] = [];
  for (let i = 0; i < 24; i++) {
    const a = i * Math.PI / 12, left = a - Math.PI / 24 + .004, right = a + Math.PI / 24 - .004, hole: [number, number][] = Array.from({ length: 8 }, (_, j) => [Math.cos(a) * 1.825 + Math.cos(j * Math.PI / 4) * .065, Math.sin(a) * 8.025 + Math.sin(j * Math.PI / 4) * .065]), outline: [number, number][] = [[2, 8.2, left], [2, 8.2, a], [2, 8.2, right], [1.65, 7.85, right], [1.65, 7.85, a], [1.65, 7.85, left]].map(([rx, rz, t]) => [Math.cos(t!) * rx!, Math.sin(t!) * rz!]);
    const holes = [hole];
    if (i === 0) for (const z of [-.55, .55]) holes.push(Array.from({ length: 8 }, (_, j): [number, number] => [1.825 + Math.cos(j * Math.PI / 4) * .065, z + Math.sin(j * Math.PI / 4) * .065]));
    foundation.push(hardFloor("舟形地圈每段石材中真正贯通的独立插杆孔", stone, outline, .32, [0, 0, 0], holes));
  }
  for (const z of [-7.752, -6.95, -5.675, -4.0125, -2.077, 0, 2.077, 4.0125, 5.675, 6.95, 7.752]) {
    const r = Math.sqrt(1 - (z / 8.025) ** 2), path: Triple[] = Array.from({ length: 9 }, (_, i) => { const a = i * Math.PI / 8; return [Math.cos(a) * 1.825 * r, .18 + Math.sin(a) * (2.55 * r + .08), z]; });
    const openPath = z === 0 ? path.slice(1) : path;
    framing.push(tapered("脚端插入真实石孔并避开侧门的长弯杆", wood, openPath, Array(openPath.length).fill(.04)));
  }
  for (const z of [-8.025, 8.025]) framing.push(meshBeam("舟形两尖端实际插入独立石孔的短端杆", [0, .18, z], [0, .53, z], .075, wood));
  for (const z of [-.55, .55]) framing.push(meshBeam("低侧门两边实际插入石孔并上托门楣的斜木门梃", [1.825, .18, z], [1.69, 1.2, z], .075, wood));
  framing.push(meshBeam("低侧门内缘实际承接半弯杆而保留通行的长木楣", [1.69, 1.2, -.6], [1.69, 1.2, .6], .08, wood));
  const zs = [-8.08, -7.55, -6.4, -4.5, -2.3, -.55, .55, 2.3, 4.5, 6.4, 7.55, 8.08], surface = (z: number, a: number): Triple => { const r = Math.sqrt(Math.max(.001, 1 - (z / 8.12) ** 2)); return [Math.cos(a) * (1.86 * r + .025), .35 + Math.sin(a) * (2.55 * r + .09), z]; };
  for (let span = 0; span < zs.length - 1; span++) for (let row = 0; row < 8; row++) {
    if (row === 0 && zs[span] === -.55) continue;
    const a = row * Math.PI / 8, b = (row + 1) * Math.PI / 8, corners = [surface(zs[span]!, a), surface(zs[span + 1]!, a), surface(zs[span + 1]!, b), surface(zs[span]!, b)];
    cover.push(slopePanel("长舟壳实际避开唯一低侧门的植物覆层三角片", [corners[0]!, corners[1]!, corners[2]!], .17, thatch), slopePanel("长舟壳随船端收尖的连续植物覆层三角片", [corners[0]!, corners[2]!, corners[3]!], .17, thatch));
  }
  for (const end of [-1, 1]) {
    const profile: [number, number][] = [[-.21, .28], [.21, .28], ...Array.from({ length: 7 }, (_, i) => { const a = (i + 1) * Math.PI / 8; return [Math.cos(a) * .21, .35 + Math.sin(a) * .35] as [number, number]; })], cap = hardFloor("近地舟端真正封合到石边的薄植物端盖", thatch, profile, .09, [0, 0, end * 8.08 + .045]); cap.rotation.x = -90; cover.push(cap);
  }
  const hood = barrelRoof("低侧门外真正接入舟壳的短窄植物拱罩", 1, .09, 1.2, [2.2, .35, 0], thatch); hood.scale.x = .6; hood.rotation.y = 90;
  p.push(...packMeshes("舟形石地圈全部保留真实插杆孔的独立石段", stone, foundation), ...packMeshes("从石孔完整接起舟形植物盖的全部弯木承肋", wood, framing), ...packMeshes("低舟形住居完整的植物屋壳与真实侧门口", thatch, cover), hood, box("入口通道一侧实际铺在内地坪上的长睡席", -.72, .2, -3.4, .75, .04, 4.2, woven), box("入口通道另一侧实际铺在内地坪上的长睡席", .72, .2, 3.4, .75, .04, 4.2, woven));
  return p;
}
