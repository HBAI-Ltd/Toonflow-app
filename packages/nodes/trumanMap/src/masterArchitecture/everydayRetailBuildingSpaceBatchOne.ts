import { part, type ModelPart } from "../assetModelParts";
import { glazedWall } from "./modernResidenceSpaceBatchOne";
import { boxesMesh, type SolidBox } from "./publicSpaceBatchEight";
import { stairFlight } from "./publicSpaceBatchTwo";
import { box, design, rail, type ArchitecturePrototype } from "./structures";
import { slopePanel } from "./vernacularWorldBatchOne";
import { hardFloor } from "./vernacularWorldBatchSix";

const paving = "#b8baad", timber = "#a18a69", cover = "#718984", steel = "#596f71", paper = "#d7d3bd";

export const everydayRetailBuildingSpaceBatchOneDesigns: ArchitecturePrototype[] = [
  design("双翼书廊跨厅夹层书店", "偏置低入口附厅接入有屋盖的通高中厅，左右夹层书廊由后横桥相连；西翼二十级实体楼梯沿真实边井上行，列柱和跨梁承担书廊与中央高侧窗屋盖，前后入口及梯顶横道均保持可通行", galleryBookshop, "建筑", "现代"),
  design("错翼双院花艺零售工作坊", "前街零售翼与后巷花艺工作翼错位，由较低窄连廊接成完整Z形店壳；两侧对角作业院各有真实进出门，左院有立柱承托的工作雨棚，花材车可从后巷直接进入工作间而不穿过顾客橱窗区", staggeredFloristWorkshop, "建筑", "现代"),
  design("折角双街展厅内凹取货家具店", "沿两条街展开的低L形展厅接入高货库，后部货库真实退凹形成有顶装货湾；临街双人行入口与后巷宽货门分流，内库另有顾客厅员工门和移货门，承屋柱梁、库架通道与装货湾支承均为实际构造", loadingBayFurnitureShop, "建筑", "现代"),
];

function galleryBookshop(): ModelPart[] {
  const p: ModelPart[] = [
    hardFloor("偏置入口附厅与通高主厅连成一体的折角地坪", paving, [[-8, -13], [-1, -13], [-1, -9], [8, -9], [8, 11], [-8, 11]], .2, [0, 0, 0]),
    hardFloor("两翼夹层与后跨桥一体楼板并在西翼真实退让梯井", timber, [[-8, -7], [-6.8, -7], [-6.8, -.6], [-4.6, -.6], [-4.6, -7], [-3, -7], [-3, 7], [3, 7], [3, -7], [8, -7], [8, 11], [-8, 11]], .25, [0, 3.05, 0]),
    box("西侧书廊外墙与内列柱共同支起低屋盖", -5.55, 6.225, 1, 5.6, .25, 20.6, cover),
    box("东侧书廊外墙与内列柱共同支起低屋盖", 5.55, 6.225, 1, 5.6, .25, 20.6, cover),
    box("覆盖中厅且由两条高侧窗壁承住的通长高屋盖", 0, 7.325, 1, 6.6, .25, 20.6, cover),
    box("前西侧入口附厅独立低屋盖实际接到主厅横壁", -4.5, 3.725, -11, 7.6, .25, 4.6, cover),
    ...glazedWall("低入口附厅前街真实主门和两侧窄橱窗", [-8, -13], [-1, -13], .2, 3.6, [[-2.2, .65, 1.65, 2.15], [2.2, .65, 1.65, 2.15]], [[0, .2, 1.9, 2.6]]),
    ...glazedWall("低入口附厅西侧连续承墙及实际横窗", [-8, -13], [-8, -9], .2, 3.6, [[0, 1.1, 2.4, 1.5]]),
    ...glazedWall("低入口附厅东侧独立侧门保持前厅可穿行", [-1, -13], [-1, -9], .2, 3.6, [], [[0, .2, 1.2, 2.6]]),
    ...glazedWall("主厅前东段通高橱窗留下整片真实采光孔", [-1, -9], [8, -9], .2, 6.1, [[0, .7, 6.7, 4.6]]),
    ...glazedWall("前附厅屋盖以上实际封到主厅低屋顶的高墙", [-8, -9], [-1, -9], 3.6, 6.1, [[0, 4.2, 4.8, 1.2]]),
    ...glazedWall("书店西壁下层高窗和夹层独立窗洞", [-8, -9], [-8, 11], .2, 6.1, [[1, 2.35, 2.6, .55], [7, 2.35, 2.6, .55], [-4, 4.15, 4, 1.3], [4, 4.15, 4, 1.3]]),
    ...glazedWall("书店东壁分层真实采光孔与承重墙墩", [8, -9], [8, 11], .2, 6.1, [[-5, 1.1, 3.2, 1.6], [2, 2.35, 2.6, .55], [7, 2.35, 2.6, .55], [-4, 4.15, 4, 1.3], [4, 4.15, 4, 1.3]]),
    ...glazedWall("书店后横桥下的真实后巷出口及夹层窗", [-8, 11], [8, 11], .2, 6.1, [[-4.7, 1.1, 3.3, 1.5], [4.7, 1.1, 3.3, 1.5], [-4.5, 4.1, 4.5, 1.4], [4.5, 4.1, 4.5, 1.4]], [[0, .2, 1.4, 2.6]]),
    ...glazedWall("中厅高屋盖前端真实透光收头墙", [-3, -9], [3, -9], 6.1, 7.2, [[0, 6.3, 4.5, .65]]),
    ...glazedWall("中厅高屋盖后端真实透光收头墙", [-3, 11], [3, 11], 6.1, 7.2, [[0, 6.3, 4.5, .65]]),
    stairFlight("西翼梯井内从地面上升至中间阶的前十级实体梯", -5.7, .2, -7, 1.8, 10, .155, .32),
    stairFlight("同一梯井内连续接到夹层楼板边缘的后十级实体梯", -5.7, 1.75, -3.8, 1.8, 10, .155, .32),
  ];
  const structure: SolidBox[] = [], guards: SolidBox[] = [];
  for (const x of [-3, 3]) {
    p.push(...glazedWall("通高中厅两侧有实际窗孔的连续高侧承屋墙", [x, -9], [x, 11], 6.1, 7.2, [[-6, 6.3, 4, .65], [0, 6.3, 4, .65], [6, 6.3, 4, .65]]));
    for (const z of [-7, 0, 7, 10.8]) structure.push({ center: [x, 3.15, z], size: [.24, 5.9, .24] });
    structure.push({ center: [x, 2.94, 2], size: [.22, .22, 18] }, { center: [x, 5.99, 1], size: [.24, .22, 20] });
  }
  for (const x of [-7.8, 7.8]) structure.push({ center: [x, 2.94, 2], size: [.22, .22, 18] });
  for (const z of [7.12, 10.78]) structure.push({ center: [0, 2.94, z], size: [15.7, .22, .24] });
  for (const z of [-6.88, -.48]) structure.push({ center: [-5.5, 2.94, z], size: [4.8, .22, .24] });
  const edges: [number, number, number, number][] = [[-3, -7, -3, 7], [3, -7, 3, 7], [-3, 7, 3, 7], [-8, -7, -6.8, -7], [-4.6, -7, -3, -7], [3, -7, 8, -7], [-6.8, -7, -6.8, -.6], [-4.6, -7, -4.6, -.6]];
  for (const [x0, z0, x1, z1] of edges) {
    p.push(rail([x0, 4.35, z0], [x1, 4.35, z1], .07, steel));
    const count = Math.ceil(Math.hypot(x1 - x0, z1 - z0) / 2);
    for (let i = 0; i <= count; i++) guards.push({ center: [x0 + (x1 - x0) * i / count, 3.825, z0 + (z1 - z0) * i / count], size: [.06, 1.05, .06] });
  }
  for (const x of [-6.6, -4.8]) {
    p.push(rail([x, 1.25, -7], [x, 4.35, -.6], .06, steel));
    for (const [y, z] of [[.2, -7], [1.75, -3.8], [3.3, -.6]]) guards.push({ center: [x, y! + .525, z!], size: [.06, 1.05, .06] });
  }
  for (let i = 0; i < structure.length; i += 20) p.push(boxesMesh("书廊与高侧窗屋盖实际连接的落地柱梁", steel, structure.slice(i, i + 20)));
  for (let i = 0; i < guards.length; i += 20) p.push(boxesMesh("夹层空井和楼梯边缘全部真实落脚的护栏立柱", steel, guards.slice(i, i + 20)));
  const shelves: SolidBox[] = [], books: SolidBox[] = [];
  for (const side of [-1, 1]) for (const floor of [.2, 3.3]) for (const z of [2.5, 8]) {
    const x = side * 7.35;
    shelves.push({ center: [side * 7.66, floor + 1.1, z], size: [.07, 2.2, 2.8] });
    for (const end of [-1, 1]) shelves.push({ center: [x, floor + 1.1, z + end * 1.365], size: [.65, 2.2, .07] });
    for (const y of [.05, .58, 1.11, 1.64, 2.16]) shelves.push({ center: [x, floor + y, z], size: [.65, .08, 2.8] });
    for (const y of [.3, .83, 1.36]) for (let book = 0; book < 5; book++) books.push({ center: [x - side * .05, floor + y, z - 1.05 + book * .5], size: [.4, .42, .34] });
  }
  for (let i = 0; i < shelves.length; i += 20) p.push(boxesMesh("两层书廊靠壁开放书架的承板和端板", timber, shelves.slice(i, i + 20)));
  for (let i = 0; i < books.length; i += 20) p.push(boxesMesh("实际落在层板上的分离书本保留可读格口", paper, books.slice(i, i + 20)));
  const table: SolidBox[] = [{ center: [1, 1, -4.4], size: [2.7, .1, 1.5] }];
  for (const x of [-.1, 2.1]) for (const z of [-4.95, -3.85]) table.push({ center: [x, .575, z], size: [.12, .75, .12] });
  p.push(boxesMesh("中厅前部不堵入口与梯口的接地展书台", timber, table));
  return p;
}

function staggeredFloristWorkshop(): ModelPart[] {
  const p: ModelPart[] = [
    hardFloor("错位前后营业翼与窄连廊接合的真实Z形地坪", paving, [[-9, -8], [4, -8], [4, -2], [2, -2], [2, 2], [9, 2], [9, 8], [-2, 8], [-2, -2], [-9, -2]], .2, [0, 0, 0]),
    box("西侧作业院接在店壳凹角内的独立落地铺坪", -5.5, .1, 3, 7, .2, 10, "#b0b49b"),
    hardFloor("东前院沿前营业翼与连廊真实退让的凹角铺坪", "#b0b49b", [[4, -8], [9, -8], [9, 2], [2, 2], [2, -2], [4, -2]], .2, [0, 0, 0]),
    box("临街花艺零售翼完整低屋盖", -2.5, 3.925, -5, 13.6, .25, 6.6, cover),
    box("窄连廊承墙支起且不封盖两侧作业院的独立短盖", 0, 3.325, 0, 4.6, .25, 4.6, cover),
    box("后部花艺工坊完整高位屋盖", 3.5, 4.625, 5, 11.6, .25, 6.6, cover),
    ...glazedWall("临街零售翼真主门和两边独立透光橱窗", [-9, -8], [4, -8], .2, 3.8, [[-4.85, .6, 2.2, 2.5], [2.9, .6, 4.5, 2.5]], [[-2.5, .2, 1.7, 2.6]]),
    ...glazedWall("零售翼西端完整开窗承墙", [-9, -8], [-9, -2], .2, 3.8, [[0, 1.05, 3.4, 1.8]]),
    ...glazedWall("零售翼东端实际进入前花材院的侧门", [4, -8], [4, -2], .2, 3.8, [[-1.8, 1.3, 1.2, 1.5]], [[.5, .2, 1.4, 2.6]]),
    ...glazedWall("零售翼西后肩真正进入有棚作业院的门", [-9, -2], [-2, -2], .2, 3.8, [[-2.2, 1.2, 1.7, 1.6]], [[-.1, .2, 1.5, 2.6]]),
    ...glazedWall("零售翼东后肩完整承屋墙", [2, -2], [4, -2], .2, 3.8, []),
    ...glazedWall("前翼跨过低连廊屋盖的真实高位收头壁", [-2, -2], [2, -2], 3.2, 3.8, []),
    ...glazedWall("连廊西侧通向左作业院的实际门洞", [-2, -2], [-2, 2], .2, 3.2, [], [[0, .2, 1.6, 2.6]]),
    ...glazedWall("连廊东侧通向右作业院的实际门洞", [2, -2], [2, 2], .2, 3.2, [], [[0, .2, 1.6, 2.6]]),
    ...glazedWall("连廊进入后工作间前的真实员工分隔门", [-2, 1.8], [2, 1.8], .2, 3.2, [], [[0, .2, 1.6, 2.6]]),
    ...glazedWall("后工作翼跨过低连廊的独立高位墙头", [-2, 2], [2, 2], 3.2, 4.5, [[0, 3.5, 2.5, .6]]),
    ...glazedWall("后工作翼朝右花材院的宽推车门和高窗", [2, 2], [9, 2], .2, 4.5, [[-2.1, 3.3, 1.5, .75], [2.1, 3.3, 1.5, .75]], [[.5, .2, 2.2, 2.8]]),
    ...glazedWall("后工作翼朝左作业院的实体侧门", [-2, 2], [-2, 8], .2, 4.5, [[0, 3.35, 3.9, .7]], [[0, .2, 1.6, 2.7]]),
    ...glazedWall("后工作翼东端完整高窗承墙", [9, 2], [9, 8], .2, 4.5, [[0, 3.1, 4.2, .95]]),
    ...glazedWall("后巷补货门与工作间真实直通的后墙", [-2, 8], [9, 8], .2, 4.5, [[-3.6, 3.1, 2.6, .95], [3.6, 3.1, 2.6, .95]], [[2.3, .2, 2.2, 2.8]]),
    slopePanel("西作业院四根实柱承托的单坡工作雨棚", [[-8.2, 2.95, .8], [-4.3, 2.65, .8], [-4.3, 2.65, 7.2], [-8.2, 2.95, 7.2]], .09, cover),
  ];
  const frame: SolidBox[] = [], benches: SolidBox[] = [], plants: SolidBox[] = [];
  for (const x of [-8, -4.5]) {
    const beamY = 2.80 - (x + 8.2) * .3 / 3.9, top = beamY - .06;
    for (const z of [1, 7]) frame.push({ center: [x, (.2 + top) / 2, z], size: [.12, top - .2, .12] });
    frame.push({ center: [x, beamY, 4], size: [.12, .12, 6.15] });
  }
  for (const z of [1, 7]) p.push(rail([-8.15, 2.80 - .05 * .3 / 3.9, z], [-4.35, 2.80 - 3.85 * .3 / 3.9, z], .12, steel));
  for (const [x0, z0, x1, z1] of [[-9, -2, -9, 8], [-9, 8, -6.5, 8], [-4.5, 8, -2, 8], [9, -8, 9, -4.4], [9, -2.4, 9, 2]]) {
    p.push(rail([x0!, 1.35, z0!], [x1!, 1.35, z1!], .06, steel));
    const count = Math.ceil(Math.hypot(x1! - x0!, z1! - z0!) / 2.5);
    for (let i = 0; i <= count; i++) frame.push({ center: [x0! + (x1! - x0!) * i / count, .775, z0! + (z1! - z0!) * i / count], size: [.06, 1.15, .06] });
  }
  for (const z of [-7.7, -2.3]) frame.push({ center: [-2.5, 3.59, z], size: [13, .42, .2] });
  for (const z of [2.3, 7.7]) frame.push({ center: [3.5, 4.29, z], size: [11, .42, .2] });
  const tableSites = [[.5, -5.6, 4.8, 1.1], [-6.3, 4.2, 2.7, 1.3], [3, 5.6, 4.3, 1.6]];
  for (const [x, z, width, depth] of tableSites) {
    benches.push({ center: [x!, 1.05, z!], size: [width!, .12, depth!] });
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) benches.push({ center: [x! + sx * (width! / 2 - .18), .625, z! + sz * (depth! / 2 - .18)], size: [.12, .85, .12] });
    benches.push({ center: [x!, .45, z!], size: [width! - .24, .1, depth! - .24] });
  }
  benches.push({ center: [.4, .7, 7.1], size: [2.4, .9, 1.2] }, { center: [.4, 1.18, 7.1], size: [2.5, .06, 1.3] });
  const basin: SolidBox[] = [{ center: [.4, 1.22, 7.1], size: [1.55, .06, .85] }];
  for (const side of [-1, 1]) basin.push({ center: [.4 + side * .775, 1.32, 7.1], size: [.06, .26, .91] }, { center: [.4, 1.32, 7.1 + side * .425], size: [1.55, .26, .06] });
  p.push(boxesMesh("后工作台上真实有底有薄壁的开放理花水槽", "#c9d1c7", basin));
  for (const x of [-1.2, -.1, 1, 2.1]) {
    p.push(part("零售花台上具有实际内腔的花材水桶", "lathe", "#c0b69b", [x, 1.11, -5.6], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: .16, y: 0 }, { x: .25, y: .55 }, { x: .23, y: .58 }, { x: .2, y: .55 }, { x: .13, y: .05 }, { x: 0, y: .05 }] }));
    for (const offset of [-.11, 0, .11]) {
      plants.push({ center: [x + offset, 1.73, -5.6 + offset], size: [.018, 1.15, .018] }, { center: [x + offset + .045, 1.98, -5.6 + offset], size: [.12, .025, .045] });
      p.push(part("花束中实际连接独立花茎的花冠", "sphere", offset ? "#bd8e83" : "#d1b87d", [x + offset, 2.28, -5.6 + offset], [.19, .13, .19]));
    }
  }
  for (let i = 0; i < frame.length; i += 20) p.push(boxesMesh("院内雨棚承柱纵梁围栏与店壳承屋横梁", steel, frame.slice(i, i + 20)));
  for (let i = 0; i < benches.length; i += 20) p.push(boxesMesh("前厅展花台院内理花台与后工作台的完整接地构造", timber, benches.slice(i, i + 20)));
  for (let i = 0; i < plants.length; i += 20) p.push(boxesMesh("花桶里实际上接花冠的分离茎叶", "#6c8e68", plants.slice(i, i + 20)));
  return p;
}

function loadingBayFurnitureShop(): ModelPart[] {
  const p: ModelPart[] = [
    hardFloor("低展厅和高货库接合且为装货湾真实退凹的整体地坪", paving, [[-11, -10], [10, -10], [10, 6], [5, 6], [5, 10], [2, 10], [2, 8], [-11, 8]], .2, [0, 0, 0]),
    box("后巷进入凹湾且与库门同标高的独立装货铺坪", 7.5, .1, 9.5, 5, .2, 7, "#a7ada7"),
    hardFloor("沿双街折角的连续低L形营业厅屋盖", cover, [[-11.3, -10.3], [10.3, -10.3], [10.3, .15], [2.15, .15], [2.15, 8.3], [-11.3, 8.3]], .25, [0, 4.2, 0]),
    hardFloor("后高货库绕真实取货凹湾收边的独立L形屋盖", cover, [[1.85, -.15], [10.3, -.15], [10.3, 6.15], [5.15, 6.15], [5.15, 10.3], [1.85, 10.3]], .25, [0, 6.1, 0]),
    box("内凹装货湾低雨盖由货库墙和外沿实柱承托", 7.5, 4.325, 8, 5.4, .25, 4.4, cover),
    ...glazedWall("家具店主街实际宽人门和独立大橱窗", [-11, -10], [10, -10], .2, 4.2, [[-7.7, .55, 3.8, 2.95], [4.2, .55, 3.8, 2.95], [8.4, .55, 2.5, 2.95]], [[-.5, .2, 2.2, 2.8]]),
    ...glazedWall("侧街长展示面另有独立人行入口", [-11, -10], [-11, 8], .2, 4.2, [[-5.6, .55, 4.5, 2.95], [5.4, .55, 4.5, 2.95]], [[-1, .2, 1.8, 2.8]]),
    ...glazedWall("前营业厅东端完整采光外墙", [10, -10], [10, 0], .2, 4.2, [[0, .8, 6.5, 2.4]]),
    ...glazedWall("低L形展厅后肩的开窗承屋围壁", [-11, 8], [2, 8], .2, 4.2, [[-3.7, .9, 3.2, 2.2], [3.7, .9, 3.2, 2.2]], [[0, .2, 1.4, 2.7]]),
    ...glazedWall("高货库面对前展厅的真实移货门和高侧采光窗", [2, 0], [10, 0], .2, 6.1, [[0, 4.8, 5.5, .85]], [[0, .2, 2.4, 3]]),
    ...glazedWall("展厅进入高货库的员工门与上部高墙连续围合", [2, 0], [2, 10], .2, 6.1, [[0, 4.8, 6.5, .85]], [[-2, .2, 1.6, 2.8]]),
    ...glazedWall("货库东侧实墙和独立高窗避开凹湾装货口", [10, 0], [10, 6], .2, 6.1, [[0, 4.75, 4, .9]]),
    ...glazedWall("内凹取货湾正面真实宽货门及门上高窗", [5, 6], [10, 6], .2, 6.1, [[0, 4.85, 3.5, .8]], [[0, .2, 3.6, 3.6]]),
    ...glazedWall("取货凹湾西侧沿高货库狭长后段的完整承重壁", [5, 6], [5, 10], .2, 6.1, []),
    ...glazedWall("货库后窄段独立后巷员工出口", [2, 10], [5, 10], .2, 6.1, [[0, 4.7, 1.7, 1]], [[0, .2, 1.2, 2.7]]),
  ];
  const structure: SolidBox[] = [], furnishings: SolidBox[] = [], racks: SolidBox[] = [];
  for (const x of [-10.7, -3, 1.75, 9.75]) for (const z of [-9.75, -.25]) structure.push({ center: [x, 2.2, z], size: [.24, 4, .24] });
  for (const x of [-10.7, -3, 1.75]) structure.push({ center: [x, 2.2, 7.75], size: [.24, 4, .24] });
  for (const z of [-9.75, -.25]) structure.push({ center: [-.5, 4.1, z], size: [20.75, .2, .24] });
  structure.push({ center: [-4.5, 4.1, 7.75], size: [12.75, .2, .24] });
  for (const x of [-10.7, 1.75]) structure.push({ center: [x, 4.1, 3.75], size: [.24, .2, 8] });
  for (const [x, z] of [[2.25, .25], [9.75, .25], [2.25, 5.75], [9.75, 5.75], [2.25, 9.75], [4.75, 9.75]]) structure.push({ center: [x!, 3.15, z!], size: [.28, 5.9, .28] });
  for (const z of [.25, 5.75]) structure.push({ center: [6, 5.99, z], size: [7.8, .22, .28] });
  structure.push({ center: [3.5, 5.99, 9.75], size: [2.8, .22, .28] }, { center: [2.25, 5.99, 5], size: [.28, .22, 9.8] });
  for (const x of [5.4, 9.8]) structure.push({ center: [x, 2.09, 9.85], size: [.18, 3.78, .18] });
  for (const z of [6.08, 9.85]) structure.push({ center: [7.5, 4.09, z], size: [5.1, .22, .24] });
  for (const x of [5.4, 9.8]) structure.push({ center: [x, 4.09, 8], size: [.18, .22, 3.9] });
  for (const x of [-8.3, -4.5]) {
    furnishings.push({ center: [x, .68, -6.4], size: [2.4, .24, 1] }, { center: [x, 1.05, -5.92], size: [2.4, .65, .18] });
    for (const side of [-1, 1]) furnishings.push({ center: [x + side * 1.14, .9, -6.4], size: [.18, .45, 1] });
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) furnishings.push({ center: [x + sx * .9, .38, -6.4 + sz * .32], size: [.12, .36, .12] });
  }
  furnishings.push({ center: [-7.4, .47, 4.2], size: [2.2, .18, 2.5] }, { center: [-7.4, .72, 4.2], size: [2.1, .32, 2.4] }, { center: [-7.4, 1.05, 5.42], size: [2.3, 1.4, .16] });
  for (const x of [-8.25, -6.55]) for (const z of [3.2, 5.2]) furnishings.push({ center: [x, .29, z], size: [.15, .18, .15] });
  furnishings.push({ center: [5.8, 1, -5.3], size: [2.2, .12, 1.2] });
  for (const x of [4.9, 6.7]) for (const z of [-5.7, -4.9]) furnishings.push({ center: [x, .57, z], size: [.12, .74, .12] });
  for (const [x, z, width, depth] of [[9.15, 2.85, 1.05, 3.6], [2.6, 8.5, .5, 2.4]]) {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) racks.push({ center: [x! + sx * (width! / 2 - .055), 1.9, z! + sz * (depth! / 2 - .055)], size: [.11, 3.4, .11] });
    for (const y of [.4, 1.9, 3.4]) racks.push({ center: [x!, y, z!], size: [width!, .12, depth!] });
  }
  for (let i = 0; i < structure.length; i += 20) p.push(boxesMesh("营业厅高货库与凹湾雨棚实际落地接盖的完整柱梁", steel, structure.slice(i, i + 20)));
  for (let i = 0; i < furnishings.length; i += 20) p.push(boxesMesh("展示窗后的完整接地床沙发和桌体让出双街路线", timber, furnishings.slice(i, i + 20)));
  p.push(boxesMesh("高货库两侧真实承托层架留下门前连续移货道", steel, racks));
  return p;
}
