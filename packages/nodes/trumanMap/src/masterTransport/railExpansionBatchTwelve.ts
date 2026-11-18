import { Euler, Quaternion, Vector3 } from "three";
import { ring, type ModelPart, type Triple } from "../assetModelParts";
import { rod } from "../masterObjects/parts";
import { box, cylinder, strut, transportColors, type TransportDefinition } from "./parts";

// 原创空载移动设备，承载汽车不是本模型部件，也不以更换承载汽车增加主素材。
// https://fataautomation.com/products/electrified-monorail/
// https://fataautomation.com/qr-ems-gmcami/
// https://www.durr.com/en/products/final-assembly/conveyor-technology-for-final-assembly/overhead-conveyors
// https://www.durr.com/en/products/paint-shop-application-technology/pretreatment-and-electrocoating/rodip/rodip-ezy
export const railExpansionBatchTwelve: TransportDefinition[] = [
  { name: "四索同步剪架导向汽车总装悬轨升降载具", theme: "现代", tags: ["汽车总装运输", "完整电动悬轨载具", "四索同步升降", "剪架稳定导向", "空载四点承托"], create: () => {
    const parts: ModelPart[] = [];
    for (const end of [-1, 1]) {
      parts.push(box("悬轨小车从轮架下方横接的底横梁", [0, 4.75, end * 2.2], [1.03, .18, .9], transportColors.dark), box("悬轨小车与上框架之间的真实吊接柱", [0, 4.5, end * 2.2], [.2, .55, .2], transportColors.dark), box("上框架承接悬轨吊柱的贯通横梁", [0, 4.2, end * 2.2], [2.12, .22, .22], transportColors.signal));
      for (const z of [end * 2.2 - .25, end * 2.2 + .25]) {
        for (const side of [-1, 1]) parts.push(cylinder("运行在工字轨下翼上方的承重轮", [side * .22, 5.2, z], [.36, .15, .36], transportColors.dark, [0, 0, 90]), cylinder("不穿过中央工字轨腹板的独立短轮轴", [side * .3, 5.2, z], [.085, .34, .085], transportColors.trim, [0, 0, 90]), strut("避开轮盘并接到底横梁的外悬挂轴承板", [side * .43, 4.75, z], [side * .43, 5.2, z], .085, transportColors.body));
      }
    }
    for (const side of [-1, 1]) parts.push(box("升降载具上部通长框架纵梁", [side * .95, 4.2, 0], [.17, .22, 5.6], transportColors.signal), box("下部车身承托框架的通长边梁", [side * 1.1, .4, 0], [.16, .2, 4.8], transportColors.dark), strut("下框到上框的剪架第一根稳定连杆", [side, .6, -1.9], [side, 4.1, 1.9], .08, transportColors.body), strut("与第一根错开平面避免实体相穿的剪架第二连杆", [side * 1.1, .6, 1.9], [side * 1.1, 4.1, -1.9], .08, transportColors.body), cylinder("剪架交点连接两平面连杆的短水平铰轴", [side * 1.05, 2.35, 0], [.12, .3, .12], transportColors.trim, [0, 0, 90]));
    for (const side of [-1, 1]) for (const end of [-1, 1]) parts.push(box("把两平面剪架上端接实到上纵梁的滑座", [side * 1.02, 4.1, end * 1.9], [.32, .2, .2], transportColors.dark));
    for (const end of [-1, 1]) {
      parts.push(box("下部开放框架的承托横梁", [0, .4, end * 1.67], [2.4, .2, .2], transportColors.dark), cylinder("上框架中同步收放两根提升索的卷扬筒", [0, 4.5, end * 1.5], [.34, 2.3, .34], transportColors.body, [0, 0, 90]), cylinder("提升卷扬筒的贯通传动轴", [0, 4.5, end * 1.5], [.1, 2.62, .1], transportColors.trim, [0, 0, 90]));
      for (const side of [-1, 1]) parts.push(box("卷扬轴承真实接入上部纵梁的短托座", [side * 1.18, 4.4, end * 1.5], [.3, .25, .3], transportColors.dark), rod("从卷筒切点实际下降到下框横梁的钢丝提升索", [side * .95, 4.5, end * 1.67], [side * .95, .5, end * 1.67], .025, transportColors.dark), box("下框四角向上承托车身的独立立臂", [side * 1.1, 1, end * 1.67], [.16, 1.2, .2], transportColors.signal), box("四点承托臂向车身下方伸入的横向托掌", [side * .78, 1.6, end * 1.67], [.6, .16, .35], transportColors.signal), box("车身实际落在其上的柔性承托垫", [side * .6, 1.73, end * 1.67], [.35, .1, .32], transportColors.dark));
    }
    parts.push(box("前悬轨小车的电动行走驱动机壳", [.64, 4.94, -2.2], [.34, .52, .6], transportColors.body), cylinder("与前轮轴连接的横向减速驱动接头", [.48, 5.2, -2.45], [.14, .35, .14], transportColors.dark, [0, 0, 90]), box("上框侧置提升驱动电机和制动器箱", [1.31, 4.6, 0], [.65, .56, 1.1], transportColors.body), strut("提升驱动箱与上纵梁的前承托", [.95, 4.2, -.35], [1.31, 4.36, -.35], .12), strut("提升驱动箱与上纵梁的后承托", [.95, 4.2, .35], [1.31, 4.36, .35], .12), rod("把前后提升卷扬同步连接到中置驱动箱的传动轴", [1.31, 4.5, -1.5], [1.31, 4.5, 1.5], .08, transportColors.dark));
    for (const end of [-1, 1]) parts.push(box("同步传动轴与横向卷扬轴的直角减速接头", [1.31, 4.5, end * 1.5], [.22, .25, .28], transportColors.dark));
    return parts;
  } },
  { name: "单侧回转臂车身浸涂轨行载具", theme: "现代", tags: ["车身前处理与电泳物流", "独立电动轨行载体", "横向悬臂回转轴", "空载四点锁定框架", "不含涂装槽与车身"], create: () => {
    const parts: ModelPart[] = [box("浸涂载具单侧的独立走行底台", [-2.8, .9, 0], [1.7, .3, 3.7], transportColors.dark), box("侧置回转与行走驱动封闭机体", [-2.85, 1.9, 0], [1.2, 1.8, 3.35], transportColors.body)];
    for (const z of [-1.45, 1.45]) {
      parts.push(cylinder("单侧轨行底架贯通承重轴", [-2.8, .32, z], [.12, 1.8, .12], transportColors.trim, [0, 0, 90]));
      for (const side of [-1, 1]) parts.push(cylinder("沿侧方双轨行走的承重钢轮", [-2.8 + side * .6, .32, z], [.6, .2, .6], transportColors.dark, [0, 0, 90]), cylinder("承重钢轮靠轨道内侧的限位轮缘", [-2.8 + side * .47, .32, z], [.64, .045, .64], transportColors.body, [0, 0, 90]), box("不埋入钢轮盘的外侧轴承挂板", [-2.8 + side * .82, .59, z], [.12, .75, .28], transportColors.dark));
    }
    parts.push(ring("侧机体面向空载托架的实际回转承圈", transportColors.dark, .77, .58, 0, .18, { position: { x: -2.2, y: 1.9, z: 0 }, rotation: { x: 0, y: 0, z: 90 } }), cylinder("由侧驱动机体伸入承托框架的水平悬臂主轴", [-1.25, 1.9, 0], [.36, 2.2, .36], transportColors.trim, [0, 0, 90]), box("单侧机体上部控制与连接箱", [-2.85, 2.97, .72], [1.08, .35, 1.35], transportColors.dark), box("侧机体端部的操作状态面板", [-2.85, 2, -1.7], [.75, .52, .055], transportColors.dark));
    const cradle: ModelPart[] = [];
    for (const side of [-1, 1]) {
      cradle.push(box("车身空载托架两侧连续纵向承梁", [side * 1.05, 0, 0], [.16, .22, 5.6], transportColors.signal));
      for (const z of [-1.8, 1.8]) cradle.push(box("车身夹持点的独立角件托座", [side * .8, .18, z], [.42, .18, .48], transportColors.body), box("托座上方压紧车身定位孔的夹持头", [side * .8, .39, z], [.22, .13, .25], transportColors.dark), strut("从托座升至夹持头的独立侧锁臂", [side * 1.05, .18, z], [side * .8, .39, z], .09, transportColors.dark));
    }
    for (const z of [-1.8, 0, 1.8]) cradle.push(box("空载托架连接两侧纵梁的承重横梁", [0, 0, z], [2.3, .22, .2], transportColors.signal));
    const pivot: Triple = [0, 1.9, 0], rotation = new Quaternion().setFromEuler(new Euler(20 * Math.PI / 180, 0, 0));
    for (const value of cradle) {
      const position = new Vector3(value.position.x, value.position.y, value.position.z).applyQuaternion(rotation).add(new Vector3(...pivot));
      const orientation = new Euler().setFromQuaternion(rotation.clone().multiply(new Quaternion().setFromEuler(new Euler(value.rotation.x * Math.PI / 180, value.rotation.y * Math.PI / 180, value.rotation.z * Math.PI / 180))));
      value.position = { x: position.x, y: position.y, z: position.z };
      value.rotation = { x: orientation.x * 180 / Math.PI, y: orientation.y * 180 / Math.PI, z: orientation.z * 180 / Math.PI };
      parts.push(value);
    }
    return parts;
  } },
];
