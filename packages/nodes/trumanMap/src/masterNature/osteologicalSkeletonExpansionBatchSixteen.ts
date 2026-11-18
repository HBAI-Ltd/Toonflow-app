import { beam, design, lobe, needle, part, polygon, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { boneGroups, boneShaft, neuralArch, specimenBone, specimenIvory, specimenMount, specimenStand } from "./osteologicalSkeletonExpansionBatchOne";

const basinStations = [[2.64, .90], [2.95, 1.06], [3.28, 1.15], [3.66, 1.12], [4.03, 1.0], [4.50, .83], [5.25, .62], [6.15, .33], [6.92, .06]];

function oval(x: number, z: number, rx: number, rz: number): [number, number][] {
  return Array.from({ length: 10 }, (_, i) => { const a = i * Math.PI / 5; return [x + Math.cos(a) * rx, z + Math.sin(a) * rz]; });
}

function basinWidth(z: number): number {
  const i = Math.max(1, basinStations.findIndex(([p]) => p! >= z)), a = basinStations[i - 1]!, b = basinStations[i]!;
  return a[1]! + (b[1]! - a[1]!) * (z - a[0]!) / (b[0]! - a[0]!);
}

function basinHeight(x: number, z: number): number {
  const t = Math.max(0, Math.min(1, (z - 2.64) / 4.28));
  return 3.20 + .90 * (1 - t) ** 8 + .55 * (Math.abs(x) / basinWidth(z)) ** 2 * (1 - t);
}

function maxillaryBasin(side: number): ModelPart {
  const fractions = [0, .14, .29, .48, .74, 1], columns = fractions.length, rows = basinStations.length;
  const vertices = [0, -.115].flatMap(depth => basinStations.flatMap(([z, width]) => fractions.map(f => { const x = side * (.045 + (width! - .045) * f); return { x, y: basinHeight(x, z!) + depth, z: z! }; })));
  const active = (r: number, c: number) => r >= 0 && r < rows - 1 && c >= 0 && c < columns - 1 && !(side < 0 && (r === 1 || r === 2) && c < 2) && !(side > 0 && r === 2 && c === 0) && !(r === 2 && c === 3) && !(r === 4 && c === 4);
  const indices: number[] = [], layer = rows * columns;
  for (let r = 0; r < rows - 1; r++) for (let c = 0; c < columns - 1; c++) {
    if (!active(r, c)) continue;
    const a = r * columns + c, b = (r + 1) * columns + c, d = a + 1, e = b + 1, quad = side > 0 ? [a, b, e, d] : [d, e, b, a];
    indices.push(quad[0]!, quad[1]!, quad[2]!, quad[0]!, quad[2]!, quad[3]!, quad[0]! + layer, quad[2]! + layer, quad[1]! + layer, quad[0]! + layer, quad[3]! + layer, quad[2]! + layer);
    const edges = [[a, b, r, c - 1], [b, e, r + 1, c], [e, d, r, c + 1], [d, a, r - 1, c]];
    for (const [u, v, nr, nc] of edges) if (!active(nr!, nc!)) {
      const p = side > 0 ? u! : v!, q = side > 0 ? v! : u!;
      indices.push(p + layer, q + layer, q, p + layer, q, p);
    }
  }
  return part(side < 0 ? "左上颌骨的分站槽盆，较大真鼻道、后颌贯孔及外缘切迹" : "右上颌骨的分站槽盆，较小真鼻道、后颌贯孔及外缘切迹", "mesh", specimenBone, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

function mandibularRamus(side: number): ModelPart {
  const stations = [[3.0, .48, 2.90, .11], [3.4, .43, 2.81, .14], [3.9, .34, 2.73, .13], [4.5, .205, 2.73, .12], [5.3, .08, 2.75, .12], [6.0, .065, 2.79, .105], [6.72, .045, 2.84, .07]];
  const vertices = stations.flatMap(([z, x, y, depth]) => [[-.052, 0], [.052, 0], [.052, depth!], [-.052, depth!]].map(([dx, dy]) => ({ x: side * x! + dx!, y: y! + dy!, z: z! })));
  const indices = [0, 3, 2, 0, 2, 1];
  for (let i = 0; i < stations.length - 1; i++) for (let j = 0; j < 4; j++) { const a = i * 4 + j, b = i * 4 + (j + 1) % 4, c = a + 4, d = b + 4; indices.push(a, b, c, b, d, c); }
  const end = vertices.length - 4; indices.push(end, end + 1, end + 2, end, end + 2, end + 3);
  return part("细长V形下颌支的真实四角闭壳及前方渐薄牙槽", "mesh", specimenBone, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

function jawPoint(z: number): Triple {
  const stations: Triple[] = [[.48, 3.01, 3], [.43, 2.95, 3.4], [.34, 2.86, 3.9], [.205, 2.85, 4.5], [.08, 2.87, 5.3], [.065, 2.895, 6], [.045, 2.91, 6.72]];
  const i = Math.max(1, stations.findIndex(p => p[2] >= z)), a = stations[i - 1]!, b = stations[i]!, t = (z - a[2]) / (b[2] - a[2]);
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, z];
}

// 原创综合骨架复原，不套用须鲸头骨，也不把鲸蜡器的软组织方头做成封闭骨箱。
// 1981原始骨学的49椎/10对可回收肋与17.4m雄颅尺度；缺失胸骨、腕指和盆骨按同文综合资料补足。
// https://eprints.cmfri.org.in/572/1/Article_20.pdf
// https://australian.museum/learn/animals/mammals/sperm-whale/
function spermWhaleReconstructedSkeleton(): ModelPart[] {
  const bones: ModelPart[] = [], spineY = (z: number) => 3.15 + Math.sin((2.5 - z) / 12.75 * Math.PI) * .15;
  const atlas = polygon("独立寰椎和心形贯通神经管，不和其后六颈椎混成实心块", specimenBone, [[-.45, -.20], [-.48, .14], [-.30, .43], [.30, .43], [.48, .14], [.45, -.20]], .11, [0, 3.15, 2.55], [[[-.17, .11], [-.15, .30], [0, .36], [.15, .30], [.17, .11], [0, -.04]]]); atlas.rotation.x = -90; bones.push(atlas);
  for (let cervical = 0; cervical < 6; cervical++) { const z = 2.36 - cervical * .085; bones.push(lobe("C2至C7椎体真正重叠而融合的短颈体", specimenBone, [0, 3.15, z], [.55, .47, .12]), neuralArch([0, 3.15, z], .21, .055)); }
  bones.push(tapered("六颈椎背侧融合棘突，弓基之间仍有真实颈神经出孔", specimenBone, [[0, 3.66, 2.38], [0, 3.66, 1.89]], [.052, .052]));
  const vertebrae = [
    ...Array.from({ length: 11 }, (_, i) => ({ z: 1.75 - i * .32, radius: .23 + Math.sin(i / 10 * Math.PI) * .025, depth: .255, region: "胸椎" })),
    ...Array.from({ length: 8 }, (_, i) => ({ z: -1.83 - i * .39, radius: .28 - i * .003, depth: .32, region: "腰椎" })),
    ...Array.from({ length: 23 }, (_, i) => ({ z: -4.94 - i * .245, radius: .26 - i * .010, depth: .21 - i * .0058, region: "尾椎" })),
  ];
  for (const [i, v] of vertebrae.entries()) {
    const y = spineY(v.z); bones.push(lobe(`抹香鲸独立${v.region}椎体`, specimenBone, [0, y, v.z], [v.radius * 2.05, v.radius * 1.8, v.depth]));
    if (i < 34) { bones.push(neuralArch([0, y, v.z], v.radius, v.depth * .65), needle("椎弓与高棘突真实交接", specimenBone, [0, y + v.radius * 2, v.z], [0, y + v.radius * 3.5, v.z - .03], v.radius * .28)); for (const side of [-1, 1]) bones.push(boneShaft("椎体伸向两侧的独立横突", [side * v.radius * .45, y, v.z], [side * v.radius * 2.75, y - .03, v.z], v.radius * .24)); }
    if (i >= 21 && i < 31) for (const side of [-1, 1]) bones.push(boneShaft("第3尾椎后成对汇合的骨性人字弓", [side * v.radius * .55, y - v.radius * .55, v.z - .07], [0, y - v.radius * 2.1, v.z - .13], v.radius * .16));
  }
  for (let rib = 0; rib < 10; rib++) for (const side of [-1, 1]) {
    const z = 1.75 - rib * .32, y = spineY(z), width = .80 + Math.sin((rib + 1) / 11 * Math.PI) * .65;
    const path: Triple[] = [[side * .20, y - .02, z], [side * .6, y - .14, z + .06], [side * width, y - .61, z + .15], [side * width * .97, y - 1.22, z + .17], [side * width * .64, y - 1.54, z + .14]];
    if (rib < 4) path.push([side * .24, 1.64, 1.42 - rib * .17]); bones.push(tapered("真实独立胸肋，前后较短、中部较长", specimenBone, path, path.map((_, i) => .052 - i * .006)));
  }
  const sternum = polygon("短宽三角抹香鲸胸骨，非人形长胸骨", specimenBone, [[-.33, .70], [-.35, 1.40], [0, 1.62], [.35, 1.40], [.33, .70]], .11, [0, 1.58, 0]); bones.push(sternum);
  bones.push(maxillaryBasin(-1), maxillaryBasin(1));
  const occiput = polygon("高大后枕嵴与真正贯通的三角枕孔", specimenBone, [[-.63, -.16], [-1.0, .43], [-.96, 1.55], [-.48, 1.64], [.43, 1.60], [.91, 1.53], [.96, .42], [.62, -.16]], .15, [0, 3.15, 2.70], [[[-.125, .20], [0, .44], [.125, .20], [0, .12]]]); occiput.rotation.x = -90; bones.push(occiput);
  for (const side of [-1, 1]) {
    bones.push(boneShaft("后枕骨腹侧与寰椎相接的成对枕髁", [side * .25, 3.16, 2.68], [side * .25, 3.16, 2.49], .105));
    const start = side < 0 ? 3.03 : 2.64, front = polygon("左右长度不等、在槽盆底相隔的前颌骨后板", specimenBone, [[side * .055, start], [side * (side < 0 ? .15 : .115), start], [side * .16, 3.8], [side * .055, 3.8]], .065, [0, 0, 0], side > 0 ? [oval(.092, 3.25, .019, .10)] : []);
    for (const vertex of front.vertices!) vertex.y += basinHeight(vertex.x, vertex.z) + .014; bones.push(front);
    const path: Triple[] = [3.77, 4.45, 5.2, 6.1, 7.10].map(z => [side * (.065 - (z - 3.77) / 3.33 * .035), basinHeight(side * .065, Math.min(z, 6.92)) + .045, z]);
    bones.push(tapered("伸超上颌尖端且左右分离的长前颌骨吻支", specimenBone, path, [.055, .052, .043, .035, .02]));
    const orbit = polygon("后颅外侧骨性颧弓与真实开放眼眶", specimenBone, [[2.67, 2.91], [2.67, 3.48], [3.46, 3.53], [3.62, 3.09], [3.20, 2.91]], .09, [side < 0 ? -.94 : .85, 0, 0], [oval(3.12, 3.26, .23, .15)]); orbit.rotation = { x: -90, y: 0, z: -90 }; bones.push(orbit);
    bones.push(boneShaft("眼眶上前缘连接倾斜上颌槽盆的额骨支", [side * .89, 3.50, 3.42], [side * .93, basinHeight(side * .93, 3.42) - .035, 3.42], .065), boneShaft("眼眶后方到内侧下颌关节的鳞骨关节区", [side * .89, 3.12, 2.94], [side * .48, 3.00, 3.0], .095), mandibularRamus(side));
    const count = side < 0 ? 23 : 22;
    for (let tooth = 0; tooth < count; tooth++) { const t = tooth / (count - 1), p = jawPoint(6.55 - t * 2.55), radius = .023 + Math.sin(t * Math.PI) * .017, length = .12 + Math.sin(t * Math.PI) * .085; bones.push(tapered("只在下颌萌出的圆钝锥齿，真实根部嵌入牙槽而非贴在表面", specimenIvory, [[side * p[0], p[1] - .035, p[2]], [side * p[0], p[1] + length * .55, p[2] - .008], [side * p[0], p[1] + length, p[2] - .02]], [radius, radius * .67, .008])); }
    const scapula = polygon("高于宽的抹香鲸肩胛骨及窄肩峰、乌喙突", specimenBone, [[-.32, .17], [-.35, .88], [.13, 1.03], [.43, .77], [.31, .39], [.16, .10], [.05, 0]], .065, [side < 0 ? -.9525 : .8875, 2.42, 1.75]); scapula.rotation = { x: -90, y: 0, z: -90 }; bones.push(scapula);
    const shoulder: Triple = [side * .92, 2.53, 1.81], elbow: Triple = [side * 1.33, 2.20, 1.75], wrist: Triple = [side * 1.60, 2.03, 1.63];
    bones.push(lobe("短鳍肢近端的肱骨球头", specimenBone, shoulder, [.21, .21, .21]), boneShaft("短粗的独立肱骨", shoulder, elbow, .115), boneShaft("短鳍前缘桡骨", [elbow[0], elbow[1], elbow[2] + .08], [wrist[0], wrist[1], wrist[2] + .08], .073), boneShaft("短鳍后缘尺骨与肘突", [elbow[0], elbow[1] + .04, elbow[2] - .10], [wrist[0], wrist[1], wrist[2] - .075], .068));
    for (let carpal = 0; carpal < 6; carpal++) bones.push(lobe("五指短鳍基部相接的两排独立腕骨", specimenBone, [side * (1.61 + Math.floor(carpal / 3) * .068), 2.02 - Math.floor(carpal / 3) * .035, 1.55 + carpal % 3 * .079], [.12, .10, .12]));
    for (const [digit, count] of [2, 6, 5, 4, 3].entries()) {
      const root: Triple = [side * 1.67, 1.99, 1.54 + digit * .04], tip: Triple = [side * (1.94 + Math.sin((digit + 1) / 6 * Math.PI) * .27), 1.72 + digit * .025, 1.15 + digit * .23];
      for (let joint = 0; joint <= count; joint++) { const a = joint / (count + 1), b = (joint + .94) / (count + 1); bones.push(boneShaft(joint ? "五指短鳍中各自独立的扁厚指骨" : "五指短鳍独立掌骨", root.map((v, axis) => v + (tip[axis]! - v) * a) as Triple, root.map((v, axis) => v + (tip[axis]! - v) * b) as Triple, .039 * (1 - a * .5))); }
    }
    bones.push(boneShaft("第一尾椎旁不与脊柱相接的退化盆骨", [side * .48, 2.98, -4.70], [side * .54, 2.96, -5.36], .048));
  }
  // 前方长联合为真正骨体，不让两根V形下颌仅仅在外观上接近。
  bones.push(polygon("长V下颌前段的真实联合骨体", specimenBone, [[-.15, 4.86], [-.095, 6.7], [0, 6.78], [.095, 6.7], [.15, 4.86]], .09, [0, 2.77, 0]));
  const vomer = polygon("两前颌骨之间从窄端渐宽的犁骨沟底", specimenBone, [[-.025, 2.91], [-.08, 4], [-.065, 5.5], [-.018, 6.8], [.018, 6.8], [.065, 5.5], [.08, 4], [.025, 2.91]], .06);
  for (const vertex of vomer.vertices!) vertex.y += basinHeight(0, vertex.z) - .06; bones.push(vomer);
  for (const side of [-1, 1]) bones.push(tapered("犁骨背侧真实凹沟两缘", specimenBone, [3.1, 4, 5.5, 6.7].map(z => [side * (z < 4.1 ? .055 : .055 - (z - 4) * .013), basinHeight(0, z) + .018, z]), [.027, .028, .021, .012]));
  bones.push(polygon("后咽部独立的中舌骨宽体", specimenBone, [[-.24, 2.4], [-.27, 2.72], [0, 2.86], [.27, 2.72], [.24, 2.4]], .09, [0, 2.05, 0]));
  for (const side of [-1, 1]) bones.push(tapered("舌骨装置后侧的独立扁胸舌骨支", specimenBone, [[side * .20, 2.10, 2.48], [side * .38, 2.10, 2.26], [side * .43, 2.10, 2.04]], [.075, .09, .07]), boneShaft("舌骨前方独立的细长茎舌骨", [side * .20, 2.10, 2.70], [side * .39, 2.32, 3.31], .045));
  const parts = boneGroups("抹香鲸独立骨系综合复原组", bones);
  const axis: Triple[] = [2.55, 1.75, 0, -2, -4.94, -7.5, -10.33].map(z => [0, z > 1.9 ? 3.15 : spineY(z), z]);
  parts.push(tapered("穿过真实分节椎体的陈列中轴钢芯", specimenMount, axis, axis.map(() => .025)));
  for (const z of [1.75, -3, -8]) parts.push(...specimenStand(z, spineY(z) - .12, 1.3));
  parts.push(...specimenStand(3.15, 3.08, 1.1), ...specimenStand(5.8, 2.73, .75));
  for (const side of [-1, 1]) parts.push(beam("高后颅钢柱到真实槽盆骨底的承重横托", specimenMount, [0, 3.08, 3.15], [side * .54, basinHeight(side * .54, 3.15) - .07, 3.15], .038), beam("中轴到肩胛厚骨板的独立支撑", specimenMount, [0, spineY(1.75), 1.75], [side * .92, 2.96, 1.75], .025), beam("中轴到独立退化骨盆的细托", specimenMount, [0, spineY(-4.99), -4.99], [side * .506, 2.973, -4.99], .02));
  parts.push(beam("中轴向短胸骨的独立细钢托", specimenMount, [0, spineY(1.1), 1.1], [0, 1.64, 1.1], .025), beam("下咽舌骨组真实落到中央中舌骨的承托", specimenMount, [0, spineY(2.2), 2.2], [0, 2.09, 2.60], .022));
  return parts;
}

export const osteologicalSkeletonExpansionBatchSixteenDesigns: MasterNatureDesign[] = [
  design("spermWhaleReconstructedOsteologicalSpecimen", "抹香鲸完整骨架复原陈列标本", "器物", spermWhaleReconstructedSkeleton, ["Physeter macrocephalus", "不对称槽盆巨颅、下牙列与长下颌联合、融合短颈、五指短鳍及舌骨", "原创综合解剖简化复原，非单件馆藏原骨精确复制"]),
];
