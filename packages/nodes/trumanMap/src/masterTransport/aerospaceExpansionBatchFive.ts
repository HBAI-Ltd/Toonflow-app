import { part, type ModelPart, type Triple } from "../assetModelParts";
import { fuselage, propeller } from "./aircraftModels";
import { airfoil, smallGear } from "./aerospaceExpansionBatchOne";
import { ball, box, cylinder, strut, surface, transportColors, type TransportDefinition } from "./parts";

export function bodyLoft(name: string, sections: [number, number, number, number][], y: number, color = transportColors.body): ModelPart {
  const vertices = sections.flatMap(([z, width, height, lift]) => Array.from({ length: 16 }, (_, index) => { const a = index * Math.PI / 8; return { x: Math.cos(a) * width, y: y + lift + Math.sin(a) * height, z }; }));
  const indices: number[] = [];
  for (let section = 0; section < sections.length - 1; section++) for (let index = 0; index < 16; index++) { const a = section * 16 + index, b = section * 16 + (index + 1) % 16; indices.push(a, b, b + 16, a, b + 16, a + 16); }
  const front = vertices.length, rear = front + 1, end = (sections.length - 1) * 16;
  vertices.push({ x: 0, y: y + sections[0]![3], z: sections[0]![0] }, { x: 0, y: y + sections.at(-1)![3], z: sections.at(-1)![0] });
  for (let index = 0; index < 16; index++) indices.push(front, (index + 1) % 16, index, rear, end + index, end + (index + 1) % 16);
  return part(name, "mesh", color, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

export function sweptWing(name: string, root: Triple, tip: Triple, rootChord: number, tipChord: number): ModelPart {
  const profile = [[0, -0.5], [0.065, -0.3], [0.075, 0.05], [0.012, 0.5], [-0.012, 0.5], [-0.03, 0.05], [-0.025, -0.3]];
  const vertices = [root, tip].flatMap(([x, y, z], side) => profile.map(([py, pz]) => ({ x, y: y + py! * (side ? tipChord : rootChord), z: z + pz! * (side ? tipChord : rootChord) })));
  const indices: number[] = [];
  for (let index = 0; index < 7; index++) { const next = (index + 1) % 7; indices.push(index, next, next + 7, index, next + 7, index + 7); }
  for (let index = 1; index < 6; index++) indices.push(0, index + 1, index, 7, 7 + index, 7 + index + 1);
  if (tip[0] < root[0]) for (let index = 0; index < indices.length; index += 3) [indices[index + 1], indices[index + 2]] = [indices[index + 2]!, indices[index + 1]!];
  return part(name, "mesh", transportColors.trim, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

export function jetNacelle(x: number, y: number, z: number, radius: number, length: number): ModelPart[] {
  return [part("前后贯通并逐渐收分的涡扇短舱", "lathe", transportColors.dark, [x, y, z], [1, 1, 1], [90, 0, 0], { profile: [{ x: radius, y: -length / 2 }, { x: radius * 1.05, y: -length * 0.25 }, { x: radius * 0.8, y: length * 0.3 }, { x: radius * 0.63, y: length / 2 }, { x: radius * 0.52, y: length / 2 }, { x: radius * 0.68, y: length * 0.3 }, { x: radius * 0.9, y: -length * 0.25 }, { x: radius * 0.85, y: -length / 2 }, { x: radius, y: -length / 2 }] }), cylinder("进气口中心风扇轴毂", [x, y, z - length * 0.45], [radius * 0.4, radius * 0.4, radius * 0.4], transportColors.body, [90, 0, 0]), ...[0, 60, 120].map(a => box("进气口内的低多边形风扇双端叶片", [x, y, z - length * 0.45], [radius * 1.5, radius * 0.1, radius * 0.05], transportColors.body, [0, 0, a]))];
}

function bogie(x: number, top: number, z: number, radius: number): ModelPart[] {
  const parts: ModelPart[] = [strut("从机身承力舱伸向主轮架的缓冲腿", [x, top, z], [x, radius + 0.16, z], radius * 0.22), box("前后两根轮轴之间的主轮架梁", [x, radius + 0.12, z], [radius * 0.3, radius * 0.3, radius * 2.7], transportColors.body)];
  for (const side of [-1, 1]) for (const end of [-1, 1]) parts.push(cylinder("重型客机主轮架独立轮胎", [x + side * radius * 0.53, radius, z + end * radius * 0.9], [radius * 2, radius * 0.45, radius * 2], transportColors.dark, [0, 0, 90]));
  return parts;
}

// 每架的机身断面、机翼承载位置和完整舱体分别设计，不以同飞机换发动机数或货物扩项。
export const aerospaceExpansionBatchFive: TransportDefinition[] = [
  { name: "全长双层客舱超宽体喷气客机", theme: "现代", tags: ["双层宽体客机", "全长上下两层客舱", "高截面机身", "重型多轮架"], create: () => {
    const parts: ModelPart[] = [bodyLoft("具有全长两层客舱高度的宽体机身", [[-36, 0.12, 0.15, -0.3], [-32, 2.3, 2.6, -0.1], [-25, 3.9, 4.5, 0], [-10, 4.05, 4.5, 0], [12, 4.05, 4.5, 0], [26, 3.05, 3.3, 0.2], [33, 1.3, 1.8, 0.45], [36, 0.12, 0.15, 0.65]], 8.4), airfoil("重型客机独立后水平尾翼", 24, 5.2, [0, 9.6, 29]), surface("宽体尾身上的高垂直尾鳍", transportColors.signal, [[0, 0, -5], [0, 12.2, 1.0], [0, 0, 6.2]], [0, 1, 2], [0, 9.3, 28]), ball("低于上层客舱的前端驾驶风挡", [0, 10.4, -32.4], [2.7, 1.1, 1.9], transportColors.glass), ...smallGear([], [0, 5.0, -24.0], 0.8)];
    for (const side of [-1, 1]) {
      parts.push(sweptWing("由厚翼根过渡至上反翼尖的主翼", [side * 3.1, 7.0, 0], [side * 36, 9.0, 15.2], 14, 3.8), ...bogie(side * 3.0, 5.0, 8.0, 1.0), ...bogie(side * 6.0, 5.4, 9.8, 1.0));
      for (const distance of [12, 22]) { const z = distance === 12 ? 2.2 : 7.0; parts.push(...jetNacelle(side * distance, 5.8, z, 1.42, 5.4), strut("宽主翼至大型涡扇的承力吊挂", [side * distance, 8.0, z + 0.6], [side * distance, 6.8, z + 0.6], 0.38)); }
      for (const y of [8.15, 10.55]) for (const z of [-18, -12, -6, 0, 6, 12, 18]) { const t = Math.max(0, (z - 12) / 14), width = z < -10 ? 3.9 + (z + 25) / 15 * 0.15 : 4.05 - t, height = 4.5 - t * 1.2, center = 8.4 + t * 0.2, x = width * Math.sqrt(1 - ((y - center) / height) ** 2); parts.push(cylinder("上下客舱各自独立的侧窗", [side * (x + 0.01), y, z], [0.45, 0.08, 0.45], transportColors.glass, [0, 0, 90])); }
    }
    return parts;
  } },
  { name: "后置侧舱双喷T形尾翼短程客机", theme: "现代", tags: ["后置发动机", "T形尾翼", "低置主翼", "短程客舱"], create: () => {
    const parts: ModelPart[] = [fuselage(27, 3.4, 4.2), airfoil("位于机身下部的后掠主翼中央段", 4.5, 4.3, [0, 3.9, 0.5]), surface("升高水平尾翼的后部主垂直安定面", transportColors.signal, [[0, 0, -2.1], [0, 4.7, 0.8], [0, 0, 3.0]], [0, 1, 2], [0, 4.1, 10.1]), airfoil("安装在垂直尾鳍顶端的T形平尾", 10.4, 2.35, [0, 8.7, 10.6]), ball("前鼻驾驶舱风挡", [0, 5.1, -9.7], [2.3, 0.95, 1.5], transportColors.glass), ...smallGear([[-1.9, 3.8, 2.5], [1.9, 3.8, 2.5]], [0, 3.8, -8.1], 0.5)];
    for (const side of [-1, 1]) {
      parts.push(sweptWing("低置且向后收分的主翼", [side * 1.6, 3.9, 0.5], [side * 12.3, 4.5, 5.7], 4.3, 1.45), ...jetNacelle(side * 2.55, 4.55, 8.2, 0.82, 3.9), strut("后机身横向伸出的发动机承力悬臂", [side * 1.2, 4.55, 8.2], [side * 2.55, 4.55, 8.2], 0.21));
      for (const z of [-7.0, -5.0, -3.0, -1.0, 1.0, 3.0, 5.0, 7.0]) { const radius = z < -4.05 ? 1.088 + (z + 9.72) / 5.67 * 0.612 : z > 6.21 ? 1.7 - (z - 6.21) / 5.13 * 0.884 : 1.7, x = Math.sqrt(radius * radius - 0.35 ** 2); parts.push(cylinder("短程客机舱段侧窗", [side * (x + 0.015), 4.55, z], [0.38, 0.07, 0.38], transportColors.glass, [0, 0, 90])); }
    }
    return parts;
  } },
  { name: "高置主翼低货舱大型尾门运输机", theme: "现代", tags: ["高翼运输机", "低位宽截面货舱", "后下方装载门", "涡桨运输"], create: () => {
    const parts: ModelPart[] = [bodyLoft("低货舱主体与抬高尾段的连续机身", [[-17, 0.15, 0.16, -0.5], [-14, 1.6, 1.7, -0.1], [-9, 2.7, 2.65, 0], [5, 2.7, 2.65, 0], [10, 2.45, 2.3, 0.3], [15, 1.0, 1.35, 1.6], [18, 0.15, 0.2, 2.1]], 5.5), airfoil("机身顶部不穿过货舱的中央承力翼", 6.2, 6.3, [0, 8.1, -1.3]), airfoil("大型货运机后部水平安定面", 13.0, 3.0, [0, 9.5, 14.2]), surface("后机身高位方向尾鳍", transportColors.signal, [[0, 0, -2.6], [0, 6.2, 1.2], [0, 0, 3.5]], [0, 1, 2], [0, 7.4, 13.8]), ball("宽货舱前方的飞行员透明风挡", [0, 7.2, -12.9], [2.4, 1.2, 1.5], transportColors.glass), ...smallGear([], [0, 3.6, -11.1], 0.65), box("与抬高尾身齐平的关闭式后装载门", [0, 4.33, 11.5], [4.4, 0.15, 5.4], transportColors.dark, [-22, 0, 0])];
    for (const side of [-1, 1]) {
      parts.push(sweptWing("从高置翼根延伸的承载主翼", [side * 2.65, 8.1, -1.3], [side * 19.0, 8.7, 3.8], 6.3, 2.4), box("沿低货舱侧面外凸的主轮架整流舱", [side * 2.65, 3.5, 3.0], [1.2, 1.55, 6.1], transportColors.body), ...bogie(side * 2.8, 3.3, 3.0, 0.73));
      for (const distance of [7.2, 13.2]) parts.push(cylinder("高翼前方涡桨发动机短舱", [side * distance, 7.85, -2.8], [1.15, 4.4, 1.15], transportColors.body, [90, 0, 0]), ...propeller(side * distance, 7.85, -5.25, 1.85), strut("高置主翼至涡桨发动机的承力柱", [side * distance, 8.3, -1.5], [side * distance, 7.85, -2.0], 0.3));
    }
    return parts;
  } },
  { name: "超大径上鼓包内置货舱运输飞机", theme: "现代", tags: ["鼓包货舱", "内置超大体积运输", "货舱下方低置驾驶舱", "大型部件空运"], create: () => {
    const parts: ModelPart[] = [bodyLoft("高于下层驾驶舱的超大径圆鼓货舱", [[-21.5, 0.18, 0.2, 0], [-18, 3.3, 3.5, 0], [-11, 5.1, 4.9, 0], [8, 5.1, 4.9, 0], [15, 3.7, 3.5, 0.2], [20, 1.25, 1.5, 0.7], [22, 0.12, 0.15, 0.9]], 9.3), part("延伸至鼓包前方下缘的低置驾驶舱", "capsule", transportColors.body, [0, 5.6, -17.4], [6.0, 7.1, 5.4], [90, 0, 0]), ball("低置驾驶舱前端的透明风挡", [0, 6.3, -19.9], [2.4, 1.1, 1.5], transportColors.glass), box("大型上货舱下方的连续承力龙骨", [0, 4.7, -1.0], [3.0, 1.8, 33], transportColors.dark), airfoil("高体积货机的后部水平稳定翼", 16.3, 3.8, [0, 10.2, 18.7]), surface("下部尾身至高平尾的中央尾鳍", transportColors.signal, [[0, 0, -2.3], [0, 5.0, 1], [0, 0, 3.3]], [0, 1, 2], [0, 7.1, 18.8]), ...smallGear([], [0, 4.2, -13.7], 0.65)];
    for (const side of [-1, 1]) parts.push(sweptWing("鼓包下方承担货舱载荷的主翼", [side * 3.6, 6.4, -0.6], [side * 22, 8.1, 11.0], 10.1, 2.8), ...jetNacelle(side * 8.2, 4.4, 0.7, 1.15, 4.5), strut("主翼至推进短舱的连接柱", [side * 8.2, 6.7, 1.6], [side * 8.2, 5.2, 1.6], 0.32), ...bogie(side * 2.8, 4.0, 6.4, 0.85), surface("高平尾外端的辅助方向稳定面", transportColors.signal, [[0, 0, -0.9], [0, 2.15, 0.2], [0, 0, 1.6]], [0, 1, 2], [side * 6.6, 10.2, 18.7]));
    return parts;
  } },
];
