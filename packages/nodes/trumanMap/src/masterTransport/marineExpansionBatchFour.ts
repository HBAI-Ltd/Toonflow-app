import { part, pitchedRoof, type ModelPart } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { solidPanel } from "./marineExpansionBatchTwo";
import { ball, box, cylinder, shipHull, strut, transportColors, type TransportDefinition } from "./parts";

// 原创简化历史船型，不复制展品模型。保留有实质区别的双层封顶龟背与楼橹式板装甲构造。
// https://www.mmk.or.kr/eng/?folder=collection&page=list&type=search
// https://www.mod.go.jp/msdf/navcol/assets/pdf/ssg2013_12_00.pdf

const wood = transportColors.wood, dark = transportColors.dark, trim = transportColors.trim;

export const marineExpansionBatchFour: TransportDefinition[] = [
  { name: "双层桨舱封顶龟甲战船", theme: "异域", tags: ["龟船", "geobukseon", "封顶桨战船"], create: () => {
    const hull = shipHull(9.8, 28, 2.5);
    hull.color = wood;
    const parts: ModelPart[] = [hull, box("下层桨手连续地板", [0, 2.58, 0], [8.8, 0.16, 22], wood), box("上层战斗甲板", [0, 4, 0], [8.5, 0.16, 21], wood), part("保持内部空腔的弓背厚顶壳", "extrude", dark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { depth: 21.2, profile: [{ x: -4.2, y: 4.75 }, { x: -4, y: 5.6 }, { x: -2.8, y: 6.9 }, { x: 0, y: 7.6 }, { x: 2.8, y: 6.9 }, { x: 4, y: 5.6 }, { x: 4.2, y: 4.75 }, { x: 4.02, y: 4.75 }, { x: 3.82, y: 5.5 }, { x: 2.7, y: 6.74 }, { x: 0, y: 7.43 }, { x: -2.7, y: 6.74 }, { x: -3.82, y: 5.5 }, { x: -4.02, y: 4.75 }] })];
    for (const side of [-1, 1]) {
      const oarHoles: [number, number][][] = [-8, -4, 0, 4, 8].map(z => [[z - 0.5, 3], [z + 0.5, 3], [z + 0.5, 3.55], [z - 0.5, 3.55]]);
      const gunHoles: [number, number][][] = [-8, -4, 0, 4, 8].map(z => [[z - 0.48, 4.1], [z + 0.48, 4.1], [z + 0.48, 4.6], [z - 0.48, 4.6]]);
      parts.push(solidPanel("下层真实桨孔的长侧舷壁", [side * 4.2, 0, 0], [0, 0, 1], [0, 1, 0], [[-10.5, 2.5], [10.5, 2.5], [10.5, 4], [-10.5, 4]], oarHoles), solidPanel("上层真实通风及炮孔的侧壁", [side * 4.2, 0, 0], [0, 0, 1], [0, 1, 0], [[-10.5, 4], [10.5, 4], [10.5, 4.75], [-10.5, 4.75]], gunHoles));
      for (const z of [-8, -4, 0, 4, 8]) parts.push(strut("由下层桨孔穿出的长桨杆", [side * 3.25, 3.27, z], [side * 6.5, 1.2, z + 0.65], 0.1, wood), box("宽扁桨叶", [side * 6.68, 1.08, z + 0.7], [0.7, 0.12, 0.34], wood, [0, side * -12, side * 28]));
      parts.push(strut("艉后单侧大舵承杆", [side * 1.6, 2.7, 11], [side * 1.6, 0.6, 14.2], 0.16, wood), box("后垂宽木舵", [side * 1.6, 0.6, 14.2], [0.18, 1.6, 1.7], wood, [12, 0, 0]));
    }
    for (const end of [-1, 1]) parts.push(solidPanel("龟背下方前后厚木端壁", [0, 0, end * 10.5], [1, 0, 0], [0, 1, 0], [[-4.2, 2.5], [4.2, 2.5], [4.2, 4.75], [4, 5.6], [2.8, 6.9], [0, 7.6], [-2.8, 6.9], [-4, 5.6], [-4.2, 4.75]], [[[-0.55, 2.65], [0.55, 2.65], [0.55, 4.3], [-0.55, 4.3]]]));
    for (const x of [-2, 0, 2]) for (const z of [-7, -2, 3, 8]) parts.push(part("龟背上的防登攀短尖钉", "cone", trim, [x, (x === 0 ? 7.6 : 7.1) + 0.25, z], [0.2, 0.5, 0.2]));
    parts.push(strut("艏部龙首的弯颈承段", [0, 4.7, -10.5], [0, 5.1, -13.5], 0.6, wood), strut("龙首上抬颈段", [0, 5.1, -13.5], [0, 6.2, -14.3], 0.55, wood), ball("封闭木制龙首", [0, 6.3, -14.6], [1.1, 0.85, 1.4], wood), box("龙首上颚", [0, 6.42, -15.35], [0.7, 0.24, 0.85], wood), box("龙首下颚", [0, 6.03, -15.3], [0.7, 0.2, 0.85], wood));
    for (const side of [-1, 1]) parts.push(strut("后伸短龙角", [side * 0.35, 6.6, -14.25], [side * 0.55, 7.15, -13.9], 0.13, trim), ball("侧向龙眼", [side * 0.5, 6.48, -14.8], [0.13, 0.13, 0.13], dark));
    return parts;
  } },
  { name: "方艏总矢仓双楼橹安宅战船", theme: "日式", tags: ["安宅船", "atakebune", "板装甲楼船"], create: () => {
    const parts: ModelPart[] = [polygon("方艏宽体平底木船壳", wood, [[-4.8, -14.5], [4.8, -14.5], [5.1, 10], [3.6, 15], [-3.6, 15], [-5.1, 10]], 2.5), box("连续桨舱内底板", [0, 2.58, 0], [9.3, 0.16, 25], wood), box("桨舱上方整层兵员甲板", [0, 5.4, 0], [9.4, 0.2, 24], wood), box("上层楼橹房地板", [0, 8.35, 0], [7.9, 0.18, 15.5], wood), pitchedRoof("第二层楼橹外伸双坡顶", dark, 8.4, 16.3, 8.5, true), box("位于下层屋脊之上的瞭望橹地板", [0, 9.35, 0], [4, 0.16, 6.8], wood), pitchedRoof("最高瞭望橹短坡屋顶", dark, 4.6, 7.2, 11.55, true)];
    for (const side of [-1, 1]) {
      const ports: [number, number][][] = [-10, -6, -2, 2, 6, 10].map(z => [[z - 0.5, 3.1], [z + 0.5, 3.1], [z + 0.5, 3.75], [z - 0.5, 3.75]]);
      parts.push(solidPanel("围护桨手且实际开孔的板装甲侧壁", [side * 4.55, 0, 0], [0, 0, 1], [0, 1, 0], [[-12, 2.5], [12, 2.5], [12, 5.3], [-12, 5.3]], ports), solidPanel("上层兵员楼的透空狭间板壁", [side * 3.7, 0, 0], [0, 0, 1], [0, 1, 0], [[-7.5, 5.5], [7.5, 5.5], [7.5, 8.35], [-7.5, 8.35]], [-5.4, -1.8, 1.8, 5.4].map(z => [[z - 0.16, 6.6], [z + 0.16, 6.6], [z + 0.16, 7.45], [z - 0.16, 7.45]])));
      for (const z of [-10, -6, -2, 2, 6, 10]) parts.push(strut("贯穿下层桨孔的长木橹", [side * 3.2, 3.42, z], [side * 7, 1.15, z + 0.6], 0.1, wood), box("长橹扁平入水片", [side * 7.15, 1.05, z + 0.65], [0.75, 0.1, 0.35], wood, [0, side * -12, side * 27]));
      parts.push(box("最高橹的窗下板壁", [side * 1.85, 9.95, 0], [0.1, 1.1, 6.6], wood), box("最高橹窗上梁", [side * 1.85, 11.48, 0], [0.1, 0.25, 6.6], wood));
      for (const z of [-3.2, 0, 3.2]) parts.push(strut("最高橹开放窗带立柱", [side * 1.85, 10.48, z], [side * 1.85, 11.55, z], 0.1, wood));
      for (const z of [-3.1, 3.1]) parts.push(strut("穿过下层坡顶承托瞭望层的立柱", [side * 1.75, 8.35, z], [side * 1.75, 9.3, z], 0.14, wood));
      parts.push(strut("楼船艉部大舵长柄", [side * 1.8, 3.1, 12.2], [side * 1.8, 0.6, 15.9], 0.17, wood), box("艉后独立木舵板", [side * 1.8, 0.65, 15.9], [0.15, 1.5, 1.7], wood));
    }
    for (const end of [-1, 1]) {
      parts.push(solidPanel("箱造艏艉总矢仓端壁", [0, 0, end * 12], [1, 0, 0], [0, 1, 0], [[-4.55, 2.5], [4.55, 2.5], [4.55, 5.3], [-4.55, 5.3]], [[[-0.55, 3.5], [0.55, 3.5], [0.55, 4.5], [-0.55, 4.5]]]), solidPanel("上层兵员楼前后通行门", [0, 0, end * 7.5], [1, 0, 0], [0, 1, 0], [[-3.7, 5.5], [3.7, 5.5], [3.7, 8.35], [-3.7, 8.35]], [[[-0.65, 5.55], [0.65, 5.55], [0.65, 7.8], [-0.65, 7.8]]]), box("最高瞭望橹端部低栏板", [0, 9.95, end * 3.3], [3.8, 1.1, 0.1], wood));
    }
    parts.push(box("兵员甲板后端上楼梯顶台", [0, 8.2, 8.4], [1.2, 0.2, 1.6], wood));
    for (let index = 0; index < 7; index++) parts.push(box("兵员甲板至楼橹的宽木梯级", [0, 5.75 + index * 0.36, 11.4 - index * 0.45], [1.15, 0.1, 0.48], wood));
    for (const side of [-1, 1]) parts.push(strut("楼橹梯下的斜承梁", [side * 0.52, 5.5, 11.8], [side * 0.52, 8.25, 8.3], 0.1, wood));
    return parts;
  } },
];
