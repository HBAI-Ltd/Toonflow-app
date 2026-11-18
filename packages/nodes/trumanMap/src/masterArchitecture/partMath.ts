import { Euler, Quaternion, Vector3 } from "three";
import type { ModelPart } from "../assetModelParts";
import { tubeSegments } from "../assetModelParts";

export const DEG = Math.PI / 180;

export const quaternionOf = (value: ModelPart) => new Quaternion().setFromEuler(new Euler(value.rotation.x * DEG, value.rotation.y * DEG, value.rotation.z * DEG));

// 部件是否只绕竖轴旋转（含 180° 翻转写成 x/z 各 180° 的等价欧拉角）；返回偏航角（度）。
export function yawOf(value: ModelPart): number | undefined {
  const q = quaternionOf(value), up = new Vector3(0, 1, 0).applyQuaternion(q);
  if (up.y < .9999) return undefined;
  const forward = new Vector3(0, 0, 1).applyQuaternion(q);
  return Math.atan2(forward.x, forward.z) / DEG;
}

// 与 modelGeometry 的三角形预算保持一致，用于避免补细节后超过单模型 50000 三角形。
export function triangles(value: ModelPart) {
  if (value.shape === "mesh") return (value.indices?.length ?? value.vertices?.length ?? 0) / 3;
  if (value.shape === "lathe") return 48 * Math.max(0, (value.profile?.length ?? 0) - 1);
  if (value.shape === "extrude") return 4 * (value.profile?.length ?? 0);
  if (value.shape === "tube") return tubeSegments(value.path?.length ?? 2) * 16;
  return { box: 12, sphere: 384, cylinder: 64, cone: 32, torus: 576, capsule: 512 }[value.shape];
}
