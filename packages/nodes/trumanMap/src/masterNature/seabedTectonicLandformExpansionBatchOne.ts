import { design } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { closedRelief } from "./landformShells";
import { closedGrid } from "./geologicStructureExpansionBatchSix";

function oceanicDetachmentOutcrop(): ModelPart[] {
  const rows: Triple[][] = Array.from({ length: 23 }, (_, row) => {
    const z = -110 + row * 10;
    return Array.from({ length: 11 }, (_, column) => {
      const x = -150 + column * 30;
      const rollover = 24 * Math.cos((x + 30) / 255 * Math.PI / 2);
      const dome = 9 * (1 - (z / 140) ** 2);
      const striae = Math.sin((z + Math.sin(x / 100) * 1.3) / 36 * Math.PI * 2) * 1.35;
      return [x / 10, (6 + rollover + dome + striae) / 10, z / 10];
    });
  });
  const parts = [closedRelief("低角滚转拆离面本体沿滑移方向连续刻入的细沟纹", "#8e9a8f", rows, 10)];
  for (const [first, last] of [[0, 9], [13, 22]] as const) {
    const bottom = rows.slice(first, last + 1).flatMap(row => row.slice(7).map(([x, y, z]) => ({ x, y, z })));
    const top = bottom.map((point, index) => {
      const column = index % 4;
      const relief = [0.9, 1.5, 1.9, 1.25][column]!;
      const brokenCrest = Math.sin(point.z * 1.1) * 0.12 + Math.cos(point.z * 2.5 + column) * 0.09;
      return { ...point, y: point.y + relief + brokenCrest };
    });
    const remnant = closedGrid("陡断边残余上盘岩楔与下盘滑移面逐点吻合的真实接触", "#78897e", top, bottom, 4);
    remnant.scale = { x: 10, y: 10, z: 10 };
    parts.push(remnant);
  }
  return parts;
}

// https://doi.org/10.1029/2012GC004075
// https://www2.whoi.edu/staff/jcanales/projects/seismicinvestigations/
// ACT: 整个洋壳核杂岩为公里级；本件只复原300×220米可见拆离面露头段。
// 36米滑移条纹直接属于下盘地形，残余岩楔底面沿同一三角格接触，不以浮条装饰替代构造。
export const seabedTectonicLandformExpansionBatchOneDesigns: MasterNatureDesign[] = [
  design("striatedOceanicDetachmentOutcrop", "条纹海底拆离面露头", "岩石", oceanicDetachmentOutcrop, ["Oceanic detachment fault outcrop", "低角滚转下盘", "沿滑移方向的真实沟纹", "残余上盘岩楔", "300米可见构造段"]),
];
