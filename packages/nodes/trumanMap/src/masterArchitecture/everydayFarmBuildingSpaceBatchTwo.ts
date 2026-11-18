import { part } from "../assetModelParts";
import type { ModelPart } from "../assetModelParts";
import { base, box, design, rail } from "./structures";
import type { ArchitecturePrototype } from "./structures";
import { glazedFace, rectangle } from "./everydayWorkplaceSpaceBatchOne";
import { boxesMesh } from "./publicSpaceBatchEight";
import type { SolidBox } from "./publicSpaceBatchEight";

const concrete = "#a7afa6";
const wallColor = "#bbc1b5";
const roofColor = "#7b8e88";
const metal = "#607d7c";

// 固定高站台夹操作坑的空间类型参考：fao.org/4/S1250E/S1250E12.htm；
// dairynz.co.nz/milking/new-dairy-technology/herringbone-bail-pit/。
// 本体为可进入的建筑及固定栏道，不复用既有转盘设备或放置动物模型。
function fixedPitMilkingHall(): ModelPart[] {
  const high = 1.2, low = .25, eave = 6.6 - 1.6 * 6 / 6.4;
  const parts: ModelPart[] = [base(39, 63, .2), box("挤奶厅中央真正低于两侧牲畜台的整条操作坑底", 0, .225, 0, 2.4, .05, 20, concrete), box("挤奶厅后部与牲畜通道等高的完整待挤集群坪", 0, .70, 13, 12, 1.0, 6, concrete), box("操作坑前侧卫生工作间的独立低地面", 0, .225, -13, 5, .05, 6, concrete)];
  for (const side of [-1, 1]) {
    parts.push(part("高牲畜站台内侧真实向坑顶收拢的承地厚截面", "extrude", concrete, [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: (side < 0 ? [[-6, .2], [-1.2, .2], [-1.2, low], [-.9, high], [-6, high]] : [[.9, high], [1.2, low], [1.2, .2], [6, .2], [6, high]]).map(([x, y]) => ({ x: x!, y: y! })), depth: 20 }));
    parts.push(part("前方独立牲畜出口连续降到地面的完整实体坡", "extrude", concrete, [side * 3.9, 0, 0], [1, 1, 1], [0, -90, 0], { profile: [{ x: -23, y: .2 }, { x: -10, y: .2 }, { x: -10, y: high }], depth: 2.4 }));
  }
  parts.push(part("后集群坪从外部场地连续进入的完整实体长坡", "extrude", concrete, [0, 0, 0], [1, 1, 1], [0, -90, 0], { profile: [{ x: 16, y: .2 }, { x: 26, y: .2 }, { x: 16, y: high }], depth: 5.5 }));
  const gable: [number, number][] = [[-6, low], [6, low], [6, eave], [0, 6.6], [-6, eave]], animalDoors = [-3.9, 3.9].map(x => rectangle(x, high, 2.5, 2.8));
  parts.push(...glazedFace("挤奶厅前端高牲畜双出口与低位人员门分开的完整山墙", "xy", gable, [-3.2, 3.2].map(x => rectangle(x, 4.4, 3, .65)), [...animalDoors, rectangle(0, low, 1.65, 2.35)], -10), ...glazedFace("待挤集群坪接入两条高位牛道的后山墙", "xy", gable, [-3.2, 3.2].map(x => rectangle(x, 4.4, 3, .65)), animalDoors, 10));
  for (const x of [-6, 6]) parts.push(...glazedFace("挤奶厅两侧完整下护壁与真实上通风窗墙", "yz", [[-10, high], [10, high], [10, eave], [-10, eave]], [-6.5, 0, 6.5].map(z => rectangle(z, 2.9, 5.2, 1.35)), [], x));
  parts.push(part("双站台与低操作坑共同覆盖的完整高双坡厅盖", "extrude", roofColor, [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: -6.4, y: 5.2 }, { x: 0, y: 6.8 }, { x: 6.4, y: 5.2 }, { x: 6.4, y: 5.0 }, { x: 0, y: 6.6 }, { x: -6.4, y: 5.0 }], depth: 20.7 }));
  for (const z of [-9.3, -3.1, 3.1, 9.3]) {
    for (const x of [-5.75, 5.75]) parts.push(box("挤奶厅避开两条牛道且从高台接到屋架的完整柱", x, (high + eave + .04) / 2, z, .22, eave + .04 - high, .22, metal));
    parts.push(rail([-6, eave, z], [0, 6.6, z], .24, metal), rail([0, 6.6, z], [6, eave, z], .24, metal), box("跨越操作坑上方而不占低位人员空间的通长系梁", 0, eave - .12, z, 11.5, .2, .22, metal));
  }
  const posts: SolidBox[] = [], straightRails: SolidBox[] = [];
  for (const side of [-1, 1]) {
    straightRails.push({ center: [side * 1.0, high + .035, 0], size: [.035, .035, 17.2] }, { center: [side * 1.0, high + .90, 0], size: [.06, .06, 17.2] }, { center: [side * 1.0, high + .69, 0], size: [.05, .05, 17.2] });
    for (let index = 0; index < 9; index++) {
      const z = -8 + index * 2, x = side * (index % 2 ? 2.65 : 2.25);
      posts.push({ center: [side * 1.0, high + .45, z], size: [.055, .90, .055] }, { center: [x, high + .38, z], size: [.055, .76, .055] });
      if (index < 8) parts.push(rail([x, high + .76, z], [side * (index % 2 ? 2.25 : 2.65), high + .76, z + 2], .055, metal));
    }
    for (const edge of [-1, 1]) {
      const x = side * 3.9 + edge * 1.13;
      parts.push(rail([x, .2 + 1.1, -23], [x, high + 1.1, -10], .055, metal));
      for (const z of [-22.8, -18.6, -14.4, -10.2]) { const floor = .2 + (z + 23) / 13; posts.push({ center: [x, floor + .55, z], size: [.055, 1.10, .055] }); }
    }
    straightRails.push({ center: [side * 5.85, high + 1.1, 13], size: [.06, .06, 6] });
    for (const z of [10.2, 13, 15.8]) posts.push({ center: [side * 5.85, high + .55, z], size: [.06, 1.1, .06] });
    for (const y of [high + .65, high + 1.1]) straightRails.push({ center: [side * 4.42, y, 15.9], size: [2.8, .055, .055] });
    for (const x of [3.05, 5.80]) posts.push({ center: [side * x, high + .55, 15.9], size: [.06, 1.1, .06] });
  }
  for (let start = 0; start < posts.length; start += 20) parts.push(boxesMesh("固定挤奶栏及独立牲畜长坡上实际落地的完整竖杆", metal, posts.slice(start, start + 20)));
  parts.push(boxesMesh("不盖住操作坑且与栏杆立柱真实相接的水平护栏", metal, straightRails));
  const front: [number, number][] = [[-2.5, low], [2.5, low], [2.5, 3.25], [-2.5, 3.25]], sides: [number, number][] = [[-16, low], [-10, low], [-10, 3.25], [-16, 3.25]];
  parts.push(...glazedFace("低位卫生前室面向工人的独立人员入口", "xy", front, [], [rectangle(0, low, 1.6, 2.3)], -16));
  for (const x of [-2.5, 2.5]) parts.push(...glazedFace("卫生前室不与两侧牲畜坡道串行的完整侧窗墙", "yz", sides, [rectangle(-13, 1.35, 3.0, 1.1)], [], x));
  parts.push(box("低卫生前室真正接到主厅前墙的完整平屋盖", 0, 3.35, -13, 5.2, .2, 6.2, roofColor), box("卫生前室靠墙固定的短洗手工作台", -1.95, .7, -13, .7, .9, 2.8, concrete));
  return parts;
}

export const everydayFarmBuildingSpaceBatchTwoDesigns: ArchitecturePrototype[] = [
  design("双高台夹低坑固定挤奶厅", "两条固定牲畜高站台夹住真实低操作坑，向内收窄的坑壁让出脚位，外侧牛道前后贯通并分别接向后集群坪和前下降坡；低位卫生前室直接连到坑内人员门，屋架不落入坑中，不包含转盘、动物或车辆", fixedPitMilkingHall, "建筑", "现代"),
];
