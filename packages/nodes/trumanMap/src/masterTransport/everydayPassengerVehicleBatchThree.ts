import { part, type ModelPart, type Triple } from "../assetModelParts";
import { bodyShell, cabin, captainSeats, drivingControls, doorsAndMirrors, glazing, quadFaces, bench } from "./everydayPassengerVehicleBatchOne";
import { box, strut, surface, transportColors, type TransportDefinition } from "./parts";

function curvedFastbackCabin(parts: ModelPart[], color: string) {
  const belt = 1.03, sideX = 0.87, posts = [{ base: -1.25, z: -0.64, y: 1.43 }, { base: 0, z: 0, y: 1.53 }, { base: 1.1, z: 0.75, y: 1.461 }, { base: 2.05, z: 0.98, y: 1.44 }];
  const xAt = (y: number) => sideX - (y - belt) * 0.3;
  for (let index = 0; index < posts.length - 1; index++) {
    const a = posts[index]!, b = posts[index + 1]!;
    parts.push(surface("单弧车顶连续相接的薄壳分段", color, [[-xAt(a.y), a.y, a.z], [xAt(a.y), a.y, a.z], [xAt(b.y), b.y, b.z], [-xAt(b.y), b.y, b.z]], quadFaces));
    for (const side of [-1, 1]) {
      const along = (post: typeof a, fraction: number): Triple => { const y = belt + (post.y - belt) * fraction; return [side * xAt(y), y, post.base + (post.z - post.base) * fraction]; };
      parts.push(strut("随单弧顶盖起伏的侧顶梁", [side * xAt(a.y), a.y, a.z], [side * xAt(b.y), b.y, b.z], 0.055, color), glazing("沿倾斜侧平面并搭接独立窗柱的车门玻璃", [along(a, 0.05), along(b, 0.05), along(b, 0.95), along(a, 0.95)]));
    }
  }
  const a = posts[0]!, b = posts[posts.length - 1]!;
  parts.push(glazing("短前舱上方的大面积前倾风挡", [[-0.85, belt, a.base], [0.85, belt, a.base], [xAt(a.y) - 0.02, a.y, a.z], [-xAt(a.y) + 0.02, a.y, a.z]]), glazing("连通行李厢的长斜背尾门玻璃", [[0.85, belt, b.base], [-0.85, belt, b.base], [-xAt(b.y) + 0.02, b.y, b.z], [xAt(b.y) - 0.02, b.y, b.z]]));
  for (const side of [-1, 1]) {
    parts.push(box("电动车座舱下沿连续窗台与侧围接合", [side * 0.895, belt, 0.4], [0.085, 0.065, 3.34], color));
    for (const post of posts) parts.push(strut("前后门与斜背小三角窗之间的真实窗柱", [side * sideX, belt, post.base], [side * xAt(post.y), post.y, post.z], 0.055, color));
  }
}

export const everydayPassengerVehicleBatchThree: TransportDefinition[] = [
  { name: "平底电池舱单弧顶五门溜背汽车", theme: "现代", tags: ["汽车", "影视", "生活常见", "纯电溜背乘用车", "长轴距平底电池舱", "单弧顶与大斜背尾门"], create: () => {
    const color = "#adb9bd", parts = bodyShell({ front: -2.35, rear: 2.35, cowl: -1.25, width: 1.83, bottom: 0.25, radius: 0.34, axles: [-1.5, 1.5], track: 1.62, tire: 0.225, belt: 1.03, frontTop: 0.88, floorY: 0.38, floorZ: -0.05, floorLength: 2.6, color });
    curvedFastbackCabin(parts, color);
    parts.push(box("两车桥之间真实承接座舱地板的扁平电池封装", [0, 0.26, -0.05], [1.32, 0.12, 2.6], "#4d5f69"), box("后车桥中央一体电驱动机壳", [0, 0.39, 1.45], [0.64, 0.22, 0.4], "#6a7c85"), surface("电动车低鼻短前舱上盖", color, [[-0.89, 0.88, -2.35], [0.89, 0.88, -2.35], [0.89, 1.03, -1.25], [-0.89, 1.03, -1.25]], quadFaces), surface("长斜背玻璃与尾部钣金间的窄下沿", color, [[-0.85, 1.03, 2.05], [0.85, 1.03, 2.05], [0.89, 1.03, 2.35], [-0.89, 1.03, 2.35]], quadFaces), box("电机上方留净空的抬高尾舱底板", [0, 0.6, 1.675], [1.27, 0.16, 1.07], transportColors.dark), box("在电机前方连接两种地板高度的实体台阶", [0, 0.48, 1.08], [1.27, 0.16, 0.16], transportColors.dark), box("电池后方纵梁到尾舱的实际支座", [0, 0.465, 2.1], [1.27, 0.26, 0.14], transportColors.dark), box("斜背尾门独立开启把手", [0, 0.87, 2.371], [0.26, 0.04, 0.035], transportColors.trim));
    captainSeats(parts, -0.37, 0.35, 0.52, 0.46);
    bench(parts, 0.65, 0.5, 0.46, 1.23);
    drivingControls(parts, -1.18, 0.86, 1.77, -0.35);
    doorsAndMirrors(parts, 1.83, 1.03, [-0.2, 0.83], -1.16);
    return parts;
  } },
  { name: "长机罩双门四座低顶现代轿跑", theme: "现代", tags: ["汽车", "影视", "生活常见", "双门轿跑", "前置机舱二加二独立座位", "固定后风挡与短行李箱盖"], create: () => {
    const color = "#a6b1be", parts = bodyShell({ front: -2.35, rear: 2.3, cowl: -0.65, width: 1.85, bottom: 0.22, radius: 0.34, axles: [-1.45, 1.45], track: 1.6, tire: 0.235, belt: 0.9, frontTop: 0.8, floorY: 0.27, floorZ: 0, floorLength: 2.2, color });
    cabin(parts, { belt: 0.9, roofY: 1.38, sideX: 0.86, roofX: 0.71, posts: [[-0.65, -0.1], [0.55, 0.55], [1.35, 0.85]], color, sillStart: -0.65, sillEnd: 1.35 });
    parts.push(surface("双门轿跑前置机舱的完整长机罩", color, [[-0.9, 0.8, -2.35], [0.9, 0.8, -2.35], [0.9, 0.9, -0.65], [-0.9, 0.9, -0.65]], quadFaces), surface("与后风挡独立分开的短行李箱上盖", color, [[-0.86, 0.9, 1.35], [0.86, 0.9, 1.35], [0.9, 0.9, 2.3], [-0.9, 0.9, 2.3]], quadFaces), box("后排后方的行李箱内部承载地板", [0, 0.46, 1.6], [1.25, 0.14, 1.2], transportColors.dark), box("乘员低地板与行李箱地板的实体台阶", [0, 0.36, 1.075], [1.25, 0.1, 0.2], transportColors.dark), box("纵梁到后行李箱地板的实际支承横架", [0, 0.355, 2.0], [1.25, 0.13, 0.14], transportColors.dark));
    captainSeats(parts, -0.14, 0.35, 0.42, 0.35);
    captainSeats(parts, 0.6, 0.33, 0.42, 0.35);
    drivingControls(parts, -0.66, 0.76, 1.79, -0.35);
    doorsAndMirrors(parts, 1.85, 0.9, [0.36], -0.58);
    for (const side of [-1, 1]) parts.push(strut("长前门后缘到固定后侧窗下方的门缝", [side * 0.927, 0.3, 0.55], [side * 0.927, 0.9, 0.55], 0.014));
    return parts;
  } },
  { name: "双座低腰现代敞篷跑车", theme: "现代", tags: ["汽车", "影视", "生活常见", "现代敞篷跑车", "双座开放乘员舱", "倾斜前风挡与独立双翻滚环"], create: () => {
    const color = "#bac0b6", parts = bodyShell({ front: -1.95, rear: 1.95, cowl: -0.5, width: 1.77, bottom: 0.22, radius: 0.32, axles: [-1.2, 1.2], track: 1.52, tire: 0.22, belt: 0.79, frontTop: 0.74, floorY: 0.28, floorZ: 0, floorLength: 1.8, color });
    parts.push(surface("低鼻流线前置发动机罩", color, [[-0.86, 0.74, -1.95], [0.86, 0.74, -1.95], [0.86, 0.79, -0.5], [-0.86, 0.79, -0.5]], quadFaces), surface("开放双座后方的完整封闭后备厢盖", color, [[-0.86, 0.79, 0.98], [0.86, 0.79, 0.98], [0.86, 0.79, 1.95], [-0.86, 0.79, 1.95]], quadFaces), box("车架实际承托的后行李厢底板", [0, 0.4, 1.35], [1.2, 0.18, 1.0], transportColors.dark), box("两座靠背后与侧围接合的翻滚环基座隔墙", [0, 0.61, 0.77], [1.64, 0.5, 0.1], color), glazing("无顶开放座舱前方倾斜风挡", [[-0.78, 0.79, -0.5], [0.78, 0.79, -0.5], [0.61, 1.3, -0.16], [-0.61, 1.3, -0.16]]), box("两根风挡A柱之间真正接合的上框", [0, 1.3, -0.16], [1.32, 0.05, 0.05], color));
    for (const side of [-1, 1]) {
      parts.push(strut("从开放座舱侧围连接风挡上框的A柱", [side * 0.8, 0.79, -0.5], [side * 0.63, 1.3, -0.16], 0.055, color), box("开放座舱两侧连续车门腰线", [side * 0.815, 0.79, 0.23], [0.09, 0.065, 1.52], color), part("由靠背后隔墙实际承托的独立防翻滚环", "tube", transportColors.dark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: 0.025, path: [{ x: side * 0.34 - 0.18, y: 0.83, z: 0.77 }, { x: side * 0.34 - 0.18, y: 1.15, z: 0.77 }, { x: side * 0.34, y: 1.24, z: 0.77 }, { x: side * 0.34 + 0.18, y: 1.15, z: 0.77 }, { x: side * 0.34 + 0.18, y: 0.83, z: 0.77 }] }), strut("座舱门后缘的独立门缝", [side * 0.887, 0.29, 0.71], [side * 0.887, 0.79, 0.71], 0.014));
    }
    captainSeats(parts, 0.14, 0.34, 0.43, 0.36);
    drivingControls(parts, -0.49, 0.71, 1.71, -0.34);
    doorsAndMirrors(parts, 1.77, 0.79, [0.55], -0.43);
    return parts;
  } },
];
