import { part, type ModelPart } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { rod } from "../masterObjects/parts";
import { box, cylinder, transportColors, wheel, type TransportDefinition } from "./parts";
import { commercialMirrors, commercialRoof, commercialRoofCap, commercialSeatRow } from "./everydayCommercialVehicleBatchOne";

function trikeRunningGear(frontZ: number, rearZ: number): ModelPart[] {
  const length = rearZ - frontZ + .55, center = (frontZ + rearZ) / 2 + .125;
  const parts: ModelPart[] = [...wheel([0, .29, frontZ], .29, .16), cylinder("单前轮实际贯通前叉的短轮轴", [0, .29, frontZ], [.09, .32, .09], transportColors.trim, [0, 0, 90]), cylinder("两只后轮之间的实际贯通差速桥", [0, .29, rearZ], [.12, 1.42, .12], transportColors.dark, [0, 0, 90]), cylinder("直接接入后桥的低位独立驱动壳", [0, .38, rearZ], [.28, .5, .28], transportColors.dark, [0, 0, 90]), cylinder("前轮叉顶与车架连接的真实转向头管", [0, .8, frontZ + .15], [.12, .3, .12], transportColors.dark)];
  for (const side of [-1, 1]) parts.push(...wheel([side * .58, .29, rearZ], .29, .18), box("从前舱贯通后桥的低位三轮车主纵梁", [side * .35, .46, center], [.12, .34, length], transportColors.dark), rod("从前轴接到转向头管两侧的真实前叉", [side * .11, .29, frontZ], [side * .075, .83, frontZ + .15], .045, transportColors.trim), rod("左右主纵梁向中央转向头管闭合的斜承梁", [side * .35, .46, frontZ + .4], [0, .68, frontZ + .1], .07, transportColors.dark));
  return parts;
}

function frontFrame(name: string, width: number, lower: number, upper: number, z: number, holes: [number, number, number, number][], color: string): ModelPart {
  const value = polygon(name, color, [[-width / 2, -lower], [width / 2, -lower], [width / 2, -upper], [-width / 2, -upper]], .065, [0, 0, z - .0325], holes.map(([x1, x2, y1, y2]) => [[x1, -y1], [x2, -y1], [x2, -y2], [x1, -y2]]));
  value.rotation.x = 90;
  return value;
}

// 完整现代机动三轮车：封闭快递舱与侧敞后排载客车分别建造，不由旧人力车加发动机/换篷色衍生。
// https://www.bajajauto.com/three-wheelers/re
// https://yadea.ph/news-and-events/news/Yadea%20Unveils%20KEMPER%3A%20A%20High-Performance%20Electric%20Motorcycle%20at%20EICMA%202023
export const everydayCommercialVehicleBatchSix: TransportDefinition[] = [
  { name: "前单轮封闭驾驶舱厢式快递三轮汽车", theme: "现代", tags: ["汽车", "影视", "生活常见", "快递三轮车", "封闭驾驶舱", "独立长货厢", "电动三轮物流车"], create: () => {
    const color = transportColors.trim;
    const parts: ModelPart[] = [...trikeRunningGear(-1.5, 1.15), box("位于单前轮之后且不压到前轮的驾驶地板", [0, .64, -.65], [1.1, .12, .8], transportColors.dark), commercialRoof("封闭快递三轮驾驶室的独立短圆肩顶", 1.12, 1, 1.83, -.725, color), frontFrame("真正留出驾驶观察窗和转向柱穿孔的前舱围板", 1.12, .68, 1.9, -1.2, [[-.49, .49, 1.03, 1.75], [-.055, .055, .9, 1.01]], color), { ...box("装在真实前舱风挡孔中的玻璃", [0, 1.39, -1.2], [.99, .73, .025], transportColors.glass), opacity: .32 }, box("窄驾驶舱后方的独立承力背板", [0, 1.3, -.25], [1.1, 1.26, .07], color), commercialSeatRow("位于短驾驶舱内的独立单人驾驶座", .7, -.57, [0], .43), box("单前轮上方不封死转向空间的前罩顶", [0, 1.015, -1.45], [1.08, .06, .5], color), box("前单轮罩前方独立低位鼻板", [0, .8, -1.71], [1.08, .4, .06], color), rod("从前转向头管接入驾驶室的倾斜操纵柱", [0, .85, -1.35], [0, 1.15, -.92], .04, transportColors.dark), rod("驾驶室中间真正接在操纵柱上的双手把", [-.28, 1.15, -.92], [.28, 1.15, -.92], .035, transportColors.dark), ...commercialMirrors(1.1, 1.52, -1.18), box("高于后轮并接在主梁上的完整快递货舱地板", [0, .69, .8], [1.36, .14, 2], transportColors.dark), box("完整快递箱不依靠驾驶舱围合的前端壁", [0, 1.33, -.18], [1.36, 1.16, .07], color), box("快递厢真正封闭的独立顶板", [0, 1.95, .8], [1.4, .1, 2.04], color)];
    parts.push(commercialRoofCap(1.12, 1.83, -1.2, color), commercialRoofCap(1.12, 1.83, -.25, color));
    for (const side of [-1, 1]) {
      const panel = polygon("窄驾驶舱车门带完整可透侧窗的门框", color, [[.68, -1.2], [1.9, -1.2], [1.9, -.25], [.68, -.25]], .065, [side * .55 + .0325, 0, 0], [[[1.05, -1.12], [1.75, -1.12], [1.75, -.35], [1.05, -.35]]]);
      panel.rotation.z = 90;
      parts.push(panel, { ...box("真正安装在侧门开孔中的观察玻璃", [side * .55, 1.4, -.735], [.025, .71, .78], transportColors.glass), opacity: .32 }, box("封闭快递箱的长承力侧壁", [side * .67, 1.33, .8], [.07, 1.16, 2], color), box("后装货箱各自独立的竖向开门门板", [side * .335, 1.33, 1.8], [.64, 1.16, .075], color), box("快递后门的独立铰链", [side * .64, 1.34, 1.85], [.04, .78, .035], transportColors.dark), box("窄驾驶舱侧门机械把手", [side * .6, .97, -.43], [.025, .06, .18], transportColors.dark), box("封闭快递厢后部实际固定的尾灯", [side * .5, .85, 1.85], [.14, .2, .04], "#b96953"), box("前单轮鼻板两侧真实固定的照明灯", [side * .35, .84, -1.75], [.24, .13, .04], "#ddd9bd"), box("前轮罩两侧不堵住中间前叉的薄罩壁", [side * .52, .8, -1.45], [.05, .4, .5], color));
    }
    parts.push(box("快递后门中间独立竖向锁杆", [0, 1.33, 1.85], [.04, .92, .035], transportColors.dark));
    return parts;
  } },
  { name: "整体篷顶侧敞后排机动载客三轮汽车", theme: "现代", tags: ["汽车", "影视", "生活常见", "机动载客三轮", "嘟嘟车", "tuk tuk", "前单轮把式驾驶", "后置动力座下布局"], create: () => {
    const color = "#a6b5a3", canopy = "#66726f";
    const parts: ModelPart[] = [...trikeRunningGear(-1.35, .75), box("连接前驾驶位与后排乘员区的完整低位地板", [0, .69, .2], [1.3, .12, 2.3], transportColors.dark), commercialRoof("覆盖前驾驶位和整排乘客的连续弧形篷顶", 1.45, 2.6, 1.89, .05, canopy), frontFrame("机动载客车前端真实留孔的完整风挡框", 1.35, .72, 1.94, -1.2, [[-.56, .56, 1.05, 1.77], [-.055, .055, .9, 1.01]], color), { ...box("侧敞三轮前方实际装在框内的透明风挡", [0, 1.41, -1.2], [1.13, .73, .025], transportColors.glass), opacity: .32 }, box("载客三轮单前轮上方的前罩鼻板", [0, .83, -1.56], [1.29, .45, .08], color), box("前鼻罩向前风挡下缘闭合的薄顶盖", [0, 1.035, -1.38], [1.3, .055, .4], color), commercialSeatRow("机动载客车中央单人驾驶座", .75, -.35, [0], .43), box("后排乘员坐垫下方真实落地板的动力座仓", [0, .86, .93], [1.23, .35, .6], color), box("完整三人后排长座的坐垫", [0, 1.1, .93], [1.22, .14, .54], transportColors.dark), box("后排长座实际接在动力仓上方的独立靠背", [0, 1.35, 1.18], [1.23, .5, .08], transportColors.dark), frontFrame("篷顶后方带实际观察孔的柔性后围", 1.35, 1.03, 1.94, 1.33, [[-.44, .44, 1.36, 1.77]], canopy), { ...box("后篷观察孔内的独立透明软窗", [0, 1.565, 1.33], [.89, .42, .025], transportColors.glass), opacity: .32 }, rod("从单前轮转向头管接入把式驾驶位的操纵柱", [0, .95, -1.2], [0, 1.2, -.8], .045, transportColors.dark), rod("单人驾驶位置前方真实相接的双手把", [-.3, 1.2, -.8], [.3, 1.2, -.8], .035, transportColors.dark), ...commercialMirrors(1.3, 1.5, -1.18)];
    parts.push(commercialRoofCap(1.45, 1.89, -1.2, canopy), commercialRoofCap(1.45, 1.89, 1.33, canopy), box("把后排动力座仓与尾灯真正闭合连接的低后围", [0, .9, 1.32], [1.3, .48, .07], color));
    for (const side of [-1, 1]) {
      parts.push(box("前鼻罩不堵住中央轮叉的薄侧壁", [side * .63, .83, -1.38], [.055, .45, .36], color), box("后排动力座仓外侧固定低围壁", [side * .65, .91, .93], [.055, .48, .76], color), rod("侧面入口真正从地板升到篷顶的后承柱", [side * .66, .73, 1.28], [side * .66, 1.94, 1.28], .045, transportColors.dark), rod("与前风挡框相接的篷顶前柱", [side * .65, .73, -1.2], [side * .65, 1.94, -1.2], .045, transportColors.dark), box("乘员侧面入口外的低位上车脚踏", [side * .8, .35, -.05], [.25, .12, .65], transportColors.dark), box("连接低脚踏与乘员地板的第二级窄踏板", [side * .73, .57, -.05], [.25, .12, .8], transportColors.dark), rod("外侧登车脚踏接入主纵梁的独立短托臂", [side * .35, .46, .02], [side * .8, .35, .02], .055, transportColors.dark), box("固定在后座动力围壁上的独立尾灯", [side * .5, .9, 1.36], [.15, .2, .045], "#b96953"));
    }
    const fenderProfile = Array.from({ length: 9 }, (_, index) => { const angle = index * Math.PI / 8; return { x: Math.cos(angle) * .38, y: Math.sin(angle) * .38 }; });
    fenderProfile.push(...Array.from({ length: 9 }, (_, index) => { const angle = (8 - index) * Math.PI / 8; return { x: Math.cos(angle) * .33, y: Math.sin(angle) * .33 }; }));
    parts.push(part("独立承在单前轮上方而不充当轮胎的弧形翼子板", "extrude", color, [0, .29, -1.35], [1, 1, 1], [0, 90, 0], { depth: .3, profile: fenderProfile }), cylinder("前鼻板中间独立安装的圆形道路前灯", [0, .84, -1.62], [.24, .05, .24], "#ddd9bd", [90, 0, 0]));
    return parts;
  } },
];
