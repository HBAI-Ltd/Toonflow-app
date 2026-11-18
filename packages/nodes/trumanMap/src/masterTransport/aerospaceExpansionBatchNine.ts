import { Euler, Quaternion, Vector3 } from "three";
import { part, ring, type ModelPart, type Triple } from "../assetModelParts";
import { cylinderBetween } from "./aerospaceExpansionBatchFour";
import { box, cylinder, strut, transportColors, type TransportDefinition } from "./parts";

function longRam(start: Triple, end: Triple, diameter: number): ModelPart[] {
  const middle = start.map((value, index) => value + (end[index]! - value) * 0.58) as Triple;
  return [cylinderBetween("铰接液压举升机构的外缸筒", start, middle, diameter, transportColors.body), cylinderBetween("从缸筒伸向活动构件的柱塞", middle, end, diameter * 0.43, transportColors.trim)];
}

// 大型静态场景设备，仅简化外部装配；未实现弹射/拦阻/发射控制或任何动力计算。
// https://www.navair.navy.mil/product/launching-systems
// https://blogs.nasa.gov/commercialcrew/2016/06/17/modifications-transforming-pad-a-for-falcon-launches/
export const aerospaceExpansionBatchNine: TransportDefinition[] = [
  { name: "液压起伏式航空喷流偏流挡焰屏", theme: "现代", itemType: "设施", tags: ["喷流偏流屏", "后部液压撑杆", "完整地面防护装置"], create: () => {
    const angle = 55 * Math.PI / 180, pivotY = 0.55, pivotZ = -1.8;
    const parts: ModelPart[] = [box("挡焰屏及起伏机构的共同落地基座", [0, 0.2, 0], [9.1, 0.4, 6.0], transportColors.dark), cylinder("屏体下沿贯通的水平起伏铰轴", [0, pivotY, pivotZ], [0.22, 8.8, 0.22], transportColors.body, [0, 0, 90]), box("抬起后的连续高温偏流屏体", [0, pivotY + Math.sin(angle) * 2.5, pivotZ + Math.cos(angle) * 2.5], [8.4, 0.18, 5.0], transportColors.body, [-55, 0, 0]), box("独立液压与冷却控制柜基础", [5.05, 0.1, 1.0], [1.3, 0.2, 1.5], transportColors.dark), box("侧置液压冷却控制柜", [5.05, 0.85, 1.0], [1.2, 1.3, 1.4], transportColors.signal)];
    for (const x of [-3.6, -1.8, 0, 1.8, 3.6]) parts.push(strut("偏流屏背面的连续抗弯加强肋", [x, pivotY - 0.07, pivotZ], [x, pivotY + Math.sin(angle) * 5 - 0.07, pivotZ + Math.cos(angle) * 5], 0.13));
    for (const side of [-1, 1]) parts.push(...longRam([side * 3.0, 0.44, 2.2], [side * 3.0, pivotY + Math.sin(angle) * 3.1, pivotZ + Math.cos(angle) * 3.1], 0.3), cylinder("举升缸在底座上的横向铰座", [side * 3.0, 0.44, 2.2], [0.2, 0.55, 0.2], transportColors.dark, [0, 0, 90]), part("从固定柜通向活动屏体的冷却柔性管", "tube", transportColors.dark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: 0.045, path: [{ x: side * 3.8, y: 0.48, z: -2.1 }, { x: side * 4.1, y: 1.2, z: -1.7 }, { x: side * 3.8, y: 2.2, z: -0.5 }, { x: side * 3.75, y: 3.6, z: 0.4 }] }));
    parts.push(cylinderBetween("连接左右活动屏冷却支管的基座总管", [-3.8, 0.48, -2.1], [3.8, 0.48, -2.1], 0.1, transportColors.dark), part("由控制柜接至基座冷却总管的软连接", "tube", transportColors.dark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: 0.05, path: [{ x: 3.8, y: 0.48, z: -2.1 }, { x: 4.2, y: 0.48, z: -1.0 }, { x: 5.05, y: 0.85, z: 0.3 }] }));
    return parts;
  } },
  { name: "滑轮组长缸式航空着陆拦阻缓冲机", theme: "现代", itemType: "设施", tags: ["着陆拦阻缓冲", "往复滑轮车", "长液压吸能缸", "完整地面机组"], create: () => {
    const parts: ModelPart[] = [box("整套拦阻缓冲机的长条落地底座", [0, 0.15, 0], [4.0, 0.3, 14], transportColors.dark), ...[-1, 1].map(side => box("吸能滑轮车两侧的纵向导轨", [side * 1.4, 0.48, 0], [0.17, 0.2, 12.7], transportColors.body)), box("可沿双导轨前后移动的滑轮承载车", [0, 0.7, 5.0], [3.1, 0.3, 2.1], transportColors.body), box("连接长缸柱塞的滑轮车后端立板", [0, 1.1, 5.7], [2.6, 1.0, 0.3], transportColors.body), ...longRam([-0.9, 1.3, -5.7], [-0.9, 1.3, 5.55], 0.68), box("固定端缸筒的反力承座", [-0.9, 0.9, -5.7], [1.2, 1.2, 0.6], transportColors.body)];
    const path: { x: number; y: number; z: number }[] = [{ x: -0.5, y: 1.07, z: -6.6 }];
    for (let index = 0; index < 3; index++) {
      const y = 1.1 + index * 0.35;
      for (const z of [-4.8, 4.8]) parts.push(part("具有中央轴孔与真实周向绳槽的滑轮", "lathe", transportColors.body, [0, y, z], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0.08, y: -0.08 }, { x: 0.55, y: -0.08 }, { x: 0.55, y: -0.04 }, { x: 0.48, y: -0.025 }, { x: 0.48, y: 0.025 }, { x: 0.55, y: 0.04 }, { x: 0.55, y: 0.08 }, { x: 0.08, y: 0.08 }, { x: 0.08, y: -0.08 }] }));
      for (const a of [Math.PI, Math.PI * 1.5, Math.PI * 2]) path.push({ x: Math.cos(a) * 0.5, y, z: -4.8 + Math.sin(a) * 0.5 });
      for (const a of [0, Math.PI / 2, Math.PI]) path.push({ x: Math.cos(a) * 0.5, y, z: 4.8 + Math.sin(a) * 0.5 });
    }
    path.push({ x: 1.8, y: 0.78, z: 7.3 });
    parts.push(part("两组滑轮之间连续绕行的完整拦阻索", "tube", transportColors.dark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: 0.02, path }), ring("拦阻索外端完整连接眼", transportColors.trim, 0.22, 0.06, 0, 0.1, { position: { x: 1.8, y: 1.0, z: 7.3 }, rotation: { x: 90, y: 0, z: 0 } }), ring("固定端拦阻索的反力锚眼", transportColors.dark, 0.17, 0.05, 0, 0.1, { position: { x: -0.5, y: 0.9, z: -6.6 }, rotation: { x: 90, y: 0, z: 0 } }), box("反力锚眼与落地底座之间的固定承座", [-0.5, 0.6, -6.6], [0.55, 0.6, 0.45], transportColors.body));
    for (const z of [-4.8, 4.8]) parts.push(cylinder("三层滑轮共同的竖直固定轴", [0, 1.27, z], [0.16, 1.95, 0.16], transportColors.dark), box("滑轮主轴底部承座", [0, 0.5, z], [1.1, 0.4, 1.15], transportColors.body));
    return parts;
  } },
  { name: "封槽双导轨航空弹射滑梭平台", theme: "现代", itemType: "设施", tags: ["航空弹射地面装置", "封闭驱动槽", "双导轨滑梭", "静态场景设备"], create: () => {
    const parts: ModelPart[] = [box("连续驱动槽的封闭下部壳体", [0, 0.4, 0], [3.0, 0.5, 38], transportColors.dark), ...[-1, 1].map(side => box("中央留缝的两片封槽上盖", [side * 0.6, 0.76, 0], [1.0, 0.2, 36], transportColors.body)), box("穿出中央窄缝的滑梭腰板", [0, 0.75, 5.0], [0.16, 0.5, 1.5], transportColors.dark), box("位于槽上方的横向滑梭承台", [0, 1.03, 5.0], [1.25, 0.15, 1.3], transportColors.body), cylinder("滑梭前端的横向牵引锁销", [0, 1.24, 4.5], [0.16, 0.9, 0.16], transportColors.trim, [0, 0, 90]), cylinder("轨道末端外露的缓冲止挡", [0, 1.02, 17.1], [0.55, 2.2, 0.55], transportColors.dark, [90, 0, 0]), box("侧边监控柜落地底脚", [2.3, 0.1, -12], [1.1, 0.2, 1.4], transportColors.dark), box("侧边独立状态监控柜", [2.3, 0.85, -12], [1.0, 1.3, 1.3], transportColors.body)];
    for (const z of [-16, -5, 5, 16]) parts.push(box("双轨和驱动槽下方的共同支承枕梁", [0, 0.1, z], [3.8, 0.2, 0.9], transportColors.body));
    for (const side of [-1, 1]) parts.push(box("滑梭牵引销左右安装耳", [side * 0.4, 1.14, 4.5], [0.14, 0.35, 0.4], transportColors.dark));
    parts.push(strut("侧边监控柜接至驱动槽的刚性电缆桥", [1.4, 0.5, -12], [2.3, 0.5, -12], 0.08));
    return parts;
  } },
  { name: "科研火箭铰接起竖轨道转运架", theme: "现代", tags: ["科研航天转运", "长托架起竖", "尾端铰轴", "空载火箭运输工装"], create: () => {
    const parts: ModelPart[] = [box("轨道起竖架的低位完整行走底台", [0, 0.95, 0], [6.0, 0.5, 16], transportColors.dark), cylinder("长起竖托架尾端的横向主铰轴", [0, 1.6, -6.0], [0.45, 4.3, 0.45], transportColors.body, [0, 0, 90])];
    for (const side of [-1, 1]) {
      for (const z of [-6, -2, 2, 6]) parts.push(cylinder("轨道底台的大直径行走轮", [side * 2.65, 0.34, z], [0.68, 0.3, 0.68], transportColors.body, [0, 0, 90]));
      for (const z of [-6.6, 6.6]) parts.push(strut("起竖时撑在轨道外侧的横向支承臂", [side * 2.8, 1.0, z], [side * 3.75, 1.0, z], 0.18), cylinder("外伸支承臂落地调平柱", [side * 3.75, 0.55, z], [0.18, 0.9, 0.18], transportColors.dark), box("调平柱末端的落地承压垫", [side * 3.75, 0.075, z], [0.9, 0.15, 0.9], transportColors.body));
    }
    for (const z of [-6, -2, 2, 6]) {
      parts.push(cylinder("行走轮之间连续贯通的承重车轴", [0, 0.34, z], [0.14, 5.5, 0.14], transportColors.dark, [0, 0, 90]));
      for (const side of [-1, 1]) parts.push(box("车轴轴承与转运底台之间的承托座", [side * 2.2, 0.52, z], [0.35, 0.38, 0.35], transportColors.body));
    }
    const cradle: ModelPart[] = [];
    for (const side of [-1, 1]) {
      for (const y of [0, -0.8]) cradle.push(box("双层起竖长桁架的纵向弦梁", [side * 1.6, y, 15], [0.22, 0.24, 30], transportColors.body));
      for (let index = 0; index < 6; index++) cradle.push(strut("长托架侧面三角桁格斜撑", [side * 1.6, -0.8, index * 5], [side * 1.6, 0, (index + 1) * 5], 0.12));
    }
    for (let index = 0; index <= 6; index++) cradle.push(box("将双桁架连接为整体托架的横枕", [0, 0.05, index * 5], [3.4, 0.25, 0.25], transportColors.body));
    for (const z of [5, 15, 25]) {
      const profile = [2.0, 1.85].flatMap((r, layer) => Array.from({ length: 13 }, (_, index) => { const a = Math.PI + (layer ? 12 - index : index) * Math.PI / 12; return { x: Math.cos(a) * r, y: Math.sin(a) * r }; }));
      cradle.push(part("用于承托圆筒火箭且上方敞开的U形托鞍", "extrude", transportColors.trim, [0, 2.0, z], [1, 1, 1], [0, 0, 0], { depth: 0.25, profile }));
    }
    const rotation = new Quaternion().setFromEuler(new Euler(-60 * Math.PI / 180, 0, 0));
    for (const value of cradle) {
      const p = new Vector3(value.position.x, value.position.y, value.position.z).applyQuaternion(rotation).add(new Vector3(0, 1.6, -6));
      const q = new Quaternion().setFromEuler(new Euler(value.rotation.x * Math.PI / 180, value.rotation.y * Math.PI / 180, value.rotation.z * Math.PI / 180)), e = new Euler().setFromQuaternion(rotation.clone().multiply(q));
      value.position = { x: p.x, y: p.y, z: p.z }; value.rotation = { x: e.x * 180 / Math.PI, y: e.y * 180 / Math.PI, z: e.z * 180 / Math.PI }; parts.push(value);
    }
    for (const side of [-1, 1]) {
      const endpoint = new Vector3(side * 1.6, -0.8, 12).applyQuaternion(rotation).add(new Vector3(0, 1.6, -6));
      parts.push(...longRam([side * 2.2, 0.95, 5.0], [endpoint.x, endpoint.y, endpoint.z], 0.45));
    }
    return parts;
  } },
];
