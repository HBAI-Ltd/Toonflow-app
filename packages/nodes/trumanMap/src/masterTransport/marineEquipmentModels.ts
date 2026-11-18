import { part, type ModelPart, type Triple } from "../assetModelParts";
import { box, cylinder, strut, surface, transportColors, type TransportDefinition } from "./parts";

function twistedPropellerBlade(angle: number): ModelPart {
  const stations = [[0.65, 0.22, 38], [1.4, 0.58, 32], [2.3, 0.65, 27], [3.2, 0.46, 22], [3.8, 0.13, 17]];
  const points: Triple[] = stations.flatMap(([radius, chord, pitch]) => [-1, 1].map(side => {
    const radians = pitch! * Math.PI / 180, offset = side * chord!;
    return [radius!, 0.03 * radius! ** 2 + offset * Math.cos(radians), 0.07 * radius! + offset * Math.sin(radians)] as Triple;
  }));
  const faces = stations.slice(1).flatMap((_, index) => { const a = index * 2; return [a, a + 1, a + 3, a, a + 3, a + 2]; });
  const blade = surface("沿半径连续扭转的推进桨叶", transportColors.trim, points, faces, [0, 4, 0]);
  blade.rotation.z = angle;
  return blade;
}

export function createMarinePropellerParts(): ModelPart[] {
  return [part("收分封闭整流桨毂", "lathe", transportColors.trim, [0, 4, 0], [1, 1, 1], [90, 0, 0], { profile: [{ x: 0, y: -1.2 }, { x: 0.48, y: -0.8 }, { x: 0.74, y: -0.35 }, { x: 0.74, y: 0.45 }, { x: 0.48, y: 0.8 }, { x: 0, y: 0.95 }] }), ...[0, 72, 144, 216, 288].map(twistedPropellerBlade)];
}

export const marineEquipmentModels: TransportDefinition[] = [
  // 旋筒助推的原理参考 IMO，不下载模型；静态模型不承担航船动力仿真。
  // https://greenvoyage2050.imo.org/technology/flettner-rotors/
  { name: "船用马格努斯旋筒助推帆", itemType: "设施", tags: ["旋筒帆", "风力助推", "Magnus", "Flettner"], create: () => [cylinder("固定甲板承力基座", [0, 0.4, 0], [5, 0.8, 5], transportColors.dark), cylinder("底部电机轴承座", [0, 1.5, 0], [3.3, 1.4, 3.3]), cylinder("垂直旋转圆筒帆体", [0, 12.2, 0], [3.6, 20, 3.6], transportColors.trim), cylinder("顶部端板圆盘", [0, 22.3, 0], [5.4, 0.2, 5.4], transportColors.body), cylinder("下部旋转端板", [0, 2.14, 0], [4, 0.16, 4], transportColors.body), box("电机检修侧匣", [1.9, 0.95, 0], [1.1, 1.1, 1.2], transportColors.signal), strut("检修匣至基座固定支座", [1.9, 0.4, 0], [1.9, 0.95, 0], 0.3)] },
  { name: "扭曲叶片船用推进螺旋桨", itemType: "构件", tags: ["船用螺旋桨", "推进桨", "径向变螺距"], create: createMarinePropellerParts },
  { name: "棘爪式船用锚链止链器", itemType: "构件", tags: ["锚链止链", "止链爪", "甲板索具"], create: () => {
    const parts: ModelPart[] = [box("甲板固定承力底板", [0, 0.045, 0], [0.66, 0.09, 0.9], transportColors.dark), ...[-1, 1].map(side => box("锚链通槽侧座", [side * 0.23, 0.2, 0], [0.13, 0.26, 0.74])), cylinder("止链爪翻转横轴", [0, 0.4, 0.18], [0.07, 0.69, 0.07], transportColors.trim, [0, 0, 90]), part("前落式叉口止链爪", "extrude", transportColors.signal, [0, 0.38, 0.02], [1, 1, 1], [0, 90, 0], { depth: 0.12, profile: [{ x: -0.23, y: -0.15 }, { x: -0.12, y: -0.15 }, { x: 0.22, y: 0.02 }, { x: 0.22, y: 0.12 }, { x: -0.23, y: 0.01 }] }), strut("手动翻爪操纵杆", [0.3, 0.4, 0.18], [0.3, 0.64, 0.38], 0.025)];
    for (let index = 0; index < 5; index++) parts.push(part("互相穿接的锚链链环", "torus", transportColors.dark, [0, 0.29, -0.24 + index * 0.12], [0.18, 0.25, 0.07], index % 2 ? [90, 0, 0] : [90, 90, 0]));
    return parts;
  } },
];
