import { Quaternion, Vector3 } from "three";
import { beam, combineMeshes, design, lobe, needle, polygon, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { boneGroups, boneShaft, neuralArch, specimenBone, specimenMount, specimenStand } from "./osteologicalSkeletonExpansionBatchOne";

function oval(x: number, y: number, radiusX: number, radiusY: number): [number, number][] {
  return Array.from({ length: 10 }, (_, index) => { const a = index * Math.PI / 5; return [x + Math.cos(a) * radiusX, y + Math.sin(a) * radiusY]; });
}

function neckAxis(t: number): Triple {
  return [0, 1.59 + t * .83, .48 + .335 * t + .105 * Math.sin(t * Math.PI * 2)];
}

// 独立平胸鸟骨系：无龙骨胸骨、无锁骨，融合综荐骨与跗跖骨；不是把二足兽脚类改骨数。
// 依研究形态原创简化；颈椎数量在文献间有17/18的分类差异，此模型采用下述轴骨研究的18节装配。
// https://brucemuseum.org/the-collection/science/ostrich-skeleton/
// https://link.springer.com/article/10.1186/s12917-023-03665-6
// https://link.springer.com/article/10.1007/s00435-024-00642-x
function ostrichSkeleton(): ModelPart[] {
  const bones: ModelPart[] = [], arches: ModelPart[] = [];
  for (let cervical = 0; cervical < 18; cervical++) {
    const t = cervical / 17, centre = neckAxis(t), a = neckAxis(Math.max(0, t - .025)), b = neckAxis(Math.min(1, t + .025));
    const direction = new Vector3(...b).sub(new Vector3(...a)).normalize(), distance = new Vector3(...b).distanceTo(new Vector3(...a)) / (Math.min(1, t + .025) - Math.max(0, t - .025)) / 17;
    const radius = .015 + (1 - t) * .005, arch = neuralArch([0, 0, distance * .12], radius, distance * .42);
    const local = combineMeshes("鸵鸟长颈独立椎体与真实贯孔椎弓", specimenBone, [tapered("颈椎两端宽、中部缩细的椎体", specimenBone, [[0, 0, -distance * .48], [0, 0, -distance * .24], [0, 0, distance * .3], [0, 0, distance * .48]], [radius, radius * .7, radius * .7, radius]), arch]);
    const rotation = new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), direction);
    for (const vertex of local.vertices!) { const p = new Vector3(vertex.x, vertex.y, vertex.z).applyQuaternion(rotation).add(new Vector3(...centre)); vertex.x = p.x; vertex.y = p.y; vertex.z = p.z; }
    bones.push(local);
  }
  for (let vertebra = 0; vertebra < 7; vertebra++) {
    const z = .43 - vertebra * .061, y = 1.575 - vertebra * .011;
    bones.push(lobe("胸部未融合的独立胸椎椎体", specimenBone, [0, y, z], [.065, .062, .059]), needle("独立胸椎向背侧竖起的短神经棘", specimenBone, [0, y + .03, z], [0, y + .1, z - .009], .014)); arches.push(neuralArch([0, y, z], .033, .035));
  }
  const synsacrum = polygon("鸟类腰骶及相邻胸尾椎真正融合的综荐骨", specimenBone, [[-.047, .1], [-.079, -.08], [-.068, -.32], [-.032, -.5], [.032, -.5], [.068, -.32], [.079, -.08], [.047, .1]], .055, [0, 1.448, 0]);
  for (const vertex of synsacrum.vertices!) vertex.y += (vertex.z + .5) * .09;
  bones.push(synsacrum);
  for (let sacral = 0; sacral < 8; sacral++) {
    const z = .02 - sacral * .063, y = 1.49 + (z + .5) * .09;
    bones.push(boneShaft("融合综荐骨向两侧髂骨连续承重的横突", [-.143, y, z], [.143, y, z], .012), needle("综荐骨上保留的融合棘突轮廓", specimenBone, [0, y, z], [0, y + .065, z - .01], .013));
  }
  for (let tail = 0; tail < 9; tail++) bones.push(lobe("综荐骨之后独立活动的短尾椎", specimenBone, [0, 1.445 - tail * .006, -.53 - tail * .022], [.045 - tail * .002, .043 - tail * .002, .023]));
  bones.push(polygon("短尾末端融合的尾综骨而非羽毛尾扇", specimenBone, [[-.018, 0], [-.024, -.038], [0, -.07], [.024, -.038], [.018, 0]], .031, [0, 1.374, -.708]));
  const sternum = polygon("无飞行龙骨、背面真实凹曲的宽薄胸骨", specimenBone, [[-.12, .09], [-.15, .31], [-.135, .43], [-.045, .455], [.045, .455], [.135, .43], [.15, .31], [.12, .09], [0, .075]], .017, [0, 1.21, 0]);
  for (const vertex of sternum.vertices!) vertex.y += (vertex.x / .15) ** 2 * .05 + ((vertex.z - .265) / .19) ** 2 * .012;
  const rimCount = sternum.vertices!.length / 2, bottomCentre = sternum.vertices!.length, topCentre = bottomCentre + 1;
  sternum.vertices!.push({ x: 0, y: 0, z: .265 }, { x: 0, y: .017, z: .265 }); sternum.indices = [];
  for (let i = 0; i < rimCount; i++) { const j = (i + 1) % rimCount; sternum.indices.push(bottomCentre, i, j, topCentre, j + rimCount, i + rimCount, i, j + rimCount, j, i, i + rimCount, j + rimCount); }
  bones.push(sternum);
  for (let rib = 0; rib < 9; rib++) for (const side of [-1, 1]) {
    const z = .43 - rib * .061, y = 1.575 - Math.min(rib, 6) * .011, sternal = rib >= 2 && rib <= 6, spread = rib < 2 ? .065 + rib * .037 : .185 - Math.max(0, rib - 6) * .015;
    const path: Triple[] = [[side * .026, y, z], [side * spread * .73, y - .035, z + .015], [side * spread, y - (rib < 2 ? .08 + rib * .055 : .205), z + .025]];
    if (sternal) {
      const endZ = .39 - (rib - 2) * .057, endY = 1.21 + (.128 / .15) ** 2 * .05 + ((endZ - .265) / .19) ** 2 * .012 + .012;
      path.push([side * .128, endY, endZ]);
    } else if (rib >= 7) path.push([side * .115, y - .255, z + .015]);
    bones.push(tapered(sternal ? "由椎肋与胸肋连接到胸骨侧缘的独立真肋" : "不强行接胸骨的前后独立浮肋", specimenBone, path, path.map((_, point) => .0095 - point * .0013)));
    if (rib >= 2 && rib <= 4) bones.push(boneShaft("第三至第五对肋后缘向背侧伸出的钩突", path[2]!, [side * spread * .91, path[2]![1] + .04, path[2]![2] - .035], .0045));
  }
  for (const side of [-1, 1]) {
    const pelvis = polygon("鸵鸟左右独立开放骨盆的髂坐骨与真实髋臼、闭孔", specimenBone, [[.2, .17], [.14, .3], [-.1, .33], [-.43, .24], [-.52, .03], [-.42, -.06], [-.18, -.08], [.02, 0]], .018, [side < 0 ? -.152 : .134, 1.28, 0], [oval(-.06, .08, .037, .043), oval(-.32, .07, .105, .047)]); pelvis.rotation = { x: -90, y: 0, z: -90 }; bones.push(pelvis);
    bones.push(tapered("鸟类细长耻骨向后延伸并保留开放腹侧", specimenBone, [[side * .143, 1.35, -.08], [side * .15, 1.22, -.39], [side * .16, 1.18, -.61]], [.014, .011, .008]));
    const hip: Triple = [side * .15, 1.36, -.06], knee: Triple = [side * .18, 1.18, .18], hock: Triple = [side * .18, .67, .075], ankle: Triple = [side * .18, .21, .115];
    bones.push(lobe("伸入髋臼骨环的股骨头", specimenBone, hip, [.084, .084, .084]), boneShaft("短而向前斜下的粗股骨", hip, knee, .027), boneShaft("最长后肢骨、胫与近跗骨融合的胫跗骨", knee, hock, .022), boneShaft("位于胫跗骨外侧而不到最远端的独立腓骨", [side * .205, 1.18, .18], [side * .198, .75, .092], .009), boneShaft("跖与远跗骨融合的强长跗跖骨", hock, ankle, .021));
    bones.push(lobe("鸵鸟膝前近端髌骨", specimenBone, [side * .18, 1.194, .205], [.032, .037, .019]), lobe("鸵鸟膝前独立远端髌骨", specimenBone, [side * .18, 1.154, .208], [.027, .039, .018]));
    for (const lateral of [false, true]) {
      const count = lateral ? 5 : 4, start: Triple = [side * (.18 + (lateral ? .017 : -.006)), .205, .12], end: Triple = [side * (.18 + (lateral ? .115 : -.025)), lateral ? .06 : .036, lateral ? .32 : .424];
      for (let phalanx = 0; phalanx < count; phalanx++) {
        const a = phalanx / count, b = (phalanx + .98) / count;
        const from = start.map((v, axis) => v + (end[axis]! - v) * a) as Triple, to = start.map((v, axis) => v + (end[axis]! - v) * b) as Triple;
        bones.push(boneShaft(lateral ? "外侧第四趾的五节独立趾骨，无角质爪假骨" : "主要承重第三趾的四节独立趾骨及末节爪骨", from, to, (lateral ? .012 : .019) * (1 - a * .63)));
      }
    }
    const scapula = polygon("鸵鸟肩带扁匙形肩胛部分", specimenBone, [[-.13, .075], [-.105, .12], [.015, .11], [.065, .055], [.04, .015], [-.015, .015]], .016, [side < 0 ? -.188 : .172, 1.4, .36]); scapula.rotation = { x: -90, y: 0, z: -90 }; bones.push(scapula);
    const coracoid = polygon("肩带向胸骨接合的四边形乌喙骨", specimenBone, [[side * .18, 1.455], [side * .145, 1.45], [side * .082, 1.255], [side * .13, 1.255]], .027, [0, 0, .416]); coracoid.rotation.x = -90; bones.push(coracoid);
    const shoulder: Triple = [side * .18, 1.45, .4], elbow: Triple = [side * .28, 1.18, .24], wrist: Triple = [side * .3, 1.25, .145];
    bones.push(lobe("肩胛乌喙接合处的翼肱骨关节头", specimenBone, shoulder, [.038, .038, .038]), boneShaft("短翼近端约三十三厘米的独立肱骨", shoulder, elbow, .017), boneShaft("短翼较细的独立桡骨", [elbow[0], elbow[1], elbow[2] + .006], [wrist[0], wrist[1], wrist[2] + .012], .007), boneShaft("短翼稍长且有肘突的独立尺骨", [elbow[0], elbow[1] - .008, elbow[2] - .008], [wrist[0], wrist[1], wrist[2] - .008], .009));
    bones.push(lobe("翼腕独立桡侧腕骨", specimenBone, [side * .3, 1.25, .152], [.028, .025, .027]), lobe("翼腕独立尺侧腕骨", specimenBone, [side * .3, 1.25, .133], [.026, .027, .025]));
    const hand = polygon("有真实掌间孔的融合腕掌骨", specimenBone, [[.145, 0], [.12, .027], [-.012, .055], [-.035, .027], [.005, -.003]], .014, [side < 0 ? -.307 : .293, 1.25, 0], [oval(.065, .022, .044, .009)]); hand.rotation = { x: -90, y: 0, z: -90 }; bones.push(hand);
    bones.push(boneShaft("短翼前缘小翼指的一节指骨", [side * .3, 1.266, .11], [side * .32, 1.297, .08], .007), boneShaft("短翼主指第一节指骨", [side * .3, 1.283, -.015], [side * .315, 1.31, -.11], .008), boneShaft("短翼主指第二节三角尖指骨", [side * .315, 1.31, -.11], [side * .32, 1.31, -.16], .005), boneShaft("短翼小指一节独立细指骨", [side * .3, 1.273, .005], [side * .325, 1.288, -.072], .005));
  }
  const skullSides = [[-.04, .015], [-.048, .076], [-.005, .13], [.065, .12], [.165, .065], [.178, .025], [.06, 0]] as [number, number][];
  for (const side of [-1, 1]) {
    const skull = polygon("小型轻颅的真实眼眶与鼻孔", specimenBone, skullSides, .008, [side < 0 ? -.039 : .031, 2.405, .86], [oval(.035, .066, .036, .036), oval(.118, .048, .029, .012)]);
    for (const vertex of skull.vertices!) { const taper = Math.max(0, (vertex.x - .065) / .113); vertex.y = side * .035 * (1 - taper * .9) + (vertex.y - .004) * (1 - taper * .55) - skull.position.x; }
    skull.rotation = { x: -90, y: 0, z: -90 }; bones.push(skull);
    bones.push(tapered("左右下颌支前端汇合的无齿鸟颌", specimenBone, [[side * .034, 2.423, .84], [side * .039, 2.397, .9], [side * .02, 2.395, 1.0], [0, 2.408, 1.04]], [.009, .007, .005, .003]), boneShaft("连接后颅与下颌的鸟类方骨", [side * .033, 2.456, .839], [side * .034, 2.423, .84], .008));
  }
  const vault = polygon("横接眼眶后上缘并在吻端收窄的鸟颅顶骨", specimenBone, [[-.035, .815], [-.04, .88], [-.029, .95], [-.006, 1.036], [.006, 1.036], [.029, .95], [.04, .88], [.035, .815]], .008);
  for (const vertex of vault.vertices!) vertex.y += vertex.z <= .9 ? 2.512 : 2.512 - (vertex.z - .9) * .58;
  const occiput = polygon("轻型鸟颅后侧带真实枕孔的枕骨", specimenBone, [[-.03, 0], [-.039, .043], [0, .08], [.039, .043], [.03, 0]], .012, [0, 2.423, .819], [oval(0, .015, .008, .009)]); occiput.rotation.x = -90;
  bones.push(vault, occiput, lobe("第一颈椎承接的鸟类单枕髁", specimenBone, [0, 2.429, .819], [.022, .022, .023]), polygon("鸟上颌内部横接两侧的薄骨腭", specimenBone, [[-.027, .839], [-.024, .95], [0, 1.041], [.024, .95], [.027, .839]], .006, [0, 2.421, 0]), boneShaft("无齿喙尖横接鼻颌与薄骨腭的前颌骨", [-.005, 2.431, 1.036], [.005, 2.431, 1.036], .0041));
  const parts = [...boneGroups("鸵鸟平胸、融合骨盆及独立翼肢颅颌骨组", bones), ...boneGroups("鸵鸟胸段真贯孔椎弓组", arches)];
  parts.push(...specimenStand(-.13, 1.455, .72));
  const neckSteel = Array.from({ length: 19 }, (_, index) => neckAxis(index / 18));
  parts.push(tapered("穿过长颈椎体而非椎孔的陈列细钢芯", specimenMount, [[0, 1.493, -.13], [0, 1.55, .43], ...neckSteel], Array(21).fill(.004)));
  for (const side of [-1, 1]) parts.push(beam("综荐骨主架连接双侧髂骨的承重横托", specimenMount, [0, 1.455, -.13], [side * .143, 1.48, -.13], .016));
  return parts;
}

export const osteologicalSkeletonExpansionBatchEightDesigns: MasterNatureDesign[] = [
  design("ostrichOsteologicalSpecimen", "鸵鸟完整骨架陈列标本", "器物", ostrichSkeleton, ["Struthio camelus", "无龙骨胸骨、融合综荐骨跗跖骨、双髌骨与二趾", "18节长颈、无锁骨肩带及保留三指的短翼骨系"]),
];
