import { cap, combineMeshes, design, leaf, lobe, needle, petals, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { flatLeaf } from "./ediblePlants";
import { hollowPipe } from "./shapedFoods";
import { stemPoint } from "./springShrubs";
import { pointed } from "./insectForms";

const green = "#91a17c";
const pale = "#bdc5a3";
const cream = "#d1cdb4";

function blackPepper(): ModelPart[] {
  const path: Triple[] = [[0, 0, 0], [0.21, 0.17, 0.04], [0.55, 0.31, 0], [0.87, 0.18, 0.1], [1.1, 0.08, 0.08]], parts: ModelPart[] = [tapered("胡椒植株能依地面自然拱起的低位木质藤", "#a6a28c", path, [0.012, 0.009, 0.007, 0.005, 0.002])];
  for (let node = 0; node < 10; node++) { const p = stemPoint(path, 0.08 + node * 0.085), side = node % 2 ? -1 : 1, leafRoot: Triple = [p[0] + 0.012, p[1] + 0.015, p[2] + side * 0.027]; parts.push(needle("胡椒互生叶独立的短叶柄", green, p, leafRoot, 0.002), flatLeaf("胡椒有圆钝叶基的革质尖卵叶", leafRoot, [leafRoot[0] + 0.045, leafRoot[1] + 0.036, leafRoot[2] + side * 0.13], 0.073));
    if (node < 2 || node > 7) continue;
    const end: Triple = [p[0] + 0.03, p[1] - 0.075, p[2] - side * 0.014], berries: ModelPart[] = []; parts.push(tapered("胡椒与叶对生位置伸出的下垂果穗轴", green, [p, end], [0.0013, 0.00065]));
    for (let i = 0; i < 24; i++) { const t = (i + 1) / 25, a = i * 2.4, root: Triple = [p[0] + (end[0] - p[0]) * t, p[1] + (end[1] - p[1]) * t, p[2] + (end[2] - p[2]) * t]; berries.push(lobe("胡椒不是融合实棒而是逐颗可辨的三毫米核果", pale, [root[0] + Math.cos(a) * 0.0014, root[1], root[2] + Math.sin(a) * 0.0014], [0.0035, 0.0035, 0.0035])); }
    parts.push(combineMeshes("胡椒一穗真正分离又相连的圆核果", pale, berries));
  }
  return parts;
}

function nippleFruit(): ModelPart[] {
  const parts: ModelPart[] = [tapered("乳茄粗壮而上部分叉的草本主茎", green, [[0, 0, 0], [0, 0.48, 0], [0.025, 0.98, 0]], [0.015, 0.009, 0.002])];
  for (let node = 0; node < 8; node++) { const a = node * 2.4, y = 0.08 + node * 0.095, x = Math.max(0, (y - 0.48) / 0.5) * 0.025, p: Triple = [x + Math.cos(a) * 0.035, y + 0.012, Math.sin(a) * 0.035], end: Triple = [p[0] + Math.cos(a) * 0.15, p[1] + 0.035, p[2] + Math.sin(a) * 0.15]; parts.push(needle("乳茄宽裂叶的粗叶柄", green, [x, y, 0], p, 0.003), flatLeaf("乳茄具有宽裂片的绒质大叶", p, end, 0.12, "lobed"));
    const spines: ModelPart[] = []; for (let i = 0; i < 4; i++) { const t = 0.1 + i * 0.2, root: Triple = [p[0] + (end[0] - p[0]) * t, p[1] + (end[1] - p[1]) * t + 0.0015, p[2] + (end[2] - p[2]) * t]; spines.push(pointed("乳茄长在叶片主脉上的真实反曲皮刺", pale, [root, [root[0] - Math.cos(a) * 0.003, root[1] + 0.011, root[2] - Math.sin(a) * 0.003]], [0.0018, 0])); } parts.push(combineMeshes("乳茄每片大叶上相连的脉刺", pale, spines));
    if (node < 3 || node % 3) continue;
    const fruit: Triple = [x + Math.cos(a + 1.4) * 0.07, y - 0.045, Math.sin(a + 1.4) * 0.07]; parts.push(tapered("乳茄果实从茎节真实垂下的粗梗", green, [[x, y, 0], fruit], [0.003, 0.0015]), tapered("乳茄上窄下圆的梨状黄色主果体", "#c4bc93", [fruit, [fruit[0], fruit[1] - 0.047, fruit[2]], [fruit[0], fruit[1] - 0.073, fruit[2]]], [0.009, 0.032, 0.021]));
    const nipples: ModelPart[] = []; for (let i = 0; i < 5; i++) { const b = i * Math.PI * 2 / 5; nipples.push(tapered("乳茄果实基部真正相连的乳突状侧凸", "#c4bc93", [[fruit[0] + Math.cos(b) * 0.016, fruit[1] - 0.058, fruit[2] + Math.sin(b) * 0.016], [fruit[0] + Math.cos(b) * 0.039, fruit[1] - 0.064, fruit[2] + Math.sin(b) * 0.039], [fruit[0] + Math.cos(b) * 0.043, fruit[1] - 0.053, fruit[2] + Math.sin(b) * 0.043]], [0.014, 0.009, 0.003])); } parts.push(combineMeshes("乳茄一枚果体完整的五乳突而非五颗果", "#c4bc93", nipples));
  }
  return parts;
}

function scallion(): ModelPart[] {
  const parts: ModelPart[] = [tapered("大葱地上可见的细长叶鞘假茎而非球葱", cream, [[0, 0, 0], [0, 0.18, 0]], [0.015, 0.012])];
  for (let i = 0; i < 7; i++) { const a = i * 2.4, path: Triple[] = [[0, 0.12 + i % 3 * 0.012, 0], [Math.cos(a) * 0.036, 0.52 + i % 2 * 0.06, Math.sin(a) * 0.036], [Math.cos(a) * 0.13, 0.78 - i % 3 * 0.09, Math.sin(a) * 0.13]], p = hollowPipe("大葱圆管形且内腔真实贯通的渐尖叶", path, 0.0085, 0.006); p.color = green;
    p.vertices = p.vertices!.map((v, index) => { const row = Math.floor(index / 16), root = path[row]!, ratio = [1, 0.8, 0.1][row]!; return { x: root[0] + (v.x - root[0]) * ratio, y: root[1] + (v.y - root[1]) * ratio, z: root[2] + (v.z - root[2]) * ratio }; }); parts.push(p, lobe("葱管叶真实封合而非敞口的尖端", green, path[2]!, [0.002, 0.004, 0.002]));
  }
  const center: Triple = [0.025, 1.01, 0.008], stem = hollowPipe("大葱中空且高于管叶的长花葶", [[0, 0.1, 0], [0.012, 0.55, 0], center], 0.006, 0.004); stem.color = green; parts.push(stem); const flowers: ModelPart[] = [];
  for (let i = 0; i < 36; i++) { const a = i * 2.4, y = -0.85 + i / 35 * 1.7, r = Math.sqrt(1 - y * y), p: Triple = [center[0] + Math.cos(a) * r * 0.041, center[1] + y * 0.041, center[2] + Math.sin(a) * r * 0.041]; flowers.push(needle("大葱球状伞形花序共同中心相连的花柄", pale, center, p, 0.0007), petals(6, p, 0.0013, 0.003, 74, cream)); }
  for (let i = 0; i < flowers.length; i += 10) parts.push(combineMeshes("大葱球状花序一整组相连的六瓣小花", cream, flowers.slice(i, i + 10))); return parts;
}

function wildRice(): ModelPart[] {
  const parts: ModelPart[] = [];
  for (let tiller = 0; tiller < 5; tiller++) { const a = tiller * 2.4, root: Triple = [Math.cos(a) * 0.037, 0, Math.sin(a) * 0.037], top: Triple = [root[0] + Math.cos(a) * 0.055, 0.32 + tiller % 2 * 0.055, root[2] + Math.sin(a) * 0.055]; parts.push(tapered("茭白采收植株地上可见的膨大节间", cream, [root, [root[0], 0.12, root[2]], top], [0.019, 0.034, 0.016]));
    for (let leafIndex = 0; leafIndex < 5; leafIndex++) { const t = 0.25 + leafIndex * 0.15, p: Triple = [root[0] + (top[0] - root[0]) * t, top[1] * t, root[2] + (top[2] - root[2]) * t], b = a + leafIndex * 2.4; parts.push(leaf("茭白分蘖上宽线形而带明显中脊的长叶", green, p, 0.035, 1.2 - leafIndex * 0.07, [16 + leafIndex * 5, 90 - b * 180 / Math.PI, 0])); }
  }
  return parts;
}

function pipewort(): ModelPart[] {
  const parts: ModelPart[] = [], leaves: ModelPart[] = [];
  for (let i = 0; i < 18; i++) { const a = i * 2.4; leaves.push(leaf("谷精草由短缩根颈长出的窄线形基生叶", green, [0, 0.001, 0], 0.003, 0.072 + i % 4 * 0.008, [58 + i % 3 * 8, 90 - a * 180 / Math.PI, 0])); } parts.push(combineMeshes("谷精草真正细窄的基生莲座叶", green, leaves));
  for (let i = 0; i < 9; i++) { const a = i * 2.4, top: Triple = [Math.cos(a) * 0.018, 0.115 + i % 4 * 0.021, Math.sin(a) * 0.018]; parts.push(tapered("谷精草不带茎叶的细长裸花葶", pale, [[0, 0.001, 0], top], [0.0008, 0.00045]), cap("谷精草花头下真正杯状相叠的总苞", cream, top, 0.0026, 0.0025, 4)); const head: ModelPart[] = [];
    for (let flower = 0; flower < 13; flower++) { const b = flower * 2.4, r = Math.sqrt(flower / 13) * 0.0022; head.push(lobe("谷精草头状花序上独立的白绒小花", cream, [top[0] + Math.cos(b) * r, top[1] + 0.0025 + (1 - r / 0.0022) * 0.0008, top[2] + Math.sin(b) * r], [0.0011, 0.0013, 0.0011])); } parts.push(combineMeshes("谷精草毫厘尺度的半球形绒花头", cream, head));
  }
  return parts;
}

function cynanchum(): ModelPart[] {
  const path: Triple[] = [[0, 0, 0], [0.19, 0.15, 0.02], [0.42, 0.34, 0], [0.7, 0.23, 0.04], [0.86, 0.1, 0.12]], parts: ModelPart[] = [tapered("鹅绒藤可直接沿地面放置的自然拱形草藤", green, path, [0.005, 0.004, 0.003, 0.002, 0.0008])];
  for (let node = 0; node < 6; node++) { const p = stemPoint(path, 0.14 + node * 0.13); for (const side of [-1, 1]) { const leafRoot: Triple = [p[0] + 0.014, p[1] + 0.009, p[2] + side * 0.022]; parts.push(needle("鹅绒藤对生心叶的真实叶柄", green, p, leafRoot, 0.0018), flatLeaf("鹅绒藤四至九厘米的宽三角心叶", leafRoot, [leafRoot[0] + 0.019, leafRoot[1] + 0.017, leafRoot[2] + side * 0.077], 0.063, "heart")); }
    if (node < 1 || node > 4) continue;
    const center: Triple = [p[0] + 0.025, p[1] + 0.025, p[2]]; parts.push(needle("鹅绒藤由叶腋抽生的伞状聚伞总梗", green, p, center, 0.0012));
    const flowers: ModelPart[] = [];
    for (let flower = 0; flower < 5; flower++) { const a = flower * 2.4, root: Triple = [center[0] + Math.cos(a) * 0.015, center[1] + 0.008, center[2] + Math.sin(a) * 0.015]; flowers.push(needle("鹅绒藤每朵小花共同相连的短花柄", green, center, root, 0.0007), petals(5, root, 0.0016, 0.0045, 80, cream)); const coronas: ModelPart[] = []; for (let filament = 0; filament < 10; filament++) { const b = filament * Math.PI / 5, end: Triple = [root[0] + Math.cos(b) * (filament % 2 ? 0.0015 : 0.0021), root[1] + (filament % 2 ? 0.0025 : 0.004), root[2] + Math.sin(b) * (filament % 2 ? 0.0015 : 0.0021)]; coronas.push(needle("鹅绒藤杯状副花冠真正长短交错的双轮丝裂片", pale, root, end, 0.0004)); } flowers.push(combineMeshes("鹅绒藤与普通五瓣花不同的十丝副花冠", pale, coronas)); }
    for (let i = 0; i < flowers.length; i += 9) parts.push(combineMeshes("鹅绒藤一组真实花柄五裂瓣与十丝副花冠", cream, flowers.slice(i, i + 9)));
  }
  return parts;
}

export const economicPlantDesigns: MasterNatureDesign[] = [
  design("blackPepperPlant", "胡椒植株", "植物", blackPepper, ["Piper nigrum", "互生革叶与下垂的分离小核果穗"]),
  design("nippleFruitPlant", "乳茄", "植物", nippleFruit, ["Solanum mammosum", "叶主脉皮刺与具五乳突的梨状果"]),
  design("scallion", "大葱", "植物", scallion, ["Allium fistulosum", "中空渐尖管叶与球状六瓣花伞"]),
  design("zizania", "茭白", "植物", wildRice, ["Zizania latifolia", "地上膨大节间与宽线形分蘖叶"]),
  design("pipewort", "谷精草", "植物", pipewort, ["Eriocaulon buergerianum", "基生窄线叶裸花葶与微型绒头状花"]),
  design("cynanchum", "鹅绒藤", "植物", cynanchum, ["Cynanchum chinense", "对生宽心叶与十丝副花冠"]),
];
