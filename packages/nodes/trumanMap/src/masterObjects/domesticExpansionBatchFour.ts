import { part, ring, type ModelPart, type Triple } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { box, cylinder, rod, cup, cord, bars, material, type MasterPrototype } from "./parts";

export const domesticExpansionBatchFourObjects: MasterPrototype[] = [
  { name: "墙装剪叉伸展晾晒杆架", theme: "现代", itemType: "设施", build: () => {
    const result: ModelPart[] = [...[-1, 1].map(s => box("墙面落地竖向固定轨", [s * 0.53, 0.47, 0.22], [0.06, 0.85, 0.035], material.steel))];
    for (const side of [-1, 1]) for (let i = 0; i < 3; i++) {
      const z = 0.2 - i * 0.31;
      result.push(rod("伸展机构交叉上臂", [side * 0.53, 0.62, z], [side * 0.53, 0.87, z - 0.31], 0.018), rod("伸展机构交叉下臂", [side * 0.53, 0.87, z], [side * 0.53, 0.62, z - 0.31], 0.018), cylinder("交叉臂中心枢轴", [side * 0.53, 0.745, z - 0.155], [0.03, 0.035, 0.03], material.dark, [0, 0, 90]));
    }
    for (let i = 0; i < 4; i++) result.push(rod("相连两侧剪叉的晾衣横杆", [-0.55, 0.87, 0.2 - i * 0.31], [0.55, 0.87, 0.2 - i * 0.31], 0.025, material.ivory));
    return result;
  } },
  { name: "伞形回转四臂庭院晾衣架", theme: "现代", itemType: "设施", build: () => {
    const result: ModelPart[] = [cylinder("可旋转的中央立杆", [0, 0.88, 0], [0.055, 1.76, 0.055], material.steel), cylinder("驱动撑臂的滑动套环", [0, 1.14, 0], [0.095, 0.15, 0.095], material.dark), cylinder("顶端四臂共用铰头", [0, 1.7, 0], [0.11, 0.08, 0.11], material.dark)];
    for (const x of [-1, 1]) for (const z of [-1, 1]) result.push(rod("向四角展开的承绳主臂", [0, 1.7, 0], [x * 1.08, 1.79, z * 1.08], 0.028), rod("滑环至主臂中部撑杆", [0, 1.16, 0], [x * 0.6, 1.75, z * 0.6], 0.018));
    for (const span of [0.4, 0.68, 0.97]) for (const side of [-1, 1]) result.push(rod("四边受拉晾衣绳", [-span, 1.7 + span / 1.08 * 0.09, side * span], [span, 1.7 + span / 1.08 * 0.09, side * span], 0.003, material.wood), rod("四边相连晾衣绳", [side * span, 1.7 + span / 1.08 * 0.09, -span], [side * span, 1.7 + span / 1.08 * 0.09, span], 0.003, material.wood));
    for (let i = 0; i < 3; i++) { const a = i * Math.PI * 2 / 3; result.push(rod("三向外展稳固底足", [0, 0.31, 0], [Math.cos(a) * 0.42, 0.025, Math.sin(a) * 0.42], 0.04, material.dark)); }
    return result;
  } },
  { name: "双折臂卷布式外墙遮阳篷", theme: "现代", itemType: "设施", build: () => {
    const result: ModelPart[] = [box("墙装横向卷轴盒", [0, 2.35, 0], [3.2, 0.18, 0.19], material.ivory), cylinder("盒内收卷布轴", [0, 2.35, -0.04], [0.105, 3.06, 0.105], material.dark, [0, 0, 90]), box("展开带坡度的遮阳布", [0, 2.235, -0.93], [3.02, 0.012, Math.hypot(1.86, 0.245)], material.wood, [-Math.atan2(0.245, 1.86) * 180 / Math.PI, 0, 0]), rod("前沿整根张紧横梁", [-1.55, 2.1125, -1.86], [1.55, 2.1125, -1.86], 0.055, material.ivory), box("前缘柔软垂边", [0, 2.045, -1.868], [3.06, 0.12, 0.006], material.wood)];
    for (const side of [-1, 1]) result.push(rod("第一段折臂", [side * 1.05, 2.25, -0.06], [side * 0.67, 2.09, -0.86], 0.04), rod("第二段折臂", [side * 0.67, 2.09, -0.86], [side * 1.05, 2.1125, -1.86], 0.04), cylinder("折臂肘部枢轴", [side * 0.67, 2.09, -0.86], [0.075, 0.05, 0.075], material.dark));
    for (const x of [-1.25, 0, 1.25]) result.push(box("独立墙装承载耳板", [x, 2.35, 0.1125], [0.2, 0.28, 0.04], material.steel));
    return result;
  } },
  { name: "立柱侧拉收卷遮阳风屏", theme: "现代", itemType: "设施", build: () => [
    cylinder("竖置卷布收纳立筒", [0, 0.93, 0], [0.14, 1.82, 0.14], material.ivory), box("立筒接地固定方盘", [0, 0.02, 0], [0.3, 0.04, 0.3], material.dark),
    box("侧向拉出的整幅屏布", [1.38, 0.93, 0], [2.64, 1.62, 0.006], material.wood), rod("拉出布边的张紧竖杆", [2.7, 0.12, 0], [2.7, 1.75, 0], 0.04, material.ivory),
    cylinder("固定拉杆的独立端柱", [2.76, 0.52, 0], [0.06, 1.01, 0.06], material.steel), box("端柱锚固底板", [2.76, 0.02, 0], [0.22, 0.04, 0.22], material.dark),
    cord("屏边弧形拉握把", [[2.71, 0.87, -0.01], [2.79, 0.9, -0.01], [2.79, 1.14, -0.01], [2.71, 1.17, -0.01]], 0.013, material.dark),
    ...[0.62, 1.02].map(y => rod("将屏边拉杆锁进端柱的扣销", [2.7, y, 0], [2.77, y, 0], 0.018)),
  ] },
  { name: "跨池宽轴泡膜覆盖卷扬架", theme: "现代", itemType: "设施", build: () => {
    const result: ModelPart[] = [cylinder("整幅池盖收卷铝轴", [0, 0.7, 0], [0.1, 3.52, 0.1], material.steel, [0, 0, 90]), cylinder("轴上已收起的厚泡膜卷", [0, 0.7, 0], [0.29, 3.1, 0.29], material.glass, [0, 0, 90]), box("从卷筒向池面降下的整幅泡膜", [0, 0.39, -0.8], [3.06, 0.008, Math.hypot(1.6, 0.62)], material.glass, [-Math.atan2(0.62, 1.6) * 180 / Math.PI, 0, 0])];
    for (const side of [-1, 1]) result.push(rod("卷轴两端竖向承架", [side * 1.71, 0.04, 0], [side * 1.71, 0.7, 0], 0.045, material.dark), rod("承架落地纵向长足", [side * 1.71, 0.04, -0.31], [side * 1.71, 0.04, 0.31], 0.06, material.dark), ring("卷轴两端真正贯通的轴承环", material.dark, 0.063, 0.014, 0, 0.07, { position: { x: side * 1.71, y: 0.7, z: 0 }, rotation: { x: 0, y: 0, z: 90 } }));
    result.push(rod("一端曲柄偏心臂", [1.82, 0.7, 0], [1.82, 0.86, 0], 0.025), rod("曲柄外侧持握套", [1.82, 0.86, 0], [1.98, 0.86, 0], 0.035, material.dark));
    return result;
  } },
  { name: "横片拉绳升降百叶帘", theme: "现代", itemType: "家具", build: () => [
    box("百叶帘顶端卷索机构盒", [0, 1.72, 0], [1.56, 0.07, 0.07], material.ivory), box("整幅帘底部张紧横杆", [0, 0.08, 0], [1.48, 0.04, 0.055], material.steel),
    ...Array.from({ length: 16 }, (_, i) => box("可翻转的独立水平叶片", [0, 0.16 + i * 0.094, 0], [1.45, 0.004, 0.075], material.wood, [-24, 0, 0])),
    ...[-1, 1].flatMap(s => [-1, 1].map(z => rod("贯穿叶片两侧的升降梯绳", [s * 0.5, 0.08, z * 0.027], [s * 0.5, 1.7, z * 0.027], 0.003, material.dark))),
    cord("帘侧下拉操纵索", [[0.7, 1.7, 0.045], [0.79, 1.61, 0.045], [0.79, 0.85, 0.045]], 0.003), cylinder("拉索末端手握坠", [0.79, 0.82, 0.045], [0.025, 0.065, 0.025], material.wood),
  ] },
  { name: "竖片滑移转向百叶帘", theme: "现代", itemType: "家具", build: () => {
    const result: ModelPart[] = [box("带联动轴的顶挂滑轨", [0, 1.96, 0], [1.6, 0.065, 0.07], material.ivory)];
    for (let i = 0; i < 12; i++) { const x = (i - 5.5) * 0.125; result.push(cylinder("轨下叶片回转挂轴", [x, 1.9, 0], [0.014, 0.07, 0.014], material.dark), box("带下坠的竖直帘片", [x, 0.98, 0], [0.115, 1.78, 0.004], material.wood, [0, 32, 0]), box("每片下缘独立配重", [x, 0.105, 0], [0.105, 0.025, 0.008], material.ivory, [0, 32, 0])); }
    result.push(cord("沿下缘联接叶片的细链", [[-0.69, 0.09, 0.025], [-0.34, 0.08, 0.025], [0.34, 0.08, 0.025], [0.69, 0.09, 0.025]], 0.002), rod("帘侧转向操纵棒", [0.78, 1.93, -0.03], [0.78, 1.1, -0.03], 0.012, material.ivory));
    return result;
  } },
  { name: "贯通蜂巢升降隔热帘", theme: "现代", itemType: "家具", build: () => {
    const result: ModelPart[] = [box("上端升降卷索盒", [0, 1.55, 0], [1.47, 0.07, 0.12], material.ivory), box("下端帘布张紧条", [0, 0.06, 0], [1.44, 0.045, 0.12], material.wood)];
    for (let i = 0; i < 18; i++) {
      const cell = polygon("两端贯通的真实六边蜂巢布腔", material.ivory, [[0, -0.025], [0.04, -0.05], [0.08, -0.025], [0.08, 0.025], [0.04, 0.05], [0, 0.025]], 1.4, [0.7, 0.082 + i * 0.08, 0], [[[0.006, -0.021], [0.006, 0.021], [0.04, 0.043], [0.074, 0.021], [0.074, -0.021], [0.04, -0.043]]]);
      const vertices = cell.vertices!;
      cell.vertices = cell.indices!.map(index => ({ ...vertices[index]! }));
      delete cell.indices;
      cell.rotation.z = 90; result.push(cell);
    }
    for (const side of [-1, 1]) result.push(rod("帘体内部的升降牵引索", [side * 0.5, 0.075, 0], [side * 0.5, 1.52, 0], 0.002, material.dark));
    return result;
  } },
  { name: "侧移百褶收纳纱门", theme: "现代", itemType: "构件", build: () => {
    const result: ModelPart[] = [...[-1, 1].map(s => box("门洞两侧的竖直边框", [s * 0.64, 1.04, 0], [0.045, 2.08, 0.065], material.ivory)), ...[0.025, 2.055].map(y => box("折网的上下导轨", [0, y, 0], [1.3, 0.04, 0.065], material.ivory)), box("展开纱网的拉动边柱", [0.44, 1.04, 0], [0.045, 1.99, 0.055], material.dark)];
    for (let i = 0; i < 20; i++) result.push({ ...box("交替折起的半透明网面", [-0.59 + i * 0.052, 1.04, i % 2 ? 0.012 : -0.012], [0.06, 1.99, 0.002], material.dark, [0, i % 2 ? 30 : -30, 0]), opacity: 0.25 });
    result.push(rod("拉动边柱上的持握把", [0.43, 0.82, -0.045], [0.43, 1.19, -0.045], 0.018, material.ivory)); return result;
  } },
  { name: "分段铰接轨道上翻车库门", theme: "现代", itemType: "构件", build: () => {
    const result: ModelPart[] = [...[-1, 1].map(s => box("两侧门洞安装立框", [s * 1.48, 1.12, 0.015], [0.07, 2.24, 0.09], material.steel)), cylinder("顶端共轴平衡传动杆", [0, 2.35, 0.08], [0.055, 3.06, 0.055], material.dark, [0, 0, 90])];
    for (let i = 0; i < 5; i++) result.push(box("可相互转动的整幅门板段", [0, 0.225 + i * 0.44, 0], [2.84, 0.43, 0.045], material.ivory), ...[-1, 1].map(s => cylinder("各段侧缘行走滚轮", [s * 1.45, 0.23 + i * 0.44, 0.035], [0.055, 0.025, 0.055], material.dark, [0, 0, 90])));
    for (const side of [-1, 1]) result.push(cord("从竖直到顶内横行的弯曲导轨", [[side * 1.45, 0.04, 0.035], [side * 1.45, 2.1, 0.035], [side * 1.45, 2.4, 0.24], [side * 1.45, 2.45, 0.6], [side * 1.45, 2.45, 2.02]], 0.022), rod("顶内导轨末端的悬吊支架", [side * 1.45, 2.45, 1.82], [side * 1.45, 2.75, 1.82], 0.035));
    result.push(rod("中央链条开门机的顶置导梁", [0, 2.53, 0.1], [0, 2.53, 2.01], 0.055), box("导梁末端驱动机头", [0, 2.53, 2.05], [0.28, 0.18, 0.34], material.dark), cord("门板与导梁滑块之间的弯连接臂", [[0, 2.13, 0], [0, 2.28, 0.1], [0, 2.5, 0.32]], 0.018));
    return result;
  } },
  { name: "链驱剪叉伸缩庭院门", theme: "现代", itemType: "构件", build: () => {
    const result: ModelPart[] = [box("一端固定安装立柱", [-1.8, 0.85, 0], [0.16, 1.7, 0.19], material.steel), box("自由端电驱门柱", [1.8, 0.77, 0], [0.2, 1.55, 0.25], material.dark), rod("地面直线导向轨", [-1.85, 0.025, 0], [1.9, 0.025, 0], 0.025)];
    for (let i = 0; i < 8; i++) { const x = -1.76 + i * 0.44; result.push(rod("剪叉伸展上斜臂", [x, 0.38, -0.025], [x + 0.44, 1.4, -0.025], 0.025), rod("剪叉伸展下斜臂", [x, 1.4, 0.025], [x + 0.44, 0.38, 0.025], 0.025), cylinder("剪叉中间贯通销", [x + 0.22, 0.89, 0], [0.05, 0.08, 0.05], material.dark, [90, 0, 0]), rod("随动门排竖直承柱", [x, 0.14, 0], [x, 1.6, 0], 0.04), cylinder("每排下方的导轨轮", [x, 0.105, 0], [0.15, 0.055, 0.15], material.dark, [90, 0, 0])); }
    result.push(cylinder("电驱门柱底部牵引轮", [1.8, 0.12, 0], [0.2, 0.11, 0.2], material.dark, [90, 0, 0]), box("自由端触边保护胶条", [1.915, 0.8, 0], [0.025, 1.48, 0.22], material.wood)); return result;
  } },
  { name: "双吊点顶挂三扇折叠玻璃门", theme: "现代", itemType: "构件", build: () => {
    const result: ModelPart[] = [box("顶置门洞直线吊轨", [0, 2.14, 0], [1.96, 0.08, 0.09], material.steel), ...[-1, 1].map(s => box("门洞两侧固定边柱", [s * 0.95, 1.07, 0], [0.055, 2.1, 0.08], material.ivory))], nodes: [number, number][] = [[-0.9, 0], [-0.55, -0.425], [-0.2, 0], [0.15, -0.425]];
    for (let i = 0; i < 3; i++) {
      const a = nodes[i]!, b = nodes[i + 1]!, x = (a[0] + b[0]) / 2, z = (a[1] + b[1]) / 2, width = Math.hypot(b[0] - a[0], b[1] - a[1]), angle = -Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI;
      result.push(rod("门扇左侧竖框", [a[0], 0.06, a[1]], [a[0], 2.08, a[1]], 0.032, material.ivory), rod("门扇右侧竖框", [b[0], 0.06, b[1]], [b[0], 2.08, b[1]], 0.032, material.ivory), ...[0.075, 2.065].map(y => box("门扇上下框", [x, y, z], [width, 0.03, 0.032], material.ivory, [0, angle, 0])), { ...box("实框中的透明玻璃片", [x, 1.07, z], [width - 0.04, 1.94, 0.01], material.glass, [0, angle, 0]), opacity: 0.25 });
    }
    for (const index of [0, 2]) { const p = nodes[index]!; result.push(cylinder("门扇沿顶轨行走的吊轮", [p[0], 2.14, 0], [0.055, 0.035, 0.055], material.dark, [90, 0, 0]), rod("吊轮下方转动竖销", [p[0], 2.14, 0], [p[0], 2.055, 0], 0.014)); }
    return result;
  } },
  { name: "双腔充水软管临时阻水坝", theme: "现代", itemType: "设施", build: () => {
    const result: ModelPart[] = [box("阻水坝下方一体止滑裙", [0, 0.012, 0], [3.34, 0.018, 0.88], material.dark)];
    for (const side of [-1, 1]) result.push(part("两端封闭的独立充水软管腔", "lathe", material.wood, [0, 0.23, side * 0.21], [1, 1, 1], [0, 0, 90], { profile: [{ x: 0, y: -1.64 }, { x: 0.17, y: -1.56 }, { x: 0.22, y: -1.4 }, { x: 0.22, y: 1.4 }, { x: 0.17, y: 1.56 }, { x: 0, y: 1.64 }] }), ring("软管顶部充水阀颈", material.dark, 0.025, 0.006, 0.455, 0.05, { position: { x: 0.55, y: 0.455, z: side * 0.21 } }), cylinder("充水阀密封旋盖", [0.55, 0.486, side * 0.21], [0.06, 0.018, 0.06], material.ivory));
    for (const x of [-1.16, -0.58, 0, 0.58, 1.16]) result.push(box("跨两腔的柔性联结带", [x, 0.435, 0], [0.045, 0.012, 0.62], material.dark)); return result;
  } },
  { name: "门洞夹槽叠梁防洪挡板", theme: "现代", itemType: "构件", build: () => {
    const result: ModelPart[] = [...[-1, 1].flatMap(s => [box("门边槽柱前侧唇", [s * 0.79, 0.42, -0.05], [0.08, 0.84, 0.025], material.steel), box("门边槽柱后侧唇", [s * 0.79, 0.42, 0.05], [0.08, 0.84, 0.025], material.steel), box("槽柱背肋", [s * 0.825, 0.42, 0], [0.025, 0.84, 0.11], material.steel), cylinder("顶部压紧螺杆", [s * 0.77, 0.81, 0], [0.018, 0.16, 0.018], material.dark), rod("螺杆手拧横柄", [s * 0.77 - 0.06, 0.9, 0], [s * 0.77 + 0.06, 0.9, 0], 0.014, material.dark)])];
    for (let i = 0; i < 5; i++) result.push(box("可逐根装入的铝合金叠梁", [0, 0.1 + i * 0.135, 0], [1.54, 0.125, 0.07], material.ivory), box("叠梁间可压缩的密封胶条", [0, 0.033 + i * 0.135, 0], [1.51, 0.013, 0.078], material.dark));
    result.push(box("整幅接地密封脚条", [0, 0.015, 0], [1.59, 0.03, 0.12], material.dark)); return result;
  } },
  { name: "浮球封口初期雨水弃流分离器", theme: "现代", itemType: "设施", build: () => [
    part("独立透明竖向初雨储留管", "lathe", material.glass, [0, 0.1, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0.09, y: 0 }, { x: 0.09, y: 1.13 }, { x: 0.08, y: 1.13 }, { x: 0.08, y: 0 }, { x: 0.09, y: 0 }], opacity: 0.3 }), cylinder("弃流管可拆底盖", [0, 0.09, 0], [0.2, 0.035, 0.2], material.dark),
    ...[-1, 1].map(s => ring("顶端进出水水平接管", material.ivory, 0.075, 0.01, 0, 0.28, { position: { x: s * 0.15, y: 1.27, z: 0 }, rotation: { x: 0, y: 0, z: 90 } })), ring("位于分流管内的浮球封堵喉口", material.dark, 0.083, 0.028, 1.19, 0.04),
    part("初雨液位上升时可浮动的封口球", "sphere", material.wood, [0, 0.65, 0], [0.135, 0.135, 0.135]), cylinder("底部缓排针阀", [0, 0.045, 0], [0.026, 0.065, 0.026], material.steel),
    ...[0.37, 0.97].map(y => ring("墙挂管箍", material.dark, 0.1, 0.012, y, 0.035)), ...[0.37, 0.97].map(y => box("管箍背部固定耳板", [0, y, 0.12], [0.2, 0.06, 0.045], material.steel)),
  ] },
  { name: "切割泵密闭污水提升箱", theme: "现代", itemType: "设施", build: () => [
    box("可独立安装的密闭集污箱", [0, 0.24, 0], [0.62, 0.46, 0.49], material.ivory), box("上方可拆检修盖", [0, 0.485, 0], [0.55, 0.035, 0.41], material.dark),
    cylinder("箱内一体切割泵电机", [0.12, 0.24, 0.03], [0.19, 0.3, 0.19], material.steel), ...[-1, 1].map(s => ring("左右大口径废水入口", material.dark, 0.055, 0.011, 0, 0.11, { position: { x: s * 0.32, y: 0.24, z: 0 }, rotation: { x: 0, y: 0, z: 90 } })),
    ring("顶置止回排水接头", material.dark, 0.026, 0.006, 0.57, 0.15, { position: { x: 0.15, y: 0.57, z: 0.08 } }), ring("另设的独立通气口", material.dark, 0.023, 0.005, 0.56, 0.1, { position: { x: -0.15, y: 0.56, z: 0.08 } }),
    cord("电机供电线", [[0.26, 0.46, 0.16], [0.4, 0.48, 0.2], [0.47, 0.23, 0.21]], 0.006), cylinder("箱内液位浮子", [-0.14, 0.29, -0.08], [0.065, 0.08, 0.065], material.wood),
  ] },
  { name: "卧轴翻料庭院滚筒堆肥器", theme: "现代", itemType: "设施", build: () => {
    const result: ModelPart[] = [part("封闭滚动的鼓腹堆肥桶", "lathe", material.dark, [0, 0.7, 0], [1, 1, 1], [0, 0, 90], { profile: [{ x: 0, y: -0.46 }, { x: 0.27, y: -0.46 }, { x: 0.32, y: -0.35 }, { x: 0.32, y: 0.35 }, { x: 0.27, y: 0.46 }, { x: 0, y: 0.46 }] }), cylinder("贯通桶两端的卧轴", [0, 0.7, 0], [0.04, 1.12, 0.04], material.steel, [0, 0, 90]), box("桶顶可旋压的投料门", [0, 1.025, -0.02], [0.34, 0.025, 0.23], material.wood), rod("投料门抓握把", [-0.08, 1.056, -0.02], [0.08, 1.056, -0.02], 0.018, material.dark)];
    for (const side of [-1, 1]) for (const end of [-1, 1]) result.push(rod("两侧A字稳固支架", [side * 0.51, 0.025, end * 0.33], [side * 0.51, 0.71, 0], 0.045, material.steel));
    for (const z of [-0.3, 0.3]) result.push(rod("连结两侧支架的底部横梁", [-0.51, 0.05, z], [0.51, 0.05, z], 0.04));
    result.push(rod("侧面手摇偏心曲柄", [0.6, 0.7, 0], [0.6, 0.89, 0], 0.023), rod("外端木质持握柄", [0.6, 0.89, 0], [0.73, 0.89, 0], 0.028, material.wood)); return result;
  } },
  { name: "脚踏杠杆压缩垃圾柜", theme: "现代", itemType: "设施", build: () => [
    ...[-1, 1].map(s => box("垃圾柜承力侧壁", [s * 0.265, 0.51, 0], [0.035, 0.93, 0.5], material.ivory)), box("垃圾柜底板", [0, 0.04, 0], [0.56, 0.08, 0.5], material.dark), box("垃圾柜后部固定壁", [0, 0.51, 0.235], [0.5, 0.93, 0.03], material.ivory),
    cup("承接被压垃圾的独立抽桶", [0, 0.09, 0], 0.215, 0.58, material.steel), cylinder("压板贯穿导向杆", [0, 0.69, 0], [0.035, 0.48, 0.035], material.dark), cylinder("桶上方实际压缩圆盘", [0, 0.66, 0], [0.405, 0.028, 0.405], material.dark),
    rod("前侧脚踏长杠杆", [0, 0.18, 0.11], [0, 0.1, -0.39], 0.035), box("杠杆外端防滑踏板", [0, 0.09, -0.4], [0.25, 0.055, 0.15], material.dark),
    ...[-1, 1].map(s => rod("脚踏支点两侧支座", [s * 0.05, 0.06, -0.02], [s * 0.05, 0.16, -0.02], 0.025)), rod("下踏杠杆至压杆的连动拉杆", [0, 0.18, 0.1], [0, 0.54, 0.1], 0.02), rod("连动杆上部短横连件", [0, 0.54, 0.1], [0, 0.54, 0], 0.025), box("顶部压杆导向横梁", [0, 0.93, 0], [0.54, 0.055, 0.19], material.steel),
  ] },
  { name: "底吸涡流潜水排污泵", theme: "现代", itemType: "设施", build: () => [
    cylinder("防水电机竖直密闭外壳", [0, 0.4, 0], [0.27, 0.4, 0.27], material.steel), cylinder("下部偏置涡流叶轮室", [0, 0.16, 0], [0.36, 0.15, 0.36], material.dark), ring("叶轮下方敞开进水圈", material.steel, 0.18, 0.025, 0.06, 0.045),
    ...Array.from({ length: 3 }, (_, i) => { const a = i * Math.PI * 2 / 3; return box("泵底离地支脚", [Math.cos(a) * 0.14, 0.027, Math.sin(a) * 0.14], [0.065, 0.054, 0.065], material.dark); }),
    ring("侧面大通径排污出口", material.dark, 0.042, 0.008, 0, 0.18, { position: { x: 0, y: 0.16, z: -0.2 }, rotation: { x: 90, y: 0, z: 0 } }),
    cord("顶端提泵把手", [[-0.1, 0.59, 0], [-0.09, 0.71, 0], [0.09, 0.71, 0], [0.1, 0.59, 0]], 0.018, material.dark), cord("接入电机盖的浮子电缆", [[0.1, 0.57, 0.03], [0.22, 0.43, 0.08], [0.32, 0.19, 0.03]], 0.006), cylinder("独立液位浮球开关", [0.33, 0.17, 0.03], [0.1, 0.15, 0.1], material.wood),
  ] },
  { name: "墙装弹簧回卷浇水软管器", theme: "现代", itemType: "设施", build: () => [
    cylinder("内含卷簧的封闭卷管壳", [0, 0.39, 0], [0.48, 0.25, 0.48], material.wood, [90, 0, 0]), ...[-1, 1].map(s => box("后部转向壁装支耳", [0, 0.39 + s * 0.18, 0.16], [0.14, 0.07, 0.09], material.dark)), rod("允许壳体转向的竖直挂轴", [0, 0.18, 0.2], [0, 0.61, 0.2], 0.035), box("贴墙安装背片", [0, 0.39, 0.24], [0.19, 0.53, 0.025], material.steel),
    ring("前侧软管导出孔的护环", material.dark, 0.035, 0.01, 0, 0.035, { position: { x: 0.16, y: 0.28, z: -0.14 }, rotation: { x: 90, y: 0, z: 0 } }),
    cord("从壳口拉出的连通浇水管", [[0.16, 0.28, -0.15], [0.26, 0.17, -0.23], [0.42, 0.08, -0.2]], 0.012, material.dark), cylinder("导出口外的回卷止挡球", [0.2, 0.23, -0.18], [0.05, 0.05, 0.05], material.ivory), rod("末端可握喷淋枪", [0.41, 0.08, -0.2], [0.55, 0.13, -0.24], 0.035, material.ivory),
    rod("回卷器进水短管", [-0.15, 0.21, 0.05], [-0.29, 0.1, 0.05], 0.021, material.dark),
  ] },
  { name: "液压升降泳池活动底板", theme: "现代", itemType: "设施", build: () => {
    const result: ModelPart[] = [...[-1, 1].map(s => box("活动池底纵向承重梁", [s * 1.15, 0.83, 0], [0.14, 0.17, 4.8], material.steel)), ...[-1, 1].map(s => box("活动池底首尾承重梁", [0, 0.83, s * 2.32], [2.5, 0.17, 0.14], material.steel)), ...bars("能独立拆卸的防滑池底板条", 17, [0, 0.95, 0], 4.6, [2.48, 0.06, 0.26], 2, material.ivory)];
    for (const x of [-1.03, 1.03]) for (const z of [-2.12, 2.12]) result.push(cylinder("安装在池底的伸缩缸外筒", [x, 0.23, z], [0.13, 0.4, 0.13], material.dark), cylinder("接到活动底板的上伸活塞", [x, 0.57, z], [0.075, 0.36, 0.075], material.steel), box("液压缸底部锚固板", [x, 0.025, z], [0.27, 0.05, 0.27], material.steel));
    result.push(box("池外独立液压控制泵站", [1.72, 0.36, 1.8], [0.58, 0.7, 0.65], material.dark), cord("液压泵站与缸组的总供回管", [[1.5, 0.28, 1.8], [1.15, 0.11, 1.8], [1.03, 0.11, 2.12]], 0.017));
    return result;
  } },
  { name: "双排分集水住宅地暖歧管架", theme: "现代", itemType: "构件", build: () => {
    const result: ModelPart[] = [...[-1, 1].map(s => box("壁装歧管竖直支架", [s * 0.32, 0.36, 0.08], [0.055, 0.68, 0.035], material.steel)), ...[0.25, 0.51].map(y => cylinder("采暖供回水独立集管", [0, y, 0], [0.055, 0.8, 0.055], material.steel, [0, 0, 90])), ...[0.25, 0.51].map(y => ring("集管左侧独立主接头", material.dark, 0.026, 0.007, 0, 0.13, { position: { x: -0.44, y, z: 0 }, rotation: { x: 0, y: 0, z: 90 } }))];
    for (let i = 0; i < 6; i++) { const x = (i - 2.5) * 0.115; result.push(cylinder("上排流量计透明管", [x, 0.575, 0], [0.025, 0.12, 0.025], material.glass), cylinder("下排电热执行阀", [x, 0.305, 0], [0.05, 0.09, 0.05], material.ivory), ...[0.185, 0.445].map(y => ring("每路地暖回路接管", material.steel, 0.014, 0.004, y, 0.075, { position: { x, y, z: 0 } }))); }
    result.push(cylinder("右端自动排气阀体", [0.43, 0.57, 0], [0.055, 0.12, 0.055], material.steel), cylinder("右端表盘温度计", [0.43, 0.42, -0.065], [0.085, 0.025, 0.085], material.ivory, [90, 0, 0])); return result;
  } },
  { name: "交叉板式新风热交换箱", theme: "现代", itemType: "设施", build: () => {
    const result: ModelPart[] = [box("换热箱底部框盘", [0, 0.04, 0], [0.89, 0.08, 0.7], material.ivory), box("换热箱上部检修盖", [0, 0.68, 0], [0.89, 0.04, 0.7], material.ivory), ...[-1, 1].map(s => box("换热箱侧部承力壁", [s * 0.43, 0.36, 0], [0.03, 0.6, 0.7], material.ivory)), box("背部封闭板", [0, 0.36, 0.335], [0.84, 0.6, 0.03], material.ivory)];
    for (let i = 0; i < 14; i++) result.push(box("互相隔离的交叉层叠换热薄板", [0, 0.35, (i - 6.5) * 0.032], [0.43, 0.43, 0.006], material.steel, [0, 0, 45]));
    for (const side of [-1, 1]) result.push(cylinder("左右送排风独立离心风机", [side * 0.3, 0.35, 0], [0.19, 0.32, 0.19], material.dark), ...[-1, 1].map(end => ring("新风与排风四个独立接管口", material.dark, 0.075, 0.011, 0, 0.17, { position: { x: side * 0.23, y: 0.35 + end * 0.17, z: -0.39 }, rotation: { x: 90, y: 0, z: 0 } })));
    result.push(box("前部电控低压接线盒", [0, 0.08, -0.37], [0.32, 0.09, 0.06], material.dark)); return result;
  } },
  { name: "门洞配平三段翻折阁楼楼梯", theme: "现代", itemType: "构件", build: () => {
    const result: ModelPart[] = [...[-1, 1].map(s => box("天花洞口长边固定框", [s * 0.35, 2.73, 0.45], [0.06, 0.18, 1.3], material.wood)), ...[-1, 1].map(s => box("天花洞口短边固定框", [0, 2.73, 0.45 + s * 0.62], [0.7, 0.18, 0.06], material.wood))];
    const bottom: Triple = [0, 0.055, -1.05], top: Triple = [0, 2.64, 0.22];
    for (const side of [-1, 1]) for (let i = 0; i < 3; i++) { const a = i / 3, b = (i + 1) / 3; result.push(rod("能够逐段翻折的楼梯侧梁", [side * 0.25, bottom[1] + (top[1] - bottom[1]) * a, bottom[2] + (top[2] - bottom[2]) * a], [side * 0.25, bottom[1] + (top[1] - bottom[1]) * b, bottom[2] + (top[2] - bottom[2]) * b], 0.055, material.wood)); }
    for (let i = 0; i < 10; i++) { const t = (i + 0.6) / 10; result.push(box("可落脚的水平实木踏步", [0, bottom[1] + (top[1] - bottom[1]) * t, bottom[2] + (top[2] - bottom[2]) * t], [0.49, 0.035, 0.15], material.wood)); }
    for (const side of [-1, 1]) for (const t of [1 / 3, 2 / 3]) result.push(cylinder("分段侧梁铰接横销", [side * 0.25, bottom[1] + (top[1] - bottom[1]) * t, bottom[2] + (top[2] - bottom[2]) * t], [0.08, 0.075, 0.08], material.dark, [0, 0, 90]));
    for (const side of [-1, 1]) result.push(rod("门框配平撑杆外筒", [side * 0.32, 2.73, 0.91], [side * 0.28, 2.43, 0.35], 0.045, material.dark), rod("伸出外筒并接侧梁的撑杆活塞", [side * 0.28, 2.43, 0.35], [side * 0.25, 2.22, 0.01], 0.025));
    return result;
  } },
  // 入口踏台的负压收尘原理依据制造商说明，格栅与机组均为原创简化建模。
  // https://www.paionia.co.jp/en_products/172/
  { name: "负压格栅入口吸尘踏台", theme: "现代", itemType: "设施", build: () => {
    const result: ModelPart[] = [box("踏台下方封闭集风底盘", [0, 0.018, 0], [1.4, 0.035, 0.93], material.dark), ...[-1, 1].flatMap(s => [box("踏台左右承重边框", [s * 0.68, 0.055, 0], [0.04, 0.08, 0.93], material.steel), box("踏台前后承重边框", [0, 0.055, s * 0.445], [1.34, 0.08, 0.04], material.steel)]), ...bars("真正开放的脚底吸尘格条", 15, [0, 0.077, 0], 1.24, [0.035, 0.025, 0.82], 0, material.ivory), ...bars("承托格条的内横梁", 4, [0, 0.05, 0], 0.7, [1.28, 0.02, 0.025], 2, material.steel), box("侧面独立旋风集尘机组", [1.01, 0.31, 0.17], [0.44, 0.6, 0.53], material.ivory), cylinder("集尘机组可抽透明尘筒", [1.01, 0.31, -0.11], [0.23, 0.39, 0.23], material.glass), cord("踏台底盘接往集尘机的密封风管", [[0.69, 0.05, 0.17], [0.77, 0.05, 0.17], [0.79, 0.22, 0.17]], 0.035, material.dark), box("机组顶部电控面板", [1.01, 0.625, 0.17], [0.29, 0.03, 0.16], material.dark)];
    return result;
  } },
];
