import { Quaternion, Vector3 } from "three";
import { beam, cap, combineMeshes, design, leaf, lobe, needle, part, polygon, radialLeaves, sweptProfile, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";

const crust = "#c4b18c";
const dough = "#ddd0ae";
const cream = "#e0d8bf";
const filling = "#b3b79a";

export function strip(name: string, color: string, path: Triple[], width: number, thickness: number): ModelPart {
  const vertices: { x: number; y: number; z: number }[] = []; const indices: number[] = [];
  let previousTangent = new Vector3(0, 1, 0);
  const normal = new Vector3(1, 0, 0);
  for (let i = 0; i < path.length; i++) { const tangent = new Vector3(...path[Math.min(path.length - 1, i + 1)]!).sub(new Vector3(...path[Math.max(0, i - 1)]!)).normalize(); const q = new Quaternion().setFromUnitVectors(previousTangent, tangent);
    normal.applyQuaternion(q).normalize();
    const binormal = new Vector3().crossVectors(normal, tangent).normalize();
    for (const [x, z] of [[-width / 2, -thickness / 2], [width / 2, -thickness / 2], [width / 2, thickness / 2], [-width / 2, thickness / 2]]) { const p = normal.clone().multiplyScalar(x!).addScaledVector(binormal, z!).add(new Vector3(...path[i]!)); vertices.push({ x: p.x, y: p.y, z: p.z }); }
    previousTangent = tangent;
    if (i) for (let j = 0; j < 4; j++) { const a = (i - 1) * 4 + j, b = (i - 1) * 4 + (j + 1) % 4, c = a + 4, d = b + 4; indices.push(a, c, b, b, c, d); }
  }
  const end = (path.length - 1) * 4; indices.push(0, 1, 2, 0, 2, 3, end, end + 2, end + 1, end, end + 3, end + 2);
  return part(name, "mesh", color, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

function oval(rx: number, rz: number, count = 20): [number, number][] { return Array.from({ length: count }, (_, i) => [Math.cos(i * Math.PI * 2 / count) * rx, Math.sin(i * Math.PI * 2 / count) * rz]); }

export function hollowPipe(name: string, path: Triple[], outer: number, inner: number, arc = Math.PI * 2, startAngle = 0): ModelPart {
  const vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
  const partial = arc < Math.PI * 2 - 1e-8, count = partial ? 9 : 8, stride = count * 2;
  for (let row = 0; row < path.length; row++) {
    const tangent = new Vector3(...path[Math.min(row + 1, path.length - 1)]!).sub(new Vector3(...path[Math.max(0, row - 1)]!)).normalize(); const q = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), tangent);
    for (const radius of [outer, inner]) for (let i = 0; i < count; i++) { const a = startAngle + i / (partial ? count - 1 : count) * arc; const p = new Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius).applyQuaternion(q).add(new Vector3(...path[row]!)); vertices.push({ x: p.x, y: p.y, z: p.z }); }
    if (row) {
      for (let i = 0; i < (partial ? count - 1 : count); i++) { const a = (row - 1) * stride + i, b = (row - 1) * stride + (i + 1) % count, c = a + stride, d = b + stride; indices.push(a, c, b, b, c, d, a + count, b + count, c + count, b + count, d + count, c + count); }
      if (partial) for (const i of [0, count - 1]) { const a = (row - 1) * stride + i, b = a + stride; if (i) indices.push(a, b, a + count, a + count, b, b + count); else indices.push(a, a + count, b, a + count, b + count, b); }
    }
  }
  const end = (path.length - 1) * stride;
  for (let i = 0; i < (partial ? count - 1 : count); i++) { const j = (i + 1) % count; indices.push(i, j, i + count, j, j + count, i + count, end + i, end + i + count, end + j, end + j, end + i + count, end + j + count); }
  return part(name, "mesh", dough, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

function food(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  if (kind === 0) {
    parts.push(cap("烧麦敞口薄面皮杯", dough, [0, 0, 0], 0.028, 0.042, 3), lobe("烧麦外露的颗粒馅心", filling, [0, 0.032, 0], [0.047, 0.03, 0.047]));
    for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; parts.push(leaf("烧麦上端展开的面皮褶边", dough, [Math.cos(a) * 0.021, 0.025, Math.sin(a) * 0.021], 0.012, 0.03, [25, -i * 30, 0])); }
    const grains: ModelPart[] = []; for (let i = 0; i < 20; i++) { const a = i * 2.4; const r = Math.sqrt(i / 20) * 0.018; grains.push(lobe("烧麦馅心可见糯米粒", "#c8c6a5", [Math.cos(a) * r, 0.046, Math.sin(a) * r], [0.003, 0.003, 0.007], [0, i * 137.5 % 360, 0])); } parts.push(combineMeshes("完整糯米颗粒馅面", "#c8c6a5", grains));
  } else if (kind === 1) {
    for (const side of [-1, 1]) { const path: Triple[] = Array.from({ length: 25 }, (_, i) => { const t = i / 24, a = t * Math.PI * 3.8; const r = 0.025 * (1 - t * 0.8); return [side * 0.018 + Math.cos(a) * r, 0.018 + t * 0.045, Math.sin(a) * r]; }); parts.push(strip("花卷真实卷叠的宽面带", dough, path, 0.026, 0.006)); }
    parts.push(strip("花卷中间交叠面结", dough, [[-0.04, 0.02, 0], [0, 0.055, 0.005], [0.04, 0.02, 0]], 0.018, 0.008));
  } else if (kind === 2) {
    for (const side of [-1, 1]) parts.push(tapered("油条相互连接的长炸面条", crust, [[side * 0.012, 0.018, -0.13], [side * 0.014, 0.019, -0.06], [side * 0.012, 0.018, 0.04], [side * 0.012, 0.016, 0.13]], [0.008, 0.014, 0.014, 0.008]));
    parts.push(strip("两股油条连接的面筋脊", "#d1be96", [[0, 0.015, -0.1], [0, 0.017, 0.1]], 0.01, 0.006));
  } else if (kind === 3) {
    const wrapper = sweptProfile("春卷真实卷合的薄皮", crust, [[0.012, 0], [0.0145, 0], [0.0145, 0.11], [0.012, 0.11]], Math.PI * 1.94, 24); wrapper.rotation.x = 90; wrapper.position.y = 0.017; parts.push(wrapper);
    for (const z of [0, 0.11]) for (let i = 0; i < 4; i++) parts.push(strip("春卷两端折合的封口", dough, [[Math.cos(i * Math.PI / 2) * 0.014, 0.017 + Math.sin(i * Math.PI / 2) * 0.014, z], [0, 0.017, z + (z ? -0.006 : 0.006)]], 0.014, 0.0025));
  } else if (kind === 4) {
    const wall = sweptProfile("竹筒饭敞开的半竹筒", "#a8b38e", [[0.032, 0], [0.038, 0], [0.038, 0.25], [0.032, 0.25]], Math.PI * 1.12, 24); wall.rotation.x = 90; wall.position.y = 0.04; parts.push(wall);
    for (const z of [0, 0.25]) { const end = cap("竹节封闭的端壁", "#b9bf9c", [0, 0.04, z], 0.037, 0.008, 2); end.rotation.x = 90; parts.push(end); }
    const rice: ModelPart[] = []; for (let i = 0; i < 90; i++) rice.push(lobe("竹筒中真实的米粒", "#d8d2b2", [(i % 5 - 2) * 0.011, 0.041 + i % 3 * 0.003, 0.014 + Math.floor(i / 5) * 0.013], [0.005, 0.004, 0.01], [0, i * 137.5 % 360, 0])); for (let i = 0; i < rice.length; i += 30) parts.push(combineMeshes("竹筒中一整段米饭", "#d8d2b2", rice.slice(i, i + 30)));
  } else if (kind === 5) {
    for (let strand = 0; strand < 10; strand++) { const r = 0.025 + strand * 0.004; const path: Triple[] = Array.from({ length: 25 }, (_, i) => { const a = i / 24 * Math.PI * 1.94; return [Math.cos(a) * r, 0.009 + strand * 0.003, Math.sin(a) * r * 1.4]; }); parts.push(tapered("馓子嵌套成束的连续炸面线", crust, path, path.map(() => 0.0025))); }
    parts.push(strip("束住馓子的横向炸面带", "#d4c29b", [[-0.055, 0.018, 0], [0, 0.04, 0], [0.055, 0.018, 0]], 0.012, 0.004));
  } else if (kind === 6) {
    parts.push(sweptProfile("麻球可见内部空腔的炸壳", crust, [[0.005, 0], [0.025, 0.006], [0.035, 0.032], [0.024, 0.061], [0.005, 0.067], [0.005, 0.062], [0.02, 0.057], [0.03, 0.032], [0.021, 0.011], [0.005, 0.006]], Math.PI * 1.7, 24));
    const sesame: ModelPart[] = []; for (let i = 0; i < 70; i++) { const a = (i * 2.4) % (Math.PI * 1.7); const y = 0.008 + i % 8 * 0.007; const r = Math.sqrt(Math.max(0.0001, 0.032 ** 2 - (y - 0.033) ** 2)); sesame.push(lobe("炸壳表面附着的独立芝麻", "#ded2ad", [Math.cos(a) * r, y, Math.sin(a) * r], [0.002, 0.0035, 0.002])); } for (let i = 0; i < sesame.length; i += 35) parts.push(combineMeshes("麻球整片芝麻外壳", "#ded2ad", sesame.slice(i, i + 35)));
  } else if (kind === 7) {
    const holes: [number, number][][] = Array.from({ length: 12 }, (_, i) => { const x = (i % 4 - 1.5) * 0.022, z = (Math.floor(i / 4) - 1) * 0.022; return Array.from({ length: 7 }, (_, j) => { const a = j * Math.PI * 2 / 7; return [x + Math.cos(a) * (0.006 + i % 3 * 0.001), z + Math.sin(a) * (0.005 + i % 2 * 0.002)]; }) as [number, number][]; });
    parts.push(polygon("蜂窝糖不规则脆糖壁与真实气孔", "#c7b185", [[-0.051, -0.04], [0.04, -0.044], [0.058, -0.018], [0.05, 0.037], [0.016, 0.046], [-0.055, 0.032]], 0.023, [0, 0, 0], holes));
  } else if (kind === 8) {
    for (let row = 0; row < 18; row++) { const path: Triple[] = Array.from({ length: 25 }, (_, i) => [(-12 + i) * 0.0046, 0.006 + row % 3 * 0.001, (row - 8.5) * 0.005 + Math.sin(i * Math.PI / 2) * 0.0015]); parts.push(tapered("方便面饼中的连续压褶面条", dough, path, path.map(() => 0.0018))); }
    for (let row = 0; row < 8; row++) parts.push(tapered("面饼底部交错的面条", "#cdbd99", [[-0.047, 0.003, (row - 3.5) * 0.01], [0, 0.003, (row - 3.5) * 0.01 + 0.004], [0.047, 0.003, (row - 3.5) * 0.01]], [0.002, 0.002, 0.002]));
  } else if (kind === 9) {
    parts.push(beam("棉花糖木棒", "#c5bd9f", [0, 0, 0], [0, 0.28, 0], 0.006));
    for (let i = 0; i < 12; i++) { const a = i * 2.4; const puff = lobe("糖丝聚成的松软体积", "#d5ccc0", [Math.cos(a) * 0.035, 0.25 + i % 4 * 0.035, Math.sin(a) * 0.035], [0.1, 0.12, 0.1]); puff.opacity = 0.82; parts.push(puff); }
    for (let strand = 0; strand < 8; strand++) { const path: Triple[] = Array.from({ length: 21 }, (_, i) => { const t = i / 20, a = t * Math.PI * 3 + strand; const r = Math.sin(t * Math.PI) * 0.071; return [Math.cos(a) * r, 0.2 + t * 0.18, Math.sin(a) * r]; }); parts.push(tapered("环绕糖团的真实拉丝", "#e1d8c9", path, path.map(() => 0.001))); }
  } else if (kind === 10) {
    parts.push(lobe("龙须糖束内部坚果心", filling, [0, 0.017, 0], [0.055, 0.022, 0.029]));
    for (let strand = 0; strand < 22; strand++) { const a0 = strand * 0.25; const path: Triple[] = Array.from({ length: 17 }, (_, i) => { const a = i / 16 * Math.PI * 1.95 + a0; return [Math.cos(a) * (0.032 + strand % 3 * 0.001), 0.016 + Math.sin(a) * 0.011 + strand % 4 * 0.001, Math.sin(a) * 0.016]; }); parts.push(tapered("包住馅心的一束独立糖丝", cream, path, path.map(() => 0.0007))); }
  } else if (kind === 11) {
    for (let layer = 0; layer < 3; layer++) for (let row = 0; row < 7; row++) { const path: Triple[] = layer % 2 ? [[-0.04 + row * 0.013, 0.01 + layer * 0.012, -0.043], [-0.035 + row * 0.013, 0.014 + layer * 0.012, 0], [-0.04 + row * 0.013, 0.01 + layer * 0.012, 0.043]] : [[-0.043, 0.01 + layer * 0.012, -0.04 + row * 0.013], [0, 0.014 + layer * 0.012, -0.035 + row * 0.013], [0.043, 0.01 + layer * 0.012, -0.04 + row * 0.013]]; parts.push(tapered("沙琪玛互相粘连的蓬松炸面条", crust, path, [0.006, 0.007, 0.006])); }
    for (let i = 0; i < 9; i++) parts.push(lobe("面条间嵌入的果干", filling, [(i % 3 - 1) * 0.025, 0.047, (Math.floor(i / 3) - 1) * 0.027], [0.012, 0.009, 0.015]));
  } else if (kind >= 12 && kind <= 20) {
    const type = kind - 12;
    if (type === 0) parts.push(cap("猫耳意面凹陷的耳壳", dough, [0, 0, 0], 0.013, 0.013, 3), tapered("耳壳内侧加厚的折边", "#cbbd99", [[-0.011, 0.008, 0], [0, 0.014, -0.006], [0.011, 0.008, 0]], [0.002, 0.003, 0.002]));
    else if (type === 1) { const body = sweptProfile("贝壳意面带开口的螺壳壁", dough, [[0.003, 0], [0.012, 0.005], [0.015, 0.019], [0.009, 0.03], [0.007, 0.029], [0.012, 0.018], [0.009, 0.007], [0.003, 0.003]], Math.PI * 1.55, 20); parts.push(body); for (let i = 0; i < 8; i++) { const a = i * Math.PI * 1.5 / 7; parts.push(tapered("贝壳意面纵向凸筋", "#c8ba96", [[Math.cos(a) * 0.005, 0.002, Math.sin(a) * 0.005], [Math.cos(a) * 0.015, 0.018, Math.sin(a) * 0.015], [Math.cos(a) * 0.009, 0.03, Math.sin(a) * 0.009]], [0.001, 0.001, 0.001])); } }
    else if (type === 2) { parts.push(sweptProfile("车轮意面的完整外环", dough, [[0.011, 0], [0.015, 0], [0.015, 0.006], [0.011, 0.006]], Math.PI * 2, 20), sweptProfile("车轮意面中心轮毂孔", dough, [[0.002, 0], [0.004, 0], [0.004, 0.006], [0.002, 0.006]], Math.PI * 2, 16)); for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; parts.push(beam("轮毂与外环之间的六根实心辐条", dough, [Math.cos(a) * 0.003, 0.003, Math.sin(a) * 0.003], [Math.cos(a) * 0.013, 0.003, Math.sin(a) * 0.013], 0.003)); } }
    else if (type === 3) { const tube = sweptProfile("散热片意面贯通的短管", dough, [[0.0035, 0], [0.006, 0], [0.006, 0.025], [0.0035, 0.025]], Math.PI * 2, 16); tube.rotation.x = 90; tube.position.y = 0.008; parts.push(tube); for (let i = 0; i < 6; i++) { const rib = polygon("短管外彼此分开的散热状薄肋", dough, oval(0.009, 0.007, 10), 0.0015, [0, 0.008, i * 0.004]); rib.rotation.x = 90; parts.push(rib); } }
    else if (type === 4) { parts.push(lobe("意式薯团的长枕形实心体", dough, [0, 0.01, 0], [0.019, 0.02, 0.035])); for (let i = 0; i < 7; i++) parts.push(tapered("薯团表面压出的立体叉纹", "#cbbd98", [[-0.007, 0.01, -0.012 + i * 0.004], [0, 0.019, -0.012 + i * 0.004], [0.007, 0.01, -0.012 + i * 0.004]], [0.0008, 0.0008, 0.0008])); }
    else if (type === 5) { parts.push(sweptProfile("意式环饺包裹馅心的环形面体", dough, [[0.004, 0], [0.012, 0], [0.016, 0.009], [0.01, 0.016], [0.005, 0.008]], Math.PI * 1.85, 24)); for (const side of [-1, 1]) parts.push(strip("环饺对折后互相粘合的角", dough, [[side * 0.011, 0.008, 0.006], [side * 0.004, 0.015, 0.018], [0, 0.01, 0.021]], 0.008, 0.002)); }
    else if (type === 6) parts.push(hollowPipe("螺旋通心意面连续而真实贯通的管壁", Array.from({ length: 25 }, (_, i) => { const a = i * Math.PI * 4 / 24; return [Math.cos(a) * 0.007, i * 0.0015, Math.sin(a) * 0.007] as Triple; }), 0.0045, 0.003));
    else if (type === 7) { const path: Triple[] = Array.from({ length: 25 }, (_, i) => [(i - 12) * 0.004, 0.008 + Math.sin(i * 0.25) * 0.004, Math.sin(i * 0.3) * 0.012]); parts.push(strip("宽带意面有厚度的主面片", dough, path, 0.016, 0.0015)); for (const side of [-1, 1]) parts.push(tapered("宽带两边连续卷曲的花边", dough, path.map((p, i) => [p[0], p[1] + Math.sin(i * Math.PI / 2) * 0.003, p[2] + side * 0.009]), path.map(() => 0.0012))); }
    else parts.push(sweptProfile("意式小卷壳敞开的中槽", dough, [[0.005, 0], [0.008, 0], [0.008, 0.025], [0.005, 0.025]], Math.PI * 1.2, 20), strip("小卷壳两边捏合的面脊", "#cbbb98", [[-0.006, 0.005, 0], [-0.008, 0.007, 0.012], [-0.006, 0.005, 0.025]], 0.004, 0.002));
  } else if (kind === 21) {
    parts.push(cap("刨冰碗", "#b5c4b2", [0, 0, 0], 0.07, 0.065, 3), lobe("刨冰细碎冰屑主体", "#d5dbc8", [0, 0.075, 0], [0.13, 0.12, 0.13]));
    const shavings: ModelPart[] = []; for (let i = 0; i < 36; i++) { const a = i * 2.4; const y = 0.055 + i % 6 * 0.015; const r = 0.055 * (1 - i % 6 / 7); shavings.push(leaf("有厚薄折面的独立冰片", "#e0e1cf", [Math.cos(a) * r, y, Math.sin(a) * r], 0.023, 0.032, [65, i * 137.5 % 360, 0])); } parts.push(combineMeshes("整碗真实立体刨冰片", "#e0e1cf", shavings));
  } else if (kind === 22) {
    parts.push(beam("糖葫芦长竹签", "#bdb596", [0, 0, 0], [0, 0.34, 0], 0.003));
    for (let i = 0; i < 6; i++) { const p: Triple = [0, 0.12 + i * 0.037, 0]; parts.push(lobe("签上的完整山楂果", "#b9aa93", p, [0.033, 0.033, 0.033])); const sugar = lobe("包住山楂的透明糖衣", "#d8caa7", p, [0.037, 0.037, 0.037]); sugar.opacity = 0.32; sugar.roughness = 0.18; parts.push(sugar, radialLeaves(5, [0, p[1] + 0.014, 0], 0.003, 0.006, 80, filling)); }
  } else if (kind === 23) {
    parts.push(sweptProfile("肉派有真实内腔的高直酥壁", crust, [[0.04, 0], [0.046, 0], [0.047, 0.055], [0.04, 0.055]], Math.PI * 2, 24), lobe("肉派膨胀的酥皮顶盖", dough, [0, 0.057, 0], [0.1, 0.03, 0.1]));
    for (let i = 0; i < 18; i++) { const a = i * Math.PI / 9; parts.push(lobe("封口处逐个压实的波褶", crust, [Math.cos(a) * 0.042, 0.059, Math.sin(a) * 0.042], [0.012, 0.01, 0.012])); } parts.push(cap("派顶通气孔的厚边", "#cab996", [0, 0.069, 0], 0.009, 0.004, 3));
  } else if (kind === 24) {
    parts.push(part("方包有圆角面坯的主身", "box", crust, [0, 0.075, 0], [0.13, 0.15, 0.25]));
    for (let i = 0; i < 4; i++) parts.push(lobe("模具中挤合膨起的面包圆顶", dough, [0, 0.147, -0.09 + i * 0.06], [0.135, 0.055, 0.085]));
    for (const side of [-1, 1]) parts.push(strip("面包模成型的竖直边褶", "#b1a07f", [[side * 0.062, 0.01, -0.12], [side * 0.066, 0.13, -0.12]], 0.006, 0.004));
  } else if (kind === 25) {
    const cone = sweptProfile("多萨完整中空脆饼锥", crust, [[0.003, 0], [0.08, 0.19], [0.077, 0.19], [0.0015, 0]], Math.PI * 1.95, 28); cone.rotation.z = 72; cone.position = { x: 0, y: 0.08, z: 0 }; parts.push(cone);
    for (let i = 0; i < 6; i++) { const y = 0.03 + i * 0.025; parts.push(lobe("烘烤时鼓起的薄皮气泡", "#d6c29a", [-y * 0.9, 0.08 + y * 0.3, 0.01 + i % 2 * 0.012], [0.012, 0.004, 0.012])); }
  } else if (kind === 26) {
    parts.push(beam("库尔菲冰棒木签", "#c7bea1", [0, 0, 0], [0, 0.13, 0], 0.007));
    parts.push(part("库尔菲模制长锥形冻乳", "lathe", "#d7cbae", [0, 0.08, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0.022, y: 0 }, { x: 0.025, y: 0.008 }, { x: 0.008, y: 0.11 }, { x: 0, y: 0.12 }] }));
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; parts.push(needle("冰棒外表纵向模棱", "#c4b993", [Math.cos(a) * 0.023, 0.09, Math.sin(a) * 0.023], [Math.cos(a) * 0.008, 0.19, Math.sin(a) * 0.008], 0.002)); }
  } else if (kind === 27) {
    for (let tier = 0; tier < 7; tier++) { const count = 13 - tier * 2, r = 0.15 * (1 - tier / 7); for (let i = 0; i < count; i++) { const a = i * Math.PI * 2 / count; parts.push(lobe("泡芙塔彼此粘合的独立泡芙", crust, [Math.cos(a) * r, 0.028 + tier * 0.049, Math.sin(a) * r], [0.066, 0.061, 0.066])); } }
    for (let strand = 0; strand < 7; strand++) { const path: Triple[] = Array.from({ length: 25 }, (_, i) => { const t = i / 24, a = t * Math.PI * 6 + strand; const r = 0.17 * (1 - t); return [Math.cos(a) * r, 0.03 + t * 0.32, Math.sin(a) * r]; }); parts.push(tapered("围绕泡芙塔的连续焦糖丝", "#d6c294", path, path.map(() => 0.001))); }
  } else if (kind === 28) {
    parts.push(beam("旋转烤肉贯穿钢签", "#aab6ab", [0, 0, 0], [0, 0.62, 0], 0.009));
    for (let i = 0; i < 28; i++) { const r = 0.045 + i * 0.0022; const outline: [number, number][] = Array.from({ length: 14 }, (_, j) => { const a = j * Math.PI / 7, w = r * (1 + Math.sin(j * 2.3 + i) * 0.07); return [Math.cos(a) * w, Math.sin(a) * w]; }); parts.push(polygon("竖签上层叠交错的整片烤肉", i % 3 ? "#b9ac91" : "#cec09d", outline, 0.014, [0, 0.1 + i * 0.016, 0])); }
  } else {
    parts.push(sweptProfile("紧压茶饼中心凹窝与整饼边缘", "#a7ad8e", [[0, 0], [0.11, 0], [0.115, 0.015], [0.105, 0.033], [0.03, 0.034], [0.016, 0.022], [0, 0.022]], Math.PI * 2, 32));
    const leaves: ModelPart[] = []; for (let i = 0; i < 36; i++) { const a = i * 2.4, r = 0.025 + i % 5 * 0.016; leaves.push(leaf("紧压茶饼表层可见茶叶纤维", i % 2 ? "#b2b798" : "#929d80", [Math.cos(a) * r, 0.033, Math.sin(a) * r], 0.006, 0.023, [88, i * 137.5 % 360, 0])); } parts.push(combineMeshes("茶饼真实叶纤维表层", "#a1ab8b", leaves));
  }
  return parts;
}

const names = [["siuMai", "烧麦"], ["huaJuan", "花卷"], ["youtiao", "油条"], ["springRoll", "春卷"], ["bambooRice", "竹筒饭"], ["sanzi", "馓子"], ["sesameBall", "麻球"], ["honeycombToffee", "蜂窝糖"], ["instantNoodleCake", "方便面饼"], ["cottonCandy", "棉花糖"], ["dragonsBeardCandy", "龙须糖"], ["sachima", "沙琪玛"], ["orecchiette", "猫耳意面"], ["conchiglie", "贝壳意面"], ["rotelle", "车轮意面"], ["radiatori", "散热片意面"], ["gnocchi", "意式薯团"], ["tortellini", "意式环饺"], ["cavatappi", "螺旋通心意面"], ["mafaldine", "花边宽带意面"], ["cavatelli", "意式小卷壳面"], ["shavedIce", "刨冰"], ["tanghulu", "糖葫芦"], ["meatPie", "英式肉派"], ["pullmanLoaf", "方包"], ["dosa", "多萨脆饼"], ["kulfi", "库尔菲冰棒"], ["croquembouche", "泡芙塔"], ["doner", "旋转烤肉坯"], ["compressedTeaCake", "紧压茶饼"]];

export const shapedFoodDesigns: MasterNatureDesign[] = names.map(([key, name], index) => design(key!, name!, "食品", () => food(index), ["具有不同成形结构的食品"]));
