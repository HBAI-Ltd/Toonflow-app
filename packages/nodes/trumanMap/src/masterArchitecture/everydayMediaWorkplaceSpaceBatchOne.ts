import { part, type ModelPart } from "../assetModelParts";
import { glazedWall } from "./modernResidenceSpaceBatchOne";
import { boxesMesh, type SolidBox } from "./publicSpaceBatchEight";
import { stairFlight } from "./publicSpaceBatchSteps";
import { box, cylinder, design, rail, type ArchitecturePrototype } from "./structures";
import { hardFloor } from "./vernacularWorldBatchSix";

type Point = [number, number];
const paving = "#afb4a9", timber = "#a18d6c", steel = "#627578", dark = "#4b5c5f", roof = "#84928a";

function jambs(start: Point, end: Point, fraction: number, width: number): [Point, Point] {
  const length = Math.hypot(end[0] - start[0], end[1] - start[1]), ux = (end[0] - start[0]) / length, uz = (end[1] - start[1]) / length;
  return [-1, 1].map(side => [start[0] + (end[0] - start[0]) * fraction + side * ux * width / 2, start[1] + (end[1] - start[1]) * fraction + side * uz * width / 2] as Point) as [Point, Point];
}

function openedLeaf(name: string, start: Point, end: Point, fraction: number, width: number, bottom: number, height: number, swing: number): ModelPart[] {
  const length = Math.hypot(end[0] - start[0], end[1] - start[1]), nx = (end[1] - start[1]) / length * swing, nz = -(end[0] - start[0]) / length * swing, hinge = jambs(start, end, fraction, width)[0];
  return [part(name, "box", timber, [hinge[0] + nx * width / 2, bottom + height / 2, hinge[1] + nz * width / 2], [width, height, .08], [0, -Math.atan2(nz, nx) * 180 / Math.PI, 0]), cylinder(`${name}真实纵向铰轴`, hinge[0], bottom + height / 2, hinge[1], .08, height, steel)];
}

function sideGalleryRecordingHouse(): ModelPart[] {
  const outer: Point[] = [[-5.5, -6], [4.7, -6], [6, 2], [4.8, 9], [-5.5, 9]], inner: Point[] = [[-4.8, -5.3], [4.1, -5.3], [5.3, 2], [4.2, 8.3], [-4.8, 8.3]], floating: Point[] = [[-5.08, -5.58], [4.34, -5.58], [5.58, 2], [4.44, 8.58], [-5.08, 8.58]];
  const outerEastStart: Point = [6, 2], outerEastEnd: Point = [4.8, 9], innerEastStart: Point = [5.3, 2], innerEastEnd: Point = [4.2, 8.3], outerFraction = 2.5 / 7, innerFraction = 2.5 / 6.3;
  const outerDoor = (outerFraction - .5) * Math.hypot(1.2, 7), innerDoor = (innerFraction - .5) * Math.hypot(1.1, 6.3), outerJambs = jambs(outerEastStart, outerEastEnd, outerFraction, 1.4), innerJambs = jambs(innerEastStart, innerEastEnd, innerFraction, 1.2);
  const p: ModelPart[] = [
    box("整座录音制作楼及外墙脚下的连续落地基础", 0, .12, 0, 29.2, .24, 29.2, paving),
    part("公共前厅主入口真正从场地上升的连续缓坡", "extrude", paving, [0, 0, 0], [1, 1, 1], [0, -90, 0], { depth: 3.2, profile: [{ x: -17.6, y: 0 }, { x: -14.6, y: 0 }, { x: -14.6, y: .24 }] }),
    part("后勤装卸门独立接回场地的连续缓坡", "extrude", paving, [-2, 0, 0], [1, 1, 1], [0, -90, 0], { depth: 3, profile: [{ x: 14.6, y: 0 }, { x: 17.6, y: 0 }, { x: 14.6, y: .24 }] }),
    ...glazedWall("公共接待前翼的真实街窗和主入口", [-14, -14], [14, -14], .24, 3.84, [[-8, 1.10, 5, 1.5], [8, 1.10, 5, 1.5]], [[0, .24, 2.4, 2.7]]),
    ...glazedWall("西控制翼及后勤边廊的完整承重外墙", [-14, -14], [-14, 14], .24, 3.84, [[-11, 1.10, 3.6, 1.5], [0, 1.25, 4, 1.5], [11.5, 1.25, 2.5, 1.5]]),
    ...glazedWall("东服务回路外墙真实侧门与前翼采光窗", [14, -14], [14, 14], .24, 3.84, [[-11, 1.10, 3.6, 1.5], [-4, 1.25, 3, 1.5]], [[10.5, .24, 1.3, 2.4]]),
    ...glazedWall("后勤工作带后墙真实装卸门及独立人员门", [-14, 14], [14, 14], .24, 3.84, [[-10, 1.25, 3, 1.5]], [[-2, .24, 2.4, 2.8], [11, .24, 1.3, 2.4]]),
    hardFloor("接待翼控制廊及后勤回路共同低屋盖真实绕开高厅", roof, [[-14.3, -14.3], [14.3, -14.3], [14.3, 14.3], [-14.3, 14.3]], .22, [0, 3.84, 0], [[[-5.4, -5.9], [4.6, -5.9], [5.9, 2], [4.7, 8.9], [-5.4, 8.9]]]),
    hardFloor("非平行折壁高录音厅完整外壳屋盖", roof, [[-5.75, -6.25], [4.93, -6.25], [6.25, 2], [5.03, 9.25], [-5.75, 9.25]], .24, [0, 6.8, 0]),
    hardFloor("独立内壳地台覆盖全部内墙和墙脚承柱", timber, floating, .12, [0, .36, 0]),
    hardFloor("独立内录音壳完整吊顶与外屋盖间保留空气层", dark, floating, .20, [0, 6.2, 0]),
    ...glazedWall("高厅外壳完整前隔声墙", outer[0]!, outer[1]!, .24, 6.8, []),
    ...glazedWall("高厅外壳前段折壁", outer[1]!, outer[2]!, .24, 6.8, []),
    ...glazedWall("高厅外壳面向侧声闸的真实工作门", outerEastStart, outerEastEnd, .24, 6.8, [], [[outerDoor, .24, 1.4, 2.64]]),
    ...glazedWall("高厅外壳后装卸声闸的真实宽门", [-5.5, 9], [4.8, 9], .24, 6.8, [], [[1.35, .24, 2.2, 3.0]]),
    ...glazedWall("西侧长控制廊朝向高厅的外层观察窗墙", [-5.5, -6], [-5.5, 9], .24, 6.8, [[-.5, 1.60, 5, 1.4]]),
    ...glazedWall("浮筑录音内壳完整前隔声墙", inner[0]!, inner[1]!, .48, 6.2, []),
    ...glazedWall("浮筑录音内壳前段非平行折壁", inner[1]!, inner[2]!, .48, 6.2, []),
    ...glazedWall("内录音壳与侧声闸两级短梯对接的真实内门", innerEastStart, innerEastEnd, .48, 6.2, [], [[innerDoor, .48, 1.2, 2.4]]),
    ...glazedWall("内录音壳后工作门与独立高阈对接", [-4.8, 8.3], [4.2, 8.3], .48, 6.2, [], [[1.3, .48, 1.8, 2.76]]),
    ...glazedWall("控制廊观察窗内侧独立第二层隔声窗墙", [-4.8, -5.3], [-4.8, 8.3], .48, 6.2, [[-.5, 1.60, 5, 1.4]]),
    ...glazedWall("前公共厅与横向工作前廊之间两座错位通门", [-14, -8], [14, -8], .24, 3.84, [], [[-9, .24, 1.5, 2.5], [10, .24, 1.5, 2.5]]),
    ...glazedWall("西控制廊前端独立工作人员入口", [-14, -6], [-5.5, -6], .24, 3.84, [], [[-.25, .24, 1.4, 2.4]]),
    ...glazedWall("西控制廊后端接入后勤边廊的真实通门", [-14, 9], [-5.5, 9], .24, 3.84, [], [[-.25, .24, 1.4, 2.4]]),
    ...glazedWall("后装卸声闸西壁接入控制翼后廊的人员门", [-5.5, 9], [-5.5, 14], .24, 3.84, [], [[.5, .24, 1.3, 2.4]]),
    ...glazedWall("后装卸声闸东壁接入设备服务回路的人员门", [5.5, 9], [5.5, 14], .24, 3.84, [], [[.5, .24, 1.3, 2.4]]),
    ...glazedWall("侧声闸前端实际连接高厅外墙的短隔声壁", [6.0, 2.2], [9.6, 2.2], .24, 3.4, []),
    ...glazedWall("侧声闸后端实际连接斜厅外墙的短隔声壁", [5.1, 6.8], [9.6, 6.8], .24, 3.4, []),
    ...glazedWall("侧声闸外门与高厅内门沿纵向错位", [9.6, 2.2], [9.6, 6.8], .24, 3.4, [], [[-1.5, .24, 1.3, 2.4]]),
    hardFloor("侧声闸低顶实际接入外壳且保留上方服务空气层", roof, [[5.98, 2.15], [9.85, 2.15], [9.85, 7.05], [5.02, 7.05]], .18, [0, 3.4, 0]),
    ...glazedWall("侧门喉道前侧跨双层墙腔的真实门洞侧封", innerJambs[0], outerJambs[0], .24, 3.0, []),
    ...glazedWall("侧门喉道后侧跨双层墙腔的真实门洞侧封", outerJambs[1], innerJambs[1], .24, 3.0, []),
    hardFloor("侧门双层墙腔上方实际闭合的门洞顶封", steel, [outerJambs[0], outerJambs[1], innerJambs[1], innerJambs[0]], .12, [0, 2.88, 0]),
    box("侧声闸短梯高端实际搭接浮筑地台的门阈", 4.92, .42, 4.5, .35, .12, 1.10, timber),
    ...glazedWall("后装卸宽门西侧跨越两壳空气层的真实侧封", [-.1, 9], [.1, 8.3], .24, 3.36, []),
    ...glazedWall("后装卸宽门东侧跨越两壳空气层的真实侧封", [1.9, 8.3], [2.1, 9], .24, 3.36, []),
    hardFloor("后装卸双层门洞上方真实连通两壳的顶封", steel, [[-.1, 9], [2.1, 9], [1.9, 8.3], [.1, 8.3]], .12, [0, 3.24, 0]),
    box("后装卸坡道高端与浮筑地板实际相接的弹性过门阈", 1, .42, 8.5, 1.8, .12, .4, timber),
    part("后装卸声闸内真正连接低坪与高录音地台的缓坡", "extrude", paving, [1, 0, 0], [1, 1, 1], [0, -90, 0], { depth: 1.8, profile: [{ x: 8.7, y: .24 }, { x: 11.9, y: .24 }, { x: 8.7, y: .48 }] }),
    ...openedLeaf("侧声闸外门打开后停靠前侧的实体隔声门扇", [9.6, 2.2], [9.6, 6.8], .8 / 4.6, 1.3, .24, 2.38, -1),
    ...openedLeaf("录音内门打开后停靠录音厅侧的实体隔声门扇", innerEastStart, innerEastEnd, innerFraction, 1.2, .48, 2.38, -1),
    ...openedLeaf("后录音宽门打开后避开装卸中线的实体隔声门扇", [-4.8, 8.3], [4.2, 8.3], 5.8 / 9, 1.8, .48, 2.74, 1),
    box("西控制廊面向双层观察窗的落地调音工作台", -7.2, .69, 1, 1.4, .90, 3.6, steel),
    box("前公共接待厅避开主门中线的完整接待台", -6, .84, -11.5, 4, 1.2, 1.2, timber),
    box("前公共厅东侧实际落地的等候长座", 8, .49, -11.5, 3, .50, .9, timber),
  ];
  const steps = stairFlight("侧声闸内向上接入独立录音地台的两级短梯", 0, .24, 0, 1.10, 2, .12, .35); steps.position.x = 5.72; steps.position.z = 4.5; steps.rotation.y = -90; p.push(steps);
  const escape = stairFlight("东侧后勤人员门实际接回场地的两级台阶", 0, 0, 0, 2, 2, .12, .45); escape.position.x = 15.5; escape.position.z = 10.5; escape.rotation.y = -90; p.push(escape);
  const pads: SolidBox[] = [], innerStructure: SolidBox[] = [], outerStructure: SolidBox[] = [];
  for (const x of [-3.6, 0, 3.6]) for (const z of [-3, 1.5, 6]) pads.push({ center: [x, .31, z], size: [.45, .14, .45] });
  for (const z of [-3, 1.5, 6]) innerStructure.push({ center: [0, .365, z], size: [8.6, .08, .22] });
  for (const [x, z] of inner) innerStructure.push({ center: [x, 3.34, z], size: [.32, 5.72, .32] });
  for (const [x, z] of outer) outerStructure.push({ center: [x, 3.52, z], size: [.40, 6.56, .40] });
  for (const z of [-4, 2, 8]) {
    outerStructure.push({ center: [-9.75, 3.68, z], size: [8.7, .36, .22] });
    const start = z === 2 ? 5.9 : z === -4 ? 4.9 : 4.85; outerStructure.push({ center: [(start + 14.1) / 2, 3.68, z], size: [14.1 - start, .36, .22] });
    outerStructure.push({ center: [z === 2 ? .25 : -.25, 6.70, z], size: [z === 2 ? 11.7 : 10.7, .24, .24] });
  }
  for (const x of [-12, 0, 12]) outerStructure.push({ center: [x, 3.68, -10], size: [.22, .36, 8.2] });
  p.push(boxesMesh("录音独立地台之下真实落在主楼地坪的九个隔振支座", dark, pads), boxesMesh("内壳墙脚承柱及浮筑地台木肋的实际支承组", timber, innerStructure), boxesMesh("外壳角柱和高低屋盖承梁连续承接的独立结构组", steel, outerStructure));
  for (const z of [-1.2, 3.2]) p.push(box("控制廊面向观察窗且不占通路的落地监听箱", -5.95, 1.14, z, .45, 1.80, .45, dark));
  for (const [index, z] of [-2, 1, 4].entries()) {
    p.push(part("录音内壳吊顶之下真实悬吊的轻斜反射板", "box", timber, [0, 5.68, z], [6.4, .10, 1.8], [index % 2 ? -3 : 3, 0, 0]));
    for (const x of [-2.4, 2.4]) p.push(rail([x, 5.72, z], [x, 6.25, z], .025, steel));
  }
  return p;
}

export const everydayMediaWorkplaceSpaceBatchOneDesigns: ArchitecturePrototype[] = [
  design("侧控廊错列声闸录音制作楼", "非平行折壁的高录音内核具有独立支承浮筑地台、双层观察窗和不桥接外屋梁的内吊顶；西侧控制廊、前公共接待翼、东侧折返声闸与后装卸缓坡分别形成可走工作路径，双层门喉真实封边且门扇避开通行中线", sideGalleryRecordingHouse, "建筑", "现代"),
];
