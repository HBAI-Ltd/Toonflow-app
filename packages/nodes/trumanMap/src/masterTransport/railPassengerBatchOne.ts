import { part, type ModelPart, type Triple } from "../assetModelParts";
import { combineMeshes, polygon } from "../masterNature/shared";
import { archedRoof } from "./railExpansionBatchThree";
import { standardGaugeWheelset } from "./railExpansionBatchOne";
import { box, cylinder, strut, surface, transportColors, type TransportDefinition } from "./parts";

type Opening = [number, number, number, number];

function coachBogie(z: number): ModelPart[] {
  const parts: ModelPart[] = [...standardGaugeWheelset(z - 1.05), ...standardGaugeWheelset(z + 1.05), box("两轴客车转向架中央承载横梁", [0, .86, z], [2.15, .18, .42], transportColors.dark), cylinder("连接车底地板的转向架中心承托销", [0, 1.09, z], [.52, .3, .52], transportColors.trim)];
  for (const side of [-1, 1]) {
    parts.push(box("转向架连接两轴箱的纵向侧框", [side * 1.02, .82, z], [.18, .28, 2.62], transportColors.dark));
    for (const end of [-1, 1]) parts.push(box("由车轴承重且顶端接入侧框的密封轴箱", [side * 1.02, .55, z + end * 1.05], [.26, .28, .33], transportColors.trim));
  }
  return parts;
}

function coachBase(length: number, bogies: [number, number], z = 0): ModelPart[] {
  const parts = [...coachBogie(bogies[0]), ...coachBogie(bogies[1]), box("转向架枢轴承托的连续客室地板", [0, 1.31, z], [2.72, .16, length], transportColors.dark)];
  for (const side of [-1, 1]) parts.push(box("通长客车底架承力边梁", [side * 1.16, 1.16, z], [.18, .22, length], transportColors.dark));
  for (const end of [-1, 1]) parts.push(box("连接边梁的车端承力缓冲横梁", [0, 1.1, z + end * (length / 2 - .12)], [2.65, .27, .2], transportColors.dark), box("接入端横梁的独立牵引车钩", [0, .99, z + end * (length / 2 + .18)], [.24, .18, .58], transportColors.dark));
  return parts;
}

function sideSheet(name: string, x: number, start: number, end: number, bottom: number, top: number, holes: Opening[], color = transportColors.body): ModelPart {
  const sheet = polygon(name, color, [[start, bottom], [end, bottom], [end, top], [start, top]], .1, [0, 0, 0], holes.map(([z0, z1, y0, y1]) => [[z0, y0], [z1, y0], [z1, y1], [z0, y1]]));
  sheet.vertices = sheet.vertices!.map(value => ({ x: x + value.y - .05, y: value.z, z: value.x }));
  return sheet;
}

function glazing(name: string, position: Triple, size: Triple, opacity = .5): ModelPart {
  return part(name, "box", transportColors.glass, position, size, [0, 0, 0], { opacity, roughness: .22 });
}

function endPortal(z: number, width = 2.72, top = 3.47): ModelPart[] {
  const wallWidth = width / 2 - .48, center = (.48 + width / 2) / 2;
  return [box("贯通车端入口两侧独立实壁", [-center, (top + 1.34) / 2, z], [wallWidth, top - 1.34, .12]), box("贯通车端入口两侧独立实壁", [center, (top + 1.34) / 2, z], [wallWidth, top - 1.34, .12]), box("跨过真实车端通道的门框顶梁", [0, top - .11, z], [width, .22, .14], transportColors.dark)];
}

// 原创简化总装；只参考各类车辆的工作布局，不复制厂商车头、涂装、标志或制造图。
// https://www.mobility.siemens.com/global/en/portfolio/rolling-stock/high-speed-and-intercity-trains/velaro-novo.html
// https://www.mobility.siemens.com/global/en/portfolio/references/metro-london.html
// https://corpo.viarail.ca/en/projects-infrastructure/train-fleet/skyline-dome-car
// https://ravenglass-railway.co.uk/about-us/our-carriages/
// https://www.neb.de/unternehmen/fahrzeuge/regio-shuttle-rs1/
export const railPassengerBatchOne: TransportDefinition[] = [
  { name: "长鼻流线车头分布动力动车驾驶头车", theme: "现代", tags: ["火车", "铁路", "高速动车头车", "长鼻司机室", "后部独立载客舱", "两组承重转向架"], create: () => {
    const parts = coachBase(21.15, [-7.1, 8.8], 2.025);
    const stations = [[-13.35, .1, 1.13, 1.35], [-12.15, .71, 1.06, 2.02], [-10.55, 1.2, 1.08, 2.89], [-9.1, 1.43, 1.12, 3.7], [-8.55, 1.44, 1.14, 3.7]];
    const rings = stations.map(([z, width, bottom, top]) => {
      const shoulder = top! - Math.min(.45, (top! - bottom!) * .4);
      return [[-width!, bottom!, z!], [width!, bottom!, z!], [width!, shoulder, z!], [width! * .82, top!, z!], [-width! * .82, top!, z!], [-width!, shoulder, z!]] as Triple[];
    });
    const shell: ModelPart[] = [];
    for (let index = 0; index < rings.length - 1; index++) for (let edge = 0; edge < 6; edge++) {
      if (index === 2 && edge === 3) continue;
      const panel = surface("长鼻机头独立连续承力外蒙皮", transportColors.body, [rings[index]![edge]!, rings[index]![(edge + 1) % 6]!, rings[index + 1]![(edge + 1) % 6]!, rings[index + 1]![edge]!], [0, 1, 2, 0, 2, 3]);
      if (index === 0) {
        // ACT: 窄鼻尖的薄壳边缘保持硬面，避免跨越薄板两面的平均法线。
        panel.vertices = panel.indices!.map(value => ({ ...panel.vertices![value]! }));
        panel.indices = panel.vertices.map((_, value) => value);
      }
      shell.push(panel);
    }
    const noseCap = surface("机鼻尖端封闭碰撞罩", transportColors.body, rings[0]!, [0, 2, 1, 0, 3, 2, 0, 4, 3, 0, 5, 4]);
    noseCap.vertices = noseCap.indices!.map(value => ({ ...noseCap.vertices![value]! }));
    noseCap.indices = noseCap.vertices.map((_, value) => value);
    shell.push(noseCap);
    parts.push(combineMeshes("有真实驾驶风挡缺口的多截面长鼻外壳", transportColors.body, shell));
    const windscreen = surface("嵌在机鼻壳真实缺口内的斜置宽风挡", transportColors.glass, [rings[2]![3]!, rings[2]![4]!, rings[3]![4]!, rings[3]![3]!], [0, 1, 2, 0, 2, 3]);
    windscreen.opacity = .55;
    parts.push(windscreen, polygon("从后客室真实接出且随机鼻内壁收口的司机地板", transportColors.dark, [[-.87, -10.8], [.87, -10.8], [1.28, -9.5], [1.28, -8.5], [-1.28, -8.5], [-1.28, -9.5]], .13, [0, 1.365, 0]), box("机头司机座椅实心承座", [0, 1.81, -9.5], [.56, .68, .62], transportColors.dark));
    for (const side of [-1, 1]) {
      const holes: Opening[] = Array.from({ length: 6 }, (_, index) => [-6.8 + index * 2.65, -5.1 + index * 2.65, 2.05, 3.1]);
      parts.push(sideSheet("动车客室有真实独立侧窗洞的连续外侧壁", side * 1.4, -8.56, 12.6, 1.34, 3.53, holes), glazing("位于实窗框内的动车客室连续玻璃带", [side * 1.4, 2.575, 1.1], [.035, 1.05, 19.75]), box("车身下部连续防尘包裙", [side * 1.34, 1.03, 2.025], [.1, .53, 21.15], transportColors.body), cylinder("机鼻前端独立前照灯", [side * .61, 1.68, -12.3], [.2, .07, .2], transportColors.trim, [90, 0, 0]));
      for (const z of [-4.8, -.8, 3.2, 7.2]) parts.push(box("动车客室座椅由地板实际承托的长座", [side * .78, 1.68, z], [.9, .62, 1.1], transportColors.trim));
    }
    parts.push(box("圆角客室屋盖中央宽平顶", [0, 3.62, 2.02], [2.42, .17, 21.2], transportColors.body));
    for (const side of [-1, 1]) parts.push(strut("车顶边部由外壁连续承托的封口梁", [side * 1.31, 3.5, -8.56], [side * 1.31, 3.5, 12.62], .22, transportColors.body));
    parts.push(...endPortal(12.58, 2.72, 3.53), box("车底集中设备舱", [0, .87, 1.4], [1.7, .76, 6.5], transportColors.dark), box("与斜风挡外表面相接的短刮雨器", [0, 3.34, -9.78], [.8, .04, .04], transportColors.dark));
    return parts;
  } },
  { name: "宽体四门贯通客室地铁驾驶车", theme: "现代", tags: ["火车", "铁路", "地铁头车", "每侧四组对开门", "近直立端部驾驶室", "底置牵引设备"], create: () => {
    const parts = coachBase(20.8, [-6.95, 6.95]);
    const doorCenters = [-6.5, -2.15, 2.15, 6.5];
    for (const side of [-1, 1]) {
      const windows: Opening[] = [[-9.75, -8.9, 2.04, 3.18], [-5.43, -3.23, 2.04, 3.18], [-1.07, 1.07, 2.04, 3.18], [3.23, 5.43, 2.04, 3.18], [8.72, 9.7, 2.04, 3.18]];
      const doors: Opening[] = doorCenters.map(z => [z - .81, z + .81, 1.43, 3.33]);
      parts.push(sideSheet("地铁宽体侧壁上分立的四组真实双门洞与客窗洞", side * 1.45, -10.35, 10.35, 1.34, 3.58, [...windows, ...doors]));
      for (const [z0, z1, bottom, top] of windows) parts.push(glazing("避开独立滑门且封在实窗洞内的地铁客窗", [side * 1.45, (bottom + top) / 2, (z0 + z1) / 2], [.035, top - bottom, z1 - z0]));
      for (const center of doorCenters) for (const leaf of [-1, 1]) {
        const z = center + leaf * .395;
        parts.push(sideSheet("有真实高位玻璃孔的对开滑门独立门叶", side * 1.465, z - .38, z + .38, 1.44, 3.32, [[z - .26, z + .26, 2.28, 3.13]], transportColors.trim), glazing("封在独立地铁门叶孔内的窄玻璃", [side * 1.465, 2.705, z], [.028, .85, .52]));
      }
      for (const z of [-4.3, 0, 4.3]) parts.push(box("地铁纵向长座与地板连接的封闭座箱", [side * 1.04, 1.67, z], [.56, .6, 2], transportColors.trim));
    }
    parts.push(box("地铁客室承载屋盖", [0, 3.66, 0], [2.96, .2, 20.85], transportColors.body), box("地铁车头实际下围与防爬端梁", [0, 1.79, -10.44], [2.85, .92, .22], transportColors.signal), glazing("两侧框之间的地铁驾驶室真实宽风挡", [0, 2.93, -10.445], [2.55, 1.39, .035]));
    for (const side of [-1, 1]) parts.push(box("地铁前风挡外侧连续承力立框", [side * 1.35, 2.95, -10.44], [.19, 1.48, .22], transportColors.dark), cylinder("近直立车端独立前灯", [side * .95, 1.78, -10.58], [.24, .06, .24], transportColors.trim, [90, 0, 0]));
    parts.push(box("地铁驾驶风挡上方实心楣梁", [0, 3.56, -10.44], [2.85, .22, .22], transportColors.dark), ...endPortal(10.35, 2.85, 3.58), box("地铁中央车底牵引逆变器箱", [0, .87, 0], [1.9, .76, 4.2], transportColors.dark), box("独立固定在车底的空压机及储气设备箱", [0, .95, 3.6], [1.55, .6, 1.8], transportColors.dark));
    return parts;
  } },
  { name: "中央抬高玻璃穹顶铁路观景客车", theme: "现代", tags: ["火车", "铁路", "穹顶观光车", "中央抬高观景平台", "端部低位客室", "完整观景梯"], create: () => {
    const parts = coachBase(22.4, [-8.1, 8.1]);
    parts.push(box("中央观景台下不设第二层客室的设备基座", [0, 1.88, 0], [2.52, 1.04, 8.3], transportColors.dark), box("由中央承座支撑的抬高观景地板", [0, 2.47, 0], [2.58, .16, 8.4], transportColors.trim));
    for (const side of [-1, 1]) {
      parts.push(sideSheet("低端客室和中央抬高台连续外侧围护", side * 1.36, -11.15, 11.15, 1.34, 3.12, [[-9.9, -6.2, 2.05, 2.96], [6.2, 9.9, 2.05, 2.96]]), glazing("两端客室真实窗洞内的透光玻璃带", [side * 1.36, 2.505, 0], [.035, .91, 20.2]), glazing("中央穹顶高位真实侧面观景玻璃", [side * 1.32, 3.72, 0], [.04, 1.18, 8.5], .35), box("抬高玻璃观景侧带下的连续结构腰梁", [side * 1.33, 3.13, 0], [.16, .16, 8.55], transportColors.dark));
      for (const z of [-4.2, -2.1, 0, 2.1, 4.2]) parts.push(box("观景窗之间实际承托穹顶的立柱", [side * 1.32, 3.71, z], [.1, 1.25, .1], transportColors.dark));
      for (const z of [-2.8, 0, 2.8]) parts.push(box("高位观景座椅的落地承座", [side * .77, 2.85, z], [.82, .6, 1.05], transportColors.wood));
    }
    const dome = archedRoof(2.76, 8.55, 4.29);
    dome.name = "有实际薄壁厚度的整片透光拱形穹顶";
    dome.color = transportColors.glass;
    dome.opacity = .32;
    dome.roughness = .2;
    parts.push(dome);
    for (const z of [-4.2, -2.1, 0, 2.1, 4.2]) {
      const rib = archedRoof(2.8, .085, 4.29);
      rib.name = "上下都与窗柱相接的薄弧形穹顶承力肋";
      rib.color = transportColors.dark;
      rib.position.z = z;
      parts.push(rib);
    }
    for (const end of [-1, 1]) {
      const roof = archedRoof(2.85, 5.3, 3.1);
      roof.position.z = end * 8.52;
      parts.push(roof, ...endPortal(end * 11.14, 2.72, 3.14));
      const arch = [[-1.38, 0], [-1.104, .24], [-.552, .42], [.552, .42], [1.104, .24], [1.38, 0]];
      const transition = combineMeshes("梯道上方随楼梯升高且不封堵通路的斜向玻璃拱棚", transportColors.glass, arch.slice(0, -1).map(([x, y], index) => surface("衔接高穹顶和低客室顶的真实斜玻璃板", transportColors.glass, [[x!, 4.29 + y!, end * 4.26], [arch[index + 1]![0]!, 4.29 + arch[index + 1]![1]!, end * 4.26], [arch[index + 1]![0]!, 3.1 + arch[index + 1]![1]!, end * 5.89], [x!, 3.1 + y!, end * 5.89]], [0, 1, 2, 0, 2, 3])));
      transition.opacity = .35;
      transition.vertices = transition.indices!.map(index => ({ ...transition.vertices![index]! }));
      transition.indices = transition.vertices.map((_, index) => index);
      parts.push(transition);
      for (const side of [-1, 1]) {
        const wedge = surface("观景梯上方斜拱棚的真实三角侧玻璃", transportColors.glass, [[side * 1.34, 3.12, end * 4.26], [side * 1.34, 4.29, end * 4.26], [side * 1.34, 3.12, end * 5.89]], [0, 1, 2]);
        wedge.opacity = .35;
        parts.push(wedge, strut("斜玻璃过渡棚两侧连续承力压条", [side * 1.34, 4.29, end * 4.26], [side * 1.34, 3.12, end * 5.89], .07, transportColors.dark));
      }
      for (let step = 0; step < 5; step++) parts.push(box("低位客室进入中央高位观景台的实际踏步", [0, 1.43 + step * .23, end * (5.35 - step * .26)], [.85, .22, .3], transportColors.dark));
      parts.push(strut("观景梯侧边从端部地板接到高台的实心梯梁", [.42, 1.3, end * 5.55], [.42, 2.45, end * 4.18], .12, transportColors.dark), strut("观景梯另一侧与平台相接的梯梁", [-.42, 1.3, end * 5.55], [-.42, 2.45, end * 4.18], .12, transportColors.dark));
    }
    return parts;
  } },
  { name: "横排开放长脚踏铁路游览客车", theme: "欧式", tags: ["火车", "铁路", "开放式旅游客车", "横排长椅", "连续外侧登车脚踏", "四轮独立底架"], create: () => {
    const parts: ModelPart[] = [...standardGaugeWheelset(-2.8), ...standardGaugeWheelset(2.8), box("四轮开放游览车的整体承重地板", [0, 1.09, 0], [2.3, .18, 8.9], transportColors.wood)];
    for (const side of [-1, 1]) {
      parts.push(box("接入车轴轴箱的开放车底纵梁", [side * 1.03, .81, 0], [.2, .4, 8.9], transportColors.dark), box("地板外侧从车端贯通的登乘长脚踏", [side * 1.37, .82, 0], [.32, .1, 8.6], transportColors.dark));
      for (const z of [-2.8, 2.8]) parts.push(box("实际承接轮轴与底梁的短轴箱", [side * 1.02, .53, z], [.28, .25, .35], transportColors.trim));
      for (const z of [-4, -1.4, 1.4, 4]) parts.push(strut("外脚踏接入车底主梁的斜托", [side * 1.02, .99, z], [side * 1.42, .8, z], .09), strut("从地板实起且承接薄顶棚的廊柱", [side * 1.07, 1.16, z], [side * 1.07, 3.22, z], .065, transportColors.dark));
      parts.push(box("柱顶连续托檐纵梁", [side * 1.07, 3.2, 0], [.09, .13, 8.45], transportColors.dark));
    }
    for (const z of [-3.4, -2.04, -.68, .68, 2.04, 3.4]) {
      parts.push(box("贯穿两侧的开放车横排长座", [0, 1.53, z], [2.12, .12, .49], transportColors.wood), box("横排长座后方独立靠背", [0, 1.87, z + .22], [2.12, .68, .07], transportColors.wood));
      for (const side of [-1, 1]) parts.push(box("横排长座实际接入车底板的脚座", [side * .78, 1.32, z], [.12, .36, .4], transportColors.dark));
    }
    const roof = archedRoof(2.57, 9.1, 3.08);
    roof.name = "由开放柱廊承托的固定遮阳薄顶棚";
    parts.push(roof);
    for (const end of [-1, 1]) parts.push(box("开放游览车端部低挡板", [0, 1.6, end * 4.36], [2.3, 1.04, .09], transportColors.wood), box("端部低挡板接入底架的横梁", [0, .94, end * 4.36], [2.3, .16, .15], transportColors.dark), box("与端梁相接的游览车牵引连接杆", [0, .91, end * 4.72], [.18, .16, .65], transportColors.dark));
    return parts;
  } },
  { name: "单节双端柴油液力铁路巴士客车", theme: "现代", tags: ["火车", "铁路", "支线铁路巴士", "独立双端驾驶舱", "端部外踏台", "柴油机液力箱传动轴完整动力链"], create: () => {
    const parts: ModelPart[] = [...coachBogie(-4.6), ...coachBogie(4.6), box("双端铁路巴士中间入口低地板", [0, 1.02, 0], [2.57, .16, 5.8], transportColors.dark)];
    for (const side of [-1, 1]) parts.push(box("铁路巴士由两端转架承托的通长底侧梁", [side * 1.18, .89, 0], [.18, .18, 15.7], transportColors.dark));
    for (const end of [-1, 1]) {
      parts.push(box("端部转向架上方独立高地板客室", [0, 1.31, end * 4.92], [2.57, .16, 4.1], transportColors.dark), box("独立于封闭驾驶舱的外端站立踏台", [0, 1.2, end * 7.46], [2.57, .16, 1.1], transportColors.dark), box("外端踏台的承力缓冲梁", [0, .98, end * 7.89], [2.57, .25, .18], transportColors.dark), box("铁路巴士端踏台下的牵引钩柄", [0, .98, end * 8.13], [.22, .18, .5], transportColors.dark), box("独立短司机室前部下围", [0, 1.91, end * 6.93], [2.57, 1.1, .13], transportColors.signal), glazing("短司机室前端宽幅实际风挡", [0, 2.93, end * 6.93], [2.4, .95, .035]));
      for (const side of [-1, 1]) parts.push(box("短司机室风挡两侧承力边框", [side * 1.24, 2.94, end * 6.93], [.12, 1.11, .14], transportColors.dark), strut("端踏台外侧接入地板的独立扶手", [side * 1.19, 1.25, end * 7.8], [side * 1.19, 2.05, end * 7.8], .04), box("端踏台外侧低位实际登乘台阶", [side * 1.35, .91, end * 7.47], [.35, .12, .65], transportColors.dark), strut("端踏台外伸台阶到端板的斜托", [side * 1.14, 1.17, end * 7.47], [side * 1.4, .91, end * 7.47], .07));
      parts.push(box("前风挡上沿真实顶框", [0, 3.44, end * 6.93], [2.57, .16, .14], transportColors.dark));
      for (let step = 0; step < 2; step++) parts.push(box("中部低入口上到端部高地板的实体踏步", [0, 1.07 + step * .145, end * (2.55 + step * .26)], [1.1, .14, .29], transportColors.trim));
    }
    for (const side of [-1, 1]) {
      const windows: Opening[] = [[-6.45, -5.25, 2.12, 3.23], [-4.85, -3.8, 2.12, 3.23], [-1.95, 1.95, 1.97, 3.23], [3.8, 4.85, 2.12, 3.23], [5.25, 6.45, 2.12, 3.23]];
      parts.push(sideSheet("双端铁路巴士上下错层且有独立门窗孔的侧壁", side * 1.29, -6.95, 6.95, 1.08, 3.48, [...windows, [-3.5, -2.3, 1.2, 3.25], [2.3, 3.5, 1.2, 3.25]]));
      for (const [z0, z1, bottom, top] of windows) parts.push(glazing("避开两处开放入口且封在真实窗洞内的铁路巴士玻璃", [side * 1.29, (bottom + top) / 2, (z0 + z1) / 2], [.035, top - bottom, z1 - z0]));
      for (const end of [-1, 1]) parts.push(box("低入口实际外踏步", [side * 1.37, .94, end * 2.9], [.3, .13, 1.27], transportColors.trim), box("低入口接入地板的短踏步托座", [side * 1.2, .97, end * 2.9], [.18, .16, 1.27], transportColors.dark));
    }
    const roof = archedRoof(2.8, 14.1, 3.48);
    roof.name = "仅跨封闭客室而不覆盖外端踏台的铁路巴士顶棚";
    parts.push(roof, box("地板下实心固定的柴油发动机机体", [0, .66, -1.55], [.95, .58, 1.35], transportColors.dark), box("直接接入发动机输出端的液力变速箱", [0, .62, -.42], [.57, .43, .95], transportColors.body), strut("由液力箱输出法兰接至前转架轴箱的纵向传动轴", [0, .57, -.05], [0, .57, 3.55], .09, transportColors.trim), box("传动轴实际接入前轮轴的直角齿轮箱", [0, .55, 3.55], [.34, .34, .36], transportColors.dark), part("从柴油机排出并沿端部机舱升高的连续排气管", "tube", transportColors.dark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: .04, path: [{ x: -.4, y: .69, z: -1.6 }, { x: -1.43, y: .69, z: -1.6 }, { x: -1.43, y: .85, z: -5.8 }, { x: -1.43, y: 3.99, z: -5.8 }] }), box("高位排气管与车顶侧壁相接的承托座", [-1.38, 3.5, -5.8], [.22, .13, .25], transportColors.dark));
    return parts;
  } },
];
