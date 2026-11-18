import { combineMeshes, design, type MasterNatureDesign, type ModelPart } from "./shared";
import { closedGrid } from "./geologicStructureExpansionBatchSix";

type IcePoint = { x: number; y: number; z: number };

// 陡谷床上的连续冰川、上层脆性裂冰与冰塔：
// https://www.nps.gov/glba/learn/nature/anatomy-of-a-glacier.htm
// https://pubs.usgs.gov/of/2004/1216/i/i.html
// 原创米制静态地貌；不把针锥列或孤立冰崖当作完整冰川冰瀑。

export function sampleGrid(points: IcePoint[], columns: number, x: number, z: number): number {
  // ACT: 固定小网格逐三角形取真实平面高度，最多255点；本模型不为几百次采样建立空间索引。
  for (let row = 0; row < points.length / columns - 1; row++) for (let column = 0; column < columns - 1; column++) {
    const offset = row * columns + column;
    for (const triangle of [[offset, offset + columns, offset + 1], [offset + 1, offset + columns, offset + columns + 1]]) {
      const a = points[triangle[0]!]!, b = points[triangle[1]!]!, c = points[triangle[2]!]!;
      const denominator = (b.z - c.z) * (a.x - c.x) + (c.x - b.x) * (a.z - c.z);
      const wa = ((b.z - c.z) * (x - c.x) + (c.x - b.x) * (z - c.z)) / denominator;
      const wb = ((c.z - a.z) * (x - c.x) + (a.x - c.x) * (z - c.z)) / denominator, wc = 1 - wa - wb;
      if (wa >= -1e-8 && wb >= -1e-8 && wc >= -1e-8) return a.y * wa + b.y * wb + c.y * wc;
    }
  }
  throw new Error("冰川面采样超出定义网格");
}

function valleyIcefall(): ModelPart[] {
  const rock = "#909d96", baseIce = "#8fb7b6", glacier = "#b7d0c9", tower = "#a9c8c5", snow = "#d6e1d8";
  const bed: IcePoint[] = [];
  for (let row = 0; row < 15; row++) for (let column = 0; column < 17; column++) {
    const x = (column - 8) / 8 * 3, z = -5 + row / 14 * 10;
    const steepStep = .55 + 3.25 / (1 + Math.exp(z * 1.2)) - .07 * z;
    const valleyWall = 1.6 * Math.max(0, (Math.abs(x) - 1.05) / 1.95) ** 1.4;
    bed.push({ x, y: steepStep + valleyWall + .035 * Math.sin(z * 1.6) * Math.abs(x) / 3, z });
  }
  const basalTop: IcePoint[] = [], basalBottom: IcePoint[] = [];
  const iceColumns = [-1.35, -1.125, -.75, -.375, 0, .375, .75, 1.125, 1.35];
  const iceRows = Array.from({ length: 15 }, (_, row) => -5 + row / 14 * 10);
  for (let row = 0; row < 15; row++) for (let column = 0; column < iceColumns.length; column++) {
    const x = iceColumns[column]!, z = iceRows[row]!, ground = sampleGrid(bed, 17, x, z);
    basalTop.push({ x, y: ground + .22 + .08 * (1 - Math.abs(x) / 1.35), z });
    basalBottom.push({ x, y: ground - .04, z });
  }
  const parts: ModelPart[] = [closedGrid("承托冰瀑且具有真实陡坎落差的连续岩质槽谷", rock, bed, bed.map(point => ({ ...point, y: -.08 })), 17),
    closedGrid("沿谷床连续下倾并连接所有裂冰根部的基础冰体", baseIce, basalTop, basalBottom, 9)];
  const tongues: ModelPart[] = [];
  for (const upper of [true, false]) {
    const z0 = upper ? -5 : 1.8, z1 = upper ? -1.6 : 5, top: IcePoint[] = [], bottom: IcePoint[] = [];
    const rows = [z0, ...iceRows.filter(z => z > z0 + 1e-9 && z < z1 - 1e-9), z1];
    for (const z of rows) for (const x of iceColumns) {
      const base = sampleGrid(basalTop, 9, x, z);
      const thickness = .12 + (upper ? .65 : .49) * (1 - (Math.abs(x) / 1.35) ** 1.5);
      bottom.push({ x, y: base - .04, z });
      top.push({ x, y: base + thickness + .025 * Math.cos(z * 2.1) * (1 - Math.abs(x) / 1.35), z });
    }
    tongues.push(closedGrid(upper ? "陡降前沿宽谷床连续进入冰瀑的上游冰舌" : "裂冰落差段之后重新连续汇合的下游冰舌", glacier, top, bottom, iceColumns.length));
  }
  parts.push(combineMeshes("冰瀑上下游与下伏基础冰体实接的两段完整冰舌", glacier, tongues));
  const blocks: ModelPart[] = [], caps: ModelPart[] = [];
  for (let row = 0; row < 6; row++) for (let column = 0; column < 4; column++) {
    const x0 = -1.35 + column * .675 + (column === 0 ? 0 : .025), x1 = -1.35 + (column + 1) * .675 - (column === 3 ? 0 : .025);
    const z0 = -1.6 + row * 3.4 / 6 + .04, z1 = -1.6 + (row + 1) * 3.4 / 6 - .04;
    // 沿基础冰面的既有折线分块，底面不跨过未采样折角，避免片面之间悬空。
    const xs = [x0, ...iceColumns.filter(x => x > x0 + 1e-9 && x < x1 - 1e-9), x1], zs = [z0, ...iceRows.filter(z => z > z0 + 1e-9 && z < z1 - 1e-9), z1];
    const bottom: IcePoint[] = [], top: IcePoint[] = [], capBottom: IcePoint[] = [], capTop: IcePoint[] = [];
    for (const z of zs) for (const x of xs) {
      const u = (x - x0) / (x1 - x0), v = (z - z0) / (z1 - z0), base = sampleGrid(basalTop, 9, x, z);
      const height = .49 + .19 * (.5 + .5 * Math.sin(row * 1.7 + column * 2.2)) + .12 * Math.sin(row + column * 1.9) * (u - .5) + .13 * Math.cos(row * 1.3 - column) * (v - .5);
      const brokenCap = .055 * Math.sin((row + column) * 1.7 + u * Math.PI) * (v < .5 ? .6 : 1);
      const surface = base + height + brokenCap;
      bottom.push({ x, y: base - .04, z }); top.push({ x, y: surface, z });
      capBottom.push({ x, y: surface - .018, z }); capTop.push({ x, y: surface + .009, z });
    }
    blocks.push(closedGrid("陡坡伸展造成的带棱角断裂顶面的完整冰塔块", tower, top, bottom, xs.length));
    caps.push(closedGrid("贴合断裂冰塔顶面而不跨越裂缝的薄积雪", snow, capTop, capBottom, xs.length));
  }
  parts.push(combineMeshes("伸展段由深横裂缝和纵裂缝真正分开的冰塔群", tower, blocks), combineMeshes("各冰塔顶部相接且保留全部开裂通道的雪层", snow, caps));
  for (const item of parts) item.scale = { x: 40, y: 40, z: 40 };
  return parts;
}

export const glacialIcefallExpansionBatchOneDesigns: MasterNatureDesign[] = [
  design("steepValleyGlacierIcefall", "陡谷冰川冰瀑落差段", "岩石", valleyIcefall, ["Icefall", "上游冰舌沿高落差谷床下降", "真实横纵裂缝与断顶冰塔", "下伏连续冰体接入下游冰舌"]),
];
