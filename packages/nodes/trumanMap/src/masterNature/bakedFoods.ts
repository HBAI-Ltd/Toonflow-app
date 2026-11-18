import { beam, cap, combineMeshes, design, leaf, lobe, needle, part, polygon, sweptProfile, tapered, tube } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { spiral } from "./marine";

const crust = "#c5b28b";
const crumb = "#ded0aa";
const filling = "#acb18d";

function scalloped(radius: number, depth: number, teeth: number): [number, number][] {
  return Array.from({ length: teeth * 2 }, (_, i) => { const a = i * Math.PI / teeth; const r = radius * (i % 2 ? 0.94 : 1); return [Math.cos(a) * r, Math.sin(a) * r * depth]; });
}

function icingSpiral(root: Triple, radius: number, height: number): ModelPart {
  const path: Triple[] = Array.from({ length: 33 }, (_, i) => { const t = i / 32; const a = t * Math.PI * 6; return [root[0] + Math.cos(a) * radius * (1 - t * 0.96), root[1] + t * height, root[2] + Math.sin(a) * radius * (1 - t * 0.96)]; });
  return tapered("连续螺旋裱花", "#e0d5b9", path, path.map((_, i) => 0.012 * (1 - i / 35)));
}

function pastry(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  if (kind === 0) {
    parts.push(polygon("月饼完整花边饼身", crust, scalloped(0.05, 1, 16), 0.028));
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; parts.push(tube("饼面凸起卷花", "#d8c498", [[0, 0.03, 0], [Math.cos(a - 0.25) * 0.025, 0.03, Math.sin(a - 0.25) * 0.025], [Math.cos(a) * 0.038, 0.03, Math.sin(a) * 0.038], [Math.cos(a + 0.3) * 0.025, 0.03, Math.sin(a + 0.3) * 0.025]], 0.0025)); }
    parts.push(polygon("月饼中央压花", "#dac79c", [[0, -0.016], [0.016, 0], [0, 0.016], [-0.016, 0]], 0.004, [0, 0.03, 0]));
  } else if (kind === 1) {
    parts.push(lobe("菠萝包柔软圆面团", crumb, [0, 0.037, 0], [0.115, 0.074, 0.105]));
    for (let x = -2; x <= 2; x++) for (let z = -2; z <= 2; z++) if (x * x + z * z <= 6) parts.push(lobe("菠萝格裂酥皮块", crust, [x * 0.021, 0.07 - (x * x + z * z) * 0.003, z * 0.02], [0.029, 0.016, 0.027], [0, 40, 0]));
  } else if (kind === 2) {
    parts.push(lobe("铜锣烧下层圆饼", crust, [0, 0.012, 0], [0.105, 0.024, 0.1]), lobe("铜锣烧夹入的豆馅", filling, [0, 0.027, 0], [0.091, 0.018, 0.089]), lobe("铜锣烧上层鼓面饼", "#d0ba91", [0, 0.044, 0], [0.105, 0.03, 0.1]));
  } else if (kind === 3) {
    const outline: [number, number][] = [[0, -0.075], [-0.04, -0.04], [-0.045, 0.025], [-0.025, 0.06], [-0.045, 0.095], [0, 0.078], [0.045, 0.095], [0.025, 0.06], [0.045, 0.025], [0.04, -0.04]];
    parts.push(polygon("鲷鱼烧完整鱼形饼壳", crust, outline, 0.022));
    for (let row = 0; row < 4; row++) for (let i = 0; i < 3; i++) parts.push(tube("鱼形饼鳞片凸纹", "#d9c49c", [[(i - 1) * 0.019 - 0.007, 0.025, -0.035 + row * 0.018], [(i - 1) * 0.019, 0.027, -0.025 + row * 0.018], [(i - 1) * 0.019 + 0.007, 0.025, -0.035 + row * 0.018]], 0.0015));
    parts.push(lobe("压制鱼眼", "#a99e7e", [0.023, 0.026, -0.05], [0.008, 0.004, 0.008]), beam("尾鳍主纹", "#d9c49c", [0, 0.025, 0.055], [0, 0.025, 0.082], 0.003));
  } else if (kind === 4) {
    const folded = polygon("可丽饼三角折叠薄饼", crust, [[0, -0.1], [-0.085, 0.05], [0.065, 0.075], [0.09, 0.025]], 0.004); parts.push(folded);
    for (let i = 0; i < 3; i++) { const flap = polygon("叠起的薄饼折角", crumb, [[0, -0.095], [-0.06 + i * 0.014, 0.05], [0.07, 0.025]], 0.003, [0, 0.006 + i * 0.005, 0]); flap.rotation.z = i * 3; parts.push(flap); }
    parts.push(icingSpiral([0, 0.015, 0.035], 0.025, 0.032));
  } else if (kind === 5) {
    parts.push(polygon("布丁放射棱模体", "#d8ca9f", scalloped(0.043, 1, 10), 0.05));
    const top = polygon("布丁焦糖顶", "#b2a07d", scalloped(0.043, 1, 10), 0.003, [0, 0.05, 0]); parts.push(top);
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; parts.push(tapered("沿棱流下的焦糖", "#b2a07d", [[Math.cos(a) * 0.04, 0.052, Math.sin(a) * 0.04], [Math.cos(a) * 0.044, 0.026 - i * 0.004, Math.sin(a) * 0.044]], [0.004, 0.002])); }
  } else if (kind === 6) {
    parts.push(part("甜甜圈完整油炸环", "torus", crust, [0, 0.018, 0], [0.11, 0.11, 0.065], [90, 0, 0]));
    const glaze = sweptProfile("带中心贯通孔的糖霜层", "#d5c6ac", [[0.021, 0.025], [0.027, 0.039], [0.043, 0.04], [0.053, 0.026], [0.048, 0.025], [0.038, 0.035], [0.028, 0.034], [0.025, 0.025]], Math.PI * 2, 24); parts.push(glaze);
    for (let i = 0; i < 18; i++) { const a = i * 2.4; const r = 0.03 + i % 3 * 0.005; parts.push(beam("糖针", i % 2 ? "#aab795" : "#c3ae8d", [Math.cos(a) * r, 0.041, Math.sin(a) * r], [Math.cos(a) * r + 0.004, 0.042, Math.sin(a) * r + 0.001], 0.0015)); }
  } else if (kind === 7) {
    parts.push(polygon("曲奇不规则花边饼体", crust, scalloped(0.043, 0.95, 12), 0.012));
    for (let i = 0; i < 12; i++) { const a = i * 2.4; const r = 0.007 + i % 4 * 0.008; parts.push(lobe("嵌入饼面的可见巧克力块", "#9b9b82", [Math.cos(a) * r, 0.013, Math.sin(a) * r], [0.009, 0.005, 0.007], [0, i * 32, 0])); }
  } else if (kind === 8) {
    parts.push(polygon("玛德琳贝壳轮廓", crust, [[0, -0.055], [-0.022, -0.045], [-0.04, 0.005], [-0.032, 0.045], [0, 0.055], [0.032, 0.045], [0.04, 0.005], [0.022, -0.045]], 0.012));
    for (let i = -3; i <= 3; i++) parts.push(tapered("贝壳模具纵向凸棱", "#d4c199", [[0, 0.014, -0.047], [i * 0.009, 0.028 - Math.abs(i) * 0.003, 0.008], [i * 0.009, 0.016, 0.046 - Math.abs(i) * 0.005]], [0.003, 0.006, 0.002]));
  } else if (kind === 9) {
    parts.push(polygon("杯子蛋糕波褶纸托", "#bfc6ae", scalloped(0.036, 1, 16), 0.045), lobe("纸托外鼓起的蛋糕顶", crust, [0, 0.045, 0], [0.082, 0.04, 0.082]), icingSpiral([0, 0.063, 0], 0.029, 0.05));
  } else if (kind === 10) {
    for (let i = 0; i < 8; i++) parts.push(sweptProfile("树轮蛋糕独立烘焙年轮", i % 2 ? crust : crumb, [[0.018 + i * 0.005, 0], [0.022 + i * 0.005, 0], [0.022 + i * 0.005, 0.055], [0.018 + i * 0.005, 0.055]], Math.PI * 1.65, 24));
  } else if (kind === 11) {
    parts.push(lobe("莲花酥内馅", filling, [0, 0.025, 0], [0.045, 0.045, 0.045]));
    for (let layer = 0; layer < 3; layer++) for (let i = 0; i < 5; i++) { const a = i * 72 + layer * 36; parts.push(leaf("向外剥开的真实酥皮瓣", layer % 2 ? crumb : crust, [0, 0.01 + layer * 0.009, 0], 0.038 - layer * 0.006, 0.065 - layer * 0.012, [45 + (2 - layer) * 18, a, 0])); }
  } else if (kind === 12) {
    for (const side of [-1, 1]) { const roll = spiral("蝴蝶酥左右对卷酥层", 0.033, 0.003, 2.2, crust); roll.rotation.x = 90; roll.position = { x: side * 0.026, y: 0.006, z: 0 }; roll.scale.x = side === 1 ? 1 : 0.98; parts.push(roll); }
    parts.push(polygon("蝴蝶酥连接尖底", crumb, [[-0.018, 0], [0, -0.046], [0.018, 0]], 0.009));
  } else if (kind === 13) {
    parts.push(sweptProfile("馕饼厚边与凹心", crust, [[0, 0], [0.11, 0], [0.11, 0.012], [0.095, 0.027], [0.075, 0.018], [0, 0.012]], Math.PI * 2, 24));
    for (let ring = 0; ring < 3; ring++) for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; parts.push(polygon("馕针压孔边缘", "#b5a780", scalloped(0.0025, 1, 4), 0.001, [Math.cos(a) * (0.02 + ring * 0.019), 0.013, Math.sin(a) * (0.02 + ring * 0.019)], [scalloped(0.0015, 1, 4)])); }
  } else if (kind === 14) {
    const outline: [number, number][] = [[-0.075, -0.04], [-0.08, 0.025], [-0.05, 0.075], [0.045, 0.08], [0.08, 0.025], [0.06, -0.04]];
    parts.push(polygon("皮塔口袋饼下层", crust, outline, 0.004));
    const upper = polygon("皮塔掀开的中空上壁", crumb, outline, 0.004, [0, 0.014, 0]); upper.rotation.x = -9; parts.push(upper, beam("口袋饼封闭后缘", crust, [-0.055, 0.006, -0.038], [0.05, 0.006, -0.038], 0.009));
  } else if (kind === 15) {
    for (let i = 0; i < 4; i++) parts.push(part("松饼有厚度的煎制饼层", "cylinder", i % 2 ? "#cbb993" : crust, [0, 0.008 + i * 0.014, 0], [0.13, 0.014, 0.13]));
    parts.push(part("松饼顶融化黄油块", "box", "#ddd1aa", [0, 0.065, 0], [0.025, 0.009, 0.028], [0, 15, 0]), tapered("沿饼层流下的糖浆", "#b3a17d", [[0.04, 0.061, 0], [0.065, 0.045, 0.01], [0.066, 0.012, 0.02]], [0.009, 0.007, 0.004]));
  } else if (kind === 16) {
    parts.push(polygon("可露丽纵褶模体", crust, scalloped(0.029, 1, 12), 0.05), sweptProfile("可露丽顶端凹窝", "#b1a17e", [[0.012, 0.05], [0.029, 0.05], [0.029, 0.054], [0.012, 0.054]], Math.PI * 2, 24), lobe("模具中央凹窝底", "#cab78e", [0, 0.049, 0], [0.027, 0.003, 0.027]));
  } else if (kind === 17) {
    parts.push(polygon("丹麦酥底层方片", crumb, [[-0.05, -0.05], [0.05, -0.05], [0.05, 0.05], [-0.05, 0.05]], 0.008));
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; parts.push(tapered("向中心翻折的风车酥角", crust, [[Math.cos(a) * 0.055, 0.01, Math.sin(a) * 0.055], [Math.cos(a + 0.4) * 0.04, 0.027, Math.sin(a + 0.4) * 0.04], [0, 0.018, 0]], [0.012, 0.015, 0.007])); }
    parts.push(lobe("丹麦酥中央果酱", filling, [0, 0.024, 0], [0.035, 0.018, 0.035]));
  } else if (kind === 18) {
    for (let strand = 0; strand < 3; strand++) parts.push(tapered("巴布卡绞编面包主条", strand % 2 ? filling : crust, Array.from({ length: 17 }, (_, i) => { const a = i * Math.PI / 4 + strand * Math.PI * 2 / 3; return [Math.cos(a) * 0.025, 0.035 + Math.sin(a) * 0.013, (i - 8) * 0.016] as Triple; }), Array.from({ length: 17 }, (_, i) => 0.015 + Math.sin(i / 16 * Math.PI) * 0.01)));
  } else if (kind === 19) {
    parts.push(part("潘娜托尼高圆面包纸模", "cylinder", "#adb29b", [0, 0.06, 0], [0.12, 0.12, 0.12]), lobe("高圆面包膨胀拱顶", crust, [0, 0.13, 0], [0.145, 0.09, 0.145]));
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; parts.push(leaf("顶端自然裂开的翻皮", crumb, [0, 0.165, 0], 0.025, 0.05, [90, i * 90, 0]), lobe("烘焙外露果干", filling, [Math.cos(a) * 0.05, 0.153, Math.sin(a) * 0.05], [0.012, 0.007, 0.01])); }
  } else if (kind === 20) {
    parts.push(polygon("布里欧修花边底座", crust, scalloped(0.045, 1, 10), 0.037), lobe("布里欧修颈结", crumb, [0, 0.042, 0], [0.05, 0.04, 0.05]), lobe("布里欧修圆顶", crust, [0, 0.065, 0], [0.043, 0.04, 0.043]));
  } else if (kind === 21) {
    parts.push(sweptProfile("帕芙洛娃中空蛋白酥巢", "#ded9bf", [[0.02, 0], [0.07, 0.005], [0.065, 0.045], [0.052, 0.05], [0.045, 0.02], [0.02, 0.013]], Math.PI * 2, 24));
    for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; parts.push(tapered("蛋白霜挤花尖峰", "#e2dcc2", [[Math.cos(a) * 0.058, 0.02, Math.sin(a) * 0.058], [Math.cos(a) * 0.06, 0.06, Math.sin(a) * 0.06]], [0.009, 0.001])); }
    for (let i = 0; i < 7; i++) { const a = i * 2.4; parts.push(lobe("巢内莓果", "#b7b297", [Math.cos(a) * 0.027, 0.03, Math.sin(a) * 0.027], [0.024, 0.025, 0.024])); }
  } else if (kind === 22) parts.push(icingSpiral([0, 0.012, 0], 0.035, 0.055), lobe("蛋白糖饼底", "#ded9bf", [0, 0.008, 0], [0.085, 0.018, 0.085]));
  else if (kind === 23) {
    const path: Triple[] = Array.from({ length: 31 }, (_, i) => { const a = i * Math.PI * 6 / 30; const r = 0.014 + i * 0.0014; return [Math.cos(a) * r, 0.008 + i * 0.0001, Math.sin(a) * r]; }); parts.push(tube("扎勒比连续盘绕糖炸面线", "#cfb584", path, 0.0045));
  } else if (kind === 24) {
    const outline = scalloped(0.009, 1, 8); const bar = polygon("吉拿棒星形截面长条", crust, outline, 0.19); bar.rotation.x = 90; bar.position.y = 0.01; parts.push(bar);
    const sugar: ModelPart[] = []; for (let i = 0; i < 30; i++) sugar.push(lobe("表面砂糖颗粒", crumb, [Math.sin(i * 2.4) * 0.006, 0.016 + Math.cos(i * 2.4) * 0.003, -i * 0.0057], [0.002, 0.002, 0.002])); parts.push(combineMeshes("不规则砂糖层", crumb, sugar));
  } else if (kind === 25) {
    const outline: [number, number][] = [[0, 0.072], [-0.016, 0.066], [-0.022, 0.042], [-0.055, 0.035], [-0.058, 0.018], [-0.025, 0.011], [-0.029, -0.02], [-0.043, -0.065], [-0.025, -0.075], [0, -0.032], [0.025, -0.075], [0.043, -0.065], [0.029, -0.02], [0.025, 0.011], [0.058, 0.018], [0.055, 0.035], [0.022, 0.042], [0.016, 0.066]];
    parts.push(polygon("姜饼人完整四肢轮廓", crust, outline, 0.008));
    for (const side of [-1, 1]) parts.push(lobe("糖霜眼睛", "#e1d8b7", [side * 0.007, 0.01, 0.053], [0.004, 0.003, 0.004])); for (let i = 0; i < 3; i++) parts.push(lobe("糖霜纽扣", filling, [0, 0.01, 0.018 - i * 0.013], [0.007, 0.003, 0.007]));
  } else if (kind === 26) {
    const outline: [number, number][] = Array.from({ length: 25 }, (_, i) => { const a = i / 24 * Math.PI; return [Math.cos(a) * 0.054, Math.sin(a) * 0.035]; });
    parts.push(polygon("比斯科蒂斜切长饼", crust, [...outline, [0.045, -0.016], [-0.047, -0.016]], 0.022));
    for (let i = 0; i < 9; i++) parts.push(lobe("可见整粒坚果断面", crumb, [(i % 3 - 1) * 0.027, 0.023, Math.floor(i / 3) * 0.011 - 0.007], [0.012, 0.004, 0.006], [0, i * 38, 0]));
  } else if (kind === 27) {
    const cannoli = sweptProfile("卡诺利真实中空卷酥管", crust, [[0.014, 0], [0.018, 0], [0.018, 0.12], [0.014, 0.12]], Math.PI * 1.94, 24); cannoli.rotation.x = 90; cannoli.position.y = 0.02; parts.push(cannoli);
    for (const z of [0, 0.12]) { parts.push(lobe("两端露出的乳酪馅", "#ddd6b9", [0, 0.02, z], [0.03, 0.03, 0.025])); for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5; parts.push(lobe("端面碎坚果", filling, [Math.cos(a) * 0.011, 0.02 + Math.sin(a) * 0.011, z + (z ? 0.008 : -0.008)], [0.006, 0.005, 0.004])); } }
  } else if (kind === 28) {
    for (let level = 0; level < 2; level++) parts.push(part("巴黎布雷斯特环形泡芙层", "torus", crust, [0, 0.014 + level * 0.034, 0], [0.13, 0.13, 0.05], [90, 0, 0]));
    for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; parts.push(lobe("环形夹心裱花", "#dcd1af", [Math.cos(a) * 0.043, 0.032, Math.sin(a) * 0.043], [0.025, 0.03, 0.025])); }
  } else {
    parts.push(lobe("椰蓉球锥形烤体", "#d3c5a2", [0, 0.02, 0], [0.06, 0.045, 0.06]), cap("椰蓉球不规则尖顶", crumb, [0, 0.02, 0], 0.026, 0.035, 1));
    const shreds: ModelPart[] = []; for (let i = 0; i < 35; i++) { const a = i * 2.4; const r = 0.012 + i % 3 * 0.006; shreds.push(needle("烤体上独立椰丝", crumb, [Math.cos(a) * r, 0.02 + i % 4 * 0.006, Math.sin(a) * r], [Math.cos(a + 0.2) * r, 0.025 + i % 4 * 0.006, Math.sin(a + 0.2) * r], 0.002)); } parts.push(combineMeshes("可见立体椰蓉纤维", crumb, shreds));
  }
  return parts;
}

const names = [["mooncake", "月饼"], ["pineappleBun", "菠萝包"], ["dorayaki", "铜锣烧"], ["taiyaki", "鲷鱼烧"], ["crepe", "可丽饼"], ["caramelPudding", "焦糖布丁"], ["doughnut", "甜甜圈"], ["chocolateCookie", "巧克力曲奇"], ["madeleine", "玛德琳"], ["cupcake", "杯子蛋糕"], ["baumkuchen", "树轮蛋糕"], ["lotusPastry", "莲花酥"], ["palmier", "蝴蝶酥"], ["naan", "馕"], ["pita", "皮塔口袋饼"], ["pancake", "松饼"], ["canele", "可露丽"], ["danishPastry", "丹麦酥"], ["babka", "巴布卡面包"], ["panettone", "潘娜托尼"], ["brioche", "布里欧修"], ["pavlova", "帕芙洛娃"], ["meringue", "蛋白糖"], ["jalebi", "扎勒比"], ["churro", "吉拿棒"], ["gingerbreadMan", "姜饼人"], ["biscotti", "比斯科蒂"], ["cannoli", "卡诺利"], ["parisBrest", "巴黎布雷斯特"], ["coconutMacaroon", "椰蓉球"]];

export const bakedFoodDesigns: MasterNatureDesign[] = names.map(([key, name], index) => design(key!, name!, "食品", () => pastry(index), ["独立成形烘焙食品"]));
