import { Quaternion, Vector3 } from "three";
import { beam, combineMeshes, design, lobe, polygon, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { boneGroups, boneShaft, neuralArch, specimenBone, specimenIvory, specimenMount, specimenStand } from "./osteologicalSkeletonExpansionBatchOne";

function oval(x: number, y: number, radiusX: number, radiusY: number): [number, number][] {
  return Array.from({ length: 10 }, (_, i) => { const a = i * Math.PI / 5; return [x + Math.cos(a) * radiusX, y + Math.sin(a) * radiusY]; });
}

function slothVertebra(name: string, position: Triple, radius: number, depth: number): ModelPart {
  const local = combineMeshes(name, specimenBone, [tapered("地懒椎体的宽关节端与骨干", specimenBone, [[0, 0, -depth * .48], [0, 0, -depth * .2], [0, 0, depth * .2], [0, 0, depth * .48]], [radius, radius * .77, radius * .77, radius]), neuralArch([0, 0, .012], radius * .82, depth * .58)]);
  const frame = new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), new Vector3(0, .874, .486).normalize());
  for (const vertex of local.vertices!) { const p = new Vector3(vertex.x, vertex.y, vertex.z).applyQuaternion(frame).add(new Vector3(...position)); vertex.x = p.x; vertex.y = p.y; vertex.z = p.z; } return local;
}

function slothUngual(name: string, position: Triple, length: number, thickness: number, drop = length * .5): ModelPart {
  const curve = drop / .115;
  const claw = polygon(name, specimenBone, [[0, 0], [length * .33, .018 * curve], [length * .84, -.035 * curve], [length, -drop], [length * .78, -.092 * curve], [length * .53, -.037 * curve], [length * .15, -.03 * curve], [0, -.028 * curve]], thickness, [position[0] - thickness * .5, position[1], position[2]], [oval(length * .14, -.008 * curve, length * .035, .005 * curve)]);
  claw.rotation = { x: -90, y: 0, z: -90 }; return claw;
}

// 独立的跖行大地懒骨架复原陈列：厚骨盆、支承长尾、三大手爪和第三后趾P1/P2融合。
// 不用猿骨整体放大，也不把Megatherium外侧负重足套给跖行的Megalonyx。
// https://digitalcommons.nmsu.edu/zuhlcollection/1597/
// https://qrius.si.edu/browse/object/10023354
// https://doi.org/10.1080/02724634.2022.2124115
// https://ortonmuseum.osu.edu/learning/history-jeff-giant-ground-sloth
function megalonyxReconstructedSkeleton(): ModelPart[] {
  const bones: ModelPart[] = [];
  const cervicals: Triple[] = Array.from({ length: 7 }, (_, i) => [0, 2.21 - i * .028, .40 - i * .024]), dorsals: Triple[] = Array.from({ length: 16 }, (_, i) => [0, 1.97 - i * .045, .22 - i * .025]), lumbars: Triple[] = Array.from({ length: 3 }, (_, i) => [0, 1.24 - i * .058, -.19 - i * .04]);
  for (const [name, points, radius, depth] of [["地懒独立短颈椎与真椎孔", cervicals, .042, .037], ["立起深胸中的独立附肋背椎", dorsals, .059, .05], ["短腰部独立粗腰椎", lumbars, .068, .068]] as [string, Triple[], number, number][]) for (const point of points) bones.push(slothVertebra(name, point, radius, depth));
  for (let sacral = 0; sacral < 6; sacral++) { const p: Triple = [0, 1.08 - sacral * .018, -.30 - sacral * .035]; bones.push(tapered("根部真实交叠融合的厚骶骨体", specimenBone, [[0, p[1] + .011, p[2] + .021], [0, p[1] - .011, p[2] - .021]], [.077, .077]), boneShaft("骶骨向左右厚髂骨相接的短横突", [-.28, p[1], p[2]], [.28, p[1], p[2]], .035)); }
  const tail: Triple[] = Array.from({ length: 20 }, (_, i) => [0, .99 - i * .044, -.55 - i * .045]);
  for (const [i, p] of tail.entries()) { const radius = .096 - i * .0034; bones.push(lobe("从厚根逐节收小而能成为三点支承的尾椎体", specimenBone, p, [radius * 1.8, radius * 1.8, .075])); for (const side of [-1, 1]) bones.push(boneShaft("强壮尾椎腹侧独立的人字骨半支", [side * radius * .4, p[1] - radius * .3, p[2]], [0, p[1] - radius * 1.2, p[2] - .01], radius * .14)); }
  for (const [rib, p] of dorsals.entries()) for (const side of [-1, 1]) {
    const width = .30 + Math.sin((rib + 1) / 18 * Math.PI) * .16, path: Triple[] = [[side * .045, p[1], p[2]], [side * width * .8, p[1] - .03, p[2] + .14], [side * width, p[1] - .08, p[2] + .31], [side * width * .66, p[1] - .11, p[2] + .43]];
    if (rib < 8) path.push([side * .04, 1.84 - rib * .06, .61 - rib * .026]);
    bones.push(tapered("宽深立胸中从背后绕向胸骨的独立长肋", specimenBone, path, path.map((_, i) => .019 - i * .0024)));
  }
  for (let sternal = 0; sternal < 8; sternal++) bones.push(lobe("深胸前方独立相接的骨性胸骨节", specimenBone, [0, 1.83 - sternal * .06, .61 - sternal * .026], [.105, .078, .055]));
  for (const side of [-1, 1]) {
    const scapula = polygon("地懒宽三角肩胛骨板", specimenBone, [[side * .14, 1.64], [side * .28, 2.015], [side * .48, 1.88], [side * .40, 1.64]], .03, [0, 0, .015]); scapula.rotation.x = -90; bones.push(scapula);
    const shoulder: Triple = [side * .34, 1.86, .17], elbow: Triple = [side * .40, 1.50, .60], wrist: Triple = [side * .41, 1.35, .98];
    bones.push(boneShaft("肩胛板到前侧肩关节的骨性肩峰", [side * .38, 1.87, .005], shoulder, .045), tapered("从胸骨到肩带的完整弯锁骨", specimenBone, [[side * .04, 1.74, .56], [side * .22, 1.83, .34], shoulder], [.025, .024, .028]), lobe("肩关节中可辨的肱骨球头", specimenBone, shoulder, [.12, .12, .12]), boneShaft("粗壮长前臂近端的独立肱骨", shoulder, elbow, .053), boneShaft("抓握前臂独立长桡骨", [elbow[0] - side * .021, elbow[1], elbow[2] + .02], [wrist[0] - side * .02, wrist[1], wrist[2] + .022], .032), boneShaft("与桡骨分离而可辨的独立尺骨及肘突", [elbow[0] + side * .026, elbow[1] + .04, elbow[2] - .026], [wrist[0] + side * .024, wrist[1], wrist[2] - .024], .035));
    for (let carpal = 0; carpal < 8; carpal++) bones.push(lobe("三枚大手爪基部的双排独立腕骨", specimenBone, [wrist[0] + side * (carpal % 4 - 1.5) * .027, wrist[1] - Math.floor(carpal / 4) * .02, .972 + Math.floor(carpal / 4) * .043], [.043, .038, .05]));
    for (let digit = 0; digit < 5; digit++) {
      const offset = side * (digit - 2) * .035, root: Triple = [wrist[0] + offset * .6, 1.33, 1.012], joint: Triple = [wrist[0] + offset, 1.25, 1.13 + (digit < 3 ? .04 : 0)], tip: Triple = [joint[0], 1.225, joint[2] + (digit < 3 ? .10 : .04)];
      bones.push(boneShaft("五指手中各自独立的掌骨及短侧掌", root, joint, digit < 3 ? .022 : .014), boneShaft("爪基部独立近节指骨", joint, tip, digit < 3 ? .02 : .011));
      if (digit < 3) bones.push(slothUngual("I至III三大手爪的弯扁骨性末节，保留骨孔", tip, digit === 2 ? .19 : .15 + digit * .015, .035));
    }
    const pelvis = polygon("厚重髂翼、髋臼骨环和真闭孔构成的半骨盆", specimenBone, [[.22, .15], [.10, .48], [-.18, .50], [-.35, .23], [-.27, -.02], [-.06, -.08], [.13, .03]], .045, [side < 0 ? -.3025 : .2575, .75, -.32], [oval(.02, .25, .065, .072), oval(.005, .05, .092, .043)]); pelvis.rotation = { x: -90, y: 0, z: -90 }; bones.push(pelvis);
    const hip: Triple = [side * .28, 1, -.30], knee: Triple = [side * .32, .58, -.08], ankle: Triple = [side * .34, .18, -.41];
    bones.push(lobe("厚髋臼内承重的粗股骨头", specimenBone, hip, [.18, .18, .18]), boneShaft("支承立姿的粗壮短股骨", hip, knee, .074), boneShaft("跖行后足上方承重的粗胫骨", [knee[0] - side * .025, knee[1], knee[2]], [ankle[0] - side * .02, ankle[1], ankle[2]], .057), boneShaft("独立于胫骨的后肢腓骨", [knee[0] + side * .04, knee[1], knee[2] - .025], [ankle[0] + side * .037, ankle[1], ankle[2] - .02], .032), lobe("膝前独立髌骨", specimenBone, [side * .32, .59, -.035], [.074, .09, .04]), boneShaft("左右骨盆腹侧真实相接的耻骨联合支", [side * .27, .79, -.20], [0, .78, -.22], .027));
    bones.push(lobe("跖行足后部宽厚承重跟骨", specimenBone, [side * .34, .115, -.49], [.145, .11, .21]), lobe("胫骨下方相接的距骨", specimenBone, [side * .34, .158, -.41], [.12, .105, .13]));
    for (let tarsal = 0; tarsal < 5; tarsal++) bones.push(lobe("平足中段独立舟骨与楔骨", specimenBone, [side * (.34 + (tarsal % 3 - 1) * .035), .11, -.355 + Math.floor(tarsal / 3) * .045], [.06, .065, .075]));
    for (let toe = 0; toe < 5; toe++) {
      const x = side * (.34 + (toe - 2) * .035), metatarsal: Triple = [x, .085, -.12 + Math.abs(toe - 2) * .012], tip: Triple = [x, .067, .05 - Math.abs(toe - 2) * .015];
      bones.push(boneShaft("跖行足底各自独立的短宽跖骨", [side * .34 + (x - side * .34) * .55, .105, -.305], metatarsal, .023));
      if (toe === 2) bones.push(boneShaft("M.jeffersonii第三后趾P1和P2真正连成一体的融合指骨", metatarsal, tip, .028));
      else { const middle: Triple = [x, .078, (metatarsal[2] + tip[2]) * .5]; bones.push(boneShaft("后足独立近节趾骨", metatarsal, middle, .021), boneShaft("后足独立中节趾骨", middle, tip, .018)); }
      if (toe >= 1 && toe <= 3) bones.push(slothUngual("后足主要承重趾的独立骨性爪末节", tip, toe === 2 ? .145 : .11, .032, .038));
    }
  }
  const skullStations = [[.35, .10, 2.38], [.48, .16, 2.43], [.62, .14, 2.37], [.76, .10, 2.30]], roof = polygon("地懒短方颅横接额骨与鼻骨的骨顶", specimenBone, [...skullStations.map(([z, width]) => [-width!, z!] as [number, number]), ...skullStations.toReversed().map(([z, width]) => [width!, z!] as [number, number])], .033);
  for (const v of roof.vertices!) { const n = Math.max(1, skullStations.findIndex(([z]) => z! >= v.z)), a = skullStations[n - 1]!, b = skullStations[n]!; v.y += a[2]! + (b[2]! - a[2]!) * (v.z - a[0]!) / (b[0]! - a[0]!); }
  const occiput = polygon("立起骨系颅后方带真枕孔的后枕骨", specimenBone, [[-.09, 0], [-.12, .14], [-.07, .27], [.07, .27], [.12, .14], [.09, 0]], .04, [0, 2.14, .37], [oval(0, .10, .019, .021)]); occiput.rotation.x = -90; bones.push(roof, occiput);
  for (const side of [-1, 1]) {
    const skull = polygon("短方地懒颅侧的真实眼眶、颧弓和鼻孔", specimenBone, [[.35, 2.14], [.35, 2.38], [.48, 2.43], [.62, 2.37], [.76, 2.30], [.78, 2.17], [.61, 2.14]], .035, [0, 0, 0], [oval(.48, 2.31, .057, .051), oval(.705, 2.255, .038, .026)]);
    for (const v of skull.vertices!) { const width = v.x <= .48 ? .10 + (v.x - .35) / .13 * .06 : .16 - (v.x - .48) / .30 * .065; v.y += side * (width - .0175) - .0175; } skull.rotation = { x: -90, y: 0, z: -90 }; bones.push(skull);
    const body = polygon("短而深厚、承接下牙槽的地懒下颌体", specimenBone, [[.36, 2.03], [.36, 2.12], [.78, 2.12], [.79, 2.02], [.54, 1.97]], .04, [side < 0 ? -.15 : .11, 0, 0]); body.rotation = { x: -90, y: 0, z: -90 };
    const ramus = polygon("在上腭外侧直立的高地懒下颌升支", specimenBone, [[.36, 2.06], [.36, 2.28], [.46, 2.30], [.53, 2.13], [.49, 2.05]], .03, [side < 0 ? -.19 : .16, 0, 0]); ramus.rotation = { x: -90, y: 0, z: -90 };
    bones.push(body, ramus, boneShaft("外侧高升支向内下颌体的连续下颌角骨桥", [side * .175, 2.085, .45], [side * .13, 2.085, .52], .024), boneShaft("下颌后端与颅骨真实关节骨区", [side * .115, 2.27, .40], [side * .175, 2.27, .40], .022));
    for (const upper of [false, true]) {
      const y = upper ? 2.16 : 2.105, direction = upper ? -1 : 1, count = upper ? 4 : 3;
      bones.push(tapered("前方独立犬形臼齿的平磨耗柱，无虚构真切齿或獠牙", specimenIvory, [[side * .105, y, .72], [side * .105, y + direction * (upper ? .030 : .022), .72]], [.022, .022]));
      for (let molar = 0; molar < count; molar++) bones.push(tapered("地懒无根柱状臼齿的平磨耗冠与骨内基部", specimenIvory, [[side * .11, y, .61 - molar * .047], [side * .11, y + direction * (upper ? .025 : .022), .61 - molar * .047]], [.024, .024]));
    }
  }
  bones.push(polygon("承接上犬形与臼齿根的宽骨腭", specimenBone, [[-.12, .4], [-.15, .52], [-.11, .77], [.11, .77], [.15, .52], [.12, .4]], .045, [0, 2.145, 0]), polygon("联合左右下颌并真实托住下齿根的骨性牙槽", specimenBone, [[-.13, .4], [-.15, .53], [-.12, .79], [.12, .79], [.15, .53], [.13, .4], [.09, .44], [.10, .53], [.075, .75], [-.075, .75], [-.10, .53], [-.09, .44]], .045, [0, 2.075, 0]));
  const parts = boneGroups("杰氏大地懒骨系复原陈列组", bones);
  const axis: Triple[] = [...tail.toReversed(), [0, 1.05, -.38], ...lumbars.toReversed(), ...dorsals.toReversed(), ...cervicals.toReversed()];
  for (let start = 0; start < axis.length - 1; start += 40) { const path = axis.slice(start, start + 41); parts.push(tapered("支承厚尾及立起骨系的中轴细钢芯", specimenMount, path, path.map(() => .012))); }
  parts.push(...specimenStand(-.30, 1.045, .3), ...specimenStand(.02, 1.60, .3));
  for (const side of [-1, 1]) parts.push(beam("胸部中轴到肩关节的短承重横托", specimenMount, [0, 1.86, .16], [side * .34, 1.86, .17], .014));
  return parts;
}

export const osteologicalSkeletonExpansionBatchFifteenDesigns: MasterNatureDesign[] = [
  design("megalonyxReconstructedOsteologicalSpecimen", "杰氏大地懒骨架复原陈列标本", "器物", megalonyxReconstructedSkeleton, ["Megalonyx jeffersonii", "跖行足、第三后趾融合骨与三大手爪、厚髋长尾支承", "原创解剖简化复原陈列，非单件馆藏精确逐骨复制"]),
];
