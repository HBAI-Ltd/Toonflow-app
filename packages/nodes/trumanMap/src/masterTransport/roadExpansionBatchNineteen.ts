import { BoxGeometry } from "three";
import { part, type ModelPart, type Triple } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { box, cab, cylinder, strut, transportColors, type TransportDefinition } from "./parts";

function crawlerSide(x: number): ModelPart[] {
  const contour = (radius: number): [number, number][] => [...Array.from({ length: 9 }, (_, index): [number, number] => { const a = (-90 + index * 22.5) * Math.PI / 180; return [0.7 + Math.sin(a) * radius, 2.8 + Math.cos(a) * radius]; }), ...Array.from({ length: 9 }, (_, index): [number, number] => { const a = (90 + index * 22.5) * Math.PI / 180; return [0.7 + Math.sin(a) * radius, -2.8 + Math.cos(a) * radius]; })];
  const band = polygon("重型履带保留轮架与负重轮内腔", transportColors.dark, contour(0.7), 1.0, [x + 0.5, 0, 0], [contour(0.53)]);
  band.rotation.z = 90;
  return [band, box("连续履带内承接横向底盘的轮架", [x, 0.8, 0], [0.65, 0.7, 5.7], transportColors.dark), ...[-2.8, -1.4, 0, 1.4, 2.8].map(z => cylinder("与履带实际相接的重载负重导向轮", [x, 0.7, z], [1.06, 0.78, 1.06], transportColors.body, [0, 0, 90]))];
}

function toolChain(): ModelPart {
  const contour = (radius: number): [number, number][] => [...Array.from({ length: 9 }, (_, index): [number, number] => { const a = (-90 + index * 22.5) * Math.PI / 180; return [7.48 + Math.cos(a) * radius, -4.6 + Math.sin(a) * radius]; }), ...Array.from({ length: 9 }, (_, index): [number, number] => { const a = (90 + index * 22.5) * Math.PI / 180; return [1.08 + Math.cos(a) * radius, -4.6 + Math.sin(a) * radius]; })];
  const chain = polygon("围绕上下链轮闭合循环的竖向刀链", transportColors.dark, contour(0.9), 0.62, [0.31, 0, 0], [contour(0.76)]);
  chain.rotation.z = 90;
  return chain;
}

function chainTeeth(): ModelPart[] {
  const placements: { y: number; z: number; angle: number }[] = [];
  for (const side of [-1, 1]) for (let tooth = 0; tooth < 16; tooth++) placements.push({ y: 1.28 + tooth * 0.4, z: -4.6 + side * 0.97, angle: side * Math.PI / 2 });
  for (const top of [false, true]) for (let tooth = 0; tooth < 8; tooth++) {
    const angle = ((top ? -90 : 90) + (tooth + 0.5) * 22.5) * Math.PI / 180;
    placements.push({ y: (top ? 7.48 : 1.08) + Math.cos(angle) * 0.97, z: -4.6 + Math.sin(angle) * 0.97, angle });
  }
  const geometry = new BoxGeometry(0.72, 0.2, 0.18), source = geometry.getAttribute("position"), parts: ModelPart[] = [];
  try {
    for (let batch = 0; batch < placements.length; batch += 16) {
      const vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
      for (const placement of placements.slice(batch, batch + 16)) {
        const offset = vertices.length;
        for (let vertex = 0; vertex < source.count; vertex++) vertices.push({ x: source.getX(vertex), y: placement.y + Math.cos(placement.angle) * source.getY(vertex) - Math.sin(placement.angle) * source.getZ(vertex), z: placement.z + Math.sin(placement.angle) * source.getY(vertex) + Math.cos(placement.angle) * source.getZ(vertex) });
        for (const index of geometry.index!.array) indices.push(offset + index);
      }
      parts.push(part("保留实际间距和硬面的连续刀链切土刀块合批", "mesh", transportColors.trim, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices }));
    }
  } finally { geometry.dispose(); }
  return parts;
}

function hydraulic(start: Triple, end: Triple): ModelPart[] {
  const joint = start.map((value, index) => value + (end[index]! - value) * 0.64) as Triple, overlap = start.map((value, index) => value + (end[index]! - value) * 0.6) as Triple;
  const body = strut("桅架调姿液压缸外筒", start, joint, 0.28), rod = strut("保持真实共同轴线的长活塞杆", overlap, end, 0.12, transportColors.trim);
  body.shape = "cylinder"; rod.shape = "cylinder";
  return [body, rod];
}

// 展示首节刀箱起始下刀位置，后续接长发生于地下；不把几十米刀箱放在地表抬高整台机器。
// https://www.semw.com/trd-60d60e-trench-cutting-re-mixing-deep-wall-series-method-equipment-2-product/
// https://www.keller.com/expertise/techniques/trd
export const roadExpansionBatchNineteen: TransportDefinition[] = [
  { name: "垂直链式切土原位搅拌等厚墙工法机", theme: "现代", itemType: "设施", tags: ["TRD等厚连续墙工法机", "循环竖直切土刀链", "横向推进滑架与注浆刀箱"], create: () => {
    const parts: ModelPart[] = [
      ...crawlerSide(-2.55), ...crawlerSide(2.55),
      box("位于两条重载履带内侧的主承载底盘", [0, 1.45, 0], [3.5, 0.45, 6.8], transportColors.dark),
      ...cab([-1.15, 1.68, -0.75], [1.2, 1.6, 1.7]),
      box("后方容纳液压与注浆动力的封闭机舱", [0, 2.5, 1.8], [3.2, 1.65, 3.2], transportColors.body),
      box("机舱后端与主底盘实际连接的低位配重", [0, 1.95, 3.6], [3.7, 0.65, 1.0], transportColors.signal),
      box("横向推进导轨上实际承托高桅架的滑台", [0, 1.82, -3.0], [2.7, 0.2, 1.2], transportColors.dark),
      box("贯通左右桅架立柱的顶部承梁", [0, 10.4, -3.0], [2.7, 0.22, 0.45], transportColors.body),
      box("下部导向托臂与左右桅杆的连接横梁", [0, 2.2, -3.1], [2.4, 0.35, 0.4], transportColors.dark),
      box("首节刀箱中部的封闭矩形承力箱", [0, 4.28, -4.6], [0.52, 6.4, 1.5], transportColors.body),
      toolChain(), ...chainTeeth(),
      cylinder("刀链上端的连续循环驱动链轮", [0, 7.48, -4.6], [1.52, 0.52, 1.52], transportColors.dark, [0, 0, 90]),
      cylinder("刀链下端的封闭轴承从动链轮", [0, 1.08, -4.6], [1.52, 0.52, 1.52], transportColors.dark, [0, 0, 90]),
      cylinder("刀链驱动器外侧的液压马达与减速壳", [0.82, 7.48, -4.6], [0.7, 0.72, 0.7], transportColors.signal, [0, 0, 90]),
      cylinder("减速壳通过侧面通向刀链轮的同轴驱动轴", [0.36, 7.48, -4.6], [0.22, 0.5, 0.22], transportColors.trim, [0, 0, 90]),
      cylinder("上驱动轮另一侧的实际支承轴座", [-0.74, 7.48, -4.6], [0.5, 0.4, 0.5], transportColors.body, [0, 0, 90]),
      cylinder("驱动轮到另一侧轴座的连接短轴", [-0.46, 7.48, -4.6], [0.2, 0.58, 0.2], transportColors.trim, [0, 0, 90]),
      box("主底盘上接受横推缸反力的固定铰座", [0, 1.75, -1.0], [0.7, 0.25, 0.4], transportColors.dark),
      cylinder("沿底盘导轨推动桅架滑台的水平液压缸", [0, 1.82, -1.65], [0.22, 1.3, 0.22], transportColors.dark, [90, 0, 0]),
      cylinder("接到桅架滑台的横推同轴活塞杆", [0, 1.82, -2.625], [0.09, 0.75, 0.09], transportColors.trim, [90, 0, 0]),
      part("从机舱侧面通到刀箱注浆口的柔性供浆管", "tube", transportColors.dark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: 0.07, path: [{ x: 1.2, y: 2.5, z: -1.2 }, { x: 1.6, y: 4, z: -2.0 }, { x: 1.4, y: 7.7, z: -3.1 }, { x: 1.35, y: 7.8, z: -4.2 }, { x: 0.55, y: 6.8, z: -4.4 }, { x: 0.26, y: 6.8, z: -4.6 }] }),
      box("机舱前端与供浆管连接的泵阀箱", [1.2, 2.1, -0.95], [0.7, 0.85, 0.7], transportColors.dark),
    ];
    for (const side of [-1, 1]) {
      parts.push(box("独立约束刀箱提升滑架的高桅杆", [side * 1.1, 6.15, -3.0], [0.22, 8.5, 0.25], transportColors.body), box("高桅杆前面与刀箱驱动座相接的提升滑块", [side * 0.85, 7.5, -3.1], [0.35, 1.2, 1.2], transportColors.dark), strut("绕开刀链运动面的驱动座侧悬承梁", [side * 0.85, 7.48, -3.1], [side * 0.85, 7.48, -4.6], 0.28, transportColors.body), strut("下导向横梁通往刀箱侧面的平行托臂", [side * 0.6, 2.2, -3.1], [side * 0.6, 2.2, -4.6], 0.12, transportColors.dark), box("避开刀链的刀箱侧面导向承垫", [side * 0.4, 2.2, -4.6], [0.28, 0.6, 0.9], transportColors.body), box("桅架滑台底部实际贯通的推进导轨", [side * 1.2, 1.72, -2.8], [0.2, 0.18, 2.4], transportColors.body), strut("从底盘向桅架调姿缸伸出的受力托座", [side * 1.65, 1.65, 0], [side * 2.15, 1.75, 0], 0.2, transportColors.dark), ...hydraulic([side * 2.15, 1.75, 0], [side * 1.3, 7.5, -3.0]), box("调姿缸端部与桅杆连接的承销座", [side * 1.23, 7.5, -3.0], [0.25, 0.35, 0.35], transportColors.body));
      for (const z of [-0.7, 0.7]) parts.push(strut("从履带实际内孔接到中央底盘的横向承重梁", [side * 2.55, 0.8, z], [side * 1.7, 0.8, z], 0.2, transportColors.dark), box("位于履带内侧且托住主底盘的连接柱", [side * 1.7, 1.12, z], [0.25, 0.6, 0.35], transportColors.body));
    }
    return parts;
  } },
];
