import { part, type ModelPart, type Triple } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { box, cylinder, strut, wheel, axles, cab, transportColors, type TransportDefinition } from "./parts";

function bellows(): ModelPart {
  const vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
  for (let section = 0; section <= 8; section++) {
    const width = section % 2 ? 1.18 : 1.26, bottom = section % 2 ? 0.77 : 0.69, top = section % 2 ? 2.67 : 2.75;
    for (const wall of [0, 0.045]) for (const [x, y] of [[-width + wall, bottom + wall], [width - wall, bottom + wall], [width - wall, top - wall], [-width + wall, top - wall]]) vertices.push({ x: x!, y: y!, z: 1 + section / 8 * 0.7 });
    if (section) for (let side = 0; side < 4; side++) {
      const a = (section - 1) * 8 + side, b = section * 8 + side, c = (section - 1) * 8 + (side + 1) % 4, d = section * 8 + (side + 1) % 4;
      indices.push(a, c, b, c, d, b, a + 4, b + 4, c + 4, c + 4, b + 4, d + 4);
    }
  }
  for (let side = 0; side < 4; side++) {
    const next = (side + 1) % 4, last = 64;
    indices.push(side, side + 4, next, next, side + 4, next + 4, last + side, last + next, last + side + 4, last + next, last + next + 4, last + side + 4);
  }
  return part("可贯通行走的真实中空风琴护罩", "mesh", transportColors.dark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

function passengerSection(center: number, length: number, door: number): ModelPart[] {
  const low = center - length / 2, high = center + length / 2, gap = 0.55;
  const parts: ModelPart[] = [box("客舱连续低位地板", [0, 0.73, center], [2.4, 0.15, length], transportColors.dark), box("客舱承重顶板", [0, 2.73, center], [2.48, 0.16, length], transportColors.body), box("无车门一侧的下部薄侧围", [-1.19, 1.18, center], [0.06, 0.76, length], transportColors.signal), { ...box("左侧整段窗带的半透明玻璃", [-1.2, 2.08, center], [0.025, 1.04, length - 0.14], transportColors.glass), opacity: 0.48 }, ...[-1, 1].map(side => box("窗带上方连续纵向承梁", [side * 1.18, 2.6, center], [0.065, 0.13, length], transportColors.body)), { ...box("位于真实侧围开口内的独立折门玻璃", [1.2, 1.68, door], [0.026, 1.76, 1.02], transportColors.glass), opacity: 0.48 }];
  for (const [a, b] of [[low, door - gap], [door + gap, high]]) {
    parts.push(box("避开乘客门洞的右侧下围板", [1.19, 1.18, (a! + b!) / 2], [0.06, 0.76, b! - a!], transportColors.signal), { ...box("避开门洞的右侧真实窗带", [1.2, 2.08, (a! + b!) / 2], [0.025, 1.04, b! - a!], transportColors.glass), opacity: 0.48 });
  }
  for (const side of [-1, 1]) for (const z of [low + 0.04, high - 0.04]) parts.push(box("客舱端部承重立柱", [side * 1.18, 1.73, z], [0.08, 1.9, 0.08], transportColors.body));
  for (const z of [door - gap, door + gap]) parts.push(box("乘客门洞两侧独立立柱", [1.18, 1.73, z], [0.08, 1.9, 0.075], transportColors.body));
  parts.push(box("左侧窗带中部承重竖柱", [-1.18, 2.08, center], [0.075, 1.05, 0.075], transportColors.body));
  for (const side of [-1, 1]) parts.push(box("面向前方的舱内长座坐面", [side * 0.72, 1.05, center + 0.6], [0.56, 0.17, 1.8], transportColors.dark), box("与座面连接的舱内长座靠背", [side * 0.72, 1.37, center + 1.45], [0.56, 0.62, 0.09], transportColors.dark));
  return parts;
}

function trackLoop(x: number, z: number, straight: number): ModelPart {
  const outline = (radius: number): [number, number][] => [...Array.from({ length: 9 }, (_, index): [number, number] => { const a = (-90 + index * 22.5) * Math.PI / 180; return [0.47 + Math.sin(a) * radius, straight / 2 + Math.cos(a) * radius]; }), ...Array.from({ length: 9 }, (_, index): [number, number] => { const a = (90 + index * 22.5) * Math.PI / 180; return [0.47 + Math.sin(a) * radius, -straight / 2 + Math.cos(a) * radius]; })];
  const value = polygon("绕过前后滚轮并贯通内腔的连续履带", transportColors.dark, outline(0.39), 0.46, [x + 0.23, 0, z], [outline(0.3)]);
  value.rotation.z = 90;
  return value;
}

// 各种载体采用不同的承载与转向架构，不按轴数、客位或舱体尺寸展开多个主项。
export const roadExpansionBatchFour: TransportDefinition[] = [
  { name: "液压摆轴调平自行模块式重载运输平台", theme: "现代", tags: ["SPMT", "自行模块运输车", "双胎摆轴与全轮转向"], create: () => {
    const parts: ModelPart[] = [box("承托大件的完整低平载货钢甲板", [0, 1.13, 0], [2.95, 0.18, 5.9], transportColors.body), ...[-1, 1].map(side => box("甲板下方纵向承载箱梁", [side * 0.65, 0.98, 0], [0.24, 0.24, 5.8], transportColors.dark)), box("悬挂在平台端部的独立动力包", [0, 1.12, 3.52], [1.8, 0.94, 1.05], transportColors.signal), box("动力包下方与平台连接的托架", [0, 0.76, 3.05], [1.65, 0.18, 1.4], transportColors.dark), box("动力包外侧散热器网面", [0, 1.12, 4.055], [1.5, 0.65, 0.04], transportColors.dark), cylinder("动力包顶部独立排气筒", [-0.45, 1.83, 3.5], [0.08, 0.48, 0.08], transportColors.dark), box("侧面就地操作与急停箱", [1.22, 1.33, 2.2], [0.28, 0.25, 0.45], transportColors.signal)];
    for (const side of [-1, 1]) for (const z of [-1.85, 0, 1.85]) {
      const x = side * 0.86, angle = z < 0 ? side * 12 : z > 0 ? -side * 12 : 0, radians = angle * Math.PI / 180;
      parts.push(cylinder("每个摆轴轮组独立转向的立式支承筒", [x, 0.83, z], [0.22, 0.43, 0.22], transportColors.body), cylinder("摆轴中心的双胎横向轮轴", [x, 0.36, z], [0.09, 0.69, 0.09], transportColors.dark, [0, angle, 90]), strut("从转向支承筒下伸的摆轴摇臂", [x, 0.68, z], [x, 0.36, z], 0.14, transportColors.signal), cylinder("独立液压调平悬架外筒", [x + side * 0.13, 0.8, z + 0.16], [0.09, 0.32, 0.09], transportColors.dark), cylinder("接到摆轴摇臂的调平活塞杆", [x + side * 0.13, 0.58, z + 0.16], [0.04, 0.2, 0.04], transportColors.trim), strut("活塞杆下端至摆轴的短连接耳", [x + side * 0.13, 0.49, z + 0.16], [x, 0.45, z], 0.065));
      for (const offset of [-0.22, 0.22]) {
        const tires = wheel([x + Math.cos(radians) * offset, 0.36, z - Math.sin(radians) * offset], 0.35, 0.22);
        for (const tire of tires) tire.rotation.y = angle;
        parts.push(...tires);
      }
    }
    return parts;
  } },
  { name: "贯通风琴护罩式城市铰接客车", theme: "现代", tags: ["铰接公交车", "中段通行铰接盘", "独立前后客舱"], create: () => {
    const parts: ModelPart[] = [...axles(2.06, [-5.5, -0.35, 5.7], 0.46), ...passengerSection(-3.25, 8.5, -5.25), ...passengerSection(4.6, 5.8, 4.5), bellows(), cylinder("连接前后客舱的水平转向通行盘", [0, 0.79, 1.35], [2.16, 0.1, 2.16], transportColors.body), box("驾驶端低位前围", [0, 1.2, -7.48], [2.4, 0.78, 0.07], transportColors.signal), { ...box("驾驶端全幅风挡玻璃", [0, 2.08, -7.48], [2.3, 1.02, 0.04], transportColors.glass), opacity: 0.48 }, box("尾舱低位后围", [0, 1.2, 7.48], [2.4, 0.78, 0.07], transportColors.signal), { ...box("尾舱后风挡玻璃", [0, 2.08, 7.48], [2.3, 1.02, 0.04], transportColors.glass), opacity: 0.48 }, box("驾驶员前方横向仪表台", [-0.55, 1.45, -6.95], [0.95, 0.18, 0.52], transportColors.dark), box("驾驶员独立坐垫", [-0.55, 1.05, -6.36], [0.5, 0.15, 0.52], transportColors.dark), box("驾驶员竖向椅背", [-0.55, 1.38, -6.08], [0.5, 0.65, 0.08], transportColors.dark)];
    for (const side of [-1, 1]) parts.push(box("前围低位道路照明灯", [side * 0.87, 1.23, -7.525], [0.35, 0.19, 0.025], transportColors.trim), box("尾部竖向制动与转向灯组", [side * 1.07, 1.23, 7.525], [0.14, 0.48, 0.025], transportColors.signal));
    return parts;
  } },
  { name: "中央转向铰接双体低压履带运输车", theme: "现代", tags: ["双节履带运输车", "独立前后浮式舱体", "雪地全地形运输"], create: () => {
    const parts: ModelPart[] = [];
    for (const [center, length, straight] of [[-2.37, 4.25, 2.85], [2.38, 3.8, 2.45]]) {
      parts.push(box("每节车体独立的低位船形承载底", [0, 0.89, center], [2.12, 0.28, length], transportColors.dark), part("独立舱体前后收分的封闭浮式壳", "extrude", transportColors.signal, [0, 1.03, center], [1, 1, 1], [-90, 0, 0], { depth: 0.27, profile: [{ x: -0.8, y: -length! / 2 }, { x: 0.8, y: -length! / 2 }, { x: 1.1, y: -length! / 2 + 0.4 }, { x: 1.1, y: length! / 2 - 0.35 }, { x: 0.78, y: length! / 2 }, { x: -0.78, y: length! / 2 }, { x: -1.1, y: length! / 2 - 0.35 }, { x: -1.1, y: -length! / 2 + 0.4 }] }));
      for (const side of [-1, 1]) {
        parts.push(trackLoop(side * 1.08, center!, straight!));
        for (const offset of [-straight! / 2, 0, straight! / 2]) parts.push(...wheel([side * 1.08, 0.47, center! + offset], 0.3, 0.36), strut("滚轮轴心至独立舱体底架的承托臂", [side * 0.7, 0.8, center! + offset], [side * 1.08, 0.47, center! + offset], 0.07));
      }
    }
    parts.push(...cab([0, 1.18, -2.8], [1.98, 1.65, 3.1]), box("前舱后方独立动力维护罩", [0, 1.52, -0.82], [1.9, 0.72, 0.64], transportColors.body), box("后舱开放载货地台", [0, 1.21, 2.38], [1.99, 0.14, 3.55], transportColors.body), ...[-1, 1].map(side => box("后载货舱薄侧围", [side * 1.02, 1.62, 2.38], [0.1, 0.78, 3.55], transportColors.signal)), ...[-1, 1].map(end => box("后载货舱端部围板", [0, 1.62, 2.38 + end * 1.73], [2.1, 0.78, 0.1], transportColors.signal)), strut("联接两节低车架的中央承重铰接颈", [0, 0.95, -0.25], [0, 0.95, 0.5], 0.24, transportColors.body), cylinder("允许前后节转向的独立竖直铰销", [0, 0.95, 0.15], [0.24, 0.55, 0.24], transportColors.dark));
    for (const side of [-1, 1]) parts.push(strut("中央铰接转向液压外筒", [side * 0.58, 1.12, -0.35], [side * 0.49, 1.085, 0.1], 0.1), strut("中央铰接转向外露活塞杆", [side * 0.49, 1.085, 0.1], [side * 0.4, 1.05, 0.55], 0.045, transportColors.trim));
    return parts;
  } },
  { name: "中央侧向伸叉长材侧装叉车", theme: "现代", tags: ["侧装叉车", "长材搬运", "侧向货台与伸叉门架"], create: () => {
    const parts: ModelPart[] = [...axles(2.18, [-1.98, 1.98], 0.43), box("纵向承载的低位完整车架", [0, 0.75, 0], [2.5, 0.35, 5.85], transportColors.dark), ...[-1, 1].map(side => box("车体侧面承重纵梁", [side * 1.18, 0.88, 0], [0.16, 0.35, 5.7], transportColors.body)), box("供长型负载靠放的全长侧货台", [0.71, 1.04, 0], [1.4, 0.15, 5.85], transportColors.body), ...cab([-0.65, 1.15, -1.86], [1.05, 1.5, 1.5]), box("与驾驶室分开的后置动力与平衡重", [-0.65, 1.43, 1.87], [1.05, 0.85, 1.75], transportColors.signal), box("中央伸叉门架下的横向移动导轨", [-0.48, 1.02, 0], [1.35, 0.16, 1.45], transportColors.dark), box("沿横向导轨滑动的门架底座", [-0.25, 1.15, 0], [0.4, 0.2, 1.4], transportColors.signal), cylinder("驱动门架整体横向伸出的液压缸", [-0.65, 1.12, 0.55], [0.09, 0.65, 0.09], transportColors.body, [0, 0, 90]), cylinder("横移缸外露活塞杆", [-0.24, 1.12, 0.55], [0.045, 0.35, 0.045], transportColors.trim, [0, 0, 90]), box("货叉承载架横向连接背板", [-0.2, 1.53, 0], [0.12, 0.64, 1.12], transportColors.body), box("门架顶端横向承重梁", [-0.3, 3.2, 0], [0.25, 0.16, 1.5], transportColors.signal), cylinder("门架内独立竖向举升缸", [-0.39, 2.08, 0], [0.12, 1.65, 0.12], transportColors.body), cylinder("举升缸向上伸出的活塞杆", [-0.39, 2.96, 0], [0.055, 0.35, 0.055], transportColors.trim)];
    for (const z of [-0.59, 0.59]) parts.push(box("横向面对长材货台的门架立柱", [-0.3, 2.17, z], [0.25, 2.1, 0.13], transportColors.signal), box("紧贴立柱的内升降导轨", [-0.15, 2.13, z], [0.08, 1.82, 0.09], transportColors.dark), box("与货叉架连接的竖直叉背", [-0.1, 1.65, z * 0.75], [0.09, 0.95, 0.13], transportColors.dark), box("沿侧货台横向伸出的真实货叉", [0.6, 1.18, z * 0.75], [1.48, 0.09, 0.13], transportColors.dark), cylinder("门架上端提升链导向滚轮", [-0.24, 3.07, z * 0.7], [0.12, 0.05, 0.12], transportColors.dark, [0, 0, 90]), strut("由上滚轮垂下接到货叉架的提升链", [-0.22, 3.07, z * 0.7 + 0.05], [-0.22, 1.75, z * 0.7 + 0.05], 0.018));
    return parts;
  } },
];
