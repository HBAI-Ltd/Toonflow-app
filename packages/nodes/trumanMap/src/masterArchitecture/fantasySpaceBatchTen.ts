import { type ModelPart, type Triple } from "../assetModelParts";
import { combineMeshes } from "../natureParts";
import { design } from "./structures";
import { slopePanel } from "./vernacularWorldBatchOne";
import { meshBeam } from "./vernacularWorldBatchFive";
import { hardFloor } from "./vernacularWorldBatchSix";

const stone = "#a5ae9b", shell = "#b7bda5", bone = "#798d7f", wood = "#9b8a69";

function starBellyCourt(): ModelPart[] {
  const point = (r: number, angle: number): [number, number] => [Math.cos(angle) * r, Math.sin(angle) * r];
  const outline = Array.from({ length: 16 }, (_, i) => point(i % 2 ? 14 : 24, i * Math.PI / 8));
  const foundation = Array.from({ length: 16 }, (_, i) => point(i % 2 ? 15 : 25, i * Math.PI / 8));
  const parts: ModelPart[] = [hardFloor("八尖凹折外廓与各尖腹居室共用的完整厚地坪", stone, foundation, .35, [0, 0, 0])], roofs: ModelPart[] = [], ribs: ModelPart[] = [], corners: ModelPart[] = [], collars: ModelPart[] = [], benches: ModelPart[] = [];
  const wall = (name: string, a: [number, number], b: [number, number], face: [number, number][], holes: [number, number][][], thickness: number, color: string): ModelPart => {
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0]) / length, uz = (b[1] - a[1]) / length, cx = (a[0] + b[0]) / 2, cz = (a[1] + b[1]) / 2;
    const value = hardFloor(name, color, face, thickness, [0, 0, 0], holes);
    value.vertices = value.vertices!.map(v => ({ x: cx + ux * v.x + uz * v.y, y: v.z, z: cz + uz * v.x - ux * v.y })); return value;
  };
  for (let i = 0; i < 16; i++) {
    const a = outline[i]!, b = outline[(i + 1) % 16]!, topA = i % 2 ? 8.5 : 6, topB = i % 2 ? 6 : 8.5, length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const hole: [number, number][] = i === 11 ? [[-1.3, .37], [1.3, .37], [1.3, 3.9], [-1.3, 3.9]] : [[-1.15, 1.5], [1.15, 1.5], [1.15, 3.8], [-1.15, 3.8]];
    parts.push(wall("星腹外立面随尖角和凹谷起伏且门窗真实透空", a, b, [[-length / 2, .35], [length / 2, .35], [length / 2, topB], [-length / 2, topA]], [hole], .35, stone));
    const innerA = point(7, i * Math.PI / 8), innerB = point(7, (i + 1) * Math.PI / 8), pa: Triple = [a[0], topA, a[1]], pb: Triple = [b[0], topB, b[1]], qa: Triple = [innerA[0], 16, innerA[1]], qb: Triple = [innerB[0], 16, innerB[1]];
    const triangles = i % 2 ? [[pa, pb, qa], [pb, qb, qa]] : [[pa, pb, qb], [pa, qb, qa]];
    for (const top of triangles) roofs.push(slopePanel("从非凸星腹边界连续收向大天窗的真实折面厚壳", top, .25, shell));
    corners.push(meshBeam("星形全部折角与外壁及主壳共同相交的落地承柱", [a[0], .35, a[1]], [a[0], topA - .12, a[1]], .6, bone));
    ribs.push(meshBeam("中央大天窗下与每片厚壳边界相接的闭合承环", [innerA[0], 15.75, innerA[1]], [innerB[0], 15.75, innerB[1]], .28, bone));
    if (i % 2) ribs.push(meshBeam("由凹谷厚承壁接到天窗承环的斜向主肋", [a[0], 8.25, a[1]], [innerA[0], 15.75, innerA[1]], .28, bone));
    const collarLength = Math.hypot(innerB[0] - innerA[0], innerB[1] - innerA[1]);
    collars.push(wall("中央贯通大天窗实际落在屋壳顶缘的厚圈壁", innerA, innerB, [[-collarLength / 2, 16], [collarLength / 2, 16], [collarLength / 2, 16.8], [-collarLength / 2, 16.8]], [], .18, bone));
    if (i === 11) {
      const ux = (b[0] - a[0]) / length, uz = (b[1] - a[1]) / length, cx = (a[0] + b[0]) / 2, cz = (a[1] + b[1]) / 2, at = (x: number, depth: number, y: number): Triple => [cx + ux * x + uz * depth, y, cz + uz * x - ux * depth];
      const steps = [slopePanel("由地面走向星腹入口的低一级踏台", [at(-1.5, 1.1, .175), at(1.5, 1.1, .175), at(1.5, 1.8, .175), at(-1.5, 1.8, .175)], .175, stone), slopePanel("连接入口及星形地坪的上一级踏台", [at(-1.5, .4, .35), at(1.5, .4, .35), at(1.5, 1.1, .35), at(-1.5, 1.1, .35)], .35, stone)];
      parts.push(combineMeshes("主入口斜向两步石级与完整地坪连续相接", stone, steps));
    }
  }
  const baseRadius = 14 * Math.cos(Math.PI / 8), halfWidth = 14 * Math.sin(Math.PI / 8), breakZ = (24 - baseRadius) / (24 - 7 * Math.cos(Math.PI / 8)) * 7 * Math.sin(Math.PI / 8), centerY = 6 + (24 - baseRadius) / 17 * 10, breakY = 6 + (24 - baseRadius) / (24 - 7 * Math.cos(Math.PI / 8)) * 10;
  for (let i = 0; i < 8; i++) {
    const angle = i * Math.PI / 4, a = point(14, angle - Math.PI / 8), b = point(14, angle + Math.PI / 8), opening: [number, number][] = [[-2, .37], [2, .37], [2, 4.1]];
    for (let step = 1; step <= 10; step++) { const theta = step * Math.PI / 10; opening.push([Math.cos(theta) * 2, 4.1 + Math.sin(theta) * 2]); }
    parts.push(wall("尖腹房腔面向通高大厅的真实高券门与承屋厚壁", a, b, [[-halfWidth, .35], [halfWidth, .35], [halfWidth, 8.27], [breakZ, breakY - .23], [0, centerY - .23], [-breakZ, breakY - .23], [-halfWidth, 8.27]], [opening], .3, stone));
    const at = (radius: number, tangent: number): Triple => [Math.cos(angle) * radius - Math.sin(angle) * tangent, .8, Math.sin(angle) * radius + Math.cos(angle) * tangent];
    benches.push(slopePanel("各尖腹独立居室内真实落地的低位长坐卧台", [at(16.8, -1.8), at(16.8, 1.8), at(19, 1.8), at(19, -1.8)], .45, wood));
  }
  for (const [name, color, pieces] of [["八向星腹一体连续折面穹盖", shell, roofs], ["天窗闭合承环及其真实接谷主肋", bone, ribs], ["全部折角与主壳墙体连接的落地承柱", bone, corners], ["真正围住开敞大天窗的完整圈壁", bone, collars], ["各尖腹房间内落地坐卧台", wood, benches]] as [string, string, ModelPart[]][]) for (let first = 0; first < pieces.length; first += 8) parts.push(combineMeshes(name, color, pieces.slice(first, first + 8)));
  const octagon = (radius: number): [number, number][] => Array.from({ length: 8 }, (_, i) => point(radius, i * Math.PI / 4));
  parts.push(hardFloor("通高大厅中央接地坪的低一级集会台", stone, octagon(4.8), .15, [0, .35, 0]), hardFloor("中央集会台上供站立的八角高一级台面", shell, octagon(4.1), .15, [0, .5, 0]));
  return parts;
}

export const fantasySpaceBatchTenDesigns = [
  design("八向星腹穹院", "八尖非凸外廓围出统一通高大厅，各尖腹居室通过高券真门向大厅敞开，连续折面厚壳由凹谷承壁和天窗承环共同支承，房内低台、外窗及斜向入口实阶保留完整动线", starBellyCourt, "建筑", "奇幻"),
];
