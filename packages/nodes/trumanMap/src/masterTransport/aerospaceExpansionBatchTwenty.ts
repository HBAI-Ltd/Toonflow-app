import { Quaternion, Vector3 } from "three";
import { part, ring, type ModelPart, type Triple } from "../assetModelParts";
import { halfRoundWall, rectangularFlue } from "../masterArchitecture/spatialShells";
import { polygon, tapered } from "../masterNature/shared";
import { propeller } from "./aircraftModels";
import { cylinderBetween } from "./aerospaceExpansionBatchFour";
import { bodyLoft, jetNacelle, sweptWing } from "./aerospaceExpansionBatchFive";
import { airfoil, smallGear } from "./aerospaceExpansionBatchOne";
import { ball, box, cylinder, strut, surface, transportColors, type TransportDefinition } from "./parts";

// 原创完整构造而非品牌复刻；透明聚合物罩的刚性飞艇不依靠罩内气压承担骨架载荷。
// https://airandspace.si.edu/multimedia-gallery/image/2000-1382wk-sjpg
// https://ntrs.nasa.gov/citations/20010038495
// https://ntrs.nasa.gov/citations/20020042193
export const aerospaceExpansionBatchTwenty: TransportDefinition[] = [
  { name: "刚性环框分立气室透明罩运输飞艇", theme: "科幻", tags: ["刚性骨架飞艇", "独立密封气室", "纵梁与环框承力", "透明非承压外罩"], create: () => {
    const sections: [number, number, number, number][] = [[-30, 0.1, 0.1, 0], [-25, 3, 3, 0], [-18, 5.8, 5.8, 0], [0, 6, 6, 0], [18, 5.8, 5.8, 0], [25, 3, 3, 0], [30, 0.1, 0.1, 0]], cover = bodyLoft("完整围合刚性骨架但不作为单一压囊的透明气动外罩", sections, 12, transportColors.glass); cover.opacity = 0.22;
    const parts: ModelPart[] = [cover, bodyLoft("由腹部刚性龙骨吊挂的连续封闭操纵与运输舱", [[-11, 0.1, 0.1, 0], [-8, 1.6, 1.2, 0], [7, 1.6, 1.2, 0], [11, 0.1, 0.2, 0]], 3.0), ball("腹部封闭运输舱前端的透明驾驶风挡", [0, 3.4, -9.6], [1.5, 0.7, 1.2], transportColors.glass)];
    for (const [z, radius] of [[-20, 3.8], [-10, 5.3], [0, 5.4], [10, 5.3], [20, 3.8]]) parts.push(part("位于刚性骨架内且与相邻气室独立封闭的浮力气室", "lathe", transportColors.trim, [0, 12, z!], [1, 1, 1], [90, 0, 0], { profile: [{ x: 0, y: -4.5 }, { x: radius! * 0.55, y: -3.8 }, { x: radius!, y: -2.0 }, { x: radius!, y: 2.0 }, { x: radius! * 0.55, y: 3.8 }, { x: 0, y: 4.5 }] }));
    for (let index = 0; index < 8; index++) {
      const a = index * Math.PI / 4, path: Triple[] = sections.map(([z, radius]) => [Math.cos(a) * (radius + 0.04), 12 + Math.sin(a) * (radius + 0.04), z]);
      parts.push(tapered("沿飞艇全长连接不同截面环框的连续刚性纵梁", "#b9ad89", path, path.map(() => 0.07)));
    }
    for (const [z, radius] of [[-25, 3], [-18, 5.8], [-6, 5.93], [6, 5.93], [18, 5.8], [25, 3]]) parts.push(ring("由纵梁连接并包围各独立气室的刚性周向环框", "#b9ad89", radius! + 0.12, 0.14, 0, 0.14, { position: { x: 0, y: 12, z: z! }, rotation: { x: 90, y: 0, z: 0 } }));
    for (const side of [-1, 1]) {
      parts.push(strut("承担吊舱载荷而不依靠透明罩受压的腹部龙骨纵弦", [side * 0.8, 5.3, -18], [side * 0.8, 5.3, 18], 0.2), box("腹部运输舱下方的长着陆滑橇", [side * 1.4, 0.1, 0], [0.16, 0.2, 8.0], transportColors.dark));
      for (const z of [-14, 14]) parts.push(strut("从最低刚性纵梁直接接到腹部龙骨的短斜向挂架", [0, 6.1, z], [side * 0.8, 5.3, z], 0.13));
      for (const z of [-8, 0, 8]) parts.push(strut("由腹部龙骨接到封闭运输舱顶部的独立吊挂杆", [side * 0.7, 5.3, z], [side * 0.7, z === 8 ? 3.65 : 4.0, z], 0.12));
      for (const z of [-3, 3]) parts.push(strut("封闭运输舱底部与滑橇实际相连的长落腿", [side * 1.1, 2.22, z], [side * 1.4, 0.2, z], 0.12));
      for (const z of [-8, 8]) parts.push(strut("腹部龙骨向外支承独立推进短舱的固定侧梁", [side * 0.8, 5.3, z], [side * 4, 6.0, z], 0.2), cylinder("与刚性龙骨相连的外置推进电机舱", [side * 4, 6.0, z], [0.6, 1.3, 0.6], transportColors.body, [90, 0, 0]), ...propeller(side * 4, 6.0, z - 0.8, 1.0));
    }
    for (const z of [-15, -5, 5, 15]) parts.push(strut("将腹部两条龙骨纵弦连为整体的承力横档", [-0.8, 5.3, z], [0.8, 5.3, z], 0.15));
    for (let index = 0; index < 4; index++) {
      const a = index * Math.PI / 2, x = Math.cos(a), y = Math.sin(a);
      parts.push(surface("从尾部刚性框架伸出的十字方向稳定鳍", transportColors.signal, [[x * 0.5, y * 0.5, 20], [x * 8, y * 8, 27], [x * 6.5, y * 6.5, 29], [x * 0.5, y * 0.5, 28]], [0, 1, 2, 0, 2, 3], [0, 12, 0]));
    }
    return parts;
  } },
  { name: "四支点承力涵道倾转垂直起降研究机", theme: "科幻", tags: ["倾转涵道飞行器", "完整环壳导流承力", "固定短翼与回转耳轴", "独立四支点升力控制"], create: () => {
    const parts: ModelPart[] = [bodyLoft("通过前后短承力翼连接倾转涵道的连续载人机身", [[-6, 0.1, 0.12, 0], [-4, 1.2, 1.1, 0], [-2, 1.6, 1.4, 0], [4, 1.3, 1.1, 0], [6, 0.1, 0.1, 0.2]], 2.8), ball("前端高于机身下部的宽视野透明驾驶舱", [0, 3.5, -3.8], [2.4, 1.3, 2.0], transportColors.glass), airfoil("后机身延伸到倾转气流之外的横向稳定平尾", 5.0, 1.2, [0, 4.0, 5.3]), surface("与后机身相接的高位方向尾鳍", transportColors.signal, [[0, 0, -1.0], [0, 2.3, 0.3], [0, 0, 1.3]], [0, 1, 2], [0, 3.5, 4.9]), ...smallGear([[-1.4, 2.4, 1.2], [1.4, 2.4, 1.2]], [0, 2.2, -3.8], 0.4)];
    const rotation = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), 35 * Math.PI / 180);
    for (const side of [-1, 1]) for (const z of [-2.8, 3.2]) {
      const x = side * 3.6, wing = sweptWing("从机身直接接到涵道内侧回转耳轴的短承力翼", [side * 1.2, 3.0, z], [side * 2.15, 3.5, z], 1.8, 1.3);
      wing.vertices = wing.indices!.map(index => ({ ...wing.vertices![index]! })); delete wing.indices;
      parts.push(wing, cylinder("短承力翼外端贯穿涵道环壳耳座的横向回转轴", [side * 2.1, 3.5, z], [0.22, 0.4, 0.22], transportColors.dark, [0, 0, 90]), part("独立环绕桨盘且上下贯通的厚翼型倾转涵道环壳", "lathe", transportColors.body, [x, 3.5, z], [1, 1, 1], [35, 0, 0], { profile: [{ x: 1.15, y: -0.5 }, { x: 1.4, y: -0.55 }, { x: 1.5, y: -0.15 }, { x: 1.4, y: 0.55 }, { x: 1.18, y: 0.5 }, { x: 1.15, y: -0.5 }] }), cylinder("随涵道环壳一起倾转的中央电机轴毂", [x, 3.5, z], [0.3, 0.55, 0.3], transportColors.dark, [35, 0, 0]));
      for (const angle of [0, 60, 120]) parts.push(box("保持在涵道内且与承力支架错层的双端桨叶", [x, 3.5, z], [2.15, 0.05, 0.18], transportColors.trim, [35, angle, 0]));
      for (let index = 0; index < 3; index++) {
        const a = index * Math.PI * 2 / 3, start = new Vector3(Math.cos(a) * 0.15, -0.2, Math.sin(a) * 0.15).applyQuaternion(rotation).add(new Vector3(x, 3.5, z)), end = new Vector3(Math.cos(a) * 1.2, -0.2, Math.sin(a) * 1.2).applyQuaternion(rotation).add(new Vector3(x, 3.5, z));
        parts.push(strut("从中央电机承座接到涵道内壁的真实径向支架", start.toArray() as Triple, end.toArray() as Triple, 0.06));
      }
    }
    return parts;
  } },
  { name: "机身贯通引射腔增升垂直起降研究机", theme: "现代", tags: ["喷流引射增升", "真实机身贯通长腔", "无机械升力风扇", "完整短翼尾翼飞行器"], create: () => {
    const outline: [number, number][] = [[-0.12, -6], [0.12, -6], [1.2, -4.5], [1.25, 4], [0.5, 6], [-0.5, 6], [-1.25, 4], [-1.2, -4.5]], opening: [number, number][] = [[-0.6, -1.5], [0.6, -1.5], [0.6, 3.8], [-0.6, 3.8]];
    const parts: ModelPart[] = [polygon("机身顶部围绕纵向引射长腔的真实开孔承力蒙皮", transportColors.body, outline, 0.08, [0, 2.7, 0], [opening]), polygon("机身底部保持引射长腔上下贯通的开孔承力蒙皮", transportColors.body, outline, 0.08, [0, 1.6, 0], [opening]), rectangularFlue("贯穿机身并连接上下蒙皮的真实四壁引射长腔", 1.36, 5.46, 1.15, 0.08, [0, 1.6, 1.15], transportColors.dark), ball("位于引射长腔之前的封闭透明飞行座舱", [0, 3.1, -3.7], [1.7, 0.8, 1.8], transportColors.glass), airfoil("长引射腔之后的横向固定稳定平尾", 4.0, 1.2, [0, 3.2, 5.5]), surface("与尾部承力身段相接的垂直方向稳定面", transportColors.signal, [[0, 0, -1.0], [0, 2.5, 0.3], [0, 0, 1.2]], [0, 1, 2], [0, 2.7, 5.1]), ...smallGear([[-1.2, 1.7, 2.2], [1.2, 1.7, 2.2]], [0, 1.7, -4.0], 0.3)];
    for (let index = 0; index < outline.length; index++) {
      const a = outline[index]!, b = outline[(index + 1) % outline.length]!;
      parts.push(surface("包围座舱和引射长腔外侧而不堵塞腔内的机身侧壁", transportColors.body, [[a[0], 1.6, a[1]], [b[0], 1.6, b[1]], [b[0], 2.78, b[1]], [a[0], 2.78, a[1]]], [0, 1, 2, 0, 2, 3]));
    }
    for (const side of [-1, 1]) {
      const manifold = halfRoundWall("沿引射长腔上口布置且内侧有真实纵向喷缝的供流条", 0.14, 0.025, 5.1, [side * 0.63, 2.65, -1.4], side > 0 ? 162 : 342, transportColors.trim, Math.PI * 1.8); manifold.rotation.x = 90;
      parts.push(manifold, sweptWing("由引射长腔两侧实体承力带接出的固定短主翼", [side * 1.1, 2.35, 0.5], [side * 7.0, 2.6, 2.0], 2.2, 0.8), ...jetNacelle(side * 1.6, 2.4, 2.0, 0.38, 3.1), cylinderBetween("由侧置巡航动力舱接到长腔上缘供流条的外观输流管", [side * 1.6, 2.4, 1.2], [side * 0.63, 2.65, 1.2], 0.12, transportColors.dark), strut("侧置动力舱在主翼根部的固定安装梁", [side * 1.2, 2.35, 2.0], [side * 1.6, 2.4, 2.0], 0.18));
    }
    return parts;
  } },
];
