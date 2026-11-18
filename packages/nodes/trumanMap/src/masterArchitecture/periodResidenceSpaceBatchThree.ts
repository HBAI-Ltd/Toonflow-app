import { part, type ModelPart, type Triple } from "../assetModelParts";
import { box, design } from "./structures";
import { halfRoundWall } from "./spatialShells";
import { slopePanel } from "./vernacularWorldBatchOne";
import { solidBox } from "./vernacularWorldBatchThree";
import { meshBeam } from "./vernacularWorldBatchFive";
import { hardFloor } from "./vernacularWorldBatchSix";
import { packMeshes } from "./vernacularWorldBatchThirteen";
import { lattice, periodRoof, periodWall } from "./periodResidenceSpaceBatchOne";

const wall = "#b8aa8c", stone = "#aaa694", timber = "#8a7250", tile = "#657367", earth = "#a39474", water = "#81a6a4";

// https://www.gdmx.gov.cn/mzmxnkzzf/gkmlpt/content/2/2434/mpost_2434262.html
// https://www.gdmuseum.org.cn/ms/col604/401
// 堂、横、围、化胎与前禾坪半月塘作为一座完整家宅；本体尺度及全部几何为原创。
export const periodResidenceSpaceBatchThreeDesigns = [
  design("三堂横屋半月围龙家宅", "三座轴线堂屋由前向后逐级抬高，左右直横屋的末间经实阶接入后半圆围房的连续内廊，中央化胎高起而不堵内廊，前禾坪和下凹半月塘接在家宅前方", hakkaWeilongResidence, "建筑", "中式"),
];

function arcWall(name: string, radius: number, thickness: number, bottom: number, height: number, start: number, end: number, color: string): ModelPart {
  return halfRoundWall(name, radius, thickness, height, [0, bottom, 0], -start * 180 / Math.PI, color, end - start);
}

function hakkaWeilongResidence(): ModelPart[] {
  const pond: [number, number][] = Array.from({ length: 15 }, (_, i) => [Math.cos(i * Math.PI / 14) * 10, -14 - Math.sin(i * Math.PI / 14) * 10]), p: ModelPart[] = [hardFloor("整座堂横围家宅和禾坪真实避开前半月塘的完整石地基", stone, [[-20.5, -25], [20.5, -25], [20.5, 21], [-20.5, 21]], .2, [0, 0, 0], [pond]), hardFloor("半月塘低于前禾坪的真实完整塘底", earth, pond, .06, [0, 0, 0]), hardFloor("半月塘真实处于塘内低标高的连续水面", water, pond, .02, [0, .07, 0]), halfRoundWall("前半月塘真正围住凹池弧缘的完整石塘岸", 10.2, .25, .3, [0, 0, -14], 180, stone), box("半月塘直岸与前禾坪之间真实挡水的完整石边", 0, .15, -14, 20.4, .3, .25, stone)], walls: ModelPart[] = [], wood: ModelPart[] = [], roof: ModelPart[] = [], steps: ModelPart[] = [];
  for (let hall = 0; hall < 3; hall++) {
    const z = -8 + hall * 8, floor = .3 + hall * .3, windows: [number, number, number, number][] = [[-3, 1, 1.3, 1.2], [3, 1, 1.3, 1.2]];
    p.push(box("轴线堂屋从共同地基真正抬起的完整厚石台", 0, (.2 + floor) / 2, z, 10, floor - .2, 5, stone), ...periodRoof("三堂各自完整而随石台递升的双坡瓦盖", 5, 10, floor + 2.8, 1.2, 0, z, true, wall));
    walls.push(periodWall("轴线堂屋正面真实保留中门和两边采光窗的完整墙", wall, 10, 2.8, .24, [0, floor, z - 2.5], [[0, 1.4, 2.3]], windows), periodWall(hall < 2 ? "前中堂后缘真正贯通到下一处院阶的完整门墙" : "后堂背后与化胎分开而真正封合的完整墙", wall, 10, 2.8, .24, [0, floor, z + 2.5], hall < 2 ? [[0, 1.4, 2.3]] : [], hall < 2 ? [] : [[-3, 1.4, 1.2, .85], [3, 1.4, 1.2, .85]])); wood.push(...lattice([0, floor, z - 2.5], windows));
    for (const side of [-1, 1]) {
      walls.push(periodWall("堂屋两端与内院及横向通路实际相接的侧门墙", wall, 5, 2.8, .22, [side * 5, floor, z], [[0, 1, 2.2]], [], 90));
      const count = Math.ceil((floor - .2) / .15);
      for (let i = 1; i < count; i++) { const top = floor - i * (floor - .2) / count; steps.push(solidBox("堂屋侧门从高台真实下降到横向院路的实体石阶", side * (5 + (i - .5) * .35), (.2 + top) / 2, z, .35, top - .2, 1.4, stone)); }
    }
    wood.push(solidBox("堂内两侧避开中轴通行的完整低木长坐台", -3.5, floor + .22, z, .8, .44, 2.1, timber), solidBox("堂内另一侧真实落地的完整低木长坐台", 3.5, floor + .22, z, .8, .44, 2.1, timber));
    if (hall === 2) continue;
    const nextFront = z + 5.5;
    p.push(box("两堂之间前段实际与低堂石台平齐的完整院路", 0, (.2 + floor) / 2, z + 3.5, 2.8, floor - .2, 2, stone));
    for (let i = 0; i < 2; i++) { const top = floor + (i + 1) * .15; steps.push(solidBox("从前堂院路逐级接到后堂高台的实体石阶", 0, (.2 + top) / 2, nextFront - .75 + i * .5, 2.8, top - .2, .5, stone)); }
  }
  for (const side of [-1, 1]) {
    const center = side * 11.5, width = 11 / 3, windows: [number, number, number, number][] = [[1.2, 1, .7, 1.1]];
    p.push(box("横屋所有独立生活房共用的完整低石台", center, .25, -5.5, 5, .1, 11, stone), ...periodRoof("左右完整直横屋实际接到后围廊一端的长瓦盖", 5, 11, 3, 1.2, center, -5.5, false, wall));
    for (const z of [-55 / 6, -5.5, -11 / 6]) { walls.push(periodWall("横屋各生活房向内院真正开门窗的完整砖壁", wall, width, 2.7, .22, [side * 9, .3, z], [[-.3, .95, 2.1]], windows, 90)); wood.push(...lattice([side * 9, .3, z], windows, 90)); }
    walls.push(periodWall("横屋向宅外保留真实小窗的完整长后壁", wall, 11, 2.7, .28, [side * 14, .3, -5.5], [], [[-11 / 3, 1.3, 1, .85], [0, 1.3, 1, .85], [11 / 3, 1.3, 1, .85]], 90), solidBox("横屋前端真正闭合到双坡山面的完整墙", center, 1.65, -11, 5, 2.7, .24, wall), periodWall("横屋末间保留通向高围廊的真实阶梯过门", wall, 5, 2.7, .24, [center, .3, 0], [[side * 1.65, 1.2, 2.6]]));
    for (const z of [-22 / 3, -11 / 3]) walls.push(solidBox("横屋相邻独立生活房之间真正落地的完整分隔", center, 1.65, z, 5, 2.7, .14, wall));
    for (let i = 0; i < 4; i++) { const height = (i + 1) * .15; steps.push(solidBox("横屋最后一间内逐级接到半圆围廊的实体石阶", side * 13.2, .3 + height / 2, -1.575 + i * .45, 1, height, .45, stone)); }
    wood.push(solidBox("横屋前房里真正避开独立实门的完整木卧台", side * 11.8, .52, -9.2, 1.5, .44, 2.1, timber), solidBox("横屋中房里真正接在低石台上的完整木卧台", side * 11.8, .52, -5.5, 1.5, .44, 2.1, timber));
  }
  const outline: [number, number][] = [...Array.from({ length: 21 }, (_, i) => [Math.cos(i * Math.PI / 20) * 19.1, Math.sin(i * Math.PI / 20) * 19.1] as [number, number]), ...Array.from({ length: 21 }, (_, i) => [Math.cos((20 - i) * Math.PI / 20) * 12.7, Math.sin((20 - i) * Math.PI / 20) * 12.7] as [number, number])];
  p.push(halfRoundWall("后半圆房列从共同地基真实抬起的连续厚石基", 19.2, 5.5, .52, [0, .2, 0], 0, stone), hardFloor("后半圆居室和连续内廊共同的完整高木地板", timber, outline, .18, [0, .72, 0]));
  for (let cell = 0; cell < 11; cell++) {
    const a = cell * Math.PI / 11, b = (cell + 1) * Math.PI / 11, middle = (a + b) / 2;
    walls.push(arcWall("后围房真实低门两边的完整高内墙", 14.25, .25, .9, 3.48, a, middle - .035, wall), arcWall("后围房真实低门另一边的完整高内墙", 14.25, .25, .9, 3.48, middle + .035, b, wall), arcWall("后围房低门上方实际留净通行口的完整厚墙楣", 14.25, .25, 3.05, 1.33, middle - .035, middle + .035, wall), arcWall("后围房小外窗一边实际贯通到瓦檐的完整外墙", 19, .4, .9, 3.14, a, middle - .027, wall), arcWall("后围房小外窗另一边实际贯通到瓦檐的完整外墙", 19, .4, .9, 3.14, middle + .027, b, wall), arcWall("后围房真实外窗下方完整的厚承重墙", 19, .4, .9, 1.6, middle - .027, middle + .027, wall), arcWall("后围房真实小外窗上方连续的砖墙楣", 19, .4, 3.4, .64, middle - .027, middle + .027, wall));
    if (cell === 5) wood.push(solidBox("后围房正中龙厅内实际落在高木地板上的低祭台", 0, 1.3, 17.9, 1.8, .8, .65, timber));
    else {
      const value = solidBox("后围房各自独立空室内真正落地的低木工作台", 0, 1.12, 16.7, 1.5, .44, .7, timber); value.rotation.y = -middle * 180 / Math.PI + 90; value.position.x = Math.cos(middle) * 16.7; value.position.z = Math.sin(middle) * 16.7; for (const v of value.vertices!) v.z -= 16.7; wood.push(value);
    }
  }
  for (let i = 0; i <= 11; i++) {
    const angle = i * Math.PI / 11, value = hardFloor("后半圆相邻独立房之间真实承住折坡瓦顶的径向隔墙", wall, [[14.2, .9], [18.8, .9], [18.8, 4.04], [16.5, 5.34], [14.2, 4.38]], .14, [-Math.sin(angle) * .07, 0, Math.cos(angle) * .07]); value.rotation = { x: -90, y: 0, z: -angle * 180 / Math.PI }; walls.push(value);
    const x = Math.cos(angle) * 12.9, z = Math.sin(angle) * 12.9; wood.push(meshBeam("从公共石坪穿过围廊楼面而实际承住低檐环枋的通高木柱", [x, .2, z], [x, 3.78, z], .15, timber));
  }
  p.push(halfRoundWall("后半圆内廊木柱头实际连续接起的完整木檐承枋", 13, .2, .18, [0, 3.78, 0], 0, timber), halfRoundWall("后内廊扶手在两端登廊过门处实际断开的连续木横栏", 12.8, .07, .07, [0, 1.78, 0], -.06 * 180 / Math.PI, timber, Math.PI - .12));
  for (let i = 1; i < 22; i++) { const angle = i * Math.PI / 22, x = Math.cos(angle) * 12.77, z = Math.sin(angle) * 12.77; wood.push(meshBeam("后半圆内廊横栏真正落在廊板上的独立竖木栏", [x, .9, z], [x, 1.85, z], .055, timber)); }
  const at = (r: number, y: number, a: number): Triple => [Math.cos(a) * r, y, Math.sin(a) * r];
  for (let i = 0; i < 22; i++) { const a = i * Math.PI / 22, b = (i + 1) * Math.PI / 22; roof.push(slopePanel("半圆后围房完整从外檐升到弧形屋脊的厚瓦坡", [at(19.4, 3.86, a), at(19.4, 3.86, b), at(16.5, 5.5, b), at(16.5, 5.5, a)], .16, tile), slopePanel("半圆后围房从弧脊完整下降并覆盖内廊的厚瓦坡", [at(16.5, 5.5, a), at(16.5, 5.5, b), at(12.5, 3.86, b), at(12.5, 3.86, a)], .16, tile)); }
  p.push(part("祖堂之后高起而在围廊内缘以下收低的完整龟背化胎", "lathe", earth, [0, 0, 11.8], [1, 1, .45], [0, 0, 0], { profile: [{ x: 0, y: .2 }, { x: 3, y: .2 }, { x: 2.4, y: .55 }, { x: 1.4, y: 1.05 }, { x: 0, y: 1.8 }] }), ...packMeshes("递升三堂两侧直横屋与后半圆房列的全部真实砖壁", wall, walls), ...packMeshes("围廊通柱独立木窗格与各生活房实际木台完整保留", timber, wood), ...packMeshes("前后高台及横屋通到后围廊的全部实石踏阶", stone, steps), ...packMeshes("后半圆完整双坡瓦盖真实闭合的全部厚屋片", tile, roof));
  return p;
}
