import { part, type ModelPart, type Triple } from "../assetModelParts";
import { base, box, cylinder, design, type ArchitecturePrototype } from "./structures";
import { barrelRoof, halfDomeRoof, halfRoundWall } from "./spatialShells";
import { polygon } from "../masterNature/shared";
import { combineMeshes } from "../natureParts";
import { door, turn, stairFlight, tower, dome } from "./historicSpaceBatchSeven";
import { verticalPanel, windowHole } from "./historicSpaceBatchNine";
import { groupedColumns, pitched } from "./historicSpaceBatchTen";

const stone = "#b7b099", brick = "#b39170", wood = "#aa8858", tile = "#8f6150", plaster = "#c5bda5", soil = "#899575";

// 原创空间保留寺庙的内外结构差异，不作某一现场的精确测绘复原。
// https://whc.unesco.org/document/166328
// https://www.finearts.go.th/archae/view/54674
// https://www.heritage.go.kr/heri/cul/culGuidePostDetail.do?ccbaCpno=1113700240000
export const historicSpaceBatchElevenDesigns: ArchitecturePrototype[] = [
  design("方核双回廊四门砖殿", "四面深龛中央实核支起层台砖顶，内外两圈真实环行廊由四轴门道连接，四座前伸山墙门厅同外院贯通，回廊内设完整薄券顶", doubleAmbulatoryTemple, "建筑", "异域"),
  design("折檐长脊内外柱廊戒堂", "抬高的长条戒堂两边各有内外柱列，折檐长脊木屋盖落到不同高度的承柱和厚壁，前后山墙门廊与双面登台阶接通主殿", thaiOrdinationHall, "建筑", "异域"),
  design("方前室长颈圆龛覆丘圣所", "露天方前室经低石颈廊进入圆龛高穹室，圆壁与薄壳圆顶外覆连续厚土层，入口在石壁和土体上真实开孔，地面和低石坛连续可见", moundGrottoSanctuary, "建筑", "异域"),
];

function corridorRoofs(inner: boolean): ModelPart[] {
  const center = inner ? 8.4 : 15, radius = inner ? 2.4 : 3.75, spring = inner ? 5 : 3.7, long = inner ? 22 : 38, short = inner ? 12 : 22, p: ModelPart[] = [];
  for (const s of [-1, 1]) p.push(barrelRoof("环行廊两边由两重厚壁实际承托的完整石筒券", radius, .25, short, [s * center, spring, 0], brick), ...turn([barrelRoof("环行廊前后连续覆盖转角通路的完整石筒券", radius, .25, long, [0, spring, 0], brick)], 90, [0, 0, s * center]));
  return p;
}
function brickPorch(): ModelPart[] {
  return [...[-1, 1].map(s => box("四向门厅真正厚侧壁", s * 5, 3.42, 0, .6, 6, 8, brick)), ...door("四向前伸门厅真正出入门", 10, 6, .6, 3.2, [0, .42, 4], 4.8, brick), pitched("四向门厅完整山墙双坡木石屋盖", 11, 2.2, 8.8, [0, 6.62, 0], brick), part("前伸门厅与屋盖实际封合的三角石山花", "extrude", brick, [0, 6.62, 4], [1, 1, 1], [0, 0, 0], { depth: .5, profile: [{ x: -5.5, y: -.2 }, { x: 5.5, y: -.2 }, { x: 0, y: 2 }] }), ...[-1, 1].map(s => box("门厅侧壁与斜屋盖之间实际承顶木石枋", s * 5, 6.52, 0, .5, .3, 8, brick))];
}
function doubleAmbulatoryTemple(): ModelPart[] {
  const core: [number, number][] = [[-6, -6], [-1.5, -6], [-1.5, -4], [1.5, -4], [1.5, -6], [6, -6], [6, -1.5], [4, -1.5], [4, 1.5], [6, 1.5], [6, 6], [1.5, 6], [1.5, 4], [-1.5, 4], [-1.5, 6], [-6, 6], [-6, 1.5], [-4, 1.5], [-4, -1.5], [-6, -1.5]], p: ModelPart[] = [base(62, 62), box("方核双回廊四向门厅完整共用石地面", 0, .3, 0, 56, .24, 56), polygon("中央实心承重方核在四面真正凿开的深龛", brick, core, 6, [0, .42, 0]), box("四面龛上方继续承住高砖台的中央实核", 0, 10.42, 0, 12, 8, 12, brick), polygon("环行廊上方以两重厚壁接承的完整砖覆板", brick, [[-19, -19], [19, -19], [19, 19], [-19, 19]], 2, [0, 7.42, 0], [[[-6, -6], [-6, 6], [6, 6], [6, -6]]]), ...corridorRoofs(true), ...corridorRoofs(false)];
  for (let side = 0; side < 4; side++) {
    p.push(...turn([verticalPanel("内回廊与外回廊之间真正轴向贯通的厚砖门壁", [[-11, 0], [11, 0], [11, 7], [-11, 7]], [windowHole(0, .035, 3.2, 5.5)], .6, [0, .42, 11], 0, brick), verticalPanel("外回廊真实轴门和采光窗组成的外厚砖壁", [[-19, 0], [19, 0], [19, 7], [-19, 7]], [windowHole(0, .035, 4, 5.7), windowHole(-12, 2, 2.4, 3.4), windowHole(12, 2, 2.4, 3.4)], .6, [0, .42, 19], 0, brick), ...brickPorch().map(value => { value.position.z += 23; return value; })], side * 90, [0, 0, 0]));
  }
  p.push(tower("中央实核与四面厚壁共同接承的层台高砖顶", [[-1, -1], [1, -1], [1, 1], [-1, 1]], [[19.5, 0], [17.5, .8], [17.5, 2], [15, 2.6], [15, 3.8], [12, 4.5], [12, 5.8], [8.5, 6.6], [8.5, 8], [5, 9], [5, 11], [.1, 15]], [0, 9.42, 0], brick));
  return p;
}

function thaiPorch(): ModelPart[] {
  return [...[-1, 1].map(s => box("戒堂前后山墙门厅完整侧壁", s * 4, 4.73, 0, .5, 6.1, 8, plaster)), ...door("戒堂山墙门厅真正的外门", 8, 6.1, .5, 3, [0, 1.68, 4], 4.8, plaster), pitched("戒堂前后门厅独立下降的双坡木檐", 10, 3, 8.5, [0, 7.38, 0], tile), part("门厅两墙真正承住的彩木三角山花", "extrude", wood, [0, 7.38, 4], [1, 1, 1], [0, 0, 0], { depth: .4, profile: [{ x: -5, y: -.2 }, { x: 5, y: -.2 }, { x: 0, y: 2.8 }] })];
}
function thaiOrdinationHall(): ModelPart[] {
  const p: ModelPart[] = [base(32, 64), box("戒堂与内外柱廊统一抬高的完整石台", 0, .93, 0, 24, 1.5, 50), part("陡脊转折檐并连到低外柱廊的完整木瓦长屋盖", "extrude", tile, [0, 6.68, 0], [1, 1, 1], [0, 0, 0], { depth: 42, profile: [{ x: -10, y: 0 }, { x: -7, y: 1.2 }, { x: 0, y: 4.6 }, { x: 7, y: 1.2 }, { x: 10, y: 0 }, { x: 10, y: -.2 }, { x: 7, y: 1 }, { x: 0, y: 4.4 }, { x: -7, y: 1 }, { x: -10, y: -.2 }] }), stairFlight("戒堂正前方连接石台与外地面的宽阶", 6, 5, 1.5, .5, 0, [0, .18, -28], -90), stairFlight("戒堂后端连接石台与外地面的宽阶", 6, 5, 1.5, .5, 0, [0, .18, 28], 90)];
  for (const s of [-1, 1]) {
    const windows: [number, number][][] = [-12, -6, 0, 6, 12].map(x => [[x - 1, 1.8], [x + 1, 1.8], [x + 1, 5], [x - 1, 5]]);
    p.push(verticalPanel("戒堂长边真正开窗的厚灰石墙", [[-17, 0], [17, 0], [17, 6], [-17, 6]], windows, .5, [s * 7, 1.68, 0], 90, plaster), ...door("主戒堂前后连接门厅的真正大门", 14, 6, .5, 3, [0, 1.68, s * 17], 4.8, plaster), part("主戒堂高墙上与陡屋脊接平的完整三角木山花", "extrude", wood, [0, 7.68, s * 17], [1, 1, 1], [0, 0, 0], { depth: .4, profile: [{ x: -7, y: 0 }, { x: 7, y: 0 }, { x: 0, y: 3.6 }] }), ...groupedColumns("主戒堂内侧实际接承长枋的大木柱", [-15, -10, -5, 0, 5, 10, 15].map(z => [s * 4.5, z, 1.68, 6.85]), wood), box("内柱宽帽上实际承接斜屋面而不穿瓦的纵木枋", s * 4.5, 8.72, 0, .3, .4, 34, wood), ...groupedColumns("戒堂外侧真正托住低折檐的周廊木柱", [-20, -15, -10, -5, 0, 5, 10, 15, 20].map(z => [s * 9.5, z, 1.68, 5]), wood), ...turn(thaiPorch(), s < 0 ? 180 : 0, [0, 0, s * 21]));
  }
  const markers: ModelPart[] = [];
  for (const [x, z] of [[-6, -28], [6, -28], [-13, -12], [13, -12], [-13, 12], [13, 12], [-6, 28], [6, 28]]) markers.push(verticalPanel("戒堂界域真正立在外台地的叶形石标", [[-.35, 0], [.35, 0], [.35, .8], [.23, 1.2], [0, 1.45], [-.23, 1.2], [-.35, .8]], [], .3, [x!, .18, z!], 0));
  p.push(combineMeshes("八个围定戒堂范围且让出前后入口的石标", stone, markers));
  return p;
}

function moundGrottoSanctuary(): ModelPart[] {
  const foot: [number, number][] = [];
  for (let i = 0; i <= 32; i++) { const a = (-70 + i * 10) * Math.PI / 180; foot.push([Math.cos(a) * 9, Math.sin(a) * 9]); }
  for (let i = 32; i >= 0; i--) { const a = (-70 + i * 10) * Math.PI / 180; foot.push([Math.cos(a) * 7, Math.sin(a) * 7]); }
  const p: ModelPart[] = [
    base(36, 48),
    box("露天方前室完整石铺地面", 0, .3, -6, 12, .24, 12),
    box("长石颈廊与圆室接平的完整地面", 0, .3, 3.25, 4, .24, 6.5),
    cylinder("圆龛主室真正完整承地的圆石地面", 0, .3, 12, 12, .24, stone),
    ...door("方前室正面真实入口", 12, 4, .6, 3, [0, .42, -12], 3.2),
    ...door("方前室进入长颈廊的真实门", 12, 4, .6, 3, [0, .42, 0], 3.5),
    ...[-1, 1].map(s => box("露天方前室完整厚石侧壁", s * 6, 2.42, -6, .6, 4, 12)),
    ...[-1, 1].map(s => box("低石颈廊真正承平顶的长石侧壁", s * 1.8, 2.17, 3.25, .6, 3.5, 6.5)),
    box("长颈廊与圆室门头接平的完整薄石顶", 0, 4.12, 3.25, 4.2, .4, 6.5),
    halfRoundWall("圆龛主室保留前入口的完整厚石弧壁", 6, .8, 5, [0, .42, 12], 75, stone, 330 * Math.PI / 180),
    halfRoundWall("圆室入口以上与平石颈顶接合的完整石弧门头", 6, .8, 1.5, [0, 3.92, 12], -255, stone, 30 * Math.PI / 180),
    ...dome("圆龛主室独立完整的薄壳石穹顶", 6, [0, 5.42, 12], stone),
    halfRoundWall("主圆壁外侧真正接触石体的厚土覆层", 7, 1, 5, [0, .42, 12], 70, soil, 320 * Math.PI / 180),
    halfRoundWall("土丘前口与石门头同高闭合的厚土顶缘", 7, 1, 1.5, [0, 3.92, 12], -250, soil, 40 * Math.PI / 180),
    halfDomeRoof("覆在石穹顶外且与其相接的前半厚土丘", 7, 1, [0, 5.42, 12], 0, soil),
    halfDomeRoof("覆在石穹顶外且与其相接的后半厚土丘", 7, 1, [0, 5.42, 12], 180, soil),
    polygon("真正让出长颈入口的连续开口土坡脚", soil, foot, .4, [0, .18, 12]),
    cylinder("圆龛主室内独立低位莲座石坛", 0, .92, 12, 3.2, 1, stone),
    stairFlight("方前室门外与石铺地坪接平的一层宽阶", 1, 4, .24, .9, 0, [0, .18, -12.9], -90),
  ];
  return p;
}
