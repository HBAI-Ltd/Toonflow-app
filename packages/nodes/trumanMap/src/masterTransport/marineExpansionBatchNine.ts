import { part, type ModelPart, type Triple } from "../assetModelParts";
import { ball, box, cylinder, strut, surface, transportColors, type TransportDefinition } from "./parts";

// 原创简化的独立潜航构造，不复制展品模型，不提供耐压或航行规格。
// https://www.history.navy.mil/our-collections/artifacts/ship-and-shore/boats-and-small-craft/bathyscape-trieste.html
// https://scripps.ucsd.edu/news/research-highlight-five-new-instruments-keeping-oceanography-fun

const body = transportColors.body, dark = transportColors.dark, trim = transportColors.trim;

function perforatedPressureSphere(): ModelPart[] {
  const points: Triple[] = [];
  for (let row = 1; row <= 9; row++) for (let column = 0; column < 24; column++) {
    const theta = row * Math.PI / 10, phi = column * Math.PI / 12;
    points.push([Math.sin(theta) * Math.cos(phi), Math.cos(theta), Math.sin(theta) * Math.sin(phi)]);
  }
  const pole = points.length;
  points.push([0, -1, 0]);
  const hullFaces: number[] = [], windowFaces: number[] = [];
  for (let row = 0; row < 8; row++) for (let column = 0; column < 24; column++) {
    const a = row * 24 + column, b = row * 24 + (column + 1) % 24, c = a + 24, d = b + 24;
    const target = (row === 3 || row === 4) && (column === 17 || column === 18) ? windowFaces : hullFaces;
    target.push(a, b, d, a, d, c);
  }
  for (let column = 0; column < 24; column++) hullFaces.push(8 * 24 + column, 8 * 24 + (column + 1) % 24, pole);
  const shell = (name: string, color: string, faces: number[]) => {
    const used = [...new Set(faces)], locations = new Map(used.map((index, local) => [index, local])), count = used.length;
    const vertices = [1.25, 1.1].flatMap(radius => used.map(index => ({ x: points[index]![0] * radius, y: points[index]![1] * radius, z: points[index]![2] * radius })));
    const front = faces.map(index => locations.get(index)!), indices = [...front], edges = new Map<string, [number, number]>();
    for (let index = 0; index < front.length; index += 3) {
      const triangle = front.slice(index, index + 3);
      indices.push(triangle[2]! + count, triangle[1]! + count, triangle[0]! + count);
      for (let edge = 0; edge < 3; edge++) { const a = triangle[edge]!, b = triangle[(edge + 1) % 3]!; if (!edges.delete(`${b},${a}`)) edges.set(`${a},${b}`, [a, b]); }
    }
    for (const [a, b] of edges.values()) indices.push(a, b + count, b, a, a + count, b + count);
    return part(name, "mesh", color, [0, 1.55, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
  };
  const glass = shell("嵌在前观察孔内的有厚度曲面玻璃", transportColors.glass, windowFaces);
  glass.opacity = 0.4;
  glass.roughness = 0.12;
  return [shell("具有顶部出入井孔和前观察孔的厚壁球舱", body, hullFaces), glass];
}

export const marineExpansionBatchNine: TransportDefinition[] = [
  { name: "大型浮力舱下悬耐压球式深海升降潜器", theme: "现代", tags: ["bathyscaphe", "浮力舱式深潜器", "深海升降潜器"], create: () => {
    const parts: ModelPart[] = [...perforatedPressureSphere(), part("独立于耐压球的长形液体浮力舱", "lathe", trim, [0, 4.8, 0], [1, 1, 1], [90, 0, 0], { profile: [{ x: 0, y: -7.8 }, { x: 0.7, y: -7.5 }, { x: 1.6, y: -6 }, { x: 1.6, y: 6 }, { x: 0.7, y: 7.5 }, { x: 0, y: 7.8 }] }), part("由球舱顶孔接往主甲板的中空出入井", "lathe", dark, [0, 2.6, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0.35, y: 0 }, { x: 0.43, y: 0 }, { x: 0.43, y: 4.6 }, { x: 0.35, y: 4.6 }, { x: 0.35, y: 0 }] }), box("浮力舱上方窄工作甲板", [0, 6.5, 0], [1.7, 0.2, 12], dark), cylinder("出入井上端密封舱盖", [0, 7.3, 0], [1.05, 0.2, 1.05], body)];
    for (const side of [-1, 1]) {
      parts.push(box("球舱两侧承载长滑橇", [side * 1.5, 0.1, 0], [0.24, 0.2, 10], dark), strut("主甲板两侧安全横栏", [side * 0.8, 7.5, -5.8], [side * 0.8, 7.5, 5.8], 0.045, body));
      for (const z of [-4.8, 0, 4.8]) parts.push(strut("主甲板护栏立柱", [side * 0.8, 6.6, z], [side * 0.8, 7.5, z], 0.045, body));
      for (const z of [-4, 4]) parts.push(strut("下承橇至液体浮力舱的斜支架", [side * 1.5, 0.2, z], [side * 1.1, 3.6, z], 0.18, dark));
    }
    for (const z of [-3, 0, 3]) parts.push(strut("滑橇之间共同承托球舱的横梁", [-1.5, 0.25, z], [1.5, 0.25, z], 0.16, dark));
    for (const z of [-3, 3]) parts.push(part("浮力舱下方独立锥底可释放压载斗", "cone", body, [0, 2.6, z], [1.6, 1.8, 1.6], [180, 0, 0]), cylinder("锥斗底部压载释放口", [0, 1.6, z], [0.25, 0.25, 0.25], dark));
    return parts;
  } },
  { name: "翼身融合浮力驱动海洋滑翔机", theme: "现代", tags: ["飞翼水下滑翔机", "浮力驱动滑翔机", "blended wing glider"], create: () => {
    const outline = [[0, -2], [1.2, -1.1], [3, 0.15], [3, 0.55], [1, 1], [0, 1.5], [-1, 1], [-3, 0.55], [-3, 0.15], [-1.2, -1.1]];
    const vertices = [1, -1].flatMap(side => [{ x: 0, y: side * 0.18, z: 0 }, ...outline.map(([x, z]) => ({ x: x!, y: side * (0.18 - Math.abs(x!) * 0.05), z: z! }))]);
    const count = outline.length + 1, indices: number[] = [];
    for (let index = 0; index < outline.length; index++) {
      const a = 1 + index, b = 1 + (index + 1) % outline.length;
      indices.push(0, b, a, count, a + count, b + count, a, b, b + count, a, b + count, a + count);
    }
    const controls = [-1, 1].map(side => {
      const points = [[1.05, -0.2], [2.3, -0.2], [2.3, -0.01], [1.05, -0.01]].map(([x, inset]) => [side * x!, 0.405 - x! * 0.05, 1 - (x! - 1) * 0.225 + inset!] as Triple);
      return surface("贴合上翼面倾斜的后缘控制面盖板", trim, points, [0, 1, 2, 0, 2, 3]);
    });
    return [part("自带浮力空间的连续薄飞翼船体", "mesh", body, [0, 0.22, 0], [1, 1, 1], [0, 0, 0], { vertices, indices }), ball("前缘一体声学观察圆罩", [0, 0.3, -1.4], [0.7, 0.23, 0.5], dark), ...controls, cylinder("尾缘伸出的细遥测天线", [0, 0.7, 1.1], [0.018, 0.8, 0.018], dark), ...[-1, 1].map(side => ball("翼梢宽带声学传感器包", [side * 2.88, 0.22, 0.3], [0.2, 0.09, 0.3], dark))];
  } },
];
