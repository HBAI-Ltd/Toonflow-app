import { part, ring, type ModelPart } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { box, cab, cylinder, strut, surface, transportColors, type TransportDefinition } from "./parts";

export function industrialFrame(width: number, length: number): ModelPart[] {
  const parts: ModelPart[] = [];
  for (const side of [-1, 1]) parts.push(box("大型移动机器底部箱形纵梁", [side * (width / 2 - .2), 1.25, 0], [.4, .3, length], transportColors.dark));
  for (const z of [-length * .34, length * .34]) {
    parts.push(cylinder("贯通工业轮架的水平承重轴", [0, .54, z], [.16, width + .75, .16], transportColors.dark, [0, 0, 90]), box("轮架上方横跨两侧的承重横梁", [0, 1.25, z], [width + .7, .25, .45], transportColors.dark));
    for (const side of [-1, 1]) parts.push(cylinder("沿机器轨道运行的宽踏面钢轮", [side * width / 2, .54, z], [1, .35, 1], transportColors.body, [0, 0, 90]), cylinder("工业钢轮内侧的防脱轨轮缘", [side * (width / 2 - .19), .54, z], [1.08, .055, 1.08], transportColors.dark, [0, 0, 90]), box("位于钢轮外侧且留出转动空间的轴承座", [side * (width / 2 + .3), .54, z], [.15, .27, .4], transportColors.dark), box("轴承座上方连接承重横梁的挂板", [side * (width / 2 + .3), .95, z], [.15, .6, .25], transportColors.dark));
  }
  return parts;
}

function shaftGuide(name: string, x: number, y: number, z: number, yaw = 0): ModelPart {
  const shoe = polygon(name, transportColors.dark, [[-.27, -.2], [.27, -.2], [.27, .2], [.15, .2], [.15, -.08], [-.15, -.08], [-.15, .2], [-.27, .2]], .2, [x, y - .1, z]);
  shoe.rotation.y = yaw;
  return shoe;
}

// 类别资料来自制造商；以下全为原创简化静态构型，无制造规格或机械控制。
// https://www.ihi.co.jp/ihipw/en/products.html
// https://www.paulwurth.com/wp-content/uploads/2020/08/Brochure-Coke-Oven-Machines-en.pdf
// https://www.agudio.com/en/products/ropeways
export const railExpansionBatchEight: TransportDefinition[] = [
  { name: "横推长杆式焦炉推焦机", theme: "现代", itemType: "设施", tags: ["焦炉移动机械", "横向推焦杆", "独立轨道推焦机"], create: () => {
    const parts: ModelPart[] = [
      ...industrialFrame(5.4, 14.4),
      box("推焦机重载整体承台", [0, 1.48, 0], [6.1, .22, 14.6], transportColors.body),
      box("与推焦杆通道错开的平衡动力舱", [-1.5, 2.83, 3.6], [3, 2.45, 3.6], transportColors.body),
      box("开口驱动齿箱下部壁", [-2.4, 2.52, 0], [2.1, .13, 1.53], transportColors.dark),
      box("开口驱动齿箱上部壁", [-2.4, 4.25, 0], [2.1, .13, 1.53], transportColors.dark),
      ...[-1, 1].map(side => box("推焦杆贯通齿箱两侧的真实立壁", [-2.4, 3.385, side * .7], [2.1, 1.73, .13], transportColors.dark)),
      box("长推焦杆上翼缘", [4, 3.775, 0], [16.1, .1, .38], transportColors.trim),
      box("长推焦杆下翼缘", [4, 3.025, 0], [16.1, .1, .38], transportColors.trim),
      box("推焦杆上下翼缘间的竖直腹板", [4, 3.4, 0], [16.1, .65, .12], transportColors.body),
      box("横推杆末端高而窄的推焦板", [12.13, 3.1, 0], [.14, 3, .75], transportColors.dark),
      ...cab([-1.5, 1.59, -5], [1.9, 2.2, 2.25]),
    ];
    for (const x of [-2.7, 1.8]) {
      for (const side of [-1, 1]) parts.push(box("推焦杆导向架两侧落地立柱", [x, 2.89, side * .65], [.23, 2.6, .2], transportColors.dark));
      parts.push(box("推焦杆导向架顶部横梁", [x, 4.13, 0], [.32, .2, 1.5], transportColors.dark), cylinder("承托推焦杆下翼缘的滚轮", [x, 2.82, 0], [.31, 1.3, .31], transportColors.dark, [90, 0, 0]), cylinder("推焦杆上方限位滚轮", [x, 3.98, 0], [.31, 1.3, .31], transportColors.dark, [90, 0, 0]));
    }
    for (const side of [-1, 1]) {
      parts.push(strut("承台长侧安全护栏上梁", [side * 2.95, 2.52, -6.8], [side * 2.95, 2.52, 6.8], .05));
      for (const z of [-6.8, -2.25, 2.25, 6.8]) parts.push(strut("安全护栏连接承台的立柱", [side * 2.95, 1.59, z], [side * 2.95, 2.52, z], .045));
    }
    return parts;
  } },
  { name: "集烟罩贯通通道式拦焦导焦车", theme: "现代", itemType: "设施", tags: ["焦炉侧向移动设备", "真实贯通导焦槽", "上方集烟罩"], create: () => {
    const parts: ModelPart[] = [...industrialFrame(5, 11.2), box("导焦车完整移动设备承台", [0, 1.48, 0], [5.7, .22, 11.4], transportColors.dark), box("从炉口横向通到卸焦侧的导焦槽底", [.7, 1.88, 0], [7.0, .18, 1.2], transportColors.body), ...cab([-1.65, 1.59, 3.8], [1.65, 2.0, 2.0])];
    for (const z of [-.65, .65]) parts.push(box("开放导焦通道的连续高侧板", [.7, 2.62, z], [7, 1.5, .1], transportColors.body));
    for (const x of [-1.7, 2.3]) {
      parts.push(box("导焦槽底部实际支撑横座", [x, 1.73, 0], [.3, .3, 1.55], transportColors.dark));
      for (const side of [-1, 1]) parts.push(box("集烟罩四角独立承重柱", [x, 3.02, side * 1.37], [.2, 2.86, .2], transportColors.dark));
    }
    const bottom = [[-2.8, 4.4, -1.6], [4.2, 4.4, -1.6], [4.2, 4.4, 1.6], [-2.8, 4.4, 1.6]] as [number, number, number][], top = [[-.8, 6.5, -.6], [1.6, 6.5, -.6], [1.6, 6.5, .6], [-.8, 6.5, .6]] as [number, number, number][];
    for (let edge = 0; edge < 4; edge++) { const next = (edge + 1) % 4; parts.push(surface("导焦槽上方中空收分集烟罩壁", transportColors.body, [bottom[edge]!, bottom[next]!, top[next]!, top[edge]!], [0, 1, 2, 0, 2, 3])); }
    for (const side of [-1, 1]) parts.push(box("集烟出口长侧中空立壁", [.4, 7, side * .6], [2.4, 1, .07], transportColors.dark), box("集烟出口短侧中空立壁", [.4 + side * 1.2, 7, 0], [.07, 1, 1.2], transportColors.dark));
    for (const z of [-1.6, 1.6]) parts.push(box("集烟罩下缘实际承重横框", [.7, 4.39, z], [7.1, .16, .18], transportColors.dark));
    for (const x of [-2.8, 4.2]) parts.push(box("集烟罩下缘端部闭合框梁", [x, 4.39, 0], [.18, .16, 3.2], transportColors.dark));
    return parts;
  } },
  { name: "三仓重力给煤炉顶装煤车", theme: "现代", itemType: "设施", tags: ["焦炉炉顶移动设备", "上开口煤仓", "穿台面的落煤管"], create: () => {
    const holes: [number, number][][] = [-2.6, 0, 2.6].map(z => Array.from({ length: 12 }, (_, index) => { const angle = index * Math.PI / 6; return [Math.cos(angle) * .32, z + Math.sin(angle) * .32]; }));
    const parts: ModelPart[] = [...industrialFrame(6, 10.5), polygon("为三落煤管保留真实穿孔的承载台面", transportColors.body, [[-3.3, -5.35], [3.3, -5.35], [3.3, 5.35], [-3.3, 5.35]], .22, [0, 1.37, 0], holes), ...cab([2.35, 1.59, 3.65], [1.4, 2.1, 2.25])];
    for (const z of [-2.6, 0, 2.6]) {
      parts.push(part("上下真实贯通且上方开放的锥底煤仓", "lathe", transportColors.body, [0, 2.2, z], [1, 1, 1], [0, 0, 0], { profile: [{ x: .25, y: 0 }, { x: .25, y: .6 }, { x: 1.3, y: 2 }, { x: 1.3, y: 3.3 }, { x: 1.23, y: 3.3 }, { x: 1.23, y: 2.03 }, { x: .18, y: .62 }, { x: .18, y: 0 }, { x: .25, y: 0 }] }), part("穿过台面开孔的真实空心落煤管", "lathe", transportColors.dark, [0, .55, z], [1, 1, 1], [0, 0, 0], { profile: [{ x: .27, y: 0 }, { x: .27, y: 1.75 }, { x: .21, y: 1.75 }, { x: .21, y: 0 }, { x: .27, y: 0 }] }), ring("煤仓外周承重固定箍", transportColors.dark, 1.36, .08, 4.5, .12, { position: { x: 0, y: 4.5, z } }));
      for (const side of [-1, 1]) parts.push(box("外周承重箍到底台的独立支柱", [side * 1.35, 3.09, z], [.12, 3.02, .2], transportColors.dark));
    }
    for (const side of [-1, 1]) parts.push(strut("炉顶移动承台长侧安全扶手", [side * 3.16, 2.51, -5.1], [side * 3.16, 2.51, 5.1], .045), ...[-5.1, -1.7, 1.7, 5.1].map(z => strut("装煤车长侧护栏立柱", [side * 3.16, 1.59, z], [side * 3.16, 2.51, z], .04)));
    return parts;
  } },
  { name: "双层通道式矿井提升罐笼", theme: "现代", itemType: "设施", tags: ["独立提升载具", "双层人员平台", "井筒导向滑靴", "顶部吊接"], create: () => {
    const parts: ModelPart[] = [box("罐笼底层完整承载地板", [0, .2, 0], [2.6, .18, 2.6], transportColors.body), box("罐笼二层独立承载地板", [0, 2.99, 0], [2.6, .16, 2.6], transportColors.body), box("罐笼顶部防坠物护盖", [0, 5.8, 0], [2.7, .15, 2.7], transportColors.dark)];
    for (const x of [-1.25, 1.25]) for (const z of [-1.25, 1.25]) parts.push(box("上下贯通的四角承力立柱", [x, 2.98, z], [.13, 5.75, .13], transportColors.dark));
    for (const side of [-1, 1]) {
      for (const y of [.86, 1.84, 3.67, 4.65]) parts.push(box("罐笼长侧安全围护横杆", [side * 1.25, y, 0], [.07, .09, 2.5], transportColors.dark));
      for (const z of [-.6, 0, .6]) parts.push(box("侧壁上下贯通竖向栏杆", [side * 1.25, 2.98, z], [.04, 5.55, .04], transportColors.dark));
      for (const y of [.86, 4.65]) parts.push(shaftGuide("夹持井筒导向木轨的外侧U形滑靴", side * 1.43, y, 0, side * 90), box("导向滑靴与罐笼横杆的承座", [side * 1.31, y - .12, 0], [.25, .13, .25], transportColors.dark));
    }
    for (const y of [.29, 3.07]) {
      for (const z of [-1.27, 1.27]) {
        const holes: [number, number][][] = [-.9, -.3, .3, .9].map(x => [[x - .22, -.15], [x + .22, -.15], [x + .22, -2.37], [x - .22, -2.37]]);
        const gate = polygon("保留四道可视长孔的罐笼端部栅门", transportColors.body, [[-1.19, 0], [1.19, 0], [1.19, -2.5], [-1.19, -2.5]], .05, [0, y, z], holes); gate.rotation.x = 90; parts.push(gate);
      }
    }
    parts.push(strut("顶部中央吊架左斜撑", [-1.1, 5.88, 0], [0, 6.3, 0], .13, transportColors.dark), strut("顶部中央吊架右斜撑", [1.1, 5.88, 0], [0, 6.3, 0], .13, transportColors.dark), ring("顶部吊接钢环的真实孔", transportColors.trim, .25, .065, 0, .15, { position: { x: 0, y: 6.55, z: 0 }, rotation: { x: 90, y: 0, z: 0 } }));
    return parts;
  } },
  { name: "锥底闸门卸料式矿井提升箕斗", theme: "现代", itemType: "设施", tags: ["独立竖井矿料提升斗", "空心锥底料仓", "底部卸料闸门", "导向滑靴"], create: () => {
    const parts: ModelPart[] = [box("提升箕斗底部独立卸料闸板", [0, .375, 0], [1.25, .09, 1.05], transportColors.dark)];
    for (const x of [-1.1, 1.1]) for (const z of [-1, 1]) parts.push(box("箕斗外侧连续起吊承力立柱", [x, 2.9, z], [.13, 5.8, .13], transportColors.dark));
    for (const side of [-1, 1]) parts.push(box("保持内部净空的料仓长侧薄壁", [side * .95, 2.99, 0], [.09, 3.8, 1.7], transportColors.body), box("料仓前后端固定薄壁", [0, 2.99, side * .85], [2, 3.8, .09], transportColors.body), shaftGuide("提升箕斗的外侧U形导向滑靴", side * 1.29, 1.2, 0, side * 90), shaftGuide("提升箕斗上层U形导向滑靴", side * 1.29, 4.6, 0, side * 90), box("滑靴与箕斗外壁的下层承座", [side * 1.12, 1.08, 0], [.26, .13, .22], transportColors.dark), box("滑靴与箕斗外壁的上层承座", [side * 1.12, 4.48, 0], [.26, .13, .22], transportColors.dark));
    const top = [[-1, 1.09, -.85], [1, 1.09, -.85], [1, 1.09, .85], [-1, 1.09, .85]] as [number, number, number][], bottom = [[-.6, .42, -.5], [.6, .42, -.5], [.6, .42, .5], [-.6, .42, .5]] as [number, number, number][];
    for (let edge = 0; edge < 4; edge++) { const next = (edge + 1) % 4; parts.push(surface("空心锥底料仓实际斜壁", transportColors.body, [bottom[edge]!, bottom[next]!, top[next]!, top[edge]!], [0, 1, 2, 0, 2, 3])); }
    parts.push(box("外框顶部共用起吊横梁", [0, 5.84, 0], [2.36, .18, .3], transportColors.dark), strut("顶部钢丝绳联结左吊臂", [-1, 5.9, 0], [0, 6.27, 0], .14), strut("顶部钢丝绳联结右吊臂", [1, 5.9, 0], [0, 6.27, 0], .14), ring("提升箕斗顶部吊接环", transportColors.trim, .24, .06, 0, .14, { position: { x: 0, y: 6.52, z: 0 }, rotation: { x: 90, y: 0, z: 0 } }), strut("底闸板外侧卸料连杆", [1.04, .42, .5], [1.04, 1.63, .5], .05, transportColors.trim), cylinder("底闸板连杆的横向支轴", [1.02, 1.63, .5], [.09, .25, .09], transportColors.dark, [0, 0, 90]));
    return parts;
  } },
  { name: "横轴倾翻式散料索道吊斗", theme: "现代", tags: ["材料索道", "真实开放散料斗", "横向倾翻耳轴", "承重索行走小车"], create: () => {
    const parts: ModelPart[] = [part("具有真实厚度及开放顶部的散料斗", "extrude", transportColors.body, [0, .1, 0], [1, 1, 1], [0, 0, 0], { depth: 2.7, profile: [{ x: -.8, y: .1 }, { x: .8, y: .1 }, { x: 1.2, y: 1.4 }, { x: 1.1, y: 1.4 }, { x: .73, y: .2 }, { x: -.73, y: .2 }, { x: -1.1, y: 1.4 }, { x: -1.2, y: 1.4 }] }), box("顶部承重索小车长向主梁", [0, 3.72, 0], [.5, .2, 2.25], transportColors.dark)];
    for (const end of [-1, 1]) parts.push(part("散料斗端部封闭薄板", "extrude", transportColors.body, [0, .1, end * 1.35], [1, 1, 1], [0, 0, 0], { depth: .08, profile: [{ x: -.8, y: .1 }, { x: .8, y: .1 }, { x: 1.2, y: 1.4 }, { x: -1.2, y: 1.4 }] }));
    for (const side of [-1, 1]) parts.push(box("料斗耳轴与斗壁的实际加强耳板", [side * 1.16, 1.45, 0], [.1, .5, .4], transportColors.dark), cylinder("承接斗壁与外吊架的横向倾翻耳轴", [side * 1.25, 1.6, 0], [.22, .55, .22], transportColors.trim, [0, 0, 90]), strut("外侧吊架从倾翻耳轴上升的斜支杆", [side * 1.4, 1.6, 0], [side * .7, 3.1, 0], .12, transportColors.dark), strut("吊架上方接至承重小车的斜支杆", [side * .7, 3.1, 0], [0, 3.72, 0], .12, transportColors.dark));
    for (const z of [-.67, .67]) {
      parts.push(part("沿单根承重索行走的带槽钢轮", "lathe", transportColors.dark, [0, 4.15, z], [1, 1, 1], [0, 0, 90], { profile: [{ x: .06, y: -.11 }, { x: .29, y: -.11 }, { x: .29, y: -.06 }, { x: .24, y: -.035 }, { x: .24, y: .035 }, { x: .29, y: .06 }, { x: .29, y: .11 }, { x: .06, y: .11 }, { x: .06, y: -.11 }] }), cylinder("钢轮穿孔承重横轴", [0, 4.15, z], [.12, .7, .12], transportColors.trim, [0, 0, 90]));
      for (const side of [-1, 1]) parts.push(strut("位于轮盘外侧的承重轴挂板", [side * .28, 3.72, z], [side * .28, 4.15, z], .07));
    }
    parts.push(box("与承重索错位的独立牵引索夹持器", [.5, 4.52, 0], [.2, .12, .5], transportColors.body), strut("牵引索夹持器的横向固定臂", [0, 3.72, 0], [.5, 3.72, 0], .12), strut("牵引索夹持器的完整竖向承座", [.5, 3.72, 0], [.5, 4.48, 0], .12), strut("料斗端部倾翻锁扣操纵杆", [1.22, 1.52, .2], [1.22, 1.95, .65], .035, transportColors.dark));
    return parts;
  } },
];
