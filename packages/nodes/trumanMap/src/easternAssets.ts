import { asset, beam, part, pitchedRoof, ring } from "./assetModelParts";
import type { ModelPart, Triple } from "./assetModelParts";
import type { SceneAsset } from "./sceneDocument";

const wood = "#886548";
const darkWood = "#5b4839";
const bamboo = "#9aab72";
const stone = "#b6b6a3";
const tile = "#52635f";
const plaster = "#dbd5bd";
const red = "#a44f3d";
const brass = "#b29a60";
const paper = "#e4d9b6";

function legs(width: number, depth: number, height: number, thickness = 0.075, color = wood): ModelPart[] {
  return [-1, 1].flatMap(x => [-1, 1].map(z => part("承重桌椅腿", "box", color, [x * width / 2, height / 2, z * depth / 2], [thickness, height, thickness])));
}

function posts(width: number, depth: number, height: number, color = wood, base = 0): ModelPart[] {
  return [-1, 1].flatMap(x => [-1, 1].map(z => part("木构立柱", "box", color, [x * width / 2, base + height / 2, z * depth / 2], [0.15, height, 0.15])));
}

function wheel(x: number, y: number, z: number, radius: number): ModelPart[] {
  const parts = [part("带铁箍木轮", "torus", darkWood, [x, y, z], [radius * 2, radius * 2, 0.3], [0, 90, 0]), part("车轮轴帽", "cylinder", brass, [x, y, z], [radius * 0.3, 0.22, radius * 0.3], [0, 0, 90])];
  for (let index = 0; index < 8; index++) {
    const angle = index * Math.PI / 4;
    parts.push(beam("木轮辐条", wood, [x, y, z], [x, y + Math.sin(angle) * radius * 0.75, z + Math.cos(angle) * radius * 0.75], 0.035));
  }
  return parts;
}

function vessel(name: string, color: string, position: Triple, radius: number, height: number, neck = 0.72): ModelPart {
  return part(name, "lathe", color, position, [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: radius * 0.7, y: 0 }, { x: radius, y: height * 0.25 }, { x: radius * 0.95, y: height * 0.62 }, { x: radius * neck, y: height * 0.9 }, { x: radius * neck, y: height }, { x: radius * neck - 0.018, y: height }, { x: radius * neck - 0.018, y: height * 0.88 }, { x: radius * 0.83, y: height * 0.6 }, { x: radius * 0.85, y: height * 0.25 }, { x: 0, y: 0.035 }], roughness: 0.34 });
}

function polygonRoof(sides: number, radius: number, y: number, color: string): ModelPart {
  const vertices = [{ x: 0, y: 0.85, z: 0 }, { x: 0, y: 0.67, z: 0 }];
  for (const level of [0.1, 0]) for (let index = 0; index < sides; index++) vertices.push({ x: Math.cos(index * Math.PI * 2 / sides) * radius, y: level, z: Math.sin(index * Math.PI * 2 / sides) * radius });
  const indices: number[] = [];
  for (let index = 0; index < sides; index++) {
    const next = (index + 1) % sides;
    indices.push(0, next + 2, index + 2, 1, sides + index + 2, sides + next + 2, index + 2, next + 2, sides + next + 2, index + 2, sides + next + 2, sides + index + 2);
  }
  return part("多角攒尖屋顶", "mesh", color, [0, y, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

function boatHull(length: number, width: number, color: string): ModelPart {
  const vertices: { x: number; y: number; z: number }[] = [];
  for (let row = 0; row < 5; row++) {
    const half = width * [0.08, 0.43, 0.5, 0.43, 0.08][row]!;
    const edge = row === 0 || row === 4 ? 0.63 : 0.48;
    const z = (row / 4 - 0.5) * length;
    vertices.push({ x: -half, y: edge, z }, { x: 0, y: 0.04 + Math.abs(row - 2) * 0.08, z }, { x: half, y: edge, z }, { x: -half * 0.84, y: edge, z }, { x: 0, y: 0.18 + Math.abs(row - 2) * 0.08, z }, { x: half * 0.84, y: edge, z });
  }
  const indices: number[] = [];
  const edges = [[0, 1], [1, 2], [2, 5], [5, 4], [4, 3], [3, 0]];
  for (let row = 0; row < 4; row++) for (const [a, b] of edges) {
    const first = row * 6;
    const next = first + 6;
    indices.push(first + a!, first + b!, next + b!, first + a!, next + b!, next + a!);
  }
  for (const [a, b] of [[0, 1], [1, 2]]) {
    indices.push(a!, a! + 3, b! + 3, a!, b! + 3, b!, 24 + a!, 24 + b!, 27 + b!, 24 + a!, 27 + b!, 27 + a!);
  }
  return part("中空木船壳", "mesh", color, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

function archedCanopy(name: string, color: string, width: number, height: number, depth: number, position: Triple): ModelPart {
  const outer = Array.from({ length: 9 }, (_, index) => ({ x: Math.cos(index * Math.PI / 8) * width / 2, y: Math.sin(index * Math.PI / 8) * height }));
  const inner = Array.from({ length: 9 }, (_, index) => ({ x: Math.cos(Math.PI - index * Math.PI / 8) * (width / 2 - 0.035), y: Math.sin(index * Math.PI / 8) * (height - 0.035) }));
  return part(name, "extrude", color, position, [1, 1, 1], [0, 0, 0], { depth, profile: [...outer, ...inner] });
}

function parasol(radius: number, height: number, spokes: number, color: string): ModelPart[] {
  const vertices = [{ x: 0, y: height, z: 0 }, ...Array.from({ length: spokes }, (_, index) => ({ x: Math.cos(index * Math.PI * 2 / spokes) * radius, y: height - radius * 0.34, z: Math.sin(index * Math.PI * 2 / spokes) * radius }))];
  const indices = Array.from({ length: spokes }, (_, index) => [0, (index + 1) % spokes + 1, index + 1, 0, index + 1, (index + 1) % spokes + 1]).flat();
  const parts = [part("纸伞伞面", "mesh", color, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices }), part("竹伞柄", "cylinder", darkWood, [0, height / 2, 0], [0.035, height, 0.035])];
  for (let index = 0; index < spokes; index++) parts.push(beam("伞骨", bamboo, [0, height - 0.03, 0], [vertices[index + 1]!.x, vertices[index + 1]!.y - 0.018, vertices[index + 1]!.z], 0.012));
  return parts;
}

function animalGuardian(color: string, cat = false): ModelPart[] {
  const parts = [part("雕像座台", "box", stone, [0, 0.1, 0], [0.72, 0.2, 0.85]), part("雕像躯干", "sphere", color, [0, 0.58, -0.1], [0.49, 0.72, 0.6]), part("雕像头部", "sphere", color, [0, 1.03, 0.1], [0.53, 0.49, 0.47]), part("口鼻", "sphere", color, [0, 0.94, 0.32], [0.32, 0.21, 0.22])];
  for (const side of [-1, 1]) {
    parts.push(part("前爪", "capsule", color, [side * 0.19, 0.47, 0.2], [0.16, 0.55, 0.19]));
    parts.push(part("后腿", "sphere", color, [side * 0.2, 0.34, -0.27], [0.24, 0.27, 0.3]));
    parts.push(part("耳朵", cat ? "cone" : "sphere", color, [side * 0.2, 1.25, 0.06], [0.16, cat ? 0.23 : 0.16, 0.14]));
    parts.push(part("眼睛", "sphere", "#454f46", [side * 0.115, 1.08, 0.31], [0.048, 0.045, 0.025]));
  }
  return parts;
}

function chineseBuildings(): SceneAsset[] {
  const pavilion = [part("六角石台", "cylinder", stone, [0, 0.15, 0], [3.8, 0.3, 3.8]), polygonRoof(6, 2.25, 2.85, tile), part("攒尖宝顶", "sphere", brass, [0, 3.8, 0], [0.19, 0.25, 0.19])];
  for (let index = 0; index < 6; index++) {
    const angle = index * Math.PI / 3;
    pavilion.push(part("六根朱柱", "cylinder", red, [Math.cos(angle) * 1.5, 1.56, Math.sin(angle) * 1.5], [0.15, 2.55, 0.15]));
    if (index !== 1) pavilion.push(part("栏间坐凳", "box", wood, [Math.cos(angle + Math.PI / 6) * 1.3, 0.65, Math.sin(angle + Math.PI / 6) * 1.3], [1.28, 0.1, 0.28], [0, -index * 60 - 120, 0]));
  }
  const drumTower = [part("鼓楼台基", "box", stone, [0, 0.22, 0], [3.8, 0.44, 3.5]), ...posts(2.7, 2.5, 4.3, red, 0.44), pitchedRoof("鼓楼下重檐", tile, 4.3, 3.9, 2.7, true), pitchedRoof("鼓楼上重檐", tile, 3.8, 3.5, 4.7, true), part("二层楼板", "box", wood, [0, 2.65, 0], [2.9, 0.16, 2.7]), part("悬挂大鼓", "cylinder", red, [0, 3.55, 0], [1.25, 1.05, 1.25], [90, 0, 0]), part("大鼓鼓面", "cylinder", paper, [0, 3.55, 0.55], [1.27, 0.045, 1.27], [90, 0, 0])];
  for (const side of [-1, 1]) drumTower.push(beam("鼓楼斜撑", wood, [side * 1.35, 0.5, 1.25], [0, 2.6, 1.25], 0.1));
  const gate = [part("门楼石阶", "box", stone, [0, 0.1, 0], [3.8, 0.2, 2]), ...posts(2.5, 0.9, 2.6, red, 0.2), pitchedRoof("垂花门悬山顶", tile, 3.7, 1.85, 2.9, true), part("门楣", "box", red, [0, 2.45, 0], [2.65, 0.34, 0.4])];
  for (const side of [-1, 1]) gate.push(part("半开门扇", "box", wood, [side * 0.86, 1.31, -0.1], [1.05, 2.2, 0.075], [0, side * 32, 0]), part("垂花悬柱", "lathe", brass, [side * 1.05, 2.38, 0.64], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: -0.32 }, { x: 0.13, y: -0.23 }, { x: 0.09, y: -0.14 }, { x: 0.07, y: 0.25 }] }));
  const house = [part("正房地台", "box", stone, [0, 0.2, 0], [6.3, 0.4, 4.6]), part("正房后墙", "box", plaster, [0, 1.7, -1.9], [5.8, 2.6, 0.2]), pitchedRoof("青瓦硬山屋顶", tile, 6.6, 4.7, 3.13, true)];
  for (const side of [-1, 1]) house.push(part("正房山墙", "box", plaster, [side * 2.8, 1.7, 0], [0.2, 2.6, 3.8]), part("前窗槛墙", "box", plaster, [side * 1.85, 0.88, 1.8], [1.8, 0.95, 0.15]), part("木格窗框", "box", wood, [side * 1.85, 1.95, 1.8], [1.8, 1.16, 0.1]), part("窗纸", "box", paper, [side * 1.85, 1.95, 1.87], [1.58, 0.94, 0.025]));
  for (const x of [-2.7, -0.9, 0.9, 2.7]) house.push(part("前廊檐柱", "cylinder", red, [x, 1.76, 2.05], [0.14, 2.7, 0.14]));
  house.push(part("正房门扇", "box", darkWood, [0, 1.58, 1.8], [1.5, 2.3, 0.1]), part("门前踏步", "box", stone, [0, 0.13, 2.55], [2.2, 0.26, 0.8]));
  const hall = [part("水榭挑台", "box", wood, [0, 0.85, 0], [4.6, 0.18, 3.6]), ...posts(3.8, 2.9, 3.3, wood), pitchedRoof("水榭瓦顶", tile, 5.1, 4.1, 3.5, true), part("水榭后壁", "box", plaster, [0, 2.05, -1.4], [3.8, 2.2, 0.12])];
  for (const z of [-1.6, 1.6]) for (const y of [1.15, 1.55]) hall.push(part("水榭栏板", "box", red, [0, y, z], [4.1, 0.08, 0.08]));
  for (let index = 0; index < 7; index++) hall.push(part("水榭栏杆小柱", "box", wood, [-1.8 + index * 0.6, 1.2, 1.6], [0.065, 0.65, 0.065]));
  const bridge: ModelPart[] = [];
  const top = Array.from({ length: 9 }, (_, index) => ({ x: -3 + index * 0.75, y: 0.3 + Math.sin(index / 8 * Math.PI) * 0.9 }));
  bridge.push(part("石桥拱券", "extrude", stone, [0, 0, 0], [1, 1, 1], [0, 0, 0], { depth: 1.9, profile: [...top, ...top.toReversed().map(point => ({ x: point.x, y: point.y - 0.26 }))] }));
  for (const z of [-0.9, 0.9]) for (let index = 0; index < 8; index++) {
    const a = top[index]!; const b = top[index + 1]!;
    bridge.push(beam("石桥弧形扶手", "#c6c4ad", [a.x, a.y + 0.78, z], [b.x, b.y + 0.78, z], 0.1), part("石桥栏柱", "box", stone, [a.x, a.y + 0.38, z], [0.12, 0.76, 0.12]));
  }
  const covered = [part("廊桥桥面", "box", wood, [0, 0.4, 0], [6.5, 0.22, 2]), part("廊桥石墩", "box", stone, [-2.3, 0.15, 0], [0.6, 0.3, 1.8]), part("廊桥石墩", "box", stone, [2.3, 0.15, 0], [0.6, 0.3, 1.8])];
  const bridgeRoof = pitchedRoof("廊桥长瓦顶", tile, 2.6, 7.1, 2.9, true); bridgeRoof.rotation.y = 90; covered.push(bridgeRoof);
  for (const x of [-2.8, -0.95, 0.95, 2.8]) for (const z of [-0.83, 0.83]) covered.push(part("廊桥柱", "cylinder", red, [x, 1.7, z], [0.13, 2.4, 0.13]));
  for (const z of [-0.88, 0.88]) covered.push(part("廊桥坐凳", "box", darkWood, [0, 0.87, z], [6.15, 0.1, 0.25]));
  const watch = [part("夯土望台", "lathe", "#af9670", [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: 1.7, y: 0 }, { x: 1.3, y: 3.6 }, { x: 0, y: 3.6 }] }), part("望台木楼板", "box", wood, [0, 3.65, 0], [3, 0.14, 3]), ...posts(2.5, 2.5, 1.8, wood, 3.7), polygonRoof(4, 2.1, 5.5, tile)];
  for (let index = 0; index < 12; index++) watch.push(part("外侧登台石阶", "box", "#9f977e", [1.9, 0.15 + index * 0.28, -1.6 + index * 0.28], [0.6, 0.3, 0.35]));
  const gallery = [part("长廊石台", "box", stone, [0, 0.12, 0], [2.4, 0.24, 5.8]), pitchedRoof("长廊青瓦顶", tile, 2.9, 6.2, 2.8, true)];
  for (const z of [-2.5, -0.85, 0.85, 2.5]) for (const x of [-0.95, 0.95]) gallery.push(part("长廊木柱", "cylinder", red, [x, 1.5, z], [0.13, 2.6, 0.13]));
  for (const x of [-0.95, 0.95]) gallery.push(part("长廊美人靠座", "box", wood, [x, 0.65, 0], [0.28, 0.12, 5.3]), part("长廊靠背横栏", "box", wood, [x, 1.15, 0], [0.08, 0.08, 5.3]));
  const hut = [part("草庐土台", "box", "#bba17b", [0, .1, 0], [3.4, .2, 2.8]), pitchedRoof("厚茅草顶", "#b1a272", 4, 3.4, 2.05), part("独立后泥墙", "box", "#b6a17a", [0, 1.15, -1.15], [3, 1.9, .15]), part("真窗下的泥墙", "box", "#b6a17a", [-.7, .575, 1.15], [1.6, .75, .15]), part("真窗上方泥墙", "box", "#b6a17a", [-.7, 1.825, 1.15], [1.6, .55, .15]), part("窗左侧墙垛", "box", "#b6a17a", [-1.3, 1.25, 1.15], [.4, .6, .15]), part("窗右侧接门墙垛", "box", "#b6a17a", [-.15, 1.25, 1.15], [.5, .6, .15]), part("门右侧完整泥墙", "box", "#b6a17a", [1.2, 1.15, 1.15], [.6, 1.9, .15]), part("门洞上方过梁", "box", wood, [.5, 2.025, 1.15], [.92, .15, .2]), part("向外半开的木门", "box", darkWood, [.265, 1.08, 1.563], [.78, 1.74, .06], [0, -65, 0]), part("茅顶压脊草束", "box", "#8e8155", [0, 2.73, 0], [.3, .14, 3.55])];
  for (const side of [-1, 1]) {
    hut.push(part("独立承重侧泥墙", "box", "#b6a17a", [side * 1.45, 1.15, 0], [.15, 1.9, 2.4]));
    hut.push(part("承接茅顶的封闭山墙尖", "extrude", "#b6a17a", [0, 2.1, side * 1.15], [1, 1, 1], [0, 0, 0], { depth: .15, profile: [{ x: -1.5, y: 0 }, { x: 1.5, y: 0 }, { x: 1.5, y: .08 }, { x: 0, y: .46 }, { x: -1.5, y: .08 }] }));
    for (let row = 0; row < 6; row++) {
      const x = .17 + row * .33;
      hut.push(part("相互搭叠的粗茅草铺覆层", "box", row % 2 ? "#b8aa78" : "#a89a69", [side * x, 2.075 + .65 * (1 - x / 2), 0], [.4, .07, 3.45], [0, 0, -side * 18]));
    }
    hut.push(part("真实窗洞上下木框", "box", wood, [-.75, side < 0 ? .95 : 1.55, 1.23], [.8, .075, .12]));
  }
  for (const x of [-1.1, -.75, -.4]) hut.push(part("透空窗洞的木框与格条", "box", wood, [x, 1.25, 1.23], [.055, .65, .1]));
return [asset("easternCnPavilion", "六角凉亭", "中式", "建筑", pavilion), asset("easternCnDrumTower", "重檐鼓楼", "中式", "建筑", drumTower), asset("easternCnGatehouse", "垂花门楼", "中式", "建筑", gate), asset("easternCnCourtyardHouse", "四合院正房", "中式", "建筑", house), asset("easternCnWatersideHall", "江南水榭", "中式", "建筑", hall), asset("easternCnArchBridge", "石拱桥", "中式", "建筑", bridge), asset("easternCnCoveredBridge", "廊桥", "中式", "建筑", covered), asset("easternCnWatchtower", "夯土瞭望台", "中式", "建筑", watch), asset("easternCnGallery", "青瓦长廊", "中式", "建筑", gallery), { ...asset("easternCnThatchedHut", "草庐", "中式", "建筑", hut), tags: ["中式古代", "古装剧", "茅草房", "乡村民居"] }];
}

function chineseFurniture(): SceneAsset[] {
  const squareTable = [part("厚木桌面", "box", wood, [0, 0.78, 0], [1.15, 0.09, 1.15]), ...legs(0.94, 0.94, 0.74)];
  for (const side of [-1, 1]) squareTable.push(part("八仙桌牙板", "box", darkWood, [side * 0.48, 0.65, 0], [0.05, 0.16, 0.95]), part("八仙桌牙板", "box", darkWood, [0, 0.65, side * 0.48], [0.95, 0.16, 0.05]));
  const desk = [part("琴案长桌板", "box", "#8d6147", [0, 0.76, 0], [1.75, 0.075, 0.52])];
  for (const x of [-0.61, 0.61]) desk.push(part("琴案板足", "box", darkWood, [x, 0.36, 0], [0.12, 0.72, 0.43]), part("琴案足托", "box", wood, [x, 0.05, 0], [0.3, 0.1, 0.58]));
  desk.push(part("琴案横枨", "box", wood, [0, 0.27, 0], [1.3, 0.065, 0.065]));
  const chair = [part("太师椅座面", "box", wood, [0, 0.48, 0], [0.58, 0.07, 0.52]), ...legs(0.44, 0.4, 0.45), part("高靠背板", "box", darkWood, [0, 0.94, -0.22], [0.28, 0.84, 0.06]), part("靠背雕花心板", "box", brass, [0, 0.96, -0.18], [0.14, 0.26, 0.025]), part("搭脑横梁", "box", wood, [0, 1.39, -0.2], [0.7, 0.075, 0.09]), part("前脚踏枨", "box", wood, [0, 0.2, 0.2], [0.48, 0.045, 0.05])];
  for (const x of [-0.27, 0.27]) chair.push(part("扶手", "box", wood, [x, 0.78, 0], [0.065, 0.07, 0.55]), part("扶手立撑", "box", wood, [x, 0.64, 0.21], [0.05, 0.3, 0.05]));
  const roundChair = [part("圈椅藤座", "box", "#b7a06a", [0, 0.47, 0], [0.56, 0.065, 0.53]), ...legs(0.43, 0.4, 0.44), part("圈椅靠背板", "box", wood, [0, 0.77, -0.21], [0.13, 0.56, 0.05]), part("环形搭脑", "tube", wood, [0, 0, 0], [1, 1, 1], [0, 0, 0], { path: Array.from({ length: 13 }, (_, index) => ({ x: Math.cos(index / 12 * Math.PI) * 0.32, y: 0.79 + Math.sin(index / 12 * Math.PI) * 0.24, z: -Math.sin(index / 12 * Math.PI) * 0.25 })), radius: 0.035 })];
  for (const x of [-0.27, 0.27]) roundChair.push(beam("圈椅扶手柱", wood, [x, 0.45, 0.14], [x * 1.12, 0.8, 0], 0.045));
  const bench = [part("条凳长凳面", "box", wood, [0, 0.48, 0], [1.65, 0.1, 0.29]), ...legs(1.2, 0.19, 0.43, 0.085), part("条凳横枨", "box", darkWood, [0, 0.22, 0], [1.3, 0.06, 0.06])];
  const stool = [part("鼓凳腰鼓身", "lathe", "#a16d4c", [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0.03 }, { x: 0.19, y: 0.03 }, { x: 0.25, y: 0.12 }, { x: 0.29, y: 0.25 }, { x: 0.25, y: 0.4 }, { x: 0.21, y: 0.48 }, { x: 0, y: 0.48 }] }), part("鼓凳藤座", "cylinder", "#b9a16c", [0, 0.49, 0], [0.47, 0.045, 0.47])];
  for (let index = 0; index < 10; index++) { const a = index * Math.PI / 5; stool.push(part("鼓凳圆钉", "sphere", brass, [Math.cos(a) * 0.246, 0.12, Math.sin(a) * 0.246], [0.032, 0.032, 0.032])); }
  const wardrobe = [part("柜底", "box", darkWood, [0, 0.17, 0], [1.15, 0.16, 0.58]), part("柜顶帽", "box", wood, [0, 1.87, 0], [1.2, 0.12, 0.61]), part("柜背", "box", wood, [0, 1.02, -0.26], [1.1, 1.6, 0.06]), ...legs(0.9, 0.4, 0.18, 0.09)];
  for (const side of [-1, 1]) wardrobe.push(part("柜侧板", "box", wood, [side * 0.54, 1.02, 0], [0.075, 1.6, 0.54]), part("雕花柜门", "box", wood, [side * 0.25, 1.02, 0.28], [0.48, 1.55, 0.06]), part("柜门镶板", "box", "#a47a54", [side * 0.25, 1.07, 0.315], [0.34, 1.14, 0.02]), part("铜柜拉环", "torus", brass, [side * 0.07, 0.98, 0.34], [0.075, 0.075, 0.04]));
  const shelf = [part("多宝阁背板", "box", darkWood, [0, 1.05, -0.21], [1.5, 2.1, 0.05])];
  for (const x of [-0.74, 0.74]) shelf.push(part("阁架边柱", "box", wood, [x, 1.05, 0], [0.07, 2.1, 0.46]));
  for (const y of [0.1, 0.58, 1.22, 1.67, 2.08]) shelf.push(part("错层搁板", "box", wood, [0, y, 0], [1.5, 0.06, 0.46]));
  shelf.push(part("非对称格柱", "box", wood, [-0.25, 0.86, 0], [0.055, 1.55, 0.44]), part("上层分格", "box", wood, [0.28, 1.88, 0], [0.05, 0.38, 0.44]), vessel("阁架陶瓶", "#b6b8a0", [0.34, 0.62, 0], 0.13, 0.44, 0.5));
  const daybed = [part("罗汉床坐榻", "box", wood, [0, 0.47, 0], [1.95, 0.16, 0.95]), part("罗汉床坐垫", "box", "#b3ae8c", [0, 0.58, 0], [1.8, 0.08, 0.82]), ...legs(1.7, 0.69, 0.4, 0.1), part("罗汉床后围板", "box", darkWood, [0, 0.83, -0.43], [1.95, 0.5, 0.08])];
  for (const side of [-1, 1]) daybed.push(part("罗汉床侧围板", "box", darkWood, [side * 0.94, 0.78, 0], [0.08, 0.4, 0.87]));
  const bed = [part("架子床床板", "box", wood, [0, 0.47, 0], [1.7, 0.16, 2.2]), part("织锦床褥", "box", "#baa17e", [0, 0.61, 0], [1.55, 0.14, 2.03]), ...posts(1.55, 2.03, 2.16, darkWood)];
  for (const side of [-1, 1]) bed.push(part("床架纵向顶枋", "box", wood, [side * 0.77, 2.13, 0], [0.12, 0.14, 2.2]), part("床架横向顶枋", "box", wood, [0, 2.13, side * 1.01], [1.7, 0.14, 0.12]));
  bed.push(part("床头围板", "box", wood, [0, 0.94, -1.03], [1.55, 0.7, 0.08]), part("纱帐后帘", "box", paper, [0, 1.45, -0.98], [1.4, 1.2, 0.02], [0, 0, 0], { opacity: 0.58 }));
  const screen: ModelPart[] = [];
  for (let index = 0; index < 4; index++) {
    const x = (index - 1.5) * 0.5; const yaw = index % 2 ? 13 : -13;
    screen.push(part("折屏木框", "box", darkWood, [x, 0.86, 0], [0.51, 1.6, 0.06], [0, yaw, 0]), part("绢面山水屏芯", "box", "#c4c5a0", [x, 0.88, 0.04], [0.41, 1.36, 0.025], [0, yaw, 0]), part("屏风落地足", "box", wood, [x, 0.05, 0], [0.42, 0.1, 0.25]));
    screen.push(part("屏芯山形镶木", "cone", "#8c9d82", [x, 0.73 + index % 2 * 0.16, 0.065], [0.25, 0.42 + index % 2 * 0.2, 0.035]));
  }
  const pharmacy = [part("药柜柜体", "box", darkWood, [0, 0.91, 0], [1.8, 1.82, 0.53]), part("药柜台面", "box", wood, [0, 1.87, 0], [1.94, 0.1, 0.64])];
  for (let row = 0; row < 5; row++) for (let column = 0; column < 6; column++) {
    const x = (column - 2.5) * 0.283; const y = 0.2 + row * 0.33;
    pharmacy.push(part("独立药斗", "box", wood, [x, y, 0.29], [0.26, 0.3, 0.06]), part("药斗铜签", "box", brass, [x, y + 0.035, 0.328], [0.1, 0.035, 0.014]));
  }
  return [asset("easternCnSquareTable", "八仙桌", "中式", "道具", squareTable), asset("easternCnGuqinDesk", "琴案", "中式", "道具", desk), asset("easternCnOfficialChair", "太师椅", "中式", "道具", chair), asset("easternCnRoundChair", "圈椅", "中式", "道具", roundChair), asset("easternCnBench", "条凳", "中式", "道具", bench), asset("easternCnDrumStool", "鼓凳", "中式", "道具", stool), asset("easternCnWardrobe", "雕花衣柜", "中式", "道具", wardrobe), asset("easternCnDisplayShelf", "多宝阁", "中式", "道具", shelf), asset("easternCnDaybed", "罗汉床", "中式", "道具", daybed), asset("easternCnCanopyBed", "架子床", "中式", "道具", bed), asset("easternCnFoldingScreen", "山水折屏", "中式", "道具", screen), asset("easternCnMedicineCabinet", "药柜", "中式", "道具", pharmacy)];
}

function chineseVehicles(): SceneAsset[] {
  const barrow = [part("独轮车载物板", "box", wood, [0, 0.64, 0.15], [0.95, 0.1, 1.4]), ...wheel(0, 0.44, -0.2, 0.44)];
  for (const x of [-0.4, 0.4]) barrow.push(beam("独轮车双辕", darkWood, [x, 0.4, -0.7], [x, 0.82, 1.6], 0.07), part("落地支脚", "box", wood, [x, 0.29, 0.65], [0.07, 0.58, 0.07]));
  const cart = [part("手推车木箱底", "box", wood, [0, 0.73, 0], [1.1, 0.12, 1.65]), part("车轴", "cylinder", darkWood, [0, 0.51, 0], [0.09, 1.55, 0.09], [0, 0, 90]), ...wheel(-0.7, 0.51, 0, 0.51), ...wheel(0.7, 0.51, 0, 0.51)];
  for (const x of [-0.52, 0.52]) { for (const y of [0.9, 1.1]) cart.push(part("货车侧栏", "box", "#a38059", [x, y, 0], [0.065, 0.15, 1.65])); cart.push(beam("手推车把手", wood, [x, 0.72, 0.5], [x, 0.9, 1.7], 0.065)); }
  const awning = [boatHull(4, 1.25, darkWood), part("船舱木底板", "box", wood, [0, 0.25, 0], [0.8, 0.07, 2.5]), archedCanopy("半圆乌篷", "#526458", 1.16, 0.65, 1.65, [0, 0.5, 0])];
  awning.push(beam("船尾摇橹", wood, [0.3, 0.65, 1.55], [0.55, 0.2, 2.75], 0.045), part("摇橹桨叶", "box", wood, [0.55, 0.2, 2.78], [0.2, 0.045, 0.55], [18, 0, 0]));
  const sail = [boatHull(4.4, 1.35, wood), part("帆船桅杆", "cylinder", darkWood, [0, 1.9, -0.25], [0.075, 3.3, 0.075]), beam("斜帆桁", bamboo, [-0.85, 3, -0.25], [0.88, 3.5, -0.25], 0.05), part("分片竹席帆", "mesh", paper, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices: [{ x: -0.85, y: 3, z: -0.24 }, { x: 0.88, y: 3.5, z: -0.24 }, { x: 0.75, y: 1.05, z: -0.24 }, { x: -0.72, y: 1.05, z: -0.24 }], indices: [0, 1, 2, 0, 2, 3, 2, 1, 0, 3, 2, 0] })];
  for (const y of [1.25, 1.65, 2.05, 2.45, 2.85]) sail.push(part("竹帆横肋", "box", bamboo, [0, y, -0.21], [1.5, 0.035, 0.035]));
  return [asset("easternCnWheelbarrow", "木独轮车", "中式", "道具", barrow), asset("easternCnHandcart", "两轮手推车", "中式", "道具", cart), asset("easternCnBlackAwningBoat", "乌篷船", "中式", "道具", awning), asset("easternCnSailboat", "帆舢板", "中式", "道具", sail)];
}

function chineseProps(): SceneAsset[] {
  const lantern = [part("红灯笼纸罩", "sphere", red, [0, 0.5, 0], [0.65, 0.75, 0.65], [0, 0, 0], { emissive: "#b64628", emissiveIntensity: 0.45 }), part("灯笼上盖", "cylinder", brass, [0, 0.9, 0], [0.32, 0.06, 0.32]), part("灯笼下盖", "cylinder", brass, [0, 0.1, 0], [0.32, 0.06, 0.32]), part("提灯吊环", "torus", darkWood, [0, 1.02, 0], [0.2, 0.22, 0.06])];
  for (let index = 0; index < 8; index++) { const a = index * Math.PI / 4; lantern.push(part("灯笼竖肋", "capsule", "#c27a42", [Math.cos(a) * 0.29, 0.5, Math.sin(a) * 0.29], [0.014, 0.57, 0.014]), part("灯笼流苏", "cylinder", "#ba6650", [Math.cos(a) * 0.08, -0.08, Math.sin(a) * 0.08], [0.012, 0.27, 0.012])); }
  const well = [ring("中式石井壁", stone, 0.69, 0.19, 0.42, 0.84), ring("厚石井沿", "#c8c4aa", 0.78, 0.25, 0.89, 0.14), part("井内水面", "cylinder", "#648b89", [0, 0.15, 0], [1, 0.02, 1], [0, 0, 0], { roughness: 0.16 }), part("井口辘轳", "cylinder", wood, [0, 1.57, 0], [0.17, 1.65, 0.17], [0, 0, 90]), part("井绳", "cylinder", "#b4a276", [0.1, 1.1, 0], [0.018, 0.8, 0.018])];
  for (const x of [-0.77, 0.77]) well.push(part("辘轳支架", "box", darkWood, [x, 0.85, 0], [0.11, 1.7, 0.13]));
  const burner = [vessel("铜香炉炉身", "#8e9674", [0, 0.17, 0], 0.29, 0.34, 0.9), part("香炉盖", "cone", brass, [0, 0.56, 0], [0.55, 0.16, 0.55]), part("盖顶钮", "sphere", brass, [0, 0.67, 0], [0.1, 0.1, 0.1])];
  for (let index = 0; index < 3; index++) { const a = index * Math.PI * 2 / 3; burner.push(part("香炉三足", "cone", "#76856a", [Math.cos(a) * 0.19, 0.11, Math.sin(a) * 0.19], [0.07, 0.22, 0.07], [180, 0, 0])); }
  for (const x of [-0.32, 0.32]) burner.push(part("炉耳", "torus", brass, [x, 0.39, 0], [0.18, 0.18, 0.08], [0, 90, 0]));
  const ding = [vessel("青铜鼎腹", "#697f6a", [0, 0.35, 0], 0.48, 0.55, 0.95)];
  for (let index = 0; index < 3; index++) { const a = index * Math.PI * 2 / 3; ding.push(part("鼎足", "cylinder", "#637664", [Math.cos(a) * 0.3, 0.2, Math.sin(a) * 0.3], [0.12, 0.4, 0.12])); }
  for (const x of [-0.36, 0.36]) ding.push(part("鼎耳立撑", "box", "#879779", [x, 1.01, 0], [0.09, 0.28, 0.2]), part("鼎耳上横梁", "box", "#879779", [x, 1.17, 0], [0.2, 0.06, 0.2]));
  const tea = [part("木茶托", "box", darkWood, [0, 0.025, 0], [0.7, 0.05, 0.46]), vessel("紫砂壶", "#98715a", [-0.15, 0.05, 0], 0.12, 0.18, 0.65), part("壶盖", "cylinder", "#a27b60", [-0.15, 0.24, 0], [0.18, 0.025, 0.18]), part("壶钮", "sphere", "#98715a", [-0.15, 0.27, 0], [0.055, 0.045, 0.055]), beam("茶壶流", "#98715a", [-0.05, 0.15, 0], [0.08, 0.22, 0], 0.04), part("茶壶把", "torus", "#98715a", [-0.29, 0.16, 0], [0.16, 0.18, 0.055])];
  for (const z of [-0.12, 0.12]) tea.push(vessel("白瓷茶盏", "#d6d3b9", [0.18, 0.05, z], 0.055, 0.065, 1));
  const vase = [vessel("青花瓷瓶身", "#e0e2ce", [0, 0, 0], 0.23, 0.72, 0.43)];
  for (const y of [0.13, 0.36, 0.55]) vase.push(ring("青花纹带", "#5f8192", y < 0.5 ? 0.218 : 0.115, 0.012, y, 0.035));
  const jar = [vessel("粗陶大水缸", "#8e7661", [0, 0, 0], 0.53, 0.87, 0.95), part("缸内水面", "cylinder", "#6d9890", [0, 0.72, 0], [0.86, 0.012, 0.86], [0, 0, 0], { roughness: 0.18 })];
  const basket = [vessel("竹编篓体", "#ac9c68", [0, 0, 0], 0.3, 0.5, 0.95)];
  for (let row = 0; row < 5; row++) basket.push(ring("横向竹篾", "#897d51", 0.28 + Math.sin(row / 5 * Math.PI) * 0.015, 0.014, 0.07 + row * 0.09, 0.025));
  for (let index = 0; index < 12; index++) { const a = index * Math.PI / 6; basket.push(beam("纵向竹篾", "#b5ac78", [Math.cos(a) * 0.24, 0.03, Math.sin(a) * 0.24], [Math.cos(a) * 0.285, 0.49, Math.sin(a) * 0.285], 0.013)); }
  const bucket = [part("木桶底", "cylinder", wood, [0, 0.035, 0], [0.39, 0.07, 0.39]), ring("桶口木圈", wood, 0.24, 0.035, 0.43, 0.055), part("提桶把手", "tube", darkWood, [0, 0, 0], [1, 1, 1], [0, 0, 0], { path: [{ x: -0.22, y: 0.35, z: 0 }, { x: -0.2, y: 0.7, z: 0 }, { x: 0, y: 0.8, z: 0 }, { x: 0.2, y: 0.7, z: 0 }, { x: 0.22, y: 0.35, z: 0 }], radius: 0.018 })];
  for (let index = 0; index < 12; index++) { const a = index * Math.PI / 6; bucket.push(part("木桶拼板", "box", "#a1815b", [Math.cos(a) * 0.205, 0.25, Math.sin(a) * 0.205], [0.11, 0.4, 0.025], [0, 90 - index * 30, 0])); }
  for (const y of [0.12, 0.36]) bucket.push(part("铁箍", "torus", "#657169", [0, y, 0], [0.48, 0.48, 0.06], [90, 0, 0]));
  const writing = [part("砚台", "box", "#4c5a54", [0.16, 0.045, 0], [0.25, 0.09, 0.18]), part("砚池", "box", "#2e3d37", [0.18, 0.094, 0], [0.16, 0.012, 0.1]), part("墨块", "box", "#34423a", [0.03, 0.11, 0.04], [0.04, 0.14, 0.03]), part("笔架横梁", "box", darkWood, [-0.18, 0.3, 0], [0.35, 0.04, 0.07])];
  for (const x of [-0.31, -0.05]) writing.push(part("笔架柱", "box", wood, [x, 0.16, 0], [0.035, 0.3, 0.05]));
  for (let index = 0; index < 3; index++) writing.push(part("竹笔杆", "cylinder", bamboo, [-0.25 + index * 0.07, 0.21, 0.07], [0.012, 0.2, 0.012]), part("毛笔笔锋", "cone", "#686351", [-0.25 + index * 0.07, 0.08, 0.07], [0.028, 0.07, 0.028], [180, 0, 0]));
  const guqin = [part("古琴漆木琴体", "extrude", darkWood, [0, 0.055, 0], [1, 1, 1], [-90, 0, 0], { depth: 0.095, profile: [{ x: -0.62, y: -0.1 }, { x: -0.55, y: -0.14 }, { x: 0.52, y: -0.12 }, { x: 0.65, y: -0.075 }, { x: 0.65, y: 0.075 }, { x: 0.52, y: 0.12 }, { x: -0.55, y: 0.14 }, { x: -0.62, y: 0.1 }] })];
  for (let index = 0; index < 7; index++) guqin.push(part("古琴七弦", "box", "#c9bc91", [0, 0.106, (index - 3) * 0.025], [1.15, 0.002, 0.002]));
  for (let index = 0; index < 13; index++) guqin.push(part("十三徽", "sphere", paper, [-0.53 + index * 0.085, 0.108, 0.105], [0.008, 0.003, 0.008]));
  const bell = [part("钟架横梁", "box", darkWood, [0, 1.94, 0], [1.5, 0.15, 0.3]), part("青铜钟身", "lathe", "#9f9c71", [0, 0.55, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0.45, y: 0 }, { x: 0.43, y: 0.1 }, { x: 0.31, y: 0.7 }, { x: 0.19, y: 0.92 }, { x: 0, y: 0.96 }, { x: 0, y: 0.89 }, { x: 0.14, y: 0.84 }, { x: 0.25, y: 0.68 }, { x: 0.37, y: 0.1 }, { x: 0.39, y: 0 }] }), part("钟纽", "torus", brass, [0, 1.66, 0], [0.26, 0.32, 0.12])];
  for (const x of [-0.62, 0.62]) bell.push(part("钟架落地柱", "box", wood, [x, 0.98, 0], [0.13, 1.96, 0.15]), part("钟架脚座", "box", darkWood, [x, 0.06, 0], [0.4, 0.12, 0.65]));
  const lion = animalGuardian("#a9ad9c");
  for (let index = 0; index < 9; index++) { const a = index / 8 * Math.PI * 2; lion.push(part("石狮卷鬃", "sphere", "#989f8b", [Math.cos(a) * 0.28, 1.04 + Math.sin(a) * 0.27, -0.03], [0.15, 0.15, 0.16])); }
  lion.push(part("狮爪绣球", "sphere", stone, [-0.2, 0.28, 0.37], [0.26, 0.26, 0.26]));
  const bonsai = [vessel("盆景浅盆", "#8b745a", [0, 0, 0], 0.36, 0.16, 1), beam("老桩主干", darkWood, [-0.1, 0.12, 0], [0.14, 0.76, 0], 0.065), beam("盆景侧枝", darkWood, [0.06, 0.5, 0], [-0.3, 0.68, 0.07], 0.035)];
  for (const [x, y, z, width] of [[-0.26, 0.72, 0.07, 0.46], [0.14, 0.84, 0, 0.5], [0.34, 0.66, -0.1, 0.32]]) bonsai.push(part("修剪云片树冠", "sphere", "#6e8c62", [x!, y!, z!], [width!, 0.17, width! * 0.8]));
  const grove: ModelPart[] = [];
  for (let index = 0; index < 5; index++) {
    const x = Math.sin(index * 2.4) * 0.5; const z = Math.cos(index * 2.4) * 0.4; const h = 2.6 + index % 3 * 0.45;
    grove.push(part("竹林竹竿", "cylinder", bamboo, [x, h / 2, z], [0.07, h, 0.07]));
    for (let node = 1; node < 7; node++) grove.push(part("竹节", "cylinder", "#82945f", [x, node * h / 7, z], [0.082, 0.028, 0.082]));
    for (const side of [-1, 1]) { grove.push(beam("竹枝", "#809756", [x, h * 0.67, z], [x + side * 0.5, h * 0.88, z + 0.12], 0.018)); for (let leaf = 0; leaf < 3; leaf++) grove.push(part("细长竹叶", "sphere", "#6d8b50", [x + side * (0.2 + leaf * 0.14), h * 0.75 + leaf * 0.1, z + 0.12], [0.25, 0.018, 0.065], [0, side * 24, side * 20])); }
  }
  const pine = [part("松树主干", "cylinder", darkWood, [0, 1.95, 0], [0.27, 3.9, 0.27])];
  for (let index = 0; index < 7; index++) { const a = index * 2.4; const y = 1.7 + index * 0.33; const r = 1.25 - index * 0.1; pine.push(beam("老松横枝", wood, [0, y, 0], [Math.cos(a) * r, y + 0.25, Math.sin(a) * r], 0.08), part("松针云冠", "sphere", "#527b58", [Math.cos(a) * r, y + 0.35, Math.sin(a) * r], [1.5 - index * 0.07, 0.45, 1.1])); }
  const lotusPot = [vessel("荷花陶盆", "#8a7761", [0, 0, 0], 0.45, 0.42, 1), part("盆中水面", "cylinder", "#7d9e8b", [0, 0.35, 0], [0.8, 0.012, 0.8], [0, 0, 0], { roughness: 0.18 }), part("花茎", "cylinder", "#829c66", [0, 0.65, 0], [0.022, 0.6, 0.022]), part("莲蓬心", "sphere", "#b8ad68", [0, 0.98, 0], [0.1, 0.08, 0.1])];
  for (let index = 0; index < 8; index++) { const a = index * Math.PI / 4; lotusPot.push(part("荷花花瓣", "sphere", index % 2 ? "#d9a6a8" : "#e5bdba", [Math.cos(a) * 0.13, 0.96, Math.sin(a) * 0.13], [0.15, 0.12, 0.24], [0, -index * 45, 0])); }
  const lotus: ModelPart[] = [];
  for (const [x, z, h, size] of [[0, 0, 0.74, 0.85], [0.43, 0.12, 0.55, 0.64], [-0.34, -0.2, 0.45, 0.57]]) {
    lotus.push(part("荷叶细茎", "cylinder", "#819461", [x!, h! / 2, z!], [0.02, h!, 0.02]));
    const vertices = [{ x: 0, y: 0.035, z: 0 }, ...Array.from({ length: 12 }, (_, index) => { const a = 0.3 + index / 11 * Math.PI * 1.82; return { x: Math.cos(a) * size! / 2, y: 0, z: Math.sin(a) * size! / 2 }; })];
    const count = vertices.length;
    const indices = Array.from({ length: 11 }, (_, index) => [0, index + 2, index + 1, count, count + index + 1, count + index + 2]).flat();
    // 正反面分离顶点，防止光照法线被相反的三角形抵消。
    vertices.push(...vertices.map(point => ({ ...point })));
    lotus.push(part("有裂口荷叶", "mesh", "#71925c", [x!, h!, z!], [1, 1, 1], [0, 0, 0], { vertices, indices }));
  }
  const hitch = [part("拴马桩底座", "box", stone, [0, 0.09, 0], [0.55, 0.18, 0.55]), part("八棱石柱", "cylinder", "#a2aa96", [0, 0.91, 0], [0.28, 1.64, 0.28]), part("柱顶兽首", "sphere", "#b2b6a1", [0, 1.9, 0], [0.4, 0.4, 0.35]), part("兽首耳", "cone", stone, [-0.13, 2.1, 0], [0.1, 0.2, 0.1]), part("拴绳石环", "torus", "#8b9885", [0, 1.56, 0.2], [0.22, 0.22, 0.11])];
  return [asset("easternCnLantern", "红灯笼", "中式", "道具", lantern), asset("easternCnPaperUmbrella", "油纸伞", "中式", "道具", parasol(0.75, 1.7, 12, "#caaf87")), asset("easternCnWell", "辘轳石井", "中式", "建筑", well), asset("easternCnIncenseBurner", "铜香炉", "中式", "道具", burner), asset("easternCnBronzeDing", "青铜鼎", "中式", "道具", ding), asset("easternCnTeaSet", "紫砂茶具托盘", "中式", "道具", tea), asset("easternCnPorcelainVase", "青花瓷瓶", "中式", "道具", vase), asset("easternCnWaterJar", "陶水缸", "中式", "道具", jar), asset("easternCnBambooBasket", "竹箩筐", "中式", "道具", basket), asset("easternCnWoodBucket", "提梁木桶", "中式", "道具", bucket), asset("easternCnCalligraphySet", "笔墨砚架", "中式", "道具", writing), asset("easternCnGuqin", "七弦古琴", "中式", "道具", guqin), asset("easternCnBell", "架悬铜钟", "中式", "道具", bell), asset("easternCnStoneLion", "绣球石狮", "中式", "道具", lion), asset("easternCnBonsai", "云片盆景", "中式", "自然", bonsai), asset("easternCnBambooGrove", "庭院竹丛", "中式", "自然", grove), asset("easternCnPine", "庭院老松", "中式", "自然", pine), asset("easternCnLotusPot", "莲花盆", "中式", "自然", lotusPot), asset("easternCnLotusPlant", "池塘荷叶", "中式", "自然", lotus), asset("easternCnHitchingPost", "拴马桩", "中式", "道具", hitch)];
}

function japaneseBuildings(): SceneAsset[] {
  const pavilion = [part("四阿地板", "box", wood, [0, 0.2, 0], [3.1, 0.4, 3.1]), ...posts(2.4, 2.4, 2.3, darkWood, 0.4), pitchedRoof("日式四阿屋顶", "#6e7562", 3.7, 3.6, 2.8)];
  for (const side of [-1, 1]) pavilion.push(beam("四阿斜撑", wood, [side * 1.2, 2.1, 1.2], [side * 0.6, 2.7, 1.2], 0.1), part("四阿木长凳", "box", "#a08b68", [side * 1.1, 0.8, 0], [0.35, 0.09, 2.1]));
  const fireTower = [part("火见橹高台", "box", darkWood, [0, 3.85, 0], [2.1, 0.17, 2.1]), pitchedRoof("火见橹小屋顶", "#777c68", 2.7, 2.6, 5.45), part("火警铜铃", "lathe", brass, [0, 4.8, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0.25, y: 0 }, { x: 0.17, y: 0.28 }, { x: 0, y: 0.37 }, { x: 0, y: 0.31 }, { x: 0.12, y: 0.23 }, { x: 0.2, y: 0 }] })];
  for (const x of [-1, 1]) for (const z of [-1, 1]) fireTower.push(beam("收分木架柱", wood, [x * 1.25, 0.05, z * 1.25], [x * 0.85, 5.5, z * 0.85], 0.14));
  for (const z of [-1, 1]) for (const side of [-1, 1]) fireTower.push(beam("高架交叉支撑", darkWood, [side * 1.15, 0.3, z * 1.15], [-side * 0.95, 3.6, z * 0.95], 0.09));
  for (let index = 0; index < 14; index++) fireTower.push(part("攀登木梯档", "box", wood, [0, 0.3 + index * 0.26, 1.2 - index * 0.015], [0.65, 0.055, 0.06]));
  const shrine = [part("拜殿基坛", "box", stone, [0, 0.22, 0], [5.1, 0.44, 3.7]), part("拜殿木台", "box", wood, [0, 0.55, 0], [4.5, 0.23, 3.1]), ...posts(3.9, 2.6, 2.5, red, 0.66), part("拜殿后壁", "box", "#c7b894", [0, 1.9, -1.3], [3.9, 2.4, 0.16]), pitchedRoof("神社大屋顶", "#776858", 5.5, 4.1, 3.25), part("神社额匾", "box", darkWood, [0, 2.7, 1.4], [1.2, 0.35, 0.08]), part("拜殿木门", "box", wood, [0, 1.75, 0.85], [1.8, 2.1, 0.08])];
  for (const z of [-1.4, 1.4]) { shrine.push(beam("屋脊千木", wood, [-0.65, 3.75, z], [0.65, 4.5, z], 0.09), beam("屋脊千木", wood, [0.65, 3.75, z], [-0.65, 4.5, z], 0.09)); }
  for (let index = 0; index < 5; index++) shrine.push(part("屋脊鲣木", "cylinder", "#a69874", [0, 3.97, -0.9 + index * 0.45], [0.13, 1.2, 0.13], [0, 0, 90]));
  shrine.push(part("拜殿前阶", "box", stone, [0, 0.2, 2], [2.1, 0.4, 1]));
  const gate = [part("山门台基", "box", stone, [0, 0.18, 0], [5, 0.36, 2.5]), ...posts(3.3, 1.5, 3.4, darkWood, 0.36), pitchedRoof("山门大屋檐", "#6d7569", 5.5, 3.3, 3.9), part("山门额梁", "box", "#a17e54", [0, 3.3, 0], [4.1, 0.32, 0.45]), part("山门楼额", "box", darkWood, [0, 3.56, 0.87], [1.25, 0.42, 0.09])];
  for (const side of [-1, 1]) gate.push(part("山门侧间板", "box", "#aa9472", [side * 1.8, 1.7, -0.65], [0.72, 2.6, 0.1]), beam("山门斗栱斜托", wood, [side * 1.65, 2.8, 0.75], [side * 1.05, 3.7, 0.75], 0.14));
  const machiya = [part("町屋低台", "box", stone, [0, 0.1, 0], [3.8, 0.2, 5.2]), part("町屋墙体", "box", plaster, [0, 2.2, 0], [3.5, 4, 4.8]), pitchedRoof("町屋切妻顶", "#6b736b", 4.2, 5.6, 4.3), pitchedRoof("一层出檐", darkWood, 4.05, 1, 2.3), part("一层木门", "box", darkWood, [0.85, 1.1, 2.45], [0.9, 1.85, 0.08]), part("二层窗纸", "box", paper, [0, 3.25, 2.43], [2.9, 1.2, 0.06])];
  machiya[3]!.position.z = 2.35;
  for (let index = 0; index < 12; index++) machiya.push(part("町屋格子面", "box", wood, [-1.45 + index * 0.26, 3.25, 2.49], [0.055, 1.3, 0.05]));
  const minka = [part("民家夯土地基", "box", "#b5a584", [0, 0.12, 0], [5.2, 0.24, 4.2]), part("民家土墙", "box", "#c5b894", [0, 1.2, 0], [4.6, 2.15, 3.5]), part("陡坡茅葺屋顶", "extrude", "#a99b70", [0, 2.2, 0], [1, 1, 1], [0, 0, 0], { depth: 4.3, profile: [{ x: -2.9, y: 0 }, { x: 0, y: 2.2 }, { x: 2.9, y: 0 }, { x: 2.9, y: -0.18 }, { x: 0, y: 1.96 }, { x: -2.9, y: -0.18 }] }), part("民家引户", "box", wood, [0.7, 1.1, 1.79], [1, 1.9, 0.07]), part("民家横窗", "box", darkWood, [-1.1, 1.28, 1.8], [1.3, 0.75, 0.06])];
  for (const z of [-1.5, 0, 1.5]) minka.push(part("茅顶压草横木", "box", darkWood, [0, 4.43, z], [0.3, 0.12, 0.15]));
  const teaHouse = [part("茶室木台", "box", wood, [0, 0.32, 0], [3.4, 0.25, 3]), ...posts(2.7, 2.35, 2, darkWood, 0.45), part("茶室后壁", "box", plaster, [0, 1.42, -1.15], [2.7, 1.95, 0.1]), pitchedRoof("茶室木瓦顶", "#7f7b61", 3.9, 3.6, 2.5), part("躙口小门", "box", darkWood, [0.78, 0.93, 1.18], [0.75, 1.05, 0.07]), part("障子纸面", "box", paper, [-0.55, 1.45, 1.19], [1.2, 1.5, 0.04]), part("茶室踏石", "sphere", stone, [0.76, 0.12, 1.8], [1.05, 0.24, 0.72])];
  for (let index = 0; index < 5; index++) teaHouse.push(part("茶室窗竖格", "box", darkWood, [-1.08 + index * 0.265, 1.45, 1.22], [0.035, 1.52, 0.035]));
  const bridge: ModelPart[] = [];
  for (let index = 0; index < 16; index++) {
    const x = -2.7 + index * 0.36; const y = 0.2 + Math.sin((index + 0.5) / 16 * Math.PI) * 0.8;
    bridge.push(part("反桥横木铺板", "box", "#9a7553", [x, y, 0], [0.34, 0.1, 1.65]));
    if (index < 15) for (const side of [-1, 1]) {
      const nextY = 0.2 + Math.sin((index + 1.5) / 16 * Math.PI) * 0.8;
      bridge.push(beam("朱漆反桥扶栏", red, [x, y + 0.8, side * 0.8], [x + 0.36, nextY + 0.8, side * 0.8], 0.08));
      if (index % 3 === 0) bridge.push(part("反桥栏柱", "box", red, [x, y + 0.38, side * 0.8], [0.095, 0.8, 0.095]));
    }
  }
  const walkway = [part("渡廊木地板", "box", wood, [0, 0.56, 0], [2.1, 0.14, 6.1]), pitchedRoof("渡廊木瓦顶", "#797e68", 2.7, 6.5, 2.65)];
  for (const z of [-2.7, -0.9, 0.9, 2.7]) walkway.push(...posts(1.7, 0.1, 2.1, darkWood, 0.5).filter((_part, index) => index % 2 === 0).map(item => ({ ...item, position: { ...item.position, z } })));
  for (const x of [-0.88, 0.88]) for (const y of [0.86, 1.2]) walkway.push(part("渡廊细木栏", "box", wood, [x, y, 0], [0.05, 0.06, 5.8]));
  const kura = [part("土藏黑色石基", "box", tile, [0, 0.35, 0], [3.4, 0.7, 3.4]), part("土藏白墙", "box", "#dedcc9", [0, 1.95, 0], [3, 2.7, 3]), pitchedRoof("土藏瓦顶", "#646e69", 3.8, 3.8, 3.35), part("厚重藏门", "box", "#68776c", [0.35, 1.47, 1.55], [1.1, 2.1, 0.15]), part("方形藏窗", "box", darkWood, [-0.9, 2.5, 1.54], [0.55, 0.55, 0.08])];
  for (const x of [-0.13, 0.15, 0.43, 0.71]) kura.push(part("藏门包铁竖条", "box", "#859080", [x, 1.47, 1.64], [0.04, 1.95, 0.02]));
  return [asset("easternJpPavilion", "日式四柱凉亭", "日式", "建筑", pavilion), asset("easternJpWatchtower", "火见橹", "日式", "建筑", fireTower), asset("easternJpShrineHall", "神社拜殿", "日式", "建筑", shrine), asset("easternJpTempleGate", "寺院山门", "日式", "建筑", gate), asset("easternJpMachiya", "町屋", "日式", "建筑", machiya), asset("easternJpMinka", "茅葺民家", "日式", "建筑", minka), asset("easternJpTeaHouse", "茶室", "日式", "建筑", teaHouse), asset("easternJpArchedBridge", "朱栏反桥", "日式", "建筑", bridge), asset("easternJpCoveredWalkway", "木构渡廊", "日式", "建筑", walkway), asset("easternJpKura", "白壁土藏", "日式", "建筑", kura)];
}

function japaneseFurniture(): SceneAsset[] {
  const lowTable = [part("矮茶几板", "box", "#956d4d", [0, 0.33, 0], [1.05, 0.06, 0.7]), ...legs(0.84, 0.49, 0.3, 0.07), part("茶几下横枨", "box", darkWood, [0, 0.15, 0], [0.87, 0.045, 0.04])];
  const zaisu = [part("座椅木底框", "box", wood, [0, 0.065, 0], [0.49, 0.07, 0.48]), part("座布团", "box", "#9ba28b", [0, 0.14, 0], [0.44, 0.09, 0.43]), part("座椅斜靠背", "box", wood, [0, 0.41, -0.21], [0.49, 0.64, 0.055], [-12, 0, 0]), part("靠背软垫", "box", "#adb69b", [0, 0.43, -0.17], [0.39, 0.45, 0.04], [-12, 0, 0])];
  const bench = [part("缘侧长凳座板", "box", "#a18a65", [0, 0.43, 0], [1.8, 0.09, 0.45]), ...legs(1.48, 0.29, 0.39, 0.065), part("缘侧凳下枨", "box", darkWood, [0, 0.19, 0], [1.5, 0.05, 0.04])];
  for (const z of [-0.13, 0.13]) bench.push(part("凳面板缝", "box", darkWood, [0, 0.478, z], [1.75, 0.003, 0.008]));
  const tansu = [part("箪笥木壳", "box", "#a7906b", [0, 0.79, 0], [1.1, 1.58, 0.48]), part("箪笥顶帽", "box", "#b4a17e", [0, 1.62, 0], [1.16, 0.08, 0.54])];
  for (let row = 0; row < 5; row++) { tansu.push(part("桐柜抽屉", "box", "#c0aa81", [0, 0.19 + row * 0.29, 0.27], [1.01, 0.265, 0.06])); for (const x of [-0.28, 0.28]) tansu.push(part("铁制抽屉拉手", "torus", tile, [x, 0.19 + row * 0.29, 0.315], [0.065, 0.045, 0.028])); }
  const stepChest: ModelPart[] = [];
  for (let column = 0; column < 4; column++) {
    const h = (column + 1) * 0.4; const x = (column - 1.5) * 0.36;
    stepChest.push(part("阶梯箪笥柜身", "box", wood, [x, h / 2, 0], [0.35, h, 0.5]), part("阶梯踏板", "box", darkWood, [x, h + 0.03, 0], [0.38, 0.06, 0.55]));
    for (let row = 0; row <= column; row++) stepChest.push(part("阶梯抽屉面", "box", "#ac8d63", [x, 0.2 + row * 0.4, 0.28], [0.29, 0.32, 0.05]), part("阶梯柜铜扣", "sphere", brass, [x, 0.2 + row * 0.4, 0.315], [0.035, 0.035, 0.02]));
  }
  const tatami = [part("榻榻米草芯", "box", "#b6b38b", [0, 0.035, 0], [0.91, 0.07, 1.82])];
  for (const x of [-0.428, 0.428]) tatami.push(part("榻榻米布缘", "box", "#63765a", [x, 0.075, 0], [0.055, 0.012, 1.82]));
  for (let row = 0; row < 19; row++) tatami.push(part("编草横纹", "box", "#a9ac7c", [0, 0.073, -0.84 + row * 0.093], [0.8, 0.004, 0.007]));
  const futon = [part("铺地敷布团", "box", "#d3c8ad", [0, 0.07, 0], [1, 0.14, 2]), part("叠起的挂布团", "box", "#9da898", [0, 0.22, 0.2], [1.04, 0.2, 1.55]), part("枕头", "capsule", paper, [0, 0.24, -0.73], [0.48, 0.2, 0.27], [0, 0, 90]), part("被褥折边", "box", "#bcc5ae", [0, 0.33, -0.5], [1.06, 0.05, 0.17])];
  const screen: ModelPart[] = [];
  for (let index = 0; index < 3; index++) { const x = (index - 1) * 0.57; screen.push(part("枕屏漆木框", "box", darkWood, [x, 0.48, 0], [0.58, 0.96, 0.055], [0, index % 2 ? 12 : -12, 0]), part("金箔枕屏芯", "box", "#b8ad7c", [x, 0.49, 0.035], [0.49, 0.83, 0.015], [0, index % 2 ? 12 : -12, 0]), part("枕屏竹叶镶饰", "sphere", "#7b8f6c", [x + 0.04, 0.5, 0.051], [0.13, 0.38, 0.015], [0, 0, -25 + index * 20])); }
  const shoji = [part("障子透光纸", "box", paper, [0, 1, 0], [0.83, 1.85, 0.018], [0, 0, 0], { opacity: 0.82 }), part("障子下裙板", "box", wood, [0, 0.16, 0], [0.9, 0.32, 0.06])];
  for (const x of [-0.46, 0.46]) shoji.push(part("障子边框", "box", darkWood, [x, 1.02, 0], [0.065, 2.04, 0.07]));
  for (let row = 0; row < 7; row++) shoji.push(part("障子横格", "box", wood, [0, 0.35 + row * 0.27, 0.025], [0.9, 0.026, 0.025]));
  for (const x of [-0.28, -0.09, 0.09, 0.28]) shoji.push(part("障子竖格", "box", wood, [x, 1.17, 0.025], [0.025, 1.64, 0.025]));
  const irori = [part("围炉里炉床", "box", darkWood, [0, 0.055, 0], [1.25, 0.11, 1.25]), part("炉灰内床", "box", "#a9a491", [0, 0.12, 0], [0.95, 0.04, 0.95]), part("炭火", "sphere", "#96694a", [0, 0.18, 0], [0.42, 0.08, 0.34], [0, 0, 0], { emissive: "#a44d24", emissiveIntensity: 0.65 }), vessel("铁壶", "#4f5c51", [0, 0.28, 0], 0.23, 0.25, 0.65), part("自在钩吊杆", "cylinder", darkWood, [0, 1.2, 0], [0.035, 1.8, 0.035]), part("鱼形自在钩", "extrude", wood, [0.12, 1.5, 0], [1, 1, 1], [0, 0, 0], { depth: 0.05, profile: [{ x: -0.22, y: 0 }, { x: 0.05, y: 0.1 }, { x: 0.18, y: 0.02 }, { x: 0.28, y: 0.09 }, { x: 0.28, y: -0.09 }, { x: 0.18, y: -0.02 }, { x: 0.05, y: -0.08 }] })];
  return [asset("easternJpLowTable", "矮茶几", "日式", "道具", lowTable), asset("easternJpZaisu", "日式座椅", "日式", "道具", zaisu), asset("easternJpEngawaBench", "缘侧长凳", "日式", "道具", bench), asset("easternJpTansu", "桐木衣柜", "日式", "道具", tansu), asset("easternJpStepChest", "阶梯箪笥", "日式", "道具", stepChest), asset("easternJpTatami", "榻榻米", "日式", "道具", tatami), asset("easternJpFuton", "布团铺床", "日式", "道具", futon), asset("easternJpFoldingScreen", "金箔枕屏", "日式", "道具", screen), asset("easternJpShojiDoor", "障子移门", "日式", "道具", shoji), asset("easternJpIrori", "围炉里", "日式", "道具", irori)];
}

function japaneseVehiclesAndNature(): SceneAsset[] {
  const rickshaw = [part("人力车座箱", "box", darkWood, [0, 0.85, 0], [1.08, 0.3, 0.85]), part("车座软垫", "box", "#8e7964", [0, 1.07, 0], [0.98, 0.12, 0.76]), part("车座靠背", "box", darkWood, [0, 1.35, -0.4], [1.06, 0.75, 0.09]), ...wheel(-0.7, 0.6, 0, 0.6), ...wheel(0.7, 0.6, 0, 0.6), archedCanopy("人力车折篷", "#58675e", 1.2, 0.32, 1.1, [0, 1.85, -0.1]), part("车厢踏板", "box", wood, [0, 0.66, 0.6], [0.85, 0.09, 0.35])];
  for (const x of [-0.53, 0.53]) rickshaw.push(beam("人力车双辕", wood, [x, 0.7, 0.2], [x, 0.92, 2.1], 0.06), part("折篷支撑", "box", darkWood, [x, 1.5, -0.35], [0.035, 0.9, 0.035]));
  const wasen = [boatHull(3.7, 0.95, "#a18a61"), beam("和船长橹", darkWood, [-0.1, 0.45, 1.4], [-0.42, 0.18, 2.6], 0.04), part("和船橹叶", "box", wood, [-0.42, 0.18, 2.6], [0.16, 0.035, 0.45], [12, 0, 0])];
  for (const z of [-0.9, 0, 0.85]) wasen.push(part("和船横坐板", "box", wood, [0, 0.46, z], [0.75, 0.055, 0.23]));
  const bicycle = [...wheel(0, 0.34, -0.66, 0.34), ...wheel(0, 0.34, 0.66, 0.34), beam("自行车下斜管", "#6c8174", [0, 0.38, 0.12], [0, 0.9, -0.5], 0.035), beam("自行车上管", "#6c8174", [0, 0.82, 0.35], [0, 0.9, -0.5], 0.035), beam("自行车座管", "#6c8174", [0, 0.38, 0.12], [0, 0.89, 0.35], 0.035), beam("自行车后叉", "#6c8174", [0, 0.38, 0.12], [0, 0.34, 0.66], 0.03), beam("自行车后上叉", "#6c8174", [0, 0.82, 0.35], [0, 0.34, 0.66], 0.03), beam("自行车前叉", "#6c8174", [0, 0.9, -0.5], [0, 0.34, -0.66], 0.035), part("自行车鞍座", "box", darkWood, [0, 0.95, 0.35], [0.22, 0.055, 0.26]), part("自行车横把", "cylinder", "#9da99b", [0, 1.04, -0.5], [0.025, 0.54, 0.025], [0, 0, 90]), part("自行车货架", "box", tile, [0, 0.76, 0.72], [0.3, 0.05, 0.45]), part("竹编货箱", "box", "#b2a06c", [0, 0.99, 0.69], [0.52, 0.42, 0.47])];
  for (const side of [-1, 1]) bicycle.push(part("货箱木箍", "box", darkWood, [side * 0.26, 0.99, 0.69], [0.025, 0.42, 0.47]));
  const cherry = [beam("樱花树干", darkWood, [0, 0, 0], [0.1, 2.6, 0], 0.22)];
  for (let index = 0; index < 7; index++) { const a = index * 2.4; const r = index === 6 ? 0.2 : 1.05; const y = 2.7 + index % 3 * 0.22; const end: Triple = [Math.cos(a) * r, y, Math.sin(a) * r]; cherry.push(beam("樱树分叉", wood, [0, 1.6, 0], end, 0.075), part("樱花簇冠", "sphere", index % 2 ? "#d9afb2" : "#e4c4c0", [end[0], y + 0.25, end[2]], [1.5, 0.9, 1.35])); }
  const maple = [beam("枫树斜干", "#817055", [0, 0, 0], [-0.12, 2.45, 0], 0.18)];
  for (let index = 0; index < 9; index++) { const a = index * 2.1; const r = 0.8 + index % 2 * 0.28; const y = 2.2 + index % 3 * 0.34; maple.push(beam("枫枝", wood, [-0.06, 1.5, 0], [Math.cos(a) * r, y, Math.sin(a) * r], 0.045), part("叠片红叶冠", "sphere", ["#a2674d", "#b67b55", "#9d5d49"][index % 3]!, [Math.cos(a) * r, y + 0.14, Math.sin(a) * r], [1.2, 0.46, 1.15])); }
  const pineBonsai = [part("黑松陶盆", "box", "#6c7c6e", [0, 0.09, 0], [0.77, 0.18, 0.53]), part("盆土", "box", "#6f7056", [0, 0.19, 0], [0.65, 0.025, 0.42]), beam("黑松曲干一", darkWood, [-0.2, 0.18, 0], [0.05, 0.58, 0], 0.055), beam("黑松曲干二", darkWood, [0.05, 0.58, 0], [0.31, 0.73, 0.04], 0.045), beam("黑松下垂枝", darkWood, [0.18, 0.65, 0], [0.43, 0.48, 0.08], 0.025)];
  for (const [x, y, w] of [[0.34, 0.79, 0.43], [-0.1, 0.61, 0.36], [0.43, 0.52, 0.3]]) pineBonsai.push(part("黑松针叶片", "sphere", "#54785b", [x!, y!, 0], [w!, 0.14, 0.32]));
  const rockGarden = [part("石组砂床", "cylinder", "#c5c5a8", [0, 0.025, 0], [2.2, 0.05, 1.7])];
  for (const [x, y, z, w, h] of [[0.2, 0.37, 0, 0.65, 0.75], [-0.45, 0.2, 0.12, 0.6, 0.4], [0.6, 0.15, 0.2, 0.43, 0.3]]) rockGarden.push(part("庭院组石", "sphere", "#879581", [x!, y!, z!], [w!, h!, w! * 0.7], [0, x! * 50, 12]));
  for (let index = 0; index < 6; index++) rockGarden.push(part("环状耙砂细沟", "torus", "#abb49b", [0, 0.058, 0], [1.1 + index * 0.15, 0.85 + index * 0.11, 0.012], [90, 0, 0]));
  const firewood = [...posts(1.2, 0.55, 0.85, darkWood), part("柴架底托", "box", wood, [0, 0.12, 0], [1.4, 0.09, 0.7])];
  for (let row = 0; row < 3; row++) for (let column = 0; column < 4 - row; column++) { const z = (column - (3 - row) / 2) * 0.16; const y = 0.23 + row * 0.16; firewood.push(part("横放柴薪", "cylinder", darkWood, [0, y, z], [0.145, 1.15, 0.145], [0, 0, 90]), part("柴薪切面", "cylinder", "#c1a879", [0.58, y, z], [0.135, 0.015, 0.135], [0, 0, 90])); }
  return [asset("easternJpRickshaw", "篷顶人力车", "日式", "道具", rickshaw), asset("easternJpWasenBoat", "木造和船", "日式", "道具", wasen), asset("easternJpUtilityBicycle", "载货自行车", "日式", "道具", bicycle), asset("easternJpCherryTree", "庭院樱花树", "日式", "自然", cherry), asset("easternJpMapleTree", "红叶枫树", "日式", "自然", maple), asset("easternJpPineBonsai", "黑松盆栽", "日式", "自然", pineBonsai), asset("easternJpRockGarden", "枯山水石组", "日式", "自然", rockGarden), asset("easternJpFirewoodRack", "柴薪架", "日式", "道具", firewood)];
}

function japaneseProps(): SceneAsset[] {
  const andon = [part("行灯木底座", "box", darkWood, [0, 0.06, 0], [0.42, 0.12, 0.42]), part("行灯顶板", "box", wood, [0, 0.77, 0], [0.42, 0.055, 0.42]), part("行灯暖光芯", "sphere", "#eed59e", [0, 0.4, 0], [0.11, 0.19, 0.11], [0, 0, 0], { emissive: "#dbb570", emissiveIntensity: 1.1 })];
  for (const x of [-0.17, 0.17]) for (const z of [-0.17, 0.17]) andon.push(part("行灯木框柱", "box", darkWood, [x, 0.43, z], [0.025, 0.67, 0.025]));
  for (const side of [-1, 1]) andon.push(part("行灯纸侧面", "box", paper, [side * 0.175, 0.43, 0], [0.01, 0.61, 0.31], [0, 0, 0], { opacity: 0.72 }), part("行灯纸正面", "box", paper, [0, 0.43, side * 0.175], [0.31, 0.61, 0.01], [0, 0, 0], { opacity: 0.72 }));
  const chochin = [part("提灯纸筒", "cylinder", "#d8bd92", [0, 0.43, 0], [0.34, 0.61, 0.34], [0, 0, 0], { emissive: "#b69157", emissiveIntensity: 0.35 }), part("提灯上盖", "cylinder", darkWood, [0, 0.76, 0], [0.35, 0.055, 0.35]), part("提灯下盖", "cylinder", darkWood, [0, 0.1, 0], [0.35, 0.055, 0.35]), part("提灯提环", "torus", darkWood, [0, 0.91, 0], [0.21, 0.24, 0.05])];
  for (let index = 0; index < 11; index++) chochin.push(ring("提灯竹骨圈", "#b4a277", 0.176, 0.008, 0.15 + index * 0.054, 0.009));
  const basin = [vessel("蹲踞石钵", "#98a28c", [0, 0, 0], 0.42, 0.37, 0.95), part("水钵清水", "cylinder", "#7b9b88", [0, 0.29, 0], [0.67, 0.012, 0.67], [0, 0, 0], { roughness: 0.12 }), part("竹引水管", "cylinder", bamboo, [-0.38, 0.58, 0], [0.055, 0.65, 0.055], [0, 0, -78]), part("竹管立架", "cylinder", bamboo, [-0.63, 0.29, 0], [0.055, 0.58, 0.055])];
  const chozuya = [part("手水舍石台", "box", stone, [0, 0.1, 0], [2.9, 0.2, 2]), ...posts(2.4, 1.45, 2.4, wood, 0.2), pitchedRoof("手水舍木瓦顶", "#777b64", 3.35, 2.4, 2.65), part("石制长水槽", "lathe", "#a4ac96", [0, 0.25, 0], [1.5, 1, 0.7], [0, 0, 0], { profile: [{ x: 0.55, y: 0 }, { x: 0.75, y: 0.1 }, { x: 0.75, y: 0.55 }, { x: 0.61, y: 0.55 }, { x: 0.6, y: 0.15 }, { x: 0.55, y: 0 }] }), part("手水槽水面", "cylinder", "#729784", [0, 0.68, 0], [1.78, 0.012, 0.71], [0, 0, 0], { roughness: 0.15 })];
  for (const x of [-0.5, 0, 0.5]) chozuya.push(beam("手水柄杓柄", bamboo, [x, 0.85, -0.55], [x, 0.82, 0.4], 0.022), vessel("柄杓竹杯", "#bdaf7b", [x, 0.78, 0.35], 0.065, 0.1, 1));
  const deer = [part("鹿威石座", "sphere", stone, [0, 0.08, 0], [0.75, 0.16, 0.6]), part("鹿威轴心", "cylinder", darkWood, [0, 0.52, 0], [0.045, 0.42, 0.045], [0, 0, 90]), part("鹿威倾转竹筒", "lathe", bamboo, [0, 0.52, 0], [1, 1, 1], [65, 0, 0], { profile: [{ x: 0.045, y: -0.5 }, { x: 0.055, y: -0.5 }, { x: 0.055, y: 0.5 }, { x: 0.04, y: 0.5 }, { x: 0.04, y: -0.4 }, { x: 0.045, y: -0.4 }] })];
  for (const x of [-0.16, 0.16]) deer.push(part("鹿威叉架", "cylinder", bamboo, [x, 0.31, 0], [0.045, 0.62, 0.045]));
  const ema = [part("绘马架顶横梁", "box", wood, [0, 1.6, 0], [1.9, 0.1, 0.13]), pitchedRoof("绘马架小顶", "#7e7358", 2.1, 0.55, 1.7), part("绘马下挂梁", "box", wood, [0, 1, 0], [1.7, 0.055, 0.07])];
  for (const x of [-0.77, 0.77]) ema.push(part("绘马架立脚", "box", darkWood, [x, 0.83, 0], [0.1, 1.66, 0.1]), part("绘马架底足", "box", darkWood, [x, 0.045, 0], [0.28, 0.09, 0.5]));
  for (let index = 0; index < 8; index++) ema.push(part("五角绘马牌", "extrude", "#c6ac7c", [-0.65 + index % 4 * 0.43, 0.8 + Math.floor(index / 4) * 0.54, 0.05], [1, 1, 1], [0, index % 2 ? 8 : -8, 0], { depth: 0.025, profile: [{ x: -0.13, y: -0.1 }, { x: 0.13, y: -0.1 }, { x: 0.13, y: 0.06 }, { x: 0, y: 0.14 }, { x: -0.13, y: 0.06 }] }));
  const offertory = [part("赛钱箱主体", "box", wood, [0, 0.39, 0], [1.05, 0.65, 0.67]), part("赛钱箱底座", "box", darkWood, [0, 0.06, 0], [1.17, 0.12, 0.79]), part("铜包角左", "box", brass, [-0.48, 0.39, 0.35], [0.06, 0.58, 0.025]), part("铜包角右", "box", brass, [0.48, 0.39, 0.35], [0.06, 0.58, 0.025]), part("钱箱中央牌", "box", brass, [0, 0.43, 0.35], [0.32, 0.22, 0.025])];
  for (let row = 0; row < 7; row++) offertory.push(part("投币口栅板", "box", darkWood, [0, 0.75, -0.28 + row * 0.093], [1.12, 0.055, 0.058]));
  const rope = [part("注连绳粗绳", "tube", "#bdb17f", [0, 0, 0], [1, 1, 1], [0, 0, 0], { path: Array.from({ length: 17 }, (_, index) => ({ x: -0.9 + index * 0.1125, y: 0.8 - Math.sin(index / 16 * Math.PI) * 0.2, z: Math.sin(index * Math.PI) * 0.005 })), radius: 0.06 })];
  for (const x of [-0.53, 0, 0.53]) {
    rope.push(part("注连绳稻草垂穗", "cone", "#b3a56f", [x, 0.43, 0], [0.11, 0.38, 0.11], [180, 0, 0]));
    rope.push(part("之字纸垂", "extrude", paper, [x + 0.12, 0.48, 0.035], [1, 1, 1], [0, 0, 0], { depth: 0.004, profile: [{ x: 0, y: 0.14 }, { x: 0.09, y: 0.14 }, { x: 0.04, y: 0.04 }, { x: 0.12, y: 0.04 }, { x: 0.02, y: -0.1 }, { x: -0.02, y: -0.1 }, { x: 0.02, y: -0.01 }, { x: -0.05, y: -0.01 }] }));
  }
  const dog = animalGuardian("#9fa997");
  dog.push(part("狛犬张口", "box", "#63735e", [0, 0.91, 0.42], [0.18, 0.06, 0.025]), part("狛犬胸鬃", "sphere", "#8c9b82", [0, 0.76, 0.18], [0.41, 0.32, 0.2]), part("狛犬卷尾", "torus", "#9fa997", [0, 0.54, -0.44], [0.28, 0.35, 0.14]));
  const jizo = [part("地藏底座", "cylinder", stone, [0, 0.06, 0], [0.54, 0.12, 0.54]), part("地藏坐身", "sphere", "#a6af9a", [0, 0.31, 0], [0.44, 0.56, 0.38]), part("地藏圆首", "sphere", "#b8bea8", [0, 0.67, 0], [0.33, 0.35, 0.33]), part("地藏合掌", "capsule", stone, [0, 0.41, 0.21], [0.1, 0.2, 0.07]), part("地藏红围兜", "extrude", red, [0, 0.49, 0.2], [1, 1, 1], [0, 0, 0], { depth: 0.008, profile: [{ x: -0.16, y: 0.04 }, { x: 0.16, y: 0.04 }, { x: 0.1, y: -0.18 }, { x: -0.1, y: -0.18 }] })];
  const cat = animalGuardian("#e0dcc3", true).filter(item => item.name !== "前爪" || item.position.x < 0);
  cat.push(part("招财猫举起前臂", "capsule", paper, [0.3, 0.94, 0.16], [0.16, 0.55, 0.17]), part("招财猫招手爪", "sphere", paper, [0.3, 1.25, 0.16], [0.18, 0.2, 0.16]), part("招财猫金币", "cylinder", brass, [0, 0.56, 0.37], [0.3, 0.025, 0.4], [90, 0, 0]), part("招财猫红项圈", "torus", red, [0, 0.87, 0.04], [0.43, 0.35, 0.08], [90, 0, 0]));
  const smallCat = cat.map(item => ({ ...item, position: { x: item.position.x * 0.55, y: item.position.y * 0.55, z: item.position.z * 0.55 }, scale: { x: item.scale.x * 0.55, y: item.scale.y * 0.55, z: item.scale.z * 0.55 } }));
  const chimes = [part("风铃挂梁", "box", wood, [0, 1.48, 0], [1.25, 0.06, 0.08])];
  for (const x of [-0.53, 0.53]) chimes.push(part("风铃木架柱", "box", darkWood, [x, 0.75, 0], [0.065, 1.5, 0.08]), part("风铃架底足", "box", wood, [x, 0.035, 0], [0.26, 0.07, 0.35]));
  for (let index = 0; index < 3; index++) { const x = (index - 1) * 0.35; chimes.push(part("风铃吊线", "cylinder", "#b5ac86", [x, 1.18, 0], [0.005, 0.55, 0.005]), part("玻璃风铃", "lathe", "#bed3c0", [x, 0.93, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0.11, y: 0 }, { x: 0.105, y: 0.08 }, { x: 0.065, y: 0.17 }, { x: 0, y: 0.2 }, { x: 0, y: 0.187 }, { x: 0.05, y: 0.155 }, { x: 0.09, y: 0.07 }, { x: 0.098, y: 0 }], opacity: 0.4, roughness: 0.12 }), part("风铃纸签", "box", index % 2 ? "#c4b391" : "#9ba98d", [x, 0.69, 0], [0.08, 0.24, 0.006], [0, index * 12, 0])); }
  const tea = [part("茶道木盘", "box", darkWood, [0, 0.025, 0], [0.61, 0.05, 0.43]), vessel("抹茶碗", "#87957c", [-0.13, 0.05, 0.02], 0.12, 0.12, 1), part("抹茶液面", "cylinder", "#829a5a", [-0.13, 0.14, 0.02], [0.2, 0.008, 0.2]), vessel("茶枣漆罐", "#674d3c", [0.17, 0.05, -0.08], 0.067, 0.15, 0.9), part("茶筅握柄", "cylinder", bamboo, [0.17, 0.14, 0.11], [0.035, 0.16, 0.035])];
  for (let index = 0; index < 8; index++) { const a = index * Math.PI / 4; tea.push(beam("茶筅竹穗", "#b8a875", [0.17, 0.18, 0.11], [0.17 + Math.cos(a) * 0.055, 0.31, 0.11 + Math.sin(a) * 0.055], 0.005)); }
  const bento = [part("便当漆盒底", "box", "#714f3c", [0, 0.035, 0], [0.44, 0.07, 0.32]), part("便当盒背边", "box", red, [0, 0.1, -0.16], [0.44, 0.14, 0.02]), part("便当盒前边", "box", red, [0, 0.1, 0.16], [0.44, 0.14, 0.02]), part("盒内分格", "box", darkWood, [0, 0.09, 0], [0.018, 0.12, 0.29]), part("白饭", "box", "#e2dfc3", [-0.1, 0.11, 0], [0.16, 0.09, 0.25]), part("梅干", "sphere", red, [-0.1, 0.17, 0], [0.055, 0.035, 0.055]), part("烤鱼块", "capsule", "#bc9c71", [0.11, 0.12, -0.035], [0.11, 0.06, 0.2], [0, 0, 90])];
  for (const x of [-0.22, 0.22]) bento.push(part("便当盒侧边", "box", red, [x, 0.1, 0], [0.02, 0.14, 0.32]));
  const sake = [part("酒具木托", "box", wood, [0, 0.025, 0], [0.49, 0.05, 0.36]), vessel("德利酒壶", "#cbd1bb", [-0.1, 0.05, 0], 0.09, 0.28, 0.37)];
  for (const z of [-0.1, 0.1]) sake.push(vessel("猪口酒杯", "#d9d5bd", [0.13, 0.05, z], 0.05, 0.06, 1));
  const sandals: ModelPart[] = [];
  for (const x of [-0.13, 0.13]) {
    sandals.push(part("木屐底板", "box", "#ba9d70", [x, 0.1, 0], [0.2, 0.045, 0.29]));
    for (const z of [-0.085, 0.085]) sandals.push(part("木屐齿", "box", wood, [x, 0.04, z], [0.18, 0.08, 0.04]));
    for (const side of [-1, 1]) sandals.push(beam("木屐鼻绪", red, [x, 0.17, 0.07], [x + side * 0.075, 0.13, -0.065], 0.025));
  }
  const broom = [part("竹扫帚长柄", "cylinder", bamboo, [0, 1.04, 0], [0.027, 1.12, 0.027]), part("扫帚绑扎带", "cylinder", darkWood, [0, 0.43, 0], [0.095, 0.055, 0.095])];
  for (let index = 0; index < 12; index++) broom.push(beam("散开的扫帚竹枝", "#a79f6b", [0, 0.49, 0], [(index - 5.5) * 0.035, 0.025 + index % 2 * 0.02, Math.sin(index * 2) * 0.06], 0.012));
  return [asset("easternJpAndon", "木框行灯", "日式", "道具", andon), asset("easternJpChochin", "折骨提灯", "日式", "道具", chochin), asset("easternJpWagasa", "朱色和伞", "日式", "道具", parasol(0.83, 1.85, 18, "#ad6550")), asset("easternJpTsukubai", "蹲踞水钵", "日式", "道具", basin), asset("easternJpChozuya", "手水舍", "日式", "建筑", chozuya), asset("easternJpShishiOdoshi", "竹制鹿威", "日式", "道具", deer), asset("easternJpEmaRack", "绘马挂架", "日式", "道具", ema), asset("easternJpSaisenBako", "赛钱箱", "日式", "道具", offertory), asset("easternJpShimenawa", "注连绳与纸垂", "日式", "道具", rope), asset("easternJpKomainu", "石雕狛犬", "日式", "道具", dog), asset("easternJpJizo", "围兜石地藏", "日式", "道具", jizo), asset("easternJpManekiNeko", "招财猫", "日式", "道具", smallCat), asset("easternJpWindChime", "玻璃风铃架", "日式", "道具", chimes), asset("easternJpTeaSet", "抹茶道具", "日式", "道具", tea), asset("easternJpBento", "漆器便当", "日式", "道具", bento), asset("easternJpSakeSet", "德利陶酒具", "日式", "道具", sake), asset("easternJpGeta", "一双木屐", "日式", "道具", sandals), asset("easternJpBroom", "竹扫帚", "日式", "道具", broom)];
}

export const easternAssets: SceneAsset[] = [
  ...chineseBuildings(), ...chineseFurniture(), ...chineseVehicles(), ...chineseProps(),
  ...japaneseBuildings(), ...japaneseFurniture(), ...japaneseProps(), ...japaneseVehiclesAndNature(),
];
