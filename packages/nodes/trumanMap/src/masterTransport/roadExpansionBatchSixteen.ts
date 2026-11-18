import { Euler, MathUtils, Matrix4, Quaternion, Vector3 } from "three";
import { beam, type ModelPart, type Triple } from "../assetModelParts";
import { box, cab, cylinder, helicalFlight, strut, wheel, transportColors, type TransportDefinition } from "./parts";

function conveyor(start: Triple, end: Triple, width: number): ModelPart[] {
  const a = new Vector3(...start), b = new Vector3(...end), direction = b.clone().sub(a), length = direction.length();
  direction.normalize();
  const lateral = direction.clone().cross(new Vector3(0, 1, 0)).normalize(), normal = lateral.clone().cross(direction).normalize();
  const rotation = new Euler().setFromRotationMatrix(new Matrix4().makeBasis(lateral, direction, normal)), degrees: Triple = [rotation.x, rotation.y, rotation.z].map(MathUtils.radToDeg) as Triple;
  const middle = a.clone().add(b).multiplyScalar(0.5), lower = middle.clone().addScaledVector(normal, -0.18);
  const parts: ModelPart[] = [box("连续上行的敞开式输送带", middle.toArray() as Triple, [width, length, 0.065], transportColors.dark, degrees), box("上行带下方的独立回程带", lower.toArray() as Triple, [width, length, 0.045], transportColors.dark, degrees)];
  for (const side of [-1, 1]) {
    const center = middle.clone().addScaledVector(lateral, side * (width / 2 + 0.045)).addScaledVector(normal, -0.09);
    parts.push(box("输送机真实贯通的两侧承力梁", center.toArray() as Triple, [0.09, length, 0.2], transportColors.body, degrees));
  }
  const rollerRotation = new Euler().setFromQuaternion(new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), lateral)), rollerDegrees: Triple = [rollerRotation.x, rollerRotation.y, rollerRotation.z].map(MathUtils.radToDeg) as Triple;
  for (const endPoint of [a, b]) parts.push(cylinder("接住上行带与回程带的横向端滚筒", endPoint.clone().addScaledVector(normal, -0.09).toArray() as Triple, [0.2, width + 0.13, 0.2], transportColors.trim, rollerDegrees));
  return parts;
}

function liftCylinder(start: Triple, end: Triple): ModelPart[] {
  const middle = start.map((value, index) => value + (end[index]! - value) * 0.64) as Triple, overlap = start.map((value, index) => value + (end[index]! - value) * 0.6) as Triple;
  const body = strut("拾取台升降缸的实际外筒", start, middle, 0.16), rod = strut("与外筒共轴并相接的活塞杆", overlap, end, 0.068, transportColors.trim);
  body.shape = "cylinder"; rod.shape = "cylinder";
  return [body, rod];
}

// 从路边堆料拾取、清土再装车，和田间切顶起根的甜菜收获机是独立完整机种。
// https://www.ropa-maschinenbau.de/us/products/beet-loaders/euro-maus-4/
export const roadExpansionBatchSixteen: TransportDefinition[] = [
  { name: "宽幅滚辊拾取清土侧装式甜菜清洁装载机", theme: "现代", tags: ["甜菜清洁装载机", "宽幅滚辊拾取台", "侧向折臂装车带和反侧配重"], create: () => {
    const parts: ModelPart[] = [
      box("承载拾取清土和侧卸机构的专用中央机架", [0, 1.45, 0], [1.9, 0.35, 7.8], transportColors.dark),
      ...cab([-1.3, 2.05, -1.35], [1.4, 1.55, 1.7]),
      box("避开中部提升带的左侧驾驶室台座", [-1.0, 1.83, -1.35], [0.7, 0.45, 1.85], transportColors.body),
      box("高于后轮的独立动力机罩", [-0.2, 2.7, 3.35], [1.8, 1.5, 1.2], transportColors.body),
      box("后轮内侧的动力机罩中央承台", [0, 1.79, 3.35], [1.5, 0.35, 1.1], transportColors.dark),
      box("拾取台前部贯通横向承梁", [0, 0.56, -5.6], [8.95, 0.16, 0.12], transportColors.signal),
      box("拾取台后部贯通横向承梁", [0, 0.56, -3.72], [8.95, 0.16, 0.15], transportColors.signal),
      box("中央滚辊出口与提升带之间的短接料导板", [0, 0.56, -4.0], [1.1, 0.06, 0.7], transportColors.dark),
      ...conveyor([0, 0.59, -3.75], [0, 2.35, 0.4], 1.1),
      ...conveyor([-0.6, 2.35, 2.2], [2.9, 3.2, 2.2], 1.0),
      ...conveyor([3.1, 3.25, 2.2], [7.2, 4.15, 2.2], 1.0),
      cylinder("侧卸输送机的底部承重转台座", [0, 1.73, 2.2], [1.2, 0.26, 1.2], transportColors.dark),
      cylinder("侧卸输送机的水平回转支承", [0, 1.96, 2.2], [1.28, 0.25, 1.28], transportColors.body),
      box("回转支承上与皮带根部相接的双侧铰座", [-0.25, 2.15, 2.2], [0.7, 0.2, 0.7], transportColors.dark),
      beam("承托侧卸长输送机外伸段的下弦斜梁", transportColors.body, [0.6, 1.6, 2.2], [4.6, 3.5, 2.2], 0.19, 0.22),
      beam("向侧卸带相反方向伸出的配重承臂", transportColors.dark, [-0.6, 1.9, 2.2], [-4.0, 2.2, 2.2], 0.32, 0.45),
      box("配重臂端兼作燃料箱的封闭平衡重", [-4.65, 2.5, 2.2], [1.6, 1.1, 1.7], transportColors.signal),
      cylinder("后动力罩上的排气管", [-0.9, 3.7, 3.35], [0.1, 0.9, 0.1], transportColors.dark),
      ...[-1, 1].map(side => box("把两级装车输送段真正相连的侧面铰接板", [3.0, 3.04, 2.2 + side * 0.56], [0.45, 0.18, 0.12], transportColors.body)),
    ];
    for (const z of [-2.0, 3.0]) parts.push(cylinder("高位机架下的全宽驱动车桥", [0, 0.9, z], [0.18, 2.7, 0.18], transportColors.dark, [0, 0, 90]), ...[-1, 1].flatMap(side => wheel([side * 1.35, 0.9, z], 0.9, 0.6)));
    for (let row = 0; row < 3; row++) {
      const z = -5.3 + row * 0.49, y = row === 0 ? 0.2 : 0.35;
      for (const side of [-1, 1]) {
        parts.push(cylinder("拾取台上的完整半幅滚辊芯轴", [side * 2.26, y, z], [0.18, 4.32, 0.18], transportColors.dark, [0, 0, 90]));
        const flight = helicalFlight([side * 4.36, y, z], 0.08, 0.2, 4.2, 8, side < 0 ? -1 : 1, 0.02);
        flight.name = "与另一侧反向导送块根的连续螺旋滚辊"; flight.color = transportColors.trim; flight.rotation.z = side > 0 ? 90 : -90;
        parts.push(flight);
      }
    }
    for (const side of [-1, 1]) parts.push(box("拾取滚辊两端实际固定轴承的外侧板", [side * 4.43, 0.4, -4.65], [0.1, 0.7, 1.85], transportColors.body), strut("中央机架与宽幅拾取台之间的摆臂", [side * 0.8, 1.45, -3.35], [side * 1.1, 0.57, -4.0], 0.19, transportColors.body), ...liftCylinder([side * 0.8, 1.52, -2.95], [side * 1.4, 0.64, -3.72]), strut("外翼拾取台后梁向中央摆臂的斜向承托", [side * 1.1, 0.57, -4.0], [side * 4.15, 0.57, -3.72], 0.13, transportColors.dark), box("中央提升带两侧的后清土辊承梁", [side * 0.67, 2.16, 1.06], [0.12, 0.3, 1.7], transportColors.body));
    for (const z of [0.5, 0.85, 1.2, 1.55]) parts.push(cylinder("提升后供泥土从间隙落下的独立清理滚辊", [0, 2.2, z], [0.3, 1.3, 0.3], transportColors.trim, [0, 0, 90]));
    return parts;
  } },
];
