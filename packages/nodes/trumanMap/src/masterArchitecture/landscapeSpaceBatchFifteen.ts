import { CatmullRomCurve3, Vector3 } from "three";
import { part, pitchedRoof, type ModelPart, type Triple } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { box, colors, cylinder, design, pipe, rail } from "./structures";

// 固定石舫与潮汐石沪的类型参考；原创建筑轮廓，不复制地标测绘。
// https://gygl.beijing.gov.cn/whgy/whgy_wsgc/201912/t20191206_885544.html
// https://twh.boch.gov.tw/tw18/index16.htm
const stone = "#a9aa97", rock = "#929d8a", wood = "#8f7c58", roofColor = "#72867b", steel = "#718881", salt = "#d5d3b7";

function hardPlan(name: string, color: string, outline: [number, number][], height: number, position: Triple = [0, 0, 0], holes: [number, number][][] = []): ModelPart {
  const value = polygon(name, color, outline, height, position, holes), source = value.vertices!;
  value.vertices = value.indices!.map(i => ({ ...source[i]! })); value.indices = value.vertices.map((_, i) => i); return value;
}

function profileBody(name: string, color: string, profile: [number, number][], depth: number): ModelPart {
  const value = polygon(name, color, profile.map(([x, y]) => [x, -y]), depth), original = value.vertices!, count = original.length / 2, vertices = [...original], indices: number[] = [];
  for (let i = 0; i < value.indices!.length; i += 3) { const face = value.indices!.slice(i, i + 3); if (face.every(j => j < count) || face.every(j => j >= count)) indices.push(...face); }
  for (let i = 0; i < count; i++) { const j = (i + 1) % count, n = vertices.length; vertices.push({ ...original[i]! }, { ...original[i + count]! }, { ...original[j + count]! }, { ...original[j]! }); indices.push(n, n + 1, n + 2, n, n + 2, n + 3); }
  value.vertices = vertices.map(p => ({ x: p.x, y: -p.z, z: p.y - depth / 2 })); value.indices = indices; return value;
}

function steps(name: string, count: number, top: number, bottom: number, run: number, width: number, start: [number, number], yaw: number): ModelPart[] {
  const result: ModelPart[] = [], rise = (top - bottom) / count, a = yaw * Math.PI / 180;
  for (let offset = 0; offset < count; offset += 5) {
    const n = Math.min(5, count - offset), profile: [number, number][] = [[0, bottom]];
    for (let i = 0; i < n; i++) profile.push([i * run, top - (offset + i) * rise], [(i + 1) * run, top - (offset + i) * rise]);
    profile.push([n * run, bottom]); const value = profileBody(name, stone, profile, width); value.position = { x: start[0] + Math.cos(a) * offset * run, y: 0, z: start[1] - Math.sin(a) * offset * run }; value.rotation.y = yaw; result.push(value);
  }
  return result;
}

function standingWall(name: string, a: [number, number], b: [number, number], y: number, height: number, thickness = .2): ModelPart {
  const dx = b[0] - a[0], dz = b[1] - a[1], value = box(name, (a[0] + b[0]) / 2, y + height / 2, (a[1] + b[1]) / 2, Math.hypot(dx, dz), height, thickness, stone); value.rotation.y = -Math.atan2(dz, dx) * 180 / Math.PI; return value;
}

function stoneHull(outline: [number, number][]): ModelPart {
  const vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [], n = outline.length;
  for (let i = 0; i < n; i++) {
    const a = outline[i]!, b = outline[(i + 1) % n]!, offset = vertices.length;
    vertices.push({ x: a[0] * .7, y: .4, z: a[1] * .7 }, { x: b[0] * .7, y: .4, z: b[1] * .7 }, { x: b[0], y: 2.6, z: b[1] }, { x: a[0], y: 2.6, z: a[1] }); indices.push(offset, offset + 3, offset + 2, offset, offset + 2, offset + 1);
  }
  for (const [scale, y] of [[.7, .4], [1, 2.6]]) {
    const face = polygon("石船身完整端盖", stone, outline.map(([x, z]) => [x * scale!, z * scale!]), .01), count = face.vertices!.length / 2, offset = vertices.length;
    vertices.push(...face.vertices!.slice(0, count).map(p => ({ x: p.x, y: y!, z: p.z })));
    for (let i = 0; i < face.indices!.length; i += 3) {
      const tri = face.indices!.slice(i, i + 3); if (!tri.every(j => j < count)) continue;
      indices.push(offset + tri[0]!, offset + tri[scale === .7 ? 1 : 2]!, offset + tri[scale === .7 ? 2 : 1]!);
    }
  }
  return part("由窄底外放到宽甲板并固定于石础上的完整石船体", "mesh", stone, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

function fanSolid(name: string, color: string, outline: [number, number][], top: (x: number, z: number) => number, bottom: number): ModelPart {
  const n = outline.length, clockwise = outline.reduce((sum, [x, z], i) => { const b = outline[(i + 1) % n]!; return sum + x * b[1] - z * b[0]; }, 0) < 0, vertices = [{ x: 0, y: top(0, 0), z: 0 }, ...outline.map(([x, z]) => ({ x, y: top(x, z), z })), { x: 0, y: bottom, z: 0 }, ...outline.map(([x, z]) => ({ x, y: bottom, z }))], indices: number[] = [];
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n, a = 1 + i, b = 1 + j, low = n + 1;
    indices.push(...(clockwise ? [0, a, b, low, low + b, low + a] : [0, b, a, low, low + a, low + b]));
    const start = vertices.length, points = clockwise ? [vertices[a]!, vertices[low + a]!, vertices[low + b]!, vertices[b]!] : [vertices[a]!, vertices[b]!, vertices[low + b]!, vertices[low + a]!]; vertices.push(...points.map(p => ({ ...p }))); indices.push(start, start + 1, start + 2, start, start + 2, start + 3);
  }
  return part(name, "mesh", color, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

export const landscapeSpaceBatchFifteenDesigns = [
  design("双洞回阶人工假山游园", "厚假岩体内两道真拱洞从前后贯通，侧置石阶连上岩壁外挑游廊，前后步道绕岩侧相接，凸脊岩块不填塞洞口或上行路线", () => {
    const profile: [number, number][] = [[-13, 0]];
    for (const center of [-6, 6]) { profile.push([center - 3, 0], [center - 3, 1.2]); for (let i = 1; i <= 10; i++) { const a = Math.PI - i * Math.PI / 10; profile.push([center + Math.cos(a) * 3, 1.2 + Math.sin(a) * 3]); } profile.push([center + 3, 0]); }
    profile.push([13, 0], [13, 5.2], [10.5, 6], [11, 8], [7.8, 7.5], [7.3, 9.3], [4.5, 8.8], [4.2, 7.3], [1.5, 8], [0, 10], [-2, 9], [-3, 7.1], [-6, 8.5], [-8, 6], [-10, 6.5], [-11, 4.8], [-13, 5.3]);
    const parts: ModelPart[] = [box("假山与洞中步行共用完整低石坪", 0, .1, 0, 48, .2, 24, stone), profileBody("两个洞口均贯通整片厚假岩的主体", rock, profile, 12), box("前岩壁外侧连续挑出步道", 0, 5.2, -6.7, 24, .2, 1.4, stone), box("后岩壁外侧连续挑出步道", 0, 5.2, 6.7, 24, .2, 1.4, stone), box("前后步道从岩体左侧实际绕接的侧廊", -13.7, 5.2, 0, 1.4, .2, 13.4, stone), ...steps("前洞一侧通往高岩壁步道的正常石阶", 28, 5.3, .2, .3, 1.4, [-14.4, -6.7], 180), ...steps("高岩壁后步道另一端正常落地石阶", 28, 5.3, .2, .3, 1.4, [12, 6.7], 0)];
    for (const side of [-1, 1]) {
      for (const x of [-11.3, 0, 11.3]) parts.push(box("嵌入实岩而不挡洞的游廊石托臂", x, 4.95, side * 6.3, 1.1, .3, 1.6, rock));
      parts.push(rail([-12, 6.4, side * 7.35], [12, 6.4, side * 7.35], .07, roofColor));
      parts.push(box("连接前后廊与绕岩侧廊的真实转角平台", -12.85, 5.2, side * 6.7, 3.1, .2, 1.4, stone), rail([-14.35, 6.4, side * 7.35], [-12, 6.4, side * 7.35], .07, roofColor), rail([-14.35, 6.4, side * 7.35], [-14.35, 6.4, side * 6.7], .07, roofColor), box("转角平台外缘真正落脚的护栏柱", -14.35, 5.85, side * 7.35, .07, 1.1, .07, roofColor));
      for (const x of [-12, -6, 0, 6, 12]) parts.push(box("岩壁游廊实际落在路面的护栏柱", x, 5.85, side * 7.35, .07, 1.1, .07, roofColor));
    }
    for (const z of [-4, 0, 4]) parts.push(box("岩侧转廊嵌入假山的独立石托臂", -13.3, 4.95, z, 1.6, .3, 1.1, rock), box("岩侧转廊实际落在路面的护栏柱", -14.35, 5.85, z, .07, 1.1, .07, roofColor));
    parts.push(rail([-14.35, 6.4, -6.7], [-14.35, 6.4, 6.7], .07, roofColor));
    for (const [x, y, z, w, h, d] of [[-10, 6.6, -5.9, 3, 2.8, 2], [-5, 7.8, -5.9, 3, 2.5, 2], [.2, 9.2, -4.5, 4, 2.8, 3], [7.4, 8.5, -4.8, 3.5, 2.6, 3], [11.1, 5.5, 5.8, 2.5, 2.2, 2]]) {
      const vertices = [[0, .8, 0], [.5, 0, 0], [0, 0, .5], [-.5, 0, 0], [0, 0, -.5], [0, -.7, 0]].map(([a, b, c]) => ({ x: a! * w!, y: b! * h!, z: c! * d! }));
      parts.push(part("不遮拱口且嵌入大体的独立天然感凸石脊", "mesh", rock, [x!, y!, z!], [1, 1, 1], [0, x! * 9, 0], { vertices, indices: [0, 2, 1, 0, 3, 2, 0, 4, 3, 0, 1, 4, 5, 1, 2, 5, 2, 3, 5, 3, 4, 5, 4, 1], roughness: .95 }));
    }
    return parts;
  }, "建筑", "中式"),
  design("固定园林石舫厅", "石础上固定的外放船形厚台承托可进入的舫厅，前后门贯通两侧游廊和露天舟首，舷边在接岸桥处真实留口，岸桥末端由石阶连回地面", () => {
    const outline: [number, number][] = [[-5, 14], [-6, 8], [-6, -10], [-4.5, -16], [0, -20], [4.5, -16], [6, -10], [6, 8], [5, 14]], parts: ModelPart[] = [stoneHull(outline), hardPlan("整片船形甲板上的完整可通行铺地", stone, outline, .25, [0, 2.6, 0])];
    for (const x of [-3, 3]) for (const z of [-7, 7]) parts.push(box("固定石船真实落地的宽石础", x, .2, z, 3.5, .4, 3.5, stone));
    for (const x of [-4, 4]) for (const z of [-8, -1, 6]) parts.push(box("舫厅承檐独立木柱", x, 4.65, z, .22, 3.6, .22, wood));
    for (const z of [-8, -1, 6]) parts.push(box("接在舫厅柱顶且实际托住檐口的横梁", 0, 6.55, z, 10.6, .2, .2, wood), rail([-5.28, 6.65, z], [0, 7.94, z], .14, wood), rail([0, 7.94, z], [5.28, 6.65, z], .14, wood));
    for (const side of [-1, 1]) for (const z of [-4.5, 2.5]) parts.push(box("舫厅两侧窗口下方连续矮墙", side * 3.9, 3.3, z, .2, .9, 7, stone), part("舫厅两侧可透视的长窗", "box", colors.glass, [side * 3.9, 4.95, z], [.04, 2.4, 6.7], [0, 0, 0], { opacity: .3 }));
    for (const z of [-8, 6]) { for (const x of [-2.7, 2.7]) parts.push(box("前后舫厅真门两侧完整墙垛", x, 4.65, z, 2.6, 3.6, .2, stone)); parts.push(box("前后舫厅真门上方连续门楣", 0, 5.9, z, 2.8, 1.1, .2, stone)); }
    const cover = pitchedRoof("舫厅完整曲檐双坡屋盖", roofColor, 12, 18, 6.65, true); cover.position.z = -1; for (const p of cover.profile!) p.y *= 3; parts.push(cover);
    for (let i = 0; i < outline.length; i++) {
      const a = outline[i]!, b = outline[(i + 1) % outline.length]!;
      if (i === 7) parts.push(standingWall("接岸口前侧保留真实断口的石舷", a, [5.9, 8.6], 2.85, 1), standingWall("接岸口后侧保留真实断口的石舷", [5.43, 11.4], b, 2.85, 1));
      else parts.push(standingWall("船形甲板外侧连续石舷矮栏", a, b, 2.85, 1));
    }
    parts.push(box("从石舫侧门口实际接向岸边的长桥面", 12.7, 2.7, 10, 14.6, .3, 2.4, stone), ...steps("接岸桥末端真正落回地面的石阶", 15, 2.85, 0, .3, 2.4, [20, 10], 0));
    for (const x of [12, 20]) parts.push(box("石舫接岸桥独立落地承托墩", x, 1.275, 10, .6, 2.55, 1.8, stone));
    for (const z of [8.9, 11.1]) { parts.push(rail([5.4, 3.95, z], [20, 3.95, z], .07, roofColor)); for (const x of [6, 13, 20]) parts.push(box("石舫接岸桥真实落在桥面的栏杆柱", x, 3.4, z, .07, 1.1, .07, roofColor)); }
    return parts;
  }, "建筑", "中式"),
  design("引潮蒸发结晶盐田整体", "完整连续堤网把收潮池、蒸发区和浅结晶盘接到中央引潮渠，各分水口在堤内真实留洞并有独立闸槽，跨渠操作桥连通两侧堤道，盐水为静态工况示意", () => {
    const parts: ModelPart[] = [box("整个盐田堤网共用连续落地浅基底", 0, .15, 0, 90, .3, 96, "#b2aa87"), ...[-1, 1].map(side => box("盐田两侧连续外堤", side * 43.5, 1.1, 0, 3, 1.6, 96, stone)), box("盐田南侧完整外堤", 0, 1.1, 46.5, 90, 1.6, 3, stone), ...[-1, 1].map(side => box("引潮总闸两侧真正留口的外堤", side * 24, 1.1, -46.5, 42, 1.6, 3, stone)), box("中央连续引潮明渠静态水面", 0, 1.1, -1, 5.5, .025, 90, colors.water)];
    for (const side of [-1, 1]) {
      for (const [from, to] of [[-44, -31], [-29, -1], [1, 29], [31, 44]]) parts.push(box("分水闸口之间真实连续的渠侧堤", side * 3, .95, (from! + to!) / 2, .5, 1.3, to! - from!, stone));
      for (const z of [-15, 15]) parts.push(box("中央引潮渠两侧连续横分田堤", side * 22.5, .9, z, 39, 1.2, 2, stone));
      for (const z of [-30, 0, 30]) {
        for (const edge of [-1, 1]) parts.push(box("分水闸门两侧独立高槽柱", side * 3, 1.4, z + edge * 1.05, .55, 2.2, .25, stone));
        parts.push(box("分水闸槽之间完整闭水闸板", side * 3, .9, z, .12, 1.2, 1.9, steel), box("分水闸上方真实启闭横梁", side * 3, 2.5, z, .65, .2, 2.4, steel), cylinder("分水闸板实际连接的竖向启闭杆", side * 3, 1.8, z, .07, 1.4, steel));
      }
    }
    parts.push(box("收潮后送入左上蒸发池的静态盐水面", -22.5, 1.3, -30, 38.2, .025, 27.4, "#9db8a8"), box("左中蒸发区真实低水位静态面", -22.5, 1, 0, 38.2, .025, 27.4, "#b6c3ad"), box("左下浓缩盐水静态水面", -22.5, .7, 30, 38.2, .025, 27.4, "#c1c6aa"), box("右上收潮池静态水面", 22.5, 1.25, -30, 38.2, .025, 27.4, "#95b4a7"), box("右中蒸发区静态盐水面", 22.5, .95, 0, 38.2, .025, 27.4, "#b1c0a7"));
    for (const x of [15.5, 28.5]) parts.push(box("浅结晶区之间独立连续田埂", x, .75, 30, 1, .9, 28, stone));
    for (const [x, width] of [[9.5, 10.5], [22, 11], [35.5, 11.5]]) parts.push(box("浅结晶盘内实际铺于低田底的白盐层", x!, .4, 30, width!, .2, 27, salt), part("结晶盘内低于田埂的薄盐水面", "box", "#cdd3bd", [x!, .6, 30], [width!, .025, 27], [0, 0, 0], { opacity: .4 }));
    for (const z of [-15, 15]) parts.push(box("跨过引潮明渠的连续操作小桥", 0, 1.4, z, 6.5, .2, 2, stone));
    parts.push(box("引潮总闸完整可闭主闸板", 0, 1.15, -46.5, 6, 1.7, .2, steel), box("引潮总闸两柱之间的实际启闭梁", 0, 3.15, -46.5, 7, .3, .7, steel));
    for (const x of [-3.2, 3.2]) parts.push(box("主引潮闸真实落在底坪的承重槽柱", x, 1.8, -46.5, .5, 3, .7, stone));
    for (const x of [-35, -28]) { const heap = profileBody("结晶区边缘暂存的低长形原盐堆", salt, [[-2.5, .3], [2.5, .3], [0, 1.5]], 5); heap.position.x = x; heap.position.z = 39; parts.push(heap); }
    return parts;
  }, "设施", "中式"),
  design("心形低堰石沪潮池", "厚石堤从宽压滩底收至可巡行窄堤顶，完整回游围域封到有缓坡的潮滩底，静态退潮池位低于堤顶，高水越过低堤进入围域的传统捕渔类型", () => {
    const controls = [[0, -12], [-8, -16], [-17, -25], [-28, -23], [-35, -12], [-30, 6], [-15, 22], [0, 34], [15, 22], [30, 6], [35, -12], [28, -23], [17, -25], [8, -16]], curve = new CatmullRomCurve3(controls.map(([x, z]) => new Vector3(x!, 0, z!)), true, "centripetal"), points = Array.from({ length: 64 }, (_, i) => curve.getPointAt(i / 64)), normal = (i: number) => { const a = points[(i + 63) % 64]!, b = points[(i + 1) % 64]!, length = Math.hypot(b.x - a.x, b.z - a.z); return [-(b.z - a.z) / length, (b.x - a.x) / length]; }, ground = (_x: number, z: number) => .3 + .8 * Math.max(0, Math.min(1, (-z - 5) / 25)), footprint: [number, number][] = points.map((p, i) => { const [nx, nz] = normal(i); return [p.x + nx! * 2, p.z + nz! * 2]; }), parts: ModelPart[] = [fanSolid("完整承托石堤两侧宽脚和内部潮池的缓坡滩底", "#aca78b", footprint, ground, 0)];
    for (const start of [0, 32]) {
      const vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
      for (let i = 0; i <= 32; i++) {
        const k = (start + i) % 64, p = points[k]!, [nx, nz] = normal(k), bottom = ground(p.x, p.z) - .08, top = ground(p.x, p.z) + 1.6 + .12 * Math.sin(k * Math.PI / 8);
        for (const [side, y, half] of [[-1, top, .65], [1, top, .65], [-1, bottom, 1.8], [1, bottom, 1.8], [-1, top, .65], [-1, bottom, 1.8], [1, top, .65], [1, bottom, 1.8]]) vertices.push({ x: p.x + nx! * side! * half!, y: y!, z: p.z + nz! * side! * half! });
        if (!i) continue; const a = (i - 1) * 8, b = i * 8; indices.push(a, a + 1, b, a + 1, b + 1, b, a + 2, b + 2, a + 3, a + 3, b + 2, b + 3, a + 4, b + 4, a + 5, a + 5, b + 4, b + 5, a + 6, a + 7, b + 6, a + 7, b + 7, b + 6);
      }
      for (const [offset, face] of [[0, [0, 2, 3, 1]], [32 * 8, [0, 1, 3, 2]]] as const) { const n = vertices.length; vertices.push(...face.map(i => ({ ...vertices[offset + i]! }))); indices.push(n, n + 1, n + 2, n, n + 2, n + 3); }
      parts.push(part("连续封到潮滩底且上窄下宽的完整石沪低堤", "mesh", "#879582", [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices }));
    }
    const inner: [number, number][] = points.map((p, i) => { const [nx, nz] = normal(i); return [p.x - nx! * 1.85, p.z - nz! * 1.85]; }), water = fanSolid("完整低堤内部退潮后低于堤顶的静态潮池", colors.water, inner, () => 1.25, 1.22); water.opacity = .6; water.roughness = .25; parts.push(water);
    return parts;
  }, "设施", "中式"),
];
