import { beam, cap, combineMeshes, design, eyes, leaf, lobe, needle, polygon, sweptProfile, tapered, tube } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { membrane } from "./animals";

const flesh = "#b3bea3";
const pale = "#cad0b5";
const skeleton = "#c2bca0";

function earlyAnimal(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  if (kind === 0) {
    parts.push(lobe("狄更逊水母扁卵形底体", flesh, [0, 0.013, 0], [0.22, 0.026, 0.36]));
    for (let i = 0; i < 19; i++) { const z = (i - 9) * 0.016; const w = Math.sqrt(Math.max(0, 1 - (z / 0.16) ** 2)) * 0.1; for (const side of [-1, 1]) parts.push(tapered("中线两侧错位的体模块", pale, [[0, 0.023, z + side * 0.003], [side * w * 0.55, 0.024, z + 0.003], [side * w, 0.017, z - 0.006]], [0.003, 0.004, 0.002])); }
  } else if (kind === 1) {
    parts.push(beam("查恩虫中央主轴", skeleton, [0, 0, 0], [0, 0.36, 0], 0.008));
    for (let row = 0; row < 9; row++) for (const side of [-1, 1]) { const y = 0.035 + row * 0.033; const w = 0.11 * (1 - row / 10); const branch = leaf("错位羽状一级分支", flesh, [0, y, 0], 0.024, w, [0, 0, side * -60]); parts.push(branch); const sub: ModelPart[] = []; for (let i = 0; i < 5; i++) sub.push(needle("嵌套的二级分支", pale, [side * w * i / 6, y + i * 0.008, 0.003], [side * w * (i + 0.5) / 6, y + i * 0.008 + 0.02, 0.003], 0.003)); parts.push(combineMeshes("单羽体内重复的细分模块", pale, sub)); }
  } else if (kind === 2) {
    parts.push(cap("三辐涡虫低矮圆盘", flesh, [0, 0, 0], 0.075, 0.025, 0));
    for (let i = 0; i < 3; i++) { const a = i * Math.PI * 2 / 3; const path: Triple[] = Array.from({ length: 9 }, (_, j) => { const t = j / 8; const angle = a + t * 1.3; return [Math.cos(angle) * (0.012 + t * 0.052), 0.024 - t * 0.009, Math.sin(angle) * (0.012 + t * 0.052)]; }); parts.push(tapered("三条相同旋向的主腕", pale, path, path.map((_, i) => 0.006 - i * 0.0005))); }
  } else if (kind === 3) {
    parts.push(lobe("金伯拉虫卵形隆起背体", flesh, [0, 0.026, 0], [0.075, 0.045, 0.14]), lobe("金伯拉虫宽软腹足", pale, [0, 0.008, 0], [0.1, 0.016, 0.17]));
    const margins: ModelPart[] = []; for (const side of [-1, 1]) for (let i = 0; i < 16; i++) margins.push(leaf("外套膜连续波褶边", skeleton, [side * 0.036, 0.014, -0.063 + i * 0.008], 0.008, 0.017, [45, side * 80, side * 20])); parts.push(combineMeshes("带波褶的完整外套膜缘", skeleton, margins));
    parts.push(tapered("前端伸出的短吻", flesh, [[0, 0.02, 0.056], [0, 0.013, 0.105]], [0.014, 0.005]));
  } else if (kind === 4) {
    parts.push(polygon("斯普里格虫马蹄形头盾", skeleton, [[-0.026, 0], [-0.03, 0.035], [-0.015, 0.05], [0.015, 0.05], [0.03, 0.035], [0.026, 0]], 0.012, [0, 0.006, 0.055]));
    for (let i = 0; i < 18; i++) { const w = 0.052 * (1 - i / 21); for (const side of [-1, 1]) parts.push(leaf("后向逐渐收窄的交错体节", flesh, [0, 0.012, 0.064 - i * 0.007], w * 0.8, 0.018, [90, side * 70, 0])); }
  } else if (kind === 5) {
    parts.push(lobe("兰吉虫盘状附着器", skeleton, [0, 0.006, 0], [0.035, 0.012, 0.035]));
    for (let face = 0; face < 3; face++) { const a = face * Math.PI * 2 / 3; parts.push(beam("三面瓣状体轴", skeleton, [0, 0, 0], [0, 0.27, 0], 0.005)); const modules: ModelPart[] = []; for (let row = 0; row < 10; row++) for (const side of [-1, 1]) { const r = 0.065 * Math.sin((row + 1) / 11 * Math.PI); modules.push(needle("三维羽片的对称分枝", flesh, [0, 0.02 + row * 0.024, 0], [Math.cos(a) * side * r, 0.04 + row * 0.024, Math.sin(a) * side * r], 0.011)); } parts.push(combineMeshes("完整的一对三维叶状瓣", flesh, modules)); }
  } else if (kind === 6) {
    const bag = sweptProfile("厄尼埃塔半埋袋形体", flesh, [[0.01, 0], [0.052, 0.025], [0.05, 0.1], [0.041, 0.125], [0.035, 0.125], [0.04, 0.09], [0.041, 0.03], [0.01, 0.01]], Math.PI * 2, 24); bag.scale.z = 0.55; parts.push(bag);
    for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8; parts.push(tapered("袋壁纵向管状模块", pale, [[Math.cos(a) * 0.02, 0.01, Math.sin(a) * 0.012], [Math.cos(a) * 0.05, 0.04, Math.sin(a) * 0.028], [Math.cos(a) * 0.041, 0.125, Math.sin(a) * 0.023]], [0.004, 0.0045, 0.0025])); }
  } else if (kind === 7) {
    parts.push(tapered("游动的奈克虫扁长躯", flesh, [[0, 0.05, -0.095], [0, 0.06, -0.025], [0, 0.065, 0.055]], [0.008, 0.031, 0.018]), ...eyes([0, 0.072, 0.055], 0.024, 0.014));
    for (const side of [-1, 1]) parts.push(membrane("贯穿躯干的侧鳍", pale, [[side * 0.016, 0.06, 0.035], [side * 0.047, 0.065, -0.015], [side * 0.055, 0.05, -0.075], [side * 0.012, 0.05, -0.09]]), tapered("头前一对长触腕", flesh, [[side * 0.01, 0.06, 0.065], [side * 0.025, 0.06, 0.12], [side * 0.04, 0.08, 0.14]], [0.004, 0.0025, 0.001]));
    parts.push(cap("头腹漏斗状喷口", skeleton, [0, 0.04, 0.04], 0.01, 0.026, 3));
  } else if (kind === 8) {
    parts.push(lobe("郁金香形古生物附着盘", skeleton, [0, 0.005, 0], [0.035, 0.01, 0.035]), tapered("长柄状支持体", flesh, [[0, 0, 0], [0.005, 0.1, 0], [0, 0.16, 0]], [0.005, 0.004, 0.006]));
    const cup = cap("郁金香形过滤杯", pale, [0, 0.13, 0], 0.043, 0.09, 3); parts.push(cup);
    for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; parts.push(tapered("杯体六条纵向滤水器", flesh, [[Math.cos(a) * 0.014, 0.145, Math.sin(a) * 0.014], [Math.cos(a) * 0.038, 0.2, Math.sin(a) * 0.038], [Math.cos(a) * 0.04, 0.22, Math.sin(a) * 0.04]], [0.004, 0.004, 0.002])); }
  } else if (kind === 9) {
    parts.push(tapered("蜿蜒虫弯曲柔软躯体", flesh, [[0, 0.03, -0.065], [0.04, 0.05, -0.04], [0.03, 0.085, 0.015], [0, 0.09, 0.045]], [0.009, 0.015, 0.014, 0.01]), tube("腹部可伸缩长柄", skeleton, [[0.03, 0.05, -0.03], [0.08, 0.016, -0.08], [0.06, 0.005, -0.12]], 0.003), lobe("末端附着器", pale, [0.06, 0.005, -0.12], [0.018, 0.01, 0.017]));
    for (const side of [-1, 1]) { parts.push(tapered("口旁分枝长触手", pale, [[side * 0.008, 0.09, 0.045], [side * 0.035, 0.13, 0.065], [side * 0.07, 0.16, 0.08]], [0.0035, 0.003, 0.001])); for (let i = 0; i < 5; i++) parts.push(needle("触手树状侧枝", pale, [side * (0.02 + i * 0.008), 0.11 + i * 0.01, 0.06 + i * 0.004], [side * (0.027 + i * 0.011), 0.13 + i * 0.01, 0.08 + i * 0.005], 0.002)); }
  } else if (kind === 10) {
    parts.push(lobe("古虫坚硬的前部双瓣躯壳", pale, [0, 0.04, 0.04], [0.075, 0.07, 0.11]));
    for (let i = 0; i < 7; i++) parts.push(lobe("后部弯曲分节尾体", flesh, [Math.sin(i * 0.25) * 0.02, 0.025, -0.02 - i * 0.019], [0.035 - i * 0.002, 0.03, 0.025]));
    for (const side of [-1, 1]) for (let i = 0; i < 5; i++) parts.push(cap("前躯两侧鳃孔杯缘", skeleton, [side * 0.029, 0.045, 0.07 - i * 0.018], 0.004, 0.004, 3));
    parts.push(cap("古虫前端大口", flesh, [0, 0.045, 0.094], 0.018, 0.015, 3)); parts.at(-1)!.rotation.x = 90;
  } else {
    parts.push(tapered("塔利怪物纺锤形游泳体", flesh, [[0, 0.045, -0.11], [0, 0.055, -0.035], [0, 0.055, 0.07]], [0.006, 0.03, 0.022]), beam("横跨头部的眼柄杆", skeleton, [-0.07, 0.075, 0.055], [0.07, 0.075, 0.055], 0.009), ...eyes([0, 0.075, 0.055], 0.074, 0.019), tapered("头前长软吻", flesh, [[0, 0.055, 0.075], [0.01, 0.055, 0.15], [0, 0.085, 0.23]], [0.009, 0.006, 0.005]));
    for (const side of [-1, 1]) parts.push(needle("软吻末端成对钳颚", skeleton, [[-0.006, 0.085, 0.23], [0.006, 0.085, 0.23]][side === -1 ? 0 : 1] as Triple, [side * 0.004, 0.095, 0.255], 0.008), leaf("尾端侧鳍", pale, [0, 0.045, -0.07], 0.075, 0.07, [-95, side * 45, 0]));
  }
  return parts;
}

function fossilForm(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  if (kind === 0) {
    const outline: [number, number][] = Array.from({ length: 16 }, (_, i) => [Math.cos(i * Math.PI / 8) * 0.07, Math.sin(i * Math.PI / 8) * 0.07]);
    parts.push(polygon("古杯双层穿孔杯底", skeleton, outline, 0.004, [0, 0, 0], [outline.map(([x, z]) => [x * 0.45, z * 0.45])]));
    for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8; for (const r of [0.025, 0.055]) parts.push(beam("古杯多孔内外壁立肋", skeleton, [Math.cos(a) * r * 0.45, 0, Math.sin(a) * r * 0.45], [Math.cos(a) * r, 0.15, Math.sin(a) * r], 0.006)); parts.push(leaf("连接双层杯壁的径向隔板", "#b7b69b", [Math.cos(a) * 0.018, 0.015, Math.sin(a) * 0.018], 0.035, 0.13, [10, -i * 22.5, 0])); }
    for (let row = 0; row < 5; row++) { const y = 0.025 + row * 0.025; parts.push(sweptProfile("多孔杯壁的横向环肋", skeleton, [[0.053 * (0.45 + y * 3.65), y], [0.057 * (0.45 + y * 3.65), y], [0.057 * (0.45 + y * 3.65), y + 0.004], [0.053 * (0.45 + y * 3.65), y + 0.004]], Math.PI * 2, 16)); }
  } else if (kind === 1) {
    parts.push(sweptProfile("厚壳蛤长锥形下壳", skeleton, [[0.008, 0], [0.03, 0.06], [0.065, 0.22], [0.056, 0.22], [0.023, 0.06], [0.008, 0.01]], Math.PI * 2, 24));
    const lid = cap("不等壳的低扁上盖", "#d0c6aa", [0, 0.23, -0.008], 0.065, 0.016, 2); lid.rotation.x = -20; parts.push(lid);
    for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; parts.push(beam("下壳纵向粗肋", skeleton, [Math.cos(a) * 0.015, 0.015, Math.sin(a) * 0.015], [Math.cos(a) * 0.064, 0.22, Math.sin(a) * 0.064], 0.004)); }
  } else if (kind === 2) {
    parts.push(tapered("箭石长弹头状坚硬喙", skeleton, [[0, 0, 0], [0.005, 0.08, 0], [0, 0.22, 0]], [0.002, 0.019, 0.022]), sweptProfile("箭石前端真锥腔", "#d1c8ab", [[0.022, 0.22], [0.023, 0.26], [0.017, 0.26], [0.012, 0.225]], Math.PI * 2, 20));
    for (const side of [-1, 1]) parts.push(beam("喙部成对纵向沟缘", "#aaa990", [side * 0.007, 0.035, 0.009], [side * 0.013, 0.19, 0.014], 0.0015));
  } else if (kind === 3) {
    parts.push(tapered("笔石双枝群体主茎", skeleton, [[-0.075, 0.008, 0.02], [0, 0.008, 0], [0.075, 0.008, 0.02]], [0.002, 0.003, 0.002]), needle("笔石初房尖端", skeleton, [0, 0.008, 0], [0, 0.008, -0.04], 0.005));
    const teeth: ModelPart[] = []; for (const side of [-1, 1]) for (let i = 0; i < 14; i++) teeth.push(polygon("笔石连续锯齿胞管", skeleton, [[0, 0], [side * 0.004, 0.007], [side * 0.008, 0.002]], 0.004, [side * i * 0.005, 0.007, i * 0.0014])); parts.push(combineMeshes("两支完整锯齿状群体", skeleton, teeth));
  } else if (kind === 4) {
    for (let row = 0; row < 11; row++) { const y = row * 0.012; const w = 0.015 + row * 0.007; parts.push(tube("窗孔苔藓虫扇面横枝", skeleton, [[-w, y, 0], [0, y + 0.007, -0.005], [w, y, 0]], 0.002)); }
    for (let i = -5; i <= 5; i++) parts.push(tube("扇体放射主枝与真实网孔", skeleton, [[i * 0.002, 0, 0], [i * 0.008, 0.06, -0.003], [i * 0.016, 0.13, 0]], 0.002));
  } else if (kind === 5) {
    parts.push(beam("海蕾有柄支持柱", skeleton, [0, 0, 0], [0, 0.13, 0], 0.009), lobe("海蕾卵芽形萼体", skeleton, [0, 0.17, 0], [0.065, 0.085, 0.065]));
    for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5; parts.push(tapered("萼体五条瓣形食物沟", "#a9ad92", [[Math.cos(a) * 0.012, 0.14, Math.sin(a) * 0.012], [Math.cos(a) * 0.03, 0.17, Math.sin(a) * 0.03], [0, 0.21, 0]], [0.002, 0.003, 0.001])); for (let j = 0; j < 6; j++) parts.push(needle("瓣沟两侧细腕", pale, [Math.cos(a) * 0.027, 0.15 + j * 0.007, Math.sin(a) * 0.027], [Math.cos(a + 0.2) * 0.045, 0.16 + j * 0.007, Math.sin(a + 0.2) * 0.045], 0.0015)); }
  } else if (kind === 6) {
    parts.push(polygon("牙形石锯片状基台", skeleton, [[-0.07, -0.012], [0.055, -0.012], [0.08, 0.01], [0.025, 0.025], [-0.07, 0.014]], 0.005));
    for (let i = 0; i < 15; i++) parts.push(needle("牙形石分化齿尖", pale, [-0.065 + i * 0.008, 0.005, 0], [-0.065 + i * 0.008, 0.016 + Math.sin(i / 14 * Math.PI) * 0.023, -0.001], 0.005));
  } else {
    parts.push(sweptProfile("四射珊瑚角形杯壁", skeleton, [[0.005, 0], [0.018, 0.035], [0.06, 0.13], [0.053, 0.13], [0.013, 0.04], [0.005, 0.005]], Math.PI * 2, 24));
    for (let i = 0; i < 24; i++) { const a = i * Math.PI / 12; parts.push(polygon("珊瑚杯内放射纵隔壁", "#cfc6a9", [[0.008, 0], [0.052, 0.07], [0.015, 0.025]], 0.002, [0, 0.057, 0])); const wall = parts.at(-1)!; wall.rotation = { x: -90, y: 0, z: a * 180 / Math.PI }; }
  }
  return parts;
}

function extinctPlant(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  if (kind === 0) {
    parts.push(tapered("库克逊蕨无叶主轴", "#a5b293", [[0, 0, 0], [0, 0.09, 0], [-0.015, 0.14, 0]], [0.004, 0.003, 0.002]));
    const forks: Triple[] = [[-0.04, 0.2, 0], [0.025, 0.2, 0], [0.05, 0.16, 0.02], [-0.02, 0.17, 0.035]];
    forks.forEach((end, i) => { parts.push(beam("二叉分枝的裸轴", flesh, i < 2 ? [-0.015, 0.14, 0] : [0, 0.09, 0], end, 0.003), lobe("轴端膨大孢子囊", pale, end, [0.015, 0.01, 0.013])); });
  } else if (kind === 1) {
    parts.push(tube("工蕨匍匐根状裸轴", "#a4ae91", [[-0.07, 0, 0], [0, 0.005, 0], [0.07, 0.003, 0]], 0.003));
    for (const x of [-0.04, 0.025]) { parts.push(tapered("工蕨弯举无叶孢子枝", flesh, [[x, 0, 0], [x, 0.08, 0], [x + 0.018, 0.18, 0.01]], [0.004, 0.003, 0.0015])); for (let i = 0; i < 7; i++) { const side = i % 2 ? -1 : 1; parts.push(beam("侧生孢子囊短柄", flesh, [x + 0.008, 0.09 + i * 0.012, 0.006], [x + side * 0.016, 0.094 + i * 0.012, 0.006], 0.0018), lobe("肾形侧生孢子囊", pale, [x + side * 0.016, 0.095 + i * 0.012, 0.006], [0.014, 0.01, 0.006])); } }
  } else if (kind === 2) {
    parts.push(beam("封印木直立柱干", "#a1aa8d", [0, 0, 0], [0, 2.2, 0], 0.23));
    const scars: ModelPart[] = []; for (let row = 0; row < 12; row++) for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; scars.push(lobe("沿纵沟排列的叶痕垫", "#bdc1a0", [Math.cos(a) * 0.117, 0.14 + row * 0.15, Math.sin(a) * 0.117], [0.032, 0.05, 0.012], [0, -i * 45 + 90, 0])); } for (let i = 0; i < scars.length; i += 32) parts.push(combineMeshes("同一树干连续叶痕列", "#bdc1a0", scars.slice(i, i + 32)));
    for (let i = 0; i < 20; i++) { const a = i * Math.PI / 10; parts.push(leaf("单束披针形冠叶", flesh, [0, 2.12, 0], 0.035, 0.82, [35 + i % 3 * 20, i * 18, 0])); } parts.push(tapered("根部分叉支持轴", "#a1aa8d", [[-0.4, 0, 0], [0, 0.07, 0], [0.38, 0, 0]], [0.07, 0.13, 0.05]));
  } else if (kind === 3) {
    parts.push(tapered("种子蕨木质短主干", "#a3ab8e", [[0, 0, 0], [0.035, 0.5, 0], [0, 0.95, 0]], [0.09, 0.06, 0.025]));
    for (let branch = 0; branch < 6; branch++) { const a = branch * Math.PI / 3; const end: Triple = [Math.cos(a) * 0.55, 0.5 + branch * 0.1, Math.sin(a) * 0.55]; parts.push(beam("粗大的羽状复叶轴", flesh, [0, 0.2 + branch * 0.1, 0], end, 0.012)); const leaves: ModelPart[] = []; for (let row = 0; row < 7; row++) for (const side of [-1, 1]) { const t = (row + 1) / 8; leaves.push(leaf("种子蕨对生椭圆羽片", flesh, [end[0] * t, 0.2 + branch * 0.1 + (end[1] - 0.2 - branch * 0.1) * t, end[2] * t], 0.045, 0.13 * (1 - t * 0.5), [55, -branch * 60 + side * 70, 0])); } parts.push(combineMeshes("一片完整羽状种子蕨叶", flesh, leaves), lobe("叶基着生的裸露大种子", skeleton, [end[0] * 0.8, end[1] - 0.09, end[2] * 0.8], [0.045, 0.06, 0.045])); }
  } else {
    parts.push(tapered("舌羊齿短木质主轴", "#a8af91", [[0, 0, 0], [0, 0.55, 0], [0.08, 0.85, 0]], [0.045, 0.03, 0.012]));
    for (let i = 0; i < 12; i++) { const a = i * 137.5 % 360; const blade = leaf("舌羊齿整缘舌状大叶", flesh, [0, 0.08 + i * 0.055, 0], 0.085, 0.32, [52, a, 0]); parts.push(blade); }
    for (const side of [-1, 1]) parts.push(leaf("舌羊齿叶状托种器", "#b9bea0", [0, 0.5, 0], 0.05, 0.13, [75, side * 80, 0]), lobe("托种器内独立胚珠", skeleton, [side * 0.07, 0.52, 0], [0.016, 0.024, 0.018]));
  }
  return parts;
}

function reptile(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  const body = kind === 0 ? [0.6, 0.13, 0.5] : kind === 1 ? [0.075, 0.085, 0.2] : kind === 2 ? [0.08, 0.09, 0.22] : kind === 3 ? [0.45, 0.32, 1.0] : [0.32, 0.27, 1.0];
  const y = kind === 3 ? 0.45 : kind === 4 ? 0.25 : kind === 0 ? 0.1 : 0.13;
  parts.push(lobe("古爬行类完整躯干", flesh, [0, y, 0], body as Triple));
  if (kind === 0) {
    parts.push(polygon("独齿龙宽矩形甲壳", skeleton, [[-0.25, -0.25], [-0.32, -0.14], [-0.32, 0.17], [-0.24, 0.25], [0.24, 0.25], [0.32, 0.17], [0.32, -0.14], [0.25, -0.25]], 0.045, [0, 0.13, 0]), tapered("甲壳前方的短粗颈", flesh, [[0, 0.1, 0.2], [0, 0.1, 0.32]], [0.055, 0.04]), lobe("独齿龙扁宽方吻头", pale, [0, 0.1, 0.37], [0.17, 0.085, 0.16]), ...eyes([0, 0.13, 0.38], 0.06, 0.021), tapered("短而尖的尾", flesh, [[0, 0.09, -0.2], [0, 0.07, -0.4]], [0.035, 0.003]));
    for (let row = 0; row < 4; row++) for (let column = 0; column < 5; column++) parts.push(lobe("嵌合成矩形甲壳的骨板", pale, [(column - 2) * 0.105, 0.177, (row - 1.5) * 0.105], [0.117, 0.013, 0.117]));
  } else if (kind === 1) {
    parts.push(lobe("长鳞龙短吻头", pale, [0, 0.18, 0.12], [0.045, 0.05, 0.075]), tapered("长鳞龙长平衡尾", flesh, [[0, y, -0.08], [0, y, -0.23], [0, y * 0.8, -0.35]], [0.013, 0.006, 0.001]));
    for (let i = 0; i < 7; i++) { const z = 0.07 - i * 0.022; const h = 0.27 + Math.sin(i / 6 * Math.PI) * 0.08; parts.push(polygon("背部高耸的长带状鳞片", pale, [[-0.009, 0], [-0.018, h * 0.65], [-0.008, h], [0.009, h * 1.04], [0.018, h * 0.65], [0.009, 0]], 0.003, [0, 0.16, z])); const plume = parts.at(-1)!; plume.rotation.x = -90; }
  } else if (kind === 2) {
    parts.push(lobe("沙洛维龙尖小头", pale, [0, 0.17, 0.13], [0.045, 0.045, 0.075]), tapered("滑翔龙细长尾", flesh, [[0, y, -0.09], [0, 0.1, -0.28], [0, 0.08, -0.42]], [0.012, 0.006, 0.001]));
    for (const side of [-1, 1]) parts.push(membrane("后肢与尾基连接的宽阔主翼膜", pale, [[0, 0.13, -0.035], [side * 0.035, 0.14, 0.005], [side * 0.18, 0.12, -0.09], [side * 0.21, 0.08, -0.18], [0, 0.09, -0.26]]));
  } else if (kind === 3) {
    parts.push(tapered("长颈龙僵直延长颈椎轴", flesh, [[0, 0.5, 0.35], [0, 0.65, 1.25], [0, 0.75, 2.2]], [0.1, 0.07, 0.04]), lobe("长颈龙小型尖头", pale, [0, 0.76, 2.32], [0.13, 0.12, 0.32]), tapered("长颈龙水平长尾", flesh, [[0, y, -0.4], [0, 0.3, -1.3], [0, 0.2, -2.0]], [0.13, 0.065, 0.006]));
  } else {
    parts.push(tapered("滤齿龙细长上举颈", flesh, [[0, y, 0.3], [0, 0.35, 0.65], [0, 0.4, 0.8]], [0.085, 0.06, 0.04]), lobe("滤齿龙横向锤形口鼻", pale, [0, 0.4, 0.94], [0.5, 0.1, 0.12]), tapered("滤齿龙游泳尾", flesh, [[0, y, -0.4], [0, 0.22, -0.85], [0, 0.15, -1.15]], [0.08, 0.055, 0.004]));
    for (const side of [-1, 1]) for (let i = 0; i < 10; i++) parts.push(needle("锤形口前缘梳状齿", skeleton, [side * (0.025 + i * 0.02), 0.4, 0.99], [side * (0.025 + i * 0.02), 0.36, 1.01], 0.007));
  }
  for (const side of [-1, 1]) for (const end of [-1, 1]) {
    const spread = kind === 3 ? 0.5 : kind === 4 ? 0.4 : kind === 0 ? 0.4 : 0.09; const z = end * body[2]! * 0.35;
    const start: Triple = [side * body[0]! * 0.3, y, z]; const foot: Triple = [side * spread, 0.02, z + end * spread * 0.3];
    parts.push(tapered("四肢分节支撑", flesh, [start, [side * spread * 0.85, y * 0.6, z - 0.02], foot], [body[0]! * 0.08, body[0]! * 0.055, body[0]! * 0.03]));
    for (let i = 0; i < 3; i++) parts.push(needle("爬行类张开的趾", skeleton, foot, [foot[0] + (i - 1) * body[0]! * 0.08, 0.006, foot[2] + body[0]! * 0.15], body[0]! * 0.025));
  }
  return parts;
}

const earlyNames = [["dickinsonia", "狄更逊水母"], ["charnia", "查恩虫"], ["tribrachidium", "三辐涡虫"], ["kimberella", "金伯拉虫"], ["spriggina", "斯普里格虫"], ["rangea", "兰吉虫"], ["ernietta", "厄尼埃塔"], ["nectocaris", "奈克虫"], ["siphusauctum", "郁金香形古生物"], ["herpetogaster", "蜿蜒虫"], ["vetulicola", "古虫"], ["tullimonstrum", "塔利怪物"]];
const fossils = [["archaeocyath", "古杯"], ["rudist", "厚壳蛤"], ["belemniteRostrum", "箭石喙"], ["graptolite", "笔石"], ["fenestella", "窗孔苔藓虫"], ["pentremites", "海蕾"], ["conodont", "牙形石"], ["rugoseCoral", "四射珊瑚"]];
const plants = [["cooksonia", "库克逊蕨"], ["zosterophyllum", "工蕨"], ["sigillaria", "封印木"], ["seedFern", "种子蕨"], ["glossopteris", "舌羊齿"]];
const reptiles = [["henodus", "独齿龙（Henodus）"], ["longisquama", "长鳞龙"], ["sharovipteryx", "沙洛维龙"], ["tanystropheus", "长颈龙"], ["atopodentatus", "滤齿龙"]];

export const earlyLifeDesigns: MasterNatureDesign[] = [
  ...earlyNames.map(([key, name], index) => design(key!, name!, "动物", () => earlyAnimal(index), ["早期生命形态复原"])),
  ...fossils.map(([key, name], index) => design(key!, name!, "器物", () => fossilForm(index), ["古生物硬组织与群体构造"])),
  ...plants.map(([key, name], index) => design(key!, name!, "植物", () => extinctPlant(index), ["古植物独立构造"])),
  ...reptiles.map(([key, name], index) => design(key!, name!, "动物", () => reptile(index), ["古脊椎动物形态复原", ...(key === "henodus" ? ["Henodus chelyops"] : [])])),
];
