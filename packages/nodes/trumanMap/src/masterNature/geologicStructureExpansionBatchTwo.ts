import { design } from "./shared";
import type { MasterNatureDesign, ModelPart } from "./shared";
import { clipBed, contactMatrix, prism } from "./geologicStructureExpansionBatchOne";

type Point = [number, number];
const host = "#a4ad96";
const bed = "#b6ad91";

function saltDiapir(): ModelPart[] {
  const contact: Point[] = [[2, 1.5], [2.2, 5], [3.8, 9], [4.5, 13], [4.3, 15.5], [3, 18.5], [1, 20]];
  const radiusAt = (height: number) => {
    const index = Math.max(0, contact.findIndex((point, index) => index < contact.length - 1 && height >= point[1] && height <= contact[index + 1]![1]));
    const a = contact[index]!, b = contact[index + 1]!;
    return a[0] + (b[0] - a[0]) * (height - a[1]) / (b[1] - a[1]);
  };
  const salt: Point[] = [[-18, 0], [18, 0], [18, 1.5], ...contact, [-1, 20], ...contact.slice(0, -1).reverse().map(([radius, y]) => [-radius, y] as Point), [-18, 1.5]];
  const parts: ModelPart[] = [prism("从连续底部盐源层上涌并刺穿层理的盐柱", "#c2c4af", salt, 12)];
  for (let index = 0; index < 6; index++) {
    const low = 1.5 + index * 2.5, high = low + 2.5, innerLow = low + (index ? 1.5 : 0), innerHigh = high + 1.5;
    const trace: Point[] = [[radiusAt(innerLow), innerLow], ...contact.filter(([, y]) => y > innerLow && y < innerHigh), [radiusAt(innerHigh), innerHigh]];
    for (const side of [-1, 1]) {
      const profile: Point[] = [[side * 18, low], [side * 10, low], ...trace.map(([radius, y]) => [side * radius, y] as Point), [side * 10, high], [side * 18, high]];
      parts.push(prism("被盐柱贯穿并在接触边缘向上翘起的沉积层", index % 2 ? bed : host, profile, 12));
    }
  }
  return parts;
}

function boudinage(): ModelPart[] {
  const fragments: Point[][] = Array.from({ length: 6 }, (_, index) => {
    const x = -14 + index * 5.6, width = 4.6 + index % 2 * 0.3, y = 6 + Math.sin(index) * 0.2;
    return [[x - width / 2, y - 0.45], [x - width * 0.29, y - 1.15], [x + width * 0.3, y - 1], [x + width / 2, y + 0.12], [x + width * 0.27, y + 1.1], [x - width * 0.29, y + 0.95]];
  });
  const parts: ModelPart[] = [contactMatrix("围绕分离强岩层并连续填入颈隙的弱岩基质", host, [[-18, 0], [18, 0], [18, 12], [-18, 12]], fragments, 10)];
  for (const fragment of fragments) parts.push(prism("沿原层位拉伸分断但没有重新拼成完整层的强岩布丁体", "#c2bda4", fragment, 10));
  for (let seam = 0; seam < 2; seam++) {
    const lower: Point[] = [], upper: Point[] = [];
    for (let index = 0; index < 6; index++) {
      const x = -14 + index * 5.6, y = 6 + Math.sin(index) * 0.2;
      const outline = fragments[index]!;
      const points: Point[] = seam ? [[outline[0]![0], y - 1.5], [x, y - 1.7], [outline[3]![0], y - 1.4], [outline[3]![0] + 0.2, y - 0.15]] : [[outline[0]![0], y + 1.35], [x, y + 1.65], [outline[3]![0], y + 1.4], [outline[3]![0] + 0.2, y + 0.15]];
      lower.push(...points); upper.push(...points.map(([a, b]) => [a, b + 0.035] as Point));
    }
    // 只在前侧露头内嵌浅层片理，不在实体岩块之间留下假空腔。
    for (let index = 0; index < 3; index++) {
      const a = lower.slice(index * 8, index * 8 + 8), b = upper.slice(index * 8, index * 8 + 8);
      const seamPart = prism("弱层顺着布丁体外缘及颈部弯入的片理带", bed, [...a, ...b.reverse()], 0.04);
      seamPart.position.z = -4.99; parts.push(seamPart);
    }
  }
  return parts;
}

function thrustDuplex(): ModelPart[] {
  const parts: ModelPart[] = [prism("贯通各断层马片底部的共同底板岩层", host, [[-21, 0], [21, 0], [21, 1.88], [-21, 1.88]], 12), prism("所有上升斜坡在下方汇入的底滑脱带", "#849284", [[-21, 1.88], [21, 1.88], [21, 2], [-21, 2]], 12), prism("各斜坡在上方重新汇入的顶滑脱带", "#849284", [[-21, 12], [21, 12], [21, 12.12], [-21, 12.12]], 12), prism("不截断内部斜坡而连续覆盖的顶板岩层", host, [[-21, 12.12], [21, 12.12], [21, 14.5], [-21, 14.5]], 12), prism("双重构造左边缘的完整围岩楔", bed, [[-21, 2], [-16, 2], [-11, 12], [-21, 12]], 12), prism("双重构造右边缘的围岩楔", bed, [[16, 2], [21, 2], [21, 12]], 12)];
  for (let horse = 0; horse < 4; horse++) {
    const left = -16 + horse * 8;
    for (let layer = -2; layer < 3; layer++) {
      const low = layer * 0.4, high = low + 0.4;
      const local = clipBed([[0, low], [1, low + 0.8], [1, high + 0.8], [0, high]], 0, 1);
      if (local.length < 3) continue;
      const profile: Point[] = local.map(([u, v]) => [left + u * 8 + v * 5, 2 + v * 10]);
      parts.push(prism("位于两条相连斜坡之间并重复原层序的断层马片", layer % 2 ? bed : host, profile, 12));
    }
  }
  return parts;
}

// https://pubs.usgs.gov/mf/1213/report.pdf
// https://www.diogenes.uni-potsdam.de/diogenes_key.asp
// https://webapps.bgs.ac.uk/Memoirs/docs/GCR34_Chapter5MoineThrustBelt.html
export const geologicStructureExpansionBatchTwoDesigns: MasterNatureDesign[] = [
  design("saltDiapirOutcrop", "盐丘底辟接触露头", "岩石", saltDiapir, ["Salt diapir", "盐源层连通上涌柱", "刺穿拱起围岩", "大型接触露头段"]),
  design("boudinageOutcrop", "布丁构造岩壁", "岩石", boudinage, ["Boudinage", "强层分断与弱层颈隙", "大型变形露头段"]),
  design("thrustDuplexOutcrop", "双重逆冲构造露头", "岩石", thrustDuplex, ["Thrust duplex", "顶底滑脱面与封闭马片", "大型构造露头段"]),
];
