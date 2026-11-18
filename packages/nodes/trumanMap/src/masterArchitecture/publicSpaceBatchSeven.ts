import { CatmullRomCurve3, Vector3 } from "three";
import { part, ring, type ModelPart, type Triple } from "../assetModelParts";
import { box, cylinder, design, rail, colors } from "./structures";
import { halfRoundWall } from "./spatialShells";
import { polygon } from "../masterNature/shared";
import { doorway } from "./publicSpaceBatchOne";
import { stairFlight } from "./publicSpaceBatchTwo";
import { bankedTrack, paint, roundedOutline, type TrackSample } from "./publicSpaceBatchFive";

const paving = "#b7b19a", dark = "#54686d", wood = "#ae956e", white = "#dcded0";

// https://www.venueguide.fiba.basketball/vanue-design
// https://www.fivb.com/wp-content/uploads/2025/01/FIVB-Volleyball_Rules2025_2028-EN.pdf
export const publicSpaceBatchSevenDesigns = [
  design("环廊碗席篮球比赛馆", "四面分段碗席留出十字通行廊，圆角外壁围住完整篮球比赛地面，两端独立支承篮架面对内场，中央透光顶与外环屋盖共同封合大馆", basketballArena, "建筑", "现代"),
  design("双层挑台排球比赛馆", "十八乘九米排球场两侧布置有真实上行阶梯的悬挑观众台，侧墙斜撑承住挑台，中央高净空屋盖保留球网和发球区", volleyballArena, "建筑", "现代"),
  design("折返赛道卡丁车比赛馆", "完整连续闭环赛道通过折返弯连接高速直段，缓冲矮墙保留维修区入口，两条横接路接向独立维修通道，透明中屋盖展露场内路线", kartArena, "建筑", "现代"),
  design("双环起伏小轮车泵道场", "连续收腰双环路线包含真正升降的泵道波峰和随转向变化的横坡，路体从场坪实体支承到起伏面，外围观众台朝向完整路线", pumpTrack, "建筑", "现代"),
];

function basketballArena(): ModelPart[] {
  const p: ModelPart[] = [polygon("圆角篮球馆整体场坪", paving, roundedOutline(43, 57, 6.5), .4), box("完整木色篮球比赛地面", 0, .41, 0, 22, .02, 34, wood), polygon("外环屋盖围出中央透光顶", dark, roundedOutline(43, 57, 6.5), .25, [0, 11.8, 0], [[[-10, -17], [10, -17], [10, 17], [-10, 17]]]), part("中央完整透光屋面", "box", colors.glass, [0, 12.08, 0], [20.2, .05, 34.2], [0, 0, 0], { opacity: .25 })];
  for (const [x, z, yaw] of [[15, 22, 0], [-15, 22, -90], [-15, -22, -180], [15, -22, -270]]) p.push(halfRoundWall("圆角馆四角封合弧墙", 6.25, .25, 11.4, [x!, .4, z!], yaw!, paving, Math.PI / 2));
  for (const side of [-1, 1]) p.push(doorway("馆前后通向十字廊的主门", [0, .4, side * 28], 30, 11.4, 3.2), doorway("馆侧通向观众廊的侧门", [side * 21, .4, 0], 44, 11.4, 2.4, 90));
  for (let row = 0; row < 3; row++) for (const side of [-1, 1]) for (const end of [-1, 1]) {
    p.push(box("侧看台之间为中央通行廊留空", side * (10.5 + row * 2), .4 + (row + 1) * .45 / 2, end * 9.1, 2, (row + 1) * .45, 15.8, "#9ea492"), box("端看台之间为中央通行廊留空", end * 5, .4 + (row + 1) * .45 / 2, side * (18 + row * 2), 7, (row + 1) * .45, 2, "#9ea492"));
  }
  const lines = [];
  for (const side of [-1, 1]) lines.push({ x: side * 7.5, z: 0, width: .05, depth: 28 }, { x: 0, z: side * 14, width: 15, depth: .05 }, { x: side * 2.45, z: side * 11.1, width: .05, depth: 5.8 }, { x: -side * 2.45, z: side * 11.1, width: .05, depth: 5.8 }, { x: 0, z: side * 8.2, width: 4.9, depth: .05 });
  lines.push({ x: 0, z: 0, width: 15, depth: .05 });
  p.push(paint("完整篮球场边线中线和限制区", white, lines, .425), ring("篮球场中央完整圆线", white, 1.8, .025, .43, .01));
  const cut = Math.sqrt(6.75 ** 2 - 6.6 ** 2), angle = Math.asin(cut / 6.75);
  for (const side of [-1, 1]) {
    const hoopZ = side * 12.425, boardZ = side * 12.8;
    p.push(ring("罚球线前方完整圆线", white, 1.8, .025, .43, .01, { position: { x: 0, y: .43, z: side * 8.2 } }));
    p.push(halfRoundWall("篮架前方完整三分弧", 6.75, .05, .012, [0, .426, hoopZ], -(side > 0 ? 180 + angle * 180 / Math.PI : angle * 180 / Math.PI), white, Math.PI - angle * 2), paint("三分弧接向底线的直段", white, [-1, 1].map(end => ({ x: end * 6.6, z: side * (14 + 12.425 - cut) / 2, width: .05, depth: 14 - (12.425 - cut) })), .425), part("篮球比赛用透明背板", "box", colors.glass, [0, 3.845, boardZ], [1.8, 1.05, .04], [0, 0, 0], { opacity: .35 }), ring("三点零五米高篮圈", "#b27b61", .243, .018, 3.47, .03, { position: { x: 0, y: 3.47, z: hoopZ } }), part("上宽下收且两端贯通的篮网", "lathe", white, [0, 3.455, hoopZ], [1, 1, 1], [0, 0, 0], { profile: [{ x: .21, y: 0 }, { x: .12, y: -.45 }, { x: .11, y: -.45 }, { x: .2, y: 0 }, { x: .21, y: 0 }], opacity: .5 }), box("篮架底线以外的独立落地座", 0, .72, side * 17.4, 2.4, .6, 1.6, dark), rail([0, 1.02, side * 17.4], [0, 3.45, side * 15.6], .2, dark), rail([0, 3.45, side * 15.6], [0, 3.845, boardZ], .18, dark));
  }
  return p;
}

function volleyballArena(): ModelPart[] {
  const p: ModelPart[] = [box("排球馆完整落地楼面", 0, .2, 0, 28, .4, 42, paving), box("完整排球场弹性地面", 0, .41, 0, 18, .02, 30, "#a39376"), doorway("排球馆前方主入口", [0, .4, -20.8], 28, 11, 2.8), doorway("排球馆后方独立出口", [0, .4, 20.8], 28, 11, 2.8), ...[-1, 1].map(side => box("挑台后方完整承重外墙", side * 13.8, 5.9, 0, .3, 11, 41.6, paving)), box("排球馆完整高净空屋盖", 0, 11.55, 0, 28.5, .3, 42.5, dark), part("九点五米长完整排球网面", "box", dark, [0, 2.35, 0], [9.5, 1, .018], [0, 0, 0], { opacity: .65 })];
  for (const side of [-1, 1]) {
    p.push(cylinder("场外独立排球网柱", side * 5.5, 1.675, 0, .09, 2.55, dark), box("观众悬挑台完整楼板", side * 10, 4.2, 4, 4, .25, 26, paving), rail([side * 8, 5.45, -9], [side * 8, 5.45, 17], .06, dark));
    for (const z of [-8, 4, 16]) p.push(rail([side * 13.6, 2.2, z], [side * 8.3, 4.05, z], .22, dark), rail([side * 8, 4.325, z], [side * 8, 5.45, z], .06, dark));
    for (let flight = 0; flight < 3; flight++) p.push(stairFlight("通向高位挑台的连续观众阶梯", side * 10, .4 + flight * (3.925 / 3), -16.2 + flight * 2.4, 2.2, 8, 3.925 / 24, .3));
    p.push(box("挑台墙边连续观赛长座", side * 11.2, 4.7, 4, 1.2, .45, 24.5, wood));
  }
  p.push(paint("完整十八乘九米排球场界线", white, [{ x: -4.5, z: 0, width: .05, depth: 18 }, { x: 4.5, z: 0, width: .05, depth: 18 }, { x: 0, z: -9, width: 9, depth: .05 }, { x: 0, z: 9, width: 9, depth: .05 }, { x: 0, z: 0, width: 9, depth: .05 }, { x: 0, z: -3, width: 9, depth: .05 }, { x: 0, z: 3, width: 9, depth: .05 }], .425), rail([-5.5, 2.85, 0], [5.5, 2.85, 0], .035, white));
  return p;
}

function curveSamples(points: Triple[], width: number, bumpy: boolean): TrackSample[] {
  const curve = new CatmullRomCurve3(points.map(point => new Vector3(...point)), true, "centripetal");
  return Array.from({ length: 129 }, (_, index) => {
    const u = index / 128, point = curve.getPointAt(u), tangent = curve.getTangentAt(u), before = curve.getTangentAt((u - .006 + 1) % 1), after = curve.getTangentAt((u + .006) % 1);
    const turn = before.z * after.x - before.x * after.z, bank = bumpy ? Math.max(-.35, Math.min(.35, -turn * 4)) : 0, half = width * Math.cos(bank) / 2, height = bumpy ? .95 + .25 * (1 - Math.cos(u * Math.PI * 16)) : .28;
    const nx = tangent.z, nz = -tangent.x;
    return { x: point.x - nx * half, z: point.z - nz * half, nx, nz, bank, height: height - width * Math.sin(bank) / 2 };
  });
}

function trackPieces(name: string, color: string, samples: TrackSample[], width: number): ModelPart[] {
  const p: ModelPart[] = [];
  for (let start = 0; start < samples.length - 1; start += 32) p.push({ ...bankedTrack(name, samples.slice(start, start + 33), width, .2), color });
  return p;
}

function kartArena(): ModelPart[] {
  const points: Triple[] = [[-24, 0, -30], [-10, 0, -30], [10, 0, -30], [24, 0, -30], [28, 0, -15], [10, 0, -10], [8, 0, 0], [26, 0, 10], [24, 0, 29], [-24, 0, 29], [-28, 0, 13], [-9, 0, 8], [-8, 0, -6], [-26, 0, -12]];
  const samples = curveSamples(points, 5, false);
  const p: ModelPart[] = [box("完整卡丁车馆整体场坪", 0, .1, 0, 72, .2, 86, paving), ...trackPieces("贯通整个卡丁车馆的连续多弯赛道", dark, samples, 5), polygon("外围实心屋盖围出大幅透明中屋面", dark, [[-36.2, -43.2], [36.2, -43.2], [36.2, 43.2], [-36.2, 43.2]], .25, [0, 7, 0], [[[-27, -30], [27, -30], [27, 30], [-27, 30]]]), part("卡丁车路线正上方完整透明屋面", "box", colors.glass, [0, 7.29, 0], [54.2, .05, 60.2], [0, 0, 0], { opacity: .25 }), doorway("车馆前方公共与检录入口", [0, .2, -43], 72, 6.8, 3), doorway("车馆后方观众出口", [0, .2, 43], 72, 6.8, 3), ...[-1, 1].map(side => doorway("卡丁车维修设备搬运侧门", [side * 36, .2, 0], 86, 6.8, 3.5, 90, 4)), box("与竞速路线分开的完整维修通道", 0, .24, -37, 30, .08, 4, dark)];
  for (const side of [-1, 1]) {
    p.push(box("维修通道与竞速路线横向接路", side * 7.5, .24, -33.5, 3.4, .08, 7, dark));
    const groups: TrackSample[][] = [[]];
    for (const s of samples) {
      const x = s.x + s.nx * 2.5, z = s.z + s.nz * 2.5, cx = x + s.nx * side * 2.75, cz = z + s.nz * side * 2.75;
      if (cz < -31 && Math.abs(Math.abs(cx) - 7.5) < 2.3) { if (groups.at(-1)!.length) groups.push([]); continue; }
      groups.at(-1)!.push({ x: cx - s.nx * .21, z: cz - s.nz * .21, nx: s.nx, nz: s.nz, bank: 0, height: .95 });
    }
    for (const group of groups) if (group.length > 1) p.push(...trackPieces("独立缓冲矮墙在维修入口处收头", "#a39f86", group, .42));
  }
  const checks = [];
  for (let row = 0; row < 2; row++) for (let cell = 0; cell < 10; cell++) if ((row + cell) % 2 === 0) checks.push({ x: -.2 + row * .4, z: -32.25 + cell * .5, width: .4, depth: .5 });
  p.push(paint("主直道起终点完整棋盘线", white, checks, .29));
  for (let row = 0; row < 3; row++) p.push(box("远离赛道的连续观众阶台", 0, .2 + (row + 1) * .4 / 2, 36 + row * 1.7, 50, (row + 1) * .4, 1.7, wood));
  return p;
}

function pumpTrack(): ModelPart[] {
  const points: Triple[] = [[0, 0, -20], [16, 0, -18], [22, 0, -10], [20, 0, -2], [12, 0, 0], [8, 0, 4], [12, 0, 8], [20, 0, 10], [22, 0, 16], [14, 0, 20], [0, 0, 20], [-16, 0, 18], [-22, 0, 10], [-20, 0, 4], [-12, 0, 0], [-8, 0, -4], [-12, 0, -8], [-20, 0, -10], [-22, 0, -16], [-14, 0, -20]];
  const p: ModelPart[] = [box("小轮车场完整地基", 0, .1, 0, 58, .2, 52, "#a1aa8a"), ...trackPieces("兼有真实波峰与横向倾斜的泵道", dark, curveSamples(points, 2.4, true), 2.4)];
  for (const side of [-1, 1]) for (let row = 0; row < 3; row++) p.push(box("路线外侧独立观众阶台", side * (24.5 + row * 1.2), .2 + (row + 1) * .4 / 2, 0, 1.2, (row + 1) * .4, 20, paving));
  p.push(box("小轮车检录与装备整理平台", 0, .4, -23, 10, .4, 3, wood));
  return p;
}
