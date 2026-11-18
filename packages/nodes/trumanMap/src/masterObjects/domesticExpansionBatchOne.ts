import { part, ring, type ModelPart, type Triple } from "../assetModelParts";
import { polygon, tapered } from "../masterNature/shared";
import { box, cylinder, ball, rod, loop, cup, cord, bars, plate, material, type MasterPrototype } from "./parts";

function ventGrid(name: string, center: Triple, width: number, height: number, count = 8): ModelPart[] {
  const [x, y, z] = center;
  return [box(`${name}上缘`, [x, y + height / 2, z], [width, 0.008, 0.012], material.dark), box(`${name}下缘`, [x, y - height / 2, z], [width, 0.008, 0.012], material.dark), ...bars(`${name}独立通风栅条`, count, center, width - 0.014, [0.006, height, 0.012], 0, material.dark)];
}

function uprightShell(name: string, width: number, height: number, depth: number): ModelPart[] {
  return [box(`${name}底盘`, [0, 0.025, 0], [width, 0.05, depth], material.ivory), box(`${name}顶部`, [0, height - 0.018, 0], [width, 0.036, depth], material.ivory), ...[-1, 1].map(side => box(`${name}侧壁`, [side * (width / 2 - 0.012), height / 2, 0], [0.024, height - 0.05, depth], material.ivory)), box(`${name}后壁`, [0, height / 2, depth / 2 - 0.012], [width - 0.045, height - 0.05, 0.024], material.ivory)];
}

function radialBlades(center: Triple, radius: number, count: number, color = material.ivory): ModelPart[] {
  const [x, y, z] = center;
  return Array.from({ length: count }, (_, index) => plate("有迎角的扇叶", [x, y, z], [[0.01, -0.012], [radius * 0.65, -0.025], [radius, 0.025], [radius * 0.8, 0.07], [0.025, 0.025]], 0.008, color, [17, 0, index * 360 / count]));
}

export const domesticExpansionBatchOneObjects: MasterPrototype[] = [
  { name: "冷凝抽屉式家用除湿机", theme: "现代", itemType: "设施", build: () => [
    ...uprightShell("除湿机", 0.34, 0.52, 0.24),
    box("下部抽出接水盒", [0, 0.105, -0.006], [0.288, 0.16, 0.2], material.glass),
    box("接水盒前置拉手", [0, 0.125, -0.131], [0.11, 0.025, 0.025], material.dark),
    ...ventGrid("前置进风口", [0, 0.335, -0.115], 0.28, 0.24, 11),
    ...bars("蒸发器冷凝翅片", 9, [0, 0.34, -0.058], 0.25, [0.008, 0.22, 0.035], 0),
    box("底部集露斜盘", [0, 0.225, -0.015], [0.27, 0.018, 0.15], material.steel, [4, 0, 0]),
    rod("冷凝水下落短管", [0.075, 0.22, 0], [0.075, 0.17, 0], 0.014),
    cylinder("后部密闭压缩机", [0, 0.245, 0.045], [0.115, 0.14, 0.115], material.dark),
    cylinder("上部贯流叶轮轴", [0, 0.44, 0.02], [0.07, 0.25, 0.07], material.dark, [0, 0, 90]),
    box("顶面出风导叶", [0, 0.503, -0.035], [0.25, 0.014, 0.09], material.dark, [-15, 0, 0]),
    box("顶面湿度控制窗", [0.09, 0.522, 0.055], [0.08, 0.006, 0.04], material.glass),
  ] },
  { name: "柱筒滤芯空气净化器", theme: "现代", itemType: "设施", build: () => {
    const result: ModelPart[] = [cylinder("圆筒底座", [0, 0.02, 0], [0.29, 0.04, 0.29], material.dark), ring("进气格栅下端开放环", material.ivory, 0.145, 0.012, 0.04, 0.012), ring("进气格栅上端开放环", material.ivory, 0.145, 0.012, 0.31, 0.012), cylinder("内部可抽滤筒", [0, 0.19, 0], [0.205, 0.3, 0.205], material.ivory), ring("滤筒顶端密封圈", material.dark, 0.108, 0.013, 0.349, 0.02), ring("离心风机出气环", material.ivory, 0.145, 0.032, 0.405, 0.09), cylinder("风机中心轮毂", [0, 0.395, 0], [0.065, 0.05, 0.065], material.dark), cylinder("上方触控中心盘", [0, 0.467, 0], [0.13, 0.015, 0.13], material.dark)];
    for (let index = 0; index < 12; index++) { const a = index * Math.PI / 6; result.push(box("进气格栅独立竖肋", [Math.cos(a) * 0.14, 0.17, Math.sin(a) * 0.14], [0.007, 0.27, 0.012], material.ivory, [0, -index * 30, 0]), rod("顶部出风支承辐条", [Math.cos(a) * 0.063, 0.465, Math.sin(a) * 0.063], [Math.cos(a) * 0.132, 0.465, Math.sin(a) * 0.132], 0.005), box("内部滤纸折棱", [Math.cos(a) * 0.104, 0.19, Math.sin(a) * 0.104], [0.008, 0.28, 0.012], material.wood, [0, -index * 30, 0])); }
    for (let index = 0; index < 4; index++) { const angle = index * Math.PI / 2; result.push(box("进气上圈实际托住出风上层的独立承柱", [Math.cos(angle) * 0.14, 0.37, Math.sin(angle) * 0.14], [0.012, 0.13, 0.012], material.ivory), rod("滤筒密封座接到出风框的独立斜支耳", [Math.cos(angle) * 0.1, 0.35, Math.sin(angle) * 0.1], [Math.cos(angle) * 0.14, 0.37, Math.sin(angle) * 0.14], 0.01, material.steel)); }
    for (let index = 0; index < 3; index++) { const angle = index * Math.PI * 2 / 3; result.push(rod("风机轮毂真正悬接出风框的径向支杆", [Math.cos(angle) * 0.028, 0.395, Math.sin(angle) * 0.028], [Math.cos(angle) * 0.128, 0.395, Math.sin(angle) * 0.128], 0.008), rod("出风框上端接住触控盘辐条的竖向短柱", [Math.cos(angle) * 0.132, 0.44, Math.sin(angle) * 0.132], [Math.cos(angle) * 0.132, 0.465, Math.sin(angle) * 0.132], 0.008)); }
    return result;
  } },
  { name: "底座离心送风环道无叶扇", theme: "现代", itemType: "设施", build: () => [
    cylinder("内藏离心风机的配重底座", [0, 0.13, 0], [0.23, 0.26, 0.23], material.ivory),
    cylinder("送风环下端连接颈", [0, 0.285, 0], [0.11, 0.09, 0.11], material.ivory),
    ring("环形高压送风管", material.ivory, 0.22, 0.042, 0, 0.07, { position: { x: 0, y: 0.51, z: 0 }, rotation: { x: 90, y: 0, z: 0 } }),
    ring("连续内沿出风狭口", material.dark, 0.181, 0.003, 0, 0.012, { position: { x: 0, y: 0.51, z: -0.033 }, rotation: { x: 90, y: 0, z: 0 } }),
    ...ventGrid("底座进气栅", [0, 0.13, -0.107], 0.14, 0.13, 7),
    cylinder("风量调节钮", [0, 0.08, -0.124], [0.035, 0.015, 0.035], material.dark, [90, 0, 0]),
  ] },
  { name: "长轴贯流式摆头塔扇", theme: "现代", itemType: "设施", build: () => [
    cylinder("塔扇盘形底座", [0, 0.018, 0], [0.28, 0.035, 0.28], material.dark),
    cylinder("底座回转轴颈", [0, 0.07, 0], [0.09, 0.09, 0.09], material.steel),
    ...uprightShell("狭长风道", 0.15, 0.87, 0.14).map(value => ({ ...value, position: { ...value.position, y: value.position.y + 0.095 } })),
    cylinder("纵向贯流转子轴", [0, 0.52, 0], [0.07, 0.69, 0.07], material.dark),
    ...Array.from({ length: 8 }, (_, index) => { const a = index * Math.PI / 4; return box("纵向弧叶转子筋", [Math.cos(a) * 0.038, 0.52, Math.sin(a) * 0.038], [0.008, 0.66, 0.015], material.steel, [0, -index * 45, 0]); }),
    ...ventGrid("贯通纵向出风格", [0, 0.54, -0.075], 0.135, 0.67, 7),
    ...bars("横向导流翼片", 8, [0, 0.54, -0.085], 0.6, [0.12, 0.006, 0.025], 1, material.ivory),
    cylinder("顶盖旋钮", [0, 0.98, 0], [0.055, 0.02, 0.055], material.dark),
  ] },
  { name: "双护网倾角摆头台扇", theme: "现代", itemType: "设施", build: () => {
    const result: ModelPart[] = [cylinder("桌扇椭圆底座", [0, 0.015, 0], [0.27, 0.03, 0.22], material.ivory), cylinder("支承摆头立柱", [0, 0.125, 0.045], [0.055, 0.2, 0.055], material.ivory), cylinder("后部驱动电机", [0, 0.29, 0.05], [0.09, 0.15, 0.09], material.ivory, [90, 0, 0]), cylinder("中心转轴轮毂", [0, 0.29, -0.035], [0.055, 0.04, 0.055], material.dark, [90, 0, 0]), ...radialBlades([0, 0.29, -0.025], 0.135, 3), ...[-1, 1].flatMap(s => [ring("网罩外围环", material.steel, 0.16, 0.005, 0, 0.008, { position: { x: 0, y: 0.29, z: s * 0.05 - 0.025 }, rotation: { x: 90, y: 0, z: 0 } }), ring("网罩中圈", material.steel, 0.09, 0.003, 0, 0.005, { position: { x: 0, y: 0.29, z: s * 0.064 - 0.025 }, rotation: { x: 90, y: 0, z: 0 } })])];
    for (const side of [-1, 1]) for (let index = 0; index < 10; index++) { const a = index * Math.PI / 5; result.push(rod("前后放射防护细丝", [0, 0.29, side * 0.067 - 0.025], [Math.cos(a) * 0.157, 0.29 + Math.sin(a) * 0.157, side * 0.05 - 0.025], 0.003)); }
    result.push(cylinder("摆头锁钮", [0, 0.35, 0.095], [0.025, 0.035, 0.025], material.dark), ...bars("底座速度按键", 3, [0, 0.036, -0.04], 0.11, [0.025, 0.012, 0.027], 0)); return result;
  } },
  { name: "独立封油片列电热油汀", theme: "现代", itemType: "设施", build: () => {
    const result: ModelPart[] = [box("恒温开关控制盒", [-0.27, 0.36, 0], [0.1, 0.61, 0.15], material.ivory), ...[-0.21, 0.22].map(x => rod("底部轮座横足", [x, 0.07, -0.16], [x, 0.07, 0.16], 0.035, material.dark)), ...[-0.21, 0.22].flatMap(x => [-1, 1].map(s => cylinder("回转脚轮", [x, 0.035, s * 0.145], [0.055, 0.025, 0.055], material.dark, [0, 0, 90])))];
    for (let index = 0; index < 8; index++) { const x = -0.2 + index * 0.06; result.push(plate("独立封焊油腔散热片", [x, 0.1, 0], [[-0.09, 0], [0.09, 0], [0.105, 0.04], [0.105, 0.48], [0.07, 0.55], [-0.07, 0.55], [-0.105, 0.48], [-0.105, 0.04]], 0.022, material.ivory, [0, 90, 0])); }
    for (const y of [0.17, 0.57]) result.push(rod("片列内部互通封油管", [-0.26, y, 0], [0.245, y, 0], 0.035));
    result.push(cylinder("恒温旋钮", [-0.328, 0.52, 0], [0.045, 0.022, 0.045], material.dark, [0, 0, 90]), cylinder("电热功率旋钮", [-0.328, 0.43, 0], [0.045, 0.022, 0.045], material.dark, [0, 0, 90]), cord("接到控制盒的电源线", [[-0.29, 0.13, -0.065], [-0.4, 0.02, -0.15], [-0.5, 0.018, -0.08]], 0.004), box("电源线末端插头", [-0.51, 0.018, -0.07], [0.035, 0.025, 0.028], material.dark)); return result;
  } },
  { name: "石英管弧面反射取暖器", theme: "现代", itemType: "设施", build: () => {
    const reflector = part("开口弧面反射罩", "lathe", material.steel, [0, 0.29, 0.03], [1, 1, 1], [90, 0, 0], { profile: [{ x: 0, y: 0.045 }, { x: 0.065, y: 0.035 }, { x: 0.12, y: 0.005 }, { x: 0.17, y: -0.055 }, { x: 0.173, y: -0.055 }, { x: 0.123, y: 0.01 }, { x: 0.067, y: 0.041 }, { x: 0, y: 0.05 }] });
    return [box("下部防倾支脚", [0, 0.018, 0.04], [0.36, 0.035, 0.22], material.dark), ...[-1, 1].map(s => rod("两侧持罩支臂", [s * 0.14, 0.03, 0.03], [s * 0.14, 0.29, 0.03], 0.02)), reflector, ring("反射罩耐热包边", material.dark, 0.176, 0.008, 0, 0.022, { position: { x: 0, y: 0.29, z: -0.024 }, rotation: { x: 90, y: 0, z: 0 } }), ...[-1, 1].map(s => cylinder("正面横置石英发热管", [0, 0.29 + s * 0.056, -0.025], [0.012, 0.255, 0.012], material.red, [0, 0, 90])), ...bars("前面防触竖丝", 9, [0, 0.29, -0.065], 0.27, [0.003, 0.24, 0.003], 0, material.dark), ...[-1, 1].map(s => rod("发热管接线端支座", [s * 0.13, 0.22, -0.025], [s * 0.13, 0.36, -0.025], 0.017, material.ivory)), cylinder("底座功率钮", [0.11, 0.043, -0.01], [0.035, 0.02, 0.035], material.ivory)];
  } },
  { name: "蜂窝陶瓷短风道暖风机", theme: "现代", itemType: "设施", build: () => [
    ...uprightShell("暖风机", 0.2, 0.25, 0.13), box("陶瓷加热蜂窝芯", [0, 0.135, -0.015], [0.145, 0.15, 0.018], material.wood),
    ...ventGrid("前出热风栅", [0, 0.135, -0.068], 0.17, 0.17, 8), ...bars("出风防护横隔", 5, [0, 0.135, -0.075], 0.15, [0.17, 0.005, 0.008], 1),
    cylinder("后置小风机", [0, 0.14, 0.025], [0.11, 0.045, 0.11], material.dark, [90, 0, 0]),
    ...[-1, 1].map(s => cylinder("顶部温控和档位旋钮", [s * 0.05, 0.26, 0], [0.035, 0.025, 0.035], material.dark)),
    cord("上拱提手", [[-0.07, 0.25, 0.01], [-0.06, 0.3, 0.01], [0.06, 0.3, 0.01], [0.07, 0.25, 0.01]], 0.008),
    box("底部防倾安全触点", [0, -0.001, 0], [0.03, 0.005, 0.03], material.dark),
  ] },
  { name: "柔性电热暖脚套", theme: "现代", build: () => [
    plate("带封闭鞋头的双脚软底", [0, 0.015, 0], [[-0.16, -0.17], [0.16, -0.17], [0.17, 0.07], [0.13, 0.16], [-0.13, 0.16], [-0.17, 0.07]], 0.03, material.wood),
    plate("后口开放的圆拱软绒脚背罩", [0, 0.03, 0.005], [[-0.16, 0], [-0.16, 0.09], [-0.12, 0.16], [0, 0.2], [0.12, 0.16], [0.16, 0.09], [0.16, 0], [0.14, 0], [0.14, 0.08], [0.105, 0.14], [0, 0.18], [-0.105, 0.14], [-0.14, 0.08], [-0.14, 0]], 0.25, material.ivory, [0, 0, 0]),
    plate("软罩封闭的前趾端", [0, 0.03, 0.136], [[-0.155, 0], [0.155, 0], [0.155, 0.085], [0.115, 0.155], [0, 0.195], [-0.115, 0.155], [-0.155, 0.085]], 0.015, material.ivory, [0, 0, 0]),
    box("罩体平底发热内垫", [0, 0.043, 0], [0.27, 0.012, 0.26], material.red),
    cord("柔性供电线", [[0.15, 0.04, 0.03], [0.24, 0.02, 0.08], [0.3, 0.02, -0.04]], 0.004),
    box("线上温控盒", [0.31, 0.025, -0.07], [0.05, 0.025, 0.085], material.ivory), box("温控滑键", [0.31, 0.041, -0.07], [0.018, 0.008, 0.025], material.dark),
  ] },
  { name: "壁挂单嘴下吹热风干手机", theme: "现代", itemType: "设施", build: () => {
    const parts = [
    box("靠墙安装背板", [0, 0.18, 0.09], [0.24, 0.32, 0.015], material.dark), box("封闭上部离心风机壳", [0, 0.215, 0.005], [0.25, 0.26, 0.18], material.ivory),
    cylinder("壳内横轴风轮", [0, 0.23, 0.005], [0.12, 0.15, 0.12], material.dark, [0, 0, 90]),
    part("朝下收分矩形风嘴的真实环壁", "mesh", material.steel, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices: [{ x: -0.09, y: 0.1, z: -0.07 }, { x: 0.09, y: 0.1, z: -0.07 }, { x: 0.09, y: 0.1, z: 0.03 }, { x: -0.09, y: 0.1, z: 0.03 }, { x: -0.065, y: 0.02, z: -0.065 }, { x: 0.065, y: 0.02, z: -0.065 }, { x: 0.065, y: 0.02, z: -0.005 }, { x: -0.065, y: 0.02, z: -0.005 }, { x: -0.082, y: 0.1, z: -0.062 }, { x: 0.082, y: 0.1, z: -0.062 }, { x: 0.082, y: 0.1, z: 0.022 }, { x: -0.082, y: 0.1, z: 0.022 }, { x: -0.057, y: 0.02, z: -0.057 }, { x: 0.057, y: 0.02, z: -0.057 }, { x: 0.057, y: 0.02, z: -0.013 }, { x: -0.057, y: 0.02, z: -0.013 }], indices: [0, 5, 4, 0, 1, 5, 1, 6, 5, 1, 2, 6, 2, 7, 6, 2, 3, 7, 3, 4, 7, 3, 0, 4, 8, 13, 9, 8, 12, 13, 9, 14, 10, 9, 13, 14, 10, 15, 11, 10, 14, 15, 11, 12, 8, 11, 15, 12, 0, 9, 1, 0, 8, 9, 1, 10, 2, 1, 9, 10, 2, 11, 3, 2, 10, 11, 3, 8, 0, 3, 11, 8, 4, 13, 12, 4, 5, 13, 5, 14, 13, 5, 6, 14, 6, 15, 14, 6, 7, 15, 7, 12, 15, 7, 4, 12] }),
    box("朝下的红外感应窗口", [0.085, 0.081, -0.002], [0.035, 0.009, 0.025], material.glass), ...ventGrid("侧缘冷风进气", [0, 0.19, 0.101], 0.19, 0.14, 8),
    ];
    const outlet = parts[3]!, vertices = outlet.vertices!;
    // 矩形风嘴的四壁与口沿是硬折角，分离面顶点以保持金属薄壁的平面法线。
    outlet.vertices = outlet.indices!.map(index => ({ ...vertices[index]! }));
    delete outlet.indices;
    return parts;
  } },
  { name: "横卧储水式电热水器", theme: "现代", itemType: "设施", build: () => [
    cylinder("横卧保温圆筒", [0, 0.28, 0], [0.45, 0.78, 0.45], material.ivory, [0, 0, 90]),
    ...[-1, 1].map(s => cylinder("两端压合封头", [s * 0.395, 0.28, 0], [0.425, 0.025, 0.425], material.steel, [0, 0, 90])),
    ...[-1, 1].map(s => rod("后壁承重挂梁", [s * 0.25, 0.12, 0.2], [s * 0.25, 0.43, 0.2], 0.045, material.dark)),
    ...[-1, 1].map(s => cylinder("下方冷热独立接口", [s * 0.16, 0.045, -0.01], [0.03, 0.12, 0.03], s < 0 ? material.red : material.glass)),
    cylinder("冷水入口泄压阀支体", [0.16, -0.004, -0.015], [0.055, 0.06, 0.055], material.steel),
    rod("泄压排水支嘴", [0.16, -0.018, -0.015], [0.22, -0.04, -0.035], 0.016),
    box("独立恒温电热控制端盒", [-0.32, 0.27, -0.17], [0.16, 0.16, 0.09], material.dark),
    cylinder("温度调节轮", [-0.32, 0.27, -0.22], [0.065, 0.02, 0.065], material.ivory, [90, 0, 0]),
    cylinder("前部机械温度表", [0.12, 0.36, -0.207], [0.055, 0.012, 0.055], material.glass, [90, 0, 0]),
  ] },
  { name: "手提拍击床褥除螨吸尘器", theme: "现代", itemType: "设施", build: () => [
    plate("宽扁吸拍底靴", [0, 0.018, 0], [[-0.15, -0.12], [0.15, -0.12], [0.16, 0.03], [0.09, 0.13], [-0.09, 0.13], [-0.16, 0.03]], 0.035, material.ivory),
    box("前置拍击滚刷壳", [0, 0.075, -0.07], [0.3, 0.08, 0.09], material.ivory),
    cylinder("拍击滚轴", [0, 0.027, -0.072], [0.04, 0.25, 0.04], material.dark, [0, 0, 90]),
    ...bars("滚轴柔性拍击凸条", 6, [0, 0.027, -0.072], 0.21, [0.015, 0.05, 0.025], 0, material.red),
    cylinder("后部透明旋风集尘杯", [0, 0.09, 0.045], [0.12, 0.14, 0.12], material.glass, [70, 0, 0]),
    cylinder("杯内离心分离锥", [0, 0.09, 0.045], [0.055, 0.13, 0.055], material.dark, [70, 0, 0]),
    cord("上方完整手提握环", [[0, 0.09, -0.065], [0, 0.2, -0.03], [0, 0.22, 0.09], [0, 0.12, 0.13]], 0.018, material.ivory),
    box("握环电源键", [0, 0.222, 0.025], [0.025, 0.008, 0.04], material.red),
    ...[-1, 1].map(s => cylinder("底部床面滚轮", [s * 0.11, 0.022, 0.05], [0.032, 0.018, 0.032], material.dark, [0, 0, 90])),
  ] },
  { name: "竖轴波轮顶开洗衣机", theme: "现代", itemType: "设施", build: () => {
    const result: ModelPart[] = [...uprightShell("波轮洗衣机", 0.56, 0.86, 0.56).filter(value => value.name !== "波轮洗衣机顶部"), box("前立面", [0, 0.42, -0.268], [0.51, 0.78, 0.024], material.ivory), ring("敞口桶沿", material.ivory, 0.248, 0.033, 0.82, 0.065), part("真正开放的竖向洗涤桶", "lathe", material.steel, [0, 0.15, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: 0.209, y: 0 }, { x: 0.22, y: 0.65 }, { x: 0.211, y: 0.65 }, { x: 0.201, y: 0.014 }, { x: 0, y: 0.014 }] }), cylinder("桶底波轮盘", [0, 0.175, 0], [0.32, 0.025, 0.32], material.ivory), box("后部控制台", [0, 0.875, 0.22], [0.54, 0.075, 0.11], material.dark), box("倾起的独立上翻盖", [0, 0.855 + Math.sin(65 * Math.PI / 180) * 0.23, 0.195 - Math.cos(65 * Math.PI / 180) * 0.23], [0.52, 0.025, 0.46], material.glass, [65, 0, 0]), rod("上翻盖后侧铰轴", [-0.23, 0.855, 0.195], [0.23, 0.855, 0.195], 0.018), cylinder("顶台程序旋钮", [0.17, 0.925, 0.215], [0.055, 0.025, 0.055], material.ivory)];
    for (let index = 0; index < 5; index++) { const a = index * Math.PI * 2 / 5; result.push(box("波轮径向弧棱", [Math.sin(a) * 0.08, 0.195, Math.cos(a) * 0.08], [0.026, 0.025, 0.13], material.ivory, [0, index * 72, 0])); }
    return result;
  } },
  { name: "支架布罩暖风干衣机", theme: "现代", itemType: "设施", build: () => {
    const result: ModelPart[] = [cylinder("底部独立加热风机", [0, 0.12, 0], [0.3, 0.2, 0.3], material.ivory), ...[-1, 1].flatMap(x => [-1, 1].map(z => rod("四角张罩支架", [x * 0.28, 0.03, z * 0.22], [x * 0.28, 1.55, z * 0.22], 0.015))), rod("罩内高位挂衣横杆", [-0.28, 1.48, 0], [0.28, 1.48, 0], 0.019), box("后部透气布壁", [0, 0.89, 0.225], [0.58, 1.34, 0.003], material.wood), ...[-1, 1].map(s => box("侧部布罩", [s * 0.285, 0.89, 0], [0.003, 1.34, 0.45], material.wood)), box("上部软罩顶", [0, 1.56, 0], [0.58, 0.003, 0.45], material.wood), ...[-1, 1].map(s => box("前拉链两侧留缝布帘", [s * 0.195, 0.89, -0.225], [0.19, 1.34, 0.003], material.wood)), cord("前口拉链边", [[-0.095, 0.22, -0.226], [-0.095, 1.56, -0.226], [0.095, 1.56, -0.226], [0.095, 0.22, -0.226]], 0.003, material.dark), cylinder("中央热风立管", [0, 0.265, 0], [0.12, 0.16, 0.12], material.dark), cylinder("风机定时旋钮", [0, 0.12, -0.156], [0.055, 0.018, 0.055], material.dark, [90, 0, 0])];
    result.push(...[-1, 1].map(side => rod("挂衣横杆两端与四角立柱接合的顶横撑", [side * 0.28, 1.48, -0.22], [side * 0.28, 1.48, 0.22], 0.018)), ...[-1, 1].flatMap(x => [-1, 1].map(z => box("与独立风机共面接地的四角防滑小脚", [x * 0.28, 0.0275, z * 0.22], [0.035, 0.015, 0.035], material.dark))));
    for (const x of [-0.13, 0.13]) {
      const path: Triple[] = [[0, 0.19, 0], [-0.025, 0.14, 0], [0, 0.1, 0], [-0.11, 0, 0], [0.11, 0, 0], [0, 0.1, 0]], hanger = tapered("挂在杆上的三角衣撑", material.steel, path, path.map(() => 0.004));
      hanger.position = { x, y: 1.3, z: 0 }; result.push(hanger);
    }
    return result;
  } },
  { name: "剥层胶纸粘毛滚", theme: "现代", build: () => [
    cylinder("可剥离纸芯滚筒", [0, 0.035, 0], [0.065, 0.115, 0.065], material.ivory, [0, 0, 90]),
    cylinder("贯穿滚筒的自由轴", [0, 0.035, 0], [0.007, 0.14, 0.007], material.steel, [0, 0, 90]),
    cord("侧单臂弯轴", [[0.07, 0.035, 0], [0.09, 0.035, 0], [0.09, 0.035, 0.065], [0, 0.035, 0.065], [0, 0.035, 0.1]], 0.005),
    cylinder("注塑握柄", [0, 0.035, 0.17], [0.028, 0.14, 0.028], material.dark, [90, 0, 0]),
    plate("微抬的撕纸端头", [0.035, 0.066, 0], [[0, -0.025], [0.025, -0.025], [0.032, 0.025], [0, 0.025]], 0.001, material.ivory, [-77, 0, 0]),
  ] },
  { name: "往复绒向集毛盒滚刷", theme: "现代", build: () => [
    box("长矩形集毛后仓", [0, 0.044, 0.025], [0.19, 0.065, 0.065], material.ivory), cylinder("横向往复绒面滚刷", [0, 0.033, -0.018], [0.055, 0.17, 0.055], material.red, [0, 0, 90]),
    ...[-1, 1].map(s => box("滚刷自由轴侧架", [s * 0.092, 0.035, -0.012], [0.012, 0.06, 0.075], material.ivory)),
    box("绒向梳理刮条", [0, 0.044, 0.012], [0.168, 0.008, 0.018], material.dark),
    cord("与仓体相连的后拱握柄", [[-0.068, 0.06, 0.05], [-0.055, 0.12, 0.075], [0.055, 0.12, 0.075], [0.068, 0.06, 0.05]], 0.012, material.dark),
    box("后仓独立翻盖", [0, 0.078, 0.04], [0.17, 0.009, 0.05], material.glass), box("集毛仓开启拨扣", [0.06, 0.087, 0.04], [0.018, 0.008, 0.022], material.dark),
  ] },
  { name: "三叉夹持百叶帘清洁刷", theme: "现代", build: () => [
    box("手握连接脊", [0, 0.025, 0.085], [0.045, 0.045, 0.14], material.ivory),
    ...[-1, 0, 1].flatMap(index => [rod("插入叶片间的叉指", [index * 0.035, 0.025, 0.03], [index * 0.035, 0.025, -0.13], 0.012, material.ivory), box("夹缝套装长绒刷套", [index * 0.035, 0.025, -0.07], [0.025, 0.045, 0.125], material.red)]),
    ...[-1, 1].map(s => rod("左右分叉过渡", [0, 0.025, 0.045], [s * 0.035, 0.025, 0.025], 0.012, material.ivory)),
    loop("柄端挂环", [0, 0.025, 0.16], 0.016, 0.004, [90, 0, 0]),
  ] },
  { name: "金属压条橡胶窗刮", theme: "现代", build: () => [
    box("连续不锈钢压胶槽", [0, 0.025, -0.045], [0.28, 0.018, 0.03], material.steel), box("向前突出的柔性刮水唇", [0, 0.012, -0.061], [0.295, 0.005, 0.019], material.dark),
    plate("刮头三角持座", [0, 0.018, 0.002], [[-0.055, -0.035], [0.055, -0.035], [0.025, 0.035], [-0.025, 0.035]], 0.025, material.steel),
    cylinder("后向橡胶握柄", [0, 0.025, 0.12], [0.035, 0.19, 0.035], material.dark, [90, 0, 0]),
    ...[-1, 1].map(s => box("锁紧胶条弹扣", [s * 0.08, 0.038, -0.04], [0.025, 0.008, 0.022], material.dark)),
  ] },
  { name: "封灰通风盘香盒", theme: "现代", build: () => {
    const coil = Array.from({ length: 58 }, (_, index): Triple => { const a = index / 57 * Math.PI * 7, radius = 0.009 + index / 57 * 0.052; return [Math.cos(a) * radius, 0.026, Math.sin(a) * radius]; });
    const result: ModelPart[] = [cup("承接灰烬的浅圆盘", [0, 0, 0], 0.075, 0.035, material.steel), ring("上盖压边环", material.dark, 0.075, 0.008, 0.04, 0.012), cylinder("支承盘香的中心立针", [0, 0.018, 0], [0.003, 0.025, 0.003], material.steel), tapered("连续螺旋盘香实体", material.wood, coil, coil.map(() => 0.0018))];
    for (let index = 0; index < 12; index++) { const a = index * Math.PI / 6; result.push(rod("带空隙的盖顶放射丝", [Math.cos(a) * 0.012, 0.053, Math.sin(a) * 0.012], [Math.cos(a) * 0.07, 0.043, Math.sin(a) * 0.07], 0.0025)); }
    result.push(ball("提起盖顶的小纽", [0, 0.057, 0], [0.018, 0.012, 0.018], material.dark)); return result;
  } },
  { name: "插片电热蚊香器", theme: "现代", build: () => [
    box("绝缘低矮加热座", [0, 0.015, 0], [0.07, 0.03, 0.085], material.ivory), box("上置发热铝板", [0, 0.032, 0], [0.05, 0.006, 0.055], material.steel),
    box("抽换药片", [0.014, 0.037, 0], [0.045, 0.003, 0.044], material.wood), ...[-1, 1].map(s => box("药片两侧防触护条", [s * 0.028, 0.046, 0], [0.007, 0.018, 0.07], material.ivory)),
    cord("离座电源线", [[0, 0.014, 0.04], [0.06, 0.014, 0.07], [0.12, 0.014, 0.035]], 0.003, material.dark), box("末端电源插头", [0.13, 0.015, 0.025], [0.025, 0.025, 0.035], material.ivory),
    ...[-1, 1].map(s => box("双插脚", [0.13 + s * 0.006, 0.015, 0.003], [0.002, 0.012, 0.016], material.steel)),
  ] },
  { name: "杠杆压管壁挂挤牙膏器", theme: "现代", build: () => [
    box("壁面固定背片", [0, 0.085, 0.035], [0.075, 0.17, 0.008], material.ivory), ...[-1, 1].map(s => box("压管腔侧架", [s * 0.033, 0.09, 0], [0.009, 0.14, 0.065], material.ivory)),
    box("柔性牙膏管", [0, 0.12, 0.006], [0.047, 0.12, 0.022], material.glass), cylinder("向下连通的管颈", [0, 0.046, 0.006], [0.017, 0.035, 0.017], material.ivory),
    cylinder("横向施压滚子", [0, 0.101, -0.012], [0.018, 0.056, 0.018], material.dark, [0, 0, 90]), ...[-1, 1].map(s => rod("滚子杠杆", [s * 0.028, 0.1, -0.012], [s * 0.028, 0.049, -0.045], 0.008)),
    box("牙刷推动的横向拨板", [0, 0.045, -0.05], [0.058, 0.035, 0.008], material.dark), rod("拨板回转枢轴", [-0.038, 0.06, -0.024], [0.038, 0.06, -0.024], 0.009),
    box("下部接滴小托", [0, 0.012, -0.018], [0.075, 0.008, 0.085], material.ivory),
  ] },
  { name: "扁管卷尾开槽钥匙", theme: "现代", build: () => [
    polygon("真正贯通的长缝卷管匙", material.steel, [[-0.043, -0.011], [0.035, -0.011], [0.048, -0.006], [0.048, 0.006], [0.035, 0.011], [-0.043, 0.011]], 0.008, [0, 0.012, 0], [[[-0.035, -0.002], [-0.035, 0.002], [0.025, 0.002], [0.025, -0.002]]]),
    loop("匙头外伸转动指环", [-0.055, 0.016, 0], 0.018, 0.004, [0, 0, 0]),
    rod("连接匙片与指环的细颈", [-0.047, 0.016, 0], [-0.034, 0.016, 0], 0.008),
  ] },
  { name: "倒刺长带地漏疏发钩", theme: "现代", build: () => {
    const result: ModelPart[] = [plate("柔性窄长疏发带", [0, 0.004, 0], [[-0.004, -0.31], [0.004, -0.31], [0.005, 0.21], [0.003, 0.24], [-0.003, 0.24], [-0.005, 0.21]], 0.003, material.red), loop("上端手指拉环", [0, 0.007, 0.265], 0.025, 0.005, [0, 0, 0], material.red), rod("拉环与带体连接颈", [0, 0.007, 0.23], [0, 0.007, 0.247], 0.007, material.red)];
    for (let index = 0; index < 12; index++) for (const side of [-1, 1]) result.push(plate("朝回拉方向的真实倒刺", [0, 0.004, -0.27 + index * 0.035], [[side * 0.003, 0.012], [side * 0.016, -0.005], [side * 0.004, -0.001]], 0.003, material.red));
    return result;
  } },
  { name: "拉链圆筒网眼洗衣袋", theme: "现代", build: () => {
    const result: ModelPart[] = [ring("网袋底缘包边", material.ivory, 0.15, 0.008, 0.01, 0.012), ring("拉链顶缘包边", material.ivory, 0.15, 0.008, 0.3, 0.012), ...Array.from({ length: 7 }, (_, index) => loop("环向网丝", [0, 0.015 + index * 0.046, 0], 0.145, 0.0015, [0, 0, 0], material.ivory))];
    for (let index = 0; index < 18; index++) { const a = index * Math.PI / 9, x = Math.cos(a) * 0.145, z = Math.sin(a) * 0.145; result.push(rod("纵向网丝", [x, 0.01, z], [x, 0.3, z], 0.0025, material.ivory)); }
    for (let index = -3; index <= 3; index++) { const v = index * 0.034, span = Math.sqrt(0.14 ** 2 - v ** 2); result.push(rod("底网经线", [v, 0.009, -span], [v, 0.009, span], 0.0025, material.ivory), rod("底网纬线", [-span, 0.011, v], [span, 0.011, v], 0.0025, material.ivory)); }
    result.push(rod("袋口横置闭合拉链", [-0.145, 0.308, 0], [0.145, 0.308, 0], 0.006, material.dark), box("滑动拉链头", [0.12, 0.313, 0], [0.018, 0.008, 0.024], material.steel), loop("拉链手指小环", [0.12, 0.317, 0.016], 0.009, 0.002, [0, 0, 0]));
    for (let index = -3; index <= 3; index++) { const v = index * 0.034, span = Math.sqrt(0.14 ** 2 - v ** 2); result.push(rod("顶网经线", [v, 0.301, -span], [v, 0.301, span], 0.0025, material.ivory), rod("顶网纬线", [-span, 0.303, v], [span, 0.303, v], 0.0025, material.ivory)); }
    return result;
  } },
  { name: "按压弹跳式浴盆排水塞", theme: "现代", itemType: "构件", build: () => [
    ring("装入盆底的贯通排水法兰", material.steel, 0.042, 0.007, 0.055, 0.012), ring("法兰下方螺纹套管", material.dark, 0.032, 0.005, 0.025, 0.05),
    cylinder("中央弹跳芯轴", [0, 0.035, 0], [0.009, 0.07, 0.009], material.steel), ...Array.from({ length: 5 }, (_, index) => loop("套在芯轴上的回位弹簧圈", [0, 0.017 + index * 0.006, 0], 0.009, 0.0015, [0, 0, 0])),
    ...Array.from({ length: 3 }, (_, index) => { const a = index * Math.PI * 2 / 3; return rod("排水套中的中心芯支臂", [0, 0.012, 0], [Math.cos(a) * 0.029, 0.012, Math.sin(a) * 0.029], 0.004); }),
    cylinder("抬起留隙的圆形弹跳顶盖", [0, 0.078, 0], [0.078, 0.008, 0.078], material.steel), ring("盖底密封胶圈", material.dark, 0.029, 0.003, 0.071, 0.005),
  ] },
];
