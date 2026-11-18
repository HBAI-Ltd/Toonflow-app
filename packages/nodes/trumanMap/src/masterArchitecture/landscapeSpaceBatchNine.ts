import { part, type ModelPart } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { box, colors, cylinder, design, pipe, rail, roof } from "./structures";

// 桥上完整商住空间与实验拖曳池的类型参考；原创简化形体，不复刻地标或设备规格。
// https://www.visittuscany.com/en/attractions/ponte-vecchio/
// https://www.southampton.ac.uk/research/facilities/towing-tank
const stone = "#aaa99a", wood = "#947e5d", steel = "#7b928d";

function shopBridgeBody(): ModelPart {
  const outline: [number, number][] = [[-25, 0]];
  for (const center of [-16, 0, 16]) {
    outline.push([center - 7, 0], [center - 7, 1.18]);
    for (let i = 1; i <= 12; i++) { const a = Math.PI - i * Math.PI / 12; outline.push([center + Math.cos(a) * 7, 1.18 + Math.sin(a) * 7]); }
    outline.push([center + 7, 0]);
  }
  outline.push([25, 0], [25, 9.18], [-25, 9.18]);
  const value = polygon("三道真拱孔上方连续承托街房的完整石桥身", stone, outline.map(([x, y]) => [x, -y]), 16, [0, 0, -8]);
  const original = value.vertices!, count = original.length / 2, vertices = [...original], indices: number[] = [];
  for (let i = 0; i < value.indices!.length; i += 3) {
    const face = value.indices!.slice(i, i + 3);
    if (face.every(index => index < count) || face.every(index => index >= count)) indices.push(...face);
  }
  // ACT: 两大片立面保持平面法线，每个拱壁独立四顶点，避免盖面/拱底共顶点产生三角阴影。
  for (let i = 0; i < count; i++) {
    const j = (i + 1) % count, n = vertices.length;
    vertices.push({ ...original[i]! }, { ...original[i + count]! }, { ...original[j + count]! }, { ...original[j]! });
    indices.push(n, n + 1, n + 2, n, n + 2, n + 3);
  }
  value.vertices = vertices; value.indices = indices; value.rotation.x = 90;
  return value;
}

export const landscapeSpaceBatchNineDesigns = [
  design("桥上双侧商铺廊街", "三道完整石券与连续拱肩承托公共沿桥街，两侧店铺各有真实内部房间、面街入口和临河窗洞，整条街从桥两端贯通", () => {
    const parts: ModelPart[] = [shopBridgeBody(), box("石桥上方连续公共街与店房地板", 0, 9.33, 0, 50, .3, 16, stone)];
    for (const side of [-1, 1]) {
      const z = side * 6;
      for (const x of [-18, -6, 6, 18]) {
        parts.push(...[-1, 1].map(s => box("商铺背墙窗孔两边完整墙垛", x + s * 3.6, 11.48, side * 7.9, 4.8, 4, .2, "#b7ad94")), box("商铺真窗孔下方连续矮墙", x, 10.08, side * 7.9, 2.4, 1.2, .2, "#b7ad94"), box("商铺窗洞上方完整石楣", x, 12.78, side * 7.9, 2.4, 1.4, .2, "#b7ad94"), part("临河窗洞内可透视的独立玻璃", "box", colors.glass, [x, 11.38, side * 7.9], [2.2, 1.3, .025], [0, 0, 0], { opacity: .3, roughness: .2 }), box("临河窗洞的竖向木分框", x, 11.38, side * 7.91, .07, 1.4, .05, wood), box("临河窗洞的横向木分框", x, 11.38, side * 7.91, 2.4, .07, .05, wood), box("面街且真实落在房间地板上的矮柜台", x, 9.93, side * 4.3, 4.2, .9, .7, wood));
      }
      for (const x of [-24, -12, 0, 12, 24]) parts.push(box("把整列店铺分成可进入房间的隔墙", x, 11.48, z, .2, 4, 4, "#b7ad94"), box("面街店口之间的实际承顶木柱", x, 11.48, side * 4, .3, 4, .3, wood));
      parts.push(box("连续店口上方承檐木梁", 0, 13.3, side * 4, 49, .36, .3, wood));
      const cover = roof(0, 13.475, z, 4.8, 52); cover.rotation.y = 90; cover.color = "#8e7c65"; parts.push(cover);
    }
    return parts;
  }, "建筑", "欧式"),
  design("长直船模拖曳试验池", "长直试验水池两侧轨道承托跨池运行拖车桥，桥前拖杆伸至水面下测阻位置，末端斜坡吸波区与两侧维护通道保持分离，模型为静态设施", () => {
    const parts: ModelPart[] = [];
    for (const z of [-30, 30]) {
      parts.push(box("试验池整段连续厚底板", 0, .2, z, 10.6, .4, 60, stone), box("长直试验池静态水面", 0, 3.2, z, 6.9, .025, 59.8, colors.water));
      for (const side of [-1, 1]) parts.push(box("直接承托维护通道的试验池侧壁", side * 3.7, 2.4, z, .4, 4, 60, stone), box("双侧完整高位维护通道", side * 4.5, 4.3, z, 1.4, .2, 60, stone), box("整条拖车桥行走精确长轨", side * 4.2, 4.6, z, .12, .12, 60, steel));
    }
    parts.push(...[-1, 1].map(s => box("试验水池两端封闭止水墙", 0, 2.4, s * 60, 7.8, 4, .4, stone)));
    for (const side of [-1, 1]) for (const z of [-1.1, 1.1]) parts.push(cylinder("拖车桥在两侧轨道上滚动的独立钢轮", side * 4.2, 4.86, z, .4, .2, steel, [0, 0, 90]), box("接到桥架底面的轮轴承壳", side * 4.2, 5, z, .32, .3, .35, steel));
    parts.push(box("跨过真实水面的完整拖车桥底架", 0, 5.2, 0, 9.2, .25, 3, steel), ...[-1, 1].map(s => box("跨池拖车桥两侧主承梁", 0, 5, s * 1.2, 9.2, .3, .25, steel)));
    parts.push(...[-1, 1].flatMap(x => [-1, 1].map(z => box("拖车操作舱独立承顶细柱", x * 1.7, 6.25, z * .9, .1, 1.8, .1, steel))), box("拖车操作舱完整遮雨顶板", 0, 7.2, 0, 3.7, .1, 2.2, "#aab8a8"), part("两侧实际固定到操作舱前柱的透视风挡", "box", colors.glass, [0, 6.3, -.94], [3.34, 1.6, .025], [0, 0, 0], { opacity: .25, roughness: .2 }), box("拖曳采集操作面板", 0, 5.8, .3, 2.5, .15, .5, "#657e79"), ...[-1, 1].map(side => box("采集操作面板真正接到拖车底架的独立承脚", side * .9, 5.525, .3, .1, .4, .15, steel)));
    parts.push(rail([0, 5.2, -1.3], [0, 5.2, -1.7], .18, steel), pipe("伸到水面以下的独立拖曳测阻杆", [0, 5.2, -1.7], [0, 2.6, -1.7], .12), box("拖杆下端连接船模的测力接头", 0, 2.6, -1.7, .35, .18, .25, steel));
    parts.push(part("终端完整吸波斜坡承台", "extrude", stone, [0, 0, 0], [1, 1, 1], [0, 90, 0], { depth: 6.6, profile: [{ x: -49.5, y: .4 }, { x: -60, y: .4 }, { x: -60, y: 4.1 }] }));
    return parts;
  }, "建筑", "现代"),
];
