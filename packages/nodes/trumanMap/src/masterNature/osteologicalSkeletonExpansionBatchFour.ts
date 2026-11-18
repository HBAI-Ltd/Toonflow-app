import { beam, design, lobe, polygon, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { boneGroups, boneShaft, neuralArch, specimenBone, specimenMount, specimenStand } from "./osteologicalSkeletonExpansionBatchOne";

function oval(x: number, y: number, radiusX: number, radiusY: number): [number, number][] {
  return Array.from({ length: 10 }, (_, index) => { const angle = index * Math.PI / 5; return [x + Math.cos(angle) * radiusX, y + Math.sin(angle) * radiusY]; });
}

// AMNH：无齿翼龙无牙，约6m翼展，翼由延长的第四指支撑；翼膜/羽毛不属于骨架。
// https://www.amnh.org/explore/ology/ology-cards/358-pteranodon-longiceps
// https://www.amnh.org/content/download/342035/5312606/file/unearthing-pterosaurs.pdf
function pteranodonSkeleton(): ModelPart[] {
  const bones: ModelPart[] = [], arches: ModelPart[] = [], ribs: ModelPart[] = [];
  const spine = [
    ...Array.from({ length: 9 }, (_, index) => ({ z: .62 - index * .059, y: 2.32 - index * .022, radius: .043, depth: .047 })),
    ...Array.from({ length: 12 }, (_, index) => ({ z: .08 - index * .041, y: 2.14 - index * .003, radius: .045, depth: .034 })),
    ...Array.from({ length: 6 }, (_, index) => ({ z: -.43 - index * .026, y: 2.1 - index * .009, radius: .038, depth: .024 })),
    ...Array.from({ length: 6 }, (_, index) => ({ z: -.6 - index * .031, y: 2.05 - index * .014, radius: .027 - index * .003, depth: .025 })),
  ];
  for (const vertebra of spine) {
    bones.push(lobe("无齿翼龙颈背骶尾分立的轻质椎体", specimenBone, [0, vertebra.y, vertebra.z], [vertebra.radius * 2, vertebra.radius * 1.8, vertebra.depth]));
    arches.push(neuralArch([0, vertebra.y, vertebra.z], vertebra.radius, vertebra.depth * .7));
  }
  for (let index = 0; index < 12; index++) for (const side of [-1, 1]) {
    const z = .07 - index * .04, y = 2.14 - index * .003, spread = .12 + Math.sin((index + 1) / 14 * Math.PI) * .095;
    ribs.push(tapered("翼龙胸廓独立细长弯肋", specimenBone, [[side * .033, y, z], [side * spread * .8, y - .035, z + .01], [side * spread, y - .14, z + .024], [side * spread * .69, 1.89, z + .035], [side * .035, 1.87, z + .025]], [.013, .011, .009, .007, .005]));
  }
  bones.push(polygon("翼龙腹侧接肩带的骨质胸板", specimenBone, [[-.14, -.25], [-.23, -.11], [-.21, .22], [-.1, .4], [0, .48], [.1, .4], [.21, .22], [.23, -.11], [.14, -.25]], .035, [0, 1.865, -.05]));
  for (const side of [-1, 1]) {
    const skull = polygon("无齿翼龙侧颅的眼眶与鼻眶前窗均真实贯通", specimenBone, [[-.35, .04], [-.43, .25], [-.31, .52], [.02, .55], [.39, .32], [1, .12], [1.02, .07], [.32, .03]], .026, [side < 0 ? -.085 : .059, 2.3, .5], [oval(-.23, .3, .075, .1), oval(.1, .28, .16, .1)]);
    for (const vertex of skull.vertices!) {
      const taper = Math.max(0, (vertex.x - .35) / .67);
      vertex.y = side * .072 * (1 - taper) + (vertex.y - .013) * (1 - taper * .85) - skull.position.x;
    }
    skull.rotation = { x: -90, y: 0, z: -90 }; bones.push(skull);
    bones.push(tapered("无齿翼龙细长无牙的半下颌", specimenBone, [[side * .072, 2.36, .18], [side * .08, 2.255, .62], [side * .035, 2.255, 1.31], [0, 2.29, 1.55]], [.029, .028, .016, .003]));
    bones.push(boneShaft("肩关节向胸板汇合的乌喙骨", [side * .2, 2.15, .2], [side * .065, 1.89, .31], .026), boneShaft("沿背侧与脊柱相接的肩胛骨", [side * .2, 2.15, .2], [side * .065, 2.19, -.22], .025));
    const shoulder: Triple = [side * .2, 2.15, .15], elbow: Triple = [side * .62, 2.12, .45], wrist: Triple = [side * 1.12, 2.15, .2], hand: Triple = [side * 1.5, 2.13, .02];
    bones.push(boneShaft("翼龙短而粗壮的近端肱骨", shoulder, elbow, .043), boneShaft("前臂长而平行的桡骨", [elbow[0], elbow[1], elbow[2] + .026], [wrist[0], wrist[1], wrist[2] + .022], .022), boneShaft("前臂较粗的尺骨", [elbow[0], elbow[1], elbow[2] - .027], [wrist[0], wrist[1], wrist[2] - .022], .029), lobe("腕骨形成的独立关节节块", specimenBone, wrist, [.09, .09, .1]), boneShaft("腕部至翼指起点的延长第四掌骨", wrist, hand, .032));
    const wingFinger: Triple[] = [hand, [side * 2.05, 2.17, -.12], [side * 2.5, 2.14, -.36], [side * 2.83, 2.09, -.59], [side * 3.04, 2.03, -.8]];
    for (let phalanx = 0; phalanx < 4; phalanx++) bones.push(boneShaft("独立长第四指的翼指分节骨，不扩成鸟羽或蝙蝠五指", wingFinger[phalanx]!, wingFinger[phalanx + 1]!, .027 - phalanx * .004));
    bones.push(boneShaft("腕部向前内侧伸出的翼状骨", wrist, [side * .86, 2.12, .48], .013));
    for (let digit = 0; digit < 3; digit++) {
      let previous: Triple = [hand[0], 2.13, hand[2] + digit * .038];
      for (let phalanx = 0; phalanx < 2; phalanx++) {
        const next: Triple = [hand[0] + side * (.025 + phalanx * .02), 2.105 - phalanx * .025, hand[2] + .09 + digit * .045 + phalanx * .055];
        bones.push(boneShaft("翼指根部保留的三列小手指骨", previous, next, .011 - phalanx * .002)); previous = next;
      }
      bones.push(tapered("小手指末端弯曲的独立指爪", specimenBone, [previous, [previous[0] - side * .01, previous[1] - .027, previous[2] + .035], [previous[0] - side * .02, previous[1] - .043, previous[2] + .041]], [.01, .006, .0015]));
    }
    const pelvis = polygon("翼龙轻质骨盆侧板与真实髋臼窗", specimenBone, [[-.18, .04], [-.2, .18], [-.11, .3], [.18, .28], [.21, .15], [.08, 0]], .035, [side < 0 ? -.145 : .11, 1.87, -.39], [oval(0, .14, .06, .065)]);
    pelvis.rotation = { x: -90, y: 0, z: -90 }; bones.push(pelvis);
    const hip: Triple = [side * .14, 2.01, -.39], knee: Triple = [side * .4, 1.6, -.5], ankle: Triple = [side * .56, 1.2, -.28];
    bones.push(boneShaft("翼龙后肢独立股骨", hip, knee, .03), boneShaft("后肢长胫骨", knee, ankle, .023), boneShaft("后肢外侧细腓骨", [knee[0] + side * .035, knee[1], knee[2]], [ankle[0] + side * .016, ankle[1] + .12, ankle[2] - .035], .011));
    for (let digit = 0; digit < 4; digit++) {
      const root: Triple = [ankle[0] + (digit - 1.5) * .013, 1.19, ankle[2]], end: Triple = [ankle[0] + (digit - 1.5) * .038, 1.12, -.04 + digit % 2 * .018];
      bones.push(boneShaft("后足独立掌跖与趾骨列", root, end, .012), tapered("悬空陈列后足的小骨爪", specimenBone, [end, [end[0], 1.095, end[2] + .037], [end[0], 1.08, end[2] + .045]], [.011, .006, .0015]));
    }
  }
  const crest = polygon("无齿翼龙颅顶向后延长的真正薄骨冠", specimenBone, [[-.17, 0], [-1.02, .34], [-.79, .47], [.13, .065]], .032, [-.016, 2.74, .44]);
  crest.rotation = { x: -90, y: 0, z: -90 }; bones.push(crest);
  const vault = polygon("真实横接左右侧颅并与中线颅冠相接的薄颅顶骨", specimenBone, [[-.082, .18], [-.089, .46], [-.07, .65], [0, .71], [.07, .65], [.089, .46], [.082, .18]], .028, [0, 2.77, 0]);
  for (const vertex of vault.vertices!) vertex.y -= Math.max(0, vertex.z - .5) * .33;
  const occiput = polygon("无齿翼龙后颅枕骨与真实脊髓孔", specimenBone, [[-.08, 0], [-.1, .11], [-.065, .24], [0, .3], [.065, .24], [.1, .11], [.08, 0]], .035, [0, 2.23, .6], [oval(0, .15, .018, .022)]);
  occiput.rotation.x = -90;
  const palate = polygon("前吻内侧实际跨接左右上颌的骨质腭板", specimenBone, [[-.075, .6], [-.04, 1.15], [-.008, 1.48], [.008, 1.48], [.04, 1.15], [.075, .6]], .015, [0, 2.33, 0]);
  for (const vertex of palate.vertices!) vertex.y += (vertex.z - .6) / .88 * .07;
  bones.push(vault, occiput, palate, lobe("后颅枕骨与第一颈椎真实接合的枕髁", specimenBone, [0, 2.32, .613], [.055, .055, .05]));
  const parts = [...boneGroups("无齿翼龙独立颅颌肩带翼指后肢骨组", bones), ...boneGroups("无齿翼龙贯孔椎弓组", arches), ...boneGroups("无齿翼龙开放弯肋组", ribs)];
  parts.push(...specimenStand(-.02, 1.87, 1.7), beam("胸板支架中央轴向上接到脊骨的细钢芯", specimenMount, [0, 1.86, -.02], [0, 2.16, -.02], .018));
  for (const side of [-1, 1]) parts.push(beam("由主支架斜撑到腕部承重骨的细陈列撑杆", specimenMount, [0, 1.8, .15], [side * 1.12, 2.12, .2], .014));
  return parts;
}

export const osteologicalSkeletonExpansionBatchFourDesigns: MasterNatureDesign[] = [
  design("pteranodonOsteologicalSpecimen", "无齿翼龙完整骨架陈列标本", "器物", pteranodonSkeleton, ["Pteranodon longiceps", "无牙颅冠与延长第四翼指、三指小手及独立肩带后足", "无软组织翼膜的完整骨架与接地支架"]),
];
