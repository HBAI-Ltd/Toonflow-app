import { beam, design, lobe, part, polygon, sweptProfile, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { boneGroups, boneShaft, neuralArch, specimenBone, specimenIvory, specimenMount } from "./osteologicalSkeletonExpansionBatchOne";

function oval(x: number, y: number, radiusX: number, radiusY: number): [number, number][] {
  return Array.from({ length: 8 }, (_, i) => { const a = i * Math.PI / 4; return [x + Math.cos(a) * radiusX, y + Math.sin(a) * radiusY]; });
}

// 米级展翼的原创果蝠骨系。手指II–V分别构成翼架，不复用翼龙第四指，也不把翼膜画成假骨片。
// 真薄扁肋、退化尺骨与后向外旋的后肢；本种无外尾，拇指与第二指保留骨性爪末节。
// https://www.amnh.org/research/science-conservation/projects/case-studies/bats
// https://scholar.smu.edu/fondrenscienceseries/vol1/iss11/7/
// https://australian.museum/learn/animals/bats/grey-headed-flying-fox/
// https://www.dcceew.gov.au/sites/default/files/env/pages/a117ced5-9a94-4586-afdb-1f333618e1e3/files/37-ind.pdf
function greyHeadedFlyingFoxSkeleton(): ModelPart[] {
  const bones: ModelPart[] = [], arches: ModelPart[] = [];
  const cervicals: Triple[] = Array.from({ length: 7 }, (_, i) => [0, 1 - i * .0043, .1 - i * .004]);
  const thoracics: Triple[] = Array.from({ length: 12 }, (_, i) => [0, .970 - i * .00085, .068 - i * .00845]);
  const lumbars: Triple[] = Array.from({ length: 4 }, (_, i) => [0, .958 - i * .0018, -.036 - i * .008]);
  for (const [name, points] of [["短而独立的果蝠颈椎", cervicals], ["带扁肋的果蝠独立胸椎", thoracics], ["后腰独立小腰椎", lumbars]] as [string, Triple[]][]) for (const p of points) { bones.push(lobe(name, specimenBone, p, [.008, .007, .0075])); arches.push(neuralArch(p, .004, .0036)); }
  for (let sacral = 0; sacral < 3; sacral++) bones.push(lobe("骨盆中真正交叠相融的果蝠骶椎", specimenBone, [0, .949 - sacral * .0015, -.07 - sacral * .008], [.013, .011, .010]));
  for (let rib = 0; rib < 12; rib++) for (const side of [-1, 1]) {
    const p = thoracics[rib]!, width = .65 + Math.sin((rib + 1) / 14 * Math.PI) * .35;
    const outline: [number, number][] = [[.0028, -.001], [.019, -.006], [.026, -.022], [.019, -.040], [.007, -.044], [.006, -.041], [.017, -.037], [.023, -.022], [.017, -.008], [.0028, .002]].map(([x, y]) => [side * x! * width, p[1] + y! * width]);
    const flatRib = polygon("果蝠胸廓中有真实厚度的扁平长肋骨", specimenBone, outline, .0015, [0, 0, p[2] + .00075]); flatRib.rotation.x = -90; bones.push(flatRib);
  }
  const sternum = polygon("短宽而非鸟类深龙骨的果蝠胸骨", specimenBone, [[-.008, -.031], [-.012, .048], [-.006, .069], [.006, .069], [.012, .048], [.008, -.031]], .0035, [0, .922, 0]);
  for (const vertex of sternum.vertices!) vertex.y += (vertex.z + .031) * .1;
  bones.push(sternum);
  const keel = polygon("果蝠胸骨腹面的低矮骨性中嵴", specimenBone, [[-.024, .923], [.056, .923], [.031, .913], [-.013, .915]], .0024, [-.0012, 0, 0]);
  for (const vertex of keel.vertices!) vertex.z += (vertex.x + .031) * .1;
  keel.rotation = { x: -90, y: 0, z: -90 }; bones.push(keel);
  for (const side of [-1, 1]) {
    const scapula = polygon("飞行肩带的薄三角肩胛骨", specimenBone, [[side * .006, .95], [side * .015, .982], [side * .032, .975], [side * .027, .951]], .0035, [0, 0, .052]); scapula.rotation.x = -90; bones.push(scapula);
    const shoulder: Triple = [side * .026, .967, .062], elbow: Triple = [side * .115, .956, .045], wrist: Triple = [side * .245, 1, .155];
    bones.push(tapered("向胸骨连接的强壮独立锁骨", specimenBone, [[0, .933, .06], [side * .017, .949, .07], shoulder], [.0024, .0026, .0028]), boneShaft("肩胛骨到飞行肱骨头的肩峰骨突", [side * .026, .972, .05], shoulder, .0025), lobe("飞行肩关节的肱骨头", specimenBone, shoulder, [.009, .009, .009]), boneShaft("翼近端较短的独立肱骨", shoulder, elbow, .0036), boneShaft("翼前臂约十七厘米的承重长桡骨", elbow, wrist, .0035), boneShaft("不错误延长为第二根完整前臂的退化尺骨", [elbow[0], elbow[1] - .003, elbow[2] - .002], [side * .165, .971, .088], .00165));
    for (let carpal = 0; carpal < 6; carpal++) bones.push(lobe("长翼指近端可辨且相接的腕骨", specimenBone, [wrist[0] + side * (carpal % 3 - 1) * .0038, 1 - Math.floor(carpal / 3) * .0025, .154 + Math.floor(carpal / 3) * .004], [.006, .0065, .0065]));
    const fingers: Triple[][] = [
      [wrist, [side * .365, 1.005, .155], [side * .410, .998, .14], [side * .430, .988, .13]],
      [wrist, [side * .385, .983, .06], [side * .465, .965, -.025], [side * .505, .94, -.105]],
      [wrist, [side * .35, .98, .005], [side * .40, .954, -.09], [side * .430, .932, -.150]],
      [wrist, [side * .285, .97, -.015], [side * .30, .945, -.095], [side * .308, .923, -.170]],
    ];
    for (const [digit, path] of fingers.entries()) for (let segment = 0; segment < path.length - 1; segment++) bones.push(boneShaft(segment === 0 ? `翼第${digit + 2}指独立长掌骨` : `翼第${digit + 2}指各自分节的长指骨`, path[segment]!, path[segment + 1]!, .0025 - segment * .00055));
    bones.push(boneShaft("翼前缘独立对握的短拇掌骨", wrist, [side * .258, 1.015, .18], .0027), boneShaft("拇指第一节短指骨", [side * .258, 1.015, .18], [side * .279, 1.019, .19], .0023), tapered("拇指钩爪的骨性末节而非角质鞘", specimenBone, [[side * .279, 1.019, .19], [side * .285, 1.013, .19], [side * .283, 1.006, .186]], [.0024, .0017, .00045]), tapered("果蝠第二翼指保留的独立骨性爪末节", specimenBone, [[side * .430, .988, .13], [side * .432, .981, .13], [side * .428, .978, .13]], [.0019, .0013, .0004]));
    const pelvis = polygon("细长后骨盆髂骨坐骨及真实闭孔", specimenBone, [[.014, .005], [.01, .021], [-.009, .025], [-.022, .007], [-.014, -.012], [.007, -.012]], .0035, [side < 0 ? -.0105 : .007, .932, -.08], [oval(-.005, .001, .005, .006)]); pelvis.rotation = { x: -90, y: 0, z: -90 }; bones.push(pelvis);
    const hip: Triple = [side * .009, .945, -.083], knee: Triple = [side * .048, .937, -.113], ankle: Triple = [side * .07, .921, -.175];
    bones.push(boneShaft("融合骶椎向半骨盆实接的骶髂横突", [0, .948, -.078], [side * .009, .948, -.078], .0012), lobe("后外旋髋部真实接合的股骨头", specimenBone, hip, [.008, .008, .008]), boneShaft("向后外侧旋出的独立短股骨", hip, knee, .0025), boneShaft("后向小腿独立长胫骨", knee, ankle, .0021), boneShaft("后肢胫骨旁不完整的细腓骨", [knee[0] + side * .003, knee[1], knee[2]], [side * .063, .925, -.159], .001));
    for (let tarsal = 0; tarsal < 4; tarsal++) bones.push(lobe("后足真实接合的独立小跗骨", specimenBone, [ankle[0] + side * (tarsal % 2 - .5) * .0038, ankle[1], ankle[2] - Math.floor(tarsal / 2) * .004], [.006, .0055, .006]));
    for (let toe = 0; toe < 5; toe++) {
      const root: Triple = [ankle[0] + side * (toe - 2) * .0018, .920, -.179], knuckle: Triple = [ankle[0] + side * (toe - 2) * .0036, .918, -.19], end: Triple = [knuckle[0], .913, -.203], count = toe === 0 ? 2 : 3;
      bones.push(boneShaft("后向五趾足部独立掌跖骨", root, knuckle, .0014));
      for (let phalanx = 0; phalanx < count; phalanx++) { const a = phalanx / count, b = (phalanx + .99) / count; bones.push(boneShaft("果蝠五趾各自分节的短趾骨", knuckle.map((v, axis) => v + (end[axis]! - v) * a) as Triple, knuckle.map((v, axis) => v + (end[axis]! - v) * b) as Triple, .0013 - a * .00045)); }
      bones.push(tapered("趾端抓握钩爪的骨性末节", specimenBone, [end, [end[0], .910, -.207], [end[0], .906, -.205]], [.0012, .0009, .00035]));
    }
  }
  const cranium = sweptProfile("真内外壁及后枕开口的小型果蝠脑颅", specimenBone, [[.004, 0], [.013, .002], [.018, .012], [.017, .022], [.01, .035], [0, .041], [0, .038], [.008, .032], [.014, .021], [.015, .012], [.01, .004], [.003, .002]], Math.PI * 2, 16); cranium.position = { x: 0, y: 1.008, z: .105 }; cranium.rotation.x = 90; bones.push(cranium, lobe("小后枕与首颈椎真实连接的枕髁", specimenBone, [0, 1.003, .103], [.009, .009, .009]));
  for (const side of [-1, 1]) {
    const face = polygon("果蝠长吻骨与真侧眼眶", specimenBone, [[.125, 1.01], [.137, 1.022], [.165, 1.016], [.192, 1.003], [.194, .99], [.15, .987], [.129, .995]], .003, [0, 0, 0], [oval(.139, 1.011, .007, .0075)]);
    for (const vertex of face.vertices!) vertex.y = side * (.014 - Math.max(0, vertex.x - .145) / .049 * .009) + vertex.y - .0015;
    face.rotation = { x: -90, y: 0, z: -90 }; bones.push(face);
    bones.push(boneShaft("从真实颅壁接到眶上额骨的细骨桥", [side * .009, 1.016, .136], [side * .014, 1.018, .145], .003), tapered("从颅壁到上颌相接的弯颧弓", specimenBone, [[side * .016, 1.002, .123], [side * .02, .999, .142], [side * .012, .994, .16]], [.0025, .0023, .0023]), tapered("独立下颌骨支与前端骨联合", specimenBone, [[side * .017, .996, .131], [side * .016, .979, .145], [side * .01, .980, .179], [0, .981, .19]], [.003, .0027, .0024, .0018]));
  }
  const nasalRoof = polygon("横接前额与窄吻的薄鼻骨", specimenBone, [[-.012, .14], [-.01, .165], [-.004, .192], [.004, .192], [.01, .165], [.012, .14]], .0025);
  for (const vertex of nasalRoof.vertices!) vertex.y += 1.020 - (vertex.z - .14) * .35;
  bones.push(nasalRoof, polygon("承托上齿并接两侧吻骨的薄骨腭", specimenBone, [[-.013, .14], [-.011, .17], [-.005, .19], [.005, .19], [.011, .17], [.013, .14]], .004, [0, .989, 0]), polygon("接下颌体并承接下齿根的骨性牙槽", specimenBone, [[-.014, .14], [-.011, .178], [-.003, .191], [.003, .191], [.011, .178], [.014, .14], [.009, .144], [.008, .175], [-.008, .175], [-.009, .144]], .0035, [0, .980, 0]));
  for (const upper of [false, true]) for (const side of [-1, 1]) {
    const y = upper ? .990 : .982, direction = upper ? -1 : 1;
    for (let incisor = 0; incisor < 2; incisor++) bones.push(lobe("牙槽中独立生根的果蝠门齿", specimenIvory, [side * (.0015 + incisor * .0028), y + direction * .0013, .187], [.0023, .0031, .0021]));
    const root: Triple = [side * .008, y, .180]; bones.push(tapered("果蝠独立长犬齿与在骨内的牙根", specimenIvory, [root, [root[0], y + direction * .004, root[2]], [root[0], y + direction * .006, root[2] - .001]], [.0014, .0008, .0002]));
    const count = upper ? 5 : 6;
    for (let molar = 0; molar < count; molar++) bones.push(lobe(molar < 3 ? "牙槽中独立前臼齿" : "牙槽中独立臼齿", specimenIvory, [side * (.0102 + (1 - molar / count) * .0008), y + direction * .0011, .171 - molar * .0045], [.0026, .0026, .0031]));
  }
  const parts = [...boneGroups("灰头狐蝠独立翼指、扁肋及颅颌五趾骨组", bones), ...boneGroups("狐蝠真孔椎弓组", arches)];
  parts.push(part("果蝠陈列架真实接地的窄足板", "box", specimenMount, [0, .02, .02], [.28, .04, .24]), beam("从足板穿入胸骨及胸椎的细陈列柱", specimenMount, [0, .04, .02], [0, .964, .02], .012));
  const steel: Triple[] = [[0, .946, -.086], [0, .949, -.07], ...lumbars.toReversed(), ...thoracics.toReversed(), ...cervicals.toReversed()]; parts.push(tapered("穿小椎体而保持椎孔开放的细中轴芯", specimenMount, steel, steel.map(() => .0012)));
  for (const side of [-1, 1]) parts.push(beam("中轴向翼腕骨腹面实接的细斜撑", specimenMount, [0, .962, .02], [side * .245, .998, .155], .0026));
  return parts;
}

export const osteologicalSkeletonExpansionBatchTwelveDesigns: MasterNatureDesign[] = [
  design("greyHeadedFlyingFoxOsteologicalSpecimen", "灰头狐蝠完整骨架陈列标本", "器物", greyHeadedFlyingFoxSkeleton, ["Pteropus poliocephalus", "独立II至V长翼指与双前指爪、扁肋、退化尺骨和后向五趾足", "约一米展翼的哺乳飞行骨系，无虚构骨质翼膜"]),
];
