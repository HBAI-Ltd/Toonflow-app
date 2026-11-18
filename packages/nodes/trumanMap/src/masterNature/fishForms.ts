import { cap, combineMeshes, design, eyes, frontCup, leaf, lobe, needle, part, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { membrane } from "./animals";
import { tail } from "./marine";

const fishColor = "#a6b6a1";
const finColor = "#bdc7ad";
const dark = "#8f9e8b";

export function body(name: string, sections: [number, number, number, number][], color = fishColor): ModelPart {
  const ascending = sections[0]![0] < sections.at(-1)![0];
  const vertices = sections.flatMap(([z, y, width, height]) => Array.from({ length: 12 }, (_, i) => { const a = i * Math.PI / 6; return { x: Math.cos(a) * width, y: y + Math.sin(a) * height, z }; }));
  const indices: number[] = [];
  for (let row = 0; row < sections.length - 1; row++) for (let i = 0; i < 12; i++) {
    const a = row * 12 + i, b = row * 12 + (i + 1) % 12;
    if (ascending) indices.push(a, b, a + 12, b, b + 12, a + 12);
    else indices.push(a, a + 12, b, b, a + 12, b + 12);
  }
  const end = (sections.length - 1) * 12;
  for (let i = 1; i < 11; i++) {
    if (ascending) indices.push(0, i + 1, i, end, end + i, end + i + 1);
    else indices.push(0, i, i + 1, end, end + i + 1, end + i);
  }
  return part(name, "mesh", color, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

export function ribbon(name: string, zStart: number, zEnd: number, y: number, height: number, lobes = 0): ModelPart {
  const contour: Triple[] = [[0, y, zStart]];
  for (let i = 0; i <= 12; i++) { const t = i / 12; contour.push([0, y + height * Math.sin(Math.PI * (0.1 + t * 0.8)) + Math.sin(t * Math.PI * lobes) * height * 0.08, zStart + t * (zEnd - zStart)]); }
  contour.push([0, y, zEnd]); return membrane(name, finColor, contour);
}

export function pectorals(parts: ModelPart[], root: Triple, span: number, height: number) {
  for (const side of [-1, 1]) parts.push(membrane("独立胸鳍", finColor, [[side * span * 0.2, root[1], root[2]], [side * span, root[1] + height, root[2] - span * 0.55], [side * span * 0.7, root[1] - height * 0.25, root[2] - span], [side * span * 0.2, root[1] - height * 0.2, root[2] - span * 0.25]]));
}

function fish(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  if (kind === 0) {
    parts.push(tapered("七鳃鳗无颌的鳗形体", fishColor, [[0, 0.065, 0.26], [0, 0.06, 0.08], [0.035, 0.055, -0.14], [0.025, 0.045, -0.31]], [0.032, 0.04, 0.024, 0.002]), frontCup("七鳃鳗真实漏斗吸盘口", "#c5c9ae", [0, 0.065, 0.28], 0.035, 0.015), ribbon("七鳃鳗尾部连续鳍褶", -0.02, -0.31, 0.07, 0.04));
    for (const side of [-1, 1]) for (let i = 0; i < 7; i++) { const opening = cap("体侧七对独立鳃孔缘", dark, [side * 0.033, 0.068, 0.18 - i * 0.018], 0.004, 0.0025, 3); opening.rotation.z = side * 90; parts.push(opening); }
    const teeth: ModelPart[] = []; for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8; teeth.push(needle("吸盘内部环列角质齿", "#d8d1b3", [Math.cos(a) * 0.024, 0.065 + Math.sin(a) * 0.024, 0.29], [Math.cos(a) * 0.017, 0.065 + Math.sin(a) * 0.017, 0.298], 0.003)); } parts.push(combineMeshes("完整圆口齿环", "#d8d1b3", teeth), ...eyes([0, 0.08, 0.21], 0.029, 0.01));
  } else if (kind === 1) {
    parts.push(tapered("盲鳗可打结的柔软无颌体", "#b5bfa9", [[0, 0.04, 0.28], [0, 0.035, 0.06], [0.07, 0.04, -0.12], [0.09, 0.035, -0.25], [-0.03, 0.03, -0.27], [-0.045, 0.035, -0.15]], [0.02, 0.026, 0.024, 0.021, 0.014, 0.002]));
    for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; parts.push(tapered("盲鳗口周触须", finColor, [[Math.cos(a) * 0.012, 0.04 + Math.sin(a) * 0.012, 0.28], [Math.cos(a) * 0.035, 0.04 + Math.sin(a) * 0.035, 0.31]], [0.002, 0.0007])); }
    parts.push(ribbon("盲鳗末端腹侧鳍褶", -0.08, -0.23, 0.03, -0.018));
  } else if (kind === 2) {
    parts.push(body("泥鳅前圆后侧扁的长体", [[0.15, 0.035, 0.023, 0.018], [0.1, 0.037, 0.027, 0.024], [-0.04, 0.033, 0.023, 0.025], [-0.13, 0.032, 0.01, 0.02]]), ...eyes([0, 0.046, 0.12], 0.019, 0.008));
    for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5; parts.push(tapered("泥鳅五对口须", finColor, [[Math.cos(a) * 0.014, 0.033, 0.148], [Math.cos(a) * 0.036, 0.02 + Math.sin(a) * 0.01, 0.175]], [0.0015, 0.0005])); }
    pectorals(parts, [0, 0.025, 0.08], 0.045, 0.006); parts.push(ribbon("泥鳅短背鳍", 0, -0.055, 0.054, 0.025), ...tail([0, 0.032, -0.13], 0.035, true));
  } else if (kind === 3) {
    parts.push(body("鲤鱼拱背而腹部平缓的躯体", [[0.25, 0.14, 0.03, 0.05], [0.14, 0.16, 0.075, 0.095], [0, 0.155, 0.085, 0.12], [-0.18, 0.13, 0.02, 0.05]]), ribbon("鲤鱼长基底硬棘背鳍", 0.09, -0.14, 0.235, 0.07), ...tail([0, 0.13, -0.18], 0.13, true), ...eyes([0, 0.18, 0.19], 0.05, 0.022));
    pectorals(parts, [0, 0.11, 0.13], 0.13, 0.012);
    for (const side of [-1, 1]) for (const length of [0.04, 0.07]) parts.push(tapered("鲤鱼口角两对须", finColor, [[side * 0.019, 0.12, 0.25], [side * length, 0.09, 0.27]], [0.003, 0.001]));
    const scales: ModelPart[] = []; for (let row = 0; row < 4; row++) for (let i = 0; i < 9; i++) for (const side of [-1, 1]) scales.push(leaf("鱼体叠覆的圆鳞", "#b9c1a7", [side * (0.07 - Math.abs(row - 1.5) * 0.006), 0.09 + row * 0.035, 0.14 - i * 0.034], 0.027, 0.033, [90, side * 80, 0])); for (let i = 0; i < scales.length; i += 36) parts.push(combineMeshes("整侧真实叠鳞", "#b9c1a7", scales.slice(i, i + 36)));
  } else if (kind === 4) {
    parts.push(body("金鱼隆起的短深体", [[0.085, 0.095, 0.022, 0.04], [0.025, 0.1, 0.055, 0.07], [-0.045, 0.085, 0.03, 0.045], [-0.07, 0.08, 0.012, 0.025]]), ...eyes([0, 0.11, 0.065], 0.027, 0.019), ribbon("金鱼背部高扇鳍", 0.035, -0.055, 0.15, 0.07));
    for (const side of [-1, 1]) parts.push(membrane("金鱼成对展开的双尾叶", "#c9c7a6", [[side * 0.005, 0.08, -0.065], [side * 0.06, 0.15, -0.16], [side * 0.07, 0.08, -0.2], [side * 0.05, 0.015, -0.17], [side * 0.005, 0.07, -0.065]]));
    pectorals(parts, [0, 0.075, 0.045], 0.06, 0.005);
  } else if (kind === 5) {
    parts.push(body("斗鱼侧扁短躯", [[0.07, 0.11, 0.01, 0.017], [0.025, 0.11, 0.021, 0.032], [-0.045, 0.105, 0.01, 0.025]]), ...eyes([0, 0.12, 0.055], 0.013, 0.008));
    parts.push(ribbon("斗鱼波缘长背鳍", 0.035, -0.075, 0.135, 0.055, 9), ribbon("斗鱼垂帘状长臀鳍", 0.04, -0.09, 0.085, -0.065, 11));
    const outline: Triple[] = [[0, 0.12, -0.045]]; for (let i = 0; i <= 18; i++) { const a = -Math.PI * 0.62 + i / 18 * Math.PI * 1.24; outline.push([0, 0.105 + Math.sin(a) * (0.07 + i % 2 * 0.004), -0.048 - Math.cos(a) * 0.08]); } outline.push([0, 0.09, -0.045]); parts.push(membrane("斗鱼完整半月尾鳍", finColor, outline));
    for (const side of [-1, 1]) parts.push(leaf("斗鱼细长腹鳍", finColor, [side * 0.01, 0.09, 0.032], 0.005, 0.068, [160, 0, side * 20]));
  } else if (kind === 6 || kind === 7) {
    const sword = kind === 7; parts.push(body(sword ? "剑尾鱼细长躯" : "孔雀鱼前宽后细躯", sword ? [[0.085, 0.07, 0.012, 0.02], [0.015, 0.07, 0.019, 0.03], [-0.055, 0.07, 0.008, 0.018]] : [[0.045, 0.055, 0.007, 0.012], [0.01, 0.055, 0.014, 0.018], [-0.03, 0.055, 0.005, 0.01]]), ...eyes([0, sword ? 0.078 : 0.062, sword ? 0.068 : 0.033], sword ? 0.009 : 0.006, sword ? 0.006 : 0.004));
    if (sword) { parts.push(...tail([0, 0.07, -0.055], 0.045, true), membrane("雄剑尾下叶延长成剑", finColor, [[0, 0.075, -0.08], [0, 0.035, -0.105], [0, 0.015, -0.19], [0, 0.045, -0.13]]), ribbon("剑尾鱼短背鳍", 0.015, -0.025, 0.092, 0.035)); }
    else parts.push(membrane("孔雀鱼三角形宽尾", "#b6bba0", [[0, 0.065, -0.027], [0, 0.1, -0.1], [0, 0.01, -0.1], [0, 0.045, -0.027]]), ribbon("孔雀鱼后掠短背鳍", 0.005, -0.028, 0.07, 0.025));
    pectorals(parts, [0, sword ? 0.065 : 0.052, sword ? 0.04 : 0.015], sword ? 0.025 : 0.018, 0.004);
  } else if (kind === 8) {
    const trunk = body("玻璃猫细长透明体", [[0.095, 0.075, 0.012, 0.02], [0.035, 0.07, 0.018, 0.03], [-0.07, 0.06, 0.007, 0.018]]); trunk.opacity = 0.4; parts.push(trunk, tapered("透明体内可见中轴", "#d2d2b8", [[0, 0.075, 0.075], [0, 0.07, -0.07]], [0.003, 0.0015]), ribbon("玻璃猫腹侧长基底臀鳍", 0.045, -0.08, 0.05, -0.03), ...tail([0, 0.06, -0.07], 0.04, true), ...eyes([0, 0.082, 0.073], 0.009, 0.008));
    for (const side of [-1, 1]) parts.push(tapered("玻璃猫长触须", finColor, [[side * 0.008, 0.065, 0.095], [side * 0.04, 0.07, 0.15], [side * 0.06, 0.08, 0.2]], [0.0015, 0.0008, 0.0004]));
  } else if (kind === 9) {
    parts.push(body("刺鱼粗前躯和细尾柄", [[0.07, 0.06, 0.01, 0.014], [0.015, 0.06, 0.019, 0.027], [-0.05, 0.055, 0.005, 0.01]]), ...tail([0, 0.055, -0.05], 0.025, true), ...eyes([0, 0.067, 0.053], 0.01, 0.006));
    for (let i = 0; i < 3; i++) parts.push(needle("互不相连的背部硬棘", "#cdd0b5", [0, 0.083, 0.035 - i * 0.025], [0, 0.12 + i % 2 * 0.01, 0.028 - i * 0.025], 0.003));
    for (const side of [-1, 1]) parts.push(needle("腹部一对强硬棘", "#cdd0b5", [side * 0.01, 0.045, 0.01], [side * 0.02, 0.012, -0.005], 0.003)); pectorals(parts, [0, 0.055, 0.035], 0.035, 0.004);
  } else if (kind === 10 || kind === 11) {
    const snake = kind === 11; parts.push(body(snake ? "鳢鱼蛇形圆柱躯和扁头" : "弓鳍鱼粗前躯和长尾柄", [[0.27, 0.09, snake ? 0.045 : 0.03, 0.035], [0.15, 0.1, snake ? 0.05 : 0.06, 0.06], [-0.08, 0.09, 0.043, 0.06], [-0.28, 0.08, 0.012, 0.025]]), ribbon(snake ? "鳢鱼连贯的高背鳍" : "弓鳍鱼漫长柔软背鳍", 0.1, -0.27, 0.14, snake ? 0.055 : 0.07), ...eyes([0, 0.112, 0.235], 0.032, 0.015));
    parts.push(membrane("圆端单尾鳍", finColor, [[0, 0.1, -0.27], [0, 0.14, -0.36], [0, 0.08, -0.4], [0, 0.02, -0.36], [0, 0.06, -0.27]]));
    if (snake) { parts.push(ribbon("鳢鱼长基底臀鳍", -0.04, -0.26, 0.05, -0.035)); for (const side of [-1, 1]) parts.push(lobe("蛇头鱼突出的硬鳞颊板", "#bcc4aa", [side * 0.035, 0.1, 0.18], [0.026, 0.07, 0.08])); }
    else parts.push(ribbon("弓鳍鱼尾前短臀鳍", -0.16, -0.25, 0.05, -0.03), cap("弓鳍鱼下颌骨板", "#c8ccb2", [0, 0.062, 0.235], 0.03, 0.012, 2)); pectorals(parts, [0, 0.075, 0.16], 0.1, 0.01);
  } else if (kind === 12) {
    parts.push(tapered("黄鳝几乎无鳍的圆筒躯", "#aeb89b", [[0, 0.04, 0.3], [0, 0.035, 0.12], [0.035, 0.035, -0.1], [0.01, 0.025, -0.34], [-0.06, 0.02, -0.46]], [0.024, 0.027, 0.024, 0.014, 0.002]), ...eyes([0, 0.05, 0.28], 0.017, 0.006));
    parts.push(needle("腹侧单一鳃口下缘", "#c5c7aa", [-0.014, 0.023, 0.23], [0.014, 0.023, 0.23], 0.002));
  } else if (kind === 13) {
    parts.push(body("甲鲶扁腹宽头和窄尾柄", [[0.19, 0.07, 0.055, 0.025], [0.1, 0.075, 0.065, 0.045], [-0.08, 0.07, 0.03, 0.04], [-0.2, 0.055, 0.008, 0.017]]), ribbon("甲鲶高大的张开背鳍", 0.09, -0.07, 0.11, 0.16), ...tail([0, 0.055, -0.2], 0.085, true), ...eyes([0, 0.1, 0.13], 0.04, 0.016));
    const sucker = cap("甲鲶腹面圆形吸附口", "#c4c9af", [0, 0.042, 0.17], 0.027, 0.01, 3); sucker.rotation.x = 180; parts.push(sucker);
    const armor: ModelPart[] = []; for (let row = 0; row < 3; row++) for (let i = 0; i < 8; i++) for (const side of [-1, 1]) armor.push(lobe("体侧纵列骨甲", "#b8c0a6", [side * (0.054 - i * 0.004), 0.045 + row * 0.027, 0.11 - i * 0.035], [0.017, 0.028, 0.04])); for (let i = 0; i < armor.length; i += 24) parts.push(combineMeshes("整列真实骨质甲片", "#b8c0a6", armor.slice(i, i + 24))); pectorals(parts, [0, 0.045, 0.09], 0.13, 0.006);
  } else if (kind === 14) {
    parts.push(body("象鼻鱼前隆后细的高侧扁体", [[0.12, 0.095, 0.02, 0.045], [0.055, 0.13, 0.034, 0.085], [-0.07, 0.12, 0.022, 0.065], [-0.15, 0.1, 0.006, 0.016]]), tapered("下唇延长的柔软电感觉鼻", "#bfc6a9", [[0, 0.065, 0.13], [0.005, 0.025, 0.165], [0.01, 0.017, 0.2]], [0.008, 0.006, 0.002]), ...eyes([0, 0.12, 0.105], 0.02, 0.012), ribbon("靠尾的短高背鳍", -0.07, -0.14, 0.15, 0.05), ribbon("与背鳍对称的臀鳍", -0.065, -0.14, 0.075, -0.045), ...tail([0, 0.1, -0.15], 0.045, true)); pectorals(parts, [0, 0.1, 0.06], 0.07, 0.015);
  } else if (kind === 15) {
    parts.push(body("胭脂鱼幼鱼陡高背部与平腹", [[0.16, 0.08, 0.022, 0.035], [0.08, 0.11, 0.045, 0.075], [-0.02, 0.11, 0.035, 0.065], [-0.13, 0.07, 0.01, 0.025]]), membrane("胭脂鱼幼鱼标志性的高帆背鳍", finColor, [[0, 0.14, 0.08], [0, 0.34, 0.015], [0, 0.16, -0.065], [0, 0.095, -0.12]]), ...tail([0, 0.07, -0.13], 0.07, true), ...eyes([0, 0.1, 0.13], 0.02, 0.012), cap("胭脂鱼下位吸食厚唇", "#c8ccb0", [0, 0.047, 0.15], 0.015, 0.01, 3)); pectorals(parts, [0, 0.06, 0.1], 0.08, 0.005);
  } else if (kind === 16) {
    parts.push(body("食人鱼短而极高的侧扁体", [[0.13, 0.12, 0.025, 0.04], [0.065, 0.145, 0.05, 0.09], [-0.04, 0.14, 0.04, 0.09], [-0.12, 0.12, 0.01, 0.025]]), lobe("食人鱼前突而厚实的下颌", "#bdc4a9", [0, 0.085, 0.13], [0.065, 0.045, 0.07]), ...eyes([0, 0.15, 0.09], 0.033, 0.018), ribbon("食人鱼短背鳍", 0.01, -0.08, 0.215, 0.06), ribbon("食人鱼较长的臀鳍", 0, -0.105, 0.063, -0.035), ...tail([0, 0.12, -0.12], 0.07, true));
    for (let i = 0; i < 9; i++) parts.push(needle("相互嵌合的三角形门齿", "#dbd5b8", [(i - 4) * 0.005, 0.105, 0.15], [(i - 4) * 0.005, 0.118, 0.151], 0.005)); pectorals(parts, [0, 0.11, 0.06], 0.07, 0.006);
  } else if (kind === 17) {
    parts.push(body("银龙鱼低背长带形躯", [[0.28, 0.13, 0.025, 0.035], [0.19, 0.13, 0.055, 0.075], [-0.12, 0.12, 0.045, 0.08], [-0.3, 0.1, 0.016, 0.04]]), lobe("银龙鱼明显上翘的大下颌", "#c2c8af", [0, 0.115, 0.29], [0.075, 0.045, 0.1], [20, 0, 0]), ...eyes([0, 0.16, 0.235], 0.035, 0.019), ribbon("银龙鱼后半部连续背鳍", -0.07, -0.3, 0.185, 0.045), ribbon("银龙鱼后半部连续臀鳍", -0.04, -0.3, 0.06, -0.04), ...tail([0, 0.1, -0.3], 0.075, true));
    for (const side of [-1, 1]) parts.push(tapered("银龙鱼前伸颏须", finColor, [[side * 0.01, 0.12, 0.33], [side * 0.02, 0.145, 0.39]], [0.0025, 0.001]));
    const scales: ModelPart[] = []; for (const side of [-1, 1]) for (let row = 0; row < 3; row++) for (let i = 0; i < 12; i++) scales.push(leaf("银龙鱼硕大硬鳞", "#b8c3ad", [side * (0.045 - i * 0.002), 0.075 + row * 0.04, 0.18 - i * 0.037], 0.04, 0.045, [90, side * 85, 0])); for (let i = 0; i < scales.length; i += 36) parts.push(combineMeshes("银龙鱼整侧重叠硬鳞", "#b8c3ad", scales.slice(i, i + 36))); pectorals(parts, [0, 0.1, 0.16], 0.15, 0.02);
  } else if (kind === 18) {
    parts.push(body("丝足鲈侧扁椭圆高躯", [[0.15, 0.14, 0.025, 0.035], [0.06, 0.145, 0.055, 0.095], [-0.075, 0.14, 0.04, 0.08], [-0.15, 0.12, 0.01, 0.03]]), ribbon("丝足鲈长后掠背鳍", 0.025, -0.15, 0.215, 0.045), ribbon("丝足鲈漫长臀鳍", 0.09, -0.15, 0.075, -0.045), ...tail([0, 0.12, -0.15], 0.08, true), ...eyes([0, 0.16, 0.12], 0.028, 0.016));
    for (const side of [-1, 1]) parts.push(tapered("专化为触丝的极长腹鳍", finColor, [[side * 0.015, 0.065, 0.08], [side * 0.045, 0.025, -0.02], [side * 0.09, 0.01, -0.19]], [0.003, 0.0015, 0.0005])); pectorals(parts, [0, 0.13, 0.08], 0.075, 0.012);
  } else {
    parts.push(body("狗鱼背腹较平的长枪形体", [[0.38, 0.095, 0.025, 0.016], [0.24, 0.1, 0.05, 0.05], [0.04, 0.095, 0.06, 0.07], [-0.23, 0.085, 0.035, 0.055], [-0.34, 0.08, 0.012, 0.025]]), lobe("狗鱼扁平鸭嘴状吻", "#bec5ab", [0, 0.087, 0.36], [0.075, 0.04, 0.17]), ...eyes([0, 0.124, 0.255], 0.034, 0.018), ribbon("狗鱼极靠后的背鳍", -0.2, -0.31, 0.13, 0.085), ribbon("与背鳍对应的后臀鳍", -0.2, -0.31, 0.05, -0.04), ...tail([0, 0.08, -0.34], 0.1, true)); pectorals(parts, [0, 0.065, 0.18], 0.11, 0.01);
  }
  return parts;
}

const names = [["lamprey", "七鳃鳗"], ["hagfish", "盲鳗"], ["loach", "泥鳅"], ["carp", "鲤鱼"], ["goldfish", "金鱼"], ["betta", "斗鱼"], ["guppy", "孔雀鱼"], ["swordtail", "剑尾鱼"], ["glassCatfish", "玻璃猫"], ["stickleback", "刺鱼"], ["bowfin", "弓鳍鱼"], ["snakehead", "鳢鱼"], ["swampEel", "黄鳝"], ["armoredCatfish", "甲鲶"], ["elephantnose", "象鼻鱼"], ["chineseSucker", "胭脂鱼"], ["piranha", "食人鱼"], ["arowana", "银龙鱼"], ["gourami", "丝足鲈"], ["pike", "狗鱼"]];

export const fishFormDesigns: MasterNatureDesign[] = names.map(([key, name], index) => design(key!, name!, "动物", () => fish(index), ["具名鱼类体形与专化器官"]));
