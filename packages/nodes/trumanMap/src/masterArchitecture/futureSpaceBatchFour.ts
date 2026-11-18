import { part, ring, type ModelPart, type Triple } from "../assetModelParts";
import { combineMeshes, polygon } from "../masterNature/shared";
import { barrelRoof, halfRoundWall, rectangularFlue } from "./spatialShells";
import { base, box, colors, cylinder, design, pipe, rail, type ArchitecturePrototype } from "./structures";
import { triangleShell } from "./futureSpaceBatchOne";
import { sectorSlab } from "./futureSpaceBatchTwo";

const steel = "#74868c", pale = "#acb4af", dark = "#46555a", stone = "#9f917a", wood = "#968164";

function gate(name: string, width: number, height: number, position: Triple, depth = 0.3): ModelPart[] {
  const [x, y, z] = position;
  return [box(`${name}侧框`, x - width / 2 - 0.15, y + height / 2, z, 0.3, height, depth, dark), box(`${name}侧框`, x + width / 2 + 0.15, y + height / 2, z, 0.3, height, depth, dark), box(`${name}顶框`, x, y + height + 0.15, z, width + 0.6, 0.3, depth, dark)];
}

export const futureSpaceBatchFourDesigns: ArchitecturePrototype[] = [
  design("扭转三角连腹高楼", "三角形楼层围绕连续塔芯逐层错转，三条曲线边柱沿楼角上升，扭转立面以独立三角薄板连接，首层一面形成开放入口", () => {
    const parts: ModelPart[] = [base(42, 42, 0.5), box("贯通三角楼服务塔芯", 0, 19.4, 0, 4.2, 37.8, 4.2, dark)], skins: ModelPart[] = [];
    const corners = Array.from({ length: 9 }, (_, level) => Array.from({ length: 3 }, (_, corner) => { const a = corner * Math.PI * 2 / 3 + level * Math.PI / 36; return [Math.cos(a) * 15.5, 0.8 + level * 4.6, Math.sin(a) * 15.5] as Triple; }));
    for (let level = 0; level < corners.length; level++) {
      const ring = corners[level]!, floor = polygon(level === 8 ? "完整三角平屋盖" : "沿塔芯错转的三角楼板", level === 8 ? pale : steel, ring.map(([x, , z]) => [x, z]), 0.24, [0, ring[0]![1], 0], [[[-2.3, -2.3], [2.3, -2.3], [2.3, 2.3], [-2.3, 2.3]]]); parts.push(floor);
      for (const corner of ring) parts.push(rail([0, corner[1] - 0.18, 0], [corner[0], corner[1] - 0.18, corner[2]], 0.25, dark));
      if (!level) continue;
      for (let edge = 0; edge < 3; edge++) {
        if (level === 1 && edge === 0) continue;
        const next = (edge + 1) % 3, a = corners[level - 1]![edge]!, b = corners[level - 1]![next]!, c = ring[edge]!, d = ring[next]!;
        skins.push(triangleShell("扭转楼面三角玻璃壁", a, b, c, 0.09, colors.glass), triangleShell("扭转楼面三角玻璃壁", b, d, c, 0.09, colors.glass));
      }
    }
    for (let offset = 0; offset < skins.length; offset += 16) { const mesh = combineMeshes("分面闭合的扭转外壁", colors.glass, skins.slice(offset, offset + 16)); mesh.opacity = 0.42; parts.push(mesh); }
    for (let corner = 0; corner < 3; corner++) parts.push(part("沿楼角上升的连续曲柱", "tube", dark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: 0.25, path: corners.map(ring => ({ x: ring[corner]![0], y: ring[corner]![1], z: ring[corner]![2] })) }));
    return parts;
  }, "建筑", "赛博朋克"),
  design("浮筒缆悬海洋科研城", "三根封闭长浮筒托起低层科研甲板，四角高桅用拉索悬承上层观测露台，实验廊和住宿翼分列中央海风通道", () => {
    const parts: ModelPart[] = [box("低层贯通科研甲板", 0, 5, 0, 34, 0.5, 43, steel), ...[-10, 0, 10].map(x => cylinder("独立封闭长浮筒", x, 2, 0, 4, 48, dark, [90, 0, 0]))];
    for (const z of [-18, -9, 0, 9, 18]) parts.push(box("浮筒向甲板传力横梁", 0, 4.4, z, 29, 1, 0.5, steel));
    for (const side of [-1, 1]) {
      parts.push(box("低层科研翼通长楼板", side * 8.7, 5.4, 0, 10, 0.3, 34, steel), box("科研翼外侧薄围护", side * 13.6, 8.2, 0, 0.18, 5.3, 34, pale), box("科研翼上部观测露台", side * 8.7, 11, 0, 10.5, 0.3, 35, steel));
      for (const z of [-14, 0, 14]) parts.push(box("科研翼分间隔墙", side * 8.7, 8.2, z, 9.7, 5.3, 0.16, pale));
      for (const z of [-18, 18]) parts.push(box("甲板边缘高桅", side * 15, 11.7, z, 0.3, 13, 0.3, dark), pipe("高桅悬承上露台的斜索", [side * 15, 18.2, z], [side * 8.7, 11.1, z * 0.65], 0.06));
      parts.push(part("科研露台内缘接实甲板的连续低玻璃护壁", "box", colors.glass, [side * 3.5, 11.625, 0], [0.055, 0.95, 34], [0, 0, 0], { opacity: 0.3 }));
    }
    parts.push(box("两翼后端接驳甲板", 0, 11, 17, 27.5, 0.3, 2.5, steel), ...gate("中央甲板进入通道", 4.5, 4.2, [0, 5.25, -18]), box("甲板前端低位样本工作台", 0, 6.05, -13.5, 4, 1.6, 2.4, wood));
    return parts;
  }, "建筑", "科幻"),
  design("背脊外挑风塔公社", "中央厚服务脊连续托住两侧外挑的生活翼，三座中空风塔越过屋面，底层穿堂和上层生活外廊沿不同高度相接", () => {
    const parts: ModelPart[] = [base(43, 53, 0.5), box("贯通公社中央服务厚脊", 0, 7.2, 0, 3.6, 13.4, 47, dark), ...[-1, 1].map(s => box("底层中央穿堂侧板", s * 4, 0.8, 0, 4.2, 0.6, 48, steel))];
    for (const side of [-1, 1]) {
      parts.push(box("外挑生活翼楼板", side * 10.3, 5.5, 0, 17.5, 0.4, 45, steel), box("外挑生活翼屋盖", side * 10.3, 11.6, 0, 18.3, 0.25, 46, pale), box("生活翼外缘透光薄壁", side * 18.8, 8.6, 0, 0.12, 5.8, 44, colors.glass));
      for (const z of [-18, -6, 6, 18]) parts.push(rail([side * 1.6, 2.7, z], [side * 17, 5.3, z], 0.45, dark), box("生活翼独立分间隔墙", side * 11, 8.6, z, 15.5, 5.8, 0.18, pale));
      parts.push(box("公社服务脊外侧连续走廊", side * 3.5, 5.8, 0, 2.8, 0.25, 46, steel));
    }
    for (const z of [-16, 0, 16]) parts.push(rectangularFlue("上通屋面下接生活层的中空风塔", 4, 5, 12, 0.25, [0, 9.8, z], pale), box("风塔顶端悬空遮雨帽", 0, 22.7, z, 5.4, 0.25, 6.4, steel), ...[-1, 1].map(s => box("风塔帽短支柱", s * 1.7, 22.2, z, 0.15, 0.9, 0.15, dark)));
    parts.push(...gate("中央服务脊前端通高入口", 5.3, 4, [0, 0.5, -24], 0.35));
    return parts;
  }, "建筑", "科幻"),
  design("垂直峡谷阶台市政中心", "两侧逐层外退的市民服务阶台围成高峡谷，后端纵向塔厅连接各层，地面广场和高位开放议事台连续对望", () => {
    const parts: ModelPart[] = [base(59, 47, 0.5), box("峡谷市政中心后部塔厅背壁", 0, 17.2, 20, 43, 33.4, 0.3, dark), ...[-1, 1].map(s => box("后部塔厅两端围护", s * 21.35, 17.2, 17.5, 0.3, 33.4, 5.2, dark)), box("地面开放市民广场", 0, 0.85, -4, 16, 0.7, 34, stone)];
    for (let level = 0; level < 5; level++) parts.push(box("背部塔厅通长接驳层板", 0, 2.2 + level * 6.5, 17.5, 43, 0.3, 5.2, steel));
    for (const side of [-1, 1]) {
      for (let level = 0; level < 5; level++) {
        const y = 2.2 + level * 6.5, x = side * (8.7 + level * 3.5);
        parts.push(box("峡谷内侧阶退服务楼层", x, y, -1, 7.4, 0.3, 33, steel), box("阶台外侧服务厅背壁", x + side * 3.55, y + 2.8, -1, 0.18, 5.2, 33, pale), box("阶台后端通入塔厅的接板", x, y, 16.3, 7.4, 0.3, 2.4, steel), part("服务阶台内侧贴实层板的低玻璃护壁", "box", colors.glass, [x - side * 3.5, y + 0.675, -1], [0.065, 1.05, 32], [0, 0, 0], { opacity: 0.3 }));
        if (level) parts.push(rail([side * (8.7 + (level - 1) * 3.5), y - 6.3, 12.5], [x, y - 0.1, 12.5], 0.45, dark));
      }
      parts.push(box("最外侧通高服务电梯井", side * 26.7, 16.8, 14, 3.8, 32.6, 5, pale));
    }
    parts.push(box("峡谷后端高位议事连接台", 0, 28.3, 12, 44, 0.4, 5.8, steel), ...[-1, 1].map(s => part("高位议事连接台贴实桥板的低玻璃护壁", "box", colors.glass, [0, 29.0175, 12 + s * 2.6], [42, 1.035, 0.07], [0, 0, 0], { opacity: 0.3 })), box("后部市政塔厅平屋盖", 0, 34.025, 17.5, 44, 0.25, 6.2, pale));
    return parts;
  }, "建筑", "赛博朋克"),
  design("双翼斜面张索公寓", "两座向外倾斜的薄板住宅翼通过屋顶张索向后锚固，各层楼板保持水平并逐层移位，中央底层通路保持开放", () => {
    const parts: ModelPart[] = [base(51, 31, 0.5)];
    for (const side of [-1, 1]) {
      for (const z of [-10.5, 10.5]) parts.push(rail([side * 7.5, 0.5, z], [side * 17.1, 38.5, z], 0.65, dark));
      for (let level = 0; level < 9; level++) {
        const y = 1.1 + level * 4.5, x = side * (7.5 + y / 38 * 9.6);
        parts.push(box("外倾住宅翼水平楼板", x, y, 0, 7.5, 0.25, 24, steel), box("住宅翼外缘透光立面", x + side * 3.5, y + 2.1, 0, 0.1, 3.95, 23.5, colors.glass), box("住宅翼后服务隔墙", x, y + 2.1, 11.8, 7.3, 3.95, 0.18, pale));
      }
      parts.push(box("后侧张索锚固高桅", side * 4.2, 22, 13.4, 0.65, 43, 0.65, dark), pipe("斜住宅翼主张索", [side * 17.1, 38.5, 10.5], [side * 4.2, 43.5, 13.4], 0.1), pipe("高桅反向落地锚索", [side * 4.2, 43.5, 13.4], [side * 1.2, 0.7, 14.8], 0.1), box("住宅翼顶层覆盖板", side * 17.1, 41.3, 0, 8.3, 0.25, 24.8, pale));
    }
    parts.push(box("地面两翼公共接待台", 0, 1.1, -9, 5, 1.2, 2, stone), ...gate("中央双翼间穿堂框", 8, 5.5, [0, 0.5, -13], 0.4));
    return parts;
  }, "建筑", "赛博朋克"),
  design("方锥采光高塔馆", "四条连续斜棱围出高方锥形展馆，层板随外壳收分并保留中央通井，顶部窄天光口和首层敞口形成竖向采光通道", () => {
    const parts: ModelPart[] = [base(45, 45, 0.5)], bottoms: Triple[] = [[-18, 0.5, -18], [18, 0.5, -18], [18, 0.5, 18], [-18, 0.5, 18]], tops: Triple[] = [[-2.5, 48, -2.5], [2.5, 48, -2.5], [2.5, 48, 2.5], [-2.5, 48, 2.5]];
    for (let face = 0; face < 4; face++) {
      const next = (face + 1) % 4, a = bottoms[face]!, b = bottoms[next]!, c = tops[face]!, d = tops[next]!;
      parts.push(rail(a, c, 0.5, dark));
      if (face) parts.push(triangleShell("内收方锥馆体的薄玻璃壳面", a, b, c, 0.12, colors.glass), triangleShell("内收方锥馆体的薄玻璃壳面", b, d, c, 0.12, colors.glass));
      else parts.push(triangleShell("正面门庭上方收分壳片", [-15.7, 7.5, -15.7], [15.7, 7.5, -15.7], c, 0.12, colors.glass), triangleShell("正面门庭上方收分壳片", [15.7, 7.5, -15.7], d, c, 0.12, colors.glass));
    }
    for (const y of [6, 16, 26, 36, 44]) {
      const width = 36 - (y - 0.5) / 47.5 * 31;
      parts.push(rectangularFlue("随方锥外壁收分的环形展层", width, width, 0.25, Math.max(1, (width - 4) / 2), [0, y, 0], steel));
    }
    parts.push(rectangularFlue("方锥顶部中空采光框", 5.3, 5.3, 0.3, 0.25, [0, 48, 0], steel), ...gate("首层采光塔馆大入口", 8, 5.5, [0, 0.5, -18.1], 0.4), box("地面馆内引导低台", 0, 1, 0, 8, 1, 6, stone));
    return parts;
  }, "建筑", "科幻"),
  design("双拱夹托跨谷能源厅", "两道高拱跨在分离的山谷端基上，厅体以短吊杆悬在拱肋之间，中央控制厅与端部服务间共用高位连续地板", () => {
    const parts: ModelPart[] = [box("跨谷能源厅连续悬挂地板", 0, 18.7, 0, 30, 0.4, 17, steel), box("能源厅顶部独立屋盖", 0, 25.4, 0, 31, 0.3, 18, pale), ...[-1, 1].map(s => box("能源厅长边透光围护", 0, 22.2, s * 8.3, 29.5, 6.6, 0.1, colors.glass))];
    for (const side of [-1, 1]) {
      const arch = barrelRoof("山谷两侧连续大跨拱肋", 21, 0.5, 0.7, [0, 0.5, side * 10], dark); arch.scale.y = 1.3; parts.push(arch);
      for (const x of [-1, 1]) parts.push(box("落地山谷端部独立承台", x * 21.5, 0.5, side * 10, 5.2, 1, 5.2, stone));
      for (const x of [-13, -6.5, 0, 6.5, 13]) {
        const y = 0.5 + Math.sqrt(21 * 21 - x * x) * 1.3;
        parts.push(pipe("高拱向厅体传力的短吊杆", [x, y, side * 10], [x, 18.9, side * 8.3], 0.1));
      }
      parts.push(box("能源厅两端封闭服务间背壁", side * 14.7, 22.2, 0, 0.18, 6.6, 16.5, pale));
    }
    parts.push(box("厅内中央控制岛台", 0, 19.9, 0, 10.5, 2, 2.2, dark), ...[-1, 1].map(s => box("高位端部接入走廊", s * 19.1, 18.7, 0, 8.2, 0.3, 3, steel)));
    return parts;
  }, "建筑", "科幻"),
  design("枝状网壳节庆大棚", "六根树状分叉柱支承连续浅曲网壳，屋边下垂而中部抬高，地面四向保持开放并围出一整块无柱活动庭", () => {
    const parts: ModelPart[] = [base(57, 57, 0.5)], roofY = (x: number, z: number) => 19 - 0.006 * (x * x + z * z);
    const vertices: { x: number; y: number; z: number }[] = [], faces: number[] = [], count = 49;
    for (const inset of [0, 0.2]) for (let row = 0; row < 7; row++) for (let column = 0; column < 7; column++) { const x = -24 + column * 8, z = -24 + row * 8; vertices.push({ x, y: roofY(x, z) - inset, z }); }
    for (let row = 0; row < 6; row++) for (let column = 0; column < 6; column++) { const a = row * 7 + column, b = a + 7, c = a + 1, d = b + 1; faces.push(a, b, c, c, b, d); }
    const indices = [...faces], edges = new Map<string, [number, number]>();
    for (let index = 0; index < faces.length; index += 3) {
      const triangle = faces.slice(index, index + 3); indices.push(triangle[2]! + count, triangle[1]! + count, triangle[0]! + count);
      for (let edge = 0; edge < 3; edge++) { const a = triangle[edge]!, b = triangle[(edge + 1) % 3]!; if (!edges.delete(`${b},${a}`)) edges.set(`${a},${b}`, [a, b]); }
    }
    for (const [a, b] of edges.values()) indices.push(a, b + count, b, a, a + count, b + count);
    parts.push(part("闭合薄壁的浅曲连续网壳", "mesh", pale, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices }));
    for (const x of [-12, 12]) for (const z of [-15, 0, 15]) {
      parts.push(cylinder("树状分叉柱下段", x, 5.2, z, 0.5, 9.4, dark));
      for (const [dx, dz] of [[Math.sign(x) * 9, 0], [-Math.sign(x) * 8, -4.5], [-Math.sign(x) * 8, 4.5]]) parts.push(rail([x, 9.7, z], [x + dx!, roofY(x + dx!, z + dz!) - 0.2, z + dz!], 0.25, dark));
    }
    for (const z of [-16, 0, 16]) for (let section = 0; section < 6; section++) { const x = -24 + section * 8; parts.push(rail([x, roofY(x, z) - 0.3, z], [x + 8, roofY(x + 8, z) - 0.3, z], 0.16, steel)); }
    parts.push(box("活动庭一侧低服务台", 17, 1.25, 0, 5, 1.5, 9, wood));
    return parts;
  }, "建筑", "科幻"),
  design("斜向双廊空中校园", "两条斜向教学长廊在不同高度跨过开放校园庭，四个端部交通塔承住长廊端头，中间交会处留出相互独立的通行标高", () => {
    const parts: ModelPart[] = [base(67, 67, 0.5), box("开放校园庭中央活动台", 0, 0.9, 0, 20, 0.8, 20, stone)];
    for (const [yaw, y] of [[35, 12], [-35, 23]]) {
      const angle = yaw! * Math.PI / 180, c = Math.cos(angle), s = Math.sin(angle);
      const block = [box("教学长廊贯通层板", 0, 0, 0, 51, 0.4, 11, steel), box("教学长廊薄屋盖", 0, 6.4, 0, 52, 0.3, 11.8, pale), ...[-1, 1].map(side => box("教学长廊两侧透明立面", 0, 3.3, side * 5.4, 50.5, 6.2, 0.1, colors.glass)), ...[-18, -6, 6, 18].map(x => box("教学长廊分班短墙", x, 3.3, 1.2, 0.15, 6.2, 8.2, pale))];
      for (const value of block) { const x = value.position.x, z = value.position.z; value.position.x = x * c + z * s; value.position.z = -x * s + z * c; value.position.y += y!; value.rotation.y = yaw!; } parts.push(...block);
      for (const side of [-1, 1]) parts.push(box("教学长廊端部竖向交通塔", side * 24 * c, (y! + 0.5) / 2, -side * 24 * s, 5.2, y! - 0.5, 5.2, dark), rail([side * 24 * c, y! - 3.4, -side * 24 * s], [side * 16 * c, y! - 0.2, -side * 16 * s], 0.4, dark));
    }
    parts.push(...[-1, 1].map(side => box("低层校园地面服务亭", side * 21, 3.1, 24, 10, 5.2, 7, pale)), ...gate("校园地面开放入口", 10, 5.4, [0, 0.5, -26], 0.4));
    return parts;
  }, "建筑", "赛博朋克"),
  design("菱形空腹跨路旅馆", "两组斜向受力边框围成高菱形外轮廓，客房带分段挂在上半部，菱形下腹为道路留下完整开放门洞", () => {
    const parts: ModelPart[] = [base(53, 29, 0.5), box("跨路旅馆下方道路地面", 0, 0.8, 0, 16, 0.6, 29, steel)];
    for (const z of [-8.7, 8.7]) {
      const points: Triple[] = [[0, 14, z], [23, 22.5, z], [0, 44.5, z], [-23, 22.5, z]];
      for (let edge = 0; edge < 4; edge++) parts.push(rail(points[edge]!, points[(edge + 1) % 4]!, 0.75, dark));
    }
    for (let level = 0; level < 4; level++) {
      const y = 23 + level * 4.7, half = (44.5 - y) / 22 * 23;
      parts.push(box("菱形上半部收分客房楼板", 0, y, 0, half * 2, 0.3, 17, steel), ...[-1, 1].map(s => box("菱形客房前后透明长面", 0, y + 2.2, s * 8.3, Math.max(4, half * 2 - 3.2), 4.1, 0.1, colors.glass)));
      for (const x of [-half * 0.5, 0, half * 0.5]) parts.push(box("菱形客房带内部分隔墙", x, y + 2.2, 1.2, 0.15, 4.1, 14.3, pale));
    }
    parts.push(box("菱形上部整体屋顶短板", 0, 42.2, 0, 5.2, 0.25, 17.6, pale), ...[-1, 1].map(s => box("跨路旅馆两侧端部交通核心", s * 23, 11.5, 0, 3.2, 22, 17, pale)));
    return parts;
  }, "建筑", "赛博朋克"),
  design("双层风帆覆面海港厅", "两层港口候乘甲板落在四座高锚塔之间，交错薄帆从塔顶斜跨到屋边，边缘走道和下层接船平台分处不同高度", () => {
    const parts: ModelPart[] = [base(65, 43, 0.5), box("海港厅下层接船甲板", 0, 1.1, 0, 57, 1.2, 31, steel), rectangularFlue("海港厅上层中空候乘环板", 54, 28, 0.35, 6.5, [0, 7.5, 0], steel)];
    for (const x of [-1, 1]) for (const z of [-1, 1]) parts.push(box("海港厅高锚塔", x * 25, 12.5, z * 12, 0.65, 24, 0.65, dark), pipe("高锚塔后侧反拉索", [x * 25, 24.5, z * 12], [x * 31, 0.7, z * 18], 0.07));
    for (const side of [-1, 1]) {
      parts.push(triangleShell("跨向低侧屋边的风帆前片", [-25, 23.8, side * 12], [25, 23.8, side * 12], [-25, 15.2, side * -8], 0.09, pale), triangleShell("跨向低侧屋边的风帆后片", [25, 23.8, side * 12], [25, 15.2, side * -8], [-25, 15.2, side * -8], 0.09, colors.glass), rail([-25, 15.2, side * -8], [25, 15.2, side * -8], 0.2, dark), box("上层侧向封闭服务间背壁", side * 23, 10.5, 0, 0.25, 5.6, 21, pale), box("下层接船外伸短平台", side * 29.5, 1.1, -8, 6.5, 0.35, 4, steel));
      for (const x of [-18, -6, 6, 18]) parts.push(pipe("低侧帆边到上层甲板的斜杆", [x, 15.2, side * 8], [x, 7.7, side * 11.5], 0.12));
    }
    parts.push(...gate("下层海港厅贯通主入口", 10, 5.2, [0, 1.7, -15.5], 0.35), ...[-1, 1].map(s => box("两层候乘区垂直交通塔", s * 20, 4.6, 8, 3.8, 6.5, 5.5, dark)));
    return parts;
  }, "建筑", "科幻"),
  design("旋肋圆锥高寒研究站", "低环墙承托中空圆锥保温壳，外侧三条螺旋肋顺屋面向中央通风颈收拢，独立双门前室接入环形工作层", () => {
    const parts: ModelPart[] = [base(46, 49, 0.5), cylinder("研究站圆形承载地台", 0, 0.85, 0, 36.5, 0.7, stone), halfRoundWall("入口留缺口的低环墙", 18, 0.35, 3.2, [0, 0.5, 0], 65, pale, Math.PI * 31 / 18), part("内外分离的圆锥保温薄壳", "lathe", pale, [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 18.3, y: 3.5 }, { x: 5, y: 15 }, { x: 3, y: 18 }, { x: 2.75, y: 18 }, { x: 4.75, y: 14.8 }, { x: 17.95, y: 3.5 }] }), ring("中央通风颈中空立管", dark, 2.95, 0.15, 20.3, 4.5), ring("内部环形工作层", steel, 16.5, 12.5, 1.4, 0.3)];
    for (let rib = 0; rib < 3; rib++) parts.push(part("连续收分螺旋外肋", "tube", steel, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: 0.1, path: Array.from({ length: 17 }, (_, index) => { const t = index / 16, a = rib * Math.PI * 2 / 3 + t * Math.PI * 2, y = 3.55 + t * 14.45, radius = y <= 15 ? 18.3 - (y - 3.5) / 11.5 * 13.3 : 5 - (y - 15) / 3 * 2; return { x: Math.cos(a) * (radius + 0.08), y, z: Math.sin(a) * (radius + 0.08) }; }) }));
    for (const side of [-1, 1]) parts.push(box("研究站双门前室厚侧墙", side * 2.1, 2.5, -20.1, 0.3, 4, 9.5, pale), box("环室内部工作长台", side * 8.8, 2.5, 0, 4.8, 1.9, 10, steel));
    parts.push(box("双门前室平屋顶", 0, 4.6, -20.1, 4.7, 0.25, 9.8, pale), ...[-18.8, -24.8].flatMap(z => gate("研究站独立气闸门框", 3.7, 3.6, [0, 0.5, z], 0.2)), cylinder("通风颈上方悬起避雪帽", 0, 23.2, 0, 7, 0.2, steel), ...[-1, 1].map(s => box("避雪帽短支柱", s * 2.4, 22.75, 0, 0.15, 0.8, 0.15, dark)));
    return parts;
  }, "建筑", "科幻"),
  design("连环悬胆温室旅社", "上部大环梁由四根地柱承托，四个独立温室寝舱借短索挂在环梁下，内圈公共连廊把各舱入口连接到中央服务井", () => {
    const parts: ModelPart[] = [base(43, 43, 0.5), ring("上部连续圆形承索主梁", dark, 16, 0.45, 23, 0.8), ring("中层公共环行连廊", steel, 9, 2.2, 10, 0.25), cylinder("中央竖向服务井承座", 0, 5.2, 0, 3.7, 9.4, dark)];
    for (let pod = 0; pod < 4; pod++) {
      const a = pod * Math.PI / 2, c = Math.cos(a), s = Math.sin(a), x = c * 13, z = s * 13;
      parts.push(box("大环梁落地支柱", c * 17.4, 11.7, s * 17.4, 0.45, 22.4, 0.45, dark), rail([c * 17.4, 22.8, s * 17.4], [c * 15.8, 22.8, s * 15.8], 0.3, dark));
      const cells: ModelPart[] = [box("悬胆温室舱地板", 0, 10, 0, 4.8, 0.25, 9.5, steel), barrelRoof("悬胆温室舱中空拱顶", 2.5, 0.12, 9.6, [0, 12.5, 0], colors.glass), ...[-1, 1].map(side => box("悬胆舱两侧透光薄壁", side * 2.4, 11.4, 0, 0.08, 2.6, 9.4, colors.glass)), box("悬胆舱后端薄封壁", 0, 11.4, 4.65, 4.7, 2.6, 0.12, pale), box("舱内完整低寝台", 0, 10.675, 1.5, 3.6, 1.1, 3.8, wood)];
      for (const value of cells) { const oldX = value.position.x, oldZ = value.position.z; value.position.x = x + oldX * s + oldZ * c; value.position.z = z - oldX * c + oldZ * s; value.rotation.y += 90 - pod * 90; } parts.push(...cells);
      for (const side of [-1, 1]) parts.push(pipe("上部环梁吊住独立舱端的短索", [c * 15.8 - s * side * 2, 22.6, s * 15.8 + c * side * 2], [x - s * side * 2, 14.2, z + c * side * 2], 0.055));
    }
    parts.push(...[-1, 1].map(s => box("环廊通向中央井的接板", s * 4.8, 10, 0, 6.5, 0.25, 1.5, steel)));
    return parts;
  }, "建筑", "科幻"),
  design("凸瓣叠檐城市商厦", "五个凸出外瓣连成整层商业空间，连续楼板与挑檐保留完整花瓣轮廓，外壁分成平面玻璃段并在地面前庭留出主入口", () => {
    const outline: [number, number][] = Array.from({ length: 30 }, (_, index) => { const a = index * Math.PI / 15, r = 19 + 2.2 * Math.cos(a * 5); return [Math.cos(a) * r, Math.sin(a) * r]; });
    const parts: ModelPart[] = [base(49, 49, 0.5)], skins: ModelPart[] = [];
    for (const y of [0.8, 6.3, 11.8, 17.3]) parts.push(polygon(y === 17.3 ? "连续凸瓣屋顶挑檐" : "整幅凸瓣商业楼层板", y === 17.3 ? pale : steel, outline.map(([x, z]) => [x * (y === 17.3 ? 1.04 : 1), z * (y === 17.3 ? 1.04 : 1)]), y === 0.8 ? 0.6 : 0.3, [0, y === 0.8 ? 0.5 : y, 0]));
    for (let level = 0; level < 3; level++) for (let edge = 0; edge < outline.length; edge++) {
      if (!level && edge >= 21 && edge <= 23) continue;
      const a = outline[edge]!, b = outline[(edge + 1) % outline.length]!, y = 1.1 + level * 5.5;
      skins.push(triangleShell("凸瓣商厦独立薄玻璃幕面", [a[0], y, a[1]], [b[0], y, b[1]], [a[0], y + 5.2, a[1]], 0.08, colors.glass), triangleShell("凸瓣商厦独立薄玻璃幕面", [b[0], y, b[1]], [b[0], y + 5.2, b[1]], [a[0], y + 5.2, a[1]], 0.08, colors.glass));
    }
    for (let offset = 0; offset < skins.length; offset += 16) { const mesh = combineMeshes("凸瓣商厦分面透光围护", colors.glass, skins.slice(offset, offset + 16)); mesh.opacity = 0.38; parts.push(mesh); }
    for (let index = 0; index < 15; index++) { const point = outline[index * 2]!; parts.push(box("外瓣边缘连续细承柱", point[0], 9, point[1], 0.2, 16.4, 0.2, dark)); }
    parts.push(rectangularFlue("商厦中央中空服务核心", 5.5, 6.5, 16.5, 0.22, [0, 0.8, 0], pale), ...gate("商厦地面开放前庭入口", 8, 4.8, [0, 0.5, -21], 0.3));
    return parts;
  }, "建筑", "赛博朋克"),
  design("曲桥贯庭气象研究楼", "三段弯折实验长廊在院落上方连续架起，通透长边面向不同方向的观测场，端部竖井和转角平台维持同一层通行标高", () => {
    const parts: ModelPart[] = [base(65, 57, 0.5)], points: [number, number][] = [[-26, -16], [-9, -16], [9, 16], [26, 16]];
    for (let segment = 0; segment < 3; segment++) {
      const a = points[segment]!, b = points[segment + 1]!, dx = b[0] - a[0], dz = b[1] - a[1], length = Math.hypot(dx, dz), yaw = -Math.atan2(dz, dx) * 180 / Math.PI, x = (a[0] + b[0]) / 2, z = (a[1] + b[1]) / 2;
      const cells = [box("曲桥实验廊贯通层板", 0, 8, 0, length + 0.4, 0.35, 8, steel), box("曲桥实验廊连续屋顶", 0, 14.1, 0, length + 0.5, 0.25, 8.5, pale), ...[-1, 1].map(s => box("实验廊长边玻璃观测面", 0, 11.075, s * 3.9, length, 5.8, 0.1, colors.glass)), box("实验廊内部低操作台", 0, 9.075, 1, length * 0.6, 1.8, 1.3, dark)];
      const angle = yaw * Math.PI / 180;
      for (const value of cells) { const oldX = value.position.x, oldZ = value.position.z; value.position.x = x + oldX * Math.cos(angle) + oldZ * Math.sin(angle); value.position.z = z - oldX * Math.sin(angle) + oldZ * Math.cos(angle); value.rotation.y = yaw; } parts.push(...cells);
    }
    for (const [x, z] of points) parts.push(box("曲桥廊转角独立落地支墩", x, 4.2, z, 1, 7.4, 1, dark), cylinder("长廊转折处完整接平台", x, 8, z, 9.5, 0.3, steel));
    parts.push(...[-1, 1].map(s => box("研究楼端部竖向交通井", s * 27, 4.9, s * 16, 3.5, 8.8, 4.5, pale)), box("院内独立观测低平台", -5, 1.1, 8, 11, 1.2, 9, stone));
    return parts;
  }, "建筑", "科幻"),
  design("穿孔立碑太空导航厅", "倾斜切顶的厚立碑楼体保留两个贯通大孔，低孔服务地面穿行，高孔周边有检修层板，侧边细塔把上下工作层连接", () => {
    const outline: [number, number][] = [[-18, 0], [18, 0], [18, 42], [9, 52], [-18, 52]], openings: [number, number][][] = [[[-13, 1], [-3, 1], [-3, 12], [-13, 12]], [[3, 18], [13, 18], [13, 38], [3, 38]]];
    const slab = polygon("保留贯通大孔的厚立碑壳", pale, outline, 7, [0, 0.5, 3.5], openings); slab.rotation.x = -90;
    const parts: ModelPart[] = [base(49, 23, 0.5), slab, box("高孔下缘完整检修平台", 8, 18.8, 0, 11.2, 0.3, 10.5, steel), box("高孔上缘完整检修平台", 8, 38.1, 0, 11.2, 0.3, 10.5, steel), box("立碑侧边独立服务交通塔", 20, 20.8, 0, 3.5, 40.6, 6, dark), box("地面低孔贯通引导面", -8, 1.6, 0, 9.5, 0.2, 16, steel)];
    for (const y of [18.8, 38.1]) parts.push(box("服务塔接到高孔检修层的短桥", 15.8, y, 0, 9.4, 0.25, 2.5, steel));
    const arrayRing = ring("导航阵开放端环", steel, 4.5, 0.22, 55.2, 0.3); arrayRing.position.x = -5;
    parts.push(cylinder("切顶立碑上的导航阵支承座", -5, 53.1, 0, 3, 1.2, dark), arrayRing, ...[-1, 1].map(s => rail([-5, 53.6, 0], [-5 + s * 4.4, 55.2, 0], 0.25, dark)));
    return parts;
  }, "建筑", "科幻"),
  design("井笼夹板潜海旅馆", "厚端框把四层透明客房夹在中部，前方独立升降井通过短桥接到各层，底部斜腿将旅馆工作面抬离海底承台", () => {
    const parts: ModelPart[] = [base(35, 31, 0.5), ...[-1, 1].map(s => rectangularFlue("潜海旅馆端部厚框架", 2.3, 15.5, 22, 0.45, [s * 12.6, 5, 0], dark))];
    for (const side of [-1, 1]) for (const z of [-6.5, 6.5]) parts.push(rail([side * 15, 0.5, z * 1.5], [side * 12.6, 5.3, z], 0.75, dark));
    for (let level = 0; level < 4; level++) {
      const y = 5.6 + level * 5.2;
      parts.push(box("潜海客房整层夹板", 0, y, 0, 25.5, 0.4, 14.5, steel), box("潜海客房后侧透明外面", 0, y + 2.5, 7.1, 24.8, 5, 0.15, colors.glass), ...[-1, 1].map(s => box("层门两侧保持透明的前立面", s * 6.7, y + 2.5, -7.1, 11.4, 5, 0.15, colors.glass)), ...[-8, 0, 8].map(x => box("潜海旅馆各层房间隔墙", x, y + 2.5, 1.2, 0.18, 5, 11.6, pale)), box("旅馆层门向升降井延伸的接桥", 0, y, -9.3, 2.3, 0.3, 4.7, steel));
    }
    parts.push(box("四层潜海旅馆完整顶盖", 0, 26.375, 0, 27, 0.35, 15.5, pale), rectangularFlue("独立升降井中空壁", 3.2, 3.2, 29, 0.16, [0, 0.5, -12], steel), box("潜海升降井顶端接驳平台", 0, 29.65, -12, 6, 0.3, 6, dark));
    return parts;
  }, "建筑", "科幻"),
  design("斜张网幕高地教堂", "单侧高倾桅把两片张膜屋翼牵向高空，另一侧薄墙与低索边围合朝向长庭的礼拜空间，前后入口保持敞开", () => {
    const parts: ModelPart[] = [base(37, 47, 0.5), box("高地教堂连续礼拜地台", 0, 0.85, 0, 27, 0.7, 41, stone), rail([-12, 0.5, 16], [-5, 30, 16], 0.8, dark), box("低侧礼拜空间厚墙", 12.5, 5, 0, 0.35, 8.3, 39, pale)];
    parts.push(triangleShell("斜桅牵起的礼拜空间前帆", [-5, 29.4, 16], [-12, 7.4, -21], [12.8, 8.6, -21], 0.12, pale), triangleShell("斜桅牵起的礼拜空间后帆", [-5, 29.4, 16], [12.8, 8.6, -21], [12.8, 8.6, 21], 0.12, pale));
    parts.push(triangleShell("斜桅背侧低落的完整屋帆", [-12, 7.4, 21], [-5, 29.4, 16], [12.8, 8.6, 21], 0.12, pale));
    for (const z of [-18, -6, 6, 18]) parts.push(pipe("高桅至低屋边的悬索", [-5, 29.4, 16], [12.6, 8.7, z], 0.055), box("礼拜空间独立长座", 0, 1.3, z * 0.7, 13, 0.9, 1.7, wood));
    for (const z of [-20, -10, 0, 10, 20]) parts.push(box("开敞高侧轻立柱", -12.2, 4.3, z, 0.18, 6.9, 0.18, dark));
    parts.push(rail([-12, 7.4, -21], [-12, 7.4, 21], 0.18, dark), pipe("斜桅背部固定锚索", [-5, 29.4, 16], [-16, 0.7, 22], 0.08), box("教堂内侧礼仪低台", 0, 1.3, 16.5, 10, 0.9, 4, pale), ...gate("高地礼拜空间前庭入口", 7.2, 5.3, [0, 0.5, -21.2], 0.3));
    return parts;
  }, "建筑", "科幻"),
  design("错位船台滨海修造基地", "两条有高差的斜船台面向同一开放工作岸，后部窄修造厅跨在两台间，独立侧轨吊架与岸边维修廊保持不同通行方向", () => {
    const hallRoof = barrelRoof("后部修造厅长拱屋面", 5.8, 0.22, 57.5, [0, 11.5, 20], pale); hallRoof.rotation.y = 90;
    const parts: ModelPart[] = [base(69, 69, 0.5), box("岸侧修造工作平台", 0, 2.2, 18, 60, 3.4, 26, stone), box("两台间贯通维修廊", 0, 3.3, -9, 7, 0.4, 48, steel)];
    for (const [side, top] of [[-1, 7], [1, 10]]) {
      const x = side! * 17.5, slope = Math.atan((top! - 0.8) / 45), y = (top! + 0.8) / 2;
      parts.push(part("向水侧倾斜的完整修造船台", "box", steel, [x, y, -9], [17, 0.55, 46], [-slope * 180 / Math.PI, 0, 0]));
      for (const railSide of [-1, 1]) parts.push(rail([x + railSide * 6.5, 0.98, -31.5], [x + railSide * 6.5, top! + 0.2, 13.5], 0.2, dark));
      for (const z of [-22, -7, 8]) { const bottom = y + Math.tan(slope) * (z + 9) - 0.275 / Math.cos(slope); parts.push(box("船台下部落地支墩", x, (bottom + 0.5) / 2, z, 13, bottom - 0.5, 0.7, dark)); }
      parts.push(box("岸边长轨吊运导梁", side! * 28, 18.2, -6, 0.5, 0.6, 52, steel), ...[-28, 0, 20].map(z => box("长轨吊运侧柱", side! * 28, 9.3, z, 0.65, 17.6, 0.65, dark)));
    }
    parts.push(box("后部修造厅连续层板", 0, 6.5, 20, 57, 0.4, 11, steel), hallRoof, ...[-1, 1].map(s => box("后部修造厅前后薄墙", 0, 9.1, 20 + s * 5.5, 56.5, 4.8, 0.18, pale)), box("跨两船台的空载吊运横梁", 0, 18.3, -5, 56.5, 0.6, 0.6, steel));
    return parts;
  }, "建筑", "科幻"),
  design("反向阶台屋顶公园馆", "楼层向上逐级外挑形成倒阶台体量，四条外斜巨柱把上部大屋顶公园的荷载导向小基座，边缘层间保留通风与观景缝", () => {
    const parts: ModelPart[] = [base(57, 57, 0.5), box("公园馆小尺度落地服务基座", 0, 5.3, 0, 11, 9.6, 11, dark)];
    for (const x of [-1, 1]) for (const z of [-1, 1]) parts.push(rail([x * 4.8, 0.5, z * 4.8], [x * 21.5, 29.5, z * 21.5], 0.75, dark));
    for (let level = 0; level < 6; level++) {
      const y = 5 + level * 4.6, width = 15 + level * 5.6;
      parts.push(box("逐层向外扩展的完整地板", 0, y, 0, width, 0.35, width, steel), ...[-1, 1].map(s => box("倒阶台楼层前后薄玻璃界面", 0, y + 2, s * (width / 2 - 0.12), width - 0.4, 3.6, 0.1, colors.glass)), ...[-1, 1].map(s => box("倒阶台楼层两侧实壁", s * (width / 2 - 0.15), y + 2, 0, 0.2, 3.6, width - 0.4, pale)));
    }
    parts.push(box("最上层开放屋顶公园厚板", 0, 32.5, 0, 46, 0.5, 46, pale), ...[-1, 1].map(s => box("屋顶公园两侧内凹种植长槽", s * 15, 33.2, 0, 5, 0.9, 34, stone)), box("屋顶公园中央服务亭后壁", 0, 34.5, 10, 8, 3.5, 0.2, dark), box("屋顶公园服务亭薄顶", 0, 36.35, 7, 9, 0.2, 7, pale));
    for (const x of [-1, 1]) for (const z of [-1, 1]) parts.push(rail([x * 21.5, 29.5, z * 21.5], [x * 21.5, 32.5, z * 21.5], 0.35, dark));
    return parts;
  }, "建筑", "赛博朋克"),
];
