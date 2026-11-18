import { cap, combineMeshes, design, eyes, frontCup, lobe, needle, part, polygon, tapered } from "./shared";
import { body, pectorals, ribbon } from "./fishForms";
import { membrane } from "./animals";
import { tail } from "./marine";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";

const skin = "#a1b19b";
const fin = "#bcc6ac";
const pale = "#d0ccb2";
const dark = "#859784";

function sideGills(parts: ModelPart[], root: Triple, gap: number, size: number) {
  const rows: ModelPart[] = [];
  for (const side of [-1, 1]) for (let i = 0; i < 5; i++) rows.push(needle("头后体侧独立鳃裂", dark, [side * gap, root[1] + size * 0.5, root[2] - i * size * 0.4], [side * gap, root[1] - size * 0.5, root[2] - i * size * 0.4], size * 0.07));
  parts.push(combineMeshes("两侧完整五对鳃裂", dark, rows));
}

function shark(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  if (kind === 0) {
    parts.push(body("锯鲨圆柱形胸躯和不与头融合的胸部", [[0.48, 0.22, 0.065, 0.05], [0.19, 0.22, 0.14, 0.14], [-0.48, 0.2, 0.09, 0.1], [-0.83, 0.17, 0.018, 0.03]]), tapered("锯鲨长扁锯吻的骨架", fin, [[0, 0.22, 0.42], [0, 0.22, 0.86], [0, 0.22, 1]], [0.04, 0.021, 0.002])); pectorals(parts, [0, 0.18, 0.16], 0.28, 0.025); parts.push(ribbon("第一背鳍", -0.1, -0.31, 0.31, 0.18), ...tail([0, 0.17, -0.83], 0.21, true), ...eyes([0, 0.29, 0.35], 0.065, 0.027)); sideGills(parts, [0, 0.24, 0.28], 0.115, 0.1);
    for (const side of [-1, 1]) { const teeth: ModelPart[] = []; for (let i = 0; i < 17; i++) { const z = 0.47 + i * 0.028, x = side * (0.036 - i * 0.0016); teeth.push(needle("锯吻两侧长短交错的硬齿", fin, [x, 0.22, z], [x + side * (i % 2 ? 0.022 : 0.035), 0.22, z + 0.005], 0.009)); } parts.push(combineMeshes("每侧锯吻完整的侧齿列", fin, teeth), tapered("锯鲨吻中部独有的长触须", fin, [[side * 0.026, 0.21, 0.66], [side * 0.045, 0.13, 0.69]], [0.005, 0.001])); }
  } else if (kind === 1) {
    parts.push(body("须鲨宽扁的地毯状前体和后缩尾柄", [[0.74, 0.16, 0.24, 0.075], [0.4, 0.17, 0.42, 0.12], [-0.3, 0.16, 0.31, 0.14], [-1.07, 0.13, 0.1, 0.1], [-1.6, 0.11, 0.025, 0.04]]), frontCup("须鲨前缘宽口", dark, [0, 0.11, 0.73], 0.13, 0.03), ...eyes([0, 0.25, 0.51], 0.21, 0.04), ...tail([0, 0.11, -1.6], 0.22, true)); pectorals(parts, [0, 0.1, 0.33], 0.68, 0.015);
    for (const side of [-1, 1]) { const fringes: ModelPart[] = []; for (let i = 0; i < 12; i++) { const root: Triple = [side * (0.2 + Math.sin(i / 11 * Math.PI) * 0.2), 0.12, 0.69 - i * 0.056]; const tip: Triple = [root[0] + side * 0.09, 0.08, root[2] + 0.015]; fringes.push(needle("口缘皮瓣的流苏主支", fin, root, tip, 0.016), needle("流苏末端次分支", fin, [tip[0] - side * 0.035, 0.09, tip[2]], [tip[0] - side * 0.01, 0.07, tip[2] + 0.035], 0.009)); } parts.push(combineMeshes("须鲨口头边缘的真正分枝流苏", fin, fringes)); } parts.push(ribbon("靠后的背鳍", -0.7, -0.97, 0.22, 0.22));
  } else if (kind === 2) {
    parts.push(body("扁鲨宽扁头部与圆柱后躯", [[0.55, 0.12, 0.2, 0.08], [0.17, 0.11, 0.3, 0.1], [-0.32, 0.11, 0.14, 0.11], [-0.82, 0.1, 0.025, 0.045]]), ...eyes([0, 0.19, 0.43], 0.13, 0.03), ...tail([0, 0.1, -0.82], 0.15, true));
    for (const side of [-1, 1]) parts.push(membrane("扁鲨头后独立且前缘不与头相连的胸鳍", fin, [[side * 0.2, 0.1, 0.26], [side * 0.49, 0.08, 0.35], [side * 0.59, 0.07, -0.04], [side * 0.19, 0.07, -0.2]]), membrane("靠后的独立腹鳍", fin, [[side * 0.1, 0.08, -0.22], [side * 0.28, 0.06, -0.35], [side * 0.13, 0.06, -0.49]]));
    parts.push(ribbon("尾部第一背鳍", -0.39, -0.53, 0.2, 0.1), ribbon("尾部第二背鳍", -0.61, -0.73, 0.15, 0.09)); sideGills(parts, [0, 0.11, 0.3], 0.22, 0.057);
  } else if (kind === 3) {
    parts.push(body("异齿鲨粗头向后渐细的躯体", [[0.35, 0.15, 0.12, 0.1], [0.1, 0.15, 0.13, 0.13], [-0.35, 0.13, 0.07, 0.1], [-0.62, 0.11, 0.02, 0.04]]), lobe("异齿鲨宽钝而高隆的额部", skin, [0, 0.16, 0.32], [0.28, 0.22, 0.24]), ...eyes([0, 0.22, 0.35], 0.102, 0.028), ...tail([0, 0.11, -0.62], 0.16, true)); pectorals(parts, [0, 0.1, 0.13], 0.25, 0.015);
    for (const z of [-0.06, -0.4]) parts.push(ribbon("异齿鲨背鳍", z + 0.06, z - 0.08, z > -0.1 ? 0.26 : 0.2, 0.16), needle("每个背鳍前缘的强硬棘", fin, [0, z > -0.1 ? 0.26 : 0.2, z + 0.06], [0, z > -0.1 ? 0.44 : 0.37, z + 0.03], 0.024));
    for (const side of [-1, 1]) parts.push(lobe("眼眶上方的骨嵴", fin, [side * 0.09, 0.26, 0.32], [0.08, 0.075, 0.17])); sideGills(parts, [0, 0.15, 0.18], 0.12, 0.07);
  } else if (kind === 4) {
    parts.push(body("斑马鲨有纵棱的粗长前躯", [[0.75, 0.22, 0.15, 0.12], [0.32, 0.22, 0.24, 0.21], [-0.56, 0.2, 0.17, 0.15], [-1.1, 0.17, 0.065, 0.09]]), tapered("约占体长一半的低长圆尾叶", skin, [[0, 0.17, -0.95], [0, 0.16, -1.7], [0, 0.12, -2.4]], [0.1, 0.07, 0.004]), ...eyes([0, 0.31, 0.65], 0.12, 0.035)); pectorals(parts, [0, 0.13, 0.35], 0.47, 0.03); parts.push(ribbon("斑马鲨钝圆第一背鳍", 0, -0.36, 0.37, 0.2), ribbon("斑马鲨短第二背鳍", -0.6, -0.8, 0.27, 0.13));
    for (const side of [-1, 0, 1]) parts.push(tapered("斑马鲨背侧贯通的纵向皮棱", fin, [[side * 0.14, 0.35, 0.36], [side * 0.12, 0.31, -0.53], [side * 0.05, 0.22, -1.02]], [0.014, 0.011, 0.003])); sideGills(parts, [0, 0.23, 0.45], 0.2, 0.12);
  } else if (kind === 5) {
    parts.push(body("雪茄达摩鲨粗短雪茄状身躯", [[0.21, 0.075, 0.035, 0.035], [0.12, 0.075, 0.046, 0.045], [-0.1, 0.073, 0.037, 0.04], [-0.21, 0.065, 0.012, 0.02]]), frontCup("达摩鲨可吸附的厚唇圆口", fin, [0, 0.06, 0.21], 0.027, 0.012), ...eyes([0, 0.092, 0.15], 0.032, 0.018), ...tail([0, 0.065, -0.21], 0.05, true)); pectorals(parts, [0, 0.05, 0.09], 0.07, 0.009);
    const teeth: ModelPart[] = []; for (let i = 0; i < 12; i++) { const a = Math.PI + i / 11 * Math.PI; teeth.push(needle("下颌连接成刃缘的三角大齿", pale, [Math.cos(a) * 0.024, 0.06 + Math.sin(a) * 0.024, 0.219], [Math.cos(a) * 0.015, 0.06 + Math.sin(a) * 0.015, 0.223], 0.007)); } parts.push(combineMeshes("达摩鲨下颌切割齿弧", pale, teeth));
  } else {
    parts.push(body("巨口鲨圆钝巨头和松软后躯", [[1.28, 0.75, 0.52, 0.45], [0.5, 0.75, 0.62, 0.6], [-1.2, 0.65, 0.4, 0.4], [-2.2, 0.55, 0.1, 0.18]]), frontCup("巨口鲨前端极宽的厚唇口腔", dark, [0, 0.58, 1.22], 0.43, 0.19), ...eyes([0, 1.03, 1.14], 0.4, 0.07), ...tail([0, 0.55, -2.2], 0.72, true)); pectorals(parts, [0, 0.45, 0.4], 1.18, 0.08); parts.push(ribbon("巨口鲨圆钝小背鳍", -0.45, -0.95, 1.05, 0.5)); sideGills(parts, [0, 0.8, 0.56], 0.59, 0.27);
  }
  return parts;
}

function unusualFish(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  if (kind === 0) {
    parts.push(body("桶眼鱼短躯和小口头部", [[0.055, 0.045, 0.012, 0.017], [0.027, 0.042, 0.025, 0.024], [-0.055, 0.032, 0.012, 0.017]]), ...tail([0, 0.032, -0.057], 0.022, true));
    const dome = lobe("罩住眼球的完整透明头罩", fin, [0, 0.062, 0.031], [0.052, 0.046, 0.058]); dome.opacity = 0.22; parts.push(dome);
    for (const side of [-1, 1]) parts.push(part("头罩内向上观察的管状眼柱", "cylinder", "#90a58e", [side * 0.012, 0.06, 0.033], [0.014, 0.028, 0.014]), lobe("管眼顶部绿色透镜", "#8d9e80", [side * 0.012, 0.074, 0.033], [0.015, 0.011, 0.015]), lobe("口上方成对嗅觉器官", dark, [side * 0.01, 0.045, 0.056], [0.005, 0.004, 0.003])); pectorals(parts, [0, 0.035, 0.015], 0.05, 0.005);
  } else if (kind === 1) {
    parts.push(polygon("海蝙蝠低扁三角头胸盘", skin, [[0, 0.15], [-0.11, 0.035], [-0.09, -0.055], [0, -0.09], [0.09, -0.055], [0.11, 0.035]], 0.05, [0, 0.06, 0]), tapered("海蝙蝠收窄的长尾柄", skin, [[0, 0.08, -0.05], [0, 0.06, -0.18], [0, 0.045, -0.27]], [0.04, 0.024, 0.004]), ...eyes([0, 0.12, 0.07], 0.04, 0.018));
    for (const side of [-1, 1]) { parts.push(tapered("胸鳍粗柄如肘部的步行肢", skin, [[side * 0.07, 0.08, -0.005], [side * 0.13, 0.05, -0.025], [side * 0.12, 0.009, 0.02]], [0.014, 0.011, 0.005]), membrane("海蝙蝠脚掌形胸鳍端", fin, [[side * 0.12, 0.009, 0.02], [side * 0.15, 0.007, 0.04], [side * 0.11, 0.007, 0.05]])); } parts.push(frontCup("吻部诱饵器官的小孔", dark, [0, 0.09, 0.14], 0.014, 0.008));
  } else if (kind === 2) {
    parts.push(body("三脚鱼悬于海床上方的长体", [[0.13, 0.29, 0.018, 0.025], [0.03, 0.29, 0.03, 0.038], [-0.14, 0.28, 0.012, 0.024]]), ...tail([0, 0.28, -0.14], 0.025, true), ...eyes([0, 0.302, 0.106], 0.014, 0.008));
    for (const side of [-1, 1]) parts.push(tapered("伸到海床的腹鳍硬条", fin, [[side * 0.012, 0.27, 0.02], [side * 0.08, 0.14, 0.07], [side * 0.15, 0.0015, 0.11]], [0.003, 0.0025, 0.001]), tapered("胸鳍向上前方展开的感知长条", fin, [[side * 0.02, 0.29, 0.07], [side * 0.12, 0.38, 0.12], [side * 0.17, 0.42, 0.08]], [0.0025, 0.002, 0.001])); parts.push(tapered("尾鳍第三根接地支撑条", fin, [[0, 0.28, -0.15], [0, 0.15, -0.22], [0, 0.0015, -0.31]], [0.003, 0.0025, 0.001]));
  } else if (kind === 3) {
    parts.push(body("瞻星鱼前宽后缩的锥形体", [[0.16, 0.055, 0.075, 0.04], [0.03, 0.07, 0.09, 0.055], [-0.18, 0.05, 0.018, 0.025]]), lobe("瞻星鱼钝方头颅", skin, [0, 0.07, 0.12], [0.18, 0.09, 0.14]), ...tail([0, 0.05, -0.19], 0.04, true));
    for (const side of [-1, 1]) parts.push(lobe("头顶向上凸出的眼", dark, [side * 0.04, 0.115, 0.15], [0.024, 0.018, 0.021])); parts.push(cap("开向头顶的斜上口裂", dark, [0, 0.095, 0.19], 0.04, 0.024, 3)); pectorals(parts, [0, 0.045, 0.02], 0.13, 0.004);
  } else if (kind === 4) {
    parts.push(lobe("圆鳍鱼厚圆而非充气的高体", skin, [0, 0.13, 0], [0.18, 0.25, 0.27]), ...tail([0, 0.1, -0.14], 0.05, true), ...eyes([0, 0.17, 0.1], 0.059, 0.02), cap("腹鳍融合形成的附着吸盘", fin, [0, 0.022, 0.02], 0.045, 0.016, 3)); pectorals(parts, [0, 0.08, 0.04], 0.12, 0.012);
    for (let i = 0; i < 18; i++) { const a = i % 3 * Math.PI / 3; parts.push(lobe("圆鳍鱼沿体侧排列的骨质瘤棱", fin, [Math.cos(a) * 0.07, 0.12 + Math.sin(a) * 0.09, -0.1 + Math.floor(i / 3) * 0.037], [0.023, 0.023, 0.025])); }
  } else if (kind === 5) {
    parts.push(body("管眼鱼细长的带状侧扁体", [[0.12, 0.055, 0.008, 0.012], [0.05, 0.054, 0.012, 0.018], [-0.15, 0.05, 0.007, 0.013], [-0.22, 0.05, 0.002, 0.004]]), tapered("细长鞭状尾丝", fin, [[0, 0.05, -0.21], [0.03, 0.04, -0.36], [0.04, 0.035, -0.48]], [0.002, 0.0015, 0.0005]), tapered("管眼鱼前方可伸缩的管状口", skin, [[0, 0.055, 0.11], [0, 0.056, 0.155]], [0.007, 0.004]));
    for (const side of [-1, 1]) parts.push(lobe("向前上方突出的筒状眼", dark, [side * 0.009, 0.071, 0.105], [0.013, 0.013, 0.024])); parts.push(ribbon("连续的长背鳍", 0.03, -0.19, 0.066, 0.012));
  } else if (kind === 6) {
    parts.push(lobe("月亮鱼高而侧扁的卵圆体", skin, [0, 0.55, 0], [0.34, 1.1, 1.18]), tapered("月亮鱼狭长尾柄", skin, [[0, 0.5, -0.4], [0, 0.5, -0.75]], [0.13, 0.045]), ...tail([0, 0.5, -0.75], 0.38, true), ...eyes([0, 0.68, 0.45], 0.1, 0.055));
    for (const side of [-1, 1]) parts.push(membrane("月亮鱼长而窄的侧伸胸鳍", fin, [[side * 0.12, 0.55, 0.2], [side * 0.7, 0.5, -0.25], [side * 0.4, 0.47, -0.16]])); parts.push(ribbon("月亮鱼向后压低的长背鳍", 0.28, -0.49, 0.98, 0.28), ribbon("腹侧镰形臀鳍", 0.12, -0.44, 0.14, -0.15));
  } else if (kind === 7) {
    parts.push(body("烟管鱼细杆状前躯和尾柄", [[0.18, 0.065, 0.012, 0.014], [0, 0.065, 0.019, 0.023], [-0.4, 0.063, 0.008, 0.014]]), tapered("烟管鱼前方坚硬细长管吻", skin, [[0, 0.065, 0.17], [0, 0.065, 0.47], [0, 0.065, 0.55]], [0.011, 0.008, 0.01]), ...tail([0, 0.063, -0.4], 0.045, true), ...eyes([0, 0.075, 0.16], 0.01, 0.009), tapered("尾叉中部伸出的长尾丝", fin, [[0, 0.063, -0.41], [0.02, 0.065, -0.78]], [0.002, 0.0005])); parts.push(ribbon("尾柄附近的短背鳍", -0.27, -0.35, 0.075, 0.04)); pectorals(parts, [0, 0.06, 0.1], 0.045, 0.005);
  } else if (kind === 8) {
    parts.push(body("喉盘鱼头宽尾细的扁平体", [[0.04, 0.022, 0.025, 0.014], [0, 0.018, 0.03, 0.014], [-0.065, 0.015, 0.009, 0.01]]), cap("喉部胸腹鳍共同构成的腹面吸盘", fin, [0, 0.004, 0.015], 0.022, 0.008, 3), ...eyes([0, 0.034, 0.025], 0.014, 0.01), ...tail([0, 0.015, -0.066], 0.016, true)); pectorals(parts, [0, 0.012, 0.015], 0.05, 0.001);
  } else if (kind === 9) {
    parts.push(lobe("松球鱼高而厚的短体", skin, [0, 0.075, 0], [0.09, 0.13, 0.15]), ...tail([0, 0.06, -0.08], 0.028, true), ...eyes([0, 0.09, 0.055], 0.027, 0.022));
    for (const side of [-1, 1]) for (let row = 0; row < 4; row++) for (let i = 0; i < 3; i++) { const x = side * (0.028 + Math.sin(row / 3 * Math.PI) * 0.01), y = 0.025 + row * 0.031, z = -0.043 + i * 0.036; const scale = polygon("松球鱼可分辨的菱形骨板", fin, [[0, -0.018], [0.014, 0], [0, 0.018], [-0.014, 0]], 0.003, [x, y, z]); scale.rotation.z = side * 90; parts.push(scale); }
    for (const side of [-1, 1]) parts.push(needle("腹鳍强大锁定棘", fin, [side * 0.018, 0.038, 0.015], [side * 0.04, 0.004, -0.03], 0.009), lobe("下颌两侧的小型发光器", pale, [side * 0.017, 0.053, 0.061], [0.009, 0.006, 0.007]));
  } else if (kind === 10) {
    parts.push(polygon("海蛾鱼扁平菱形骨甲体", skin, [[0, 0.03], [-0.025, 0.012], [-0.02, -0.02], [0, -0.03], [0.02, -0.02], [0.025, 0.012]], 0.012, [0, 0.009, 0]), tapered("海蛾鱼前端硬管吻", fin, [[0, 0.016, 0.023], [0, 0.014, 0.065]], [0.004, 0.001]), ...eyes([0, 0.024, 0.02], 0.01, 0.005));
    for (let i = 0; i < 7; i++) parts.push(lobe("海蛾鱼伸缩尾部的独立骨环", fin, [0, 0.013, -0.026 - i * 0.006], [0.012 - i * 0.001, 0.009, 0.008])); pectorals(parts, [0, 0.009, 0], 0.06, 0.001);
    for (const side of [-1, 1]) parts.push(tapered("胸鳍底部用于步行的指状鳍条", fin, [[side * 0.014, 0.01, 0.006], [side * 0.025, 0.002, 0.019]], [0.002, 0.0006]));
  } else if (kind === 11) {
    parts.push(body("非洲蝴蝶鱼背平腹深的表层体形", [[0.06, 0.036, 0.018, 0.014], [0.015, 0.03, 0.027, 0.026], [-0.055, 0.022, 0.009, 0.016]]), ...tail([0, 0.022, -0.058], 0.023, true), ...eyes([0, 0.047, 0.042], 0.015, 0.012));
    for (const side of [-1, 1]) { parts.push(membrane("用于水面滑翔的宽大蝶形胸鳍", fin, [[side * 0.013, 0.033, 0.024], [side * 0.057, 0.032, 0.034], [side * 0.075, 0.03, -0.017], [side * 0.025, 0.025, -0.032]])); for (let i = 0; i < 3; i++) parts.push(tapered("腹鳍分离的长须状鳍条", fin, [[side * 0.012, 0.018, 0], [side * (0.025 + i * 0.01), 0.004, -0.04 - i * 0.012]], [0.001, 0.0004])); }
  } else {
    parts.push(body("弓背鱼前高后低的刀形侧扁体", [[0.26, 0.23, 0.035, 0.06], [0.1, 0.22, 0.07, 0.18], [-0.18, 0.13, 0.045, 0.12], [-0.42, 0.075, 0.007, 0.035]]), ...eyes([0, 0.26, 0.23], 0.026, 0.022));
    parts.push(ribbon("延至尾部并与尾鳍相连的长臀鳍", 0.12, -0.44, 0.08, -0.07), ribbon("背部短而独立的羽状小鳍", 0.07, -0.02, 0.37, 0.07)); pectorals(parts, [0, 0.19, 0.18], 0.095, 0.018);
  }
  return parts;
}

const sharkNames = [["sawshark", "锯鲨", "Pristiophorus"], ["wobbegong", "须鲨", "Eucrossorhinus dasypogon"], ["angelshark", "扁鲨", "Squatina"], ["hornshark", "异齿鲨（Heterodontus）", "Heterodontus"], ["zebraShark", "斑马鲨", "Stegostoma tigrinum"], ["cookiecutterShark", "雪茄达摩鲨", "Isistius brasiliensis"], ["megamouthShark", "巨口鲨", "Megachasma pelagios"]];
const fishNames = [["barreleye", "桶眼鱼", "Macropinna microstoma"], ["batfish", "海蝙蝠", "Ogcocephalus"], ["tripodfish", "三脚鱼", "Bathypterois grallator"], ["stargazer", "瞻星鱼", "Uranoscopus"], ["lumpsucker", "圆鳍鱼", "Cyclopterus lumpus"], ["tubeEye", "管眼鱼", "Stylephorus chordatus"], ["opah", "月亮鱼", "Lampris"], ["cornetfish", "烟管鱼", "Fistularia"], ["clingfish", "喉盘鱼", "Gobiesox"], ["pineconefish", "松球鱼", "Monocentris japonica"], ["seamoth", "海蛾鱼", "Pegasus"], ["africanButterflyfish", "非洲蝴蝶鱼（Pantodon）", "Pantodon buchholzi"], ["featherback", "弓背鱼", "Notopterus"]];

export const functionalFishDesigns: MasterNatureDesign[] = [
  ...sharkNames.map(([key, name, taxon], i) => design(key!, name!, "动物", () => shark(i), ["鱼类结构", taxon!])),
  ...fishNames.map(([key, name, taxon], i) => design(key!, name!, "动物", () => unusualFish(i), ["鱼类结构", taxon!])),
];
