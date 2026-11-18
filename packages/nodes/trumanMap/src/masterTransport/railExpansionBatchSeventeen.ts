import { beam, part, ring, type ModelPart, type Triple } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { rod } from "../masterObjects/parts";
import { box, cylinder, strut, transportColors, type TransportDefinition } from "./parts";

function tubularPylon(start: Triple, end: Triple): ModelPart {
  const guide = beam("四足涉水客车承力管墩", transportColors.dark, start, end, .44);
  const length = Math.hypot(end[0] - start[0], end[1] - start[1], end[2] - start[2]);
  return { ...ring("为传动长轴保留内部通道的中空承力管墩", transportColors.dark, .22, .04, 0, length), position: guide.position, rotation: guide.rotation };
}

function stairTreads(): ModelPart {
  const vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
  const faces = [0, 2, 1, 0, 3, 2, 4, 5, 6, 4, 6, 7, 0, 4, 7, 0, 7, 3, 1, 2, 6, 1, 6, 5, 0, 1, 5, 0, 5, 4, 3, 7, 6, 3, 6, 2];
  // ACT: 整跑楼梯的13块真实分离踏板合用一个104顶点网格，减少绘制批次，保留踏板间隙。
  for (let index = 1; index <= 13; index++) {
    const y = 8.35 + index * 2.6 / 13 - .04, z = -6 + index * 2 / 13, offset = vertices.length;
    vertices.push({ x: -.48, y: y - .04, z: z - .11 }, { x: .48, y: y - .04, z: z - .11 }, { x: .48, y: y + .04, z: z - .11 }, { x: -.48, y: y + .04, z: z - .11 }, { x: -.48, y: y - .04, z: z + .11 }, { x: .48, y: y - .04, z: z + .11 }, { x: .48, y: y + .04, z: z + .11 }, { x: -.48, y: y + .04, z: z + .11 });
    indices.push(...faces.map(value => value + offset));
  }
  return part("通往屋顶散步层且保留实际间隙的整跑楼梯踏板", "mesh", transportColors.wood, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

// 构造参考保存机构和铁路协会；原创建模不复刻车号、装饰或某次修复状态。
// https://volkselectricrailway.co.uk/the-daddy-long-legs/
// https://www.brightontoymuseum.co.uk/index/Pioneer_electric_seagoing_carriage_(model)
export const railExpansionBatchSeventeen: TransportDefinition[] = [
  { name: "四墩高架海滨涉水轨行客车", theme: "欧式", tags: ["海滨涉水电气铁路", "四独立足部转向架", "双平行轨走行", "中空管墩与长轴下传动", "高位椭圆客台及屋顶散步层"], create: () => {
    const parts: ModelPart[] = [];
    for (const side of [-1, 1]) for (const end of [-1, 1]) {
      const x = side * 2.35, z = end * 4.4;
      for (const offset of [-.62, .62]) {
        parts.push(cylinder("涉水足部转向架贯通承重轴", [x, .445, z + offset], [.14, 1.5, .14], transportColors.trim, [0, 0, 90]));
        for (const wheelSide of [-1, 1]) parts.push(part("涉水足部四轮架的内轮缘钢轮", "lathe", transportColors.body, [x + wheelSide * .43, .445, z + offset], [1, 1, 1], [0, 0, -wheelSide * 90], { profile: [{ x: .07, y: -.08 }, { x: .445, y: -.08 }, { x: .445, y: -.05 }, { x: .419, y: -.035 }, { x: .419, y: .075 }, { x: .07, y: .075 }, { x: .07, y: -.08 }] }));
      }
      for (const edge of [-1, 1]) parts.push(part("避开轮盘且保留管墩传动开槽的足部防护承架", "extrude", transportColors.dark, [x, 0, z], [1, 1, 1], [0, 0, 0], { depth: 2.25, profile: [{ x: edge * -.71, y: .4 }, { x: edge * -.71, y: 1.15 }, { x: edge * -.18, y: 1.15 }, { x: edge * -.18, y: .91 }, { x: edge * -.61, y: .91 }, { x: edge * -.61, y: .4 }] }));
      parts.push(tubularPylon([x, 1.05, z], [side * 1.9, 8.03, z]));
      if (side * end < 0) parts.push(rod("从高位电机经管墩下传到轮架的真实动力长轴", [side * 1.9, 8.03, z], [x, .6, z], .09, transportColors.trim), rod("安装在水面上方并与长轴同轴的牵引电机", [side * 1.924, 7.65, z], [side * 1.898, 8.05, z], .34, transportColors.body), box("连接长轴和足部双轮轴的低位封闭传动箱", [x, .6, z], [.4, .42, 1.7], transportColors.dark));
      else parts.push(rod("另一对管墩内下降至轮架的机械制动连杆", [side * 1.9, 8.03, z], [x, .55, z], .045, transportColors.trim), box("制动连杆下端接入两轮轴的联动摇架", [x, .55, z], [.3, .1, 1.5], transportColors.dark));
    }
    for (const side of [-1, 1]) {
      parts.push(box("高位甲板底部通长承力主梁", [side * 1.9, 8.03, 0], [.32, .28, 11.8], transportColors.dark), strut("沿长向连接前后承力管墩的第一根抗摆斜撑", [side * 2.35, 1.2, -4.4], [side * 1.9, 7.9, 4.4], .12), strut("沿长向连接前后承力管墩的交叉抗摆斜撑", [side * 2.35, 1.2, 4.4], [side * 1.9, 7.9, -4.4], .12));
    }
    for (const end of [-1, 1]) parts.push(box("高位甲板底部横接左右管墩的承力梁", [0, 8.03, end * 4.4], [5, .28, .32], transportColors.dark), strut("沿横向连接左右管墩的第一根抗摆斜撑", [-2.35, 1.2, end * 4.4], [1.9, 7.9, end * 4.4], .12), strut("沿横向连接左右管墩的交叉抗摆斜撑", [2.35, 1.2, end * 4.4], [-1.9, 7.9, end * 4.4], .12));
    const outline: [number, number][] = Array.from({ length: 20 }, (_, index) => { const angle = index * Math.PI / 10; return [Math.cos(angle) * 3.35, Math.sin(angle) * 6.85]; });
    parts.push(polygon("由四足支承且可实际行走的完整椭圆形客台", transportColors.wood, outline, .2, [0, 8.15, 0]));
    for (const side of [-1, 1]) {
      parts.push(box("高位中央客室半高侧壁", [side * 1.85, 8.8, 0], [.13, .9, 7.7], transportColors.body), box("中央客室两侧连续透光玻璃", [side * 1.86, 9.9, 0], [.035, 1.3, 7.65], transportColors.glass), box("中央客室侧窗上方接入屋顶的过梁", [side * 1.85, 10.65, 0], [.14, .2, 7.8], transportColors.dark));
      for (const z of [-3.76, 3.76]) parts.push(box("客室角部支承屋顶散步层的真实竖柱", [side * 1.85, 9.9, z], [.12, 1.3, .12], transportColors.dark));
    }
    for (const end of [-1, 1]) {
      for (const side of [-1, 1]) parts.push(box("中央通行门洞两旁完整半高端墙", [side * 1.2, 8.8, end * 3.85], [1.25, .9, .13], transportColors.body), box("中央通行门洞两旁真实端窗", [side * 1.2, 9.9, end * 3.86], [1.2, 1.3, .035], transportColors.glass));
      parts.push(box("门洞顶部连续支承散步层的端横梁", [0, 10.65, end * 3.85], [3.8, .2, .15], transportColors.dark));
    }
    parts.push(box("由四周客室梁柱实际承托的屋顶散步层", [0, 10.85, 0], [4.1, .2, 8], transportColors.wood));
    for (const y of [8.9, 9.45]) parts.push(part("沿椭圆客台外围连续回绕的防护横栏", "tube", transportColors.trim, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: .035, path: Array.from({ length: 17 }, (_, index) => { const angle = index * Math.PI / 8; return { x: Math.cos(angle) * 3.22, y, z: Math.sin(angle) * 6.65 }; }) }));
    for (let index = 0; index < 8; index++) { const angle = index * Math.PI / 4; parts.push(rod("由椭圆客台上升至外围扶手的护栏柱", [Math.cos(angle) * 3.22, 8.35, Math.sin(angle) * 6.65], [Math.cos(angle) * 3.22, 9.45, Math.sin(angle) * 6.65], .055, transportColors.dark)); }
    for (const side of [-1, 1]) {
      parts.push(box("屋顶散步层两侧连续防护扶手", [side * 2, 12.05, 0], [.06, .06, 7.9], transportColors.dark), box("屋顶入口两旁避开楼梯的防护扶手", [side * 1.275, 12.05, -3.95], [1.45, .06, .06], transportColors.dark));
      for (const z of [-3.95, 0, 3.95]) parts.push(box("屋顶散步层接至防护扶手的竖柱", [side * 2, 11.5, z], [.06, 1.1, .06], transportColors.dark));
      parts.push(rod("通向散步层的楼梯下方连续承力边梁", [side * .5, 8.35, -6], [side * .5, 10.95, -4], .1, transportColors.dark), rod("楼梯连续扶手接入上层入口护栏柱", [side * .5, 9.25, -6], [side * .55, 12.05, -3.95], .055, transportColors.dark), rod("楼梯下端实际承托扶手的立杆", [side * .5, 8.35, -6], [side * .5, 9.25, -6], .055, transportColors.dark), box("屋顶楼梯入口端接实两段扶手的护栏柱", [side * .55, 11.5, -3.95], [.06, 1.1, .06], transportColors.dark));
    }
    parts.push(box("屋顶散步层后端完整防护扶手", [0, 12.05, 3.95], [4, .06, .06], transportColors.dark), stairTreads());
    for (const end of [-1, 1]) parts.push(rod("高于护栏后再伸向陆侧接触线的双受电杆", [1.4, 10.95, end], [2.5, 13.4, end * 2.1], .055, transportColors.dark));
    return parts;
  } },
];
