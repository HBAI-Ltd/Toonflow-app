import { BoxGeometry } from "three";
import { part, ring, type ModelPart, type Triple } from "../assetModelParts";
import { polygon, sweptProfile } from "../masterNature/shared";
import { box, colors, cylinder, design, pipe, rail } from "./structures";

// 水楔推升、开放调压室及固定取水塔的构造资料；原创静态形体，不模拟水力过程。
// https://www.vnf.fr/vnf/points-d-interetss/la-pente-deau-de-montech/
// https://vitrinelinguistique.oqlf.gouv.qc.ca/fiche-gdt/fiche/9099601/pente-deau
// https://icid-ciid.org/Knowledge/basic_term/0/Tanks/2719
// https://www.publications.usace.army.mil/portals/76/publications/engineermanuals/em_1110-2-2100.pdf
const stone = "#a8ad9b", steel = "#728a82", paving = "#bcb79d", warm = "#b39f7a";

function hardPlan(name: string, color: string, outline: [number, number][], height: number, position: Triple = [0, 0, 0], holes: [number, number][][] = []): ModelPart {
  const value = polygon(name, color, outline, height, position, holes), source = value.vertices!;
  value.vertices = value.indices!.map(i => ({ ...source[i]! })); value.indices = value.vertices.map((_, i) => i); return value;
}

function section(name: string, color: string, profile: [number, number][], depth: number, axis: "x" | "z" = "z", offset = 0): ModelPart {
  const value = hardPlan(name, color, profile.map(([u, y]) => [axis === "x" ? -u : u, -y]), depth);
  value.vertices = value.vertices!.map(p => axis === "x" ? { x: p.y - depth / 2 + offset, y: -p.z, z: -p.x } : { x: p.x, y: -p.z, z: p.y - depth / 2 + offset });
  return value;
}

function steps(name: string, count: number, top: number, bottom: number, run: number, width: number, start: [number, number], yaw: number): ModelPart[] {
  const result: ModelPart[] = [], rise = (top - bottom) / count, a = yaw * Math.PI / 180;
  for (let offset = 0; offset < count; offset += 5) {
    const n = Math.min(5, count - offset), profile: [number, number][] = [[0, bottom]];
    for (let i = 0; i < n; i++) profile.push([i * run, top - (offset + i) * rise], [(i + 1) * run, top - (offset + i) * rise]);
    profile.push([n * run, bottom]); const value = section(name, stone, profile, width);
    value.position = { x: start[0] + Math.cos(a) * offset * run, y: 0, z: start[1] - Math.sin(a) * offset * run }; value.rotation.y = yaw; result.push(value);
  }
  return result;
}

type Bar = { center: Triple; size: Triple };
function solidBars(name: string, bars: Bar[], color = steel): ModelPart[] {
  const geometry = new BoxGeometry(1, 1, 1), p = geometry.attributes.position!, cube = Array.from({ length: p.count }, (_, i): Triple => [p.getX(i), p.getY(i), p.getZ(i)]), faces = Array.from(geometry.index!.array), result: ModelPart[] = [];
  geometry.dispose();
  for (let offset = 0; offset < bars.length; offset += 20) {
    const vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
    for (const { center, size } of bars.slice(offset, offset + 20)) { const n = vertices.length; vertices.push(...cube.map(([x, y, z]) => ({ x: center[0] + x * size[0], y: center[1] + y * size[1], z: center[2] + z * size[2] }))); indices.push(...faces.map(i => n + i)); }
    result.push(part(name, "mesh", color, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices }));
  }
  return result;
}

function foldedVault(): ModelPart[] {
  const result: ModelPart[] = [];
  const point = (zIndex: number, angleIndex: number, inner: boolean) => { const t = zIndex / 6, a = angleIndex * Math.PI / 12; return { x: Math.cos(a) * (13 - 5.2 * t - (inner ? .25 : 0)), y: 1.2 + Math.sin(a) * (10 - 4 * t - (inner ? .25 : 0)), z: -7 + 15 * t }; };
  // ACT: 完整双面厚壳按纵深拆两件，每件408顶点；各折面独立顶点，保留真实内外表面与封边。
  for (const start of [0, 3]) {
    const vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
    const quad = (points: { x: number; y: number; z: number }[]) => { const n = vertices.length; vertices.push(...points); indices.push(n, n + 1, n + 2, n, n + 2, n + 3); };
    for (let z = start; z < start + 3; z++) for (let a = 0; a < 12; a++) {
      quad([point(z, a, false), point(z, a + 1, false), point(z + 1, a + 1, false), point(z + 1, a, false)]);
      quad([point(z, a, true), point(z + 1, a, true), point(z + 1, a + 1, true), point(z, a + 1, true)]);
    }
    for (let a = 0; a < 12; a++) { quad([point(start, a, false), point(start, a, true), point(start, a + 1, true), point(start, a + 1, false)]); quad([point(start + 3, a, false), point(start + 3, a + 1, false), point(start + 3, a + 1, true), point(start + 3, a, true)]); }
    for (let z = start; z < start + 3; z++) { quad([point(z, 0, false), point(z + 1, 0, false), point(z + 1, 0, true), point(z, 0, true)]); quad([point(z, 12, false), point(z, 12, true), point(z + 1, 12, true), point(z + 1, 12, false)]); }
    result.push(part("由落地壳脚共同承托的连续前扩厚折壳", "mesh", warm, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices }));
  }
  return result;
}

export const landscapeSpaceBatchThirteenDesigns = [
  design("水楔推升式斜坡升船设施", "开放斜渠中的水平自由水面与上升渠底构成真实楔形水体，密封推盾由两岸耦合轮式机组推动，渠顶闸门隔开上游高水位，模型为推升中途的静态示意", () => {
    const parts: ModelPart[] = [section("从下游逐渐抬高的完整斜渠厚底", stone, [[-40, 0], [40, 8], [40, 8.4], [-40, .4]], 8.5, "x")];
    for (const side of [-1, 1]) {
      parts.push(section("随斜底上升而保留开放渠口的两侧渠壁", stone, [[-40, .4], [40, 8.4], [40, 12.1], [-40, 4.1]], .5, "x", side * 4.25), section("承托两岸机组连续行走道的实心坡岸", "#a39e7b", [[-40, 0], [40, 0], [40, 12.1], [-40, 4.1]], 3.5, "x", side * 6.25), box("耦合机组的完整承轮底架", side * 6.25, 8.95, 0, 2.2, .4, 5.4, steel), box("耦合机组独立动力机罩", side * 6.25, 9.55, .8, 1.8, .8, 3, "#8e9d81"), box("耦合机组前端驾驶舱", side * 6.25, 10.3, -1.5, 1.9, 1.9, 1.6, "#aeb69b"), part("驾驶舱可透视的前风窗", "box", colors.glass, [side * 6.25, 10.55, -2.31], [1.65, 1.05, .025], [0, 0, 0], { opacity: .3 }));
      for (const x of [-.8, .8]) for (const z of [-1.7, 1.7]) parts.push(cylinder("轮式耦合机组的实际坡岸行走轮", side * 6.25 + x, 8.5 + z * .1, z, .8, .25, "#556c61", [0, 0, 90]));
      parts.push(rail([side * 7.8, 5.2, -40], [side * 7.8, 13.2, 40], .07, steel));
      for (const z of [-40, -20, 0, 20, 40]) parts.push(box("坡岸外侧实际落脚的扶手立柱", side * 7.8, 4.65 + (z + 40) * .1, z, .07, 1.1, .07, steel));
    }
    const water = section("密封盾前上平下斜的实际水楔", colors.water, [[0, 4.4], [28, 7.2], [0, 7.2]], 7.95, "x"); water.opacity = .6; water.roughness = .2;
    parts.push(water, box("贴住斜渠断面并保住水楔的完整推盾", 0, 6, 0, 8, 3.2, .25, steel), box("推盾底部沿渠底接触的柔性密封条", 0, 4.45, -.04, 8.05, .15, .34, "#55685e"), box("把两岸机组连接为一体的跨渠推盾横梁", 0, 9.45, 0, 14.4, .6, .6, steel), ...[-1, 1].map(side => box("推盾到耦合横梁的实际竖连接吊架", side * 3.5, 8.4, 0, .22, 2.1, .3, steel)), box("上游高位渠首关闭的完整止水闸", 0, 10.35, 40, 8.1, 3.9, .3, steel));
    for (const side of [-1, 1]) {
      const floor = side < 0 ? .4 : 8.4, z = side * 47;
      parts.push(box("斜渠上下游接入渠的完整厚底", 0, floor - .2, z, 8.5, .4, 14, stone), box("接入渠静态水面", 0, floor + 1.8, z, 7.9, .025, 13.8, colors.water));
      for (const x of [-4.25, 4.25]) parts.push(box("接入渠两侧连续止水墙", x, floor + 1.85, z, .5, 3.7, 14, stone));
    }
    parts.push(box("高位接入渠底部实际落地支承实体", 0, 4, 47, 8.5, 8, 14, stone));
    return parts;
  }, "设施", "现代"),
  design("前扩折壳露天音乐台", "后部收窄的厚折壳向前形成完整大开口，壳脚连续落在梯形表演台两侧，后景厚壁保留真正出入门，前广场与后台各有落地台阶", () => {
    const parts: ModelPart[] = [hardPlan("承托整个折壳的完整梯形表演台", paving, [[-13, -7], [13, -7], [7.8, 8.2], [-7.8, 8.2]], 1.2), ...foldedVault(), box("面向完整舞台的低位观演广场", 0, .1, -18, 36, .2, 20, paving)];
    const back: [number, number][] = [[-7.8, 1.2]];
    for (let i = 1; i <= 12; i++) { const a = Math.PI - i * Math.PI / 12; back.push([Math.cos(a) * 7.8, 1.2 + Math.sin(a) * 6]); }
    back.push([1.2, 1.2], [1.2, 3.8], [-1.2, 3.8], [-1.2, 1.2]); parts.push(section("壳后完整景壁中央真正开放的后台门", warm, back, .35, "z", 8));
    parts.push(...steps("前广场到表演台的宽石阶", 6, 1.2, .2, .35, 7, [0, -7], 90), ...steps("后台门外真正连到地面的石阶", 6, 1.2, 0, .35, 2.4, [0, 8.2], -90));
    for (const side of [-1, 1]) parts.push(rail([side * 10, .2, 10.5], [side * 7.8, 4, 7.9], .45, stone));
    return parts;
  }, "建筑", "现代"),
  design("镜池架空穿廊庭园", "上层大镜池与外侧环台共同架在下层开放穿廊上，十字通行带避开支墩，顶层水壁真实承水，两端独立阶道把地面与环台连通", () => {
    const parts: ModelPart[] = [box("上下景观共用的低位完整铺装基础", 0, .1, 0, 56, .2, 36, paving), box("镜池下方连续承水厚底板", 0, 5.25, 0, 28, .5, 20, stone), hardPlan("镜池四周保持真正环通的上层步行楼板", paving, [[-18, -14], [18, -14], [18, 14], [-18, 14]], .4, [0, 5.1, 0], [[[-14, -10], [14, -10], [14, 10], [-14, 10]]]), part("大镜池内部静态反光水面", "box", colors.water, [0, 5.85, 0], [27.5, .025, 19.5], [0, 0, 0], { opacity: .75, roughness: .12 })];
    for (const side of [-1, 1]) parts.push(box("上层镜池两侧完整止水矮壁", side * 13.9, 5.85, 0, .2, .7, 20, stone), box("上层镜池前后完整止水矮壁", 0, 5.85, side * 9.9, 28, .7, .2, stone), box("环台前后不封住地面通行的低护壁", 0, 6.05, side * 13.8, 36, 1.1, .16, stone));
    for (const x of [-10, 10]) for (const z of [-6, 6]) parts.push(box("避开下层十字通行带的镜池支墩", x, 2.5, z, 1.2, 4.6, 1.2, stone));
    for (const z of [-6, 6]) parts.push(box("直接承托镜池厚底的连续横梁", 0, 4.9, z, 26, .4, .8, stone));
    for (const x of [-10, 10]) parts.push(box("横梁之间连续托住镜池的纵梁", x, 4.9, 0, .8, .4, 18, stone));
    const stairPosts: Bar[] = [];
    for (const side of [-1, 1]) {
      for (const z of [-11.5, 11.5]) parts.push(box("外侧环台独立落地支柱", side * 16, 2.65, z, .8, 4.9, .8, stone));
      for (const z of [-8, 8]) parts.push(box("两端阶道入口旁的真实低护壁", side * 17.8, 6.05, z, .16, 1.1, 12, stone));
      parts.push(...steps("上层镜池环台两端连续落地石阶", 30, 5.5, .2, .32, 3.2, [side * 17.8, 0], side < 0 ? 180 : 0));
      for (const z of [-1.5, 1.5]) { parts.push(rail([side * 17.8, 6.6, z], [side * 27.4, 1.3, z], .07, steel), box("阶道末端实际接到低铺装的扶手柱", side * 27.4, .75, z, .07, 1.1, .07, steel)); stairPosts.push({ center: [side * 17.8, 6.05, z], size: [.07, 1.1, .07] }); }
    }
    parts.push(...solidBars("架空镜池两端阶道上口实际落脚的扶手柱", stairPosts));
    return parts;
  }, "建筑", "现代"),
  design("上室扩张型开放调压塔", "竖直空心立井在高处逐渐扩入宽大开放调压室，侧面空心压力接管连到真实进水缺口，顶口保留自由液面及检修环台，外梯从基础连至高口", () => {
    const parts: ModelPart[] = [cylinder("调压立井独立宽基础", 0, .3, 0, 7, .6, stone), ring("侧接口下方闭合的短井壁", stone, 2.4, .35, .8, .4), ring("侧接口上方连续空心立井壁", stone, 2.4, .35, 11.3, 14.6)];
    const port = sweptProfile("立井低段真正留侧向接管缺口的井壁", stone, [[2.05, 1], [2.4, 1], [2.4, 4], [2.05, 4]], Math.PI * 16 / 9, 24); port.rotation.y = 160; parts.push(port);
    const outerPlatform = Array.from({ length: 21 }, (_, i): [number, number] => { const a = (275 + i * 17.5) * Math.PI / 180; return [Math.cos(a) * 7.25, Math.sin(a) * 7.25]; }), innerPlatform = Array.from({ length: 21 }, (_, i): [number, number] => { const a = (625 - i * 17.5) * Math.PI / 180; return [Math.cos(a) * 6.5, Math.sin(a) * 6.5]; });
    parts.push(part("从细立井连续扩入宽上室的空心厚壳", "lathe", stone, [0, 18.6, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 2.4, y: 0 }, { x: 6.5, y: 2 }, { x: 6.5, y: 8 }, { x: 6.15, y: 8 }, { x: 6.15, y: 2.2 }, { x: 2.05, y: 0 }] }), hardPlan("外梯出口保留真实开口的完整C形检修环台", paving, [...outerPlatform, ...innerPlatform], .1, [0, 26.6, 0]), ring("检修环台外侧连续低护壁", steel, 7.2, .08, 27.25, 1.1), cylinder("开放上室内部低于井口的静态自由液面", 0, 23.5, 0, 11.95, .025, colors.water));
    const input = ring("侧向真正空心的压力引水接口", steel, .82, .16, 0, 10); input.position = { x: -7.15, y: 2.5, z: 0 }; input.rotation.z = 90; parts.push(input);
    const opening = Array.from({ length: 12 }, (_, i): [number, number] => { const a = i * Math.PI / 6; return [Math.cos(a) * .66, -2.5 + Math.sin(a) * .66]; }), seal = hardPlan("侧向接口周围真实留圆孔的完整止水封壁", stone, [[-.9, -1], [.9, -1], [.9, -4], [-.9, -4]], .4, [0, 0, 0], [opening]);
    seal.vertices = seal.vertices!.map(p => ({ x: p.y - 2.4, y: -p.z, z: -p.x })); parts.push(seal);
    for (const x of [-12.15, -2.15]) { const flange = ring("压力引水管两端真实贯通法兰", steel, 1.05, .36, 0, .15); flange.position = { x, y: 2.5, z: 0 }; flange.rotation.z = 90; parts.push(flange); }
    for (const x of [-10.5, -5.5]) parts.push(box("侧向接管落地独立承托块", x, .84, 0, 1.1, 1.68, 1.8, stone));
    const bars: Bar[] = [];
    for (let y = .8; y <= 18.3; y += .5) bars.push({ center: [0, y, -2.65], size: [.8, .05, .05] });
    for (let i = 1; i <= 8; i++) bars.push({ center: [0, 18.6 + i * .25, -2.65 - 4.15 * i / 8], size: [.8, .05, .05] });
    for (let y = 20.8; y <= 26.3; y += .5) bars.push({ center: [0, y, -6.8], size: [.8, .05, .05] });
    parts.push(...solidBars("随扩张壳形转折而不穿过井壁的实际外梯级", bars));
    for (const x of [-.43, .43]) {
      parts.push(pipe("下部细立井外侧连续检修梯边", [x, .6, -2.65], [x, 18.6, -2.65], .065), pipe("顺着扩张壳外侧向外过渡的检修梯边", [x, 18.6, -2.65], [x, 20.6, -6.8], .065), pipe("穿过检修环台真实梯口并伸成上口扶手的梯边", [x, 20.6, -6.8], [x, 27.7, -6.8], .065));
      for (const y of [3, 8, 13, 18, 22, 26]) { const upper = y > 20; parts.push(pipe("梯边到真实井壁之间的独立短锚撑", [x, y, upper ? -6.45 : -2.35], [x, y, upper ? -6.8 : -2.65], .05)); }
    }
    for (const degrees of [0, 60, 120, 180, 240, 300]) { const a = degrees * Math.PI / 180; parts.push(rail([Math.cos(a) * 6.45, 24.5, Math.sin(a) * 6.45], [Math.cos(a) * 7.1, 26.6, Math.sin(a) * 7.1], .18, steel)); }
    return parts;
  }, "设施", "现代"),
  design("岸桥连通固定水库取水塔", "固定空心取水塔的下部和中层均有真实进水孔，内部环走台与外接高岸检修桥通达顶部操作室，外界可透过孔口观察竖向通井", () => {
    const parts: ModelPart[] = [box("固定取水塔完整宽基础", 0, .3, 0, 11, .6, 13, stone), box("固定取水塔实际封闭井底", 0, .8, 0, 8, .4, 10, stone), box("取水塔完整后侧承重实墙", 0, 11.85, 4.6, 8, 22.5, .8, stone)];
    for (const x of [-2.8, 2.8]) parts.push(box("正面进水孔两侧通高承重墙垛", x, 11.85, -4.6, 2.4, 22.5, .8, stone));
    parts.push(box("低位进水真孔下方厚底墙", 0, 1.5, -4.6, 3.2, 1.8, .8, stone), box("低位进水真孔上方承重墙", 0, 14.25, -4.6, 3.2, 17.7, .8, stone));
    for (const side of [-1, 1]) {
      for (const z of [-3.2, 3.2]) parts.push(box("侧向进水口前后通高承重墙段", side * 3.6, 11.85, z, .8, 22.5, 2.8, stone));
      parts.push(box("中层真实进水孔下方连续侧墙", side * 3.6, 4.55, 0, .8, 7.9, 3.6, stone), box("中层真实进水孔上方连续侧墙", side * 3.6, 17.3, 0, .8, 11.6, 3.6, stone));
    }
    const ladderHatch: [number, number][] = [[1.9, 3.1], [2.9, 3.1], [2.9, 4.1], [1.9, 4.1]];
    for (const y of [6, 12, 18]) parts.push(hardPlan("井内同时留通水井与检修梯井的环形走台", steel, [[-3.2, -4.2], [3.2, -4.2], [3.2, 4.2], [-3.2, 4.2]], .18, [0, y, 0], [[[-1.6, -2.6], [1.6, -2.6], [1.6, 2.6], [-1.6, 2.6]], ladderHatch]));
    parts.push(hardPlan("取水塔顶层保留实际外梯出口的操作平台", paving, [[-5, -6], [5, -6], [5, 6], [-5, 6]], .3, [0, 23.1, 0], [ladderHatch]), box("连通高岸和塔顶的完整检修桥面", 0, 23.25, 23, 3.6, .3, 36, paving), box("检修桥下方连续承重长箱梁", 0, 22.7, 23, 1.2, .8, 36, steel), box("检修桥近岸完整落地支承体", 0, 11.15, 39, 5, 22.3, 4, stone));
    for (const x of [-2.5, 2.5]) parts.push(box("操作室两侧完整墙面", x, 25, 0, .2, 3.2, 6, "#b7b49c"));
    parts.push(box("操作室后门两侧左墙垛", -1.65, 25, 3, 1.7, 3.2, .2, "#b7b49c"), box("操作室后门两侧右墙垛", 1.65, 25, 3, 1.7, 3.2, .2, "#b7b49c"), box("操作室后门上方实际过梁", 0, 26.3, 3, 1.6, .6, .2, "#b7b49c"), part("操作室面对水面的整片可透视玻璃", "box", colors.glass, [0, 25, -3], [4.8, 3.1, .025], [0, 0, 0], { opacity: .3 }), box("取水塔操作室完整遮雨顶", 0, 26.8, 0, 5.7, .4, 6.7, steel));
    const bars: Bar[] = [];
    for (let i = 0; i < 44; i++) bars.push({ center: [2.4, 1.2 + i * .5, 3.7], size: [.8, .05, .05] });
    for (const x of [2, 2.8]) parts.push(pipe("井内连接各层的连续检修梯边", [x, 1, 3.7], [x, 23.1, 3.7], .06));
    parts.push(...solidBars("井内各层走台之间完整且不封竖井的检修踏棍", bars));
    for (const x of [-1.7, 1.7]) {
      parts.push(rail([x, 24.5, 5], [x, 24.5, 41], .07, steel));
      for (const z of [5, 14, 23, 32, 41]) parts.push(box("高岸检修桥实际落在桥面的栏杆柱", x, 23.95, z, .07, 1.1, .07, steel));
    }
    for (const x of [-4.8, 4.8]) parts.push(box("塔顶操作平台两侧连续低护壁", x, 23.95, 0, .15, 1.1, 12, stone));
    parts.push(box("塔顶平台迎水侧连续低护壁", 0, 23.95, -5.8, 10, 1.1, .15, stone));
    for (const side of [-1, 1]) parts.push(box("塔顶背面留桥口的低护壁", side * 3.3, 23.95, 5.8, 3, 1.1, .15, stone));
    return parts;
  }, "设施", "现代"),
  design("侧堰横向集流溢洪道", "长侧堰将库水横向送入与堰线平行的集流槽，槽尾转弯后接下降泄槽及低位护底，入口与出口流向真正折转，水面仅作静态说明", () => {
    const parts: ModelPart[] = [section("沿长侧堰逐渐降低的完整集流槽底", stone, [[-32, 0], [8, 0], [8, 4.5], [-32, 5.7]], 12, "x", -2), section("长侧堰完整承水曲面厚体", stone, [[-9, 0], [-7, 0], [-7, 6.8], [-7.5, 7.7], [-8, 8], [-8.5, 7.8], [-9, 7.5]], 40, "z", -12), section("集流槽远岸跟随槽底降落的高侧墙", stone, [[-32, 5.7], [8, 4.5], [8, 8], [-32, 9.2]], .5, "x", 4.25), box("集流槽起端实际封水横墙", -2, 7.45, -32, 12, 3.5, .4, stone), box("槽尾真实折向的完整转弯底台", -2, 2.25, 14, 12, 4.5, 12, stone), box("转弯外侧完整横向高导墙", -2, 6.25, 20.2, 12, 3.5, .4, stone), box("转弯前端沿侧堰延伸的导墙", -8.2, 6.25, 14, .4, 3.5, 12, stone)];
    parts.push(section("由转弯槽尾直降到下游的完整泄槽底", stone, [[4, 0], [44, 0], [44, .4], [4, 4.5]], 12, "z", 14));
    for (const z of [7.8, 20.2]) parts.push(section("沿陡泄槽连续下降的止水侧墙", stone, [[4, 4.5], [44, .4], [44, 3.9], [4, 8]], .4, "z", z));
    parts.push(box("长侧堰外侧真实落地蓄水台", -17, 2.5, -12, 16, 5, 40, stone), box("侧堰入口上游静态高水面", -16.5, 8.05, -12, 17, .025, 39.8, colors.water), box("长侧堰顶部接到下落水帘的连续静态水唇", -7.5, 8.05, -12, 1.1, .025, 39.8, colors.water));
    const collector = section("集流槽内随底坡降的静态薄水层", colors.water, [[-32, 6.05], [8, 4.85], [8, 4.89], [-32, 6.09]], 11.6, "x", -2), curtain = section("长侧堰后方下降到槽内的连续静态水帘", colors.water, [[-32, 6.05], [8, 4.85], [8, 8.05], [-32, 8.05]], .04, "x", -6.95), chute = section("下游泄槽中贴近底坡的静态流水层", colors.water, [[4, 4.85], [44, .75], [44, .79], [4, 4.89]], 11.6, "z", 14); curtain.opacity = .45; parts.push(collector, curtain, chute, box("转弯槽内连续接入下降泄槽的静态水面", -2, 4.87, 14, 11.6, .04, 11.6, colors.water));
    parts.push(box("下游完整防冲刷接水护底", 50, .2, 14, 12, .4, 12, stone), box("下游低位护底内的静态水面", 50, 1.2, 14, 12, .025, 11.6, colors.water));
    for (const z of [7.8, 20.2]) parts.push(box("下游低位接水槽连续护墙", 50, 1.65, z, 12, 2.5, .4, stone));
    for (const z of [10, 14, 18]) parts.push(box("接水护底上独立凸起的消力块", 47, 1.1, z, 1, 1.4, 1, stone));
    return parts;
  }, "设施", "现代"),
];
