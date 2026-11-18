import { Euler, Quaternion, Vector3 } from "three";
import { part, ring, type ModelPart, type Triple } from "../assetModelParts";
import { cylinderBetween } from "./aerospaceExpansionBatchFour";
import { box, cylinder, strut, transportColors, type TransportDefinition } from "./parts";

// 独立的航天作业/气闸与航空进气构件，均为静态外观，不实现机械控制或压力流程。
// https://www.asc-csa.gc.ca/eng/iss/canadarm2/about.asp
// https://www.nasa.gov/international-space-station/quest-airlock/
// https://www.nasa.gov/history/10-by-10-wind-tunnel-performed-critical-analysis-for-the-first-supersonic-bomber-2/
export const aerospaceExpansionBatchTwentyFour: TransportDefinition[] = [
  { name: "双端锁握行走式空间作业机械臂总成", theme: "现代", itemType: "构件", tags: ["独立空间机械臂", "七关节与对称长臂", "双端相同锁握手", "非固定基座换端作业"], create: () => {
    const points: Triple[] = [[-7, 0.8, 0], [-7, 1.6, 0], [-6, 2.2, 0], [-1, 6.0, 0.3], [4, 2.4, 0.5], [5, 2.0, 0.1], [6, 2.0, 0]], axes: Triple[] = [[1, 0, 0], [0, 0, 1], [0, 1, 0], [0, 0, 1], [0, 1, 0], [1, 0, 0], [0, 0, 1]], parts: ModelPart[] = [];
    for (let index = 0; index < points.length; index++) {
      const position = points[index]!, axis = new Vector3(...axes[index]!), e = new Euler().setFromQuaternion(new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), axis)), rotation: Triple = [e.x * 180 / Math.PI, e.y * 180 / Math.PI, e.z * 180 / Math.PI], rim = new Vector3(...position).addScaledVector(axis, 0.28);
      parts.push(cylinder("可换端行走臂上按不同轴向分布的封闭回转关节", position, [0.7, 0.55, 0.7], transportColors.body, rotation), ring("回转关节端面实际接入壳体的承载密封边圈", transportColors.dark, 0.38, 0.06, 0, 0.08, { position: { x: rim.x, y: rim.y, z: rim.z }, rotation: { x: rotation[0], y: rotation[1], z: rotation[2] } }));
      if (index < points.length - 1) parts.push(cylinderBetween("从相邻回转关节之间连续传力的空间臂杆", position, points[index + 1]!, index === 2 || index === 3 ? 0.38 : 0.28, transportColors.trim));
    }
    for (const [index, neighbor] of [[0, 1], [6, 5]]) {
      const center = new Vector3(...points[index!]!), direction = center.clone().sub(new Vector3(...points[neighbor!]!)).normalize(), q = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), direction), e = new Euler().setFromQuaternion(q), rotation: Triple = [e.x * 180 / Math.PI, e.y * 180 / Math.PI, e.z * 180 / Math.PI], body = center.clone().addScaledVector(direction, 0.45), mouth = center.clone().addScaledVector(direction, 0.77), rear = center.clone().addScaledVector(direction, 0.12);
      parts.push(ring("两个臂端都可作为固定基座或作业端的相同空心锁握手", transportColors.body, 0.46, 0.12, 0, 0.6, { position: { x: body.x, y: body.y, z: body.z }, rotation: { x: rotation[0], y: rotation[1], z: rotation[2] } }), cylinder("将锁握手后部与末端回转关节实际连成整体的承接底盘", rear.toArray() as Triple, [0.9, 0.16, 0.9], transportColors.dark, rotation), ring("锁握手开口前缘连续围合的承载口圈", transportColors.dark, 0.48, 0.14, 0, 0.1, { position: { x: mouth.x, y: mouth.y, z: mouth.z }, rotation: { x: rotation[0], y: rotation[1], z: rotation[2] } }));
      for (let wire = 0; wire < 3; wire++) {
        const a = wire * Math.PI * 2 / 3, b = (wire + 1) * Math.PI * 2 / 3, start = new Vector3(Math.cos(a) * 0.35, 0, Math.sin(a) * 0.35).applyQuaternion(q).add(mouth), end = new Vector3(Math.cos(b) * 0.35, 0, Math.sin(b) * 0.35).applyQuaternion(q).add(mouth);
        parts.push(strut("锁握手真实开口内用于夹持目标销的三角锁握细索", start.toArray() as Triple, end.toArray() as Triple, 0.018));
      }
    }
    return parts;
  } },
  { name: "设备舱与出舱室串接刚性航天气闸总成", theme: "现代", itemType: "构件", tags: ["独立航天气闸", "真实中空双舱", "内隔离门与外开舱门", "完整舱外活动接口"], create: () => {
    const centerY = 1.7, parts: ModelPart[] = [part("大设备舱渐缩接小出舱室的连续双壁压力壳", "lathe", transportColors.body, [0, centerY, 0], [1, 1, 1], [90, 0, 0], { profile: [{ x: 1.45, y: -3.0 }, { x: 1.6, y: -3.0 }, { x: 1.6, y: -0.1 }, { x: 1.1, y: 0.6 }, { x: 1.1, y: 3.0 }, { x: 0.98, y: 3.0 }, { x: 0.98, y: 0.6 }, { x: 1.45, y: -0.1 }, { x: 1.45, y: -3.0 }] }), ring("设备舱后端与空间站连接的真实开孔承载圈", transportColors.dark, 1.7, 0.25, 0, 0.2, { position: { x: 0, y: centerY, z: -3.0 }, rotation: { x: 90, y: 0, z: 0 } }), ring("设备舱与出舱室之间保留门洞的内部隔离框", transportColors.trim, 1.47, 0.82, 0, 0.12, { position: { x: 0, y: centerY, z: -0.1 }, rotation: { x: 90, y: 0, z: 0 } }), cylinder("在外舱门打开时保持关闭的舱间隔离门", [0, centerY, -0.08], [1.3, 0.08, 1.3], transportColors.body, [90, 0, 0]), ring("小出舱室前缘与打开舱门相配的完整密封接口", transportColors.dark, 1.2, 0.22, 0, 0.2, { position: { x: 0, y: centerY, z: 3.0 }, rotation: { x: 90, y: 0, z: 0 } }), cylinder("在出舱室一侧向外打开的完整金属圆舱门", [1.15, centerY, 4.15], [1.96, 0.12, 1.96], transportColors.body, [0, 0, -90]), cylinder("外舱门侧方真实支承门扇的长竖向铰轴", [1.15, centerY, 3.0], [0.12, 1.5, 0.12], transportColors.dark), box("宽设备舱内外缘嵌接压力内壁的连续防滑地台", [0, 0.72, -1.55], [2.2, 0.1, 2.5], transportColors.dark), box("窄出舱室内外缘嵌接舱壁的连续防滑地台", [0, 1.0, 1.7], [1.4, 0.08, 2.1], transportColors.dark)];
    for (const side of [-1, 1]) {
      parts.push(strut("密封框实体边缘至外舱门铰轴的固定承载耳", [0.95, centerY + side * 0.55, 3.0], [1.15, centerY + side * 0.55, 3.0], 0.08), strut("外开舱门铰轴至门扇圆边的实际长铰接臂", [1.15, centerY + side * 0.65, 3.0], [1.15, centerY + side * 0.65, 3.45], 0.12), part("安装在设备舱外侧的独立封闭气体贮箱", "lathe", transportColors.trim, [side * 1.8, centerY, -1.2], [1, 1, 1], [90, 0, 0], { profile: [{ x: 0, y: -0.9 }, { x: 0.25, y: -0.65 }, { x: 0.25, y: 0.65 }, { x: 0, y: 0.9 }] }), strut("出舱室外壁上方与安装短托相连的长握持扶手", [side * 1.22, centerY, 0.8], [side * 1.22, centerY, 2.4], 0.045));
      for (const z of [-1.9, -0.5]) parts.push(strut("设备舱压力壳与外置贮箱之间的实际固定承座", [side * 1.55, centerY, z], [side * 1.8, centerY, z], 0.09));
      for (const z of [0.8, 2.4]) parts.push(strut("从出舱室压力外壁接到扶手的短安装托", [side * 1.08, centerY, z], [side * 1.22, centerY, z], 0.05));
    }
    return parts;
  } },
  { name: "可调中心锥轴对称航空进气道总成", theme: "现代", itemType: "构件", tags: ["独立轴对称进气道", "前伸中心扩压锥", "环形真实流道", "后端导向与发动机接口"], create: () => {
    const centerY = 1.38, parts: ModelPart[] = [part("与前伸中心锥共同围成环形通路的中空外罩", "lathe", transportColors.body, [0, centerY, 0], [1, 1, 1], [90, 0, 0], { profile: [{ x: 1.2, y: -1.6 }, { x: 1.33, y: -1.6 }, { x: 1.3, y: -1.0 }, { x: 1.15, y: 2.0 }, { x: 1.03, y: 2.0 }, { x: 1.18, y: -1.0 }, { x: 1.2, y: -1.6 }] }), part("从入口前方渐扩到罩内再回收的完整中心扩压锥", "lathe", transportColors.dark, [0, centerY, 0], [1, 1, 1], [90, 0, 0], { profile: [{ x: 0, y: -3.5 }, { x: 0.35, y: -2.4 }, { x: 0.7, y: -1.2 }, { x: 0.8, y: 0 }, { x: 0.45, y: 1.0 }, { x: 0, y: 1.0 }] }), cylinder("与中心扩压锥后部实际相接的轴向伸缩承力杆", [0, centerY, 1.5], [0.4, 1.8, 0.4], transportColors.trim, [90, 0, 0]), part("位于伸缩承力杆外而保留杆间间隙的后导向套筒", "lathe", transportColors.body, [0, centerY, 0], [1, 1, 1], [90, 0, 0], { profile: [{ x: 0.21, y: 1.6 }, { x: 0.3, y: 1.6 }, { x: 0.3, y: 2.4 }, { x: 0.21, y: 2.4 }, { x: 0.21, y: 1.6 }] }), ring("入口唇缘与中空外罩连续相接的承力边圈", transportColors.dark, 1.38, 0.18, 0, 0.08, { position: { x: 0, y: centerY, z: -1.6 }, rotation: { x: 90, y: 0, z: 0 } }), ring("进气道后端与下游发动机相配的真实空心接口", transportColors.body, 1.22, 0.19, 0, 0.18, { position: { x: 0, y: centerY, z: 2.0 }, rotation: { x: 90, y: 0, z: 0 } })];
    for (const z of [1.65, 2.35]) parts.push(ring("将伸缩杆实际导入后导向套筒的承载套圈", transportColors.dark, 0.31, 0.12, 0, 0.1, { position: { x: 0, y: centerY, z }, rotation: { x: 90, y: 0, z: 0 } }));
    for (let index = 0; index < 3; index++) {
      const a = index * Math.PI * 2 / 3, x = Math.cos(a), y = Math.sin(a);
      parts.push(strut("从后导向套筒实体接到中空外罩内壁的独立径向支座", [x * 0.27, centerY + y * 0.27, 1.7], [x * 1.08, centerY + y * 1.08, 1.7], 0.07));
    }
    return parts;
  } },
];
