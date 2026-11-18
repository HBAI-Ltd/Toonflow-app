import { part, ring, type ModelPart, type Triple } from "../assetModelParts";
import { box, cylinder, strut, surface, transportColors, type TransportDefinition } from "./parts";
import { createMarinePropellerParts } from "./marineEquipmentModels";

// 原创简化的自航救援潜器，球形压力壳、通舱与下部对接裙口形成完整主体；不提供耐压或救援认证。
// https://navalunderseamuseum.org/dsrv-mystic/
// https://www.history.navy.mil/content/history/museums/nmusn/explore/photography/underwater-search-and-recovery-equipment/mystic-dsrv-1/330-cfd-dn-sc-95-01763.html

const body = transportColors.body, dark = transportColors.dark, trim = transportColors.trim;

function rescuePressureSphere(z: number, docking: boolean): ModelPart {
  const points: Triple[] = [-0.8, -0.55, -0.275, 0, 0.275, 0.55, 0.8].flatMap(axial => Array.from({ length: 24 }, (_, index) => {
    const radius = Math.sqrt(1 - axial * axial), angle = index * Math.PI / 12;
    return [Math.cos(angle) * radius, Math.sin(angle) * radius, axial] as Triple;
  }));
  const faces: number[] = [], indices: number[] = [], edges = new Map<string, [number, number]>();
  for (let row = 0; row < 6; row++) for (let column = 0; column < 24; column++) {
    if (docking && (row === 2 || row === 3) && (column === 17 || column === 18)) continue;
    const a = row * 24 + column, b = row * 24 + (column + 1) % 24, c = a + 24, d = b + 24;
    faces.push(a, b, d, a, d, c);
  }
  const used = [...new Set(faces)], count = used.length, locations = new Map(used.map((index, local) => [index, local])), localFaces = faces.map(index => locations.get(index)!);
  indices.push(...localFaces);
  for (let index = 0; index < localFaces.length; index += 3) {
    const triangle = localFaces.slice(index, index + 3);
    indices.push(triangle[2]! + count, triangle[1]! + count, triangle[0]! + count);
    for (let edge = 0; edge < 3; edge++) { const a = triangle[edge]!, b = triangle[(edge + 1) % 3]!; if (!edges.delete(`${b},${a}`)) edges.set(`${a},${b}`, [a, b]); }
  }
  for (const [a, b] of edges.values()) indices.push(a, b + count, b, a, a + count, b + count);
  return part(docking ? "两端通舱且底部另有真实救援出入孔的中间耐压球" : "两端具有真实通舱口的独立耐压球", "mesh", body, [0, 2.3, z], [1, 1, 1], [0, 0, 0], { vertices: [1.25, 1.12].flatMap(radius => used.map(index => { const [x, y, axial] = points[index]!; return { x: x * radius, y: y * radius, z: axial * radius }; })), indices });
}

export const marineExpansionBatchThirteen: TransportDefinition[] = [
  { name: "三球通舱底部对接式自航深潜救援艇", theme: "现代", tags: ["自航深潜救援艇", "DSRV 类构造", "三球压力壳与底对接裙口"], create: () => {
    const glass = cylinder("前部通舱口内由密封框承接的真实观察玻璃", [0, 2.3, -4.04], [1.33, 0.16, 1.33], transportColors.glass, [90, 0, 0]);
    glass.opacity = 0.34;
    glass.roughness = 0.12;
    const propeller = createMarinePropellerParts().map(value => ({ ...value, position: { x: value.position.x * 0.22, y: 2.3 + (value.position.y - 4) * 0.22, z: 9.3 + value.position.z * 0.22 }, scale: { x: value.scale.x * 0.22, y: value.scale.y * 0.22, z: value.scale.z * 0.22 } }));
    const parts: ModelPart[] = [rescuePressureSphere(-3, false), rescuePressureSphere(-0.5, true), rescuePressureSphere(2, false), glass, part("前观察窗与耐压球圆口之间的真实密封框", "lathe", dark, [0, 2.3, -4], [1, 1, 1], [90, 0, 0], { profile: [{ x: 0.66, y: -0.1 }, { x: 0.76, y: -0.1 }, { x: 0.76, y: 0.1 }, { x: 0.66, y: 0.1 }, { x: 0.66, y: -0.1 }] }), cylinder("后部耐压球独立于机器舱的圆形密封隔壁", [0, 2.3, 2.95], [1.52, 0.2, 1.52], dark, [90, 0, 0]), part("由中间球底孔连到对接面的真实开底裙筒", "lathe", dark, [0, 0, -0.5], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0.92, y: 0.2 }, { x: 0.92, y: 0.38 }, { x: 0.52, y: 0.7 }, { x: 0.52, y: 1.4 }, { x: 0.4, y: 1.4 }, { x: 0.4, y: 0.72 }, { x: 0.8, y: 0.38 }, { x: 0.8, y: 0.2 }, { x: 0.92, y: 0.2 }] }), ring("对接裙下端沿真实开口铺设的密封唇圈", trim, 0.95, 0.13, 0.2, 0.12, { position: { x: 0, y: 0.2, z: -0.5 } }), part("位于耐压舱后方的独立机器整流舱", "lathe", trim, [0, 2.3, 0], [1, 1, 1], [90, 0, 0], { profile: [{ x: 0, y: 3 }, { x: 0.9, y: 3.3 }, { x: 1.05, y: 4 }, { x: 1.05, y: 7.3 }, { x: 0.6, y: 8.5 }, { x: 0, y: 8.9 }] }), cylinder("整流舱末段伸出的真实推进轴", [0, 2.3, 8.8], [0.18, 1, 0.18], dark, [90, 0, 0]), ...propeller, cylinder("接在前球舱内壁上的实际生活底板", [0, 1.55, -3], [1.66, 0.12, 1.66], dark), box("跨三球上沿的检修与起吊共用主梁", [0, 3.58, -0.5], [0.5, 0.16, 7.4], dark), box("上部吊眼与共用主梁相接的根座", [0, 3.72, 0.5], [0.4, 0.2, 0.4], dark), part("上方具有真实圆孔的起吊眼", "lathe", trim, [0, 4, 0.5], [1, 1, 1], [90, 0, 0], { profile: [{ x: 0.16, y: -0.07 }, { x: 0.25, y: -0.07 }, { x: 0.25, y: 0.07 }, { x: 0.16, y: 0.07 }, { x: 0.16, y: -0.07 }] })];
    for (const z of [-1.75, 0.75]) parts.push(part("相邻耐压球之间保持真实通行净空的短通舱", "lathe", dark, [0, 2.3, z], [1, 1, 1], [90, 0, 0], { profile: [{ x: 0.66, y: -0.35 }, { x: 0.76, y: -0.35 }, { x: 0.76, y: 0.35 }, { x: 0.66, y: 0.35 }, { x: 0.66, y: -0.35 }] }));
    for (const side of [-1, 1]) {
      parts.push(box("低于对接裙并分居两侧的降落滑橇", [side * 1.35, 0.1, 2.3], [0.25, 0.2, 14], dark), box("绕开中央对接井的纵向主承梁", [side * 0.8, 1.28, 2.1], [0.2, 0.2, 12.8], dark), part("沿侧底架安装的密封电池浮力壳", "lathe", trim, [side * 1.55, 1.4, 2.2], [1, 1, 1], [90, 0, 0], { profile: [{ x: 0, y: -4.25 }, { x: 0.28, y: -3.7 }, { x: 0.28, y: 3.7 }, { x: 0, y: 4.25 }] }), cylinder("座椅与球舱生活底板之间的支承脚", [side * 0.35, 1.75, -3.1], [0.15, 0.28, 0.15], dark), box("前驾驶球内的独立座椅坐面", [side * 0.35, 1.95, -3.1], [0.45, 0.12, 0.5], dark), box("前驾驶球内的座椅靠背", [side * 0.35, 2.25, -2.9], [0.45, 0.6, 0.1], dark), surface("机器舱后段伸出的水平操纵尾面", body, [[side * 0.3, 2.3, 7.5], [side * 1.85, 2.3, 8.2], [side * 1.85, 2.3, 8.7], [side * 0.3, 2.3, 8.6]], [0, 1, 2, 0, 2, 3]));
      for (const z of [-1, 2, 5.5]) parts.push(strut("落地滑橇与舱体下承梁的倾斜支柱", [side * 1.35, 0.2, z], [side * 0.8, 1.28, z], 0.18, dark), strut("支柱向外承托电池浮力壳的短托架", [side * 0.8, 1.28, z], [side * 1.55, 1.28, z], 0.13, dark));
    }
    parts.push(surface("尾部纵向方向舵", body, [[0, 2.55, 7.45], [0, 4, 8.25], [0, 4, 8.75], [0, 2.55, 8.6]], [0, 1, 2, 0, 2, 3]));
    return parts;
  } },
];
