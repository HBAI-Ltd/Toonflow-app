import { BoxGeometry, CylinderGeometry } from "three";
import { part, ring, type ModelPart, type Triple } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { box, cylinder, helicalFlight, strut, transportColors, type TransportDefinition } from "./parts";

function boxAssembly(name: string, pieces: { p: Triple; s: Triple }[], position: Triple = [0, 0, 0], color = transportColors.body): ModelPart {
  const vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
  for (const piece of pieces) {
    const geometry = new BoxGeometry(...piece.s), source = geometry.getAttribute("position"), offset = vertices.length;
    try {
      for (let point = 0; point < source.count; point++) vertices.push({ x: piece.p[0] + source.getX(point), y: piece.p[1] + source.getY(point), z: piece.p[2] + source.getZ(point) });
      for (const index of geometry.index!.array) indices.push(offset + index);
    } finally { geometry.dispose(); }
  }
  return part(name, "mesh", color, position, [1, 1, 1], [0, 0, 0], { vertices, indices });
}

function trackModule(x: number, z: number): ModelPart[] {
  const contour = (radius: number): [number, number][] => [...Array.from({ length: 9 }, (_, index): [number, number] => { const a = (-90 + index * 22.5) * Math.PI / 180; return [0.25 + Math.sin(a) * radius, 0.6 + Math.cos(a) * radius]; }), ...Array.from({ length: 9 }, (_, index): [number, number] => { const a = (90 + index * 22.5) * Math.PI / 180; return [0.25 + Math.sin(a) * radius, -0.6 + Math.cos(a) * radius]; })];
  const band = polygon("独立调平履带保留负重轮与侧连接内腔", transportColors.dark, contour(0.25), 0.45, [x + 0.225, 0, z], [contour(0.18)]);
  band.rotation.z = 90;
  const body = boxAssembly("绕开上回程履带并接到内轮架的完整转向支架", [{ p: [0, 0.3, 0], s: [0.26, 0.18, 1.25] }, { p: [0, 0.58, 0], s: [0.62, 0.12, 1.7] }, { p: [-0.29, 0.44, 0.3], s: [0.05, 0.28, 0.16] }, { p: [0.29, 0.44, 0.3], s: [0.05, 0.28, 0.16] }, { p: [0, 0.34, 0.3], s: [0.68, 0.08, 0.08] }], [x, 0, z]);
  return [band, body, ...[-0.6, 0, 0.6].map(offset => cylinder("与小履带内缘相接的独立驱动负重轮", [x, 0.25, z + offset], [0.36, 0.35, 0.36], transportColors.body, [0, 0, 90])), cylinder("履带转向支架上方的垂直回转支承", [x, 0.7, z], [0.3, 0.25, 0.3], transportColors.dark)];
}

function vibrators(): ModelPart[] {
  const head = new CylinderGeometry(0.035, 0.035, 0.64, 8, 1), stem = new CylinderGeometry(0.012, 0.012, 0.455, 8, 1), pieces = [{ geometry: head, y: 0.6 }, { geometry: stem, y: 1.1475 }], parts: ModelPart[] = [];
  try {
    for (let batch = 0; batch < 16; batch += 4) {
      const vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
      for (let vibrator = batch; vibrator < batch + 4; vibrator++) for (const piece of pieces) {
        const source = piece.geometry.getAttribute("position"), used = [...new Set(piece.geometry.index!.array)], remap = new Map(used.map((index, offset) => [index, offset])), offset = vertices.length;
        for (const point of used) vertices.push({ x: -2.8 + vibrator * 5.6 / 15 + source.getX(point), y: piece.y + source.getY(point), z: -0.15 + source.getZ(point) });
        for (const index of piece.geometry.index!.array) indices.push(offset + remap.get(index)!);
      }
      parts.push(part("保留独立插入棒与驱动柔轴的整排混凝土振捣器合批", "mesh", transportColors.dark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices }));
    }
  } finally { head.dispose(); stem.dispose(); }
  return parts;
}

// 布料、插入振捣、夯实与底开口滑模是整套混凝土路面工序，不按履带数或铺筑宽度扩主。
// https://www.gomaco.com/resources/gp3_paver.html
export const roadExpansionBatchTwentyEight: TransportDefinition[] = [
  { name: "跨幅门架多工序混凝土滑模路面摊铺机", theme: "现代", tags: ["混凝土滑模路面摊铺机", "四角独立调平履带", "分料振捣夯实成形与尾抹板"], create: () => {
    const parts: ModelPart[] = [
      box("前后调平腿之间的前横向承重门梁", [0, 1.9, -1.5], [6.8, 0.35, 0.4], transportColors.body),
      box("前后调平腿之间的后横向承重门梁", [0, 1.9, 1.5], [6.8, 0.35, 0.4], transportColors.body),
      box("跨幅门架上供操纵和维护的连续平台", [0, 2.1, 0], [6.6, 0.08, 2.3], transportColors.dark),
      box("平台左侧封闭液压动力机罩", [-1.6, 2.65, 0], [2.0, 1.02, 1.6], transportColors.signal),
      box("平台右侧供站立操纵的独立控制柜", [1.6, 2.5, 0], [1.0, 0.72, 0.6], transportColors.body),
      boxAssembly("实际接到平台四角的完整维护护栏合批", [{ p: [-3.2, 2.64, -1.1], s: [0.04, 1.0, 0.04] }, { p: [3.2, 2.64, -1.1], s: [0.04, 1.0, 0.04] }, { p: [-3.2, 2.64, 1.1], s: [0.04, 1.0, 0.04] }, { p: [3.2, 2.64, 1.1], s: [0.04, 1.0, 0.04] }, { p: [0, 3.14, -1.1], s: [6.44, 0.04, 0.04] }, { p: [0, 3.14, 1.1], s: [6.44, 0.04, 0.04] }, { p: [-3.2, 3.14, 0], s: [0.04, 0.04, 2.2] }, { p: [3.2, 3.14, 0], s: [0.04, 0.04, 2.2] }]),
      ...vibrators(),
      box("插入振捣棒和柔轴顶部实际悬挂的横向驱动梁", [0, 1.45, -0.15], [6.0, 0.15, 0.15], transportColors.body),
      box("供混凝土竖向夯实的连续横向夯板", [0, 0.6, 0], [5.8, 0.24, 0.09], transportColors.trim),
      box("双夯实驱动缸上方的独立反力横梁", [0, 1.4, 0], [6.0, 0.13, 0.15], transportColors.body),
      boxAssembly("下部敞开且带完整双侧限边的成形滑模", [{ p: [0, 0.45, 0.65], s: [6.0, 0.12, 1.2] }, { p: [-3.02, 0.3, 0.65], s: [0.12, 0.4, 1.2] }, { p: [3.02, 0.3, 0.65], s: [0.12, 0.4, 1.2] }], [0, 0, 0], transportColors.trim),
      box("前缘微抬并接触成形面的尾部精平抹板", [0, 0.44, 1.55], [5.8, 0.08, 0.5], transportColors.trim, [5, 0, 0]),
      ring("两分料螺旋中部保持真实轴孔的支承轴承", transportColors.dark, 0.14, 0.075, 0, 0.18, { position: { x: 0, y: 0.55, z: -0.65 }, rotation: { x: 0, y: 0, z: 90 } }),
      strut("前门梁向中间螺旋轴承传力的悬挂杆", [0, 1.9, -1.5], [0, 0.69, -0.65], 0.08, transportColors.body),
    ];
    for (const side of [-1, 1]) {
      parts.push(box("连续连接前后门梁的纵向承载梁", [side * 1.6, 1.9, 0], [0.22, 0.35, 3.4], transportColors.body), cylinder("前端分料螺旋的连续半幅芯轴", [side * 1.475, 0.55, -0.65], [0.12, 2.85, 0.12], transportColors.dark, [0, 0, 90]), cylinder("分料螺旋外侧的独立液压驱动器", [side * 3.1, 0.55, -0.65], [0.35, 0.3, 0.35], transportColors.signal, [0, 0, 90]), cylinder("分料螺旋与外侧液压驱动器的共轴连接颈", [side * 2.98, 0.55, -0.65], [0.1, 0.2, 0.1], transportColors.trim, [0, 0, 90]), strut("前门梁接到外侧螺旋驱动器的实际吊座", [side * 3.1, 1.9, -1.5], [side * 3.1, 0.7, -0.65], 0.1, transportColors.body), strut("前门梁到振捣器悬梁的独立支承", [side * 2.0, 1.9, -1.5], [side * 2.0, 1.45, -0.15], 0.08, transportColors.body), strut("纵梁与夯实驱动反力梁之间的承载杆", [side * 1.6, 1.9, 0.8], [side * 1.6, 1.4, 0], 0.08, transportColors.body), cylinder("由上反力梁支承的夯板垂直驱动缸", [side * 1.6, 1.05, 0], [0.1, 0.65, 0.1], transportColors.dark), cylinder("垂直驱动缸接到夯板的共轴下活塞杆", [side * 1.6, 0.7, 0], [0.04, 0.2, 0.04], transportColors.trim), strut("前门梁在振捣排外侧承托滑模的斜吊杆", [side * 2.95, 1.9, -1.5], [side * 2.95, 0.51, 0.3], 0.08, transportColors.body), strut("后门梁到滑模后部的独立斜吊杆", [side * 2.95, 1.9, 1.5], [side * 2.95, 0.51, 1.0], 0.08, transportColors.body), strut("滑模后部到尾精平抹板的连续牵引杆", [side * 2.85, 0.51, 1.0], [side * 2.85, 0.48, 1.55], 0.07, transportColors.dark));
      const flight = helicalFlight([side * 2.9, 0.55, -0.65], 0.06, 0.25, 2.85, 5, side < 0 ? 1 : -1, 0.025);
      flight.rotation.z = side < 0 ? -90 : 90;
      parts.push(flight);
      for (const end of [-1, 1]) parts.push(...trackModule(side * 3.65, end * 1.8), strut("独立履带回转头到调平腿的平面摆臂", [side * 3.65, 0.85, end * 1.8], [side * 3.4, 0.85, end * 1.5], 0.18, transportColors.body), cylinder("与跨幅门梁相接的独立调平腿外筒", [side * 3.4, 1.55, end * 1.5], [0.26, 0.9, 0.26], transportColors.dark), cylinder("调平腿外筒接到履带摆臂的共轴活塞杆", [side * 3.4, 1.0, end * 1.5], [0.11, 0.4, 0.11], transportColors.trim));
    }
    return parts;
  } },
];
