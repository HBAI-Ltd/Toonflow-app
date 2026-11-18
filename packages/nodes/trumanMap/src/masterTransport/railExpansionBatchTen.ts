import { Euler, Quaternion, Vector3 } from "three";
import { part, ring, type ModelPart, type Triple } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { rod } from "../masterObjects/parts";
import { industrialFrame } from "./railExpansionBatchEight";
import { runningFrame } from "./railExpansionBatchThree";
import { box, cylinder, strut, surface, transportColors, type TransportDefinition } from "./parts";

// 原创米制场景设备；公开制造商资料只用于核对类别和运行构造，不是制造图或机械仿真。
// https://www.plassertheurer.com/en/machine/material-logistics/mfs-100
// https://www.jasper-gmbh.de/charging
// https://www.agudio.com/en/products/cablecranes
export const railExpansionBatchTen: TransportDefinition[] = [
  { name: "连续带底回转卸料式铁路物料储运车", theme: "现代", tags: ["铁路施工物料物流", "连续带底开放料仓", "独立回转转运皮带", "非重力底卸漏斗"], create: () => {
    const parts: ModelPart[] = [...runningFrame(18, [-6.6, -4.8, 4.8, 6.6])];
    for (const side of [-1, 1]) {
      parts.push(box("连续带底两侧的输送机长向托梁", [side * .86, 1.38, 1.4], [.13, .24, 12.8], transportColors.dark), surface("料仓由宽上口收分至连续带底的完整侧壁", transportColors.signal, [[side * 1.38, 4.2, -4.85], [side * 1.38, 4.2, 7.65], [side * .78, 1.54, 7.65], [side * .78, 1.54, -4.85]], [0, 1, 2, 0, 2, 3]), box("高侧料仓上部连续加劲边框", [side * 1.38, 4.21, 1.4], [.12, .12, 12.7], transportColors.dark));
      for (const z of [-4.7, -1.7, 1.4, 4.5, 7.5]) parts.push(strut("侧壁外侧从底架接至上缘的倾斜加强柱", [side * .86, 1.38, z], [side * 1.42, 4.21, z], .1, transportColors.dark));
    }
    for (const z of [-4.6, 1.4, 7.4]) {
      parts.push(box("连接车底边梁而低于回程皮带的承重横联", [0, 1.11, z], [2.4, .16, .24], transportColors.dark));
      for (const side of [-1, 1]) parts.push(box("位于带面两侧的输送机真实竖向托座", [side * .86, 1.23, z], [.14, .14, .24], transportColors.dark));
    }
    for (const z of [-4.85, 7.65]) parts.push(cylinder("连续带底两端的实际回转滚筒", [0, 1.37, z], [.26, 1.6, .26], transportColors.trim, [0, 0, 90]), cylinder("连续带底滚筒外伸承轴", [0, 1.37, z], [.07, 1.9, .07], transportColors.dark, [0, 0, 90]));
    parts.push(box("料仓内全部长度的连续承料带面", [0, 1.5, 1.4], [1.56, .03, 12.5], transportColors.dark), box("同一料仓皮带的下部回程带", [0, 1.24, 1.4], [1.56, .03, 12.5], transportColors.dark), box("不封住带底的料仓后端立壁", [0, 2.87, 7.64], [2.76, 2.68, .09], transportColors.signal), box("前出料口上方不挡物流的横撑", [0, 4.21, -4.82], [2.8, .12, .12], transportColors.dark), box("前转运皮带回转座下部承梁", [0, 1.06, -4.9], [2.3, .23, .45], transportColors.dark), ring("前转运皮带的承力回转支圈", transportColors.body, .52, .14, 1.2, .18, { position: { x: 0, y: 1.2, z: -4.9 } }));
    const conveyor: ModelPart[] = [];
    for (const side of [-1, 1]) conveyor.push(box("可回转前转运皮带的箱形边梁", [side * .84, .13, -2.4], [.13, .22, 5.1], transportColors.signal));
    for (const z of [0, -4.8]) conveyor.push(cylinder("前转运皮带端部滚筒", [0, .18, z], [.29, 1.55, .29], transportColors.trim, [0, 0, 90]), cylinder("前转运滚筒穿入边梁的承轴", [0, .18, z], [.07, 1.9, .07], transportColors.dark, [0, 0, 90]));
    conveyor.push(box("前转运皮带上部连续带面", [0, .325, -2.4], [1.5, .025, 4.8], transportColors.dark), box("前转运皮带下部连续回程带", [0, .035, -2.4], [1.5, .025, 4.8], transportColors.dark));
    for (const z of [-.8, -2.4, -4]) conveyor.push(box("转运皮带下部贯通横联", [0, -.015, z], [1.8, .12, .13], transportColors.dark));
    const pivot: Triple = [0, 1.14, -4.9], rotation = new Quaternion().setFromEuler(new Euler(25 * Math.PI / 180, -22 * Math.PI / 180, 0, "YXZ"));
    for (const value of conveyor) {
      const position = new Vector3(value.position.x, value.position.y, value.position.z).applyQuaternion(rotation).add(new Vector3(...pivot));
      const orientation = new Euler().setFromQuaternion(rotation.clone().multiply(new Quaternion().setFromEuler(new Euler(value.rotation.x * Math.PI / 180, value.rotation.y * Math.PI / 180, value.rotation.z * Math.PI / 180))));
      value.position = { x: position.x, y: position.y, z: position.z };
      value.rotation = { x: orientation.x * 180 / Math.PI, y: orientation.y * 180 / Math.PI, z: orientation.z * 180 / Math.PI };
      parts.push(value);
    }
    const endVector = new Vector3(0, -.055, -2.4).applyQuaternion(rotation).add(new Vector3(...pivot));
    const start: Triple = [1.15, 1.18, -6.2], middleVector = new Vector3(...start).lerp(endVector, .62), middle: Triple = [middleVector.x, middleVector.y, middleVector.z];
    parts.push(box("托举油缸下铰点连接底部边梁的耳座", [1.15, 1.12, -6.2], [.3, .25, .42], transportColors.dark), rod("前转运皮带下部托举缸筒", start, middle, .18, transportColors.body), rod("托举缸活塞杆实际接入转运皮带下框", middle, [endVector.x, endVector.y, endVector.z], .09, transportColors.trim), box("料仓前方独立输送驱动动力箱", [-.62, 1.74, -7.7], [1.1, 1.18, 2.1], transportColors.body), box("输送驱动动力箱散热面", [-1.19, 1.74, -7.7], [.035, .8, 1.6], transportColors.dark), box("动力箱与车架的真实承托底台", [-.62, 1.12, -7.7], [1.3, .16, 2.3], transportColors.dark));
    return parts;
  } },
  { name: "封闭装料槽集烟罩轨行熔炼炉加料机", theme: "现代", tags: ["铝熔炼厂加料", "有壁装料槽", "液压推料挡板", "炉门对接集烟罩"], create: () => {
    const parts: ModelPart[] = [...industrialFrame(4.1, 8.2), part("有厚底和双高侧壁且两端贯通的装料槽", "extrude", transportColors.body, [0, 0, -1.25], [1, 1, 1], [0, 0, 0], { depth: 8.5, profile: [{ x: -1.25, y: 1.5 }, { x: 1.25, y: 1.5 }, { x: 1.25, y: 3.2 }, { x: 1.12, y: 3.2 }, { x: 1.12, y: 1.66 }, { x: -1.12, y: 1.66 }, { x: -1.12, y: 3.2 }, { x: -1.25, y: 3.2 }] })];
    for (const side of [-1, 1]) {
      parts.push(box("把前伸装料槽承托在底架上的长滑梁", [side * .9, 1.46, -1], [.26, .2, 9.2], transportColors.dark), box("推料挡板两旁的长向导轨", [side * .98, 1.81, 1], [.12, .15, 3.8], transportColors.dark), box("前部集烟罩从槽壁接至顶盖的侧壁", [side * 1.25, 3.26, -3.6], [.13, .25, 3.8], transportColors.body));
      for (const z of [-5.1, -3, -.9, 1.2, 2.7]) parts.push(box("装料槽外部不占料腔的竖向加强肋", [side * 1.31, 2.37, z], [.12, 1.82, .12], transportColors.dark));
    }
    const exhaustHole: [number, number][] = Array.from({ length: 12 }, (_, index) => { const angle = index * Math.PI / 6; return [Math.cos(angle) * .33, -.3 + Math.sin(angle) * .33]; });
    parts.push(polygon("具有真实抽烟管通孔的集烟罩顶板", transportColors.body, [[-1.35, -1.9], [1.35, -1.9], [1.35, 1.9], [-1.35, 1.9]], .1, [0, 3.31, -3.6], [exhaustHole]), ring("从集烟罩顶孔向上的真实空心抽烟管", transportColors.dark, .36, .05, 0, 1.1, { position: { x: 0, y: 3.96, z: -3.9 } }), box("装料槽内可前推的独立推料挡板", [0, 2.38, 1.5], [2.04, 1.4, .18], transportColors.dark), box("推料油缸后方支承立座", [0, 1.95, 3.7], [.55, 1.2, .55], transportColors.dark), rod("沿装料槽轴线伸入的长行程缸体", [0, 2.2, 3.9], [0, 2.2, 2.7], .25, transportColors.body), rod("油缸伸至独立推料挡板背面的活塞杆", [0, 2.2, 2.7], [0, 2.2, 1.59], .12, transportColors.trim), box("侧置动力箱承接底纵梁的独立底台", [-1.85, 1.5, 2.6], [.8, .2, 2.4], transportColors.dark), box("与装料槽分开的侧置驱动动力箱", [-1.85, 2.15, 2.6], [.8, 1.3, 2.4], transportColors.signal), box("动力箱外侧散热板", [-2.27, 2.15, 2.6], [.035, .9, 1.8], transportColors.dark), box("面向检修位的加料机操作箱", [-1.85, 2.24, 3.84], [.67, .62, .12], transportColors.body));
    return parts;
  } },
  { name: "双承重索复绕起吊缆索吊行走小车", theme: "现代", tags: ["施工缆索起重", "独立运行载体", "双承重索槽轮", "复绕起升滑轮和独立下钩组"], create: () => {
    const parts: ModelPart[] = [];
    for (const side of [-1, 1]) parts.push(box("承索轮下方的连续长向主梁", [side * .9, 3.98, 0], [.25, .23, 4.5], transportColors.dark));
    for (const end of [-1, 1]) parts.push(box("连接两条承索走行边梁的端横框", [0, 3.98, end * 2.05], [2.3, .23, .2], transportColors.dark));
    parts.push(box("承接起升滑轮轴挂架的中央横梁", [0, 3.98, 0], [2.3, .25, .3], transportColors.signal), strut("小车平面左侧斜向承力撑", [-.9, 3.98, -2.05], [.9, 3.98, 2.05], .09), strut("小车平面右侧斜向承力撑", [.9, 3.98, -2.05], [-.9, 3.98, 2.05], .09));
    for (const side of [-1, 1]) for (const z of [-1.4, 1.4]) {
      parts.push(part("沿承重索行走的双轮缘深槽轮", "lathe", transportColors.body, [side * .9, 4.6, z], [1, 1, 1], [0, 0, 90], { profile: [{ x: .07, y: -.13 }, { x: .38, y: -.13 }, { x: .38, y: -.075 }, { x: .32, y: -.035 }, { x: .32, y: .035 }, { x: .38, y: .075 }, { x: .38, y: .13 }, { x: .07, y: .13 }, { x: .07, y: -.13 }] }), cylinder("穿过承重槽轮的水平轮轴", [side * .9, 4.6, z], [.14, .76, .14], transportColors.trim, [0, 0, 90]), box("横跨走行主梁并接实两侧轴承板的轮架鞍座", [side * .9, 3.98, z], [.8, .14, .3], transportColors.dark));
      for (const edge of [-1, 1]) parts.push(strut("避开槽轮盘面的真实轴承悬挂板", [side * .9 + edge * .26, 3.98, z], [side * .9 + edge * .26, 4.6, z], .1));
    }
    for (const x of [-.4, .4]) for (const y of [1.35, 3.45]) parts.push(part("起升绳复绕的带槽滑轮", "lathe", transportColors.trim, [x, y, 0], [1, 1, 1], [0, 0, 90], { profile: [{ x: .045, y: -.085 }, { x: .25, y: -.085 }, { x: .25, y: -.05 }, { x: .22, y: -.022 }, { x: .22, y: .022 }, { x: .25, y: .05 }, { x: .25, y: .085 }, { x: .045, y: .085 }, { x: .045, y: -.085 }] }));
    parts.push(cylinder("上滑轮组穿过轮心的贯通承轴", [0, 3.45, 0], [.09, 1.85, .09], transportColors.dark, [0, 0, 90]), cylinder("下滑轮组穿过轮心的贯通承轴", [0, 1.35, 0], [.09, 1.85, .09], transportColors.dark, [0, 0, 90]));
    for (const side of [-1, 1]) parts.push(strut("上滑轮轴到运行小车的外悬挂板", [side * .8, 3.45, 0], [side * .8, 3.98, 0], .14), box("下滑轮组避开轮盘的外侧夹板", [side * .8, 1.35, 0], [.13, .62, .7], transportColors.dark));
    for (const x of [-.4, .4]) parts.push(box("提升绳固定端接入中央横梁的锚座", [x, 3.98, -.235], [.12, .18, .24], transportColors.body), part("由锚座下绕钩组再经上滑轮导向外部卷扬的提升绳", "tube", transportColors.dark, [x, 0, 0], [1, 1, 1], [0, 0, 0], { radius: .014, path: [{ x: 0, y: 3.98, z: -.235 }, { x: 0, y: 1.35, z: -.235 }, { x: 0, y: 1.18, z: -.166 }, { x: 0, y: 1.115, z: 0 }, { x: 0, y: 1.18, z: .166 }, { x: 0, y: 1.35, z: .235 }, { x: 0, y: 3.45, z: .235 }, { x: 0, y: 3.62, z: .166 }, { x: 0, y: 3.685, z: 0 }, { x: 0, y: 3.685, z: -2.4 }] }));
    parts.push(box("下钩组两片夹板间的承力底横梁", [0, 1.03, 0], [1.72, .14, .32], transportColors.dark), cylinder("独立下吊钩的竖向回转吊杆", [0, .78, 0], [.2, .5, .2], transportColors.trim), part("具有真实开口和厚度的缆索吊下吊钩", "extrude", transportColors.body, [0, .05, 0], [1, 1, 1], [0, 0, 0], { depth: .16, profile: [{ x: -.08, y: .64 }, { x: -.15, y: .45 }, { x: -.24, y: .26 }, { x: -.2, y: .08 }, { x: -.03, y: -.02 }, { x: .19, y: .06 }, { x: .31, y: .22 }, { x: .3, y: .4 }, { x: .21, y: .37 }, { x: .2, y: .23 }, { x: .1, y: .13 }, { x: -.02, y: .1 }, { x: -.1, y: .16 }, { x: -.12, y: .25 }, { x: -.06, y: .4 }, { x: .08, y: .6 }, { x: .08, y: .64 }] }), box("牵引绳在运行小车端部的实际夹持座", [0, 4.11, 2.05], [.5, .25, .35], transportColors.body));
    return parts;
  } },
];
