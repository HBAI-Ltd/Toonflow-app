import { beam, part, type ModelPart, type Triple } from "../assetModelParts";
import { box, cylinder, design, pipe, type ArchitecturePrototype } from "./structures";
import { glazedWall } from "./modernResidenceSpaceBatchOne";
import { slab } from "./modernCommercialSpaceBatchOne";
import { boxesMesh, type SolidBox } from "./publicSpaceBatchEight";
import { stairFlight } from "./publicSpaceBatchSteps";

const concrete = "#b6b6a6", paving = "#9da6a0", steel = "#52696b", roof = "#738b87", equipment = "#788e91", warm = "#b79870";

export const everydayUtilityBuildingSpaceBatchOneDesigns: ArchitecturePrototype[] = [
  design("下沉泵厅双侧操作廊社区供水站", "前侧干值班翼分别接到底层检修厅与两侧升高操作廊，后端横廊围住真实挑空泵厅，独立落地柱托住跨厅吊装梁和高双坡屋盖，前后人员门及后部搬运门保持贯通", communityWaterStation, "建筑", "现代"),
  design("折角热厅隔廊报修社区换热站", "折角高热厅围住向侧街敞开的卸换院，真开口管沟和跨沟格桥贯穿西作业翼，前侧居民报修厅与后控制间通过独立有顶服务廊连接，院内设备搬运门和人员门分别接入后厅", neighborhoodHeatingStation, "建筑", "现代"),
];

function guard(name: string, start: Triple, end: Triple): ModelPart[] {
  const length = Math.hypot(end[0] - start[0], end[2] - start[2]), count = Math.ceil(length / 1.5), posts: SolidBox[] = [];
  for (let index = 0; index <= count; index++) {
    const t = index / count;
    posts.push({ center: [start[0] + (end[0] - start[0]) * t, start[1] + .51 + (end[1] - start[1]) * t, start[2] + (end[2] - start[2]) * t], size: [.06, 1.06, .06] });
  }
  return [boxesMesh(`${name}独立落在平台或踏面上的立柱`, steel, posts), beam(`${name}连续上扶手`, steel, [start[0], start[1] + 1.04, start[2]], [end[0], end[1] + 1.04, end[2]], .065), beam(`${name}连续中挡杆`, steel, [start[0], start[1] + .52, start[2]], [end[0], end[1] + .52, end[2]], .045)];
}

function communityWaterStation(): ModelPart[] {
  const p: ModelPart[] = [
    box("供水站前后可达场坪及落地基础", 0, .12, -.7, 22, .24, 26, paving),
    box("中央低位泵厅真实承重地坪", 0, .34, 1, 16.6, .2, 15.2, concrete),
    box("前侧干值班翼完整地坪", 0, .34, -8.65, 16.6, .2, 4.1, concrete),
    box("前门外接到场坪的入口踏台", 0, .34, -11.8, 4, .2, 2.2, concrete),
    box("后搬运门外连续落脚平台", 0, .34, 10.3, 4.2, .2, 3.4, concrete),
    ...[-1, 1].map(side => box("两侧架高操作廊保留中央通高检修空腔", side * 6.9, 2.74, .9, 2.8, .2, 15, concrete)),
    box("后端操作横廊下方保留二点二米搬运净空", 0, 2.74, 7.6, 11.2, .2, 1.4, concrete),
    box("中央干值班室独立低屋盖不跨两侧楼梯", 0, 4.05, -8.65, 10, .22, 4.7, roof),
    ...[-1, 1].map(side => box("抬高的两侧梯间屋盖保留全程上行净空", side * 6.75, 5.55, -8.65, 3.8, .22, 4.7, roof)),
    part("与两侧通高墙和横向斜梁相接的完整双坡高屋盖", "extrude", roof, [0, 0, .9], [1, 1, 1], [0, 0, 0], { depth: 15.8, profile: [{ x: -8.7, y: 7.1 }, { x: 0, y: 7.95 }, { x: 8.7, y: 7.1 }, { x: 8.7, y: 7.32 }, { x: 0, y: 8.17 }, { x: -8.7, y: 7.32 }] }),
    ...glazedWall("前侧值班室带中央真入口的连续立面", [-4.9, -10.7], [4.9, -10.7], .44, 3.95, [[-2.9, 1.35, 2, 1.35], [2.9, 1.35, 2, 1.35]], [[0, .44, 1.9, 2.35]]),
    ...[-1, 1].flatMap(side => glazedWall("高梯间前侧采光端墙", [side * 6.6 - 1.7, -10.7], [side * 6.6 + 1.7, -10.7], .44, 5.44, [[0, 3.7, 1.8, 1.15]])),
    ...glazedWall("西梯间高侧墙", [-8.3, -10.7], [-8.3, -6.6], .44, 5.44, [[0, 2.95, 1.8, 1.45]]),
    ...glazedWall("东梯间高侧墙", [8.3, -10.7], [8.3, -6.6], .44, 5.44, [[0, 2.95, 1.8, 1.45]]),
    ...glazedWall("前干厅与泵厅之间分别接低层门和高廊梯口的完整墙", [-8.3, -6.6], [8.3, -6.6], .44, 7.14, [[0, 4.6, 5.4, 1.35]], [[0, .44, 2.3, 2.4], [-6.85, .44, 2, 4.9], [6.85, .44, 2, 4.9]]),
    ...glazedWall("西侧高泵厅连续窗带与承屋壁", [-8.3, -6.6], [-8.3, 8.4], .44, 7.14, [[-4.5, 3.55, 3.3, 2], [0, 3.55, 3.3, 2], [4.5, 3.55, 3.3, 2]]),
    ...glazedWall("东侧高泵厅连续窗带与承屋壁", [8.3, -6.6], [8.3, 8.4], .44, 7.14, [[-4.5, 3.55, 3.3, 2], [0, 3.55, 3.3, 2], [4.5, 3.55, 3.3, 2]]),
    ...glazedWall("泵厅后壁保留廊下搬运门和上方采光孔", [-8.3, 8.4], [8.3, 8.4], .44, 7.14, [[-5.6, 3.55, 2.7, 2], [5.6, 3.55, 2.7, 2]], [[0, .44, 2.8, 2.2]]),
    ...[-1, 1].flatMap(side => glazedWall("前值班室与上廊短梯分隔墙的真侧门", [side * 4.9, -10.7], [side * 4.9, -6.6], .44, 5.44, [], [[-1.5, .44, 1, 2.2]])),
    ...[-1, 1].map(side => stairFlight("前干厅沿两边真正升到操作廊的十二级短梯", side * 6.85, .44, -9.6, 1.8, 12, .2, .25)),
    ...[-6.6, 8.4].map(z => part("高泵厅双坡端部完整三角采光窗", "extrude", "#a6c7c2", [0, 0, z], [1, 1, 1], [0, 0, 0], { depth: .08, opacity: .32, profile: [{ x: -8.7, y: 7.1 }, { x: 8.7, y: 7.1 }, { x: 0, y: 7.95 }] })),
    box("值班室监控台连续落地支承", 3, .89, -7.45, 3.4, .9, .8, equipment),
    box("监控台前倾读数面", 3, 1.42, -7.45, 3.4, .16, .85, steel),
    box("干值班室墙侧记录长桌", -2.8, 1.2, -8.7, 1.5, .16, .7, warm),
    boxesMesh("长桌两端真实落地桌脚", steel, [-3.4, -2.2].map(x => ({ center: [x, .78, -8.7], size: [.1, .68, .6] }))),
  ];
  const columns: SolidBox[] = [], galleryBearers: SolidBox[] = [];
  for (const side of [-1, 1]) {
    for (const z of [-6.4, .9, 8.2]) {
      columns.push({ center: [side * 8.05, 3.81, z], size: [.3, 6.74, .38] });
      galleryBearers.push({ center: [side * 6.9, 1.54, z], size: [.26, 2.2, .3] });
      p.push(beam("柱顶实际接双坡屋面的横向钢斜梁", steel, [side * 8.3, 7.13, z], [0, 7.94, z], .2));
    }
    p.push(...guard("侧操作廊内缘防坠栏", [side * 5.53, 2.84, -6.15], [side * 5.53, 2.84, 6.85]),
      ...guard("前厅上廊楼梯外扶手", [side * 7.72, .44, -9.6], [side * 7.72, 2.84, -6.6]),
      box("跨厅吊车两侧落在柱身牛腿上的纵轨", side * 7.95, 5.8, .9, .22, .24, 14.8, steel));
  }
  p.push(boxesMesh("贯通基础的六根屋盖及起重轨承柱", steel, columns), boxesMesh("架高操作廊真实下柱承托", concrete, galleryBearers),
    boxesMesh("后横廊两边承柱避开中央二点八米搬运通道", concrete, [-3, 3].flatMap(x => [7.1, 8.15].map(z => ({ center: [x, 1.54, z], size: [.24, 2.2, .24] })))),
    ...guard("后操作横廊中央挑空边栏", [-5.5, 2.84, 6.92], [5.5, 2.84, 6.92]),
    box("跨厅吊装桥梁两端实际落在纵轨顶面", 0, 6.03, 3.8, 16.15, .3, .48, steel),
    box("横梁上的检修吊装小车", 1.1, 6.28, 3.8, .9, .3, .8, equipment),
    pipe("小车到检修吊具的垂直承索", [1.1, 6.25, 3.8], [1.1, 3.2, 3.8], .055),
    box("悬索末端完整检修吊具", 1.1, 3.2, 3.8, .34, .2, .25, steel));
  for (const side of [-1, 1]) {
    const x = side * 2.7;
    p.push(box("低位泵组独立落地基座", x, .64, 1.7, 2, .4, 3.4, concrete),
      cylinder("低位泵组的简化卧式泵壳", x, 1.2, 2.05, .76, 1.3, equipment, [90, 0, 0]),
      cylinder("与泵壳连续相接的驱动机体", x, 1.2, .85, .62, 1.15, steel, [90, 0, 0]),
      boxesMesh("泵及电机下方实际接机体和基座的支脚", steel, [.85, 2.05].map(z => ({ center: [x, .96, z], size: [.7, .3, .5] }))),
      pipe("泵端引至侧边汇管的低位连接", [x, 1.2, 2.65], [side * 4.5, 1.2, 2.65], .27),
      pipe("泵厅两边保持中部通道的纵向汇管", [side * 4.5, 1.2, -3.8], [side * 4.5, 1.2, 5.8], .32),
      boxesMesh("低位汇管直接落地的两处管托", steel, [-2.6, 5].map(z => ({ center: [side * 4.5, .76, z], size: [.4, .64, .35] }))));
  }
  return p;
}

function neighborhoodHeatingStation(): ModelPart[] {
  const channel: [number, number][] = [[-8.3, -5], [-6.3, -5], [-6.3, 5.5], [-8.3, 5.5]];
  const site: [number, number][] = [[-14, -12], [14, -12], [14, 12], [-14, 12]];
  const hall: [number, number][] = [[-11.25, -8.25], [-2.75, -8.25], [-2.75, 3.25], [10.25, 3.25], [10.25, 9.25], [-11.25, 9.25]];
  const p: ModelPart[] = [
    slab("站房和院坪基础真实避开贯穿检修沟", paving, site, .24, [0, 0, 0], [channel]),
    slab("报修厅卸换院和热厅同标高连续地坪保留真沟口", concrete, site, .2, [0, .24, 0], [channel]),
    box("管沟低于四周操作地坪的完整闭底", -7.3, .06, .25, 2, .12, 10.5, steel),
    slab("连续折角高作业厅屋盖保留开放卸换院", roof, hall, .22, [0, 6.6, 0]),
    box("前侧独立低报修翼屋盖", 3.5, 4.05, -5.75, 13.5, .22, 4.9, roof),
    box("连接前后两翼且不盖住卸换院的狭长服务廊屋盖", -1.9, 3.65, 0, 2.65, .22, 7.3, roof),
    ...glazedWall("西热厅完整外侧采光承重壁", [-11, -8], [-11, 9], .44, 6.6, [[-5.5, 2.3, 3.6, 2.2], [0, 2.3, 3.6, 2.2], [5.5, 2.3, 3.6, 2.2]]),
    ...glazedWall("热厅前端高墙及独立采光窗", [-11, -8], [-3, -8], .44, 6.6, [[0, 2.2, 4.5, 2.5]]),
    ...glazedWall("西热厅朝向服务廊的真人员门及高窗", [-3, -8], [-3, 3.5], .44, 6.6, [[-3.3, 4.1, 3.6, 1.4]], [[2.95, .44, 1.45, 2.4]]),
    ...glazedWall("折角站房后壁分别保留人员后门和热厅采光窗", [-11, 9], [10, 9], .44, 6.6, [[-6.6, 2.7, 4, 2], [5.2, 2.7, 4, 2]], [[-1.4, .44, 1.3, 2.3]]),
    ...glazedWall("后卸换厅面院立面区分搬运口与服务廊人行门", [-3, 3.5], [10, 3.5], .44, 6.6, [[0, 5.2, 5, .9]], [[-5.4, .44, 1.45, 2.3], [2, .44, 4.5, 4.35]]),
    ...glazedWall("后高厅东端通高侧壁", [10, 3.5], [10, 9], .44, 6.6, [[0, 2.25, 3.1, 2.4]]),
    ...glazedWall("低报修翼前脸的居民入口与独立职工入口", [-3, -8], [10, -8], .44, 3.94, [[-.8, 1.25, 2, 1.4], [5, 1.25, 1.5, 1.4]], [[-5.4, .44, 1.3, 2.35], [1.5, .44, 1.9, 2.35]]),
    ...glazedWall("低报修厅东侧封闭端墙", [10, -8], [10, -3.5], .44, 3.94, [[0, 1.25, 2.4, 1.4]]),
    ...glazedWall("报修厅后墙隔开设备院而保留观察窗和职工通廊门", [-3, -3.5], [10, -3.5], .44, 3.94, [[2, 1.3, 4.5, 1.3]], [[-5.4, .44, 1.45, 2.35]]),
    ...glazedWall("居民厅与职工长廊之间只有服务窗口而无穿行口", [-.8, -8], [-.8, -3.5], .44, 3.94, [[0, 1.15, 2, 1.1]]),
    ...glazedWall("后控制间与卸换作业区间的真门隔墙", [1.7, 6.2], [1.7, 9], .44, 3.94, [], [[0, .44, 1.1, 2.2]]),
    ...glazedWall("后控制间面向作业厅的真观察窗及贯通后门的人行口", [-3, 6.2], [1.7, 6.2], .44, 3.94, [[1.05, 1.3, 1.6, 1.2]], [[-1.25, .44, 1.2, 2.2]]),
    box("后控制间独立低顶接入高热厅承壁", -.65, 4.05, 7.6, 4.9, .22, 3, roof),
    box("居民服务窗口前的连续落地柜台", -.18, .87, -5.75, 1, .86, 2.5, warm),
    box("服务柜台直接相接的耐磨台面", -.15, 1.35, -5.75, 1.1, .12, 2.6, steel),
    box("后控制间避开后门人行线的落地值班台", .1, .94, 8.05, 1.8, 1, .8, equipment),
    box("值班台上的连续读数面", .1, 1.5, 8.05, 1.8, .12, .82, steel),
  ];
  const columns: SolidBox[] = [], beams: SolidBox[] = [];
  for (const x of [-10.75, -3.25]) for (const z of [-7.75, .5, 8.75]) columns.push({ center: [x, 3.52, z], size: [.3, 6.16, .3] });
  for (const x of [2.5, 9.75]) for (const z of [3.75, 8.75]) columns.push({ center: [x, 3.52, z], size: [.3, 6.16, .3] });
  columns.push({ center: [-3.25, 3.52, 3.75], size: [.3, 6.16, .3] });
  for (const z of [-7.75, .5, 8.75]) beams.push({ center: [-7, 6.45, z], size: [7.8, .3, .3] });
  for (const z of [3.75, 8.75]) beams.push({ center: [3.25, 6.45, z], size: [13.3, .3, .3] });
  p.push(boxesMesh("折角高屋盖与横梁的十一根落地承柱", steel, columns), boxesMesh("高屋盖下方与两排柱实际相接的横梁", steel, beams),
    boxesMesh("狭长服务廊朝院一侧落地撑柱", steel, [-3.35, 0, 3.35].map(z => ({ center: [-.8, 1.99, z], size: [.18, 3.1, .18] }))),
    box("服务廊沿院柱顶连续承檐梁", -.8, 3.48, 0, .2, .16, 7.25, steel));
  const bridges: SolidBox[] = [], pipeSupports: SolidBox[] = [];
  for (const z of [-.6, 5]) for (let index = 0; index < 5; index++) bridges.push({ center: [-7.3, .4, z - .32 + index * .16], size: [2.1, .08, .095] });
  for (const x of [-7.75, -6.85]) {
    p.push(pipe("低沟内两路连续供回水管", [x, .24, -4.65], [x, .24, 5.15], .16));
    for (const z of [-3.5, 3.5]) pipeSupports.push({ center: [x, .14, z], size: [.2, .04, .2] });
  }
  p.push(boxesMesh("两座跨沟格桥真实搭在沟两侧楼板边缘", steel, bridges), boxesMesh("沟内供回水管实际接闭底的短管托", concrete, pipeSupports));
  for (const z of [-2, 3]) {
    p.push(box("热厅换热单元独立设备基座", -4.6, .58, z, 1.7, .28, 2.5, concrete),
      box("与落地支腿连续的简化封闭换热机体", -4.6, 1.5, z, 1.2, 1.5, 1.9, equipment),
      boxesMesh("换热单元机体下真实支承的双支腿", steel, [-.7, .7].map(offset => ({ center: [-4.6, .74, z + offset], size: [.8, .24, .18] }))),
      pipe("沟内供水支路避开格桥向上抬起的立管", [-7.75, .24, z - .5], [-7.75, .55, z - .5], .16),
      pipe("供水支路从真实沟口上方接入热厅机体", [-7.75, .55, z - .5], [-4.6, .55, z - .5], .16),
      pipe("地面支管在机体下端真正抬起的接管", [-4.6, .55, z - .5], [-4.6, .82, z - .5], .16));
  }
  return p;
}
