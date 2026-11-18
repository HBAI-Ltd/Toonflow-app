import { combineMeshes, design, needle, part, polygon, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { flatLeaf } from "./ediblePlants";
import { hollowPipe } from "./shapedFoods";
import { branchPoint } from "./woodyExpansionBatchOne";
import { flatNeedle } from "./woodyExpansionBatchTen";

const green = "#829b72";
const pale = "#a9b18a";
const wood = "#aaa18c";
const fiberColor = "#756e59";

// 形态依据仅用于原创几何，不引用远端模型或贴图：
// nparks.gov.sg/florafaunaweb/flora/2/6/2622、2/6/2676、1/9/1965；
// plants.ces.ncsu.edu/plants/dracaena-fragrans/、dracaena-sanderiana/、chamaedorea-elegans/；
// aggie-horticulture.tamu.edu/ornamental/a-reference-guide-to-plant-care-handling-and-merchandising/selected-foliage-flowering-plants/foliage-plants/dragon-tree/

function curvedBlade(name: string, root: Triple, angle: number, profile: Triple[], thickness = .0008): ModelPart {
  const vertices: { x: number; y: number; z: number }[] = [], front: number[] = [], count = profile.length * 3;
  for (const lower of [false, true]) for (const [reach, height, halfWidth] of profile) for (const across of [-1, 0, 1]) {
    vertices.push({ x: Math.cos(angle) * reach - Math.sin(angle) * across * halfWidth, y: height + (across === 0 ? halfWidth * .16 : 0) - (lower ? thickness : 0), z: Math.sin(angle) * reach + Math.cos(angle) * across * halfWidth });
  }
  for (let row = 0; row < profile.length - 1; row++) for (let column = 0; column < 2; column++) { const a = row * 3 + column, b = a + 1, c = a + 3, d = c + 1; front.push(a, b, c, b, d, c); }
  const indices = [...front];
  for (let index = 0; index < front.length; index += 3) indices.push(front[index]! + count, front[index + 2]! + count, front[index + 1]! + count);
  const edge = [0, 1, 2, ...Array.from({ length: profile.length - 1 }, (_, row) => (row + 1) * 3 + 2), count - 2, count - 3, ...Array.from({ length: profile.length - 2 }, (_, row) => (profile.length - 2 - row) * 3)];
  for (let index = 0; index < edge.length; index++) { const a = edge[index]!, b = edge[(index + 1) % edge.length]!; indices.push(a, a + count, b, b, a + count, b + count); }
  return part(name, "mesh", green, root, [1, 1, 1], [0, 0, 0], { vertices, indices });
}

function pairedFrond(name: string, root: Triple, middle: Triple, end: Triple, pairs: number, width: number, bladeLength: number, lift: number): ModelPart[] {
  const angle = Math.atan2(end[2] - root[2], end[0] - root[0]), blades: ModelPart[] = [];
  for (let index = 0; index < pairs; index++) for (const side of [-1, 1]) {
    const t = .16 + index / (pairs - 1) * .80, p = branchPoint(root, middle, end, t, .4), a = angle + side * 1.22, length = bladeLength * Math.sin(t * Math.PI);
    blades.push(flatNeedle(`${name}同一叶轴两侧有独立根点的披针羽片`, p, [p[0] + Math.cos(a) * length, p[1] + length * lift, p[2] + Math.sin(a) * length], width));
  }
  return [tapered(`${name}从叶基到叶尖真实连续的弧叶轴`, pale, [root, middle, end], [.007, .004, .0007]), combineMeshes(`${name}一整片真实成对羽叶`, green, blades)];
}

function arecaClump(): ModelPart[] {
  const parts: ModelPart[] = [], scars: ModelPart[] = [], sheaths: ModelPart[] = [];
  for (let cane = 0; cane < 3; cane++) {
    const a = cane * Math.PI * 2 / 3, height = [2.32, 2.02, 1.78][cane]!, base: Triple = [Math.cos(a) * .065, 0, Math.sin(a) * .065], middle: Triple = [Math.cos(a) * .12, height * .55, Math.sin(a) * .12], top: Triple = [Math.cos(a) * .20, height, Math.sin(a) * .20], radius = .021 - cane * .002;
    parts.push(tapered("散尾葵自然同根簇生而带叶痕的黄绿细秆", pale, [base, middle, top], [radius, radius * .85, radius * .64]));
    for (let node = 0; node < 18; node++) { const t = .07 + node * .047, p = branchPoint(base, middle, top, t, .55), q = branchPoint(base, middle, top, t + .0025, .55), r = t < .55 ? radius * (1 - t / .55 * .15) : radius * (.85 - (t - .55) / .45 * .21); scars.push(tapered("散尾葵黄绿细秆上的浅环状落叶痕", wood, [p, q], [r + .0006, r + .0006])); }
    for (let frond = 0; frond < 4; frond++) {
      const angle = a + frond * 2.4, t = .88 + frond * .025, root = branchPoint(base, middle, top, t, .55), reach = 1.44 + frond % 2 * .16, peak: Triple = [root[0] + Math.cos(angle) * reach * .4, root[1] + .46 - frond * .07, root[2] + Math.sin(angle) * reach * .4], end: Triple = [root[0] + Math.cos(angle) * reach, root[1] - .13 - frond * .08, root[2] + Math.sin(angle) * reach];
      sheaths.push(tapered("散尾葵羽叶基部紧贴黄绿冠轴的包鞘叶基", pale, [branchPoint(base, middle, top, t - .035, .55), root], [radius * .78, radius * .75]));
      parts.push(...pairedFrond("散尾葵四十对柔软狭羽片", root, peak, end, 40, .014, .34, .12));
    }
    parts.push(tapered("散尾葵冠心自然抽出的尚未展开矛叶", green, [top, [top[0] + Math.cos(a) * .12, height + .42, top[2] + Math.sin(a) * .12]], [.012, .0006]));
  }
  for (let offset = 0; offset < scars.length; offset += 24) parts.push(combineMeshes("散尾葵三条自然簇干的完整节环", wood, scars.slice(offset, offset + 24)));
  parts.push(combineMeshes("散尾葵与所有羽叶实际相接的黄绿鞘基", pale, sheaths)); return parts;
}

function ladyFan(root: Triple, angle: number): ModelPart {
  const pieces: ModelPart[] = [], web = polygon("棕竹裂片根部真实连通而未裂到底的掌叶基部", green, [[0, 0], ...Array.from({ length: 9 }, (_, i) => { const a = (i / 8 - .5) * 2; return [Math.sin(a) * .075, Math.cos(a) * .075] as [number, number]; })], .0009, root);
  web.vertices = web.vertices!.map(({ x, y, z }) => ({ x: Math.cos(angle) * z - Math.sin(angle) * x, y: y + z * .28, z: Math.sin(angle) * z + Math.cos(angle) * x })); pieces.push(web);
  const outline: [number, number][] = [[0, 0], [-.36, .12], [-.5, .85], [-.44, 1], [-.23, .94], [0, 1.01], [.21, .93], [.43, .995], [.5, .85], [.36, .12]];
  for (let segment = 0; segment < 7; segment++) {
    const b = (segment / 6 - .5) * 1.85, a = angle + b, reach = .35 - Math.abs(segment - 3) * .018, start: Triple = [root[0] + Math.cos(a) * .025, root[1] + .025 * Math.cos(b) * .28, root[2] + Math.sin(a) * .025], end: Triple = [root[0] + Math.cos(a) * reach, root[1] + reach * Math.cos(b) * .28, root[2] + Math.sin(a) * reach];
    pieces.push(flatLeaf("棕竹末端钝宽并带不规则细齿的完整扇叶裂片", start, end, .073 - Math.abs(segment - 3) * .006, outline, .0009));
  }
  return combineMeshes("棕竹七裂钝齿扇叶与实际连通的掌状叶基", green, pieces);
}

function ladyPalm(): ModelPart[] {
  const parts: ModelPart[] = [], petioles: ModelPart[] = [];
  for (let cane = 0; cane < 4; cane++) {
    const a = cane * 2.4, height = 1.24 + cane * .17, base: Triple = [Math.cos(a) * .025, 0, Math.sin(a) * .025], middle: Triple = [Math.cos(a) * .065, height * .58, Math.sin(a) * .065], top: Triple = [Math.cos(a) * .13, height, Math.sin(a) * .13], fibers: ModelPart[] = [], sheaths: ModelPart[] = [];
    parts.push(tapered("棕竹从共同根颈自然抽出的细竹秆状木质干", fiberColor, [base, middle, top], [.010, .0085, .0065]));
    for (let strand = 0; strand < 18; strand++) { const t = .06 + Math.floor(strand / 2) * .10, b = strand * 2.4, p = branchPoint(base, middle, top, t, .58), q = branchPoint(base, middle, top, t + .09, .58), r = .010 - t * .003; fibers.push(needle("棕竹老叶鞘实际缠在细秆表面的交错粗纤维", fiberColor, [p[0] + Math.cos(b) * r, p[1], p[2] + Math.sin(b) * r], [q[0] + Math.cos(b + 1.5) * (r - .0003), q[1], q[2] + Math.sin(b + 1.5) * (r - .0003)], .0008)); }
    parts.push(combineMeshes("棕竹没有粗树干的黑褐交错叶鞘纤维", fiberColor, fibers));
    for (let leafIndex = 0; leafIndex < 5; leafIndex++) {
      const t = .43 + leafIndex * .13, p = branchPoint(base, middle, top, t, .58), angle = a + leafIndex * 2.4, q: Triple = [p[0] + Math.cos(angle) * .34, p[1] + .15, p[2] + Math.sin(angle) * .34], r = .010 - t * .003;
      petioles.push(tapered("棕竹从干上不同叶节伸到掌叶根部的细硬叶柄", green, [p, q], [.0032, .0018]));
      const sheath = hollowPipe("棕竹每片扇叶基部宿存的粗纤维半包叶鞘", [[p[0], p[1] - .043, p[2]], p], r + .0012, r + .0005, Math.PI * 1.6, angle - Math.PI * .8); sheath.color = fiberColor; sheaths.push(sheath); parts.push(ladyFan(q, angle));
    }
    parts.push(combineMeshes("棕竹沿细秆上下宿存的完整纤维叶鞘", fiberColor, sheaths));
  }
  parts.push(combineMeshes("棕竹所有掌叶真实相连的长叶柄", green, petioles)); return parts;
}

function cornPlant(): ModelPart[] {
  const base: Triple = [0, 0, 0], middle: Triple = [.015, .94, -.008], top: Triple = [.025, 1.72, -.01], parts: ModelPart[] = [tapered("巴西木自然未截顶的完整无分枝粗木质秆", wood, [base, middle, top], [.032, .026, .017])], blades: ModelPart[] = [], sheaths: ModelPart[] = [], scars: ModelPart[] = [];
  for (let node = 0; node < 19; node++) { const t = .035 + node * .024, p = branchPoint(base, middle, top, t, .94 / 1.72), q = branchPoint(base, middle, top, t + .002, .94 / 1.72), r = .032 - t / (.94 / 1.72) * .006; scars.push(tapered("巴西木叶下宽粗木质秆上实际环绕的旧叶痕", pale, [p, q], [r + .0005, r + .0005])); }
  for (let leafIndex = 0; leafIndex < 24; leafIndex++) {
    const t = .49 + leafIndex / 23 * .50, p = branchPoint(base, middle, top, t, .94 / 1.72), a = leafIndex * 2.4, r = t < .94 / 1.72 ? .032 - t / (.94 / 1.72) * .006 : .026 - (t - .94 / 1.72) / (1 - .94 / 1.72) * .009, span = .41 + leafIndex % 3 * .025, rise = leafIndex < 15 ? .17 : .26, droop = leafIndex < 15 ? -.13 : .04;
    const sheath = hollowPipe("巴西木宽带叶基部真实无柄抱茎的开放叶鞘", [[p[0], p[1] - .045, p[2]], [p[0], p[1] + .008, p[2]]], r + .0013, r + .0005, Math.PI * 1.55, a - Math.PI * .775); sheath.color = green; sheaths.push(sheath);
    blades.push(curvedBlade("巴西木带凸中脉且由抱茎叶基连续拱垂的宽带叶", [p[0] + Math.cos(a) * r, p[1] + .008, p[2] + Math.sin(a) * r], a, [[0, 0, .007], [span * .18, rise * .65, .029], [span * .45, rise, .039], [span * .73, rise * .70, .035], [span * .94, droop + .04, .018], [span, droop, .00035]], .0011));
  }
  for (let offset = 0; offset < blades.length; offset += 12) parts.push(combineMeshes("巴西木沿无分枝主秆螺旋排列的完整宽叶群", green, blades.slice(offset, offset + 12)));
  for (let offset = 0; offset < sheaths.length; offset += 12) parts.push(combineMeshes("巴西木与叶片根部连续相接的全部抱茎叶鞘", green, sheaths.slice(offset, offset + 12)));
  parts.push(combineMeshes("巴西木叶冠下无分枝秆的完整落叶痕", pale, scars)); return parts;
}

function marginataPlant(): ModelPart[] {
  const junction: Triple = [.015, 1.02, 0], parts: ModelPart[] = [tapered("千年木自然连续长到分叉点的细木质主干", wood, [[0, 0, 0], [-.018, .55, .012], junction], [.020, .016, .013])], scars: ModelPart[] = [], sheaths: ModelPart[] = [];
  for (let branch = 0; branch < 3; branch++) {
    const a = branch * 2.4, middle: Triple = [Math.cos(a) * .13, 1.43 + branch * .17, Math.sin(a) * .13], top: Triple = [Math.cos(a) * .27, 1.87 + branch * .29, Math.sin(a) * .27], blades: ModelPart[] = [];
    parts.push(tapered("千年木自然分枝后细长而不截成商品截干的枝干", wood, [junction, middle, top], [.012, .009, .0055]));
    for (let node = 0; node < 18; node++) { const t = .07 + node * .043, p = branchPoint(junction, middle, top, t, .45), q = branchPoint(junction, middle, top, t + .003, .45), r = t < .45 ? .012 - t / .45 * .003 : .009 - (t - .45) / .55 * .0035; scars.push(tapered("千年木细叉枝上紧密浅环状老叶痕", pale, [p, q], [r + .00035, r + .00035])); }
    for (let leafIndex = 0; leafIndex < 30; leafIndex++) {
      const t = .90 + leafIndex / 29 * .095, p = branchPoint(junction, middle, top, t, .45), r = .009 - (t - .45) / .55 * .0035, angle = a + leafIndex * 2.4, span = .33 + leafIndex % 3 * .025, lift = leafIndex < 19 ? .095 : .22, drop = leafIndex < 19 ? -.16 : .08;
      const ring: [number, number][] = [r + .0007, r + .0002].flatMap((radius, shell) => Array.from({ length: 5 }, (_, i) => { const b = angle + ((shell ? 4 - i : i) / 4 - .5) * Math.PI * 1.4; return [Math.cos(b) * radius, Math.sin(b) * radius] as [number, number]; }));
      sheaths.push(polygon("千年木顶端密螺旋狭叶实际贴茎的短窄鞘基", green, ring, .012, [p[0], p[1] - .012, p[2]]));
      blades.push(curvedBlade("千年木带细凸脊并在远端柔垂的完整狭带叶", [p[0] + Math.cos(angle) * r, p[1], p[2] + Math.sin(angle) * r], angle, [[0, 0, .002], [span * .18, lift * .75, .0056], [span * .45, lift, .006], [span * .74, lift * .5, .005], [span * .94, drop + .035, .0028], [span, drop, .00025]]));
    }
    for (let offset = 0; offset < blades.length; offset += 12) parts.push(combineMeshes("千年木一条自然细叉枝顶端的密簇狭长叶冠", green, blades.slice(offset, offset + 12)));
  }
  for (let offset = 0; offset < scars.length; offset += 24) parts.push(combineMeshes("千年木细分枝上的完整密集叶环", pale, scars.slice(offset, offset + 24)));
  for (let offset = 0; offset < sheaths.length; offset += 12) parts.push(combineMeshes("千年木密簇狭叶根部的全部短叶鞘", green, sheaths.slice(offset, offset + 12))); return parts;
}

function luckyBamboo(): ModelPart[] {
  const parts: ModelPart[] = [], leaves: ModelPart[] = [], sheaths: ModelPart[] = [], nodes: ModelPart[] = [];
  for (let cane = 0; cane < 3; cane++) {
    const a = cane * 2.4, base: Triple = [Math.cos(a) * .015, 0, Math.sin(a) * .015], middle: Triple = [Math.cos(a) * .045, .53 + cane * .04, Math.sin(a) * .045], top: Triple = [Math.cos(a) * .10, 1.12 + cane * .11, Math.sin(a) * .10], middleAt = middle[1] / top[1];
    parts.push(tapered("富贵竹自然同根生长而非剪截捆扎的绿色肉质节秆", green, [base, middle, top], [.011, .009, .0045]));
    for (let node = 0; node < 14; node++) {
      const t = .07 + node * .064, p = branchPoint(base, middle, top, t, middleAt), q = branchPoint(base, middle, top, t + .003, middleAt), r = t < middleAt ? .011 - t / middleAt * .002 : .009 - (t - middleAt) / (1 - middleAt) * .0045;
      nodes.push(tapered("富贵竹叶基位置真实隆起而非竹节空管的茎环", pale, [p, q], [r + .0008, r + .0008]));
      if (node < 3) continue;
      const angle = a + node * 2.4, span = .23 - (node > 10 ? (node - 10) * .014 : 0), sheath = hollowPipe("富贵竹每个疏散叶节直接抱住绿秆的无柄叶鞘", [[p[0], p[1] - .025, p[2]], [p[0], p[1] + .005, p[2]]], r + .001, r + .0003, Math.PI * 1.5, angle - Math.PI * .75); sheath.color = green; sheaths.push(sheath);
      leaves.push(curvedBlade("富贵竹沿上半节秆疏散互生而没有独立长叶柄的柔韧披针叶", [p[0] + Math.cos(angle) * r, p[1] + .005, p[2] + Math.sin(angle) * r], angle, [[0, 0, .003], [span * .18, .035, .014], [span * .48, .07, .021], [span * .78, .065, .016], [span, .018, .0003]]));
    }
    leaves.push(curvedBlade("富贵竹自然生长顶端尚未展开的完整新叶", top, a + .6, [[0, 0, .002], [.025, .06, .009], [.055, .13, .008], [.075, .18, .0003]]));
  }
  for (let offset = 0; offset < leaves.length; offset += 15) parts.push(combineMeshes("富贵竹沿绿色节秆分开排列的完整无柄披针叶", green, leaves.slice(offset, offset + 15)));
  for (let offset = 0; offset < sheaths.length; offset += 12) parts.push(combineMeshes("富贵竹真正连接秆与叶片的开放抱茎叶鞘", green, sheaths.slice(offset, offset + 12)));
  for (let offset = 0; offset < nodes.length; offset += 24) parts.push(combineMeshes("富贵竹未剪截自然节秆上的全部叶节环", pale, nodes.slice(offset, offset + 24))); return parts;
}

function parlorPalm(): ModelPart[] {
  const base: Triple = [0, 0, 0], middle: Triple = [.008, .56, 0], top: Triple = [.016, 1.14, .006], parts: ModelPart[] = [tapered("袖珍椰子自然独生而非商业同盆多株的细绿干", green, [base, middle, top], [.0075, .0065, .0047])], scars: ModelPart[] = [], sheaths: ModelPart[] = [];
  for (let node = 0; node < 17; node++) { const t = .045 + node * .047, p = branchPoint(base, middle, top, t, .56 / 1.14), q = branchPoint(base, middle, top, t + .0025, .56 / 1.14), r = t < .56 / 1.14 ? .0075 - t / (.56 / 1.14) * .001 : .0065 - (t - .56 / 1.14) / (1 - .56 / 1.14) * .0018; scars.push(tapered("袖珍椰子单根细绿干上的窄浅落叶环", pale, [p, q], [r + .0004, r + .0004])); }
  for (let frond = 0; frond < 7; frond++) {
    const t = .43 + frond * .085, p = branchPoint(base, middle, top, t, .56 / 1.14), a = frond * 2.4, reach = .43 + frond % 3 * .035, peak: Triple = [p[0] + Math.cos(a) * reach * .4, p[1] + .17, p[2] + Math.sin(a) * reach * .4], end: Triple = [p[0] + Math.cos(a) * reach, p[1] + .045, p[2] + Math.sin(a) * reach], r = .0065 - Math.max(0, t - .56 / 1.14) / (1 - .56 / 1.14) * .0018, sheath = hollowPipe("袖珍椰子羽叶叶柄基部真实半抱细干的短鞘", [[p[0], p[1] - .031, p[2]], p], r + .001, r + .0003, Math.PI * 1.55, a - Math.PI * .775); sheath.color = green; sheaths.push(sheath);
    parts.push(...pairedFrond("袖珍椰子十一对疏列的细羽片", p, peak, end, 11, .022, .20, -.08));
  }
  parts.push(tapered("袖珍椰子唯一主干顶端自然抽出的折合新叶", green, [top, [.035, 1.40, .035]], [.0065, .0005]), combineMeshes("袖珍椰子单生绿干的完整叶环", pale, scars), combineMeshes("袖珍椰子沿单干分开排列而真实抱茎的叶基", green, sheaths)); return parts;
}

export const woodyExpansionBatchFourteenDesigns: MasterNatureDesign[] = [
  design("yellowCaneWholePalm", "散尾葵", "植物", arecaClump, ["Chrysalidocarpus lutescens", "Dypsis lutescens", "黄椰子", "同根簇生黄绿细秆与每叶四十对弧垂狭羽片"]),
  design("ladyWholePalm", "棕竹", "植物", ladyPalm, ["Rhapis excelsa", "Rhapis flabelliformis", "细簇干粗纤维鞘与基部相连的钝齿七裂扇叶"]),
  design("cornDracaenaWholePlant", "巴西木", "植物", cornPlant, ["Dracaena fragrans", "Dracaena deremensis", "香龙血树", "完整无分枝木质秆与沿秆螺旋抱茎拱垂宽带叶"]),
  design("marginataWholePlant", "千年木", "植物", marginataPlant, ["Dracaena marginata", "Dracaena reflexa var. angustifolia", "红边龙血树", "自然细叉干与枝顶密螺旋短鞘长狭带叶"]),
  design("luckyBambooWholePlant", "富贵竹", "植物", luckyBamboo, ["Dracaena sanderiana", "开运竹", "万年竹", "自然绿色肉质节秆与沿上半秆疏布的无柄鞘叶"]),
  design("parlorWholePalm", "袖珍椰子", "植物", parlorPalm, ["Chamaedorea elegans", "Collinia elegans", "自然单根细绿干与沿干分开排列的疏羽叶"]),
];
