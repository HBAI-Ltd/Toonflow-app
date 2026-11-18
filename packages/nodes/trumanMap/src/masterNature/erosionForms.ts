import { design, lobe, part, polygon, sweptProfile } from "./shared";
import type { MasterNatureDesign, ModelPart } from "./shared";

const limestone = "#b9b9a1";
const rock = "#9ba58f";
const ice = "#d0d9ca";

function karren(): ModelPart[] {
  const parts: ModelPart[] = [polygon("石灰岩溶沟下面真正连续的母岩底板", rock, [[-0.91, -0.88], [-0.91, 0.86], [0.92, 0.9], [0.92, -0.9]], 0.055)];
  for (let fin = 0; fin < 9; fin++) { const x = (fin - 4) * 0.19, h = 0.32 + Math.sin(fin * 1.4) * 0.045, p = part("石灰岩被平行溶沟切分而顶缘锐利的连续岩鳍", "extrude", limestone, [x, 0.035, 0], [1, 1, 1], [0, fin % 2 ? 2 : -2, 0], { profile: [{ x: -0.105, y: 0 }, { x: -0.08, y: 0.08 }, { x: -0.026, y: h * 0.84 }, { x: -0.002, y: h }, { x: 0.019, y: h * 0.82 }, { x: 0.082, y: 0.09 }, { x: 0.105, y: 0 }], depth: 1.7 }); parts.push(p); } return parts;
}

function riverPothole(): ModelPart[] {
  const outline: [number, number][] = [[-0.66, -0.55], [-0.61, 0.58], [0.62, 0.61], [0.69, -0.52]], hole: [number, number][] = Array.from({ length: 28 }, (_, i) => { const a = i * Math.PI / 14; return [Math.cos(a) * 0.258, 0.01 + Math.sin(a) * 0.24]; });
  return [polygon("河床壶穴由旋磨形成且具有真正圆形深腔的岩体", rock, outline, 0.52, [0, 0.04, 0], [hole]), polygon("河床壶穴真正封闭而非贯通地板的盲孔底", limestone, outline, 0.07), lobe("壶穴底部用于旋磨的完整圆砾", limestone, [-0.045, 0.135, 0.016], [0.23, 0.14, 0.19]), lobe("壶穴底部的较小旋磨砾", rock, [0.105, 0.104, -0.055], [0.11, 0.075, 0.12])];
}

function collapseSinkhole(): ModelPart[] {
  const outline: [number, number][] = [[-3.1, -2.65], [-3.3, 2.55], [3.2, 2.7], [3.35, -2.6]], parts: ModelPart[] = [polygon("崩塌陷穴底部真实封闭的沉积岩盘", rock, outline, 0.11)];
  for (let layer = 0; layer < 5; layer++) { const radius = 1.28 + layer * 0.105, hole: [number, number][] = Array.from({ length: 32 }, (_, i) => { const a = i * Math.PI / 16, r = radius * (1 + Math.sin(a * 7 + layer * 0.2) * 0.035); return [Math.cos(a) * r, Math.sin(a) * r * 0.91]; }); parts.push(polygon("崩塌陷穴有近竖直壁且层理相接的空心基岩层", layer % 2 ? limestone : rock, outline, 0.53, [0, 0.09 + layer * 0.53, 0], [hole])); }
  parts.push(lobe("崩塌陷穴底部脱落而仍受岩底支撑的角状落石", limestone, [0.42, 0.29, 0.17], [0.65, 0.38, 0.59]), lobe("崩塌陷穴底部较小的崩落岩块", rock, [-0.29, 0.22, -0.32], [0.49, 0.26, 0.45])); return parts;
}

function dreikanter(): ModelPart[] {
  const points = [{ x: -0.16, y: 0, z: -0.12 }, { x: 0.14, y: 0, z: -0.12 }, { x: 0.17, y: 0, z: 0.10 }, { x: -0.11, y: 0, z: 0.13 }, { x: -0.035, y: 0.16, z: -0.06 }, { x: 0.018, y: 0.13, z: 0.095 }];
  const faces = [0, 1, 2, 0, 2, 3, 0, 4, 1, 0, 3, 4, 3, 5, 4, 1, 4, 2, 2, 4, 5, 2, 5, 3];
  return [part("三棱风棱石风磨平面交会而成的硬脊与底面", "mesh", rock, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices: faces.map(index => ({ ...points[index]! })), indices: faces.map((_index, i) => i) })];
}

function exfoliationDome(): ModelPart[] {
  const parts: ModelPart[] = [];
  for (let sheet = 0; sheet < 4; sheet++) { const radius = 1.65 - sheet * 0.18, profile: [number, number][] = [];
    for (let i = 0; i <= 8; i++) { const a = i * Math.PI / 16; profile.push([Math.cos(a) * radius, Math.sin(a) * radius * 0.78]); }
    for (let i = 8; i >= 0; i--) { const a = i * Math.PI / 16; profile.push([Math.cos(a) * (radius - 0.12), Math.sin(a) * (radius - 0.12) * 0.78]); }
    const p = sweptProfile("剥蚀穹丘由卸压真实剥离而前缘露出的弧形花岗岩板", limestone, profile, Math.PI * (1.62 + sheet * 0.045), 24); p.rotation.y = sheet * 4; parts.push(p); }
  return parts;
}

function rocheMoutonnee(): ModelPart[] {
  const parts: ModelPart[] = [polygon("羊背石纵向冰蚀槽下面连通的基岩底盘", rock, [[-2, -1.17], [-2, 1.17], [1.73, 1.17], [1.73, -1.17]], 0.13)], profile = [{ x: -1.98, y: 0 }, { x: -1.8, y: 0.2 }, { x: -1.26, y: 0.48 }, { x: -0.6, y: 0.87 }, { x: 0.1, y: 1.13 }, { x: 0.71, y: 1.27 }, { x: 1.03, y: 1.18 }, { x: 1.05, y: 0.88 }, { x: 1.39, y: 0.86 }, { x: 1.33, y: 0.52 }, { x: 1.61, y: 0.5 }, { x: 1.72, y: 0 }];
  for (let section = 0; section < 10; section++) { const h = 1 - Math.abs(section - 4.5) * 0.035; parts.push(part("羊背石迎冰面平缓磨光而背冰面陡峭拔蚀的连续岩带", "extrude", limestone, [0, 0.09, (section - 4.5) * 0.232], [1, h, 1], [0, 0, 0], { depth: 0.222, profile })); } return parts;
}

function penitentes(): ModelPart[] {
  const parts: ModelPart[] = [polygon("忏悔者雪刃场底部彼此连通的硬雪底层", ice, [[-0.64, -0.82], [-0.64, 0.82], [0.64, 0.82], [0.64, -0.82]], 0.085)];
  for (let row = 0; row < 3; row++) for (let blade = 0; blade < 4; blade++) { const h = 1.1 + Math.sin(row * 1.7 + blade) * 0.25; parts.push(part("忏悔者雪刃同时朝一个方向倾斜的真实薄片尖脊", "extrude", ice, [(blade - 1.5) * 0.295, 0.055, (row - 1) * 0.53], [1, 1, 1], [0, 0, 0], { depth: 0.47, profile: [{ x: -0.13, y: 0 }, { x: -0.074, y: h * 0.49 }, { x: -0.005, y: h * 0.87 }, { x: 0.09, y: h }, { x: 0.061, y: h * 0.55 }, { x: 0.13, y: 0 }] })); } return parts;
}

export const erosionFormDesigns: MasterNatureDesign[] = [
  design("karrenFlutes", "石灰岩溶沟", "岩石", karren, ["Rillenkarren", "连续锐岩鳍之间的真实平行深溶沟"]),
  design("riverPothole", "河床旋磨壶穴", "岩石", riverPothole, ["Fluvial pothole", "封底盲孔与底部完整旋磨砾"]),
  design("collapseSinkhole", "崩塌陷穴", "岩石", collapseSinkhole, ["Collapse sinkhole", "真实竖壁空腔闭底与层理崩落块"]),
  design("dreikanter", "三棱风棱石", "岩石", dreikanter, ["Dreikanter ventifact", "风磨硬平面与真实交会锐棱"]),
  design("exfoliationDome", "剥蚀穹丘", "岩石", exfoliationDome, ["Exfoliation dome", "沿穹体表面真实剥离的弧状板层"]),
  design("rocheMoutonnee", "冰川羊背石", "岩石", rocheMoutonnee, ["Roche moutonnee", "平缓迎冰面陡拔蚀背面与真纵向槽"]),
  design("penitentes", "忏悔者雪刃", "岩石", penitentes, ["Penitentes", "共同雪基上同向倾斜的薄刃与沟槽"]),
];
