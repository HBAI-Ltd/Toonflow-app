import { part, ring, type ModelPart } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { rod } from "../masterObjects/parts";
import { industrialFrame } from "./railExpansionBatchEight";
import { archedRoof } from "./railExpansionBatchThree";
import { box, cylinder, strut, transportColors, type TransportDefinition } from "./parts";

// 原创简化造型按独立设备构造建模，不把地区型号、载荷、颜色或损坏状态计成新主素材。
// https://www.dango-dienenthal.com/en/products/series/rail-bound-forging-manipulators/
// https://cablecarmuseum.org/the-grip.html
export const railExpansionBatchEleven: TransportDefinition[] = [
  { name: "升降回转夹坯式轨行锻造操作机", theme: "现代", tags: ["自由锻辅助设备", "完整空载操作机", "可回转夹坯钳", "双位吊承及独立轨行底架"], create: () => {
    const parts: ModelPart[] = [...industrialFrame(4, 8.4), box("连接行走底架与夹坯吊承的机器底座", [0, 1.5, 0], [3.75, .2, 7.8], transportColors.dark), box("后部液压与平衡设备机体", [0, 2.7, 2.5], [3.45, 2.6, 2.2], transportColors.signal), cylinder("穿过前后两吊承的可回转夹钳长轴", [0, 2.8, -2.225], [.88, 6.65, .88], transportColors.body, [90, 0, 0]), cylinder("长轴后端独立回转驱动接头", [0, 2.8, 1.27], [1, .5, 1], transportColors.dark, [90, 0, 0]), box("回转驱动接头下方的实际承座", [0, 1.9, 1.2], [.95, .95, .7], transportColors.dark), ring("夹钳前端回转轴的加强套圈", transportColors.dark, .62, .15, 0, .6, { position: { x: 0, y: 2.8, z: -5.55 }, rotation: { x: 90, y: 0, z: 0 } })];
    for (const z of [-1.8, .8]) {
      parts.push(ring("不堵住回转长轴的吊承轴承环", transportColors.dark, .66, .18, 0, .35, { position: { x: 0, y: 2.8, z }, rotation: { x: 90, y: 0, z: 0 } }));
      for (const side of [-1, 1]) parts.push(cylinder("吊承外壳两侧而不穿过回转长轴的短耳轴", [side * .73, 2.8, z], [.18, .32, .18], transportColors.trim, [0, 0, 90]), strut("平行吊承从底架上升的后倾主连杆", [side * 1.35, 1.6, z + .45], [side * .8, 2.8, z], .19, transportColors.dark), strut("平行吊承前侧独立升降连杆", [side * 1.35, 1.6, z - .45], [side * .8, 2.8, z], .16, transportColors.dark), cylinder("升降连杆底部真实水平铰销", [side * 1.35, 1.64, z + .45], [.15, .42, .15], transportColors.trim, [0, 0, 90]));
    }
    for (const side of [-1, 1]) {
      parts.push(part("夹坯钳具有真实开口的独立长钳臂", "extrude", transportColors.body, [0, 2.8, -5.55], [1, 1, 1], [0, 90, 0], { depth: .75, profile: [{ x: 0, y: side * .22 }, { x: .4, y: side * .22 }, { x: 1.25, y: side * .68 }, { x: 1.85, y: side * .68 }, { x: 1.85, y: side * .43 }, { x: 1.38, y: side * .43 }, { x: .65, y: side * -.03 }, { x: 0, y: side * -.03 }] }), box("钳臂前端独立可见的宽夹持面", [0, 2.8 + side * .55, -7.2], [.86, .25, .45], transportColors.dark), rod("夹钳张闭缸外筒", [.57, 2.8 + side * .18, -5.42], [.5, 2.8 + side * .26, -6.05], .17, transportColors.dark), rod("从张闭缸伸至钳臂的活塞杆", [.5, 2.8 + side * .26, -6.05], [.45, 2.8 + side * .3, -6.4], .08, transportColors.trim), cylinder("夹钳活塞杆与钳臂实际连接的横向铰销", [0, 2.8 + side * .3, -6.4], [.12, 1.04, .12], transportColors.dark, [0, 0, 90]));
    }
    parts.push(box("侧面轨行驱动液压马达箱", [1.55, 1.89, -.05], [.52, .58, 1.2], transportColors.body), box("后机体外侧的控制柜", [-1.58, 2.5, 1.34], [.58, 1.65, .2], transportColors.body), box("控制柜面向检修位的操作面板", [-1.58, 2.65, 1.22], [.43, .5, .025], transportColors.dark), box("后机体上部维修盖板", [0, 4.04, 2.5], [3.2, .1, 1.97], transportColors.body));
    return parts;
  } },
  { name: "地下抓索牵引半开敞式城市缆车", theme: "欧式", tags: ["历史城市缆车", "地下连续牵引索", "独立底部抓索钳", "半开敞乘客车厢", "机械手柄操纵"], create: () => {
    const parts: ModelPart[] = [];
    for (const side of [-1, 1]) parts.push(box("城市缆车木地板下的通长承力边梁", [side * .92, .79, 0], [.16, .24, 7.8], transportColors.dark));
    for (const z of [-2.9, -1.9, 1.9, 2.9]) {
      parts.push(cylinder("窄轨缆车的贯通轮轴", [0, .36, z], [.085, 2.15, .085], transportColors.dark, [0, 0, 90]), box("缆车走行架的上承重横梁", [0, .83, z], [2.03, .2, .18], transportColors.dark));
      for (const side of [-1, 1]) parts.push(part("窄轨缆车具有内侧轮缘的钢轮", "lathe", transportColors.dark, [side * .575, .36, z], [1, 1, 1], [0, 0, -side * 90], { profile: [{ x: .043, y: -.075 }, { x: .36, y: -.075 }, { x: .36, y: -.035 }, { x: .325, y: -.025 }, { x: .325, y: .065 }, { x: .043, y: .065 }, { x: .043, y: -.075 }] }), box("与钢轮盘分开的外侧轴承座", [side * .92, .36, z], [.2, .2, .24], transportColors.body), strut("轴承座实际吊接到底部承力边梁", [side * .92, .36, z], [side * .92, .79, z], .11));
    }
    parts.push(polygon("为地下抓索操纵立杆留孔的完整乘客地板", transportColors.wood, [[-1.15, -4.1], [1.15, -4.1], [1.15, 4.1], [-1.15, 4.1]], .12, [0, .94, 0], [[[-.105, -1.61], [.105, -1.61], [.105, -1.39], [-.105, -1.39]]]), archedRoof(2.48, 8.6, 3.02));
    for (const side of [-1, 1]) {
      parts.push(box("后部封闭客室的半高木侧壁", [side * 1.075, 1.45, 1.52], [.12, .78, 4.15], transportColors.wood), box("后部客室侧窗连续玻璃", [side * 1.08, 2.25, 1.52], [.035, .8, 4.1], transportColors.glass), box("客室侧窗上方木过梁", [side * 1.075, 2.87, 1.52], [.13, .3, 4.3], transportColors.wood), box("前部开放站台朝外的长座垫", [side * .87, 1.43, -2.25], [.48, .12, 2.55], transportColors.wood), box("前部开放座椅靠内一侧的长靠背", [side * .56, 1.74, -2.25], [.08, .61, 2.55], transportColors.wood));
      for (const z of [-.55, .5, 1.55, 2.6, 3.59]) parts.push(box("连续玻璃外侧真实接顶的客室窗柱", [side * 1.075, 2.42, z], [.09, 1.15, .09], transportColors.wood));
      for (const z of [-3.72, -.8]) parts.push(box("开放站台从地板接至车顶的细立柱", [side * 1.08, 2.08, z], [.075, 2.07, .075], transportColors.wood));
      for (const z of [-3.15, -1.35]) parts.push(box("开放长座垫下方的实际支脚", [side * .87, 1.24, z], [.12, .3, .12], transportColors.dark));
      parts.push(box("端部客室门洞两旁的木墙", [side * .72, 1.55, -.58], [.76, .98, .09], transportColors.wood), box("门洞两旁木墙上方的真实玻璃窗", [side * .72, 2.42, -.58], [.67, .76, .035], transportColors.glass), box("客室通行门洞两侧的竖向木门框", [side * .34, 2.45, -.58], [.075, .94, .1], transportColors.wood));
    }
    parts.push(box("后客室完整木质端墙", [0, 1.45, 3.59], [2.15, .78, .1], transportColors.wood), box("后客室端墙上方玻璃窗", [0, 2.25, 3.59], [2, .8, .035], transportColors.glass), box("后端玻璃窗上方接入车顶的木过梁", [0, 2.87, 3.59], [2.23, .3, .13], transportColors.wood), box("保留成人通行高度的前门洞顶部木门楣", [0, 2.96, -.58], [2.23, .12, .12], transportColors.wood));
    // ACT: 抓索钳的真实机构位于钢轮底边以下；最低实体仍归零，铺设道路时按轮底边对齐。
    parts.push(box("抓索立杆下方横接车底的承力横条", [0, .84, -1.5], [2, .16, .25], transportColors.dark), box("穿过地板预留孔而伸入地下索槽的抓索刀杆", [0, .43, -1.5], [.12, 1.34, .12], transportColors.dark), box("抓索操纵杆的地板上方导向座", [0, 1.14, -1.5], [.21, .26, .2], transportColors.body), cylinder("手动抓索操纵杆下部水平铰销", [0, 1.25, -1.5], [.085, .4, .085], transportColors.trim, [0, 0, 90]), strut("从抓索导向座上伸出的倾斜操纵手柄", [0, 1.25, -1.5], [0, 2.24, -1], .045, transportColors.dark), cylinder("操纵手柄顶端的横向握把", [0, 2.24, -1], [.055, .38, .055], transportColors.wood, [0, 0, 90]));
    for (const side of [-1, 1]) parts.push(part("围成真实缆孔的半圆内衬抓索钳瓣", "extrude", transportColors.dark, [0, 0, -1.5], [1, 1, 1], [0, 0, 0], { depth: .45, profile: [{ x: side * -.14, y: -.48 }, { x: side * -.14, y: -.26 }, { x: 0, y: -.26 }, { x: 0, y: -.315 }, { x: side * -.032, y: -.328 }, { x: side * -.045, y: -.36 }, { x: side * -.032, y: -.392 }, { x: 0, y: -.405 }, { x: 0, y: -.48 }] }));
    parts.push(cylinder("穿过抓索钳真实孔道的短牵引索段", [0, -.36, -1.5], [.05, 1.4, .05], transportColors.trim, [90, 0, 0]), box("抓索钳底部外侧防砂护板", [0, -.505, -1.5], [.42, .05, .55], transportColors.body));
    return parts;
  } },
];
