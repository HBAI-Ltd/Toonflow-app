import { BoxGeometry } from "three";
import { beam, part, type ModelPart } from "../assetModelParts";
import { box, cab, cylinder, strut, wheel, transportColors, type TransportDefinition } from "./parts";

function roadAxles(track: number, positions: number[], radius: number): ModelPart[] {
  return positions.flatMap(z => [cylinder("两侧承重轮之间的完整车桥", [0, radius, z], [0.16, track, 0.16], transportColors.dark, [0, 0, 90]), ...[-1, 1].flatMap(side => wheel([side * track / 2, radius, z], radius, 0.46))]);
}

function hammerGuides(): ModelPart {
  const geometry = new BoxGeometry(0.035, 2.2, 1.02), source = geometry.getAttribute("position"), vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
  try {
    for (let guide = 0; guide < 7; guide++) {
      const offset = vertices.length;
      for (let index = 0; index < source.count; index++) vertices.push({ x: source.getX(index) - 1.2 + guide * 0.4, y: source.getY(index), z: source.getZ(index) });
      for (const index of geometry.index!.array) indices.push(offset + index);
    }
  } finally { geometry.dispose(); }
  return part("七块分隔相邻锤对的实体导向立板合批", "mesh", transportColors.dark, [0, 1.78, 3.65], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

// 两种碎石化设备分别利用共振触靴和独立提升落锤，不能用锤头数量再扩主项。
// https://resonantmachines.com/machine-specs/
// https://www.badgerbreaker.com/mhb
export const roadExpansionBatchFifteen: TransportDefinition[] = [
  { name: "侧置共振梁触靴式混凝土路面碎石化自行机", theme: "现代", tags: ["共振梁破碎机", "隔振悬挂钢梁与触地靴", "铰接自行专用车体"], create: () => {
    const parts: ModelPart[] = [...roadAxles(2.2, [-2.45, 2.1], 0.7), box("后轮内侧承载发动机和配重的后半机架", [0, 1.08, 1.3], [1.6, 0.35, 3.7], transportColors.dark), box("前轮内侧与驾驶室共用的前半机架", [0, 1.08, -1.87], [1.6, 0.35, 2.3], transportColors.dark), cylinder("前后机架之间的垂直转向铰销", [0, 1.09, -0.66], [0.32, 0.58, 0.32], transportColors.trim), ...cab([-0.35, 1.43, -1.8], [1.35, 1.6, 1.7]), box("把驾驶室托到轮胎旋转范围上方的中央台座", [0, 1.35, -1.8], [1.55, 0.2, 1.85], transportColors.body), box("把动力罩托到后轮上方的中央台座", [0, 1.35, 1.65], [1.55, 0.2, 3.0], transportColors.body), box("后机架上的封闭液压动力罩", [0, 2.1, 1.65], [1.95, 1.35, 2.8], transportColors.body), box("后动力罩上方的冷却水储箱", [0, 2.925, 1.9], [1.65, 0.3, 1.85], transportColors.signal), box("侧置共振梁的连续实体钢腹板", [1.72, 0.79, -2.4], [0.26, 0.34, 3.5], transportColors.dark), box("共振梁上翼缘", [1.72, 0.98, -2.4], [0.44, 0.06, 3.5], transportColors.body), box("共振梁下翼缘", [1.72, 0.6, -2.4], [0.44, 0.06, 3.5], transportColors.body), box("钢梁前端直接作用于混凝土的低位触地靴", [1.72, 0.065, -4.04], [0.48, 0.13, 0.38], transportColors.trim), box("钢梁与触地靴之间的垂直工作颈", [1.72, 0.37, -4.04], [0.25, 0.49, 0.25], transportColors.dark), cylinder("安装在钢梁后端的液压旋转激振器", [1.72, 1.18, -1.08], [0.52, 0.38, 0.52], transportColors.signal, [0, 0, 90]), box("激振器轴座与梁上翼缘连接的底座", [1.72, 1.03, -1.08], [0.46, 0.2, 0.48], transportColors.dark), box("悬挂两处隔振节点的上部侧承梁", [1.72, 1.79, -1.95], [0.22, 0.2, 2.4], transportColors.body), cylinder("后机罩上方的实际排气短管", [-0.7, 3.1, 1.05], [0.1, 0.9, 0.1], transportColors.dark)];
    for (const z of [-2.9, -1.0]) parts.push(strut("主车架内侧向上升起的悬架承重柱", [0.7, 1.18, z], [0.7, 1.45, z], 0.16, transportColors.body), strut("高于轮胎的悬架横向支座", [0.7, 1.45, z], [1.72, 1.79, z], 0.16, transportColors.body), cylinder("车体与共振梁之间的橡胶隔振悬挂", [1.72, 1.47, z], [0.23, 0.45, 0.23], transportColors.dark), strut("隔振悬挂下端与梁上翼缘相接的拉杆", [1.72, 1.27, z], [1.72, 1.0, z], 0.07, transportColors.trim));
    for (const side of [-1, 1]) parts.push(beam("保持前后机架转向铰接的上下夹耳", transportColors.body, [side * 0.34, 1.08, -0.98], [side * 0.2, 1.08, -0.43], 0.17, 0.25), cylinder("前后机架之间的转向液压缸外筒", [side * 0.7, 1.05, -0.85], [0.12, 0.7, 0.12], transportColors.dark, [90, 0, 0]), cylinder("转向液压缸同轴伸出的活塞杆", [side * 0.7, 1.05, -0.3], [0.05, 0.5, 0.05], transportColors.trim, [90, 0, 0]), box("后机罩可见的竖向散热格栅", [side * 0.985, 1.96, 2.1], [0.025, 0.68, 1.15], transportColors.dark), box("避开前轮的驾驶台侧后防滑踏板", [side * 0.98, 1.1, -0.95], [0.37, 0.08, 0.65], transportColors.body));
    for (const side of [-1, 1]) parts.push(strut("前机架伸出轮胎外沿的防撞梁连接臂", [side * 0.65, 0.92, -2.95], [side * 0.65, 0.92, -3.3], 0.13, transportColors.dark));
    parts.push(box("位于轮胎前方的低位防撞横梁", [0, 0.92, -3.3], [2.1, 0.23, 0.18], transportColors.body));
    return parts;
  } },
  { name: "双排交错独立提升落锤式路面破碎自行机", theme: "现代", tags: ["多落锤路面破碎机", "前后交错重锤", "每对锤独立液压提升"], create: () => {
    const parts: ModelPart[] = [...roadAxles(2.3, [-2.25, 2.2], 0.68), box("位于承重轮内侧的连续专用底盘", [0, 1.02, 0], [1.65, 0.34, 6.1], transportColors.dark), ...cab([-0.45, 1.4, -1.85], [1.25, 1.55, 1.7]), box("驾驶室下方连接中央车架的高位台座", [0, 1.27, -1.85], [1.6, 0.28, 1.85], transportColors.body), box("前后轮之间的液压动力机舱", [0, 1.76, 0.1], [2.05, 1.15, 2.0], transportColors.body), box("动力舱上部封闭冷却器罩", [0, 2.48, 0.4], [1.8, 0.28, 1.3], transportColors.signal), box("后轮内侧托住液压油箱的高位台座", [0, 1.3, 1.7], [1.6, 0.28, 0.9], transportColors.dark), box("高于后轮旋转范围的液压油箱", [0, 1.86, 1.7], [1.95, 0.9, 0.8], transportColors.body), cylinder("动力舱的竖向排气管", [0.85, 2.66, 0.15], [0.09, 1.1, 0.09], transportColors.dark), box("落锤架上部的全宽承载横梁", [0, 3.0, 3.65], [2.7, 0.24, 1.15], transportColors.body), box("六套提锤油缸的共用下铰承梁", [0, 1.0, 3.65], [2.7, 0.16, 0.14], transportColors.dark), hammerGuides()];
    for (const side of [-1, 1]) parts.push(box("连到主车架的重锤架侧立柱", [side * 1.31, 2.0, 3.1], [0.14, 2.12, 0.18], transportColors.body), strut("从后车架上撑锤架顶梁的斜撑", [side * 0.78, 1.13, 1.7], [side * 1.31, 2.94, 3.45], 0.13, transportColors.dark), strut("中央车架至外侧重锤架柱脚的实际承托臂", [side * 0.78, 1.02, 2.85], [side * 1.31, 1.02, 3.1], 0.16, transportColors.body), strut("锤架柱脚至提锤缸下横梁的连接底梁", [side * 1.31, 1.0, 3.1], [side * 1.31, 1.0, 3.65], 0.13, transportColors.dark));
    for (let pair = 0; pair < 6; pair++) {
      const x = (pair - 2.5) * 0.4;
      parts.push(cylinder("每一锤对独立的垂直液压提升缸", [x, 1.59, 3.65], [0.11, 1.12, 0.11], transportColors.body), cylinder("提升缸上方伸出的提锤活塞杆", [x, 2.42, 3.65], [0.045, 0.55, 0.045], transportColors.trim), box("在同组前后重锤上方的提锤横担", [x, 2.71, 3.65], [0.34, 0.1, 0.72], transportColors.body));
      for (const row of [-1, 1]) {
        const hammerX = x + row * 0.09, z = 3.65 + row * 0.29, bottom = row < 0 ? 0.045 : 0.21;
        parts.push(box("与相邻排横向错位的完整实体落锤", [hammerX, bottom + 0.95, z], [0.165, 1.9, 0.39], transportColors.trim), strut("独立提锤横担至重锤顶部的短吊拉杆", [x, 2.66, z], [hammerX, bottom + 1.9, z], 0.05, transportColors.dark));
      }
    }
    return parts;
  } },
];
