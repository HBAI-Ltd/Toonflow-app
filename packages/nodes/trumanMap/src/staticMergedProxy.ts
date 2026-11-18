import { BufferAttribute, BufferGeometry, Group, InstancedMesh, Matrix3, Matrix4, Mesh, Object3D, Vector3, Vector4 } from "three";
import type { InterleavedBufferAttribute, Material } from "three";

// ACT: 单个静态物件的“按材质合并代理”。一栋楼上百个部件就是上百次绘制，每次都要付 Three 的状态检查、矩阵上传和剔除成本；
// 把同一材质、同样投/受阴影的部件烘焙到物件自身坐标里合成一个网格，绘制次数降到材质数。代理只用于绘制：
// 拾取、碰撞、导航、编辑仍读原模型；物件移动时只改代理的矩阵，不用重建。共享原材质，天气等着色器改动对代理同样生效。

type Part = { geometry: BufferGeometry; matrix: Matrix4 };
type Batch = { material: Material; castShadow: boolean; receiveShadow: boolean; names: string[]; parts: Part[]; vertices: number; indices: number };

const transformed = new Set(["position", "normal", "tangent"]);
const point = new Vector3();
const direction = new Vector4();
const normalMatrix = new Matrix3();
// GLTFLoader 对交错缓冲给的是 InterleavedBufferAttribute，数组在 data 上。
const arrayOf = (attribute: BufferAttribute | InterleavedBufferAttribute) => "isInterleavedBufferAttribute" in attribute ? attribute.data.array : attribute.array;

function attributeSignature(geometry: BufferGeometry) {
  const names = Object.keys(geometry.attributes).sort();
  return names.map(name => {
    const attribute = geometry.getAttribute(name);
    const array = arrayOf(attribute);
    return `${name}:${attribute.itemSize}:${attribute.normalized ? 1 : 0}:${array.constructor.name}`;
  }).join(",");
}

/**
 * 合成代理；物件里有不能合并的东西（骨骼、变形、自带动画、多材质、点线、自定义深度材质、绘制钩子等）返回 undefined，
 * 只有一个部件时也不必合并。
 */
export function createMergedProxy(root: Object3D): Group | undefined {
  root.updateWorldMatrix(true, true);
  const inverse = root.matrixWorld.clone().invert();
  const batches = new Map<string, Batch>();
  let valid = true, meshes = 0;
  root.traverse(object => {
    if (!valid) return;
    if (object.animations.length) { valid = false; return; }
    if ("isPoints" in object || "isLine" in object || "isSprite" in object) { valid = false; return; }
    if (!(object instanceof Mesh)) return;
    const geometry = object.geometry as BufferGeometry, material = object.material as Material | Material[];
    if ("isSkinnedMesh" in object || object.morphTargetInfluences?.length || Object.keys(geometry.morphAttributes).length || Array.isArray(material)
      || object.customDepthMaterial || object.customDistanceMaterial || object.renderOrder || object.layers.mask !== 1
      || object.onBeforeRender !== Object3D.prototype.onBeforeRender || object.onAfterRender !== Object3D.prototype.onAfterRender
      || geometry.drawRange.start !== 0 || geometry.drawRange.count !== Infinity || !geometry.getAttribute("position")
      || object instanceof InstancedMesh && (object.instanceColor || object.morphTexture)) { valid = false; return; }
    // 隐藏部件不画；运行时只整体显隐物件，不单独切部件。
    for (let node: Object3D | null = object; node && node !== root.parent; node = node.parent) if (!node.visible) return;
    if (!material.visible) return;
    const names = Object.keys(geometry.attributes).sort();
    const key = `${material.uuid}|${object.castShadow}|${object.receiveShadow}|${attributeSignature(geometry)}`;
    let batch = batches.get(key);
    if (!batch) batches.set(key, batch = { material, castShadow: object.castShadow, receiveShadow: object.receiveShadow, names, parts: [], vertices: 0, indices: 0 });
    const local = inverse.clone().multiply(object.matrixWorld);
    const count = geometry.getAttribute("position").count, indexCount = geometry.index?.count ?? count;
    if (object instanceof InstancedMesh) {
      const instance = new Matrix4();
      for (let index = 0; index < object.count; index++) {
        object.getMatrixAt(index, instance);
        batch.parts.push({ geometry, matrix: local.clone().multiply(instance) });
        batch.vertices += count; batch.indices += indexCount;
      }
    } else {
      batch.parts.push({ geometry, matrix: local });
      batch.vertices += count; batch.indices += indexCount;
    }
    meshes++;
  });
  if (!valid || meshes < 2) return;
  const proxy = new Group();
  proxy.name = "staticMergedProxy";
  proxy.matrixAutoUpdate = false;
  for (const batch of batches.values()) {
    const merged = new BufferGeometry();
    for (const name of batch.names) {
      const sample = batch.parts[0]!.geometry.getAttribute(name);
      const sourceArray = arrayOf(sample);
      const ArrayType = transformed.has(name) ? Float32Array : sourceArray.constructor as Float32ArrayConstructor;
      const values = new ArrayType(batch.vertices * sample.itemSize);
      let offset = 0;
      for (const part of batch.parts) {
        const attribute = part.geometry.getAttribute(name), size = attribute.itemSize;
        if (name === "normal" || name === "tangent") normalMatrix.getNormalMatrix(part.matrix);
        for (let index = 0; index < attribute.count; index++, offset += size) {
          if (name === "position") {
            point.fromBufferAttribute(attribute, index).applyMatrix4(part.matrix);
            values[offset] = point.x; values[offset + 1] = point.y; values[offset + 2] = point.z;
          } else if (name === "normal") {
            point.fromBufferAttribute(attribute, index).applyMatrix3(normalMatrix).normalize();
            values[offset] = point.x; values[offset + 1] = point.y; values[offset + 2] = point.z;
          } else if (name === "tangent") {
            direction.fromBufferAttribute(attribute as BufferAttribute, index);
            point.set(direction.x, direction.y, direction.z).transformDirection(part.matrix);
            values[offset] = point.x; values[offset + 1] = point.y; values[offset + 2] = point.z; values[offset + 3] = direction.w * Math.sign(part.matrix.determinant() || 1);
          } else for (let component = 0; component < size; component++) values[offset + component] = attribute.getComponent(index, component);
        }
      }
      merged.setAttribute(name, new BufferAttribute(values, sample.itemSize, sample.normalized));
    }
    const index = batch.vertices > 65535 ? new Uint32Array(batch.indices) : new Uint16Array(batch.indices);
    let cursor = 0, base = 0;
    for (const part of batch.parts) {
      const source = part.geometry.index, count = part.geometry.getAttribute("position").count, length = source?.count ?? count;
      // 镜像变换（行列式为负）烘焙进顶点后三角形绕向反了，交换两个顶点保持正面朝外。
      const mirrored = part.matrix.determinant() < 0;
      for (let corner = 0; corner < length; corner += 3) {
        const a = source ? source.getX(corner) : corner, b = source ? source.getX(corner + 1) : corner + 1, c = source ? source.getX(corner + 2) : corner + 2;
        index[cursor++] = base + a;
        index[cursor++] = base + (mirrored ? c : b);
        index[cursor++] = base + (mirrored ? b : c);
      }
      base += count;
    }
    merged.setIndex(new BufferAttribute(index, 1));
    merged.computeBoundingBox();
    merged.computeBoundingSphere();
    const mesh = new Mesh(merged, batch.material);
    mesh.castShadow = batch.castShadow;
    mesh.receiveShadow = batch.receiveShadow;
    mesh.matrixAutoUpdate = false;
    proxy.add(mesh);
  }
  return proxy;
}

export function disposeMergedProxy(proxy: Group) {
  proxy.removeFromParent();
  for (const child of proxy.children) if (child instanceof Mesh) (child.geometry as BufferGeometry).dispose();
}
