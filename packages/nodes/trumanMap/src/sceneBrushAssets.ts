import { Box3, CatmullRomCurve3, Euler, Quaternion, Vector3 } from "three";
import { createModelGroup, modelSchema } from "./modelGeometry";
import type { ModelDefinition } from "./modelGeometry";
import { createSceneObject, type SceneAsset, type SceneTerrain, type Vector3Value } from "./sceneDocument";
import { getTerrainHeight } from "./terrainModel";

export type SceneBrushMode = "assets" | "wall" | "paving";
export type SceneBrushStatus = { ready: boolean; loading: number; total: number };
export type SceneBrushSettings = {
  mode: SceneBrushMode;
  assets: SceneAsset[];
  style: string;
  radius: number;
  spacing: number;
  size: number;
  width: number;
  height: number;
};
type BrushPart = ModelDefinition["parts"][number];
type BrushStyle = { id: string; name: string; asset: SceneAsset; group?: string; width?: number; height?: number };

function part(name: string, shape: BrushPart["shape"], color: string, position: number[], scale: number[], rotation = [0, 0, 0]): BrushPart {
  return { name, shape, color, position: { x: position[0]!, y: position[1]!, z: position[2]! }, scale: { x: scale[0]!, y: scale[1]!, z: scale[2]! }, rotation: { x: rotation[0]!, y: rotation[1]!, z: rotation[2]! }, roughness: 0.82 };
}

function branch(start: number[], end: number[], radius: number, color = "#75604a") {
  const a = new Vector3(...start as [number, number, number]);
  const b = new Vector3(...end as [number, number, number]);
  const direction = b.clone().sub(a);
  const rotation = new Euler().setFromQuaternion(new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), direction.clone().normalize()));
  return part("树干与枝条", "cylinder", color, a.add(b).multiplyScalar(0.5).toArray(), [radius * 2, direction.length(), radius * 2], [rotation.x, rotation.y, rotation.z].map(value => value * 180 / Math.PI));
}

function asset(id: string, name: string, category: "自然" | "建筑", parts: BrushPart[]): SceneAsset {
  return { id, name, category, kind: "model", normalize: false, license: "内置程序化模型", model: modelSchema.parse({ name, parts }) };
}

function leafyTree(id: string, name: string, colors: string[], height: number, spread: number, trunkColor = "#79634c") {
  const parts = [branch([0, 0, 0], [0, height * 0.72, 0], 0.17, trunkColor)];
  for (let index = 0; index < 7; index++) {
    const angle = index * Math.PI * 2 / 6;
    const distance = index === 6 ? 0 : spread * 0.28;
    const x = Math.cos(angle) * distance;
    const z = Math.sin(angle) * distance;
    const y = height * (index === 6 ? 0.81 : 0.68 + index % 2 * 0.05);
    if (index < 6) parts.push(branch([0, height * 0.42, 0], [x, y, z], 0.065, trunkColor));
    parts.push(part("树冠", "sphere", colors[index % colors.length]!, [x, y, z], [spread * 0.72, height * 0.35, spread * 0.7]));
  }
  return asset(id, name, "自然", parts);
}

function spruceTree() {
  const parts = [branch([0, 0, 0], [0, 7.8, 0], 0.17)];
  for (let index = 0; index < 5; index++) parts.push(part("层叠针叶", "cone", ["#426650", "#52735b", "#3a5a48"][index % 3]!, [0, 2.5 + index * 1.08, 0], [3.7 - index * 0.62, 2.85 - index * 0.16, 3.7 - index * 0.62]));
  return asset("brushSpruce", "云杉", "自然", parts);
}

function birchTree() {
  const tree = leafyTree("brushBirch", "白桦", ["#8ba06b", "#a3b37e", "#7e985e"], 7.7, 3.5, "#d5d2bf");
  for (let index = 0; index < 9; index++) tree.model!.parts.push(part("白桦树皮", "box", "#655e53", [index % 2 ? 0.05 : -0.05, 0.45 + index * 0.39, 0.164], [0.15 + index % 3 * 0.025, 0.065, 0.025]));
  return tree;
}

function palmTree() {
  const parts = [branch([0, 0, 0], [0.24, 3.4, 0], 0.2), branch([0.24, 3.4, 0], [0.62, 6.7, 0], 0.16)];
  for (let index = 0; index < 8; index++) {
    const angle = index * Math.PI / 4;
    const forward = new Vector3(Math.cos(angle), 0, Math.sin(angle));
    const side = new Vector3(-forward.z, 0, forward.x);
    const base = new Vector3(0.62, 6.7, 0);
    const middle = base.clone().addScaledVector(forward, 1.65).add(new Vector3(0, 0.4, 0));
    const end = base.clone().addScaledVector(forward, 3.1).add(new Vector3(0, -0.65, 0));
    const vertices = [base, middle.clone().addScaledVector(side, 0.42), middle.clone().add(new Vector3(0, 0.12, 0)), middle.clone().addScaledVector(side, -0.42), end];
    parts.push({ ...part("棕榈叶", "mesh", index % 2 ? "#607952" : "#748b5e", [0, 0, 0], [1, 1, 1]), vertices: vertices.map(point => ({ x: point.x, y: point.y, z: point.z })), indices: [0, 1, 2, 0, 2, 3, 1, 4, 2, 2, 4, 3, 2, 1, 0, 3, 2, 0, 2, 4, 1, 3, 4, 2] });
  }
  return asset("brushPalm", "棕榈", "自然", parts);
}

function deadTree() {
  const parts = [branch([0, 0, 0], [0.15, 6.5, 0], 0.24, "#8b8170")];
  for (let index = 0; index < 6; index++) {
    const angle = index * 2.3;
    const start = [0, 2.1 + index * 0.56, 0];
    const end = [Math.cos(angle) * (1.5 - index * 0.1), 3.8 + index * 0.42, Math.sin(angle) * 1.2];
    parts.push(branch(start, end, 0.1, "#8b8170"));
    parts.push(branch(end, [end[0]! * 1.2, end[1]! + 0.95, end[2]! * 1.12], 0.045, "#8b8170"));
  }
  return asset("brushDeadTree", "枯树", "自然", parts);
}

const treeBrushDefinitions: SceneAsset[] = [
  leafyTree("brushBroadleaf", "阔叶树", ["#6f8861", "#839a6d", "#607d55"], 7.4, 4.6),
  spruceTree(),
  birchTree(),
  palmTree(),
  leafyTree("brushCherry", "山樱", ["#ddb4b9", "#e8c7c9", "#cf9ba7"], 6.1, 4.7),
  deadTree(),
  leafyTree("brushMaple", "红枫", ["#a65d46", "#bf7450", "#954c3d"], 6.7, 4.2),
];

const treeModels = new Map(treeBrushDefinitions.map(asset => [asset.id, asset.model!]));
export const treeBrushAssets: SceneAsset[] = treeBrushDefinitions.map(({ model, ...asset }) => ({
  ...asset, recipe: { sourceId: asset.id, variant: 0, state: "原始", revision: 1 },
}));

export function resolveBrushTree(asset: SceneAsset) {
  const recipe = asset.recipe;
  if (recipe?.sourceId === asset.id && recipe.variant === 0 && recipe.state === "原始" && recipe.revision === 1) return treeModels.get(asset.id);
}

function pathFrames(points: Vector3Value[]) {
  const closed = Math.hypot(points[0]!.x - points.at(-1)!.x, points[0]!.y - points.at(-1)!.y, points[0]!.z - points.at(-1)!.z) < 0.00001;
  return points.map((point, index) => {
    const previous = points[index ? index - 1 : closed ? points.length - 2 : 0]!;
    const next = points[index === points.length - 1 ? closed ? 1 : index : index + 1]!;
    const before = new Vector3(point.x - previous.x, 0, point.z - previous.z).normalize();
    const after = new Vector3(next.x - point.x, 0, next.z - point.z).normalize();
    if (!index && !closed) before.copy(after);
    if (index === points.length - 1 && !closed) after.copy(before);
    const normal = new Vector3(-before.z - after.z, 0, before.x + after.x);
    if (normal.lengthSq() < 0.000001) normal.set(-after.z, 0, after.x);
    normal.normalize();
    const divisor = Math.abs(normal.dot(new Vector3(-after.z, 0, after.x)));
    // ACT: 最多64个截面，miter限制为半宽的2倍，尖锐回折不产生无限延伸。
    return normal.multiplyScalar(Math.min(2, 1 / Math.max(0.01, divisor)));
  });
}

function ribbon(name: string, points: Vector3Value[], width: number, thickness: number, color: string, offset = 0, level = 0): BrushPart {
  const frames = pathFrames(points);
  const vertices: Vector3Value[] = [];
  const indices: number[] = [];
  points.forEach((point, index) => {
    const frame = frames[index]!;
    for (const y of [level, level + thickness]) for (const side of [1, -1]) vertices.push({ x: point.x + frame.x * (offset + side * width / 2), y: point.y + y, z: point.z + frame.z * (offset + side * width / 2) });
    if (!index) return;
    const a = (index - 1) * 4;
    const b = index * 4;
    indices.push(a, a + 1, b + 1, a, b + 1, b, a + 2, b + 3, a + 3, a + 2, b + 2, b + 3,
      a, b + 2, a + 2, a, b, b + 2, a + 1, a + 3, b + 3, a + 1, b + 3, b + 1);
  });
  const end = vertices.length - 4;
  if (Math.hypot(points[0]!.x - points.at(-1)!.x, points[0]!.y - points.at(-1)!.y, points[0]!.z - points.at(-1)!.z) >= 0.00001) indices.push(0, 2, 3, 0, 3, 1, end, end + 1, end + 3, end, end + 3, end + 2);
  const faces: number[] = [];
  for (let index = 0; index < indices.length; index += 3) {
    const a = vertices[indices[index]!]!;
    const b = vertices[indices[index + 1]!]!;
    const c = vertices[indices[index + 2]!]!;
    const ab = new Vector3(b.x - a.x, b.y - a.y, b.z - a.z);
    const ac = new Vector3(c.x - a.x, c.y - a.y, c.z - a.z);
    if (ab.cross(ac).lengthSq() >= 1e-16) faces.push(indices[index]!, indices[index + 1]!, indices[index + 2]!);
  }
  return { ...part(name, "mesh", color, [0, 0, 0], [1, 1, 1]), vertices, indices: faces };
}

function pathSampler(points: Vector3Value[]) {
  const distances = [0];
  for (let index = 1; index < points.length; index++) distances.push(distances[index - 1]! + Math.hypot(points[index]!.x - points[index - 1]!.x, points[index]!.z - points[index - 1]!.z));
  const length = distances.at(-1)!;
  const at = (distance: number) => {
    let index = 1;
    while (index < distances.length - 1 && distances[index]! < distance) index++;
    const a = points[index - 1]!;
    const b = points[index]!;
    const amount = Math.max(0, Math.min(1, (distance - distances[index - 1]!) / (distances[index]! - distances[index - 1]!)));
    return { x: a.x + (b.x - a.x) * amount, y: a.y + (b.y - a.y) * amount, z: a.z + (b.z - a.z) * amount, yaw: -Math.atan2(b.z - a.z, b.x - a.x) * 180 / Math.PI };
  };
  return { length, at, between: (start: number, end: number) => [at(start), ...points.filter((_point, index) => distances[index]! > start && distances[index]! < end), at(end)] };
}

function pathPart(sample: ReturnType<typeof pathSampler>, distance: number, name: string, shape: BrushPart["shape"], color: string, scale: number[], side = 0, level = 0, turn = 0) {
  const point = sample.at(distance);
  const yaw = point.yaw * Math.PI / 180;
  return part(name, shape, color, [point.x + Math.sin(yaw) * side, point.y + level, point.z + Math.cos(yaw) * side], scale, [0, point.yaw + turn, 0]);
}

function brace(name: string, start: number[], end: number[], width: number, color: string): BrushPart | undefined {
  const a = new Vector3(...start as [number, number, number]);
  const b = new Vector3(...end as [number, number, number]);
  if (a.distanceToSquared(b) < 1e-10) return;
  const direction = b.clone().sub(a).normalize();
  const side = new Vector3(-direction.z, 0, direction.x);
  if (side.lengthSq() < 1e-10) side.set(1, 0, 0);
  side.normalize().multiplyScalar(width / 2);
  const up = new Vector3().crossVectors(direction, side).normalize().multiplyScalar(width / 2);
  const vertices = [a, b].flatMap(point => [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([x, y]) => {
    const vertex = point.clone().addScaledVector(side, x!).addScaledVector(up, y!);
    return { x: vertex.x, y: vertex.y, z: vertex.z };
  }));
  return { ...part(name, "mesh", color, [0, 0, 0], [1, 1, 1]), vertices, indices: [0, 2, 1, 0, 3, 2, 4, 5, 6, 4, 6, 7, 0, 1, 5, 0, 5, 4, 1, 2, 6, 1, 6, 5, 2, 3, 7, 2, 7, 6, 3, 0, 4, 3, 4, 7] };
}

function archPart(sample: ReturnType<typeof pathSampler>, distance: number, span: number, height: number, depth: number, color: string, pointed = false): BrushPart {
  const radius = span / 2;
  const profile = pointed ? [[-1, 0], [-1, 0.45], [-0.55, 0.78], [0, 1], [0.55, 0.78], [1, 0.45], [1, 0], [0.73, 0], [0.73, 0.4], [0.4, 0.66], [0, 0.85], [-0.4, 0.66], [-0.73, 0.4], [-0.73, 0]] : [
    [-1, 0], ...Array.from({ length: 9 }, (_, index) => [Math.cos(Math.PI - index * Math.PI / 8), 0.48 + Math.sin(index * Math.PI / 8) * 0.52]), [1, 0], [0.73, 0],
    ...Array.from({ length: 9 }, (_, index) => [Math.cos(index * Math.PI / 8) * 0.73, 0.48 + Math.sin(index * Math.PI / 8) * 0.36]), [-0.73, 0],
  ];
  return { ...pathPart(sample, distance, pointed ? "尖拱窗框" : "圆拱廊框", "extrude", color, [1, 1, 1]), depth, profile: profile.map(([x, y]) => ({ x: x! * radius, y: y! * height })) };
}

function crystalPart(sample: ReturnType<typeof pathSampler>, distance: number, width: number, height: number, color: string, side = 0, level = 0): BrushPart {
  const vertices = [{ x: 0, y: 0, z: 0 }, ...Array.from({ length: 6 }, (_, index) => ({ x: Math.cos(index * Math.PI / 3) * width / 2, y: height * 0.28, z: Math.sin(index * Math.PI / 3) * width / 2 })), { x: 0, y: height, z: 0 }];
  const indices = Array.from({ length: 6 }, (_, index) => [0, index + 1, (index + 1) % 6 + 1, index + 1, 7, (index + 1) % 6 + 1]).flat();
  return { ...pathPart(sample, distance, "多面棱晶", "mesh", color, [1, 1, 1], side, level), vertices, indices, roughness: 0.23, metalness: 0.2 };
}

function luminous(item: BrushPart, color: string, intensity = 1.1): BrushPart {
  return { ...item, emissive: color, emissiveIntensity: intensity };
}

function floorTile(sample: ReturnType<typeof pathSampler>, distance: number, name: string, profile: { x: number; y: number }[], color: string, thickness: number, side: number, level: number, turn = 0): BrushPart {
  const item = pathPart(sample, distance, name, "extrude", color, [1, 1, 1], side, level, turn);
  // XYZ 欧拉先在轮廓平面转向，再绕 X 放平；直接叠加 Y 偏航会把铺石翘起来。
  item.rotation = { x: -90, y: 0, z: item.rotation.y };
  return { ...item, depth: thickness, profile };
}

function makeThemeWall(style: string, points: Vector3Value[], width: number, height: number): BrushPart[] | undefined {
  const sample = pathSampler(points);
  const parts: BrushPart[] = [];
  if (["palace", "whiteTile", "japaneseEarth", "japaneseWood"].includes(style)) {
    const wood = style === "japaneseWood";
    const color = style === "palace" ? "#a34e3e" : style === "japaneseEarth" ? "#c1ad88" : "#e0dfca";
    if (!wood) parts.push(ribbon("连续传统墙身", points, width, height * 0.88, color), ribbon("石砌墙脚", points, width + 0.06, height * 0.12, "#919789"));
    const roof = style === "palace" ? "#b0a16a" : style === "whiteTile" ? "#556761" : "#665d49";
    parts.push(ribbon("出挑瓦檐", points, width + 0.2, height * 0.045, roof, 0, height * 0.88), ribbon("屋脊压顶", points, width * 0.45, height * 0.06, roof, 0, height * 0.94));
    if (style === "whiteTile" || style === "palace") for (const side of [-1, 1]) parts.push(ribbon("双坡瓦面", points, width * 0.5 + 0.08, height * 0.035, roof, side * width * 0.27, height * 0.91));
    const count = Math.min(wood ? 58 : 28, Math.max(2, Math.ceil(sample.length / (wood ? 0.12 : 0.3))));
    for (let index = 0; index < count; index++) {
      const distance = (index + 0.5) / count * sample.length;
      if (wood) parts.push(pathPart(sample, distance, "日式错层竖格", "box", index % 2 ? "#7b654c" : "#9a8060", [Math.min(0.065, sample.length / count * 0.55), height * 0.87, width * 0.4], index % 2 ? width * 0.22 : -width * 0.22, height * 0.435));
      else if (style !== "japaneseEarth") {
        const tile = pathPart(sample, distance, "圆筒檐瓦", "cylinder", roof, [Math.min(0.14, sample.length / count * 0.7), width + 0.16, 0.08], 0, height * 0.925);
        tile.rotation = { x: 90, y: 0, z: -tile.rotation.y };
        parts.push(tile);
      }
    }
    if (style === "japaneseEarth" || wood) {
      const posts = Math.min(18, Math.max(1, Math.ceil(sample.length / 1.6)));
      for (let index = 0; index <= posts; index++) parts.push(pathPart(sample, index / posts * sample.length, "外露木构立柱", "box", "#6f614d", [0.13, height * 0.95, width + 0.035], 0, height * 0.475));
      parts.push(ribbon("木构下横枋", points, width + 0.015, height * 0.06, "#79664e", 0, height * 0.18));
    }
    return parts;
  }
  if (["roman", "gothic", "european", "fortress"].includes(style)) {
    const color = style === "gothic" ? "#9ca69b" : style === "fortress" ? "#969b88" : "#d2cfb8";
    parts.push(ribbon("连续石栏基座", points, width * 1.12, height * 0.12, color));
    if (style === "fortress") {
      parts.push(ribbon("厚重堡垒墙身", points, width, height * 0.9, "#9fa28e"), ribbon("堡垒上檐", points, width * 1.18, height * 0.07, "#bac0a6", 0, height * 0.88));
      const count = Math.min(18, Math.max(1, Math.ceil(sample.length / 2)));
      for (let index = 0; index <= count; index++) parts.push({ ...pathPart(sample, index / count * sample.length, "外倾石扶壁", "extrude", color, [1, 1, 1]), depth: width * 1.65, profile: [{ x: -0.24, y: 0 }, { x: 0.24, y: 0 }, { x: 0.14, y: height * 0.84 }, { x: -0.14, y: height * 0.84 }] });
      for (let row = 1; row < 5; row++) parts.push(ribbon("堡垒分层石缝", points, width + 0.006, 0.014, "#77816e", 0, height * row / 5));
      return parts;
    }
    parts.push(ribbon("连续上石梁", points, width * 1.08, height * 0.08, color, 0, height * 0.92));
    const count = Math.min(style === "european" ? 32 : 14, Math.max(1, Math.ceil(sample.length / (style === "european" ? 0.4 : 1.5))));
    if (style === "european") {
      for (let index = 0; index < count; index++) parts.push({ ...pathPart(sample, (index + 0.5) / count * sample.length, "欧式瓶形石栏柱", "lathe", color, [1, 1, 1], 0, height * 0.12), profile: [{ x: width * 0.4, y: 0 }, { x: width * 0.4, y: height * 0.07 }, { x: width * 0.23, y: height * 0.12 }, { x: width * 0.44, y: height * 0.3 }, { x: width * 0.3, y: height * 0.48 }, { x: width * 0.17, y: height * 0.65 }, { x: width * 0.35, y: height * 0.73 }, { x: width * 0.35, y: height * 0.8 }] });
    } else {
      for (let index = 0; index < count; index++) parts.push(archPart(sample, (index + 0.5) / count * sample.length, Math.min(1.45, sample.length / count * 0.94), height * 0.9, width * 0.65, color, style === "gothic"));
      for (let index = 0; index <= count; index++) {
        const distance = index / count * sample.length;
        parts.push(pathPart(sample, distance, style === "roman" ? "罗马柱身" : "哥特扶柱", style === "roman" ? "cylinder" : "box", color, [width * 0.9, height * 0.9, width * 0.9], 0, height * 0.48));
        parts.push(pathPart(sample, distance, "柱头与檐托", "box", "#b8bea9", [width * 1.35, height * 0.08, width * 1.35], 0, height * 0.88));
        if (style === "gothic") parts.push(pathPart(sample, distance, "哥特尖塔饰", "cone", "#798c80", [width * 0.85, height * 0.2, width * 0.85], 0, height * 1.05));
      }
    }
    return parts;
  }
  if (style === "glass" || style === "industrial") {
    const industrial = style === "industrial";
    parts.push(ribbon("金属底座", points, width, height * 0.08, "#7f9290"), ribbon("金属上框", points, width * 0.6, height * 0.035, "#9fadaa", 0, height * 0.96));
    const panel = ribbon(industrial ? "连续压型钢板" : "连续玻璃面板", points, industrial ? width * 0.6 : Math.min(0.04, width * 0.25), height * 0.8, industrial ? "#7f8c83" : "#b4d8d2", 0, height * 0.1);
    parts.push(industrial ? { ...panel, metalness: 0.65, roughness: 0.48 } : { ...panel, opacity: 0.3, roughness: 0.14, metalness: 0.08 });
    const count = Math.min(18, Math.max(1, Math.ceil(sample.length / 1.8)));
    for (let index = 0; index <= count; index++) parts.push(pathPart(sample, index / count * sample.length, "钢构立框", "box", "#607872", [0.08, height, width], 0, height / 2));
    if (industrial) for (let index = 0; index < count; index++) {
      const a = sample.at(index / count * sample.length);
      const b = sample.at((index + 1) / count * sample.length);
      const diagonal = brace("钢构斜撑", [a.x, a.y + height * 0.12, a.z], [b.x, b.y + height * 0.88, b.z], 0.07, "#afb39d");
      if (diagonal) parts.push(diagonal);
      for (const fraction of [0.18, 0.78]) parts.push(pathPart(sample, (index + fraction) / count * sample.length, "钢板加劲肋", "box", "#5d746a", [0.045, height * 0.8, width * 0.85], 0, height / 2));
    }
    return parts;
  }
  if (["elf", "runic", "crystal", "dark"].includes(style)) {
    const color = style === "dark" ? "#434c50" : style === "runic" ? "#87968a" : "#a6b9a0";
    parts.push(ribbon("连续奇幻基座", points, width * 1.1, height * 0.14, color));
    const count = Math.min(18, Math.max(2, Math.ceil(sample.length / (style === "crystal" ? 0.65 : 1.25))));
    if (style === "runic" || style === "dark") parts.push(ribbon("连续石墙身", points, width, height * 0.68, color), ribbon("墙身悬挑线脚", points, width * 1.15, height * 0.06, style === "dark" ? "#687779" : "#b7bca5", 0, height * 0.64));
    if (style === "elf") for (const fraction of [0.22, 0.82]) parts.push(ribbon("精灵藤纹横枝", points, width * 0.28, height * 0.025, "#b6b68a", 0, height * fraction));
    for (let index = 0; index < count; index++) {
      const distance = (index + 0.5) / count * sample.length;
      if (style === "crystal") {
        parts.push(crystalPart(sample, distance, width * 0.8, height * (0.68 + index % 3 * 0.12), index % 2 ? "#88bfbd" : "#a5a6cf", 0, height * 0.12));
        parts.push(crystalPart(sample, distance, width * 0.5, height * 0.48, "#bccfc2", width * (index % 2 ? 0.3 : -0.3), height * 0.08));
      } else if (style === "runic") {
        parts.push(pathPart(sample, distance, "符文立石", "box", "#a6b4a2", [Math.min(0.42, sample.length / count * 0.7), height * 0.85, width * 1.08], 0, height * 0.5));
        parts.push({ ...pathPart(sample, distance, "石壁立体符文", "extrude", "#bed6bd", [1, 1, 1], width * 0.55, height * 0.36), depth: 0.013, profile: [{ x: -0.09, y: 0 }, { x: -0.035, y: 0 }, { x: -0.035, y: height * 0.14 }, { x: 0.085, y: height * 0.23 }, { x: 0.05, y: height * 0.26 }, { x: -0.035, y: height * 0.2 }, { x: -0.035, y: height * 0.31 }, { x: -0.09, y: height * 0.31 }] });
      } else if (style === "dark") {
        parts.push(crystalPart(sample, distance, width * 0.75, height * 0.4, "#5f6b70", 0, height * 0.66));
        const stud = pathPart(sample, distance, "暗黑墙面菱形铆饰", "box", "#9f8a74", [0.12, 0.12, 0.045], width * 0.52, height * 0.42);
        stud.rotation.z = 45;
        parts.push(stud);
      } else {
        const vine = pathPart(sample, distance, "弯曲精灵藤柱", "tube", "#8fae91", [1, 1, 1]);
        const reach = Math.min(0.35, sample.length / count * 0.3);
        vine.path = [{ x: -reach, y: height * 0.14, z: 0 }, { x: reach * 0.7, y: height * 0.35, z: width * 0.1 }, { x: -reach * 0.65, y: height * 0.64, z: -width * 0.1 }, { x: reach, y: height * 0.94, z: 0 }];
        vine.radius = Math.min(0.035, width * 0.2);
        parts.push(vine, { ...pathPart(sample, distance, "精灵叶形镂饰", "extrude", "#c1c39c", [1, 1, 1], 0, height * 0.3), depth: width * 0.2, profile: [{ x: 0, y: 0 }, { x: -reach * 0.72, y: height * 0.2 }, { x: 0, y: height * 0.55 }, { x: reach * 0.72, y: height * 0.2 }] });
      }
    }
    return parts;
  }
  if (["energy", "mechanical", "future", "laser"].includes(style)) {
    parts.push(ribbon("连续科技基轨", points, width * 1.1, height * 0.12, "#627b79"));
    const count = Math.min(18, Math.max(1, Math.ceil(sample.length / 1.6)));
    if (style === "mechanical") {
      parts.push(ribbon("装甲内墙", points, width * 0.7, height * 0.82, "#677572"));
      for (const fraction of [0.18, 0.75, 0.91]) parts.push(ribbon("连续机械管线", points, width * 1.05, height * 0.035, "#a6b4ab", 0, height * fraction));
      for (let index = 0; index < count; index++) {
        const distance = (index + 0.5) / count * sample.length;
        const span = Math.min(0.7, sample.length / count * 0.8);
        parts.push({ ...pathPart(sample, distance, "六边装甲面板", "extrude", "#8b9b90", [1, 1, 1], width * 0.4, height * 0.14), depth: width * 0.25, profile: [{ x: -span / 2, y: height * 0.1 }, { x: -span * 0.3, y: 0 }, { x: span * 0.3, y: 0 }, { x: span / 2, y: height * 0.1 }, { x: span / 2, y: height * 0.62 }, { x: -span / 2, y: height * 0.62 }] });
        parts.push(pathPart(sample, distance, "机械转轴", "torus", "#bcc4b2", [width * 0.5, width * 0.5, 0.06], width * 0.58, height * 0.5));
        parts.push(luminous(pathPart(sample, distance, "设备状态灯", "box", "#a7d9c2", [0.1, height * 0.04, 0.015], width * 0.55, height * 0.72), "#6ccfac", 0.8));
      }
    } else {
      for (let index = 0; index <= count; index++) {
        const distance = index / count * sample.length;
        parts.push(pathPart(sample, distance, "科技立柱", "box", style === "future" ? "#d0d7c9" : "#657b7a", [Math.max(0.1, width * 0.9), height, width], 0, height / 2));
        parts.push(luminous(pathPart(sample, distance, "立柱能量芯", "box", "#b5e4d7", [0.035, height * 0.22, 0.014], width * 0.51, height * 0.68), style === "laser" ? "#c59be4" : "#83d3c4", 1.3));
      }
      if (style === "future") {
        for (const fraction of [0.38, 0.7]) parts.push(ribbon("悬浮式护栏板", points, width * 0.55, height * 0.1, "#c3d0c1", 0, height * fraction));
        parts.push(luminous(ribbon("悬浮板嵌入光带", points, width * 0.57, height * 0.012, "#b0dfd0", 0, height * 0.74), "#83d3c4", 1));
      } else {
        for (const fraction of style === "energy" ? [0.25, 0.43, 0.61, 0.79] : [0.3, 0.82]) parts.push(luminous(ribbon(style === "energy" ? "能量栅格光束" : "光导纤维束", points, Math.min(0.035, width * 0.2), height * 0.012, style === "energy" ? "#9bdfd8" : "#d2a8e5", 0, height * fraction), style === "energy" ? "#68cfc7" : "#b485dc", 1.3));
        if (style === "energy") parts.push(ribbon("能量栅顶框", points, width * 0.7, height * 0.05, "#95aaa2", 0, height * 0.94));
        else for (let index = 0; index < count; index++) {
          const a = sample.at(index / count * sample.length);
          const b = sample.at((index + 1) / count * sample.length);
          const diagonal = brace("交叉光导束", [a.x, a.y + height * (index % 2 ? 0.3 : 0.82), a.z], [b.x, b.y + height * (index % 2 ? 0.82 : 0.3), b.z], 0.018, "#d1a7e4");
          if (diagonal) parts.push(luminous(diagonal, "#b485dc", 1.1));
        }
      }
    }
    return parts;
  }
}

function makeWall(style: string, points: Vector3Value[], width: number, height: number): BrushPart[] {
  const themed = makeThemeWall(style, points, width, height);
  if (themed) return themed;
  const sample = pathSampler(points);
  // ACT: 连续墙身与横梁保留全部截面；只限制装饰的全程采样密度，不截断主体，最多117个部件。
  const parts: BrushPart[] = [];
  const masonry: Record<string, { colors: string[]; rows: number; mortar: string }> = {
    brick: { colors: ["#ad806b", "#b98b76", "#a57865", "#b18470"], rows: 6, mortar: "#c7b9a2" },
    redBrick: { colors: ["#a35e49", "#b66b50", "#98553e", "#ae6247"], rows: 8, mortar: "#c6b598" },
    dryStone: { colors: ["#9a9789", "#a8a395", "#918f83", "#aaa697"], rows: 5, mortar: "#706f66" },
    ashlar: { colors: ["#aaa89a", "#b9b5a5", "#a5a395"], rows: 4, mortar: "#777b72" },
    rubble: { colors: ["#8b8b7a", "#a7a48b", "#93947f", "#aaa895"], rows: 3, mortar: "#646c60" },
  };
  const stone = masonry[style];
  if (stone) {
    for (let row = 0; row < stone.rows; row++) parts.push(ribbon("连续砌筑层", points, width * (style === "rubble" ? 0.86 + row % 2 * 0.14 : style === "dryStone" && row % 2 ? 0.96 : 1), height / stone.rows - 0.012, stone.colors[row % stone.colors.length]!, 0, row * height / stone.rows));
    const count = Math.min(Math.floor(68 / stone.rows), Math.max(2, Math.ceil(sample.length / (style === "redBrick" ? 0.45 : 0.9))));
    for (let index = 1; index < count; index++) for (let row = 0; row < stone.rows; row++) parts.push(pathPart(sample, (index + row % 2 * 0.45) / count * sample.length, "交错砌缝", "box", stone.mortar, [0.015, height / stone.rows - 0.015, width + 0.006], 0, (row + 0.5) * height / stone.rows));
    if (style !== "rubble") parts.push(ribbon("墙顶压顶", points, width + 0.06, style === "redBrick" ? 0.12 : 0.07, style === "redBrick" ? "#904d3d" : "#b8ae99", 0, height));
    return parts;
  }
  if (["stucco", "concrete", "panelConcrete", "rammedEarth"].includes(style)) {
    const color = { stucco: "#ddd8c4", concrete: "#a8aaa4", panelConcrete: "#afb2a8", rammedEarth: "#bc9670" }[style]!;
    const layers = style === "rammedEarth" ? 6 : 1;
    for (let row = 0; row < layers; row++) parts.push(ribbon("连续实墙", points, width * (1 - row / layers * (style === "rammedEarth" ? 0.12 : 0)), height / layers - (layers > 1 ? 0.004 : 0), style === "rammedEarth" && row % 2 ? "#ae8864" : color, 0, row * height / layers));
    parts.push(ribbon("墙脚基座", points, width + 0.06, height * 0.12, style === "stucco" ? "#9b9c91" : "#8e938a"));
    parts.push(ribbon("连续墙帽", points, width + 0.08, 0.06, style === "stucco" ? "#9d9f91" : color, 0, height));
    const count = Math.min(20, Math.max(1, Math.ceil(sample.length / (style === "panelConcrete" ? 2 : 2.8))));
    if (style === "panelConcrete") {
      for (let index = 0; index <= count; index++) parts.push(pathPart(sample, index / count * sample.length, "预制板立柱", "box", "#939b91", [0.15, height + 0.08, width + 0.12], 0, height / 2));
      for (let row = 1; row < 4; row++) parts.push(ribbon("预制板水平槽", points, width + 0.006, 0.012, "#7d857b", 0, height * row / 4));
    } else if (style === "concrete") {
      for (let index = 1; index < count; index++) parts.push(pathPart(sample, index / count * sample.length, "混凝土伸缩缝", "box", "#80877e", [0.018, height, width + 0.005], 0, height / 2));
      for (let index = 0; index < Math.min(16, count); index++) for (const side of [-1, 1]) parts.push(pathPart(sample, (index + 0.5) / Math.min(16, count) * sample.length, "模板对拉孔", "box", "#7d847b", [0.035, 0.035, 0.004], side * (width / 2 + 0.003), height * 0.6));
    }
    return parts;
  }
  if (style === "castle") {
    parts.push(ribbon("古城墙脚", points, width * 1.15, height * 0.13, "#81867b"), ribbon("连续城墙", points, width, height * 0.75, "#a0a18f"), ribbon("城墙檐线", points, width * 1.08, height * 0.06, "#8c917e", 0, height * 0.69));
    for (let row = 1; row < 5; row++) parts.push(ribbon("城墙石缝", points, width + 0.004, 0.012, "#767e70", 0, height * 0.14 * row));
    const count = Math.min(32, Math.max(2, Math.ceil(sample.length / 1.2)));
    for (let index = 0; index < count; index++) parts.push(pathPart(sample, (index + 0.5) / count * sample.length, "城墙垛口", "box", index % 2 ? "#a5a795" : "#979d89", [Math.min(0.8, sample.length / count * 0.58), height * 0.25, width], 0, height * 0.875));
    return parts;
  }
  if (style === "chinese") {
    parts.push(ribbon("园林墙裙", points, width, height * 0.3, "#d9d6c4"), ribbon("花窗上墙", points, width, height * 0.18, "#dddac9", 0, height * 0.82), ribbon("深色瓦檐", points, width + 0.12, 0.07, "#66736c", 0, height));
    const count = Math.min(16, Math.max(1, Math.ceil(sample.length / 1.6)));
    for (let index = 0; index <= count; index++) parts.push(pathPart(sample, index / count * sample.length, "花窗墙柱", "box", "#d9d6c4", [0.22, height, width], 0, height / 2));
    for (let index = 0; index < count; index++) {
      const distance = (index + 0.5) / count * sample.length;
      parts.push(pathPart(sample, distance, "花窗水平格", "box", "#7c8a7a", [Math.min(0.65, sample.length / count * 0.5), 0.035, width * 0.55], 0, height * 0.56));
      parts.push(pathPart(sample, distance, "花窗竖格", "box", "#7c8a7a", [0.035, height * 0.44, width * 0.55], 0, height * 0.56));
      const a = sample.at(distance - Math.min(0.3, sample.length / count * 0.22));
      const b = sample.at(distance + Math.min(0.3, sample.length / count * 0.22));
      for (const direction of [-1, 1]) {
        const diagonal = brace("菱形花窗斜格", [a.x, a.y + height * (direction < 0 ? 0.34 : 0.78), a.z], [b.x, b.y + height * (direction < 0 ? 0.78 : 0.34), b.z], Math.min(0.04, width * 0.24), "#7c8a7a");
        if (diagonal) parts.push(diagonal);
      }
    }
    return parts;
  }
  if (style === "gabion") {
    parts.push(ribbon("石笼填料", points, width, height, "#8b8e85"));
    for (const side of [-1, 1]) for (let row = 0; row < 5; row++) parts.push(ribbon("石笼横网", points, 0.018, 0.018, "#555f5a", side * width / 2, height * row / 4));
    const count = Math.min(36, Math.max(2, Math.ceil(sample.length / 0.3)));
    for (let index = 0; index <= count; index++) parts.push(pathPart(sample, index / count * sample.length, "石笼竖网", "box", "#555f5a", [0.018, height, width + 0.025], 0, height / 2));
    for (let index = 0; index < 16; index++) parts.push(pathPart(sample, (index + 0.5) / 16 * sample.length, "石笼外露块石", "sphere", index % 2 ? "#aaa99a" : "#727d73", [Math.min(0.24, width * 0.6), height * 0.17, 0.07], index % 2 ? width / 2 : -width / 2, height * (0.18 + index % 4 * 0.18)));
    return parts;
  }
  if (style === "guardrail") {
    for (const fraction of [0.48, 0.71]) parts.push(ribbon("护栏波形面", points, width, height * 0.18, "#b2bbb5", 0, height * fraction));
    parts.push(ribbon("护栏凹槽", points, width * 0.58, height * 0.09, "#909c96", 0, height * 0.66));
    const count = Math.min(28, Math.max(1, Math.ceil(sample.length / 1.8)));
    for (let index = 0; index <= count; index++) {
      parts.push(pathPart(sample, index / count * sample.length, "护栏支柱", "box", "#87968e", [0.11, height, 0.11], -width * 0.35, height / 2));
      parts.push(pathPart(sample, index / count * sample.length, "护栏反光片", "box", "#dfc57c", [0.06, 0.055, 0.012], width / 2 + 0.006, height * 0.76));
    }
    return parts;
  }
  if (style === "bollards") {
    const count = Math.min(38, Math.max(1, Math.ceil(sample.length / 1.15)));
    for (let index = 0; index <= count; index++) {
      const distance = index / count * sample.length;
      parts.push(pathPart(sample, distance, "隔离柱基座", "cylinder", "#8f9b94", [width * 1.45, 0.06, width * 1.45], 0, 0.03));
      parts.push(pathPart(sample, distance, "道路隔离柱", "cylinder", "#536761", [width, height, width], 0, height / 2));
      parts.push(pathPart(sample, distance, "隔离柱反光环", "cylinder", "#d5d3b0", [width * 1.015, height * 0.1, width * 1.015], 0, height * 0.8));
    }
    return parts;
  }
  const metal = ["iron", "palisade", "chainLink"].includes(style);
  const color = metal ? "#536760" : style === "bamboo" ? "#b0ac76" : style === "picket" ? "#d6d0b7" : "#a08b6c";
  const postCount = Math.min(18, Math.max(1, Math.ceil(sample.length / 1.8)));
  for (const fraction of style === "ranch" ? [0.2, 0.53, 0.86] : style === "chainLink" ? [0.08, 0.96] : [0.24, 0.77]) parts.push(ribbon("连续横梁", points, width * 0.6, Math.min(0.09, height * 0.07), color, 0, height * fraction));
  for (let index = 0; index <= postCount; index++) parts.push(pathPart(sample, index / postCount * sample.length, "围栏立柱", style === "bamboo" || metal ? "cylinder" : "box", color, [Math.max(0.09, width), height * 1.04, Math.max(0.09, width)], 0, height * 0.52));
  if (style === "ranch") return parts;
  if (style === "crossRail" || style === "chainLink") {
    const count = style === "crossRail" ? postCount : Math.min(34, Math.max(2, Math.ceil(sample.length / 0.4)));
    for (let index = 0; index < count; index++) {
      const a = sample.at(index / count * sample.length);
      const b = sample.at((index + 1) / count * sample.length);
      for (const direction of [-1, 1]) {
        const diagonal = brace(style === "chainLink" ? "交织金属网" : "交叉木撑", [a.x, a.y + height * (direction < 0 ? 0.2 : 0.85), a.z], [b.x, b.y + height * (direction < 0 ? 0.85 : 0.2), b.z], style === "chainLink" ? 0.014 : Math.min(width * 0.42, 0.07), color);
        if (diagonal) parts.push(diagonal);
      }
    }
    return parts;
  }
  const count = Math.min(style === "iron" || style === "palisade" ? 42 : 70, Math.max(2, Math.ceil(sample.length / (metal ? 0.19 : style === "bamboo" ? 0.09 : 0.2))));
  for (let index = 0; index < count; index++) {
    const distance = (index + 0.5) / count * sample.length;
    if (style === "picket") {
      parts.push({ ...pathPart(sample, distance, "尖顶木栅板", "extrude", color, [1, 1, 1], 0, 0), depth: Math.max(0.035, width * 0.4), profile: [{ x: -Math.min(0.075, sample.length / count * 0.37), y: 0 }, { x: Math.min(0.075, sample.length / count * 0.37), y: 0 }, { x: Math.min(0.075, sample.length / count * 0.37), y: height * 0.86 }, { x: 0, y: height }, { x: -Math.min(0.075, sample.length / count * 0.37), y: height * 0.86 }] });
    } else {
      const bamboo = style === "bamboo";
      const slatHeight = height * (bamboo ? 0.9 + Math.sin(index * 2.3) * 0.07 : 1);
      parts.push(pathPart(sample, distance, bamboo ? "竹竿" : metal ? "金属竖杆" : "紧密木围板", bamboo || metal ? "cylinder" : "box", color, bamboo ? [Math.min(0.075, width * 0.62), slatHeight, Math.min(0.075, width * 0.62)] : metal ? [style === "palisade" ? 0.065 : 0.03, height, 0.035] : [Math.min(0.22, sample.length / count * 0.96), height, Math.max(0.035, width * 0.4)], 0, slatHeight / 2));
      if (metal) parts.push(pathPart(sample, distance, "栏杆尖饰", "cone", color, [style === "palisade" ? 0.09 : 0.065, height * 0.09, 0.065], 0, height * 1.045));
    }
  }
  return parts;
}

function makeThemePaving(style: string, points: Vector3Value[], width: number, height: number): BrushPart[] | undefined {
  const colors: Record<string, string> = { palaceBrick: "#6d7b74", courtyard: "#9b9d8a", japaneseSand: "#c9c7aa", tatamiStone: "#8f9a8c", romanRoad: "#a3a18d", mosaic: "#ada38a", europeanFan: "#939a8b", marble: "#d0d0bc", concreteSlab: "#b2baac", steelPlate: "#657b78", grating: "#455e5b", rubber: "#a46c58", runeStone: "#7d8c80", crystalPath: "#7f9f9b", darkCauseway: "#454e56", elfPath: "#a0b19a", hexTech: "#546d6c", lightRail: "#677d7a", circuit: "#536c6a" };
  if (!colors[style]) return;
  const sample = pathSampler(points);
  const parts = [ribbon("连续主题铺装基面", points, width, height * (style === "grating" ? 0.3 : 1), colors[style]!)];
  const count = Math.min(14, Math.max(2, Math.ceil(sample.length / 0.8)));
  if (style === "palaceBrick" || style === "courtyard" || style === "tatamiStone" || style === "romanRoad") {
    const rows = style === "palaceBrick" ? 4 : style === "romanRoad" ? 4 : 2;
    for (let column = 0; column < count; column++) for (let row = 0; row < rows; row++) {
      const distance = (column + 0.5 + (style === "palaceBrick" ? row % 2 * 0.2 : 0)) / count * sample.length;
      const side = width * ((row + 0.5) / rows - 0.5);
      if (style === "courtyard") {
        for (const turn of [0, 90]) parts.push(pathPart(sample, distance, "院落十字拼砖", "box", column % 2 ? "#b6b5a0" : "#8d9a89", [Math.min(0.48, width * 0.3), 0.016, Math.min(0.14, width * 0.1)], side, height + 0.008, turn));
      } else parts.push(pathPart(sample, distance, style === "palaceBrick" ? "错缝宫廷青砖" : style === "tatamiStone" ? "日式长榻石" : "罗马路面块石", "box", style === "palaceBrick" ? ["#82918a", "#74847c"][column % 2]! : style === "tatamiStone" ? "#b5bca7" : ["#b7b5a1", "#999e89", "#c2bdab"][row % 3]!, [Math.min(style === "tatamiStone" ? 1.2 : 0.7, sample.length / count * 0.9), 0.02 + (style === "romanRoad" ? column % 3 * 0.008 : 0), width / rows * (style === "tatamiStone" ? 0.86 : 0.94)], side, height + 0.012, style === "tatamiStone" && column % 2 ? 3 : 0));
    }
    for (const side of [-1, 1]) parts.push(ribbon(style === "palaceBrick" ? "宫道金边压线" : "石道收边", points, width * (style === "palaceBrick" ? 0.035 : 0.06), 0.018, style === "palaceBrick" ? "#b5ad7f" : "#c3c4ad", side * width * 0.46, height));
    if (style === "romanRoad") for (let index = 0; index < count; index++) for (const side of [-1, 1]) parts.push(pathPart(sample, (index + 0.5) / count * sample.length, "罗马道路缘块石", "box", "#c2c4ae", [Math.min(0.6, sample.length / count * 0.84), 0.1, width * 0.07], side * width * 0.455, height + 0.035));
    return parts;
  }
  if (style === "japaneseSand") {
    for (let row = 0; row < 9; row++) parts.push(ribbon("枯山水细砂耙纹", points, Math.min(0.025, width * 0.018), 0.009, row % 2 ? "#b0b59a" : "#dedac0", width * (row / 10 - 0.4), height));
    for (let index = 0; index < Math.min(count, 10); index++) parts.push(pathPart(sample, (index + 0.5) / Math.min(count, 10) * sample.length, "枯山水景石", "sphere", index % 2 ? "#7e8e80" : "#9ca58f", [Math.min(0.36, width * 0.2), 0.12 + index % 3 * 0.045, Math.min(0.24, width * 0.16)], (index % 2 ? 1 : -1) * width * 0.36, height + 0.025));
    return parts;
  }
  if (style === "mosaic" || style === "europeanFan") {
    const columns = Math.min(style === "mosaic" ? 14 : 12, Math.max(2, Math.ceil(sample.length / 0.55)));
    for (let column = 0; column < columns; column++) for (let row = 0; row < (style === "mosaic" ? 6 : 2); row++) {
      const distance = (column + 0.5) / columns * sample.length;
      if (style === "mosaic") parts.push(pathPart(sample, distance, "马赛克菱形镶石", "box", ["#d2c6a7", "#879b91", "#b78d73", "#c0b993"][(column + row) % 4]!, [Math.min(0.18, width * 0.14), 0.016, Math.min(0.18, width * 0.14)], width * ((row + 0.5) / 6 - 0.5), height + 0.008, 45));
      else for (let wedge = 0; wedge < 4; wedge++) {
        const radius = Math.min(width * 0.24, 0.55);
        const a = wedge * Math.PI / 4 + 0.025;
        const b = (wedge + 1) * Math.PI / 4 - 0.025;
        parts.push(floorTile(sample, distance, "欧式扇形拼石", [{ x: 0, y: 0 }, { x: Math.cos(a) * radius, y: Math.sin(a) * radius }, { x: Math.cos(b) * radius, y: Math.sin(b) * radius }], ["#b2b4a0", "#959e8b", "#c2c1aa"][(column + wedge) % 3]!, 0.018, width * (row ? 0.17 : -0.3), height + 0.009, column % 2 ? 180 : 0));
      }
    }
    for (const side of [-1, 1]) parts.push(ribbon("拼石边框", points, width * 0.045, 0.014, "#d2c9ac", side * width * 0.46, height));
    return parts;
  }
  if (style === "marble" || style === "concreteSlab") {
    for (const side of [-1, 1]) {
      parts.push(ribbon(style === "marble" ? "大理石黑色镶边" : "混凝土板排水槽", points, width * 0.035, 0.009, style === "marble" ? "#60776f" : "#778d80", side * width * 0.42, height));
      if (style === "marble") parts.push(ribbon("礼仪道内侧金线", points, 0.018, 0.008, "#b9ad7d", side * width * 0.35, height));
    }
    for (let index = 0; index < count; index++) {
      const distance = (index + 0.5) / count * sample.length;
      if (style === "marble") parts.push(pathPart(sample, distance, "大理石菱花镶块", "box", index % 2 ? "#82968a" : "#b8b58f", [Math.min(0.38, width * 0.22), 0.014, Math.min(0.38, width * 0.22)], 0, height + 0.007, 45));
      else {
        parts.push(pathPart(sample, distance, "大板横向伸缩缝", "box", "#7d8e81", [0.022, 0.008, width * 0.9], 0, height + 0.004));
        for (const side of [-1, 1]) parts.push(pathPart(sample, distance, "大板锚固帽", "cylinder", "#859a8e", [0.055, 0.009, 0.055], side * width * 0.35, height + 0.007));
      }
    }
    if (style === "concreteSlab") parts.push(ribbon("大板纵向伸缩缝", points, 0.022, 0.008, "#7d8e81", 0, height));
    return parts;
  }
  if (style === "steelPlate" || style === "grating" || style === "rubber") {
    if (style === "grating") {
      for (let row = 0; row < 7; row++) parts.push(ribbon("工业格栅纵肋", points, Math.min(0.045, width * 0.05), height * 0.65, "#93a49a", width * (row / 6 - 0.5) * 0.93, height * 0.3));
      const bars = Math.min(64, Math.max(3, Math.ceil(sample.length / 0.16)));
      for (let index = 0; index < bars; index++) parts.push(pathPart(sample, (index + 0.5) / bars * sample.length, "工业格栅横肋", "box", "#a2afa4", [Math.min(0.04, sample.length / bars * 0.4), height * 0.5, width * 0.98], 0, height * 0.72));
    } else if (style === "steelPlate") {
      const lugs = Math.min(80, Math.max(8, Math.ceil(sample.length * 12)));
      for (let index = 0; index < lugs; index++) parts.push(pathPart(sample, (Math.floor(index / 4) + 0.5) / Math.ceil(lugs / 4) * sample.length, "钢板人字防滑凸纹", "box", "#a4b7ac", [Math.min(0.14, width * 0.12), 0.015, Math.min(0.035, width * 0.03)], width * ((index % 4 + 0.5) / 4 - 0.5), height + 0.008, index % 2 ? -45 : 45));
      for (let index = 0; index < Math.min(count, 12); index++) for (const side of [-1, 1]) parts.push(pathPart(sample, (index + 0.5) / Math.min(count, 12) * sample.length, "钢板固定螺栓", "cylinder", "#c1c8b9", [0.05, 0.012, 0.05], side * width * 0.44, height + 0.009));
    } else {
      for (let row = 0; row < 3; row++) parts.push(ribbon("运动橡胶分色跑道", points, width * 0.3, 0.012, ["#b67a61", "#ab6b56", "#c08a6d"][row]!, width * (row - 1) / 3, height));
      for (const side of [-1, 1]) parts.push(ribbon("跑道白色分隔线", points, Math.min(0.045, width * 0.025), 0.008, "#dedbc4", side * width / 6, height + 0.014));
      for (let index = 0; index < count; index++) parts.push(floorTile(sample, (index + 0.5) / count * sample.length, "运动道方向标", [{ x: -0.12, y: -0.1 }, { x: 0.12, y: 0 }, { x: -0.12, y: 0.1 }], "#dfd9be", 0.01, 0, height + 0.02));
    }
    if (style !== "rubber") for (const item of parts) { item.metalness = 0.7; item.roughness = 0.42; }
    return parts;
  }
  if (["runeStone", "crystalPath", "darkCauseway", "elfPath"].includes(style)) {
    const groups = Math.min(14, Math.max(2, Math.ceil(sample.length / 1.1)));
    for (let index = 0; index < groups; index++) {
      const distance = (index + 0.5) / groups * sample.length;
      if (style === "runeStone") {
        const span = Math.min(0.8, sample.length / groups * 0.9);
        parts.push(pathPart(sample, distance, "符文独立石板", "box", "#a3b3a0", [span, 0.04, width * 0.8], 0, height + 0.02));
        for (const turn of [0, 90]) parts.push(luminous(pathPart(sample, distance, "符文石镶嵌线", "box", "#bfd6b8", [Math.min(0.34, width * 0.22), 0.01, 0.025], 0, height + 0.045, turn), "#91bda0", 0.8));
        parts.push(luminous(floorTile(sample, distance, "符文尖角印记", [{ x: -0.12, y: 0 }, { x: 0, y: 0.15 }, { x: 0.12, y: 0 }, { x: 0.08, y: -0.015 }, { x: 0, y: 0.09 }, { x: -0.08, y: -0.015 }], "#d3dfc4", 0.01, width * 0.2, height + 0.045), "#9bc4a3", 0.8));
      } else if (style === "crystalPath") {
        for (const side of [-1, 1]) parts.push(crystalPart(sample, distance, Math.min(0.22, width * 0.16), 0.14 + index % 3 * 0.045, side < 0 ? "#a7c8d4" : "#acd3bd", side * width * 0.4, height));
        parts.push(floorTile(sample, distance, "晶石六角镶芯", Array.from({ length: 6 }, (_, corner) => ({ x: Math.cos(corner * Math.PI / 3) * Math.min(0.23, width * 0.2), y: Math.sin(corner * Math.PI / 3) * Math.min(0.23, width * 0.2) })), "#b8d1c5", 0.025, 0, height + 0.016));
      } else if (style === "darkCauseway") {
        const span = Math.min(0.9, sample.length / groups * 0.9);
        for (const side of [-1, 1]) parts.push(floorTile(sample, distance, "暗黑斜角铺石", [{ x: -span / 2, y: -width * 0.2 }, { x: span * 0.35, y: -width * 0.2 }, { x: span / 2, y: 0 }, { x: span * 0.35, y: width * 0.2 }, { x: -span / 2, y: width * 0.2 }], index % 2 ? "#657377" : "#536168", 0.035, side * width * 0.23, height + 0.018));
      } else {
        for (const side of [-1, 1]) parts.push(floorTile(sample, distance, "精灵叶纹镶石", [{ x: -0.32, y: 0 }, { x: -0.06, y: width * 0.13 }, { x: 0.36, y: 0 }, { x: -0.06, y: -width * 0.13 }], index % 2 ? "#c2cba7" : "#aebf9e", 0.018, side * width * 0.23, height + 0.01, side * 22));
        parts.push(pathPart(sample, distance, "精灵叶脉", "box", "#d5cf9c", [Math.min(0.54, width * 0.42), 0.012, 0.018], 0, height + 0.02));
      }
    }
    for (const side of [-1, 1]) parts.push(ribbon("奇幻步道收边", points, width * 0.035, 0.02, style === "darkCauseway" ? "#8c8881" : "#c1c9a9", side * width * 0.47, height));
    return parts;
  }
  if (style === "hexTech") {
    const columns = Math.min(16, Math.max(2, Math.ceil(sample.length / 0.7)));
    const radius = Math.min(0.42, width * 0.18);
    for (let column = 0; column < columns; column++) for (let row = 0; row < 3; row++) {
      const distance = (column + 0.45 + row % 2 * 0.22) / columns * sample.length;
      const tile = { ...floorTile(sample, distance, "科技六角铺板", Array.from({ length: 6 }, (_, corner) => ({ x: Math.cos(corner * Math.PI / 3) * radius, y: Math.sin(corner * Math.PI / 3) * radius })), (column + row) % 6 === 0 ? "#a8d8c8" : "#8baba1", 0.035, width * (row - 1) * 0.29, height + 0.018), metalness: 0.55, roughness: 0.4 };
      parts.push((column + row) % 6 === 0 ? luminous(tile, "#71b9a6", 0.9) : tile);
    }
    for (const side of [-1, 1]) parts.push(ribbon("六角道机械侧轨", points, width * 0.035, 0.045, "#a4b5a7", side * width * 0.47, height));
    return parts;
  }
  if (style === "lightRail") {
    for (const side of [-1, 1]) {
      parts.push({ ...ribbon("光导轨金属导槽", points, width * 0.09, 0.09, "#b0beb0", side * width * 0.3, height), metalness: 0.75, roughness: 0.35 });
      parts.push(luminous(ribbon("嵌入式光导芯", points, Math.min(0.04, width * 0.025), 0.016, "#a2ddcd", side * width * 0.3, height + 0.09), "#70c7b2", 1.3));
    }
    const ties = Math.min(58, Math.max(2, Math.ceil(sample.length / 0.45)));
    for (let index = 0; index < ties; index++) parts.push(pathPart(sample, (index + 0.5) / ties * sample.length, "光轨横向连接板", "box", index % 4 ? "#7d9289" : "#bcc2ae", [Math.min(0.12, sample.length / ties * 0.6), 0.035, width * 0.75], 0, height + 0.016));
    return parts;
  }
  if (style === "circuit") {
    for (let row = 0; row < 5; row++) {
      const track = ribbon("电路地坪导线", points, Math.min(0.035, width * 0.025), 0.009, row % 2 ? "#c7c59e" : "#a3cebe", width * (row - 2) * 0.15, height + 0.002);
      parts.push(row === 1 || row === 3 ? luminous(track, "#89c8b1", 1) : track);
    }
    for (let index = 0; index < count; index++) {
      const distance = (index + 0.5) / count * sample.length;
      const side = (index % 2 ? 1 : -1) * width * 0.22;
      parts.push(pathPart(sample, distance, "电路检修盖板", "box", "#9aafa0", [0.26, 0.022, Math.min(0.3, width * 0.2)], side, height + 0.012));
      parts.push(luminous(pathPart(sample, distance, "电路节点指示灯", "cylinder", "#a3dbc2", [0.055, 0.012, 0.055], side, height + 0.03), "#75bf9f", 1.2));
      parts.push(pathPart(sample, distance, "电路横向桥接线", "box", "#b7bd9e", [0.025, 0.01, Math.abs(side) + 0.03], side / 2, height + 0.008));
    }
    return parts;
  }
}

function makePaving(style: string, points: Vector3Value[], width: number, height: number): BrushPart[] {
  const themed = makeThemePaving(style, points, width, height);
  if (themed) return themed;
  const sample = pathSampler(points);
  // ACT: 所有路面有完整连续基面；细石、砖缝和铺板按全长均匀采样，始终保留64截面且不裁切末端。
  const colors: Record<string, string> = { flagstone: "#93998f", brick: "#9b735e", gravel: "#96917f", street: "#49504f", fourLane: "#48504f", dividedRoad: "#49504f", oneLane: "#515855", cycleway: "#8f6054", sidewalk: "#c0c0ad", tactileSidewalk: "#b7baab", parkPath: "#b6a888", steppingStone: "#a4a88c", dirt: "#a2906b", sand: "#c8b890", cobble: "#8e9487", herringbone: "#b68d72", granite: "#b2b7ab", slate: "#778681", terracotta: "#b58466", boardwalk: "#8f8163", sleeper: "#9c967e" };
  const parts = [ribbon("连续铺装基面", points, width, height, colors[style]!)];
  const road = ["street", "fourLane", "dividedRoad", "oneLane", "cycleway"].includes(style);
  if (road) {
    const edge = Math.min(0.17, width * 0.035);
    for (const side of [-1, 1]) {
      parts.push(ribbon("混凝土路缘", points, edge, 0.09, "#c4c5b5", side * (width / 2 - edge / 2), height));
      parts.push(ribbon("道路边线", points, Math.min(0.1, width * 0.018), 0.008, "#e4e2c9", side * width * 0.43, height + 0.004));
    }
    const dash = (offset: number, color: string) => {
      const count = Math.min(22, Math.max(1, Math.ceil(sample.length / 5)));
      for (let index = 0; index < count; index++) {
        const start = (index + 0.2) / count * sample.length;
        const end = (index + 0.7) / count * sample.length;
        parts.push(ribbon("沿线车道虚线", sample.between(start, end), Math.min(0.11, width * 0.025), 0.008, color, offset, height + 0.005));
      }
    };
    if (style === "street") dash(0, "#e6d6a2");
    if (style === "fourLane") {
      for (const side of [-1, 1]) { parts.push(ribbon("中央双黄线", points, Math.min(0.11, width * 0.018), 0.008, "#dac18a", side * width * 0.012, height + 0.005)); dash(side * width * 0.24, "#e1e1cc"); }
    }
    if (style === "dividedRoad") {
      parts.push(ribbon("中央分隔带", points, width * 0.08, 0.14, "#aeb9a0", 0, height));
      for (const side of [-1, 1]) {
        parts.push(ribbon("分隔带缘石", points, edge, 0.16, "#d1d0bb", side * width * 0.04, height));
        parts.push(ribbon("分隔带边线", points, 0.1, 0.008, "#e6d7a3", side * width * 0.065, height + 0.005));
        dash(side * width * 0.26, "#e2e1cc");
      }
    }
    if (style === "cycleway") {
      dash(0, "#dedbc2");
      const count = Math.min(8, Math.max(1, Math.ceil(sample.length / 10)));
      for (let index = 0; index < count; index++) for (const side of [-1, 1]) {
        const distance = (index + 0.5) / count * sample.length;
        const arrow = pathPart(sample, distance, "自行车道方向箭头", "mesh", "#e1ddc4", [1, 1, 1], side * width * 0.24, height + 0.013, side < 0 ? 180 : 0);
        arrow.vertices = [{ x: -0.38, y: 0, z: -0.04 }, { x: 0.12, y: 0, z: -0.04 }, { x: 0.12, y: 0, z: -0.17 }, { x: 0.4, y: 0, z: 0 }, { x: 0.12, y: 0, z: 0.17 }, { x: 0.12, y: 0, z: 0.04 }, { x: -0.38, y: 0, z: 0.04 }];
        arrow.indices = [0, 6, 1, 1, 6, 5, 2, 4, 3];
        parts.push(arrow);
      }
    }
    return parts;
  }
  if (["gravel", "sand", "dirt", "cobble"].includes(style)) {
    if (style === "dirt") {
      for (const side of [-1, 1]) parts.push(ribbon("乡间车辙", points, width * 0.16, 0.009, "#887b5c", side * width * 0.26, height + 0.002));
      parts.push(ribbon("车辙间土脊", points, width * 0.14, 0.018, "#aaa17a", 0, height));
    }
    if (style === "sand") for (let row = 0; row < 3; row++) parts.push(ribbon("浅沙波纹", points, width * 0.06, 0.009, row % 2 ? "#d1c29b" : "#bcae86", width * (row - 1) * 0.25, height));
    const count = Math.min(style === "cobble" ? 86 : 52, Math.max(6, Math.ceil(sample.length * width * (style === "cobble" ? 5 : 1.5))));
    for (let index = 0; index < count; index++) {
      const diameter = style === "cobble" ? 0.18 + (Math.sin(index * 7.71) + 1) * 0.055 : style === "sand" ? 0.035 : 0.06 + (Math.sin(index * 7.71) + 1) * 0.03;
      const side = Math.sin(index * 19.43) * width * 0.43;
      parts.push(pathPart(sample, (index + 0.5) / count * sample.length, style === "cobble" ? "圆润鹅卵石" : "路面细石", "sphere", ["#b2b1a0", "#7b8375", "#a3a38e"][index % 3]!, [diameter * 1.3, diameter * (style === "cobble" ? 0.42 : 0.35), diameter], side, height + diameter * 0.1));
    }
    return parts;
  }
  if (["boardwalk", "sleeper", "steppingStone"].includes(style)) {
    const wood = style !== "steppingStone";
    const count = Math.min(54, Math.max(2, Math.ceil(sample.length / (style === "boardwalk" ? 0.23 : style === "sleeper" ? 0.5 : 0.8))));
    if (wood) for (const side of [-1, 1]) parts.push(ribbon("纵向承托梁", points, width * 0.08, height * 0.6, "#726d55", side * width * 0.31));
    for (let index = 0; index < count; index++) parts.push(pathPart(sample, (index + 0.5) / count * sample.length, wood ? "横向木铺板" : "独立踏步石", "box", wood ? ["#a2916e", "#9b8765", "#b09b76"][index % 3]! : ["#c1bfaa", "#aaa997", "#b7b7a2"][index % 3]!, [Math.min(style === "boardwalk" ? 0.2 : style === "sleeper" ? 0.3 : 0.56, sample.length / count * 0.8), height * (wood ? 0.5 : 0.6), width * (wood ? 0.98 : 0.66 + index % 3 * 0.06)], style === "steppingStone" ? Math.sin(index * 2.3) * width * 0.07 : 0, height + height * (wood ? 0.08 : 0.12), style === "steppingStone" ? Math.sin(index * 3.1) * 7 : 0));
    if (style === "boardwalk") for (const side of [-1, 1]) parts.push(ribbon("木栈道收边", points, 0.055, height * 0.5, "#c0ad85", side * (width / 2 - 0.028), height));
    return parts;
  }
  if (style === "herringbone") {
    const count = Math.min(84, Math.max(8, Math.ceil(sample.length * 16)));
    for (let index = 0; index < count; index++) {
      const row = index % 4;
      parts.push(pathPart(sample, (Math.floor(index / 4) + 0.5) / Math.ceil(count / 4) * sample.length, "人字拼砖", "box", ["#c09c7b", "#ad866b", "#b99575"][index % 3]!, [Math.min(0.42, width * 0.24), 0.014, Math.min(0.16, width * 0.1)], width * ((row + 0.5) / 4 - 0.5), height + 0.007, row % 2 ? -45 : 45));
    }
    return parts;
  }
  const rows = style === "brick" ? 6 : ["terracotta", "sidewalk", "tactileSidewalk"].includes(style) ? 4 : style === "parkPath" ? 2 : 3;
  const columns = Math.min(Math.floor(72 / rows), Math.max(1, Math.ceil(sample.length / (style === "brick" ? 0.5 : style === "terracotta" ? 0.6 : style === "slate" ? 1.3 : 1))));
  const joint = style === "brick" || style === "terracotta" ? "#c9b395" : "#d5d3bd";
  for (let row = 1; row < rows; row++) parts.push(ribbon("铺装纵缝", points, 0.014, 0.006, joint, width * (row / rows - 0.5), height + 0.002));
  for (let column = 1; column < columns; column++) for (let row = 0; row < rows; row++) parts.push(pathPart(sample, (column + (["brick", "slate"].includes(style) ? row % 2 * 0.45 : 0)) / columns * sample.length, "铺装横缝", "box", joint, [0.015, 0.007, width / rows], width * ((row + 0.5) / rows - 0.5), height + 0.005));
  if (["sidewalk", "tactileSidewalk", "parkPath"].includes(style)) for (const side of [-1, 1]) parts.push(ribbon("步道收边", points, Math.min(0.12, width * 0.07), 0.055, style === "parkPath" ? "#8a957e" : "#a3a99a", side * (width / 2 - Math.min(0.06, width * 0.035)), height));
  if (style === "tactileSidewalk") {
    const side = width * 0.22;
    parts.push(ribbon("连续盲道基带", points, Math.min(0.42, width * 0.22), 0.012, "#cdb679", side, height + 0.008));
    for (let row = 0; row < 4; row++) parts.push(ribbon("盲道凸起导向条", points, 0.026, 0.013, "#dfc891", side + (row - 1.5) * Math.min(0.075, width * 0.035), height + 0.02));
  }
  if (style === "granite") for (const side of [-1, 1]) parts.push(ribbon("花岗岩深色镶边", points, width * 0.1, 0.012, "#707f76", side * width * 0.42, height + 0.002));
  if (style === "terracotta") for (const side of [-1, 1]) parts.push(ribbon("陶砖浅色收边", points, width * 0.055, 0.01, "#c8ad87", side * width * 0.45, height + 0.002));
  if (style === "slate") for (let row = 0; row < 3; row++) parts.push(ribbon("板岩天然层理", points, 0.007, 0.005, "#a1aca0", width * (row - 1) * 0.24, height + 0.003));
  return parts;
}

export function createPathBrushAsset(mode: "wall" | "paving", style: string, points: Vector3Value[], width: number, height: number): SceneAsset {
  if (points.length < 2 || points.length > 64 || points.some(point => ![point.x, point.y, point.z].every(value => Number.isFinite(value) && Math.abs(value) <= 80))) throw new Error("绘制轨迹须包含2～64个有效坐标");
  if (points.some((point, index) => index > 0 && Math.hypot(point.x - points[index - 1]!.x, point.z - points[index - 1]!.z) < 0.00001)) throw new Error("绘制轨迹的相邻点不能重合");
  if (![width, height].every(Number.isFinite) || width < (mode === "wall" ? 0.08 : 0.4) || width > (mode === "wall" ? 2 : 20) || height < (mode === "wall" ? 0.2 : 0.02) || height > (mode === "wall" ? 8 : 0.5)) throw new Error("笔刷宽度或高度超出可用范围");
  const styles = mode === "wall" ? wallStyleNames : pavingStyleNames;
  const name = styles[style];
  if (!name) throw new Error("请选择有效的笔刷样式");
  const parts = mode === "wall" ? makeWall(style, points, width, height) : makePaving(style, points, width, height);
  if (mode === "wall" && ["iron", "palisade", "chainLink", "guardrail", "bollards", "gabion", "glass", "industrial", "energy", "mechanical", "future", "laser"].includes(style)) for (const item of parts) {
    if (/填料|块石|反光/.test(item.name) || item.opacity !== undefined || item.emissive !== undefined) continue;
    item.metalness = 0.65;
    item.roughness = 0.45;
  }
  return asset(`brush${mode === "wall" ? "Wall" : "Paving"}${crypto.randomUUID()}`, name, "建筑", parts);
}

// 调用者拥有 content：手工画笔直接预览，数据工具取出物体后释放几何。
export function createPathBrushObject(mode: "wall" | "paving", style: string, worldPoints: { x: number; z: number }[], width: number, height: number, terrain?: SceneTerrain, signal?: AbortSignal) {
  signal?.throwIfAborted();
  const curve = new CatmullRomCurve3(worldPoints.map(point => new Vector3(point.x, 0, point.z)), false, "centripetal");
  const length = curve.getLength();
  if (length < 0.15) return;
  // ACT: 截面间距最多1米，每笔最多64截面，沿用现有模型顶点预算。
  const count = Math.min(63, Math.max(2, Math.ceil(length / Math.max(0.5, Math.min(1, width * 0.2)))));
  const points = curve.getSpacedPoints(count);
  const center = new Box3().setFromPoints(points).getCenter(new Vector3());
  let minHeight = Infinity;
  points.forEach(point => { point.y = getTerrainHeight(terrain, point.x, point.z); minHeight = Math.min(minHeight, point.y); });
  const local = points.map(point => ({ x: point.x - center.x, y: point.y - minHeight, z: point.z - center.z }));
  const pathAsset = createPathBrushAsset(mode, style, local, width, height);
  if (!pathAsset.model) throw new Error("绘制素材缺少模型");
  const content = createModelGroup(pathAsset.model, signal);
  const modelBounds = new Box3().setFromObject(content);
  const modelCenter = modelBounds.getCenter(new Vector3());
  const object = createSceneObject(pathAsset, { x: center.x + modelCenter.x, y: minHeight + modelBounds.min.y + 0.015, z: center.z + modelCenter.z });
  // 墙路已按沿途地形塑形，作为场景基础保持原位置。
  object.gravityEnabled = false;
  object.height = object.position.y;
  content.position.set(center.x, minHeight + 0.015, center.z);
  if (mode === "paving") object.navigation = {
    kind: width >= 4 && ["street", "fourLane", "dividedRoad", "oneLane", "dirt", "gravel", "cobble", "romanRoad", "palaceBrick"].includes(style) ? "road" : "walk",
    points: local.map(point => ({ x: point.x - modelCenter.x, y: point.y - modelBounds.min.y + height, z: point.z - modelCenter.z })),
    width,
  };
  return { object, content };
}

export function createLineBrushAsset(mode: "wall" | "paving", style: string, length: number, width: number, height: number, rise = 0): SceneAsset {
  if (!Number.isFinite(length) || length < 0.05 || length > 8 || !Number.isFinite(rise) || Math.abs(rise) > 52) throw new Error("单段长度须为0.05～8米，高差不能超过52米");
  return createPathBrushAsset(mode, style, [{ x: -length / 2, y: Math.max(0, -rise), z: 0 }, { x: length / 2, y: Math.max(0, rise), z: 0 }], width, height);
}

const wallStyles = [
  { id: "brick", name: "砖石墙", group: "实墙", width: 0.35, height: 1.8 },
  { id: "redBrick", name: "红砖院墙", group: "实墙", width: 0.3, height: 1.6 },
  { id: "stucco", name: "粉刷院墙", group: "实墙", width: 0.3, height: 2 },
  { id: "concrete", name: "清水混凝土墙", group: "实墙", width: 0.25, height: 2.2 },
  { id: "panelConcrete", name: "预制板围墙", group: "实墙", width: 0.22, height: 2 },
  { id: "dryStone", name: "干砌石墙", group: "石墙", width: 0.55, height: 1.2 },
  { id: "ashlar", name: "规整石砌墙", group: "石墙", width: 0.45, height: 1.6 },
  { id: "gabion", name: "石笼墙", group: "石墙", width: 0.75, height: 1.1 },
  { id: "rubble", name: "毛石矮墙", group: "石墙", width: 0.65, height: 0.75 },
  { id: "castle", name: "古城垛墙", group: "古建", width: 0.75, height: 2.8 },
  { id: "chinese", name: "园林花窗墙", group: "古建", width: 0.3, height: 1.9 },
  { id: "rammedEarth", name: "夯土墙", group: "古建", width: 0.7, height: 1.8 },
  { id: "timber", name: "木板围墙", group: "木竹", width: 0.18, height: 1.7 },
  { id: "picket", name: "尖顶木栅栏", group: "木竹", width: 0.12, height: 1.05 },
  { id: "ranch", name: "横木栏杆", group: "木竹", width: 0.2, height: 1.15 },
  { id: "crossRail", name: "交叉木栏", group: "木竹", width: 0.18, height: 1.05 },
  { id: "bamboo", name: "竹篱笆", group: "木竹", width: 0.12, height: 1.4 },
  { id: "iron", name: "铁艺栏杆", group: "金属", width: 0.14, height: 1.3 },
  { id: "palisade", name: "金属尖桩围栏", group: "金属", width: 0.14, height: 1.8 },
  { id: "chainLink", name: "铁丝网围栏", group: "金属", width: 0.12, height: 1.8 },
  { id: "guardrail", name: "道路波形护栏", group: "金属", width: 0.18, height: 0.8 },
  { id: "bollards", name: "道路隔离柱", group: "金属", width: 0.22, height: 0.8 },
  { id: "palace", name: "宫墙琉璃瓦", group: "东方", width: 0.55, height: 2.6 },
  { id: "whiteTile", name: "白墙黛瓦", group: "东方", width: 0.35, height: 1.9 },
  { id: "japaneseEarth", name: "日式土塀", group: "东方", width: 0.35, height: 1.7 },
  { id: "japaneseWood", name: "日式竖格围", group: "东方", width: 0.16, height: 1.6 },
  { id: "roman", name: "罗马柱廊栏", group: "西式", width: 0.32, height: 1.8 },
  { id: "gothic", name: "哥特尖拱栏", group: "西式", width: 0.25, height: 2.1 },
  { id: "european", name: "欧式瓶柱栏", group: "西式", width: 0.3, height: 1.05 },
  { id: "fortress", name: "堡垒扶壁墙", group: "西式", width: 0.8, height: 2.7 },
  { id: "glass", name: "玻璃金属护栏", group: "现代", width: 0.14, height: 1.15 },
  { id: "industrial", name: "工业钢构围", group: "现代", width: 0.2, height: 2 },
  { id: "elf", name: "精灵藤纹栏", group: "奇幻", width: 0.2, height: 1.5 },
  { id: "runic", name: "符文石墙", group: "奇幻", width: 0.5, height: 1.7 },
  { id: "crystal", name: "水晶簇围栏", group: "奇幻", width: 0.6, height: 1.5 },
  { id: "dark", name: "暗黑尖刺墙", group: "奇幻", width: 0.4, height: 1.8 },
  { id: "energy", name: "能量栅栏", group: "科幻", width: 0.2, height: 1.5 },
  { id: "mechanical", name: "机械装甲墙", group: "科幻", width: 0.5, height: 2 },
  { id: "future", name: "未来悬浮栏", group: "科幻", width: 0.2, height: 1.1 },
  { id: "laser", name: "光导隔离栏", group: "科幻", width: 0.16, height: 1.3 },
];
const pavingStyles = [
  { id: "street", name: "双车道街道", group: "道路", width: 7.2, height: 0.14 },
  { id: "fourLane", name: "四车道道路", group: "道路", width: 14.4, height: 0.16 },
  { id: "dividedRoad", name: "分隔式四车道", group: "道路", width: 16, height: 0.18 },
  { id: "oneLane", name: "单车道道路", group: "道路", width: 4, height: 0.12 },
  { id: "cycleway", name: "双向自行车道", group: "道路", width: 3, height: 0.08 },
  { id: "sidewalk", name: "人行道", group: "步行", width: 2.4, height: 0.16 },
  { id: "tactileSidewalk", name: "盲道人行道", group: "步行", width: 3, height: 0.18 },
  { id: "parkPath", name: "公园步道", group: "步行", width: 2, height: 0.08 },
  { id: "steppingStone", name: "踏步石小径", group: "步行", width: 1.2, height: 0.09 },
  { id: "gravel", name: "碎石小路", group: "自然", width: 2.2, height: 0.06 },
  { id: "dirt", name: "乡间土路", group: "自然", width: 2.5, height: 0.04 },
  { id: "sand", name: "沙地小径", group: "自然", width: 2, height: 0.04 },
  { id: "cobble", name: "鹅卵石路", group: "自然", width: 3, height: 0.12 },
  { id: "flagstone", name: "石板铺装", group: "石砖", width: 2.4, height: 0.1 },
  { id: "brick", name: "砖铺路面", group: "石砖", width: 2, height: 0.08 },
  { id: "herringbone", name: "人字拼砖", group: "石砖", width: 2.4, height: 0.08 },
  { id: "granite", name: "花岗岩铺装", group: "石砖", width: 3, height: 0.12 },
  { id: "slate", name: "长条板岩", group: "石砖", width: 1.8, height: 0.08 },
  { id: "terracotta", name: "陶砖铺装", group: "石砖", width: 2.4, height: 0.08 },
  { id: "boardwalk", name: "木栈道", group: "木作", width: 2.4, height: 0.18 },
  { id: "sleeper", name: "枕木步道", group: "木作", width: 1.6, height: 0.16 },
  { id: "palaceBrick", name: "中式宫砖御道", group: "东方", width: 3.2, height: 0.12 },
  { id: "courtyard", name: "院落十字拼砖", group: "东方", width: 2.4, height: 0.1 },
  { id: "japaneseSand", name: "枯山水砂纹", group: "东方", width: 2.2, height: 0.06 },
  { id: "tatamiStone", name: "日式榻石步道", group: "东方", width: 1.6, height: 0.1 },
  { id: "romanRoad", name: "罗马石道路", group: "西式", width: 4, height: 0.15 },
  { id: "mosaic", name: "马赛克拼石", group: "西式", width: 2.4, height: 0.1 },
  { id: "europeanFan", name: "欧式扇形拼石", group: "西式", width: 3, height: 0.1 },
  { id: "marble", name: "大理石礼仪步道", group: "西式", width: 3, height: 0.12 },
  { id: "concreteSlab", name: "现代混凝土大板", group: "现代", width: 3, height: 0.14 },
  { id: "steelPlate", name: "工业防滑钢板", group: "现代", width: 2, height: 0.08 },
  { id: "grating", name: "工业格栅栈道", group: "现代", width: 1.8, height: 0.14 },
  { id: "rubber", name: "运动橡胶步道", group: "现代", width: 3, height: 0.06 },
  { id: "runeStone", name: "符文石径", group: "奇幻", width: 2.2, height: 0.12 },
  { id: "crystalPath", name: "晶石镶嵌路", group: "奇幻", width: 2.2, height: 0.1 },
  { id: "darkCauseway", name: "暗黑尖棱石道", group: "奇幻", width: 2.8, height: 0.14 },
  { id: "elfPath", name: "精灵叶纹步道", group: "奇幻", width: 1.8, height: 0.09 },
  { id: "hexTech", name: "科技六边形路", group: "科幻", width: 3, height: 0.12 },
  { id: "lightRail", name: "光导轨道", group: "科幻", width: 2.4, height: 0.12 },
  { id: "circuit", name: "未来电路地坪", group: "科幻", width: 3, height: 0.1 },
];
const wallStyleNames: Record<string, string> = Object.fromEntries(wallStyles.map(style => [style.id, style.name]));
const pavingStyleNames: Record<string, string> = Object.fromEntries(pavingStyles.map(style => [style.id, style.name]));
export const wallBrushStyles: BrushStyle[] = wallStyles.map(style => ({ ...style, asset: createLineBrushAsset("wall", style.id, 3, style.width, style.height) }));
export const pavingBrushStyles: BrushStyle[] = pavingStyles.map(style => ({ ...style, asset: createLineBrushAsset("paving", style.id, Math.min(8, Math.max(4, style.width)), style.width, style.height) }));
