import { Euler, Quaternion, Vector3 } from "three";
import { part, ring, type ModelPart, type Triple } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { bodyLoft, jetNacelle, sweptWing } from "./aerospaceExpansionBatchFive";
import { airfoil, smallGear } from "./aerospaceExpansionBatchOne";
import { ball, bicycleFrame, box, cylinder, strut, surface, transportColors, type TransportDefinition } from "./parts";

// 原创整机结构：横列固定轴旋翼、张弦人力直升机、旋转长带光帆与翼内升力风扇。
// https://rotorcraft.arc.nasa.gov/FINAL_Harris%20Vol%20II_Feb%2011%202013.pdf
// https://www.aerovelo.com/our-projects/
// https://ntrs.nasa.gov/citations/19670018298
// https://www.army.mil/article-amp/195950/fixed_wing_vertical_lift_experiment_on_display_at_museum
export const aerospaceExpansionBatchTwelve: TransportDefinition[] = [
  { name: "横列双主旋翼宽承力翼重型直升机", theme: "现代", tags: ["横列固定轴双旋翼", "侧置动力传动塔", "宽承力翼及斜撑", "完整重型直升机"], create: () => {
    const parts: ModelPart[] = [bodyLoft("高截面货舱与收分尾身组成的连续机身", [[-11, 0.1, 0.15, 0], [-9, 1.4, 1.45, 0], [-6, 2.1, 2.1, 0], [5, 2.1, 2.1, 0], [9, 0.7, 0.9, 0.5], [11, 0.1, 0.12, 0.8]], 4.0), ball("大货舱前方的完整驾驶风挡", [0, 5.0, -8.8], [2.6, 1.25, 1.5], transportColors.glass), airfoil("长尾身末端的横向稳定平尾", 8, 1.9, [0, 5.3, 9.0]), surface("长尾身上方不带反扭桨的垂直安定面", transportColors.signal, [[0, 0, -1.5], [0, 3.5, 0.4], [0, 0, 2.1]], [0, 1, 2], [0, 4.65, 8.5]), ...smallGear([[-2.1, 3.4, 3.5], [2.1, 3.4, 3.5]], [0, 3.2, -7.5], 0.65)];
    for (const side of [-1, 1]) {
      parts.push(sweptWing("由中央机身向固定侧置旋翼塔伸出的承力翼", [side * 1.5, 5.3, -0.6], [side * 9.8, 5.6, -0.6], 3.0, 2.2), box("固定竖轴主旋翼下方的减速齿轮箱", [side * 9.8, 6.2, -0.6], [1.35, 1.45, 1.6], transportColors.body), cylinder("与侧置承力翼保持固定方向的主旋翼轴", [side * 9.8, 7.05, -0.6], [0.35, 1.0, 0.35], transportColors.dark), strut("从货舱下部接到侧置传动塔的前斜撑", [side * 1.8, 3.0, -2.0], [side * 9.4, 5.45, -1.3], 0.27), strut("从货舱下部接到侧置传动塔的后斜撑", [side * 1.8, 3.0, 1.4], [side * 9.4, 5.45, 0.1], 0.27));
      for (const angle of [0, 60, 120]) parts.push(airfoil("侧置旋翼毂上成对连接的长承力旋翼", 15, 0.65, [side * 9.8, 7.5, -0.6], [0, 90 + side * angle, 0]));
      for (const offset of [-0.65, 0.65]) parts.push(part("外端传动塔旁的贯通涡轴动力舱", "lathe", transportColors.dark, [side * 8.15, 6.1, -0.6 + offset], [1, 1, 1], [90, 0, 0], { profile: [{ x: 0.35, y: -1.5 }, { x: 0.39, y: -0.8 }, { x: 0.28, y: 1.4 }, { x: 0.22, y: 1.4 }, { x: 0.32, y: -0.8 }, { x: 0.28, y: -1.5 }, { x: 0.35, y: -1.5 }] }), strut("动力舱至承力翼的短安装架", [side * 8.15, 5.55, -0.6 + offset], [side * 8.15, 6.1, -0.6 + offset], 0.15));
    }
    return parts;
  } },
  { name: "四角张弦梁脚踏驱动巨型人力直升机", theme: "现代", tags: ["人力直升机", "脚踏绳带传动", "低盘载巨型旋翼", "四臂张弦承力架"], create: () => {
    const parts: ModelPart[] = [...bicycleFrame([0, 0.4, -0.85], [0, 0.4, 0.8], [0, 1.5, 0.15], [0, 0.65, -0.1], [0, 1.25, -0.7]), box("悬在中央承力架内的飞行员坐垫", [0, 1.55, 0.15], [0.38, 0.12, 0.5], transportColors.dark), ring("脚踏曲柄侧面的真正贯通传动轮", transportColors.dark, 0.22, 0.035, 0, 0.06, { position: { x: 0.1, y: 0.65, z: -0.1 }, rotation: { x: 0, y: 0, z: 90 } }), cylinder("飞行员上方的中央传动分配轮", [0, 2.5, 0], [0.55, 0.12, 0.55], transportColors.dark), strut("中央桅与机身下部相连的承载杆", [0, 0.65, -0.1], [0, 4.5, 0], 0.07), strut("中央上部传动轮的侧向安装撑", [-0.4, 1.2, 0], [0, 2.5, 0], 0.06)];
    for (const side of [-1, 1]) parts.push(box("飞行员座舱下方的轻质接地滑橇", [side * 0.45, 0.07, 0], [0.1, 0.14, 2.0], transportColors.dark), strut("中央车架与接地滑橇的支杆", [0, 0.65, -0.1], [side * 0.45, 0.14, 0], 0.045), strut("脚踏轮至上部传动分配轮的连续传动带边", [side * 0.15, 0.65, -0.1], [side * 0.15, 2.5, 0], 0.018, transportColors.trim), box("位于曲柄两侧的脚踏板", [side * 0.23, side > 0 ? 0.45 : 0.85, -0.1], [0.25, 0.055, 0.13], transportColors.dark));
    const corners: Triple[] = [[-12, 1.15, -12], [12, 1.15, -12], [12, 1.15, 12], [-12, 1.15, 12]];
    for (let index = 0; index < corners.length; index++) {
      const [x, y, z] = corners[index]!, next = corners[(index + 1) % corners.length]!;
      parts.push(strut("从中央架伸向旋翼角点的桁架上弦", [0, 2.3, 0], [x, y + 0.4, z], 0.09), strut("从中央架伸向旋翼角点的桁架下弦", [0, 1.6, 0], [x, y - 0.3, z], 0.08), strut("中央高桅至角点的长张弦支承索", [0, 4.5, 0], [x, y + 0.4, z], 0.025, transportColors.trim), strut("相邻旋翼角点之间的周向稳定索", [x, y + 0.4, z], [next[0], next[1] + 0.4, next[2]], 0.02, transportColors.trim), cylinder("巨型双叶旋翼穿过轻质桁架的固定支座", [x, 0.9, z], [0.18, 1.48, 0.18], transportColors.dark), airfoil("位于张弦桁架下方的低盘载连续双叶旋翼", 20, 0.9, [x, 0.53, z], [0, 110 + index * 50, 0]), box("角点承力轴下方的接地小脚垫", [x, 0.08, z], [0.75, 0.16, 0.75], transportColors.dark));
      for (const t of [0.25, 0.5, 0.75]) parts.push(strut("上弦和下弦之间的轻质桁架腹杆", [x * t, 2.3 * (1 - t) + (y + 0.4) * t, z * t], [x * Math.min(t + 0.2, 1), 1.6 * (1 - Math.min(t + 0.2, 1)) + (y - 0.3) * Math.min(t + 0.2, 1), z * Math.min(t + 0.2, 1)], 0.045));
      for (const offset of [-0.06, 0.06]) parts.push(strut("由中央传动轮通往角点旋翼轮的成对驱动绳带", [offset, 2.5, 0], [x + offset, 1.6, z], 0.012, transportColors.signal));
    }
    return parts;
  } },
  { name: "离心张紧长带式旋转太阳帆航天器", theme: "科幻", tags: ["旋转长带光帆", "卷筒放出帆叶", "离心张紧薄膜", "逐叶变距根部"], create: () => {
    const parts: ModelPart[] = [cylinder("载荷和姿态系统所在的轴向中央航天舱", [0, 3.15, 0], [3.6, 6.3, 3.6], transportColors.body), ring("中央航天舱外的光帆回转承力轴承", transportColors.dark, 2.1, 0.24, 6.45, 0.3), cylinder("连接各卷筒根部的中央旋转毂", [0, 6.7, 0], [3.8, 0.35, 3.8], transportColors.trim), strut("中央舱顶端的短通信天线", [0, 6.9, 0], [0, 9.5, 0], 0.08)];
    for (const side of [-1, 1]) parts.push(box("载荷舱侧面的固定供电翼", [side * 3.2, 3.3, 0], [2.4, 0.08, 3.8], "#496e82"), strut("载荷舱至固定供电翼的短支撑梁", [side * 1.6, 3.3, 0], [side * 3.2, 3.3, 0], 0.13));
    for (let index = 0; index < 6; index++) {
      const rotation = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), index * Math.PI / 3).multiply(new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), 7 * Math.PI / 180));
      const assembly = [strut("仅在根部连接回转毂的短变距支座", [1.7, 0, 0], [2.65, 0, 0], 0.2), cylinder("横跨薄膜宽度的帆叶放出卷筒", [2.65, 0, 0], [0.55, 4.45, 0.55], transportColors.body, [90, 0, 0]), surface("依靠旋转张紧而没有径向刚性桁梁的长薄膜帆叶", "#c4b99b", [[2.85, 0, -2.1], [73.7, 0, -1.85], [73.7, 0, 1.85], [2.85, 0, 2.1]], [0, 2, 1, 0, 3, 2]), box("长薄膜自由外端的张紧横向端条", [73.7, 0, 0], [0.12, 0.1, 3.7], transportColors.body)];
      for (const end of [-1, 1]) assembly.push(ring("卷筒两端的贯通定位轮缘", transportColors.dark, 0.4, 0.065, 0, 0.1, { position: { x: 2.65, y: 0, z: end * 2.25 }, rotation: { x: 90, y: 0, z: 0 } }));
      for (const value of assembly) {
        const p = new Vector3(value.position.x, value.position.y, value.position.z).applyQuaternion(rotation).add(new Vector3(0, 6.7, 0)), q = new Quaternion().setFromEuler(new Euler(value.rotation.x * Math.PI / 180, value.rotation.y * Math.PI / 180, value.rotation.z * Math.PI / 180)), e = new Euler().setFromQuaternion(rotation.clone().multiply(q));
        value.position = { x: p.x, y: p.y, z: p.z }; value.rotation = { x: e.x * 180 / Math.PI, y: e.y * 180 / Math.PI, z: e.z * 180 / Math.PI }; parts.push(value);
      }
    }
    return parts;
  } },
  { name: "翼内贯通升力风扇垂直起降喷气研究机", theme: "现代", tags: ["翼内升力风扇", "真实翼面贯通流道", "机鼻俯仰风扇", "喷气巡航研究机"], create: () => {
    const parts: ModelPart[] = [bodyLoft("从机鼻风扇之后延伸至尾部的连续飞行机身", [[-3.4, 0.4, 0.5, 0], [-2.0, 0.85, 0.85, 0], [2.2, 0.9, 0.8, 0], [4.8, 0.5, 0.5, 0.15], [5.8, 0.06, 0.08, 0.2]], 2.0), ball("机鼻风扇后方的双座透明飞行舱", [0, 2.75, -2.0], [1.35, 1.0, 2.1], transportColors.glass), airfoil("机身尾部的固定横向稳定翼", 3.8, 0.85, [0, 2.3, 4.6]), surface("尾部水平稳定翼上方的方向安定面", transportColors.signal, [[0, 0, -0.9], [0, 1.8, 0.35], [0, 0, 1.2]], [0, 1, 2], [0, 2.3, 4.45]), ...smallGear([[-1.05, 1.65, 1.7], [1.05, 1.65, 1.7]], [0, 1.2, -3.2], 0.25)];
    const noseOutline: [number, number][] = [[-0.25, -5.9], [0.25, -5.9], [0.7, -5.2], [0.8, -2.0], [-0.8, -2.0], [-0.7, -5.2]], circle = (x: number, z: number, radius: number): [number, number][] => Array.from({ length: 16 }, (_, index) => [x + Math.cos(index * Math.PI / 8) * radius, z + Math.sin(index * Math.PI / 8) * radius]);
    for (const y of [1.2, 2.14]) parts.push(polygon("机鼻俯仰风扇所在的真正开孔承力蒙皮", transportColors.body, noseOutline, 0.06, [0, y, 0], [circle(0, -4.6, 0.58)]));
    for (let index = 0; index < noseOutline.length; index++) {
      const a = noseOutline[index]!, b = noseOutline[(index + 1) % noseOutline.length]!;
      parts.push(surface("围合开孔机鼻外周而不封堵风扇通道的侧壁", transportColors.body, [[a[0], 1.2, a[1]], [b[0], 1.2, b[1]], [b[0], 2.2, b[1]], [a[0], 2.2, a[1]]], [0, 2, 1, 0, 3, 2]));
    }
    for (const side of [-1, 1]) {
      const outline: [number, number][] = [[side * 0.7, -1.5], [side * 4.3, 0.1], [side * 4.3, 2.5], [side * 0.7, 2.5]];
      parts.push(polygon("绕过升力风扇孔并向外翼传力的连续主翼", transportColors.trim, outline, 0.22, [0, 1.82, 0], [circle(side * 2.8, 1.05, 0.98)]), ...jetNacelle(side * 0.78, 2.55, 2.7, 0.38, 2.9), strut("机身至侧背巡航动力舱的固定连接梁", [side * 0.55, 2.3, 2.7], [side * 0.78, 2.55, 2.7], 0.14));
    }
    for (const [x, z, radius, depth] of [[-2.8, 1.05, 1.0, 0.34], [2.8, 1.05, 1.0, 0.34], [0, -4.6, 0.59, 0.96]]) {
      const y = x === 0 ? 1.7 : 1.93;
      parts.push(ring("嵌入承力蒙皮并保持上下贯通的升力风扇流道环", transportColors.dark, radius!, 0.07, y, depth!, { position: { x: x!, y, z: z! } }), cylinder("贯通流道内的风扇转轴毂", [x!, y, z!], [radius! * 0.2, depth! * 0.9, radius! * 0.2], transportColors.body));
      for (const angle of [0, 60, 120]) parts.push(box("流道内成对连接并有桨距的升力叶片", [x!, y, z!], [radius! * 1.72, 0.04, radius! * 0.12], transportColors.body, [8, angle, 0]));
    }
    return parts;
  } },
];
