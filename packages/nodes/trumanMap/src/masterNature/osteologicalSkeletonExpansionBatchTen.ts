import { Quaternion, Vector3 } from "three";
import { beam, combineMeshes, design, lobe, polygon, sweptProfile, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { boneGroups, boneShaft, neuralArch, specimenBone, specimenIvory, specimenMount, specimenStand } from "./osteologicalSkeletonExpansionBatchOne";

function oval(x: number, y: number, radiusX: number, radiusY: number): [number, number][] {
  return Array.from({ length: 10 }, (_, index) => { const a = index * Math.PI / 5; return [x + Math.cos(a) * radiusX, y + Math.sin(a) * radiusY]; });
}

function apeVertebra(name: string, position: Triple, radius: number, depth: number): ModelPart {
  const local = combineMeshes(name, specimenBone, [tapered("椎体关节宽端与收细的骨干", specimenBone, [[0, 0, -depth * .48], [0, 0, -depth * .2], [0, 0, depth * .25], [0, 0, depth * .48]], [radius, radius * .8, radius * .8, radius]), neuralArch([0, 0, depth * .15], radius, depth * .55)]);
  const frame = new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), new Vector3(0, .38, 1).normalize());
  for (const vertex of local.vertices!) { const p = new Vector3(vertex.x, vertex.y, vertex.z).applyQuaternion(frame).add(new Vector3(...position)); vertex.x = p.x; vertex.y = p.y; vertex.z = p.z; }
  return local;
}

// 独立猿类骨系：长臂、中立腕的指背承重手、对握足拇趾、长髂翼及宽漏斗胸。
// 不是人形外壳换白，也不按椎骨数量改变把同一个骨架重复作为物种。
// https://nationalzoo.si.edu/animals/western-lowland-gorilla
// https://doi.org/10.1073/pnas.0901280106
// https://www.kahaku.go.jp/albums/abm.php?d=4638&f=abm00000619.pdf&n=L_BNMNS_47-3_135.pdf
// https://www.sciencedirect.com/science/article/pii/S0047248423000362
function westernGorillaSkeleton(): ModelPart[] {
  const bones: ModelPart[] = [];
  const cervicals: Triple[] = Array.from({ length: 7 }, (_, i) => [0, 1.17 - i * .012, .58 - i * .032]);
  const thoracics: Triple[] = Array.from({ length: 13 }, (_, i) => [0, 1.078 - i * .018, .351 - i * .045]);
  const lumbars: Triple[] = Array.from({ length: 4 }, (_, i) => [0, .838 - i * .022, -.239 - i * .05]);
  for (const [name, points, radius, depth] of [["七节独立颈椎", cervicals, .023, .032], ["十三枚独立附肋胸椎", thoracics, .028, .044], ["短腰部四枚独立腰椎", lumbars, .033, .048]] as [string, Triple[], number, number][]) for (const point of points) bones.push(apeVertebra(name, point, radius, depth));
  const sacrum = polygon("长髂翼之间融合的骶骨及成对真实骶孔", specimenBone, [[-.085, .08], [-.10, .015], [-.055, -.13], [0, -.17], [.055, -.13], [.10, .015], [.085, .08]], .039, [0, .69, -.47], [oval(-.037, .015, .01, .012), oval(.037, .015, .01, .012), oval(-.023, -.053, .008, .011), oval(.023, -.053, .008, .011)]);
  for (const vertex of sacrum.vertices!) vertex.y += vertex.z * .55;
  bones.push(sacrum, tapered("退化尾椎融合成尾骨而无虚构猿尾", specimenBone, [[0, .637, -.6], [0, .604, -.63], [0, .586, -.635]], [.022, .016, .006]));
  for (let sternal = 0; sternal < 7; sternal++) {
    const y = .93 - sternal * .045, z = .38 - sternal * .07, width = sternal === 0 ? .065 : .043;
    const element = polygon(sternal === 0 ? "宽胸骨柄" : sternal === 6 ? "独立胸骨尾端剑突" : "宽胸骨中可辨的独立胸骨节", specimenBone, [[-width, -.036], [-width, .036], [width, .036], [width, -.036]], .019, [0, y, z]);
    for (const vertex of element.vertices!) vertex.y += vertex.z * .64; bones.push(element);
  }
  for (let rib = 0; rib < 13; rib++) for (const side of [-1, 1]) {
    const p = thoracics[rib]!, spread = .145 + Math.sin((rib + 1) / 16 * Math.PI) * .145;
    const path: Triple[] = [[side * .025, p[1] + .005, p[2]], [side * spread * .8, p[1] - .015, p[2] + .018], [side * spread, p[1] - .13, p[2] + .026], [side * spread * .82, p[1] - .27, p[2] + .023]];
    if (rib < 7) path.push([side * .04, .944 - rib * .045, .38 - rib * .07]); else path.push([side * .11, p[1] - .29, p[2] + .055]);
    bones.push(tapered("大猩猩宽漏斗胸中独立弯曲的长肋骨", specimenBone, path, [.0095, .009, .008, .0065, .0048]));
  }
  for (const side of [-1, 1]) {
    const scapula = polygon("猿类胸背侧宽三角形肩胛骨", specimenBone, [[side * .10, .86], [side * .27, 1.16], [side * .36, 1.055], [side * .30, .86]], .023, [0, 0, .257]); scapula.rotation.x = -90; bones.push(scapula);
    const shoulder: Triple = [side * .3, 1.08, .35], elbow: Triple = [side * .38, .615, .43], wrist: Triple = [side * .43, .20, .58];
    bones.push(tapered("连接胸骨柄与肩峰的弯曲锁骨", specimenBone, [[side * .04, .95, .38], [side * .16, 1.035, .39], shoulder], [.014, .013, .016]), boneShaft("肩胛骨到肩关节的肩峰及关节盂骨突", [side * .32, 1.064, .246], shoulder, .024), lobe("肩关节中连续接合的肱骨球头", specimenBone, shoulder, [.068, .068, .068]), boneShaft("长于后肢比例的粗壮上臂肱骨", shoulder, elbow, .029), boneShaft("保持桡尺间隙的长桡骨", [elbow[0] - side * .014, elbow[1], elbow[2] + .012], [wrist[0] - side * .014, wrist[1], wrist[2] + .01], .019), boneShaft("有肘突而独立于桡骨的长尺骨", [elbow[0] + side * .018, elbow[1] + .025, elbow[2] - .015], [wrist[0] + side * .016, wrist[1], wrist[2] - .012], .021));
    for (let carpal = 0; carpal < 8; carpal++) bones.push(lobe("猿类手腕双排相接的独立腕骨", specimenBone, [wrist[0] + side * (carpal % 4 - 1.5) * .019, .194 - Math.floor(carpal / 4) * .014, .58 + Math.floor(carpal / 4) * .023], [.027, .029, .031]));
    for (let finger = 0; finger < 4; finger++) {
      const offset = side * (finger - 1.5) * .021, mcp: Triple = [wrist[0] + offset, .112, .705], pip: Triple = [wrist[0] + offset, .064, .774], dip: Triple = [wrist[0] + offset, .064, .717], end: Triple = [wrist[0] + offset, .104, .703];
      bones.push(boneShaft("从腕骨发出的独立第二至第五掌骨", [wrist[0] + offset * .5, .186, .601], mcp, .0115), boneShaft("下弯至指背承重点的近节指骨", mcp, pip, .011), boneShaft("指背承重并向腕侧折回的中节指骨", pip, dip, .01), boneShaft("卷回掌侧的短末节指骨", dip, end, .007));
    }
    bones.push(boneShaft("对握拇指独立第一掌骨", [side * .41, .186, .59], [side * .365, .13, .635], .013), boneShaft("拇指近节指骨", [side * .365, .13, .635], [side * .35, .102, .685], .011), boneShaft("拇指末节指骨", [side * .35, .102, .685], [side * .349, .132, .713], .008));
    const pelvis = polygon("长髂翼及下方真闭孔组成的猿类半骨盆", specimenBone, [[.18, .05], [.12, .27], [-.02, .3], [-.20, .22], [-.23, .05], [-.17, -.10], [.03, -.08], [.14, -.02]], .026, [side < 0 ? -.153 : .127, .55, -.45], [oval(.02, .17, .038, .044), oval(.01, -.012, .073, .046)]); pelvis.rotation = { x: -90, y: 0, z: -90 }; bones.push(pelvis);
    const hip: Triple = [side * .14, .72, -.43], knee: Triple = [side * .20, .41, -.33], ankle: Triple = [side * .23, .11, -.53];
    bones.push(lobe("坐入髋臼而与盆骨真实接合的股骨头", specimenBone, hip, [.086, .086, .086]), boneShaft("短而弯曲承重的后肢股骨", hip, knee, .027), boneShaft("较粗承重胫骨", [knee[0] - side * .012, knee[1], knee[2]], [ankle[0] - side * .009, ankle[1], ankle[2]], .022), boneShaft("与胫骨可辨分离的细腓骨", [knee[0] + side * .022, knee[1], knee[2] - .01], [ankle[0] + side * .023, ankle[1], ankle[2] - .008], .012), lobe("膝前独立髌骨", specimenBone, [side * .2, .415, -.305], [.042, .05, .026]));
    for (let tarsal = 0; tarsal < 7; tarsal++) bones.push(lobe("后足独立跗骨、距跟骨与楔骨", specimenBone, [ankle[0] + side * (tarsal % 3 - 1) * .024, .087 - Math.floor(tarsal / 3) * .006, -.505 + Math.floor(tarsal / 3) * .033], [.043, .045, .05]));
    for (let toe = 0; toe < 5; toe++) {
      const root: Triple = [ankle[0] + side * (toe - 2) * .014, .078, -.443], metatarsal: Triple = toe === 0 ? [side * .142, .058, -.353] : [ankle[0] + side * (toe - 2) * .027, .06, -.324], end: Triple = toe === 0 ? [side * .10, .042, -.279] : [metatarsal[0], .04, -.224 - Math.abs(toe - 2) * .014], count = toe === 0 ? 2 : 3;
      bones.push(boneShaft(toe === 0 ? "对握足拇趾内转的第一跖骨" : "从后足跗骨发出的独立跖骨", root, metatarsal, toe === 0 ? .014 : .012));
      for (let phalanx = 0; phalanx < count; phalanx++) { const a = phalanx / count, b = (phalanx + .98) / count; bones.push(boneShaft("后足对握趾中分节相接的独立趾骨", metatarsal.map((v, axis) => v + (end[axis]! - v) * a) as Triple, metatarsal.map((v, axis) => v + (end[axis]! - v) * b) as Triple, .0095 * (1 - a * .4))); }
    }
    bones.push(boneShaft("骨盆前下方向中线相接的耻骨联合支", [side * .13, .50, -.36], [0, .5, -.38], .018));
  }
  const vault = sweptProfile("后枕开口保持贯通、内壁真实空腔的猿类脑颅", specimenBone, [[.023, 0], [.105, .015], [.145, .07], [.15, .13], [.116, .23], [0, .27], [0, .258], [.105, .224], [.137, .13], [.132, .073], [.095, .027], [.02, .012]], Math.PI * 2, 20);
  vault.position = { x: 0, y: 1.205, z: .56 }; vault.rotation.x = 90; bones.push(vault);
  const crest = polygon("与脑颅相融而非外壳头冠的成年雄性矢状骨嵴", specimenBone, [[.58, 1.30], [.61, 1.39], [.71, 1.42], [.8, 1.32], [.8, 1.30], [.71, 1.34], [.61, 1.32]], .012, [-.006, 0, 0]); crest.rotation = { x: -90, y: 0, z: -90 }; bones.push(crest);
  const face = polygon("猿类突出颜面的真双眼眶及梨形鼻孔", specimenBone, [[-.12, 0], [-.155, .08], [-.155, .19], [-.09, .24], [.09, .24], [.155, .19], [.155, .08], [.12, 0]], .024, [0, 1.05, .887], [oval(-.07, .16, .046, .04), oval(.07, .16, .046, .04), [[-.028, .07], [0, .115], [.028, .07], [.021, .025], [-.021, .025]]]); face.rotation.x = -90; bones.push(face);
  for (const side of [-1, 1]) {
    bones.push(tapered("从真实脑颅骨壁连续拱到面颊的颧弓", specimenBone, [[side * .139, 1.16, .70], [side * .17, 1.17, .8], [side * .13, 1.16, .875]], [.018, .017, .017]), boneShaft("脑颅前部向眶上骨缘连接的额骨支", [side * .07, 1.30, .78], [side * .1, 1.28, .875], .016), boneShaft("下颌升支与颧弓内侧下颌关节相接", [side * .145, 1.17, .79], [side * .12, 1.005, .86], .022));
    bones.push(tapered("独立下颌体向前成U形的骨性牙槽", specimenBone, [[side * .12, 1.006, .85], [side * .115, 1.005, .94], [side * .065, 1.006, 1.015], [0, 1.006, 1.025]], [.022, .02, .018, .018]));
  }
  bones.push(boneShaft("横接两侧额骨与眼眶上缘的骨性眉嵴", [-.11, 1.28, .875], [.11, 1.28, .875], .012), boneShaft("脑颅腹侧向上颌薄腭连续接合的颅底骨", [0, 1.08, .75], [0, 1.075, .88], .012));
  const upperAlveolus = polygon("真实承接全部上齿牙根的上颌骨腭", specimenBone, [[-.11, .84], [-.12, .93], [-.07, 1.015], [.07, 1.015], [.12, .93], [.11, .84]], .035, [0, 1.055, 0]);
  const lowerAlveolus = polygon("真实承接全部下齿牙根的U形下牙槽骨", specimenBone, [[-.115, .85], [-.123, .94], [-.065, 1.025], [.065, 1.025], [.123, .94], [.115, .85], [.088, .87], [.09, .937], [.05, .994], [-.05, .994], [-.09, .937], [-.088, .87]], .025, [0, 1.0, 0]); bones.push(upperAlveolus, lowerAlveolus);
  for (const side of [-1, 1]) for (const upper of [false, true]) {
    const rootY = upper ? 1.06 : 1.022, direction = upper ? -1 : 1;
    for (let incisor = 0; incisor < 2; incisor++) bones.push(lobe("牙槽中单独生根的扁小门齿", specimenIvory, [side * (.015 + incisor * .03), rootY + direction * .007, 1.006], [.024, .021, .016]));
    const canine: Triple = [side * .077, rootY, .986]; bones.push(tapered("成年雄猿独立长犬齿及真实牙根", specimenIvory, [canine, [canine[0], rootY + direction * .026, .992], [canine[0], rootY + direction * .036, .99]], [.009, .005, .0005]));
    for (let tooth = 0; tooth < 5; tooth++) bones.push(lobe(tooth < 2 ? "独立双尖前臼齿" : "独立多尖宽冠臼齿", specimenIvory, [side * .104, rootY + direction * .006, .948 - tooth * .023], [.023, .02, .021]));
  }
  const parts = boneGroups("大猩猩独立指背步态、长臂短腿及猿颅骨组", bones);
  parts.push(...specimenStand(-.135, .88, .65), ...specimenStand(-.49, .675, .59));
  const steel: Triple[] = [[0, .637, -.6], [0, .70, -.49], ...lumbars.toReversed(), ...thoracics.toReversed(), ...cervicals.toReversed()];
  parts.push(tapered("穿过分节椎体并接合盆颈的陈列细钢芯", specimenMount, steel, steel.map(() => .006)));
  for (const side of [-1, 1]) parts.push(beam("胸部主钢芯实际接到肩胛骨的短支撑", specimenMount, [0, 1.033, .239], [side * .25, 1.03, .246], .007), beam("腰骶主芯实际承接两侧髂翼的骨盆托", specimenMount, [0, .72, -.45], [side * .14, .72, -.5], .008));
  return parts;
}

export const osteologicalSkeletonExpansionBatchTenDesigns: MasterNatureDesign[] = [
  design("westernGorillaOsteologicalSpecimen", "西部低地大猩猩完整骨架陈列标本", "器物", westernGorillaSkeleton, ["Gorilla gorilla gorilla", "指背承重长臂、对握足拇趾、长髂翼和宽漏斗胸", "空腔脑颅矢状嵴、真眶鼻孔及完整32齿骨系"]),
];
