import { part, ring, type ModelPart } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { rod } from "../masterObjects/parts";
import { box, cylinder, strut, transportColors, type TransportDefinition } from "./parts";

function bandOutline(radius: number): [number, number][] {
  const points: [number, number][] = [];
  for (let index = 0; index <= 12; index++) { const angle = Math.PI / 2 + index * Math.PI / 12; points.push([-.95 + Math.cos(angle) * radius, -Math.sin(angle) * radius]); }
  for (let index = 0; index <= 12; index++) { const angle = -Math.PI / 2 + index * Math.PI / 12; points.push([.95 + Math.cos(angle) * radius, -Math.sin(angle) * radius]); }
  return points;
}

// 独立移动木工设备，固定木床、锯房和原木均不加入模型；不同锯带宽度或夹膝数量不另计主。
// https://www.mebor.eu/complete-range-of-machines/log-sawing/horizontal-log-band-saws/htz-1100-pro-horizontal-band-saw/
// https://woodmizer.com/us/lt15-portable-sawmill
// https://cleereman.com/product-category/saw-mill-carriages/
export const railExpansionBatchSixteen: TransportDefinition[] = [
  { name: "龙门升降式水平带锯轨行锯木车", theme: "现代", tags: ["完整移动锯木头架", "贯通原木作业窗口", "真正闭环水平切削锯带", "双侧轨行及升降滑架"], create: () => {
    const parts: ModelPart[] = [];
    for (const side of [-1, 1]) {
      parts.push(box("移动龙门两侧独立长向底座", [side * 1.45, .4, 0], [.22, .16, 1.9], transportColors.dark), box("从侧底座升至上横梁的刚性立柱", [side * 1.45, 1.4, 0], [.16, 2.5, .22], transportColors.body));
      for (const z of [-.65, .65]) parts.push(cylinder("沿木床侧轨行走的独立钢轮", [side * 1.45, .17, z], [.3, .16, .3], transportColors.dark, [0, 0, 90]), cylinder("钢轮内侧限位轮缘", [side * 1.33, .17, z], [.34, .04, .34], transportColors.body, [0, 0, 90]), cylinder("不横穿原木通道的独立短轮轴", [side * 1.45, .17, z], [.07, .7, .07], transportColors.trim, [0, 0, 90]), box("侧轮外部实际悬挂轴承板", [side * 1.73, .3, z], [.12, .27, .23], transportColors.dark), box("把外悬挂轴承板接入底座的短横鞍", [side * 1.5, .4, z], [.65, .16, .2], transportColors.dark));
      parts.push(box("升降滑架避开固定立柱的后连接板", [side * 1.45, 1.8, .18], [.39, .7, .1], transportColors.dark));
      for (const edge of [-1, 1]) parts.push(box("围在立柱两边且保留导向空隙的滑架侧颊", [side * 1.45 + edge * .16, 1.8, .015], [.07, .7, .37], transportColors.signal));
      parts.push(box("升降缸上端接入固定龙门的实际锚座", [side * 1.575, 2.52, 0], [.38, .16, .3], transportColors.dark), cylinder("固定在龙门上部的升降液压缸", [side * 1.7, 2.25, 0], [.13, .5, .13], transportColors.body), rod("从液压缸实际下降到移动头架的活塞杆", [side * 1.7, 2.1, 0], [side * 1.7, 1.75, 0], .07, transportColors.trim), box("活塞杆连接移动滑架的外侧承耳", [side * 1.62, 1.75, 0], [.25, .2, .23], transportColors.dark));
    }
    parts.push(box("移动龙门最上部固定横梁", [0, 2.65, 0], [3.15, .18, .28], transportColors.body), box("随两侧滑架升降的整条锯头承梁", [0, 2.18, -.21], [3.3, .18, .12], transportColors.signal));
    for (const x of [-.95, .95]) {
      parts.push(ring("带锯驱动轮真实中空轮缘", transportColors.dark, .45, .05, 0, .09, { position: { x, y: 1.8, z: -.3275 }, rotation: { x: 90, y: 0, z: 0 } }), cylinder("带锯轮中央实际传动轮毂", [x, 1.8, -.3275], [.14, .13, .14], transportColors.body, [90, 0, 0]), cylinder("带锯轮轴穿过轮毂接入后方轴承", [x, 1.8, -.285], [.085, .36, .085], transportColors.trim, [90, 0, 0]), box("从升降承梁下降承接带轮轴的固定轴承座", [x, 1.97, -.18], [.28, .5, .18], transportColors.dark));
      for (let index = 0; index < 3; index++) { const angle = index * Math.PI * 2 / 3; parts.push(strut("真实连接带锯轮毂与轮缘的径向辐条", [x, 1.8, -.3275], [x + Math.cos(angle) * .425, 1.8 + Math.sin(angle) * .425, -.3275], .04, transportColors.body)); }
    }
    const band = polygon("围绕双带轮并保留中央大孔的真正闭环锯带", transportColors.trim, bandOutline(.452), .045, [0, 1.8, -.35], [bandOutline(.45)]);
    band.rotation.x = 90;
    parts.push(band, cylinder("移动锯头后方与左轮轴实际同轴的电动机", [-.95, 1.8, .09], [.34, .4, .34], transportColors.body, [90, 0, 0]), box("操作位控制箱与轨行底座的实际支柱", [1.7, .615, .8], [.13, .27, .18], transportColors.dark), box("位于原木通道外的操作控制箱", [1.7, .87, .8], [.4, .3, .33], transportColors.body), box("操作控制箱顶面的控制面板", [1.7, 1.04, .8], [.34, .055, .28], transportColors.dark));
    for (const x of [-.6, .6]) parts.push(strut("从锯头后承梁下降的锯带导向支臂", [x, 2.18, -.21], [x, 1.289, -.21], .045, transportColors.dark), cylinder("从下方切向支承水平锯带的导向小滚轮", [x, 1.289, -.3275], [.12, .07, .12], transportColors.body, [90, 0, 0]), cylinder("导向小滚轮接入后侧支臂的实际短轴", [x, 1.289, -.27], [.035, .22, .035], transportColors.trim, [90, 0, 0]));
    return parts;
  } },
  { name: "三膝液压定位顶夹式原木送锯滑车", theme: "现代", tags: ["完整独立送锯载具", "原木三点横向定位膝", "实际液压顶夹", "钢轮轨行承载", "不含原木与固定锯机"], create: () => {
    const parts: ModelPart[] = [];
    for (const side of [-1, 1]) parts.push(box("原木送锯滑车两侧连续承力纵梁", [side * .85, .73, 0], [.2, .28, 6.4], transportColors.dark));
    for (const z of [-2.2, 2.2]) {
      parts.push(cylinder("送木滑车两侧钢轮之间的实际贯通轮轴", [0, .25, z], [.1, 2.4, .1], transportColors.trim, [0, 0, 90]), box("连接外侧轴承挂板与主纵梁的车底横梁", [0, .73, z], [2.4, .18, .3], transportColors.dark));
      for (const side of [-1, 1]) parts.push(cylinder("沿锯机旁连续导轨运行的承重钢轮", [side * .85, .25, z], [.5, .2, .5], transportColors.body, [0, 0, 90]), cylinder("送木钢轮内侧的限位轮缘", [side * .72, .25, z], [.54, .04, .54], transportColors.dark, [0, 0, 90]), box("不嵌入钢轮且实际吊接横梁的外侧轴承挂板", [side * 1.11, .5, z], [.13, .5, .3], transportColors.dark));
    }
    for (const z of [-2.3, 0, 2.3]) {
      parts.push(box("承接原木且横跨两主纵梁的独立承木横枕", [0, .95, z], [2.3, .2, .48], transportColors.body));
      for (const end of [-1, 1]) parts.push(box("承木横枕上方膝座横向移动的导向轨", [0, 1.12, z + end * .18], [2.3, .1, .06], transportColors.dark));
      parts.push(box("在横向双导轨上定位的独立膝座滑台", [-.6, 1.2, z], [.45, .12, .5], transportColors.dark), box("膝座上方原木侧定位刚性立膝", [-.6, 1.7, z], [.2, 1, .3], transportColors.body), cylinder("顶夹双侧连杆围绕转动的实际横向铰销", [-.6, 2.08, z], [.18, .65, .18], transportColors.trim, [90, 0, 0]), box("横移定位缸与固定承木横枕的尾部支座", [-1, 1.16, z - .32], [.18, .3, .2], transportColors.dark), rod("从固定横枕推动独立定位膝座的横向缸体", [-.95, 1.2, z - .32], [-.65, 1.2, z - .32], .12, transportColors.body), rod("横向定位缸实际伸入膝座连接耳的活塞杆", [-.65, 1.2, z - .32], [-.4, 1.2, z - .32], .06, transportColors.trim), box("定位活塞杆接入膝座滑台的独立侧耳", [-.4, 1.2, z - .28], [.16, .15, .18], transportColors.dark));
      for (const end of [-1, 1]) parts.push(strut("从膝柱顶端向原木上方伸出的顶夹侧臂", [-.6, 2.08, z + end * .24], [-.05, 1.78, z + end * .24], .1, transportColors.dark));
      parts.push(box("连接两条顶夹侧臂的宽下压接触头", [-.05, 1.78, z], [.15, .16, .65], transportColors.dark), part("顶夹下方接触原木的真实楔形齿口", "extrude", transportColors.trim, [-.05, 1.7, z], [1, 1, 1], [0, 0, 0], { depth: .6, profile: [{ x: -.12, y: .1 }, { x: .12, y: .1 }, { x: 0, y: -.12 }] }), box("顶夹液压缸从膝柱侧面悬出的尾部铰座", [-.72, 1.5, z + .24], [.32, .2, .26], transportColors.dark), rod("顶夹张闭液压缸的独立缸筒", [-.85, 1.5, z + .3], [-.52, 1.752, z + .3], .12, transportColors.body), rod("顶夹液压缸实际伸至上夹臂的活塞杆", [-.52, 1.752, z + .3], [-.3, 1.92, z + .3], .06, transportColors.trim));
    }
    parts.push(box("靠近末端且不占承木区的液压分配机箱", [-.85, 1.23, 3.02], [.48, .72, .36], transportColors.body), box("分配机箱上方的操控面板", [-.85, 1.62, 3.02], [.42, .06, .3], transportColors.dark));
    return parts;
  } },
];
