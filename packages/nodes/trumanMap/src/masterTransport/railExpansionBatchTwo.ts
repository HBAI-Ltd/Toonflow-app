import { part, ring, type ModelPart } from "../assetModelParts";
import { propeller } from "./aircraftModels";
import { box, cylinder, strut, transportColors, type TransportDefinition } from "./parts";

// 依据类别和承载方式制作原创静态构型，不复刻历史车辆的尺寸或厂商外观。
// https://collection.sciencemuseumgroup.org.uk/objects/co27065/brennans-gyroscopic-mono-rail-car
// https://collection.sciencemuseumgroup.org.uk/objects/co8103760/rail-transport-past-present-and-future-commemoration
// https://www.bertin-technologies.com/history-values/
// https://www.koei-m.co.jp/products.php
export const railExpansionBatchTwo: TransportDefinition[] = [
  { name: "双陀螺稳定式单轨试验车", tags: ["单线钢轨", "相反转向的双陀螺", "开放试验平台"], create: () => {
    const parts: ModelPart[] = [box("车体中央纵向承力脊梁", [0, .76, 0], [.38, .36, 10.5], transportColors.dark), box("全长木板试验车台", [0, 1.1, 0], [2.6, .15, 11.6], transportColors.wood), box("尾端试验动力机罩", [0, 1.55, 4.3], [1.05, .8, 1.45], transportColors.body), cylinder("动力罩顶部排气短筒", [.25, 2.08, 4.3], [.16, .35, .16], transportColors.dark), cylinder("前方司机制动手轮立杆", [0, 1.56, -4.75], [.07, .82, .07], transportColors.dark), ring("司机手轮轮缘", transportColors.dark, .24, .025, 1.99, .035, { rotation: { x: 20, y: 0, z: 0 }, position: { x: 0, y: 1.99, z: -4.75 } })];
    for (const z of [-4.2, 4.2]) {
      parts.push(part("单根轨面上的双轮缘钢制走行轮", "lathe", transportColors.dark, [0, .5, z], [1, 1, 1], [0, 0, 90], { profile: [{ x: .08, y: -.12 }, { x: .5, y: -.12 }, { x: .5, y: -.075 }, { x: .46, y: -.06 }, { x: .46, y: .06 }, { x: .5, y: .075 }, { x: .5, y: .12 }, { x: .08, y: .12 }, { x: .08, y: -.12 }] }), cylinder("单轨走行轮横向短轴", [0, .5, z], [.15, .7, .15], transportColors.trim, [0, 0, 90]), box("走行轮上方车台横承梁", [0, .96, z], [2.1, .25, .3], transportColors.dark));
      for (const side of [-1, 1]) parts.push(box("轮轴两侧轴承挂座", [side * .27, .7, z], [.15, .5, .32], transportColors.body));
    }
    for (const side of [-1, 1]) {
      parts.push(cylinder("相反转动的独立陀螺转子", [side * .65, 2, 1.6], [1.3, .36, 1.3], transportColors.trim, [0, 0, 90]), ring("转子外围万向承力环", transportColors.dark, .78, .055, 0, .08, { position: { x: side * .65, y: 2, z: 1.6 }, rotation: { x: 0, y: 0, z: 90 } }), cylinder("穿过转子中心的水平旋转短轴", [side * .65, 2, 1.6], [.1, .57, .1], transportColors.dark, [0, 0, 90]), cylinder("万向环下部进动轴承", [side * .65, 1.25, 1.6], [.13, .2, .13], transportColors.body), cylinder("万向环顶部进动轴承", [side * .65, 2.82, 1.6], [.13, .16, .13], transportColors.body), box("陀螺框架外侧立柱", [side * 1.13, 2.02, 1.6], [.12, 1.73, .16], transportColors.dark), strut("陀螺立架纵向抗摇斜撑", [side * 1.13, 1.18, 2.5], [side * 1.13, 2.82, 1.6], .08), box("车台外侧低围挡", [side * 1.25, 1.47, 0], [.1, .6, 10.7], transportColors.body), strut("车台外侧连续扶手", [side * 1.25, 2, -5.1], [side * 1.25, 2, 5.1], .045));
      for (const z of [-5.1, -2.5, 0, 2.5, 5.1]) parts.push(strut("扶手竖向固定杆", [side * 1.25, 1.18, z], [side * 1.25, 2, z], .04));
      parts.push(strut("离开轨面收起的应急防倾撑", [side * .25, .82, -3.15], [side * 1.5, .22, -3.15], .1), cylinder("防倾撑末端小滚轮", [side * 1.5, .2, -3.15], [.2, .1, .2], transportColors.dark, [0, 0, 90]));
    }
    parts.push(box("双陀螺万向环共同上承梁", [0, 2.91, 1.6], [2.38, .12, .18], transportColors.dark), strut("两只进动环之间的机械反向联杆", [-.65, 2.83, 1.6], [.65, 2.83, 1.6], .05, transportColors.trim));
    for (const z of [-3.6, -2, -.4]) {
      parts.push(box("车台横向试乘座板", [0, 1.58, z], [1.9, .12, .43], transportColors.wood), box("试乘座靠背", [0, 1.95, z + .23], [1.9, .66, .08], transportColors.wood));
      for (const side of [-1, 1]) parts.push(strut("试乘座前后连接支架", [side * .7, 1.18, z], [side * .7, 1.53, z], .065));
    }
    return parts;
  } },
  { name: "中央导向梁气垫轨道试验列车", theme: "现代", tags: ["气垫轨道交通", "底部承重气垫", "中央导向气垫", "背负喷气推进"], create: () => {
    const parts: ModelPart[] = [box("气垫车客室承载地板", [0, .64, 0], [2.35, .18, 10.2], transportColors.dark), box("客室连续轻质屋顶", [0, 2.42, -.1], [2.45, .12, 8.8], transportColors.body), box("前方斜面驾驶舱下围", [0, .97, -4.9], [2.2, .7, .85], transportColors.signal, [-14, 0, 0]), part("前方斜置通透驾驶风挡", "box", transportColors.glass, [0, 1.75, -4.78], [2.17, 1.3, .045], [-24, 0, 0], { opacity: .58 }), box("车尾下部封闭端壁", [0, 1.34, 5.02], [2.3, 1.25, .12], transportColors.body), box("车尾独立观察窗", [0, 2.04, 4.9], [1.5, .65, .05], transportColors.glass), part("车顶后段前后贯通喷气动力舱", "lathe", transportColors.dark, [0, 3.02, 3.05], [1, 1, 1], [90, 0, 0], { profile: [{ x: .48, y: -1.6 }, { x: .62, y: -1.3 }, { x: .62, y: .7 }, { x: .38, y: 1.48 }, { x: .33, y: 1.48 }, { x: .56, y: .68 }, { x: .56, y: -1.27 }, { x: .43, y: -1.6 }, { x: .48, y: -1.6 }] }), cylinder("动力舱内可见中心压气机轴毂", [0, 3.02, 1.85], [.2, .55, .2], transportColors.body, [90, 0, 0])];
    for (const side of [-1, 1]) {
      parts.push(box("客室窗下连续侧围", [side * 1.15, 1.05, 0], [.09, .7, 9.4], transportColors.body), box("客室窗上承载边梁", [side * 1.15, 2.29, -.1], [.09, .18, 8.8], transportColors.body), strut("背负动力舱承重斜撑", [side * .57, 2.47, 2.1], [side * .4, 2.7, 2.1], .15), strut("动力舱尾部承重斜撑", [side * .57, 2.47, 3.9], [side * .4, 2.7, 3.9], .15));
      for (let index = 0; index < 7; index++) parts.push(box("高侧窗之间实体框柱", [side * 1.15, 1.86, -4.05 + index * 1.35], [.09, .95, .075], transportColors.dark));
      for (let index = 0; index < 6; index++) parts.push(part("分立客室透光窗格", "box", transportColors.glass, [side * 1.15, 1.86, -3.375 + index * 1.35], [.03, .89, 1.25], [0, 0, 0], { opacity: .5 }));
      for (const z of [-3.1, 0, 3.1]) {
        parts.push(part("独立承重气垫的下开口薄壁围裙", "lathe", transportColors.dark, [side * .82, .04, z], [1, 1, 2.3], [0, 0, 0], { profile: [{ x: .38, y: 0 }, { x: .42, y: .07 }, { x: .37, y: .35 }, { x: .31, y: .42 }, { x: .28, y: .42 }, { x: .34, y: .34 }, { x: .38, y: .07 }, { x: .35, y: .02 }, { x: .38, y: 0 }] }), box("气垫上部连接车底的承重支盘", [side * .82, .5, z], [.58, .18, 1.32], transportColors.body), box("中央导向梁两侧的横向气垫", [side * .17, .28, z], [.1, .25, .7], transportColors.dark));
      }
    }
    for (const z of [-2.8, -.7, 1.4]) for (const side of [-1, 1]) parts.push(box("气垫车内部双列试乘座", [side * .64, 1.02, z], [.6, .25, .6], transportColors.trim), box("气垫车座背", [side * .64, 1.38, z + .27], [.6, .65, .1], transportColors.trim));
    for (let index = 0; index < 8; index++) { const angle = index * Math.PI / 4; parts.push(box("进气口内真实压气机叶片", [Math.cos(angle) * .31, 3.02 + Math.sin(angle) * .31, 1.78], [.47, .07, .035], transportColors.body, [18, 0, index * 45])); }
    return parts;
  } },
  { name: "双端螺旋桨悬挂轨道客车", tags: ["悬挂轨道", "前后螺旋桨推进", "上承重下导向", "流线客室"], create: () => {
    const parts: ModelPart[] = [box("悬挂客室连续底架", [0, .61, 0], [2.2, .22, 10.4], transportColors.dark), part("弧形薄壁客室屋盖", "extrude", transportColors.body, [0, 2.4, 0], [1, 1, 1], [0, 0, 0], { depth: 9.8, profile: [{ x: -1.15, y: 0 }, { x: -.95, y: .32 }, { x: -.48, y: .52 }, { x: .48, y: .52 }, { x: .95, y: .32 }, { x: 1.15, y: 0 }, { x: 1.05, y: -.035 }, { x: .87, y: .25 }, { x: .44, y: .43 }, { x: -.44, y: .43 }, { x: -.87, y: .25 }, { x: -1.05, y: -.035 }] })];
    for (const side of [-1, 1]) {
      parts.push(box("客车侧下围护板", [side * 1.08, 1.08, 0], [.1, .74, 10.05], transportColors.body), box("侧窗上部连续过梁", [side * 1.08, 2.36, 0], [.1, .16, 9.8], transportColors.body));
      for (let index = 0; index < 7; index++) parts.push(box("客车透窗框立柱", [side * 1.08, 1.87, -4.65 + index * 1.55], [.085, .98, .08], transportColors.dark));
      for (let index = 0; index < 6; index++) parts.push(part("独立通透侧窗", "box", transportColors.glass, [side * 1.08, 1.87, -3.875 + index * 1.55], [.035, .9, 1.45], [0, 0, 0], { opacity: .48 }));
    }
    for (const end of [-1, 1]) {
      parts.push(box("车端封闭低围", [0, 1.07, end * 5.1], [2.05, .74, .15], transportColors.body), part("车端透光观察窗", "box", transportColors.glass, [0, 1.91, end * 5.06], [1.98, .9, .045], [0, 0, 0], { opacity: .5 }), cylinder("独立螺旋桨推进电机", [0, 1.25, end * 5.75], [.5, 1.2, .5], transportColors.dark, [90, 0, 0]), ...propeller(0, 1.25, end * 6.42, 1.12));
      for (const side of [-1, 1]) parts.push(strut("推进电机接至车体端框的斜撑", [side * .7, .77, end * 4.8], [side * .2, 1.25, end * 5.75], .095));
    }
    for (const z of [-3.4, 3.4]) {
      parts.push(box("顶部承重轮组的贯通横架", [0, 3.4, z], [1.15, .2, .9], transportColors.dark), box("客室到上承重轮架的中央吊柱", [0, 3.12, z], [.26, .6, .28], transportColors.body), cylinder("承重轮组横向轮轴", [0, 3.72, z], [.11, 1.13, .11], transportColors.trim, [0, 0, 90]));
      for (const side of [-1, 1]) parts.push(cylinder("骑在上方双翼轨面的承重钢轮", [side * .38, 3.72, z], [.52, .16, .52], transportColors.dark, [0, 0, 90]), box("承重轮轴箱", [side * .56, 3.72, z], [.16, .25, .27], transportColors.body), strut("轴箱与横架的竖直吊接板", [side * .56, 3.4, z], [side * .56, 3.72, z], .1));
      parts.push(box("车底下导向短架", [0, .35, z], [.72, .35, .5], transportColors.dark));
      for (const side of [-1, 1]) parts.push(cylinder("下方导向轨两侧水平稳定滚轮", [side * .27, .22, z], [.3, .13, .3], transportColors.dark));
    }
    for (const z of [-2.9, -.1, 2.7]) parts.push(box("客室内成排横向座垫", [0, .99, z], [1.7, .15, .55], transportColors.trim), box("客室内座椅靠背", [0, 1.36, z + .26], [1.7, .6, .09], transportColors.trim));
    return parts;
  } },
  { name: "齿轨咬合式山地农业单轨运载车", theme: "现代", tags: ["山地单轨运输", "下置齿条啮合", "开放操作座与后载货平台"], create: () => {
    const parts: ModelPart[] = [box("跨在单根细钢轨上方的纵向主架", [0, .73, 0], [.45, .18, 3.7], transportColors.dark), box("前部小汽油机承座", [0, .9, -1.13], [.74, .16, .87], transportColors.body), cylinder("动力头竖直气缸体", [0, 1.15, -1.15], [.28, .36, .28], transportColors.dark), box("发动机上置燃油箱", [0, 1.46, -1.15], [.52, .24, .56], transportColors.signal), cylinder("前置发动机侧飞轮罩", [-.3, 1.15, -1.15], [.48, .15, .48], transportColors.body, [0, 0, 90]), cylinder("飞轮中央启动绳轴帽", [-.4, 1.15, -1.15], [.13, .06, .13], transportColors.dark, [0, 0, 90]), box("发动机向下传力的链轮箱", [.16, .71, -.95], [.23, .52, .53], transportColors.body), cylinder("贴近轨底齿条的驱动小齿轮", [0, .34, -.92], [.25, .15, .25], transportColors.trim, [0, 0, 90]), box("后方真实开放载货地板", [0, .91, 1.02], [1.22, .12, 1.55], transportColors.wood), box("独立操作座坐垫", [0, 1.15, -.08], [.56, .13, .46], transportColors.dark), box("独立操作座靠背", [0, 1.49, .16], [.56, .6, .09], transportColors.dark), cylinder("操作座下方承力立柱", [0, .97, -.08], [.13, .27, .13], transportColors.body), strut("驾驶员离合制动操作杆", [.3, .83, -.6], [.3, 1.52, -.4], .035), cylinder("操作杆顶端握柄", [.3, 1.56, -.4], [.07, .13, .07], transportColors.dark), box("驾驶员双脚承托踏台", [0, .84, -.52], [1.06, .1, .4], transportColors.dark)];
    for (const z of [-1.52, 1.43]) {
      parts.push(cylinder("单轨上表面承载滚轮", [0, .53, z], [.32, .18, .32], transportColors.dark, [0, 0, 90]), cylinder("轨底保持咬合的反压滚轮", [0, .18, z], [.24, .17, .24], transportColors.dark, [0, 0, 90]));
      for (const side of [-1, 1]) parts.push(box("上下滚轮共同侧挂板", [side * .18, .4, z], [.065, .58, .42], transportColors.body), cylinder("钢轨侧壁水平导向滚轮", [side * .15, .34, z + .22], [.15, .14, .15], transportColors.dark));
    }
    for (let index = 0; index < 10; index++) { const angle = index * Math.PI / 5; parts.push(box("下置驱动轮实质齿条啮合轮齿", [0, .34 + Math.cos(angle) * .143, -.92 + Math.sin(angle) * .143], [.15, .055, .045], transportColors.trim, [index * 36, 0, 0])); }
    for (const side of [-1, 1]) {
      parts.push(box("后载货平台矮侧栏", [side * .59, 1.14, 1.02], [.055, .42, 1.55], transportColors.body), strut("货台横向承重斜撑", [0, .7, 1.02], [side * .57, .86, 1.02], .065), strut("驾驶员两侧护身短杆", [side * .44, .85, -.33], [side * .44, 1.43, -.33], .035), strut("护身杆与座架连接", [side * .44, 1.43, -.33], [side * .24, 1.43, .1], .035));
    }
    parts.push(box("载货平台后端矮挡板", [0, 1.14, 1.77], [1.22, .42, .055], transportColors.body));
    return parts;
  } },
];
