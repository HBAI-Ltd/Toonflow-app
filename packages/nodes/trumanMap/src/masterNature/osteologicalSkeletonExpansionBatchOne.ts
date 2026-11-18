import { beam, combineMeshes, design, lobe, needle, part, polygon, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";

export const specimenBone = "#c9c6b1";
export const specimenIvory = "#d9d2b8";
export const specimenMount = "#68777a";

export function boneShaft(name: string, start: Triple, end: Triple, radius: number): ModelPart {
  const path = [0, .16, .83, 1].map(t => start.map((value, axis) => value + (end[axis]! - value) * t) as Triple);
  return tapered(name, specimenBone, path, [radius, radius * .67, radius * .64, radius * .96]);
}

export function boneGroups(name: string, bones: ModelPart[]): ModelPart[] {
  const result: ModelPart[] = [];
  let batch: ModelPart[] = [], vertices = 0, indices = 0;
  for (const bone of bones) {
    if (batch.length && (vertices + bone.vertices!.length > 480 || indices + bone.indices!.length > 2800)) {
      result.push(combineMeshes(`${name}${result.length + 1}`, specimenBone, batch)); batch = []; vertices = 0; indices = 0;
    }
    batch.push(bone); vertices += bone.vertices!.length; indices += bone.indices!.length;
  }
  if (batch.length) result.push(combineMeshes(`${name}${result.length + 1}`, specimenBone, batch));
  return result;
}

export function neuralArch(position: Triple, radius: number, depth: number): ModelPart {
  const factor = radius / .3;
  const outer: [number, number][] = [[-.28, .16], [-.32, .45], [-.2, .67], [.2, .67], [.32, .45], [.28, .16]];
  const inner: [number, number][] = [[-.055, .36], [.055, .36], [.0675, .44], [0, .5], [-.0675, .44]];
  const arch = polygon("椎体背面具有真实椎孔的神经弓", specimenBone, outer.map(([x, y]) => [x * factor, y * factor]), depth, position, [inner.map(([x, y]) => [x * factor, y * factor])]);
  arch.rotation.x = -90;
  return arch;
}

function oval(x: number, y: number, radiusX: number, radiusY: number): [number, number][] {
  return Array.from({ length: 12 }, (_, index) => {
    const angle = index * Math.PI / 6;
    return [x + Math.cos(angle) * radiusX, y + Math.sin(angle) * radiusY];
  });
}

export function specimenStand(z: number, height: number, width: number): ModelPart[] {
  return [part("骨骼陈列支架接地的宽足板", "box", specimenMount, [0, .05, z], [width, .1, .86]),
    beam("由足板接到承重骨下方的钢立柱", specimenMount, [0, .1, z], [0, height - .045, z], .075),
    beam("与承重骨及内藏骨架轴实际接触的上托", specimenMount, [-width * .16, height, z], [width * .16, height, z], .09)];
}

// 依据NHM完整蓝鲸陈列的骨骼装配关系及USNM的头颅、肩胛、鳍肢/骨盆资料原创简化。
// 不下载扫描网格，不把活体模型换白；背鳍和尾叶不含骨，因而不添加假的骨质鳍片。
// https://www.nhm.ac.uk/discover/hope-the-blue-whale-display.html
// https://repository.si.edu/bitstreams/f7df27ea-7b5e-45b4-9d3a-d23911671ba0/download
function blueWhaleSkeleton(): ModelPart[] {
  const bones: ModelPart[] = [], ribs: ModelPart[] = [], arches: ModelPart[] = [];
  const spineY = (z: number) => 4.45 + Math.sin((6.2 - z) / 17 * Math.PI) * .28;
  const vertebrae = [
    ...Array.from({ length: 7 }, (_, index) => ({ z: 6.2 - index * .105, radius: .27, depth: .078, region: "颈椎" })),
    ...Array.from({ length: 15 }, (_, index) => ({ z: 5.43 - index * .43, radius: .29 + Math.sin(index / 14 * Math.PI) * .035, depth: .34, region: "胸椎" })),
    ...Array.from({ length: 14 }, (_, index) => ({ z: -1.1 - index * .37, radius: .34 - index * .008, depth: .3, region: "腰椎" })),
    ...Array.from({ length: 24 }, (_, index) => ({ z: -6.23 - index * .198, radius: .22 - index / 23 * .175, depth: .158, region: "尾椎" })),
  ];
  for (const [index, vertebra] of vertebrae.entries()) {
    const { z, radius, depth, region } = vertebra, y = spineY(z);
    bones.push(lobe(`${region}的独立椎体`, specimenBone, [0, y, z], [radius * 2.1, radius * 1.8, depth]));
    arches.push(neuralArch([0, y, z], radius, depth * .54));
    const spineHeight = region === "颈椎" ? .18 : region === "尾椎" ? .12 + radius : .55 + Math.sin(index * .12) * .17;
    bones.push(needle("椎弓上向背侧伸出的棘突", specimenBone, [0, y + radius * 2, z], [0, y + radius * 2 + spineHeight, z - depth * .27], radius * .32));
    if (index < 48) for (const side of [-1, 1]) bones.push(needle("椎体侧方承托肌腱和肋骨的横突", specimenBone, [side * radius * .5, y + radius * .13, z], [side * radius * 2.75, y + radius * .1, z - depth * .1], radius * .3));
    if (index >= 38 && index < 55) {
      const low: Triple = [0, y - radius * 2.6, z + depth * .1];
      for (const side of [-1, 1]) bones.push(boneShaft("尾椎腹侧成对汇合的人字骨", [side * radius * .65, y - radius * .5, z], low, radius * .18));
    }
  }
  for (let index = 0; index < 15; index++) for (const side of [-1, 1]) {
    const z = 5.43 - index * .43, y = spineY(z), spread = .95 + Math.sin((index + 1) / 17 * Math.PI) * 1.2;
    const path: Triple[] = [[side * .25, y - .06, z], [side * .65, y - .18, z + .06], [side * spread, y - .78, z + .16], [side * spread * .99, y - 1.46, z + .2], [side * spread * .72, y - 2.02, z + .16], [side * .25, y - 2.18, z + .08]];
    ribs.push(tapered("从胸椎关节连续弯向腹侧的独立长肋骨", specimenBone, path, [.071, .067, .057, .052, .043, .034]));
  }
  const skullBack = polygon("蓝鲸后颅骨与真正贯通的枕骨大孔", specimenBone, [[-1.05, 0], [-1.66, .41], [-1.28, 1.02], [-.58, 1.42], [.58, 1.42], [1.28, 1.02], [1.66, .41], [1.05, 0]], .16, [0, 3.8, 6.45], [oval(0, .65, .065, .075)]);
  skullBack.rotation.x = -90; bones.push(skullBack);
  for (const side of [-1, 1]) {
    const maxilla = polygon("蓝鲸上颌骨的宽后端与向前渐窄的长吻板", specimenBone, [[0, 6.37], [side * .59, 6.49], [side * 1.69, 7.25], [side * 1.46, 7.93], [side * .68, 9.43], [side * .28, 13.35], [side * .065, 13.95], [0, 13.95]], .13, [0, 4.36, 0]);
    for (const vertex of maxilla.vertices!) vertex.y += Math.sin((vertex.z - 6.37) / 7.58 * Math.PI) * .31;
    bones.push(maxilla, tapered("与头颅铰接但在前端保持软性联合间隙的弓形下颌骨", specimenBone, [[side * 1.32, 4.1, 7.05], [side * 1.98, 3.68, 8.15], [side * 2.31, 3.41, 9.4], [side * 2.22, 3.35, 10.5], [side * 1.65, 3.37, 12], [side * .61, 3.54, 13.4], [side * .09, 3.68, 14.0]], [.2, .18, .16, .145, .12, .09, .055]));
    bones.push(boneShaft("后颅侧方的颧弓与下颌关节支柱", [side * 1.36, 4.12, 6.69], [side * 1.32, 4.12, 7.12], .13));
    const scapula = polygon("蓝鲸前肢宽扇形肩胛骨", specimenBone, [[-.7, .16], [-.46, .77], [.08, .95], [.72, .68], [.79, .12], [.2, 0]], .075, [side < 0 ? -1.115 : 1.04, 3.36, 5.14]);
    // XYZ等价旋转：局部X沿身体纵向Z，轮廓Z成为高度Y，板厚Y沿横向+X。
    scapula.rotation = { x: -90, y: 0, z: -90 }; bones.push(scapula);
    const shoulder: Triple = [side * 1.07, 3.45, 5.22], elbow: Triple = [side * 1.92, 3.1, 5.07], wrist: Triple = [side * 2.72, 2.77, 4.79];
    bones.push(boneShaft("鳍肢近端短粗肱骨", shoulder, elbow, .16), boneShaft("鳍肢前缘独立桡骨", [elbow[0], elbow[1], elbow[2] + .1], [wrist[0], wrist[1], wrist[2] + .11], .105), boneShaft("鳍肢后缘带肘突的尺骨", [elbow[0], elbow[1] + .05, elbow[2] - .12], [wrist[0], wrist[1], wrist[2] - .12], .095));
    for (let carpal = 0; carpal < 4; carpal++) bones.push(lobe("鳍肢腕部独立相接的腕骨", specimenBone, [wrist[0] + side * (carpal % 2) * .16, wrist[1] - Math.floor(carpal / 2) * .065, wrist[2] + (carpal % 2 - .5) * .18], [.19, .16, .19]));
    const phalangeCounts = [3, 5, 6, 3];
    for (let digit = 0; digit < 4; digit++) {
      const root: Triple = [side * 2.81, 2.72, 4.66 + digit * .09];
      const tip: Triple = [side * (3.57 + Math.sin((digit + 1) / 5 * Math.PI) * .38), 2.2 + digit * .07, 3.86 + digit * .33];
      const count = phalangeCounts[digit]!;
      for (let phalanx = 0; phalanx <= count; phalanx++) {
        const a = phalanx / (count + 1), b = (phalanx + .91) / (count + 1);
        const from = root.map((value, axis) => value + (tip[axis]! - value) * a) as Triple, to = root.map((value, axis) => value + (tip[axis]! - value) * b) as Triple;
        bones.push(boneShaft(phalanx ? "蓝鲸鳍肢独立分节指骨" : "蓝鲸鳍肢独立掌骨", from, to, .066 * (1 - a * .55)));
      }
    }
    bones.push(boneShaft("与脊柱不再相接的退化骨盆骨", [side * .64, 3.86, -4.15], [side * .79, 3.78, -4.71], .055));
  }
  bones.push(polygon("须鲸前胸独立小型胸骨板而非整条人形胸骨", specimenBone, [[-.29, -.24], [-.05, -.12], [.29, -.24], [.25, .22], [0, .33], [-.25, .22]], .1, [0, 2.21, 5.15]));
  const parts = [...boneGroups("蓝鲸分节中轴与附肢骨组", bones), ...boneGroups("蓝鲸真实贯孔的椎弓组", arches), ...boneGroups("蓝鲸成对开放胸肋组", ribs)];
  const armaturePath: Triple[] = [6.3, 3, -1, -5.5, -9.9, -10.9].map(z => [0, spineY(z), z]);
  parts.push(tapered("穿过椎体中心将独立椎骨承托在一起的陈列钢芯", specimenMount, armaturePath, armaturePath.map(() => .034)));
  for (const z of [-8, -2, 5.1]) parts.push(...specimenStand(z, spineY(z) - .14, 2.3));
  parts.push(part("下颌托架接地足板", "box", specimenMount, [0, .05, 10.5], [2.6, .1, 1]), beam("由地板接到弓形下颌下方的钢柱", specimenMount, [0, .1, 10.5], [0, 3.19, 10.5], .08), beam("两端实际接触左右下颌下缘的横向托架", specimenMount, [-2.24, 3.19, 10.5], [2.24, 3.19, 10.5], .07));
  for (const side of [-1, 1]) parts.push(beam("退化骨盆标本连接到中央钢芯的细支撑", specimenMount, [0, spineY(-4.42), -4.42], [side * .7, 3.82, -4.42], .025), beam("从中央钢芯实际接到鳍肢肩胛内侧的支承杆", specimenMount, [0, spineY(5.14), 5.14], [side * 1.065, 3.86, 5.14], .035));
  return parts;
}

export const osteologicalSkeletonExpansionBatchOneDesigns: MasterNatureDesign[] = [
  design("blueWhaleOsteologicalSpecimen", "蓝鲸完整骨架陈列标本", "器物", blueWhaleSkeleton, ["Balaenoptera musculus", "颅颌、四指鳍肢、贯孔脊椎、胸肋与退化骨盆", "带落地支架的完整骨骼学标本"]),
];
