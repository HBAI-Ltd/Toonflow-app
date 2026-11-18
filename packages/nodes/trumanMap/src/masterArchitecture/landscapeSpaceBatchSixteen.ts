import { BoxGeometry } from "three";
import { part, type ModelPart, type Triple } from "../assetModelParts";
import { polygon, sweptProfile } from "../masterNature/shared";
import { roadway } from "./landscapeSpaceBatchSeven";
import { box, cylinder, design, pipe, rail } from "./structures";

// 平转浮沉门原理参考，原创小尺度静态场景形体，不复刻工程尺寸或提供防洪性能保证。
// https://www.rijkswaterstaat.nl/en/projects/iconic-structures/maeslant-barrier
const stone = "#a5ad9a", steel = "#6d8b83", paving = "#b8b59e", dark = "#64746b";

function hardPlan(name: string, color: string, outline: [number, number][], height: number, position: Triple = [0, 0, 0], holes: [number, number][][] = []): ModelPart {
  const value = polygon(name, color, outline, height, position, holes), source = value.vertices!;
  value.vertices = value.indices!.map(i => ({ ...source[i]! })); value.indices = value.vertices.map((_, i) => i); return value;
}

function steps(name: string, count: number, top: number, bottom: number, run: number, width: number, start: [number, number], yaw: number): ModelPart[] {
  const result: ModelPart[] = [], a = yaw * Math.PI / 180, rise = (top - bottom) / count;
  for (let offset = 0; offset < count; offset += 5) {
    const n = Math.min(5, count - offset), profile: [number, number][] = [[0, -bottom]];
    for (let i = 0; i < n; i++) profile.push([i * run, -(top - (offset + i) * rise)], [(i + 1) * run, -(top - (offset + i) * rise)]);
    profile.push([n * run, -bottom]); const value = hardPlan(name, stone, profile, width); value.vertices = value.vertices!.map(p => ({ x: p.x, y: -p.z, z: p.y - width / 2 })); value.position = { x: start[0] + Math.cos(a) * offset * run, y: 0, z: start[1] - Math.sin(a) * offset * run }; value.rotation.y = yaw; result.push(value);
  }
  return result;
}

function solidBoxes(name: string, boxes: { center: Triple; size: Triple }[], color = stone): ModelPart {
  const geometry = new BoxGeometry(1, 1, 1), p = geometry.attributes.position!, cube = Array.from({ length: p.count }, (_, i): Triple => [p.getX(i), p.getY(i), p.getZ(i)]), faces = Array.from(geometry.index!.array), vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
  geometry.dispose();
  for (const item of boxes) { const n = vertices.length; vertices.push(...cube.map(([x, y, z]) => ({ x: item.center[0] + x * item.size[0], y: item.center[1] + y * item.size[1], z: item.center[2] + z * item.size[2] }))); indices.push(...faces.map(i => n + i)); }
  return part(name, "mesh", color, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

function gateSector(name: string, r0: number, r1: number, y0: number, y1: number, start: number, end: number, pivot: Triple, color = steel): ModelPart {
  const value = sweptProfile(name, color, [[r0, y0], [r1, y0], [r1, y1], [r0, y1]], (end - start) * Math.PI / 180, 16); value.position = { x: pivot[0], y: pivot[1], z: pivot[2] }; value.rotation.y = -start; return value;
}

export const landscapeSpaceBatchSixteenDesigns = [
  design("双桁臂平转风暴潮屏障", "两岸球铰连接三角空间桁臂，桁臂托住可浮沉的长弧形分舱门体，两扇在中央止水边合拢而下部接到完整河床门槛，模型为静态闭合形态", () => {
    const startLeft = Math.acos(60 / 78) * 180 / Math.PI, endLeft = Math.acos(20 / 75) * 180 / Math.PI, parts: ModelPart[] = [box("平转屏障贯通两岸的完整低河床", 0, .15, 0, 80, .3, 96, stone)];
    for (const side of [-1, 1]) {
      const pivot: Triple = [side * 60, 0, -45], from = side < 0 ? startLeft : 180 - endLeft, to = side < 0 ? endLeft : 180 - startLeft;
      parts.push(box("球铰与驱动机构实际落地的宽岸台", side * 53, 2, 0, 26, 4, 96, stone), part("传递桁臂受力并允许平转的完整球铰", "sphere", steel, [pivot[0], 5.2, pivot[2]], [3.6, 3.6, 3.6]), gateSector("弧形门下方真实落到河床的连续门槛", 71.8, 78.2, .3, .9, from, to, pivot, stone), gateSector("弧形分舱门连续密闭底板", 72, 78, .9, 1.3, from, to, pivot), gateSector("弧形分舱门连续完整顶板", 72, 78, 9.9, 10.3, from, to, pivot), gateSector("弧形门体外侧完整承水钢壳", 77.6, 78, 1.3, 9.9, from, to, pivot), gateSector("弧形门体内侧完整闭水钢壳", 72, 72.4, 1.3, 9.9, from, to, pivot));
      for (let i = 0; i <= 5; i++) {
        const a = (from + (to - from) * i / 5) * Math.PI / 180, x = pivot[0] + Math.cos(a) * 75, z = pivot[2] + Math.sin(a) * 75, rib = box(i === 0 || i === 5 ? "弧形浮沉门两端完整止水封板" : "浮沉弧门内部真实独立密封舱壁", x, 5.6, z, 6, 9.4, i === 0 || i === 5 ? .35 : .22, steel); rib.rotation.y = -a * 180 / Math.PI; parts.push(rib);
      }
      const joints: Triple[] = [.14, .86].map(t => { const a = (from + (to - from) * t) * Math.PI / 180; return [pivot[0] + Math.cos(a) * 75, 4, pivot[2] + Math.sin(a) * 75]; });
      for (const end of joints) {
        parts.push(rail([pivot[0], 5.2, pivot[2]], end, .5, steel), rail([pivot[0], 6.5, pivot[2]], [end[0], 9.4, end[2]], .5, steel));
        for (let i = 0; i < 4; i++) {
          const t = i / 4, next = (i + 1) / 4, a: Triple = [pivot[0] + (end[0] - pivot[0]) * t, 5.2 + (end[1] - 5.2) * t, pivot[2] + (end[2] - pivot[2]) * t], b: Triple = [pivot[0] + (end[0] - pivot[0]) * next, 6.5 + 2.9 * next, pivot[2] + (end[2] - pivot[2]) * next]; parts.push(rail(a, b, .18, steel));
          if (i) parts.push(rail(a, [a[0], 6.5 + 2.9 * t, a[2]], .18, steel));
        }
      }
      parts.push(rail(joints[0]!, joints[1]!, .35, steel), rail([joints[0]![0], 9.4, joints[0]![2]], [joints[1]![0], 9.4, joints[1]![2]], .35, steel), box("球铰岸台后方独立液压驱动箱", side * 60, 4.8, -35, 4, 1.6, 5, dark));
    }
    parts.push(box("两扇弧门中央压合的实际竖向止水边", 0, 5.6, Math.sqrt(78 ** 2 - 60 ** 2) - 45, .22, 9.4, .45, "#4f6e63"));
    return parts;
  }, "设施", "现代"),
  design("永久式分舱箱体公路浮桥", "空心刚性混凝土浮箱以横隔舱和端壁组成重型桥身，中央车道与两侧带检修孔的步道共同盖在箱体上，连续铰接接岸斜桥、沉底锚缆和落地长引道形成完整跨水道路", () => {
    const parts: ModelPart[] = [], jointMembers: { center: Triple; size: Triple }[] = [];
    for (const x of [-40, -24, -8, 8, 24, 40]) {
      parts.push(box("每段浮箱完整密闭厚底板", x, .625, 0, 15.6, .25, 17, stone), box("浮箱两侧连续完整长边壁", x, 2.025, -8.3, 15.6, 2.55, .4, stone), box("浮箱两侧连续完整长边壁", x, 2.025, 8.3, 15.6, 2.55, .4, stone));
      for (const end of [-1, 1]) parts.push(box("浮箱两端连续闭水短边壁", x + end * 7.65, 2.025, 0, .3, 2.55, 17, stone));
      const bulkheads = solidBoxes("浮箱内部真实独立横隔舱合批", [-5.2, 0, 5.2].map(dx => ({ center: [dx, 2.025, 0] as Triple, size: [.15, 2.55, 16.6] as Triple }))); bulkheads.position.x = x;
      parts.push(bulkheads, box("浮箱上方完整刚性车行盖板", x, 3.45, 0, 15.6, .3, 10, stone), box("中央车道连续独立薄沥青面", x, 3.6125, 0, 15.6, .025, 9.6, dark));
      for (const side of [-1, 1]) {
        const deck = hardPlan("侧方检修步道保留真正能看进浮箱的舱口", paving, [[-7.8, side * 5], [7.8, side * 5], [7.8, side * 8.5], [-7.8, side * 8.5]], .3, [x, 3.3, 0], [[[2, side * 5.7], [5, side * 5.7], [5, side * 7.8], [2, side * 7.8]]]); parts.push(deck, box("浮箱两侧真实落在步道的连续外护壁", x, 4.15, side * 8.3, 15.6, 1.1, .16, steel));
      }
    }
    for (const x of [-32, -16, 0, 16, 32]) {
      parts.push(cylinder("浮箱相接处实际可俯仰的贯通横销", x, 3.3, 0, .18, 17.2, steel, [90, 0, 0]), box("铰接上方同时接平车道和步道的连续伸缩盖板", x, 3.615, 0, .7, .03, 17, steel));
      jointMembers.push({ center: [x, 3.3, 0], size: [.8, .3, 17] });
      for (const z of [-8.3, 8.3]) jointMembers.push({ center: [x, 4.15, z], size: [.7, 1.1, .16] });
    }
    // ACT: 全部十五根接缝承梁/护壁保持真实闭体，仅合批为360顶点以减少独立部件。
    parts.push(solidBoxes("浮箱接缝承梁与连续护壁合批", jointMembers, steel));
    for (const side of [-1, 1]) {
      parts.push(part("浮桥至岸台保持实际坡度的铰接过渡桥", "box", dark, [side * 56, 3.7125, 0], [Math.hypot(16, .475), .3, 10], [0, 0, side * Math.atan2(.475, 16) * 180 / Math.PI]), box("岸端连续道路的完整落地承台", side * 68, 1.85, 0, 8, 3.7, 12, stone), box("与过渡桥平接的高岸车行平台", side * 68, 3.9, 0, 8, .4, 10, dark), ...roadway("固定高岸逐渐降至地面的完整引道", [[side * 72, 3.775, 0], [side * 132, 0, 0]], 10, false, true));
      for (const z of [-1, 1]) parts.push(box("浮桥两端外侧独立沉底锚块", side * 40, .25, z * 14, 2.2, .5, 2.2, stone), pipe("浮箱侧壁实际连接沉底块的锚缆", [side * 40, 2.1, z * 8.3], [side * 40, .5, z * 14], .065));
    }
    return parts;
  }, "设施", "现代"),
  design("交叉折墙顶光峡庭", "两道折墙交错组织三条贯通石廊，双条纵向顶光缝沿高墙边展开，中层步桥从两处真实墙洞穿过，桥端石阶接回低庭形成上下连通游线", () => {
    const parts: ModelPart[] = [box("三条石廊与桥下穿行共用完整低石坪", 0, .1, 0, 44, .2, 38, paving), ...[-1, 1].map(side => box("两侧承顶并保留端头通行的完整外墙", side * 21, 4.6, 0, .6, 8.8, 34, stone)), box("左石廊完整遮蔽屋板", -13.55, 9.15, 0, 15.5, .3, 35, stone), box("中石廊两侧真正留纵向顶光缝的独立屋板", 0, 9.15, 0, 8.4, .3, 35, stone), box("右石廊完整遮蔽屋板", 13.55, 9.15, 0, 15.5, .3, 35, stone)];
    for (const z of [-17, 17]) {
      for (const [x, width] of [[-18.75, 4.5], [-7.25, 8.5], [7.25, 8.5], [18.75, 4.5]]) parts.push(box("三处真实廊门之间的端墙实墩", x!, 4.6, z, width!, 8.8, .6, stone));
      parts.push(box("三处廊门上方完整端头承顶梁", 0, 6.1, z, 42, 5.8, .6, stone));
    }
    for (const x of [-13.5, -3, 3, 13.5]) for (const z of [-12, 12]) parts.push(box("廊内避开主门轴线的独立承顶石柱", x, 4.6, z, .5, 8.8, .5, stone));
    parts.push(box("第一折墙入口处横向实体段", -11.5, 4.5, -15, 13, 8.6, .6, stone), box("第一折墙后段横向实体段", 5.5, 4.5, 4, 21, 8.6, .6, stone), box("第一折墙最后向庭边折回的实体段", 16, 4.5, 10, .6, 8.6, 12, stone), box("第二折墙入口处横向实体段", -6.5, 4.5, -4, 19, 8.6, .6, stone), box("第二折墙后部横向实体段", -6.5, 4.5, 15, 23, 8.6, .6, stone), box("第二折墙前端向入口折回的实体段", -16, 4.5, -9, .6, 8.6, 10, stone));
    for (const [x, from, to] of [[-5, -15, 4], [5, -4, 15]]) {
      for (const [a, b] of [[from!, -1.6], [1.6, to!]]) parts.push(box("折墙步桥穿墙洞两侧真正连续的高墙", x!, 4.5, (a + b) / 2, .6, 8.6, b - a, stone));
      parts.push(box("穿墙桥面下方实际承重的厚墙台", x!, 2.05, 0, .6, 3.7, 3.2, stone), box("穿墙桥廊上方实际闭合承重过梁", x!, 8, 0, .6, 1.6, 3.2, stone));
    }
    parts.push(box("实际穿过两道折墙真洞的中层步桥", 0, 4.05, 0, 16, .3, 2.8, paving));
    for (const side of [-1, 1]) {
      parts.push(box("步桥近端实际落在低坪的独立支墩", side * 7.6, 2.05, 0, .6, 3.7, 2, stone), ...steps("从中层穿墙步桥连续降到两侧石廊的石阶", 20, 4.2, .2, .3, 2.8, [side * 8, 0], side < 0 ? 180 : 0));
      for (const z of [-1.3, 1.3]) parts.push(rail([side * 8, 5.3, z], [side * 14, 1.3, z], .07, steel), box("桥端阶道真正接地的扶手柱", side * 14, .75, z, .07, 1.1, .07, steel));
    }
    for (const z of [-1.3, 1.3]) { parts.push(rail([-8, 5.3, z], [8, 5.3, z], .07, steel)); for (const x of [-8, 0, 8]) parts.push(box("穿墙步桥真实接到楼面的护栏立柱", x, 4.75, z, .07, 1.1, .07, steel)); }
    return parts;
  }, "建筑", "现代"),
];
