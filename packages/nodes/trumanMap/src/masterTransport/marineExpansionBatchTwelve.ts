import { part, type ModelPart, type Triple } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { box, cylinder, strut, surface, transportColors, type TransportDefinition } from "./parts";

// 按底铰取能、径向履带夹持、非对称换向舟的独立构造制作原创几何，不提供作业动力仿真。
// https://www.emec.org.uk/about-us/wave-clients/aquamarine-power/
// https://www.waveenergyscotland.co.uk/research-strategy/knowledge-capture/aquamarine-power-historic-reports/
// https://maritimedevelopments.com/products/pipelay-tensioners/tts-4-310-02-series-tensioner
// https://mused.com/items/7966/plate-f-representation-of-a-flying-proa/

const body = transportColors.body, dark = transportColors.dark, trim = transportColors.trim, wood = transportColors.wood;

function roundLink(name: string, start: Triple, end: Triple, width: number, color: string): ModelPart {
  const value = strut(name, start, end, width, color);
  value.shape = "cylinder";
  return value;
}

function tensionerTrack(angle: number): ModelPart {
  const outline = (radius: number): [number, number][] => [1, -1].flatMap(end => Array.from({ length: 9 }, (_, index) => {
    const a = index * Math.PI / 8 + (end < 0 ? Math.PI : 0);
    return [Math.sin(a) * radius + end * 2.2, Math.cos(a) * radius] as [number, number];
  }));
  const value = polygon("上下夹持回路均连通的完整履带带环", dark, outline(0.42), 0.6, [0, 0, 0], [outline(0.32)]);
  value.vertices = value.vertices!.map(point => ({ x: point.y - 0.3, y: point.z + 1.12, z: point.x }));
  value.position = { x: 0, y: 2.65, z: 0 };
  value.rotation.z = angle;
  return value;
}

function asymmetricVoyagingHull(): ModelPart {
  const sections = [[-9.5, -0.04, 0.04, 0, 1.8, 1.3], [-8, -0.4, 0.18, 0.1, 1.45, 0.4], [-5, -0.95, 0.2, 0.18, 1.3, 0.08], [0, -1.15, 0.2, 0.2, 1.3, 0], [5, -0.95, 0.2, 0.18, 1.3, 0.08], [8, -0.4, 0.18, 0.1, 1.45, 0.4], [9.5, -0.04, 0.04, 0, 1.8, 1.3]];
  const vertices = sections.flatMap(([z, windward, lee, keel, top, bottom]) => {
    const outer: Triple[] = [[lee!, top!, z!], [lee!, bottom! + 0.2, z!], [keel!, bottom!, z!], [(windward! + keel!) / 2, bottom! + 0.16, z!], [windward!, top!, z!]], center = (lee! + windward!) / 2;
    return [...outer, ...outer.map(([x, y, localZ], index) => [center + (x - center) * 0.8, y + (index === 0 || index === 4 ? 0 : 0.08), localZ] as Triple)].map(([x, y, localZ]) => ({ x, y, z: localZ }));
  });
  const indices: number[] = [];
  for (let section = 0; section < sections.length - 1; section++) {
    const start = section * 10;
    for (let edge = 0; edge < 4; edge++) {
      const a = start + edge, b = a + 1;
      indices.push(a, a + 10, b + 10, a, b + 10, b, a + 5, b + 15, a + 15, a + 5, b + 5, b + 15);
    }
    indices.push(start, start + 15, start + 10, start, start + 5, start + 15, start + 4, start + 14, start + 19, start + 4, start + 19, start + 9);
  }
  for (const end of [0, sections.length - 1]) for (let edge = 0; edge < 4; edge++) {
    const a = end * 10 + edge, b = end * 10 + (edge + 1) % 5;
    if (!end) indices.push(a, b, b + 5, a, b + 5, a + 5);
    else indices.push(a, b + 5, b, a, a + 5, b + 5);
  }
  return part("下风侧平直而上风侧丰满的双艏真实敞口舟壳", "mesh", wood, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

export const marineExpansionBatchTwelve: TransportDefinition[] = [
  { name: "海床底铰大幅浮板液压波浪能取能装置", theme: "现代", itemType: "设施", tags: ["近岸摆动波能翻板", "底铰式波能装置", "Oyster 类构造"], create: () => {
    const parts: ModelPart[] = [box("海床锚定的重型宽基台", [0, 0.5, 0.5], [22, 1, 10], dark), part("底部绕共同横轴摆动的宽大密封浮板", "extrude", body, [0, 2, 0], [1, 1, 1], [0, 90, 0], { depth: 18, profile: [{ x: -1.2, y: 0 }, { x: -2.2, y: 1.5 }, { x: -2.2, y: 8 }, { x: -1.3, y: 10 }, { x: 1.3, y: 10 }, { x: 2, y: 8 }, { x: 2, y: 1.5 }, { x: 1, y: 0 }] }), cylinder("贯穿整块浮板下缘的承力铰轴", [0, 2, 0], [1, 21.2, 1], dark, [0, 0, 90]), box("基台后沿独立高压水汇流箱", [0, 1.55, 5], [3, 1.1, 1.1], trim)];
    for (const x of [-9.7, 9.7]) parts.push(part("真正围住铰轴的厚壁滑动轴承座", "lathe", trim, [x, 2, 0], [1, 1, 1], [0, 0, 90], { profile: [{ x: 0.51, y: -0.35 }, { x: 0.9, y: -0.35 }, { x: 0.9, y: 0.35 }, { x: 0.51, y: 0.35 }, { x: 0.51, y: -0.35 }] }), box("将铰轴承载传回海床基台的实脚", [x, 1.05, 0], [1, 0.4, 1.2], dark));
    for (const side of [-1, 1]) {
      const start: Triple = [side * 9.7, 1.6, 5], middle: Triple = [side * 9.7, 5.1, 2.67], rodStart: Triple = [side * 9.7, 4.65, 2.97], end: Triple = [side * 9.7, 7, 1.4];
      parts.push(roundLink("基座铰接的大型双作用取能缸筒", start, middle, 0.9, dark), roundLink("由缸筒伸到浮板侧耳的长活塞杆", rodStart, end, 0.38, trim), cylinder("取能缸下端连接基台的铰销", start, [0.3, 1, 0.3], trim, [0, 0, 90]), box("下铰销两侧的基台支座", [side * 9.7, 1.28, 5], [1.3, 0.6, 1.1], body), strut("浮板端面向外伸出的活塞杆铰耳", [side * 8.8, 7, 1.4], end, 0.38, dark), cylinder("活塞杆端部与浮板铰耳的实体销", end, [0.28, 0.8, 0.28], trim, [0, 0, 90]), part("下铰液压接头连到基台汇流箱的软管", "tube", dark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: 0.12, path: [{ x: side * 9.7, y: 1.9, z: 4.8 }, { x: side * 7, y: 1.6, z: 5.3 }, { x: side * 1.4, y: 1.6, z: 5 }] }), part("汇流箱向岸侧管路开放的厚壁连接口", "lathe", dark, [side * 0.55, 1.5, 5.7], [1, 1, 1], [90, 0, 0], { profile: [{ x: 0.15, y: -0.5 }, { x: 0.22, y: -0.5 }, { x: 0.22, y: 0.5 }, { x: 0.15, y: 0.5 }, { x: 0.15, y: -0.5 }] }));
    }
    for (const y of [4, 7, 9.8]) parts.push(box("沿浮板背面实接的横向刚性加强肋", [0, y, 2.2], [17, 0.2, 0.3], dark));
    return parts;
  } },
  { name: "环框径向四履带对置海缆铺放张紧机", theme: "现代", itemType: "设施", tags: ["海缆张紧机", "软管履带张紧器", "四带径向夹持"], create: () => {
    const parts: ModelPart[] = [...[-1, 1].map(side => box("整机与船甲板连接的长安装底轨", [side * 1.8, 0.2, 0], [0.5, 0.4, 8.4], dark)), ...[-3.7, 0, 3.7].map(z => box("安装底轨之间的横向承载梁", [0, 0.2, z], [3.6, 0.25, 0.4], dark))];
    for (const z of [-2.7, 2.7]) {
      parts.push(part("中央真正贯通的重型圆环主框", "lathe", body, [0, 2.65, z], [1, 1, 1], [90, 0, 0], { profile: [{ x: 1.65, y: -0.25 }, { x: 2.25, y: -0.25 }, { x: 2.25, y: 0.25 }, { x: 1.65, y: 0.25 }, { x: 1.65, y: -0.25 }] }));
      for (const side of [-1, 1]) parts.push(box("环框外下缘与安装底轨之间的支脚", [side * 1.8, 0.95, z], [0.35, 1.1, 0.4], body));
    }
    for (const angle of [0, 90, 180, 270]) {
      const radians = angle * Math.PI / 180, point = (x: number, y: number, z: number): Triple => [x * Math.cos(radians) - y * Math.sin(radians), 2.65 + x * Math.sin(radians) + y * Math.cos(radians), z];
      parts.push(tensionerTrack(angle), box("在带环内部承载整个夹持架的长梁", point(0, 1.12, 0), [0.42, 0.3, 4.4], body, [0, 0, angle]), cylinder("与履带端轮共轴的独立驱动电机", point(0.55, 1.12, -2.2), [0.48, 0.55, 0.48], trim, [0, 0, angle + 90]));
      for (const z of [-2.2, 2.2]) {
        const end = Math.sign(z), mount = polygon("在带环两侧绕过弯头而不穿胶带的U形承托架", body, [[-0.62, 2.05], [-0.38, 2.05], [-0.38, 2.63], [0.38, 2.63], [0.38, 2.05], [0.62, 2.05], [0.62, 2.81], [-0.62, 2.81]].map(([x, localZ]) => [x!, localZ! * end] as [number, number]), 0.24);
        mount.vertices = mount.vertices!.map(point => ({ ...point, y: point.y + 1 }));
        mount.position.y = 2.65;
        mount.rotation.z = angle;
        parts.push(cylinder("与完整带环内壁相接的履带端轮", point(0, 1.12, z), [0.64, 0.58, 0.64], body, [0, 0, angle + 90]), cylinder("真正穿过端轮并接在两侧U架上的短轴", point(0, 1.12, z), [0.12, 1.2, 0.12], trim, [0, 0, angle + 90]), mount);
      }
      for (const z of [-2.7, 2.7]) parts.push(cylinder("真实接在厚圆环框内的径向液压筒", point(0, 1.77, z), [0.28, 0.66, 0.28], dark, [0, 0, angle]), cylinder("由液压筒伸到履带承载梁的压紧杆", point(0, 1.31, z), [0.13, 0.38, 0.13], trim, [0, 0, angle]));
      for (let index = 0; index < 7; index++) parts.push(part("朝向中心且留有真实V形夹缆槽的夹持垫", "extrude", dark, [0, 2.65, -1.8 + index * 0.6], [1, 1, 1], [0, 0, angle], { depth: 0.32, profile: [{ x: -0.2, y: 0.74 }, { x: 0.2, y: 0.74 }, { x: 0.2, y: 0.2 }, { x: 0, y: 0.34 }, { x: -0.2, y: 0.2 }] }));
    }
    for (const z of [-3.7, 3.7]) {
      parts.push(part("张紧主框两端的真实开口导缆圈", "lathe", trim, [0, 2.65, z], [1, 1, 1], [90, 0, 0], { profile: [{ x: 0.5, y: -0.15 }, { x: 0.8, y: -0.15 }, { x: 0.8, y: 0.15 }, { x: 0.5, y: 0.15 }, { x: 0.5, y: -0.15 }] }));
      for (const side of [-1, 1]) parts.push(box("导缆圈两侧落到底轨横梁的支柱", [side * 0.55, 1.25, z], [0.12, 2.1, 0.18], body));
    }
    return parts;
  } },
  { name: "双艏非对称敞口单支臂换向远航帆舟", theme: "异域", tags: ["单侧支臂帆舟", "反向换舷帆舟", "flying proa"], create: () => {
    const top: Triple = [-0.9, 11.5, -1.8], tack: Triple = [-0.08, 1.65, -8.6], clew: Triple = [-0.08, 1.65, 8];
    const parts: ModelPart[] = [asymmetricVoyagingHull(), part("位于上风侧并独立保持浮力的细长支臂浮舟", "lathe", wood, [-5, 0.38, 0], [1, 1, 1], [90, 0, 0], { profile: [{ x: 0, y: -5.4 }, { x: 0.25, y: -4.5 }, { x: 0.35, y: -2 }, { x: 0.35, y: 2 }, { x: 0.25, y: 4.5 }, { x: 0, y: 5.4 }] }), box("三根支臂梁共同承载的侧向航行平台", [-2.25, 1.42, 0], [2.5, 0.12, 6.3], wood), strut("从中支臂梁处起立的向上风侧斜桅", [-0.1, 1.35, 0], top, 0.13, wood), strut("接在同一帆顶的前缘长帆桁", tack, top, 0.09, wood), strut("两个可互换舟首之间的低帆桁", tack, clew, 0.075, wood), surface("三角席帆随单侧斜桅轻微鼓出的连续帆面", trim, [tack, top, clew, [-0.65, 5, -0.5]], [0, 1, 3, 1, 2, 3, 2, 0, 3]), strut("桅顶向支臂浮舟前部张紧的支索", top, [-5, 1, -3.1], 0.025, dark), strut("桅顶向支臂浮舟后部张紧的支索", top, [-5, 1, 3.1], 0.025, dark)];
    for (const z of [-3.1, 0, 3.1]) parts.push(strut("横过敞口舟上缘的主支臂直梁", [0.15, 1.3, z], [-3.5, 1.3, z], 0.14, wood), strut("支臂末端向浮舟下弯的连接杆", [-3.5, 1.3, z], [-5, 0.96, z], 0.14, wood), cylinder("支臂浮舟上方承接下弯杆的绑扎座", [-5, 0.85, z], [0.2, 0.4, 0.2], dark));
    for (const z of [-2.4, -1.2, 0, 1.2, 2.4]) parts.push(box("侧平台上平接甲板的防滑横木", [-2.25, 1.505, z], [2.5, 0.05, 0.9], trim));
    for (const end of [-1, 1]) parts.push(strut("双艏到侧框的抗扭斜支索", [0, 1.58, end * 8.5], [-5, 1, -end * 3.1], 0.035, dark), box("将操舵长桨承在舟上缘的实心桨架", [0.1, 1.47, end * 6.8], [0.2, 0.22, 0.25], dark), strut("可换向使用的长操舵桨柄", [0.1, 1.55, end * 6.8], [1.3, 0.65, end * 9.1], 0.07, wood), box("操舵桨下端宽叶", [1.35, 0.57, end * 9.2], [0.18, 0.45, 1.15], wood, [0, end * 26, 0]));
    return parts;
  } },
];
