import { part, ring, type ModelPart } from "../assetModelParts";
import { steelWheelset } from "./railExpansionBatchOne";
import { archedRoof, runningFrame } from "./railExpansionBatchThree";
import { box, cab, cylinder, strut, transportColors, type TransportDefinition } from "./parts";

// 原创场景外形，参考类别而非制造图，所有车辆保持静态模型职责。
// https://www.festrail.co.uk/locomotives/
// https://linsinger.com/rail-technology/
// https://technology.plassertheurer.com/en/dynamischeGleisstabilisation/dgs-mode-of-operation
// https://technology.plassertheurer.com/en/stopfen/der-schl%C3%BCssel-zur-fehlerkorrektur
// https://collection.sciencemuseumgroup.org.uk/objects/co441512/model-railway-gun
export const railExpansionBatchFive: TransportDefinition[] = [
  { name: "中央驾驶室双锅炉对向铰接蒸汽机车", tags: ["费尔利构型", "对向双锅炉共用中央炉室", "两端独立动力转架"], create: () => {
    const parts: ModelPart[] = [box("两动力转架之间的整体锅炉承梁", [0, 1.2, 0], [2.1, .34, 10.7], transportColors.dark), box("中央共用炉室模型", [0, 2.22, 0], [1.5, 1.65, 1.4], transportColors.body), box("环绕中炉室的驾驶室底板", [0, 1.41, 0], [2.65, .15, 2.7], transportColors.wood), archedRoof(2.85, 3, 3.87)];
    for (const side of [-1, 1]) parts.push(box("中央驾驶室侧面下围", [side * 1.25, 2.03, 0], [.09, 1.1, 2.6], transportColors.body), ...[-1.23, 1.23].map(z => box("驾驶室窗两侧承重立柱", [side * 1.25, 3.2, z], [.1, 1.3, .13], transportColors.dark)), part("中央驾驶室通透长侧窗", "box", transportColors.glass, [side * 1.25, 3.19, 0], [.03, 1.15, 2.25], [0, 0, 0], { opacity: .48 }));
    for (const end of [-1, 1]) {
      parts.push(cylinder("从中央炉室向外伸出的独立锅炉", [0, 2.28, end * 2.7], [1.6, 4.75, 1.6], transportColors.body, [90, 0, 0]), cylinder("锅炉外端烟箱面", [0, 2.28, end * 5.12], [1.62, .13, 1.62], transportColors.dark, [90, 0, 0]), cylinder("双锅炉各自独立的烟囱", [0, 3.63, end * 4.45], [.34, 1.2, .34], transportColors.dark), cylinder("每侧锅炉独立蒸汽穹顶", [0, 3.21, end * 2.1], [.54, .56, .54], transportColors.trim), box("各端独立回转的动力轮架", [0, .94, end * 3.5], [2.1, .25, 3.5], transportColors.dark), cylinder("动力轮架与锅炉承梁回转枢轴", [0, 1.08, end * 3.5], [.6, .25, .6], transportColors.trim), ...[-.9, .9].flatMap(offset => steelWheelset(end * 3.5 + offset)), box("机车外端缓冲梁", [0, 1.02, end * 5.42], [2.4, .26, .2], transportColors.dark));
      for (const side of [-1, 1]) {
        parts.push(box("锅炉两侧分别配置的长形水箱", [side * .91, 1.78, end * 2.8], [.45, 1.0, 3.3], transportColors.body), cylinder("动力转架外侧工作汽缸", [side * 1.01, .92, end * 4.66], [.36, .64, .36], transportColors.body, [90, 0, 0]), strut("两动力车轴之间联动杆", [side * 1.02, .65, end * 3.5 - .9], [side * 1.02, .65, end * 3.5 + .9], .08, transportColors.trim), strut("汽缸连接外端曲柄的活塞连杆", [side * 1.02, .92, end * 4.66], [side * 1.02, .65, end * 4.4], .065, transportColors.trim), strut("锅炉至独立动力转架的蒸汽支管", [side * .7, 2.1, end * 3.8], [side * 1.01, .92, end * 4.66], .09, transportColors.dark));
        for (const offset of [-.9, .9]) parts.push(cylinder("联动杆车轴曲柄销", [side * .98, .65, end * 3.5 + offset], [.12, .23, .12], transportColors.trim, [0, 0, 90]));
      }
    }
    return parts;
  } },
  { name: "双铣轮钢轨再成型作业车", theme: "现代", tags: ["钢轨铣削", "开放式轨面切削单元", "切屑抽吸收集"], create: () => {
    const parts: ModelPart[] = [...runningFrame(16, [-6.3, -4.7, 4.7, 6.3]), ...cab([0, 1.25, -6.3], [2.5, 2.2, 2.4]), box("后部独立动力与切屑收集舱", [0, 2.21, 4.45], [2.45, 1.95, 5.4], transportColors.body), box("前司机室下方承载平台", [0, 1.17, -5.15], [2.5, .2, 5.4], transportColors.dark), box("后设备舱下方承载平台", [0, 1.17, 4.45], [2.5, .2, 5.4], transportColors.dark), box("跨越中部作业净空的高位承梁", [0, 2.15, -.15], [2.4, .23, 5.3], transportColors.dark)];
    for (const side of [-1, 1]) {
      const x = side * .72;
      parts.push(box("铣削头竖直精调滑座", [x, 1.7, -.15], [.46, .75, .65], transportColors.signal), cylinder("沿车轴方向布置的厚铣轮", [x, .6, -.15], [.96, .29, .96], transportColors.dark, [0, 0, 90]), cylinder("铣轮外侧驱动轴颈", [x + side * .23, .6, -.15], [.15, .25, .15], transportColors.trim, [0, 0, 90]), strut("竖直滑座外侧到铣轮轴的承力臂", [x + side * .25, 1.63, -.15], [x + side * .25, .6, -.15], .13, transportColors.signal));
      const profile = [...Array.from({ length: 13 }, (_, i) => { const a = i * Math.PI / 12; return { x: Math.cos(a) * .64, y: Math.sin(a) * .64 }; }), ...Array.from({ length: 13 }, (_, i) => { const a = (12 - i) * Math.PI / 12; return { x: Math.cos(a) * .58, y: Math.sin(a) * .58 }; })];
      parts.push(part("铣轮上半圆薄壁集屑罩", "extrude", transportColors.body, [x, .6, -.15], [1, 1, 1], [0, 90, 0], { profile, depth: .43 }), part("集屑罩到后部切屑仓的连续抽吸管", "tube", transportColors.dark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { path: [{ x, y: 1.18, z: -.15 }, { x, y: 1.82, z: .85 }, { x, y: 2.48, z: 1.3 }, { x, y: 2.48, z: 2.45 }], radius: .11 }));
      for (let index = 0; index < 12; index++) {
        const angle = index * Math.PI / 6;
        parts.push(box("铣轮周圈分立切削刀块", [x, .6 + Math.sin(angle) * .52, -.15 + Math.cos(angle) * .52], [.3, .1, .08], transportColors.trim, [90 - index * 30, 0, 0]));
      }
      parts.push(box("后舱侧向维护步道", [side * 1.3, 1.4, 4.45], [.4, .1, 5.4], transportColors.trim));
    }
    return parts;
  } },
  { name: "夹轨横振式道床动力稳定车", theme: "现代", tags: ["道床动力稳定", "对向偏心激振", "轨侧夹持滚轮", "竖直加载缸"], create: () => {
    const parts: ModelPart[] = [...runningFrame(12.5, [-4.8, -3.3, 3.3, 4.8]), ...cab([0, 1.25, -4.8], [2.4, 2, 2.3]), box("尾部液压动力机舱", [0, 2.0, 3.65], [2.4, 1.5, 3.8], transportColors.body), box("工作单元上方整体反力横梁", [0, 1.8, 0], [2.3, .28, 2.6], transportColors.dark), box("位于两轨间的独立激振单元", [0, .64, 0], [1.25, .4, 1.6], transportColors.signal)];
    for (const side of [-1, 1]) {
      parts.push(cylinder("激振单元顶部独立反向偏心转子", [side * .33, .93, 0], [.48, .15, .48], transportColors.dark), box("转子上可见的偏心质量块", [side * .45, 1.05, 0], [.2, .12, .18], transportColors.trim), cylinder("上反力梁至激振单元的竖直加载缸", [side * .5, 1.35, 0], [.2, .7, .2], transportColors.dark), cylinder("加载缸下端接至激振单元的活塞杆", [side * .5, .91, 0], [.08, .3, .08], transportColors.trim), strut("工作单元向两根钢轨伸出的横托臂", [side * .4, .58, 0], [side * .72, .36, 0], .12, transportColors.dark));
      for (const z of [-.63, .63]) {
        parts.push(cylinder("压在轨面上的连续加载导向轮", [side * .72, .2, z], [.3, .14, .3], transportColors.dark, [0, 0, 90]), box("轨侧滚轮共同承托架", [side * .72, .36, z], [.55, .17, .34], transportColors.body));
        for (const edge of [-1, 1]) parts.push(cylinder("抵住轨头两侧的水平夹轨滚轮", [side * .72 + edge * .145, .18, z], [.2, .16, .2], transportColors.trim));
      }
    }
    for (const side of [-1, 1]) parts.push(box("车架跨过作业区的侧向高梁", [side * 1.13, 1.55, 0], [.22, .3, 6.2], transportColors.dark));
    return parts;
  } },
  { name: "三点长弦基准轨道几何测量车", theme: "现代", tags: ["轨道几何测量", "前中后三测量小架", "长弦位置基准", "独立记录舱"], create: () => {
    const parts: ModelPart[] = [...runningFrame(15.5, [-6, -4.5, 4.5, 6]), ...cab([0, 1.25, -5.6], [2.4, 2.2, 3.2]), box("后方封闭测量记录室底板", [0, 1.17, 3.9], [2.5, .2, 5.7], transportColors.dark), box("记录舱下部主体", [0, 1.9, 3.9], [2.4, 1.3, 5.6], transportColors.body), box("记录舱上部顶盖", [0, 3.58, 3.9], [2.5, .15, 5.7], transportColors.body), box("前后设备舱之间跨空承梁", [0, 2.05, -.7], [2.35, .3, 5.7], transportColors.dark)];
    for (const side of [-1, 1]) {
      parts.push(part("记录舱连续通透侧窗", "box", transportColors.glass, [side * 1.2, 3.04, 3.9], [.035, .94, 5.45], [0, 0, 0], { opacity: .48 }), ...[1.15, 2.95, 4.75, 6.65].map(z => box("记录舱透窗间立柱", [side * 1.2, 3.03, z], [.1, .98, .09], transportColors.dark)), strut("前中后三测点共用的拉紧钢弦", [side * 1.05, .7, -5.45], [side * 1.05, .7, 5.45], .014, transportColors.trim));
      for (const z of [-5.45, 0, 5.45]) parts.push(box("钢弦在测量小架上的独立支承", [side * 1.05, .58, z], [.07, .3, .13], transportColors.dark), cylinder("与轨面接触的小直径测量滚轮", [side * .72, .18, z], [.3, .1, .3], transportColors.dark, [0, 0, 90]), strut("测量轮至钢弦支承的独立悬臂", [side * .72, .26, z], [side * 1.05, .49, z], .04), box("读取中点相对弦偏移的测头", [side * 1.05, .7, z], [.12, .12, .16], transportColors.signal));
    }
    for (const z of [-5.45, 0, 5.45]) parts.push(box("测量轮小架横向刚性定距梁", [0, .3, z], [1.55, .07, .14], transportColors.dark), strut("测量小架到承载车的竖向悬吊", [0, .32, z], [0, z === 0 ? 1.9 : 1.1, z], .065));
    for (const z of [-5.45, 5.45]) parts.push(box("端部测量悬吊接入两侧主梁的横承座", [0, 1.08, z], [2.3, .16, .2], transportColors.dark));
    for (const z of [1.1, 6.71]) parts.push(box("记录舱前后封闭端墙", [0, 2.72, z], [2.4, 1.6, .08], transportColors.body));
    return parts;
  } },
  { name: "长炮身回转承架铁路重炮平台", tags: ["历史铁路重炮", "大型展示道具", "静态非功能简化模型"], create: () => {
    const parts: ModelPart[] = [...runningFrame(20.2, [-8.8, -7.4, -6, -4.6, 4.6, 6, 7.4, 8.8]), box("重炮车全长承载甲板", [0, 1.17, 0], [2.75, .2, 20], transportColors.dark), cylinder("承载展示炮架的大型回转底盘", [0, 1.43, -.8], [3.2, .42, 3.2], transportColors.body), ring("回转承盘上缘外露支承圈", transportColors.trim, 1.61, .1, 1.67, .12, { position: { x: 0, y: 1.67, z: -.8 } }), part("带浅口部空腔和封闭简化后端的展示炮管", "lathe", transportColors.body, [0, 2.9, -.8], [1, 1, 1], [-70, 0, 0], { profile: [{ x: 0, y: -2.7 }, { x: .61, y: -2.7 }, { x: .61, y: -1.5 }, { x: .51, y: .4 }, { x: .4, y: 3.4 }, { x: .3, y: 8.5 }, { x: .19, y: 8.5 }, { x: .19, y: 7 }, { x: 0, y: 7 }] }), box("炮架后方人员通行平台", [0, 1.43, 3.05], [2.5, .15, 3.6], transportColors.trim)];
    for (const side of [-1, 1]) {
      parts.push(part("连接回转底盘与横向轴的整体侧承架", "extrude", transportColors.dark, [side * .95, 0, 0], [1, 1, 1], [0, 90, 0], { profile: [{ x: -.6, y: 1.5 }, { x: 2.1, y: 1.5 }, { x: 1.35, y: 3.1 }, { x: .25, y: 3.1 }], depth: .25 }), cylinder("炮身与承架之间横向连接轴", [side * .85, 2.9, -.8], [.33, .75, .33], transportColors.trim, [0, 0, 90]), strut("展示炮身下方斜向承托杆", [side * .6, 1.8, -1.3], [side * .36, 3.48, -3.4], .18, transportColors.dark), strut("后通行平台上扶手", [side * 1.18, 2.38, 1.3], [side * 1.18, 2.38, 4.8], .04));
      for (const z of [1.3, 3.05, 4.8]) parts.push(strut("后平台扶手立柱", [side * 1.18, 1.51, z], [side * 1.18, 2.38, z], .04));
    }
    return parts;
  } },
];
