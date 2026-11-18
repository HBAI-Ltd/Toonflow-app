import { design, type MasterNatureDesign, type ModelPart, type Triple } from "./shared";
import { closedRelief } from "./landformShells";

// 只依据地学机构对完整地貌的说明原创网格；不包含下载高程、地图、贴图或海面。
// 星状沙丘： https://www.nps.gov/grsa/learn/nature/dune-types.htm
// https://pubs.usgs.gov/gip/deserts/dunes/
// 单端接岸沙嘴与保护性背湾： https://www.nps.gov/articles/sandy-coast-landforms.htm
// 回钩沙嘴： https://pubs.usgs.gov/gip/7000013/report.pdf
// 一个固定星状丘、一个完整单端回钩海岸；不按臂数、方向、尺寸或颜色扩主。

function starDune(): ModelPart[] {
  const directions = [[.14, 2.5], [1.43, 2.2], [2.63, 2.35], [3.88, 2.1], [5.2, 2.3]];
  const rows: Triple[][] = Array.from({ length: 15 }, (_, row) => Array.from({ length: 17 }, (_, column) => {
    const x = (column - 8) / 8 * 2.65, z = (row - 7) / 7 * 2.55;
    let height = 0;
    for (const [angle, length] of directions) {
      const along = x * Math.cos(angle!) + z * Math.sin(angle!), across = -x * Math.sin(angle!) + z * Math.cos(angle!);
      const curvedAcross = across - .025 * Math.sin(along * 1.1) * along;
      const flank = curvedAcross >= 0 ? curvedAcross * .49 : -curvedAcross * .21;
      const longitudinal = along >= 0 ? .7 * along / length! : -.38 * along;
      height = Math.max(height, .7 - longitudinal - flank);
    }
    return [x, .025 + height * 1.25, z];
  }));
  return [closedRelief("同一中央高峰连续连出多向沙脊及多组陡缓滑移面的完整星状沙丘", "#c1ad83", rows, 40)];
}

function recurvedCoastalSpit(): ModelPart[] {
  const factor = 40;
  const bed: Triple[][] = Array.from({ length: 11 }, (_, row) => Array.from({ length: 13 }, (_, column) => {
    const x = -2.78 + column / 12 * 5.04, z = -2.05 + row / 10 * 4.1;
    const protectedBay = Math.exp(-(((x + .35) / .95) ** 2 + ((z + .05) / .85) ** 2));
    return [x, .006 + .014 * protectedBay, z];
  }));
  const shore: Triple[][] = Array.from({ length: 15 }, (_, row) => Array.from({ length: 9 }, (_, column) => {
    const t = column / 8, z = -2.04 + row / 14 * 4.08, shift = .075 * Math.sin(z * 1.1) + .025 * Math.sin(z * 2.3);
    const x = -2.69 + t * 1.2 + shift;
    return [x, .015 + .3 * (1 - t) ** 1.15 + .012 * Math.sin(z * 1.6) * (1 - t), z];
  }));
  const path: [number, number][] = [[-2.32, -1.26], [-1.9, -1.31], [-1.25, -1.32], [-.85, -1.32], [-.45, -1.3], [-.05, -1.25], [.34, -1.15], [.71, -.97], [1.01, -.73], [1.25, -.43], [1.4, -.06], [1.4, .33], [1.22, .67], [.91, .91], [.54, 1.02], [.2, .98], [-.04, .78]];
  const spit: Triple[][] = path.map(([x, z], row) => {
    const before = path[Math.max(0, row - 1)]!, after = path[Math.min(path.length - 1, row + 1)]!, dx = after[0] - before[0], dz = after[1] - before[1], length = Math.hypot(dx, dz);
    const width = row < 3 ? .35 : row > 13 ? .28 * (1 - (row - 13) / 4) + .03 : .33;
    const crest = .115 * (width / .35) ** .8;
    return Array.from({ length: 9 }, (_, column) => {
      const t = (column - 4) / 4;
      return [x + dz / length * width * t, .018 + crest * (1 - Math.abs(t) ** 1.45), z - dx / length * width * t];
    });
  });
  return [
    closedRelief("回钩沙脊内侧保留通海湾口的受保护浅湾沉积床", "#9fa38a", bed, factor),
    closedRelief("回钩沙嘴近端实际接合且沿岸连续的陆岸坡体", "#b5ac8a", shore, factor),
    closedRelief("一端埋入陆岸而末端游离回转的连续变宽沙质海岸脊", "#c5b18a", spit, factor),
  ];
}

export const coastalAeolianLandformExpansionBatchOneDesigns: MasterNatureDesign[] = [
  design("multidirectionalStarDune", "多向脊星状沙丘", "岩石", starDune, ["Star dune", "中央高峰与多向下降主脊", "多组真实陡缓沙坡", "约200米级风成地貌"]),
  design("recurvedCoastalSpitBay", "回钩海岸沙嘴与背湾", "岩石", recurvedCoastalSpit, ["Recurved spit", "单端接岸与游离回钩端", "沙脊保护的真实浅湾床", "湾口保持通海"]),
];
