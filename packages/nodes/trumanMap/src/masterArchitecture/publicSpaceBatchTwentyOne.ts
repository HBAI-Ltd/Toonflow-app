import { part, type ModelPart } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { box, design, rail, colors } from "./structures";
import { standingPanel } from "./publicSpaceBatchOne";
import { boxesMesh, type SolidBox } from "./publicSpaceBatchEight";
import { waistStair } from "./publicSpaceBatchFourteen";

const stone = "#b9b9ab", dark = "#536b70", wood = "#ad956e";

export const publicSpaceBatchTwentyOneDesigns = [
  design("双庭交廊中学校舍", "平行的两层教室翼由中央贯层交通厅横接，形成左右独立开敞的活动庭；中央真实折返梯井与两处翼端疏散梯共同连接上下层，十六间独立教室逐间接入有顶公共廊，前后门厅贯通到中央交通厅", crossHallSchool, "建筑", "现代"),
];

function classroomDoorWall(z: number, floor: number, height: number): ModelPart {
  const profile = [{ x: -28, y: 0 }];
  for (const [x, width] of [[-23, 1.2], [-12, 1.2], [0, 8], [12, 1.2], [23, 1.2]]) profile.push({ x: x! - width! / 2, y: 0 }, { x: x! - width! / 2, y: 2.6 }, { x: x! + width! / 2, y: 2.6 }, { x: x! + width! / 2, y: 0 });
  profile.push({ x: 28, y: 0 }, { x: 28, y: height }, { x: -28, y: height });
  return part("四间教室及中央门厅分别接入公共廊的连续五门墙", "extrude", stone, [0, floor, z], [1, 1, 1], [0, 0, 0], { depth: .2, profile });
}

function crossHallSchool(): ModelPart[] {
  const outline: [number, number][] = [[-28, -24], [28, -24], [28, -10], [5, -10], [5, 10], [28, 10], [28, 24], [-28, 24], [-28, 10], [-5, 10], [-5, -10], [-28, -10]], shaft: [number, number][] = [[-3.5, -5], [3.5, -5], [3.5, .6], [-3.5, .6]], light: [number, number][] = [[-3.8, -6], [3.8, -6], [3.8, 6], [-3.8, 6]];
  const p: ModelPart[] = [box("校舍两翼与左右活动庭共同落地的完整场坪", 0, .15, 0, 68, .3, 58, stone), polygon("两条教学翼和中部交通厅共同组成的H形地面饰层", wood, outline, .005, [0, .3, 0]), polygon("上下贯层交通厅真正开出折返梯井的完整上层楼板", wood, outline, .25, [0, 4.05, 0], [shaft]), polygon("两翼与交通厅连续接合且保留中央天光的完整屋盖", dark, outline, .25, [0, 8.3, 0], [light]), part("中央楼梯交通厅上方实际覆盖天光孔的透明顶板", "box", colors.glass, [0, 8.55, 0], [7.8, .05, 12.2], [0, 0, 0], { opacity: .25 }), part("室外地面实际接到主入口前场的低缓坡", "extrude", stone, [0, 0, -31], [1, 1, 1], [0, -90, 0], { depth: 4, profile: [{ x: -2, y: 0 }, { x: 2, y: 0 }, { x: 2, y: .3 }, { x: -2, y: .02 }] })];
  const walls: SolidBox[] = [], panes: SolidBox[] = [], desks: SolidBox[] = [], boards: SolidBox[] = [], guards: SolidBox[] = [], posts: SolidBox[] = [];
  const rooms = [[-23, 10], [-12, 12], [12, 12], [23, 10]], postKeys = new Set<string>();
  const addPost = (x: number, floor: number, z: number) => {
    const key = `${x.toFixed(5)},${floor.toFixed(5)},${z.toFixed(5)}`;
    if (postKeys.has(key)) return;
    postKeys.add(key); posts.push({ center: [x, floor + .55, z], size: [.06, 1.1, .06] });
  };
  const addGuard = (x0: number, z0: number, x1: number, z1: number, floor: number) => {
    const count = Math.ceil(Math.hypot(x1 - x0, z1 - z0) / 3);
    guards.push({ center: [(x0 + x1) / 2, floor + 1.1, (z0 + z1) / 2], size: [Math.abs(x1 - x0) || .06, .06, Math.abs(z1 - z0) || .06] });
    for (let i = 0; i <= count; i++) addPost(x0 + (x1 - x0) * i / count, floor, z0 + (z1 - z0) * i / count);
  };
  for (const floor of [.3, 4.3]) {
    const height = floor < 1 ? 3.75 : 4;
    for (const side of [-1, 1]) {
      p.push(classroomDoorWall(side * 13, floor, height));
      const face: [number, number][] = floor < 1 ? [[-28, floor], [-2, floor], [-2, floor + 2.8], [2, floor + 2.8], [2, floor], [28, floor], [28, floor + height], [-28, floor + height]] : [[-28, floor], [28, floor], [28, floor + height], [-28, floor + height]], holes: [number, number][][] = [];
      for (const [x, width] of rooms) {
        const windowWidth = width! - 4;
        holes.push([[x! - windowWidth / 2, floor + 1.05], [x! + windowWidth / 2, floor + 1.05], [x! + windowWidth / 2, floor + 3.25], [x! - windowWidth / 2, floor + 3.25]]);
        panes.push({ center: [x!, floor + 2.15, side * 24], size: [windowWidth, 2.2, .05] });
        boards.push({ center: [x! - width! / 2 + .13, floor + 2.1, side * 18.5], size: [.06, 1.5, 5] });
        for (const offset of [-2.3, 2.3]) {
          const rowX = x! + offset, z = side * 18.5;
          desks.push({ center: [rowX, floor + .8, z], size: [.7, .12, 8.5] }, { center: [rowX + 1.1, floor + .45, z], size: [.5, .12, 8.5] });
          for (const foot of [-1, 1]) desks.push({ center: [rowX, floor + .37, z + foot * 3.65], size: [.65, .74, .12] }, { center: [rowX + 1.1, floor + .195, z + foot * 3.65], size: [.5, .39, .12] });
        }
      }
      if (floor > 1) { holes.push([[-4, floor + 1.05], [4, floor + 1.05], [4, floor + 3.25], [-4, floor + 3.25]]); panes.push({ center: [0, floor + 2.15, side * 24], size: [8, 2.2, .05] }); }
      p.push(standingPanel("教室两层真实采光窗与地层穿行门厅共同组成的完整外立面", stone, face, holes, side * 24, .24));
      for (const x of [-28, -18, -6, 6, 18, 28]) walls.push({ center: [x, floor + height / 2, side * 18.5], size: [.2, height, 11] });
    }
  }
  for (const side of [-1, 1]) {
    const holes: [number, number][][] = [];
    for (const floor of [.3, 4.3]) {
      const windows = floor < 1 ? [[-6.5, 3], [5.5, 4]] : [[-5.5, 4], [0, 3], [5.5, 4]];
      for (const [z, width] of windows) { holes.push([[z! - width! / 2, floor + 1.05], [z! + width! / 2, floor + 1.05], [z! + width! / 2, floor + 3.25], [z! - width! / 2, floor + 3.25]]); panes.push({ center: [side * 5, floor + 2.15, -z!], size: [.05, 2.2, width!] }); }
    }
    const face = standingPanel("避开楼梯转台下方的实际侧门与中央交通厅上下层窗洞", stone, [[-10, .3], [-4, .3], [-4, 3.1], [-1, 3.1], [-1, .3], [10, .3], [10, 8.3], [-10, 8.3]], holes, 0, .24); face.position.x = side * 5; face.rotation.y = 90; p.push(face);
    for (const z of [-7, 7]) p.push(box("左右活动庭让出侧门与中央公共步道的独立地面绿带", side * 16.5, .34, z, 18, .08, 3, "#8b9f7b"));
  }
  p.push(waistStair("中央贯层梯井中实际上行到转台的第一跑薄底阶梯", -2.2, .3, -5, 2.4, 12, 1 / 6, .3), waistStair("中央贯层梯井中折返回上层楼板边的第二跑薄底阶梯", 2.2, 2.3, -1.4, 2.4, 12, 1 / 6, .3, true), box("两跑阶梯高低端准确接合的实际转向平台", 0, 2.2, -.4, 6.8, .2, 2, wood));
  for (const [x, y, z0, z1] of [[-2.2, .3, -5, -1.4], [2.2, 2.3, -1.4, -5]]) for (const offset of [-1.15, 1.15]) {
    p.push(rail([x! + offset, y! + 1.1, z0!], [x! + offset, y! + 3.1, z1!], .06, dark));
    for (let i = 0; i <= 3; i++) addPost(x! + offset, y! + 2 * i / 3, z0! + (z1! - z0!) * i / 3);
  }
  for (const side of [-1, 1]) {
    for (let flight = 0; flight < 2; flight++) p.push(waistStair("教学翼端部避开教室并实际通向上层公共廊的室外疏散梯", side * 30.5, .3 + flight * 2, side * (21 - flight * 3.6), 2, 12, 1 / 6, .3, side > 0));
    p.push(box("疏散阶梯高端与教学翼公共廊准确齐平的完整落脚台", side * 29.75, 4.175, side * 12.5, 3.5, .25, 2.6, wood), box("室外疏散梯落脚台下实际接地的承重柱", side * 31.2, 2.175, side * 11.5, .25, 3.75, .25, dark));
    for (const offset of [-.97, .97]) {
      p.push(rail([side * 30.5 + offset, 1.4, side * 21], [side * 30.5 + offset, 5.4, side * 13.8], .06, dark));
      for (let i = 0; i <= 6; i++) addPost(side * 30.5 + offset, .3 + 4 * i / 6, side * (21 - 7.2 * i / 6));
    }
    addGuard(side * 31.5, side * 13.8, side * 31.5, side * 11.2, 4.3); addGuard(side * 31.5, side * 11.2, side * 28, side * 11.2, 4.3); addGuard(side * 29.5, side * 13.8, side * 28, side * 13.8, 4.3);
    for (const [x0, x1] of [[-28, -5], [5, 28]]) addGuard(x0!, side * 10, x1!, side * 10, 4.3);
  }
  for (const [x0, z0, x1, z1] of [[-3.5, -5, -3.5, .6], [3.5, -5, 3.5, .6], [-3.5, .6, 3.5, .6], [-3.5, -5, .95, -5], [28, -13, 28, -10], [-28, 10, -28, 13]]) addGuard(x0!, z0!, x1!, z1!, 4.3);
  for (const [x0, z0, x1, z1] of [[-3.4, .6, 3.4, .6], [-3.4, -1.4, -3.4, .6], [3.4, -1.4, 3.4, .6]]) addGuard(x0!, z0!, x1!, z1!, 2.3);
  for (let start = 0; start < walls.length; start += 18) p.push(boxesMesh("十六间教室与前后公共门厅真实分开的完整室间墙", stone, walls.slice(start, start + 18)));
  for (let start = 0; start < desks.length; start += 18) p.push(boxesMesh("各独立教室内实际落地的成排课桌和长座", wood, desks.slice(start, start + 18)));
  p.push(boxesMesh("每间独立教室中朝向课桌并实际连接分室墙的教学板", "#627c70", boards));
  for (let start = 0; start < guards.length; start += 18) p.push(boxesMesh("上层有顶教学步廊与真实梯井边缘的连续防坠扶手", dark, guards.slice(start, start + 18)));
  for (let start = 0; start < posts.length; start += 18) p.push(boxesMesh("中央阶梯及室外疏散梯的实际扶手支柱", dark, posts.slice(start, start + 18)));
  for (let start = 0; start < panes.length; start += 18) { const glass = boxesMesh("完整校舍各真实开窗中的独立透明窗板", colors.glass, panes.slice(start, start + 18)); glass.opacity = .24; p.push(glass); }
  return p;
}
