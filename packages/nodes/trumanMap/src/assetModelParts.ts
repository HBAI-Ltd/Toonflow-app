import { CatmullRomCurve3, Euler, Quaternion, TubeGeometry, Vector3 } from "three";
import type { ModelDefinition } from "./modelGeometry";
import type { AssetTheme, SceneAsset } from "./sceneDocument";
import { getAssetItemType } from "./assetMetadata";
import { pitchedRoofs } from "./roofRegistry";

export type ModelPart = ModelDefinition["parts"][number];
export type Triple = [number, number, number];

export function tubeSegments(pointCount: number) { return Math.min(256, Math.max(24, (pointCount - 1) * 8)); }

export function createTubeGeometry(value: ModelPart) {
  const curve = new CatmullRomCurve3(value.path!.map(point => new Vector3(point.x, point.y, point.z)), false, "centripetal");
  return new TubeGeometry(curve, tubeSegments(value.path!.length), value.radius ?? 0.08, 8, false);
}

export function part(name: string, shape: ModelPart["shape"], color: string, position: Triple, scale: Triple, rotation: Triple = [0, 0, 0], details: Partial<ModelPart> = {}): ModelPart {
  return { name, shape, color, position: { x: position[0], y: position[1], z: position[2] }, scale: { x: scale[0], y: scale[1], z: scale[2] }, rotation: { x: rotation[0], y: rotation[1], z: rotation[2] }, roughness: 0.78, ...details };
}

export function asset(id: string, name: string, theme: AssetTheme, category: "建筑" | "道具" | "自然", parts: ModelPart[], details: Pick<SceneAsset, "itemType" | "state" | "variantOf"> = {}): SceneAsset {
  // ACT: 定义只依赖类型，实际创建/导出由 createModelGroup 校验，避免资产库与几何模块初始化循环。
  const value: SceneAsset = { id, name, theme, category, kind: "model", normalize: false, license: "内置", state: "原始", ...details, model: { name, parts } };
  value.itemType = getAssetItemType(value);
  return value;
}

export function ring(name: string, color: string, radius: number, thickness: number, y: number, depth: number, details: Partial<ModelPart> = {}): ModelPart {
  return part(name, "lathe", color, [0, y, 0], [1, 1, 1], [0, 0, 0], {
    profile: [{ x: radius - thickness, y: -depth / 2 }, { x: radius, y: -depth / 2 }, { x: radius, y: depth / 2 }, { x: radius - thickness, y: depth / 2 }, { x: radius - thickness, y: -depth / 2 }], ...details,
  });
}

export function pitchedRoof(name: string, color: string, width: number, depth: number, y: number, swept = false): ModelPart {
  const profile = swept ? [
    [-width / 2, 0.3], [-width * 0.38, 0.16], [0, 0.62], [width * 0.38, 0.16], [width / 2, 0.3], [width * 0.44, 0], [0, 0.43], [-width * 0.44, 0],
  ] : [[-width / 2, 0], [0, 0.65], [width / 2, 0], [width / 2, -0.12], [0, 0.48], [-width / 2, -0.12]];
  const roof = part(name, "extrude", color, [0, y, 0], [1, 1, 1], [0, 0, 0], { depth, profile: profile.map(([x, y]) => ({ x: x!, y: y! })) });
  pitchedRoofs.add(roof);
  return roof;
}

export function beam(name: string, color: string, start: Triple, end: Triple, width: number, depth = width): ModelPart {
  const direction = new Vector3(...end).sub(new Vector3(...start));
  const length = direction.length();
  const rotation = new Euler().setFromQuaternion(new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), direction.normalize()));
  return part(name, "box", color, [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2, (start[2] + end[2]) / 2], [width, length, depth], [rotation.x, rotation.y, rotation.z].map(value => value * 180 / Math.PI) as Triple);
}

export function crystal(name: string, color: string, position: Triple, scale: Triple, details: Partial<ModelPart> = {}): ModelPart {
  return part(name, "mesh", color, position, scale, [0, 0, 0], {
    vertices: [{ x: 0, y: 0.9, z: 0 }, { x: 0.5, y: 0, z: 0 }, { x: 0, y: 0, z: 0.5 }, { x: -0.5, y: 0, z: 0 }, { x: 0, y: 0, z: -0.5 }, { x: 0, y: -0.7, z: 0 }],
    indices: [0, 2, 1, 0, 3, 2, 0, 4, 3, 0, 1, 4, 5, 1, 2, 5, 2, 3, 5, 3, 4, 5, 4, 1], roughness: 0.24, metalness: 0.2, ...details,
  });
}
