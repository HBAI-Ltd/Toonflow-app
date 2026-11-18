import { cap, combineMeshes, design, leaf, lobe, needle, polygon, sweptProfile, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { lump, pointed } from "./insectForms";
import { body } from "./fishForms";
import { membrane } from "./animals";

const armor = "#a9b49a";
const skin = "#bec5a8";
const pale = "#cbd0b4";
const dark = "#728674";

function softForms(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  if (kind === 0) {
    const conch = sweptProfile("软舌螺前宽后尖的空心锥壳", armor, [[0, 0], [0.001, 0.004], [0.009, 0.039], [0.0074, 0.039], [0.0007, 0.004]], Math.PI * 2, 20); conch.rotation.x = 90; conch.position.y = 0.009; parts.push(conch);
    const lid = cap("锥壳前方可见的独立厣", pale, [0, 0.011, 0.04], 0.0085, 0.002, 0); lid.rotation.x = 62; parts.push(lid);
    for (const side of [-1, 1]) parts.push(pointed("壳口两侧长弯曲的刚性支撑翼", skin, [[side * 0.006, 0.009, 0.035], [side * 0.019, 0.007, 0.027], [side * 0.027, 0.002, 0.01]], [0.0015, 0.0011, 0]));
    for (let i = 0; i < 6; i++) parts.push(tapered("锥壳背面生长肋", pale, [[-0.002 - i * 0.0008, 0.012 + i * 0.0006, 0.012 + i * 0.004], [0, 0.014 + i * 0.0007, 0.012 + i * 0.004], [0.002 + i * 0.0008, 0.012 + i * 0.0006, 0.012 + i * 0.004]], [0.0005, 0.0005, 0.0005]));
  } else if (kind === 1) {
    parts.push(lobe("哈尔基虫平扁的肌肉足", skin, [0, 0.007, 0], [0.028, 0.013, 0.079]));
    for (const z of [-0.027, 0.025]) { const p = cap("身体前后各一片帽状壳", pale, [0, 0.014, z], z > 0 ? 0.011 : 0.014, 0.011, 0); p.scale.z = 1.35; parts.push(p); }
    for (let row = 0; row < 3; row++) { const pieces: ModelPart[] = []; for (let i = 0; i < 30; i++) { const a = i * 2.4, r = 0.55 + row * 0.17, x = Math.cos(a) * 0.012 * r, z = Math.sin(a) * 0.03 * r; pieces.push(needle("覆盖足背的相互搭接骨片", armor, [x, 0.013, z], [x * 1.65, 0.019 + row * 0.001, z * 1.08], 0.004)); } parts.push(combineMeshes("一圈独立鳞甲骨片", armor, pieces)); }
  } else if (kind === 2) {
    parts.push(lobe("齿谜虫光滑无壳无棘的扁椭圆背面", skin, [0, 0.012, 0], [0.045, 0.018, 0.125]), lobe("腹面中央贯通后部的长肌肉足", armor, [0, 0.004, -0.007], [0.024, 0.008, 0.1]));
    for (const side of [-1, 1]) { const gills: ModelPart[] = []; for (let i = 0; i < 20; i++) gills.push(leaf("肌肉足周围的腹面鳃小叶", pale, [side * 0.011, 0.005, -0.046 + i * 0.0047], 0.003, 0.011, [25, -side * 90, -side * 65])); parts.push(combineMeshes("足两侧成列的鳃叶", pale, gills)); }
    const teeth: ModelPart[] = []; for (const z of [0.039, 0.044]) for (let i = 0; i < 7; i++) teeth.push(needle("腹面口区齿舌的两排齿", dark, [(i - 3) * 0.002, 0.004, z], [(i - 3) * 0.002, 0.001, z + 0.0015], 0.0012)); parts.push(combineMeshes("齿谜虫两排齿舌", dark, teeth));
  } else if (kind === 3) {
    parts.push(lump("酒杯虫末端球状固着体", [0, 0.0017, 0], [0.006, 0.0034, 0.006]), tapered("酒杯虫细长刚性柄", armor, [[0, 0.002, 0], [0, 0.016, 0]], [0.0012, 0.0015]));
    const cup = cap("酒杯虫顶部真正敞开的杯状萼体", skin, [0, 0.015, 0], 0.0045, 0.008, 3); parts.push(cup);
    const bracts: ModelPart[] = []; for (let i = 0; i < 20; i++) { const a = i * Math.PI / 10; bracts.push(leaf("酒杯虫上缘直立的硬质滤食苞片", pale, [Math.cos(a) * 0.0042, 0.022, Math.sin(a) * 0.0042], 0.0014, 0.0045, [12, -i * 18, 0])); } parts.push(combineMeshes("顶部环列的二十片真实滤食苞片", pale, bracts));
    parts.push(tapered("酒杯虫萼内的U形消化道", dark, [[-0.0017, 0.021, 0], [-0.0017, 0.017, 0], [0.0016, 0.017, 0], [0.0016, 0.022, 0]], [0.0006, 0.0006, 0.0006, 0.0005]));
  } else if (kind === 4) {
    parts.push(tapered("叉吻蠕虫光滑而环纹明显的躯干", skin, [[0, 0.008, -0.034], [0.002, 0.009, -0.008], [0, 0.008, 0.017]], [0.004, 0.008, 0.006]), tapered("前端与躯干分离的较细吻部", armor, [[0, 0.008, 0.014], [0, 0.009, 0.032]], [0.0055, 0.004]));
    for (const side of [-1, 1]) parts.push(pointed("吻端成对的长叉状触手", pale, [[side * 0.0018, 0.01, 0.031], [side * 0.007, 0.012, 0.046], [side * 0.006, 0.014, 0.055]], [0.0013, 0.0008, 0]));
    for (let i = 0; i < 14; i++) { const r = 0.0073 - Math.abs(i - 6) * 0.0003, ring = sweptProfile("无钩棘躯干表面的环纹", armor, [[r - 0.0005, -0.0006], [r + 0.0005, -0.0006], [r + 0.0005, 0.0006], [r - 0.0005, 0.0006]], Math.PI * 2, 16); ring.rotation.x = 90; ring.position = { x: 0.001, y: 0.0085, z: -0.027 + i * 0.003 }; parts.push(ring); }
    const papillae: ModelPart[] = []; for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; papillae.push(lump("吻部前缘短而圆钝的乳突", [Math.cos(a) * 0.0038, 0.009 + Math.sin(a) * 0.0038, 0.031], [0.0012, 0.0012, 0.0017], pale)); } parts.push(combineMeshes("前吻无硬钩的环列乳突", pale, papillae));
  } else {
    const disc = lobe("埃尔多尼亚薄而透明的盘形体", skin, [0, 0.006, 0], [0.14, 0.012, 0.14]); disc.opacity = 0.48; parts.push(disc);
    const gut: Triple[] = Array.from({ length: 25 }, (_, i) => { const a = i / 24 * Math.PI * 1.8, r = 0.012 + i / 24 * 0.022; return [Math.cos(a) * r, 0.008, Math.sin(a) * r]; }); parts.push(tapered("盘内顺时针盘绕且分区的消化道", dark, gut, gut.map((_, i) => i < 12 ? 0.0045 : 0.002)));
    const rays: ModelPart[] = []; for (let i = 0; i < 32; i++) { const a = i * Math.PI / 16; rays.push(needle("体盘内部细放射带", armor, [Math.cos(a) * 0.013, 0.006, Math.sin(a) * 0.013], [Math.cos(a) * 0.056, 0.005, Math.sin(a) * 0.056], 0.001)); } parts.push(combineMeshes("圆盘中的连续放射结构", armor, rays));
    for (const side of [-1, 1]) parts.push(pointed("腹面口部成对的短粗触手", pale, [[0.025, 0.004, 0], [0.036, 0.002, side * 0.019], [0.043, 0.005, side * 0.024]], [0.0024, 0.0012, 0]));
  }
  return parts;
}

function doubleShell(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  const length = kind === 0 ? 0.052 : 0.16, width = kind === 0 ? 0.013 : 0.038, height = kind === 0 ? 0.018 : 0.055;
  for (const side of [-1, 1]) {
    const valve = lobe("左右分开的侧扁双瓣头胸甲", armor, [side * width * 0.43, height * 0.9, 0], [width * 0.9, height * 1.45, length]); parts.push(valve);
    if (kind === 0) { parts.push(pointed("等刺虫前后背缘伸出的长尖刺", pale, [[side * width * 0.13, height * 1.4, -length * 0.36], [side * width * 0.1, height * 1.65, -length * 0.8]], [0.0014, 0]), pointed("前方长刺", pale, [[side * width * 0.13, height * 1.4, length * 0.36], [side * width * 0.08, height * 1.6, length * 0.8]], [0.0014, 0])); }
    else {
      const lattice: ModelPart[] = []; for (let row = 0; row < 7; row++) for (let column = 0; column < 5; column++) { const z = (row - 3) * 0.017, y = 0.025 + column * 0.008, x = side * width * (0.72 - Math.abs(column - 2) * 0.08); for (const turn of [-1, 1]) lattice.push(needle("图佐虫甲壳表面菱形网纹", pale, [x, y, z], [x, y + 0.008, z + turn * 0.0085], 0.0012)); } for (let row = 0; row < lattice.length; row += 35) parts.push(combineMeshes("图佐虫侧甲真实隆起网纹", pale, lattice.slice(row, row + 35)));
      const keel = polygon("图佐虫甲瓣侧面的锯齿状纵向龙骨", pale, [[-length * 0.4, 0], [-length * 0.24, 0.009], [-length * 0.15, 0.003], [0, 0.012], [length * 0.13, 0.004], [length * 0.3, 0.008], [length * 0.4, 0]], 0.002); keel.rotation = { x: -90, y: 0, z: 90 }; keel.position = { x: side * width * 0.76, y: height * 0.85, z: 0 }; parts.push(keel);
    }
    parts.push(pointed("头前延伸的眼柄", skin, [[side * width * 0.2, height, length * 0.3], [side * width * 0.9, height * 1.15, length * 0.61]], [width * 0.12, 0]), lump("外露柄眼", [side * width * 0.9, height * 1.15, length * 0.61], [width * 0.35, width * 0.35, width * 0.35], dark));
    const limbs: ModelPart[] = []; for (let i = 0; i < (kind === 0 ? 10 : 14); i++) { const z = length * (0.32 - i / (kind === 0 ? 9 : 13) * 0.7); limbs.push(pointed("甲瓣下的分节游泳足", skin, [[side * width * 0.1, height * 0.7, z], [side * width * 0.75, height * 0.4, z - length * 0.035], [side * width * 1.1, 0.001, z - length * 0.08]], [width * 0.12, width * 0.08, 0])); } for (let i = 0; i < limbs.length; i += 8) parts.push(combineMeshes("一侧相连体轴的多节足", skin, limbs.slice(i, i + 8)));
  }
  return parts;
}

function arthropod(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  if (kind === 0) {
    parts.push(lobe("林乔利虫独立头盾", armor, [0, 0.022, 0.035], [0.029, 0.023, 0.03]));
    for (let i = 0; i < 11; i++) parts.push(lobe("背部具有成对纵棱的躯干体节", armor, [0, 0.018, 0.023 - i * 0.006], [0.03 - i * 0.0013, 0.016, 0.008]));
    for (const side of [-1, 1]) {
      parts.push(lump("外侧大眼", [side * 0.012, 0.028, 0.045], [0.005, 0.005, 0.005], dark), lump("内侧小型蘑菇状眼", [side * 0.004, 0.03, 0.044], [0.0025, 0.0035, 0.0025], dark));
      const wrist: Triple = [side * 0.016, 0.027, 0.055]; parts.push(tapered("前方分节大附肢的粗基部", skin, [[side * 0.009, 0.019, 0.04], [side * 0.026, 0.013, 0.05], wrist], [0.003, 0.003, 0.002]));
      for (let finger = 0; finger < 3; finger++) parts.push(pointed("大附肢的三条长指及丝状末鞭", pale, [wrist, [side * (0.02 + finger * 0.009), 0.04, 0.07 + finger * 0.004], [side * (0.034 + finger * 0.006), 0.029, 0.1 + finger * 0.008]], [0.0015, 0.0008, 0]));
      const legs: ModelPart[] = [], paddles: ModelPart[] = []; for (let i = 0; i < 11; i++) { const z = 0.025 - i * 0.006; legs.push(pointed("双肢型附肢的步行内肢", skin, [[side * 0.009, 0.013, z], [side * 0.024, 0.011, z - 0.004], [side * 0.025, 0.001, z - 0.012]], [0.0017, 0.0012, 0])); paddles.push(leaf("双肢型附肢的外侧鳃桨", pale, [side * 0.009, 0.013, z], 0.006, 0.022, [70, -side * 75, 0])); } for (let i = 0; i < legs.length; i += 7) parts.push(combineMeshes("一侧完整步足列", skin, legs.slice(i, i + 7))); parts.push(combineMeshes("一侧独立薄鳃桨", pale, paddles));
    }
    parts.push(membrane("林乔利虫末端矛头形尾节", pale, [[0, 0.014, -0.065], [-0.009, 0.015, -0.041], [0, 0.018, -0.037], [0.009, 0.015, -0.041]]));
  } else {
    parts.push(polygon("抚仙湖虫前部宽大的椭圆头盾", armor, [[-0.022, 0.016], [-0.026, 0.033], [-0.016, 0.049], [0, 0.055], [0.016, 0.049], [0.026, 0.033], [0.022, 0.016]], 0.01, [0, 0.014, 0]));
    const tergites: ModelPart[] = []; for (let i = 0; i < 26; i++) { const w = i < 5 ? 0.025 + i * 0.003 : 0.038 - (i - 5) * 0.00135; tergites.push(lobe("前窄后宽再逐渐收细的连续背板", armor, [0, 0.016, 0.018 - i * 0.0038], [w, 0.013, 0.0055])); } parts.push(combineMeshes("抚仙湖虫二十六节相连背板", armor, tergites));
    for (const side of [-1, 1]) { parts.push(tapered("头前细长触角", skin, [[side * 0.009, 0.015, 0.045], [side * 0.025, 0.02, 0.067], [side * 0.029, 0.025, 0.082]], [0.0017, 0.001, 0.0006]), tapered("短粗眼柄", skin, [[side * 0.015, 0.021, 0.044], [side * 0.028, 0.027, 0.05]], [0.002, 0.0015]), lump("头盾外侧的柄眼", [side * 0.029, 0.027, 0.05], [0.005, 0.005, 0.005], dark));
      const pieces: ModelPart[] = []; for (let i = 0; i < 24; i++) { const z = 0.02 - i * 0.0037; pieces.push(pointed("背板下相连的双肢型多节足", skin, [[side * 0.009, 0.014, z], [side * 0.022, 0.009, z - 0.003], [side * 0.023, 0.001, z - 0.01]], [0.0013, 0.0008, 0])); } for (let i = 0; i < pieces.length; i += 8) parts.push(combineMeshes("抚仙湖虫腹侧步足列", skin, pieces.slice(i, i + 8)));
    }
    parts.push(membrane("抚仙湖虫末端双叶尾扇", pale, [[0, 0.015, -0.074], [-0.012, 0.015, -0.085], [0, 0.014, -0.079], [0.012, 0.015, -0.085]]));
  }
  return parts;
}

function rake(parts: ModelPart[], root: Triple, reach: number, fine: boolean) {
  const stem: Triple[] = [root, [root[0] * 1.6, root[1] - reach * 0.15, root[2] + reach * 0.35], [root[0] * 1.4, root[1] - reach * 0.35, root[2] + reach]]; parts.push(tapered("滤食或耙食前附肢的分节主轴", armor, stem, [reach * 0.08, reach * 0.065, reach * 0.025]));
  const rungs: ModelPart[] = [], side = root[0] < 0 ? -1 : 1;
  for (let i = 0; i < 5; i++) { const t = (i + 1) / 6, start: Triple = [root[0] * (1.6 - t * 0.2), root[1] - reach * (0.15 + t * 0.2), root[2] + reach * (0.35 + t * 0.65)], end: Triple = [start[0] - side * reach * 0.55, start[1] - reach * 0.2, start[2] + reach * 0.06]; parts.push(pointed("前附肢内侧长栉齿", skin, [start, end], [reach * 0.025, 0])); for (let j = 0; j < (fine ? 9 : 3); j++) { const s = (j + 1) / (fine ? 10 : 4), p: Triple = [start[0] + (end[0] - start[0]) * s, start[1] + (end[1] - start[1]) * s, start[2] + (end[2] - start[2]) * s]; rungs.push(pointed("栉齿上的二级筛滤刺", pale, [p, [p[0], p[1] - reach * 0.14, p[2] + reach * 0.035]], [reach * 0.006, 0])); } }
  for (let i = 0; i < rungs.length; i += 20) parts.push(combineMeshes("一段真正有间隙的筛滤栉", pale, rungs.slice(i, i + 20)));
}

function radiodont(kind: number): ModelPart[] {
  const parts: ModelPart[] = [], giant = kind === 2, length = giant ? 1.45 : kind === 1 ? 0.16 : 0.3, height = length * 0.18;
  parts.push(body("放射齿类后收的分节躯体", [[-length * 0.55, height, length * 0.025, length * 0.04], [0, height, length * 0.13, length * 0.08], [length * 0.25, height, length * 0.14, length * 0.09]], skin));
  if (kind === 0) {
    parts.push(lobe("赫德虾长而向前突出的中央头甲", armor, [0, height * 1.25, length * 0.38], [length * 0.32, length * 0.25, length * 0.6]));
    for (const side of [-1, 1]) parts.push(lobe("赫德虾头甲下方分开的侧板", pale, [side * length * 0.13, height * 0.9, length * 0.3], [length * 0.14, length * 0.17, length * 0.38]));
  } else if (kind === 1) {
    parts.push(polygon("寒武耙虾后侧开眼凹口的马蹄形头甲", armor, [[-0.095, -0.038], [-0.08, 0.049], [-0.041, 0.092], [0.041, 0.092], [0.08, 0.049], [0.095, -0.038], [0.058, -0.07], [0.048, -0.024], [0.025, -0.028], [0, -0.055], [-0.025, -0.028], [-0.048, -0.024], [-0.058, -0.07]], 0.018, [0, height, 0.055]));
  } else {
    parts.push(lobe("海神盔虾覆盖前体的大型宽阔头罩", armor, [0, height * 1.18, length * 0.23], [length * 0.45, length * 0.23, length * 0.53]));
    for (const side of [-1, 1]) parts.push(lobe("向侧面分开的长桨形头板", pale, [side * length * 0.19, height * 0.88, length * 0.24], [length * 0.15, length * 0.17, length * 0.44]));
  }
  for (const side of [-1, 1]) {
    const flaps: ModelPart[] = []; for (let i = 0; i < 10; i++) { const z = length * (0.12 - i * 0.065), w = length * (0.23 - i * 0.012); flaps.push(membrane("沿躯干两侧独立的游泳叶瓣", armor, [[side * length * 0.07, height, z], [side * w, height - length * 0.035, z - length * 0.04], [side * w * 0.9, height - length * 0.03, z - length * 0.11], [side * length * 0.06, height, z - length * 0.07]])); if (giant) flaps.push(membrane("海神盔虾上排独立鳃叶瓣", pale, [[side * length * 0.08, height * 1.2, z], [side * w * 0.9, height * 1.4, z - length * 0.045], [side * w * 0.65, height * 1.3, z - length * 0.1]])); } for (let i = 0; i < flaps.length; i += 12) parts.push(combineMeshes("一侧相连但彼此分开的游泳叶列", armor, flaps.slice(i, i + 12)));
    rake(parts, [side * length * 0.09, height * 0.8, length * 0.25], length * (kind === 1 ? 0.27 : 0.37), kind !== 0);
    const z = kind === 1 ? 0.026 : length * 0.43; parts.push(tapered("侧向伸出的眼柄", skin, [[side * length * 0.12, height * 1.1, z], [side * length * 0.26, height * 1.25, z]], [length * 0.017, length * 0.012]), lobe("柄眼", dark, [side * length * 0.27, height * 1.25, z], [length * 0.044, length * 0.044, length * 0.044]));
  }
  const mouth = cap("头甲下真正敞开的口锥", dark, [0, height * 0.75, length * 0.25], length * 0.048, length * 0.026, 3); mouth.rotation.x = 180; parts.push(mouth);
  return parts;
}

function stemForms(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  if (kind === 0) {
    parts.push(tapered("基里虾长柔软的分节体轴", skin, [[0, 0.027, -0.11], [0, 0.032, 0], [0, 0.037, 0.076]], [0.008, 0.023, 0.02]));
    for (const side of [-1, 1]) {
      for (let i = 0; i < 11; i++) { const z = -0.095 + i * 0.015; parts.push(leaf("十一对宽大游泳鳃瓣", armor, [side * 0.013, 0.032, z], 0.018, 0.047, [72, -side * 85, 0]), pointed("每片鳃瓣下方的短肉足", pale, [[side * 0.012, 0.025, z], [side * 0.02, 0.012, z + 0.004], [side * 0.023, 0.002, z + 0.006]], [0.0035, 0.002, 0])); }
      const path: Triple[] = [[side * 0.012, 0.035, 0.068], [side * 0.035, 0.035, 0.103], [side * 0.025, 0.045, 0.153]]; parts.push(pointed("头前成对长而未硬化分节的捕食肢", armor, path, [0.008, 0.006, 0]), pointed("后体端两根细长尾丝", pale, [[side * 0.004, 0.027, -0.101], [side * 0.025, 0.022, -0.18]], [0.003, 0]));
      const thorns: ModelPart[] = []; for (let i = 0; i < 7; i++) { const t = (i + 1) / 8; thorns.push(needle("捕食肢内缘连续短棘", pale, [side * (0.035 - t * 0.01), 0.035 + t * 0.01, 0.103 + t * 0.05], [side * (0.023 - t * 0.01), 0.036 + t * 0.01, 0.105 + t * 0.05], 0.003)); } parts.push(combineMeshes("一侧捕食肢内缘棘列", pale, thorns), lump("前体侧面的肾状眼", [side * 0.02, 0.044, 0.069], [0.01, 0.006, 0.014], dark));
    }
  } else {
    const p = body("云南虫侧扁而前宽后尖的柔软体", [[-0.037, 0.013, 0.001, 0.002], [-0.015, 0.017, 0.004, 0.008], [0.015, 0.019, 0.006, 0.01], [0.03, 0.018, 0.003, 0.005]], skin); p.opacity = 0.58; parts.push(p);
    for (const side of [-1, 1]) { for (let i = 0; i < 7; i++) { const z = 0.025 - i * 0.0036; parts.push(tapered("前体七对可见的弓形咽支架", armor, [[side * 0.0015, 0.025, z], [side * 0.006, 0.022, z], [side * 0.005, 0.012, z]], [0.0008, 0.0008, 0.00065])); } }
    for (let i = 0; i < 20; i++) parts.push(polygon("躯体背侧相互覆盖的节块", armor, [[-0.002, -0.0013], [0.002, -0.0013], [0.003, 0.0011], [-0.003, 0.0011]], 0.003, [0, 0.024 - i * 0.0006, 0.005 - i * 0.0018]));
  }
  return parts;
}

function ancientFish(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  if (kind < 2) {
    parts.push(body("古软骨鱼向后收束的流线躯干", [[-0.36, 0.14, 0.01, 0.015], [-0.17, 0.14, 0.045, 0.05], [0.12, 0.15, 0.075, 0.078], [0.23, 0.14, 0.035, 0.04]], skin));
    for (const side of [-1, 1]) { const y = kind === 1 ? 0.205 : 0.115; parts.push(membrane(kind === 1 ? "颈部高位伸出的巨大翼状胸鳍" : "尖长的低位胸鳍", armor, [[side * 0.052, y, 0.09], [side * (kind === 1 ? 0.31 : 0.21), y + (kind === 1 ? 0.12 : -0.03), -0.02], [side * 0.15, y + 0.02, -0.11], [side * 0.044, y, 0.025]]), lobe("古鱼侧眼", dark, [side * 0.049, 0.18, 0.17], [0.026, 0.026, 0.023])); }
    if (kind === 0) { const brush = polygon("胸棘鲨背部向上扩宽的砧状鳍支架", armor, [[-0.028, 0], [-0.075, 0.13], [0.075, 0.13], [0.028, 0]], 0.045); brush.rotation.x = -90; brush.position = { x: 0, y: 0.19, z: 0.012 }; parts.push(brush); const tips: ModelPart[] = []; for (let i = 0; i < 20; i++) { const x = (i % 5 - 2) * 0.028, z = -0.004 - Math.floor(i / 5) * 0.011; tips.push(needle("砧状鳍顶部的细密硬棘", pale, [x, 0.318, z], [x, 0.34, z], 0.007)); } parts.push(combineMeshes("背鳍顶部刺刷", pale, tips)); for (let i = 0; i < 10; i++) parts.push(needle("头顶对应的粗硬小棘", pale, [(i % 5 - 2) * 0.012, 0.2, 0.1 + Math.floor(i / 5) * 0.025], [(i % 5 - 2) * 0.012, 0.219, 0.1 + Math.floor(i / 5) * 0.025], 0.006)); }
    else for (const side of [-1, 1]) parts.push(pointed("翼鳍前缘的长硬鳍棘", pale, [[side * 0.048, 0.205, 0.09], [side * 0.2, 0.29, 0.035], [side * 0.31, 0.325, -0.02]], [0.012, 0.007, 0]));
    parts.push(membrane("古软骨鱼的尾鳍", armor, [[0, 0.14, -0.3], [0, kind === 1 ? 0.21 : 0.28, -0.43], [0, 0.135, -0.4], [0, 0.06, -0.41]]));
  } else {
    const broad = kind === 4, w = broad ? 0.19 : kind === 3 ? 0.12 : 0.13, z = broad ? 0.18 : 0.12;
    parts.push(body("甲胄鱼头盾后相接的有鳞躯干", [[-0.31, 0.057, 0.006, 0.01], [-0.15, 0.065, w * 0.25, 0.032], [0, 0.07, w * 0.55, 0.042]], skin));
    const outline: [number, number][] = kind === 2 ? [[-w, -0.035], [-w * 0.7, z * 0.4], [-w * 0.3, z], [w * 0.3, z], [w * 0.7, z * 0.4], [w, -0.035], [w * 0.48, -0.1], [w * 0.3, -0.02], [-w * 0.3, -0.02], [-w * 0.48, -0.1]] : kind === 3 ? [[-w * 1.15, -0.04], [-w, z * 0.55], [-w * 0.28, z], [w * 0.28, z], [w, z * 0.55], [w * 1.15, -0.04], [w * 0.28, -0.025], [-w * 0.28, -0.025]] : [[-w, 0], [-w * 0.72, z * 0.76], [0, z], [w * 0.72, z * 0.76], [w, 0], [w * 0.52, -0.09], [-w * 0.52, -0.09]];
    parts.push(polygon(kind === 2 ? "头甲鱼向后形成双角的弯月头盾" : kind === 3 ? "矛吻鱼宽展的双侧长翼头甲" : "镰甲鱼极扁而宽的菱圆盾甲", armor, outline, broad ? 0.025 : 0.04, [0, 0.055, 0]), lobe("头盾中央隆起区", pale, [0, 0.09, 0.02], [w * 1.3, broad ? 0.035 : 0.06, z * 1.1]));
    if (kind === 3) parts.push(pointed("从下方口板伸出而非鼻骨的长矛状假吻", pale, [[0, 0.055, 0.085], [0, 0.055, 0.3]], [0.012, 0]));
    for (const side of [-1, 1]) { parts.push(lobe("头盾背侧成对眼区", dark, [side * w * (broad ? 0.65 : 0.24), 0.099, z * 0.36], [0.016, 0.008, 0.02])); if (kind === 2) parts.push(membrane("头甲鱼头盾后方的成对胸鳍", skin, [[side * w * 0.35, 0.06, -0.012], [side * w * 0.85, 0.025, -0.12], [side * w * 0.36, 0.04, -0.1]])); }
    parts.push(membrane("甲胄鱼不对称的尾鳍", armor, [[0, 0.06, -0.27], [0, 0.15, -0.39], [0, 0.06, -0.34], [0, 0.022, -0.35]]));
    const scales: ModelPart[] = []; for (let i = 0; i < 24; i++) { const row = Math.floor(i / 8), at = i % 8; scales.push(lobe("躯干侧面相接的细鳞甲", armor, [(row - 1) * 0.023, 0.078 - at * 0.0018, -0.04 - at * 0.025], [0.032, 0.009, 0.032])); } parts.push(combineMeshes("甲胄鱼后体鳞列", armor, scales));
  }
  const factor = kind === 1 ? 0.5 : kind === 2 ? 0.43 : kind === 3 ? 0.4 : 1;
  if (factor !== 1) for (const p of parts) for (const axis of ["x", "y", "z"] as const) { p.position[axis] *= factor; p.scale[axis] *= factor; }
  return parts;
}

const entries: [string, string, () => ModelPart[], string][] = [
  ["haplophrentis", "软舌螺（Haplophrentis）", () => softForms(0), "Haplophrentis carinatus"],
  ["halkieria", "哈尔基虫", () => softForms(1), "Halkieria evangelista"],
  ["odontogriphus", "齿谜虫", () => softForms(2), "Odontogriphus omalus"],
  ["dinomischus", "酒杯虫", () => softForms(3), "Dinomischus isolatus"],
  ["scolecofurca", "叉吻蠕虫", () => softForms(4), "Scolecofurca rara"],
  ["eldonia", "埃尔多尼亚", () => softForms(5), "Eldonia ludwigi"],
  ["isoxys", "等刺虫", () => doubleShell(0), "Isoxys acutangulus"],
  ["tuzoia", "图佐虫", () => doubleShell(1), "Tuzoia burgessensis"],
  ["leanchoilia", "林乔利虫", () => arthropod(0), "Leanchoilia superlata"],
  ["fuxianhuia", "抚仙湖虫", () => arthropod(1), "Fuxianhuia protensa"],
  ["hurdia", "赫德虾", () => radiodont(0), "Hurdia victoria"],
  ["cambroraster", "寒武耙虾", () => radiodont(1), "Cambroraster falcatus"],
  ["aegirocassis", "海神盔虾", () => radiodont(2), "Aegirocassis benmoulai"],
  ["kerygmachela", "基里虾", () => stemForms(0), "Kerygmachela kierkegaardi"],
  ["yunnanozoon", "云南虫", () => stemForms(1), "Yunnanozoon lividum"],
  ["stethacanthus", "胸棘鲨", () => ancientFish(0), "Stethacanthus altonensis"],
  ["iniopteryx", "颈鳍鱼（Iniopteryx）", () => ancientFish(1), "Iniopteryx rushlaui"],
  ["cephalaspis", "头甲鱼", () => ancientFish(2), "Cephalaspis lyelli"],
  ["doryaspis", "矛吻鱼", () => ancientFish(3), "Doryaspis nathorsti"],
  ["drepanaspis", "镰甲鱼", () => ancientFish(4), "Drepanaspis gemuendenensis"],
];

export const cambrianFormDesigns: MasterNatureDesign[] = entries.map(([key, name, build, taxon]) => design(key, name, "动物", build, [taxon, "古生物形态重建"]));
