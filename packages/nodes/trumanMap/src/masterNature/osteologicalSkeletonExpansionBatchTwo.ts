import { beam, design, lobe, needle, polygon, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { boneGroups, boneShaft, neuralArch, specimenBone, specimenIvory, specimenMount, specimenStand } from "./osteologicalSkeletonExpansionBatchOne";

function oval(x: number, y: number, radiusX: number, radiusY: number): [number, number][] {
  return Array.from({ length: 10 }, (_, index) => {
    const angle = index * Math.PI / 5;
    return [x + Math.cos(angle) * radiusX, y + Math.sin(angle) * radiusY];
  });
}

// 参考AMNH象颅/颌/臼齿与完整标本保存资料重新构造骨骼，不复用活体象的皮肤网格。
// 象鼻为软组织，不制作一根假的长鼻骨；象牙从前颌牙槽长出，肩胛/骨盆保留独立骨板与孔。
// https://www.amnh.org/research/science-conservation/projects/conservation-elephant-bovid
function africanElephantSkeleton(): ModelPart[] {
  const bones: ModelPart[] = [], arches: ModelPart[] = [], ribs: ModelPart[] = [], tusks: ModelPart[] = [];
  const spineY = (z: number) => z > 1 ? 3.02 - (z - 1) * .46 : 2.85 + Math.sin((z + .95) / 2 * Math.PI) * .17 - Math.max(0, -z - .9) * .1;
  const vertebrae = [
    ...Array.from({ length: 7 }, (_, index) => ({ z: 1.6 - index * .08, radius: .105, depth: .067, region: "颈椎" })),
    ...Array.from({ length: 21 }, (_, index) => ({ z: 1.01 - index * .094, radius: .12, depth: .076, region: "胸椎" })),
    ...Array.from({ length: 3 }, (_, index) => ({ z: -1.02 - index * .13, radius: .14, depth: .11, region: "腰椎" })),
    ...Array.from({ length: 4 }, (_, index) => ({ z: -1.4 - index * .075, radius: .125, depth: .073, region: "骶椎" })),
  ];
  for (const [index, vertebra] of vertebrae.entries()) {
    const { z, radius, depth, region } = vertebra, y = spineY(z);
    bones.push(lobe(`非洲象${region}椎体`, specimenBone, [0, y, z], [radius * 2, radius * 1.8, depth]));
    arches.push(neuralArch([0, y, z], radius, depth * .72));
    const height = region === "胸椎" ? .27 + Math.exp(-(((z - .65) / .55) ** 2)) * .25 : .15;
    bones.push(needle("象脊柱直立的背侧棘突", specimenBone, [0, y + radius * 2, z], [0, y + radius * 2 + height, z - .04], .045));
    for (const side of [-1, 1]) bones.push(needle("象椎体侧向的关节与横突", specimenBone, [side * radius * .65, y + .02, z], [side * radius * 2.3, y + .035, z - .01], .035));
    if (index >= 31) bones.push(boneShaft("骶椎间接合形成的骨盆承重侧桥", [-.12, y, z], [.12, y, z], .06));
  }
  for (let index = 0; index < 22; index++) {
    const t = index / 21, z = -1.7 - t * .86, y = 2.74 - t * 1.54, radius = .065 - t * .045;
    bones.push(lobe("象尾部逐节收细下垂的独立尾椎", specimenBone, [0, y, z], [radius * 1.7, radius * 1.8, .072]));
  }
  for (let index = 0; index < 21; index++) for (const side of [-1, 1]) {
    const z = 1.01 - index * .094, y = spineY(z), spread = .63 + Math.sin((index + 1) / 23 * Math.PI) * .35, depth = .95 + Math.sin((index + 1) / 23 * Math.PI) * .45;
    ribs.push(tapered("象胸廓独立成对肋骨，肋间保留开放空间", specimenBone, [[side * .11, y, z], [side * .46, y - .18, z + .035], [side * spread, y - depth * .47, z + .09], [side * spread * .95, y - depth * .83, z + .11], [side * .53, y - depth, z + .1], [side * .13, y - depth * 1.02, z + .08]], [.035, .031, .027, .024, .019, .015]));
  }
  bones.push(boneShaft("胸廓腹侧承接肋软骨的分节胸骨轴", [0, 1.8, 1.06], [0, 1.47, -.81], .062));
  const rearSkull = polygon("象颅后侧枕骨板及真实枕骨大孔", specimenBone, [[-.3, 0], [-.4, .43], [-.32, .9], [0, 1.1], [.32, .9], [.4, .43], [.3, 0]], .07, [0, 2.35, 1.48], [oval(0, .45, .04, .055)]);
  rearSkull.rotation.x = -90; bones.push(rearSkull);
  for (const side of [-1, 1]) {
    const cheek = polygon("象颅左右独立颞骨与颧弓，眼眶和颞孔真实贯通", specimenBone, [[-.4, .12], [-.52, .62], [-.34, 1.25], [.18, 1.35], [.56, 1.04], [.58, .48], [.42, .08], [.08, 0]], .07, [side < 0 ? -.34 : .27, 2.2, 1.9], [oval(.26, .73, .115, .13), oval(-.25, .68, .15, .23)]);
    cheek.rotation = { x: -90, y: 0, z: -90 }; bones.push(cheek);
    bones.push(tapered("象颌骨由升支向前下方汇合的完整半下颌", specimenBone, [[side * .28, 2.68, 1.58], [side * .34, 2.18, 1.87], [side * .31, 2.03, 2.12], [side * .17, 2.0, 2.49], [0, 2.0, 2.61]], [.09, .095, .085, .07, .06]));
    bones.push(polygon("下颌咀嚼段承托整列臼齿的宽厚牙槽骨", specimenBone, [[-.1, -.18], [.1, -.18], [.095, .18], [-.085, .18]], .105, [side * .21, 2.045, 2.22]));
    tusks.push(tapered("从前颌牙槽长出并向前上方弯曲的象牙", specimenIvory, [[side * .23, 2.7, 2.32], [side * .31, 2.43, 2.76], [side * .42, 2.36, 3.27], [side * .54, 2.56, 3.82], [side * .56, 2.87, 4.19]], [.105, .097, .078, .044, .005]));
    bones.push(boneShaft("包住象牙近端的前颌骨牙槽管壁", [side * .22, 2.78, 2.24], [side * .27, 2.59, 2.54], .13));
    for (const level of [0, 1]) for (let lamella = 0; lamella < 6; lamella++) bones.push(polygon("象臼齿真实相邻的横向咀嚼叠片", specimenBone, [[-.075, -.015], [-.02, -.022], [.04, -.016], [.079, -.021], [.077, .013], [.025, .022], [-.035, .015], [-.077, .02]], .034, [side * .19, 2.15 + level * .18, 2.09 + lamella * .039]));
    const shoulderBlade = polygon("象前肢上方宽大独立的三角肩胛骨板", specimenBone, [[-.4, .05], [.43, 0], [.29, .63], [.04, 1.12], [-.29, .96]], .055, [side < 0 ? -.65 : .595, 2.34, .77]);
    shoulderBlade.rotation = { x: -90, y: 0, z: -90 }; bones.push(shoulderBlade);
    bones.push(boneShaft("肩胛骨外侧向关节窝延伸的高骨嵴", [side * .66, 3.34, .77], [side * .66, 2.47, .9], .035));
    const foreShoulder: Triple = [side * .62, 2.39, .87], elbow: Triple = [side * .64, 1.39, .65], wrist: Triple = [side * .62, .43, .95];
    bones.push(boneShaft("近柱式前肢独立肱骨与两端关节", foreShoulder, elbow, .11), boneShaft("前肢承担轴向重量的桡骨", [elbow[0], elbow[1], elbow[2] + .07], [wrist[0], wrist[1], wrist[2] + .055], .072), boneShaft("前肢与桡骨平行的尺骨", [elbow[0], elbow[1] + .12, elbow[2] - .075], [wrist[0], wrist[1], wrist[2] - .07], .053));
    const pelvisOutline: [number, number][] = [[0, 0], [side * .51, .1], [side * .85, .58], [side * .61, .92], [side * .13, .82], [0, .97], [side * -.12, .68], [side * -.1, .23]];
    const pelvis = polygon("象骨盆宽髂翼、坐骨与真实闭孔", specimenBone, pelvisOutline, .22, [0, 1.88, -1.15], [oval(side * .34, .32, .13, .15)]);
    pelvis.rotation.x = -90; bones.push(pelvis);
    const hip: Triple = [side * .57, 2.4, -1.2], knee: Triple = [side * .62, 1.33, -.88], ankle: Triple = [side * .6, .4, -1.15];
    bones.push(boneShaft("由髋臼到膝的长股骨", hip, knee, .115), boneShaft("后肢粗胫骨", [knee[0], knee[1], knee[2] + .045], [ankle[0], ankle[1], ankle[2] + .03], .081), boneShaft("胫骨外侧独立腓骨", [knee[0] + side * .11, knee[1] - .02, knee[2] - .04], [ankle[0] + side * .075, ankle[1], ankle[2] - .07], .035), lobe("膝关节前方独立髌骨", specimenBone, [knee[0], knee[1], knee[2] + .105], [.13, .18, .07]));
    for (const foot of [wrist, ankle]) {
      for (let row = 0; row < 2; row++) for (let column = 0; column < 3; column++) bones.push(lobe("柱肢腕跗部相连而分立的短骨", specimenBone, [foot[0] + (column - 1) * .073, .34 - row * .07, foot[2] + row * .052], [.085, .084, .1]));
      for (let digit = 0; digit < 5; digit++) {
        const x = foot[0] + (digit - 2) * .072, z = foot[2] + .015, length = .22 + Math.sin((digit + 1) / 6 * Math.PI) * .065;
        const carpal: Triple = [foot[0] + (digit - 2) * .035, .27, z];
        bones.push(boneShaft("五列独立掌跖骨形成的拱形足部", carpal, [x, .13, z + length * .7], .032));
        for (let phalanx = 0; phalanx < 3; phalanx++) bones.push(lobe("象足部独立分节趾骨", specimenBone, [x, .125 - phalanx * .017, z + length * .72 + phalanx * .037], [.05, .055 - phalanx * .007, .048]));
      }
    }
  }
  const crown = polygon("象颅顶与前上方鼻孔的薄骨顶板，鼻孔前方没有假象鼻骨", specimenBone, [[-.34, 1.54], [-.39, 1.94], [-.27, 2.43], [0, 2.62], [.27, 2.43], [.39, 1.94], [.34, 1.54]], .065, [0, 3.3, 0], [oval(0, 2.32, .13, .16)]);
  for (const vertex of crown.vertices!) vertex.y += Math.max(0, 1 - (vertex.x / .4) ** 2) * .18;
  bones.push(crown, polygon("跨接左右颌骨并接触上臼齿列的骨质腭板", specimenBone, [[-.31, 2.01], [-.3, 2.42], [0, 2.52], [.3, 2.42], [.31, 2.01]], .075, [0, 2.36, 0], [oval(0, 2.18, .06, .1)]));
  const parts = [...boneGroups("非洲象独立中轴颅颌和柱肢骨组", bones), ...boneGroups("非洲象贯孔椎弓组", arches), ...boneGroups("非洲象成对开放胸肋组", ribs), ...tusks];
  const rodPath: Triple[] = [1.61, 1, .3, -.5, -1.3, -1.65].map(z => [0, spineY(z), z]);
  parts.push(tapered("象骨架陈列用的内藏中轴钢芯", specimenMount, rodPath, rodPath.map(() => .018)));
  for (const z of [-1.1, .85]) parts.push(...specimenStand(z, spineY(z) - .075, 1.65));
  for (const side of [-1, 1]) parts.push(beam("中央钢芯到肩胛骨内侧的真实承重连接", specimenMount, [0, spineY(.8), .8], [side * .62, 2.84, .8], .025));
  parts.push(beam("颅下方连接中轴钢芯的短陈列托杆", specimenMount, [0, spineY(1.4), 1.4], [0, 2.35, 2.05], .025));
  return parts;
}

export const osteologicalSkeletonExpansionBatchTwoDesigns: MasterNatureDesign[] = [
  design("africanElephantOsteologicalSpecimen", "非洲象完整骨架陈列标本", "器物", africanElephantSkeleton, ["Loxodonta africana", "独立颅颌象牙、贯孔骨盆、柱肢关节与腕跗趾骨", "带接地承重支架的完整骨骼学标本"]),
];
