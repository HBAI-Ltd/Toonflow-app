import { part, ring, type ModelPart } from "../assetModelParts";
import { runningFrame } from "./railExpansionBatchThree";
import { box, cylinder, strut, transportColors, type TransportDefinition } from "./parts";

// 机构关系据博物馆资料，非历史车辆的精确复刻，不提供机械运行或制造规格。
// https://www.museum-newtonabbot.org.uk/news/article/atmospheric-railway
// https://artsandculture.google.com/story/the-patiala-royals-one-track-wonder-national-rail-museum/zgVhCWqXEvj9LA
export const railExpansionBatchSeven: TransportDefinition[] = [
  { name: "大气活塞牵引铁路先导车", tags: ["大气铁路", "车下牵引活塞", "穿槽连接刀架", "无车载发动机"], create: () => {
    const parts: ModelPart[] = [
      ...runningFrame(6.5, [-2.1, 2.1]),
      box("先导车全长开放木平台", [0, 1.17, 0], [2.4, .18, 6.35], transportColors.wood),
      box("车下活塞牵引刀架上部承力座", [0, .92, -.7], [.7, .48, 1.2], transportColors.dark),
      box("连接地面气动管活塞与车架的薄刀形牵引臂", [0, .59, -.7], [.035, .65, .32], transportColors.body),
      cylinder("沿轨向布置的圆形牵引活塞", [0, .19, -.7], [.3, .3, .3], transportColors.trim, [90, 0, 0]),
      cylinder("活塞前后的中心短轴", [0, .19, -.7], [.07, 1.08, .07], transportColors.dark, [90, 0, 0]),
      ring("牵引活塞周缘的密封带", transportColors.dark, .152, .02, 0, .08, { position: { x: 0, y: .19, z: -.7 }, rotation: { x: 90, y: 0, z: 0 } }),
      box("供列车员站立的前部遮雨顶", [0, 2.86, -1.9], [2.48, .1, 2.15], transportColors.body),
      box("后部独立制动器座", [0, 1.68, 2.2], [.55, 1, .4], transportColors.dark),
      cylinder("列车员操作的制动手轮竖轴", [0, 2.21, 2.2], [.065, .45, .065], transportColors.body),
      ring("高位制动手轮的真实轮缘", transportColors.dark, .26, .03, 2.44, .04, { position: { x: 0, y: 2.44, z: 2.2 } }),
      strut("制动手轮横向承力辐条", [-.24, 2.44, 2.2], [.24, 2.44, 2.2], .025),
      strut("制动手轮纵向承力辐条", [0, 2.44, 1.96], [0, 2.44, 2.44], .025),
    ];
    for (const side of [-1, 1]) {
      parts.push(strut("前部遮雨顶的前支柱", [side * 1.12, 1.26, -2.86], [side * 1.12, 2.82, -2.86], .055), strut("前部遮雨顶的后支柱", [side * 1.12, 1.26, -1], [side * 1.12, 2.82, -1], .055), strut("站立平台长侧上扶手", [side * 1.12, 2.13, -2.9], [side * 1.12, 2.13, 2.9], .04));
      for (const z of [-2.9, -.95, 1, 2.9]) parts.push(strut("平台侧扶手固定立柱", [side * 1.12, 1.26, z], [side * 1.12, 2.13, z], .04));
    }
    for (const end of [-1, 1]) parts.push(strut("平台端部横向安全扶手", [-1.12, 2.13, end * 2.9], [1.12, 2.13, end * 2.9], .04));
    return parts;
  } },
  { name: "侧置道路平衡轮蒸汽单轨机车", tags: ["尤因式单轨", "单列双轮缘承重钢轮", "侧向道路支承轮", "偏置蒸汽机车"], create: () => {
    const parts: ModelPart[] = [
      box("避开单列走行轮上缘的纵向主梁", [-.45, 1.08, 0], [.42, .13, 6.05], transportColors.dark),
      box("机车主体连续承载平台", [-.15, 1.14, 0], [2, .2, 6.1], transportColors.dark),
      cylinder("沿主轨布置的水平蒸汽锅炉", [-.45, 1.98, -.65], [1.24, 3.7, 1.24], transportColors.body, [90, 0, 0]),
      cylinder("锅炉前端独立烟箱面", [-.45, 1.98, -2.56], [1.27, .13, 1.27], transportColors.dark, [90, 0, 0]),
      cylinder("锅炉前方高烟囱", [-.45, 2.99, -1.96], [.29, .83, .29], transportColors.dark),
      cylinder("锅炉上方蒸汽穹顶", [-.45, 2.75, -.2], [.44, .48, .44], transportColors.trim),
      box("后端司机室低围", [-.15, 1.71, 1.95], [1.95, .96, 1.9], transportColors.body),
      box("司机室上方独立顶盖", [-.15, 3.32, 1.95], [2.12, .13, 2.03], transportColors.dark),
      strut("伸向道路支承轮的主平衡臂", [.35, .96, .65], [2.4, .55, .65], .18, transportColors.dark),
      strut("道路轮前方斜向平衡撑", [.3, 1.12, -1.25], [2.4, .55, .65], .12, transportColors.dark),
      strut("道路轮后方斜向平衡撑", [.3, 1.12, 2.45], [2.4, .55, .65], .12, transportColors.dark),
      ring("道路平衡轮真实中空外轮辋", transportColors.dark, .55, .08, 0, .18, { position: { x: 2.4, y: .55, z: .65 }, rotation: { x: 0, y: 0, z: 90 } }),
      cylinder("道路平衡轮中央轴毂", [2.4, .55, .65], [.18, .24, .18], transportColors.trim, [0, 0, 90]),
      cylinder("连接平衡臂与道路轮的水平短轴", [2.29, .55, .65], [.12, .46, .12], transportColors.dark, [0, 0, 90]),
    ];
    for (let index = 0; index < 8; index++) { const angle = index * Math.PI / 4; parts.push(strut("道路支承轮连接轮毂与轮辋的辐条", [2.4, .55, .65], [2.4, .55 + Math.cos(angle) * .49, .65 + Math.sin(angle) * .49], .055, transportColors.trim)); }
    for (const z of [-1.8, 0, 1.8]) {
      parts.push(part("沿唯一钢轨走行的双轮缘钢轮", "lathe", transportColors.body, [-.45, .5, z], [1, 1, 1], [0, 0, 90], { profile: [{ x: .08, y: -.12 }, { x: .5, y: -.12 }, { x: .5, y: -.08 }, { x: .46, y: -.06 }, { x: .46, y: .06 }, { x: .5, y: .08 }, { x: .5, y: .12 }, { x: .08, y: .12 }, { x: .08, y: -.12 }] }), cylinder("单列承重轮横向短轴", [-.45, .5, z], [.13, .66, .13], transportColors.dark, [0, 0, 90]), cylinder("外侧联动杆曲柄销", [-.2, .66, z], [.12, .27, .12], transportColors.trim, [0, 0, 90]));
      for (const side of [-1, 1]) parts.push(box("位于轮盘两侧的独立轴承座", [-.45 + side * .25, .5, z], [.15, .23, .32], transportColors.dark), strut("轴承座向上连接纵向主梁的竖挂板", [-.45 + side * .25, .6, z], [-.45 + side * .25, 1.09, z], .1, transportColors.dark));
    }
    parts.push(strut("三根承重轮轴共同连杆", [-.16, .66, -1.8], [-.16, .66, 1.8], .075, transportColors.trim), cylinder("机车前侧卧式工作汽缸", [-.13, .85, -2.05], [.31, .68, .31], transportColors.body, [90, 0, 0]), strut("汽缸活塞杆连接第一轴曲柄", [-.13, .85, -2.05], [-.16, .66, -1.8], .055, transportColors.trim), box("后部煤水箱", [-.15, 1.76, 2.6], [1.7, 1.0, .55], transportColors.dark));
    parts.push(box("前侧工作汽缸连接主平台的承座", [-.13, 1.02, -2.05], [.35, .13, .4], transportColors.dark));
    for (const z of [-1.35, .35]) parts.push(box("水平锅炉至平台的实际鞍座", [-.45, 1.36, z], [.95, .35, .34], transportColors.dark));
    for (const x of [-1.06, .76]) for (const z of [1.05, 2.85]) parts.push(box("司机室窗间完整立柱", [x, 2.68, z], [.09, 1.2, .1], transportColors.dark));
    return parts;
  } },
];
