import { beam, cap, combineMeshes, design, leaf, lobe, needle, part, petals, polygon, radialLeaves, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { flatLeaf } from "./ediblePlants";

const green = "#9caf89";
const light = "#b8c5a3";
const bloom = "#d1c7b5";
const stalk = "#aab38f";

function basal(parts: ModelPart[], count: number, width: number, length: number, broad = false) {
  for (let i = 0; i < count; i++) { const a = i * 2.4; if (broad) parts.push(flatLeaf("完整基生阔叶", [0, 0.015, 0], [Math.cos(a) * length * 0.55, length * 0.55, Math.sin(a) * length * 0.55], width)); else parts.push(leaf("完整基生带叶", green, [0, 0.005, 0], width, length, [18 + i % 3 * 13, i * 137.5 % 360, 0])); }
}

function flowerTube(name: string, root: Triple, height: number, radius: number, turn = 0): ModelPart {
  const p = cap(name, bloom, root, radius, height, 3); p.rotation.z = turn; return p;
}

function vine(parts: ModelPart[], height: number, spread: number, heart = false) {
  parts.push(tapered("攀援植物连续藤茎", stalk, [[0, 0, 0], [-spread * 0.25, height * 0.5, 0], [0, height, 0], [spread, height * 0.8, 0], [spread * 1.3, height * 0.35, 0]], [0.006, 0.005, 0.004, 0.003, 0.0015]));
  for (let i = 0; i < 10; i++) { const x = i < 5 ? 0 : spread * (i - 4) / 5; const y = i < 5 ? 0.12 + i * height * 0.15 : height - (i - 4) * height * 0.1; for (const side of [-1, 1]) parts.push(flatLeaf(heart ? "成对心形藤叶" : "成对革质藤叶", [x, y, 0], [x + side * 0.13, y + 0.04, 0.07], heart ? 0.1 : 0.065, heart ? "heart" : "oval")); }
}

function specialFlower(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  if (kind === 0) {
    parts.push(tapered("翡翠葛木质攀援枝", stalk, [[0, 0, 0], [0, 1.2, 0], [0.4, 1.4, 0], [0.65, 1.2, 0]], [0.018, 0.012, 0.007, 0.004]));
    for (let node = 0; node < 5; node++) { const p: Triple = [node * 0.12, 0.75 + node * 0.1, 0]; const blades: ModelPart[] = []; for (let i = -1; i <= 1; i++) blades.push(flatLeaf("翡翠葛三出小叶", p, [p[0] + i * 0.1, p[1] + 0.07, 0.17], 0.085)); parts.push(combineMeshes("翡翠葛完整三出复叶", green, blades)); }
    parts.push(tapered("翡翠葛长下垂总状花序", stalk, [[0.45, 1.35, 0], [0.48, 0.9, 0], [0.5, 0.45, 0]], [0.005, 0.004, 0.0015]));
    for (let i = 0; i < 27; i++) { const a = i * 2.4; const p: Triple = [0.48 + Math.cos(a) * 0.025, 0.5 + i * 0.028, Math.sin(a) * 0.025]; parts.push(tapered("翡翠葛弯钩龙骨瓣", "#aec6b3", [p, [p[0] + Math.cos(a) * 0.05, p[1] - 0.025, p[2] + Math.sin(a) * 0.05], [p[0] + Math.cos(a) * 0.075, p[1] + 0.015, p[2] + Math.sin(a) * 0.075]], [0.01, 0.016, 0.0015]), leaf("翡翠葛上部旗瓣", "#c0cdb7", p, 0.035, 0.055, [65, -a * 180 / Math.PI % 360, 0])); }
  } else if (kind === 1) {
    vine(parts, 0.9, 0.35, true);
    for (let i = 0; i < 4; i++) { const p: Triple = [0.12 + i * 0.08, 0.5 + i % 2 * 0.16, 0.07]; parts.push(tapered("马兜铃弯曲烟斗状花管", bloom, [p, [p[0], p[1] - 0.07, p[2]], [p[0] + 0.065, p[1] - 0.07, p[2] + 0.025], [p[0] + 0.06, p[1] + 0.01, p[2] + 0.04]], [0.008, 0.025, 0.018, 0.02]), flowerTube("花管端张开的宽唇", [p[0] + 0.06, p[1], p[2] + 0.04], 0.04, 0.05)); }
  } else if (kind === 2) {
    basal(parts, 5, 0.16, 0.5, true); parts.push(beam("蝙蝠花独立长花葶", stalk, [0, 0, 0], [0, 0.62, 0], 0.012));
    for (const side of [-1, 1]) { parts.push(leaf("蝙蝠花宽大翼状总苞", "#b5aea5", [0, 0.6, 0], 0.16, 0.25, [30, side * 75, side * 45]), leaf("蝙蝠花内侧长总苞", "#c2bab0", [side * 0.02, 0.61, 0], 0.045, 0.15, [35, side * 20, side * 20])); }
    for (let i = 0; i < 24; i++) { const a = i * 2.4; const p: Triple = [Math.cos(a) * 0.045, 0.58, Math.sin(a) * 0.045]; parts.push(tapered("蝙蝠花长须状丝苞", "#c8c3b2", [p, [p[0] * 2, 0.42, p[2] * 2], [p[0] * 2.4, 0.19 + i % 4 * 0.025, p[2] * 2.4]], [0.0015, 0.0011, 0.0005])); }
    for (let i = 0; i < 7; i++) { const a = i * Math.PI * 2 / 7; parts.push(cap("总苞内的小钟形花", "#afa99f", [Math.cos(a) * 0.025, 0.6, Math.sin(a) * 0.025], 0.012, 0.02, 3)); }
  } else if (kind === 3) {
    parts.push(beam("钉头果直立木质茎", stalk, [0, 0, 0], [0, 1.05, 0], 0.014));
    for (let i = 0; i < 9; i++) for (const side of [-1, 1]) parts.push(leaf("钉头果对生狭披针叶", green, [0, 0.08 + i * 0.09, 0], 0.025, 0.18, [65, side * 90 + i * 15, 0]));
    for (let i = 0; i < 6; i++) { const a = i * 2.4; const p: Triple = [Math.cos(a) * 0.12, 0.6 + i % 3 * 0.13, Math.sin(a) * 0.12]; parts.push(beam("叶腋果柄", stalk, [0, p[1] + 0.06, 0], p, 0.003), lobe("钉头果膨胀的薄壁气球果", "#c4c9a5", p, [0.095, 0.11, 0.095])); const hairs: ModelPart[] = []; for (let j = 0; j < 18; j++) { const b = j * 2.4; const r = 0.035; hairs.push(needle("球果表面柔软细刺", light, [p[0] + Math.cos(b) * r, p[1] + j % 3 * 0.018 - 0.02, p[2] + Math.sin(b) * r], [p[0] + Math.cos(b) * 0.055, p[1] + j % 3 * 0.018 - 0.01, p[2] + Math.sin(b) * 0.055], 0.0015)); } parts.push(combineMeshes("单个球果完整软刺", light, hairs)); }
  } else if (kind === 4) {
    vine(parts, 0.85, 0.35);
    for (let i = 0; i < 10; i++) { const a = i * 2.4; const p: Triple = [0.3 + Math.cos(a) * 0.07, 0.75 + i % 3 * 0.05, Math.sin(a) * 0.07]; parts.push(cap("龙吐珠白色膨大五棱萼", "#d7d5bd", p, 0.018, 0.038, 4), tapered("从萼中伸出的红色花冠管", "#c3b2a2", [p, [p[0], p[1] + 0.075, p[2] + 0.01]], [0.006, 0.008]), petals(5, [p[0], p[1] + 0.075, p[2] + 0.01], 0.01, 0.018, 80, "#c3b2a2")); }
  } else if (kind === 5) {
    parts.push(tapered("宝塔龙船花高直秆", stalk, [[0, 0, 0], [0, 1.6, 0]], [0.024, 0.005]));
    for (let row = 0; row < 4; row++) for (const side of [-1, 1]) parts.push(flatLeaf("宝塔花对生掌状阔叶", [0, 0.15 + row * 0.25, 0], [side * 0.4, 0.25 + row * 0.25, 0.06], 0.32, "palm"));
    for (let tier = 0; tier < 6; tier++) { const florets: ModelPart[] = []; for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; const r = 0.28 * (1 - tier / 7); const p: Triple = [Math.cos(a) * r, 1.05 + tier * 0.105, Math.sin(a) * r]; florets.push(needle("宝塔花序水平支轴", bloom, [0, p[1], 0], p, 0.004), petals(5, p, 0.009, 0.015, 75, bloom)); } const stems = florets.filter((_, i) => i % 2 === 0), flowers = florets.filter((_, i) => i % 2 === 1); parts.push(combineMeshes("宝塔单层轮生支梗", bloom, stems)); for (let i = 0; i < flowers.length; i += 6) parts.push(combineMeshes("宝塔单层管花冠", bloom, flowers.slice(i, i + 6))); }
  } else if (kind === 6) {
    parts.push(tapered("闭鞘姜螺旋直立假茎", stalk, [[0, 0, 0], [0.06, 0.6, 0], [0, 1.1, 0]], [0.018, 0.014, 0.008]));
    for (let i = 0; i < 11; i++) parts.push(leaf("闭鞘姜螺旋排列宽叶", green, [0.02, 0.08 + i * 0.08, 0], 0.085, 0.29, [60, i * 137.5 % 360, 0]));
    for (let i = 0; i < 14; i++) { const a = i * 2.4; parts.push(leaf("顶生红色松球状花苞", "#b8ad9b", [Math.cos(a) * 0.01, 0.94 + i * 0.01, Math.sin(a) * 0.01], 0.045, 0.055, [45, i * 137.5 % 360, 0])); }
    parts.push(flowerTube("从花苞侧伸出的宽褶唇瓣", [0.035, 1.02, 0.02], 0.1, 0.07, -75));
  } else if (kind === 7) {
    parts.push(beam("仙丹花灌木主干", stalk, [0, 0, 0], [0, 0.55, 0], 0.018));
    for (let axis = 0; axis < 4; axis++) { const a = axis * Math.PI / 2; const p: Triple = [Math.cos(a) * 0.2, 0.63, Math.sin(a) * 0.2]; parts.push(beam("仙丹花枝", stalk, [0, 0.3, 0], p, 0.007)); for (const side of [-1, 1]) parts.push(flatLeaf("仙丹花对生椭圆革叶", [p[0] * 0.5, 0.48, p[2] * 0.5], [p[0] + side * 0.08, 0.54, p[2] + side * 0.1], 0.075)); const pipes: ModelPart[] = []; for (let i = 0; i < 10; i++) { const b = i * 2.4; const q: Triple = [p[0] + Math.cos(b) * 0.06, 0.69 + i % 3 * 0.01, p[2] + Math.sin(b) * 0.06]; pipes.push(needle("细长合瓣花管", bloom, p, q, 0.004)); parts.push(petals(4, q, 0.01, 0.018, 85, bloom)); } parts.push(combineMeshes("一束相连的仙丹花管", bloom, pipes)); }
  } else if (kind === 8) {
    parts.push(tapered("鸡蛋花粗肉质主干", "#b4b99d", [[0, 0, 0], [0.025, 0.7, 0]], [0.07, 0.05]));
    for (let branch = 0; branch < 4; branch++) { const a = branch * Math.PI / 2; const p: Triple = [Math.cos(a) * 0.45, 1.1 + branch % 2 * 0.12, Math.sin(a) * 0.45]; parts.push(tapered("鸡蛋花鹿角状粗枝", "#b4b99d", [[0.025, 0.65, 0], p], [0.045, 0.025])); for (let i = 0; i < 6; i++) parts.push(leaf("枝端密集长倒披针叶", green, p, 0.095, 0.38, [55, i * 60, 0])); for (let i = 0; i < 4; i++) parts.push(petals(5, [p[0] + Math.cos(i * 2.4) * 0.07, p[1] + 0.07 + i % 2 * 0.03, p[2] + Math.sin(i * 2.4) * 0.07], 0.02, 0.04, 75, i % 2 ? "#dbd4b9" : "#d0c7ad")); }
  } else if (kind === 9 || kind === 10) {
    const jatropha = kind === 10;
    parts.push(part(jatropha ? "佛肚树瓶状膨大干" : "沙漠玫瑰粗大露出土面的块茎干", "lathe", "#b2b899", [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: jatropha ? [{ x: 0.07, y: 0 }, { x: 0.12, y: 0.11 }, { x: 0.075, y: 0.3 }, { x: 0.025, y: 0.5 }] : [{ x: 0.09, y: 0 }, { x: 0.14, y: 0.06 }, { x: 0.105, y: 0.2 }, { x: 0.045, y: 0.4 }] }));
    for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5; const p: Triple = [Math.cos(a) * 0.19, 0.58 + i % 2 * 0.1, Math.sin(a) * 0.19]; parts.push(tapered("肉质分枝与长叶柄", stalk, [[0, 0.35, 0], p], [jatropha ? 0.006 : 0.027, 0.005])); if (jatropha) parts.push(flatLeaf("佛肚树盾状掌裂叶", p, [p[0] * 1.7, p[1] + 0.04, p[2] * 1.7], 0.22, "palm")); else { for (let j = 0; j < 4; j++) parts.push(leaf("沙漠玫瑰枝端倒卵叶", green, p, 0.04, 0.11, [55, i * 72 + j * 90, 0])); parts.push(flowerTube("沙漠玫瑰宽大喇叭花", p, 0.07, 0.045)); } }
    if (jatropha) { parts.push(beam("佛肚树高举的花序轴", stalk, [0, 0.4, 0], [0, 0.9, 0], 0.008)); for (let i = 0; i < 16; i++) { const a = i * 2.4; const p: Triple = [Math.cos(a) * 0.09, 0.9 + i % 3 * 0.015, Math.sin(a) * 0.09]; parts.push(needle("珊瑚状花序支梗", bloom, [0, 0.84, 0], p, 0.003), petals(5, p, 0.007, 0.012, 75, bloom)); } }
  } else if (kind === 11) {
    parts.push(part("扇叶毒鳞球完整露地鳞茎", "lathe", "#b8b396", [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0.07, y: 0 }, { x: 0.095, y: 0.06 }, { x: 0.06, y: 0.13 }, { x: 0.04, y: 0.18 }] }));
    for (let i = 0; i < 14; i++) parts.push(leaf("毒鳞球两列扇状剑叶", green, [0, 0.14, 0], 0.035, 0.45, [0, 0, (i - 6.5) * 11]));
    parts.push(beam("球形花序独立花葶", stalk, [0, 0.12, 0], [0, 0.56, 0.04], 0.013)); const flowers: ModelPart[] = []; for (let i = 0; i < 36; i++) { const a = i * 2.4; const y = -0.12 + i % 9 * 0.03; const r = Math.sqrt(Math.max(0.0001, 0.14 ** 2 - y * y)); const p: Triple = [Math.cos(a) * r, 0.56 + y, 0.04 + Math.sin(a) * r]; flowers.push(needle("球形伞序辐射花梗", bloom, [0, 0.56, 0.04], p, 0.003)); parts.push(petals(6, p, 0.006, 0.02, 75, bloom)); } parts.push(combineMeshes("整朵辐射伞序花梗", bloom, flowers));
  } else if (kind === 12) {
    basal(parts, 8, 0.055, 0.5); parts.push(beam("凤梨百合粗壮花葶", stalk, [0, 0, 0], [0, 0.8, 0], 0.016));
    for (let i = 0; i < 30; i++) { const a = i * 2.4; parts.push(petals(6, [Math.cos(a) * 0.035, 0.3 + i * 0.015, Math.sin(a) * 0.035], 0.009, 0.018, 75, bloom)); } parts.push(radialLeaves(9, [0, 0.8, 0], 0.026, 0.14, 65, green));
  } else if (kind === 13) {
    for (let i = 0; i < 9; i++) { const phase = i * 2.4; parts.push(tapered("弹簧草真实卷曲的线形叶", green, Array.from({ length: 25 }, (_, j) => { const t = j / 24; const a = t * Math.PI * 4 + phase; return [Math.cos(phase) * 0.025 + Math.cos(a) * t * 0.022, t * 0.25, Math.sin(phase) * 0.025 + Math.sin(a) * t * 0.022] as Triple; }), Array.from({ length: 25 }, (_, j) => 0.003 * (1 - j / 31)))); }
    parts.push(beam("弹簧草花序轴", stalk, [0, 0, 0], [0, 0.54, 0], 0.004)); for (let i = 0; i < 5; i++) { const p: Triple = [i % 2 ? 0.045 : -0.045, 0.35 + i * 0.035, 0]; parts.push(beam("下弯花梗", green, [0, p[1] + 0.03, 0], p, 0.002), flowerTube("弹簧草下垂六瓣花", p, 0.035, 0.015, 180)); }
  } else if (kind === 14) {
    for (let i = 0; i < 10; i++) { const side = i % 2 ? -1 : 1; parts.push(tapered("子宝厚而钝圆的舌状叶", green, [[0, 0.01 + i * 0.012, 0], [side * 0.1, 0.045 + i * 0.014, 0], [side * 0.21, 0.07 + i * 0.012, 0]], [0.014, 0.025, 0.006])); }
    parts.push(tapered("子宝细长弯曲花序轴", stalk, [[0, 0, 0], [0.04, 0.5, 0], [0.13, 0.75, 0]], [0.005, 0.003, 0.001])); for (let i = 0; i < 9; i++) parts.push(tapered("胃状膨大而末端狭窄的花管", bloom, [[0.04 + i * 0.01, 0.45 + i * 0.03, 0], [0.08 + i * 0.01, 0.44 + i * 0.03, 0], [0.09 + i * 0.01, 0.41 + i * 0.03, 0]], [0.004, 0.01, 0.003]));
  } else if (kind === 15) {
    parts.push(cap("美杜莎大戟圆形露地基干", stalk, [0, 0, 0], 0.09, 0.12, 4));
    for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8; const p: Triple = [Math.cos(a) * 0.36, 0.07 + i % 3 * 0.04, Math.sin(a) * 0.36]; parts.push(tapered("从中心向四周蛇形伸展的肉质茎", green, [[0, 0.09, 0], [Math.cos(a) * 0.2, 0.16, Math.sin(a) * 0.2], p], [0.02, 0.018, 0.005]), petals(5, p, 0.004, 0.01, 80, "#d0cdac")); }
  } else if (kind === 16) {
    parts.push(tapered("光棍树绿色圆柱主干", green, [[0, 0, 0], [0, 1.1, 0]], [0.025, 0.009]));
    for (let i = 0; i < 10; i++) { const a = i * 2.4; const root: Triple = [0, 0.15 + i * 0.075, 0]; const joint: Triple = [Math.cos(a) * 0.23, root[1] + 0.1, Math.sin(a) * 0.23]; parts.push(tapered("铅笔状一次肉质分枝", green, [root, joint], [0.012, 0.007])); for (const side of [-1, 1]) parts.push(tapered("无叶圆柱二叉分枝", green, [joint, [joint[0] + Math.cos(a + side) * 0.15, joint[1] + 0.18, joint[2] + Math.sin(a + side) * 0.15]], [0.007, 0.0025])); }
  } else if (kind === 17) {
    parts.push(tapered("玉树木质粗主干", stalk, [[0, 0, 0], [0, 0.6, 0]], [0.045, 0.015]));
    for (let branch = 0; branch < 5; branch++) { const a = branch * 2.4; const p: Triple = [Math.cos(a) * 0.25, 0.35 + branch * 0.08, Math.sin(a) * 0.25]; parts.push(tapered("玉树多肉分枝", stalk, [[0, 0.2, 0], p], [0.02, 0.008])); const blades: ModelPart[] = []; for (let row = 0; row < 4; row++) for (const side of [-1, 1]) blades.push(lobe("玉树对生厚卵形叶", green, [p[0] * (0.4 + row * 0.18) + side * 0.035, 0.2 + (p[1] - 0.2) * (0.4 + row * 0.18), p[2] * (0.4 + row * 0.18)], [0.065, 0.025, 0.085], [0, branch * 60, 0])); parts.push(combineMeshes("枝上一整组肉质对生叶", green, blades)); }
  } else if (kind === 18) {
    for (let stem = 0; stem < 4; stem++) { const x = (stem - 1.5) * 0.055; parts.push(beam("钱串直立细茎", stalk, [x, 0, 0], [x, 0.47 + stem % 2 * 0.07, 0], 0.004));
      for (let i = 0; i < 11; i++) { const y = 0.025 + i * 0.039; const p = polygon("茎从中央穿过的成对三角肉叶", green, [[0, -0.035], [-0.03, 0], [0, 0.035], [0.03, 0]], 0.006, [x, y, 0], [[[-0.003, -0.003], [0.003, -0.003], [0.003, 0.003], [-0.003, 0.003]]]); p.rotation.y = i % 2 * 90; parts.push(p); }
    }
  } else if (kind === 19) {
    parts.push(beam("落地生根直立多肉秆", stalk, [0, 0, 0], [0, 0.85, 0], 0.012));
    for (let i = 0; i < 6; i++) { const a = i * Math.PI * 2 / 3; const y = 0.15 + i * 0.1; const root: Triple = [0, y, 0]; const end: Triple = [Math.cos(a) * 0.26, y + 0.045, Math.sin(a) * 0.26]; parts.push(flatLeaf("落地生根长三角肉质叶", root, end, 0.095, "palm")); const plantlets: ModelPart[] = []; for (let row = 0; row < 4; row++) for (const side of [-1, 1]) { const t = 0.28 + row * 0.16; const p: Triple = [end[0] * t + Math.cos(a + Math.PI / 2) * side * 0.035, y + 0.045 * t + 0.005, end[2] * t + Math.sin(a + Math.PI / 2) * side * 0.035]; plantlets.push(lobe("叶缘幼株生长点", light, p, [0.008, 0.008, 0.008])); for (let blade = 0; blade < 4; blade++) plantlets.push(leaf("叶缘独立幼株小叶", light, p, 0.008, 0.018, [45, blade * 90, 0])); } parts.push(combineMeshes("一片母叶上完整的不定芽幼株", light, plantlets)); }
  } else if (kind === 20) {
    vine(parts, 0.8, 0.35);
    for (let head = 0; head < 3; head++) { const p: Triple = [0.1 + head * 0.13, 0.53 + head % 2 * 0.08, 0.05]; parts.push(tapered("球兰倒挂的伞形花柄", stalk, [[p[0], p[1] + 0.1, 0], p], [0.004, 0.002])); const flowers: ModelPart[] = []; for (let i = 0; i < 10; i++) { const a = i * 2.4; const q: Triple = [p[0] + Math.cos(a) * 0.055, p[1] + Math.sin(a) * 0.04, 0.06]; flowers.push(petals(5, q, 0.012, 0.024, 80, bloom), petals(5, [q[0], q[1] + 0.004, q[2]], 0.004, 0.01, 55, "#b2ae98")); } for (let i = 0; i < flowers.length; i += 5) parts.push(combineMeshes("球兰有副花冠的蜡质花簇", bloom, flowers.slice(i, i + 5))); }
  } else if (kind === 21 || kind === 22) {
    const parachute = kind === 22; vine(parts, parachute ? 0.95 : 0.6, parachute ? 0.35 : 0.23, true);
    for (let i = 0; i < 4; i++) { const p: Triple = [0.08 + i * 0.075, 0.28 + i * 0.11, 0.08]; parts.push(tapered(parachute ? "降落伞花长漏斗状基管" : "爱之蔓基部球状细花管", bloom, [p, [p[0], p[1] + 0.08, p[2]], [p[0], p[1] + 0.13, p[2]]], [parachute ? 0.016 : 0.009, 0.008, 0.006])); for (let j = 0; j < 5; j++) { const a = j * Math.PI * 2 / 5; parts.push(tapered("花冠顶端融合的笼状裂片", parachute ? light : bloom, [[p[0], p[1] + 0.08, p[2]], [p[0] + Math.cos(a) * (parachute ? 0.035 : 0.013), p[1] + 0.135, p[2] + Math.sin(a) * (parachute ? 0.035 : 0.013)], [p[0], p[1] + 0.16, p[2]]], [0.003, 0.0035, 0.002])); } if (parachute) parts.push(cap("降落伞花上端展开的伞盖", light, [p[0], p[1] + 0.145, p[2]], 0.04, 0.012, 2)); }
  } else if (kind === 23) {
    vine(parts, 0.85, 0.32);
    for (let i = 0; i < 6; i++) { const a = i * 2.4; const p: Triple = [0.05 + i * 0.055, 0.25 + i % 3 * 0.15, 0.035]; parts.push(lobe("眼树莲中空蚁居囊叶", light, p, [0.055, 0.13, 0.075]), cap("囊叶下方小入口", "#b0b89a", [p[0], p[1] - 0.05, p[2] + 0.03], 0.012, 0.008, 3)); parts.at(-1)!.rotation.x = 90; parts.push(tapered("囊叶连接的短柄", green, [[p[0], p[1] + 0.08, 0], p], [0.003, 0.002])); }
  } else if (kind === 24 || kind === 25) {
    const goldfish = kind === 25; vine(parts, 0.65, 0.3);
    for (let i = 0; i < 10; i++) { const p: Triple = [0.06 + i % 5 * 0.055, 0.3 + Math.floor(i / 5) * 0.18, 0.08];
      if (goldfish) { parts.push(tapered("金鱼吊兰膨大的囊状合瓣花", "#c9ba9d", [[p[0], p[1], p[2]], [p[0] + 0.025, p[1] - 0.018, p[2] + 0.02], [p[0] + 0.05, p[1] - 0.005, p[2] + 0.025]], [0.004, 0.016, 0.004])); }
      else parts.push(flowerTube("口红吊兰深色筒形萼", p, 0.025, 0.009, -70), tapered("从筒萼中伸出的长红花冠", "#c3b09f", [p, [p[0] + 0.055, p[1] + 0.015, p[2] + 0.01]], [0.007, 0.01]), petals(5, [p[0] + 0.055, p[1] + 0.015, p[2] + 0.01], 0.006, 0.012, 75, "#c3b09f"));
    }
  } else if (kind === 26) {
    parts.push(flatLeaf("文德兰旋果苣唯一一枚巨叶", [0, 0.025, 0], [0.16, 0.2, 0.5], 0.38, "heart"));
    for (let i = 0; i < 3; i++) { const x = (i - 1) * 0.06; parts.push(tapered("从巨叶基部抽生的花葶", stalk, [[0, 0, 0], [x, 0.35, 0.06], [x + 0.06, 0.58, 0.1]], [0.005, 0.003, 0.001])); for (let j = 0; j < 6; j++) parts.push(flowerTube("侧生五裂长筒花", [x + j * 0.008, 0.33 + j * 0.035, 0.08], 0.035, 0.018, -80)); }
    const veins: ModelPart[] = []; for (let i = 0; i < 9; i++) for (const side of [-1, 1]) veins.push(needle("巨叶侧向隆起叶脉", light, [i * 0.016, 0.03 + i * 0.017, i * 0.05], [i * 0.016 + side * 0.12, 0.035 + i * 0.017, i * 0.05], 0.003)); parts.push(combineMeshes("一枚巨叶完整侧脉", light, veins));
  } else if (kind === 27) {
    parts.push(tapered("宝莲灯灌木粗茎", stalk, [[0, 0, 0], [0, 0.9, 0]], [0.025, 0.009]));
    for (let row = 0; row < 3; row++) for (const side of [-1, 1]) parts.push(flatLeaf("宝莲灯宽大对生革质叶", [0, 0.2 + row * 0.23, 0], [side * 0.42, 0.25 + row * 0.23, 0.06], 0.2));
    for (let cluster = 0; cluster < 3; cluster++) { const a = cluster * Math.PI * 2 / 3; const p: Triple = [Math.cos(a) * 0.24, 0.5 + cluster % 2 * 0.1, Math.sin(a) * 0.24]; parts.push(tapered("宝莲灯长下垂花柄", stalk, [[0, 0.85, 0], [p[0], 0.8, p[2]], p], [0.006, 0.005, 0.003])); for (let i = 0; i < 4; i++) parts.push(leaf("保护垂挂花序的巨大粉色苞片", "#c7b8af", [p[0], p[1] + 0.1, p[2]], 0.08, 0.19, [130, i * 90, 0])); const florets: ModelPart[] = []; for (let i = 0; i < 28; i++) { const b = i * 2.4; florets.push(lobe("葡萄般垂挂的众多小花", bloom, [p[0] + Math.cos(b) * 0.035 * (1 - i / 35), p[1] - i * 0.004, p[2] + Math.sin(b) * 0.035 * (1 - i / 35)], [0.016, 0.019, 0.016])); } parts.push(combineMeshes("完整一束宝莲灯小花", bloom, florets)); }
  } else if (kind === 28) {
    parts.push(tapered("针垫花灌木主干", stalk, [[0, 0, 0], [0, 0.7, 0]], [0.018, 0.006]));
    for (let i = 0; i < 12; i++) parts.push(leaf("针垫花宽倒披针硬叶", green, [0, 0.05 + i * 0.04, 0], 0.035, 0.13, [50, i * 137.5 % 360, 0]));
    for (let head = 0; head < 3; head++) { const a = head * Math.PI * 2 / 3; const p: Triple = [Math.cos(a) * 0.16, 0.55 + head * 0.09, Math.sin(a) * 0.16]; parts.push(beam("针垫花分枝花柄", stalk, [0, 0.4, 0], p, 0.006), cap("针垫花半球形共同花托", "#bac3a0", p, 0.045, 0.03, 0)); const pins: ModelPart[] = []; for (let i = 0; i < 36; i++) { const b = i * 2.4; const y = 0.012 + i % 6 * 0.013; const end: Triple = [p[0] + Math.cos(b) * 0.07, p[1] + 0.02 + y, p[2] + Math.sin(b) * 0.07]; pins.push(tapered("长而弯曲外伸的单独花柱", "#ccc29e", [[p[0] + Math.cos(b) * 0.028, p[1] + 0.015, p[2] + Math.sin(b) * 0.028], [end[0] * 0.8 + p[0] * 0.2, p[1] + y, end[2] * 0.8 + p[2] * 0.2], end], [0.0015, 0.0013, 0.001]), lobe("花柱末端花粉承载头", "#d6c8a4", end, [0.005, 0.005, 0.005])); } for (let i = 0; i < pins.length; i += 24) parts.push(combineMeshes("一组完整针垫花柱与柱头", "#ccc29e", pins.slice(i, i + 24))); }
  } else {
    basal(parts, 8, 0.025, 0.48);
    for (let branch = 0; branch < 4; branch++) { const a = branch * Math.PI / 2; const p: Triple = [Math.cos(a) * 0.15, 0.65 + branch % 2 * 0.1, Math.sin(a) * 0.15]; parts.push(tapered("袋鼠爪花分叉花葶", stalk, [[0, 0, 0], [p[0] * 0.5, 0.5, p[2] * 0.5], p], [0.007, 0.004, 0.002]));
      for (let i = 0; i < 4; i++) { const root: Triple = [p[0], p[1] + i * 0.025, p[2]]; const tip: Triple = [p[0] + Math.cos(a) * 0.075, p[1] + i * 0.025 + 0.045, p[2] + Math.sin(a) * 0.075]; parts.push(tapered("袋鼠爪有绒毛质感的长花管", "#bac09e", [root, [tip[0] * 0.8 + p[0] * 0.2, tip[1], tip[2] * 0.8 + p[2] * 0.2], tip], [0.006, 0.009, 0.005])); const claws: ModelPart[] = []; for (let j = 0; j < 6; j++) { const b = j * Math.PI / 3; claws.push(needle("末端六枚爪状花被裂片", bloom, tip, [tip[0] + Math.cos(b) * 0.014, tip[1] + 0.012, tip[2] + Math.sin(b) * 0.014], 0.003)); } parts.push(combineMeshes("完整爪状花口", bloom, claws)); }
    }
  }
  return parts;
}

const names = [["jadeVine", "翡翠葛"], ["dutchmansPipe", "马兜铃"], ["batFlower", "蝙蝠花"], ["balloonMilkweed", "钉头果"], ["bleedingGlorybower", "龙吐珠"], ["pagodaFlower", "宝塔龙船花"], ["crepeGinger", "闭鞘姜"], ["ixora", "仙丹花"], ["frangipani", "鸡蛋花"], ["desertRosePlant", "沙漠玫瑰植株"], ["bottlePlant", "佛肚树"], ["fanBulb", "扇叶毒鳞球"], ["pineappleLily", "凤梨百合"], ["corkscrewPlant", "弹簧草"], ["oxTongue", "子宝"], ["medusaEuphorbia", "美杜莎大戟"], ["pencilTree", "光棍树"], ["jadePlant", "玉树"], ["stringOfButtons", "钱串"], ["motherOfThousands", "落地生根"], ["waxPlant", "球兰"], ["stringOfHearts", "爱之蔓"], ["parachuteFlower", "降落伞花"], ["antPlant", "眼树莲"], ["lipstickPlant", "口红吊兰"], ["goldfishPlant", "金鱼吊兰"], ["oneLeafPrimrose", "文德兰旋果苣"], ["roseGrape", "宝莲灯"], ["pincushionProtea", "针垫花"], ["kangarooPaw", "袋鼠爪花"]];

export const specialFlowerDesigns: MasterNatureDesign[] = names.map(([key, name], index) => design(key!, name!, "植物", () => specialFlower(index), ["独特花冠与叶序的具名植物", ...(key === "batFlower" ? ["蒟蒻薯（旧泛名）", "整叶翼苞型"] : [])]));
