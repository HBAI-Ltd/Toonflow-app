import type { ModelPart } from "../assetModelParts";
import { combineMeshes } from "../natureParts";
import { glazedWall } from "./modernResidenceSpaceBatchOne";
import { glazedFace, rectangle } from "./everydayWorkplaceSpaceBatchOne";
import { boxesMesh, type SolidBox } from "./publicSpaceBatchEight";
import { barrelRoof } from "./spatialShells";
import { hardFloor } from "./vernacularWorldBatchSix";
import { box, cylinder, design, rail, type ArchitecturePrototype } from "./structures";

const paving = "#bab9a9", asphalt = "#657273", steel = "#657c7e", wall = "#c9c5b3", dark = "#485d61", rubber = "#59878b", glass = "#a5c4c4";

export const everydayServiceBuildingSpaceBatchFourDesigns: ArchitecturePrototype[] = [
  design("单筒穿行自动洗车控制站", "整段有独立承肋的透明拱筒湿洗厅从前到后贯穿，紧贴东侧的低控制配药机房带由独立长员工廊串联；洗车地坪中的真实排水窄沟有接边格栅，原生摆臂滚刷和横向抬起滚刷保留通车净空，公共控制前门和后勤门均与车口分开，完整站体没有横向干整备大厅", automaticTunnelWashStation, "建筑", "现代"),
];

function automaticTunnelWashStation(): ModelPart[] {
  const footprint: [number, number][] = [[-3.4, -13], [8.4, -13], [8.4, 13], [-3.4, 13]], drains = [-2.75, 2.75].map((x): [number, number][] => [[x - .14, -11.5], [x + .14, -11.5], [x + .14, 11.5], [x - .14, 11.5]]), parts: ModelPart[] = [
    box("洗车通道前后候车区和侧方公共步道共同落地的完整站坪", 2, .06, 0, 25, .12, 46, asphalt), hardFloor("整座拱筒与侧服务房连续且真正留排水窄沟的完整楼面", paving, footprint, .085, [0, .12, 0], drains),
    { ...barrelRoof("有真实壁厚且从两侧承墙升起的整段透明湿洗拱筒", 3.4, .14, 26, [0, 2.3, 0], glass), opacity: .28, roughness: .2 }, box("贴接拱筒东缘并由分室墙承起的完整低服务带厚屋盖", 5.9, 3.1, 0, 5.4, .2, 26.4, steel),
    ...glazedWall("拱筒西侧承重矮墙内真实长观察窗", [-3.4, -13], [-3.4, 13], .2, 2.3, [[-8.8, .65, 5, 1.3], [0, .65, 5.5, 1.3], [8.8, .65, 5, 1.3]]),
    ...glazedWall("拱筒与长员工廊之间有真实服务门和分离观察窗的完整隔墙", [3.4, -13], [3.4, 13], .2, 3, [[-1.8, .7, 5.2, 1.4], [7.8, .7, 4.6, 1.4]], [[-9.5, .2, 1.1, 2.4]]),
    ...glazedWall("员工纵廊逐间进入控制配药机房的真实三门长隔墙", [5.2, -13], [5.2, 13], .2, 3, [], [[-9, .2, 1.1, 2.4], [0, .2, 1.1, 2.4], [9, .2, 1.1, 2.4]]),
    ...glazedWall("低服务房带东侧完整开窗且承托屋盖的外墙", [8.4, -13], [8.4, 13], .2, 3, [[-9, .75, 4.2, 1.6], [0, 1.8, 4.5, .7], [9, 1.8, 4.5, .7]]),
    ...glazedWall("前控制室真实公共门与员工廊独立门的完整前立面", [3.4, -13], [8.4, -13], .2, 3, [], [[-1.6, .2, 1.1, 2.4], [.9, .2, 1.5, 2.5]]),
    ...glazedWall("后机房与员工纵廊分别开后勤门的完整后立面", [3.4, 13], [8.4, 13], .2, 3, [], [[-1.6, .2, 1.1, 2.4], [.9, .2, 1.4, 2.4]]),
    ...[-5, 5].flatMap(z => glazedWall("低服务带控制配药和机房之间真正闭合的横向隔墙", [5.2, z], [8.4, z], .2, 3, [])),
    box("两个人行前门外独立于洗车车道的连续同高步面", 5.9, .1625, -17.9, 5, .085, 9.8, paving), box("后员工机房门外与室内接平的独立后勤步面", 5.9, .1625, 15, 5, .085, 4, paving),
  ];
  const arch: [number, number][] = [[-3.54, 0], [3.54, 0], ...Array.from({ length: 13 }, (_, i): [number, number] => { const angle = i * Math.PI / 12; return [Math.cos(angle) * 3.54, 2.3 + Math.sin(angle) * 3.54]; })], supports: SolidBox[] = [], grate: SolidBox[] = [];
  for (const z of [-13, 13]) parts.push(...glazedFace("拱筒两端与弧顶同形且真正开通车辆门的完整端墙", "xy", arch, [rectangle(-2.6, .7, .7, 1.35), rectangle(2.6, .7, .7, 1.35), rectangle(0, 4.25, 2.6, .75)], [rectangle(0, .2, 3.8, 3.5)], z));
  for (const z of [-12.9, -7.75, -2.6, 2.6, 7.75, 12.9]) {
    parts.push(barrelRoof("拱筒真正闭合到两端柱顶的独立完整钢承肋", 3.38, .18, .16, [0, 2.3, z], steel));
    for (const x of [-3.47, 3.47]) supports.push({ center: [x, 1.25, z], size: [.18, 2.1, .18] });
  }
  for (const x of [-2.75, 2.75]) {
    parts.push(box("排水窄沟内实际接到基础的连续低沟床", x, .125, 0, .28, .01, 23, dark));
    for (let i = 0; i < 51; i++) grate.push({ center: [x, .1925, -11.25 + i * .45], size: [.34, .035, .045] });
  }
  for (let start = 0; start < supports.length; start += 20) parts.push(boxesMesh("整段透明拱筒承肋两端从地坪真正升起的落地钢柱", steel, supports.slice(start, start + 20)));
  for (let start = 0; start < grate.length; start += 20) parts.push(boxesMesh("各排水沟上真正跨接两侧楼面并保留沥水间隙的独立横格栅", steel, grate.slice(start, start + 20)));
  for (const side of [-1, 1]) {
    parts.push(box("原生洗刷摆臂门架避开车辆净空的落地侧柱", side * 2.9, 2.15, -4, .18, 3.9, .2, steel), rail([side * 2.9, 3.85, -4], [side * 1.95, 2.48, -4], .12, dark), cylinder("摆臂下端真实连接滚刷上轴的独立驱动头", side * 1.95, 2.62, -4, .3, .3, dark), cylinder("竖向滚刷布条实际围住的完整旋转轴芯", side * 1.95, 1.4, -4, .34, 1.9, dark), cylinder("竖向滚刷从布筒内接到驱动头的连续真实轴", side * 1.95, 1.45, -4, .085, 2.1, steel));
    const leaves: ModelPart[] = [];
    for (let i = 0; i < 16; i++) { const angle = i * Math.PI / 8; leaves.push(boxesMesh("原生竖滚刷周向独立开缝的柔性长布条", rubber, [{ center: [0, 0, 0], size: [.025, 1.9, .32] }], [side * 1.95 + Math.cos(angle) * .28, 1.4, -4 + Math.sin(angle) * .28], 90 - i * 22.5)); }
    parts.push(combineMeshes("两摆臂下各自真实分离的整圈洗车布刷", rubber, leaves));
  }
  parts.push(box("双侧摆臂立柱真正承起的洗车门架完整高横梁", 0, 4.2, -4, 6, .2, .24, steel), cylinder("横向抬起滚刷中央真正贯通的完整驱动轴", 0, 3.35, 3, .09, 4.8, steel, [0, 0, 90]), cylinder("横向抬起滚刷布条内的连续轴芯", 0, 3.35, 3, .32, 3.4, dark, [0, 0, 90]));
  const topLeaves: ModelPart[] = [];
  for (let i = 0; i < 16; i++) {
    const angle = i * Math.PI / 8, leaf = boxesMesh("横滚刷沿轴展开的独立柔性长布条", rubber, [{ center: [0, 0, 0], size: [3.4, .025, .24] }]); leaf.position = { x: 0, y: 3.35 + Math.cos(angle) * .25, z: 3 + Math.sin(angle) * .25 }; leaf.rotation.x = i * 22.5 - 90; topLeaves.push(leaf);
  }
  parts.push(combineMeshes("横向抬起滚刷周向真正留缝且逐条连接轴芯的完整布刷", rubber, topLeaves));
  for (const side of [-1, 1]) parts.push(box("横刷两侧从地坪连续承接抬起摇臂的独立立座", side * 2.9, 2.15, 3, .18, 3.9, .2, steel), rail([side * 2.9, 3.9, 3], [side * 2.38, 3.35, 3], .12, dark), cylinder("横刷抬臂末端真正接住长轴的独立轴座", side * 2.35, 3.35, 3, .23, .18, steel, [0, 0, 90]));
  parts.push(box("控制前室内避开两门且朝向洗车廊的固定操作台", 7.55, .735, -9, .8, 1.07, 4.2, steel), box("操作台上贴接且供员工观察的斜面控制面板", 7.3, 1.39, -9, .35, .25, 1.3, dark), box("配药房内沿实墙布置且不截断侧门的完整固定工作台", 7.6, .735, 0, .8, 1.07, 5.8, steel));
  for (const z of [-1.5, 1.5]) parts.push(cylinder("配药房固定台上实际接住的原生密闭药液筒", 7.6, 1.67, z, .48, .8, wall));
  for (const z of [7.7, 10.5]) parts.push(cylinder("后机房内真正落到室内楼面的原生回用水立罐", 7.1, 1.3, z, 1.05, 2.2, steel), cylinder("回用水立罐顶部实际贴接的检修口", 7.1, 2.47, z, .45, .14, dark));
  parts.push(rail([7.1, 2.5, 7.7], [7.1, 2.5, 10.5], .1, dark), box("机房内保留纵廊侧门和后门的原生低泵座", 5.85, .485, 7, .7, .57, 1.4, dark));
  return parts;
}
