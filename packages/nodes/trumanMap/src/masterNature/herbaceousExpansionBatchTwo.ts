import { combineMeshes, design, lobe, needle, part, polygon, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { flatLeaf } from "./ediblePlants";
import { smallCorolla } from "./gardenPerennials";
import { radialBlade } from "./herbaceousExpansionBatchOne";

const green = "#80956d";
const pale = "#b0bd96";
const cream = "#d6d2b5";
const yellow = "#c9bb85";
const blue = "#a4adc3";

// 原创米制植物结构。这里的高大形态来自物种本身，不放大小花或复制成群落。
// https://www.rhs.org.uk/plants/6295/echium-pininana/details
// https://www.rhs.org.uk/plants/4709/crambe-cordifolia/details
// https://plants.usda.gov/DocumentLibrary/plantguide/pdf/pg_sipe2.pdf

export function asterHead(root: Triple, radius: number, count: number): ModelPart {
  const pieces: ModelPart[] = [];
  for (let i = 0; i < count; i++) pieces.push(radialBlade("菊科头状花序边缘独立舌状小花", yellow, root, radius * 0.24, radius, 85, i * 360 / count));
  for (let i = 0; i < 17; i++) { const a = i * 2.4, r = Math.sqrt(i / 17) * radius * 0.37; pieces.push(lobe("花序中央凸起的细密管状小花", yellow, [root[0] + Math.cos(a) * r, root[1] + radius * 0.07, root[2] + Math.sin(a) * r], [radius * 0.13, radius * 0.14, radius * 0.13])); }
  return combineMeshes("具有独立舌状花和真实凸起管花盘的花头", yellow, pieces);
}

function smallUmbel(root: Triple, radius: number, color: string): ModelPart[] {
  const parts: ModelPart[] = [];
  for (let ray = 0; ray < 5; ray++) {
    const a = ray * Math.PI * 0.4, hub: Triple = [root[0] + Math.cos(a) * radius, root[1] + radius * 0.24, root[2] + Math.sin(a) * radius];
    const pieces: ModelPart[] = [needle("复伞形花序中一级辐射伞梗", pale, root, hub, radius * 0.025)];
    for (let flower = 0; flower < 4; flower++) {
      const b = flower * Math.PI / 2, p: Triple = [hub[0] + Math.cos(b) * radius * 0.17, hub[1] + radius * 0.08, hub[2] + Math.sin(b) * radius * 0.17];
      pieces.push(needle("小伞形花序二级花梗", pale, hub, p, radius * 0.012));
      for (let petal = 0; petal < 5; petal++) pieces.push(radialBlade("伞形科小花五枚独立花瓣", color, p, radius * 0.045, radius * 0.08, 85, petal * 72));
    }
    parts.push(combineMeshes("一条伞梗和末端真实分枝的五瓣小花群", color, pieces));
  }
  return parts;
}

function butterbur(): ModelPart[] {
  const parts: ModelPart[] = [], outline: [number, number][] = [[0, 0.08], [-0.22, -0.12], [-0.46, 0.02], [-0.5, 0.2], [-0.42, 0.3], [-0.53, 0.46], [-0.35, 0.56], [-0.31, 0.77], [-0.14, 0.79], [0, 1], [0.14, 0.79], [0.31, 0.77], [0.35, 0.56], [0.53, 0.46], [0.42, 0.3], [0.5, 0.2], [0.46, 0.02], [0.22, -0.12]];
  for (let i = 0; i < 5; i++) {
    const a = i * 2.4, length = 0.52 + i % 3 * 0.07, root: Triple = [Math.cos(a) * 0.19, 0.7 + i % 2 * 0.16, Math.sin(a) * 0.19];
    parts.push(tapered("蜂斗菜直接从根茎抽出的长而有槽叶柄", pale, [[0, 0, 0], [root[0] * 0.4, root[1] * 0.6, root[2] * 0.4], root], [0.016, 0.012, 0.008]), flatLeaf("蜂斗菜基部深缺口且粗齿掌脉的巨大肾圆叶", root, [root[0] + Math.cos(a) * length, root[1] + 0.04, root[2] + Math.sin(a) * length], length * 1.1, outline, 0.002));
  }
  return parts;
}

function leopardPlant(): ModelPart[] {
  const parts: ModelPart[] = [];
  const kidney: [number, number][] = [[0, 0.05], [-0.23, -0.14], [-0.49, 0.04], [-0.52, 0.37], [-0.37, 0.75], [0, 1], [0.37, 0.75], [0.52, 0.37], [0.49, 0.04], [0.23, -0.14]];
  for (let i = 0; i < 7; i++) {
    const a = i * 2.4, root: Triple = [Math.cos(a) * 0.095, 0.29 + i % 3 * 0.04, Math.sin(a) * 0.095];
    parts.push(tapered("大吴风草莲座内独立长叶柄", pale, [[0, 0, 0], root], [0.005, 0.003]), flatLeaf("大吴风草厚实而不深裂的肾圆叶", root, [root[0] + Math.cos(a) * 0.26, root[1] + 0.015, root[2] + Math.sin(a) * 0.26], 0.3, kidney, 0.0025));
  }
  const hub: Triple = [0.015, 0.77, 0];
  parts.push(tapered("大吴风草高出叶丛的无叶花葶", pale, [[0, 0, 0], hub], [0.007, 0.0025]));
  for (let i = 0; i < 7; i++) {
    const a = i * 2.4, root: Triple = [Math.cos(a) * 0.12, 0.81 + i % 2 * 0.025, Math.sin(a) * 0.12];
    parts.push(tapered("大吴风草疏松伞房状花梗", pale, [hub, root], [0.002, 0.001]), asterHead(root, 0.027, 10));
  }
  return parts;
}

function dentateLigularia(): ModelPart[] {
  const parts: ModelPart[] = [], outline: [number, number][] = [[0, 0.08], [-0.22, -0.1], [-0.42, 0.02], [-0.51, 0.18], [-0.43, 0.26], [-0.53, 0.42], [-0.43, 0.5], [-0.4, 0.68], [-0.27, 0.71], [-0.18, 0.91], [0, 1], [0.18, 0.91], [0.27, 0.71], [0.4, 0.68], [0.43, 0.5], [0.53, 0.42], [0.43, 0.26], [0.51, 0.18], [0.42, 0.02], [0.22, -0.1]];
  for (let i = 0; i < 5; i++) {
    const a = i * 2.4, root: Triple = [Math.cos(a) * 0.15, 0.43 + i % 2 * 0.11, Math.sin(a) * 0.15];
    parts.push(tapered("齿叶橐吾大叶片的粗长叶柄", pale, [[0, 0, 0], root], [0.009, 0.005]), flatLeaf("齿叶橐吾具有实际粗三角齿的心状大叶", root, [root[0] + Math.cos(a) * 0.33, root[1] + 0.035, root[2] + Math.sin(a) * 0.33], 0.35, outline, 0.0018));
  }
  parts.push(tapered("齿叶橐吾带小型茎叶的直立花茎", pale, [[0, 0, 0], [0, 1.2, 0]], [0.012, 0.003]), flatLeaf("橐吾花茎中段的小型抱茎叶", [0, 0.67, 0], [0.18, 0.72, 0.025], 0.17, outline, 0.0013));
  for (let i = 0; i < 9; i++) {
    const a = i * 2.4, radius = 0.12 + i % 3 * 0.045, root: Triple = [Math.cos(a) * radius, 1.22 + i % 2 * 0.025, Math.sin(a) * radius];
    parts.push(tapered("齿叶橐吾接近同一高度的顶生伞房花梗", pale, [[0, 0.95 + i % 3 * 0.065, 0], root], [0.003, 0.0012]), asterHead(root, 0.042, 12));
  }
  return parts;
}

function cupPlant(): ModelPart[] {
  const parts: ModelPart[] = [part("贯叶松香草截面真正为四棱的粗秆", "box", pale, [0, 1.17, 0], [0.026, 2.34, 0.026])];
  const teeth: [number, number][] = [[0, 0], [-0.17, 0.12], [-0.37, 0.3], [-0.3, 0.34], [-0.5, 0.52], [-0.36, 0.56], [-0.4, 0.73], [-0.23, 0.77], [0, 1], [0.23, 0.77], [0.4, 0.73], [0.36, 0.56], [0.5, 0.52], [0.3, 0.34], [0.37, 0.3], [0.17, 0.12]];
  for (let node = 0; node < 5; node++) {
    const y = 0.32 + node * 0.32, a = node % 2 * Math.PI / 2, length = 0.38 - node * 0.036;
    const cup = polygon("贯叶松香草对生叶基愈合成围秆的真正浅杯", green, Array.from({ length: 16 }, (_, i) => [Math.cos(i * Math.PI / 8) * 0.052, Math.sin(i * Math.PI / 8) * 0.052]), 0.0015, [0, y, 0], [[[-0.013, -0.013], [-0.013, 0.013], [0.013, 0.013], [0.013, -0.013]]]);
    cup.vertices = cup.vertices!.map(v => ({ ...v, y: v.y + (v.x * v.x + v.z * v.z) / (0.052 * 0.052) * 0.025 })); parts.push(cup);
    for (const side of [-1, 1]) parts.push(flatLeaf("贯叶松香草相对两片连杯叶基外展的粗齿叶", [Math.cos(a) * side * 0.035, y + 0.012, Math.sin(a) * side * 0.035], [Math.cos(a) * side * length, y + 0.08, Math.sin(a) * side * length], length * 0.52, teeth, 0.0015));
  }
  for (let i = 0; i < 8; i++) {
    const a = i * 2.4, root: Triple = [Math.cos(a) * 0.25, 2.39 + i % 3 * 0.035, Math.sin(a) * 0.25];
    parts.push(tapered("贯叶松香草上部对生分枝的花梗", pale, [[0, 1.88 + i % 3 * 0.11, 0], root], [0.004, 0.0015]), asterHead(root, 0.043, 18));
  }
  return parts;
}

function datisca(): ModelPart[] {
  const paths: Triple[][] = [[[0, 0, 0], [0.015, 0.9, 0], [0, 1.85, 0]], [[0.008, 0.7, 0], [-0.24, 1.26, 0.05], [-0.4, 1.66, 0.08]], [[0.01, 0.95, 0], [0.26, 1.5, -0.06], [0.32, 1.82, -0.09]]];
  const parts: ModelPart[] = paths.map(path => tapered("四数麻高大而不木质化的分枝草茎", pale, path, [0.009, 0.006, 0.0015]));
  const serrate: [number, number][] = [[0, 0], [-0.25, 0.2], [-0.45, 0.43], [-0.33, 0.45], [-0.5, 0.64], [-0.32, 0.67], [-0.32, 0.83], [0, 1], [0.32, 0.83], [0.32, 0.67], [0.5, 0.64], [0.33, 0.45], [0.45, 0.43], [0.25, 0.2]];
  for (let node = 0; node < 8; node++) {
    const y = 0.16 + node * 0.18, a = node * 2.4, length = 0.32 - node * 0.017, root: Triple = [0.01, y, 0], tip: Triple = [Math.cos(a) * length, y + 0.065, Math.sin(a) * length];
    const pieces: ModelPart[] = [needle("四数麻奇数羽状复叶的共同叶轴", pale, root, tip, 0.003)];
    for (let i = 0; i < 4; i++) for (const side of [-1, 1]) {
      const t = 0.16 + i * 0.18, p: Triple = [root[0] + (tip[0] - root[0]) * t, y + 0.065 * t, tip[2] * t], b = a + side * 1.15, span = 0.09 - i * 0.01;
      pieces.push(flatLeaf("四数麻长尖而粗锯齿的离生复叶小片", p, [p[0] + Math.cos(b) * span, p[1] + 0.018, p[2] + Math.sin(b) * span], 0.028, serrate, 0.0006));
    }
    pieces.push(flatLeaf("四数麻奇数复叶真正的顶生小叶", [tip[0] * 0.86, y + 0.056, tip[2] * 0.86], [tip[0] + Math.cos(a) * 0.058, tip[1] + 0.011, tip[2] + Math.sin(a) * 0.058], 0.028, serrate, 0.0006));
    parts.push(combineMeshes("四数麻一片有终端小叶的锯齿羽状复叶", green, pieces));
  }
  for (let i = 0; i < 9; i++) {
    const a = i * 2.4, y = 0.87 + i * 0.098, root: Triple = [0.01, y, 0], end: Triple = [Math.cos(a) * 0.12, y - 0.22, Math.sin(a) * 0.12], pieces: ModelPart[] = [tapered("四数麻从叶腋伸出的细长下垂雌花序", pale, [root, [end[0] * 0.6, y - 0.03, end[2] * 0.6], end], [0.0019, 0.0013, 0.0006])];
    for (let flower = 0; flower < 22; flower++) { const t = (flower + 1) / 23, b = flower * 2.4; pieces.push(lobe("四数麻细长花序上独立的无瓣小花子房", pale, [end[0] * t + Math.cos(b) * 0.006, y - 0.22 * t, end[2] * t + Math.sin(b) * 0.006], [0.005, 0.007, 0.005])); }
    parts.push(combineMeshes("四数麻有下垂细轴而非密实花锥的腋生花串", pale, pieces));
  }
  return parts;
}

function giantHogweed(): ModelPart[] {
  const parts: ModelPart[] = [tapered("大猪草直立粗壮而有纵棱的草秆", pale, [[0, 0, 0], [0, 1.5, 0], [0.04, 2.82, 0]], [0.047, 0.036, 0.016])];
  const segment: [number, number][] = [[0, 0], [-0.19, 0.1], [-0.4, 0.25], [-0.16, 0.34], [-0.5, 0.48], [-0.21, 0.54], [-0.38, 0.72], [-0.12, 0.72], [0, 1], [0.12, 0.72], [0.38, 0.72], [0.21, 0.54], [0.5, 0.48], [0.16, 0.34], [0.4, 0.25], [0.19, 0.1]];
  for (let node = 0; node < 4; node++) {
    const a = node * 2.4, y = 0.16 + node * 0.45, root: Triple = [Math.cos(a) * 0.34, y + 0.25, Math.sin(a) * 0.34];
    parts.push(tapered("大猪草粗壮膨大的叶柄与抱秆叶鞘", pale, [[0, y, 0], root], [0.027, 0.012]));
    const pieces: ModelPart[] = [];
    for (let blade = 0; blade < 3; blade++) {
      const b = a + (blade - 1) * 0.93, span = blade === 1 ? 0.54 : 0.43;
      pieces.push(flatLeaf("大猪草三出深羽裂叶中具有尖裂齿的大裂片", root, [root[0] + Math.cos(b) * span, root[1] + 0.07, root[2] + Math.sin(b) * span], span * 0.57, segment, 0.002));
    }
    parts.push(combineMeshes("大猪草一片真正三向深裂的大复叶", green, pieces));
  }
  parts.push(...smallUmbel([0.04, 2.82, 0], 0.32, cream));
  for (let branch = 0; branch < 4; branch++) {
    const a = branch * Math.PI / 2 + 0.4, root: Triple = [Math.cos(a) * 0.47, 2.44 + branch % 2 * 0.16, Math.sin(a) * 0.47];
    parts.push(tapered("大猪草主伞下独立斜出的侧花序梗", pale, [[0.018, 1.91 + branch * 0.09, 0], root], [0.017, 0.007]), ...smallUmbel(root, 0.17, cream));
  }
  return parts;
}

function giantFennel(): ModelPart[] {
  const parts: ModelPart[] = [tapered("巨茴香高大光滑而粗直的中心草秆", pale, [[0, 0, 0], [0, 2.4, 0]], [0.025, 0.009])];
  for (let frond = 0; frond < 5; frond++) {
    const a = frond * 2.4, y = 0.12 + frond * 0.23, tip: Triple = [Math.cos(a) * 0.53, y + 0.22, Math.sin(a) * 0.53], pieces: ModelPart[] = [needle("巨茴香多回分裂基生大叶的共同叶轴", pale, [0, y, 0], tip, 0.005)];
    for (let node = 0; node < 5; node++) for (const side of [-1, 1]) {
      const t = 0.15 + node * 0.17, root: Triple = [tip[0] * t, y + 0.22 * t, tip[2] * t], b = a + side * 1.15, end: Triple = [root[0] + Math.cos(b) * (0.19 - node * 0.02), root[1] + 0.04, root[2] + Math.sin(b) * (0.19 - node * 0.02)];
      pieces.push(needle("巨茴香大叶的第二回羽轴", pale, root, end, 0.0018));
      for (let fine = 0; fine < 4; fine++) for (const edge of [-1, 1]) { const u = 0.22 + fine * 0.2, p: Triple = [root[0] + (end[0] - root[0]) * u, root[1] + 0.04 * u, root[2] + (end[2] - root[2]) * u], c = b + edge * 1.15; pieces.push(needle("巨茴香末级真正细丝状而非完整宽叶的裂片", green, p, [p[0] + Math.cos(c) * 0.053, p[1] + 0.012, p[2] + Math.sin(c) * 0.053], 0.0011)); }
    }
    for (let i = 0; i < pieces.length; i += 65) parts.push(combineMeshes("巨茴香一片多回羽分的细丝叶结构", green, pieces.slice(i, i + 65)));
  }
  parts.push(...smallUmbel([0, 2.4, 0], 0.21, yellow));
  for (let branch = 0; branch < 6; branch++) {
    const a = branch * 2.4, root: Triple = [Math.cos(a) * 0.37, 1.75 + branch * 0.09, Math.sin(a) * 0.37];
    parts.push(tapered("巨茴香上部逐级分出的伞形花序侧梗", pale, [[0, 1.29 + branch * 0.12, 0], root], [0.009, 0.0035]), ...smallUmbel(root, 0.12, yellow));
  }
  return parts;
}

function towerEchium(): ModelPart[] {
  const parts: ModelPart[] = [tapered("塔状蓝蓟高大但不形成木干的单一花序轴", pale, [[0, 0, 0], [0, 0.7, 0], [0, 3.6, 0]], [0.065, 0.052, 0.003])];
  for (let i = 0; i < 13; i++) { const a = i * 2.4, y = 0.035 + i % 3 * 0.07; parts.push(radialBlade("塔状蓝蓟巨大莲座内粗毛披针形长叶", green, [0, y, 0], 0.15, 0.79 - i % 3 * 0.08, 35 + i % 3 * 8, a * 180 / Math.PI)); }
  const flowers: ModelPart[] = [], bracts: ModelPart[] = [];
  for (let i = 0; i < 84; i++) {
    const t = i / 83, a = i * 2.4, y = 0.74 + t * 2.75, radius = (1 - t) * 0.2 + 0.017, root: Triple = [Math.cos(a) * radius, y, Math.sin(a) * radius];
    const start: Triple = [Math.cos(a) * radius * 0.35, y - 0.025, Math.sin(a) * radius * 0.35];
    flowers.push(smallCorolla(root, [Math.cos(a), 0.25, Math.sin(a)], 0.026, 0.008, blue, false, 5, 8));
    bracts.push(needle("塔状蓝蓟花簇与主轴相连的侧花梗", pale, start, root, 0.0017), radialBlade("塔状蓝蓟花序内逐渐变短的大苞叶", pale, start, 0.024 * (1 - t) + 0.008, 0.11 * (1 - t) + 0.025, 63, a * 180 / Math.PI));
  }
  for (let i = 0; i < flowers.length; i += 3) parts.push(combineMeshes("塔状蓝蓟沿圆锥花轴离散开放的真花管群", blue, flowers.slice(i, i + 3)));
  for (let i = 0; i < bracts.length; i += 40) parts.push(combineMeshes("塔状蓝蓟花锥上相连的花梗与绿色苞片", pale, bracts.slice(i, i + 40)));
  return parts;
}

function giantLobelia(): ModelPart[] {
  const parts: ModelPart[] = [tapered("毛冠巨半边莲从大莲座中心抽出的粗花轴", pale, [[0, 0, 0], [0, 0.65, 0], [0, 3.15, 0]], [0.07, 0.082, 0.035])];
  for (let i = 0; i < 18; i++) { const a = i * 2.4; parts.push(radialBlade("毛冠巨半边莲基部密集直展的宽带状莲座叶", green, [0, 0.11, 0], 0.115, 0.84 - i % 3 * 0.06, 43 + i % 4 * 8, a * 180 / Math.PI)); }
  const bracts: ModelPart[] = [], flowers: ModelPart[] = [];
  for (let i = 0; i < 120; i++) {
    const t = i / 119, a = i * 2.4, radius = 0.07 + Math.sin(t * Math.PI) * 0.035, root: Triple = [Math.cos(a) * radius, 0.8 + t * 2.26, Math.sin(a) * radius];
    bracts.push(radialBlade("毛冠巨半边莲沿长花穗密覆且向下垂的狭长毛苞片", "#b8bca4", root, 0.017, 0.16 + Math.sin(t * Math.PI) * 0.035, 137, a * 180 / Math.PI));
    if (i % 5 === 0) {
      const flowerRoot: Triple = [root[0] * 1.22, root[1], root[2] * 1.22];
      bracts.push(needle("毛冠巨半边莲穿过长苞片并接到花管基部的短花柄", pale, [root[0] * 0.45, root[1], root[2] * 0.45], flowerRoot, 0.0017));
      flowers.push(smallCorolla(flowerRoot, [Math.cos(a), -0.12, Math.sin(a)], 0.038, 0.009, blue, true));
    }
  }
  for (let i = 0; i < bracts.length; i += 30) parts.push(combineMeshes("毛冠巨半边莲真实片状下垂的长苞片帘", "#b8bca4", bracts.slice(i, i + 30)));
  for (let i = 0; i < flowers.length; i += 3) parts.push(combineMeshes("毛冠巨半边莲藏在毛苞片间的双唇蓝花", blue, flowers.slice(i, i + 3)));
  return parts;
}

function giantSeaKale(): ModelPart[] {
  const parts: ModelPart[] = [];
  for (let i = 0; i < 6; i++) {
    const a = i * 2.4, root: Triple = [Math.cos(a) * 0.08, 0.2 + i % 2 * 0.065, Math.sin(a) * 0.08];
    parts.push(tapered("心叶海甘蓝大基生叶的粗长叶柄", pale, [[0, 0, 0], root], [0.009, 0.005]), flatLeaf("心叶海甘蓝粗波裂而基部心形的大叶", root, [root[0] + Math.cos(a) * 0.43, root[1] + 0.035, root[2] + Math.sin(a) * 0.43], 0.35, "lobed", 0.002));
  }
  parts.push(tapered("心叶海甘蓝高出大叶丛的分枝花茎", pale, [[0, 0, 0], [0, 1.1, 0], [0, 1.98, 0]], [0.019, 0.01, 0.002]));
  for (let branch = 0; branch < 9; branch++) {
    const a = branch * 2.4, root: Triple = [0, 0.94 + branch * 0.09, 0], hub: Triple = [Math.cos(a) * (0.48 - branch * 0.027), 1.58 + branch * 0.045, Math.sin(a) * (0.48 - branch * 0.027)];
    parts.push(tapered("心叶海甘蓝开放疏松的圆锥花序主分枝", pale, [root, hub], [0.0045, 0.0017]));
    const pieces: ModelPart[] = [];
    for (let twig = 0; twig < 7; twig++) {
      const b = a + (twig - 3) * 0.45, p: Triple = [hub[0] + Math.cos(b) * 0.095, hub[1] + 0.06 + twig % 3 * 0.026, hub[2] + Math.sin(b) * 0.095];
      pieces.push(needle("心叶海甘蓝细而可见的末级小花梗", pale, hub, p, 0.001));
      for (let petal = 0; petal < 4; petal++) pieces.push(radialBlade("十字花科心叶海甘蓝的四枚白色花瓣", cream, p, 0.0025, 0.0045, 82, petal * 90));
      pieces.push(lobe("心叶海甘蓝四瓣小花的中央子房", pale, [p[0], p[1] + 0.0017, p[2]], [0.002, 0.003, 0.002]));
    }
    parts.push(combineMeshes("心叶海甘蓝通透花云的一条疏花分枝", cream, pieces));
  }
  return parts;
}

export const herbaceousExpansionBatchTwoDesigns: MasterNatureDesign[] = [
  design("japaneseButterbur", "蜂斗菜", "植物", butterbur, ["Petasites japonicus", "长叶柄与粗齿巨肾圆叶的夏季完整植株"]),
  design("japaneseLeopardPlant", "大吴风草", "植物", leopardPlant, ["Farfugium japonicum", "厚肾圆基生叶和高出叶丛的疏伞房黄花"]),
  design("dentateLigulariaPlant", "齿叶橐吾", "植物", dentateLigularia, ["Ligularia dentata", "粗三角齿大叶与茎顶宽展花伞"]),
  design("perfoliateCupPlant", "贯叶松香草", "植物", cupPlant, ["Silphium perfoliatum", "方秆和真正围秆相连的叶基蓄水浅杯"]),
  design("datiscaCannabina", "四数麻", "植物", datisca, ["Datisca cannabina", "奇数锯齿羽状复叶与腋生细长下垂花串"]),
  design("giantHogweedPlant", "大猪草", "植物", giantHogweed, ["Heracleum mantegazzianum", "粗秆三出深裂巨叶和宽大复伞形花序"]),
  design("giantFennelPlant", "巨茴香", "植物", giantFennel, ["Ferula communis", "粗直高秆多回丝叶与分级黄花复伞"]),
  design("towerEchiumPlant", "塔状蓝蓟", "植物", towerEchium, ["Echium pininana", "大披针叶莲座和数米高渐尖漏斗花锥"]),
  design("telekiiGiantLobelia", "毛冠巨半边莲", "植物", giantLobelia, ["Lobelia telekii", "大型带叶莲座与密覆长垂毛苞片的花穗"]),
  design("heartLeafSeaKale", "心叶海甘蓝", "植物", giantSeaKale, ["Crambe cordifolia", "粗裂大叶与高大通透四瓣白花枝云"]),
];
