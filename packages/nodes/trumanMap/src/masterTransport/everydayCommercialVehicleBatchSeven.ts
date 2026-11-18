import { part, ring, type ModelPart } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { rod } from "../masterObjects/parts";
import { box, cylinder, transportColors, type TransportDefinition } from "./parts";
import { commercialChassis, commercialLights, commercialMirrors, commercialSeatRow } from "./everydayCommercialVehicleBatchOne";

function fireFrontPanel(color: string): ModelPart {
  const value = polygon("真正留出完整驾驶风挡的双排乘员舱前围", color, [[-1.25, -1.025], [1.25, -1.025], [1.25, -3.18], [-1.25, -3.18]], .08, [0, 0, -4.14], [[[-1.1, -2], [1.1, -2], [1.1, -2.97], [-1.1, -2.97]]]);
  value.rotation.x = 90;
  return value;
}

// 独立双排乘员舱、车中泵房、后器材仓和顶水带床的整辆泵浦消防车，不是旧举高云梯消防车换涂装。
// https://www.piercemfg.com/hubfs/HubDB/Literature/Pierce-Manufacturing-Fire-Suppression-4-22.pdf
export const everydayCommercialVehicleBatchSeven: TransportDefinition[] = [
  { name: "双排乘员舱中置泵房器材仓消防汽车", theme: "现代", tags: ["汽车", "影视", "生活常见", "泵浦消防车", "双排消防乘员舱", "中置独立消防泵房", "后部卷帘器材仓与水带床"], create: () => {
    const color = "#b96e5e";
    const parts: ModelPart[] = [...commercialChassis(2.5, 8.5, .5, [-2.8, 2.6], .05), box("真正高于前轮顶面并承托双排座位的乘员舱地板", [0, 1.1, -2.3], [2.38, .15, 3.6], transportColors.dark), box("从底纵梁真实承托高乘员舱的动力基座", [0, .85, -2.5], [1.3, .5, 2.6], transportColors.dark), box("与侧围及前后窗楣完全接合的双排舱平顶", [0, 3.18, -2.3], [2.5, .14, 3.6], color), fireFrontPanel(color), { ...box("装在实际前风挡孔中的消防车驾驶玻璃", [0, 2.485, -4.1], [2.21, .98, .025], transportColors.glass), opacity: .32 }, box("双排乘员舱与独立泵房之间的完整后隔壁", [0, 2.11, -.5], [2.42, 2.16, .08], color), commercialSeatRow("前排司机及副驾的独立落地座位", 1.175, -3.2, [-.65, .65], .48), commercialSeatRow("双排乘员舱内独立第二排消防人员座位", 1.175, -1.3, [-.75, 0, .75], .43), box("驾驶风挡下方实际安装的仪表台", [0, 1.9, -3.8], [2.2, .2, .42], transportColors.dark), box("消防车前灯实际连入乘员舱下围的加厚保险围", [0, .99, -4.15], [2.5, .32, .18], color), ...commercialLights(2.5, -4.25, 4.31, .94), ...commercialMirrors(2.5, 2.65, -4.02), box("中置独立泵房的实际承重下平台", [0, 1.1, .2], [2.35, .15, 1.3], transportColors.dark), cylinder("独立泵房中真正横置的消防水泵壳", [0, 1.6, .2], [.7, 1.6, .7], transportColors.dark, [0, 0, 90]), box("泵房上方实际承托预接水带的横置床板", [0, 2.34, .2], [2.35, .12, 1.3], transportColors.dark), box("后器材仓连续承重地板", [0, 1.1, 2.5], [2.38, .16, 3.2], transportColors.dark), box("后器材仓顶部同时充当水带床底板的承力盖", [0, 2.8, 2.5], [2.4, .1, 3.2], color), box("后器材仓靠泵房一侧的独立封闭前壁", [0, 1.96, .9], [2.4, 1.6, .1], color), box("消防车器材仓后端完整围板", [0, 1.96, 4.1], [2.4, 1.6, .1], color), box("连到后壁与底板的实际尾灯固定围", [0, .98, 4.2], [2.4, .36, .18], color), box("接在车架尾部的低位作业踏板", [0, .62, 4.33], [2.3, .12, .4], transportColors.dark)];
    for (const side of [-1, 1]) {
      const openings: [number, number][][] = [[[2.05, -3.93], [2.95, -3.93], [2.95, -2.75], [2.05, -2.75]], [[2.05, -2.4], [2.95, -2.4], [2.95, -.68], [2.05, -.68]]];
      const sideFrame = polygon("两扇门窗真正开孔并接实前后舱壁的双排侧围", color, [[1.025, -4.1], [3.18, -4.1], [3.18, -.5], [1.025, -.5]], .08, [side * 1.22 + .04, 0, 0], openings);
      sideFrame.rotation.z = 90;
      parts.push(sideFrame);
      for (const [lower, upper, front, rear] of [[2.05, 2.95, -3.93, -2.75], [2.05, 2.95, -2.4, -.68]]) parts.push({ ...box("装在真实双排乘员舱窗孔中的独立侧玻璃", [side * 1.22, (lower + upper) / 2, (front + rear) / 2], [.025, upper - lower + .01, rear - front + .01], transportColors.glass), opacity: .32 });
      for (const z of [-3.65, -1]) {
        for (const y of [.4, .7, 1]) parts.push(box("避开前轮并位于双排舱门外的上下车脚踏", [side * 1.34, y, z], [.4, .12, .35], transportColors.dark));
        parts.push(rod("双排舱门脚踏实际连到下门框的固定支杆", [side * 1.34, .34, z], [side * 1.22, 1.16, z], .07, transportColors.dark));
      }
      parts.push(box("后器材仓真正连接底梁与地板的纵向承座", [side * .67, .85, 2.45], [.24, .5, 3.3], transportColors.dark), box("后器材仓各收纳格外的完整长侧壁", [side * 1.18, 1.96, 2.5], [.08, 1.6, 3.2], color), box("中置泵房下平台实际接入主纵梁的承座", [side * .67, .86, .2], [.24, .5, .85], transportColors.dark));
      for (const z of [-.43, .83]) parts.push(box("把泵房控制面与上水带床真正撑起的短门柱", [side * 1.16, 1.74, z], [.12, 1.2, .12], transportColors.dark));
      for (const z of [1.43, 2.5, 3.57]) parts.push(box("后器材仓各自独立的闭合卷帘门", [side * 1.235, 1.98, z], [.05, 1.42, .94], transportColors.trim), box("卷帘器材门下边实际安装的横向拉柄", [side * 1.27, 1.4, z], [.035, .065, .36], transportColors.dark));
      parts.push(box("顶部水带床两侧实际接在底板上的挡边", [side * 1.16, 3, 2.5], [.08, .3, 3.2], color), box("车顶警示灯与乘员舱顶的实际安装底座", [side * .9, 3.3, -3.7], [.42, .1, .35], transportColors.dark), box("固定在安装底座上的独立消防车警示灯", [side * .9, 3.4, -3.7], [.39, .15, .3], "#c27b65"));
    }
    const sockets = [-.15, .2, .55];
    const pipeHoles: [number, number][][] = sockets.map(z => Array.from({ length: 8 }, (_, index) => { const angle = index * Math.PI / 4; return [1.55 + Math.sin(angle) * .08, z + Math.cos(angle) * .08]; }));
    const pumpPanel = polygon("三个真实通水圆孔与仪表分开的右侧泵控面板", transportColors.trim, [[1.2, -.4], [2.3, -.4], [2.3, .8], [1.2, .8]], .08, [1.27, 0, 0], pipeHoles);
    pumpPanel.rotation.z = 90;
    parts.push(pumpPanel, box("对侧泵房独立检修封门", [-1.23, 1.74, .2], [.08, 1.1, 1.15], transportColors.trim), box("水带床后端接在器材仓上的固定挡边", [0, 3, 4.06], [2.3, .3, .08], color));
    for (const z of sockets) parts.push(cylinder("独立压力表壳体实际接在控制面板上", [1.28, 2.1, z], [.18, .04, .18], transportColors.dark, [0, 0, 90]), cylinder("压力表前方独立透光面", [1.302, 2.1, z], [.145, .015, .145], transportColors.glass, [0, 0, 90]), ring("穿过控制板真孔而非贴在实板上的开放水带接口", transportColors.dark, .11, .03, 0, .12, { position: { x: 1.3, y: 1.55, z }, rotation: { x: 0, y: 0, z: 90 } }), cylinder("独立接在泵控板上的出水阀旋钮", [1.3, 1.84, z], [.12, .1, .12], color, [0, 0, 90]), rod("从真实泵壳分到三个控制板通口的独立出水管", [.75, 1.6, .2], [1.26, 1.55, z], .1, transportColors.dark));
    for (const x of [-.45, .45]) parts.push(box("泵房上方独立预接横向水带束", [x, 2.49, .2], [.72, .18, 1.15], transportColors.trim));
    parts.push(part("在后顶部水带床内连续折返且真实接触底板的完整软管", "tube", transportColors.wood, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: .06, path: [[-.75, 1.3], [-.75, 3.5], [-.65, 3.65], [-.5, 3.5], [-.5, 1.3], [-.4, 1.15], [-.25, 1.3], [-.25, 3.5], [-.15, 3.65], [0, 3.5], [0, 1.3], [.1, 1.15], [.25, 1.3], [.25, 3.5], [.35, 3.65], [.5, 3.5], [.5, 1.3], [.6, 1.15], [.75, 1.3]].map(([x, z]) => ({ x: x!, y: 2.91, z: z! })) }));
    parts.push(box("横置消防泵实际接入下平台的整体承泵底座", [0, 1.22, .2], [1, .15, .3], transportColors.dark));
    return parts;
  } },
];
