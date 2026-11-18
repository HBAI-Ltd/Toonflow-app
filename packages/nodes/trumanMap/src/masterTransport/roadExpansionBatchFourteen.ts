import { part, ring, type ModelPart } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { box, cylinder, strut, helicalFlight, transportColors, type TransportDefinition } from "./parts";
import { BoxGeometry } from "three";

function circle(x: number, y: number, radius: number): [number, number][] {
  return Array.from({ length: 12 }, (_, index) => { const angle = index * Math.PI / 6; return [x + Math.cos(angle) * radius, -y + Math.sin(angle) * radius]; });
}

function cutterhead(x: number, y: number, z: number): ModelPart[] {
  const parts: ModelPart[] = [ring("保留四块真实排渣窗口的刀盘外环", transportColors.body, 1.15, 0.13, 0, 0.14, { position: { x, y, z }, rotation: { x: 90, y: 0, z: 0 } }), cylinder("对应独立驱动轴的刀盘中心毂", [x, y, z], [0.43, 0.28, 0.43], transportColors.signal, [90, 0, 0]), box("刀盘横向贯通承力辐板", [x, y, z], [2.16, 0.17, 0.15], transportColors.body), box("刀盘竖向贯通承力辐板", [x, y, z], [0.17, 2.16, 0.15], transportColors.body)];
  const tooth = new BoxGeometry(0.3, 0.16, 0.14), positions = tooth.getAttribute("position"), vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
  try {
    for (let blade = 0; blade < 4; blade++) {
      const angle = blade * Math.PI / 2, offset = vertices.length;
      for (let index = 0; index < positions.count; index++) vertices.push({ x: Math.cos(angle) * (0.86 + positions.getX(index)) - Math.sin(angle) * positions.getY(index), y: Math.sin(angle) * (0.86 + positions.getX(index)) + Math.cos(angle) * positions.getY(index), z: positions.getZ(index) });
      for (const index of tooth.index!.array) indices.push(offset + index);
    }
  } finally { tooth.dispose(); }
  parts.push(part("四辐板前面的实体切土刀块合批", "mesh", transportColors.trim, [x, y, z - 0.13], [1, 1, 1], [0, 0, 0], { vertices, indices }));
  return parts;
}

// 矩形开挖、多刀盘与压力排渣属于完整机种差异，不按刀盘数或截面尺寸再派生主项。
// https://www.crecg.com/crectbmen/products/tunnelling/rectangular_pipe_jacking_machine/index.html
export const roadExpansionBatchFourteen: TransportDefinition[] = [
  { name: "交错多刀盘矩形土压平衡顶管掘进机", theme: "现代", itemType: "设施", tags: ["矩形顶管掘进机", "交错多刀盘全断面", "矩形开口盾体与双螺旋排渣"], create: () => {
    const parts: ModelPart[] = [...[-1, 1].map(side => box("保持实际矩形净空的独立盾体侧板", [side * 2.94, 2.25, 0], [0.12, 4.5, 5.6], transportColors.body)), box("矩形盾体承压顶板", [0, 4.44, 0], [5.88, 0.12, 5.6], transportColors.body), box("矩形盾体接触底部地层的承载底板", [0, 0.06, 0], [5.88, 0.12, 5.6], transportColors.dark)];
    const holes: [number, number][][] = [];
    for (const y of [1.25, 3.25]) for (const x of [-1.8, 0, 1.8]) holes.push(circle(x, y, 0.15));
    for (const x of [-0.7, 0.7]) holes.push(circle(x, 0.55, 0.27));
    const bulkhead = polygon("保留六个驱动穿轴孔和两个排渣管孔的承压隔墙", transportColors.body, [[-2.88, -0.12], [2.88, -0.12], [2.88, -4.38], [-2.88, -4.38]], 0.16, [0, 0, -1.78], holes);
    bulkhead.rotation.x = 90;
    parts.push(bulkhead);
    for (let row = 0; row < 2; row++) for (let column = 0; column < 3; column++) {
      const x = -1.8 + column * 1.8, y = 1.25 + row * 2, z = -3.1 - ((row + column) % 2) * 0.32;
      parts.push(...cutterhead(x, y, z), cylinder("每个刀盘独立的封闭驱动电机", [x, y, -1.0], [0.48, 0.75, 0.48], transportColors.dark, [90, 0, 0]), cylinder("穿过压力隔墙并连接刀盘的同轴驱动轴", [x, y, (z + 0.08 - 1.25) / 2], [0.2, -1.33 - z, 0.2], transportColors.trim, [90, 0, 0]), ring("实际包住驱动轴并接到隔墙的密封轴承座", transportColors.body, 0.22, 0.13, 0, 0.12, { position: { x, y, z: -1.84 }, rotation: { x: 90, y: 0, z: 0 } }));
    }
    for (const side of [-1, 1]) for (const top of [false, true]) parts.push(box("补足圆刀盘边界外矩形角区的独立切削排", [side * 2.78, top ? 4.22 : 0.28, -3.75], [0.44, 0.56, 0.18], transportColors.trim), strut("角区切削排连接盾体的往复驱动导杆", [side * 2.78, top ? 4.22 : 0.28, -2.6], [side * 2.78, top ? 4.22 : 0.28, -3.69], 0.07, transportColors.dark));
    for (const x of [-0.7, 0.7]) {
      parts.push(part("前部压力土仓贯通至盾尾的真实排渣管", "lathe", transportColors.dark, [x, 0.55, 0.7], [1, 1, 1], [90, 0, 0], { profile: [{ x: 0.24, y: -2.9 }, { x: 0.24, y: 2.9 }, { x: 0.2, y: 2.9 }, { x: 0.2, y: -2.9 }, { x: 0.24, y: -2.9 }] }), cylinder("排渣管内连续螺旋中心轴", [x, 0.55, 0.7], [0.09, 5.8, 0.09], transportColors.body, [90, 0, 0]), ring("排渣管与压力隔墙之间的封接环", transportColors.body, 0.32, 0.08, 0, 0.12, { position: { x, y: 0.55, z: -1.72 }, rotation: { x: 90, y: 0, z: 0 } }));
      const screw = helicalFlight([x, 0.55, -2.18], 0.05, 0.19, 5.7, 9, 1, 0.018);
      screw.rotation.x = 90;
      parts.push(screw);
    }
    for (const side of [-1, 1]) parts.push(box("矩形盾体内侧连续抗弯承梁", [side * 2.69, 2.25, 1.1], [0.26, 4.15, 0.2], transportColors.dark), box("后盾面接受工作井主顶力的受力垫板", [side * 2.6, 2.25, 2.8], [0.48, 3.7, 0.18], transportColors.signal));
    parts.push(box("盾尾内部电气液压控制柜", [2.1, 1.3, 1.65], [0.7, 1.8, 0.9], transportColors.dark), box("管道上方供工作人员通过的中部服务踏板", [0, 1.03, 1.45], [1.9, 0.1, 2.5], transportColors.body));
    return parts;
  } },
];
