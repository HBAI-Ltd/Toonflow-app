import { combineMeshes } from "../masterNature/shared";
import type { ModelPart, Triple } from "../assetModelParts";
import { box, cylinder, design } from "./structures";
import { boxBatch, hardPlan } from "./everydayOutdoorSpaceBatchOne";

const paving = "#bcb9a8", asphalt = "#7b8b81", metal = "#71867c", wall = "#acb3a8", glass = "#96b9ae", white = "#d7d6c0", red = "#b58068";

function verticalPanel(name: string, outline: [number, number][], holes: [number, number][][], depth: number, position: Triple, yaw = 0): ModelPart {
  const value = hardPlan(name, wall, outline, depth, [0, 0, 0], holes);
  value.vertices = value.vertices!.map(p => ({ x: p.x, y: p.z, z: depth / 2 - p.y })); value.position = { x: position[0], y: position[1], z: position[2] }; value.rotation.y = yaw; return value;
}

export const everydayOutdoorSpaceBatchSevenDesigns = [
  design("多岛分流公路收费广场", "双车道逐渐展开为独立收费通道后重新合流，尖端收费岛上可进入的收费间有真实服务窗口和后门，共用柱梁大雨棚跨过各通道，抬起的栏杆给车辆留下通过净空", () => {
    const road: [number, number][] = [[-4.5, -40], [4.5, -40], [17, -15], [17, 15], [4.5, 40], [-4.5, 40], [-17, 15], [-17, -15]], parts: ModelPart[] = [hardPlan("两车道渐变展开并回收的完整收费站车行路体", asphalt, road, .2), box("跨过全部收费岛及车道的完整共用雨顶", 0, 5.975, 0, 34, .25, 12, metal)], walls: ModelPart[][] = [[], [], [], []], floors: Triple[] = [], roofs: Triple[] = [], sideWindows: Triple[] = [], frontWindows: Triple[] = [], counters: Triple[] = [], thresholds: Triple[] = [], pillars: Triple[] = [], purlins: Triple[] = [], queue: Triple[] = [];
    const island: [number, number][] = [[-1, -10], [0, -13], [1, -10], [1, 10], [0, 13], [-1, 10]];
    for (const x of [-12, -6, 0, 6, 12]) parts.push(hardPlan("首尾收尖且真实分开收费车流的独立长岛", paving, island, .4, [x, 0, 0]));
    for (const side of [-1, 1]) parts.push(box("收费广场外缘独立公共步道", side * 15.5, .2, 0, 3, .4, 30, paving));
    for (const x of [-15.5, -12, -6, 0, 6, 12, 15.5]) for (const z of [-4.5, 4.5]) pillars.push([x, 2.925, z]);
    for (let x = -16; x <= 16; x += 2) purlins.push([x, 5.79, 0]);
    parts.push(...boxBatch("位于收费岛及外步道上且实际承托共用大棚的完整立柱", metal, pillars, [.24, 5.05, .24]), ...boxBatch("连通两排承梁并实际托住薄雨顶的密排檩条", metal, purlins, [.1, .12, 12]));
    for (const z of [-4.5, 4.5]) parts.push(box("同时搭接各收费岛立柱的完整跨道承重梁", 0, 5.65, z, 33, .4, .3, metal));
    const sideWindow: [number, number][] = [[-1.4, 1.1], [.9, 1.1], [.9, 2.5], [-1.4, 2.5]], frontWindow: [number, number][] = [[-.55, 1.2], [.55, 1.2], [.55, 2.5], [-.55, 2.5]];
    for (const x of [-12, -6, 0, 6]) {
      floors.push([x, .48, 0]); roofs.push([x, 3.5, 0]); thresholds.push([x, .48, 2.2]);
      for (const side of [-1, 1]) { walls[side < 0 ? 0 : 1]!.push(verticalPanel("收费间两侧留实际服务窗口的完整薄外墙", [[-2, .56], [2, .56], [2, 3.4], [-2, 3.4]], [sideWindow], .12, [x + side * .8, 0, 0], -90)); sideWindows.push([x + side * .8, 2.05, -.25]); counters.push([x + side * .85, 1.15, -.25]); }
      walls[2]!.push(verticalPanel("收费间面向来车且开实际观察窗的正面墙", [[-.8, .56], [.8, .56], [.8, 3.4], [-.8, 3.4]], [frontWindow], .12, [x, 0, -2]));
      walls[3]!.push(verticalPanel("收费间背面保留可进入后门的完整墙体", [[-.8, .56], [-.4, .56], [-.4, 2.76], [.4, 2.76], [.4, .56], [.8, .56], [.8, 3.4], [-.8, 3.4]], [], .12, [x, 0, 2]));
      frontWindows.push([x, 1.85, -2]);
    }
    for (const group of walls) parts.push(combineMeshes("各收费间保留独立门窗空腔的同向墙体合批", wall, group));
    parts.push(...boxBatch("各收费间独立且真正接住外墙的完整地板", paving, floors, [1.72, .16, 4.12]), ...boxBatch("各收费间由四面实墙承托的独立小屋盖", metal, roofs, [1.9, .2, 4.3]), ...boxBatch("收费间后门实际接入收费岛面的短踏台", paving, thresholds, [1, .16, .4]), ...boxBatch("服务窗下端与两侧墙框实际接合的交易台", metal, counters, [.32, .1, 2.4]), ...boxBatch("服务窗上部固定玻璃保留下半递物开口", glass, sideWindows, [.025, .92, 2.32]).map(value => ({ ...value, opacity: .3, roughness: .15 })), ...boxBatch("正面实际窗洞内固定观察玻璃", glass, frontWindows, [1.12, 1.32, .025]).map(value => ({ ...value, opacity: .3, roughness: .15 })));
    const angle = 80 * Math.PI / 180, length = 3.9;
    for (const lane of [-9, -3, 3, 9]) {
      const pivot = lane - 2.25;
      parts.push(box("位于收费岛后部并承接开启栏杆的独立驱动箱", pivot, .8, 4, .4, .8, .45, metal), cylinder("抬杆与岛上驱动箱实际相接的横向铰轴", pivot, 1.3, 4, .26, .6, metal, [90, 0, 0]));
      const arm = box("抬起后实际避开车辆通过净空的独立收费栏杆", pivot + Math.cos(angle) * length / 2, 1.3 + Math.sin(angle) * length / 2, 4, length, .09, .12, white); arm.rotation.z = 80; parts.push(arm);
      for (const distance of [.8, 2, 3.2]) { const band = box("抬杆表面相间警示色带", pivot + Math.cos(angle) * distance, 1.3 + Math.sin(angle) * distance, 4, .35, .094, .124, red); band.rotation.z = 80; parts.push(band); }
      for (const side of [-1, 1]) queue.push([lane + side * 1.8, .21, -7.5]);
    }
    parts.push(...boxBatch("收费车道在尖岛之间保持实际宽度的排队界线", white, queue, [.06, .02, 9]));
    return parts;
  }, "设施", "现代"),
];
