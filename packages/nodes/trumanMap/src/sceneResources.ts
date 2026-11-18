import { InstancedMesh, Line, Mesh, Texture } from "three";
import type { BufferGeometry, Material, Object3D } from "three";

const geometryUsers = new WeakMap<BufferGeometry, number>();
const sharedMeshes = new WeakSet<Mesh>();

export function retainMeshGeometry(mesh: Mesh) {
  if (sharedMeshes.has(mesh)) return;
  sharedMeshes.add(mesh);
  geometryUsers.set(mesh.geometry, (geometryUsers.get(mesh.geometry) ?? 0) + 1);
}

export function disposeObject(object: Object3D) {
  const geometries = new Set<BufferGeometry>();
  const materials = new Set<Material>();
  const textures = new Set<Texture>();
  object.traverse(child => {
    if (!(child instanceof Mesh || child instanceof Line)) return;
    if (child instanceof InstancedMesh) child.dispose();
    if (child instanceof Mesh && sharedMeshes.delete(child)) {
      const remaining = geometryUsers.get(child.geometry)! - 1;
      if (remaining) geometryUsers.set(child.geometry, remaining);
      else geometryUsers.delete(child.geometry);
    }
    if (!geometryUsers.has(child.geometry)) geometries.add(child.geometry);
    for (const material of Array.isArray(child.material) ? child.material : [child.material]) {
      materials.add(material);
      for (const value of Object.values(material)) if (value instanceof Texture) textures.add(value);
    }
    if (child instanceof Mesh && "skeleton" in child) {
      const skeleton = child.skeleton as { dispose?: () => void } | undefined;
      skeleton?.dispose?.();
    }
  });
  geometries.forEach(geometry => geometry.dispose());
  materials.forEach(material => material.dispose());
  const bitmaps = new Set<ImageBitmap>();
  textures.forEach(texture => {
    if (typeof ImageBitmap !== "undefined" && texture.source.data instanceof ImageBitmap) bitmaps.add(texture.source.data);
    texture.dispose();
  });
  bitmaps.forEach(bitmap => bitmap.close());
}
