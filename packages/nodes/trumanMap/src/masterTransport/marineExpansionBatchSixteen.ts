import { part, ring, type ModelPart, type Triple } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { box, cylinder, strut, transportColors, type TransportDefinition } from "./parts";
import { solidPanel } from "./marineExpansionBatchTwo";

// 原创简化的双端湿背船用火管锅炉；不采用博物馆扫描模型，不提供热工、压力或制造参数。
// https://collection.sciencemuseumgroup.org.uk/objects/co39806/scotch-boiler-and-portable-fittings
// https://www.scottishmaritimemuseum.org/3d_collections/scotch-boiler-from-ps-waverley/

const body = transportColors.body, dark = transportColors.dark, trim = transportColors.trim;
const furnaceCenters: [number, number][] = [[-1.15, -0.75], [0, -1.1], [1.15, -0.75]];

function circle(x: number, y: number, radius: number, count: number): [number, number][] {
  return Array.from({ length: count }, (_, index) => [x + Math.cos(index * Math.PI * 2 / count) * radius, y + Math.sin(index * Math.PI * 2 / count) * radius]);
}

function curvedPressureBarrel(): ModelPart {
  const points: Triple[] = [-3.1, -0.15, 0.15, 3.1].flatMap(z => Array.from({ length: 48 }, (_, index) => [Math.cos(index * Math.PI / 24), Math.sin(index * Math.PI / 24), z] as Triple));
  const count = points.length, faces: number[] = [], indices: number[] = [], edges = new Map<string, [number, number]>();
  for (let row = 0; row < 3; row++) for (let column = 0; column < 48; column++) {
    if (row === 1 && column === 11) continue;
    const a = row * 48 + column, b = row * 48 + (column + 1) % 48, c = a + 48, d = b + 48;
    faces.push(a, b, d, a, d, c);
  }
  indices.push(...faces);
  for (let index = 0; index < faces.length; index += 3) {
    const triangle = faces.slice(index, index + 3);
    indices.push(triangle[2]! + count, triangle[1]! + count, triangle[0]! + count);
    for (let edge = 0; edge < 3; edge++) { const a = triangle[edge]!, b = triangle[(edge + 1) % 3]!; if (!edges.delete(`${b},${a}`)) edges.set(`${a},${b}`, [a, b]); }
  }
  for (const [a, b] of edges.values()) indices.push(a, b + count, b, a, a + count, b + count);
  return part("两端开口并在上壳真正留有蒸汽支管孔的厚壁压力筒", "mesh", body, [0, 3, 0], [1, 1, 1], [0, 0, 0], { vertices: [2.4, 2.25].flatMap(radius => points.map(([x, y, z]) => ({ x: x * radius, y: y * radius, z }))), indices });
}

function circularStrip(radius: number, left: number, right: number, upper: boolean): [number, number][] {
  const outline: [number, number][] = [[left, 0], [right, 0]], start = Math.acos(right / radius), end = Math.acos(left / radius);
  for (let index = 0; index <= 8; index++) {
    if ((!index && right === radius) || (index === 8 && left === -radius)) continue;
    const angle = start + (end - start) * index / 8;
    outline.push([Math.cos(angle) * radius, Math.sin(angle) * radius * (upper ? 1 : -1)]);
  }
  return outline;
}

function tubePlate(z: number, radius: number, name: string): ModelPart[] {
  const parts: ModelPart[] = [], lower = [-radius, -0.575, 0.575, radius], upper = [-radius, -0.45, 0.45, radius];
  for (let index = 0; index < 3; index++) {
    const [x, y] = furnaceCenters[index]!;
    parts.push(solidPanel(`${name}保留贯通炉胆口的下管板分片`, [0, 3, z], [1, 0, 0], [0, 1, 0], circularStrip(radius, lower[index]!, lower[index + 1]!, false), [circle(x, y, 0.5, 12)]));
    parts.push(solidPanel(`${name}保留三条真实烟管孔的上管板分片`, [0, 3, z], [1, 0, 0], [0, 1, 0], circularStrip(radius, upper[index]!, upper[index + 1]!, true), [0.5, 1, 1.5].map(y => circle((index - 1) * 0.9, y, 0.14, 8))));
  }
  return parts;
}

function corrugatedFurnace(x: number, y: number, z: number): ModelPart {
  const profile = [{ x: 0.46, y: -1.3 }, ...Array.from({ length: 13 }, (_, index) => ({ x: index % 2 ? 0.62 : 0.58, y: -1.3 + index * 2.6 / 12 })), { x: 0.46, y: 1.3 }, { x: 0.46, y: -1.3 }];
  return part("两端真正开通且外壁带抗塌波纹的炉胆", "lathe", dark, [x, y, z], [1, 1, 1], [90, 0, 0], { profile });
}

export const marineExpansionBatchSixteen: TransportDefinition[] = [
  { name: "双端炉胆中央湿背回烟式船用火管锅炉", theme: "欧式", itemType: "设施", tags: ["苏格兰船用锅炉", "双端湿背火管锅炉", "Scotch marine boiler 类构造"], create: () => {
    const parts: ModelPart[] = [curvedPressureBarrel(), part("外侧保留水夹层的中央湿背燃烧室筒壁", "lathe", dark, [0, 3, 0], [1, 1, 1], [90, 0, 0], { profile: [{ x: 1.93, y: -0.65 }, { x: 2.05, y: -0.65 }, { x: 2.05, y: 0.65 }, { x: 1.93, y: 0.65 }, { x: 1.93, y: -0.65 }] }), ...tubePlate(-3.1, 2.4, "前端"), ...tubePlate(3.1, 2.4, "后端"), ...tubePlate(-0.65, 2.05, "燃烧室前端"), ...tubePlate(0.65, 2.05, "燃烧室后端")];
    for (const side of [-1, 1]) {
      for (let index = 0; index < furnaceCenters.length; index++) {
        const [x, offset] = furnaceCenters[index]!, y = 3 + offset;
        parts.push(corrugatedFurnace(x, y, side * 1.9));
        if (side === -1 && index === 1) continue;
        parts.push(cylinder("位于实际炉胆孔前方的圆形加料炉门", [x, y, side * 3.24], [1.1, 0.15, 1.1], body, [90, 0, 0]), strut("与圆炉门表面实接的开闭横柄", [x - 0.2, y, side * 3.33], [x + 0.2, y, side * 3.33], 0.06, trim));
      }
      for (const x of [-0.9, 0, 0.9]) for (const y of [3.5, 4, 4.5]) parts.push(part("由中央燃烧室回到端部烟箱的厚壁直烟管", "lathe", trim, [x, y, side * 1.9], [1, 1, 1], [90, 0, 0], { profile: [{ x: 0.12, y: -1.3 }, { x: 0.16, y: -1.3 }, { x: 0.16, y: 1.3 }, { x: 0.12, y: 1.3 }, { x: 0.12, y: -1.3 }] }));
      parts.push(box("端部回烟箱与孔管板相接的底壁", [0, 3.2, side * 3.4], [2.8, 0.1, 0.6], dark), box("端部回烟箱朝外的封壁", [0, 4, side * 3.7], [2.8, 1.7, 0.1], body), ...[-1, 1].map(edge => box("回烟箱两侧封闭竖壁", [edge * 1.35, 4, side * 3.4], [0.1, 1.7, 0.6], body)), polygon("回烟箱顶部保留真实烟囱孔的封板", body, [[-1.4, -0.3], [1.4, -0.3], [1.4, 0.3], [-1.4, 0.3]], 0.1, [0, 4.8, side * 3.4], [circle(0, 0, 0.235, 12)]), part("从烟箱真实顶孔上升的厚壁排烟颈", "lathe", dark, [0, 0, side * 3.4], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0.17, y: 4.75 }, { x: 0.23, y: 4.75 }, { x: 0.23, y: 6.05 }, { x: 0.17, y: 6.05 }, { x: 0.17, y: 4.75 }] }), ring("封住烟囱颈与烟箱顶板之间接缝的环形座", trim, 0.3, 0.09, 4.85, 0.1, { position: { x: 0, y: 4.85, z: side * 3.4 } }));
    }
    parts.push(cylinder("前中炉门绕侧边铰轴转出的圆形门叶", [0.58, 1.9, -3.8], [1.1, 0.14, 1.1], body, [0, 0, 90]), cylinder("开门叶与前管板连接的竖直铰轴", [0.58, 1.9, -3.24], [0.08, 1.3, 0.08], dark), strut("铰轴座实际固定在炉门口外的管板上", [0.58, 1.9, -3.23], [0.58, 1.9, -3.08], 0.1, dark));
    for (const y of [1.65, 2.15]) parts.push(strut("铰轴与开启圆门之间的短连接铰臂", [0.58, y, -3.24], [0.58, y, -3.34], 0.06, dark));
    for (const z of [-1.6, 1.6]) {
      parts.push(box("整台锅炉落到船底基础的宽鞍座底板", [0, 0.2, z], [4.8, 0.4, 0.8], dark));
      for (const side of [-1, 1]) parts.push(strut("鞍座向外压力筒下侧实际传力的斜撑", [side * 2, 0.4, z], [side * 1.2, 0.94, z], 0.22, dark));
    }
    parts.push(part("从真实上壳孔穿入蒸汽空间的厚壁支管", "lathe", dark, [0.156, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0.22, y: 5.05 }, { x: 0.31, y: 5.05 }, { x: 0.31, y: 5.9 }, { x: 0.22, y: 5.9 }, { x: 0.22, y: 5.05 }] }), ring("蒸汽支管下部真实环形接续法兰", trim, 0.43, 0.14, 5.4, 0.1, { position: { x: 0.156, y: 5.4, z: 0 } }), cylinder("蒸汽支管上方处于闭合状态的阀体", [0.156, 5.9, 0], [0.8, 0.25, 0.8], body), cylinder("阀体向上接入手轮的实际阀杆", [0.156, 6.18, 0], [0.07, 0.48, 0.07], dark), cylinder("与阀杆同轴的手轮中心毂", [0.156, 6.4, 0], [0.16, 0.1, 0.16], trim), ring("具有真实透空中心的蒸汽阀手轮轮缘", trim, 0.4, 0.05, 6.4, 0.06, { position: { x: 0.156, y: 6.4, z: 0 } }));
    for (let index = 0; index < 3; index++) {
      const angle = index * Math.PI * 2 / 3;
      parts.push(strut("手轮轮缘实接中心毂的独立辐条", [0.156 + Math.cos(angle) * 0.07, 6.4, Math.sin(angle) * 0.07], [0.156 + Math.cos(angle) * 0.37, 6.4, Math.sin(angle) * 0.37], 0.045, trim));
    }
    return parts;
  } },
];
