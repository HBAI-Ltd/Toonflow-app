import { beam, cap, combineMeshes, design, eyes, frontCup, leaf, lobe, needle, part, polygon, sweptProfile, tapered, tube } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { membrane } from "./animals";

const shell = "#d0cbb3";
const soft = "#b2c1a6";
const chitin = "#a4b49a";

function whorl(name: string, radius: number, height: number, turns: number): ModelPart {
  const vertices: { x: number; y: number; z: number }[] = []; const indices: number[] = [];
  const sections = 40;
  for (let i = 0; i <= sections; i++) {
    const t = i / sections; const a = t * turns * Math.PI * 2; const r = radius * (0.08 + t * 0.92); const width = radius * (0.018 + t * 0.25);
    for (let j = 0; j < 8; j++) { const b = j * Math.PI / 4; vertices.push({ x: Math.cos(a) * (r + Math.cos(b) * width), y: height * (1 - t) + Math.sin(b) * width, z: Math.sin(a) * (r + Math.cos(b) * width) }); }
    if (i) for (let j = 0; j < 8; j++) { const a = (i - 1) * 8 + j, b = (i - 1) * 8 + (j + 1) % 8, c = i * 8 + j, d = i * 8 + (j + 1) % 8; indices.push(a, c, b, b, c, d); }
  }
  for (let j = 1; j < 7; j++) indices.push(0, j + 1, j, sections * 8, sections * 8 + j, sections * 8 + j + 1);
  return part(name, "mesh", shell, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

function bivalve(parts: ModelPart[], outline: [number, number][], width: number, length: number, gap = 22) {
  for (const side of [-1, 1]) { const valve = polygon("铰合的薄双壳", shell, outline, 0.008); valve.rotation = { x: side * gap, y: 0, z: 0 }; valve.position = { x: 0, y: 0.025, z: -length * 0.3 }; parts.push(valve); }
  parts.push(beam("双壳铰合韧带", "#a8ad92", [-width * 0.23, 0.025, -length * 0.3], [width * 0.23, 0.025, -length * 0.3], 0.012));
}

function walkingLegs(parts: ModelPart[], count: number, rootLength: number, reach: number, tall: number, width: number) {
  for (const side of [-1, 1]) for (let i = 0; i < count; i++) { const z = rootLength * (0.5 - i / Math.max(1, count - 1)); parts.push(tapered("分节步足", chitin, [[side * reach * 0.15, tall, z], [side * reach * 0.65, tall * 1.6, z - reach * 0.12], [side * reach, width, z - reach * 0.35]], [width, width * 0.7, width * 0.2])); }
}

function shellAnimal(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  if (kind === 0 || kind === 1) {
    parts.push(whorl(kind === 0 ? "蜘蛛螺螺塔" : "骨螺多层螺塔", 0.085, kind === 0 ? 0.08 : 0.18, kind === 0 ? 2.2 : 3.2));
    parts.push(frontCup("外翻壳口", "#d8d1b9", [0.045, 0.02, 0.055], 0.06, 0.018));
    if (kind === 0) for (let i = 0; i < 6; i++) { const a = (i + 0.4) * Math.PI / 6; parts.push(tapered("壳口指状外唇", shell, [[Math.cos(a) * 0.055, 0.012, Math.sin(a) * 0.055], [Math.cos(a) * 0.13, 0.02, Math.sin(a) * 0.13], [Math.cos(a + 0.12) * 0.18, 0.055, Math.sin(a + 0.12) * 0.18]], [0.015, 0.009, 0.0015])); }
    else { for (let level = 0; level < 3; level++) for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; const r = 0.07 - level * 0.017; parts.push(tapered("螺层棘状瘤肋", shell, [[Math.cos(a) * r, level * 0.052, Math.sin(a) * r], [Math.cos(a) * (r + 0.04), 0.02 + level * 0.052, Math.sin(a) * (r + 0.04)], [Math.cos(a) * (r + 0.065), 0.04 + level * 0.052, Math.sin(a) * (r + 0.065)]], [0.01, 0.006, 0.001])); } parts.push(tapered("骨螺长水管沟", shell, [[0, 0.01, 0.055], [0.01, 0.015, 0.18], [0.005, 0.02, 0.24]], [0.016, 0.01, 0.004])); }
  } else if (kind === 2) {
    parts.push(whorl("天梯螺高塔分层壳", 0.032, 0.15, 4.5));
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; const path: Triple[] = Array.from({ length: 6 }, (_, j) => { const r = 0.035 * (1 - j * 0.16); return [Math.cos(a) * r, j * 0.029, Math.sin(a) * r]; }); parts.push(tube("贯穿螺层的连续纵肋", "#e0dac3", path, 0.003)); }
  } else if (kind === 3) {
    parts.push(whorl("车轮螺低平盘绕壳", 0.067, 0.026, 3.5));
    const ring = sweptProfile("敞开的宽脐孔壳底", shell, [[0.021, 0], [0.068, 0.006], [0.064, 0.016], [0.026, 0.013]], Math.PI * 2, 24); parts.push(ring);
  } else if (kind === 4) {
    parts.push(whorl("翁戎螺圆锥壳", 0.09, 0.13, 3.8));
    const lip = sweptProfile("壳口边缘真实深裂缝", "#e0d6bd", [[0.035, 0], [0.09, 0.018], [0.087, 0.025], [0.035, 0.006]], Math.PI * 1.85, 24); lip.rotation.y = 100; parts.push(lip);
  } else if (kind === 5) {
    parts.push(sweptProfile("枣螺薄壁桶形外壳", shell, [[0.012, 0], [0.045, 0.015], [0.055, 0.07], [0.04, 0.12], [0.012, 0.13], [0.012, 0.124], [0.034, 0.114], [0.049, 0.07], [0.039, 0.02], [0.012, 0.006]], Math.PI * 1.55, 20));
    parts.push(whorl("凹入的短壳顶", 0.018, 0.02, 2)); parts.at(-1)!.position.y = 0.125;
  } else if (kind === 6) {
    bivalve(parts, [[-0.08, 0], [-0.1, 0.08], [-0.06, 0.15], [0.045, 0.16], [0.09, 0.09], [0.07, 0]], 0.2, 0.16, 10);
    parts.push(tapered("象拔蚌超出壳体的粗虹吸管", soft, [[0, 0.04, 0.06], [0.02, 0.1, 0.24], [0.02, 0.18, 0.42]], [0.055, 0.05, 0.04]), frontCup("虹吸管末端双口", "#ced0b4", [0.02, 0.19, 0.44], 0.035, 0.01));
  } else if (kind === 7) {
    bivalve(parts, [[0, -0.03], [-0.035, 0], [-0.038, 0.09], [-0.015, 0.13], [0.025, 0.11], [0.04, 0.03]], 0.08, 0.15, 8);
    for (const side of [-1, 1]) for (let i = 0; i < 8; i++) parts.push(tube("海笋壳上放射刮削棱", "#dcd4bc", [[side * 0.005, 0.035, -0.04], [side * (0.03 - i * 0.002), 0.04 + i * 0.001, 0.005 + i * 0.009], [side * 0.023, 0.023, 0.065]], 0.0025));
    parts.push(tube("海笋细长双虹吸管", soft, [[0, 0.04, 0.07], [0.008, 0.07, 0.14], [0.008, 0.08, 0.21]], 0.012));
  } else if (kind === 8) {
    bivalve(parts, [[0, -0.16], [-0.105, 0.18], [-0.08, 0.23], [0.075, 0.25], [0.13, 0.19]], 0.25, 0.41, 12);
    for (const side of [-1, 1]) for (let i = 0; i < 8; i++) parts.push(beam("江珧扇形纵脊", "#b8b69c", [0, 0.026, -0.28], [side * (0.015 + i * 0.014), 0.09, 0.1 + i % 3 * 0.012], 0.004));
  } else {
    for (const side of [-1, 1]) parts.push(lobe("鸟蛤厚拱心形双壳", shell, [side * 0.017, 0.04, 0], [0.055, 0.075, 0.1], [0, 0, side * 12]));
    for (let i = 0; i < 12; i++) { const a = i * Math.PI * 2 / 12; parts.push(tube("鸟蛤贯穿壳面的粗放射肋", "#e0d6b9", [[0, 0.066, -0.026], [Math.sin(a) * 0.035, 0.073, Math.cos(a) * 0.035], [Math.sin(a) * 0.04, 0.03, Math.cos(a) * 0.045]], 0.003)); }
  }
  return parts;
}

function crustacean(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  if (kind === 0) {
    parts.push(lobe("虾蛄狭长头胸甲", chitin, [0, 0.07, 0.07], [0.07, 0.08, 0.14]));
    for (let i = 0; i < 6; i++) parts.push(lobe("虾蛄裸露宽腹节", soft, [0, 0.055, -i * 0.025], [0.07 + i * 0.003, 0.055, 0.035]));
    for (const side of [-1, 1]) { parts.push(beam("可转动眼柄", soft, [side * 0.018, 0.1, 0.12], [side * 0.03, 0.135, 0.15], 0.012), lobe("横向复眼", "#839c87", [side * 0.03, 0.135, 0.15], [0.03, 0.02, 0.023]), tapered("折叠的捕食前肢", chitin, [[side * 0.03, 0.07, 0.1], [side * 0.065, 0.05, 0.18], [side * 0.055, 0.11, 0.16]], [0.012, 0.011, 0.008]), lobe("捕食肢击锤", "#c5c5a5", [side * 0.055, 0.105, 0.16], [0.03, 0.03, 0.025]), leaf("宽尾扇", chitin, [side * 0.025, 0.045, -0.13], 0.05, 0.06, [-95, side * 35, 0])); }
    walkingLegs(parts, 3, 0.08, 0.075, 0.05, 0.005);
  } else if (kind === 1 || kind === 2) {
    const spider = kind === 2; parts.push(lobe(spider ? "蜘蛛蟹三角形头胸甲" : "椰子蟹隆起的坚硬头胸甲", chitin, [0, spider ? 0.35 : 0.2, 0], spider ? [0.28, 0.23, 0.38] : [0.36, 0.31, 0.42]));
    walkingLegs(parts, 4, spider ? 0.25 : 0.22, spider ? 1.2 : 0.52, spider ? 0.32 : 0.17, spider ? 0.025 : 0.045);
    for (const side of [-1, 1]) { const x = side * (spider ? 0.28 : 0.27); const y = spider ? 0.3 : 0.2; parts.push(tapered("前伸螯足", chitin, [[side * 0.08, y, 0.13], [x, y * 0.8, 0.27], [x * 0.8, y * 1.2, 0.42]], [0.027, 0.025, spider ? 0.025 : 0.05]), lobe("蟹螯掌节", soft, [x * 0.8, y * 1.2, 0.44], spider ? [0.07, 0.08, 0.12] : [side === -1 ? 0.17 : 0.12, 0.16, 0.17]), needle("蟹钳上指", shell, [x * 0.8 - 0.025, y * 1.2, 0.46], [x * 0.8, y * 1.2, 0.56], 0.04), needle("蟹钳下指", shell, [x * 0.8 + 0.025, y * 1.2, 0.46], [x * 0.8 + 0.005, y * 1.2, 0.55], 0.035)); }
    if (spider) for (const side of [-1, 1]) parts.push(needle("头甲前端分叉额角", shell, [side * 0.03, 0.38, 0.12], [side * 0.025, 0.39, 0.26], 0.025)); else parts.push(lobe("收缩在胸后的小腹甲", "#b7bea0", [0, 0.12, -0.23], [0.21, 0.17, 0.21]));
  } else if (kind === 3) {
    parts.push(tapered("鹅颈藤壶柔韧长柄", "#acb49d", [[0, 0, 0], [0.02, 0.09, 0], [-0.01, 0.19, 0.01]], [0.026, 0.022, 0.018]));
    const outlines: [number, number][][] = [[[0, -0.04], [-0.052, 0.01], [-0.035, 0.08], [0, 0.1]], [[0.004, -0.04], [0.052, 0.01], [0.035, 0.08], [0.004, 0.1]]];
    for (const side of [-1, 1]) for (const outline of outlines) { const plate = polygon("五片铰合石灰质壳板", shell, outline, 0.008, [0, 0.22, side * 0.009]); plate.rotation.x = 90; parts.push(plate); }
    parts.push(needle("壳背狭长龙骨板", "#ded7bf", [0, 0.18, -0.017], [0, 0.32, -0.01], 0.018));
    for (let i = 0; i < 6; i++) parts.push(tube("羽状滤食蔓足", soft, [[0.02, 0.26, 0.015], [0.07, 0.29 + i * 0.009, 0.03], [0.06, 0.33 + i * 0.007, 0.05]], 0.0018));
  } else if (kind === 4) {
    parts.push(lobe("大王具足虫头甲", chitin, [0, 0.07, 0.2], [0.17, 0.13, 0.1]));
    for (let i = 0; i < 7; i++) parts.push(lobe("可叠合的横向胸甲节", "#b5bea4", [0, 0.07, 0.14 - i * 0.047], [0.23 - Math.abs(i - 2) * 0.009, 0.145, 0.075]));
    walkingLegs(parts, 7, 0.28, 0.16, 0.05, 0.008); for (const side of [-1, 1]) parts.push(tapered("分节触角", soft, [[side * 0.05, 0.07, 0.22], [side * 0.09, 0.07, 0.31], [side * 0.12, 0.03, 0.35]], [0.008, 0.004, 0.0015]), leaf("宽尾肢", chitin, [side * 0.05, 0.045, -0.17], 0.08, 0.08, [-100, side * 35, 0]));
  } else if (kind === 5) {
    const shield = cap("鲎虫宽圆盾状头甲", chitin, [0, 0.025, 0.018], 0.033, 0.02, 0); shield.scale.z = 1.2; parts.push(shield);
    for (let i = 0; i < 11; i++) parts.push(lobe("逐渐收细的腹节", soft, [0, 0.015, -0.012 - i * 0.004], [0.028 - i * 0.0017, 0.02 - i * 0.0007, 0.007]));
    for (const side of [-1, 1]) { parts.push(tapered("长尾叉丝", soft, [[side * 0.003, 0.012, -0.054], [side * 0.006, 0.01, -0.09], [side * 0.011, 0.005, -0.12]], [0.0018, 0.001, 0.0004])); for (let i = 0; i < 10; i++) parts.push(leaf("盾甲下叶状鳃足", "#c0c9ab", [side * 0.006, 0.01, 0.026 - i * 0.004], 0.004, 0.025, [90, side * 90, 0])); }
  } else if (kind === 6) {
    parts.push(lobe("蝉虾宽扁头胸甲", chitin, [0, 0.07, 0.06], [0.18, 0.11, 0.2]));
    for (const side of [-1, 1]) parts.push(polygon("前方铲状触角板", shell, [[0, 0], [side * 0.08, 0.01], [side * 0.105, 0.085], [side * 0.02, 0.105]], 0.01, [0, 0.06, 0.1]));
    for (let i = 0; i < 5; i++) parts.push(lobe("扁宽后腹节", soft, [0, 0.05, -0.04 - i * 0.027], [0.16 - i * 0.015, 0.075, 0.045])); walkingLegs(parts, 5, 0.13, 0.14, 0.04, 0.006);
    for (const side of [-1, 1]) parts.push(leaf("蝉虾尾扇", shell, [side * 0.02, 0.03, -0.15], 0.065, 0.07, [-100, side * 35, 0]));
  } else if (kind === 7) {
    parts.push(lobe("蝉蟹卵形掘沙背甲", chitin, [0, 0.035, 0], [0.065, 0.055, 0.11]));
    for (const side of [-1, 1]) { for (let i = 0; i < 5; i++) parts.push(leaf("宽扁掘沙桨足", shell, [side * 0.018, 0.019, 0.03 - i * 0.014], 0.018, 0.035, [115, side * 70, 0])); parts.push(tube("弯曲滤食触角轴", soft, [[side * 0.013, 0.04, 0.04], [side * 0.025, 0.075, 0.07], [side * 0.032, 0.075, 0.11]], 0.0018)); for (let i = 0; i < 7; i++) parts.push(needle("触角羽枝", soft, [side * 0.027, 0.075, 0.07 + i * 0.005], [side * 0.045, 0.075, 0.074 + i * 0.005], 0.0012)); }
  } else if (kind === 8) {
    parts.push(lobe("铠甲虾短头胸甲", chitin, [0, 0.08, 0.035], [0.12, 0.1, 0.15]));
    for (let i = 0; i < 6; i++) { const a = i * 0.3; parts.push(lobe("向胸下蜷折的腹甲", soft, [0, 0.065 - Math.sin(a) * 0.045, -0.035 - Math.sin(a) * 0.05], [0.1 - i * 0.008, 0.042, 0.035])); }
    walkingLegs(parts, 4, 0.11, 0.17, 0.055, 0.006);
    for (const side of [-1, 1]) parts.push(tapered("细长前螯臂", chitin, [[side * 0.04, 0.07, 0.07], [side * 0.09, 0.08, 0.18], [side * 0.07, 0.08, 0.29]], [0.009, 0.007, 0.009]), needle("长指螯", shell, [side * 0.07, 0.08, 0.29], [side * 0.065, 0.08, 0.34], 0.014));
  } else {
    const spine: Triple[] = [[0, 0.05, 0.05], [0, 0.07, 0.025], [0, 0.065, -0.01], [0, 0.035, -0.035], [0, 0.015, -0.025], [0, 0.02, 0.005]];
    for (let i = 0; i < spine.length; i++) parts.push(lobe("钩虾侧扁弯曲体节", chitin, spine[i]!, [0.024, 0.032 - i * 0.002, 0.029]));
    for (const side of [-1, 1]) { for (let i = 0; i < 7; i++) parts.push(tapered("向下弯的胸足", soft, [[side * 0.009, 0.06 - i * 0.004, 0.035 - i * 0.009], [side * 0.023, 0.035, 0.025 - i * 0.009], [side * 0.014, 0.005, 0.04 - i * 0.009]], [0.0025, 0.0018, 0.0008])); parts.push(tapered("长感触角", soft, [[side * 0.007, 0.065, 0.06], [side * 0.02, 0.08, 0.09], [side * 0.035, 0.07, 0.12]], [0.002, 0.001, 0.0005])); }
  }
  return parts;
}

function softAnimal(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  if (kind === 0) {
    parts.push(lobe("海猪膨大的半透明囊躯", "#c1cbb3", [0, 0.065, 0], [0.08, 0.085, 0.16]));
    for (const side of [-1, 1]) for (let i = 0; i < 5; i++) parts.push(tapered("支撑海底的粗管足", soft, [[side * 0.025, 0.05, 0.055 - i * 0.027], [side * 0.05, 0.025, 0.055 - i * 0.027], [side * 0.045, 0.005, 0.065 - i * 0.027]], [0.007, 0.006, 0.004]));
    for (const side of [-1, 1]) parts.push(tapered("海猪背部感觉乳突", soft, [[side * 0.018, 0.09, -0.035], [side * 0.03, 0.15, -0.04]], [0.006, 0.0015]));
  } else if (kind === 1) {
    parts.push(lobe("羽星中央杯体", chitin, [0, 0.025, 0], [0.04, 0.035, 0.04]));
    for (let arm = 0; arm < 10; arm++) { const a = arm * Math.PI / 5; const points: Triple[] = [[0, 0.025, 0], [Math.cos(a) * 0.055, 0.055, Math.sin(a) * 0.055], [Math.cos(a) * 0.12, 0.09, Math.sin(a) * 0.12], [Math.cos(a) * 0.17, 0.15, Math.sin(a) * 0.17]]; parts.push(tapered("羽星上卷腕轴", soft, points, [0.005, 0.004, 0.003, 0.001])); const pinnae: ModelPart[] = []; for (const side of [-1, 1]) for (let i = 0; i < 8; i++) { const t = (i + 1) / 9; const p: Triple = [Math.cos(a) * t * 0.17, 0.03 + t * 0.1, Math.sin(a) * t * 0.17]; pinnae.push(needle("成对羽枝", soft, p, [p[0] + Math.cos(a + side * 1.1) * 0.025, p[1] + 0.008, p[2] + Math.sin(a + side * 1.1) * 0.025], 0.002)); } parts.push(combineMeshes("整条羽腕的对生羽枝", soft, pinnae)); }
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; parts.push(tube("附着用的弯曲卷枝", chitin, [[0, 0.02, 0], [Math.cos(a) * 0.025, 0.008, Math.sin(a) * 0.025], [Math.cos(a) * 0.03, 0.002, Math.sin(a) * 0.03]], 0.002)); }
  } else if (kind === 2) {
    parts.push(lobe("铅笔海胆骨壳", "#b2bca0", [0, 0.065, 0], [0.11, 0.1, 0.11]));
    for (let i = 0; i < 25; i++) { const a = i * 2.4; const y = 0.02 + i % 5 * 0.018; const r = Math.sqrt(Math.max(0.0001, 0.05 ** 2 - (y - 0.065) ** 2)); parts.push(tapered("钝端粗铅笔状主棘", shell, [[Math.cos(a) * r, y, Math.sin(a) * r], [Math.cos(a) * (r + 0.045), y + 0.025, Math.sin(a) * (r + 0.045)], [Math.cos(a) * (r + 0.07), y + 0.04, Math.sin(a) * (r + 0.07)]], [0.008, 0.011, 0.008])); }
  } else if (kind === 3) {
    parts.push(polygon("心海胆两侧隆起的心形骨壳", shell, [[0, -0.04], [-0.03, -0.055], [-0.055, -0.03], [-0.055, 0.025], [0, 0.065], [0.055, 0.025], [0.055, -0.03], [0.03, -0.055]], 0.035));
    for (let petal = 0; petal < 5; petal++) for (let i = 0; i < 6; i++) { const a = petal * Math.PI * 2 / 5; const r = 0.015 + i * 0.006; parts.push(lobe("背面凹陷花瓣步带", "#acb69b", [Math.cos(a) * r, 0.036, Math.sin(a) * r], [0.003, 0.002, 0.006], [0, -a * 180 / Math.PI, 0])); }
    for (let i = 0; i < 28; i++) { const a = i * 2.4; const r = 0.015 + i % 4 * 0.012; parts.push(needle("心海胆短细毛棘", soft, [Math.cos(a) * r, 0.025, Math.sin(a) * r], [Math.cos(a) * (r + 0.008), 0.05, Math.sin(a) * (r + 0.008)], 0.0015)); }
  } else if (kind === 4) {
    parts.push(tapered("柱头虫柔软长躯", soft, [[0, 0.015, -0.22], [0.035, 0.02, -0.12], [-0.02, 0.022, -0.01], [0, 0.025, 0.065]], [0.008, 0.012, 0.018, 0.024]), lobe("口周短环状领", "#c5c9ad", [0, 0.026, 0.075], [0.05, 0.045, 0.028]), lobe("独立橡实状前吻", "#cdd0b3", [0, 0.03, 0.12], [0.055, 0.055, 0.08]));
    for (let i = 0; i < 8; i++) for (const side of [-1, 1]) parts.push(needle("两列鳃裂边缘", "#9eae91", [side * 0.01, 0.04, 0.055 - i * 0.01], [side * 0.021, 0.034, 0.052 - i * 0.01], 0.0015));
  } else if (kind === 5) {
    parts.push(lobe("海兔足背肥厚体", soft, [0, 0.035, 0], [0.09, 0.07, 0.2]));
    for (const side of [-1, 1]) parts.push(leaf("海兔向上卷合的侧足翼", "#bac5aa", [side * 0.025, 0.02, -0.035], 0.095, 0.14, [20, side * 30, side * -25]), tapered("兔耳状嗅角", soft, [[side * 0.012, 0.06, 0.07], [side * 0.018, 0.12, 0.075], [side * 0.025, 0.13, 0.09]], [0.006, 0.005, 0.0015]), tapered("前口触角", soft, [[side * 0.012, 0.035, 0.085], [side * 0.035, 0.035, 0.13]], [0.007, 0.002]));
  } else if (kind === 6) {
    const outline: [number, number][] = Array.from({ length: 28 }, (_, i) => { const a = i * Math.PI / 14; const r = 1 + Math.sin(a * 7) * 0.14; return [Math.cos(a) * r * 0.13, Math.sin(a) * r * 0.24]; });
    const mantle = polygon("西班牙舞娘宽阔起伏外套膜", "#bbbc9d", outline, 0.009); parts.push(mantle, lobe("外套膜下的长足", soft, [0, 0.016, 0], [0.16, 0.045, 0.36]));
    for (let i = 0; i < 7; i++) { const a = i * Math.PI * 2 / 7; parts.push(tapered("后背直立的羽状鳃冠", "#d0c8a8", [[Math.cos(a) * 0.025, 0.03, -0.12], [Math.cos(a) * 0.04, 0.09, -0.12 + Math.sin(a) * 0.04]], [0.004, 0.001])); }
    for (const side of [-1, 1]) parts.push(tapered("环纹嗅角", soft, [[side * 0.025, 0.025, 0.16], [side * 0.03, 0.07, 0.19]], [0.005, 0.002]));
  } else if (kind === 7) {
    parts.push(lobe("叶羊海蛞蝓矮长足体", "#bfd0af", [0, 0.009, 0], [0.023, 0.017, 0.05]));
    for (const side of [-1, 1]) for (let row = 0; row < 4; row++) for (let i = 0; i < 3; i++) parts.push(leaf("叶片状膨大背角", "#a7bd95", [side * (0.003 + i * 0.004), 0.009, 0.008 - row * 0.008], 0.007, 0.02 - i * 0.003, [row * 5, 0, side * (15 + i * 15)]));
    for (const side of [-1, 1]) parts.push(tapered("双耳状环纹嗅角", "#bdc6a5", [[side * 0.006, 0.012, 0.02], [side * 0.009, 0.027, 0.025]], [0.003, 0.001])); parts.push(...eyes([0, 0.014, 0.022], 0.005, 0.002));
  } else if (kind === 8) {
    parts.push(lobe("大兜海蛞蝓长足体", soft, [0, 0.03, -0.03], [0.07, 0.055, 0.23]));
    const hood = sweptProfile("捕食用巨大开放兜状口幕", "#cbd0b5", [[0.005, 0], [0.03, 0.02], [0.08, 0.07], [0.075, 0.075], [0.026, 0.025], [0.005, 0.008]], Math.PI * 1.65, 20); hood.rotation.x = 80; hood.position = { x: 0, y: 0.065, z: 0.075 }; parts.push(hood);
    for (const side of [-1, 1]) for (let i = 0; i < 5; i++) parts.push(leaf("体侧可脱落桨状背角", "#bdc8ad", [side * 0.025, 0.04, 0.04 - i * 0.035], 0.04, 0.075 - i * 0.005, [20, side * 60, side * 60]));
    for (let i = 0; i < 12; i++) { const a = i * Math.PI * 2 / 12; parts.push(needle("口幕边缘感觉须", "#c8d0b4", [Math.cos(a) * 0.07, 0.07 + Math.sin(a) * 0.07, 0.12], [Math.cos(a) * 0.085, 0.07 + Math.sin(a) * 0.085, 0.13], 0.002)); }
  } else {
    const conch = whorl("有壳翼足螺透明卷壳", 0.023, 0.03, 2.5); conch.color = "#cad5c1"; conch.opacity = 0.55; parts.push(conch, lobe("有壳翼足螺短躯", soft, [0, 0.035, 0.022], [0.025, 0.022, 0.04]));
    for (const side of [-1, 1]) parts.push(membrane("两枚宽薄游泳翼足", "#c2d2b9", [[side * 0.008, 0.035, 0.02], [side * 0.035, 0.05, 0.04], [side * 0.07, 0.035, 0.025], [side * 0.04, 0.02, 0.005], [side * 0.012, 0.025, 0.005]]));
  }
  return parts;
}

const shells = [["spiderConch", "蜘蛛螺"], ["murex", "骨螺"], ["wentletrap", "天梯螺"], ["sundialShell", "车轮螺"], ["slitShell", "翁戎螺"], ["bubbleSnail", "枣螺"], ["geoduck", "象拔蚌"], ["piddock", "海笋"], ["penShell", "江珧"], ["heartCockle", "鸟蛤"]];
const crustaceans = [["mantisShrimp", "虾蛄"], ["coconutCrab", "椰子蟹"], ["spiderCrab", "蜘蛛蟹"], ["gooseBarnacle", "鹅颈藤壶"], ["giantIsopod", "大王具足虫"], ["tadpoleShrimp", "鲎虫"], ["slipperLobster", "蝉虾"], ["moleCrab", "蝉蟹"], ["squatLobster", "铠甲虾"], ["amphipod", "钩虾"]];
const softAnimals = [["seaPig", "海猪"], ["featherStar", "羽星"], ["pencilUrchin", "铅笔海胆"], ["heartUrchin", "心海胆"], ["acornWorm", "柱头虫"], ["seaHare", "海兔"], ["spanishDancer", "西班牙舞娘海蛞蝓"], ["leafSheep", "叶羊海蛞蝓"], ["hoodedNudibranch", "大兜海蛞蝓"], ["seaButterfly", "有壳翼足螺"]];

export const coastalAnimalDesigns: MasterNatureDesign[] = [
  ...shells.map(([key, name], index) => design(key!, name!, "动物", () => shellAnimal(index), ["独立壳型与软体结构"])),
  ...crustaceans.map(([key, name], index) => design(key!, name!, "动物", () => crustacean(index), ["分节甲壳与专化附肢"])),
  ...softAnimals.map(([key, name], index) => design(key!, name!, "动物", () => softAnimal(index), ["海底独立身体构造"])),
];
