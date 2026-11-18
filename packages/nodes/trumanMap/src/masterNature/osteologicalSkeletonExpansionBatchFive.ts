import { beam, design, lobe, needle, polygon, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { boneGroups, boneShaft, neuralArch, specimenBone, specimenMount, specimenStand } from "./osteologicalSkeletonExpansionBatchOne";

function oval(x: number, y: number, radiusX: number, radiusY: number): [number, number][] {
  return Array.from({ length: 12 }, (_, index) => { const angle = index * Math.PI / 6; return [x + Math.cos(angle) * radiusX, y + Math.sin(angle) * radiusY]; });
}

// 长颈巨龙为独立的腕龙科骨系，不把象骨架整体伸长，也不声称复制某具馆藏的全部原骨。
// https://www.museumfuernaturkunde.berlin/besuch-planen/die-ausstellung/saurierwelt/
// https://www.nhm.ac.uk/discover/dino-directory/brachiosaurus.html
function giraffatitanSkeleton(): ModelPart[] {
  const bones: ModelPart[] = [], arches: ModelPart[] = [], ribs: ModelPart[] = [];
  const neck = Array.from({ length: 13 }, (_, index) => { const t = index / 12; return { z: 7.1 - t * 4 + Math.sin(t * Math.PI) * .3, y: 12.4 - t * 5.8, radius: .21 + t * .11, depth: .64, region: "颈椎" }; });
  const backY = (z: number) => 5.7 + (z + 3) / 6 * .65;
  const vertebrae = [...neck,
    ...Array.from({ length: 12 }, (_, index) => ({ z: 2.8 - index * .51, y: backY(2.8 - index * .51), radius: .34, depth: .43, region: "背椎" })),
    ...Array.from({ length: 6 }, (_, index) => ({ z: -3.02 - index * .15, y: 5.68 - index * .035, radius: .3, depth: .145, region: "骶椎" })),
    ...Array.from({ length: 42 }, (_, index) => { const t = index / 41; return { z: -3.95 - t * 7.5, y: 5.47 - t * 2.25, radius: .26 - t * .22, depth: .155, region: "尾椎" }; })];
  for (const [index, vertebra] of vertebrae.entries()) {
    const { z, y, radius, depth, region } = vertebra;
    const next = vertebrae[index + 1] ?? vertebrae[index - 1]!;
    const pitch = -Math.atan((next.y - y) / (next.z - z)) * 180 / Math.PI;
    bones.push(lobe(`长颈巨龙独立${region}椎体`, specimenBone, [0, y, z], [radius * 2.1, radius * 1.75, depth], [pitch, 0, 0]));
    const arch = neuralArch([0, y, z], radius, depth * .65); arch.rotation.x += pitch; arches.push(arch);
    if (region !== "颈椎") bones.push(needle("背骶尾椎向背侧延伸的棘突", specimenBone, [0, y + radius * 2, z], [0, y + radius * 2 + (region === "尾椎" ? .18 : .4), z - .07], radius * .33));
    if (region === "颈椎") for (const side of [-1, 1]) bones.push(boneShaft("长颈椎腹侧向后延伸的颈肋", [side * radius * .67, y - radius * .5, z + .1], [side * radius * .8, y - .36, z - .56], .035));
    if (region === "尾椎" && index < 56) for (const side of [-1, 1]) bones.push(boneShaft("长尾腹侧成对汇合的人字骨", [side * radius * .6, y - radius * .5, z], [0, y - radius * 2.7, z + .07], radius * .2));
    if (index >= 13 && index < 38) for (const side of [-1, 1]) bones.push(needle("背骶及前尾椎横向展开的横突", specimenBone, [side * radius * .6, y, z], [side * radius * 2.8, y - .04, z - .04], radius * .3));
  }
  for (let index = 0; index < 12; index++) for (const side of [-1, 1]) {
    const z = 2.8 - index * .51, y = backY(z), spread = 1.15 + Math.sin((index + 1) / 14 * Math.PI) * .65;
    ribs.push(tapered("蜥脚类胸笼独立粗长弯肋", specimenBone, [[side * .26, y, z], [side * .74, y - .23, z + .1], [side * spread, y - .83, z + .25], [side * spread * .98, y - 1.6, z + .35], [side * 1.04, y - 2.17, z + .31], [side * .31, y - 2.37, z + .26]], [.07, .064, .055, .05, .04, .029]));
  }
  for (const side of [-1, 1]) {
    const skull = polygon("长颈巨龙短高头颅的眼眶、鼻孔及眶前窗", specimenBone, [[-.39, .1], [-.45, .52], [-.22, .83], [.1, .87], [.53, .61], [.64, .27], [.58, .04], [.02, 0]], .055, [side < 0 ? -.23 : .175, 12.17, 7.35], [oval(-.18, .45, .12, .18), oval(.19, .59, .14, .12), oval(.4, .27, .12, .13)]);
    skull.rotation = { x: -90, y: 0, z: -90 }; bones.push(skull);
    const jaw: Triple[] = [[side * .2, 12.54, 7], [side * .24, 12.18, 7.21], [side * .22, 12.15, 7.61], [side * .1, 12.2, 7.95], [0, 12.23, 8.01]];
    bones.push(tapered("小型头颅上真实铰接的匙齿下颌", specimenBone, jaw, [.068, .067, .06, .045, .034]));
    for (let tooth = 0; tooth < 7; tooth++) {
      const z = 7.37 + tooth * .078;
      bones.push(boneShaft("上颌前部排列的独立粗匙形齿", [side * .205, 12.28, z], [side * .21, 12.18, z + .015], .026));
    }
    const scapula = polygon("高前肢上方斜置的宽长肩胛骨板", specimenBone, [[-1.15, .85], [-.82, 1.4], [.5, .3], [.55, .05], [.2, 0]], .12, [side < 0 ? -1.06 : .94, 5.55, 1.7]);
    scapula.rotation = { x: -90, y: 0, z: -90 }; bones.push(scapula);
    const coracoid = polygon("肩胛下端包接高柱肢关节的乌喙骨", specimenBone, [[-.27, -.1], [-.3, .23], [-.06, .43], [.25, .28], [.28, -.05], [.02, -.23]], .16, [side < 0 ? -1.08 : .92, 5.6, 2.2]);
    coracoid.rotation = { x: -90, y: 0, z: -90 }; bones.push(coracoid);
    const shoulder: Triple = [side * 1, 5.6, 2.2], elbow: Triple = [side * 1.03, 3.2, 2.35], wrist: Triple = [side * 1.01, .64, 2.42];
    bones.push(boneShaft("长于后肢相应骨系的巨大前肢肱骨", shoulder, elbow, .22), boneShaft("前肢近直立的长桡骨", [elbow[0] - side * .08, elbow[1], elbow[2] + .09], [wrist[0] - side * .06, wrist[1], wrist[2] + .08], .14), boneShaft("与桡骨相邻的粗尺骨", [elbow[0] + side * .12, elbow[1] + .08, elbow[2] - .1], [wrist[0] + side * .09, wrist[1], wrist[2] - .09], .16));
    for (let carpal = 0; carpal < 3; carpal++) bones.push(lobe("桡尺骨末端与U形掌柱之间实际承重的腕骨", specimenBone, [wrist[0] + (carpal - 1) * .15, .66, 2.5], [.22, .16, .24]));
    const ilium = polygon("蜥脚类骨盆的宽髂翼与真实髋臼", specimenBone, [[-.8, .35], [-.65, 1], [.6, 1.15], [.92, .65], [.4, .15], [-.1, 0]], .16, [side < 0 ? -1.08 : .92, 4.55, -2.35], [oval(0, .42, .22, .22)]);
    ilium.rotation = { x: -90, y: 0, z: -90 }; bones.push(ilium);
    bones.push(boneShaft("骨盆前下方长耻骨", [side * .98, 4.92, -2.07], [side * .25, 3.72, -1.09], .12), boneShaft("骨盆后下方向中线汇合的坐骨", [side * .98, 4.91, -2.66], [side * .28, 3.63, -3.2], .115));
    const hip: Triple = [side * .98, 4.97, -2.35], knee: Triple = [side * 1.06, 2.6, -2.25], ankle: Triple = [side * 1, .64, -2.38];
    bones.push(boneShaft("后肢巨大股骨", hip, knee, .25), boneShaft("后肢粗壮胫骨", [knee[0] - side * .055, knee[1], knee[2] + .08], [ankle[0] - side * .04, ankle[1], ankle[2] + .05], .18), boneShaft("粗胫骨外侧的独立腓骨", [knee[0] + side * .19, knee[1], knee[2] - .1], [ankle[0] + side * .13, ankle[1], ankle[2] - .07], .09));
    for (let digit = 0; digit < 5; digit++) {
      const angle = -.9 + digit * .45, x = wrist[0] + Math.sin(angle) * .23, z = wrist[2] + Math.cos(angle) * .19;
      bones.push(boneShaft("蜥脚类前掌U形排列的近直立掌骨柱", [x, .62, z], [x, .17, z + .04], .077));
      if (digit === 0) bones.push(tapered("前掌内侧保留的独立第一指爪", specimenBone, [[x, .17, z + .04], [x - side * .14, .1, z + .13], [x - side * .17, .06, z + .21]], [.07, .042, .004]));
      const footX = ankle[0] + (digit - 2) * .16, footZ = ankle[2] + .3;
      bones.push(boneShaft("后足分开的掌跖骨", [ankle[0] + (digit - 2) * .055, .62, ankle[2]], [footX, .18, footZ], .08));
      bones.push(boneShaft("后足较短的独立趾骨", [footX, .18, footZ], [footX, .12, footZ + .18], .07));
      if (digit < 3) bones.push(tapered("后足内侧三枚弯曲骨爪", specimenBone, [[footX, .12, footZ + .18], [footX, .075, footZ + .34], [footX, .05, footZ + .42]], [.071, .04, .004]));
    }
  }
  const cranialRoof = polygon("横接长颈巨龙左右侧颅的实心颅顶骨板", specimenBone, [[-.23, 6.99], [-.25, 7.4], [-.23, 7.85], [-.23, 7.99], [.23, 7.99], [.23, 7.85], [.25, 7.4], [.23, 6.99]], .065);
  const roofStations = [[6.99, 12.79], [7.4, 13.01], [7.85, 12.78], [7.99, 12.425]];
  for (const vertex of cranialRoof.vertices!) {
    const index = Math.max(1, roofStations.findIndex(([z]) => z! >= vertex.z)), start = roofStations[index - 1]!, end = roofStations[index]!;
    vertex.y += start[1]! + (end[1]! - start[1]!) * (vertex.z - start[0]!) / (end[0]! - start[0]!);
  }
  const palate = polygon("承托上颌齿槽并接两侧颅骨的骨腭", specimenBone, [[-.22, 7.15], [-.22, 7.73], [0, 8.02], [.22, 7.73], [.22, 7.15]], .08, [0, 12.23, 0]);
  const occiput = polygon("长颈末端接头颅的枕骨与真孔", specimenBone, [[-.2, 0], [-.25, .32], [0, .58], [.25, .32], [.2, 0]], .1, [0, 12.24, 7.11], [oval(0, .16, .06, .07)]); occiput.rotation.x = -90;
  bones.push(cranialRoof, palate, occiput, lobe("长颈椎与后颅相接的枕髁", specimenBone, [0, 12.32, 7.08], [.17, .15, .2]));
  const parts = [...boneGroups("长颈巨龙独立骨盆柱肢头颅及分节椎骨", bones), ...boneGroups("长颈巨龙贯孔椎弓骨组", arches), ...boneGroups("长颈巨龙开放长胸肋组", ribs)];
  const rod: Triple[] = [...neck.map(point => [0, point.y, point.z] as Triple), [0, backY(2.8), 2.8], [0, backY(0), 0], [0, 5.55, -3.7], [0, 4.3, -7.8], [0, 3.22, -11.45]];
  parts.push(tapered("穿越分节长颈及躯干长尾的陈列钢芯", specimenMount, rod, rod.map(() => .038)), ...specimenStand(2.3, backY(2.3) - .25, 2.8), ...specimenStand(-2.55, backY(-2.55) - .25, 2.8));
  for (const side of [-1, 1]) parts.push(beam("中央钢芯连接高前肢肩胛内侧的承重支杆", specimenMount, [0, backY(1.3), 1.3], [side * 1, 6.1, 1.3], .04));
  return parts;
}

export const osteologicalSkeletonExpansionBatchFiveDesigns: MasterNatureDesign[] = [
  design("giraffatitanOsteologicalSpecimen", "长颈巨龙完整骨架陈列标本", "器物", giraffatitanSkeleton, ["Giraffatitan brancai", "高前柱肢、U形前掌、独立长颈椎关节与小型开窗头颅", "带接地钢架的腕龙科完整骨系"]),
];
