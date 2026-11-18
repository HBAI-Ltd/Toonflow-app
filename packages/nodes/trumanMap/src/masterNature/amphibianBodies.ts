import { combineMeshes, design, eyes, lobe, polygon, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { lump, pointed } from "./insectForms";
import { body } from "./fishForms";
import { membrane } from "./animals";
import { strip } from "./shapedFoods";

const skin = "#9eaf94";
const pale = "#c4cbb0";
const fold = "#adb99d";

export function frogLimbs(parts: ModelPart[], width: number, height: number, front: number, back: number, radius: number, webbed = false, discs = false) {
  for (const side of [-1, 1]) for (const rear of [false, true]) {
    const at: Triple = [side * width * 0.55, height, rear ? back : front], joint: Triple = [side * width * (rear ? 1.6 : 1.2), height * 0.63, (rear ? back : front) - radius * (rear ? 4.5 : 2)], wrist: Triple = [side * width * 1.4, radius * 0.35, (rear ? back : front) + radius * (rear ? 1 : 3)], count = rear ? 5 : 4, pieces: ModelPart[] = [], tips: Triple[] = [];
    parts.push(tapered(rear ? "蛙类粗股部折回胫部的后肢" : "蛙类细前臂与前掌", skin, [at, joint, wrist], [radius * (rear ? 2.4 : 0.9), radius * (rear ? 1.35 : 0.7), radius * 0.4]));
    for (let toe = 0; toe < count; toe++) { const a = (toe / (count - 1) - 0.5) * 1.6, length = radius * (rear ? 5.2 : 3), tip: Triple = [wrist[0] + Math.sin(a) * length, radius * 0.16, wrist[2] + Math.cos(a) * length]; tips.push(tip); pieces.push(pointed("彼此分开的细长有节蛙趾", pale, [wrist, [tip[0], radius * 0.35, wrist[2] * 0.3 + tip[2] * 0.7], tip], [radius * 0.2, radius * 0.13, 0])); if (discs) pieces.push(lump("蛙趾末端真实扩展的扁圆趾盘", tip, [radius * 0.75, radius * 0.26, radius * 0.8], pale)); }
    parts.push(combineMeshes("前四后五的完整独立趾列", pale, pieces)); if (webbed && rear) parts.push(membrane("后足各趾之间完整相连的游泳蹼", pale, [wrist, ...tips]));
  }
}

function darwinFrog(): ModelPart[] {
  const parts: ModelPart[] = [body("达尔文蛙背高而腹窄的三角形小躯", [[-0.013, 0.009, 0.003, 0.004], [-0.004, 0.011, 0.008, 0.007], [0.006, 0.012, 0.007, 0.007]], skin), polygon("达尔文蛙前端真实延长成肉质尖吻的三角头", skin, [[-0.007, 0.002], [-0.009, 0.009], [-0.003, 0.017], [0, 0.022], [0.003, 0.017], [0.009, 0.009], [0.007, 0.002]], 0.006, [0, 0.011, 0]), ...eyes([0, 0.017, 0.01], 0.0065, 0.003), lobe("达尔文蛙雄体下颌后的软质育幼声囊", pale, [0, 0.0095, 0.008], [0.0105, 0.007, 0.013])]; frogLimbs(parts, 0.0065, 0.009, 0.004, -0.008, 0.0018); return parts;
}

function glassFrog(): ModelPart[] {
  const sections: [number, number, number, number][] = [[-0.008, 0.0075, 0.003, 0.003], [-0.002, 0.008, 0.0065, 0.0045], [0.007, 0.0085, 0.005, 0.004]], shell = body("雅库玻璃蛙上部完整的青绿色背皮", sections, skin), lower = body("雅库玻璃蛙可透见内脏而非整躯透明的腹皮", sections, pale);
  for (const [p, upper] of [[shell, true], [lower, false]] as const) { const faces: number[] = []; for (let i = 0; i < p.indices!.length; i += 3) { const triangle = p.indices!.slice(i, i + 3); if (triangle.every(index => { const row = Math.floor(index / 12); return upper ? p.vertices![index]!.y >= sections[row]![1] - 1e-10 : p.vertices![index]!.y <= sections[row]![1] + 1e-10; })) faces.push(...triangle); } p.indices = faces; }
  lower.opacity = 0.28; lower.roughness = 0.45;
  const parts: ModelPart[] = [shell, lower, lobe("雅库玻璃蛙宽而截平的短吻头", skin, [0, 0.009, 0.011], [0.013, 0.0075, 0.009]), ...eyes([0, 0.012, 0.012], 0.0045, 0.0042), lump("玻璃蛙透明心包内可见的心脏实体", [0, 0.0072, 0.004], [0.0025, 0.003, 0.0028], "#b29386"), lump("玻璃蛙覆有白色腹膜的膨大肝脏", [0, 0.0062, 0], [0.0055, 0.0034, 0.0045], pale)];
  frogLimbs(parts, 0.0052, 0.007, 0.005, -0.005, 0.0017, true, true); parts.push(tapered("玻璃蛙透明腹部下真实盘曲的肠道", pale, [[0.0015, 0.006, -0.001], [0.003, 0.0058, -0.003], [0, 0.0055, -0.005], [-0.002, 0.0058, -0.003], [0, 0.006, -0.002]], [0.00055, 0.0005, 0.0005, 0.0005, 0.00045])); return parts;
}

function budgettFrog(): ModelPart[] {
  const outline: [number, number][] = [[-0.045, -0.015], [-0.059, 0.012], [-0.052, 0.043], [-0.028, 0.059], [0.028, 0.059], [0.052, 0.043], [0.059, 0.012], [0.045, -0.015]], parts: ModelPart[] = [lobe("巴杰特蛙宽扁而头躯几乎连成圆盘的后躯", skin, [0, 0.033, -0.022], [0.112, 0.06, 0.106]), polygon("巴杰特蛙宽大上颅形成真实横向阔口的上缘", skin, outline, 0.023, [0, 0.033, 0]), polygon("巴杰特蛙与上颅真正留有开口的宽下颌", pale, outline.map(([x, z]) => [x * 0.92, z * 0.96]), 0.012, [0, 0.012, 0]), ...eyes([0, 0.058, 0.027], 0.026, 0.014)];
  for (const side of [-1, 1]) parts.push(pointed("巴杰特蛙下颌内一对牙状骨突", pale, [[side * 0.018, 0.023, 0.045], [side * 0.018, 0.033, 0.045]], [0.002, 0])); frogLimbs(parts, 0.043, 0.026, 0.009, -0.045, 0.007, true); return parts;
}

function hairyFrog(): ModelPart[] {
  const parts: ModelPart[] = [body("毛蛙雄体具有粗壮肩带的宽扁躯", [[-0.047, 0.026, 0.012, 0.012], [-0.017, 0.031, 0.036, 0.025], [0.025, 0.034, 0.038, 0.024]], skin), lobe("毛蛙短吻而宽大的头", fold, [0, 0.036, 0.043], [0.073, 0.04, 0.055]), ...eyes([0, 0.051, 0.049], 0.025, 0.011)]; frogLimbs(parts, 0.031, 0.026, 0.02, -0.033, 0.007, true);
  const papillae: ModelPart[] = [];
  for (const side of [-1, 1]) for (let i = 0; i < 28; i++) { const z = -0.038 + i % 14 * 0.0044, x = side * (i < 14 ? 0.029 : 0.034), y = i < 14 ? 0.025 : 0.031, tip: Triple = [x + side * (0.009 + i % 3 * 0.0015), y - 0.009, z - 0.002]; papillae.push(pointed("毛蛙繁殖雄体真实皮肤呼吸乳突而非毛发", fold, [[x, y, z], tip], [0.0008, 0])); }
  for (let i = 0; i < papillae.length; i += 25) parts.push(combineMeshes("毛蛙体侧密生而各自分离的呼吸皮突", fold, papillae.slice(i, i + 25))); return parts;
}

function titicacaFrog(): ModelPart[] {
  const parts: ModelPart[] = [body("的的喀喀湖水蛙低扁而宽厚的水栖躯", [[-0.064, 0.039, 0.024, 0.022], [-0.02, 0.045, 0.052, 0.033], [0.044, 0.048, 0.047, 0.03]], skin), lobe("湖水蛙平阔头与上置小眼", fold, [0, 0.05, 0.067], [0.096, 0.043, 0.073]), ...eyes([0, 0.067, 0.076], 0.032, 0.013)]; frogLimbs(parts, 0.043, 0.036, 0.035, -0.048, 0.010, true);
  for (const side of [-1, 1]) for (let foldIndex = 0; foldIndex < 6; foldIndex++) { const z = -0.056 + foldIndex * 0.017, x = side * (0.039 + Math.sin(foldIndex / 5 * Math.PI) * 0.009); parts.push(strip("湖水蛙体侧连续垂挂且反复折叠的厚呼吸皮褶", fold, [[x * 0.75, 0.05, z], [x, 0.044, z + 0.005], [x + side * 0.012, 0.024, z + 0.007], [x + side * 0.005, 0.016, z + 0.012]], 0.011, 0.0014)); }
  return parts;
}

function featheryGills(parts: ModelPart[], at: Triple, span: number, radius: number, spread: number) {
  for (const side of [-1, 1]) for (let branch = 0; branch < 3; branch++) { const root: Triple = [at[0] + side * spread, at[1], at[2] - branch * radius * 1.8], end: Triple = [root[0] + side * span, root[1] + span * (0.7 - branch * 0.25), root[2] - span * 0.4], pieces: ModelPart[] = [pointed("持续保留的外鳃枝轴", fold, [root, end], [radius * 0.5, 0])];
    for (let i = 1; i <= 6; i++) for (const flank of [-1, 1]) { const t = i / 7, p: Triple = [root[0] + (end[0] - root[0]) * t, root[1] + (end[1] - root[1]) * t, root[2] + (end[2] - root[2]) * t]; pieces.push(pointed("外鳃枝两侧真实分离的羽状鳃丝", pale, [p, [p[0] + side * radius * 0.5, p[1] + radius * 1.2, p[2] + flank * radius * 2.3]], [radius * 0.18, 0])); } parts.push(combineMeshes("一根带两列羽状鳃丝的真实外鳃", fold, pieces)); }
}

function olm(): ModelPart[] {
  const parts: ModelPart[] = [tapered("洞螈细长而近乎圆柱的洞穴躯", pale, [[0, 0.013, 0.095], [0, 0.012, 0.035], [0.006, 0.011, -0.035], [0.012, 0.011, -0.085]], [0.007, 0.0075, 0.007, 0.0055]), polygon("洞螈无外露眼球且吻端截平的长扁头", pale, [[-0.006, 0.088], [-0.009, 0.107], [-0.006, 0.124], [0.006, 0.124], [0.009, 0.107], [0.006, 0.088]], 0.0065, [0, 0.009, 0]), pointed("洞螈具有小鳍缘的长侧扁尾芯", pale, [[0.012, 0.011, -0.075], [0.02, 0.011, -0.117], [0.035, 0.009, -0.15]], [0.0055, 0.004, 0])];
  for (const side of [-1, 1]) for (const rear of [false, true]) { const z = rear ? -0.06 : 0.066, x = rear ? 0.009 : 0, wrist: Triple = [x + side * 0.016, 0.003, z + 0.004]; parts.push(tapered("洞螈细弱而彼此远离的四肢", pale, [[x + side * 0.005, 0.011, z], [x + side * 0.014, 0.009, z - 0.007], wrist], [0.0016, 0.0013, 0.001])); const digits: ModelPart[] = []; for (let i = 0; i < (rear ? 2 : 3); i++) digits.push(pointed("洞螈前足三趾后足二趾的无爪趾", pale, [wrist, [wrist[0] + (i - (rear ? 0.5 : 1)) * 0.002, 0.0018, z + 0.011]], [0.00055, 0])); parts.push(combineMeshes("洞螈一足真实无蹼细趾", pale, digits)); }
  parts.push(membrane("洞螈侧扁长尾上的连续上下鳍褶", pale, [[0.012, 0.011, -0.075], [0.014, 0.019, -0.095], [0.028, 0.016, -0.139], [0.035, 0.009, -0.15], [0.028, 0.003, -0.135], [0.016, 0.005, -0.095]])); featheryGills(parts, [0, 0.013, 0.084], 0.008, 0.0016, 0.006); return parts;
}

function greaterSiren(): ModelPart[] {
  const parts: ModelPart[] = [tapered("大鳗螈没有后肢的粗圆鳗形长躯", skin, [[0, 0.036, 0.25], [0, 0.035, 0.14], [-0.016, 0.033, -0.01], [0.014, 0.032, -0.17]], [0.024, 0.026, 0.025, 0.018]), lobe("大鳗螈方圆短颌与小侧眼的头", fold, [0, 0.038, 0.276], [0.06, 0.04, 0.07]), ...eyes([0, 0.047, 0.29], 0.021, 0.006), pointed("大鳗螈占全长近三分之一的侧扁尾芯", skin, [[0.014, 0.032, -0.155], [0.04, 0.03, -0.26], [0.02, 0.026, -0.37]], [0.019, 0.013, 0])];
  for (const side of [-1, 1]) { const wrist: Triple = [side * 0.045, 0.006, 0.199]; parts.push(tapered("大鳗螈仅有的一对短小前肢", skin, [[side * 0.019, 0.033, 0.214], [side * 0.046, 0.025, 0.211], wrist], [0.006, 0.0045, 0.0028])); const toes: ModelPart[] = []; for (let i = 0; i < 4; i++) toes.push(pointed("大鳗螈前足彼此分开的四枚小趾", pale, [wrist, [wrist[0] + (i - 1.5) * 0.0038, 0.0035, 0.216 + Math.sin(i) * 0.003]], [0.001, 0])); parts.push(combineMeshes("大鳗螈一只四趾前足", pale, toes)); }
  parts.push(membrane("大鳗螈尾部真实竖立的宽桨状上下鳍褶", fold, [[0.014, 0.032, -0.155], [0.023, 0.061, -0.2], [0.041, 0.06, -0.28], [0.02, 0.026, -0.37], [0.04, 0.004, -0.29], [0.025, 0.006, -0.2]])); featheryGills(parts, [0, 0.037, 0.24], 0.029, 0.0045, 0.022); return parts;
}

export const amphibianBodyDesigns: MasterNatureDesign[] = [
  design("darwinFrog", "达尔文蛙", "动物", darwinFrog, ["Rhinoderma darwinii", "真实延长尖吻与雄体育幼声囊"]),
  design("yakuGlassFrog", "雅库玻璃蛙", "动物", glassFrog, ["Hyalinobatrachium yaku", "背皮腹皮分离透明心包与真实内脏"]),
  design("budgettFrog", "巴杰特蛙", "动物", budgettFrog, ["Lepidobatrachus laevis", "巨大横阔口与下颌牙状骨突"]),
  design("hairyFrog", "毛蛙", "动物", hairyFrog, ["Trichobatrachus robustus", "雄体体侧真正分离的呼吸皮突"]),
  design("titicacaFrog", "的的喀喀湖水蛙", "动物", titicacaFrog, ["Telmatobius culeus", "游泳足与侧面垂褶呼吸皮肤"]),
  design("olm", "洞螈", "动物", olm, ["Proteus anguinus", "皮下眼长躯前足三趾后足二趾与外鳃"]),
  design("greaterSiren", "大鳗螈", "动物", greaterSiren, ["Siren lacertina", "仅一对前肢圆躯宽桨尾与三对外鳃"]),
];
