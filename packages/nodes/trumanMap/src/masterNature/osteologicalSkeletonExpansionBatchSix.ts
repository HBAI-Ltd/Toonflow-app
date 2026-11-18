import { beam, design, lobe, polygon, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { boneGroups, boneShaft, neuralArch, specimenBone, specimenMount, specimenStand } from "./osteologicalSkeletonExpansionBatchOne";

function oval(x: number, y: number, radiusX: number, radiusY: number): [number, number][] {
  return Array.from({ length: 10 }, (_, index) => { const angle = index * Math.PI / 5; return [x + Math.cos(angle) * radiusX, y + Math.sin(angle) * radiusY]; });
}

// 帝龟背甲天然为开放骨框，不人为切开现代龟壳或把活体壳换白来制造骨架。
// NHM说明其开放甲架、鼻骨、4.6m级长度和约4m鳍展；Yale保有完整骨架陈列。
// https://www.nhm.ac.uk/discover/giant-prehistoric-turtles.html
// https://peabody.yale.edu/explore/exhibitions/central-gallery
function archelonSkeleton(): ModelPart[] {
  const bones: ModelPart[] = [], arches: ModelPart[] = [];
  for (let vertebra = 0; vertebra < 10; vertebra++) {
    const z = .95 - vertebra * .21;
    bones.push(lobe("帝龟背甲中线与肋骨相融的独立背椎", specimenBone, [0, 1.11, z], [.15, .14, .18]));
    arches.push(neuralArch([0, 1.11, z], .075, .1));
    bones.push(polygon("帝龟背甲中线覆盖椎弓的独立神经骨", specimenBone, [[-.075, -.07], [-.045, -.11], [.045, -.11], [.075, -.07], [.075, .07], [.045, .11], [-.045, .11], [-.075, .07]], .045, [0, 1.245, z]));
  }
  for (let rib = 0; rib < 8; rib++) for (const side of [-1, 1]) {
    const z = .77 - rib * .22, width = Math.sqrt(1 - (z / 1.3) ** 2);
    const outline: [number, number][] = [[.065, 1.2], [.44, 1.14], [.82, .91], [1.02, .73], [1.09, .78], [.87, 1.01], [.48, 1.24], [.065, 1.3]].map(([x, y]) => [side * x! * width, y!]);
    const costal = polygon("帝龟不闭合成皮质壳的宽扁骨肋，肋间自然镂空", specimenBone, outline, .12, [0, 0, z + .06]); costal.rotation.x = -90; bones.push(costal);
  }
  for (let index = 0; index < 8; index++) {
    const z = 1.12 + index * .095, y = 1.11 + index * .003;
    bones.push(lobe("骨架前端可辨的独立颈椎", specimenBone, [0, y, z], [.115, .105, .079])); arches.push(neuralArch([0, y, z], .057, .05));
  }
  for (let index = 0; index < 8; index++) bones.push(lobe("骨甲后方短尾逐节收细的尾椎", specimenBone, [0, 1.07 - index * .044, -1.18 - index * .08], [.1 - index * .009, .09 - index * .008, .067]));
  bones.push(polygon("腹甲前方单一的内腹甲骨", specimenBone, [[0, .65], [-.24, .84], [0, 1.04], [.24, .84]], .06, [0, .59, 0]));
  for (const side of [-1, 1]) {
    bones.push(polygon("与内腹甲相接的成对上腹甲骨", specimenBone, [[0, .83], [side * .45, .94], [side * .68, .79], [side * .41, .68], [side * .1, .7]], .06, [0, .59, 0]));
    for (const direction of [-1, 1]) {
      const outline: [number, number][] = [[.1, -.1], [.38, -.18], [.82, -.25], [.98, -.1], [.72, .03], [.98, .2], [.85, .31], [.45, .16], [.14, .12]].map(([x, z]) => [side * x!, direction * z!]);
      bones.push(polygon(direction > 0 ? "帝龟前段具指状突的舌腹甲骨" : "帝龟后段具指状突的下腹甲骨", specimenBone, outline, .06, [0, .59, direction * .4]));
    }
    bones.push(polygon("后方相接成V形的剑腹甲骨", specimenBone, [[0, -1.2], [side * .55, -.83], [side * .33, -.69], [side * .1, -.94]], .06, [0, .59, 0]));
    bones.push(boneShaft("腹甲外侧连接前后骨板的骨桥", [side * .82, .62, -.44], [side * .82, .62, .44], .055), boneShaft("腹甲骨桥向背甲宽肋连接的外侧骨突", [side * .82, .62, .18], [side * .95, .85, .18], .047));
    const shoulder: Triple = [side * .42, .83, .72], elbow: Triple = [side * .93, .7, .5], wrist: Triple = [side * 1.35, .62, .13];
    bones.push(boneShaft("位于肋框内的肩胛骨背侧支", shoulder, [side * .28, 1.18, .43], .04), boneShaft("肩带向腹甲内侧接合的乌喙骨", shoulder, [side * .1, .64, .34], .043), boneShaft("肩带向上腹甲接合的肩峰支", shoulder, [side * .18, .64, .88], .035));
    bones.push(boneShaft("帝龟桨形前肢近端粗肱骨", shoulder, elbow, .085), boneShaft("前肢独立长桡骨", [elbow[0], elbow[1], elbow[2] + .03], [wrist[0], wrist[1], wrist[2] + .025], .044), boneShaft("前肢与桡骨平行的尺骨", [elbow[0], elbow[1], elbow[2] - .04], [wrist[0], wrist[1], wrist[2] - .035], .05));
    for (let carpal = 0; carpal < 4; carpal++) bones.push(lobe("前鳍腕部相连的独立腕骨", specimenBone, [wrist[0] + side * (carpal % 2) * .07, .62, .08 + Math.floor(carpal / 2) * .1], [.12, .1, .12]));
    for (let digit = 0; digit < 5; digit++) {
      const root: Triple = [side * 1.4, .61, .09 + digit * .03], end: Triple = [side * (1.9 + Math.sin((digit + 1) / 6 * Math.PI) * .22), .49, -.59 + digit * .11], count = digit === 0 || digit === 4 ? 3 : 4;
      for (let phalanx = 0; phalanx < count; phalanx++) {
        const a = phalanx / count, b = (phalanx + .94) / count;
        bones.push(boneShaft(phalanx ? "五指长鳍肢的分节指骨" : "长前鳍独立掌骨", root.map((value, axis) => value + (end[axis]! - value) * a) as Triple, root.map((value, axis) => value + (end[axis]! - value) * b) as Triple, .035 * (1 - a * .55)));
      }
    }
    const hip: Triple = [side * .45, .78, -.73], knee: Triple = [side * .86, .65, -1.05], ankle: Triple = [side * 1.18, .54, -1.24];
    bones.push(boneShaft("肋框内部向背椎上接的髂骨", hip, [side * .34, 1.18, -.72], .05), boneShaft("骨盆向前内侧连接的耻骨", hip, [side * .16, .64, -.42], .052), boneShaft("骨盆后下方连接剑腹甲的坐骨", hip, [side * .16, .64, -1.08], .05), boneShaft("短后鳍近端的独立股骨", hip, knee, .068), boneShaft("后鳍独立胫骨", [knee[0], knee[1], knee[2] + .025], [ankle[0], ankle[1], ankle[2] + .02], .037), boneShaft("后鳍与胫骨平行的腓骨", [knee[0], knee[1], knee[2] - .03], [ankle[0], ankle[1], ankle[2] - .025], .036));
    for (let tarsal = 0; tarsal < 3; tarsal++) bones.push(lobe("短后鳍独立跗骨", specimenBone, [ankle[0] + side * .05, .54, ankle[2] + (tarsal - 1) * .055], [.1, .085, .087]));
    for (let digit = 0; digit < 5; digit++) {
      const root: Triple = [side * 1.24, .53, -1.29 + digit * .025], end: Triple = [side * (1.5 + Math.sin((digit + 1) / 6 * Math.PI) * .13), .43, -1.72 + digit * .065];
      for (let phalanx = 0; phalanx < 3; phalanx++) {
        const a = phalanx / 3, b = (phalanx + .94) / 3;
        bones.push(boneShaft("后鳍五列独立掌跖与分节趾骨", root.map((value, axis) => value + (end[axis]! - value) * a) as Triple, root.map((value, axis) => value + (end[axis]! - value) * b) as Triple, .028 * (1 - a * .45)));
      }
    }
    const skull = polygon("帝龟头颅的眼眶及颞窗、鼻骨周围骨板", specimenBone, [[-.3, .08], [-.37, .3], [-.22, .51], [.07, .53], [.37, .36], [.5, .2], [.39, .06], [0, 0]], .05, [side < 0 ? -.215 : .165, .95, 2.15], [oval(-.05, .29, .11, .105), oval(-.25, .23, .068, .082), oval(.29, .25, .06, .045)]);
    for (const vertex of skull.vertices!) {
      const taper = Math.max(0, (vertex.x - .15) / .35);
      vertex.y = side * .19 * (1 - taper) + (vertex.y - .025) * (1 - taper * .85) - skull.position.x;
    }
    skull.rotation = { x: -90, y: 0, z: -90 }; bones.push(skull);
    bones.push(tapered("帝龟无齿而深厚的半下颌", specimenBone, [[side * .17, 1.11, 1.89], [side * .2, .91, 2.15], [side * .11, .91, 2.5], [0, .98, 2.62]], [.06, .065, .048, .025]));
  }
  const roof = polygon("横接两侧骨板并保留鼻骨轮廓的帝龟颅顶", specimenBone, [[-.2, 1.86], [-.22, 2.1], [-.2, 2.46], [0, 2.65], [.2, 2.46], [.22, 2.1], [.2, 1.86]], .045);
  for (const vertex of roof.vertices!) vertex.y += vertex.z <= 2.2 ? 1.4 + (vertex.z - 1.86) * .21 : 1.4714 - (vertex.z - 2.2) * .65;
  const occiput = polygon("帝龟后颅枕骨与真实脊髓孔", specimenBone, [[-.17, 0], [-.2, .2], [0, .4], [.2, .2], [.17, 0]], .055, [0, .98, 1.84], [oval(0, .24, .027, .03)]); occiput.rotation.x = -90;
  bones.push(roof, occiput, lobe("后颅与第一颈椎接合的枕髁", specimenBone, [0, 1.13, 1.815], [.09, .085, .1]), polygon("帝龟横接两侧上颌的骨腭", specimenBone, [[-.18, 1.94], [-.18, 2.4], [0, 2.64], [.18, 2.4], [.18, 1.94]], .045, [0, 1.055, 0]), polygon("钩喙与腭板真正相接的前颌骨", specimenBone, [[-.08, 2.49], [-.06, 2.59], [0, 2.68], [.06, 2.59], [.08, 2.49]], .13, [0, 1.06, 0]), tapered("帝龟上喙骨性前缘的短下钩", specimenBone, [[0, 1.18, 2.58], [0, 1.07, 2.68], [0, 1.01, 2.63]], [.05, .035, .003]));
  const parts = [...boneGroups("帝龟真实开放甲框及颅颌桨肢骨组", bones), ...boneGroups("帝龟与背甲相融的贯孔椎弓组", arches)];
  parts.push(...specimenStand(.11, 1.055, 1.55));
  for (const side of [-1, 1]) parts.push(beam("陈列主轴到前肩关节的承重支撑", specimenMount, [0, .52, .11], [side * .42, .83, .72], .025));
  return parts;
}

export const osteologicalSkeletonExpansionBatchSixDesigns: MasterNatureDesign[] = [
  design("archelonOsteologicalSpecimen", "帝龟完整骨架陈列标本", "器物", archelonSkeleton, ["Archelon ischyros", "天然开放背甲骨框、肋内肩盆与五指长桨肢", "无皮质甲与角质盾片的完整骨系"]),
];
