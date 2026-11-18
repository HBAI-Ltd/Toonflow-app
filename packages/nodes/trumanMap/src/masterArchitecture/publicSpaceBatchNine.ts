import { part, ring, type ModelPart, type Triple } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { box, cylinder, design, rail, colors } from "./structures";
import { barrelRoof, halfRoundWall } from "./spatialShells";
import { arcDeck, doorway } from "./publicSpaceBatchOne";
import { stairFlight } from "./publicSpaceBatchTwo";

const stone = "#b8b7a8", dark = "#50686b", wood = "#ae966d";

export const publicSpaceBatchNineDesigns = [
  design("阶梯悬挑公共艺术中心", "两层错移画廊围绕同一贯通中庭悬挑，地面开放作品庭由斜撑和柱列承住上层，真实楼梯井连接两层画廊，顶置透明采光口照向完整中庭", cantileverArtCenter, "建筑", "现代"),
  design("交叉拱廊城市服务馆", "四条对向服务廊在中央交叉拱厅相接，交叉拱壳沿四条斜脊连续分合，侧面高窗与四端拱形入口围合贯通的十字公共空间", groinServiceHall, "建筑", "现代"),
  design("花瓣连廊幼儿园", "四个楔形低教室围绕中央露天庭院分布，环形有顶步廊逐一接入真实内门，外弧高窗和径向侧墙封合教室，斜向入口穿过两片教室之间", petalKindergarten, "建筑", "现代"),
];

function glazedRoomWalls(name: string, left: number, right: number, back: number, front: number, bottom: number, height: number): ModelPart[] {
  const p: ModelPart[] = [];
  for (const x of [left, right]) p.push(part(`${name}透明纵向围护`, "box", colors.glass, [x, bottom + height / 2, (front + back) / 2], [.05, height, front - back], [0, 0, 0], { opacity: .23 }));
  for (const z of [back, front]) p.push(part(`${name}透明端部围护`, "box", colors.glass, [(left + right) / 2, bottom + height / 2, z], [right - left, height, .05], [0, 0, 0], { opacity: .23 }));
  for (const x of [left, right]) for (const z of [back, front]) p.push(box(`${name}角部实际承重竖柱`, x, bottom + height / 2, z, .18, height, .18, dark));
  return p;
}

function cantileverArtCenter(): ModelPart[] {
  const court: [number, number][] = [[-5, -4], [5, -4], [5, 4], [-5, 4]], lowerStair: [number, number][] = [[7, -10.2], [9, -10.2], [9, -2.6], [7, -2.6]], upperStair: [number, number][] = [[9, -4.8], [11, -4.8], [11, 2.8], [9, 2.8]];
  const lower: [number, number][] = [[-15, -12], [13, -12], [13, 10], [-15, 10]], upper: [number, number][] = [[-8, -5], [18, -5], [18, 14], [-8, 14]];
  const p: ModelPart[] = [box("艺术中心与开放作品庭共同落地平台", 0, .15, 0, 42, .3, 36, stone), polygon("第一层错移画廊保留中庭与上行楼梯洞", wood, lower, .25, [0, 4.25, 0], [court, lowerStair]), polygon("第二层悬挑画廊保留同轴中庭与楼梯洞", wood, upper, .25, [0, 8.5, 0], [court, upperStair]), polygon("第一层画廊独立屋面让出上层楼梯井", dark, lower, .2, [0, 8.3, 0], [court, upperStair]), polygon("第二层屋面围出贯通中庭采光口", dark, upper, .2, [0, 12.25, 0], [court]), part("中庭顶端独立透明采光盖", "box", colors.glass, [0, 12.49, 0], [10.2, .05, 8.2], [0, 0, 0], { opacity: .23 }), ...glazedRoomWalls("第一层完整画廊", -15, 13, -12, 10, 4.5, 3.8), ...glazedRoomWalls("第二层完整画廊", -8, 18, -5, 14, 8.75, 3.5)];
  for (const x of [-13, 11]) for (const z of [-10, 8]) p.push(box("开放底庭边缘承住第一层的落地大柱", x, 2.275, z, .45, 3.95, .45, dark));
  for (const x of [-5.6, 12]) for (const z of [-3, 8]) p.push(box("画廊之间避开中央空腔的承重立柱", x, 6.5, z, .24, 4, .24, dark));
  for (const z of [-3, 9]) p.push(rail([12.7, 4.5, z], [17.7, 8.5, z], .35, dark));
  for (const z of [-10, 8]) p.push(rail([-13, .3, z], [-14.7, 4.25, z], .3, dark));
  for (let flight = 0; flight < 3; flight++) {
    p.push(stairFlight("开放底庭穿过第一层真洞口的观展阶梯", 8, .3 + flight * 1.4, -10 + flight * 2.4, 1.8, 8, 4.2 / 24, .3), stairFlight("由第一层穿过屋面和上层楼板的观展阶梯", 10, 4.5 + flight * 4.25 / 3, -4.6 + flight * 2.4, 1.8, 8, 4.25 / 24, .3));
  }
  p.push(box("第一层阶梯高端实际落脚平台", 8, 4.375, -2.55, 2, .25, .5, wood), box("第二层阶梯高端实际落脚平台", 10, 8.625, 2.85, 2, .25, .5, wood));
  for (const y of [4.5, 8.75]) {
    for (const x of [-5, 5]) p.push(rail([x, y + 1.1, -4], [x, y + 1.1, 4], .06, dark));
    for (const z of [-4, 4]) p.push(rail([-5, y + 1.1, z], [5, y + 1.1, z], .06, dark));
    for (const x of [-5, 5]) for (const z of [-4, 4]) p.push(rail([x, y, z], [x, y + 1.1, z], .06, dark));
  }
  p.push(cylinder("开放中庭中央的公共作品圆座", 0, .65, 0, 4, .7, "#9da38e"), box("上层侧廊独立作品展台", 14, 9.15, 8, 3, .8, 4, "#9da38e"));
  return p;
}

function groinPatch(yaw: number): ModelPart {
  const points: Triple[] = [], faces: number[][] = [], count = 8, radius = 8, spring = 3.75, thickness = .25;
  for (let row = 0; row <= count; row++) for (let index = 0; index <= row; index++) {
    const x = (2 * index - row) * radius / count, z = row * radius / count;
    points.push([x, spring + Math.sqrt(radius * radius - x * x), z]);
  }
  for (let row = 1; row <= count; row++) {
    const a = row * (row - 1) / 2, b = row * (row + 1) / 2;
    for (let index = 0; index < row; index++) faces.push([a + index, b + index, b + index + 1]);
    for (let index = 0; index < row - 1; index++) faces.push([a + index, b + index + 1, a + index + 1]);
  }
  const vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
  for (const face of faces) for (const top of [true, false]) {
    const start = vertices.length;
    for (const index of top ? face : [...face].reverse()) { const p = points[index]!; vertices.push({ x: p[0], y: p[1] + (top ? thickness : 0), z: p[2] }); }
    indices.push(start, start + 1, start + 2);
  }
  const edges: number[][] = [Array.from({ length: count + 1 }, (_, row) => row * (row + 1) / 2), Array.from({ length: count + 1 }, (_, index) => count * (count + 1) / 2 + index), Array.from({ length: count + 1 }, (_, row) => (count - row) * (count - row + 3) / 2)];
  for (const edge of edges) for (let index = 0; index < edge.length - 1; index++) {
    const a = points[edge[index]!]!, b = points[edge[index + 1]!]!, start = vertices.length;
    vertices.push({ x: a[0], y: a[1], z: a[2] }, { x: b[0], y: b[1], z: b[2] }, { x: b[0], y: b[1] + thickness, z: b[2] }, { x: a[0], y: a[1] + thickness, z: a[2] });
    indices.push(start, start + 1, start + 2, start, start + 2, start + 3);
  }
  return part("在对角脊线处拼合的四分之一交叉拱实体薄壳", "mesh", dark, [0, 0, 0], [1, 1, 1], [0, yaw, 0], { vertices, indices });
}

function groinServiceHall(): ModelPart[] {
  const outline: [number, number][] = [[-8.4, -22.4], [8.4, -22.4], [8.4, -8.4], [22.4, -8.4], [22.4, 8.4], [8.4, 8.4], [8.4, 22.4], [-8.4, 22.4], [-8.4, 8.4], [-22.4, 8.4], [-22.4, -8.4], [-8.4, -8.4]];
  const p: ModelPart[] = [polygon("四条完整公共服务臂共同的十字场坪", stone, outline, .25), ...[0, 90, 180, 270].map(groinPatch)];
  for (const yaw of [0, 90, 180, 270]) {
    const angle = yaw * Math.PI / 180, rotate = (x: number, z: number): [number, number] => [x * Math.cos(angle) + z * Math.sin(angle), -x * Math.sin(angle) + z * Math.cos(angle)];
    const [rx, rz] = rotate(0, 15), roof = barrelRoof("与中央交叉拱连续相接的服务臂筒拱", 8, .25, 14, [rx, 3.75, rz], dark); roof.rotation.y = yaw; p.push(roof);
    const [ex, ez] = rotate(0, 22); p.push(doorway("十字馆各端独立实际入口", [ex, .25, ez], 16, 3.5, 3, yaw, 2.8));
    const arch = Array.from({ length: 13 }, (_, i) => { const a = Math.PI - i * Math.PI / 12; return { x: Math.cos(a) * 8, y: Math.sin(a) * 8 }; });
    p.push(part("四端拱形高窗对筒拱端部实际封合", "extrude", colors.glass, [ex, 3.75, ez], [1, 1, 1], [0, yaw, 0], { depth: .06, profile: arch, opacity: .24 }));
    for (const side of [-1, 1]) {
      const [x, z] = rotate(side * 8, 15);
      p.push(part("服务臂两侧采光实心窗下墙", "box", stone, [x, .85, z], [.24, 1.2, 14], [0, yaw, 0]), part("服务臂侧窗孔上方闭合墙楣", "box", stone, [x, 3.45, z], [.24, .6, 14], [0, yaw, 0]), part("服务臂真实侧窗中的透明玻璃", "box", colors.glass, [x, 2.3, z], [.05, 1.7, 13.6], [0, yaw, 0], { opacity: .24 }));
      for (const end of [8.15, 21.85]) { const [px, pz] = rotate(side * 8, end); p.push(box("服务臂高窗两端实际墙柱", px, 2, pz, .3, 3.5, .3, stone)); }
      const [cx, cz] = rotate(side * 4.4, 15);
      p.push(part("各服务臂两侧留中央通道的低服务台", "box", wood, [cx, .9, cz], [2.4, 1.3, 7], [0, yaw, 0]));
    }
  }
  for (const x of [-8, 8]) for (const z of [-8, 8]) p.push(box("四条交叉拱脊实际落在中央四角柱上", x, 2, z, .55, 3.5, .55, stone));
  return p;
}

function petalKindergarten(): ModelPart[] {
  const p: ModelPart[] = [cylinder("四片教室和中央庭院共同落地园坪", 0, .1, 0, 34, .2, stone), ring("围绕露天庭院的连续有顶步廊地面", wood, 8.5, 3.5, .25, .1), ring("环廊屋面中部保留真实露天庭院", dark, 8.5, 3.5, 3.8, .2), cylinder("中央露天庭院独立绿地", 0, .215, 0, 9.7, .03, "#8c9f7d")];
  for (const center of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) {
    const start = center - 32.5 * Math.PI / 180, span = 65 * Math.PI / 180;
    const floor = arcDeck("独立楔形教室的完整实体地面", [0, .3, 0], 8.2, 15.5, span, 0, 0, start), roof = arcDeck("与环廊屋顶接合的楔形教室完整屋面", [0, 3.9, 0], 8.2, 15.5, span, 0, 0, start);
    // 五毫米实体面层错开环廊接带，底面仍贴住原墙顶与基础，避免共面闪烁。
    floor.vertices = floor.vertices!.map(v => v.y > .2 ? { ...v, y: v.y + .005 } : v);
    roof.vertices = roof.vertices!.map(v => v.y > 3.8 ? { ...v, y: v.y + .005 } : v);
    p.push({ ...floor, color: wood }, { ...roof, color: dark });
    for (const angle of [center - 32.5 * Math.PI / 180, center + 5 * Math.PI / 180]) p.push(halfRoundWall("教室朝内庭的弧墙在中部留出实际门洞", 8.5, .2, 3.4, [0, .3, 0], -angle * 180 / Math.PI, stone, 27.5 * Math.PI / 180));
    p.push(doorway("从环形步廊进入每个教室的低门洞", [Math.cos(center) * 8.4, .3, Math.sin(center) * 8.4], 1.48, 3.4, 1.3, 90 - center * 180 / Math.PI, 2.2));
    p.push(halfRoundWall("楔形教室外侧连续窗下实墙", 15.5, .2, .7, [0, .3, 0], -start * 180 / Math.PI, stone, span), halfRoundWall("楔形教室外侧窗顶实墙", 15.5, .2, .3, [0, 3.4, 0], -start * 180 / Math.PI, stone, span));
    const glass = halfRoundWall("四片教室各自朝外的弧形高窗", 15.48, .05, 2.4, [0, 1, 0], -start * 180 / Math.PI, colors.glass, span); glass.opacity = .24; p.push(glass);
    for (const a of [start, start + span]) p.push(part("从环廊外缘连到外弧窗的真实径向侧墙", "box", stone, [Math.cos(a) * 11.85, 2, Math.sin(a) * 11.85], [7.3, 3.4, .2], [0, -a * 180 / Math.PI, 0]));
    for (const a of [center - .18, center + .18]) {
      const x = Math.cos(a) * 11.5, z = Math.sin(a) * 11.5;
      p.push(cylinder("幼儿教室内部独立低圆活动桌面", x, .77, z, 1.6, .1, wood), cylinder("活动桌下实际落地支座", x, .51, z, .35, .42, dark));
    }
  }
  const angle = Math.PI / 4;
  p.push(part("从教室间隙斜向接入环廊的完整入口地面", "box", wood, [Math.cos(angle) * 12.5, .2525, Math.sin(angle) * 12.5], [8.5, .105, 2.2], [0, -45, 0]), part("斜向入口上方独立连廊雨棚", "box", dark, [Math.cos(angle) * 12.5, 3.1, Math.sin(angle) * 12.5], [8.5, .2, 2.4], [0, -45, 0]));
  for (const offset of [-1, 1]) p.push(cylinder("斜向入口雨棚两侧落地支柱", Math.cos(angle) * 16 + Math.sin(angle) * offset, 1.6, Math.sin(angle) * 16 - Math.cos(angle) * offset, .18, 2.8, dark));
  return p;
}
