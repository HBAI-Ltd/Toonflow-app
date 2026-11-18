import { combineMeshes, design, polygon, type MasterNatureDesign, type ModelPart, type Triple } from "./shared";
import { closedRelief } from "./landformShells";
import { closedGrid } from "./geologicStructureExpansionBatchSix";
import { sampleGrid } from "./glacialIcefallExpansionBatchOne";

// 只借原始地学资料校准整体形态，全部为原创本地米制网格：
// 潮汐口门主槽，潟湖侧涨潮沙洲及外海侧落潮沙洲：
// https://repository.library.noaa.gov/view/noaa/35726/noaa_35726_DS1.pdf
// https://dem.ri.gov/sites/g/files/xkgbur861/files/programs/benviron/emerre/grp/RIinlets.pdf
// 抬升海蚀平台、古海蚀崖和薄层旧滩沉积：
// https://pubs.usgs.gov/fs/2018/3002/fs20183002.pdf
// 下风半湖岸的月形岸丘，岸丘曲率由湖盆控制，不是反转游移沙丘：
// https://www.govinfo.gov/content/pkg/GOVPUB-I29-PURL-gpo130348/pdf/GOVPUB-I29-PURL-gpo130348.pdf

function tidalInlet(): ModelPart[] {
  const xs = [-3.4, -2.6, -2, -1.5, -1.1, -.8, -.5, -.25, 0, .25, .5, .8, 1.1, 1.5, 2, 2.6, 3.4];
  const zs = [-3, -2.3, -1.7, -1.2, -.75, -.4, -.2, 0, .25, .55, .95, 1.45, 2, 2.6, 3.2];
  const rows: Triple[][] = zs.map(z => xs.map(x => {
    const barrier = .2 * Math.exp(-(((z - .06 * Math.sin(x)) / .37) ** 4)) * (1 - Math.exp(-((x / .46) ** 4)));
    const flood = [-.58, .58].reduce((height, center) => height + .085 * Math.max(0, 1 - ((x - center) / .76) ** 2 - ((z + 1.12) / 1.03) ** 2) ** 1.4, 0);
    const ebb = .105 * Math.max(0, 1 - (x / 1.05) ** 2 - ((z - 1.42) / 1.4) ** 2) ** 1.1;
    const throat = .12 * Math.sin(z * 1.15), width = .16 + Math.min(.16, Math.abs(z) * .07);
    const channel = Math.exp(-(((x - throat) / width) ** 4));
    const terminal = .037 * Math.exp(-(((z - 2) / .45) ** 2)) * Math.max(0, 1 - (x / 1.06) ** 2);
    return [x, .022 + barrier + (flood + ebb) * (1 - channel * .94) + terminal * (1 - channel * .65), z];
  }));
  return [closedRelief("障壁沙岸被真实低口门切开，主槽连通潟湖侧涨潮沙洲与海侧落潮沙洲", "#b9b18f", rows, 50)];
}

function marineTerraces(): ModelPart[] {
  const factor = 50;
  const profile: [number, number][] = [[-2.6, 1.22], [-2.18, 1.16], [-2.04, .89], [-1.3, .87], [-1.12, .85], [-1.01, .57], [-.25, .55], [-.09, .53], [.02, .27], [.7, .25], [.82, .235], [.9, .073], [1.58, .047], [1.75, .03], [2.3, .015]];
  const rows: Triple[][] = profile.map(([z, y]) => Array.from({ length: 17 }, (_, column) => {
    const x = (column - 8) / 8 * 3.2;
    return [x, y + .008 * Math.sin(x * 1.7), z + .06 * Math.sin(x) + .035 * Math.sin(x * 1.8)];
  }));
  const top = rows.flat().map(([x, y, z]) => ({ x, y, z }));
  const deposits: ModelPart[] = [];
  for (const [start, end] of [[-1.93, -1.18], [-.9, -.17], [.11, .69]]) {
    const bottom = Array.from({ length: 5 }, (_, row) => Array.from({ length: 17 }, (_, column) => {
      const x = (column - 8) / 8 * 3.18;
      const z = start! + (end! - start!) * row / 4 + .06 * Math.sin(x) + .035 * Math.sin(x * 1.8);
      return { x, y: sampleGrid(top, 17, x, z) - .002, z };
    })).flat();
    deposits.push(closedGrid("实际贴覆旧海蚀宽平台并在崖前截断的薄层旧滩沉积", "#bcb391", bottom.map(point => ({ ...point, y: point.y + .014 })), bottom, 17));
  }
  const cover = combineMeshes("古海蚀平台上相互分开的旧滩沉积薄盖层", "#bcb391", deposits);
  cover.scale = { x: factor, y: factor, z: factor };
  return [closedRelief("连续岸体内的宽缓古海蚀平台、古海蚀崖和岸脚现代磨蚀平台", "#929c8c", rows, factor), cover];
}

function playaLunette(): ModelPart[] {
  const factor = 80;
  const rows: Triple[][] = Array.from({ length: 15 }, (_, row) => Array.from({ length: 17 }, (_, column) => {
    const x = (column - 8) / 8 * 3, z = (row - 7) / 7 * 2.4, radius = Math.hypot(x / 2.1, z / 1.5);
    const closedRim = .05 * Math.min(1, Math.max(0, (radius * radius - .65) / .45));
    const lee = Math.max(0, Math.min(1, (x / 2.1 + .1) / .55));
    const lunette = .12 * Math.exp(-(((radius - 1.08) / .23) ** 2)) * lee;
    return [x, .025 + closedRim + lunette, z];
  }));
  const floor = polygon("闭合干湖盆最低处裸露的平坦细泥湖床", "#c5bda2", Array.from({ length: 24 }, (_, index) => {
    const angle = index / 24 * Math.PI * 2;
    return [Math.cos(angle) * 1.22, Math.sin(angle) * .86] as [number, number];
  }), .0025, [0, .024, 0]);
  floor.scale = { x: factor, y: factor, z: factor };
  floor.position.y *= factor;
  return [closedRelief("平坦闭合风蚀干湖盆与仅沿下风半岸连续堆积的月形岸丘", "#b4ae8e", rows, factor), floor];
}

export const coastalAeolianLandformExpansionBatchThreeDesigns: MasterNatureDesign[] = [
  design("barrierTidalInletDoubleShoals", "障壁口门双侧潮汐沙洲", "岩石", tidalInlet, ["Tidal inlet", "障壁沙岸间的贯通低主槽", "潟湖侧涨潮沙洲与外海侧落潮沙洲", "完整海岸沉积地貌"]),
  design("upliftedWaveCutMarineTerraces", "抬升海蚀阶地岸", "岩石", marineTerraces, ["Marine terraces", "宽缓古海蚀平台与古海蚀崖", "实际贴覆旧平台的薄层滩沉积", "岸脚现代磨蚀平台"]),
  design("closedPlayaBasinLeeLunette", "干湖盆下风月形岸丘", "岩石", playaLunette, ["Playa and lunette", "真实闭合低洼平坦干湖盆", "仅沿下风半湖岸的连续岸丘", "岸丘曲率遵循湖盆边界"]),
];
