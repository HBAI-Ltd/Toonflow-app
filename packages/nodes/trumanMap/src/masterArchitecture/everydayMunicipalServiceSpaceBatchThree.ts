import { part } from "../assetModelParts";
import type { ModelPart } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { box, design } from "./structures";
import type { ArchitecturePrototype } from "./structures";
import { glazedWall } from "./modernResidenceSpaceBatchOne";
import { glazedFace, rectangle } from "./everydayWorkplaceSpaceBatchOne";
import { standingPanel } from "./publicSpaceBatchOne";
import { boxesMesh } from "./publicSpaceBatchEight";
import type { SolidBox } from "./publicSpaceBatchEight";

const concrete = "#aaafa6";
const paving = "#b6ad97";
const roof = "#778c87";
const timber = "#a18b6b";
const wall = "#c6c5b5";

function dualCorridorCitizenServiceCenter(): ModelPart[] {
  const floor = .205;
  const outline: [number, number][] = [[-24, -12], [-12, -12], [-12, 7], [-6, 7], [-6, -18], [6, -18], [6, 7], [12, 7], [12, -8], [24, -8], [24, 18], [-24, 18]];
  const halls: [number, number, number, number][] = [[-18, -12, 4.2, 5.1], [0, -18, 5.7, 5.7], [18, -8, 5.1, 4.2]];
  const p: ModelPart[] = [
    box("三座公共厅两座街庭和完整后工作楼共同的落地基础", 0, .1, 0, 54, .2, 42, concrete),
    polygon("三候办厅接到前横廊和独立后台楼的连续实心地面", paving, outline, .017, [0, .188, 0]),
    box("后工作楼两条通廊及中部受理工作房共同的完整屋盖", 0, 3.9, 12.5, 48.48, .24, 11.48, roof),
    part("职员后门外独立接到街外地面的完整低缓坡", "extrude", paving, [0, 0, 22], [1, 1, 1], [0, -90, 0], { depth: 2.8, profile: [{ x: -1, y: 0 }, { x: 1, y: 0 }, { x: -1, y: .2 }] }),
  ];
  const benches: SolidBox[] = [], furnishings: SolidBox[] = [];
  for (const [center, front, leftTop, rightTop] of halls) {
    const left = center - 6, right = center + 6, length = 7 - front, slope = (rightTop - leftTop) / 12;
    const face: [number, number][] = [[left, .2], [right, .2], [right, rightTop], [left, leftTop]];
    p.push(...glazedFace("每座独立候办厅朝街的真实前门和采光窗", "xy", face, [rectangle(center - 3.8, 1.1, 2.5, 1.8), rectangle(center + 3.8, 1.1, 2.5, 1.8)], [rectangle(center, floor, 2.6, 2.6)], front));
    p.push(...glazedFace("候办厅后部宽门实际接入公共横廊并封合高低屋面", "xy", face, [], [rectangle(center, floor, 3.6, 3.2)], 7));
    for (const [x, top] of [[left, leftTop], [right, rightTop]]) p.push(...glazedFace("面向敞街凹院和外场的完整候办厅侧窗墙", "yz", [[front, .2], [7, .2], [7, top!], [front, top!]], [rectangle(front + length * .27, 1.1, 4.2, 1.8), rectangle(front + length * .73, 1.1, 4.2, 1.8)], [], x!));
    p.push(part("两端封墙和长侧墙真实接承的完整错进剖面屋盖", "extrude", roof, [center, 0, (front + 7) / 2], [1, 1, 1], [0, 0, 0], { depth: length + .48, profile: [{ x: -6.24, y: leftTop - slope * .24 - .02 }, { x: 6.24, y: rightTop + slope * .24 - .02 }, { x: 6.24, y: rightTop + slope * .24 + .2 }, { x: -6.24, y: leftTop - slope * .24 + .2 }] }));
    p.push(part("公众从街外地面独立进入本厅前场的完整低缓坡", "extrude", paving, [center, 0, -22], [1, 1, 1], [0, 90, 0], { depth: 3.6, profile: [{ x: -1, y: 0 }, { x: 1, y: 0 }, { x: -1, y: .2 }] }));
    for (const side of [-1, 1]) for (const fraction of [.37, .68]) {
      const x = center + side * 3.4, z = front + length * fraction;
      benches.push({ center: [x, floor + .2, z], size: [.5, .4, 2.6] }, { center: [x, floor + .45, z], size: [.75, .1, 2.8] });
    }
  }
  for (const center of [-9, 9]) p.push(...glazedWall("敞街凹院直接进入公共横廊的真实独立庭门", [center - 3, 7], [center + 3, 7], .2, 3.8, [], [[0, floor, 1.8, 2.6]]));
  const windows: [number, number][][] = [-20, -13, -4, 4, 13, 20].map(x => rectangle(x, 1, 3.6, 1.4));
  p.push(
    standingPanel("六个实际贯通受理窗口将公共横廊与后台工作房分开", wall, [[-24, .2], [24, .2], [24, 3.8], [-24, 3.8]], windows, 10, .24),
    ...glazedWall("三个独立受理工作房实际向职员后廊开门的内隔壁", [-24, 15], [24, 15], .2, 3.8, [], [-16, 0, 16].map((x): [number, number, number, number] => [x, floor, 1.2, 2.5])),
    ...glazedWall("后台楼真实后门与面向独立职员廊的连续采光窗", [-24, 18], [24, 18], .2, 3.8, [-19, -9, 9, 19].map((x): [number, number, number, number] => [x, 1.1, 4, 1.6]), [[0, floor, 1.6, 2.6]]),
  );
  for (const side of [-1, 1]) p.push(...glazedWall("后楼端部独立公众出口与职员廊采光的完整侧墙", [side * 24, 7], [side * 24, 18], .2, 3.8, [[3.7, 1.1, 2, 1.6]], [[-4, floor, 1.6, 2.6]]));
  for (const x of [-8, 8]) p.push(box("三个后台受理工作房之间由地面接到屋盖的实隔墙", x, 2, 12.5, .18, 3.6, 5, wall));
  for (const x of [-20, -13, -4, 4, 13, 20]) furnishings.push({ center: [x, 1.03, 10], size: [3.6, .1, .8] });
  for (const x of [-16, 0, 16]) furnishings.push({ center: [x, floor + .4, 13], size: [.7, .8, 1] }, { center: [x, floor + .85, 13], size: [3.8, .1, 1.3] });
  p.push(boxesMesh("六受理窗口真正贴到窗槛的柜板及后台落地承托桌台", timber, furnishings));
  for (let i = 0; i < benches.length; i += 18) p.push(boxesMesh("三座候办厅避开中轴通路且真实接地的连续等候长座", timber, benches.slice(i, i + 18)));
  return p;
}

export const everydayMunicipalServiceSpaceBatchThreeDesigns: ArchitecturePrototype[] = [
  design("双廊分流三厅便民中心", "三座错进公共候办厅围出两座向街敞开的凹院，各厅宽后门及庭门接入连续公众横廊；六受理窗口通向三间完整工作房，职员通过后门和独立后廊进入工作房，全部房腔与高低剖面屋盖由连续落地实墙接承", dualCorridorCitizenServiceCenter, "建筑", "现代"),
];
