import { part, type ModelPart } from "../assetModelParts";
import { tapered } from "../masterNature/shared";
import { plate } from "../masterObjects/parts";
import { box, cylinder, strut, transportColors, type TransportDefinition } from "./parts";
import { woodWheel } from "./easternHorseCarriageBatchOne";

// 原创完整单层长廊驿车；固定纵向对坐长凳、后登阶与第五轮底架共同构成车体。
export const easternHorseCarriageBatchTwo: TransportDefinition[] = [
  { name: "长廊卷帘对座驿站客车", theme: "中式", tags: ["马车", "影视", "畜力车", "完整单层马拉客车", "纵向相对长凳及中央通道", "后中央登阶", "前第五轮转向底架"], create: () => {
    const wood = "#947452", iron = transportColors.dark, cloth = "#b6ac91";
    const parts: ModelPart[] = [box("从前驾台贯通后客舱的完整长梁承板", [0, 1.19, .45], [1.62, .1, 3.8], wood), box("客廊前方独立但与同车长梁相接的驾台底", [0, 1.2, -1.77], [1.62, .12, .66], wood), box("高于乘客坐凳的车夫整幅座箱", [0, 1.4, -1.79], [1.4, .28, .43], wood), box("车夫座后相连的低靠板", [0, 1.70, -1.555], [1.4, .51, .055], wood), box("车夫前方实接承臂的横向脚踏", [0, 1.04, -2.3], [1.35, .08, .35], wood), box("前轴架上承住转盘的横木枕", [0, .72, -1.65], [1.3, .12, .3], wood), cylinder("从轴架穿到客车底梁承枕的完整第五轮立销", [0, .80, -1.65], [.10, .43, .10], iron), part("随前车轴摆转的下第五轮承盘", "lathe", iron, [0, .78, -1.65], [1, 1, 1], [0, 0, 0], { profile: [{ x: .055, y: 0 }, { x: .425, y: 0 }, { x: .425, y: .06 }, { x: .055, y: .06 }, { x: .055, y: 0 }] }), part("真实接到上横枕而中央穿销的上第五轮承盘", "lathe", wood, [0, .845, -1.65], [1, 1, 1], [0, 0, 0], { profile: [{ x: .055, y: 0 }, { x: .425, y: 0 }, { x: .425, y: .1 }, { x: .055, y: .1 }, { x: .055, y: 0 }] }), box("上第五轮与两根长梁之间的承载横枕", [0, .96, -1.65], [1.30, .09, .34], wood), tapered("从转向前架前伸并随前轴联动的完整曲辕", wood, [[0, .7, -1.65], [0, .82, -2.7], [0, 1.04, -4.3]], [.075, .065, .05]), box("曲辕前端完整的系驾横木", [0, 1.04, -4.24], [1.62, .1, .12], wood)];
    for (const [z, radius, halfTrack] of [[-1.65, .55, 1], [1.65, .7, 1.05]]) {
      parts.push(cylinder("穿过两只中空木毂的完整横向车轴", [0, radius!, z!], [.09, halfTrack! * 2 + .30, .09], iron, [0, 0, 90]));
      for (const side of [-1, 1]) parts.push(...woodWheel(side * halfTrack!, z!, radius!), cylinder("轮毂外端实际穿过车轴的防脱立销", [side * (halfTrack! + .13), radius!, z!], [.014, .19, .014], iron), part("车架承载且中央保留真实穿轴孔的轴座", "lathe", iron, [side * .48, radius!, z!], [1, 1, 1], [0, 0, 90], { profile: [{ x: .052, y: -.085 }, { x: .13, y: -.085 }, { x: .13, y: .085 }, { x: .052, y: .085 }, { x: .052, y: -.085 }] }));
    }
    for (const side of [-1, 1]) {
      parts.push(box("贯穿前后轴架且直接承住整幅车板的长木梁", [side * .48, 1.05, .10], [.14, .18, 4.8], wood), box("后轴座上接长梁的实际承载木墩", [side * .48, .885, 1.65], [.17, .18, .26], wood), box("面对中央通道的整根纵向乘客坐凳", [side * .54, 1.59, .45], [.45, .13, 3.35], wood), cylinder("卷在侧梁下且不封住侧廊的完整长帘卷", [side * .78, 2.62, .45], [.10, 3.5, .10], cloth, [90, 0, 0]), box("六柱上方连续承接弧顶的纵向顶枋", [side * .77, 2.87, .45], [.085, .08, 3.62], wood), strut("驾台脚踏接回同车长梁的短承臂", [side * .5, 1.05, -2.1], [side * .5, 1.0, -2.45], .08, wood));
      for (const z of [-.95, .45, 1.85]) parts.push(box("直接从车板顶承到整根坐凳下缘的短座脚", [side * .58, 1.385, z], [.075, .29, .13], wood));
      for (const z of [-1.25, .45, 2.15]) parts.push(box("由客车地板一直承到弧顶内缘的通高廊柱", [side * .77, 2.07, z], [.075, 1.66, .075], wood));
      for (const y of [1.74, 1.94, 2.14]) parts.push(box("接入通高廊柱且保持侧廊开放的长条靠背", [side * .74, y, .45], [.055, .09, 3.5], wood));
      parts.push(strut("后中央登阶下方接回车板的完整斜梯梁", [side * .37, 1.16, 2.28], [side * .37, .32, 3.12], .06, wood), strut("后登阶一侧从廊内向下连续延伸的手扶长杆", [side * .39, 2.03, 2.2], [side * .39, 1.33, 3.05], .035, iron), strut("后梯下端接回斜梯梁的扶手立杆", [side * .39, .42, 3.02], [side * .39, 1.36, 3.02], .035, iron), strut("后梯上端接回车板的扶手立杆", [side * .39, 1.20, 2.28], [side * .39, 2.0, 2.28], .035, iron), strut("将后扶手根部连接到客廊立柱的短杆", [side * .77, 1.97, 2.15], [side * .39, 2.03, 2.2], .035, iron));
    }
    for (const [y, z] of [[1.04, 2.44], [.76, 2.72], [.48, 3]]) parts.push(box("实际落在两根斜梯梁上的后登阶踏板", [0, y!, z!], [.76, .08, .27], wood));
    for (const z of [-1.25, 2.15]) parts.push(box("两侧通高廊柱顶端的承顶横梁", [0, 2.87, z], [1.63, .1, .1], wood));
    const roof: [number, number][] = [];
    for (let index = 0; index <= 12; index++) { const a = index * Math.PI / 12; roof.push([Math.cos(a) * .915, 2.76 + Math.sin(a) * .24]); }
    for (let index = 12; index >= 0; index--) { const a = index * Math.PI / 12; roof.push([Math.cos(a) * .89, 2.76 + Math.sin(a) * .215]); }
    parts.push(plate("由真实薄壁构成而没有填实客舱的完整弧形长棚顶", [0, 0, .45], roof, 4.2, cloth, [0, 0, 0]));
    return parts;
  } },
];
