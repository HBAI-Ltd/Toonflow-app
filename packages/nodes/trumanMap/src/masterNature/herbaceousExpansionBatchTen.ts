import { combineMeshes, design, lobe, needle, part, petals, sweptProfile, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { flatLeaf } from "./ediblePlants";
import { smallCorolla } from "./gardenPerennials";
import { radialBlade } from "./herbaceousExpansionBatchOne";
import { asterHead } from "./herbaceousExpansionBatchTwo";
import { thinLeaf } from "./herbaceousExpansionBatchSix";

const green = "#82976c";
const pale = "#b0bc96";
const cream = "#d7d0b2";
const yellow = "#cbbc86";
const brown = "#a39376";

// 独立大草本和大型蕨的原创完整植株。小羽片复用亚毫米双面叶的低面实现。
// https://plants.ces.ncsu.edu/plants/osmunda-claytoniana/
// https://www.fs.usda.gov/pnw/pubs/pnw_gtr513.pdf
// https://www.nparks.gov.sg/florafaunaweb/flora/3/9/3951
// https://www.rhs.org.uk/plants/18784/veratrum-album/details
// https://www.rhs.org.uk/plants/7793/gentiana-lutea/details
// https://www.rhs.org.uk/plants/41249/salvia-sclarea/details
// https://plants.ces.ncsu.edu/plants/conium-maculatum/
// https://www.worldfloraonline.org/taxon/wfo-0000117950
// https://plants.ces.ncsu.edu/plants/rudbeckia-maxima/

export function axisPosition(path: Triple[], fraction: number): Triple {
  const t = Math.min(path.length - 1.000001, Math.max(0, fraction) * (path.length - 1)), i = Math.floor(t), u = t - i;
  return path[i]!.map((v, axis) => v + (path[i + 1]![axis]! - v) * u) as Triple;
}

function pleatedLeaf(name: string, root: Triple, end: Triple, width: number, pleat: number): ModelPart {
  const dx = end[0] - root[0], dy = end[1] - root[1], dz = end[2] - root[2], length = Math.hypot(dx, dy, dz), horizontal = Math.hypot(dx, dz), across: Triple = [dz / horizontal, 0, -dx / horizontal], up: Triple = [-dy * dx / (length * horizontal), horizontal / length, -dy * dz / (length * horizontal)], vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
  for (let side = 0; side < 2; side++) for (let row = 0; row < 9; row++) {
    const t = row / 8, spread = width * Math.max(0.012, Math.sin(t * Math.PI));
    for (let column = 0; column < 9; column++) { const x = (column / 8 - 0.5) * spread, ridge = width * pleat * Math.cos(column * Math.PI) * Math.sin(t * Math.PI) + side * 0.0008; vertices.push({ x: dx * t + across[0] * x + up[0] * ridge, y: dy * t + up[1] * ridge, z: dz * t + across[2] * x + up[2] * ridge }); }
  }
  for (let row = 0; row < 8; row++) for (let column = 0; column < 8; column++) { const i = row * 9 + column; indices.push(i, i + 1, i + 9, i + 1, i + 10, i + 9, i + 81, i + 90, i + 82, i + 82, i + 90, i + 91); }
  const edge = [...Array.from({ length: 9 }, (_, i) => i), ...Array.from({ length: 8 }, (_, i) => (i + 1) * 9 + 8), ...Array.from({ length: 8 }, (_, i) => 79 - i), ...Array.from({ length: 7 }, (_, i) => (7 - i) * 9)];
  for (let i = 0; i < edge.length; i++) { const a = edge[i]!, b = edge[(i + 1) % edge.length]!; indices.push(a, a + 81, b, b, a + 81, b + 81); }
  return part(name, "mesh", green, root, [1, 1, 1], [0, 0, 0], { vertices, indices });
}

function europeanRoyalFern(): ModelPart[] {
  const parts: ModelPart[] = [lobe("真紫萁低矮而粗短的直立根茎", brown, [0, 0.06, 0], [0.2, 0.13, 0.2])];
  for (let frond = 0; frond < 5; frond++) {
    const a = frond * 2.4, fertile = frond < 3, path: Triple[] = [[0, 0.055, 0], [Math.cos(a) * 0.24, 1.12, Math.sin(a) * 0.24], [Math.cos(a) * 0.72, 1.7 + frond % 2 * 0.13, Math.sin(a) * 0.72]], pinnae: ModelPart[] = [];
    parts.push(tapered("真紫萁贯穿绿色营养羽与顶端孢子羽的同一叶轴", pale, path, [0.01, 0.005, 0.0012]));
    for (let node = 0; node < 7; node++) for (const side of [-1, 1]) {
      const t = 0.28 + node * 0.083, root = axisPosition(path, t), b = a + side * 1.13, span = 0.25 * Math.sin((t * 0.8 + 0.15) * Math.PI), tip: Triple = [root[0] + Math.cos(b) * span, root[1] + 0.035, root[2] + Math.sin(b) * span], pieces: ModelPart[] = [needle("真紫萁宽二回羽片的真实次级叶轴", pale, root, tip, 0.0018)];
      for (let leaflet = 0; leaflet < 6; leaflet++) for (const edge of [-1, 1]) { const u = 0.1 + leaflet * 0.145, p: Triple = root.map((v, axis) => v + (tip[axis]! - v) * u) as Triple, c = b + edge * 1.15, reach = 0.052 - leaflet * 0.003; pieces.push(thinLeaf(flatLeaf("真紫萁疏列宽长圆形而不再深裂的小羽片", p, [p[0] + Math.cos(c) * reach, p[1] + 0.009, p[2] + Math.sin(c) * reach], 0.023, "oval", 0.0006))); }
      pinnae.push(combineMeshes("真紫萁叶轴下部真实二回分离的宽绿色羽片", green, pieces));
    }
    for (let i = 0; i < pinnae.length; i += 2) parts.push(combineMeshes("真紫萁全部叶轴和小羽片均保留的完整宽羽段", green, pinnae.slice(i, i + 2)));
    if (!fertile) { const root = axisPosition(path, 0.83), tip = path[2]!; parts.push(thinLeaf(flatLeaf("真紫萁营养叶不狭缩成孢子羽的绿色顶片", root, tip, 0.07, "lobed", 0.0006))); continue; }
    const fertileParts: ModelPart[] = [];
    for (let node = 0; node < 6; node++) for (const side of [-1, 1]) { const t = 0.8 + node * 0.033, root = axisPosition(path, t), b = a + side * 1.03, span = 0.09 * (1 - (t - 0.8) * 3), end: Triple = [root[0] + Math.cos(b) * span, root[1] + 0.026, root[2] + Math.sin(b) * span]; fertileParts.push(needle("真紫萁只在同片叶轴顶端出现的狭缩孢子羽轴", brown, root, end, 0.0013)); for (let spore = 0; spore < 6; spore++) { const u = 0.15 + spore * 0.15; fertileParts.push(lobe("真紫萁顶端狭缩羽上的独立孢子囊团", brown, root.map((v, axis) => v + (end[axis]! - v) * u) as Triple, [0.005, 0.009, 0.005])); } }
    for (let i = 0; i < fertileParts.length; i += 28) parts.push(combineMeshes("真紫萁绿色叶身上方真正连轴的棕色孢子冠", brown, fertileParts.slice(i, i + 28)));
  }
  return parts;
}

function interruptedFern(): ModelPart[] {
  const parts: ModelPart[] = [lobe("绒毛紫萁叶冠基部的短粗根茎", brown, [0, 0.045, 0], [0.17, 0.095, 0.17])];
  for (let frond = 0; frond < 5; frond++) {
    const a = frond * 2.4, path: Triple[] = [[0, 0.04, 0], [Math.cos(a) * 0.22, 0.83, Math.sin(a) * 0.22], [Math.cos(a) * 0.68, 1.16 + frond % 2 * 0.05, Math.sin(a) * 0.68]], leaves: ModelPart[] = [], spores: ModelPart[] = [];
    parts.push(tapered("绒毛紫萁中部狭缩孢子羽前后仍连续的叶轴", pale, path, [0.007, 0.0035, 0.0008]));
    for (let node = 0; node < 22; node++) for (const side of [-1, 1]) {
      const t = 0.27 + node * 0.032, p = axisPosition(path, t), b = a + side * 1.22, span = 0.2 * Math.sin((t - 0.14) / 0.86 * Math.PI);
      if (frond < 3 && node >= 7 && node <= 10) {
        const end: Triple = [p[0] + Math.cos(b) * span * 0.65, p[1] + 0.018, p[2] + Math.sin(b) * span * 0.65]; spores.push(needle("绒毛紫萁只替代叶轴中段四对营养羽的狭缩羽轴", brown, p, end, 0.0014));
        for (let cluster = 0; cluster < 7; cluster++) { const u = 0.1 + cluster * 0.14; spores.push(lobe("绒毛紫萁中断绿色叶身的分立棕色孢子团", brown, p.map((v, axis) => v + (end[axis]! - v) * u) as Triple, [0.006, 0.011, 0.006])); }
      } else leaves.push(thinLeaf(flatLeaf("绒毛紫萁从同一羽轴深裂而未分离的狭长羽片", p, [p[0] + Math.cos(b) * span, p[1] + 0.015, p[2] + Math.sin(b) * span], span * 0.36, "lobed", 0.0006)));
    }
    for (let i = 0; i < leaves.length; i += 14) parts.push(combineMeshes("绒毛紫萁保留全部叶序的深裂绿羽片列", green, leaves.slice(i, i + 14)));
    for (let i = 0; i < spores.length; i += 28) parts.push(combineMeshes("绒毛紫萁同片叶中段而非顶端的真实孢子羽", brown, spores.slice(i, i + 28)));
  }
  return parts;
}

function westernSwordFern(): ModelPart[] {
  const parts: ModelPart[] = [lobe("西部剑蕨密鳞叶冠的短粗根茎", brown, [0, 0.07, 0], [0.24, 0.15, 0.24])];
  const margin: [number, number][] = [[0, 0], [-0.48, 0.035], [-0.25, 0.18], [-0.5, 0.3], [-0.35, 0.33], [-0.43, 0.52], [-0.29, 0.55], [-0.27, 0.76], [-0.16, 0.77], [0, 1], [0.13, 0.78], [0.2, 0.76], [0.22, 0.54], [0.3, 0.5], [0.25, 0.31], [0.36, 0.28], [0.19, 0.06]];
  for (let frond = 0; frond < 5; frond++) {
    const a = frond * 2.4, path: Triple[] = [[0, 0.06, 0], [Math.cos(a) * 0.25, 1.14, Math.sin(a) * 0.25], [Math.cos(a) * 0.91, 1.36 + frond % 2 * 0.08, Math.sin(a) * 0.91]], leaves: ModelPart[] = [], spores: ModelPart[] = [];
    parts.push(tapered("西部剑蕨细长剑状单回羽叶的连续叶轴", pale, path, [0.009, 0.0045, 0.0007]));
    for (let node = 0; node < 36; node++) for (const side of [-1, 1]) {
      const t = 0.22 + node * 0.021 + (side < 0 ? 0.008 : 0), p = axisPosition(path, t), b = a + side * 1.25, span = 0.135 * Math.sin((t - 0.11) / 0.89 * Math.PI) + 0.008, blade = thinLeaf(flatLeaf("西部剑蕨不对称耳基和内弯尖锯齿的独立羽片", p, [p[0] + Math.cos(b) * span, p[1] + 0.014, p[2] + Math.sin(b) * span], 0.024, margin, 0.0006));
      leaves.push(blade);
      if (frond >= 2 || node < 17 || node % 3) continue;
      for (let cluster = 0; cluster < 5; cluster++) for (const edge of [-1, 1]) { const u = 0.22 + cluster * 0.13, offset = edge * 0.0045 * Math.sin(u * Math.PI), q: Triple = [p[0] + Math.cos(b) * span * u - Math.sin(b) * offset, p[1] + 0.014 * u - 0.0003, p[2] + Math.sin(b) * span * u + Math.cos(b) * offset]; spores.push(lobe("西部剑蕨羽片背面中肋两侧分立的圆囊群", brown, q, [0.0027, 0.0018, 0.0027])); }
    }
    for (let i = 0; i < leaves.length; i += 14) parts.push(combineMeshes("西部剑蕨保留三十六对交错耳基羽片的完整叶列", green, leaves.slice(i, i + 14)));
    for (let i = 0; i < spores.length; i += 30) parts.push(combineMeshes("西部剑蕨真实位于叶背的圆形孢子囊群列", brown, spores.slice(i, i + 30)));
  }
  return parts;
}

function umbrellaFern(): ModelPart[] {
  const parts: ModelPart[] = [tapered("破伞蕨横卧并承托各长叶柄的粗根茎", brown, [[-0.07, 0.02, 0], [0.08, 0.02, 0.025]], [0.02, 0.015])], outline: [number, number][] = [[0, 0]];
  for (let ray = 0; ray < 12; ray++) {
    const a = (-66 + ray * 12) * Math.PI / 180, next = a + 6 * Math.PI / 180, r = 0.86 + ray % 3 * 0.055, cut = ray % 3 === 2 ? 0.36 : 0.66;
    outline.push([Math.sin(a) * 0.52 * r, Math.cos(a) * r], [Math.sin(next) * 0.52 * cut, Math.cos(next) * cut]);
  }
  for (let frond = 0; frond < 3; frond++) {
    const a = frond * 2.4, top: Triple = [Math.cos(a) * 0.12, 1.25 + frond * 0.13, Math.sin(a) * 0.12];
    parts.push(tapered("破伞蕨叶身以下长而近裸的独立硬叶柄", brown, [[Math.cos(a) * 0.05, 0.02, Math.sin(a) * 0.05], top], [0.009, 0.005]));
    for (const side of [-1, 1]) {
      const b = a + side * 0.82, blade = flatLeaf("破伞蕨同一叶顶真正二分且各自重复深裂的大扇叶", top, [top[0] + Math.cos(b) * 0.48, top[1] + 0.08, top[2] + Math.sin(b) * 0.48], 0.87, outline, 0.0009), spores: ModelPart[] = [];
      parts.push(blade);
      const count = blade.vertices!.length / 2;
      for (let i = 0; i < blade.indices!.length; i += 9) { const triangle = blade.indices!.slice(i, i + 3); if (triangle.length < 3 || triangle.some(index => index >= count)) continue; const face = triangle.map(index => blade.vertices![index]!), p = [0, 1, 2].map(axis => face.reduce((sum, v) => sum + (axis === 0 ? v.x : axis === 1 ? v.y : v.z), 0) / 3) as Triple; spores.push(lobe("破伞蕨下表面散生而非连续横纹的独立囊群", brown, [top[0] + p[0], top[1] + p[1] - 0.00025, top[2] + p[2]], [0.0016, 0.0014, 0.0016])); }
      parts.push(combineMeshes("破伞蕨大扇叶背面零散的真实小囊群", brown, spores));
    }
  }
  return parts;
}

function whiteFalseHellebore(): ModelPart[] {
  const parts: ModelPart[] = [tapered("白藜芦粗直而不分叉的长花秆", pale, [[0, 0, 0], [0, 1.92, 0]], [0.018, 0.002])];
  for (let leaf = 0; leaf < 12; leaf++) {
    const a = leaf * 2.4, y = 0.03 + leaf * 0.079, length = 0.3 - leaf * 0.01;
    parts.push(pleatedLeaf("白藜芦互生且沿平行脉形成真实深褶的宽椭圆叶", [0, y, 0], [Math.cos(a) * length * 0.8, y + length * 0.58, Math.sin(a) * length * 0.8], length * 0.48, 0.055));
  }
  for (let branch = 0; branch < 10; branch++) {
    const a = branch * 2.4, y = 1.26 + branch * 0.062, reach = 0.22 - branch * 0.014, tip: Triple = [Math.cos(a) * reach, y + 0.09, Math.sin(a) * reach], flowers: ModelPart[] = [];
    parts.push(tapered("白藜芦细密圆锥花序中真实分出的细侧轴", pale, [[0, y, 0], tip], [0.0023, 0.0005]));
    for (let flower = 0; flower < 9; flower++) { const t = 0.12 + flower * 0.105, base: Triple = [tip[0] * t, y + 0.09 * t, tip[2] * t], b = a + (flower % 2 ? 0.8 : -0.8), p: Triple = [base[0] + Math.cos(b) * 0.007, base[1] + 0.004, base[2] + Math.sin(b) * 0.007]; flowers.push(needle("白藜芦单朵六被小星花的实际短柄", pale, base, p, 0.0007), petals(6, p, 0.0035, 0.0095, 80, cream), lobe("白藜芦星花中央的短绿色子房", pale, [p[0], p[1] + 0.002, p[2]], [0.003, 0.004, 0.003])); }
    for (let i = 0; i < flowers.length; i += 15) parts.push(combineMeshes("白藜芦分枝轴上完整独立的六被小星花", cream, flowers.slice(i, i + 15)));
  }
  return parts;
}

function greatYellowGentian(): ModelPart[] {
  const parts: ModelPart[] = [tapered("黄花龙胆不分叉且上部多层轮花的粗直主茎", pale, [[0, 0, 0], [0, 1.37, 0]], [0.012, 0.002])];
  for (let leaf = 0; leaf < 6; leaf++) { const a = leaf * Math.PI / 3; parts.push(pleatedLeaf("黄花龙胆基生莲座中具深压脉的宽卵叶", [0, 0.018, 0], [Math.cos(a) * 0.23, 0.15 + leaf % 2 * 0.03, Math.sin(a) * 0.23], 0.12, 0.017)); }
  for (let node = 0; node < 5; node++) {
    const y = 0.34 + node * 0.205, angle = node % 2 * Math.PI / 2;
    for (const side of [-1, 1]) { const a = angle + (side < 0 ? Math.PI : 0), length = 0.17 - node * 0.017; parts.push(pleatedLeaf("黄花龙胆同节对生且宽基直接抱住茎的卵叶", [0, y, 0], [Math.cos(a) * length, y + 0.08, Math.sin(a) * length], length * 0.55, 0.017)); }
    if (node === 0) continue;
    const flowers: ModelPart[] = [];
    for (let flower = 0; flower < 7; flower++) {
      const a = flower * Math.PI * 2 / 7 + node, p: Triple = [Math.cos(a) * 0.015, y + 0.008, Math.sin(a) * 0.015], axis: ModelPart = sweptProfile("黄花龙胆深裂花瓣下仍相连的短小开口基管", yellow, [[0.0027, 0], [0.0031, 0.004], [0.0024, 0.004], [0.0021, 0]], Math.PI * 2, 8);
      axis.position = { x: p[0], y: p[1], z: p[2] };
      const pieces: ModelPart[] = [axis, needle("黄花龙胆短柄把独立黄花接到上部叶腋", pale, [0, y, 0], p, 0.001)];
      for (let petal = 0; petal < 5; petal++) { const b = petal * Math.PI * 0.4, root: Triple = [p[0] + Math.cos(b) * 0.0027, p[1] + 0.0036, p[2] + Math.sin(b) * 0.0027]; pieces.push(radialBlade("黄花龙胆深分到基部的五枚狭长离开裂瓣", yellow, root, 0.004, 0.022, 47, petal * 72), needle("黄花龙胆花内与狭长裂瓣对应的五根细雄蕊", yellow, p, [p[0] + Math.cos(b) * 0.003, p[1] + 0.019, p[2] + Math.sin(b) * 0.003], 0.0006)); }
      flowers.push(combineMeshes("黄花龙胆非长蓝喇叭的深五裂黄色单花", yellow, pieces));
    }
    for (let i = 0; i < flowers.length; i += 3) parts.push(combineMeshes("黄花龙胆直接环绕上部叶腋的完整黄花轮", yellow, flowers.slice(i, i + 3)));
  }
  return parts;
}

function clarySage(): ModelPart[] {
  const parts: ModelPart[] = [part("快乐鼠尾草真正四角截面的直立草茎", "box", pale, [0, 0.47, 0], [0.008, 0.94, 0.008])];
  const crenate: [number, number][] = [[0, 0], [-0.2, 0.03], [-0.38, 0.18], [-0.31, 0.23], [-0.48, 0.35], [-0.4, 0.41], [-0.5, 0.54], [-0.39, 0.59], [-0.34, 0.77], [-0.24, 0.79], [0, 1], [0.24, 0.79], [0.34, 0.77], [0.39, 0.59], [0.5, 0.54], [0.4, 0.41], [0.48, 0.35], [0.31, 0.23], [0.38, 0.18], [0.2, 0.03]];
  for (let node = 0; node < 5; node++) for (const side of [-1, 1]) { const a = node % 2 * Math.PI / 2 + (side < 0 ? Math.PI : 0), y = 0.018 + node * 0.105, p: Triple = [Math.cos(a) * 0.025, y + 0.012, Math.sin(a) * 0.025], length = 0.2 - node * 0.021; parts.push(needle("快乐鼠尾草宽对生叶的单独短柄", pale, [0, y, 0], p, 0.0018), flatLeaf("快乐鼠尾草基部巨大而有圆钝齿的宽卵叶", p, [p[0] + Math.cos(a) * length, p[1] + 0.037, p[2] + Math.sin(a) * length], length * 0.65, crenate, 0.0009)); }
  for (let branch = 0; branch < 3; branch++) {
    const a = branch * 2.4, path: Triple[] = [[0, branch ? 0.47 : 0.58, 0], [Math.cos(a) * (branch ? 0.12 : 0), 0.96 - branch * 0.07, Math.sin(a) * (branch ? 0.12 : 0)]], bracts: ModelPart[] = [], flowers: ModelPart[] = [];
    if (branch) parts.push(tapered("快乐鼠尾草上部细长分枝花轴", pale, path, [0.0032, 0.0008]));
    for (let node = 0; node < 5; node++) {
      const base = axisPosition(path, 0.16 + node * 0.17);
      for (const side of [-1, 1]) { const heading = a + (side < 0 ? Math.PI : 0), p: Triple = [base[0] + Math.cos(heading) * 0.006, base[1], base[2] + Math.sin(heading) * 0.006]; bracts.push(radialBlade("快乐鼠尾草比小花更显眼的宽紫粉花苞叶", "#b9a8b8", p, 0.025, 0.035, 75, heading * 180 / Math.PI)); for (let flower = 0; flower < 2; flower++) { const b = heading + (flower - 0.5) * 0.6, root: Triple = [p[0] + Math.cos(b) * 0.005, p[1] + 0.008, p[2] + Math.sin(b) * 0.005]; flowers.push(needle("快乐鼠尾草大苞片上方双唇花的真正短柄", pale, p, root, 0.0007), smallCorolla(root, [Math.cos(b), 0.15, Math.sin(b)], 0.016, 0.004, "#d1c1c6", true, 5, 8)); } }
    }
    parts.push(combineMeshes("快乐鼠尾草长分枝上逐层展开的完整紫粉苞片", "#b9a8b8", bracts));
    for (let i = 0; i < flowers.length; i += 6) parts.push(combineMeshes("快乐鼠尾草苞片之间真正带细梗的双唇小花", "#d1c1c6", flowers.slice(i, i + 6)));
  }
  return parts;
}

function poisonHemlock(): ModelPart[] {
  const parts: ModelPart[] = [part("毒参高大光滑且真正中空的草质秆", "lathe", pale, [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0.022, y: 0 }, { x: 0.008, y: 2.52 }, { x: 0.005, y: 2.52 }, { x: 0.017, y: 0 }, { x: 0.022, y: 0 }] })];
  const spots: ModelPart[] = [];
  for (let spot = 0; spot < 40; spot++) { const a = spot * Math.PI / 4, y = 0.06 + spot % 17 * 0.066, r = 0.022 - 0.014 * y / 2.52; spots.push(lobe("毒参秆面附着的真实小紫斑而非空腔黑片", "#a998a1", [Math.cos(a) * r, y, Math.sin(a) * r], [0.005, 0.011, 0.0014], [0, 90 - a * 180 / Math.PI, 0])); }
  parts.push(combineMeshes("毒参下部绿秆上细小而不成环的紫色斑", "#a998a1", spots));
  for (let leaf = 0; leaf < 5; leaf++) {
    const a = leaf * 2.4, y = 0.12 + leaf * 0.25, tip: Triple = [Math.cos(a) * 0.39, y + 0.15, Math.sin(a) * 0.39], pieces: ModelPart[] = [needle("毒参多回羽叶的真实主叶柄", pale, [0, y, 0], tip, 0.003)];
    for (let node = 0; node < 3; node++) for (const side of [-1, 1]) {
      const t = 0.2 + node * 0.28, root: Triple = [tip[0] * t, y + 0.15 * t, tip[2] * t], b = a + side * 1.11, end: Triple = [root[0] + Math.cos(b) * 0.16, root[1] + 0.027, root[2] + Math.sin(b) * 0.16];
      pieces.push(needle("毒参二回羽状细叶的分立侧羽轴", pale, root, end, 0.0014));
      for (let twig = 0; twig < 3; twig++) for (const edge of [-1, 1]) { const u = 0.2 + twig * 0.31, p: Triple = root.map((v, axis) => v + (end[axis]! - v) * u) as Triple, c = b + edge * 1.1, distal: Triple = [p[0] + Math.cos(c) * 0.052, p[1] + 0.009, p[2] + Math.sin(c) * 0.052]; pieces.push(needle("毒参第三回深裂叶的更细羽轴", pale, p, distal, 0.0007)); for (const fin of [-1, 1]) { const d = c + fin * 0.95; pieces.push(thinLeaf(flatLeaf("毒参末级深裂成细齿的真实小叶片", distal, [distal[0] + Math.cos(d) * 0.021, distal[1] + 0.004, distal[2] + Math.sin(d) * 0.021], 0.008, "lobed", 0.0005))); } }
    }
    for (let i = 0; i < pieces.length; i += 15) parts.push(combineMeshes("毒参保留分枝轴与全部末级细羽片的完整复叶段", green, pieces.slice(i, i + 15)));
  }
  for (let branch = 0; branch < 5; branch++) {
    const a = branch * 2.4, hub: Triple = [Math.cos(a) * 0.33, 2.07 + branch * 0.09, Math.sin(a) * 0.33];
    parts.push(tapered("毒参顶端开放小复伞的独立长梗", pale, [[0, 1.45 + branch * 0.13, 0], hub], [0.005, 0.0018]));
    for (let ray = 0; ray < 6; ray++) { const b = ray * Math.PI / 3, end: Triple = [hub[0] + Math.cos(b) * 0.08, hub[1] + 0.025, hub[2] + Math.sin(b) * 0.08], flowers: ModelPart[] = [needle("毒参一级伞辐是真正细枝而非白球贴片", pale, hub, end, 0.0008)]; for (let flower = 0; flower < 5; flower++) { const c = flower * Math.PI * 0.4, p: Triple = [end[0] + Math.cos(c) * 0.009, end[1] + 0.004, end[2] + Math.sin(c) * 0.009]; flowers.push(needle("毒参末级小伞内的真实单花梗", pale, end, p, 0.0004), petals(5, p, 0.001, 0.0018, 78, cream)); } parts.push(combineMeshes("毒参复伞形花序有细辐和五离瓣小白花的一枝", cream, flowers)); }
  }
  return parts;
}

function compassPlant(): ModelPart[] {
  const parts: ModelPart[] = [tapered("指南草区别于贯叶松香草方秆的粗圆花秆", pale, [[0, 0, 0], [0, 2.63, 0]], [0.016, 0.003])], left: [number, number][] = [];
  for (let lobe = 0; lobe < 7; lobe++) { const y = 0.05 + lobe * 0.122, spread = 0.5 * Math.sin((y + 0.11) * Math.PI); left.push([-0.045, y], [-spread * 0.7, y + 0.013], [-spread, y + 0.045], [-spread * 0.56, y + 0.075], [-0.05, y + 0.092]); }
  const outline: [number, number][] = [[0, 0], ...left, [0, 1], ...[...left].reverse().map(([x, y]): [number, number] => [-x, y])];
  for (let leaf = 0; leaf < 9; leaf++) {
    const a = leaf * 2.4, lower = leaf < 6, y = lower ? 0.17 + leaf % 3 * 0.04 : 0.9 + (leaf - 6) * 0.43, root: Triple = [Math.cos(a) * (lower ? 0.17 : 0.03), y, Math.sin(a) * (lower ? 0.17 : 0.03)], length = lower ? 0.52 - leaf % 2 * 0.04 : 0.32 - (leaf - 6) * 0.06, blade = flatLeaf("指南草七对深羽裂且直向展开的完整大叶", [0, 0, 0], [0, length, 0], length * 0.55, outline, 0.0015);
    blade.position = { x: root[0], y: root[1], z: root[2] }; blade.rotation.y = 90;
    parts.push(tapered("指南草把基生直向叶片抬起的独立长柄", pale, [[0, lower ? 0.018 : y - 0.02, 0], root], [0.005, 0.0025]), blade);
  }
  for (let flower = 0; flower < 6; flower++) {
    const a = flower * 2.4, root: Triple = [Math.cos(a) * 0.21, 2.16 + flower * 0.078, Math.sin(a) * 0.21], bracts: ModelPart[] = [];
    parts.push(tapered("指南草高秆上稀疏开展的大花头短分枝", pale, [[0, 1.96 + flower * 0.1, 0], root], [0.0032, 0.0014]), asterHead(root, 0.05, 28));
    for (let bract = 0; bract < 27; bract++) { const b = bract * 2.4, radius = bract < 14 ? 0.013 : 0.009, p: Triple = [root[0] + Math.cos(b) * radius, root[1] - 0.007, root[2] + Math.sin(b) * radius]; bracts.push(radialBlade("指南草花盘外二层卵形长尖而不是蓄水杯的总苞片", green, p, 0.006, 0.015, 117, b * 180 / Math.PI)); }
    parts.push(combineMeshes("指南草黄花盘下真实分立的长尖总苞片", green, bracts));
  }
  return parts;
}

function giantConeflower(): ModelPart[] {
  const parts: ModelPart[] = [];
  for (let leaf = 0; leaf < 7; leaf++) { const a = leaf * 2.4, root: Triple = [Math.cos(a) * 0.04, 0.03 + leaf % 2 * 0.02, Math.sin(a) * 0.04], blade = flatLeaf("大叶金光菊区别于狭裂叶帽花的大蓝绿基生卵叶", root, [root[0] + Math.cos(a) * 0.37, root[1] + 0.12, root[2] + Math.sin(a) * 0.37], 0.19, "oval", 0.0012); blade.color = "#90a69a"; parts.push(tapered("大叶金光菊宽基叶的真实独立短叶柄", pale, [[0, 0, 0], root], [0.004, 0.0025]), blade); }
  for (let shoot = 0; shoot < 3; shoot++) {
    const a = shoot * 2.4, root: Triple = [Math.cos(a) * 0.08, 1.91 + shoot * 0.04, Math.sin(a) * 0.08], rays: ModelPart[] = [], florets: ModelPart[] = [];
    parts.push(tapered("大叶金光菊高出宽基叶丛且近乎无叶的长裸花葶", pale, [[0, 0, 0], root], [0.006, 0.0018]), tapered("大叶金光菊长于下垂舌花的真正长锥花托", brown, [root, [root[0], root[1] + 0.067, root[2]], [root[0], root[1] + 0.12, root[2]]], [0.014, 0.011, 0.0013]));
    for (let ray = 0; ray < 12; ray++) rays.push(radialBlade("大叶金光菊长锥花盘基部的一圈狭下垂黄舌花", yellow, root, 0.008, 0.043, 135, ray * 30));
    for (let floret = 0; floret < 44; floret++) { const b = floret * 2.4, t = (floret + 0.5) / 44, r = t < 0.558 ? 0.014 - 0.003 * t / 0.558 : 0.011 - 0.0097 * (t - 0.558) / 0.442; florets.push(lobe("大叶金光菊长锥表面真实相接的小管花颗粒", "#b09d75", [root[0] + Math.cos(b) * r * 0.91, root[1] + t * 0.12, root[2] + Math.sin(b) * r * 0.91], [0.004, 0.004, 0.004])); }
    parts.push(combineMeshes("大叶金光菊长锥下完整分离的黄花裙", yellow, rays));
    for (let i = 0; i < florets.length; i += 30) parts.push(combineMeshes("大叶金光菊长锥表面真实凸起的分离管花", "#b09d75", florets.slice(i, i + 30)));
  }
  return parts;
}

export const herbaceousExpansionBatchTenDesigns: MasterNatureDesign[] = [
  design("europeanRoyalFernPlant", "真紫萁", "植物", europeanRoyalFern, ["Osmunda regalis", "同片宽二回羽叶顶端狭缩成棕色孢子羽"]),
  design("interruptedFernPlant", "绒毛紫萁", "植物", interruptedFern, ["Osmunda claytoniana", "Claytosmunda claytoniana", "Osmundastrum claytoniana", "同一叶轴中部四对孢子羽隔开上下绿色深裂羽片"]),
  design("westernSwordFernPlant", "西部剑蕨", "植物", westernSwordFern, ["Polystichum munitum", "长单回剑叶交错耳基尖锯羽片与叶背圆囊群"]),
  design("umbrellaFernPlant", "破伞蕨", "植物", umbrellaFern, ["Dipteris conjugata", "长裸柄顶端真正二分且重复深裂的双扇大叶"]),
  design("whiteFalseHelleborePlant", "白藜芦", "植物", whiteFalseHellebore, ["Veratrum album", "互生平行深褶宽叶和顶端分枝六被白星花"]),
  design("greatYellowGentianPlant", "黄花龙胆", "植物", greatYellowGentian, ["Gentiana lutea", "宽对生抱秆叶上多层腋生深五裂黄花轮"]),
  design("clarySagePlant", "快乐鼠尾草", "植物", clarySage, ["Salvia sclarea", "南欧丹参", "宽圆齿对生大叶与长分枝上显著紫粉苞片和双唇花"]),
  design("poisonHemlockPlant", "毒参", "植物", poisonHemlock, ["Conium maculatum", "高大中空紫点秆多回细裂叶与小白复伞"]),
  design("compassPlant", "指南草", "植物", compassPlant, ["Silphium laciniatum", "互生直向深羽裂大叶圆秆和高稀枝大黄头花"]),
  design("giantConeflowerPlant", "大叶金光菊", "植物", giantConeflower, ["Rudbeckia maxima", "宽蓝绿基叶近裸高葶与长锥盘下的黄舌花裙"]),
];
