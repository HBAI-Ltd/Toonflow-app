import { part, type ModelPart } from "../assetModelParts";
import { piercedPanel } from "../masterObjects/parts";
import { glazedWall } from "./modernResidenceSpaceBatchOne";
import { boxesMesh, type SolidBox } from "./publicSpaceBatchEight";
import { stairFlight } from "./publicSpaceBatchSteps";
import { box, design, rail, type ArchitecturePrototype } from "./structures";
import { hardFloor } from "./vernacularWorldBatchSix";

const paving = "#b9bcad", road = "#65716f", roofColor = "#748b86", pale = "#c5c9b8", dark = "#516c69", timber = "#a78c69", cabinetColor = "#b1bcb0";

// 参考抬高厨房与贯通车道、垂直交付的建筑类型；本体外廓、尺度与全部几何为原创。
// https://www.tacobell.com/newsroom/taco-bell-defy-concept-opens-june-7-one-of-the-most-innovative-drive-thru-experiences-yet
export const everydayDiningSpaceBatchFiveDesigns: ArchitecturePrototype[] = [
  design("跨双车道抬厨取餐楼", "完整高厨房由六根落地柱架在两条贯通取餐车道上，西侧封闭员工梯核穿过真实长梯井到达高厨；双送餐井穿楼板孔通到车窗高度的真实交付口，导轨与托盘位于中部隔离带，车辆与员工分别从自己的道路和实门进入", elevatedPickupRestaurant, "建筑", "现代"),
];

function elevatedPickupRestaurant(): ModelPart[] {
  const holes: [number, number][][] = [[[-10.2, -5.8], [-7.8, -5.8], [-7.8, 1.1], [-10.2, 1.1]], ...[-.55, .55].map(x => [[x - .45, 1.05], [x + .45, 1.05], [x + .45, 1.95], [x - .45, 1.95]] as [number, number][])];
  const parts: ModelPart[] = [
    box("独立员工梯核真正落到地面的完整基础", -9, .1, 0, 4.6, .2, 12.6, paving),
    box("双送餐井及交付底座真正落地并与两车道齐平的隔离带基础", 0, .1, 1.5, 2.4, .2, 1.4, paving),
    part("员工主门外从室外地面连续接到梯核地坪的真实短缓坡", "extrude", paving, [-9, 0, 0], [1, 1, 1], [0, -90, 0], { depth: 2, profile: [{ x: -7.3, y: 0 }, { x: -6.3, y: 0 }, { x: -6.3, y: .2 }, { x: -7.3, y: .02 }] }),
    part("梯核后门同样接回室外地面的独立短缓坡", "extrude", paving, [-9, 0, 0], [1, 1, 1], [0, -90, 0], { depth: 1.6, profile: [{ x: 6.3, y: 0 }, { x: 7.3, y: 0 }, { x: 7.3, y: .02 }, { x: 6.3, y: .2 }] }),
    hardFloor("高厨房与西侧员工梯厅共同楼板真正保留一梯井与双送餐井", paving, [[-11.3, -6.3], [7.3, -6.3], [7.3, 6.3], [-11.3, 6.3]], .25, [0, 3.95, 0], holes),
    box("高厨房与员工梯核实际由完整承墙支住的整幅屋盖", -2, 7.81, 0, 19.2, .22, 13.2, roofColor),
    stairFlight("员工梯低跑从独立地面入口升至中间梯段", -9, .2, -6, 1.8, 10, .2, .35),
    stairFlight("员工梯高跑实际穿过楼板井接到高厨房同层", -9, 2.2, -2.5, 1.8, 10, .2, .35),
    box("员工梯最后踏步接到真实楼板井外的落脚平台", -9, 4.075, 1.3, 2.4, .25, .6, paving),
    ...glazedWall("西梯核前立面真实员工门与上层独立采光窗", [-11, -6], [-7, -6], .2, 7.7, [[0, 5.2, 2.5, 1.4]], [[0, .2, 1.8, 2.6]]),
    ...glazedWall("西梯核后立面地面独立安全门及高层窗", [-11, 6], [-7, 6], .2, 7.7, [[0, 5.2, 2.5, 1.4]], [[0, .2, 1.3, 2.6]]),
    ...glazedWall("西梯核从地基真正承到大屋盖的完整侧墙", [-11, -6], [-11, 6], .2, 7.7, [[-3.5, 1.2, 2.8, 1.6], [3.5, 5.2, 2.8, 1.4]]),
    ...glazedWall("梯核与贯通车道真正分隔并在高层通厨的内墙", [-7, -6], [-7, 6], .2, 7.7, [], [[1.8, 4.2, 1.4, 2.6]]),
    ...glazedWall("高厨房前端真实高窗落在完整抬高楼板上", [-7, -6], [7, -6], 4.2, 7.7, [[-3.5, 5.2, 4.3, 1.4], [3.5, 5.2, 4.3, 1.4]]),
    ...glazedWall("高厨房后端完整采光窗和承屋墙", [-7, 6], [7, 6], 4.2, 7.7, [[-3.5, 5.2, 4.3, 1.4], [3.5, 5.2, 4.3, 1.4]]),
    ...glazedWall("高厨房东侧真正封合屋盖的连续长窗墙", [7, -6], [7, 6], 4.2, 7.7, [[0, 5.1, 9.1, 1.5]]),
  ];
  const structure: SolidBox[] = [], furniture: SolidBox[] = [], cabinets: SolidBox[] = [], guards: SolidBox[] = [];
  for (const x of [-2.8, 2.8]) parts.push(part("从场外实缓坡进入抬厨下方并从另一端离开的贯通车道", "extrude", road, [x, 0, 0], [1, 1, 1], [0, -90, 0], { depth: 3.2, profile: [{ x: -13, y: 0 }, { x: 13, y: 0 }, { x: 13, y: .02 }, { x: 9, y: .2 }, { x: -9, y: .2 }, { x: -13, y: .02 }] }));
  for (const x of [-6.5, 0, 6.5]) for (const z of [-5.5, 5.5]) structure.push({ center: [x, .1, z], size: [.75, .2, .75] }, { center: [x, 2.075, z], size: [.32, 3.75, .32] });
  for (const z of [-5.5, 5.5]) structure.push({ center: [.12, 3.8, z], size: [14.48, .3, .35] }, { center: [.12, 7.54, z], size: [14.48, .32, .24] });
  structure.push({ center: [-9, 3.8, 1.4], size: [4.24, .3, .3] });
  for (const x of [-10.2, -7.8]) {
    parts.push(rail([x, 5.28, -5.8], [x, 5.28, 1.1], .06, dark));
    for (let i = 0; i <= 3; i++) guards.push({ center: [x, 4.74, -5.8 + i * 2.3], size: [.06, 1.08, .06] });
  }
  parts.push(rail([-10.2, 5.28, -5.8], [-7.8, 5.28, -5.8], .06, dark));
  for (const x of [-9.82, -8.18]) {
    parts.push(rail([x, 1.4, -6], [x, 5.2, .65], .055, dark));
    guards.push({ center: [x, .9, -6], size: [.06, 1, .06] }, { center: [x, 4.7, .65], size: [.06, 1, .06] });
  }
  for (const side of [-1, 1]) {
    const x = side * .55, outside = side * .95;
    parts.push(piercedPanel("送餐井朝各自车窗真正挖开交付口的薄壁", [outside, 0, 0], [[.2, 1.1], [4.7, 1.1], [4.7, 1.9], [.2, 1.9]], [[[1.1, 1.18], [2, 1.18], [2, 1.82], [1.1, 1.82]]], .04, pale, [0, 0, 90]),
      box("送餐井面向隔离带的连续内侧薄壁", x - side * .4, 2.45, 1.5, .04, 4.5, .8, pale), ...[-1, 1].map(end => box("双送餐井前后保持井腔连续的真实薄壁", x, 2.45, 1.5 + end * .38, .8, 4.5, .04, pale)),
      box("升降托盘停在车窗高度且真实位于开口井内", x, 1.24, 1.5, .62, .04, .58, timber), box("从井内托盘实际伸向交付口外的小托沿", side, 1.24, 1.5, .36, .035, .5, timber),
      ...[-1, 1].map(end => rail([x, .45, 1.5 + end * .27], [x, 4.7, 1.5 + end * .27], .025, dark)),
      box("前后导轨下端真正落到隔离带基座的固定通长短座", x, .325, 1.5, .12, .25, .62, dark), box("导轨上端同时接入前后固定井壁与驱动箱的顶横联", x, 4.65, 1.5, .1, .1, .8, dark),
      box("高厨房可直接从敞口井上方供餐的侧驱动箱", x, 4.74, 1.94, .43, .18, .22, dark), box("贴在井外壁上供车窗侧操作的低矮控制面", side * .97, 2.2, 1.5, .04, .12, .16, dark));
    guards.push({ center: [side * 1.05, .4, 1.5], size: [.14, .4, 1.1] });
  }
  cabinets.push({ center: [-4.4, 4.71, -.8], size: [1.3, 1.02, 5.2] }, { center: [2.6, 4.71, -3.8], size: [5.1, 1.02, 1] }, { center: [2.8, 4.71, 4.2], size: [5, 1.02, 1] });
  furniture.push({ center: [-4.4, 5.26, -.8], size: [1.4, .08, 5.3] }, { center: [2.6, 5.26, -3.8], size: [5.2, .08, 1.1] }, { center: [2.8, 5.26, 4.2], size: [5.1, .08, 1.1] });
  parts.push(boxesMesh("六柱架空车道的独立落地承脚及真正接承的横梁", dark, structure), boxesMesh("员工长梯井护栏和送餐井底座实体隔离件", dark, guards), boxesMesh("抬高厨房中避开员工门及送餐孔的实际落地操作柜", cabinetColor, cabinets), boxesMesh("高厨房真实接到柜体的连续操作台面", timber, furniture));
  return parts;
}
