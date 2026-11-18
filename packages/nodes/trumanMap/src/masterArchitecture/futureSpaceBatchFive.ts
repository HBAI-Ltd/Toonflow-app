import { part, ring, type ModelPart, type Triple } from "../assetModelParts";
import { barrelRoof, halfDomeRoof, rectangularFlue } from "./spatialShells";
import { base, box, colors, cylinder, design, pipe, rail, type ArchitecturePrototype } from "./structures";
import { triangleShell } from "./futureSpaceBatchOne";
import { stairFlight } from "./futureSpaceBatchSix";
import { combineMeshes } from "../masterNature/shared";
import { Euler, Quaternion, Vector3 } from "three";

const steel = "#72888d", pale = "#a9b1aa", dark = "#42545d", stone = "#a3957e";

function entrance(name: string, width: number, height: number, position: Triple, depth = 0.3): ModelPart[] {
  const [x, y, z] = position;
  return [box(`${name}两侧门框`, x - width / 2 - 0.18, y + height / 2, z, 0.36, height, depth, dark), box(`${name}两侧门框`, x + width / 2 + 0.18, y + height / 2, z, 0.36, height, depth, dark), box(`${name}顶部门楣`, x, y + height + 0.18, z, width + 0.72, 0.36, depth, dark)];
}

function heatFlowChamber(): ModelPart {
  const vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [], rows = [-8, -0.9, 0.9, 8], segments = 24;
  const point = (x: number, radius: number, angle: number): Triple => [x, Math.sin(angle) * radius, Math.cos(angle) * radius];
  const face = (a: Triple, b: Triple, c: Triple, d: Triple) => { const i = vertices.length; vertices.push(...[a, b, c, d].map(([x, y, z]) => ({ x, y, z }))); indices.push(i, i + 1, i + 2, i, i + 2, i + 3); };
  for (const [radius, inside] of [[4.2, false], [3.9, true]] as const) {
    const start = vertices.length;
    for (const x of rows) for (let angle = 0; angle <= segments; angle++) { const p = point(x, radius, angle * Math.PI / 12); vertices.push({ x: p[0], y: p[1], z: p[2] }); }
    for (let row = 0; row < rows.length - 1; row++) for (let angle = 0; angle < segments; angle++) {
      if (row === 1 && (angle === 11 || angle === 12)) continue;
      const a = start + row * 25 + angle, b = a + 25, c = a + 1, d = b + 1;
      indices.push(...(inside ? [a, d, b, a, c, d] : [a, b, d, a, d, c]));
    }
  }
  for (const x of [-8, 8]) for (let i = 0; i < segments; i++) {
    const a = i * Math.PI / 12, b = (i + 1) * Math.PI / 12;
    if (x < 0) face(point(x, 4.2, a), point(x, 4.2, b), point(x, 3.9, b), point(x, 3.9, a));
    else face(point(x, 4.2, a), point(x, 3.9, a), point(x, 3.9, b), point(x, 4.2, b));
  }
  // 检修口的四边同样闭合壁厚；贯穿前侧的缺口保持实际开通，不以透明面模拟。
  for (const x of [-0.9, 0.9]) for (const i of [11, 12]) {
    const a = i * Math.PI / 12, b = (i + 1) * Math.PI / 12;
    if (x < 0) face(point(x, 4.2, a), point(x, 3.9, a), point(x, 3.9, b), point(x, 4.2, b));
    else face(point(x, 4.2, a), point(x, 4.2, b), point(x, 3.9, b), point(x, 3.9, a));
  }
  for (const i of [11, 13]) {
    const a = i * Math.PI / 12;
    if (i === 11) face(point(-0.9, 4.2, a), point(0.9, 4.2, a), point(0.9, 3.9, a), point(-0.9, 3.9, a));
    else face(point(-0.9, 4.2, a), point(-0.9, 3.9, a), point(0.9, 3.9, a), point(0.9, 4.2, a));
  }
  return part("两端贯通的热流试验大舱", "mesh", pale, [4, 5, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

export const futureSpaceBatchFiveDesigns: ArchitecturePrototype[] = [
  design("双院分层邮政转运局", "包裹装卸庭与市民交寄庭分列中央分拣厅两侧，上层连廊避开车辆进出路径，薄屋盖在两庭之间形成高采光脊", () => {
    const parts: ModelPart[] = [base(67, 53, 0.5), box("中央分拣厅连续地台", 0, 1.2, 0, 15, 1.4, 45, steel), barrelRoof("中央分拣厅高采光拱顶", 7.2, 0.18, 46, [0, 9.3, 0], colors.glass)];
    for (const side of [-1, 1]) parts.push(box("庭院整幅公共地坪接回落地基础", side * 20, 1, 0, 22, 1, 37, steel), rectangularFlue(side > 0 ? "交寄庭沿边办事环廊" : "装卸庭沿边工作环廊", 22, 37, 0.3, 4.8, [side * 20, 6.3, 0], steel), part("前场连续升入庭院地坪的实体宽坡", "extrude", steel, [side * 20, 0, 0], [1, 1, 1], [0, -90, 0], { profile: [{ x: -25.5, y: 0.5 }, { x: -18.5, y: 0.5 }, { x: -18.5, y: 1.5 }], depth: 6 }));
    for (const side of [-1, 1]) { for (const z of [-22, -11, 11, 22]) parts.push(box("分拣厅侧边开放装卸柱廊", side * 7.2, 5.6, z, 0.3, 7.4, 0.3, dark)); parts.push(box("开放柱廊上方的连续承梁", side * 7.2, 9.2, 0, 0.3, 0.3, 45, dark)); }
    for (const side of [-1, 1]) {
      parts.push(box("邮政转运局外侧围护", side * 30.5, 5.85, 0, 0.3, 9.1, 37, pale), box("两庭沿边连续遮雨顶", side * 20, 10.4, 0, 22.5, 0.25, 38, pale), box("分拣厅与庭院间高位接廊", side * 9, 6.3, 0, 7.5, 0.25, 3, steel));
      for (const z of [-16, 0, 16]) parts.push(box("院内独立檐口承柱", side * 10, 5.8, z, 0.25, 9, 0.25, dark));
    }
    for (const z of [-15, -5, 5, 15]) parts.push(box("装卸庭分开的高位货台", -17, 1.6, z, 6.2, 2.2, 6.5, steel), box("市民庭分开的低位交寄台", 17, 2.3, z, 2, 1.6, 5, dark));
    for (const x of [-24, 23]) {
      for (let flight = 0; flight < 2; flight++) { const stairs = stairFlight("两庭地坪实际接入上层环廊的连续实体梯", [x, 1.5 + flight * 2.55, -5.3 - flight * 4.2], 15, 0.17, 0.28, 2.4); stairs.rotation.y = 90; parts.push(stairs); }
      for (const side of [-1, 1]) parts.push(box("两庭上跑楼梯从地坪实际接起的完整细柱", x + side * 0.9, 2.775, -11.5, 0.25, 2.55, 0.25, dark));
    }
    parts.push(...entrance("中央分拣厅主通道", 7.5, 6.4, [0, 1.9, -22.5], 0.3), stairFlight("前场接入中央分拣厅完整地坪的连续短梯", [0, 0.5, -25.65], 7, 0.2, 0.45, 8.5));
    return parts;
  }, "建筑", "科幻"),
  design("分层轨道救援中心", "底层贯通轨道检修槽被两侧医疗与备勤翼夹住，高层指挥桥跨过轨道净空，独立升降井服务中部应急工作层", () => {
    const parts: ModelPart[] = [base(51, 67, 0.5), box("救援中心贯通轨道底床", 0, 0.8, 0, 7, 0.6, 67, dark), ...[-1, 1].map(s => rail([s * 0.8, 1.165, -33.5], [s * 0.8, 1.165, 33.5], 0.13, steel))];
    for (const side of [-1, 1]) {
      parts.push(box("轨道旁连续医疗备勤层板", side * 13, 1.6, 0, 15, 1.8, 58, steel), box("轨道旁备勤翼屋面", side * 13, 8.3, 0, 15.8, 0.25, 59, pale), box("备勤翼外侧薄护壁", side * 20.2, 5, 0, 0.2, 6.3, 58, pale));
      for (const z of [-23, -7.7, 7.7, 23]) parts.push(box("轨道救援翼分间隔墙", side * 13, 5, z, 14.8, 6.3, 0.2, pale), box("向轨道开放的低处转运平台", side * 6.2, 2, z, 4, 0.25, 8.2, steel));
      parts.push(box("指挥桥独立通高服务井", side * 19, 8.3, 0, 3.3, 15.6, 5, dark));
    }
    parts.push(box("高位救援指挥桥楼板", 0, 12.2, 0, 39.5, 0.4, 8.5, steel), box("高位指挥桥覆盖屋顶", 0, 17.7, 0, 40.5, 0.3, 9.3, pale), ...[-1, 1].map(s => part("指挥桥两面透明护壁", "box", colors.glass, [0, 14.975, s * 4.2], [39.2, 5.15, 0.1], [0, 0, 0], { opacity: 0.3, roughness: 0.2 })));
    for (const x of [-19, 19]) for (const z of [-4.2, 4.2]) parts.push(box("从指挥桥楼板连续接到屋盖的独立承柱", x, 14.975, z, 0.3, 5.15, 0.3, dark));
    for (const z of [-27.5, 27.5]) parts.push(box("轨道上空端部高门架", 0, 10.3, z, 12, 0.5, 0.5, dark), ...[-1, 1].map(side => box("端部高门架接回备勤层板的完整立柱", side * 5.8, 6.275, z, 0.35, 7.55, 0.35, dark)));
    return parts;
  }, "建筑", "科幻"),
  design("长跨单坡应急庇护馆", "单向缓降的大屋盖由高低两排重柱承托，连续开敞地面可在侧翼隔断为多间应急生活区，中央贯通通道朝向宽前庭", () => {
    const parts: ModelPart[] = [base(69, 57, 0.5), box("应急庇护馆整幅生活地面", 0, 0.85, 0, 62, 0.7, 49, steel), triangleShell("单向缓降庇护馆整片屋盖", [-31, 15.2, -25], [31, 7.6, -25], [-31, 15.2, 25], 0.25, pale), triangleShell("单向缓降庇护馆整片屋盖", [31, 7.6, -25], [31, 7.6, 25], [-31, 15.2, 25], 0.25, pale)];
    for (const z of [-22, -7.3, 7.3, 22]) {
      parts.push(box("高侧屋盖落地重柱", -30, 7.85, z, 0.45, 14.7, 0.45, dark), box("低侧屋盖落地重柱", 30, 4.1, z, 0.45, 7.2, 0.45, dark), rail([-30, 15.05, z], [30, 7.75, z], 0.3, steel));
      for (const side of [-1, 1]) parts.push(box("侧翼应急生活区短隔断", side * 19, 2.6, z, 18, 3.5, 0.15, pale));
    }
    parts.push(box("低侧连续防风短墙", 30.5, 2.6, 0, 0.3, 3.5, 48.5, stone), box("高侧连续透光上窗", -30.5, 9, 0, 0.12, 8.2, 48.5, colors.glass), ...entrance("庇护馆宽前庭主入口", 12, 5.5, [0, 0.5, -25.2], 0.35), box("前庭公用服务岛台", 0, 1.6, -15.5, 8.5, 1.5, 2.8, dark));
    return parts;
  }, "建筑", "科幻"),
  // 光路组织参考ESO官方VLTI delay-line说明；模型是原创简化观测场，不复刻品牌或下载网格。
  // https://www.eso.org/sci/facilities/paranal/telescopes/vlti/subsystems/delaylines.html
  design("长基线光学合束观测阵", "四座开缝观测舱通过独立中空光路廊汇到中央合束实验庭，庭内平行延迟导轨和独立镜车保持不同光路的空间分离", () => {
    const parts: ModelPart[] = [box("中央合束庭独立地基", 0, 0.25, 0, 22, 0.5, 36, stone), box("合束实验庭室内承板", 0, 0.65, 0, 18, 0.3, 31, steel), ...[-1, 1].map(s => box("合束庭连续薄侧壁", s * 8.8, 2.65, 0, 0.2, 3.8, 31, pale)), barrelRoof("合束庭薄拱屋盖", 9, 0.18, 31.5, [0, 4.5, 0], pale)];
    for (const [x, z] of [[-65, -48], [-50, 52], [62, -50], [64, 48]]) {
      const mount: ModelPart[] = [cylinder("独立观测站圆形基台", 0, 0.2, 0, 16, 0.4, stone), ring("观测舱中空圆筒壁", pale, 7, 0.2, 2.7, 4.6), halfDomeRoof("观测罩打开后的前半薄壳", 7, 0.15, [0, 5, 0.9], 0, pale), halfDomeRoof("观测罩打开后的后半薄壳", 7, 0.15, [0, 5, -0.9], 180, pale), cylinder("望远镜回转底座", 0, 1.8, 0, 2.8, 2.8, dark), ...[-1, 1].map(s => box("双侧仰角支承叉", 0, 4.7, s * 2.3, 0.4, 3.2, 0.4, dark)), ...[-1, 1].map(s => cylinder("不穿过通光中心的仰角短轴", 0, 6.3, s * 1.9, 0.2, 0.8, steel, [90, 0, 0])), part("前端贯通的倾斜光学镜筒", "lathe", steel, [0, 6.3, 0], [1, 1, 1], [0, 0, -40], { profile: [{ x: 1.5, y: -2.2 }, { x: 1.5, y: 2.2 }, { x: 1.3, y: 2.2 }, { x: 1.3, y: -2.2 }, { x: 1.5, y: -2.2 }] }), part("镜筒后端独立主反射面", "cylinder", colors.glass, [-1.2856, 4.7679, 0], [2.6, 0.08, 2.6], [0, 0, -40], { metalness: 0.95, roughness: 0.08 })];
      for (const value of mount) { value.position.x += x!; value.position.z += z!; } parts.push(...mount);
      const start: Triple = [x!, 1.1, z!], end: Triple = [Math.sign(x!) * 5, 1.1, Math.sign(z!) * 12];
      const link = pipe("独立观测站至合束庭的中空光路廊", start, end, 0.9); link.shape = "lathe"; link.profile = [{ x: 0.5, y: -0.5 }, { x: 0.5, y: 0.5 }, { x: 0.38, y: 0.5 }, { x: 0.38, y: -0.5 }, { x: 0.5, y: -0.5 }]; parts.push(link);
    }
    const shoes: ModelPart[] = [];
    for (const x of [-5.4, -1.8, 1.8, 5.4]) {
      parts.push(box("延迟线双轨下方完整落地轨座", x, 0.955, 0, 1.2, 0.31, 22.4, dark));
      for (const side of [-1, 1]) parts.push(rail([x + side * 0.35, 1.15, -11], [x + side * 0.35, 1.15, 11], 0.08, dark));
      shoes.push(rectangularFlue("双轨接入镜车下方的一体开口滑靴", 0.9, 1.1, 0.055, 0.18, [x, 1.18, x], steel));
      parts.push(box("光程补偿独立镜车承台", x, 1.35, x, 0.95, 0.25, 1.4, steel), part("镜车中的回光镜面", "box", colors.glass, [x, 1.85, x], [0.7, 0.8, 0.08], [0, 25, 0], { metalness: 0.95, roughness: 0.08 }));
    }
    parts.push(combineMeshes("四条独立延迟光路镜车的完整开口滑靴", steel, shoes));
    parts.push(box("中央合束仪承台", 0, 1.25, 13, 5.5, 0.9, 1.6, dark), ...entrance("合束庭地面检修入口", 5.8, 3.6, [0, 0.5, -15.8], 0.25));
    return parts;
  }, "设施", "科幻"),
  // 完整中央接收镜场的结构关系参考DOE；不把单镜的角度/数量登记为不同主素材。
  // https://www.energy.gov/cmei/systems/power-tower-system-concentrating-solar-thermal-power-basics
  design("镜场聚焦高塔试验场", "多排独立双轴反射镜围住中央高塔接收头，塔侧两条热流管通到分开的蓄热罐和低位取热工作台", () => {
    const parts: ModelPart[] = [base(99, 99, 0.5), cylinder("中央接收高塔下部实基", 0, 2, 0, 8, 3, stone), cylinder("中央接收器高塔柱", 0, 19.4, 0, 4.5, 34.8, dark), cylinder("高塔外露接收头", 0, 39, 0, 6, 5, "#4d514c"), ring("接收头下方开放检修环", steel, 4.4, 1.3, 36.5, 0.25)];
    for (const [radius, phase] of [[20, 0], [32, 30], [44, 0]]) for (let index = 0; index < 6; index++) {
      const a = (index * 60 + phase!) * Math.PI / 180, x = Math.cos(a) * radius!, z = Math.sin(a) * radius!, normal = new Vector3(-x, 35.9, -z).normalize().add(new Vector3(0, 1, 0)).normalize(), euler = new Euler().setFromQuaternion(new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), normal));
      const axle = new Vector3(normal.z, 0, -normal.x).normalize();
      parts.push(cylinder("定日镜独立方位立座", x, 1.8, z, 0.45, 2.6, dark), pipe("反射面下方俯仰横轴", [x - axle.x * 1.9, 3.1, z - axle.z * 1.9], [x + axle.x * 1.9, 3.1, z + axle.z * 1.9], 0.16), part("朝中央接收头的完整镜板", "box", colors.glass, [x, 3.1, z], [5.2, 0.1, 4], [euler.x, euler.y, euler.z].map(value => value * 180 / Math.PI) as Triple, { metalness: 0.95, roughness: 0.08 }));
    }
    for (const side of [-1, 1]) {
      parts.push(pipe("高塔沿侧独立热流立管", [side * 2.6, 36.5, 0], [side * 2.6, 2.2, 0], 0.22), pipe("低位转入蓄热区的管道", [side * 2.6, 2.2, 0], [side * 7, 2.2, -8], 0.22), ring("独立蓄热罐中空壁", steel, 3, 0.18, 4, 6.8, { position: { x: side * 7, y: 4, z: -8 } }), cylinder("蓄热罐封闭顶盖", side * 7, 7.5, -8, 6.1, 0.2, pale), cylinder("蓄热罐底盘", side * 7, 0.7, -8, 6.1, 0.3, dark));
    }
    parts.push(box("低位蓄热调度工作台", 0, 1.8, -15, 8, 2.6, 3.5, pale));
    return parts;
  }, "设施", "科幻"),
  // 电弧加热—喷管—试验舱—抽气/冷却的组织参考NASA，不使用厂商/机构下载模型。
  // https://www.nasa.gov/setmo/facilities/arc-jet-complex/
  design("返回舱高焓热流风洞站", "电弧加热段接通收扩喷管和空心热流试验舱，旁侧独立抽气缓冲罐与冷却回路沿不同方向布置，试件托臂穿过舱侧检修口", () => {
    const parts: ModelPart[] = [base(65, 43, 0.5), part("前后贯通的电弧加热器壳", "lathe", dark, [-17, 5, 0], [1, 1, 1], [0, 0, 90], { profile: [{ x: 1.5, y: -6 }, { x: 1.5, y: 6 }, { x: 1.18, y: 6 }, { x: 1.18, y: -6 }, { x: 1.5, y: -6 }] }), ...[-21, -13].map(x => ring("分开的加热器水冷电极箍", steel, 1.68, 0.26, 0, 0.5, { position: { x, y: 5, z: 0 }, rotation: { x: 0, y: 0, z: 90 } })), part("收缩喉部再扩张的空心热流喷管", "lathe", steel, [-7.5, 5, 0], [1, 1, 1], [0, 0, -90], { profile: [{ x: 1.5, y: -3.5 }, { x: 0.45, y: -1 }, { x: 0.45, y: 0 }, { x: 2.6, y: 3.5 }, { x: 2.4, y: 3.5 }, { x: 0.3, y: 0 }, { x: 0.3, y: -1 }, { x: 1.3, y: -3.5 }, { x: 1.5, y: -3.5 }] }), heatFlowChamber(), part("下游抽气扩压空心连接段", "lathe", steel, [16, 5, 0], [1, 1, 1], [0, 0, -90], { profile: [{ x: 2.6, y: -4 }, { x: 4, y: 4 }, { x: 3.7, y: 4 }, { x: 2.35, y: -4 }, { x: 2.6, y: -4 }] }), part("进气端开孔的独立真空缓冲罐", "lathe", dark, [24, 5, 0], [1, 1, 1], [0, 0, -90], { profile: [{ x: 4.5, y: -4 }, { x: 4.5, y: 3 }, { x: 3.4, y: 4.1 }, { x: 0, y: 4.5 }, { x: 0, y: 4.2 }, { x: 3.25, y: 3.85 }, { x: 4.2, y: 2.85 }, { x: 4.2, y: -3.75 }, { x: 3.7, y: -4 }, { x: 4.5, y: -4 }] })];
    for (const x of [-21, -13, 0, 9, 25]) parts.push(box("热流链各段独立落地鞍架", x, 2.3, 0, 1.2, 3.6, 5.5, dark));
    for (const x of [-4, 12]) parts.push(ring("热流试验舱通径转接端板", steel, 4.2, 1.8, 0, 0.25, { position: { x, y: 5, z: 0 }, rotation: { x: 0, y: 0, z: -90 } }));
    for (const side of [-1, 1]) parts.push(pipe("加热器独立冷却供回管", [-17, 5.9, side * 1.4], [-17, 1.8, side * 11], 0.25), cylinder("加热器侧向冷却缓冲罐", -17, 2.8, side * 11, 3.2, 4.6, steel), pipe("试验舱侧部独立抽气路", [7, 5, side * 3.8], [18, 3.5, side * 12], 0.75), cylinder("侧向抽气冷凝分离筒", 18, 3.5, side * 12, 3.5, 5.5, dark));
    parts.push(box("舱内试件插入托台", 4, 5, 0, 1.5, 0.25, 1.5, steel), pipe("舱侧试件独立插入杆", [4, 5, -6], [4, 5, 0], 0.22), box("插入杆外部控制基座", 4, 2.8, -6.5, 2.2, 4.6, 2.2, pale), box("电极供电独立封闭电源台", -25, 2.8, 10, 6.5, 4.6, 5.2, pale));
    return parts;
  }, "设施", "科幻"),
  // 含颗粒试验床的环境舱类别参考NASA；这是原创常压扬尘场形态，不复制其热真空工况。
  // https://www.nasa.gov/reference/jsc-dust/
  design("月壤车辆扬尘试验舱", "长车道试验舱中部保留独立颗粒试验床，车轮滚筒和两侧回风收尘箱分开，串接前室让车辆从双门通道进入", () => {
    const parts: ModelPart[] = [base(41, 69, 0.5), box("扬尘车辆舱整段承载地板", 0, 0.8, 0, 27, 0.6, 51, dark), barrelRoof("车辆扬尘试验舱上部薄拱壳", 13.6, 0.25, 51.5, [0, 5.4, 0], pale), ...[-1, 1].map(s => box("试验舱低侧密封薄壁", s * 13.6, 3.1, 0, 0.2, 4.6, 51, pale)), box("中部独立月壤颗粒试验床", 0, 1.25, 0, 13, 0.3, 27, colors.earth)];
    const endProfile = [{ x: -13.6, y: 0.8 }, { x: -13.6, y: 5.4 }];
    for (let index = 1; index <= 12; index++) { const a = Math.PI - index * Math.PI / 12; endProfile.push({ x: Math.cos(a) * 13.6, y: 5.4 + Math.sin(a) * 13.6 }); }
    const front = [...endProfile, { x: 13.6, y: 0.8 }, { x: 5.4, y: 0.8 }, { x: 5.4, y: 7 }, { x: -5.4, y: 7 }, { x: -5.4, y: 0.8 }], back = [...endProfile, { x: 13.6, y: 0.8 }];
    parts.push(part("车辆试验舱保留大门洞的完整端壁", "extrude", pale, [0, 0, -25.65], [1, 1, 1], [0, 0, 0], { depth: 0.3, profile: front }), part("车辆试验舱后部完整密封端壁", "extrude", pale, [0, 0, 25.65], [1, 1, 1], [0, 0, 0], { depth: 0.3, profile: back }));
    for (const side of [-1, 1]) {
      for (const z of [-8, 8]) parts.push(cylinder("分开的车辆车轮测功滚筒", side * 3.3, 1.4, z, 1.2, 3.2, steel, [0, 0, 90]));
      parts.push(box("车道外侧独立回风收尘长箱", side * 10.7, 2.4, 0, 2.6, 2.6, 31, dark), pipe("收尘箱上接旋风筒的支管", [side * 10.7, 3.2, 8], [side * 17, 7.2, 8], 0.55), ring("舱外独立旋风分离筒壁", steel, 1.8, 0.15, 5.5, 6, { position: { x: side * 17, y: 5.5, z: 8 } }), part("旋风筒下部收分料斗", "lathe", steel, [side * 17, 0, 8], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0.35, y: 0.6 }, { x: 1.8, y: 2.5 }, { x: 1.65, y: 2.5 }, { x: 0.22, y: 0.6 }, { x: 0.35, y: 0.6 }] }));
      parts.push(box("车辆双门前室连续侧墙", side * 5.4, 3.9, -28.7, 0.3, 6.2, 10, pale));
      for (let leg = 0; leg < 3; leg++) { const a = leg * Math.PI * 2 / 3; parts.push(rail([side * 17 + Math.cos(a) * 1.7, 0.5, 8 + Math.sin(a) * 1.7], [side * 17 + Math.cos(a) * 1.3, 1.8, 8 + Math.sin(a) * 1.3], 0.15, dark)); }
    }
    parts.push(box("车辆前室完整覆盖屋面", 0, 7.2, -28.7, 11.2, 0.25, 10.5, pale), ...[-25, -33.8].flatMap(z => entrance("车辆试验舱串接大门框", 10.3, 6.1, [0, 0.8, z], 0.3)), ...[-1, 1].map(s => box("颗粒床外侧检修走道", s * 7.8, 1.25, 0, 1.7, 0.3, 34, steel)));
    return parts;
  }, "设施", "科幻"),
];
