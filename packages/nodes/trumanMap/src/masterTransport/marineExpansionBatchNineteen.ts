import { CatmullRomCurve3, Vector3 } from "three";
import { part, ring, type ModelPart, type Triple } from "../assetModelParts";
import { box, cylinder, strut, transportColors, type TransportDefinition } from "./parts";
import { solidPanel } from "./marineExpansionBatchTwo";

// 完整单点装卸终端与独立储缆回转设备；不是从铺缆船或FPSO拆出的附件换名。
// https://www.bluewater.com/our-solutions/mooring-and-transfer-systems/calm-buoy-terminals/
// https://www.bluewater.com/wp-content/uploads/2019/06/digitale-brochure-TurretBouy-Tech-description.pdf
// https://www.bluewater.com/wp-content/uploads/2023/04/BLW-Corp_broch_web-2023.pdf
// https://www.cablecarousels.com/products/cable-carousels/

const body = transportColors.body, dark = transportColors.dark, trim = transportColors.trim;

function hollowHose(name: string, path: Triple[], outer: number, inner: number): ModelPart {
  const curve = new CatmullRomCurve3(path.map(p => new Vector3(...p)), false, "centripetal");
  const frames = curve.computeFrenetFrames(24, false), vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
  for (let segment = 0; segment <= 24; segment++) {
    const centre = curve.getPointAt(segment / 24);
    for (const radius of [outer, inner]) for (let radial = 0; radial < 8; radial++) {
      const angle = radial * Math.PI / 4;
      const point = centre.clone().addScaledVector(frames.normals[segment]!, Math.cos(angle) * radius).addScaledVector(frames.binormals[segment]!, Math.sin(angle) * radius);
      vertices.push({ x: point.x, y: point.y, z: point.z });
    }
    if (!segment) continue;
    for (let radial = 0; radial < 8; radial++) {
      const a = (segment - 1) * 16 + radial, b = (segment - 1) * 16 + (radial + 1) % 8;
      indices.push(a, b, b + 16, a, b + 16, a + 16, a + 8, b + 24, b + 8, a + 8, a + 24, b + 24);
    }
  }
  for (let radial = 0; radial < 8; radial++) {
    const next = (radial + 1) % 8, last = 24 * 16;
    indices.push(radial, radial + 8, next + 8, radial, next + 8, next, last + radial, last + next + 8, last + radial + 8, last + radial, last + next, last + next + 8);
  }
  return part(name, "mesh", dark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

function catenaryChain(angle: number): ModelPart[] {
  // 两端链节中心偏离系链眼半个节距，使链节真正穿扣眼孔，而非两个环同心悬放。
  const start = 6.55, end = 27.52, span = end - start, a = 11.7, startY = 16.94, endY = 1.03;
  const shift = span / 2 - a * Math.asinh((endY - startY) / (2 * a * Math.sinh(span / (2 * a))));
  const offset = endY - a * Math.cosh((span - shift) / a), firstSinh = Math.sinh(-shift / a);
  const length = a * (Math.sinh((span - shift) / a) - firstSinh), result: ModelPart[] = [];
  let count = Math.ceil(length / 0.85) + 1;
  if (count % 2 === 0) count++;
  for (let first = 0; first < count; first += 10) {
    const vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
    for (let link = first; link < Math.min(first + 10, count); link++) {
      const distance = link / (count - 1) * length, radial = shift + a * Math.asinh(distance / a + firstSinh);
      const centre = new Vector3((start + radial) * Math.cos(angle), a * Math.cosh((radial - shift) / a) + offset, (start + radial) * Math.sin(angle));
      const tangent = new Vector3(Math.cos(angle), Math.sinh((radial - shift) / a), Math.sin(angle)).normalize();
      const lateral = new Vector3(-Math.sin(angle), 0, Math.cos(angle));
      if (link % 2) lateral.crossVectors(tangent, lateral).normalize();
      const normal = new Vector3().crossVectors(tangent, lateral).normalize(), base = vertices.length;
      for (let step = 0; step < 12; step++) {
        const t = step * Math.PI / 6, along = new Vector3().addScaledVector(tangent, Math.cos(t) / 0.62).addScaledVector(lateral, Math.sin(t) / 0.28).normalize();
        const onLoop = centre.clone().addScaledVector(tangent, Math.cos(t) * 0.62).addScaledVector(lateral, Math.sin(t) * 0.28);
        for (let side = 0; side < 4; side++) {
          const cross = side * Math.PI / 2, point = onLoop.clone().addScaledVector(along, Math.cos(cross) * 0.07).addScaledVector(normal, Math.sin(cross) * 0.07);
          vertices.push({ x: point.x, y: point.y, z: point.z });
        }
      }
      for (let step = 0; step < 12; step++) for (let side = 0; side < 4; side++) {
        const p = base + step * 4 + side, q = base + (step + 1) % 12 * 4 + side, r = base + (step + 1) % 12 * 4 + (side + 1) % 4, s = base + step * 4 + (side + 1) % 4;
        indices.push(p, q, r, p, r, s);
      }
    }
    result.push(part("由真实交替开孔链节连接而成的悬链系泊腿", "mesh", dark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices }));
  }
  return result;
}

function rollerFork(radius: number, angle: number): ModelPart {
  const c = Math.cos(angle), s = Math.sin(angle), vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
  for (const side of [-1, 1]) {
    const panel = solidPanel("滚轮叉架沿径向短轴开孔的独立耳板", [(radius + side * 0.29) * c, 0, (radius + side * 0.29) * s], [-s, 0, c], [0, 1, 0], [[-0.09, 0.38], [0.09, 0.38], [0.09, 0.9], [-0.09, 0.9]], [Array.from({ length: 8 }, (_, index) => [Math.cos(index * Math.PI / 4) * 0.051, 0.48 + Math.sin(index * Math.PI / 4) * 0.051] as [number, number])]);
    const base = vertices.length;
    vertices.push(...panel.vertices!);
    indices.push(...(panel.indices ?? panel.vertices!.map((_p, index) => index)).map(index => index + base));
  }
  const base = vertices.length;
  for (const [x, y, z] of [[-0.37, 0.8, -0.09], [0.37, 0.8, -0.09], [0.37, 0.9, -0.09], [-0.37, 0.9, -0.09], [-0.37, 0.8, 0.09], [0.37, 0.8, 0.09], [0.37, 0.9, 0.09], [-0.37, 0.9, 0.09]]) vertices.push({ x: radius * c + x! * c - z! * s, y: y!, z: radius * s + x! * s + z! * c });
  indices.push(...[0, 2, 1, 0, 3, 2, 4, 5, 6, 4, 6, 7, 0, 1, 5, 0, 5, 4, 3, 7, 6, 3, 6, 2, 0, 4, 7, 0, 7, 3, 1, 2, 6, 1, 6, 5].map(index => index + base));
  return part("从底盘向下伸出且两耳板具有真实径向轴孔的倒U滚轮叉架", "mesh", body, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

export const marineExpansionBatchNineteen: TransportDefinition[] = [
  { name: "六腿悬链系泊旋转装卸浮筒完整终端", theme: "现代", itemType: "设施", tags: ["CALM单点系泊装卸", "转台式系泊浮筒", "海底输送管浮软管系统", "以海床为放置基准", "海面高于海床约20m"], create: () => {
    const floatPoints: Triple[] = [[0, 21, 0], [0, 21.8, 0], [-1, 22.3, 0], [-4, 21.6, 0], [-8, 19.5, 1], [-15, 19.2, 4], [-22, 19.2, 8]];
    const parts: ModelPart[] = [ring("直径十二米而具有中央通井的封闭浮筒", body, 6, 4, 18, 4), ring("固定浮筒上部承托独立旋转平台的主轴承", dark, 3.5, 1.5, 20.125, 0.25), ring("连接浮筒主轴承且保留中央产品旋转接头孔的转台甲板", trim, 5.3, 4.3, 20.4, 0.3), ring("嵌在旋转甲板中央的产品接头轴承壳", body, 1.05, 0.76, 20.5, 0.4), ring("穿过中央轴承的真实中空输送旋转接管", dark, 0.28, 0.06, 20.55, 0.9), box("单点系泊终端海底管接头的独立底板", [0, 0.15, -0.5], [4, 0.3, 4], dark), box("旋转转台上的系船索厚根座", [4.3, 20.8, 0], [1.5, 0.5, 1.3], body), ring("旋转转台艏向连接船端缆绳的真正开孔系索眼", trim, 0.7, 0.35, 0, 0.3, { position: { x: 4.3, y: 21.7, z: 0 }, rotation: { x: 90, y: 0, z: 0 } }), hollowHose("海底接管向上弯入浮筒通井的真实双壁输送软管", [[0, 1.5, 0], [0, 2.3, 0], [2.2, 5.5, 0], [1, 12, 0], [0, 19.2, 0], [0, 20.1, 0]], 0.28, 0.22), hollowHose("旋转接管经上弯段接到浮面外输端的连续开孔软管", floatPoints, 0.28, 0.22), hollowHose("海底终端入口弯管与浮筒上升软管之间的连续管腔", [[0, 0.9, -2.6], [0, 0.9, -1], [0, 1, 0], [0, 1.5, 0]], 0.28, 0.22), ring("海底终端入口具有真实流道的安装法兰", trim, 0.43, 0.21, 0, 0.14, { position: { x: 0, y: 0.9, z: -2.6 }, rotation: { x: 90, y: 0, z: 0 } }), box("入口弯管与海底底板之间的第一承托墩", [0, 0.46, -1.8], [0.5, 0.32, 0.45], body), box("入口弯管与海底底板之间的第二承托墩", [0, 0.495, -0.45], [0.5, 0.39, 0.45], body)];
    for (let index = 0; index < 6; index++) {
      const angle = index * Math.PI / 3, c = Math.cos(angle), s = Math.sin(angle);
      parts.push(box("每一独立悬链腿海底的重力系泊锚块", [28 * c, 0.4, 28 * s], [3, 0.8, 3], dark, [0, -angle * 180 / Math.PI, 0]), ring("焊接浮筒侧壳而保持真实开孔的系泊耳", body, 0.4, 0.22, 0, 0.18, { position: { x: 6.35 * c, y: 17.4, z: 6.35 * s }, rotation: { x: 90, y: 0, z: angle * 180 / Math.PI } }), ring("下端实际焊入海底锚块的真孔系链眼", trim, 0.38, 0.18, 0, 0.22, { position: { x: 28 * c, y: 1.18, z: 28 * s }, rotation: { x: 90, y: 0, z: angle * 180 / Math.PI } }), ...catenaryChain(angle));
    }
    const floatPath = new CatmullRomCurve3(floatPoints.map(p => new Vector3(...p)), false, "centripetal");
    for (let index = 0; index < 6; index++) {
      const f = 0.46 + index * 0.095, centre = floatPath.getPointAt(f), direction = floatPath.getTangentAt(f), value = strut("真正套在外输软管外而不堵住流道的浮力套环", centre.clone().addScaledVector(direction, -0.4).toArray() as Triple, centre.clone().addScaledVector(direction, 0.4).toArray() as Triple, 1, trim);
      value.shape = "lathe";
      value.scale = { x: 1, y: 1, z: 1 };
      value.profile = [{ x: 0.275, y: -0.4 }, { x: 0.52, y: -0.4 }, { x: 0.52, y: 0.4 }, { x: 0.275, y: 0.4 }, { x: 0.275, y: -0.4 }];
      parts.push(value);
    }
    return parts;
  } },
  { name: "双环轨滚轮驱动开放储缆篮回转盘", theme: "现代", itemType: "设施", tags: ["大型电缆回转盘", "空储缆篮carousel", "轮轨承载脐带缆储运"], create: () => {
    const parts: ModelPart[] = [ring("固定在船甲板或堆场基础上的外环行走轨", dark, 9.8, 0.6, 0.1, 0.2), ring("承托内侧滚轮的独立同心固定轨", dark, 3.6, 0.6, 0.1, 0.2), ring("内外圈滚轮实际承托的旋转环形储缆底盘", body, 10, 7, 0.91, 0.3), ring("开放储缆篮中央空鼓的上缘圈", trim, 3.05, 0.25, 3.95, 0.2), ring("中央空鼓下缘与底盘实际相接的围圈", dark, 3.05, 0.25, 1.1, 0.18), ring("开放储缆篮外圈上缘刚性环梁", trim, 10.1, 0.3, 3.95, 0.2), ring("外圈竖肋之间约束缆圈的中位环梁", body, 10.1, 0.3, 2.5, 0.14)];
    for (let index = 0; index < 12; index++) {
      const angle = index * Math.PI / 6, c = Math.cos(angle), s = Math.sin(angle), rotation: Triple = [0, -angle * 180 / Math.PI, 0];
      parts.push(box("储缆篮外周独立竖肋并向下接到旋转底盘", [9.94 * c, 2.45, 9.94 * s], [0.24, 2.9, 0.2], body, rotation), box("中央空鼓围成实际可见空井的竖向承载肋", [2.94 * c, 2.45, 2.94 * s], [0.24, 2.9, 0.2], body, rotation));
    }
    for (const [radius, count] of [[9.5, 12], [3.3, 6]] as const) for (let index = 0; index < count; index++) {
      const angle = index * Math.PI * 2 / count, c = Math.cos(angle), s = Math.sin(angle), rotation: Triple = [0, -angle * 180 / Math.PI, 90];
      parts.push(cylinder("上下分别实际接触固定轨和旋转底盘的承重滚轮", [radius * c, 0.48, radius * s], [0.56, 0.3, 0.56], trim, rotation), cylinder("穿入叉架两腿而与承重滚轮同心的真实短轴", [radius * c, 0.48, radius * s], [0.09, 0.8, 0.09], dark, rotation), rollerFork(radius, angle));
      if (radius === 9.5 && index % 3 === 0) parts.push(cylinder("直接驱动外环承重轮并随储缆篮转动的密封减速电机", [10.1 * c, 0.48, 10.1 * s], [0.45, 0.4, 0.45], dark, rotation), strut("减速电机壳体接到外叉架的独立短承托", [9.85 * c, 0.65, 9.85 * s], [10.1 * c, 0.65, 10.1 * s], 0.12, body));
    }
    return parts;
  } },
];
