import { part, ring, type ModelPart, type Triple } from "../assetModelParts";
import { polygon, tapered } from "../masterNature/shared";
import { box, cylinder, ball, rod, cord, bars, plate, material, type MasterPrototype } from "./parts";

function fanRotor(p: Triple, radius: number): ModelPart[] {
  const [x, y, z] = p;
  return [cylinder("封闭电机轴毂", p, [radius * 0.36, radius * 0.34, radius * 0.36], material.dark, [90, 0, 0]), ...[0, 120, 240].map(a => plate("有迎角的独立扫掠叶片", [x, y, z], [[radius * 0.1, -radius * 0.07], [radius * 0.77, -radius * 0.18], [radius * 0.97, radius * 0.12], [radius * 0.6, radius * 0.33], [radius * 0.1, radius * 0.1]], 0.008, material.steel, [16, 0, a]))];
}

function openHousing(name: string, p: Triple, size: Triple, color = material.ivory): ModelPart[] {
  const [x, y, z] = p, [w, h, d] = size;
  return [box(`${name}底壁`, [x, y - h / 2 + 0.012, z], [w, 0.024, d], color), box(`${name}顶壁`, [x, y + h / 2 - 0.012, z], [w, 0.024, d], color), ...[-1, 1].map(s => box(`${name}左右壁`, [x + s * (w / 2 - 0.012), y, z], [0.024, h - 0.048, d], color)), box(`${name}后壁`, [x, y, z + d / 2 - 0.012], [w - 0.048, h - 0.048, 0.024], color)];
}

export const domesticExpansionBatchSixObjects: MasterPrototype[] = [
  { name: "门楣双贯流风轮空气幕机", theme: "现代", itemType: "设施", build: () => [
    box("空气幕上部整体外罩", [0, 0.24, 0], [1.38, 0.04, 0.25], material.ivory), ...[-1, 1].map(s => box("两端封闭侧罩", [s * 0.675, 0.14, 0], [0.03, 0.22, 0.25], material.ivory)), box("靠门楣固定的后背板", [0, 0.14, 0.11], [1.33, 0.22, 0.03], material.ivory),
    ...[-1, 1].map(s => cylinder("沿门宽布置的独立贯流叶轮", [s * 0.32, 0.13, 0.015], [0.115, 0.56, 0.115], material.dark, [0, 0, 90])), cylinder("两风轮中间驱动电机", [0, 0.13, 0.015], [0.1, 0.095, 0.1], material.steel, [0, 0, 90]),
    ...bars("向室内回风的真实前栅条", 16, [0, 0.15, -0.123], 1.21, [0.009, 0.15, 0.018], 0, material.dark), ...[-1, 1].map(s => box("向下喷口两侧的长收边", [0, 0.023, s * 0.027], [1.28, 0.025, 0.015], material.ivory)),
    ...bars("下吹喷口内独立短导叶", 12, [0, 0.026, 0], 1.13, [0.007, 0.04, 0.04], 0), box("机端低压控制面板", [0.61, 0.15, -0.142], [0.055, 0.1, 0.02], material.dark),
  ] },
  { name: "四边环形换热卡式空调室内机", theme: "现代", itemType: "设施", build: () => {
    const vents: [number, number][][] = [Array.from({ length: 16 }, (_, i): [number, number] => { const a = i * Math.PI / 8; return [Math.cos(a) * 0.19, Math.sin(a) * 0.19]; })];
    for (const side of [-1, 1]) vents.push([[-0.31, side * 0.34 - 0.022], [0.31, side * 0.34 - 0.022], [0.31, side * 0.34 + 0.022], [-0.31, side * 0.34 + 0.022]], [[side * 0.34 - 0.022, -0.31], [side * 0.34 + 0.022, -0.31], [side * 0.34 + 0.022, 0.31], [side * 0.34 - 0.022, 0.31]]);
    const result: ModelPart[] = [polygon("中央回风与四边送风均贯通的下面板", material.ivory, [[-0.45, -0.45], [0.45, -0.45], [0.45, 0.45], [-0.45, 0.45]], 0.025, [0, 0.015, 0], vents), box("吊顶内机组上盖", [0, 0.3, 0], [0.76, 0.025, 0.76], material.steel), cylinder("中部竖轴离心风轮", [0, 0.16, 0], [0.27, 0.13, 0.27], material.dark), ...bars("中央回风口的可透空格条", 9, [0, 0.01, 0], 0.31, [0.01, 0.008, 0.29], 0, material.dark)];
    for (const side of [-1, 1]) result.push(box("左右环绕式翅片换热排", [side * 0.3, 0.16, 0], [0.075, 0.22, 0.58], material.wood), box("前后环绕式翅片换热排", [0, 0.16, side * 0.3], [0.52, 0.22, 0.075], material.wood), box("左右出风转向长导叶", [side * 0.34, 0.018, 0], [0.025, 0.008, 0.56], material.ivory, [0, 0, side * 15]), box("前后出风转向长导叶", [0, 0.018, side * 0.34], [0.56, 0.008, 0.025], material.ivory, [side * 15, 0, 0]));
    result.push(...[0.12, 0.23].map(y => ring("内机一侧冷媒连接管", material.steel, 0.011, 0.003, 0, 0.15, { position: { x: 0.4, y, z: 0.08 }, rotation: { x: 0, y: 0, z: 90 } })), ...[-1, 1].flatMap(x => [-1, 1].map(z => box("避开四边送风槽而连接上下板的角部承重立架", [x * 0.342, 0.165, z * 0.342], [0.022, 0.27, 0.022], material.steel)))); return result;
  } },
  { name: "卧式吊装三蜗壳风机盘管机组", theme: "现代", itemType: "设施", build: () => {
    const result: ModelPart[] = [box("暴露式盘管机组底盘", [0, 0.025, 0], [1.22, 0.05, 0.62], material.steel), box("盘管机组的上部薄顶板", [0, 0.31, -0.07], [1.22, 0.025, 0.48], material.steel), ...[-1, 1].map(s => box("两侧管端封板", [s * 0.595, 0.17, -0.07], [0.03, 0.28, 0.48], material.steel)), ...bars("前方整排水冷换热翅片", 16, [0, 0.17, -0.22], 1.04, [0.014, 0.23, 0.09], 0, material.wood)];
    for (const x of [-0.39, 0, 0.39]) result.push(cylinder("独立蜗壳风机圆筒", [x, 0.16, 0.12], [0.23, 0.24, 0.23], material.dark, [0, 0, 90]), ring("风机侧面开放吸入口", material.steel, 0.078, 0.012, 0, 0.025, { position: { x: x + 0.13, y: 0.16, z: 0.12 }, rotation: { x: 0, y: 0, z: 90 } }));
    for (const y of [0.09, 0.24]) result.push(rod("换热器侧端供回水横向管", [-0.57, y, -0.2], [-0.74, y, -0.2], 0.026, material.steel));
    for (const x of [-0.53, 0.53]) for (const z of [-0.22, 0.22]) result.push(polygon("有真实吊杆孔的连接耳", material.dark, [[-0.05, -0.0425], [0.05, -0.0425], [0.05, 0.0425], [-0.05, 0.0425]], 0.025, [x, 0.2975, z], [Array.from({ length: 8 }, (_, i): [number, number] => { const a = i * Math.PI / 4; return [Math.cos(a) * 0.012, Math.sin(a) * 0.012]; })]));
    return result;
  } },
  { name: "跨窗桥接双体马鞍式空调", theme: "现代", itemType: "设施", build: () => [
    ...openHousing("窗内送风单元", [0, 0.31, -0.35], [0.55, 0.53, 0.31]), ...openHousing("窗外压缩换热单元", [0, 0.32, 0.41], [0.57, 0.58, 0.36], material.steel),
    box("跨过窗台的独立细桥", [0, 0.59, 0.02], [0.32, 0.055, 0.56], material.ivory), ...[-1, 1].map(s => box("跨窗桥两端竖向连接颈", [0, 0.52, 0.02 + s * 0.27], [0.32, 0.15, 0.055], material.ivory)),
    ring("室内送风圆口护圈", material.dark, 0.2, 0.025, 0, 0.025, { position: { x: 0, y: 0.31, z: -0.515 }, rotation: { x: 90, y: 0, z: 0 } }), ...fanRotor([0, 0.31, -0.49], 0.18),
    ring("室外排风开放护环", material.dark, 0.2, 0.02, 0, 0.035, { position: { x: 0, y: 0.33, z: 0.61 }, rotation: { x: 90, y: 0, z: 0 } }), ...fanRotor([0, 0.33, 0.59], 0.18), cylinder("窗外单元下方独立压缩机", [0.14, 0.18, 0.4], [0.14, 0.22, 0.14], material.dark),
    box("室内正面程序触控条", [0, 0.56, -0.52], [0.34, 0.055, 0.018], material.glass),
  ] },
  { name: "长叶无罩下垂杆式吊扇", theme: "现代", itemType: "设施", build: () => {
    const result: ModelPart[] = [cylinder("吊顶安装圆盘", [0, 0.63, 0], [0.23, 0.055, 0.23], material.ivory), cylinder("圆盘下方独立悬吊杆", [0, 0.415, 0], [0.04, 0.41, 0.04], material.steel), cylinder("承接五叶的扁圆转子罩", [0, 0.18, 0], [0.23, 0.12, 0.23], material.ivory)];
    for (let i = 0; i < 5; i++) {
      const blade = polygon("有实际翼面倾角的长扇叶", material.wood, [[0.12, -0.035], [0.69, -0.06], [0.8, 0.025], [0.69, 0.07], [0.12, 0.035]], 0.012, [0, 0.17, 0]);
      for (const v of blade.vertices!) v.y += v.z * Math.tan(9 * Math.PI / 180);
      const ear = polygon("从转子罩内伸出并实际接住叶根的独立安装耳", material.steel, [[0.085, -0.018], [0.17, -0.026], [0.17, 0.026], [0.085, 0.018]], 0.012, [0, 0.164, 0]);
      ear.rotation.y = i * 72;
      blade.rotation.y = i * 72; result.push(ear, blade);
    }
    result.push(ball("下部小型整流圆盖", [0, 0.102, 0], [0.14, 0.06, 0.14], material.dark)); return result;
  } },
  { name: "绳驱布面摇摆吊扇", theme: "异域", itemType: "设施", build: () => [
    box("吊扇上沿整根摆动木横梁", [0, 1.42, 0], [2.4, 0.065, 0.065], material.wood), box("大幅垂挂送风布面", [0, 1.1, 0], [2.31, 0.57, 0.008], material.ivory), box("布面底部张紧木条", [0, 0.805, 0], [2.36, 0.035, 0.032], material.wood),
    ...[-1, 1].map(s => rod("上横梁两端的承吊索", [s * 0.91, 1.43, 0], [s * 0.91, 2.05, 0], 0.012, material.dark)), ...[-1, 1].map(s => ring("天花承吊枢环", material.dark, 0.03, 0.007, 0, 0.017, { position: { x: s * 0.91, y: 2.07, z: 0 }, rotation: { x: 90, y: 0, z: 0 } })),
    ring("一侧牵绳导向小滑轮", material.steel, 0.035, 0.009, 0, 0.02, { position: { x: 1.49, y: 2.05, z: 0.06 }, rotation: { x: 90, y: 0, z: 0 } }), cord("牵动整幅布扇往复摆动的长索", [[1.13, 1.41, 0.03], [1.49, 2.05, 0.06], [1.72, 1.2, 0.06], [1.72, 0.33, 0.06]], 0.006, material.dark), cylinder("长索末端持握木坠", [1.72, 0.28, 0.06], [0.035, 0.11, 0.035], material.wood),
  ] },
  { name: "拱腔卧台一体蓄热砖炉", theme: "欧式", itemType: "设施", build: () => {
    const result: ModelPart[] = [box("高位炉床下的耐火承重基台", [0, 0.34, 0.13], [1.7, 0.68, 2.3], material.ivory), box("拱形炊烤火腔的真实炉床", [0, 0.78, 0.22], [1.46, 0.15, 1.73], material.wood), ...[-1, 1].map(s => box("左右厚蓄热侧墙", [s * 0.74, 1.15, 0.25], [0.22, 0.75, 1.8], material.ivory)), box("火腔后侧实体炉墙", [0, 1.14, 1.1], [1.4, 0.75, 0.19], material.ivory), box("集热后可卧的完整上层平台", [0, 1.79, 0.22], [1.73, 0.18, 2.12], material.ivory), box("炉前可置炊具的伸出平台", [0, 0.81, -1.02], [1.74, 0.13, 0.53], material.ivory)];
    const arch: [number, number][] = [...Array.from({ length: 13 }, (_, i): [number, number] => { const a = Math.PI - i * Math.PI / 12; return [Math.cos(a) * 0.64, Math.sin(a) * 0.55]; }), ...Array.from({ length: 13 }, (_, i): [number, number] => { const a = i * Math.PI / 12; return [Math.cos(a) * 0.49, Math.sin(a) * 0.4]; })];
    result.push(part("真正保留炊烤拱腔的连续券壳", "extrude", material.wood, [0, 1.04, 0.25], [1, 1, 1], [0, 0, 0], { profile: arch.map(([x, y]) => ({ x, y })), depth: 1.64 }), ...[-1, 1].map(s => box("炉前拱口两边的厚炉颊", [s * 0.61, 1.08, -0.64], [0.22, 0.5, 0.19], material.ivory)), box("炉口上方集烟室后壁", [0, 1.61, -0.77], [0.95, 0.57, 0.06], material.ivory), ...[-1, 1].map(s => box("前集烟罩左右侧壁", [s * 0.45, 1.61, -0.96], [0.06, 0.57, 0.4], material.ivory)), box("集烟罩前壁", [0, 1.68, -1.13], [0.96, 0.43, 0.06], material.ivory));
    const chimney = polygon("从前集烟罩贯通至上部的方烟囱", material.ivory, [[-0.24, -0.22], [0.24, -0.22], [0.24, 0.22], [-0.24, 0.22]], 1.06, [0, 1.87, -0.94], [[[-0.17, -0.15], [-0.17, 0.15], [0.17, 0.15], [0.17, -0.15]]]);
    result.push(chimney, box("侧面伸进烟道的可调挡烟闸柄", [0.34, 2.04, -0.94], [0.27, 0.025, 0.045], material.dark)); return result;
  } },
  { name: "立篮温石燃薪桑拿加热炉", theme: "欧式", itemType: "设施", build: () => {
    const result: ModelPart[] = [box("下部燃薪炉室", [0, 0.29, 0], [0.47, 0.52, 0.55], material.dark), box("炉门耐热玻璃压框", [0, 0.31, -0.29], [0.33, 0.32, 0.025], material.steel), { ...box("炉门内玻璃", [0, 0.31, -0.307], [0.26, 0.25, 0.008], material.glass), opacity: 0.3 }, rod("炉门侧向握柄", [0.15, 0.21, -0.335], [0.15, 0.4, -0.335], 0.018), box("下置可抽灰斗", [0, 0.075, -0.025], [0.39, 0.09, 0.48], material.steel), ring("上部中空石篮底圈", material.steel, 0.29, 0.02, 0.57, 0.04), ring("石篮顶端包口", material.steel, 0.29, 0.02, 0.91, 0.035)];
    for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; result.push(rod("保留间隙的石篮独立栏条", [Math.cos(a) * 0.28, 0.57, Math.sin(a) * 0.28], [Math.cos(a) * 0.28, 0.91, Math.sin(a) * 0.28], 0.014, material.steel)); }
    for (let i = 0; i < 10; i++) { const a = i * 2.4, r = i % 2 ? 0.19 : 0.1; result.push(ball("篮内可蓄热的独立炉石", [Math.cos(a) * r, 0.66 + Math.floor(i / 5) * 0.13, Math.sin(a) * r], [0.15, 0.12, 0.13], material.wood)); }
    result.push(ring("穿过石篮后的独立排烟管", material.dark, 0.061, 0.006, 1.26, 0.8, { position: { x: 0, y: 1.26, z: 0.17 } }), ...[-1, 1].flatMap(x => [-1, 1].map(z => box("炉体独立短支足", [x * 0.18, 0.025, z * 0.2], [0.065, 0.05, 0.065], material.steel)))); return result;
  } },
  { name: "蓄砖储热自然对流电暖柜", theme: "现代", itemType: "设施", build: () => [
    ...openHousing("壁边蓄热柜", [0, 0.43, 0], [0.94, 0.78, 0.27]), ...[-1, 1].map(s => box("柜体落地长足", [s * 0.32, 0.025, 0], [0.14, 0.05, 0.33], material.dark)),
    ...Array.from({ length: 9 }, (_, i) => box("柜内分层独立储热耐火砖", [(i % 3 - 1) * 0.24, 0.21 + Math.floor(i / 3) * 0.19, 0.02], [0.225, 0.17, 0.17], material.wood)), ...bars("前部送暖格栅竖肋", 13, [0, 0.42, -0.139], 0.82, [0.01, 0.62, 0.016], 0, material.steel),
    ...bars("底部冷空气进风短栅", 9, [0, 0.095, -0.15], 0.76, [0.015, 0.07, 0.02], 0, material.dark), rod("贯穿蓄砖层下方的电加热芯", [-0.37, 0.17, 0.015], [0.37, 0.17, 0.015], 0.012, material.dark),
    cylinder("上端蓄热温度旋钮", [0.34, 0.82, -0.03], [0.045, 0.025, 0.045], material.dark), cylinder("暖气释放挡板调节钮", [0.22, 0.82, -0.03], [0.045, 0.025, 0.045], material.dark),
  ] },
  // 只参考上冰舱、下藏格和融水盘的工作布局；没有引用远端模型或馆藏图像。
  // https://www.museum.qld.gov.au/-/media/project/qm/qm-website/learn-and-discover/learning-resources-platform/pdfs/w/qm281-whats-the-matter-trb-20230120.pdf
  { name: "上冰下藏双舱木制冰箱", theme: "欧式", itemType: "设施", build: () => [
    ...openHousing("厚木隔热冰箱", [0, 0.76, 0], [0.76, 1.32, 0.55], material.wood), box("藏物格与上冰仓间的通风承板", [0, 1.02, 0], [0.7, 0.045, 0.49], material.steel), ...[-1, 1].map(s => box("冰仓内的金属防渗衬墙", [s * 0.337, 1.23, 0], [0.012, 0.36, 0.48], material.steel)),
    box("可抽出的融冰积水盘", [0, 0.19, 0], [0.63, 0.04, 0.41], material.steel), ...[0.43, 0.71].flatMap(y => bars("下藏室透空搁条", 9, [0, y, 0], 0.6, [0.018, 0.018, 0.43], 0, material.wood)),
    box("左侧上冰仓独立小门", [-0.19, 1.22, -0.29], [0.32, 0.34, 0.04], material.wood), box("右侧上冰仓独立小门", [0.19, 1.22, -0.29], [0.32, 0.34, 0.04], material.wood),
    box("下藏室向外旋开的隔热门", [0.36 - 0.35 * Math.cos(105 * Math.PI / 180), 0.61, -0.28 - 0.35 * Math.sin(105 * Math.PI / 180)], [0.7, 0.72, 0.05], material.wood, [0, -105, 0]), rod("下藏门独立竖向铰轴", [0.36, 0.26, -0.28], [0.36, 0.96, -0.28], 0.018, material.dark),
    ...[-1, 1].flatMap(x => [-1, 1].map(z => box("木冰箱底部四角足", [x * 0.29, 0.065, z * 0.2], [0.07, 0.13, 0.07], material.wood))), ring("冰仓向底盘排水的立管", material.steel, 0.012, 0.003, 0.64, 0.77, { position: { x: 0.29, y: 0.64, z: 0.2 } }),
  ] },
  // 摆动的是整只带内肋容器，并非把电动波轮机换成木纹。
  // https://victoriancollections.net.au/items/50ac43492162ef097c7d0f22
  { name: "带内棱摇桶式木制洗衣机", theme: "欧式", itemType: "设施", build: () => {
    const result: ModelPart[] = [...[-1, 1].flatMap(x => [-1, 1].map(z => rod("承接桶侧转轴的四脚框架", [x * 0.46, 0.025, z * 0.35], [x * 0.46, 0.89, 0], 0.055, material.wood))), cylinder("摇桶两侧共同贯通的水平轴", [0, 0.89, 0], [0.055, 1.02, 0.055], material.dark, [0, 0, 90])];
    const shell: [number, number][] = [...Array.from({ length: 13 }, (_, i): [number, number] => { const a = Math.PI + i * Math.PI / 12; return [Math.cos(a) * 0.38, 0.47 + Math.sin(a) * 0.37]; }), ...Array.from({ length: 13 }, (_, i): [number, number] => { const a = Math.PI * 2 - i * Math.PI / 12; return [Math.cos(a) * 0.345, 0.47 + Math.sin(a) * 0.335]; })];
    result.push(part("上部敞口的连续半圆摇桶壳", "extrude", material.wood, [0, 0.44, 0], [1, 1, 1], [0, 90, 0], { profile: shell.map(([x, y]) => ({ x, y })), depth: 0.78 }));
    for (const side of [-1, 1]) result.push(plate("摇桶两侧封闭木端板", [side * 0.4, 0.44, 0], [[-0.375, 0.47], [-0.3, 0.23], [-0.17, 0.13], [0.17, 0.13], [0.3, 0.23], [0.375, 0.47]], 0.025, material.wood, [0, 90, 0]));
    for (let i = 0; i < 9; i++) { const a = Math.PI + (i + 1) * Math.PI / 10; result.push(rod("桶内产生搓洗作用的真实凸棱", [-0.36, 0.91 + Math.sin(a) * 0.326, -Math.cos(a) * 0.326], [0.36, 0.91 + Math.sin(a) * 0.326, -Math.cos(a) * 0.326], 0.018, material.ivory)); }
    result.push(rod("桶侧摇动长柄", [0.48, 0.89, 0], [0.48, 1.29, -0.23], 0.035, material.dark), rod("长柄末端横握套", [0.48, 1.29, -0.23], [0.66, 1.29, -0.23], 0.04, material.wood)); return result;
  } },
  { name: "换向轮悬吊五腿搅柱洗衣机", theme: "欧式", itemType: "设施", build: () => {
    const result: ModelPart[] = [part("真正敞口的固定木制洗衣桶", "lathe", material.wood, [0, 0.15, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: 0.3, y: 0 }, { x: 0.37, y: 0.61 }, { x: 0.34, y: 0.61 }, { x: 0.275, y: 0.03 }, { x: 0, y: 0.03 }] }), ...[0.26, 0.66].map(y => ring("固定木桶收束金属箍", material.dark, 0.3 + (y - 0.15) / 0.61 * 0.07, 0.012, y, 0.035)), ...[-1, 1].map(s => rod("搅柱上方的承轴立柱", [s * 0.4, 0.06, 0.09], [s * 0.4, 1.4, 0.09], 0.055, material.wood)), rod("搅柱顶部的共用横架", [-0.42, 1.4, 0.09], [0.42, 1.4, 0.09], 0.055, material.wood), cylinder("桶内悬吊的竖直搅拌主轴", [0, 0.87, 0], [0.055, 1.13, 0.055], material.wood), cylinder("主轴上端的换向冠轮", [0, 1.17, 0], [0.28, 0.035, 0.28], material.dark), ring("上部真实承接搅柱的轴承圈", material.dark, 0.045, 0.015, 1.4, 0.04)];
    for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5; result.push(rod("悬吊搅拌柱下方五根独立拨腿", [0, 0.4, 0], [Math.cos(a) * 0.2, 0.25, Math.sin(a) * 0.2], 0.026, material.wood)); }
    for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; result.push(cylinder("换向冠轮外缘竖向插销齿", [Math.cos(a) * 0.12, 1.2, Math.sin(a) * 0.12], [0.017, 0.06, 0.017], material.wood)); }
    result.push(ring("竖直手摇驱动大轮", material.dark, 0.25, 0.025, 0, 0.045, { position: { x: 0.47, y: 1.13, z: 0.09 }, rotation: { x: 0, y: 0, z: 90 } }), cylinder("大轮至换向冠轮的横轴", [0.24, 1.13, 0.09], [0.035, 0.5, 0.035], material.steel, [0, 0, 90]), cylinder("大轮中心实际连接横轴的轮毂", [0.47, 1.13, 0.09], [0.06, 0.055, 0.06], material.dark, [0, 0, 90]), cylinder("横轴上的小型啮合齿轮芯", [0.1, 1.13, 0.09], [0.085, 0.035, 0.085], material.dark, [0, 0, 90]), rod("大轮侧边的手摇握柄", [0.49, 1.365, 0.09], [0.66, 1.365, 0.09], 0.032, material.wood), ...[-1, 1].map(s => rod("上横架侧向抱住轴承圈的短耳", [s * 0.04, 1.4, 0.09], [s * 0.04, 1.4, 0], 0.014, material.steel)));
    for (const a of [0, Math.PI * 2 / 3, Math.PI * 4 / 3]) result.push(rod("中心轴毂至大轮外圈的实木辐条", [0.47, 1.13, 0.09], [0.47, 1.13 + Math.cos(a) * 0.235, 0.09 + Math.sin(a) * 0.235], 0.018, material.wood));
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; result.push(cylinder("小轮上进入冠轮销齿间的横向齿销", [0.1, 1.13 + Math.cos(a) * 0.045, 0.09 + Math.sin(a) * 0.045], [0.012, 0.045, 0.012], material.wood, [0, 0, 90])); }
    return result;
  } },
  // 石载箱往复压过卷衣滚木，区别两根夹辊相互挤压的旧轧衣绞架。
  // https://museum.wales/collections/online/object/b02c1974-eb0c-392b-bbc5-77e3f55402f4/Box-mangle/
  { name: "石载往复箱式冷轧衣机", theme: "欧式", itemType: "设施", build: () => {
    const result: ModelPart[] = [...[-1, 1].flatMap(x => [-1, 1].map(z => box("重型木床四角足", [x * 0.79, 0.41, z * 0.33], [0.1, 0.82, 0.1], material.wood))), box("承接卷衣滚木的平整下床", [0, 0.83, 0], [1.91, 0.12, 0.88], material.wood), ...[-1, 1].map(s => box("防止重箱侧滑的长木导缘", [0, 1.04, s * 0.42], [1.92, 0.27, 0.055], material.wood))];
    for (const x of [-0.53, 0, 0.53]) result.push(cylinder("平铺布料绕覆的独立横向滚木", [x, 0.96, 0], [0.16, 0.7, 0.16], material.ivory, [90, 0, 0]));
    result.push(box("载石重箱下部压衣底板", [0, 1.075, 0], [1.54, 0.09, 0.71], material.wood), ...[-1, 1].map(s => box("重箱两侧挡石围壁", [0, 1.25, s * 0.33], [1.56, 0.29, 0.055], material.wood)), ...[-1, 1].map(s => box("重箱前后端围板", [s * 0.75, 1.25, 0], [0.055, 0.29, 0.67], material.wood)), ...[-0.42, 0, 0.42].map(x => box("重箱内完整独立压重石块", [x, 1.2, 0], [0.38, 0.2, 0.54], material.steel)), cylinder("后端牵链手摇轴", [0, 1.42, 0.47], [0.07, 1.86, 0.07], material.dark, [0, 0, 90]), ...[-1, 1].map(s => rod("牵链轴两侧的立式承架", [s * 0.83, 0.87, 0.42], [s * 0.83, 1.42, 0.47], 0.055, material.wood)), rod("摇轴侧端曲柄", [0.97, 1.42, 0.47], [0.97, 1.61, 0.47], 0.027, material.dark), rod("曲柄木质手握套", [0.97, 1.61, 0.47], [1.1, 1.61, 0.47], 0.04, material.wood)); return result;
  } },
  // 双作用风囊与独立清扫软管依据馆藏原理说明，自制外形不复制商标和馆藏图像。
  // https://collection.powerhouse.com.au/object/243981
  { name: "双风囊手摇真空清扫机", theme: "欧式", itemType: "设施", build: () => {
    const result: ModelPart[] = [box("双作用风囊固定脚板", [0, 0.035, 0], [0.45, 0.07, 0.63], material.wood), ...[-1, 1].map(s => box("夹持风囊的两侧木面", [s * 0.17, 0.34, 0.04], [0.035, 0.52, 0.37], material.wood)), box("前部收尘抽盒", [0, 0.15, -0.22], [0.27, 0.2, 0.15], material.dark), rod("向前后摆动的操作长柄", [0, 0.31, 0.05], [0, 1.27, 0.2], 0.035, material.wood)];
    for (let i = 0; i < 8; i++) result.push(box("形成风囊折边的独立窄皮褶", [0, 0.12 + i * 0.055, 0.04], [i % 2 ? 0.3 : 0.265, 0.025, i % 2 ? 0.37 : 0.33], material.wood));
    result.push(cord("风囊至独立吸头的清扫软管", [[0.13, 0.14, -0.24], [0.34, 0.07, -0.45], [0.53, 0.07, -0.6], [0.64, 0.6, -0.76]], 0.025, material.dark), rod("吸头可持握的硬质延长管", [0.64, 0.6, -0.76], [0.64, 0.08, -1.02], 0.025, material.wood), box("接地的独立扁宽吸口", [0.64, 0.045, -1.04], [0.24, 0.06, 0.075], material.dark), rod("吸口下方前侧压边", [0.52, 0.013, -1.075], [0.76, 0.013, -1.075], 0.007, material.wood)); return result;
  } },
  { name: "抽线切口轴卷牙线盒", theme: "现代", itemType: "器物", build: () => [
    cylinder("扁圆密闭牙线卷仓", [0, 0.015, 0], [0.048, 0.03, 0.048], material.ivory), ring("透过卷仓可辨的绕线线团", material.wood, 0.017, 0.008, 0.016, 0.016), cylinder("卷仓中央自由转轴", [0, 0.015, 0], [0.006, 0.024, 0.006], material.steel),
    box("盒顶抽线台", [0.008, 0.033, -0.01], [0.028, 0.006, 0.013], material.ivory), box("抽线台上翘起的薄金属切口", [0.014, 0.038, -0.01], [0.01, 0.001, 0.008], material.steel, [0, 0, 20]),
    tapered("由仓内到切口的亚毫米牙线", material.ivory, [[-0.005, 0.034, -0.01], [0.009, 0.038, -0.01], [0.021, 0.037, -0.01]], [0.00015, 0.00015, 0.00015]),
  ] },
  { name: "软管指套婴儿牙刷", theme: "现代", itemType: "器物", build: () => {
    const result: ModelPart[] = [part("下口能套入手指的柔性封顶薄套", "lathe", material.glass, [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0.01, y: 0 }, { x: 0.011, y: 0.035 }, { x: 0.009, y: 0.048 }, { x: 0, y: 0.052 }, { x: 0, y: 0.05 }, { x: 0.0075, y: 0.046 }, { x: 0.009, y: 0.034 }, { x: 0.008, y: 0 }, { x: 0.01, y: 0 }], opacity: 0.4 })];
    for (let row = 0; row < 4; row++) for (let col = 0; col < 5; col++) result.push(part("指腹一侧独立软胶刷齿", "cone", material.ivory, [(col - 2) * 0.0025, 0.023 + row * 0.006, -0.012], [0.0015, 0.004, 0.0015], [-90, 0, 0]));
    return result;
  } },
  { name: "掌心柔齿洁面刷", theme: "现代", itemType: "器物", build: () => {
    const result: ModelPart[] = [ball("掌心椭圆柔性刷垫", [0, 0.009, 0], [0.075, 0.018, 0.055], material.wood), cord("刷垫背后的可穿指弧扣", [[-0.019, 0.007, 0.005], [-0.018, -0.014, 0.005], [0.018, -0.014, 0.005], [0.019, 0.007, 0.005]], 0.005, material.wood)];
    for (let row = 0; row < 5; row++) for (let col = 0; col < 7; col++) { const x = (col - 3) * 0.009, z = (row - 2) * 0.009; if ((x / 0.033) ** 2 + (z / 0.024) ** 2 > 1) continue; const y = 0.009 + Math.sqrt(1 - (x / 0.0375) ** 2 - (z / 0.0275) ** 2) * 0.009; result.push(part("短柔胶清洁齿", "cone", material.ivory, [x, y + 0.003, z], [0.002, 0.006, 0.002])); }
    return result;
  } },
  { name: "开口套手搓澡巾", theme: "现代", itemType: "器物", build: () => {
    const outside: [number, number][] = [[-0.058, 0], [0.058, 0], [0.063, 0.11], [0.05, 0.16], [0.02, 0.183], [-0.02, 0.183], [-0.05, 0.16], [-0.063, 0.11]], sideWall: [number, number][] = [...outside.slice(1), outside[0]!, [-0.055, 0], [-0.06, 0.109], [-0.047, 0.158], [-0.019, 0.18], [0.019, 0.18], [0.047, 0.158], [0.06, 0.109], [0.055, 0]];
    return [plate("手背侧完整巾面", [0, 0, 0.008], outside, 0.001, material.ivory, [0, 0, 0]), plate("摩擦侧完整巾面", [0, 0, -0.008], outside, 0.001, material.wood, [0, 0, 0]), part("沿两侧与圆顶连接而腕口开放的布边", "extrude", material.wood, [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: sideWall.map(([x, y]) => ({ x, y })), depth: 0.016 }), ...[-1, 1].map(s => box("巾口弹性短束边", [0, 0.007, s * 0.008], [0.117, 0.014, 0.002], material.dark))];
  } },
  { name: "抽绳球网沐浴起泡袋", theme: "现代", itemType: "器物", build: () => {
    const result: ModelPart[] = [];
    for (let i = -3; i <= 3; i++) { const y = i * 0.0115; result.push(ring("真实留空的纬向泡网圈", material.ivory, Math.sqrt(0.05 ** 2 - y ** 2), 0.0015, 0.06 + y, 0.002)); }
    for (let i = 0; i < 8; i++) result.push(ring("穿过球面两极的经向泡网圈", material.ivory, 0.05, 0.0015, 0, 0.002, { position: { x: 0, y: 0.06, z: 0 }, rotation: { x: 0, y: i * 22.5, z: 90 } }));
    result.push(cylinder("上口收束颈圈", [0, 0.113, 0], [0.014, 0.016, 0.014], material.wood), cord("可提起并收紧袋口的挂绳", [[-0.006, 0.115, 0], [-0.012, 0.16, 0], [0.012, 0.16, 0], [0.006, 0.115, 0]], 0.002, material.dark)); return result;
  } },
  { name: "弯指掌爪长柄挠背器", theme: "现代", itemType: "器物", build: () => {
    const result: ModelPart[] = [rod("木质长持握柄", [0, 0.014, 0.22], [0, 0.014, -0.17], 0.018, material.wood), ball("连接五爪的手掌形头部", [0, 0.014, -0.192], [0.045, 0.018, 0.053], material.wood)];
    for (let i = 0; i < 5; i++) { const x = (i - 2) * 0.009, reach = 0.024 - Math.abs(i - 2) * 0.003; result.push(tapered("端部向内弯折的独立挠背指爪", material.wood, [[x, 0.014, -0.202], [x, 0.012, -0.22 - reach], [x, 0.001, -0.226 - reach]], [0.003, 0.0027, 0.002])); }
    result.push(cylinder("柄尾防滑包套", [0, 0.014, 0.17], [0.025, 0.11, 0.025], material.dark, [90, 0, 0])); return result;
  } },
  { name: "四槽柔性足趾分离垫", theme: "现代", itemType: "器物", build: () => {
    const outline: [number, number][] = [[-0.053, -0.02], [0.053, -0.02], [0.053, 0.02]];
    for (const center of [0.035, 0.012, -0.012, -0.035]) for (let i = 0; i <= 6; i++) { const a = i * Math.PI / 6; outline.push([center + Math.cos(a) * 0.008, 0.02 - Math.sin(a) * 0.019]); }
    outline.push([-0.053, 0.02]);
    return [polygon("以四个开放圆槽分开足趾的软垫", material.wood, outline, 0.018)];
  } },
  { name: "双叉大小珠面部滚压器", theme: "现代", itemType: "器物", build: () => {
    const result: ModelPart[] = [rod("细长双端持握主柄", [0, 0.02, -0.036], [0, 0.02, 0.059], 0.013, material.wood), cylinder("大滚珠真正贯穿的承轴", [0, 0.02, -0.067], [0.004, 0.057, 0.004], material.steel, [0, 0, 90]), cylinder("小滚珠真正贯穿的承轴", [0, 0.02, 0.084], [0.003, 0.035, 0.003], material.steel, [0, 0, 90])];
    for (const side of [-1, 1]) result.push(cord("大滚珠外部独立双叉", [[0, 0.02, -0.036], [side * 0.028, 0.02, -0.045], [side * 0.028, 0.02, -0.067]], 0.0025, material.steel), cord("小滚珠外部独立双叉", [[0, 0.02, 0.059], [side * 0.017, 0.02, 0.069], [side * 0.017, 0.02, 0.084]], 0.002, material.steel));
    result.push(ball("沿横轴自由转动的长椭圆大珠", [0, 0.02, -0.067], [0.05, 0.025, 0.025], material.glass), ball("沿另一横轴转动的小珠", [0, 0.02, 0.084], [0.029, 0.016, 0.016], material.glass)); return result;
  } },
  { name: "磁吸悬挂无托盘皂架", theme: "现代", itemType: "器物", build: () => [
    cylinder("贴墙的圆形安装盘", [0, 0.1, 0.015], [0.07, 0.01, 0.07], material.steel, [90, 0, 0]), cord("从墙盘伸出的弯折支臂", [[0, 0.1, 0.01], [0, 0.14, -0.018], [0, 0.14, -0.075], [0, 0.112, -0.075]], 0.008, material.steel), cylinder("支臂下端的圆形磁体", [0, 0.11, -0.075], [0.017, 0.012, 0.017], material.dark),
    box("被磁体悬挂的整块肥皂", [0, 0.08, -0.075], [0.071, 0.04, 0.047], material.wood), cylinder("压入皂块表面的金属吸附帽", [0, 0.101, -0.075], [0.02, 0.006, 0.02], material.steel),
  ] },
  { name: "双柄弯转弹簧面部除毛器", theme: "现代", itemType: "器物", build: () => {
    const result: ModelPart[] = [], count = 324;
    const path = Array.from({ length: count + 1 }, (_, i): Triple => { const turn = i / count * Math.PI * 2 * 54, a = Math.PI - i / count * Math.PI, r = 0.045 + Math.cos(turn) * 0.0035; return [Math.cos(a) * r, 0.012 + Math.sin(turn) * 0.0035, Math.sin(a) * r]; });
    for (let start = 0; start < count; start += 54) { const segment = path.slice(start, start + 55); result.push(tapered("沿U形弯曲的连续细丝弹簧段", material.steel, segment, segment.map(() => 0.0007))); }
    for (const side of [-1, 1]) result.push(cylinder("弹簧两端可相向旋转的持握柄", [side * 0.045, 0.012, -0.036], [0.014, 0.077, 0.014], material.wood, [90, 0, 0]));
    return result;
  } },
  { name: "插槽底盘弹性弓板背伸支架", theme: "现代", itemType: "器物", build: () => {
    const profile: { x: number; y: number }[] = [...Array.from({ length: 9 }, (_, i) => { const z = -0.19 + i * 0.0475; return { x: z, y: 0.026 + 0.086 * (1 - (z / 0.19) ** 2) }; }), ...Array.from({ length: 9 }, (_, i) => { const z = 0.19 - i * 0.0475; return { x: z, y: 0.018 + 0.086 * (1 - (z / 0.19) ** 2) }; })];
    const result: ModelPart[] = [box("可落地的独立长插槽底盘", [0, 0.01, 0], [0.28, 0.02, 0.44], material.dark), part("前后插入底盘的完整弹性弓板", "extrude", material.wood, [0, 0, 0], [1, 1, 1], [0, 90, 0], { profile, depth: 0.22 })];
    for (const z of [-0.19, 0.15, 0.17, 0.19]) result.push(box("承接弓板端部的独立挡位槽肋", [0, 0.027, z], [0.25, 0.018, 0.01], material.dark));
    return result;
  } },
];
