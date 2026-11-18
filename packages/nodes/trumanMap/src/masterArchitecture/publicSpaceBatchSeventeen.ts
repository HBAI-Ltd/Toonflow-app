import { part, type ModelPart } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { box, design, colors } from "./structures";
import { halfRoundWall } from "./spatialShells";
import { doorway } from "./publicSpaceBatchOne";
import { boxesMesh, standingPanel, type SolidBox } from "./publicSpaceBatchEight";
import { placeWing } from "./publicSpaceBatchFourteen";

const stone = "#b8b7a7", dark = "#52686c", wood = "#ad956d";

export const publicSpaceBatchSeventeenDesigns = [
  design("半环庭院社区诊所", "六间独立诊室从半环公共廊进入，直线接待前厅分别通向两端回廊和中央露天庭院，弧形外窗为每间诊室采光，公共廊始终保留完整净宽", semicircleClinic, "建筑", "现代"),
  design("三角内庭小学", "八间实分间教室沿三侧围住有顶公共廊，独立梯形接待前厅位于主入口一侧，中央露天活动庭从公共廊直接进入，三面教室外窗真正开孔", triangularSchool, "建筑", "现代"),
];

function semicircleClinic(): ModelPart[] {
  const p: ModelPart[] = [box("社区诊所半环与前厅共同落地场坪", 0, .1, 7, 40, .2, 26, stone), halfRoundWall("六诊室与半环公共廊共同的真实地面", 18, 10, .1, [0, .2, 0], 0, wood), halfRoundWall("中部保留露天庭院的完整半环屋盖", 18.3, 10.3, .2, [0, 3.9, 0], 0, dark), box("直线公共接待前厅与半环廊同高的地面", 0, .25, -2, 38, .1, 4, wood), box("前厅上方与半环屋面同高的完整顶盖", 0, 4, -2, 38.4, .2, 4, dark), doorway("直线接待前厅面向社区的实际主入口", [0, .3, -4], 38, 3.6, 3.2, 0, 2.6), doorway("接待前厅直接通向露天庭院的实际庭门", [0, .3, 0], 16, 3.6, 2.4, 0, 2.6), halfRoundWall("各诊室外窗下方实际弧形实体墙", 18, .2, 1, [0, .3, 0], 0, stone), halfRoundWall("各诊室外窗上方连续承顶墙带", 18, .2, .7, [0, 3.2, 0], 0, stone)];
  const glass = halfRoundWall("各独立诊室朝外的真实连续弧形窗", 17.98, .05, 1.9, [0, 1.3, 0], 0, colors.glass); glass.opacity = .24; p.push(glass);
  for (const side of [-1, 1]) p.push(doorway("前厅分别接入半环公共廊两端的实际门洞", [side * 9.5, .3, 0], 3, 3.6, 2, 0, 2.6), box("前厅两侧真正封合的外墙", side * 19, 2.1, -2, .24, 3.6, 4, stone), box("半环端部与前厅边缘之间的封合短墙", side * 18.5, 2.1, 0, 1, 3.6, .24, stone));
  for (let room = 0; room < 6; room++) {
    const start = room * Math.PI / 6, center = start + Math.PI / 12, halfDoor = .06, yaw = 90 - center * 180 / Math.PI;
    p.push(halfRoundWall("每间诊室门洞前半段真实弧形内墙", 11, .2, 3.6, [0, .3, 0], -start * 180 / Math.PI, stone, Math.PI / 12 - halfDoor), halfRoundWall("每间诊室门洞后半段真实弧形内墙", 11, .2, 3.6, [0, .3, 0], -(center + halfDoor) * 180 / Math.PI, stone, Math.PI / 12 - halfDoor), doorway("六间诊室分别朝向半环公共廊的真实门洞", [Math.cos(center) * 11 * Math.cos(halfDoor), .3, Math.sin(center) * 11 * Math.cos(halfDoor)], 22 * Math.sin(halfDoor), 3.6, 1.2, yaw, 2.4), part("诊室中实际落地的独立检查床座", "box", "#9ba891", [Math.cos(center) * 14.5, .675, Math.sin(center) * 14.5], [.9, .75, 2.1], [0, yaw, 0]), part("每间诊室外墙旁实际落地的工作台", "box", wood, [Math.cos(center) * 17.2, .7, Math.sin(center) * 17.2], [1.8, .8, .6], [0, yaw, 0]));
  }
  for (let edge = 0; edge <= 6; edge++) { const a = edge * Math.PI / 6; p.push(part("各独立诊室之间真正接到弧形外窗的径向隔墙", "box", stone, [Math.cos(a) * 14.5, 2.1, Math.sin(a) * 14.5], [7, 3.6, .18], [0, -a * 180 / Math.PI, 0])); }
  const court: [number, number][] = [[0, 0], ...Array.from({ length: 19 }, (_, i): [number, number] => [Math.cos(i * Math.PI / 18) * 7.8, Math.sin(i * Math.PI / 18) * 7.8])];
  p.push(polygon("诊所半环公共廊内侧独立露天绿庭", "#8d9e7d", court, .08, [0, .2, 0]), box("庭门连接绿庭的齐平步道", 0, .285, 3.5, 2, .03, 7, wood), box("接待前厅独立实际服务前台", 0, .8, -2, 5, 1, .7, wood));
  for (const x of [-15, 15]) p.push(box("前厅两端避让回廊门口的落地等候长座", x, .525, -1.2, 5, .45, .7, "#a2a991"));
  return p;
}

function triangle(radius: number): [number, number][] { return [[0, radius], [-Math.sqrt(3) * radius / 2, -radius / 2], [Math.sqrt(3) * radius / 2, -radius / 2]]; }

function triangularSchool(): ModelPart[] {
  const outer = triangle(30), inner = triangle(17), court = triangle(11), p: ModelPart[] = [polygon("小学建筑与外院共同落地的三角场坪", stone, triangle(31), .2), polygon("八教室与公共廊同高的完整三角楼面", wood, outer, .1, [0, .2, 0], [court]), polygon("中央露天活动庭真正挖空的三角屋面", dark, outer, .2, [0, 4.2, 0], [court]), polygon("公共廊中间真实低于走廊的露天活动绿庭", "#8d9f7c", court, .08, [0, .2, 0]), box("主门前与公共地面齐平的实际入场平台", 0, .15, -16.9, 4, .3, 3.8, stone), part("从场地地面连续接到小学入场平台的低缓坡", "extrude", stone, [0, 0, -20.3], [1, 1, 1], [0, -90, 0], { depth: 4, profile: [{ x: -1.5, y: 0 }, { x: 1.5, y: 0 }, { x: 1.5, y: .3 }, { x: -1.5, y: .02 }] }), box("入口一侧公共廊直接通往活动庭的齐平步道", 0, .285, -2.75, 2, .03, 5.5, wood)];
  const partitions: ModelPart[] = [];
  for (let side = 0; side < 3; side++) {
    const oa = outer[side]!, ob = outer[(side + 1) % 3]!, ia = inner[side]!, ib = inner[(side + 1) % 3]!, dx = ob[0] - oa[0], dz = ob[1] - oa[1], length = Math.hypot(dx, dz), innerLength = Math.hypot(ib[0] - ia[0], ib[1] - ia[1]), yaw = -Math.atan2(dz, dx) * 180 / Math.PI;
    const outerCenter: [number, number, number] = [(oa[0] + ob[0]) / 2, 0, (oa[1] + ob[1]) / 2], innerCenter: [number, number, number] = [(ia[0] + ib[0]) / 2, 0, (ia[1] + ib[1]) / 2];
    const outline: [number, number][] = side === 1 ? [[-length / 2, .3], [-1.8, .3], [-1.8, 3.1], [1.8, 3.1], [1.8, .3], [length / 2, .3], [length / 2, 4.2], [-length / 2, 4.2]] : [[-length / 2, .3], [length / 2, .3], [length / 2, 4.2], [-length / 2, 4.2]];
    const offsets = side === 1 ? [-length / 3, length / 3] : [-length / 3, 0, length / 3], holes = offsets.map((x): [number, number][] => [[x - 3.6, 1.3], [x + 3.6, 1.3], [x + 3.6, 3.4], [x - 3.6, 3.4]]);
    const facade = standingPanel("教室真实采光窗与主入口独立开孔的完整外墙", stone, outline, holes, 0, .24); facade.position.x = outerCenter[0]; facade.position.z = outerCenter[2]; facade.rotation.y = yaw; p.push(facade);
    const glass = boxesMesh("各教室真实外窗孔中的独立透明窗板", colors.glass, offsets.map(x => ({ center: [x, 2.35, 0], size: [7.2, 2.1, .05] })), outerCenter, yaw); glass.opacity = .24; p.push(glass);
    const desks: SolidBox[] = [], boards: SolidBox[] = [];
    for (let room = 0; room < 3; room++) {
      const q = (room - 1) * innerLength / 3, isLobby = side === 1 && room === 1;
      p.push(...placeWing([doorway(isLobby ? "独立梯形接待前厅进入公共廊的真实宽门" : "八间教室分别面向公共廊的真实独立门", [q, .3, 0], innerLength / 3, 3.9, isLobby ? 4 : 1.2, 0, 2.6)], innerCenter[0], innerCenter[2], yaw));
      if (isLobby) continue;
      boards.push({ center: [q + 2.8, 2.1, -.15], size: [2.5, 1.3, .05] });
      for (let row = 0; row < 3; row++) {
        const z = -1.5 - row * 1.6; desks.push({ center: [q, .98, z], size: [6, .12, .65] });
        for (const foot of [-1, 1]) desks.push({ center: [q + foot * 2.1, .61, z], size: [.12, .62, .55] });
      }
    }
    for (let start = 0; start < desks.length; start += 18) p.push(boxesMesh("各独立教室内部实际落地的分行课桌", wood, desks.slice(start, start + 18), innerCenter, yaw));
    p.push(boxesMesh("教室前墙上避开门洞的实际教学板", "#627c70", boards, innerCenter, yaw));
    for (const fraction of [0, 1 / 3, 2 / 3]) {
      const a: [number, number] = [ia[0] + (ib[0] - ia[0]) * fraction, ia[1] + (ib[1] - ia[1]) * fraction], b: [number, number] = [oa[0] + dx * fraction, oa[1] + dz * fraction], px = b[0] - a[0], pz = b[1] - a[1];
      partitions.push(part("每间教室边界从公共廊真实延伸到外墙的完整隔墙", "box", stone, [(a[0] + b[0]) / 2, 2.25, (a[1] + b[1]) / 2], [Math.hypot(px, pz), 3.9, .18], [0, -Math.atan2(pz, px) * 180 / Math.PI, 0]));
    }
  }
  const posts: SolidBox[] = court.map(([x, z]) => ({ center: [x, 2.25, z], size: [.2, 3.9, .2] }));
  p.push(...partitions, boxesMesh("露天庭三角转角实际承住有顶公共廊的立柱", dark, posts));
  return p;
}
