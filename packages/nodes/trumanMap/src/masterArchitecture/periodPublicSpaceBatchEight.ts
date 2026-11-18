import { beam, type ModelPart } from "../assetModelParts";
import { base, box, design, type ArchitecturePrototype } from "./structures";
import { polygon } from "../masterNature/shared";
import { stairFlight } from "./historicSpaceBatchSeven";
import { halfRoundWall } from "./spatialShells";
import { openingWall, holesAt, postSet } from "./periodPublicSpaceBatchOne";
import { boxesMesh, type SolidBox } from "./publicSpaceBatchEight";

const stone = "#bbb8a8", plaster = "#c6beaa", wood = "#8b7258", iron = "#65706f";

export const periodPublicSpaceBatchEightDesigns: ArchitecturePrototype[] = [
  design("马蹄挑廊高台塔剧院", "前厅双长阶接到围绕观众厅的马蹄形上层挑廊，三块分列阶席由独立浅级走道分开，镜框舞台抬高后接独立高台塔，塔内悬承检修廊与有真孔的登梯口服务高位吊景杆", flyTowerTheatre, "建筑", "欧式"),
];

function flyTowerTheatre(): ModelPart[] {
  const p: ModelPart[] = [base(46, 66), box("入口前厅、观众厅和独立高舞台塔共同的石铺地坪", 0, .3, 0, 44, .24, 64, stone), openingWall("剧院前厅对公众真正贯通的正门和两侧窗", 36, 8.8, [...holesAt([0], 4, 3.6), ...holesAt([-12, 12], 2.4, 2, 1.3), ...holesAt([-12, 0, 12], 2.4, 1.8, 6.5)], [0, .42, -28]), openingWall("前厅与观众厅之间分开地面双门和上层正门的厚壁", 36, 11, [...holesAt([-6, 6], 2.2, 3), ...holesAt([0], 2.4, 2.8, 5.435)], [0, .42, -18]), box("入口前厅真正由外围高墙接承的平屋盖", 0, 9.37, -23, 36.6, .3, 10.6, plaster), box("观众高厅真正由整高柱列和外围墙接承的平屋盖", 0, 11.57, -4, 36.6, .3, 28.6, plaster), polygon("入口前厅上层真正让出两条室内长阶孔的完整木楼面", wood, [[-18, -28], [18, -28], [18, -18], [-18, -18]], .25, [0, 5.57, 0], [[[-12.85, -27], [-11.15, -27], [-11.15, -19.5], [-12.85, -19.5]], [[11.15, -27], [12.85, -27], [12.85, -19.5], [11.15, -19.5]]]), box("前厅上层正门与弧形后廊之间真正跨接的短木楼面", 0, 5.695, -17.5, 6, .25, 1, wood), box("高舞台塔内部完整抬高的真实舞台石木地台", 0, .92, 17, 26, 1, 14, stone), openingWall("高舞台塔正面真正开通镜框台口的完整高墙", 26, 18, holesAt([0], 16, 8, 1), [0, .42, 10]), openingWall("高舞台塔后方实际接通装景后场的宽门", 26, 18, holesAt([0], 5, 4, 1.035), [0, .42, 24]), box("独立高舞台塔由四壁真正接承的完整平屋盖", 0, 18.57, 17, 26.6, .3, 14.6, plaster), stairFlight("观众厅前方真正接到抬高镜框舞台面的宽木阶", 5, 4, 1, .3, 0, [0, .42, 8.5], -90), stairFlight("剧院装景后门真正降到地面服务场的宽石阶", 5, 4, 1, .4, 0, [0, .42, 26], 90)];
  const stairPosts: SolidBox[] = [];
  for (const s of [-1, 1]) p.push(openingWall("主观众厅前端两翼与窄高台塔之间真正闭合且保留侧门的完整厚壁", 5, 11, holesAt([0], 1.4, 2.8), [s * 15.5, .42, 10]));
  for (const s of [-1, 1]) {
    p.push(openingWall("前厅两端上下真正透光的完整侧窗墙", 10, 8.8, [1.3, 6.5].flatMap(y => holesAt([-2.5, 2.5], 1.8, 1.8, y)), [s * 18, .42, -23], 90), stairFlight("前厅两侧真正穿过长阶孔升到上层楼面的室内木阶", 30, 1.5, 5.4, .25, 0, [s * 12, .42, -27], -90, true), openingWall("观众厅两侧真实疏散门与高位窗带所在的完整外墙", 28, 11, [...holesAt([-8, 8], 1.8, 3), ...holesAt([-9, 0, 9], 2.8, 2, 6.5)], [s * 18, .42, -4], 90), openingWall("高舞台塔两侧真正对齐抬高台面的工作门", 14, 18, holesAt([-1], 1.8, 3, 1.035), [s * 13, .42, 17], 90), stairFlight("台塔两侧真正从地面升到后台工作门的短石阶", 5, 1.6, 1, .6, 0, [s * 16, .42, 18], s < 0 ? 0 : 180), box("马蹄上廊向舞台方向延伸的直臂内缘完整木栏", s * 14, 6.32, 4, .1, 1, 8, wood), box("马蹄上廊朝舞台一端真正封住临空边的木护栏", s * 16, 6.32, 8, 4, 1, .1, wood), box("后廊正门短接楼面两边的真实木护栏", s * 3, 6.32, -17.5, .1, 1, 1, wood));
    for (const x of [s * 12 - .85, s * 12 + .85]) p.push(box("前厅上层真实长阶孔两侧的连续木护栏", x, 6.32, -23.25, .08, 1, 7.5, wood));
    p.push(box("前厅上层长阶孔低端完整防护的短木栏", s * 12, 6.32, -27, 1.7, 1, .08, wood));
    for (const x of [s * 12 - .75, s * 12 + .75]) {
      p.push(beam("前厅室内长阶两侧真正随踏步升高的斜木扶手", wood, [x, 1.42, -27], [x, 6.82, -19.5], .07));
      for (const t of [0, .5, 1]) stairPosts.push({ center: [x, .92 + 5.4 * t, -27 + 7.5 * t], size: [.08, 1, .08] });
    }
  }
  const balcony: [number, number][] = [[18, 8], [18, 0]];
  for (let i = 1; i <= 12; i++) { const a = i * Math.PI / 12; balcony.push([Math.cos(a) * 18, -Math.sin(a) * 18]); }
  balcony.push([-18, 8], [-14, 8], [-14, 0]);
  for (let i = 1; i <= 12; i++) { const a = Math.PI - i * Math.PI / 12; balcony.push([Math.cos(a) * 14, -Math.sin(a) * 14]); }
  balcony.push([14, 8]);
  p.push(polygon("观众高厅内真正围成马蹄形且向舞台敞开的木挑廊", wood, balcony, .25, [0, 5.57, 0]), halfRoundWall("马蹄上廊面对通高观众厅的连续内弧木护栏", 14.1, .1, 1, [0, 5.82, 0], 180, wood), halfRoundWall("马蹄上廊外弧左半段真正让开正门接廊口的木护栏", 17.8, .15, 1, [0, 5.82, 0], 180, wood, Math.PI / 2 - Math.PI * 8 / 180), halfRoundWall("马蹄上廊外弧右半段真正让开正门接廊口的木护栏", 17.8, .15, 1, [0, 5.82, 0], 82, wood, Math.PI / 2 - Math.PI * 8 / 180));
  const columns: [number, number][] = [];
  for (const degrees of [0, 30, 60, 80, 100, 120, 150, 180]) { const a = degrees * Math.PI / 180; columns.push([Math.cos(a) * 16, -Math.sin(a) * 16]); }
  for (const s of [-1, 1]) for (const z of [4, 8]) columns.push([s * 16, z]);
  p.push(postSet("马蹄上廊底部真正落地且穿廊接到高屋盖的完整柱列", columns, 11));
  for (const z of [-15, -7, 1, 8]) p.push(box("高观众厅屋盖下真正连接外围墙的厚承重横梁", 0, 11.045, z, 36, .75, .35, iron));
  const benches: SolidBox[] = [], tread = 19 / 14;
  for (const x of [-10, 0, 10]) {
    p.push(stairFlight("三个观众阶席分块中连续抬高的完整承座地坪", 14, 7, 2.8, tread, 0, [x, .42, 7], 90));
    for (let i = 0; i < 14; i++) {
      const floor = .42 + (i + 1) * .2, z = 7 - (i + .5) * tread;
      benches.push({ center: [x, floor + .225, z], size: [6.6, .45, .6] }, { center: [x, floor + .65, z - .33], size: [6.6, .65, .08] });
    }
  }
  for (const x of [-5, 5]) p.push(stairFlight("观众席分块之间真正连通各排的独立浅级走道", 28, 1.5, 2.8, tread / 2, 0, [x, .42, 7], 90));
  for (let start = 0; start < benches.length; start += 20) p.push(boxesMesh("观众各排真实承座长木坐台与后靠板", wood, benches.slice(start, start + 20)));
  for (const x of [-5, 5]) {
    p.push(stairFlight("前厅地面真正升到后排最高席与浅级走道的接入木阶", 14, 1.5, 2.8, .35, 0, [x, .42, -16.9], -90, true));
    for (const side of [-1, 1]) {
      p.push(beam("观众后排接入阶两侧由真实立杆接承的斜木扶手", wood, [x + side * .75, 1.42, -16.9], [x + side * .75, 4.22, -12], .07));
      for (const t of [0, .5, 1]) stairPosts.push({ center: [x + side * .75, .92 + 2.8 * t, -16.9 + 4.9 * t], size: [.08, 1, .08] });
    }
  }
  p.push(polygon("高舞台塔后方真正留出登梯洞口的悬承检修廊", iron, [[-13, 21], [13, 21], [13, 24], [-13, 24]], .25, [0, 13.17, 0], [[[11.3, 21.1], [12.5, 21.1], [12.5, 21.9], [11.3, 21.9]]]), box("后台高检修廊前缘真正防护临空边的完整钢栏", 0, 13.92, 21, 26, 1, .08, iron));
  for (const x of [11.3, 12.5]) p.push(box("高检修廊真实登梯孔两侧的连续钢栏", x, 13.92, 21.5, .08, 1, .8, iron));
  p.push(box("检修廊登梯孔前端真正保留后方上岸出口的钢栏", 11.9, 13.92, 21.1, 1.2, 1, .08, iron));
  const rigging: SolidBox[] = [];
  for (const x of [-10, -5, 0, 5, 10]) rigging.push({ center: [x, 15.795, 21.2], size: [.06, 5.25, .06] });
  for (const z of [14, 18]) {
    p.push(box("高台塔内真正跨越舞台上方的独立吊景长杆", 0, 14.5, z, 24, .12, .12, iron));
    for (const x of [-10, 10]) rigging.push({ center: [x, 16.46, z], size: [.05, 3.92, .05] });
  }
  for (const x of [11.5, 12.3]) p.push(box("后台由舞台面通到高廊洞口并延伸为扶手的固定直梯侧杆", x, 7.92, 21.5, .08, 13, .1, iron));
  for (let i = 1; i <= 40; i++) rigging.push({ center: [11.9, 1.42 + i * .3, 21.5], size: [.8, .08, .1] });
  for (let start = 0; start < rigging.length; start += 20) p.push(boxesMesh("后台悬承检修廊与吊景杆的连续吊杆及固定登梯横档", iron, rigging.slice(start, start + 20)));
  for (let start = 0; start < stairPosts.length; start += 20) p.push(boxesMesh("前厅长阶与后排接入阶两侧真正落到踏面的木扶栏立杆", wood, stairPosts.slice(start, start + 20)));
  return p;
}
