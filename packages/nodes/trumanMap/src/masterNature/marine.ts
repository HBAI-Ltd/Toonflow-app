import { beam, cap, frontCup, combineMeshes, design, eyes, leaf, lobe, needle, part, petals, tube } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";

const flesh = "#b6b49a";
const shell = "#c4bea5";
const sea = "#91a69b";

export function spiral(name: string, radius: number, thickness: number, turns: number, color = shell): ModelPart {
  const vertices: { x: number; y: number; z: number }[] = [];
  const indices: number[] = [];
  const sections = 36;
  for (let i = 0; i <= sections; i++) {
    const t = i / sections; const a = t * turns * Math.PI * 2;
    const r = radius * (0.07 + 0.93 * t ** 1.5); const w = thickness * (0.12 + t * 0.88);
    for (let j = 0; j < 8; j++) { const b = j * Math.PI / 4; vertices.push({ x: Math.cos(a) * (r + Math.cos(b) * w), y: Math.sin(a) * (r + Math.cos(b) * w), z: Math.sin(b) * w }); }
    if (i) for (let j = 0; j < 8; j++) { const a0 = (i - 1) * 8 + j, a1 = (i - 1) * 8 + (j + 1) % 8, b0 = i * 8 + j, b1 = i * 8 + (j + 1) % 8; indices.push(a0, b0, a1, a1, b0, b1); }
  }
  for (let j = 1; j < 7; j++) indices.push(0, j + 1, j, sections * 8, sections * 8 + j, sections * 8 + j + 1);
  return part(name, "mesh", color, [0, radius + thickness, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

export function rayFin(name: string, root: Triple, end: Triple, width: number, color = sea): ModelPart {
  const frame = beam(name, color, root, end, width);
  return leaf(name, color, root, width, frame.scale.y, [frame.rotation.x, frame.rotation.y, frame.rotation.z]);
}

export function tail(root: Triple, span: number, vertical: boolean, color = sea): ModelPart[] {
  return [-1, 1].map(side => rayFin("分叉尾鳍", root, vertical ? [root[0], root[1] + side * span, root[2] - span * 0.6] : [root[0] + side * span, root[1], root[2] - span * 0.6], span * 0.65, color));
}

function sensoryArms(parts: ModelPart[], count: number, root: Triple, radius: number, length: number, thickness: number, color = flesh) {
  for (let i = 0; i < count; i++) { const a = i * Math.PI * 2 / count; parts.push(tube("柔性触手", color, [root, [root[0] + Math.cos(a) * radius, root[1] - length * 0.45, root[2] + Math.sin(a) * radius], [root[0] + Math.cos(a) * radius * 1.2, root[1] - length, root[2] + Math.sin(a) * radius * 1.2]], thickness)); }
}

function radialCreature(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  if (kind === 0) {
    parts.push(lobe("海星中央盘", "#b6a991", [0, 0.035, 0], [0.12, 0.07, 0.12]));
    for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5; const root: Triple = [Math.cos(a) * 0.025, 0.035, Math.sin(a) * 0.025]; const end: Triple = [Math.cos(a) * 0.19, 0.018, Math.sin(a) * 0.19]; parts.push(needle("五辐腕", "#b6a991", root, end, 0.085)); for (let foot = 0; foot < 4; foot++) parts.push(lobe("腕背棘", "#c3b89c", [Math.cos(a) * (0.05 + foot * 0.032), 0.055 - foot * 0.006, Math.sin(a) * (0.05 + foot * 0.032)], [0.012, 0.012, 0.012])); }
  } else if (kind === 1) {
    parts.push(lobe("海胆骨壳", "#aaa991", [0, 0.05, 0], [0.12, 0.1, 0.12]), combineMeshes("放射状硬刺", "#969c81", Array.from({ length: 40 }, (_, i) => { const a = i * 2.4; const y = 0.015 + i % 5 * 0.017; const r = Math.sqrt(Math.max(0.0001, 0.055 ** 2 - (y - 0.05) ** 2)); const root: Triple = [Math.cos(a) * r, y, Math.sin(a) * r]; return needle("海胆刺", "#969c81", root, [root[0] * 1.8, y + 0.025, root[2] * 1.8], 0.007); })));
  } else if (kind === 2) {
    parts.push(lobe("沙钱扁平骨板", "#c7c6ab", [0, 0.012, 0], [0.16, 0.024, 0.16]));
    for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5; parts.push(leaf("五瓣步带", "#a6ae90", [0, 0.023, 0], 0.018, 0.065, [90, -i * 72, 0]), lobe("壳缘穿孔", "#929d85", [Math.cos(a) * 0.055, 0.021, Math.sin(a) * 0.055], [0.012, 0.006, 0.022], [0, -i * 72, 0])); }
  } else if (kind === 3) {
    parts.push(lobe("海参长体", "#9da48c", [0, 0.035, 0], [0.09, 0.07, 0.26]), petals(8, [0, 0.04, 0.13], 0.014, 0.045, 50, "#b9bca0"));
    for (let i = 0; i < 24; i++) { const a = i * 2.4; const z = -0.1 + i % 6 * 0.04; parts.push(needle("体壁疣足", "#aeb197", [Math.cos(a) * 0.03, 0.04 + Math.sin(a) * 0.025, z], [Math.cos(a) * 0.05, 0.04 + Math.sin(a) * 0.04, z], 0.012)); }
  } else if (kind === 4) {
    parts.push(cap("水母伞体", "#bfcebd", [0, 0.35, 0], 0.2, 0.2, 0));
    sensoryArms(parts, 12, [0, 0.35, 0], 0.15, 0.32, 0.006, "#b2c3ae");
    for (let i = 0; i < 4; i++) parts.push(leaf("口腕褶带", "#cbd2bc", [Math.cos(i * Math.PI / 2) * 0.03, 0.37, Math.sin(i * Math.PI / 2) * 0.03], 0.07, 0.22, [170, i * 90, 15]));
  } else if (kind === 5) {
    parts.push(cap("海葵附着柱", "#aaa892", [0, 0, 0], 0.08, 0.13, 4), cap("口盘", "#c6bc9e", [0, 0.11, 0], 0.075, 0.02, 3));
    for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8; parts.push(tube("上举触手", "#bdb79e", [[Math.cos(a) * 0.06, 0.12, Math.sin(a) * 0.06], [Math.cos(a) * 0.09, 0.22, Math.sin(a) * 0.09], [Math.cos(a) * 0.12, 0.19, Math.sin(a) * 0.12]], 0.007)); }
  } else if (kind === 6) {
    parts.push(lobe("珊瑚基座", "#b7b19a", [0, 0.04, 0], [0.3, 0.09, 0.25]));
    for (let i = 0; i < 7; i++) { const a = i * 2.4; const end: Triple = [Math.cos(a) * 0.18, 0.25 + i % 3 * 0.07, Math.sin(a) * 0.18]; parts.push(tube("造礁珊瑚粗枝", "#bdb79d", [[0, 0.04, 0], [end[0] * 0.6, end[1] * 0.6, end[2] * 0.6], end], 0.035), cap("顶端珊瑚杯", "#d0c8ae", end, 0.035, 0.015, 3)); for (const side of [-1, 1]) parts.push(needle("珊瑚侧芽", "#bdb79d", [end[0] * 0.6, end[1] * 0.65, end[2] * 0.6], [end[0] + side * 0.06, end[1] - 0.025, end[2] + 0.04], 0.035)); }
  } else {
    parts.push(beam("海扇主轴", "#a8aa8c", [0, 0, 0], [0, 0.45, 0], 0.02));
    for (let i = 0; i < 9; i++) { const a = -Math.PI * 0.45 + i * Math.PI * 0.9 / 8; const end: Triple = [Math.sin(a) * 0.4, 0.2 + Math.cos(a) * 0.45, 0]; parts.push(beam("平面放射枝", "#b4b497", [0, 0.1, 0], end, 0.012)); for (const side of [-1, 1]) parts.push(beam("网状侧枝", "#b4b497", [end[0] * 0.5, end[1] * 0.65, 0], [end[0] + side * 0.075, end[1] + 0.035, 0], 0.006)); }
    for (let layer = 0; layer < 4; layer++) parts.push(tube("横向连接枝", "#c0bea1", [[-0.12 - layer * 0.055, 0.2 + layer * 0.08, 0], [0, 0.25 + layer * 0.09, 0], [0.12 + layer * 0.055, 0.2 + layer * 0.08, 0]], 0.004));
  }
  return parts;
}

function mollusc(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  if (kind <= 2) {
    if (kind === 0) {
      parts.push(lobe("扇贝下壳", shell, [0, 0.015, 0], [0.14, 0.025, 0.15]), lobe("张开上壳", "#b7b9a1", [0, 0.075, -0.035], [0.14, 0.025, 0.15], [55, 0, 0]));
      for (let i = 0; i < 11; i++) { const a = -1.2 + i * 0.24; parts.push(beam("放射壳肋", "#d1cbb2", [0, 0.02, -0.06], [Math.sin(a) * 0.06, 0.045, -0.005 + Math.cos(a) * 0.065], 0.005)); }
      parts.push(lobe("闭壳肌", flesh, [0, 0.035, 0], [0.06, 0.035, 0.06]));
    } else if (kind === 1) {
      parts.push(lobe("牡蛎不规则下壳", "#b3b7a3", [0, 0.02, 0], [0.15, 0.05, 0.22]), lobe("牡蛎软体", "#d0c9ae", [0, 0.04, 0], [0.12, 0.025, 0.18]), lobe("牡蛎掀起上壳", "#b5baa6", [-0.015, 0.09, -0.06], [0.14, 0.035, 0.21], [55, 0, 12]));
      for (let i = 0; i < 7; i++) parts.push(lobe("层叠壳缘", "#c4c6af", [Math.sin(i * 2.4) * 0.055, 0.035, Math.cos(i * 2.4) * 0.08], [0.045, 0.018, 0.055]));
    } else {
      parts.push(lobe("贻贝左瓣", "#7e9189", [-0.008, 0.018, 0], [0.033, 0.035, 0.1], [0, 0, -10]), lobe("贻贝右瓣", "#93a499", [0.008, 0.018, 0], [0.033, 0.035, 0.1], [0, 0, 10]));
      for (let i = 0; i < 5; i++) parts.push(tube("附着足丝", "#aaa88e", [[0, 0.01, -0.01], [(i - 2) * 0.012, 0.004, -0.04], [(i - 2) * 0.02, 0.002, -0.06]], 0.001));
    }
  } else if (kind === 3) {
    parts.push(spiral("鹦鹉螺平面螺旋壳", 0.14, 0.05, 2), lobe("伸出壳口的头", flesh, [0.13, 0.11, 0], [0.1, 0.11, 0.09]));
    for (let i = 0; i < 12; i++) parts.push(tube("短指状触腕", "#b8b59a", [[0.14, 0.1 + i % 3 * 0.015, 0], [0.21, 0.08 + i % 3 * 0.015, (i - 5.5) * 0.007], [0.25, 0.06, (i - 5.5) * 0.01]], 0.004));
    parts.push(...eyes([0.16, 0.14, 0], 0.035, 0.018));
  } else if (kind === 4) {
    parts.push(part("海螺尖塔壳", "lathe", shell, [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: 0.06, y: 0 }, { x: 0.08, y: 0.07 }, { x: 0.045, y: 0.12 }, { x: 0.05, y: 0.14 }, { x: 0.022, y: 0.19 }, { x: 0.028, y: 0.21 }, { x: 0, y: 0.28 }] }), cap("外翻壳口", "#d6cdb4", [0.04, 0.02, 0.04], 0.055, 0.1, 3));
    for (let i = 0; i < 7; i++) { const a = i * Math.PI * 2 / 7; parts.push(needle("壳肩角突", "#b8b69c", [Math.cos(a) * 0.06, 0.09, Math.sin(a) * 0.06], [Math.cos(a) * 0.1, 0.11, Math.sin(a) * 0.1], 0.026)); }
  } else if (kind === 5) {
    parts.push(lobe("蜗牛腹足", "#a4ad91", [0, 0.025, 0], [0.06, 0.05, 0.18]), spiral("蜗牛螺旋壳", 0.055, 0.022, 2.5, "#b7ab8b"), lobe("伸展头部", "#a4ad91", [0, 0.05, 0.095], [0.04, 0.04, 0.05]));
    for (const side of [-1, 1]) parts.push(beam("长眼柄", "#a4ad91", [side * 0.012, 0.055, 0.1], [side * 0.026, 0.095, 0.125], 0.004), lobe("眼柄端眼", "#737f6c", [side * 0.026, 0.095, 0.125], [0.008, 0.008, 0.008]), needle("短感觉触角", "#a4ad91", [side * 0.012, 0.04, 0.115], [side * 0.025, 0.045, 0.14], 0.004));
  } else if (kind === 6) {
    parts.push(tube("蛞蝓无壳腹足体", "#a8ae93", [[0, 0.018, -0.07], [0, 0.027, 0], [0, 0.025, 0.07]], 0.023), lobe("背部外套膜盾", "#b7baa0", [0, 0.048, 0.02], [0.045, 0.014, 0.065]));
    for (const side of [-1, 1]) parts.push(needle("蛞蝓眼柄", "#9da58b", [side * 0.009, 0.036, 0.07], [side * 0.022, 0.072, 0.095], 0.005), lobe("柄端眼点", "#737f6c", [side * 0.022, 0.072, 0.095], [0.007, 0.007, 0.007]));
  } else if (kind === 7) {
    parts.push(lobe("鱿鱼尖长胴体", "#b4c0aa", [0, 0.35, 0], [0.11, 0.38, 0.11]), ...eyes([0, 0.19, 0.02], 0.045, 0.035));
    for (const side of [-1, 1]) parts.push(leaf("尾端三角鳍", "#a3b6a6", [side * 0.02, 0.4, 0], 0.15, 0.18, [0, 0, -side * 35]));
    sensoryArms(parts, 8, [0, 0.2, 0], 0.065, 0.14, 0.008);
    for (const side of [-1, 1]) parts.push(tube("延长捕食触腕", flesh, [[side * 0.015, 0.2, 0], [side * 0.08, 0.07, 0], [side * 0.13, 0.02, 0.05]], 0.009), lobe("触腕吸盘棍", flesh, [side * 0.13, 0.02, 0.05], [0.025, 0.03, 0.055]));
  } else if (kind === 8) {
    parts.push(lobe("章鱼囊状头胴", "#aeb69b", [0, 0.2, 0], [0.2, 0.24, 0.18]), ...eyes([0, 0.15, 0.065], 0.07, 0.045));
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; parts.push(tube("八条卷曲腕", "#b9bca1", [[Math.cos(a) * 0.04, 0.12, Math.sin(a) * 0.04], [Math.cos(a) * 0.18, 0.025, Math.sin(a) * 0.18], [Math.cos(a + 0.4) * 0.29, 0.025, Math.sin(a + 0.4) * 0.29], [Math.cos(a + 0.6) * 0.28, 0.05, Math.sin(a + 0.6) * 0.28]], 0.018)); for (let sucker = 0; sucker < 3; sucker++) parts.push(lobe("腕内吸盘", "#d0cbb3", [Math.cos(a) * (0.08 + sucker * 0.045), 0.045, Math.sin(a) * (0.08 + sucker * 0.045)], [0.025, 0.012, 0.025])); }
  } else {
    parts.push(lobe("乌贼宽扁胴体", "#b9c2ac", [0, 0.09, 0], [0.2, 0.12, 0.34]), ...eyes([0, 0.08, 0.2], 0.07, 0.03));
    for (const side of [-1, 1]) for (let i = 0; i < 6; i++) parts.push(leaf("沿胴侧波状裙鳍", "#a8bca8", [side * 0.075, 0.08, -0.12 + i * 0.045], 0.055, 0.09, [85, -side * 90, i % 2 * 15]));
    for (let i = 0; i < 8; i++) parts.push(tube("前伸短腕", flesh, [[(i - 3.5) * 0.014, 0.07, 0.18], [(i - 3.5) * 0.02, 0.045, 0.27], [(i - 3.5) * 0.023, 0.025, 0.34]], 0.006));
  }
  return parts;
}

function walkingLegs(parts: ModelPart[], count: number, width: number, length: number, height: number, color = flesh) {
  for (const side of [-1, 1]) for (let i = 0; i < count; i++) { const z = (i - (count - 1) / 2) * length / count; parts.push(beam("步足基节", color, [side * width * 0.25, height, z], [side * width * 0.7, height * 1.3, z * 1.1], Math.max(0.002, width * 0.035)), needle("步足末节", color, [side * width * 0.7, height * 1.3, z * 1.1], [side * width, 0.008, z * 1.4], Math.max(0.002, width * 0.025))); }
}

function claw(parts: ModelPart[], root: Triple, side: number, size: number) {
  const hand: Triple = [root[0] + side * size * 0.5, root[1] + size * 0.15, root[2] + size];
  parts.push(beam("螯肢", "#a3a68c", root, hand, size * 0.16), lobe("螯掌", "#b8b59b", hand, [size * 0.5, size * 0.3, size * 0.7]), needle("固定钳指", "#b8b59b", [hand[0] - size * 0.16, hand[1], hand[2] + size * 0.2], [hand[0] - size * 0.15, hand[1], hand[2] + size * 0.65], size * 0.16), needle("可动钳指", "#b8b59b", [hand[0] + size * 0.16, hand[1], hand[2] + size * 0.2], [hand[0] + size * 0.04, hand[1], hand[2] + size * 0.65], size * 0.16));
}

function crustacean(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  if (kind === 0) {
    parts.push(lobe("龙虾头胸甲", "#a3a58b", [0, 0.08, 0.09], [0.14, 0.13, 0.25]), ...eyes([0, 0.13, 0.21], 0.045, 0.018));
    for (let i = 0; i < 6; i++) parts.push(lobe("龙虾腹节", "#b5b197", [0, 0.065 - i * 0.004, -0.055 - i * 0.045], [0.13 - i * 0.008, 0.1 - i * 0.008, 0.058]));
    walkingLegs(parts, 4, 0.18, 0.19, 0.07);
    for (const side of [-1, 1]) { claw(parts, [side * 0.045, 0.07, 0.13], side, 0.14); parts.push(tube("龙虾长触角", "#a4a88b", [[side * 0.02, 0.1, 0.23], [side * 0.16, 0.13, 0.43], [side * 0.23, 0.09, 0.65]], 0.003), leaf("尾扇", "#b5b197", [0, 0.035, -0.28], 0.12, 0.1, [90, side * 35 + 180, 0])); }
  } else if (kind === 1) {
    parts.push(lobe("蟹横宽背甲", "#b2b49a", [0, 0.065, 0], [0.28, 0.11, 0.19])); walkingLegs(parts, 4, 0.25, 0.15, 0.06);
    for (const side of [-1, 1]) { claw(parts, [side * 0.095, 0.06, 0.07], side, 0.1); parts.push(beam("蟹眼柄", "#b2b49a", [side * 0.06, 0.09, 0.065], [side * 0.07, 0.13, 0.09], 0.009), lobe("柄眼", "#717f6d", [side * 0.07, 0.13, 0.09], [0.022, 0.022, 0.022])); }
  } else if (kind === 2) {
    parts.push(spiral("寄居蟹螺壳", 0.07, 0.025, 2, "#bdb99f"), lobe("伸出壳口的软腹", flesh, [0.065, 0.05, 0], [0.08, 0.06, 0.09])); walkingLegs(parts, 3, 0.11, 0.08, 0.045);
    claw(parts, [0.05, 0.045, 0.035], 1, 0.07); claw(parts, [-0.02, 0.045, 0.035], -1, 0.045);
    parts.push(...eyes([0.06, 0.09, 0.045], 0.025, 0.012));
  } else if (kind === 3) {
    parts.push(lobe("对虾头胸甲", "#bcc4ac", [0, 0.05, 0.055], [0.045, 0.06, 0.1]), needle("额剑", "#a8b59c", [0, 0.065, 0.09], [0, 0.095, 0.18], 0.018));
    for (let i = 0; i < 7; i++) parts.push(lobe("弯曲虾腹节", "#b6c0a8", [0, 0.055 - Math.sin(i / 6 * Math.PI) * 0.026, -i * 0.022], [0.05 - i * 0.003, 0.05 - i * 0.003, 0.032]));
    walkingLegs(parts, 5, 0.055, 0.07, 0.04);
    for (const side of [-1, 1]) parts.push(tube("长鞭触角", "#a8b59c", [[side * 0.007, 0.065, 0.09], [side * 0.07, 0.09, 0.18], [side * 0.12, 0.06, 0.25]], 0.001), leaf("虾尾扇", "#b6c0a8", [0, 0.05, -0.15], 0.045, 0.045, [90, 180 + side * 30, 0]));
  } else if (kind === 4) {
    parts.push(cap("藤壶固定壳座", "#c1c4ae", [0, 0, 0], 0.065, 0.075, 3));
    for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; parts.push(needle("石灰质壳板", "#d0cfb6", [Math.cos(a) * 0.055, 0.015, Math.sin(a) * 0.055], [Math.cos(a) * 0.025, 0.085, Math.sin(a) * 0.025], 0.04)); }
    parts.push(petals(8, [0, 0.07, 0], 0.008, 0.075, 15, "#afa98b"));
  } else if (kind === 5) {
    parts.push(lobe("鲎马蹄前甲", "#a3ab92", [0, 0.06, 0.08], [0.33, 0.12, 0.3]), lobe("鲎腹甲", "#a3ab92", [0, 0.04, -0.1], [0.21, 0.08, 0.19]), needle("长剑尾", "#929e84", [0, 0.04, -0.16], [0, 0.015, -0.52], 0.035));
    walkingLegs(parts, 5, 0.15, 0.14, 0.035);
    for (const side of [-1, 1]) for (let i = 0; i < 4; i++) parts.push(needle("腹甲侧棘", "#b1b79b", [side * 0.08, 0.04, -0.045 - i * 0.035], [side * 0.14, 0.04, -0.06 - i * 0.035], 0.02));
  } else {
    parts.push(beam("海蜘蛛狭小躯干", "#b1b499", [0, 0.045, -0.025], [0, 0.045, 0.025], 0.012), needle("管状吻", "#b1b499", [0, 0.045, 0.025], [0, 0.035, 0.065], 0.012));
    walkingLegs(parts, 4, 0.16, 0.055, 0.045, "#b1b499");
  }
  return parts;
}

function fish(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  if (kind === 0) {
    parts.push(lobe("鲨鱼纺锤体", sea, [0, 0.3, 0], [0.48, 0.48, 1.9]), lobe("鲨吻", "#a6b6a6", [0, 0.26, 0.9], [0.38, 0.25, 0.55]), ...eyes([0, 0.36, 0.69], 0.17, 0.05), rayFin("三角背鳍", [0, 0.45, 0.05], [0, 0.95, -0.12], 0.4), ...tail([0, 0.3, -0.95], 0.45, true));
    for (const side of [-1, 1]) { parts.push(rayFin("鲨鱼胸鳍", [side * 0.13, 0.25, 0.3], [side * 0.65, 0.12, -0.05], 0.3)); for (let i = 0; i < 5; i++) parts.push(beam("侧鳃裂", "#7b9589", [side * 0.205, 0.23, 0.35 + i * 0.055], [side * 0.205, 0.38, 0.35 + i * 0.055], 0.012)); }
  } else if (kind === 1) {
    parts.push(lobe("蝠鲼中央体盘", sea, [0, 0.2, 0], [0.6, 0.23, 0.9]), ...eyes([0, 0.28, 0.32], 0.21, 0.045), tube("鞭状尾", sea, [[0, 0.19, -0.4], [0, 0.1, -1], [0.1, 0.05, -1.7]], 0.025));
    for (const side of [-1, 1]) parts.push(rayFin("菱形翼状胸鳍", [side * 0.14, 0.2, 0.1], [side * 1.5, 0.1, -0.12], 0.9), tube("头鳍卷瓣", "#a8b8a7", [[side * 0.2, 0.22, 0.32], [side * 0.28, 0.17, 0.55], [side * 0.18, 0.17, 0.63]], 0.035));
  } else if (kind === 2) {
    parts.push(lobe("海马直立躯", "#b4b38f", [0, 0.18, 0], [0.065, 0.16, 0.075]), tube("弯海马颈", "#b4b38f", [[0, 0.23, 0], [0, 0.28, 0.025], [0, 0.29, 0.07]], 0.025), lobe("马形头", "#b4b38f", [0, 0.295, 0.075], [0.05, 0.06, 0.05]), beam("管状吸口", "#b4b38f", [0, 0.28, 0.085], [0, 0.265, 0.14], 0.015), ...eyes([0, 0.305, 0.085], 0.019, 0.012), tube("卷握尾", "#b4b38f", [[0, 0.12, 0], [0, 0.045, -0.045], [0, 0.02, 0], [0, 0.045, 0.025], [0, 0.055, 0.005]], 0.013), rayFin("背部小扇鳍", [0, 0.18, -0.025], [0, 0.2, -0.09], 0.065));
    for (let i = 0; i < 7; i++) parts.push(lobe("躯干骨环", "#c2bf9c", [0, 0.115 + i * 0.018, 0], [0.066, 0.008, 0.06]));
  } else if (kind === 3) {
    parts.push(lobe("膨胀河豚球体", "#b5bba0", [0, 0.16, 0], [0.35, 0.32, 0.35]), ...eyes([0, 0.22, 0.12], 0.09, 0.045), frontCup("小圆口", "#9aa68c", [0, 0.14, 0.16], 0.035, 0.02), ...tail([0, 0.16, -0.17], 0.08, true));
    parts.push(combineMeshes("可见全身棘刺", "#c9c7aa", Array.from({ length: 40 }, (_, i) => { const a = i * 2.4; const y = 0.035 + i % 6 * 0.045; const r = Math.sqrt(Math.max(0.001, 0.15 ** 2 - (y - 0.16) ** 2)); const root: Triple = [Math.cos(a) * r, y, Math.sin(a) * r]; return needle("皮肤短刺", "#c9c7aa", root, [root[0] * 1.18, y + 0.02, root[2] * 1.18], 0.016); })));
  } else if (kind === 4) {
    parts.push(lobe("翻车鱼高侧扁体", "#a9b9aa", [0, 0.55, 0], [0.25, 1.2, 1.25]), ...eyes([0, 0.7, 0.42], 0.115, 0.055), rayFin("高背鳍", [0, 0.95, -0.2], [0, 1.65, -0.4], 0.4), rayFin("长臀鳍", [0, 0.2, -0.2], [0, -0.35, -0.36], 0.4), lobe("截平舵尾", "#93aa9d", [0, 0.55, -0.55], [0.12, 0.88, 0.18]));
  } else if (kind === 5) {
    parts.push(lobe("比目鱼平卧体", "#adb49a", [0, 0.04, 0], [0.35, 0.07, 0.55]), ...tail([0, 0.04, -0.26], 0.13, false));
    for (const x of [-0.045, 0.025]) parts.push(lobe("同侧朝上双眼", "#6e806e", [x, 0.073, 0.15], [0.025, 0.02, 0.025]));
    for (const side of [-1, 1]) for (let i = 0; i < 7; i++) parts.push(rayFin("体缘连续鳍片", [side * 0.12, 0.04, -0.19 + i * 0.055], [side * (0.17 + Math.sin(i / 6 * Math.PI) * 0.05), 0.03, -0.19 + i * 0.055], 0.055));
  } else if (kind === 6) {
    parts.push(lobe("琵琶鱼球形躯体", "#9ba791", [0, 0.15, 0], [0.3, 0.3, 0.35]), frontCup("巨大开口", "#7d8e79", [0, 0.13, 0.15], 0.11, 0.03), ...eyes([0, 0.24, 0.12], 0.095, 0.03), tube("钓竿状第一背鳍", "#a8b295", [[0, 0.26, 0.03], [0, 0.43, 0.1], [0, 0.4, 0.24]], 0.008), lobe("拟饵球", "#d0d4b8", [0, 0.38, 0.24], [0.04, 0.045, 0.04]), ...tail([0, 0.15, -0.17], 0.09, true));
    for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; parts.push(needle("向内尖牙", "#d2ccb1", [Math.cos(a) * 0.088, 0.13 + Math.sin(a) * 0.088, 0.175], [Math.cos(a) * 0.06, 0.13 + Math.sin(a) * 0.06, 0.19], 0.012)); }
  } else if (kind === 7) {
    parts.push(lobe("锯鳐扁躯", sea, [0, 0.12, 0], [0.58, 0.22, 1.5]), beam("长锯状吻", "#abb9a2", [0, 0.12, 0.65], [0, 0.12, 1.8], 0.11, 0.035), ...eyes([0, 0.21, 0.57], 0.18, 0.045), ...tail([0, 0.12, -0.75], 0.3, true));
    for (const side of [-1, 1]) { parts.push(rayFin("宽胸鳍", [side * 0.16, 0.1, 0.22], [side * 0.64, 0.07, -0.07], 0.43)); for (let i = 0; i < 12; i++) parts.push(needle("吻侧锯齿", "#c7c8aa", [side * 0.05, 0.12, 0.8 + i * 0.08], [side * 0.15, 0.12, 0.83 + i * 0.08], 0.025)); }
  } else if (kind === 8) {
    parts.push(lobe("鲶鱼宽头", "#9eae9a", [0, 0.15, 0.26], [0.33, 0.22, 0.37]), lobe("鲶鱼圆长体", "#9eae9a", [0, 0.15, -0.1], [0.28, 0.25, 0.7]), ...eyes([0, 0.23, 0.3], 0.11, 0.03), ...tail([0, 0.15, -0.43], 0.17, true));
    for (const side of [-1, 1]) for (let i = 0; i < 3; i++) parts.push(tube("口边长须", "#b3bea4", [[side * 0.075, 0.13, 0.4], [side * (0.2 + i * 0.035), 0.11, 0.45], [side * (0.3 + i * 0.035), 0.07, 0.3]], 0.004));
  } else if (kind === 9) {
    parts.push(lobe("飞鱼细体", "#adc0b1", [0, 0.11, 0], [0.11, 0.16, 0.52]), ...eyes([0, 0.14, 0.19], 0.042, 0.021), ...tail([0, 0.11, -0.26], 0.11, true));
    for (const side of [-1, 1]) parts.push(rayFin("翼状巨大胸鳍", [side * 0.035, 0.12, 0.12], [side * 0.43, 0.1, -0.05], 0.27), rayFin("扩大腹鳍", [side * 0.025, 0.09, -0.1], [side * 0.2, 0.07, -0.2], 0.1));
  } else if (kind === 10) {
    parts.push(tube("鳗鱼蛇形鱼体", "#9eac96", [[-0.32, 0.04, -0.1], [-0.1, 0.06, 0.06], [0.15, 0.06, 0], [0.3, 0.06, 0.1]], 0.04), ...eyes([0.3, 0.08, 0.11], 0.026, 0.012));
    for (let i = 0; i < 7; i++) parts.push(rayFin("连续背臀鳍", [-0.25 + i * 0.075, 0.085, Math.sin(i) * 0.035], [-0.25 + i * 0.075, 0.13, Math.sin(i) * 0.035], 0.085));
  } else {
    parts.push(lobe("旗鱼长体", "#8ea79d", [0, 0.35, 0], [0.28, 0.48, 1.55]), needle("上颌长剑", "#a6b8a5", [0, 0.37, 0.65], [0, 0.37, 1.4], 0.1), ...eyes([0, 0.44, 0.55], 0.1, 0.035), ...tail([0, 0.35, -0.8], 0.35, true));
    parts.push(part("高大帆状背鳍", "extrude", "#94a8a0", [0, 0, 0], [1, 1, 1], [0, 90, 0], { depth: 0.012, profile: [{ x: -0.5, y: 0.48 }, { x: -0.42, y: 1.1 }, { x: 0.45, y: 0.91 }, { x: 0.65, y: 0.5 }] }));
    for (const side of [-1, 1]) parts.push(rayFin("狭长胸鳍", [side * 0.08, 0.29, 0.3], [side * 0.4, 0.17, -0.12], 0.12));
  }
  return parts;
}

function seaMammal(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  if (kind === 0) {
    parts.push(lobe("海豚流线体", "#98afa4", [0, 0.32, 0], [0.58, 0.58, 1.9]), lobe("额隆", "#a6b9ab", [0, 0.35, 0.73], [0.47, 0.42, 0.6]), lobe("突出的喙吻", "#b4c1af", [0, 0.25, 1.09], [0.23, 0.14, 0.5]), ...eyes([0, 0.42, 0.81], 0.19, 0.035), rayFin("后弯背鳍", [0, 0.53, -0.1], [0, 0.9, -0.3], 0.32), ...tail([0, 0.26, -0.98], 0.5, false));
    for (const side of [-1, 1]) parts.push(rayFin("海豚胸鳍", [side * 0.17, 0.22, 0.4], [side * 0.51, 0.08, 0.05], 0.25));
  } else if (kind === 1) {
    parts.push(lobe("抹香鲸块状巨头", "#8fa39b", [0, 1.1, 2.7], [2.6, 2.15, 4.9]), lobe("抹香鲸后躯", "#8fa39b", [0, 1, -1], [2.3, 1.9, 5.8]), lobe("下颌", "#b1beb0", [0, 0.45, 3.25], [0.95, 0.3, 3.9]), ...eyes([0, 1.1, 3.35], 1.12, 0.12), ...tail([0, 0.9, -3.8], 1.6, false), cap("偏左喷气孔", "#687f76", [-0.55, 2.05, 4], 0.13, 0.025, 3));
    for (const side of [-1, 1]) parts.push(rayFin("短桨状胸鳍", [side * 0.7, 0.5, 1.6], [side * 1.7, 0.2, 0.6], 0.85));
  } else {
    parts.push(lobe("儒艮圆筒体", "#a5b4a2", [0, 0.37, 0], [0.8, 0.72, 1.9]), lobe("儒艮下弯口鼻", "#b1bca7", [0, 0.3, 0.9], [0.55, 0.5, 0.65]), lobe("肥厚唇垫", "#9caa96", [0, 0.2, 1.15], [0.42, 0.17, 0.23]), ...eyes([0, 0.46, 0.94], 0.21, 0.035), ...tail([0, 0.33, -1], 0.52, false));
    for (const side of [-1, 1]) parts.push(rayFin("圆桨状前肢", [side * 0.25, 0.26, 0.4], [side * 0.6, 0.07, 0.13], 0.3));
  }
  return parts;
}

function softBody(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  if (kind === 0) {
    for (let i = 0; i < 5; i++) { const a = i * 2.4; parts.push(cap("海绵烟囱状体", "#bbbba0", [Math.cos(a) * 0.085, 0, Math.sin(a) * 0.085], 0.045 + i % 2 * 0.015, 0.17 + i % 3 * 0.06, 3)); }
    parts.push(lobe("海绵共同基部", "#b0b497", [0, 0.02, 0], [0.25, 0.055, 0.23]));
  } else if (kind === 1) {
    parts.push(tube("管虫石灰质虫管", "#c5c5aa", [[0, 0, 0], [0, 0.15, 0], [0.04, 0.26, 0]], 0.014));
    for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8; const end: Triple = [0.04 + Math.cos(a) * 0.11, 0.34, Math.sin(a) * 0.11]; parts.push(beam("鳃冠羽轴", "#b1b29a", [0.04, 0.25, 0], end, 0.003), leaf("羽状鳃片", "#c1bda2", [0.04, 0.25, 0], 0.025, 0.15, [45, -i * 22.5, 0])); }
  } else if (kind === 2) {
    parts.push(tube("沙蚕分节长体", "#b8b498", [[-0.15, 0.012, 0], [-0.04, 0.016, -0.035], [0.08, 0.016, 0.025], [0.16, 0.014, 0]], 0.014));
    for (let i = 0; i < 14; i++) for (const side of [-1, 1]) parts.push(needle("疣足刚毛束", "#c2c2a4", [-0.13 + i * 0.02, 0.014, side * 0.01], [-0.135 + i * 0.02, 0.01, side * 0.035], 0.006));
    for (const side of [-1, 1]) parts.push(needle("吻前触须", "#b8b498", [0.15, 0.018, side * 0.007], [0.185, 0.02, side * 0.02], 0.004));
  } else if (kind === 3) {
    parts.push(tube("蚯蚓圆筒体", "#b4a48e", [[-0.12, 0.012, 0], [-0.03, 0.015, -0.025], [0.07, 0.015, 0.02], [0.14, 0.012, 0]], 0.009), lobe("明显生殖环带", "#c4b69d", [0.068, 0.015, 0.018], [0.038, 0.023, 0.025]));
    for (let i = 0; i < 16; i++) parts.push(beam("体表环纹", "#9d947f", [-0.105 + i * 0.014, 0.022, -0.009 + Math.sin(i * 0.6) * 0.012], [-0.105 + i * 0.014, 0.022, 0.009 + Math.sin(i * 0.6) * 0.012], 0.001));
  } else {
    parts.push(lobe("涡虫扁平体", "#b3bda2", [0, 0.005, 0], [0.025, 0.008, 0.08]), lobe("三角头及侧耳突", "#bcc4aa", [0, 0.005, 0.04], [0.042, 0.009, 0.025]));
    for (const side of [-1, 1]) parts.push(lobe("背侧眼点", "#687b69", [side * 0.007, 0.01, 0.043], [0.004, 0.002, 0.004]));
  }
  return parts;
}

const radials = [["starfish", "海星"], ["seaUrchin", "海胆"], ["sandDollar", "沙钱"], ["seaCucumber", "海参"], ["jellyfish", "水母"], ["seaAnemone", "海葵"], ["reefCoral", "造礁珊瑚"], ["seaFan", "海扇"]];
const molluscs = [["scallop", "扇贝"], ["oyster", "牡蛎"], ["mussel", "贻贝"], ["nautilus", "鹦鹉螺"], ["conch", "海螺"], ["snail", "蜗牛"], ["slug", "蛞蝓"], ["squid", "鱿鱼"], ["octopus", "章鱼"], ["cuttlefish", "乌贼"]];
const crustaceans = [["lobster", "龙虾"], ["crab", "螃蟹"], ["hermitCrab", "寄居蟹"], ["shrimp", "对虾"], ["barnacle", "藤壶"], ["horseshoeCrab", "鲎"], ["seaSpider", "海蜘蛛"]];
const fishes = [["shark", "鲨鱼"], ["manta", "蝠鲼"], ["seahorse", "海马"], ["puffer", "河豚"], ["sunfish", "翻车鱼"], ["flatfish", "比目鱼"], ["anglerFish", "琵琶鱼"], ["sawfish", "锯鳐"], ["catfish", "鲶鱼"], ["flyingFish", "飞鱼"], ["eel", "鳗鱼"], ["sailfish", "旗鱼"]];
const seaMammals = [["dolphin", "海豚"], ["spermWhale", "抹香鲸"], ["dugong", "儒艮"]];
const softBodies = [["sponge", "海绵"], ["tubeWorm", "管虫"], ["ragworm", "沙蚕"], ["earthworm", "蚯蚓"], ["planarian", "涡虫"]];

export const marineDesigns: MasterNatureDesign[] = [
  ...radials.map(([key, name], index) => design(key!, name!, "动物", () => radialCreature(index), ["辐射对称与珊瑚"])),
  ...molluscs.map(([key, name], index) => design(key!, name!, "动物", () => mollusc(index), ["软体动物"])),
  ...crustaceans.map(([key, name], index) => design(key!, name!, "动物", () => crustacean(index), ["海生节肢动物"])),
  ...fishes.map(([key, name], index) => design(key!, name!, "动物", () => fish(index), ["鱼类"])),
  ...seaMammals.map(([key, name], index) => design(key!, name!, "动物", () => seaMammal(index), ["水生哺乳动物"])),
  ...softBodies.map(([key, name], index) => design(key!, name!, "动物", () => softBody(index), ["海绵与蠕虫"])),
];
