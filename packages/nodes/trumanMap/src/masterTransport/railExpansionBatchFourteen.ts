import { part, type ModelPart, type Triple } from "../assetModelParts";
import { rod } from "../masterObjects/parts";
import { runningFrame } from "./railExpansionBatchThree";
import { box, cylinder, strut, transportColors, type TransportDefinition } from "./parts";

// 原创简化整机，不含待处理钢轨、轨枕或扣件，不靠换被加工物扩充主素材。
// https://www.vossloh.com/en/products/rail-logistics
// https://www.spitzke.com/en/machines/track-laying/road-rail-excavators-unloading-rails/emd-4-2-2/
// https://www.pandrol.com/pandrol-clipping-machines/
export const railExpansionBatchFourteen: TransportDefinition[] = [
  { name: "长钢轨滚轮抽送导向卸轨作业车", theme: "现代", tags: ["长钢轨连续卸轨", "双滚轮导向通道", "实际下降外展导轨臂", "开放通过式抽送滚轮"], create: () => {
    const parts: ModelPart[] = [...runningFrame(16.5, [-6.7, -5.3, 5.3, 6.7]), box("后部动力与控制设备的独立维修踏台", [0, 1.18, 5.5], [2.6, .15, 3], transportColors.dark), box("位于双通过式滚轮槽之间的窄动力箱", [0, 1.8, 5.45], [.45, 1.1, 2.3], transportColors.body), box("动力箱后端附着的卸轨控制面板", [0, 2.26, 6.62], [.4, .37, .12], transportColors.dark)];
    for (const z of [6.2, -.55, -7.3]) parts.push(box("把双导轨机构接到底部边梁的横向承梁", [0, 1.04, z], [2.5, .18, .25], transportColors.dark));
    for (const side of [-1, 1]) {
      const rear: Triple = [side * .6, 2.05, 6.2], front: Triple = [side * 1.9, .6, -7.3];
      for (const edge of [-1, 1]) parts.push(strut("从高位收轨端连续下降外展的导槽侧承梁", [rear[0] + edge * .28, rear[1] - .14, rear[2]], [front[0] + edge * .28, front[1] - .14, front[2]], .1, transportColors.signal));
      for (const fraction of [0, .5, 1]) {
        const x = rear[0] + (front[0] - rear[0]) * fraction, y = rear[1] + (front[1] - rear[1]) * fraction, z = rear[2] + (front[2] - rear[2]) * fraction;
        parts.push(cylinder("支承长钢轨并允许纵向抽送的独立下滚轮", [x, y, z], [.24, .42, .24], transportColors.dark, [0, 0, 90]), cylinder("下滚轮穿出两端并接入侧轴承的承轴", [x, y, z], [.055, .72, .055], transportColors.trim, [0, 0, 90]), box("导槽两侧承梁下方的实际承托横座", [x, y - .2, z], [.75, .1, .16], transportColors.dark), strut("从车底横梁接向导槽横座的真实托臂", [side * 1.15, 1.04, z], [x, y - .23, z], .14, transportColors.dark));
        for (const edge of [-1, 1]) parts.push(box("下滚轮端部独立的外侧轴承立板", [x + edge * .28, y - .035, z], [.09, .22, .16], transportColors.body));
        if (fraction === .5) {
          parts.push(cylinder("双通过通道上方的动力夹送滚轮", [x, y + .4, z], [.24, .42, .24], transportColors.dark, [0, 0, 90]), cylinder("动力夹送滚轮的贯通驱动轴", [x, y + .4, z], [.065, 1, .065], transportColors.trim, [0, 0, 90]), box("夹送滚轮外侧液压马达箱", [x + .58, y + .4, z], [.25, .3, .38], transportColors.body), strut("夹送马达箱与工作头侧柱的实际固定托", [x + .4, y + .35, z], [x + .58, y + .35, z], .11));
          for (const edge of [-1, 1]) parts.push(box("动力工作头两侧接入导槽承梁的竖立柱", [x + edge * .4, y + .12, z], [.12, .6, .24], transportColors.dark), strut("动力工作头竖立柱底部的横向托臂", [x + edge * .28, y - .16, z], [x + edge * .4, y - .16, z], .12));
        }
      }
    }
    return parts;
  } },
  { name: "四点液压弹条扣装脱卸轨行机", theme: "现代", tags: ["完整自行轨行扣件机", "双轨四点工作头", "独立液压扣装夹具", "工作头抬升展示", "开放通过式专用短车架"], create: () => {
    const parts: ModelPart[] = [];
    for (const side of [-1, 1]) parts.push(box("扣装机外侧长向承重底梁", [side * 1.03, .7, 0], [.2, .25, 3.3], transportColors.dark), box("短门架上方连续纵向承梁", [side * 1.03, 1.5, 0], [.17, .2, 2.8], transportColors.signal));
    for (const z of [-1.2, 1.2]) {
      parts.push(cylinder("独立短车架的贯通承重轮轴", [0, .22, z], [.08, 2.35, .08], transportColors.trim, [0, 0, 90]), box("两侧底纵梁之间的前后端横梁", [0, .7, z], [2.25, .25, .22], transportColors.dark));
      for (const side of [-1, 1]) parts.push(part("扣装机在现场钢轨上走行的内轮缘钢轮", "lathe", transportColors.body, [side * .76, .22, z], [1, 1, 1], [0, 0, -side * 90], { profile: [{ x: .04, y: -.09 }, { x: .22, y: -.09 }, { x: .22, y: -.05 }, { x: .19, y: -.035 }, { x: .19, y: .075 }, { x: .04, y: .075 }, { x: .04, y: -.09 }] }), box("钢轮外侧实际接入底梁的轴承挂板", [side * 1.03, .46, z], [.16, .6, .28], transportColors.dark));
    }
    for (const z of [-.5, .5]) {
      parts.push(box("跨越两根钢轨上方的短门架顶横梁", [0, 1.5, z], [2.3, .2, .23], transportColors.signal));
      for (const side of [-1, 1]) parts.push(box("工作头外侧的竖向门架立柱", [side * 1.03, 1.1, z], [.18, .7, .18], transportColors.signal));
    }
    for (const railSide of [-1, 1]) {
      const railX = railSide * .73;
      parts.push(box("沿单根钢轨上方升降的工作头上承座", [railX, 1.47, .3], [.58, .18, .4], transportColors.dark), cylinder("扣装工作头的独立竖向升降缸", [railX, 1.08, .3], [.13, .7, .13], transportColors.body), rod("升降缸下部实际接入工作夹具横框的活塞杆", [railX, .85, .3], [railX, .5, .3], .07, transportColors.trim), box("低于底纵梁而可升降的扣装夹具悬挂横框", [railX, .5, .3], [1.1, .14, .2], transportColors.dark));
      for (const toolSide of [-1, 1]) {
        const x = railX + toolSide * .27;
        parts.push(box("独立扣装夹具不封死钢轨通道的壳体", [x, .4, 0], [.27, .22, .45], transportColors.body), strut("从悬挂横框接入扣装夹具的斜吊臂", [x, .5, .3], [x, .45, 0], .1, transportColors.dark), rod("向弹条方向推进的水平短液压缸", [railX + toolSide * .45, .4, 0], [railX + toolSide * .25, .4, 0], .11, transportColors.dark), rod("从短液压缸伸出的实际扣装活塞杆", [railX + toolSide * .25, .4, 0], [railX + toolSide * .13, .4, 0], .055, transportColors.trim), box("液压活塞杆端部独立可见的薄推钳", [railX + toolSide * .13, .34, 0], [.08, .18, .3], transportColors.signal));
      }
    }
    parts.push(box("后部紧凑柴油及液压动力机箱", [0, 1.1, 1.45], [1.8, .65, .95], transportColors.body), box("后动力机箱上的维护顶盖", [0, 1.46, 1.45], [1.73, .07, .88], transportColors.dark), box("后机箱面向操作者的控制面板", [0, 1.22, 1.95], [1.1, .32, .055], transportColors.dark));
    for (const side of [-1, 1]) parts.push(rod("后部手推与慢速操作把手的连续侧支杆", [side * .55, .92, 1.75], [side * .55, 1.42, 2.12], .035, transportColors.dark));
    parts.push(cylinder("连接两根侧支杆的操作横握杆", [0, 1.42, 2.12], [.035, 1.2, .035], transportColors.dark, [0, 0, 90]));
    return parts;
  } },
];
