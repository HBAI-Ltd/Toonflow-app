import { design } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { closedGrid } from "./geologicStructureExpansionBatchSix";
import { closedRelief } from "./landformShells";

// 只据沉积学实测尺度和形态关系原创网格，不导入高程、贴图或海水。
// 小型朵叶宽300米起、长500米起、厚2至22米；不把整个深海扇缩成百米模型。
// https://www.frontiersin.org/journals/earth-science/articles/10.3389/feart.2021.766946/full
// https://onlinelibrary.wiley.com/doi/full/10.1002/dep2.156
function compensationalTurbiditeLobe(): ModelPart[] {
  const factor = 50;
  const widths = [.16, .45, 1.2, 2.05, 2.9, 3.65, 4, 3.85, 3.25, 2.3, 1.1, .4, .06];
  const rows: Triple[][] = widths.map((width, row) => Array.from({ length: 19 }, (_, column) => {
    const t = row / 12, u = (column - 9) / 9, along = Math.sin(t * Math.PI) ** .35;
    const roof = .17 * along * (1 - Math.abs(u) ** 6);
    const axialLow = .025 * along * Math.exp(-((u / .35) ** 2));
    const inlet = .08 * Math.exp(-((u / (.12 + t * .07)) ** 4)) * Math.max(0, 1 - t / .42);
    return [u * width, .002 + Math.max(.005, roof - axialLow - inlet), row - 6];
  }));
  const surface = rows.flat().map(([x, y, z]) => ({ x, y, z }));
  const base = closedGrid("浊积朵叶从窄入流槽扩为低扁凸透镜并在前缘收尖的完整沉积体", "#a3a68c", surface, surface.map(point => ({ ...point, y: 0 })), 19);
  const parts: ModelPart[] = [base];
  let support = surface;
  for (const side of [-1, 1]) {
    const top = support.map(point => {
      const t = side < 0 ? (point.z + 3) / 7.5 : (point.z + 1.5) / 6.2;
      if (t <= 0 || t >= 1) return { ...point, y: point.y + .0015 };
      const width = .02 + .95 * Math.sin(t * Math.PI) ** .8;
      const center = side * (.35 + Math.sin(t * Math.PI) * .9);
      const u = (point.x - center) / width;
      const thickness = Math.abs(u) < 1 ? (side < 0 ? .055 : .063) * Math.sin(t * Math.PI) ** .6 * (1 - Math.abs(u) ** 5) : 0;
      return { ...point, y: point.y + .0015 + thickness };
    });
    parts.push(closedGrid(side < 0 ? "左偏砂质厚叶向轴部和外缘渐薄成连续细粒沉积裙" : "后期右偏补偿厚叶与披覆前期叶面的连续细粒薄裙", side < 0 ? "#b5ad8d" : "#c0b392", top, support.map(point => ({ ...point, y: point.y - .001 })), 19));
    support = top;
  }
  // ACT: 各沉积层共用母体平面三角划分，层底沿整片真实母面下嵌五厘米，跨格处仍连续相接。
  for (const item of parts) item.scale = { x: factor, y: factor, z: factor };
  return parts;
}

// 局地patch drift实测约500米宽、15米高；隔开丘体与地形障碍的是低位moat。
// https://www.vliz.be/imisdocs/publications/ocrd/300937.pdf
// https://www.nature.com/articles/s43247-023-00978-0
function separatedContouriteDriftMoat(): ModelPart[] {
  const across = [-6, -5, -4, -3, -2.4, -2, -1.7, -1.4, -1, -.4, .4, 1.5, 3, 5, 7, 8, 9];
  const rows: Triple[][] = Array.from({ length: 15 }, (_, row) => across.map(x => {
    const z = -8 + row / 14 * 16, bend = Math.sin(z * .36) * .18;
    const bank = .8 * Math.exp(-(((x + 4.6) / 1.25) ** 4 + (z / 6.8) ** 8));
    const envelope = Math.exp(-((z / 5.4) ** 4));
    const flank = x < -1 ? 0 : x < .6 ? .3 * Math.sin((x + 1) / 1.6 * Math.PI / 2) : .3 * Math.max(0, 1 - (x - .6) / 8.4) ** 1.7;
    const moat = .18 * Math.exp(-(((x + 1.75) / .5) ** 2 + (z / 6.6) ** 6));
    return [x + bend, .22 + bank + flank * envelope - moat, z];
  }));
  return [closedRelief("局地等深流沉积丘的靠槽急坡和外海缓坡与沿障碍侧连续低槽共同形成的完整丘槽体", "#a3aa92", rows, 50)];
}

export const submarineSedimentaryLandformExpansionBatchOneDesigns: MasterNatureDesign[] = [
  design("compensationalTurbiditeLobe", "补偿叠置浊积朵叶", "岩石", compensationalTurbiditeLobe, ["Turbidite lobe", "完整窄入口槽低扁凸透镜与前缘收尖", "薄叶体向不同低位错开叠置并双向减薄", "约600米长400米宽的海底沉积体"]),
  design("separatedContouriteDriftMoat", "局地等深流沉积丘槽", "岩石", separatedContouriteDriftMoat, ["Separated contourite drift and moat", "沉积丘靠槽急坡与外海长缓坡", "丘体和地形障碍之间是真实低位沿坡侧槽", "百米级完整局地丘槽地貌"]),
];
