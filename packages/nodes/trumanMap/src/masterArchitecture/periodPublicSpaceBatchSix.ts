import type { ModelPart } from "../assetModelParts";
import { base, box, design, type ArchitecturePrototype } from "./structures";
import { polygon } from "../masterNature/shared";
import { stairFlight } from "./historicSpaceBatchSeven";
import { tiledRoof, openingWall, holesAt, postSet } from "./periodPublicSpaceBatchOne";
import { boxesMesh, type SolidBox } from "./publicSpaceBatchEight";

const stone = "#aaa997", plaster = "#bfb59d", wood = "#896d50", brick = "#b18b76";

export const periodPublicSpaceBatchSixDesigns: ArchitecturePrototype[] = [
  design("穿厅双诊前药后园医馆", "前药堂通向高候诊穿厅，左侧两座独立低诊室保留采光间隙并通过短雨廊接厅，右侧两层药材楼有真实室内登阶和楼板孔，后门通向围合养护园", medicalApothecary, "建筑", "中式"),
];

function medicalApothecary(): ModelPart[] {
  const p: ModelPart[] = [base(42, 50), box("药堂、候诊厅、双诊室和后园共同的石铺地坪", 0, .3, 0, 40, .24, 48, stone), openingWall("医馆临街药堂实际开通的主门与两边透光窗", 32, 4.2, [...holesAt([0], 3, 3), ...holesAt([-11, 11], 3, 1.6, 1.3)], [0, .42, -20], 0, brick), openingWall("药堂后部真正分开候诊入口与职员装药旁门的厚壁", 32, 4.2, [...holesAt([0], 2.5, 2.8), ...holesAt([13], 1.5, 2.8)], [0, .42, -12], 0, brick), tiledRoof("临街长药堂完整低跨灰瓦屋盖", 32, 8, 4.62, [0, -16]), box("药堂内让开中央候诊入口的配药木柜", -8, 1.02, -16, 10, 1.2, .8, wood), box("配药木柜后方真正落地的药柜柜体", -9, 1.72, -12.6, 10, 2.6, .6, wood), openingWall("候诊高厅接前药堂的真门与越过低檐的上窗", 10, 5.2, [...holesAt([0], 2.5, 2.8), ...holesAt([0], 3, .5, 4.5)], [0, .42, -12]), openingWall("候诊高厅真正接到后养护园的门和采光高窗", 10, 5.2, [...holesAt([0], 2.4, 2.8), ...holesAt([-3, 3], 1.6, .9, 3.8)], [0, .42, 6]), openingWall("候诊厅左壁真正接双诊室短廊并朝向室间采光隙的门窗", 18, 5.2, [...holesAt([3, -6], 1.5, 2.6), ...holesAt([7.5, -1.5], 1.2, 2, 1.2)], [-5, .42, -3], 90), openingWall("候诊厅右侧真正通向独立药材楼的工作门", 18, 5.2, holesAt([-3], 1.5, 2.6), [5, .42, -3], 90), tiledRoof("高候诊穿厅由外围厚壁接承的完整灰瓦屋盖", 10, 18, 5.62, [0, -3]), postSet("候诊穿厅内真正由石地接到高屋盖的木柱", [[-3, -8], [3, -8], [-3, 4], [3, 4]], 5.2), box("候诊厅右侧让开药材楼门口的长木坐台", 3, .67, -6, .7, .5, 7, wood), box("候诊厅前左侧让开双诊室入口的短木坐台", -3, .67, -10, .7, .5, 2, wood), box("候诊厅接药材楼两道门之间真正由厚壁接承的短雨盖", 5.5, 3.745, 0, 1.1, .15, 2.2, wood)];
  for (const s of [-1, 1]) p.push(openingWall("临街药堂两端真正透光的完整侧壁", 8, 4.2, holesAt([0], 2, 1.6, 1.3), [s * 16, .42, -16], 90, brick), box("医馆从前药堂通到后养护园的外侧完整围壁", s * 18, 1.82, -1, .3, 2.8, 38, plaster), box("临街药堂两端与外围墙真正闭合的短墙", s * 17, 1.82, -20, 2, 2.8, .3, plaster));
  p.push(openingWall("后养护园真正闭合且保留服务小门的围壁", 36, 2.8, holesAt([13], 1.5, 2.5), [0, .42, 18]));
  for (const z of [-6, 3]) {
    p.push(openingWall("独立低诊室面对候诊厅短雨廊的真实诊门", 6, 3.4, holesAt([0], 1.5, 2.6), [-6, .42, z], 90), openingWall("独立低诊室外侧真正透光的宽窗", 6, 3.4, holesAt([0], 2, 1.5, 1.2), [-14, .42, z], 90), tiledRoof("独立低诊室各自完整封合的灰瓦屋盖", 8, 6, 3.82, [-10, z]), box("候诊厅与独立诊室之间真正跨接门道的短木雨盖", -5.5, 3.745, z, 1.1, .15, 2.2, wood), box("诊室内真正落地的单人检查木榻", -11.2, .67, z, 1, .5, 2.4, wood), box("检查木榻上实际贴合的薄软垫", -11.2, .98, z, 1, .12, 2.4, "#b5bcb0"), box("诊室内避开进门路径的独立诊脉低案", -8.5, .87, z - 1, 1.8, .9, .8, wood));
    for (const end of [-1, 1]) p.push(box("两座独立低诊室各自完整封合的端部厚壁", -10, 2.12, z + end * 3, 8, 3.4, .3, plaster));
  }
  p.push(openingWall("药材楼前方真正通向职员装药场的地面门和上层窗", 10, 6.8, [...holesAt([0], 1.6, 2.6), ...holesAt([-2.5, 2.5], 1.5, 1.5, 4.5)], [11, .42, -6], 0, brick), openingWall("药材楼后方真正接到养护园的地面门和上层窗", 10, 6.8, [...holesAt([0], 1.6, 2.6), ...holesAt([-2.5, 2.5], 1.5, 1.5, 4.5)], [11, .42, 6], 0, brick), openingWall("药材楼内侧接候诊短廊且高窗越过低厅外檐的厚壁", 12, 6.8, [...holesAt([0], 1.5, 2.6), ...holesAt([-3, 3], 2, .7, 5.5)], [6, .42, 0], 90, brick), openingWall("药材楼外侧真正透光的双层采光砖窗", 12, 6.8, [1.2, 4.5].flatMap(y => holesAt([-3.5, 3.5], 2, 1.6, y)), [16, .42, 0], 90, brick), tiledRoof("独立两层药材楼完整高灰瓦屋盖", 10, 12, 7.22, [11, 0]), polygon("药材楼上层真正留出登阶孔的完整木楼面", wood, [[6, -6], [16, -6], [16, 6], [6, 6]], .25, [0, 3.57, 0], [[[8.15, -5], [9.85, -5], [9.85, 1], [8.15, 1]]]), stairFlight("药材楼内真正穿过楼面洞口接到上层存药室的木阶", 20, 1.4, 3.4, .3, 0, [9, .42, -5], -90, true));
  for (const x of [8.15, 9.85]) p.push(box("药材楼真实登阶孔两侧的完整木护栏", x, 4.32, -2, .08, 1, 6, wood));
  p.push(box("药材楼上层登阶孔低端的完整木护栏", 9, 4.32, -5, 1.7, 1, .08, wood));
  const drawerLines: SolidBox[] = [];
  for (const x of [-13, -11, -9, -7, -5]) drawerLines.push({ center: [x, 1.72, -12.91], size: [.04, 2.6, .035] });
  for (const y of [.85, 1.5, 2.15, 2.8]) drawerLines.push({ center: [-9, y, -12.91], size: [10, .04, .035] });
  p.push(boxesMesh("前药堂背柜上真实贴接柜面的分格木条", "#6d5845", drawerLines));
  return p;
}
