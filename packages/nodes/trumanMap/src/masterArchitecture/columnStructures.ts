import type { Box3 } from "three";
import type { ModelPart } from "../assetModelParts";
import { Builder } from "./chineseArchKit";
import { shade } from "./chineseRoofKit";
import { worldBox } from "./chineseWallDressing";
import { DEG, yawOf } from "./partMath";

// 立柱承顶的亭、廊、棚、门架：在相邻立柱之间补檐枋（中式再加彩画带、雀替和柱顶斗拱，并补柱础），
// 让屋顶有真正的承托，而不是几根孤立的柱子。只读已生成的部件，沿立柱围成的外缘连线。
type Column = { x: number; z: number; top: number; bottom: number; size: number; color: string };

const COLUMN_NAME = /柱/, NOT_COLUMN = /础|栏|栅|旗|灯|烟|管|门柱|石柱座|护|扶手|撑|桅|杆|拉/;

function columnsOf(parts: ModelPart[]): Column[] {
  const result: Column[] = [];
  for (const value of parts) {
    if ((value.shape !== "cylinder" && value.shape !== "box") || !COLUMN_NAME.test(value.name) || NOT_COLUMN.test(value.name)) continue;
    if (yawOf(value) === undefined) continue;
    const size = value.shape === "cylinder" ? Math.max(value.scale.x, value.scale.z) : Math.max(value.scale.x, value.scale.z), thin = Math.min(value.scale.x, value.scale.z);
    if (value.scale.y < 1.8 || thin > .7 || size > .9 || value.scale.y < size * 3) continue;
    const box = worldBox(value);
    if (!box) continue;
    result.push({ x: value.position.x, z: value.position.z, top: box.max.y, bottom: box.min.y, size, color: value.color });
  }
  return result;
}

function hull(points: { x: number; z: number }[]) {
  const sorted = [...points].sort((p, q) => p.x - q.x || p.z - q.z);
  if (sorted.length < 3) return sorted;
  const cross = (o: { x: number; z: number }, a: { x: number; z: number }, b: { x: number; z: number }) => (a.x - o.x) * (b.z - o.z) - (a.z - o.z) * (b.x - o.x);
  const lower: typeof sorted = [], upper: typeof sorted = [];
  for (const point of sorted) { while (lower.length >= 2 && cross(lower[lower.length - 2]!, lower[lower.length - 1]!, point) <= 0) lower.pop(); lower.push(point); }
  for (const point of [...sorted].reverse()) { while (upper.length >= 2 && cross(upper[upper.length - 2]!, upper[upper.length - 1]!, point) <= 0) upper.pop(); upper.push(point); }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
}

export function dressColumns(parts: ModelPart[], theme: string | undefined, room: number, opts: { bases?: boolean; rails?: boolean; roofs?: Box3[] } = {}): ModelPart[] {
  const columns = columnsOf(parts);
  if (columns.length < 2 || room < 2) return [];
  // 按水平距离和柱顶高度聚成一组一组的承重结构
  const group = columns.map((_, i) => i), find = (i: number): number => group[i] === i ? i : (group[i] = find(group[i]!));
  // 每根立柱归属头顶最近的一块屋面；同一块屋面下的立柱成组，屋面之外的按 3.0m 邻近聚类
  const roofOf = columns.map(column => {
    let best = -1, gap = 1e9;
    (opts.roofs ?? []).forEach((box, index) => {
      const d = box.min.y - column.top;
      if (column.x >= box.min.x - .3 && column.x <= box.max.x + .3 && column.z >= box.min.z - .3 && column.z <= box.max.z + .3 && d > -1.2 && d < gap) { gap = d; best = index; }
    });
    return best;
  });
  for (let i = 0; i < columns.length; i++) for (let j = i + 1; j < columns.length; j++) {
    const a = columns[i]!, c = columns[j]!;
    if (Math.abs(a.top - c.top) > .6) continue;
    if (roofOf[i]! >= 0 || roofOf[j]! >= 0 ? roofOf[i] === roofOf[j] : Math.hypot(a.x - c.x, a.z - c.z) <= 3.0) group[find(i)] = find(j);
  }
  const clusters = new Map<number, Column[]>();
  columns.forEach((column, i) => { const key = find(i); clusters.set(key, [...(clusters.get(key) ?? []), column]); });
  const chinese = theme === "中式", b = new Builder();
  const beamColor = (column: Column) => chinese ? shade(column.color, .82) : shade(column.color, 1.05);
  b.group("beam", chinese ? "檐枋" : "横梁", "#8a6a4b", { roughness: .8 });
  b.group("paint", "檐枋彩画", "#2f6a62", { roughness: .7 });
  b.group("bracket", "柱顶斗拱", "#b8924a", { roughness: .75 });
  b.group("base", "柱础", "#b9b3a2", { roughness: .95 });
  b.group("rail", chinese ? "美人靠栏" : "亭廊栏杆", chinese ? shade(columns[0]!.color, .92) : "#8b6f4e", { roughness: .8 });
  const colors = new Map<string, string>();
  const keyFor = (color: string) => { const hex = shade(color, 1); let key = colors.get(hex); if (!key) { key = `beam${colors.size}`; colors.set(hex, key); b.group(key, chinese ? "檐枋" : "横梁", hex, { roughness: .8 }); } return key; };
  let links = 0;
  for (const cluster of clusters.values()) {
    if (cluster.length < 2) continue;
    const edges: [Column, Column][] = [];
    const outline = hull(cluster.map(column => ({ x: column.x, z: column.z })));
    if (cluster.length === 2) edges.push([cluster[0]!, cluster[1]!]);
    else for (let i = 0; i < outline.length; i++) {
      const p = outline[i]!, q = outline[(i + 1) % outline.length]!, length = Math.hypot(q.x - p.x, q.z - p.z);
      if (length < .1) continue;
      // 落在这条外缘线上的立柱按位置排好，相邻两根连梁
      const onEdge = cluster.filter(column => Math.abs((column.x - p.x) * (q.z - p.z) - (column.z - p.z) * (q.x - p.x)) / length < .25 && ((column.x - p.x) * (q.x - p.x) + (column.z - p.z) * (q.z - p.z)) / length >= -.05 && ((column.x - p.x) * (q.x - p.x) + (column.z - p.z) * (q.z - p.z)) / length <= length + .05)
        .sort((u, w) => ((u.x - p.x) * (q.x - p.x) + (u.z - p.z) * (q.z - p.z)) - ((w.x - p.x) * (q.x - p.x) + (w.z - p.z) * (q.z - p.z)));
      for (let k = 0; k + 1 < onEdge.length; k++) edges.push([onEdge[k]!, onEdge[k + 1]!]);
    }
    // 正面（z 最大的一条边）留出入口，其余各边做栏杆
    const front = edges.length > 2 ? edges.reduce((best, edge) => (edge[0].z + edge[1].z) > (best[0].z + best[1].z) ? edge : best, edges[0]!) : undefined;
    for (const edge of edges) {
      const [a, c] = edge;
      const dx = c.x - a.x, dz = c.z - a.z, length = Math.hypot(dx, dz);
      if (length < .8 || length > 5.6 || links >= 40) continue;
      const yaw = Math.atan2(-dz, dx) / DEG, top = Math.min(a.top, c.top), cx = (a.x + c.x) / 2, cz = (a.z + c.z) / 2;
      const key = keyFor(beamColor(a));
      if (chinese) {
        // 大额枋、由额垫板（彩画）、小额枋三层叠落
        b.boxYaw(key, cx, top - .17, cz, length, .24, .28, yaw);
        b.boxYaw("paint", cx, top - .37, cz, length - .1, .16, .2, yaw);
        b.boxYaw(key, cx, top - .54, cz, length, .18, .24, yaw);
      } else b.boxYaw(key, cx, top - .16, cz, length, .24, .2, yaw);
      links++;
      if (opts.rails && edges.length > 2 && edge !== front) {
        const base = Math.max(a.bottom, c.bottom), n = Math.max(2, Math.round(length / .5));
        b.boxYaw("rail", cx, base + .98, cz, length - a.size, .09, .16, yaw);
        b.boxYaw("rail", cx, base + .5, cz, length - a.size, .07, chinese ? .34 : .12, yaw);
        for (let i = 1; i < n; i++) { const u = i / n - .5; b.boxYaw("rail", cx + dx * u, base + .74, cz + dz * u, .06, .5, .06, yaw); }
      }
    }
  }
  if (!links) return [];
  if (chinese) for (const column of columns.slice(0, 40)) {
    // 柱顶一斗二升：栌斗加两层横向、纵向的拱
    b.box("bracket", column.x, column.top - .08, column.z, column.size + .24, .14, column.size + .24);
    b.box("bracket", column.x, column.top - .22, column.z, column.size * 2.2, .1, column.size * .8);
    b.box("bracket", column.x, column.top - .22, column.z, column.size * .8, .1, column.size * 2.2);
    if (opts.bases) b.box("base", column.x, column.bottom + .07, column.z, column.size * 2, .14, column.size * 2);
  }
  return b.parts().slice(0, room);
}
