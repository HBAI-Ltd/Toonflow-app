import { part, beam, type ModelPart, type Triple } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { ovalPoints } from "./garmentExpansionBatchOne";
import { machineBed, roller, clothWeb, cageMembers } from "./stageTextileExpansionBatchOne";
import { box, cylinder, ball, cone, rod, loop, cord, plate, material, type MasterPrototype } from "./parts";

const frame = "#758c8e", cloth = "#b8b5a3", pale = "#d4d0bc";

function cuttingLoop(): ModelPart {
  const outline: [number, number][] = [], opening: [number, number][] = [];
  for (const [x, y, start] of [[.25, 2.1, 0], [-.85, 2.1, 90], [-.85, .4, 180], [.25, .4, 270]]) for (let step = 0; step <= 4; step++) {
    const angle = (start! + step * 22.5) * Math.PI / 180;
    outline.push([x! + Math.cos(angle) * .205, y! + Math.sin(angle) * .205]);
    opening.push([x! + Math.cos(angle) * .191, y! + Math.sin(angle) * .191]);
  }
  const value = polygon("四轮间中间留空且真正回转闭合的整条裁布带刀", material.steel, outline, .025, [0, 0, .0125], [opening]);
  value.rotation.x = -90;
  return value;
}

function sewingTable(): ModelPart[] {
  return [...machineBed(1.25, .8, .74), box("缝纫机独立平整工作台面", [0, .75, 0], [1.35, .06, .85], pale), box("台下可踏的整片操纵踏板", [0, .08, -.12], [.34, .045, .28], material.dark, [-12, 0, 0]), rod("把脚踏位连接至机底传动的连杆", [.14, .09, -.1], [.28, .69, .08], .012), cylinder("台下侧挂的独立驱动电机", [.3, .56, .15], [.17, .28, .17], material.dark, [0, 0, 90])];
}

function sewingDrive(): ModelPart[] {
  return [plate("下方留大通道的整铸鹅颈缝纫机臂", [0, .74, 0], [[-.45, .35], [-.45, .6], [-.35, .72], [.3, .72], [.4, .6], [.4, 0], [.15, 0], [.15, .52], [-.23, .52], [-.25, .32]], .18, frame, [0, 0, 0]), cylinder("机臂后侧的主轴手轮", [.44, 1.28, 0], [.19, .055, .19], material.dark, [0, 0, 90]), rod("左端贯穿压脚中心的竖直针杆", [-.34, 1.115, 0], [-.34, .993, 0], .006), ...[-1, 1].map(side => box("针两旁真正分开的压脚趾", [-.34 + side * .015, 1.005, -.005], [.018, .012, .055], material.steel)), cylinder("面向操作者的可调夹线盘", [-.2, 1.19, -.104], [.055, .025, .055], material.dark, [90, 0, 0]), rod("后侧独立线架立杆", [.48, .76, .28], [.48, 1.68, .28], .012), cylinder("线架下端与台面接触的纱线筒", [.48, .895, .28], [.1, .23, .1], cloth), cord("由线架顶部通向夹线盘的连续上机纱", [[.48, 1.68, .28], [.22, 1.56, .08], [-.2, 1.19, -.12], [-.34, 1.03, -.01]], .0015, cloth)];
}

function shoeForm(position: Triple, crosswise = false): ModelPart[] {
  const [x, y, z] = position;
  return [ball("置于夹具内的立体前掌工作楦", [x + (crosswise ? -.06 : 0), y + .055, z + (crosswise ? 0 : -.06)], crosswise ? [.19, .09, .11] : [.11, .09, .19], material.wood), ball("抬高足背与后足的工作楦腹", [x + (crosswise ? .05 : 0), y + .09, z + (crosswise ? 0 : .05)], crosswise ? [.14, .16, .095] : [.095, .16, .14], material.wood), box("与楦头连成整体的平整楦底", [x, y + .018, z], crosswise ? [.28, .035, .095] : [.095, .035, .28], material.wood)];
}

function sandingBelt(): ModelPart {
  const outline: [number, number][] = [], opening: [number, number][] = [];
  for (const [y, start] of [[2.5, -90], [1.15, 90]]) for (let step = 0; step <= 8; step++) {
    const angle = (start! + step * 22.5) * Math.PI / 180;
    outline.push([y! + Math.cos(angle) * .24, Math.sin(angle) * .24]);
    opening.push([y! + Math.cos(angle) * .228, Math.sin(angle) * .228]);
  }
  const value = polygon("跨上下辊且留有内腔的整幅连续磨毛砂带", material.wood, outline, 2.1, [1.05, 0, 0], [opening]);
  value.rotation.z = 90;
  return value;
}

// 整机结构参考 Eastman 直刀、JUKI 高柱/圆筒床、Strobel 弯针产品目录；不以换面料扩主。
// www.eastmancuts.com/manual-cutting/straight-knives/；www.juki.co.jp/industrial_e/products_e/lether_e/postbed_e/
export const stageTextileExpansionBatchFiveObjects: MasterPrototype[] = [
  { name: "四带轮立式闭环带刀裁布台", itemType: "设施", theme: "现代", build: () => [
    ...machineBed(2.8, 1.9, .95),
    polygon("为工作刃与回刀段同时留出真实通槽的裁布台", pale, [[-1.4, -.95], [1.4, -.95], [1.4, .95], [-1.4, .95]], .08, [0, .95, 0], [[ [.416, -.055], [.49, -.055], [.49, .055], [.416, .055] ], [ [-1.09, -.055], [-1.018, -.055], [-1.018, .055], [-1.09, .055] ]]),
    box("包住左侧回刀路径的连续背柱", [-.94, 1.18, .12], [.32, 2.1, .2], frame),
    box("从背柱跨至前上刀轮的悬臂梁", [-.3, 2.1, .12], [1.52, .22, .2], frame),
    ...[-.85, .25].flatMap(x => [.4, 2.1].map(y => cylinder("与闭环带刀接触的独立带轮", [x, y, 0], [.4, .08, .4], material.dark, [90, 0, 0]))),
    cuttingLoop(),
    ...[-1, 1].map(side => box("紧贴工作刃两边而不封住刀路的导刀块", [.451 + side * .026, 1.24, 0], [.025, .17, .055], material.dark)),
    cylinder("下部驱动带轮的横置电机", [-.85, .4, .28], [.3, .38, .3], frame, [90, 0, 0]),
  ] },
  { name: "低脚板手持往复直刀裁布机", itemType: "器物", theme: "现代", build: () => [
    polygon("从布叠下面滑入的流线薄裁刀脚板", material.steel, [[-.08, -.16], [.08, -.16], [.1, -.05], [.08, .13], [-.08, .13], [-.1, -.05]], .012),
    box("传动杆后方的高窄固定刀架", [0, .205, .025], [.055, .38, .045], frame),
    plate("与脚板垂直接触的细长往复直刃", [0, .19, -.025], [[-.022, -.18], [.015, -.18], [.022, .18], [-.022, .18]], .003, material.steel, [0, 0, 0]),
    cylinder("直刀顶端向两侧突出的电机壳", [0, .43, .035], [.14, .22, .14], frame, [0, 0, 90]),
    cord("绕过电机背部的完整握持手把", [[-.085, .44, .055], [-.095, .46, .17], [.095, .46, .17], [.085, .44, .055]], .018, material.dark),
    ...[-1, 1].map(side => cylinder("刀刃两侧可抬起的窄磨刀轮", [side * .025, .3, -.028], [.035, .018, .035], material.wood, [0, 0, 90])),
    rod("沿直刃前侧下垂的压布防护杆", [0, .4, -.045], [0, .05, -.045], .009),
    box("落在布叠表面的压布小脚", [0, .05, -.055], [.055, .014, .045], material.dark),
  ] },
  { name: "高柱旋梭立体缝纫机台", itemType: "设施", theme: "现代", build: () => [
    ...sewingTable(), ...sewingDrive(),
    box("从平桌中独立升起而四周全开放的高柱床", [-.34, .885, 0], [.075, .22, .095], frame),
    cylinder("高柱顶端进给材料的小滚脚", [-.34, .998, .014], [.027, .04, .027], material.dark, [90, 0, 0]),
    box("底柱与大机臂共同固定的窄机底梁", [.025, .795, .055], [.88, .04, .21], frame),
  ] },
  { name: "开放圆筒臂套管缝纫机台", itemType: "设施", theme: "现代", build: () => [
    ...sewingTable(), ...sewingDrive(),
    roller("下方周围留空可套衣管的悬伸圆筒床", [-.02, .942, 0], .64, .105, frame),
    cylinder("圆筒末端的窄旋梭工作盖", [-.345, .942, 0], [.108, .015, .108], material.steel, [0, 0, 90]),
    box("圆筒床仅在右端接回机柱的根座", [.255, .86, 0], [.18, .19, .15], frame),
  ] },
  { name: "三卷布轨架长臂自由绗缝机", itemType: "设施", theme: "现代", build: () => [
    ...machineBed(4.8, 2.6, .82),
    ...[-1, 1].map(side => box("机头小车横移的纵长承轨", [0, .75, side], [4.8, .12, .09], material.steel)),
    ...[-1, 1].flatMap(x => [-1, 1].map(z => cylinder("长臂机底小车实际压轨的四个轮", [x * .19, .845, z], [.07, .055, .07], material.dark, [90, 0, 0]))),
    box("支承长臂机并跨两条轨道的底小车", [0, .9, 0], [.55, .08, 2.15], material.dark),
    plate("上下两长臂夹住整片被面的真C形机身", [0, .93, 0], [[-1, 0], [.95, 0], [.95, .16], [-.7, .16], [-.7, .65], [.75, .65], [.85, .5], [1, .5], [1, .78], [.88, .88], [-.85, .88], [-1, .7]], .23, frame, [0, 90, 0]),
    ...[-1, 1].map(side => roller("绷紧被面两端的整幅布辊", [0, 1.07, side], 4.5, .24, cloth)),
    roller("位于后下方的独立收被卷", [0, .92, 1.2], 4.5, .28, cloth),
    ...[-1, 1].flatMap(x => [-1, 1].map(z => box("布辊端部真实接到地架的支座", [x * 2.28, .99, z], [.12, .45, .3], frame))),
    clothWeb("被头上下臂之间连续穿过的被面", 4.35, [0, 1.195, -1], [0, 1.195, 1]),
    rod("长臂前端下降到被面的单根机针", [0, 1.43, -.86], [0, 1.194, -.86], .009),
    loop("围住单针但中心真正空的压布环脚", [0, 1.204, -.86], .027, .005),
    ...[-1, 1].map(side => cord("操作者两手分握而不遮针的前把手", [[side * .1, 1.48, -.92], [side * .23, 1.4, -1.14], [side * .23, 1.32, -1.14]], .022, material.dark)),
  ] },
  { name: "弯针横扫暗缝折边机台", itemType: "设施", theme: "现代", build: () => [
    ...sewingTable(),
    plate("前部悬开以便衣边绕入的弧背暗缝机壳", [.04, .78, .04], [[-.3, .05], [-.3, .12], [.06, .12], [.06, .41], [-.2, .41], [-.25, .27], [-.35, .27], [-.35, .49], [-.25, .57], [.21, .57], [.29, .43], [.29, 0], [.1, 0]], .22, frame, [0, 0, 0]),
    cylinder("弯针摆轴外部的横置手轮", [.37, 1.19, .04], [.18, .065, .18], material.dark, [0, 0, 90]),
    cylinder("把布折边顶起的小圆弧下顶柱", [-.19, .925, -.07], [.055, .19, .055], material.steel),
    box("折边从侧面进入的窄悬伸工作臂", [-.14, .89, -.01], [.33, .075, .12], frame),
    cord("由侧向摆过布边而非直上直下的弯曲缝针", [[-.2, 1.1, -.07], [-.2, 1.075, -.115], [-.2, 1.035, -.126], [-.2, 1.01, -.09]], .0025),
    ...[-1, 1].map(side => box("在顶柱两侧分开的下压护脚", [-.19 + side * .035, 1.012, -.07], [.032, .016, .09], material.steel)),
    cylinder("台后独立供上机纱的线筒", [.42, .88, .29], [.1, .2, .1], cloth),
    cord("经过上机导眼的真实细纱", [[.42, .99, .29], [.27, 1.43, .22], [-.2, 1.2, -.06], [-.2, 1.03, -.1]], .0015, cloth),
  ] },
  // 前掌钳弧结构参考 ORMAC Challenger 833T 公布的独立钳组；工作楦只是夹具中的工件。
  { name: "弧列独立夹钳鞋帮前掌绷楦机", itemType: "设施", theme: "现代", build: () => [
    box("落地液压主机底盘", [0, .12, 0], [1.15, .24, 1.3], material.dark),
    box("承载前掌钳弧的倾前主体柜", [0, .6, .15], [.9, .9, .95], frame),
    cylinder("托住整只鞋楦的可升降楦底柱", [0, .99, -.2], [.16, .4, .16], material.steel),
    ...shoeForm([0, 1.12, -.22]),
    ...Array.from({ length: 9 }, (_, index) => { const a = Math.PI + index * Math.PI / 8, x = Math.cos(a) * .29, z = -.22 + Math.sin(a) * .28; return [rod("从机体向前掌皮边独立伸出的液压钳缸", [x * 1.3, .9, z * 1.05], [x, 1.15, z], .075, material.dark), box("围着楦头展开并承接两颚的独立夹钳叉座", [x, 1.14, z], [.065, .06, .065], material.steel, [0, -a * 180 / Math.PI, 0]), ...[-1, 1].map(side => box("真正分开而能夹进皮边的上下两只钳颚", [x, 1.185 + side * .017, z], [.065, .012, .085], material.steel, [0, -a * 180 / Math.PI, 0]))]; }).flat(),
    ...[-1, 1].map(side => plate("左右两片可合向鞋底的前掌擦板", [side * .085, 1.255, -.32], [[-.07, -.12], [.07, -.12], [.12, .02], [.06, .11], [-.06, .11]], .015, material.steel)),
    box("前部低位的双脚操作踏板", [0, .09, -.69], [.55, .08, .25], material.dark, [-12, 0, 0]),
    box("侧面供操作者观察的倾斜控制屏座", [.63, 1.2, .15], [.32, .32, .11], material.dark, [-12, -20, 0]),
    box("嵌入屏座的玻璃显示面", [.63, 1.2, .089], [.265, .25, .008], material.glass, [-12, -20, 0]),
  ] },
  { name: "双半楦分合长靴筒撑形机", itemType: "设施", theme: "现代", build: () => [
    box("接地的靴筒定形机重底台", [0, .08, 0], [.85, .16, .85], material.dark),
    box("蒸汽与气动撑形系统的下部主柜", [0, .43, .06], [.65, .7, .65], frame),
    cylinder("从机柜中上伸并托住长靴楦的中心轴", [0, .8, .02], [.1, .35, .1], material.steel),
    ...[-1, 1].map(side => plate("左右分开而非实心方柱的长靴筒金属半楦", [0, .83, 0], [[.011, 0], [.064, 0], [.085, .23], [.105, .55], [.085, .7], [.052, .755], [.011, .755]].map(([x, y]): [number, number] => [side * x!, y!]), .14, material.steel, [0, 0, -side * 2])),
    ...[-1, 1].map(side => cylinder("把两半楦向外推开的短横向撑缸", [side * .07, .91, .1], [.08, .16, .08], material.dark, [0, 0, 90])),
    cord("从机内通往热楦根部的蒸汽软管", [[.25, .45, .25], [.29, .72, .23], [.05, .87, .12]], .022, material.dark),
    box("前部低位的脚踏撑合开关", [0, .055, -.51], [.3, .065, .2], material.dark, [-12, 0, 0]),
    box("机柜前上角的温控盒", [0, .68, -.284], [.22, .12, .04], material.dark),
    box("温控读数玻璃窗", [0, .69, -.307], [.14, .055, .006], material.glass),
  ] },
  { name: "双楦联动触头仿形鞋楦铣削机", itemType: "设施", theme: "蒸汽朋克", build: () => [
    ...machineBed(1.9, 1.3, .73),
    ...[-1, 1].map(side => box("鞋楦同步旋转的两列长床轨", [0, .78, side * .27], [1.75, .12, .1], material.dark)),
    ...[-1, 1].flatMap(x => [-1, 1].map(z => box("固定双楦两端的独立轴承座", [x * .65, .98, z * .27], [.3, .4, .24], frame))),
    ...[-1, 1].flatMap(x => [-1, 1].map(z => roller("穿入楦体两端并同步旋转的主轴", [x * .37, 1.005, z * .27], .5, .055, material.steel))),
    ...shoeForm([0, .915, -.27], true), ...shoeForm([0, .915, .27], true),
    ...[-1, 1].map(side => box("高位仿形滑轨的接地端立柱", [side * .82, .73, .03], [.12, 1.46, .15], frame)),
    box("触头与刀头共同横移的高位直轨", [0, 1.47, .03], [1.8, .12, .12], material.steel),
    box("跨在高轨上的复制小车", [.05, 1.52, .03], [.25, .16, .25], material.dark),
    rod("让触头与铣刀同位移动的共用联动横臂", [.05, 1.52, -.34], [.05, 1.52, .34], .055, frame),
    rod("贴在原工作楦最高轮廓上的实体触头", [.05, 1.51, -.27], [.05, 1.079, -.27], .013),
    cylinder("位于被加工楦一侧的垂直铣削主轴", [.05, 1.29, .27], [.12, .32, .12], material.dark),
    cone("主轴下端实际触及另一工作楦的成形刀", [.05, 1.09, .27], [.075, .08, .075], material.steel, [0, 0, 180]),
    ...[-1, 1].map(side => cylinder("两楦共用传动端的齿轮护盘", [.82, 1.005, side * .27], [.2, .06, .2], material.dark, [0, 0, 90])),
    rod("把同步轮相连的竖向带传动轴", [.82, 1.005, -.27], [.82, 1.005, .27], .035),
  ] },
  { name: "五指套管柱塞气动手套翻面机", itemType: "设施", theme: "现代", build: () => [
    box("承重且藏有气阀的落地主柜", [0, .35, .04], [.68, .7, .63], frame),
    box("围绕指管根部的独立工作台", [0, .73, 0], [.75, .06, .55], material.steel),
    ...Array.from({ length: 5 }, (_, index) => { const height = [.22, .29, .32, .28, .2][index]!, x = (index - 2) * .063; return [part("上口真实贯通供手套指端翻入的金属套管", "lathe", material.steel, [x, .76, -.04], [1, 1, 1], [0, 0, 0], { profile: [{ x: .022, y: 0 }, { x: .022, y: height }, { x: .016, y: height }, { x: .016, y: 0 }, { x: .022, y: 0 }] }), rod("与每根套管同轴而尚未压入的细翻指柱塞", [x, 1.25, -.04], [x, .8 + height, -.04], .024, material.dark)]; }).flat(),
    ...[-1, 1].map(side => box("上方气缸门架实际接到机柜的竖柱", [side * .29, 1.15, .12], [.075, .9, .1], frame)),
    box("固定气缸而不随指塞移动的门架横梁", [0, 1.61, .12], [.66, .08, .18], frame),
    cylinder("驱动五指同下压的主气缸", [0, 1.48, .1], [.14, .26, .14], material.dark),
    cylinder("从气缸接至移动横担的活塞杆", [0, 1.31, .1], [.045, .12, .045], material.steel),
    box("连接每根翻指柱塞的活动横担", [0, 1.25, -.01], [.4, .06, .26], material.dark),
    box("柜脚前方的独立翻指踏板", [0, .04, -.43], [.22, .05, .16], material.dark, [-10, 0, 0]),
  ] },
  // 冠楦、檐夹、供汽柜参考 Bahner 5-230；整圈头形测量器在本批后段单列，不共用整机本体。
  { name: "冠楦环檐夹持蒸汽帽坯定形机", itemType: "设施", theme: "现代", build: () => [
    box("落地供汽与撑冠传动主柜", [0, .4, .08], [.8, .8, .7], frame),
    polygon("帽檐夹台中间真实留出冠楦孔的工作环", material.steel, ovalPoints(.36, .31), .065, [0, .84, 0], [ovalPoints(.104, .125)]),
    cylinder("从主柜中撑起冠楦的可升降轴", [0, .83, 0], [.13, .28, .13], material.dark),
    part("上部封合并能撑起帽冠的椭圆金属楦", "lathe", material.steel, [0, .9, 0], [1, 1, 1.18], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: .097, y: 0 }, { x: .1, y: .13 }, { x: .085, y: .2 }, { x: .045, y: .235 }, { x: 0, y: .24 }] }),
    ...Array.from({ length: 12 }, (_, index) => { const a = index * Math.PI / 6, x = Math.cos(a), z = Math.sin(a); return [rod("从外环斜向内夹住帽檐的独立钳指", [x * .36, .83, z * .31], [x * .25, .919, z * .21], .025), box("钳指内端真实压住帽檐的短夹面", [x * .25, .915, z * .21], [.05, .023, .055], material.dark, [0, -index * 30, 0])]; }).flat(),
    rod("机侧控制环檐合夹的长手动杠杆", [-.36, .52, .2], [-.36, .98, -.4], .025, material.dark),
    cord("从柜内蒸汽阀通向冠楦的供汽管", [[.25, .5, .32], [.34, .78, .3], [0, .86, .08]], .023, material.dark),
    cylinder("机柜前的独立蒸汽压力圆表", [.17, .58, -.285], [.1, .04, .1], material.dark, [90, 0, 0]),
    cylinder("压力表内侧可见的表面", [.17, .58, -.308], [.08, .006, .08], pale, [90, 0, 0]),
    rod("从下部伸向操作者的脚踏连杆", [0, .38, -.2], [0, .08, -.5], .025),
    box("控制供汽与撑楦的脚踏板", [0, .065, -.51], [.28, .05, .2], material.dark, [-12, 0, 0]),
  ] },
  { name: "双刀板连续折褶热定形机", itemType: "设施", theme: "现代", build: () => [
    ...machineBed(2.6, 4.4, .9), box("前后加热段共用的长工作床", [0, 1.09, 0], [2.45, .06, 3.9], material.steel),
    ...[-1, 1].map(side => box("支承两片折刀上下往复的厚机侧框", [side * 1.2, 1.18, 0], [.23, .75, .8], frame)),
    box("向前推入折痕的下方长折刀", [0, 1.145, -.04], [2.2, .025, .26], material.steel),
    box("抬起待下压的上方长折刀", [0, 1.31, 0], [2.2, .025, .26], material.steel),
    ...[-1, 1].flatMap(side => [rod("上刀板端部接至驱动偏心的连杆", [side * 1.16, 1.31, 0], [side * 1.3, 1.5, .1], .05), cylinder("折刀往复驱动偏心轮", [side * 1.3, 1.5, .1], [.25, .09, .25], material.dark, [0, 0, 90])]),
    box("刀口前方预热压平的独立热段", [0, 1.32, -1.3], [2.3, .36, .8], frame),
    clothWeb("从预热段连续送入刀口的平直布幅", 2.15, [0, 1.15, -1.75], [0, 1.15, -.12]),
    ...Array.from({ length: 14 }, (_, index) => clothWeb("双刀后方连续接起来的真实折褶面", 2.15, [0, 1.15 + (index % 2) * .07, .17 + index * .1], [0, 1.15 + ((index + 1) % 2) * .07, .27 + index * .1])),
    box("压住折褶并加热保形的后段上罩", [0, 1.38, 1.2], [2.3, .32, .6], frame),
    roller("后端送出折褶布的压送辊", [0, 1.12, 1.9], 2.2, .16, material.dark),
  ] },
  { name: "立式宽砂带连续织物磨毛机", itemType: "设施", theme: "现代", build: () => [
    ...machineBed(3.1, 3.2, .8), ...[-1, 1].map(side => box("宽砂带两端接到底架的高侧柱", [side * 1.25, 1.45, 0], [.2, 2.6, .65], frame)),
    ...[1.15, 2.5].map(y => roller("驱动整幅立式磨毛带的宽轴辊", [0, y, 0], 2.45, .456, material.dark)), sandingBelt(),
    ...[-1, 1].map(side => roller("把织物平送过下接触辊的导布辊", [0, .78, side * 1.3], 2.4, .24, material.steel)),
    clothWeb("从砂带下缘实际穿行的整幅织物", 2.12, [0, .9, -1.3], [0, .9, 1.3]),
    box("工作辊下方收集磨毛纤屑的吸尘槽", [0, .55, 0], [2.4, .3, .9], material.dark),
    cylinder("侧置吸尘管的圆形汇出口", [1.65, .55, 0], [.4, .7, .4], material.dark, [0, 0, 90]),
    box("砂带张紧端上部的可调导轴箱", [1.3, 2.5, 0], [.35, .42, .6], material.dark),
  ] },
  { name: "光电扫描弓辊织物整纬机", itemType: "设施", theme: "现代", build: () => [
    ...machineBed(3.2, 3.1, .8), ...[-1, 1].flatMap(x => [-1, 1].map(z => box("整纬主架接地端柱", [x * 1.5, .9, z * 1.3], [.2, 1.8, .2], frame))),
    ...[-1, 1].map(side => box("支承弓辊两头的机侧长轴床", [side * 1.5, 1.35, 0], [.2, .18, 2.9], frame)),
    ...[-.9, 0, .9].flatMap(z => [cord("轴线在水平面弯曲而非上弓的整纬弓辊", [[-1.3, 1.35, z], [-.65, 1.35, z + .12], [0, 1.35, z + .18], [.65, 1.35, z + .12], [1.3, 1.35, z]], .075, material.dark), ...[-1, 1].map(side => roller("弓辊两端接入侧床的短轴承", [side * 1.42, 1.35, z], .3, .12))]),
    clothWeb("实际铺过三根弓辊顶面的连续布幅", 2.45, [0, 1.43, -1.5], [0, 1.43, 1.5]),
    ...[-1, 1].map(side => box("扫描器门梁的真实接地支柱", [side * 1.5, 1, -.65], [.12, 2, .15], material.dark)),
    box("从织幅上空跨过的光电扫描横梁", [0, 2, -.65], [3.12, .15, .2], material.dark),
    ...[-1, 1].flatMap(side => [box("向下观察纬纱斜度的独立扫描头", [side * .7, 1.9, -.65], [.28, .15, .2], frame), cylinder("扫描头底部面向织物的真实圆镜头", [side * .7, 1.82, -.65], [.08, .09, .08], material.glass)]),
  ] },
  // 双夹纱斜架和横行结头参考 Stäubli TOPMATIC；不复用垂挂综框的穿综台本体。
  { name: "双排斜夹纱横移结经小车", itemType: "设施", theme: "现代", build: () => [
    ...[-1, 1].flatMap(x => [-1, 1].map(z => rod("斜夹纱架的A形叉腿", [x * 1.3, .15, z * .5], [x * 1.3, 1.13, 0], .07, frame))),
    ...[-1, 1].map(side => box("A架底部联接前后轮的脚梁", [side * 1.3, .15, 0], [.14, .12, 1.15], material.dark)),
    ...[-1, 1].flatMap(x => [-1, 1].map(z => cylinder("推到织机旁换经的四个行走轮", [x * 1.3, .09, z * .48], [.18, .065, .18], material.dark, [90, 0, 0]))),
    ...[-1, 1].map(side => clothWeb("承住新旧经头并向中央抬起的独立斜板", 2.95, [0, 1.15, 0], [0, .95, side * .5], material.steel)),
    ...[-1, 1].map(side => box("全幅锁住新旧经纱的独立夹纱梁", [0, 1.0, side * .42], [2.95, .065, .075], frame)),
    box("沿经幅横行并承住结头小车的中央导轨", [0, 1.2, 0], [3.05, .08, .1], material.dark),
    box("位于双排经头之间的横行结头机", [.35, 1.37, 0], [.4, .28, .35], frame),
    ...Array.from({ length: 18 }, (_, index) => { const x = -1.37 + index * .161; return [-1, 1].map(side => rod("从各自夹纱梁送到中央结头缝的真实经线", [x, 1.04, side * .42], [x, 1.25, side * .035], .003, cloth)); }).flat(),
    cord("结头器前已合在一起的一对新旧经纱", [[.35, 1.25, -.035], [.366, 1.267, 0], [.35, 1.25, .035]], .004, cloth),
    rod("供操作者推行夹纱车的侧把手", [-1.56, .8, -.25], [-1.56, 1.12, -.25], .025, material.dark),
  ] },
  { name: "四孔转牌板织长框", itemType: "器物", theme: "异域", build: () => [
    ...[-1, 1].map(side => box("支承前后张经轴的低位长框边", [side * .16, .07, 0], [.045, .1, 1.25], material.wood)),
    ...[-1, 1].map(side => box("板织长框两端闭合横梁", [0, .07, side * .58], [.36, .1, .05], material.wood)),
    ...[-1, 1].flatMap(x => [-1, 1].map(z => box("两端张经轴的小轴承立座", [x * .18, .155, z * .55], [.05, .15, .08], material.wood))),
    ...[-1, 1].map(side => roller("让板织窄带逐段前进的前后木轴", [0, .2, side * .55], .37, .08, material.wood)),
    ...Array.from({ length: 8 }, (_, index) => {
      const holes = [-1, 1].flatMap(x => [-1, 1].map(y => ovalPoints(.005, .005, 8).map(([a, b]): [number, number] => [x * .022 + a, y * .022 + b]))), card = polygon("四角各有真实穿经孔而非画点的独立转牌", index % 2 ? pale : material.wood, [[-.038, -.038], [.038, -.038], [.038, .038], [-.038, .038]], .002, [0, .2, .015 + index * .006], holes);
      card.rotation.x = -90;
      return card;
    }),
    ...[-1, 1].flatMap(x => [-1, 1].map(y => cord("依次穿过整叠板牌角孔的连续经束", [[x * .022, .24, .55], [x * .022, .2 + y * .022, .12], [x * .022, .2 + y * .022, -.05], [x * .022, .242, -.55]], .0025, y > 0 ? material.red : cloth))),
    clothWeb("由转牌前方收成并卷向前轴的窄带", .065, [0, .242, -.1], [0, .242, -.55], material.red),
    ...[-1, 1].map(side => cylinder("用于独立调节经线张紧的轴端旋钮", [side * .215, .2, -.55], [.065, .025, .065], material.dark, [0, 0, 90])),
  ] },
  // 单侧开架、挑经柱和绕线路径参考 Schacht/Ashford Inkle 官方装配图。
  { name: "单侧立柱绕经Inkle带织架", itemType: "器物", theme: "异域", build: () => {
    const pegs: [number, number][] = [[.37, .66], [.37, .43], [.37, .17], [-.07, .31], [-.07, .17], [-.42, .17]], route: [number, number][] = [[-.42, .189], [.37, .679], [.389, .66], [.389, .43], [.37, .411], [-.07, .329], [-.089, .31], [.37, .189], [.389, .17], [.37, .151], [-.42, .151], [-.439, .17], [-.42, .189]];
    return [box("放在台面上的纵向实木底脚", [-.13, .035, 0], [.11, .07, 1.05], material.wood), box("单侧后方的高立柱", [-.13, .38, .37], [.075, .68, .075], material.wood), box("单侧中部的较低挑经柱", [-.13, .21, -.07], [.075, .34, .075], material.wood), box("单侧前端的短张紧柱", [-.13, .105, -.42], [.075, .13, .075], material.wood), ...[-.4, .37].map(z => box("横向伸出以防侧翻的木底脚", [0, .025, z], [.42, .05, .07], material.wood)), ...pegs.map(([z, y]) => roller("一端固在立柱另一端完全开放的绕经木销", [0, y, z], .32, .032, material.wood)), ...Array.from({ length: 4 }, (_, index) => cord("从挑经柱间多次绕行的完整经线", route.map(([z, y]): Triple => [.01 + index * .025, y, z]), .0025, index % 2 ? material.red : cloth)), clothWeb("在前方斜经段上真正交织出来的窄带", .09, [.0475, .189, -.42], [.0475, .356, -.15], material.red), cylinder("前张紧木销的独立锁紧旋钮", [-.2, .17, -.42], [.07, .035, .07], material.dark, [0, 0, 90])];
  } },
  { name: "三面列销高台Takadai组纽架", itemType: "器物", theme: "日式", build: () => {
    const positions: [number, number][] = [...[-1, 1].flatMap(side => Array.from({ length: 6 }, (_, index): [number, number] => [side * .54, -.35 + index * .14])), ...Array.from({ length: 4 }, (_, index): [number, number] => [-.35 + index * .233, .54])];
    const pins = positions.map(([x, z]) => ({ x, z, weightX: Math.abs(x) > .5 ? Math.sign(x) * .68 : x, weightZ: z > .5 ? .68 : z }));
    return [...[-1, 1].flatMap(x => [-1, 1].map(z => box("围绕一米工作区的四根木立脚", [x * .54, .43, z * .52], [.065, .86, .065], material.wood))), ...[-1, 1].map(side => box("高台左右两侧实际支承绕线木销的长轨", [side * .54, .84, 0], [.095, .1, 1.12], material.wood)), box("高台后方连接两条侧轨的横轨", [0, .84, .54], [1.17, .1, .095], material.wood), ...[-1, 1].map(side => box("左右立脚之间较低的防摇撑", [side * .54, .25, 0], [.045, .07, 1.08], material.dark)), box("前部供织带卷出而非封住工作区的低横撑", [0, .74, -.52], [1.1, .075, .07], material.wood),
      ...pins.flatMap(({ x, z, weightX, weightZ }) => [cylinder("交错挂纱所用的独立木立销", [x, .92, z], [.018, .16, .018], material.wood), cylinder("悬在线束末端保持张力的独立木线玉", [weightX, .5, weightZ], [.035, .14, .035], material.wood)]),
      ...[-1, 1].flatMap(side => cageMembers("从线玉经木销至织口保持绷紧的细丝束", pins.filter(pin => (pin.x < 0 ? -1 : 1) === side).flatMap(pin => [[[pin.weightX, .57, pin.weightZ], [pin.x, .995, pin.z]], [[pin.x, .995, pin.z], [0, .8, -.12]]] as [Triple, Triple][]), .005, side < 0 ? material.red : cloth)),
      clothWeb("从开放方台内织口斜向前方收出的扁带", .1, [0, .8, -.12], [0, .784, -.52], material.red)];
  } },
  { name: "鞍匠脚踏双颚缝线夹凳", itemType: "器物", theme: "欧式", build: () => [
    box("可坐跨而不堵住夹皮位置的长木凳面", [0, .4, .17], [.3, .07, .85], material.wood),
    ...[-1, 1].flatMap(x => [-1, 1].map(z => rod("实际接地并向外展开的四只凳腿", [x * .18, .025, .17 + z * .36], [x * .115, .38, .17 + z * .28], .06, material.wood))),
    ...[-1, 1].map(side => plate("从凳面上升并向中央收拢的木夹颚", [0, .42, -.16], [[.06, 0], [.02, 0], [.012, .58], [.018, .65], [.04, .65], [.05, .55]].map(([x, y]): [number, number] => [side * x!, y!]), .09, material.wood, [0, 0, 0])),
    roller("穿过两夹颚中段的调压螺杆", [0, .75, -.16], .25, .014, material.steel),
    cylinder("夹具一侧可手拧的木螺母盘", [.145, .75, -.16], [.07, .025, .07], material.dark, [0, 0, 90]),
    box("正在双颚之间露出供缝线的皮革裁片", [0, 1.04, -.16], [.022, .19, .14], material.red),
    rod("凳下脚踏控制夹颚的倾斜拉杆", [0, .58, -.12], [0, .085, -.5], .025, material.dark),
    box("前端可踩动而非装饰木块的夹持踏板", [0, .08, -.5], [.19, .045, .22], material.wood, [-15, 0, 0]),
  ] },
  { name: "带贯通柄孔的双角Lucet编绳叉", itemType: "器物", theme: "异域", build: () => {
    const fork = polygon("双叉中间开放且握柄也真正穿孔的整木编绳叉", material.wood, [[-.045, .16], [-.018, .16], [-.018, .08], [.018, .08], [.018, .16], [.045, .16], [.045, .03], [.025, 0], [.025, -.1], [-.025, -.1], [-.025, 0], [-.045, .03]], .012, [0, .1, .006], [ovalPoints(.012, .029, 12).map(([x, y]): [number, number] => [x, y - .047])]);
    fork.rotation.x = -90;
    return [fork, ...[-1, 1].map(side => ball("叉尖防止绳圈滑脱的圆润木端", [side * .0315, .26, 0], [.027, .024, .016], material.wood)), cord("在两角之间真正交绕的连续编绳", [[-.03, .242, -.01], [.03, .225, -.01], [.033, .255, .005], [-.03, .231, .008], [-.033, .255, .005], [.03, .242, -.01], [0, .17, -.012]], .0025, material.red)];
  } },
  { name: "双叶空腔梭蕾线梭", itemType: "器物", theme: "欧式", build: () => [
    ...[.004, .025].map(y => polygon("上下分开而侧面真正留有出线间隙的尖叶梭壳", material.wood, [[-.05, 0], [-.025, -.017], [.025, -.017], [.05, 0], [.025, .017], [-.025, .017]], .003, [0, y, 0])),
    cylinder("仅在两片梭叶中心连结的固定梭芯柱", [0, .016, 0], [.011, .025, .011], material.dark),
    cylinder("绕在中柱且不塞住两端空隙的小线团", [0, .016, 0], [.026, .013, .026], cloth),
    cord("从双叶侧缝连续抽出的梭蕾细线", [[.01, .016, -.01], [.031, .018, -.013], [.07, .008, -.035]], .0015, cloth),
  ] },
  // 木质联动测头与开合纸模盖参考 German Hat Museum 的 Conformateur 馆藏。
  { name: "环列联动探针帽形测量器", itemType: "器物", theme: "蒸汽朋克", build: () => {
    const angle = 35 * Math.PI / 180, lidY = .225 + .1 * Math.sin(angle), lidZ = .1 - .1 * Math.cos(angle);
    const lid = polygon("绕后铰链整体抬起并留纸模孔的上盖框", material.wood, ovalPoints(.09, .105), .012, [0, lidY, lidZ], [ovalPoints(.07, .085)]); lid.rotation.x = 35;
    const paper = polygon("随同一铰盖转动的可取下头形纸模", pale, ovalPoints(.069, .084), .0015, [0, lidY + .004 * Math.cos(angle), lidZ + .004 * Math.sin(angle)]); paper.rotation.x = 35;
    return [polygon("下方供头部伸入的真实椭圆基圈", material.dark, ovalPoints(.132, .157), .016, [0, 0, 0], [ovalPoints(.107, .132)]), polygon("上方缩小头形并约束探针的椭圆导圈", material.wood, ovalPoints(.085, .1), .014, [0, .207, 0], [ovalPoints(.065, .08)]), ...Array.from({ length: 24 }, (_, index) => { const a = index * Math.PI / 12, x = Math.cos(a), z = Math.sin(a), lever = beam("从实际接头点传到纸模位置的独立窄木联动片", material.wood, [x * .114, .016, z * .139], [x * .073, .22, z * .088], .012); lever.scale.z = .005; return [lever, cylinder("联动片上端用于转录头形的独立细针", [x * .073, .227, z * .088], [.004, .025, .004], material.steel)]; }).flat(), ...[-1, 1].map(side => cylinder("纸模盖后侧共轴而非各自乱转的铰轴", [side * .055, .225, .1], [.015, .04, .015], material.dark, [0, 0, 90])), lid, paper];
  } },
  { name: "手摇立式四框整经磨", itemType: "器物", theme: "欧式", build: () => [
    ...[-1, 1].map(side => box("防止整经磨倾倒的交叉落地长脚", [0, .045, 0], side > 0 ? [.95, .09, .1] : [.1, .09, .95], material.wood)),
    cylinder("承住四框并可转动的中心长轴", [0, .88, 0], [.045, 1.7, .045], material.dark),
    cylinder("落地脚中央的实际转动轴座", [0, .13, 0], [.15, .18, .15], material.wood),
    ...[-1, 1].flatMap(x => [-1, 1].map(z => box("从下横梁连接到顶横梁的四根绕经木边", [x * .35, .935, z * .35], [.045, 1.37, .045], material.wood))),
    ...[.25, 1.62].flatMap(y => [box("把四角木边实际接至中心轴的横向木框梁", [0, y, 0], [.75, .055, .055], material.wood), box("与横梁正交并共同支承另两角的木框梁", [0, y, 0], [.055, .055, .75], material.wood), ...[-1, 1].flatMap(side => [box("闭合前后框角而非悬空木柱的框边", [0, y, side * .35], [.75, .045, .045], material.wood), box("闭合左右框角的纵向框边", [side * .35, y, 0], [.045, .045, .75], material.wood)])]),
    cord("依次绕过四框并逐层上升的整经长纱", Array.from({ length: 25 }, (_, index): Triple => { const corners = [[-.376, -.376], [.376, -.376], [.376, .376], [-.376, .376]], point = corners[index % 4]!; return [point[0]!, .37 + index * .042, point[1]!]; }), .003, cloth),
    rod("下层木框伸出的转磨摇柄", [.35, .25, .35], [.5, .25, .35], .025, material.wood),
    cylinder("摇柄外端可握的独立旋转木把", [.5, .19, .35], [.035, .13, .035], material.wood),
  ] },
  { name: "曲面针布羊毛手梳", itemType: "器物", theme: "欧式", build: () => {
    const top = Array.from({ length: 8 }, (_, index): [number, number] => { const x = -.12 + index * .24 / 7; return [x, .025 + .018 * (1 - x * x / (.12 * .12))]; }), outline: [number, number][] = [...top, ...[...top].reverse().map(([x, y]): [number, number] => [x, y - .016])];
    const teeth = Array.from({ length: 8 }, (_, column) => Array.from({ length: 4 }, (_, row) => { const x = -.102 + column * .204 / 7, z = -.056 + row * .037, y = .029 + .018 * (1 - x * x / (.12 * .12)); return [[[x, y, z], [x, y + .019, z - .006]], [[x, y + .019, z - .006], [x, y + .026, z - .003]]] as [Triple, Triple][]; }).flat()).flat();
    return [plate("有真实拱曲而非平标签的针布木梳背", [0, .004, 0], outline, .15, material.wood, [0, 0, 0]), rod("从梳背后侧伸出的长圆木握柄", [0, .035, .065], [0, .035, .23], .033, material.wood), ball("便于握住且连接长柄末端的圆木柄尾", [0, .035, .23], [.04, .04, .045], material.wood), ...cageMembers("接在曲背上并向梳毛方向弯折的细针布组", teeth, .0025)];
  } },
  { name: "立钉柱环形手工编织圈", itemType: "器物", theme: "现代", build: () => [
    polygon("中间完全开放而非实心盘的环形针座", frame, ovalPoints(.175, .175, 24), .035, [0, 0, 0], [ovalPoints(.133, .133, 24)]),
    ...Array.from({ length: 24 }, (_, index) => { const a = index * Math.PI / 12, x = Math.cos(a) * .155, z = Math.sin(a) * .155; return [cylinder("针座上竖直插入的独立编织钉柱", [x, .075, z], [.009, .085, .009], pale), cylinder("钉柱顶端保住线圈的小圆帽", [x, .119, z], [.014, .009, .014], pale)]; }).flat(),
    rod("圈外侧供起头线固定的横伸锚线钉", [.174, .018, 0], [.205, .018, 0], .01, pale),
    cord("在一段钉柱之间实际绕出首行的编织纱", Array.from({ length: 13 }, (_, index): Triple => { const a = index * Math.PI / 24, r = index % 2 ? .163 : .147; return [Math.cos(a) * r, .102, Math.sin(a) * r]; }), .003, material.red),
  ] },
];
