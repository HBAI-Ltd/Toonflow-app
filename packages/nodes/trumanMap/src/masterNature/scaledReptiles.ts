import { combineMeshes, design, eyes, lobe, polygon, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { lump, pointed } from "./insectForms";
import { body } from "./fishForms";
import { membrane } from "./animals";

const hide = "#a9b098";
const pale = "#c6c9ad";
const edge = "#8f9b87";

export function reptileLimb(parts: ModelPart[], root: Triple, joint: Triple, ankle: Triple, radius: number, toes = 5, pads = false, webbed = false) {
  parts.push(tapered("侧展并在肘膝处折弯的有鳞肢", hide, [root, joint, ankle], [radius, radius * 0.75, radius * 0.42]));
  const digits: ModelPart[] = [], tips: Triple[] = [];
  for (let digit = 0; digit < toes; digit++) { const a = (digit / Math.max(1, toes - 1) - 0.5) * 1.9, length = radius * (3.3 + Math.sin(digit / Math.max(1, toes - 1) * Math.PI) * 1.4), tip: Triple = [ankle[0] + Math.sin(a) * length, radius * 0.18, ankle[2] + Math.cos(a) * length]; tips.push(tip); digits.push(pointed("从同一掌根分出的有节独立趾", pale, [ankle, [ankle[0] * 0.25 + tip[0] * 0.75, radius * 0.32, ankle[2] * 0.25 + tip[2] * 0.75], tip], [radius * 0.24, radius * 0.17, 0])); if (pads) digits.push(lump("趾腹末端真正展开的附着盘", tip, [radius * 0.8, radius * 0.25, radius * 1.1], pale)); }
  parts.push(combineMeshes("完整分离的趾列及趾端结构", pale, digits)); if (webbed) parts.push(membrane("各独立趾之间连续相连的宽蹼", pale, [ankle, ...tips]));
}

function tuatara(): ModelPart[] {
  const parts: ModelPart[] = [body("喙头蜥具有坚实肩带和窄腰的低伏躯", [[-0.15, 0.047, 0.024, 0.027], [-0.075, 0.051, 0.046, 0.037], [0.045, 0.055, 0.047, 0.043], [0.11, 0.057, 0.026, 0.03]], hide), polygon("喙头蜥宽颞部向前收尖的上颅与短喙", pale, [[-0.036, 0.1], [-0.04, 0.137], [-0.021, 0.181], [0, 0.191], [0.021, 0.181], [0.04, 0.137], [0.036, 0.1]], 0.027, [0, 0.052, 0]), lobe("喙头蜥上颌下方突出的坚硬短喙", edge, [0, 0.052, 0.174], [0.036, 0.022, 0.026]), ...eyes([0, 0.078, 0.149], 0.028, 0.010)];
  for (const side of [-1, 1]) { reptileLimb(parts, [side * 0.032, 0.05, 0.073], [side * 0.079, 0.035, 0.044], [side * 0.092, 0.006, 0.072], 0.012); reptileLimb(parts, [side * 0.03, 0.045, -0.093], [side * 0.084, 0.038, -0.117], [side * 0.093, 0.006, -0.075], 0.015); }
  parts.push(pointed("喙头蜥粗根逐渐变尖的长圆尾", hide, [[0, 0.047, -0.13], [0.025, 0.03, -0.23], [0.07, 0.013, -0.37], [0.115, 0.007, -0.45]], [0.026, 0.019, 0.009, 0])); const crest: ModelPart[] = [];
  for (let i = 0; i < 18; i++) { const z = 0.105 - i * 0.023, y = z > -0.14 ? 0.084 : 0.054 + (z + 0.14) * 0.16, x = z > -0.14 ? 0 : (-z - 0.14) * 0.25; crest.push(pointed("喙头蜥沿背与尾中线彼此分开的柔软脊鳞", pale, [[x, y - 0.007, z], [x, y + (i < 11 ? 0.019 : 0.011), z - 0.006]], [0.006, 0])); }
  parts.push(combineMeshes("喙头蜥低而不连续的背尾脊鳞列", pale, crest)); return parts;
}

function armadilloLizard(): ModelPart[] {
  const parts: ModelPart[] = [body("犰狳蜥宽扁而具有装甲腰带的实心躯", [[-0.057, 0.027, 0.018, 0.015], [-0.03, 0.03, 0.031, 0.023], [0.03, 0.03, 0.031, 0.021], [0.058, 0.032, 0.02, 0.018]], hide), polygon("犰狳蜥短宽而三角形的骨质头颅", hide, [[-0.025, 0.049], [-0.028, 0.066], [-0.013, 0.089], [0, 0.094], [0.013, 0.089], [0.028, 0.066], [0.025, 0.049]], 0.021, [0, 0.025, 0]), ...eyes([0, 0.043, 0.074], 0.021, 0.0065)];
  for (const side of [-1, 1]) { reptileLimb(parts, [side * 0.02, 0.026, 0.039], [side * 0.044, 0.019, 0.024], [side * 0.047, 0.003, 0.042], 0.006); reptileLimb(parts, [side * 0.02, 0.026, -0.037], [side * 0.048, 0.018, -0.051], [side * 0.05, 0.003, -0.03], 0.007); }
  parts.push(pointed("犰狳蜥粗短而逐渐收尖的装甲尾干", hide, [[0, 0.027, -0.048], [0.007, 0.018, -0.093], [0.025, 0.009, -0.145]], [0.019, 0.013, 0])); const scales: ModelPart[] = [];
  for (let row = 0; row < 10; row++) for (let flank = 0; flank < 7; flank++) { const z = 0.043 - row * 0.017, tail = z < -0.052, t = tail ? (-z - 0.052) / 0.08 : 0, a = flank * Math.PI / 6, r = tail ? 0.018 * (1 - t * 0.62) : 0.03, y = tail ? 0.027 - t * 0.017 : 0.03, x = tail ? t * 0.016 : 0, root: Triple = [x + Math.cos(a) * r * 0.79, y + Math.sin(a) * r * 0.61, z]; scales.push(pointed("犰狳蜥横带上向后翘起且相互覆叠的尖厚骨鳞", pale, [root, [root[0] + Math.cos(a) * 0.006, root[1] + Math.sin(a) * 0.006, z - 0.013]], [0.005, 0])); }
  for (let i = 0; i < scales.length; i += 25) parts.push(combineMeshes("犰狳蜥真正环列并向后重叠的装甲鳞带", pale, scales.slice(i, i + 25))); return parts;
}

function thornyDevil(): ModelPart[] {
  const parts: ModelPart[] = [body("魔蜥低扁椭圆而腹部下垂的躯", [[-0.05, 0.028, 0.016, 0.018], [-0.026, 0.033, 0.031, 0.027], [0.026, 0.032, 0.028, 0.025], [0.043, 0.036, 0.016, 0.018]], hide), polygon("魔蜥宽短头上的三角形吻颅", pale, [[-0.019, 0.038], [-0.022, 0.06], [0, 0.082], [0.022, 0.06], [0.019, 0.038]], 0.021, [0, 0.031, 0]), lobe("魔蜥颈背用于藏真头的独立假头肉瘤", hide, [0, 0.056, 0.03], [0.026, 0.029, 0.021]), ...eyes([0, 0.051, 0.063], 0.016, 0.006)];
  for (const side of [-1, 1]) { reptileLimb(parts, [side * 0.018, 0.027, 0.025], [side * 0.043, 0.027, 0.008], [side * 0.047, 0.003, 0.038], 0.006); reptileLimb(parts, [side * 0.02, 0.025, -0.029], [side * 0.048, 0.022, -0.045], [side * 0.049, 0.003, -0.015], 0.008); }
  parts.push(pointed("魔蜥短而细尖的上弯尾", hide, [[0, 0.025, -0.043], [0, 0.016, -0.083], [0.01, 0.032, -0.125], [0.012, 0.045, -0.15]], [0.013, 0.009, 0.006, 0])); const spines: ModelPart[] = [];
  for (let row = 0; row < 8; row++) for (let i = 0; i < 7; i++) { const a = i * Math.PI / 6, z = -0.043 + row * 0.012, r = 0.023 * (0.7 + Math.sin(row / 7 * Math.PI) * 0.3), p: Triple = [Math.cos(a) * r, 0.03 + Math.sin(a) * r * 0.75, z]; spines.push(pointed("魔蜥由宽圆锥基部生出的尖刺鳞", pale, [p, [p[0] + Math.cos(a) * 0.009, p[1] + Math.sin(a) * 0.013, p[2] - 0.003]], [0.0034, 0])); }
  for (const side of [-1, 1]) spines.push(pointed("魔蜥眼后外展的大型角刺", pale, [[side * 0.014, 0.047, 0.05], [side * 0.032, 0.066, 0.043]], [0.005, 0]));
  for (let i = 0; i < spines.length; i += 25) parts.push(combineMeshes("魔蜥躯干上真正向各方向伸出的圆锥刺鳞", pale, spines.slice(i, i + 25))); return parts;
}

function gilaMonster(): ModelPart[] {
  const parts: ModelPart[] = [body("希拉毒蜥粗腰肥躯与短厚颈", [[-0.115, 0.042, 0.026, 0.027], [-0.06, 0.046, 0.05, 0.038], [0.055, 0.047, 0.048, 0.037], [0.1, 0.05, 0.029, 0.027]], hide), lobe("希拉毒蜥宽而钝圆的厚头颅", pale, [0, 0.053, 0.13], [0.082, 0.058, 0.087]), ...eyes([0, 0.07, 0.144], 0.033, 0.008)];
  for (const side of [-1, 1]) { reptileLimb(parts, [side * 0.033, 0.04, 0.073], [side * 0.076, 0.03, 0.037], [side * 0.085, 0.004, 0.068], 0.013); reptileLimb(parts, [side * 0.033, 0.039, -0.075], [side * 0.077, 0.03, -0.105], [side * 0.084, 0.004, -0.062], 0.015); }
  parts.push(pointed("希拉毒蜥储存脂肪的短而粗壮尾", hide, [[0, 0.04, -0.095], [0.013, 0.03, -0.155], [0.04, 0.02, -0.22], [0.057, 0.013, -0.26]], [0.031, 0.028, 0.02, 0])); const beads: ModelPart[] = [];
  for (let row = 0; row < 13; row++) for (let col = 0; col < 7; col++) { const a = col * Math.PI / 6, z = -0.093 + row * 0.017, radius = z > 0.095 ? 0.029 : 0.042; beads.push(lump("希拉毒蜥皮内圆珠状骨质鳞的凸表", [Math.cos(a) * radius, 0.046 + Math.sin(a) * radius * 0.76, z], [0.0105, 0.008, 0.0105], pale)); }
  for (let i = 0; i < beads.length; i += 35) parts.push(combineMeshes("希拉毒蜥覆盖背侧的实际圆珠骨鳞", pale, beads.slice(i, i + 35)));
  parts.push(pointed("希拉毒蜥伸出的嗅探舌干", edge, [[0, 0.041, 0.16], [0, 0.04, 0.19]], [0.0016, 0])); for (const side of [-1, 1]) parts.push(pointed("希拉毒蜥舌尖真正分叉的细支", edge, [[0, 0.04, 0.184], [side * 0.005, 0.04, 0.201]], [0.0012, 0])); return parts;
}

function mastigure(): ModelPart[] {
  const parts: ModelPart[] = [body("埃及刺尾蜥宽阔的草食性桶状躯", [[-0.105, 0.045, 0.027, 0.026], [-0.058, 0.051, 0.062, 0.043], [0.063, 0.052, 0.055, 0.043], [0.1, 0.052, 0.027, 0.028]], hide), polygon("埃及刺尾蜥向前收成小钝吻的短宽头", pale, [[-0.031, 0.083], [-0.036, 0.122], [-0.017, 0.153], [0.017, 0.153], [0.036, 0.122], [0.031, 0.083]], 0.032, [0, 0.046, 0]), ...eyes([0, 0.074, 0.127], 0.026, 0.008)];
  for (const side of [-1, 1]) { reptileLimb(parts, [side * 0.04, 0.044, 0.07], [side * 0.09, 0.033, 0.033], [side * 0.099, 0.005, 0.079], 0.013); reptileLimb(parts, [side * 0.04, 0.043, -0.067], [side * 0.096, 0.029, -0.096], [side * 0.103, 0.005, -0.045], 0.016); }
  parts.push(pointed("埃及刺尾蜥宽扁的短棒状尾芯", hide, [[0, 0.041, -0.09], [0.009, 0.025, -0.145], [0.025, 0.014, -0.224]], [0.028, 0.027, 0])); const spikes: ModelPart[] = [];
  for (let row = 0; row < 9; row++) { const t = row / 9, z = -0.105 - t * 0.107, radius = 0.029 * (1 - t * 0.75), x = t * 0.02, y = 0.037 - t * 0.02; for (let scale = 0; scale < 9; scale++) { const a = scale / 8 * Math.PI, p: Triple = [x + Math.cos(a) * radius * 0.88, y + Math.sin(a) * radius * 0.7, z]; spikes.push(pointed("埃及刺尾蜥尾部每一完整横环上的后向厚角鳞", pale, [p, [p[0] + Math.cos(a) * 0.007, p[1] + Math.sin(a) * 0.005, z - 0.011]], [0.004, 0])); } }
  for (let i = 0; i < spikes.length; i += 25) parts.push(combineMeshes("埃及刺尾蜥真正环状排列的硬刺尾甲", pale, spikes.slice(i, i + 25))); return parts;
}

function leafTail(): ModelPart[] {
  const parts: ModelPart[] = [body("撒旦叶尾守宫侧扁而背部隆起的细躯", [[-0.025, 0.025, 0.006, 0.009], [0, 0.028, 0.013, 0.018], [0.025, 0.029, 0.01, 0.012]], hide), polygon("撒旦叶尾守宫短吻三角头", pale, [[-0.014, 0.022], [-0.017, 0.035], [0, 0.056], [0.017, 0.035], [0.014, 0.022]], 0.015, [0, 0.025, 0]), ...eyes([0, 0.038, 0.037], 0.0135, 0.010)];
  for (const side of [-1, 1]) { reptileLimb(parts, [side * 0.008, 0.027, 0.02], [side * 0.028, 0.016, 0.012], [side * 0.027, 0.002, 0.033], 0.0038, 5, true); reptileLimb(parts, [side * 0.008, 0.023, -0.017], [side * 0.027, 0.02, -0.031], [side * 0.032, 0.002, -0.019], 0.0048, 5, true); parts.push(pointed("撒旦叶尾守宫眼上向后举起的尖睫状皮肤突", hide, [[side * 0.01, 0.04, 0.032], [side * 0.013, 0.051, 0.027]], [0.004, 0])); }
  parts.push(polygon("撒旦叶尾守宫具有不规则缺刻而非圆柱的扁叶状尾", pale, [[0, -0.019], [-0.008, -0.031], [-0.021, -0.043], [-0.014, -0.049], [-0.025, -0.058], [-0.013, -0.073], [0, -0.086], [0.01, -0.074], [0.011, -0.063], [0.021, -0.059], [0.013, -0.046], [0.017, -0.038], [0.006, -0.027]], 0.0025, [0, 0.019, 0]), tapered("撒旦叶尾守宫尾部连通叶尾中央的隆脉", edge, [[0, 0.022, -0.019], [-0.004, 0.021, -0.047], [0, 0.02, -0.08]], [0.003, 0.002, 0.001])); return parts;
}

function flyingGecko(): ModelPart[] {
  const parts: ModelPart[] = [body("库氏飞守宫细长而背腹压扁的躯", [[-0.042, 0.026, 0.01, 0.009], [-0.02, 0.028, 0.02, 0.012], [0.033, 0.03, 0.017, 0.013], [0.049, 0.03, 0.012, 0.01]], hide), lobe("库氏飞守宫扁宽头与大眼", pale, [0, 0.033, 0.061], [0.036, 0.025, 0.039]), ...eyes([0, 0.042, 0.067], 0.013, 0.009)];
  for (const side of [-1, 1]) { reptileLimb(parts, [side * 0.012, 0.026, 0.031], [side * 0.035, 0.022, 0.017], [side * 0.047, 0.003, 0.036], 0.006, 5, true, true); reptileLimb(parts, [side * 0.013, 0.025, -0.026], [side * 0.038, 0.02, -0.043], [side * 0.05, 0.003, -0.02], 0.007, 5, true, true);
    parts.push(membrane("库氏飞守宫从前后肢之间真正展开的体侧滑翔皮褶", pale, [[side * 0.013, 0.027, 0.034], [side * 0.041, 0.024, 0.02], [side * 0.045, 0.019, 0.002], [side * 0.044, 0.018, -0.018], [side * 0.034, 0.023, -0.041], [side * 0.012, 0.024, -0.035]])); }
  parts.push(pointed("库氏飞守宫尾部中央狭长实心尾干", hide, [[0, 0.025, -0.035], [0.005, 0.021, -0.085], [0.012, 0.016, -0.147]], [0.01, 0.007, 0]));
  const fringe: [number, number][] = [[0, -0.035]]; for (let i = 0; i < 9; i++) { const z = -0.04 - i * 0.011, x = 0.015 * (1 - i / 11); fringe.push([-x, z], [-x * 1.22, z - 0.005]); } fringe.push([-0.001, -0.138], [-0.003, -0.149], [0.006, -0.158], [0.018, -0.151], [0.023, -0.137]); for (let i = 8; i >= 0; i--) { const z = -0.04 - i * 0.011, x = 0.015 * (1 - i / 11); fringe.push([x * 1.22 + 0.007, z - 0.005], [x + 0.007, z]); } const tail = polygon("库氏飞守宫锯齿状尾缘与尾端加宽的完整滑翔膜", pale, fringe, 0.0015, [0, 0.018, 0]); parts.push(tail); return parts;
}

export const scaledReptileDesigns: MasterNatureDesign[] = [
  design("tuatara", "喙头蜥", "动物", tuatara, ["Sphenodon punctatus", "短喙宽颞颅与不连续低背脊鳞"]),
  design("armadilloLizard", "犰狳蜥", "动物", armadilloLizard, ["Ouroborus cataphractus", "宽扁躯与向后重叠的硬骨鳞带"]),
  design("thornyDevil", "魔蜥", "动物", thornyDevil, ["Moloch horridus", "颈部假头与全向圆锥刺鳞"]),
  design("gilaMonster", "希拉毒蜥", "动物", gilaMonster, ["Heloderma suspectum", "圆珠骨鳞粗躯储脂短尾与分叉舌"]),
  design("uromastyx", "埃及刺尾蜥", "动物", mastigure, ["Uromastyx aegyptia", "宽草食躯与真实环列硬刺尾甲"]),
  design("satanicLeafTail", "撒旦叶尾守宫", "动物", leafTail, ["Uroplatus phantasticus", "缺刻扁叶尾与眼上皮突及趾盘"]),
  design("flyingGecko", "库氏飞守宫", "动物", flyingGecko, ["Gekko kuhli", "体侧滑翔褶趾间蹼与锯齿尾膜"]),
];
