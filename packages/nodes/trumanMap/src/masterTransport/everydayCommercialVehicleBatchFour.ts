import { beam, type ModelPart } from "../assetModelParts";
import { rod } from "../masterObjects/parts";
import { box, cylinder, strut, transportColors, wheel, type TransportDefinition } from "./parts";

function trailerAxles(width: number, radius: number, axlePositions: number[], frameY: number): ModelPart[] {
  const parts: ModelPart[] = [];
  for (const z of axlePositions) {
    parts.push(cylinder("半挂车后部两侧车轮间的真实贯通车桥", [0, radius, z], [.12, width - .1, .12], transportColors.dark, [0, 0, 90]));
    for (const side of [-1, 1]) {
      const lower = radius + .23, upper = frameY - .13;
      parts.push(...wheel([side * (width / 2 - .2), radius, z], radius, .28), box("从轮桥实际承力而非悬空贴梁的短悬架", [side * .76, radius + .14, z], [.22, .18, .85], transportColors.dark), box("悬架接入半挂底纵梁的独立吊承座", [side * .76, (lower + upper) / 2, z], [.22, upper - lower + .1, .35], transportColors.dark));
    }
  }
  return parts;
}

function parkingGear(frameY: number, z: number, kingpinZ: number): ModelPart[] {
  const parts: ModelPart[] = [box("供牵引车第五轮承托的独立前部滑板", [0, 1.2, kingpinZ], [1.65, .12, 1.5], transportColors.dark), cylinder("从前滑板向下伸出的半挂牵引主销", [0, 1.02, kingpinZ], [.11, .3, .11], transportColors.trim)];
  for (const side of [-1, 1]) parts.push(box("从主纵梁向侧面伸出的驻车支腿固定座", [side * .86, frameY, z], [.35, .22, .35], transportColors.dark), box("实际接入支腿固定座的外方管", [side * .86, frameY - .21, z], [.23, .5, .23], transportColors.body), box("从外管伸到地面脚掌的可调内方腿", [side * .86, (frameY - .21) / 2, z], [.16, frameY - .21, .16], transportColors.dark), box("下表面真正落地的半挂驻车脚掌", [side * .86, .05, z], [.45, .1, .5], transportColors.dark));
  parts.push(cylinder("实际贯通左右驻车腿的同步升降轴", [0, frameY - .21, z], [.06, 2.05, .06], transportColors.trim, [0, 0, 90]), strut("支腿同步轴外侧的手摇曲柄", [1.02, frameY - .21, z], [1.14, frameY - .43, z], .035, transportColors.dark));
  return parts;
}

function trailerRear(width: number, y: number, z: number): ModelPart[] {
  const parts: ModelPart[] = [box("半挂后部灯组实际固定的横向承梁", [0, y, z], [width, .3, .16], transportColors.dark), box("由两侧后梁承托的低位防钻入横杆", [0, .48, z], [width, .15, .13], transportColors.dark)];
  for (const side of [-1, 1]) parts.push(box("半挂后部独立制动灯与转向灯壳", [side * width * .35, y, z + .095], [.35, .18, .04], "#b96953"), strut("防钻横杆与后承梁之间的实际竖向吊杆", [side * .8, .48, z], [side * .8, y, z], .1, transportColors.dark));
  return parts;
}

// 仅制作独立拖厢，现有公路半挂牵引头可按场景组合；不连入占数的载荷车辆或牵引头副本。
// https://www.cargobull.com/en/-/media/project/scb-sites/scb-global-site/scb-global-images/betriebsanleitungen-ski/en_1465114_ski-man-de2gb-10370-3521.pdf
// https://www.goldhofer.com/en/semitrailers
// https://www.lohr.fr/automotive-en/
export const everydayCommercialVehicleBatchFour: TransportDefinition[] = [
  { name: "带主销驻车支腿封闭长货厢半挂汽车拖车", theme: "现代", tags: ["汽车", "影视", "生活常见", "封闭半挂货厢", "独立完整半挂车", "主销与落地支腿", "非牵引头换载荷"], create: () => {
    const parts: ModelPart[] = [...trailerAxles(2.5, .48, [3.1, 4.35, 5.6], 1.1), ...parkingGear(1.1, -3.8, -5.5), box("封闭半挂厢完整货舱地板", [0, 1.28, 0], [2.46, .14, 13.6], transportColors.dark), box("与两侧侧板共同形成真正封闭货舱的顶板", [0, 3.99, 0], [2.5, .1, 13.6], transportColors.trim), box("封闭半挂货厢前方独立承压端板", [0, 2.65, -6.77], [2.48, 2.6, .1], transportColors.trim), ...trailerRear(2.46, .99, 6.78)];
    for (const side of [-1, 1]) {
      parts.push(box("从主销前段一直承托后轮架的半挂纵梁", [side * .76, 1.1, 0], [.18, .25, 13.4], transportColors.dark), box("不依靠车头支撑的封闭货厢独立长侧壁", [side * 1.22, 2.65, 0], [.08, 2.6, 13.6], transportColors.trim), box("货厢后端左右独立双开装货门", [side * .6, 2.65, 6.78], [1.17, 2.54, .08], transportColors.body), box("后门真正贯通上下的独立锁杆", [side * .34, 2.63, 6.84], [.04, 2.25, .035], transportColors.dark), strut("货厢地板向后灯组下伸的固定短吊架", [side * .8, 1.26, 6.65], [side * .8, .99, 6.78], .1, transportColors.dark), box("后装门外侧长铰链条", [side * 1.17, 2.65, 6.84], [.045, 2.25, .04], transportColors.dark));
      for (const z of [-2.8, -.8, 1.2]) parts.push(box("防止人员进入车轮前方的固定侧防护梁", [side * 1.15, .68, z], [.07, .22, 1.8], transportColors.dark), strut("侧防护梁接入货厢底纵梁的实际挂杆", [side * .76, 1.1, z], [side * 1.15, .68, z], .065, transportColors.dark));
    }
    for (const z of [-5.5, -3.8, 0, 3.1, 5.6]) parts.push(box("实际连在左右底纵梁之间的横向承梁", [0, 1.1, z], [2.35, .2, .15], transportColors.dark));
    parts.push(box("牵引头接管处的独立前方气电接线盒", [0, 1.8, -6.84], [.58, .28, .12], transportColors.dark));
    return parts;
  } },
  { name: "鹅颈降台带后爬梯低平板工程半挂汽车拖车", theme: "现代", tags: ["汽车", "影视", "生活常见", "工程低平板半挂车", "鹅颈两段高差", "真正低位装载台", "独立完整空载拖车"], create: () => {
    const parts: ModelPart[] = [...trailerAxles(2.6, .38, [4.5, 5.55, 6.6], 1), ...parkingGear(1.1, -4.6, -6.1), box("鹅颈前方与牵引主销连成一体的高位承台", [0, 1.27, -5.6], [2.5, .16, 2.8], transportColors.dark), box("位于两处高差之间的真正低位连续装载平台", [0, .54, .3], [2.5, .14, 6.4], transportColors.wood), box("给后过渡坡保留净空的承轮高位后平台", [0, 1.13, 5.6], [2.55, .16, 3.1], transportColors.dark), ...trailerRear(2.6, .95, 7.12)];
    for (const side of [-1, 1]) {
      parts.push(box("中段低平板下方真实保有离地间隙的承力纵梁", [side * .96, .35, .3], [.25, .3, 6.4], transportColors.dark), box("鹅颈高位承台下方的独立承重边梁", [side * .76, 1.08, -5.6], [.2, .27, 2.8], transportColors.dark), beam("把前高台与低台真实连起来的折降鹅颈梁", transportColors.dark, [side * .96, 1.12, -4.2], [side * .96, .35, -2.9], .27, .27), box("避开过渡坡下口且实际承接后悬架的纵梁", [side * .76, 1, 5.575], [.22, .28, 3.15], transportColors.dark), beam("低平板向后承轮高台升起的真实斜接边梁", transportColors.dark, [side * .96, .35, 3.5], [side * .76, 1, 4], .24, .24));
      parts.push(beam("从后承台实际下降到地面的独立装载爬梯", transportColors.dark, [side * .88, 1.17, 7], [side * .88, .15, 8.8], .58, .1), rod("装载爬梯与后承台之间的真实铰销", [side * .58, 1.17, 7], [side * 1.18, 1.17, 7], .1, transportColors.trim));
      for (const z of [-2.5, -1, .5, 2, 3]) parts.push(box("低台外缘直接与主梁连接的绑载耳座", [side * 1.27, .56, z], [.12, .16, .2], transportColors.dark));
    }
    for (const z of [-2.5, -.5, 1.5, 3.2]) parts.push(box("中部低台真正跨接左右纵梁的承载横梁", [0, .36, z], [2.3, .2, .16], transportColors.dark));
    parts.push(box("鹅颈折降处与低平板前沿相接的实体过渡踏面", [0, .89, -3.55], [2.45, .14, 1.5], transportColors.dark, [30.6, 0, 0]), box("从低平板连续爬上后轮架而非陡坎的后过渡踏面", [0, .9, 3.65], [2.5, .14, 1.2], transportColors.dark, [-32.2, 0, 0]));
    return parts;
  } },
  { name: "双层开放轮道液压升降轿运半挂汽车拖车", theme: "现代", tags: ["汽车", "影视", "生活常见", "双层汽车运输挂车", "开放承载轮道", "空载轿运半挂车", "真实升降支承"], create: () => {
    const parts: ModelPart[] = [...trailerAxles(2.5, .38, [4.5, 5.6], .82), ...parkingGear(.82, -3.6, -5.5), ...trailerRear(2.5, .7, 6.4), box("轿运挂车前段主销上方的独立高承台", [0, 1.25, -5.6], [2.2, .13, 2.4], transportColors.dark)];
    for (const side of [-1, 1]) {
      parts.push(box("开放轮道下方的连续低位承力纵梁", [side * 1.0, .82, 0], [.2, .22, 12.8], transportColors.dark), box("下层留空中央而可承托轮胎的独立长轮道", [side * .8, 1, 0], [.46, .12, 12.8], transportColors.trim), box("上层独立于下层的长承载轮道", [side * .8, 3.1, 0], [.46, .12, 12.8], transportColors.trim), box("主销高承台下方真正接向前折梁的长承梁", [side * .76, 1.13, -5.6], [.18, .16, 2.3], transportColors.dark), beam("高主销承台向低位轿运主架过渡的前折梁", transportColors.dark, [side * .76, 1.16, -4.5], [side * 1, .82, -3.7], .18, .18));
      for (const z of [-5.4, -1.8, 1.8, 5.4]) parts.push(box("不穿车辆装载净空的外侧完整承力立柱", [side * 1.13, 2.01, z], [.12, 2.18, .12], transportColors.dark), rod("轮道外侧防止轮胎越出的上层短栏立杆", [side * 1.07, 3.1, z], [side * 1.07, 3.4, z], .035, transportColors.dark));
      parts.push(rod("贯通上层外缘而不横挡装载入口的防越栏", [side * 1.07, 3.4, -6.35], [side * 1.07, 3.4, 6.35], .035, transportColors.dark), beam("后部独立轮道接向地面的折叠装载坡道", transportColors.dark, [side * .8, 1, 6.3], [side * .8, .15, 8.1], .46, .09), rod("坡道与下轮道尾端的真实横向铰销", [side * .52, 1, 6.3], [side * 1.08, 1, 6.3], .09, transportColors.trim));
      for (const z of [-3.8, 3.8]) parts.push(cylinder("实际从主架向上层平台传力的升降油缸筒", [side * 1.08, 1.7, z], [.13, 1.7, .13], transportColors.body), cylinder("从油缸内伸出并接到上轮道横承架的活塞杆", [side * 1.08, 2.8, z], [.07, .65, .07], transportColors.trim));
    }
    for (const z of [-5.4, -3.8, -1.8, 1.8, 3.8, 5.4]) parts.push(box("下承轮道之间保留镂空的横向车架联梁", [0, .92, z], [2.36, .15, .13], transportColors.dark), box("实际支承两条上层轮道的横向承梁", [0, 3.02, z], [2.36, .14, .13], transportColors.dark));
    for (const z of [-3.8, 3.8]) parts.push(box("液压升降筒下端真正固定的外伸底横座", [0, .86, z], [2.36, .15, .2], transportColors.dark));
    return parts;
  } },
];
