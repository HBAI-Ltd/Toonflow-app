import { part, type ModelPart, type Triple } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { box, cylinder, strut, transportColors, type TransportDefinition } from "./parts";
import { solidPanel } from "./marineExpansionBatchTwo";

// 原创简化的整套船用减摇机构；水舱中的水位为静态展示，不承担流体或控制计算。
// https://www.kongsberg.com/contentassets/c8ccaaaf491f41d8900f0d41734b3246/12.stab_2p_16.02.22.pdf
// https://www.hoppe-marine.com/product/fluid-floating/intering-u-tank-roll-damping

const body = transportColors.body, dark = transportColors.dark, trim = transportColors.trim;

export function roundLink(name: string, start: Triple, end: Triple, width: number, color: string): ModelPart {
  const value = strut(name, start, end, width, color);
  value.shape = "cylinder";
  return value;
}

function thickStabilisingFin(): ModelPart {
  const sections = [[0.6, -0.9, 0.9, 0.18], [1, -1.05, 1, 0.2], [2.9, -0.8, 0.6, 0.1], [3.5, -0.45, 0.3, 0.03]];
  const vertices = sections.flatMap(([x, front, back, height]) => [{ x: x!, y: 0, z: front! }, { x: x!, y: height!, z: front! + (back! - front!) * 0.2 }, { x: x!, y: 0, z: back! }, { x: x!, y: -height!, z: front! + (back! - front!) * 0.2 }]);
  const indices = [0, 2, 1, 0, 3, 2, 12, 13, 14, 12, 14, 15];
  for (let section = 0; section < sections.length - 1; section++) for (let edge = 0; edge < 4; edge++) { const a = section * 4 + edge, b = section * 4 + (edge + 1) % 4; indices.push(a, b, b + 4, a, b + 4, a + 4); }
  return part("从厚前缘渐缩到薄尖后缘的实厚水动力减摇鳍", "mesh", body, [0, 1.8, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

export const marineExpansionBatchFifteen: TransportDefinition[] = [
  { name: "船侧贯轴双液压缸俯仰减摇鳍完整总成", theme: "现代", itemType: "构件", tags: ["主动减摇鳍总成", "船用稳定翼机构", "贯轴鳍与液压执行架"], create: () => {
    const wall = solidPanel("保留实际轴孔的船壳安装基板", [0, 0.2, -1.4], [0, 0, 1], [0, 1, 0], [[0, 0], [2.8, 0], [2.8, 2.6], [0, 2.6]], [Array.from({ length: 16 }, (_, index) => [1.4 + Math.cos(index * Math.PI / 8) * 0.38, 1.6 + Math.sin(index * Math.PI / 8) * 0.38] as [number, number])]);
    wall.color = body;
    const parts: ModelPart[] = [box("执行机构与船底骨架连接的安装底架", [-1.5, 0.2, 0], [3.2, 0.4, 3], dark), wall, thickStabilisingFin(), cylinder("实际贯穿安装板和两座轴承的鳍主轴", [-0.55, 1.8, 0], [0.36, 3.1, 0.36], dark, [0, 0, 90]), cylinder("将水动力鳍与伸出主轴连成一体的厚根座", [0.75, 1.8, 0], [0.56, 0.6, 0.56], trim, [0, 0, 90]), part("轴孔外侧封住船壳开口的厚壁密封套", "lathe", trim, [0, 1.8, 0], [1, 1, 1], [0, 0, 90], { profile: [{ x: 0.19, y: -0.14 }, { x: 0.5, y: -0.14 }, { x: 0.5, y: 0.14 }, { x: 0.19, y: 0.14 }, { x: 0.19, y: -0.14 }] }), box("鳍主轴上方向上伸出的俯仰摇臂", [-1.05, 2.15, 0], [0.3, 0.7, 0.22], dark), cylinder("两只液压杆共同连接的摇臂上销", [-1.05, 2.5, 0], [0.18, 0.7, 0.18], trim, [0, 0, 90]), box("一体安装底架上的液压油箱", [-2.5, 0.6, 0.9], [0.65, 0.5, 0.7], body), box("油箱上部电液控制柜", [-2.5, 1.3, 0.9], [0.6, 0.9, 0.6], dark), cylinder("油箱旁实际接在底架上的泵电机", [-2.5, 0.625, -0.3], [0.45, 0.65, 0.45], trim, [90, 0, 0])];
    for (const x of [-1.7, -0.35]) parts.push(part("鳍轴穿过的独立厚壁承载轴承", "lathe", body, [x, 1.8, 0], [1, 1, 1], [0, 0, 90], { profile: [{ x: 0.19, y: -0.18 }, { x: 0.44, y: -0.18 }, { x: 0.44, y: 0.18 }, { x: 0.19, y: 0.18 }, { x: 0.19, y: -0.18 }] }), box("轴承下缘接到机架底面的承重墩", [x, 0.9, 0], [0.45, 1.1, 0.8], dark));
    for (const side of [-1, 1]) {
      const start: Triple = [-1.05, 0.9, side * 1], middle: Triple = [-1.05, 1.9, side * 0.375], rodStart: Triple = [-1.05, 1.7, side * 0.5], end: Triple = [-1.05, 2.5, 0];
      parts.push(roundLink("由底架铰座抬起的俯仰液压缸筒", start, middle, 0.36, dark), roundLink("插入缸筒并接上共同摇臂的活塞杆", rodStart, end, 0.15, trim), box("执行缸下销实接底架的固定铰座", [-1.05, 0.64, side * 1], [0.65, 0.5, 0.5], body), cylinder("两执行缸下端横向铰轴", start, [0.15, 0.75, 0.15], trim, [0, 0, 90]));
    }
    for (let index = 0; index < 6; index++) {
      const angle = index * Math.PI / 3;
      parts.push(cylinder("外密封套法兰上连接船壳的螺栓头", [0.17, 1.8 + Math.cos(angle) * 0.43, Math.sin(angle) * 0.43], [0.07, 0.08, 0.07], dark, [0, 0, 90]));
    }
    return parts;
  } },
  { name: "双翼舱下水道上气道连通式被动减摇水舱", theme: "现代", itemType: "设施", tags: ["U形减摇水舱", "船用连通减摇水舱", "上下水气通道"], create: () => {
    const water = (name: string, position: Triple, scale: Triple) => { const value = box(name, position, scale, transportColors.glass); value.opacity = 0.35; value.roughness = 0.15; return value; };
    const parts: ModelPart[] = [box("左右翼舱之间下部水道的连续底板", [0, 0.125, 0], [12.5, 0.25, 3], dark), box("下部水道封闭顶板", [0, 1.875, 0], [12.5, 0.25, 3], body), ...[-1, 1].map(side => box("下部连通水道前后厚壁", [0, 1, side * 1.375], [12.5, 2, 0.25], body)), water("下部水道中连通两侧的静态水体", [0, 1, 0], [12.5, 1.5, 2.5])];
    for (const side of [-1, 1]) {
      const x = side * 7.5;
      parts.push(box("独立翼舱与船体底板连接的厚底", [x, 0.125, 0], [3, 0.25, 3], dark), box("翼舱朝船舷的封闭外壁", [side * 8.875, 3.25, 0], [0.25, 6, 3], body), box("翼舱背部连续封闭钢壁", [x, 3.25, 1.375], [3, 6, 0.25], body), box("内侧墙保留下部真实水口的上半壁", [side * 6.125, 4, 0], [0.25, 4.5, 3], body), ...[-1, 1].map(end => box("内侧下部水道口的两边厚柱", [side * 6.125, 1, end * 1.375], [0.25, 1.5, 0.25], body)), ...[-1, 1].map(edge => box("前壁窄液位检查窗两侧实体框", [x + edge * 0.8125, 3.25, -1.375], [1.375, 6, 0.25], body)), box("液位检查窗底边封壁", [x, 0.625, -1.375], [0.25, 0.75, 0.25], body), box("液位检查窗上边封壁", [x, 5.375, -1.375], [0.25, 1.75, 0.25], body), polygon("为上部空气竖管保留真实方孔的翼舱顶板", body, [[-1.5, -1.5], [1.5, -1.5], [1.5, 1.5], [-1.5, 1.5]], 0.25, [x, 6.25, 0], [[[-0.275, -0.275], [0.275, -0.275], [0.275, 0.275], [-0.275, 0.275]]]), water("置于真实窄窗中的液位检查玻璃", [x, 2.75, -1.4], [0.25, 3.5, 0.12]), water("翼舱内保留上部空气空间的静态水体", [x, 1.875, 0], [2.5, 3.25, 2.5]));
      for (const edge of [-1, 1]) parts.push(box("翼舱顶孔向上连接空气道的两侧管壁", [x + edge * 0.325, 6.685, 0], [0.1, 0.87, 0.75], body), box("翼舱顶孔向上连接空气道的前后管壁", [x, 6.685, edge * 0.325], [0.75, 0.87, 0.1], body));
    }
    parts.push(polygon("上气道底面在两翼舱位置各有真实空气通孔", dark, [[-7.875, -0.375], [7.875, -0.375], [7.875, 0.375], [-7.875, 0.375]], 0.12, [0, 7, 0], [-7.5, 7.5].map(x => [[x - 0.275, -0.275], [x + 0.275, -0.275], [x + 0.275, 0.275], [x - 0.275, 0.275]] as [number, number][])), box("上部连通空气道完整顶壁", [0, 7.73, 0], [15.75, 0.12, 0.75], body), ...[-1, 1].map(side => box("连通空气道的前后侧壁", [0, 7.395, side * 0.325], [15.75, 0.79, 0.1], body)), ...[-1, 1].map(side => box("空气道两端的密闭端盖", [side * 7.825, 7.395, 0], [0.1, 0.79, 0.75], body)), box("上气道内留出侧向通气净空的调谐阀板", [0, 7.39, 0], [0.04, 0.5, 0.5], dark, [0, 30, 0]), cylinder("贯穿阀板并接到管外执行头的控制轴", [0, 7.39, 0], [0.05, 1.3, 0.05], trim, [90, 0, 0]), box("气道侧边独立调谐阀执行头", [0, 7.39, 0.58], [0.45, 0.45, 0.3], dark), strut("阀执行头实接到空气道钢壁的承托", [0, 7.2, 0.3], [0, 7.2, 0.55], 0.12, dark));
    return parts;
  } },
];
