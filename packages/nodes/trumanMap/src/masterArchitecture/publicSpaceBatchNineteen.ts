import { part, type ModelPart } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { box, design, colors } from "./structures";
import { doorway } from "./publicSpaceBatchOne";
import { stairFlight } from "./publicSpaceBatchSteps";
import { boxesMesh, type SolidBox } from "./publicSpaceBatchEight";
import { placeWing } from "./publicSpaceBatchFourteen";

const stone = "#b8b8aa", dark = "#536b6f", wood = "#ad956e";

export const publicSpaceBatchNineteenDesigns = [
  design("三桥内院综合急诊楼", "下层诊疗翼围住可驶入回转的中央接患院道，上层后勤侧廊由三道有顶人员跨桥连接，地层治疗厅先接有顶接患廊，后部两座真实楼梯井通向上层工作房，院道与长条接患岛各自保留完整空间", courtyardEmergencyCenter, "建筑", "现代"),
];

function treatmentDoors(x: number, floor: number, height: number): ModelPart {
  const opening = floor < 1 ? 1.6 : 1.2, doorHeight = floor < 1 ? 2.8 : 2.4, profile = [{ x: -24, y: 0 }];
  for (const center of [-20, -12, -4, 4, 12]) profile.push({ x: center - opening / 2, y: 0 }, { x: center - opening / 2, y: doorHeight }, { x: center + opening / 2, y: doorHeight }, { x: center + opening / 2, y: 0 });
  profile.push({ x: 16, y: 0 }, { x: 16, y: height }, { x: -24, y: height });
  return part("五间诊疗或工作厅各自真实接入有顶侧廊的连续门墙", "extrude", stone, [x, floor, 0], [1, 1, 1], [0, -90, 0], { depth: .24, profile });
}

function courtyardEmergencyCenter(): ModelPart[] {
  const outside: [number, number][] = [[-32, -24], [-12, -24], [-12, 16], [12, 16], [12, -24], [32, -24], [32, 32], [-32, 32]], holes: [number, number][][] = [[[-29.2, 20.8], [-26.8, 20.8], [-26.8, 30], [-29.2, 30]], [[26.8, 20.8], [29.2, 20.8], [29.2, 30], [26.8, 30]]];
  const p: ModelPart[] = [box("急诊楼与进出院道共同落地院坪", 0, .15, 0, 72, .3, 72, stone), polygon("U形诊疗楼地面五毫米实体饰层", wood, outside, .005, [0, .3, 0]), polygon("上层后勤工作楼面保留两处真实楼梯井", wood, outside, .25, [0, 4.8, 0], holes), polygon("U形诊疗与后勤两翼完整连续屋盖", dark, outside, .25, [0, 8.55, 0]), box("驶入中央内院并在后端回转的完整实体院道", 0, .305, -10, 24, .01, 52, "#7f8c8b"), box("院道两侧之间真实抬起的接患长岛", 0, .455, -4.25, 6, .29, 19.5, stone), box("接患长岛上的实际值班接待台", 0, 1.1, -2, 3.5, 1, .8, wood), doorway("中央院道后方真正进入地层诊疗横厅的宽门", [0, .3, 16], 24, 4.5, 3, 0, 2.8), part("后勤横厅朝向内院的完整透明围护", "box", colors.glass, [0, 6.8, 16], [24, 3.5, .05], [0, 0, 0], { opacity: .24 })];
  for (const side of [-1, 1]) {
    const openingCenter = -side * 8.5, profile = [{ x: -10, y: 0 }, { x: openingCenter - 1, y: 0 }, { x: openingCenter - 1, y: 2.8 }, { x: openingCenter + 1, y: 2.8 }, { x: openingCenter + 1, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 8.25 }, { x: -10, y: 8.25 }];
    p.push(part("两条地层接患侧廊分别面向前院的实际入口墙", "extrude", stone, [side * 22, .3, -24], [1, 1, 1], [0, 0, 0], { depth: .24, profile }));
  }
  for (const [z, yaw] of [[-15.5, -90], [7, 90]]) p.push(part("院道地面与接患岛之间实际连续相接的端部低坡", "extrude", stone, [0, .31, z!], [1, 1, 1], [0, yaw!, 0], { depth: 3, profile: [{ x: -1.5, y: 0 }, { x: 1.5, y: 0 }, { x: 1.5, y: .29 }, { x: -1.5, y: .01 }] }));
  for (const [x, z, width, yaw] of [[-32, 4, 56, 90], [32, 4, 56, 90], [0, 32, 64, 0]]) p.push(boxesMesh("诊疗楼外墙上下两层共用的实际窗下墙与承顶梁", stone, [{ center: [0, .75, 0], size: [width!, .9, .24] }, { center: [0, 8.175, 0], size: [width!, .75, .24] }], [x!, 0, z!], yaw!), ...placeWing([part("地层诊疗和上层工作厅真实外窗中的透明玻璃", "box", colors.glass, [0, 4.5, 0], [width!, 6.6, .05], [0, 0, 0], { opacity: .24 })], x!, z!, yaw!));
  const walls: SolidBox[] = [], beds: SolidBox[] = [], desks: SolidBox[] = [], guards: SolidBox[] = [], posts: SolidBox[] = [];
  for (const floor of [.3, 5.05]) {
    const height = floor < 1 ? 4.5 : 3.5;
    for (const side of [-1, 1]) {
      p.push(treatmentDoors(side * 15, floor, height));
      for (const z of [-16, -8, 0, 8, 16]) walls.push({ center: [side * 23.5, floor + height / 2, z], size: [17, height, .18] });
      for (const z of [-20, -12, -4, 4, 12]) {
        if (floor < 1) {
          for (const x of [17.5, 23, 28.5]) for (const offset of [-2, 2]) beds.push({ center: [side * x, floor + .3, z + offset], size: [1.1, .6, 2.1] });
        } else for (const x of [17.5, 23, 28.5]) desks.push({ center: [side * x, floor + .4, z], size: [2, .8, 1.2] });
      }
    }
    for (const x of [-18, -6, 6, 18]) {
      p.push(doorway(floor < 1 ? "后部独立诊疗厅面向公共横廊的真实门" : "后部独立工作房面向后勤横廊的真实门", [x, floor, 20], 12, height, floor < 1 ? 1.6 : 1.2, 0, 2.6));
      if (floor < 1) for (const offset of [-2, 2]) beds.push({ center: [x + offset, floor + .3, 26], size: [1.1, .6, 2.1] });
      else desks.push({ center: [x, floor + .4, 26], size: [4, .8, 1.2] });
    }
    for (const x of [-24, -12, 0, 12, 24]) walls.push({ center: [x, floor + height / 2, 26], size: [.18, height, 12] });
  }
  for (const z of [-10, 0, 10]) {
    p.push(box("实际连到左右上层侧廊的完整人员跨桥", 0, 4.925, z, 24, .25, 3, wood), box("跨桥下真实接到两侧承柱的独立长梁", 0, 4.5, z, 24, .6, .3, dark), box("人员跨桥上方与两翼同高的完整屋面", 0, 8.675, z, 24, .25, 3, dark));
    for (const side of [-1, 1]) {
      p.push(part("有顶跨桥侧面真实封合的透明围护", "box", colors.glass, [0, 6.8, z + side * 1.5], [24, 3.5, .05], [0, 0, 0], { opacity: .24 }));
      posts.push({ center: [side * 12, 2.55, z], size: [.3, 4.5, .3] });
    }
  }
  for (const side of [-1, 1]) {
    for (let flight = 0; flight < 3; flight++) p.push(stairFlight("从地层横厅真正穿过后勤楼板井口的连续阶梯", side * 28, .3 + flight * 4.75 / 3, 21 + flight * 3, 2, 10, 4.75 / 30, .3));
    for (const [a, b] of [[-24, -11.5], [-8.5, -1.5], [1.5, 8.5], [11.5, 16]]) {
      guards.push({ center: [side * 12, 6.15, (a! + b!) / 2], size: [.06, .06, b! - a!] });
      const count = Math.ceil((b! - a!) / 3.2);
      for (let step = 0; step <= count; step++) guards.push({ center: [side * 12, 5.6, a! + (b! - a!) * step / count], size: [.06, 1.1, .06] });
    }
    for (const x of [side * 26.8, side * 29.2]) {
      guards.push({ center: [x, 6.15, 25.4], size: [.06, .06, 9.2] });
      for (const z of [20.8, 23.1, 25.4, 27.7, 30]) guards.push({ center: [x, 5.6, z], size: [.06, 1.1, .06] });
    }
    guards.push({ center: [side * 28, 6.15, 20.8], size: [2.4, .06, .06] });
  }
  for (const [x, z] of outside) posts.push({ center: [x, 4.425, z], size: [.3, 8.25, .3] });
  for (let start = 0; start < walls.length; start += 18) p.push(boxesMesh("地层诊疗与上层工作厅各自闭合的真实分室墙", stone, walls.slice(start, start + 18)));
  for (let start = 0; start < beds.length; start += 18) p.push(boxesMesh("各地层诊疗厅内实际落地的独立接诊床座", "#a3ad98", beds.slice(start, start + 18)));
  for (let start = 0; start < desks.length; start += 18) p.push(boxesMesh("各上层后勤工作房内实际落地的办公桌台", wood, desks.slice(start, start + 18)));
  for (let start = 0; start < guards.length; start += 18) p.push(boxesMesh("侧廊在三个跨桥入口及楼梯井高端留空的实际护栏", dark, guards.slice(start, start + 18)));
  p.push(boxesMesh("内院跨桥与两层诊疗楼真实承重竖柱", dark, posts));
  return p;
}
