import { beam, design, lobe, needle, part, polygon, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { boneGroups, boneShaft, neuralArch, specimenBone, specimenIvory, specimenMount, specimenStand } from "./osteologicalSkeletonExpansionBatchOne";

function oval(x: number, y: number, radiusX: number, radiusY: number): [number, number][] {
  return Array.from({ length: 10 }, (_, index) => { const a = index * Math.PI / 5; return [x + Math.cos(a) * radiusX, y + Math.sin(a) * radiusY]; });
}

function skullWidth(z: number): number {
  const points = [[1.48, .38], [1.85, .48], [2.15, .39], [2.65, .24], [3.3, .055]], next = Math.max(1, points.findIndex(([at]) => at! >= z)), a = points[next - 1]!, b = points[next]!;
  return a[1]! + (b[1]! - a[1]!) * (z - a[0]!) / (b[0]! - a[0]!);
}

function skullTop(z: number): number {
  const points = [[1.48, 1.94], [1.82, 2.08], [2.1, 1.92], [2.67, 1.72], [3.23, 1.27], [3.3, 1.04]], next = Math.max(1, points.findIndex(([at]) => at! >= z)), a = points[next - 1]!, b = points[next]!;
  return a[1]! + (b[1]! - a[1]!) * (z - a[0]!) / (b[0]! - a[0]!);
}

function skullFloor(z: number): number {
  const points = [[1.48, 1.43], [1.66, 1.12], [2.05, 1.22], [2.55, 1.14], [3, .98], [3.3, 1.04]], next = Math.max(1, points.findIndex(([at]) => at! >= z)), a = points[next - 1]!, b = points[next]!;
  return a[1]! + (b[1]! - a[1]!) * (z - a[0]!) / (b[0]! - a[0]!);
}

function cranialBridge(name: string, stations: number[], level: (z: number) => number, thickness: number, width = 1): ModelPart {
  const vertices = [0, thickness].flatMap(raise => stations.flatMap(z => [-1, 1].map(side => ({ x: side * skullWidth(z) * width, y: level(z) + raise, z }))));
  const count = stations.length * 2, indices: number[] = [];
  for (let i = 0; i < stations.length - 1; i++) {
    const a = i * 2, b = a + 1, c = a + 2, d = a + 3;
    indices.push(a, b, c, b, d, c, a + count, c + count, b + count, b + count, c + count, d + count, a, c, c + count, a, c + count, a + count, b, d + count, d, b, b + count, d + count);
  }
  indices.push(0, count + 1, 1, 0, count, count + 1, count - 2, count - 1, count * 2 - 1, count - 2, count * 2 - 1, count * 2 - 2);
  return part(name, "mesh", specimenBone, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

// 原创装配角龙类骨系：真骨颈盾与骨角核、齿电池、融合颈、前后分化的四足；不复用兽脚类。
// 角只保留骨性角核，不增加生前角质鞘；颈盾保留实体弯骨，不错误挖成牛角龙式双大孔。
// https://www.amnh.org/exhibitions/permanent/ornithischian-dinosaurs/triceratops
// https://anatomypubs.onlinelibrary.wiley.com/doi/full/10.1002/ar.25196
// https://www.colorado.edu/cumuseum/exhibits/triceratops-seec/triceratops-exhibit-online
// https://doi.org/10.1671/039.029.0406
function triceratopsSkeleton(): ModelPart[] {
  const bones: ModelPart[] = [], arches: ModelPart[] = [];
  const cervicals = Array.from({ length: 10 }, (_, i) => ({ z: 1.48 - i * .105, y: 1.74 + i * .026 }));
  const dorsals = Array.from({ length: 12 }, (_, i) => ({ z: .425 - i * .113, y: 2 + Math.sin(i / 11 * Math.PI) * .1 }));
  for (const [index, v] of cervicals.entries()) { bones.push(lobe(index < 3 ? "前三颈椎真实交叠相融的融合颈椎体" : "融合颈之后可辨的独立短颈椎体", specimenBone, [0, v.y, v.z], [.23, .205, index < 3 ? .13 : .104])); arches.push(neuralArch([0, v.y, v.z], .125, index < 3 ? .11 : .06)); }
  for (const v of dorsals) {
    bones.push(lobe("短而深的躯干部中独立背椎", specimenBone, [0, v.y, v.z], [.26, .23, .113]), needle("背椎上方较高的独立神经棘", specimenBone, [0, v.y + .245, v.z], [0, v.y + .51, v.z - .025], .038)); arches.push(neuralArch([0, v.y, v.z], .14, .065));
    for (const side of [-1, 1]) bones.push(boneShaft("躯椎向肋关节伸出的横突", [side * .07, v.y + .025, v.z], [side * .28, v.y + .025, v.z], .027));
  }
  for (let sacral = 0; sacral < 10; sacral++) {
    const z = -.95 - sacral * .075, y = 2.035 - sacral * .004;
    bones.push(lobe("成年骨盆中彼此真正交叠融合的骶椎体", specimenBone, [0, y, z], [.29, .25, .093]), boneShaft("融合骶骨与左右髂翼相接的宽横突", [-.5, y, z], [.5, y, z], .037), needle("融合骶骨保留的连续背侧骨脊", specimenBone, [0, y + .1, z], [0, y + .4, z], .039));
  }
  for (let tail = 0; tail < 40; tail++) {
    const z = -1.72 - tail * .06, y = 1.98 - tail * .024, radius = .098 - tail * .0022;
    bones.push(lobe("逐节缩小而不拖地的短尾椎体", specimenBone, [0, y, z], [radius * 1.85, radius * 1.65, .061]), needle("尾椎独立短棘突", specimenBone, [0, y + radius, z], [0, y + radius * 2.2, z - .009], radius * .24)); arches.push(neuralArch([0, y, z], radius, .035));
    if (tail < 31) for (const side of [-1, 1]) bones.push(boneShaft("尾椎腹侧独立相接的人字骨半支", [side * radius * .5, y - radius * .4, z], [0, y - radius * 2.2, z - .01], radius * .15));
  }
  for (let rib = 0; rib < dorsals.length; rib++) for (const side of [-1, 1]) {
    const v = dorsals[rib]!, width = .56 + Math.sin((rib + 1) / 14 * Math.PI) * .25;
    bones.push(tapered("深胸两侧粗长而各自分离的弯肋骨", specimenBone, [[side * .25, v.y + .02, v.z], [side * width * .78, v.y - .06, v.z + .035], [side * width, v.y - .39, v.z + .06], [side * width * .88, v.y - .78, v.z + .07], [side * .27, v.y - .98, v.z + .065]], [.031, .029, .025, .022, .016]));
  }
  for (const side of [-1, 1]) {
    const scapula = polygon("向后上方展开的长肩胛骨板", specimenBone, [[-.4, .05], [-.53, .55], [-.32, .85], [.12, .72], [.23, .23], [.07, 0]], .045, [side < 0 ? -.6025 : .5575, 1.35, .55]); scapula.rotation = { x: -90, y: 0, z: -90 }; bones.push(scapula);
    const coracoid = polygon("肩带前下方承接肱骨头的独立乌喙骨", specimenBone, [[-.08, .04], [-.2, .28], [.05, .37], [.25, .2], [.16, 0]], .055, [side < 0 ? -.6075 : .5525, 1.29, .55], [oval(.02, .22, .025, .03)]); coracoid.rotation = { x: -90, y: 0, z: -90 }; bones.push(coracoid);
    const shoulder: Triple = [side * .58, 1.6, .6], elbow: Triple = [side * .75, .92, .35], wrist: Triple = [side * .70, .28, .55];
    bones.push(lobe("嵌于肩胛乌喙骨关节处的肱骨头", specimenBone, shoulder, [.16, .16, .16]), boneShaft("肘低于肩且适度外张的粗壮肱骨", shoulder, elbow, .085), boneShaft("前肢较粗承重桡骨", [elbow[0] - side * .035, elbow[1], elbow[2] + .025], [wrist[0] - side * .03, wrist[1], wrist[2] + .02], .057), boneShaft("前肢后侧有肘突的独立尺骨", [elbow[0] + side * .04, elbow[1] + .07, elbow[2] - .035], [wrist[0] + side * .035, wrist[1], wrist[2] - .025], .06));
    for (let carpal = 0; carpal < 6; carpal++) bones.push(lobe("前掌L形排列基部真正相接的腕骨", specimenBone, [wrist[0] + side * (carpal % 3 - 1) * .05, .265 - Math.floor(carpal / 3) * .025, .54 + Math.floor(carpal / 3) * .045], [.085, .073, .088]));
    const metacarpals: [Triple, Triple, Triple, number][] = [
      [[side * .675, .255, .54], [side * .63, .105, .635], [side * .58, .055, .68], 2],
      [[side * .7, .255, .56], [side * .725, .10, .67], [side * .73, .05, .76], 3],
      [[side * .73, .255, .55], [side * .8, .105, .63], [side * .86, .05, .70], 4],
      [[side * .75, .25, .53], [side * .855, .15, .54], [side * .90, .105, .565], 2],
      [[side * .75, .25, .50], [side * .85, .19, .475], [side * .89, .17, .47], 1],
    ];
    for (const [digit, [proximal, distal, end, count]] of metacarpals.entries()) {
      bones.push(boneShaft(digit < 3 ? "前掌半旋位内侧三根强壮掌骨" : "L形前掌后侧缩短外偏的掌骨", proximal, distal, digit < 3 ? .034 : .024));
      for (let phalanx = 0; phalanx < count; phalanx++) { const a = phalanx / count, b = (phalanx + .98) / count; bones.push(boneShaft(digit < 3 && phalanx === count - 1 ? "内侧三指短宽末节爪骨，无角质蹄鞘" : "前掌分节指骨与退化外侧指", distal.map((v, axis) => v + (end[axis]! - v) * a) as Triple, distal.map((v, axis) => v + (end[axis]! - v) * b) as Triple, (digit < 3 ? .029 : .017) * (1 - a * .45))); }
    }
    const ilium = polygon("与融合骶横突相接的宽长髂翼与真髋臼", specimenBone, [[-.5, .13], [-.65, .5], [-.27, .65], [.43, .58], [.60, .35], [.30, .04], [-.1, 0]], .06, [side < 0 ? -.53 : .47, 1.52, -1.28], [oval(0, .31, .09, .11)]); ilium.rotation = { x: -90, y: 0, z: -90 }; bones.push(ilium);
    const hip: Triple = [side * .5, 1.83, -1.28], knee: Triple = [side * .61, 1.05, -1.08], ankle: Triple = [side * .58, .34, -1.4];
    bones.push(lobe("与髋臼骨环连接的粗股骨头", specimenBone, hip, [.23, .23, .23]), boneShaft("后肢近直立的独立粗股骨", hip, knee, .095), boneShaft("后肢粗壮承重胫骨", [knee[0] - side * .035, knee[1], knee[2]], [ankle[0] - side * .025, ankle[1], ankle[2]], .075), boneShaft("胫骨旁独立而细长的腓骨", [knee[0] + side * .055, knee[1], knee[2] - .035], [ankle[0] + side * .048, ankle[1], ankle[2] - .035], .042));
    bones.push(boneShaft("向后下方延伸的坐骨长支", [side * .49, 1.72, -1.38], [side * .30, .89, -1.92], .048), boneShaft("髋部向前外侧伸出的耻骨前支", [side * .48, 1.73, -1.18], [side * .76, 1.25, -.67], .055));
    for (let tarsal = 0; tarsal < 5; tarsal++) bones.push(lobe("后足承托紧凑跖骨的独立跗骨", specimenBone, [ankle[0] + side * (tarsal % 3 - 1) * .064, .31 - Math.floor(tarsal / 3) * .027, -1.395 + Math.floor(tarsal / 3) * .06], [.10, .09, .105]));
    for (let toe = 0; toe < 4; toe++) {
      const root: Triple = [ankle[0] + side * (toe - 1.5) * .035, .286, -1.345], distal: Triple = [ankle[0] + side * (toe - 1.5) * .057, .11, -1.18], end: Triple = [distal[0], .052, -.99 + Math.abs(toe - 1.5) * .03], count = toe === 0 ? 2 : toe === 1 ? 3 : 4;
      bones.push(boneShaft("后足并拢而非放射外劈的独立跖骨", root, distal, .039));
      for (let phalanx = 0; phalanx < count; phalanx++) { const a = phalanx / count, b = (phalanx + .98) / count; bones.push(boneShaft(phalanx === count - 1 ? "后足短宽末节爪骨" : "后足分节趾骨", distal.map((v, axis) => v + (end[axis]! - v) * a) as Triple, distal.map((v, axis) => v + (end[axis]! - v) * b) as Triple, .033 * (1 - a * .45))); }
    }
  }
  const frill = polygon("三角龙实心而弯曲的顶鳞骨颈盾，无虚构双大窗", specimenBone, [[-.38, 0], [-.82, .30], [-1, .70], [-.75, 1.08], [-.34, 1.23], [.34, 1.23], [.75, 1.08], [1, .70], [.82, .30], [.38, 0], [.20, .45], [0, .55], [-.20, .45]], .07, [0, 1.47, 1.58]);
  for (const vertex of frill.vertices!) vertex.y += vertex.x * vertex.x * .12;
  frill.rotation.x = -110; bones.push(frill);
  const headOutline: [number, number][] = [[1.48, 1.43], [1.48, 1.94], [1.82, 2.08], [2.10, 1.92], [2.67, 1.72], [3.23, 1.27], [3.3, 1.04], [3, .98], [2.55, 1.14], [2.05, 1.22], [1.66, 1.12]];
  for (const side of [-1, 1]) {
    const skull = polygon("三角龙颅侧真眼眶、颞窗、鼻孔及宽颧骨", specimenBone, headOutline, .06, [0, 0, 0], [oval(2.02, 1.75, .12, .14), oval(1.68, 1.55, .085, .1), oval(2.82, 1.44, .15, .11)]);
    for (const vertex of skull.vertices!) { const thickness = .06 * (.3 + .7 * (skullWidth(vertex.x) - .055) / .425); vertex.y = side * (skullWidth(vertex.x) - thickness * .5) + (vertex.y / .06 - .5) * thickness; }
    skull.rotation = { x: -90, y: 0, z: -90 }; bones.push(skull);
    bones.push(tapered("眉角只保留粗大弯曲骨性角核", specimenBone, [[side * .37, 2.0, 2.0], [side * .40, 2.38, 2.29], [side * .43, 2.56, 2.61], [side * .43, 2.58, 2.76]], [.14, .095, .045, .004]));
    const jaw = polygon("有高冠突及真实下颌窗的厚下颌支", specimenBone, [[1.55, 1.19], [1.75, 1.4], [2.1, 1.25], [2.6, 1.14], [3.17, .94], [3.2, .8], [2.5, .87], [2.05, .95], [1.7, 1.01], [1.54, 1.08]], .07, [0, 0, 0], [oval(1.87, 1.12, .095, .055)]);
    for (const vertex of jaw.vertices!) vertex.y += side * (skullWidth(vertex.x) * .75 - .025) - .035;
    jaw.rotation = { x: -90, y: 0, z: -90 }; bones.push(jaw, boneShaft("下颌后端与后颅相接的方骨关节支", [side * .37, 1.55, 1.6], [side * .285, 1.23, 1.64], .065));
    const upperBattery: Triple[] = [[side * .28, 1.266, 2.0], [side * .20, 1.166, 2.65]], lowerBattery: Triple[] = [[side * .265, 1.135, 2.0], [side * .185, 1.035, 2.65]];
    bones.push(tapered("上颌内侧齿电池的真实牙槽骨带", specimenBone, upperBattery, [.041, .041]), tapered("下颌内侧齿电池的真实牙槽骨带", specimenBone, lowerBattery, [.039, .039]));
    for (const upper of [false, true]) for (let column = 0; column < 18; column++) for (let replacement = 0; replacement < 2; replacement++) {
      const t = (column + .5) / 18, path = upper ? upperBattery : lowerBattery, p = path[0]!.map((v, axis) => v + (path[1]![axis]! - v) * t) as Triple, direction = upper ? -1 : 1;
      p[1] += direction * (.04 - replacement * .048);
      const tooth = polygon("齿电池中独立叶形齿冠及重叠替换齿", specimenIvory, [[-.016, -.023], [-.02, .001], [0, .032], [.02, .001], [.016, -.023]].map(([z, y]) => [z!, y! * direction]), .017, [p[0] - .0085, p[1], p[2]]); tooth.rotation = { x: -90, y: 0, z: -90 }; bones.push(tooth);
    }
  }
  const roof = cranialBridge("从骨性颈盾向鼻吻连续横接的颅顶骨", [1.48, 1.82, 2.1, 2.67, 3.23, 3.3], skullTop, .055);
  const occiput = polygon("角龙后颅的枕骨、真实枕孔与颈盾连接骨板", specimenBone, [[-.32, 0], [-.39, .26], [-.30, .61], [.30, .61], [.39, .26], [.32, 0]], .065, [0, 1.42, 1.555], [oval(0, .5, .034, .038)]); occiput.rotation.x = -90;
  bones.push(roof, occiput, lobe("与融合颈接合的独立枕髁", specimenBone, [0, 1.74, 1.5], [.17, .16, .17]), tapered("短鼻角的真实骨性角核", specimenBone, [[0, 1.70, 2.65], [0, 1.94, 2.82], [0, 2.04, 2.95]], [.12, .065, .004]));
  // 颈盾中央下缘给后枕和融合颈留天然凹口，不把实体板穿过脊髓通路；根部由左右鳞骨连续承接。
  for (const side of [-1, 1]) bones.push(boneShaft("后颅侧部到实体颈盾根部连续相接的鳞骨", [side * .29, 1.78, 1.52], [side * .32, 1.78, 1.43], .06));
  const floorStations = [1.48, 1.66, 1.82, 2.05], palate = polygon("后腭骨保留真实内鼻孔并接合两侧骨颅", specimenBone, [...floorStations.map(z => [-skullWidth(z) * .96, z] as [number, number]), ...floorStations.toReversed().map(z => [skullWidth(z) * .96, z] as [number, number])], .065, [0, 0, 0], [oval(0, 1.78, .065, .065)]);
  for (const vertex of palate.vertices!) vertex.y += skullFloor(vertex.z);
  bones.push(palate, cranialBridge("沿真实纵剖高程横接两侧上颌并托住齿电池的前腭骨", [2.05, 2.15, 2.55, 2.65, 3, 3.23, 3.3], skullFloor, .065, .96), tapered("上喙的吻骨骨性核心，无额外角质鞘", specimenBone, [[0, 1.04, 3.0], [0, 1.11, 3.25], [0, 1.03, 3.31]], [.095, .07, .008]), tapered("联合左右下颌的前齿骨骨性下喙", specimenBone, [[-.13, .96, 3.06], [0, .93, 3.22], [.13, .96, 3.06]], [.06, .055, .06]));
  const parts = [...boneGroups("三角龙完整分节中轴、四足及角盾颅颌骨组", bones), ...boneGroups("三角龙真实椎孔及融合颈椎弓组", arches)];
  const steel: Triple[] = [[0, 1.044, -4.06], [0, 1.5, -2.9], [0, 1.999, -1.625], [0, 2.02, -.95], ...dorsals.toReversed().map(v => [0, v.y, v.z] as Triple), ...cervicals.toReversed().map(v => [0, v.y, v.z] as Triple)];
  parts.push(tapered("把分节骨系实际连为一体的细钢中轴", specimenMount, steel, steel.map(() => .018)));
  for (const [z, y] of [[-1.25, 1.99], [.199, 1.995], [2.55, 1.145]]) parts.push(...specimenStand(z!, y!, z! > 2 ? .75 : 1.55));
  for (const side of [-1, 1]) parts.push(beam("主轴向独立肩胛骨的真实承重短托", specimenMount, [0, 1.9703, .55], [side * .58, 1.92, .55], .018));
  return parts;
}

export const osteologicalSkeletonExpansionBatchElevenDesigns: MasterNatureDesign[] = [
  design("triceratopsOsteologicalSpecimen", "三角龙完整骨架陈列标本", "器物", triceratopsSkeleton, ["Triceratops horridus", "实体弯骨颈盾、三骨角核、齿电池与融合颈", "半旋L形前掌及紧凑后足的完整四足角龙骨系"]),
];
