import { part, type ModelPart } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { box, cylinder, strut, cab, wheel, transportColors, type TransportDefinition } from "./parts";

function crawlerSide(x: number): ModelPart {
  const outline = (radius: number): [number, number][] => [...Array.from({ length: 9 }, (_, index): [number, number] => { const angle = (-90 + index * 22.5) * Math.PI / 180; return [0.7 + Math.sin(angle) * radius, 2.6 + Math.cos(angle) * radius]; }), ...Array.from({ length: 9 }, (_, index): [number, number] => { const angle = (90 + index * 22.5) * Math.PI / 180; return [0.7 + Math.sin(angle) * radius, -2.6 + Math.cos(angle) * radius]; })];
  const value = polygon("环抱负重轮的重型连续闭合履带", transportColors.dark, outline(0.7), 1.3, [x + 0.65, 0, 0], [outline(0.54)]);
  value.rotation.z = 90;
  return value;
}

function crowdRack(x: number): ModelPart {
  const heightAt = (z: number) => 7 + (z + 2.3) * 2.1 / 7.8 - 0.16;
  const outline: [number, number][] = [];
  for (let tooth = 0; tooth < 43; tooth++) {
    const z = -9.6 + tooth * 0.17;
    outline.push([z, heightAt(z)], [z + 0.035, heightAt(z + 0.035) - 0.06], [z + 0.105, heightAt(z + 0.105) - 0.06], [z + 0.14, heightAt(z + 0.14)]);
  }
  const last = outline.at(-1)![0];
  outline.push([last, heightAt(last) + 0.075], [-9.6, heightAt(-9.6) + 0.075]);
  const value = polygon("连接长斗杆腹面的连续实际推压齿条", transportColors.body, outline, 0.22);
  value.vertices = value.vertices!.map(point => ({ x: point.y - 0.11, y: point.z, z: point.x }));
  value.position.x = x;
  return value;
}

function dipper(): ModelPart[] {
  return [part("正铲斗的开放前口底与连续弧形背壁", "extrude", transportColors.signal, [0, 2.6, -11.5], [1, 1, 1], [0, -90, 0], { depth: 3.8, profile: [{ x: -1.65, y: 0 }, { x: 1.05, y: 0 }, { x: 1.65, y: 0.6 }, { x: 1.44, y: 2.5 }, { x: 1.14, y: 2.5 }, { x: 1.32, y: 0.75 }, { x: 0.9, y: 0.28 }, { x: -1.65, y: 0.28 }] }), ...[-1, 1].map(side => part("正铲斗两侧的实厚弧形颊板", "extrude", transportColors.signal, [side * 1.82, 2.6, -11.5], [1, 1, 1], [0, -90, 0], { depth: 0.16, profile: [{ x: -1.65, y: 0 }, { x: 1.05, y: 0 }, { x: 1.65, y: 0.6 }, { x: 1.44, y: 2.5 }, { x: 0.8, y: 2.5 }, { x: -1.4, y: 0.7 }] })), ...[-1.5, -0.75, 0, 0.75, 1.5].map(x => part("沿正铲斗前沿独立固定的前尖掘进斗齿", "extrude", transportColors.trim, [x, 2.65, -13.2], [1, 1, 1], [0, -90, 0], { depth: 0.38, profile: [{ x: -0.35, y: 0 }, { x: 0.27, y: 0 }, { x: 0.27, y: 0.25 }, { x: -0.35, y: 0.05 }] }))];
}

// 齿条推压、双腿斗杆和提升绳是不同于液压反铲/悬索拉铲的主体机构。
// 机种依据：https://www.komatsu.com/content/dam/komatsu/sales-and-marketing-documents/spec-sheet/electric-rope-shovels/en-4100cbspec01-0218-v1.pdf
export const roadExpansionBatchEight: TransportDefinition[] = [
  { name: "双腿齿条斗杆电动绳索正铲", theme: "现代", tags: ["电动绳索正铲", "齿条小齿轮推压", "刚性双腿斗杆"], create: () => {
    const parts: ModelPart[] = [crawlerSide(-2.7), crawlerSide(2.7), box("横跨两侧履带的下车架", [0, 1.12, 0], [4.7, 0.75, 6.4], transportColors.dark), cylinder("承托整个上车体的重载回转支承", [0, 1.93, 0], [4.8, 0.85, 4.8], transportColors.body), box("容纳电驱卷扬设备的宽大上机房", [0, 3.42, 0.95], [5.2, 3.0, 6.5], transportColors.body), ...cab([-2.16, 4.3, -2.22], [1.6, 1.65, 1.95]), cylinder("正铲主臂车体端贯穿枢轴", [0, 3.62, -2], [0.48, 2.35, 0.48], transportColors.dark, [0, 0, 90]), cylinder("斗杆鞍座支承横轴", [0, 6.4, -3.7], [0.42, 2.0, 0.42], transportColors.body, [0, 0, 90]), box("推压齿轮轴与主臂鞍座的连接体", [0, 6.31, -3.7], [0.95, 0.32, 0.55], transportColors.dark), cylinder("两个推压齿轮共用驱动轴", [0, 6.2, -3.7], [0.16, 1.3, 0.16], transportColors.dark, [0, 0, 90]), ...dipper(), cylinder("斗杆末端贯穿斗背的承重销", [0, 4.9, -10.1], [0.36, 2.0, 0.36], transportColors.body, [0, 0, 90]), cylinder("机房后部主提升绳卷筒", [0, 4.1, 2.1], [0.95, 2.7, 0.95], transportColors.dark, [0, 0, 90]), strut("从机房前端引向主臂顶滑轮的外露提升钢绳", [0.22, 4.1, -2.35], [0.22, 11.2, -6.6], 0.055), strut("从主臂头滑轮下垂到铲斗吊梁的提升绳", [0.22, 11.2, -6.6], [0, 5.54, -11.45], 0.055), strut("从后支承桅顶固定主臂仰角的拉索", [0, 7.5, 1.4], [0, 11.2, -6.6], 0.07), cylinder("主臂顶端提升绳导向滑轮", [0.22, 11.2, -6.6], [0.55, 0.35, 0.55], transportColors.body, [0, 0, 90])];
    const pinionProfile = Array.from({ length: 32 }, (_, index) => { const angle = index * Math.PI / 16, radius = index % 4 === 0 || index % 4 === 3 ? 0.185 : 0.22; return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius }; });
    for (const side of [-1, 1]) {
      for (const z of [-2.6, -1.3, 0, 1.3, 2.6]) parts.push(...wheel([side * 2.7, 0.7, z], 0.54, 1.05));
      parts.push(strut("高主臂左右独立承力弦杆", [side * 0.75, 3.62, -2], [side * 0.4, 11.2, -6.6], 0.28, transportColors.signal), strut("后支承A形桅独立侧腿", [side * 1.65, 3.0, 2.5], [0, 7.5, 1.4], 0.25, transportColors.body), strut("穿过鞍座向工作面刚性推压的长斗杆", [side * 0.28, 7.0, -2.3], [side * 0.28, 4.9, -10.1], 0.34, transportColors.signal), crowdRack(side * 0.28), part("与斗杆实体齿条啮合的独立推压小齿轮", "extrude", transportColors.trim, [side * 0.28, 6.2, -3.7], [1, 1, 1], [0, 90, 0], { depth: 0.23, profile: pinionProfile }), box("把刚性斗杆末端接到斗背的承重耳", [side * 0.48, 4.8, -10.0], [0.55, 0.76, 0.6], transportColors.signal), strut("从斗侧吊耳汇向提升绳的三角吊梁", [side * 1.5, 5.0, -11.0], [0, 5.54, -11.45], 0.13, transportColors.body));
    }
    for (let index = 0; index < 5; index++) {
      const a = index / 5, b = (index + 1) / 5, y0 = 3.62 + a * 7.58, y1 = 3.62 + b * 7.58, z0 = -2 - a * 4.6, z1 = -2 - b * 4.6, x0 = 0.75 - a * 0.35, x1 = 0.75 - b * 0.35;
      parts.push(strut("高主臂左右弦杆之间的横向腹杆", [-x0, y0, z0], [x0, y0, z0], 0.1, transportColors.body), strut("高主臂交叉传力的斜向腹杆", [-x0, y0, z0], [x1, y1, z1], 0.1, transportColors.body));
    }
    parts.push(box("机房后端高压供电接线箱", [1.85, 3.01, 4.25], [1.0, 1.5, 0.25], transportColors.dark), part("从供电接口收回机房的粗电缆", "tube", transportColors.dark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: 0.06, path: [{ x: 1.85, y: 3, z: 4.4 }, { x: 1.85, y: 2.3, z: 4.5 }, { x: 1.0, y: 2.2, z: 4.15 }, { x: 0.7, y: 2.4, z: 3.8 }] }));
    return parts;
  } },
];
