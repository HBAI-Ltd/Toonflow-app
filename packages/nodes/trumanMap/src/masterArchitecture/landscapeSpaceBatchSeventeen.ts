import { CatmullRomCurve3, ShapeUtils, Vector2, Vector3 } from "three";
import { part, type ModelPart, type Triple } from "../assetModelParts";
import { polygon, tapered } from "../masterNature/shared";
import { box, colors, design, rail } from "./structures";

const stone = "#a4ad9c", snow = "#d1ddd4", ice = "#b8ceca", steel = "#758a82", wood = "#a4926d";
type TrackPoint = { x: number; y: number; z: number; bank?: number };

function hardPlan(name: string, color: string, outline: [number, number][], height: number, position: Triple = [0, 0, 0]): ModelPart {
  const value = polygon(name, color, outline, height, position), source = value.vertices!;
  value.vertices = value.indices!.map(i => ({ ...source[i]! })); value.indices = value.vertices.map((_, i) => i); return value;
}

function profileBody(name: string, color: string, profile: [number, number][], depth: number): ModelPart {
  const value = polygon(name, color, profile.map(([x, y]) => [x, -y]), depth), original = value.vertices!, count = original.length / 2, vertices = [...original], indices: number[] = [];
  for (let i = 0; i < value.indices!.length; i += 3) { const face = value.indices!.slice(i, i + 3); if (face.every(j => j < count) || face.every(j => j >= count)) indices.push(...face); }
  for (let i = 0; i < count; i++) { const j = (i + 1) % count, n = vertices.length; vertices.push({ ...original[i]! }, { ...original[i + count]! }, { ...original[j + count]! }, { ...original[j]! }); indices.push(n, n + 1, n + 2, n, n + 2, n + 3); }
  value.vertices = vertices.map(p => ({ x: p.x, y: -p.z, z: p.y - depth / 2 })); value.indices = indices; return value;
}

function steps(name: string, count: number, top: number, bottom: number, run: number, width: number, start: [number, number], yaw: number): ModelPart[] {
  const result: ModelPart[] = [], a = yaw * Math.PI / 180, rise = (top - bottom) / count;
  for (let offset = 0; offset < count; offset += 5) {
    const n = Math.min(5, count - offset), profile: [number, number][] = [[0, bottom]];
    for (let i = 0; i < n; i++) profile.push([i * run, top - (offset + i) * rise], [(i + 1) * run, top - (offset + i) * rise]);
    profile.push([n * run, bottom]); const value = profileBody(name, stone, profile, width); value.position = { x: start[0] + Math.cos(a) * offset * run, y: 0, z: start[1] - Math.sin(a) * offset * run }; value.rotation.y = yaw; result.push(value);
  }
  return result;
}

function sweptTrack(name: string, color: string, points: TrackPoint[], section: [number, number][]): ModelPart[] {
  if (ShapeUtils.isClockWise(section.map(([x, y]) => new Vector2(x, y)))) section = [...section].reverse();
  const profile = section.map(([x, y]) => new Vector2(x, y)), caps = ShapeUtils.triangulateShape(profile, []), sides = section.length, result: ModelPart[] = [];
  const frame = (index: number, side: number) => {
    const p = points[index]!, a = points[Math.max(0, index - 1)]!, b = points[Math.min(points.length - 1, index + 1)]!, length = Math.hypot(b.x - a.x, b.z - a.z), nx = (b.z - a.z) / length, nz = -(b.x - a.x) / length, [u, v] = section[side]!, bank = p.bank ?? 0, offset = u * Math.cos(bank) - v * Math.sin(bank);
    return { x: p.x + nx * offset, y: p.y + u * Math.sin(bank) + v * Math.cos(bank), z: p.z + nz * offset };
  };
  // ACT: 15段一件，按截面各边分硬顶点。15点截面的完整冰槽每件510顶点，不截细节或放宽schema。
  for (let start = 0; start < points.length - 1; start += 15) {
    const end = Math.min(points.length - 1, start + 15), centerX = Math.max(-95, Math.min(95, (points[start]!.x + points[end]!.x) / 2)), centerZ = Math.max(-95, Math.min(95, (points[start]!.z + points[end]!.z) / 2)), vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
    for (let row = start; row <= end; row++) {
      for (let side = 0; side < sides; side++) vertices.push(frame(row, side), frame(row, (side + 1) % sides));
      if (row === start) continue;
      const a = (row - start - 1) * sides * 2, b = (row - start) * sides * 2;
      for (let side = 0; side < sides; side++) { const p = a + side * 2, q = b + side * 2; indices.push(p, p + 1, q + 1, p, q + 1, q); }
    }
    for (const row of [start, end]) { const offset = vertices.length; for (let side = 0; side < sides; side++) vertices.push(frame(row, side)); for (const face of caps) indices.push(...(row === start ? [face[2]!, face[1]!, face[0]!] : face).map(i => offset + i)); }
    result.push(part(name, "mesh", color, [centerX, 0, centerZ], [1, 1, 1], [0, 0, 0], { vertices: vertices.map(p => ({ x: p.x - centerX, y: p.y, z: p.z - centerZ })), indices, roughness: color === ice ? .25 : .8 }));
  }
  return result;
}

function smooth(t: number) { const u = Math.max(0, Math.min(1, t)); return u * u * (3 - 2 * u); }
function jumpHeight(z: number): number {
  const nodes = [[-95, 36], [-75, 28], [-50, 16], [-20, 10.8], [0, 11.2]];
  for (let i = 1; i < nodes.length; i++) { const a = nodes[i - 1]!, b = nodes[i]!; if (z <= b[0]!) return a[1]! + (b[1]! - a[1]!) * smooth((z - a[0]!) / (b[0]! - a[0]!)); }
  return 11.2;
}

export const landscapeSpaceBatchSeventeenDesigns = [
  design("完整山体跳台滑雪设施", "高位发滑台连接双助滑细槽和前缘起跳口，独立着陆雪坡与宽退出湾位于前方，带连续扶手的侧阶从地面完整接入发滑台", () => {
    const points: TrackPoint[] = Array.from({ length: 51 }, (_, i) => { const z = -95 + i * 95 / 50; return { x: 0, y: jumpHeight(z), z }; }), cross: [number, number][] = [[-2, 0], [-.65, 0], [-.65, -.04], [-.35, -.04], [-.35, 0], [.35, 0], [.35, -.04], [.65, -.04], [.65, 0], [2, 0], [2, -.3], [-2, -.3]], parts: ModelPart[] = [...sweptTrack("带两道真凹槽且沿坡折连续的助滑桥面", snow, points, cross), box("发滑台完整开放站立面", 0, 35.85, -97.5, 8, .3, 5, stone), ...steps("地面连续进入高位发滑台的正常步高石阶", 180, 36, 0, .3, 2.5, [-3.8, -97.5], 180)];
    for (const z of [-90, -70, -45, -20]) {
      const h = jumpHeight(z);
      for (const x of [-1.6, 1.6]) parts.push(box("助滑桥实际独立落地的高架承重腿", x, (h - .6) / 2, z, .45, h - .6, .6, steel));
      parts.push(rail([-2.1, h - .45, z], [2.1, h - .45, z], .3, steel));
    }
    for (const x of [-3, 3]) parts.push(box("高位发滑台独立落地承重柱", x, 17.85, -98, .6, 35.7, 1.2, steel));
    for (const x of [-1.9, 1.9]) {
      const path: Triple[] = points.map(p => [x, p.y + 1.1, p.z]); parts.push(tapered("随整个助滑曲线连续下降的实际护栏", steel, path, path.map(() => .035)));
      for (const i of [0, 10, 20, 30, 40, 50]) { const p = points[i]!; parts.push(box("助滑护栏实际接在坡板上的短柱", x, p.y + .55, p.z, .07, 1.1, .07, steel)); }
    }
    const landingTop = Array.from({ length: 33 }, (_, i): [number, number] => { const t = i / 32, z = 10 + 135 * t; return [z, .2 + 7.8 * (1 - smooth(t))]; }), landing = profileBody("起跳口前方完整落地的承托着陆山坡", "#a3ad99", [[10, 0], ...landingTop, [145, 0]], 26), snowSlope = profileBody("随完整着陆坡连续下降的薄雪面", snow, [...landingTop, ...landingTop.slice().reverse().map(([z, y]): [number, number] => [z, y + .08])], 24);
    for (const value of [landing, snowSlope]) { value.vertices = value.vertices!.map(p => ({ x: p.z, y: p.y, z: p.x - 77.5 })); value.position.z = 77.5; value.indices = value.indices!.flatMap((i, index, all) => index % 3 === 0 ? [i, all[index + 2]!, all[index + 1]!] : []); parts.push(value); }
    parts.push(hardPlan("着陆坡末端完整展开的宽退出湾", stone, [[-20, 50], [20, 50], [20, 80], [-20, 80]], .2, [0, 0, 95]), hardPlan("宽退出湾同高薄雪铺面", snow, [[-19, 50], [19, 50], [19, 79], [-19, 79]], .03, [0, .2, 95]));
    parts.push(rail([-3.8, 37.1, -99.8], [3.8, 37.1, -99.8], .07, steel), rail([3.8, 37.1, -99.8], [3.8, 37.1, -95.2], .07, steel), rail([-3.8, 37.1, -99.8], [-3.8, 37.1, -98.9], .07, steel), rail([-3.8, 37.1, -96.1], [-3.8, 37.1, -95.2], .07, steel));
    for (const [x, z] of [[-3.8, -99.8], [3.8, -99.8], [3.8, -95.2], [-3.8, -98.9], [-3.8, -96.1]]) parts.push(box("发滑台护栏与实际台面连接的独立短柱", x!, 36.55, z!, .07, 1.1, .07, steel));
    for (const z of [-98.7, -96.3]) {
      parts.push(rail([-3.8, 37.1, z], [-57.8, 1.1, z], .07, steel));
      for (let step = 0; step <= 180; step += 30) parts.push(box("高位发滑台上行石阶连续扶手支柱", -3.8 - step * .3, 36 - step * .2 + .55, z, .07, 1.1, .07, steel));
    }
    return parts;
  }, "设施", "现代"),
  design("双压弯雪橇回旋冰道", "完整半开冰槽沿高差线路连续回旋，弯道截面真正倾斜形成高低弯墙，出发推行台和低位制动出口分离，地面上行阶道接入起点而非回接终点", () => {
    const controls = [[-25, -85], [-25, -45], [-10, -10], [20, 25], [25, 60], [5, 75], [-20, 55], [-25, 20], [-8, -12], [16, -45], [22, -75], [5, -88], [-16, -60]], curve = new CatmullRomCurve3(controls.map(([x, z]) => new Vector3(x!, 0, z!)), false, "centripetal"), points: TrackPoint[] = Array.from({ length: 181 }, (_, i) => {
      const u = i / 180, p = curve.getPointAt(u), a = curve.getTangentAt(Math.max(0, u - .01)), b = curve.getTangentAt(Math.min(1, u + .01)), turn = a.x * b.z - a.z * b.x;
      return { x: p.x, y: 32 - 30 * u, z: p.z, bank: Math.max(-.55, Math.min(.55, turn * 3.5)) * Math.min(1, i / 6, (180 - i) / 6) };
    }), cross: [number, number][] = [[-1.15, 1.6], [-1, 1], [-.7, .4], [0, 0], [.7, .4], [1, 1], [1.15, 1.6], [1.32, 1.6], [1.18, .96], [.88, .26], [.35, -.2], [-.35, -.2], [-.88, .26], [-1.18, .96], [-1.32, 1.6]], parts: ModelPart[] = [...sweptTrack("内外表面与两道高弯墙连续成形的完整雪橇冰槽", ice, points, cross), box("上游实际接入冰槽的完整推行出发台", -25, 31.85, -91, 4.5, .3, 12, stone), ...steps("从地面接入雪橇高位出发台的连续阶道", 160, 32, 0, .3, 2.8, [-27.2, -91], 180)];
    for (let i = 0; i < points.length; i += 15) {
      const p = points[i]!;
      // 固定回旋线路的支墩避开下层冰道投影，穿越处保留真实滑行净空。
      if (points.some((other, j) => Math.abs(i - j) > 15 && other.y < p.y - .4 && Math.hypot(other.x - p.x, other.z - p.z) < 2.2)) continue;
      const a = points[Math.max(0, i - 1)]!, b = points[Math.min(points.length - 1, i + 1)]!, length = Math.hypot(b.x - a.x, b.z - a.z), nx = (b.z - a.z) / length, nz = -(b.x - a.x) / length, bank = p.bank ?? 0, offset = .2 * Math.sin(bank), y = p.y - .2 * Math.cos(bank);
      parts.push(box("回旋冰槽独立落地并接到倾斜槽底的承重墩", p.x + nx * offset, y / 2, p.z + nz * offset, .55, y, .55, steel), rail([p.x + nx * (offset - .35 * Math.cos(bank)), y - .35 * Math.sin(bank), p.z + nz * (offset - .35 * Math.cos(bank))], [p.x + nx * (offset + .35 * Math.cos(bank)), y + .35 * Math.sin(bank), p.z + nz * (offset + .35 * Math.cos(bank))], .14, steel));
    }
    for (const x of [-27, -23]) for (const z of [-95, -87]) parts.push(box("出发推行台独立落地高柱", x, 15.85, z, .45, 31.7, .45, steel), box("出发亭实际接在平台上的短承顶柱", x, 33.55, z, .12, 3.1, .12, steel));
    parts.push(box("雪橇出发推行区完整开放遮雪顶", -25, 35.2, -91, 5, .2, 9, stone));
    for (const z of [-92.35, -89.65]) {
      parts.push(rail([-27.2, 33.1, z], [-75.2, 1.1, z], .07, steel));
      for (const step of [0, 30, 60, 90, 120, 150, 160]) parts.push(box("雪橇发滑台上行阶道实际扶手支柱", -27.2 - step * .3, 32 - step * .2 + .55, z, .07, 1.1, .07, steel));
    }
    const end = points.at(-1)!, previous = points.at(-2)!, length = Math.hypot(end.x - previous.x, end.z - previous.z), dx = (end.x - previous.x) / length, dz = (end.z - previous.z) / length, yaw = Math.atan2(dx, dz) * 180 / Math.PI, braking = box("沿冰槽实际出口切线接出的低位制动平台", end.x + dx * 4, 1.85, end.z + dz * 4, 4.5, .3, 8, stone); braking.rotation.y = yaw; parts.push(braking);
    for (const side of [-1, 1]) { const wall = box("沿制动平台连续接出的独立护墙", end.x + dx * 4 + dz * side * 2.15, 2.65, end.z + dz * 4 - dx * side * 2.15, .2, 1.3, 8, stone); wall.rotation.y = yaw; parts.push(wall); }
    for (const distance of [1, 7]) for (const side of [-1, 1]) parts.push(box("末端制动台实际落地的两侧承重腿", end.x + dx * distance + dz * side * 1.8, .85, end.z + dz * distance - dx * side * 1.8, .4, 1.7, .4, steel));
    parts.push(...steps("沿制动出口真实下降到地面的石阶", 10, 2, 0, .3, 4.1, [end.x + dx * 8, end.z + dz * 8], -Math.atan2(dz, dx) * 180 / Math.PI));
    for (const side of [-1, 1]) {
      parts.push(rail([end.x + dx * 8 + dz * side * 2, 3.1, end.z + dz * 8 - dx * side * 2], [end.x + dx * 11 + dz * side * 2, 1.1, end.z + dz * 11 - dx * side * 2], .07, steel), box("低位制动出口下阶扶手的落地短柱", end.x + dx * 11 + dz * side * 2, .55, end.z + dz * 11 - dx * side * 2, .07, 1.1, .07, steel));
    }
    return parts;
  }, "设施", "现代"),
  design("上水下廊双层桁架渡槽", "顶部完整止水槽和下层贯通检修步廊共用两侧深桁架，岸端门形支墩托住上下弦，两端独立石阶接入下廊，槽端止水门保留静态水位", () => {
    const parts: ModelPart[] = [box("上层连续承水厚底板", 0, 12.2, 0, 70, .4, 8, stone), ...[-1, 1].map(side => box("上层水槽两侧完整止水侧壁", 0, 13.2, side * 3.9, 70, 1.6, .2, stone)), box("上层止水槽内连续静态水面", 0, 13.4, 0, 69.6, .025, 7.5, colors.water), box("下层贯通整个桥跨的检修步行楼面", 0, 5, 0, 70, .3, 4, wood)];
    for (const z of [-4, 4]) {
      parts.push(box("同时承托完整水槽的上部连续桁弦", 0, 11.8, z, 71, .4, .4, steel), box("承托检修下廊并拉结岸端的下部连续桁弦", 0, 4.7, z, 71, .3, .4, steel));
      for (const x of [-35, -21, -7, 7, 21, 35]) parts.push(box("两层共同受力的完整通高桁架腹柱", x, 8.225, z, .3, 6.75, .3, steel));
      for (let i = 0; i < 5; i++) parts.push(rail([-35 + i * 14, i % 2 ? 11.6 : 4.85, z], [-21 + i * 14, i % 2 ? 4.85 : 11.6, z], .25, steel));
    }
    for (const x of [-21, -7, 7, 21]) parts.push(box("横跨两侧下弦并实际托住检修楼面的横梁", x, 4.7, 0, .3, .3, 8.4, steel));
    for (const side of [-1, 1]) {
      for (const z of [-5.2, 5.2]) parts.push(box("不封住下层入廊路线的实际岸端门墩", side * 35, 5.75, z, 1.2, 11.5, 1.2, stone));
      parts.push(box("岸端同时托住两侧上弦的横向顶盖梁", side * 35, 11.75, 0, 2, .5, 12, stone), box("岸端实际承住下廊的独立横梁", side * 35, 4.7, 0, 1.5, .3, 11, stone), box("上层槽端封住静态水体的独立止水门", side * 35, 13.2, 0, .2, 1.6, 7.8, steel), ...steps("岸端实际接入下层贯通廊道的宽石阶", 26, 5.15, 0, .3, 4, [side * 35, 0], side < 0 ? 180 : 0));
      for (const z of [-1.9, 1.9]) parts.push(rail([side * 35, 6.25, z], [side * 42.8, 1.1, z], .07, steel), box("渡槽下廊登岸阶道真正落地的扶手柱", side * 42.8, .55, z, .07, 1.1, .07, steel));
    }
    for (const z of [-1.9, 1.9]) { parts.push(rail([-35, 6.25, z], [35, 6.25, z], .07, steel)); for (const x of [-35, -21, -7, 7, 21, 35]) parts.push(box("下层贯通步廊真实接到楼面的护栏柱", x, 5.7, z, .07, 1.1, .07, steel)); }
    return parts;
  }, "设施", "现代"),
];
