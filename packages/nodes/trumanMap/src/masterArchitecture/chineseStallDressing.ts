import { Box3, Vector3 } from "three";
import type { ModelPart } from "../assetModelParts";
import { Builder, lantern, palette } from "./chineseArchKit";
import { worldBox } from "./chineseWallDressing";

// 集市摊位：在摊后立一根旗杆，挂幌旗和宫灯，摊子才像街市里的铺面；位置取整体包围盒外侧后角，不压住原有构件。
export function dressStall(parts: ModelPart[], room: number): ModelPart[] {
  if (room < 3) return [];
  const bounds = new Box3();
  for (const value of parts) { const box = worldBox(value); if (box) bounds.union(box); }
  if (bounds.isEmpty()) return [];
  const size = bounds.getSize(new Vector3()), x = bounds.max.x + .16, z = bounds.max.z + .16, y0 = bounds.min.y, top = Math.max(y0 + size.y + .9, y0 + 2.5);
  const b = new Builder()
    .group("door", "旗杆与横臂", "#6b523b")
    .group("cloth", "幌旗", "#a84a3c", { roughness: .95 })
    .group("trim", "幌旗滚边", palette.trim)
    .group("lantern", "宫灯", palette.lantern, { emissive: "#f0c878", emissiveIntensity: .55, roughness: .6 });
  b.box("door", x, (y0 + top) / 2, z, .09, top - y0, .09);
  b.box("door", x, top + .06, z, .14, .12, .14);
  b.box("door", x - .5, top - .06, z, 1, .06, .06);
  b.box("cloth", x - .42, top - .52, z, .72, .78, .025);
  b.box("trim", x - .42, top - .1, z, .76, .06, .035);
  b.box("trim", x - .42, top - .94, z, .76, .06, .035);
  lantern(b, x - .9, top - .5, z, .14, .2);
  return b.parts().slice(0, room);
}
