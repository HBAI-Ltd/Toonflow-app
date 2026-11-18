import { part, ring, type ModelPart, type Triple } from "../assetModelParts";
import { rod } from "../masterObjects/parts";
import { box, cylinder, strut, transportColors, type TransportDefinition } from "./parts";

// 独立移动整机，不含桥梁、桥下固定轨或摄影机；原创建模不复刻厂商外观、商标或制造图。
// https://www.haki.com/case-studies/technispan-mobile-gantry-enables-forth-rail-bridge-repairs
// https://spencerbridgeengineering.co.uk/capabilities/permanent-underdeck-gantries/
// https://www.chapman-leonard.com/product/hybrid-iv/
export const railExpansionBatchThirteen: TransportDefinition[] = [
  { name: "双悬挂端架全跨桥底检修桁车", theme: "现代", tags: ["桥底检修移动平台", "双端吊挂轨行", "全跨桁架走台", "实际连续人员通道"], create: () => {
    const parts: ModelPart[] = [box("横贯桥下全幅的完整检修走台地板", [0, .27, 0], [14.4, .12, 1.4], transportColors.body)];
    const columns = [-7, -4.2, -1.4, 1.4, 4.2, 7];
    for (const end of [-1, 1]) {
      for (const y of [.15, 1.3]) parts.push(box("走台两侧连续承力桁架上下弦", [0, y, end * .65], [14.4, .12, .12], transportColors.dark));
      for (const x of columns) parts.push(box("同时用作护栏的桁架真实竖向腹杆", [x, .73, end * .65], [.08, 1.15, .08], transportColors.dark));
      for (let index = 0; index < columns.length - 1; index++) parts.push(strut("桁架相邻节点之间的连续三角斜腹杆", [columns[index]!, index % 2 ? 1.3 : .15, end * .65], [columns[index + 1]!, index % 2 ? .15 : 1.3, end * .65], .065, transportColors.dark));
    }
    for (const side of [-1, 1]) {
      const x = side * 6.9;
      parts.push(box("检修走台端部连接两条桁架的底横梁", [x, .15, 0], [.2, .14, 1.45], transportColors.dark));
      for (const end of [-1, 1]) parts.push(box("由走台端部实际升至行走轮架的吊挂柱", [x, 2.1, end * .55], [.19, 3.8, .19], transportColors.signal), box("吊挂柱上端接实两侧轮架的水平横座", [x, 4, end * .55], [1.03, .2, .2], transportColors.dark));
      for (const edge of [-1, 1]) parts.push(box("悬轨轮架两侧的连续长向承梁", [x + edge * .43, 4, 0], [.13, .2, 1.7], transportColors.dark));
      for (const z of [-.55, .55]) for (const edge of [-1, 1]) parts.push(cylinder("在桥下工字轨下翼上行走的承重轮", [x + edge * .22, 4.6, z], [.36, .15, .36], transportColors.body, [0, 0, 90]), cylinder("不横穿工字轨腹板的独立短轮轴", [x + edge * .3, 4.6, z], [.085, .34, .085], transportColors.trim, [0, 0, 90]), strut("轮盘外侧接至下方轮架的轴承悬挂板", [x + edge * .43, 4, z], [x + edge * .43, 4.6, z], .085, transportColors.dark));
      parts.push(box("端部轨行轮组的独立电动驱动箱", [x + .64, 4.35, .55], [.34, .5, .55], transportColors.body), cylinder("驱动箱接到同侧行走轮轴的水平接头", [x + .48, 4.6, .55], [.13, .35, .13], transportColors.dark, [0, 0, 90]));
    }
    for (const end of [-1, 1]) parts.push(rod("端部维护直梯的连续侧立杆", [-6.9, .3, end * .35], [-6.9, 3.8, end * .35], .045, transportColors.dark), strut("直梯顶部接入吊挂柱的短固定托", [-6.9, 3.7, end * .35], [-6.9, 3.7, end * .55], .05));
    for (let index = 0; index < 8; index++) parts.push(cylinder("端部直梯连续横向踏棍", [-6.9, .5 + index * .43, 0], [.045, .7, .045], transportColors.trim, [90, 0, 0]));
    return parts;
  } },
  { name: "四连杆液压升降载人轨道摄影车", theme: "现代", tags: ["完整载人摄影dolly", "真实圆管轨槽轮", "四连杆升降台", "摄影员座位与踏台", "空载相机快装座"], create: () => {
    const parts: ModelPart[] = [box("可供人员站立的完整摄影车底台", [0, .42, 0], [1.22, .16, 1.65], transportColors.dark), box("与底台实际连接的前伸人员脚踏板", [0, .4, -.98], [1.2, .16, .4], transportColors.body), box("与底台连接的后部推车踏板", [0, .4, .98], [1.2, .16, .4], transportColors.body), box("摄影车底台上的液压及升降驱动机体", [0, .66, .2], [.75, .4, .9], transportColors.body)];
    for (const side of [-1, 1]) for (const end of [-1, 1]) {
      const x = side * .55, z = end * .65;
      parts.push(box("双槽轮行走轮组的上连接鞍座", [x, .35, z], [.45, .1, .46], transportColors.dark));
      for (const offset of [-.12, .12]) parts.push(part("在摄影圆管轨上滚动的真实V槽轮", "lathe", transportColors.dark, [x, .115, z + offset], [1, 1, 1], [0, 0, 90], { profile: [{ x: .017, y: -.055 }, { x: .105, y: -.055 }, { x: .105, y: -.032 }, { x: .085, y: 0 }, { x: .105, y: .032 }, { x: .105, y: .055 }, { x: .017, y: .055 }, { x: .017, y: -.055 }] }), cylinder("V槽轮接入外侧轴承板的短轮轴", [x, .115, z + offset], [.034, .4, .034], transportColors.trim, [0, 0, 90]));
      parts.push(box("避开槽轮轮盘并接实鞍座的外侧轴承板", [side * .7, .24, z], [.08, .27, .39], transportColors.body));
    }
    for (const side of [-1, 1]) {
      parts.push(box("升降四连杆后端的独立竖向承板", [side * .32, .84, -.1], [.1, .36, .3], transportColors.dark), strut("四连杆升降机构的下平行臂", [side * .25, .74, -.1], [side * .25, 1.4, -.9], .075, transportColors.body), strut("四连杆升降机构的上平行臂", [side * .25, .92, -.1], [side * .25, 1.58, -.9], .075, transportColors.body), box("相机升降台前端与两平行臂连接的竖板", [side * .32, 1.49, -.9], [.1, .36, .23], transportColors.dark));
      parts.push(rod("后部手推把手连续侧立杆", [side * .42, .5, .75], [side * .42, 1.1, 1], .04, transportColors.dark));
    }
    for (const y of [1.4, 1.58]) parts.push(cylinder("前升降平行臂连接两端竖板的实际铰轴", [0, y, -.9], [.08, .75, .08], transportColors.trim, [0, 0, 90]));
    parts.push(cylinder("升降臂中段接入液压杆的横向支轴", [0, 1.2, -.66], [.1, .65, .1], transportColors.dark, [0, 0, 90]), cylinder("升降相机台上部实际竖向承柱", [0, 1.62, -.9], [.11, .2, .11], transportColors.trim), cylinder("承接空载快装座的水平安装法兰", [0, 1.73, -.9], [.3, .08, .3], transportColors.dark), ring("具有真实中央安装孔的相机快装承座", transportColors.body, .16, .06, 1.78, .1, { position: { x: 0, y: 1.78, z: -.9 } }), strut("摄影员座位底部横接底台的承力短臂", [0, .5, .2], [.65, .5, .2], .1), cylinder("可供人员乘坐的座椅支柱", [.62, .775, .2], [.11, .55, .11], transportColors.trim), cylinder("摄影员独立圆形坐垫", [.62, 1.1, .2], [.46, .1, .46], transportColors.dark), box("摄影员座位前方的独立脚踏板", [.76, .6, -.28], [.45, .08, .55], transportColors.dark), rod("座椅支柱连接脚踏板的实际斜撑", [.62, .66, .2], [.76, .6, -.28], .045, transportColors.trim), cylinder("手推把手顶部连接两立杆的横握杆", [0, 1.1, 1], [.04, .92, .04], transportColors.dark, [0, 0, 90]));
    const start: Triple = [0, .66, .2], end: Triple = [0, 1.2, -.66], middle: Triple = [0, .66 + (1.2 - .66) * .62, .2 + (-.66 - .2) * .62];
    parts.push(rod("摄影车升降机构的液压缸外筒", start, middle, .095, transportColors.dark), rod("液压缸伸到平行臂中段支轴的活塞杆", middle, end, .045, transportColors.trim));
    return parts;
  } },
];
