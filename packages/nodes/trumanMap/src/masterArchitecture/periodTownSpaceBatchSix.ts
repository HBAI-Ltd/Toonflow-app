import { part, beam, type ModelPart } from "../assetModelParts";
import { base, box, cylinder, design, type ArchitecturePrototype } from "./structures";
import { stairFlight } from "./historicSpaceBatchSeven";
import { openingWall, holesAt, postSet } from "./periodPublicSpaceBatchOne";
import { boxesMesh, type SolidBox } from "./publicSpaceBatchEight";

const stone = "#b7af99", wood = "#987d58", wall = "#c5bca5", roofColor = "#7e826e", bronze = "#9c8963";

// 前低门斗和双衣帽室连到单间高教室的原创年代乡镇校舍，并非旧多翼学校换木皮。
// 类型参考：https://npgallery.nps.gov/GetAsset/60a85012-f50f-4671-8aa3-fdfd0e341744
export const periodTownSpaceBatchSixDesigns: ArchitecturePrototype[] = [
  design("前斗双衣室高窗单室学堂", "前低门斗中央过道分别连通两侧衣帽室和后部单间高窗教室，后授课台保留台后教师出门通路，独立课桌座架与侧通道实际落在完整地坪上；前低屋脊上完整空钟亭由屋盖承托，高低两段阁顶和内部横梁真正接到承墙", oneRoomTownSchool, "建筑", "欧式"),
];

function oneRoomTownSchool(): ModelPart[] {
  const p: ModelPart[] = [base(18, 24), box("低门斗、两衣帽室与单间教室共同的完整抬高石地坪", 0, .3, 0, 9, .24, 16, stone), openingWall("前低门斗真正开通中央校门与两侧衣帽室采光窗的完整前壁", 9, 2.7, [...holesAt([0], 1.6, 2.4), ...holesAt([-3, 3], 1.4, 1.2, 1.1)], [0, .42, -8], 0, wall), openingWall("前衣帽室及中央过道分别连到教室的三条真正通门", 9, 4.3, [...holesAt([0], 1.6, 2.6), ...holesAt([-3, 3], 1.1, 2.3)], [0, .42, -4], 0, wall), openingWall("单间教室后方真正让开授课台的教师侧后出口与高窗", 9, 4.3, [...holesAt([-3.8], 1, 2.6), ...holesAt([2.8], 1.3, .8, 3.2)], [0, .42, 8], 0, wall), part("单间高教室由完整外壁和内部横梁接承的封闭双坡阁顶", "extrude", roofColor, [0, 4.92, 2], [1, 1, 1], [0, 0, 0], { depth: 12.3, profile: [{ x: -4.8, y: 0 }, { x: 0, y: 1.5 }, { x: 4.8, y: 0 }, { x: 4.8, y: -.2 }, { x: -4.8, y: -.2 }] }), part("前门斗双衣帽室由完整低外壁接承的独立低双坡阁顶", "extrude", roofColor, [0, 3.32, -6], [1, 1, 1], [0, 0, 0], { depth: 4.3, profile: [{ x: -4.8, y: 0 }, { x: 0, y: .9 }, { x: 4.8, y: 0 }, { x: 4.8, y: -.2 }, { x: -4.8, y: -.2 }] }), stairFlight("街面由石场坪实际登到学校前门斗的独立双级宽石阶", 2, 3, .24, .3, 0, [0, .18, -8.6], -90), box("教室后部真正抬起且留出一米台后出入带的完整授课石台", 0, .62, 6.2, 6.4, .4, 1.6, stone), stairFlight("教室侧通道前方真正登上授课台面的独立短阶", 2, 1.5, .4, .3, 0, [-2, .42, 4.8], -90), box("授课高台上真正落地的独立教师木案柜基体", 0, 1.18, 6.1, 2.5, .72, .9, wood), box("教师案柜基体上真实搭接的薄木写字台面", 0, 1.59, 6.1, 2.7, .1, 1.1, wood), box("教室后墙实际搭接而不悬空的完整黑板木背", 0, 2.5, 7.81, 5.2, 2, .12, wood), box("黑板木背前表面实际相接的深色薄书写面", 0, 2.5, 7.735, 5, 1.8, .04, "#56665a"), box("低屋脊上真实嵌接并承托钟亭四脚的平木承台", 0, 4.15, -6.5, 1.5, .16, 1.6, wood), { ...postSet("前钟亭真正从低屋脊承台接到四周顶横枋的完整木柱", [-.6, .6].flatMap(x => [[x, -7], [x, -6]] as [number, number][]), 1.1, 4.23), color: wood }, box("钟亭前后横枋中段实际搭接并承接悬钟轴的纵向木短梁", 0, 5.38, -6.5, .2, .1, 1.2, wood), part("独立小钟亭由完整柱梁接承且下缘闭合的低双坡木盖", "extrude", roofColor, [0, 5.55, -6.5], [1, 1, 1], [0, 0, 0], { depth: 1.9, profile: [{ x: -.95, y: 0 }, { x: 0, y: .45 }, { x: .95, y: 0 }, { x: .95, y: -.12 }, { x: -.95, y: -.12 }] }), part("前校钟亭内真实有空腔与薄钟口的独立铜钟", "lathe", bronze, [0, 5, -6.5], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: .22 }, { x: .07, y: .22 }, { x: .11, y: .02 }, { x: .19, y: -.20 }, { x: .24, y: -.27 }, { x: .28, y: -.27 }, { x: .23, y: -.23 }, { x: .15, y: -.06 }, { x: .12, y: .12 }, { x: .09, y: .23 }, { x: .07, y: .28 }, { x: 0, y: .28 }] }), beam("独立铜钟真正接到亭顶横梁下方的短悬钟轴", bronze, [0, 5.28, -6.5], [0, 5.38, -6.5], .035), beam("铜钟空腔内从钟顶实接到下沿摆锤的完整细钟舌杆", bronze, [0, 5.25, -6.5], [0, 4.68, -6.5], .018), part("钟舌杆下端真实接合且稍露出钟口的圆铜摆锤", "sphere", bronze, [0, 4.7, -6.5], [.075, .075, .075])];
  for (const side of [-1, 1]) {
    p.push(openingWall("教室两侧从室内真正透光的连续高窗外壁", 12, 4.3, holesAt([3.2, -.6, -4], 1.8, 2.2, 1.15), [side * 4.5, .42, 2], 90, wall), openingWall("前低衣帽室外侧实际封合低阁顶的独立采光短壁", 4, 2.7, holesAt([0], 1.4, 1.2, 1.1), [side * 4.5, .42, -6], 90, wall), openingWall("中央过道分别通往两侧衣帽室的真实内部矮门壁", 4, 2.7, holesAt([0], 1, 2.2), [side * 1.2, .42, -6], 90, wall), box("衣帽室外壁内侧真实嵌接短衣帽挂架的连续木承板", side * 4.38, 1.75, -6, .12, .18, 2.6, wood));
    for (const z of [-6.8, -6, -5.2]) p.push(cylinder("由木承板真实向衣帽室内侧突出的独立短圆挂钩", side * 4.24, 1.75, z, .035, .2, wood, [0, 0, 90]));
  }
  for (const z of [-2, 2, 6]) p.push(box("单间高教室上方两端真正搭入左右外墙的粗木顶横梁", 0, 4.6, z, 9.2, .24, .22, wood));
  for (const z of [-7, -6]) p.push(box("前后两排钟亭柱顶真实接承纵悬钟梁与小屋盖的完整横枋", 0, 5.38, z, 1.5, .1, .2, wood));
  const schoolFurniture: SolidBox[] = [];
  for (const x of [-2.8, 0, 2.8]) for (const z of [-2.2, -.2, 1.8, 3.8]) {
    schoolFurniture.push({ center: [x, 1.12, z], size: [1.4, .08, .65] }, { center: [x, .86, z - .7], size: [1.4, .08, .45] }, { center: [x, 1.05, z - .91], size: [1.4, .3, .07] });
    for (const dx of [-.55, .55]) {
      schoolFurniture.push({ center: [x + dx, .62, z - .7], size: [.10, .4, .4] });
      for (const dz of [-.24, .24]) schoolFurniture.push({ center: [x + dx, .75, z + dz], size: [.08, .66, .08] });
    }
  }
  for (const side of [-1, 1]) {
    schoolFurniture.push({ center: [side * 2.9, .85, -7.2], size: [2.6, .08, .45] });
    for (const dx of [-1, 1]) schoolFurniture.push({ center: [side * 2.9 + dx, .615, -7.2], size: [.10, .39, .4] });
  }
  for (let start = 0; start < schoolFurniture.length; start += 20) p.push(boxesMesh("教室独立课桌座面靠背真实承脚与前衣帽室换鞋凳的完整木构件", wood, schoolFurniture.slice(start, start + 20)));
  return p;
}
