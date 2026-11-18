import { combineMeshes, design, lobe, sweptProfile, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { lump, pointed } from "./insectForms";

const pale = "#d0c9ae";
const ochre = "#aaa082";
const dark = "#727467";

function carbonBall(): ModelPart[] {
  const parts: ModelPart[] = [];
  for (let layer = 0; layer < 7; layer++) {
    const radius = 0.026 - layer * 0.0033, inner = radius - 0.0029, profile: [number, number][] = [];
    for (let i = 0; i <= 8; i++) { const a = -Math.PI / 2 + i * Math.PI / 8; profile.push([Math.cos(a) * radius, 0.019 + Math.sin(a) * radius * 0.72]); }
    for (let i = 8; i >= 0; i--) { const a = -Math.PI / 2 + i * Math.PI / 8; profile.push([Math.cos(a) * inner, 0.019 + Math.sin(a) * inner * 0.72]); }
    parts.push(sweptProfile("炭团菌剖开观察窗内相继包围的实体同心层", layer % 2 ? pale : dark, profile, Math.PI * 1.65, 20));
  }
  parts.push(lobe("炭团菌同心层包围的致密中心", dark, [0, 0.019, 0], [0.009, 0.0065, 0.009])); return parts;
}

function dyeball(): ModelPart[] {
  const shell = sweptProfile("豆马勃梨形薄外壳与自然裂开的观察口", ochre, [[0.009, 0], [0.016, 0.019], [0.027, 0.047], [0.024, 0.071], [0.012, 0.082], [0, 0.084], [0, 0.082], [0.011, 0.08], [0.022, 0.07], [0.025, 0.047], [0.014, 0.02], [0.007, 0]], Math.PI * 1.66, 24), parts: ModelPart[] = [shell, tapered("豆马勃坚实而不埋入地表的无孢子基部", dark, [[0, 0, 0], [0, 0.025, 0], [0, 0.043, 0]], [0.008, 0.013, 0.011])], packets: ModelPart[] = [];
  for (let row = 0; row < 9; row++) { const y = 0.037 + row * 0.0046, radius = 0.022 * Math.sqrt(Math.max(0.14, 1 - ((y - 0.054) / 0.032) ** 2));
    for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6 + row * 0.19; packets.push(lump("豆马勃内部真正独立的卵圆形孢子小包", [Math.cos(a) * radius * 0.82, y, Math.sin(a) * radius * 0.82], [0.0045, 0.005, 0.004], row > 5 ? dark : pale)); }
  }
  for (let i = 0; i < packets.length; i += 36) parts.push(combineMeshes("豆马勃由大量独立孢子小包组成的真马赛克内层", ochre, packets.slice(i, i + 36))); return parts;
}

function slimyStalk(): ModelPart[] {
  const parts: ModelPart[] = [], cords: ModelPart[] = [];
  for (let cord = 0; cord < 9; cord++) { const path: Triple[] = Array.from({ length: 10 }, (_, row) => { const a = cord * Math.PI * 2 / 9 + row * 0.67, radius = 0.0045 + Math.sin(row / 9 * Math.PI) * 0.0013; return [Math.cos(a) * radius, row * 0.0039, Math.sin(a) * radius]; }); cords.push(tapered("缘口菌紧贴缠绕形成实心束绳柄的粗菌索", ochre, path, path.map(() => 0.0018))); }
  for (let i = 0; i < cords.length; i += 3) parts.push(combineMeshes("缘口菌多条相接而非空心笼架的束绳柄", ochre, cords.slice(i, i + 3)));
  parts.push(sweptProfile("缘口菌顶端球囊与真正贯通的隆起孢子口", "#b2a08c", [[0, 0.034], [0.006, 0.035], [0.0105, 0.041], [0.0108, 0.047], [0.007, 0.053], [0.003, 0.055], [0.003, 0.057], [0.0019, 0.057], [0.0019, 0.054], [0.0055, 0.051], [0.009, 0.046], [0.0085, 0.041], [0.004, 0.037], [0, 0.037]], Math.PI * 2, 24));
  const seams: ModelPart[] = [];
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; seams.push(tapered("缘口菌孢子口周围短缝线状实际隆脊", "#a49181", [[Math.cos(a) * 0.0018, 0.057, Math.sin(a) * 0.0018], [Math.cos(a) * 0.0041, 0.0555, Math.sin(a) * 0.0041]], [0.0005, 0.0004])); }
  parts.push(combineMeshes("缘口菌像缝线疤痕的隆起口缘", "#a49181", seams));
  const gel = sweptProfile("缘口菌球囊外半透明胶质覆层", "#c0ad9b", [[0.004, 0.035], [0.009, 0.037], [0.012, 0.043], [0.0115, 0.049], [0.006, 0.054], [0.0055, 0.052], [0.010, 0.048], [0.0104, 0.043], [0.008, 0.039]], Math.PI * 2, 20); gel.opacity = 0.42; gel.roughness = 0.25; parts.push(gel); return parts;
}

function desertStilt(): ModelPart[] {
  const parts: ModelPart[] = [sweptProfile("高柄灰球菌长而木质的中空菌柄", ochre, [[0.007, 0], [0.005, 0.09], [0.0058, 0.19], [0.0035, 0.19], [0.003, 0.09], [0.004, 0]], Math.PI * 2, 16), sweptProfile("高柄灰球菌扁底而凸顶的外露孢子头", "#a2997f", [[0, 0.186], [0.025, 0.186], [0.031, 0.191], [0.026, 0.202], [0.012, 0.21], [0, 0.211]], Math.PI * 2, 24)];
  const scales: ModelPart[] = [];
  for (let i = 0; i < 28; i++) { const a = i * 2.4, y = 0.011 + i % 14 * 0.012, r = 0.0053; scales.push(pointed("高柄灰球菌长柄上向外撕起的纤维鳞片", pale, [[Math.cos(a) * r, y, Math.sin(a) * r], [Math.cos(a) * 0.009, y - 0.009, Math.sin(a) * 0.009]], [0.001, 0])); }
  parts.push(combineMeshes("高柄灰球菌真实起翘的柄部纤维鳞片", pale, scales), sweptProfile("高柄灰球菌地表露出的菌托上缘残片", pale, [[0.007, 0], [0.012, 0.004], [0.012, 0.011], [0.010, 0.015], [0.009, 0.011], [0.010, 0.004], [0.006, 0]], Math.PI * 1.7, 16)); return parts;
}

function desertShaggy(): ModelPart[] {
  const parts: ModelPart[] = [tapered("Podaxis坚韧而有膨基的木质菌柄", ochre, [[0, 0, 0], [0.002, 0.015, 0], [0, 0.079, 0], [0, 0.144, 0]], [0.011, 0.008, 0.0045, 0.003]), sweptProfile("Podaxis下缘封接菌柄且局部开裂的狭长孢子壳", pale, [[0.004, 0.071], [0.015, 0.081], [0.019, 0.11], [0.016, 0.136], [0.008, 0.149], [0, 0.152], [0, 0.15], [0.0065, 0.147], [0.0145, 0.135], [0.017, 0.11], [0.013, 0.083], [0.003, 0.074]], Math.PI * 1.76, 24)], folds: ModelPart[] = [], scales: ModelPart[] = [];
  for (let i = 0; i < 13; i++) { const a = i * Math.PI * 2 / 13, path: Triple[] = [[Math.cos(a) * 0.005, 0.078, Math.sin(a) * 0.005], [Math.cos(a + 0.3) * 0.012, 0.10, Math.sin(a + 0.3) * 0.012], [Math.cos(a - 0.2) * 0.011, 0.129, Math.sin(a - 0.2) * 0.011], [Math.cos(a) * 0.003, 0.144, Math.sin(a) * 0.003]]; folds.push(tapered("Podaxis壳内扭曲而非整齐辐射的孢子板组织", dark, path, [0.0014, 0.0025, 0.002, 0.001])); }
  for (let i = 0; i < folds.length; i += 6) parts.push(combineMeshes("Podaxis真实纵向扭曲的内部暗色孢子组织", dark, folds.slice(i, i + 6)));
  for (let row = 0; row < 4; row++) for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5 + row * 0.27, y = 0.087 + row * 0.014, r = row === 3 ? 0.015 : 0.018; scales.push(pointed("Podaxis长孢子壳外真实撕起的粗纸片状鳞", pale, [[Math.cos(a) * r * 0.93, y + 0.005, Math.sin(a) * r * 0.93], [Math.cos(a) * (r + 0.004), y - 0.004, Math.sin(a) * (r + 0.004)]], [0.0021, 0])); }
  for (let i = 0; i < scales.length; i += 20) parts.push(combineMeshes("Podaxis长头表面起翘的鳞片", pale, scales.slice(i, i + 20))); return parts;
}

export const shelledFungusDesigns: MasterNatureDesign[] = [
  design("daldiniaConcentrica", "同心炭团菌", "植物", carbonBall, ["Daldinia concentrica", "同心层构造观察窗"]),
  design("pisolithus", "豆马勃（Pisolithus）", "植物", dyeball, ["Pisolithus arhizus", "裂口内真实独立孢子小包"]),
  design("calostoma", "朱红缘口菌", "植物", slimyStalk, ["Calostoma cinnabarinum", "束绳柄隆起口缘与胶质覆层"]),
  design("battarrea", "高柄灰球菌（Battarrea）", "植物", desertStilt, ["Battarrea phalloides", "长木质鳞柄与扁底外露孢子头"]),
  design("podaxis", "长柄灰包（Podaxis）", "植物", desertShaggy, ["Podaxis pistillaris", "长闭孢子壳与内部扭曲孢子组织"]),
];
