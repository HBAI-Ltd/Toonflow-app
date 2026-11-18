import { design, lobe } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { closedRelief } from "./landformShells";

const sandstone = "#b0a78c";
const earth = "#a3a38a";

// 依据明确地貌而重构不同完整形体，不以岩色、尺寸或山峰数量扩项。
// https://geology.utah.gov/map-pub/survey-notes/geosights/geosights-slot-canyons-of-the-san-rafael-swell-emery-county/
// https://www.nps.gov/care/planyourvisit/burrowash.htm
// https://www.bgs.ac.uk/discovering-geology/earth-hazards/landslides/how-to-classify-a-landslide/
// https://pubs.usgs.gov/pp/1229/report.pdf
// https://www.dmr.nd.gov/dmr/ndgs/badlands

function sandstoneSlotCanyon(): ModelPart[] {
  const section: [number, number][] = [[-2, 2.5], [-1.2, 2.56], [-.6, 2.5], [-.24, 2.3], [-.1, 1.65], [-.075, .9], [-.065, .12], [0, .08], [.065, .12], [.075, .9], [.1, 1.65], [.24, 2.3], [.6, 2.5], [1.2, 2.56], [2, 2.5]];
  const rows: Triple[][] = Array.from({ length: 17 }, (_, row) => section.map(([x, height]) => {
    const z = row - 8, center = Math.sin(z * .52) * .35;
    const curl = Math.sin(z * .8) * .025 * Math.min(1, Math.abs(x!) / .24);
    const y = height! + (z + 8) * .003 + Math.sin(z * .7) * .055 * height! / 2.5;
    return [center + x! + curl, y, z];
  }));
  const walls = closedRelief("狭缝峡谷相连岩床与两侧随河道回弯的极高窄壁", sandstone, rows, 20);
  return [walls, lobe("狭缝上段实际楔在两侧岩壁之间的夹石", "#a09f88", [0, 24, 0], [4.2, 3, 4], [12, 23, -9])];
}

function rotationalSlump(): ModelPart[] {
  const levels: [number, number][] = [[-2, 2.8], [-.6, 2.6], [-.03, 2.6], [0, 2.6], [.05, 1.35], [.65, 1.48], [1.4, 1.65], [1.45, 1.65], [1.5, .75], [2.25, .88], [2.9, 1.04], [2.95, 1.04], [3, .34], [3.6, .62], [4.6, .3], [5.6, .08]];
  const rows: Triple[][] = levels.map(([distance, height]) => Array.from({ length: 15 }, (_, column) => {
    const x = (column - 7) * .43, headScarp = -2 + x * x * .11;
    const flank = Math.abs(x) / 3.01;
    const y = .06 + height! + Math.sin(x * 2.1) * .025 * (1 - flank);
    return [x, y, headScarp + distance!];
  }));
  return [closedRelief("旋转滑坡完整弧形主壁、向后倾斜的连贯滑块台面与前缘鼓胀滑舌", earth, rows, 20)];
}

function dissectedBadlands(): ModelPart[] {
  const rows: Triple[][] = Array.from({ length: 15 }, (_, row) => Array.from({ length: 17 }, (_, column) => {
    const t = row / 14, x = (column - 8) * .75, z = (t - .5) * 12;
    const trunk = Math.sin(t * 6) * .2;
    const branch = Math.max(0, .72 - t) * 5.9;
    let distance = Math.min(Math.abs(x - trunk), Math.abs(x - branch), Math.abs(x + branch));
    if (t < .4) {
      const outer = branch + (.4 - t) * 5.1;
      distance = Math.min(distance, Math.abs(x - outer), Math.abs(x + outer));
    }
    const incision = (1.15 - t * .62) * Math.exp(-Math.pow(distance / .56, 2));
    const shoulders = .42 * Math.sin(Math.min(1, distance / 1.5) * Math.PI / 2);
    const height = Math.max(.06, .22 + (1 - t) * 2.1 + shoulders - incision);
    return [x, height, z];
  }));
  return [closedRelief("劣地由密集支沟向主冲沟下切而留下连贯薄脊与陡坡的完整地块", sandstone, rows, 20)];
}

export const erosionalReliefExpansionBatchOneDesigns: MasterNatureDesign[] = [
  design("sinuousSandstoneSlotCanyon", "回弯狭缝峡谷", "岩石", sandstoneSlotCanyon, ["Slot canyon", "高窄回弯岩壁、连续低位岩床与楔入岩壁的夹石"]),
  design("rotationalSlumpLandform", "旋转滑坡地貌", "岩石", rotationalSlump, ["Rotational slump", "弧形主滑壁、后倾滑块台面与鼓胀前缘"]),
  design("dissectedBadlandsRelief", "密沟劣地", "岩石", dissectedBadlands, ["Dissected badlands", "密集支沟向主沟汇流与真实残余薄脊陡坡"]),
];
