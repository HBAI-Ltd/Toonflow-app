import { part, ring, type ModelPart, type Triple } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { box, cylinder, design, rail, colors } from "./structures";
import { halfRoundWall } from "./spatialShells";
import { arcDeck, doorway, standingPanel } from "./publicSpaceBatchOne";
import { stairFlight } from "./publicSpaceBatchTwo";
import { bankedTrack, type TrackSample } from "./publicSpaceBatchFive";

const stone = "#b9b7a7", wood = "#ac936c", dark = "#52676a";
export type SolidBox = { center: Triple; size: Triple };
export { standingPanel };

export const publicSpaceBatchEightDesigns = [
  design("交织双螺旋阅览馆", "两条相位错开的连续阅览坡道绕中央通高空间上升，外侧书墙沿坡分布，内外扶栏随坡抬高，弧形窗带与双向地面入口围合完整阅览馆", helicalLibrary, "建筑", "现代"),
  design("连续折板中庭展览馆", "不对称连续折板壳从地面斜起形成高低屋面，前后异形窗实际穿透端墙，L形高位画廊通过有楼板洞口的连续阶梯连接底层展厅", foldedExhibitionHall, "建筑", "现代"),
  design("下沉光庭公共礼堂", "高位环形公共坪围住下沉礼堂与一圈开敞光庭，入口桥跨过光庭接向径向下行阶梯，弧形阶席与上层环廊保留同轴通行缺口", sunkenAuditorium, "建筑", "现代"),
];

// 同材质书架板、书脊和扶栏立杆合并，硬面各用独立顶点，单网格保持在512顶点以内。
export function boxesMesh(name: string, color: string, boxes: SolidBox[], position: Triple = [0, 0, 0], yaw = 0): ModelPart {
  const vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
  const corners = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]];
  const faces = [[0, 3, 2, 1], [4, 5, 6, 7], [0, 4, 7, 3], [1, 2, 6, 5], [0, 1, 5, 4], [3, 7, 6, 2]], angle = yaw * Math.PI / 180;
  for (const b of boxes) for (const face of faces) {
    const start = vertices.length;
    for (const index of face) {
      const c = corners[index]!, x = b.center[0] + c[0]! * b.size[0] / 2, y = b.center[1] + c[1]! * b.size[1] / 2, z = b.center[2] + c[2]! * b.size[2] / 2;
      vertices.push({ x: position[0] + x * Math.cos(angle) + z * Math.sin(angle), y: position[1] + y, z: position[2] - x * Math.sin(angle) + z * Math.cos(angle) });
    }
    indices.push(start, start + 1, start + 2, start, start + 2, start + 3);
  }
  return part(name, "mesh", color, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

function helicalLibrary(): ModelPart[] {
  const p: ModelPart[] = [cylinder("圆形阅览馆完整落地基础", 0, .15, 0, 26, .3, stone), cylinder("通高阅览空间完整圆屋盖", 0, 12.95, 0, 24.8, .3, dark)];
  for (const start of [15, 195]) {
    p.push(halfRoundWall("圆厅弧形实心窗下墙", 12, .25, 2.3, [0, .3, 0], -start, stone, Math.PI * 5 / 6), halfRoundWall("圆厅弧形高位封顶墙", 12, .25, 2, [0, 10.8, 0], -start, stone, Math.PI * 5 / 6));
    const glass = halfRoundWall("沿两条阅览坡道的连续透明窗带", 11.98, .05, 8.2, [0, 2.6, 0], -start, colors.glass, Math.PI * 5 / 6); glass.opacity = .25; p.push(glass);
  }
  for (const side of [-1, 1]) p.push(doorway("双螺旋各自到达的地面入口", [side * 12 * Math.cos(Math.PI / 12), .3, 0], 6.22, 12.5, 2.6, 90, 2.5));
  for (const phase of [0, Math.PI]) {
    const posts: SolidBox[] = [];
    for (let section = 0; section < 4; section++) {
      const angle = phase + section * Math.PI, y = .3 + section * 2.4;
      p.push({ ...arcDeck("连续半圈升高二点四米的阅览坡道", [0, y, 0], 8, 11, Math.PI, 2.4, 0, angle), color: wood });
      for (const radius of [8, 10.94]) {
        const samples: TrackSample[] = Array.from({ length: 25 }, (_, index) => {
          const a = angle + index / 24 * Math.PI, floor = y + index / 24 * 2.4;
          return { x: Math.cos(a) * radius, z: Math.sin(a) * radius, nx: Math.cos(a), nz: Math.sin(a), bank: 0, height: floor + 1.1, base: floor + 1.04 };
        });
        p.push({ ...bankedTrack("内外缘随阅览坡道连续抬高的扶栏", samples, .06), color: dark });
        for (let index = 0; index < 3; index++) {
          const a = angle + index / 3 * Math.PI, floor = y + index / 3 * 2.4;
          posts.push({ center: [Math.cos(a) * (radius + .03), floor + .525, Math.sin(a) * (radius + .03)], size: [.06, 1.05, .06] });
        }
      }
    }
    for (let start = 0; start < posts.length; start += 12) p.push(boxesMesh("双螺旋坡道内外缘独立落地栏杆立柱", dark, posts.slice(start, start + 12)));
  }
  for (let index = 0; index < 12; index++) {
    const a = (index + .5) * Math.PI / 3, height = .3 + a / (Math.PI * 2) * 4.8;
    const boards: SolidBox[] = [{ center: [-.58, .85, 0], size: [.05, 1.7, .32] }, { center: [.58, .85, 0], size: [.05, 1.7, .32] }];
    for (const y of [.035, .435, .835, 1.235, 1.665]) boards.push({ center: [0, y, 0], size: [1.16, .07, .32] });
    const books: SolidBox[] = [];
    for (let row = 0; row < 3; row++) for (let column = 0; column < 6; column++) books.push({ center: [-.47 + column * .18, .235 + row * .4, -.035], size: [.13, .3, .22] });
    const position: Triple = [Math.cos(a) * 10.55, height, Math.sin(a) * 10.55], yaw = 90 - a * 180 / Math.PI;
    p.push(boxesMesh("沿上升阅览路线布置的真实开格木书架", wood, boards, position, yaw), boxesMesh("独立分层排列且留有空隙的书脊", "#8c9d91", books, position, yaw));
  }
  p.push(cylinder("中央公共阅览桌面", 0, 1.1, 0, 5, .15, wood), cylinder("中央阅览桌承重支座", 0, .66, 0, 1.3, .72, dark));
  return p;
}

function foldedExhibitionHall(): ModelPart[] {
  const shell: [number, number][] = [[-21, .3], [-12, 11.8], [3, 11.8], [20, 6], [20, .3], [19.75, .3], [19.75, 5.82], [2.95, 11.55], [-11.88, 11.55], [-20.75, .3]];
  const front: [number, number][] = [[-21, .3], [-12, 11.8], [3, 11.8], [20, 6], [20, .3], [9.5, .3], [9.5, 3], [6.5, 3], [6.5, .3]];
  const window: [number, number][] = [[-14, 4], [-10, 10], [2, 10], [14, 6], [14, 4]];
  const gallery: [number, number][] = [[-10, -12], [16, -12], [16, 13], [10, 13], [10, -6], [-10, -6]];
  const p: ModelPart[] = [box("折板展馆完整落地场坪", 0, .15, 0, 44, .3, 38, stone), part("从侧墙连续折转到高低屋面的实体折板壳", "extrude", dark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { depth: 36, profile: shell.map(([x, y]) => ({ x, y })) }), polygon("绕中庭延伸且保留楼梯井的L形高位画廊", wood, gallery, .25, [0, 4.3, 0], [[[12, 3.9], [14, 3.9], [14, 11.5], [12, 11.5]]])];
  for (const z of [-18, 18]) {
    p.push(standingPanel("折板壳端部带真正门窗孔的完整立面", stone, front, [window], z, .24));
    const glass = standingPanel("异形端窗孔内独立透明窗板", colors.glass, window, [], z, .05); glass.opacity = .25; p.push(glass);
  }
  for (const [x, z] of [[-9, -9], [3, -9], [15, -9], [13, 12]]) p.push(cylinder("避开中庭和楼梯井的画廊承重柱", x!, 2.3, z!, .28, 4, dark));
  for (let flight = 0; flight < 3; flight++) p.push(stairFlight("穿过画廊真实洞口的连续上行观展阶梯", 13, .3 + flight * 4.25 / 3, 4.1 + flight * 2.4, 1.8, 8, 4.25 / 24, .3));
  p.push(box("楼梯高端跨接到洞口之外的实际平台", 13, 4.425, 11.55, 2, .25, .5, wood), rail([-10, 5.65, -6], [10, 5.65, -6], .06, dark), rail([10, 5.65, -6], [10, 5.65, 13], .06, dark));
  for (const x of [-10, 0, 10]) p.push(rail([x, 4.55, -6], [x, 5.65, -6], .06, dark));
  for (const z of [0, 6, 13]) p.push(rail([10, 4.55, z], [10, 5.65, z], .06, dark));
  p.push(box("底层独立长形展示基座", -7, .65, 4, 8, .7, 3, "#9da497"), box("与长基座分开的方形作品展台", 4, .9, -1, 2.8, 1.2, 2.8, "#9da497"));
  return p;
}

function sunkenAuditorium(): ModelPart[] {
  const p: ModelPart[] = [cylinder("礼堂及高位公共坪共同的落地基础", 0, .1, 0, 44, .2, stone), ring("内侧留出整圈采光沟的高位实体公共坪", stone, 21, 8, 2.6, 4.8), cylinder("低位公共礼堂完整屋盖", 0, 7.95, 0, 22.6, .3, dark), halfRoundWall("环形光庭内侧礼堂实心窗下墙", 11, .25, 1, [0, .2, 0], -15, stone, Math.PI * 11 / 6), halfRoundWall("高窗上方闭合到圆屋面的实心墙楣", 11, .25, 1, [0, 6.8, 0], -15, stone, Math.PI * 11 / 6), halfRoundWall("上层环廊在入口轴线留出真实阶梯缺口", 11, 1.2, .2, [0, 4.8, 0], -15, wood, Math.PI * 11 / 6)];
  const glass = halfRoundWall("光庭和下沉礼堂之间的整圈透明高窗", 10.98, .05, 5.6, [0, 1.2, 0], -15, colors.glass, Math.PI * 11 / 6); glass.opacity = .25; p.push(glass);
  const front = 11 * Math.cos(Math.PI / 12), bridgeEnd = 13 - Math.tan(Math.PI / 24) * 1.2;
  const bridgeWall = standingPanel("承托桥底并给入口桥厚留出真实浅槽的前墙", stone, [[-2.85, .2], [2.85, .2], [2.85, 5], [1.2, 5], [1.2, 4.8], [-1.2, 4.8], [-1.2, 5], [-2.85, 5]], [], 0, .25); bridgeWall.position.x = front; bridgeWall.rotation.y = 90;
  // 入口桥末端贴住公共环坪二十四分段内缘的实际弦线，两片地面不覆盖。
  p.push(bridgeWall, doorway("高位公共坪进入礼堂的实际门洞", [front, 5, 0], 5.7, 2.8, 2.6, 90, 2.5), polygon("径向阶梯与公共环坪之间没有叠板的完整入口桥", wood, [[10.6, -1.2], [bridgeEnd, -1.2], [13, 0], [bridgeEnd, 1.2], [10.6, 1.2]], .2, [0, 4.8, 0]));
  for (let flight = 0; flight < 2; flight++) {
    const stair = stairFlight("从环形公共坪实际下行到礼堂的径向阶梯", 0, .2 + flight * 2.4, 0, 2.4, 12, .2, .25);
    stair.vertices = stair.vertices!.map(v => ({ x: 4.6 + flight * 3 + v.z, y: v.y, z: -v.x })); p.push(stair);
  }
  for (let row = 0; row < 4; row++) p.push(halfRoundWall("面向中央讲台且保留径向通道的弧形观众阶席", 5.5 + row * 1.2, 1, .7 * (row + 1), [0, .2, 0], -30, "#a5a68e", Math.PI * 5 / 3));
  p.push(cylinder("下沉空间中央公共演讲圆台", 0, .45, 0, 5, .5, wood));
  for (const z of [-1.2, 1.2]) p.push(rail([10.6, 6.1, z], [13.8, 6.1, z], .06, dark), rail([13.6, 5, z], [13.6, 6.1, z], .06, dark));
  return p;
}
