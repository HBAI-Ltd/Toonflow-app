import { Euler, Matrix4 } from "three";
import { part, beam, createTubeGeometry, type ModelPart, type Triple } from "./assetModelParts";
import type { ModelDefinition } from "./modelGeometry";

export const objectColors = { body: "#929da3", frame: "#38454d", wood: "#987653", edge: "#c4c1ac", glass: "#8ca9b2", light: "#f1dba0", accent: "#bd7752" };
export function objectCode(design: number) { return { frame: Math.floor(design / 8), layout: Math.floor(design / 2) % 4, joint: design % 2 }; }
export function objectBox(parts: ModelPart[], name: string, x: number, y: number, z: number, width: number, height: number, depth: number, color = objectColors.body, rotation: Triple = [0, 0, 0]) { parts.push(part(name, "box", color, [x, y, z], [width, height, depth], rotation)); }
export function objectCylinder(parts: ModelPart[], name: string, x: number, y: number, z: number, width: number, height: number, depth = width, color = objectColors.frame, rotation: Triple = [0, 0, 0]) { parts.push(part(name, "cylinder", color, [x, y, z], [width, height, depth], rotation)); }
export function objectBeam(parts: ModelPart[], name: string, start: Triple, end: Triple, width = 0.06, color = objectColors.frame) { parts.push(beam(name, color, start, end, width)); }
export function objectGrid(parts: ModelPart[], name: string, count: number, center: Triple, span: number, size: Triple, axis: "x" | "z" = "x", color = objectColors.wood) {
  for (let index = 0; index < count; index++) { const position = [...center] as Triple; position[axis === "x" ? 0 : 2] += (index / Math.max(1, count - 1) - 0.5) * span; parts.push(part(`${name}${index + 1}`, "box", color, position, size)); }
}

// 五种承力方式分别改变受力骨架，不用附加装饰件代表设计差异。
export function objectFrame(parts: ModelPart[], mode: number, width: number, depth: number, height: number, joint: number) {
  const x = width * 0.42, z = depth * 0.4;
  if (mode === 0) {
    for (const side of [-1, 1]) for (const end of [-1, 1]) objectBox(parts, "独立支足", side * x, height / 2, end * z, 0.09, height, 0.09, objectColors.frame);
  } else if (mode === 1) {
    for (const side of [-1, 1]) { objectBox(parts, "门式侧架立柱", side * x, height / 2, 0, 0.11, height, 0.12, objectColors.frame); objectBox(parts, "门架横足", side * x, 0.055, 0, 0.16, 0.11, depth, objectColors.frame); objectBox(parts, "门架托梁", side * x, height - 0.05, 0, 0.13, 0.1, depth, objectColors.frame); }
  } else if (mode === 2) {
    for (const side of [-1, 1]) { objectBox(parts, "承重侧板", side * x, height / 2, 0, 0.075, height, depth * 0.88, objectColors.wood); objectBox(parts, "侧板外伸足", side * x, 0.04, 0, 0.24, 0.08, depth, objectColors.frame); }
  } else if (mode === 3) {
    objectCylinder(parts, "中央承重柱", 0, height / 2, 0, 0.18, height);
    for (let index = 0; index < 4; index++) { const angle = index * Math.PI / 2; objectBeam(parts, "放射底足", [0, 0.08, 0], [Math.cos(angle) * x, 0.045, Math.sin(angle) * z], 0.09); }
    objectCylinder(parts, "柱头托盘", 0, height - 0.045, 0, Math.min(width, depth) * 0.7, 0.09);
  } else {
    for (const side of [-1, 1]) { objectBox(parts, "后置承重脊", side * x, height / 2, z, 0.1, height, 0.12, objectColors.frame); objectBox(parts, "悬臂底轨", side * x, 0.045, 0, 0.12, 0.09, depth, objectColors.frame); objectBeam(parts, "前伸悬臂", [side * x, height * 0.45, z], [side * x, height, -z], 0.09); }
  }
  if (joint === 0) {
    for (const end of [-1, 1]) objectBox(parts, "贯通横梁", 0, height * 0.72, end * z, width * 0.88, 0.075, 0.075, objectColors.frame);
    objectBox(parts, "纵向连接梁", 0, height * 0.35, 0, 0.075, 0.075, depth * 0.88, objectColors.frame);
  } else {
    objectBeam(parts, "交叉承力撑", [-x, 0.12, z], [x, height * 0.83, -z], 0.055);
    objectBeam(parts, "交叉承力撑", [x, 0.12, z], [-x, height * 0.83, -z], 0.055);
    objectBox(parts, "斜撑中心接头", 0, height * 0.47, 0, 0.15, 0.13, 0.15, objectColors.edge);
  }
}

export function objectPanel(parts: ModelPart[], name: string, center: Triple, width: number, height: number, columns: number, color = objectColors.frame) {
  objectBox(parts, `${name}背板`, center[0], center[1], center[2], width, height, 0.07, color);
  for (let index = 0; index < columns; index++) objectBox(parts, `${name}功能单元`, center[0] + (index - (columns - 1) / 2) * width / columns, center[1], center[2] - 0.055, width / columns * 0.7, height * 0.65, 0.04, objectColors.glass);
}

export function finishObjectModel(name: string, parts: ModelPart[]): ModelDefinition {
  let lowest = Infinity;
  for (const value of parts) {
    const matrix = new Matrix4().makeRotationFromEuler(new Euler(value.rotation.x * Math.PI / 180, value.rotation.y * Math.PI / 180, value.rotation.z * Math.PI / 180)).elements;
    const heightAt = (x: number, y: number, z: number) => value.position.y + matrix[1]! * x * value.scale.x + matrix[5]! * y * value.scale.y + matrix[9]! * z * value.scale.z;
    if (value.shape === "tube") {
      const geometry = createTubeGeometry(value);
      try {
        const positions = geometry.getAttribute("position");
        for (let index = 0; index < positions.count; index++) lowest = Math.min(lowest, heightAt(positions.getX(index), positions.getY(index), positions.getZ(index)));
      } finally { geometry.dispose(); }
    } else if (value.shape === "mesh") for (const point of value.vertices!) lowest = Math.min(lowest, heightAt(point.x, point.y, point.z));
    else if (value.shape === "lathe") for (const point of value.profile!) for (let index = 0; index < 24; index++) { const angle = index / 24 * Math.PI * 2; lowest = Math.min(lowest, heightAt(Math.sin(angle) * point.x, point.y, Math.cos(angle) * point.x)); }
    else if (value.shape === "extrude") for (const point of value.profile!) for (const end of [-1, 1]) lowest = Math.min(lowest, heightAt(point.x, point.y, end * (value.depth ?? 0.2) / 2));
    else if (value.shape === "cylinder" || value.shape === "cone") {
      for (let index = 0; index < 16; index++) { const angle = index / 16 * Math.PI * 2; lowest = Math.min(lowest, heightAt(Math.sin(angle) * 0.5, -0.5, Math.cos(angle) * 0.5)); if (value.shape === "cylinder") lowest = Math.min(lowest, heightAt(Math.sin(angle) * 0.5, 0.5, Math.cos(angle) * 0.5)); }
      if (value.shape === "cone") lowest = Math.min(lowest, heightAt(0, 0.5, 0));
    } else if (value.shape === "torus" || value.shape === "capsule") {
      const x = matrix[1]! * value.scale.x, y = matrix[5]! * value.scale.y, z = matrix[9]! * value.scale.z;
      const support = value.shape === "torus" ? Math.hypot(x, y) * 0.35 + Math.hypot(x, y, z) * 0.15 : Math.abs(y) * 0.25 + Math.hypot(x, y, z) * 0.25;
      lowest = Math.min(lowest, value.position.y - support);
    } else if (value.shape === "sphere") lowest = Math.min(lowest, value.position.y - 0.5 * Math.hypot(matrix[1]! * value.scale.x, matrix[5]! * value.scale.y, matrix[9]! * value.scale.z));
    else lowest = Math.min(lowest, value.position.y - (Math.abs(matrix[1]! * value.scale.x) + Math.abs(matrix[5]! * value.scale.y) + Math.abs(matrix[9]! * value.scale.z)) / 2);
  }
  for (const value of parts) value.position.y -= lowest;
  return { name, parts };
}
