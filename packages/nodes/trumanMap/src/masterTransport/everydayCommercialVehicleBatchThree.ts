import type { ModelPart, Triple } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { rod } from "../masterObjects/parts";
import { box, cab, cylinder, strut, transportColors, type TransportDefinition } from "./parts";
import { commercialChassis, commercialLights, commercialMirrors } from "./everydayCommercialVehicleBatchOne";

export function flatFrontCommercialCab(z: number): ModelPart[] {
  const parts: ModelPart[] = [...cab([0, 1.12, z], [2.4, 1.85, 2.1]), box("把前桥上方驾驶室与底纵梁实际连在一起的动力承座", [0, .91, z], [1.25, .55, 1.6], transportColors.dark), box("驾驶室后方完整承力背壁", [0, 2.04, z + 1.02], [2.33, 1.85, .07], transportColors.body), box("平头驾驶室前围的独立散热格栅", [0, 1.56, z - 1.055], [1.62, .51, .04], transportColors.dark), box("平头驾驶室实际承托车灯的加厚低位前围", [0, 1, z - 1.1], [2.45, .32, .18], transportColors.body), box("驾驶室内部实际固定的横向仪表台", [0, 2.03, z - .75], [2.14, .2, .35], transportColors.dark)];
  const frontFrame = polygon("前风挡真正透窗且接入下围上盖与角柱的薄窗框", transportColors.body, [[-1.16, -2.04], [1.16, -2.04], [1.16, -2.94], [-1.16, -2.94]], .08, [0, 0, z - 1.027], [[[-1.04, -2.1375], [1.04, -2.1375], [1.04, -2.8775], [-1.04, -2.8775]]]);
  frontFrame.rotation.x = 90;
  parts.push(frontFrame);
  for (const side of [-1, 1]) {
    parts.push({ ...box("真实驾驶室柱间安装的侧风挡", [side * 1.13, 2.51, z], [.025, .7, 1.69], transportColors.glass), opacity: .34, roughness: .17 }, sidePanel("真实留有原侧窗孔且前后接到车端的门窗收口框", side * 1.13, [[2.04, z - 1.04], [2.94, z - 1.04], [2.94, z + 1.04], [2.04, z + 1.04]], .07, transportColors.body, [[[2.16, z - .84], [2.86, z - .84], [2.86, z + .84], [2.16, z + .84]]]), box("驾驶室侧门独立机械把手", [side * 1.215, 1.99, z + .66], [.035, .06, .23], transportColors.dark));
    for (const y of [.46, .79]) parts.push(box("位于前轮后方而不切入轮胎的上下车踏板", [side * 1.29, y, z + .85], [.38, .12, .35], transportColors.dark));
    parts.push(strut("前轮后方踏板实际接入驾驶室后门柱的支架", [side * 1.26, .4, z + .94], [side * 1.2, 1.17, z + .94], .08, transportColors.dark));
  }
  return parts;
}

function turnAboutX(parts: ModelPart[], y: number, z: number, angle: number): void {
  const radians = angle * Math.PI / 180, cosine = Math.cos(radians), sine = Math.sin(radians);
  for (const value of parts) {
    const localY = value.position.y - y, localZ = value.position.z - z;
    value.position.y = y + localY * cosine - localZ * sine;
    value.position.z = z + localY * sine + localZ * cosine;
    value.rotation.x += angle;
  }
}

function sidePanel(name: string, x: number, outline: [number, number][], width: number, color: string, holes: [number, number][][] = []): ModelPart {
  const value = polygon(name, color, outline, width, [x + width / 2, 0, 0], holes);
  value.rotation.z = 90;
  return value;
}

// 三辆完整常见商用车按实际货厢与装卸整形区分，不是为通用封闭货车更换载物、警灯或颜色。
// 自卸货厢和翼厢处于静态展开展示姿态；不实现液压控制，不另外注册闭合/展开状态。
// https://www.hyva.com/en/tipping-solutions/tipper-body/hyva-tipper/
// https://www.trex.co.jp/english/products/
export const everydayCommercialVehicleBatchThree: TransportDefinition[] = [
  { name: "平头驾驶室公路后翻自卸汽车", theme: "现代", tags: ["汽车", "影视", "生活常见", "公路自卸货车", "独立后翻货斗", "实际举升液压缸", "前置平头驾驶室"], create: () => {
    const parts: ModelPart[] = [...commercialChassis(2.5, 8.1, .5, [-2.7, 1.55, 2.75], .2), ...flatFrontCommercialCab(-2.7), ...commercialLights(2.5, -3.83, 4.28, .99), ...commercialMirrors(2.4, 2.55, -3.67), cylinder("后翻货斗与车架之间实际贯通的后铰轴", [0, 1.16, 3.3], [.2, 2.72, .2], transportColors.trim, [0, 0, 90]), box("实际承托车架尾灯并露出灯面的固定后围", [0, .99, 4.18], [2.4, .36, .15], transportColors.body)];
    for (const side of [-1, 1]) parts.push(strut("尾灯固定后围与车底纵梁之间的实际短撑", [side * .67, .54, 4.1], [side * .67, .99, 4.18], .12, transportColors.dark));
    for (const side of [-1, 1]) parts.push(box("从后翻铰轴承座实际落到车架的独立立座", [side * .85, .87, 3.3], [.28, .6, .45], transportColors.dark));
    const body: ModelPart[] = [box("贯通且顶部真正敞开的钢制自卸斗底板", [0, 1.21, .9], [2.35, .14, 4.9], transportColors.body), box("自卸斗靠近驾驶舱一侧的挡料前墙", [0, 1.88, -1.55], [2.35, 1.2, .1], transportColors.body), box("由上部耳铰悬挂的独立后卸尾门", [0, 1.88, 3.35], [2.35, 1.2, .1], transportColors.body)];
    for (const side of [-1, 1]) {
      body.push(box("承接散料而非另放载荷的自卸斗高侧板", [side * 1.19, 1.88, .9], [.1, 1.2, 4.9], transportColors.body), cylinder("尾门顶部接向斗侧壁的真实短铰轴", [side * 1.21, 2.42, 3.35], [.12, .27, .12], transportColors.trim, [0, 0, 90]));
      for (const z of [-1.2, 0, 1.2, 2.4, 3.1]) body.push(box("与自卸斗侧板直接相接的外侧加强筋", [side * 1.26, 1.87, z], [.08, 1.18, .09], transportColors.dark));
    }
    turnAboutX(body, 1.16, 3.3, 15);
    parts.push(...body);
    const angle = 15 * Math.PI / 180, end: Triple = [0, 1.16 + (1.14 - 1.16) * Math.cos(angle) - (-.8 - 3.3) * Math.sin(angle), 3.3 + (1.14 - 1.16) * Math.sin(angle) + (-.8 - 3.3) * Math.cos(angle)];
    const start: Triple = [0, .8, -.95], middle: Triple = [0, start[1] + (end[1] - start[1]) * .65, start[2] + (end[2] - start[2]) * .65];
    parts.push(rod("底端真正连接车架且承托后翻货斗的举升缸筒", start, middle, .28, transportColors.dark), rod("从举升缸筒连续接向货斗底耳的液压活塞杆", middle, end, .14, transportColors.trim), cylinder("举升缸底部横向铰耳", start, [.15, .7, .15], transportColors.dark, [0, 0, 90]), box("把举升缸底铰真实连接到两根纵梁的加高承台", [0, .71, -.95], [1.6, .38, .36], transportColors.dark), cylinder("实际连接货斗底板的举升缸上耳轴", end, [.14, .65, .14], transportColors.dark, [0, 0, 90]), box("车尾固定在车架上的防钻入横梁", [0, .59, 4.17], [2.42, .18, .18], transportColors.dark));
    for (const side of [-1, 1]) parts.push(box("后双轴上方实际接入底梁的防溅板", [side * 1.05, 1.07, 2.14], [.5, .1, 2.35], transportColors.dark));
    return parts;
  } },
  { name: "后装扫板压缩式城市环卫垃圾汽车", theme: "现代", tags: ["汽车", "影视", "生活常见", "后装压缩垃圾车", "后部开放收料斗", "扫板回转压缩机构", "区别前装越舱叉臂"], create: () => {
    const parts: ModelPart[] = [...commercialChassis(2.48, 8.5, .5, [-2.85, 1.65, 2.85], .2), ...flatFrontCommercialCab(-2.85), ...commercialLights(2.48, -3.98, 4.48, .96), ...commercialMirrors(2.4, 2.55, -3.82), box("完整压缩垃圾腔的承重下底板", [0, 1.15, .55], [2.32, .18, 4.35], transportColors.dark), box("压缩垃圾腔靠近驾驶室的封闭前墙", [0, 2.12, -1.58], [2.34, 1.9, .12], transportColors.body), box("与两侧实体壳连成一体的压缩垃圾腔顶板", [0, 3.08, .55], [2.34, .13, 4.35], transportColors.body), box("垃圾腔内部沿纵向滑动的实际压缩推板", [0, 2.03, -.6], [2.1, 1.55, .13], transportColors.dark)];
    for (const side of [-1, 1]) {
      parts.push(box("从前墙延至后收料口的压缩腔独立侧壳", [side * 1.16, 2.12, .55], [.12, 1.9, 4.35], transportColors.body), box("垃圾箱底板与车底纵梁之间的实际承座", [side * .67, .87, .55], [.24, .46, 3.7], transportColors.dark), sidePanel("后装收料斗带斜顶与低位接料口的真实侧颊", side * 1.15, [[.72, 3], [.84, 4.3], [1.65, 4.3], [2.6, 3.6], [3.1, 2.65], [1.15, 2.65]], .12, transportColors.body), strut("后收料斗向车架下方传力的独立斜撑", [side * .91, .65, 2.8], [side * .91, .87, 4.1], .15, transportColors.dark), box("后收料口两侧实际接住尾灯的独立护壳", [side * .95, .96, 4.38], [.35, .4, .16], transportColors.body));
      for (const z of [-1.1, .2, 1.5, 2.4]) parts.push(box("直接接在垃圾箱外壁上的竖向加强筋", [side * 1.245, 2.12, z], [.07, 1.8, .12], transportColors.dark));
    }
    parts.push(sidePanel("跨越全宽且前侧接入垃圾腔的收料斗连续弯底", 0, [[.72, 3], [.78, 4.3], [.9, 4.3], [.9, 3.08], [1.5, 2.72], [1.45, 2.62]], 2.3, transportColors.dark), cylinder("后装扫板两侧连成一体的实际横向回转轴", [0, 2.65, 3.35], [.18, 2.65, .18], transportColors.trim, [0, 0, 90]), box("在开放料斗内向前扫压的独立宽扫板", [0, 1.45, 3.92], [2.08, .5, .14], transportColors.dark, [-25, 0, 0]), box("尾部低位可直接投入收集物的加厚装料唇", [0, .9, 4.33], [2.3, .14, .13], transportColors.trim));
    for (const side of [-1, 1]) {
      parts.push(strut("从回转轴接向下扫板两端的刚性摇臂", [side * 1.05, 2.65, 3.35], [side * 1.05, 1.55, 3.9], .14, transportColors.dark), rod("后装扫板与固定颊板相接的独立液压驱动", [side * 1.17, 2.9, 2.8], [side * 1.17, 1.65, 3.8], .12, transportColors.trim), cylinder("扫板液压驱动下端的实际铰耳", [side * 1.17, 1.65, 3.8], [.15, .25, .15], transportColors.dark, [0, 0, 90]), box("侧后方固定作业脚踏板", [side * 1.28, .5, 3.9], [.42, .12, .6], transportColors.dark), strut("脚踏板向上实际接入收料侧颊的短撑", [side * 1.28, .5, 3.9], [side * 1.15, .95, 3.9], .08, transportColors.dark));
    }
    return parts;
  } },
  { name: "双侧上掀翼厢式公路物流载货汽车", theme: "现代", tags: ["汽车", "影视", "生活常见", "翼展厢货汽车", "两侧整体上掀侧厢", "固定中央顶脊", "真实液压翼门支承"], create: () => {
    const parts: ModelPart[] = [...commercialChassis(2.5, 8.5, .49, [-3.25, 1.95, 3], -.15), ...flatFrontCommercialCab(-3.3), ...commercialLights(2.5, -4.43, 4.18, 1.13), ...commercialMirrors(2.4, 2.55, -4.27), box("翼厢完全展开后仍然保留的连续承货地板", [0, 1.22, 1.05], [2.4, .16, 6.1], transportColors.dark), box("两片上掀翼门共同铰接的固定纵向顶脊", [0, 3.45, 1.05], [.2, .18, 6.1], transportColors.dark), box("翼厢靠近驾驶室的固定承力前壁", [0, 2.3, -2], [2.4, 2.18, .12], transportColors.body), box("可独立闭合且不随侧翼升起的后装货双门", [0, 2.3, 4.1], [2.4, 2.18, .1], transportColors.body), box("真正连在翼厢地板与后门上的固定尾灯后围", [0, 1.13, 4.1], [2.4, .36, .14], transportColors.body)];
    for (const side of [-1, 1]) {
      for (const z of [-1.6, 3.7]) parts.push(box("承货地板由底纵梁真正顶住的竖向承座", [side * .67, .89, z], [.25, .5, .5], transportColors.dark));
      for (const z of [-1.99, 4.09]) parts.push(box("固定端门架真正落在货厢地板上的立柱", [side * 1.16, 2.3, z], [.13, 2.18, .15], transportColors.dark));
      const angle = side * 43 * Math.PI / 180, cosine = Math.cos(angle), sine = Math.sin(angle);
      const wing: ModelPart[] = [box("可整体上掀而非普通侧面开门的翼厢大侧板", [side * 1.22, 2.3, 1.05], [.08, 2.18, 5.85], transportColors.trim), box("与整块侧板刚性相连的半幅屋面翼片", [side * .64, 3.43, 1.05], [1.2, .09, 5.85], transportColors.trim)];
      for (const z of [-1.6, -.3, 1, 2.3, 3.6]) wing.push(box("直接连接侧翼内表面与半屋面的竖向折弯肋", [side * 1.16, 2.3, z], [.07, 2.15, .09], transportColors.dark));
      for (const value of wing) {
        const x = value.position.x, y = value.position.y - 3.45;
        value.position.x = x * cosine - y * sine;
        value.position.y = 3.45 + x * sine + y * cosine;
        value.rotation.z += side * 43;
      }
      parts.push(...wing);
      for (const z of [-1.6, 3.7]) {
        const x = side * 1.2, y = 2.6 - 3.45, end: Triple = [x * cosine - y * sine, 3.45 + x * sine + y * cosine, z], start: Triple = [side * 1.17, 1.55, z], middle: Triple = [start[0] + (end[0] - start[0]) * .65, start[1] + (end[1] - start[1]) * .65, z];
        parts.push(box("把翼厢液压缸底耳真实接到固定地板的立式支座", [side * 1.17, 1.425, z], [.17, .4, .2], transportColors.dark), rod("从固定底支座实际承托升起翼板的液压缸筒", start, middle, .15, transportColors.dark), rod("独立液压活塞杆接到翼板肋上的实际端点", middle, end, .085, transportColors.trim));
      }
      parts.push(cylinder("沿固定顶脊方向实际连接整片侧翼的通长铰轴", [side * .06, 3.45, 1.05], [.1, 5.9, .1], transportColors.trim, [90, 0, 0]));
    }
    for (const z of [-1.99, 4.09]) parts.push(box("固定端门架上部实际承接中央顶脊的横梁", [0, 3.45, z], [2.4, .16, .18], transportColors.dark));
    parts.push(box("尾部装货门的中心竖向扣合边", [0, 2.3, 4.165], [.045, 2.08, .035], transportColors.dark));
    return parts;
  } },
];
