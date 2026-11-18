import { part, ring, type ModelPart } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { rod } from "../masterObjects/parts";
import { runningFrame } from "./railExpansionBatchThree";
import { box, cab, cylinder, strut, transportColors, type TransportDefinition } from "./parts";

// 原创船闸专用绞控轨行整机，不含船、闸墙或外部牵引缆；不复刻某地区或年代的机车型号。
// https://pancanal.com/en/panama-canal-modernizes-locomotive-fleet/
// https://www.jorsa.or.jp/en/exports/detail.php?id=22
export const railExpansionBatchNineteen: TransportDefinition[] = [
  { name: "船闸双缆绞控齿轨牵引机车", theme: "现代", tags: ["火车", "铁路", "船闸轨行牵引机车", "双独立卷缆鼓", "实际侧向导缆滚轮", "底部齿轨驱动", "不承载船舶的独立轨行设备"], create: () => {
    const parts: ModelPart[] = [...runningFrame(8, [-2.7, 2.7]), box("承托双卷鼓和侧置控制室的完整重型底台", [0, 1.18, 0], [3, .2, 7.8], transportColors.dark), ...cab([-.55, 1.28, 0], [1.4, 2, 2.5]), box("侧置操作室面向船闸的侧窗", [.12, 2.8, 0], [.035, .8, 2.05], transportColors.glass), box("操作室背向船闸的侧窗", [-1.22, 2.8, 0], [.035, .8, 2.05], transportColors.glass), box("操作室后端的独立透光风挡", [-.55, 2.8, 1.18], [1.2, .8, .035], transportColors.glass)];
    for (const value of parts) if (value.name === "贯穿两车轮的整根钢轴") { value.scale.x = .21; value.scale.z = .21; }
    for (const z of [-2.7, 2.7]) for (const side of [-1, 1]) parts.push(box("主承重轮轴与侧纵梁连续相接的独立轴箱吊座", [side * 1.02, .65, z], [.24, .36, .34], transportColors.dark));
    const gearProfile = Array.from({ length: 32 }, (_, index) => { const angle = index * Math.PI / 16, radius = index % 4 === 1 || index % 4 === 2 ? .26 : .21; return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius }; });
    for (const z of [-2.4, 2.4]) {
      parts.push(part("独立于承重钢轮且与中央齿轨咬合的牵引齿轮", "extrude", transportColors.dark, [0, .37, z], [1, 1, 1], [0, 90, 0], { depth: .22, profile: gearProfile }), cylinder("牵引齿轮穿出传动箱的水平动力轴", [-.2, .37, z], [.14, 1.15, .14], transportColors.trim, [0, 0, 90]), box("底部齿轨动力轴的独立密闭减速箱", [-.65, .68, z], [.6, .6, .65], transportColors.body), cylinder("接入齿轨减速箱的独立牵引电机", [-.65, 1.05, z], [.4, .4, .4], transportColors.dark));
      for (const side of [-1, 1]) parts.push(cylinder("抵抗横向缆力的轨侧水平导向滚轮", [side * 1.2, .55, z], [.3, .12, .3], transportColors.body), rod("轨侧导向滚轮实际接入底纵梁的竖向短轴", [side * 1.2, .55, z], [side * 1.2, .95, z], .065, transportColors.trim));
    }
    for (const end of [-1, 1]) {
      const z = end * 2.3;
      parts.push(part("有真实中心轴孔及上下护缘的独立卷缆鼓", "lathe", transportColors.body, [.3, 1.95, z], [1, 1, 1], [0, 0, 0], { profile: [{ x: .1, y: -.64 }, { x: .8, y: -.64 }, { x: .8, y: -.55 }, { x: .55, y: -.55 }, { x: .55, y: .55 }, { x: .8, y: .55 }, { x: .8, y: .64 }, { x: .1, y: .64 }, { x: .1, y: -.64 }] }), cylinder("卷缆鼓贯穿中心轴孔并接入底台的竖向驱动轴", [.3, 1.9, z], [.2, 1.6, .2], transportColors.dark), ring("实际卷绕在鼓芯外侧且低于护缘的缆层", transportColors.dark, .585, .055, 1.95, .85, { position: { x: .3, y: 1.95, z } }));
      const guideZ = z + .585;
      for (const y of [1.65, 2.25]) parts.push(cylinder("导缆口上下方向的独立横置滚轮", [1.5, y, guideZ], [.14, .7, .14], transportColors.trim, [90, 0, 0]));
      for (const side of [-1, 1]) parts.push(cylinder("导缆口左右方向的独立竖置滚轮", [1.5, 1.95, guideZ + side * .3], [.14, .6, .14], transportColors.trim), strut("导缆滚轮端部固定框实际接到底台的斜立座", [1.35, 1.28, guideZ + side * .32], [1.5, 1.65, guideZ + side * .32], .11));
      parts.push(part("从卷鼓切点穿过真实导缆口的可见缆段", "tube", transportColors.dark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: .025, path: [{ x: .3, y: 1.95, z: guideZ }, { x: 1.2, y: 1.95, z: guideZ }, { x: 1.5, y: 1.95, z: guideZ }, { x: 1.85, y: 1.95, z: guideZ }] }));
    }
    parts.push(box("控制室后侧接入重型底台的电气控制柜", [-1.05, 1.68, 1.8], [.5, .8, .65], transportColors.body), box("电气控制柜的独立维护面板", [-1.32, 1.72, 1.8], [.035, .55, .5], transportColors.dark));
    for (const front of [true, false]) {
      const half = front ? .605 : .595, lower = front ? 2.38 : 2.4, upper = front ? 3.18 : 3.2;
      const frame = polygon(front ? "绞控机车驾驶室前风挡实际接入上下围护的透孔窗框" : "绞控机车驾驶室后风挡实际接入上下围护的透孔窗框", transportColors.body, [[-.7, -2.27], [.7, -2.27], [.7, -3.26], [-.7, -3.26]], .12, [-.55, 0, front ? -1.235 : 1.12], [[[-half, -lower], [half, -lower], [half, -upper], [-half, -upper]]]);
      frame.rotation.x = 90;
      parts.push(frame);
    }
    for (const x of [-1.22, .12]) {
      const frame = polygon("绞控机车驾驶室实际连接前后围护的侧窗透孔框", transportColors.body, [[2.27, -1.23], [3.26, -1.23], [3.26, 1.23], [2.27, 1.23]], .08, [x + .04, 0, 0], [[[2.4, -1.02], [3.2, -1.02], [3.2, 1.02], [2.4, 1.02]]]);
      frame.rotation.z = 90;
      parts.push(frame);
    }
    return parts;
  } },
];
