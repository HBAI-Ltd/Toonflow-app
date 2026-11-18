import { part, type ModelPart } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { box, cylinder, strut, transportColors, type TransportDefinition } from "./parts";

function trackBand(): ModelPart {
  const outline = (radius: number): [number, number][] => [...Array.from({ length: 9 }, (_, index): [number, number] => { const angle = (-90 + index * 22.5) * Math.PI / 180; return [0.6 + Math.sin(angle) * radius, 1.6 + Math.cos(angle) * radius]; }), ...Array.from({ length: 9 }, (_, index): [number, number] => { const angle = (90 + index * 22.5) * Math.PI / 180; return [0.6 + Math.sin(angle) * radius, -1.6 + Math.cos(angle) * radius]; })];
  const value = polygon("具有完整内侧贯通轮腔的连续履带链带", transportColors.dark, outline(0.6), 0.8, [0.4, 0, 0], [outline(0.43)]);
  value.rotation.z = 90;
  return value;
}

// 独立承载生产总成，不登记成拆车/损坏车辆，也不按尺寸或轮数扩充主项。
// https://www.scania.com/lulea/sv/home/our-operations/workshops/Sidemembers.html
// https://www.presskogyo.co.jp/en/products/car/chassis/
// https://www.itramerica.com/products/undercarriage/
export const roadExpansionBatchTwelve: TransportDefinition[] = [
  { name: "冲孔双槽纵梁梯形商用车承载车架", theme: "现代", itemType: "构件", tags: ["独立商车车架", "双纵梁与横梁", "完整承载生产总成"], create: () => {
    const holePositions = [-3.4, -2.75, -2.1, -1.45, -0.8, -0.15, 0.5, 1.15, 1.8, 2.45, 3.1, 3.5];
    const holes: [number, number][][] = [0.49, 0.61].flatMap(y => holePositions.map(z => Array.from({ length: 6 }, (_, index): [number, number] => { const angle = index * Math.PI / 3; return [y + Math.cos(angle) * 0.015, z + Math.sin(angle) * 0.015]; })));
    const parts: ModelPart[] = [];
    for (const side of [-1, 1]) {
      const web = polygon("纵梁竖腹板上两排真实贯通装配孔", transportColors.dark, [[0.41, -3.9], [0.69, -3.9], [0.69, 3.9], [0.41, 3.9]], 0.025, [side * 0.43 + 0.0125, 0, 0], holes);
      web.rotation.z = 90;
      parts.push(web, box("向车架内侧折出的纵梁上翼缘", [side * 0.36, 0.695, 0], [0.17, 0.03, 7.8], transportColors.dark), box("向车架内侧折出的纵梁下翼缘", [side * 0.36, 0.405, 0], [0.17, 0.03, 7.8], transportColors.dark), box("纵梁内侧发动机悬置的短承托耳", [side * 0.31, 0.53, -2.9], [0.25, 0.06, 0.32], transportColors.body), box("车架前端独立连接安装耳", [side * 0.43, 0.55, -3.96], [0.1, 0.17, 0.24], transportColors.body));
    }
    for (const z of [-3.4, -2.1, -0.8, 0.5, 1.8, 3.1]) {
      parts.push(part("以开口槽形截面连接两纵梁的独立横梁", "extrude", transportColors.body, [0, 0.55, z], [1, 1, 1], [0, -90, 0], { depth: 0.87, profile: [{ x: -0.07, y: -0.09 }, { x: 0.07, y: -0.09 }, { x: 0.07, y: 0.09 }, { x: -0.07, y: 0.09 }, { x: -0.07, y: 0.065 }, { x: 0.045, y: 0.065 }, { x: 0.045, y: -0.065 }, { x: -0.07, y: -0.065 }] }));
      for (const side of [-1, 1]) for (const y of [0.49, 0.61]) parts.push(cylinder("穿过腹板孔并锁固横梁端部的独立铆栓", [side * 0.43, y, z], [0.024, 0.066, 0.024], transportColors.body, [0, 0, 90]));
    }
    parts.push(box("框架尾部独立闭合连接横梁", [0, 0.55, 3.83], [0.87, 0.2, 0.14], transportColors.body));
    return parts;
  } },
  { name: "驱动导向负重张紧一体履带行走总成", theme: "现代", itemType: "构件", tags: ["独立履带行走总成", "负重轮与托链轮", "驱动轮和张紧导向轮"], create: () => {
    const parts: ModelPart[] = [trackBand(), box("位于负重轮与托链轮之间的承重轮架", [0, 0.74, 0], [0.45, 0.14, 2.3], transportColors.body), cylinder("前端独立张紧导向轮", [0, 0.6, 1.6], [0.86, 0.6, 0.86], transportColors.body, [0, 0, 90]), part("后端有真实外齿的履带驱动轮", "extrude", transportColors.body, [0, 0.6, -1.6], [1, 1, 1], [0, 90, 0], { depth: 0.6, profile: Array.from({ length: 32 }, (_, index) => { const angle = index * Math.PI / 16, radius = index % 4 === 0 || index % 4 === 3 ? 0.38 : 0.43; return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius }; }) }), box("张紧缸后铰点接回轮架的承托座", [-0.28, 0.65, 0.55], [0.25, 0.15, 0.24], transportColors.body), cylinder("沿导向轮侧面而不穿过轮体的液压张紧外筒", [-0.36, 0.6, 0.85], [0.12, 0.6, 0.12], transportColors.dark, [90, 0, 0]), cylinder("伸向导向轮轴座的张紧活塞杆", [-0.36, 0.6, 1.4], [0.055, 0.5, 0.055], transportColors.trim, [90, 0, 0])];
    for (const z of [-0.84, -0.28, 0.28, 0.84]) {
      parts.push(cylinder("下层与履带内底面接触的负重轮", [0, 0.41, z], [0.48, 0.48, 0.48], transportColors.dark, [0, 0, 90]), cylinder("负重轮横向支承轴", [0, 0.41, z], [0.08, 0.72, 0.08], transportColors.body, [0, 0, 90]), box("把轮轴两侧支腿接到主轮架的横梁", [0, 0.72, z], [0.7, 0.08, 0.15], transportColors.body));
      for (const side of [-1, 1]) parts.push(strut("在负重轮两端下伸的承重支臂", [side * 0.32, 0.74, z], [side * 0.32, 0.41, z], 0.06, transportColors.body));
    }
    for (const z of [-0.64, 0.64]) {
      parts.push(cylinder("上层与回程履带接触的独立托链轮", [0, 0.93, z], [0.2, 0.5, 0.2], transportColors.dark, [0, 0, 90]), cylinder("托链轮横向短轴", [0, 0.93, z], [0.055, 0.65, 0.055], transportColors.body, [0, 0, 90]));
      for (const side of [-1, 1]) parts.push(strut("主轮架至托链轮轴两端的短立架", [side * 0.28, 0.75, z], [side * 0.28, 0.93, z], 0.045, transportColors.body));
    }
    for (const end of [-1, 1]) {
      parts.push(cylinder("驱动轮或导向轮贯通支承轴", [0, 0.6, end * 1.6], [0.14, 0.82, 0.14], transportColors.trim, [0, 0, 90]), box("端轮滑动导向座与轮架相连的横梁", [0, 0.74, end * 1.1], [0.75, 0.1, 0.2], transportColors.body));
      for (const side of [-1, 1]) parts.push(strut("端轮轴座至承载轮架的独立导向臂", [side * 0.36, 0.74, end * 1.1], [side * 0.36, 0.6, end * 1.6], 0.06, transportColors.body));
    }
    for (const y of [-0.015, 1.215]) for (let index = 0; index < 8; index++) parts.push(box("履带直线段外表面独立防滑履齿", [0, y, -1.4 + index * 0.4], [0.83, 0.05, 0.22], transportColors.body));
    for (const end of [-1, 1]) for (let index = 0; index < 6; index++) {
      const degrees = (end > 0 ? -75 : 105) + index * 30, angle = degrees * Math.PI / 180;
      parts.push(box("绕过端轮并连续衔接直段的防滑履齿", [0, 0.6 + Math.sin(angle) * 0.615, end * 1.6 + Math.cos(angle) * 0.615], [0.83, 0.05, 0.22], transportColors.body, [90 - degrees, 0, 0]));
    }
    return parts;
  } },
];
