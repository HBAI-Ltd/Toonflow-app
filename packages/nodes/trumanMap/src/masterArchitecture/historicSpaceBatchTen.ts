import { part, type ModelPart, type Triple } from "../assetModelParts";
import { box, design, type ArchitecturePrototype } from "./structures";
import { halfRoundWall, halfRoundFloor, halfDomeRoof } from "./spatialShells";
import { polygon } from "../masterNature/shared";
import { combineMeshes } from "../natureParts";
import { ellipseWall } from "./historicSpaceBatchSix";
import { turn, door, stairFlight, arcadeWall, cappedColumn } from "./historicSpaceBatchSeven";
import { verticalPanel, windowHole } from "./historicSpaceBatchNine";

const stone = "#b6b09a", brick = "#ad8d70", wood = "#917653", roofColor = "#7d8574";

// 原创完整空间按真实平面与承重构造区分，非特定遗址的精确复原。
// https://cultura.gov.it/comunicato/roma-apertura-eccezionale-dei-fori-imperiali-con-visite-guidate
// https://whc.unesco.org/en/list/18/
// https://isac.uchicago.edu/publications/temple-oval-khafajah
export const historicSpaceBatchTenDesigns: ArchitecturePrototype[] = [
  design("双耳院横厅列柱论坛", "矩形公共广场两边柱廊向外扩成半圆耳院，后端横向五廊大厅两端另接半圆龛，外门廊、侧耳院和横厅之间真实连通", exedraForum, "建筑", "欧式"),
  design("周柱独石五廊岩沟教堂", "整片高母岩中开出环沟和折返阶道，独立石殿的外周方柱承住连续岩檐，四列内墩分出五条内廊，真实门窗接通岩沟与殿内", monolithicPeristyleChurch, "建筑", "异域"),
  design("双椭圆围壁高台神祠", "高低双椭圆院界通过偏置门道连接，内院两翼分室面向共同通路，长正阶登上后方高台，台上圣室保留转折入内的真实门道", ovalTemplePrecinct, "建筑", "异域"),
];

export function pitched(name: string, width: number, rise: number, depth: number, position: Triple, color = roofColor): ModelPart { return part(name, "extrude", color, position, [1, 1, 1], [0, 0, 0], { depth, profile: [{ x: -width / 2, y: 0 }, { x: 0, y: rise }, { x: width / 2, y: 0 }, { x: width / 2, y: -.2 }, { x: 0, y: rise - .2 }, { x: -width / 2, y: -.2 }] }); }
export function groupedColumns(name: string, positions: [number, number, number, number][], color = stone, thickness = 1.4): ModelPart[] {
  const p: ModelPart[] = [];
  for (let start = 0; start < positions.length; start += 6) {
    const pieces = positions.slice(start, start + 6).map(([x, z, y, h]) => { const value = cappedColumn(name, x, z, y, h, color); value.scale.x = thickness; value.scale.z = thickness; return value; });
    p.push(combineMeshes(name, color, pieces));
  }
  return p;
}
function halfRing(radius: number, inside: number, y: number): ModelPart {
  const outline: [number, number][] = [];
  for (let i = 0; i <= 16; i++) outline.push([Math.cos(i * Math.PI / 16) * radius, Math.sin(i * Math.PI / 16) * radius]);
  for (let i = 16; i >= 0; i--) outline.push([Math.cos(i * Math.PI / 16) * inside, Math.sin(i * Math.PI / 16) * inside]);
  return polygon("耳院周边向中心通空的半圆柱廊屋盖", wood, outline, .35, [0, y, 0]);
}
function forumHallEnd(x: number): ModelPart {
  const outline: [number, number][] = [[-13, 0], [-13, 6.58], [-6, 8.2], [-6, 11.2], [-6.4, 11.2], [0, 15.7], [6.4, 11.2], [6, 11.2], [6, 8.2], [13, 6.58], [13, 0]];
  return verticalPanel("横厅端头真实接到半圆后龛的高低屋端厚壁", outline, [windowHole(0, .035, 12, 14.2)], .7, [x, .42, 42], 90);
}
function exedraForum(): ModelPart[] {
  const p: ModelPart[] = [];
  for (const x of [-30, 30]) for (const z of [-38.5, 38.5]) p.push(box("大型论坛整体分片承地石基础", x, .09, z, 60, .18, 77));
  p.push(box("广场与两侧廊共同完整石铺地面", 0, .3, -10, 74, .24, 100), box("公共广场前端通透门柱廊的完整木檐屋盖", 0, 7.175, -55, 70, .35, 6, wood), ...groupedColumns("入口长门廊真正承顶的石柱列", [-30, -20, -10, 0, 10, 20, 30].map(x => [x, -56.5, .42, 6.58])));
  for (const s of [-1, 1]) {
    const yaw = s * 90, ear: ModelPart[] = [halfRoundFloor("公共广场侧边真实扩出的半圆耳院地面", 17, .24, [0, .18, 0], 0, stone), halfRoundWall("侧耳院最外侧完整半圆厚石壁", 17, .65, 6.58, [0, .42, 0], 0, stone), halfRing(17, 13.5, 7)];
    const posts: [number, number, number, number][] = [];
    for (let i = 0; i < 8; i++) { const a = (i + .5) * Math.PI / 8; posts.push([Math.cos(a) * 13.5, Math.sin(a) * 13.5, .42, 6.58]); }
    ear.push(...groupedColumns("半圆耳院内侧真正接承檐盖的石柱", posts));
    p.push(...turn(ear, yaw, [s * 35, 0, -4]), box("广场长边柱廊完整木檐屋盖", s * 30, 7.175, -12, 10, .35, 82, wood), box("耳院前方长柱廊实际外厚壁", s * 35, 3.71, -37, .65, 6.58, 32), box("耳院后方长柱廊实际外厚壁", s * 35, 3.71, 21, .65, 6.58, 16));
    p.push(...groupedColumns("长边柱廊朝广场的真实承檐石柱", Array.from({ length: 13 }, (_, i) => [s * 25, -53 + i * 82 / 12, .42, 6.58])));
  }
  p.push(box("后横大厅五廊共用完整石地面", 0, .3, 42, 94, .24, 26), ...turn([pitched("后横厅中央高廊的完整双坡木屋盖", 12.8, 4.3, 96, [0, 11.82, 0])], 90, [0, 0, 42]), forumHallEnd(-47), forumHallEnd(47));
  for (const s of [-1, 1]) {
    p.push(...groupedColumns("横厅中廊高窗实墩下方真正落地的高石柱", Array.from({ length: 15 }, (_, i) => [-47 + i * 94 / 14, 42 + s * 6, .42, 8.2]), stone, 1.6), arcadeWall("横厅中廊两侧连续透空高窗", 94, 3, [0, 8.62, 42 + s * 6], 0), box("高窗墙头真实接住双坡屋面的长木梁", 0, 11.76, 42 + s * 6, 94, .3, .5, wood));
    p.push(...groupedColumns("把宽侧廊再分成两路并实际承住单坡顶的中间柱列", Array.from({ length: 15 }, (_, i) => [-47 + i * 94 / 14, 42 + s * 9.5, .42, 7.29]), stone, 1.5));
    const lower = box("横厅中高向外边低廊连续下降的单坡木屋盖", 0, 7.81, 42 + s * 9.5, 94, .2, Math.hypot(7, 1.62), wood); lower.rotation.x = s * Math.atan2(1.62, 7) * 180 / Math.PI; p.push(lower);
    const holes = Array.from({ length: 7 }, (_, i) => windowHole(-39 + i * 13, .035, 4, 5.8));
    p.push(verticalPanel("横厅前后长立面实际接通广场的七路宽券门", [[-47, 0], [47, 0], [47, 6.58], [-47, 6.58]], holes, .65, [0, .42, 42 + s * 13], 0), halfRoundFloor("横厅两端真正扩出的半圆龛地面", 6, .24, [s * 47, .18, 42], s * 90, stone), halfRoundWall("横厅两端半圆后龛完整石壁", 6, .6, 8.2, [s * 47, .42, 42], s * 90, stone), halfDomeRoof("横厅端龛同中厅真实接合的半穹石顶", 6, .24, [s * 47, 8.62, 42], s * 90, stone));
  }
  return p;
}

function rectangularPiers(name: string, points: [number, number][], height: number, size: number): ModelPart {
  return combineMeshes(name, brick, points.map(([x, z]) => polygon(name, brick, [[-size / 2, -size / 2], [size / 2, -size / 2], [size / 2, size / 2], [-size / 2, size / 2]], height, [x, .42, z])));
}
function monolithicPeristyleChurch(): ModelPart[] {
  const ground: [number, number][] = [[-30, -36], [-4.5, -36], [-4.5, -27], [-21, -27], [-21, 27], [21, 27], [21, -27], [4.5, -27], [4.5, -36], [30, -36], [30, 36], [-30, 36]], p: ModelPart[] = [box("岩沟教堂完整落地基础", 0, .09, 0, 64, .18, 76, brick), polygon("真实切去环沟和前部折返阶井的高母岩", brick, ground, 15, [0, .18, 0]), box("环沟和石殿共用的完整低石地坪", 0, .3, 0, 42, .24, 54, brick), polygon("外周独石柱共托且中央真正让出石殿的连续岩檐", brick, [[-17, -23], [17, -23], [17, 23], [-17, 23]], 1, [0, 9.92, 0], [[[-13, -19], [-13, 19], [13, 19], [13, -19]]]), part("方厅内顶平整而外缘起脊的整体厚岩石屋盖", "extrude", brick, [0, 11.72, 0], [1, 1, 1], [0, 0, 0], { depth: 38, profile: [{ x: -13, y: 0 }, { x: 0, y: 2.3 }, { x: 13, y: 0 }, { x: 13, y: -.8 }, { x: -13, y: -.8 }] })];
  const inside: [number, number][] = [], outside: [number, number][] = [];
  for (const x of [-7.5, -2.5, 2.5, 7.5]) for (const z of [-15, -10, -5, 0, 5, 10, 15]) inside.push([x, z]);
  for (const s of [-1, 1]) {
    for (const z of [-20, -16, -12, -8, -4, 4, 8, 12, 16, 20]) outside.push([s * 15, z]);
    for (const x of [-10, -5, -2.5, 2.5, 5, 10]) outside.push([x, s * 21]);
    const front = [windowHole(0, .035, 3, 5), windowHole(-8, 2, 2.5, 4), windowHole(8, 2, 2.5, 4)];
    p.push(verticalPanel("独石殿前后实际穿透的门窗岩壁", [[-12, 0], [12, 0], [12, 10.5], [-12, 10.5]], front, .8, [0, .42, s * 18], 0, brick));
    const side = [windowHole(0, .035, 2.5, 5), ...[-15, -10, -5, 0, 5, 10, 15].map(x => [[x - .75, 7.5], [x + .75, 7.5], [x + .75, 9], [x - .75, 9]] as [number, number][])];
    p.push(verticalPanel("独石殿长边真实低门与高窗岩壁", [[-18, 0], [18, 0], [18, 10.5], [-18, 10.5]], side, .8, [s * 12, .42, 0], 90, brick));
  }
  p.push(rectangularPiers("四列完整石墩共同分出五条真实内廊", inside, 10.5, 1), rectangularPiers("环沟内保留的完整方石周柱列", outside, 9.5, 1.2));
  for (const s of [-1, 1]) for (const z of [-35, -28]) p.push(box("折返阶井两边从岩底贯通到顶台的实承石柱", s * 4.4, 7.505, z, .8, 14.65, 1.2, brick));
  p.push(box("折返阶井下端同低岩沟接平的石平台", 0, .245, -27.5, 8.5, .35, 1.2, brick));
  for (let level = 0; level < 4; level++) {
    const floor = .42 + level * 3.69, outward = level % 2 === 0, z = outward ? -28 : -35, x = outward ? -2.2 : 2.2, end = outward ? -35 : -28;
    p.push(stairFlight("从外部高岸分四段回折下到岩沟的真实石阶", 20, 1.4, 3.69, .35, 0, [x, floor, z], outward ? 90 : -90, true), box("折返阶道实际跨接左右两梯的落地承台", 0, floor + 3.515, end, level === 3 ? 9.5 : 8.5, .35, 1.2, brick));
  }
  return p;
}

function serviceRooms(side: number): ModelPart[] {
  const holes: [number, number][][] = [-7.5, -2.5, 2.5, 7.5].map(x => [[x - 1, .035], [x + 1, .035], [x + 1, 2.7], [x - 1, 2.7]]), p: ModelPart[] = [verticalPanel("神祠内院侧翼四个独立房间的真实门面", [[-10, 0], [10, 0], [10, 3.5], [-10, 3.5]], holes, .5, [side * 13, .42, 4], side * 90, brick), box("侧翼分室背后完整厚土石墙", side * 19, 2.17, 4, .5, 3.5, 20, brick), box("侧翼分室共同完整平木石屋盖", side * 16, 4.12, 4, 6.5, .4, 20.5, brick)];
  for (const z of [-6, -1, 4, 9, 14]) p.push(box("侧翼各房间之间实际分开的完整厚壁", side * 16, 2.17, z, 6, 3.5, .5, brick));
  return p;
}
function ovalTemplePrecinct(): ModelPart[] {
  const oval = (rx: number, rz: number): [number, number][] => Array.from({ length: 48 }, (_, i) => [Math.cos(i * Math.PI / 24) * rx, Math.sin(i * Math.PI / 24) * rz]), p: ModelPart[] = [box("双椭圆神祠完整承地基础", 0, .09, 0, 68, .18, 90, brick), polygon("双院界和所有内室共用的完整椭圆铺地", stone, oval(30, 40), .24, [0, .18, 0]), ellipseWall("外椭圆院界在主入口两边真实收分的完整厚壁", 30, 40, 2.2, 6.5, -82, 344, brick)];
  const outerHead = ellipseWall("外椭圆主门上方实际闭合的曲形石门头", 30, 40, 2.2, 2.5, 262, 16, brick); outerHead.position.y = 4; p.push(outerHead);
  const inside = ellipseWall("内椭圆院界避开偏置入门的完整厚壁", 22, 29, 1.4, 5.5, -105, 340, brick); inside.position.z = 4; p.push(inside);
  const innerHead = ellipseWall("内椭圆偏置门道上方实际承住的曲形石门头", 22, 29, 1.4, 2, 235, 20, brick); innerHead.position.y = 3.5; innerHead.position.z = 4; p.push(innerHead);
  for (const s of [-1, 1]) p.push(...serviceRooms(s));
  p.push(box("后方圣室下真正连续落地的高矩形石祭台", 0, 3.17, 22, 16, 5.5, 15, brick), stairFlight("内院正面逐级接到高圣台的连续长石阶", 22, 4, 5.5, 10 / 22, 0, [0, .42, 4.5], -90), ...door("台上圣室朝长阶的真正入口", 10, 5, .7, 2.4, [0, 5.92, 17], 3.2, brick), box("台上圣室后方完整厚壁", 0, 8.42, 27, 10, 5, .7, brick), ...[-1, 1].map(s => box("台上圣室两侧实际厚围壁", s * 5, 8.42, 22, .7, 5, 10, brick)), verticalPanel("台上圣室内部保留偏门的转折礼仪隔壁", [[-5, 0], [5, 0], [5, 5], [-5, 5]], [windowHole(-2, .035, 2.4, 3.2)], .5, [0, 5.92, 23], 0, brick), box("台上圣室四壁共同承住的完整石平顶", 0, 11.145, 22, 11, .45, 11, brick), polygon("圣室顶部中空而连续的矮护壁", brick, [[-5.5, -5.5], [5.5, -5.5], [5.5, 5.5], [-5.5, 5.5]], .7, [0, 11.37, 22], [[[-4.8, -4.8], [-4.8, 4.8], [4.8, 4.8], [4.8, -4.8]]]), polygon("外院独立净水石池真正封水的圆边", stone, oval(2, 2), .5, [0, .42, -32], [oval(1.7, 1.7)]), part("外院石池内独立静态水面", "cylinder", "#819da0", [0, .78, -32], [3.3, .03, 3.3], [0, 0, 0], { opacity: .72, roughness: .24 }));
  return p;
}
