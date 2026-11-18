import { Euler, Quaternion, Vector3 } from "three";
import { part, ring, type ModelPart, type Triple } from "../assetModelParts";
import { tapered } from "../masterNature/shared";
import { cylinderBetween } from "./aerospaceExpansionBatchFour";
import { box, cylinder, strut, transportColors, type TransportDefinition } from "./parts";

function lobedEnvelope(name: string, radii: Triple, lobes: number, indentation: number, position: Triple, rotation: Triple = [0, 0, 0]): ModelPart {
  const count = lobes * 4, vertices = [{ x: 0, y: radii[1], z: 0 }], indices: number[] = [];
  for (let level = 1; level < 10; level++) {
    const latitude = level * Math.PI / 10;
    for (let index = 0; index < count; index++) {
      const angle = index * Math.PI * 2 / count, factor = 1 - indentation * Math.sin(lobes * angle / 2) ** 2 * Math.sin(latitude);
      vertices.push({ x: radii[0] * Math.sin(latitude) * Math.cos(angle) * factor, y: radii[1] * Math.cos(latitude), z: radii[2] * Math.sin(latitude) * Math.sin(angle) * factor });
    }
  }
  vertices.push({ x: 0, y: -radii[1], z: 0 });
  for (let index = 0; index < count; index++) {
    const next = (index + 1) % count;
    indices.push(0, next + 1, index + 1);
    for (let level = 0; level < 8; level++) {
      const a = 1 + level * count + index, b = 1 + level * count + next;
      indices.push(a, b, b + count, a, b + count, a + count);
    }
    indices.push(vertices.length - 1, 1 + 8 * count + index, 1 + 8 * count + next);
  }
  return part(name, "mesh", transportColors.trim, position, [1, 1, 1], rotation, { vertices, indices });
}

// 原创米制造型依据结构类别简化，不复刻任务型号或把同体的载荷、状态分成主项。
// https://www.nasa.gov/scientificballoons/types-of-balloons/
// https://www.nasa.gov/wp-content/uploads/2023/03/super-pressure-balloon-fact-sheet.pdf
// https://quicksearch.dla.mil/qsDocDetails.aspx?ident_number=7652
// https://pds.nasa.gov/data/mpfl-m-asimet-4-ddr-edl-v1.0/mpam_0001/document/insthost.htm
export const aerospaceExpansionBatchEleven: TransportDefinition[] = [
  { name: "南瓜筋条超压高空气球科学吊载系统", theme: "现代", tags: ["高空气球", "密封扁球包络", "经线张力筋", "完整科学吊载系统"], create: () => {
    const parts: ModelPart[] = [lobedEnvelope("沿经向受筋条约束的连续南瓜形密封包络", [30, 18, 30], 12, 0.08, [0, 48, 0]), cylinder("包络顶部的封闭极点接头", [0, 66.05, 0], [0.8, 0.18, 0.8], transportColors.body), cylinder("下部悬挂系统连接的封闭极点接头", [0, 30, 0], [1.0, 0.4, 1.0], transportColors.body), box("科学吊舱内的统一承力仪器架", [0, 2.2, 0], [3.5, 2.8, 2.8], transportColors.body), box("吊舱顶部悬挂横梁", [0, 3.7, 0], [4.0, 0.24, 3.4], transportColors.dark), box("吊舱前方连续热控面", [0, 2.3, -1.43], [2.8, 2.1, 0.08], transportColors.trim), cylinder("科学吊舱上方短通信天线", [0, 4.35, 0], [0.12, 1.1, 0.12], transportColors.dark)];
    for (let index = 0; index < 12; index++) {
      const angle = (index + 0.5) * Math.PI / 6;
      const path: Triple[] = Array.from({ length: 11 }, (_, level) => {
        const latitude = level * Math.PI / 10, radius = 30 * Math.sin(latitude) * (1 - 0.08 * Math.sin(latitude)) + 0.035;
        return [Math.cos(angle) * radius, 48 + Math.cos(latitude) * 18, Math.sin(angle) * radius];
      });
      parts.push(tapered("从顶部连续绕至底部极点的经向张力筋", transportColors.body, path, path.map(() => 0.045)));
    }
    for (const side of [-1, 1]) {
      parts.push(box("仪器架下方的防撞着陆滑橇", [side * 2.0, 0.15, 0], [0.2, 0.3, 3.8], transportColors.dark), box("吊舱侧向展开的光伏供电翼", [side * 4.5, 3.7, 0], [5.0, 0.08, 2.8], "#496e82"), strut("由承力架接至光伏翼外段的斜撑", [side * 1.65, 2.3, 0], [side * 5.7, 3.7, 0], 0.08));
      for (const end of [-1, 1]) parts.push(strut("仪器吊舱至防撞滑橇的落地支承", [side * 1.65, 0.9, end * 1.25], [side * 2.0, 0.3, end * 1.25], 0.12), strut("下极点至科学吊舱承力角点的长悬挂索", [side * 0.28, 29.9, end * 0.28], [side * 1.8, 3.8, end * 1.5], 0.055, transportColors.trim));
    }
    return parts;
  } },
  { name: "环缝带状大阻力回收降落伞系统", theme: "现代", tags: ["环缝带状伞", "真实贯通通风环缝", "经向承力带", "大阻力回收系统"], create: () => {
    const parts: ModelPart[] = [cylinder("由回收伞承载的固定航电回收舱", [0, 1.4, 0], [2.4, 2.8, 2.4], transportColors.body), box("回收舱上方四点承力连接框", [0, 2.9, 0], [2.0, 0.2, 2.0], transportColors.dark), ring("伞顶开孔周围的加强环带", transportColors.body, 16 * Math.sin(0.17) + 0.03, 0.09, 16 + 16 * Math.cos(0.17), 0.1)];
    for (let index = 0; index < 7; index++) {
      const start = 0.17 + index * 0.125, end = start + 0.1, middle = (start + end) / 2;
      const point = (angle: number, radius: number) => ({ x: Math.sin(angle) * radius, y: 16 + Math.cos(angle) * radius });
      parts.push(part("与相邻环带之间留有贯通通风缝的伞衣带", "lathe", index % 2 ? transportColors.signal : transportColors.trim, [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [point(end, 15.96), point(end, 16), point(middle, 16), point(start, 16), point(start, 15.96), point(middle, 15.96), point(end, 15.96)] }));
    }
    for (let index = 0; index < 12; index++) {
      const angle = index * Math.PI / 6, path: Triple[] = Array.from({ length: 8 }, (_, level) => {
        const latitude = 0.17 + level / 7 * 0.85;
        return [16.04 * Math.sin(latitude) * Math.cos(angle), 16 + 16.04 * Math.cos(latitude), 16.04 * Math.sin(latitude) * Math.sin(angle)];
      });
      const skirt = path.at(-1)!;
      parts.push(tapered("跨过各通风环缝并连接所有伞衣环带的经向带", transportColors.body, path, path.map(() => 0.055)), strut("从伞缘汇聚到回收舱上方的长承力伞绳", skirt, [Math.cos(angle) * 0.35, 4.0, Math.sin(angle) * 0.35], 0.028, transportColors.trim), strut("汇聚伞绳至回收舱承力框的短连接带", [Math.cos(angle) * 0.35, 4.0, Math.sin(angle) * 0.35], [Math.sign(Math.cos(angle)) * 0.85, 3.0, Math.sign(Math.sin(angle)) * 0.85], 0.045));
    }
    return parts;
  } },
  { name: "四面体折页舱多叶气囊软着陆探测器", theme: "科幻", tags: ["四面体折页着陆舱", "四组连续多叶气囊", "气囊接触减冲构型", "完整行星着陆器"], create: () => {
    const points: Triple[] = [[0, 4.1, 0], [-2.4, 0.8, -1.4], [2.4, 0.8, -1.4], [0, 0.8, 2.8]], faces = [[1, 2, 3], [0, 2, 1], [0, 1, 3], [0, 3, 2]];
    const vertices = faces.flatMap(face => face.map(index => ({ x: points[index]![0], y: points[index]![1], z: points[index]![2] })));
    const parts: ModelPart[] = [part("包含三面铰接折页与承载底面的闭合四面体舱体", "mesh", transportColors.signal, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices: vertices.map((_, index) => index) }), ring("降落阶段连接吊带的顶部贯通连接眼", transportColors.dark, 0.17, 0.05, 0, 0.1, { position: { x: 0, y: 4.34, z: 0 }, rotation: { x: 90, y: 0, z: 0 } }), strut("顶部连接眼至舱体顶点的刚性基座", [0, 4.1, 0], [0, 4.34, 0], 0.13)];
    for (const [start, end] of [[0, 1], [0, 2], [0, 3], [1, 2], [2, 3], [3, 1]]) parts.push(strut("相邻三角折页交界处的承力边框", points[start!]!, points[end!]!, 0.09, transportColors.dark));
    for (const [start, end] of [[1, 2], [2, 3], [3, 1]]) parts.push(cylinderBetween("底面与侧折页之间连续连接的铰链轴", points[start!]!, points[end!]!, 0.16, transportColors.body));
    for (const face of faces) {
      const a = new Vector3(...points[face[0]!]!), b = new Vector3(...points[face[1]!]!), c = new Vector3(...points[face[2]!]!), normal = b.clone().sub(a).cross(c.clone().sub(a)).normalize(), center = a.clone().add(b).add(c).divideScalar(3).addScaledVector(normal, 0.65), rotation = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), normal), e = new Euler().setFromQuaternion(rotation);
      parts.push(lobedEnvelope("固定于一个三角舱面的单体六叶连续密封气囊", [2.3, 1.15, 2.3], 6, 0.28, center.toArray() as Triple, [e.x * 180 / Math.PI, e.y * 180 / Math.PI, e.z * 180 / Math.PI]));
      for (let index = 0; index < 6; index++) {
        const angle = (index + 0.5) * Math.PI / 3, path: Triple[] = Array.from({ length: 11 }, (_, level) => {
          const latitude = level * Math.PI / 10, radius = 2.3 * Math.sin(latitude) * (1 - 0.28 * Math.sin(latitude)) + 0.02, p = new Vector3(Math.cos(angle) * radius, Math.cos(latitude) * 1.15, Math.sin(angle) * radius).applyQuaternion(rotation).add(center);
          return p.toArray() as Triple;
        });
        parts.push(tapered("沿气囊叶间凹部包覆并连接固定点的约束带", transportColors.body, path, path.map(() => 0.035)));
      }
    }
    return parts;
  } },
];
