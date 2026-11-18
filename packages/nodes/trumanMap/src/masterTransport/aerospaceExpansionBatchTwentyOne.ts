import { Euler, Quaternion, Vector3 } from "three";
import { part, ring, type ModelPart, type Triple } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { cylinderBetween } from "./aerospaceExpansionBatchFour";
import { bodyLoft } from "./aerospaceExpansionBatchFive";
import { airfoil } from "./aerospaceExpansionBatchOne";
import { box, cylinder, strut, transportColors, type TransportDefinition } from "./parts";

// 独立完整构件，不含宿主火箭、卫星或直升机；不按接口/叶片数量再扩同类主项。
// https://www.nasa.gov/smallsat-institute/sst-soa/integration-launch-and-deployment/
// https://www.northropgrumman.com/what-we-do/space/mission-enabling-products/structures
// https://doi.org/10.1016/j.eng.2026.02.030
// https://www.airbus.com/en/newsroom/stories/2022-07-safety-innovation-2-the-fenestron
export const aerospaceExpansionBatchTwentyOne: TransportDefinition[] = [
  { name: "中心筒侧挂多星载荷分配器完整总成", theme: "现代", itemType: "构件", tags: ["航天载荷分配器", "上下贯通中心筒", "侧挂承载接口", "完整运载器构件"], create: () => {
    const parts: ModelPart[] = [ring("不作为居住舱而上下贯通的承载中心筒", transportColors.body, 1.2, 0.1, 1.2, 2.4), ring("中心筒下部与运载器连接的连续承载凸缘", transportColors.dark, 1.3, 0.2, 0.09, 0.18), ring("中心筒上部继续传递轴向主载荷的连续承载凸缘", transportColors.dark, 1.3, 0.2, 2.31, 0.18)];
    for (let index = 0; index < 6; index++) {
      const a = index * Math.PI / 3, radial = new Vector3(Math.cos(a), 0, Math.sin(a)), tangent = new Vector3(-Math.sin(a), 0, Math.cos(a)), e = new Euler().setFromQuaternion(new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), radial));
      parts.push(ring("中心筒外周独立的环形侧挂载荷连接座", transportColors.trim, 0.31, 0.09, 0, 0.18, { position: { x: radial.x * 1.23, y: 1.2, z: radial.z * 1.23 }, rotation: { x: e.x * 180 / Math.PI, y: e.y * 180 / Math.PI, z: e.z * 180 / Math.PI } }));
      for (const end of [-1, 1]) parts.push(strut("侧挂连接座上下缘与中心筒之间的短加强撑", [radial.x * 1.12, 1.2 + end * 0.4, radial.z * 1.12], [radial.x * 1.23, 1.2 + end * 0.25, radial.z * 1.23], 0.08));
      for (let bolt = 0; bolt < 8; bolt++) {
        const b = bolt * Math.PI / 4, p = radial.clone().multiplyScalar(1.33).addScaledVector(tangent, Math.cos(b) * 0.265); p.y = 1.2 + Math.sin(b) * 0.265;
        parts.push(cylinder("侧挂连接座真实环形承载面上的独立紧固头", p.toArray() as Triple, [0.035, 0.04, 0.035], transportColors.dark, [e.x * 180 / Math.PI, e.y * 180 / Math.PI, e.z * 180 / Math.PI]));
      }
    }
    return parts;
  } },
  { name: "贮存根座可展三棱桁架航天伸杆总成", theme: "科幻", itemType: "构件", tags: ["可展航天伸杆", "连续三棱桁架", "根部贮存与导向机构", "独立大型构件"], create: () => {
    const nodes: Triple[] = Array.from({ length: 3 }, (_, index) => [Math.cos(index * Math.PI * 2 / 3) * 0.9, 0, Math.sin(index * Math.PI * 2 / 3) * 0.9]), parts: ModelPart[] = [ring("围绕桁架根部而不封住展开通道的贮存筒壳", transportColors.body, 1.2, 0.12, 0.8, 1.4), cylinder("根部贮存筒下方的封闭航天器安装底板", [0, 0.1, 0], [2.4, 0.2, 2.4], transportColors.dark), ring("贮存筒口沿周向加固的真实开孔导向框", transportColors.trim, 1.35, 0.24, 1.5, 0.15), box("与贮存筒壳直接相接的封闭展开控制单元", [1.45, 0.7, 0], [0.6, 0.5, 0.7], transportColors.dark), polygon("将三条主弦与外部载荷接口连为整体的三角端板", transportColors.body, nodes.map(([x, , z]) => [x * 1.1, z * 1.1]), 0.2, [0, 17.5, 0])];
    for (let index = 0; index < nodes.length; index++) {
      const a = nodes[index]!, b = nodes[(index + 1) % nodes.length]!, angle = index * Math.PI * 2 / 3;
      parts.push(cylinderBetween("从贮存筒内连续伸到端板的三棱桁架主弦", [a[0], 1.5, a[2]], [a[0], 17.5, a[2]], 0.07, transportColors.body));
      for (let level = 0; level <= 8; level++) parts.push(strut("三棱桁架每个展开节间的水平三角承力环边", [a[0], 1.5 + level * 2, a[2]], [b[0], 1.5 + level * 2, b[2]], 0.045));
      for (let level = 0; level < 8; level++) parts.push(strut("相邻主弦之间逐节连接的斜向抗剪腹杆", [a[0], 1.5 + level * 2, a[2]], [b[0], 3.5 + level * 2, b[2]], 0.035));
      const rotation = new Euler().setFromQuaternion(new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), new Vector3(-Math.sin(angle), 0, Math.cos(angle))));
      parts.push(cylinder("在筒口与对应主弦相接的实际导向压轮", [Math.cos(angle) * 1.08, 1.7, Math.sin(angle) * 1.08], [0.3, 0.14, 0.3], transportColors.dark, [rotation.x * 180 / Math.PI, rotation.y * 180 / Math.PI, rotation.z * 180 / Math.PI]), strut("导向压轮轮轴与贮存筒口框之间的短安装架", [Math.cos(angle) * 1.08, 1.7, Math.sin(angle) * 1.08], [Math.cos(angle) * 1.25, 1.5, Math.sin(angle) * 1.25], 0.07));
    }
    return parts;
  } },
  { name: "贯通栅格空气舵与折展铰座完整总成", theme: "现代", itemType: "构件", tags: ["栅格空气舵", "真正透空格室", "折展承载铰轴", "独立飞行控制构件"], create: () => {
    const holes: [number, number][][] = [];
    for (let col = 0; col < 8; col++) for (let row = 0; row < 5; row++) {
      const x = (col - 3.5) * 0.4, z = (row - 2) * 0.4;
      holes.push([[x - 0.17, z - 0.17], [x + 0.17, z - 0.17], [x + 0.17, z + 0.17], [x - 0.17, z + 0.17]]);
    }
    return [polygon("外框与40个完整贯通格室合为一体的厚格栅舵体", transportColors.body, [[-1.8, -1.2], [1.8, -1.2], [1.8, 1.2], [-1.8, 1.2]], 0.3, [0, 0.8, 0], holes), cylinder("沿空气舵根部全长连接的折展承载铰轴", [-1.85, 0.95, 0], [0.2, 2.8, 0.2], transportColors.dark, [90, 0, 0]), box("空气舵总成与运载器固定结构相连的安装法兰", [-2.5, 0.65, 0], [0.3, 1.3, 2.8], transportColors.body), ...[-1, 1].map(side => box("在铰轴两端将安装法兰接到舵根的承载侧耳", [-2.15, 0.85, side * 1.15], [1.0, 0.8, 0.2], transportColors.body)), box("位于舵体外边缘并实际搭接外框的控制杆耳座", [-1.4, 0.95, -1.3], [0.3, 0.3, 0.3], transportColors.dark), cylinderBetween("从安装法兰伸向舵体侧方的控制执行外套", [-2.5, 0.5, -1.3], [-1.95, 0.55, -1.3], 0.15, transportColors.body), cylinderBetween("从执行外套接到外缘耳座且不穿过栅格的细控制杆", [-1.95, 0.55, -1.3], [-1.4, 1.05, -1.3], 0.08, transportColors.dark)];
  } },
  { name: "涵道反扭尾桨尾梁安定面整体总成", theme: "现代", itemType: "构件", tags: ["独立直升机尾部总成", "涵道反扭尾桨", "真实安定面贯通孔", "尾梁与传动承座"], create: () => {
    const outline: [number, number][] = [[-0.5, 0.9], [-0.1, 3.9], [1.1, 4.2], [3.0, 3.0], [3.0, 0.3], [1.2, 0.3]], opening: [number, number][] = Array.from({ length: 24 }, (_, index) => [1.6 + Math.cos(index * Math.PI / 12) * 0.72, 1.8 + Math.sin(index * Math.PI / 12) * 0.72]);
    const fin = polygon("垂直安定面内完整保留尾桨涵道的真实通孔", transportColors.body, outline, 0.25, [-0.125, 0, 0], [opening]); fin.rotation = { x: -90, y: 0, z: -90 };
    const parts: ModelPart[] = [bodyLoft("从机体接口连续收分到安定面前缘的封闭尾梁", [[-3, 0.55, 0.55, 0], [-2.5, 0.5, 0.5, 0], [0, 0.3, 0.3, 0.2], [0.85, 0.16, 0.16, 0.35]], 1.0), fin, ring("尾桨通孔内实际接入安定面壁面的承力涵道环", transportColors.dark, 0.75, 0.09, 0, 0.3, { position: { x: 0, y: 1.8, z: 1.6 }, rotation: { x: 0, y: 0, z: 90 } }), cylinder("涵道尾桨中央的完整承载轴毂", [0, 1.8, 1.6], [0.2, 0.3, 0.2], transportColors.body, [0, 0, 90]), cylinder("位于安定面一侧并接到中央轴毂的传动承座", [-0.32, 1.8, 1.6], [0.32, 0.6, 0.32], transportColors.body, [0, 0, 90]), ring("尾梁前端可连接机体根部的贯通承载凸缘", transportColors.dark, 0.64, 0.1, 0, 0.15, { position: { x: 0, y: 1.0, z: -3.04 }, rotation: { x: 90, y: 0, z: 0 } }), airfoil("在尾梁与安定面根部贯穿连接的横向稳定翼", 2.7, 0.65, [0, 1.2, -0.4])];
    for (const angle of [0, 32, 68, 108, 145, 181, 214, 250, 288, 325]) {
      const a = angle * Math.PI / 180;
      parts.push(box("在涵道内不等距排列且与环壁保持间隙的尾桨叶片", [0, 1.8 + Math.cos(a) * 0.34, 1.6 + Math.sin(a) * 0.34], [0.04, 0.56, 0.08], transportColors.trim, [angle, 0, 0]));
    }
    for (let index = 0; index < 3; index++) {
      const a = index * Math.PI * 2 / 3;
      parts.push(strut("与旋转桨叶前后错层的固定轴承径向支架", [-0.12, 1.8, 1.6], [-0.12, 1.8 + Math.cos(a) * 0.68, 1.6 + Math.sin(a) * 0.68], 0.04));
    }
    return parts;
  } },
];
