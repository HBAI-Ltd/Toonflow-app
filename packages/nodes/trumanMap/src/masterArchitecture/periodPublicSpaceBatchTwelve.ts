import { part, ring, beam, type ModelPart } from "../assetModelParts";
import { base, box, cylinder, design, type ArchitecturePrototype } from "./structures";
import { polygon } from "../masterNature/shared";
import { combineMeshes } from "../natureParts";
import { stairFlight, turn, tower } from "./historicSpaceBatchSeven";
import { windowHole, verticalPanel } from "./historicSpaceBatchNine";
import { barrelRoof } from "./spatialShells";
import { openingWall, holesAt, postSet } from "./periodPublicSpaceBatchOne";
import { boxesMesh, type SolidBox } from "./publicSpaceBatchEight";

const stone = "#bbb8a8", wood = "#8b7258", iron = "#65706f", brass = "#b39a68";

export const periodPublicSpaceBatchTwelveDesigns: ArchitecturePrototype[] = [
  design("贯街双阶机械钟楼", "连续筒券街道从钟楼厚基座贯通，两侧反向外阶各自接到钟室真门，四面圆钟窗与独立传动轴连接内部机械架，顶部固定直梯穿过真实屋板孔进入有悬钟的开敞钟亭", streetClockTower, "建筑", "欧式"),
];

function streetClockTower(): ModelPart[] {
  const p: ModelPart[] = [base(22, 28), box("贯街钟楼与双侧外阶共用的完整石铺地坪", 0, .3, 0, 20, .24, 26, stone), barrelRoof("穿街通道内真正接到上层楼板底的完整长筒券", 2, .25, 8, [0, 3.92, 0], stone), box("钟室从厚基座与筒券上方实际接承的完整木石楼板", 0, 6.295, 0, 10, .25, 8, stone), polygon("钟室上方真实保留通入顶层钟亭的直梯孔楼板", stone, [[-5, -4], [5, -4], [5, 4], [-5, 4]], .25, [0, 12.42, 0], [[[3.1, 1.5], [4.5, 1.5], [4.5, 2.5], [3.1, 2.5]]]), postSet("顶层开敞钟亭真正从有孔楼面接到高屋盖的四角木柱", [[-3, -2.5], [3, -2.5], [-3, 2.5], [3, 2.5]], 3.4, 12.67), tower("开敞钟亭四角柱真正接承的完整四坡尖屋盖", [[-5, -4], [5, -4], [5, 4], [-5, 4]], [[1, 0], [.01, 3.6]], [0, 16.07, 0], iron), box("钟亭屋盖下真正连接两侧承柱并悬挂大钟的厚横梁", 0, 15.945, 0, 6, .25, .3, wood), cylinder("悬钟顶部真正接到承钟横梁的短金属吊杆", 0, 15.56, 0, .07, .52, iron), part("顶层钟亭中央真正保留向下空腔的悬挂金属大钟", "lathe", brass, [0, 13.8, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: .95, y: 0 }, { x: 1, y: .1 }, { x: .75, y: .3 }, { x: .55, y: 1.2 }, { x: .4, y: 1.5 }, { x: 0, y: 1.5 }, { x: 0, y: 1.38 }, { x: .33, y: 1.38 }, { x: .44, y: 1.14 }, { x: .63, y: .24 }, { x: .87, y: .1 }, { x: .87, y: 0 }] }), cylinder("悬钟内部真正从钟顶连接击钟锤的细杆", 0, 14.75, 0, .05, 1.3, iron), part("真实位于悬钟内腔的独立圆击钟锤", "sphere", iron, [0, 14, 0], [.3, .3, .3]), postSet("钟室内由楼面真正接承钟机横梁的四角木框", [[-1.2, -.6], [1.2, -.6], [-1.2, .6], [1.2, .6]], 3.8, 6.42), box("钟机四角框架上实际接承中央传动箱的厚横枋", 0, 10.37, 0, 2.8, .3, 1.5, wood), box("钟室内与四面传动轴真实相接的中央钟机箱", 0, 10.02, 0, 1, 1, 1, iron), cylinder("钟机箱底部真正落到钟室楼面的竖直驱动主轴", 0, 8.085, 0, .12, 3.33, iron), beam("钟机中心枢点真正悬挂倾斜摆锤的细金属杆", iron, [0, 9.6, 0], [.7, 7.1, 0], .05), part("钟室机械架内部真正悬空且离地的独立摆锤", "sphere", brass, [.7, 7.1, 0], [.35, .35, .35])];
  for (const s of [-1, 1]) p.push(openingWall("贯街基座前后真正开出同一拱形通道的完整厚端壁", 10, 5.75, [windowHole(0, .035, 4, 5.465)], [0, .42, s * 4]), box("钟楼基座两侧从街面真实接承上层楼板的厚实石墩", s * 3.5, 3.295, 0, 3, 5.75, 8, stone));
  for (const s of [-1, 1]) p.push(box("钟亭四角柱顶部真正接承悬钟横梁的两侧纵向木枋", s * 3, 15.945, 0, .25, .25, 5, wood));
  const clockHole: [number, number][] = Array.from({ length: 24 }, (_, i) => [Math.cos(i * Math.PI / 12) * 1.4, 3.6 + Math.sin(i * Math.PI / 12) * 1.4]);
  const stairPosts: SolidBox[] = [], ladderRungs: SolidBox[] = [], dialMarks: ModelPart[] = [];
  for (const s of [-1, 1]) {
    p.push(openingWall("钟室前后真正留出大圆钟窗与两侧采光窗的完整厚壁", 10, 6, [clockHole, ...holesAt([-3.5, 3.5], 1.5, 1.5, 1)], [0, 6.42, s * 4]), openingWall("钟室侧面真正对齐反向外阶平台的实门和圆钟窗", 8, 6, [clockHole, ...holesAt([s * 2.7], 1.4, 2.8)], [s * 5, 6.42, 0], 90), stairFlight("街道两边方向相反且真正登到钟室侧门平台的长石阶", 30, 1.4, 6, .32, 0, [s * 6, .42, s * 7.8], s < 0 ? -90 : 90, true), box("长外阶末端真正接到钟室侧门的短石平台", s * 6, 6.295, -s * 2.7, 2, .25, 1.8, stone), postSet("钟室侧门平台外沿真正落地承接台底的双木撑", [[s * 6.8, -s * 2.1], [s * 6.8, -s * 3.3]], 5.75), box("侧门平台外缘真正围护临空侧面的完整木栏", s * 7, 6.92, -s * 2.7, .08, 1, 1.8, wood), box("侧门平台末端让开钟室侧门的完整背沿木栏", s * 6, 6.92, -s * 3.6, 2, 1, .08, wood), box("钟亭两侧真正从完整楼板边界起立的连续木栏", s * 5, 13.17, 0, .08, 1, 8, wood), box("钟亭前后真正围合开敞层楼板边界的连续木栏", 0, 13.17, s * 4, 10, 1, .08, wood));
    for (const offset of [-.85, .85]) p.push(box("钟室侧门平台前栏真正让出长外阶到达的宽开口", s * 6 + offset, 6.92, -s * 1.8, .3, 1, .08, wood));
    for (const x of [s * 6 - .7, s * 6 + .7]) {
      p.push(beam("反向长外阶两侧真正随踏面连续上升的木扶手", wood, [x, 1.42, s * 7.8], [x, 7.42, -s * 1.8], .07));
      for (const t of [0, .5, 1]) stairPosts.push({ center: [x, .92 + 6 * t, s * (7.8 - 9.6 * t)], size: [.08, 1, .08] });
    }
    p.push(box("钟亭登梯孔两侧真正接到楼面的短钢护栏", 3.8 + s * .7, 13.17, 2, .08, 1, 1, iron), box("从钟室楼面直通钟亭孔且向上延伸为扶手的固定梯侧杆", 3.8 + s * .4, 10.045, 2, .08, 7.25, .1, iron));
  }
  p.push(box("钟亭登梯孔前缘真正保留背面上岸出口的钢护栏", 3.8, 13.17, 1.5, 1.4, 1, .08, iron));
  for (let i = 1; i <= 25; i++) ladderRungs.push({ center: [3.8, 6.42 + i * .25, 2], size: [.8, .08, .1] });
  for (const [yaw, x, z] of [[0, 0, -4], [180, 0, 4], [90, -5, 0], [-90, 5, 0]]) {
    const disk = ring("四面圆钟窗内真正保留中心轴孔的浅色透光表盘", "#d6d1b9", 1.4, 1.32, 0, .04); disk.position = { x: 0, y: 3.6, z: -.18 }; disk.rotation.x = 90; disk.opacity = .55;
    const rim = ring("圆钟窗边缘真正压住表盘并接合石壁的金属边圈", brass, 1.5, .12, 0, .1); rim.position = { x: 0, y: 3.6, z: -.18 }; rim.rotation.x = 90;
    p.push(...turn([disk, rim, cylinder("圆钟窗表盘中心真正连接指针和内部轴端的短枢轴", 0, 3.6, -.23, .12, .15, iron, [90, 0, 0]), beam("四面表盘上由中央枢轴实际支起的长分针", iron, [0, 3.6, -.26], [.55, 3.6 + Math.sqrt(3) * .55, -.26], .06), beam("四面表盘上由中央枢轴实际支起的短时针", iron, [0, 3.6, -.26], [-.7, 3.9, -.26], .08)], yaw!, [x!, 6.42, z!]));
    const marks: ModelPart[] = [];
    for (let i = 0; i < 12; i++) {
      const a = i * Math.PI / 6, cos = Math.cos(a), sin = Math.sin(a), outline: [number, number][] = [[1.08 * cos + .03 * sin, 1.08 * sin - .03 * cos], [1.28 * cos + .03 * sin, 1.28 * sin - .03 * cos], [1.28 * cos - .03 * sin, 1.28 * sin + .03 * cos], [1.08 * cos - .03 * sin, 1.08 * sin + .03 * cos]];
      marks.push(verticalPanel("钟面上实际贴接透光盘外表面的十二时标", outline, [], .04, [0, 3.6, -.22], 0, iron));
    }
    dialMarks.push(...turn(marks, yaw!, [x!, 6.42, z!]));
    p.push(beam("钟室中央机箱真正连到四面钟窗枢轴的水平传动长轴", iron, [0, 10.02, 0], [x! * 1.05, 10.02, z! * 1.065], .08));
  }
  p.push(combineMeshes("四面透光钟盘上真实独立的四十八个短金属时标", iron, dialMarks), boxesMesh("长外阶木扶手下真正落到踏面的连续立杆", wood, stairPosts));
  for (let start = 0; start < ladderRungs.length; start += 20) p.push(boxesMesh("钟室通向上部钟亭的固定直梯真实横档", iron, ladderRungs.slice(start, start + 20)));
  return p;
}
