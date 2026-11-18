import { beam, part, type ModelPart, type Triple } from "../assetModelParts";
import { rod } from "../masterObjects/parts";
import { runningFrame } from "./railExpansionBatchThree";
import { box, cylinder, strut, surface, transportColors, type TransportDefinition } from "./parts";

function toothedDisk(name: string, radius: number, thickness: number, position: Triple, rotation: Triple): ModelPart {
  const count = 64, vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
  for (const level of [-1, 1]) for (const outer of [false, true]) for (let index = 0; index < count; index++) {
    const angle = index / count * Math.PI * 2, r = outer ? radius * (index % 2 ? .965 : 1) : radius * .1;
    vertices.push({ x: Math.cos(angle) * r, y: level * thickness / 2, z: Math.sin(angle) * r });
  }
  for (let index = 0; index < count; index++) {
    const next = (index + 1) % count, bottomInner = index, bottomOuter = count + index, topInner = count * 2 + index, topOuter = count * 3 + index;
    indices.push(bottomInner, bottomOuter, count + next, bottomInner, count + next, next, topInner, count * 3 + next, topOuter, topInner, count * 2 + next, count * 3 + next, bottomOuter, topOuter, count * 3 + next, bottomOuter, count * 3 + next, count + next, bottomInner, count * 2 + next, topInner, bottomInner, next, count * 2 + next);
  }
  return part(name, "mesh", transportColors.trim, position, [1, 1, 1], rotation, { vertices, indices });
}

// 按完整设备不同的承载和加工机构区分主素材，待切石材和待打道钉不加入本模型。
// https://www.hualongm.com/news/sandstone-cutting-equipment-36870266.html
// https://www.nordco.com/products/spike-driving-machines/ss-spiker/
export const railExpansionBatchFifteen: TransportDefinition[] = [
  { name: "竖横双向圆盘轨行采石锯切车", theme: "现代", tags: ["完整轨行采石设备", "双竖盘独立刀轴", "侧伸水平切底锯盘", "实际升降滑台与皮带传动"], create: () => {
    const parts: ModelPart[] = [box("沿采石场轨道运行的完整机器底座", [0, .6, 0], [1.8, .3, 2.9], transportColors.dark), box("承托竖向锯切滑台的刚性主立柱", [0, 1.6, -.1], [1.1, 2.1, .55], transportColors.body), box("主立柱前方可沿双导轨升降的独立滑座", [0, 1.6, -.47], [1, .65, .16], transportColors.signal), box("主立柱上部实际悬承升降油缸的顶横座", [0, 2.6, -.25], [.6, .15, .85], transportColors.dark), cylinder("位于两条升降导轨之间的升降缸外筒", [0, 2.3, -.53], [.16, .6, .16], transportColors.body), rod("升降缸实际连接前滑座的活塞杆", [0, 2.1, -.53], [0, 1.62, -.53], .08, transportColors.trim)];
    for (const z of [-1.05, 1.05]) {
      parts.push(cylinder("贯穿机器底座的轨行钢轮轴", [0, .22, z], [.08, 2.4, .08], transportColors.trim, [0, 0, 90]));
      for (const side of [-1, 1]) parts.push(cylinder("采石机器轨道行走钢轮", [side * .9, .22, z], [.4, .18, .4], transportColors.dark, [0, 0, 90]), cylinder("钢轮内侧防脱轨轮缘", [side * .78, .22, z], [.44, .04, .44], transportColors.body, [0, 0, 90]), box("钢轮盘外侧与底座实际接合的轴承板", [side * 1.12, .38, z], [.12, .4, .25], transportColors.dark));
    }
    for (const side of [-1, 1]) {
      parts.push(box("主立柱前方连续竖向升降导轨", [side * .42, 1.6, -.43], [.09, 2, .12], transportColors.dark), strut("升降滑座向前伸出的双独立刀轴承托臂", [side * .46, 1.3, -.5], [side * .46, 1, -1.75], .16, transportColors.dark), box("竖锯盘外侧的独立主轴承座", [side * .55, .83, -1.75], [.14, .35, .3], transportColors.body), toothedDisk("具有真实中心轴孔的竖向齿缘采石锯盘", .665, .012, [side * .28, .83, -1.75], [0, 0, 90]), cylinder("把带孔竖锯盘夹实到主轴的独立圆形法兰", [side * .28, .83, -1.75], [.18, .03, .18], transportColors.dark, [0, 0, 90]));
      const profile = Array.from({ length: 13 }, (_, index) => { const angle = index * Math.PI / 12; return { x: Math.cos(angle) * .73, y: Math.sin(angle) * .73 }; });
      profile.push(...Array.from({ length: 13 }, (_, index) => { const angle = (12 - index) * Math.PI / 12; return { x: Math.cos(angle) * .68, y: Math.sin(angle) * .68 }; }));
      parts.push(part("避开锯齿刃缘的上半圆防护罩", "extrude", transportColors.body, [side * .28, .83, -1.75], [1, 1, 1], [0, 90, 0], { depth: .08, profile }));
    }
    parts.push(cylinder("贯穿双竖锯盘及外轴承的实际水平主轴", [0, .83, -1.75], [.12, 1.5, .12], transportColors.trim, [0, 0, 90]), cylinder("竖锯升降滑座外侧的横向驱动电机", [.83, 1.6, -.75], [.48, .5, .48], transportColors.body, [0, 0, 90]), strut("驱动电机从升降滑座悬出的承托臂", [.46, 1.4, -.45], [.83, 1.4, -.75], .13, transportColors.dark), cylinder("驱动电机轴上的实际传动带轮", [.72, 1.6, -.75], [.28, .06, .28], transportColors.dark, [0, 0, 90]), cylinder("竖锯主轴上的对应传动带轮", [.72, .83, -1.75], [.28, .06, .28], transportColors.dark, [0, 0, 90]));
    const distance = Math.hypot(.77, 1), offsetY = .14 / distance, offsetZ = -.14 * .77 / distance;
    for (const side of [-1, 1]) parts.push(beam("由电机带轮切线接至刀轴带轮的传动带", transportColors.dark, [.72, 1.6 + side * offsetY, -.75 + side * offsetZ], [.72, .83 + side * offsetY, -1.75 + side * offsetZ], .055, .025));
    parts.push(box("水平切底摆臂与机器底台的竖向铰接座", [.78, .86, .4], [.3, .3, .35], transportColors.dark), strut("向采石块侧面伸出的水平切底支臂", [.78, .85, .4], [1.45, .65, .4], .18, transportColors.dark), cylinder("切底锯盘上方的独立竖向电机", [1.55, .7, .4], [.3, .6, .3], transportColors.body), rod("竖向电机实际伸至水平锯盘的主轴", [1.55, .6, .4], [1.55, .25, .4], .055, transportColors.trim), toothedDisk("具有中心轴孔的侧向水平切底锯盘", .3, .012, [1.55, .25, .4], [0, 0, 0]), cylinder("把水平锯盘夹实到垂直主轴的独立法兰", [1.55, .27, .4], [.12, .05, .12], transportColors.dark), box("机器后部电控和冷却液机柜", [0, 1.15, 1], [1.5, .8, .7], transportColors.body), box("机器后端操作控制面板", [0, 1.27, 1.38], [1.05, .4, .07], transportColors.dark));
    return parts;
  } },
  { name: "双操作位自动喂钉轨行冲击打钉机", theme: "现代", tags: ["完整铁路打钉机", "竖向液压冲击锤", "开放自动喂钉滑槽", "双操作位", "专用跨空工作车架"], create: () => {
    const parts: ModelPart[] = [...runningFrame(5.8, [-2.2, 2.2]), box("后部动力机箱与走道的独立平台", [0, 1.15, 1.5], [2.45, .2, 2.6], transportColors.dark), box("前部双操作位的独立脚踏平台", [0, 1.15, -1.9], [2.45, .2, 1.8], transportColors.dark), box("后部液压动力和柴油机机罩", [0, 1.85, 1.55], [2.2, 1.2, 2.1], transportColors.body), box("后动力机罩端面独立散热格板", [0, 1.86, 2.63], [1.83, .8, .04], transportColors.dark), box("双操作位上方完整遮雨顶棚", [0, 2.7, -1.7], [2.6, .1, 2.4], transportColors.body), box("跨过两组竖锤上方的专用承重横梁", [0, 2.4, -.35], [2.6, .2, .24], transportColors.signal)];
    for (const side of [-1, 1]) {
      parts.push(box("从底部边梁上升并悬承竖锤门架的立柱", [side * 1.15, 1.7, -.35], [.2, 1.4, .2], transportColors.signal), cylinder("操作者座椅下部的实际竖向支柱", [side * .7, 1.4, -1.8], [.13, .3, .13], transportColors.trim), box("面对中部工作区的独立操作者坐垫", [side * .7, 1.65, -1.8], [.55, .2, .5], transportColors.dark), box("双操作座椅后方的独立靠背", [side * .7, 1.97, -2.02], [.55, .6, .09], transportColors.dark), box("操作者前方接入脚踏平台的控制台", [side * .7, 1.48, -1.1], [.5, .46, .3], transportColors.body), box("双操作控制台的上部操作面", [side * .7, 1.74, -1.1], [.45, .07, .25], transportColors.dark));
      for (const z of [-2.65, -.75]) parts.push(box("由车底边梁接入顶棚的独立竖柱", [side * 1.15, 1.85, z], [.07, 1.7, .07], transportColors.dark));
      const railX = side * .8;
      for (const edge of [-1, 1]) parts.push(box("竖向冲击锤两侧实际贯通的导向立轨", [railX + edge * .2, 1.38, -.35], [.08, 1.82, .12], transportColors.dark));
      parts.push(box("独立竖锤上方接实承重门梁的横座", [railX, 2.28, -.35], [.5, .16, .35], transportColors.dark), cylinder("沿立轨布置的独立液压冲击锤筒", [railX, 1.5, -.35], [.24, 1.5, .24], transportColors.body), rod("从冲击锤筒下降到打钉口的实心锤杆", [railX, 1, -.35], [railX, .38, -.35], .1, transportColors.trim), box("冲击锤杆端部的独立打钉导嘴", [railX, .32, -.35], [.22, .16, .24], transportColors.dark), box("下端保持双导轨间距的横向定位座", [railX, .56, -.35], [.55, .2, .25], transportColors.dark));
      const top: Triple = [railX - side * .38, 1.75, .25], bottom: Triple = [railX - side * .38, .44, -.35];
      for (const edge of [-1, 1]) parts.push(strut("自动喂钉滑槽两侧独立导向边", [top[0] + edge * .07, top[1], top[2]], [bottom[0] + edge * .07, bottom[1], bottom[2]], .025, transportColors.dark));
      parts.push(beam("保留开放正面的连续喂钉槽底", transportColors.body, top, bottom, .14, .025), beam("从导轨下方把槽底末端接向打钉口的短导向底片", transportColors.body, bottom, [railX - side * .1, .33, -.35], .12, .025), strut("从竖锤内侧导轨实际悬承喂钉料斗的短支臂", [railX - side * .2, 1.9, -.35], [top[0] + side * .12, 1.9, .25], .06));
      for (const edge of [-1, 1]) parts.push(surface("自动喂钉料斗两侧真实收分壁", transportColors.signal, [[top[0] + edge * .17, 2.05, .05], [top[0] + edge * .17, 2.05, .45], [top[0] + edge * .07, 1.75, .31], [top[0] + edge * .07, 1.75, .19]], [0, 1, 2, 0, 2, 3]));
      for (const end of [-1, 1]) parts.push(surface("自动喂钉料斗前后真实收分壁", transportColors.signal, [[top[0] - .17, 2.05, .25 + end * .2], [top[0] + .17, 2.05, .25 + end * .2], [top[0] + .07, 1.75, .25 + end * .06], [top[0] - .07, 1.75, .25 + end * .06]], [0, 1, 2, 0, 2, 3]));
    }
    return parts;
  } },
];
