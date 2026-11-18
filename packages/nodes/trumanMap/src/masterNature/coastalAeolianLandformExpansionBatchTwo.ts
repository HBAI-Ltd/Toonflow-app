import { combineMeshes, design, type MasterNatureDesign, type ModelPart, type Triple } from "./shared";
import { closedRelief } from "./landformShells";
import { sampleGrid } from "./glacialIcefallExpansionBatchOne";

// 完整风蚀凹盆与上风长臂，不反转旧新月丘：
// https://www.nps.gov/grsa/learn/nature/dune-types.htm
// https://www.nps.gov/articles/aeolian.htm
// 两岸线海向会聚及前陆旧滩脊、脊间洼地：
// https://www.nps.gov/articles/000/nantucket-barrier-beach-and-wildlife-refuge-a-new-national-natural-landmark.htm
// https://pubs.usgs.gov/of/2003/of03-243/
// https://irma.nps.gov/DataStore/DownloadFile/656810?Reference=1046189
// 不按长臂、岸线或滩脊数量与方向扩主；全部为本地原创米制网格。

function parabolicDune(): ModelPart[] {
  const path: [number, number][] = Array.from({ length: 19 }, (_, index) => {
    const x = -1.25 + index / 18 * 2.5;
    return [x, 1.2 - 1.728 * x * x];
  });
  const rows: Triple[][] = Array.from({ length: 15 }, (_, row) => Array.from({ length: 17 }, (_, column) => {
    const x = (column - 8) / 8 * 2.05, z = (row - 7) / 7 * 2;
    let distance = Infinity, side = 0, closestX = 0;
    for (let index = 0; index < path.length - 1; index++) {
      const a = path[index]!, b = path[index + 1]!, dx = b[0] - a[0], dz = b[1] - a[1];
      const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz)));
      const qx = a[0] + dx * t, qz = a[1] + dz * t, d = Math.hypot(x - qx, z - qz);
      if (d >= distance) continue;
      distance = d; closestX = qx; side = -dz * (x - qx) + dx * (z - qz);
    }
    const crest = .38 - .2 * (Math.abs(closestX) / 1.25) ** 1.3;
    const sand = Math.max(0, crest - distance * (side >= 0 ? .59 : .35));
    const openBasin = .03 * Math.exp(-((x / .7) ** 4)) * Math.max(0, Math.min(1, (1.6 - z) / .6));
    return [x, .055 - openBasin + sand, z];
  }));
  return [closedRelief("双上风长臂围抱真实敞口风蚀凹盆并连向下风活动鼻的抛物线丘", "#bfae86", rows, 40)];
}

function cuspateForeland(): ModelPart[] {
  const factor = 50;
  const bed: Triple[][] = Array.from({ length: 13 }, (_, row) => Array.from({ length: 15 }, (_, column) => {
    const x = (column - 7) / 7 * 2.7, z = -2.7 + row / 12 * 4.95;
    return [x, .005 + .007 * Math.exp(-((x / 2) ** 2 + (z / 1.8) ** 2)), z];
  }));
  const shore: Triple[][] = Array.from({ length: 9 }, (_, row) => Array.from({ length: 15 }, (_, column) => {
    const t = row / 8, x = (column - 7) / 7 * 2.5;
    return [x, .035 + .17 * (1 - t) + .008 * Math.sin(x * 1.3) * (1 - t), -2.6 + t * 1.3];
  }));
  const fore: Triple[][] = Array.from({ length: 17 }, (_, row) => Array.from({ length: 9 }, (_, column) => {
    const progress = row / 16, t = (column - 4) / 4, width = .035 + 1.9 * (1 - progress) ** 1.4;
    const height = .11 * (width / 1.935) ** .75;
    return [t * width, .018 + height * (1 - Math.abs(t) ** 1.6), -2.2 + progress * 4.05];
  }));
  const parts: ModelPart[] = [closedRelief("尖岬两侧均向外海敞开的完整海床", "#9fa58d", bed, factor),
    closedRelief("承接尖岬宽基部而沿两侧海岸连续展开的陆岸", "#b1aa8b", shore, factor),
    closedRelief("双内凹岸线从宽陆岸共同收尖并向海增生的完整尖岬前陆", "#bfaf89", fore, factor)];
  const foreTop = fore.flat().map(([x, y, z]) => ({ x, y, z }));
  const fronts: ModelPart[] = [];
  for (const [rootWidth, tip] of [[1.4, 1.15], [1.1, .5], [.8, -.15]]) {
    const left: [number, number][] = Array.from({ length: 7 }, (_, index) => {
      const u = index / 6;
      return [-rootWidth! * (1 - u) ** 1.18, -1.8 + (tip! + 1.8) * u];
    });
    const path: [number, number][] = [...left, ...left.slice(0, -1).reverse().map(([x, z]) => [-x, z] as [number, number])];
    const rows: Triple[][] = path.map(([x, z], row) => {
      const a = path[Math.max(0, row - 1)]!, b = path[Math.min(path.length - 1, row + 1)]!, dx = b[0] - a[0], dz = b[1] - a[1], length = Math.hypot(dx, dz);
      return Array.from({ length: 5 }, (_, column) => {
        const t = (column - 2) / 2, px = x + dz / length * .035 * t, pz = z - dx / length * .035 * t;
        const floor = sampleGrid(foreTop, 9, px, pz);
        return [px, floor - .002 + .014 * (1 - Math.abs(t) ** 1.4), pz];
      });
    });
    fronts.push(closedRelief("两侧旧岸线在海向尖部真实会聚相接的凸起滩脊", "#c5b591", rows, 1));
  }
  const ridges = combineMeshes("尖岬上会聚的旧滩脊与其间保留的低洼地", "#c5b591", fronts);
  ridges.scale = { x: factor, y: factor, z: factor };
  parts.push(ridges);
  return parts;
}

export const coastalAeolianLandformExpansionBatchTwoDesigns: MasterNatureDesign[] = [
  design("parabolicDuneBlowoutBasin", "长臂凹盆抛物线沙丘", "岩石", parabolicDune, ["Parabolic dune", "上风固定双长臂", "真实风蚀凹盆与敞开风口", "下风活动沙鼻"]),
  design("cuspateForelandBeachRidges", "会聚滩脊尖岬前陆", "岩石", cuspateForeland, ["Cuspate foreland", "两岸线由宽陆岸向海共同收尖", "海向会聚的旧滩脊", "脊间低洼与完整外海床"]),
];
