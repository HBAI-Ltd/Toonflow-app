import { part, ring, type ModelPart, type Triple } from "../assetModelParts";
import { halfRoundWall } from "../masterArchitecture/spatialShells";
import { box, cylinder, strut, transportColors, type TransportDefinition } from "./parts";

function mirrorDish(x: number): ModelPart {
  const front = Array.from({ length: 9 }, (_, index) => ({ x: index, y: index * index / 28 }));
  return part("具有真实抛物断面和背壁的聚光反射面", "lathe", transportColors.trim, [x, 10, 0], [1, 1, 1], [-90, 0, 0], { profile: [...front.map(point => ({ x: point.x, y: point.y - 0.1 })), ...[...front].reverse()], metalness: 0.85, roughness: 0.26 });
}

function openPolarCap(name: string, radius: number, thickness: number, bore: number, position: Triple, rotation: Triple): ModelPart {
  const stride = 13, layer = 78, vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
  for (const r of [radius, radius - thickness]) for (let row = 0; row < 6; row++) {
    const latitude = row === 5 ? Math.acos(bore / r) : row * Math.PI / 10;
    for (let col = 0; col < stride; col++) { const angle = col * Math.PI / 12; vertices.push({ x: Math.cos(angle) * r * Math.cos(latitude), y: r * Math.sin(latitude), z: Math.sin(angle) * r * Math.cos(latitude) }); }
  }
  for (let row = 0; row < 5; row++) for (let col = 0; col < 12; col++) {
    const a = row * stride + col, b = a + stride;
    indices.push(a, b, a + 1, a + 1, b, b + 1, layer + a, layer + a + 1, layer + b, layer + a + 1, layer + b + 1, layer + b);
  }
  for (let col = 0; col < 12; col++) {
    const a = 5 * stride + col, b = a + 1;
    indices.push(col, col + 1, layer + col, col + 1, layer + col + 1, layer + col, a, layer + a, b, b, layer + a, layer + b);
  }
  for (const col of [0, 12]) for (let row = 0; row < 5; row++) {
    const a = row * stride + col, b = a + stride;
    indices.push(...(col === 0 ? [a, layer + a, b, b, layer + a, layer + b] : [a, b, layer + a, b, layer + b, layer + a]));
  }
  return part(name, "mesh", transportColors.body, position, [1, 1, 1], rotation, { vertices, indices });
}

// 采用公开的栖居/太阳热构型作原创场景简化；尺寸为场景概念比例，不复刻研究方案的制造规格。
// https://www.nas.nasa.gov/assets/nas/pdf/techreports/1991/rnr-91-018.pdf
// https://ntrs.nasa.gov/citations/20030010278
// 内通航槽母舰为原创虚构载体，未使用影视/游戏品牌模型。
export const aerospaceExpansionBatchEight: TransportDefinition[] = [
  { name: "双筒反转圆柱空间栖居站", theme: "科幻", tags: ["圆柱栖居", "双筒轴向耦合", "纵向采光壳片", "外置反射翼"], create: () => {
    const parts: ModelPart[] = [];
    for (const side of [-1, 1]) {
      const x = side * 16;
      for (let index = 0; index < 8; index++) {
        const glazed = index === 0 || index === 4;
        const panel = halfRoundWall(glazed ? "纵向透明采光承压壳片" : "完整圆柱压力舱实壁壳片", 12, 0.24, 80, [x, 18, -40], index * 45, glazed ? transportColors.glass : transportColors.body, Math.PI / 4);
        panel.rotation.x = 90;
        if (glazed) panel.opacity = 0.38;
        parts.push(panel);
      }
      for (const end of [-1, 1]) {
        for (const yaw of [0, 180]) {
          parts.push(openPolarCap("圆柱栖居舱两端带真实轴颈极孔的薄壁半球封头", 12, 0.24, 1.7, [x, 18, end * 40], [end * 90, yaw, 0]));
        }
        parts.push(part("独立于旋转外壳的轴向对接颈", "lathe", transportColors.dark, [x, 18, end * 53], [1, 1, 1], [90, 0, 0], { profile: [{ x: 2.4, y: -3 }, { x: 2.4, y: 3 }, { x: 1.7, y: 3 }, { x: 1.7, y: -3 }, { x: 2.4, y: -3 }] }));
        parts.push(cylinder("主轴端部连续伸到固定通道的短接轴", [x, 18, end * 52.4], [1.5, 5.2, 1.5], transportColors.dark, [90, 0, 0]), ring("把短接轴承接到固定对接颈与横向通道的实心承圈", transportColors.body, 2.05, 1.33, 0, 0.4, { position: { x, y: 18, z: end * 55 }, rotation: { x: 90, y: 0, z: 0 } }));
      }
      parts.push(cylinder("贯穿圆筒与两端轴舱的中央主轴", [x, 18, 0], [1.5, 100, 1.5], transportColors.dark, [90, 0, 0]));
      for (let index = 0; index < 3; index++) {
        const angle = index * Math.PI * 2 / 3, px = x + Math.cos(angle) * 16, py = 18 + Math.sin(angle) * 16;
        parts.push(box("把光引入纵向采光窗的长反射翼", [px, py, 0], [8, 0.1, 70], transportColors.trim, [0, 0, index * 120 + 90]));
        for (const z of [-30, 30]) parts.push(strut("承压舱外骨架至反射翼的支撑肋", [x + Math.cos(angle) * 11.9, 18 + Math.sin(angle) * 11.9, z], [px, py, z], 0.16));
        const land = halfRoundWall("外沿嵌接真实压力内壁而可见内沿保持连续的栖居地台", 11.84, 0.37, 76, [x, 18, -38], 35 + index * 120, "#7c9278", Math.PI / 5);
        land.rotation.x = 90;
        parts.push(land);
      }
    }
    for (const z of [-55, 55]) parts.push(box("连接反向旋转双筒轴舱的固定通道", [0, 18, z], [32, 2.0, 2.0], transportColors.dark));
    return parts;
  } },
  { name: "赤道采光环伯纳尔球式空间栖居站", theme: "科幻", tags: ["球形空间栖居", "赤道采光环", "上下极向对接轴舱", "概念栖居站"], create: () => {
    const parts: ModelPart[] = [ring("球形上下承压壳之间的连续赤道采光带", transportColors.glass, 35, 0.6, 42, 2.2, { opacity: 0.4 }), ring("赤道内侧的环形居住地台", "#7c9278", 34.2, 2.2, 41.9, 0.5), cylinder("从两极穿过球舱中心的固定轴向通道", [0, 42, 0], [2.0, 88, 2.0], transportColors.dark)];
    for (const half of [-1, 1]) {
      for (const yaw of [0, 180]) {
        parts.push(openPolarCap("上下半球分离建出并保留真实轴颈极孔的空心承压壳", 35, 0.6, 1.4, [0, 42 + half, 0], [0, yaw, half < 0 ? 180 : 0]));
      }
      parts.push(part("下端嵌接空心极帽的极向固定对接颈", "lathe", transportColors.dark, [0, 42 + half * 38.8, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 2.8, y: -3 }, { x: 2.8, y: 3 }, { x: 1.4, y: 3 }, { x: 1.4, y: -3 }, { x: 2.8, y: -3 }] }), ring("将固定轴向通道承接到极向中空颈段的连续承圈", transportColors.body, 2.4, 1.44, 42 + half * 40.5, 0.5));
      for (const side of [-1, 1]) parts.push(box("极区外伸的热控与能源翼", [side * 10, 42 + half * 37, 0], [16, 0.15, 12], transportColors.glass), strut("极向对接舱至能源翼的横向承力梁", [side * 2, 42 + half * 37, 0], [side * 10, 42 + half * 37, 0], 0.18));
    }
    for (let index = 0; index < 4; index++) { const a = index * Math.PI / 2; parts.push(strut("中心轴至赤道环台的径向交通梁", [Math.cos(a), 42, Math.sin(a)], [Math.cos(a) * 33, 42, Math.sin(a) * 33], 0.65)); }
    return parts;
  } },
  { name: "内通航槽双舷星际母舰", theme: "科幻", tags: ["原创星际母舰", "中央真实贯通机库", "双舷独立承力舰体", "大型科幻载体"], create: () => {
    const parts: ModelPart[] = [box("中央通航槽底部连续承力甲板", [0, 5.6, 0], [18, 0.7, 60], transportColors.dark), box("跨过整个通航机库的上层屋盖", [0, 17, 0], [18, 0.5, 60], transportColors.body), box("母舰上方的横向指挥桥", [0, 19, -14], [14, 3.2, 7], transportColors.body), box("指挥桥前方的连续观察玻璃", [0, 19, -17.56], [11, 1.2, 0.12], transportColors.glass)];
    for (const side of [-1, 1]) {
      parts.push(part("构成贯通机库一侧的完整大型舷体", "extrude", transportColors.body, [side * 14, 0, 0], [1, 1, 1], [0, 90, 0], { depth: 10, profile: [{ x: 36, y: 7 }, { x: 30, y: 15 }, { x: -20, y: 16 }, { x: -36, y: 12 }, { x: -36, y: 5 }, { x: 28, y: 5 }] }), box("通航槽两侧抬高的检修与登乘廊", [side * 7.1, 7.0, 0], [2.0, 0.3, 58], transportColors.trim), box("指挥桥下方接到屋盖的承力支座", [side * 5.5, 17.7, -14], [1.4, 1.1, 5.2], transportColors.dark), part("大型舷体后端前后贯通的主推进喷管", "lathe", transportColors.dark, [side * 14, 10, 38.7], [1, 1, 1], [90, 0, 0], { profile: [{ x: 1.4, y: -3 }, { x: 1.2, y: -1.8 }, { x: 2.8, y: 3 }, { x: 2.5, y: 3 }, { x: 0.95, y: -1.8 }, { x: 1.1, y: -3 }, { x: 1.4, y: -3 }] }));
      for (const z of [-22, 0, 22]) parts.push(strut("跨越通航槽而不堵住前后入口的顶部梁", [side * 8.8, 16.75, z], [0, 16.75, z], 0.45), strut("机库检修廊外沿的连续扶手", [side * 6.2, 8.0, z - 7], [side * 6.2, 8.0, z + 7], 0.06), strut("检修廊扶手的实际落地立柱", [side * 6.2, 7.1, z], [side * 6.2, 8.0, z], 0.06));
    }
    return parts;
  } },
  { name: "双抛物反射面太阳热推进深空运输船", theme: "科幻", tags: ["太阳热推进", "双大直径聚光镜", "前置集热焦舱", "深空运输概念"], create: () => {
    const parts: ModelPart[] = [cylinder("位于两镜之间的工质与载荷封闭舱", [0, 10, 7], [3.2, 12, 3.2], transportColors.body, [90, 0, 0]), part("运输船后端的真正中空热推进喷口", "lathe", transportColors.dark, [0, 10, 14], [1, 1, 1], [90, 0, 0], { profile: [{ x: 0.55, y: -1.5 }, { x: 0.35, y: -0.6 }, { x: 1.3, y: 1.8 }, { x: 1.1, y: 1.8 }, { x: 0.22, y: -0.6 }, { x: 0.42, y: -1.5 }, { x: 0.55, y: -1.5 }] })];
    for (const side of [-1, 1]) {
      parts.push(mirrorDish(side * 10), cylinder("置于抛物面焦点前方的独立集热舱", [side * 10, 10, -7], [0.7, 1.2, 0.7], transportColors.dark, [90, 0, 0]), strut("载荷主舱至聚光镜背部的支撑主梁", [side * 1.4, 10, 1.0], [side * 10, 10, 0.1], 0.25), part("集热舱至主舱的分离热工质传输管路", "tube", transportColors.trim, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: 0.16, path: [{ x: side * 10, y: 10, z: -7 }, { x: side * 10, y: 10, z: -9 }, { x: side * 2.0, y: 10, z: -9 }, { x: side * 0.65, y: 10, z: -1 }, { x: side * 0.65, y: 10, z: 1.4 }] }));
      for (let index = 0; index < 3; index++) { const a = index * Math.PI * 2 / 3; parts.push(strut("聚光镜外围至焦舱的三角支承细杆", [side * 10 + Math.cos(a) * 6.5, 10 + Math.sin(a) * 6.5, -6.5 * 6.5 / 28], [side * 10, 10, -7], 0.07)); }
    }
    return parts;
  } },
];
