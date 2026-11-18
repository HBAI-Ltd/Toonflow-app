import { design, part, polygon, sweptProfile } from "./shared";
import type { MasterNatureDesign, ModelPart } from "./shared";

const host = "#a8aa96";
const bed = "#b9ae90";
const intrusion = "#7e9086";

type Point = [number, number];

export function prism(name: string, color: string, profile: Point[], depth = 10): ModelPart {
  return part(name, "extrude", color, [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: profile.map(([x, y]) => ({ x, y })), depth });
}

function layerBand(name: string, color: string, lower: Point[], upper: Point[], depth = 10): ModelPart {
  return prism(name, color, [...lower, ...upper.slice().reverse()], depth);
}

export function clipBed(points: Point[], low: number, high: number): Point[] {
  let result = points;
  for (const [boundary, above] of [[low, true], [high, false]] as const) {
    const next: Point[] = [];
    for (let index = 0; index < result.length; index++) {
      const a = result[index]!, b = result[(index + 1) % result.length]!;
      const insideA = above ? a[1] >= boundary : a[1] <= boundary, insideB = above ? b[1] >= boundary : b[1] <= boundary;
      if (insideA) next.push(a);
      if (insideA !== insideB) { const t = (boundary - a[1]) / (b[1] - a[1]); next.push([a[0] + (b[0] - a[0]) * t, boundary]); }
    }
    result = next.filter((point, index) => { const previous = next[(index + next.length - 1) % next.length]!; return Math.hypot(point[0] - previous[0], point[1] - previous[1]) > 1e-8; });
  }
  return result;
}

export function contactMatrix(name: string, color: string, outline: Point[], holes: Point[][], depth: number): ModelPart {
  const value = polygon(name, color, outline.map(([x, y]) => [x, -y]), depth, [0, 0, 0], holes.map(hole => hole.map(([x, y]) => [x, -y])));
  const vertices = value.vertices!, indices = value.indices!, faces: number[] = [];
  // 切面与侧壁使用不同顶点；孔边不能把正面法线拉成三角明暗块。
  for (let index = 0; index < indices.length; index += 3) {
    const triangle = indices.slice(index, index + 3), points = triangle.map(i => vertices[i]!);
    if (points.every(point => point.y === points[0]!.y)) faces.push(...triangle);
    else { const start = vertices.length; vertices.push(...points.map(point => ({ ...point }))); faces.push(start, start + 1, start + 2); }
  }
  value.indices = faces;
  value.rotation.x = 90;
  value.position.z = -depth / 2;
  return value;
}

function crossCuttingDike(): ModelPart[] {
  const parts: ModelPart[] = [prism("连续斜切六层围岩的完整岩脉", intrusion, [[-0.65, 0], [0.65, 0], [4.65, 18], [3.35, 18]], 12)];
  for (let index = 0; index < 6; index++) {
    const low = index * 3, high = low + 3, leftLow = -0.65 + low * 4 / 18, leftHigh = -0.65 + high * 4 / 18;
    parts.push(prism("被侵入接触面真实分开的左侧沉积层", index % 2 ? bed : host, [[-16 + index * 0.15, low], [leftLow, low], [leftHigh, high], [-16 + index * 0.15, high]], 12), prism("与左侧同高而未发生断层平移的右侧层", index % 2 ? bed : host, [[leftLow + 1.3, low], [16 - index * 0.1, low], [16 - index * 0.1, high], [leftHigh + 1.3, high]], 12));
  }
  return parts;
}

function concordantSill(): ModelPart[] {
  const parts: ModelPart[] = [prism("顺既有层面横向展开的薄板岩床", intrusion, [[-16, 7.2], [16, 7.2], [16, 9], [-16, 9]], 13), prism("接入岩床底部但未穿过上覆层的供给岩脉", intrusion, [[-0.65, 0], [0.65, 0], [0.65, 7.2], [-0.65, 7.2]], 13)];
  for (let index = 0; index < 3; index++) {
    const low = index * 2.4, high = low + 2.4;
    for (const side of [-1, 1]) { const inner = side * 0.65, outer = side * 16; parts.push(prism("供给岩脉两边保留连续原层位的下伏围岩", index % 2 ? bed : host, [[Math.min(inner, outer), low], [Math.max(inner, outer), low], [Math.max(inner, outer), high], [Math.min(inner, outer), high]], 13)); }
    parts.push(prism("与岩床上表面平行接触的上覆层", index % 2 ? host : bed, [[-16, 9 + index * 2.2], [16, 9 + index * 2.2], [16, 11.2 + index * 2.2], [-16, 11.2 + index * 2.2]], 13));
  }
  return parts;
}

function domingLaccolith(): ModelPart[] {
  const top: Point[] = Array.from({ length: 11 }, (_, index) => { const x = -14 + index * 2.8; return [x, 5.4 + Math.pow(Math.max(0, 1 - (x / 14) ** 2), 0.7) * 8.6]; });
  const parts: ModelPart[] = [prism("底面近乎平坦但向上鼓起的厚透镜岩盖", intrusion, top, 16), prism("从下部接入透镜底的窄供给颈", intrusion, [[-0.65, 0], [0.65, 0], [0.65, 5.4], [-0.65, 5.4]], 16)];
  for (let index = 0; index < 3; index++) {
    for (const side of [-1, 1]) { const inner = side * 0.65, outer = side * 14; parts.push(prism("岩盖底部未被拱弯的下伏原岩层", index % 2 ? bed : host, [[Math.min(inner, outer), index * 1.8], [Math.max(inner, outer), index * 1.8], [Math.max(inner, outer), (index + 1) * 1.8], [Math.min(inner, outer), (index + 1) * 1.8]], 16)); }
    parts.push(layerBand("被岩浆挤起并沿岩盖顶面连续拱弯的围岩层", index % 2 ? host : bed, top.map(([x, y]) => [x, y + index * 1.5]), top.map(([x, y]) => [x, y + (index + 1) * 1.5]), 16));
  }
  return parts;
}

function saucerLopolith(): ModelPart[] {
  const bottom: Point[] = Array.from({ length: 11 }, (_, index) => { const x = -15 + index * 3; return [x, 2.5 + (Math.abs(x) / 15) ** 1.8 * 6.5]; });
  const top: Point[] = bottom.map(([x]) => [x, 5.2 + (Math.abs(x) / 15) ** 1.8 * 4.3]);
  const parts = [layerBand("中央下凹且边缘上翘的厚碟状岩盆露头", intrusion, bottom, top, 18), prism("承托整个岩盆的下凹接触围岩", host, [[-15, 0], [15, 0], ...bottom.slice().reverse()], 18)];
  for (let index = 0; index < 3; index++) parts.push(layerBand("沿岩盆上部凹面弯曲而非岩盖上拱的上覆层", index % 2 ? host : bed, top.map(([x, y]) => [x, y + index * 1.4]), top.map(([x, y]) => [x, y + (index + 1) * 1.4]), 18));
  return parts;
}

function ringDike(): ModelPart[] {
  const angle = Math.PI * 1.5;
  const parts = [sweptProfile("陡立封闭环状侵入体的四分之三露头", intrusion, [[11.4, 0], [12.6, 0], [12.6, 14], [11.4, 14]], angle, 24)];
  for (let index = 0; index < 4; index++) {
    const low = index * 3, high = low + 3;
    parts.push(sweptProfile("环墙包围的中心原岩实体", index % 2 ? bed : host, [[0, low], [11.4, low], [11.4, high], [0, high]], angle, 24), sweptProfile("环墙外侧与中心同高的原岩层", index % 2 ? bed : host, [[12.6, low], [18, low], [18, high], [12.6, high]], angle, 24));
  }
  return parts;
}

function convergingConeSheet(): ModelPart[] {
  const angle = Math.PI * 1.5;
  const parts = [sweptProfile("向下汇聚窄根而向上外张的真正锥状岩席", intrusion, [[2, 0], [2.8, 0], [13, 14], [12.2, 14]], angle, 24)];
  for (let index = 0; index < 4; index++) {
    const low = index * 3.5, high = low + 3.5, innerLow = 2 + low * 10.2 / 14, innerHigh = 2 + high * 10.2 / 14;
    parts.push(sweptProfile("锥席内侧随深度收束的原岩楔", index % 2 ? bed : host, [[0, low], [innerLow, low], [innerHigh, high], [0, high]], angle, 24), sweptProfile("锥席外侧保留同一水平层序的围岩", index % 2 ? bed : host, [[innerLow + 0.8, low], [18, low], [18, high], [innerHigh + 0.8, high]], angle, 24));
  }
  return parts;
}

function brecciaDiatreme(): ModelPart[] {
  const contact: Point[] = [[2, 0], [2.6, 3], [3.3, 6], [4.1, 9], [5.1, 12], [6.4, 15], [8, 18]];
  const outline: Point[] = [...contact.map(([x, y]) => [-x, y] as Point), ...contact.slice().reverse()];
  const centers: Point[] = [[-0.5, 2], [0.9, 4.5], [-1.2, 7], [1.9, 9.6], [-2.2, 11.5], [0, 13.8], [3.4, 15.8], [-4.1, 16.1]];
  const fragments = centers.map(([x, y], index): Point[] => [[x - 0.5 - index % 2 * 0.15, y - 0.5], [x + 0.42, y - 0.37], [x + 0.66, y + 0.15], [x - 0.16, y + 0.65], [x - 0.6, y + 0.25]]);
  const parts: ModelPart[] = [contactMatrix("爆破筒内被角砾真实贯穿的连续细碎基质", intrusion, outline, fragments, 10)];
  for (const fragment of fragments) parts.push(prism("与基质孔壁吻合的棱角状围岩角砾", bed, fragment, 10));
  for (let index = 0; index < contact.length - 1; index++) for (const side of [-1, 1]) {
    const a = contact[index]!, b = contact[index + 1]!;
    const profile: Point[] = side < 0 ? [[-17, a[1]], [-a[0], a[1]], [-b[0], b[1]], [-17, b[1]]] : [[a[0], a[1]], [17, a[1]], [17, b[1]], [b[0], b[1]]];
    parts.push(prism("被上宽下窄爆破筒截断而没有侧向错动的原岩层", index % 2 ? host : bed, profile, 10));
  }
  return parts;
}

function angularUnconformity(): ModelPart[] {
  const parts: ModelPart[] = [];
  for (let index = -5; index < 11; index++) {
    const low = index * 2.2, high = low + 2.2;
    const profile = clipBed([[-18, low - 9], [18, low + 9], [18, high + 9], [-18, high - 9]], 0, 10);
    if (profile.length >= 3) parts.push(prism("被同一水平侵蚀面截断的古老倾斜层", index % 2 ? bed : host, profile, 11));
  }
  for (let index = 0; index < 3; index++) parts.push(prism("不与下伏倾斜层平行的新水平覆盖层", index % 2 ? host : bed, [[-18, 10 + index * 2], [18, 10 + index * 2], [18, 12 + index * 2], [-18, 12 + index * 2]], 11));
  return parts;
}

// 以可见露头段表达接触关系；不是把完整区域性岩盆、岩基缩成几十米。
// https://www.nps.gov/subjects/geology/intrusive-igneous-landforms.htm
// https://australian.museum/learn/minerals/shaping-earth/igneous-intrusions/
// https://webapps.bgs.ac.uk/memoirs/docs/B06059.html
// https://home.nps.gov/articles/000/grcatime-vishnu-basement-rocks.htm
export const geologicStructureExpansionBatchOneDesigns: MasterNatureDesign[] = [
  design("crossCuttingDikeOutcrop", "穿层岩脉露头", "岩石", crossCuttingDike, ["Igneous dike", "截切层理", "大型接触露头段"]),
  design("concordantSillOutcrop", "顺层岩床露头", "岩石", concordantSill, ["Igneous sill", "顺层板体与供给颈", "大型接触露头段"]),
  design("laccolithDomingOutcrop", "岩盖拱升接触露头", "岩石", domingLaccolith, ["Laccolith", "平底上鼓透镜与拱弯顶层", "大型接触露头段"]),
  design("lopolithSaucerOutcrop", "岩盆下凹接触露头", "岩石", saucerLopolith, ["Lopolith", "下凹碟状接触", "大型接触露头段"]),
  design("ringDikeOutcrop", "环状岩墙露头", "岩石", ringDike, ["Ring dyke", "陡立环状侵入与内外围岩", "剖露扇区"]),
  design("convergingConeSheetOutcrop", "汇聚锥状岩席露头", "岩石", convergingConeSheet, ["Cone sheet", "向下汇聚向外上张", "剖露扇区"]),
  design("brecciaDiatremeOutcrop", "火山角砾岩筒露头", "岩石", brecciaDiatreme, ["Diatreme", "爆破筒内角砾与基质实孔吻合", "大型接触露头段"]),
  design("angularUnconformityOutcrop", "角度不整合岩壁", "岩石", angularUnconformity, ["Angular unconformity", "截平倾斜旧层与水平新层", "大型层序露头段"]),
];
