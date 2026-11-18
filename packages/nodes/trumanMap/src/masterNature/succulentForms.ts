import { Euler, Quaternion, Vector3 } from "three";
import { beam, combineMeshes, design, leaf, lobe, needle, part, petals, polygon, tapered } from "./shared";
import { flatLeaf } from "./ediblePlants";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";

const green = "#879b7c";
const pale = "#b1b99a";
const bark = "#a69d83";
const flower = "#c4b59b";

function fleshyLeaf(name: string, root: Triple, end: Triple, width: number, form = 0): ModelPart {
  const delta = new Vector3(...end).sub(new Vector3(...root)); const length = delta.length();
  let outline: [number, number][] = [[-width * 0.14, 0], [-width * 0.45, length * 0.35], [-width * 0.5, length * 0.72], [0, length], [width * 0.5, length * 0.72], [width * 0.45, length * 0.35], [width * 0.14, 0]];
  if (form === 1) outline = [[-width * 0.15, 0], [-width * 0.45, length * 0.38], [-width * 0.5, length * 0.72], ...Array.from({ length: 9 }, (_, i) => [-width * 0.5 + i * width / 8, length * (i % 2 ? 0.88 : 1)] as [number, number]), [width * 0.43, length * 0.35], [width * 0.15, 0]];
  if (form === 2) outline = [[-width * 0.13, 0], [-width * 0.5, length * 0.6], [-width * 0.45, length * 0.86], [-width * 0.3, length], [-width * 0.1, length * 0.91], [width * 0.1, length], [width * 0.3, length * 0.91], [width * 0.5, length], [width * 0.47, length * 0.65], [width * 0.18, 0]];
  if (form === 3) outline = [[-width * 0.2, 0], [-width * 0.7, length * 0.3], [-width * 0.9, length * 0.65], [-width * 0.45, length], [-width * 0.4, length * 0.6], [width * 0.25, length * 0.25], [width * 0.2, 0]];
  if (form === 4) outline = [[-width * 0.06, 0], [-width * 0.35, length * 0.35], [-width * 0.5, length * 0.48], [-width * 0.34, length * 0.57], [-width * 0.4, length * 0.66], [0, length], [width * 0.4, length * 0.66], [width * 0.34, length * 0.57], [width * 0.5, length * 0.48], [width * 0.35, length * 0.35], [width * 0.06, 0]];
  const value = polygon(name, green, outline, width * 0.2, root);
  const rotation = new Euler().setFromQuaternion(new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), delta.normalize()));
  value.rotation = { x: rotation.x * 180 / Math.PI, y: rotation.y * 180 / Math.PI, z: rotation.z * 180 / Math.PI };
  return value;
}

export function starStem(name: string, root: Triple, height: number, radius: number, lobes: number, ribDepth: number): ModelPart {
  const outline: [number, number][] = Array.from({ length: lobes * 2 }, (_, i) => { const a = i * Math.PI / lobes; const r = i % 2 ? radius * ribDepth : radius; return [Math.cos(a) * r, Math.sin(a) * r]; });
  return polygon(name, green, outline, height, root);
}

function cactus(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  if (kind === 0 || kind === 1) {
    parts.push(lobe("疣突下方短轴", bark, [0, 0.025, 0], [0.08, 0.06, 0.08]));
    const count = kind === 0 ? 15 : 28;
    for (let i = 0; i < count; i++) {
      const a = i * 2.4; const row = Math.floor(i / (kind === 0 ? 5 : 7)); const length = kind === 0 ? 0.15 - row * 0.025 : 0.052 - row * 0.008;
      const root: Triple = [Math.cos(a) * 0.01, 0.018 + row * 0.017, Math.sin(a) * 0.01];
      const end: Triple = [Math.cos(a) * length, root[1] + (kind === 0 ? 0.06 + row * 0.018 : 0.018 + row * 0.007), Math.sin(a) * length];
      parts.push(needle(kind === 0 ? "晃山细长三棱疣突" : "帝冠螺旋重叠三角疣", green, root, end, kind === 0 ? 0.026 : 0.04));
      if (kind === 0) parts.push(needle("疣突顶端纸质长刺", pale, end, [end[0] * 1.25, end[1] + 0.012, end[2] * 1.25], 0.0018));
    }
  } else if (kind === 2) {
    parts.push(starStem("鸾凤玉五棱星状柱体", [0, 0, 0], 0.1, 0.07, 5, 0.42), tapered("棱柱收束的顶端", green, [[0, 0.08, 0], [0, 0.125, 0]], [0.04, 0.008]));
    for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5; for (let row = 0; row < 5; row++) parts.push(lobe("棱缘独立绒毛刺座", pale, [Math.cos(a) * 0.07, 0.014 + row * 0.018, Math.sin(a) * 0.07], [0.005, 0.004, 0.005])); }
  } else if (kind === 3) {
    const grow = (root: Triple, heading: number, level: number) => {
      const end: Triple = [root[0] + Math.cos(heading) * 0.025, root[1] + 0.045 - level * 0.004, root[2] + Math.sin(heading) * 0.025];
      parts.push(tapered("猿恋苇瓶状收颈关节", green, [root, [root[0] * 0.4 + end[0] * 0.6, root[1] + 0.025, root[2] * 0.4 + end[2] * 0.6], end], [0.003, 0.008, 0.004]));
      if (level < 3) for (const turn of [-0.6, 0.65]) grow(end, heading + turn, level + 1);
    };
    for (let i = 0; i < 3; i++) grow([0, 0, 0], i * Math.PI * 2 / 3, 0);
    parts.push(petals(7, [0.075, 0.153, 0], 0.01, 0.018, 65, flower));
  } else {
    parts.push(tapered("丝苇簇生附着轴", bark, [[0, 0, 0], [0, 0.12, 0]], [0.016, 0.009]));
    for (let i = 0; i < 10; i++) { const a = i * 2.4; const end: Triple = [Math.cos(a) * 0.12, 0.025 + i % 3 * 0.015, Math.sin(a) * 0.12]; parts.push(tapered("丝苇无棱细圆悬垂茎", green, [[0, 0.1, 0], [end[0] * 0.7, 0.19, end[2] * 0.7], [end[0], 0.12, end[2]], end], [0.003, 0.0028, 0.0025, 0.0012])); for (let j = 0; j < 2; j++) parts.push(lobe("丝苇附着小浆果", pale, [end[0], end[1] + j * 0.015, end[2]], [0.006, 0.006, 0.006])); }
  }
  return parts;
}

function compact(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  if (kind === 0) {
    for (let row = 0; row < 13; row++) {
      const r = 0.018 - row * 0.00065;
      parts.push(polygon("方鳞塔四角合生的对生叶层", green, [[-r, -r], [r, -r], [r, r], [-r, r]], 0.005, [0, row * 0.005, 0]));
      for (const side of [-1, 1]) parts.push(needle("叶层四角向外翻起", pale, [side * r * 0.7, row * 0.005, -r * 0.75], [side * r, row * 0.005 + 0.004, -r], 0.007));
    }
  } else if (kind === 1) {
    parts.push(beam("神刀直立短干", bark, [0, 0, 0], [0, 0.25, 0], 0.008));
    for (let row = 0; row < 5; row++) for (const side of [-1, 1]) parts.push(fleshyLeaf("神刀相反方向弯曲镰叶", [0, 0.035 + row * 0.04, 0], [side * 0.13, 0.065 + row * 0.041, side * 0.035], 0.035, 3));
    parts.push(lobe("顶生密集花序", "#b9a38c", [0, 0.265, 0], [0.07, 0.04, 0.055]));
  } else if (kind === 2) {
    for (let i = 0; i < 8; i++) {
      const side = i % 2 ? -1 : 1; const h = 0.026 + Math.sin((i + 1) / 9 * Math.PI) * 0.04; const x = (i - 3.5) * 0.011;
      const value = polygon("玉扇两列压扁的楔形截顶叶", green, [[-0.002, 0], [0.002, 0], [0.009, h], [-0.009, h]], 0.012, [x, 0, side * 0.008]);
      value.vertices = value.vertices!.map(p => ({ x: p.x, y: p.z, z: 0.006 - p.y }));
      parts.push(value, part("平截顶端透光窗面", "box", "#b5c0a1", [x, h + 0.0005, side * 0.008], [0.018, 0.001, 0.012]));
    }
  } else if (kind === 3) {
    for (let i = 0; i < 15; i++) { const a = i * 2.4, r = Math.sqrt(i) * 0.014; const h = 0.035 + i % 4 * 0.007; const x = Math.cos(a) * r, z = Math.sin(a) * r; parts.push(tapered("五十铃玉棒状膨顶肉叶", green, [[x, 0, z], [x, h * 0.7, z], [x, h, z]], [0.003, 0.005, 0.008]), part("棒叶顶端透明窗", "cylinder", "#bbc4a5", [x, h + 0.0007, z], [0.0155, 0.0014, 0.0155])); }
  } else {
    parts.push(tapered("碧光环串珠节状短干", bark, [[0, 0, 0], [0.004, 0.026, 0], [0, 0.052, 0]], [0.007, 0.005, 0.006]), lobe("保留的球状合生短叶对", pale, [0, 0.048, 0], [0.025, 0.023, 0.023]));
    for (const side of [-1, 1]) parts.push(tapered("球顶伸出的两枚兔耳状长叶", green, [[side * 0.006, 0.049, 0], [side * 0.015, 0.09, 0], [side * 0.022, 0.15, -0.004]], [0.007, 0.006, 0.002]));
  }
  return parts;
}

function caudex(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  if (kind === 0) {
    parts.push(tapered("非洲霸王树直立肥厚棘干", bark, [[0, 0, 0], [0, 0.35, 0], [0.015, 0.85, 0], [0, 1.2, 0]], [0.075, 0.07, 0.045, 0.026]));
    for (let i = 0; i < 18; i++) { const a = i * 2.4; const y = 0.09 + i * 0.057; const r = 0.075 - y * 0.035; const root: Triple = [Math.cos(a) * r, y, Math.sin(a) * r]; parts.push(needle("棘干外伸硬刺", pale, root, [root[0] * 1.35, y + 0.018, root[2] * 1.35], 0.009)); }
    for (let i = 0; i < 14; i++) { const a = i * 2.4; parts.push(leaf("茎顶聚生狭长叶", green, [0, 1.17, 0], 0.055, 0.35, [60 + i % 3 * 10, a * 180 / Math.PI, 0])); }
  } else if (kind === 1) {
    parts.push(tapered("臭花桑梨状肥干", bark, [[0, 0, 0], [0, 0.07, 0], [0.008, 0.16, 0]], [0.035, 0.029, 0.013]));
    for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; const root: Triple = [Math.cos(a) * 0.014, 0.105 + i % 2 * 0.03, Math.sin(a) * 0.014]; parts.push(flatLeaf("臭花桑顶端宽卵叶", root, [Math.cos(a) * 0.1, root[1] + 0.05, Math.sin(a) * 0.1], 0.047)); }
    const root: Triple = [0.028, 0.11, 0.015]; parts.push(beam("辐射花托短梗", green, [0.006, 0.1, 0], root, 0.003), part("臭花桑扁盘状合生花托", "cylinder", pale, root, [0.037, 0.003, 0.037]));
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; parts.push(needle("花托边缘放射长臂", green, root, [root[0] + Math.cos(a) * 0.043, root[1], root[2] + Math.sin(a) * 0.043], 0.005)); }
  } else if (kind === 2) {
    parts.push(lobe("苍角殿露出地面的绿鳞茎", pale, [0, 0.04, 0], [0.12, 0.1, 0.12]));
    const path: Triple[] = [[0, 0.075, 0], [0.025, 0.17, 0], [-0.025, 0.27, 0.025], [0.025, 0.37, 0.01], [-0.015, 0.47, 0], [0.02, 0.6, -0.02]]; parts.push(tapered("无真叶的攀援光合花葶", green, path, [0.004, 0.0035, 0.003, 0.0025, 0.002, 0.001]));
    for (let i = 1; i < 5; i++) for (const side of [-1, 1]) { const root = path[i]!; const end: Triple = [root[0] + side * 0.09, root[1] + 0.045, root[2] + 0.03]; parts.push(tapered("苍角殿细分光合侧枝", green, [root, [end[0], root[1], end[2]], end], [0.002, 0.0013, 0.0006])); }
  } else if (kind === 3) {
    parts.push(tapered("七宝树相连蜡烛状茎节", pale, [[0, 0, 0], [0.008, 0.07, 0], [0.004, 0.13, 0], [0.025, 0.22, 0]], [0.021, 0.026, 0.017, 0.019]));
    for (let i = 0; i < 5; i++) { const a = i * 2.4; const root: Triple = [0.005, 0.09 + i * 0.025, 0]; const end: Triple = [Math.cos(a) * 0.065, root[1] + 0.025, Math.sin(a) * 0.065]; parts.push(beam("七宝树裂叶长柄", green, root, end, 0.002), flatLeaf("七宝树掌状深裂叶", end, [end[0] * 1.8, end[1] + 0.035, end[2] * 1.8], 0.065, "palm")); }
  } else {
    parts.push(lobe("山乌龟扁圆木栓质块茎", bark, [0, 0.045, 0], [0.19, 0.11, 0.17]));
    const vine: Triple[] = [[0, 0.08, 0], [0.045, 0.18, 0], [-0.035, 0.28, 0.02], [0.025, 0.38, 0], [0, 0.49, -0.02]]; parts.push(tapered("山乌龟细长攀援藤", green, vine, [0.0035, 0.003, 0.0025, 0.002, 0.001]));
    for (let i = 1; i < vine.length; i++) { const p = vine[i]!, side = i % 2 ? -1 : 1; const root: Triple = [p[0] + side * 0.07, p[1] + 0.02, p[2]]; parts.push(beam("盾叶叶背中央着生柄", green, p, root, 0.002), lobe("山乌龟近圆盾状薄叶", green, [root[0], root[1] + 0.004, root[2]], [0.115, 0.006, 0.1])); for (let j = 0; j < 5; j++) { const a = j * Math.PI * 2 / 5; parts.push(beam("由盾叶中心辐射的叶脉", pale, root, [root[0] + Math.cos(a) * 0.043, root[1] + 0.004, root[2] + Math.sin(a) * 0.038], 0.001)); } }
  }
  return parts;
}

function leafy(kind: number): ModelPart[] {
  const parts: ModelPart[] = [tapered("多肉木质短枝", bark, [[0, 0, 0], [0, 0.07, 0], [0.012, 0.14, 0]], [0.012, 0.008, 0.004])];
  for (let i = 0; i < 10; i++) {
    const a = i * Math.PI / 2; const root: Triple = [0, 0.025 + Math.floor(i / 2) * 0.022, 0]; const length = kind === 2 ? 0.12 : 0.055; const end: Triple = [Math.cos(a) * length, root[1] + length * 0.55, Math.sin(a) * length];
    parts.push(fleshyLeaf(kind === 0 ? "熊童子叶端五趾缺刻" : kind === 1 ? "天锦章扇形波皱叶缘" : "仙女之舞绒质三角叶", root, end, kind === 2 ? 0.095 : 0.04, kind === 0 ? 1 : kind === 1 ? 2 : 4));
    if (kind === 0) for (let tooth = 0; tooth < 4; tooth++) parts.push(lobe("爪齿顶端褐色小尖", bark, [end[0] * 0.91 + Math.sin(a) * (tooth - 1.5) * 0.007, end[1] + 0.003, end[2] * 0.91 - Math.cos(a) * (tooth - 1.5) * 0.007], [0.004, 0.004, 0.004]));
  }
  return parts;
}

function carrion(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  if (kind === 0) for (let i = 0; i < 6; i++) { const a = i * 2.4; const root: Triple = [Math.cos(a) * 0.03, 0, Math.sin(a) * 0.03]; const h = 0.13 + i % 3 * 0.035; parts.push(starStem("犀角状无叶四棱肉质茎", root, h, 0.016, 4, 0.48)); for (let j = 0; j < 4; j++) { const x = root[0] + (j % 2 ? 0.015 : -0.015); parts.push(needle("肉茎棱缘细齿", pale, [x, 0.025 + j * 0.027, root[2]], [x * 1.1, 0.035 + j * 0.027, root[2]], 0.004)); } }
  else {
    parts.push(tapered("犀角吊灯花蛇行缠绕肉质茎", bark, [[0, 0.009, -0.12], [-0.045, 0.009, -0.05], [0.025, 0.012, 0.02], [0, 0.07, 0.04], [-0.03, 0.14, 0.01], [0.01, 0.22, 0], [0.035, 0.29, -0.03]], [0.011, 0.012, 0.01, 0.009, 0.008, 0.007, 0.003]));
    for (let i = 0; i < 6; i++) parts.push(lobe("蛇行茎表面成对的残退叶基", pale, [i % 2 ? -0.014 : 0.008, 0.035 + i * 0.04, 0.013], [0.012, 0.005, 0.008]));
  }
  if (kind === 0) {
    const outline: [number, number][] = Array.from({ length: 10 }, (_, i) => { const a = i * Math.PI / 5; const r = i % 2 ? 0.026 : 0.12; return [Math.cos(a) * r, Math.sin(a) * r]; });
    parts.push(beam("犀角花长梗", green, [0.015, 0.09, 0], [0.13, 0.04, 0], 0.006), polygon("大花犀角五尖星状宽花冠", "#b5a287", outline, 0.004, [0.13, 0.04, 0]), lobe("星花中央小副花冠", "#a19380", [0.13, 0.045, 0], [0.027, 0.01, 0.027]));
    const hairs: ModelPart[] = [];
    for (let i = 0; i < 25; i++) { const a = i * Math.PI * 2 / 25, r = 0.025 + i % 5 * 0.011; hairs.push(needle("星花表面短毛", pale, [0.13 + Math.cos(a) * r, 0.044, Math.sin(a) * r], [0.13 + Math.cos(a) * r, 0.052, Math.sin(a) * r], 0.001)); }
    parts.push(combineMeshes("星花内表面分立毛束", pale, hairs));
  } else {
    parts.push(tapered("犀角吊灯花底部膨大长花筒", pale, [[0.065, 0.03, 0], [0.065, 0.06, 0], [0.065, 0.13, 0]], [0.012, 0.007, 0.006]), beam("吊灯花横出花梗", green, [0, 0.07, 0], [0.065, 0.03, 0], 0.003));
    for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5; parts.push(tapered("花筒顶端五瓣分开后再次接合", flower, [[0.065 + Math.cos(a) * 0.005, 0.13, Math.sin(a) * 0.005], [0.065 + Math.cos(a) * 0.021, 0.155, Math.sin(a) * 0.021], [0.065, 0.187, 0]], [0.0035, 0.0025, 0.0012])); }
  }
  return parts;
}

const cactusNames = [["leuchtenbergia", "晃山", "Leuchtenbergia principis"], ["obregonia", "帝冠", "Obregonia denegrii"], ["astrophytumMyriostigma", "鸾凤玉", "Astrophytum myriostigma"], ["hatiora", "猿恋苇", "Hatiora salicornioides"], ["rhipsalis", "丝苇", "Rhipsalis baccifera"]];
const compactNames = [["crassulaPyramidalis", "方鳞塔", "Crassula pyramidalis"], ["crassulaFalcata", "神刀", "Crassula perfoliata"], ["haworthiaTruncata", "玉扇", "Haworthia truncata"], ["fenestraria", "五十铃玉", "Fenestraria rhopalophylla"], ["monilaria", "碧光环", "Monilaria moniliformis"]];
const caudexNames = [["pachypodiumLamerei", "非洲霸王树", "Pachypodium lamerei"], ["dorsteniaFoetida", "臭花桑", "Dorstenia foetida"], ["bowiea", "苍角殿", "Bowiea volubilis"], ["senecioArticulatus", "七宝树", "Senecio articulatus"], ["stephaniaErecta", "山乌龟", "Stephania erecta"]];
const leafyNames = [["bearPawSucculent", "熊童子", "Cotyledon tomentosa"], ["adromischusCristatus", "天锦章", "Adromischus cristatus"], ["kalanchoeBeharensis", "仙女之舞", "Kalanchoe beharensis"]];

export const succulentFormDesigns: MasterNatureDesign[] = [
  ...cactusNames.map(([key, name, species], i) => design(key!, name!, "植物", () => cactus(i), ["旱生植物", species!])),
  ...compactNames.map(([key, name, species], i) => design(key!, name!, "植物", () => compact(i), ["多肉植物", species!])),
  ...caudexNames.map(([key, name, species], i) => design(key!, name!, "植物", () => caudex(i), ["旱生植物", species!])),
  ...leafyNames.map(([key, name, species], i) => design(key!, name!, "植物", () => leafy(i), ["多肉植物", species!])),
  design("stapeliaGigantea", "大花犀角", "植物", () => carrion(0), ["旱生植物", "Stapelia gigantea"]),
  design("ceropegiaStapeliiformis", "犀角吊灯花", "植物", () => carrion(1), ["旱生植物", "Ceropegia stapeliiformis"]),
];
