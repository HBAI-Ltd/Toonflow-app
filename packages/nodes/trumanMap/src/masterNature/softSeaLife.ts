import { beam, cap, combineMeshes, design, leaf, lobe, needle, part, petals, polygon, sweptProfile, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";

const skin = "#afbba2";
const pale = "#c4cdb1";
const dark = "#8f9f8c";

function filament(name: string, path: Triple[], radius: number, color = pale): ModelPart {
  return tapered(name, color, path, path.map((_, i) => radius * (1 - i / path.length * 0.55)));
}

function band(name: string, path: Triple[], width: number, thickness: number): ModelPart {
  const vertices = path.flatMap(([x, y, z]) => [{ x, y: y - thickness / 2, z: z - width / 2 }, { x, y: y - thickness / 2, z: z + width / 2 }, { x, y: y + thickness / 2, z: z + width / 2 }, { x, y: y + thickness / 2, z: z - width / 2 }]);
  const indices: number[] = [0, 1, 2, 0, 2, 3];
  for (let i = 1; i < path.length; i++) for (let j = 0; j < 4; j++) { const a = (i - 1) * 4 + j, b = (i - 1) * 4 + (j + 1) % 4, c = a + 4, d = b + 4; indices.push(a, c, b, b, c, d); }
  const n = vertices.length - 4; indices.push(n, n + 2, n + 1, n, n + 3, n + 2);
  return part(name, "mesh", skin, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices, opacity: 0.7 });
}

function drifting(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  if (kind === 0) {
    const path: Triple[] = Array.from({ length: 41 }, (_, i) => { const x = (i - 20) * 0.035; return [x, 0.055 + Math.sin(i * 0.42) * 0.025, Math.sin(i * 0.22) * 0.08]; });
    parts.push(band("带形栉水母左右延展的扁带体", path, 0.075, 0.008));
    for (const side of [-1, 1]) parts.push(filament("沿长体边缘连续栉板带", path.map(([x, y, z]) => [x, y + 0.005, z + side * 0.035]), 0.0015));
    parts.push(lobe("带体中央口区", pale, [0, path[20]![1], path[20]![2]], [0.045, 0.013, 0.065]));
  } else if (kind === 1) {
    const body = polygon("鱼形海蛞蝓侧扁的鱼状体与无鳍尾缘", skin, [[-0.022, 0], [-0.018, 0.014], [0.01, 0.017], [0.028, 0.009], [0.036, 0], [0.028, -0.009], [0.01, -0.013], [-0.018, -0.011]], 0.004); body.rotation.x = 90; parts.push(body);
    for (const side of [-1, 1]) parts.push(filament("头部一对长嗅角", [[-0.018, 0.003, side * 0.001], [-0.029, 0.014, side * 0.003], [-0.037, 0.02, side * 0.004]], 0.0007));
    parts.push(filament("半透明体内分叉消化腺", [[-0.015, 0.002, 0.003], [0.009, 0.001, 0.003], [0.025, -0.002, 0.003]], 0.0015, dark));
  } else if (kind === 2) {
    parts.push(tapered("象鼻异足螺长梭形透明体", skin, [[-0.12, 0.055, 0], [-0.055, 0.055, 0], [0.045, 0.055, 0], [0.1, 0.058, 0]], [0.003, 0.014, 0.021, 0.011]), tapered("前端下弯的取食长吻", pale, [[0.1, 0.058, 0], [0.135, 0.055, 0], [0.15, 0.027, 0]], [0.01, 0.007, 0.004]), leaf("腹面单个桨形游泳足鳍", pale, [0.015, 0.046, 0], 0.055, 0.06, [180, 0, 0]), lobe("背侧紧凑内脏核", dark, [-0.025, 0.072, 0], [0.025, 0.019, 0.022]));
    for (const side of [-1, 1]) parts.push(lobe("头后大型眼", dark, [0.07, 0.063, side * 0.013], [0.009, 0.008, 0.006]));
  } else if (kind === 3) {
    const wall = sweptProfile("火体虫群体的真正空心长管", skin, [[0.035, 0], [0.045, 0.08], [0.044, 0.36], [0.028, 0.41], [0.023, 0.41], [0.038, 0.36], [0.039, 0.08], [0.029, 0]], Math.PI * 2, 24); wall.opacity = 0.6; parts.push(wall);
    for (let row = 0; row < 7; row++) for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + row % 2 * 0.2; parts.push(lobe("共同管壁上朝外排列的被囊个员", pale, [Math.cos(a) * 0.044, 0.04 + row * 0.05, Math.sin(a) * 0.044], [0.012, 0.019, 0.012])); }
  } else {
    const shell = lobe("巨型尾海鞘黏液外房的滤食包络", pale, [0, 0.18, 0], [0.42, 0.32, 0.36]); shell.opacity = 0.16; parts.push(shell, lobe("房中央小型躯干部", skin, [0, 0.18, 0.015], [0.035, 0.026, 0.028]), tapered("房内波动的长肌尾", skin, [[0, 0.18, 0], [0.04, 0.15, 0], [-0.03, 0.105, 0], [0.045, 0.07, 0]], [0.007, 0.006, 0.0035, 0.001]));
    for (const side of [-1, 1]) {
      const intake = cap("成对的黏液房进水漏斗", skin, [side * 0.105, 0.24, 0], 0.043, 0.045, 3); intake.rotation.z = side * -70; parts.push(intake);
      for (let i = 0; i < 6; i++) parts.push(filament("黏液内滤网弧形通道", [[side * 0.12, 0.22, -0.07 + i * 0.028], [side * 0.075, 0.17, -0.085 + i * 0.034], [0, 0.18, 0.015]], 0.0012));
    }
  }
  return parts;
}

function slugs(kind: number): ModelPart[] {
  const parts: ModelPart[] = [tapered("海蛞蝓长腹足及躯体", skin, [[0, 0.013, -0.065], [0, 0.017, 0], [0, 0.018, 0.06]], [0.003, 0.018, 0.016])];
  if (kind === 0) {
    const hood = cap("狮鬃海蛞蝓前方可扩张的捕食口兜", pale, [0, 0.035, 0.077], 0.037, 0.025, 3); hood.rotation.x = 70; parts.push(hood);
    for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8; const root: Triple = [Math.cos(a) * 0.035, 0.035 + Math.sin(a) * 0.031, 0.1]; parts.push(needle("口兜边缘短感觉须", pale, root, [root[0] * 1.16, 0.035 + Math.sin(a) * 0.039, 0.108], 0.0015)); }
    for (const side of [-1, 1]) for (let i = 0; i < 5; i++) parts.push(lobe("沿身体两侧的扁桨状背突", pale, [side * 0.026, 0.036, -0.045 + i * 0.02], [0.03, 0.034, 0.011], [0, 0, side * 28]));
  } else {
    for (const side of [-1, 1]) {
      parts.push(tapered("头部有鞘嗅角", pale, [[side * 0.01, 0.026, 0.052], [side * 0.012, 0.052, 0.057]], [0.004, 0.001]));
      for (let i = 0; i < 5; i++) { const root: Triple = [side * 0.012, 0.022, -0.043 + i * 0.02]; const top: Triple = [side * 0.033, 0.065 - i * 0.004, root[2]]; parts.push(filament("树状海蛞蝓背突主枝", [root, top], 0.003)); for (let j = 0; j < 3; j++) parts.push(filament("背突上相互分离的二级分枝", [[root[0] * 0.4 + top[0] * 0.6, root[1] * 0.4 + top[1] * 0.6, root[2]], [top[0] + side * 0.01, top[1] + j * 0.004, top[2] + (j - 1) * 0.011]], 0.0013)); }
    }
  }
  return parts;
}

function worms(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  if (kind === 0) {
    parts.push(lobe("海鼠短宽椭圆躯体", skin, [0, 0.022, 0], [0.075, 0.045, 0.13]));
    for (let row = 0; row < 4; row++) { const bristles: ModelPart[] = []; for (let i = 0; i < 18; i++) { const a = i * Math.PI / 9, r = 0.5 + row * 0.13; const start: Triple = [Math.cos(a) * 0.028 * r, 0.023, Math.sin(a) * 0.052 * r]; bristles.push(needle("海鼠密集侧向刚毛", pale, start, [start[0] * 1.65, 0.01 + row * 0.002, start[2] * 1.3], 0.001)); } parts.push(combineMeshes("海鼠侧缘独立刚毛束", pale, bristles)); }
    for (let i = 0; i < 7; i++) parts.push(lobe("背侧重叠鳞片", dark, [0, 0.038, -0.045 + i * 0.015], [0.06, 0.009, 0.025]));
  } else if (kind === 1) {
    parts.push(tapered("浮蚕透明的细长体轴", skin, [[0, 0.015, -0.07], [0.005, 0.017, 0], [0, 0.018, 0.065]], [0.002, 0.006, 0.009]));
    for (const side of [-1, 1]) { parts.push(filament("头端长触须", [[side * 0.004, 0.018, 0.06], [side * 0.035, 0.018, 0.09]], 0.001)); for (let i = 0; i < 12; i++) { const z = -0.06 + i * 0.01, x = side * (0.012 + Math.sin(i / 12 * Math.PI) * 0.012); const root: Triple = [0, 0.016, z]; parts.push(beam("浮蚕侧足共同基柄", skin, root, [x, 0.016, z], 0.0025), combineMeshes("侧足末端二裂的游泳桨叶", pale, [-1, 1].map(turn => leaf("二裂桨叶", pale, [x, 0.016, z], 0.009, 0.016, [80, side * 90 + turn * 26, 0])))); } }
  } else if (kind === 2) {
    parts.push(tapered("圣诞树管虫外露钙质管", skin, [[0, 0.005, 0], [0, 0.035, 0], [0.005, 0.05, 0]], [0.006, 0.005, 0.004]));
    for (const side of [-1, 1]) {
      const path: Triple[] = Array.from({ length: 25 }, (_, i) => { const a = i / 24 * Math.PI * 5, r = 0.018 * (1 - i / 26); return [side * 0.017 + Math.cos(a) * r, 0.05 + i * 0.002, Math.sin(a) * r]; });
      parts.push(filament("两枚连续螺旋状鳃冠的中轴", path, 0.0013));
      const plumes = path.slice(0, -1).flatMap((p, i) => { const a = i / 24 * Math.PI * 5; return [-1, 1].map(turn => needle("螺旋轴上的放射羽枝", pale, p, [p[0] + Math.cos(a + turn * 0.5) * (0.012 - i * 0.00035), p[1] + 0.002, p[2] + Math.sin(a + turn * 0.5) * (0.012 - i * 0.00035)], 0.001)); });
      parts.push(combineMeshes("每枚螺旋冠两侧的分离鳃羽", pale, plumes));
    }
  } else if (kind === 3) {
    parts.push(tapered("毛翼虫前中后三个分区的体轴", skin, [[0, 0.013, -0.09], [0, 0.015, -0.025], [0, 0.02, 0.025], [0, 0.019, 0.07]], [0.003, 0.008, 0.013, 0.008]));
    for (let i = 0; i < 3; i++) parts.push(lobe("中区三个泵水扇形扩张足", pale, [0, 0.025, -0.018 + i * 0.022], [0.05, 0.034, 0.012]));
    for (const side of [-1, 1]) { parts.push(leaf("前区取食用翅状侧足", pale, [side * 0.006, 0.022, 0.04], 0.025, 0.043, [25, side * 60, -side * 35]), filament("长口须", [[side * 0.005, 0.022, 0.066], [side * 0.018, 0.02, 0.12]], 0.001)); for (let i = 0; i < 8; i++) parts.push(needle("后区分节短侧足", pale, [side * 0.004, 0.013, -0.08 + i * 0.007], [side * 0.013, 0.012, -0.083 + i * 0.007], 0.002)); }
  } else if (kind === 4) {
    parts.push(tapered("星虫未分节的囊状躯干", skin, [[0, 0.02, -0.07], [0, 0.02, -0.02], [0, 0.02, 0.025]], [0.004, 0.02, 0.012]), tapered("可伸缩细长吻部", pale, [[0, 0.02, 0.02], [0.012, 0.026, 0.07], [0.018, 0.04, 0.09]], [0.009, 0.006, 0.004]));
    for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; parts.push(needle("口端环列短触手", pale, [0.018, 0.04, 0.09], [0.018 + Math.cos(a) * 0.012, 0.04 + Math.sin(a) * 0.012, 0.1], 0.0013)); }
  } else if (kind === 5) {
    parts.push(tapered("鳃曳虫圆筒形皱褶躯干", skin, [[0, 0.018, -0.06], [0, 0.02, 0.025], [0, 0.02, 0.055]], [0.013, 0.019, 0.015]), lobe("前端外翻的棘状吻部", pale, [0, 0.02, 0.076], [0.038, 0.038, 0.035]));
    for (let i = 0; i < 18; i++) { const a = i * Math.PI * 2 / 9, z = 0.063 + Math.floor(i / 9) * 0.013; parts.push(needle("吻部环列向后角质棘", dark, [Math.cos(a) * 0.016, 0.02 + Math.sin(a) * 0.016, z], [Math.cos(a) * 0.022, 0.02 + Math.sin(a) * 0.022, z - 0.007], 0.0025)); }
    for (const side of [-1, 1]) parts.push(filament("后端尾附器", [[side * 0.006, 0.017, -0.066], [side * 0.016, 0.017, -0.09]], 0.002));
  } else {
    parts.push(lobe("叉吻螠雌体后端卵圆躯干", skin, [0, 0.022, -0.1], [0.045, 0.04, 0.07]), tapered("长而可伸展的扁平吻干", skin, [[0, 0.014, -0.075], [0.01, 0.013, 0.02], [0, 0.013, 0.18]], [0.009, 0.007, 0.005]));
    for (const side of [-1, 1]) parts.push(tapered("吻端横向分叉成T形双臂", pale, [[0, 0.013, 0.18], [side * 0.06, 0.012, 0.19], [side * 0.095, 0.013, 0.175]], [0.006, 0.005, 0.002]));
  }
  return parts;
}

function colonial(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  if (kind === 0) {
    parts.push(lobe("星海鞘贴附的薄共同被囊", skin, [0, 0.001, 0], [0.04, 0.003, 0.032]));
    for (let star = 0; star < 3; star++) { const x = (star - 1) * 0.011; const z = star % 2 * 0.008; for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; parts.push(lobe("辐射共用泄殖孔的海鞘个员", pale, [x + Math.cos(a) * 0.004, 0.0025, z + Math.sin(a) * 0.004], [0.0018, 0.002, 0.0045], [0, -a * 180 / Math.PI, 0])); } parts.push(cap("星状个员中央的共同出水孔", dark, [x, 0.002, z], 0.0015, 0.001, 3)); }
  } else if (kind === 1) {
    parts.push(tapered("帚虫的细长外管", skin, [[0, 0, 0], [0, 0.11, 0], [0.004, 0.15, 0]], [0.004, 0.0035, 0.003]), filament("马蹄形双臂总担的基部", [[-0.012, 0.16, 0.004], [-0.012, 0.15, -0.008], [0, 0.15, -0.013], [0.016, 0.15, -0.008], [0.016, 0.16, 0.004]], 0.0018));
    const crown: ModelPart[] = [];
    for (let i = 0; i < 30; i++) { const a = i / 29 * Math.PI * 1.6; const root: Triple = [Math.cos(a) * 0.014 + 0.002, 0.155, Math.sin(a) * 0.01 - 0.003]; crown.push(needle("马蹄冠两臂密列取食触手", pale, root, [root[0] * 1.45, 0.188, root[2] * 1.45], 0.001)); } parts.push(combineMeshes("马蹄总担完整取食触手冠", pale, crown));
  } else if (kind === 2) {
    const outline: [number, number][] = Array.from({ length: 24 }, (_, i) => { const a = i * Math.PI / 12; const r = 0.055 * (1 - Math.cos(a) * 0.35); return [Math.cos(a) * r, Math.sin(a) * r * 0.75]; });
    parts.push(polygon("海堇扁平肾形的群体叶盘", skin, outline, 0.009, [0, 0.008, 0]), tapered("叶盘凹侧的肉质附着柄", skin, [[0.026, 0.01, 0], [0.055, 0.008, 0], [0.067, 0.004, 0]], [0.012, 0.008, 0.003]));
    for (let i = 0; i < 18; i++) { const a = i * 2.4, r = Math.sqrt(i) * 0.01; parts.push(petals(8, [Math.cos(a) * r - 0.008, 0.019, Math.sin(a) * r * 0.7], 0.002, 0.006, 55, pale)); }
  } else if (kind === 3) {
    parts.push(tapered("伞海鳃无侧枝的修长共同柄", skin, [[0, 0, 0], [0.018, 0.4, 0], [0.012, 0.82, 0]], [0.013, 0.009, 0.006]));
    for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5; const p: Triple = [0.012 + Math.cos(a) * 0.045, 0.84 + i % 2 * 0.025, Math.sin(a) * 0.045]; parts.push(beam("伞顶共同柄分出的个员梗", skin, [0.012, 0.8, 0], p, 0.007), tapered("伞顶大型珊瑚个员", skin, [p, [p[0], p[1] + 0.055, p[2]]], [0.012, 0.009]), petals(8, [p[0], p[1] + 0.055, p[2]], 0.008, 0.047, 65, pale)); }
  } else if (kind === 4) {
    for (let row = 0; row < 5; row++) for (let i = 0; i < 5; i++) { const x = (row - 2) * 0.023, z = (i - 2) * 0.023, h = 0.1 + (row + i) % 3 * 0.016; const p = sweptProfile("笙珊瑚贯通竖直石灰骨管", skin, [[0.0065, 0], [0.0065, h], [0.0045, h], [0.0045, 0]], Math.PI * 2, 12); p.position.x = x; p.position.z = z; parts.push(p, petals(8, [x, h, z], 0.003, 0.014, 65, pale)); }
    for (let i = 0; i < 3; i++) parts.push(polygon("相邻管之间连续的水平连接台板", dark, [[-0.055, -0.055], [0.055, -0.055], [0.055, 0.055], [-0.055, 0.055]], 0.003, [0, 0.022 + i * 0.027, 0]));
  } else {
    parts.push(lobe("帆水母扁卵形气浮盘", skin, [0, 0.025, 0], [0.075, 0.01, 0.045]), lobe("气浮盘的同心中央气室", pale, [0, 0.028, 0], [0.049, 0.008, 0.028]));
    const sail = polygon("斜跨气浮盘的三角薄帆", pale, [[-0.024, 0], [0.016, 0.027], [0.026, 0]], 0.0015, [0, 0.028, 0]); sail.rotation = { x: -90, y: 0, z: -25 }; sail.opacity = 0.6; parts.push(sail);
    for (let i = 0; i < 18; i++) { const a = i * Math.PI / 9; const x = Math.cos(a) * 0.027, z = Math.sin(a) * 0.014; parts.push(filament("气浮盘腹侧的短捕食个员", [[x, 0.023, z], [x * 1.1, 0.009, z * 1.1], [x * 0.95, 0, z]], 0.001)); }
  }
  return parts;
}

const driftingNames = [["venusGirdle", "带形栉水母", "Cestum veneris"], ["phylliroe", "鱼形海蛞蝓", "Phylliroe bucephala"], ["pterotrachea", "象鼻异足螺", "Pterotrachea"], ["pyrosome", "火体虫", "Pyrosoma atlanticum"], ["giantLarvacean", "巨型尾海鞘", "Bathochordaeus"]];
const slugNames = [["lionNudibranch", "狮鬃海蛞蝓", "Melibe leonina"], ["dendronotus", "树状海蛞蝓", "Dendronotus"]];
const wormNames = [["seaMouse", "海鼠", "Aphrodita aculeata"], ["tomopteris", "浮蚕", "Tomopteris"], ["christmasTreeWorm", "圣诞树管虫", "Spirobranchus giganteus"], ["chaetopterus", "毛翼虫", "Chaetopterus"], ["peanutWorm", "星虫", "Sipunculus"], ["priapulus", "鳃曳虫", "Priapulus caudatus"], ["bonellia", "叉吻螠", "Bonellia viridis"]];
const colonyNames = [["starTunicate", "星海鞘", "Botryllus schlosseri"], ["horseshoeWorm", "帚虫", "Phoronis"], ["seaPansy", "海堇", "Renilla reniformis"], ["umbrellaSeaPen", "伞海鳃", "Umbellula"], ["organPipeCoral", "笙珊瑚", "Tubipora musica"], ["velella", "帆水母", "Velella velella"]];

export const softSeaLifeDesigns: MasterNatureDesign[] = [
  ...driftingNames.map(([key, name, taxon], i) => design(key!, name!, "动物", () => drifting(i), ["海洋生物", taxon!])),
  ...slugNames.map(([key, name, taxon], i) => design(key!, name!, "动物", () => slugs(i), ["海洋生物", taxon!])),
  ...wormNames.map(([key, name, taxon], i) => design(key!, name!, "动物", () => worms(i), ["海洋生物", taxon!])),
  ...colonyNames.map(([key, name, taxon], i) => design(key!, name!, "动物", () => colonial(i), ["海洋生物", taxon!])),
];
