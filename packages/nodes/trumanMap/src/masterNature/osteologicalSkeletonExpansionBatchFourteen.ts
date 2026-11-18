import { Quaternion, Vector3 } from "three";
import { beam, combineMeshes, design, lobe, needle, part, polygon, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { boneGroups, boneShaft, neuralArch, specimenBone, specimenIvory, specimenMount, specimenStand } from "./osteologicalSkeletonExpansionBatchOne";

function oval(x: number, y: number, radiusX: number, radiusY: number): [number, number][] {
  return Array.from({ length: 10 }, (_, i) => { const a = i * Math.PI / 5; return [x + Math.cos(a) * radiusX, y + Math.sin(a) * radiusY]; });
}

function horseHeadWidth(z: number): number {
  const points = [[1.32, .105], [1.43, .12], [1.64, .08], [1.96, .065]], next = Math.max(1, points.findIndex(([at]) => at! >= z)), a = points[next - 1]!, b = points[next]!;
  return a[1]! + (b[1]! - a[1]!) * (z - a[0]!) / (b[0]! - a[0]!);
}

const horseHeadTop = (z: number) => 1.98 - (z - 1.32) * .765625;

// 原创单蹄骨系，不从象/猿骨架换比例：单承重指III、II/IV赘骨、三节指骨及舟骨均真实立体。
// 蹄只建骨性末节，不把角质蹄壳、马蹄铁或软质蹄叉伪装成骨。
// https://www.amnh.org/exhibitions/permanent/advanced-mammals/evolution-of-horses
// https://pressbooks.umn.edu/largeanimalanatomy/chapter/distal-limb/
// https://www.bristol.ac.uk/news/2023/june/horses-lost-their-toes.html
function domesticHorseSkeleton(): ModelPart[] {
  const bones: ModelPart[] = [], arches: ModelPart[] = [];
  const cervicals: Triple[] = Array.from({ length: 7 }, (_, i) => [0, 1.825 - i * .046, 1.30 - i * .085]);
  for (const p of cervicals) {
    const local = combineMeshes("马的独立长颈椎体与真孔椎弓", specimenBone, [tapered("颈椎宽端窄腰的独立骨体", specimenBone, [[0, 0, -.047], [0, 0, -.025], [0, 0, .025], [0, 0, .047]], [.046, .033, .033, .046]), neuralArch([0, 0, .016], .044, .048)]);
    const frame = new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), new Vector3(0, .54, 1).normalize());
    for (const v of local.vertices!) { const q = new Vector3(v.x, v.y, v.z).applyQuaternion(frame).add(new Vector3(...p)); v.x = q.x; v.y = q.y; v.z = q.z; } bones.push(local);
  }
  const dorsals: Triple[] = Array.from({ length: 18 }, (_, i) => [0, 1.53 + Math.sin(i / 17 * Math.PI) * .04, .68 - i * .08]), lumbars: Triple[] = Array.from({ length: 6 }, (_, i) => [0, 1.53 - i * .003, -.78 - i * .067]);
  for (const [name, points] of [["马的独立胸椎体", dorsals], ["马的独立腰椎体", lumbars]] as [string, Triple[]][]) for (const [i, p] of points.entries()) {
    bones.push(lobe(name, specimenBone, p, [.105, .095, .09]), needle("胸腰椎上可辨的棘突及马肩隆骨性基础", specimenBone, [0, p[1] + .08, p[2]], [0, p[1] + (points === dorsals && i < 7 ? .28 - i * .016 : .16), p[2] - .035], .018)); arches.push(neuralArch(p, .05, .045));
  }
  for (let i = 0; i < 5; i++) bones.push(lobe("骶骨中按真实外沿交叠融合的五枚骶椎体", specimenBone, [0, 1.51 - i * .004, -1.20 - i * .055], [.125, .11, .068]));
  for (let i = 0; i < 18; i++) bones.push(lobe("不包含软质尾毛的分节马尾椎", specimenBone, [0, 1.48 - i * .025, -1.50 - i * .05], [.073 - i * .0031, .063 - i * .0026, .057]));
  for (const [i, p] of dorsals.entries()) for (const side of [-1, 1]) {
    const width = .25 + Math.sin((i + 1) / 20 * Math.PI) * .15;
    const path: Triple[] = [[side * .04, p[1] + .015, p[2]], [side * width * .83, p[1] - .035, p[2] + .018], [side * width, p[1] - .25, p[2] + .035], [side * width * .69, p[1] - .51, p[2] + .04]];
    if (i < 8) path.push([side * .04, .99 - i * .013, .64 - i * .105]);
    bones.push(tapered("马窄深胸廓中独立成对的长弯肋", specimenBone, path, path.map((_, j) => .015 - j * .002)));
  }
  for (let i = 0; i < 8; i++) bones.push(lobe("胸骨中独立相接的骨性胸骨节", specimenBone, [0, .982 - i * .013, .64 - i * .105], [.085, .048, .125]));
  for (const side of [-1, 1]) {
    const scapula = polygon("马无锁骨肩带的长斜肩胛骨", specimenBone, [[-.26, .04], [-.39, .48], [-.21, .71], [.06, .64], [.18, .18], [.04, 0]], .025, [side < 0 ? -.2025 : .1775, 1.09, .64]); scapula.rotation = { x: -90, y: 0, z: -90 }; bones.push(scapula);
    const shoulder: Triple = [side * .19, 1.23, .69], elbow: Triple = [side * .22, .95, .44], carpus: Triple = [side * .21, .53, .61], foreFetlock: Triple = [side * .21, .26, .615];
    bones.push(lobe("肩胛关节盂中相接的肱骨头", specimenBone, shoulder, [.095, .095, .095]), boneShaft("马前肢短斜而粗的肱骨", shoulder, elbow, .041), boneShaft("前肢长而不作灵长类旋转的桡骨", elbow, carpus, .033), tapered("与桡骨实接且保留肘突的退化尺骨", specimenBone, [[side * .22, 1.01, .405], [side * .22, .95, .416], [side * .21, .75, .505]], [.023, .022, .012]));
    const coxa = polygon("马骨盆的长髂翼、髋臼及真闭孔", specimenBone, [[.27, .12], [.18, .36], [-.16, .34], [-.30, .15], [-.26, -.07], [.02, -.12], [.22, -.02]], .035, [side < 0 ? -.2275 : .1925, 1.11, -1.17], [oval(.02, .17, .045, .05), oval(.01, -.015, .085, .06)]); coxa.rotation = { x: -90, y: 0, z: -90 }; bones.push(coxa);
    bones.push(boneShaft("骶骨向髂翼实际相接的骶髂骨突", [0, 1.49, -1.28], [side * .21, 1.40, -1.28], .023), boneShaft("左右骨盆腹侧的耻骨联合支", [side * .21, 1.13, -1.06], [0, 1.12, -1.08], .019));
    const hip: Triple = [side * .21, 1.28, -1.15], knee: Triple = [side * .24, .89, -.91], hock: Triple = [side * .235, .49, -1.23], hindFetlock: Triple = [side * .235, .245, -1.15];
    bones.push(lobe("髋臼内的股骨球头", specimenBone, hip, [.105, .105, .105]), boneShaft("后肢向前斜下的独立股骨", hip, knee, .046), boneShaft("后肢斜向后踝的长胫骨", knee, hock, .036), boneShaft("后肢胫骨旁的近端退化腓骨", [side * .263, .89, -.92], [side * .257, .72, -1.04], .013), lobe("马膝前独立髌骨", specimenBone, [side * .24, .9, -.875], [.048, .06, .026]), boneShaft("跗骨后方上伸的跟骨骨突", [side * .235, .49, -1.255], [side * .235, .60, -1.30], .019));
    for (const [front, joint, fetlock] of [[true, carpus, foreFetlock], [false, hock, hindFetlock]] as [boolean, Triple, Triple][]) {
      for (let element = 0; element < 6; element++) bones.push(lobe(front ? "前腕双排相接的独立腕骨" : "后踝内实际相接的独立跗骨", specimenBone, [joint[0] + side * (element % 3 - 1) * .021, joint[1] - Math.floor(element / 3) * .021, joint[2] + Math.floor(element / 3) * .012], [.04, .038, .043]));
      bones.push(boneShaft("唯一承重的第三掌跖骨，非两趾合成管骨", [joint[0], joint[1] - .02, joint[2] + .01], fetlock, .021));
      for (const lateral of [-1, 1]) bones.push(boneShaft("主掌跖骨两侧短止、不长出额外蹄的II或IV赘骨", [joint[0] + lateral * .018, joint[1] - .017, joint[2] - .004], [fetlock[0] + lateral * .016, fetlock[1] + .08, fetlock[2] - .012], .007));
      const pastern: Triple = [fetlock[0], .135, fetlock[2] + .055], distal: Triple = [fetlock[0], .104, fetlock[2] + .086], coffinZ = fetlock[2] + .108;
      bones.push(boneShaft("单趾近端长系骨即第一指骨", fetlock, pastern, .018), boneShaft("单趾短冠骨即第二指骨", pastern, distal, .02));
      for (const lateral of [-1, 1]) bones.push(lobe("球节后方成对相接的近端籽骨", specimenBone, [fetlock[0] + lateral * .012, fetlock[1] + .005, fetlock[2] - .018], [.022, .032, .022]));
      const coffin = polygon("蹄壳内第三指骨的宽弯骨缘、后突和真实骨孔", specimenBone, [[-.044, -.046], [-.065, -.009], [-.063, .044], [-.035, .082], [0, .095], [.035, .082], [.063, .044], [.065, -.009], [.044, -.046], [.021, -.034], [0, -.017], [-.021, -.034]], .045, [fetlock[0], 0, coffinZ], [oval(-.027, .008, .005, .007), oval(.027, .008, .005, .007)]);
      for (const vertex of coffin.vertices!) vertex.y += .05 - vertex.z * .3;
      const extensor = polygon("蹄骨背侧上伸并真正承接冠骨的伸肌骨突", specimenBone, [[.012, .086], [-.010, .088], [-.030, .113], [-.022, .133], [-.002, .116], [.016, .092]], .05, [fetlock[0] - .025, 0, coffinZ]); extensor.rotation = { x: -90, y: 0, z: -90 };
      bones.push(coffin, extensor, lobe("蹄骨后上方真正相接的远端舟状籽骨", specimenBone, [fetlock[0], .105, coffinZ - .041], [.045, .024, .028]));
    }
  }
  const stations = [1.32, 1.43, 1.64, 1.96], roof = polygon("横接长颜面的薄额骨鼻骨板", specimenBone, [...stations.map(z => [-horseHeadWidth(z), z] as [number, number]), ...stations.toReversed().map(z => [horseHeadWidth(z), z] as [number, number])], .026);
  for (const v of roof.vertices!) v.y += horseHeadTop(v.z);
  const palate = polygon("沿实际斜颅底接合左右上颌的硬骨腭", specimenBone, [...stations.map(z => [-horseHeadWidth(z) * .94, z] as [number, number]), ...stations.toReversed().map(z => [horseHeadWidth(z) * .94, z] as [number, number])], .035);
  for (const v of palate.vertices!) v.y += horseHeadTop(v.z) - .18;
  const occiput = polygon("长颅后壁带真实枕孔的枕骨", specimenBone, [[-.09, 0], [-.11, .08], [-.07, .18], [.07, .18], [.11, .08], [.09, 0]], .04, [0, 1.8, 1.32], [oval(0, .065, .016, .019)]); occiput.rotation.x = -90; bones.push(roof, palate, occiput);
  for (const side of [-1, 1]) {
    const skull = polygon("长颜面真眼眶、前鼻孔及下方骨性牙槽", specimenBone, [[1.32, 1.80], [1.32, 1.98], [1.43, horseHeadTop(1.43)], [1.64, horseHeadTop(1.64)], [1.96, horseHeadTop(1.96)], [1.96, horseHeadTop(1.96) - .18], [1.64, horseHeadTop(1.64) - .18], [1.43, horseHeadTop(1.43) - .18]], .025, [0, 0, 0], [oval(1.43, 1.827, .044, .049), oval(1.84, 1.497, .063, .025)]);
    for (const v of skull.vertices!) v.y += side * (horseHeadWidth(v.x) - .0125) - .0125; skull.rotation = { x: -90, y: 0, z: -90 }; bones.push(skull);
    const jawVertices = stations.flatMap(z => { const x = side * (horseHeadWidth(z) * .79 - .012), y = horseHeadTop(z) - .28; return [{ x: x - .0175, y, z }, { x: x + .0175, y, z }, { x: x + .0175, y: y + .055, z }, { x: x - .0175, y: y + .055, z }]; });
    const jawIndices = [0, 2, 1, 0, 3, 2];
    for (let station = 0; station < stations.length - 1; station++) for (let corner = 0; corner < 4; corner++) { const a = station * 4 + corner, b = station * 4 + (corner + 1) % 4; jawIndices.push(a, b, b + 4, a, b + 4, a + 4); }
    const last = (stations.length - 1) * 4; jawIndices.push(last, last + 1, last + 2, last, last + 2, last + 3);
    const lower = part("按真实分站宽度接下齿并保留显著齿隙的长下颌体", "mesh", specimenBone, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices: jawVertices, indices: jawIndices });
    const ramus = polygon("位于上颌外侧而不穿过硬腭的高下颌升支", specimenBone, [[1.32, 1.65], [1.32, 1.76], [1.34, 1.9], [1.41, 1.87], [1.47, 1.67], [1.43, 1.61]], .025, [side < 0 ? -.147 : .122, 0, 0]); ramus.rotation = { x: -90, y: 0, z: -90 };
    bones.push(lower, ramus, boneShaft("外侧升支与内侧长颌体实际相接的下颌角骨桥", [side * .134, 1.65, 1.40], [side * .083, 1.64, 1.43], .018), boneShaft("后颅与外侧下颌髁相接的关节骨区", [side * .095, 1.82, 1.35], [side * .13, 1.82, 1.35], .022));
    for (const upper of [false, true]) {
      const direction = upper ? -1 : 1;
      for (let tooth = 0; tooth < 6; tooth++) {
        const z = 1.425 + tooth * .037, y = horseHeadTop(z) - (upper ? .158 : .245), x = side * (horseHeadWidth(z) * (upper ? .82 : .72) - .006);
        bones.push(lobe(tooth < 3 ? "长齿冠的独立前臼齿，保留前方齿隙" : "长齿冠的独立臼齿", specimenIvory, [x, y + direction * .01, z], [.023, .055, .029]));
      }
      const canineZ = 1.825, canineY = horseHeadTop(canineZ) - (upper ? .16 : .245); bones.push(tapered("成年雄马齿隙内独立的小犬齿", specimenIvory, [[side * .047, canineY, canineZ], [side * .047, canineY + direction * .023, canineZ], [side * .047, canineY + direction * .029, canineZ + .003]], [.0055, .003, .0003]));
      for (let incisor = 0; incisor < 3; incisor++) { const z = 1.935 - incisor * .008, y = horseHeadTop(z) - (upper ? .158 : .245); bones.push(lobe("吻端六齿弧中各自生根的扁门齿", specimenIvory, [side * (.009 + incisor * .017), y + direction * .008, z], [.017, .034, .016])); }
    }
  }
  const symphysis = polygon("联合左右下颌并实接六枚下门齿的宽骨性联合", specimenBone, [[-.05, 1.90], [-.06, 1.96], [.06, 1.96], [.05, 1.90]], .055);
  for (const vertex of symphysis.vertices!) vertex.y += horseHeadTop(vertex.z) - .28;
  bones.push(symphysis, lobe("后枕与首颈椎连续接合的枕髁", specimenBone, [0, 1.825, 1.30], [.075, .075, .075]));
  const parts = [...boneGroups("家马单蹄高肢、长颜面齿隙及完整骨系组", bones), ...boneGroups("家马胸腰真孔椎弓组", arches)];
  const steel: Triple[] = [[0, 1.055, -2.35], [0, 1.42, -1.6], [0, 1.50, -1.3], ...lumbars.toReversed(), ...dorsals.toReversed(), ...cervicals.toReversed()];
  parts.push(tapered("穿各椎体支承整具家马骨系的细钢中轴", specimenMount, steel, steel.map(() => .009)), ...specimenStand(-1.03, 1.48, .27), ...specimenStand(.36, 1.49, .27));
  for (const side of [-1, 1]) parts.push(beam("主轴到肩胛骨的真实短托", specimenMount, [0, 1.55, .36], [side * .19, 1.55, .36], .008));
  return parts;
}

export const osteologicalSkeletonExpansionBatchFourteenDesigns: MasterNatureDesign[] = [
  design("domesticHorseOsteologicalSpecimen", "家马完整骨架陈列标本", "器物", domesticHorseSkeleton, ["Equus ferus caballus", "单指III承重、II及IV掌跖赘骨、三指骨舟骨与真蹄骨", "无角质蹄壳、带长颜面齿隙及40独立齿的骨系"]),
];
