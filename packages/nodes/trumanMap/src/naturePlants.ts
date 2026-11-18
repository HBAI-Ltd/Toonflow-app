import { beam, part } from "./assetModelParts";
import type { ModelPart, Triple } from "./assetModelParts";
import { basalLeaves, cap, combineMeshes, groundStones, leaf, lobe, needle } from "./natureParts";

export const treeBodies = ["直干树", "双叉树", "并干树", "三生树", "支根树", "拱干树", "丛干树", "瓶干树", "折干树"];
export const treeCrowns = ["团叶冠", "叠杉冠", "双扇冠", "伞松冠", "掌叶冠", "鹿角冠", "垂叶冠", "果穗冠", "杯叶冠", "旋叶冠"];
export const flowerForms = ["五瓣花", "钟形花", "菊盘花", "穗状花", "绒球花", "漏斗花", "兰瓣花", "碗莲花"];
export const cactusForms = ["烛柱仙人掌", "桶形仙人掌", "掌片仙人掌", "肋柱仙人掌", "匍匐仙人掌", "球簇仙人掌", "节团仙人掌"];
export const mushroomForms = ["穹盖菌", "尖盖菌", "平盖菌", "杯口菌", "裙缘菌", "球盖菌", "波缘菌"];
export const mushroomStems = ["独柄", "曲柄", "双根柄", "三叉柄", "支柱柄", "空心柄"];

function treeAxis(body: number, y: number, index: number): Triple {
  const h = 3.8; const side = index % 2 ? 1 : -1;
  if (body === 1) return [y < h * 0.45 ? 0 : side * (y / h - 0.45), y, 0];
  if (body === 2) return [side * (0.18 + y / h * 0.4), y, 0];
  if (body === 3 || body === 6) { const count = body === 3 ? 3 : 5; const a = index % count * Math.PI * 2 / count; return [Math.cos(a) * (0.08 + y / h * 0.55), y, Math.sin(a) * (0.08 + y / h * 0.55)]; }
  if (body === 5) return [y < 2 ? -0.8 + y * 0.15 : -0.5 + (y - 2) * 0.5, y, 0];
  if (body === 7) return [y < h * 0.65 ? 0 : side * (y / h - 0.65) * 1.5, y, 0];
  if (body === 8) { const segment = Math.min(3, Math.floor(y / h * 4)); const t = y / h * 4 - segment; const x = segment % 2 ? 0.28 : -0.28; return [x * (1 - 2 * t), y, 0]; }
  return [0, y, 0];
}

export function createNatureTree(design: number): ModelPart[] {
  const body = Math.floor(design / 100); const branchCount = 3 + Math.floor(design / 10) % 10; const crown = design % 10;
  const parts: ModelPart[] = [];
  if (body === 1) { parts.push(beam("分叉主干", "#7d684d", [0, 0, 0], [0, 1.71, 0], 0.24)); for (const side of [-1, 1]) parts.push(beam("双叉上干", "#7d684d", [0, 1.71, 0], [side * 0.55, 3.8, 0], 0.16)); }
  else if (body === 2 || body === 3 || body === 6) {
    const count = body === 2 ? 2 : body === 3 ? 3 : 5;
    for (let index = 0; index < count; index++) parts.push(beam("独立丛生树干", "#806b50", treeAxis(body, 0, index), treeAxis(body, 3.8, index), 0.15));
  } else if (body === 5 || body === 8) {
    const path: Triple[] = body === 5 ? [[-0.8, 0, 0], [-0.5, 2, 0], [0.4, 3.8, 0], [0.9, 2.8, 0]] : Array.from({ length: 5 }, (_, index) => [index % 2 ? 0.28 : -0.28, index * 0.95, 0] as Triple);
    for (let index = 1; index < path.length; index++) parts.push(beam("相连曲折树干", "#7e6951", path[index - 1]!, path[index]!, 0.2 - index * 0.018));
  } else if (body === 7) {
    parts.push(lobe("瓶状蓄水树干", "#8b8065", [0, 1.3, 0], [0.9, 2.65, 0.85]));
    for (const side of [-1, 1]) parts.push(beam("瓶干上叉", "#8b8065", [0, 2.35, 0], [side * 0.525, 3.8, 0], 0.18));
  } else parts.push(beam("连续主树干", "#80694f", [0, 0, 0], [0, 3.8, 0], body === 4 ? 0.29 : 0.23));
  for (let index = 0; index < 4; index++) { const a = index * Math.PI / 2; const base = treeAxis(body, 0.35, index); parts.push(beam("支撑板根", "#867354", [base[0] + Math.cos(a) * (body === 4 ? 1 : 0.57), 0.03, base[2] + Math.sin(a) * (body === 4 ? 1 : 0.57)], base, 0.09)); }
  for (let index = 0; index < branchCount; index++) {
    const angle = index * Math.PI * 2 / branchCount + index % 2 * 0.2; const y = 1.45 + index / branchCount * 2;
    const start = treeAxis(body, y, index); const end: Triple = [start[0] + Math.cos(angle) * 1.15, y + 0.45, start[2] + Math.sin(angle) * 1.15];
    parts.push(beam("主干相连侧枝", "#80694f", start, end, 0.055));
    if (crown === 0) parts.push(lobe("团簇叶冠", "#789568", end, [1.45, 0.8, 1.25]));
    else if (crown === 1) for (let layer = 0; layer < 2; layer++) parts.push(part("叠层杉针冠", "cone", "#5d805c", [end[0], end[1] + layer * 0.35, end[2]], [1.25 - layer * 0.35, 0.95, 1.25 - layer * 0.35]));
    else if (crown === 2 || crown === 3) for (let lobeIndex = 0; lobeIndex < (crown === 2 ? 2 : 3); lobeIndex++) { const a = angle + lobeIndex * Math.PI * 2 / (crown === 2 ? 2 : 3); parts.push(lobe("分叶伞冠", "#759367", [end[0] + Math.cos(a) * 0.3, end[1], end[2] + Math.sin(a) * 0.3], [1.1, crown === 3 ? 0.28 : 0.6, 0.9])); }
    else if (crown === 4 || crown === 6 || crown === 9) {
      if (crown === 6) parts.push(combineMeshes("三叉下垂细枝", "#89946a", Array.from({ length: 3 }, (_, blade) => { const a = angle + blade * Math.PI * 2 / 3; return needle("垂枝", "#89946a", end, [end[0] + Math.cos(a) * 0.18, end[1] - 0.4, end[2] + Math.sin(a) * 0.18], 0.022); })));
      for (let blade = 0; blade < 3; blade++) {
        const a = angle + blade * Math.PI * 2 / 3; const position: Triple = crown === 6 ? [end[0] + Math.cos(a) * 0.18, end[1] - 0.4, end[2] + Math.sin(a) * 0.18] : end;
        parts.push(crown === 9 ? combineMeshes("分叉旋叶", "#78965f", [leaf("旋叶主片", "#78965f", position, 0.24, 0.64, [35, -index * 360 / branchCount - blade * 120, blade * 22]), leaf("旋叶叉片", "#78965f", [position[0], position[1] + 0.3, position[2]], 0.17, 0.4, [55, -index * 360 / branchCount - blade * 120 + 35, blade * 22])]) : leaf(crown === 6 ? "下垂长叶" : "分掌尖叶", "#78965f", position, crown === 4 ? 0.6 : 0.28, crown === 6 ? 0.7 : 0.85, [crown === 6 ? 150 : 60, -index * 360 / branchCount - blade * 120, 0]));
      }
    }
    else if (crown === 5) { for (const side of [-1, 1]) parts.push(beam("鹿角分枝", "#8b7958", end, [end[0] + side * 0.35, end[1] + 0.55, end[2]], 0.035)); parts.push(lobe("枝端小叶冠", "#8da376", [end[0], end[1] + 0.6, end[2]], [0.7, 0.3, 0.6])); }
    else if (crown === 7) { parts.push(lobe("果穗叶团", "#7c9664", end, [1.1, 0.6, 0.8]), lobe("枝端球果", "#a79a67", [end[0], end[1] - 0.28, end[2]], [0.22, 0.48, 0.22])); }
    else parts.push(cap("向上杯叶冠", "#81996a", end, 0.6, 0.65, 3));
  }
  return parts;
}

function flowerHead(form: number, position: Triple): ModelPart {
  if (form === 1 || form === 5) return cap("单朵中空花冠", form === 1 ? "#b9a7c2" : "#caad94", position, 0.2, 0.34, form === 1 ? 4 : 3);
  const petals = form === 0 ? 5 : form === 2 ? 8 : form === 6 ? 3 : form === 7 ? 8 : 6;
  const pieces = Array.from({ length: petals }, (_, index) => {
    const a = index * Math.PI * 2 / petals;
    return form === 3 ? lobe("穗状花节", "#b8a4b4", [position[0] + Math.cos(a) * 0.065, position[1] + index * 0.075, position[2] + Math.sin(a) * 0.065], [0.13, 0.16, 0.13]) : form === 4 ? lobe("绒球花瓣", "#d3c3b2", [position[0] + Math.cos(a) * 0.12, position[1] + index % 2 * 0.08, position[2] + Math.sin(a) * 0.12], [0.2, 0.2, 0.2]) : leaf("放射花瓣", "#d4b69d", position, form === 7 ? 0.2 : 0.13, form === 6 ? 0.33 : 0.24, [form === 7 ? 50 : 75, -index * 360 / petals, 0]);
  });
  if (form === 7) for (let index = 0; index < 4; index++) pieces.push(leaf("莲花内层瓣", "#d4aba9", [position[0], position[1] + 0.07, position[2]], 0.11, 0.16, [25, -index * 90 - 45, 0]));
  return combineMeshes("完整花序花瓣", ["#d4b79f", "#bba8bb", "#d5c48f", "#b6a1b4", "#d3c3b2", "#c5ae8e", "#b7a5c0", "#d4aba9"][form]!, pieces);
}

export function createNatureFlowers(design: number): ModelPart[] {
  const form = Math.floor(design / 90); const stems = 1 + Math.floor(design / 10) % 9; const nodes = 2 + design % 10;
  const parts = [...basalLeaves(6, 0.55), lobe("未开花苞一", "#98a576", [0.25, 0.26, 0.13], [0.12, 0.18, 0.12]), lobe("未开花苞二", "#98a576", [-0.23, 0.29, -0.08], [0.12, 0.18, 0.12])];
  for (let index = 0; index < stems; index++) {
    const a = index * Math.PI * 2 / stems; const radius = stems === 1 ? 0 : 0.15 + Math.floor(index / 3) * 0.12;
    const root: Triple = [Math.cos(a) * radius, 0, Math.sin(a) * radius]; const top: Triple = [root[0] * 1.4, 0.7 + index % 3 * 0.16, root[2] * 1.4];
    parts.push(beam("独立花茎", "#7e995d", root, top, 0.018), flowerHead(form, top));
    parts.push(combineMeshes("交替茎生叶", "#829c64", Array.from({ length: nodes }, (_, node) => { const t = (node + 1) / (nodes + 2); return leaf("叶节", "#829c64", [root[0] + (top[0] - root[0]) * t, top[1] * t, root[2] + (top[2] - root[2]) * t], 0.1, 0.22, [60, node * 137 + index * 30, 0]); })));
  }
  return parts;
}

export function createNatureCactus(design: number): ModelPart[] {
  const body = Math.floor(design / 60); const arms = 1 + Math.floor(design / 10) % 6; const areoles = 1 + design % 10;
  const parts = groundStones(6, 0.7);
  if (body === 0 || body === 3) {
    parts.push(part("仙人掌柱体", "cylinder", "#7d986c", [0, 1.15, 0], [0.4, 2.3, 0.4]));
    if (body === 3) for (let rib = 0; rib < 6; rib++) { const a = rib * Math.PI / 3; parts.push(lobe("纵向肉质肋", "#88a174", [Math.cos(a) * 0.17, 1.12, Math.sin(a) * 0.17], [0.11, 2.2, 0.11])); }
  } else if (body === 1) parts.push(lobe("桶状肉质茎", "#899c6c", [0, 0.58, 0], [1.05, 1.25, 1.05]));
  else for (let segment = 0; segment < (body === 2 ? 3 : body === 4 ? 4 : body === 5 ? 4 : 3); segment++) { const a = segment * 2.4; parts.push(lobe("相连掌节", "#819b69", body === 4 ? [segment * 0.28 - 0.4, 0.25 + segment * 0.06, 0] : [Math.cos(a) * 0.26, 0.35 + segment * 0.39, Math.sin(a) * 0.26], body === 2 ? [0.6, 0.75, 0.18] : body === 5 ? [0.62, 0.65, 0.62] : [0.45, 0.62, 0.42], [0, segment * 45, 0])); }
  for (let arm = 0; arm < arms; arm++) {
    const a = arm * Math.PI * 2 / arms; const y = body === 1 ? 0.5 : 0.8 + arm % 3 * 0.28; const end: Triple = [Math.cos(a) * 0.65, y + 0.4, Math.sin(a) * 0.65];
    parts.push(beam("肉质侧枝连接", "#849c6d", [0, y, 0], [end[0], y, end[2]], 0.13), lobe("上举侧枝掌片", "#8da372", end, body === 2 ? [0.42, 0.65, 0.17] : [0.25, 0.85, 0.25], [0, -arm * 360 / arms, 0]));
  }
  for (let node = 0; node < areoles; node++) {
    const a = node * Math.PI * 2 / areoles; const y = 0.35 + node % 4 * 0.28; const root: Triple = [Math.cos(a) * 0.23, y, Math.sin(a) * 0.23];
    parts.push(combineMeshes("独立刺座", "#c4bd88", [-1, 0, 1].map(side => needle("辐射尖刺", "#c4bd88", root, [root[0] + Math.cos(a) * 0.14, y + side * 0.07, root[2] + Math.sin(a) * 0.14], 0.018))));
  }
  parts.push(flowerHead(0, [0, body === 1 ? 1.2 : 2.35, 0]));
  return parts;
}

export function createNatureMushrooms(design: number): ModelPart[] {
  const form = Math.floor(design / 60); const stem = Math.floor(design / 10) % 6; const count = 1 + design % 10;
  const parts = [...groundStones(6, 0.65), ...basalLeaves(2, 0.36, "#87956e")];
  for (let index = 0; index < count; index++) {
    const a = index * Math.PI * 2 / count; const radius = count === 1 ? 0 : 0.2 + index % 3 * 0.22; const x = Math.cos(a) * radius; const z = Math.sin(a) * radius; const h = 0.55 + index % 3 * 0.17;
    if (stem === 0) parts.push(part("直立菌柄", "cylinder", "#c8c0a1", [x, h / 2, z], [0.11, h, 0.11]));
    else if (stem === 1) { parts.push(beam("弯菌柄下节", "#c6bda0", [x - 0.08, 0, z], [x + 0.09, h * 0.55, z], 0.09), beam("弯菌柄上节", "#c6bda0", [x + 0.09, h * 0.55, z], [x, h, z], 0.075)); }
    else if (stem === 5) parts.push(part("空心菌柄", "lathe", "#c3ba9b", [x, 0, z], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0.06, y: 0 }, { x: 0.06, y: h }, { x: 0.035, y: h }, { x: 0.035, y: 0 }] }));
    else for (let leg = 0; leg < stem; leg++) { const t = leg * Math.PI * 2 / stem; parts.push(beam("汇合支柄", "#c7bea1", [x + Math.cos(t) * 0.2, 0, z + Math.sin(t) * 0.2], [x, h, z], 0.06)); }
    parts.push(cap("独立菌盖", ["#a87e62", "#a3946d", "#b2a189", "#ad967c", "#9a7c65", "#b7a27b", "#a89382"][form]!, [x, h - 0.015, z], 0.29, 0.35, form));
    parts.push(combineMeshes("菌褶放射片", "#b5ad8c", Array.from({ length: 8 }, (_, gill) => leaf("菌褶", "#b5ad8c", [x, h + 0.03, z], 0.025, 0.24, [88, -gill * 45, 0]))));
  }
  return parts;
}
