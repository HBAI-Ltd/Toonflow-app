import { beam, cap, combineMeshes, design, leaf, lobe, needle, petals, polygon, sweptProfile, tapered, tube } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";

const green = "#9caf8c";
const leafLight = "#b1c09c";
const rootColor = "#a6ae8d";
const bloom = "#dad5ba";

function fibrousRoots(parts: ModelPart[], at: Triple, length: number, count = 7) {
  for (let i = 0; i < count; i++) { const a = i * 2.4; parts.push(tapered("独立水生须根", rootColor, [at, [at[0] + Math.cos(a) * length * 0.12, at[1] - length * 0.55, at[2] + Math.sin(a) * length * 0.12], [at[0] + Math.cos(a) * length * 0.23, at[1] - length, at[2] + Math.sin(a) * length * 0.23]], [0.002, 0.0011, 0.0004])); }
}

function dividedLeaf(root: Triple, angle: number, length: number, pinnate: boolean): ModelPart {
  const pieces: ModelPart[] = []; const a = angle * Math.PI / 180; const end: Triple = [root[0] + Math.cos(a) * length, root[1] + length * 0.2, root[2] + Math.sin(a) * length];
  pieces.push(needle("沉水叶主轴", green, root, end, 0.002));
  for (let i = 0; i < 7; i++) for (const side of [-1, 1]) { const t = (i + 1) / 8; const r = length * (pinnate ? 0.26 : 0.13) * (1 - t * 0.65); const p: Triple = [root[0] + (end[0] - root[0]) * t, root[1] + (end[1] - root[1]) * t, root[2] + (end[2] - root[2]) * t]; pieces.push(needle("成对细裂叶片", leafLight, p, [p[0] + Math.cos(a + side * 1.1) * r, p[1] + 0.005, p[2] + Math.sin(a + side * 1.1) * r], 0.0018)); }
  return combineMeshes("完整羽裂沉水叶", leafLight, pieces);
}

function roundBlade(name: string, at: Triple, radius: number, notch: boolean, color = green): ModelPart {
  const outline: [number, number][] = Array.from({ length: 24 }, (_, i) => { const a = i * Math.PI / 12; return [Math.cos(a) * radius, Math.sin(a) * radius]; });
  if (notch) outline.splice(0, 1, [radius * 0.18, 0]);
  return polygon(name, color, outline, 0.002, at);
}

function plant(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  if (kind === 0) {
    parts.push(tube("苦草横生根茎", rootColor, [[-0.08, 0, 0], [0, 0.005, 0], [0.08, 0, 0]], 0.006));
    for (let i = 0; i < 12; i++) { const a = i * 2.4; parts.push(tapered("苦草纤维状基根", rootColor, [[0, 0, 0], [Math.cos(a) * 0.04, -0.08, Math.sin(a) * 0.04]], [0.002, 0.0005])); const strip = polygon("苦草弯曲的长带叶", green, [[-0.008, 0], [-0.013, 0.3], [-0.008, 0.75], [0, 0.83], [0.008, 0.75], [0.013, 0.3], [0.008, 0]], 0.002); strip.rotation = { x: -65 - i % 3 * 7, y: 0, z: i * 30 }; parts.push(strip); }
    parts.push(tube("雌花弯曲螺旋花柄", "#bcc7a9", Array.from({ length: 25 }, (_, i) => { const a = i * Math.PI / 4; return [Math.cos(a) * 0.014, i * 0.025, Math.sin(a) * 0.014] as Triple; }), 0.0015), petals(3, [0.014, 0.6, 0], 0.006, 0.012, 80, bloom));
  } else if (kind === 1) {
    for (let stem = 0; stem < 3; stem++) { const x = (stem - 1) * 0.045; parts.push(tapered("黑藻细长分枝茎", green, [[x, 0, 0], [x + 0.025, 0.28, 0.02], [x, 0.58, 0]], [0.004, 0.003, 0.001]));
      for (let row = 0; row < 9; row++) { const leaves: ModelPart[] = []; for (let i = 0; i < 5; i++) leaves.push(leaf("轮生线形沉水叶", leafLight, [x + Math.sin(row) * 0.015, 0.05 + row * 0.055, 0], 0.008, 0.06, [60, i * 72 + row * 17, 0], "YXZ")); parts.push(combineMeshes("单个茎节完整轮生叶", leafLight, leaves)); }
    }
    fibrousRoots(parts, [0, 0, 0], 0.07, 5);
  } else if (kind === 2) {
    parts.push(tube("金鱼藻无根柔软主轴", green, [[0, 0, 0], [0.025, 0.22, 0], [0, 0.47, 0.025]], 0.003));
    for (let row = 0; row < 8; row++) { const pieces: ModelPart[] = []; for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; const root: Triple = [0.012, row * 0.055 + 0.03, 0.01]; const fork: Triple = [root[0] + Math.cos(a) * 0.035, root[1] + 0.012, root[2] + Math.sin(a) * 0.035]; pieces.push(needle("角状叶基", green, root, fork, 0.002)); for (const side of [-1, 1]) pieces.push(needle("一次二叉刚硬叶尖", leafLight, fork, [fork[0] + Math.cos(a + side * 0.35) * 0.04, fork[1] + 0.025, fork[2] + Math.sin(a + side * 0.35) * 0.04], 0.0015)); } parts.push(combineMeshes("一个完整二叉轮生叶节", green, pieces)); }
  } else if (kind === 3) {
    parts.push(tapered("狐尾藻直立水下主茎", green, [[0, 0, 0], [0, 0.5, 0]], [0.004, 0.002]));
    for (let row = 0; row < 7; row++) for (let i = 0; i < 4; i++) parts.push(dividedLeaf([0, 0.045 + row * 0.065, 0], i * 90 + row * 10, 0.11 * (1 - row * 0.045), true));
    fibrousRoots(parts, [0, 0, 0], 0.07, 5);
  } else if (kind === 4) {
    parts.push(tube("水盾草细长水下茎", green, [[0, 0, 0], [0.015, 0.35, 0], [0, 0.65, 0.01]], 0.003));
    for (let row = 0; row < 8; row++) for (const side of [-1, 1]) { const pieces: ModelPart[] = []; const root: Triple = [0.01, 0.06 + row * 0.07, 0]; for (let ray = 0; ray < 9; ray++) { const a = side * Math.PI / 2 + (ray - 4) * Math.PI / 12; const end: Triple = [root[0] + Math.cos(a) * 0.085, root[1] + 0.015, Math.sin(a) * 0.085]; pieces.push(needle("扇状细裂叶主裂片", leafLight, root, end, 0.0018)); for (const fork of [-1, 1]) pieces.push(needle("扇裂叶末端叉尖", leafLight, [end[0] * 0.65 + root[0] * 0.35, root[1] + 0.01, end[2] * 0.65], [end[0] + fork * 0.008, end[1], end[2] + 0.006], 0.001)); } parts.push(combineMeshes("完整半圆扇形沉水叶", leafLight, pieces)); }
    parts.push(petals(6, [0, 0.66, 0.01], 0.012, 0.025, 75, bloom));
  } else if (kind === 5) {
    for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5; const blade = polygon("马达加斯加网草真实镂空叶片", leafLight, [[-0.02, 0], [-0.065, 0.12], [-0.07, 0.29], [0, 0.4], [0.07, 0.29], [0.065, 0.12], [0.02, 0]], 0.002, [0, 0.07, 0], Array.from({ length: 12 }, (_, j) => { const row = Math.floor(j / 3); const column = j % 3 - 1; const x = column * 0.034; const z = 0.11 + row * 0.054; return [[x - 0.011, z], [x + 0.011, z], [x + 0.011, z + 0.033], [x - 0.011, z + 0.033]] as [number, number][]; })); blade.rotation = { x: -32 - i % 2 * 15, y: 0, z: a * 180 / Math.PI }; parts.push(blade); }
    parts.push(lobe("网草块状根茎", rootColor, [0, 0.035, 0], [0.075, 0.07, 0.06])); fibrousRoots(parts, [0, 0, 0], 0.08);
  } else if (kind === 6) {
    const rim = sweptProfile("王莲真实直立叶缘与叶盘", green, [[0, 0], [0.78, 0], [0.8, 0.09], [0.785, 0.09], [0.765, 0.015], [0, 0.015]], Math.PI * 2, 32); parts.push(rim, tapered("叶下粗刺长柄", rootColor, [[0, 0, 0], [-0.05, -0.4, 0], [0, -0.8, 0.1]], [0.025, 0.02, 0.014]));
    for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; parts.push(beam("叶背放射粗叶脉", leafLight, [0, -0.012, 0], [Math.cos(a) * 0.74, -0.012, Math.sin(a) * 0.74], 0.012)); }
    const spikes: ModelPart[] = []; for (let i = 0; i < 24; i++) { const a = i * 2.4; const r = 0.2 + i % 4 * 0.14; spikes.push(needle("王莲叶背保护硬刺", rootColor, [Math.cos(a) * r, -0.012, Math.sin(a) * r], [Math.cos(a) * r, -0.055, Math.sin(a) * r], 0.011)); } parts.push(combineMeshes("叶背独立硬刺", rootColor, spikes));
  } else if (kind === 7) {
    parts.push(tube("水龙菱浮水根茎", green, [[-0.16, 0.02, 0], [0, 0.025, 0], [0.16, 0.02, 0]], 0.004));
    for (let ring = 0; ring < 3; ring++) { const leaves: ModelPart[] = []; const count = 6 + ring * 6; for (let i = 0; i < count; i++) { const a = i * Math.PI * 2 / count; const r = 0.04 + ring * 0.038; leaves.push(polygon("菱形镶嵌浮叶", ring === 2 ? green : leafLight, [[0, -0.027], [0.02, 0], [0, 0.027], [-0.02, 0]], 0.002, [Math.cos(a) * r, 0.03 + ring * 0.001, Math.sin(a) * r])); } parts.push(combineMeshes("一圈真实菱叶镶嵌叶序", green, leaves)); }
    parts.push(petals(4, [0, 0.045, 0], 0.012, 0.025, 80, "#d9d1ac")); fibrousRoots(parts, [0, 0.02, 0], 0.16, 6);
  } else if (kind === 8) {
    parts.push(tube("槐叶萍水平根茎", green, [[-0.12, 0.035, 0], [0, 0.035, 0], [0.12, 0.035, 0]], 0.002));
    for (let i = 0; i < 6; i++) { const x = -0.1 + i * 0.04; for (const side of [-1, 1]) { const blade = cap("槐叶萍对生舟形浮叶", leafLight, [x, 0.035, side * 0.023], 0.026, 0.013, 3); blade.scale.x = 0.7; parts.push(blade); } fibrousRoots(parts, [x, 0.035, 0], 0.08, 3); }
  } else if (kind === 9) {
    const fronds: ModelPart[] = []; for (let axis = 0; axis < 5; axis++) { const a = axis * Math.PI * 2 / 5; for (let i = 0; i < 5; i++) for (const side of [-1, 1]) fronds.push(leaf("满江红叠覆双瓣鳞叶", i % 2 ? leafLight : green, [Math.cos(a) * i * 0.011 + side * Math.sin(a) * 0.006, 0.02 + i * 0.001, Math.sin(a) * i * 0.011 + side * Math.cos(a) * 0.006], 0.009, 0.013, [65, axis * 72 + side * 60, 0])); } parts.push(combineMeshes("分叉浮水蕨完整鳞片冠", green, fronds)); fibrousRoots(parts, [0, 0.02, 0], 0.06, 9);
  } else if (kind === 10) {
    for (let i = 0; i < 10; i++) { const a = i * 36; const blade = leaf("大薸厚匙形直立叶", leafLight, [0, 0.16, 0], 0.07 + i % 3 * 0.014, 0.14 + i % 3 * 0.025, [25 + i % 3 * 19, a, 0], "YXZ"); parts.push(blade); const ribs: ModelPart[] = []; for (let j = -2; j <= 2; j++) ribs.push(needle("匙叶平行脊", green, [j * 0.01, 0, 0], [j * 0.012, 0.12, 0.01], 0.002)); const veins = combineMeshes("单片大薸叶平行隆脊", green, ribs); veins.position = { ...blade.position }; veins.rotation = { ...blade.rotation }; parts.push(veins); } fibrousRoots(parts, [0, 0.16, 0], 0.16, 12);
  } else if (kind === 11) {
    for (let i = 0; i < 7; i++) { const a = i * Math.PI * 2 / 7; const end: Triple = [Math.cos(a) * 0.1, 0.25 + i % 2 * 0.055, Math.sin(a) * 0.1]; parts.push(lobe("凤眼莲膨胀的浮囊叶柄", leafLight, [end[0] * 0.5, 0.17, end[2] * 0.5], [0.06, 0.13, 0.06]), beam("气囊到叶片短柄", green, [end[0] * 0.6, 0.2, end[2] * 0.6], end, 0.008), leaf("凤眼莲圆阔革质叶", green, end, 0.11, 0.12, [55, -i * 360 / 7, 0])); }
    parts.push(beam("凤眼莲花葶", green, [0, 0.18, 0], [0, 0.56, 0], 0.009)); for (let i = 0; i < 8; i++) { const a = i * 2.4; parts.push(petals(6, [Math.cos(a) * 0.026, 0.4 + i * 0.018, Math.sin(a) * 0.026], 0.019, 0.03, 75, "#c9c6bb")); } fibrousRoots(parts, [0, 0.14, 0], 0.22, 9);
  } else if (kind === 12) {
    for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; const root: Triple = [Math.cos(a) * 0.045, 0.23, Math.sin(a) * 0.045]; parts.push(tapered("菱角浮水叶柄", rootColor, [[0, 0.2, 0], root, [Math.cos(a) * 0.12, 0.25, Math.sin(a) * 0.12]], [0.003, 0.005, 0.003]), lobe("叶柄纺锤形气囊", leafLight, root, [0.025, 0.013, 0.025])); const outline: [number, number][] = [[0, -0.01], [-0.02, 0], [-0.027, 0.018], [-0.02, 0.02], [-0.03, 0.033], [-0.018, 0.034], [0, 0.05], [0.018, 0.034], [0.03, 0.033], [0.02, 0.02], [0.027, 0.018], [0.02, 0]]; const blade = polygon("菱角具锯齿三角形浮叶", green, outline, 0.002, [Math.cos(a) * 0.12, 0.25, Math.sin(a) * 0.12]); blade.rotation.y = -i * 30; parts.push(blade); }
    parts.push(tube("浮叶下的长茎", rootColor, [[0, 0.2, 0], [0.015, 0.03, 0], [0, 0, 0]], 0.005));
  } else if (kind === 13) {
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; parts.push(roundBlade("荇菜具缺口的浮叶", [Math.cos(a) * 0.09, 0.16, Math.sin(a) * 0.09], 0.055, true), tube("荇菜分枝浮叶柄", green, [[0, 0.08, 0], [Math.cos(a) * 0.09, 0.16, Math.sin(a) * 0.09]], 0.0025)); }
    const frills: ModelPart[] = []; for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5; const root: Triple = [Math.cos(a) * 0.005, 0.18, Math.sin(a) * 0.005]; parts.push(leaf("荇菜五枚花冠裂片", bloom, root, 0.015, 0.03, [80, -i * 72, 0])); for (let j = 0; j < 6; j++) { const r = 0.011 + j * 0.003; frills.push(needle("花冠边缘细长流苏", bloom, [Math.cos(a) * r, 0.182, Math.sin(a) * r], [Math.cos(a + 0.16) * (r + 0.008), 0.185, Math.sin(a + 0.16) * (r + 0.008)], 0.001)); } } parts.push(combineMeshes("五瓣周围真实冠毛", bloom, frills)); fibrousRoots(parts, [0, 0.08, 0], 0.08, 5);
  } else if (kind === 14) {
    for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5; const end: Triple = [Math.cos(a) * 0.15, 0.5 + i % 2 * 0.15, Math.sin(a) * 0.15]; parts.push(beam("慈姑直立三棱叶柄", green, [0, 0, 0], end, 0.008)); const blade = polygon("慈姑真实箭镞形叶", leafLight, [[0, 0.24], [-0.08, -0.07], [-0.012, 0.01], [0, -0.025], [0.012, 0.01], [0.08, -0.07]], 0.002, end); blade.rotation = { x: -60, y: 0, z: -i * 72 }; parts.push(blade); }
    parts.push(beam("慈姑花葶", green, [0, 0, 0], [0.03, 0.82, 0], 0.006)); for (let row = 0; row < 3; row++) for (let i = 0; i < 3; i++) { const a = i * Math.PI * 2 / 3; const p: Triple = [0.03 + Math.cos(a) * 0.035, 0.61 + row * 0.08, Math.sin(a) * 0.035]; parts.push(beam("轮生花梗", green, [0.03, p[1], 0], p, 0.002), petals(3, p, 0.018, 0.025, 80, bloom)); } fibrousRoots(parts, [0, 0, 0], 0.07, 6);
  } else if (kind === 15) {
    for (let i = 0; i < 6; i++) { const a = i * 60; parts.push(leaf("泽泻基生长柄卵叶", leafLight, [0, 0.05, 0], 0.1, 0.43, [20 + i % 3 * 8, a, 0])); }
    parts.push(beam("泽泻多级圆锥花序主轴", green, [0, 0, 0], [0, 0.9, 0], 0.006));
    for (let tier = 0; tier < 3; tier++) for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; const r = 0.2 - tier * 0.04; const p: Triple = [Math.cos(a) * r, 0.5 + tier * 0.15, Math.sin(a) * r]; parts.push(beam("花序轮生支轴", green, [0, 0.4 + tier * 0.15, 0], p, 0.003)); for (let j = 0; j < 2; j++) parts.push(petals(3, [p[0] + Math.sin(a) * (j ? 0.025 : -0.025), p[1] + j * 0.025, p[2] + Math.cos(a) * (j ? 0.025 : -0.025)], 0.007, 0.012, 80, bloom)); }
    fibrousRoots(parts, [0, 0, 0], 0.08, 5);
  } else if (kind === 16) {
    for (let i = 0; i < 9; i++) parts.push(leaf("花蔺三棱长剑叶", green, [0, 0.02, 0], 0.015, 0.75 + i % 3 * 0.08, [8 + i % 3 * 7, i * 40, 0]));
    parts.push(beam("花蔺独立直花葶", green, [0, 0, 0], [0, 1.1, 0], 0.009));
    for (let i = 0; i < 13; i++) { const a = i * 2.4; const p: Triple = [Math.cos(a) * 0.14, 1.16 + i % 3 * 0.025, Math.sin(a) * 0.14]; parts.push(beam("伞形花梗", green, [0, 1.1, 0], p, 0.002), petals(6, p, 0.017, 0.031, 75, "#d4cab9")); }
    fibrousRoots(parts, [0, 0, 0], 0.06, 5);
  } else if (kind === 17) {
    parts.push(beam("纸莎草三棱秆", green, [0, 0, 0], [0, 1.7, 0], 0.025));
    for (let i = 0; i < 28; i++) { const a = i * Math.PI * 2 / 28; const end: Triple = [Math.cos(a) * 0.42, 1.58 + i % 3 * 0.06, Math.sin(a) * 0.42]; parts.push(tapered("纸莎草下垂细花序支轴", green, [[0, 1.7, 0], [end[0] * 0.65, 1.83, end[2] * 0.65], end], [0.003, 0.002, 0.001])); const flowers: ModelPart[] = []; for (let j = 0; j < 4; j++) flowers.push(needle("末级小穗轴", leafLight, end, [end[0] + Math.cos(a + j) * 0.06, end[1] - 0.03, end[2] + Math.sin(a + j) * 0.06], 0.002)); parts.push(combineMeshes("末端分散小穗", leafLight, flowers)); }
    fibrousRoots(parts, [0, 0, 0], 0.1, 7);
  } else if (kind === 18) {
    parts.push(beam("旱伞草直立主秆", green, [0, 0, 0], [0, 0.9, 0], 0.012));
    for (let i = 0; i < 14; i++) parts.push(leaf("秆端水平辐射长苞叶", leafLight, [0, 0.9, 0], 0.018, 0.3, [80, i * 360 / 14, 0], "YXZ"));
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; parts.push(beam("顶生穗序短枝", green, [0, 0.91, 0], [Math.cos(a) * 0.1, 1.02, Math.sin(a) * 0.1], 0.002), lobe("伞叶中央的簇生小穗", "#c2c5a5", [Math.cos(a) * 0.1, 1.02, Math.sin(a) * 0.1], [0.025, 0.04, 0.025])); } fibrousRoots(parts, [0, 0, 0], 0.08, 7);
  } else if (kind === 19) {
    for (let i = 0; i < 15; i++) { const a = i * 2.4; const r = 0.025 + i % 3 * 0.012; const end: Triple = [Math.cos(a) * r * 1.8, 0.6 + i % 5 * 0.06, Math.sin(a) * r * 1.8]; parts.push(tapered("灯心草圆柱形无节秆", green, [[Math.cos(a) * r, 0, Math.sin(a) * r], [Math.cos(a) * r * 1.3, end[1] * 0.55, Math.sin(a) * r * 1.3], end], [0.0035, 0.003, 0.001])); if (i % 3 === 0) parts.push(lobe("秆侧偏生的褐色小花簇", "#bdba9c", [end[0] * 0.8 + 0.02, end[1] * 0.78, end[2]], [0.025, 0.022, 0.025])); }
    fibrousRoots(parts, [0, 0, 0], 0.08, 9);
  } else if (kind === 20) {
    parts.push(tube("蘋的爬行根状茎", green, [[-0.12, 0, 0], [0, 0.005, 0], [0.12, 0, 0]], 0.004));
    for (let i = 0; i < 7; i++) { const x = -0.1 + i * 0.03; const p: Triple = [x, 0.13 + i % 3 * 0.015, 0]; parts.push(beam("蘋直立细叶柄", green, [x, 0, 0], p, 0.002)); for (let j = 0; j < 4; j++) parts.push(leaf("蘋四枚扇形小叶", leafLight, p, 0.022, 0.032, [85, j * 90, 0], "YXZ")); if (i % 2 === 0) parts.push(lobe("根茎边独立孢子果", rootColor, [x + 0.01, 0.014, 0], [0.01, 0.009, 0.006])); } fibrousRoots(parts, [0, 0, 0], 0.045, 5);
  } else if (kind === 21) {
    parts.push(tube("水田芥爬行多节茎", green, [[-0.14, 0.025, 0], [-0.03, 0.08, 0], [0.1, 0.22, 0.025]], 0.004));
    for (let i = 0; i < 6; i++) { const x = -0.1 + i * 0.035; const y = 0.05 + i * 0.024; const leaves: ModelPart[] = []; for (let j = 0; j < 3; j++) for (const side of [-1, 1]) leaves.push(leaf("水田芥成对圆叶片", leafLight, [x, y + j * 0.012, 0], 0.024 + j * 0.003, 0.035, [80, side * 90, 0])); leaves.push(leaf("水田芥增大的顶生小叶", leafLight, [x, y + 0.035, 0], 0.042, 0.05, [60, 0, 0])); parts.push(combineMeshes("水田芥完整奇数羽状叶", leafLight, leaves)); }
    for (let i = 0; i < 8; i++) { const a = i * 2.4; parts.push(petals(4, [0.1 + Math.cos(a) * 0.022, 0.23 + i % 3 * 0.01, 0.025 + Math.sin(a) * 0.022], 0.005, 0.009, 80, bloom)); } fibrousRoots(parts, [-0.05, 0.035, 0], 0.065, 6);
  } else if (kind === 22) {
    for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5; const p: Triple = [Math.cos(a) * 0.32, 0.65 + i % 2 * 0.25, Math.sin(a) * 0.32]; parts.push(tapered("大叶蚁塔粗厚带刺叶柄", rootColor, [[0, 0, 0], p], [0.024, 0.014])); const outline: [number, number][] = Array.from({ length: 28 }, (_, j) => { const b = j * Math.PI / 14; const r = (0.83 + Math.cos(b * 7) * 0.17) * 0.37; return [Math.cos(b) * r, Math.sin(b) * r]; }); const blade = polygon("大叶蚁塔巨大掌裂盾叶", green, outline, 0.004, p); blade.rotation.x = -14; parts.push(blade); }
    parts.push(beam("叶间直立密花序轴", rootColor, [0, 0, 0], [0, 0.55, 0], 0.025)); for (let i = 0; i < 12; i++) parts.push(lobe("密生穗状小花簇", "#bcbda0", [Math.cos(i * 2.4) * 0.03, 0.2 + i * 0.025, Math.sin(i * 2.4) * 0.03], [0.055, 0.06, 0.055])); fibrousRoots(parts, [0, 0, 0], 0.12, 7);
  } else if (kind === 23) {
    parts.push(tube("貉藻无根的水中主轴", green, [[0, 0.02, -0.15], [0, 0.025, 0], [0.025, 0.04, 0.15]], 0.002));
    for (let row = 0; row < 7; row++) for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5; const p: Triple = [Math.cos(a) * 0.035, 0.03 + Math.sin(a) * 0.035, -0.12 + row * 0.04]; parts.push(beam("轮生陷阱叶的长柄", green, [0, 0.026, p[2]], p, 0.0015)); const lobes: ModelPart[] = []; for (const side of [-1, 1]) lobes.push(leaf("貉藻双瓣捕虫叶", leafLight, p, 0.009, 0.016, [side * 35, 90, 0])); parts.push(combineMeshes("一枚完整水下双瓣陷阱", leafLight, lobes)); }
  } else if (kind === 24) {
    for (let i = 0; i < 7; i++) { const a = i * Math.PI * 2 / 7; const x = Math.cos(a) * 0.075, z = Math.sin(a) * 0.075; parts.push(tube("莼菜黏液包被长叶柄", rootColor, [[0, 0, 0], [x * 0.5, 0.22, z * 0.5], [x, 0.4, z]], 0.003)); const blade = polygon("莼菜椭圆盾状浮叶", green, Array.from({ length: 24 }, (_, j) => [Math.cos(j * Math.PI / 12) * 0.062, Math.sin(j * Math.PI / 12) * 0.035] as [number, number]), 0.002, [x, 0.4, z]); blade.rotation.y = -i * 360 / 7; parts.push(blade); }
    parts.push(beam("莼菜单生水上花梗", green, [0, 0, 0], [0.025, 0.46, 0.015], 0.003), petals(3, [0.025, 0.46, 0.015], 0.011, 0.025, 70, "#beb1a1")); fibrousRoots(parts, [0, 0, 0], 0.06, 5);
  } else if (kind === 25) {
    for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5; const p: Triple = [Math.cos(a) * 0.15, 0.3 + i % 2 * 0.08, Math.sin(a) * 0.15]; parts.push(beam("水金棒叶柄", green, [0, 0, 0], p, 0.007), leaf("水金棒椭圆披针叶", leafLight, p, 0.08, 0.23, [45, -i * 72, 0])); }
    for (let i = 0; i < 4; i++) { const x = (i - 1.5) * 0.035; parts.push(tapered("花序下明显白色棒柄", "#d5d4b8", [[x, 0, 0.03], [x, 0.28, 0.035], [x + 0.01, 0.4, 0.04]], [0.006, 0.005, 0.004]), cap("无佛焰苞的金色肉穗花序", "#c7c194", [x + 0.01, 0.4, 0.04], 0.008, 0.085, 4)); } fibrousRoots(parts, [0, 0, 0], 0.08, 5);
  } else if (kind === 26) {
    for (let i = 0; i < 12; i++) parts.push(leaf("菖蒲基部互相套叠剑叶", green, [(i % 3 - 1) * 0.012, 0.02, 0], 0.025, 0.65 + i % 4 * 0.08, [i % 2 ? 12 : -12, 0, (i - 5.5) * 5]));
    for (const side of [-1, 1]) parts.push(tapered("叶状花葶侧生的棒状肉穗", "#bfc49f", [[side * 0.025, 0.32, 0.015], [side * 0.045, 0.44, 0.02], [side * 0.055, 0.5, 0.02]], [0.009, 0.012, 0.004])); fibrousRoots(parts, [0, 0, 0], 0.1, 7);
  } else if (kind === 27) {
    parts.push(tube("浮叶眼子菜弯曲水下茎", green, [[0, 0, 0], [0.03, 0.35, 0], [0, 0.65, 0]], 0.004));
    for (let i = 0; i < 8; i++) { const side = i % 2 ? -1 : 1; const p: Triple = [side * 0.09, 0.57 + i % 2 * 0.012, (Math.floor(i / 2) - 1.5) * 0.065]; parts.push(beam("交替的浮叶柄", green, [0, 0.54, 0], p, 0.0025), leaf("眼子菜椭圆浮叶", leafLight, p, 0.052, 0.095, [87, i * 40, 0])); }
    for (let i = 0; i < 8; i++) parts.push(leaf("水下变窄的带状叶", green, [0.01, 0.06 + i * 0.06, 0], 0.008, 0.12, [70, i * 137.5 % 360, 0]));
    parts.push(beam("出水结果穗细花梗", green, [0, 0.58, 0], [0, 0.78, 0], 0.004), tapered("密实圆柱状果穗", rootColor, [[0, 0.74, 0], [0, 0.83, 0]], [0.012, 0.007])); fibrousRoots(parts, [0, 0, 0], 0.06, 5);
  } else if (kind === 28) {
    parts.push(tube("水毛茛水下分枝茎", green, [[-0.1, 0, 0], [0, 0.18, 0], [0.08, 0.36, 0]], 0.003));
    for (let row = 0; row < 6; row++) parts.push(dividedLeaf([-0.06 + row * 0.02, 0.05 + row * 0.035, 0], row * 70, 0.09, false));
    for (let i = 0; i < 4; i++) { const p: Triple = [(i - 1.5) * 0.045, 0.34, 0.01]; parts.push(leaf("水面具深裂的肾形叶", leafLight, p, 0.055, 0.065, [85, i * 80, 0]), beam("浮水白花花柄", green, p, [p[0], 0.4 + i % 2 * 0.025, p[2]], 0.002), petals(5, [p[0], 0.4 + i % 2 * 0.025, p[2]], 0.012, 0.024, 80, bloom)); }
    fibrousRoots(parts, [-0.1, 0, 0], 0.06, 5);
  } else {
    for (let frond = 0; frond < 5; frond++) { const a = frond * Math.PI * 2 / 5; const root: Triple = [0, 0.08, 0]; const end: Triple = [Math.cos(a) * 0.15, 0.35 + frond % 2 * 0.08, Math.sin(a) * 0.15]; parts.push(beam("水蕨柔嫩粗叶轴", green, root, end, 0.007)); const lobes: ModelPart[] = []; for (let row = 0; row < 6; row++) for (const side of [-1, 1]) { const t = (row + 1) / 7; const p: Triple = [end[0] * t, 0.08 + (end[1] - 0.08) * t, end[2] * t]; for (let fork = 0; fork < 3; fork++) lobes.push(leaf("水蕨宽裂不育叶小裂片", leafLight, p, 0.018, (0.08 - row * 0.007) * (1 - fork * 0.12), [50 + fork * 12, -frond * 72 + side * (55 + fork * 20), 0])); } parts.push(combineMeshes("一片完整宽裂不育叶", leafLight, lobes)); }
    for (let frond = 0; frond < 3; frond++) { const a = frond * Math.PI * 2 / 3; parts.push(beam("水蕨高举能育叶轴", green, [0, 0.08, 0], [Math.cos(a) * 0.05, 0.65, Math.sin(a) * 0.05], 0.005)); for (let row = 0; row < 6; row++) parts.push(dividedLeaf([Math.cos(a) * row * 0.008, 0.26 + row * 0.06, Math.sin(a) * row * 0.008], frond * 120 + row % 2 * 180, 0.13 - row * 0.013, false)); }
    fibrousRoots(parts, [0, 0.08, 0], 0.14, 7);
  }
  return parts;
}

const names = [["vallisneria", "苦草"], ["hydrilla", "黑藻"], ["coontail", "金鱼藻"], ["waterMilfoil", "狐尾藻"], ["cabomba", "水盾草"], ["lacePlant", "马达加斯加网草"], ["victoriaLily", "王莲"], ["mosaicPlant", "水龙菱"], ["salvinia", "槐叶萍"], ["azolla", "满江红"], ["waterLettuce", "大薸"], ["waterHyacinth", "凤眼莲"], ["waterChestnutPlant", "菱角植株"], ["floatingHeart", "荇菜"], ["arrowheadPlant", "慈姑植株"], ["waterPlantain", "泽泻"], ["floweringRush", "花蔺"], ["papyrus", "纸莎草"], ["umbrellaSedge", "旱伞草"], ["softRush", "灯心草"], ["marsilea", "蘋"], ["watercress", "水田芥"], ["gunnera", "大叶蚁塔"], ["waterwheelPlant", "貉藻"], ["watershield", "莼菜"], ["goldenClub", "水金棒"], ["sweetFlag", "菖蒲"], ["pondweed", "浮叶眼子菜"], ["waterCrowfoot", "水毛茛"], ["waterFern", "水蕨"]];

export const aquaticPlantDesigns: MasterNatureDesign[] = names.map(([key, name], index) => design(key!, name!, "植物", () => plant(index), ["浮水与沉水植物构造"]));
