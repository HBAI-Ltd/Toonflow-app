import { part, type ModelPart } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { box, design, rail, colors } from "./structures";
import { doorway, standingPanel } from "./publicSpaceBatchOne";
import { boxesMesh, type SolidBox } from "./publicSpaceBatchEight";
import { waistStair } from "./publicSpaceBatchFourteen";

const stone = "#b9b9aa", dark = "#52696e", wood = "#ad946d";

export const publicSpaceBatchTwentyFourDesigns = [
  design("架空连院小学", "梁柱架上的完整教室层围住从地面直通天空的中央活动庭，底层开放活动场从四边贯通；前侧两座宽阶各有实际中间转台和高位门厅，左右六间及后翼四间教室分别进入有顶环廊，真实窗墙与连续开院屋盖围合完整学校", raisedCourtyardSchool, "建筑", "现代"),
];

function raisedCourtyardSchool(): ModelPart[] {
  const floor = 5.05, ceiling = 9.05, outside: [number, number][] = [[-22, -28], [22, -28], [22, 28], [-22, 28]], court: [number, number][] = [[-11, -12], [11, -12], [11, 14], [-11, 14]];
  const p: ModelPart[] = [box("架空校舍与地面活动场共同落地的完整基础", 0, .15, -5, 52, .3, 74, stone), polygon("整层教室与公共门厅同高且让中央庭贯天的完整楼板", wood, outside, .25, [0, 4.8, 0], [court]), polygon("高位教室和有顶环廊共同围住真实露天庭的完整屋盖", dark, outside, .25, [0, ceiling, 0], [court]), part("室外地面实际接到学校前方活动场的宽缓坡", "extrude", stone, [0, 0, -44], [1, 1, 1], [0, -90, 0], { depth: 5, profile: [{ x: -2, y: 0 }, { x: 2, y: 0 }, { x: 2, y: .3 }, { x: -2, y: .02 }] })];
  const columns: SolidBox[] = [], beams: SolidBox[] = [], walls: SolidBox[] = [], panes: SolidBox[] = [], desks: SolidBox[] = [], boards: SolidBox[] = [], seats: SolidBox[] = [], landings: SolidBox[] = [], guards: SolidBox[] = [], posts: SolidBox[] = [];
  const postKeys = new Set<string>();
  const addPost = (x: number, base: number, z: number) => {
    const key = `${x.toFixed(5)},${base.toFixed(5)},${z.toFixed(5)}`;
    if (postKeys.has(key)) return;
    postKeys.add(key); posts.push({ center: [x, base + .55, z], size: [.06, 1.1, .06] });
  };
  const sideCenters = [-12 + 26 / 6, 1, 14 - 26 / 6];
  for (const z of [-25, -15, 17, 25]) {
    beams.push({ center: [0, 4.55, z], size: [44, .5, .5] });
    for (const x of [-21, -7, 7, 21]) columns.push({ center: [x, 2.3, z], size: [.4, 4, .4] });
  }
  for (const x of [-21, -12, 12, 21]) {
    beams.push({ center: [x, 4.55, 1], size: [.5, .5, 32] });
    for (const z of [-11, 1, 13]) columns.push({ center: [x, 2.3, z], size: [.4, 4, .4] });
  }
  const front: [number, number][] = [[-22, floor], [-18.8, floor], [-18.8, floor + 2.6], [-16.2, floor + 2.6], [-16.2, floor], [16.2, floor], [16.2, floor + 2.6], [18.8, floor + 2.6], [18.8, floor], [22, floor], [22, ceiling], [-22, ceiling]];
  p.push(standingPanel("前公共门厅真正开出双阶梯高位入口及中央长窗的完整立面", stone, front, [[[-11, floor + 1.05], [11, floor + 1.05], [11, floor + 3.3], [-11, floor + 3.3]]], -28, .24)); panes.push({ center: [0, floor + 2.175, -28], size: [22, 2.25, .05] });
  const rearHoles: [number, number][][] = [];
  for (const x of [-16.5, -5.5, 5.5, 16.5]) { rearHoles.push([[x - 3.9, floor + 1.05], [x + 3.9, floor + 1.05], [x + 3.9, floor + 3.3], [x - 3.9, floor + 3.3]]); panes.push({ center: [x, floor + 2.175, 28], size: [7.8, 2.25, .05] }); }
  p.push(standingPanel("后翼四间独立教室真正开窗的完整外立面", stone, [[-22, floor], [22, floor], [22, ceiling], [-22, ceiling]], rearHoles, 28, .24));
  for (const side of [-1, 1]) {
    const holes: [number, number][][] = [];
    for (const [z, width] of [[-21, 9], ...sideCenters.map(z => [z, 6]), [22.5, 7]]) { holes.push([[-z! - width! / 2, floor + 1.05], [-z! + width! / 2, floor + 1.05], [-z! + width! / 2, floor + 3.3], [-z! - width! / 2, floor + 3.3]]); panes.push({ center: [side * 22, floor + 2.175, z!], size: [.05, 2.25, width!] }); }
    const face = standingPanel("架空教室与前门厅共同的实际侧窗外墙", stone, [[-28, floor], [28, floor], [28, ceiling], [-28, ceiling]], holes, 0, .24); face.position.x = side * 22; face.rotation.y = 90; p.push(face);
    for (let room = 0; room < 3; room++) {
      const z = sideCenters[room]!, low = -12 + room * 26 / 3;
      p.push(doorway("左右六间独立教室各自面向三米公共环廊的真实入口", [side * 14, floor, z], 26 / 3, 4, 1.2, 90, 2.6)); boards.push({ center: [side * 18, floor + 2, low + .13], size: [6, 1.5, .06] });
      for (const offset of [-1.5, 1.5]) {
        desks.push({ center: [side * 18, floor + .8, z + offset], size: [6.5, .12, .7] }, { center: [side * 18, floor + .45, z + offset + 1], size: [6.5, .12, .5] });
        for (const foot of [-1, 1]) desks.push({ center: [side * 18 + foot * 2.65, floor + .37, z + offset], size: [.12, .74, .65] }, { center: [side * 18 + foot * 2.65, floor + .195, z + offset + 1], size: [.12, .39, .5] });
      }
    }
    for (const z of [-12, -12 + 26 / 3, -12 + 52 / 3, 14]) walls.push({ center: [side * 18, floor + 2, z], size: [8, 4, .2] });
  }
  for (let room = 0; room < 4; room++) {
    const x = -16.5 + room * 11, boardOnLeft = room >= 2;
    p.push(doorway("后翼四间独立教室分别通往三米公共后廊的真实入口", [x, floor, 17], 11, 4, 1.2, 0, 2.6)); boards.push({ center: [x + (boardOnLeft ? -5.37 : 5.37), floor + 2, 22.5], size: [.06, 1.5, 5] });
    for (const offset of [-2.3, 2.3]) {
      const rowX = x + offset, benchX = rowX + (boardOnLeft ? 1 : -1);
      desks.push({ center: [rowX, floor + .8, 22.5], size: [.7, .12, 8.5] }, { center: [benchX, floor + .45, 22.5], size: [.5, .12, 8.5] });
      for (const foot of [-1, 1]) desks.push({ center: [rowX, floor + .37, 22.5 + foot * 3.65], size: [.65, .74, .12] }, { center: [benchX, floor + .195, 22.5 + foot * 3.65], size: [.5, .39, .12] });
    }
  }
  for (const x of [-11, 0, 11]) walls.push({ center: [x, floor + 2, 22.5], size: [.2, 4, 11] });
  for (const [width, plane, centerZ, yaw] of [[22, -12, 0, 0], [22, 14, 0, 0], [26, -11, 1, 90], [26, 11, 1, 90]]) {
    const half = width! / 2, offset = width === 22 ? 5.5 : 6.5, windowWidth = width === 22 ? 8 : 9, holes: [number, number][][] = [];
    for (const x of [-offset, offset]) { holes.push([[x - windowWidth / 2, floor + 1], [x + windowWidth / 2, floor + 1], [x + windowWidth / 2, floor + 3.3], [x - windowWidth / 2, floor + 3.3]]); panes.push({ center: yaw ? [plane!, floor + 2.15, centerZ! - x] : [x, floor + 2.15, plane!], size: yaw ? [.05, 2.3, windowWidth] : [windowWidth, 2.3, .05] }); }
    const face = standingPanel("有顶环廊面向贯天庭并提供实体窗下防护的完整内立面", stone, [[-half, floor], [half, floor], [half, ceiling], [-half, ceiling]], holes, yaw ? 0 : plane!, .2); if (yaw) { face.position.x = plane!; face.position.z = centerZ!; face.rotation.y = yaw; } p.push(face);
  }
  const rise = 4.75 / 30;
  for (const x of [-17.5, 17.5]) {
    for (const [base, startZ] of [[.3, -39], [2.675, -33]]) {
      p.push(waistStair("地面到高位门厅宽阶每跑前七级连续薄底踏步", x, base!, startZ!, 2.4, 7, rise, .3), waistStair("同跑后八级准确接到中间或门前平台的连续踏步", x, base! + rise * 7, startZ! + 2.1, 2.4, 8, rise, .3));
      for (const side of [-1, 1]) {
        p.push(rail([x + side * 1.12, base! + 1.1, startZ!], [x + side * 1.12, base! + 3.475, startZ! + 4.5], .06, dark));
        for (let i = 0; i <= 3; i++) addPost(x + side * 1.12, base! + i * 2.375 / 3, startZ! + i * 1.5);
      }
    }
    landings.push({ center: [x, 2.575, -33.75], size: [2.4, .2, 1.5] }, { center: [x, 4.925, -28.25], size: [2.4, .25, .5] });
    columns.push({ center: [x, 1.3875, -33.75], size: [.35, 2.175, .35] }, { center: [x, 2.55, -28.25], size: [.35, 4.5, .35] });
    for (const side of [-1, 1]) for (const [z, length, top] of [[-33.75, 1.5, 2.675], [-28.25, .5, floor]]) {
      guards.push({ center: [x + side * 1.12, top! + 1.1, z!], size: [.06, .06, length!] });
      for (const end of [-1, 1]) addPost(x + side * 1.12, top!, z! + end * length! / 2);
    }
  }
  for (const x of [-8, 0, 8]) for (const z of [-22, -16]) {
    seats.push({ center: [x, floor + .39, z], size: [5, .12, .7] }, { center: [x, floor + .825, z + .35], size: [5, .75, .08] });
    for (const side of [-1, 1]) seats.push({ center: [x + side * 2, floor + .165, z], size: [.15, .33, .6] });
  }
  for (const [name, color, values] of [["完整架空校舍以及两处宽阶平台真正落地的承重柱", dark, columns], ["实际承接教室层楼板并在柱顶相交的连续横纵梁", dark, beams], ["十间教室之间真实接到窗墙与屋面的完整隔墙", stone, walls], ["各独立教室内实际落地且朝向教学板的连续课桌长座", wood, desks], ["教室内实际贴合分室墙并避开外窗的教学板", "#627c70", boards], ["高位公共门厅中让开两侧入场通道的实际长座", "#96a18e", seats], ["两外阶准确接合每跑高低端的真实平台", wood, landings], ["宽阶两侧平台连续实体防坠扶手", dark, guards], ["实际连接宽阶和中间平台的独立扶栏立柱", dark, posts]] as [string, string, SolidBox[]][]) for (let start = 0; start < values.length; start += 18) p.push(boxesMesh(name, color, values.slice(start, start + 18)));
  for (let start = 0; start < panes.length; start += 18) { const glass = boxesMesh("完整架空校舍外窗和面庭内窗中的独立透明窗板", colors.glass, panes.slice(start, start + 18)); glass.opacity = .24; p.push(glass); }
  return p;
}
