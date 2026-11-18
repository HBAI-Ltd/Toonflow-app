import { part, ring, type ModelPart, type Triple } from "../assetModelParts";
import { ball, box, cylinder, strut, transportColors, type TransportDefinition } from "./parts";
import { solidPanel } from "./marineExpansionBatchTwo";
import { roundLink } from "./marineExpansionBatchFifteen";
import { annularSector } from "./marineExpansionBatchSeventeen";

// 独立完整的收放机构及海下空车库；不把同一框架更换ROV载荷作为另一主素材。
// https://www.royalihc.com/offshore-energy/offshore-equipment/launch-and-recovery-systems/gantry-launch-and-recovery-system
// https://newproduction.macgregor.com/Products/products/offshore-cranes/a-frames/
// https://www.smd.co.uk/wp-content/uploads/2021/11/Work-Class-ROV_v1-LT.pdf

const body = transportColors.body, dark = transportColors.dark, trim = transportColors.trim;

function groovedSheave(name: string, position: Triple, radius: number, groove: number, width: number): ModelPart {
  return part(name, "lathe", trim, position, [1, 1, 1], [0, 0, 90], { profile: [{ x: radius * 0.3, y: -width / 2 }, { x: radius, y: -width / 2 }, { x: radius, y: -width * 0.31 }, { x: groove, y: -width / 6 }, { x: groove, y: width / 6 }, { x: radius, y: width * 0.31 }, { x: radius, y: width / 2 }, { x: radius * 0.3, y: width / 2 }, { x: radius * 0.3, y: -width / 2 }] });
}

export const marineExpansionBatchEighteen: TransportDefinition[] = [
  { name: "液压外摆A架提升绞车甲板收放系统", theme: "现代", itemType: "设施", tags: ["LARS甲板收放系统", "完整液压A架绞车", "海洋装备吊放回收"], create: () => {
    const parts: ModelPart[] = [...[-1, 1].map(side => box("整套收放设备固定在船甲板的长底轨", [side * 3.2, 0.2, 0], [1, 0.4, 10], dark)), ...[-4, -3.3, 0, 4].map(z => box("连接左右底轨的刚性横梁", [0, 0.2, z], [6.4, 0.4, 1], dark)), cylinder("提升绞车中心缆鼓", [0, 1.6, -3.3], [1.4, 3, 1.4], body, [0, 0, 90]), cylinder("贯穿缆鼓并进入两端轴承的绞车轴", [0, 1.6, -3.3], [0.24, 4, 0.24], dark, [0, 0, 90]), cylinder("与绞车轴同心的电液驱动头", [2.2, 1.6, -3.3], [0.8, 0.6, 0.8], trim, [0, 0, 90]), box("绞车驱动头与底轨横梁之间的安装脚", [2.2, 0.8, -3.3], [0.6, 0.8, 0.7], dark), groovedSheave("头部中央真正有凹槽且能自由回转的提升滑轮", [0, 7.65, 3.25], 0.49, 0.455, 0.36), cylinder("穿过两颊板真实轴孔的头滑轮轴", [0, 7.65, 3.25], [0.2, 0.9, 0.2], dark, [0, 0, 90]), box("甲板底框上的独立液压油箱", [2.7, 0.9, -4], [1, 1, 1], body), box("液压油箱上方的收放控制柜", [2.7, 1.8, -4], [0.9, 0.8, 1.1], dark)];
    for (const side of [-1, 1]) {
      const base: Triple = [side * 3.2, 1, 1], headFront: Triple = [side * 2.6, 8, 3], headBack: Triple = [side * 2.6, 8, 3.5];
      parts.push(strut("主A架每侧独立前弦承载腿", base, headFront, 0.45, body), strut("主A架每侧独立后弦承载腿", base, headBack, 0.35, body), box("给中央头滑轮保留真实空口的半幅顶横梁", [side * 1.6, 8.15, 3.25], [2.4, 0.5, 0.9], dark), cylinder("与另一侧同轴且实际穿过支承耳的主回转销", base, [0.4, 1.2, 0.4], trim, [0, 0, 90]), box("主回转耳下端接到底轨的厚基座", [side * 3.2, 0.55, 1], [1.3, 0.4, 1.1], dark), box("绞车轴承实际接到底框的承重墩", [side * 1.75, 0.9, -3.3], [0.6, 1, 0.8], dark), part("真正套在绞车轴外的固定厚壁轴承", "lathe", trim, [side * 1.75, 1.6, -3.3], [1, 1, 1], [0, 0, 90], { profile: [{ x: 0.13, y: -0.15 }, { x: 0.28, y: -0.15 }, { x: 0.28, y: 0.15 }, { x: 0.13, y: 0.15 }, { x: 0.13, y: -0.15 }] }), ring("缆鼓两端防止卷缆脱出的实心边缘环", dark, 0.9, 0.2, 0, 0.1, { position: { x: side * 1.55, y: 1.6, z: -3.3 }, rotation: { x: 0, y: 0, z: 90 } }));
      for (const offset of [-0.4, 0.4]) parts.push(part("主回转销两端具有真实孔隙的固定支承耳", "lathe", body, [side * 3.2 + offset, 1, 1], [1, 1, 1], [0, 0, 90], { profile: [{ x: 0.21, y: -0.1 }, { x: 0.35, y: -0.1 }, { x: 0.35, y: 0.1 }, { x: 0.21, y: 0.1 }, { x: 0.21, y: -0.1 }] }));
      for (const f of [1 / 3, 2 / 3]) parts.push(strut("前后弦杆之间真实连接的横腹杆", [side * (3.2 - 0.6 * f), 1 + 7 * f, 1 + 2 * f], [side * (3.2 - 0.6 * f), 1 + 7 * f, 1 + 2.5 * f], 0.15, dark));
      parts.push(strut("腿架前后弦间的斜腹杆", [side * 3, 1 + 7 / 3, 1 + 2 / 3], [side * 2.8, 1 + 14 / 3, 1 + 5 / 3], 0.14, dark));
      const start: Triple = [side * 3.2, 1, -2.2], end: Triple = [side * 2.87, 4.85, 2.1], mid: Triple = [side * 2.9855, 3.5025, 0.595], rodStart: Triple = [side * 3.0185, 3.1175, 0.165];
      parts.push(roundLink("推动整A架外摆的长液压缸筒", start, mid, 0.5, dark), roundLink("与A架前承力弦杆实接的长活塞杆", rodStart, end, 0.2, trim), ball("执行缸下端允许角度变化的球铰", start, [0.35, 0.35, 0.35], trim), ball("活塞杆上端与A架相接的球铰", end, [0.3, 0.3, 0.3], trim), box("外摆液压缸下铰座与底轨的固定墩", [side * 3.2, 0.7, -2.2], [0.7, 0.6, 0.8], body));
      const cheek = solidPanel("头滑轮独立承重颊板上的真实轴孔", [side * 0.34, 7.65, 3.25], [0, 0, 1], [0, 1, 0], [[-0.35, -0.45], [0.35, -0.45], [0.35, 0.85], [-0.35, 0.85]], [Array.from({ length: 12 }, (_, index) => [Math.cos(index * Math.PI / 6) * 0.11, Math.sin(index * Math.PI / 6) * 0.11] as [number, number])]);
      cheek.color = body;
      parts.push(cheek, part("嵌在头部颊板孔中的滑轮轴承", "lathe", trim, [side * 0.34, 7.65, 3.25], [1, 1, 1], [0, 0, 90], { profile: [{ x: 0.105, y: -0.1 }, { x: 0.18, y: -0.1 }, { x: 0.18, y: 0.1 }, { x: 0.105, y: 0.1 }, { x: 0.105, y: -0.1 }] }), part("液压动力柜到独立缸下端的真实接续软管", "tube", dark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: 0.045, path: [{ x: 2.7, y: 1.2, z: -3.5 }, { x: side * 3.2, y: 0.7, z: -3 }, { x: side * 3.2, y: 1.1, z: -2.2 }] }));
    }
    const dy = 6.05, dz = 6.55, distance = Math.hypot(dy, dz), ratio = 0.25 / distance, normalY = dy / distance * ratio + dz / distance * Math.sqrt(1 - ratio * ratio), normalZ = dz / distance * ratio - dy / distance * Math.sqrt(1 - ratio * ratio), angle = Math.atan2(normalZ, normalY);
    const path: Triple[] = Array.from({ length: 37 }, (_, index) => { const a = angle - Math.PI * 6 + index * Math.PI / 6; return [-1.3 + index * 1.3 / 36, 1.6 + Math.cos(a) * 0.75, -3.3 + Math.sin(a) * 0.75]; });
    const start: Triple = [0, 1.6 + normalY * 0.75, -3.3 + normalZ * 0.75], end: Triple = [0, 7.65 + normalY * 0.5, 3.25 + normalZ * 0.5];
    for (const f of [1 / 3, 2 / 3]) path.push([0, start[1] + (end[1] - start[1]) * f, start[2] + (end[2] - start[2]) * f]);
    for (let index = 0; index <= 12; index++) { const a = angle + (Math.PI / 2 - angle) * index / 12; path.push([0, 7.65 + Math.cos(a) * 0.5, 3.25 + Math.sin(a) * 0.5]); }
    path.push([0, 6, 3.75], [0, 4.02, 3.75]);
    parts.push(part("从缆鼓绕过头滑轮凹槽并接到吊头的连续提升缆", "tube", dark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: 0.045, path: path.map(([x, y, z]) => ({ x, y, z })) }), part("在上部保留真实钩口的负载吊钩", "extrude", trim, [-0.1, 3.5, 3.75], [1, 1, 1], [0, 0, 0], { depth: 0.16, profile: annularSector(0.18, 0.3, Math.PI * 5 / 6, Math.PI * 43 / 18, 12) }), ring("吊钩上端与提升缆相接的真实吊眼", trim, 0.12, 0.055, 0, 0.14, { position: { x: 0, y: 3.9, z: 3.75 }, rotation: { x: 90, y: 0, z: 0 } }), roundLink("吊眼下沿与钩颈之间的实连接柄", [0, 3.75, 3.75], [0, 3.9, 3.75], 0.12, trim));
    return parts;
  } },
  { name: "独立卷缆鼓导缆轮海下车库管理吊笼", theme: "现代", itemType: "设施", tags: ["TMS海下车库", "脐带缆管理吊笼", "空ROV对接车库"], create: () => {
    const parts: ModelPart[] = [...[-1, 1].map(side => box("海下车库独立接地的长底滑轨", [side * 0.9, 0.1, 0], [0.18, 0.2, 3.2], dark)), ...[-1.5, 0, 1.5].map(z => box("下部空车库滑轨之间的横向底梁", [0, 0.1, z], [1.8, 0.2, 0.18], dark)), ...[-1, 1].map(side => box("车库顶部纵向承重梁", [side * 0.9, 2.2, 0], [0.18, 0.2, 3.2], body)), ...[-1.5, 0.8, 1.5].map(z => box("顶梁之间承载卷缆和对接叉的实横梁", [0, 2.2, z], [1.8, 0.2, 0.18], body)), cylinder("车库顶部独立脐带缆卷筒", [0, 3.3, 0.4], [0.7, 1.4, 0.7], dark, [0, 0, 90]), cylinder("穿过卷筒两端轴承并进入减速器的连续轴", [0, 3.3, 0.4], [0.12, 2, 0.12], trim, [0, 0, 90]), box("上部卷筒一侧的独立减速箱", [0.95, 3.3, 0.4], [0.26, 0.45, 0.45], body), cylinder("同轴接在减速箱外侧的密封卷缆电机", [1.1, 3.3, 0.4], [0.3, 0.35, 0.3], trim, [0, 0, 90]), groovedSheave("位于车库前缘上方的真实凹槽出缆轮", [0, 2.75, -1.45], 0.215, 0.18, 0.16), cylinder("出缆轮穿过两旁托架的短横轴", [0, 2.75, -1.45], [0.07, 0.6, 0.07], dark, [0, 0, 90]), box("由顶横梁承托而向下开放的对接叉根座", [0, 2.05, 0.8], [0.6, 0.3, 0.7], dark), cylinder("对接叉两臂之间可锁住接口的短横销", [0, 1.9, 0.65], [0.1, 0.6, 0.1], trim, [0, 0, 90])];
    for (const side of [-1, 1]) {
      for (const z of [-1.5, 1.5]) parts.push(strut("车库底梁到顶梁的独立承重立柱", [side * 0.9, 0.2, z], [side * 0.9, 2.2, z], 0.12, body));
      parts.push(strut("车库两侧避免堵住前入口的斜撑", [side * 0.9, 0.2, -1.45], [side * 0.9, 2.2, 1.45], 0.07, dark), box("车库上部独立浮力材料长块", [side * 0.7, 2.5, 0], [0.45, 0.4, 3.2], trim), box("卷筒轴承与车库顶梁之间的承座", [side * 0.84, 2.7, 0.4], [0.16, 1, 0.5], dark), part("卷筒两端具有真实轴孔的固定轴承", "lathe", body, [side * 0.84, 3.3, 0.4], [1, 1, 1], [0, 0, 90], { profile: [{ x: 0.065, y: -0.1 }, { x: 0.15, y: -0.1 }, { x: 0.15, y: 0.1 }, { x: 0.065, y: 0.1 }, { x: 0.065, y: -0.1 }] }), ring("顶部脐带缆卷筒端部护缆圈", body, 0.55, 0.2, 0, 0.06, { position: { x: side * 0.7, y: 3.3, z: 0.4 }, rotation: { x: 0, y: 0, z: 90 } }), strut("出缆轮两侧接到车库前横梁的承架", [side * 0.22, 2.2, -1.5], [side * 0.22, 2.75, -1.45], 0.08, body), strut("从顶横梁向下伸出的独立对接叉臂", [side * 0.2, 2.05, 0.8], [side * 0.2, 1.8, 0.65], 0.08, dark), strut("后上部顶梁到中央吊眼的斜吊架", [side * 0.9, 2.2, 1.5], [0, 3.5, 1.15], 0.1, body));
    }
    parts.push(ring("独立海下车库上部真实起吊圆眼", trim, 0.18, 0.06, 0, 0.12, { position: { x: 0, y: 3.65, z: 1.15 }, rotation: { x: 90, y: 0, z: 0 } }));
    const dy = -0.55, dz = -1.85, distance = Math.hypot(dy, dz), ratio = 0.175 / distance, normalY = dy / distance * ratio - dz / distance * Math.sqrt(1 - ratio * ratio), normalZ = dz / distance * ratio + dy / distance * Math.sqrt(1 - ratio * ratio), angle = Math.atan2(normalZ, normalY);
    const path: Triple[] = Array.from({ length: 51 }, (_, index) => { const a = angle + Math.PI * 10 - index * Math.PI / 5; return [-0.6 + index * 0.6 / 50, 3.3 + Math.cos(a) * 0.39, 0.4 + Math.sin(a) * 0.39]; });
    const start: Triple = [0, 3.3 + normalY * 0.39, 0.4 + normalZ * 0.39], end: Triple = [0, 2.75 + normalY * 0.215, -1.45 + normalZ * 0.215];
    for (const f of [1 / 3, 2 / 3]) path.push([0, start[1] + (end[1] - start[1]) * f, start[2] + (end[2] - start[2]) * f]);
    for (let index = 0; index <= 6; index++) { const a = angle + (-Math.PI / 2 - angle) * index / 6; path.push([0, 2.75 + Math.cos(a) * 0.215, -1.45 + Math.sin(a) * 0.215]); }
    path.push([0, 2, -1.665], [0, 1.15, -1.665]);
    parts.push(part("由卷筒绕过导缆槽垂到车库外的连续脐带缆", "tube", dark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: 0.035, path: path.map(([x, y, z]) => ({ x, y, z })) }));
    return parts;
  } },
];
