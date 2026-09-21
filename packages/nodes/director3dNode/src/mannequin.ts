import { BufferGeometry, Float32BufferAttribute, Group, Mesh, MeshStandardMaterial } from "three";

export const mannequinJoints = [
  "hips", "spine", "neck", "head",
  "leftShoulder", "leftElbow", "leftWrist", "rightShoulder", "rightElbow", "rightWrist",
  "leftHip", "leftKnee", "leftAnkle", "rightHip", "rightKnee", "rightAnkle",
] as const;

export function createMannequin(id: string, color = "#c7a77b", hiddenParts: readonly typeof mannequinJoints[number][] = []): Group {
  const root = new Group();
  root.name = `mannequin:${id}`;
  root.userData.threeJsonId = id;
  const material = new MeshStandardMaterial({ color, roughness: 0.75 });

  // ACT: 用少量椭圆截面表现人体体积，保留刚性关节预演，不引入蒙皮或外部模型。
  function bodyPart(parent: Group, rings: [height: number, width: number, depth: number, forward?: number][]) {
    if (!parent.visible) return;
    const segments = 16;
    const positions: number[] = [];
    const indices: number[] = [];
    rings.forEach(([height, width, depth, forward = 0], row) => {
      for (let column = 0; column < segments; column++) {
        const angle = column / segments * Math.PI * 2;
        positions.push(Math.cos(angle) * width, height, Math.sin(angle) * depth + forward);
        if (!row) continue;
        const bottom = (row - 1) * segments + column;
        const next = (row - 1) * segments + (column + 1) % segments;
        indices.push(bottom, bottom + segments, next, next, bottom + segments, next + segments);
      }
    });
    for (const row of [0, rings.length - 1]) {
      const center = positions.length / 3;
      positions.push(0, rings[row]![0], rings[row]![3] ?? 0);
      for (let column = 0; column < segments; column++) {
        const current = row * segments + column;
        const next = row * segments + (column + 1) % segments;
        indices.push(center, row ? next : current, row ? current : next);
      }
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    const mesh = new Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
  }

  function joint(parent: Group, name: typeof mannequinJoints[number], position: [number, number, number]) {
    const group = new Group();
    group.name = name;
    group.visible = parent.visible && !hiddenParts.includes(name);
    group.position.set(...position);
    parent.add(group);
    return group;
  }

  // 单位为米，脚底在 y=0；面向 +Z，自身左侧为 +X。关节零旋转即自然下垂站姿。
  const hips = joint(root, "hips", [0, 0.95, 0]);
  bodyPart(hips, [[-0.12, 0.06, 0.065], [-0.07, 0.145, 0.095], [0.015, 0.175, 0.105], [0.1, 0.125, 0.085], [0.15, 0.115, 0.075]]);
  const spine = joint(hips, "spine", [0, 0.15, 0]);
  bodyPart(spine, [[-0.045, 0.12, 0.08], [0.04, 0.12, 0.075], [0.16, 0.16, 0.095], [0.28, 0.205, 0.105], [0.34, 0.19, 0.09], [0.385, 0.09, 0.06], [0.4, 0.048, 0.04]]);
  const neck = joint(spine, "neck", [0, 0.425, 0]);
  bodyPart(neck, [[-0.04, 0.048, 0.043], [0.045, 0.043, 0.04], [0.08, 0.052, 0.047]]);
  const head = joint(neck, "head", [0, 0.07, 0]);
  bodyPart(head, [[-0.045, 0.038, 0.043, 0.015], [-0.01, 0.072, 0.075, 0.008], [0.055, 0.092, 0.095], [0.125, 0.09, 0.09], [0.17, 0.075, 0.075], [0.198, 0.035, 0.036], [0.205, 0.002, 0.002]]);

  for (const side of ["left", "right"] as const) {
    const direction = side === "left" ? 1 : -1;
    const shoulder = joint(spine, `${side}Shoulder`, [direction * 0.235, 0.3, 0]);
    bodyPart(shoulder, [[-0.32, 0.04, 0.039], [-0.27, 0.045, 0.044], [-0.12, 0.064, 0.06], [-0.025, 0.073, 0.069], [0.035, 0.052, 0.049], [0.058, 0.008, 0.008]]);
    const elbow = joint(shoulder, `${side}Elbow`, [0, -0.3, 0]);
    bodyPart(elbow, [[-0.28, 0.029, 0.028], [-0.24, 0.033, 0.032], [-0.14, 0.044, 0.042], [-0.065, 0.052, 0.048], [0, 0.04, 0.039], [0.022, 0.025, 0.026]]);
    const wrist = joint(elbow, `${side}Wrist`, [0, -0.26, 0]);
    bodyPart(wrist, [[-0.14, 0.021, 0.016], [-0.12, 0.039, 0.022], [-0.04, 0.043, 0.026], [0.015, 0.029, 0.025]]);

    const hip = joint(hips, `${side}Hip`, [direction * 0.105, -0.04, 0]);
    bodyPart(hip, [[-0.43, 0.047, 0.046], [-0.37, 0.057, 0.054], [-0.22, 0.087, 0.083], [-0.07, 0.097, 0.091], [0.015, 0.079, 0.078], [0.06, 0.045, 0.05]]);
    const knee = joint(hip, `${side}Knee`, [0, -0.41, 0]);
    bodyPart(knee, [[-0.42, 0.031, 0.032], [-0.35, 0.037, 0.04], [-0.2, 0.061, 0.062], [-0.1, 0.066, 0.06], [-0.015, 0.05, 0.047], [0.025, 0.041, 0.04]]);
    const ankle = joint(knee, `${side}Ankle`, [0, -0.4, 0]);
    bodyPart(ankle, [[-0.1, 0.051, 0.12, 0.045], [-0.07, 0.059, 0.132, 0.053], [-0.025, 0.048, 0.107, 0.032], [0.025, 0.032, 0.04]]);
  }
  return root;
}
