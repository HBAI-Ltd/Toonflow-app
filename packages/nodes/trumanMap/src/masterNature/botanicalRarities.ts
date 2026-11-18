import { beam, cap, combineMeshes, design, leaf, lobe, needle, part, petals, tapered } from "./shared";
import { compoundLeaf, flatLeaf } from "./ediblePlants";
import { tendril, vineStem } from "./gardenCrops";
import { hollowPipe, strip } from "./shapedFoods";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";

const green = "#93a580";
const pale = "#bdc5a3";
const stalk = "#a5ab89";
const bloom = "#d0c6ac";
const fruitColor = "#849280";

function flaredFlower(name: string, base: Triple, opening: Triple, radius: number): ModelPart {
  const frame = beam(name, bloom, base, opening, radius); const value = cap(name, bloom, base, radius, frame.scale.y, 3); value.rotation = { ...frame.rotation }; return value;
}

function vines(kind: number): ModelPart[] {
  const parts: ModelPart[] = [vineStem(kind === 4 ? 1.9 : 1.25)];
  if (kind === 0 || kind === 2 || kind === 3 || kind === 6) {
    for (let i = 0; i < 6; i++) { const y = 0.14 + i * 0.16; parts.push(compoundLeaf([0, y, 0], i * 137.5, 0.24, kind === 3 ? 3 : kind === 0 ? 2 : 1), tendril([0, y, 0])); }
  } else if (kind === 1) {
    for (let i = 0; i < 7; i++) { const a = i * 2.4, y = 0.1 + i * 0.14; const p: Triple = [Math.cos(a) * 0.12, y + 0.04, Math.sin(a) * 0.12]; const fronds: ModelPart[] = [needle("茑萝羽状深裂叶的中轴", green, [0, y, 0], p, 0.002)]; for (let row = 0; row < 6; row++) for (const side of [-1, 1]) fronds.push(needle("茑萝细到丝状的侧裂片", green, [p[0] * row / 6, y + 0.04 * row / 6, p[2] * row / 6], [p[0] * row / 6 + side * Math.cos(a + 1.57) * 0.05, y + 0.02 + 0.04 * row / 6, p[2] * row / 6 + side * Math.sin(a + 1.57) * 0.05], 0.0013)); parts.push(combineMeshes("一片完整羽状细裂茑萝叶", green, fronds)); }
  } else {
    for (let i = 0; i < 7; i++) { const y = 0.16 + i * (kind === 4 ? 0.23 : 0.14); for (const side of [-1, 1]) parts.push(flatLeaf("攀援藤本的对生全缘叶", [0, y, 0], [side * 0.19, y + 0.06, 0.02], 0.09)); }
  }
  if (kind === 0) {
    for (let i = 0; i < 4; i++) { const p: Triple = [i % 2 ? -0.13 : 0.13, 0.53 + i * 0.17, 0.08]; parts.push(beam("钟花藤粗短花柄", stalk, [0, p[1] + 0.03, 0], p, 0.0035), flaredFlower("钟花藤硕大的钟形合瓣花冠", p, [p[0], p[1] + 0.085, p[2] + 0.03], 0.043), petals(5, p, 0.02, 0.05, 85, pale)); }
  } else if (kind === 1) {
    for (let i = 0; i < 6; i++) { const p: Triple = [Math.sin(i * 2.4) * 0.12, 0.55 + i * 0.12, Math.cos(i * 2.4) * 0.12]; parts.push(beam("茑萝花梗", stalk, [0, p[1], 0], p, 0.0015), flaredFlower("茑萝细长花筒", p, [p[0], p[1] + 0.035, p[2]], 0.008), petals(5, [p[0], p[1] + 0.035, p[2]], 0.009, 0.018, 80, bloom)); }
  } else if (kind === 2 || kind === 3) {
    const trumpet = kind === 3;
    for (const side of [-1, 1]) { const p: Triple = [side * 0.12, 1.06, 0.04]; parts.push(beam("木质藤顶端的总花梗", stalk, [0, 1.06, 0], p, 0.005)); for (let i = 0; i < (trumpet ? 5 : 9); i++) { const a = i * 2.4; const start: Triple = [p[0] + Math.cos(a) * 0.027, p[1] + i % 3 * 0.025, p[2] + Math.sin(a) * 0.027]; const end: Triple = [start[0] + Math.cos(a) * (trumpet ? 0.1 : 0.055), start[1] - 0.035, start[2] + Math.sin(a) * (trumpet ? 0.1 : 0.055)]; parts.push(flaredFlower(trumpet ? "凌霄宽裂的大喇叭花" : "炮仗藤密排的长筒花", start, end, trumpet ? 0.034 : 0.012)); } }
    if (trumpet) for (let i = 0; i < 5; i++) parts.push(tapered("凌霄贴附攀援的短气根", pale, [[0, 0.15 + i * 0.16, 0], [-0.03, 0.11 + i * 0.16, -0.02]], [0.002, 0.0006]));
  } else if (kind === 4) {
    const p: Triple = [0.16, 1.75, 0.05]; parts.push(beam("老鸦嘴高处横出的花序梗", stalk, [0, 1.6, 0], p, 0.006), tapered("迈索尔老鸦嘴垂悬的长总状花序轴", stalk, [p, [0.19, 1.2, 0.05], [0.2, 0.55, 0.07]], [0.004, 0.003, 0.001]));
    for (let i = 0; i < 10; i++) { const side = i % 2 ? -1 : 1; const root: Triple = [0.18 + side * 0.025, 1.62 - i * 0.1, 0.07]; parts.push(leaf("鞋形花外侧包覆的苞片", pale, root, 0.035, 0.06, [150, side * 25, 0]), flaredFlower("弯向外侧的鞋状合瓣花", root, [root[0] + side * 0.04, root[1] - 0.03, root[2] + 0.025], 0.024)); }
  } else if (kind === 5) {
    for (const side of [-1, 1]) { const p: Triple = [side * 0.13, 1.09, 0]; parts.push(tapered("锡叶藤下垂星花长穗的轴", stalk, [[0, 1.2, 0], p, [p[0], 0.72, 0]], [0.0035, 0.0025, 0.001])); for (let i = 0; i < 8; i++) { const root: Triple = [p[0] + Math.sin(i * 2.4) * 0.025, 1.08 - i * 0.045, Math.cos(i * 2.4) * 0.025]; parts.push(petals(5, root, 0.014, 0.038, 80, pale), petals(5, [root[0], root[1] + 0.004, root[2]], 0.006, 0.012, 75, bloom)); } }
  } else {
    for (let axis = 0; axis < 3; axis++) {
      const root: Triple = [Math.sin(axis * 2.4) * 0.12, 0.74 + axis * 0.16, Math.cos(axis * 2.4) * 0.12]; parts.push(beam("蜗牛藤花的独立长梗", stalk, [0, root[1], 0], root, 0.002));
      const path: Triple[] = Array.from({ length: 25 }, (_, i) => { const a = i / 24 * Math.PI * 3.7, r = 0.025 * (1 - i / 30); return [root[0] + Math.cos(a) * r, root[1] + i * 0.0015, root[2] + Math.sin(a) * r]; }); parts.push(strip("蜗牛藤真正卷成螺壳的旗翼瓣结构", bloom, path, 0.017, 0.0015), leaf("卷瓣外部较大的旗瓣", pale, root, 0.055, 0.07, [45, axis * 120, 0]));
    }
  }
  return parts;
}

function shrubs(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  const tips: Triple[] = kind === 0 ? [[-0.3, 0.95, 0], [0.3, 1.05, 0.08], [0, 1.15, -0.24]] : [[-0.24, 0.65, 0], [0.24, 0.74, 0.05], [0, 0.85, -0.2]];
  parts.push(beam("灌木地上短主茎", stalk, [0, 0, 0], [0, 0.25, 0], 0.025));
  for (let axis = 0; axis < tips.length; axis++) {
    const tip = tips[axis]!; parts.push(tapered("物种花枝", stalk, [[0, 0.22, 0], [tip[0] * 0.7, tip[1] - 0.2, tip[2] * 0.7], tip], [0.012, 0.007, 0.002]));
    for (let row = 0; row < 4; row++) { const t = 0.3 + row * 0.16; const p: Triple = [tip[0] * t, 0.22 + (tip[1] - 0.22) * t, tip[2] * t]; for (let side = -1; side <= 1; side += 2) parts.push(flatLeaf(kind === 4 ? "夹竹桃三叶轮生的狭披针叶" : "枝条上的对生或互生叶", p, [p[0] + Math.cos(axis * 2.1 + side) * (kind === 0 ? 0.23 : 0.14), p[1] + 0.045, p[2] + Math.sin(axis * 2.1 + side) * (kind === 0 ? 0.23 : 0.14)], kind === 4 ? 0.025 : kind === 0 ? 0.14 : 0.075)); if (kind === 4) parts.push(flatLeaf("夹竹桃轮生的第三枚狭叶", p, [p[0] + Math.cos(axis * 2.1) * 0.17, p[1] + 0.035, p[2] + Math.sin(axis * 2.1) * 0.17], 0.025)); }
    if (kind === 0) {
      const tubes: ModelPart[] = [], corollas: ModelPart[] = [];
      for (let i = 0; i < 18; i++) { const a = i * 2.4, y = -0.4 + i / 17 * 0.8, r = Math.sqrt(1 - y * y); const p: Triple = [tip[0] + Math.cos(a) * r * 0.1, tip[1] + y * 0.1 + 0.035, tip[2] + Math.sin(a) * r * 0.1]; tubes.push(needle("烟火花伸长的细花筒", bloom, tip, p, 0.0035)); corollas.push(petals(5, p, 0.005, 0.013, 75, bloom)); } parts.push(combineMeshes("烟火花完整的放射长花筒", bloom, tubes)); for (let i = 0; i < 3; i++) parts.push(combineMeshes("烟火花花筒末端星状花瓣", bloom, corollas.slice(i * 6, i * 6 + 6)));
    } else if (kind === 1) {
      parts.push(petals(5, tip, 0.025, 0.052, 75, pale)); for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5; parts.push(lobe("米老鼠树宿萼上分离的核果", fruitColor, [tip[0] + Math.cos(a) * 0.022, tip[1] + 0.012, tip[2] + Math.sin(a) * 0.022], [0.016, 0.021, 0.016])); }
    } else if (kind === 2) {
      const white = flatLeaf("玉叶金花单枚特别增大的叶状萼裂片", tip, [tip[0] + 0.08, tip[1] + 0.08, tip[2]], 0.075); white.color = "#d4d0b7"; parts.push(white); for (let i = 0; i < 7; i++) parts.push(petals(5, [tip[0] + Math.sin(i * 2.4) * 0.025, tip[1] + 0.015, tip[2] + Math.cos(i * 2.4) * 0.025], 0.005, 0.012, 75, bloom));
    } else if (kind === 3) {
      parts.push(petals(5, tip, 0.04, 0.065, 75, bloom)); for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5; parts.push(tapered("野牡丹花中五长五短的弯曲雄蕊", pale, [tip, [tip[0] + Math.cos(a) * 0.025, tip[1] + 0.022, tip[2] + Math.sin(a) * 0.025], [tip[0] + Math.cos(a) * 0.022, tip[1] + (i % 2 ? 0.03 : 0.045), tip[2] + Math.sin(a) * 0.022]], [0.0015, 0.0013, 0.0004])); }
    } else if (kind === 4) {
      for (let i = 0; i < 4; i++) { const p: Triple = [tip[0] + Math.sin(i) * 0.025, tip[1], tip[2] + Math.cos(i) * 0.025]; parts.push(petals(5, p, 0.018, 0.035, 70, bloom)); }
      for (const side of [-1, 1]) parts.push(tapered("夹竹桃由同一花托成对长出的蓇葖果", pale, [tip, [tip[0] + side * 0.025, tip[1] - 0.12, tip[2]], [tip[0] + side * 0.04, tip[1] - 0.19, tip[2]]], [0.005, 0.007, 0.001]));
    } else {
      for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5; const path: Triple[] = Array.from({ length: 9 }, (_, j) => { const t = j / 8, b = a + t * 0.9; return [tip[0] + Math.cos(b) * t * 0.035, tip[1] + 0.004 * Math.sin(t * Math.PI), tip[2] + Math.sin(b) * t * 0.035]; }); parts.push(strip("狗牙花向同一方向旋卷的镰状花瓣", bloom, path, 0.014, 0.001)); }
    }
  }
  return parts;
}


function rareForms(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  if (kind === 0) {
    parts.push(vineStem(1.15)); for (let i = 0; i < 6; i++) { const y = 0.15 + i * 0.15; for (const side of [-1, 1]) parts.push(flatLeaf("非洲茉莉藤本对生的肥厚椭圆叶", [0, y, 0], [side * 0.17, y + 0.05, 0], 0.08)); }
    for (let i = 0; i < 5; i++) { const p: Triple = [Math.sin(i * 2.4) * 0.08, 1 + i % 2 * 0.04, Math.cos(i * 2.4) * 0.08]; parts.push(beam("非洲茉莉伞形花序梗", stalk, [0, 1, 0], p, 0.002), flaredFlower("厚蜡质的长花筒", p, [p[0], p[1] + 0.04, p[2]], 0.009), petals(5, [p[0], p[1] + 0.04, p[2]], 0.014, 0.032, 80, bloom)); }
    parts.push(lobe("藤上膨大的梨形蓇葖果", pale, [0.055, 0.65, 0], [0.065, 0.11, 0.055]));
  } else if (kind === 1) {
    parts.push(tapered("露松半木质短轴", stalk, [[0, 0, 0], [0, 0.14, 0]], [0.008, 0.003]));
    for (let i = 0; i < 12; i++) { const a = i * 2.4, root: Triple = [0, 0.05 + i % 3 * 0.02, 0]; const path: Triple[] = [root, [Math.cos(a) * 0.07, 0.17 + i % 3 * 0.01, Math.sin(a) * 0.07], [Math.cos(a) * 0.15, 0.16, Math.sin(a) * 0.15], [Math.cos(a) * 0.19, 0.12, Math.sin(a) * 0.19]]; parts.push(tapered("露松狭长而非圆叶的黏性捕虫叶", green, path, [0.0025, 0.002, 0.0015, 0.0004])); const hairs: ModelPart[] = []; for (let j = 0; j < 12; j++) { const t = (j + 1) / 13, r = 0.07 + t * 0.08; hairs.push(needle("捕虫叶两侧带腺的细毛", pale, [Math.cos(a) * r, 0.17 - t * 0.01, Math.sin(a) * r], [Math.cos(a) * r + Math.cos(a + (j % 2 ? 1 : -1) * 1.57) * 0.004, 0.173 - t * 0.01, Math.sin(a) * r + Math.sin(a + (j % 2 ? 1 : -1) * 1.57) * 0.004], 0.001)); } parts.push(combineMeshes("一片露松叶的独立黏腺毛", pale, hairs)); }
    parts.push(beam("露松独立花葶", stalk, [0, 0.1, 0], [0, 0.34, 0], 0.003), petals(5, [0, 0.34, 0], 0.022, 0.035, 75, bloom));
  } else if (kind === 2) {
    parts.push(part("Brocchinia叶片合围的真正开放贮水筒", "lathe", green, [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: 0.018, y: 0 }, { x: 0.037, y: 0.36 }, { x: 0.043, y: 0.46 }, { x: 0.04, y: 0.46 }, { x: 0.034, y: 0.36 }, { x: 0.014, y: 0.004 }, { x: 0, y: 0.004 }] }));
    for (let i = 0; i < 7; i++) { const a = i * Math.PI * 2 / 7; parts.push(strip("食虫凤梨贮水筒周缘各自外展的带叶", green, [[Math.cos(a) * 0.018, 0.008, Math.sin(a) * 0.018], [Math.cos(a) * 0.034, 0.3, Math.sin(a) * 0.034], [Math.cos(a) * 0.055, 0.49, Math.sin(a) * 0.055], [Math.cos(a) * 0.095, 0.5, Math.sin(a) * 0.095]], 0.035, 0.0015)); }
  } else if (kind === 3) {
    parts.push(tapered("螺旋狸藻捕虫器上部细柄", pale, [[0, 0.038, 0], [0, 0.024, 0]], [0.0008, 0.0006]), lobe("Y形捕虫器中部的消化囊泡", pale, [0, 0.022, 0], [0.004, 0.006, 0.004]));
    for (const side of [-1, 1]) { const path: Triple[] = Array.from({ length: 21 }, (_, i) => { const t = i / 20, a = t * Math.PI * 4; return [side * (0.001 + t * 0.016), 0.02 - t * 0.016 + Math.cos(a) * 0.0007, Math.sin(a) * 0.0007]; }); const tube = hollowPipe("Y形两臂具真实管腔的螺旋入口", path, 0.00065, 0.00035); tube.color = pale; parts.push(tube); }
  } else if (kind === 4) {
    parts.push(tapered("帽蕊木露出地表的无叶肉质花茎", "#b7a990", [[0, 0, 0], [0, 0.035, 0]], [0.012, 0.009]));
    for (let row = 0; row < 3; row++) for (const side of [-1, 1]) parts.push(leaf("帽蕊木成对抱茎的厚鳞片", pale, [0, row * 0.009, 0], 0.015, 0.026, [12, row % 2 * 90 + (side > 0 ? 0 : 180), 0])); parts.push(cap("帽蕊木短花被筒", bloom, [0, 0.029, 0], 0.012, 0.016, 3), part("帽蕊木顶端真正留孔的帽状雄蕊管", "lathe", pale, [0, 0.039, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0.01, y: 0 }, { x: 0.012, y: 0.008 }, { x: 0.009, y: 0.02 }, { x: 0.002, y: 0.022 }, { x: 0.0015, y: 0.022 }, { x: 0.0075, y: 0.019 }, { x: 0.01, y: 0.008 }, { x: 0.008, y: 0 }] }));
  } else if (kind === 5) {
    parts.push(cap("Hydnora无叶寄生花的基部厚壁花室", "#ad9d88", [0, 0, 0], 0.044, 0.055, 3));
    for (let i = 0; i < 3; i++) { const a = i * Math.PI * 2 / 3; const root: Triple = [Math.cos(a) * 0.028, 0.04, Math.sin(a) * 0.028]; const middle: Triple = [Math.cos(a) * 0.055, 0.09, Math.sin(a) * 0.055]; const top: Triple = [Math.cos(a) * 0.012, 0.145, Math.sin(a) * 0.012]; parts.push(strip("厚花被向上拱合并在侧面留出入口", "#b8a38b", [root, middle, top], 0.041, 0.008)); const hairs: ModelPart[] = []; for (let j = 0; j < 12; j++) { const y = 0.055 + j * 0.005; const p: Triple = [Math.cos(a) * 0.032, y, Math.sin(a) * 0.032]; hairs.push(needle("花被内缘向内伸出的白色毛突", bloom, p, [p[0] * 0.55, y - 0.003, p[2] * 0.55], 0.0015)); } parts.push(combineMeshes("每片花被的分离内缘毛突", bloom, hairs)); }
  } else {
    parts.push(tapered("水晶兰无绿叶的上端弯垂肉质茎", bloom, [[0, 0, 0], [0, 0.1, 0], [0.01, 0.17, 0], [0.035, 0.165, 0]], [0.0045, 0.004, 0.003, 0.0035]));
    for (let i = 0; i < 6; i++) parts.push(leaf("水晶兰沿茎交叠的鳞片叶", bloom, [0, 0.015 + i * 0.019, 0], 0.007, 0.024, [15, i * 137.5, 0])); const bell = cap("水晶兰单朵低垂的厚瓣钟花", bloom, [0.035, 0.166, 0], 0.011, 0.027, 3); bell.rotation.x = 180; parts.push(bell);
  }
  return parts;
}

const vineNames = [["cobaea", "钟花藤", "Cobaea scandens"], ["cypressVine", "茑萝", "Ipomoea quamoclit"], ["pyrostegia", "炮仗藤", "Pyrostegia venusta"], ["campsis", "凌霄", "Campsis"], ["mysoreClockvine", "迈索尔老鸦嘴", "Thunbergia mysorensis"], ["petrea", "锡叶藤", "Petrea volubilis"], ["snailVine", "蜗牛藤", "Cochliasanthus caracalla"]];
const shrubNames = [["starburstClerodendrum", "烟火花", "Clerodendrum quadriloculare"], ["mickeyMousePlant", "米老鼠树", "Ochna serrulata"], ["mussaenda", "玉叶金花", "Mussaenda pubescens"], ["tibouchina", "巴西野牡丹", "Tibouchina urvilleana"], ["oleander", "夹竹桃", "Nerium oleander"], ["pinwheelFlower", "狗牙花", "Tabernaemontana divaricata"]];
const rarityNames = [["madagascarJasmine", "马达加斯加茉莉", "Stephanotis floribunda"], ["dewyPine", "露松", "Drosophyllum lusitanicum"], ["carnivorousBromeliad", "食虫凤梨（Brocchinia）", "Brocchinia reducta"], ["genliseaTrap", "螺旋狸藻捕虫器", "Genlisea 捕虫器官"], ["mitrastemon", "帽蕊木", "Mitrastemon yamamotoi"], ["hydnora", "Hydnora寄生花", "Hydnora africana"], ["ghostPipePlant", "水晶兰", "Monotropa uniflora"]];

export const botanicalRarityDesigns: MasterNatureDesign[] = [
  ...vineNames.map(([key, name, taxon], i) => design(key!, name!, "植物", () => vines(i), ["攀援植物结构", taxon!])),
  ...shrubNames.map(([key, name, taxon], i) => design(key!, name!, "植物", () => shrubs(i), ["观赏植物结构", taxon!])),
  ...rarityNames.map(([key, name, taxon], i) => design(key!, name!, "植物", () => rareForms(i), [i === 3 ? "独立自然器官" : "特殊植物结构", taxon!])),
];
