import { beam, part, ring, type ModelPart, type Triple } from "../assetModelParts";
import { Euler, MathUtils, Quaternion, Vector3 } from "three";
import { box, cab, chassis, cylinder, helicalFlight, strut, transportColors, type TransportDefinition } from "./parts";

function exposedConveyor(start: Triple, end: Triple, width: number): ModelPart[] {
  const dy = end[1] - start[1], dz = end[2] - start[2], length = Math.hypot(dy, dz), rotation: Triple = [-Math.atan2(dy, dz) * 180 / Math.PI, 0, 0];
  const middle: Triple = [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2, (start[2] + end[2]) / 2];
  return [box("外露连续升运带", middle, [width, 0.075, length], transportColors.dark, rotation), ...[-1, 1].map(side => box("输送带开放侧挡", [middle[0] + side * width / 2, middle[1] + 0.12, middle[2]], [0.065, 0.25, length], transportColors.body, rotation)), ...Array.from({ length: 6 }, (_, index) => { const t = (index + 0.5) / 6; return box("连续输送带横向刮板", [start[0], start[1] + dy * t + 0.08, start[2] + dz * t], [width * 0.94, 0.12, 0.045], transportColors.trim, rotation); })];
}

export const rootCropMachineModels: TransportDefinition[] = [
  { name: "切段式甘蔗联合收获机", theme: "现代", tags: ["农业", "农机", "螺旋分禾", "贴地基切盘", "除杂风机", "切段升运"], create: () => {
    const parts = [...chassis(2.1, 4.8, 0.65, [-1.3, 1.5]), ...cab([0, 1.65, -0.9], [1.5, 1.65, 1.5]), box("切段喂入动力机体", [0, 1.6, 0.8], [1.9, 1.6, 2.4]), box("后置发动机罩", [0, 2.1, 1.8], [1.6, 0.85, 1.1]), cylinder("横向压倒喂入辊", [0, 1.15, -2], [0.5, 1.7, 0.5], transportColors.dark, [0, 0, 90]), ...exposedConveyor([0, 1.9, 1.6], [0, 4.15, 4.8], 0.8)];
    for (const side of [-1, 1]) {
      const flight = helicalFlight([side * 0.8, 0.35, -3.15], 0.07, 0.27, 2, 3, side as 1 | -1); flight.name = "前倾连续螺旋分禾翼"; flight.color = transportColors.signal; flight.rotation.x = 28.5;
      parts.push(beam("前倾分禾螺旋芯轴", transportColors.dark, [side * 0.8, 0.35, -3.15], [side * 0.8, 2.1, -2.2], 0.09), flight, cylinder("贴地甘蔗基切盘", [side * 0.4, 0.22, -2], [0.92, 0.09, 0.92], transportColors.dark));
      for (let tooth = 0; tooth < 4; tooth++) { const a = tooth * Math.PI / 2; parts.push(box("基切盘外伸短刀", [side * 0.4 + Math.cos(a) * 0.46, 0.22, -2 + Math.sin(a) * 0.46], [0.23, 0.045, 0.12], transportColors.trim, [0, -tooth * 90, 0])); }
    }
    parts.push(strut("高位去梢盘支臂", [0, 2.4, -1.5], [0, 4.4, -2.75], 0.12), cylinder("顶部横向去梢切盘", [0, 4.4, -2.75], [1.4, 0.11, 1.4], transportColors.signal), ring("切段后除杂风机开口圈", transportColors.body, 0.68, 0.08, 3, 0.4), cylinder("除杂风机中心毂", [0, 3, 0], [0.24, 0.35, 0.24], transportColors.dark));
    for (let index = 0; index < 4; index++) parts.push(box("除杂风机放射叶片", [Math.cos(index * Math.PI / 2) * 0.33, 3, Math.sin(index * Math.PI / 2) * 0.33], [0.5, 0.08, 0.18], transportColors.trim, [18, -index * 90, 0]));
    parts.push(strut("升运尾架斜撑", [0, 0.9, 1.5], [0, 3.4, 3.8], 0.14));
    return parts;
  } },
  { name: "去顶铲拔甜菜收获机", theme: "现代", tags: ["农业", "农机", "切顶", "对置挖掘铧", "星轮清理", "敞口块根仓"], create: () => {
    const parts = [...chassis(2.7, 7, 0.75, [-2.2, 0.8, 2.6]), ...cab([0, 1.9, -2.25], [1.8, 1.75, 1.7]), box("块根仓底板", [0, 1.8, 1.1], [2.5, 0.18, 3.7], transportColors.dark), ...[-1, 1].map(side => box("敞口储仓侧壁", [side * 1.22, 2.7, 1.1], [0.12, 1.8, 3.7])), ...[-1, 1].map(end => box("敞口储仓端壁", [0, 2.7, 1.1 + end * 1.8], [2.5, 1.8, 0.12])), box("前置去叶罩", [0, 0.7, -4.25], [3.1, 0.55, 0.85], transportColors.signal), cylinder("去叶横向滚刀", [0, 0.4, -4.25], [0.44, 3, 0.44], transportColors.dark, [0, 0, 90]), ...exposedConveyor([-0.85, 0.7, -2.9], [-0.85, 3.55, 0.7], 0.65)];
    for (let row = 0; row < 6; row++) {
      const x = (row - 2.5) * 0.49;
      parts.push(strut("独立行切顶支杆", [x, 0.9, -3.65], [x, 0.42, -3.65], 0.05), box("贴地切顶刀片", [x, 0.4, -3.68], [0.32, 0.045, 0.2], transportColors.trim));
      for (const side of [-1, 1]) parts.push(beam("对置抬根挖掘铧", transportColors.dark, [x + side * 0.16, 0.2, -3.3], [x + side * 0.07, 0.65, -2.9], 0.065, 0.14));
    }
    for (const z of [-2.5, -1.8]) {
      const wheelRing = ring("卧式清理星轮外缘", transportColors.dark, 0.62, 0.06, 0.7, 0.1); wheelRing.position.z = z; parts.push(wheelRing);
      for (let index = 0; index < 3; index++) parts.push(strut("星轮开放筛土辐条", [0, 0.7, z], [Math.cos(index * Math.PI * 2 / 3) * 0.63, 0.7, z + Math.sin(index * Math.PI * 2 / 3) * 0.63], 0.055));
    }
    return parts;
  } },
  { name: "夹叶式胡萝卜收获机", theme: "现代", tags: ["农业", "农机", "夹叶提根", "成对夹持带", "去叶切刀", "侧向卸料"], create: () => {
    const parts = [...chassis(2.15, 4.9, 0.58, [-1.3, 1.4]), ...cab([-0.55, 1.45, 0.5], [1.05, 1.55, 1.4]), box("夹叶主架承载平台", [0, 1.2, 0.8], [2, 0.18, 3]), box("根部去叶防护壳", [0.35, 2.05, 0], [1.6, 0.55, 0.55], transportColors.signal), box("后侧分选承接台", [0.3, 1.5, 1.5], [1.45, 0.18, 1.6], transportColors.dark)];
    for (const x of [-0.3, 0.3, 0.9]) {
      parts.push(part("入行分叶尖头", "cone", transportColors.signal, [x, 0.5, -2.65], [0.32, 0.9, 0.32], [90, 0, 0]), strut("土下松根铲柄", [x, 0.3, -2.2], [x, 0.9, -1.8], 0.06));
      for (const side of [-1, 1]) parts.push(beam("相向夹叶提升橡胶带", transportColors.dark, [x + side * 0.08, 0.55, -2.25], [x + side * 0.08, 2, -0.15], 0.1, 0.2), cylinder("夹持带驱动轮", [x + side * 0.08, 2, -0.15], [0.18, 0.1, 0.18], transportColors.trim, [0, 0, 90]));
      parts.push(cylinder("提根后切叶圆刀", [x, 1.83, 0.2], [0.34, 0.04, 0.34], transportColors.trim));
    }
    const discharge = exposedConveyor([0.6, 1.7, 1.55], [0.6, 2.5, 3.5], 0.75);
    const yaw = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI / 2);
    for (const value of discharge) {
      const x = value.position.x, z = value.position.z; value.position.x = z + 0.3; value.position.z = -x + 2.15;
      const rotation = new Euler().setFromQuaternion(yaw.clone().multiply(new Quaternion().setFromEuler(new Euler(MathUtils.degToRad(value.rotation.x), MathUtils.degToRad(value.rotation.y), MathUtils.degToRad(value.rotation.z)))));
      value.rotation = { x: MathUtils.radToDeg(rotation.x), y: MathUtils.radToDeg(rotation.y), z: MathUtils.radToDeg(rotation.z) };
    }
    parts.push(...discharge, strut("外伸卸料带下撑", [0.8, 1.2, 1.5], [3.3, 2.25, 1.55], 0.09));
    return parts;
  } },
];
