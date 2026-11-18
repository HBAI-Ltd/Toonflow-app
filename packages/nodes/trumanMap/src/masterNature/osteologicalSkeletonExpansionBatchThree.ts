import { beam, design, lobe, needle, polygon, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { boneGroups, boneShaft, neuralArch, specimenBone, specimenMount, specimenStand } from "./osteologicalSkeletonExpansionBatchOne";

function oval(x: number, y: number, radiusX: number, radiusY: number): [number, number][] {
  return Array.from({ length: 10 }, (_, index) => { const angle = index * Math.PI / 5; return [x + Math.cos(angle) * radiusX, y + Math.sin(angle) * radiusY]; });
}

function pointAlongBone(path: Triple[], z: number): Triple {
  const index = Math.max(1, path.findIndex(point => point[2] >= z)), start = path[index - 1]!, end = path[index]!;
  const amount = (z - start[2]) / (end[2] - start[2]);
  return start.map((value, axis) => value + (end[axis]! - value) * amount) as Triple;
}

// AMNH的低头、平伸长尾姿态及二指手依据；不做旧式直立拖尾或向下翻掌。
// https://www.amnh.org/exhibitions/permanent/saurischian-dinosaurs/tyrannosaurus-rex
// https://www.amnh.org/explore/ology/paleontology/ask-a-scientist-about-t-rex
function tyrannosaurusSkeleton(): ModelPart[] {
  const bones: ModelPart[] = [], arches: ModelPart[] = [], ribs: ModelPart[] = [];
  const spineY = (z: number) => z > 1.6 ? 4.15 - (z - 1.6) * .15 + Math.sin((z - 1.6) / 2 * Math.PI) * .15 : z >= -1.5 ? 4.02 + z * .075 : 3.91 - (-z - 1.5) * .13 - (-z - 1.5) ** 2 * .01;
  const vertebrae = [
    ...Array.from({ length: 10 }, (_, index) => ({ z: 3.55 - index * .19, radius: .15, depth: .153, region: "颈椎" })),
    ...Array.from({ length: 13 }, (_, index) => ({ z: 1.58 - index * .24, radius: .18, depth: .195, region: "背椎" })),
    ...Array.from({ length: 5 }, (_, index) => ({ z: -1.46 - index * .15, radius: .2, depth: .147, region: "骶椎" })),
    ...Array.from({ length: 40 }, (_, index) => ({ z: -2.22 - index * .135, radius: .19 - index / 39 * .16, depth: .107, region: "尾椎" })),
  ];
  for (const [index, vertebra] of vertebrae.entries()) {
    const { z, radius, depth, region } = vertebra, y = spineY(z), pitch = -Math.atan2(spineY(z + .015) - spineY(z - .015), .03) * 180 / Math.PI;
    bones.push(lobe(`霸王龙${region}的独立椎体`, specimenBone, [0, y, z], [radius * 2, radius * 1.8, depth], [pitch, 0, 0]));
    const arch = neuralArch([0, y, z], radius, depth * .62); arch.rotation.x += pitch; arches.push(arch);
    const spineHeight = region === "尾椎" ? radius * 1.2 : region === "颈椎" ? .12 : .28;
    bones.push(needle("霸王龙椎弓背侧的棘突", specimenBone, [0, y + radius * 2, z], [0, y + radius * 2 + spineHeight, z - .045], radius * .28));
    if (index < 45) for (const side of [-1, 1]) bones.push(needle("背骶与前尾椎外伸的骨质横突", specimenBone, [side * radius * .6, y, z], [side * radius * 2.6, y - .025, z - .02], radius * .28));
    if (region === "尾椎" && index < 55) for (const side of [-1, 1]) bones.push(boneShaft("平衡长尾腹侧相汇的人字骨", [side * radius * .6, y - radius * .5, z], [0, y - radius * 2.7, z + .015], radius * .16));
  }
  for (let index = 0; index < 13; index++) for (const side of [-1, 1]) {
    const z = 1.58 - index * .24, y = spineY(z), spread = .7 + Math.sin((index + 1) / 15 * Math.PI) * .45;
    ribs.push(tapered("双足兽脚类胸廓的弯曲长肋骨", specimenBone, [[side * .15, y, z], [side * .58, y - .19, z + .09], [side * spread, y - .63, z + .17], [side * spread * .96, y - 1.12, z + .22], [side * .64, y - 1.48, z + .21], [side * .21, y - 1.55, z + .15]], [.043, .038, .034, .03, .023, .016]));
  }
  for (let row = 0; row < 8; row++) for (const side of [-1, 1]) bones.push(boneShaft("胸肋下方独立交错而非实心腹板的腹肋", [side * .65, 2.57, 1.07 - row * .25], [0, 2.35, 1.18 - row * .25], .024));
  for (const side of [-1, 1]) {
    const skull = polygon("霸王龙侧颅的眼眶、颞孔、眶前窗与鼻孔均真实贯通", specimenBone, [[-.58, .17], [-.7, .65], [-.52, 1.06], [-.05, 1.12], [.32, .92], [.7, .67], [.74, .23], [.52, .06], [0, 0], [-.25, .06]], .065, [side < 0 ? -.28 : .215, 3.35, 4.1], [oval(-.43, .68, .14, .2), oval(-.03, .73, .12, .18), oval(.31, .56, .17, .2), oval(.625, .51, .058, .067)]);
    skull.rotation = { x: -90, y: 0, z: -90 }; bones.push(skull);
    const jawPath: Triple[] = [[side * .24, 3.66, 3.48], [side * .29, 3.15, 3.92], [side * .26, 3.05, 4.35], [side * .19, 3.1, 4.71], [0, 3.21, 4.88]];
    bones.push(tapered("霸王龙开口下颌骨与向后上升的关节支", specimenBone, jawPath, [.09, .09, .085, .066, .048]));
    const upperToothLine: Triple[] = [[side * .25, 3.52, 3.52], [side * .25, 3.41, 3.85], [side * .25, 3.35, 4.1], [side * .25, 3.41, 4.62], [side * .25, 3.58, 4.84]];
    for (let tooth = 0; tooth < 13; tooth++) {
      const t = tooth / 12, z = 3.9 + t * .88, upper = pointAlongBone(upperToothLine, z), lower = pointAlongBone(jawPath, z), length = .65 + Math.sin(t * Math.PI) * .25;
      upper[1] += .015; lower[1] += .015;
      bones.push(tapered("上颌向下且稍向后弯曲的实心骨质牙", specimenBone, [upper, [upper[0] + side * .01, upper[1] - .12 * length, z - .015], [upper[0], upper[1] - .18 * length, z - .045]], [.04, .023, .003]), tapered("下颌由真实颌骨路径上的齿槽向上伸出的独立牙", specimenBone, [lower, [lower[0] + side * .005, lower[1] + .1 * length, z + .007], [lower[0] - side * .005, lower[1] + .15 * length, z - .01]], [.035, .02, .003]));
    }
    const ilium = polygon("霸王龙骨盆长髂翼及贯通髋臼", specimenBone, [[-.85, .55], [-.72, .92], [.45, 1.0], [.72, .73], [.43, .5], [.18, .35], [-.26, .34]], .13, [side < 0 ? -.54 : .41, 3.0, -1.1], [oval(-.04, .57, .18, .18)]);
    ilium.rotation = { x: -90, y: 0, z: -90 }; bones.push(ilium);
    bones.push(boneShaft("髋臼前下方的长耻骨", [side * .42, 3.48, -1.02], [side * .16, 2.08, -.4], .075), boneShaft("耻骨下端前后扩展的耻骨靴", [side * .16, 2.07, -.73], [side * .16, 2.03, -.1], .11), boneShaft("髋臼后下方独立的坐骨", [side * .43, 3.43, -1.31], [side * .12, 2.32, -2.2], .065));
    const hip: Triple = [side * .49, 3.55, -1.17], knee: Triple = [side * .7, 2.3, .15], heel: Triple = [side * .74, .77, -.38], foot: Triple = [side * .7, .28, .27];
    bones.push(boneShaft("由髋臼向前下方伸出的长股骨", hip, knee, .15), boneShaft("长而粗的后肢胫骨", [knee[0], knee[1], knee[2] + .065], [heel[0], heel[1], heel[2] + .045], .11), boneShaft("胫骨外侧细长的腓骨", [knee[0] + side * .13, knee[1] - .02, knee[2] - .045], [heel[0] + side * .06, heel[1], heel[2] - .065], .045));
    for (let digit = 0; digit < 3; digit++) {
      const x = foot[0] + (digit - 1) * .18, endZ = 1.0 + (digit === 1 ? .18 : 0);
      bones.push(boneShaft("三条并列的长跖骨而非哺乳动物平掌", [heel[0] + (digit - 1) * .1, heel[1], heel[2]], [x, foot[1], foot[2]], .062));
      let previous: Triple = [x, foot[1], foot[2]];
      for (let phalanx = 0; phalanx < 3; phalanx++) {
        const next: Triple = [x + (digit - 1) * phalanx * .035, .21 - phalanx * .05, .43 + phalanx * (endZ - .43) / 2];
        bones.push(boneShaft("着地三趾的分节趾骨", previous, next, .056 - phalanx * .009)); previous = next;
      }
      bones.push(tapered("三趾末端弯曲向下的骨质爪", specimenBone, [previous, [previous[0], .073, previous[2] + .16], [previous[0], .042, previous[2] + .23]], [.055, .027, .003]));
    }
    bones.push(boneShaft("抬在跖骨后侧的退化第一趾", [foot[0] - side * .09, .51, foot[2] - .08], [foot[0] - side * .14, .36, foot[2] - .32], .03));
    const shoulder: Triple = [side * .7, 3.5, 1.35], elbow: Triple = [side * .88, 3.0, 1.73], wrist: Triple = [side * .68, 2.84, 2.09];
    const scapula = polygon("兽脚类沿胸廓斜置的长窄肩胛骨", specimenBone, [[-.42, .62], [-.31, .87], [.44, .17], [.39, 0], [.18, .08]], .055, [side < 0 ? -.73 : .675, 3.45, .88]);
    scapula.rotation = { x: -90, y: 0, z: -90 }; bones.push(scapula);
    const coracoid = polygon("肩胛下端承接肱骨关节的乌喙骨板", specimenBone, [[-.15, 0], [-.12, .26], [.05, .24], [.13, .1], [.09, -.06], [-.05, -.08]], .07, [side < 0 ? -.735 : .665, 3.48, 1.27]);
    coracoid.rotation = { x: -90, y: 0, z: -90 }; bones.push(coracoid);
    bones.push(boneShaft("霸王龙短粗前肢肱骨", shoulder, elbow, .063), boneShaft("短前肢桡骨", elbow, [wrist[0], wrist[1], wrist[2] + .035], .036), boneShaft("短前肢独立尺骨", [elbow[0], elbow[1], elbow[2] - .07], [wrist[0], wrist[1], wrist[2] - .035], .033));
    for (let digit = 0; digit < 2; digit++) {
      const hand: Triple = [wrist[0] + side * (digit - .5) * .065, wrist[1], wrist[2]], middle: Triple = [hand[0] - side * .07, 2.83 + digit * .045, 2.3 + digit * .07];
      bones.push(boneShaft("相向掌面的二指前掌骨", hand, middle, .025), tapered("二指手端弯向对侧手掌的独立爪", specimenBone, [middle, [middle[0] - side * .06, middle[1] + .025, middle[2] + .1], [middle[0] - side * .1, middle[1] + .015, middle[2] + .12]], [.028, .018, .003]));
    }
  }
  const skullRoof = polygon("左右开窗颅板上方相接的颅顶骨", specimenBone, [[-.25, 3.45], [-.29, 3.94], [-.2, 4.58], [0, 4.81], [.2, 4.58], [.29, 3.94], [.25, 3.45]], .065);
  const roofPath: Triple[] = [[0, 4.18, 3.4], [0, 4.47, 3.9], [0, 4.3, 4.42], [0, 3.96, 4.84]];
  for (const vertex of skullRoof.vertices!) vertex.y += pointAlongBone(roofPath, vertex.z)[1];
  const occiput = polygon("霸王龙后颅与脊髓通道真实贯孔的枕骨", specimenBone, [[-.22, 0], [-.28, .38], [0, .72], [.28, .38], [.22, 0]], .075, [0, 3.6, 3.47], [oval(0, .25, .055, .065)]);
  occiput.rotation.x = -90;
  bones.push(skullRoof, occiput, lobe("枕骨下方与第一颈椎相接的单个枕髁", specimenBone, [0, 3.74, 3.43], [.13, .12, .14]), tapered("前胸独立弧形叉骨", specimenBone, [[-.57, 3.48, 1.53], [-.34, 3.13, 1.61], [0, 3.01, 1.64], [.34, 3.13, 1.61], [.57, 3.48, 1.53]], [.035, .032, .03, .032, .035]));
  const parts = [...boneGroups("霸王龙颅颌双足及中轴骨组", bones), ...boneGroups("霸王龙真实椎孔弓组", arches), ...boneGroups("霸王龙开放长肋组", ribs)];
  const rod: Triple[] = [3.55, 2.5, 1.6, .2, -1.5, -3.6, -5.6, -7.5].map(z => [0, spineY(z), z]);
  parts.push(tapered("承托分节脊椎与长尾的内藏陈列钢芯", specimenMount, rod, rod.map(() => .023)), ...specimenStand(-1.12, spineY(-1.12) - .12, 2.05), ...specimenStand(2.35, spineY(2.35) - .11, 1.7));
  for (const side of [-1, 1]) parts.push(beam("肩胛骨连接陈列中轴的支托", specimenMount, [0, spineY(1.2), 1.2], [side * .7, 3.57, 1.2], .025));
  return parts;
}

export const osteologicalSkeletonExpansionBatchThreeDesigns: MasterNatureDesign[] = [
  design("tyrannosaurusOsteologicalSpecimen", "霸王龙完整骨架陈列标本", "器物", tyrannosaurusSkeleton, ["Tyrannosaurus rex", "开窗颅骨、平伸长尾、双足趾爪与相向二指手", "独立骨骼系统及接地陈列支架"]),
];
