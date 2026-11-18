import { Euler, Quaternion, Vector3 } from "three";
import { beam, combineMeshes, design, lobe, needle, part, polygon, sweptProfile, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";

const stone = "#b7baa3";
const edge = "#d0ccb3";
const dark = "#929e8c";

function faceted(name: string, sides: number, levels: [number, number][], root: Triple, rotation: Triple = [0, 0, 0], color = stone): ModelPart {
  const vertices = levels.flatMap(([radius, y]) => Array.from({ length: sides }, (_, i) => ({ x: Math.cos(i * Math.PI * 2 / sides) * radius, y, z: Math.sin(i * Math.PI * 2 / sides) * radius })));
  const indices: number[] = [];
  for (let row = 0; row < levels.length - 1; row++) for (let i = 0; i < sides; i++) { const a = row * sides + i, b = row * sides + (i + 1) % sides, c = a + sides, d = b + sides; indices.push(a, c, b, b, c, d); }
  const bottom = vertices.length; vertices.push({ x: 0, y: levels[0]![1], z: 0 }, { x: 0, y: levels.at(-1)![1], z: 0 });
  for (let i = 0; i < sides; i++) indices.push(bottom, i, (i + 1) % sides, bottom + 1, (levels.length - 1) * sides + (i + 1) % sides, (levels.length - 1) * sides + i);
  return part(name, "mesh", color, root, [1, 1, 1], rotation, { vertices, indices });
}

function blade(name: string, outline: [number, number][], width: number, root: Triple, direction: Triple, color = stone): ModelPart {
  const p = polygon(name, color, outline, width, root);
  const angles = new Euler().setFromQuaternion(new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), new Vector3(...direction).normalize()));
  p.rotation = { x: angles.x * 180 / Math.PI, y: angles.y * 180 / Math.PI, z: angles.z * 180 / Math.PI }; return p;
}

function dodecahedron(root: Triple, radius: number): ModelPart {
  const points: Triple[] = [[2, 0, 0], [-2, 0, 0], [0, 2, 0], [0, -2, 0], [0, 0, 2], [0, 0, -2], ...Array.from({ length: 8 }, (_, i) => [i & 1 ? 1 : -1, i & 2 ? 1 : -1, i & 4 ? 1 : -1] as Triple)];
  const faces: number[] = [];
  for (const axes of [[0, 1], [0, 2], [1, 2]]) for (const s of [-1, 1]) for (const t of [-1, 1]) {
    const missing = 3 - axes[0]! - axes[1]!; const a = points.findIndex(p => p[axes[0]!] === s * 2); const c = points.findIndex(p => p[axes[1]!] === t * 2);
    const b = points.findIndex(p => p[axes[0]!] === s && p[axes[1]!] === t && p[missing] === 1); const d = points.findIndex(p => p[axes[0]!] === s && p[axes[1]!] === t && p[missing] === -1);
    for (let triangle of [[a, b, c], [a, c, d]]) { const p = new Vector3(...points[triangle[0]!]!); const q = new Vector3(...points[triangle[1]!]!); const r = new Vector3(...points[triangle[2]!]!); if (q.clone().sub(p).cross(r.clone().sub(p)).dot(p.clone().add(q).add(r)) < 0) triangle = [triangle[0]!, triangle[2]!, triangle[1]!]; faces.push(...triangle); }
  }
  return part("石榴石真实菱形十二面体", "mesh", "#b1ab99", root, [radius, radius, radius], [0, 12, 8], { vertices: points.map(([x, y, z]) => ({ x: x / 2, y: y / 2, z: z / 2 })), indices: faces });
}

function mineral(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  if (kind === 0) {
    for (let level = 0; level < 7; level++) { const r = 0.1 - level * 0.011; const y = level * 0.012; for (const side of [-1, 1]) parts.push(beam("铋晶漏斗阶梯的横边", "#b5baa6", [-r, y, side * r], [r, y, side * r], 0.009), beam("铋晶漏斗阶梯的纵边", "#c4bba8", [side * r, y, -r], [side * r, y, r], 0.009)); }
    parts.push(beam("铋晶开放漏斗的底梁", edge, [-0.016, 0.084, 0], [0.016, 0.084, 0], 0.009));
  } else if (kind === 1) {
    parts.push(faceted("萤石完整八面体主晶", 4, [[0.001, 0], [0.095, 0.11], [0.001, 0.22]], [0, 0, 0], [0, 45, 0], "#aebca6"), faceted("共生八面体小晶", 4, [[0.001, 0], [0.04, 0.05], [0.001, 0.1]], [0.065, 0.008, 0.02], [12, 45, 10], "#c0c9ad"));
  } else if (kind === 2) {
    parts.push(faceted("电气石有弧棱的三方长柱", 3, [[0.036, 0], [0.039, 0.24], [0.03, 0.29], [0.018, 0.3]], [0, 0, 0], [0, 30, 0]));
    for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; const r = 0.019 + i % 4 * 0.004; parts.push(needle("三方柱面密集纵纹", dark, [Math.cos(a) * r, 0.012, Math.sin(a) * r], [Math.cos(a) * r, 0.255, Math.sin(a) * r], 0.0012)); }
  } else if (kind === 3) {
    const crystal = faceted("绿柱石平顶六方长柱", 6, [[0.055, 0], [0.055, 0.26]], [0, 0, 0], [0, 0, 0], "#adbea7"); crystal.opacity = 0.8; parts.push(crystal);
    for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; parts.push(beam("六方柱交界的生长棱", i % 2 ? "#c0cbb2" : "#b0c0a6", [Math.cos(a) * 0.055, 0.005, Math.sin(a) * 0.055], [Math.cos(a) * 0.055, 0.26, Math.sin(a) * 0.055], 0.0015)); }
  } else if (kind === 4) {
    parts.push(faceted("刚玉桶状双锥六方晶", 6, [[0.023, 0], [0.061, 0.055], [0.071, 0.13], [0.058, 0.21], [0.023, 0.26]], [0, 0, 0], [0, 30, 0], "#b9b2a7"));
    for (let i = 0; i < 5; i++) parts.push(faceted("桶状晶面横向生长带", 6, [[0.063 + i % 2 * 0.006, 0], [0.063 + i % 2 * 0.006, 0.002]], [0, 0.067 + i * 0.027, 0], [0, 30, 0], edge));
  } else if (kind === 5) {
    for (let i = 0; i < 12; i++) { const a = i * Math.PI * 2 / 12; parts.push(blade("辉锑矿剑刃状放射晶", [[-0.007, 0], [-0.013, 0.19 + i % 3 * 0.03], [0, 0.26 + i % 3 * 0.03], [0.008, 0.2 + i % 3 * 0.03], [0.008, 0]], 0.006, [0, 0.025, 0], [Math.cos(a) * (0.3 + i % 3 * 0.3), 1, Math.sin(a) * (0.3 + i % 3 * 0.3)], "#a7afa0")); }
    parts.push(lobe("辉锑矿共生基岩", dark, [0, 0.02, 0], [0.14, 0.04, 0.13]));
  } else if (kind === 6) {
    for (let axis = 0; axis < 3; axis++) for (let row = -2; row <= 2; row++) { const a = axis * Math.PI / 3; const p: Triple = [Math.cos(a + Math.PI / 2) * row * 0.022, 0.04 + axis * 0.01, Math.sin(a + Math.PI / 2) * row * 0.022]; parts.push(beam("白铅矿六连晶网格棒", edge, [p[0] - Math.cos(a) * 0.095, p[1], p[2] - Math.sin(a) * 0.095], [p[0] + Math.cos(a) * 0.095, p[1], p[2] + Math.sin(a) * 0.095], 0.008)); }
  } else if (kind === 7) {
    parts.push(tapered("自然铜粗壮树枝主轴", "#b7ad93", [[0, 0, 0], [-0.01, 0.1, 0], [0.035, 0.22, 0]], [0.025, 0.015, 0.005]));
    for (let i = 0; i < 8; i++) { const side = i % 2 ? -1 : 1; const root: Triple = [0, 0.04 + i * 0.02, 0]; const end: Triple = [side * (0.1 - i * 0.007), root[1] + 0.055, i % 3 * 0.007]; parts.push(tapered("有棱角的铜树枝", "#b7ad93", [root, [end[0], root[1], end[2]], end], [0.009, 0.007, 0.002])); for (const tine of [-1, 1]) parts.push(tapered("铜树枝次级叉晶", "#c6b99c", [[end[0] * 0.7, root[1] + 0.02, end[2]], [end[0] + side * 0.025, root[1] + 0.045, end[2] + tine * 0.025]], [0.004, 0.001])); }
  } else if (kind === 8) {
    parts.push(lobe("自然银团块基底", "#bbc1b0", [0, 0.018, 0], [0.1, 0.04, 0.075]));
    for (let strand = 0; strand < 5; strand++) parts.push(tapered("原生银自然卷曲银丝", "#c9ccba", Array.from({ length: 25 }, (_, i) => { const t = i / 24; const a = t * Math.PI * (2.4 + strand * 0.3) + strand; const r = 0.015 + t * 0.027; return [Math.cos(a) * r + (strand - 2) * 0.012, 0.015 + t * 0.15, Math.sin(a) * r] as Triple; }), Array.from({ length: 25 }, () => 0.0025)));
  } else if (kind === 9) {
    parts.push(lobe("针铁矿附着根部", dark, [0, 0.013, 0], [0.13, 0.026, 0.1]));
    const needles: ModelPart[] = []; for (let i = 0; i < 70; i++) { const a = i * 2.4; const f = (i + 1) / 71; const end: Triple = [Math.cos(a) * 0.11 * Math.sqrt(1 - f * f), 0.02 + f * 0.16, Math.sin(a) * 0.11 * Math.sqrt(1 - f * f)]; needles.push(needle("针状矿物单晶", stone, [0, 0.016, 0], end, 0.003)); } for (let i = 0; i < needles.length; i += 35) parts.push(combineMeshes("放射生长的真实矿针", stone, needles.slice(i, i + 35)));
  } else if (kind === 10) {
    for (let i = 0; i < 7; i++) { const a = i * 2.4; parts.push(lobe("孔雀石葡萄状外表", "#a4b49a", [Math.cos(a) * 0.05, 0.025 + i % 3 * 0.015, Math.sin(a) * 0.04 - 0.03], [0.075, 0.07, 0.07])); }
    for (let ring = 0; ring < 6; ring++) { const r = 0.012 + ring * 0.008; const cross = sweptProfile("孔雀石剖面同心生长带", ring % 2 ? "#c1c8aa" : "#94a78e", [[r, 0], [r + 0.007, 0], [r + 0.007, 0.003], [r, 0.003]], Math.PI, 20); cross.rotation.x = -90; cross.position = { x: 0, y: 0.005, z: 0.025 }; parts.push(cross); }
  } else if (kind === 11) {
    for (let ring = 0; ring < 3; ring++) for (let i = 0; i < 7; i++) { const a = i * Math.PI * 2 / 7 + ring * 0.4; parts.push(blade("赤铁矿铁玫瑰薄片晶", [[-0.022, 0], [-0.03, 0.034], [0, 0.075], [0.03, 0.034], [0.022, 0]], 0.003, [Math.cos(a) * ring * 0.006, ring * 0.012, Math.sin(a) * ring * 0.006], [Math.cos(a) * (0.6 + ring * 0.4), 1 - ring * 0.2, Math.sin(a) * (0.6 + ring * 0.4)], "#a7aea0")); }
  } else if (kind === 12) {
    parts.push(lobe("重晶石基座", dark, [0, 0.015, 0], [0.14, 0.03, 0.08]));
    for (let i = 0; i < 9; i++) parts.push(blade("重晶石鸡冠形宽板晶", [[-0.028, 0], [-0.035, 0.075], [-0.015, 0.11], [0.026, 0.11], [0.035, 0.082], [0.025, 0]], 0.009, [(i - 4) * 0.013, 0.012, i % 2 * 0.013], [(i - 4) * 0.16, 1, i % 2 * 0.12], "#d1cbb2"));
  } else if (kind === 13) {
    for (const side of [-1, 1]) { const twin = blade("石膏燕尾贯穿双晶", [[-0.021, 0], [-0.023, 0.18], [0, 0.23], [0.022, 0.18], [0.02, 0]], 0.013, [0, 0, 0], [side * 0.55, 1, 0], "#ced2bc"); twin.opacity = 0.5; parts.push(twin); }
    parts.push(lobe("双晶共同附着根", stone, [0, 0.01, 0], [0.065, 0.02, 0.045]));
  } else if (kind === 14) {
    for (const side of [-1, 1]) parts.push(faceted("长石卡式贯穿双晶单体", 4, [[0.055, 0], [0.055, 0.17], [0.035, 0.21]], [side * 0.018, 0, side * 0.012], [side * 9, side * 23 + 45, side * 8], "#c2bda6"));
    parts.push(beam("长石两单晶相接的结合脊", edge, [0, 0, 0], [0, 0.21, 0], 0.006));
  } else if (kind === 15) {
    for (const side of [-1, 1]) parts.push(faceted("十字石斜交双晶长柱", 8, [[0.024, 0], [0.024, 0.21]], [0, 0.04, 0], [0, 0, side * 30], "#aaa98f"));
  } else if (kind === 16) {
    for (let i = 0; i < 4; i++) parts.push(blade("蓝晶石宽扁刀片晶", [[-0.012, 0], [-0.022, 0.18], [-0.008, 0.29 - i * 0.026], [0.018, 0.27 - i * 0.026], [0.022, 0.06], [0.012, 0]], 0.008, [(i - 1.5) * 0.02, 0, i % 2 * 0.01], [(i - 1.5) * 0.14, 1, 0], "#abb9b0"));
    for (let i = 0; i < 3; i++) parts.push(beam("解理面平行细棱", edge, [i * 0.005, 0.01, 0.013], [i * 0.005, 0.25, 0.013], 0.0013));
  } else if (kind === 17) {
    parts.push(faceted("红柱石方柱晶体", 4, [[0.065, 0], [0.065, 0.17]], [0, 0, 0], [0, 45, 0], "#b9b39b"));
    for (const yaw of [0, 90]) parts.push(part("空晶石端面的天然十字包裹体", "box", dark, [0, 0.172, 0], [0.014, 0.004, 0.09], [0, yaw, 0]));
  } else if (kind === 18) {
    parts.push(dodecahedron([0, 0.075, 0], 0.15), lobe("石榴石母岩", "#9ca88f", [0.025, 0.008, 0], [0.17, 0.027, 0.13]));
  } else {
    parts.push(faceted("金红石膝状双晶下柱", 4, [[0.022, 0], [0.022, 0.12], [0.01, 0.14]], [-0.03, 0, 0], [0, 45, -30], "#b4ad91"), faceted("金红石膝状双晶上柱", 4, [[0.022, 0], [0.022, 0.12], [0.01, 0.14]], [0.03, 0, 0], [0, 45, 30], "#b4ad91"));
    for (const side of [-1, 1]) for (let i = 0; i < 4; i++) parts.push(beam("膝状双晶纵面条纹", edge, [side * 0.025 + i * 0.003, 0.008, 0.017], [side * -0.035 + i * 0.003, 0.12, 0.017], 0.001));
  }
  return parts;
}

const names = [["bismuthHopper", "铋漏斗晶"], ["fluoriteOctahedron", "萤石八面晶"], ["tourmaline", "电气石"], ["beryl", "绿柱石"], ["corundum", "刚玉"], ["stibnite", "辉锑矿"], ["cerussiteTwin", "白铅矿网格双晶"], ["nativeCopper", "自然铜"], ["nativeSilver", "自然银"], ["goethite", "针铁矿"], ["malachite", "孔雀石"], ["hematiteRose", "赤铁矿铁玫瑰"], ["barite", "重晶石"], ["gypsumFishtail", "石膏燕尾双晶"], ["feldsparTwin", "长石卡式双晶"], ["staurolite", "十字石"], ["kyanite", "蓝晶石"], ["andalusite", "红柱石"], ["garnet", "石榴石"], ["rutileTwin", "金红石膝状双晶"]];

export const mineralFormDesigns: MasterNatureDesign[] = names.map(([key, name], index) => design(key!, name!, "岩石", () => mineral(index), ["具名矿物与结晶形态"]));
