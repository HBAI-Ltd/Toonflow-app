import { DoubleSide, Raycaster, Vector3 } from "three";
import type { Material, Mesh, Object3D } from "three";
const materialCache = new WeakMap<Object3D, Material[]>();
const insideRay = new Raycaster();
const insideOrigin = new Vector3(), insideNormal = new Vector3();
const insideDirections = [new Vector3(1, 0, 0), new Vector3(0, 0, 1)];
/**
 * ACT: 点是不是在实心体里：从这一点水平打两条双面射线（+X、+Z），最先碰到的面都朝外（法线和射线同向）就是从里面往外穿，人站不进去。
 * 材质临时改成双面、同步算完立刻改回，界面不会在中间渲染。门洞、窗洞是空的，碰到的是门框朝里的面，不算在里面。
 */
export function insideSolid(groups: readonly Object3D[], x: number, y: number, z: number) {
  if (!groups.length) return false;
  const saved: [Material, Material["side"]][] = [];
  for (const group of groups) {
    let list = materialCache.get(group);
    if (!list) {
      const found = new Set<Material>();
      group.traverse(child => { const material = (child as Mesh).material; if (material) for (const item of Array.isArray(material) ? material : [material]) found.add(item); });
      list = [...found];
      materialCache.set(group, list);
    }
    for (const material of list) saved.push([material, material.side]);
  }
  for (const [material] of saved) material.side = DoubleSide;
  try {
    return insideDirections.every(direction => {
      insideRay.set(insideOrigin.set(x, y, z), direction); insideRay.near = 0; insideRay.far = 60;
      const hit = insideRay.intersectObjects(groups as Object3D[], true).find(item => item.object.visible && item.face);
      return !!hit && insideNormal.copy(hit.face!.normal).transformDirection(hit.object.matrixWorld).dot(direction) > 0.2;
    });
  } finally { for (const [material, side] of saved) material.side = side; }
}
