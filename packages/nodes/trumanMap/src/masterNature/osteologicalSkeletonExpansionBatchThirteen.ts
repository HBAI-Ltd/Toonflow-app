import { beam, design, lobe, polygon, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { boneGroups, boneShaft, neuralArch, specimenBone, specimenIvory, specimenMount, specimenStand } from "./osteologicalSkeletonExpansionBatchOne";

function oval(x: number, y: number, radiusX: number, radiusY: number): [number, number][] {
  return Array.from({ length: 10 }, (_, i) => { const a = i * Math.PI / 5; return [x + Math.cos(a) * radiusX, y + Math.sin(a) * radiusY]; });
}

// 骨架复原陈列，不是ANSP10081单件馆藏的全原骨或精确逐骨复制。
// 2013年重数确认72枚保存颈椎；缺失后躯及四鳍采用近缘薄板龙科的肩盆/超指骨结构简化复原。
// 四鳍均为五指桨肢、腹侧宽肩盆骨与腹肋，不能由长颈陆生恐龙拉伸加鳍片替代。
// https://scholars.fhsu.edu/sternberg_facpubs/5/
// https://doi.org/10.1371/journal.pone.0070877
// https://ocean.si.edu/through-time/plesiosaur-hunt
// https://www.nhm.uio.no/english/research/projects/plesiosaur/animals/plesiosaurs/
function elasmosaurusReconstructedSkeleton(): ModelPart[] {
  const bones: ModelPart[] = [], arches: ModelPart[] = [];
  const cervicals: Triple[] = Array.from({ length: 72 }, (_, i) => [0, 2.15 - i / 71 * .4, 8.1 - i * .09]);
  const pectorals: Triple[] = Array.from({ length: 3 }, (_, i) => [0, 1.74 - i * .005, 1.6 - i * .14]);
  const dorsals: Triple[] = Array.from({ length: 18 }, (_, i) => [0, 1.73 + Math.sin(i / 17 * Math.PI) * .04, 1.16 - i * .14]);
  const sacrals: Triple[] = Array.from({ length: 4 }, (_, i) => [0, 1.72 - i * .012, -1.4 - i * .105]);
  const caudals: Triple[] = Array.from({ length: 21 }, (_, i) => [0, 1.67 - i * .014, -1.83 - i * .07]);
  for (const [name, points, width, height, depth] of [["薄板龙72枚保存颈序的分节颈椎体", cervicals, .14, .13, .105], ["颈背之间保留独立肋关节形态的过渡胸椎", pectorals, .19, .17, .15], ["宽深躯干中的独立背椎体", dorsals, .23, .20, .16], ["后盆带近端的独立骶椎体", sacrals, .21, .18, .12], ["逐节收细的短尾椎体", caudals, .13, .11, .08]] as [string, Triple[], number, number, number][]) {
    for (const [i, point] of points.entries()) {
      const taper = points === caudals ? 1 - i / points.length * .8 : 1;
      bones.push(lobe(name, specimenBone, point, [width * taper, height * taper, depth])); arches.push(neuralArch(point, width * .45 * taper, depth * .52));
      if (points === cervicals) for (const side of [-1, 1]) bones.push(tapered("在颈椎体低位肋面相接的独立短颈肋", specimenBone, [[side * .05, point[1] - .005, point[2]], [side * .10, point[1] - .05, point[2] - .02], [side * .11, point[1] - .055, point[2] - .065]], [.012, .01, .004]));
      if (points === dorsals) for (const side of [-1, 1]) bones.push(boneShaft("背椎神经弓侧方高位附肋横突", [side * .05, point[1] + .06, point[2]], [side * .2, point[1] + .06, point[2]], .023));
    }
  }
  for (const [i, p] of dorsals.entries()) for (const side of [-1, 1]) {
    const spread = .48 + Math.sin((i + 1) / 20 * Math.PI) * .22;
    bones.push(tapered("短深躯干中独立弯向腹侧的长胸肋", specimenBone, [[side * .18, p[1] + .06, p[2]], [side * spread * .8, p[1] - .07, p[2] + .025], [side * spread, p[1] - .37, p[2] + .05], [side * spread * .79, p[1] - .75, p[2] + .07], [side * .09, p[1] - .88, p[2] + .065]], [.028, .026, .023, .019, .013]));
  }
  for (let row = 0; row < 13; row++) for (const side of [-1, 1]) bones.push(tapered("宽腹底不附脊柱的独立腹肋半支", specimenBone, [[0, .82, .78 - row * .137], [side * .28, .83, .755 - row * .137], [side * .52, .96, .74 - row * .137]], [.016, .014, .01]));
  for (const side of [-1, 1]) {
    const coracoid = polygon("薄板龙科腹侧宽长乌喙骨，非陆生肩胛立板", specimenBone, [[0, -.02], [side * .40, -.08], [side * .61, .12], [side * .54, .49], [side * .33, .68], [0, .54]], .07, [0, 1.1, .26], [oval(side * .26, .43, .065, .055)]);
    const scapula = polygon("肩带前方与乌喙骨相接的宽肩胛腹支", specimenBone, [[0, .64], [side * .31, .61], [side * .56, .52], [side * .58, .87], [side * .18, 1.06], [0, .95]], .065, [0, 1.12, 0]); bones.push(coracoid, scapula);
    const shoulder: Triple = [side * .52, 1.19, .78], elbow: Triple = [side * .91, 1.17, .60], wrist: Triple = [side * 1.12, 1.13, .36];
    bones.push(boneShaft("由宽腹肩带向外后方伸出的扁粗肱骨", shoulder, elbow, .087), boneShaft("前桨肢短而独立的桡骨", [elbow[0], elbow[1], elbow[2] + .055], [wrist[0], wrist[1], wrist[2] + .06], .055), boneShaft("前桨肢短宽且可辨的尺骨", [elbow[0], elbow[1], elbow[2] - .06], [wrist[0], wrist[1], wrist[2] - .055], .058));
    const pubis = polygon("宽腹后盆带的独立圆扇形耻骨", specimenBone, [[0, -.63], [side * .29, -.61], [side * .54, -.82], [side * .49, -1.14], [side * .13, -1.24], [0, -1.11]], .065, [0, 1.08, 0]);
    const ischium = polygon("后盆带向后展开并留真实耻坐孔的坐骨", specimenBone, [[0, -1.17], [side * .16, -1.29], [side * .49, -1.17], [side * .56, -1.47], [side * .34, -1.74], [0, -1.61]], .07, [0, 1.08, 0]); bones.push(pubis, ischium);
    const hip: Triple = [side * .47, 1.16, -1.2], knee: Triple = [side * .84, 1.14, -1.40], ankle: Triple = [side * 1.03, 1.10, -1.62];
    bones.push(boneShaft("从后盆髋部上接骶椎的细长髂骨", hip, [side * .09, 1.66, -1.58], .043), boneShaft("后桨肢近端扁粗股骨", hip, knee, .082), boneShaft("后桨肢短宽胫骨", [knee[0], knee[1], knee[2] + .055], [ankle[0], ankle[1], ankle[2] + .05], .05), boneShaft("后桨肢独立短腓骨", [knee[0], knee[1], knee[2] - .055], [ankle[0], ankle[1], ankle[2] - .055], .052));
    for (const [front, joint] of [[true, wrist], [false, ankle]] as [boolean, Triple][]) {
      for (let carpal = 0; carpal < 6; carpal++) bones.push(lobe(front ? "前桨独立相接的短腕骨" : "后桨独立相接的短跗骨", specimenBone, [joint[0] + side * (carpal % 2) * .065, joint[1] - Math.floor(carpal / 2) * .012, joint[2] + (Math.floor(carpal / 2) - 1) * .065], [.105, .085, .105]));
      for (let digit = 0; digit < 5; digit++) {
        const start: Triple = [joint[0] + side * .045, joint[1] - .018, joint[2] - .10 + digit * .05], end: Triple = [side * (front ? 1.65 + Math.sin((digit + 1) / 6 * Math.PI) * .25 : 1.46 + Math.sin((digit + 1) / 6 * Math.PI) * .23), joint[1] - .14, joint[2] - .69 + digit * .12], count = [5, 7, 9, 8, 6][digit]!;
        for (let phalanx = 0; phalanx <= count; phalanx++) { const a = phalanx / (count + 1), b = (phalanx + .985) / (count + 1); bones.push(boneShaft(phalanx ? "五列桨肢中真正分节的超指骨" : "桨肢腕跗部发出的五根独立掌跖骨", start.map((v, axis) => v + (end[axis]! - v) * a) as Triple, start.map((v, axis) => v + (end[axis]! - v) * b) as Triple, .027 * (1 - a * .55))); }
      }
    }
  }
  const roof = polygon("小颅长吻上方真实横接的薄颅顶", specimenBone, [[-.09, 8.14], [-.145, 8.28], [-.12, 8.47], [-.04, 8.72], [.04, 8.72], [.12, 8.47], [.145, 8.28], [.09, 8.14]], .03);
  for (const vertex of roof.vertices!) vertex.y += 2.42 - Math.max(0, vertex.z - 8.28) * .41;
  const occiput = polygon("小颅后方的真枕孔及与首颈接合的后枕骨", specimenBone, [[-.07, 0], [-.11, .10], [-.07, .27], [.07, .27], [.11, .10], [.07, 0]], .045, [0, 2.12, 8.17], [oval(0, .12, .019, .021)]); occiput.rotation.x = -90; bones.push(roof, occiput);
  for (const side of [-1, 1]) {
    const skull = polygon("复原小颅的真实眼眶、颞窗与细长吻骨", specimenBone, [[8.14, 2.12], [8.14, 2.42], [8.28, 2.42], [8.47, 2.3421], [8.72, 2.2396], [8.73, 2.12], [8.4, 2.10]], .028, [0, 0, 0], [oval(8.32, 2.31, .065, .06), oval(8.20, 2.28, .04, .065)]);
    for (const vertex of skull.vertices!) { const width = vertex.x <= 8.28 ? .09 + (vertex.x - 8.14) / .14 * .055 : vertex.x <= 8.47 ? .145 - (vertex.x - 8.28) / .19 * .025 : .12 - (vertex.x - 8.47) / .26 * .08; vertex.y += side * (width - .014) - .014; }
    skull.rotation = { x: -90, y: 0, z: -90 }; bones.push(skull);
    const jawPath: Triple[] = [[side * .082, 2.15, 8.15], [side * .12, 2.035, 8.35], [side * .09, 2.035, 8.55], [side * .018, 2.075, 8.73]], upperPath: Triple[] = [[side * .12, 2.13, 8.32], [side * .102, 2.13, 8.50], [side * .026, 2.13, 8.72]];
    bones.push(tapered("与后颅关节相接的细长独立下颌", specimenBone, jawPath, [.021, .018, .015, .009]), tapered("上颌针齿实际生根的骨性牙槽", specimenBone, upperPath, [.019, .018, .01]));
    for (let tooth = 0; tooth < 18; tooth++) {
      const z = 8.335 + tooth * .0215, upperX = z <= 8.50 ? .12 - (z - 8.32) / .18 * .018 : .102 - (z - 8.50) / .22 * .076;
      const lowerX = z <= 8.35 ? .082 + (z - 8.15) / .20 * .038 : z <= 8.55 ? .12 - (z - 8.35) / .20 * .03 : .09 - (z - 8.55) / .18 * .072, lowerY = z <= 8.35 ? 2.15 - (z - 8.15) / .20 * .115 : z <= 8.55 ? 2.035 : 2.035 + (z - 8.55) / .18 * .04;
      bones.push(tapered("上颌骨中生根向内后曲的独立针形齿", specimenIvory, [[side * upperX, 2.13, z], [side * upperX * .96, 2.083, z - .004], [side * upperX * .94, 2.067, z - .01]], [.0047, .0027, .0003]), tapered("下颌骨中生根的独立上指针形齿", specimenIvory, [[side * lowerX, lowerY, z], [side * lowerX * .96, lowerY + .045, z - .003], [side * lowerX * .94, lowerY + .058, z - .008]], [.0042, .0024, .0003]));
    }
  }
  bones.push(polygon("横接两上颌并保留鼻道的薄骨腭", specimenBone, [[-.08, 8.15], [-.12, 8.35], [-.10, 8.5], [-.023, 8.73], [.023, 8.73], [.10, 8.5], [.12, 8.35], [.08, 8.15]], .033, [0, 2.115, 0]), lobe("后枕与第一颈椎接合的枕髁", specimenBone, [0, 2.15, 8.145], [.085, .08, .085]));
  const parts = [...boneGroups("薄板龙科长颈四桨肢骨系简化复原组", bones), ...boneGroups("长颈及短尾真实贯孔椎弓组", arches)];
  const axis: Triple[] = [...caudals.toReversed(), ...sacrals.toReversed(), ...dorsals.toReversed(), ...pectorals.toReversed(), ...cervicals.toReversed()];
  for (let start = 0; start < axis.length - 1; start += 45) { const path = axis.slice(start, start + 46); parts.push(tapered("穿分节椎体并支承复原骨系的细钢中轴", specimenMount, path, path.map(() => .012))); }
  for (const [z, y, width] of [[0.04, 1.70, 1.4], [3.6, 1.86, .8], [6.75, 2.06, .65]]) parts.push(...specimenStand(z!, y!, width!));
  for (const side of [-1, 1]) parts.push(beam("中轴向前桨肩带骨关节的细承托", specimenMount, [0, 1.75, .78], [side * .52, 1.15, .78], .017), beam("中轴向后桨盆带骨关节的细承托", specimenMount, [0, 1.73, -1.2], [side * .47, 1.14, -1.2], .017));
  for (const row of [0, 4, 8, 12]) { const z = .78 - row * .137; parts.push(beam("独立腹肋中线连接到陈列中轴的细托", specimenMount, [0, 1.76, z], [0, .82, z], .008)); }
  return parts;
}

export const osteologicalSkeletonExpansionBatchThirteenDesigns: MasterNatureDesign[] = [
  design("elasmosaurusReconstructedOsteologicalSpecimen", "薄板龙骨架复原陈列标本", "器物", elasmosaurusReconstructedSkeleton, ["Elasmosaurus platyurus", "72枚保存颈序与近缘科属后躯四桨肢的解剖简化复原", "非单件馆藏全原骨、非精确逐骨复制，无虚构骨质鳍膜"]),
];
