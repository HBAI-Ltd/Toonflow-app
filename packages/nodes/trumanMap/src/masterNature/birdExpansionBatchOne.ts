import { combineMeshes, design, eyes, leaf, lobe, needle, part, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { body } from "./fishForms";
import { membrane } from "./animals";

const feather = "#a5b49b";
const covert = "#879a87";
const pale = "#cbd0b6";
const bare = "#b3ad95";
const dark = "#596d60";

export function head(parts: ModelPart[], root: Triple, size: Triple, color = feather) {
  parts.push(lobe("与颈部相连的完整鸟头", color, root, size), ...eyes([root[0], root[1] + size[1] * 0.13, root[2] + size[2] * 0.26], size[0] * 0.37, size[0] * 0.09));
}

export function calibrated(parts: ModelPart[], factor: number): ModelPart[] {
  for (const value of parts) for (const axis of ["x", "y", "z"] as const) { value.position[axis] *= factor; value.scale[axis] *= factor; }
  return parts;
}

export function foldedWings(parts: ModelPart[], root: Triple, width: number, length: number) {
  for (const side of [-1, 1]) {
    const feathers = Array.from({ length: 7 }, (_, index) => leaf("收叠初级飞羽", covert, [side * (width * 0.36 + index * width * 0.025), root[1] - index * length * 0.014, root[2] - index * length * 0.035], width * 0.4, length * (0.7 + index * 0.025), [-113, side * (index * 2 - 5), side * 7]));
    parts.push(lobe("肩臂与覆羽保持实体厚度的折翼", covert, [side * width * 0.36, root[1], root[2] - length * 0.08], [width * 0.6, length * 0.4, length * 0.8]), combineMeshes("分离羽缘相叠的整侧折翼", covert, feathers));
  }
}

export function tail(parts: ModelPart[], root: Triple, width: number, length: number, tilt = -108) {
  parts.push(combineMeshes("由尾综骨连续伸出的五枚尾羽", covert, Array.from({ length: 5 }, (_, index) => leaf("相叠尾羽", covert, [root[0] + (index - 2) * width * 0.12, root[1], root[2]], width * 0.4, length * (1 - Math.abs(index - 2) * 0.07), [tilt, (index - 2) * 6, 0]))));
}

export function feet(parts: ModelPart[], hip: Triple, gap: number, radius: number, toeLength: number, options: { hindToe?: boolean; web?: number; lobed?: boolean } = {}) {
  for (const side of [-1, 1]) {
    const ankle: Triple = [hip[0] + side * gap, radius * 0.55, hip[2] + toeLength * 0.1];
    parts.push(tapered("有跗间关节的承重腿轴", bare, [[hip[0] + side * gap * 0.8, hip[1], hip[2]], [ankle[0], hip[1] * 0.58, hip[2] - toeLength * 0.25], ankle], [radius, radius * 0.73, radius * 0.5]));
    const toeParts: ModelPart[] = [];
    for (let index = -1; index <= 1; index++) {
      const tip: Triple = [ankle[0] + index * toeLength * 0.43, radius * 0.28, ankle[2] + toeLength * (index ? 0.85 : 1)];
      toeParts.push(tapered("真正分离的前趾", bare, [ankle, [ankle[0] + index * toeLength * 0.23, radius * 0.35, ankle[2] + toeLength * 0.53], tip], [radius * 0.38, radius * 0.27, radius * 0.13]), needle("趾端独立角质爪", dark, tip, [tip[0] + index * radius * 0.7, radius * 0.05, tip[2] + radius * 1.5], radius * 0.6));
      if (options.lobed) for (const segment of [0.38, 0.66]) toeParts.push(lobe("每枚足趾两侧的独立叶状泳瓣", bare, [ankle[0] + index * toeLength * 0.43 * segment, radius * 0.3, ankle[2] + toeLength * segment], [toeLength * 0.29, radius * 0.4, toeLength * 0.29]));
    }
    if (options.hindToe !== false) toeParts.push(tapered("后向独立抓趾", bare, [ankle, [ankle[0] - side * toeLength * 0.16, radius * 0.23, ankle[2] - toeLength * 0.44]], [radius * 0.32, radius * 0.12]));
    parts.push(combineMeshes("一足连续趾骨与真正分开的爪趾", bare, toeParts));
    if (options.web) {
      const extent = options.web;
      parts.push(membrane("只连前趾基部的真实足蹼", bare, [ankle, [ankle[0] - toeLength * 0.43 * extent, radius * 0.28, ankle[2] + toeLength * 0.85 * extent], [ankle[0], radius * 0.28, ankle[2] + toeLength * extent], [ankle[0] + toeLength * 0.43 * extent, radius * 0.28, ankle[2] + toeLength * 0.85 * extent]]));
    }
  }
}

// 诊断轮廓参考动物园/鸟类研究机构的物种记录；所有几何为本地手写，未复制模型或照片。
// https://sdzsafaripark.org/animals/hamerkop
function hamerkop(): ModelPart[] {
  const parts: ModelPart[] = [lobe("锤头鹳水平肩背与深腹", feather, [0, 0.265, 0], [0.19, 0.27, 0.35]), tapered("锤头鹳不缩成鹭形S曲线的短粗颈", feather, [[0, 0.33, 0.1], [0, 0.47, 0.15]], [0.055, 0.038])];
  head(parts, [0, 0.49, 0.17], [0.11, 0.12, 0.16]);
  parts.push(body("向前伸出的侧扁长喙", [[0.21, 0.48, 0.017, 0.019], [0.3, 0.472, 0.012, 0.016], [0.36, 0.458, 0.0015, 0.002]], bare));
  parts.push(combineMeshes("在喙相反方向伸出的锤头后枕冠", feather, Array.from({ length: 8 }, (_, index) => leaf("后向密集长枕羽", feather, [(index - 3.5) * 0.006, 0.52 + index % 2 * 0.005, 0.13], 0.024, 0.17 - Math.abs(index - 3.5) * 0.009, [-64, (index - 3.5) * 4, 0]))));
  foldedWings(parts, [0, 0.31, -0.02], 0.2, 0.28);
  tail(parts, [0, 0.21, -0.14], 0.12, 0.13);
  feet(parts, [0, 0.19, 0.02], 0.044, 0.008, 0.058, { web: 0.3 });
  return parts;
}

// https://repository.si.edu/bitstream/handle/10088/17641/VZ_88-89_Rails_Broadbills_book_chapters_.pdf
function africanFinfoot(): ModelPart[] {
  const parts: ModelPart[] = [lobe("非洲鳍趾长而水平的游禽躯", feather, [0, 0.17, -0.015], [0.17, 0.21, 0.4]), tapered("鳍趾从长躯前端上举的纤细颈", feather, [[0, 0.23, 0.12], [0, 0.35, 0.15], [0, 0.4, 0.21]], [0.043, 0.027, 0.024])];
  head(parts, [0, 0.417, 0.23], [0.085, 0.1, 0.12]);
  parts.push(body("鳍趾长直而尖的匕首喙", [[0.27, 0.409, 0.012, 0.015], [0.33, 0.405, 0.009, 0.011], [0.38, 0.401, 0.001, 0.001]], bare));
  foldedWings(parts, [0, 0.22, 0], 0.18, 0.27);
  tail(parts, [0, 0.14, -0.18], 0.11, 0.17, -102);
  feet(parts, [0, 0.12, -0.06], 0.05, 0.0065, 0.06, { lobed: true });
  return parts;
}

// https://avise-birds.bio.uci.edu/gruiformes/eurypygidae/Eurypyga_helias/index.html
function sunbittern(): ModelPart[] {
  const parts: ModelPart[] = [lobe("日鳽低肩细长胸腹", feather, [0, 0.2, 0], [0.15, 0.2, 0.28]), tapered("日鳽纤细S形颈", pale, [[0, 0.25, 0.09], [0, 0.3, 0.13], [0, 0.355, 0.1], [0, 0.39, 0.16]], [0.03, 0.022, 0.018, 0.018])];
  head(parts, [0, 0.408, 0.18], [0.075, 0.08, 0.105]);
  parts.push(tapered("日鳽细直而非扁阔的喙", bare, [[0, 0.401, 0.22], [0, 0.395, 0.31]], [0.009, 0.0007]));
  for (const side of [-1, 1]) {
    parts.push(membrane("日鳽宽圆展开的实体羽翼轮廓", feather, [[side * 0.04, 0.26, 0.04], [side * 0.16, 0.34, 0.09], [side * 0.32, 0.36, 0.01], [side * 0.38, 0.29, -0.09], [side * 0.31, 0.22, -0.23], [side * 0.12, 0.22, -0.2]]));
    const flightFeathers = Array.from({ length: 9 }, (_, index) => leaf("日鳽扇翼上分开的羽端", covert, [side * (0.13 + index * 0.024), 0.27 + Math.sin(index / 8 * Math.PI) * 0.06, -0.06 - index * 0.006], 0.052, 0.18 - Math.abs(index - 4) * 0.012, [-118, side * (index * 7 - 20), side * -12]));
    parts.push(combineMeshes("宽圆翼缘初级飞羽", covert, flightFeathers), lobe("翼上大型眼斑的平贴羽区", "#b6ac85", [side * 0.255, 0.316, -0.035], [0.105, 0.012, 0.095], [0, 0, -side * 12]), lobe("眼斑内部深色羽域", dark, [side * 0.26, 0.323, -0.033], [0.055, 0.008, 0.052], [0, 0, -side * 12]));
  }
  tail(parts, [0, 0.16, -0.11], 0.105, 0.24, -101);
  feet(parts, [0, 0.14, 0.02], 0.035, 0.0055, 0.05);
  return parts;
}

// https://animaldiversity.org/accounts/Anhima_cornuta/
function hornedScreamer(): ModelPart[] {
  const parts: ModelPart[] = [lobe("角叫鸭厚重而有深胸的躯干", feather, [0, 0.41, -0.02], [0.37, 0.46, 0.52]), tapered("角叫鸭由胸前收细上举的羽颈", feather, [[0, 0.52, 0.15], [0, 0.72, 0.19], [0, 0.79, 0.24]], [0.082, 0.052, 0.038])];
  head(parts, [0, 0.82, 0.25], [0.12, 0.135, 0.14]);
  parts.push(tapered("角叫鸭短而末端下曲的喙", bare, [[0, 0.813, 0.3], [0, 0.805, 0.36], [0, 0.781, 0.37]], [0.02, 0.014, 0.001]), tapered("前额长而纤细的角质角而非冠羽", pale, [[0, 0.87, 0.28], [0.006, 0.96, 0.32], [0.012, 1.025, 0.36]], [0.005, 0.0035, 0.0007]));
  for (const side of [-1, 1]) {
    parts.push(lobe("略张离胸侧以露出翼距的前翼", covert, [side * 0.2, 0.52, -0.02], [0.14, 0.17, 0.36]), membrane("翼臂到胸侧连续的羽面", covert, [[side * 0.12, 0.57, 0.1], [side * 0.29, 0.54, 0.11], [side * 0.3, 0.46, -0.17], [side * 0.12, 0.4, -0.2]]), needle("每翼前缘第一枚骨质距", pale, [side * 0.252, 0.57, 0.12], [side * 0.31, 0.6, 0.16], 0.015), needle("每翼前缘第二枚短骨距", pale, [side * 0.267, 0.548, 0.065], [side * 0.31, 0.55, 0.085], 0.011));
  }
  tail(parts, [0, 0.3, -0.22], 0.19, 0.18);
  feet(parts, [0, 0.28, 0.02], 0.09, 0.016, 0.12);
  return parts;
}

// https://ielc.libguides.com/sdzg/factsheets/magpie-goose/characteristics
function magpieGoose(): ModelPart[] {
  const parts: ModelPart[] = [lobe("鹊雁高腿之上的深腹鹅形躯", pale, [0, 0.36, -0.015], [0.32, 0.37, 0.53]), tapered("鹊雁长而近直立的细羽颈", covert, [[0, 0.46, 0.16], [0, 0.65, 0.19], [0, 0.79, 0.25]], [0.067, 0.045, 0.035])];
  head(parts, [0, 0.81, 0.27], [0.12, 0.15, 0.16], covert);
  parts.push(lobe("头顶真正隆起的圆骨瘤", covert, [0, 0.894, 0.26], [0.085, 0.09, 0.09]), body("鹊雁高基部收尖的鹅形喙", [[0.32, 0.791, 0.022, 0.026], [0.39, 0.78, 0.016, 0.019], [0.43, 0.773, 0.005, 0.006]], bare));
  foldedWings(parts, [0, 0.42, -0.02], 0.34, 0.42);
  tail(parts, [0, 0.28, -0.23], 0.19, 0.17);
  feet(parts, [0, 0.24, 0.025], 0.075, 0.013, 0.1, { web: 0.42 });
  return parts;
}

// https://www.indianapoliszoo.com/animals/helmeted-guinea-fowl/
function helmetedGuineafowl(): ModelPart[] {
  const parts: ModelPart[] = [lobe("盔珠鸡拱背侧扁的圆腹躯", covert, [0, 0.25, -0.015], [0.29, 0.34, 0.4]), tapered("盔珠鸡前部细长裸颈", "#9aafa7", [[0, 0.32, 0.13], [0, 0.45, 0.16], [0, 0.5, 0.19]], [0.036, 0.024, 0.022])];
  head(parts, [0, 0.53, 0.2], [0.075, 0.09, 0.1], "#9aafa7");
  parts.push(part("头顶部有厚度的镰形骨盔", "extrude", bare, [-0.006, 0.56, 0.18], [1, 1, 1], [0, 90, 0], { depth: 0.015, profile: [{ x: -0.03, y: 0 }, { x: 0.025, y: 0.008 }, { x: 0.018, y: 0.065 }, { x: -0.004, y: 0.092 }, { x: -0.012, y: 0.037 }] }), tapered("盔珠鸡下曲的短硬喙", bare, [[0, 0.52, 0.24], [0, 0.515, 0.29], [0, 0.497, 0.297]], [0.014, 0.009, 0.001]));
  for (const side of [-1, 1]) parts.push(lobe("喙根左右悬垂的独立肉垂", "#b89182", [side * 0.026, 0.486, 0.239], [0.025, 0.052, 0.022]));
  foldedWings(parts, [0, 0.31, -0.025], 0.29, 0.3);
  tail(parts, [0, 0.23, -0.18], 0.12, 0.09, -127);
  feet(parts, [0, 0.15, 0.005], 0.063, 0.009, 0.064);
  return parts;
}

// https://threatenedspecies.bionet.nsw.gov.au/profile?id=10459
function malleefowl(): ModelPart[] {
  const parts: ModelPart[] = [lobe("眼斑冢雉低重心的长腹胸", feather, [0, 0.22, -0.015], [0.28, 0.29, 0.42]), tapered("冢雉前倾而有羽覆的短粗颈", feather, [[0, 0.29, 0.14], [0, 0.39, 0.2]], [0.053, 0.036])];
  head(parts, [0, 0.425, 0.22], [0.105, 0.115, 0.135]);
  parts.push(tapered("冢雉厚基短锥喙", bare, [[0, 0.415, 0.265], [0, 0.401, 0.33]], [0.022, 0.001]));
  const crest = Array.from({ length: 7 }, (_, index) => leaf("从额顶沿后枕延伸的短冠羽", covert, [0, 0.461 - index * 0.004, 0.24 - index * 0.012], 0.025, 0.045 + index * 0.004, [-25 - index * 6, 0, 0]));
  parts.push(combineMeshes("沿冠中线连续而非侧扇的冢雉羽冠", covert, crest));
  foldedWings(parts, [0, 0.27, -0.025], 0.3, 0.32);
  tail(parts, [0, 0.22, -0.18], 0.19, 0.2, -80);
  feet(parts, [0, 0.15, 0.025], 0.075, 0.019, 0.105);
  return parts;
}

// https://www.allaboutbirds.org/guide/Red-breasted_Merganser/id
function redBreastedMerganser(): ModelPart[] {
  const parts: ModelPart[] = [lobe("秋沙鸭修长低腹而非家鸭的宽圆体", feather, [0, 0.13, -0.015], [0.18, 0.22, 0.36]), tapered("秋沙鸭细而前举的颈", pale, [[0, 0.19, 0.11], [0, 0.28, 0.15]], [0.041, 0.026])];
  head(parts, [0, 0.31, 0.18], [0.09, 0.11, 0.13], covert);
  parts.push(body("上颌细长的真正锯嘴", [[0.23, 0.304, 0.009, 0.011], [0.31, 0.3, 0.007, 0.008], [0.36, 0.295, 0.004, 0.004]], bare), body("与上颌保持锯缘间隙的下嘴", [[0.23, 0.287, 0.008, 0.004], [0.31, 0.288, 0.006, 0.003], [0.357, 0.29, 0.003, 0.002]], bare));
  const teeth: ModelPart[] = [];
  for (const side of [-1, 1]) for (let index = 0; index < 9; index++) teeth.push(needle("两侧锯嘴真实突出的角质齿", pale, [side * (0.008 - index * 0.00035), 0.295, 0.244 + index * 0.01], [side * (0.009 - index * 0.00035), 0.288, 0.247 + index * 0.01], 0.002));
  parts.push(combineMeshes("有真实间隔的两列锯齿", pale, teeth), combineMeshes("头后参差不齐的长丝状羽冠", covert, Array.from({ length: 8 }, (_, index) => leaf("散乱而有不同方向的冠羽", covert, [(index - 3.5) * 0.004, 0.351 + index % 2 * 0.003, 0.17], 0.008, 0.08 + index % 3 * 0.014, [-35 - index * 7, index * 13 - 45, 0]))));
  foldedWings(parts, [0, 0.17, -0.02], 0.19, 0.28);
  tail(parts, [0, 0.12, -0.17], 0.095, 0.115, -97);
  feet(parts, [0, 0.09, -0.075], 0.05, 0.0065, 0.057, { web: 0.93 });
  return parts;
}

// https://collections.museumsvictoria.com.au/species/8248
function muskDuck(): ModelPart[] {
  const parts: ModelPart[] = [lobe("麝鸭宽而低浮的沉重躯体", covert, [0, 0.14, 0], [0.32, 0.25, 0.4]), lobe("与肩部直接相接的粗短颈", covert, [0, 0.245, 0.12], [0.16, 0.2, 0.16])];
  head(parts, [0, 0.31, 0.19], [0.135, 0.14, 0.16], covert);
  parts.push(body("麝鸭高基部而扁阔的短三角喙", [[0.235, 0.298, 0.033, 0.019], [0.3, 0.285, 0.025, 0.014], [0.33, 0.282, 0.01, 0.006]], bare), lobe("下颌悬挂而独立于羽颈的圆形皮瓣", bare, [0, 0.235, 0.268], [0.075, 0.105, 0.035]));
  foldedWings(parts, [0, 0.18, -0.01], 0.32, 0.29);
  const stiffTail = Array.from({ length: 9 }, (_, index) => leaf("麝鸭细硬而可辨的尖尾羽", covert, [(index - 4) * 0.009, 0.13, -0.17], 0.018, 0.22 - Math.abs(index - 4) * 0.007, [-45, (index - 4) * 5, (index - 4) * 5]));
  parts.push(combineMeshes("独立分叉尖端的硬尾扇", covert, stiffTail));
  feet(parts, [0, 0.09, -0.1], 0.075, 0.009, 0.07, { web: 0.95 });
  return parts;
}

// https://www.calanques-parcnational.fr/en/wallcreeper
function wallcreeper(): ModelPart[] {
  const parts: ModelPart[] = [lobe("旋壁雀短尾而窄长的小型躯干", feather, [0, 0.062, 0], [0.052, 0.073, 0.085])];
  head(parts, [0, 0.104, 0.038], [0.044, 0.05, 0.05]);
  parts.push(tapered("从小头前伸后细曲的长弧喙", dark, [[0, 0.099, 0.058], [0, 0.1, 0.081], [0, 0.091, 0.107]], [0.0035, 0.0023, 0.0006]));
  for (const side of [-1, 1]) {
    parts.push(membrane("旋壁雀宽圆如蝶翼的覆羽面", "#b58a7c", [[side * 0.019, 0.084, 0.016], [side * 0.066, 0.122, 0.022], [side * 0.109, 0.113, -0.002], [side * 0.125, 0.085, -0.025], [side * 0.103, 0.065, -0.054], [side * 0.04, 0.063, -0.045]]));
    parts.push(combineMeshes("宽圆初级飞羽的独立边缘", dark, Array.from({ length: 7 }, (_, index) => leaf("圆翼末端短而分离的羽尖", dark, [side * (0.048 + index * 0.01), 0.087 + Math.sin(index / 6 * Math.PI) * 0.025, -0.018 - index * 0.002], 0.019, 0.052 - Math.abs(index - 3) * 0.004, [-117, side * (index * 9 - 20), -side * 12]))));
  }
  tail(parts, [0, 0.045, -0.035], 0.03, 0.035, -100);
  feet(parts, [0, 0.036, 0.005], 0.017, 0.0028, 0.032);
  return parts;
}

export const birdExpansionBatchOneDesigns: MasterNatureDesign[] = [
  design("hamerkop", "锤头鹳", "动物", () => calibrated(hamerkop(), 0.84), ["Scopus umbretta", "锤形后枕冠", "部分蹼足"]),
  design("africanFinfoot", "非洲鳍趾", "动物", () => calibrated(africanFinfoot(), 0.8), ["Podica senegalensis", "独立叶状趾瓣", "纤颈长躯"]),
  design("sunbittern", "日鳽", "动物", () => calibrated(sunbittern(), 0.73), ["Eurypyga helias", "宽圆眼斑翼", "细颈长尾"]),
  design("hornedScreamer", "角叫鸭", "动物", () => calibrated(hornedScreamer(), 0.88), ["Anhima cornuta", "额角与双翼骨距", "无蹼长趾"]),
  design("magpieGoose", "鹊雁", "动物", magpieGoose, ["Anseranas semipalmata", "圆骨瘤", "前趾部分蹼"]),
  design("helmetedGuineafowl", "盔珠鸡", "动物", helmetedGuineafowl, ["Numida meleagris", "骨盔与双肉垂", "拱背侧扁体"]),
  design("malleefowl", "眼斑冢雉", "动物", () => calibrated(malleefowl(), 0.85), ["Leipoa ocellata", "掘土粗趾", "冠中线羽冠"]),
  design("redBreastedMerganser", "红胸秋沙鸭", "动物", () => calibrated(redBreastedMerganser(), 0.91), ["Mergus serrator", "真实锯齿长喙", "散乱长冠羽"]),
  design("muskDuck", "麝鸭", "动物", muskDuck, ["Biziura lobata", "下颌圆皮瓣", "硬尖尾扇"]),
  design("wallcreeper", "红翅旋壁雀", "动物", () => calibrated(wallcreeper(), 0.9), ["Tichodroma muraria", "蝶形宽圆翼", "弧喙长爪"]),
];
