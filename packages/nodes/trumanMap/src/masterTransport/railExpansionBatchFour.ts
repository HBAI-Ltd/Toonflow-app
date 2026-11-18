import { part, type ModelPart } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { archedRoof, runningFrame } from "./railExpansionBatchThree";
import { box, cab, cylinder, strut, transportColors, type TransportDefinition } from "./parts";

// 工作机构的类别依据，尺寸和轮廓均为本地原创简化构型。
// https://loram.com/maintenance-of-way/ballast-maintenance/specialty-excavating/ltv/
// https://www.plassertheurer.com/en/machine/vacuum-scraper-excavators/vm-250-jumbo
// https://buloxequipment.com/product/track-tunnel-cleaning-wagon-tcw/
// https://www.ferrit.cz/en/products/suspended-monorail-transport/diesel-locomotives/dlz110f-ii
export const railExpansionBatchFour: TransportDefinition[] = [
  { name: "轨道式旋臂真空吸砟作业车", theme: "现代", tags: ["真空挖掘养路", "吸管悬吊旋臂", "旋风分离与过滤"], create: () => {
    const parts: ModelPart[] = [...runningFrame(14.2, [-5.5, -3.9, 3.9, 5.5]), box("吸砟车全长设备承台", [0, 1.17, 0], [2.6, .2, 14]), ...cab([0, 1.28, -5.2], [2.4, 2.1, 2.4]), part("带封顶及下收分锥的旋风分离罐", "lathe", transportColors.body, [0, 1.25, .3], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: .3, y: 0 }, { x: .3, y: .35 }, { x: 1.1, y: 1.2 }, { x: 1.1, y: 2.55 }, { x: .85, y: 2.8 }, { x: 0, y: 2.8 }] }), box("分离后集砟的后部密闭接收仓", [0, 2.23, 3.65], [2.3, 1.9, 4.2], transportColors.body), cylinder("后部真空风机主壳", [0, 3.58, 4.3], [1.05, 1.3, 1.05], transportColors.dark, [90, 0, 0]), cylinder("吸管回转臂中央立座", [.78, 2.16, -2.15], [.6, 1.65, .6], transportColors.dark), strut("回转立座上方第一承力臂", [.78, 2.95, -2.15], [2.55, 4.25, -2.5], .2, transportColors.signal), strut("吸管外伸第二承力臂", [2.55, 4.25, -2.5], [3.15, 3, -3.4], .17, transportColors.signal), strut("第一臂下方举升液压缸", [1.02, 2.4, -2.25], [2.1, 3.9, -2.43], .13, transportColors.dark), cylinder("两臂之间真实回转铰轴", [2.55, 4.25, -2.5], [.23, .4, .23], transportColors.dark, [0, 0, 90]), part("分离罐到臂端连续大直径柔性吸管", "tube", transportColors.dark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { path: [{ x: .9, y: 3.55, z: -.1 }, { x: 1.8, y: 4.08, z: -1.3 }, { x: 2.6, y: 4.15, z: -2.5 }, { x: 3.12, y: 2.8, z: -3.4 }, { x: 3.12, y: .5, z: -3.4 }], radius: .2 }), part("底端真正敞口的耐磨吸砟嘴", "lathe", transportColors.trim, [3.12, .2, -3.4], [1, 1, 1], [0, 0, 0], { profile: [{ x: .29, y: 0 }, { x: .29, y: .13 }, { x: .2, y: .4 }, { x: .16, y: .4 }, { x: .25, y: .12 }, { x: .25, y: 0 }, { x: .29, y: 0 }] }), part("分离罐顶部到过滤仓的真空气管", "tube", transportColors.dark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { path: [{ x: 0, y: 4, z: .3 }, { x: 0, y: 4.35, z: 1.3 }, { x: 0, y: 4.1, z: 3.2 }, { x: 0, y: 3.85, z: 4.3 }], radius: .15 })];
    for (const side of [-1, 1]) {
      parts.push(box("罐体下方连续纵向承重脚", [side * .72, 1.72, .3], [.15, .92, .6], transportColors.dark), box("侧向维护步道", [side * 1.18, 1.37, 1.6], [.43, .1, 7.9], transportColors.trim), strut("维护步道上扶手", [side * 1.34, 2.27, -2.35], [side * 1.34, 2.27, 5.55], .035));
      for (const z of [-2.35, .3, 2.95, 5.55]) parts.push(strut("步道护栏立柱", [side * 1.34, 1.37, z], [side * 1.34, 2.27, z], .035));
    }
    for (const x of [-.7, -.23, .23, .7]) parts.push(cylinder("后仓顶部独立滤芯壳", [x, 3.37, 2.4], [.38, .7, .38], transportColors.trim));
    return parts;
  } },
  { name: "弧形旋转喷洗臂铁路隧道清洗车", theme: "现代", tags: ["隧道湿式清洗", "半环形断面喷洗臂", "独立水箱及高压泵"], create: () => {
    const parts: ModelPart[] = [...runningFrame(12.7, [-4.9, -3.4, 3.4, 4.9]), box("清洗车设备底板", [0, 1.17, 0], [2.5, .2, 12.5], transportColors.dark), ...cab([0, 1.28, 4.65], [2.3, 1.95, 2.3]), cylinder("中央卧式储洗涤水罐", [0, 2.27, -.15], [2, 5.9, 2], transportColors.body, [90, 0, 0]), ...[-1, 1].map(end => part("储水罐封闭弧形封头", "sphere", transportColors.body, [0, 2.27, -.15 + end * 2.95], [2, 2, .4])), box("前部独立高压泵及电驱罩", [0, 1.83, -4.15], [1.45, 1.1, 1.45], transportColors.signal), cylinder("喷洗臂回转升降立柱", [0, 3.01, -4.1], [.27, 3, .27], transportColors.dark), strut("回转立柱上方前伸承托臂", [0, 4.35, -4.1], [0, 4.35, -5.3], .14, transportColors.signal), part("前置半环形连续压力喷洗管", "tube", transportColors.body, [0, 0, 0], [1, 1, 1], [0, 0, 0], { path: Array.from({ length: 13 }, (_, index) => { const angle = index * Math.PI / 12; return { x: Math.cos(angle) * 2.75, y: 1.55 + Math.sin(angle) * 2.75, z: -5.3 }; }), radius: .06 }), part("高压泵至旋臂上方的供水软管", "tube", transportColors.dark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { path: [{ x: .5, y: 1.85, z: -4.1 }, { x: .5, y: 3.3, z: -4.1 }, { x: .2, y: 4.4, z: -4.65 }, { x: 0, y: 4.3, z: -5.3 }], radius: .07 }), cylinder("水罐顶部注水口", [0, 3.38, .3], [.48, .25, .48], transportColors.dark)];
    for (const z of [-1.9, 2.3]) parts.push(box("储水罐连接底架的鞍座", [0, 1.5, z], [1.8, .5, .48], transportColors.dark));
    for (let index = 0; index < 13; index++) {
      const angle = index * Math.PI / 12;
      parts.push(part("沿隧道弧面径向朝外的真实开口喷嘴", "lathe", transportColors.dark, [Math.cos(angle) * 2.75, 1.55 + Math.sin(angle) * 2.75, -5.3], [1, 1, 1], [0, 0, index * 15 - 90], { profile: [{ x: .045, y: 0 }, { x: .03, y: .14 }, { x: .018, y: .14 }, { x: .03, y: 0 }, { x: .045, y: 0 }] }));
    }
    for (const side of [-1, 1]) parts.push(box("前轮外侧贴近第三轨护罩的刷洗头", [side * 1.2, .53, -4.8], [.25, .42, .8], transportColors.dark), strut("前侧刷洗头独立悬挂杆", [side * .95, 1.15, -4.8], [side * 1.2, .73, -4.8], .07), box("水箱侧向检修踏板", [side * 1.15, 1.35, .3], [.3, .09, 6.1], transportColors.trim));
    return parts;
  } },
  { name: "承载机车横移式铁路渡车", theme: "现代", itemType: "设施", tags: ["铁路检修横移平台", "横向走行轮组", "台面纵向钢轨"], create: () => {
    const parts: ModelPart[] = [box("承载整台机车的钢结构横移台面", [0, .98, 0], [5.25, .25, 22], transportColors.body), ...cab([2.05, 1.17, 8.1], [.95, 1.8, 1.5])];
    for (const x of [-2.25, -.8, .8, 2.25]) parts.push(box("承载台下方通长箱形纵梁", [x, .74, 0], [.3, .35, 21.8], transportColors.dark));
    for (const z of [-9.7, -6.5, -3.2, 0, 3.2, 6.5, 9.7]) parts.push(box("把轮组载荷分布到台面的横向腹梁", [0, .74, z], [4.8, .3, .2], transportColors.dark));
    for (const z of [-9, 9]) for (const x of [-1.8, 1.8]) parts.push(cylinder("沿横向轨道行走的钢制渡车轮", [x, .38, z], [.76, .2, .76], transportColors.dark, [90, 0, 0]), box("渡车轮上方轴承座", [x, .65, z], [.44, .42, .38], transportColors.dark), cylinder("横移轮组的纵向车轴", [x, .38, z], [.14, .65, .14], transportColors.trim, [90, 0, 0]));
    for (const side of [-1, 1]) {
      parts.push(box("台面纵向承车钢轨底座", [side * .72, 1.13, 0], [.16, .045, 21.8], transportColors.dark), box("台面纵向钢轨立腹", [side * .72, 1.22, 0], [.055, .14, 21.8], transportColors.dark), box("台面纵向钢轨踏面", [side * .72, 1.31, 0], [.085, .055, 21.8], transportColors.trim), strut("台面外缘操作护栏上扶手", [side * 2.53, 2.02, -10.4], [side * 2.53, 2.02, 6.8], .04), ...[-10.4, -4.7, 1, 6.8].map(z => strut("操作护栏固定柱", [side * 2.53, 1.11, z], [side * 2.53, 2.02, z], .04)));
      for (const end of [-1, 1]) parts.push(box("纵向承车轨末端可拆止挡", [side * .72, 1.48, end * 10.6], [.23, .32, .22], transportColors.signal));
    }
    parts.push(box("台侧横向走行减速驱动箱", [-1.75, .81, 7.6], [.7, .7, .7], transportColors.signal));
    return parts;
  } },
  { name: "悬垂折臂式铁路桥梁检修作业车", theme: "现代", tags: ["桥下检修", "越过桥缘的上跨臂", "下翻垂直工作臂", "侧向工作平台"], create: () => {
    const parts: ModelPart[] = [...runningFrame(10.7, [-4.1, -2.7, 2.7, 4.1]), box("桥检车全长设备承台", [0, 1.17, 0], [2.5, .2, 10.5], transportColors.dark), ...cab([0, 1.28, -3.8], [2.3, 1.9, 2.2]), box("折臂反方向的实体配重", [-.58, 1.85, 1.3], [1.2, 1.15, 3.1], transportColors.body), cylinder("折臂中央回转座", [.55, 1.57, .7], [.85, .55, .85], transportColors.dark), strut("从回转座升起的主举升臂", [.55, 1.8, .7], [1.15, 4.85, .7], .34, transportColors.signal), strut("主举升臂下方液压驱动缸", [.25, 1.72, .7], [.96, 3.76, .7], .18, transportColors.dark), strut("跨过桥面外缘的水平上臂", [1.15, 4.85, .7], [4.95, 4.85, .7], .26, transportColors.signal), cylinder("上跨臂外端横向折叠销", [4.95, 4.85, .7], [.35, .6, .35], transportColors.dark, [90, 0, 0]), strut("桥缘外向下翻转的垂直工作臂", [4.95, 4.85, .7], [4.95, .6, .7], .23, transportColors.signal), strut("垂直臂到工作平台的向内伸缩臂", [4.95, .6, .7], [3.65, .6, .7], .18, transportColors.dark), box("悬在桥缘外侧的中空工作平台底板", [3.65, .38, .7], [2.2, .12, 1.8], transportColors.trim)];
    for (const side of [-1, 1]) {
      parts.push(strut("作业平台长侧上护栏", [2.6, 1.33, .7 + side * .86], [4.7, 1.33, .7 + side * .86], .035));
      for (const x of [2.6, 3.65, 4.7]) parts.push(strut("平台栏杆竖向连接", [x, .44, .7 + side * .86], [x, 1.33, .7 + side * .86], .035));
    }
    for (const x of [2.6, 4.7]) parts.push(strut("工作平台端部上护栏", [x, 1.33, -.16], [x, 1.33, 1.56], .035));
    parts.push(box("工作平台底板与伸缩臂的实际连接座", [3.65, .52, .7], [.27, .2, .27], transportColors.dark), part("主回转座至两级折臂的连续液压软管", "tube", transportColors.dark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { path: [{ x: .75, y: 1.8, z: .95 }, { x: 1.4, y: 4.75, z: .95 }, { x: 4.8, y: 4.75, z: .95 }, { x: 4.7, y: .7, z: .95 }, { x: 3.65, y: .65, z: .95 }], radius: .04 }));
    return parts;
  } },
  { name: "摩擦驱动双驾驶室矿用悬挂单轨机车", theme: "现代", tags: ["矿井悬挂运输", "工字梁下翼走行", "对夹摩擦驱动轮", "铰接动力节"], create: () => {
    const parts: ModelPart[] = [box("中央封闭柴油液压动力节", [0, 1.36, 0], [.9, 1.22, 3.4], transportColors.body), box("动力节下方独立燃油箱", [0, .6, .3], [.8, .35, 1.9], transportColors.dark), cylinder("动力节顶部冷却消声筒", [0, 2.09, .7], [.42, 1.35, .42], transportColors.dark, [90, 0, 0])];
    for (const end of [-1, 1]) {
      parts.push(box("前后独立低矮操作室底盘", [0, .36, end * 3.6], [1.05, .17, 1.9], transportColors.dark), box("前后操作室下围", [0, .72, end * 3.6], [1, .65, 1.8], transportColors.signal), box("前后操作室顶篷", [0, 1.99, end * 3.6], [1.1, .1, 1.95], transportColors.body), box("操作室内座垫", [0, .96, end * 3.5], [.52, .16, .48], transportColors.dark), box("操作室内座背", [0, 1.25, end * 3.32], [.52, .5, .08], transportColors.dark), box("操作室外端观察风挡", [0, 1.5, end * 4.52], [.9, .85, .03], transportColors.glass), strut("动力节与操作室之间可铰接牵引杆", [0, 1.9, end * 1.7], [0, 1.9, end * 2.68], .12), cylinder("节间牵引杆竖直转动销", [0, 1.9, end * 2.21], [.16, .22, .16], transportColors.trim));
      for (const side of [-1, 1]) parts.push(box("驾驶室透空窗间立柱", [side * .49, 1.51, end * 4.47], [.065, .89, .065], transportColors.dark), box("驾驶室后方承重立柱", [side * .49, 1.51, end * 2.73], [.065, .89, .065], transportColors.dark));
    }
    for (const z of [-3.6, -1.15, 1.15, 3.6]) {
      parts.push(box("工字梁下翼承重滚轮横架", [0, 2.36, z], [.72, .15, .47], transportColors.dark), box("走行横架吊接至车体的竖直承力板", [0, 2.11, z], [.16, .4, .25], transportColors.body));
      for (const side of [-1, 1]) parts.push(cylinder("工字梁下翼两侧承重钢轮", [side * .23, 2.49, z], [.28, .13, .28], transportColors.dark, [0, 0, 90]), cylinder("夹住轨梁立腹的水平摩擦驱动轮", [side * .2, 2.77, z], [.34, .2, .34], transportColors.dark), cylinder("外置摩擦轮液压驱动马达", [side * .2, 2.98, z], [.21, .28, .21], transportColors.body), strut("轮架固定驱动马达的外侧短支架", [side * .32, 2.36, z], [side * .32, 2.9, z], .07));
    }
    return parts;
  } },
  { name: "前置立式蒸汽动力合造铁路客车", tags: ["一体式蒸汽轨道客车", "立式锅炉动力室", "后部连续客室"], create: () => {
    const roof = archedRoof(2.7, 9.1, 3.34); roof.position.z = 1.3;
    const frontRoof = polygon("为烟囱保留真实穿越孔的动力室平顶", transportColors.body, [[-1.225, -6.08], [1.225, -6.08], [1.225, -3.28], [-1.225, -3.28]], .12, [0, 3.33, 0], [Array.from({ length: 12 }, (_, index) => { const angle = index * Math.PI / 6; return [-.28 + Math.cos(angle) * .18, -4.75 + Math.sin(angle) * .18]; })]);
    const parts: ModelPart[] = [...runningFrame(12.5, [-4.85, -3.35, 3.35, 4.85]), box("动力与客室共用连续底板", [0, 1.17, 0], [2.5, .2, 12.35], transportColors.dark), roof, cylinder("前置立式锅炉下部炉膛", [-.28, 1.66, -4.75], [1.15, .78, 1.15], transportColors.dark), cylinder("前置立式锅炉压力筒", [-.28, 2.61, -4.75], [1.1, 1.2, 1.1], transportColors.body), cylinder("立式锅炉顶端烟囱", [-.28, 3.57, -4.75], [.29, .79, .29], transportColors.dark), frontRoof, box("分隔动力室与乘客客室的实壁", [0, 2.3, -3.24], [2.5, 2.1, .1], transportColors.wood), cylinder("动力室侧置水箱", [.79, 1.87, -4.8], [.45, 1.2, .45], transportColors.body), box("后端客室下部封闭围板", [0, 1.64, 5.82], [2.5, .76, .09], transportColors.wood), part("后端客室透光风挡", "box", transportColors.glass, [0, 2.65, 5.82], [2.31, 1.2, .035], [0, 0, 0], { opacity: .48 })];
    for (const side of [-1, 1]) {
      parts.push(box("后部客室窗下长围板", [side * 1.23, 1.64, 1.28], [.09, .76, 9.05], transportColors.wood), box("客室窗上长过梁", [side * 1.23, 3.23, 1.28], [.1, .21, 9.05], transportColors.wood), part("客室连续通透侧窗带", "box", transportColors.glass, [side * 1.23, 2.58, 1.28], [.025, 1.14, 8.9], [0, 0, 0], { opacity: .46 }), box("动力室侧面低围板", [side * 1.18, 1.66, -4.68], [.09, .78, 2.72], transportColors.body), ...[-6.01, -3.35].map(z => box("动力室顶盖下方立柱", [side * 1.18, 2.66, z], [.08, 1.4, .09], transportColors.dark)), cylinder("车轴外侧卧式工作蒸汽缸", [side * 1.03, .88, -4.18], [.34, .7, .34], transportColors.body, [90, 0, 0]), strut("蒸汽缸活塞传动到前轴的连杆", [side * 1.02, .88, -4.6], [side * 1.02, .62, -4.85], .065, transportColors.trim), strut("前两根轴之间的联动连杆", [side * 1.02, .62, -4.85], [side * 1.02, .62, -3.35], .07, transportColors.trim));
      for (const z of [-3.19, -1.42, .35, 2.12, 3.89, 5.66]) parts.push(box("客室窗间木立框", [side * 1.23, 2.58, z], [.1, 1.2, .085], transportColors.wood));
      for (const z of [-4.85, -3.35]) parts.push(cylinder("前动力轴外侧曲柄销", [side * .97, .62, z], [.12, .22, .12], transportColors.trim, [0, 0, 90]));
    }
    for (const z of [-2, .1, 2.2, 4.3]) parts.push(box("客室内部横向座板", [0, 1.54, z], [1.95, .13, .45], transportColors.wood), box("客室横向座背", [0, 1.87, z + .22], [1.95, .6, .07], transportColors.wood));
    return parts;
  } },
];
