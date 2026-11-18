import { beam, type ModelPart } from "../assetModelParts";
import { base, box, design, type ArchitecturePrototype } from "./structures";
import { stairFlight } from "./historicSpaceBatchSeven";
import { tiledRoof, openingWall, holesAt, postSet } from "./periodPublicSpaceBatchOne";
import { boxesMesh, type SolidBox } from "./publicSpaceBatchEight";

const stone = "#aaa997", brick = "#b18b76", wood = "#896d50", iron = "#65706f";

export const periodPublicSpaceBatchNineDesigns: ArchitecturePrototype[] = [
  design("侧票厅双站台跨线老车站", "地面票厅与双侧长站台同高，中央两条完整铁路线从有盖跨线桥下贯通，站棚在登桥阶区实际断开，外部宽阶、三路候车门与桥面扶栏开口连接完整乘车动线", periodRailStation, "建筑", "中式"),
];

function periodRailStation(): ModelPart[] {
  const p: ModelPart[] = [base(60, 90), box("站前场、站房、铁路和双侧站台共同的完整石铺基层", 0, .3, 0, 58, .24, 88, stone), box("票厅独立抬高且与站台面同高的完整地台", -16.3, .735, -15, 14, .63, 24, stone), openingWall("站房临街一侧真正贯通的公共入口与宽采光窗", 24, 4.6, [...holesAt([0], 3.2, 2.9), ...holesAt([-8, 8], 3, 2, 1.2)], [-23.3, 1.05, -15], 90, brick), openingWall("站房面对站台真正开通的三路候车门与檐下高窗", 24, 4.6, [...holesAt([-8, 0, 8], 2.4, 2.8), ...holesAt([-4, 4], 2, .6, 3.85)], [-9.3, 1.05, -15], 90, brick), tiledRoof("地面票厅由完整高墙接承的灰瓦长屋盖", 14, 24, 5.65, [-16.3, -15]), stairFlight("站前场真正升到票厅公共门槛的宽石阶", 3, 4, .63, .7, 0, [-25.4, .42, -15], 0), box("票厅入口两侧真正让出横向候车主通路的独立售票柜", -18.5, 1.65, -19, .8, 1.2, 4, wood), box("票厅入口另一侧真正让开主通路的独立售票柜", -18.5, 1.65, -11, .8, 1.2, 4, wood), box("票厅站台侧避开三道候车门的固定长坐台", -12, 1.3, -19, .8, .5, 4, wood), postSet("长票厅内部由抬高石台真正接到封闭屋盖的承重木柱", [[-16.3, -25], [-16.3, -19], [-16.3, -11], [-16.3, -5]], 4.6, 1.05), box("跨线人行桥由平台柱列真正接承的完整钢木桥面", 0, 6.425, 0, 16, .25, 3, iron), tiledRoof("跨线桥上方沿长轴延伸的完整窄跨灰瓦雨盖", 16, 3, 9.45, [0, 0]), { ...postSet("跨线桥两端真正由站台接到桥顶且避开上阶口的整高钢柱", [[-8, -1.2], [-8, 1.2], [8, -1.2], [8, 1.2]], 8.4, 1.05), color: iron }, box("跨线桥背侧完整防护两线铁路上方的钢扶栏", 0, 7.05, -1.5, 16, 1, .1, iron)];
  for (const z of [-27, -3]) p.push(openingWall("票厅两端真正透光的完整端部砖墙", 14, 4.6, holesAt([-4, 4], 2, 1.8, 1.3), [-16.3, 1.05, z], 0, brick));
  const sleepers: SolidBox[] = [], stairPosts: SolidBox[] = [], canopyColumns: [number, number][] = [];
  for (const s of [-1, 1]) {
    const track = s * 2, platform = s * 6.5;
    p.push(box("两条铁路各自独立且高于基层的连续碎石道床", track, .48, 0, 3.4, .12, 80, "#8a8b7c"), box("两条铁路线外侧各自完整落地的长站台", platform, .735, 0, 5.6, .63, 68, stone), box("站台沿列车侧真正连续的浅色警示边线", s * 3.9, 1.06, 0, .18, .02, 64, "#d3c5a2"), tiledRoof("站台前段真正避开跨线桥和长阶的独立灰瓦站棚", 5.6, 28, 5.7, [platform, -17]), tiledRoof("站台后段从登桥阶底以外重新开始的独立灰瓦站棚", 5.6, 18, 5.7, [platform, 22]), stairFlight("两侧站台各自真正接到跨线桥扶栏缺口的长木阶", 32, 1.8, 5.5, .3, 0, [platform, 1.05, 11.1], 90, true), box("跨线桥两端完整闭合临空侧边的钢护栏", s * 8, 7.05, 0, .1, 1, 3, iron));
    for (const z of [-29, -19, -11, -3, 14, 22, 30]) for (const offset of [-2, 2]) canopyColumns.push([platform + offset, z]);
    for (const rail of [-1, 1]) {
      const x = track + rail * .7525;
      p.push(box("连续铁轨真正承接枕木的加宽钢轨底座", x, .6625, 0, .14, .025, 80, iron), box("连接钢轨底座与轨头的真实窄腹板", x, .715, 0, .03, .1, 80, iron), box("两轨内侧保持一点四三五米间距的真实连续轨头", x, .7575, 0, .07, .025, 80, iron));
    }
    for (let i = -59; i <= 59; i++) sleepers.push({ center: [track, .595, i * .65], size: [2.5, .11, .22] });
    for (const x of [platform - .9, platform + .9]) {
      p.push(beam("站台登桥阶两侧真正随踏步升高的连续钢扶手", iron, [x, 2.05, 11.1], [x, 7.55, 1.5], .07));
      for (const t of [0, .5, 1]) stairPosts.push({ center: [x, 1.55 + 5.5 * t, 11.1 - 9.6 * t], size: [.08, 1, .08] });
    }
  }
  p.push({ ...postSet("两边分段站棚真正落到站台且让开候车门的双排钢柱", canopyColumns, 4.65, 1.05), color: iron });
  for (const z of [-1.2, 1.2]) p.push(box("跨线桥下方真正连到两侧平台承柱的长钢主梁", 0, 6, z, 16, .6, .25, iron));
  for (const [a, b] of [[-8, -7.4], [-5.6, 5.6], [7.4, 8]]) p.push(box("跨线桥前扶栏真正让出两座登阶到达的宽入口", (a! + b!) / 2, 7.05, 1.5, b! - a!, 1, .1, iron));
  for (let start = 0; start < sleepers.length; start += 20) p.push(boxesMesh("两条标准轨铁路线下实际逐根分开的短木枕", wood, sleepers.slice(start, start + 20)));
  p.push(boxesMesh("站台两侧登桥阶扶手下真正接到踏面的完整立杆", iron, stairPosts));
  return p;
}
