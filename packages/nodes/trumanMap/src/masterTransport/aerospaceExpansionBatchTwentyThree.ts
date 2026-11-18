import { Euler, Quaternion, Vector3 } from "three";
import { part, ring, type ModelPart, type Triple } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { cylinderBetween } from "./aerospaceExpansionBatchFour";
import { box, cylinder, strut, transportColors, wheel, type TransportDefinition } from "./parts";

// 碟形载体为原创虚构飞行器，不复用影视/游戏品牌或声称现实推进原理。
// 开式推进与两栖浮筒只表达公开产品结构，不按叶片数、尺寸或收放状态扩项。
// https://airandspace.si.edu/collection-objects/general-electric-ge36-unducted-fan-udf-turboprop-engine/nasm_A19920001000
// https://www.wipaire.com/wipline-floats/
export const aerospaceExpansionBatchTwentyThree: TransportDefinition[] = [
  { name: "封闭碟形承压舱科幻飞行器", theme: "科幻", tags: ["原创科幻飞碟", "封闭碟形主舱", "顶部乘员穹舱", "三点展开落腿"], create: () => {
    const parts: ModelPart[] = [part("上下曲面连成整体而非环形风扇的封闭碟形主舱", "lathe", transportColors.body, [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 1.5 }, { x: 2.0, y: 1.65 }, { x: 5.5, y: 2.0 }, { x: 9.0, y: 2.9 }, { x: 9.0, y: 3.4 }, { x: 5.5, y: 4.3 }, { x: 2.0, y: 4.6 }, { x: 0, y: 4.7 }] }), part("与碟形主舱顶面实际相接的封闭乘员穹舱", "lathe", transportColors.trim, [0, 4.4, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: 3.1, y: 0 }, { x: 3.0, y: 0.5 }, { x: 2.2, y: 1.4 }, { x: 0, y: 1.8 }] }), ring("主舱下曲面内实际嵌接的科幻环形推进饰环", transportColors.dark, 5.0, 0.7, 1.9, 0.35), cylinder("飞行器腹部保持关闭的圆形出入舱门", [0, 1.48, 0], [2.4, 0.1, 2.4], transportColors.dark)];
    for (let index = 0; index < 24; index++) {
      const a = index * Math.PI / 12;
      parts.push(box("嵌在主舱垂直环形侧壁上的独立舷窗玻璃", [Math.cos(a) * 8.99, 3.15, Math.sin(a) * 8.99], [0.8, 0.25, 0.1], transportColors.glass, [0, 90 - a * 180 / Math.PI, 0]));
    }
    for (let index = 0; index < 3; index++) {
      const a = index * Math.PI * 2 / 3, x = Math.cos(a), z = Math.sin(a);
      parts.push(cylinderBetween("从碟形主舱下部外张到接地脚的长承载落腿", [x * 5.5, 2.3, z * 5.5], [x * 6.6, 0.22, z * 6.6], 0.18, transportColors.body), strut("落腿内侧由腹部接到脚端的实际抗侧向斜撑", [x * 4.7, 2.1, z * 4.7], [x * 6.6, 0.22, z * 6.6], 0.12), cylinder("三点落腿末端完整接地的圆盘脚垫", [x * 6.6, 0.1, z * 6.6], [1.1, 0.2, 1.1], transportColors.dark));
    }
    return parts;
  } },
  { name: "开式双转子后推桨扇航空推进总成", theme: "现代", itemType: "构件", tags: ["独立开式桨扇推进单元", "无大直径外涵道", "前后对转宽弦桨扇", "封闭动力核心与承载座"], create: () => {
    const parts: ModelPart[] = [part("从前部进气口收分到后端的真正中空动力核心外壳", "lathe", transportColors.body, [0, 2.5, 0], [1, 1, 1], [90, 0, 0], { profile: [{ x: 0.6, y: -2.5 }, { x: 0.7, y: -2.5 }, { x: 0.8, y: -1.0 }, { x: 0.45, y: 0.2 }, { x: 0.45, y: 1.8 }, { x: 0.3, y: 2.2 }, { x: 0.22, y: 2.2 }, { x: 0.37, y: 1.8 }, { x: 0.37, y: 0.2 }, { x: 0.7, y: -1.0 }, { x: 0.6, y: -2.5 }] }), box("动力核心外壳上实际接入的短承载吊架", [0, 3.4, -0.8], [0.6, 0.6, 1.0], transportColors.dark), box("短承载吊架最上端与飞机连接的宽安装面", [0, 3.75, -0.8], [1.1, 0.12, 1.2], transportColors.body)];
    for (const [row, sign] of [[0.6, 1], [1.25, -1]]) {
      parts.push(ring("套在动力核心后段外侧的独立反转桨扇承载毂", transportColors.dark, 0.55, 0.17, 0, 0.24, { position: { x: 0, y: 2.5, z: row! }, rotation: { x: 90, y: 0, z: 0 } }));
      for (let index = 0; index < 8; index++) {
        const angle = index * Math.PI / 4 + (sign! < 0 ? Math.PI / 8 : 0), q = new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), angle).multiply(new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), sign! * 16 * Math.PI / 180)), e = new Euler().setFromQuaternion(q);
        parts.push(part("完整后掠宽弦外露桨扇叶片", "extrude", transportColors.dark, [0, 2.5, row!], [1, 1, 1], [e.x * 180 / Math.PI, e.y * 180 / Math.PI, e.z * 180 / Math.PI], { depth: 0.1, profile: [{ x: 0.45, y: -0.14 }, { x: 1.2, y: -0.2 }, { x: 1.9, y: -0.38 }, { x: 2.15, y: -0.15 }, { x: 1.85, y: 0.18 }, { x: 1.1, y: 0.26 }, { x: 0.45, y: 0.14 }] }));
      }
    }
    return parts;
  } },
  { name: "阶梯底艇体两栖双浮筒起落总成", theme: "现代", itemType: "构件", tags: ["完整两栖浮筒起落装置", "真实底部轮舱凹口", "浮筒阶梯底", "交叉支承与水上尾舵"], create: () => {
    const outline: [number, number][] = [[-3.4, 1.35], [-3.0, 1.5], [2.8, 1.5], [3.2, 1.3], [3.2, 0.75], [1.4, 0.63], [1.4, 1.2], [0.6, 1.2], [0.6, 0.57], [0.4, 0.55], [0.4, 0.35], [-1.8, 0.46], [-1.8, 1.18], [-2.7, 1.18], [-2.7, 0.69], [-3.4, 0.85]], parts: ModelPart[] = [];
    for (const side of [-1, 1]) {
      const x = side * 1.5, hull = polygon("同时保留水动力阶梯底与两处向下开敞轮舱的完整浮筒艇体", transportColors.body, outline, 0.9, [x - 0.45, 0, 0]); hull.rotation = { x: -90, y: 0, z: -90 }; parts.push(hull, box("浮筒顶甲板上实际接入的短防滑踏步面", [x, 1.51, -0.3], [0.6, 0.04, 1.0], transportColors.dark), cylinder("浮筒后端实际连接水上方向舵的垂直铰轴", [x, 0.9, 3.18], [0.06, 0.7, 0.06], transportColors.dark), box("在艇体尾部垂直铰轴后方连接的水上方向舵", [x, 0.7, 3.42], [0.05, 0.8, 0.45], transportColors.trim));
      for (const [z, radius, roof] of [[-2.3, 0.28, 1.23], [1.0, 0.34, 1.25]]) parts.push(...wheel([x, radius!, z!], radius!, 0.25), strut("从轮舱顶部进入实体承座后接到机轮的起落支腿", [x, roof!, z!], [x, radius!, z!], 0.08), cylinder("轮舱顶实际固定起落支腿的横向承载销", [x, roof!, z!], [0.12, 0.55, 0.12], transportColors.dark, [0, 0, 90]));
      for (const z of [-1.0, 1.9]) parts.push(strut("从浮筒实体顶甲板斜向接到飞机接口的承载立架", [x, 1.45, z], [side * 0.8, 2.9, z], 0.15), box("承载立架上端可与飞机相连的宽安装接头", [side * 0.8, 2.9, z], [0.45, 0.16, 0.45], transportColors.dark));
    }
    for (const z of [-1.0, 1.9]) parts.push(box("连接双浮筒并在途中与斜向立架实际相交的横承梁", [0, 1.8, z], [3.0, 0.16, 0.2], transportColors.body));
    return parts;
  } },
];
