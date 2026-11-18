import { part, ring, type ModelPart, type Triple } from "../assetModelParts";
import { box, cylinder, strut, surface, transportColors, type TransportDefinition } from "./parts";

// 原创静态海事装备造型，不复制厂家具体外形，不提供真实作业控制。
// https://www.smd.co.uk/products/trenching-systems/telecoms-ploughs/
// https://www.minesto.com/our-technology/

const body = transportColors.body, dark = transportColors.dark, trim = transportColors.trim;

function hollowCableDuct(points: Triple[]): ModelPart {
  const vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
  for (let index = 0; index < points.length; index++) {
    const previous = points[Math.max(0, index - 1)]!, next = points[Math.min(points.length - 1, index + 1)]!;
    const dy = next[1] - previous[1], dz = next[2] - previous[2], length = Math.hypot(dy, dz);
    for (const radius of [0.22, 0.15]) for (let step = 0; step < 8; step++) {
      const angle = step * Math.PI / 4;
      vertices.push({ x: points[index]![0] + Math.cos(angle) * radius, y: points[index]![1] + Math.sin(angle) * radius * dz / length, z: points[index]![2] - Math.sin(angle) * radius * dy / length });
    }
  }
  const quad = (a: number, b: number, c: number, d: number) => indices.push(a, b, c, a, c, d);
  for (let index = 0; index < points.length - 1; index++) for (let step = 0; step < 8; step++) {
    const next = (step + 1) % 8, a = index * 16, b = a + 16;
    quad(a + step, a + next, b + next, b + step);
    quad(a + 8 + step, b + 8 + step, b + 8 + next, a + 8 + next);
  }
  const last = (points.length - 1) * 16;
  for (let step = 0; step < 8; step++) {
    const next = (step + 1) % 8;
    quad(step, step + 8, next + 8, next);
    quad(last + step, last + next, last + next + 8, last + step + 8);
  }
  return part("两端敞开且具有真实内壁的弯曲海缆导管", "mesh", trim, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

export const marineExpansionBatchSeven: TransportDefinition[] = [
  { name: "双长滑橇拖曳式海缆埋设犁", theme: "现代", itemType: "设施", tags: ["海缆犁", "subsea cable plough", "被动拖曳埋设"], create: () => {
    const parts: ModelPart[] = [...[-1, 1].map(side => box("避开海缆通道的双纵向承载脊", [side * 0.48, 2.8, 0], [0.2, 0.5, 6.5], dark)), strut("作动缸前端的跨脊承力横销座", [-0.48, 2.8, -2], [0.48, 2.8, -2], 0.22, dark), cylinder("主犁体上端横向铰接轴", [0, 3.22, -2.8], [0.22, 1.3, 0.22], trim, [0, 0, 90]), ...[-1, 1].map(side => box("主犁铰轴实际承载耳", [side * 0.35, 3.12, -2.8], [0.2, 0.4, 0.5], body)), part("从承载架下伸的狭缝开沟犁体", "extrude", body, [0, 0, -3], [1, 1, 1], [0, 90, 0], { depth: 0.18, profile: [{ x: -0.6, y: 3.2 }, { x: 0.2, y: 3.2 }, { x: 1.5, y: 0.1 }, { x: 1.15, y: 0.1 }, { x: 0, y: 1.8 }, { x: -0.6, y: 2.2 }] }), hollowCableDuct([[0, 3.8, -3], [0, 3.4, -1.6], [0, 2.2, 0], [0, 1.1, 2.7], [0, 0.8, 3.8]]), ring("拖曳钢缆连接锻眼", dark, 0.25, 0.08, 1.7, 0.15, { position: { x: 0, y: 1.7, z: -5 }, rotation: { x: 90, y: 0, z: 0 } }), strut("升降犁体的斜置作动缸", [0, 2.8, -2], [0, 3.2, -2.9], 0.2, body)];
    for (const side of [-1, 1]) {
      parts.push(part("前端上翘的长条海床滑橇", "extrude", dark, [side * 2.3, 0, 0], [1, 1, 1], [0, 90, 0], { depth: 0.6, profile: [{ x: -3.5, y: 0 }, { x: 3.3, y: 0 }, { x: 4.1, y: 0.55 }, { x: 4.1, y: 0.75 }, { x: 3.2, y: 0.28 }, { x: -3.5, y: 0.28 }] }), strut("两侧滑橇上方的纵向承载梁", [side * 2.3, 1.4, -2], [side * 2.3, 1.4, 1.8], 0.24, body), strut("向前汇拢的A形拖曳臂", [side * 2.3, 1.4, -2], [0, 1.5, -5], 0.22, body), strut("滑橇至中央承载脊的斜撑", [side * 2.3, 1.4, 1.8], [side * 0.48, 2.8, 0.2], 0.18, body));
      for (const z of [-2, 1.8]) parts.push(strut("滑橇底脚至承载框的竖向支柱", [side * 2.3, 0.28, z], [side * 2.3, 1.4, z], 0.18, body));
      parts.push(strut("前部导缆管外壁支撑", [side * 2.3, 1.4, -2], [side * 0.21, 3.7, -2.6], 0.12, dark), strut("后部导缆管外壁支撑", [side * 2.3, 1.4, 1.8], [side * 0.21, 1.5, 1.8], 0.12, dark));
    }
    for (const z of [-2, 1.8]) {
      const y = z < 0 ? 1.4 : 0.9;
      parts.push(strut("连接左右滑橇且避开导缆内腔的横梁", [-2.3, y, z], [2.3, y, z], 0.22, body));
    }
    return parts;
  } },
  { name: "系缆飞翼式海流涡轮发电装置", theme: "现代", itemType: "设施", tags: ["水下风筝", "海流风筝", "系缆海流发电"], create: () => {
    const parts: ModelPart[] = [cylinder("海床系缆发电系统的压重基座", [0, 0.3, 0], [4.4, 0.6, 4.4], dark), ring("系缆与基座之间的连接锻环", trim, 0.25, 0.08, 0.85, 0.15, { rotation: { x: 90, y: 0, z: 0 } }), part("主翼下方的封闭发电机短舱", "lathe", body, [0, 17.5, -0.6], [1, 1, 1], [90, 0, 0], { profile: [{ x: 0, y: -1.3 }, { x: 0.24, y: -0.9 }, { x: 0.3, y: -0.3 }, { x: 0.27, y: 0.8 }, { x: 0, y: 1.1 }] }), box("发电机短舱与主翼的连接支柱", [0, 17.9, -0.3], [0.25, 0.4, 0.6], dark), cylinder("涡轮叶片共同轴毂", [0, 17.5, -1.9], [0.24, 0.3, 0.24], dark, [90, 0, 0]), strut("机尾纵向操纵面承载梁", [0, 17.5, 0.4], [0, 17.5, 3.6], 0.17, dark), box("尾部水平操纵水翼", [0, 17.5, 3.4], [3.2, 0.09, 0.7], body), box("尾部垂直操纵舵面", [0, 17.95, 3.4], [0.09, 0.9, 0.65], body), part("承载电力与通信的完整系缆", "tube", dark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: 0.045, path: [{ x: 0, y: 1.07, z: 0 }, { x: 0.8, y: 7, z: 0 }, { x: 0.45, y: 13, z: 0.1 }, { x: 0, y: 16.9, z: 0 }] })];
    for (const side of [-1, 1]) parts.push(surface("有厚度且外梢上反的主升力水翼", trim, [[0, 0, -1.2], [side * 6, 0.8, -0.5], [side * 6, 0.8, 0.6], [0, 0, 0.8]], [0, 1, 2, 0, 2, 3], [0, 18, 0]), strut("系缆上端的双点主翼吊索", [0, 16.9, 0], [side * 0.6, 18.08, 0.2], 0.07, dark));
    for (let index = 0; index < 3; index++) parts.push(part("将海流动能交给发电机的涡轮叶片", "extrude", trim, [0, 17.5, -1.96], [1, 1, 1], [0, 0, index * 120], { depth: 0.055, profile: [{ x: 0.04, y: 0.07 }, { x: 0.78, y: 0.04 }, { x: 0.86, y: 0.2 }, { x: 0.16, y: 0.22 }] }));
    return parts;
  } },
];
