import { beam, part, type ModelPart, type Triple } from "../assetModelParts";
import { box, cylinder, design, type ArchitecturePrototype } from "./structures";
import { standingPanel } from "./publicSpaceBatchOne";
import { boxesMesh, type SolidBox } from "./publicSpaceBatchEight";
import { stairFlight } from "./publicSpaceBatchSteps";
import { hardFloor } from "./vernacularWorldBatchSix";
import { slopePanel } from "./vernacularWorldBatchOne";

const floorColor = "#b6b7a7", wallColor = "#c3c4b5", roofColor = "#657c7c", steel = "#4f6568", timber = "#ad9672", rubber = "#839d97", glass = "#9bbfbe";
type Point = [number, number];

function openingWall(name: string, position: Triple, width: number, height: number, opening: [number, number], yaw = 0, doorHeight = 2.4, color = wallColor): ModelPart {
  const [left, right] = opening;
  const value = standingPanel(name, color, [[-width / 2, 0], [left, 0], [left, doorHeight], [right, doorHeight], [right, 0], [width / 2, 0], [width / 2, height], [-width / 2, height]], [], 0, .24);
  value.position = { x: position[0], y: position[1], z: position[2] }; value.rotation.y = yaw;
  return value;
}

function rangeRoofAt(z: number): number { return 5.4 + (z + 11) * .025; }

function soundLockShootingHall(): ModelPart[] {
  const p: ModelPart[] = [box("接待横翼长靶道与独立检修廊共同落地的完整楼面", 0, .12, 0, 16, .24, 42, floorColor)];
  p.push(slopePanel("高靶道屋盖由前低后高连续跨过厚侧墙", [[-8.15, rangeRoofAt(-11.12) + .22, -11.12], [5.12, rangeRoofAt(-11.12) + .22, -11.12], [5.12, rangeRoofAt(21.12) + .22, 21.12], [-8.15, rangeRoofAt(21.12) + .22, 21.12]], .22, roofColor), box("接待及折转声闸使用的完整低屋盖", 0, 3.79, -16, 16.3, .22, 10.3, roofColor), box("不与射位混流的侧检修廊独立低屋盖", 6.5, 3.49, 5, 3.26, .22, 32.3, roofColor));
  const front = standingPanel("接待前立面真实开出中央主门及两侧长窗", wallColor, [[-8, .24], [-1.2, .24], [-1.2, 2.84], [1.2, 2.84], [1.2, .24], [8, .24], [8, 3.68], [-8, 3.68]], [[[-7, 1], [-2, 1], [-2, 2.9], [-7, 2.9]], [[2, 1], [7, 1], [7, 2.9], [2, 2.9]]], -21, .24);
  p.push(front);
  for (const x of [-4.5, 4.5]) p.push(part("接待前真实窗孔内独立低反光玻璃", "box", glass, [x, 1.95, -21], [5, 1.9, .035], [0, 0, 0], { opacity: .24, roughness: .18 }));
  p.push(box("接待低横翼左侧封闭承屋墙", -8, 1.96, -16, .24, 3.44, 10, wallColor), box("接待低横翼右侧封闭承屋墙", 8, 1.96, -16, .24, 3.44, 10, wallColor), box("独立检修廊整面外侧厚围护", 8, 1.86, 5, .24, 3.24, 32, wallColor));
  const rangeFront = standingPanel("接待翼与高靶道厅之间只有声闸末门及控制观察窗的完整隔墙", wallColor, [[-8, .24], [-6.1, .24], [-6.1, 2.64], [-4.9, 2.64], [-4.9, .24], [5, .24], [5, 5.4], [-8, 5.4]], [[[.1, 1.2], [3.8, 1.2], [3.8, 2.8], [.1, 2.8]]], -11, .28);
  p.push(rangeFront, part("从前接待控制间透视射位后廊的真实观察玻璃", "box", glass, [1.95, 2, -11], [3.7, 1.6, .045], [0, 0, 0], { opacity: .24, roughness: .2 }));
  const west = standingPanel("高靶道长侧墙真实保留射位后方紧急侧门且随斜屋面闭合", wallColor, [[-16, 0], [14.55, 0], [14.55, 2.4], [15.85, 2.4], [15.85, 0], [16, 0], [16, rangeRoofAt(-11) - .24], [-16, rangeRoofAt(21) - .24]], [], 0, .3);
  west.position = { x: -8, y: .24, z: 5 }; west.rotation.y = 90;
  const divider = standingPanel("检修廊与长靶道之间连续隔墙只在集弹后室真正留门", wallColor, [[-16, 0], [-15.45, 0], [-15.45, 2.2], [-14.05, 2.2], [-14.05, 0], [16, 0], [16, rangeRoofAt(-11) - .24], [-16, rangeRoofAt(21) - .24]], [], 0, .3);
  divider.position = { x: 5, y: .24, z: 5 }; divider.rotation.y = 90;
  const rear = standingPanel("靶道高后墙与侧检修廊低后墙真实错高并留独立服务出口", wallColor, [[-8, .24], [5.85, .24], [5.85, 2.64], [7.15, 2.64], [7.15, .24], [8, .24], [8, 3.38], [5, 3.38], [5, 6.2], [-8, 6.2]], [], 21, .3);
  p.push(west, divider, rear, openingWall("前服务室真正接入独立长检修廊的后门", [6.5, .24, -11], 3, 3.14, [-.65, .65], 0, 2.4), openingWall("接待空间与右侧服务室之间真实开门的分隔墙", [3.8, .24, -16], 10, 3.44, [.45, 1.75], 90));
  p.push(openingWall("折转声闸第一道前门", [-4.4, .24, -16], 4, 3.44, [-1.7, -.5], 0, 2.4, steel), openingWall("两道声闸内门之间错位布置的折转隔墙", [-4.4, .24, -13.5], 4, 3.44, [.5, 1.7], 0, 2.4, steel), box("声闸左边连续连接前后隔墙的厚吸声侧壁", -6.4, 1.96, -13.5, .22, 3.44, 5.2, steel), box("声闸右边连续连接前后隔墙的厚吸声侧壁", -2.4, 1.96, -13.5, .22, 3.44, 5.2, steel));
  p.push(part("主入口从外部地面连续接入馆内地坪的短实坡", "extrude", floorColor, [0, 0, -22.1], [1, 1, 1], [0, -90, 0], { depth: 3.2, profile: [{ x: -1.1, y: 0 }, { x: 1.1, y: 0 }, { x: 1.1, y: .24 }, { x: -1.1, y: .02 }] }), part("射位后方侧门真正回落到外部地面的完整实坡", "extrude", floorColor, [-9, 0, -10.2], [1, 1, 1], [0, 0, 0], { depth: 1.8, profile: [{ x: -1, y: 0 }, { x: 1, y: 0 }, { x: 1, y: .24 }, { x: -1, y: .02 }] }), part("检修廊独立后出口直接回到外地面的短实坡", "extrude", floorColor, [6.5, 0, 21.85], [1, 1, 1], [0, -90, 0], { depth: 1.8, profile: [{ x: -.85, y: 0 }, { x: .85, y: 0 }, { x: .85, y: .02 }, { x: -.85, y: .24 }] }));

  const screens: SolidBox[] = [], benches: SolidBox[] = [], hangers: SolidBox[] = [], rails: SolidBox[] = [], services: SolidBox[] = [];
  for (let lane = 0; lane < 6; lane++) {
    const length = lane === 0 ? 2.05 : 2.5;
    screens.push({ center: [-7.8 + lane * 2.4, 1.34, -7.45 - length / 2], size: [.09, 2.2, length] });
  }
  for (const x of [-6.6, -4.2, -1.8, .6, 3]) {
    benches.push({ center: [x, 1.12, -8], size: [2.25, .12, .65] }, { center: [x - .85, .65, -8], size: [.12, .82, .5] }, { center: [x + .85, .65, -8], size: [.12, .82, .5] });
    rails.push({ center: [x, 3.85, 4.2], size: [.07, .09, 24.5] }, { center: [x, 2.95, 16.2], size: [.045, 1.71, .045] });
    p.push(box("在回收吊架下实际悬挂而不贴在实墙上的完整靶板", x, 1.72, 16.2, .64, .88, .04, "#d8d6c5"), cylinder("完整靶板正面中央独立圆形训练标记", x, 1.72, 16.173, .24, .016, steel, [90, 0, 0]));
  }
  p.push(boxesMesh("射位之间落在地坪且保留后方横通廊的独立厚护屏", steel, screens), boxesMesh("每个射位都有真正落地支脚的完整射击托台", timber, benches), boxesMesh("各靶回收轨与实际连到靶板顶部的吊杆", steel, rails));
  for (const z of [-5.5, -1.5, 2.5, 6.5, 10.5, 14.5]) {
    p.push(part("在射线上方连续横跨且前后搭接的倾斜上挡板", "box", steel, [-1.5, 4.33, z], [12.6, .12, 1.8], [-24, 0, 0]));
    for (const x of [-7.45, 4.45]) hangers.push({ center: [x, (rangeRoofAt(z) + 4.33) / 2, z], size: [.07, rangeRoofAt(z) - 4.33 + .08, .07] });
  }
  for (const z of [-8, -4, 0, 4, 8, 12, 16.45]) {
    p.push(beam("靶回收长轨每段实际交叠接合的横向承轨梁", steel, [-7.85, 3.96, z], [4.85, 3.96, z], .16, .12));
    for (const x of [-7.45, 4.45]) hangers.push({ center: [x, (rangeRoofAt(z) + 4) / 2, z], size: [.085, rangeRoofAt(z) - 4 + .08, .085] });
  }
  for (let start = 0; start < hangers.length; start += 20) p.push(boxesMesh("上挡板和分段承轨梁两端确实接入高屋盖的短吊杆", steel, hangers.slice(start, start + 20)));
  p.push(slopePanel("末端集弹背板从上前方向后下方连续收进低接收槽", [[-7.65, 3.68, 17.1], [4.65, 3.68, 17.1], [4.65, .62, 19.2], [-7.65, .62, 19.2]], .13, steel), box("集弹背板下缘真正接到地坪的接收槽厚底", -1.5, .4, 19.25, 12.4, .32, .8, steel), box("集弹后室与后外墙之间保持可步行的维护地板", -1.5, .26, 20.05, 12.4, .04, 1.6, rubber));
  services.push({ center: [2, .75, -17.8], size: [2.2, 1.02, .65] }, { center: [2, 1.29, -17.8], size: [2.4, .08, .85] }, { center: [.9, .62, -11.6], size: [2.7, .76, .55] }, { center: [.9, 1.04, -11.6], size: [2.9, .08, .7] }, { center: [-7.22, .5, -18.5], size: [.65, .52, 2.3] });
  p.push(boxesMesh("接待工作台观察控制台及入场更换装备长座实际落地", timber, services));
  for (const z of [-10.5, -2, 6.5, 15, 20.5]) p.push(beam("高屋盖横向承梁真实接入两侧厚墙并避开射线", steel, [-7.9, rangeRoofAt(z) - .09, z], [4.9, rangeRoofAt(z) - .09, z], .2, .28));
  return p;
}

function gymRoofAt(x: number): number { return 10 + (x + 14) * .05; }

function splitWingGymnasticsHall(): ModelPart[] {
  const outline: Point[] = [[-14, -22], [-6, -22], [-6, -12], [15, -12], [15, 16], [-14, 16]];
  const pit: Point[] = [[-12, -3], [-4, -3], [-4, 5], [-12, 5]];
  const p: ModelPart[] = [hardFloor("助跑长翼前更衣横翼和主厅真正相连且中间挖空软坑的整体承重地台", floorColor, outline, 1.5, [0, 0, 0], [pit]), box("在承重地台真实坑底闭合的完整低位软坑底板", -8, .1, 1, 8, .2, 8, steel)];
  p.push(slopePanel("体操主厅随横向高差连续跨过两侧承屋墙的高大屋盖", [[-14.15, gymRoofAt(-14.15) + .24, -4.15], [9.15, gymRoofAt(9.15) + .24, -4.15], [9.15, gymRoofAt(9.15) + .24, 16.15], [-14.15, gymRoofAt(-14.15) + .24, 16.15]], .24, roofColor), box("助跑长翼低于主厅且完整独立承托的长屋盖", -10, 7.42, -13, 8.3, .24, 18.3, roofColor), box("前更衣低横翼与高主厅形成真实屋面高差的完整顶板", 1.5, 5.62, -8, 15.3, .24, 8.3, roofColor), box("右侧上下公共廊共同围合的独立中高屋盖", 12, 8.12, 2, 6.3, .24, 28.3, roofColor));
  p.push(box("助跑翼前端没有假入口的完整封闭端墙", -10, 4.4, -22, 8, 5.8, .24, wallColor), box("助跑翼外侧真正从地台支到低屋盖的完整长墙", -14, 4.4, -13, .24, 5.8, 18, wallColor), openingWall("助跑长翼经前更衣横翼进入的独立侧门", [-6, 1.5, -13], 18, 5.8, [-5.7, -4.3], 90), openingWall("运动员由前场进入更衣低横翼的独立入口", [1.5, 1.5, -12], 15, 4, [-1.2, 1.2], 0, 2.6));
  const publicFront = standingPanel("观众独立前门和真实透视上行梯的高窗共同组成公共翼前墙", wallColor, [[-3, 0], [-.3, 0], [-.3, 2.6], [2.1, 2.6], [2.1, 0], [3, 0], [3, 6.5], [-3, 6.5]], [[[-2.4, 3], [2.4, 3], [2.4, 5.7], [-2.4, 5.7]]], 0, .24);
  publicFront.position = { x: 12, y: 1.5, z: -12 };
  p.push(publicFront, part("公共翼前墙真窗孔内可以看见独立观众梯的玻璃", "box", glass, [12, 5.85, -12], [4.8, 2.7, .035], [0, 0, 0], { opacity: .24, roughness: .18 }), openingWall("更衣区与助跑准备区之间真实开门的低隔墙", [-2, 1.5, -8], 8, 4, [-.65, .65], 90), box("观众前梯厅与运动员更衣翼之间没有互穿假门的实隔墙", 9, 4.75, -8, .24, 6.5, 8, wallColor));
  const gymFront = standingPanel("助跑长翼宽口和运动员入厅门在高主厅前墙上各自真实贯通", wallColor, [[-14, 1.5], [-13.5, 1.5], [-13.5, 7.1], [-6.5, 7.1], [-6.5, 1.5], [.3, 1.5], [.3, 4.1], [2.7, 4.1], [2.7, 1.5], [9, 1.5], [9, gymRoofAt(9)], [-14, gymRoofAt(-14)]], [[[-5.5, 7.8], [7, 7.8], [7, 9.3], [-5.5, 9.3]]], -4, .28);
  p.push(gymFront, part("低横翼屋顶以上真实长高窗中的独立采光玻璃", "box", glass, [.75, 8.55, -4], [12.5, 1.5, .045], [0, 0, 0], { opacity: .24, roughness: .18 }), box("高主厅西侧承住斜屋盖低端的完整厚围墙", -14, 5.75, 6, .26, 8.5, 20, wallColor));
  const east = standingPanel("公共廊外墙上下两道真实长窗分别服务地面和观摩夹层", wallColor, [[-14, 0], [14, 0], [14, 6.5], [-14, 6.5]], [[[-10, .9], [10, .9], [10, 2.2], [-10, 2.2]], [[-10, 3.5], [10, 3.5], [10, 5.9], [-10, 5.9]]], 0, .24);
  east.position = { x: 15, y: 1.5, z: 2 }; east.rotation.y = 90;
  p.push(east);
  for (const [y, height] of [[3.05, 1.3], [6.2, 2.4]]) p.push(part("公共长廊真窗洞内随两层标高布置的独立玻璃", "box", glass, [15, y!, 2], [20, height!, .035], [0, 90, 0], { opacity: .24, roughness: .18 }));
  const viewingWall = standingPanel("上层观众只能透过真长窗向低训练场观察的独立分隔墙", wallColor, [[-10, 0], [10, 0], [10, gymRoofAt(9) - 1.5], [-10, gymRoofAt(9) - 1.5]], [[[-8, 3.4], [8, 3.4], [8, 5.7], [-8, 5.7]]], 0, .26);
  viewingWall.position = { x: 9, y: 1.5, z: 6 }; viewingWall.rotation.y = 90;
  p.push(viewingWall, part("上层观摩长窗真实洞口中可俯看软坑和弹性地板的玻璃", "box", glass, [9, 6.05, 6], [16, 2.3, .045], [0, 90, 0], { opacity: .22, roughness: .18 }));
  const rear = standingPanel("主厅高斜后墙与公共廊低后墙真正错高并各自留下疏散门", wallColor, [[-14, 1.5], [-11.8, 1.5], [-11.8, 4.1], [-10.2, 4.1], [-10.2, 1.5], [11.1, 1.5], [11.1, 4.1], [12.9, 4.1], [12.9, 1.5], [15, 1.5], [15, 8], [9, 8], [9, gymRoofAt(9)], [-14, gymRoofAt(-14)]], [], 16, .26);
  p.push(rear, box("真实夹层楼板从上行梯终点起铺而不封住前梯厅的楼板缺口", 12, 4.35, 5.6, 6, .3, 20.8, floorColor), stairFlight("观众梯第一连续十级从公共地面上行", 11, 1.5, -10.8, 2.4, 10, .15, .3), stairFlight("观众梯第二连续十级与夹层前沿同高接实", 11, 3, -7.8, 2.4, 10, .15, .3));
  const posts: SolidBox[] = [], pitFoam: SolidBox[] = [], padFeet: SolidBox[] = [], furniture: SolidBox[] = [];
  for (const x of [9.8, 12.2]) {
    p.push(beam("观众上行梯两侧从低层连续升到夹层的实扶手", steel, [x, 2.55, -10.8], [x, 5.55, -4.8], .055));
    for (const [z, y] of [[-10.8, 1.5], [-7.8, 3], [-4.8, 4.5]]) posts.push({ center: [x, y! + .525, z!], size: [.05, 1.05, .05] });
  }
  for (const [x, width] of [[9.4, .8], [13.6, 2.8]]) {
    p.push(box("夹层前沿在真实楼梯开口之外才闭合的护栏横扶手", x!, 5.55, -4.8, width!, .06, .06, steel));
    for (const end of [-1, 1]) posts.push({ center: [x! + end * width! / 2, 5.025, -4.8], size: [.05, 1.05, .05] });
  }
  p.push(boxesMesh("楼梯和夹层缺口边的护栏立杆实际落在对应标高踏面或楼板", steel, posts));
  for (const z of [-4.5, .5, 5.5, 10.5, 15.5]) p.push(beam("公共夹层楼板下横梁确实搭接两侧墙和板底", steel, [9, 4.1, z], [15, 4.1, z], .22, .25));
  for (const x of [1.5, 12.9]) p.push(stairFlight("两条各自独立的临街入口阶梯从地面接到抬高地台", x, 0, -15, 2.4, 10, .15, .3));
  for (const x of [-11, 12]) p.push(stairFlight("后侧不同使用人流的独立落地疏散阶梯", x, 0, 19, 2.2, 10, .15, .3, true));
  for (const x of [-12.08, -3.92]) p.push(box("软坑两侧连续落在承重坑沿的厚软包边", x, 1.52, 1, .2, .12, 8.4, rubber));
  for (const z of [-3.08, 5.08]) p.push(box("软坑两端直接接住助跑或侧移落点的厚软包边", -8, 1.52, z, 8.4, .12, .2, rubber));
  for (let row = 0; row < 6; row++) for (let column = 0; column < 6; column++) {
    const h = 1.03 + ((row + column * 2) % 3) * .055;
    pitFoam.push({ center: [-11.3 + column * 1.32, .2 + h / 2, -2.3 + row * 1.32], size: [1.2, h, 1.2] });
    padFeet.push({ center: [-3 + column * 2, 1.56, 3 + row * 2], size: [.42, .12, .42] });
  }
  for (let start = 0; start < pitFoam.length; start += 18) p.push(boxesMesh("在真实深坑底板上铺满且顶面低于安全坑沿的独立缓冲泡沫块", start ? "#b4bdaa" : "#8da69f", pitFoam.slice(start, start + 18)), boxesMesh("完整弹性地板之下实际承托木板的弹性垫脚网格", steel, padFeet.slice(start, start + 18)));
  p.push(box("由实际弹性垫脚托起且具有真实架空厚度的完整训练地板", 2, 1.71, 8, 12, .18, 12, timber), box("从助跑翼前端贯通到坑前起跳位的完整长助跑面", -10, 1.535, -13.8, 2.1, .07, 14.8, rubber), cylinder("坑前固定训练台真实落在地台的独立支承柱", -10, 1.96, -4.75, .3, .92, steel), part("助跑末端实际接到支承柱的完整圆收撑越面", "sphere", timber, [-10, 2.53, -4.75], [1.1, .38, 1.15]), part("助跑面通向坑前训练台的真实上升起跳斜板", "extrude", timber, [-10, 1.5, -5.8], [1, 1, 1], [0, -90, 0], { depth: .85, profile: [{ x: -.65, y: 0 }, { x: .65, y: 0 }, { x: .65, y: .24 }, { x: -.65, y: .05 }] }));
  for (const x of [-3.8, 7.8]) furniture.push({ center: [x, 1.805, 8], size: [.045, .01, 11.6] });
  for (const z of [2.2, 13.8]) furniture.push({ center: [2, 1.805, z], size: [11.6, .01, .045] });
  furniture.push({ center: [-4, 2.4, -10.9], size: [2.5, 1.8, .6] }, { center: [-4.8, 1.97, -6.1], size: [.5, .14, 2.5] }, { center: [-4.8, 1.7, -6.9], size: [.35, .4, .2] }, { center: [-4.8, 1.7, -5.3], size: [.35, .4, .2] }, { center: [13.9, 4.93, 6], size: [.55, .14, 12] }, { center: [13.9, 4.7, 1], size: [.4, .4, .25] }, { center: [13.9, 4.7, 11], size: [.4, .4, .25] });
  p.push(boxesMesh("弹性地板真实边界覆条以及更衣与高观摩廊各自落地的固定收纳长座", timber, furniture));
  for (const z of [-3.5, 1.5, 6.5, 11.5, 15.5]) p.push(beam("高训练厅斜屋盖下横梁真正搭接两侧承屋墙", steel, [-13.9, gymRoofAt(-13.9) - .11, z], [8.9, gymRoofAt(8.9) - .11, z], .24, .3));
  return p;
}

export const everydayTrainingVenueSpaceBatchOneDesigns: ArchitecturePrototype[] = [
  design("分流声闸长靶道射击训练馆", "接待低横翼经三道错位声闸门接到高靶道厅，另一侧服务室独立通向长检修廊及集弹后室；随纵向抬升的屋盖和厚侧墙真正围合长射线，射位后横通廊与独立紧急出口分开，上挡板吊入横梁，末端斜集弹背板下收至接收槽", soundLockShootingHall, "建筑", "现代"),
  design("折翼双高厅下沉软坑体操训练馆", "长助跑翼以真实宽口接入主厅下沉软坑，侧向完整弹性训练地板与前更衣横翼形成折翼平面；运动员在抬高地台上进入低横翼，观众从分开的前门沿连续二十级内梯进入上层观摩廊，楼板避让梯厅，真长窗向低训练场开放视线，四段不同屋盖由实际围墙及横梁承托", splitWingGymnasticsHall, "建筑", "现代"),
];
