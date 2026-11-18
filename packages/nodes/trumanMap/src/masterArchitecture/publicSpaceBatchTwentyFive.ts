import { part, type ModelPart } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { box, design, rail, colors } from "./structures";
import { doorway, standingPanel } from "./publicSpaceBatchOne";
import { boxesMesh, type SolidBox } from "./publicSpaceBatchEight";
import { waistStair } from "./publicSpaceBatchFourteen";

const concrete = "#aeb4ac", dark = "#526a6d", road = "#8d9792", steel = "#798b88";

export const publicSpaceBatchTwentyFiveDesigns = [
  design("双层坡台垃圾中转站", "两条长实坡将收集车接到高位卸料厅，两处真实楼板卸料口通过悬吊落料井通向下层接箱区；运箱车沿独立地面中道前后穿行，侧前值班室和带转台的检修阶梯另行通行，大跨开孔钢架与高窗围护完整双层厂厅", wasteTransferStation, "建筑", "现代"),
];

function lowerEnd(z: number): ModelPart {
  const profile = [{ x: -18, y: 0 }];
  if (z < 0) profile.push({ x: -14.6, y: 0 }, { x: -14.6, y: 2.4 }, { x: -13.4, y: 2.4 }, { x: -13.4, y: 0 });
  profile.push({ x: -4, y: 0 }, { x: -4, y: 5 }, { x: 4, y: 5 }, { x: 4, y: 0 }, { x: 22, y: 0 }, { x: 22, y: 5.45 }, { x: -18, y: 5.45 });
  return part("运箱车真实前后通门与值班室独立人门所在完整下层端墙", "extrude", concrete, [0, .3, z], [1, 1, 1], [0, 0, 0], { depth: .3, profile });
}

function wasteTransferStation(): ModelPart[] {
  const holes: [number, number][][] = [-8, 8].map(x => [[x - 3, 3], [x + 3, 3], [x + 3, 9], [x - 3, 9]]);
  const p: ModelPart[] = [box("高低两条车辆路线和完整厂厅共同落地场坪", 0, .15, 0, 92, .3, 90, concrete), polygon("高位车辆卸料楼板真正穿出两处方形落料口", road, [[-18, -18], [22, -18], [22, 26], [-18, 26]], .25, [0, 5.75, 0], holes), lowerEnd(-18), lowerEnd(26), ...[-18, 22].map(x => box("下层接箱厂厅两侧完整外围承墙", x, 3.025, 4, .3, 5.45, 44, concrete)), part("覆盖整座高位卸料厅的连续封厚双坡屋盖", "extrude", dark, [0, 0, 4], [1, 1, 1], [0, 0, 0], { depth: 44.6, profile: [{ x: -18.3, y: 11.8 }, { x: 2, y: 14 }, { x: 22.3, y: 11.8 }, { x: 22.3, y: 11.55 }, { x: 2, y: 13.75 }, { x: -18.3, y: 11.55 }] }), part("由室外地面实际接到厂区前场的低缓入口坡", "extrude", concrete, [0, 0, -47], [1, 1, 1], [0, -90, 0], { depth: 6, profile: [{ x: -2, y: 0 }, { x: 2, y: 0 }, { x: 2, y: .3 }, { x: -2, y: .02 }] })];
  const supports: SolidBox[] = [], beams: SolidBox[] = [], platforms: SolidBox[] = [], containers: SolidBox[] = [], guards: SolidBox[] = [], posts: SolidBox[] = [], panes: SolidBox[] = [], furniture: SolidBox[] = [];
  const postKeys = new Set<string>();
  const addPost = (x: number, floor: number, z: number) => {
    const key = `${x.toFixed(5)},${floor.toFixed(5)},${z.toFixed(5)}`;
    if (postKeys.has(key)) return;
    postKeys.add(key); posts.push({ center: [x, floor + .55, z], size: [.07, 1.1, .07] });
  };
  const addGuard = (x0: number, z0: number, x1: number, z1: number, floor: number) => {
    const count = Math.ceil(Math.hypot(x1 - x0, z1 - z0) / 2.5);
    guards.push({ center: [(x0 + x1) / 2, floor + 1.1, (z0 + z1) / 2], size: [Math.abs(x1 - x0) || .07, .07, Math.abs(z1 - z0) || .07] });
    for (let i = 0; i <= count; i++) addPost(x0 + (x1 - x0) * i / count, floor, z0 + (z1 - z0) * i / count);
  };
  for (const x of [-30, 34]) {
    p.push(part("地面前场连续抬升到六米卸料台的五十七米实体车坡", "extrude", road, [x, .3, -10.5], [1, 1, 1], [0, -90, 0], { depth: 8, profile: [{ x: -28.5, y: 0 }, { x: 28.5, y: 0 }, { x: 28.5, y: 5.7 }, { x: -28.5, y: .02 }] }));
    for (const side of [-1, 1]) p.push(part("沿整条长车坡实际连续升起的实体防护墙", "extrude", concrete, [x + side * 4, .3, -10.5], [1, 1, 1], [0, -90, 0], { depth: .16, profile: [{ x: -28.5, y: .02 }, { x: 28.5, y: 5.7 }, { x: 28.5, y: 6.7 }, { x: -28.5, y: 1.02 }] }));
    const center = x < 0 ? -26 : 30;
    platforms.push({ center: [center, 5.875, 24], size: [16, .25, 12] });
    for (const offset of [-7.5, 7.5]) for (const z of [19, 29]) supports.push({ center: [center + offset, 3.025, z], size: [.4, 5.45, .4] });
  }
  for (const x of [-14, 14]) {
    beams.push({ center: [x, 5.55, 4], size: [.5, .4, 44] });
    for (const z of [-16, 0, 12, 24]) supports.push({ center: [x, 2.825, z], size: [.4, 5.05, .4] });
  }
  for (const z of [-14, 4, 18]) {
    const frame = standingPanel("屋面下真正开出三角腹孔并精确接合内坡面的钢架", steel, [[-18.3, 10.95], [22.3, 10.95], [22.3, 11.55], [2, 13.75], [-18.3, 11.55]], [[[-16.8, 11.35], [.8, 11.35], [.8, 13.1]], [[3.2, 11.35], [20.8, 11.35], [3.2, 13.1]], [[1.4, 11.35], [2.6, 11.35], [2, 13.2]]], z, .3); p.push(frame);
    for (const x of [-17.5, 21.5]) supports.push({ center: [x, 8.475, z], size: [.4, 4.95, .4] });
  }
  for (const z of [-18, 26]) {
    const windows: [number, number][][] = [-12, 0, 12].map(x => [[x - 4, 8.2], [x + 4, 8.2], [x + 4, 10.7], [x - 4, 10.7]]);
    p.push(standingPanel("高位卸料厅前后真实高窗所在完整端墙", concrete, [[-18, 6], [22, 6], [22, 11.55], [-18, 11.55]], windows, z, .25));
    for (const x of [-12, 0, 12]) panes.push({ center: [x, 9.45, z], size: [8, 2.5, .05] });
    const gable = standingPanel("高位端墙与双坡屋壳之间真正封闭的三角采光窗", colors.glass, [[-18.3, 11.55], [22.3, 11.55], [2, 13.75]], [], z, .06); gable.opacity = .24; p.push(gable);
  }
  for (const x of [-18, 22]) {
    const lower: [number, number][] = x > 0 ? [[-22, 6], [-21.5, 6], [-21.5, 10.5], [-14.5, 10.5], [-14.5, 6], [9.6, 6], [9.6, 8.6], [10.8, 8.6], [10.8, 6], [22, 6], [22, 11.55], [-22, 11.55]] : [[-22, 6], [-21.5, 6], [-21.5, 10.5], [-14.5, 10.5], [-14.5, 6], [22, 6], [22, 11.55], [-22, 11.55]], windows: [number, number][][] = [];
    for (const z of [-12, -2, 8]) { const local = -z + 4; windows.push([[local - 3.5, 8.2], [local + 3.5, 8.2], [local + 3.5, 10.7], [local - 3.5, 10.7]]); panes.push({ center: [x, 9.45, z], size: [.05, 2.5, 7] }); }
    const wall = standingPanel("高位厂厅在卸料车平台和独立人行梯处真实开门的侧墙", concrete, lower, windows, 0, .25); wall.position.x = x; wall.position.z = 4; wall.rotation.y = 90; p.push(wall);
  }
  for (const x of [-8, 8]) {
    p.push(polygon("楼板真实落料口下方贯通接箱区的悬吊落料井", steel, [[x - 3.5, 2.5], [x + 3.5, 2.5], [x + 3.5, 9.5], [x - 3.5, 9.5]], 2.45, [0, 3.3, 0], [[[x - 3, 3], [x + 3, 3], [x + 3, 9], [x - 3, 9]]]));
    containers.push({ center: [x, .4, 6], size: [8, .2, 12] });
    for (const side of [-1, 1]) containers.push({ center: [x + side * 3.9, 1.9, 6], size: [.2, 2.8, 12] }, { center: [x, 1.9, 6 + side * 5.9], size: [7.6, 2.8, .2] });
    beams.push({ center: [x, 6.15, 2.55], size: [7, .3, .3] });
    addGuard(x - 3, 3, x - 3, 9, 6); addGuard(x + 3, 3, x + 3, 9, 6); addGuard(x - 3, 9, x + 3, 9, 6);
  }
  for (const [x0, z0, x1, z1] of [[-34, 18, -34, 30], [-34, 30, -18, 30], [-18, 26, -18, 30], [-26, 18, -18, 18], [38, 18, 38, 30], [22, 30, 38, 30], [22, 26, 22, 30], [22, 18, 30, 18]]) addGuard(x0!, z0!, x1!, z1!, 6);
  for (const [base, startZ] of [[.3, -19.8], [2.2, -15.3], [4.1, -10.8]]) {
    p.push(waistStair("地面值班区实际接到高位卸料厅的独立检修阶梯", 25.5, base!, startZ!, 1.8, 12, 1.9 / 12, .3));
    for (const side of [-1, 1]) {
      p.push(rail([25.5 + side * .83, base! + 1.1, startZ!], [25.5 + side * .83, base! + 3, startZ! + 3.6], .07, dark));
      for (let i = 0; i <= 3; i++) addPost(25.5 + side * .83, base! + 1.9 * i / 3, startZ! + i * 1.2);
    }
  }
  platforms.push({ center: [25.5, 2.1, -15.75], size: [1.8, .2, .9] }, { center: [25.5, 4, -11.25], size: [1.8, .2, .9] }, { center: [24.2, 5.9, -6.2], size: [4.4, .2, 2] });
  supports.push({ center: [25.5, 1.15, -15.75], size: [.25, 1.7, .25] }, { center: [25.5, 2.1, -11.25], size: [.25, 3.6, .25] }, { center: [26.1, 3.05, -6.2], size: [.25, 5.5, .25] });
  for (const [floor, z, length] of [[2.2, -15.75, .9], [4.1, -11.25, .9]]) for (const side of [-1, 1]) addGuard(25.5 + side * .83, z! - length! / 2, 25.5 + side * .83, z! + length! / 2, floor!);
  addGuard(26.4, -7.2, 26.4, -5.2, 6); addGuard(22, -5.2, 26.4, -5.2, 6); addGuard(22, -7.2, 24.6, -7.2, 6);
  const officeWindow = standingPanel("值班室面向下层运箱通道的真实观察窗墙", concrete, [[-6, .3], [6, .3], [6, 3.3], [-6, 3.3]], [[[-2, 1.1], [2, 1.1], [2, 2.7], [-2, 2.7]]], 0, .2); officeWindow.position.x = -10; officeWindow.position.z = -12; officeWindow.rotation.y = 90; p.push(officeWindow, doorway("值班室实际通向接箱厂厅的独立工作门", [-14, .3, -6], 8, 3, 1.2, 0, 2.4), box("值班室实际接到四壁的独立低吊顶", -14, 3.4, -12, 8, .2, 12, dark)); panes.push({ center: [-10, 1.9, -12], size: [.05, 1.6, 4] });
  furniture.push({ center: [-14, 1.04, -13], size: [3.4, .12, 1.1] });
  for (const x of [-15.2, -12.8]) furniture.push({ center: [x, .64, -13], size: [.12, .68, .9] });
  for (const [name, color, values] of [["厂厅与两处高位车台及独立检修梯真正落地的承重柱", concrete, supports], ["下层接箱区实际承托卸料台的连续梁和轮挡", steel, beams], ["坡道上端转车平台和独立人行阶梯实际落脚台", road, platforms], ["落料井下方实际开腔接料并让开中央车道的换装箱体", "#7e9389", containers], ["高台车道和落料口边缘的真实连续防护扶手", dark, guards], ["各坡台及人行梯平台实际落脚的护栏立柱", dark, posts], ["值班室内实际落地的独立工作台", "#a38e6d", furniture]] as [string, string, SolidBox[]][]) for (let start = 0; start < values.length; start += 18) p.push(boxesMesh(name, color, values.slice(start, start + 18)));
  for (let start = 0; start < panes.length; start += 18) { const glass = boxesMesh("高低厂厅实际窗洞中的独立透明采光窗", colors.glass, panes.slice(start, start + 18)); glass.opacity = .24; p.push(glass); }
  return p;
}
