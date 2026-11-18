import { part, type ModelPart, type Triple } from "../assetModelParts";
import { combineMeshes, polygon } from "../masterNature/shared";
import { glazedWall } from "./modernResidenceSpaceBatchOne";
import { stairFlight } from "./futureSpaceBatchSix";
import { meshBeam } from "./vernacularWorldBatchFive";
import { boxesMesh, type SolidBox } from "./publicSpaceBatchEight";
import { box, cylinder, design, rail, type ArchitecturePrototype } from "./structures";

const paving = "#b3b9ae", steel = "#5d7479", dark = "#495e64", roof = "#7a8c85";

export const everydayWaterfrontBuildingSpaceBatchFiveDesigns: ArchitecturePrototype[] = [
  design("并井连桥滨河步道上岸楼", "低步道入口厅接向停在低层的完整电梯轿厢及另一座六跑人行梯井，上层公共厅通过中央过廊连接高堤出口和带真实桥墩的上岸短桥；两座并列井道与高低公共前室组成完整塔楼，楼梯逐跑穿行真实开口，电梯有实际导轨轿厢配重与绕轮绳束，高层电梯门闭合而人行梯继续贯通，屋盖桥面栏脚均实际接承", riversideLiftStairAccessBuilding, "建筑", "现代"),
];

function riversideLiftStairAccessBuilding(): ModelPart[] {
  const high = 11.92;
  const outer: [number, number][] = [[-4.5, -4], [4.8, -4], [4.8, 4.4], [-4.5, 4.4]];
  const liftHole: [number, number][] = [[-4.05, -1.6], [-1.05, -1.6], [-1.05, 2.2], [-4.05, 2.2]];
  const stairHole: [number, number][] = [[1.35, -1.2], [4.25, -1.2], [4.25, 2.9], [1.35, 2.9]];
  const p: ModelPart[] = [
    box("并井上岸楼高短桥桥墩与堤顶桥台共同的完整落地场坪", 0, .1, 5, 14, .2, 22, paving),
    polygon("低步道公共入口厅为实际电梯停靠轿厢留空的完整地板", paving, outer, .2, [0, .2, 0], [liftHole]),
    polygon("高堤公共前室中央过廊与后出口完整楼面为双井真实留空", paving, outer, .25, [0, high - .25, 0], [liftHole, stairHole]),
    box("双井楼完整屋盖由通高承墙与四角立柱实际接住", .15, 16.8, .2, 9.9, .2, 9, roof),
    box("高公共出口与堤顶桥台之间由桥墩接承的完整短桥", 0, high - .125, 8.4, 2.8, .25, 8, paving),
    box("上岸短桥末端实际承托桥面并接堤顶步道的落地实体桥台", 0, (high + .2) / 2, 13, 5.5, high - .2, 2, paving),
    ...glazedWall("低公共入口与中部高前室通高真实采光的完整前立面", [4.8, -4], [-4.5, -4], .4, 16.7, [[0, 3.4, 8, 7.6], [0, 12.6, 7.8, 2.7]], [[1.15, .4, 3, 2.8]]),
    ...glazedWall("上岸桥真出口与低后工作门分别贯通完整后立面", [-4.5, 4.4], [4.8, 4.4], .4, 16.7, [[0, 3.8, 7.8, 6.8], [-3.1, 12.6, 1.8, 2], [2.9, 12.6, 1.8, 2]], [[2.65, .4, 1.4, 2.5], [-.15, high, 2.2, 2.6]]),
    ...glazedWall("上岸楼西侧下接地坪而高层窗口实际贯通的完整外墙", [-4.5, -4], [-4.5, 4.4], .4, 16.7, [[0, 1.2, 6.8, 9.4], [0, 12.6, 6.8, 2.7]]),
    ...glazedWall("上岸楼东侧整高承屋并真实采光的完整外墙", [4.8, 4.4], [4.8, -4], .4, 16.7, [[0, 1.2, 6.8, 9.4], [0, 12.6, 6.8, 2.7]]),
    ...glazedWall("电梯井前室侧低停靠入口与高层门框实际分别开通", [-.9, -1.7], [-4.2, -1.7], .2, 16.7, [[0, 3.3, 2.7, 7.5], [0, 14.9, 2.2, .9]], [[0, .4, 1.7, 2.4], [0, high, 1.7, 2.4]]),
    ...glazedWall("电梯井西壁从基础连续承到机头层的独立真实窗壁", [-4.2, -1.7], [-4.2, 2.3], .2, 16.7, [[0, 1.1, 3.3, 14.6]]),
    ...glazedWall("电梯井后壁与配重导轨分开的整高围护", [-4.2, 2.3], [-.9, 2.3], .2, 16.7, [[0, 1.1, 2.2, 14.6]]),
    ...glazedWall("电梯井东壁与中央公共高过廊实际分隔", [-.9, 2.3], [-.9, -1.7], .2, 16.7, [[0, 1.1, 3.3, 14.6]]),
    ...glazedWall("独立梯井前壁各级真实开口允许折返落脚且上下均可进入前室", [4.4, -1.4], [1.2, -1.4], .4, 16.7, [], [[.8, .4, 1.1, 2.4], [0, 4.24, 3, 2.8], [0, 8.08, 3, 2.8], [-.75, high, 1.1, 2.5]]),
    ...glazedWall("独立六跑梯井西侧整高采光围护", [1.2, -1.4], [1.2, 2.8], .4, 16.7, [[0, 1.1, 3.6, 14.6]]),
    ...glazedWall("独立六跑梯井后侧实际封合的通高采光壁", [1.2, 2.8], [4.4, 2.8], .4, 16.7, [[0, 1.1, 2.6, 14.6]]),
    ...glazedWall("独立六跑梯井东侧连续承屋采光壁", [4.4, 2.8], [4.4, -1.4], .4, 16.7, [[0, 1.1, 3.6, 14.6]]),
    part("公共低主门前实际接平低步道的实心缓坡", "extrude", paving, [-1, 0, 0], [1, 1, 1], [0, -90, 0], { depth: 3.4, profile: [{ x: -5.5, y: .2 }, { x: -4, y: .2 }, { x: -4, y: .4 }] }),
    part("低后工作门前实际接平场坪的独立实心短缓坡", "extrude", paving, [2.8, 0, 0], [1, 1, 1], [0, -90, 0], { depth: 1.8, profile: [{ x: 4.4, y: .2 }, { x: 5.9, y: .2 }, { x: 4.4, y: .4 }] }),
  ];
  const stairPosts: SolidBox[] = [], landingGuards: SolidBox[] = [];
  for (let index = 0; index < 6; index++) {
    const reverse = index % 2 === 1, x = reverse ? 3.55 : 2, y = .4 + index * 1.92, z = reverse ? 1.8 : -1.2, end = reverse ? -1.2 : 1.8;
    const flight = stairFlight("独立人行井内真实连续相接且留有梯下净空的十二级腰板梯", [x, y, z], 12, .16, .25, 1.05, .18);
    if (reverse) flight.rotation.y = 90;
    p.push(flight);
    for (const side of [-1, 1]) {
      p.push({ ...rail([x + side * .46, y + 1, z], [x + side * .46, y + 2.92, end], .05, steel), name: "在每跑实际踏板实宽内逐段接合的连续斜扶手" });
      for (const top of [false, true]) stairPosts.push({ center: [x + side * .46, y + (top ? 1.92 : 0) + .5, top ? end : z], size: [.05, 1, .05] });
    }
    if (index === 5) continue;
    const level = y + 1.92, centerZ = reverse ? -1.6 : 2.2;
    p.push(box("井内两跑真正平接并穿过前壁实际开口的折返平台", 2.775, level - .09, centerZ, 2.6, .18, .8, paving));
    landingGuards.push({ center: [2.775, level + .5, centerZ + (reverse ? -.35 : .35)], size: [2.6, 1, .1] }, { center: [1.525, level + .5, centerZ], size: [.1, 1, .8] }, { center: [4.025, level + .5, centerZ], size: [.1, 1, .8] });
  }
  for (let start = 0; start < stairPosts.length; start += 18) p.push(boxesMesh("各跑扶手端部真实落在踏板或平台上的独立细立柱", steel, stairPosts.slice(start, start + 18)));
  p.push(boxesMesh("五座折返平台只封边而保留双跑人行接入口的实际栏壁", steel, landingGuards));
  const structure: SolidBox[] = [];
  for (const x of [-4.35, 4.65]) for (const z of [-3.85, 4.25]) structure.push({ center: [x, 8.55, z], size: [.2, 16.3, .2] });
  for (const x of [1.55, 4]) structure.push({ center: [x, 5.11, 2.45], size: [.15, 9.42, .15] }, { center: [x, 4.15, -1.9], size: [.15, 7.5, .15] });
  for (const x of [-1, 1]) for (const z of [7, 10.5]) structure.push({ center: [x, (high - .25 + .2) / 2, z], size: [.45, high - .45, .45] });
  for (const z of [7, 10.5]) structure.push({ center: [0, high - .4, z], size: [2.8, .3, .5] });
  p.push(boxesMesh("双井高屋盖折返平台以及高短桥全部真实下接场坪的柱墩与跨梁", steel, structure));
  const upperGuards: SolidBox[] = [
    { center: [-1.35, high + .5, 8.4], size: [.1, 1, 8] }, { center: [1.35, high + .5, 8.4], size: [.1, 1, 8] },
    { center: [-2.7, high + .5, 13], size: [.1, 1, 2] }, { center: [2.7, high + .5, 13], size: [.1, 1, 2] },
    { center: [-2.075, high + .5, 12.05], size: [1.35, 1, .1] }, { center: [2.075, high + .5, 12.05], size: [1.35, 1, .1] },
    { center: [2.775, high + .5, 2.95], size: [3, 1, .1] }, { center: [1.3, high + .5, .85], size: [.1, 1, 4.1] }, { center: [4.3, high + .5, .85], size: [.1, 1, 4.1] },
  ];
  p.push(boxesMesh("高短桥桥台及上层真实梯井各自接地面的实体护边", steel, upperGuards));
  const mechanism: SolidBox[] = [
    { center: [-2.55, .3, .15], size: [2.6, .2, 3.5] },
    { center: [-3.82, 1.6, .15], size: [.06, 2.4, 3.5] }, { center: [-1.28, 1.6, .15], size: [.06, 2.4, 3.5] }, { center: [-2.55, 1.6, 1.87], size: [2.6, 2.4, .06] },
    { center: [-3.6, 1.6, -1.6], size: [.5, 2.4, .06] }, { center: [-1.5, 1.6, -1.6], size: [.5, 2.4, .06] }, { center: [-2.55, 2.65, -1.6], size: [1.6, .3, .06] }, { center: [-2.55, 2.85, .15], size: [2.6, .1, 3.5] },
    { center: [-2.975, high + 1.2, -1.56], size: [.85, 2.4, .05] }, { center: [-2.125, high + 1.2, -1.56], size: [.85, 2.4, .05] },
    { center: [-2.55, high - .04, -1.63], size: [2.1, .08, .24] },
    { center: [-2.55, 14.2, 2], size: [1.9, 1.6, .1] }, { center: [-3.55, 14.2, 2], size: [.14, 1.4, .14] }, { center: [-1.55, 14.2, 2], size: [.14, 1.4, .14] },
    { center: [-3.93, 1.6, .15], size: [.18, 1.8, .12] }, { center: [-1.17, 1.6, .15], size: [.18, 1.8, .12] },
    { center: [-3.9, 15.4, .3], size: [.35, .2, 4] }, { center: [-1.2, 15.4, .3], size: [.35, .2, 4] },
    { center: [-3.9, 15.7, 1.2], size: [.25, .5, .45] }, { center: [-1.2, 15.7, 1.2], size: [.25, .5, .45] },
    { center: [-2.55, 16.3, 2.12], size: [2.5, .15, .24] },
  ];
  for (const [x, z] of [[-3.98, .15], [-1.12, .15], [-3.55, 2], [-1.55, 2]]) mechanism.push({ center: [x!, 8.325, z!], size: [.06, 16.25, .08] });
  for (let start = 0; start < mechanism.length; start += 18) p.push(boxesMesh("停靠低层的完整轿厢闭合高层门叶与实际接导轨的配重机头构件", dark, mechanism.slice(start, start + 18)));
  p.push(cylinder("机头承轴架上实际接曳引绳束的完整曳引轮", -2.55, 15.8, 1.2, 1.6, .18, steel, [0, 0, 90]), cylinder("穿过曳引轮并由两端轴座实际承接的横轴", -2.55, 15.8, 1.2, .18, 3.2, steel, [0, 0, 90]));
  const rope: Triple[] = [[-2.55, 2.9, .4]];
  for (let index = 0; index <= 8; index++) {
    const angle = Math.PI - index * Math.PI / 8;
    rope.push([-2.55, 15.8 + .8 * Math.sin(angle), 1.2 + .8 * Math.cos(angle)]);
  }
  rope.push([-2.55, 15, 2]);
  p.push(combineMeshes("从实际轿厢顶绕曳引轮真实边缘并接到配重顶的连续绳束", dark, rope.slice(1).map((point, index) => meshBeam("绳束实体段", rope[index]!, point, .035, dark))));
  return p;
}
