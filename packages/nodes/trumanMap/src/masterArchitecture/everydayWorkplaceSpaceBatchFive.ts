import type { ModelPart } from "../assetModelParts";
import { combineMeshes, polygon } from "../masterNature/shared";
import { glazedFace, rectangle, wallYz } from "./everydayWorkplaceSpaceBatchOne";
import { stairFlight } from "./futureSpaceBatchSix";
import { xYWall } from "./futureSpaceBatchTen";
import { boxesMesh, type SolidBox } from "./publicSpaceBatchEight";
import { base, box, design, type ArchitecturePrototype } from "./structures";

const wallColor = "#b9b9af", concrete = "#a4aaa4", roofColor = "#87918c", dark = "#59676a", timber = "#9c896f";

function obliqueFacade(name: string, a: [number, number], b: [number, number], windows: [number, number][][], doors: [number, number][][]): ModelPart[] {
  const dx = b[0] - a[0], dz = b[1] - a[1], length = Math.hypot(dx, dz), tx = dx / length, tz = dz / length;
  return glazedFace(name, "xy", rectangle(0, 0.2, length, 14.4), windows, doors, 0).map(value => {
    const result = combineMeshes(value.name, value.color, [value]);
    result.vertices = result.vertices!.map(p => ({ x: (a[0] + b[0]) / 2 + tx * p.x - tz * p.z, y: p.y, z: (a[1] + b[1]) / 2 + tz * p.x + tx * p.z }));
    if (value.opacity !== undefined) result.opacity = value.opacity;
    if (value.roughness !== undefined) result.roughness = value.roughness;
    return result;
  });
}

export const everydayWorkplaceSpaceBatchFiveDesigns: ArchitecturePrototype[] = [
  design("双街夹角分翼办公楼", "收窄街角地块上的四层办公楼由两处前角梯井连接，大前厅接入中轴公共走廊，两侧街门经独立横廊贯通；两排梯形分房随斜街外墙逐段收窄，后端共享室保留真实门口", () => {
    const outline: [number, number][] = [[-24, -20], [24, -20], [5, 20], [-5, 20]], floors = [0.5, 4.1, 7.7, 11.3], edgeAt = (z: number) => 24 - (z + 20) * 19 / 40;
    const shafts: [number, number][][] = [-17, 17].map((x): [number, number][] => [[x - 1.6, -18], [x + 1.6, -18], [x + 1.6, -11.9], [x - 1.6, -11.9]]), parts: ModelPart[] = [base(65, 57, 0.2)], partitions: SolidBox[] = [], supports: SolidBox[] = [];
    for (let level = 0; level < 4; level++) {
      const top = floors[level]!;
      parts.push(polygon("随双斜街收窄并保留两座真实梯井的完整办公楼板", concrete, outline, 0.3, [0, top - 0.3, 0], level ? shafts : []));
      for (const side of [-1, 1]) {
        parts.push(wallYz("中轴走廊逐间开门并接入横街通廊的完整薄墙", rectangle(2.35, top, 26.3, 3.3), [-8.3, -4.5, 0, 7, 12.8].map(z => rectangle(z, top, z === -4.5 ? 2.4 : 1.1, 2.4)), side * 2.3, 0.12, wallColor));
        for (const z of [-5.7, -3.3, 4, 10]) { const edge = edgeAt(z) - 0.06; partitions.push({ center: [side * (edge + 2.3) / 2, top + 1.65, z], size: [edge - 2.3, 3.3, 0.12] }); }
        if (level < 3) for (let flight = 0; flight < 2; flight++) parts.push(stairFlight("两前角独立梯井中连续向上的薄腰实体梯段", [side * 17, top + flight * 1.8, -17.8 + flight * 2.8], 10, 0.18, 0.28, 2.5, 0.18));
        if (level) parts.push(box("前角楼梯上端实际接入公共前厅的完整落脚台", side * 17, top - 0.15, -11.75, 3.2, 0.3, 1, concrete));
        if (level && level < 3) parts.push(box("公共前厅接到下一跑角梯的完整起步平台", side * 17, top - 0.15, -18.15, 3.2, 0.3, 1.1, concrete));
      }
      parts.push(xYWall("前部双梯大前厅通往中轴走廊的实际大门口", rectangle(0, top, edgeAt(-10.8) * 2, 3.3), [rectangle(0, top, 4.6, 3)], -10.8, 0.12, wallColor), xYWall("办公楼收尖端共享室实际开门的完整薄隔墙", rectangle(0, top, edgeAt(15.5) * 2, 3.3), [rectangle(0, top, 2, 2.4)], 15.5, 0.12, wallColor));
    }
    const frontWindows = floors.flatMap((top, level) => [-20, -15, -10, -5, 0, 5, 10, 15, 20].filter(x => level || x !== 0).map(x => rectangle(x, top + 0.9, 3.2, 1.55)));
    parts.push(...glazedFace("街角办公楼宽前立面实际主门及逐层独立窗洞", "xy", rectangle(0, 0.2, 48, 14.4), frontWindows, [rectangle(0, 0.5, 3.2, 2.7)], -20), ...glazedFace("街角办公楼窄后端共享室的完整开窗外墙", "xy", rectangle(0, 0.2, 10, 14.4), floors.flatMap(top => [-2.4, 2.4].map(x => rectangle(x, top + 0.9, 2.8, 1.55))), [], 20));
    const sideLength = Math.hypot(19, 40), sideDoorAlong = 15.5 / 40 * sideLength - sideLength / 2;
    for (const side of [-1, 1]) {
      const sideWindows = floors.flatMap((top, level) => [4, 10, 16, 22, 28, 34, 40].filter(along => level || along !== 16).map(along => rectangle(along - sideLength / 2, top + 0.9, 3.4, 1.55)));
      parts.push(...obliqueFacade("斜街外墙实际侧门和各梯形办公室窗洞", [side * 24, -20], [side * 5, 20], sideWindows, [rectangle(sideDoorAlong, 0.5, 2.4, 2.5)]));
      const doorX = side * edgeAt(-4.5), inwardX = -side * 40 / sideLength, inwardZ = -19 / sideLength, stairs = stairFlight("斜街场坪实际接入横向公共通廊的两级短梯", [doorX - inwardX * 1.6, 0.2, -4.5 - inwardZ * 1.6], 2, 0.15, 0.8, 3);
      stairs.rotation.y = -Math.atan2(inwardZ, inwardX) * 180 / Math.PI; parts.push(stairs);
      for (const z of [-19.8, -6, 8, 19.8]) supports.push({ center: [side * (edgeAt(z) - 0.18), 7.4, z], size: [0.25, 14.4, 0.25] });
    }
    for (let start = 0; start < partitions.length; start += 16) parts.push(boxesMesh("梯形办公室真实分室墙与横街通廊两侧实体墙", wallColor, partitions.slice(start, start + 16)));
    for (const x of [-1.7, 1.7]) for (const z of [17.1, 18.1]) supports.push({ center: [x, 0.945, z], size: [0.08, 0.89, 0.08] });
    parts.push(boxesMesh("街角办公楼贯通承柱及共享桌真实落地桌脚", dark, supports), polygon("双斜街办公楼四边同形的完整平屋盖", roofColor, outline, 0.3, [0, 14.6, 0]), box("公共大前厅独立接待工作台", 6.5, 1.05, -17, 3, 1.1, 1.3, timber), box("收尖共享室完整长桌面", 0, 1.45, 17.6, 4.2, 0.12, 1.4, timber), stairFlight("前场实际接入办公楼公共前厅的两级短梯", [0, 0.2, -21.6], 2, 0.15, 0.8, 4));
    return parts;
  }, "建筑", "现代"),
];
