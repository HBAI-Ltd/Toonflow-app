import { ring, type ModelPart, type Triple } from "../assetModelParts";
import { combineMeshes, sweptProfile } from "../masterNature/shared";
import { boxBatch, hardPlan } from "./everydayOutdoorSpaceBatchOne";
import { glazedWall } from "./modernResidenceSpaceBatchOne";
import { boxesMesh, type SolidBox } from "./publicSpaceBatchEight";
import { stairFlight } from "./publicSpaceBatchSteps";
import { box, cylinder, design, pipe, type ArchitecturePrototype } from "./structures";
import { meshBeam } from "./vernacularWorldBatchFive";

const paving = "#c2bba7", stone = "#aeb3a5", steel = "#677f7c", dark = "#455a5d", timber = "#a48c69", roof = "#82978d";

export const everydayTransitBuildingSpaceBatchFiveDesigns: ArchitecturePrototype[] = [
  design("回转索轮双路观光索道站", "两条进出舱槽在高台间真实开空，前方独立长阶接入圆头中央登车岛，后票厅长阶接入两侧下车台；半圆回转缆索沿大槽轮改变方向，主轴电机与梁柱在完整站房内实际接承，后公共厅和独立控制室都有真实门窗", scenicCableTerminal, "建筑", "现代"),
];

function scenicCableTerminal(): ModelPart[] {
  const island: [number, number][] = [[-2.5, -18], [2.5, -18], [2.5, 8]];
  for (let i = 1; i <= 12; i++) { const a = i * Math.PI / 12; island.push([Math.cos(a) * 2.5, 8 + Math.sin(a) * 2.5]); }
  const wheel = ring("槽轮外缘真正接触回转缆索的完整厚轮缘", steel, 3.8, .25, 7.25, .24); wheel.position.z = 8;
  const cable = sweptProfile("仅绕站后半圈并准确接回两条进出索的实体缆索", dark, Array.from({ length: 8 }, (_, i): [number, number] => [3.84 + Math.cos(i * Math.PI / 4) * .04, Math.sin(i * Math.PI / 4) * .04]), Math.PI, 16); cable.position.y = 7.25; cable.position.z = 8;
  const curveGuard = sweptProfile("中央登车岛圆头边缘实际闭合的半圆安全扶手", steel, Array.from({ length: 8 }, (_, i): [number, number] => [2.5 + Math.cos(i * Math.PI / 4) * .03, Math.sin(i * Math.PI / 4) * .03]), Math.PI, 16); curveGuard.position.y = 4.35; curveGuard.position.z = 8;
  const parts: ModelPart[] = [
    box("完整索道站房两组长阶与进出索投影共用的落地基础", 0, .09, 0, 28, .18, 68, paving),
    hardPlan("不封住两条舱槽且后端准确收成半圆的中央登车岛", paving, island, .3, [0, 3.1, 0]),
    box("后公共厅和侧下车台同高的完整实体承台", 0, 1.79, 19, 20, 3.22, 10, stone),
    box("完整客运机房与两侧上下客台共同的宽厚屋盖", 0, 9.1, -1, 22, .3, 34, roof),
    box("后票厅与独立控制小室共用的完整低平屋盖", 0, 7, 19, 20.5, .25, 10.5, roof),
    ...glazedWall("站房前端真正分别让出中央登车口和两条进出舱的高门洞", [-10, -18], [10, -18], 3.4, 8.65, [], [[-3.84, 3.4, 2.6, 4.25], [0, 3.4, 3, 2.8], [3.84, 3.4, 2.6, 4.25]]),
    ...glazedWall("后票厅分别接上两外侧下车台的实际通行双门", [-10, 14], [10, 14], 3.4, 6.875, [[0, 4.4, 9, 1.7]], [[-7.5, 3.4, 3, 2.7], [7.5, 3.4, 3, 2.7]]),
    ...glazedWall("后公共厅真正接到后长阶的入口和控制室外窗", [-10, 24], [10, 24], 3.4, 6.875, [[4, 4.3, 7.5, 1.8]], [[-6, 3.4, 3, 2.7]]),
    ...glazedWall("独立控制室朝公共厅真正开门并保留观察窗的分隔墙", [2, 19], [10, 19], 3.4, 6.875, [[-2, 4.4, 1.5, 1.5]], [[0, 3.4, 1.4, 2.5]]),
    box("控制室与后票厅之间真正封合到屋盖的短纵隔墙", 2, 5.1375, 21.5, .24, 3.475, 5, stone),
    box("控制室内避开实际房门的完整操作长柜", 6, 3.9, 22.3, 5, 1, .8, timber),
    cylinder("中央登车岛后端从基础直接升到主轮承座的整根回转支柱", 0, 3.59, 8, 1, 6.82, stone),
    wheel,
    cable,
    curveGuard,
    cylinder("连接全部轮辐与主轴且真正压在支柱顶的厚轮毂", 0, 7.25, 8, 1, .5, steel),
    cylinder("从支柱承座穿入完整驱动机箱的真实竖直主轴", 0, 7.7, 8, .22, 1.3, dark),
    box("驱动机箱与轮毂之间真正相接的完整支承台", 0, 7.525, 8, 2, .15, 2, steel),
    box("完整回转驱动机箱实际落在主轴承台上", 0, 7.95, 8, 1.5, .8, 1.6, dark),
    ...[-1, 1].map(side => pipe("与后半圆回转索准确相接并从前舱口穿出的连续直索", [side * 3.84, 7.25, -28], [side * 3.84, 7.25, 8], .08)),
  ];
  const lowPosts: Triple[] = [], roofPosts: Triple[] = [], roofBeams: Triple[] = [], hallPosts: Triple[] = [], hallBeams: Triple[] = [], stairSupports: Triple[] = [], stairBeams: Triple[] = [], benches: Triple[] = [], benchFeet: Triple[] = [];
  const spokes: ModelPart[] = [], stairsGuards: ModelPart[] = [], platformGuards: SolidBox[] = [];
  for (const side of [-1, 1]) {
    parts.push(box("进出舱槽之外与后票厅直接相接的完整外侧下车台", side * 7.55, 3.25, -2, 4.9, .3, 32, paving), ...glazedWall("外侧下车台真正从平台升到屋梁的完整通透外墙", [side * 10, -18], [side * 10, 14], 3.4, 8.65, [[-8, 4.3, 11, 3.5], [8, 4.3, 11, 3.5]]), ...glazedWall("后公共厅沿地台边完整封合的独立开窗侧墙", [side * 10, 14], [side * 10, 24], 3.4, 6.875, [[0, 4.3, 7.5, 1.8]]));
    for (const z of [-16, 0, 12]) lowPosts.push([side * 7.55, 1.64, z]);
    for (const z of [-16, 0, 14]) roofPosts.push([side * 9.7, 4.415, z]);
    for (const z of [15, 22.5]) hallPosts.push([side * 9.65, 5.0375, z]);
    for (const [a, b] of [[-18, -10], [-4, 0], [5, 14]]) {
      platformGuards.push({ center: [side * 5.1, 4.35, (a! + b!) / 2], size: [.06, .06, b! - a!] });
      for (const z of [a!, b!]) platformGuards.push({ center: [side * 5.1, 3.875, z], size: [.06, .95, .06] });
      const end = Math.min(b!, 8);
      if (end > a!) {
        platformGuards.push({ center: [side * 2.5, 4.35, (a! + end) / 2], size: [.06, .06, end - a!] });
        for (const z of [a!, end]) platformGuards.push({ center: [side * 2.5, 3.875, z], size: [.06, .95, .06] });
      }
    }
  }
  for (const z of [-10, 0]) lowPosts.push([0, 1.64, z]);
  for (let i = 1; i < 12; i++) { const a = i * Math.PI / 12; platformGuards.push({ center: [Math.cos(a) * 2.5, 3.875, 8 + Math.sin(a) * 2.5], size: [.06, .95, .06] }); }
  for (const z of [-16, 0, 14]) roofBeams.push([0, 8.8, z]);
  for (const z of [15, 22.5]) hallBeams.push([0, 6.775, z]);
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4;
    spokes.push(meshBeam("将完整主轮毂真实接到槽轮内缘的独立水平钢轮辐", [Math.cos(a) * .45, 7.25, 8 + Math.sin(a) * .45], [Math.cos(a) * 3.55, 7.25, 8 + Math.sin(a) * 3.55], .14, steel));
  }
  for (const [x, start, reverse] of [[0, -24.8, false], [-6, 30.8, true]] as const) {
    const direction = reverse ? -1 : 1;
    for (let flight = 0; flight < 2; flight++) {
      const y = .18 + flight * 1.61, z = start + direction * flight * 3.8;
      parts.push(stairFlight("从前后公共场地各自完整接到高位站台的十级实阶", x, y, z, 3, 10, .161, .3, reverse));
      if (!flight) parts.push(box("两段十级长阶之间与全部踏面准确相接的完整休息平台", x, 1.69, z + direction * 3.4, 3, .2, .8, paving));
      for (const side of [-1, 1]) {
        const sx = x + side * 1.5;
        stairsGuards.push(meshBeam("两路公共长阶沿逐级踏面连续升高的独立安全扶手", [sx, y + .161 + .95, z + direction * .15], [sx, y + 1.61 + .95, z + direction * 2.85], .06, steel));
        for (const [run, lift] of [[.15, .161], [2.85, 1.61]]) stairsGuards.push(meshBeam("长阶扶手两端真正落到相应踏面的独立立杆", [sx, y + lift!, z + direction * run!], [sx, y + lift! + .95, z + direction * run!], .06, steel));
        if (!flight) stairsGuards.push(meshBeam("相邻公共梯段扶手跨休息平台的完整转接段", [sx, y + 2.56, z + direction * 2.85], [sx, y + 1.61 + .161 + .95, z + direction * 3.95], .06, steel));
      }
    }
    stairBeams.push([x, 1.69, start + direction * 5.3]);
    for (const z of [start + direction * 3.4, start + direction * 5.3]) stairSupports.push([x, .885, z]);
  }
  for (const x of [-6, -1]) { benches.push([x, 3.81, 17]); for (const offset of [-1, 1]) benchFeet.push([x + offset, 3.575, 17]); }
  parts.push(
    combineMeshes("主回转槽轮的全部钢轮辐保持真实径向连接", steel, spokes),
    ...boxBatch("外侧下车台和中央登车岛下真正接地的独立实承柱", stone, lowPosts, [.35, 2.92, .45]),
    ...boxBatch("整片机房屋梁下面真正从基础升起的高边柱", steel, roofPosts, [.3, 8.47, .4]),
    ...boxBatch("两侧高边柱之间直接接承整个机房屋盖的完整横梁", steel, roofBeams, [19.7, .3, .35]),
    ...boxBatch("后票厅屋梁下面从高地台实际升起的独立短柱", steel, hallPosts, [.25, 3.275, .3]),
    ...boxBatch("后票厅短柱之间实际顶接低屋盖的完整横梁", steel, hallBeams, [19.6, .2, .3]),
    ...boxBatch("两路长阶休息平台与高段梁下真正接地的实承柱", stone, stairSupports, [.35, 1.41, .45]),
    ...boxBatch("两路高段实阶底部不侵入踏面的完整承重平梁", steel, stairBeams, [2.5, .2, 3]),
    ...boxBatch("后票厅内避开双平台门路线的固定等候长坐板", timber, benches, [2.8, .12, .65]),
    ...boxBatch("票厅长坐板下面真正落到地台的独立承脚", steel, benchFeet, [.12, .35, .45]),
  );
  for (let offset = 0; offset < stairsGuards.length; offset += 16) parts.push(combineMeshes("两路长阶扶手与踏面立杆全部真实相接的安全栏架", steel, stairsGuards.slice(offset, offset + 16)));
  for (let offset = 0; offset < platformGuards.length; offset += 20) parts.push(boxesMesh("两条舱槽沿站台边保留独立登车缺口的完整安全栏架", steel, platformGuards.slice(offset, offset + 20)));
  return parts;
}
