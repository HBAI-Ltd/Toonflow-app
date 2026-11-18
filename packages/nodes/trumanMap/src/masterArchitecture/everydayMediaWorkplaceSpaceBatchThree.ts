import { part, type ModelPart } from "../assetModelParts";
import { glazedWall } from "./modernResidenceSpaceBatchOne";
import { boxesMesh, standingPanel, type SolidBox } from "./publicSpaceBatchEight";
import { stairFlight } from "./publicSpaceBatchSteps";
import { box, cylinder, design, rail, type ArchitecturePrototype } from "./structures";
import { hardFloor } from "./vernacularWorldBatchSix";

type Point = [number, number];
const paving = "#b2b4a8", timber = "#a78e69", steel = "#65797a", dark = "#4b5a5f", roof = "#839289", sand = "#c1b18c";

function materialPitFoleyWorkshop(): ModelPart[] {
  const pits: [number, number, number, number][] = [[-6, -1, -6, -1], [1, 6, -6, -1], [-6, -1, 1, 7], [1, 6, 1, 7]];
  const p: ModelPart[] = [
    box("完整拟音工场与外墙脚下共同的连续落地基础", 0, .08, 0, 29.2, .16, 29.2, paving),
    part("主入口从场地接入拟音工作坪的连续外坡", "extrude", paving, [0, 0, 0], [1, 1, 1], [0, -90, 0], { depth: 3.4, profile: [{ x: -16.8, y: 0 }, { x: -14.6, y: 0 }, { x: -14.6, y: .16 }] }),
    part("道具后勤大门接回后场的独立缓坡", "extrude", paving, [10, 0, 0], [1, 1, 1], [0, -90, 0], { depth: 3.4, profile: [{ x: 14.6, y: 0 }, { x: 17.2, y: 0 }, { x: 14.6, y: .16 }] }),
    part("东道具侧门接回场地的实际缓坡", "extrude", paving, [0, 0, -11.5], [1, 1, 1], [0, 0, 0], { depth: 3, profile: [{ x: 14.6, y: 0 }, { x: 17, y: 0 }, { x: 14.6, y: .16 }] }),
    part("西控制翼工作人员门独立接地的缓坡", "extrude", paving, [0, 0, 10.5], [1, 1, 1], [0, 0, 0], { depth: 2, profile: [{ x: -16.8, y: 0 }, { x: -14.6, y: 0 }, { x: -14.6, y: .16 }] }),
    box("拟音材料工场完整大跨度高屋盖", 2.775, 6.91, 0, 23.05, .22, 28.6, roof),
    box("侧置观察控制翼较低的独立完整屋盖", -11.275, 6.21, 0, 6.05, .22, 28.6, roof),
    box("观察控制夹层前缘后退以避让上行梯端的真实楼面", -11.15, 3.12, 1.25, 5.9, .16, 16.1, paving),
    ...glazedWall("控制翼前墙上下层真实采光窗", [-14, -14], [-8.5, -14], .16, 6.1, [[0, 1.10, 3.6, 1.5], [0, 3.95, 3.6, 1.5]]),
    ...glazedWall("拟音高厅前墙保留主入口及上部真实高窗", [-8.5, -14], [14, -14], .16, 6.8, [[-6, 4.7, 4.8, 1.3], [6, 4.7, 4.8, 1.3]], [[-2.75, .16, 3, 3]]),
    ...glazedWall("西控制翼完整外墙及真实工作人员出口", [-14, -14], [-14, 14], .16, 6.1, [[-10, 1.10, 3, 1.5], [-1, 1.10, 5, 1.5], [-1, 3.95, 5, 1.5], [6, 3.95, 4, 1.5]], [[10.5, .16, 1.5, 2.5]]),
    ...glazedWall("东高厅外墙真实道具宽门及高位窗", [14, -14], [14, 14], .16, 6.8, [[-3, 4.7, 5, 1.3], [7, 4.7, 5, 1.3]], [[-11.5, .16, 3, 3]]),
    ...glazedWall("控制翼后工作间朝后场的真实人员门", [-14, 14], [-8.5, 14], .16, 6.1, [[0, 3.95, 3.6, 1.5]], [[0, .16, 1.5, 2.5]]),
    ...glazedWall("拟音高厅后壁完整装卸门与顶部采光窗", [-8.5, 14], [14, 14], .16, 6.8, [[-4.5, 4.7, 7, 1.3]], [[7.25, .16, 3.4, 3.8]]),
    ...glazedWall("高低屋盖之间完整分隔壁及朝材料坪的真实观察长窗", [-8.5, -14], [-8.5, 14], .16, 6.8, [[1, 3.8, 10, 1.5]], [[-11, .16, 1.5, 2.5], [11, .16, 1.5, 2.5]]),
    ...glazedWall("控制夹层与前梯厅之间逐层独立的真实通门墙", [-14, -6.5], [-8.5, -6.5], .16, 6.1, [], [[.25, .16, 1.5, 2.5], [.25, 3.2, 1.5, 2.4]]),
    ...glazedWall("控制夹层后部承墙及地面后勤工作间通门", [-14, 9], [-8.5, 9], .16, 6.1, [[0, 3.95, 3.8, 1.5]], [[.25, .16, 1.5, 2.5]]),
    hardFloor("架空干工作薄地台真正挖出四个独立材料坑", timber, [[-7.5, -8], [7.5, -8], [7.5, 10], [-7.5, 10]], .18, [0, .62, 0], pits.map(([left, right, front, back]): Point[] => [[left, front], [right, front], [right, back], [left, back]])),
    box("砂土拟音坑低于环形干道的真实材料填层", -3.5, .28, -3.5, 5, .24, 5, sand),
    box("碎石拟音坑独立低位底料", -3.5, .28, 4, 5, .24, 6, "#929c94"),
    box("浅湿拟音坑连续封闭的实际底衬", 3.5, .21, 4, 5, .10, 6, dark),
    part("低于干道边缘并在浅湿坑内的真实独立水面", "box", "#719b9c", [3.5, .51, 4], [4.76, .02, 5.76], [0, 0, 0], { opacity: .55, roughness: .25 }),
    stairFlight("砂土坑从材料面接回环形干道的两级短梯", -1.8, .4, -5.15, .7, 2, .2, .35, true),
    stairFlight("木板坑从架空木面接回干道的两级短梯", 1.8, .52, -5.15, .7, 2, .14, .35, true),
    stairFlight("碎石坑末端从低位材料面升到环道的两级短梯", -1.8, .4, 5.9, .7, 2, .2, .35),
    stairFlight("浅湿坑由真实底衬逐级升到干道的三级短梯", 1.8, .26, 5.75, .7, 3, .18, .3),
    stairFlight("拟音工场地面接入架空干工作坪的四级前梯", 0, .16, -9.4, 1.8, 4, .16, .35),
    part("道具推车不穿材料坑直接接入高工作坪的长缓坡", "extrude", paving, [9.2, 0, 0], [1, 1, 1], [0, -90, 0], { depth: 2, profile: [{ x: -13, y: .16 }, { x: -5, y: .16 }, { x: -5, y: .8 }] }),
    box("推车坡高端实际与工作坪侧边重叠的平落脚台", 8.75, .71, -4.6, 3.1, .18, .8, timber),
    stairFlight("西观察控制夹层前梯厅的第一跑实体楼梯", -11, .16, -12, 1.4, 8, .19, .28),
    box("两跑同向控制楼梯之间实际落在支柱上的中休台", -11, 1.60, -9.51, 1.6, .16, .66, paving),
    stairFlight("西观察控制夹层接至三点二米楼面的第二跑楼梯", -11, 1.68, -9.26, 1.4, 8, .19, .28),
    box("最高踏步与控制室门槛之间连续且不盖低级踏步的落脚台", -11, 3.12, -6.77, 1.6, .16, .7, paving),
    box("夹层观察长窗前实际落在楼面上的调音制作台", -9.7, 3.65, 1, 1.3, .9, 6.4, steel),
    box("拟音工场东侧避开长坡工作通道的落地道具工作台", 12.5, .61, -8.5, 2, .9, 2, timber),
  ];
  const retaining: SolidBox[] = [], stageStructure: SolidBox[] = [], landingStructure: SolidBox[] = [], joists: SolidBox[] = [], planks: SolidBox[] = [], wetLining: SolidBox[] = [];
  for (const [left, right, front, back] of pits) {
    for (const x of [left - .07, right + .07]) retaining.push({ center: [x, .48, (front + back) / 2], size: [.14, .64, back - front + .28] });
    for (const z of [front - .07, back + .07]) retaining.push({ center: [(left + right) / 2, .48, z], size: [right - left + .28, .64, .14] });
  }
  for (const x of [-7.2, 7.2]) {
    for (const z of [-7.6, -1, 5, 9.6]) stageStructure.push({ center: [x, .39, z], size: [.24, .46, .24] });
    stageStructure.push({ center: [x, .59, 1], size: [.2, .12, 17.6] });
  }
  for (const z of [-7.6, 9.6]) stageStructure.push({ center: [0, .59, z], size: [14.4, .12, .2] });
  for (const x of [-1.8, 1.8]) landingStructure.push({ center: [x, .70, -5.95], size: [.7, .20, .5] });
  landingStructure.push({ center: [-1.8, .70, 6.75], size: [.7, .20, .7] }, { center: [1.8, .70, 6.8], size: [.7, .20, .7] });
  for (const z of [-5.1, -3.4, -1.7]) joists.push({ center: [3.5, .31, z], size: [4.8, .30, .16] });
  for (let index = 0; index < 9; index++) planks.push({ center: [1.35 + index * .53, .48, -3.5], size: [.45, .08, 4.85] });
  for (const x of [1.06, 5.94]) wetLining.push({ center: [x, .455, 4], size: [.12, .39, 6] });
  for (const z of [1.06, 6.94]) wetLining.push({ center: [3.5, .455, z], size: [5, .39, .12] });
  p.push(boxesMesh("四座材料坑的真实竖直挡壁贴合地台孔边并落在基础上", dark, retaining), boxesMesh("架空环形工作坪下连续承梁与八个实际落地支脚", steel, stageStructure), boxesMesh("四座材料坑短梯高端实际跨孔边接回干道的落脚板", timber, landingStructure), boxesMesh("木面拟音坑里真实落在基础上的三道承托木搁栅", timber, joists), boxesMesh("木面拟音坑中实际咬入搁栅的九条独立木板", timber, planks), boxesMesh("浅湿拟音坑与底衬连续相接且保持上方开敞的四面薄衬", dark, wetLining));
  for (const [row, z] of [1.8, 3.2, 4.6, 6].entries()) for (const [column, x] of [-5.5, -4.3, -3.1].entries()) p.push(part("碎石踏音坑里每颗真实落在底料面上的圆砾", "sphere", column % 2 ? "#9a9d94" : "#818e89", [x, .46, z], [.16 + .035 * ((row + column) % 3), .12, .18 + .035 * (row % 2)]));
  const supports: SolidBox[] = [], lowBeams: SolidBox[] = [], rack: SolidBox[] = [], monitors: SolidBox[] = [], handrailPosts: SolidBox[] = [];
  for (const x of [-8.5, 13.8]) for (const z of [-13.5, -6, 2, 10, 13.5]) supports.push({ center: [x, 3.48, z], size: [.3, 6.64, .3] });
  for (const x of [-13.8, -8.7]) for (const z of [-6.5, 1, 9]) supports.push({ center: [x, 1.60, z], size: [.24, 2.88, .24] });
  for (const x of [8.4, 9.9]) supports.push({ center: [x, .39, -4.6], size: [.24, .46, .24] });
  for (const x of [-11.65, -10.35]) supports.push({ center: [x, .84, -9.51], size: [.20, 1.36, .2] });
  for (const z of [-6.5, 1, 9]) {
    lowBeams.push({ center: [-11.25, 3.02, z], size: [5.8, .24, .18] });
    lowBeams.push({ center: [-11.25, 6.02, z], size: [5.8, .24, .18] });
  }
  p.push(boxesMesh("高厅壁柱夹层落地支柱与坡台中休台支脚实际承接组", steel, supports), boxesMesh("控制夹层楼面及低屋盖真实跨接两侧承墙的横梁", steel, lowBeams));
  for (const z of [-6, 2, 10]) {
    const holes: Point[][] = [-6.3, -1.75, 2.8, 7.35, 11.9].map(x => [[x - 1.85, 6.25], [x, 5.85], [x + 1.85, 6.25], [x, 6.65]]);
    p.push(standingPanel("两端实接承墙且托住高屋盖的真穿孔板式横梁", steel, [[-8.6, 5.7], [14.1, 5.7], [14.1, 6.82], [-8.6, 6.82]], holes, z, .14));
  }
  for (const x of [13, 13.9]) for (const z of [7.1, 9.9]) rack.push({ center: [x, 1.76, z], size: [.10, 3.2, .10] });
  for (const y of [.70, 1.80, 3.25]) rack.push({ center: [13.45, y, 8.5], size: [1, .12, 3] });
  p.push(boxesMesh("东后道具间贴墙真实开格且各层板咬入立柱的器材架", timber, rack));
  for (const z of [-1.2, 1.2, 3.6]) monitors.push({ center: [-9.65, 4.35, z], size: [.08, .50, .8] }, { center: [-9.65, 4.12, z], size: [.08, .22, .12] });
  p.push(boxesMesh("观察控制长台上实际相接的立架与制作显示屏", dark, monitors));
  for (const x of [-11.66, -10.34]) {
    p.push(rail([x, 1.23, -11.86], [x, 2.56, -9.90], .05, steel), rail([x, 2.75, -9.12], [x, 4.08, -7.16], .05, steel), rail([x, 2.56, -9.90], [x, 2.75, -9.12], .05, steel));
    for (const [z, bottom] of [[-11.86, .35], [-9.90, 1.68], [-9.12, 1.87], [-7.16, 3.2]]) handrailPosts.push({ center: [x, bottom + .44, z], size: [.05, .92, .05] });
    handrailPosts.push({ center: [x, 2.17, -9.51], size: [.05, 1.02, .05] });
  }
  p.push(boxesMesh("各跑梯级及中休台上逐个真实着落的十根扶手立柱", steel, handrailPosts));
  for (const [index, z] of [-4, 2, 8].entries()) {
    p.push(part("拟音高厅上方真实悬吊的宽声学反射板", "box", timber, [2, 5.15, z], [10, .12, 2], [index % 2 ? -3 : 3, 0, 0]));
    for (const x of [-1.5, 5.5]) p.push(rail([x, 5.18, z], [x, 6.85, z], .025, steel));
  }
  for (const [x, z] of [[-6.6, -3.2], [.65, 4], [6.8, 3.8]]) {
    p.push(cylinder("材料拟音干道上实际落地的收音杆圆底座", x, .83, z, .32, .06, dark), cylinder("收音支架与真实底座相接的立管", x, 1.55, z, .035, 1.44, steel), rail([x, 2.22, z], [x + .55, 2.12, z], .035, dark));
  }
  return p;
}

export const everydayMediaWorkplaceSpaceBatchThreeDesigns: ArchitecturePrototype[] = [
  design("材料坑环道拟音制作工场", "完整高厅内的架空干工作坪围合砂土、木板、碎石和浅湿四座真实下沉材料坑，独立短梯与连续环道接回长推车坡；西侧观察控制夹层由两跑楼梯抵达，东后道具搬运路径独立，穿孔大梁和低高屋盖共同闭合整座制作工场", materialPitFoleyWorkshop, "建筑", "现代"),
];
