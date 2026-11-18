import { Euler, Quaternion, Vector3 } from "three";
import { cap, combineMeshes, design, leaf, lobe, needle, polygon, sweptProfile, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { pointed } from "./insectForms";
import { hollowPipe, strip } from "./shapedFoods";
import { membrane } from "./animals";

const tissue = "#b9b19c";
const lining = "#c9bea5";
const cartilage = "#c9cbb1";
const vessel = "#a28f83";
const dark = "#8e9d8c";

function pipe(name: string, path: Triple[], outer: number, inner: number, color = tissue): ModelPart { const p = hollowPipe(name, path, outer, inner); p.color = color; return p; }

function feeding(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  if (kind === 0) {
    for (let row = 0; row < 4; row++) {
      const path: Triple[] = Array.from({ length: 13 }, (_, i) => { const a = i / 12 * Math.PI * 0.85; return [Math.cos(a) * 0.043, 0.046 + Math.sin(a) * 0.041, (row - 1.5) * 0.013]; }); parts.push(tapered("鱼鳃成组的弓形鳃弓", cartilage, path, path.map(() => 0.003)));
      const filaments: ModelPart[] = []; for (let i = 1; i < 12; i++) for (const side of [-1, 1]) { const a = i / 12 * Math.PI * 0.85, p = path[i]!, length = 0.015 + Math.sin(a) * 0.012; filaments.push(leaf("鳃弓上的两排独立鳃丝", lining, p, 0.004, length, [side * 18, side * 90, a * 180 / Math.PI - 90])); } parts.push(combineMeshes("一条鳃弓上的双列鳃丝", lining, filaments));
    }
  } else if (kind === 1) {
    for (const upper of [false, true]) {
      const path: Triple[] = Array.from({ length: 17 }, (_, i) => { const a = i / 16 * Math.PI; return [Math.cos(a) * 0.15, upper ? 0.145 + Math.sin(a) * 0.026 : 0.028 + Math.sin(a) * 0.023, Math.sin(a) * 0.115]; }); parts.push(tapered(upper ? "鲨鱼上颌软骨弓" : "鲨鱼下颌软骨弓", cartilage, path, path.map(() => 0.013)));
      const teeth: ModelPart[] = []; for (let row = 0; row < 3; row++) for (let i = 1; i < 12; i++) { const a = i / 12 * Math.PI, r = 0.139 - row * 0.009, y = upper ? 0.137 + Math.sin(a) * 0.026 : 0.036 + Math.sin(a) * 0.023, height = 0.027 - row * 0.004; teeth.push(needle("与颌弓相连的三列替换齿", lining, [Math.cos(a) * r, y, Math.sin(a) * (0.112 - row * 0.008)], [Math.cos(a) * r, y + (upper ? -height : height), Math.sin(a) * (0.119 - row * 0.008)], 0.018 - row * 0.003)); } parts.push(combineMeshes(upper ? "上颌连续齿列" : "下颌连续齿列", lining, teeth));
    }
    for (const side of [-1, 1]) parts.push(lobe("上下颌两侧的关节端", tissue, [side * 0.15, 0.088, 0], [0.03, 0.135, 0.03]));
  } else if (kind === 2) {
    const upper = polygon("头足类上喙长钩与两侧翼片", dark, [[-0.018, -0.014], [-0.016, 0.016], [-0.005, 0.04], [0, 0.048], [0.006, 0.039], [0.007, 0.018], [0.019, -0.012]], 0.006, [0, 0.016, 0]); upper.rotation.x = -28; parts.push(upper);
    const lower = polygon("头足类下喙与上喙相互嵌合的短钩", tissue, [[-0.021, -0.018], [-0.019, 0.016], [-0.007, 0.031], [0, 0.037], [0.009, 0.029], [0.02, 0.012], [0.021, -0.018]], 0.006, [0, 0.004, 0]); lower.rotation.x = 14; parts.push(lower);
    for (const side of [-1, 1]) parts.push(leaf("喙两侧展开的角质翼壁", dark, [side * 0.014, 0.014, -0.007], 0.025, 0.034, [25, -side * 90, -side * 55]));
  } else if (kind === 3) {
    for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5, x = Math.cos(a), z = Math.sin(a), frame = polygon("海胆咀嚼灯的一枚钙质锥体", cartilage, [[-0.009, 0], [0.009, 0], [0.013, 0.043], [0.007, 0.052], [-0.007, 0.052], [-0.013, 0.043]], 0.006); frame.rotation = { x: -90, y: 0, z: -a * 180 / Math.PI - 90 }; frame.position = { x: x * 0.018, y: 0.012, z: z * 0.018 }; parts.push(frame, pointed("五枚沿灯架向中央汇合的长齿", lining, [[x * 0.023, 0.05, z * 0.023], [x * 0.013, 0.017, z * 0.013], [x * 0.003, 0.001, z * 0.003]], [0.004, 0.003, 0])); }
    parts.push(sweptProfile("咀嚼灯上缘相连的骨质环带", cartilage, [[0.027, 0.045], [0.03, 0.045], [0.03, 0.049], [0.027, 0.049]], Math.PI * 2, 20));
  } else if (kind === 4) {
    parts.push(lobe("反刍胃最大的瘤胃囊", tissue, [-0.25, 0.28, -0.07], [0.67, 0.62, 0.75]), lobe("前部网胃囊", lining, [-0.11, 0.3, 0.36], [0.32, 0.31, 0.28]), lobe("右侧近球形瓣胃", tissue, [0.26, 0.34, 0.2], [0.33, 0.4, 0.35]), tapered("下方弯曲延伸的皱胃", lining, [[-0.16, 0.1, 0.26], [0.06, 0.1, 0.36], [0.32, 0.15, 0.32], [0.4, 0.25, 0.17]], [0.09, 0.11, 0.09, 0.045]), pipe("食管连接瘤胃与网胃交界", [[-0.12, 0.4, 0.25], [-0.08, 0.62, 0.23]], 0.035, 0.024), pipe("皱胃出口幽门管", [[0.39, 0.24, 0.17], [0.45, 0.31, 0.13]], 0.039, 0.025));
    for (let i = 0; i < 6; i++) parts.push(strip("瘤胃外侧相连的纵向肌柱与沟", dark, [[-0.46 + i * 0.08, 0.4, 0.19], [-0.48 + i * 0.085, 0.3, 0.25], [-0.44 + i * 0.075, 0.16, 0.2]], 0.009, 0.006));
  } else if (kind === 5) {
    parts.push(pipe("鸟类气管在肺前分叉的共同干", [[0, 0.23, 0.08], [0, 0.14, 0.01]], 0.005, 0.0035));
    for (const side of [-1, 1]) { parts.push(lobe("体积较小且相对刚性的鸟肺", tissue, [side * 0.033, 0.13, 0], [0.042, 0.1, 0.055]), pipe("通入每侧肺的主支气管", [[0, 0.143, 0.01], [side * 0.026, 0.14, 0.008], [side * 0.033, 0.11, -0.027]], 0.004, 0.0027));
      for (const [y, z, sy, sz] of [[0.2, 0.025, 0.07, 0.045], [0.145, 0.06, 0.06, 0.06], [0.08, -0.028, 0.07, 0.07], [0.025, -0.07, 0.11, 0.07]]) { const sac = lobe("与肺有实际导管相连的成对气囊", lining, [side * 0.044, y!, z!], [0.048, sy!, sz!]); sac.opacity = 0.3; parts.push(sac, tapered("肺到薄壁气囊的连通道", cartilage, [[side * 0.033, 0.13, 0], [side * 0.04, y!, z!]], [0.004, 0.004])); }
    }
    const sac = lobe("前端不成对的锁骨间气囊", lining, [0, 0.18, 0.045], [0.07, 0.045, 0.05]); sac.opacity = 0.3; parts.push(sac);
  } else if (kind === 6) {
    parts.push(pipe("鸟鸣管上方有软骨环的气管干", [[0, 0.07, 0], [0, 0.032, 0]], 0.007, 0.0047));
    for (const side of [-1, 1]) { parts.push(pipe("鸣管向两肺分开的真正支气管腔", [[0, 0.033, 0], [side * 0.014, 0.018, 0], [side * 0.022, 0.004, 0]], 0.006, 0.0038), lobe("每侧外壁附着的鸣肌", tissue, [side * 0.009, 0.033, 0], [0.012, 0.027, 0.015]), membrane("支气管根部独立的发声膜", lining, [[side * 0.003, 0.03, -0.003], [side * 0.008, 0.023, -0.003], [side * 0.008, 0.023, 0.003], [side * 0.003, 0.03, 0.003]])); }
    for (let i = 0; i < 5; i++) { const ring = sweptProfile("气管外壁间隔的软骨环", cartilage, [[0.0064, 0], [0.008, 0], [0.008, 0.002], [0.0064, 0.002]], Math.PI * 2, 16); ring.position.y = 0.039 + i * 0.006; parts.push(ring); }
  } else {
    parts.push(tapered("蛇舌基部到分叉处的扁肌肉束", tissue, [[0, 0.003, -0.025], [0, 0.003, 0.008]], [0.003, 0.002]));
    for (const side of [-1, 1]) parts.push(pointed("两条真正分离的细长舌尖", lining, [[0, 0.003, 0.006], [side * 0.006, 0.003, 0.021], [side * 0.009, 0.004, 0.035]], [0.0018, 0.001, 0]));
    for (const p of parts) p.scale.y = 0.4;
  }
  return parts;
}

function insectOrgan(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  if (kind === 0) {
    parts.push(lobe("复眼内部连续的半球状基体", dark, [0, 0.003, 0], [0.009, 0.006, 0.009]));
    const facets: ModelPart[] = [];
    for (let i = 0; i < 37; i++) { const a = i * 2.4, r = Math.sqrt((i + 0.3) / 39) * 0.004, y = Math.sqrt(0.0043 ** 2 - r * r), root: Triple = [Math.cos(a) * r, 0.001 + y, Math.sin(a) * r], normal = new Vector3(root[0], y, root[2]).normalize(), q = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), normal), e = new Euler().setFromQuaternion(q); const tile = polygon("复眼表面独立的角膜小眼面", lining, Array.from({ length: 6 }, (_, j) => [Math.cos(j * Math.PI / 3) * 0.00052, Math.sin(j * Math.PI / 3) * 0.00052]), 0.00018, root); tile.rotation = { x: e.x * 180 / Math.PI, y: e.y * 180 / Math.PI, z: e.z * 180 / Math.PI }; facets.push(tile); }
    parts.push(combineMeshes("有真实分面边界的复眼角膜", lining, facets));
  } else if (kind === 1) {
    parts.push(membrane("蜻蜓独立膜翅的连续前后薄面", lining, [[0, 0.001, 0], [0.007, 0.001, 0.005], [0.017, 0.001, 0.036], [0.011, 0.001, 0.055], [0.005, 0.001, 0.052], [0, 0.001, 0.015]]));
    const veins: ModelPart[] = []; for (let i = 0; i < 4; i++) veins.push(pointed("从翅根分出的长纵脉", dark, [[0.001, 0.00115, 0.002], [0.003 + i * 0.003, 0.00115, 0.028], [0.005 + i * 0.002, 0.00115, 0.051]], [0.0002, 0.00018, 0]));
    for (let row = 0; row < 12; row++) { const z = 0.008 + row * 0.0035, width = Math.min(0.014, 0.004 + z * 0.24); veins.push(needle("长纵脉之间真正相接的短横脉", dark, [0.0016 + z * 0.055, 0.00115, z], [width, 0.00115, z + 0.0015], 0.00022)); } parts.push(combineMeshes("膜面相连的分枝翅脉网络", dark, veins), polygon("前缘远端的翅痣", dark, [[0.01, 0.043], [0.013, 0.044], [0.012, 0.048], [0.009, 0.047]], 0.00025, [0, 0.001, 0]));
  } else if (kind === 2) {
    const labrum = polygon("咀嚼口器上方宽大的上唇", cartilage, [[-0.003, -0.002], [0.003, -0.002], [0.004, 0.002], [0.002, 0.004], [-0.002, 0.004], [-0.004, 0.002]], 0.001, [0, 0.002, 0.005]); parts.push(labrum);
    for (const side of [-1, 1]) { parts.push(polygon("一对相向咬合的齿状上颚", tissue, [[side * 0.001, -0.001], [side * 0.004, 0], [side * 0.007, 0.004], [side * 0.006, 0.007], [side * 0.002, 0.008], [side * 0.0028, 0.005], [side * 0.0012, 0.004], [side * 0.002, 0.002]], 0.0014, [0, 0.003, 0]), tapered("下颚的分节触须", lining, [[side * 0.004, 0.002, 0.001], [side * 0.008, 0.003, -0.001], [side * 0.01, 0.005, 0.003]], [0.00065, 0.0005, 0.00035]), leaf("下颚内侧的齿叶", cartilage, [side * 0.003, 0.002, 0], 0.0025, 0.005, [75, -side * 20, 0])); }
    parts.push(polygon("下唇及中央舌状片", lining, [[-0.003, -0.004], [0.003, -0.004], [0.004, 0], [0.002, 0.004], [-0.002, 0.004], [-0.004, 0]], 0.0012));
  } else {
    const path: Triple[] = [[0, 0.008, -0.009], [0, 0.009, -0.002]]; for (let i = 0; i < 26; i++) { const a = i / 25 * Math.PI * 4.5, r = 0.0062 - i * 0.00018; path.push([Math.cos(a) * r, 0.009 + Math.sin(a) * r, 0.003]); }
    for (const side of [-1, 1]) { const p = hollowPipe("蝴蝶虹吸口器围成同一食物管道的半管", path, 0.00035, 0.00019, Math.PI, side < 0 ? 0 : Math.PI); p.color = side < 0 ? tissue : lining; parts.push(p); }
  }
  return parts;
}

function reproductive(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  if (kind === 0) {
    const uterus = polygon("子宫冠状面肌壁及真实宫腔", tissue, [[-0.012, 0], [0.012, 0], [0.012, 0.026], [0.028, 0.055], [0.028, 0.07], [0.015, 0.08], [-0.015, 0.08], [-0.028, 0.07], [-0.028, 0.055], [-0.012, 0.026]], 0.018, [0, 0, 0], [[[-0.018, 0.064], [0.018, 0.064], [0.006, 0.037], [-0.006, 0.037]]]); uterus.rotation.x = -90; parts.push(uterus, pipe("子宫颈中央的实际通道", [[0, 0.002, -0.009], [0, 0.038, -0.009]], 0.006, 0.003, lining));
    for (const side of [-1, 1]) { parts.push(pipe("从子宫角弯出的输卵管", [[side * 0.023, 0.066, -0.009], [side * 0.04, 0.075, -0.009], [side * 0.052, 0.062, -0.007]], 0.0025, 0.0013)); for (let i = 0; i < 5; i++) parts.push(leaf("输卵管远端分离的伞缘", lining, [side * 0.052, 0.063, -0.007], 0.003, 0.009, [110, i * 72, side * 25])); }
  } else if (kind === 1) {
    const body = lobe("卵巢薄的椭圆结缔组织包络", tissue, [0, 0.01, 0], [0.034, 0.022, 0.018]); body.opacity = 0.42; parts.push(body);
    for (let i = 0; i < 11; i++) { const a = i * 2.4, r = 0.002 + i % 4 * 0.0008; const follicle = cap("皮质内大小不同但非新增状态素材的卵泡", lining, [Math.cos(a) * 0.01, 0.011, Math.sin(a) * 0.004], r, r * 1.7, 3); parts.push(follicle); }
    parts.push(tapered("卵巢门进入的短血管柄", vessel, [[0.009, 0.009, 0], [0.022, 0.008, 0]], [0.0015, 0.001]));
  } else if (kind === 2) {
    const body = lobe("睾丸白膜的椭圆包络", lining, [0, 0.025, 0], [0.031, 0.049, 0.027]); body.opacity = 0.3; parts.push(body);
    for (let section = 0; section < 7; section++) { const a = section * Math.PI * 2 / 7, path: Triple[] = Array.from({ length: 23 }, (_, i) => [Math.cos(a) * 0.006 + Math.sin(i * 1.8) * 0.002, 0.008 + i * 0.0015, Math.sin(a) * 0.006 + Math.cos(i * 1.8) * 0.002]); parts.push(tapered("各小叶内弯曲盘绕的曲细精管", tissue, path, path.map(() => 0.0007))); }
    const path: Triple[] = Array.from({ length: 29 }, (_, i) => [0.014 + Math.sin(i * 2.1) * 0.0025, 0.046 - i * 0.0014, 0.001 + Math.cos(i * 2.1) * 0.002]); parts.push(tapered("贴在睾丸后缘的附睾长曲管", dark, path, path.map(() => 0.0012)), pipe("附睾尾连续上行的输精管", [[0.014, 0.007, 0], [0.02, 0.012, 0.005], [0.021, 0.06, 0.004]], 0.0015, 0.0008));
  } else if (kind === 3) {
    const gland = sweptProfile("前列腺围绕尿道的实体腺体与贯通腔", tissue, [[0.003, 0], [0.012, 0], [0.019, 0.015], [0.016, 0.028], [0.003, 0.03]], Math.PI * 2, 24); gland.scale.z = 0.78; parts.push(gland);
    for (const side of [-1, 1]) parts.push(pipe("从后上方斜行入腺的射精管", [[side * 0.007, 0.028, -0.012], [side * 0.004, 0.017, -0.004], [side * 0.001, 0.01, 0]], 0.0013, 0.0007, lining));
    parts.push(pipe("上下贯穿腺体的前列腺部尿道", [[0, -0.005, 0], [0, 0.037, 0]], 0.0029, 0.002, cartilage));
  } else {
    const plate = lobe("胎盘扁圆的绒毛组织盘", tissue, [0, 0.015, 0], [0.2, 0.033, 0.18]); parts.push(plate);
    const cotyledons: ModelPart[] = []; for (let i = 0; i < 16; i++) { const a = i * 2.4, r = Math.sqrt((i + 0.5) / 17) * 0.071; cotyledons.push(lobe("母体面的独立胎盘小叶", lining, [Math.cos(a) * r, 0.005, Math.sin(a) * r * 0.9], [0.034, 0.014, 0.033])); } parts.push(combineMeshes("母体面的分叶盘面", lining, cotyledons));
    for (let i = 0; i < 3; i++) { const a = i * Math.PI * 2 / 3, path: Triple[] = Array.from({ length: 29 }, (_, row) => { const t = row / 28, angle = a + t * Math.PI * 5; return [Math.cos(angle) * 0.003 + t * 0.045, 0.026 + t * 0.22, Math.sin(angle) * 0.003]; }); parts.push(tapered(i ? "脐带内相绕的脐动脉" : "脐带内相绕的脐静脉", i ? vessel : cartilage, path, path.map(() => i ? 0.0017 : 0.0022))); }
    const branches: ModelPart[] = []; for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; branches.push(pointed("胎儿面从脐带插入处分出的血管", vessel, [[0, 0.028, 0], [Math.cos(a) * 0.035, 0.028, Math.sin(a) * 0.03], [Math.cos(a) * 0.075, 0.021, Math.sin(a) * 0.065]], [0.0015, 0.0011, 0])); } parts.push(combineMeshes("胎盘胎儿面真实放射血管", vessel, branches));
  }
  return parts;
}

function connective(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  if (kind === 0) {
    for (let layer = 0; layer < 5; layer++) { const r = 0.012 + layer * 0.0022, band = sweptProfile("椎间盘纤维环的同心承重层", cartilage, [[r, 0], [r + 0.0016, 0], [r + 0.0016, 0.011], [r, 0.011]], Math.PI * 2, 24); band.scale.z = 0.78; band.opacity = 0.55 + layer * 0.06; parts.push(band); }
    parts.push(lobe("纤维环内部真正独立的髓核", lining, [0, 0.0055, 0], [0.024, 0.01, 0.018]));
  } else if (kind === 1) {
    const meniscus = sweptProfile("半月板内缘薄外缘厚的C形楔状软骨", cartilage, [[0.016, 0], [0.028, 0], [0.028, 0.008], [0.023, 0.006], [0.016, 0.0015]], Math.PI * 1.63, 28); meniscus.scale.z = 1.2; parts.push(meniscus);
    for (const a of [0, Math.PI * 1.63]) parts.push(pointed("半月板两端短角附着束", lining, [[Math.cos(a) * 0.02, 0.002, Math.sin(a) * 0.024], [Math.cos(a) * 0.013, 0.001, Math.sin(a) * 0.016]], [0.003, 0]));
  } else {
    parts.push(pointed("脊髓主体及末端逐渐收细的脊髓圆锥", lining, [[0, 0.47, 0], [0, 0.37, 0], [0, 0.18, 0], [0, 0.08, 0], [0, 0.055, 0]], [0.005, 0.006, 0.005, 0.004, 0]), lobe("颈部膨大", tissue, [0, 0.385, 0], [0.014, 0.07, 0.014]), lobe("腰骶部膨大", tissue, [0, 0.14, 0], [0.013, 0.07, 0.013]));
    const roots: ModelPart[] = [];
    for (const side of [-1, 1]) for (let i = 0; i < 31; i++) { const y = 0.455 - i * 0.0117, join: Triple = [side * 0.013, y - 0.009, 0]; for (const z of [-0.003, 0.003]) roots.push(tapered("脊神经前后根在外侧汇合", cartilage, [[side * 0.0035, y, z], [side * 0.008, y - 0.003, z * 0.75], join], [0.0008, 0.0007, 0.0009])); roots.push(pointed("合并后的脊神经干", tissue, [join, [side * 0.032, y - 0.014, 0]], [0.0012, 0])); }
    for (let i = 0; i < roots.length; i += 18) parts.push(combineMeshes("一段完整的脊神经前后根与神经干", cartilage, roots.slice(i, i + 18)));
    for (let i = 0; i < 10; i++) parts.push(pointed("圆锥末端以下的马尾神经束", cartilage, [[(i - 4.5) * 0.0005, 0.09, 0], [(i - 4.5) * 0.001, 0.045, 0], [(i - 4.5) * 0.002, 0.001, 0]], [0.00065, 0.0005, 0]));
  }
  return parts;
}

const feedingNames = [["fishGills", "鱼鳃"], ["sharkJaws", "鲨鱼颌骨"], ["cephalopodBeak", "头足类喙"], ["aristotleLantern", "海胆咀嚼灯"], ["ruminantStomach", "反刍胃"], ["avianAirSacs", "鸟肺与气囊"], ["syrinx", "鸟类鸣管"], ["forkedTongue", "蛇分叉舌"]];
const insectNames = [["compoundEye", "昆虫复眼"], ["dragonflyWing", "蜻蜓膜翅"], ["chewingMouthparts", "昆虫咀嚼式口器"], ["butterflyProboscis", "蝴蝶虹吸口器"]];
const reproductiveNames = [["uterus", "子宫"], ["ovary", "卵巢"], ["testis", "睾丸与附睾"], ["prostate", "前列腺"], ["placenta", "胎盘"]];
const connectiveNames = [["intervertebralDisc", "椎间盘"], ["meniscus", "半月板"], ["spinalCord", "脊髓与脊神经"]];

export const comparativeOrganDesigns: MasterNatureDesign[] = [
  ...feedingNames.map(([key, name], i) => design(key!, name!, "器物", () => feeding(i), ["比较解剖", "独立器官"])),
  ...insectNames.map(([key, name], i) => design(key!, name!, "器物", () => insectOrgan(i), ["昆虫独立器官", "真实尺度"])),
  ...reproductiveNames.map(([key, name], i) => design(key!, name!, "器物", () => reproductive(i), ["人体解剖模型", "独立器官"])),
  ...connectiveNames.map(([key, name], i) => design(key!, name!, "器物", () => connective(i), ["人体解剖模型", "独立器官"])),
];
