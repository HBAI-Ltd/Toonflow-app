import type { ModelPart } from "../assetModelParts";
import { slab } from "./modernCommercialSpaceBatchOne";
import { glazedWall } from "./modernResidenceSpaceBatchOne";
import { doorway } from "./publicSpaceBatchOne";
import { stairFlight } from "./publicSpaceBatchTwo";
import { box, design, rail } from "./structures";

const stone = "#b5b9ae", steel = "#668582", timber = "#a18b6b", paving = "#aaa997";
type Point = [number, number];

export const modernResidenceSpaceBatchTwoDesigns = [design(
  "三角悬院折脚住宅",
  "连续三角楼面和透光内壁围住贯通屋顶的三角光院，三个分叉斜脚与周边箱梁承起完整居住层，入口内梯穿过真实楼板孔接到环院起居廊，前方悬台与独立睡室及开敞卧角连成整宅",
  () => triangularCourtResidence(), "建筑", "现代",
)];

function triangularCourtResidence(): ModelPart[] {
  const outer: Point[] = [[-14, -10], [14, -10], [0, 16]], inner: Point[] = [[-4, -4], [4, -4], [0, 4]], stairHole: Point[] = [[-8.5, -8.1], [-6.5, -8.1], [-6.5, -2.86], [-8.5, -2.86]];
  const p: ModelPart[] = [
    box("三角住宅下方连续可步行的低地坪", 0, .1, 1, 33, .2, 33, paving),
    slab("中央光院与楼梯井真正贯穿的三角完整居住楼面", timber, outer, .22, [0, 3.18, 0], [inner, stairHole]),
    slab("保留三角通天采光口的完整平屋盖", steel, [[-14.3, -10.2], [14.3, -10.2], [0, 16.5]], .22, [0, 6.6, 0], [inner]),
    box("前门外完整伸出主体的悬挑小露台", 0, 3.29, -10.75, 5, .22, 1.5, timber),
    stairFlight("入口首段沿中空梯井上行的真实八级内梯", -7.5, .2, -8, 1.6, 8, .2, .32),
    stairFlight("入口次段从首段顶面继续进入居住层的真实内梯", -7.5, 1.8, -5.44, 1.6, 8, .2, .32),
    box("内梯高端跨过楼板孔边并支住扶手的实落脚板", -7.5, 3.29, -2.75, 2.1, .22, .3, timber),
    doorway("架空底层独立入口的实际门洞", [-7.5, .2, -9], 4, 3.2, 1.2, 0, 2.3),
    box("入口内梯井西侧直达楼板底的承壁", -9.5, 1.69, -5.8, .2, 2.98, 6.4, stone),
    box("入口内梯井东侧直达楼板底的承壁", -5.5, 1.69, -5.8, .2, 2.98, 6.4, stone),
    box("入口内梯井后端与上层楼面齐平的收头承壁", -7.5, 1.8, -2.6, 4, 3.2, .2, stone),
    box("露台外边连续接在台面的低护壁", 0, 3.9, -11.45, 5, 1, .1, steel),
    ...[-1, 1].map(side => box("露台两侧与正面外墙接合的低护壁", side * 2.45, 3.9, -10.75, .1, 1, 1.5, steel)),
  ];
  for (let i = 0; i < 3; i++) {
    const a = outer[i]!, b = outer[(i + 1) % 3]!, c = outer[(i + 2) % 3]!, foot: Point = [a[0] * .68, a[1] * .68];
    p.push(box("分叉折脚下方与地坪相接的独立承台", foot[0], .4, foot[1], 1.2, .4, 1.2, stone), rail([foot[0], .5, foot[1]], [a[0] * .82 + b[0] * .18, 2.98, a[1] * .82 + b[1] * .18], .42, steel), rail([foot[0], .5, foot[1]], [a[0] * .82 + c[0] * .18, 2.98, a[1] * .82 + c[1] * .18], .42, steel), rail([a[0], 2.98, a[1]], [b[0], 2.98, b[1]], .4, steel));
    const n = inner[i]!, next = inner[(i + 1) % 3]!;
    if (i === 0) p.push(rail([a[0], 2.98, a[1]], [-9.5, 2.98, -1.65], .4, steel), rail([-9.5, 2.98, -1.65], [n[0], 2.98, n[1]], .4, steel));
    else p.push(rail([a[0], 2.98, a[1]], [n[0], 2.98, n[1]], .4, steel));
    p.push(rail([n[0], 2.98, n[1]], [next[0], 2.98, next[1]], .4, steel));
  }
  for (const x of [-2, 2]) p.push(rail([x, 2.98, -9.7], [x, 2.98, -11.5], .4, steel));
  p.push(
    ...glazedWall("三角住宅前端实际带双窗和露台门的厚立面", outer[0]!, outer[1]!, 3.4, 6.6, [[-7, 4.3, 4.5, 1.5], [7, 4.3, 4.5, 1.5]], [[0, 3.4, 1.8, 2.4]]),
    ...glazedWall("三角住宅右斜边与环院廊连续相接的带窗壁", outer[1]!, outer[2]!, 3.4, 6.6, [[-7, 4.3, 5, 1.5], [5, 4.3, 5, 1.5]]),
    ...glazedWall("三角住宅左斜边与环院廊连续相接的带窗壁", outer[2]!, outer[0]!, 3.4, 6.6, [[-5, 4.3, 5, 1.5], [7, 4.3, 5, 1.5]]),
    ...glazedWall("开敞卧角通向中央起居厅的西侧实分隔", [-5, -10], [-5, -4], 3.4, 6.6, [], [[0, 3.4, 1.3, 2.3]]),
    ...glazedWall("独立睡室通向中央起居厅的东侧实分隔", [5, -10], [5, -4], 3.4, 6.6, [], [[0, 3.4, 1.3, 2.3]]),
    ...glazedWall("东睡室背面沿光院走廊真正闭合的采光隔墙", [5, -4], [10.769230769, -4], 3.4, 6.6, [[0, 4.3, 3.2, 1.5]]),
  );
  for (let i = 0; i < 3; i++) {
    const a = inner[i]!, b = inner[(i + 1) % 3]!, length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    p.push(...glazedWall("环院起居廊与通天光井之间完整透光围护", a, b, 3.4, 6.6, [[0, 3.65, length * .74, 2.6]]));
  }
  for (const side of [-1, 1]) {
    const x = side < 0 ? -10.2 : 8.5;
    p.push(box("避开楼梯井并实际落在木楼面的宽床座", x, 3.62, -6.5, 2.1, .44, 2.5, timber), box("床座上贴合的独立织物软垫", x, 3.9, -6.5, 2.05, .12, 2.45, "#cdc6b3"));
    p.push(rail([-7.5 + side * .9, 1.1, -8], [-7.5 + side * .9, 4.3, -2.88], .05, steel));
    for (const [y, z] of [[.65, -8], [3.85, -2.88]]) p.push(box("内梯扶手实际接回踏面和高平台的立柱", -7.5 + side * .9, y!, z!, .05, .9, .05, steel));
  }
  p.push(box("中央起居厅面向悬台的低坐台", 0, 3.65, -7.3, 3.4, .5, .8, timber), box("低坐台上沿实际连接的软靠背", 0, 4.1, -6.95, 3.4, .9, .15, "#8faba0"));
  return p;
}
