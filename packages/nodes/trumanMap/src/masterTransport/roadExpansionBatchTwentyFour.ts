import { BoxGeometry, ConeGeometry } from "three";
import { beam, part, ring, type ModelPart } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { box, cylinder, strut, surface, transportColors, type TransportDefinition } from "./parts";

function deckHeight(z: number) { return 0.9 + z * 0.1; }

function feedFlights(): ModelPart {
  const source = new BoxGeometry(1.4, 0.1, 0.065), positions = source.getAttribute("position"), vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [], angle = -Math.atan(0.1);
  try {
    for (let flight = 0; flight < 18; flight++) {
      const z = -4.45 + flight * 8.9 / 17, offset = vertices.length;
      for (let point = 0; point < positions.count; point++) vertices.push({ x: positions.getX(point), y: deckHeight(z) + 0.1 + Math.cos(angle) * positions.getY(point) - Math.sin(angle) * positions.getZ(point), z: z + Math.sin(angle) * positions.getY(point) + Math.cos(angle) * positions.getZ(point) });
      for (const index of source.index!.array) indices.push(offset + index);
    }
  } finally { source.dispose(); }
  return part("随斜槽行进并与双链接合的十八条实体刮板合批", "mesh", transportColors.trim, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

function crawlerSide(x: number): ModelPart[] {
  const contour = (radius: number): [number, number][] => [...Array.from({ length: 9 }, (_, index): [number, number] => { const angle = (-90 + index * 22.5) * Math.PI / 180; return [0.45 + Math.sin(angle) * radius, 3.0 + Math.cos(angle) * radius]; }), ...Array.from({ length: 9 }, (_, index): [number, number] => { const angle = (90 + index * 22.5) * Math.PI / 180; return [0.45 + Math.sin(angle) * radius, -1.0 + Math.cos(angle) * radius]; })];
  const band = polygon("给料破碎机的连续闭合转场履带", transportColors.dark, contour(0.45), 0.65, [x + 0.325, 0, 0], [contour(0.35)]);
  band.rotation.z = 90;
  return [band, box("履带内侧实际承接破碎床的轮架", [x, 0.55, 1.0], [0.38, 0.4, 4.1], transportColors.dark), ...[-1.0, 1 / 3, 5 / 3, 3.0].map(z => cylinder("与转场履带接触的独立负重导向轮", [x, 0.45, z], [0.7, 0.52, 0.7], transportColors.body, [0, 0, 90]))];
}

function breakerPicks(): ModelPart[] {
  const source = new ConeGeometry(0.065, 0.22, 6, 1), positions = source.getAttribute("position"), parts: ModelPart[] = [];
  const used = [...new Set(source.index!.array)], remap = new Map(used.map((index, offset) => [index, offset]));
  try {
    for (const start of [0, 12]) {
      const vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
      for (let tooth = start; tooth < start + 12; tooth++) {
        const lane = Math.floor(tooth / 8), angle = (tooth % 8 * 45 + lane * 15) * Math.PI / 180, offset = vertices.length;
        for (const point of used) vertices.push({ x: (lane - 1) * 0.58 + positions.getX(point), y: 1.7 + Math.cos(angle) * (0.37 + positions.getY(point)) - Math.sin(angle) * positions.getZ(point), z: 1.3 + Math.sin(angle) * (0.37 + positions.getY(point)) + Math.cos(angle) * positions.getZ(point) });
        for (const index of source.index!.array) indices.push(offset + remap.get(index)!);
      }
      parts.push(part("沿单根破碎轴交错布置的独立镐形硬质齿尖合批", "mesh", transportColors.trim, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices }));
    }
  } finally { source.dispose(); }
  return parts;
}

function sidePlate(side: number): ModelPart {
  const hole: [number, number][] = Array.from({ length: 16 }, (_, index) => { const a = index * Math.PI / 8; return [1.7 + Math.cos(a) * 0.11, 1.3 + Math.sin(a) * 0.11]; });
  const plate = polygon("破碎腔保留真实驱动穿轴孔的独立厚侧板", transportColors.body, [[deckHeight(0.5), 0.5], [deckHeight(2.1), 2.1], [2.58, 2.1], [2.58, 0.5]], 0.1, [side * 1.1 + 0.05, 0, 0], [hole]);
  plate.rotation.z = 90;
  return plate;
}

// 受料、刮板给料、单轴镐齿破碎和后端转载形成完整机种，不把普通破碎机加底盘扩主。
// https://www.komatsu.com/en-au/products/equipment/crushing/joy-underground-feeder-breakers/ufb-14
export const roadExpansionBatchTwentyFour: TransportDefinition[] = [
  { name: "履带受料刮板单齿轴地下给料破碎转载机", theme: "现代", itemType: "设施", tags: ["地下给料破碎机", "宽口受料与单镐齿轴破碎", "刮板定量给料连续转载"], create: () => {
    const parts: ModelPart[] = [...crawlerSide(-1.5), ...crawlerSide(1.5), beam("从低受料口到高转载端的连续耐磨槽底", transportColors.dark, [0, deckHeight(-4.6) - 0.06, -4.6], [0, deckHeight(4.6) - 0.06, 4.6], 1.5, 0.12), beam("破碎腔下部实际加宽的厚承载底板", transportColors.dark, [0, deckHeight(0.5) - 0.06, 0.5], [0, deckHeight(2.1) - 0.06, 2.1], 2.1, 0.12), sidePlate(-1), sidePlate(1), box("破碎腔上方保持维护空间的防护顶盖", [0, 2.61, 1.3], [2.5, 0.13, 1.6], transportColors.body), cylinder("贯通破碎腔并承载全部镐齿的单根破碎滚筒", [0, 1.7, 1.3], [0.66, 1.9, 0.66], transportColors.dark, [0, 0, 90]), cylinder("通过两侧真实孔口与轴承的破碎主轴", [0, 1.7, 1.3], [0.17, 2.9, 0.17], transportColors.trim, [0, 0, 90]), ...breakerPicks(), cylinder("破碎轴侧面的封闭大扭矩电动机", [1.87, 1.7, 1.3], [0.56, 0.55, 0.56], transportColors.signal, [0, 0, 90]), cylinder("位于轴承外侧并连接电动机的同轴联轴器", [1.5, 1.7, 1.3], [0.3, 0.25, 0.3], transportColors.dark, [0, 0, 90]), strut("从主床架实际托住侧面破碎电机的斜支承", [0.95, 0.88, 1.3], [1.87, 1.42, 1.3], 0.14, transportColors.body)];
    for (const side of [-1, 1]) {
      parts.push(beam("与中部槽底贯通的纵向承载梁", transportColors.body, [side * 0.95, deckHeight(-4.5) - 0.15, -4.5], [side * 0.95, deckHeight(4.5) - 0.15, 4.5], 0.18, 0.22), beam("沿斜槽底连续上行的给料链", transportColors.dark, [side * 0.5, deckHeight(-4.8) + 0.05, -4.8], [side * 0.5, deckHeight(4.8) + 0.05, 4.8], 0.05, 0.05), beam("槽底下方与横框保持净空的回程链", transportColors.dark, [side * 0.5, deckHeight(-4.8) - 0.3, -4.8], [side * 0.5, deckHeight(4.8) - 0.3, 4.8], 0.05, 0.04), surface("宽口受料斗倾向中部刮板槽的真实斜底肩", transportColors.dark, [[side * 0.72, deckHeight(-4.8), -4.8], [side * 1.6, deckHeight(-4.8) + 0.66, -4.8], [side * 0.8, deckHeight(-0.8) + 0.06, -0.8], [side * 0.72, deckHeight(-0.8), -0.8]], [0, 1, 2, 0, 2, 3]), surface("宽口受料斗从低口至喉部连续收窄的薄侧壁", transportColors.body, [[side * 1.6, 1.08, -4.8], [side * 0.8, 0.88, -0.8], [side * 1.35, 1.88, -0.8], [side * 2.15, 2.08, -4.8]], [0, 1, 2, 0, 2, 3]), ring("与破碎腔侧板真正相接并保留中心轴孔的主轴承座", transportColors.dark, 0.22, 0.12, 0, 0.22, { position: { x: side * 1.24, y: 1.7, z: 1.3 }, rotation: { x: 0, y: 0, z: 90 } }), box("宽口受料斗前端独立着地的稳定脚板", [side * 1.4, 0.1, -4.4], [0.65, 0.2, 0.65], transportColors.dark), strut("前稳定脚板到宽口斜受料底的实际支脚", [side * 1.4, 0.2, -4.4], [side * 1.4, 0.97, -4.4], 0.14, transportColors.body));
      for (const [a, b] of [[-0.8, 0.5], [2.1, 4.6]]) parts.push(beam("在破碎滚筒前后分段保留真实让位的运料槽侧板", transportColors.body, [side * 0.8, deckHeight(a!) + 0.3, a!], [side * 0.8, deckHeight(b!) + 0.3, b!], 0.1, 0.6));
      for (const z of [-1 / 3, 1.0, 7 / 3]) parts.push(strut("通过履带内孔且避让负重轮的侧向承载横梁", [side * 1.5, 0.72, z], [side * 0.95, 0.72, z], 0.14, transportColors.dark), box("从履带横梁接到连续承载床的内侧承柱", [side * 0.95, (0.72 + deckHeight(z) - 0.15) / 2, z], [0.14, Math.max(0.15, deckHeight(z) - 0.72), 0.2], transportColors.body));
    }
    for (const z of [-1 / 3, 1.0, 7 / 3]) parts.push(box("高于回程链并连接两侧床架的横向承梁", [0, deckHeight(z) - 0.15, z], [2.1, 0.18, 0.2], transportColors.dark));
    parts.push(feedFlights());
    for (const end of [-1, 1]) {
      const z = end * 4.8, y = deckHeight(z) - 0.125;
      parts.push(cylinder("低进料与高出料端的贯通给料链轮轴", [0, y, z], [0.08, 2.2, 0.08], transportColors.dark, [0, 0, 90]));
      for (const side of [-1, 1]) parts.push(cylinder("斜槽端部连接上行和回程链的实际链轮", [side * 0.5, y, z], [0.35, 0.11, 0.35], transportColors.trim, [0, 0, 90]), ring("端部链轮轴保留穿轴空隙的独立轴承", transportColors.body, 0.12, 0.065, 0, 0.15, { position: { x: side * 0.95, y, z }, rotation: { x: 0, y: 0, z: 90 } }), strut("纵梁端部实际托住外伸链轮轴承的短支承", [side * 0.95, deckHeight(end * 4.5) - 0.15, end * 4.5], [side * 0.95, y - 0.1, z], 0.07, transportColors.dark));
    }
    return parts;
  } },
];
