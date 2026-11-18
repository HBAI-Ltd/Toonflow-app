import { part, type ModelPart, type Triple } from "../assetModelParts";
import { tapered } from "../masterNature/shared";
import { piercedPanel } from "../masterObjects/parts";
import { woodWheel } from "./easternHorseCarriageBatchOne";
import { box, cylinder, strut, transportColors, type TransportDefinition } from "./parts";

// 双柱塞、共轴人工压杠和独立气室构成完整消防泵车，不是货架更换桶装货物。
// 机构类型参考：https://museum.wales/collections/online/object/3090ab81-9280-3ddd-95d8-1a702cffb988/Fire-engine/
// https://www.fireground.org.uk/the-collection/appliance-fleet/

export const easternHorseCarriageBatchFour: TransportDefinition[] = [
  { name: "双压杠畜力消防泵车", theme: "中式", tags: ["马车", "影视", "畜力车", "近代水龙车", "完整人工双柱塞消防泵车", "连续压杠与空气蓄压室"], create: () => {
    const wood = "#925d49", iron = transportColors.dark, brass = "#b5a16b";
    const parts: ModelPart[] = [box("水泵水箱和压杠门架共同使用的完整厚底板", [0, .94, .08], [1.05, .12, 2.4], wood), box("只作为水箱底而不填满水箱内腔的整块底", [0, 1.015, 0], [.91, .065, 1.57], wood), box("前转向轴架的实际承盘木枕", [0, .61, -1.05], [1.2, .16, .32], wood), cylinder("由转向前轴架穿入整车底梁的第五轮立销", [0, .72, -1.05], [.09, .41, .09], iron), part("与前轴架连成一体的下转向承盘", "lathe", iron, [0, .69, -1.05], [1, 1, 1], [0, 0, 0], { profile: [{ x: .05, y: 0 }, { x: .32, y: 0 }, { x: .32, y: .065 }, { x: .05, y: .065 }, { x: .05, y: 0 }] }), part("将上木梁荷载传到下盘的上转向承盘", "lathe", wood, [0, .76, -1.05], [1, 1, 1], [0, 0, 0], { profile: [{ x: .05, y: 0 }, { x: .32, y: 0 }, { x: .32, y: .085 }, { x: .05, y: .085 }, { x: .05, y: 0 }] }), box("从上转盘横接两侧底梁的真实托木", [0, .855, -1.05], [1.05, .10, .36], wood), tapered("与前转向木枕一体的完整前伸牵引曲辕", transportColors.wood, [[0, .62, -1.05], [0, .73, -2], [0, .94, -3.15]], [.065, .055, .044]), box("曲辕前端连接系驾带的承力横木", [0, .94, -3.1], [1.35, .08, .10], transportColors.wood), cylinder("穿过双立架并承住两侧完整压杠的共同横轴", [0, 1.86, 0], [.07, 1.15, .07], iron, [0, 0, 90]), part("与双泵出水总管相连而顶端封闭的空气蓄压室", "lathe", brass, [.26, 1.07, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: .11, y: 0 }, { x: .15, y: .12 }, { x: .17, y: .65 }, { x: .14, y: .77 }, { x: .07, y: .85 }, { x: 0, y: .87 }] })];
    for (const [z, radius, track] of [[-1.05, .46, .76], [1.15, .60, .87]]) {
      parts.push(cylinder("贯通木车毂与车架轴座的完整横轴", [0, radius!, z!], [.085, track! * 2 + .30, .085], iron, [0, 0, 90]));
      for (const side of [-1, 1]) parts.push(...woodWheel(side * track!, z!, radius!), cylinder("穿过轴端以防轮毂脱出的立销", [side * (track! + .13), radius!, z!], [.014, .18, .014], iron), part("固定在车架下方而真实开出车轴孔的闭合轴座", "lathe", iron, [side * .38, radius!, z!], [1, 1, 1], [0, 0, 90], { profile: [{ x: .05, y: -.075 }, { x: .12, y: -.075 }, { x: .12, y: .075 }, { x: .05, y: .075 }, { x: .05, y: -.075 }] }));
    }
    for (const side of [-1, 1]) {
      parts.push(box("由前后轴承真正托起整车水箱的连续长梁", [side * .38, .86, .08], [.13, .16, 2.63], wood), box("后轴座到长梁下缘的承重木墩", [side * .38, .75, 1.15], [.16, .13, .24], wood), box("保留箱内真实水腔的薄长侧壁", [side * .45, 1.25, 0], [.045, .44, 1.57], wood), box("从箱壁内侧实接共同压杠轴的通高立架", [side * .4, 1.49, 0], [.075, .74, .16], wood), box("供多人从两端反复压动的整根侧长杠", [side * .46, 1.86, 0], [.075, .085, 3.2], transportColors.wood), strut("长压杠中段连接横轴座的短斜加强杆", [side * .46, 1.86, -.45], [side * .4, 1.66, 0], .035, iron));
    }
    for (const z of [-.75, .795]) {
      parts.push(piercedPanel("箱端真实保留泵接管穿孔的薄端板", [0, 0, z], [[-.45, 1.03], [.45, 1.03], [.45, 1.47], [-.45, 1.47]], [Array.from({ length: 12 }, (_, index): [number, number] => [Math.cos(-index * Math.PI / 6) * .05, 1.20 + Math.sin(-index * Math.PI / 6) * .05])], .045, wood, [-90, 0, 0]));
    }
    parts.push(box("空气蓄压室底口真正固定到水箱底的宽承座", [.26, 1.06, 0], [.25, .06, .25], iron));
    for (const z of [-.35, .35]) {
      parts.push(box("将单只柱塞泵底座实际接到水箱底的承座", [0, 1.095, z], [.28, .14, .26], iron), part("上端真实开出活塞孔的独立竖向黄铜泵筒", "lathe", brass, [0, 1.15, z], [1, 1, 1], [0, 0, 0], { profile: [{ x: .065, y: 0 }, { x: .11, y: 0 }, { x: .11, y: .56 }, { x: .065, y: .56 }, { x: .065, y: 0 }] }), cylinder("由泵筒内伸到上部压杠横托的实际柱塞杆", [0, 1.645, z], [.055, .49, .055], iron), box("连接左右两侧长杠并直接承接柱塞杆的横托", [0, 1.86, z], [.99, .08, .09], transportColors.wood), tapered("由泵筒下座连到共同空气室的排水汇管", brass, [[0, 1.17, z], [.26, 1.17, z], [.26, 1.17, 0]], [.032, .032, .032]));
    }
    for (const z of [-1.56, 1.56]) parts.push(box("将两侧长压杠端部连在一起的多人横握杆", [0, 1.86, z], [1.48, .045, .06], transportColors.wood));
    parts.push(tapered("由前泵到前端出水接头的连续实际管路", brass, [[0, 1.2, -.35], [0, 1.2, -.82]], [.037, .037]), tapered("由后端进水接头进入后泵的连续实际管路", brass, [[0, 1.2, .35], [0, 1.2, .82]], [.037, .037]), part("穿过前端真孔而向外敞口的完整出水接管", "lathe", brass, [0, 1.2, -1.035], [1, 1, 1], [90, 0, 0], { profile: [{ x: .04, y: 0 }, { x: .065, y: 0 }, { x: .065, y: .065 }, { x: .046, y: .065 }, { x: .046, y: .30 }, { x: .04, y: .30 }, { x: .04, y: 0 }] }), part("穿过后端真孔且可接吸水带的完整进水接管", "lathe", brass, [0, 1.2, 1.035], [1, 1, 1], [-90, 0, 0], { profile: [{ x: .04, y: 0 }, { x: .065, y: 0 }, { x: .065, y: .065 }, { x: .046, y: .065 }, { x: .046, y: .30 }, { x: .04, y: .30 }, { x: .04, y: 0 }] }));
    for (const z of [-.35, .35]) parts.push(part("在泵筒顶实际约束柱塞杆且中央真开孔的填料压盖", "lathe", brass, [0, 1.695, z], [1, 1, 1], [0, 0, 0], { profile: [{ x: .028, y: 0 }, { x: .115, y: 0 }, { x: .115, y: .04 }, { x: .028, y: .04 }, { x: .028, y: 0 }] }));
    const hose = Array.from({ length: 25 }, (_, index): Triple => { const a = index * Math.PI / 6; return [-.59 - index * .0045, 1.26 + Math.sin(a) * .3, .04 + Math.cos(a) * .3]; });
    parts.push(tapered("在侧托上完整卷绕而未单列素材的皮制消防水带", "#75604b", hose, hose.map(() => .024)), box("托住侧卷水带并接回车架的完整窄搁板", [-.59, .91, .04], [.30, .06, .80], wood), strut("侧水带托板前端接回车架的短承臂", [-.38, .86, -.28], [-.68, .9, -.28], .045, iron), strut("侧水带托板后端接回车架的短承臂", [-.38, .86, .36], [-.68, .9, .36], .045, iron));
    return parts;
  } },
];
