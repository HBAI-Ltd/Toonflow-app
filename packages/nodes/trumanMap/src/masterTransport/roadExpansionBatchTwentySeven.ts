import { ConeGeometry } from "three";
import { part, ring, type ModelPart } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { box, cab, cylinder, strut, wheel, transportColors, type TransportDefinition } from "./parts";

function mixingCover(): ModelPart {
  const profile = [{ x: -0.82, y: -0.4 }, ...Array.from({ length: 9 }, (_, index) => { const a = Math.PI - index * Math.PI / 8; return { x: Math.cos(a) * 0.82, y: Math.sin(a) * 0.82 }; }), { x: 0.82, y: -0.4 }, { x: 0.7, y: -0.4 }, ...Array.from({ length: 9 }, (_, index) => { const a = index * Math.PI / 8; return { x: Math.cos(a) * 0.7, y: Math.sin(a) * 0.7 }; }), { x: -0.7, y: -0.4 }];
  return part("底部真实敞开的双壁可变容积铣拌舱罩", "extrude", transportColors.body, [0, 0.72, 0], [1, 1, 1], [0, -90, 0], { depth: 2.65, profile });
}

function endPlate(side: number): ModelPart {
  const outline: [number, number][] = [[0.32, -0.82], ...Array.from({ length: 9 }, (_, index): [number, number] => { const a = Math.PI - index * Math.PI / 8; return [0.72 + Math.sin(a) * 0.82, Math.cos(a) * 0.82]; }), [0.32, 0.82]];
  const hole: [number, number][] = Array.from({ length: 16 }, (_, index) => { const a = index * Math.PI / 8; return [0.72 + Math.cos(a) * 0.12, Math.sin(a) * 0.12]; });
  const cap = polygon("铣拌舱端部保留真实主轴孔的厚侧盖", transportColors.body, outline, 0.08, [side * 1.325 + 0.04, 0, 0], [hole]);
  cap.rotation.z = 90;
  return cap;
}

function rotorBits(): ModelPart[] {
  const source = new ConeGeometry(0.075, 0.16, 6, 1), positions = source.getAttribute("position"), used = [...new Set(source.index!.array)], remap = new Map(used.map((index, offset) => [index, offset])), parts: ModelPart[] = [];
  try {
    for (let batch = 0; batch < 96; batch += 16) {
      const vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
      for (let tooth = batch; tooth < batch + 16; tooth++) {
        const lane = Math.floor(tooth / 6), angle = (tooth % 6 * 60 + lane * 12) * Math.PI / 180, offset = vertices.length;
        for (const point of used) vertices.push({ x: -1.125 + lane * 0.15 + positions.getX(point), y: 0.72 + Math.cos(angle) * (0.6 + positions.getY(point)) - Math.sin(angle) * positions.getZ(point), z: Math.sin(angle) * (0.6 + positions.getY(point)) + Math.cos(angle) * positions.getZ(point) });
        for (const index of source.index!.array) indices.push(offset + remap.get(index)!);
      }
      parts.push(part("沿铣拌转子错列排列且根部嵌入滚筒的硬质刀齿合批", "mesh", transportColors.trim, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices }));
    }
  } finally { source.dispose(); }
  return parts;
}

// 冷再生和土壤稳定是本完整原位拌和机的用途，不按用途、喷嘴、燃料或工作宽度扩主。
// https://www.wirtgen-group.com/ocs/en-us/wirtgen/cold-recyclers-and-stabilizers-65-c/
export const roadExpansionBatchTwentySeven: TransportDefinition[] = [
  { name: "四浮动轮柱泡沫沥青原位拌和冷再生机", theme: "现代", tags: ["冷再生与土壤稳定机", "底开口转子原位铣拌", "浮动轮柱与计量注入回路"], create: () => {
    const parts: ModelPart[] = [box("封闭铣拌舱上方连续承托机舱的高位地板", [0, 1.94, 0], [2.4, 0.1, 7.2], transportColors.dark), ...cab([-0.45, 1.99, -2.2], [1.45, 1.6, 1.7]), box("后部容纳大功率驱动与液压系统的封闭机舱", [0, 2.57, 1.55], [2.0, 1.16, 2.7], transportColors.body), box("与司机舱分开的右前计量水液储箱", [0.75, 2.45, -1.3], [0.75, 0.92, 1.8], transportColors.signal), box("储箱后端实际承托双计量泵的承台", [0.75, 2.1, -0.2], [0.65, 0.22, 0.55], transportColors.dark), mixingCover(), endPlate(-1), endPlate(1), cylinder("在密闭混合舱内铣削并原位搅拌的通幅转子", [0, 0.72, 0], [1.1, 2.4, 1.1], transportColors.dark, [0, 0, 90]), cylinder("转子两端贯通轴孔和外轴承的同轴主轴", [0, 0.72, 0], [0.16, 2.95, 0.16], transportColors.trim, [0, 0, 90]), ...rotorBits(), box("主轴右端封闭机械传动带与减速系统的侧罩", [1.57, 1.28, 0], [0.24, 1.32, 0.95], transportColors.dark), strut("右端传动罩上部接到主机承载梁的承托桥", [1.1, 1.75, 0], [1.57, 1.75, 0], 0.12, transportColors.body), cylinder("位于铣拌舱前方且不侵入刀齿包络的计量分配横管", [0, 0.95, -0.9], [0.07, 2.5, 0.07], transportColors.trim, [0, 0, 90]), part("从右前计量泵经机架外侧接入舱前横管的供料软管", "tube", transportColors.dark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: 0.045, path: [{ x: 0.75, y: 2.3, z: -0.2 }, { x: 1.4, y: 2.15, z: -0.5 }, { x: 1.4, y: 1.6, z: -1.1 }, { x: 1.25, y: 0.95, z: -0.9 }] })];
    for (const side of [-1, 1]) {
      parts.push(box("底部与铣拌刀齿包络分离的连续主纵梁", [side * 1.0, 1.75, 0], [0.2, 0.3, 7.2], transportColors.body), ring("舱端侧盖外保留轴孔的独立转子支承轴承", transportColors.dark, 0.18, 0.09, 0, 0.12, { position: { x: side * 1.425, y: 0.72, z: 0 }, rotation: { x: 0, y: 0, z: 90 } }), cylinder("右前储箱后端的独立水液计量泵", [0.75 + side * 0.16, 2.3, -0.2], [0.19, 0.28, 0.19], transportColors.dark), ring("与外接供料回路相接的舱前计量接口", transportColors.dark, 0.09, 0.03, 0, 0.1, { position: { x: 0.75 + side * 0.2, y: 2.5, z: -2.25 }, rotation: { x: 90, y: 0, z: 0 } }));
      for (const z of [-0.3, 0.3]) parts.push(strut("高位主梁到铣拌舱侧缘的实际悬挂承座", [side * 1.18, 1.86, z], [side * 1.18, 1.42, z], 0.1, transportColors.body));
      for (const z of [-2.9, 2.9]) parts.push(...wheel([side * 1.65, 0.8, z], 0.8, 0.55), cylinder("位于轮胎内侧并接到主机架的独立浮动柱外筒", [side * 1.2, 1.52, z], [0.22, 0.82, 0.22], transportColors.dark), cylinder("浮动轮柱到轮边短轴的共轴升降活塞杆", [side * 1.2, 1.0, z], [0.09, 0.44, 0.09], transportColors.trim), cylinder("从内侧浮动柱连接大轮胎轮毂的独立短驱动轴", [side * 1.45, 0.8, z], [0.16, 0.6, 0.16], transportColors.dark, [0, 0, 90]));
    }
    for (const x of [-1.0, -0.6, -0.2, 0.2, 0.6, 1.0]) {
      const nozzle = strut("从舱前计量横管接入舱壁且避开转子齿尖的注入喷嘴", [x, 0.95, -0.9], [x, 0.8, -0.7], 0.02, transportColors.trim);
      nozzle.shape = "cylinder";
      parts.push(nozzle);
    }
    parts.push(cylinder("在双计量泵之间真正接到供料软管的汇流横管", [0.75, 2.3, -0.2], [0.08, 0.48, 0.08], transportColors.trim, [0, 0, 90]));
    return parts;
  } },
];
