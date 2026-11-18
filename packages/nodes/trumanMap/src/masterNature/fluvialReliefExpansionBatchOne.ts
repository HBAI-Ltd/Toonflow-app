import { combineMeshes, design, lobe, polygon } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { closedRelief } from "./landformShells";

const sediment = "#aaa98e";
const gravel = "#a3a58d";
const bedrock = "#929d8c";

// 只取地学机构描述的构造关系；全部网格为原创米制地貌，没有水片或下载高程。
// https://www.nps.gov/articles/delta-landforms.htm
// https://home.nps.gov/articles/meandering-stream.htm
// https://eros.usgs.gov/earthshots/oxbow-lakes
// https://www.usgs.gov/geology-and-ecology-of-national-parks/geology-glacier-national-park
// https://geology.utah.gov/map-pub/survey-notes/utahs-glacial-geology/

function distributaryDelta(): ModelPart[] {
  const across = [-1, -.82, -.65, -.5, -.4, -.3, -.2, -.1, 0, .1, .2, .3, .4, .5, .65, .82, 1];
  const rows: Triple[][] = Array.from({ length: 13 }, (_, row) => across.map(u => {
    const t = row / 12, width = 1 + t * 5.8, x = u * width;
    const fork = Math.max(0, t - .25) * 4.6;
    const center = Math.sin(t * 5) * .12;
    const distance = Math.min(Math.abs(x - center), Math.abs(x + fork), Math.abs(x - fork));
    const channelWidth = .14 + t * .14;
    const channel = .28 * Math.exp(-Math.pow(distance / channelWidth, 4));
    const levee = .055 * Math.exp(-Math.pow((distance - channelWidth * 1.7) / .16, 2));
    const height = .37 + (1 - t) * .12 + levee - channel;
    const z = t * 12 - 6 - Math.pow(Math.sin(u * Math.PI * 2), 2) * Math.pow(t, 5);
    return [x, height, z];
  }));
  return [closedRelief("河口沉积三角洲的连续低地、相通分汊沟与两侧天然低堤", sediment, rows, 20)];
}

function oxbowFloodplain(): ModelPart[] {
  const outerArc: [number, number][] = Array.from({ length: 25 }, (_, index) => {
    const angle = -2.35 + index / 24 * 4.7;
    return [.9 + Math.cos(angle) * 3.05, Math.sin(angle) * 3.05];
  });
  const innerArc: [number, number][] = Array.from({ length: 25 }, (_, index) => {
    const angle = 2.35 - index / 24 * 4.7;
    return [.9 + Math.cos(angle) * 2.35, Math.sin(angle) * 2.35];
  });
  const parts = [
    polygon("主槽与旧槽下方连续相连的低位泥沙河床", "#9b9e84", [[-6, -6], [6, -6], [6, 6], [-6, 6]], .1),
    polygon("截弯后主槽西侧的完整沉积岸", sediment, [[-6, -6], [-3.4, -6], [-3.4, 6], [-6, 6]], .35, [0, .1, 0]),
    polygon("东侧平原和内洲围出真正U形封端旧槽，与主槽间保留沉积塞", sediment, [[-2.2, -6], [6, -6], [6, 6], [-2.2, 6]], .35, [0, .1, 0], [[...outerArc, ...innerArc]]),
  ];
  for (const value of parts) {
    value.scale = { x: 20, y: 20, z: 20 };
    value.position.y *= 20;
  }
  return parts;
}

function hangingTributaryValley(): ModelPart[] {
  const across = [-4.5, -4, -3.4, -2.8, -2.2, -1.65, -1.15, -.65, 0, .65, 1.15, 1.6, 1.67, 2.2, 2.9, 3.7, 4.5];
  const rows: Triple[][] = Array.from({ length: 15 }, (_, row) => across.map(x => {
    const z = (row - 7) * .85;
    const wall = Math.min(1, Math.pow(Math.max(0, Math.abs(x) - .8) / 2.8, 2));
    let height = .16 + (z + 6) * .012 + wall * 3.6;
    if (x >= 1.67 && Math.abs(z) < 2.55) {
      const tributaryWall = 1.75 * Math.min(1, Math.pow(Math.abs(z) / 2.15, 2));
      height = 1.7 + (x - 1.67) * .07 + tributaryWall;
    }
    return [x, height, z];
  }));
  return [closedRelief("高悬支谷的宽底侧壁连入主冰川槽谷并在谷口形成真实陡坎", bedrock, rows, 30)];
}

function terminalMoraine(): ModelPart[] {
  const rows: Triple[][] = Array.from({ length: 7 }, (_, row) => Array.from({ length: 25 }, (_, column) => {
    const t = row / 6, radius = 5.45 + t * 1.5, angle = .04 + column / 24 * (Math.PI - .08);
    const height = .075 + Math.pow(Math.sin(t * Math.PI), 1.2) * (.74 + Math.sin(angle) * .16) + Math.sin(angle * 4 + row) * .025;
    return [-Math.cos(angle) * radius, height, Math.sin(angle) * radius];
  }));
  const ridge = closedRelief("冰川最远端留下的弧形非层状砂砾终碛垄，内外坡接入同一沉积底", gravel, rows, 20);
  const blocks = Array.from({ length: 9 }, (_, index) => {
    const p = rows[3]![4 + index * 2]!;
    return lobe("终碛垄表面嵌入未分选沉积物的棱角漂砾", index % 2 ? bedrock : sediment, [p[0], p[1] + .02, p[2]], [.09 + index % 3 * .0175, .07, .085], [index * 8, index * 37, -index * 5]);
  });
  const scatter = combineMeshes("终碛共同沉积垄上保留的少量未分选漂砾", gravel, blocks);
  scatter.scale = { x: 20, y: 20, z: 20 };
  return [ridge, scatter];
}

export const fluvialReliefExpansionBatchOneDesigns: MasterNatureDesign[] = [
  design("distributarySedimentDelta", "河口分汊沉积三角洲", "岩石", distributaryDelta, ["River delta", "相通分汊河槽、天然低堤与低平沉积前缘"]),
  design("oxbowCutoffFloodplain", "牛轭旧槽平原", "岩石", oxbowFloodplain, ["Oxbow floodplain", "连续主河槽与两端封堵的独立U形废弃河槽"]),
  design("glacialHangingTributary", "冰川悬谷", "岩石", hangingTributaryValley, ["Hanging valley", "高悬支谷与深切主谷之间的真实谷口陡坎"]),
  design("arcuateTerminalMoraine", "弧形终碛垄", "岩石", terminalMoraine, ["Terminal moraine", "弧形未分选砂砾垄和嵌入表面的漂砾"]),
];
