import { beam, cap, combineMeshes, design, lobe, needle, part, polygon, sweptProfile, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";

const bone = "#cbc8af";
const facet = "#b4bca2";

function circle(x: number, z: number, radius: number, count = 12): [number, number][] {
  return Array.from({ length: count }, (_, i) => [x + Math.cos(i * Math.PI * 2 / count) * radius, z + Math.sin(i * Math.PI * 2 / count) * radius]);
}

function bentPlate(name: string, outline: [number, number][], thickness: number, curvature: number, root: Triple = [0, 0, 0], holes: [number, number][][] = []): ModelPart {
  const value = polygon(name, bone, outline, thickness, root, holes);
  value.vertices = value.vertices!.map(p => ({ ...p, y: p.y + curvature * (p.x * p.x + p.z * p.z) }));
  return value;
}

function jaw(): ModelPart[] {
  const parts = [polygon("下颌骨开放的U形下颌体", bone, [[-0.042, -0.05], [-0.055, -0.018], [-0.046, 0.04], [-0.026, 0.063], [0.026, 0.063], [0.046, 0.04], [0.055, -0.018], [0.042, -0.05], [0.033, -0.025], [0.034, 0.023], [0.02, 0.044], [-0.02, 0.044], [-0.034, 0.023], [-0.033, -0.025]], 0.021)];
  for (const side of [-1, 1]) {
    parts.push(bentPlate("由下颌角向上升起的骨板", [[side * 0.043, -0.045], [side * 0.052, -0.014], [side * 0.047, 0.014], [side * 0.035, 0.006]], 0.008, 0, [0, 0.018, -0.023]));
    parts.push(tapered("下颌升支和关节颈", bone, [[side * 0.043, 0.016, -0.028], [side * 0.046, 0.057, -0.035], [side * 0.042, 0.077, -0.039]], [0.013, 0.01, 0.006]), lobe("下颌髁关节头", facet, [side * 0.042, 0.079, -0.039], [0.022, 0.011, 0.012]), needle("下颌冠突", bone, [side * 0.045, 0.034, -0.015], [side * 0.043, 0.073, -0.007], 0.018));
  }
  const teeth: ModelPart[] = [];
  for (let i = 0; i < 16; i++) { const a = -Math.PI * 0.05 + i / 15 * Math.PI * 1.1; teeth.push(lobe("下颌完整牙列的牙冠", "#dad5ba", [Math.cos(a) * 0.041, 0.025, Math.sin(a) * 0.055 - 0.005], [i > 4 && i < 11 ? 0.006 : 0.009, 0.011, 0.009])); }
  parts.push(combineMeshes("沿下颌弓排列的全部牙冠", "#dad5ba", teeth));
  return parts;
}

function neckBone(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  if (kind === 0) {
    parts.push(tapered("舌骨体与左右大角构成的开放马蹄", bone, [[-0.021, 0.008, -0.022], [-0.017, 0.007, 0.005], [0, 0.008, 0.018], [0.017, 0.007, 0.005], [0.021, 0.008, -0.022]], [0.002, 0.003, 0.006, 0.003, 0.002]));
    for (const side of [-1, 1]) parts.push(needle("舌骨两枚小角", bone, [side * 0.011, 0.01, 0.009], [side * 0.014, 0.019, 0.007], 0.004));
  } else {
    const atlas = kind === 1;
    parts.push(polygon(atlas ? "寰椎无椎体的前后骨弓大环" : "枢椎环绕椎孔的椎弓", bone, circle(0, 0, atlas ? 0.032 : 0.026, 18), atlas ? 0.01 : 0.015, [0, 0, 0], [circle(0, 0, atlas ? 0.021 : 0.014, 18)]));
    for (const side of [-1, 1]) { parts.push(lobe("椎弓两侧承重的侧块", bone, [side * (atlas ? 0.023 : 0.021), 0.011, -0.002], [0.023, 0.021, 0.029]), cap("上关节面", facet, [side * (atlas ? 0.023 : 0.021), 0.021, -0.002], 0.01, 0.004, 3), polygon("横突内的贯通横突孔", bone, circle(side * 0.038, 0, 0.009), 0.008, [0, 0.003, 0], [circle(side * 0.038, 0, 0.0035)]), beam("侧块连接横突的骨根", bone, [side * 0.024, 0.007, 0.008], [side * 0.037, 0.007, 0.008], 0.007)); }
    if (atlas) parts.push(lobe("寰椎前结节", bone, [0, 0.006, -0.033], [0.012, 0.011, 0.01]));
    else { parts.push(lobe("枢椎椎体", bone, [0, 0.009, -0.024], [0.039, 0.025, 0.03]), tapered("枢椎向上突出的齿突", bone, [[0, 0.017, -0.022], [0, 0.041, -0.022], [0, 0.047, -0.022]], [0.008, 0.006, 0.003])); for (const side of [-1, 1]) parts.push(needle("枢椎后方分叉棘突", bone, [0, 0.008, 0.022], [side * 0.009, 0.01, 0.048], 0.012)); }
  }
  return parts;
}

function centralSkull(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  if (kind === 0) {
    parts.push(part("蝶骨中央含窦的体部", "box", bone, [0, 0.018, 0], [0.027, 0.025, 0.03]), cap("蝶鞍的凹陷鞍窝", facet, [0, 0.03, 0], 0.009, 0.006, 3));
    for (const side of [-1, 1]) {
      const wing = bentPlate("蝶骨较大的上弯骨翼", [[side * 0.01, -0.015], [side * 0.04, -0.024], [side * 0.063, 0.011], [side * 0.055, 0.042], [side * 0.024, 0.025]], 0.004, 10, [0, 0.016, 0], [circle(side * 0.027, 0.005, 0.004)]); parts.push(wing, needle("蝶骨细长小翼", bone, [side * 0.006, 0.035, -0.014], [side * 0.052, 0.042, -0.023], 0.008));
      for (const offset of [-0.005, 0.005]) { const process = bentPlate("蝶骨向下的翼突板", [[-0.005, -0.017], [0.005, -0.017], [0.007, 0.023], [-0.006, 0.023]], 0.003, 0, [side * 0.017 + offset, -0.005, 0.007]); process.rotation = { x: 90, y: 0, z: 90 }; parts.push(process); }
    }
  } else if (kind === 1) {
    const holes = [-1, 1].flatMap(side => Array.from({ length: 4 }, (_, i) => circle(side * 0.006, -0.013 + i * 0.008, 0.0015, 10)));
    parts.push(polygon("筛骨带有真正贯通筛孔的筛板", bone, [[-0.012, -0.021], [0.012, -0.021], [0.012, 0.019], [-0.012, 0.019]], 0.002, [0, 0.024, 0], holes), needle("筛板中央向上的鸡冠", bone, [0, 0.026, 0], [0, 0.046, -0.003], 0.01), part("筛骨向下构成鼻中隔的垂直板", "box", bone, [0, 0.012, 0], [0.002, 0.025, 0.032]));
    for (const side of [-1, 1]) { parts.push(polygon("筛骨侧方蜂窝状气房迷路", bone, [[-0.009, -0.015], [0.009, -0.015], [0.009, 0.015], [-0.009, 0.015]], 0.019, [side * 0.018, 0.003, 0], [circle(0, -0.007, 0.004, 10), circle(0, 0.007, 0.004, 10)]), lobe("筛骨向鼻腔弯入的中鼻甲", facet, [side * 0.009, 0.005, 0.01], [0.01, 0.009, 0.026])); }
  } else {
    const value = polygon("犁骨薄而斜置的鼻中隔骨板", bone, [[-0.017, -0.017], [0.025, -0.013], [0.016, 0.02], [-0.01, 0.027]], 0.002); value.rotation.z = 90; parts.push(value);
    for (const side of [-1, 1]) parts.push(beam("犁骨上缘张开的双翼", bone, [0, 0.017, -0.016], [side * 0.007, 0.02, -0.016], 0.003));
  }
  return parts;
}

function outerSkull(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  if (kind === 0) {
    parts.push(bentPlate("枕骨鳞部和围绕枕骨大孔的骨板", [[-0.057, -0.028], [-0.062, 0.033], [-0.026, 0.076], [0.026, 0.076], [0.062, 0.033], [0.057, -0.028]], 0.006, 7, [0, 0, 0], [circle(0, -0.003, 0.019, 18)]));
    for (const side of [-1, 1]) parts.push(lobe("枕骨大孔旁的枕髁", facet, [side * 0.023, 0.005, -0.007], [0.015, 0.014, 0.03]), beam("项线凸起", facet, [0, 0.025, 0.035], [side * 0.047, 0.027, 0.031], 0.003)); parts.push(needle("枕外隆凸", bone, [0, 0.019, 0.037], [0, 0.033, 0.048], 0.014));
  } else if (kind === 1) {
    parts.push(bentPlate("额骨宽阔向上弯曲的额鳞", [[-0.063, -0.035], [-0.072, 0.017], [-0.043, 0.068], [0.043, 0.068], [0.072, 0.017], [0.063, -0.035], [0.028, -0.027], [0, -0.038], [-0.028, -0.027]], 0.005, 8));
    for (const side of [-1, 1]) parts.push(bentPlate("额骨眼眶上方的眶板", [[side * 0.005, -0.032], [side * 0.06, -0.033], [side * 0.047, -0.067], [side * 0.014, -0.06]], 0.004, 0, [0, 0, 0]), tapered("眼眶上缘隆起", facet, [[side * 0.005, 0.008, -0.033], [side * 0.034, 0.012, -0.039], [side * 0.063, 0.011, -0.032]], [0.004, 0.005, 0.002]));
  } else if (kind === 2) {
    parts.push(bentPlate("颞骨向上展开的扇形鳞部", [[-0.034, -0.012], [-0.044, 0.013], [-0.023, 0.058], [0.012, 0.06], [0.038, 0.033], [0.026, -0.01]], 0.004, 9), lobe("颞骨乳突", bone, [-0.023, 0.002, -0.019], [0.025, 0.03, 0.028]), tapered("前方细长的颧突骨弓", bone, [[0.022, 0.008, -0.006], [0.052, 0.012, -0.025], [0.065, 0.011, -0.011]], [0.006, 0.004, 0.003]), needle("茎突", bone, [-0.008, 0.004, -0.016], [-0.006, -0.033, -0.025], 0.006));
    const canal = sweptProfile("颞骨外耳道的真实管腔", facet, [[0.008, 0], [0.008, 0.012], [0.0055, 0.012], [0.0055, 0]], Math.PI * 2); canal.position = { x: 0, y: 0.003, z: -0.014 }; canal.rotation.x = 90; parts.push(canal);
  } else if (kind === 3) {
    parts.push(polygon("单块上颌骨的鼻侧壁与上颌窦口", bone, [[-0.023, -0.019], [0.024, -0.016], [0.027, 0.024], [0.006, 0.039], [-0.021, 0.022]], 0.012, [0, 0.012, 0], [circle(0.001, 0.006, 0.011, 16)]), bentPlate("上颌骨腭突形成的半侧硬腭", [[-0.025, -0.02], [0.02, -0.02], [0.016, -0.046], [-0.009, -0.052], [-0.026, -0.035]], 0.004, 2), tapered("上颌骨额突", bone, [[-0.019, 0.018, -0.012], [-0.019, 0.052, -0.017]], [0.007, 0.004]));
    const teeth: ModelPart[] = []; for (let i = 0; i < 8; i++) teeth.push(lobe("上颌半侧牙槽内的牙冠", "#dad4b9", [-0.021 + i * 0.0055, -0.004, -0.037 - Math.sin(i / 7 * Math.PI) * 0.009], [0.006, 0.013, 0.007])); parts.push(combineMeshes("单块上颌骨的完整牙列", "#dad4b9", teeth));
  } else if (kind === 4) {
    parts.push(bentPlate("颧骨厚实的菱形面部骨体", [[-0.018, -0.012], [0.009, -0.02], [0.025, -0.002], [0.012, 0.025], [-0.009, 0.018]], 0.008, 5), tapered("颧骨向后的颞突", bone, [[0.017, 0.006, 0.003], [0.044, 0.008, 0.017]], [0.005, 0.002]), tapered("颧骨额突形成的外眶缘", bone, [[0.006, 0.008, -0.013], [0.001, 0.034, -0.017]], [0.007, 0.003]));
  } else if (kind === 5) {
    parts.push(bentPlate("鼻骨上窄下宽的弓曲骨板", [[-0.004, -0.014], [0.004, -0.014], [0.007, 0.014], [-0.006, 0.017]], 0.0015, 22), beam("鼻骨后方的鼻沟嵴", facet, [0, 0.002, -0.01], [0, 0.004, 0.014], 0.0015));
  } else if (kind === 6) {
    parts.push(polygon("泪骨薄小长方骨板", bone, [[-0.005, -0.008], [0.006, -0.008], [0.005, 0.01], [-0.005, 0.01]], 0.0012), tapered("泪骨后泪嵴", facet, [[0, 0.002, -0.007], [0.001, 0.003, 0.009]], [0.0012, 0.0012]), cap("泪囊窝的凹面", facet, [-0.002, 0.001, 0], 0.0035, 0.0015, 3));
  } else if (kind === 7) {
    parts.push(polygon("腭骨水平板", bone, [[-0.014, -0.012], [0.013, -0.012], [0.013, 0.012], [-0.014, 0.012]], 0.003), part("腭骨垂直板与水平板形成L形", "box", bone, [0.012, 0.02, 0], [0.003, 0.04, 0.024]), needle("腭骨眶突", bone, [0.011, 0.037, -0.005], [0.002, 0.046, -0.01], 0.009));
  } else {
    const outside: [number, number][] = [], inside: [number, number][] = [];
    for (let i = 0; i <= 15; i++) { const a = i / 15 * Math.PI * 2.4, r = 0.002 + i * 0.00048; outside.push([Math.cos(a) * r, Math.sin(a) * r]); inside.push([Math.cos(a) * (r - 0.0007), Math.sin(a) * (r - 0.0007)]); }
    parts.push(part("下鼻甲具有真实卷曲间隙的薄骨卷片", "extrude", bone, [0, 0.012, 0], [1, 1, 1], [0, 0, 0], { profile: [...outside, ...inside.reverse()].map(([x, y]) => ({ x, y })), depth: 0.035 }), needle("下鼻甲上缘的泪突", bone, [0.003, 0.017, 0], [0.004, 0.027, 0.003], 0.004));
  }
  return parts;
}

function wrist(kind: number): ModelPart[] {
  if (kind === 0) return [polygon("钩骨不规则锥形体", bone, [[-0.01, -0.009], [0.01, -0.008], [0.008, 0.012], [-0.006, 0.014]], 0.013), tapered("钩骨掌面向内弯曲的钩突", bone, [[-0.005, 0.012, 0.002], [-0.006, 0.025, 0.002], [0.004, 0.029, 0.002]], [0.0035, 0.0025, 0.001]), lobe("远端关节面", facet, [0, 0.007, -0.009], [0.019, 0.013, 0.006])];
  if (kind === 1) return [polygon("头状骨方形基部", bone, [[-0.009, -0.012], [0.01, -0.012], [0.008, 0.006], [-0.008, 0.006]], 0.014), tapered("头状骨颈部", bone, [[0, 0.008, 0.004], [0, 0.009, 0.013]], [0.006, 0.005]), lobe("头状骨近端圆头", facet, [0, 0.01, 0.017], [0.016, 0.016, 0.019])];
  if (kind === 2) return [tapered("舟骨弯曲的舟形长体", bone, [[-0.011, 0.007, -0.009], [-0.002, 0.01, -0.003], [0.007, 0.011, 0.011]], [0.004, 0.007, 0.006]), lobe("舟骨近端圆形关节面", facet, [-0.008, 0.008, -0.007], [0.016, 0.015, 0.016]), lobe("舟骨远端掌侧结节", bone, [0.011, 0.015, 0.012], [0.009, 0.009, 0.011])];
  return [polygon("月骨近端凸远端凹的新月形骨体", bone, [[-0.011, -0.009], [-0.013, 0.001], [-0.007, 0.012], [0.005, 0.014], [0.013, 0.003], [0.01, -0.008], [0.004, -0.002], [-0.002, 0.002], [-0.007, -0.002]], 0.014), lobe("月骨凸侧近端关节面", facet, [0, 0.007, 0.01], [0.02, 0.014, 0.008])];
}

const neckNames = [["hyoidBone", "舌骨"], ["atlasBone", "寰椎"], ["axisBone", "枢椎"]];
const centralNames = [["sphenoidBone", "蝶骨"], ["ethmoidBone", "筛骨"], ["vomerBone", "犁骨"]];
const outerNames = [["occipitalBone", "枕骨"], ["frontalBone", "额骨"], ["temporalBone", "颞骨"], ["maxillaBone", "上颌骨"], ["zygomaticBone", "颧骨"], ["nasalBone", "鼻骨"], ["lacrimalBone", "泪骨"], ["palatineBone", "腭骨"], ["inferiorConchaBone", "下鼻甲"]];
const wristNames = [["hamateBone", "钩骨"], ["capitateBone", "头状骨"], ["scaphoidBone", "舟骨"], ["lunateBone", "月骨"]];

export const skullElementDesigns: MasterNatureDesign[] = [
  design("mandibleBone", "下颌骨", "器物", jaw, ["独立骨形器官"]),
  ...neckNames.map(([key, name], i) => design(key!, name!, "器物", () => neckBone(i), ["独立骨形器官"])),
  ...centralNames.map(([key, name], i) => design(key!, name!, "器物", () => centralSkull(i), ["独立骨形器官"])),
  ...outerNames.map(([key, name], i) => design(key!, name!, "器物", () => outerSkull(i), ["独立骨形器官"])),
  ...wristNames.map(([key, name], i) => design(key!, name!, "器物", () => wrist(i), ["独立骨形器官"])),
];
