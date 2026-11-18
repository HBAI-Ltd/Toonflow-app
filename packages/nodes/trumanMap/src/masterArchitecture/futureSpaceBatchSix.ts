import { part, ring, type ModelPart, type Triple } from "../assetModelParts";
import { halfRoundWall, rectangularFlue } from "./spatialShells";
import { base, box, colors, cylinder, design, pipe, rail, type ArchitecturePrototype } from "./structures";
import { triangleShell } from "./futureSpaceBatchOne";
import { sectorSlab } from "./futureSpaceBatchTwo";
import { polygon } from "../masterNature/shared";

const steel = "#75898e", pale = "#aab3ad", dark = "#43565d", stone = "#9e917a", wood = "#9c8263";

function doorway(name: string, width: number, height: number, root: Triple, depth = 0.25): ModelPart[] {
  const [x, y, z] = root;
  return [box(`${name}侧柱`, x - width / 2 - 0.16, y + height / 2, z, 0.32, height, depth, dark), box(`${name}侧柱`, x + width / 2 + 0.16, y + height / 2, z, 0.32, height, depth, dark), box(`${name}门楣`, x, y + height + 0.16, z, width + 0.64, 0.32, depth, dark)];
}

export const futureSpaceBatchSixDesigns: ArchitecturePrototype[] = [
  design("下垂索顶环形生活广场", "外圈高框架牵住向中央下垂的圆环屋盖，环内露天庭和周边生活铺廊相互分开，三处径向入口穿过环带地面进入内庭", () => {
    const parts: ModelPart[] = [base(61, 61, 0.5), ring("广场周边连续生活铺廊地板", steel, 26, 8.5, 0.9, 0.8), ring("下垂索顶外圈高位承索梁", dark, 27.5, 0.4, 16, 0.6), ring("屋盖中央低位受拉环", steel, 11.5, 0.35, 9.8, 0.5), cylinder("广场内庭完整低台", 0, 0.75, 0, 30, 0.5, stone)];
    for (let sector = 0; sector < 12; sector++) {
      const a = sector * Math.PI / 6, next = (sector + 1) * Math.PI / 6, x = Math.cos(a), z = Math.sin(a), nX = Math.cos(next), nZ = Math.sin(next);
      parts.push(box("外圈高框架独立立柱", x * 27.5, 8.2, z * 27.5, 0.35, 15.4, 0.35, dark), pipe("外高内低连续承屋索", [x * 27.4, 15.9, z * 27.4], [x * 11.6, 10, z * 11.6], 0.07), triangleShell("环形索顶连续薄膜屋片", [x * 27.3, 15.8, z * 27.3], [nX * 27.3, 15.8, nZ * 27.3], [x * 11.6, 10, z * 11.6], 0.08, pale), triangleShell("环形索顶连续薄膜屋片", [nX * 27.3, 15.8, nZ * 27.3], [nX * 11.6, 10, nZ * 11.6], [x * 11.6, 10, z * 11.6], 0.08, pale));
      if (sector % 4) parts.push(part("生活铺廊径向分间墙", "box", pale, [x * 21.5, 3.1, z * 21.5], [8, 4.4, 0.16], [0, -a * 180 / Math.PI, 0]));
    }
    for (const yaw of [0, 120, 240]) { const a = yaw * Math.PI / 180; parts.push(part("内外生活区贯通入口地板", "box", steel, [Math.cos(a) * 17, 0.95, Math.sin(a) * 17], [20, 0.2, 3.8], [0, -yaw, 0])); }
    parts.push(...[-1, 1].map(s => box("露天庭内独立共享长座", s * 7, 1.1, 0, 2.2, 0.7, 9, wood)));
    return parts;
  }, "建筑", "科幻"),
  design("柱束分叉双层教学馆", "四组柱束在二层之间分叉承托不同方向的教学翼，中央挑空庭把上下层分开，外侧楼梯与贯通环廊连接各翼教室", () => {
    const parts: ModelPart[] = [base(53, 53, 0.5), rectangularFlue("下层教学馆环形地台", 43, 43, 0.35, 11, [0, 0.9, 0], steel), rectangularFlue("二层教学馆环形楼板", 45, 45, 0.35, 10, [0, 7.3, 0], steel), rectangularFlue("教学馆完整环形屋面", 46.5, 46.5, 0.3, 10.5, [0, 14, 0], pale)];
    for (const x of [-1, 1]) for (const z of [-1, 1]) {
      const cx = x * 13.5, cz = z * 13.5;
      parts.push(cylinder("教学馆柱束主干", cx, 4.2, cz, 0.6, 7.4, dark), rail([cx, 6.5, cz], [cx + x * 7.5, 14, cz], 0.32, dark), rail([cx, 6.5, cz], [cx, 14, cz + z * 7.5], 0.32, dark));
      for (const y of [1.1, 7.5]) parts.push(box("教学翼外侧短围护墙", cx + x * 7.7, y + 2.9, cz, 0.15, 5.8, 16, colors.glass), box("教学翼外侧短围护墙", cx, y + 2.9, cz + z * 7.7, 16, 5.8, 0.15, colors.glass), box("教学翼室内分班短隔墙", cx, y + 2.9, cz, 15.5, 5.8, 0.15, pale));
    }
    for (const side of [-1, 1]) {
      parts.push(box("外侧完整楼梯转换台", side * 23.7, 4.1, 0, 3.2, 0.25, 4.2, steel));
      parts.push(stairFlight("楼梯下段完整连续阶体", [side * 23.7, 0.5, -6.225], 10, 0.36, 0.45, 2.5), stairFlight("楼梯上段完整连续阶体", [side * 23.7, 4.1, 1.875], 10, 0.32, 0.45, 2.5), box("楼梯上端接回二层的完整地台", side * 23, 7.3, 6.6, 4, 0.25, 2.6, steel));
    }
    return parts;
  }, "建筑", "科幻"),
  design("外挂环阶多层诊疗楼", "中央诊疗塔被不同高度的半环外廊围合，两组曲线阶道接到环廊端点，地面接诊庭与楼上独立病房带通过侧边竖井分流", () => {
    const parts: ModelPart[] = [base(49, 49, 0.5), box("诊疗楼中央贯通服务核心", 0, 13, 0, 6, 25, 9, dark)];
    for (let level = 0; level < 4; level++) {
      const y = 1.1 + level * 6.1, width = 21 + (level % 2) * 3;
      parts.push(box("多层诊疗楼完整病房层板", 0, y, 0, width, 0.3, 23, steel), ...[-1, 1].map(s => box("诊疗楼前后病房玻璃长面", 0, y + 2.7, s * 11.4, width - 0.5, 5.1, 0.1, colors.glass)), ...[-1, 1].map(s => box("病房翼两端真实薄壁", s * (width / 2 - 0.15), y + 2.7, 0, 0.2, 5.1, 22.7, pale)));
      const gallery = sectorSlab("绕诊疗楼外挂的半环外廊", 17, 20.5, Math.PI / 5, Math.PI * 1.6, y, 0.25, steel); parts.push(gallery, ...[-1, 1].map(s => box("病房层向外环延伸的接板", s * 15, y, 0, 9, 0.25, 2.5, steel)));
    }
    for (const side of [-1, 1]) {
      parts.push(rectangularFlue("外廊侧边连续中空升降井", 3, 3, 25.2, 0.15, [side * 18.5, 0.5, 0], dark));
      for (let step = 0; step < 16; step++) { const a = side * (0.2 + step * 0.08), r = 19.2, top = 0.775 + step * 0.435; parts.push(part("外圈曲线连续缓阶", "box", steel, [Math.cos(a) * r, (top + 0.5) / 2, Math.sin(a) * r], [3, top - 0.5, 1.6], [0, -a * 180 / Math.PI, 0])); }
    }
    parts.push(box("诊疗楼上部完整平屋盖", 0, 25.5, 0, 25, 0.3, 24), box("地面接诊庭服务台", -3, 1.5, -15.5, 7, 1.3, 2, stone), ...doorway("地面接诊庭主入口", 5.3, 4.7, [0, 0.5, -11.6], 0.3));
    return parts;
  }, "建筑", "科幻"),
  design("背靠巨墙屋顶农居馆", "一片通高后壁托住三层逐级外挑的居住架，下层交通庭与上层农作屋面分开，斜向宽撑在屋边承接外挑楼板", () => {
    const parts: ModelPart[] = [base(49, 61, 0.5), box("农居馆背部通高厚墙", 0, 14.2, 21.5, 39, 27.4, 0.7, stone)];
    for (let level = 0; level < 4; level++) {
      const y = 4.8 + level * 5.8, depth = 18 + level * 5.4, z = 21 - depth / 2, bottom = y + 0.175, ceiling = level === 3 ? 27.9 : y + 5.625;
      parts.push(box("逐层外挑的农居楼板", 0, y, z, 37, 0.35, depth, steel), ...[-1, 1].map(s => box("农居层两侧连续薄墙", s * 18.3, (bottom + ceiling) / 2, z, 0.2, ceiling - bottom, depth, pale)), box("农居层退于露台后的前窗", 0, (bottom + ceiling) / 2, 21 - depth + 3.4, 35, ceiling - bottom, 0.1, colors.glass));
      for (const x of [-12, 0, 12]) parts.push(rail([x, y - 3.2, 21], [x, y - 0.2, 21 - depth], 0.45, dark));
    }
    parts.push(box("完整屋顶农作承台", 0, 28.15, 2.1, 39, 0.5, 38.5, steel), ...[-1, 1].map(s => box("农作屋顶独立内凹土槽", s * 11.5, 28.95, 2, 8.5, 1.1, 29, colors.earth)), box("农居馆背墙侧交通塔", 20.5, 14.4, 17, 3.5, 27.8, 6, dark), ...doorway("下层穿行交通庭入口", 11, 4.1, [0, 0.5, 1.5], 0.4));
    return parts;
  }, "建筑", "科幻"),
  design("双坡折拱空中运动中心", "两道对折拱肋把一整片运动平台抬到空中，台上低看台与透明围护共用折面屋盖，地面交通从弧形支承之间穿过", () => {
    const parts: ModelPart[] = [base(63, 55, 0.5), box("抬升运动中心完整承板", 0, 13.5, 0, 49, 0.8, 37, steel), box("空中运动中心比赛面", 0, 14.05, 0, 33, 0.3, 21, pale)];
    for (const side of [-1, 1]) {
      parts.push(rail([-26, 0.5, side * 16], [0, 13.15, side * 16], 1, dark), rail([26, 0.5, side * 16], [0, 13.15, side * 16], 1, dark), box("运动平台两侧通透护壁", 0, 17.3, side * 18.3, 48.5, 6.8, 0.1, colors.glass), triangleShell("运动中心双坡折面屋盖", [0, 25.5, -20], [side * 25.5, 20.5, -20], [0, 25.5, 20], 0.22, pale), triangleShell("运动中心双坡折面屋盖", [side * 25.5, 20.5, -20], [side * 25.5, 20.5, 20], [0, 25.5, 20], 0.22, pale));
      for (let row = 0; row < 3; row++) parts.push(box("空中平台两侧接实承板的独立低看台", 0, 14.425 + row * 0.35, side * (12.3 + row * 1.5), 36, 1.05 + row * 0.7, 1.5, steel));
      parts.push(rectangularFlue("运动中心独立竖向交通塔", 4.5, 5.5, 13.5, 0.2, [side * 25.5, 0.5, 0], dark), box("交通塔与运动平台接桥", side * 23.5, 13.5, 0, 6, 0.35, 3, steel));
    }
    for (const x of [-21, 21]) for (const z of [-16, 16]) parts.push(box("上层折面屋盖细承柱", x, 17.65, z, 0.25, 7.5, 0.25, dark), rail([x, 21.4, z], [0, 25.3, z], 0.3, dark));
    parts.push(rail([0, 25.3, -20], [0, 25.3, 20], 0.3, dark));
    return parts;
  }, "建筑", "科幻"),
  design("中核吊板环塔书院", "中央高塔芯向四角伸出承索大臂，分层弧形书廊从臂端悬下，地面阅读庭保持开敞，短桥连接书廊与塔芯侧门", () => {
    const parts: ModelPart[] = [base(47, 47, 0.5), cylinder("地面开放阅读庭", 0, 0.8, 0, 27, 0.6, stone), ...[-1, 1].flatMap(x => [-1, 1].map(z => box("中央塔芯四角连续重柱", x * 2.8, 15.5, z * 3.3, 0.9, 30, 0.9, dark))), box("中央塔芯后侧薄围护", 0, 15.5, 3.6, 6.5, 30, 0.2, dark), box("塔芯完整顶部承臂压板", 0, 30.6, 0, 7.3, 0.3, 8.3, steel)];
    for (const y of [10.5, 18.5]) {
      parts.push(box("塔芯侧向开口的接廊层板", 0, y, 0, 6.5, 0.3, 7.5, steel));
      parts.push(sectorSlab("围绕塔芯的分层弧形书廊", 10.5, 17.5, Math.PI / 5, Math.PI * 1.6, y, 0.3, steel), sectorSlab("分层书廊独立薄屋盖", 10.2, 18, Math.PI / 5, Math.PI * 1.6, y + 4.8, 0.22, pale));
      for (const side of [-1, 1]) parts.push(box("书廊向中央塔芯延伸的接桥", side * 7.1, y, 0, 8.4, 0.3, 2.4, steel));
      for (let shelf = 0; shelf < 8; shelf++) {
        const a = Math.PI / 4 + shelf * Math.PI / 5, r = 15.8;
        parts.push(part("弧形书廊沿边完整书格", "box", wood, [Math.cos(a) * r, y + 1.9, Math.sin(a) * r], [0.55, 3.5, 3.3], [0, -a * 180 / Math.PI, 0]));
      }
      for (let pillar = 0; pillar < 6; pillar++) { const a = Math.PI / 4 + pillar * Math.PI / 4; parts.push(box("悬挂弧廊楼板实际接住独立屋盖的完整细柱", Math.cos(a) * 17, y + 2.42, Math.sin(a) * 17, 0.16, 4.54, 0.16, dark)); }
    }
    for (const x of [-1, 1]) for (const z of [-1, 1]) parts.push(rail([x * 2.8, 29.4, z * 3.3], [x * 13.2, 29.4, z * 13.2], 0.65, dark), pipe("大臂端部贯通两层的书廊承索", [x * 13.2, 29.2, z * 13.2], [x * 12.1, 10.64, z * 12.1], 0.1));
    parts.push(...doorway("书院地面阅读庭主入口", 4.8, 4.5, [0, 0.5, -4], 0.3), box("书院中央服务低台", -6, 1.6, -6, 5, 1.6, 2.4, steel));
    return parts;
  }, "建筑", "科幻"),
  design("端塔悬索三联会堂", "两座端塔拉住高空主索，三间互相错开的会议厅挂在不同短吊点下，厅间露台与独立地面交通井把两端人流分开", () => {
    const parts: ModelPart[] = [base(69, 41, 0.5), ...[-1, 1].map(s => box("会堂两端悬索高塔", s * 28.5, 16, 0, 2.2, 31, 7, dark))];
    const cablePoints: Triple[] = [[-28.5, 31.2, 0], [-17, 24, 0], [0, 20.8, 0], [17, 24, 0], [28.5, 31.2, 0]];
    for (let section = 0; section < cablePoints.length - 1; section++) for (const side of [-1, 1]) { const a = cablePoints[section]!, b = cablePoints[section + 1]!; parts.push(pipe("双列连续承载主索", [a[0], a[1], side * 4], [b[0], b[1], side * 4], 0.12)); }
    for (const [x, y, z] of [[-18, 10, -3], [0, 7.5, 3], [18, 10, -3]]) {
      parts.push(box("悬挂会堂完整承板", x!, y!, z!, 14.2, 0.35, 17.5, steel), box("悬挂会堂完整平屋盖", x!, y! + 6, z!, 14.8, 0.25, 18.2, pale), ...[-1, 1].map(s => box("悬挂会堂前后透光薄壁", x!, y! + 3.1, z! + s * 8.6, 14, 5.7, 0.1, colors.glass)), box("悬挂会堂内部低讲台", x!, y! + 0.725, z! + 4.8, 7.5, 1.1, 3.2, wood));
      for (const side of [-1, 1]) parts.push(pipe("主索吊住会堂独立四角吊杆", [x!, x ? 24 + (Math.abs(x!) - 17) / 11.5 * 7.2 : 20.8, side * 4], [x!, y! + 0.2, z! + side * 7], 0.08));
    }
    for (const side of [-1, 1]) { const stair = stairFlight("两侧会堂通向中央厅的独立阶梯接廊", [side * 7.1, 7.5, -0.4], 13, 2.5 / 13, 3.8 / 13, 2.6); stair.rotation.y = side < 0 ? 180 : 0; parts.push(stair, rectangularFlue("端部会议厅独立中空交通井", 3.5, 4.5, 10, 0.2, [side * 24.5, 0.5, -6.5], dark)); }
    return parts;
  }, "建筑", "科幻"),
  design("阶梯折线长庭旅馆", "四段错位客房翼围出连续折线长庭，层层退进的露台面向不同庭段，端部斜桥跨过庭院并连接侧边交通塔", () => {
    const parts: ModelPart[] = [base(69, 61, 0.5)];
    for (const [x, z, yaw] of [[-18, -14, 0], [14, -14, 90], [18, 15, 0], [-14, 15, 90]]) {
      for (let level = 0; level < 3; level++) {
        const y = 1.1 + level * 5.5, depth = 10.5 - level * 2.2, cells: ModelPart[] = [box("旅馆错位长翼连续楼板", 0, y, 0, 25, 0.3, depth + 3.8, steel), box("客房层退后的连续前窗", 0, y + 2.6, -depth / 2 + 1.2, 24.4, 4.9, 0.1, colors.glass), box("客房层后部实体薄墙", 0, y + 2.6, depth / 2 + 1.6, 24.8, 4.9, 0.2, pale)];
        for (const value of cells) { const px = value.position.x, pz = value.position.z; value.position.x = x! + (yaw ? pz : px); value.position.z = z! + (yaw ? -px : pz); value.rotation.y = yaw!; } parts.push(...cells);
      }
      const cap = box("错位旅馆翼完整平屋顶", x!, 17.1, z!, yaw ? 10 : 25.5, 0.25, yaw ? 25.5 : 10, pale); parts.push(cap);
      for (const localX of [-11, 11]) for (const localZ of [-3.5, 3.5]) parts.push(box("各错位长翼从地面贯穿楼板接住屋盖的完整立柱", x! + (yaw ? localZ : localX), 8.7375, z! + (yaw ? -localX : localZ), 0.3, 16.475, 0.3, dark));
    }
    for (const side of [-1, 1]) parts.push(rectangularFlue("长庭端部独立竖向交通塔", 4, 5, 17, 0.2, [side * 28.5, 0.5, side * 18], dark), walkway("旅馆长庭跨越短接廊", [side * 28, 12.1, side * 17], [side * 13, 12.1, side * 6], 2.6));
    parts.push(box("折线长庭中央低共享平台", 0, 0.8, 0, 12, 0.6, 15, stone));
    return parts;
  }, "建筑", "赛博朋克"),
  design("扇叶连桥雨棚社区馆", "三座错向扇形社区厅沿一条弯折连廊布置，厅顶扇叶由两端边柱支承，缺口入口直接面向共有露天庭", () => {
    const parts: ModelPart[] = [base(71, 61, 0.5)];
    for (const [x, z, yaw] of [[-20, -9, 20], [0, 13, 200], [22, -10, 70]]) {
      const floor = sectorSlab("社区厅完整扇形地台", 2.3, 14.5, 0, Math.PI * 1.4, 0.9, 0.8, steel); floor.position.x = x!; floor.position.z = z!; floor.rotation.z = -yaw!;
      parts.push(floor, halfRoundWall("社区厅后部连续薄弧墙", 14.5, 0.2, 5.55, [x!, 1.3, z!], yaw!, pale, Math.PI * 1.4));
      for (const edge of [0, 252]) { const a = (edge - yaw!) * Math.PI / 180; parts.push(box("社区扇叶顶端独立边柱", x! + Math.cos(a) * 14.5, 4.075, z! + Math.sin(a) * 14.5, 0.25, 5.55, 0.25, dark)); }
      for (let sector = 0; sector < 6; sector++) {
        const a = (sector * 42 - yaw!) * Math.PI / 180, b = ((sector + 1) * 42 - yaw!) * Math.PI / 180;
        parts.push(triangleShell("社区馆向内收拢的扇叶薄顶", [x! + Math.cos(a) * 14.9, 6.7, z! + Math.sin(a) * 14.9], [x! + Math.cos(b) * 14.9, 6.7, z! + Math.sin(b) * 14.9], [x!, 11, z!], 0.16, pale));
      }
      parts.push(box("社区厅中央服务承台", x!, 1.7, z!, 4.5, 1.6, 4.5, stone));
    }
    parts.push(walkway("社区厅之间低位贯通接板", [-15, 1.2, -4], [-4, 1.2, 5], 3), walkway("社区厅之间低位贯通接板", [4, 1.2, 5], [17, 1.2, -4], 3), ...[-1, 1].map(s => box("共享前庭完整低长座", s * 9, 1.1, -17, 8, 0.7, 2, wood)));
    return parts;
  }, "建筑", "科幻"),
  design("斜壳圆庭坡廊博览馆", "连续圆环屋盖沿一条轴线倾斜，馆内不同标高的环廊围住开敞圆庭，外缘承柱随屋盖高度改变并保留地面四向入口", () => {
    const roof = ring("倾斜完整环形展馆屋盖", pale, 26, 13, 0, 0.35); roof.position.y = 12.4; roof.rotation.x = 12;
    const parts: ModelPart[] = [base(59, 59, 0.5), ring("展馆地面完整环形展层", steel, 25.5, 12, 1.1, 0.6), roof, cylinder("展馆中央开放圆庭", 0, 0.8, 0, 23, 0.6, stone)];
    for (let index = 0; index < 12; index++) {
      const a = index * Math.PI / 6, x = Math.cos(a) * 25.2, z = Math.sin(a) * 25.2, top = 12.4 - z * Math.tan(12 * Math.PI / 180);
      parts.push(box("随斜屋盖高度变化的外缘承柱", x, (top + 0.5) / 2, z, 0.3, top - 0.5, 0.3, dark));
      if (index % 3) parts.push(part("博览馆环形展层分区短墙", "box", pale, [Math.cos(a) * 19.6, 3.3, Math.sin(a) * 19.6], [10.5, 4.2, 0.15], [0, -a * 180 / Math.PI, 0]));
    }
    for (const side of [-1, 1]) {
      const gallery = sectorSlab("圆庭两侧不同高度的高位弧廊", 13.2, 24, 0, Math.PI * 0.75, side < 0 ? 5.8 : 8.2, 0.3, steel); gallery.rotation.z = side < 0 ? 15 : 195; parts.push(gallery);
      parts.push(rectangularFlue("环形博览馆独立竖向交通井", 3.8, 4.8, 9, 0.18, [side * 19, 0.5, 0], dark));
    }
    parts.push(...[-1, 1].map(s => box("圆庭独立展陈低基座", s * 5, 1.2, 0, 3.5, 0.8, 3.5, stone)));
    return parts;
  }, "建筑", "科幻"),
];

export function stairFlight(name: string, root: Triple, count: number, rise: number, run: number, width: number, waist?: number): ModelPart {
  // 落地短阶保留完整实体；叠层室内梯段显式传腰厚，底面随踏步上升以保留头部净空。
  const profile = [{ x: 0, y: waist === undefined ? 0 : -waist }, { x: count * run, y: waist === undefined ? 0 : count * rise - waist }];
  for (let step = count; step >= 1; step--) profile.push({ x: step * run, y: step * rise }, { x: (step - 1) * run, y: step * rise });
  const shell = polygon(name, steel, profile.map(({ x, y }) => [x, -y]), width);
  // 阶梯角点沿同一斜线时也保留真实踏面；复用多边形的退化端盖过滤，再分顶点保持阶角硬边。
  const vertices = shell.indices!.map(index => { const p = shell.vertices![index]!; return { x: p.x, y: -p.z, z: p.y - width / 2 }; });
  return part(name, "mesh", steel, root, [1, 1, 1], [0, -90, 0], { vertices, indices: vertices.map((_, index) => index) });
}

function walkway(name: string, start: Triple, end: Triple, width: number): ModelPart {
  const dx = end[0] - start[0], dy = end[1] - start[1], dz = end[2] - start[2];
  return part(name, "box", steel, [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2, (start[2] + end[2]) / 2], [Math.hypot(dx, dy, dz), 0.25, width], [0, -Math.atan2(dz, dx) * 180 / Math.PI, Math.atan2(dy, Math.hypot(dx, dz)) * 180 / Math.PI]);
}
