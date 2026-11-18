import { beam, crystal, part } from "./assetModelParts";
import type { ModelPart, Triple } from "./assetModelParts";
import { basalLeaves, cap, combineMeshes, groundStones, leaf, lobe, needle } from "./natureParts";

export const rockLayouts = ["环列岩簇", "脊列岩簇", "拱连岩簇", "分叉岩簇", "阶台岩簇", "对峙岩簇", "叠垒岩簇", "旋塔岩簇", "浅滩岩簇"];
export const rockForms = ["圆棱石", "层断石", "板岩", "柱状石", "单尖晶", "孔洞石", "双峰石", "石笋", "三晶峰", "风蚀石碗"];
export const coralForms = ["鹿枝珊瑚", "扇枝珊瑚", "桌形珊瑚", "脑纹珊瑚", "管状珊瑚", "角簇珊瑚", "叶盘珊瑚"];
export const landscapeForms = ["泉池地景", "浅溪地景", "岩脊步道", "拱根地景", "苔坡地景", "沙丘地景", "冰崖地景", "红树林岸", "岩洞地景"];
export const specialLandforms = ["单线岩壁叠瀑", "双线岩壁叠瀑", "三线岩壁叠瀑", "曲溪踏石湾", "分汊芦洲溪床", "双岸倒木溪床", "阶梯温泉群", "环礁泻湖群", "山口相连泉池", "林间石圈营地", "双圈篝火营地", "旱谷倒木营地", "双根树洞", "三根苔岩洞口", "交错拱根蕨庭", "结冰溪湾", "雪丘结晶风口", "环晶水潭"];

function rockPiece(form: number, position: Triple, yaw: number): ModelPart {
  if (form === 0) return lobe("圆棱主岩", "#9ca28c", position, [1.2, 1.15, 1], [0, yaw, 0]);
  if (form === 1) return part("分层断崖块", "extrude", "#a5a18b", position, [1, 1, 1], [0, yaw, 0], { depth: 0.85, profile: [{ x: -0.6, y: -0.45 }, { x: 0.6, y: -0.45 }, { x: 0.6, y: 0.05 }, { x: 0.3, y: 0.05 }, { x: 0.3, y: 0.45 }, { x: -0.25, y: 0.62 }, { x: -0.6, y: 0.3 }] });
  if (form === 2) return part("倾斜板岩", "box", "#89978c", position, [1.35, 0.32, 1.1], [12, yaw, -9]);
  if (form === 3) return part("玄武岩柱", "cylinder", "#879487", position, [0.67, 1.45, 0.67]);
  if (form === 4) return crystal("六面长晶", "#91b4ad", position, [0.65, 0.8, 0.65]);
  if (form === 5) return part("贯穿孔洞岩", "torus", "#a5a28c", position, [1.2, 1.55, 0.75], [0, yaw, 0]);
  if (form === 6) return combineMeshes("连体双峰岩", "#a4a58f", [lobe("左峰", "#a4a58f", [position[0] - 0.25, position[1], position[2]], [0.8, 1.15, 0.8]), lobe("右峰", "#a4a58f", [position[0] + 0.25, position[1] + 0.2, position[2]], [0.75, 1.35, 0.7])]);
  if (form === 7) return needle("尖顶石笋", "#a1a38d", [position[0], position[1] - 0.5, position[2]], [position[0] + 0.13, position[1] + 0.75, position[2]], 0.8);
  if (form === 8) return combineMeshes("相连三晶峰", "#91b8b3", [-1, 0, 1].map(side => needle("晶柱", "#91b8b3", [position[0] + side * 0.2, position[1] - 0.45, position[2]], [position[0] + side * 0.3, position[1] + (side === 0 ? 0.8 : 0.35), position[2] + side * 0.1], 0.4)));
  return cap("风蚀中空石碗", "#a8a18a", [position[0], position[1] - 0.45, position[2]], 0.6, 0.85, 3);
}

export function createNatureRocks(design: number): ModelPart[] {
  const layout = Math.floor(design / 70); const count = 3 + Math.floor(design / 10) % 7; const form = design % 10;
  const parts = groundStones(8, 1.55);
  for (let index = 0; index < count; index++) {
    const t = index / Math.max(1, count - 1); const a = index * Math.PI * 2 / count; let position: Triple;
    if (layout === 0) position = [Math.cos(a) * 1.05, 0.55, Math.sin(a) * 1.05];
    else if (layout === 1) position = [(index - (count - 1) / 2) * 0.66, 0.55 + index % 2 * 0.16, index % 2 * 0.2];
    else if (layout === 2) position = [(t - 0.5) * (1.6 + count * 0.15), 0.55 + Math.sin(t * Math.PI) * 0.75, 0];
    else if (layout === 3) position = [Math.cos(index % 3 * Math.PI * 2 / 3) * (0.3 + Math.floor(index / 3) * 0.5), 0.55, Math.sin(index % 3 * Math.PI * 2 / 3) * (0.3 + Math.floor(index / 3) * 0.5)];
    else if (layout === 4) position = [(index - count / 2) * 0.5, 0.45 + index * 0.17, 0];
    else if (layout === 5) position = [index % 2 ? 0.65 : -0.65, 0.55, (Math.floor(index / 2) - count / 4) * 0.6];
    else if (layout === 6) position = [Math.cos(a) * (index < 4 ? 0.75 : 0.25), index < 4 ? 0.55 : 1.25 + Math.floor((index - 4) / 3) * 0.55, Math.sin(a) * (index < 4 ? 0.75 : 0.25)];
    else if (layout === 7) position = [Math.cos(index * 1.1) * 0.35, 0.5 + index * 0.32, Math.sin(index * 1.1) * 0.35];
    else position = [Math.cos(a) * (0.6 + index % 2 * 0.55), 0.25, Math.sin(a) * (0.6 + index % 2 * 0.55)];
    parts.push(rockPiece(form, position, index * 360 / count));
  }
  return parts;
}

export function createNatureCoral(design: number): ModelPart[] {
  const body = Math.floor(design / 60); const limbs = 3 + Math.floor(design / 10) % 6; const tips = 1 + design % 10;
  const parts = groundStones(6, 0.7);
  const ends: Triple[] = [];
  parts.push(lobe("珊瑚固着基盘", "#afac91", [0, 0.13, 0], [0.7, 0.28, 0.7]));
  for (let index = 0; index < limbs; index++) {
    const a = index * Math.PI * 2 / limbs; const end: Triple = body === 1 ? [(index - (limbs - 1) / 2) * 0.22, 1.1 + Math.sin(index / limbs * Math.PI) * 0.5, 0] : [Math.cos(a) * 0.7, body === 2 ? 0.95 : 0.8 + index % 3 * 0.18, Math.sin(a) * 0.7];
    ends.push(end);
    if (body === 3) parts.push(part("脑纹珊瑚褶环", "torus", "#b7a991", [Math.cos(a) * 0.15, 0.43 + index % 2 * 0.12, Math.sin(a) * 0.15], [0.8, 0.75, 0.3], [index * 180 / limbs, index * 360 / limbs, 0]));
    else if (body === 4) parts.push(cap("开口珊瑚管", "#aaad94", [end[0] * 0.6, 0.1, end[2] * 0.6], 0.17, end[1], 3));
    else if (body === 6) parts.push(leaf("上举叶盘珊瑚", "#aba7a0", [0, 0.2, 0], 0.6, 1.15, [45, -index * 360 / limbs, 0]));
    else {
      const joint: Triple = [end[0] * 0.45, body === 2 ? 0.9 : 0.55, end[2] * 0.45];
      parts.push(beam("珊瑚相连主枝", "#b1aa94", [0, 0.14, 0], joint, body === 5 ? 0.15 : 0.08), beam("珊瑚上部分枝", "#b7ad9b", joint, end, 0.06));
      if (body === 5) for (const side of [-1, 1]) parts.push(needle("鹿角珊瑚分叉", "#c0b099", end, [end[0] + side * Math.cos(a + Math.PI / 2) * 0.24, end[1] + 0.3, end[2] + side * Math.sin(a + Math.PI / 2) * 0.24], 0.075));
    }
  }
  for (let index = 0; index < tips; index++) {
    const start = ends[index % ends.length]!; const a = index * Math.PI * 2 / tips; const end: Triple = [start[0] + Math.cos(a) * 0.18, start[1] + 0.28, start[2] + Math.sin(a) * 0.18];
    parts.push(needle("独立珊瑚枝梢", "#c5b6a5", start, end, 0.11));
  }
  return parts;
}

export function createNatureLandscape(design: number): ModelPart[] {
  const kind = Math.floor(design / 40); const count = 2 + Math.floor(design / 8) % 5; const features = 3 + design % 8;
  const parts = [...groundStones(4, 1.7), lobe("地景土丘左", kind === 5 ? "#b8aa82" : "#8a9677", [-0.6, 0.1, 0], [2.5, 0.45, 2.8]), lobe("地景土丘右", kind === 6 ? "#bbcfc6" : "#929e7d", [0.7, 0.18, 0], [2.2, 0.6, 2.7]), lobe("地景后丘", "#92997c", [0, 0.1, -0.7], [2.6, 0.5, 1.8])];
  for (let index = 0; index < count; index++) {
    const a = index * Math.PI * 2 / count; const x = Math.cos(a); const z = Math.sin(a);
    if (kind === 0) { parts.push(cap("泉池石碗", "#a5ad94", [x, 0.18 + index * 0.07, z], 0.5, 0.4, 3), part("泉池水面", "cylinder", "#8eb4a7", [x, 0.43 + index * 0.07, z], [0.7, 0.014, 0.7], [0, 0, 0], { opacity: 0.7, roughness: 0.2 })); }
    else if (kind === 1) parts.push(part("溪间横向踏石", "box", "#adb19a", [(index - (count - 1) / 2) * 0.45, 0.28, 0], [0.4, 0.12, 0.65]), part("溪岸碎石", "box", "#969f8c", [(index - (count - 1) / 2) * 0.45, 0.25, 0.7], [0.35, 0.25, 0.3]));
    else if (kind === 2) parts.push(part("阶叠岩台", "box", "#9ca58d", [(index - count / 2) * 0.45, 0.25 + index * 0.15, 0], [0.65, 0.5 + index * 0.3, 1.2]), lobe("台上苔垫", "#859866", [(index - count / 2) * 0.45, 0.53 + index * 0.3, 0], [0.58, 0.12, 1]));
    else if (kind === 4) parts.push(lobe("相连苔坡土丘", "#929c79", [x * 0.6, 0.32 + index * 0.1, z * 0.6], [1.35, 0.7 + index * 0.15, 1.2]), leaf("丘顶独立蕨叶", "#849963", [x * 0.6, 0.55 + index * 0.15, z * 0.6], 0.3, 0.65, [40, -index * 360 / count, 0]));
    else if (kind === 3) { parts.push(beam("拱根上段", "#8b7b5e", [x, 0.25, z], [x * 0.35, 1.25, z * 0.35], 0.12), beam("相连拱根梁", "#8b7b5e", [x * 0.35, 1.25, z * 0.35], [-x, 0.22, -z], 0.1)); }
    else if (kind === 5) { parts.push(lobe("相连风积沙脊", "#bfaf84", [x * 0.5, 0.45 + index * 0.08, z * 0.5], [1.8, 0.65, 0.65], [0, index * 180 / count, 0]), part("沙脊沉积层", "box", "#ad9e78", [x * 0.55, 0.18, z * 0.55], [0.9, 0.15, 0.4])); }
    else if (kind === 6) { parts.push(needle("冰崖尖脊", "#aecbc6", [x, 0.2, z], [x * 0.65, 1.15 + index % 2 * 0.35, z * 0.65], 0.8), lobe("冰崖积雪", "#d5ded0", [x, 0.2, z], [0.9, 0.22, 0.8])); }
    else if (kind === 7) { parts.push(beam("红树林主干", "#8a795c", [x, 0.4, z], [x, 1.7, z], 0.1), lobe("红树林叶冠", "#7d9468", [x, 1.8, z], [1, 0.55, 1])); for (let root = 0; root < 3; root++) { const t = root * Math.PI * 2 / 3; parts.push(beam("离地支柱根", "#8a795c", [x, 0.8, z], [x + Math.cos(t) * 0.35, 0.1, z + Math.sin(t) * 0.35], 0.055)); } }
    else parts.push(part("岩洞拱壳", "torus", "#9ba28b", [x * 0.4, 0.8, z * 0.4], [1.5, 1.65, 0.75], [0, index * 180 / count, 0]), lobe("岩洞支脚石", "#9ba28b", [x * 0.6, 0.25, z * 0.6], [0.7, 0.7, 0.65]));
  }
  if (kind === 1) parts.push(part("浅溪水带", "box", "#89a99c", [0, 0.24, 0], [3, 0.012, 0.55], [0, 0, 0], { opacity: 0.65, roughness: 0.2 }));
  for (let index = 0; index < features; index++) { const a = index * Math.PI * 2 / features; parts.push(kind === 6 ? crystal("冰晶伴生簇", "#c0d9d0", [Math.cos(a) * 1.4, 0.4, Math.sin(a) * 1.4], [0.22, 0.3, 0.22]) : leaf("地景独立蕨叶", "#839a67", [Math.cos(a) * 1.3, 0.22, Math.sin(a) * 1.3], 0.2, 0.55, [35, -index * 360 / features, 0])); }
  return parts;
}

export function createNatureSpecial(design: number): ModelPart[] {
  const group = Math.floor(design / 3); const branch = design % 3; const parts = groundStones(8, 1.6);
  if (group === 0) {
    for (let index = 0; index < 4; index++) parts.push(lobe("瀑布相连岩壁", "#99a58c", [(index - 1.5) * 0.65, 1.05 + index % 2 * 0.25, -0.35], [1.1, 2.2, 1]));
    for (let index = 0; index <= branch; index++) parts.push(part("独立水帘", "box", "#a8c7b9", [(index - branch / 2) * 0.65, 1.05, 0.19], [0.31, 1.65, 0.045], [0, 0, 0], { opacity: 0.65 }), cap("瀑下石潭", "#9ba68f", [(index - branch / 2) * 0.65, 0.1, 0.5], 0.53, 0.3, 3));
  } else if (group === 1) {
    for (let index = 0; index < 7; index++) { const x = (index - 3) * 0.42; const z = branch === 0 ? Math.sin(index * 0.7) * 0.45 : (index % 2 ? 1 : -1) * branch * 0.22; parts.push(part("溪道相连石床", "box", "#a5b19a", [x, 0.12, z], [0.5, 0.24, 0.8]), part("分段浅溪水", "box", "#8db4a5", [x, 0.25, z], [0.5, 0.012, 0.5], [0, 0, 0], { opacity: 0.7 })); }
    if (branch === 2) for (const side of [-1, 1]) parts.push(beam("倒木过溪", "#87775d", [side * 0.6, 0.36, -0.8], [side * 0.6, 0.36, 0.9], 0.16));
  } else if (group === 2) {
    for (let index = 0; index < 3 + branch; index++) { const a = index * Math.PI * 2 / (3 + branch); const position: Triple = branch === 0 ? [(index - 1) * 0.65, index * 0.2, 0] : [Math.cos(a), branch === 2 ? index % 2 * 0.3 : 0.05, Math.sin(a)]; parts.push(cap("相连岩泉池", "#9ca58f", position, 0.65, 0.45, 3), part("泉池水盘", "cylinder", "#94bdb0", [position[0], position[1] + 0.29, position[2]], [0.95, 0.012, 0.95], [0, 0, 0], { opacity: 0.7 })); }
  } else if (group === 3) {
    for (let index = 0; index < 6 + branch * 2; index++) { const a = index * Math.PI * 2 / (6 + branch * 2); parts.push(lobe("营火石圈", "#9ca38a", [Math.cos(a) * 0.65, 0.15, Math.sin(a) * 0.65], [0.32, 0.3, 0.26])); }
    for (let index = 0; index < 3 + branch; index++) { const a = index * Math.PI / (3 + branch); parts.push(beam("交叠营火木", "#8a7555", [Math.cos(a) * 0.5, 0.16, Math.sin(a) * 0.5], [-Math.cos(a) * 0.5, 0.18, -Math.sin(a) * 0.5], 0.11)); }
    for (let index = 0; index < 2 + branch; index++) parts.push(lobe("围圈坐石", "#a7ad97", [Math.cos(index * 2.3) * 1.2, 0.25, Math.sin(index * 2.3) * 1.2], [0.65, 0.5, 0.5]));
  } else if (group === 4) {
    for (let index = 0; index < 2 + branch; index++) { const a = index * Math.PI / (2 + branch); parts.push(beam("树洞拱根上节", "#8a7857", [Math.cos(a) * 1.1, 0.08, Math.sin(a) * 1.1], [0, 1.6, 0], 0.18), beam("树洞拱根下节", "#8a7857", [0, 1.6, 0], [-Math.cos(a) * 1.1, 0.08, -Math.sin(a) * 1.1], 0.16)); }
    parts.push(...basalLeaves(6 + branch, 0.75));
  } else {
    for (let index = 0; index < 4 + branch; index++) { const a = index * Math.PI * 2 / (4 + branch); parts.push(crystal("环潭冰晶", "#b1d0ca", [Math.cos(a), 0.65 + index % 2 * 0.2, Math.sin(a)], [0.5, 0.65, 0.5])); }
    parts.push(cap("结晶石潭", "#9ebbb0", [0, 0.1, 0], 1.15, 0.35, 3), part("冰潭水面", "cylinder", "#b1d2c7", [0, 0.34, 0], [1.65, 0.02, 1.65], [0, 0, 0], { opacity: 0.65 }));
    if (branch !== 0) for (let index = 0; index < branch + 2; index++) parts.push(lobe("风口雪丘", "#d6dfcf", [(index - 1) * 0.6, 0.25, -1], [0.9, 0.5, 0.6]));
  }
  return parts;
}
