import { Euler, Quaternion, Vector3 } from "three";
import { part, type ModelPart } from "../assetModelParts";
import { fuselage, propeller } from "./aircraftModels";
import { jetNacelle, sweptWing } from "./aerospaceExpansionBatchFive";
import { airfoil, smallGear } from "./aerospaceExpansionBatchOne";
import { ball, box, cylinder, strut, surface, transportColors, type TransportDefinition } from "./parts";

// 公开构型的原创整体造型；不将同机的电源、面数、翼段数或品牌型号分成主项。
// https://www.nasa.gov/image-article/helios-prototype-flying-wing-2/
// https://www.nasa.gov/wp-content/uploads/2023/04/sp-4539.pdf
// https://nas.nasa.gov/SC22/research/project4.html
export const aerospaceExpansionBatchTen: TransportDefinition[] = [
  { name: "分段上反翼无机身太阳能高空飞机", theme: "现代", tags: ["太阳能高空飞机", "无主机身超长飞翼", "分段上反翼", "下挂轻质系统吊舱"], create: () => {
    const parts: ModelPart[] = [];
    for (const x of [-18, -6, 6, 18]) parts.push(airfoil("极高展弦比连续承力主翼的中间段", 12, 2.3, [x, 2.7, 0]), box("沿中间翼段铺设的光伏表皮", [x, 2.83, 0], [11.8, 0.015, 1.8], "#496e82"));
    for (const side of [-1, 1]) {
      const bank = side * 10 * Math.PI / 180, rotation = new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), bank), center = new Vector3(side * 24, 2.7, 0);
      const wing = airfoil("外翼端上反以形成空间稳定性的翼段", 12, 2.3, [side * 6, 0, 0]);
      const panel = box("与外翼端同角度的光伏表皮", [side * 6, 0.13, 0], [11.8, 0.015, 1.8], "#496e82");
      for (const value of [wing, panel]) {
        const p = new Vector3(value.position.x, value.position.y, value.position.z).applyQuaternion(rotation).add(center), local = new Quaternion().setFromEuler(new Euler(value.rotation.x * Math.PI / 180, value.rotation.y * Math.PI / 180, value.rotation.z * Math.PI / 180)), e = new Euler().setFromQuaternion(rotation.clone().multiply(local));
        value.position = { x: p.x, y: p.y, z: p.z }; value.rotation = { x: e.x * 180 / Math.PI, y: e.y * 180 / Math.PI, z: e.z * 180 / Math.PI }; parts.push(value);
      }
    }
    for (const x of [-24, -12, 0, 12, 24]) parts.push(part("翼段接缝下方承载控制器的轻质竖吊舱", "capsule", transportColors.trim, [x, 1.3, 0], [1.0, 2.1, 1.0], [0, 0, 0]), strut("吊舱顶端至主翼骨架的承力接头", [x, 2.2, 0], [x, 2.7, 0], 0.1), cylinder("竖吊舱下端的轻质接地轮", [x, 0.15, 0], [0.3, 0.08, 0.3], transportColors.dark, [0, 0, 90]));
    for (const x of [-29.91, -18, -6, 6, 18, 29.91]) {
      const y = Math.abs(x) > 24 ? 2.7 + (Math.abs(x) - 24) * Math.tan(10 * Math.PI / 180) : 2.7;
      parts.push(cylinder("前缘分布式电推进的小直径电机", [x, y - 0.05, -1.0], [0.22, 0.6, 0.22], transportColors.body, [90, 0, 0]), ...propeller(x, y - 0.05, -1.4, 0.8));
    }
    return parts;
  } },
  { name: "前后翼斜接菱形联翼研究飞机", theme: "现代", tags: ["菱形联翼", "前低后高两翼直接斜接", "无独立竖向翼端板"], create: () => {
    const parts: ModelPart[] = [fuselage(12.8, 1.4, 1.9), ball("联翼前方的透明飞行座舱", [0, 2.5, -3.3], [1.0, 0.85, 1.65], transportColors.glass), surface("承托后上翼根部的垂直尾身", transportColors.signal, [[0, 0, -0.9], [0, 1.7, 0.1], [0, 0, 1.2]], [0, 1, 2], [0, 1.9, 4.25]), airfoil("从中央尾身接出后上翼的短根部", 1.3, 1.3, [0, 3.0, 4.2]), cylinder("尾身延伸至后推式螺旋桨的动力机匣", [0, 2.15, 5.9], [0.45, 1.3, 0.45], transportColors.body, [90, 0, 0]), ...propeller(0, 2.15, 6.65, 0.9), ...smallGear([[-0.8, 1.8, 0.7], [0.8, 1.8, 0.7]], [0, 1.6, -3.5], 0.25)];
    for (const side of [-1, 1]) parts.push(sweptWing("从前低翼根后掠到联接点的前翼", [side * 0.55, 1.8, -1.6], [side * 6.0, 2.4, 1.5], 1.6, 0.75), sweptWing("从后高翼根前掠到同一联接点的后翼", [side * 0.55, 3.0, 4.2], [side * 6.0, 2.4, 1.5], 1.3, 0.75));
    return parts;
  } },
  { name: "长斜撑高展弦比高翼喷气客机", theme: "现代", tags: ["桁架支撑主翼", "高展弦比高翼客机", "主斜撑与副撑杆", "完整概念运输飞机"], create: () => {
    const parts: ModelPart[] = [fuselage(46, 4.1, 5.7), airfoil("跨过机身顶部的高置中央翼梁", 4.6, 5.5, [0, 7.8, 1.2]), surface("支承高位水平尾翼的垂直安定面", transportColors.signal, [[0, 0, -2.2], [0, 6.8, 0.9], [0, 0, 3.2]], [0, 1, 2], [0, 6.5, 17.0]), airfoil("主承力翼之后的高位水平尾翼", 11, 2.2, [0, 13.2, 17.6]), ball("高翼客机前鼻驾驶风挡", [0, 7.0, -17.2], [2.7, 1.05, 1.7], transportColors.glass), ...smallGear([[-2.0, 4.3, 5.0], [2.0, 4.3, 5.0]], [0, 4.3, -14.0], 0.65)];
    for (const side of [-1, 1]) parts.push(sweptWing("由长斜撑分担弯矩的薄型长主翼", [side * 1.7, 7.8, 1.2], [side * 29.0, 9.8, 13.0], 5.5, 1.6), strut("从机腹侧面伸至外主翼的长斜承力撑", [side * 1.4, 4.35, 3.0], [side * 18.5, 9.0, 9.3], 0.28), strut("主翼与长斜撑之间的独立副撑杆", [side * 10.5, 6.83, 6.35], [side * 10.5, 8.44, 6.35], 0.15), ...jetNacelle(side * 6.5, 5.65, 1.0, 1.0, 4.0), strut("高置主翼至翼下动力短舱的悬挂支架", [side * 6.5, 8.2, 1.6], [side * 6.5, 6.5, 1.6], 0.24));
    return parts;
  } },
];
