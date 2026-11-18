import { BoxGeometry } from "three";
import { part, ring, type ModelPart, type Triple } from "../assetModelParts";
import { polygon, tapered } from "../masterNature/shared";
import { box, colors, cylinder, design, pipe, rail } from "./structures";

const stone = "#aaa997", steel = "#708782", paving = "#bbb69d", wood = "#998664";

function hardPlan(name: string, color: string, outline: [number, number][], height: number, position: Triple = [0, 0, 0], holes: [number, number][][] = []): ModelPart {
  const value = polygon(name, color, outline, height, position, holes), source = value.vertices!;
  value.vertices = value.indices!.map(i => ({ ...source[i]! })); value.indices = value.vertices.map((_, i) => i);
  return value;
}

function flights(name: string, count: number, rise: number, run: number, width: number, top: number, start: [number, number], yaw: number, color = stone, bottom = 0): ModelPart[] {
  const result: ModelPart[] = [], angle = yaw * Math.PI / 180;
  for (let offset = 0; offset < count; offset += 5) {
    const n = Math.min(5, count - offset), profile: [number, number][] = [[0, -bottom]];
    for (let i = 0; i < n; i++) profile.push([i * run, -(top - (offset + i) * rise)], [(i + 1) * run, -(top - (offset + i) * rise)]);
    profile.push([n * run, -bottom]);
    const value = hardPlan(name, color, profile, width);
    value.vertices = value.vertices!.map(p => ({ x: p.x, y: -p.z, z: p.y - width / 2 }));
    value.position = { x: start[0] + Math.cos(angle) * offset * run, y: 0, z: start[1] - Math.sin(angle) * offset * run }; value.rotation.y = yaw;
    result.push(value);
  }
  return result;
}

type Bar = { center: Triple; size: Triple };
function solidBars(bars: Bar[], name = "保留真实网孔且按二十根合批的水下安全格条"): ModelPart[] {
  const geometry = new BoxGeometry(1, 1, 1), position = geometry.attributes.position!, cube = Array.from({ length: position.count }, (_, i): Triple => [position.getX(i), position.getY(i), position.getZ(i)]), faces = Array.from(geometry.index!.array), result: ModelPart[] = [];
  geometry.dispose();
  for (let offset = 0; offset < bars.length; offset += 20) {
    const vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
    for (const { center, size } of bars.slice(offset, offset + 20)) { const n = vertices.length; vertices.push(...cube.map(([x, y, z]) => ({ x: center[0] + x * size[0], y: center[1] + y * size[1], z: center[2] + z * size[2] }))); indices.push(...faces.map(i => n + i)); }
    result.push(part(name, "mesh", steel, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices }));
  }
  return result;
}

function poolFloor(): ModelPart[] {
  return [box("水帘下方完整承水池底", 0, .15, 0, 9.5, .3, 9.5, stone), ...[-1, 1].flatMap(side => [box("水帘池两侧挡水墙", side * 4.6, .95, 0, .3, 1.3, 9.5, stone), box("水帘池前后挡水墙", 0, .95, side * 4.6, 9.5, 1.3, .3, stone)]), part("水帘池内静态液面", "box", colors.water, [0, 1.12, 0], [8.8, .03, 8.8], [0, 0, 0], { opacity: .72, roughness: .25 })];
}

export const landscapeSpaceBatchElevenDesigns = [
  design("双锚碇刚性双塔悬索人行桥", "两座门塔承托下垂主缆，竖吊杆把荷载传至连续刚性箱形桥身，背索分别落在两岸独立锚碇，桥面保持水平而两端石阶实际落地", () => {
    const parts: ModelPart[] = [box("保持水平通行的连续刚性桥面", 0, 5.45, 0, 64, .3, 5, paving), ...[-1, 1].map(side => box("刚性桥身两侧连续承载主梁", 0, 5.13, side * 2.2, 64, .4, .4, steel))];
    const cableY = (x: number) => 8 + 7.8 * (x / 24) ** 2;
    for (const side of [-1, 1]) {
      parts.push(box("桥端连续支承刚性桥梁的完整岸台", side * 30, 2.465, 0, 4, 4.93, 6.5, stone), box("双塔门架的横向塔顶索鞍梁", side * 24, 15.75, 0, .8, .3, 6.8, steel));
      for (const z of [-3, 3]) parts.push(box("门塔独立落地宽基础", side * 24, .2, z, 2.3, .4, 2.3, stone), box("不封住桥面通行净空的门塔竖腿", side * 24, 8, z, .65, 15.2, .65, steel));
      for (const z of [-2.5, 2.5]) {
        parts.push(box("桥外侧独立背索重锚碇", side * 39, .6, z * 2.2, 2.8, 1.2, 2.8, stone), { ...pipe("从塔顶直接接到岸侧重锚的背索", [side * 24, 15.8, z], [side * 39, 1.15, z * 2.2], .13), color: steel });
      }
      parts.push(...flights("正常步高且从桥面直达地面的下桥石阶", 28, .2, .32, 5, 5.6, [side * 32, 0], side < 0 ? 180 : 0));
      for (const z of [-2.4, 2.4]) parts.push(rail([side * 32, 6.7, z], [side * 40.96, 1.1, z], .07, steel), box("下桥阶道末端真正落地的扶手竖柱", side * 40.96, .55, z, .07, 1.1, .07, steel));
    }
    for (const z of [-2.5, 2.5]) {
      const path: Triple[] = Array.from({ length: 25 }, (_, i) => { const x = -24 + i * 2; return [x, cableY(x), z]; });
      parts.push(tapered("越过双塔并连续下垂的实际主承载缆", steel, path, path.map(() => .085)));
      for (const x of [-21, -14, -7, 0, 7, 14, 21]) parts.push({ ...pipe("主缆与刚性桥身之间的独立竖吊杆", [x, 5.4, z], [x, cableY(x), z], .065), color: steel });
      parts.push(rail([-32, 6.7, z * .96], [32, 6.7, z * .96], .07, steel));
      for (const x of [-32, -24, -16, -8, 0, 8, 16, 24, 32]) parts.push(box("连接刚性桥面的固定护栏柱", x, 6.15, z * .96, .07, 1.1, .07, steel));
    }
    return parts;
  }, "建筑", "现代"),
  design("空腹刚架双层观景桥", "上下两条连续步行层由矩形空腹刚架共同承托，侧壁开孔保持横向视野，两岸独立上层阶梯落入下层候行台，再由外侧石阶连到地面", () => {
    const parts: ModelPart[] = [box("下层完整贯通步行桥面", 0, 4.2, 0, 48, .3, 6, paving), box("上层完整贯通眺望步行桥面", 0, 7.7, 0, 36, .3, 6, paving)], guardPosts: Bar[] = [];
    for (const z of [-2.9, 2.9]) {
      parts.push(box("矩形空腹刚架的连续下弦", 0, 4, z, 37, .4, .35, steel), box("同时承托上层楼面的连续刚接上弦", 0, 7.5, z, 37, .4, .35, steel), rail([-18, 8.95, z], [18, 8.95, z], .07, steel));
      for (const x of [-18, -9, 0, 9, 18]) parts.push(box("上下弦之间实际刚接的矩形空腹柱", x, 5.75, z, .4, 3.5, .35, steel), box("上层眺望面的实际护栏竖杆", x, 8.4, z, .07, 1.1, .07, steel));
    }
    for (const x of [-18, -9, 0, 9, 18]) parts.push(box("连接左右刚架并托住下层桥板的横梁", x, 4, 0, .3, .4, 6.2, steel), box("将左右上弦连为完整楼盖的横梁", x, 7.5, 0, .3, .4, 6.2, steel));
    for (const side of [-1, 1]) {
      parts.push(box("下层岸端候行台的完整承台", side * 21, 2.025, 0, 6, 4.05, 6.8, stone), ...flights("在桥端连接上下两条通行层的连续阶梯", 20, .175, .28, 2.5, 7.85, [side * 18, 0], side < 0 ? 180 : 0, stone, 4.35), ...flights("由下层候行台真正降至地面的外阶", 25, .174, .3, 6, 4.35, [side * 24, 0], side < 0 ? 180 : 0));
      for (const z of [-1.2, 1.2]) { parts.push(rail([side * 18, 8.95, z], [side * 23.6, 5.45, z], .07, steel), box("上下桥层阶梯末端的落脚扶手柱", side * 23.6, 4.9, z, .07, 1.1, .07, steel)); guardPosts.push({ center: [side * 18, 8.4, z], size: [.07, 1.1, .07] }); }
      for (const z of [-2.85, 2.85]) { parts.push(rail([side * 24, 5.45, z], [side * 31.5, 1.1, z], .07, steel), box("下层外阶末端真正落地的扶手柱", side * 31.5, .55, z, .07, 1.1, .07, steel)); guardPosts.push({ center: [side * 24, 4.9, z], size: [.07, 1.1, .07] }); }
    }
    for (const z of [-2.85, 2.85]) parts.push(rail([-24, 5.45, z], [24, 5.45, z], .07, steel));
    parts.push(...solidBars(guardPosts, "连接双层阶道起点与桥面护栏的真实落脚端柱"));
    return parts;
  }, "建筑", "现代"),
  design("锚泊开放河泳浮场", "宽环形甲板与下方浮筒围住开放泳区，下挂立体安全格笼保留真实网孔，四角锚缆约束浮场，独立铰接坡板把浮台接到高位岸台", () => {
    const parts: ModelPart[] = [hardPlan("中间真正开孔的完整环形浮动甲板", wood, [[-16, -22], [16, -22], [16, 22], [-16, 22]], .3, [0, 2.7, 0], [[[-12, -18], [12, -18], [12, 18], [-12, 18]]]), box("接岸端高位完整候行台", 0, 2.15, -35, 6, 4.3, 3, stone)];
    for (const x of [-14, 14]) parts.push(cylinder("长边连续水上承载浮筒", x, 2.25, 0, 1.2, 43, "#8fada1", [90, 0, 0]));
    for (const z of [-20, 20]) parts.push(cylinder("短边闭合浮力布置的横浮筒", 0, 2.25, z, 1.2, 28, "#8fada1", [0, 0, 90]));
    for (const x of [-1, 1]) for (const z of [-1, 1]) parts.push(box("四角外侧独立沉底锚块", x * 20, .15, z * 26, 2.2, .3, 2.2, stone), pipe("从浮台侧缘连到锚块的实际定位缆", [x * 15.5, 2.75, z * 21.5], [x * 20, .3, z * 26], .055));
    const bars: Bar[] = [];
    for (const side of [-1, 1]) {
      for (let z = -18; z <= 18; z += 3) bars.push({ center: [side * 12, 1.55, z], size: [.04, 2.3, .04] });
      for (let x = -9; x <= 9; x += 3) bars.push({ center: [x, 1.55, side * 18], size: [.04, 2.3, .04] });
      for (const y of [.4, .85, 1.3, 1.75, 2.2, 2.65]) bars.push({ center: [side * 12, y, 0], size: [.04, .04, 36] }, { center: [0, y, side * 18], size: [24, .04, .04] });
      parts.push(box("浮场外缘独立长护栏顶梁", side * 15.6, 4.05, 0, .08, .08, 44, steel));
      for (const z of [-21, -14, -7, 0, 7, 14, 21]) parts.push(box("环形甲板外缘实际落脚护栏柱", side * 15.6, 3.525, z, .07, 1.05, .07, steel));
      parts.push(box("浮场外缘前侧留铰坡入口的护栏横梁", side * 9.2, 4.05, -21.6, 12.8, .08, .08, steel));
      for (const x of [-10, -4, 4, 10]) parts.push(box("浮场两端实际落脚护栏柱", x, 3.525, side * 21.6, .07, 1.05, .07, steel));
    }
    for (let x = -12; x <= 12; x += 2) bars.push({ center: [x, .4, 0], size: [.04, .04, 36] });
    for (let z = -18; z <= 18; z += 2) bars.push({ center: [0, .4, z], size: [24, .04, .04] });
    const gangway = hardPlan("两端顶面与岸台和浮台实际接平的铰接过桥", wood, [[22, -2.7], [33.5, -4], [33.5, -4.3], [22, -3]], 5);
    gangway.vertices = gangway.vertices!.map(p => ({ x: p.y - 2.5, y: -p.z, z: -p.x }));
    parts.push(...solidBars(bars), box("浮场后缘完整闭合的低护栏横梁", 0, 4.05, 21.6, 31.2, .08, .08, steel), part("泳区内示意与河面连通的浅水面", "box", colors.water, [0, 2.3, 0], [23.8, .025, 35.8], [0, 0, 0], { opacity: .45, roughness: .22 }), gangway, cylinder("浮台端贯穿整宽的真实铰轴", 0, 2.86, -22, .22, 5.3, steel, [0, 0, 90]), cylinder("岸台边缘实际承接过桥的铰轴", 0, 4.15, -33.5, .22, 5.3, steel, [0, 0, 90]));
    for (const x of [-2.4, 2.4]) parts.push(rail([x, 4.05, -22], [x, 5.35, -33.5], .07, steel), box("浮台接桥口实际落脚的扶手端柱", x, 3.525, -22, .07, 1.05, .07, steel), box("岸台接桥口实际落脚的扶手端柱", x, 4.825, -33.5, .07, 1.05, .07, steel), pipe("泳区可由甲板手持下水的梯边", [x, 1.3, -17.75], [x, 3.7, -17.75], .07));
    for (const y of [1.4, 1.8, 2.2, 2.6]) parts.push(pipe("宽下水梯的独立水平踏杆", [-2.4, y, -17.75], [2.4, y, -17.75], .07));
    return parts;
  }, "设施", "现代"),
  design("四轴浅渠下沉水园", "四块下沉植床围绕中央水盆与十字浅渠，外圈完整高台从四个轴向石阶下降，低桥跨渠连接步道，开口渠壁把中央盆和四支水渠实际连通", () => {
    const parts: ModelPart[] = [box("完整下沉庭园低位基础地坪", 0, .1, 0, 56, .2, 56, stone)];
    const corner: [number, number][] = [[3, 22], [22, 22], [22, 3], [28, 3], [28, 28], [3, 28]];
    for (const x of [-1, 1]) for (const z of [-1, 1]) {
      const plan = corner.map(([a, b]): [number, number] => [a * x, b * z]);
      parts.push(hardPlan("四角连续围住低庭而留轴向阶道的高土台", "#a19c7d", plan, 3.2, [0, .2, 0]), hardPlan("高台上方连续可行走的铺装环廊", paving, plan, .1, [0, 3.4, 0]), box("下沉分区内独立留空待栽植的土床", x * 11.5, .375, z * 11.5, 17, .35, 17, "#a09571"));
      for (const side of [-1, 1]) parts.push(box("四分植床外缘连续低石边", x * 11.5 + side * 8.5, .475, z * 11.5, .2, .55, 17.2, stone), box("四分植床内外边缘连续石边", x * 11.5, .475, z * 11.5 + side * 8.5, 17.2, .55, .2, stone));
    }
    for (const degrees of [0, 90, 180, 270]) {
      const a = degrees * Math.PI / 180, x = Math.cos(a), z = Math.sin(a), nx = -z, nz = x;
      parts.push(...flights("从高环廊连续降入低庭的轴向石阶", 20, .165, .3, 4.8, 3.5, [x * 28, z * 28], 180 - degrees, stone, .2));
      const floor = box("十字浅渠每臂实际连续的水底", x * 12, .3, z * 12, 2, .2, 18, stone); floor.rotation.y = 90 - degrees; parts.push(floor);
      const water = box("与中央水盆连通且止于端壁内侧的浅渠静态水面", x * 11.9, .7, z * 11.9, 1.6, .025, 17.8, colors.water); water.rotation.y = 90 - degrees; parts.push(water);
      for (const side of [-1, 1]) { const wall = box("十字浅渠的独立连续侧壁", x * 12 + nx * side, .6, z * 12 + nz * side, .2, .8, 18, stone); wall.rotation.y = 90 - degrees; parts.push(wall); }
      const endWall = box("与阶道落脚区分开且真正封住浅渠末端的止水壁", x * 20.9, .6, z * 20.9, 2.2, .8, .2, stone); endWall.rotation.y = 90 - degrees; parts.push(endWall);
      const bridgeProfile: [number, number][] = [[-2.8, .2], [-2.8, .4], [-2.4, .4], [-2.4, .6], [-2, .6], [-2, .8], [-1.6, .8], [-1.6, 1], [-1.2, 1], [1.2, 1], [1.6, 1], [1.6, .8], [2, .8], [2, .6], [2.4, .6], [2.4, .4], [2.8, .4], [2.8, .2], [1.2, .2], [1.2, .8], [-1.2, .8], [-1.2, .2]];
      const bridge = hardPlan("两端石阶落地且中间真实留通水孔的跨渠小桥", paving, bridgeProfile.map(([a, b]) => [a, -b]), 1.8);
      bridge.vertices = bridge.vertices!.map(p => ({ x: p.x, y: -p.z, z: p.y - .9 })); bridge.position = { x: x * 11, y: 0, z: z * 11 }; bridge.rotation.y = -90 - degrees; parts.push(bridge);
      const outer = Array.from({ length: 7 }, (_, i): [number, number] => { const t = (degrees + 15 + i * 10) * Math.PI / 180; return [Math.cos(t) * 3.4, Math.sin(t) * 3.4]; }), inner = Array.from({ length: 7 }, (_, i): [number, number] => { const t = (degrees + 75 - i * 10) * Math.PI / 180; return [Math.cos(t) * 3.2, Math.sin(t) * 3.2]; });
      parts.push(hardPlan("中央水盆在四道渠口之间的真实弧壁", stone, [...outer, ...inner], .8, [0, .2, 0]));
    }
    parts.push(cylinder("中央汇水盆完整不漏的石底", 0, .325, 0, 6.8, .25, stone), cylinder("中央水盆与四支渠同高的静态水面", 0, .7, 0, 6.35, .025, colors.water));
    return parts;
  }, "建筑", "异域"),
  design("双层错台穿瀑游廊", "上层环台围住真实落水洞，下层廊道从静态水帘后方穿过，两条游线有各自落地石阶，后部高水渠与下方接水池构成完整上下空间", () => {
    const parts: ModelPart[] = [...poolFloor(), hardPlan("中部真实开落水洞的上层完整环形楼面", paving, [[-12, -7], [12, -7], [12, 7], [-12, 7]], .3, [0, 7.2, 0], [[[-4, -3], [4, -3], [4, 3], [-4, 3]]]), box("水帘背后连续穿行的下层横廊", 0, 2.25, 4.6, 19, .3, 3, paving), ...[-1, 1].map(side => box("从前方入口绕到水帘背后的侧走廊", side * 8, 2.25, -2.7, 3, .3, 14.6, paving))];
    for (const x of [-10.5, 10.5]) for (const z of [-5.5, 5.5]) parts.push(box("上层环台独立落地支墩", x, 3.6, z, .65, 7.2, .65, stone), box("支墩底部宽基础", x, .2, z, 2.3, .4, 2.3, stone));
    for (const x of [-8, 8]) for (const z of [-8.7, 4.5]) parts.push(box("低廊楼面下方实际承重短柱", x, 1.05, z, .5, 2.1, .5, stone));
    parts.push(box("高水渠从后部承到落水口的完整槽底", 0, 7.65, 7.8, 6.6, .3, 10.6, stone), ...[-1, 1].map(side => box("高水渠两侧保留真实槽内空间的护壁", side * 3.2, 8.25, 7.8, .2, 1.2, 10.6, stone)), box("高槽后端完整止水墙", 0, 8.25, 13, 6.6, 1.2, .2, stone), box("高水渠上方静态浅水面", 0, 8.05, 7.8, 6.1, .025, 10.5, colors.water), part("贯穿落水洞而不封住帘后游线的静态水帘", "box", colors.water, [0, 4.58, 2.5], [6.1, 6.94, .07], [0, 0, 0], { opacity: .4, roughness: .2 }));
    for (const x of [-2.5, 2.5]) parts.push(box("高槽后段连接地面的独立承水柱", x, 3.75, 11, .6, 7.5, .6, stone));
    parts.push(box("上层外伸阶道与环台的连接平台", -13.8, 7.35, -6, 4.4, .3, 3, paving), box("上层阶道外侧落地承托台", -15.2, 3.6, -6, .8, 7.2, 2.5, stone), ...flights("上层独立旁置下行石阶", 40, .1875, .32, 3, 7.5, [-15.2, -7.5], 90));
    for (const x of [-8, 8]) parts.push(...flights("低廊入口连接地面的石阶", 12, .2, .3, 3, 2.4, [x, -10], 90));
    parts.push(box("左环台外缘留出上层阶道入口的低防护壁", -11.6, 8.05, 1.5, .16, 1.1, 11, stone), box("右环台外缘连续低防护壁", 11.6, 8.05, 0, .16, 1.1, 14, stone));
    parts.push(box("上环台前方连续低防护壁", 0, 8.05, -6.6, 24, 1.1, .16, stone), ...[-1, 1].map(side => box("高水渠两侧的上环台后缘防护壁", side * 7.7, 8.05, 6.6, 8.6, 1.1, .16, stone)), ...[-1, 1].map(side => box("水洞两侧不封洞的内圈防护壁", side * 4, 8.05, 0, .14, 1.1, 6, stone)), box("水洞前缘保持通透的低防护壁", 0, 8.05, -3, 8, 1.1, .14, stone));
    for (const x of [-9.4, 9.4]) {
      parts.push(rail([x, 3.45, -10], [x, 3.45, 4.6], .07, steel));
      for (const z of [-10, -3, 4.6]) parts.push(box("低廊外侧与楼面实际相接的栏杆立柱", x, 2.925, z, .07, 1.05, .07, steel));
    }
    parts.push(rail([-9.4, 3.45, 6], [9.4, 3.45, 6], .07, steel));
    for (const x of [-9.4, 0, 9.4]) parts.push(box("帘后横廊与楼面实际相接的栏杆立柱", x, 2.925, 6, .07, 1.05, .07, steel));
    return parts;
  }, "建筑", "现代"),
];
