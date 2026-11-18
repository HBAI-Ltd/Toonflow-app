import { design } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { closedRelief } from "./landformShells";

const bedrock = "#929d8c";
const gravel = "#aaa98d";

function glacialTrough(): ModelPart[] {
  const rows: Triple[][] = Array.from({ length: 13 }, (_, row) => Array.from({ length: 17 }, (_, col) => {
    const t = (col - 8) / 8, z = row - 6, x = t * 4;
    const floor = 0.12 + (row / 12) * 0.3;
    const wall = 3.1 * Math.min(1, Math.max(0, (Math.abs(t) - 0.25) / 0.7) ** 2);
    return [x, floor + wall + Math.abs(t) * Math.sin(row * 0.9) * 0.09, z];
  }));
  return [closedRelief("冰川槽谷连续宽缓谷底与两侧陡立的U形岩壁", bedrock, rows, 25)];
}

function esker(): ModelPart[] {
  const rows: Triple[][] = Array.from({ length: 17 }, (_, row) => Array.from({ length: 9 }, (_, col) => {
    const t = (col - 4) / 4, center = Math.sin(row * 0.55) * 1.2;
    return [center + t * 0.62, 0.07 + (0.95 + Math.sin(row * 0.7) * 0.15) * (1 - Math.abs(t) ** 1.3), row * 0.6 - 4.8];
  }));
  return [closedRelief("冰川蛇丘由水下沉积形成而连续蜿蜒且横向收成窄脊的砂砾垄", gravel, rows, 20)];
}

function braidedChannel(): ModelPart[] {
  const bars = [[-1.1, -3.4, 0.95, 1.7], [1.1, -0.7, 0.8, 1.8], [-0.5, 2.3, 1.0, 1.9], [1.9, 4.6, 0.65, 1.4]];
  const rows: Triple[][] = Array.from({ length: 17 }, (_, row) => Array.from({ length: 15 }, (_, col) => {
    const x = (col - 7) * 4 / 7, z = (row - 8) * 0.85;
    const deposit = bars.reduce((sum, [bx, bz, w, l]) => sum + 0.44 * Math.exp(-(((x - bx!) / w!) ** 4 + ((z - bz!) / l!) ** 4)), 0);
    const bank = Math.max(0, Math.abs(x) - 2.85) * 0.46;
    return [x, 0.08 + deposit + bank, z];
  }));
  return [closedRelief("辫状河床的多条低槽在实际梭形砾洲之间分流再汇合", gravel, rows, 25)];
}

// 依据地学机构描述保留地貌结构；没有附加水片或冒充水流仿真。
// https://www.nps.gov/articles/ushapedvalleysfjordshangingvalleys.htm
// https://gq.mines.gouv.qc.ca/quaternaire_en/eskers_en/
// https://www.nps.gov/articles/braided-stream.htm
export const fluvialGlacialLandformDesigns: MasterNatureDesign[] = [
  design("glacialUShapedTrough", "冰川U形槽谷", "岩石", glacialTrough, ["Glacial trough", "连续宽平岩床与两侧陡峭槽壁"]),
  design("sinuousGravelEsker", "冰川蛇丘", "岩石", esker, ["Esker", "窄脊砂砾垄与连续蛇形地貌"]),
  design("braidedGravelChannel", "辫状河道砾洲河床", "岩石", braidedChannel, ["Braided river bed", "实际低槽绕过梭形砾洲分流再汇合"]),
];
