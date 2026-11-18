import { design, part, polygon } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";

const sediment = "#a7ac8c";
const sandstone = "#b5ab8e";
const bedrock = "#909c8c";

export function closedRelief(name: string, color: string, rows: Triple[][], factor: number): ModelPart {
  const width = rows[0]!.length, count = rows.length * width;
  const vertices = rows.flat().map(([x, y, z]) => ({ x, y, z }));
  vertices.push(...rows.flat().map(([x, , z]) => ({ x, y: -0.06, z })));
  const front: number[] = [];
  for (let row = 0; row < rows.length - 1; row++) for (let col = 0; col < width - 1; col++) {
    const a = row * width + col, b = a + 1, c = a + width, d = c + 1;
    front.push(a, c, b, b, c, d);
  }
  const indices = [...front], edges = new Map<string, [number, number]>();
  for (let i = 0; i < front.length; i += 3) {
    const triangle = front.slice(i, i + 3);
    indices.push(triangle[2]! + count, triangle[1]! + count, triangle[0]! + count);
    for (let edge = 0; edge < 3; edge++) {
      const a = triangle[edge]!, b = triangle[(edge + 1) % 3]!;
      if (!edges.delete(`${b},${a}`)) edges.set(`${a},${b}`, [a, b]);
    }
  }
  for (const [a, b] of edges.values()) indices.push(a, b + count, b, a, a + count, b + count);
  return part(name, "mesh", color, [0, 0, 0], [factor, factor, factor], [0, 0, 0], { vertices, indices });
}

function drumlin(): ModelPart[] {
  const widths = [0.05, 0.9, 1.55, 1.75, 1.6, 1.4, 1.15, 0.95, 0.75, 0.55, 0.4, 0.2, 0.05];
  const heights = [0.07, 0.8, 1.7, 2.1, 1.85, 1.5, 1.1, 0.8, 0.55, 0.35, 0.2, 0.12, 0.07];
  const rows: Triple[][] = widths.map((width, row) => Array.from({ length: 9 }, (_, col) => {
    const t = (col - 4) / 4;
    return [t * width, 0.025 + heights[row]! * Math.sqrt(1 - t * t), row - 5];
  }));
  return [closedRelief("冰碛鼓丘迎冰端浑圆高陡而背冰端逐渐收长的连续流线体", sediment, rows, 20)];
}

function alluvialFan(): ModelPart[] {
  const rows: Triple[][] = Array.from({ length: 13 }, (_, row) => Array.from({ length: 17 }, (_, col) => {
    const radius = 0.18 + row * 0.55, angle = (col - 8) * 0.1125;
    const grooves = [-0.48, 0, 0.43].reduce((sum, a) => sum + Math.exp(-(((angle - a - Math.sin(radius) * 0.025) / 0.035) ** 2)), 0);
    const y = 0.08 + 1.25 * (1 - radius / 7) ** 1.3 - grooves * 0.085 * Math.sin(row / 12 * Math.PI);
    return [Math.sin(angle) * radius, y, Math.cos(angle) * radius - 4.4];
  }));
  return [closedRelief("冲积扇自沟口向外放射变缓且具有真实下切分流沟的沉积扇体", sandstone, rows, 10)];
}

function hogback(): ModelPart[] {
  return [
    part("单斜猪背岭下部被剥蚀的较软围岩", "extrude", bedrock, [0, 0, 0], [20, 20, 20], [0, 0, 0], { depth: 7, profile: [{ x: -3, y: 0 }, { x: -0.8, y: 1.5 }, { x: 0.15, y: 2.6 }, { x: 0.72, y: 3.12 }, { x: 0.9, y: 3.12 }, { x: 1.95, y: 0 }] }),
    part("猪背岭陡倾硬砂岩层实际露出的锐脊与整层斜背面", "extrude", sandstone, [0, 0, 0], [20, 20, 20], [0, 0, 0], { depth: 7.06, profile: [{ x: -2, y: 0 }, { x: 0.85, y: 3.42 }, { x: 1.1, y: 3.42 }, { x: -1.75, y: 0 }] }),
  ];
}

function mesa(): ModelPart[] {
  const outline: [number, number][] = [[-2.4, -1.7], [-0.8, -2.1], [1.8, -1.9], [2.5, -0.6], [2.1, 1.5], [0.7, 1.9], [-1.8, 1.8], [-2.6, 0.3]];
  const layers = [
    { y: 0, h: 0.65, radius: 1.18, color: bedrock },
    { y: 0.62, h: 0.74, radius: 1.05, color: sediment },
    { y: 1.33, h: 0.7, radius: 1, color: sandstone },
    { y: 2, h: 0.64, radius: 0.97, color: sediment },
    { y: 2.6, h: 0.32, radius: 1.03, color: sandstone },
  ];
  return layers.map(layer => {
    const value = polygon("台状方山平坦耐蚀盖层与近竖直层状崖面", layer.color, outline.map(([x, z]) => [x * layer.radius, z * layer.radius]), layer.h, [0, layer.y, 0]);
    value.scale = { x: 15, y: 15, z: 15 };
    value.position.y *= 15;
    return value;
  });
}

function tombolo(): ModelPart[] {
  const widths = [1.5, 1.2, 0.6, 0.22, 0.18, 0.2, 0.4, 0.7, 1, 1.1, 0.7];
  const heights = [1.2, 0.8, 0.38, 0.16, 0.13, 0.15, 0.2, 0.5, 0.8, 1, 0.4];
  const rows: Triple[][] = widths.map((width, row) => Array.from({ length: 9 }, (_, col) => {
    const t = (col - 4) / 4, shift = Math.sin(row / 10 * Math.PI) * 0.3;
    return [shift + t * width, 0.03 + heights[row]! * Math.sqrt(1 - t * t), row - 5];
  }));
  return [closedRelief("连岛沙坝由窄低沉积颈连续连接离岸岛体和较宽陆岸的真实体积", sandstone, rows, 20)];
}

function cirque(): ModelPart[] {
  const radial = [[1.2, 0.1], [2, 0.2], [2.5, 0.7], [2.8, 1.6], [3, 2.9], [3.4, 3.2], [4, 1.5]];
  const rows: Triple[][] = radial.map(([radius, height]) => Array.from({ length: 25 }, (_, col) => {
    const angle = col / 24 * Math.PI;
    return [-Math.cos(angle) * radius!, 0.05 + height! * (0.25 + Math.sin(angle) * 0.75), Math.sin(angle) * radius!];
  }));
  const floor: [number, number][] = Array.from({ length: 17 }, (_, col) => { const angle = col / 16 * Math.PI; return [-Math.cos(angle) * 1.45, Math.sin(angle) * 1.45]; });
  const base = polygon("冰斗内被过深挖蚀而保持前端敞开的半圆形岩床", bedrock, floor, 0.12);
  base.scale = { x: 50, y: 50, z: 50 };
  return [closedRelief("冰斗半环陡峭后壁和两侧山脊环抱真实空盆而向谷口敞开", bedrock, rows, 50), base];
}

// 仅借地学机构形态说明校准构造；全部网格为本地原创，不含下载地形或纹理。
// https://gq.mines.gouv.qc.ca/quaternaire_en/drumlin-et-drumlinoide_en/
// https://www.nps.gov/subjects/erosion/erosion.htm
// https://www.nps.gov/romo/dakota_hogback.htm
// https://www.nps.gov/meve/learn/nature/geology.htm
// https://www.nps.gov/articles/sandy-coast-landforms.htm
// https://www.nps.gov/subjects/geology/glacial-landforms.htm
export const landformShellDesigns: MasterNatureDesign[] = [
  design("tillDrumlin", "冰碛鼓丘", "岩石", drumlin, ["Drumlin", "迎冰陡圆端与延长渐细的沉积尾"]),
  design("alluvialFan", "沟口冲积扇", "岩石", alluvialFan, ["Alluvial fan", "放射沉积坡与真实分流沟"]),
  design("inclinedHogback", "单斜猪背岭", "岩石", hogback, ["Hogback ridge", "陡倾耐蚀层锐脊与软围岩坡"]),
  design("caprockMesa", "台状方山", "岩石", mesa, ["Mesa", "平坦硬盖层及分层陡崖"]),
  design("coastalTombolo", "连岛沙坝", "岩石", tombolo, ["Tombolo", "狭低沉积颈真正连续连接岸岛"]),
  design("glacialCirque", "冰川冰斗", "岩石", cirque, ["Cirque", "环抱式陡后壁与前方敞开的凹盆"]),
];
