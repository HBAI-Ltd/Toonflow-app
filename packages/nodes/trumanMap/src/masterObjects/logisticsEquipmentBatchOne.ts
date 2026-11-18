import { part, ring, type ModelPart, type Triple } from "../assetModelParts";
import { box, cylinder, loop, rod, cord, plate, piercedPanel, legs, material, type MasterPrototype } from "./parts";
import { openNeck, openTray } from "./culinaryExpansionBatchOne";
import { conveyor, frontShell } from "./culinaryExpansionBatchTwo";

export function rollerBed(name: string, position: Triple, width: number, length: number, count = 10): ModelPart[] {
  const [x, y, z] = position;
  return [...[-1, 1].map(side => box(`${name}纵向承载边梁`, [x + side * (width + .08) / 2, y - .055, z], [.08, .15, length + .1])), ...Array.from({ length: count }, (_, i) => cylinder(`${name}独立横向滚筒`, [x, y, z - length / 2 + i * length / (count - 1)], [.09, width, .09], material.steel, [0, 0, 90])), ...[-1, 1].map(side => rod(`${name}底部横向系杆`, [x - width / 2, y - .13, z + side * length * .4], [x + width / 2, y - .13, z + side * length * .4], .045))];
}

// 通用机构参考；均自制完整设备本体，不包含品牌模型、外链素材或预烘焙网格。
// https://www.lantech.com/r3/products/automatic-stretch-wrappers/
// https://www.beumergroup.com/industry/consumer-goods/packaging-for-safe-transport/
// https://www.kardex.com/en-us/products/megamat-vertical-carousels
// https://www.dematic.com/content/dam/dematic/downloads/whitepapers/NA_WP-1015_Sorting-Out-Sortation.pdf
export const logisticsEquipmentBatchOneObjects: MasterPrototype[] = [
  { name: "旋臂绕垛缠膜机", theme: "现代", itemType: "设施", build: () => [
    box("缠膜旋臂独立落地基板", [-1.27, .05, .7], [.72, .1, 1.16], material.dark), box("位于包件区外的固定高立柱", [-1.27, 1.7, .7], [.24, 3.3, .32], material.ivory), rod("立柱到中心回转机头的悬臂", [-1.27, 3.3, .7], [0, 3.3, 0], .19), cylinder("旋臂中心竖直回转驱动", [0, 3.38, 0], [.31, .3, .31], material.dark),
    rod("绕着静止包件旋转的水平主臂", [0, 3.2, 0], [1.18, 3.2, 0], .14), box("旋臂末端随动竖直膜架导柱", [1.18, 1.97, 0], [.1, 2.47, .14]), box("沿末端导柱升降的预拉伸膜车", [1.18, 1.28, -.16], [.34, .65, .37], material.dark), cylinder("预拉伸膜车上的原膜卷", [1.18, 1.28, -.33], [.23, .52, .23], material.glass),
    ...[-1, 1].map(side => cylinder("膜车内预拉伸导辊", [1.18 + side * .1, 1.28, -.43], [.045, .55, .045])), ...rollerBed("固定地面进出料辊床", [0, .26, 0], 1.36, 1.72, 9), ...legs(1.22, 1.4, .17, .055), box("立柱侧控制操作屏", [-1.1, 1.32, .51], [.19, .32, .07], material.dark),
  ] },
  { name: "水平圆环型材缠膜机", theme: "现代", itemType: "设施", build: () => [
    ...legs(1.55, .54, .63, .075), box("圆环两侧驱动承座底梁", [0, .68, 0], [1.87, .15, .73], material.dark), ring("真正贯通可穿长料的固定圆环框", material.ivory, .96, .08, 0, .16, { position: { x: 0, y: 1.55, z: 0 }, rotation: { x: 90, y: 0, z: 0 } }), ring("绕包物料回转的内置导轨圈", material.steel, .865, .025, 0, .055, { position: { x: 0, y: 1.55, z: -.1 }, rotation: { x: 90, y: 0, z: 0 } }),
    box("圆环侧移动膜卷小车", [.84, 1.55, -.15], [.16, .37, .22], material.dark), cylinder("跟着圆环公转的膜卷", [.89, 1.55, -.24], [.16, .42, .16], material.glass), ...rollerBed("圆环前端独立托料辊床", [0, .92, -.95], .67, 1.13, 7), ...rollerBed("圆环后端独立托料辊床", [0, .92, .95], .67, 1.13, 7),
    ...[-1, 1].flatMap(end => legs(.56, .83, .77, .04).map(value => ({ ...value, position: { ...value.position, z: value.position.z + end * .95 } }))), cylinder("底部摩擦驱动圆环的电机", [.64, .75, .2], [.24, .29, .24], material.dark, [90, 0, 0]),
  ] },
  { name: "四爪拉伸套膜机", theme: "现代", itemType: "设施", build: () => {
    const parts: ModelPart[] = [...legs(2.02, 1.61, 3.64, .13), ...[-1, 1].map(side => box("顶端联接两侧立柱的横梁", [0, 3.65, side * .805], [2.19, .15, .16])), ...[-1, 1].map(side => box("顶部纵向膜卷承载梁", [side * 1.01, 3.65, 0], [.15, .15, 1.77])), cylinder("上方折叠套膜放卷轴", [0, 3.93, .43], [.45, 1.92, .45], material.glass, [0, 0, 90]),
      ...[-1, 1].map(side => box("成袋切封热夹梁", [0, 3.48, side * .13], [1.6, .09, .11], material.dark)), ...rollerBed("托盘从机架内穿过的辊床", [0, .37, 0], 1.44, 2.2, 11), ...legs(1.26, 1.86, .27, .055)];
    for (const x of [-1, 1]) for (const z of [-1, 1]) parts.push(box("沿柱升降的套膜拉伸滑块", [x * .9, 1.9, z * .7], [.21, .28, .21], material.dark), rod("滑块伸向膜角的横向拉爪", [x * .9, 1.9, z * .7], [x * .69, 1.9, z * .53], .04), box("膜角向下伸入的抓膜手指", [x * .69, 1.78, z * .53], [.06, .26, .06]));
    parts.push(...[-1, 1].map(side => part("上部尚未下降的薄膜套侧面", "box", material.glass, [side * .69, 2.36, 0], [.004, 1.06, 1.06], [0, 0, 0], { opacity: .18 })));
    return parts;
  } },
  { name: "折盖胶带封箱机", theme: "现代", itemType: "设施", build: () => [
    ...legs(.79, 1.17, .64, .055), ...rollerBed("纸箱穿过的连续辊床", [0, .77, 0], .8, 1.65, 11), ...[-1, 1].map(side => box("夹持箱体两侧的侧送皮带盒", [side * .43, 1.02, 0], [.1, .37, .98], material.dark)), ...[-1, 1].map(side => rod("顶封胶带架升降立柱", [side * .53, .67, 0], [side * .53, 1.67, 0], .04)), rod("上胶带头的升降横梁", [-.53, 1.43, 0], [.53, 1.43, 0], .065),
    box("沿箱顶滚贴的上封胶带头", [0, 1.25, -.12], [.14, .25, .48], material.steel), cylinder("上胶带头原胶带环卷", [0, 1.53, -.03], [.28, .1, .28], material.ivory, [0, 0, 90]), ...[-1, 1].map(end => cylinder("压住胶带前后端的贴胶轮", [0, 1.13, -.12 + end * .19], [.09, .13, .09], material.dark, [0, 0, 90])),
    ...[-1, 1].map(side => plate("把箱顶长翼向内折下的导板", [side * .27, 1.26, .39], [[-.08, -.27], [.08, -.27], [.13, .28], [-.13, .28]], .008, material.steel, [-90, 0, side * 25])), box("辊床下独立贴封箱底的胶带头", [0, .57, -.12], [.15, .26, .43], material.dark),
  ] },
  { name: "纸箱内衬袋套装机", theme: "现代", itemType: "设施", build: () => {
    const parts: ModelPart[] = [...legs(1.1, .96, 2.55, .075), ...[-1, 1].map(side => rod("顶部膜卷承载横梁", [-.55, 2.55, side * .48], [.55, 2.55, side * .48], .07)), cylinder("上置内衬筒膜卷", [0, 2.77, .3], [.36, 1.07, .36], material.glass, [0, 0, 90]), ...rollerBed("纸箱在套袋头下面定位的辊床", [0, .67, 0], .82, 1.52, 9), ...legs(.68, 1.2, .54, .045),
      box("沿机架下降的开袋横架", [0, 1.97, 0], [.97, .075, .83]), ...[-1, 1].map(side => cylinder("真空拉开内衬袋两面的吸盘", [0, 1.81, side * .22], [.12, .035, .12], material.dark, [90, 0, 0])), ...[-1, 1].map(side => rod("开袋横架的垂直驱动活塞", [side * .39, 1.97, .34], [side * .39, 2.53, .34], .03))];
    for (const x of [-1, 1]) for (const z of [-1, 1]) parts.push(rod("向纸箱四角撑开的伸袋长指", [x * .3, 1.98, z * .26], [x * .3, 1.3, z * .26], .02), box("伸袋指外侧压住纸箱口的短爪", [x * .3, 1.29, z * .26], [.08, .025, .08]));
    return parts;
  } },
  { name: "夹载托盘翻转机", theme: "现代", itemType: "设施", build: () => {
    const parts: ModelPart[] = [plate("整体回转的开口C形夹载框", [0, .45, 0], [[-1, 0], [1, 0], [1, 2.1], [-1, 2.1], [-1, 1.9], [.75, 1.9], [.75, .2], [-1, .2]], 1.5, material.ivory, [0, -90, 0]), box("可下压夹紧托盘载荷的上压板", [0, 2.23, -.06], [1.37, .12, 1.66]), ...[-1, 1].map(side => cylinder("夹紧上压板的液压缸", [side * .48, 2.44, .7], [.12, .32, .12], material.dark))];
    for (const side of [-1, 1]) parts.push(...[-1, 1].map(end => rod("回转轴座的落地三角腿", [side * 1.14, 0, end * .61], [side * .98, 1.5, 0], .13)), cylinder("回转轴承外壳", [side * .98, 1.5, 0], [.34, .24, .34], material.dark, [0, 0, 90]), rod("回转轴承接到框侧的短轴", [side * .73, 1.5, 0], [side * 1.1, 1.5, 0], .1), ...[[1.5, .86], [.64, -.88], [2.36, -.88]].map(([y, z]) => rod("框侧连接耳轴的承力辐条", [side * .77, 1.5, 0], [side * .77, y!, z!], .08)));
    parts.push(box("回转驱动独立减速箱", [1.27, 1.5, 0], [.35, .47, .45], material.dark));
    return parts;
  } },
  { name: "底抽叉托盘拆垛机", theme: "现代", itemType: "设施", build: () => {
    const parts: ModelPart[] = [...legs(1.54, 1.34, 2.42, .09), ...[-1, 1].map(side => box("上部固定两侧框架的横梁", [0, 2.43, side * .67], [1.72, .1, .12])), ...rollerBed("空托盘从下方出垛的辊床", [0, .42, 0], 1.3, 1.79, 11), ...legs(1.16, 1.45, .3, .055),
      ...[-1, 1].map(side => box("承住上层托盘的侧向夹叉滑座", [side * .8, .99, 0], [.24, .22, 1.03], material.dark)), ...[-1, 1].map(side => cylinder("侧夹叉独立气动驱动缸", [side * 1.02, .99, 0], [.13, .35, .13], material.dark, [0, 0, 90]))];
    for (const side of [-1, 1]) for (const z of [-.43, .43]) parts.push(box("插入上层托盘孔的横向短叉", [side * .58, .97, z], [.45, .065, .12]), rod("侧框上下限位导向杆", [side * .77, .42, z], [side * .77, 2.3, z], .022));
    return parts;
  } },
  { name: "双柱伸叉巷道堆垛机", theme: "现代", itemType: "设施", build: () => [
    ...[-1, 1].map(side => box("机器沿巷道行走的独立地轨", [side * .8, .045, 0], [.065, .09, 6.8], material.dark)), box("双柱下部行走底架", [0, .42, 0], [1.91, .22, 1.13], material.ivory), ...[-1, 1].flatMap(side => [-1, 1].map(end => cylinder("地轨上有轮缘的行走钢轮", [side * .8, .25, end * .41], [.34, .11, .34], material.dark, [0, 0, 90]))),
    ...[-1, 1].map(side => box("高刚度双竖直立柱", [side * .65, 3.1, 0], [.19, 5.4, .24])), box("两立柱顶部横系梁", [0, 5.86, 0], [1.51, .17, .25]), box("沿两柱升降的载货台", [0, 2.62, 0], [1.58, .16, 1.02], material.dark), ...[-1, 1].map(side => box("升降台抱住立柱的导向座", [side * .65, 2.75, 0], [.3, .39, .37], material.dark)),
    ...[-1, 1].map(side => box("向侧方货位伸出的套叠叉臂", [.6, 2.75, side * .32], [1.9, .09, .13])), ...[-1, 1].map(side => rod("顶端升降链条的可见受拉段", [side * .65, 2.92, .15], [side * .65, 5.8, .15], .016, material.dark)), cylinder("顶部载货提升卷轮", [0, 5.98, 0], [.27, .47, .27], material.dark, [0, 0, 90]), box("下架行走驱动电机", [0, .67, .36], [.34, .3, .37], material.dark),
  ] },
  { name: "链环垂直回转货柜", theme: "现代", itemType: "设施", build: () => {
    const parts: ModelPart[] = [...frontShell("可见内部悬篮的高位回转柜", [0, 0, 0], 2.24, 4.75, 1.45, material.ivory), ...[-1, 1].map(side => cord("绕上下转轮闭合的侧链轨", [[side * .96, .78, -.45], [side * .96, 4.02, -.45], [side * .96, 4.45, 0], [side * .96, 4.02, .45], [side * .96, .78, .45], [side * .96, .35, 0], [side * .96, .78, -.45]], .022, material.dark)),
      ...[-1, 1].flatMap(side => [.78, 4.02].map(y => cylinder("两端上下链轨回转导轮", [side * .96, y, 0], [.87, .08, .87], material.dark, [0, 0, 90]))), box("柜前低位取放工作台", [0, .78, -.91], [1.88, .075, .52]), box("侧面回转驱动柜", [1.28, .77, .21], [.35, .66, .62], material.dark)];
    for (const z of [-.45, .45]) for (const y of [.9, 2.4, 3.9]) parts.push(...openTray("保持水平的独立悬挂货篮", [0, y, z], 1.78, .48, .13), ...[-1, 1].map(side => rod("货篮端部自由回转悬臂", [side * .89, y, z], [side * .96, y + .27, z], .018)));
    return parts;
  } },
  { name: "弧线锥辊输送机", theme: "现代", itemType: "设施", build: () => {
    const parts: ModelPart[] = [...[.8, 1.6].map(radius => cord("沿四分之一圆弧连续承辊边梁", Array.from({ length: 13 }, (_, i): Triple => [Math.cos(i * Math.PI / 24) * radius, .76, Math.sin(i * Math.PI / 24) * radius]), .05)), ...[0, Math.PI / 2].flatMap(a => [.8, 1.6].map(radius => rod("弧形输送床端部落地脚", [Math.cos(a) * radius, 0, Math.sin(a) * radius], [Math.cos(a) * radius, .76, Math.sin(a) * radius], .06)))];
    for (let i = 0; i < 13; i++) { const a = i * Math.PI / 24, value: ModelPart = rod("由内径向外逐渐变粗的输送锥辊", [Math.cos(a) * .8, .85, Math.sin(a) * .8], [Math.cos(a) * 1.6, .85, Math.sin(a) * 1.6], .1); value.shape = "lathe"; value.scale = { x: 1, y: 1, z: 1 }; value.profile = [{ x: 0, y: -.4 }, { x: .045, y: -.4 }, { x: .09, y: .4 }, { x: 0, y: .4 }]; parts.push(value); }
    parts.push(box("外圆侧独立链驱动电机", [1.18, .59, 1.18], [.3, .3, .36], material.dark));
    return parts;
  } },
  { name: "铰链板链输送机", theme: "现代", itemType: "设施", build: () => {
    const parts: ModelPart[] = [...legs(.87, 1.94, .68, .055), ...[-1, 1].map(side => box("板链纵向承载主梁", [side * .49, .72, 0], [.08, .23, 2.75])), ...[-1, 1].map(end => cylinder("板链端部横向回转链轮轴", [0, .77, end * 1.31], [.22, 1.05, .22], material.dark, [0, 0, 90])), ...[-1, 1].map(side => rod("板链下方返程导轨", [side * .35, .54, -1.3], [side * .35, .54, 1.3], .025)), box("板链尾部侧驱动头", [.65, .67, 1.18], [.25, .28, .36], material.dark)];
    for (let i = 0; i < 20; i++) parts.push(box("独立铰接的上行耐载链板", [0, .89, -1.3 + i * 2.6 / 19], [.93, .025, .12]), cylinder("相邻链板之间的贯通铰销", [0, .875, -1.3 + i * 2.6 / 19], [.018, 1, .018], material.dark, [0, 0, 90]));
    return parts;
  } },
  { name: "刮板链槽输送机", theme: "现代", itemType: "设施", build: () => {
    const parts: ModelPart[] = [...legs(.64, 2.35, .51, .05), ...openTray("连续密实槽底的刮板运输长槽", [0, .52, 0], .84, 2.94, .32), ...[-1, 1].map(side => rod("牵引刮板两边的连续链段", [side * .27, .61, -1.42], [side * .27, .61, 1.42], .018, material.dark)), ...[-1, 1].map(end => cylinder("槽首尾回转驱动链轮轴", [0, .64, end * 1.4], [.19, .73, .19], material.dark, [0, 0, 90])), box("槽首外侧独立减速电机", [.59, .64, 1.31], [.32, .33, .41], material.dark),
      ...openTray("高位进料斗的开放料口", [0, .85, 1.12], .81, .57, .26), ...openTray("前端卸料开口滑道", [0, .4, -1.59], .76, .39, .08)];
    for (let i = 0; i < 13; i++) parts.push(box("横贯槽内低位刮送的独立链刮板", [0, .66, -1.31 + i * .22], [.67, .15, .025]));
    return parts;
  } },
  { name: "盘片管链输送机", theme: "现代", itemType: "设施", build: () => {
    const parts: ModelPart[] = [...legs(1.19, .51, .42, .05), cord("管链绕过顶端并返回下端的外壳", [[-.63, 2.57, 0], [-.63, 2.78, 0], [-.38, 3.02, 0], [.63, 3.02, 0], [.63, 1.14, 0], [.4, .92, 0], [-.38, .92, 0], [-.63, .56, 0]], .09), openNeck("观察管下端的贯通金属套管", [-.63, .56, 0], .09, .57, .012), { ...openNeck("能够看见链盘的透明检视管段", [-.63, 1.12, 0], .09, 1.46, .006, material.glass), opacity: .22 }, rod("观察管内部连接各盘的牵引链", [-.63, .57, 0], [-.63, 2.79, 0], .012, material.dark), cylinder("闭环上方驱动链轮箱", [.63, 2.78, 0], [.4, .27, .4], material.dark, [90, 0, 0]), box("管链支承立柱", [.34, 1.67, .18], [.1, 2.72, .12]),
      part("下口连通管路的敞口受料漏斗", "lathe", material.steel, [-.63, .65, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: .08, y: 0 }, { x: .21, y: .31 }, { x: .198, y: .31 }, { x: .068, y: 0 }, { x: .08, y: 0 }] }), openNeck("从上段管路排出的贯通落料口", [.25, 2.73, 0], .075, .28, .012)];
    for (let i = 0; i < 7; i++) parts.push(cylinder("从管路观察段可见的链盘", [-.63, .92 + i * .24, 0], [.14, .02, .14], material.ivory));
    return parts;
  } },
  { name: "波状挡边垂直带机", theme: "现代", itemType: "设施", build: () => {
    const parts: ModelPart[] = [...legs(.67, 1.47, .39, .055), ...[-1, 1].map(side => box("垂直段两侧长立架", [side * .39, 1.93, .1], [.09, 3.39, .16])), box("从地面供料转向竖直的下带段", [0, .51, -.58], [.65, .025, 1.22], material.dark), box("向上运输的连续竖直带段", [0, 1.98, .02], [.65, 2.9, .025], material.dark), box("顶部向前卸料的水平带段", [0, 3.44, .54], [.65, .025, 1.04], material.dark),
      ...[-1, 1].map(end => cylinder("改变竖直带走向的公共横辊", [0, end < 0 ? .52 : 3.42, .02], [.2, .81, .2], material.steel, [0, 0, 90])), box("机头回转驱动电机", [.6, 3.42, .02], [.28, .33, .36], material.dark), ...openTray("高位卸料承接口", [0, 3.28, 1.13], .76, .36, .09)];
    for (let i = 0; i < 14; i++) parts.push(box("竖直带横向承料隔板", [0, .62 + i * .2, -.06], [.61, .04, .17], material.steel), ...[-1, 1].map(side => box("随隔板折起的侧挡边", [side * .3, .69 + i * .2, -.06], [.02, .16, .18], material.dark)));
    return parts;
  } },
  { name: "步进梁长件输送机", theme: "现代", itemType: "设施", build: () => {
    const parts: ModelPart[] = [...legs(1.26, 2.2, .58, .065), ...[-1, 1].map(side => box("长件固定承载槽梁", [side * .63, .83, 0], [.1, .19, 3.1])), ...[-1, 1].map(side => box("能够升起前移的中间步进梁", [side * .28, .86, -.12], [.095, .18, 2.92], material.dark)), ...[-1, 1].map(end => rod("中部两梁共同抬升的横向连杆", [-.37, .68, end * .94], [.37, .68, end * .94], .055)), ...[-1, 1].map(end => cylinder("两端偏心抬升转轴", [0, .55, end * .94], [.21, 1.26, .21], material.steel, [0, 0, 90])), box("一侧步进驱动减速机", [.83, .56, .94], [.29, .34, .37], material.dark)];
    for (const side of [-1, 1]) for (let i = 0; i < 7; i++) parts.push(plate("固定槽梁上真实V形承长件挡块", [side * .63 - .06, .91, -.24 + (i - 3) * .4], [[-.08, 0], [.08, 0], [.08, .12], [0, .055], [-.08, .12]], .12, material.steel, [0, 90, 0]));
    return parts;
  } },
  { name: "振动槽给料机", theme: "现代", itemType: "设施", build: () => [
    ...legs(.71, 1.27, .53, .055), ...openTray("能够独立振动的厚壁给料长槽", [0, .84, 0], .94, 1.83, .27), ...[-1, 1].map(side => box("固定承重底架纵梁", [side * .4, .55, 0], [.1, .13, 1.6])), ...[-1, 1].flatMap(side => [-1, 1].map(end => ({ ...cord("给料槽独立减振螺旋弹簧", Array.from({ length: 17 }, (_, i): Triple => [Math.cos(i * Math.PI / 2) * .04, .61 + i * .013, Math.sin(i * Math.PI / 2) * .04]), .009, material.dark), position: { x: side * .36, y: 0, z: end * .65 } }))),
    ...[-1, 1].map(side => cylinder("槽底成对反向偏心振动电机", [side * .2, .76, .1], [.22, .33, .22], material.dark, [90, 0, 0])), ...openTray("高位受料缓冲口", [0, 1.11, .68], .91, .49, .34), ...openTray("低端准确向前送出的给料唇", [0, .83, -1.02], .88, .28, .055),
  ] },
  { name: "滑块侧推分拣机", theme: "现代", itemType: "设施", build: () => {
    const parts: ModelPart[] = [...legs(.87, 2.39, .61, .055), ...[-1, 1].map(side => box("长滑块分拣床承载侧梁", [side * .5, .73, 0], [.09, .26, 3.24])), ...[-1, 1].map(end => cylinder("主输送链板端部回转轴", [0, .77, end * 1.52], [.19, 1.07, .19], material.dark, [0, 0, 90])), ...[-1, 1].map(side => rod("床下决定滑块横移的斜导轨", [side * .42, .62, .95], [-side * .42, .62, -.85], .025)), ...openTray("侧推后包件落出的左分流槽", [-.87, .65, -.53], .66, .72, .09), ...openTray("侧推后包件落出的右分流槽", [.87, .65, .58], .66, .72, .09)];
    for (let i = 0; i < 20; i++) parts.push(box("输送包件的独立横向承重板", [0, .89, -1.48 + i * 2.96 / 19], [.93, .025, .13]), box("沿横向板滑动的独立推鞋", [Math.max(-.34, Math.min(.34, (i - 10) * .052)), .94, -1.48 + i * 2.96 / 19], [.13, .08, .12], material.dark));
    parts.push(box("分拣链驱动电机", [.69, .71, 1.36], [.27, .34, .41], material.dark));
    return parts;
  } },
  { name: "直线翻盘包件分拣机", theme: "现代", itemType: "设施", build: () => {
    const parts: ModelPart[] = [...legs(.67, 2.5, .79, .055), ...[-1, 1].map(side => rod("翻盘小车直线行走长轨", [side * .35, .84, -1.7], [side * .35, .84, 1.7], .04)), ...[-1, 1].flatMap(side => [-.9, .9].flatMap(z => openTray("翻盘对应的独立侧卸料口", [side * .89, .63, z], .73, .59, .1))), box("小车列尾端牵引驱动箱", [0, .69, 1.8], [.65, .41, .29], material.dark)];
    for (let i = 0; i < 6; i++) { const z = -1.4 + i * .56, angle = i === 2 ? -28 : i === 4 ? 28 : 0; parts.push(box("跟着双轨行走的独立翻盘车架", [0, .89, z], [.71, .09, .43], material.dark), rod("翻盘沿车身纵向转动的铰轴", [0, .99, z - .2], [0, .99, z + .2], .024), box("可向左右倾卸的载件托盘", [0, 1.01, z], [.91, .025, .47], material.steel, [0, 0, angle]), ...[-1, 1].map(side => rod("车架底部导向轮轴", [side * .35, .84, z - .15], [side * .35, .84, z + .15], .018))); }
    return parts;
  } },
  { name: "窄带顶升移载台", theme: "现代", itemType: "设施", build: () => {
    const parts: ModelPart[] = [...legs(.91, .87, .64, .055), ...rollerBed("平面常态直通的主滚筒床", [0, .79, 0], .96, 1.14, 9), box("滚筒下面的独立顶升横架", [0, .57, 0], [.89, .09, 1.04], material.dark), ...[-1, 1].map(side => cylinder("顶升窄带模组的气缸", [side * .32, .56, 0], [.09, .26, .09], material.dark))];
    for (let i = 0; i < 4; i++) { const z = -.49875 + i * .285; parts.push(box("升出辊缝并横向送件的窄带", [0, .855, z], [1.07, .014, .05], material.dark), ...[-1, 1].map(side => cylinder("窄带两端独立回转小轮", [side * .52, .82, z], [.065, .055, .065], material.steel, [90, 0, 0])), box("每条横向窄带的下部承架", [0, .73, z], [1.1, .06, .055])); }
    parts.push(box("横向窄带独立同步驱动头", [.67, .69, .29], [.24, .27, .31], material.dark));
    return parts;
  } },
  { name: "万向球移载台", theme: "现代", itemType: "设施", build: () => {
    const parts: ModelPart[] = [...legs(1.09, .94, .77, .055), box("承载万向滚珠的平面厚台板", [0, .81, 0], [1.29, .065, 1.14]), ...[-1, 1].map(side => box("桌下长向承载加强筋", [side * .42, .72, 0], [.06, .15, 1.06])), ...[-1, 1].map(side => rod("四脚间下层稳固横撑", [-.545, .26, side * .47], [.545, .26, side * .47], .035))];
    const vertices = [{ x: 0, y: .5, z: 0 }], indices: number[] = [];
    // ACT: 52毫米承重球以同一8×6经纬球壳复用geometry，保留真正球面和两极；不改变公共球体精度。
    for (let latitude = 1; latitude < 6; latitude++) for (let longitude = 0; longitude < 8; longitude++) { const a = longitude * Math.PI / 4, b = latitude * Math.PI / 6; vertices.push({ x: Math.sin(b) * Math.cos(a) * .5, y: Math.cos(b) * .5, z: Math.sin(b) * Math.sin(a) * .5 }); }
    vertices.push({ x: 0, y: -.5, z: 0 });
    for (let i = 0; i < 8; i++) { const next = (i + 1) % 8; indices.push(0, 1 + next, 1 + i, 33 + i, 33 + next, 41); for (let row = 0; row < 4; row++) { const a = 1 + row * 8 + i, b = 1 + row * 8 + next; indices.push(a, b, a + 8, b, b + 8, a + 8); } }
    const steelBall = part("凸出台面可任意滚动的承重钢球", "mesh", material.steel, [0, .873, 0], [.052, .052, .052], [0, 0, 0], { vertices, indices });
    for (let i = 0; i < 30; i++) { const x = (i % 6 - 2.5) * .21, z = (Math.floor(i / 6) - 2) * .21; parts.push(ring("托住单个钢球的凹座环", material.dark, .037, .014, .856, .025, { position: { x, y: .856, z } }), { ...steelBall, position: { x, y: .873, z } }); }
    return parts;
  } },
  { name: "辊床回转移载台", theme: "现代", itemType: "设施", build: () => [
    cylinder("固定回转台落地基础", [0, .11, 0], [1.59, .22, 1.59], material.dark), ring("上下台之间的中空回转支承", material.steel, .57, .1, .28, .14), cylinder("回转支承上整幅旋转平台", [0, .4, 0], [1.38, .1, 1.38]), ...rollerBed("在旋转平台上承送包件的辊床", [0, .64, 0], 1.14, 1.31, 10),
    ...[-1, 1].map(side => rod("辊床向下连接转台的支承脚", [side * .48, .45, -.45], [side * .48, .57, -.45], .05)), ...[-1, 1].map(side => rod("另一端辊床转台支承脚", [side * .48, .45, .45], [side * .48, .57, .45], .05)), box("固定台侧回转驱动减速机", [.86, .29, .1], [.31, .31, .41], material.dark),
  ] },
  { name: "L框封切热缩联机", theme: "现代", itemType: "设施", build: () => [
    ...legs(1.01, 2.49, .72, .06).map(value => ({ ...value, position: { ...value.position, z: value.position.z + .5 } })), ...[-1, 1].map(side => box("把落地脚接到运带边梁的底架", [side * .505, .81, .5], [.065, .18, 2.57])), ...conveyor("穿过封切与热缩两工位的连续承运带", [0, .91, .5], .97, 3.25), box("封切工位后端铰架", [0, .98, -.02], [1.13, .11, .1]), rod("L封切架后端真实公共转轴", [-.55, 1, -.02], [.55, 1, -.02], .035),
    box("抬起的L框右侧纵向封切梁", [.49, 1.187, -.484], [.055, .07, 1], material.dark, [22, 0, 0]), box("抬起的L框前端横向封切梁", [0, 1.374, -.947], [1.03, .07, .055], material.dark), box("贴在纵梁下面的细长热封刀", [.49, 1.153, -.484], [.012, .008, .97], material.red, [22, 0, 0]), box("贴在横梁下面的横向热封刀", [0, 1.339, -.947], [.97, .008, .012], material.red),
    rod("升起L框右侧封切纵梁的气缸", [.49, .72, -.18], [.49, 1.29, -.72], .027), box("固定纵向热封下砧", [.49, .95, -.49], [.025, .026, .99]), box("固定横向热封下砧", [0, .95, -.98], [1.01, .026, .025]),
    cylinder("封切台右侧对折薄膜原卷", [.89, .82, -.49], [.41, 1, .41], material.glass, [90, 0, 0]), ...[-1, 1].map(end => rod("膜卷两端落地支承柱", [.89, 0, -.49 + end * .46], [.89, .82, -.49 + end * .46], .045)), { ...box("铺在L刀内侧的上包覆薄膜", [0, .94, -.51], [.94, .003, .91], material.glass), opacity: .2 },
    ...[-1, 1].map(side => box("热缩隧道两侧保温罩", [side * .56, 1.2, 1.12], [.1, .65, 1.42], material.ivory)), box("热缩隧道顶部保温罩", [0, 1.55, 1.12], [1.22, .1, 1.42], material.ivory), cylinder("隧道顶部循环热风机", [0, 1.72, 1.12], [.39, .25, .39], material.dark),
    ...[-1, 1].flatMap(end => Array.from({ length: 6 }, (_, i) => box("悬在真实贯通出入口的独立挡热软帘", [(i - 2.5) * .157, 1.22, 1.12 + end * .72], [.145, .56, .008], material.dark))), box("隧道侧面独立温控电箱", [.75, 1.02, 1.3], [.27, .43, .36], material.dark),
  ] },
  { name: "充气门封装卸罩", theme: "现代", itemType: "设施", build: () => [
    ...[-1, 1].map(side => box("装卸口两边固定门封背架", [side * 1.34, 1.63, .29], [.23, 3.26, .25], material.steel)), box("门封上部固定连接横架", [0, 3.37, .29], [2.91, .24, .25]), ...[-1, 1].map(side => box("门封前端防雨侧罩", [side * 1.34, 1.63, -.18], [.26, 3.26, .74], material.dark)), box("整幅上部防雨平檐", [0, 3.4, -.18], [3, .17, .81], material.dark),
    ...[-1, 1].map(side => part("向车身两侧膨起的软质门封气囊", "capsule", material.ivory, [side * 1.08, 1.6, -.39], [.68, 2.97, .84])), part("向车厢顶部下压的横向气囊", "capsule", material.ivory, [0, 3.1, -.39], [.78, 2.25, .9], [0, 0, 90]),
    box("上方独立低压供气风机箱", [1.51, 3.29, .2], [.35, .31, .36], material.steel), cord("风机接入门封横气囊的软管", [[1.5, 3.29, .2], [1.42, 3.51, -.08], [.86, 3.51, -.2], [.86, 3.14, -.39]], .035, material.dark), ...[-1, 1].map(side => box("地面防止车身撞坏门封的胶垫", [side * 1.13, .24, -.55], [.27, .48, .23], material.dark)),
  ] },
  { name: "真空提升管助力吊", theme: "现代", itemType: "设施", build: () => {
    const parts: ModelPart[] = [cylinder("助力吊立柱稳固落地圆座", [0, .045, 0], [.73, .09, .73], material.dark), cylinder("自由回转立柱", [0, 1.68, 0], [.16, 3.27, .16]), rod("顶部可回转的水平悬臂轨", [0, 3.06, 0], [2.28, 3.06, 0], .12), rod("悬臂的承重上拉斜杆", [0, 3.3, 0], [1.9, 3.06, 0], .035), box("悬臂末端沿轨滚动的吊车", [1.78, 3.04, 0], [.29, .2, .25], material.dark),
      openNeck("随负压伸缩的中空提升软管", [1.78, 1.06, 0], .073, 1.89, .014, material.dark), box("软管下端操纵阀头", [1.78, 1.02, 0], [.21, .14, .2], material.dark), ...[-1, 1].map(side => rod("操纵阀左右持握手柄", [1.78 + side * .08, 1.02, 0], [1.78 + side * .3, 1.02, 0], .025)),
      part("底面真正敞开的真空吸脚", "lathe", material.dark, [1.78, .79, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: .19, y: 0 }, { x: .075, y: .15 }, { x: .06, y: .15 }, { x: .17, y: 0 }, { x: .19, y: 0 }] }), openNeck("吸脚接向操纵阀的贯通短颈", [1.78, .93, 0], .07, .04, .01, material.dark), cylinder("立柱侧独立真空抽吸风机", [-.34, .23, .2], [.31, .37, .31], material.dark, [90, 0, 0]), cord("真空风机接向吊管顶端的供气软管", [[-.34, .23, .2], [-.3, 2.91, .2], [.9, 3.23, .1], [1.78, 3.1, 0]], .028)];
    for (let i = 0; i < 17; i++) parts.push(loop("提升软管外部连续加强环", [1.78, 1.13 + i * .105, 0], .078, .009, [0, 0, 0], material.dark));
    return parts;
  } },
  { name: "自动割包倒料破袋机", theme: "现代", itemType: "设施", build: () => {
    const parts: ModelPart[] = [...legs(.87, .92, .64, .055), ...[-1, 1].map(side => box("割包除尘舱左右侧板", [side * .54, 1.23, .16], [.03, 1.16, 1.2])), box("割包除尘舱顶部密封板", [0, 1.795, .16], [1.11, .03, 1.2]), piercedPanel("让散料穿过的大开口舱底", [0, .65, .16], [[-.555, -.6], [.555, -.6], [.555, .6], [-.555, .6]], [[[-.43, -.43], [.43, -.43], [.43, .43], [-.43, .43]]], .03), piercedPanel("留空袋通道的后部防尘板", [0, .65, .76], [[-.555, 0], [.555, 0], [.555, 1.16], [-.555, 1.16]], [[[-.35, .31], [.35, .31], [.35, .63], [-.35, .63]]], .03, material.steel, [-90, 0, 0]), ...conveyor("把整袋散料送进切袋腔的输入带", [0, .97, -.91], .75, 1.14), ...[-1, 1].map(side => rod("输入带前端支承腿", [side * .34, 0, -1.36], [side * .34, .87, -1.36], .045)),
      cylinder("袋底开长口的回转切割刀轴", [0, 1.08, -.17], [.035, .89, .035], material.steel, [0, 0, 90]), ...[-1, 1].map(side => cylinder("从袋底切开开口的薄圆刀", [side * .24, 1.08, -.17], [.24, .003, .24], material.steel, [0, 0, 90])), ...openTray("主机下方接收散料的落料槽", [0, .41, .16], 1.02, 1.11, .16),
      box("后部空袋独立挤出压辊箱", [0, 1.02, .91], [.69, .45, .29], material.dark), ...[-1, 1].map(side => cylinder("夹出空袋的成对回收胶辊", [0, 1.02 + side * .065, .91], [.11, .61, .11], material.dark, [0, 0, 90])), ...openTray("空袋单独落出的后部接袋槽", [0, .73, 1.18], .7, .35, .1), openNeck("舱顶防扬尘抽吸口", [.31, 1.81, .36], .08, .21, .012)];
    return parts;
  } },
];
