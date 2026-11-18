import { part, pitchedRoof, type ModelPart } from "../assetModelParts";
import { axles, ball, box, cylinder, strut, transportColors, type TransportDefinition } from "./parts";

const timber = transportColors.wood;
function sled(width: number, length: number): ModelPart[] {
  return [-1, 1].flatMap(side => [box("纵向木滑梁", [side * width / 2, 0.16, 0], [0.22, 0.3, length], timber), strut("前翘滑梁", [side * width / 2, 0.16, -length / 2], [side * width / 2, 0.5, -length / 2 - 0.4], 0.2, timber)]);
}
function trestles(width: number, height: number, z: number): ModelPart[] {
  return [-1, 1].flatMap(side => [strut("三角承力架前腿", [side * width / 2, 0.2, z - 1], [side * width / 2, height, z], 0.2, timber), strut("三角承力架后腿", [side * width / 2, 0.2, z + 1], [side * width / 2, height, z], 0.2, timber)]);
}
function historical(name: string, create: TransportDefinition["create"], tags: string[] = ["历史", "攻城器械"], theme: TransportDefinition["theme"] = "欧式"): TransportDefinition {
  return { name, create, tags, theme, itemType: tags.includes("攻城器械") ? "设施" : "交通" };
}

export const siegeModels: TransportDefinition[] = [
  historical("配重式投石机", () => [...sled(2.4, 4.6), ...trestles(2, 3.4, 0), cylinder("横向杠杆转轴", [0, 3.4, 0], [0.23, 2.5, 0.23], transportColors.dark, [0, 0, 90]), strut("不等臂投射长杆", [0, 1.9, -3.5], [0, 4.3, 1.8], 0.2, timber), box("悬挂配重箱", [0, 3.2, 1.8], [1.2, 1.8, 1], transportColors.dark), ...[-1, 1].map(side => strut("配重吊杆", [side * 0.42, 4.3, 1.8], [side * 0.42, 3.6, 1.8], 0.07, transportColors.dark)), strut("抛石索", [0, 1.9, -3.5], [0, 0.35, -4.3], 0.03), ball("投石皮兜", [0, 0.3, -4.3], [0.55, 0.3, 0.55], transportColors.trim)]),
  historical("人力牵引投石机", () => [...sled(1.8, 3.7), ...trestles(1.5, 2.7, 0.25), strut("牵引投石杠杆", [0, 1.1, -2.5], [0, 3.3, 1.25], 0.17, timber), cylinder("杠杆横轴", [0, 2.7, 0.25], [0.16, 1.9, 0.16], transportColors.dark, [0, 0, 90]), ...[-0.45, -0.15, 0.15, 0.45].map(x => strut("多人牵引绳", [0, 3.3, 1.25], [x, 0.5, 2.6], 0.025)), strut("长臂末端弹索", [0, 1.1, -2.5], [0, 0.3, -3.1], 0.03), ball("投石兜", [0, 0.25, -3.1], [0.45, 0.22, 0.4], transportColors.trim)]),
  historical("扭索单臂石弩", () => [...sled(1.8, 3.5), cylinder("横置绞扭索束", [0, 0.65, 0.5], [0.5, 1.8, 0.5], transportColors.trim, [0, 0, 90]), strut("刚性抛石杆", [0, 0.65, 0.5], [0, 3.1, -0.9], 0.18, timber), part("杆端石弹勺", "lathe", transportColors.dark, [0, 3.1, -0.9], [0.5, 0.5, 0.5], [-30, 0, 0], { profile: [{ x: 0, y: -0.15 }, { x: 0.45, y: 0 }, { x: 0.55, y: 0.4 }, { x: 0.45, y: 0.4 }, { x: 0, y: 0 }] }), ...[-1, 1].flatMap(side => [box("前限位立柱", [side * 0.72, 1.4, -0.35], [0.2, 2.4, 0.2], timber), strut("立柱斜撑", [side * 0.72, 0.3, -1.5], [side * 0.72, 2.4, -0.35], 0.13, timber)]), box("投射缓冲横木", [0, 2.35, -0.35], [1.9, 0.3, 0.35], timber)]),
  historical("双扭束弩炮", () => [...sled(2, 3.3), box("中央箭槽", [0, 1, 0], [0.28, 0.25, 3.8], timber), ...[-1, 1].flatMap(side => [box("扭力索束上框", [side * 0.75, 1.45, -0.8], [0.55, 0.16, 0.55], timber), box("扭力索束下框", [side * 0.75, 0.6, -0.8], [0.55, 0.16, 0.55], timber), cylinder("垂直扭索束", [side * 0.75, 1, -0.8], [0.25, 0.8, 0.25], transportColors.trim), strut("弹射弩臂", [side * 0.75, 1, -0.8], [side * 1.8, 1, -0.3], 0.1, timber), strut("绷紧弓弦", [side * 1.8, 1, -0.3], [0, 1, 1.2], 0.02)]), cylinder("后端上弦绞盘", [0, 1.1, 1.6], [0.22, 1.2, 0.22], transportColors.dark, [0, 0, 90]), strut("长矢弹体", [0, 1.18, -1.7], [0, 1.18, 0.8], 0.06, transportColors.dark)]),
  historical("箱式弹簧弩炮", () => [...sled(1.4, 2.9), box("竖向扭力箱框", [0, 1.5, -0.7], [1.4, 1.9, 0.8], timber), box("内嵌发射孔", [0, 1.5, -1.12], [0.5, 0.55, 0.03], transportColors.dark), ...[-1, 1].flatMap(side => [cylinder("内置竖向弹力束", [side * 0.45, 1.5, -0.7], [0.16, 1.5, 0.16], transportColors.trim), strut("箱内弹力短臂", [side * 0.45, 1.5, -0.7], [side * 0.2, 1.5, -0.2], 0.09)]), box("后伸发射导轨", [0, 1.5, 0.65], [0.3, 0.2, 2.5], timber), cylinder("箱弩绞车", [0, 1.6, 1.7], [0.25, 0.9, 0.25], transportColors.dark, [0, 0, 90]), strut("曳引绳", [0, 1.5, -0.2], [0, 1.5, 1.7], 0.035)]),
  historical("车载多矢连弩", () => [...axles(1.4, [-0.85, 0.85], 0.45), box("弩车平台", [0, 0.8, 0], [1.55, 0.17, 2.4], timber), ...[-0.42, 0, 0.42].flatMap(x => [box("并列长箭槽", [x, 1.15, -0.2], [0.2, 0.18, 2.7], timber), box("上置重力箭匣", [x, 1.65, 0.1], [0.24, 0.8, 0.7], transportColors.dark)]), strut("共用弩臂左段", [-1.5, 1.2, -0.7], [0, 1.2, -1], 0.1, timber), strut("共用弩臂右段", [1.5, 1.2, -0.7], [0, 1.2, -1], 0.1, timber), ...[-1, 1].map(side => strut("共用弦", [side * 1.5, 1.2, -0.7], [0, 1.2, 0.8], 0.025)), strut("循环拉杆", [0, 1.2, 0.8], [0, 1.9, 1.2], 0.09, timber)]),
  historical("篷护悬索撞城车", () => [...axles(2.5, [-1.7, 1.7], 0.55), box("撞车底架", [0, 0.8, 0], [2.6, 0.25, 4.5], timber), ...[-1, 1].flatMap(side => [-1.4, 1.4].map(z => box("撞车护棚立柱", [side * 1.1, 1.9, z], [0.18, 2.2, 0.18], timber))), pitchedRoof("坡面防火护棚", transportColors.body, 3, 5, 3.05), cylinder("悬吊撞城长木", [0, 1.4, -0.5], [0.55, 5.5, 0.55], timber, [90, 0, 0]), cylinder("金属撞角", [0, 1.4, -3.3], [0.7, 0.45, 0.7], transportColors.dark, [90, 0, 0]), ...[-1.2, 1.2].map(z => strut("撞木悬索", [0, 2.9, z], [0, 1.4, z], 0.055))]),
  historical("多层攻城塔车", () => {
    const parts = [...axles(3, [-1.4, 1.4], 0.6), box("攻城塔底盘", [0, 0.9, 0], [3.4, 0.25, 4], timber)];
    for (const side of [-1, 1]) for (const end of [-1, 1]) parts.push(strut("内收主塔柱", [side * 1.5, 0.9, end * 1.7], [side * 1.05, 7, end * 1.1], 0.2, timber));
    for (const y of [2.8, 4.8, 6.8]) parts.push(box("塔内战斗楼板", [0, y, 0], [2.5, 0.17, 3], timber));
    parts.push(box("正面生皮护墙", [0, 4, -1.45], [2.7, 5.5, 0.1], transportColors.body), box("上层放下渡桥", [0, 6.75, -2.5], [2.1, 0.15, 3], timber), ...[-1, 1].map(side => strut("渡桥悬索", [side * 0.9, 7.3, -1.1], [side * 0.9, 6.8, -3.9], 0.035)));
    return parts;
  }),
  historical("绞盘竖起云梯车", () => {
    const parts = [...axles(2.3, [-1.2, 1.2], 0.5), box("云梯车承载底架", [0, 0.8, 0], [2.4, 0.24, 3.4], timber), cylinder("云梯绞盘轴", [0, 1.1, 0.8], [0.3, 1.9, 0.3], transportColors.dark, [0, 0, 90])];
    for (const side of [-1, 1]) parts.push(strut("长梯侧梁", [side * 0.55, 0.8, -0.6], [side * 0.55, 6.8, -3.4], 0.13, timber), strut("云梯侧向支撑", [side * 1, 0.8, 1.2], [side * 0.55, 4, -2.1], 0.13, timber));
    for (let step = 0; step < 13; step++) parts.push(strut("云梯横档", [-0.55, 1 + step * 0.44, -0.69 - step * 0.205], [0.55, 1 + step * 0.44, -0.69 - step * 0.205], 0.085, timber));
    parts.push(strut("竖梯提升索", [0, 1.1, 0.8], [0, 4.8, -2.45], 0.03)); return parts;
  }),
  historical("斜面掩护盾车", () => [...axles(1.6, [-0.6, 0.6], 0.3), box("推行盾车底架", [0, 0.48, 0], [1.7, 0.12, 2.1], timber), box("倾斜箭矢护盾", [0, 1.5, -0.3], [2.1, 2.4, 0.15], transportColors.body, [-25, 0, 0]), ...[-1, 1].map(side => strut("护盾撑架", [side * 0.7, 0.5, 0.75], [side * 0.7, 2, -0.5], 0.1, timber)), box("推行握持横杆", [0, 0.95, 0.9], [1.2, 0.08, 0.1], timber)]),
  historical("填壕运土木龟车", () => [...axles(2.3, [-1.3, 1.3], 0.45), box("低矮运土底板", [0, 0.7, 0], [2.6, 0.2, 3.6], timber), pitchedRoof("低斜掩护顶壳", transportColors.body, 2.8, 4, 1.4), ...[-1, 1].map(side => box("侧面掩护长板", [side * 1.3, 1.1, 0], [0.14, 0.8, 3.8], timber)), box("前端填壕倾卸板", [0, 0.55, -2.15], [2.3, 0.16, 1.1], timber, [-20, 0, 0]), box("尾部推行把", [0, 1, 2], [1.6, 0.12, 0.1], timber)]),
  historical("木轴战车", () => [...axles(1.9, [0.3], 0.62), box("战车立足底板", [0, 0.8, 0], [1.6, 0.12, 1.3], timber), part("弧形战车胸围", "extrude", transportColors.body, [0, 0.85, -0.4], [1, 1, 1], [90, 0, 0], { depth: 0.85, profile: [{ x: -0.8, y: 0.3 }, { x: -0.85, y: -0.1 }, { x: -0.55, y: -0.55 }, { x: 0.55, y: -0.55 }, { x: 0.85, y: -0.1 }, { x: 0.8, y: 0.3 }, { x: 0.65, y: 0.25 }, { x: 0.65, y: -0.1 }, { x: 0.4, y: -0.4 }, { x: -0.4, y: -0.4 }, { x: -0.65, y: -0.1 }, { x: -0.65, y: 0.25 }] }), strut("长车辕", [0, 0.72, -0.4], [0, 0.9, -3], 0.12, timber), box("套马横轭", [0, 0.9, -2.9], [1.7, 0.12, 0.13], timber)]),
  historical("封闭抬轿", () => [box("轿厢底座", [0, 0.55, 0], [1.15, 0.18, 1.25], timber), box("封闭轿舱", [0, 1.3, 0], [1.05, 1.45, 1.15], transportColors.signal), pitchedRoof("轿顶", transportColors.dark, 1.4, 1.5, 2.05, true), ...[-1, 1].flatMap(side => [box("贯通抬行长杆", [side * 0.75, 0.7, 0], [0.09, 0.1, 4.2], timber), box("侧窗", [side * 0.54, 1.55, 0], [0.025, 0.5, 0.5], transportColors.dark)]), box("正面门帘", [0, 1.3, -0.59], [0.62, 1.15, 0.025], transportColors.trim)], ["历史", "人力运输"], "中式"),
  historical("双杆拖曳载架", () => [...[-1, 1].map(side => strut("长杆拖行支架", [side * 0.95, 0.08, 1.5], [side * 0.3, 1.2, -2.2], 0.09, timber)), box("后部载物横架", [0, 0.35, 0.7], [1.45, 0.08, 1.2], timber), ...[-0.65, -0.2, 0.2, 0.65].map(x => strut("编织载物绳", [x, 0.4, 0.15], [x * 1.15, 0.3, 1.2], 0.025)), box("前端鞍挂横木", [0, 1.1, -1.9], [0.8, 0.13, 0.16], timber)], ["历史", "拖曳运输"], "异域"),
  historical("达芬奇圆甲战车", () => {
    const parts = [...axles(2.2, [-0.9, 0.9], 0.45), cylinder("圆形承载底盘", [0, 0.65, 0], [3.7, 0.25, 3.7], timber), part("圆锥倾斜装甲壳", "lathe", transportColors.body, [0, 0.7, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 1.9, y: 0 }, { x: 0.65, y: 1.8 }, { x: 0.55, y: 1.8 }, { x: 1.8, y: 0 }] }), cylinder("顶部观察亭", [0, 2.65, 0], [0.7, 0.55, 0.7], timber)];
    for (let index = 0; index < 8; index++) { const angle = index * Math.PI / 4; parts.push(strut("环向发射短炮管", [Math.cos(angle) * 1.4, 1, Math.sin(angle) * 1.4], [Math.cos(angle) * 2.15, 1, Math.sin(angle) * 2.15], 0.12, transportColors.dark)); }
    return parts;
  }, ["历史", "机械构想"]),
  historical("轮式火箭箭架", () => {
    const parts = [...axles(1.1, [0.35], 0.4), box("火箭车架底", [0, 0.65, 0], [1.2, 0.16, 1.8], timber), box("倾斜多孔箭架", [0, 1.3, -0.15], [1.3, 1, 0.6], timber, [-30, 0, 0]), strut("尾部操作推杆", [0, 0.65, 0.8], [0, 1, 1.6], 0.08, timber)];
    for (const x of [-0.4, 0, 0.4]) for (const y of [1.1, 1.4, 1.7]) parts.push(strut("引导火箭长箭", [x, y, 0.15], [x, y + 0.4, -0.9], 0.045, transportColors.dark)); return parts;
  }),
];
