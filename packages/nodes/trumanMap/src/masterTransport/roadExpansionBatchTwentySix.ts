import { BoxGeometry, ExtrudeGeometry, Shape, Vector2 } from "three";
import { part, ring, type ModelPart, type Triple } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { box, cab, cylinder, strut, surface, transportColors, type TransportDefinition } from "./parts";

function crawlerSide(x: number): ModelPart[] {
  const contour = (radius: number): [number, number][] => [...Array.from({ length: 9 }, (_, index): [number, number] => { const a = (-90 + index * 22.5) * Math.PI / 180; return [0.55 + Math.sin(a) * radius, 1.2 + Math.cos(a) * radius]; }), ...Array.from({ length: 9 }, (_, index): [number, number] => { const a = (90 + index * 22.5) * Math.PI / 180; return [0.55 + Math.sin(a) * radius, -3.2 + Math.cos(a) * radius]; })];
  const band = polygon("专用斗轮机的连续闭合承重履带", transportColors.dark, contour(0.55), 0.65, [x + 0.325, 0, 0], [contour(0.42)]);
  band.rotation.z = 90;
  return [band, box("履带内部实际承载牵引车体的轮架", [x, 0.67, -1.0], [0.4, 0.55, 4.5], transportColors.dark), ...[-3.2, -2.1, -1.0, 0.1, 1.2].map(z => cylinder("与履带内缘相接的独立承重导向轮", [x, 0.55, z], [0.84, 0.52, 0.84], transportColors.body, [0, 0, 90]))];
}

function wheelFrame(side: number): ModelPart {
  const d = 1.35 / Math.sqrt(2), bars = [{ g: new BoxGeometry(0.15, 0.15, d * 2 + 0.15), y: 2.2 - d, z: 4 }, { g: new BoxGeometry(0.15, 0.15, d * 2 + 0.15), y: 2.2 + d, z: 4 }, { g: new BoxGeometry(0.15, d * 2 + 0.15, 0.15), y: 2.2, z: 4 - d }, { g: new BoxGeometry(0.15, d * 2 + 0.15, 0.15), y: 2.2, z: 4 + d }];
  const vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
  try {
    for (const bar of bars) {
      const source = bar.g.getAttribute("position"), offset = vertices.length;
      for (let point = 0; point < source.count; point++) vertices.push({ x: side * 0.85 + source.getX(point), y: bar.y + source.getY(point), z: bar.z + source.getZ(point) });
      for (const index of bar.g.index!.array) indices.push(offset + index);
    }
  } finally { for (const bar of bars) bar.g.dispose(); }
  return part("在斗轮外侧并留出中央皮带通道的完整支承框合批", "mesh", transportColors.body, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

function diggingBuckets(): ModelPart[] {
  const body = new ExtrudeGeometry(new Shape([[-0.42, 0.28], [0.35, 0.12], [0.35, -0.3], [0.21, -0.3], [0.21, 0], [-0.38, 0.12]].map(([x, y]) => new Vector2(x, y))), { depth: 1.0, steps: 1, bevelEnabled: false, curveSegments: 1 }).translate(0, 0, -0.5);
  const cheek = new ExtrudeGeometry(new Shape([[-0.42, 0.28], [0.35, 0.12], [0.35, -0.3], [0.1, -0.3], [-0.38, 0.12]].map(([x, y]) => new Vector2(x, y))), { depth: 0.08, steps: 1, bevelEnabled: false, curveSegments: 1 }).translate(0, 0, -0.04);
  const pieces = [{ geometry: body, x: 0 }, { geometry: cheek, x: -0.54 }, { geometry: cheek, x: 0.54 }], parts: ModelPart[] = [];
  try {
    for (let batch = 0; batch < 12; batch += 3) {
      const vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
      for (let bucket = batch; bucket < batch + 3; bucket++) {
        const angle = bucket * Math.PI / 6;
        for (const piece of pieces) {
          const source = piece.geometry.getAttribute("position"), offset = vertices.length;
          for (let point = 0; point < source.count; point++) vertices.push({ x: source.getZ(point) + piece.x, y: 2.2 + Math.cos(angle) * (1.86 + source.getY(point)) + Math.sin(angle) * source.getX(point), z: 4 + Math.sin(angle) * (1.86 + source.getY(point)) - Math.cos(angle) * source.getX(point) });
          if (piece.geometry.index) for (const index of piece.geometry.index.array) indices.push(offset + index);
          else for (let index = 0; index < source.count; index++) indices.push(offset + index);
        }
      }
      parts.push(part("保持开口切刃后帮与双侧颊板的斗轮掘土斗合批", "mesh", transportColors.signal, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices }));
    }
  } finally { body.dispose(); cheek.dispose(); }
  return parts;
}

function liftCylinder(start: Triple, end: Triple): ModelPart[] {
  const middle = start.map((value, index) => value + (end[index]! - value) * 0.64) as Triple, overlap = start.map((value, index) => value + (end[index]! - value) * 0.6) as Triple;
  const body = strut("支承斗轮大框的举升缸外筒", start, middle, 0.18), rod = strut("与外筒共轴并接到上承臂的活塞杆", overlap, end, 0.075, transportColors.trim);
  body.shape = "cylinder"; rod.shape = "cylinder";
  return [body, rod];
}

function beltSupports(): ModelPart {
  const d = 1.35 / Math.sqrt(2), dy = 2.1 - (2.2 - d), dz = 3.6 - (4 - d), angle = Math.atan2(dz, dy), source = new BoxGeometry(0.1, Math.hypot(dy, dz), 0.1), points = source.getAttribute("position");
  const vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
  try {
    for (const side of [-1, 1]) {
      const offset = vertices.length;
      for (let point = 0; point < points.count; point++) vertices.push({ x: side * 0.85 + points.getX(point), y: (2.2 - d + 2.1) / 2 + Math.cos(angle) * points.getY(point) - Math.sin(angle) * points.getZ(point), z: (4 - d + 3.6) / 2 + Math.sin(angle) * points.getY(point) + Math.cos(angle) * points.getZ(point) });
      for (const index of source.index!.array) indices.push(offset + index);
    }
  } finally { source.dispose(); }
  return part("外支框实际承托穿心排土带的双侧斜支承合批", "mesh", transportColors.dark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

// 独立轮辋支承斗轮整机，横向排土带穿过空心轮心，不给旧链式挖沟车换属具。
// https://www.buckeyetrenchers.com/buckeye-trenchers
// https://wolfeequipment.com/trenchers/
export const roadExpansionBatchTwentySix: TransportDefinition[] = [
  { name: "轮辋滚轮支承侧排土式斗轮挖沟机", theme: "现代", tags: ["独立斗轮挖沟机", "空心斗轮轮辋滚轮支承", "穿心横向排土输送带"], create: () => {
    const d = 1.35 / Math.sqrt(2);
    const parts: ModelPart[] = [
      ...crawlerSide(-1.25), ...crawlerSide(1.25),
      box("位于双履带内侧并承托后方斗轮的牵引机架", [0, 1.25, -1.0], [1.75, 0.45, 5.6], transportColors.dark),
      ...cab([-0.35, 1.48, -2.9], [1.2, 1.65, 1.7]),
      box("专用斗轮机后轮架前方的封闭液压动力舱", [0, 2.05, -0.5], [1.9, 1.15, 2.8], transportColors.body),
      wheelFrame(-1), wheelFrame(1), ...diggingBuckets(),
      box("从空心斗轮中穿过并向侧面排土的上输送带", [1.4, 2.2, 4], [4.2, 0.065, 0.7], transportColors.dark),
      box("横向排土带下方的独立回程带", [1.4, 2.0, 4], [4.2, 0.045, 0.7], transportColors.dark),
      box("位于斗轮中心内部的余土刮料导流边", [0, 3.65, 4], [0.9, 0.06, 0.75], transportColors.trim),
      surface("余土刮料边与落料斗顶缘连接的完整梯形支架", transportColors.dark, [[-0.5, 3.55, 3.8], [0.5, 3.55, 3.8], [0.4, 3.65, 3.8], [-0.4, 3.65, 3.8]], [0, 1, 2, 0, 2, 3]),
      beltSupports(),
      cylinder("主动支承滚轮外侧的斗轮液压驱动马达", [1.1, 2.2 + d, 4 - d], [0.32, 0.35, 0.32], transportColors.signal, [0, 0, 90]),
      cylinder("液压马达通过支框接到主动滚轮的同轴驱动颈", [0.975, 2.2 + d, 4 - d], [0.09, 0.25, 0.09], transportColors.trim, [0, 0, 90]),
    ];
    for (const side of [-1, 1]) {
      parts.push(ring("保留空心卸土通道的整圈承重斗轮轮辋", transportColors.dark, 1.8, 0.25, 0, 0.1, { position: { x: side * 0.55, y: 2.2, z: 4 }, rotation: { x: 0, y: 0, z: 90 } }), strut("主牵引架到斗轮外支框前下角的独立承臂", [side * 0.85, 1.25, 1.4], [side * 0.85, 2.2 - d, 4 - d], 0.22, transportColors.body), strut("主牵引架到斗轮外支框前上角的斜向承臂", [side * 0.85, 1.45, 1.4], [side * 0.85, 2.2 + d, 4 - d], 0.16, transportColors.body), ...liftCylinder([side * 0.82, 1.4, 1.1], [side * 0.85, 2.7, 2.6]), box("横向排土输送机两侧的贯通承力梁", [1.4, 2.1, 4 + side * 0.4], [4.5, 0.18, 0.1], transportColors.body), strut("斗轮外侧支框到内侧落料斗的支承斜杆", [side * 0.85, 2.2 + d, 4 - d], [side * 0.5, 3.55, 3.8], 0.08, transportColors.dark), surface("斗轮内把落土集中到横带上的开口漏斗侧壁", transportColors.body, [[side * 0.5, 3.55, 3.6], [side * 0.5, 3.55, 4.4], [side * 0.325, 2.65, 4.275], [side * 0.325, 2.65, 3.725]], [0, 1, 2, 0, 2, 3]), surface("穿心落料斗保留上下开口的独立前后壁", transportColors.body, [[-0.5, 3.55, 4 + side * 0.4], [0.5, 3.55, 4 + side * 0.4], [0.325, 2.65, 4 + side * 0.275], [-0.325, 2.65, 4 + side * 0.275]], [0, 1, 2, 0, 2, 3]));
      for (const ySide of [-1, 1]) for (const zSide of [-1, 1]) parts.push(cylinder("在空心轮辋内侧承担径向载荷的实际支承滚轮", [side * 0.55, 2.2 + ySide * d, 4 + zSide * d], [0.4, 0.18, 0.4], transportColors.trim, [0, 0, 90]), cylinder("支承滚轮通过外支框的独立承重短轴", [side * 0.7, 2.2 + ySide * d, 4 + zSide * d], [0.08, 0.3, 0.08], transportColors.dark, [0, 0, 90]));
      for (const z of [-2.65, 0.65]) parts.push(strut("从履带轮间内孔接出的中央机架横梁", [side * 1.25, 0.72, z], [side * 0.82, 0.72, z], 0.15, transportColors.dark), box("内侧横梁到高位牵引机架的承托柱", [side * 0.82, 0.95, z], [0.14, 0.46, 0.2], transportColors.body));
    }
    for (const x of [-0.7, 3.5]) parts.push(cylinder(x > 0 ? "内置输送驱动电机的出料端滚筒" : "连接排土上带与回程带的进料端滚筒", [x, 2.1, 4], [0.2, 0.85, 0.2], transportColors.trim, [90, 0, 0]));
    return parts;
  } },
];
