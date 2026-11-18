import { part, type ModelPart, type Triple } from "../assetModelParts";
import { sweptProfile } from "../masterNature/shared";
import { combineMeshes } from "../natureParts";
import { glazedWall } from "./modernResidenceSpaceBatchOne";
import { boxesMesh, type SolidBox } from "./publicSpaceBatchEight";
import { hardFloor } from "./vernacularWorldBatchSix";
import { box, cylinder, design, rail, type ArchitecturePrototype } from "./structures";

const paving = "#bab9a9", asphalt = "#657273", steel = "#657c7e", wood = "#a48c69", dark = "#485d61";
const degrees = Math.PI / 180;

function arcBand(name: string, color: string, inner: number, outer: number, bottom: number, top: number): ModelPart {
  const value = sweptProfile(name, color, [[inner, bottom], [outer, bottom], [outer, top], [inner, top]], 150 * degrees, 12);
  value.rotation.y = -15;
  return value;
}

function at(radius: number, angle: number, y = .2): Triple {
  return [Math.cos(angle * degrees) * radius, y, Math.sin(angle * degrees) * radius];
}

export const everydayServiceBuildingSpaceBatchThreeDesigns: ArchitecturePrototype[] = [
  design("弧形公共厅外沿充电休息站", "单条弯曲长公共厅由两端径向服务室和中部连续休息区组成，公众经开放内凹前场从内弧双门进入，外弧另接连续步廊与原生充电停靠雨棚；最外侧单向弧形车辆道连到两端外街，前场人行与外侧车流由完整站房分隔，主体没有闭合环廊或天井", arcChargingRestStation, "建筑", "现代"),
];

function arcChargingRestStation(): ModelPart[] {
  const publicArc = Array.from({ length: 13 }, (_, i): [number, number] => { const p = at(11.5, 15 + i * 12.5); return [p[0], p[2]]; }), publicFloor: [number, number][] = [...publicArc, [-4, publicArc[0]![1]], [-4, -7.5], [4, -7.5], [4, publicArc[0]![1]]], parts: ModelPart[] = [
    box("弧形休息站公众前庭与外侧车辆道共用的完整落地场坪", 0, .1, 14.5, 68, .2, 44, asphalt), arcBand("两端服务室与中部休息厅真正连续的弯曲实体楼面", paving, 11.5, 19, 0, .205), hardFloor("沿站房内弧止边且直接接外街的完整开放人行前场", paving, publicFloor, .205, [0, 0, 0]), arcBand("沿外弧独立接到充电停靠区的连续同高步廊", paving, 19, 21.2, 0, .205), arcBand("由内外弧承墙完整托起的弯曲公共厅厚屋盖", steel, 11.35, 19.25, 4.2, 4.44), arcBand("外凸停靠区上方真正连续且有壁厚的完整充电雨棚", steel, 19, 27.1, 4.8, 5.0),
  ], wallPieces: ModelPart[] = [];
  for (let segment = 0; segment < 12; segment++) {
    const start = 15 + segment * 12.5, end = start + 12.5;
    for (const radius of [11.5, 19]) {
      const a = at(radius, start), b = at(radius, end), length = Math.hypot(b[0] - a[0], b[2] - a[2]), mainDoor = radius === 11.5 && (segment === 5 || segment === 6), outerDoor = radius === 19 && (segment === 4 || segment === 7);
      wallPieces.push(...glazedWall(radius === 11.5 ? "公共厅内凹前场一侧真正开窗并保留双入口的连续折弧承墙" : "公共厅外凸步廊一侧真正开窗并保留出廊门的连续折弧承墙", [a[0], a[2]], [b[0], b[2]], .2, 4.2, mainDoor || outerDoor ? [[0, 3.25, Math.min(1.8, length - .3), .65]] : [[0, .75, length - .32, 2.8]], mainDoor || outerDoor ? [[0, .2, 1.8, 2.8]] : []));
    }
  }
  for (const angle of [15, 52.5, 127.5, 165]) {
    const a = at(11.5, angle), b = at(19, angle), exterior = angle === 15 || angle === 165;
    wallPieces.push(...glazedWall(exterior ? "弯曲站房两端真实封合且独立开后勤门的径向端墙" : "端服务室与连续公共厅之间真实开门的径向分室墙", [a[0], a[2]], [b[0], b[2]], .2, 4.2, exterior ? [[-1.8, 1.2, 2.3, 1.8]] : [], [[exterior ? 1.8 : -1.8, .2, 1.3, 2.5]]));
  }
  for (const angle of [15, 40, 65, 90, 115, 140, 165]) {
    for (const radius of [19.4, 26.6]) { const p = at(radius, angle, 2.4); parts.push(cylinder("避开原生车位且从地面实际升到充电雨棚梁下的完整承重柱", p[0], p[1], p[2], .22, 4.4, steel)); }
    parts.push(rail(at(19.3, angle, 4.7), at(27.1, angle, 4.7), .2, dark));
  }
  for (const angle of [28, 53, 78, 103, 128, 153]) {
    const p = at(20.4, angle, 1.05), yaw = 90 - angle;
    parts.push(part("外步廊边原生固定且不独立计主的充电服务立匣", "box", steel, p, [.48, 1.7, .32], [0, yaw, 0]), part("原生服务立匣朝停靠车位的操作窗", "box", dark, at(20.568, angle, 1.37), [.30, .30, .018], [0, yaw, 0]), part("原生充电立匣上真正垂回挂接点的完整柔性充电缆", "tube", dark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: .022, path: [at(20.55, angle, 1.50), at(21.0, angle + .5, 1.14), at(21.0, angle + .5, .48), at(20.55, angle, .80)].map(([x, y, z]) => ({ x, y, z })) }));
    for (const boundary of [-3.5, 3.5]) parts.push(part("原生放射停靠车位实际贴地的薄标线", "box", paving, at(23.8, angle + boundary, .205), [.055, .01, 5], [0, 90 - angle - boundary, 0]));
  }
  const storageBoards: SolidBox[] = [];
  for (const angle of [60, 90, 120]) {
    const seat = at(16.6, angle, .46), back = at(17.05, angle, .90);
    parts.push(part("中部公共厅保留内弧主步道的原生弯向休息座台", "box", wood, seat, [3.4, .52, .8], [0, 90 - angle, 0]), part("与休息座台真正接合的完整靠背", "box", wood, back, [3.4, .85, .14], [0, 90 - angle, 0]));
  }
  for (const angle of [32, 148]) {
    const furnishedAngle = angle < 90 ? angle + 8 : angle - 8, storageAngle = angle < 90 ? angle - 8 : angle + 8, p = at(16, furnishedAngle, .74); parts.push(part("两端服务室内避开径向隔墙的固定工作台", "box", wood, p, [2.6, 1.08, .9], [0, 90 - furnishedAngle, 0]));
    const a = at(11.5, angle), b = at(19, angle); wallPieces.push(...glazedWall("端部服务室内真实开门分隔的员工与公共小室墙", [a[0], a[2]], [b[0], b[2]], .2, 4.2, [], [[-1.6, .2, 1.1, 2.4]]));
    for (const y of [.55, 1.25, 1.95]) storageBoards.push({ center: [0, y, 0], size: [1.9, .08, .45] });
    for (const x of [-.9, .9]) for (const z of [-.18, .18]) storageBoards.push({ center: [x, 1, z], size: [.08, 2, .08] });
    parts.push(boxesMesh("端服务室内层板由四根接地立脚真实承住的完整物架", paving, storageBoards.splice(0), at(17.6, storageAngle, .2), 90 - storageAngle));
  }
  const panels = wallPieces.filter(value => value.shape === "mesh"), panes = wallPieces.filter(value => value.shape === "box").map(value => boxesMesh("真实窗孔内保留朝向的独立透明窗板", value.color, [{ center: [0, 0, 0], size: [value.scale.x, value.scale.y, value.scale.z] }], [value.position.x, value.position.y, value.position.z], value.rotation.y));
  let group: ModelPart[] = [], vertices = 0;
  for (const panel of panels) {
    if (vertices + panel.vertices!.length > 480) { parts.push(combineMeshes("保留全部真门窗孔和径向端口的完整弧厅承墙", panels[0]!.color, group)); group = []; vertices = 0; }
    group.push(panel); vertices += panel.vertices!.length;
  }
  if (group.length) parts.push(combineMeshes("保留全部真门窗孔和径向端口的完整弧厅承墙", panels[0]!.color, group));
  for (let start = 0; start < panes.length; start += 20) parts.push({ ...combineMeshes("完整弧厅各真实窗孔内分离的透明窗板", panes[0]!.color, panes.slice(start, start + 20)), opacity: .28, roughness: .22 });
  return parts;
}
