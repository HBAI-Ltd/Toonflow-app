import { part, type ModelPart } from "../assetModelParts";
import { glazedWall } from "./modernResidenceSpaceBatchOne";
import { boxesMesh, type SolidBox } from "./publicSpaceBatchEight";
import { waistStair } from "./publicSpaceBatchFourteen";
import { box, design, pipe, rail, type ArchitecturePrototype } from "./structures";
import { hardFloor } from "./vernacularWorldBatchSix";

const paving = "#b7b9ae", concrete = "#a9afa7", metal = "#5c7174", roofColor = "#7b8e87", pale = "#c9cbbf";

export const everydayRetailBuildingSpaceBatchThreeDesigns: ArchitecturePrototype[] = [
  design("跨巷双层展厅电器营业楼", "前侧接待售卖基座和后侧售后货梯基座之间留出横向卸货穿巷，整片上层展厅楼面由两排承柱与跨梁托住；前公共U梯和后货梯各穿真实楼板井，顾客从前街上展厅，补货与修理从后侧直接接卸货巷，车道和公共楼梯路线分开", underpassApplianceStore, "建筑", "现代"),
];

function underpassApplianceStore(): ModelPart[] {
  const stairHole: [number, number][] = [[-12, -9.6], [-8.8, -9.6], [-8.8, -4.8], [-12, -4.8]];
  const liftHole: [number, number][] = [[8, 6], [11, 6], [11, 9], [8, 9]];
  const p: ModelPart[] = [
    hardFloor("前后基座与横穿卸货巷共用且保留真实浅货梯坑的地坪", paving, [[-14, -12], [14, -12], [14, 12], [-14, 12]], .25, [0, 0, 0], [liftHole]),
    box("货梯井内低于店坪的真实落地坑底", 9.5, .05, 7.5, 3, .1, 3, concrete),
    hardFloor("跨卸货巷的整片上层营业楼板实际留出步梯和货梯两井", concrete, [[-13, -11], [13, -11], [13, 11], [-13, 11]], .3, [0, 4.05, 0], [stairHole, liftHole]),
    box("整片上层营业厅的完整封顶屋盖", 0, 8.475, 0, 26.6, .25, 22.6, roofColor),
    ...glazedWall("前街接待厅实际进入公共U梯的真主门与售卖橱窗", [-13, -11], [13, -11], .25, 4.05, [[-6, .75, 4, 2.4], [1, .75, 4, 2.4], [8, .75, 4, 2.4]], [[-11.2, .25, 1.4, 2.8]]),
    ...glazedWall("前排接待厅背向穿巷的完整高窗墙", [-13, -3], [13, -3], .25, 4.05, [[-8, 2.8, 4, .65], [0, 2.8, 4, .65], [8, 2.8, 4, .65]]),
    ...glazedWall("后售后库面对卸货穿巷的真货门和独立员工门", [-13, 3], [13, 3], .25, 4.05, [[-5, 2.95, 2.3, .6], [8, 2.95, 4, .6]], [[0, .25, 4, 2.9], [-9, .25, 1.3, 2.7]]),
    ...glazedWall("后售后库通向后巷的真实大门和两侧采光窗", [-13, 11], [13, 11], .25, 4.05, [[-7.5, 1.25, 3.5, 1.8], [7.5, 2.9, 3.5, .6]], [[0, .25, 3.2, 2.9]]),
    ...glazedWall("公共步梯侧真实内门把接待通道与前排展示分开", [-7.5, -11], [-7.5, -3], .25, 4.05, [], [[2.2, .25, 1.3, 2.7]]),
    waistStair("公共梯井前跑十二级薄底宽阶", -11.2, .25, -9.6, 1.3, 12, 2.05 / 12, .3),
    box("前U梯两跑同标高实际相接的中转平台", -10.4, 2.2, -5.4, 3.1, .2, 1.2, concrete),
    waistStair("公共梯井后跑折返并实际接到上层前落脚带的薄底阶", -9.6, 2.3, -6, 1.3, 12, 2.05 / 12, .3, true),
    hardFloor("四角真实退让导轨且与底层门口齐平的悬承载货台", metal, [[8.05, 6.35], [8.35, 6.35], [8.35, 6.05], [10.65, 6.05], [10.65, 6.35], [10.95, 6.35], [10.95, 8.65], [10.65, 8.65], [10.65, 8.95], [8.35, 8.95], [8.35, 8.65], [8.05, 8.65]], .1, [0, .15, 0]),
    box("底层载台已到位时从固定店坪搭接台前沿的短过桥板", 9.5, .2, 6.025, 2.1, .1, .15, metal),
  ];
  for (const side of [-1, 1]) {
    const x = side * 13;
    p.push(
      ...glazedWall("前排基座两端真实采光壁不堵中段车道口", [x, -11], [x, -3], .25, 4.05, [[0, 1.15, 4.7, 1.9]]),
      ...glazedWall("后排基座两端真实承墙不跨中段卸货巷", [x, 3], [x, 11], .25, 4.05, [[0, 2.7, 4.7, .7]]),
      ...glazedWall("跨巷上层营业厅完整连续开窗侧壁", [x, -11], [x, 11], 4.35, 8.35, [[-7.2, 5.2, 4.1, 2.2], [0, 5.2, 4.1, 2.2], [7.2, 5.2, 4.1, 2.2]]),
    );
  }
  for (const z of [-11, 11]) p.push(...glazedWall("上层展厅前后独立高窗与完整承屋壁", [-13, z], [13, z], 4.35, 8.35, [[-9, 5.2, 4, 2.2], [-3, 5.2, 4, 2.2], [3, 5.2, 4, 2.2], [9, 5.2, 4, 2.2]]));
  const structure: SolidBox[] = [], guards: SolidBox[] = [], fixtures: SolidBox[] = [];
  for (const x of [-12.6, 0, 12.6]) {
    for (const z of [-10.6, -3.4, 3.4, 10.6]) {
      if (x === 0 && z > 0) continue;
      structure.push({ center: [x, 2.15, z], size: [.4, 3.8, .4] });
    }
    structure.push({ center: [x, 3.775, 0], size: [.4, .55, 21.6] });
  }
  for (const x of [-3, 3]) for (const z of [3.4, 10.6]) structure.push({ center: [x, 2.15, z], size: [.4, 3.8, .4] });
  for (const z of [-10.6, -3.4, 3.4, 10.6]) structure.push({ center: [0, 3.825, z], size: [25.6, .45, .4] });
  for (const x of [-12.6, 0, 12.6]) for (const z of [-10.6, 0, 10.6]) {
    if (x === 0 && z === 0) continue;
    structure.push({ center: [x, 6.35, z], size: [.25, 4, .25] });
  }
  for (const z of [-10.6, 0, 10.6]) structure.push({ center: [0, 8.225, z], size: [25.6, .25, .25] });
  for (const x of [-11.8, -9]) structure.push({ center: [x, 1.175, -5.05], size: [.17, 1.85, .17] });
  const holeEdges: [number, number, number, number][] = [[-12, -9.6, -12, -4.8], [-8.8, -9.6, -8.8, -4.8], [-12, -4.8, -8.8, -4.8], [-12, -9.6, -10.4, -9.6], [8, 6, 8, 9], [11, 6, 11, 9], [8, 9, 11, 9]];
  for (const [x0, z0, x1, z1] of holeEdges) {
    p.push(rail([x0, 5.45, z0], [x1, 5.45, z1], .06, metal));
    const count = Math.ceil(Math.hypot(x1 - x0, z1 - z0) / 1.6);
    for (let i = 0; i <= count; i++) guards.push({ center: [x0 + (x1 - x0) * i / count, 4.9, z0 + (z1 - z0) * i / count], size: [.055, 1.1, .055] });
  }
  for (const [x, y, start, end] of [[-11.85, .25, -9.6, -6], [-10.55, .25, -9.6, -6], [-10.25, 2.3, -6, -9.6], [-8.95, 2.3, -6, -9.6]]) {
    p.push(rail([x!, y! + 1.05, start!], [x!, y! + 3.1, end!], .055, metal));
    for (const t of [0, .5, 1]) guards.push({ center: [x!, y! + .525 + 2.05 * t, start! + (end! - start!) * t], size: [.055, 1.05, .055] });
  }
  p.push(rail([-11.95, 3.35, -4.8], [-8.85, 3.35, -4.8], .06, metal));
  for (const x of [-11.95, -8.85]) {
    p.push(rail([x, 3.35, -6], [x, 3.35, -4.8], .06, metal));
    for (const z of [-6, -4.8]) guards.push({ center: [x, 2.825, z], size: [.06, 1.05, .06] });
  }
  p.push(rail([-11.95, 3.35, -6], [-11.85, 3.35, -6], .06, metal), rail([-8.85, 3.35, -6], [-8.95, 3.35, -6], .06, metal));
  for (const x of [8.12, 10.88]) for (const z of [6.12, 8.88]) structure.push({ center: [x, 4.225, z], size: [.16, 8.25, .16] });
  for (const z of [6.12, 8.88]) structure.push({ center: [9.5, 8.22, z], size: [3.1, .26, .2] });
  for (const x of [8.35, 10.65]) for (const [topZ, bottomZ] of [[6.12, 6.35], [8.88, 8.65]]) p.push(pipe("从货梯顶承架真实拉到载货台的四角提升索", [x, 8.22, topZ!], [x, .25, bottomZ!], .028));
  for (const x of [8.23, 10.77]) for (const z of [6.4, 8.6]) fixtures.push({ center: [x, .23, z], size: [.22, .1, .65] });
  for (const y of [4.4, 5.4]) guards.push({ center: [11, y, 7.35], size: [.055, .055, 2.7] });
  for (const z of [6, 7.35, 8.7]) guards.push({ center: [11, 4.9, z], size: [.055, 1.1, .055] });
  for (const [x, z, floor] of [[-3.8, -7, .25], [4.2, -7, .25], [-4.8, -2.3, 4.35], [2.2, -2.3, 4.35]]) {
    fixtures.push({ center: [x!, floor! + .92, z!], size: [.85, 1.84, .78] }, { center: [x!, floor! + .43, z! - .41], size: [.8, .81, .05] }, { center: [x!, floor! + 1.35, z! - .41], size: [.8, .97, .05] });
    for (const y of [.65, 1.3]) fixtures.push({ center: [x! + .29, floor! + y, z! - .46], size: [.035, .25, .06] });
  }
  for (const [x, z] of [[-4.3, 4.5], [2.5, 4.5]]) {
    fixtures.push({ center: [x!, 4.53, z!], size: [2.3, .36, .7] }, { center: [x!, 5.2, z!], size: [.16, 1, .16] });
    p.push(part("上层展示架上由独立立座承住的完整电视薄屏", "box", "#3e5559", [x!, 5.7, z!], [1.8, 1.1, .09], [0, 0, 0], { roughness: .2 }));
  }
  fixtures.push({ center: [-6.5, 1.12, 7.5], size: [6, .14, 1.2] });
  for (const x of [-9, -4]) for (const z of [7.05, 7.95]) fixtures.push({ center: [x, .65, z], size: [.15, .8, .15] });
  for (let i = 0; i < structure.length; i += 20) p.push(boxesMesh("跨巷楼面和屋盖的真实承重柱梁及货梯导向承架", metal, structure.slice(i, i + 20)));
  for (let i = 0; i < guards.length; i += 20) p.push(boxesMesh("两跑U梯两真实楼板井与转台各自落脚的防坠栏柱", metal, guards.slice(i, i + 20)));
  for (let i = 0; i < fixtures.length; i += 20) p.push(boxesMesh("接地电器展示机台后售后台及货梯载台导向连靴", pale, fixtures.slice(i, i + 20)));
  return p;
}
