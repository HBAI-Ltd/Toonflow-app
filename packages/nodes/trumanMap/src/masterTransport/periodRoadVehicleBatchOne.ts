import { part, ring, type ModelPart, type Triple } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { box, cylinder, strut, surface, transportColors, wheel, type TransportDefinition } from "./parts";

export function periodBody(name: string, sections: [number, number, number, number][], color: string): ModelPart {
  const vertices = sections.flatMap(([z, w, bottom, top]) => { const h = top - bottom; return [[-0.8 * w, bottom], [0.8 * w, bottom], [w, bottom + h * 0.15], [w, top - h * 0.15], [0.8 * w, top], [-0.8 * w, top], [-w, top - h * 0.15], [-w, bottom + h * 0.15]].map(([x, y]) => ({ x: x!, y: y!, z })); }), indices: number[] = [];
  for (let level = 0; level < sections.length - 1; level++) for (let index = 0; index < 8; index++) { const a = level * 8 + index, b = level * 8 + (index + 1) % 8; indices.push(a, b, b + 8, a, b + 8, a + 8); }
  const first = vertices.length, last = first + 1, end = (sections.length - 1) * 8;
  vertices.push({ x: 0, y: (sections[0]![2] + sections[0]![3]) / 2, z: sections[0]![0] }, { x: 0, y: (sections.at(-1)![2] + sections.at(-1)![3]) / 2, z: sections.at(-1)![0] });
  for (let index = 0; index < 8; index++) indices.push(first, (index + 1) % 8, index, last, end + index, end + (index + 1) % 8);
  return part(name, "mesh", color, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

export function periodSpokedWheel(center: Triple, radius: number): ModelPart[] {
  const [x, y, z] = center, parts = [ring("留出真实轮辐空隙的高轮橡胶胎圈", transportColors.dark, radius, radius * 0.18, 0, 0.15, { position: { x, y, z }, rotation: { x: 0, y: 0, z: 90 } }), ring("与橡胶胎内缘实际相接的金属轮辋", transportColors.trim, radius * 0.84, radius * 0.07, 0, 0.16, { position: { x, y, z }, rotation: { x: 0, y: 0, z: 90 } }), cylinder("高轮中央车桥轮毂", [x, y, z], [radius * 0.3, 0.2, radius * 0.3], transportColors.trim, [0, 0, 90])];
  for (let spoke = 0; spoke < 6; spoke++) { const a = spoke * Math.PI / 3; parts.push(strut("从轮毂连续接到轮辋的真实放射轮辐", [x, y, z], [x, y + Math.cos(a) * radius * 0.81, z + Math.sin(a) * radius * 0.81], 0.022, transportColors.wood)); }
  return parts;
}

export function periodGear(radius: number, track: number, front: number, rear: number, spoked = false, supportWidth = track * 0.28): ModelPart[] {
  const parts: ModelPart[] = [];
  for (const z of [front, rear]) {
    parts.push(cylinder("车架与左右轮组实际相连的贯通车桥", [0, radius, z], [0.085, track, 0.085], transportColors.dark, [0, 0, 90]));
    for (const side of [-1, 1]) parts.push(strut("由车桥上接中央底盘的独立悬架连杆", [side * supportWidth, radius, z], [side * supportWidth, radius + 0.27, z + 0.08], 0.065));
    for (const side of [-1, 1]) {
      const x = side * track / 2;
      if (!spoked) { parts.push(...wheel([x, radius, z], radius, 0.18)); continue; }
      parts.push(...periodSpokedWheel([x, radius, z], radius));
    }
  }
  return parts;
}

export function periodSides(name: string, top: [number, number][], wheelZ: number[], radius: number, width: number, color: string, innerHeights?: number[]): ModelPart[] {
  const base = radius + 0.08, cut = radius + 0.07, start = Math.asin((base - radius) / cut), outline: [number, number][] = [...top, [top.at(-1)![0], base]];
  for (const z of [...wheelZ].sort((a, b) => b - a)) for (let index = 0; index <= 12; index++) { const a = start + index / 12 * (Math.PI - start * 2); outline.push([z + Math.cos(a) * cut, radius + Math.sin(a) * cut]); }
  outline.push([top[0]![0], base]);
  return [-1, 1].flatMap(side => {
    const panel = polygon(name, color, outline, 0.06, [side * width - 0.03, 0, 0]); panel.rotation = { x: -90, y: 0, z: -90 };
    const points: Triple[] = top.flatMap(([z, y], index) => [[side * (width - 0.36), (innerHeights?.[index] ?? y) - 0.006, z], [side * width, y - 0.006, z]] as Triple[]), faces: number[] = [];
    for (let index = 0; index < top.length - 1; index++) { const a = index * 2; faces.push(a, a + 1, a + 3, a, a + 3, a + 2); }
    return [panel, surface("在轮胎上方把中央车身连续接至侧围的实体肩板", color, points, faces)];
  });
}

export function periodFenders(wheelZ: number[], radius: number, track: number, color: string): ModelPart[] {
  const profile = [radius + 0.11, radius + 0.065].flatMap((r, layer) => Array.from({ length: 11 }, (_, index) => { const a = (layer ? 10 - index : index) * Math.PI / 10; return { x: Math.cos(a) * r, y: radius + Math.sin(a) * r }; }));
  return wheelZ.flatMap(z => [-1, 1].map(side => part("独立于轮胎且保留轮上间隙的弧形翼子板", "extrude", color, [side * track / 2, 0, z], [1, 1, 1], [0, -90, 0], { depth: 0.3, profile })));
}

export function periodCabin(name: string, profile: [number, number][], windows: [number, number][][], width: number, color: string, roofColor = color): ModelPart[] {
  const parts: ModelPart[] = [];
  for (const side of [-1, 1]) {
    const frame = polygon(`${name}真实开窗侧围`, color, profile, 0.05, [side * width - 0.025, 0, 0], windows); frame.rotation = { x: -90, y: 0, z: -90 }; parts.push(frame);
    for (const opening of windows) { const glass = polygon(`${name}侧窗玻璃`, transportColors.glass, opening, 0.008, [side * width + side * 0.015 - 0.004, 0, 0]); glass.rotation = { x: -90, y: 0, z: -90 }; glass.opacity = 0.4; parts.push(glass); }
  }
  for (let index = 0; index < profile.length - 1; index++) {
    const a = profile[index]!, b = profile[index + 1]!, glazed = index === 0 || index === profile.length - 2, panel = surface(glazed ? `${name}前后风挡` : `${name}连续车顶`, glazed ? transportColors.glass : roofColor, [[-width, a[1], a[0]], [width, a[1], a[0]], [width, b[1], b[0]], [-width, b[1], b[0]]], [0, 1, 2, 0, 2, 3]); if (glazed) panel.opacity = 0.4; parts.push(panel);
  }
  return parts;
}

export function periodTrim(front: number, rear: number, width: number, lampY = 0.95, rearLampWidth = width * 0.65, rearLampY = 0.92): ModelPart[] {
  const parts: ModelPart[] = [box("前部与车架实际相接的宽横保险杠", [0, 0.55, front - 0.05], [width * 1.9, 0.12, 0.12], transportColors.trim), box("后部与车架实际相接的宽横保险杠", [0, 0.55, rear + 0.05], [width * 1.9, 0.12, 0.12], transportColors.trim)];
  for (const side of [-1, 1]) parts.push(cylinder("车身前端独立圆形前照灯", [side * width * 0.62, lampY, front - 0.015], [0.22, 0.12, 0.22], transportColors.trim, [90, 0, 0]), box("车尾两侧与后围相接的独立尾灯", [side * rearLampWidth, rearLampY, rear + 0.015], [0.16, 0.12, 0.05], transportColors.signal));
  return parts;
}

export function periodSteering(center: Triple, root: Triple, radius = 0.18): ModelPart[] {
  const angle = Math.atan2(center[2] - root[2], center[1] - root[1]), parts = [ring("带真实中孔和轮辐的方向盘轮圈", transportColors.dark, radius, 0.025, 0, 0.04, { position: { x: center[0], y: center[1], z: center[2] }, rotation: { x: angle * 180 / Math.PI, y: 0, z: 0 } }), strut("从仪表台同轴承接到方向盘中心的转向柱", root, center, 0.03)];
  for (let index = 0; index < 3; index++) { const a = index * Math.PI * 2 / 3; parts.push(strut("把转向柱中心实际连到方向盘圈的轮辐", center, [center[0] + Math.cos(a) * (radius - 0.01), center[1] - Math.sin(a) * Math.sin(angle) * (radius - 0.01), center[2] + Math.sin(a) * Math.cos(angle) * (radius - 0.01)], 0.02)); }
  return parts;
}

// 各车型分别组织整个车身、乘员舱、机罩及后围；没有品牌/年份/涂装参数组合扩主。
export const periodRoadVehicleBatchOne: TransportDefinition[] = [
  { name: "高轮窄车身双排敞篷旅行汽车", theme: "现代", tags: ["汽车", "影视", "生活常见", "年代车", "敞篷旅行汽车", "黄铜风格高轮", "双排敞篷座舱", "独立翼子板与窄机罩"], create: () => {
    const color = "#53645b", parts: ModelPart[] = [...periodGear(0.4, 1.72, -1.45, 1.45, true), ...periodSides("双排敞篷旅行车真实轮拱侧围", [[-2.15, 0.95], [-0.65, 1.05], [1.85, 1.12], [2.05, 0.95]], [-1.45, 1.45], 0.4, 0.82, color), ...periodFenders([-1.45, 1.45], 0.4, 1.72, color), box("在车轮内侧保留轮胎空间的窄型承载车架", [0, 0.6, 0], [1.3, 0.16, 4.1], transportColors.dark), box("两排敞篷座舱下方的连续乘员地板", [0, 0.975, 0.55], [1.3, 0.12, 2.7], color), box("高立窄机罩的封闭发动机舱", [0, 1.05, -1.35], [0.68, 0.8, 1.3], color), box("窄机罩最前方的高立金属散热器框", [0, 1.1, -2.04], [0.72, 0.85, 0.1], transportColors.trim), box("后排座舱外侧的封闭后围", [0, 1.02, 1.94], [1.45, 0.5, 0.13], color)];
    parts.push(box("由地板连接敞篷前风挡与转向柱的仪表台", [0, 1.05, -0.65], [1.26, 0.2, 0.16], color), box("把两侧圆灯实际承接在水箱框上的横向灯架", [0, 1.2, -1.99], [1.05, 0.055, 0.065], transportColors.trim));
    for (const side of [-1, 1]) parts.push(box("从乘员地板连续上接敞篷腰围的内舱壁", [side * 0.59, 0.99, 0.55], [0.12, 0.28, 2.7], color));
    for (const z of [0.0, 1.15]) parts.push(box("前后两排可分别乘坐的宽座垫", [0, 1.1, z], [1.15, 0.17, 0.65], transportColors.wood), box("与对应座垫接合的直立长靠背", [0, 1.42, z + 0.28], [1.15, 0.55, 0.12], transportColors.wood), box("从中央底盘上托到乘员地板的座舱横梁", [0, 0.8, z], [1.2, 0.3, 0.12], transportColors.dark));
    for (const side of [-1, 1]) parts.push(box("车门外侧连接前后翼子板的长踏板", [side * 0.86, 0.64, 0], [0.3, 0.1, 1.95], transportColors.dark), cylinder("与高立散热器两侧相接的圆形前灯", [side * 0.48, 1.2, -1.99], [0.25, 0.18, 0.25], transportColors.trim, [90, 0, 0]), strut("敞篷座舱前方真实支承风挡的直立边柱", [side * 0.62, 1.1, -0.65], [side * 0.62, 1.95, -0.65], 0.045, transportColors.trim));
    const glass = box("直立边柱之间的完整透明前风挡", [0, 1.56, -0.65], [1.2, 0.8, 0.02], transportColors.glass); glass.opacity = 0.4; parts.push(glass, box("前风挡顶部连续的金属横框", [0, 1.97, -0.65], [1.28, 0.045, 0.05], transportColors.trim), ...periodSteering([-0.3, 1.4, -0.4], [-0.3, 1.1, -0.65], 0.19));
    return parts;
  } },
  { name: "长机罩船尾双座敞篷跑车", theme: "现代", tags: ["汽车", "影视", "生活常见", "年代车", "船尾双座敞篷跑车", "长前机罩", "后移双座舱", "尖收船尾后甲板"], create: () => {
    const color = "#9a765c", parts: ModelPart[] = [...periodGear(0.36, 1.65, -1.65, 1.35), ...periodSides("仅围合前机罩和开放乘员舱而不撑宽尖尾的真实轮拱侧围", [[-2.5, 1.02], [-0.4, 1.08], [0.85, 1.05]], [-1.65], 0.36, 0.79, color), ...periodFenders([-1.65, 1.35], 0.36, 1.65, color), periodBody("从长前机罩到后移双座舱下方的窄承载主体", [[-2.5, 0.56, 0.52, 1.02], [-0.45, 0.69, 0.52, 1.08], [0.9, 0.69, 0.52, 1.02], [2.45, 0.08, 0.55, 0.75]], color), periodBody("在双座舱后方独立尖收的船尾上甲板", [[0.8, 0.7, 1.0, 1.16], [1.35, 0.58, 0.95, 1.22], [2.45, 0.08, 0.75, 0.8]], color), box("开放双座舱内的长座垫", [0, 1.14, 0.3], [1.1, 0.16, 0.65], transportColors.dark), box("位于船尾甲板之前的双座靠背", [0, 1.42, 0.62], [1.1, 0.5, 0.12], transportColors.dark), box("前机罩端部的窄高散热器", [0, 0.97, -2.5], [0.6, 0.6, 0.1], transportColors.trim)];
    const glass = surface("从机罩后缘斜向后坐舱的低倾角前风挡", transportColors.glass, [[-0.57, 1.1, -0.45], [0.57, 1.1, -0.45], [0.57, 1.58, -0.1], [-0.57, 1.58, -0.1]], [0, 1, 2, 0, 2, 3]); glass.opacity = 0.4; parts.push(glass);
    for (const side of [-1, 1]) parts.push(strut("实际接在低风挡两侧的斜金属边框", [side * 0.59, 1.1, -0.45], [side * 0.59, 1.6, -0.1], 0.035, transportColors.trim), cylinder("船尾跑车前端与翼子板相接的独立圆灯", [side * 0.61, 0.93, -2.12], [0.24, 0.15, 0.24], transportColors.trim, [90, 0, 0]), box("前后独立翼子板之间的窄上车踏板", [side * 0.82, 0.58, -0.1], [0.25, 0.08, 1.9], transportColors.dark));
    parts.push(box("与低风挡根部实际相接的短仪表台", [0, 1.08, -0.44], [1.2, 0.1, 0.12], color), box("把敞篷座垫实际承接到车身地板的座基", [0, 1.045, 0.3], [1.14, 0.13, 0.66], color), ...periodSteering([-0.28, 1.36, -0.1], [-0.28, 1.08, -0.4], 0.16));
    for (const side of [-1, 1]) parts.push(strut("从窄船尾承载体实际接到外置后翼子板的短支架", [side * 0.46, 0.85, 1.35], [side * 0.825, 0.8, 1.35], 0.045, color));
    parts.push(box("船尾尖端独立的小型尾灯座", [0, 0.8, 2.45], [0.14, 0.12, 0.06], transportColors.signal)); return parts;
  } },
  { name: "直立水箱箱舱四门豪华轿车", theme: "现代", tags: ["汽车", "影视", "生活常见", "年代车", "战前四门豪华轿车", "长方高乘员舱", "窄立水箱与长机罩", "分体翼子板踏板"], create: () => {
    const color = "#495763", parts: ModelPart[] = [...periodGear(0.38, 1.74, -1.6, 1.6), ...periodSides("箱舱豪华轿车真实轮拱腰线侧围", [[-2.6, 1.03], [-0.7, 1.12], [1.75, 1.12], [2.6, 1.0]], [-1.6, 1.6], 0.38, 0.83, color), ...periodFenders([-1.6, 1.6], 0.38, 1.74, color), periodBody("高箱式乘员舱下方的长机罩及封闭后箱主体", [[-2.6, 0.6, 0.53, 1.03], [-0.7, 0.73, 0.53, 1.12], [1.75, 0.73, 0.53, 1.12], [2.6, 0.64, 0.53, 1.0]], color), ...periodCabin("直立箱舱", [[-0.7, 1.12], [-0.6, 2.0], [1.45, 2.03], [1.7, 1.12]], [[[-0.49, 1.27], [-0.45, 1.88], [0.26, 1.9], [0.26, 1.27]], [[0.38, 1.27], [0.38, 1.9], [1.32, 1.91], [1.49, 1.27]]], 0.71, color), box("高长机罩前端独立的直立水箱框", [0, 1.09, -2.6], [0.7, 0.82, 0.12], transportColors.trim), ...periodTrim(-2.6, 2.6, 0.85, 1.03)];
    for (const side of [-1, 1]) parts.push(box("贯通前后门外侧的宽上车踏板", [side * 0.87, 0.61, 0], [0.3, 0.1, 2.25], transportColors.dark), box("前门在腰线实体上的短金属把手", [side * 0.86, 1.05, 0.15], [0.07, 0.04, 0.18], transportColors.trim), box("后门在腰线实体上的短金属把手", [side * 0.86, 1.05, 1.3], [0.07, 0.04, 0.18], transportColors.trim));
    return parts;
  } },
  { name: "分体圆翼子板流线快背四门轿车", theme: "现代", tags: ["汽车", "影视", "生活常见", "年代车", "流线快背四门轿车", "20世纪中叶影视汽车", "弧顶长快背", "后围与车顶连续下滑", "独立圆翼子板"], create: () => {
    const color = "#697c73", parts: ModelPart[] = [...periodGear(0.36, 1.78, -1.48, 1.52), ...periodSides("流线快背轿车真实轮拱外侧腰围", [[-2.48, 0.96], [-0.75, 1.08], [1.6, 1.05], [2.48, 0.84]], [-1.48, 1.52], 0.36, 0.85, color), ...periodFenders([-1.48, 1.52], 0.36, 1.78, color), periodBody("由圆钝前围连续收分到低后围的封闭车身", [[-2.48, 0.62, 0.5, 0.96], [-1.1, 0.74, 0.5, 1.08], [1.5, 0.74, 0.5, 1.05], [2.48, 0.62, 0.5, 0.84]], color), ...periodCabin("连续快背舱", [[-1.05, 1.06], [-0.55, 1.78], [0.6, 1.88], [1.35, 1.64], [2.1, 0.93]], [[[-0.89, 1.2], [-0.49, 1.67], [0.2, 1.73], [0.2, 1.2]], [[0.32, 1.2], [0.32, 1.74], [0.65, 1.76], [1.22, 1.54], [1.56, 1.2]]], 0.73, color), ...periodTrim(-2.48, 2.48, 0.87, 0.94, 0.43, 0.78)];
    for (const side of [-1, 1]) parts.push(box("流线车门实体腰线上的独立金属把手", [side * 0.875, 1.0, 0.15], [0.06, 0.04, 0.19], transportColors.trim)); return parts;
  } },
  { name: "平直贯通腰线双门无柱硬顶轿车", theme: "现代", tags: ["汽车", "影视", "生活常见", "年代车", "双门无柱硬顶轿车", "长双门无中柱侧窗", "低矮平顶乘员舱", "宽前围低后箱"], create: () => {
    const color = "#9b9480", parts: ModelPart[] = [...periodGear(0.35, 1.83, -1.55, 1.55), ...periodSides("无柱硬顶轿车带真实轮拱的平直宽侧围", [[-2.65, 0.99], [-0.85, 1.09], [1.5, 1.09], [2.65, 0.99]], [-1.55, 1.55], 0.35, 0.87, color), periodBody("两端宽前围和后备箱保持整条水平腰线的长车身", [[-2.65, 0.73, 0.5, 0.99], [-0.85, 0.77, 0.5, 1.09], [1.5, 0.77, 0.5, 1.09], [2.65, 0.73, 0.5, 0.99]], color), ...periodCabin("双门无柱硬顶舱", [[-1.0, 1.08], [-0.55, 1.73], [0.85, 1.73], [1.5, 1.09]], [[[-0.85, 1.18], [-0.49, 1.64], [0.78, 1.64], [1.25, 1.18]]], 0.75, "#e0dccb"), ...periodTrim(-2.65, 2.65, 0.89, 0.96)];
    for (const side of [-1, 1]) parts.push(box("长双门后段的短金属外把手", [side * 0.895, 1.015, 0.65], [0.06, 0.04, 0.2], transportColors.trim), box("贯通门板而不过度伸入轮胎的窄下沿饰条", [side * 0.9, 0.72, 0], [0.035, 0.045, 1.8], transportColors.trim)); return parts;
  } },
  { name: "外露木框高车顶家用旅行车", theme: "现代", tags: ["汽车", "影视", "生活常见", "年代车", "木骨家用旅行车", "高长后部乘员货舱", "外露木框车身", "独立前机罩翼子板"], create: () => {
    const color = "#6b7567", parts: ModelPart[] = [...periodGear(0.37, 1.78, -1.55, 1.6), ...periodSides("木骨旅行车保留轮拱的长车身侧围", [[-2.5, 1.04], [-0.85, 1.11], [2.55, 1.11]], [-1.55, 1.6], 0.37, 0.85, color), ...periodFenders([-1.55, 1.6], 0.37, 1.78, color), periodBody("木骨舱之前的长机罩与后舱下部承载主体", [[-2.5, 0.63, 0.51, 1.04], [-0.85, 0.74, 0.51, 1.11], [2.55, 0.74, 0.51, 1.11]], color), ...periodCabin("木骨长旅行舱", [[-0.85, 1.11], [-0.5, 1.91], [2.35, 1.96], [2.55, 1.11]], [[[-0.68, 1.25], [-0.45, 1.8], [0.25, 1.81], [0.25, 1.25]], [[0.4, 1.25], [0.4, 1.82], [1.24, 1.83], [1.24, 1.25]], [[1.39, 1.25], [1.39, 1.84], [2.2, 1.85], [2.38, 1.25]]], 0.84, transportColors.wood), ...periodTrim(-2.5, 2.55, 0.88, 1.0)];
    for (const side of [-1, 1]) { for (const [z, top] of [[-0.65, 1.57], [0.32, 1.924], [1.31, 1.942], [2.4, 1.748]]) parts.push(box("在侧围实体与木骨车顶间连续连接的外露木立框", [side * 0.88, (top! + 1.07) / 2, z!], [0.08, top! - 1.05, 0.085], transportColors.wood)); parts.push(box("贯穿长后舱下半部的木质腰梁", [side * 0.88, 1.07, 0.85], [0.08, 0.1, 3.2], transportColors.wood)); }
    return parts;
  } },
];
